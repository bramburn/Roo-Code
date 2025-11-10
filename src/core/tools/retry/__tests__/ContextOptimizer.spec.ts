import { describe, test, expect, beforeEach, vi } from "vitest"
import { ContextOptimizer, ContextOptimizationStrategy, ContextPreservationPriority } from "../ContextOptimizer"
import type { ApiMessage } from "../../../../shared/ExtensionMessage"
import type { ClineMessage } from "../../../../shared/ExtensionMessage"

// Mock truncateConversationIfNeeded
vi.mock("../../sliding-window", () => ({
	truncateConversationIfNeeded: vi.fn(),
}))

describe("ContextOptimizer", () => {
	let mockApiHistory: ApiMessage[]
	let mockClineMessages: ClineMessage[]
	let mockSystemPrompt: string

	beforeEach(() => {
		vi.clearAllMocks()

		mockApiHistory = [
			{ role: "system", content: [{ type: "text", text: "<system_prompt>" }], ts: Date.now() - 10000 },
			{ role: "user", content: [{ type: "text", text: "task definition" }], ts: Date.now() - 8000 },
			{ role: "assistant", content: [{ type: "text", text: "important response" }], ts: Date.now() - 6000 },
			{ role: "user", content: [{ type: "text", text: "regular conversation" }], ts: Date.now() - 4000 },
			{ role: "assistant", content: [{ type: "text", text: "regular response" }], ts: Date.now() - 2000 },
			{ role: "user", content: [{ type: "text", text: "recent message" }], ts: Date.now() - 1000 },
		]

		mockClineMessages = [
			{ type: "say", say: "text", text: "UI: task definition", ts: Date.now() - 8000 },
			{ type: "say", say: "text", text: "UI: important response", ts: Date.now() - 6000 },
			{ type: "say", say: "text", text: "UI: regular conversation", ts: Date.now() - 4000 },
			{ type: "say", say: "text", text: "UI: regular response", ts: Date.now() - 2000 },
			{ type: "say", say: "text", text: "UI: recent message", ts: Date.now() - 1000 },
		]

		mockSystemPrompt = "Test system prompt"
	})

	describe("optimizeContext", () => {
		test("should preserve critical context elements", async () => {
			const { truncateConversationIfNeeded } = await import("../../sliding-window")
			truncateConversationIfNeeded.mockResolvedValue({
				messages: mockApiHistory.slice(0, 4), // Keep first 4 messages
				tokens: 400,
			})

			const result = await ContextOptimizer.optimizeContext(
				mockApiHistory,
				mockClineMessages,
				500, // contextTokens
				1000, // maxTokens
				1000, // contextWindow
				0, // retryCount
				mockSystemPrompt,
				"test-task",
			)

			expect(result.success).toBe(true)
			expect(result.strategy).toBe(ContextOptimizationStrategy.PRESERVE_CRITICAL_CONTEXT)
			expect(result.optimizedApiHistory).toBeDefined()
			expect(result.optimizedClineMessages).toBeDefined()
			expect(result.preservedElements).toContain("task definition")
			expect(result.preservedElements).toContain("important response")
		})

		test("should perform aggressive truncation on high retry count", async () => {
			const { truncateConversationIfNeeded } = await import("../../sliding-window")
			truncateConversationIfNeeded.mockResolvedValue({
				messages: mockApiHistory.slice(0, 2), // Aggressive truncation
				tokens: 200,
			})

			const result = await ContextOptimizer.optimizeContext(
				mockApiHistory,
				mockClineMessages,
				800, // contextTokens (high pressure)
				1000, // maxTokens
				1000, // contextWindow
				3, // retryCount (triggers aggressive)
				mockSystemPrompt,
				"test-task",
			)

			expect(result.success).toBe(true)
			expect(result.strategy).toBe(ContextOptimizationStrategy.AGGRESSIVE_TRUNCATION)
			expect(result.contextReduction).toBeGreaterThan(40) // Should reduce significantly
		})

		test("should perform smart summarization on moderate pressure", async () => {
			const { truncateConversationIfNeeded } = await import("../../sliding-window")
			truncateConversationIfNeeded.mockResolvedValue({
				messages: mockApiHistory.slice(0, 4), // Moderate reduction
				tokens: 400,
			})

			const result = await ContextOptimizer.optimizeContext(
				mockApiHistory,
				mockClineMessages,
				750, // contextTokens (moderate pressure)
				1000, // maxTokens
				1000, // contextWindow
				1, // retryCount
				mockSystemPrompt,
				"test-task",
			)

			expect(result.success).toBe(true)
			expect(result.strategy).toBe(ContextOptimizationStrategy.SMART_SUMMARIZATION)
		})

		test("should handle truncation failure gracefully", async () => {
			const { truncateConversationIfNeeded } = await import("../../sliding-window")
			truncateConversationIfNeeded.mockResolvedValue({
				messages: mockApiHistory,
				tokens: 800,
				error: "Truncation failed",
			})

			const result = await ContextOptimizer.optimizeContext(
				mockApiHistory,
				mockClineMessages,
				800, // contextTokens
				1000, // maxTokens
				1000, // contextWindow
				1, // retryCount
				mockSystemPrompt,
				"test-task",
			)

			expect(result.success).toBe(false)
			expect(result.error).toBe("Truncation failed")
			expect(result.optimizedApiHistory).toBe(mockApiHistory) // Should return original
		})

		test("should synchronize histories after optimization", async () => {
			const { truncateConversationIfNeeded } = await import("../../sliding-window")
			truncateConversationIfNeeded.mockResolvedValue({
				messages: mockApiHistory.slice(0, 4),
				tokens: 400,
			})

			const result = await ContextOptimizer.optimizeContext(
				mockApiHistory,
				mockClineMessages,
				600, // contextTokens
				1000, // maxTokens
				1000, // contextWindow
				1, // retryCount
				mockSystemPrompt,
				"test-task",
			)

			expect(result.success).toBe(true)
			// Should have synchronized histories
			expect(result.optimizedApiHistory.length).toBeGreaterThan(0)
			expect(result.optimizedClineMessages.length).toBeGreaterThan(0)
		})
	})

	describe("Message Importance Analysis", () => {
		test("should identify system prompts as critical", () => {
			const systemMessage = {
				role: "system" as const,
				content: [{ type: "text", text: "<system_prompt>" }],
				ts: Date.now(),
			}

			// This would be tested through the public API
			const result = await ContextOptimizer.optimizeContext(
				[systemMessage],
				[],
				100, // contextTokens
				1000, // maxTokens
				1000, // contextWindow
				0, // retryCount
				mockSystemPrompt,
				"test-task",
			)

			expect(result.preservedElements).toContain("system_prompt")
		})

		test("should identify task definitions as critical", () => {
			const taskMessage = {
				role: "user" as const,
				content: [{ type: "text", text: "task: > implement feature X" }],
				ts: Date.now(),
			}

			const result = await ContextOptimizer.optimizeContext(
				[taskMessage],
				[],
				100, // contextTokens
				1000, // maxTokens
				1000, // contextWindow
				0, // retryCount
				mockSystemPrompt,
				"test-task",
			)

			expect(result.preservedElements).toContain("task")
		})

		test("should identify recent messages as high priority", () => {
			const recentMessage = {
				role: "user" as const,
				content: [{ type: "text", text: "recent user input" }],
				ts: Date.now() - 500, // Very recent
			}

			const result = await ContextOptimizer.optimizeContext(
				[recentMessage],
				[],
				100, // contextTokens
				1000, // maxTokens
				1000, // contextWindow
				0, // retryCount
				mockSystemPrompt,
				"test-task",
			)

			expect(result.preservedElements.length).toBeGreaterThan(0)
		})

		test("should identify tool results as high priority", () => {
			const toolResultMessage = {
				role: "assistant" as const,
				content: [{ type: "text", text: "tool result: command executed successfully" }],
				ts: Date.now(),
			}

			const result = await ContextOptimizer.optimizeContext(
				[toolResultMessage],
				[],
				100, // contextTokens
				1000, // maxTokens
				1000, // contextWindow
				0, // retryCount
				mockSystemPrompt,
				"test-task",
			)

			expect(result.preservedElements.length).toBeGreaterThan(0)
		})
	})

	describe("Strategy Determination", () => {
		test("should choose preservation strategy for low pressure", async () => {
			const { truncateConversationIfNeeded } = await import("../../sliding-window")
			truncateConversationIfNeeded.mockResolvedValue({
				messages: mockApiHistory,
				tokens: 500,
			})

			const result = await ContextOptimizer.optimizeContext(
				mockApiHistory,
				mockClineMessages,
				500, // contextTokens (50% pressure)
				1000, // maxTokens
				1000, // contextWindow
				0, // retryCount
				mockSystemPrompt,
				"test-task",
			)

			expect(result.strategy).toBe(ContextOptimizationStrategy.PRESERVE_CRITICAL_CONTEXT)
		})

		test("should choose summarization strategy for moderate pressure", async () => {
			const { truncateConversationIfNeeded } = await import("../../sliding-window")
			truncateConversationIfNeeded.mockResolvedValue({
				messages: mockApiHistory,
				tokens: 750,
			})

			const result = await ContextOptimizer.optimizeContext(
				mockApiHistory,
				mockClineMessages,
				750, // contextTokens (75% pressure)
				1000, // maxTokens
				1000, // contextWindow
				1, // retryCount
				mockSystemPrompt,
				"test-task",
			)

			expect(result.strategy).toBe(ContextOptimizationStrategy.SMART_SUMMARIZATION)
		})

		test("should choose aggressive truncation for high pressure and retry count", async () => {
			const { truncateConversationIfNeeded } = await import("../../sliding-window")
			truncateConversationIfNeeded.mockResolvedValue({
				messages: mockApiHistory,
				tokens: 950,
			})

			const result = await ContextOptimizer.optimizeContext(
				mockApiHistory,
				mockClineMessages,
				950, // contextTokens (95% pressure)
				1000, // maxTokens
				1000, // contextWindow
				2, // retryCount
				mockSystemPrompt,
				"test-task",
			)

			expect(result.strategy).toBe(ContextOptimizationStrategy.AGGRESSIVE_TRUNCATION)
		})
	})

	describe("Context Reduction Calculation", () => {
		test("should calculate accurate context reduction", async () => {
			const { truncateConversationIfNeeded } = await import("../../sliding-window")
			truncateConversationIfNeeded.mockResolvedValue({
				messages: mockApiHistory.slice(0, 3), // Reduced from 6 to 3
				tokens: 300, // Reduced from 600 to 300
			})

			const result = await ContextOptimizer.optimizeContext(
				mockApiHistory,
				mockClineMessages,
				600, // Original contextTokens
				1000, // maxTokens
				1000, // contextWindow
				1, // retryCount
				mockSystemPrompt,
				"test-task",
			)

			expect(result.contextReduction).toBe(50) // 50% reduction
		})

		test("should handle zero reduction case", async () => {
			const { truncateConversationIfNeeded } = await import("../../sliding-window")
			truncateConversationIfNeeded.mockResolvedValue({
				messages: mockApiHistory, // No reduction
				tokens: 600,
			})

			const result = await ContextOptimizer.optimizeContext(
				mockApiHistory,
				mockClineMessages,
				600, // contextTokens
				1000, // maxTokens
				1000, // contextWindow
				0, // retryCount
				mockSystemPrompt,
				"test-task",
			)

			expect(result.contextReduction).toBe(0) // No reduction
		})
	})

	describe("Error Handling", () => {
		test("should handle invalid input gracefully", async () => {
			const result = await ContextOptimizer.optimizeContext(
				[], // Empty history
				[], // Empty Cline messages
				0, // No tokens
				1000, // maxTokens
				1000, // contextWindow
				0, // retryCount
				mockSystemPrompt,
				"test-task",
			)

			expect(result.success).toBe(true) // Should handle gracefully
			expect(result.optimizedApiHistory).toEqual([])
			expect(result.optimizedClineMessages).toEqual([])
		})

		test("should handle truncateConversationIfNeeded exception", async () => {
			const { truncateConversationIfNeeded } = await import("../../sliding-window")
			truncateConversationIfNeeded.mockRejectedValue(new Error("Service unavailable"))

			const result = await ContextOptimizer.optimizeContext(
				mockApiHistory,
				mockClineMessages,
				600, // contextTokens
				1000, // maxTokens
				1000, // contextWindow
				1, // retryCount
				mockSystemPrompt,
				"test-task",
			)

			expect(result.success).toBe(false)
			expect(result.error).toContain("Service unavailable")
		})
	})

	describe("Edge Cases", () => {
		test("should handle very large histories", async () => {
			const largeHistory = Array.from({ length: 1000 }, (_, i) => ({
				role: "user" as const,
				content: [{ type: "text", text: `message ${i}` }],
				ts: Date.now() - (1000 - i) * 1000,
			}))

			const { truncateConversationIfNeeded } = await import("../../sliding-window")
			truncateConversationIfNeeded.mockResolvedValue({
				messages: largeHistory.slice(0, 10), // Aggressive reduction
				tokens: 1000,
			})

			const result = await ContextOptimizer.optimizeContext(
				largeHistory,
				[],
				100000, // Very high token count
				1000, // maxTokens
				1000, // contextWindow
				3, // retryCount
				mockSystemPrompt,
				"test-task",
			)

			expect(result.success).toBe(true)
			expect(result.strategy).toBe(ContextOptimizationStrategy.AGGRESSIVE_TRUNCATION)
		})

		test("should handle single message histories", async () => {
			const singleMessage = [
				{
					role: "user" as const,
					content: [{ type: "text", text: "single message" }],
					ts: Date.now(),
				},
			]

			const { truncateConversationIfNeeded } = await import("../../sliding-window")
			truncateConversationIfNeeded.mockResolvedValue({
				messages: singleMessage,
				tokens: 50,
			})

			const result = await ContextOptimizer.optimizeContext(
				singleMessage,
				[],
				50, // contextTokens
				1000, // maxTokens
				1000, // contextWindow
				0, // retryCount
				mockSystemPrompt,
				"test-task",
			)

			expect(result.success).toBe(true)
			expect(result.preservedElements.length).toBeGreaterThan(0)
		})

		test("should handle messages without timestamps", async () => {
			const messagesWithoutTime = [
				{
					role: "user" as const,
					content: [{ type: "text", text: "message without time" }],
					// No ts property
				},
			]

			const { truncateConversationIfNeeded } = await import("../../sliding-window")
			truncateConversationIfNeeded.mockResolvedValue({
				messages: messagesWithoutTime,
				tokens: 50,
			})

			const result = await ContextOptimizer.optimizeContext(
				messagesWithoutTime,
				[],
				50, // contextTokens
				1000, // maxTokens
				1000, // contextWindow
				0, // retryCount
				mockSystemPrompt,
				"test-task",
			)

			expect(result.success).toBe(true)
			// Should handle gracefully without crashing
		})
	})
})
