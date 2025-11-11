import { EventEmitter } from "events"
import type { RetryState, RetryContext, RetryAttempt, RetryAttemptResult, ErrorClassification } from "./types"
import { RetryStorage } from "./RetryStorage"
import { BackoffStrategy } from "./BackoffStrategy"

/**
 * Manages retry state across multiple operations
 * Provides centralized state management with persistence and cleanup
 */
export class RetryStateManager extends EventEmitter {
	private readonly activeRetries = new Map<string, RetryState>()
	private readonly backoffStrategies = new Map<string, BackoffStrategy>()
	private readonly storage: RetryStorage
	private readonly maxActiveRetries: number
	private cleanupInterval?: NodeJS.Timeout

	constructor(maxActiveRetries: number = 50, storage?: RetryStorage) {
		super()
		this.maxActiveRetries = maxActiveRetries
		this.storage = storage || new RetryStorage()

		// Start cleanup interval
		this.startCleanupInterval()

		// Load persisted states on startup
		this.loadPersistedStates()
	}

	/**
	 * Create a new retry state
	 * @param context - Retry context
	 * @param originalError - Original error that triggered retry
	 * @returns Created retry state
	 */
	createRetryState(context: RetryContext, originalError: Error): RetryState {
		const retryId = this.generateRetryId()

		// Create backoff strategy for this retry
		const backoffStrategy = new BackoffStrategy({
			baseDelay: context.config.baseDelayMs || 1000,
			maxDelay: context.config.maxDelayMs || 30000,
			multiplier: context.config.backoffMultiplier || 2,
			jitterFactor: context.config.jitterFactor || 0.1,
			maxAttempts: context.config.maxRetryAttempts || 3,
		})

		this.backoffStrategies.set(retryId, backoffStrategy)

		const state: RetryState = {
			id: retryId,
			toolName: context.toolName,
			currentAttempt: 0,
			maxAttempts: context.config.maxRetryAttempts || 3,
			startTime: Date.now(),
			lastAttemptTime: Date.now(),
			nextRetryTime: Date.now(),
			originalError,
			errors: [originalError],
			currentDelay: 0,
			isActive: true,
			isCancelled: false,
		}

		// Add to active retries
		this.activeRetries.set(retryId, state)

		// Persist state
		this.storage.storeState(state, true)

		// Emit event
		this.emit("state-created", { retryId, state, context })

		return state
	}

	/**
	 * Get retry state by ID
	 * @param retryId - Retry ID
	 * @returns Retry state if found
	 */
	getRetryState(retryId: string): RetryState | undefined {
		return this.activeRetries.get(retryId)
	}

	/**
	 * Update retry state after an attempt
	 * @param retryId - Retry ID
	 * @param attempt - Attempt result
	 * @returns Whether retry should continue
	 */
	updateRetryState(retryId: string, attempt: RetryAttempt): boolean {
		const state = this.activeRetries.get(retryId)
		if (!state) {
			return false
		}

		const backoffStrategy = this.backoffStrategies.get(retryId)
		if (!backoffStrategy) {
			return false
		}

		// Update state
		state.currentAttempt = attempt.attempt
		state.lastAttemptTime = attempt.timestamp

		if (attempt.error) {
			state.errors.push(attempt.error)
		}

		// Determine if retry should continue
		const shouldContinue = this.shouldContinueRetry(state, attempt, backoffStrategy)

		if (shouldContinue) {
			// Calculate next retry time
			const nextDelay = backoffStrategy.calculateDelay(state.currentAttempt)
			state.currentDelay = nextDelay
			state.nextRetryTime = Date.now() + nextDelay

			// Persist updated state
			this.storage.storeState(state, true)

			// Emit event
			this.emit("state-updated", {
				retryId,
				state,
				attempt,
				nextRetryTime: state.nextRetryTime,
			})
		} else {
			// Mark as inactive
			state.isActive = false

			// Remove from active retries
			this.activeRetries.delete(retryId)
			this.backoffStrategies.delete(retryId)

			// Remove from storage
			this.storage.removeState(retryId)

			// Emit completion event
			this.emit("state-completed", {
				retryId,
				state,
				finalAttempt: attempt,
				success: attempt.result.success,
			})
		}

		return shouldContinue
	}

	/**
	 * Cancel a retry operation
	 * @param retryId - Retry ID
	 * @param reason - Cancellation reason
	 * @returns Whether retry was found and cancelled
	 */
	cancelRetry(retryId: string, reason?: string): boolean {
		const state = this.activeRetries.get(retryId)
		if (!state) {
			return false
		}

		// Mark as cancelled
		state.isCancelled = true
		state.isActive = false

		// Remove from active retries
		this.activeRetries.delete(retryId)
		this.backoffStrategies.delete(retryId)

		// Remove from storage
		this.storage.removeState(retryId)

		// Emit cancellation event
		this.emit("state-cancelled", {
			retryId,
			state,
			reason: reason || "Manual cancellation",
		})

		return true
	}

	/**
	 * Get all active retry states
	 * @returns Array of active retry states
	 */
	getActiveRetryStates(): RetryState[] {
		return Array.from(this.activeRetries.values())
	}

	/**
	 * Get retry states for a specific tool
	 * @param toolName - Tool name
	 * @returns Array of retry states for the tool
	 */
	getRetryStatesByTool(toolName: string): RetryState[] {
		return Array.from(this.activeRetries.values()).filter((state) => state.toolName === toolName)
	}

	/**
	 * Get retry statistics
	 * @returns Retry statistics
	 */
	getRetryStatistics(): {
		totalActive: number
		byTool: Record<string, number>
		averageAttempts: number
		longestRunning: { retryId: string; duration: number } | undefined
		mostFailed: { retryId: string; failureCount: number } | undefined
	} {
		const states = Array.from(this.activeRetries.values())
		const byTool: Record<string, number> = {}

		let totalAttempts = 0
		let longestRunning: { retryId: string; duration: number } | undefined
		let mostFailed: { retryId: string; failureCount: number } | undefined

		for (const state of states) {
			// Count by tool
			byTool[state.toolName] = (byTool[state.toolName] || 0) + 1

			// Track attempts
			totalAttempts += state.currentAttempt

			// Track longest running
			const duration = Date.now() - state.startTime
			if (!longestRunning || duration > longestRunning.duration) {
				longestRunning = { retryId: state.id, duration }
			}

			// Track most failed
			const failureCount = state.errors.length
			if (!mostFailed || failureCount > mostFailed.failureCount) {
				mostFailed = { retryId: state.id, failureCount }
			}
		}

		const averageAttempts = states.length > 0 ? totalAttempts / states.length : 0

		return {
			totalActive: states.length,
			byTool,
			averageAttempts,
			longestRunning,
			mostFailed,
		}
	}

	/**
	 * Check if retry should continue based on attempt result
	 * @param state - Current retry state
	 * @param attempt - Latest attempt result
	 * @param backoffStrategy - Backoff strategy
	 * @returns Whether retry should continue
	 */
	private shouldContinueRetry(state: RetryState, attempt: RetryAttempt, backoffStrategy: BackoffStrategy): boolean {
		// Check if cancelled
		if (state.isCancelled) {
			return false
		}

		// Check if attempt was successful
		if (attempt.result.success) {
			return false
		}

		// Check if max attempts reached
		if (state.currentAttempt >= state.maxAttempts - 1) {
			return false
		}

		// Check if result indicates no retry
		if (!attempt.result.shouldRetry) {
			return false
		}

		// Check if backoff strategy allows retry
		return backoffStrategy.shouldRetry(state.currentAttempt)
	}

	/**
	 * Load persisted retry states on startup
	 */
	private async loadPersistedStates(): Promise<void> {
		try {
			const persistedStates = await this.storage.getAllActiveStates()

			for (const state of persistedStates) {
				// Check if state is still valid (not too old)
				const age = Date.now() - state.startTime
				const maxAge = 24 * 60 * 60 * 1000 // 24 hours

				if (age > maxAge) {
					// Clean up old state
					await this.storage.removeState(state.id)
					continue
				}

				// Recreate backoff strategy
				const backoffStrategy = new BackoffStrategy({
					baseDelay: state.currentDelay || 1000,
					maxDelay: 30000,
					multiplier: 2,
					jitterFactor: 0.1,
					maxAttempts: state.maxAttempts,
				})

				this.backoffStrategies.set(state.id, backoffStrategy)
				this.activeRetries.set(state.id, state)

				this.emit("state-restored", { retryId: state.id, state })
			}
		} catch (error) {
			console.warn("[RetryStateManager] Failed to load persisted states:", error)
		}
	}

	/**
	 * Start cleanup interval for old states
	 */
	private startCleanupInterval(): void {
		this.cleanupInterval = setInterval(
			() => {
				this.cleanupOldStates()
			},
			5 * 60 * 1000,
		) // Every 5 minutes
	}

	/**
	 * Clean up old or stale retry states
	 */
	private cleanupOldStates(): void {
		const now = Date.now()
		const maxAge = 24 * 60 * 60 * 1000 // 24 hours
		const staleRetries: string[] = []

		for (const [retryId, state] of this.activeRetries.entries()) {
			const age = now - state.startTime

			// Clean up if too old
			if (age > maxAge) {
				staleRetries.push(retryId)
				continue
			}

			// Clean up if inactive for too long (more than 1 hour since last attempt)
			const timeSinceLastAttempt = now - state.lastAttemptTime
			if (timeSinceLastAttempt > 60 * 60 * 1000 && state.currentAttempt > 0) {
				staleRetries.push(retryId)
				continue
			}
		}

		// Remove stale retries
		for (const retryId of staleRetries) {
			this.cancelRetry(retryId, "Stale retry cleanup")
		}

		if (staleRetries.length > 0) {
			this.emit("cleanup", { removedRetries: staleRetries })
		}
	}

	/**
	 * Generate unique retry ID
	 * @returns Unique retry ID
	 */
	private generateRetryId(): string {
		return `retry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
	}

	/**
	 * Get memory usage statistics
	 * @returns Memory usage information
	 */
	getMemoryUsage(): {
		activeRetries: number
		backoffStrategies: number
		estimatedMemoryUsage: number
	} {
		const activeRetries = this.activeRetries.size
		const backoffStrategies = this.backoffStrategies.size

		// Estimate memory usage (rough calculation)
		let estimatedMemoryUsage = 0
		for (const state of this.activeRetries.values()) {
			estimatedMemoryUsage += JSON.stringify(state).length * 2 // Rough estimation
		}

		return {
			activeRetries,
			backoffStrategies,
			estimatedMemoryUsage,
		}
	}

	/**
	 * Dispose of state manager resources
	 */
	async dispose(): Promise<void> {
		// Clear cleanup interval
		if (this.cleanupInterval) {
			clearInterval(this.cleanupInterval)
			this.cleanupInterval = undefined
		}

		// Cancel all active retries
		const retryIds = Array.from(this.activeRetries.keys())
		for (const retryId of retryIds) {
			this.cancelRetry(retryId, "State manager disposal")
		}

		// Clean up storage
		await this.storage.cleanup()

		// Remove all listeners
		this.removeAllListeners()
	}
}
