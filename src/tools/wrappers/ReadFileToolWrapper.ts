import { DynamicStructuredTool } from "@langchain/core/tools"
import { LangGraphToolWrapper, ToolWrapperConfig } from "./base/LangGraphToolWrapper"
import { ReadFileSchema, ReadFileInput } from "../schemas/ReadFileSchema"
import { Task } from "../../core/task/Task"
import { AskApproval, HandleError, PushToolResult, RemoveClosingTag } from "../../shared/tools"
import { readFileTool } from "../../core/tools/readFileTool"

/**
 * LangChain-compatible wrapper for readFileTool
 */
export class ReadFileToolWrapper extends LangGraphToolWrapper {
	constructor(
		cline: Task,
		askApproval: AskApproval,
		handleError: HandleError,
		pushToolResult: PushToolResult,
		removeClosingTag: RemoveClosingTag,
	) {
		const config: ToolWrapperConfig = {
			toolName: "read_file",
			description: "Read content from a file with optional line range and line number display",
			zodSchema: ReadFileSchema,
			legacyToolFunction: readFileTool,
		}

		super(cline, askApproval, handleError, pushToolResult, removeClosingTag, config)
	}

	/**
	 * Create a LangChain DynamicStructuredTool instance
	 */
	public static create(
		cline: Task,
		askApproval: AskApproval,
		handleError: HandleError,
		pushToolResult: PushToolResult,
		removeClosingTag: RemoveClosingTag,
	): DynamicStructuredTool {
		const wrapper = new ReadFileToolWrapper(cline, askApproval, handleError, pushToolResult, removeClosingTag)

		return wrapper.createLangChainTool()
	}

	/**
	 * Override executeTool to add custom validation for file operations
	 */
	protected override async executeTool(params: ReadFileInput, context?: any): Promise<string> {
		// Add custom validation for file path security
		if (params.path) {
			const relPath = params.path as string

			// Check for path traversal attempts
			if (relPath.includes("..")) {
				throw new Error("Path traversal (..) is not allowed in file paths")
			}

			// Check for home directory shortcuts
			if (relPath.startsWith("~")) {
				throw new Error("Home directory shortcuts (~) are not allowed")
			}

			// Check for invalid characters in Windows paths
			const invalidChars = /[<>:"|?*]/
			if (invalidChars.test(relPath)) {
				throw new Error('File path contains invalid characters: < > : " | ? *')
			}

			// Check for extremely long paths
			if (relPath.length > 260) {
				throw new Error("File path is too long (max 260 characters)")
			}
		}

		// Add validation for line range
		if (params.start_line !== undefined && params.end_line !== undefined && params.end_line !== -1) {
			if (params.start_line > params.end_line) {
				throw new Error("Start line cannot be greater than end line")
			}

			// Validate reasonable line ranges
			if (params.start_line > 1_000_000) {
				throw new Error("Start line is too large (max 1,000,000)")
			}

			if (params.end_line > 1_000_000) {
				throw new Error("End line is too large (max 1,000,000)")
			}

			// Validate range size
			const rangeSize = params.end_line - params.start_line + 1
			if (rangeSize > 50_000) {
				throw new Error("Line range is too large (max 50,000 lines)")
			}
		}

		// Call parent execute method
		return super.executeTool(params, context)
	}

	/**
	 * Create tool with custom metadata
	 */
	public static createWithMetadata(
		cline: Task,
		askApproval: AskApproval,
		handleError: HandleError,
		pushToolResult: PushToolResult,
		removeClosingTag: RemoveClosingTag,
		metadata?: Record<string, any>,
	): DynamicStructuredTool {
		const wrapper = new ReadFileToolWrapper(cline, askApproval, handleError, pushToolResult, removeClosingTag)

		const tool = wrapper.createLangChainTool()

		// Add metadata to the tool
		if (metadata) {
			;(tool as any).metadata = {
				toolType: "file_operation",
				category: "file_system",
				tags: ["read", "file", "view", "content"],
				version: "1.0.0",
				security: {
					pathTraversalProtection: true,
					lineRangeLimit: 50_000,
					maxLineValue: 1_000_000,
				},
				features: {
					lineRangeSelection: true,
					lineNumberDisplay: true,
					partialFileReading: true,
				},
				...metadata,
			}
		}

		return tool
	}

	/**
	 * Get tool description with examples
	 */
	public static getToolDescription(): string {
		return `
Read content from a file with optional line range and line number display.

This tool allows you to read entire files or specific portions of files.
You can specify line ranges to read only certain sections and optionally
include line numbers for easier reference.

Parameters:
- path (required): The file path relative to the current working directory
- start_line (optional): Starting line number (1-based, minimum 1)
- end_line (optional): Ending line number, or -1 for end of file (default)
- include_line_numbers (optional): Whether to include line numbers in output (default: false)

Security features:
- Path traversal protection (blocks .. sequences)
- Invalid character filtering
- Line range validation and size limits
- Large file protection

Usage patterns:
- Read entire file: { "path": "config.txt" }
- Read specific lines: { "path": "source.py", "start_line": 10, "end_line": 20 }
- Read first 100 lines with numbers: { "path": "log.txt", "start_line": 1, "end_line": 100, "include_line_numbers": true }
- Read lines 50 to end: { "path": "data.csv", "start_line": 50, "end_line": -1 }

Line numbering examples:
- Without numbers: "print('hello')"
- With numbers: "1: print('hello')"
		`.trim()
	}

	/**
	 * Helper method to suggest line range presets
	 */
	public static getLineRangePresets(): Record<string, any> {
		return {
			first_10: { start_line: 1, end_line: 10 },
			first_50: { start_line: 1, end_line: 50 },
			first_100: { start_line: 1, end_line: 100 },
			last_10: { start_line: -10, end_line: -1 },
			last_50: { start_line: -50, end_line: -1 },
		}
	}
}

// Export a singleton factory function
export const createReadFileTool = ReadFileToolWrapper.create
