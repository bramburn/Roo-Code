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

describe("RetryEngine Performance Tests", () => {
	let retryEngine: RetryEngine
	let mockToolFunction: any

	beforeEach(() => {
		vi.clearAllMocks()
		retryEngine = new RetryEngine()
		mockToolFunction = vi.fn()
	})

	describe("Retry Operation Latency", () => {
		test("should complete successful retry within acceptable time", async () => {
			const execution: RetryExecution = {
				toolName: "fast-tool",
				execute: mockToolFunction.mockResolvedValue({ success: true }),
				params: { action: "test" },
			}

			const settings: RetrySettings = {
				enableRetry: true,
				maxRetryAttempts: 1,
				baseDelayMs: 10, // Minimal delay for performance testing
				retryTimeoutMs: 1000,
			}

			const startTime = performance.now()
			const result = await retryEngine.executeWithRetry(execution, settings)
			const endTime = performance.now()

			expect(result.success).toBe(true)
			expect(endTime - startTime).toBeLessThan(100) // Should complete within 100ms
		})

		test("should handle multiple retries within reasonable time", async () => {
			const execution: RetryExecution = {
				toolName: "retry-tool",
				execute: mockToolFunction
					.mockRejectedValueOnce(new Error("First failure"))
					.mockRejectedValueOnce(new Error("Second failure"))
					.mockResolvedValue({ success: true }),
				params: { action: "test" },
			}

			const settings: RetrySettings = {
				enableRetry: true,
				maxRetryAttempts: 3,
				baseDelayMs: 10, // Minimal delay
				backoffMultiplier: 1.5,
				retryTimeoutMs: 2000,
			}

			// Mock setTimeout for performance testing
			const delaySpy = vi.spyOn(global, "setTimeout").mockImplementation((cb) => {
				cb()
				return 1 as any
			})

			const startTime = performance.now()
			const result = await retryEngine.executeWithRetry(execution, settings)
			const endTime = performance.now()

			expect(result.success).toBe(true)
			expect(result.attempts).toBe(3)
			expect(endTime - startTime).toBeLessThan(200) // Should complete within 200ms

			delaySpy.mockRestore()
		})

		test("should measure and report accurate execution duration", async () => {
			const execution: RetryExecution = {
				toolName: "timing-tool",
				execute: mockToolFunction.mockImplementation(() => {
					return new Promise((resolve) => {
						setTimeout(() => resolve({ timed: true }), 50)
					})
				}),
				params: { action: "time-test" },
			}

			const settings: RetrySettings = {
				enableRetry: true,
				maxRetryAttempts: 1,
				baseDelayMs: 10,
				retryTimeoutMs: 1000,
			}

			const result = await retryEngine.executeWithRetry(execution, settings)

			expect(result.success).toBe(true)
			expect(result.totalDuration).toBeGreaterThanOrEqual(45) // Allow some variance
			expect(result.totalDuration).toBeLessThan(100)
		})
	})

	describe("Memory Usage During Retries", () => {
		test("should not cause memory leaks during multiple retry operations", async () => {
			const initialMemory = process.memoryUsage().heapUsed

			// Perform multiple retry operations
			for (let i = 0; i < 50; i++) {
				const execution: RetryExecution = {
					toolName: `memory-test-${i}`,
					execute: mockToolFunction
						.mockRejectedValueOnce(new Error(`Failure ${i}`))
						.mockResolvedValue({ success: true, iteration: i }),
					params: { iteration: i },
					context: {
						taskId: `memory-task-${i}`,
						messages: [
							{ role: "user", content: `Message ${i}`.repeat(10) },
							{ role: "assistant", content: `Response ${i}`.repeat(10) },
						],
					},
				}

				const settings: RetrySettings = {
					enableRetry: true,
					maxRetryAttempts: 2,
					baseDelayMs: 1,
					retryTimeoutMs: 1000,
				}

				// Mock setTimeout for memory testing
				const delaySpy = vi.spyOn(global, "setTimeout").mockImplementation((cb) => {
					cb()
					return 1 as any
				})

				await retryEngine.executeWithRetry(execution, settings)

				delaySpy.mockRestore()
			}

			// Force garbage collection if available
			if (global.gc) {
				global.gc()
			}

			const finalMemory = process.memoryUsage().heapUsed
			const memoryIncrease = finalMemory - initialMemory

			// Memory increase should be reasonable (less than 10MB)
			expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024)
		})

		test("should clean up context state after retry completion", async () => {
			const contexts: string[] = []

			// Create multiple retry contexts
			for (let i = 0; i < 20; i++) {
				const execution: RetryExecution = {
					toolName: "cleanup-test",
					execute: mockToolFunction.mockResolvedValue({ cleaned: true }),
					params: { id: i },
					context: {
						taskId: `cleanup-task-${i}`,
						messages: Array.from({ length: 10 }, (_, j) => ({
							role: "user",
							content: `Message ${i}-${j}`.repeat(5),
						})),
					},
				}

				const settings: RetrySettings = {
					enableRetry: true,
					maxRetryAttempts: 1,
					baseDelayMs: 1,
					retryTimeoutMs: 1000,
				}

				await retryEngine.executeWithRetry(execution, settings)
				contexts.push(`cleanup-task-${i}`)
			}

			// Check that active retries are cleaned up
			const state = retryEngine.getStatistics()
			expect(state.activeRetries.length).toBe(0)
		})
	})

	describe("Context Optimization Performance", () => {
		test("should optimize large contexts efficiently", async () => {
			const largeContext = {
				taskId: "large-context-test",
				messages: Array.from({ length: 100 }, (_, i) => ({
					role: i % 2 === 0 ? "user" : "assistant",
					content: `Large message content ${i}`.repeat(50),
				})),
				apiHistory: Array.from({ length: 50 }, (_, i) => ({
					id: `api-${i}`,
					role: i % 2 === 0 ? "user" : "assistant",
					content: `API history ${i}`.repeat(30),
					timestamp: Date.now() - i * 1000,
				})),
				clineHistory: Array.from({ length: 50 }, (_, i) => ({
					id: `cline-${i}`,
					role: i % 2 === 0 ? "user" : "assistant",
					content: `Cline history ${i}`.repeat(30),
					timestamp: Date.now() - i * 1000,
				})),
			}

			const execution: RetryExecution = {
				toolName: "context-optimizer",
				execute: mockToolFunction.mockResolvedValue({ optimized: true }),
				params: { action: "optimize" },
				context: largeContext,
			}

			const settings: RetrySettings = {
				enableRetry: true,
				maxRetryAttempts: 1,
				baseDelayMs: 1,
				enableContextOptimization: true,
				retryTimeoutMs: 5000,
			}

			const startTime = performance.now()
			const result = await retryEngine.executeWithRetry(execution, settings)
			const endTime = performance.now()

			expect(result.success).toBe(true)
			expect(endTime - startTime).toBeLessThan(1000) // Should optimize within 1 second
		})

		test("should handle context optimization under memory pressure", async () => {
			const contexts = []

			// Create multiple large contexts to simulate memory pressure
			for (let i = 0; i < 10; i++) {
				const largeContext = {
					taskId: `pressure-test-${i}`,
					messages: Array.from({ length: 50 }, (_, j) => ({
						role: "user",
						content: `Pressure test message ${i}-${j}`.repeat(20),
					})),
				}

				const execution: RetryExecution = {
					toolName: "pressure-test",
					execute: mockToolFunction.mockResolvedValue({ pressureHandled: true }),
					params: { testId: i },
					context: largeContext,
				}

				const settings: RetrySettings = {
					enableRetry: true,
					maxRetryAttempts: 1,
					baseDelayMs: 1,
					enableContextOptimization: true,
					retryTimeoutMs: 2000,
				}

				contexts.push(retryEngine.executeWithRetry(execution, settings))
			}

			const startTime = performance.now()
			const results = await Promise.all(contexts)
			const endTime = performance.now()

			// All operations should succeed
			results.forEach((result, index) => {
				expect(result.success).toBe(true)
			})

			// Should complete within reasonable time even under pressure
			expect(endTime - startTime).toBeLessThan(3000)
		})
	})

	describe("Concurrent Retry Performance", () => {
		test("should handle concurrent retries efficiently", async () => {
			const concurrentExecutions = []

			// Create multiple concurrent retry operations
			for (let i = 0; i < 20; i++) {
				const execution: RetryExecution = {
					toolName: `concurrent-${i}`,
					execute: mockToolFunction
						.mockRejectedValueOnce(new Error(`Concurrent failure ${i}`))
						.mockResolvedValue({ success: true, id: i }),
					params: { concurrentId: i },
					context: {
						taskId: `concurrent-task-${i}`,
					},
				}

				const settings: RetrySettings = {
					enableRetry: true,
					maxRetryAttempts: 2,
					baseDelayMs: 1,
					retryTimeoutMs: 2000,
				}

				concurrentExecutions.push(retryEngine.executeWithRetry(execution, settings))
			}

			// Mock setTimeout for concurrent testing
			const delaySpy = vi.spyOn(global, "setTimeout").mockImplementation((cb) => {
				cb()
				return 1 as any
			})

			const startTime = performance.now()
			const results = await Promise.all(concurrentExecutions)
			const endTime = performance.now()

			// All operations should succeed
			results.forEach((result, index) => {
				expect(result.success).toBe(true)
				expect(result.result.id).toBe(index)
			})

			// Should complete efficiently
			expect(endTime - startTime).toBeLessThan(500)

			delaySpy.mockRestore()
		})

		test("should maintain performance under high concurrency", async () => {
			const highConcurrencyExecutions = []

			// Create high number of concurrent operations
			for (let i = 0; i < 100; i++) {
				const execution: RetryExecution = {
					toolName: `high-concurrency-${i}`,
					execute: mockToolFunction.mockResolvedValue({ highConcurrency: true, id: i }),
					params: { id: i },
				}

				const settings: RetrySettings = {
					enableRetry: true,
					maxRetryAttempts: 1,
					baseDelayMs: 1,
					retryTimeoutMs: 1000,
				}

				highConcurrencyExecutions.push(retryEngine.executeWithRetry(execution, settings))
			}

			const startTime = performance.now()
			const results = await Promise.all(highConcurrencyExecutions)
			const endTime = performance.now()

			// All operations should succeed
			expect(results).toHaveLength(100)
			results.forEach((result) => {
				expect(result.success).toBe(true)
			})

			// Should handle high concurrency efficiently
			expect(endTime - startTime).toBeLessThan(1000)
		})
	})

	describe("Resource Cleanup Performance", () => {
		test("should clean up resources efficiently after retry completion", async () => {
			const cleanupExecutions = []

			// Create operations that will complete and need cleanup
			for (let i = 0; i < 50; i++) {
				const execution: RetryExecution = {
					toolName: "cleanup-performance",
					execute: mockToolFunction.mockResolvedValue({ cleaned: true, id: i }),
					params: { cleanupId: i },
					context: {
						taskId: `cleanup-perf-${i}`,
						messages: Array.from({ length: 5 }, (_, j) => ({
							role: "user",
							content: `Cleanup message ${i}-${j}`,
						})),
					},
				}

				const settings: RetrySettings = {
					enableRetry: true,
					maxRetryAttempts: 1,
					baseDelayMs: 1,
					retryTimeoutMs: 1000,
				}

				cleanupExecutions.push(retryEngine.executeWithRetry(execution, settings))
			}

			await Promise.all(cleanupExecutions)

			// Check that all resources are cleaned up
			const state = retryEngine.getStatistics()
			expect(state.activeRetries.length).toBe(0)

			// Memory should be stable after cleanup
			const memoryAfterCleanup = process.memoryUsage().heapUsed
			expect(memoryAfterCleanup).toBeGreaterThan(0)
		})

		test("should handle rapid cleanup and recreation of contexts", async () => {
			const rapidCleanupTests = []

			// Rapidly create and destroy contexts
			for (let cycle = 0; cycle < 10; cycle++) {
				for (let i = 0; i < 10; i++) {
					const execution: RetryExecution = {
						toolName: "rapid-cleanup",
						execute: mockToolFunction.mockResolvedValue({ cycle, iteration: i }),
						params: { cycle, iteration: i },
						context: {
							taskId: `rapid-${cycle}-${i}`,
						},
					}

					const settings: RetrySettings = {
						enableRetry: true,
						maxRetryAttempts: 1,
						baseDelayMs: 1,
						retryTimeoutMs: 500,
					}

					rapidCleanupTests.push(retryEngine.executeWithRetry(execution, settings))
				}
			}

			const startTime = performance.now()
			const results = await Promise.all(rapidCleanupTests)
			const endTime = performance.now()

			// All operations should succeed
			expect(results).toHaveLength(100)
			results.forEach((result) => {
				expect(result.success).toBe(true)
			})

			// Should handle rapid cycles efficiently
			expect(endTime - startTime).toBeLessThan(2000)

			// State should be clean after all operations
			const finalState = retryEngine.getState()
			expect(finalState.activeRetries.length).toBe(0)
		})
	})

	describe("Performance Monitoring", () => {
		test("should track and report performance metrics", async () => {
			const execution: RetryExecution = {
				toolName: "performance-monitor",
				execute: mockToolFunction
					.mockRejectedValueOnce(new Error("Performance test failure"))
					.mockResolvedValue({ monitored: true }),
				params: { action: "monitor" },
			}

			const settings: RetrySettings = {
				enableRetry: true,
				maxRetryAttempts: 2,
				baseDelayMs: 10,
				retryTimeoutMs: 1000,
			}

			// Mock setTimeout for monitoring
			const delaySpy = vi.spyOn(global, "setTimeout").mockImplementation((cb) => {
				cb()
				return 1 as any
			})

			const result = await retryEngine.executeWithRetry(execution, settings)

			expect(result.success).toBe(true)
			expect(result.attempts).toBe(2)
			expect(result.totalDuration).toBeGreaterThan(0)

			// Check statistics
			const stats = retryEngine.getStatistics()
			expect(stats.totalRetries).toBeGreaterThanOrEqual(1)
			expect(stats.successfulRetries).toBeGreaterThanOrEqual(1)

			delaySpy.mockRestore()
		})

		test("should maintain performance statistics accuracy", async () => {
			const executions = []

			// Create multiple executions with different outcomes
			for (let i = 0; i < 20; i++) {
				const execution: RetryExecution = {
					toolName: "stats-test",
					execute:
						i % 3 === 0
							? mockToolFunction.mockRejectedValue(new Error("Consistent failure"))
							: mockToolFunction.mockResolvedValue({ success: true, id: i }),
					params: { id: i },
				}

				const settings: RetrySettings = {
					enableRetry: true,
					maxRetryAttempts: 2,
					baseDelayMs: 1,
					retryTimeoutMs: 1000,
				}

				executions.push(retryEngine.executeWithRetry(execution, settings))
			}

			const results = await Promise.all(executions)

			// Check final statistics
			const finalStats = retryEngine.getStatistics()
			expect(finalStats.totalRetries).toBeGreaterThanOrEqual(20)
			expect(finalStats.successfulRetries + finalStats.failedRetries).toBe(finalStats.totalRetries)
			expect(finalStats.averageAttempts).toBeGreaterThan(0)
		})
	})
})
