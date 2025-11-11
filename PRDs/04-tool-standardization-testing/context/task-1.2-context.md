# Context for Task 1.2: Create LangGraph tool wrapper base class with proper inheritance and interface compliance

- **Status**: To Do
- **Source PRD**: PRDs/04-tool-standardization-testing/tasklists/tasklist_sprint_01.md
- **Target Files**:
    - `src/tools/base/LangGraphToolWrapper.ts`
    - `src/tools/interfaces/ToolWrapper.ts`
    - `src/tools/types/ToolTypes.ts`
- **Generated**: 2025-11-11
- **Last Updated**: 2025-11-11

---

## 1. Current Code Analysis (Internal)

_Findings from `ast-grep-mcp` and `semantic_search`._

### File: `src/core/tools/useMcpToolTool.ts`

**Current Implementation:**

```typescript
// Key patterns from existing tool implementation
export async function useMcpToolTool(
	cline: Task,
	block: ToolUse,
	askApproval: AskApproval,
	handleError: HandleError,
	pushToolResult: PushToolResult,
	removeClosingTag: RemoveClosingTag,
): Promise<void>

interface McpToolParams {
	server_name?: string
	tool_name?: string
	arguments?: string
}

interface ToolUse {
	type: "tool_use"
	name: ToolName
	params: Partial<Record<ToolParamName, string>>
	partial: boolean
}
```

**Analysis Notes:**

- Current architecture pattern: Function-based tool execution with parameter validation
- Existing dependencies: Zod for validation, Vitest for testing
- Modification points: Need to create class-based wrapper system that extends LangChain StructuredTool

### File: `src/shared/tools.ts`

**Current Implementation:**

```typescript
export interface ToolUse {
	type: "tool_use"
	name: ToolName
	params: Partial<Record<ToolParamName, string>>
	partial: boolean
}

export type ToolResponse = string | Array<Anthropic.TextBlockParam | Anthropic.ImageBlockParam>

export type AskApproval = (
	type: ClineAsk,
	partialMessage?: string,
	progressStatus?: ToolProgressStatus,
	forceApproval?: boolean,
) => Promise<boolean>

export type HandleError = (action: string, error: Error) => Promise<void>

export type PushToolResult = (content: ToolResponse) => void
```

**Analysis Notes:**

- Current architecture pattern: Interface-based tool system with function signatures
- Existing dependencies: TypeScript interfaces, Zod validation
- Modification points: Need to create LangGraph-compatible wrapper classes

### Related Internal Patterns

**Similar Implementations Found:**

```typescript
// From RetryIntegration.ts - Tool wrapper patterns
static wrapUseMcpToolTool(
  originalUseMcpToolTool: typeof import("./useMcpToolTool").useMcpToolTool,
): typeof import("./useMcpToolTool").useMcpToolTool {
  const integration = new RetryIntegration()
  return async (
    task: Task,
    block: ToolUse,
    askApproval: AskApproval,
    handleError: HandleError,
    pushToolResult: PushToolResult,
    removeClosingTag: RemoveClosingTag,
  ) => {
    return integration.wrapToolExecution(
      task,
      "use_mcp_tool",
      originalUseMcpToolTool,
      block,
      askApproval,
      handleError,
      pushToolResult,
      removeClosingTag,
    )
  }
}
```

**Pattern Analysis:**

- Common patterns identified: Function wrapping, parameter validation, error handling
- Naming conventions: camelCase for functions, PascalCase for interfaces
- Code organization: Modular structure with separate interfaces and implementations

---

## 2. External Best Practices (GitHub)

_Findings from `github_mcp` for LangChain StructuredTool patterns._

### Best Practice Example 1: LangChain StructuredTool Implementation

**Source**: https://github.com/langchain-ai/langchainjs/blob/main/libs/langchain-core/src/tools/index.ts
**Stars**: 5,982,894 | **Language**: TypeScript

```typescript
export abstract class StructuredTool<
		SchemaT = ToolInputSchemaBase,
		SchemaOutputT = ToolInputSchemaOutputType<SchemaT>,
		SchemaInputT = ToolInputSchemaInputType<SchemaT>,
		ToolOutputT = ToolOutputType,
	>
	extends BaseLangChain<StructuredToolCallInput<SchemaT, SchemaInputT>, ToolOutputT | ToolMessage>
	implements StructuredToolInterface<SchemaT, SchemaInputT, ToolOutputT>
{
	abstract name: string
	abstract description: string
	abstract schema: SchemaT
	returnDirect = false
	verboseParsingErrors = false

	get lc_namespace() {
		return ["langchain", "tools"]
	}

	responseFormat?: ResponseFormat = "content"

	async invoke<
		TInput extends StructuredToolCallInput<SchemaT, SchemaInputT>,
		TConfig extends ToolRunnableConfig | undefined,
	>(input: TInput, config?: TConfig): Promise<ToolReturnType<TInput, TConfig, ToolOutputT>> {
		// Implementation with validation and error handling
	}
}
```

**Key Takeaways:**

- LangChain StructuredTool uses abstract base class with generic schema types
- Schema validation through Zod with type safety
- Built-in error handling and parameter parsing
- Response format flexibility (content vs content_and_artifact)
- Namespace organization with lc_namespace

### Best Practice Example 2: Tool Creation Patterns

**Source**: https://github.com/langchain-ai/langchainjs/blob/main/libs/langchain-core/src/tools/index.ts
**Stars**: 5,982,894 | **Language**: TypeScript

```typescript
// Dynamic tool creation
export function tool<SchemaT extends ZodStringV3, ToolOutputT = ToolOutputType>(
	func: RunnableFunc<InferInteropZodOutput<SchemaT>, ToolOutputT, ToolRunnableConfig>,
	fields: ToolWrapperParams<SchemaT>,
): DynamicTool<ToolOutputT>

// Structured tool creation
export function tool<SchemaT extends ZodObjectV3, ToolOutputT = ToolOutputType>(
	func: RunnableFunc<SchemaOutputT, ToolOutputT, ToolRunnableConfig>,
	fields: ToolWrapperParams<SchemaT>,
): DynamicStructuredTool<SchemaT, SchemaOutputT, SchemaInputT, ToolOutputT>
```

**Key Takeaways:**

- Factory functions for creating tools with type safety
- Support for both dynamic and structured tools
- Configuration management through ToolWrapperParams
- Runtime type inference and validation

---

## 3. Internal Knowledge Base (Memory)

_Findings from `mcp_memory` (Vector DB)._

### Primary Cached Knowledge

- **Topic**: "Tool Wrapper Implementation Analysis"
- **Entity Type**: Code Analysis
- **Last Used**: 2025-11-11
- **Content**: Current tools use XML-based calling with ToolUse interface, Execution flow through switch statement in presentAssistantMessage.ts:595-623, Key files identified: writeToFileTool.ts, readFileTool.ts, executeCommandTool.ts, useMcpToolTool.ts, Architectural patterns: LangChain StructuredTool interface, Zod schema validation, Vitest testing

### Related Patterns from Knowledge Graph

- **Entity**: "Implementation Patterns Identified"

    - **Observations**: Tool Wrapper Pattern: LangChain StructuredTool interface with Zod validation, Error Handling Pattern: Existing handleError and pushToolResult patterns, Configuration Pattern: Settings management from src/utils/config.ts, Testing Pattern: Vitest with comprehensive coverage and performance monitoring

- **Entity**: "Tool Wrapper Implementation Pattern"
    - **Observations**: LangChain StructuredTool interface with Zod schema validation, Tool wrapper base class extending StructuredTool, Legacy tool adapter for backward compatibility, Configuration management for tool parameters

**Note**: External research supplemented with cached knowledge for comprehensive implementation guidance.

---

## 4. Suggested Implementation Plan

_A step-by-step plan generated by the agent for the `code` agent._

### Prerequisites

1. [ ] Verify Task 1.1 (Set up development environment with LangChain dependencies) is completed
2. [ ] Ensure src/tools directory structure exists

### Implementation Steps

1. [ ] **Add Package Dependencies**

    - Add package `@langchain/core` version `^0.1.0` to `src/package.json`
    - Add package `@langchain/langgraph` version `^0.0.1` to `src/package.json`
    - Command: `cd src && npm install @langchain/core@^0.1.0 @langchain/langgraph@^0.0.1`

2. [ ] **Create Tool Types Interface**

    - File: `src/tools/interfaces/ToolWrapper.ts`
    - Purpose: Define common interfaces for tool wrappers
    - Template: LangChain StructuredToolInterface with TypeScript extensions

3. [ ] **Create Tool Types Definitions**

    - File: `src/tools/types/ToolTypes.ts`
    - Purpose: Define shared types for tool system
    - Template: Zod schema types, configuration interfaces

4. [ ] **Create LangGraph Tool Wrapper Base Class**

    - File: `src/tools/base/LangGraphToolWrapper.ts`
    - Purpose: Base class extending LangChain StructuredTool
    - Template: Abstract class with schema validation and error handling

5. [ ] **Update TypeScript Configuration**

    - File: `src/tsconfig.json`
    - Add: LangChain type definitions and path mappings

6. [ ] **Add Tests**

    - File: `src/tests/tools/langgraph-wrapper.test.ts`
    - Test cases: Schema validation, inheritance, error handling

### Validation Steps

1. [ ] Run unit tests: `cd src && npm test`
2. [ ] Verify TypeScript compilation: `cd src && npm run check-types`
3. [ ] Check integration with existing tool system

---

## 5. Dependencies

_Other tasks or files this task depends on._

### Task Dependencies

- [ ] **Task 1.1**: Set up development environment with necessary LangChain/LangGraph dependencies and configuration
    - Reason: LangChain dependencies must be installed before creating tool wrappers
    - Status: ☐ To Do

### File Dependencies

- [ ] **File `src/tools/interfaces/ToolWrapper.ts`**: Must be created first

    - Reason: Base interface definitions needed for wrapper implementation
    - Purpose: Define common interfaces for tool wrapper system

- [ ] **File `src/tools/types/ToolTypes.ts`**: Must be created first
    - Reason: Type definitions needed for wrapper implementation
    - Purpose: Define shared types and schemas

### External Dependencies

- [ ] **Package `@langchain/core`**: Must be installed
- [ ] **Package `@langchain/langgraph`**: Must be installed
- [ ] **Service `LangGraph execution environment`**: Must be configured

---

## 6. Notes and Warnings

### Important Considerations

- Follow LangChain StructuredTool interface requirements exactly
- Maintain backward compatibility with existing ToolUse interface
- Use Zod for schema validation as established in codebase
- Implement proper error handling following existing patterns
- Ensure TypeScript strict mode compatibility

### Potential Issues

- **Issue**: LangChain version compatibility with existing Node.js version
    - **Mitigation**: Verify package compatibility before installation
- **Issue**: Breaking changes to existing tool system
    - **Mitigation**: Create adapter pattern for backward compatibility

### Breaking Changes

- This implementation introduces new class-based tool wrapper system
- Existing function-based tools will need migration to new wrapper pattern
- Tool registration system may require updates for class-based tools

---

**Context Generated By**: context-engineer agent
**Review Status**: Pending Review
**Reviewer**: [Name/Agent]
