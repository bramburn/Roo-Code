# Implementation Guide: Loop Migration to LangGraph/Agent Executor

## Overview

This implementation guide provides detailed context and architectural guidance for implementing Loop Migration to LangGraph/Agent Executor PRD. It includes specific file locations, method signatures, code patterns, and implementation details based on actual codebase analysis.

## Architecture and Patterns

### Existing Task Loop Architecture

The current task execution system follows these patterns:

- **Manual Loop Control**: `src/core/task/Task.ts` contains `while (!this.abort)` loop (lines 1-321)
- **Tool Dispatch**: `src/core/assistant-message/presentAssistantMessage.ts` handles tool execution (lines 595-623)
- **State Management**: Task state is managed through class properties and method calls
- **Checkpoint Integration**: Checkpoints are created at task boundaries via existing checkpoint service

### Checkpoint Service Architecture

The checkpoint system provides:

- **Type Definitions**: `src/services/checkpoints/types.ts` (lines 16-35)
- **Service Implementation**: `src/services/checkpoints/ShadowCheckpointService.ts`
- **Task Integration**: `src/core/checkpoints/index.ts` integrates checkpoints with task management
- **Restore Handler**: `src/core/webview/checkpointRestoreHandler.ts` handles checkpoint restoration

## Implementation Locations

### LangGraph StateGraph Implementation

#### Core StateGraph Classes

**StateGraph Manager**

```typescript
// Location: src/langgraph/StateGraphManager.ts
import { StateGraph, CompiledGraph, StateGraphArgs } from "@langchain/langgraph"
import { CheckpointService } from "../services/checkpoints/CheckpointService"

export class StateGraphManager {
	private graph: StateGraph
	private checkpointService: CheckpointService
	private compiledGraph: CompiledGraph

	constructor(checkpointService: CheckpointService) {
		this.checkpointService = checkpointService
		this.graph = new StateGraph()
	}

	initializeGraph(config: StateGraphConfig): void {
		// Initialize StateGraph with nodes and edges
		this.graph.addNode("callModel", this.createCallModelNode())
		this.graph.addNode("tools", this.createToolsNode())
		this.graph.addEdge("callModel", "tools")
		this.graph.addEdge("tools", "callModel")

		// Add conditional routing
		this.graph.addConditionalEdges("callModel", this.shouldContinue.bind(this), {
			continue: "tools",
			end: "__end__",
		})

		this.compiledGraph = this.graph.compile({
			checkpointer: this.checkpointService.createLangGraphCheckpointer(),
		})
	}

	private createCallModelNode(): any {
		return async (state: any) => {
			// Call AI model with current state
			const response = await this.callModel(state)
			return {
				...state,
				messages: [...state.messages, response],
				next: response.toolCalls?.length > 0 ? "tools" : "__end__",
			}
		}
	}

	private createToolsNode(): any {
		return async (state: any) => {
			// Execute available tools
			const toolResults = await this.executeTools(state.toolCalls)
			return {
				...state,
				toolResults,
				next: "callModel",
			}
		}
	}

	private shouldContinue(state: any): string {
		// Conditional routing logic
		return state.next === "tools" ? "continue" : "end"
	}

	async execute(initialState: any): Promise<any> {
		// Execute the compiled graph
		return this.compiledGraph.invoke(initialState)
	}

	async stream(initialState: any): Promise<any> {
		// Stream execution for real-time updates
		return this.compiledGraph.stream(initialState)
	}
}
```

**StateGraph Configuration**

```typescript
// Location: src/langgraph/StateGraphConfig.ts
export interface StateGraphConfig {
	maxIterations: number
	enableInterrupts: boolean
	checkpointInterval: number
	toolTimeout: number
}

export const DEFAULT_STATEGRAPH_CONFIG: StateGraphConfig = {
	maxIterations: 100,
	enableInterrupts: true,
	checkpointInterval: 60000, // 60 seconds
	toolTimeout: 30000, // 30 seconds
}
```

#### Node Implementations

**Model Call Node**

```typescript
// Location: src/langgraph/nodes/CallModelNode.ts
import { BaseNode } from "../base/BaseNode"

export class CallModelNode extends BaseNode {
	async execute(state: any): Promise<any> {
		try {
			const response = await this.modelProvider.call({
				messages: state.messages,
				tools: state.availableTools,
			})

			return {
				...state,
				messages: [...state.messages, response],
				toolCalls: response.toolCalls || [],
				next: response.toolCalls?.length > 0 ? "tools" : "__end__",
			}
		} catch (error) {
			this.handleError(error, state)
			throw error
		}
	}
}
```

**Tools Execution Node**

```typescript
// Location: src/langgraph/nodes/ToolsNode.ts
import { BaseNode } from "../base/BaseNode"

export class ToolsNode extends BaseNode {
	async execute(state: any): Promise<any> {
		try {
			const toolResults = []

			for (const toolCall of state.toolCalls) {
				const result = await this.executeTool(toolCall)
				toolResults.push({
					toolCall: toolCall.name,
					result: result,
				})
			}

			return {
				...state,
				toolResults,
				next: "callModel",
			}
		} catch (error) {
			this.handleError(error, state)
			throw error
		}
	}

	private async executeTool(toolCall: any): Promise<any> {
		// Execute individual tool using existing tool system
		const tool = this.toolRegistry.getTool(toolCall.name)
		if (!tool) {
			throw new Error(`Tool not found: ${toolCall.name}`)
		}

		return tool.invoke(toolCall.arguments)
	}
}
```

### Interrupt Mechanisms

#### Interrupt Handler

**Interrupt Manager**

```typescript
// Location: src/langgraph/interrupts/InterruptManager.ts
export class InterruptManager {
	private activeInterrupts: Map<string, any> = new Map()

	async createInterrupt(type: string, data: any): Promise<void> {
		// Create interrupt for human-in-the-loop scenarios
		const interruptId = this.generateInterruptId()
		this.activeInterrupts.set(interruptId, {
			type,
			data,
			timestamp: Date.now(),
		})

		// Notify UI of interrupt
		await this.notifyUI(interruptId, type, data)
	}

	async resolveInterrupt(interruptId: string, resolution: any): Promise<void> {
		// Resolve interrupt and continue execution
		const interrupt = this.activeInterrupts.get(interruptId)
		if (!interrupt) {
			throw new Error(`Interrupt not found: ${interruptId}`)
		}

		// Resume graph execution with resolution
		await this.resumeExecution(interruptId, resolution)
		this.activeInterrupts.delete(interruptId)
	}

	private generateInterruptId(): string {
		return `interrupt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
	}
}
```

**Command Objects**

```typescript
// Location: src/langgraph/commands/CommandObjects.ts
export abstract class Command {
	abstract type: string
	abstract data: any

	abstract execute(state: any): Promise<any>
}

export class ModifyStateCommand extends Command {
	type = "modify_state"

	constructor(public data: { key: string; value: any }) {
		super()
	}

	async execute(state: any): Promise<any> {
		return {
			...state,
			[this.data.key]: this.data.value,
		}
	}
}

export class AddMessageCommand extends Command {
	type = "add_message"

	constructor(public data: { message: any; role: string }) {
		super()
	}

	async execute(state: any): Promise<any> {
		return {
			...state,
			messages: [
				...state.messages,
				{
					...this.data.message,
					role: this.data.role,
					timestamp: Date.now(),
				},
			],
		}
	}
}
```

### Checkpoint Integration

#### LangGraph Checkpoint Adapter

**Checkpoint Adapter**

```typescript
// Location: src/langgraph/checkpoints/LangGraphCheckpointAdapter.ts
import { BaseCheckpointSaver } from "@langchain/langgraph"
import { CheckpointService } from "../../services/checkpoints/CheckpointService"

export class LangGraphCheckpointAdapter extends BaseCheckpointSaver {
	private checkpointService: CheckpointService

	constructor(checkpointService: CheckpointService) {
		super()
		this.checkpointService = checkpointService
	}

	async get(config: any): Promise<any> {
		// Get checkpoint from existing service
		const checkpoint = await this.checkpointService.getCheckpoint(config.thread_id)
		return this.convertToLangGraphFormat(checkpoint)
	}

	async put(config: any, checkpoint: any): Promise<void> {
		// Save checkpoint using existing service
		const formattedCheckpoint = this.convertFromLangGraphFormat(checkpoint)
		await this.checkpointService.saveCheckpoint(config.thread_id, formattedCheckpoint)
	}

	private convertToLangGraphFormat(checkpoint: any): any {
		// Convert existing checkpoint format to LangGraph format
		return {
			id: checkpoint.id,
			thread_id: checkpoint.threadId,
			checkpoint: {
				v: 1,
				id: checkpoint.id,
				ts: checkpoint.timestamp,
				channel_values: checkpoint.state,
				channel_versions: checkpoint.versions || {},
				versions_seen: checkpoint.versionsSeen || {},
			},
		}
	}

	private convertFromLangGraphFormat(checkpoint: any): any {
		// Convert LangGraph checkpoint format to existing format
		return {
			id: checkpoint.checkpoint.id,
			threadId: checkpoint.thread_id,
			timestamp: checkpoint.checkpoint.ts,
			state: checkpoint.checkpoint.channel_values,
			versions: checkpoint.checkpoint.channel_versions,
			versionsSeen: checkpoint.checkpoint.versions_seen,
		}
	}
}
```

### Task Migration

#### Task Class Migration

**Migrated Task Class**

```typescript
// Location: src/core/task/MigratedTask.ts
import { StateGraphManager } from "../../langgraph/StateGraphManager"
import { Task } from "./Task"

export class MigratedTask extends Task {
	private stateGraphManager: StateGraphManager

	constructor(config: any) {
		super(config)
		this.stateGraphManager = new StateGraphManager(this.checkpointService)
		this.stateGraphManager.initializeGraph(this.getStateGraphConfig())
	}

	protected async execute(): Promise<void> {
		// Replace manual loop with StateGraph execution
		const initialState = this.createInitialState()

		try {
			const result = await this.stateGraphManager.execute(initialState)
			this.handleCompletion(result)
		} catch (error) {
			this.handleError(error)
		}
	}

	protected async stream(): Promise<void> {
		// Stream execution for real-time updates
		const initialState = this.createInitialState()

		try {
			const stream = this.stateGraphManager.stream(initialState)

			for await (const chunk of stream) {
				await this.handleStreamChunk(chunk)
			}
		} catch (error) {
			this.handleError(error)
		}
	}

	private createInitialState(): any {
		return {
			messages: this.messages,
			availableTools: this.getAvailableTools(),
			next: "callModel",
			iterations: 0,
		}
	}

	private getStateGraphConfig(): any {
		return {
			maxIterations: this.config.maxIterations || 100,
			enableInterrupts: this.config.enableInterrupts || true,
			checkpointInterval: this.config.checkpointInterval || 60000,
		}
	}
}
```

## Testing Strategy

### Test Structure

#### Unit Tests

**StateGraph Manager Tests**

```typescript
// Location: src/tests/langgraph/StateGraphManager.test.ts
import { describe, test, expect, beforeEach, afterEach } from "vitest"
import { StateGraphManager } from "../../langgraph/StateGraphManager"
import { mockCheckpointService } from "../mocks/checkpointService"

describe("StateGraphManager", () => {
	let manager: StateGraphManager

	beforeEach(() => {
		manager = new StateGraphManager(mockCheckpointService)
	})

	test("should initialize graph with correct nodes", () => {
		manager.initializeGraph(DEFAULT_STATEGRAPH_CONFIG)

		const graph = manager.getGraph()
		expect(graph.nodes).toContain("callModel")
		expect(graph.nodes).toContain("tools")
	})

	test("should execute graph and return result", async () => {
		manager.initializeGraph(DEFAULT_STATEGRAPH_CONFIG)

		const result = await manager.execute({
			messages: [{ role: "user", content: "test" }],
			availableTools: [],
		})

		expect(result).toBeDefined()
		expect(result.messages).toHaveLength(2) // user + assistant
	})
})
```

**Interrupt Manager Tests**

```typescript
// Location: src/tests/langgraph/interrupts/InterruptManager.test.ts
import { describe, test, expect, beforeEach } from "vitest"
import { InterruptManager } from "../../../langgraph/interrupts/InterruptManager"

describe("InterruptManager", () => {
	let interruptManager: InterruptManager

	beforeEach(() => {
		interruptManager = new InterruptManager()
	})

	test("should create interrupt with unique ID", async () => {
		await interruptManager.createInterrupt("user_input", { question: "test" })

		const interrupts = interruptManager.getActiveInterrupts()
		expect(interrupts).toHaveLength(1)
		expect(interrupts[0].type).toBe("user_input")
	})

	test("should resolve interrupt and resume execution", async () => {
		const interruptId = await interruptManager.createInterrupt("user_input", { question: "test" })

		await interruptManager.resolveInterrupt(interruptId, { answer: "response" })

		const interrupts = interruptManager.getActiveInterrupts()
		expect(interrupts).toHaveLength(0)
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
		"@langchain/langgraph": "^0.0.1",
		"@langchain/core": "^0.1.0",
		"uuid": "^9.0.0"
	}
}
```

#### Configuration Files

```typescript
// Location: src/config/LangGraphConfig.ts
export const LANGGRAPH_CONFIG = {
	// StateGraph configuration settings
	maxIterations: 100,
	enableInterrupts: true,
	checkpointInterval: 60000,
	toolTimeout: 30000,

	// Interrupt configuration
	interruptTimeout: 300000, // 5 minutes
	maxActiveInterrupts: 10,

	// Performance settings
	enableStreaming: true,
	bufferSize: 1000,
	compressionEnabled: true,
}
```

## Migration Strategy

### Phase 1: StateGraph Foundation

1. Create base StateGraph manager and configuration
2. Implement basic nodes (callModel, tools)
3. Add conditional edge routing
4. Create checkpoint adapter for existing service
5. Implement basic interrupt handling
6. Create comprehensive unit tests

### Phase 2: Advanced Features

1. Implement interrupt mechanisms with UI integration
2. Create command object system for state modification
3. Add streaming execution support
4. Implement parallel execution capabilities
5. Create plugin system for custom nodes
6. Add performance monitoring and optimization

### Phase 3: Migration and Integration

1. Migrate existing Task class to use StateGraph
2. Update tool dispatch to work with new architecture
3. Integrate with existing checkpoint service
4. Update UI to handle interrupts and streaming
5. Create migration utilities for existing tasks
6. Add comprehensive testing and validation

### Phase 4: Production Deployment

1. Optimize performance for production workloads
2. Add monitoring and alerting
3. Create deployment automation
4. Implement rollback procedures
5. Add comprehensive documentation
6. Create training materials for developers

## Best Practices

### Code Organization

- Follow existing file structure patterns from `src/core/`
- Use TypeScript interfaces for type safety
- Implement comprehensive error handling
- Maintain backward compatibility during migration
- Use dependency injection for testability

### State Management

- Keep state immutable and use functional updates
- Implement proper state serialization for checkpoints
- Use clear state transition patterns
- Minimize state size for performance
- Implement state validation and error recovery

### Interrupt Handling

- Design interrupts to be resumable
- Implement proper interrupt cleanup
- Use unique IDs for interrupt tracking
- Provide clear interrupt resolution paths
- Handle interrupt timeouts gracefully

### Performance

- Monitor execution times and resource usage
- Implement streaming for long-running operations
- Use efficient state serialization
- Optimize checkpoint frequency
- Implement proper resource cleanup

### Testing

- Write comprehensive unit tests for all components
- Test interrupt scenarios and edge cases
- Include performance benchmarks
- Test migration scenarios thoroughly
- Validate checkpoint restore functionality

## Common Patterns

### State Updates

```typescript
// Immutable state update pattern
const updateState = (currentState: any, updates: any): any => {
	return {
		...currentState,
		...updates,
		timestamp: Date.now(),
	}
}
```

### Error Handling

```typescript
// Standard error handling pattern
try {
	const result = await someOperation()
	return result
} catch (error) {
	console.error(`Operation failed: ${error.message}`)

	// Create error state for recovery
	return {
		...currentState,
		error: error.message,
		status: "error",
		timestamp: Date.now(),
	}
}
```

### Checkpoint Integration

```typescript
// Checkpoint creation pattern
const createCheckpoint = async (state: any): Promise<void> => {
	const checkpoint = {
		id: generateCheckpointId(),
		threadId: state.threadId,
		timestamp: Date.now(),
		state: serializeState(state),
		versions: getStateVersions(state),
	}

	await checkpointService.saveCheckpoint(state.threadId, checkpoint)
}
```

This implementation guide provides foundation for successfully implementing Loop Migration to LangGraph/Agent Executor PRD while maintaining compatibility with existing systems and following established architectural patterns.
