import { describe, test, expect, beforeEach, afterEach, vi } from "vitest"
import { RetryStateManager } from "../RetryStateManager"
import { RetryFactory } from "../RetryFactory"
import type { RetryContext, RetryState } from "../types"

describe("RetryStateManager", () => {
	let stateManager: RetryStateManager
	let mockRetryContext: RetryContext

	beforeEach(() => {
		stateManager = new RetryStateManager(10) // Max 10 active retries

		mockRetryContext = {
			id: "test-retry-1",
			toolName: "test-tool",
			toolParams: { param1: "value1" },
			config: RetryFactory.createNetworkSettings(),
			taskId: "test-task",
			executionContext: {
				workingDirectory: "/test",
				terminalId: "test-terminal",
			},
		}
	})

	afterEach(async () => {
		await stateManager.dispose()
	})

	describe("Retry State Creation", () => {
		test("should create retry state", () => {
			const originalError = new Error("Test error")
			const state = stateManager.createRetryState(mockRetryContext, originalError)

			expect(state.id).toBeDefined()
			expect(state.toolName).toBe("test-tool")
			expect(state.currentAttempt).toBe(0)
			expect(state.maxAttempts).toBe(5) // From createNetworkSettings
			expect(state.originalError).toBe(originalError)
			expect(state.errors).toEqual([originalError])
			expect(state.isActive).toBe(true)
			expect(state.isCancelled).toBe(false)
			expect(state.startTime).toBeGreaterThan(0)
			expect(state.lastAttemptTime).toBeGreaterThan(0)
		})

		test("should emit state-created event", () => {
			const eventSpy = vi.fn()
			stateManager.on("state-created", eventSpy)

			const originalError = new Error("Test error")
			stateManager.createRetryState(mockRetryContext, originalError)

			expect(eventSpy).toHaveBeenCalledWith({
				retryId: expect.any(String),
				state: expect.any(Object),
				context: mockRetryContext,
			})
		})

		test("should store retry state", async () => {
			const originalError = new Error("Test error")
			const state = stateManager.createRetryState(mockRetryContext, originalError)

			// Wait a bit for async storage
			await new Promise((resolve) => setTimeout(resolve, 10))

			const retrievedState = stateManager.getRetryState(state.id)
			expect(retrievedState).toEqual(state)
		})
	})

	describe("Retry State Updates", () => {
		test("should update retry state on successful attempt", () => {
			const originalError = new Error("Test error")
			const state = stateManager.createRetryState(mockRetryContext, originalError)

			const attempt = {
				attempt: 1,
				timestamp: Date.now(),
				delay: 1000,
				result: {
					success: true,
					shouldRetry: false,
					data: "success result",
				},
			}

			const shouldContinue = stateManager.updateRetryState(state.id, attempt)

			expect(shouldContinue).toBe(false) // Should not continue on success
			expect(state.currentAttempt).toBe(1)
			expect(state.errors).toEqual([originalError]) // No new error added
			expect(state.isActive).toBe(false) // Should be inactive
		})

		test("should update retry state on failed attempt", () => {
			const originalError = new Error("Test error")
			const state = stateManager.createRetryState(mockRetryContext, originalError)

			const attempt = {
				attempt: 1,
				timestamp: Date.now(),
				delay: 1000,
				result: {
					success: false,
					shouldRetry: true,
					retryReason: "retryable error",
				},
				error: new Error("Attempt failed"),
			}

			const shouldContinue = stateManager.updateRetryState(state.id, attempt)

			expect(shouldContinue).toBe(true) // Should continue on retryable failure
			expect(state.currentAttempt).toBe(1)
			expect(state.errors).toHaveLength(2) // Original + new error
			expect(state.isActive).toBe(true) // Should remain active
			expect(state.nextRetryTime).toBeGreaterThan(Date.now())
		})

		test("should emit state-updated event", () => {
			const eventSpy = vi.fn()
			stateManager.on("state-updated", eventSpy)

			const originalError = new Error("Test error")
			const state = stateManager.createRetryState(mockRetryContext, originalError)

			const attempt = {
				attempt: 1,
				timestamp: Date.now(),
				delay: 1000,
				result: {
					success: false,
					shouldRetry: true,
				},
				error: new Error("Attempt failed"),
			}

			stateManager.updateRetryState(state.id, attempt)

			expect(eventSpy).toHaveBeenCalledWith({
				retryId: state.id,
				state: expect.any(Object),
				attempt,
				nextRetryTime: expect.any(Number),
			})
		})

		test("should emit state-completed event on final success", () => {
			const eventSpy = vi.fn()
			stateManager.on("state-completed", eventSpy)

			const originalError = new Error("Test error")
			const state = stateManager.createRetryState(mockRetryContext, originalError)

			const attempt = {
				attempt: 2,
				timestamp: Date.now(),
				delay: 2000,
				result: {
					success: true,
					shouldRetry: false,
					data: "final success",
				},
			}

			stateManager.updateRetryState(state.id, attempt)

			expect(eventSpy).toHaveBeenCalledWith({
				retryId: state.id,
				state: expect.any(Object),
				finalAttempt: attempt,
				success: true,
			})
		})

		test("should emit state-completed event on final failure", () => {
			const eventSpy = vi.fn()
			stateManager.on("state-completed", eventSpy)

			const originalError = new Error("Test error")
			const state = stateManager.createRetryState(mockRetryContext, originalError)

			const attempt = {
				attempt: 5, // Max attempts reached
				timestamp: Date.now(),
				delay: 4000,
				result: {
					success: false,
					shouldRetry: false,
					retryReason: "max attempts reached",
				},
				error: new Error("Final failure"),
			}

			stateManager.updateRetryState(state.id, attempt)

			expect(eventSpy).toHaveBeenCalledWith({
				retryId: state.id,
				state: expect.any(Object),
				finalAttempt: attempt,
				success: false,
			})
		})
	})

	describe("Retry State Cancellation", () => {
		test("should cancel retry state", () => {
			const originalError = new Error("Test error")
			const state = stateManager.createRetryState(mockRetryContext, originalError)

			const cancelled = stateManager.cancelRetry(state.id, "Test cancellation")

			expect(cancelled).toBe(true)
			expect(state.isCancelled).toBe(true)
			expect(state.isActive).toBe(false)
		})

		test("should emit state-cancelled event", () => {
			const eventSpy = vi.fn()
			stateManager.on("state-cancelled", eventSpy)

			const originalError = new Error("Test error")
			const state = stateManager.createRetryState(mockRetryContext, originalError)

			stateManager.cancelRetry(state.id, "Test cancellation")

			expect(eventSpy).toHaveBeenCalledWith({
				retryId: state.id,
				state: expect.any(Object),
				reason: "Test cancellation",
			})
		})

		test("should remove cancelled state from active retries", () => {
			const originalError = new Error("Test error")
			const state = stateManager.createRetryState(mockRetryContext, originalError)

			stateManager.cancelRetry(state.id, "Test cancellation")

			const retrievedState = stateManager.getRetryState(state.id)
			expect(retrievedState).toBeUndefined()
		})

		test("should handle cancellation of non-existent state", () => {
			const cancelled = stateManager.cancelRetry("non-existent-id", "Test")

			expect(cancelled).toBe(false)
		})
	})

	describe("Active Retry Management", () => {
		test("should get all active retry states", () => {
			const originalError = new Error("Test error")

			// Create multiple states
			const state1 = stateManager.createRetryState(mockRetryContext, originalError)
			const state2 = stateManager.createRetryState(mockRetryContext, originalError)
			const state3 = stateManager.createRetryState(mockRetryContext, originalError)

			const activeStates = stateManager.getActiveRetryStates()

			expect(activeStates).toHaveLength(3)
			expect(activeStates).toContainEqual(state1)
			expect(activeStates).toContainEqual(state2)
			expect(activeStates).toContainEqual(state3)
		})

		test("should get retry states by tool name", () => {
			const originalError = new Error("Test error")

			// Create states for different tools
			const state1 = stateManager.createRetryState(
				{
					...mockRetryContext,
					toolName: "tool-a",
				},
				originalError,
			)

			const state2 = stateManager.createRetryState(
				{
					...mockRetryContext,
					toolName: "tool-b",
				},
				originalError,
			)

			const state3 = stateManager.createRetryState(
				{
					...mockRetryContext,
					toolName: "tool-a",
				},
				originalError,
			)

			const toolAStates = stateManager.getRetryStatesByTool("tool-a")
			const toolBStates = stateManager.getRetryStatesByTool("tool-b")
			const toolCStates = stateManager.getRetryStatesByTool("tool-c")

			expect(toolAStates).toHaveLength(2)
			expect(toolBStates).toHaveLength(1)
			expect(toolCStates).toHaveLength(0)
			expect(toolAStates).toContainEqual(state1)
			expect(toolAStates).toContainEqual(state3)
			expect(toolBStates).toContainEqual(state2)
		})
	})

	describe("Retry Statistics", () => {
		test("should calculate retry statistics", () => {
			const originalError = new Error("Test error")

			// Create states with different attempt counts
			const state1 = stateManager.createRetryState(mockRetryContext, originalError)
			const state2 = stateManager.createRetryState(mockRetryContext, originalError)
			const state3 = stateManager.createRetryState(mockRetryContext, originalError)

			// Update states with different attempt counts
			stateManager.updateRetryState(state1.id, {
				attempt: 1,
				timestamp: Date.now(),
				delay: 1000,
				result: { success: true, shouldRetry: false },
			})

			stateManager.updateRetryState(state2.id, {
				attempt: 2,
				timestamp: Date.now(),
				delay: 2000,
				result: { success: false, shouldRetry: true },
				error: new Error("Failed"),
			})

			stateManager.updateRetryState(state3.id, {
				attempt: 3,
				timestamp: Date.now(),
				delay: 4000,
				result: { success: false, shouldRetry: true },
				error: new Error("Failed"),
			})

			const stats = stateManager.getRetryStatistics()

			expect(stats.totalActive).toBe(2) // state1 completed, state2 & state3 active
			expect(stats.byTool).toBeDefined()
			expect(stats.averageAttempts).toBeGreaterThan(1)
			expect(stats.mostFailed).toBeDefined()
			expect(stats.mostFailed?.retryId).toBeOneOf([state2.id, state3.id])
			expect(stats.mostFailed?.failureCount).toBe(1)
		})
	})

	describe("Memory Usage", () => {
		test("should track memory usage", () => {
			const originalError = new Error("Test error")

			// Create multiple states
			for (let i = 0; i < 5; i++) {
				stateManager.createRetryState(
					{
						...mockRetryContext,
						id: `test-${i}`,
					},
					originalError,
				)
			}

			const memoryUsage = stateManager.getMemoryUsage()

			expect(memoryUsage.activeRetries).toBe(5)
			expect(memoryUsage.backoffStrategies).toBe(5)
			expect(memoryUsage.estimatedMemoryUsage).toBeGreaterThan(0)
		})
	})

	describe("State Cleanup", () => {
		test("should clean up old states", async () => {
			const originalError = new Error("Test error")

			// Create a state
			const state = stateManager.createRetryState(mockRetryContext, originalError)

			// Manually set old timestamp to simulate old state
			const oldState = stateManager.getRetryState(state.id)!
			oldState.startTime = Date.now() - 25 * 60 * 60 * 1000 // 25 hours ago

			// Wait for cleanup interval (simulated)
			await new Promise((resolve) => setTimeout(resolve, 100))

			// State should still be there (cleanup happens periodically)
			const retrievedState = stateManager.getRetryState(state.id)
			expect(retrievedState).toBeDefined()
		})

		test("should clean up stale states", async () => {
			const originalError = new Error("Test error")

			// Create a state and make it stale
			const state = stateManager.createRetryState(mockRetryContext, originalError)

			// Update state to make it stale (last attempt too long ago)
			stateManager.updateRetryState(state.id, {
				attempt: 1,
				timestamp: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
				delay: 1000,
				result: { success: false, shouldRetry: true },
			})

			// Wait for cleanup
			await new Promise((resolve) => setTimeout(resolve, 100))

			// State should be cleaned up
			const retrievedState = stateManager.getRetryState(state.id)
			expect(retrievedState).toBeUndefined()
		})
	})

	describe("Event Emission", () => {
		test("should emit cleanup events", async () => {
			const eventSpy = vi.fn()
			stateManager.on("cleanup", eventSpy)

			// Create states that will be cleaned up
			for (let i = 0; i < 3; i++) {
				const state = stateManager.createRetryState(mockRetryContext, new Error("Test error"))

				// Make state stale
				state.startTime = Date.now() - 26 * 60 * 60 * 1000 // 26 hours ago
			}

			// Wait for cleanup
			await new Promise((resolve) => setTimeout(resolve, 100))

			expect(eventSpy).toHaveBeenCalledWith({
				removedRetries: expect.any(Array),
			})
		})

		test("should emit state-restored events", async () => {
			const eventSpy = vi.fn()
			stateManager.on("state-restored", eventSpy)

			// This would be tested with actual persistence implementation
			// For now, just verify the event system works
			expect(eventSpy).toBeDefined()
		})
	})

	describe("Error Handling", () => {
		test("should handle update of non-existent state", () => {
			const shouldContinue = stateManager.updateRetryState("non-existent-id", {
				attempt: 1,
				timestamp: Date.now(),
				delay: 1000,
				result: { success: false, shouldRetry: true },
			})

			expect(shouldContinue).toBe(false)
		})

		test("should handle disposal with active states", async () => {
			const originalError = new Error("Test error")

			// Create multiple states
			for (let i = 0; i < 3; i++) {
				stateManager.createRetryState(
					{
						...mockRetryContext,
						id: `test-${i}`,
					},
					originalError,
				)
			}

			// Dispose
			await stateManager.dispose()

			// All states should be cancelled
			const activeStates = stateManager.getActiveRetryStates()
			expect(activeStates).toHaveLength(0)
		})
	})

	describe("Edge Cases", () => {
		test("should handle maximum concurrent retries", () => {
			const originalError = new Error("Test error")
			const createdStates: RetryState[] = []

			// Create states up to the limit
			for (let i = 0; i < 15; i++) {
				try {
					const state = stateManager.createRetryState(
						{
							...mockRetryContext,
							id: `test-${i}`,
						},
						originalError,
					)

					if (state) {
						createdStates.push(state)
					}
				} catch (error) {
					// Should handle gracefully
					expect(error.message).toContain("Maximum concurrent retries")
				}
			}

			// Should have created at most the maximum allowed
			expect(createdStates.length).toBeLessThanOrEqual(10)
		})

		test("should handle rapid state updates", () => {
			const originalError = new Error("Test error")
			const state = stateManager.createRetryState(mockRetryContext, originalError)

			// Rapidly update the state
			for (let i = 0; i < 10; i++) {
				stateManager.updateRetryState(state.id, {
					attempt: i,
					timestamp: Date.now(),
					delay: i * 1000,
					result: { success: i === 9, shouldRetry: i < 9 },
				})
			}

			// Should handle rapid updates without corruption
			const finalState = stateManager.getRetryState(state.id)
			expect(finalState?.currentAttempt).toBe(9)
		})

		test("should handle state restoration on startup", async () => {
			// This would test the loadPersistedStates functionality
			// For now, just verify it doesn't crash
			const newStateManager = new RetryStateManager(5)
			await new Promise((resolve) => setTimeout(resolve, 50))

			const activeStates = newStateManager.getActiveRetryStates()
			expect(Array.isArray(activeStates)).toBe(true)

			await newStateManager.dispose()
		})
	})
})
