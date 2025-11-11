import { DynamicStructuredTool } from "@langchain/core/tools"
import { z } from "zod"
import { Task } from "../../core/task/Task"
import { AskApproval, HandleError, PushToolResult, RemoveClosingTag } from "../../shared/tools"

/**
 * Interface for all LangGraph tool wrappers
 */
export interface ILangGraphToolWrapper {
	readonly name: string
	readonly description: string
	readonly schema: z.ZodSchema

	/**
	 * Creates a LangChain DynamicStructuredTool instance
	 */
	createLangChainTool(): DynamicStructuredTool

	/**
	 * Executes the tool with given parameters
	 */
	executeTool(params: any, context?: any): Promise<string>

	/**
	 * Validates input parameters
	 */
	validateInput(input: any): { success: true; data: any } | { success: false; error: string }
}

/**
 * Interface for tool wrapper factory functions
 */
export interface IToolWrapperFactory {
	create(
		cline: Task,
		askApproval: AskApproval,
		handleError: HandleError,
		pushToolResult: PushToolResult,
		removeClosingTag: RemoveClosingTag,
	): ILangGraphToolWrapper
}

/**
 * Interface for tool wrapper configuration
 */
export interface IToolWrapperConfig {
	toolName: string
	description: string
	zodSchema: z.ZodSchema
	legacyToolFunction: (
		cline: Task,
		block: any,
		askApproval: AskApproval,
		handleError: HandleError,
		pushToolResult: PushToolResult,
		removeClosingTag: RemoveClosingTag,
	) => Promise<void>
	version?: string
	tags?: string[]
	metadata?: Record<string, any>
}

/**
 * Interface for tool wrapper execution context
 */
export interface IToolExecutionContext {
	cline: Task
	askApproval: AskApproval
	handleError: HandleError
	pushToolResult: PushToolResult
	removeClosingTag: RemoveClosingTag
	performanceMonitoring?: boolean
	logging?: boolean
}
