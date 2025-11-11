# Context for Task 2.3: Create LangChain-compatible wrapper for executeCommandTool with Zod schema validation

- **Status**: To Do
- **Source PRD**: PRDs/04-tool-standardization-testing/tasklists/tasklist_sprint_02.md
- **Target Files**:
    - `src/tools/wrappers/ExecuteCommandToolWrapper.ts`
    - `src/tools/schemas/ExecuteCommandSchema.ts`
    - `src/tools/validation/CommandValidation.ts`
- **Generated**: 2025-11-11
- **Last Updated**: 2025-11-11

---

## 1. Current Code Analysis (Internal)

### File: `src/core/tools/executeCommandTool.ts`

**Current Implementation:**

```typescript
export async function executeCommandTool(
	task: Task,
	block: ToolUse,
	askApproval: AskApproval,
	handleError: HandleError,
	pushToolResult: PushToolResult,
	removeClosingTag: RemoveClosingTag,
) {
	// Command execution logic with retry integration
	// Terminal process management (lines 150-200)
	// Error handling and approval workflows
	// Command validation and security checks
}
```

**Key Components:**

- **Retry Integration**: Uses `RetryIntegration` for automatic retry logic
- **Terminal Management**: Integrates with `TerminalRegistry` and `Terminal` classes
- **Command Validation**: Includes rooIgnore validation and command timeout handling
- **Process Management**: Handles background processes, timeouts, and cleanup
- **Output Handling**: Real-time output streaming and status updates

**Architecture Pattern:**

- Function-based tool implementation with dependency injection
- Error handling through `handleError` callback
- User approval workflow via `askApproval`
- Result pushing through `pushToolResult`

### Related Internal Patterns

**Zod Schema Usage (from codebase analysis):**

- Extensive Zod validation patterns found in:
    - `src/services/mcp/McpHub.ts` - Server configuration schemas
    - `src/core/config/ProviderSettingsManager.ts` - Provider settings validation
    - `src/workers/types.ts` - Type definitions with Zod inference
    - Multiple provider configuration files with Zod schemas

**Tool Integration Points:**

- `Task` class provides access to terminal processes
- `ToolUse` interface defines command parameter structure
- Integration with VSCode configuration system for timeouts and allowlists

---

## 2. External Best Practices (GitHub)

### Best Practice Example 1: LangChain DynamicStructuredTool Pattern

**Source**: https://github.com/langchain-ai/langchainjs/blob/671a9498b841e855eea06ac2dbf8c2931425d7c3/libs/langchain-mcp-adapters/src/tools.ts

**Key Pattern:**

```typescript
const dst = new DynamicStructuredTool({
	name: `${toolNamePrefix}${tool.name}`,
	description: tool.description || "",
	schema: tool.inputSchema,
	responseFormat: "content_and_artifact",
	metadata: { annotations: tool.annotations },
	defaultConfig: defaultToolTimeout ? { timeout: defaultToolTimeout } : undefined,
	func: async (args: Record<string, unknown>, _runManager?: CallbackManagerForToolRun, config?: RunnableConfig) => {
		return _callTool({
			serverName,
			toolName: tool.name,
			client,
			args,
			config,
			useStandardContentBlocks,
			outputHandling,
			onProgress: options?.onProgress,
			beforeToolCall: options?.beforeToolCall,
			afterToolCall: options?.afterToolCall,
		})
	},
})
```

**Key Takeaways:**

- **Schema Validation**: Zod schema directly mapped to tool input validation
- **Response Format**: Uses `content_and_artifact` for rich responses
- **Configuration**: Timeout and callback management through `RunnableConfig`
- **Error Handling**: Custom `ToolException` class with Zod error prettification
- **Progress Callbacks**: Real-time progress reporting support

### Best Practice Example 2: Command Execution Security

**Pattern**: Command validation and sanitization

- **Timeout Management**: Configurable timeouts with allowlist exceptions
- **Security**: Command injection prevention through validation
- **Process Isolation**: Separate terminal processes for safety

---

## 3. Internal Knowledge Base (Memory)

No cached knowledge found for LangChain tool wrappers or command validation patterns.

---

## 4. Suggested Implementation Plan

### Prerequisites

1. [ ] **Verify LangChain dependencies installed from Task 1.1**
2. [ ] **Confirm base wrapper class exists from Task 1.2**
3. [ ] **Ensure Zod validation system ready from Task 1.3**
4. [ ] **Check transitional layer available from Task 1.4**

### Implementation Steps

#### Step 1: Create ExecuteCommandSchema

**File**: `src/tools/schemas/ExecuteCommandSchema.ts`

```typescript
import { z } from "zod"

export const ExecuteCommandSchema = z.object({
	command: z.string().describe("The command to execute in the terminal").min(1, "Command cannot be empty"),
	cwd: z.string().optional().describe("The working directory for command execution (defaults to task.cwd)"),
	timeout: z.number().optional().describe("Command timeout in seconds (0 = no timeout)"),
	env: z.record(z.string(), z.string()).optional().describe("Environment variables for the command execution"),
})

export type ExecuteCommandInput = z.infer<typeof ExecuteCommandSchema>
```

#### Step 2: Create CommandValidation

**File**: `src/tools/validation/CommandValidation.ts`

```typescript
import { z } from "zod"
import { ExecuteCommandInput, ExecuteCommandSchema } from "../schemas/ExecuteCommandSchema"

export class CommandValidation {
	static validateCommand(input: unknown): ExecuteCommandInput {
		return ExecuteCommandSchema.parse(input)
	}

	static sanitizeCommand(command: string): string {
		// Basic command sanitization to prevent injection
		return command.trim()
	}

	static validateWorkingDirectory(cwd: string, taskCwd: string): string {
		if (!cwd) return taskCwd
		if (path.isAbsolute(cwd)) return cwd
		return path.resolve(taskCwd, cwd)
	}
}
```

#### Step 3: Create ExecuteCommandToolWrapper

**File**: `src/tools/wrappers/ExecuteCommandToolWrapper.ts`

```typescript
import { DynamicStructuredTool } from "@langchain/core/tools"
import { z } from "zod"
import { Task } from "../../../core/task/Task"
import { ExecuteCommandInput, ExecuteCommandSchema } from "../schemas/ExecuteCommandSchema"
import { CommandValidation } from "../validation/CommandValidation"

export class ExecuteCommandToolWrapper {
	private task: Task

	constructor(task: Task) {
		this.task = task
	}

	createTool(): DynamicStructuredTool {
		return new DynamicStructuredTool({
			name: "execute_command",
			description: "Execute a command in the terminal with real-time output and error handling",
			schema: ExecuteCommandSchema,
			func: async (input: ExecuteCommandInput) => {
				return this.executeCommand(input)
			},
		})
	}

	private async executeCommand(input: ExecuteCommandInput): Promise<string> {
		const { command, cwd, timeout = 0, env = {} } = input

		// Validate and sanitize inputs
		const validatedCommand = CommandValidation.sanitizeCommand(command)
		const validatedCwd = CommandValidation.validateWorkingDirectory(cwd || "", this.task.cwd)

		// Create ToolUse block for legacy integration
		const block: ToolUse = {
			tool: "execute_command",
			params: {
				command: validatedCommand,
				cwd: validatedCwd !== this.task.cwd ? validatedCwd : undefined,
			},
			partial: false,
		}

		// Execute using existing tool logic
		return new Promise((resolve, reject) => {
			const askApproval = (tool: string, message: string) => {
				// Forward to existing approval system
				return this.task.ask(tool, message)
			}

			const handleError = (operation: string, error: unknown) => {
				// Forward to existing error handling
				return this.task.handleError(operation, error)
			}

			const pushToolResult = (result: string) => {
				resolve(result)
			}

			// Call existing executeCommandTool with adapted parameters
			executeCommandTool(
				this.task,
				block,
				askApproval,
				handleError,
				pushToolResult,
				(tag: string) => tag, // removeClosingTag implementation
			)
		})
	}
}
```

#### Step 4: Integration with Legacy System

- Preserve existing retry integration
- Maintain terminal process management
- Keep approval workflow intact
- Ensure error handling consistency

#### Step 5: Add Tests

**File**: `src/tools/wrappers/__tests__/ExecuteCommandToolWrapper.test.ts`

```typescript
import { describe, test, expect } from "vitest"
import { ExecuteCommandToolWrapper } from "../ExecuteCommandToolWrapper"
import { Task } from "../../../../core/task/Task"

describe("ExecuteCommandToolWrapper", () => {
	let wrapper: ExecuteCommandToolWrapper
	let mockTask: Task

	beforeEach(() => {
		mockTask = {
			ask: vi.fn(),
			handleError: vi.fn(),
			cwd: "/test",
		} as Task
		wrapper = new ExecuteCommandToolWrapper(mockTask)
	})

	test("should create tool with correct name and description", () => {
		const tool = wrapper.createTool()
		expect(tool.name).toBe("execute_command")
		expect(tool.description).toContain("terminal")
	})

	test("should validate command input", async () => {
		const tool = wrapper.createTool()

		// Test valid command
		await expect(tool.func({ command: "echo hello" })).resolves.not.toThrow()

		// Test invalid command (empty)
		await expect(tool.func({ command: "" })).rejects.toThrow()
	})

	test("should handle working directory validation", async () => {
		const tool = wrapper.createTool()

		// Test absolute path
		const result = await tool.func({
			command: "pwd",
			cwd: "/absolute/path",
		})
		expect(result).toContain("/absolute/path")
	})
})
```

---

## 5. Dependencies

### Task Dependencies

- [ ] **Task 2.1**: Create LangChain-compatible wrapper for writeToFileTool with Zod schema validation
    - Reason: Task 2.1 should be completed first to establish base wrapper patterns
    - Status: Not started

### File Dependencies

- [ ] **src/core/tools/executeCommandTool.ts** - Must be preserved and wrapped
- [ ] **LangChain dependencies** - Must be installed from Task 1.1
- [ ] **Base wrapper class** - Should exist from Task 1.2

### External Dependencies

- [ ] **@langchain/core**: For DynamicStructuredTool
- [ ] **zod**: For schema validation (already installed)

---

## 6. Important Considerations

### Security Requirements

- **Command Injection Prevention**: Validate all command inputs to prevent injection attacks
- **Path Traversal Prevention**: Validate working directory paths
- **Environment Variable Sanitization**: Validate and sanitize environment variables

### Performance Considerations

- **Timeout Management**: Implement configurable timeouts to prevent hanging commands
- **Resource Cleanup**: Ensure proper cleanup of terminal processes
- **Memory Management**: Monitor memory usage during command execution

### Integration Requirements

- **Backward Compatibility**: Ensure existing tool functionality continues to work
- **Error Handling**: Maintain existing error handling patterns
- **Approval Workflow**: Preserve existing user approval mechanisms

### Testing Requirements

- **Unit Tests**: Test all Zod validation scenarios
- **Integration Tests**: Test with existing task management system
- **Edge Cases**: Test timeout, cancellation, and error scenarios

---

## 7. Validation Steps

### Pre-Implementation

1. [ ] Run type checking: `tsc --noEmit`
2. [ ] Verify schema compilation: Check Zod schema parsing
3. [ ] Test integration: Ensure wrapper works with existing task system

### Post-Implementation

1. [ ] Run unit tests: `vitest run src/tools/wrappers/__tests__/ExecuteCommandToolWrapper.test.ts`
2. [ ] Verify functionality: Test command execution with various inputs
3. [ ] Check performance: Ensure minimal overhead compared to direct tool calls
4. [ ] Integration testing: Test within full task execution context

---

## 8. Notes and Warnings

### Potential Issues

- **Complex Integration**: The executeCommandTool has complex retry and terminal management logic
- **State Management**: Need to ensure proper state preservation during wrapper execution
- **Error Mapping**: Zod validation errors must map appropriately to existing error handling

### Breaking Changes

- None expected - this is a wrapper implementation that preserves existing functionality

---

**Context Generated By**: context-engineer agent
**Review Status**: Pending Review
**Next Step**: Implementation by code agent
