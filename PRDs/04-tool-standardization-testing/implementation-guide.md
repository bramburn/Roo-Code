# Implementation Guide: Tool Standardization and Testing

## Overview

This implementation guide provides detailed context and architectural guidance for implementing the Tool Standardization and Testing PRD. It includes specific file locations, method signatures, code patterns, and implementation details based on the actual codebase analysis.

## Architecture and Patterns

### Existing Tool Architecture

The current tool system follows these patterns:

- **Tool Interface**: All tools implement the `ToolUse` interface with `name` and `params` properties
- **XML Parameter Parsing**: Current tools extract parameters from XML `<parameter>` tags
- **Result Processing**: Results are pushed through `pushToolResult` and handled via approval flow
- **Error Handling**: Consistent error handling patterns with `handleError` function
- **File Operations**: Tools use existing file system operations from `src/integrations/misc/`

### Task Execution Flow

The main task execution follows this pattern:

1. **Task Creation**: `src/core/task/Task.ts` (lines 1-321)
2. **Tool Dispatch**: `src/core/assistant-message/presentAssistantMessage.ts` (lines 595-623)
3. **Tool Execution**: Individual tool files like `src/core/tools/writeToFileTool.ts`
4. **Result Processing**: Results flow back through approval system

## Implementation Locations

### Tool Wrapper System

#### Base Classes and Interfaces

**LangGraph Tool Wrapper Base Class**

```typescript
// Location: src/tools/wrappers/base/LangGraphToolWrapper.ts
export abstract class LangGraphToolWrapper {
	abstract name: string
	abstract description: string

	abstract async _invoke(input: any): Promise<any>

	protected constructor(config: ToolWrapperConfig) {
		this.config = config
	}

	protected validateInput(input: any): boolean {
		// Zod schema validation
		return this.schema.parse(input)
	}
}
```

**Tool Wrapper Configuration**

```typescript
// Location: src/tools/wrappers/base/ToolWrapperConfig.ts
export interface ToolWrapperConfig {
	toolName: string
	description: string
	zodSchema: z.ZodSchema
	legacyTool: any // Reference to existing tool implementation
}
```

#### Specific Tool Wrappers

**Write File Tool Wrapper**

```typescript
// Location: src/tools/wrappers/WriteToFileToolWrapper.ts
import { LangGraphToolWrapper } from "./base/LangGraphToolWrapper"
import { z } from "zod"
import { writeToFileTool } from "../../../core/tools/writeToFileTool"

export class WriteToFileToolWrapper extends LangGraphToolWrapper {
	private config: ToolWrapperConfig

	constructor(config: ToolWrapperConfig) {
		super(config)
		this.config = {
			...config,
			toolName: "writeToFile",
			description: "Write content to a file",
			legacyTool: writeToFileTool,
			zodSchema: z.object({
				path: z.string().describe("File path to write to"),
				content: z.string().describe("Content to write to file"),
				encoding: z.string().optional("File encoding (default: utf-8)").default("utf-8"),
			}),
		}
	}

	protected validateInput(input: any): boolean {
		return this.config.zodSchema.parse(input)
	}

	async _invoke(input: any): Promise<any> {
		const validated = this.validateInput(input)
		if (!validated) {
			throw new Error(`Invalid input: ${validated.error}`)
		}

		return this.config.legacyTool.invoke(input)
	}
}
```

**Read File Tool Wrapper**

```typescript
// Location: src/tools/wrappers/ReadFileToolWrapper.ts
import { LangGraphToolWrapper } from "./base/LangGraphToolWrapper"
import { z } from "zod"
import { readFileTool } from "../../../core/tools/readFileTool"

export class ReadFileToolWrapper extends LangGraphToolWrapper {
	private config: ToolWrapperConfig

	constructor(config: ToolWrapperConfig) {
		super(config)
		this.config = {
			...config,
			toolName: "readFile",
			description: "Read content from a file",
			legacyTool: readFileTool,
			zodSchema: z.object({
				path: z.string().describe("File path to read"),
				encoding: z.string().optional("File encoding (default: utf-8)").default("utf-8"),
				startLine: z.number().optional("Start line number (1-based)").default(1),
				endLine: z.number().optional("End line number (1-based)").default(-1),
				includeLineNumbers: z.boolean().optional("Include line numbers in output").default(false),
			}),
		}
	}

	protected validateInput(input: any): boolean {
		return this.config.zodSchema.parse(input)
	}

	async _invoke(input: any): Promise<any> {
		const validated = this.validateInput(input)
		if (!validated) {
			throw new Error(`Invalid input: ${validated.error}`)
		}

		return this.config.legacyTool.invoke(input)
	}
}
```

### Transitional Execution Layer

#### State Synchronization

**Task State Manager**

```typescript
// Location: src/transitional/TaskStateManager.ts
export class TaskStateManager {
	private currentState: any
	private checkpointService: any

	constructor(checkpointService: any) {
		this.checkpointService = checkpointService
	}

	syncWithLangGraph(graphState: any): void {
		// Synchronize current task state with LangGraph state
		this.currentState = { ...this.currentState, ...graphState }
	}

	createCheckpoint(): void {
		// Create checkpoint using existing checkpoint service
		return this.checkpointService.createCheckpoint(this.currentState)
	}
}
```

**Legacy Tool Adapter**

```typescript
// Location: src/transitional/LegacyToolAdapter.ts
export class LegacyToolAdapter {
	static adaptToLangGraph(legacyTool: any): LangGraphToolWrapper {
		// Convert legacy tool to LangGraph wrapper format
		// Preserve existing functionality while providing LangGraph compatibility
	}
}
```

## LangGraph Integration

### StateGraph Implementation

#### Graph Structure

**StateGraph Builder**

```typescript
// Location: src/langgraph/StateGraphBuilder.ts
import { StateGraph, CompiledGraph } from "@langchain/langgraph"

export class StateGraphBuilder {
	private graph: StateGraph

	constructor() {
		this.graph = new StateGraph()
	}

	addNode(config: NodeConfig): this {
		return this.graph.addNode(config)
	}

	addEdge(config: EdgeConfig): this {
		return this.graph.addEdge(config)
	}

	compile(): CompiledGraph {
		return this.graph.compile()
	}
}
```

**Node Configurations**

```typescript
// Location: src/langgraph/NodeConfigs.ts
export const CALL_MODEL_NODE = {
	name: "callModel",
	description: "Call AI model with current state",
	input: ["state"],
	output: ["state", "next"],
	config: { writable: true },
}

export const TOOLS_NODE = {
	name: "tools",
	description: "Execute available tools",
	input: ["state", "tool_calls"],
	output: ["state", "tool_results"],
	config: { writable: true },
}

export const CONDITIONAL_EDGE = {
	name: "shouldContinue",
	description: "Check if execution should continue",
	input: ["state"],
	output: ["boolean"],
	config: { writable: true },
}
```

## Testing Strategy

### Test Structure

#### Unit Tests

**Tool Wrapper Tests**

```typescript
// Location: src/tests/tools/wrappers/WriteToFileToolWrapper.test.ts
import { describe, test, expect, beforeEach, afterEach } from "vitest"
import { WriteToFileToolWrapper } from "../../../tools/wrappers/WriteToFileToolWrapper"

describe("WriteToFileToolWrapper", () => {
	let wrapper: WriteToFileToolWrapper

	beforeEach(() => {
		wrapper = new WriteToFileToolWrapper({
			toolName: "writeToFile",
			description: "Write content to a file",
			legacyTool: mockWriteToFileTool,
		})
	})

	test("should validate input with Zod schema", async () => {
		const result = await wrapper._invoke({ path: "/test/file.txt", content: "test content" })
		expect(result).toBe("test content")
	})

	test("should call legacy tool when validation passes", async () => {
		wrapper = new WriteToFileToolWrapper({
			toolName: "writeToFile",
			description: "Write content to a file",
			legacyTool: mockWriteToFileTool,
		})

		const result = await wrapper._invoke({ path: "/test/file.txt", content: "test content" })
		expect(mockWriteToFileTool.invoke).toHaveBeenCalledWith({ path: "/test/file.txt", content: "test content" })
	})
})
```

## Deployment and Configuration

### Environment Setup

#### Development Environment

```json
// Location: package.json (additions for LangGraph dependencies)
{
	"dependencies": {
		"@langchain/core": "^0.1.0",
		"@langchain/langgraph": "^0.0.1",
		"zod": "^3.22.0"
	}
}
```

#### Configuration Files

```typescript
// Location: src/config/LangGraphConfig.ts
export const LANGGRAPH_CONFIG = {
	// LangGraph configuration settings
	maxExecutionTime: 30000, // 30 seconds max execution time
	maxSteps: 100, // Maximum steps per execution
	enableInterrupts: true, // Enable interrupt handling
	checkpointInterval: 60000, // Checkpoint every 60 seconds
}
```

## Migration Strategy

### Phase 1: Tool Wrapper Creation

1. Create base LangGraph tool wrapper class
2. Implement Zod schema validation for each tool
3. Create tool wrapper configuration system
4. Implement legacy tool adapter for backward compatibility
5. Create comprehensive unit tests for all wrappers

### Phase 2: Transitional Execution Layer

1. Implement task state synchronization
2. Create LangGraph StateGraph builder
3. Implement conditional edge routing
4. Create checkpoint integration with existing service
5. Add interrupt handling and resume functionality
6. Create performance monitoring for transitional layer

### Phase 3: LangGraph Integration

1. Replace manual task loop with StateGraph execution
2. Implement node and edge configurations
3. Add parallel execution support
4. Create plugin system for custom nodes
5. Implement advanced features (conditional routing, interrupts)
6. Create comprehensive testing suite
7. Add production deployment support

## Best Practices

### Code Organization

- Follow existing file structure patterns from `src/core/`
- Use TypeScript interfaces for type safety
- Implement comprehensive error handling
- Maintain backward compatibility with legacy tools
- Use dependency injection for testability

### Testing

- Write comprehensive unit tests for all components
- Use mocking for external dependencies
- Test both success and failure scenarios
- Include performance benchmarks
- Test edge cases and error conditions

### Performance

- Monitor execution times and resource usage
- Implement caching where appropriate
- Use async/await patterns consistently
- Optimize for memory efficiency

### Security

- Validate all inputs with Zod schemas
- Sanitize file paths to prevent directory traversal
- Implement proper error handling without information leakage
- Follow existing authentication and authorization patterns

## Common Patterns

### Error Handling

```typescript
// Standard error handling pattern
try {
	const result = await someOperation()
	return result
} catch (error) {
	console.error(`Operation failed: ${error.message}`)
	throw error
}
```

### Configuration Management

```typescript
// Configuration pattern
export const createToolConfig = (toolName: string, legacyTool: any): ToolWrapperConfig => ({
	toolName,
	description: `${toolName} - ${legacyTool.description || "Legacy tool"}`,
	legacyTool,
	zodSchema: generateZodSchema(legacyTool),
})
```

This implementation guide provides the foundation for successfully implementing the Tool Standardization and Testing PRD while maintaining compatibility with existing systems and following established architectural patterns.
