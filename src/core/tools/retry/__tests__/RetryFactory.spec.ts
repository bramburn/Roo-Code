import { describe, test, expect, beforeEach } from "vitest"
import { RetryFactory } from "../RetryFactory"
import type { RetrySettings, BackoffConfig, CircuitBreakerConfig, ErrorClassification } from "../types"

describe("RetryFactory", () => {
	describe("createBackoffStrategy", () => {
		test("should create backoff strategy from retry settings", () => {
			const settings: RetrySettings = {
				enableRetry: true,
				maxRetryAttempts: 5,
				baseDelayMs: 2000,
				maxDelayMs: 60000,
				backoffMultiplier: 3,
				jitterFactor: 0.2,
			}

			const strategy = RetryFactory.createBackoffStrategy(settings)

			expect(strategy).toBeDefined()
			const config = strategy.getConfig()
			expect(config.baseDelay).toBe(2000)
			expect(config.maxDelay).toBe(60000)
			expect(config.multiplier).toBe(3)
			expect(config.jitterFactor).toBe(0.2)
			expect(config.maxAttempts).toBe(5)
		})

		test("should use default values when not provided", () => {
			const settings: Partial<RetrySettings> = {
				maxRetryAttempts: 3,
			}

			const strategy = RetryFactory.createBackoffStrategy(settings)

			const config = strategy.getConfig()
			expect(config.baseDelay).toBe(1000) // Default
			expect(config.maxDelay).toBe(30000) // Default
			expect(config.multiplier).toBe(2) // Default
			expect(config.jitterFactor).toBe(0.1) // Default
			expect(config.maxAttempts).toBe(3)
		})
	})

	describe("createCircuitBreaker", () => {
		test("should create circuit breaker from retry settings", () => {
			const settings: RetrySettings = {
				maxRetryAttempts: 4,
				baseDelayMs: 1000,
				maxDelayMs: 30000,
			}

			const circuitBreaker = RetryFactory.createCircuitBreaker("test-tool", settings)

			expect(circuitBreaker).toBeDefined()
			const config = circuitBreaker.getConfig()
			expect(config.failureThreshold).toBe(6) // Math.max(3, Math.floor(4 * 1.5))
			expect(config.recoveryTimeout).toBe(60000) // Math.max(30000, 30000 * 2)
			expect(config.halfOpenTimeout).toBe(30000) // Math.max(30000, 30000)
			expect(config.successThreshold).toBe(2)
		})

		test("should use minimum thresholds for low retry counts", () => {
			const settings: RetrySettings = {
				maxRetryAttempts: 2, // Low retry count
			}

			const circuitBreaker = RetryFactory.createCircuitBreaker("test-tool", settings)

			const config = circuitBreaker.getConfig()
			expect(config.failureThreshold).toBe(3) // Math.max(3, Math.floor(2 * 1.5))
			expect(config.recoveryTimeout).toBe(30000) // Math.max(30000, 30000 * 2)
			expect(config.halfOpenTimeout).toBe(30000) // Math.max(30000, 30000)
		})
	})

	describe("createRetryContext", () => {
		test("should create retry context from execution", () => {
			const execution = {
				toolName: "test-tool",
				execute: vi.fn(),
				params: { param1: "value1", param2: "value2" },
				context: {
					taskId: "test-task",
					workingDirectory: "/test",
				},
				retryConfig: {
					maxRetryAttempts: 5,
				},
			}

			const defaultSettings: RetrySettings = {
				enableRetry: true,
				maxRetryAttempts: 3,
				baseDelayMs: 1000,
			}

			const context = RetryFactory.createRetryContext(execution, defaultSettings)

			expect(context.id).toBeDefined()
			expect(context.toolName).toBe("test-tool")
			expect(context.toolParams).toEqual({ param1: "value1", param2: "value2" })
			expect(context.config.enableRetry).toBe(true)
			expect(context.config.maxRetryAttempts).toBe(5) // Override takes precedence
			expect(context.taskId).toBe("test-task")
			expect(context.executionContext?.workingDirectory).toBe("/test")
		})

		test("should merge retry config with defaults", () => {
			const execution = {
				toolName: "test-tool",
				execute: vi.fn(),
				params: { param1: "value1" },
				retryConfig: {
					baseDelayMs: 2000,
					jitterFactor: 0.3,
				},
			}

			const defaultSettings: RetrySettings = {
				enableRetry: true,
				maxRetryAttempts: 3,
				backoffMultiplier: 2.5,
				jitterFactor: 0.1,
			}

			const context = RetryFactory.createRetryContext(execution, defaultSettings)

			expect(context.config.baseDelayMs).toBe(2000) // From retryConfig
			expect(context.config.jitterFactor).toBe(0.3) // From retryConfig
			expect(context.config.backoffMultiplier).toBe(2.5) // From defaults
			expect(context.config.maxRetryAttempts).toBe(3) // From defaults
		})
	})

	describe("classifyError", () => {
		test("should classify network errors", () => {
			const networkError = new Error("Network connection failed")
			const classification = RetryFactory.classifyError(networkError)

			expect(classification.isRetryable).toBe(true)
			expect(classification.category).toBe("network")
			expect(classification.severity).toBe("medium")
			expect(classification.backoffStrategy).toBe("exponential")
			expect(classification.triggerCircuitBreaker).toBe(false)
		})

		test("should classify timeout errors", () => {
			const timeoutError = new Error("Request timeout")
			const classification = RetryFactory.classifyError(timeoutError)

			expect(classification.isRetryable).toBe(true)
			expect(classification.category).toBe("timeout")
			expect(classification.severity).toBe("medium")
			expect(classification.backoffStrategy).toBe("exponential")
			expect(classification.customDelay).toBe(2000)
			expect(classification.triggerCircuitBreaker).toBe(false)
		})

		test("should classify rate limit errors", () => {
			const rateLimitError = new Error("Rate limit exceeded")
			const classification = RetryFactory.classifyError(rateLimitError)

			expect(classification.isRetryable).toBe(true)
			expect(classification.category).toBe("rate-limit")
			expect(classification.severity).toBe("high")
			expect(classification.backoffStrategy).toBe("exponential")
			expect(classification.customDelay).toBe(5000)
			expect(classification.triggerCircuitBreaker).toBe(true)
		})

		test("should classify authentication errors", () => {
			const authError = new Error("Unauthorized access")
			const classification = RetryFactory.classifyError(authError)

			expect(classification.isRetryable).toBe(false)
			expect(classification.category).toBe("auth")
			expect(classification.severity).toBe("high")
			expect(classification.backoffStrategy).toBe("none")
			expect(classification.triggerCircuitBreaker).toBe(false)
		})

		test("should classify permission errors", () => {
			const permError = new Error("Permission denied")
			const classification = RetryFactory.classifyError(permError)

			expect(classification.isRetryable).toBe(false)
			expect(classification.category).toBe("permission")
			expect(classification.severity).toBe("high")
			expect(classification.backoffStrategy).toBe("none")
			expect(classification.triggerCircuitBreaker).toBe(false)
		})

		test("should classify resource errors", () => {
			const resourceError = new Error("File not found")
			const classification = RetryFactory.classifyError(resourceError)

			expect(classification.isRetryable).toBe(false)
			expect(classification.category).toBe("resource")
			expect(classification.severity).toBe("medium")
			expect(classification.backoffStrategy).toBe("none")
			expect(classification.triggerCircuitBreaker).toBe(false)
		})

		test("should classify unknown errors", () => {
			const unknownError = new Error("Unknown error occurred")
			const classification = RetryFactory.classifyError(unknownError)

			expect(classification.isRetryable).toBe(true)
			expect(classification.category).toBe("unknown")
			expect(classification.severity).toBe("medium")
			expect(classification.backoffStrategy).toBe("exponential")
			expect(classification.triggerCircuitBreaker).toBe(false)
		})
	})

	describe("Settings Creation Methods", () => {
		test("should create network settings", () => {
			const baseSettings = { maxRetryAttempts: 10 }
			const settings = RetryFactory.createNetworkSettings(baseSettings)

			expect(settings.enableRetry).toBe(true)
			expect(settings.maxRetryAttempts).toBe(10) // Override
			expect(settings.baseDelayMs).toBe(1000)
			expect(settings.maxDelayMs).toBe(30000)
			expect(settings.backoffMultiplier).toBe(2)
			expect(settings.jitterFactor).toBe(0.2)
			expect(settings.enableContextOptimization).toBe(true)
			expect(settings.enableManualRetry).toBe(true)
			expect(settings.retryTimeoutMs).toBe(60000)
		})

		test("should create file system settings", () => {
			const baseSettings = { retryTimeoutMs: 30000 }
			const settings = RetryFactory.createFileSystemSettings(baseSettings)

			expect(settings.enableRetry).toBe(true)
			expect(settings.maxRetryAttempts).toBe(3)
			expect(settings.baseDelayMs).toBe(500) // File system default
			expect(settings.maxDelayMs).toBe(5000) // File system default
			expect(settings.backoffMultiplier).toBe(1.5) // File system default
			expect(settings.jitterFactor).toBe(0.1)
			expect(settings.enableContextOptimization).toBe(false) // Not needed for file ops
			expect(settings.enableManualRetry).toBe(true)
			expect(settings.retryTimeoutMs).toBe(30000) // Override
		})

		test("should create API settings", () => {
			const baseSettings = { backoffMultiplier: 3 }
			const settings = RetryFactory.createApiSettings(baseSettings)

			expect(settings.enableRetry).toBe(true)
			expect(settings.maxRetryAttempts).toBe(3)
			expect(settings.baseDelayMs).toBe(2000) // API default
			expect(settings.maxDelayMs).toBe(60000) // API default
			expect(settings.backoffMultiplier).toBe(3) // Override
			expect(settings.jitterFactor).toBe(0.3) // API default
			expect(settings.enableContextOptimization).toBe(true)
			expect(settings.enableManualRetry).toBe(true)
			expect(settings.retryTimeoutMs).toBe(120000) // API default
		})

		test("should create quick settings", () => {
			const baseSettings = { maxRetryAttempts: 5 }
			const settings = RetryFactory.createQuickSettings(baseSettings)

			expect(settings.enableRetry).toBe(true)
			expect(settings.maxRetryAttempts).toBe(5) // Override
			expect(settings.baseDelayMs).toBe(100) // Quick default
			expect(settings.maxDelayMs).toBe(1000) // Quick default
			expect(settings.backoffMultiplier).toBe(1.5) // Quick default
			expect(settings.jitterFactor).toBe(0.05) // Quick default
			expect(settings.enableContextOptimization).toBe(false)
			expect(settings.enableManualRetry).toBe(true)
			expect(settings.retryTimeoutMs).toBe(5000) // Quick default
		})

		test("should create resilient settings", () => {
			const baseSettings = { enableContextOptimization: false }
			const settings = RetryFactory.createResilientSettings(baseSettings)

			expect(settings.enableRetry).toBe(true)
			expect(settings.maxRetryAttempts).toBe(10) // Resilient default
			expect(settings.baseDelayMs).toBe(2000) // Resilient default
			expect(settings.maxDelayMs).toBe(120000) // Resilient default
			expect(settings.backoffMultiplier).toBe(3) // Resilient default
			expect(settings.jitterFactor).toBe(0.5) // Resilient default
			expect(settings.enableContextOptimization).toBe(false) // Override
			expect(settings.enableManualRetry).toBe(true)
			expect(settings.retryTimeoutMs).toBe(300000) // Resilient default
		})
	})

	describe("validateSettings", () => {
		test("should validate correct settings", () => {
			const validSettings: RetrySettings = {
				enableRetry: true,
				maxRetryAttempts: 3,
				baseDelayMs: 1000,
				maxDelayMs: 30000,
				backoffMultiplier: 2,
				jitterFactor: 0.1,
				retryTimeoutMs: 60000,
			}

			const validation = RetryFactory.validateSettings(validSettings)

			expect(validation.isValid).toBe(true)
			expect(validation.errors).toHaveLength(0)
		})

		test("should reject invalid enableRetry", () => {
			const invalidSettings = {
				enableRetry: undefined as any,
				maxRetryAttempts: 3,
				baseDelayMs: 1000,
				maxDelayMs: 30000,
				backoffMultiplier: 2,
				jitterFactor: 0.1,
				retryTimeoutMs: 60000,
			}

			const validation = RetryFactory.validateSettings(invalidSettings)

			expect(validation.isValid).toBe(false)
			expect(validation.errors).toContain("enableRetry is required")
		})

		test("should reject invalid maxRetryAttempts", () => {
			const invalidSettings = {
				enableRetry: true,
				maxRetryAttempts: 0, // Too low
				baseDelayMs: 1000,
				maxDelayMs: 30000,
				backoffMultiplier: 2,
				jitterFactor: 0.1,
				retryTimeoutMs: 60000,
			}

			const validation = RetryFactory.validateSettings(invalidSettings)

			expect(validation.isValid).toBe(false)
			expect(validation.errors).toContain("maxRetryAttempts must be between 1 and 10")
		})

		test("should reject invalid baseDelayMs", () => {
			const invalidSettings = {
				enableRetry: true,
				maxRetryAttempts: 3,
				baseDelayMs: 50, // Too low
				maxDelayMs: 30000,
				backoffMultiplier: 2,
				jitterFactor: 0.1,
				retryTimeoutMs: 60000,
			}

			const validation = RetryFactory.validateSettings(invalidSettings)

			expect(validation.isValid).toBe(false)
			expect(validation.errors).toContain("baseDelayMs must be between 100 and 10000")
		})

		test("should reject invalid maxDelayMs", () => {
			const invalidSettings = {
				enableRetry: true,
				maxRetryAttempts: 3,
				baseDelayMs: 1000,
				maxDelayMs: 500, // Too low
				backoffMultiplier: 2,
				jitterFactor: 0.1,
				retryTimeoutMs: 60000,
			}

			const validation = RetryFactory.validateSettings(invalidSettings)

			expect(validation.isValid).toBe(false)
			expect(validation.errors).toContain("maxDelayMs must be between 1000 and 300000")
		})

		test("should reject invalid backoffMultiplier", () => {
			const invalidSettings = {
				enableRetry: true,
				maxRetryAttempts: 3,
				baseDelayMs: 1000,
				maxDelayMs: 30000,
				backoffMultiplier: 1.0, // Too low
				jitterFactor: 0.1,
				retryTimeoutMs: 60000,
			}

			const validation = RetryFactory.validateSettings(invalidSettings)

			expect(validation.isValid).toBe(false)
			expect(validation.errors).toContain("backoffMultiplier must be between 1.1 and 5")
		})

		test("should reject invalid jitterFactor", () => {
			const invalidSettings = {
				enableRetry: true,
				maxRetryAttempts: 3,
				baseDelayMs: 1000,
				maxDelayMs: 30000,
				backoffMultiplier: 2,
				jitterFactor: 0.6, // Too high
				retryTimeoutMs: 60000,
			}

			const validation = RetryFactory.validateSettings(invalidSettings)

			expect(validation.isValid).toBe(false)
			expect(validation.errors).toContain("jitterFactor must be between 0 and 0.5")
		})

		test("should reject invalid retryTimeoutMs", () => {
			const invalidSettings = {
				enableRetry: true,
				maxRetryAttempts: 3,
				baseDelayMs: 1000,
				maxDelayMs: 30000,
				backoffMultiplier: 2,
				jitterFactor: 0.1,
				retryTimeoutMs: 3000, // Too low
			}

			const validation = RetryFactory.validateSettings(invalidSettings)

			expect(validation.isValid).toBe(false)
			expect(validation.errors).toContain("retryTimeoutMs must be between 5000 and 300000")
		})

		test("should reject logical inconsistency", () => {
			const invalidSettings = {
				enableRetry: true,
				maxRetryAttempts: 3,
				baseDelayMs: 5000, // Higher than max
				maxDelayMs: 3000,
				backoffMultiplier: 2,
				jitterFactor: 0.1,
				retryTimeoutMs: 60000,
			}

			const validation = RetryFactory.validateSettings(invalidSettings)

			expect(validation.isValid).toBe(false)
			expect(validation.errors).toContain("baseDelayMs cannot be greater than maxDelayMs")
		})
	})

	describe("mergeSettings", () => {
		test("should merge settings with defaults", () => {
			const baseSettings: RetrySettings = {
				enableRetry: true,
				maxRetryAttempts: 3,
				baseDelayMs: 1000,
				maxDelayMs: 30000,
				backoffMultiplier: 2,
				jitterFactor: 0.1,
				retryTimeoutMs: 60000,
			}

			const overrideSettings = {
				maxRetryAttempts: 5,
				jitterFactor: 0.2,
			}

			const merged = RetryFactory.mergeSettings(overrideSettings, baseSettings)

			expect(merged.enableRetry).toBe(true)
			expect(merged.maxRetryAttempts).toBe(5) // Override
			expect(merged.baseDelayMs).toBe(1000) // From base
			expect(merged.maxDelayMs).toBe(30000) // From base
			expect(merged.backoffMultiplier).toBe(2) // From base
			expect(merged.jitterFactor).toBe(0.2) // Override
			expect(merged.retryTimeoutMs).toBe(60000) // From base
		})

		test("should fall back to defaults on invalid merge", () => {
			const baseSettings: RetrySettings = {
				enableRetry: true,
				maxRetryAttempts: 3,
				baseDelayMs: 1000,
				maxDelayMs: 30000,
				backoffMultiplier: 2,
				jitterFactor: 0.1,
				retryTimeoutMs: 60000,
			}

			const invalidOverride = {
				maxRetryAttempts: 20, // Invalid
				jitterFactor: 1.0, // Invalid
			}

			const merged = RetryFactory.mergeSettings(invalidOverride, baseSettings)

			// Should fall back to base settings for invalid values
			expect(merged.maxRetryAttempts).toBe(3) // From base, not override
			expect(merged.jitterFactor).toBe(0.1) // From base, not override
		})
	})

	describe("getRecommendedSettings", () => {
		test("should return network settings", () => {
			const settings = RetryFactory.getRecommendedSettings("network")

			expect(settings.enableRetry).toBe(true)
			expect(settings.maxRetryAttempts).toBe(5) // Network default
			expect(settings.baseDelayMs).toBe(1000)
			expect(settings.maxDelayMs).toBe(30000)
			expect(settings.backoffMultiplier).toBe(2)
			expect(settings.jitterFactor).toBe(0.2)
		})

		test("should return filesystem settings", () => {
			const settings = RetryFactory.getRecommendedSettings("filesystem")

			expect(settings.enableRetry).toBe(true)
			expect(settings.maxRetryAttempts).toBe(3) // Filesystem default
			expect(settings.baseDelayMs).toBe(500)
			expect(settings.maxDelayMs).toBe(5000)
			expect(settings.backoffMultiplier).toBe(1.5)
			expect(settings.jitterFactor).toBe(0.1)
		})

		test("should return API settings", () => {
			const settings = RetryFactory.getRecommendedSettings("api")

			expect(settings.enableRetry).toBe(true)
			expect(settings.maxRetryAttempts).toBe(3) // API default
			expect(settings.baseDelayMs).toBe(2000)
			expect(settings.maxDelayMs).toBe(60000)
			expect(settings.backoffMultiplier).toBe(2.5)
			expect(settings.jitterFactor).toBe(0.3)
		})

		test("should return quick settings", () => {
			const settings = RetryFactory.getRecommendedSettings("quick")

			expect(settings.enableRetry).toBe(true)
			expect(settings.maxRetryAttempts).toBe(2) // Quick default
			expect(settings.baseDelayMs).toBe(100)
			expect(settings.maxDelayMs).toBe(1000)
			expect(settings.backoffMultiplier).toBe(1.5)
			expect(settings.jitterFactor).toBe(0.05)
		})

		test("should return resilient settings", () => {
			const settings = RetryFactory.getRecommendedSettings("resilient")

			expect(settings.enableRetry).toBe(true)
			expect(settings.maxRetryAttempts).toBe(10) // Resilient default
			expect(settings.baseDelayMs).toBe(2000)
			expect(settings.maxDelayMs).toBe(120000)
			expect(settings.backoffMultiplier).toBe(3)
			expect(settings.jitterFactor).toBe(0.5)
		})

		test("should default to network settings for unknown type", () => {
			const settings = RetryFactory.getRecommendedSettings("unknown" as any)

			expect(settings.enableRetry).toBe(true)
			expect(settings.maxRetryAttempts).toBe(5) // Network default
			expect(settings.baseDelayMs).toBe(1000)
			expect(settings.maxDelayMs).toBe(30000)
			expect(settings.backoffMultiplier).toBe(2)
			expect(settings.jitterFactor).toBe(0.2)
		})
	})

	describe("createRetryableExecution", () => {
		test("should create retryable execution", () => {
			const execute = vi.fn()
			const params = { param1: "value1" }
			const context = { taskId: "test-task" }
			const retryConfig = { maxRetryAttempts: 5 }

			const execution = RetryFactory.createRetryableExecution("test-tool", execute, params, context, retryConfig)

			expect(execution.toolName).toBe("test-tool")
			expect(execution.execute).toBe(execute)
			expect(execution.params).toEqual(params)
			expect(execution.context).toEqual(context)
			expect(execution.retryConfig).toEqual(retryConfig)
		})

		test("should create execution with minimal parameters", () => {
			const execute = vi.fn()
			const execution = RetryFactory.createRetryableExecution("test-tool", execute)

			expect(execution.toolName).toBe("test-tool")
			expect(execution.execute).toBe(execute)
			expect(execution.params).toEqual({})
			expect(execution.context).toBeUndefined()
			expect(execution.retryConfig).toBeUndefined()
		})
	})

	describe("Edge Cases", () => {
		test("should handle null error in classification", () => {
			const classification = RetryFactory.classifyError(null)

			expect(classification.isRetryable).toBe(true)
			expect(classification.category).toBe("unknown")
			expect(classification.severity).toBe("medium")
			expect(classification.backoffStrategy).toBe("exponential")
		})

		test("should handle undefined error in classification", () => {
			const classification = RetryFactory.classifyError(undefined)

			expect(classification.isRetryable).toBe(true)
			expect(classification.category).toBe("unknown")
			expect(classification.severity).toBe("medium")
			expect(classification.backoffStrategy).toBe("exponential")
		})

		test("should handle error without message", () => {
			const error = new Error()
			const classification = RetryFactory.classifyError(error)

			expect(classification.isRetryable).toBe(true)
			expect(classification.category).toBe("unknown")
			expect(classification.severity).toBe("medium")
		})

		test("should handle complex error objects", () => {
			const complexError = {
				message: "Network timeout",
				code: "NETWORK_TIMEOUT",
				status: 408,
				stack: "Error stack trace",
			}

			const classification = RetryFactory.classifyError(complexError)

			expect(classification.isRetryable).toBe(true)
			expect(classification.category).toBe("network")
			expect(classification.severity).toBe("medium")
		})

		test("should handle case insensitive matching", () => {
			const upperCaseError = new Error("NETWORK CONNECTION FAILED")
			const lowerCaseError = new Error("network connection failed")

			const classification1 = RetryFactory.classifyError(upperCaseError)
			const classification2 = RetryFactory.classifyError(lowerCaseError)

			expect(classification1.category).toBe(classification2.category)
			expect(classification1.isRetryable).toBe(classification2.isRetryable)
		})
	})
})
