import type {
	RetrySettings,
	RetryContext,
	BackoffConfig,
	CircuitBreakerConfig,
	ErrorClassification,
	RetryableToolExecution,
} from "./types"
import { BackoffStrategy } from "./BackoffStrategy"
import { CircuitBreaker } from "./CircuitBreaker"

/**
 * Factory for creating retry components with different configurations
 * Provides convenient methods for creating common retry patterns
 */
export class RetryFactory {
	/**
	 * Create a backoff strategy from retry settings
	 * @param settings - Retry settings
	 * @returns Configured backoff strategy
	 */
	static createBackoffStrategy(settings: RetrySettings): BackoffStrategy {
		return new BackoffStrategy({
			baseDelay: settings.baseDelayMs || 1000,
			maxDelay: settings.maxDelayMs || 30000,
			multiplier: settings.backoffMultiplier || 2,
			jitterFactor: settings.jitterFactor || 0.1,
			maxAttempts: settings.maxRetryAttempts || 3,
		})
	}

	/**
	 * Create a circuit breaker from retry settings
	 * @param toolName - Tool name for the circuit breaker
	 * @param settings - Retry settings
	 * @returns Configured circuit breaker
	 */
	static createCircuitBreaker(toolName: string, settings: RetrySettings): CircuitBreaker {
		return new CircuitBreaker({
			failureThreshold: Math.max(3, Math.floor((settings.maxRetryAttempts || 3) * 1.5)),
			recoveryTimeout: Math.max(30000, (settings.maxDelayMs || 30000) * 2),
			halfOpenTimeout: Math.max(15000, settings.maxDelayMs || 30000),
			successThreshold: 2,
		})
	}

	/**
	 * Create a retry context from tool execution
	 * @param execution - Tool execution details
	 * @param defaultSettings - Default retry settings
	 * @returns Retry context
	 */
	static createRetryContext(execution: RetryableToolExecution, defaultSettings: RetrySettings): RetryContext {
		return {
			id: RetryFactory.generateContextId(),
			toolName: execution.toolName,
			toolParams: execution.params,
			config: {
				...defaultSettings,
				...execution.retryConfig,
			},
			taskId: execution.context?.taskId,
			executionContext: execution.context,
		}
	}

	/**
	 * Classify an error for retry decisions
	 * @param error - Error to classify
	 * @returns Error classification
	 */
	static classifyError(error: Error): ErrorClassification {
		const message = error.message.toLowerCase()
		const stack = error.stack?.toLowerCase() || ""

		// Network errors
		if (
			message.includes("network") ||
			message.includes("connection") ||
			message.includes("timeout") ||
			message.includes("econnrefused") ||
			message.includes("enotfound") ||
			message.includes("econnreset") ||
			stack.includes("network")
		) {
			return {
				isRetryable: true,
				category: "network",
				severity: "medium",
				backoffStrategy: "exponential",
				maxRetries: 5,
				triggerCircuitBreaker: false,
			}
		}

		// Timeout errors
		if (message.includes("timeout") || message.includes("timed out") || message.includes("time out")) {
			return {
				isRetryable: true,
				category: "timeout",
				severity: "medium",
				backoffStrategy: "exponential",
				maxRetries: 3,
				customDelay: 2000, // Longer delay for timeouts
				triggerCircuitBreaker: false,
			}
		}

		// Rate limit errors
		if (
			message.includes("rate limit") ||
			message.includes("too many requests") ||
			message.includes("quota exceeded") ||
			message.includes("429") ||
			message.includes("throttle")
		) {
			return {
				isRetryable: true,
				category: "rate-limit",
				severity: "high",
				backoffStrategy: "exponential",
				maxRetries: 3,
				customDelay: 5000, // Longer delay for rate limits
				triggerCircuitBreaker: true,
			}
		}

		// Authentication errors
		if (
			message.includes("unauthorized") ||
			message.includes("authentication") ||
			message.includes("401") ||
			message.includes("403") ||
			message.includes("forbidden")
		) {
			return {
				isRetryable: false,
				category: "auth",
				severity: "high",
				backoffStrategy: "none",
				triggerCircuitBreaker: false,
			}
		}

		// Permission errors
		if (
			message.includes("permission denied") ||
			message.includes("access denied") ||
			message.includes("eacces") ||
			message.includes("eperm")
		) {
			return {
				isRetryable: false,
				category: "permission",
				severity: "high",
				backoffStrategy: "none",
				triggerCircuitBreaker: false,
			}
		}

		// Resource errors (file not found, etc.)
		if (
			message.includes("not found") ||
			message.includes("enoent") ||
			message.includes("404") ||
			message.includes("does not exist")
		) {
			return {
				isRetryable: false,
				category: "resource",
				severity: "medium",
				backoffStrategy: "none",
				triggerCircuitBreaker: false,
			}
		}

		// Default classification
		return {
			isRetryable: true,
			category: "unknown",
			severity: "medium",
			backoffStrategy: "exponential",
			maxRetries: 3,
			triggerCircuitBreaker: false,
		}
	}

	/**
	 * Create retry settings for different scenarios
	 */

	/**
	 * Create settings for network operations
	 * @param baseSettings - Base settings to override
	 * @returns Retry settings optimized for network operations
	 */
	static createNetworkSettings(baseSettings?: Partial<RetrySettings>): RetrySettings {
		return {
			enableRetry: true,
			maxRetryAttempts: 5,
			baseDelayMs: 1000,
			maxDelayMs: 30000,
			backoffMultiplier: 2,
			jitterFactor: 0.2,
			enableContextOptimization: true,
			enableManualRetry: true,
			retryTimeoutMs: 60000,
			...baseSettings,
		}
	}

	/**
	 * Create settings for file system operations
	 * @param baseSettings - Base settings to override
	 * @returns Retry settings optimized for file system operations
	 */
	static createFileSystemSettings(baseSettings?: Partial<RetrySettings>): RetrySettings {
		return {
			enableRetry: true,
			maxRetryAttempts: 3,
			baseDelayMs: 500,
			maxDelayMs: 5000,
			backoffMultiplier: 1.5,
			jitterFactor: 0.1,
			enableContextOptimization: false,
			enableManualRetry: true,
			retryTimeoutMs: 30000,
			...baseSettings,
		}
	}

	/**
	 * Create settings for API operations
	 * @param baseSettings - Base settings to override
	 * @returns Retry settings optimized for API operations
	 */
	static createApiSettings(baseSettings?: Partial<RetrySettings>): RetrySettings {
		return {
			enableRetry: true,
			maxRetryAttempts: 3,
			baseDelayMs: 2000,
			maxDelayMs: 60000,
			backoffMultiplier: 2.5,
			jitterFactor: 0.3,
			enableContextOptimization: true,
			enableManualRetry: true,
			retryTimeoutMs: 120000,
			...baseSettings,
		}
	}

	/**
	 * Create settings for quick operations
	 * @param baseSettings - Base settings to override
	 * @returns Retry settings optimized for quick operations
	 */
	static createQuickSettings(baseSettings?: Partial<RetrySettings>): RetrySettings {
		return {
			enableRetry: true,
			maxRetryAttempts: 2,
			baseDelayMs: 100,
			maxDelayMs: 1000,
			backoffMultiplier: 1.5,
			jitterFactor: 0.05,
			enableContextOptimization: false,
			enableManualRetry: true,
			retryTimeoutMs: 5000,
			...baseSettings,
		}
	}

	/**
	 * Create settings for resilient operations
	 * @param baseSettings - Base settings to override
	 * @returns Retry settings optimized for resilience
	 */
	static createResilientSettings(baseSettings?: Partial<RetrySettings>): RetrySettings {
		return {
			enableRetry: true,
			maxRetryAttempts: 10,
			baseDelayMs: 2000,
			maxDelayMs: 120000,
			backoffMultiplier: 3,
			jitterFactor: 0.5,
			enableContextOptimization: true,
			enableManualRetry: true,
			retryTimeoutMs: 300000,
			...baseSettings,
		}
	}

	/**
	 * Validate retry settings
	 * @param settings - Settings to validate
	 * @returns Validation result
	 */
	static validateSettings(settings: RetrySettings): {
		isValid: boolean
		errors: string[]
	} {
		const errors: string[] = []

		// Check basic structure
		if (settings.enableRetry === undefined) {
			errors.push("enableRetry is required")
		}

		if (settings.maxRetryAttempts !== undefined) {
			if (settings.maxRetryAttempts < 1 || settings.maxRetryAttempts > 10) {
				errors.push("maxRetryAttempts must be between 1 and 10")
			}
		}

		if (settings.baseDelayMs !== undefined) {
			if (settings.baseDelayMs < 100 || settings.baseDelayMs > 10000) {
				errors.push("baseDelayMs must be between 100 and 10000")
			}
		}

		if (settings.maxDelayMs !== undefined) {
			if (settings.maxDelayMs < 1000 || settings.maxDelayMs > 300000) {
				errors.push("maxDelayMs must be between 1000 and 300000")
			}
		}

		if (settings.backoffMultiplier !== undefined) {
			if (settings.backoffMultiplier < 1.1 || settings.backoffMultiplier > 5) {
				errors.push("backoffMultiplier must be between 1.1 and 5")
			}
		}

		if (settings.jitterFactor !== undefined) {
			if (settings.jitterFactor < 0 || settings.jitterFactor > 0.5) {
				errors.push("jitterFactor must be between 0 and 0.5")
			}
		}

		if (settings.retryTimeoutMs !== undefined) {
			if (settings.retryTimeoutMs < 5000 || settings.retryTimeoutMs > 300000) {
				errors.push("retryTimeoutMs must be between 5000 and 300000")
			}
		}

		// Check logical consistency
		if (settings.baseDelayMs && settings.maxDelayMs && settings.baseDelayMs > settings.maxDelayMs) {
			errors.push("baseDelayMs cannot be greater than maxDelayMs")
		}

		return {
			isValid: errors.length === 0,
			errors,
		}
	}

	/**
	 * Merge retry settings with defaults
	 * @param settings - Settings to merge
	 * @param defaults - Default settings
	 * @returns Merged settings
	 */
	static mergeSettings(settings: Partial<RetrySettings>, defaults: RetrySettings): RetrySettings {
		const merged = { ...defaults, ...settings }

		// Validate merged settings
		const validation = RetryFactory.validateSettings(merged)
		if (!validation.isValid) {
			console.warn("[RetryFactory] Invalid retry settings detected:", validation.errors)
			// Fall back to defaults for invalid values
			return defaults
		}

		return merged
	}

	/**
	 * Generate unique context ID
	 * @returns Unique ID
	 */
	private static generateContextId(): string {
		return `ctx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
	}

	/**
	 * Get recommended settings for a tool type
	 * @param toolType - Type of tool operation
	 * @param baseSettings - Base settings to override
	 * @returns Recommended retry settings
	 */
	static getRecommendedSettings(
		toolType: "network" | "filesystem" | "api" | "quick" | "resilient",
		baseSettings?: Partial<RetrySettings>,
	): RetrySettings {
		switch (toolType) {
			case "network":
				return RetryFactory.createNetworkSettings(baseSettings)
			case "filesystem":
				return RetryFactory.createFileSystemSettings(baseSettings)
			case "api":
				return RetryFactory.createApiSettings(baseSettings)
			case "quick":
				return RetryFactory.createQuickSettings(baseSettings)
			case "resilient":
				return RetryFactory.createResilientSettings(baseSettings)
			default:
				return RetryFactory.createNetworkSettings(baseSettings)
		}
	}

	/**
	 * Create a retry execution wrapper
	 * @param toolName - Tool name
	 * @param execute - Execution function
	 * @param params - Tool parameters
	 * @param context - Execution context
	 * @param retryConfig - Retry configuration override
	 * @returns Retryable tool execution
	 */
	static createRetryableExecution(
		toolName: string,
		execute: (params: Record<string, any>) => Promise<any>,
		params: Record<string, any>,
		context?: RetryContext["executionContext"],
		retryConfig?: Partial<RetrySettings>,
	): RetryableToolExecution {
		return {
			toolName,
			execute,
			params,
			context,
			retryConfig,
		}
	}
}
