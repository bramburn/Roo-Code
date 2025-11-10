import { EventEmitter } from "events"
import type { CircuitBreakerState, CircuitBreakerConfig, CircuitBreakerMetrics } from "./types"

/**
 * Circuit breaker implementation to prevent infinite retry loops
 * Automatically opens after consecutive failures and closes after successful recovery
 */
export class CircuitBreaker extends EventEmitter {
	private state: CircuitBreakerState = "closed"
	private failureCount = 0
	private successCount = 0
	private lastFailureTime?: number
	private lastSuccessTime?: number
	private stateChangeTime = Date.now()
	private recoveryTimeout?: NodeJS.Timeout
	private halfOpenTimeout?: NodeJS.Timeout

	private readonly config: CircuitBreakerConfig
	private readonly metrics: CircuitBreakerMetrics = {
		totalRequests: 0,
		successfulRequests: 0,
		failedRequests: 0,
		failureRate: 0,
	}

	constructor(config: CircuitBreakerConfig) {
		super()
		this.config = {
			failureThreshold: config.failureThreshold ?? 5,
			recoveryTimeout: config.recoveryTimeout ?? 60000, // 1 minute
			halfOpenTimeout: config.halfOpenTimeout ?? 30000, // 30 seconds
			successThreshold: config.successThreshold ?? 2,
		}
	}

	/**
	 * Execute an operation through the circuit breaker
	 * @param operation - Function to execute
	 * @returns Promise that resolves with the operation result or rejects if circuit is open
	 */
	async execute<T>(operation: () => Promise<T>): Promise<T> {
		this.metrics.totalRequests++

		if (this.state === "open") {
			if (this.shouldAttemptReset()) {
				this.transitionToHalfOpen()
			} else {
				const error = new Error(`Circuit breaker is open for ${this.getTimeInCurrentState()}ms`)
				this.metrics.failedRequests++
				this.updateFailureRate()
				throw error
			}
		}

		try {
			const result = await operation()
			this.onSuccess()
			return result
		} catch (error) {
			this.onFailure()
			throw error
		}
	}

	/**
	 * Get current circuit breaker state
	 * @returns Current state
	 */
	getState(): CircuitBreakerState {
		return this.state
	}

	/**
	 * Get current configuration
	 * @returns Current configuration
	 */
	getConfig(): CircuitBreakerConfig {
		return { ...this.config }
	}

	/**
	 * Get current metrics
	 * @returns Current metrics
	 */
	getMetrics(): CircuitBreakerMetrics {
		return {
			...this.metrics,
			lastFailureTime: this.lastFailureTime,
			lastSuccessTime: this.lastSuccessTime,
		}
	}

	/**
	 * Reset circuit breaker to closed state
	 */
	reset(): void {
		this.clearTimeouts()
		this.transitionTo("closed")
		this.failureCount = 0
		this.successCount = 0
		this.stateChangeTime = Date.now()
	}

	/**
	 * Force circuit breaker to open state
	 * @param reason - Reason for forcing open
	 */
	forceOpen(reason?: string): void {
		this.clearTimeouts()
		this.transitionTo("open")
		this.lastFailureTime = Date.now()
		console.warn(`[CircuitBreaker] Forced open: ${reason || "Manual override"}`)
	}

	/**
	 * Check if circuit breaker allows execution
	 * @returns Whether execution is allowed
	 */
	canExecute(): boolean {
		return this.state === "closed" || this.state === "half-open"
	}

	/**
	 * Get time spent in current state
	 * @returns Time in milliseconds
	 */
	getTimeInCurrentState(): number {
		return Date.now() - this.stateChangeTime
	}

	/**
	 * Handle successful operation
	 */
	private onSuccess(): void {
		this.metrics.successfulRequests++
		this.lastSuccessTime = Date.now()
		this.updateFailureRate()

		switch (this.state) {
			case "closed":
				this.failureCount = 0
				break

			case "half-open":
				this.successCount++
				if (this.successCount >= this.config.successThreshold) {
					this.transitionToClosed()
				}
				break
		}
	}

	/**
	 * Handle failed operation
	 */
	private onFailure(): void {
		this.metrics.failedRequests++
		this.lastFailureTime = Date.now()
		this.updateFailureRate()

		switch (this.state) {
			case "closed":
				this.failureCount++
				if (this.failureCount >= this.config.failureThreshold) {
					this.transitionToOpen()
				}
				break

			case "half-open":
				this.transitionToOpen()
				break
		}
	}

	/**
	 * Transition to closed state
	 */
	private transitionToClosed(): void {
		this.clearTimeouts()
		this.transitionTo("closed")
		this.failureCount = 0
		this.successCount = 0
	}

	/**
	 * Transition to open state
	 */
	private transitionToOpen(): void {
		this.clearTimeouts()
		this.transitionTo("open")

		// Set recovery timeout to transition to half-open
		this.recoveryTimeout = setTimeout(() => {
			this.transitionToHalfOpen()
		}, this.config.recoveryTimeout)
	}

	/**
	 * Transition to half-open state
	 */
	private transitionToHalfOpen(): void {
		this.clearTimeouts()
		this.transitionTo("half-open")
		this.successCount = 0

		// Set timeout to force back to open if no success
		this.halfOpenTimeout = setTimeout(() => {
			if (this.state === "half-open") {
				this.transitionToOpen()
			}
		}, this.config.halfOpenTimeout)
	}

	/**
	 * Transition to a new state and emit event
	 * @param newState - New state to transition to
	 */
	private transitionTo(newState: CircuitBreakerState): void {
		const oldState = this.state
		this.state = newState
		this.stateChangeTime = Date.now()

		this.emit("state-change", {
			oldState,
			newState,
			timestamp: this.stateChangeTime,
			reason: this.getStateTransitionReason(oldState, newState),
		})
	}

	/**
	 * Check if circuit should attempt reset from open to half-open
	 * @returns Whether reset should be attempted
	 */
	private shouldAttemptReset(): boolean {
		return Boolean(this.lastFailureTime && Date.now() - this.lastFailureTime >= this.config.recoveryTimeout)
	}

	/**
	 * Clear all active timeouts
	 */
	private clearTimeouts(): void {
		if (this.recoveryTimeout) {
			clearTimeout(this.recoveryTimeout)
			this.recoveryTimeout = undefined
		}

		if (this.halfOpenTimeout) {
			clearTimeout(this.halfOpenTimeout)
			this.halfOpenTimeout = undefined
		}
	}

	/**
	 * Update failure rate metric
	 */
	private updateFailureRate(): void {
		this.metrics.failureRate =
			this.metrics.totalRequests > 0 ? this.metrics.failedRequests / this.metrics.totalRequests : 0
	}

	/**
	 * Get human-readable reason for state transition
	 * @param fromState - Previous state
	 * @param toState - New state
	 * @returns Transition reason
	 */
	private getStateTransitionReason(fromState: CircuitBreakerState, toState: CircuitBreakerState): string {
		switch (toState) {
			case "closed":
				return "Circuit recovered after successful operations"
			case "open":
				if (fromState === "closed") {
					return `Failure threshold (${this.config.failureThreshold}) reached`
				} else if (fromState === "half-open") {
					return "Failed to recover in half-open state"
				}
				return "Circuit opened"
			case "half-open":
				return "Attempting recovery after timeout"
			default:
				return "Unknown transition"
		}
	}

	/**
	 * Get health status of circuit breaker
	 * @returns Health status object
	 */
	getHealth(): {
		status: "healthy" | "degraded" | "unhealthy"
		state: CircuitBreakerState
		failureRate: number
		timeInState: number
		recommendation: string
	} {
		const failureRate = this.metrics.failureRate
		const timeInState = this.getTimeInCurrentState()

		let status: "healthy" | "degraded" | "unhealthy"
		let recommendation: string

		if (this.state === "closed" && failureRate < 0.1) {
			status = "healthy"
			recommendation = "Circuit is operating normally"
		} else if (this.state === "closed" && failureRate < 0.3) {
			status = "degraded"
			recommendation = "Monitor failure rate, consider reducing load"
		} else if (this.state === "half-open") {
			status = "degraded"
			recommendation = "Circuit is testing recovery, monitor closely"
		} else {
			status = "unhealthy"
			recommendation = "Circuit is open, reduce load and investigate root cause"
		}

		return {
			status,
			state: this.state,
			failureRate,
			timeInState,
			recommendation,
		}
	}

	/**
	 * Dispose of circuit breaker resources
	 */
	dispose(): void {
		this.clearTimeouts()
		this.removeAllListeners()
	}
}
