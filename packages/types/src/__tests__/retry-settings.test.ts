// npx vitest run src/__tests__/retry-settings.test.ts

import { describe, it, expect } from "vitest"
import { z } from "zod"

import {
	retrySettingsSchema,
	DEFAULT_RETRY_SETTINGS,
	DEFAULT_MAX_RETRY_ATTEMPTS,
	DEFAULT_BASE_DELAY_MS,
	DEFAULT_MAX_DELAY_MS,
	DEFAULT_BACKOFF_MULTIPLIER,
	DEFAULT_JITTER_FACTOR,
	DEFAULT_RETRY_TIMEOUT_MS,
	MIN_MAX_RETRY_ATTEMPTS,
	MAX_MAX_RETRY_ATTEMPTS,
	MIN_BASE_DELAY_MS,
	MAX_BASE_DELAY_MS,
	MIN_MAX_DELAY_MS,
	MAX_MAX_DELAY_MS,
	MIN_BACKOFF_MULTIPLIER,
	MAX_BACKOFF_MULTIPLIER,
	MIN_JITTER_FACTOR,
	MAX_JITTER_FACTOR,
	MIN_RETRY_TIMEOUT_MS,
	MAX_RETRY_TIMEOUT_MS,
} from "../global-settings.js"

describe("Retry Settings Schema", () => {
	describe("retrySettingsSchema", () => {
		it("should accept valid retry settings", () => {
			const validSettings = {
				enableRetry: true,
				maxRetryAttempts: 3,
				baseDelayMs: 1000,
				maxDelayMs: 30000,
				backoffMultiplier: 2,
				jitterFactor: 0.1,
				enableContextOptimization: true,
				enableManualRetry: true,
				retryTimeoutMs: 60000,
			}

			const result = retrySettingsSchema.safeParse(validSettings)
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data).toEqual(validSettings)
			}
		})

		it("should accept partial settings (all fields optional)", () => {
			const partialSettings = {
				enableRetry: true,
				maxRetryAttempts: 5,
			}

			const result = retrySettingsSchema.safeParse(partialSettings)
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.enableRetry).toBe(true)
				expect(result.data.maxRetryAttempts).toBe(5)
				expect(result.data.baseDelayMs).toBeUndefined()
			}
		})

		it("should accept empty object", () => {
			const result = retrySettingsSchema.safeParse({})
			expect(result.success).toBe(true)
			if (result.success) {
				expect(Object.keys(result.data)).toHaveLength(0)
			}
		})

		it("should reject invalid maxRetryAttempts (too low)", () => {
			const invalidSettings = {
				maxRetryAttempts: 1, // Below minimum of 2
			}

			const result = retrySettingsSchema.safeParse(invalidSettings)
			expect(result.success).toBe(false)
			if (!result.success && result.error.issues[0]) {
				expect(result.error.issues[0].message).toContain("Number must be greater than or equal to 2")
			}
		})

		it("should reject invalid maxRetryAttempts (too high)", () => {
			const invalidSettings = {
				maxRetryAttempts: 11, // Above maximum of 10
			}

			const result = retrySettingsSchema.safeParse(invalidSettings)
			expect(result.success).toBe(false)
			if (!result.success && result.error.issues[0]) {
				expect(result.error.issues[0].message).toContain("Number must be less than or equal to 10")
			}
		})

		it("should reject invalid baseDelayMs (too low)", () => {
			const invalidSettings = {
				baseDelayMs: 50, // Below minimum of 100
			}

			const result = retrySettingsSchema.safeParse(invalidSettings)
			expect(result.success).toBe(false)
			if (!result.success && result.error.issues[0]) {
				expect(result.error.issues[0].message).toContain("Number must be greater than or equal to 100")
			}
		})

		it("should reject invalid baseDelayMs (too high)", () => {
			const invalidSettings = {
				baseDelayMs: 15000, // Above maximum of 10000
			}

			const result = retrySettingsSchema.safeParse(invalidSettings)
			expect(result.success).toBe(false)
			if (!result.success && result.error.issues[0]) {
				expect(result.error.issues[0].message).toContain("Number must be less than or equal to 10000")
			}
		})

		it("should reject invalid maxDelayMs (too low)", () => {
			const invalidSettings = {
				maxDelayMs: 500, // Below minimum of 1000
			}

			const result = retrySettingsSchema.safeParse(invalidSettings)
			expect(result.success).toBe(false)
			if (!result.success && result.error.issues[0]) {
				expect(result.error.issues[0].message).toContain("Number must be greater than or equal to 1000")
			}
		})

		it("should reject invalid maxDelayMs (too high)", () => {
			const invalidSettings = {
				maxDelayMs: 400000, // Above maximum of 300000
			}

			const result = retrySettingsSchema.safeParse(invalidSettings)
			expect(result.success).toBe(false)
			if (!result.success && result.error.issues[0]) {
				expect(result.error.issues[0].message).toContain("Number must be less than or equal to 300000")
			}
		})

		it("should reject invalid backoffMultiplier (too low)", () => {
			const invalidSettings = {
				backoffMultiplier: 1.0, // Below minimum of 1.1
			}

			const result = retrySettingsSchema.safeParse(invalidSettings)
			expect(result.success).toBe(false)
			if (!result.success && result.error.issues[0]) {
				expect(result.error.issues[0].message).toContain("Number must be greater than or equal to 1.1")
			}
		})

		it("should reject invalid backoffMultiplier (too high)", () => {
			const invalidSettings = {
				backoffMultiplier: 6, // Above maximum of 5
			}

			const result = retrySettingsSchema.safeParse(invalidSettings)
			expect(result.success).toBe(false)
			if (!result.success && result.error.issues[0]) {
				expect(result.error.issues[0].message).toContain("Number must be less than or equal to 5")
			}
		})

		it("should reject invalid jitterFactor (too low)", () => {
			const invalidSettings = {
				jitterFactor: -0.1, // Below minimum of 0
			}

			const result = retrySettingsSchema.safeParse(invalidSettings)
			expect(result.success).toBe(false)
			if (!result.success && result.error.issues[0]) {
				expect(result.error.issues[0].message).toContain("Number must be greater than or equal to 0")
			}
		})

		it("should reject invalid jitterFactor (too high)", () => {
			const invalidSettings = {
				jitterFactor: 0.6, // Above maximum of 0.5
			}

			const result = retrySettingsSchema.safeParse(invalidSettings)
			expect(result.success).toBe(false)
			if (!result.success && result.error.issues[0]) {
				expect(result.error.issues[0].message).toContain("Number must be less than or equal to 0.5")
			}
		})

		it("should reject invalid retryTimeoutMs (too low)", () => {
			const invalidSettings = {
				retryTimeoutMs: 3000, // Below minimum of 5000
			}

			const result = retrySettingsSchema.safeParse(invalidSettings)
			expect(result.success).toBe(false)
			if (!result.success && result.error.issues[0]) {
				expect(result.error.issues[0].message).toContain("Number must be greater than or equal to 5000")
			}
		})

		it("should reject invalid retryTimeoutMs (too high)", () => {
			const invalidSettings = {
				retryTimeoutMs: 400000, // Above maximum of 300000
			}

			const result = retrySettingsSchema.safeParse(invalidSettings)
			expect(result.success).toBe(false)
			if (!result.success && result.error.issues[0]) {
				expect(result.error.issues[0].message).toContain("Number must be less than or equal to 300000")
			}
		})

		it("should accept boundary values", () => {
			const boundarySettings = {
				maxRetryAttempts: MIN_MAX_RETRY_ATTEMPTS,
				baseDelayMs: MIN_BASE_DELAY_MS,
				maxDelayMs: MIN_MAX_DELAY_MS,
				backoffMultiplier: MIN_BACKOFF_MULTIPLIER,
				jitterFactor: MIN_JITTER_FACTOR,
				retryTimeoutMs: MIN_RETRY_TIMEOUT_MS,
			}

			const result = retrySettingsSchema.safeParse(boundarySettings)
			expect(result.success).toBe(true)
		})

		it("should accept maximum boundary values", () => {
			const maxBoundarySettings = {
				maxRetryAttempts: MAX_MAX_RETRY_ATTEMPTS,
				baseDelayMs: MAX_BASE_DELAY_MS,
				maxDelayMs: MAX_MAX_DELAY_MS,
				backoffMultiplier: MAX_BACKOFF_MULTIPLIER,
				jitterFactor: MAX_JITTER_FACTOR,
				retryTimeoutMs: MAX_RETRY_TIMEOUT_MS,
			}

			const result = retrySettingsSchema.safeParse(maxBoundarySettings)
			expect(result.success).toBe(true)
		})
	})

	describe("Constants", () => {
		it("should have correct default values", () => {
			expect(DEFAULT_MAX_RETRY_ATTEMPTS).toBe(3)
			expect(DEFAULT_BASE_DELAY_MS).toBe(1000)
			expect(DEFAULT_MAX_DELAY_MS).toBe(30000)
			expect(DEFAULT_BACKOFF_MULTIPLIER).toBe(2)
			expect(DEFAULT_JITTER_FACTOR).toBe(0.1)
			expect(DEFAULT_RETRY_TIMEOUT_MS).toBe(60000)
		})

		it("should have correct minimum bounds", () => {
			expect(MIN_MAX_RETRY_ATTEMPTS).toBe(2)
			expect(MIN_BASE_DELAY_MS).toBe(100)
			expect(MIN_MAX_DELAY_MS).toBe(1000)
			expect(MIN_BACKOFF_MULTIPLIER).toBe(1.1)
			expect(MIN_JITTER_FACTOR).toBe(0)
			expect(MIN_RETRY_TIMEOUT_MS).toBe(5000)
		})

		it("should have correct maximum bounds", () => {
			expect(MAX_MAX_RETRY_ATTEMPTS).toBe(10)
			expect(MAX_BASE_DELAY_MS).toBe(10000)
			expect(MAX_MAX_DELAY_MS).toBe(300000)
			expect(MAX_BACKOFF_MULTIPLIER).toBe(5)
			expect(MAX_JITTER_FACTOR).toBe(0.5)
			expect(MAX_RETRY_TIMEOUT_MS).toBe(300000)
		})
	})

	describe("DEFAULT_RETRY_SETTINGS", () => {
		it("should contain all required fields with default values", () => {
			expect(DEFAULT_RETRY_SETTINGS).toEqual({
				enableRetry: false,
				maxRetryAttempts: DEFAULT_MAX_RETRY_ATTEMPTS,
				baseDelayMs: DEFAULT_BASE_DELAY_MS,
				maxDelayMs: DEFAULT_MAX_DELAY_MS,
				backoffMultiplier: DEFAULT_BACKOFF_MULTIPLIER,
				jitterFactor: DEFAULT_JITTER_FACTOR,
				enableContextOptimization: true,
				enableManualRetry: true,
				retryTimeoutMs: DEFAULT_RETRY_TIMEOUT_MS,
			})
		})

		it("should validate against the schema", () => {
			const result = retrySettingsSchema.safeParse(DEFAULT_RETRY_SETTINGS)
			expect(result.success).toBe(true)
		})
	})

	describe("Type Safety", () => {
		it("should infer correct types", () => {
			// This test ensures TypeScript types are correctly inferred
			const settings: z.infer<typeof retrySettingsSchema> = {
				enableRetry: true,
				maxRetryAttempts: 3,
				baseDelayMs: 1000,
				maxDelayMs: 30000,
				backoffMultiplier: 2,
				jitterFactor: 0.1,
				enableContextOptimization: true,
				enableManualRetry: true,
				retryTimeoutMs: 60000,
			}

			expect(settings.enableRetry).toBe(true)
			expect(settings.maxRetryAttempts).toBe(3)
			// TypeScript should catch any missing or incorrect properties
		})
	})
})
