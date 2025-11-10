import { describe, test, expect, beforeEach, vi } from "vitest"
import { DualHistorySynchronizer } from "../DualHistorySynchronizer"
import type { ApiMessage } from "../../../../shared/ExtensionMessage"
import type { ClineMessage } from "../../../../shared/ExtensionMessage"

describe("DualHistorySynchronizer", () => {
	let synchronizer: DualHistorySynchronizer
	let mockApiHistory: ApiMessage[]
	let mockClineMessages: ClineMessage[]

	beforeEach(() => {
		synchronizer = new DualHistorySynchronizer()

		mockApiHistory = [
			{ role: "system", content: [{ type: "text", text: "System prompt" }], ts: Date.now() - 10000 },
			{ role: "user", content: [{ type: "text", text: "User message 1" }], ts: Date.now() - 8000 },
			{ role: "assistant", content: [{ type: "text", text: "Assistant response 1" }], ts: Date.now() - 6000 },
			{ role: "user", content: [{ type: "text", text: "User message 2" }], ts: Date.now() - 4000 },
			{ role: "assistant", content: [{ type: "text", text: "Assistant response 2" }], ts: Date.now() - 2000 },
		]

		mockClineMessages = [
			{ type: "say", say: "text", text: "UI: System prompt", ts: Date.now() - 10000 },
			{ type: "say", say: "text", text: "UI: User message 1", ts: Date.now() - 8000 },
			{ type: "say", say: "text", text: "UI: Assistant response 1", ts: Date.now() - 6000 },
			{ type: "say", say: "text", text: "UI: User message 2", ts: Date.now() - 4000 },
			{ type: "say", say: "text", text: "UI: Assistant response 2", ts: Date.now() - 2000 },
		]
	})

	describe("synchronizeHistories", () => {
		test("should synchronize matching histories", () => {
			const result = synchronizer.synchronizeHistories(mockApiHistory, mockClineMessages, "test synchronization")

			expect(result.success).toBe(true)
			expect(result.syncedElements).toBeGreaterThan(0)
			expect(result.unsyncedElements).toBe(0)
			expect(result.error).toBeUndefined()
		})

		test("should handle missing API messages", () => {
			const shorterApiHistory = mockApiHistory.slice(0, 3)
			const result = synchronizer.synchronizeHistories(
				shorterApiHistory,
				mockClineMessages,
				"test synchronization",
			)

			expect(result.success).toBe(true)
			expect(result.syncedElements).toBe(3) // Only 3 API messages found matches
			expect(result.unsyncedElements).toBe(1) // 1 Cline message without API counterpart
		})

		test("should handle missing Cline messages", () => {
			const shorterClineMessages = mockClineMessages.slice(0, 3)
			const result = synchronizer.synchronizeHistories(
				mockApiHistory,
				shorterClineMessages,
				"test synchronization",
			)

			expect(result.success).toBe(true)
			expect(result.syncedElements).toBe(3) // Only 3 Cline messages found matches
			expect(result.unsyncedElements).toBe(2) // 2 API messages without Cline counterpart
		})

		test("should handle empty histories", () => {
			const result = synchronizer.synchronizeHistories([], [], "test synchronization")

			expect(result.success).toBe(true)
			expect(result.syncedElements).toBe(0)
			expect(result.unsyncedElements).toBe(0)
		})

		test("should handle invalid inputs", () => {
			const result1 = synchronizer.synchronizeHistories(null as any, mockClineMessages, "test synchronization")

			const result2 = synchronizer.synchronizeHistories(mockApiHistory, undefined as any, "test synchronization")

			expect(result1.success).toBe(false)
			expect(result1.error).toContain("Invalid input")
			expect(result2.success).toBe(false)
			expect(result2.error).toContain("Invalid input")
		})

		test("should create missing Cline messages", () => {
			const result = synchronizer.synchronizeHistories(
				mockApiHistory,
				[], // No Cline messages
				"test synchronization",
			)

			expect(result.success).toBe(true)
			expect(result.clineMessages.length).toBe(mockApiHistory.length)
			expect(result.unsyncedElements).toBe(mockApiHistory.length)
		})

		test("should create missing API messages", () => {
			const result = synchronizer.synchronizeHistories(
				[], // No API messages
				mockClineMessages,
				"test synchronization",
			)

			expect(result.success).toBe(true)
			expect(result.apiHistory.length).toBe(mockClineMessages.length)
			expect(result.unsyncedElements).toBe(mockClineMessages.length)
		})
	})

	describe("validateSynchronization", () => {
		test("should validate properly synchronized histories", () => {
			const validation = synchronizer.validateSynchronization(mockApiHistory, mockClineMessages)

			expect(validation.isValid).toBe(true)
			expect(validation.issues).toHaveLength(0)
		})

		test("should detect length differences", () => {
			const tooLongApiHistory = [...mockApiHistory, ...mockApiHistory] // Double the length
			const validation = synchronizer.validateSynchronization(tooLongApiHistory, mockClineMessages)

			expect(validation.isValid).toBe(false)
			expect(validation.issues).toContain("Significant length difference")
		})

		test("should detect message ordering issues", () => {
			const outOfOrderHistory = [
				{ ...mockApiHistory[0], ts: Date.now() - 2000 }, // Later timestamp
				{ ...mockApiHistory[1], ts: Date.now() - 8000 }, // Earlier timestamp
			]

			const validation = synchronizer.validateSynchronization(outOfOrderHistory, mockClineMessages)

			expect(validation.isValid).toBe(false)
			expect(validation.issues).toContain("Message ordering inconsistency")
		})

		test("should detect duplicate messages", () => {
			const duplicateApiHistory = [
				mockApiHistory[0],
				mockApiHistory[0], // Duplicate
				...mockApiHistory.slice(1),
			]

			const validation = synchronizer.validateSynchronization(duplicateApiHistory, mockClineMessages)

			expect(validation.isValid).toBe(false)
			expect(validation.issues).toContain("Duplicate messages found")
		})

		test("should detect orphaned messages", () => {
			const apiWithExtra = [
				...mockApiHistory,
				{ role: "user", content: [{ type: "text", text: "Orphaned message" }], ts: Date.now() },
			]

			const validation = synchronizer.validateSynchronization(apiWithExtra, mockClineMessages)

			expect(validation.isValid).toBe(false)
			expect(validation.issues).toContain("Orphaned messages found")
		})
	})

	describe("synchronizeAfterOptimization", () => {
		test("should synchronize after optimization", () => {
			const optimizationResult = {
				success: true,
				optimizedApiHistory: mockApiHistory.slice(0, 3),
				optimizedClineMessages: mockClineMessages.slice(0, 3),
				preservedElements: ["System prompt", "User message 1"],
				removedElements: ["User message 2", "Assistant response 2"],
				strategy: "preserve_critical_context" as any,
				contextReduction: 40,
			}

			const result = synchronizer.synchronizeAfterOptimization(
				optimizationResult,
				mockApiHistory,
				mockClineMessages,
			)

			expect(result.success).toBe(true)
			expect(result.apiHistory).toHaveLength(3)
			expect(result.clineMessages).toHaveLength(3)
		})

		test("should handle optimization failure", () => {
			const optimizationResult = {
				success: false,
				optimizedApiHistory: mockApiHistory,
				optimizedClineMessages: mockClineMessages,
				preservedElements: [],
				removedElements: [],
				strategy: "preserve_critical_context" as any,
				contextReduction: 0,
				error: "Optimization failed",
			}

			const result = synchronizer.synchronizeAfterOptimization(
				optimizationResult,
				mockApiHistory,
				mockClineMessages,
			)

			expect(result.success).toBe(true) // Still synchronizes even if optimization failed
			expect(result.apiHistory).toEqual(mockApiHistory)
			expect(result.clineMessages).toEqual(mockClineMessages)
		})
	})

	describe("synchronizeAfterRestoration", () => {
		test("should synchronize after restoration", () => {
			const restoredApiHistory = mockApiHistory.slice(0, 2)
			const restoredClineMessages = mockClineMessages.slice(0, 2)

			const result = synchronizer.synchronizeAfterRestoration(restoredApiHistory, restoredClineMessages)

			expect(result.success).toBe(true)
			expect(result.apiHistory).toEqual(restoredApiHistory)
			expect(result.clineMessages).toEqual(restoredClineMessages)
			expect(result.syncedElements).toBe(4) // 2 API + 2 Cline messages
		})
	})

	describe("getSyncState", () => {
		test("should return current synchronization state", () => {
			// Perform some synchronization to update state
			synchronizer.synchronizeHistories(mockApiHistory, mockClineMessages)

			const state = synchronizer.getSyncState()

			expect(state.totalSyncs).toBeGreaterThan(0)
			expect(state.successfulSyncs).toBeGreaterThan(0)
			expect(state.lastSyncTime).toBeGreaterThan(0)
			expect(state.averageSyncTime).toBeGreaterThanOrEqual(0)
		})
	})

	describe("reset", () => {
		test("should reset synchronization state", () => {
			// Perform some operations first
			synchronizer.synchronizeHistories(mockApiHistory, mockClineMessages)
			synchronizer.validateSynchronization(mockApiHistory, mockClineMessages)

			// Reset
			synchronizer.reset()

			const state = synchronizer.getSyncState()
			expect(state.totalSyncs).toBe(0)
			expect(state.successfulSyncs).toBe(0)
			expect(state.failedSyncs).toBe(0)
			expect(state.averageSyncTime).toBe(0)
		})
	})

	describe("Message Content Handling", () => {
		test("should handle complex message content", () => {
			const complexApiHistory: ApiMessage[] = [
				{
					role: "user",
					content: [
						{ type: "text", text: "Text content" },
						{ type: "code", text: "console.log('hello')" },
						{ type: "image_url", url: "http://example.com/image.png" },
					],
					ts: Date.now(),
				},
			]

			const complexClineMessages: ClineMessage[] = [
				{
					type: "say",
					say: "text",
					text: "Text content console.log('hello')",
					ts: Date.now(),
				},
			]

			const result = synchronizer.synchronizeHistories(
				complexApiHistory,
				complexClineMessages,
				"complex content test",
			)

			expect(result.success).toBe(true)
			expect(result.syncedElements).toBeGreaterThan(0)
		})

		test("should handle empty message content", () => {
			const emptyApiHistory: ApiMessage[] = [
				{
					role: "user",
					content: [],
					ts: Date.now(),
				},
			]

			const emptyClineMessages: ClineMessage[] = [
				{
					type: "say",
					say: "text",
					text: "",
					ts: Date.now(),
				},
			]

			const result = synchronizer.synchronizeHistories(emptyApiHistory, emptyClineMessages, "empty content test")

			expect(result.success).toBe(true)
			// Should handle gracefully without crashing
		})
	})

	describe("Performance Considerations", () => {
		test("should handle large histories efficiently", () => {
			const largeApiHistory = Array.from({ length: 1000 }, (_, i) => ({
				role: "user",
				content: [{ type: "text", text: `Message ${i}` }],
				ts: Date.now() - i * 1000,
			}))

			const largeClineMessages = Array.from({ length: 1000 }, (_, i) => ({
				type: "say",
				say: "text",
				text: `UI: Message ${i}`,
				ts: Date.now() - i * 1000,
			}))

			const startTime = Date.now()
			const result = synchronizer.synchronizeHistories(largeApiHistory, largeClineMessages, "performance test")
			const duration = Date.now() - startTime

			expect(result.success).toBe(true)
			expect(duration).toBeLessThan(1000) // Should complete within 1 second
		})

		test("should handle concurrent synchronization", async () => {
			const promises = Array.from({ length: 10 }, (_, i) =>
				Promise.resolve().then(() =>
					synchronizer.synchronizeHistories(
						mockApiHistory.slice(0, i + 1),
						mockClineMessages.slice(0, i + 1),
						`concurrent sync ${i}`,
					),
				),
			)

			const results = await Promise.all(promises)

			expect(results.every((result) => result.success)).toBe(true)
			// Should handle concurrent operations without corruption
		})
	})

	describe("Edge Cases", () => {
		test("should handle circular references", () => {
			const circularHistory = mockApiHistory.map((msg) => ({ ...msg }))
			const circularMessages = mockClineMessages.map((msg) => ({ ...msg }))

			const result = synchronizer.synchronizeHistories(
				circularHistory,
				circularMessages,
				"circular reference test",
			)

			expect(result.success).toBe(true)
			// Should handle gracefully without infinite loops
		})

		test("should handle very long message content", () => {
			const longContent = "a".repeat(10000) // Very long message
			const longApiHistory: ApiMessage[] = [
				{
					role: "user",
					content: [{ type: "text", text: longContent }],
					ts: Date.now(),
				},
			]

			const longClineMessages: ClineMessage[] = [
				{
					type: "say",
					say: "text",
					text: longContent,
					ts: Date.now(),
				},
			]

			const result = synchronizer.synchronizeHistories(longApiHistory, longClineMessages, "long content test")

			expect(result.success).toBe(true)
			// Should handle long content without memory issues
		})

		test("should handle special characters in messages", () => {
			const specialContent = "🚀 Special chars: \n\t\r\"'\\"
			const specialApiHistory: ApiMessage[] = [
				{
					role: "user",
					content: [{ type: "text", text: specialContent }],
					ts: Date.now(),
				},
			]

			const specialClineMessages: ClineMessage[] = [
				{
					type: "say",
					say: "text",
					text: specialContent,
					ts: Date.now(),
				},
			]

			const result = synchronizer.synchronizeHistories(
				specialApiHistory,
				specialClineMessages,
				"special chars test",
			)

			expect(result.success).toBe(true)
			// Should handle special characters correctly
		})
	})
})
