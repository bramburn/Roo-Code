import { DynamicStructuredTool } from "@langchain/core/tools"
import { z } from "zod"
import { Task } from "../../core/task/Task"
import { AskApproval, HandleError, PushToolResult, RemoveClosingTag, ToolUse } from "../../shared/tools"

export interface ToolWrapperConfig {
	toolName: string
	description: string
	zodSchema: z.ZodSchema
	legacyToolFunction: (
		cline: Task,
		block: ToolUse,
		askApproval: AskApproval,
		handleError: HandleError,
		pushToolResult: PushToolResult,
		removeClosingTag: RemoveClosingTag,
	) => Promise<void>
}

export abstract class LangGraphToolWrapper {
	protected cline: Task
	protected askApproval: AskApproval
	protected handleError: HandleError
	protected pushToolResult: PushToolResult
	protected removeClosingTag: RemoveClosingTag
	protected config: ToolWrapperConfig

	constructor(
		cline: Task,
		askApproval: AskApproval,
		handleError: HandleError,
		pushToolResult: PushToolResult,
		removeClosingTag: RemoveClosingTag,
		config: ToolWrapperConfig,
	) {
		this.cline = cline
		this.askApproval = askApproval
		this.handleError = handleError
		this.pushToolResult = pushToolResult
		this.removeClosingTag = removeClosingTag
		this.config = config
	}

	/**
	 * Creates a LangChain DynamicStructuredTool from this wrapper
	 */
	public createLangChainTool(): DynamicStructuredTool {
		return new DynamicStructuredTool({
			name: this.config.toolName,
			description: this.config.description,
			schema: this.config.zodSchema,
			func: async (params: any, context?: any) => {
				return await this.executeTool(params, context)
			},
		})
	}

	/**
	 * Validates input parameters using Zod schema
	 */
	protected validateInput(input: any): { success: true; data: any } | { success: false; error: string } {
		const result = this.config.zodSchema.safeParse(input)
		if (!result.success) {
			return {
				success: false,
				error: result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join(", "),
			}
		}
		return { success: true, data: result.data }
	}

	/**
	 * Converts LangChain parameters to legacy ToolUse format
	 */
	protected convertToToolUse(params: any): ToolUse {
		// Convert all parameters to strings as expected by legacy tools
		const stringParams: Record<string, string> = {}
		for (const [key, value] of Object.entries(params)) {
			if (value !== undefined && value !== null) {
				stringParams[key] = typeof value === "string" ? value : String(value)
			}
		}

		return {
			type: "tool_use",
			name: this.config.toolName,
			params: stringParams,
			partial: false,
		}
	}

	/**
	 * Executes the tool with proper validation and error handling
	 */
	protected async executeTool(params: any, context?: any): Promise<string> {
		// Validate input parameters
		const validation = this.validateInput(params)
		if (!validation.success) {
			throw new Error(`Invalid parameters: ${validation.error}`)
		}

		// Convert to legacy ToolUse format
		const toolUse = this.convertToToolUse(validation.data)

		// Create a promise to capture the result
		let result: string = ""
		let resultPromise = new Promise<string>((resolve) => {
			const originalPushToolResult = this.pushToolResult
			this.pushToolResult = (content: any) => {
				result = typeof content === "string" ? content : JSON.stringify(content)
				originalPushToolResult(content)
				resolve(result)
			}
		})

		// Execute the legacy tool function
		try {
			await this.config.legacyToolFunction(
				this.cline,
				toolUse,
				this.askApproval,
				this.handleError,
				this.pushToolResult,
				this.removeClosingTag,
			)

			// Wait for the result
			return await resultPromise
		} catch (error) {
			// Handle errors through the existing error handling mechanism
			await this.handleError(this.config.toolName, error as Error)
			throw error
		}
	}

	/**
	 * Get the tool name
	 */
	public get name(): string {
		return this.config.toolName
	}

	/**
	 * Get the tool description
	 */
	public get description(): string {
		return this.config.description
	}

	/**
	 * Get the Zod schema for this tool
	 */
	public get schema(): z.ZodSchema {
		return this.config.zodSchema
	}
}
