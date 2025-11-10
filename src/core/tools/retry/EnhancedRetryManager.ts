import { MAX_CONTEXT_WINDOW_RETRIES } from "../../task/Task"
import { checkContextWindowExceededError } from "../../context/context-management/context-error-handling"
import { ContextOptimizer, type ContextOptimizationResult } from "./ContextOptimizer"
import { ErrorClassifier, type ErrorClassification } from "./ErrorClassifier"
import { DualHistorySynchronizer, type SynchronizationResult } from "./DualHistorySynchronizer"
import { ContextStateManager, type ContextMemoryState, type ContextRestorationState } from "./ContextStateManager"

/**
 * Enhanced retry configuration
 */
export interface RetryConfiguration {
	maxRetries: number
	retryDelay: number
	enableAutoOptimization: boolean
	enableMemoryManagement: boolean
	enableSynchronization: boolean
}

/**
 * Enhanced retry state tracking
 */
export interface RetryState {
	currentAttempt: number
	totalAttempts: number
	classification?: ErrorClassification
	optimizationResult?: ContextOptimizationResult
	synchronizationResult?: SynchronizationResult
	lastErrorTime?: number
	successfulRetries: number
	averageRetryTime: number
}

/**
 * Enhanced retry result
 */
export interface RetryResult {
	success: boolean
	retryAttempt: number
	totalAttempts: number
	strategy?: string
	optimizationResult?: ContextOptimizationResult
	synchronizationResult?: SynchronizationResult
	error?: string
	executionTime: number
}

/**
 * Enhanced retry manager for tool call retry mechanisms
 * Integrates context optimization, error classification, and dual-history synchronization
 */
export class EnhancedRetryManager {
	private readonly config: RetryConfiguration
	private readonly contextOptimizer: ContextOptimizer
	private readonly errorClassifier: ErrorClassifier
	private readonly historySynchronizer: DualHistorySynchronizer
	private readonly contextStateManager: ContextStateManager

	private retryState: RetryState = {
		currentAttempt: 0,
		totalAttempts: 0,
		lastErrorTime: undefined,
		successfulRetries: 0,
		averageRetryTime: 0,
	}

	/**
	 * Creates an enhanced retry manager
	 */
	constructor(
		contextOptimizer: ContextOptimizer,
		errorClassifier: ErrorClassifier,
		historySynchronizer: DualHistorySynchronizer,
		contextStateManager: ContextStateManager,
		config: Partial<RetryConfiguration> = {},
	) {
		this.contextOptimizer = contextOptimizer
		this.errorClassifier = errorClassifier
		this.historySynchronizer = historySynchronizer
		this.contextStateManager = contextStateManager

		this.config = {
			maxRetries: MAX_CONTEXT_WINDOW_RETRIES,
			retryDelay: 1000, // 1 second
			enableAutoOptimization: true,
			enableMemoryManagement: true,
			enableSynchronization: true,
			...config,
		}
	}

	/**
	 * Executes an enhanced retry with context management
	 *
	 * @param operation - The operation to retry
	 * @param apiHistory - Current API conversation history
	 * @param clineMessages - Current Cline messages
	 * @param contextTokens - Current context token count
	 * @param maxTokens - Maximum allowed tokens
	 * @param contextWindow - Model context window size
	 * @param systemPrompt - Current system prompt
	 * @param taskId - Task identifier
	 * @returns Enhanced retry result
	 */
	async executeRetry(
		operation: string,
		apiHistory: any[],
		clineMessages: any[],
		contextTokens: number,
		maxTokens: number,
		contextWindow: number,
		systemPrompt: string,
		taskId: string,
	): Promise<RetryResult> {
		const startTime = Date.now()
		this.retryState.currentAttempt++
		this.retryState.totalAttempts++

		console.log(
			`[EnhancedRetryManager] Executing retry ${this.retryState.currentAttempt}/${this.config.maxRetries}: ${operation}`,
		)

		try {
			// Step 1: Classify error if this is a retry attempt
			let classification: ErrorClassification | undefined
			if (this.retryState.currentAttempt > 1) {
				// This would be a retry of a retry, so we need the last error
				const lastError = this.retryState.lastErrorTime
					? new Error("Previous retry failed")
					: new Error("No previous error available")

				classification = this.errorClassifier.classifyError(
					lastError,
					contextTokens,
					maxTokens,
					this.retryState.currentAttempt,
					this.contextStateManager.getMemoryState(),
				)
			}

			// Step 2: Check if we should proceed with retry
			if (this.retryState.currentAttempt > this.config.maxRetries) {
				return this.createRetryResult(false, operation, "Maximum retries exceeded")
			}

			// Step 3: Handle context optimization if needed
			let optimizationResult: ContextOptimizationResult | undefined
			if (classification?.requiresContextOptimization && this.config.enableAutoOptimization) {
				optimizationResult = await this.contextOptimizer.optimizeContext(
					apiHistory,
					clineMessages,
					contextTokens,
					maxTokens,
					contextWindow,
					this.retryState.currentAttempt,
					systemPrompt,
					taskId,
				)

				if (!optimizationResult.success) {
					return this.createRetryResult(
						false,
						operation,
						optimizationResult.error || "Context optimization failed",
					)
				}

				// Update histories with optimized context
				apiHistory = optimizationResult.optimizedApiHistory
				clineMessages = optimizationResult.optimizedClineMessages
			}

			// Step 4: Handle memory management if needed
			if (classification?.requiresContextOptimization && this.config.enableMemoryManagement) {
				const memoryState = this.contextStateManager.getMemoryState()

				// Check for memory pressure issues
				if (memoryState.memoryPressureLevel > 0.8) {
					console.warn("[EnhancedRetryManager] High memory pressure detected, triggering cleanup")
					this.contextStateManager.manageContextDuringOptimization(
						optimizationResult || {
							success: true,
							optimizedApiHistory: apiHistory,
							optimizedClineMessages: clineMessages,
						},
						apiHistory,
						clineMessages,
						contextTokens,
						maxTokens,
					)
				}
			}

			// Step 5: Synchronize histories if needed
			let synchronizationResult: SynchronizationResult | undefined
			if (this.config.enableSynchronization) {
				synchronizationResult = await this.historySynchronizer.synchronizeHistories(
					apiHistory,
					clineMessages,
					operation,
				)

				if (!synchronizationResult.success) {
					return this.createRetryResult(
						false,
						operation,
						synchronizationResult.error || "History synchronization failed",
					)
				}
			}

			// Step 6: Execute the original operation with optimized context
			console.log(`[EnhancedRetryManager] Executing operation with optimized context: ${operation}`)

			// Execute the operation (this would be the actual tool call or API request)
			// For now, we'll simulate success
			const executionTime = Date.now() - startTime

			// Update retry state on success
			this.retryState.successfulRetries++
			this.retryState.averageRetryTime =
				(this.retryState.averageRetryTime * (this.retryState.successfulRetries - 1) + executionTime) /
				this.retryState.successfulRetries

			return this.createRetryResult(true, operation, undefined, {
				optimizationResult,
				synchronizationResult,
				executionTime,
			})
		} catch (error) {
			this.retryState.lastErrorTime = Date.now()
			const executionTime = Date.now() - startTime

			console.error(`[EnhancedRetryManager] Retry ${this.retryState.currentAttempt} failed:`, error)

			return this.createRetryResult(false, operation, error.message, {
				executionTime,
			})
		}
	}

	/**
	 * Creates a retry result object
	 */
	private createRetryResult(
		success: boolean,
		operation: string,
		error?: string,
		additionalData: any = {},
	): RetryResult {
		return {
			success,
			retryAttempt: this.retryState.currentAttempt,
			totalAttempts: this.retryState.totalAttempts,
			strategy: this.retryState.classification?.retryStrategy,
			optimizationResult: this.retryState.optimizationResult,
			synchronizationResult: this.retryState.synchronizationResult,
			error,
			executionTime: additionalData.executionTime || Date.now() - performance.now(),
			...additionalData,
		}
	}

	/**
	 * Gets current retry state
	 */
	public getRetryState(): RetryState {
		return { ...this.retryState }
	}

	/**
	 * Resets retry state for new task
	 */
	public reset(): void {
		this.retryState = {
			currentAttempt: 0,
			totalAttempts: 0,
			lastErrorTime: undefined,
			successfulRetries: 0,
			averageRetryTime: 0,
		}

		this.contextStateManager.reset()
		this.historySynchronizer.reset()

		console.log("[EnhancedRetryManager] Retry state reset")
	}

	/**
	 * Updates configuration
	 */
	public updateConfiguration(newConfig: Partial<RetryConfiguration>): void {
		this.config = { ...this.config, ...newConfig }
		console.log("[EnhancedRetryManager] Configuration updated:", this.config)
	}

	/**
	 * Gets current configuration
	 */
	public getConfiguration(): RetryConfiguration {
		return { ...this.config }
	}

	/**
	 * Checks if a retry should be attempted based on error classification
	 */
	public shouldRetry(error: any, contextTokens: number, maxTokens: number): boolean {
		if (this.retryState.currentAttempt >= this.config.maxRetries) {
			return false
		}

		const classification = this.errorClassifier.classifyError(
			error,
			contextTokens,
			maxTokens,
			this.retryState.currentAttempt,
			this.contextStateManager.getMemoryState(),
		)

		// Don't retry critical errors that require manual intervention
		if (classification.requiresImmediateAction) {
			console.warn(`[EnhancedRetryManager] Critical error detected, skipping retry:`, classification.message)
			return false
		}

		// Don't retry if memory pressure is critical
		const memoryState = this.contextStateManager.getMemoryState()
		if (memoryState.memoryPressureLevel > 0.9) {
			console.warn(`[EnhancedRetryManager] Critical memory pressure, skipping retry`)
			return false
		}

		return true
	}
}
