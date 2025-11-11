import { DynamicStructuredTool } from "@langchain/core/tools"
import { LangGraphToolWrapper, ToolWrapperConfig } from "./base/LangGraphToolWrapper"
import { UseMcpToolSchema, UseMcpToolInput, McpToolRegistry, McpConnectionStatus } from "../schemas/UseMcpToolSchema"
import { Task } from "../../core/task/Task"
import { AskApproval, HandleError, PushToolResult, RemoveClosingTag } from "../../shared/tools"
import { useMcpToolTool } from "../../core/tools/useMcpToolTool"

/**
 * LangChain-compatible wrapper for useMcpToolTool
 */
export class UseMcpToolToolWrapper extends LangGraphToolWrapper {
	constructor(
		cline: Task,
		askApproval: AskApproval,
		handleError: HandleError,
		pushToolResult: PushToolResult,
		removeClosingTag: RemoveClosingTag,
	) {
		const config: ToolWrapperConfig = {
			toolName: "use_mcp_tool",
			description: "Use MCP (Model Context Protocol) tools with comprehensive validation and error handling",
			zodSchema: UseMcpToolSchema,
			legacyToolFunction: useMcpToolTool,
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
		const wrapper = new UseMcpToolToolWrapper(cline, askApproval, handleError, pushToolResult, removeClosingTag)

		return wrapper.createLangChainTool()
	}

	/**
	 * Override executeTool to add custom validation for MCP tool usage
	 */
	protected override async executeTool(params: UseMcpToolInput, context?: any): Promise<string> {
		// Additional custom validations
		if (params.server_name) {
			const serverName = params.server_name as string

			// Check server name format
			const validPattern = /^[a-zA-Z][a-zA-Z0-9_-]*$/
			if (!validPattern.test(serverName)) {
				throw new Error(
					"Server name must start with a letter and contain only letters, numbers, hyphens, and underscores",
				)
			}

			// Check for reserved names
			const reserved = ["system", "admin", "root", "null", "undefined", "true", "false"]
			if (reserved.includes(serverName.toLowerCase())) {
				throw new Error("Server name cannot be a reserved word")
			}

			// Check length
			if (serverName.length > 100) {
				throw new Error("Server name is too long (max 100 characters)")
			}
		}

		if (params.tool_name) {
			const toolName = params.tool_name as string

			// Check tool name format
			const validPattern = /^[a-zA-Z][a-zA-Z0-9_-]*$/
			if (!validPattern.test(toolName)) {
				throw new Error(
					"Tool name must start with a letter and contain only letters, numbers, hyphens, and underscores",
				)
			}

			// Check for reserved names
			const reserved = ["system", "admin", "root", "null", "undefined", "true", "false"]
			if (reserved.includes(toolName.toLowerCase())) {
				throw new Error("Tool name cannot be a reserved word")
			}

			// Check length
			if (toolName.length > 100) {
				throw new Error("Tool name is too long (max 100 characters)")
			}
		}

		if (params.arguments) {
			const argumentsString = params.arguments as string

			// Check for null bytes
			if (argumentsString.includes("\u0000")) {
				throw new Error("Arguments contain invalid null characters")
			}

			// Check size
			if (argumentsString.length > 50_000) {
				throw new Error("Arguments are too large (max 50KB)")
			}

			// Try to validate JSON format (but allow non-JSON)
			try {
				JSON.parse(argumentsString)
			} catch {
				// Not valid JSON, but that's okay - many MCP tools accept non-JSON arguments
				console.warn(`MCP tool arguments are not valid JSON: ${argumentsString.substring(0, 100)}...`)
			}
		}

		// Call parent execute method
		const result = await super.executeTool(params, context)

		// Add MCP-specific metadata to result if needed
		const metadata = McpToolRegistry.generateToolMetadata(params.server_name, params.tool_name, params.arguments)

		// Log the MCP tool usage for monitoring
		console.log(`MCP tool executed:`, metadata)

		return result
	}

	/**
	 * Create tool with custom metadata and MCP-specific features
	 */
	public static createWithMetadata(
		cline: Task,
		askApproval: AskApproval,
		handleError: HandleError,
		pushToolResult: PushToolResult,
		removeClosingTag: RemoveClosingTag,
		metadata?: Record<string, any>,
	): DynamicStructuredTool {
		const wrapper = new UseMcpToolToolWrapper(cline, askApproval, handleError, pushToolResult, removeClosingTag)

		const tool = wrapper.createLangChainTool()

		// Add metadata to the tool
		if (metadata) {
			;(tool as any).metadata = {
				toolType: "mcp_tool",
				category: "external_integration",
				tags: ["mcp", "external", "protocol", "tool"],
				version: "1.0.0",
				protocol: "Model Context Protocol",
				security: {
					serverNameValidation: true,
					toolNameValidation: true,
					argumentsSizeLimit: 50_000,
					reservedNameProtection: true,
				},
				features: {
					jsonArgumentSupport: true,
					serverToolValidation: true,
					toolCategorization: true,
					metadataGeneration: true,
				},
				supportedToolTypes: [
					"file_operations",
					"database",
					"web_api",
					"system",
					"communication",
					"development",
					"monitoring",
					"other",
				],
				connectionStatuses: Object.values(McpConnectionStatus),
				...metadata,
			}
		}

		return tool
	}

	/**
	 * Get tool description with examples and MCP protocol information
	 */
	public static getToolDescription(): string {
		return `
Use MCP (Model Context Protocol) tools to access external services and integrations.

This tool enables interaction with external MCP servers that provide additional
functionality beyond built-in tools. MCP servers can provide access to databases,
web APIs, file systems, communication platforms, and more.

Parameters:
- server_name (required): Name of the MCP server (letters, numbers, hyphens, underscores only)
- tool_name (required): Name of the tool to execute on the server
- arguments (optional): JSON-encoded arguments for the tool (max 50KB)

MCP Protocol features:
- External service integration
- Standardized tool interface
- JSON-based argument passing
- Server discovery and registration
- Connection status monitoring

Server name requirements:
- Must start with a letter
- Can contain letters, numbers, hyphens, and underscores
- Maximum 100 characters
- Cannot be reserved words (system, admin, root, etc.)

Tool name requirements:
- Must start with a letter
- Can contain letters, numbers, hyphens, and underscores
- Maximum 100 characters
- Cannot be reserved words

Tool categories:
- file_operations: File system operations (read, write, delete)
- database: Database queries and operations
- web_api: HTTP requests and web service integration
- system: System administration and monitoring
- communication: Messaging and communication platforms
- development: Development tools and utilities
- monitoring: System monitoring and logging
- other: Miscellaneous tools

Usage examples:
- Use file tool: { "server_name": "fileserver", "tool_name": "read_file", "arguments": "{\\"path\\": \\"/data/config.txt\\"}" }
- Database query: { "server_name": "dbserver", "tool_name": "execute_query", "arguments": "{\\"sql\\": \\"SELECT * FROM users\\"}" }
- API request: { "server_name": "apiserver", "tool_name": "http_get", "arguments": "{\\"url\\": \\"https://api.example.com/data\\"}" }
- No arguments: { "server_name": "timeserver", "tool_name": "get_current_time" }

Error handling:
- Validates server and tool names
- Checks argument format and size
- Provides detailed error messages for debugging
- Maintains connection status monitoring

Security considerations:
- Server name validation prevents injection attacks
- Argument size limits prevent resource exhaustion
- Reserved name protection prevents system conflicts
- Connection status monitoring ensures reliability
		`.trim()
	}

	/**
	 * Validate MCP server and tool combination
	 */
	public static validateServerToolCombination(
		serverName: string,
		toolName: string,
		availableServers: Record<string, string[]> = {},
	): { valid: boolean; reason?: string; suggestions?: string[] } {
		return McpToolRegistry.validateServerTool(serverName, toolName, availableServers)
	}

	/**
	 * Parse and validate MCP tool arguments
	 */
	public static parseToolArguments(argumentsString?: string): {
		valid: boolean
		parsed?: any
		error?: string
	} {
		return McpToolRegistry.parseArguments(argumentsString)
	}

	/**
	 * Get available MCP tools for a server
	 */
	public static getAvailableToolsForServer(
		serverName: string,
		availableServers: Record<string, string[]> = {},
	): string[] {
		return availableServers[serverName] || []
	}

	/**
	 * List all available MCP servers
	 */
	public static listAvailableServers(availableServers: Record<string, string[]> = {}): string[] {
		return Object.keys(availableServers)
	}

	/**
	 * Categorize an MCP tool
	 */
	public static categorizeMcpTool(toolName: string): any {
		return McpToolRegistry.categorizeTool(toolName)
	}
}

// Export a singleton factory function
export const createUseMcpToolTool = UseMcpToolToolWrapper.create
