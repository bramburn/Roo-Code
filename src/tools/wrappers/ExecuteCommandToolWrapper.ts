import { DynamicStructuredTool } from "@langchain/core/tools"
import { LangGraphToolWrapper, ToolWrapperConfig } from "./base/LangGraphToolWrapper"
import {
	ExecuteCommandSchema,
	ExecuteCommandInput,
	CommandClassification,
	CommandSafetyLevel,
} from "../schemas/ExecuteCommandSchema"
import { Task } from "../../core/task/Task"
import { AskApproval, HandleError, PushToolResult, RemoveClosingTag } from "../../shared/tools"
import { executeCommandTool } from "../../core/tools/executeCommandTool"

/**
 * LangChain-compatible wrapper for executeCommandTool
 */
export class ExecuteCommandToolWrapper extends LangGraphToolWrapper {
	constructor(
		cline: Task,
		askApproval: AskApproval,
		handleError: HandleError,
		pushToolResult: PushToolResult,
		removeClosingTag: RemoveClosingTag,
	) {
		const config: ToolWrapperConfig = {
			toolName: "execute_command",
			description: "Execute shell commands with safety validations and risk assessment",
			zodSchema: ExecuteCommandSchema,
			legacyToolFunction: executeCommandTool,
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
		const wrapper = new ExecuteCommandToolWrapper(cline, askApproval, handleError, pushToolResult, removeClosingTag)

		return wrapper.createLangChainTool()
	}

	/**
	 * Override executeTool to add custom validation for command execution
	 */
	protected override async executeTool(params: ExecuteCommandInput, context?: any): Promise<string> {
		// Validate command safety
		const safetyCheck = CommandClassification.isSafeCommand(params.command)

		if (!safetyCheck.safe) {
			throw new Error(`Command execution blocked: ${safetyCheck.reason}`)
		}

		// Add warning for risky commands
		if (safetyCheck.level === CommandSafetyLevel.RISKY) {
			console.warn(`Executing risky command: ${params.command} - ${safetyCheck.reason}`)
		}

		// Additional custom validations
		if (params.command) {
			const cmd = params.command.trim()

			// Check for extremely long commands
			if (cmd.length > 10_000) {
				throw new Error("Command is too long (max 10,000 characters)")
			}

			// Check for null bytes
			if (cmd.includes("\u0000")) {
				throw new Error("Command contains invalid null characters")
			}

			// Check for control characters
			// eslint-disable-next-line no-control-regex
			const controlChars = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/
			if (controlChars.test(cmd)) {
				throw new Error("Command contains invalid control characters")
			}

			// Check for command injection attempts
			const injectionPatterns = [
				/&&\s*rm\s+-rf/, // && rm -rf
				/\|\|\s*rm\s+-rf/, // || rm -rf
				/;\s*rm\s+-rf/, // ; rm -rf
				/`.*rm\s+-rf.*`/, // `rm -rf`
				/\$\(.*rm\s+-rf.*\)/, // $(rm -rf)
			]

			for (const pattern of injectionPatterns) {
				if (pattern.test(cmd.toLowerCase())) {
					throw new Error("Command appears to contain injection attempts")
				}
			}
		}

		// Validate working directory
		if (params.cwd) {
			const cwd = params.cwd as string

			// Check for path traversal
			if (cwd.includes("..") || cwd.startsWith("~")) {
				throw new Error("Working directory contains invalid path traversal")
			}

			// Check for invalid characters
			const invalidChars = /[<>:"|?*]/
			if (invalidChars.test(cwd)) {
				throw new Error("Working directory path contains invalid characters")
			}

			// Check path length
			if (cwd.length > 260) {
				throw new Error("Working directory path is too long (max 260 characters)")
			}
		}

		// Validate timeout
		if (params.timeout !== undefined) {
			if (params.timeout > 300) {
				throw new Error("Timeout is too long (max 300 seconds)")
			}
			if (params.timeout < 0) {
				throw new Error("Timeout must be non-negative")
			}
		}

		// Call parent execute method
		return super.executeTool(params, context)
	}

	/**
	 * Create tool with custom metadata and enhanced safety features
	 */
	public static createWithMetadata(
		cline: Task,
		askApproval: AskApproval,
		handleError: HandleError,
		pushToolResult: PushToolResult,
		removeClosingTag: RemoveClosingTag,
		metadata?: Record<string, any>,
	): DynamicStructuredTool {
		const wrapper = new ExecuteCommandToolWrapper(cline, askApproval, handleError, pushToolResult, removeClosingTag)

		const tool = wrapper.createLangChainTool()

		// Add metadata to the tool
		if (metadata) {
			;(tool as any).metadata = {
				toolType: "command_execution",
				category: "system",
				tags: ["execute", "command", "shell", "terminal"],
				version: "1.0.0",
				security: {
					commandValidation: true,
					injectionProtection: true,
					pathTraversalProtection: true,
					maxCommandLength: 10_000,
					maxTimeout: 300,
				},
				features: {
					workingDirectorySupport: true,
					timeoutControl: true,
					safetyClassification: true,
					riskAssessment: true,
				},
				safetyLevels: Object.values(CommandSafetyLevel),
				categories: Object.values(CommandClassification),
				...metadata,
			}
		}

		return tool
	}

	/**
	 * Get tool description with examples and safety information
	 */
	public static getToolDescription(): string {
		return `
Execute shell commands with comprehensive safety validations and risk assessment.

This tool allows you to run shell commands while maintaining security through
multiple layers of validation including command classification, injection
prevention, and resource limits.

Parameters:
- command (required): The shell command to execute
- cwd (optional): Working directory for command execution
- timeout (optional): Maximum execution time in seconds (max 300)

Safety features:
- Command classification and risk assessment
- Injection attempt detection
- Path traversal protection
- Control character filtering
- Command length limits
- Timeout enforcement

Safety levels:
- SAFE: Basic file operations, development tools, system info
- MODERATE: Package management, network tools
- RISKY: Commands requiring elevated privileges
- DANGEROUS: System-wide destructive operations (blocked)

Command categories:
- file_operations: ls, cat, cp, mv, rm, mkdir, etc.
- system_info: ps, df, free, uname, etc.
- network: ping, curl, wget, nslookup, etc.
- development: git, npm, python, node, etc.
- package_management: apt, yum, brew, etc.
- process_management: kill, jobs, nohup, etc.

Usage examples:
- List directory contents: { "command": "ls -la" }
- Git status: { "command": "git status" }
- Install package: { "command": "npm install", "cwd": "/project" }
- Network test: { "command": "ping -c 4 google.com" }
- With timeout: { "command": "make build", "timeout": 120 }

Risk assessment:
Commands are automatically classified by safety level. Dangerous commands
like 'rm -rf /' or format operations are blocked. Risky commands that require
elevated privileges will execute with warnings.

Security note: All commands are validated for injection attempts,
path traversal, and contain resource limits to prevent abuse.
		`.trim()
	}

	/**
	 * Analyze command safety before execution
	 */
	public static analyzeCommand(command: string): {
		safe: boolean
		reason?: string
		level: CommandSafetyLevel
		category: any
		riskFactors: string[]
	} {
		const safetyCheck = CommandClassification.isSafeCommand(command)
		const category = CommandClassification.categorizeCommand(command)

		const riskFactors: string[] = []
		const cmd = command.toLowerCase()

		if (cmd.includes("sudo")) riskFactors.push("requires elevated privileges")
		if (cmd.includes("rm")) riskFactors.push("file deletion operations")
		if (cmd.includes("chmod")) riskFactors.push("permission modifications")
		if (cmd.includes("system32") || cmd.includes("/etc/")) riskFactors.push("system directory access")
		if (cmd.length > 1000) riskFactors.push("long command")
		if (cmd.includes("&&") || cmd.includes("||") || cmd.includes(";")) riskFactors.push("command chaining")

		return {
			...safetyCheck,
			category,
			riskFactors,
		}
	}
}

// Export a singleton factory function
export const createExecuteCommandTool = ExecuteCommandToolWrapper.create
