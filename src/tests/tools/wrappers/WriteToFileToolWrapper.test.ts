import { describe, test, expect, vi, beforeEach, afterEach } from "vitest"
import { WriteToFileToolWrapper } from "../../../tools/wrappers/WriteToFileToolWrapper"
import { WriteToFileSchema } from "../../../tools/schemas/WriteToFileSchema"
import { Task } from "../../../core/task/Task"
import { AskApproval, HandleError, PushToolResult, RemoveClosingTag } from "../../../shared/tools"

// Mock the legacy writeToFileTool function
vi.mock("../../../core/tools/writeToFileTool", () => ({
	writeToFileTool: vi.fn(),
}))

describe("WriteToFileToolWrapper", () => {
	let mockTask: Task
	let mockAskApproval: AskApproval
	let mockHandleError: HandleError
	let mockPushToolResult: PushToolResult
	let mockRemoveClosingTag: RemoveClosingTag

	beforeEach(() => {
		// Setup mock objects
		mockTask = {
			rooIgnoreController: {
				validateAccess: vi.fn().mockReturnValue(true),
			},
			recordToolError: vi.fn(),
			sayAndCreateMissingParamError: vi.fn().mockResolvedValue("Error message"),
			diffViewProvider: {
				reset: vi.fn(),
				editType: undefined,
			},
		} as any

		mockAskApproval = vi.fn().mockResolvedValue(true)
		mockHandleError = vi.fn().mockResolvedValue(undefined)
		mockRemoveClosingTag = vi.fn((tag: string, content: string) => content)

		let resultCallback: (content: any) => void
		mockPushToolResult = vi.fn().mockImplementation((content: any) => {
			if (resultCallback) {
				resultCallback(content)
			}
		})

		// Capture the result callback
		vi.spyOn(mockPushToolResult as any, "mock").mockImplementation((fn) => {
			resultCallback = fn
		})
	})

	afterEach(() => {
		vi.clearAllMocks()
	})

	describe("Tool Creation", () => {
		test("should create valid LangChain tool", () => {
			const tool = WriteToFileToolWrapper.create(
				mockTask,
				mockAskApproval,
				mockHandleError,
				mockPushToolResult,
				mockRemoveClosingTag,
			)

			expect(tool.name).toBe("write_to_file")
			expect(tool.description).toContain("Write content to a file")
			expect(tool.schema).toBeDefined()
		})

		test("should create tool with custom metadata", () => {
			const metadata = {
				customField: "test",
				version: "2.0.0",
			}

			const tool = WriteToFileToolWrapper.createWithMetadata(
				mockTask,
				mockAskApproval,
				mockHandleError,
				mockPushToolResult,
				mockRemoveClosingTag,
				metadata,
			)

			expect((tool as any).metadata).toEqual(
				expect.objectContaining({
					toolType: "file_operation",
					category: "file_system",
					tags: ["write", "file", "create", "edit"],
					version: "1.0.0",
					customField: "test",
					version: "2.0.0",
				}),
			)
		})
	})

	describe("Schema Validation", () => {
		test("should validate valid input", async () => {
			const tool = WriteToFileToolWrapper.create(
				mockTask,
				mockAskApproval,
				mockHandleError,
				mockPushToolResult,
				mockRemoveClosingTag,
			)

			const validInput = {
				path: "test.txt",
				content: "test content",
				line_count: 1,
			}

			// Mock the legacy tool to return a result
			const { writeToFileTool } = await import("../../../core/tools/writeToFileTool")
			vi.mocked(writeToFileTool).mockImplementation(async () => {
				mockPushToolResult("File written successfully")
			})

			const result = await tool.func(validInput, {} as any)

			expect(result).toBe("File written successfully")
		})

		test("should reject invalid input - empty path", async () => {
			const tool = WriteToFileToolWrapper.create(
				mockTask,
				mockAskApproval,
				mockHandleError,
				mockPushToolResult,
				mockRemoveClosingTag,
			)

			const invalidInput = {
				path: "",
				content: "test content",
			}

			await expect(tool.func(invalidInput, {} as any)).rejects.toThrow("File path cannot be empty")
		})

		test("should reject invalid input - path traversal", async () => {
			const tool = WriteToFileToolWrapper.create(
				mockTask,
				mockAskApproval,
				mockHandleError,
				mockPushToolResult,
				mockRemoveClosingTag,
			)

			const invalidInput = {
				path: "../../../etc/passwd",
				content: "test content",
			}

			await expect(tool.func(invalidInput, {} as any)).rejects.toThrow("Path traversal (..) is not allowed")
		})

		test("should reject invalid input - empty content", async () => {
			const tool = WriteToFileToolWrapper.create(
				mockTask,
				mockAskApproval,
				mockHandleError,
				mockPushToolResult,
				mockRemoveClosingTag,
			)

			const invalidInput = {
				path: "test.txt",
				content: "",
			}

			await expect(tool.func(invalidInput, {} as any)).rejects.toThrow("Content cannot be empty")
		})

		test("should reject invalid input - content too large", async () => {
			const tool = WriteToFileToolWrapper.create(
				mockTask,
				mockAskApproval,
				mockHandleError,
				mockPushToolResult,
				mockRemoveClosingTag,
			)

			const invalidInput = {
				path: "test.txt",
				content: "x".repeat(10_000_001), // 10MB + 1 byte
			}

			await expect(tool.func(invalidInput, {} as any)).rejects.toThrow("Content is too large")
		})

		test("should reject invalid input - null bytes in content", async () => {
			const tool = WriteToFileToolWrapper.create(
				mockTask,
				mockAskApproval,
				mockHandleError,
				mockPushToolResult,
				mockRemoveClosingTag,
			)

			const invalidInput = {
				path: "test.txt",
				content: "test\u0000content",
			}

			await expect(tool.func(invalidInput, {} as any)).rejects.toThrow("Content contains invalid null characters")
		})
	})

	describe("Parameter Conversion", () => {
		test("should convert parameters to legacy format correctly", async () => {
			const wrapper = new WriteToFileToolWrapper(
				mockTask,
				mockAskApproval,
				mockHandleError,
				mockPushToolResult,
				mockRemoveClosingTag,
			)

			const params = {
				path: "test.txt",
				content: "test content",
				line_count: 5,
			}

			// Test the convertToToolUse method indirectly through execution
			const mockWriteToFileTool = vi.fn().mockImplementation(async () => {
				mockPushToolResult("Success")
			})

			// Replace the legacy function temporarily
			const originalModule = require("../../../core/tools/writeToFileTool")
			originalModule.writeToFileTool = mockWriteToFileTool

			await wrapper.executeTool(params)

			// Verify the legacy function was called with correct parameters
			expect(mockWriteToFileTool).toHaveBeenCalledWith(
				mockTask,
				expect.objectContaining({
					type: "tool_use",
					name: "write_to_file",
					params: {
						path: "test.txt",
						content: "test content",
						line_count: "5", // Should be converted to string
					},
					partial: false,
				}),
				mockAskApproval,
				mockHandleError,
				expect.any(Function), // pushToolResult
				mockRemoveClosingTag,
			)
		})
	})

	describe("Security Validations", () => {
		test("should block dangerous file paths", async () => {
			const tool = WriteToFileToolWrapper.create(
				mockTask,
				mockAskApproval,
				mockHandleError,
				mockPushToolResult,
				mockRemoveClosingTag,
			)

			const dangerousPaths = [
				"../../../etc/passwd",
				"/etc/shadow",
				"~/.ssh/id_rsa",
				"C:\\Windows\\System32\\config\\SAM",
			]

			for (const path of dangerousPaths) {
				await expect(tool.func({ path, content: "test" }, {} as any)).rejects.toThrow()
			}
		})

		test("should block paths with invalid characters", async () => {
			const tool = WriteToFileToolWrapper.create(
				mockTask,
				mockAskApproval,
				mockHandleError,
				mockPushToolResult,
				mockRemoveClosingTag,
			)

			const invalidPaths = [
				"file<name.txt",
				"file>name.txt",
				'file"name.txt',
				"file|name.txt",
				"file?name.txt",
				"file*.txt",
			]

			for (const path of invalidPaths) {
				await expect(tool.func({ path, content: "test" }, {} as any)).rejects.toThrow(
					"File path contains invalid characters",
				)
			}
		})

		test("should block extremely long paths", async () => {
			const tool = WriteToFileToolWrapper.create(
				mockTask,
				mockAskApproval,
				mockHandleError,
				mockPushToolResult,
				mockRemoveClosingTag,
			)

			const longPath = "a".repeat(261) + ".txt"

			await expect(tool.func({ path: longPath, content: "test" }, {} as any)).rejects.toThrow(
				"File path is too long",
			)
		})
	})

	describe("Integration with Legacy System", () => {
		test("should integrate with existing approval flow", async () => {
			const tool = WriteToFileToolWrapper.create(
				mockTask,
				mockAskApproval,
				mockHandleError,
				mockPushToolResult,
				mockRemoveClosingTag,
			)

			const input = {
				path: "test.txt",
				content: "test content",
			}

			// Mock the legacy tool
			const { writeToFileTool } = await import("../../../core/tools/writeToFileTool")
			vi.mocked(writeToFileTool).mockImplementation(
				async (cline, block, askApproval, handleError, pushToolResult, removeClosingTag) => {
					// Simulate approval flow
					const approved = await askApproval("tool_use" as any)
					if (approved) {
						pushToolResult("File written successfully")
					}
				},
			)

			const result = await tool.func(input, {} as any)

			expect(mockAskApproval).toHaveBeenCalled()
			expect(result).toBe("File written successfully")
		})

		test("should handle errors through existing error handling", async () => {
			const tool = WriteToFileToolWrapper.create(
				mockTask,
				mockAskApproval,
				mockHandleError,
				mockPushToolResult,
				mockRemoveClosingTag,
			)

			const input = {
				path: "test.txt",
				content: "test content",
			}

			const testError = new Error("Test error")
			const { writeToFileTool } = await import("../../../core/tools/writeToFileTool")
			vi.mocked(writeToFileTool).mockImplementation(async () => {
				throw testError
			})

			await expect(tool.func(input, {} as any)).rejects.toThrow("Test error")
		})
	})

	describe("Edge Cases", () => {
		test("should handle optional line_count parameter", async () => {
			const tool = WriteToFileToolWrapper.create(
				mockTask,
				mockAskApproval,
				mockHandleError,
				mockPushToolResult,
				mockRemoveClosingTag,
			)

			const inputWithoutLineCount = {
				path: "test.txt",
				content: "test content",
			}

			const { writeToFileTool } = await import("../../../core/tools/writeToFileTool")
			vi.mocked(writeToFileTool).mockImplementation(async () => {
				mockPushToolResult("Success")
			})

			await expect(tool.func(inputWithoutLineCount, {} as any)).resolves.toBe("Success")
		})

		test("should handle numeric line_count conversion", async () => {
			const tool = WriteToFileToolWrapper.create(
				mockTask,
				mockAskApproval,
				mockHandleError,
				mockPushToolResult,
				mockRemoveClosingTag,
			)

			const input = {
				path: "test.txt",
				content: "test content",
				line_count: 5, // Number should be converted to string "5"
			}

			const { writeToFileTool } = await import("../../../core/tools/writeToFileTool")
			vi.mocked(writeToFileTool).mockImplementation(
				async (cline, block, askApproval, handleError, pushToolResult, removeClosingTag) => {
					expect(block.params.line_count).toBe("5")
					mockPushToolResult("Success")
				},
			)

			await expect(tool.func(input, {} as any)).resolves.toBe("Success")
		})
	})

	describe("Static Methods", () => {
		test("should provide tool description", () => {
			const description = WriteToFileToolWrapper.getToolDescription()
			expect(description).toContain("Write content to a file")
			expect(description).toContain("Security features")
			expect(description).toContain("Examples")
		})

		test("should return proper tool metadata", () => {
			const tool = WriteToFileToolWrapper.create(
				mockTask,
				mockAskApproval,
				mockHandleError,
				mockPushToolResult,
				mockRemoveClosingTag,
			)

			expect(tool.name).toBe("write_to_file")
			expect(tool.description).toContain("Write content to a file")
		})
	})
})
