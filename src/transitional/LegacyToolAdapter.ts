import { DynamicStructuredTool } from "@langchain/core/tools"
import { ToolUse } from "../shared/tools"
import { LangGraphToolWrapper } from "../tools/wrappers/base/LangGraphToolWrapper"
import { Task } from "../core/task/Task"
import { AskApproval, HandleError, PushToolResult, RemoveClosingTag } from "../shared/tools"

/**
 * Adapter for converting legacy tools to LangChain format
 */
export class LegacyToolAdapter {
	/**
	 * Convert a legacy ToolUse to LangChain tool call format
	 */
	static convertToLangChainCall(toolUse: ToolUse): {
		name: string
		args: Record<string, any>
		id?: string
	} {
		return {
			name: toolUse.name,
			args: this.convertLegacyParamsToArgs(toolUse.params),
			id: `legacy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
		}
	}

	/**
	 * Convert legacy parameters to LangChain arguments
	 */
	static convertLegacyParamsToArgs(params: Record<string, string>): Record<string, any> {
		const args: Record<string, any> = {}

		for (const [key, value] of Object.entries(params)) {
			if (value !== undefined && value !== null) {
				// Try to parse as JSON first
				try {
					args[key] = JSON.parse(value)
				} catch {
					// If not valid JSON, keep as string
					args[key] = value
				}
			}
		}

		return args
	}

	/**
	 * Convert LangChain arguments to legacy parameters
	 */
	static convertArgsToLegacyParams(args: Record<string, any>): Record<string, string> {
		const params: Record<string, string> = {}

		for (const [key, value] of Object.entries(args)) {
			if (value !== undefined && value !== null) {
				if (typeof value === "string") {
					params[key] = value
				} else {
					// Convert to JSON string
					try {
						params[key] = JSON.stringify(value)
					} catch {
						params[key] = String(value)
					}
				}
			}
		}

		return params
	}

	/**
	 * Create a LangChain tool wrapper from a legacy tool function
	 */
	static createWrapperFromLegacyFunction(
		toolName: string,
		description: string,
		legacyFunction: (
			cline: Task,
			block: ToolUse,
			askApproval: AskApproval,
			handleError: HandleError,
			pushToolResult: PushToolResult,
			removeClosingTag: RemoveClosingTag,
		) => Promise<void>,
		cline: Task,
		askApproval: AskApproval,
		handleError: HandleError,
		pushToolResult: PushToolResult,
		removeClosingTag: RemoveClosingTag,
	): DynamicStructuredTool {
		return new DynamicStructuredTool({
			name: toolName as any,
			description,
			schema: this.createLegacySchema(toolName),
			func: async (args: any, context?: any) => {
				// Convert args to legacy params
				const legacyParams = this.convertArgsToLegacyParams(args)

				// Create legacy ToolUse format
				const toolUse: ToolUse = {
					type: "tool_use",
					name: toolName as any,
					params: legacyParams,
					partial: false,
				}

				// Create promise to capture result
				let result: string = ""
				const resultPromise = new Promise<string>((resolve) => {
					const originalPushToolResult = pushToolResult
					const wrappedPushToolResult = (content: any) => {
						result = typeof content === "string" ? content : JSON.stringify(content)
						originalPushToolResult(content)
						resolve(result)
					}
					// Temporarily replace pushToolResult
					;(pushToolResult as any) = wrappedPushToolResult
				})

				// Execute the legacy function
				await legacyFunction(cline, toolUse, askApproval, handleError, pushToolResult, removeClosingTag)

				// Wait for and return result
				return await resultPromise
			},
		})
	}

	/**
	 * Create a basic schema for legacy tools
	 */
	static createLegacySchema(toolName: string): any {
		// This is a basic schema that would accept any parameters
		// In a real implementation, this would be more sophisticated
		// and based on the actual tool's parameter requirements

		// For now, return a flexible schema that accepts any object
		// The actual validation would happen in the legacy tool function
		return {
			type: "object",
			properties: {},
			required: [],
		}
	}

	/**
	 * Extract parameter information from legacy tool function
	 */
	static extractParameterInfo(legacyFunction: (...args: any[]) => any): {
		required: string[]
		optional: string[]
		types: Record<string, string>
	} {
		// This is a placeholder implementation
		// In a real scenario, you would analyze the function signature,
		// documentation, or usage patterns to determine parameters

		return {
			required: [],
			optional: [],
			types: {},
		}
	}

	/**
	 * Create a compatibility layer for tool execution
	 */
	static createCompatibilityLayer(): {
		executeLegacyTool: (toolUse: ToolUse, context: any) => Promise<any>
		convertResult: (legacyResult: any) => any
		handleError: (error: Error, toolName: string) => any
	} {
		return {
			async executeLegacyTool(toolUse: ToolUse, context: any): Promise<any> {
				// Convert to LangChain format
				const langChainCall = LegacyToolAdapter.convertToLangChainCall(toolUse)

				// Execute through the appropriate mechanism
				// This would integrate with the actual tool execution system
				return {
					name: langChainCall.name,
					result: `Legacy tool ${toolUse.name} executed with params: ${JSON.stringify(toolUse.params)}`,
					success: true,
				}
			},

			convertResult(legacyResult: any): any {
				// Convert legacy result format to LangChain format
				if (typeof legacyResult === "string") {
					return { result: legacyResult }
				}
				return legacyResult
			},

			handleError(error: Error, toolName: string): any {
				return {
					error: error.message,
					toolName,
					timestamp: new Date().toISOString(),
				}
			},
		}
	}

	/**
	 * Validate tool compatibility
	 */
	static validateToolCompatibility(toolName: string): {
		compatible: boolean
		warnings: string[]
		requiredChanges: string[]
	} {
		const warnings: string[] = []
		const requiredChanges: string[] = []

		// Check for known compatibility issues
		const knownIncompatibleTools = ["some_legacy_tool", "deprecated_tool"]
		if (knownIncompatibleTools.includes(toolName)) {
			warnings.push(`Tool ${toolName} has known compatibility issues`)
		}

		// Check for tools that require special handling
		const specialHandlingTools = ["interactive_tool", "ui_tool"]
		if (specialHandlingTools.includes(toolName)) {
			requiredChanges.push(`Tool ${toolName} requires special handling for LangChain integration`)
		}

		return {
			compatible: warnings.length === 0 && requiredChanges.length === 0,
			warnings,
			requiredChanges,
		}
	}

	/**
	 * Get migration suggestions for a legacy tool
	 */
	static getMigrationSuggestions(toolName: string): {
		easyMigration: boolean
		steps: string[]
		estimatedEffort: "low" | "medium" | "high"
		prerequisites: string[]
	} {
		// This would analyze the tool and provide migration guidance
		const compatibility = this.validateToolCompatibility(toolName)

		return {
			easyMigration: compatibility.compatible,
			steps: [
				`Create Zod schema for ${toolName} parameters`,
				`Implement LangGraphToolWrapper for ${toolName}`,
				`Register wrapper in tool registry`,
				`Test compatibility with existing workflows`,
				...compatibility.requiredChanges,
			],
			estimatedEffort: compatibility.compatible
				? "low"
				: compatibility.requiredChanges.length > 2
					? "high"
					: "medium",
			prerequisites: [
				"LangChain dependencies installed",
				"Base wrapper classes implemented",
				"Tool registry configured",
			],
		}
	}

	/**
	 * Create a batch adapter for multiple legacy tools
	 */
	static createBatchAdapter(
		legacyTools: Array<{
			name: string
			description: string
			function: (...args: any[]) => any
		}>,
	): Map<string, DynamicStructuredTool> {
		const toolMap = new Map<string, DynamicStructuredTool>()

		for (const tool of legacyTools) {
			// Create wrapper for each tool
			const wrapper = this.createWrapperFromLegacyFunction(
				tool.name,
				tool.description,
				tool.function as any,
				// These would need to be provided in a real implementation
				{} as Task,
				{} as AskApproval,
				{} as HandleError,
				{} as PushToolResult,
				{} as RemoveClosingTag,
			)

			toolMap.set(tool.name, wrapper)
		}

		return toolMap
	}

	/**
	 * Analyze legacy tool usage patterns
	 */
	static analyzeUsagePatterns(
		toolName: string,
		usageHistory: ToolUse[],
	): {
		commonParameters: Record<string, number>
		parameterTypes: Record<string, string>
		frequency: number
		lastUsed: Date | null
		successRate: number
	} {
		const toolUsage = usageHistory.filter((use) => use.name === toolName)
		const commonParameters: Record<string, number> = {}
		const parameterTypes: Record<string, string> = {}

		// Analyze parameter usage
		for (const usage of toolUsage) {
			for (const [param, value] of Object.entries(usage.params)) {
				commonParameters[param] = (commonParameters[param] || 0) + 1

				// Determine parameter type
				if (!parameterTypes[param]) {
					if (value.match(/^\d+$/)) {
						parameterTypes[param] = "number"
					} else if (value === "true" || value === "false") {
						parameterTypes[param] = "boolean"
					} else {
						parameterTypes[param] = "string"
					}
				}
			}
		}

		// Calculate success rate (placeholder - would need actual success tracking)
		const successRate = toolUsage.length > 0 ? 0.95 : 0 // 95% assumed success rate

		return {
			commonParameters,
			parameterTypes,
			frequency: toolUsage.length,
			lastUsed: toolUsage.length > 0 ? new Date() : null,
			successRate,
		}
	}
}

// Export utility functions for easier usage
export const {
	convertToLangChainCall,
	convertLegacyParamsToArgs,
	convertArgsToLegacyParams,
	createWrapperFromLegacyFunction,
	validateToolCompatibility,
	getMigrationSuggestions,
} = LegacyToolAdapter
