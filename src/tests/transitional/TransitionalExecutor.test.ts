import { describe, test, expect, vi, beforeEach, afterEach } from "vitest"
import { AIMessage } from "@langchain/core/messages"
import { TransitionalExecutor, ToolExecutionContext } from "../../../transitional/TransitionalExecutor"
import { ToolWrapperRegistry } from "../../../tools/registry/ToolWrapperRegistry"
import { globalToolWrapperRegistry } from "../../../tools/registry/ToolWrapperRegistry"
import { Task } from "../../../core/task/Task"
import { AskApproval, HandleError, PushToolResult, RemoveClosingTag } from "../../../shared/tools"

// Mock DynamicStructuredTool
vi.mock("@langchain/core/tools", () => ({
	DynamicStructuredTool: vi.fn().mockImplementation((config) => ({
		name: config.name,
		description: config.description,
		schema: config.schema,
		func: config.func || vi.fn(),
	})),
}))

describe("TransitionalExecutor", () => {
	let executor: TransitionalExecutor
	let mockRegistry: ToolWrapperRegistry
	let mockContext: ToolExecutionContext

	beforeEach(() => {
		// Create mock registry
		mockRegistry = {
			register: vi.fn(),
			unregister: vi.fn(),
			get: vi.fn(),
			list: vi.fn(),
			clear: vi.fn(),
			has: vi.fn(),
			getToolNames: vi.fn(),
			getLangChainTools: vi.fn(),
			getByTag: vi.fn(),
			getStats: vi.fn(),
		} as any

		executor = new TransitionalExecutor(mockRegistry)

		// Create mock context
		mockContext = {
			cline: {} as Task,
			askApproval: vi.fn().mockResolvedValue(true),
			handleError: vi.fn(),
			pushToolResult: vi.fn(),
			removeClosingTag: vi.fn((tag, content) => content),
			toolRegistry: mockRegistry,
		}
	})

	afterEach(() => {
		vi.clearAllMocks()
	})

	describe("Initialization", () => {
		test("should initialize with default registry", () => {
			const defaultExecutor = new TransitionalExecutor()
			expect(defaultExecutor.getToolRegistry()).toBe(globalToolWrapperRegistry)
		})

		test("should initialize with custom registry", () => {
			const customExecutor = new TransitionalExecutor(mockRegistry)
			expect(customExecutor.getToolRegistry()).toBe(mockRegistry)
		})
	})

	describe("Tool Execution", () => {
		test("should handle AI message with no tool calls", async () => {
			const aiMessage = {
				content: "Hello, world!",
				tool_calls: [],
			} as AIMessage

			const results = await executor.executeToolCalls(aiMessage, mockContext)

			expect(results).toHaveLength(0)
		})

		test("should handle AI message with tool calls", async () => {
			const mockTool = {
				name: "test_tool",
				func: vi.fn().mockResolvedValue("Tool executed successfully"),
			}

			mockRegistry.has.mockReturnValue(true)
			mockRegistry.get.mockReturnValue(mockTool)

			const aiMessage = {
				content: "I'll execute a tool",
				tool_calls: [
					{
						name: "test_tool",
						args: { param1: "value1" },
						id: "call_1",
					},
				],
			} as AIMessage

			const results = await executor.executeToolCalls(aiMessage, mockContext)

			expect(results).toHaveLength(1)
			expect(results[0].success).toBe(true)
			expect(results[0].toolName).toBe("test_tool")
		})

		test("should handle tool not found in registry", async () => {
			mockRegistry.has.mockReturnValue(false)

			const aiMessage = {
				content: "I'll execute a tool",
				tool_calls: [
					{
						name: "nonexistent_tool",
						args: {},
						id: "call_1",
					},
				],
			} as AIMessage

			const results = await executor.executeToolCalls(aiMessage, mockContext)

			expect(results).toHaveLength(1)
			expect(results[0].success).toBe(false)
			expect(results[0].error).toContain("not found in registry")
		})

		test("should handle tool execution errors", async () => {
			const mockTool = {
				name: "error_tool",
				func: vi.fn().mockRejectedValue(new Error("Tool execution failed")),
			}

			mockRegistry.has.mockReturnValue(true)
			mockRegistry.get.mockReturnValue(mockTool)

			const aiMessage = {
				content: "I'll execute a tool that fails",
				tool_calls: [
					{
						name: "error_tool",
						args: {},
						id: "call_1",
					},
				],
			} as AIMessage

			const results = await executor.executeToolCalls(aiMessage, mockContext)

			expect(results).toHaveLength(1)
			expect(results[0].success).toBe(false)
			expect(results[0].error).toBe("Tool execution failed")
		})

		test("should handle multiple tool calls", async () => {
			const mockTool1 = {
				name: "tool1",
				func: vi.fn().mockResolvedValue("Tool 1 executed"),
			}

			const mockTool2 = {
				name: "tool2",
				func: vi.fn().mockResolvedValue("Tool 2 executed"),
			}

			mockRegistry.has.mockReturnValue(true)
			mockRegistry.get.mockImplementation((name) => {
				return name === "tool1" ? mockTool1 : mockTool2
			})

			const aiMessage = {
				content: "I'll execute multiple tools",
				tool_calls: [
					{
						name: "tool1",
						args: { param: "value1" },
						id: "call_1",
					},
					{
						name: "tool2",
						args: { param: "value2" },
						id: "call_2",
					},
				],
			} as AIMessage

			const results = await executor.executeToolCalls(aiMessage, mockContext)

			expect(results).toHaveLength(2)
			expect(results[0].success).toBe(true)
			expect(results[0].toolName).toBe("tool1")
			expect(results[1].success).toBe(true)
			expect(results[1].toolName).toBe("tool2")
		})
	})

	describe("Parameter Conversion", () => {
		test("should convert LangChain args to legacy params", async () => {
			const mockTool = {
				name: "test_tool",
				func: vi.fn().mockResolvedValue("Tool executed"),
			}

			mockRegistry.has.mockReturnValue(true)
			mockRegistry.get.mockReturnValue(mockTool)

			const aiMessage = {
				content: "I'll execute a tool",
				tool_calls: [
					{
						name: "test_tool",
						args: {
							string_param: "hello",
							number_param: 42,
							boolean_param: true,
							array_param: ["a", "b", "c"],
							object_param: { key: "value" },
						},
						id: "call_1",
					},
				],
			} as AIMessage

			await executor.executeToolCalls(aiMessage, mockContext)

			// Verify that the tool was called with converted parameters
			// The simulation should handle the conversion
			expect(mockRegistry.get).toHaveBeenCalledWith("test_tool")
		})
	})

	describe("Execution History", () => {
		test("should record execution history", async () => {
			const mockTool = {
				name: "test_tool",
				func: vi.fn().mockResolvedValue("Tool executed"),
			}

			mockRegistry.has.mockReturnValue(true)
			mockRegistry.get.mockReturnValue(mockTool)

			const aiMessage = {
				content: "I'll execute a tool",
				tool_calls: [
					{
						name: "test_tool",
						args: { param: "value" },
						id: "call_1",
					},
				],
			} as AIMessage

			await executor.executeToolCalls(aiMessage, mockContext)

			const history = executor.getExecutionHistory()
			expect(history).toHaveLength(1)
			expect(history[0].toolName).toBe("test_tool")
			expect(history[0].success).toBe(true)
		})

		test("should limit history size", async () => {
			const executor = new TransitionalExecutor(mockRegistry)

			// Override max history size for testing
			;(executor as any).maxHistorySize = 3

			const mockTool = {
				name: "test_tool",
				func: vi.fn().mockResolvedValue("Tool executed"),
			}

			mockRegistry.has.mockReturnValue(true)
			mockRegistry.get.mockReturnValue(mockTool)

			// Execute 5 tools
			for (let i = 0; i < 5; i++) {
				const aiMessage = {
					content: "I'll execute a tool",
					tool_calls: [
						{
							name: "test_tool",
							args: { param: `value_${i}` },
							id: `call_${i}`,
						},
					],
				} as AIMessage

				await executor.executeToolCalls(aiMessage, mockContext)
			}

			const history = executor.getExecutionHistory()
			expect(history).toHaveLength(3) // Should be limited to max size
			expect(history[0].toolName).toBe("test_tool")
		})

		test("should clear history", async () => {
			const mockTool = {
				name: "test_tool",
				func: vi.fn().mockResolvedValue("Tool executed"),
			}

			mockRegistry.has.mockReturnValue(true)
			mockRegistry.get.mockReturnValue(mockTool)

			const aiMessage = {
				content: "I'll execute a tool",
				tool_calls: [
					{
						name: "test_tool",
						args: { param: "value" },
						id: "call_1",
					},
				],
			} as AIMessage

			await executor.executeToolCalls(aiMessage, mockContext)
			expect(executor.getExecutionHistory()).toHaveLength(1)

			executor.clearHistory()
			expect(executor.getExecutionHistory()).toHaveLength(0)
		})
	})

	describe("Statistics", () => {
		test("should provide execution statistics", async () => {
			const mockTool = {
				name: "test_tool",
				func: vi.fn().mockResolvedValue("Tool executed"),
			}

			const errorTool = {
				name: "error_tool",
				func: vi.fn().mockRejectedValue(new Error("Error")),
			}

			mockRegistry.has.mockReturnValue(true)
			mockRegistry.get.mockImplementation((name) => {
				return name === "test_tool" ? mockTool : errorTool
			})

			// Execute successful tool
			const successMessage = {
				content: "I'll execute a successful tool",
				tool_calls: [
					{
						name: "test_tool",
						args: { param: "value" },
						id: "call_1",
					},
				],
			} as AIMessage

			await executor.executeToolCalls(successMessage, mockContext)

			// Execute failing tool
			const errorMessage = {
				content: "I'll execute a failing tool",
				tool_calls: [
					{
						name: "error_tool",
						args: { param: "value" },
						id: "call_2",
					},
				],
			} as AIMessage

			await executor.executeToolCalls(errorMessage, mockContext)

			const stats = executor.getExecutionStats()

			expect(stats.totalExecutions).toBe(2)
			expect(stats.successfulExecutions).toBe(1)
			expect(stats.failedExecutions).toBe(1)
			expect(stats.averageExecutionTime).toBeGreaterThan(0)
			expect(stats.mostUsedTool).toBe("test_tool") // or error_tool depending on execution order
		})

		test("should handle empty statistics", () => {
			const stats = executor.getExecutionStats()

			expect(stats.totalExecutions).toBe(0)
			expect(stats.successfulExecutions).toBe(0)
			expect(stats.failedExecutions).toBe(0)
			expect(stats.averageExecutionTime).toBe(0)
			expect(stats.mostUsedTool).toBe("")
		})
	})

	describe("Tool Availability", () => {
		test("should check tool availability", () => {
			mockRegistry.has.mockReturnValue(true)
			expect(executor.isToolAvailable("test_tool")).toBe(true)

			mockRegistry.has.mockReturnValue(false)
			expect(executor.isToolAvailable("nonexistent_tool")).toBe(false)
		})

		test("should get available tools", () => {
			const toolNames = ["tool1", "tool2", "tool3"]
			mockRegistry.getToolNames.mockReturnValue(toolNames)

			const availableTools = executor.getAvailableTools()
			expect(availableTools).toEqual(toolNames)
		})
	})

	describe("Error Handling", () => {
		test("should get recent errors", async () => {
			const errorTool = {
				name: "error_tool",
				func: vi.fn().mockRejectedValue(new Error("Test error")),
			}

			mockRegistry.has.mockReturnValue(true)
			mockRegistry.get.mockReturnValue(errorTool)

			// Execute multiple failing tools
			for (let i = 0; i < 5; i++) {
				const aiMessage = {
					content: "I'll execute a failing tool",
					tool_calls: [
						{
							name: "error_tool",
							args: { param: `value_${i}` },
							id: `call_${i}`,
						},
					],
				} as AIMessage

				await executor.executeToolCalls(aiMessage, mockContext)
			}

			const recentErrors = executor.getRecentErrors(3)
			expect(recentErrors).toHaveLength(3)
			recentErrors.forEach((error) => {
				expect(error.success).toBe(false)
				expect(error.error).toBe("Test error")
			})
		})

		test("should handle batch execution errors", async () => {
			mockRegistry.has.mockReturnValue(false)

			const aiMessage = {
				content: "I'll execute multiple tools",
				tool_calls: [
					{
						name: "nonexistent_tool1",
						args: {},
						id: "call_1",
					},
					{
						name: "nonexistent_tool2",
						args: {},
						id: "call_2",
					},
				],
			} as AIMessage

			const results = await executor.executeToolCalls(aiMessage, mockContext)

			expect(results).toHaveLength(2)
			results.forEach((result) => {
				expect(result.success).toBe(false)
				expect(result.toolName).toBe("batch_execution")
			})
		})
	})

	describe("Registry Management", () => {
		test("should set custom registry", () => {
			const customRegistry = {} as ToolWrapperRegistry
			executor.setToolRegistry(customRegistry)
			expect(executor.getToolRegistry()).toBe(customRegistry)
		})
	})

	describe("Configuration", () => {
		test("should allow logging configuration", () => {
			// This test verifies that the method exists and doesn't throw
			expect(() => executor.setLogging(true)).not.toThrow()
			expect(() => executor.setLogging(false)).not.toThrow()
		})
	})

	describe("Edge Cases", () => {
		test("should handle undefined tool calls", async () => {
			const aiMessage = {
				content: "I have no tool calls",
				// tool_calls is undefined
			} as AIMessage

			const results = await executor.executeToolCalls(aiMessage, mockContext)
			expect(results).toHaveLength(0)
		})

		test("should handle null tool calls", async () => {
			const aiMessage = {
				content: "I have null tool calls",
				tool_calls: null,
			} as AIMessage

			const results = await executor.executeToolCalls(aiMessage, mockContext)
			expect(results).toHaveLength(0)
		})

		test("should handle tool with undefined name", async () => {
			const aiMessage = {
				content: "I'll execute a tool with no name",
				tool_calls: [
					{
						name: undefined,
						args: {},
						id: "call_1",
					},
				],
			} as AIMessage

			const results = await executor.executeToolCalls(aiMessage, mockContext)
			expect(results).toHaveLength(1)
			expect(results[0].toolName).toBe("unknown")
		})
	})
})
