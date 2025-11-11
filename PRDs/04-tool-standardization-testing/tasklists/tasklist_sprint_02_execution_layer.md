# Sprint 2: Transitional Execution Layer (1 week)

| Task ID | Status  | Task Description                                                                                           | File(s) To Modify                                                           |
| ------- | ------- | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| 2.1     | ☐ To Do | Create Tool Call Bridge Component - Create bridge between AIMessage.tool_calls and existing tool execution | `src/core/assistant-message/toolCallBridge.ts`                              |
| 2.2     | ☐ To Do | Update Tool Execution Dispatcher - Update presentAssistantMessage to support both XML and native formats   | `src/core/assistant-message/presentAssistantMessage.ts`                     |
| 2.3     | ☐ To Do | Create Configuration Manager - Create configuration manager for tool execution modes with gradual rollout  | `src/core/config/toolConfigManager.ts`                                      |
| 2.4     | ☐ To Do | Create Tool Registry - Create registry for managing tool availability and discovery with MCP support       | `src/core/registry/toolRegistry.ts`                                         |
| 2.5     | ☐ To Do | Update Task Management Integration - Update presentAssistantMessage to support new tool execution flow     | `src/core/assistant-message/presentAssistantMessage.ts`                     |
| 3.1     | ☐ To Do | Create Error Handling Bridge - Create error handling bridge for tool execution with format translation     | `src/core/errors/toolErrorBridge.ts`                                        |
| 3.2     | ☐ To Do | Create Streaming Support Bridge - Create streaming support for tool execution with backward compatibility  | `src/core/streaming/toolStreamingBridge.ts`                                 |
| 4.1     | ☐ To Do | Create Integration Tests - Create integration tests for tool call bridge with AIMessage.tool_calls parsing | `src/core/assistant-message/__tests__/toolCallBridge.integration.spec.ts`   |
| 4.2     | ☐ To Do | Create Configuration Tests - Create configuration manager tests with runtime updates and fallback          | `src/core/config/__tests__/toolConfigManager.spec.ts`                       |
| 4.3     | ☐ To Do | Create Registry Tests - Create tool registry tests with dynamic loading and MCP integration                | `src/core/registry/__tests__/toolRegistry.spec.ts`                          |
| 4.4     | ☐ To Do | Create Error Handling Tests - Create error handling bridge tests with format translation and recovery      | `src/core/errors/__tests__/toolErrorBridge.spec.ts`                         |
| 4.5     | ☐ To Do | Create Streaming Tests - Create streaming bridge tests with partial results and progress updates           | `src/core/streaming/__tests__/toolStreamingBridge.spec.ts`                  |
| 5.1     | ☐ To Do | Create Performance Tests - Create performance tests for tool call bridge with concurrent execution         | `src/core/assistant-message/__tests__/toolCallBridge.performance.spec.ts`   |
| 5.2     | ☐ To Do | Create Load Tests - Create load tests for updated message processing with concurrent handling              | `src/core/assistant-message/__tests__/presentAssistantMessage.load.spec.ts` |

## Task Details

### Task 2.1: Create Tool Call Bridge Component

**File**: `src/core/assistant-message/toolCallBridge.ts`
**Description**: Create bridge between AIMessage.tool_calls and existing tool execution
**Dependencies**: LangChain tools, existing task management
**Method Signature**:

```typescript
export interface ToolCall {
	id: string
	type: string
	function: {
		name: string
		arguments: string
	}
}

export async function bridgeToolCalls(toolCalls: ToolCall[], cline: Task): Promise<void> {
	// Parse AIMessage.tool_calls format
	// Convert to existing ToolUse interface
	// Execute tools using new LangChain wrappers
	// Preserve existing streaming and approval patterns
}
```

**Implementation Details**:

- Parse `AIMessage.tool_calls` format from LangChain
- Convert to existing `ToolUse` interface used in [`presentAssistantMessage.ts:595`](src/core/assistant-message/presentAssistantMessage.ts:595)
- Execute tools using new LangChain wrappers from Sprint 1
- Preserve existing approval and error handling patterns from [`presentAssistantMessage.ts:598-623`](src/core/assistant-message/presentAssistantMessage.ts:598)
- Handle streaming and partial requests
- Maintain task state and progress tracking

### Task 2.2: Update Tool Execution Dispatcher

**File**: `src/core/assistant-message/presentAssistantMessage.ts`
**Description**: Update existing tool execution dispatcher to support both XML and native formats
**Dependencies**: Tool call bridge, LangChain tools
**Method Signature**:

```typescript
// Update existing executeTool function (lines 595-623)
export async function executeTool(tool: ToolUse | ToolCall, cline: Task): Promise<void> {
	// Detect tool format (XML vs native)
	// Route to appropriate execution path
	// Maintain backward compatibility
	// Handle errors and results consistently
}
```

**Implementation Details**:

- Modify existing [`executeTool`](src/core/assistant-message/presentAssistantMessage.ts:595) function to handle both formats
- Add conditional logic to detect tool call format
- Route XML format to existing switch statement (lines 598-623)
- Route native format to new tool call bridge
- Maintain existing error handling and result processing
- Preserve streaming and approval patterns

### Task 2.3: Create Configuration Manager

**File**: `src/core/config/toolConfigManager.ts`
**Description**: Create configuration manager for tool execution modes
**Dependencies**: Existing configuration patterns
**Method Signature**:

```typescript
export interface ToolExecutionConfig {
	useNativeCalling: boolean
	enabledTools: string[]
	fallbackToXml: boolean
}

export class ToolConfigManager {
	static getConfig(): ToolExecutionConfig {
		// Load configuration from settings
		// Default to XML mode during transition
		// Support gradual rollout
	}

	static updateConfig(config: Partial<ToolExecutionConfig>): void {
		// Update configuration
		// Persist changes
		// Notify components of changes
	}
}
```

**Implementation Details**:

- Follow existing configuration patterns from [`src/utils/config.ts`](src/utils/config.ts)
- Support gradual rollout of native tool calling
- Provide fallback to XML mode
- Integrate with existing settings management
- Support runtime configuration changes

### Task 2.4: Create Tool Registry

**File**: `src/core/registry/toolRegistry.ts`
**Description**: Create registry for managing tool availability and discovery
**Dependencies**: LangChain tools, MCP integration
**Method Signature**:

```typescript
export interface ToolRegistration {
	name: string
	tool: DynamicStructuredTool
	category: "core" | "mcp" | "custom"
	enabled: boolean
}

export class ToolRegistry {
	private tools: Map<string, ToolRegistration> = new Map()

	registerTool(registration: ToolRegistration): void {
		// Register tool with validation
		// Update tool availability
		// Notify components of changes
	}

	getTool(name: string): ToolRegistration | undefined {
		// Retrieve tool by name
		// Return registration details
	}

	getEnabledTools(): DynamicStructuredTool[] {
		// Return all enabled tools
		// Filter by configuration
		// Support tool categories
	}
}
```

**Implementation Details**:

- Create centralized tool management
- Support dynamic tool discovery (especially for MCP tools)
- Integrate with existing tool loading patterns
- Support tool categories and filtering
- Provide tool metadata and capabilities

### Task 2.5: Update Task Management Integration

**File**: `src/core/assistant-message/presentAssistantMessage.ts`
**Description**: Update task management to support new tool execution flow
**Dependencies**: Tool registry, configuration manager
**Method Signature**:

```typescript
// Update existing presentAssistantMessage function (lines 1-623)
export async function presentAssistantMessage(message: any, cline: Task): Promise<void> {
	// Detect message format (XML vs native)
	// Route to appropriate processing
	// Maintain existing task state management
	// Handle errors and recovery
}
```

**Implementation Details**:

- Update [`presentAssistantMessage`](src/core/assistant-message/presentAssistantMessage.ts:1) to detect message format
- Route XML messages to existing processing pipeline
- Route native messages to new tool call bridge
- Maintain existing task state and progress tracking
- Preserve error handling and recovery mechanisms

### Task 3.1: Create Error Handling Bridge

**File**: `src/core/errors/toolErrorBridge.ts`
**Description**: Create error handling bridge for tool execution
**Dependencies**: Existing error handling patterns
**Method Signature**:

```typescript
export interface ToolExecutionError {
	toolName: string
	error: Error
	context: any
	recoverable: boolean
}

export class ToolErrorBridge {
	static handleError(error: ToolExecutionError): Promise<void> {
		// Map errors to existing error handling
		// Provide recovery mechanisms
		// Maintain error reporting patterns
		// Support error translation between formats
	}
}
```

**Implementation Details**:

- Bridge error handling between XML and native formats
- Maintain existing error reporting patterns from [`src/utils/errors.ts`](src/utils/errors.ts)
- Provide consistent error recovery mechanisms
- Support error translation and mapping
- Preserve existing error logging and telemetry

### Task 3.2: Create Streaming Support Bridge

**File**: `src/core/streaming/toolStreamingBridge.ts`
**Description**: Create streaming support for tool execution
**Dependencies**: Existing streaming patterns
**Method Signature**:

```typescript
export interface ToolStreamingContext {
	toolName: string
	requestId: string
	onProgress: (progress: any) => void
	onComplete: (result: any) => void
	onError: (error: Error) => void
}

export class ToolStreamingBridge {
	static createStream(context: ToolStreamingContext): Promise<void> {
		// Create streaming context
		// Bridge to existing streaming patterns
		// Handle partial results and progress
		// Maintain backward compatibility
	}
}
```

**Implementation Details**:

- Bridge streaming between XML and native formats
- Maintain existing streaming patterns from tool implementations
- Support partial results and progress updates
- Handle streaming errors and recovery
- Preserve existing approval and user interaction patterns

### Task 4.1: Create Integration Tests

**File**: `src/core/assistant-message/__tests__/toolCallBridge.integration.spec.ts`
**Description**: Create integration tests for tool call bridge
**Dependencies**: Vitest, mock implementations
**Test Cases**:

- Test AIMessage.tool_calls parsing and conversion
- Test tool execution through bridge
- Test error handling and recovery
- Test streaming and partial request handling
- Test backward compatibility with XML format

### Task 4.2: Create Configuration Tests

**File**: `src/core/config/__tests__/toolConfigManager.spec.ts`
**Description**: Create configuration manager tests
**Dependencies**: Vitest, mock implementations
**Test Cases**:

- Test configuration loading and saving
- Test runtime configuration updates
- Test fallback mechanisms
- Test gradual rollout support
- Test integration with existing settings

### Task 4.3: Create Registry Tests

**File**: `src/core/registry/__tests__/toolRegistry.spec.ts`
**Description**: Create tool registry tests
**Dependencies**: Vitest, mock implementations
**Test Cases**:

- Test tool registration and discovery
- Test tool filtering and categories
- Test dynamic tool loading
- Test MCP tool integration
- Test tool metadata and capabilities

### Task 4.4: Create Error Handling Tests

**File**: `src/core/errors/__tests__/toolErrorBridge.spec.ts`
**Description**: Create error handling bridge tests
**Dependencies**: Vitest, mock implementations
**Test Cases**:

- Test error mapping and translation
- Test error recovery mechanisms
- Test error reporting and logging
- Test error handling between formats
- Test integration with existing error patterns

### Task 4.5: Create Streaming Tests

**File**: `src/core/streaming/__tests__/toolStreamingBridge.spec.ts`
**Description**: Create streaming bridge tests
**Dependencies**: Vitest, mock implementations
**Test Cases**:

- Test streaming context creation
- Test partial result handling
- Test progress updates and completion
- Test streaming error handling
- Test backward compatibility with existing streaming

### Task 5.1: Create Performance Tests

**File**: `src/core/assistant-message/__tests__/toolCallBridge.performance.spec.ts`
**Description**: Create performance tests for tool call bridge
**Dependencies**: Vitest, performance monitoring
**Test Cases**:

- Test tool call conversion performance
- Test memory usage during bridge operations
- Test concurrent tool execution
- Test streaming performance
- Test error handling performance impact

### Task 5.2: Create Load Tests

**File**: `src/core/assistant-message/__tests__/presentAssistantMessage.load.spec.ts`
**Description**: Create load tests for updated message processing
**Dependencies**: Vitest, load testing utilities
**Test Cases**:

- Test concurrent message processing
- Test memory usage under load
- Test error handling under load
- Test streaming performance under load
- Test backward compatibility under load
