import { EventEmitter } from "events"
import type {
	RetrySettings,
	RetryContext,
	RetryState,
	RetryAttempt,
	RetryAttemptResult,
	RetryableToolExecution,
	RetryEngineEvents,
	RetryEngineConfig,
	ErrorClassification,
	CircuitBreakerState,
} from "./types"
import { BackoffStrategy } from "./BackoffStrategy"
import { CircuitBreaker } from "./CircuitBreaker"
import { RetryStateManager } from "./RetryStateManager"
import { RetryLogger } from "./RetryLogger"
import { RetryStorage } from "./RetryStorage"
import { RetryQueue } from "./RetryQueue"
import { RetryFactory } from "./RetryFactory"

/**
 * Main retry engine that orchestrates all retry operations
 * Provides unified interface for tool call retry with comprehensive features
 */
export class RetryEngine extends EventEmitter {
	private readonly config: RetryEngineConfig
	private readonly stateManager: RetryStateManager
	private readonly logger: RetryLogger
	private readonly storage: RetryStorage
	private readonly queue: RetryQueue
	private readonly circuitBreakers = new Map<string, CircuitBreaker>()

	constructor(config: Partial<RetryEngineConfig> = {}) {
		super()

		// Initialize configuration with defaults
		this.config = {
			defaultSettings: {
				enableRetry: false,
				maxRetryAttempts: 3,
				baseDelayMs: 1000,
				maxDelayMs: 30000,
				backoffMultiplier: 2,
				jitterFactor: 0.1,
				enableContextOptimization: true,
				enableManualRetry: true,
				retryTimeoutMs: 60000,
			},
			maxConcurrentRetries: 5,
			queueProcessingInterval: 100,
			enablePersistence: true,
			storageRetentionPeriod: 24 * 60 * 60 * 1000, // 24 hours
			enableDetailedLogging: true,
			maxLogEntries: 1000,
			...config,
		}

		// Initialize components
		this.storage = new RetryStorage(undefined, this.config.storageRetentionPeriod, this.config.enablePersistence)
		this.logger = new RetryLogger(this.config.maxLogEntries, this.config.enableDetailedLogging)
		this.stateManager = new RetryStateManager(this.config.maxConcurrentRetries, this.storage)
		this.queue = new RetryQueue(this.config.maxConcurrentRetries)

		// Setup event handlers
		this.setupEventHandlers()
	}

	/**
	 * Execute a tool with retry logic
	 * @param execution - Tool execution details
	 * @returns Promise that resolves with the tool result
	 */
	async executeWithRetry(execution: RetryableToolExecution): Promise<any> {
		// Create retry context
		const context = RetryFactory.createRetryContext(execution, this.config.defaultSettings)

		// Check if retry is enabled
		if (!context.config.enableRetry) {
			return this.executeDirect(execution, context)
		}

		// Get or create circuit breaker for this tool
		const circuitBreaker = this.getCircuitBreaker(execution.toolName, context.config)

		try {
			// Execute through circuit breaker
			const result = await circuitBreaker.execute(async () => {
				return this.executeRetryLoop(context, execution)
			})

			this.logger.info(context.id, execution.toolName, "Tool execution completed successfully")
			return result
		} catch (error) {
			this.logger.error(context.id, execution.toolName, "Tool execution failed", error as Error)
			throw error
		}
	}

	/**
	 * Execute a tool without retry (direct execution)
	 * @param execution - Tool execution details
	 * @param context - Retry context
	 * @returns Direct execution result
	 */
	private async executeDirect(execution: RetryableToolExecution, context: RetryContext): Promise<any> {
		this.logger.info(context.id, execution.toolName, "Executing tool without retry")

		const startTime = Date.now()
		try {
			const result = await execution.execute(execution.params)
			const duration = Date.now() - startTime

			this.emit("retry-success", context, result, 1)
			return result
		} catch (error) {
			const duration = Date.now() - startTime
			this.logger.error(context.id, execution.toolName, "Direct execution failed", error as Error, { duration })
			this.emit("retry-failed", context, error as Error, 1)
			throw error
		}
	}

	/**
	 * Execute retry loop for a tool
	 * @param context - Retry context
	 * @param execution - Tool execution details
	 * @returns Final result after retry attempts
	 */
	private async executeRetryLoop(context: RetryContext, execution: RetryableToolExecution): Promise<any> {
		// Create retry state
		const retryState = this.stateManager.createRetryState(context, new Error("Initial execution"))

		this.emit("retry-start", context, retryState)
		this.logger.info(context.id, execution.toolName, "Starting retry loop", {
			maxAttempts: context.config.maxRetryAttempts,
			config: context.config,
		})

		let lastError: Error | undefined

		try {
			// Execute retry attempts
			for (let attempt = 0; attempt < context.config.maxRetryAttempts; attempt++) {
				// Check if retry was cancelled
				if (retryState.isCancelled) {
					throw new Error("Retry was cancelled")
				}

				// Calculate delay for this attempt
				const delay = attempt === 0 ? 0 : this.calculateDelay(context, attempt)

				if (delay > 0) {
					this.logger.debug(
						context.id,
						execution.toolName,
						`Waiting ${delay}ms before attempt ${attempt + 1}`,
					)
					await this.delay(delay)
				}

				// Execute attempt
				const attemptResult = await this.executeAttempt(context, execution, attempt, retryState)

				// Update retry state
				const shouldContinue = this.stateManager.updateRetryState(context.id, attemptResult)

				if (!shouldContinue) {
					// Retry completed (either success or max attempts reached)
					if (attemptResult.result.success) {
						this.logger.logRetryCompletion(
							context.id,
							execution.toolName,
							attempt + 1,
							true,
							Date.now() - retryState.startTime,
						)
						this.emit("retry-success", context, attemptResult.result.data, attempt + 1)
						return attemptResult.result.data
					} else {
						lastError = attemptResult.error || new Error("Retry failed")
						this.logger.logRetryCompletion(
							context.id,
							execution.toolName,
							attempt + 1,
							false,
							Date.now() - retryState.startTime,
						)
						this.emit("retry-failed", context, lastError, attempt + 1)
						throw lastError
					}
				}

				// Continue to next attempt
				lastError = attemptResult.error
			}

			// Max attempts reached without success
			throw lastError || new Error("Max retry attempts reached")
		} catch (error) {
			// Cancel retry state if still active
			if (retryState.isActive) {
				this.stateManager.cancelRetry(context.id, "Retry loop completed")
			}
			throw error
		}
	}

	/**
	 * Execute a single retry attempt
	 * @param context - Retry context
	 * @param execution - Tool execution details
	 * @param attemptNumber - Attempt number (0-based)
	 * @param retryState - Current retry state
	 * @returns Attempt result
	 */
	private async executeAttempt(
		context: RetryContext,
		execution: RetryableToolExecution,
		attemptNumber: number,
		retryState: RetryState,
	): Promise<RetryAttempt> {
		const startTime = Date.now()

		this.logger.logAttemptStart(context.id, execution.toolName, attemptNumber, retryState.currentDelay)
		this.emit("retry-attempt", context, {
			attempt: attemptNumber + 1,
			timestamp: startTime,
			delay: retryState.currentDelay,
			result: { success: false, shouldRetry: true }, // Will be updated
		})

		try {
			// Set timeout for this attempt
			const timeout = context.config.retryTimeoutMs || 60000

			const result = await Promise.race([
				execution.execute(execution.params),
				new Promise<never>((_, reject) =>
					setTimeout(() => reject(new Error(`Attempt timeout after ${timeout}ms`)), timeout),
				),
			])

			const duration = Date.now() - startTime
			const attemptResult: RetryAttempt = {
				attempt: attemptNumber + 1,
				timestamp: startTime,
				delay: retryState.currentDelay,
				result: {
					success: true,
					shouldRetry: false,
					data: result,
				},
				duration,
			}

			this.logger.logAttemptSuccess(context.id, execution.toolName, attemptNumber + 1, duration)
			return attemptResult
		} catch (error) {
			const duration = Date.now() - startTime
			const errorObj = error as Error

			// Classify error to determine retry strategy
			const classification = RetryFactory.classifyError(errorObj)

			const attemptResult: RetryAttempt = {
				attempt: attemptNumber + 1,
				timestamp: startTime,
				delay: retryState.currentDelay,
				result: {
					success: false,
					shouldRetry: classification.isRetryable && attemptNumber < context.config.maxRetryAttempts - 1,
					retryReason: !classification.isRetryable ? classification.category : undefined,
				},
				error: errorObj,
				duration,
			}

			this.logger.logAttemptFailure(context.id, execution.toolName, attemptNumber + 1, errorObj, duration)
			return attemptResult
		}
	}

	/**
	 * Calculate delay for retry attempt
	 * @param context - Retry context
	 * @param attemptNumber - Attempt number (0-based)
	 * @returns Delay in milliseconds
	 */
	private calculateDelay(context: RetryContext, attemptNumber: number): number {
		const backoffStrategy = RetryFactory.createBackoffStrategy(context.config)
		return backoffStrategy.calculateDelay(attemptNumber)
	}

	/**
	 * Get or create circuit breaker for a tool
	 * @param toolName - Tool name
	 * @param config - Retry configuration
	 * @returns Circuit breaker instance
	 */
	private getCircuitBreaker(toolName: string, config: RetrySettings): CircuitBreaker {
		if (!this.circuitBreakers.has(toolName)) {
			const circuitBreaker = RetryFactory.createCircuitBreaker(toolName, config)

			// Setup event handlers
			circuitBreaker.on("state-change", (event) => {
				this.logger.logCircuitBreakerStateChange(toolName, event.oldState, event.newState, event.reason)
				this.emit("circuit-breaker-state-change", toolName, event.oldState, event.newState)
			})

			this.circuitBreakers.set(toolName, circuitBreaker)
		}

		return this.circuitBreakers.get(toolName)!
	}

	/**
	 * Setup event handlers for components
	 */
	private setupEventHandlers(): void {
		// State manager events
		this.stateManager.on("state-created", (event) => {
			this.logger.debug(event.retryId, event.state.toolName, "Retry state created")
		})

		this.stateManager.on("state-updated", (event) => {
			this.logger.debug(event.retryId, event.state.toolName, "Retry state updated", {
				currentAttempt: event.state.currentAttempt,
				nextRetryTime: event.nextRetryTime,
			})
		})

		this.stateManager.on("state-completed", (event) => {
			this.logger.debug(event.retryId, event.state.toolName, "Retry state completed", {
				success: event.success,
				totalAttempts: event.finalAttempt.attempt,
			})
		})

		this.stateManager.on("state-cancelled", (event) => {
			this.logger.info(event.retryId, event.state.toolName, "Retry cancelled", {
				reason: event.reason,
			})
			this.emit("retry-cancelled", event.state, event.reason)
		})

		// Queue events
		this.queue.on("item-queued", (item) => {
			this.logger.debug(item.id, item.context.toolName, "Item queued for retry")
		})

		this.queue.on("item-started", (item) => {
			this.logger.debug(item.id, item.context.toolName, "Retry execution started")
		})

		this.queue.on("item-completed", (event) => {
			if (event.success) {
				this.logger.debug(event.item.id, event.item.context.toolName, "Retry execution completed", {
					duration: event.duration,
				})
			} else {
				this.logger.warn(event.item.id, event.item.context.toolName, "Retry execution failed", {
					error: event.error?.message,
					duration: event.duration,
				})
			}
		})

		this.queue.on("item-cancelled", (item) => {
			this.logger.info(item.id, item.context.toolName, "Retry cancelled")
		})

		// Logger events
		this.logger.on("log", (entry) => {
			// Forward log events if needed
			this.emit("log", entry)
		})

		// Cleanup old storage entries periodically
		setInterval(
			async () => {
				await this.storage.cleanup()
			},
			60 * 60 * 1000,
		) // Every hour
	}

	/**
	 * Delay execution for specified time
	 * @param ms - Milliseconds to delay
	 * @returns Promise that resolves after delay
	 */
	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms))
	}

	/**
	 * Get current engine statistics
	 * @returns Engine statistics
	 */
	getStatistics(): {
		activeRetries: number
		queueStatus: any
		circuitBreakers: Record<string, any>
		storageStats: any
		logStats: any
	} {
		return {
			activeRetries: this.stateManager.getRetryStatistics().totalActive,
			queueStatus: this.queue.getStatus(),
			circuitBreakers: Object.fromEntries(
				Array.from(this.circuitBreakers.entries()).map(([name, cb]) => [
					name,
					{
						state: cb.getState(),
						metrics: cb.getMetrics(),
						health: cb.getHealth(),
					},
				]),
			),
			storageStats: this.storage.getStorageStats(),
			logStats: this.logger.getStatistics(),
		}
	}

	/**
	 * Cancel all active retries
	 * @param reason - Cancellation reason
	 */
	cancelAllRetries(reason: string = "Manual cancellation"): void {
		const activeStates = this.stateManager.getActiveRetryStates()
		for (const state of activeStates) {
			this.stateManager.cancelRetry(state.id, reason)
		}

		this.queue.clearQueue(true)
		this.logger.info("engine", "retry-engine", "All retries cancelled", { reason })
	}

	/**
	 * Pause retry processing
	 */
	pause(): void {
		this.queue.pause()
		this.logger.info("engine", "retry-engine", "Retry engine paused")
	}

	/**
	 * Resume retry processing
	 */
	resume(): void {
		this.queue.resume()
		this.logger.info("engine", "retry-engine", "Retry engine resumed")
	}

	/**
	 * Update engine configuration
	 * @param newConfig - Partial configuration to update
	 */
	updateConfig(newConfig: Partial<RetryEngineConfig>): void {
		Object.assign(this.config, newConfig)

		// Update dependent components
		this.queue.updateMaxConcurrentRetries(this.config.maxConcurrentRetries)

		this.logger.info("engine", "retry-engine", "Configuration updated", { newConfig })
	}

	/**
	 * Get current configuration
	 * @returns Current engine configuration
	 */
	getConfig(): RetryEngineConfig {
		return { ...this.config }
	}

	/**
	 * Export engine state
	 * @returns JSON string of engine state
	 */
	async exportState(): Promise<string> {
		const state = {
			config: this.config,
			statistics: this.getStatistics(),
			storage: await this.storage.exportStorage(),
			logs: this.logger.exportLogs(),
			timestamp: Date.now(),
		}

		return JSON.stringify(state, null, 2)
	}

	/**
	 * Dispose of engine resources
	 */
	async dispose(): Promise<void> {
		// Cancel all retries
		this.cancelAllRetries("Engine disposal")

		// Dispose components
		this.queue.dispose()
		await this.stateManager.dispose()

		// Dispose circuit breakers
		for (const circuitBreaker of this.circuitBreakers.values()) {
			circuitBreaker.dispose()
		}
		this.circuitBreakers.clear()

		// Remove all listeners
		this.removeAllListeners()

		this.logger.info("engine", "retry-engine", "Retry engine disposed")
	}
}
