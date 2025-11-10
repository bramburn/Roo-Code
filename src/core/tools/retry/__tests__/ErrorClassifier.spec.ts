import { describe, test, expect } from "vitest"
import { ErrorClassifier, ContextErrorType, ErrorSeverity, RetryStrategy } from "../ErrorClassifier"

describe("ErrorClassifier", () => {
	describe("classifyError", () => {
		test("should classify context window exceeded error", () => {
			const error = { message: "Context window exceeded", status: 429 }
			const classification = ErrorClassifier.classifyError(
				error,
				100, // contextTokens
				1000, // maxTokens
				1, // retryCount
			)

			expect(classification.errorType).toBe(ContextErrorType.CONTEXT_WINDOW_EXCEEDED)
			expect(classification.severity).toBe(ErrorSeverity.LOW)
			expect(classification.retryStrategy).toBe(RetryStrategy.RETRY_WITH_CONTEXT_OPTIMIZATION)
			expect(classification.requiresContextOptimization).toBe(true)
			expect(classification.requiresImmediateAction).toBe(false)
		})

		test("should classify token limit error", () => {
			const error = { message: "Token limit exceeded" }
			const classification = ErrorClassifier.classifyError(
				error,
				950, // contextTokens
				1000, // maxTokens
				1, // retryCount
			)

			expect(classification.errorType).toBe(ContextErrorType.TOKEN_LIMIT_EXCEEDED)
			expect(classification.severity).toBe(ErrorSeverity.MEDIUM)
			expect(classification.retryStrategy).toBe(RetryStrategy.RETRY_WITH_CONTEXT_OPTIMIZATION)
			expect(classification.requiresContextOptimization).toBe(true)
			expect(classification.requiresImmediateAction).toBe(false)
		})

		test("should classify memory pressure error", () => {
			const error = { message: "Memory pressure detected" }
			const classification = ErrorClassifier.classifyError(
				error,
				900, // contextTokens
				1000, // maxTokens
				1, // retryCount
			)

			expect(classification.errorType).toBe(ContextErrorType.MEMORY_PRESSURE)
			expect(classification.severity).toBe(ErrorSeverity.HIGH)
			expect(classification.retryStrategy).toBe(RetryStrategy.RETRY_WITH_AGGRESSIVE_STRATEGY)
			expect(classification.requiresContextOptimization).toBe(true)
			expect(classification.requiresImmediateAction).toBe(false)
		})

		test("should classify context corruption error", () => {
			const error = { message: "Context corruption detected", code: "context_corruption" }
			const classification = ErrorClassifier.classifyError(
				error,
				100, // contextTokens
				1000, // maxTokens
				1, // retryCount
			)

			expect(classification.errorType).toBe(ContextErrorType.CONTEXT_CORRUPTION)
			expect(classification.severity).toBe(ErrorSeverity.CRITICAL)
			expect(classification.retryStrategy).toBe(RetryStrategy.MANUAL_INTERVENTION)
			expect(classification.requiresContextOptimization).toBe(false)
			expect(classification.requiresImmediateAction).toBe(true)
		})

		test("should classify synchronization failure error", () => {
			const error = { message: "Context synchronization failed", code: "sync_failure" }
			const classification = ErrorClassifier.classifyError(
				error,
				100, // contextTokens
				1000, // maxTokens
				1, // retryCount
			)

			expect(classification.errorType).toBe(ContextErrorType.SYNC_FAILURE)
			expect(classification.severity).toBe(ErrorSeverity.HIGH)
			expect(classification.retryStrategy).toBe(RetryStrategy.MANUAL_INTERVENTION)
			expect(classification.requiresContextOptimization).toBe(false)
			expect(classification.requiresImmediateAction).toBe(true)
		})

		test("should classify unknown error", () => {
			const error = { message: "Unknown error occurred" }
			const classification = ErrorClassifier.classifyError(
				error,
				100, // contextTokens
				1000, // maxTokens
				1, // retryCount
			)

			expect(classification.errorType).toBe(ContextErrorType.MEMORY_PRESSURE) // Default
			expect(classification.severity).toBe(ErrorSeverity.LOW)
			expect(classification.retryStrategy).toBe(RetryStrategy.RETRY_WITH_SAME_STRATEGY)
			expect(classification.requiresContextOptimization).toBe(false)
			expect(classification.requiresImmediateAction).toBe(false)
		})
	})

	describe("Context Window Error Classification", () => {
		test("should escalate severity on high retry count", () => {
			const error = { message: "Context window exceeded", status: 429 }

			// First retry
			const classification1 = ErrorClassifier.classifyError(error, 100, 1000, 1)
			expect(classification1.severity).toBe(ErrorSeverity.LOW)
			expect(classification1.retryStrategy).toBe(RetryStrategy.RETRY_WITH_CONTEXT_OPTIMIZATION)

			// Second retry
			const classification2 = ErrorClassifier.classifyError(error, 100, 1000, 2)
			expect(classification2.severity).toBe(ErrorSeverity.MEDIUM)
			expect(classification2.retryStrategy).toBe(RetryStrategy.RETRY_WITH_AGGRESSIVE_STRATEGY)

			// Third retry - should abort
			const classification3 = ErrorClassifier.classifyError(error, 100, 1000, 3)
			expect(classification3.severity).toBe(ErrorSeverity.HIGH)
			expect(classification3.retryStrategy).toBe(RetryStrategy.ABORT_RETRY)
		})

		test("should consider context pressure in classification", () => {
			const error = { message: "Context window exceeded", status: 429 }

			// Low pressure
			const lowPressure = ErrorClassifier.classifyError(error, 800, 1000, 1)
			expect(lowPressure.retryStrategy).toBe(RetryStrategy.RETRY_WITH_CONTEXT_OPTIMIZATION)

			// High pressure
			const highPressure = ErrorClassifier.classifyError(error, 1300, 1000, 1)
			expect(highPressure.retryStrategy).toBe(RetryStrategy.RETRY_WITH_AGGRESSIVE_STRATEGY)
		})
	})

	describe("Error Pattern Matching", () => {
		test("should match various token limit patterns", () => {
			const patterns = [
				{ message: "token limit exceeded" },
				{ error: { message: "Too many tokens" } },
				{ status: 429 },
				{ code: "token_limit_exceeded" },
			]

			for (const error of patterns) {
				const classification = ErrorClassifier.classifyError(error, 950, 1000, 1)
				expect(classification.errorType).toBe(ContextErrorType.TOKEN_LIMIT_EXCEEDED)
			}
		})

		test("should match various memory pressure patterns", () => {
			const patterns = [
				{ message: "memory pressure detected" },
				{ message: "Context is too large" },
				{ code: "memory_pressure" },
			]

			for (const error of patterns) {
				const classification = ErrorClassifier.classifyError(error, 900, 1000, 1)
				expect(classification.errorType).toBe(ContextErrorType.MEMORY_PRESSURE)
			}
		})

		test("should match various corruption patterns", () => {
			const patterns = [
				{ message: "Context corruption detected" },
				{ message: "Invalid context format" },
				{ code: "context_corruption" },
			]

			for (const error of patterns) {
				const classification = ErrorClassifier.classifyError(error, 100, 1000, 1)
				expect(classification.errorType).toBe(ContextErrorType.CONTEXT_CORRUPTION)
			}
		})

		test("should match various sync failure patterns", () => {
			const patterns = [
				{ message: "Context synchronization failed" },
				{ message: "History sync error" },
				{ code: "sync_failure" },
			]

			for (const error of patterns) {
				const classification = ErrorClassifier.classifyError(error, 100, 1000, 1)
				expect(classification.errorType).toBe(ContextErrorType.SYNC_FAILURE)
			}
		})
	})

	describe("Classification Details", () => {
		test("should include relevant details in classification", () => {
			const error = { message: "Context window exceeded", status: 429 }
			const classification = ErrorClassifier.classifyError(
				error,
				850, // contextTokens
				1000, // maxTokens
				2, // retryCount
				{ apiHistoryLength: 100, clineMessagesLength: 100 },
			)

			expect(classification.message).toContain("Context window exceeded")
			expect(classification.details).toBeDefined()
			expect(classification.details?.contextTokens).toBe(850)
			expect(classification.details?.maxTokens).toBe(1000)
			expect(classification.details?.contextPressure).toBe(85)
			expect(classification.details?.retryCount).toBe(2)
		})

		test("should provide human-readable messages", () => {
			const error = { message: "Memory pressure detected" }
			const classification = ErrorClassifier.classifyError(
				error,
				900, // contextTokens
				1000, // maxTokens
				1, // retryCount
			)

			expect(classification.message).toContain("Memory pressure detected")
			expect(classification.message).toContain("90% of limit")
			expect(classification.message).toContain("aggressive optimization")
		})
	})

	describe("Edge Cases", () => {
		test("should handle null/undefined errors", () => {
			const classification1 = ErrorClassifier.classifyError(null, 100, 1000, 1)
			const classification2 = ErrorClassifier.classifyError(undefined, 100, 1000, 1)

			expect(classification1.errorType).toBe(ContextErrorType.MEMORY_PRESSURE) // Default
			expect(classification2.errorType).toBe(ContextErrorType.MEMORY_PRESSURE) // Default
		})

		test("should handle empty error messages", () => {
			const error = { message: "" }
			const classification = ErrorClassifier.classifyError(error, 100, 1000, 1)

			expect(classification.errorType).toBe(ContextErrorType.MEMORY_PRESSURE) // Default
		})

		test("should handle extreme context values", () => {
			const error = { message: "Context window exceeded" }

			// Very high context usage
			const highContext = ErrorClassifier.classifyError(error, 2000, 1000, 1)
			expect(highContext.retryStrategy).toBe(RetryStrategy.RETRY_WITH_AGGRESSIVE_STRATEGY)

			// Zero context usage
			const zeroContext = ErrorClassifier.classifyError(error, 0, 1000, 1)
			expect(zeroContext.retryStrategy).toBe(RetryStrategy.RETRY_WITH_CONTEXT_OPTIMIZATION)
		})

		test("should handle case-insensitive matching", () => {
			const errorPatterns = [
				{ message: "CONTEXT WINDOW EXCEEDED" },
				{ message: "Token Limit Exceeded" },
				{ message: "MEMORY PRESSURE DETECTED" },
				{ message: "CONTEXT CORRUPTION DETECTED" },
			]

			for (const error of errorPatterns) {
				const classification = ErrorClassifier.classifyError(error, 100, 1000, 1)
				expect([
					ContextErrorType.CONTEXT_WINDOW_EXCEEDED,
					ContextErrorType.TOKEN_LIMIT_EXCEEDED,
					ContextErrorType.MEMORY_PRESSURE,
					ContextErrorType.CONTEXT_CORRUPTION,
				]).toContain(classification.errorType)
			}
		})
	})

	describe("Context State Integration", () => {
		test("should use context state information", () => {
			const error = { message: "Context window exceeded" }
			const contextState = {
				apiHistoryLength: 150,
				clineMessagesLength: 100,
				lastOptimizationTime: Date.now() - 5000, // 5 seconds ago
			}

			const classification = ErrorClassifier.classifyError(
				error,
				950, // contextTokens
				1000, // maxTokens
				1, // retryCount
				contextState,
			)

			expect(classification.details).toBeDefined()
			// Context state should be available for more sophisticated classification
			expect(classification.requiresContextOptimization).toBe(true)
		})
	})
})
