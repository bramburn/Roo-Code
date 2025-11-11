import { z } from "zod"

/**
 * Zod schema for useMcpTool tool parameters
 */
export const UseMcpToolSchema = z
	.object({
		server_name: z
			.string()
			.min(1, "Server name cannot be empty")
			.max(100, "Server name is too long (max 100 characters)")
			.refine(
				(name) => {
					// Check for valid server name format
					const validPattern = /^[a-zA-Z0-9_-]+$/
					return validPattern.test(name)
				},
				{
					message: "Server name can only contain letters, numbers, hyphens, and underscores",
				},
			),
		tool_name: z
			.string()
			.min(1, "Tool name cannot be empty")
			.max(100, "Tool name is too long (max 100 characters)")
			.refine(
				(name) => {
					// Check for valid tool name format
					const validPattern = /^[a-zA-Z0-9_-]+$/
					return validPattern.test(name)
				},
				{
					message: "Tool name can only contain letters, numbers, hyphens, and underscores",
				},
			),
		arguments: z
			.string()
			.optional()
			.max(50_000, "Arguments are too large (max 50KB)")
			.refine(
				(args) => {
					if (!args) return true
					// Check for null bytes
					return !args.includes("\u0000")
				},
				{
					message: "Arguments contain invalid null characters",
				},
			),
	})
	.describe("Use MCP (Model Context Protocol) tools with validation")

export type UseMcpToolInput = z.infer<typeof UseMcpToolSchema>

/**
 * Server name validation
 */
export const ServerNameValidation = z.object({
	server_name: z
		.string()
		.min(1, "Server name is required")
		.max(100, "Server name is too long (max 100 characters)")
		.refine(
			(name) => {
				// Enhanced validation for server names
				const validPattern = /^[a-zA-Z][a-zA-Z0-9_-]*$/
				return validPattern.test(name)
			},
			{
				message:
					"Server name must start with a letter and contain only letters, numbers, hyphens, and underscores",
			},
		)
		.refine(
			(name) => {
				// Blacklist reserved names
				const reserved = ["system", "admin", "root", "null", "undefined", "true", "false"]
				return !reserved.includes(name.toLowerCase())
			},
			{
				message: "Server name cannot be a reserved word",
			},
		),
})

/**
 * Tool name validation
 */
export const ToolNameValidation = z.object({
	tool_name: z
		.string()
		.min(1, "Tool name is required")
		.max(100, "Tool name is too long (max 100 characters)")
		.refine(
			(name) => {
				// Enhanced validation for tool names
				const validPattern = /^[a-zA-Z][a-zA-Z0-9_-]*$/
				return validPattern.test(name)
			},
			{
				message:
					"Tool name must start with a letter and contain only letters, numbers, hyphens, and underscores",
			},
		)
		.refine(
			(name) => {
				// Blacklist reserved names
				const reserved = ["system", "admin", "root", "null", "undefined", "true", "false"]
				return !reserved.includes(name.toLowerCase())
			},
			{
				message: "Tool name cannot be a reserved word",
			},
		),
})

/**
 * Arguments validation with JSON parsing
 */
export const ArgumentsValidation = z.object({
	arguments: z
		.string()
		.optional()
		.max(50_000, "Arguments are too large (max 50KB)")
		.refine(
			(args) => {
				if (!args) return true
				// Check for null bytes
				return !args.includes("\u0000")
			},
			{
				message: "Arguments contain invalid null characters",
			},
		)
		.refine(
			(args) => {
				if (!args) return true
				// Try to parse as JSON to validate format
				try {
					JSON.parse(args)
					return true
				} catch {
					// If not valid JSON, still allow but warn
					return true
				}
			},
			{
				message: "Arguments should be valid JSON format",
			},
		),
})

/**
 * Combined strict validation schema
 */
export const UseMcpToolStrictSchema = z
	.object({
		server_name: ServerNameValidation.shape.server_name,
		tool_name: ToolNameValidation.shape.tool_name,
		arguments: ArgumentsValidation.shape.arguments,
	})
	.strict() // Only allow defined properties

/**
 * MCP tool types
 */
export enum McpToolType {
	FILE_OPERATIONS = "file_operations",
	DATABASE = "database",
	WEB_API = "web_api",
	SYSTEM = "system",
	COMMUNICATION = "communication",
	DEVELOPMENT = "development",
	MONITORING = "monitoring",
	OTHER = "other",
}

/**
 * MCP connection status
 */
export enum McpConnectionStatus {
	CONNECTED = "connected",
	DISCONNECTED = "disconnected",
	CONNECTING = "connecting",
	ERROR = "error",
	TIMEOUT = "timeout",
}

/**
 * MCP tool execution result
 */
export interface McpToolResult {
	success: boolean
	result?: any
	error?: string
	metadata?: {
		executionTime: number
		serverName: string
		toolName: string
		timestamp: Date
	}
}

/**
 * MCP server information
 */
export interface McpServerInfo {
	name: string
	version?: string
	description?: string
	tools: string[]
	status: McpConnectionStatus
	lastConnected?: Date
	errorCount: number
	metadata?: Record<string, any>
}

/**
 * MCP tool registry helpers
 */
export const McpToolRegistry = {
	/**
	 * Validate server tool combination
	 */
	validateServerTool(
		serverName: string,
		toolName: string,
		availableTools: Record<string, string[]>,
	): {
		valid: boolean
		reason?: string
	} {
		// Check if server exists
		if (!availableTools[serverName]) {
			return { valid: false, reason: `Server '${serverName}' is not available` }
		}

		// Check if tool exists in server
		if (!availableTools[serverName].includes(toolName)) {
			return {
				valid: false,
				reason: `Tool '${toolName}' is not available in server '${serverName}'. Available tools: ${availableTools[serverName].join(", ")}`,
			}
		}

		return { valid: true }
	},

	/**
	 * Parse and validate arguments
	 */
	parseArguments(argumentsString?: string): {
		valid: boolean
		parsed?: any
		error?: string
	} {
		if (!argumentsString) {
			return { valid: true, parsed: {} }
		}

		try {
			const parsed = JSON.parse(argumentsString)
			return { valid: true, parsed }
		} catch (error) {
			return {
				valid: false,
				error: `Invalid JSON arguments: ${error instanceof Error ? error.message : "Unknown error"}`,
			}
		}
	},

	/**
	 * Categorize MCP tool by name pattern
	 */
	categorizeTool(toolName: string): McpToolType {
		const name = toolName.toLowerCase()

		if (name.includes("file") || name.includes("read") || name.includes("write") || name.includes("delete")) {
			return McpToolType.FILE_OPERATIONS
		}

		if (name.includes("db") || name.includes("sql") || name.includes("query") || name.includes("database")) {
			return McpToolType.DATABASE
		}

		if (name.includes("http") || name.includes("api") || name.includes("request") || name.includes("web")) {
			return McpToolType.WEB_API
		}

		if (name.includes("sys") || name.includes("process") || name.includes("service") || name.includes("system")) {
			return McpToolType.SYSTEM
		}

		if (name.includes("mail") || name.includes("slack") || name.includes("discord") || name.includes("message")) {
			return McpToolType.COMMUNICATION
		}

		if (name.includes("git") || name.includes("build") || name.includes("test") || name.includes("deploy")) {
			return McpToolType.DEVELOPMENT
		}

		if (name.includes("monitor") || name.includes("log") || name.includes("metric") || name.includes("health")) {
			return McpToolType.MONITORING
		}

		return McpToolType.OTHER
	},

	/**
	 * Generate tool metadata
	 */
	generateToolMetadata(serverName: string, toolName: string, argumentsString?: string): Record<string, any> {
		return {
			serverName,
			toolName,
			category: this.categorizeTool(toolName),
			hasArguments: !!argumentsString,
			argumentsSize: argumentsString ? argumentsString.length : 0,
			timestamp: new Date().toISOString(),
			version: "1.0.0",
		}
	},
}
