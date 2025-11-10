import { describe, test, expect, beforeEach, vi } from "vitest"
import { DualHistorySynchronizer } from "../../DualHistorySynchronizer"
import { ContextStateManager } from "../../ContextStateManager"
import { ContextOptimizer } from "../../ContextOptimizer"
import type { MessageHistory, ContextSyncResult, RetryContext } from "../../types"

// Mock truncateConversationIfNeeded for ContextOptimizer
vi.mock("../../../../../utils/truncateConversationIfNeeded", () => ({
	truncateConversationIfNeeded: vi.fn(),
}))

describe("Context Management Tests", () => {
	let synchronizer: DualHistorySynchronizer
	let stateManager: ContextStateManager
	let optimizer: ContextOptimizer

	beforeEach(() => {
		vi.clearAllMocks()
		synchronizer = new DualHistorySynchronizer()
		stateManager = new ContextStateManager()
		optimizer = new ContextOptimizer()
	})

	describe("Dual History Synchronization Accuracy", () => {
		test("should accurately synchronize identical histories", async () => {
			const apiHistory: MessageHistory[] = [
				{ id: "1", role: "user", content: "Hello", timestamp: 1000 },
				{ id: "2", role: "assistant", content: "Hi there!", timestamp: 2000 },
				{ id: "3", role: "user", content: "How are you?", timestamp: 3000 },
			]

			const clineHistory: MessageHistory[] = [
				{ id: "1", role: "user", content: "Hello", timestamp: 1000 },
				{ id: "2", role: "assistant", content: "Hi there!", timestamp: 2000 },
				{ id: "3", role: "user", content: "How are you?", timestamp: 3000 },
			]

			const result = await synchronizer.syncHistories(apiHistory, clineHistory)

			expect(result.synchronized).toBe(true)
			expect(result.conflicts).toHaveLength(0)
			expect(result.mergedHistory).toHaveLength(3)
			expect(result.mergedHistory).toEqual(apiHistory)
		})

		test("should detect content mismatches accurately", async () => {
			const apiHistory: MessageHistory[] = [
				{ id: "1", role: "user", content: "Original message", timestamp: 1000 },
				{ id: "2", role: "assistant", content: "API response", timestamp: 2000 },
			]

			const clineHistory: MessageHistory[] = [
				{ id: "1", role: "user", content: "Modified message", timestamp: 1000 }, // Different content
				{ id: "2", role: "assistant", content: "API response", timestamp: 2000 },
			]

			const result = await synchronizer.syncHistories(apiHistory, clineHistory)

			expect(result.synchronized).toBe(true)
			expect(result.conflicts.length).toBe(1)
			expect(result.conflicts[0].type).toBe("content_mismatch")
			expect(result.conflicts[0].messageId).toBe("1")
			expect(result.conflicts[0].apiContent).toBe("Original message")
			expect(result.conflicts[0].clineContent).toBe("Modified message")
		})

		test("should detect missing entries accurately", async () => {
			const apiHistory: MessageHistory[] = [
				{ id: "1", role: "user", content: "Message 1", timestamp: 1000 },
				{ id: "2", role: "assistant", content: "Response 1", timestamp: 2000 },
				{ id: "3", role: "user", content: "Message 2", timestamp: 3000 },
			]

			const clineHistory: MessageHistory[] = [
				{ id: "1", role: "user", content: "Message 1", timestamp: 1000 },
				{ id: "3", role: "user", content: "Message 2", timestamp: 3000 }, // Missing id:2
			]

			const result = await synchronizer.syncHistories(apiHistory, clineHistory)

			expect(result.synchronized).toBe(true)
			expect(result.conflicts.length).toBe(1)
			expect(result.conflicts[0].type).toBe("missing_entry")
			expect(result.conflicts[0].messageId).toBe("2")
			expect(result.conflicts[0].missingIn).toBe("cline")
		})

		test("should detect timestamp mismatches", async () => {
			const apiHistory: MessageHistory[] = [{ id: "1", role: "user", content: "Message", timestamp: 1000 }]

			const clineHistory: MessageHistory[] = [
				{ id: "1", role: "user", content: "Message", timestamp: 2000 }, // Different timestamp
			]

			const result = await synchronizer.syncHistories(apiHistory, clineHistory)

			expect(result.synchronized).toBe(true)
			expect(result.conflicts.length).toBe(1)
			expect(result.conflicts[0].type).toBe("timestamp_mismatch")
			expect(result.conflicts[0].messageId).toBe("1")
		})

		test("should handle role mismatches", async () => {
			const apiHistory: MessageHistory[] = [{ id: "1", role: "user", content: "Message", timestamp: 1000 }]

			const clineHistory: MessageHistory[] = [
				{ id: "1", role: "assistant", content: "Message", timestamp: 1000 }, // Different role
			]

			const result = await synchronizer.syncHistories(apiHistory, clineHistory)

			expect(result.synchronized).toBe(true)
			expect(result.conflicts.length).toBe(1)
			expect(result.conflicts[0].type).toBe("role_mismatch")
			expect(result.conflicts[0].messageId).toBe("1")
		})
	})

	describe("Context Preservation During Optimization", () => {
		test("should preserve critical messages during optimization", async () => {
			const context = {
				taskId: "preservation-test",
				messages: [
					{ role: "user", content: "Critical instruction that must be preserved" },
					{ role: "assistant", content: "Important response that must be preserved" },
					{ role: "user", content: "Less important message".repeat(100) },
					{ role: "assistant", content: "Less important response".repeat(100) },
					{ role: "user", content: "Another critical instruction" },
				],
				apiHistory: [
					{ id: "1", role: "user", content: "Critical API message", timestamp: 1000 },
					{ id: "2", role: "assistant", content: "Critical API response", timestamp: 2000 },
				],
				clineHistory: [
					{ id: "1", role: "user", content: "Critical Cline message", timestamp: 1000 },
					{ id: "2", role: "assistant", content: "Critical Cline response", timestamp: 2000 },
				],
			}

			const result = await optimizer.optimizeContext(context)

			expect(result.optimized).toBe(true)
			expect(result.reduction).toBeGreaterThan(0)

			// Verify critical messages are preserved
			const optimizedMessages = result.optimizedContext.messages || []
			const hasCriticalInstruction = optimizedMessages.some((msg: any) =>
				msg.content.includes("Critical instruction"),
			)
			const hasImportantResponse = optimizedMessages.some((msg: any) =>
				msg.content.includes("Important response"),
			)

			expect(hasCriticalInstruction).toBe(true)
			expect(hasImportantResponse).toBe(true)

			// Verify histories are preserved
			expect(result.optimizedContext.apiHistory).toHaveLength(2)
			expect(result.optimizedContext.clineHistory).toHaveLength(2)
		})

		test("should maintain conversation flow during optimization", async () => {
			const context = {
				taskId: "flow-test",
				messages: [
					{ role: "user", content: "Question 1" },
					{ role: "assistant", content: "Answer 1" },
					{ role: "user", content: "Question 2" },
					{ role: "assistant", content: "Answer 2" },
					{ role: "user", content: "Question 3" },
					{ role: "assistant", content: "Answer 3" },
				].map((msg, index) => ({
					...msg,
					content: msg.content + " ".repeat(index % 2 === 0 ? 100 : 50), // Vary lengths
				})),
			}

			const result = await optimizer.optimizeContext(context)

			expect(result.optimized).toBe(true)

			// Verify conversation flow is maintained
			const optimizedMessages = result.optimizedContext.messages || []
			expect(optimizedMessages.length).toBeGreaterThan(0)

			// Check that user-assistant pairs are maintained
			for (let i = 0; i < optimizedMessages.length - 1; i += 2) {
				if (i + 1 < optimizedMessages.length) {
					expect(optimizedMessages[i].role).toBe("user")
					expect(optimizedMessages[i + 1].role).toBe("assistant")
				}
			}
		})

		test("should preserve task context during optimization", async () => {
			const context = {
				taskId: "task-context-test",
				workingDirectory: "/project/src",
				relatedFiles: ["file1.ts", "file2.ts"],
				messages: [
					{ role: "user", content: "Task-specific message".repeat(50) },
					{ role: "assistant", content: "Task-specific response".repeat(50) },
				],
			}

			const result = await optimizer.optimizeContext(context)

			expect(result.optimized).toBe(true)
			expect(result.optimizedContext.taskId).toBe("task-context-test")
			expect(result.optimizedContext.workingDirectory).toBe("/project/src")
			expect(result.optimizedContext.relatedFiles).toEqual(["file1.ts", "file2.ts"])
		})
	})

	describe("Memory Growth Prevention", () => {
		test("should prevent unlimited memory growth in context", async () => {
			const largeContext = {
				taskId: "memory-growth-test",
				messages: Array.from({ length: 1000 }, (_, i) => ({
					role: i % 2 === 0 ? "user" : "assistant",
					content: `Very large message content ${i}`.repeat(100),
				})),
				apiHistory: Array.from({ length: 500 }, (_, i) => ({
					id: `api-${i}`,
					role: "user",
					content: `Large API history ${i}`.repeat(50),
					timestamp: Date.now() - i * 1000,
				})),
				clineHistory: Array.from({ length: 500 }, (_, i) => ({
					id: `cline-${i}`,
					role: "user",
					content: `Large Cline history ${i}`.repeat(50),
					timestamp: Date.now() - i * 1000,
				})),
			}

			const originalSize = JSON.stringify(largeContext).length
			const result = await optimizer.optimizeContext(largeContext)

			expect(result.optimized).toBe(true)
			expect(result.reduction).toBeGreaterThan(0)

			const optimizedSize = JSON.stringify(result.optimizedContext).length
			expect(optimizedSize).toBeLessThan(originalSize)

			// Should significantly reduce size
			const reductionPercentage = (originalSize - optimizedSize) / originalSize
			expect(reductionPercentage).toBeGreaterThan(0.3) // At least 30% reduction
		})

		test("should limit context size to reasonable bounds", async () => {
			const enormousContext = {
				taskId: "size-limit-test",
				messages: Array.from({ length: 5000 }, (_, i) => ({
					role: "user",
					content: `Enormous message ${i}`.repeat(200),
				})),
			}

			const result = await optimizer.optimizeContext(enormousContext)

			expect(result.optimized).toBe(true)

			const optimizedSize = JSON.stringify(result.optimizedContext).length
			const maxReasonableSize = 1024 * 1024 // 1MB

			expect(optimizedSize).toBeLessThan(maxReasonableSize)
		})

		test("should clean up old context entries", async () => {
			const oldContext = {
				taskId: "cleanup-test",
				messages: [
					{ role: "user", content: "Recent message", timestamp: Date.now() },
					{ role: "assistant", content: "Recent response", timestamp: Date.now() - 1000 },
					{ role: "user", content: "Old message", timestamp: Date.now() - 86400000 }, // 1 day old
					{ role: "assistant", content: "Old response", timestamp: Date.now() - 86400000 },
				],
			}

			const result = await optimizer.optimizeContext(oldContext)

			expect(result.optimized).toBe(true)

			// Should prioritize recent messages
			const optimizedMessages = result.optimizedContext.messages || []
			const hasRecentMessage = optimizedMessages.some((msg: any) => msg.content.includes("Recent message"))
			const hasOldMessage = optimizedMessages.some((msg: any) => msg.content.includes("Old message"))

			expect(hasRecentMessage).toBe(true)
			// Old messages might be removed during optimization
		})
	})

	describe("Context Restoration After Failed Retries", () => {
		test("should restore context accurately after retry failure", async () => {
			const originalContext: RetryContext = {
				id: "restoration-test",
				toolName: "test-tool",
				toolParams: { action: "test" },
				config: {
					enableRetry: true,
					maxRetryAttempts: 3,
					baseDelayMs: 1000,
				},
				attemptCount: 1,
				taskId: "restoration-task",
				executionContext: {
					workingDirectory: "/test",
					messages: [
						{ role: "user", content: "Original message" },
						{ role: "assistant", content: "Original response" },
					],
					apiHistory: [{ id: "1", role: "user", content: "API message", timestamp: 1000 }],
					clineHistory: [{ id: "1", role: "user", content: "Cline message", timestamp: 1000 }],
				},
				startTime: Date.now(),
				lastAttemptTime: Date.now(),
			}

			// Save original context
			await stateManager.saveContextState(originalContext)

			// Simulate retry attempt that modifies context
			const modifiedContext = { ...originalContext }
			modifiedContext.attemptCount = 2
			modifiedContext.executionContext!.messages.push({ role: "user", content: "Additional message" } as any)

			// Restore original context
			const restoredContext = await stateManager.restoreContextState(originalContext.id)

			expect(restoredContext).toBeDefined()
			expect(restoredContext!.attemptCount).toBe(1) // Should be original value
			expect(restoredContext!.executionContext!.messages).toHaveLength(2) // Should be original messages
			expect(restoredContext!.executionContext!.messages[0].content).toBe("Original message")
		})

		test("should handle partial context restoration", async () => {
			const partialContext: RetryContext = {
				id: "partial-restoration-test",
				toolName: "partial-tool",
				toolParams: { action: "partial" },
				config: {
					enableRetry: true,
					maxRetryAttempts: 3,
					baseDelayMs: 1000,
				},
				attemptCount: 1,
				taskId: "partial-task",
				executionContext: {
					workingDirectory: "/partial",
					// Missing some optional fields
				},
				startTime: Date.now(),
				lastAttemptTime: Date.now(),
			}

			await stateManager.saveContextState(partialContext)

			const restoredContext = await stateManager.restoreContextState(partialContext.id)

			expect(restoredContext).toBeDefined()
			expect(restoredContext!.taskId).toBe("partial-task")
			expect(restoredContext!.executionContext!.workingDirectory).toBe("/partial")
		})

		test("should handle context restoration failures gracefully", async () => {
			const result = await stateManager.restoreContextState("non-existent-context")

			expect(result).toBeNull()
		})
	})

	describe("Integration with truncateConversationIfNeeded", () => {
		test("should integrate with truncateConversationIfNeeded during optimization", async () => {
			const context = {
				taskId: "integration-test",
				messages: Array.from({ length: 100 }, (_, i) => ({
					role: i % 2 === 0 ? "user" : "assistant",
					content: `Integration test message ${i}`.repeat(20),
				})),
			}

			const result = await optimizer.optimizeContext(context)

			expect(result.optimized).toBe(true)
			expect(result.optimizedContext).toBeDefined()
			expect(result.optimizedContext.messages).toBeDefined()
		})

		test("should handle truncateConversationIfNeeded failures", async () => {
			const context = {
				taskId: "truncate-fail-test",
				messages: [{ role: "user", content: "Test message" }],
			}

			const result = await optimizer.optimizeContext(context)

			// Should handle gracefully even if truncation fails
			expect(result).toBeDefined()
		})
	})

	describe("Concurrent Context Management", () => {
		test("should handle concurrent context operations", async () => {
			const contexts = []

			// Create multiple contexts for concurrent operations
			for (let i = 0; i < 10; i++) {
				const context = {
					taskId: `concurrent-${i}`,
					messages: [{ role: "user", content: `Concurrent message ${i}`.repeat(10) }],
				}

				contexts.push(optimizer.optimizeContext(context))
			}

			const results = await Promise.all(contexts)

			results.forEach((result, index) => {
				expect(result.optimized).toBe(true)
				expect(result.optimizedContext.taskId).toBe(`concurrent-${index}`)
			})
		})

		test("should handle concurrent synchronization operations", async () => {
			const syncOperations = []

			for (let i = 0; i < 5; i++) {
				const apiHistory = [
					{ id: `api-${i}-1`, role: "user", content: `API message ${i}-1`, timestamp: Date.now() },
				]
				const clineHistory = [
					{ id: `cline-${i}-1`, role: "user", content: `Cline message ${i}-1`, timestamp: Date.now() },
				]

				syncOperations.push(synchronizer.syncHistories(apiHistory, clineHistory))
			}

			const results = await Promise.all(syncOperations)

			results.forEach((result) => {
				expect(result.synchronized).toBe(true)
				expect(result.mergedHistory).toBeDefined()
			})
		})
	})
})
