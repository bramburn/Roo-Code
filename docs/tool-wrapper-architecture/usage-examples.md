# Tool Wrapper Usage Examples

## Quick Start

This document provides practical examples of how to use the new LangChain tool wrapper system.

## Basic Usage

### Creating a Tool Wrapper

```typescript
import { WriteToFileToolWrapper } from "../tools/wrappers/WriteToFileToolWrapper"

// Create the wrapper
const writeTool = WriteToFileToolWrapper.create(
	cline, // Task instance
	askApproval, // Approval function
	handleError, // Error handling function
	pushToolResult, // Result callback
	removeClosingTag, // Content processor
)

// Execute the tool
const result = await writeTool.func(
	{
		path: "example.txt",
		content: "Hello, World!",
		line_count: 2,
	},
	context,
)
```

### Using the Registry

```typescript
import { ToolRegistration } from "../tools/registry/ToolRegistration"
import { WriteToFileToolWrapper } from "../tools/wrappers/WriteToFileToolWrapper"

// Create and register a tool
const tool = WriteToFileToolWrapper.create(context)
ToolRegistration.registerFromLangChainTool(tool, "1.0.0", {
	category: "file_operations",
	tags: ["write", "file", "create"],
})

// Get all registered tools
const allTools = ToolRegistration.getLangChainTools()

// Get specific tool
const specificTool = ToolRegistration.get("write_to_file")
```

## Advanced Examples

### Custom Tool Wrapper with Enhanced Validation

```typescript
import { LangGraphToolWrapper, ToolWrapperConfig } from "../tools/wrappers/base/LangGraphToolWrapper"
import { z } from "zod"

// Custom schema with advanced validation
const CustomSchema = z.object({
	filename: z
		.string()
		.min(1, "Filename is required")
		.regex(/^[a-zA-Z0-9_-]+\.txt$/, "Filename must end with .txt")
		.refine((name) => !name.includes("sensitive"), {
			message: "Filename cannot contain 'sensitive'",
		}),
	content: z
		.string()
		.min(10, "Content must be at least 10 characters")
		.max(1000, "Content cannot exceed 1000 characters")
		.refine((content) => !content.includes("password"), {
			message: "Content cannot contain passwords",
		}),
	priority: z.enum(["low", "medium", "high"]).default("medium"),
})

export class EnhancedFileWrapper extends LangGraphToolWrapper {
	constructor(context) {
		const config: ToolWrapperConfig = {
			toolName: "enhanced_file_write",
			description: "Write files with advanced validation and security",
			zodSchema: CustomSchema,
			legacyToolFunction: this.writeEnhancedFile,
		}

		super(context, config)
	}

	public static create(context): DynamicStructuredTool {
		const wrapper = new EnhancedFileWrapper(context)
		return wrapper.createLangChainTool()
	}

	protected override async executeTool(params, context): Promise<string> {
		// Custom validation logic
		this.validateBusinessRules(params)

		// Security check
		this.performSecurityCheck(params)

		// Log usage for audit
		this.logFileOperation(params)

		return super.executeTool(params, context)
	}

	private validateBusinessRules(params): void {
		// Custom business logic
		if (params.filename.includes("config") && params.priority === "low") {
			throw new Error("Config files require medium or high priority")
		}
	}

	private performSecurityCheck(params): void {
		// Security validation
		const securityLevel = this.assessSecurityLevel(params)
		if (securityLevel === "high") {
			console.warn("High security operation detected:", params.filename)
		}
	}

	private logFileOperation(params): void {
		console.log(`File operation: ${params.filename} (${params.priority})`)
	}

	private assessSecurityLevel(params): string {
		// Determine security level based on filename and content
		const highRiskPatterns = ["admin", "config", "system", "password"]
		return highRiskPatterns.some((pattern) => params.filename.includes(pattern)) ? "high" : "low"
	}

	private async writeEnhancedFile(
		cline,
		block,
		askApproval,
		handleError,
		pushToolResult,
		removeClosingTag,
	): Promise<void> {
		// Implementation of the actual file writing logic
		// This would integrate with the existing writeToFileTool
		pushToolResult(`Enhanced file written: ${block.params.filename}`)
	}
}
```

### Tool with Complex Parameter Handling

```typescript
import { z } from "zod"

const ComplexToolSchema = z.object({
	operation: z.enum(["create", "update", "delete", "query"]),
	targets: z.array(z.string()).min(1, "At least one target is required"),
	options: z
		.object({
			recursive: z.boolean().default(false),
			force: z.boolean().default(false),
			backup: z.boolean().default(true),
			timeout: z.number().int().min(1).max(300).default(60),
		})
		.optional(),
	metadata: z.record(z.string(), z.any()).optional(),
})

export class ComplexOperationWrapper extends LangGraphToolWrapper {
	protected override async executeTool(params, context): Promise<string> {
		// Handle complex operation logic
		const results = []

		for (const target of params.targets) {
			const result = await this.executeSingleOperation(target, params)
			results.push(result)
		}

		return JSON.stringify({
			operation: params.operation,
			targets: params.targets,
			results,
			metadata: params.metadata,
		})
	}

	private async executeSingleOperation(target, params): Promise<any> {
		// Execute operation on a single target
		switch (params.operation) {
			case "create":
				return this.createTarget(target, params.options)
			case "update":
				return this.updateTarget(target, params.options)
			case "delete":
				return this.deleteTarget(target, params.options)
			case "query":
				return this.queryTarget(target, params.options)
			default:
				throw new Error(`Unsupported operation: ${params.operation}`)
		}
	}

	private async createTarget(target, options): Promise<any> {
		// Implementation for creating target
		return { target, status: "created", options }
	}

	private async updateTarget(target, options): Promise<any> {
		// Implementation for updating target
		return { target, status: "updated", options }
	}

	private async deleteTarget(target, options): Promise<any> {
		// Implementation for deleting target
		return { target, status: "deleted", options }
	}

	private async queryTarget(target, options): Promise<any> {
		// Implementation for querying target
		return { target, status: "queried", options }
	}
}
```

### MCP Tool Integration

```typescript
import { UseMcpToolToolWrapper } from "../tools/wrappers/UseMcpToolToolWrapper"

// Create MCP tool wrapper
const mcpTool = UseMcpToolToolWrapper.create(context)

// Execute MCP tool with complex arguments
const mcpResult = await mcpTool.func(
	{
		server_name: "database_server",
		tool_name: "execute_query",
		arguments: JSON.stringify({
			query: "SELECT * FROM users WHERE active = true",
			database: "production",
			limit: 100,
			format: "json",
		}),
	},
	context,
)

// Use the utility methods
const availableServers = UseMcpToolToolWrapper.listAvailableServers({
	database_server: ["execute_query", "backup_database", "restore_database"],
	file_server: ["read_file", "write_file", "list_files"],
	notification_server: ["send_email", "send_slack", "send_discord"],
})

const serverValidation = UseMcpToolToolWrapper.validateServerToolCombination("database_server", "execute_query", {
	database_server: ["execute_query", "backup_database", "restore_database"],
	file_server: ["read_file", "write_file", "list_files"],
	notification_server: ["send_email", "send_slack", "send_discord"],
})
```

## Configuration Examples

### Custom Configuration

```typescript
import { TransitionalConfigManager } from "../transitional/TransitionalConfig"

// Create custom configuration
const config = new TransitionalConfigManager()

// Update configuration
config.updateConfig({
	enabled: true,
	loggingEnabled: true,
	maxConcurrentTools: 3,
	defaultTimeout: 60000,
	enablePerformanceMonitoring: true,
	allowedTools: ["write_to_file", "read_file", "execute_command"],
	blockedTools: ["dangerous_tool"],
	customWrappers: {
		custom_tool: "CustomToolWrapper",
	},
})

// Update feature flags
config.updateFeatureFlags({
	ENABLE_LANGGRAPH_TOOLS: true,
	ENABLE_LEGACY_COMPATIBILITY: true,
	ENABLE_PERFORMANCE_MONITORING: true,
	ENABLE_TOOL_CACHING: false,
	ENABLE_SECURITY_VALIDATION: true,
})

// Get configuration summary
const summary = config.getSummary()
console.log("Configuration Summary:", summary)
```

### Environment-based Configuration

```bash
# .env file
TRANSITIONAL_ENABLED=true
TRANSITIONAL_LOGGING=true
TRANSITIONAL_TIMEOUT=60000
TRANSITIONAL_MAX_CONCURRENT=5

ENABLE_LANGGRAPH_TOOLS=true
ENABLE_LEGACY_COMPATIBILITY=true

# Tool-specific settings
ALLOWED_TOOLS=write_to_file,read_file,execute_command
BLOCKED_TOOLS=rm_rf,format_disk
```

```typescript
// Access environment variables in code
const config = {
	enabled: process.env.TRANSITIONAL_ENABLED === "true",
	timeout: parseInt(process.env.TRANSITIONAL_TIMEOUT || "30000"),
	maxConcurrent: parseInt(process.env.TRANSITIONAL_MAX_CONCURRENT || "5"),
	allowedTools: process.env.ALLOWED_TOOLS?.split(",") || [],
	blockedTools: process.env.BLOCKED_TOOLS?.split(",") || [],
}
```

## Error Handling Examples

### Custom Error Handling

```typescript
export class RobustToolWrapper extends LangGraphToolWrapper {
	protected override async executeTool(params, context): Promise<string> {
		try {
			// Pre-execution validation
			this.validatePreConditions(params)

			// Execute with timeout
			const result = await this.executeWithTimeout(params, context.timeout)

			// Post-execution validation
			this.validateResults(result)

			return result
		} catch (error) {
			// Custom error handling
			const enhancedError = this.enhanceError(error, params)
			await this.reportError(enhancedError)
			throw enhancedError
		}
	}

	private validatePreConditions(params): void {
		// Custom pre-execution validation
		if (params.requiresAuthentication && !this.isAuthenticated()) {
			throw new Error("Authentication required for this operation")
		}
	}

	private async executeWithTimeout(params, timeout): Promise<string> {
		// Execute with timeout handling
		const timeoutPromise = new Promise((_, reject) => {
			setTimeout(() => reject(new Error("Operation timed out")), timeout)
		})

		const operationPromise = super.executeTool(params, context)

		return Promise.race([operationPromise, timeoutPromise])
	}

	private validateResults(result): void {
		// Validate execution results
		if (!result || result.trim().length === 0) {
			throw new Error("Operation returned empty result")
		}
	}

	private enhanceError(error, params): Error {
		// Enhance error with context
		const enhanced = new Error(`${error.message} (Context: ${JSON.stringify(params)})`)
		enhanced.name = error.name
		enhanced.stack = error.stack
		return enhanced
	}

	private async reportError(error): Promise<void> {
		// Report error to monitoring system
		console.error("Tool execution error:", {
			error: error.message,
			stack: error.stack,
			timestamp: new Date().toISOString(),
		})
	}

	private isAuthenticated(): boolean {
		// Check authentication status
		return true // Implementation depends on your auth system
	}
}
```

### Retry Logic

```typescript
export class ResilientToolWrapper extends LangGraphToolWrapper {
	private maxRetries = 3
	private retryDelay = 1000

	protected override async executeTool(params, context): Promise<string> {
		let lastError: Error

		for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
			try {
				const result = await super.executeTool(params, context)

				// Log successful retry
				if (attempt > 1) {
					console.log(`Operation succeeded on attempt ${attempt}`)
				}

				return result
			} catch (error) {
				lastError = error as Error

				// Don't retry on certain errors
				if (this.isNonRetryableError(error)) {
					throw error
				}

				// Log retry attempt
				console.warn(`Attempt ${attempt} failed, retrying...`, error.message)

				// Wait before retry
				if (attempt < this.maxRetries) {
					await this.delay(this.retryDelay * attempt)
				}
			}
		}

		// All retries failed
		throw new Error(`Operation failed after ${this.maxRetries} attempts: ${lastError.message}`)
	}

	private isNonRetryableError(error: Error): boolean {
		// Don't retry on authentication or permission errors
		const nonRetryablePatterns = [/authentication/i, /permission/i, /access denied/i, /unauthorized/i]

		return nonRetryablePatterns.some((pattern) => pattern.test(error.message))
	}

	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms))
	}
}
```

## Performance Monitoring

### Tool Performance Metrics

```typescript
import { globalTransitionalExecutor } from "../transitional/TransitionalExecutor"

// Get performance statistics
const stats = globalTransitionalExecutor.getExecutionStats()

console.log("Performance Statistics:")
console.log(`Total executions: ${stats.totalExecutions}`)
console.log(`Success rate: ${((stats.successfulExecutions / stats.totalExecutions) * 100).toFixed(2)}%`)
console.log(`Average execution time: ${stats.averageExecutionTime.toFixed(2)}ms`)
console.log(`Most used tool: ${stats.mostUsedTool}`)

// Get per-tool statistics
console.log("\nPer-Tool Statistics:")
Object.entries(stats.toolUsageStats).forEach(([toolName, stats]) => {
	console.log(`${toolName}:`)
	console.log(`  Executions: ${stats.count}`)
	console.log(`  Success rate: ${stats.successRate.toFixed(2)}%`)
	console.log(`  Avg time: ${stats.avgTime.toFixed(2)}ms`)
})
```

### Custom Performance Monitoring

```typescript
export class MonitoredToolWrapper extends LangGraphToolWrapper {
	private performanceMetrics = new Map()

	protected override async executeTool(params, context): Promise<string> {
		const startTime = Date.now()
		const toolName = this.config.toolName

		try {
			const result = await super.executeTool(params, context)

			// Record successful execution
			this.recordMetric(toolName, Date.now() - startTime, true)

			return result
		} catch (error) {
			// Record failed execution
			this.recordMetric(toolName, Date.now() - startTime, false)

			throw error
		}
	}

	private recordMetric(toolName: string, executionTime: number, success: boolean): void {
		if (!this.performanceMetrics.has(toolName)) {
			this.performanceMetrics.set(toolName, {
				totalExecutions: 0,
				totalExecutionTime: 0,
				successfulExecutions: 0,
				failedExecutions: 0,
				minExecutionTime: Infinity,
				maxExecutionTime: 0,
			})
		}

		const metrics = this.performanceMetrics.get(toolName)!
		metrics.totalExecutions++
		metrics.totalExecutionTime += executionTime
		metrics.minExecutionTime = Math.min(metrics.minExecutionTime, executionTime)
		metrics.maxExecutionTime = Math.max(metrics.maxExecutionTime, executionTime)

		if (success) {
			metrics.successfulExecutions++
		} else {
			metrics.failedExecutions++
		}
	}

	public getPerformanceReport(toolName?: string): any {
		if (toolName) {
			return this.performanceMetrics.get(toolName)
		}

		const report: any = {}
		for (const [name, metrics] of this.performanceMetrics.entries()) {
			report[name] = {
				averageExecutionTime: metrics.totalExecutionTime / metrics.totalExecutions,
				successRate: (metrics.successfulExecutions / metrics.totalExecutions) * 100,
				minExecutionTime: metrics.minExecutionTime,
				maxExecutionTime: metrics.maxExecutionTime,
				totalExecutions: metrics.totalExecutions,
			}
		}

		return report
	}
}
```

## Testing Examples

### Unit Testing with Mocks

```typescript
import { describe, test, expect, vi, beforeEach } from "vitest"
import { WriteToFileToolWrapper } from "../tools/wrappers/WriteToFileToolWrapper"

describe("WriteToFileToolWrapper Integration Tests", () => {
	let mockContext
	let mockWriteToFileTool

	beforeEach(() => {
		mockContext = {
			cline: {
				rooIgnoreController: { validateAccess: vi.fn().mockReturnValue(true) },
				recordToolError: vi.fn(),
				sayAndCreateMissingParamError: vi.fn(),
			},
			askApproval: vi.fn().mockResolvedValue(true),
			handleError: vi.fn(),
			pushToolResult: vi.fn(),
			removeClosingTag: vi.fn((tag, content) => content),
		}

		// Mock the legacy tool
		mockWriteToFileTool = vi.fn().mockImplementation(async () => {
			mockContext.pushToolResult("File written successfully")
		})

		vi.mock("../../core/tools/writeToFileTool", () => ({
			writeToFileTool: mockWriteToFileTool,
		}))
	})

	test("should handle successful file write", async () => {
		const tool = WriteToFileToolWrapper.create(
			mockContext.cline,
			mockContext.askApproval,
			mockContext.handleError,
			mockContext.pushToolResult,
			mockContext.removeClosingTag,
		)

		const result = await tool.func(
			{
				path: "test.txt",
				content: "Hello, World!",
			},
			{} as any,
		)

		expect(result).toBe("File written successfully")
		expect(mockWriteToFileTool).toHaveBeenCalled()
		expect(mockContext.askApproval).toHaveBeenCalled()
	})

	test("should handle approval denial", async () => {
		mockContext.askApproval.mockResolvedValue(false)

		const tool = WriteToFileToolWrapper.create(
			mockContext.cline,
			mockContext.askApproval,
			mockContext.handleError,
			mockContext.pushToolResult,
			mockContext.removeClosingTag,
		)

		await expect(tool.func({ path: "test.txt", content: "Hello" }, {} as any)).rejects.toThrow()
	})
})
```

### Integration Testing

```typescript
import { describe, test, expect, beforeAll, afterAll } from "vitest"
import { globalTransitionalExecutor } from "../transitional/TransitionalExecutor"
import { WriteToFileToolWrapper } from "../tools/wrappers/WriteToFileToolWrapper"

describe("End-to-End Tool Execution", () => {
	beforeAll(() => {
		// Register tools
		const writeTool = WriteToFileToolWrapper.create(mockContext)
		globalTransitionalExecutor.getToolRegistry().register({
			tool: writeTool,
			name: "write_to_file",
			description: "Write content to a file",
			schema: writeTool.schema,
			version: "1.0.0",
		})
	})

	test("should execute complete workflow", async () => {
		const aiMessage = {
			content: "I'll write a file",
			tool_calls: [
				{
					name: "write_to_file",
					args: { path: "example.txt", content: "Hello, World!" },
					id: "call_1",
				},
			],
		}

		const results = await globalTransitionalExecutor.executeToolCalls(aiMessage, mockContext)

		expect(results).toHaveLength(1)
		expect(results[0].success).toBe(true)
		expect(results[0].toolName).toBe("write_to_file")
	})
})
```

These examples demonstrate practical usage patterns for the new tool wrapper system, including basic operations, advanced features, error handling, performance monitoring, and testing approaches.
