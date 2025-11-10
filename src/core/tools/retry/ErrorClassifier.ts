import { checkContextWindowExceededError } from "../../context/context-management/context-error-handling"

/**
 * Error types specific to context management during retry operations
 */
export enum ContextErrorType {
	CONTEXT_WINDOW_EXCEEDED = "context_window_exceeded",
	TOKEN_LIMIT_EXCEEDED = "token_limit_exceeded",
	MEMORY_PRESSURE = "memory_pressure",
	CONTEXT_CORRUPTION = "context_corruption",
	SYNC_FAILURE = "sync_failure",
}

/**
 * Error severity levels for retry decisions
 */
export enum ErrorSeverity {
	LOW = 1, // Minor issues, can retry with current strategy
	MEDIUM = 2, // Moderate issues, may need strategy adjustment
	HIGH = 3, // Critical issues, requires immediate attention
	CRITICAL = 4, // Severe issues, may need task restart
}

/**
 * Retry strategy recommendations based on error classification
 */
export enum RetryStrategy {
	RETRY_WITH_SAME_STRATEGY = "retry_with_same_strategy",
	RETRY_WITH_AGGRESSIVE_STRATEGY = "retry_with_aggressive_strategy",
	RETRY_WITH_CONTEXT_OPTIMIZATION = "retry_with_context_optimization",
	ABORT_RETRY = "abort_retry",
	MANUAL_INTERVENTION = "manual_intervention",
}

/**
 * Error classification result with recommended action
 */
export interface ErrorClassification {
	errorType: ContextErrorType
	severity: ErrorSeverity
	retryStrategy: RetryStrategy
	requiresContextOptimization: boolean
	requiresImmediateAction: boolean
	message: string
	details?: Record<string, any>
}

/**
 * ErrorClassifier provides intelligent error classification for retry mechanisms.
 * Integrates with context management to determine appropriate retry strategies.
 */
export class ErrorClassifier {
	/**
	 * Classifies an error and determines the appropriate retry strategy
	 *
	 * @param error - The error to classify
	 * @param contextTokens - Current context token count
	 * @param maxTokens - Maximum allowed tokens
	 * @param retryCount - Current retry attempt number
	 * @param contextState - Current context state information
	 * @returns Classification result with recommended action
	 */
	static classifyError(
		error: any,
		contextTokens: number,
		maxTokens: number,
		retryCount: number,
		contextState?: {
			apiHistoryLength: number
			clineMessagesLength: number
			lastOptimizationTime?: number
		},
	): ErrorClassification {
		// Check for context window exceeded errors
		if (checkContextWindowExceededError(error)) {
			return this.classifyContextWindowError(error, contextTokens, maxTokens, retryCount)
		}

		// Check for token limit errors
		if (this.isTokenLimitError(error)) {
			return this.classifyTokenLimitError(error, contextTokens, maxTokens, retryCount)
		}

		// Check for memory pressure errors
		if (this.isMemoryPressureError(error)) {
			return this.classifyMemoryPressureError(error, contextTokens, maxTokens, retryCount)
		}

		// Check for context corruption errors
		if (this.isContextCorruptionError(error)) {
			return this.classifyContextCorruptionError(error, contextTokens, maxTokens, retryCount)
		}

		// Check for synchronization failures
		if (this.isSyncFailureError(error)) {
			return this.classifySyncFailureError(error, contextTokens, maxTokens, retryCount)
		}

		// Default classification for unknown errors
		return this.classifyUnknownError(error, retryCount)
	}

	/**
	 * Classifies context window exceeded errors
	 */
	private static classifyContextWindowError(
		error: any,
		contextTokens: number,
		maxTokens: number,
		retryCount: number,
	): ErrorClassification {
		const contextPressure = contextTokens / maxTokens

		let severity: ErrorSeverity
		let retryStrategy: RetryStrategy

		if (retryCount >= 2) {
			severity = ErrorSeverity.HIGH
			retryStrategy = RetryStrategy.ABORT_RETRY
		} else if (contextPressure > 1.2) {
			severity = ErrorSeverity.MEDIUM
			retryStrategy = RetryStrategy.RETRY_WITH_AGGRESSIVE_STRATEGY
		} else {
			severity = ErrorSeverity.LOW
			retryStrategy = RetryStrategy.RETRY_WITH_CONTEXT_OPTIMIZATION
		}

		return {
			errorType: ContextErrorType.CONTEXT_WINDOW_EXCEEDED,
			severity,
			retryStrategy,
			requiresContextOptimization: true,
			requiresImmediateAction: retryCount >= 2,
			message: `Context window exceeded (${Math.round(contextPressure * 100)}% of limit). ${retryCount >= 2 ? "Maximum retries reached." : "Will optimize context and retry."}`,
			details: {
				contextTokens,
				maxTokens,
				contextPressure: Math.round(contextPressure * 100),
				retryCount,
			},
		}
	}

	/**
	 * Classifies token limit errors
	 */
	private static classifyTokenLimitError(
		error: any,
		contextTokens: number,
		maxTokens: number,
		retryCount: number,
	): ErrorClassification {
		const severity = retryCount >= 2 ? ErrorSeverity.HIGH : ErrorSeverity.MEDIUM

		return {
			errorType: ContextErrorType.TOKEN_LIMIT_EXCEEDED,
			severity,
			retryStrategy: RetryStrategy.RETRY_WITH_CONTEXT_OPTIMIZATION,
			requiresContextOptimization: true,
			requiresImmediateAction: false,
			message: `Token limit approached (${Math.round((contextTokens / maxTokens) * 100)}% of limit). Will optimize context.`,
			details: {
				contextTokens,
				maxTokens,
				percentage: Math.round((contextTokens / maxTokens) * 100),
			},
		}
	}

	/**
	 * Classifies memory pressure errors
	 */
	private static classifyMemoryPressureError(
		error: any,
		contextTokens: number,
		maxTokens: number,
		retryCount: number,
	): ErrorClassification {
		const contextPressure = contextTokens / maxTokens

		return {
			errorType: ContextErrorType.MEMORY_PRESSURE,
			severity: contextPressure > 0.8 ? ErrorSeverity.HIGH : ErrorSeverity.MEDIUM,
			retryStrategy: RetryStrategy.RETRY_WITH_AGGRESSIVE_STRATEGY,
			requiresContextOptimization: true,
			requiresImmediateAction: false,
			message: `Memory pressure detected (${Math.round(contextPressure * 100)}% of limit). Will apply aggressive optimization.`,
			details: {
				contextTokens,
				maxTokens,
				contextPressure: Math.round(contextPressure * 100),
			},
		}
	}

	/**
	 * Classifies context corruption errors
	 */
	private static classifyContextCorruptionError(
		error: any,
		contextTokens: number,
		maxTokens: number,
		retryCount: number,
	): ErrorClassification {
		return {
			errorType: ContextErrorType.CONTEXT_CORRUPTION,
			severity: ErrorSeverity.CRITICAL,
			retryStrategy: RetryStrategy.MANUAL_INTERVENTION,
			requiresContextOptimization: false,
			requiresImmediateAction: true,
			message: "Context corruption detected. Manual intervention required.",
			details: {
				contextTokens,
				maxTokens,
				error: error.message,
			},
		}
	}

	/**
	 * Classifies synchronization failure errors
	 */
	private static classifySyncFailureError(
		error: any,
		contextTokens: number,
		maxTokens: number,
		retryCount: number,
	): ErrorClassification {
		return {
			errorType: ContextErrorType.SYNC_FAILURE,
			severity: ErrorSeverity.HIGH,
			retryStrategy: RetryStrategy.MANUAL_INTERVENTION,
			requiresContextOptimization: false,
			requiresImmediateAction: true,
			message: "Context synchronization failed. Manual intervention required.",
			details: {
				contextTokens,
				maxTokens,
				error: error.message,
			},
		}
	}

	/**
	 * Classifies unknown errors
	 */
	private static classifyUnknownError(error: any, retryCount: number): ErrorClassification {
		return {
			errorType: ContextErrorType.MEMORY_PRESSURE, // Default to memory pressure
			severity: ErrorSeverity.LOW,
			retryStrategy: RetryStrategy.RETRY_WITH_SAME_STRATEGY,
			requiresContextOptimization: false,
			requiresImmediateAction: false,
			message: `Unknown error: ${error.message || error}. Will retry with current strategy.`,
			details: {
				error: error.message || error,
				retryCount,
			},
		}
	}

	/**
	 * Checks if error is a token limit error
	 */
	private static isTokenLimitError(error: any): boolean {
		return (
			error?.message?.toLowerCase().includes("token") ||
			error?.error?.message?.toLowerCase().includes("token") ||
			error?.status === 429 ||
			error?.code === "token_limit_exceeded"
		)
	}

	/**
	 * Checks if error is a memory pressure error
	 */
	private static isMemoryPressureError(error: any): boolean {
		return (
			error?.message?.toLowerCase().includes("memory") ||
			error?.message?.toLowerCase().includes("context") ||
			error?.code === "memory_pressure"
		)
	}

	/**
	 * Checks if error is a context corruption error
	 */
	private static isContextCorruptionError(error: any): boolean {
		return (
			error?.message?.toLowerCase().includes("corruption") ||
			error?.message?.toLowerCase().includes("invalid") ||
			error?.code === "context_corruption"
		)
	}

	/**
	 * Checks if error is a synchronization failure error
	 */
	private static isSyncFailureError(error: any): boolean {
		return (
			error?.message?.toLowerCase().includes("sync") ||
			error?.message?.toLowerCase().includes("synchronization") ||
			error?.code === "sync_failure"
		)
	}
}
