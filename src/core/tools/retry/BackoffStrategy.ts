import type { BackoffConfig } from "./types"

/**
 * Backoff strategy implementation with exponential backoff and jitter
 * Provides configurable delay calculations for retry attempts
 */
export class BackoffStrategy {
	private readonly config: BackoffConfig

	constructor(config: BackoffConfig) {
		this.config = {
			baseDelay: config.baseDelay ?? 1000,
			maxDelay: config.maxDelay ?? 30000,
			multiplier: config.multiplier ?? 2,
			jitterFactor: config.jitterFactor ?? 0.1,
			maxAttempts: config.maxAttempts ?? 3,
		}
	}

	/**
	 * Calculate delay for a given attempt number
	 * @param attempt - Attempt number (0-based)
	 * @returns Delay in milliseconds
	 */
	calculateDelay(attempt: number): number {
		if (attempt < 0) {
			return 0
		}

		// Calculate exponential backoff
		const exponentialDelay = this.config.baseDelay * Math.pow(this.config.multiplier, attempt)

		// Apply maximum delay limit
		const cappedDelay = Math.min(exponentialDelay, this.config.maxDelay)

		// Apply jitter to prevent thundering herd
		const jitteredDelay = this.applyJitter(cappedDelay)

		return Math.max(0, jitteredDelay)
	}

	/**
	 * Calculate delay with custom jitter factor
	 * @param attempt - Attempt number (0-based)
	 * @param customJitterFactor - Custom jitter factor (0-1)
	 * @returns Delay in milliseconds
	 */
	calculateDelayWithCustomJitter(attempt: number, customJitterFactor: number): number {
		if (attempt < 0) {
			return 0
		}

		const exponentialDelay = this.config.baseDelay * Math.pow(this.config.multiplier, attempt)
		const cappedDelay = Math.min(exponentialDelay, this.config.maxDelay)
		const jitteredDelay = this.applyJitter(cappedDelay, customJitterFactor)

		return Math.max(0, jitteredDelay)
	}

	/**
	 * Get all delays for a sequence of attempts
	 * @param maxAttempts - Maximum number of attempts
	 * @returns Array of delays in milliseconds
	 */
	calculateDelaySequence(maxAttempts?: number): number[] {
		const attempts = maxAttempts ?? this.config.maxAttempts
		const delays: number[] = []

		for (let i = 0; i < attempts - 1; i++) {
			delays.push(this.calculateDelay(i))
		}

		return delays
	}

	/**
	 * Check if retry should be attempted based on attempt count
	 * @param attempt - Current attempt number (0-based)
	 * @returns Whether retry should be attempted
	 */
	shouldRetry(attempt: number): boolean {
		return attempt < this.config.maxAttempts - 1
	}

	/**
	 * Get the total estimated time for all retry attempts
	 * @param maxAttempts - Maximum number of attempts
	 * @returns Total estimated time in milliseconds
	 */
	getTotalEstimatedTime(maxAttempts?: number): number {
		const attempts = maxAttempts ?? this.config.maxAttempts
		const delays = this.calculateDelaySequence(attempts)
		return delays.reduce((sum, delay) => sum + delay, 0)
	}

	/**
	 * Apply jitter to delay to prevent thundering herd problems
	 * @param delay - Base delay in milliseconds
	 * @param jitterFactor - Jitter factor (0-1, defaults to config value)
	 * @returns Jittered delay in milliseconds
	 */
	private applyJitter(delay: number, jitterFactor?: number): number {
		const factor = jitterFactor ?? this.config.jitterFactor

		if (factor <= 0) {
			return delay
		}

		// Calculate jitter range (±factor * delay)
		const jitterRange = delay * factor
		const jitter = (Math.random() - 0.5) * 2 * jitterRange

		return delay + jitter
	}

	/**
	 * Create a backoff strategy for immediate retry (no delay)
	 * @param maxAttempts - Maximum number of attempts
	 * @returns BackoffStrategy configured for immediate retry
	 */
	static immediate(maxAttempts: number = 3): BackoffStrategy {
		return new BackoffStrategy({
			baseDelay: 0,
			maxDelay: 0,
			multiplier: 1,
			jitterFactor: 0,
			maxAttempts,
		})
	}

	/**
	 * Create a backoff strategy with linear backoff
	 * @param baseDelay - Base delay in milliseconds
	 * @param maxDelay - Maximum delay in milliseconds
	 * @param maxAttempts - Maximum number of attempts
	 * @returns BackoffStrategy configured for linear backoff
	 */
	static linear(baseDelay: number, maxDelay: number, maxAttempts: number = 3): BackoffStrategy {
		return new BackoffStrategy({
			baseDelay,
			maxDelay,
			multiplier: 1, // Linear growth
			jitterFactor: 0.1,
			maxAttempts,
		})
	}

	/**
	 * Create a backoff strategy with exponential backoff
	 * @param baseDelay - Base delay in milliseconds
	 * @param maxDelay - Maximum delay in milliseconds
	 * @param multiplier - Backoff multiplier
	 * @param jitterFactor - Jitter factor (0-1)
	 * @param maxAttempts - Maximum number of attempts
	 * @returns BackoffStrategy configured for exponential backoff
	 */
	static exponential(
		baseDelay: number,
		maxDelay: number,
		multiplier: number = 2,
		jitterFactor: number = 0.1,
		maxAttempts: number = 3,
	): BackoffStrategy {
		return new BackoffStrategy({
			baseDelay,
			maxDelay,
			multiplier,
			jitterFactor,
			maxAttempts,
		})
	}

	/**
	 * Get current configuration
	 * @returns Current backoff configuration
	 */
	getConfig(): BackoffConfig {
		return { ...this.config }
	}

	/**
	 * Update configuration
	 * @param newConfig - Partial configuration to update
	 */
	updateConfig(newConfig: Partial<BackoffConfig>): void {
		Object.assign(this.config, newConfig)
	}

	/**
	 * Validate configuration
	 * @returns Whether configuration is valid
	 */
	validateConfig(): boolean {
		const { baseDelay, maxDelay, multiplier, jitterFactor, maxAttempts } = this.config

		return (
			baseDelay >= 0 &&
			maxDelay >= 0 &&
			maxDelay >= baseDelay &&
			multiplier >= 1 &&
			jitterFactor >= 0 &&
			jitterFactor <= 1 &&
			maxAttempts >= 1
		)
	}

	/**
	 * Get human-readable description of the strategy
	 * @returns Description string
	 */
	getDescription(): string {
		const { baseDelay, maxDelay, multiplier, jitterFactor, maxAttempts } = this.config

		if (baseDelay === 0) {
			return `Immediate retry (max ${maxAttempts} attempts)`
		}

		if (multiplier === 1) {
			return `Linear backoff: ${baseDelay}ms base, ${maxDelay}ms max, ${maxAttempts} attempts, ${(jitterFactor * 100).toFixed(0)}% jitter`
		}

		return `Exponential backoff: ${baseDelay}ms base, ${maxDelay}ms max, ${multiplier}x multiplier, ${maxAttempts} attempts, ${(jitterFactor * 100).toFixed(0)}% jitter`
	}
}
