import type { Task } from "../task/Task"
import type { ToolUse, AskApproval, HandleError, PushToolResult, RemoveClosingTag } from "../../../shared/tools"
import type { RetrySettings, RetryableToolExecution } from "./types"
import { RetryEngine } from "./RetryEngine"
import { RetryFactory } from "./RetryFactory"

/**
 * Integration layer for retry mechanism with existing tool execution pipeline
 * Provides seamless retry integration without modifying existing tool implementations
 */
export class RetryIntegration {
	private readonly retryEngine: RetryEngine
	private readonly toolRetrySettings = new Map<string, Partial<RetrySettings>>()

	constructor(retrySettings?: Partial<RetrySettings>) {
		// Initialize retry engine with default settings
		const engineConfig = {
			defaultSettings: RetryFactory.mergeSettings(retrySettings || {}, {
				enableRetry: false,
				maxRetryAttempts: 3,
				baseDelayMs: 1000,
				maxDelayMs: 30000,
				backoffMultiplier: 2,
				jitterFactor: 0.1,
				enableContextOptimization: true,
				enableManualRetry: true,
				retryTimeoutMs: 60000,
			}),
			maxConcurrentRetries: 5,
			enablePersistence: true,
			enableDetailedLogging: true,
		}

		this.retryEngine = new RetryEngine(engineConfig)
	}

	/**
	 * Wrap a tool execution with retry logic
	 * @param task - Task instance
	 * @param toolName - Tool name
	 * @param originalExecute - Original tool execution function
	 * @param block - Tool use block
	 * @param askApproval - Ask approval function
	 * @param handleError - Handle error function
	 * @param pushToolResult - Push tool result function
	 * @param removeClosingTag - Remove closing tag function
	 * @returns Tool execution result with retry support
	 */
	wrapToolExecution<T>(
		task: Task,
		toolName: string,
		originalExecute: (
			task: Task,
			block: ToolUse,
			askApproval: AskApproval,
			handleError: HandleError,
			pushToolResult: PushToolResult,
			removeClosingTag: RemoveClosingTag,
		) => Promise<T>,
		block: ToolUse,
		askApproval: AskApproval,
		handleError: HandleError,
		pushToolResult: PushToolResult,
		removeClosingTag: RemoveClosingTag,
	): Promise<T> {
		// Get retry settings for this tool
		const retrySettings = this.getToolRetrySettings(toolName, task)

		// If retry is disabled, execute directly
		if (!retrySettings.enableRetry) {
			return originalExecute(task, block, askApproval, handleError, pushToolResult, removeClosingTag)
		}

		// Create retryable execution
		const retryableExecution: RetryableToolExecution = {
			toolName,
			execute: async (params: Record<string, any>) => {
				// Create a modified block with retry context
				const modifiedBlock = {
					...block,
					params: { ...block.params, ...params },
					// Add retry metadata to block
					_metadata: {
						...block._metadata,
						retryContext: {
							toolName,
							originalParams: block.params,
							retryAttempt: 0,
						},
					},
				}

				// Execute original tool with modified block
				return originalExecute(task, modifiedBlock, askApproval, handleError, pushToolResult, removeClosingTag)
			},
			params: block.params,
			context: {
				taskId: task.taskId,
				workingDirectory: task.cwd,
				provider: task.providerRef.deref(),
			},
			retryConfig: retrySettings,
		}

		// Execute with retry engine
		return this.retryEngine.executeWithRetry(retryableExecution)
	}

	/**
	 * Get retry settings for a specific tool
	 * @param toolName - Tool name
	 * @param task - Task instance
	 * @returns Retry settings for the tool
	 */
	private getToolRetrySettings(toolName: string, task: Task): RetrySettings {
		// Check for tool-specific settings
		if (this.toolRetrySettings.has(toolName)) {
			const toolSpecific = this.toolRetrySettings.get(toolName)!
			return RetryFactory.mergeSettings(toolSpecific, this.retryEngine.getConfig().defaultSettings)
		}

		// Get global retry settings from task provider
		const provider = task.providerRef.deref()
		const globalSettings = provider?.getState()?.retrySettings

		if (globalSettings) {
			return RetryFactory.mergeSettings({}, globalSettings)
		}

		// Return default settings
		return this.retryEngine.getConfig().defaultSettings
	}

	/**
	 * Configure retry settings for a specific tool
	 * @param toolName - Tool name
	 * @param settings - Retry settings
	 */
	configureToolRetry(toolName: string, settings: Partial<RetrySettings>): void {
		this.toolRetrySettings.set(toolName, settings)
	}

	/**
	 * Get retry engine statistics
	 * @returns Retry engine statistics
	 */
	getRetryStatistics(): any {
		return this.retryEngine.getStatistics()
	}

	/**
	 * Cancel all active retries
	 * @param reason - Cancellation reason
	 */
	cancelAllRetries(reason?: string): void {
		this.retryEngine.cancelAllRetries(reason)
	}

	/**
	 * Pause retry processing
	 */
	pauseRetries(): void {
		this.retryEngine.pause()
	}

	/**
	 * Resume retry processing
	 */
	resumeRetries(): void {
		this.retryEngine.resume()
	}

	/**
	 * Update retry configuration
	 * @param newConfig - New configuration
	 */
	updateRetryConfig(newConfig: Partial<RetrySettings>): void {
		const currentConfig = this.retryEngine.getConfig()
		const updatedDefaults = RetryFactory.mergeSettings(newConfig, currentConfig.defaultSettings)

		this.retryEngine.updateConfig({
			defaultSettings: updatedDefaults,
		})
	}

	/**
	 * Enable retry for a tool
	 * @param toolName - Tool name
	 * @param settings - Optional retry settings
	 */
	enableToolRetry(toolName: string, settings?: Partial<RetrySettings>): void {
		this.configureToolRetry(toolName, {
			enableRetry: true,
			...settings,
		})
	}

	/**
	 * Disable retry for a tool
	 * @param toolName - Tool name
	 */
	disableToolRetry(toolName: string): void {
		this.configureToolRetry(toolName, {
			enableRetry: false,
		})
	}

	/**
	 * Check if retry is enabled for a tool
	 * @param toolName - Tool name
	 * @param task - Task instance
	 * @returns Whether retry is enabled
	 */
	isRetryEnabled(toolName: string, task: Task): boolean {
		const settings = this.getToolRetrySettings(toolName, task)
		return settings.enableRetry === true
	}

	/**
	 * Get retry status for all tools
	 * @returns Retry status by tool name
	 */
	getRetryStatus(task: Task): Record<string, { enabled: boolean; settings: RetrySettings }> {
		const status: Record<string, { enabled: boolean; settings: RetrySettings }> = {}

		// Common tool names that might use retry
		const toolNames = [
			"execute_command",
			"use_mcp_tool",
			"read_file",
			"write_to_file",
			"apply_diff",
			"search_files",
			"list_files",
			"codebase_search",
			"browser_action",
		]

		for (const toolName of toolNames) {
			const settings = this.getToolRetrySettings(toolName, task)
			status[toolName] = {
				enabled: settings.enableRetry === true,
				settings,
			}
		}

		return status
	}

	/**
	 * Create retry integration for execute_command tool
	 * @param originalExecuteCommandTool - Original execute command tool function
	 * @returns Wrapped execute command tool function
	 */
	static wrapExecuteCommandTool(
		originalExecuteCommandTool: typeof import("./executeCommandTool").executeCommandTool,
	): typeof import("./executeCommandTool").executeCommandTool {
		const integration = new RetryIntegration()

		return async (task, block, askApproval, handleError, pushToolResult, removeClosingTag) => {
			return integration.wrapToolExecution(
				task,
				"execute_command",
				originalExecuteCommandTool,
				block,
				askApproval,
				handleError,
				pushToolResult,
				removeClosingTag,
			)
		}
	}

	/**
	 * Create retry integration for use_mcp_tool
	 * @param originalUseMcpToolTool - Original use MCP tool function
	 * @returns Wrapped use MCP tool function
	 */
	static wrapUseMcpToolTool(
		originalUseMcpToolTool: typeof import("./useMcpToolTool").useMcpToolTool,
	): typeof import("./useMcpToolTool").useMcpToolTool {
		const integration = new RetryIntegration()

		return async (task, block, askApproval, handleError, pushToolResult, removeClosingTag) => {
			return integration.wrapToolExecution(
				task,
				"use_mcp_tool",
				originalUseMcpToolTool,
				block,
				askApproval,
				handleError,
				pushToolResult,
				removeClosingTag,
			)
		}
	}

	/**
	 * Create retry integration for file operations
	 * @param toolName - Tool name
	 * @param originalFileTool - Original file tool function
	 * @returns Wrapped file tool function
	 */
	static wrapFileTool<T>(
		toolName: string,
		originalFileTool: (
			task: Task,
			block: ToolUse,
			askApproval: AskApproval,
			handleError: HandleError,
			pushToolResult: PushToolResult,
			removeClosingTag: RemoveClosingTag,
		) => Promise<T>,
	): typeof originalFileTool {
		const integration = new RetryIntegration()

		return async (task, block, askApproval, handleError, pushToolResult, removeClosingTag) => {
			return integration.wrapToolExecution(
				task,
				toolName,
				originalFileTool,
				block,
				askApproval,
				handleError,
				pushToolResult,
				removeClosingTag,
			)
		}
	}

	/**
	 * Dispose of retry integration resources
	 */
	async dispose(): Promise<void> {
		await this.retryEngine.dispose()
		this.toolRetrySettings.clear()
	}
}
