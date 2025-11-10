import { describe, test, expect, beforeEach, afterEach, vi } from "vitest"
import { ContextStateManager, MEMORY_THRESHOLDS } from "../ContextStateManager"
import { ContextOptimizer, ContextOptimizationStrategy } from "../ContextOptimizer"
import type { ApiMessage } from "../../../../shared/ExtensionMessage"
import type { ClineMessage } from "../../../../shared/ExtensionMessage"

describe("ContextStateManager", () => {
	let stateManager: ContextStateManager
	let mockApiHistory: ApiMessage[]
	let mockClineMessages: ClineMessage[]

	beforeEach(() => {
		stateManager = new ContextStateManager()

		mockApiHistory = Array.from({ length: 100 }, (_, i) => ({
			role: "user",
			content: [{ type: "text", text: `Message ${i}` }],
			ts: Date.now() - (100 - i) * 1000,
		}))

		mockClineMessages = Array.from({ length: 100 }, (_, i) => ({
			type: "say",
			say: "text",
			text: `UI: Message ${i}`,
			ts: Date.now() - (100 - i) * 1000,
		}))
	})

	afterEach(() => {
		stateManager.reset()
	})

	describe("Memory State Tracking", () => {
		test("should track memory state correctly", () => {
			const optimizationResult: any = {
				success: true,
				optimizedApiHistory: mockApiHistory.slice(0, 50),
				optimizedClineMessages: mockClineMessages.slice(0, 50),
				strategy: ContextOptimizationStrategy.PRESERVE_CRITICAL_CONTEXT,
				contextReduction: 50,
			}

			stateManager.manageContextDuringOptimization(
				optimizationResult,
				mockApiHistory,
				mockClineMessages,
				10000, // contextSize
				100000, // maxTokens
			)

			const memoryState = stateManager.getMemoryState()
			expect(memoryState.totalOptimizations).toBe(1)
			expect(memoryState.averageContextSize).toBeGreaterThan(0)
			expect(memoryState.peakContextSize).toBeGreaterThanOrEqual(10000)
		})

		test("should detect memory pressure", () => {
			const optimizationResult: any = {
				success: true,
				optimizedApiHistory: mockApiHistory,
				optimizedClineMessages: mockClineMessages,
				strategy: ContextOptimizationStrategy.PRESERVE_CRITICAL_CONTEXT,
				contextReduction: 0,
			}

			// Simulate high memory pressure
			stateManager.manageContextDuringOptimization(
				optimizationResult,
				mockApiHistory,
				mockClineMessages,
				950000, // contextSize (95% of max)
				1000000, // maxTokens
			)

			const memoryState = stateManager.getMemoryState()
			expect(memoryState.memoryPressureLevel).toBeGreaterThan(0.9)
		})

		test("should track growth cycles", () => {
			const optimizationResult: any = {
				success: true,
				optimizedApiHistory: mockApiHistory.slice(0, 80),
				optimizedClineMessages: mockClineMessages.slice(0, 80),
				strategy: ContextOptimizationStrategy.PRESERVE_CRITICAL_CONTEXT,
				contextReduction: 20,
			}

			// First optimization - should not trigger growth cycle
			stateManager.manageContextDuringOptimization(
				optimizationResult,
				mockApiHistory,
				mockClineMessages,
				8000, // contextSize
				10000, // maxTokens
			)

			let memoryState = stateManager.getMemoryState()
			expect(memoryState.growthCycles).toBe(0)

			// Second optimization with growth - should trigger growth cycle
			const growthResult: any = {
				success: true,
				optimizedApiHistory: mockApiHistory.slice(0, 120), // Growth
				optimizedClineMessages: mockClineMessages.slice(0, 120),
				strategy: ContextOptimizationStrategy.PRESERVE_CRITICAL_CONTEXT,
				contextReduction: -20, // Negative indicates growth
			}

			stateManager.manageContextDuringOptimization(
				growthResult,
				mockApiHistory,
				mockClineMessages,
				12000, // contextSize (growth)
				10000, // maxTokens
			)

			memoryState = stateManager.getMemoryState()
			expect(memoryState.growthCycles).toBe(1)
		})
	})

	describe("Critical Memory Pressure", () => {
		test("should trigger emergency cleanup on critical pressure", () => {
			const consoleSpy = vi.spyOn(console, "warn")

			const optimizationResult: any = {
				success: true,
				optimizedApiHistory: mockApiHistory,
				optimizedClineMessages: mockClineMessages,
				strategy: ContextOptimizationStrategy.PRESERVE_CRITICAL_CONTEXT,
				contextReduction: 0,
			}

			stateManager.manageContextDuringOptimization(
				optimizationResult,
				mockApiHistory,
				mockClineMessages,
				950000, // contextSize (95% of 1M)
				1000000, // maxTokens (1M)
			)

			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringContaining("Critical memory pressure detected"),
				expect.any(Object),
			)

			consoleSpy.mockRestore()
		})

		test("should trigger aggressive cleanup on excessive growth", () => {
			const consoleSpy = vi.spyOn(console, "warn")

			// Simulate multiple growth cycles
			for (let i = 0; i < 4; i++) {
				const growthResult: any = {
					success: true,
					optimizedApiHistory: mockApiHistory,
					optimizedClineMessages: mockClineMessages,
					strategy: ContextOptimizationStrategy.PRESERVE_CRITICAL_CONTEXT,
					contextReduction: -10, // Growth each time
				}

				stateManager.manageContextDuringOptimization(
					growthResult,
					mockApiHistory,
					mockClineMessages,
					10000 * (1 + i * 0.6), // Exceeding average by 60%
					10000, // maxTokens
				)
			}

			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringContaining("Excessive growth cycles detected"),
				expect.any(Object),
			)

			consoleSpy.mockRestore()
		})

		test("should trigger aggressive cleanup on high pressure", () => {
			const consoleSpy = vi.spyOn(console, "warn")

			const optimizationResult: any = {
				success: true,
				optimizedApiHistory: mockApiHistory,
				optimizedClineMessages: mockClineMessages,
				strategy: ContextOptimizationStrategy.PRESERVE_CRITICAL_CONTEXT,
				contextReduction: 0,
			}

			stateManager.manageContextDuringOptimization(
				optimizationResult,
				mockApiHistory,
				mockClineMessages,
				850000, // contextSize (85% of max)
				1000000, // maxTokens
			)

			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringContaining("Aggressive cleanup triggered"),
				expect.any(Object),
			)

			consoleSpy.mockRestore()
		})
	})

	describe("Context Restoration", () => {
		test("should restore context after failure", () => {
			const optimizationResult: any = {
				success: true,
				optimizedApiHistory: mockApiHistory.slice(0, 50),
				optimizedClineMessages: mockClineMessages.slice(0, 50),
				strategy: ContextOptimizationStrategy.PRESERVE_CRITICAL_CONTEXT,
				contextReduction: 50,
			}

			// First, manage context to store original state
			stateManager.manageContextDuringOptimization(
				optimizationResult,
				mockApiHistory,
				mockClineMessages,
				10000, // contextSize
				100000, // maxTokens
			)

			// Then simulate failure and restore
			const failedApiHistory = mockApiHistory.slice(0, 25) // Reduced further
			const failedClineMessages = mockClineMessages.slice(0, 25)

			const restorationResult = stateManager.restoreContextAfterFailure(failedApiHistory, failedClineMessages)

			expect(restorationResult.success).toBe(true)
			expect(restorationResult.restoredApiHistory).toEqual(mockApiHistory.slice(0, 50))
			expect(restorationResult.restoredClineMessages).toEqual(mockClineMessages.slice(0, 50))
		})

		test("should handle restoration without stored state", () => {
			const consoleSpy = vi.spyOn(console, "warn")

			const failedApiHistory = mockApiHistory.slice(0, 25)
			const failedClineMessages = mockClineMessages.slice(0, 25)

			const restorationResult = stateManager.restoreContextAfterFailure(failedApiHistory, failedClineMessages)

			expect(restorationResult.success).toBe(false)
			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringContaining("No restoration state available"),
				expect.any(Object),
			)

			consoleSpy.mockRestore()
		})

		test("should handle restoration with corrupted state", () => {
			const optimizationResult: any = {
				success: true,
				optimizedApiHistory: mockApiHistory.slice(0, 50),
				optimizedClineMessages: mockClineMessages.slice(0, 50),
				strategy: ContextOptimizationStrategy.PRESERVE_CRITICAL_CONTEXT,
				contextReduction: 50,
			}

			// Store state
			stateManager.manageContextDuringOptimization(
				optimizationResult,
				mockApiHistory,
				mockClineMessages,
				10000,
				100000,
			)

			// Clear stored state to simulate corruption
			stateManager.reset()

			const consoleSpy = vi.spyOn(console, "warn")
			const failedApiHistory = mockApiHistory.slice(0, 25)
			const failedClineMessages = mockClineMessages.slice(0, 25)

			const restorationResult = stateManager.restoreContextAfterFailure(failedApiHistory, failedClineMessages)

			expect(restorationResult.success).toBe(false)
			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringContaining("No restoration data available"),
				expect.any(Object),
			)

			consoleSpy.mockRestore()
		})
	})

	describe("Context Validation", () => {
		test("should validate correct context preservation", () => {
			const optimizationResult: any = {
				success: true,
				optimizedApiHistory: mockApiHistory.slice(0, 80),
				optimizedClineMessages: mockClineMessages.slice(0, 80),
				strategy: ContextOptimizationStrategy.PRESERVE_CRITICAL_CONTEXT,
				contextReduction: 20,
			}

			stateManager.manageContextDuringOptimization(
				optimizationResult,
				mockApiHistory,
				mockClineMessages,
				8000, // contextSize
				100000, // maxTokens
			)

			const validation = stateManager.validateContextPreservation(
				optimizationResult.optimizedApiHistory,
				optimizationResult.optimizedClineMessages,
				mockApiHistory,
				mockClineMessages,
			)

			expect(validation.isValid).toBe(true)
			expect(validation.issues).toHaveLength(0)
		})

		test("should detect excessive growth cycles", () => {
			// Trigger multiple growth cycles
			for (let i = 0; i < 4; i++) {
				const growthResult: any = {
					success: true,
					optimizedApiHistory: mockApiHistory,
					optimizedClineMessages: mockClineMessages,
					strategy: ContextOptimizationStrategy.PRESERVE_CRITICAL_CONTEXT,
					contextReduction: -10, // Growth
				}

				stateManager.manageContextDuringOptimization(
					growthResult,
					mockApiHistory,
					mockClineMessages,
					10000 * (1 + i * 0.6), // Exceeding average
					10000,
				)
			}

			const validation = stateManager.validateContextPreservation(
				mockApiHistory,
				mockClineMessages,
				mockApiHistory,
				mockClineMessages,
			)

			expect(validation.isValid).toBe(false)
			expect(validation.issues).toContain("Excessive context growth cycles detected")
		})

		test("should detect critical memory pressure", () => {
			const optimizationResult: any = {
				success: true,
				optimizedApiHistory: mockApiHistory,
				optimizedClineMessages: mockClineMessages,
				strategy: ContextOptimizationStrategy.PRESERVE_CRITICAL_CONTEXT,
				contextReduction: 0,
			}

			stateManager.manageContextDuringOptimization(
				optimizationResult,
				mockApiHistory,
				mockClineMessages,
				950000, // contextSize (95% of 1M)
				1000000, // maxTokens
			)

			const validation = stateManager.validateContextPreservation(
				optimizationResult.optimizedApiHistory,
				optimizationResult.optimizedClineMessages,
				mockApiHistory,
				mockClineMessages,
			)

			expect(validation.isValid).toBe(false)
			expect(validation.issues).toContain("Critical memory pressure level detected")
		})

		test("should detect synchronization imbalance", () => {
			const optimizationResult: any = {
				success: true,
				optimizedApiHistory: mockApiHistory.slice(0, 50),
				optimizedClineMessages: mockClineMessages.slice(0, 100), // 2x imbalance
				strategy: ContextOptimizationStrategy.PRESERVE_CRITICAL_CONTEXT,
				contextReduction: 50,
			}

			stateManager.manageContextDuringOptimization(
				optimizationResult,
				mockApiHistory,
				mockClineMessages,
				5000, // contextSize
				100000, // maxTokens
			)

			const validation = stateManager.validateContextPreservation(
				optimizationResult.optimizedApiHistory,
				optimizationResult.optimizedClineMessages,
				mockApiHistory,
				mockClineMessages,
			)

			expect(validation.isValid).toBe(false)
			expect(validation.issues).toContain("History synchronization imbalance")
		})
	})

	describe("Restoration State", () => {
		test("should track restoration attempts", () => {
			const optimizationResult: any = {
				success: true,
				optimizedApiHistory: mockApiHistory.slice(0, 50),
				optimizedClineMessages: mockClineMessages.slice(0, 50),
				strategy: ContextOptimizationStrategy.PRESERVE_CRITICAL_CONTEXT,
				contextReduction: 50,
			}

			// Store state
			stateManager.manageContextDuringOptimization(
				optimizationResult,
				mockApiHistory,
				mockClineMessages,
				10000,
				100000,
			)

			const restorationState = stateManager.getRestorationState()
			expect(restorationState.originalApiHistory).toEqual(mockApiHistory)
			expect(restorationState.originalClineMessages).toEqual(mockClineMessages)
			expect(restorationState.restorationAttempts).toBe(0)
		})

		test("should update restoration statistics", () => {
			const optimizationResult: any = {
				success: true,
				optimizedApiHistory: mockApiHistory.slice(0, 50),
				optimizedClineMessages: mockClineMessages.slice(0, 50),
				strategy: ContextOptimizationStrategy.PRESERVE_CRITICAL_CONTEXT,
				contextReduction: 50,
			}

			// Store state
			stateManager.manageContextDuringOptimization(
				optimizationResult,
				mockApiHistory,
				mockClineMessages,
				10000,
				100000,
			)

			// Failed restoration attempt
			stateManager.restoreContextAfterFailure(mockApiHistory.slice(0, 25), mockClineMessages.slice(0, 25))

			// Successful restoration attempt
			const restorationResult = stateManager.restoreContextAfterFailure(
				optimizationResult.optimizedApiHistory,
				optimizationResult.optimizedClineMessages,
			)

			expect(restorationResult.success).toBe(true)

			const restorationState = stateManager.getRestorationState()
			expect(restorationState.restorationAttempts).toBe(2)
			expect(restorationState.successfulRestorations).toBe(1)
			expect(restorationState.lastRestorationTime).toBeGreaterThan(0)
		})
	})

	describe("Memory Thresholds", () => {
		test("should respect configured thresholds", () => {
			expect(MEMORY_THRESHOLDS.GROWTH_DETECTION).toBe(0.5)
			expect(MEMORY_THRESHOLDS.MAX_GROWTH_CYCLES).toBe(3)
			expect(MEMORY_THRESHOLDS.AGGRESSIVE_CLEANUP_THRESHOLD).toBe(0.8)
			expect(MEMORY_THRESHOLDS.CRITICAL_MEMORY_THRESHOLD).toBe(0.95)
		})
	})

	describe("Edge Cases", () => {
		test("should handle empty histories", () => {
			const optimizationResult: any = {
				success: true,
				optimizedApiHistory: [],
				optimizedClineMessages: [],
				strategy: ContextOptimizationStrategy.PRESERVE_CRITICAL_CONTEXT,
				contextReduction: 100,
			}

			stateManager.manageContextDuringOptimization(
				optimizationResult,
				[],
				[],
				0, // contextSize
				100000, // maxTokens
			)

			const memoryState = stateManager.getMemoryState()
			expect(memoryState.totalOptimizations).toBe(1)
			// Should handle gracefully
		})

		test("should handle very large histories", () => {
			const largeApiHistory = Array.from({ length: 10000 }, (_, i) => ({
				role: "user",
				content: [{ type: "text", text: `Message ${i}` }],
				ts: Date.now() - i * 1000,
			}))

			const largeClineMessages = Array.from({ length: 10000 }, (_, i) => ({
				type: "say",
				say: "text",
				text: `UI: Message ${i}`,
				ts: Date.now() - i * 1000,
			}))

			const optimizationResult: any = {
				success: true,
				optimizedApiHistory: largeApiHistory.slice(0, 5000),
				optimizedClineMessages: largeClineMessages.slice(0, 5000),
				strategy: ContextOptimizationStrategy.AGGRESSIVE_TRUNCATION,
				contextReduction: 50,
			}

			const startTime = Date.now()
			stateManager.manageContextDuringOptimization(
				optimizationResult,
				largeApiHistory,
				largeClineMessages,
				500000, // contextSize
				1000000, // maxTokens
			)
			const duration = Date.now() - startTime

			expect(duration).toBeLessThan(1000) // Should complete within 1 second even for large data
		})

		test("should handle concurrent operations", async () => {
			const optimizationResult: any = {
				success: true,
				optimizedApiHistory: mockApiHistory.slice(0, 50),
				optimizedClineMessages: mockClineMessages.slice(0, 50),
				strategy: ContextOptimizationStrategy.PRESERVE_CRITICAL_CONTEXT,
				contextReduction: 50,
			}

			const promises = Array.from({ length: 10 }, (_, i) =>
				Promise.resolve().then(() =>
					stateManager.manageContextDuringOptimization(
						optimizationResult,
						mockApiHistory.slice(0, i + 1),
						mockClineMessages.slice(0, i + 1),
						(i + 1) * 1000,
						100000,
					),
				),
			)

			await Promise.all(promises)

			const memoryState = stateManager.getMemoryState()
			expect(memoryState.totalOptimizations).toBe(10)
			// Should handle concurrent operations safely
		})
	})

	describe("Reset Functionality", () => {
		test("should reset all state", () => {
			// Perform some operations
			const optimizationResult: any = {
				success: true,
				optimizedApiHistory: mockApiHistory.slice(0, 50),
				optimizedClineMessages: mockClineMessages.slice(0, 50),
				strategy: ContextOptimizationStrategy.PRESERVE_CRITICAL_CONTEXT,
				contextReduction: 50,
			}

			stateManager.manageContextDuringOptimization(
				optimizationResult,
				mockApiHistory,
				mockClineMessages,
				10000,
				100000,
			)

			// Verify state is populated
			let memoryState = stateManager.getMemoryState()
			expect(memoryState.totalOptimizations).toBeGreaterThan(0)

			// Reset
			stateManager.reset()

			// Verify state is cleared
			memoryState = stateManager.getMemoryState()
			expect(memoryState.totalOptimizations).toBe(0)
			expect(memoryState.growthCycles).toBe(0)
			expect(memoryState.averageContextSize).toBe(0)
			expect(memoryState.peakContextSize).toBe(0)

			const restorationState = stateManager.getRestorationState()
			expect(restorationState.restorationAttempts).toBe(0)
			expect(restorationState.successfulRestorations).toBe(0)
			expect(restorationState.originalApiHistory).toHaveLength(0)
			expect(restorationState.originalClineMessages).toHaveLength(0)
		})
	})
})
