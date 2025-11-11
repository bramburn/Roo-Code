# Sprint 1: Core Tool Wrapper Development (2 weeks)

| Task ID | Status  | Task Description                                                                                                                 | File(s) To Modify                                                         |
| ------- | ------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| 1.1     | ☐ To Do | Create LangChain Tool Wrapper Base Class - Create base class for all LangChain tool wrappers with abstract interface             | `src/core/tools/base/LangChainToolWrapper.ts`                             |
| 1.2     | ☐ To Do | Implement write_to_file LangChain Wrapper - Convert write_to_file tool to LangChain StructuredTool with Zod validation           | `src/core/tools/writeToFileLangChainTool.ts`                              |
| 1.3     | ☐ To Do | Implement read_file LangChain Wrapper - Convert read_file tool to LangChain StructuredTool with multi-file support               | `src/core/tools/readFileLangChainTool.ts`                                 |
| 1.4     | ☐ To Do | Implement execute_command LangChain Wrapper - Convert execute_command tool to LangChain StructuredTool with terminal integration | `src/core/tools/executeCommandLangChainTool.ts`                           |
| 2.1     | ☐ To Do | Create MCP Tool Integration Base - Create base class for MCP tool integration with dynamic server support                        | `src/core/tools/base/McpToolIntegration.ts`                               |
| 2.2     | ☐ To Do | Implement use_mcp_tool LangChain Wrapper - Convert use_mcp_tool to LangChain StructuredTool with MCP hub integration             | `src/core/tools/useMcpLangChainTool.ts`                                   |
| 3.1     | ☐ To Do | Create LLM Configuration for Native Tool Calling - Create configuration interface for tool binding and native calling            | `src/api/llm-config.ts`                                                   |
| 3.2     | ☐ To Do | Update API Handler for Native Tool Calling - Modify buildApiHandler to support bindTools parameter and AIMessage.tool_calls      | `src/api/index.ts`                                                        |
| 4.1     | ☐ To Do | Create Transitional Execution Layer - Create bridge between AIMessage.tool_calls and existing tool execution                     | `src/core/assistant-message/toolCallBridge.ts`                            |
| 5.1     | ☐ To Do | Create Comprehensive Testing Infrastructure - Create tests for write_to_file LangChain wrapper with schema validation            | `src/core/tools/__tests__/writeToFileLangChainTool.spec.ts`               |
| 5.2     | ☐ To Do | Create Integration Tests - Create integration tests for tool call bridge with AIMessage.tool_calls parsing                       | `src/core/tools/__tests__/toolCallBridge.spec.ts`                         |
| 5.3     | ☐ To Do | Create MCP Integration Tests - Create MCP integration tests with mock client and tool discovery                                  | `src/core/tools/__tests__/useMcpLangChainTool.spec.ts`                    |
| 5.4     | ☐ To Do | Create LLM Configuration Tests - Create LLM configuration tests with tool binding and mode switching                             | `src/api/__tests__/llm-config.spec.ts`                                    |
| 5.5     | ☐ To Do | Create End-to-End Integration Tests - Create end-to-end integration tests for complete workflow                                  | `src/core/assistant-message/__tests__/toolCallBridge.integration.spec.ts` |

## Task Details

### Task 1.1: Create LangChain Tool Wrapper Base Class

**File**: `src/core/tools/base/LangChainToolWrapper.ts`
**Description**: Create base class for all LangChain tool wrappers
**Dependencies**: None
**Method Signature**:

```typescript
export abstract class LangChainToolWrapper {
	abstract name: string
	abstract description: string
	abstract schema: z.ZodSchema

	abstract execute(params: any, context: any): Promise<any>
}
```

**Implementation Details**:

- Extend existing tool patterns from `writeToFileTool.ts` (lines 20-26)
- Follow LangChain `StructuredTool` interface pattern
- Maintain backward compatibility with existing `ToolUse` interface
- Add proper error handling and validation
- Use Zod schema for input validation
- Preserve existing approval and result handling patterns

### Task 1.2: Implement write_to_file LangChain Wrapper

**File**: `src/core/tools/writeToFileLangChainTool.ts`
**Description**: Convert write_to_file tool to LangChain StructuredTool
**Dependencies**: LangChain core, Zod validation
**Method Signature**:

```typescript
export const writeToFileLangChainTool = new DynamicStructuredTool({
	name: "write_to_file",
	description: "Write content to a file",
	schema: z.object({
		path: z.string(),
		content: z.string(),
		line_count: z.number().optional(),
	}),
	func: async ({ path, content, line_count }, context) => {
		// Reuse existing writeToFileTool logic (lines 54-320)
		// Map parameters to existing function signature
		// Handle partial content and streaming
		// Maintain error handling patterns
	},
})
```

**Implementation Details**:

- Reuse existing logic from [`writeToFileTool.ts:54-320`](src/core/tools/writeToFileTool.ts:54)
- Map `block.params` to tool parameters
- Preserve `cline`, `askApproval`, `handleError`, `pushToolResult` interfaces
- Maintain existing file validation and access control
- Add Zod schema validation
- Handle partial requests and streaming

### Task 1.3: Implement read_file LangChain Wrapper

**File**: `src/core/tools/readFileLangChainTool.ts`
**Description**: Convert read_file tool to LangChain StructuredTool
**Dependencies**: LangChain core, Zod validation
**Method Signature**:

```typescript
export const readFileLangChainTool = new DynamicStructuredTool({
	name: "read_file",
	description: "Read contents of a file",
	schema: z.object({
		path: z.string(),
		start_line: z.number().optional(),
		end_line: z.number().optional(),
	}),
	func: async ({ path, start_line, end_line }, context) => {
		// Reuse existing readFileTool logic (lines 84-749)
		// Handle multi-file and single-file scenarios
		// Preserve existing validation and error handling
		// Add Zod schema validation
	},
})
```

**Implementation Details**:

- Reuse existing logic from [`readFileTool.ts:84-749`](src/core/tools/readFileTool.ts:84)
- Handle both `args` XML format and legacy single file format
- Preserve existing approval and result handling patterns
- Maintain file validation and access control
- Add Zod schema validation
- Support line ranges and multi-file reading

### Task 1.4: Implement execute_command LangChain Wrapper

**File**: `src/core/tools/executeCommandLangChainTool.ts`
**Description**: Convert execute_command tool to LangChain StructuredTool
**Dependencies**: LangChain core, Zod validation
**Method Signature**:

```typescript
export const executeCommandLangChainTool = new DynamicStructuredTool({
	name: "execute_command",
	description: "Execute a CLI command",
	schema: z.object({
		command: z.string(),
		cwd: z.string().optional(),
	}),
	func: async ({ command, cwd }, context) => {
		// Reuse existing executeCommandTool logic (lines 34-402)
		// Preserve terminal integration patterns
		// Maintain existing error handling and validation
		// Add Zod schema validation
	},
})
```

**Implementation Details**:

- Reuse existing logic from [`executeCommandTool.ts:34-402`](src/core/tools/executeCommandTool.ts:34)
- Map `block.params` to tool parameters
- Preserve existing retry integration and timeout handling
- Maintain terminal process management
- Add Zod schema validation
- Handle partial requests and streaming

### Task 2.1: Create MCP Tool Integration Base

**File**: `src/core/tools/base/McpToolIntegration.ts`
**Description**: Create base class for MCP tool integration
**Dependencies**: LangChain MCP adapters
**Method Signature**:

```typescript
export abstract class McpToolIntegration {
	abstract serverName: string
	abstract toolName: string
	abstract executeTool(
		serverName: string,
		toolName: string,
		arguments: Record<string, unknown>,
		context: any,
	): Promise<any>
}
```

**Implementation Details**:

- Create reusable MCP integration patterns
- Handle tool discovery and validation
- Support dynamic server and tool loading
- Maintain error handling and result formatting

### Task 2.2: Implement use_mcp_tool LangChain Wrapper

**File**: `src/core/tools/useMcpLangChainTool.ts`
**Description**: Convert use_mcp_tool to LangChain StructuredTool
**Dependencies**: LangChain MCP adapters, base integration class
**Method Signature**:

```typescript
export const useMcpLangChainTool = new DynamicStructuredTool({
	name: "use_mcp_tool",
	description: "Use a tool from an MCP server",
	schema: z.object({
		server_name: z.string(),
		tool_name: z.string(),
		arguments: z.string().optional(),
	}),
	func: async ({ server_name, tool_name, arguments }, context) => {
		// Reuse existing useMcpToolTool logic (lines 284-372)
		// Preserve existing validation and error handling
		// Add Zod schema validation
		// Handle partial requests and streaming
	},
})
```

**Implementation Details**:

- Reuse existing logic from [`useMcpToolTool.ts:284-372`](src/core/tools/useMcpToolTool.ts:284)
- Map `block.params` to tool parameters
- Preserve existing MCP hub integration patterns
- Add Zod schema validation
- Support dynamic tool discovery and server management

### Task 3.1: Create LLM Configuration for Native Tool Calling

**File**: `src/api/llm-config.ts`
**Description**: Create LLM configuration for native tool calling
**Dependencies**: LangChain core, existing API patterns
**Method Signature**:

```typescript
export interface LLMToolConfig {
	modelId: string
	tools: DynamicStructuredTool[]
	useNativeCalling: boolean
}

export function createLLMConfig(config: LLMToolConfig): any {
	// Configure LLM for native tool calling
	// Handle bindTools method
	// Support both XML and native modes during transition
}
```

**Implementation Details**:

- Create configuration interface for tool binding
- Implement `bindTools` method in API handlers
- Support transitional execution mode
- Maintain backward compatibility with existing XML parsing

### Task 3.2: Update API Handler for Native Tool Calling

**File**: `src/api/index.ts`
**Description**: Update API handler to support native tool calling
**Dependencies**: LangChain core, LLM configuration
**Method Signature**:

```typescript
// Update existing buildApiHandler function (lines 91-175)
// Add support for bindTools parameter
// Handle AIMessage.tool_calls format
// Maintain existing provider patterns
```

**Implementation Details**:

- Modify [`buildApiHandler`](src/api/index.ts:91) to accept `tools` parameter
- Add conditional logic for native vs XML tool calling
- Update provider interfaces to support tool binding
- Maintain existing error handling and validation patterns

### Task 4.1: Create Transitional Execution Layer

**File**: `src/core/assistant-message/toolCallBridge.ts`
**Description**: Create bridge between AIMessage.tool_calls and existing tool execution
**Dependencies**: Existing task management, tool execution patterns
**Method Signature**:

```typescript
export async function bridgeToolCalls(toolCalls: any[], cline: Task): Promise<void> {
	// Convert AIMessage.tool_calls to ToolUse format
	// Execute tools using existing wrapper functions
	// Handle streaming and partial requests
	// Maintain existing approval and error handling
}
```

**Implementation Details**:

- Parse `AIMessage.tool_calls` format
- Convert to existing `ToolUse` interface
- Execute tools using new LangChain wrappers
- Preserve existing streaming and approval patterns
- Handle errors and maintain task state

### Task 5.1: Create Comprehensive Testing Infrastructure

**File**: `src/core/tools/__tests__/writeToFileLangChainTool.spec.ts`
**Description**: Create comprehensive tests for write_to_file LangChain wrapper
**Dependencies**: Vitest, existing test patterns
**Test Cases**:

- Test tool creation and schema validation
- Test parameter mapping and validation
- Test error handling and edge cases
- Test integration with existing task management

### Task 5.2: Create Integration Tests

**File**: `src/core/tools/__tests__/toolCallBridge.spec.ts`
**Description**: Create integration tests for tool call bridge
**Dependencies**: Vitest, mock implementations
**Test Cases**:

- Test AIMessage.tool_calls parsing
- Test tool execution through bridge
- Test error handling and recovery
- Test streaming and partial request handling

### Task 5.3: Create MCP Integration Tests

**File**: `src/core/tools/__tests__/useMcpLangChainTool.spec.ts`
**Description**: Create MCP integration tests
**Dependencies**: Vitest, mock MCP client
**Test Cases**:

- Test MCP client connection and tool discovery
- Test tool execution and result handling
- Test error scenarios and recovery

### Task 5.4: Create LLM Configuration Tests

**File**: `src/api/__tests__/llm-config.spec.ts`
**Description**: Create LLM configuration tests
**Dependencies**: Vitest, mock implementations
**Test Cases**:

- Test tool binding and configuration
- Test native vs XML mode switching
- Test LLM provider compatibility
- Test error handling and fallback scenarios

### Task 5.5: Create End-to-End Integration Tests

**File**: `src/core/assistant-message/__tests__/toolCallBridge.integration.spec.ts`
**Description**: Create end-to-end integration tests
**Dependencies**: Vitest, mock implementations
**Test Cases**:

- Test complete workflow from AIMessage to tool execution
- Test error handling and recovery scenarios
- Test performance and memory usage
- Test backward compatibility during transition
