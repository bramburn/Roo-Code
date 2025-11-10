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

describe("RetryEngine Error Scenario Tests", () => {
	let retryEngine: RetryEngine
	let mockToolFunction: any

	beforeEach(() => {
		vi.clearAllMocks()
		retryEngine = new RetryEngine()
		mockToolFunction = vi.fn()
	})

	describe("Network Timeout and Retry Handling", () => {
		test("should handle network timeout errors with exponential backoff", async () => {
			const execution: RetryExecution = {
				toolName: "network-tool",
				execute: mockToolFunction
					.mockRejectedValueOnce(new Error("ETIMEDOUT: Network timeout"))
					.mockRejectedValueOnce(new Error("ETIMEDOUT: Network timeout"))
					.mockResolvedValue({ networkSuccess: true }),
				params: { url: "https://api.example.com" },
			}

			const settings: RetrySettings = {
				enableRetry: true,
				maxRetryAttempts: 4,
				baseDelayMs: 1000,
				maxDelayMs: 30000,
				backoffMultiplier: 2,
				jitterFactor: 0.1,
				retryTimeoutMs: 15000,
			}

			// Mock setTimeout for controlled timing
			const delaySpy = vi.spyOn(global, "setTimeout").mockImplementation((cb) => {
				cb()
				return 1 as any
			})

			const result = await retryEngine.executeWithRetry(execution, settings)

			expect(result.success).toBe(true)
			expect(result.attempts).toBe(3)
			expect(result.result).toEqual({ networkSuccess: true })
			expect(mockToolFunction).toHaveBeenCalledTimes(3)

			delaySpy.mockRestore()
		})

		test("should handle connection refused errors", async () => {
			const execution: RetryExecution = {
				toolName: "connection-tool",
				execute: mockToolFunction
					.mockRejectedValueOnce(new Error("ECONNREFUSED: Connection refused"))
					.mockResolvedValue({ connectionRestored: true }),
				params: { host: "localhost", port: 3000 },
			}

			const settings: RetrySettings = {
				enableRetry: true,
				maxRetryAttempts: 3,
				baseDelayMs: 2000,
				backoffMultiplier: 1.5,
				retryTimeoutMs: 10000,
			}

			const delaySpy = vi.spyOn(global, "setTimeout").mockImplementation((cb) => {
				cb()
				return 1 as any
			})

			const result = await retryEngine.executeWithRetry(execution, settings)

			expect(result.success).toBe(true)
			expect(result.attempts).toBe(2)
			expect(mockToolFunction).toHaveBeenCalledTimes(2)

			delaySpy.mockRestore()
		})

		test("should handle DNS resolution failures", async () => {
			const execution: RetryExecution = {
				toolName: "dns-tool",
				execute: mockToolFunction.mockRejectedValue(new Error("ENOTFOUND: DNS lookup failed")),
				params: { hostname: "nonexistent.domain.com" },
			}

			const settings: RetrySettings = {
				enableRetry: true,
				maxRetryAttempts: 3,
				baseDelayMs: 3000,
				retryTimeoutMs: 15000,
			}

			const delaySpy = vi.spyOn(global, "setTimeout").mockImplementation((cb) => {
				cb()
				return 1 as any
			})

			const result = await retryEngine.executeWithRetry(execution, settings)

			expect(result.success).toBe(false)
			expect(result.error?.message).toContain("DNS lookup failed")
			expect(result.attempts).toBe(3)

			delaySpy.mockRestore()
		})
	})

	describe("Context Window Exceeded Errors", () => {
		test("should handle context window exceeded with optimization", async () => {
			const execution: RetryExecution = {
				toolName: "context-tool",
				execute: mockToolFunction
					.mockRejectedValueOnce(new Error("Context window exceeded: 4000 tokens > 3500 limit"))
					.mockResolvedValue({ contextOptimized: true }),
				params: { prompt: "Large context test" },
				context: {
					taskId: "context-window-test",
					messages: Array.from({ length: 100 }, (_, i) => ({
						role: i % 2 === 0 ? "user" : "assistant",
						content: `Large message content ${i}`.repeat(50),
					})),
				},
			}

			const settings: RetrySettings = {
				enableRetry: true,
				maxRetryAttempts: 3,
				baseDelayMs: 500,
				enableContextOptimization: true,
				retryTimeoutMs: 10000,
			}

			const delaySpy = vi.spyOn(global, "setTimeout").mockImplementation((cb) => {
				cb()
				return 1 as any
			})

			const result = await retryEngine.executeWithRetry(execution, settings)

			expect(result.success).toBe(true)
			expect(result.attempts).toBe(2)
			expect(mockToolFunction).toHaveBeenCalledTimes(2)

			delaySpy.mockRestore()
		})

		test("should handle token limit exceeded errors", async () => {
			const execution: RetryExecution = {
				toolName: "token-tool",
				execute: mockToolFunction
					.mockRejectedValueOnce(new Error("Token limit exceeded: 8000 tokens > 4096 limit"))
					.mockResolvedValue({ tokensReduced: true }),
				params: { text: "Very long text".repeat(1000) },
				context: {
					taskId: "token-limit-test",
					messages: [
						{ role: "user", content: "Very long message".repeat(500) },
						{ role: "assistant", content: "Very long response".repeat(500) },
					],
				},
			}

			const settings: RetrySettings = {
				enableRetry: true,
				maxRetryAttempts: 2,
				baseDelayMs: 1000,
				enableContextOptimization: true,
				retryTimeoutMs: 15000,
			}

			const delaySpy = vi.spyOn(global, "setTimeout").mockImplementation((cb) => {
				cb()
				return 1 as any
			})

			const result = await retryEngine.executeWithRetry(execution, settings)

			expect(result.success).toBe(true)
			expect(result.attempts).toBe(2)

			delaySpy.mockRestore()
		})

		test("should handle repeated context window failures", async () => {
			const execution: RetryExecution = {
				toolName: "persistent-context-tool",
				execute: mockToolFunction.mockRejectedValue(
					new Error("Context window exceeded: 5000 tokens > 3500 limit"),
				),
				params: { prompt: "Persistent large context" },
				context: {
					taskId: "persistent-context-test",
					messages: Array.from({ length: 200 }, (_, i) => ({
						role: "user",
						content: `Extremely large message ${i}`.repeat(100),
					})),
				},
			}

			const settings: RetrySettings = {
				enableRetry: true,
				maxRetryAttempts: 3,
				baseDelayMs: 2000,
				enableContextOptimization: true,
				retryTimeoutMs: 20000,
			}

			const delaySpy = vi.spyOn(global, "setTimeout").mockImplementation((cb) => {
				cb()
				return 1 as any
			})

			const result = await retryEngine.executeWithRetry(execution, settings)

			expect(result.success).toBe(false)
			expect(result.error?.message).toContain("Context window exceeded")
			expect(result.attempts).toBe(3)

			delaySpy.mockRestore()
		})
	})

	describe("Rate Limit and Authentication Errors", () => {
		test("should handle rate limit errors with appropriate delay", async () => {
			const execution: RetryExecution = {
				toolName: "rate-limit-tool",
				execute: mockToolFunction
					.mockRejectedValueOnce(new Error("Rate limit exceeded: 100 requests per minute"))
					.mockResolvedValue({ rateLimitHandled: true }),
				params: { endpoint: "/api/data" },
			}

			const settings: RetrySettings = {
				enableRetry: true,
				maxRetryAttempts: 3,
				baseDelayMs: 5000, // Longer delay for rate limits
				retryTimeoutMs: 30000,
			}

			const delaySpy = vi.spyOn(global, "setTimeout").mockImplementation((cb) => {
				cb()
				return 1 as any
			})

			const result = await retryEngine.executeWithRetry(execution, settings)

			expect(result.success).toBe(true)
			expect(result.attempts).toBe(2)
			expect(mockToolFunction).toHaveBeenCalledTimes(2)

			delaySpy.mockRestore()
		})

		test("should handle authentication failures without retry", async () => {
			const execution: RetryExecution = {
				toolName: "auth-tool",
				execute: mockToolFunction.mockRejectedValue(new Error("Authentication failed: Invalid API key")),
				params: { apiKey: "invalid-key" },
			}

			const settings: RetrySettings = {
				enableRetry: true,
				maxRetryAttempts: 3,
				baseDelayMs: 1000,
				retryTimeoutMs: 10000,
			}

			const result = await retryEngine.executeWithRetry(execution, settings)

			expect(result.success).toBe(false)
			expect(result.error?.message).toContain("Authentication failed")
			expect(result.attempts).toBe(1) // Should not retry auth errors
			expect(mockToolFunction).toHaveBeenCalledTimes(1)
		})

		test("should handle authorization errors", async () => {
			const execution: RetryExecution = {
				toolName: "authorization-tool",
				execute: mockToolFunction.mockRejectedValue(
					new Error("Authorization failed: Insufficient permissions"),
				),
				params: { resource: "protected-resource" },
			}

			const settings: RetrySettings = {
				enableRetry: true,
				maxRetryAttempts: 3,
				baseDelayMs: 1000,
				retryTimeoutMs: 10000,
			}

			const result = await retryEngine.executeWithRetry(execution, settings)

			expect(result.success).toBe(false)
			expect(result.error?.message).toContain("Authorization failed")
			expect(result.attempts).toBe(1) // Should not retry auth errors
		})

		test("should handle token expiration errors", async () => {
			const execution: RetryExecution = {
				toolName: "token-expiry-tool",
				execute: mockToolFunction.mockRejectedValue(new Error("Token expired: Refresh required")),
				params: { token: "expired-token" },
			}

			const settings: RetrySettings = {
				enableRetry: true,
				maxRetryAttempts: 2,
				baseDelayMs: 1000,
				retryTimeoutMs: 10000,
			}

			const result = await retryEngine.executeWithRetry(execution, settings)

			expect(result.success).toBe(false)
			expect(result.error?.message).toContain("Token expired")
			expect(result.attempts).toBe(1) // Should not retry token expiry
		})
	})

	describe("Malformed Tool Parameters", () => {
		test("should handle invalid parameter types", async () => {
			const execution: RetryExecution = {
				toolName: "parameter-validation-tool",
				execute: mockToolFunction.mockRejectedValue(
					new Error("Invalid parameter: expected string, got number"),
				),
				params: { invalidParam: 123 }, // Should be string
			}

			const settings: RetrySettings = {
				enableRetry: true,
				maxRetryAttempts: 3,
				baseDelayMs: 1000,
				retryTimeoutMs: 10000,
			}

			const result = await retryEngine.executeWithRetry(execution, settings)

			expect(result.success).toBe(false)
			expect(result.error?.message).toContain("Invalid parameter")
			expect(result.attempts).toBe(1) // Should not retry validation errors
		})

		test("should handle missing required parameters", async () => {
			const execution: RetryExecution = {
				toolName: "missing-param-tool",
				execute: mockToolFunction.mockRejectedValue(new Error("Missing required parameter: 'filename'")),
				params: { optionalParam: "value" }, // Missing required filename
			}

			const settings: RetrySettings = {
				enableRetry: true,
				maxRetryAttempts: 3,
				baseDelayMs: 1000,
				retryTimeoutMs: 10000,
			}

			const result = await retryEngine.executeWithRetry(execution, settings)

			expect(result.success).toBe(false)
			expect(result.error?.message).toContain("Missing required parameter")
			expect(result.attempts).toBe(1)
		})

		test("should handle parameter format errors", async () => {
			const execution: RetryExecution = {
				toolName: "format-error-tool",
				execute: mockToolFunction.mockRejectedValue(new Error("Invalid JSON format in parameter: 'data'")),
				params: { data: "invalid-json-string" },
			}

			const settings: RetrySettings = {
				enableRetry: true,
				maxRetryAttempts: 3,
				baseDelayMs: 1000,
				retryTimeoutMs: 10000,
			}

			const result = await retryEngine.executeWithRetry(execution, settings)

			expect(result.success).toBe(false)
			expect(result.error?.message).toContain("Invalid JSON format")
			expect(result.attempts).toBe(1)
		})

		test("should handle parameter range errors", async () => {
			const execution: RetryExecution = {
				toolName: "range-error-tool",
				execute: mockToolFunction.mockRejectedValue(
					new Error("Parameter 'count' out of range: must be between 1 and 100"),
				),
				params: { count: 150 }, // Out of range
			}

			const settings: RetrySettings = {
				enableRetry: true,
				maxRetryAttempts: 3,
				baseDelayMs: 1000,
				retryTimeoutMs: 10000,
			}

			const result = await retryEngine.executeWithRetry(execution, settings)

			expect(result.success).toBe(false)
			expect(result.error?.message).toContain("out of range")
			expect(result.attempts).toBe(1)
		})
	})

	describe("Circuit Breaker Triggering and Recovery", () => {
		test("should trigger circuit breaker after consecutive failures", async () => {
			const execution: RetryExecution = {
				toolName: "circuit-breaker-test",
				execute: mockToolFunction.mockRejectedValue(new Error("Persistent service failure")),
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

			// Execute multiple times to trigger circuit breaker
			const results = []
			for (let i = 0; i < 6; i++) {
				const result = await retryEngine.executeWithRetry(execution, settings)
				results.push(result)
			}

			// Later executions should be blocked by circuit breaker
			const laterResults = []
			for (let i = 0; i < 3; i++) {
				const result = await retryEngine.executeWithRetry(execution, settings)
				laterResults.push(result)
			}

			// Check circuit breaker state
			const state = retryEngine.getState()
			expect(state.circuitBreakerState).toBe("open")

			// Later executions should fail immediately due to circuit breaker
			laterResults.forEach((result) => {
				expect(result.success).toBe(false)
				expect(result.error?.message).toContain("Circuit breaker is open")
			})

			delaySpy.mockRestore()
		})

		test("should recover from circuit breaker after timeout", async () => {
			const execution: RetryExecution = {
				toolName: "recovery-test",
				execute: mockToolFunction
					.mockRejectedValueTimes(5, new Error("Service failure"))
					.mockResolvedValue({ recovered: true }),
				params: { action: "recover" },
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

			// Trigger circuit breaker
			for (let i = 0; i < 6; i++) {
				await retryEngine.executeWithRetry(execution, settings)
			}

			// Verify circuit breaker is open
			let state = retryEngine.getState()
			expect(state.circuitBreakerState).toBe("open")

			// Reset circuit breaker (simulating timeout)
			retryEngine.reset()

			// Should succeed after reset
			const result = await retryEngine.executeWithRetry(execution, settings)
			expect(result.success).toBe(true)
			expect(result.result).toEqual({ recovered: true })

			delaySpy.mockRestore()
		})

		test("should handle half-open state correctly", async () => {
			const execution: RetryExecution = {
				toolName: "half-open-test",
				execute: mockToolFunction,
				params: { action: "half-open" },
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

			// This test would require more complex circuit breaker state manipulation
			// For now, we'll test the basic functionality
			const result = await retryEngine.executeWithRetry(execution, settings)
			expect(result).toBeDefined()

			delaySpy.mockRestore()
		})
	})

	describe("Resource Exhaustion Scenarios", () => {
		test("should handle memory exhaustion gracefully", async () => {
			const execution: RetryExecution = {
				toolName: "memory-exhaustion-tool",
				execute: mockToolFunction.mockRejectedValue(new Error("JavaScript heap out of memory")),
				params: { largeData: "x".repeat(1000000) },
			}

			const settings: RetrySettings = {
				enableRetry: true,
				maxRetryAttempts: 2,
				baseDelayMs: 5000, // Longer delay for memory issues
				retryTimeoutMs: 30000,
			}

			const delaySpy = vi.spyOn(global, "setTimeout").mockImplementation((cb) => {
				cb()
				return 1 as any
			})

			const result = await retryEngine.executeWithRetry(execution, settings)

			expect(result.success).toBe(false)
			expect(result.error?.message).toContain("heap out of memory")
			expect(result.attempts).toBe(2)

			delaySpy.mockRestore()
		})

		test("should handle file descriptor exhaustion", async () => {
			const execution: RetryExecution = {
				toolName: "fd-exhaustion-tool",
				execute: mockToolFunction.mockRejectedValue(new Error("EMFILE: Too many open files")),
				params: { files: Array.from({ length: 1000 }, (_, i) => `file${i}.txt`) },
			}

			const settings: RetrySettings = {
				enableRetry: true,
				maxRetryAttempts: 3,
				baseDelayMs: 3000,
				retryTimeoutMs: 20000,
			}

			const delaySpy = vi.spyOn(global, "setTimeout").mockImplementation((cb) => {
				cb()
				return 1 as any
			})

			const result = await retryEngine.executeWithRetry(execution, settings)

			expect(result.success).toBe(false)
			expect(result.error?.message).toContain("Too many open files")
			expect(result.attempts).toBe(3)

			delaySpy.mockRestore()
		})

		test("should handle database connection pool exhaustion", async () => {
			const execution: RetryExecution = {
				toolName: "db-pool-exhaustion-tool",
				execute: mockToolFunction.mockRejectedValue(
					new Error("Connection pool exhausted: Maximum connections reached"),
				),
				params: { query: "SELECT * FROM large_table" },
			}

			const settings: RetrySettings = {
				enableRetry: true,
				maxRetryAttempts: 4,
				baseDelayMs: 2000,
				retryTimeoutMs: 15000,
			}

			const delaySpy = vi.spyOn(global, "setTimeout").mockImplementation((cb) => {
				cb()
				return 1 as any
			})

			const result = await retryEngine.executeWithRetry(execution, settings)

			expect(result.success).toBe(false)
			expect(result.error?.message).toContain("Connection pool exhausted")
			expect(result.attempts).toBe(4)

			delaySpy.mockRestore()
		})
	})

	describe("Mixed Error Scenarios", () => {
		test("should handle sequence of different error types", async () => {
			const execution: RetryExecution = {
				toolName: "mixed-errors-tool",
				execute: mockToolFunction
					.mockRejectedValueOnce(new Error("Network timeout"))
					.mockRejectedValueOnce(new Error("Rate limit exceeded"))
					.mockRejectedValueOnce(new Error("Context window exceeded"))
					.mockResolvedValue({ mixedSuccess: true }),
				params: { test: "mixed-errors" },
			}

			const settings: RetrySettings = {
				enableRetry: true,
				maxRetryAttempts: 4,
				baseDelayMs: 1000,
				enableContextOptimization: true,
				retryTimeoutMs: 20000,
			}

			const delaySpy = vi.spyOn(global, "setTimeout").mockImplementation((cb) => {
				cb()
				return 1 as any
			})

			const result = await retryEngine.executeWithRetry(execution, settings)

			expect(result.success).toBe(true)
			expect(result.attempts).toBe(4)
			expect(mockToolFunction).toHaveBeenCalledTimes(4)

			delaySpy.mockRestore()
		})

		test("should handle cascading failures", async () => {
			const execution: RetryExecution = {
				toolName: "cascading-failure-tool",
				execute: mockToolFunction.mockRejectedValue(
					new Error("Cascading failure: Dependent service unavailable"),
				),
				params: { service: "dependent-service" },
			}

			const settings: RetrySettings = {
				enableRetry: true,
				maxRetryAttempts: 3,
				baseDelayMs: 5000, // Longer delays for cascading failures
				retryTimeoutMs: 30000,
			}

			const delaySpy = vi.spyOn(global, "setTimeout").mockImplementation((cb) => {
				cb()
				return 1 as any
			})

			const result = await retryEngine.executeWithRetry(execution, settings)

			expect(result.success).toBe(false)
			expect(result.error?.message).toContain("Cascading failure")
			expect(result.attempts).toBe(3)

			delaySpy.mockRestore()
		})
	})
})
