import { describe, test, expect, beforeEach, vi } from "vitest"
import { RetryEngine } from "../../RetryEngine"
import { BackoffStrategy } from "../../BackoffStrategy"
import { CircuitBreaker } from "../../CircuitBreaker"
import { ErrorClassifier } from "../../ErrorClassifier"
import { ContextOptimizer } from "../../ContextOptimizer"
import { DualHistorySynchronizer } from "../../DualHistorySynchronizer"
import { RetryStateManager } from "../../RetryStateManager"
import { RetryLogger } from "../../RetryLogger"
import type { RetryExecution, RetrySettings } from "../../types"

// Mock truncateConversationIfNeeded for ContextOptimizer
vi.mock("../../../../../utils/truncateConversationIfNeeded", () => ({
	truncateConversationIfNeeded: vi.fn(),
}))

describe("RetryEngine Edge Cases and Boundary Conditions", () => {
	let retryEngine: RetryEngine
	let mockToolFunction: any

	beforeEach(() => {
		vi.clearAllMocks()
		retryEngine = new RetryEngine()
		mockToolFunction = vi.fn()
	})

	describe("Maximum Retry Limits", () => {
		test("should handle zero max retry attempts", async () => {
			const execution: RetryExecution = {
				toolName: "zero-retry-tool",
				execute: mockToolFunction.mockRejectedValue(new Error("Test error")),
				params: { action: "test" },
			}

			const settings: RetrySettings = {
				enableRetry: true,
				maxRetryAttempts: 0, // Edge case: zero retries
				baseDelayMs: 1000,
				retryTimeoutMs: 5000,
			}

			const result = await retryEngine.executeWithRetry(execution, settings)

			expect(result.success).toBe(false)
			expect(result.attempts).toBe(1) // Only initial attempt
			expect(mockToolFunction).toHaveBeenCalledTimes(1)
		})

		test("should handle negative max retry attempts", async () => {
			const execution: RetryExecution = {
				toolName: "negative-retry-tool",
				execute: mockToolFunction.mockRejectedValue(new Error("Test error")),
				params: { action: "test" },
			}

			const settings: RetrySettings = {
				enableRetry: true,
				maxRetryAttempts: -1, // Edge case: negative retries
				baseDelayMs: 1000,
				retryTimeoutMs: 5000,
			}

			const result = await retryEngine.executeWithRetry(execution, settings)

			expect(result.success).toBe(false)
			expect(result.attempts).toBe(1) // Should normalize to 1 attempt
		})

		test("should handle very high max retry attempts", async () => {
			const execution: RetryExecution = {
				toolName: "high-retry-tool",
				execute: mockToolFunction
					.mockRejectedValueTimes(100, new Error("Persistent error"))
					.mockResolvedValue({ success: true }),
				params: { action: "test" },
			}

			const settings: RetrySettings = {
				enableRetry: true,
				maxRetryAttempts: 1000, // Very high limit
				baseDelayMs: 1, // Minimal delay for testing
				retryTimeoutMs: 10000,
			}

			// Mock setTimeout for performance
			const delaySpy = vi.spyOn(global, "setTimeout").mockImplementation((cb) => {
				cb()
				return 1 as any
			})

			const result = await retryEngine.executeWithRetry(execution, settings)

			expect(result.success).toBe(true)
			expect(result.attempts).toBe(101) // 100 failures + 1 success

			delaySpy.mockRestore()
		})
	})

	describe("Invalid Retry Configurations", () => {
		test("should handle undefined settings", async () => {
			const execution: RetryExecution = {
				toolName: "undefined-settings-tool",
				execute: mockToolFunction.mockResolvedValue({ success: true }),
				params: { action: "test" },
			}

			const result = await retryEngine.executeWithRetry(execution, undefined as any)

			expect(result.success).toBe(true)
			expect(result.attempts).toBe(1)
		})

		test("should handle null settings", async () => {
			const execution: RetryExecution = {
				toolName: "null-settings-tool",
				execute: mockToolFunction.mockResolvedValue({ success: true }),
				params: { action: "test" },
			}

			const result = await retryEngine.executeWithRetry(execution, null as any)

			expect(result.success).toBe(true)
			expect(result.attempts).toBe(1)
		})

		test("should handle empty settings object", async () => {
			const execution: RetryExecution = {
				toolName: "empty-settings-tool",
				execute: mockToolFunction.mockResolvedValue({ success: true }),
				params: { action: "test" },
			}

			const settings = {} as RetrySettings

			const result = await retryEngine.executeWithRetry(execution, settings)

			expect(result.success).toBe(true)
			expect(result.attempts).toBe(1)
		})

		test("should handle settings with invalid types", async () => {
			const execution: RetryExecution = {
				toolName: "invalid-types-tool",
				execute: mockToolFunction.mockResolvedValue({ success: true }),
				params: { action: "test" },
			}

			const invalidSettings = {
				enableRetry: "true" as any, // String instead of boolean
				maxRetryAttempts: "3" as any, // String instead of number
				baseDelayMs: null as any, // Null instead of number
			}

			const result = await retryEngine.executeWithRetry(execution, invalidSettings)

			expect(result.success).toBe(true)
			expect(result.attempts).toBe(1)
		})
	})

	describe("System Resource Exhaustion", () => {
		test("should handle memory pressure during retries", async () => {
			// Simulate memory pressure by creating large objects
			const largeData = "x".repeat(1000000) // 1MB string

			const execution: RetryExecution = {
				toolName: "memory-pressure-tool",
				execute: mockToolFunction.mockImplementation(() => {
					// Simulate memory-intensive operation
					const largeArray = Array.from({ length: 10000 }, () => largeData)
					return Promise.reject(new Error("Memory pressure"))
				}),
				params: { largeData },
			}

			const settings: RetrySettings = {
				enableRetry: true,
				maxRetryAttempts: 2,
				baseDelayMs: 100,
				retryTimeoutMs: 5000,
			}

			const delaySpy = vi.spyOn(global, "setTimeout").mockImplementation((cb) => {
				cb()
				return 1 as any
			})

			const result = await retryEngine.executeWithRetry(execution, settings)

			expect(result.success).toBe(false)
			expect(result.error?.message).toContain("Memory pressure")

			delaySpy.mockRestore()
		})

		test("should handle event loop blocking", async () => {
			const execution: RetryExecution = {
				toolName: "blocking-tool",
				execute: mockToolFunction.mockImplementation(() => {
					// Simulate blocking operation
					const start = Date.now()
					while (Date.now() - start < 100) {
						// Block for 100ms
					}
					return Promise.reject(new Error("Blocking operation"))
				}),
				params: { action: "block" },
			}

			const settings: RetrySettings = {
				enableRetry: true,
				maxRetryAttempts: 2,
				baseDelayMs: 50,
				retryTimeoutMs: 1000,
			}

			const delaySpy = vi.spyOn(global, "setTimeout").mockImplementation((cb) => {
				cb()
				return 1 as any
			})

			const startTime = Date.now()
			const result = await retryEngine.executeWithRetry(execution, settings)
			const endTime = Date.now()

			expect(result.success).toBe(false)
			expect(endTime - startTime).toBeGreaterThan(200) // Should account for blocking

			delaySpy.mockRestore()
		})
	})

	describe("Concurrent Retry Conflicts", () => {
		test("should handle concurrent retries for same tool", async () => {
			const execution: RetryExecution = {
				toolName: "concurrent-tool",
				execute: mockToolFunction.mockImplementation(() => {
					return new Promise((resolve) => {
						setTimeout(() => resolve({ success: true }), 100)
					})
				}),
				params: { id: "same-tool" },
			}

			const settings: RetrySettings = {
				enableRetry: true,
				maxRetryAttempts: 2,
				baseDelayMs: 50,
				retryTimeoutMs: 1000,
			}

			// Execute same tool concurrently
			const promises = Array.from({ length: 5 }, () => retryEngine.executeWithRetry(execution, settings))

			const results = await Promise.all(promises)

			// All should succeed
			results.forEach((result) => {
				expect(result.success).toBe(true)
			})

			expect(mockToolFunction).toHaveBeenCalledTimes(5)
		})

		test("should handle concurrent retries with shared state", async () => {
			let sharedCounter = 0
			const execution: RetryExecution = {
				toolName: "shared-state-tool",
				execute: mockToolFunction.mockImplementation(() => {
					sharedCounter++
					if (sharedCounter % 2 === 0) {
						return Promise.reject(new Error("Even attempt failure"))
					}
					return Promise.resolve({ success: true, counter: sharedCounter })
				}),
				params: { shared: true },
			}

			const settings: RetrySettings = {
				enableRetry: true,
				maxRetryAttempts: 3,
				baseDelayMs: 10,
				retryTimeoutMs: 1000,
			}

			const delaySpy = vi.spyOn(global, "setTimeout").mockImplementation((cb) => {
				cb()
				return 1 as any
			})

			const promises = Array.from({ length: 3 }, () => retryEngine.executeWithRetry(execution, settings))

			const results = await Promise.all(promises)

			// Some should succeed, some should fail
			const successCount = results.filter((r) => r.success).length
			const failureCount = results.filter((r) => !r.success).length

			expect(successCount + failureCount).toBe(3)
			expect(sharedCounter).toBeGreaterThan(0)

			delaySpy.mockRestore()
		})
	})

	describe("Settings Corruption Scenarios", () => {
		test("should handle corrupted settings during execution", async () => {
			const execution: RetryExecution = {
				toolName: "corrupted-settings-tool",
				execute: mockToolFunction.mockResolvedValue({ success: true }),
				params: { action: "test" },
			}

			// Create corrupted settings
			const corruptedSettings = {
				enableRetry: true,
				maxRetryAttempts: 3,
				baseDelayMs: 1000,
				// Circular reference
				circular: {} as any,
			}
			corruptedSettings.circular = corruptedSettings

			const result = await retryEngine.executeWithRetry(execution, corruptedSettings)

			expect(result.success).toBe(true)
			expect(result.attempts).toBe(1)
		})

		test("should handle settings with prototype pollution", async () => {
			const execution: RetryExecution = {
				toolName: "pollution-tool",
				execute: mockToolFunction.mockResolvedValue({ success: true }),
				params: { action: "test" },
			}

			// Attempt prototype pollution
			const pollutedSettings = {
				enableRetry: true,
				maxRetryAttempts: 3,
				baseDelayMs: 1000,
			} as any
			pollutedSettings.__proto__.polluted = true

			const result = await retryEngine.executeWithRetry(execution, pollutedSettings)

			expect(result.success).toBe(true)
			expect(result.attempts).toBe(1)
		})
	})

	describe("Extreme Time Values", () => {
		test("should handle zero timeout", async () => {
			const execution: RetryExecution = {
				toolName: "zero-timeout-tool",
				execute: mockToolFunction.mockImplementation(() => {
					return new Promise((resolve) => {
						setTimeout(() => resolve({ success: true }), 100)
					})
				}),
				params: { action: "test" },
			}

			const settings: RetrySettings = {
				enableRetry: true,
				maxRetryAttempts: 1,
				baseDelayMs: 1000,
				retryTimeoutMs: 0, // Zero timeout
			}

			const result = await retryEngine.executeWithRetry(execution, settings)

			// Should either succeed or fail due to timeout, but not hang
			expect(result).toBeDefined()
		})

		test("should handle negative timeout", async () => {
			const execution: RetryExecution = {
				toolName: "negative-timeout-tool",
				execute: mockToolFunction.mockResolvedValue({ success: true }),
				params: { action: "test" },
			}

			const settings: RetrySettings = {
				enableRetry: true,
				maxRetryAttempts: 1,
				baseDelayMs: 1000,
				retryTimeoutMs: -1000, // Negative timeout
			}

			const result = await retryEngine.executeWithRetry(execution, settings)

			expect(result.success).toBe(true)
			expect(result.attempts).toBe(1)
		})

		test("should handle extremely large timeout", async () => {
			const execution: RetryExecution = {
				toolName: "large-timeout-tool",
				execute: mockToolFunction.mockResolvedValue({ success: true }),
				params: { action: "test" },
			}

			const settings: RetrySettings = {
				enableRetry: true,
				maxRetryAttempts: 1,
				baseDelayMs: 1000,
				retryTimeoutMs: Number.MAX_SAFE_INTEGER, // Extremely large timeout
			}

			const startTime = Date.now()
			const result = await retryEngine.executeWithRetry(execution, settings)
			const endTime = Date.now()

			expect(result.success).toBe(true)
			expect(endTime - startTime).toBeLessThan(1000) // Should complete quickly
		})
	})

	describe("Malformed Tool Parameters", () => {
		test("should handle undefined parameters", async () => {
			const execution: RetryExecution = {
				toolName: "undefined-params-tool",
				execute: mockToolFunction.mockResolvedValue({ success: true }),
				params: undefined as any,
			}

			const settings: RetrySettings = {
				enableRetry: true,
				maxRetryAttempts: 1,
				baseDelayMs: 1000,
				retryTimeoutMs: 5000,
			}

			const result = await retryEngine.executeWithRetry(execution, settings)

			expect(result.success).toBe(true)
			expect(result.attempts).toBe(1)
		})

		test("should handle null parameters", async () => {
			const execution: RetryExecution = {
				toolName: "null-params-tool",
				execute: mockToolFunction.mockResolvedValue({ success: true }),
				params: null as any,
			}

			const settings: RetrySettings = {
				enableRetry: true,
				maxRetryAttempts: 1,
				baseDelayMs: 1000,
				retryTimeoutMs: 5000,
			}

			const result = await retryEngine.executeWithRetry(execution, settings)

			expect(result.success).toBe(true)
			expect(result.attempts).toBe(1)
		})

		test("should handle circular parameter references", async () => {
			const circularParams = { name: "test" } as any
			circularParams.self = circularParams

			const execution: RetryExecution = {
				toolName: "circular-params-tool",
				execute: mockToolFunction.mockResolvedValue({ success: true }),
				params: circularParams,
			}

			const settings: RetrySettings = {
				enableRetry: true,
				maxRetryAttempts: 1,
				baseDelayMs: 1000,
				retryTimeoutMs: 5000,
			}

			const result = await retryEngine.executeWithRetry(execution, settings)

			expect(result.success).toBe(true)
			expect(result.attempts).toBe(1)
		})
	})

	describe("Edge Case Error Types", () => {
		test("should handle throwing non-Error objects", async () => {
			const execution: RetryExecution = {
				toolName: "non-error-throw-tool",
				execute: mockToolFunction.mockImplementation(() => {
					throw "String error" // Not an Error object
				}),
				params: { action: "test" },
			}

			const settings: RetrySettings = {
				enableRetry: true,
				maxRetryAttempts: 2,
				baseDelayMs: 100,
				retryTimeoutMs: 5000,
			}

			const delaySpy = vi.spyOn(global, "setTimeout").mockImplementation((cb) => {
				cb()
				return 1 as any
			})

			const result = await retryEngine.executeWithRetry(execution, settings)

			expect(result.success).toBe(false)
			expect(result.error).toBeDefined()

			delaySpy.mockRestore()
		})

		test("should handle throwing null", async () => {
			const execution: RetryExecution = {
				toolName: "null-throw-tool",
				execute: mockToolFunction.mockImplementation(() => {
					throw null
				}),
				params: { action: "test" },
			}

			const settings: RetrySettings = {
				enableRetry: true,
				maxRetryAttempts: 2,
				baseDelayMs: 100,
				retryTimeoutMs: 5000,
			}

			const delaySpy = vi.spyOn(global, "setTimeout").mockImplementation((cb) => {
				cb()
				return 1 as any
			})

			const result = await retryEngine.executeWithRetry(execution, settings)

			expect(result.success).toBe(false)
			expect(result.error).toBeDefined()

			delaySpy.mockRestore()
		})

		test("should handle throwing undefined", async () => {
			const execution: RetryExecution = {
				toolName: "undefined-throw-tool",
				execute: mockToolFunction.mockImplementation(() => {
					throw undefined
				}),
				params: { action: "test" },
			}

			const settings: RetrySettings = {
				enableRetry: true,
				maxRetryAttempts: 2,
				baseDelayMs: 100,
				retryTimeoutMs: 5000,
			}

			const delaySpy = vi.spyOn(global, "setTimeout").mockImplementation((cb) => {
				cb()
				return 1 as any
			})

			const result = await retryEngine.executeWithRetry(execution, settings)

			expect(result.success).toBe(false)
			expect(result.error).toBeDefined()

			delaySpy.mockRestore()
		})
	})

	describe("Boundary Condition Testing", () => {
		test("should handle maximum safe integer values", async () => {
			const execution: RetryExecution = {
				toolName: "max-int-tool",
				execute: mockToolFunction.mockResolvedValue({ success: true }),
				params: {
					maxValue: Number.MAX_SAFE_INTEGER,
					minValue: Number.MIN_SAFE_INTEGER,
				},
			}

			const settings: RetrySettings = {
				enableRetry: true,
				maxRetryAttempts: 1,
				baseDelayMs: Number.MAX_SAFE_INTEGER, // Extremely large delay
				retryTimeoutMs: Number.MAX_SAFE_INTEGER, // Extremely large timeout
			}

			const result = await retryEngine.executeWithRetry(execution, settings)

			expect(result.success).toBe(true)
			expect(result.attempts).toBe(1)
		})

		test("should handle infinity values", async () => {
			const execution: RetryExecution = {
				toolName: "infinity-tool",
				execute: mockToolFunction.mockResolvedValue({ success: true }),
				params: {
					infiniteValue: Infinity,
					negativeInfiniteValue: -Infinity,
				},
			}

			const settings: RetrySettings = {
				enableRetry: true,
				maxRetryAttempts: 1,
				baseDelayMs: 1000,
				retryTimeoutMs: 5000,
			}

			const result = await retryEngine.executeWithRetry(execution, settings)

			expect(result.success).toBe(true)
			expect(result.attempts).toBe(1)
		})

		test("should handle NaN values", async () => {
			const execution: RetryExecution = {
				toolName: "nan-tool",
				execute: mockToolFunction.mockResolvedValue({ success: true }),
				params: {
					nanValue: NaN,
				},
			}

			const settings: RetrySettings = {
				enableRetry: true,
				maxRetryAttempts: 1,
				baseDelayMs: 1000,
				retryTimeoutMs: 5000,
			}

			const result = await retryEngine.executeWithRetry(execution, settings)

			expect(result.success).toBe(true)
			expect(result.attempts).toBe(1)
		})
	})

	describe("Resource Cleanup Edge Cases", () => {
		test("should cleanup after abrupt termination", async () => {
			const execution: RetryExecution = {
				toolName: "abrupt-termination-tool",
				execute: mockToolFunction.mockImplementation(() => {
					// Simulate abrupt termination
					process.nextTick(() => {
						throw new Error("Abrupt termination")
					})
					return new Promise(() => {}) // Never resolves
				}),
				params: { action: "test" },
			}

			const settings: RetrySettings = {
				enableRetry: true,
				maxRetryAttempts: 2,
				baseDelayMs: 100,
				retryTimeoutMs: 200, // Short timeout
			}

			const result = await retryEngine.executeWithRetry(execution, settings)

			expect(result.success).toBe(false)
			expect(result.error?.message).toContain("timeout")

			// Verify cleanup
			const state = retryEngine.getState()
			expect(state.activeRetries.length).toBe(0)
		})

		test("should handle cleanup during concurrent operations", async () => {
			const executions = Array.from({ length: 10 }, (_, i) => ({
				toolName: "cleanup-concurrent-tool",
				execute: mockToolFunction.mockImplementation(() => {
					return new Promise((resolve) => {
						setTimeout(() => resolve({ success: true, id: i }), 100)
					})
				}),
				params: { id: i },
			}))

			const settings: RetrySettings = {
				enableRetry: true,
				maxRetryAttempts: 1,
				baseDelayMs: 50,
				retryTimeoutMs: 1000,
			}

			const promises = executions.map((exec) => retryEngine.executeWithRetry(exec, settings))

			const results = await Promise.all(promises)

			// All should succeed and cleanup properly
			results.forEach((result, index) => {
				expect(result.success).toBe(true)
				expect(result.result.id).toBe(index)
			})

			// Verify all are cleaned up
			const state = retryEngine.getState()
			expect(state.activeRetries.length).toBe(0)
		})
	})
})
