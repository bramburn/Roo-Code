import { describe, test, expect, beforeEach, vi } from "vitest"
import { RetryEngine } from "../RetryEngine"
import { BackoffStrategy } from "../BackoffStrategy"
import { CircuitBreaker } from "../CircuitBreaker"
import { ErrorClassifier } from "../ErrorClassifier"
import { ContextOptimizer } from "../ContextOptimizer"
import { DualHistorySynchronizer } from "../DualHistorySynchronizer"
import { RetryStateManager } from "../RetryStateManager"
import { RetryLogger } from "../RetryLogger"
import type { RetryContext, RetryResult, RetryExecution, RetrySettings } from "../types"

// Mock dependencies
vi.mock("../BackoffStrategy")
vi.mock("../CircuitBreaker")
vi.mock("../ErrorClassifier")
vi.mock("../ContextOptimizer")
vi.mock("../DualHistorySynchronizer")
vi.mock("../RetryStateManager")
vi.mock("../RetryLogger")

describe("RetryEngine", () => {
	let retryEngine: RetryEngine
	let mockBackoffStrategy: any
	let mockCircuitBreaker: any
	let mockErrorClassifier: any
	let mockContextOptimizer: any
	let mockHistorySynchronizer: any
	let mockStateManager: any
	let mockLogger: any

	beforeEach(() => {
		// Reset all mocks
		vi.clearAllMocks()

		// Create mock instances
		mockBackoffStrategy = {
			calculateDelay: vi.fn(),
			shouldRetry: vi.fn(),
			getConfig: vi.fn().mockReturnValue({
				baseDelay: 1000,
				maxDelay: 30000,
				multiplier: 2,
				jitterFactor: 0.1,
				maxAttempts: 3,
			}),
		}

		mockCircuitBreaker = {
			canExecute: vi.fn().mockReturnValue(true),
			recordSuccess: vi.fn(),
			recordFailure: vi.fn(),
			getState: vi.fn().mockReturnValue("closed"),
			getConfig: vi.fn().mockReturnValue({
				failureThreshold: 5,
				recoveryTimeout: 60000,
			}),
		}

		mockErrorClassifier = {
			classifyError: vi.fn(),
			isRetryableError: vi.fn(),
			getRetryStrategy: vi.fn(),
		}

		mockContextOptimizer = {
			optimizeContext: vi.fn(),
			getOptimizationStrategy: vi.fn(),
		}

		mockHistorySynchronizer = {
			syncHistories: vi.fn(),
			restoreContext: vi.fn(),
			detectConflicts: vi.fn(),
		}

		mockStateManager = {
			createRetryContext: vi.fn(),
			updateRetryContext: vi.fn(),
			cleanupRetryContext: vi.fn(),
			getRetryContext: vi.fn(),
		}

		mockLogger = {
			logRetryAttempt: vi.fn(),
			logRetrySuccess: vi.fn(),
			logRetryFailure: vi.fn(),
			logRetryExhausted: vi.fn(),
			getStatistics: vi.fn(),
		}

		// Mock constructor calls
		;(BackoffStrategy as any).mockImplementation(() => mockBackoffStrategy)
		;(CircuitBreaker as any).mockImplementation(() => mockCircuitBreaker)
		;(ErrorClassifier as any).mockImplementation(() => mockErrorClassifier)
		;(ContextOptimizer as any).mockImplementation(() => mockContextOptimizer)
		;(DualHistorySynchronizer as any).mockImplementation(() => mockHistorySynchronizer)
		;(RetryStateManager as any).mockImplementation(() => mockStateManager)
		;(RetryLogger as any).mockImplementation(() => mockLogger)

		// Create retry engine instance
		retryEngine = new RetryEngine()
	})

	describe("constructor", () => {
		test("should initialize all components", () => {
			expect(BackoffStrategy).toHaveBeenCalledTimes(1)
			expect(CircuitBreaker).toHaveBeenCalledTimes(1)
			expect(ErrorClassifier).toHaveBeenCalledTimes(1)
			expect(ContextOptimizer).toHaveBeenCalledTimes(1)
			expect(DualHistorySynchronizer).toHaveBeenCalledTimes(1)
			expect(RetryStateManager).toHaveBeenCalledTimes(1)
			expect(RetryLogger).toHaveBeenCalledTimes(1)
		})
	})

	describe("executeWithRetry", () => {
		test("should execute successfully on first attempt", async () => {
			const execution: RetryExecution = {
				toolName: "test-tool",
				execute: vi.fn().mockResolvedValue("success"),
				params: { param1: "value1" },
			}

			const settings: RetrySettings = {
				enableRetry: true,
				maxRetryAttempts: 3,
				baseDelayMs: 1000,
			}

			const result = await retryEngine.executeWithRetry(execution, settings)

			expect(result.success).toBe(true)
			expect(result.result).toBe("success")
			expect(result.attempts).toBe(1)
			expect(result.totalDuration).toBeGreaterThanOrEqual(0)
			expect(execution.execute).toHaveBeenCalledTimes(1)
			expect(mockLogger.logRetrySuccess).toHaveBeenCalledTimes(1)
		})

		test("should retry on retryable error", async () => {
			const execution: RetryExecution = {
				toolName: "test-tool",
				execute: vi.fn().mockRejectedValueOnce(new Error("Network error")).mockResolvedValue("success"),
				params: { param1: "value1" },
			}

			const settings: RetrySettings = {
				enableRetry: true,
				maxRetryAttempts: 3,
				baseDelayMs: 1000,
			}

			// Mock error classification
			mockErrorClassifier.classifyError.mockReturnValue({
				isRetryable: true,
				category: "network",
				severity: "medium",
				backoffStrategy: "exponential",
			})

			// Mock backoff delay
			mockBackoffStrategy.calculateDelay.mockReturnValue(1000)

			// Mock delay function
			const delaySpy = vi.spyOn(global, "setTimeout").mockImplementation((cb) => {
				cb()
				return 1 as any
			})

			const result = await retryEngine.executeWithRetry(execution, settings)

			expect(result.success).toBe(true)
			expect(result.result).toBe("success")
			expect(result.attempts).toBe(2)
			expect(execution.execute).toHaveBeenCalledTimes(2)
			expect(mockErrorClassifier.classifyError).toHaveBeenCalledTimes(1)
			expect(mockBackoffStrategy.calculateDelay).toHaveBeenCalledTimes(1)
			expect(mockLogger.logRetryAttempt).toHaveBeenCalledTimes(1)
			expect(mockLogger.logRetrySuccess).toHaveBeenCalledTimes(1)

			delaySpy.mockRestore()
		})

		test("should fail after max retry attempts", async () => {
			const error = new Error("Persistent error")
			const execution: RetryExecution = {
				toolName: "test-tool",
				execute: vi.fn().mockRejectedValue(error),
				params: { param1: "value1" },
			}

			const settings: RetrySettings = {
				enableRetry: true,
				maxRetryAttempts: 3,
				baseDelayMs: 1000,
			}

			// Mock error classification
			mockErrorClassifier.classifyError.mockReturnValue({
				isRetryable: true,
				category: "network",
				severity: "medium",
				backoffStrategy: "exponential",
			})

			// Mock backoff strategy
			mockBackoffStrategy.calculateDelay.mockReturnValue(1000)
			mockBackoffStrategy.shouldRetry.mockReturnValue(true)

			// Mock delay function
			const delaySpy = vi.spyOn(global, "setTimeout").mockImplementation((cb) => {
				cb()
				return 1 as any
			})

			const result = await retryEngine.executeWithRetry(execution, settings)

			expect(result.success).toBe(false)
			expect(result.error).toBe(error)
			expect(result.attempts).toBe(3)
			expect(execution.execute).toHaveBeenCalledTimes(3)
			expect(mockLogger.logRetryAttempt).toHaveBeenCalledTimes(2)
			expect(mockLogger.logRetryExhausted).toHaveBeenCalledTimes(1)

			delaySpy.mockRestore()
		})

		test("should not retry non-retryable errors", async () => {
			const error = new Error("Authentication error")
			const execution: RetryExecution = {
				toolName: "test-tool",
				execute: vi.fn().mockRejectedValue(error),
				params: { param1: "value1" },
			}

			const settings: RetrySettings = {
				enableRetry: true,
				maxRetryAttempts: 3,
				baseDelayMs: 1000,
			}

			// Mock error classification
			mockErrorClassifier.classifyError.mockReturnValue({
				isRetryable: false,
				category: "auth",
				severity: "high",
				backoffStrategy: "none",
			})

			const result = await retryEngine.executeWithRetry(execution, settings)

			expect(result.success).toBe(false)
			expect(result.error).toBe(error)
			expect(result.attempts).toBe(1)
			expect(execution.execute).toHaveBeenCalledTimes(1)
			expect(mockErrorClassifier.classifyError).toHaveBeenCalledTimes(1)
			expect(mockBackoffStrategy.calculateDelay).not.toHaveBeenCalled()
			expect(mockLogger.logRetryFailure).toHaveBeenCalledTimes(1)
		})

		test("should respect circuit breaker", async () => {
			const execution: RetryExecution = {
				toolName: "test-tool",
				execute: vi.fn().mockResolvedValue("success"),
				params: { param1: "value1" },
			}

			const settings: RetrySettings = {
				enableRetry: true,
				maxRetryAttempts: 3,
				baseDelayMs: 1000,
			}

			// Mock circuit breaker as open
			mockCircuitBreaker.canExecute.mockReturnValue(false)

			const result = await retryEngine.executeWithRetry(execution, settings)

			expect(result.success).toBe(false)
			expect(result.error).toBeDefined()
			expect(result.error?.message).toContain("Circuit breaker is open")
			expect(execution.execute).not.toHaveBeenCalled()
			expect(mockCircuitBreaker.canExecute).toHaveBeenCalledTimes(1)
		})

		test("should optimize context when enabled", async () => {
			const execution: RetryExecution = {
				toolName: "test-tool",
				execute: vi.fn().mockResolvedValue("success"),
				params: { param1: "value1" },
				context: {
					taskId: "test-task",
					messages: [{ role: "user", content: "test message" }],
				},
			}

			const settings: RetrySettings = {
				enableRetry: true,
				maxRetryAttempts: 3,
				baseDelayMs: 1000,
				enableContextOptimization: true,
			}

			// Mock context optimization
			mockContextOptimizer.optimizeContext.mockResolvedValue({
				optimized: true,
				reduction: 0.3,
				optimizedContext: {
					taskId: "test-task",
					messages: [{ role: "user", content: "optimized message" }],
				},
			})

			await retryEngine.executeWithRetry(execution, settings)

			expect(mockContextOptimizer.optimizeContext).toHaveBeenCalledTimes(1)
		})

		test("should synchronize histories when enabled", async () => {
			const execution: RetryExecution = {
				toolName: "test-tool",
				execute: vi.fn().mockResolvedValue("success"),
				params: { param1: "value1" },
				context: {
					taskId: "test-task",
					apiHistory: [{ id: "1", content: "test" }],
					clineHistory: [{ id: "1", content: "test" }],
				},
			}

			const settings: RetrySettings = {
				enableRetry: true,
				maxRetryAttempts: 3,
				baseDelayMs: 1000,
				enableHistorySynchronization: true,
			}

			// Mock history synchronization
			mockHistorySynchronizer.syncHistories.mockResolvedValue({
				synchronized: true,
				conflicts: [],
				mergedHistory: [{ id: "1", content: "test" }],
			})

			await retryEngine.executeWithRetry(execution, settings)

			expect(mockHistorySynchronizer.syncHistories).toHaveBeenCalledTimes(1)
		})

		test("should handle execution timeout", async () => {
			const execution: RetryExecution = {
				toolName: "test-tool",
				execute: vi.fn().mockImplementation(() => {
					return new Promise((resolve) => {
						setTimeout(() => resolve("success"), 10000) // Long delay
					})
				}),
				params: { param1: "value1" },
			}

			const settings: RetrySettings = {
				enableRetry: true,
				maxRetryAttempts: 3,
				baseDelayMs: 1000,
				retryTimeoutMs: 1000, // Short timeout
			}

			const result = await retryEngine.executeWithRetry(execution, settings)

			expect(result.success).toBe(false)
			expect(result.error).toBeDefined()
			expect(result.error?.message).toContain("timeout")
		})
	})

	describe("getState", () => {
		test("should return current state", () => {
			const state = retryEngine.getState()

			expect(state).toBeDefined()
			expect(state.circuitBreakerState).toBeDefined()
			expect(state.activeRetries).toBeDefined()
			expect(state.statistics).toBeDefined()
		})

		test("should get circuit breaker state from component", () => {
			mockCircuitBreaker.getState.mockReturnValue("open")

			const state = retryEngine.getState()

			expect(state.circuitBreakerState).toBe("open")
			expect(mockCircuitBreaker.getState).toHaveBeenCalledTimes(1)
		})
	})

	describe("getStatistics", () => {
		test("should return statistics from logger", () => {
			const expectedStats = {
				totalRetries: 10,
				successfulRetries: 7,
				failedRetries: 3,
				averageAttempts: 2.5,
			}

			mockLogger.getStatistics.mockReturnValue(expectedStats)

			const stats = retryEngine.getStatistics()

			expect(stats).toEqual(expectedStats)
			expect(mockLogger.getStatistics).toHaveBeenCalledTimes(1)
		})
	})

	describe("reset", () => {
		test("should reset circuit breaker", () => {
			retryEngine.reset()

			expect(mockCircuitBreaker.reset).toHaveBeenCalledTimes(1)
		})

		test("should clear statistics", () => {
			retryEngine.reset()

			expect(mockLogger.clearStatistics).toHaveBeenCalledTimes(1)
		})
	})

	describe("configure", () => {
		test("should update configuration", () => {
			const newConfig = {
				maxRetryAttempts: 5,
				baseDelayMs: 2000,
			}

			retryEngine.configure(newConfig)

			// Verify configuration was applied
			expect(mockBackoffStrategy.updateConfig).toHaveBeenCalledWith(newConfig)
			expect(mockCircuitBreaker.updateConfig).toHaveBeenCalledWith(newConfig)
		})
	})

	describe("Event Emission", () => {
		test("should emit retry attempt event", async () => {
			const execution: RetryExecution = {
				toolName: "test-tool",
				execute: vi.fn().mockRejectedValueOnce(new Error("Network error")).mockResolvedValue("success"),
				params: { param1: "value1" },
			}

			const settings: RetrySettings = {
				enableRetry: true,
				maxRetryAttempts: 3,
				baseDelayMs: 1000,
			}

			// Mock error classification
			mockErrorClassifier.classifyError.mockReturnValue({
				isRetryable: true,
				category: "network",
				severity: "medium",
				backoffStrategy: "exponential",
			})

			// Mock backoff delay
			mockBackoffStrategy.calculateDelay.mockReturnValue(100)

			// Mock delay function
			const delaySpy = vi.spyOn(global, "setTimeout").mockImplementation((cb) => {
				cb()
				return 1 as any
			})

			// Spy on event emission
			const eventSpy = vi.fn()
			retryEngine.on("retryAttempt", eventSpy)

			await retryEngine.executeWithRetry(execution, settings)

			expect(eventSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					toolName: "test-tool",
					attempt: 2,
					error: expect.any(Error),
				}),
			)

			delaySpy.mockRestore()
		})

		test("should emit retry success event", async () => {
			const execution: RetryExecution = {
				toolName: "test-tool",
				execute: vi.fn().mockResolvedValue("success"),
				params: { param1: "value1" },
			}

			const settings: RetrySettings = {
				enableRetry: true,
				maxRetryAttempts: 3,
				baseDelayMs: 1000,
			}

			// Spy on event emission
			const eventSpy = vi.fn()
			retryEngine.on("retrySuccess", eventSpy)

			await retryEngine.executeWithRetry(execution, settings)

			expect(eventSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					toolName: "test-tool",
					attempts: 1,
					result: "success",
				}),
			)
		})

		test("should emit retry failure event", async () => {
			const error = new Error("Persistent error")
			const execution: RetryExecution = {
				toolName: "test-tool",
				execute: vi.fn().mockRejectedValue(error),
				params: { param1: "value1" },
			}

			const settings: RetrySettings = {
				enableRetry: true,
				maxRetryAttempts: 3,
				baseDelayMs: 1000,
			}

			// Mock error classification
			mockErrorClassifier.classifyError.mockReturnValue({
				isRetryable: true,
				category: "network",
				severity: "medium",
				backoffStrategy: "exponential",
			})

			// Mock backoff strategy
			mockBackoffStrategy.calculateDelay.mockReturnValue(100)
			mockBackoffStrategy.shouldRetry.mockReturnValue(true)

			// Mock delay function
			const delaySpy = vi.spyOn(global, "setTimeout").mockImplementation((cb) => {
				cb()
				return 1 as any
			})

			// Spy on event emission
			const eventSpy = vi.fn()
			retryEngine.on("retryFailure", eventSpy)

			await retryEngine.executeWithRetry(execution, settings)

			expect(eventSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					toolName: "test-tool",
					attempts: 3,
					error: error,
				}),
			)

			delaySpy.mockRestore()
		})
	})

	describe("Error Handling", () => {
		test("should handle context optimization errors", async () => {
			const execution: RetryExecution = {
				toolName: "test-tool",
				execute: vi.fn().mockResolvedValue("success"),
				params: { param1: "value1" },
				context: {
					taskId: "test-task",
					messages: [{ role: "user", content: "test message" }],
				},
			}

			const settings: RetrySettings = {
				enableRetry: true,
				maxRetryAttempts: 3,
				baseDelayMs: 1000,
				enableContextOptimization: true,
			}

			// Mock context optimization to throw error
			mockContextOptimizer.optimizeContext.mockRejectedValue(new Error("Optimization failed"))

			// Should still execute successfully despite optimization failure
			const result = await retryEngine.executeWithRetry(execution, settings)

			expect(result.success).toBe(true)
			expect(result.result).toBe("success")
		})

		test("should handle history synchronization errors", async () => {
			const execution: RetryExecution = {
				toolName: "test-tool",
				execute: vi.fn().mockResolvedValue("success"),
				params: { param1: "value1" },
				context: {
					taskId: "test-task",
					apiHistory: [{ id: "1", content: "test" }],
					clineHistory: [{ id: "1", content: "test" }],
				},
			}

			const settings: RetrySettings = {
				enableRetry: true,
				maxRetryAttempts: 3,
				baseDelayMs: 1000,
				enableHistorySynchronization: true,
			}

			// Mock history synchronization to throw error
			mockHistorySynchronizer.syncHistories.mockRejectedValue(new Error("Sync failed"))

			// Should still execute successfully despite sync failure
			const result = await retryEngine.executeWithRetry(execution, settings)

			expect(result.success).toBe(true)
			expect(result.result).toBe("success")
		})

		test("should handle circuit breaker errors", async () => {
			const execution: RetryExecution = {
				toolName: "test-tool",
				execute: vi.fn().mockResolvedValue("success"),
				params: { param1: "value1" },
			}

			const settings: RetrySettings = {
				enableRetry: true,
				maxRetryAttempts: 3,
				baseDelayMs: 1000,
			}

			// Mock circuit breaker to throw error
			mockCircuitBreaker.canExecute.mockImplementation(() => {
				throw new Error("Circuit breaker error")
			})

			const result = await retryEngine.executeWithRetry(execution, settings)

			expect(result.success).toBe(false)
			expect(result.error?.message).toContain("Circuit breaker error")
		})
	})

	describe("Concurrent Execution", () => {
		test("should handle multiple concurrent retries", async () => {
			const execution1: RetryExecution = {
				toolName: "test-tool-1",
				execute: vi.fn().mockResolvedValue("success-1"),
				params: { param1: "value1" },
			}

			const execution2: RetryExecution = {
				toolName: "test-tool-2",
				execute: vi.fn().mockResolvedValue("success-2"),
				params: { param1: "value2" },
			}

			const settings: RetrySettings = {
				enableRetry: true,
				maxRetryAttempts: 3,
				baseDelayMs: 1000,
			}

			// Execute both concurrently
			const [result1, result2] = await Promise.all([
				retryEngine.executeWithRetry(execution1, settings),
				retryEngine.executeWithRetry(execution2, settings),
			])

			expect(result1.success).toBe(true)
			expect(result1.result).toBe("success-1")
			expect(result2.success).toBe(true)
			expect(result2.result).toBe("success-2")
		})
	})
})
