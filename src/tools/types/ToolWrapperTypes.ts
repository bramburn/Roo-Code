import { z } from "zod"
import { DynamicStructuredTool } from "@langchain/core/tools"

export interface ToolWrapperRegistration {
	tool: DynamicStructuredTool
	name: string
	description: string
	schema: z.ZodSchema
	version: string
	metadata?: Record<string, any>
}

export interface ToolWrapperRegistry {
	register(wrapper: ToolWrapperRegistration): void
	unregister(name: string): void
	get(name: string): ToolWrapperRegistration | undefined
	list(): ToolWrapperRegistration[]
	clear(): void
}

export interface ToolWrapperPerformanceMetrics {
	executionTime: number
	memoryUsage: number
	successCount: number
	errorCount: number
	lastExecuted: Date
	averageExecutionTime: number
}

export interface ToolWrapperContext {
	cline: any // Task instance - using any to avoid circular imports
	askApproval: any
	handleError: any
	pushToolResult: any
	removeClosingTag: any
}

export interface LangChainToolConfig {
	name: string
	description: string
	schema: z.ZodSchema
	version: string
	tags?: string[]
	metadata?: Record<string, any>
}

export interface ToolExecutionResult {
	success: boolean
	result?: string
	error?: string
	metrics?: ToolWrapperPerformanceMetrics
}

export type ToolWrapperFactory = (context: ToolWrapperContext) => DynamicStructuredTool
