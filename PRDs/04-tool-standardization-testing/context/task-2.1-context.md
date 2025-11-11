# Context for Task 2.1: Create LangChain-compatible wrapper for writeToFileTool with Zod schema validation

- **Status**: To Do
- **Source PRD**: PRDs/04-tool-standardization-testing/tasklists/tasklist_sprint_02.md
- **Target Files**:
    - `src/tools/wrappers/WriteToFileToolWrapper.ts`
    - `src/tools/schemas/WriteToFileSchema.ts`
    - `src/tools/wrappers/base/LangGraphToolWrapper.ts`
- **Generated**: 2025-11-11
- **Last Updated**: 2025-11-11

---

## 1. Current Code Analysis

### File: `src/core/tools/writeToFileTool.ts`

**Current Implementation:**

```typescript
export async function writeToFileTool(
	cline: Task,
	block: ToolUse,
	askApproval: AskApproval,
	handleError: HandleError,
	pushToolResult: PushToolResult,
	removeClosingTag: RemoveClosingTag,
): Promise<void>
```

**Key Parameter Extraction Patterns (lines 28-52):**

```typescript
const relPath: string | undefined = block.params.path
let newContent: string | undefined = block.params.content
let predictedLineCount: number | undefined = parseInt(block.params.line_count ?? "0")
```

**Core Logic Flow:**

1. Parameter validation (path, content, line_count)
2. Access control via `cline.rooIgnoreController?.validateAccess(relPath)`
3. File existence detection and edit type determination
4. Content preprocessing (markdown cleanup, HTML entity unescaping)
5. Diff view handling vs direct write based on `preventFocusDisruption` experiment
6. Code omission detection and validation
7. Approval workflow integration
8. File writing with proper error handling

**Error Handling Patterns:**

- Uses `cline.recordToolError()` for tracking mistakes
- Uses `handleError("writing file", error)` for consistent error reporting
- Uses `pushToolResult()` for response delivery

---

## 2. LangChain Integration Requirements

### LangChain StructuredTool Interface Pattern

Based on external research from `langchain-mcp-tools-ts` and codebase analysis:

```typescript
import { DynamicStructuredTool } from "@langchain/core/tools"
import { z } from "zod"

export const writeToFileLangChainTool = new DynamicStructuredTool({
	name: "write_to_file",
	description: "Write content to a file",
	schema: z.object({
		path: z.string(),
		content: z.string(),
		line_count: z.number().optional(),
	}),
	func: async ({ path, content, line_count }, context) => {
		// Implementation logic here
	},
})
```

### Key Integration Points

1. **Schema Validation**: Replace XML parameter parsing with Zod schema validation
2. **Error Handling**: Maintain existing `handleError` and `pushToolResult` patterns
3. **Approval Flow**: Preserve existing `askApproval` integration
4. **Context Preservation**: Maintain `cline` Task context and all related functionality
5. **File Operations**: Reuse existing file writing logic and validation

---

## 3. Implementation Strategy

### Phase 1: Schema Definition

**File**: `src/tools/schemas/WriteToFileSchema.ts`

```typescript
import { z } from "zod"

export const WriteToFileSchema = z.object({
	path: z.string().min(1, "File path is required"),
	content: z.string().min(1, "File content is required"),
	line_count: z.number().int().positive().optional(),
})

export type WriteToFileInput = z.infer<typeof WriteToFileSchema>
```

### Phase 2: Base Wrapper Class

**File**: `src/tools/wrappers/base/LangGraphToolWrapper.ts`

```typescript
import { DynamicStructuredTool } from "@langchain/core/tools"
import { Task } from "../../../core/task/Task"
import { AskApproval, HandleError, PushToolResult, RemoveClosingTag } from "../../../../shared/tools"

export abstract class LangGraphToolWrapper {
	protected cline: Task
	protected askApproval: AskApproval
	protected handleError: HandleError
	protected pushToolResult: PushToolResult
	protected removeClosingTag: RemoveClosingTag

	constructor(
		cline: Task,
		askApproval: AskApproval,
		handleError: HandleError,
		pushToolResult: PushToolResult,
		removeClosingTag: RemoveClosingTag,
	) {
		this.cline = cline
		this.askApproval = askApproval
		this.handleError = handleError
		this.pushToolResult = pushToolResult
		this.removeClosingTag = removeClosingTag
	}

	protected abstract executeTool(params: any): Promise<string>
}
```

### Phase 3: WriteToFile Tool Wrapper

**File**: `src/tools/wrappers/WriteToFileToolWrapper.ts`

```typescript
import { DynamicStructuredTool } from "@langchain/core/tools"
import { WriteToFileSchema, WriteToFileInput } from "../schemas/WriteToFileSchema"
import { LangGraphToolWrapper } from "./base/LangGraphToolWrapper"
import { writeToFileTool } from "../../../core/tools/writeToFileTool"

export class WriteToFileToolWrapper extends LangGraphToolWrapper {
	public static create() {
		return new DynamicStructuredTool({
			name: "write_to_file",
			description: "Write content to a file with proper validation and error handling",
			schema: WriteToFileSchema,
			func: async (params: WriteToFileInput, context) => {
				// Create wrapper instance with proper context
				const wrapper = new WriteToFileToolWrapper(
					context.cline as any, // Type assertion for compatibility
					context.askApproval as any,
					context.handleError as any,
					context.pushToolResult as any,
					context.removeClosingTag as any,
				)

				return await wrapper.executeTool(params)
			},
		})
	}

	protected async executeTool(params: WriteToFileInput): Promise<string> {
		// Convert LangChain parameters to existing ToolUse format
		const block: ToolUse = {
			type: "tool_use",
			name: "write_to_file",
			params: {
				path: params.path,
				content: params.content,
				line_count: params.line_count?.toString(),
			},
			partial: false,
		}

		// Create promise to capture result
		let result: string = ""

		// Execute existing tool logic
		await writeToFileTool(
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
	}
}

export const writeToFileLangChainTool = WriteToFileToolWrapper.create()
```

---

## 4. Dependencies Analysis

### Prerequisites from Task 1.1-1.4

Based on tasklist analysis, the following must be completed first:

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

### Current Dependencies

From `src/core/tools/writeToFileTool.ts` analysis:

```typescript
// Core dependencies already available
import { Task } from "../task/Task"
import { ClineSayTool } from "../../shared/ExtensionMessage"
import { formatResponse } from "../prompts/responses"
import { ToolUse, AskApproval, HandleError, PushToolResult, RemoveClosingTag } from "../../shared/tools"
import { RecordSource } from "../context-tracking/FileContextTrackerTypes"
import { fileExistsAtPath } from "../../utils/fs"
import { stripLineNumbers, everyLineHasLineNumbers } from "../../integrations/misc/extract-text"
import { getReadablePath } from "../../utils/path"
import { isPathOutsideWorkspace } from "../../utils/pathUtils"
import { detectCodeOmission } from "../../integrations/editor/detect-omission"
import { unescapeHtmlEntities } from "../../utils/text-normalization"
import { DEFAULT_WRITE_DELAY_MS } from "@roo-code/types"
import { EXPERIMENT_IDS, experiments } from "../../shared/experiments"
```

---

## 5. Testing Strategy

### Unit Test Structure

**File**: `src/tests/tools/wrappers/WriteToFileToolWrapper.test.ts`

```typescript
import { describe, test, expect, vi, beforeEach } from "vitest"
import { WriteToFileToolWrapper } from "../../../tools/wrappers/WriteToFileToolWrapper"
import { Task } from "../../../core/task/Task"

describe("WriteToFileToolWrapper", () => {
	let mockTask: Task
	let mockAskApproval: any
	let mockHandleError: any
	let mockPushToolResult: any
	let mockRemoveClosingTag: any

	beforeEach(() => {
		mockTask = {} as Task
		mockAskApproval = vi.fn()
		mockHandleError = vi.fn()
		mockPushToolResult = vi.fn()
		mockRemoveClosingTag = vi.fn()
	})

	test("should create valid LangChain tool", () => {
		const tool = WriteToFileToolWrapper.create()

		expect(tool.name).toBe("write_to_file")
		expect(tool.description).toContain("Write content to a file")
		expect(tool.schema).toBeDefined()
	})

	test("should validate schema correctly", async () => {
		const tool = WriteToFileToolWrapper.create()

		// Test valid input
		const validInput = {
			path: "test.txt",
			content: "test content",
			line_count: 1,
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

	test("should handle schema validation errors", async () => {
		const tool = WriteToFileToolWrapper.create()

		// Test invalid input
		const invalidInput = {
			path: "", // Invalid: empty path
			content: "test content",
		}

		await expect(tool.func(invalidInput, {} as any)).rejects.toThrow()
	})
})
```

### Integration Testing

- Test with existing task loop integration
- Verify approval flow preservation
- Test error handling and recovery
- Validate file writing functionality

---

## 6. Migration Considerations

### Backward Compatibility

1. **Parameter Mapping**: Ensure seamless conversion between LangChain and existing ToolUse formats
2. **Error Handling**: Preserve existing error messages and recovery patterns
3. **Approval Flow**: Maintain existing user approval mechanisms
4. **File Operations**: Keep all existing file validation and security controls

### Performance Impact

- Minimal overhead expected from schema validation
- Reuse of existing file writing logic maintains performance
- Additional abstraction layer should be <5% performance impact

### Security Considerations

- Maintain existing file access controls via `cline.rooIgnoreController`
- Preserve path traversal prevention
- Keep existing write protection mechanisms
- Ensure proper input sanitization

---

## 7. Implementation Checklist

### Pre-Implementation

- [ ] Verify LangChain dependencies installed from Task 1.1
- [ ] Confirm base wrapper class exists from Task 1.2
- [ ] Ensure Zod validation system ready from Task 1.3
- [ ] Check transitional layer available from Task 1.4

### Implementation Steps

1. [ ] Create WriteToFileSchema with Zod validation
2. [ ] Implement WriteToFileToolWrapper extending base class
3. [ ] Create LangChain DynamicStructuredTool instance
4. [ ] Add parameter mapping between LangChain and ToolUse formats
5. [ ] Integrate with existing file writing logic
6. [ ] Preserve error handling and approval patterns
7. [ ] Add comprehensive unit tests
8. [ ] Create integration tests with task loop

### Post-Implementation

- [ ] Run TypeScript compilation: `cd src && npm run check-types`
- [ ] Execute unit tests: `cd src && npx vitest run tools/wrappers/WriteToFileToolWrapper.test.ts`
- [ ] Verify integration with existing tools
- [ ] Test backward compatibility
- [ ] Performance benchmarking against original implementation

---

## 8. Risk Mitigation

### Technical Risks

1. **Schema Validation Conflicts**: Zod validation may reject previously valid inputs

    - **Mitigation**: Comprehensive testing with existing test cases
    - **Fallback**: Graceful degradation to original tool if validation fails

2. **Parameter Mapping Issues**: Type conversion between formats may cause data loss

    - **Mitigation**: Careful type preservation and validation
    - **Testing**: Extensive edge case testing

3. **Performance Regression**: Additional abstraction layer may slow execution
    - **Mitigation**: Performance monitoring and optimization
    - **Benchmark**: Baseline measurement against current implementation

### Integration Risks

1. **Task Loop Compatibility**: New wrapper may break existing execution flow

    - **Mitigation**: Transitional layer from Task 1.4
    - **Testing**: End-to-end integration testing

2. **Approval Flow Disruption**: Changes may affect user approval mechanism
    - **Mitigation**: Preserve existing approval interface exactly
    - **Validation**: User acceptance testing

---

## 9. Success Criteria

### Functional Requirements

- [ ] LangChain StructuredTool interface compliance
- [ ] Zod schema validation for all parameters
- [ ] Backward compatibility with existing writeToFileTool
- [ ] Preservation of error handling patterns
- [ ] Maintenance of approval workflow
- [ ] File access control preservation

### Quality Requirements

- [ ] Unit test coverage >90%
- [ ] Integration test coverage >80%
- [ ] Performance overhead <5%
- [ ] TypeScript strict mode compliance
- [ ] No breaking changes to existing functionality

### Documentation Requirements

- [ ] Inline code documentation for all public methods
- [ ] Schema validation documentation
- [ ] Migration guide for existing code
- [ ] API documentation for new LangChain tool

---

## 10. External References

### LangChain Documentation

- [StructuredTool Interface](https://api.js.langchain.com/classes/_langchain_core.tools.StructuredTool.html)
- [DynamicStructuredTool](https://api.js.langchain.com/classes/_langchain_core.tools.DynamicStructuredTool.html)
- [Schema Validation with Zod](https://js.langchain.com/docs/modules/core_schema)

### MCP Integration Examples

- [langchain-mcp-tools-ts](https://github.com/hideya/langchain-mcp-tools-ts): Reference implementation
- [Schema Compatibility Guide](https://github.com/hideya/langchain-mcp-tools-ts/blob/main/README.md#llm-provider-schema-compatibility)

### Best Practices

- [TypeScript Strict Mode](https://www.typescriptlang.org/docs/handbook/compiler-options.html)
- [Zod Validation Patterns](https://zod.dev/)
- [Testing with Vitest](https://vitest.dev/)

---

**Note**: This context file provides comprehensive implementation guidance based on analysis of existing code patterns, external research, and established architectural patterns. All implementation steps should follow the existing codebase conventions and maintain backward compatibility.
