import { describe, test, expect, beforeEach } from "vitest"
import { BackoffStrategy } from "../BackoffStrategy"

describe("BackoffStrategy", () => {
	let strategy: BackoffStrategy

	beforeEach(() => {
		strategy = new BackoffStrategy({
			baseDelay: 1000,
			maxDelay: 30000,
			multiplier: 2,
			jitterFactor: 0.1,
			maxAttempts: 3,
		})
	})

	describe("Configuration", () => {
		test("should initialize with default values", () => {
			const defaultStrategy = new BackoffStrategy()
			const config = defaultStrategy.getConfig()

			expect(config.baseDelay).toBe(1000)
			expect(config.maxDelay).toBe(30000)
			expect(config.multiplier).toBe(2)
			expect(config.jitterFactor).toBe(0.1)
			expect(config.maxAttempts).toBe(3)
		})

		test("should accept custom configuration", () => {
			const customStrategy = new BackoffStrategy({
				baseDelay: 500,
				maxDelay: 10000,
				multiplier: 3,
				jitterFactor: 0.2,
				maxAttempts: 5,
			})

			const config = customStrategy.getConfig()
			expect(config.baseDelay).toBe(500)
			expect(config.maxDelay).toBe(10000)
			expect(config.multiplier).toBe(3)
			expect(config.jitterFactor).toBe(0.2)
			expect(config.maxAttempts).toBe(5)
		})

		test("should validate configuration", () => {
			expect(strategy.validateConfig()).toBe(true)

			const invalidStrategy = new BackoffStrategy({
				baseDelay: -1,
				maxDelay: 100,
				multiplier: 0.5,
				jitterFactor: 1.5,
				maxAttempts: 0,
			})

			expect(invalidStrategy.validateConfig()).toBe(false)
		})
	})

	describe("Delay Calculation", () => {
		test("should calculate exponential backoff", () => {
			// 0th attempt: 1000ms * 2^0 = 1000ms (with jitter)
			const delay0 = strategy.calculateDelay(0)
			expect(delay0).toBeGreaterThan(900)
			expect(delay0).toBeLessThan(1100)

			// 1st attempt: 1000ms * 2^1 = 2000ms (with jitter)
			const delay1 = strategy.calculateDelay(1)
			expect(delay1).toBeGreaterThan(1800)
			expect(delay1).toBeLessThan(2200)

			// 2nd attempt: 1000ms * 2^2 = 4000ms (with jitter)
			const delay2 = strategy.calculateDelay(2)
			expect(delay2).toBeGreaterThan(3600)
			expect(delay2).toBeLessThan(4400)
		})

		test("should apply maximum delay limit", () => {
			// Should be capped at maxDelay
			const highAttempt = 10 // Very high attempt number
			const delay = strategy.calculateDelay(highAttempt)
			expect(delay).toBeLessThanOrEqual(30000)
		})

		test("should apply jitter", () => {
			// With jitter, results should vary
			const delays = Array.from({ length: 10 }, () => strategy.calculateDelay(1))
			const uniqueDelays = new Set(delays)

			// Should have some variation due to jitter
			expect(uniqueDelays.size).toBeGreaterThan(1)
		})

		test("should handle negative attempt numbers", () => {
			expect(strategy.calculateDelay(-1)).toBe(0)
			expect(strategy.calculateDelay(-5)).toBe(0)
		})

		test("should calculate delay with custom jitter", () => {
			const baseDelay = strategy.calculateDelay(1)
			const customJitterDelay = strategy.calculateDelayWithCustomJitter(1, 0.5)

			// Should be different due to different jitter factor
			expect(customJitterDelay).not.toBe(baseDelay)
		})
	})

	describe("Retry Decision", () => {
		test("should determine if retry should be attempted", () => {
			expect(strategy.shouldRetry(0)).toBe(true) // First attempt
			expect(strategy.shouldRetry(1)).toBe(true) // Second attempt
			expect(strategy.shouldRetry(2)).toBe(false) // Third attempt (maxAttempts = 3)
		})
	})

	describe("Delay Sequence", () => {
		test("should calculate complete delay sequence", () => {
			const sequence = strategy.calculateDelaySequence()
			expect(sequence).toHaveLength(2) // maxAttempts - 1
			expect(sequence[0]).toBeGreaterThan(900) // First delay with jitter
			expect(sequence[0]).toBeLessThan(1100)
			expect(sequence[1]).toBeGreaterThan(1800) // Second delay with jitter
			expect(sequence[1]).toBeLessThan(2200)
		})

		test("should calculate partial delay sequence", () => {
			const sequence = strategy.calculateDelaySequence(2)
			expect(sequence).toHaveLength(1) // 2 attempts - 1 = 1 delay
		})
	})

	describe("Time Estimation", () => {
		test("should calculate total estimated time", () => {
			const totalTime = strategy.getTotalEstimatedTime()
			expect(totalTime).toBeGreaterThan(0)
			expect(totalTime).toBeLessThan(50000) // Reasonable upper bound
		})
	})

	describe("Static Factory Methods", () => {
		test("should create immediate retry strategy", () => {
			const immediateStrategy = BackoffStrategy.immediate(5)
			const config = immediateStrategy.getConfig()

			expect(config.baseDelay).toBe(0)
			expect(config.maxDelay).toBe(0)
			expect(config.multiplier).toBe(1)
			expect(config.jitterFactor).toBe(0)
			expect(config.maxAttempts).toBe(5)
		})

		test("should create linear backoff strategy", () => {
			const linearStrategy = BackoffStrategy.linear(500, 5000, 4)
			const config = linearStrategy.getConfig()

			expect(config.baseDelay).toBe(500)
			expect(config.maxDelay).toBe(5000)
			expect(config.multiplier).toBe(1) // Linear growth
			expect(config.maxAttempts).toBe(4)
		})

		test("should create exponential backoff strategy", () => {
			const expStrategy = BackoffStrategy.exponential(1000, 10000, 3, 0.2, 6)
			const config = expStrategy.getConfig()

			expect(config.baseDelay).toBe(1000)
			expect(config.maxDelay).toBe(10000)
			expect(config.multiplier).toBe(3)
			expect(config.jitterFactor).toBe(0.2)
			expect(config.maxAttempts).toBe(6)
		})
	})

	describe("Description", () => {
		test("should provide human-readable description", () => {
			const description = strategy.getDescription()
			expect(description).toContain("Exponential backoff")
			expect(description).toContain("1000ms")
			expect(description).toContain("30000ms")
			expect(description).toContain("2x")
			expect(description).toContain("10%")
		})

		test("should describe immediate retry correctly", () => {
			const immediateStrategy = BackoffStrategy.immediate(3)
			const description = immediateStrategy.getDescription()
			expect(description).toContain("Immediate retry")
			expect(description).toContain("3 attempts")
		})

		test("should describe linear backoff correctly", () => {
			const linearStrategy = BackoffStrategy.linear(1000, 5000, 3)
			const description = linearStrategy.getDescription()
			expect(description).toContain("Linear backoff")
		})
	})

	describe("Configuration Updates", () => {
		test("should update configuration", () => {
			strategy.updateConfig({
				baseDelay: 2000,
				multiplier: 3,
			})

			const config = strategy.getConfig()
			expect(config.baseDelay).toBe(2000)
			expect(config.multiplier).toBe(3)
			// Other values should remain unchanged
			expect(config.maxDelay).toBe(30000)
			expect(config.jitterFactor).toBe(0.1)
		})
	})

	describe("Edge Cases", () => {
		test("should handle zero jitter factor", () => {
			const noJitterStrategy = new BackoffStrategy({
				baseDelay: 1000,
				maxDelay: 30000,
				multiplier: 2,
				jitterFactor: 0,
				maxAttempts: 3,
			})

			// Should return consistent values without jitter
			const delay1 = noJitterStrategy.calculateDelay(1)
			const delay2 = noJitterStrategy.calculateDelay(1)
			expect(delay1).toBe(delay2)
		})

		test("should handle very high multipliers", () => {
			const highMultiplierStrategy = new BackoffStrategy({
				baseDelay: 1000,
				maxDelay: 30000,
				multiplier: 10,
				jitterFactor: 0,
				maxAttempts: 3,
			})

			// Should be capped at maxDelay
			expect(highMultiplierStrategy.calculateDelay(2)).toBe(30000)
		})

		test("should handle boundary conditions", () => {
			expect(strategy.calculateDelay(0)).toBeGreaterThan(0)
			expect(strategy.calculateDelay(Number.MAX_SAFE_INTEGER)).toBeLessThanOrEqual(30000)
		})
	})
})
