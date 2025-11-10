import { describe, test, expect, beforeEach, afterEach, vi } from "vitest"
import { CircuitBreaker } from "../CircuitBreaker"
import type { CircuitBreakerConfig } from "../types"

describe("CircuitBreaker", () => {
	let circuitBreaker: CircuitBreaker
	let mockOperation: vi.MockedFunction<() => Promise<string>>

	beforeEach(() => {
		mockOperation = vi.fn()
		circuitBreaker = new CircuitBreaker({
			failureThreshold: 3,
			recoveryTimeout: 1000,
			halfOpenTimeout: 500,
			successThreshold: 2,
		})
	})

	afterEach(() => {
		circuitBreaker.dispose()
	})

	describe("Initial State", () => {
		test("should start in closed state", () => {
			expect(circuitBreaker.getState()).toBe("closed")
		})

		test("should have initial metrics", () => {
			const metrics = circuitBreaker.getMetrics()
			expect(metrics.totalRequests).toBe(0)
			expect(metrics.successfulRequests).toBe(0)
			expect(metrics.failedRequests).toBe(0)
			expect(metrics.failureRate).toBe(0)
		})
	})

	describe("Successful Operations", () => {
		test("should execute successful operation", async () => {
			mockOperation.mockResolvedValue("success")

			const result = await circuitBreaker.execute(mockOperation)

			expect(result).toBe("success")
			expect(mockOperation).toHaveBeenCalledTimes(1)
		})

		test("should update metrics on success", async () => {
			mockOperation.mockResolvedValue("success")

			await circuitBreaker.execute(mockOperation)

			const metrics = circuitBreaker.getMetrics()
			expect(metrics.totalRequests).toBe(1)
			expect(metrics.successfulRequests).toBe(1)
			expect(metrics.failedRequests).toBe(0)
			expect(metrics.failureRate).toBe(0)
		})

		test("should reset failure count on success", async () => {
			// First, cause some failures
			mockOperation.mockRejectedValue(new Error("failure"))

			for (let i = 0; i < 2; i++) {
				try {
					await circuitBreaker.execute(mockOperation)
				} catch {
					// Expected to fail
				}
			}

			// Then succeed
			mockOperation.mockResolvedValue("success")
			await circuitBreaker.execute(mockOperation)

			// Should be back to closed state with reset failure count
			expect(circuitBreaker.getState()).toBe("closed")
		})
	})

	describe("Failed Operations", () => {
		test("should handle operation failure", async () => {
			mockOperation.mockRejectedValue(new Error("test error"))

			await expect(circuitBreaker.execute(mockOperation)).rejects.toThrow("test error")
			expect(mockOperation).toHaveBeenCalledTimes(1)
		})

		test("should update metrics on failure", async () => {
			mockOperation.mockRejectedValue(new Error("test error"))

			try {
				await circuitBreaker.execute(mockOperation)
			} catch {
				// Expected to fail
			}

			const metrics = circuitBreaker.getMetrics()
			expect(metrics.totalRequests).toBe(1)
			expect(metrics.successfulRequests).toBe(0)
			expect(metrics.failedRequests).toBe(1)
			expect(metrics.failureRate).toBe(1)
		})

		test("should open circuit after failure threshold", async () => {
			mockOperation.mockRejectedValue(new Error("persistent failure"))

			// Execute until threshold is reached
			for (let i = 0; i < 3; i++) {
				try {
					await circuitBreaker.execute(mockOperation)
				} catch {
					// Expected to fail
				}
			}

			expect(circuitBreaker.getState()).toBe("open")
		})

		test("should reject immediately when circuit is open", async () => {
			// First, open the circuit
			mockOperation.mockRejectedValue(new Error("failure"))

			for (let i = 0; i < 3; i++) {
				try {
					await circuitBreaker.execute(mockOperation)
				} catch {
					// Expected to fail
				}
			}

			// Circuit should now be open
			expect(circuitBreaker.getState()).toBe("open")

			// Next call should be rejected immediately
			mockOperation.mockClear() // Reset mock to track calls

			await expect(circuitBreaker.execute(mockOperation)).rejects.toThrow(/Circuit breaker is open/)
			expect(mockOperation).not.toHaveBeenCalled()
		})
	})

	describe("Recovery", () => {
		test("should transition to half-open after recovery timeout", async () => {
			mockOperation.mockRejectedValue(new Error("persistent failure"))

			// Open the circuit
			for (let i = 0; i < 3; i++) {
				try {
					await circuitBreaker.execute(mockOperation)
				} catch {
					// Expected to fail
				}
			}

			expect(circuitBreaker.getState()).toBe("open")

			// Wait for recovery timeout
			await new Promise((resolve) => setTimeout(resolve, 1100))

			// Next operation should trigger half-open state
			mockOperation.mockResolvedValue("success")
			await circuitBreaker.execute(mockOperation)

			expect(circuitBreaker.getState()).toBe("half-open")
		})

		test("should close circuit after success threshold in half-open", async () => {
			mockOperation.mockRejectedValue(new Error("persistent failure"))

			// Open the circuit
			for (let i = 0; i < 3; i++) {
				try {
					await circuitBreaker.execute(mockOperation)
				} catch {
					// Expected to fail
				}
			}

			// Wait for recovery timeout
			await new Promise((resolve) => setTimeout(resolve, 1100))

			// Execute successful operations to close circuit
			mockOperation.mockResolvedValue("success")

			await circuitBreaker.execute(mockOperation) // First success
			await circuitBreaker.execute(mockOperation) // Second success - should close

			expect(circuitBreaker.getState()).toBe("closed")
		})

		test("should re-open if fails in half-open state", async () => {
			mockOperation.mockRejectedValue(new Error("persistent failure"))

			// Open the circuit
			for (let i = 0; i < 3; i++) {
				try {
					await circuitBreaker.execute(mockOperation)
				} catch {
					// Expected to fail
				}
			}

			// Wait for recovery timeout
			await new Promise((resolve) => setTimeout(resolve, 1100))

			// Fail in half-open state
			mockOperation.mockRejectedValue(new Error("still failing"))

			try {
				await circuitBreaker.execute(mockOperation)
			} catch {
				// Expected to fail
			}

			expect(circuitBreaker.getState()).toBe("open")
		})
	})

	describe("Event Emission", () => {
		test("should emit state-change events", async () => {
			const stateChangeSpy = vi.fn()
			circuitBreaker.on("state-change", stateChangeSpy)

			mockOperation.mockRejectedValue(new Error("failure"))

			// Trigger state changes
			for (let i = 0; i < 3; i++) {
				try {
					await circuitBreaker.execute(mockOperation)
				} catch {
					// Expected to fail
				}
			}

			// Should have emitted state change events
			expect(stateChangeSpy).toHaveBeenCalled()
			const calls = stateChangeSpy.mock.calls

			// Check for closed -> open transition
			const openTransition = calls.find((call) => call[0].oldState === "closed" && call[0].newState === "open")
			expect(openTransition).toBeDefined()
		})
	})

	describe("Health Status", () => {
		test("should report healthy status for new circuit breaker", () => {
			const health = circuitBreaker.getHealth()
			expect(health.status).toBe("healthy")
			expect(health.state).toBe("closed")
			expect(health.failureRate).toBe(0)
			expect(health.recommendation).toContain("operating normally")
		})

		test("should report degraded status for moderate failure rate", async () => {
			mockOperation.mockRejectedValue(new Error("intermittent failure"))

			// Cause some failures but not enough to open circuit
			for (let i = 0; i < 2; i++) {
				try {
					await circuitBreaker.execute(mockOperation)
				} catch {
					// Expected to fail
				}
			}

			const health = circuitBreaker.getHealth()
			expect(health.status).toBe("degraded")
			expect(health.failureRate).toBeGreaterThan(0)
		})

		test("should report unhealthy status when circuit is open", async () => {
			mockOperation.mockRejectedValue(new Error("persistent failure"))

			// Open the circuit
			for (let i = 0; i < 3; i++) {
				try {
					await circuitBreaker.execute(mockOperation)
				} catch {
					// Expected to fail
				}
			}

			const health = circuitBreaker.getHealth()
			expect(health.status).toBe("unhealthy")
			expect(health.state).toBe("open")
			expect(health.recommendation).toContain("reduce load")
		})
	})

	describe("Manual Control", () => {
		test("should reset circuit breaker", () => {
			// Force open state first
			circuitBreaker.forceOpen("test")
			expect(circuitBreaker.getState()).toBe("open")

			// Reset should return to closed
			circuitBreaker.reset()
			expect(circuitBreaker.getState()).toBe("closed")

			const metrics = circuitBreaker.getMetrics()
			expect(metrics.failureRate).toBe(0)
		})

		test("should force open circuit", () => {
			circuitBreaker.forceOpen("manual test")
			expect(circuitBreaker.getState()).toBe("open")

			// Should reject operations immediately
			mockOperation.mockResolvedValue("success")
			expect(circuitBreaker.execute(mockOperation)).rejects.toThrow(/Circuit breaker is open/)
		})

		test("should check execution permission", () => {
			// Should allow execution when closed or half-open
			expect(circuitBreaker.canExecute()).toBe(true)

			// Force open and check again
			circuitBreaker.forceOpen("test")
			expect(circuitBreaker.canExecute()).toBe(false)
		})
	})

	describe("Time Tracking", () => {
		test("should track time in current state", async () => {
			const startTime = Date.now()

			// Wait a bit and check time tracking
			await new Promise((resolve) => setTimeout(resolve, 100))

			const timeInState = circuitBreaker.getTimeInCurrentState()
			expect(timeInState).toBeGreaterThan(90)
			expect(timeInState).toBeLessThan(200)
		})
	})

	describe("Configuration", () => {
		test("should return current configuration", () => {
			const config = circuitBreaker.getConfig()
			expect(config.failureThreshold).toBe(3)
			expect(config.recoveryTimeout).toBe(1000)
			expect(config.halfOpenTimeout).toBe(500)
			expect(config.successThreshold).toBe(2)
		})
	})

	describe("Edge Cases", () => {
		test("should handle immediate success after opening", async () => {
			// Open circuit
			circuitBreaker.forceOpen("test")

			// Immediately succeed
			mockOperation.mockResolvedValue("success")

			// Should still reject because circuit is open
			expect(circuitBreaker.execute(mockOperation)).rejects.toThrow(/Circuit breaker is open/)
		})

		test("should handle rapid state transitions", async () => {
			mockOperation.mockRejectedValue(new Error("failure"))

			// Rapidly trigger failures
			const promises = Array.from({ length: 10 }, () =>
				circuitBreaker.execute(mockOperation).catch(() => "caught"),
			)

			await Promise.all(promises)

			// Should handle gracefully without errors
			expect(circuitBreaker.getState()).toBeOneOf(["open", "closed", "half-open"])
		})

		test("should handle concurrent operations", async () => {
			mockOperation.mockResolvedValue("success")

			// Execute multiple operations concurrently
			const promises = Array.from({ length: 5 }, () => circuitBreaker.execute(mockOperation))

			const results = await Promise.all(promises)
			expect(results).toHaveLength(5)
			expect(results.every((result) => result === "success")).toBe(true)
		})
	})
})
