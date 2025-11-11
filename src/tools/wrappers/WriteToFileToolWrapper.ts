import { DynamicStructuredTool } from "@langchain/core/tools"
import { LangGraphToolWrapper, ToolWrapperConfig } from "./base/LangGraphToolWrapper"
import { WriteToFileSchema, WriteToFileInput } from "../schemas/WriteToFileSchema"
import { Task } from "../../core/task/Task"
import { AskApproval, HandleError, PushToolResult, RemoveClosingTag, ToolUse } from "../../shared/tools"
import { writeToFileTool } from "../../core/tools/writeToFileTool"

/**
 * LangChain-compatible wrapper for writeToFileTool
 */
export class WriteToFileToolWrapper extends LangGraphToolWrapper {
	constructor(
		cline: Task,
		askApproval: AskApproval,
		handleError: HandleError,
		pushToolResult: PushToolResult,
		removeClosingTag: RemoveClosingTag,
	) {
		const config: ToolWrapperConfig = {
			toolName: "write_to_file",
			description: "Write content to a file with proper validation and error handling",
			zodSchema: WriteToFileSchema,
			legacyToolFunction: writeToFileTool,
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
		const wrapper = new WriteToFileToolWrapper(cline, askApproval, handleError, pushToolResult, removeClosingTag)

		return wrapper.createLangChainTool()
	}

	/**
	 * Override executeTool to add custom validation for file operations
	 */
	protected override async executeTool(params: WriteToFileInput, context?: any): Promise<string> {
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

		// Add validation for content size
		if (params.content && params.content.length > 10_000_000) {
			throw new Error("Content is too large (max 10MB)")
		}

		// Add validation for null bytes in content
		if (params.content && params.content.includes("\u0000")) {
			throw new Error("Content contains invalid null characters")
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
		const wrapper = new WriteToFileToolWrapper(cline, askApproval, handleError, pushToolResult, removeClosingTag)

		const tool = wrapper.createLangChainTool()

		// Add metadata to the tool
		if (metadata) {
			;(tool as any).metadata = {
				toolType: "file_operation",
				category: "file_system",
				tags: ["write", "file", "create", "edit"],
				version: "1.0.0",
				security: {
					pathTraversalProtection: true,
					contentValidation: true,
					maxContentSize: 10_000_000,
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
Write content to a file with proper validation and error handling.

This tool allows you to create new files or overwrite existing files with specified content.
The tool includes security validations to prevent path traversal attacks and ensures
content integrity.

Parameters:
- path (required): The file path relative to the current working directory
- content (required): The content to write to the file
- line_count (optional): Number of lines the content should have

Security features:
- Path traversal protection (blocks .. sequences)
- Invalid character filtering
- Content size limits (max 10MB)
- Null byte detection

Examples:
- Write a simple text file: { "path": "notes.txt", "content": "Meeting notes from today" }
- Create a configuration file: { "path": "config.json", "content": '{ "debug": true }' }
- Write code with line count: { "path": "script.py", "content": "print('Hello')", "line_count": 1 }
		`.trim()
	}
}

// Export a singleton factory function
export const createWriteToFileTool = WriteToFileToolWrapper.create
