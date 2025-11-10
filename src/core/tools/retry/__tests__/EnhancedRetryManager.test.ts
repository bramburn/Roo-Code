import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { EnhancedRetryManager } from "../EnhancedRetryManager"
import { ContextOptimizer } from "../ContextOptimizer"
import { ErrorClassifier } from "../ErrorClassifier"
import { DualHistorySynchronizer } from "../DualHistorySynchronizer"
import { ContextStateManager } from "../ContextStateManager"
import { type ApiMessage } from "../../../../shared/ExtensionMessage"
import { type ClineMessage } from "../../../../shared/ExtensionMessage"

// Mock dependencies for testing
const mockApiHandler = {
	createMessage: vi.fn(),
}

const mockSystemPrompt = "Test system prompt"

describe("EnhancedRetryManager", () => {
	let retryManager: EnhancedRetryManager
	let contextOptimizer: ContextOptimizer
	let errorClassifier: ErrorClassifier
	let historySynchronizer: DualHistorySynchronizer
	let contextStateManager: ContextStateManager

	beforeEach(() => {
		retryManager = new EnhancedRetryManager(
			contextOptimizer,
			errorClassifier,
			historySynchronizer,
			contextStateManager,
		)
	})

	describe("executeRetry", () => {
		it("should execute successful retry on first attempt", async () => {
			const apiHistory = [{ role: "user", content: [{ type: "text", text: "test" }] }] as ApiMessage[]
			const clineMessages = [{ type: "say", say: "text", text: "test" }] as ClineMessage[]
			const contextTokens = 100
			const maxTokens = 1000

			const result = await retryManager.executeRetry(
				"test operation",
				apiHistory,
				clineMessages,
				contextTokens,
				maxTokens,
				1000, // contextWindow
				mockSystemPrompt,
				"test-task",
			)

			expect(result.success).toBe(true)
			expect(result.retryAttempt).toBe(1)
			expect(result.totalAttempts).toBe(1)
		})

		it("should classify error and retry with appropriate strategy", async () => {
			const apiHistory = [{ role: "user", content: [{ type: "text", text: "test" }] }] as ApiMessage[]
			const clineMessages = [{ type: "say", say: "text", text: "test" }] as ClineMessage[]
			const error = { message: "Context window exceeded", status: 429 }

			const result = await retryManager.executeRetry(
				"test operation",
				apiHistory,
				clineMessages,
				50, // contextTokens
				1000, // maxTokens
				1000, // contextWindow
				mockSystemPrompt,
				"test-task",
			)

			expect(result.success).toBe(false)
			expect(result.retryAttempt).toBe(1)
			expect(result.strategy).toBe("retry_with_aggressive_strategy")
		})

		it("should skip retry for critical errors requiring manual intervention", async () => {
			const apiHistory = [{ role: "user", content: [{ type: "text", text: "test" }] }] as ApiMessage[]
			const clineMessages = [{ type: "say", say: "text", text: "test" }] as ClineMessage[]
			const error = { message: "Context corruption detected", code: "context_corruption" }

			const result = await retryManager.executeRetry(
				"test operation",
				apiHistory,
				clineMessages,
				50, // contextTokens
				1000, // maxTokens
				1000, // contextWindow
				mockSystemPrompt,
				"test-task",
			)

			expect(result.success).toBe(false)
			expect(result.error).toContain("Critical error detected")
		})

		it("should optimize context when memory pressure is high", async () => {
			const apiHistory = Array.from({ length: 100 }, (_, i) => ({
				role: "user",
				content: [{ type: "text", text: `message ${i}` }],
			})) as ApiMessage[]

			const clineMessages = Array.from({ length: 100 }, (_, i) => ({
				type: "say",
				say: "text",
				text: `message ${i}`,
			})) as ClineMessage[]

			const result = await retryManager.executeRetry(
				"test operation",
				apiHistory,
				clineMessages,
				800, // contextTokens (high pressure)
				1000, // maxTokens
				1000, // contextWindow
				mockSystemPrompt,
				"test-task",
			)

			expect(result.success).toBe(true)
			expect(result.optimizationResult?.strategy).toBe("aggressive_cleanup")
		})

		it("should synchronize histories after optimization", async () => {
			const apiHistory = [{ role: "user", content: [{ type: "text", text: "optimized" }] }] as ApiMessage[]
			const clineMessages = [{ type: "say", say: "text", text: "optimized" }] as ClineMessage[]

			const result = await retryManager.executeRetry(
				"test operation",
				apiHistory,
				clineMessages,
				100, // contextTokens
				1000, // maxTokens
				1000, // contextWindow
				mockSystemPrompt,
				"test-task",
			)

			expect(result.success).toBe(true)
			expect(result.synchronizationResult?.success).toBe(true)
		})

		it("should handle maximum retries exceeded", async () => {
			const apiHistory = [{ role: "user", content: [{ type: "text", text: "test" }] }] as ApiMessage[]
			const clineMessages = [{ type: "say", say: "text", text: "test" }] as ClineMessage[]

			// Mock retry manager at max retries
			const maxRetriesManager = new EnhancedRetryManager(
				contextOptimizer,
				errorClassifier,
				historySynchronizer,
				contextStateManager,
				{ maxRetries: 2 },
			)

			const result = await maxRetriesManager.executeRetry(
				"test operation",
				apiHistory,
				clineMessages,
				100, // contextTokens
				1000, // maxTokens
				1000, // contextWindow
				mockSystemPrompt,
				"test-task",
			)

			expect(result.success).toBe(false)
			expect(result.error).toContain("Maximum retries exceeded")
		})

		it("should track retry state correctly", async () => {
			const apiHistory = [{ role: "user", content: [{ type: "text", text: "test" }] }] as ApiMessage[]
			const clineMessages = [{ type: "say", say: "text", text: "test" }] as ClineMessage[]

			await retryManager.executeRetry(
				"test operation",
				apiHistory,
				clineMessages,
				100, // contextTokens
				1000, // maxTokens
				1000, // contextWindow
				mockSystemPrompt,
				"test-task",
			)

			const state = retryManager.getRetryState()
			expect(state.currentAttempt).toBe(1)
			expect(state.totalAttempts).toBe(1)
			expect(state.successfulRetries).toBe(1)
		})

		it("should reset state correctly", () => {
			retryManager.reset()

			const state = retryManager.getRetryState()
			expect(state.currentAttempt).toBe(0)
			expect(state.totalAttempts).toBe(0)
			expect(state.successfulRetries).toBe(0)
		})
	})

	describe("ContextOptimizer", () => {
		let optimizer: ContextOptimizer

		beforeEach(() => {
			optimizer = new ContextOptimizer()
		})

		it("should preserve critical context elements", async () => {
			const apiHistory = [
				{ role: "system", content: [{ type: "text", text: "<system_prompt>" }] },
				{ role: "user", content: [{ type: "text", text: "critical task definition" }] },
				{ role: "assistant", content: [{ type: "text", text: "important response" }] },
			] as ApiMessage[]

			const clineMessages = [
				{ type: "say", say: "text", text: "UI: critical task definition" },
				{ type: "say", say: "text", text: "UI: important response" },
			] as ClineMessage[]

			const result = await optimizer.optimizeContext(
				apiHistory,
				clineMessages,
				100, // contextTokens
				1000, // maxTokens
				1000, // contextWindow
				0, // retryCount
				mockSystemPrompt,
				"test-task",
			)

			expect(result.success).toBe(true)
			expect(result.strategy).toBe("preserve_critical_context")
			expect(result.preservedElements).toContain("critical task definition")
		})

		it("should perform aggressive truncation when needed", async () => {
			const apiHistory = Array.from({ length: 200 }, (_, i) => ({
				role: "user",
				content: [{ type: "text", text: `message ${i}` }],
			})) as ApiMessage[]

			const result = await optimizer.optimizeContext(
				apiHistory,
				clineMessages,
				150, // contextTokens (over limit)
				1000, // maxTokens
				1000, // contextWindow
				2, // retryCount (triggers aggressive)
				mockSystemPrompt,
				"test-task",
			)

			expect(result.success).toBe(true)
			expect(result.strategy).toBe("aggressive_truncation")
			expect(result.contextReduction).toBeGreaterThan(25) // Should reduce by at least 25%
		})
	})

	describe("ErrorClassifier", () => {
		let classifier: ErrorClassifier

		beforeEach(() => {
			classifier = new ErrorClassifier()
		})

		it("should classify context window exceeded error", () => {
			const error = { message: "Context window exceeded", status: 429 }
			const classification = classifier.classifyError(
				error,
				100, // contextTokens
				1000, // maxTokens
				1, // retryCount
				{ apiHistoryLength: 100, clineMessagesLength: 100 },
			)

			expect(classification.errorType).toBe("context_window_exceeded")
			expect(classification.severity).toBe("medium")
			expect(classification.retryStrategy).toBe("retry_with_context_optimization")
			expect(classification.requiresContextOptimization).toBe(true)
		})

		it("should classify token limit error", () => {
			const error = { message: "Token limit exceeded" }
			const classification = classifier.classifyError(
				error,
				950, // contextTokens
				1000, // maxTokens
				1, // retryCount
			)

			expect(classification.errorType).toBe("token_limit_exceeded")
			expect(classification.severity).toBe("medium")
			expect(classification.retryStrategy).toBe("retry_with_context_optimization")
		})

		it("should classify memory pressure error", () => {
			const error = { message: "Memory pressure detected" }
			const classification = classifier.classifyError(
				error,
				900, // contextTokens
				1000, // maxTokens
				1, // retryCount
			)

			expect(classification.errorType).toBe("memory_pressure")
			expect(classification.severity).toBe("high")
			expect(classification.retryStrategy).toBe("retry_with_aggressive_strategy")
		})
	})

	describe("DualHistorySynchronizer", () => {
		let synchronizer: DualHistorySynchronizer

		beforeEach(() => {
			synchronizer = new DualHistorySynchronizer()
		})

		it("should synchronize histories successfully", async () => {
			const apiHistory = [
				{ role: "user", content: [{ type: "text", text: "test" }] },
				{ role: "assistant", content: [{ type: "text", text: "response" }] },
			] as ApiMessage[]

			const clineMessages = [
				{ type: "say", say: "text", text: "test" },
				{ type: "say", say: "text", text: "response" },
			] as ClineMessage[]

			const result = await synchronizer.synchronizeHistories(apiHistory, clineMessages, "test synchronization")

			expect(result.success).toBe(true)
			expect(result.syncedElements).toBe(4)
			expect(result.unsyncedElements).toBe(0)
		})

		it("should detect synchronization issues", async () => {
			const apiHistory = [
				{ role: "user", content: [{ type: "text", text: "test" }] },
				{ role: "assistant", content: [{ type: "text", text: "response" }] },
			] as ApiMessage[]

			const clineMessages = [
				{ type: "say", say: "text", text: "test" },
				// Missing corresponding assistant message
			] as ClineMessage[]

			const result = await synchronizer.synchronizeHistories(apiHistory, clineMessages, "test synchronization")

			expect(result.success).toBe(false)
			expect(result.issues).toContain("Message ordering inconsistency")
		})
	})

	describe("ContextStateManager", () => {
		let stateManager: ContextStateManager

		beforeEach(() => {
			stateManager = new ContextStateManager()
		})

		it("should detect memory pressure", () => {
			const apiHistory = Array.from({ length: 950 }, (_, i) => ({
				role: "user",
				content: [{ type: "text", text: `message ${i}` }],
			})) as ApiMessage[]

			const clineMessages = Array.from({ length: 950 }, (_, i) => ({
				type: "say",
				say: "text",
				text: `message ${i}`,
			})) as ClineMessage[]

			stateManager.manageContextDuringOptimization(
				{ success: true, optimizedApiHistory: apiHistory, optimizedClineMessages: clineMessages },
				apiHistory,
				clineMessages,
				950, // contextTokens
				1000, // maxTokens
				1000, // contextWindow
			)

			const memoryState = stateManager.getMemoryState()
			expect(memoryState.memoryPressureLevel).toBeGreaterThan(0.8)
		})

		it("should trigger emergency cleanup", () => {
			const apiHistory = Array.from({ length: 2000 }, (_, i) => ({
				role: "user",
				content: [{ type: "text", text: `message ${i}` }],
			})) as ApiMessage[]

			const clineMessages = Array.from({ length: 2000 }, (_, i) => ({
				type: "say",
				say: "text",
				text: `message ${i}`,
			})) as ClineMessage[]

			stateManager.manageContextDuringOptimization(
				{ success: true, optimizedApiHistory: apiHistory, optimizedClineMessages: clineMessages },
				apiHistory,
				clineMessages,
				2000, // contextTokens
				1000, // maxTokens
				1000, // contextWindow
			)

			const memoryState = stateManager.getMemoryState()
			expect(memoryState.peakContextSize).toBe(200000) // Should be updated
		})

		it("should validate context preservation", () => {
			const apiHistory = Array.from({ length: 100 }, (_, i) => ({
				role: "user",
				content: [{ type: "text", text: `message ${i}` }],
			})) as ApiMessage[]

			const clineMessages = Array.from({ length: 100 }, (_, i) => ({
				type: "say",
				say: "text",
				text: `message ${i}`,
			})) as ClineMessage[]

			const validation = stateManager.validateContextPreservation(
				apiHistory,
				clineMessages,
				apiHistory,
				clineMessages,
			)

			expect(validation.isValid).toBe(true)
			expect(validation.issues).toHaveLength(0)
		})
	})
})
