# Context for Task 2.4: Create LangChain-compatible wrapper for useMcpToolTool with Zod schema validation

- **Status**: To Do
- **Source PRD**: PRDs/04-tool-standardization-testing/tasklists/tasklist_sprint_02.md
- **Target Files**:
    - `src/tools/wrappers/UseMcpToolToolWrapper.ts`
    - `src/tools/schemas/UseMcpToolSchema.ts`
    - `src/tools/validation/McpValidation.ts`
- **Generated**: 2025-11-11T20:30:00.000Z
- **Last Updated**: 2025-11-11T20:30:00.000Z

---

## 1. Current Code Analysis (Internal)

### File: `src/core/tools/useMcpToolTool.ts`

**Current Implementation**:

```typescript
export async function useMcpToolTool(
	cline: Task,
	block: ToolUse,
	askApproval: AskApproval,
	handleError: HandleError,
	pushToolResult: PushToolResult,
	removeClosingTag: RemoveClosingTag,
): Promise<void>
```

**Key Parameter Extraction Patterns (lines 289-339)**:

```typescript
const validation = validateToolCall(block.params)
if (!validation.isValid) {
	await handleError("using tool", validation.error)
	return
}

const { serverName, toolName, parsedArguments } = validation

const server = mcpHub.getServer(serverName)
if (!server) {
	await handleError("using tool", `Server ${serverName} not found`)
	return
}

const tool = server.tools.find((tool) => tool.name === toolName)
if (!tool) {
	await handleError("using tool", `Tool ${toolName} not found in server ${serverName}`)
	return
}
```

**Core Logic Flow**:

1. Parameter validation and extraction
2. MCP server lookup and validation
3. Tool discovery within server
4. Argument validation against tool schema
5. Tool execution with proper error handling
6. Result formatting and delivery

**Error Handling Patterns**:

- Uses `validateToolCall()` for parameter validation
- Uses `handleError("using tool", error)` for consistent error reporting
- Uses `pushToolResult()` for response delivery
- Comprehensive MCP server and tool validation

**MCP Integration Patterns**:

```typescript
// From src/services/mcp/McpHub.ts (lines 100-150)
export class McpHub {
	private servers: Map<string, McpServer> = new Map()

	getServer(name: string): McpServer | undefined {
		return this.servers.get(name)
	}

	async callTool(serverName: string, toolName: string, arguments: any): Promise<any> {
		const server = this.getServer(serverName)
		if (!server) {
			throw new Error(`Server ${serverName} not found`)
		}

		return await server.callTool(toolName, arguments)
	}
}
```

---

## 2. LangChain Integration Requirements

### LangChain StructuredTool Interface Pattern

Based on external research and existing patterns:

```typescript
import { DynamicStructuredTool } from "@langchain/core/tools"
import { z } from "zod"

export const useMcpToolLangChainTool = new DynamicStructuredTool({
	name: "use_mcp_tool",
	description: "Execute a tool from a Model Context Protocol (MCP) server",
	schema: z.object({
		server_name: z.string().min(1, "Server name is required"),
		tool_name: z.string().min(1, "Tool name is required"),
		arguments: z.record(z.unknown()).optional(),
	}),
	func: async ({ server_name, tool_name, arguments }, context) => {
		// Implementation logic here
	},
})
```

### Key Integration Points

1. **Schema Validation**: Replace manual validation with Zod schema
2. **MCP Integration**: Maintain existing MCP server and tool discovery
3. **Error Handling**: Preserve existing `handleError` and `pushToolResult` patterns
4. **Context Preservation**: Maintain `cline` Task context and MCP hub integration
5. **Argument Validation**: Leverage existing MCP tool schema validation

---

## 3. Implementation Strategy

### Phase 1: Schema Definition

**File**: `src/tools/schemas/UseMcpToolSchema.ts`

```typescript
import { z } from "zod"

export const UseMcpToolSchema = z.object({
	server_name: z.string().min(1, "MCP server name is required"),
	tool_name: z.string().min(1, "MCP tool name is required"),
	arguments: z.record(z.unknown()).optional().default({}),
})

export type UseMcpToolInput = z.infer<typeof UseMcpToolSchema>

// Additional validation for MCP-specific requirements
export const McpServerValidationSchema = z.object({
	name: z.string().min(1),
	tools: z.array(
		z.object({
			name: z.string(),
			schema: z.any(),
		}),
	),
})

export const McpToolValidationSchema = z.object({
	name: z.string().min(1),
	inputSchema: z.any(),
})
```

### Phase 2: MCP Validation Utilities

**File**: `src/tools/validation/McpValidation.ts`

```typescript
import { z } from "zod"
import { UseMcpToolInput } from "../schemas/UseMcpToolSchema"
import { McpHub } from "../../../services/mcp/McpHub"

export class McpValidation {
	static validateToolCall(params: unknown): ValidationResult {
		const result = UseMcpToolSchema.safeParse(params)

		if (!result.success) {
			return {
				isValid: false,
				error: this.formatZodError(result.error),
			}
		}

		return {
			isValid: true,
			serverName: result.data.server_name,
			toolName: result.data.tool_name,
			parsedArguments: result.data.arguments,
		}
	}

	static validateServerExists(serverName: string, mcpHub: McpHub): boolean {
		return !!mcpHub.getServer(serverName)
	}

	static validateToolExists(serverName: string, toolName: string, mcpHub: McpHub): boolean {
		const server = mcpHub.getServer(serverName)
		if (!server) return false

		return !!server.tools.find((tool) => tool.name === toolName)
	}

	static validateToolArguments(toolName: string, arguments: any, server: any): ValidationResult {
		const tool = server.tools.find((tool) => tool.name === toolName)
		if (!tool) {
			return {
				isValid: false,
				error: `Tool ${toolName} not found`,
			}
		}

		// Use existing MCP tool schema validation
		try {
			// This would use the MCP tool's schema validation
			if (tool.inputSchema) {
				// Validate against tool's input schema
				this.validateAgainstSchema(arguments, tool.inputSchema)
			}

			return { isValid: true }
		} catch (error) {
			return {
				isValid: false,
				error: `Invalid arguments for tool ${toolName}: ${error.message}`,
			}
		}
	}

	private static validateAgainstSchema(value: any, schema: any): void {
		// Implement JSON Schema validation
		// This could use a library like ajv for comprehensive validation
		if (!schema) return // No schema to validate against

		// Basic validation logic - could be enhanced with a proper JSON schema validator
		if (schema.type === "object" && typeof value !== "object") {
			throw new Error("Expected object value")
		}

		if (schema.required && Array.isArray(schema.required)) {
			for (const requiredProp of schema.required) {
				if (!(requiredProp in value)) {
					throw new Error(`Missing required property: ${requiredProp}`)
				}
			}
		}
	}

	private static formatZodError(error: z.ZodError): string {
		return error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join(", ")
	}
}

interface ValidationResult {
	isValid: boolean
	error?: string
	serverName?: string
	toolName?: string
	parsedArguments?: any
}
```

### Phase 3: UseMcpTool Wrapper

**File**: `src/tools/wrappers/UseMcpToolToolWrapper.ts`

```typescript
import { DynamicStructuredTool } from "@langchain/core/tools"
import { UseMcpToolSchema, UseMcpToolInput } from "../schemas/UseMcpToolSchema"
import { LangGraphToolWrapper } from "./base/LangGraphToolWrapper"
import { McpValidation } from "../validation/McpValidation"
import { useMcpToolTool } from "../../../core/tools/useMcpToolTool"

export class UseMcpToolToolWrapper extends LangGraphToolWrapper {
	private mcpHub: any // McpHub type

	constructor(
		cline: Task,
		askApproval: AskApproval,
		handleError: HandleError,
		pushToolResult: PushToolResult,
		removeClosingTag: RemoveClosingTag,
		mcpHub: any, // McpHub instance
	) {
		super(cline, askApproval, handleError, pushToolResult, removeClosingTag)
		this.mcpHub = mcpHub
	}

	public static create(mcpHub: any) {
		return new DynamicStructuredTool({
			name: "use_mcp_tool",
			description: "Execute a tool from a Model Context Protocol (MCP) server with proper validation",
			schema: UseMcpToolSchema,
			func: async (params: UseMcpToolInput, context) => {
				// Create wrapper instance with proper context
				const wrapper = new UseMcpToolToolWrapper(
					context.cline as any,
					context.askApproval as any,
					context.handleError as any,
					context.pushToolResult as any,
					context.removeClosingTag as any,
					mcpHub,
				)

				return await wrapper.executeTool(params)
			},
		})
	}

	protected async executeTool(params: UseMcpToolInput): Promise<string> {
		try {
			// Validate basic parameters
			const paramValidation = McpValidation.validateToolCall(params)
			if (!paramValidation.isValid) {
				throw new Error(paramValidation.error!)
			}

			// Validate server exists
			if (!McpValidation.validateServerExists(paramValidation.serverName!, this.mcpHub)) {
				throw new Error(`MCP server '${paramValidation.serverName}' not found`)
			}

			// Validate tool exists in server
			if (
				!McpValidation.validateToolExists(paramValidation.serverName!, paramValidation.toolName!, this.mcpHub)
			) {
				throw new Error(
					`Tool '${paramValidation.toolName}' not found in server '${paramValidation.serverName}'`,
				)
			}

			// Get server for argument validation
			const server = this.mcpHub.getServer(paramValidation.serverName!)
			if (!server) {
				throw new Error(`Server '${paramValidation.serverName}' not available`)
			}

			// Validate arguments against tool schema
			const argValidation = McpValidation.validateToolArguments(
				paramValidation.toolName!,
				paramValidation.parsedArguments!,
				server,
			)
			if (!argValidation.isValid) {
				throw new Error(argValidation.error!)
			}

			// Convert to existing ToolUse format
			const block: ToolUse = {
				type: "tool_use",
				name: "use_mcp_tool",
				params: {
					server_name: paramValidation.serverName,
					tool_name: paramValidation.toolName,
					arguments: paramValidation.parsedArguments,
				},
				partial: false,
			}

			// Create promise to capture result
			let result: string = ""

			// Execute existing tool logic
			await useMcpToolTool(
				this.cline,
				block,
				this.askApproval,
				this.handleError,
				(pushResult: string) => {
					result = pushResult
				},
				this.removeClosingTag,
			)

			return result
		} catch (error) {
			// Use existing error handling
			this.handleError("using MCP tool", error)
			throw error
		}
	}
}

// Factory function for easier registration
export function createUseMcpToolWrapper(mcpHub: any) {
	return UseMcpToolToolWrapper.create(mcpHub)
}

// Export the LangChain tool instance
export const useMcpToolLangChainTool = (mcpHub: any) => createUseMcpToolWrapper(mcpHub)
```

---

## 4. Dependencies Analysis

### Prerequisites from Task 1.1-1.4, 2.1-2.3

Based on tasklist analysis, following must be completed first:

1. **Task 1.1**: LangChain/LangGraph dependencies installed

    - `@langchain/core ^0.1.0`
    - `@langchain/langgraph ^0.0.1`

2. **Task 1.2**: LangGraph tool wrapper base class created

    - `src/tools/base/LangGraphToolWrapper.ts`
    - Interface compliance with LangChain StructuredTool

3. **Task 1.3**: Zod schema validation system implemented

    - `src/tools/validation/ZodSchemaValidator.ts`
    - `src/tools/types/ValidationTypes.ts`

4. **Task 1.4**: Transitional execution layer implemented

    - `src/transitional/TransitionalExecutor.ts`
    - Integration with existing task loop

5. **Task 2.1-2.3**: Other tool wrappers implemented
    - WriteToFile, ReadFile, ExecuteCommand wrappers
    - Established patterns for MCP integration

### Current Dependencies

From `src/core/tools/useMcpToolTool.ts` analysis:

```typescript
// Core dependencies already available
import { Task } from "../task/Task"
import { ToolUse, AskApproval, HandleError, PushToolResult, RemoveClosingTag } from "../../shared/tools"
import { McpHub } from "../../services/mcp/McpHub"

// MCP validation patterns
import { validateToolCall } from "./validateToolCall"
```

### MCP Integration Dependencies

From `src/services/mcp/McpHub.ts`:

```typescript
// MCP server management
export class McpHub {
	private servers: Map<string, McpServer> = new Map()

	getServer(name: string): McpServer | undefined
	async callTool(serverName: string, toolName: string, arguments: any): Promise<any>
	// ... other MCP methods
}
```

---

## 5. Testing Strategy

### Unit Test Structure

**File**: `src/tests/tools/wrappers/UseMcpToolToolWrapper.test.ts`

```typescript
import { describe, test, expect, vi, beforeEach } from "vitest"
import { UseMcpToolToolWrapper } from "../../../tools/wrappers/UseMcpToolToolWrapper"
import { Task } from "../../../core/task/Task"
import { McpHub } from "../../../services/mcp/McpHub"

describe("UseMcpToolToolWrapper", () => {
	let mockTask: Task
	let mockAskApproval: any
	let mockHandleError: any
	let mockPushToolResult: any
	let mockRemoveClosingTag: any
	let mockMcpHub: McpHub
	let mockServer: any

	beforeEach(() => {
		mockTask = {} as Task
		mockAskApproval = vi.fn()
		mockHandleError = vi.fn()
		mockPushToolResult = vi.fn()
		mockRemoveClosingTag = vi.fn()

		// Mock MCP hub and server
		mockServer = {
			name: "test-server",
			tools: [
				{
					name: "test-tool",
					inputSchema: {
						type: "object",
						properties: {
							message: { type: "string" },
						},
						required: ["message"],
					},
				},
			],
		}

		mockMcpHub = {
			getServer: vi.fn(),
			callTool: vi.fn(),
		} as any
		mockMcpHub.getServer.mockReturnValue(mockServer)
	})

	test("should create valid LangChain tool", () => {
		const tool = UseMcpToolToolWrapper.create(mockMcpHub)

		expect(tool.name).toBe("use_mcp_tool")
		expect(tool.description).toContain("Execute a tool from a Model Context Protocol (MCP)")
		expect(tool.schema).toBeDefined()
	})

	test("should validate schema correctly", async () => {
		const tool = UseMcpToolToolWrapper.create(mockMcpHub)

		// Test valid input
		const validInput = {
			server_name: "test-server",
			tool_name: "test-tool",
			arguments: { message: "test message" },
		}

		const result = await tool.func(validInput, {
			cline: mockTask,
			askApproval: mockAskApproval,
			handleError: mockHandleError,
			pushToolResult: mockPushToolResult,
			removeClosingTag: mockRemoveClosingTag,
		})

		expect(result).toBeDefined()
	})

	test("should handle missing server error", async () => {
		const tool = UseMcpToolToolWrapper.create(mockMcpHub)

		// Mock server not found
		mockMcpHub.getServer.mockReturnValue(undefined)

		const invalidInput = {
			server_name: "nonexistent-server",
			tool_name: "test-tool",
			arguments: {},
		}

		await expect(
			tool.func(invalidInput, {
				cline: mockTask,
				askApproval: mockAskApproval,
				handleError: mockHandleError,
				pushToolResult: mockPushToolResult,
				removeClosingTag: mockRemoveClosingTag,
			}),
		).rejects.toThrow("MCP server 'nonexistent-server' not found")
	})

	test("should handle missing tool error", async () => {
		const tool = UseMcpToolToolWrapper.create(mockMcpHub)

		// Mock server exists but tool doesn't
		mockMcpHub.getServer.mockReturnValue({
			name: "test-server",
			tools: [], // No tools
		})

		const invalidInput = {
			server_name: "test-server",
			tool_name: "nonexistent-tool",
			arguments: {},
		}

		await expect(
			tool.func(invalidInput, {
				cline: mockTask,
				askApproval: mockAskApproval,
				handleError: mockHandleError,
				pushToolResult: mockPushToolResult,
				removeClosingTag: mockRemoveClosingTag,
			}),
		).rejects.toThrow("Tool 'nonexistent-tool' not found in server 'test-server'")
	})

	test("should validate tool arguments", async () => {
		const tool = UseMcpToolToolWrapper.create(mockMcpHub)

		const invalidInput = {
			server_name: "test-server",
			tool_name: "test-tool",
			arguments: {}, // Missing required 'message' argument
		}

		await expect(
			tool.func(invalidInput, {
				cline: mockTask,
				askApproval: mockAskApproval,
				handleError: mockHandleError,
				pushToolResult: mockPushToolResult,
				removeClosingTag: mockRemoveClosingTag,
			}),
		).rejects.toThrow("Missing required property: message")
	})
})
```

### Integration Testing

- Test with actual MCP server connections
- Verify tool discovery and execution
- Test error handling with real MCP errors
- Validate performance with multiple MCP calls

---

## 6. Migration Considerations

### Backward Compatibility

1. **Parameter Mapping**: Ensure seamless conversion between LangChain and existing ToolUse formats
2. **MCP Integration**: Preserve existing MCP server and tool discovery patterns
3. **Error Handling**: Maintain existing error messages and recovery patterns
4. **Argument Validation**: Keep existing MCP tool schema validation logic

### Performance Impact

- Minimal overhead expected from schema validation
- Reuse of existing MCP tool execution logic
- Additional abstraction layer should be <5% performance impact

### Security Considerations

- Maintain existing MCP server access controls
- Preserve argument validation against tool schemas
- Keep existing error sanitization
- Ensure proper MCP server authentication

---

## 7. Implementation Checklist

### Pre-Implementation

- [ ] Verify LangChain dependencies installed from Task 1.1
- [ ] Confirm base wrapper class exists from Task 1.2
- [ ] Ensure Zod validation system ready from Task 1.3
- [ ] Check MCP hub integration patterns
- [ ] Review existing useMcpToolTool implementation

### Implementation Steps

1. [ ] Create UseMcpToolSchema with Zod validation
2. [ ] Implement McpValidation utilities
3. [ ] Create UseMcpToolToolWrapper extending base class
4. [ ] Create LangChain DynamicStructuredTool instance
5. [ ] Add parameter mapping between LangChain and ToolUse formats
6. [ ] Integrate with existing MCP tool execution logic
7. [ ] Preserve error handling and MCP validation patterns
8. [ ] Add comprehensive unit tests
9. [ ] Create integration tests with MCP servers

### Post-Implementation

- [ ] Run TypeScript compilation: `cd src && npm run check-types`
- [ ] Execute unit tests: `cd src && npx vitest run tools/wrappers/UseMcpToolToolWrapper.test.ts`
- [ ] Verify MCP server integration
- [ ] Test backward compatibility with existing tools
- [ ] Performance benchmarking against original implementation

---

## 8. Risk Mitigation

### Technical Risks

1. **MCP Schema Validation**: Complex MCP tool schemas may be difficult to validate

    - **Mitigation**: Leverage existing MCP validation logic, gradual schema support
    - **Fallback**: Graceful degradation for unsupported schema types

2. **Parameter Mapping**: Type conversion between formats may cause data loss

    - **Mitigation**: Careful type preservation and validation
    - **Testing**: Extensive edge case testing with various MCP tools

3. **Performance Regression**: Additional abstraction layer may slow execution
    - **Mitigation**: Performance monitoring and optimization
    - **Benchmark**: Baseline measurement against current implementation

### Integration Risks

1. **MCP Server Compatibility**: New wrapper may break existing MCP integrations

    - **Mitigation**: Preserve existing MCP hub interface exactly
    - **Testing**: Comprehensive testing with various MCP servers

2. **Tool Discovery**: Dynamic tool discovery may be affected
    - **Mitigation**: Maintain existing discovery patterns
    - **Validation**: Test with multiple MCP servers and tools

---

## 9. Success Criteria

### Functional Requirements

- [ ] LangChain StructuredTool interface compliance
- [ ] Zod schema validation for all parameters
- [ ] Backward compatibility with existing useMcpToolTool
- [ ] Preservation of MCP server and tool discovery
- [ ] Maintenance of existing MCP validation logic
- [ ] Error handling preservation with MCP-specific errors

### Quality Requirements

- [ ] Unit test coverage >90%
- [ ] Integration test coverage >80%
- [ ] Performance overhead <5%
- [ ] TypeScript strict mode compliance
- [ ] No breaking changes to existing MCP functionality

### Documentation Requirements

- [ ] Inline code documentation for all public methods
- [ ] Schema validation documentation
- [ ] MCP integration examples
- [ ] Migration guide for existing MCP tool usage

---

## 10. External References

### LangChain Documentation

- [StructuredTool Interface](https://api.js.langchain.com/classes/_langchain_core.tools.StructuredTool.html)
- [DynamicStructuredTool](https://api.js.langchain.com/classes/_langchain_core.tools.DynamicStructuredTool.html)
- [Schema Validation with Zod](https://js.langchain.com/docs/modules/core_schema)

### MCP Integration Examples

- [MCP Protocol Specification](https://modelcontextprotocol.io/docs): Official MCP documentation
- [MCP Server Examples](https://github.com/modelcontextprotocol/servers): Example MCP servers
- [MCP Tool Integration](https://github.com/modelcontextprotocol/inspector): MCP tool inspection tools

### Best Practices

- [TypeScript Strict Mode](https://www.typescriptlang.org/docs/handbook/compiler-options.html)
- [Zod Validation Patterns](https://zod.dev/)
- [Testing with Vitest](https://vitest.dev/)
- [MCP Security Guidelines](https://modelcontextprotocol.io/docs/concepts/security): MCP security best practices

---

**Note**: This context provides comprehensive implementation guidance based on analysis of existing MCP integration patterns, external best practices, and established architectural patterns. All implementation steps should follow existing codebase conventions and maintain full MCP compatibility.
