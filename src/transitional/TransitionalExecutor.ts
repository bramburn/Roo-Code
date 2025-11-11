import { AIMessage } from "@langchain/core/messages"
import { ToolWrapperRegistry } from "../tools/registry/ToolWrapperRegistry"
import { globalToolWrapperRegistry } from "../tools/registry/ToolWrapperRegistry"
import { Task } from "../core/task/Task"
import { AskApproval, HandleError, PushToolResult, RemoveClosingTag, ToolUse } from "../shared/tools"

/**
 * Execution context for tool calls
 */
export interface ToolExecutionContext {
	cline: Task
	askApproval: AskApproval
	handleError: HandleError
	pushToolResult: PushToolResult
	removeClosingTag: RemoveClosingTag
	toolRegistry?: ToolWrapperRegistry
}

/**
 * Tool execution result
 */
export interface ToolExecutionResult {
	success: boolean
	result?: string
	error?: string
	toolName: string
	executionTime: number
	timestamp: Date
}

/**
 * Transitional execution bridge between LangGraph tools and existing task loop
 */
export class TransitionalExecutor {
	private toolRegistry: ToolWrapperRegistry
	private executionHistory: ToolExecutionResult[] = []
	private maxHistorySize: number = 100

	constructor(toolRegistry: ToolWrapperRegistry = globalToolWrapperRegistry) {
		this.toolRegistry = toolRegistry
	}

	/**
	 * Execute LangChain tool calls and bridge to existing task loop
	 */
	async executeToolCalls(aiMessage: AIMessage, context: ToolExecutionContext): Promise<ToolExecutionResult[]> {
		const results: ToolExecutionResult[] = []

		if (!aiMessage.tool_calls || aiMessage.tool_calls.length === 0) {
			return results
		}

		const startTime = Date.now()

		try {
			// Execute each tool call
			for (const toolCall of aiMessage.tool_calls) {
				const result = await this.executeToolCall(toolCall, context)
				results.push(result)

				// Record execution
				this.recordExecution(result)
			}
		} catch (error) {
			// Handle execution errors
			const errorResult: ToolExecutionResult = {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
				toolName: "batch_execution",
				executionTime: Date.now() - startTime,
				timestamp: new Date(),
			}
			results.push(errorResult)
			this.recordExecution(errorResult)
		}

		return results
	}

	/**
	 * Execute a single tool call
	 */
	private async executeToolCall(toolCall: any, context: ToolExecutionContext): Promise<ToolExecutionResult> {
		const startTime = Date.now()
		const toolName = toolCall.name || "unknown"
		const args = toolCall.args || {}

		try {
			// Get the tool wrapper from registry
			const toolWrapper = this.toolRegistry.get(toolName)
			if (!toolWrapper) {
				throw new Error(`Tool '${toolName}' not found in registry`)
			}

			// Create legacy ToolUse format for backward compatibility
			const legacyToolUse: ToolUse = {
				type: "tool_use",
				name: toolName,
				params: this.convertToLegacyParams(args),
				partial: false,
			}

			// Create promise to capture result
			let result: string = ""
			const resultPromise = new Promise<string>((resolve) => {
				const originalPushToolResult = context.pushToolResult
				const wrappedPushToolResult = (content: any) => {
					result = typeof content === "string" ? content : JSON.stringify(content)
					originalPushToolResult(content)
					resolve(result)
				}
				context.pushToolResult = wrappedPushToolResult
			})

			// Execute the tool using the existing pattern
			// Note: This would need to be adapted based on the actual tool execution logic
			// For now, we'll simulate the execution
			await this.simulateToolExecution(legacyToolUse, context)

			// Wait for result
			const finalResult = await resultPromise

			return {
				success: true,
				result: finalResult,
				toolName,
				executionTime: Date.now() - startTime,
				timestamp: new Date(),
			}
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
				toolName,
				executionTime: Date.now() - startTime,
				timestamp: new Date(),
			}
		}
	}

	/**
	 * Convert LangChain tool arguments to legacy parameter format
	 */
	private convertToLegacyParams(args: Record<string, any>): Record<string, string> {
		const legacyParams: Record<string, string> = {}

		for (const [key, value] of Object.entries(args)) {
			if (value !== undefined && value !== null) {
				legacyParams[key] = typeof value === "string" ? value : JSON.stringify(value)
			}
		}

		return legacyParams
	}

	/**
	 * Simulate tool execution (placeholder - would integrate with actual tool execution)
	 */
	private async simulateToolExecution(toolUse: ToolUse, context: ToolExecutionContext): Promise<void> {
		// This is a placeholder for actual tool execution logic
		// In a real implementation, this would:
		// 1. Route to the appropriate legacy tool function
		// 2. Handle the execution with proper error handling
		// 3. Manage the approval flow
		// 4. Handle results properly

		// For now, simulate a basic execution
		const mockResult = `Executed ${toolUse.name} with params: ${JSON.stringify(toolUse.params)}`
		context.pushToolResult(mockResult)
	}

	/**
	 * Record tool execution for monitoring and debugging
	 */
	private recordExecution(result: ToolExecutionResult): void {
		this.executionHistory.push(result)

		// Limit history size
		if (this.executionHistory.length > this.maxHistorySize) {
			this.executionHistory.shift()
		}
	}

	/**
	 * Get execution history
	 */
	public getExecutionHistory(): ToolExecutionResult[] {
		return [...this.executionHistory]
	}

	/**
	 * Get execution statistics
	 */
	public getExecutionStats(): {
		totalExecutions: number
		successfulExecutions: number
		failedExecutions: number
		averageExecutionTime: number
		mostUsedTool: string
		toolUsageStats: Record<string, { count: number; successRate: number; avgTime: number }>
	} {
		const total = this.executionHistory.length
		const successful = this.executionHistory.filter((r) => r.success).length
		const failed = total - successful

		const avgTime = total > 0 ? this.executionHistory.reduce((sum, r) => sum + r.executionTime, 0) / total : 0

		// Calculate tool usage statistics
		const toolStats: Record<string, { count: number; successRate: number; avgTime: number }> = {}
		let mostUsedTool = ""
		let maxCount = 0

		for (const result of this.executionHistory) {
			if (!toolStats[result.toolName]) {
				toolStats[result.toolName] = { count: 0, successRate: 0, avgTime: 0 }
			}

			toolStats[result.toolName].count++
			toolStats[result.toolName].avgTime += result.executionTime

			if (toolStats[result.toolName].count > maxCount) {
				maxCount = toolStats[result.toolName].count
				mostUsedTool = result.toolName
			}
		}

		// Calculate success rates and average times
		for (const [toolName, stats] of Object.entries(toolStats)) {
			const toolResults = this.executionHistory.filter((r) => r.toolName === toolName)
			const successfulToolResults = toolResults.filter((r) => r.success)

			stats.successRate = toolResults.length > 0 ? (successfulToolResults.length / toolResults.length) * 100 : 0
			stats.avgTime = toolResults.length > 0 ? stats.avgTime / toolResults.length : 0
		}

		return {
			totalExecutions: total,
			successfulExecutions: successful,
			failedExecutions: failed,
			averageExecutionTime: avgTime,
			mostUsedTool,
			toolUsageStats: toolStats,
		}
	}

	/**
	 * Clear execution history
	 */
	public clearHistory(): void {
		this.executionHistory = []
	}

	/**
	 * Check if a tool is available for execution
	 */
	public isToolAvailable(toolName: string): boolean {
		return this.toolRegistry.has(toolName)
	}

	/**
	 * Get list of available tools
	 */
	public getAvailableTools(): string[] {
		return this.toolRegistry.getToolNames()
	}

	/**
	 * Get tool registry
	 */
	public getToolRegistry(): ToolWrapperRegistry {
		return this.toolRegistry
	}

	/**
	 * Set tool registry (for testing or custom configurations)
	 */
	public setToolRegistry(registry: ToolWrapperRegistry): void {
		this.toolRegistry = registry
	}

	/**
	 * Enable/disable detailed logging
	 */
	public setLogging(enabled: boolean): void {
		// Implementation for logging configuration
	}

	/**
	 * Get recent errors for debugging
	 */
	public getRecentErrors(limit: number = 10): ToolExecutionResult[] {
		return this.executionHistory.filter((r) => !r.success).slice(-limit)
	}
}

// Global transitional executor instance
export const globalTransitionalExecutor = new TransitionalExecutor()
