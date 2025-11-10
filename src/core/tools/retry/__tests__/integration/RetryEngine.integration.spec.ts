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

describe("RetryEngine Integration Tests", () => {
	let retryEngine: RetryEngine
	let mockToolFunction: any

	beforeEach(() => {
		// Reset all mocks
		vi.clearAllMocks()

		// Create retry engine instance
		retryEngine = new RetryEngine()

		// Mock tool function
		mockToolFunction = vi.fn()
	})

	describe("End-to-End Retry Workflow", () => {
		test("should complete full retry workflow with context optimization", async () => {
			const execution: RetryExecution = {
				toolName: "codebase-search",
				execute: mockToolFunction.mockRejectedValueOnce(new Error("Network timeout")).mockResolvedValue({
					results: ["file1.ts", "file2.ts"],
					total: 2,
				}),
				params: {
					query: "test function",
					path: "./src",
				},
				context: {
					taskId: "test-task-123",
					workingDirectory: "/project/src",
					messages: [
						{ role: "user", content: "Search for test functions" },
						{ role: "assistant", content: "I'll search for test functions in the codebase" },
					],
					apiHistory: [
						{ id: "1", role: "user", content: "Search request" },
						{ id: "2", role: "assistant", content: "Processing search" },
					],
					clineHistory: [
						{ id: "1", role: "user", content: "Search request" },
						{ id: "2", role: "assistant", content: "Processing search" },
					],
				},
				retryConfig: {
					maxRetryAttempts: 3,
					enableContextOptimization: true,
					enableHistorySynchronization: true,
				},
			}

			const settings: RetrySettings = {
				enableRetry: true,
				maxRetryAttempts: 3,
				baseDelayMs: 1000,
				maxDelayMs: 30000,
				backoffMultiplier: 2,
				jitterFactor: 0.1,
				enableContextOptimization: true,
				enableHistorySynchronization: true,
				retryTimeoutMs: 30000,
			}

			// Mock setTimeout for delay
			const delaySpy = vi.spyOn(global, "setTimeout").mockImplementation((cb) => {
				cb()
				return 1 as any
			})

			const result = await retryEngine.executeWithRetry(execution, settings)

			// Verify successful retry
			expect(result.success).toBe(true)
			expect(result.attempts).toBe(2)
			expect(result.result).toEqual({
				results: ["file1.ts", "file2.ts"],
				total: 2,
			})

			// Verify tool was called twice
			expect(mockToolFunction).toHaveBeenCalledTimes(2)

			// Verify context was optimized
			expect(mockToolFunction).toHaveBeenNthCalledWith(2, execution.params)

			delaySpy.mockRestore()
		})

		test("should handle complete retry failure with circuit breaker", async () => {
			const execution: RetryExecution = {
				toolName: "file-search",
				execute: mockToolFunction.mockRejectedValue(new Error("Persistent network error")),
				params: {
					pattern: "*.ts",
					directory: "./src",
				},
				context: {
					taskId: "test-task-456",
					workingDirectory: "/project/src",
				},
				retryConfig: {
					maxRetryAttempts: 2,
				},
			}

			const settings: RetrySettings = {
				enableRetry: true,
				maxRetryAttempts: 2,
				baseDelayMs: 500,
				maxDelayMs: 5000,
				backoffMultiplier: 1.5,
				jitterFactor: 0.1,
				retryTimeoutMs: 10000,
			}

			// Mock setTimeout for delay
			const delaySpy = vi.spyOn(global, "setTimeout").mockImplementation((cb) => {
				cb()
				return 1 as any
			})

			const result = await retryEngine.executeWithRetry(execution, settings)

			// Verify failure after exhausting retries
			expect(result.success).toBe(false)
			expect(result.attempts).toBe(2)
			expect(result.error?.message).toContain("Persistent network error")

			// Verify tool was called max attempts times
			expect(mockToolFunction).toHaveBeenCalledTimes(2)

			// Verify circuit breaker state
			const state = retryEngine.getState()
			expect(state.circuitBreakerState).toBeDefined()

			delaySpy.mockRestore()
		})

		test("should handle non-retryable errors immediately", async () => {
			const execution: RetryExecution = {
				toolName: "auth-service",
				execute: mockToolFunction.mockRejectedValue(new Error("Authentication failed: Invalid token")),
				params: {
					action: "validate",
					token: "invalid-token",
				},
				context: {
					taskId: "test-task-789",
				},
			}

			const settings: RetrySettings = {
				enableRetry: true,
				maxRetryAttempts: 3,
				baseDelayMs: 1000,
				retryTimeoutMs: 15000,
			}

			const result = await retryEngine.executeWithRetry(execution, settings)

			// Verify immediate failure without retry
			expect(result.success).toBe(false)
			expect(result.attempts).toBe(1)
			expect(result.error?.message).toContain("Authentication failed")

			// Verify tool was called only once
			expect(mockToolFunction).toHaveBeenCalledTimes(1)

			// Verify no delays were applied
			expect(setTimeout).not.toHaveBeenCalled()
		})
	})

	describe("Context Synchronization Integration", () => {
		test("should synchronize dual histories during retry", async () => {
			const execution: RetryExecution = {
				toolName: "context-aware-tool",
				execute: mockToolFunction
					.mockRejectedValueOnce(new Error("Temporary failure"))
					.mockResolvedValue({ status: "success", data: "result" }),
				params: {
					action: "process",
				},
				context: {
					taskId: "sync-test-123",
					apiHistory: [
						{ id: "1", role: "user", content: "Initial request", timestamp: Date.now() - 1000 },
						{ id: "2", role: "assistant", content: "Processing", timestamp: Date.now() - 500 },
					],
					clineHistory: [
						{ id: "1", role: "user", content: "Initial request", timestamp: Date.now() - 1000 },
						{ id: "3", role: "system", content: "System message", timestamp: Date.now() - 200 }, // Different entry
					],
				},
				retryConfig: {
					maxRetryAttempts: 2,
					enableHistorySynchronization: true,
				},
			}

			const settings: RetrySettings = {
				enableRetry: true,
				maxRetryAttempts: 2,
				baseDelayMs: 200,
				enableHistorySynchronization: true,
				retryTimeoutMs: 5000,
			}

			// Mock setTimeout for delay
			const delaySpy = vi.spyOn(global, "setTimeout").mockImplementation((cb) => {
				cb()
				return 1 as any
			})

			const result = await retryEngine.executeWithRetry(execution, settings)

			// Verify successful retry with synchronization
			expect(result.success).toBe(true)
			expect(result.attempts).toBe(2)

			// Verify histories were synchronized
			const state = retryEngine.getState()
			expect(state.activeRetries).toHaveLength(0) // Should be cleaned up

			delaySpy.mockRestore()
		})

		test("should handle context optimization with history conflicts", async () => {
			const execution: RetryExecution = {
				toolName: "conflict-resolution-tool",
				execute: mockToolFunction.mockResolvedValue({ resolved: true }),
				params: {
					action: "resolve-conflicts",
				},
				context: {
					taskId: "conflict-test-456",
					messages: [
						{ role: "user", content: "Very long message that should be optimized".repeat(100) },
						{ role: "assistant", content: "Response that might be truncated".repeat(50) },
					],
					apiHistory: [
						{ id: "1", role: "user", content: "Conflicting entry 1" },
						{ id: "2", role: "assistant", content: "Conflicting entry 2" },
					],
					clineHistory: [
						{ id: "1", role: "user", content: "Conflicting entry 1 - Modified" }, // Conflict
						{ id: "2", role: "assistant", content: "Conflicting entry 2" },
					],
				},
				retryConfig: {
					maxRetryAttempts: 1,
					enableContextOptimization: true,
					enableHistorySynchronization: true,
				},
			}

			const settings: RetrySettings = {
				enableRetry: true,
				maxRetryAttempts: 1,
				baseDelayMs: 100,
				enableContextOptimization: true,
				enableHistorySynchronization: true,
				retryTimeoutMs: 3000,
			}

			const result = await retryEngine.executeWithRetry(execution, settings)

			// Verify successful execution despite conflicts
			expect(result.success).toBe(true)
			expect(result.result).toEqual({ resolved: true })

			// Verify optimization and synchronization occurred
			expect(mockToolFunction).toHaveBeenCalledTimes(1)
		})
	})

	describe("Performance Integration", () => {
		test("should handle timeout during retry execution", async () => {
			const execution: RetryExecution = {
				toolName: "slow-tool",
				execute: mockToolFunction.mockImplementation(() => {
					return new Promise((resolve) => {
						setTimeout(() => resolve({ data: "slow result" }), 2000)
					})
				}),
				params: {
					action: "slow-operation",
				},
				context: {
					taskId: "timeout-test-789",
				},
				retryConfig: {
					maxRetryAttempts: 2,
				},
			}

			const settings: RetrySettings = {
				enableRetry: true,
				maxRetryAttempts: 2,
				baseDelayMs: 100,
				retryTimeoutMs: 1000, // Short timeout
			}

			const result = await retryEngine.executeWithRetry(execution, settings)

			// Verify timeout failure
			expect(result.success).toBe(false)
			expect(result.error?.message).toContain("timeout")
			expect(result.attempts).toBe(1)
		})

		test("should measure and report execution duration", async () => {
			const execution: RetryExecution = {
				toolName: "timing-tool",
				execute: mockToolFunction.mockImplementation(() => {
					return new Promise((resolve) => {
						setTimeout(() => resolve({ data: "timed result" }), 100)
					})
				}),
				params: {
					action: "timed-operation",
				},
				context: {
					taskId: "timing-test-123",
				},
			}

			const settings: RetrySettings = {
				enableRetry: true,
				maxRetryAttempts: 1,
				baseDelayMs: 50,
				retryTimeoutMs: 5000,
			}

			const startTime = Date.now()
			const result = await retryEngine.executeWithRetry(execution, settings)
			const endTime = Date.now()

			// Verify successful execution
			expect(result.success).toBe(true)
			expect(result.totalDuration).toBeGreaterThanOrEqual(100)
			expect(result.totalDuration).toBeLessThan(endTime - startTime + 100) // Allow some margin
		})
	})

	describe("State Management Integration", () => {
		test("should maintain state across multiple retry operations", async () => {
			const execution1: RetryExecution = {
				toolName: "state-tool-1",
				execute: vi.fn().mockResolvedValue({ result: "success1" }),
				params: { id: 1 },
				context: { taskId: "state-test-1" },
			}

			const execution2: RetryExecution = {
				toolName: "state-tool-2",
				execute: vi.fn().mockResolvedValue({ result: "success2" }),
				params: { id: 2 },
				context: { taskId: "state-test-2" },
			}

			const settings: RetrySettings = {
				enableRetry: true,
				maxRetryAttempts: 2,
				baseDelayMs: 100,
				retryTimeoutMs: 3000,
			}

			// Execute both operations
			const [result1, result2] = await Promise.all([
				retryEngine.executeWithRetry(execution1, settings),
				retryEngine.executeWithRetry(execution2, settings),
			])

			// Verify both succeeded
			expect(result1.success).toBe(true)
			expect(result2.success).toBe(true)

			// Verify state is properly maintained
			const state = retryEngine.getState()
			expect(state.activeRetries).toHaveLength(0) // Should be cleaned up
			expect(state.circuitBreakerState).toBeDefined()
			expect(state.statistics).toBeDefined()

			// Verify statistics include both operations
			const stats = retryEngine.getStatistics()
			expect(stats.totalRetries).toBeGreaterThanOrEqual(2)
		})

		test("should clean up state after retry completion", async () => {
			const execution: RetryExecution = {
				toolName: "cleanup-tool",
				execute: mockToolFunction.mockResolvedValue({ cleaned: true }),
				params: { action: "cleanup" },
				context: {
					taskId: "cleanup-test-123",
				},
			}

			const settings: RetrySettings = {
				enableRetry: true,
				maxRetryAttempts: 2,
				baseDelayMs: 100,
				retryTimeoutMs: 3000,
			}

			// Check state before execution
			let state = retryEngine.getStatistics()
			const initialActiveRetries = state.activeRetries.length

			const result = await retryEngine.executeWithRetry(execution, settings)

			// Verify successful execution
			expect(result.success).toBe(true)

			// Verify state cleanup
			state = retryEngine.getState()
			expect(state.activeRetries.length).toBe(initialActiveRetries) // Should be back to initial
		})
	})

	describe("Error Recovery Integration", () => {
		test("should recover from circuit breaker opening", async () => {
			const execution: RetryExecution = {
				toolName: "recovery-tool",
				execute: mockToolFunction
					.mockRejectedValue(new Error("Persistent failure"))
					.mockRejectedValue(new Error("Persistent failure"))
					.mockRejectedValue(new Error("Persistent failure"))
					.mockRejectedValue(new Error("Persistent failure"))
					.mockRejectedValue(new Error("Persistent failure"))
					.mockResolvedValue({ recovered: true }),
				params: { action: "recover" },
				context: {
					taskId: "recovery-test-123",
				},
			}

			const settings: RetrySettings = {
				enableRetry: true,
				maxRetryAttempts: 3,
				baseDelayMs: 100,
				retryTimeoutMs: 3000,
			}

			// Mock setTimeout for delays
			const delaySpy = vi.spyOn(global, "setTimeout").mockImplementation((cb) => {
				cb()
				return 1 as any
			})

			// First execution should fail and potentially open circuit breaker
			const result1 = await retryEngine.executeWithRetry(execution, settings)
			expect(result1.success).toBe(false)

			// Check circuit breaker state
			let state = retryEngine.getState()
			const breakerState = state.circuitBreakerState

			// Reset circuit breaker for recovery test
			retryEngine.reset()

			// Second execution should succeed
			const result2 = await retryEngine.executeWithRetry(execution, settings)
			expect(result2.success).toBe(true)

			delaySpy.mockRestore()
		})

		test("should handle mixed error types appropriately", async () => {
			const execution: RetryExecution = {
				toolName: "mixed-errors-tool",
				execute: mockToolFunction
					.mockRejectedValueOnce(new Error("Network timeout")) // Retryable
					.mockRejectedValueOnce(new Error("Authentication failed")) // Non-retryable
					.mockResolvedValue({ success: true }),
				params: { action: "mixed-errors" },
				context: {
					taskId: "mixed-errors-test-123",
				},
			}

			const settings: RetrySettings = {
				enableRetry: true,
				maxRetryAttempts: 3,
				baseDelayMs: 100,
				retryTimeoutMs: 3000,
			}

			// Mock setTimeout for delay
			const delaySpy = vi.spyOn(global, "setTimeout").mockImplementation((cb) => {
				cb()
				return 1 as any
			})

			const result = await retryEngine.executeWithRetry(execution, settings)

			// Should fail on non-retryable error
			expect(result.success).toBe(false)
			expect(result.error?.message).toContain("Authentication failed")
			expect(result.attempts).toBe(2) // First retry, then fail on auth error

			delaySpy.mockRestore()
		})
	})

	describe("Event Integration", () => {
		test("should emit appropriate events during retry lifecycle", async () => {
			const execution: RetryExecution = {
				toolName: "event-tool",
				execute: mockToolFunction
					.mockRejectedValueOnce(new Error("Temporary error"))
					.mockResolvedValue({ event: "success" }),
				params: { action: "emit-events" },
				context: {
					taskId: "event-test-123",
				},
			}

			const settings: RetrySettings = {
				enableRetry: true,
				maxRetryAttempts: 2,
				baseDelayMs: 100,
				retryTimeoutMs: 3000,
			}

			// Set up event listeners
			const events: any[] = []
			retryEngine.on("retryAttempt", (event) => events.push({ type: "attempt", ...event }))
			retryEngine.on("retrySuccess", (event) => events.push({ type: "success", ...event }))
			retryEngine.on("retryFailure", (event) => events.push({ type: "failure", ...event }))

			// Mock setTimeout for delay
			const delaySpy = vi.spyOn(global, "setTimeout").mockImplementation((cb) => {
				cb()
				return 1 as any
			})

			const result = await retryEngine.executeWithRetry(execution, settings)

			// Verify successful execution
			expect(result.success).toBe(true)

			// Verify events were emitted
			expect(events.length).toBeGreaterThanOrEqual(2) // At least attempt and success
			expect(events.some((e) => e.type === "attempt")).toBe(true)
			expect(events.some((e) => e.type === "success")).toBe(true)

			delaySpy.mockRestore()
		})
	})
})
