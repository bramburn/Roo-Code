# Migration Guide: Existing Tools to LangChain Wrappers

## Overview

This guide provides step-by-step instructions for migrating existing Roo Code tools to the new LangChain wrapper system while maintaining backward compatibility.

## Prerequisites

Before starting the migration, ensure you have:

1. ✅ LangChain dependencies installed
2. ✅ Base wrapper classes implemented
3. ✅ Validation system set up
4. ✅ Registry system configured
5. ✅ Transitional execution layer ready

## Migration Process

### Step 1: Analyze Existing Tool

First, analyze the current tool implementation:

```typescript
// Example: src/core/tools/exampleTool.ts
export async function exampleTool(
	cline: Task,
	block: ToolUse,
	askApproval: AskApproval,
	handleError: HandleError,
	pushToolResult: PushToolResult,
	removeClosingTag: RemoveClosingTag,
) {
	// Extract parameters
	const param1 = block.params.param1
	const param2 = block.params.param2

	// Validation logic
	if (!param1) {
		cline.consecutiveMistakeCount++
		cline.recordToolError("example_tool")
		pushToolResult(await cline.sayAndCreateMissingParamError("example_tool", "param1"))
		return
	}

	// Core logic
	const result = await performOperation(param1, param2)

	// Result handling
	pushToolResult(formatResponse.toolSuccess(result))
}
```

### Step 2: Create Zod Schema

Create a schema that matches the tool's parameters:

```typescript
// src/tools/schemas/ExampleToolSchema.ts
import { z } from "zod"

export const ExampleToolSchema = z
	.object({
		param1: z.string().min(1, "Parameter 1 is required"),
		param2: z.string().optional(),
		// Add validation for each parameter
	})
	.describe("Description of what this tool does")

export type ExampleToolInput = z.infer<typeof ExampleToolSchema>
```

### Step 3: Create Tool Wrapper

Create a wrapper class that extends `LangGraphToolWrapper`:

```typescript
// src/tools/wrappers/ExampleToolWrapper.ts
import { DynamicStructuredTool } from "@langchain/core/tools"
import { LangGraphToolWrapper, ToolWrapperConfig } from "./base/LangGraphToolWrapper"
import { ExampleToolSchema, ExampleToolInput } from "../schemas/ExampleToolSchema"
import { exampleTool } from "../../core/tools/exampleTool"

export class ExampleToolWrapper extends LangGraphToolWrapper {
	constructor(
		cline: Task,
		askApproval: AskApproval,
		handleError: HandleError,
		pushToolResult: PushToolResult,
		removeClosingTag: RemoveClosingTag,
	) {
		const config: ToolWrapperConfig = {
			toolName: "example_tool",
			description: "Description of what this tool does",
			zodSchema: ExampleToolSchema,
			legacyToolFunction: exampleTool,
		}

		super(cline, askApproval, handleError, pushToolResult, removeClosingTag, config)
	}

	public static create(
		cline: Task,
		askApproval: AskApproval,
		handleError: HandleError,
		pushToolResult: PushToolResult,
		removeClosingTag: RemoveClosingTag,
	): DynamicStructuredTool {
		const wrapper = new ExampleToolWrapper(cline, askApproval, handleError, pushToolResult, removeClosingTag)

		return wrapper.createLangChainTool()
	}

	protected override async executeTool(params: ExampleToolInput, context?: any): Promise<string> {
		// Add custom validation if needed
		this.validateCustomRules(params)

		// Call parent execute method
		return super.executeTool(params, context)
	}

	private validateCustomRules(params: ExampleToolInput): void {
		// Add any custom validation logic
		if (params.param1 && params.param1.length > 1000) {
			throw new Error("Parameter 1 is too long (max 1000 characters)")
		}
	}
}
```

### Step 4: Register the Tool

Register the tool in the registry:

```typescript
// In your tool initialization file
import { ToolRegistration } from "../tools/registry/ToolRegistration"
import { ExampleToolWrapper } from "./ExampleToolWrapper"

// Register with basic configuration
const tool = ExampleToolWrapper.create(
	context.cline,
	context.askApproval,
	context.handleError,
	context.pushToolResult,
	context.removeClosingTag,
)

ToolRegistration.registerFromLangChainTool(tool, "1.0.0", {
	category: "example",
	tags: ["example", "utility"],
	author: "Your Name",
})
```

### Step 5: Create Tests

Create comprehensive tests for the wrapper:

```typescript
// src/tests/tools/wrappers/ExampleToolWrapper.test.ts
import { describe, test, expect, vi, beforeEach } from "vitest"
import { ExampleToolWrapper } from "../../../tools/wrappers/ExampleToolWrapper"
import { ExampleToolSchema } from "../../../tools/schemas/ExampleToolSchema"

describe("ExampleToolWrapper", () => {
	let mockContext

	beforeEach(() => {
		mockContext = {
			cline: createMockTask(),
			askApproval: vi.fn().mockResolvedValue(true),
			handleError: vi.fn(),
			pushToolResult: vi.fn(),
			removeClosingTag: vi.fn((tag, content) => content),
		}
	})

	test("should create valid LangChain tool", () => {
		const tool = ExampleToolWrapper.create(
			mockContext.cline,
			mockContext.askApproval,
			mockContext.handleError,
			mockContext.pushToolResult,
			mockContext.removeClosingTag,
		)

		expect(tool.name).toBe("example_tool")
		expect(tool.description).toBeDefined()
		expect(tool.schema).toBeDefined()
	})

	test("should validate valid input", async () => {
		const tool = ExampleToolWrapper.create(
			mockContext.cline,
			mockContext.askApproval,
			mockContext.handleError,
			mockContext.pushToolResult,
			mockContext.removeClosingTag,
		)

		const validInput = {
			param1: "valid_value",
			param2: "optional_value",
		}

		const result = await tool.func(validInput, {} as any)
		expect(result).toBeDefined()
	})

	test("should reject invalid input", async () => {
		const tool = ExampleToolWrapper.create(
			mockContext.cline,
			mockContext.askApproval,
			mockContext.handleError,
			mockContext.pushToolResult,
			mockContext.removeClosingTag,
		)

		const invalidInput = {
			param1: "", // Invalid: empty string
			param2: "optional_value",
		}

		await expect(tool.func(invalidInput, {} as any)).rejects.toThrow()
	})
})
```

### Step 6: Update Configuration

Add the tool to your configuration:

```typescript
// src/transitional/TransitionalConfig.ts
export const CONFIG = {
	// ... other config
	allowedTools: [
		"example_tool",
		// ... other tools
	],
	customWrappers: {
		example_tool: "ExampleToolWrapper",
	},
}
```

## Migration Examples

### File Write Tool

```typescript
// Original validation
if (!relPath) {
	cline.consecutiveMistakeCount++
	cline.recordToolError("write_to_file")
	pushToolResult(await cline.sayAndCreateMissingParamError("write_to_file", "path"))
	return
}

// New schema validation
export const WriteToFileSchema = z.object({
	path: z
		.string()
		.min(1, "File path cannot be empty")
		.refine((path) => !path.includes(".."), {
			message: "Path traversal (..) is not allowed",
		}),
	content: z.string().min(1, "Content cannot be empty"),
	line_count: z.coerce.number().int().min(0).optional(),
})
```

### Command Execution Tool

```typescript
// Original validation
const dangerousPatterns = [/rm\s+-rf\s+\//, /format\s+[c-z]:/]
if (dangerousPatterns.some((pattern) => pattern.test(cmd.toLowerCase()))) {
	throw new Error("Command contains potentially dangerous operations")
}

// New schema validation
export const ExecuteCommandSchema = z.object({
	command: z
		.string()
		.min(1, "Command cannot be empty")
		.refine(
			(cmd) => {
				const dangerousPatterns = [/rm\s+-rf\s+\//, /format\s+[c-z]:/]
				return !dangerousPatterns.some((pattern) => pattern.test(cmd.toLowerCase()))
			},
			{
				message: "Command contains potentially dangerous operations",
			},
		),
	cwd: z.string().optional(),
	timeout: z.coerce.number().int().min(0).max(300).optional(),
})
```

## Common Migration Patterns

### Parameter Extraction

**Original Pattern:**

```typescript
const param1 = block.params.param1
const param2 = block.params.param2
```

**New Pattern:**

```typescript
protected override async executeTool(params: ExampleToolInput): Promise<string> {
    const param1 = params.param1
    const param2 = params.param2
    // ... rest of logic
}
```

### Error Handling

**Original Pattern:**

```typescript
try {
	const result = await operation()
	pushToolResult(result)
} catch (error) {
	await handleError("operation", error)
	throw error
}
```

**New Pattern:**

```typescript
try {
	const result = await super.executeTool(params)
	return result
} catch (error) {
	await this.handleError("operation", error as Error)
	throw error
}
```

### Approval Flow

**Original Pattern:**

```typescript
const approved = await askApproval("tool_use", partialMessage)
if (!approved) {
	return
}
```

**New Pattern:**

```typescript
// Handled automatically by base class
// No changes needed in wrapper
```

## Validation Migration

### Converting Manual Validation

**Before:**

```typescript
if (!path) {
	pushToolResult("Path is required")
	return
}
if (path.includes("..")) {
	pushToolResult("Path traversal not allowed")
	return
}
if (path.length > 260) {
	pushToolResult("Path too long")
	return
}
```

**After:**

```typescript
export const PathSchema = z
	.string()
	.min(1, "Path is required")
	.refine((path) => !path.includes(".."), {
		message: "Path traversal not allowed",
	})
	.refine((path) => path.length <= 260, {
		message: "Path too long (max 260 characters)",
	})
```

### Type Conversion

**Before:**

```typescript
let lineCount: number | undefined = parseInt(block.params.line_count ?? "0")
if (isNaN(lineCount)) {
	lineCount = 0
}
```

**After:**

```typescript
line_count: z.coerce.number().int().min(0).optional()
```

## Testing Migration

### Unit Test Conversion

Convert existing manual tests to schema validation tests:

**Before:**

```typescript
test("should validate file path", () => {
	const result = validatePath("valid/path.txt")
	expect(result.valid).toBe(true)

	const invalidResult = validatePath("../etc/passwd")
	expect(invalidResult.valid).toBe(false)
})
```

**After:**

```typescript
test("should validate file path", () => {
	const result = PathSchema.safeParse("valid/path.txt")
	expect(result.success).toBe(true)

	const invalidResult = PathSchema.safeParse("../etc/passwd")
	expect(invalidResult.success).toBe(false)
})
```

## Rollback Strategy

### Feature Flags

Use feature flags to enable/disable migration:

```typescript
const USE_NEW_WRAPPERS = process.env.ENABLE_NEW_WRAPPERS === "true"

if (USE_NEW_WRAPPERS) {
	// Use new wrapper system
	const tool = ExampleToolWrapper.create(context)
	return await tool.func(params)
} else {
	// Use legacy system
	return await exampleTool(cline, block, askApproval, handleError, pushToolResult, removeClosingTag)
}
```

### Gradual Migration

Migrate tools one at a time:

1. Start with non-critical tools
2. Monitor performance and errors
3. Migrate critical tools with careful testing
4. Maintain fallback to legacy system

## Troubleshooting

### Common Issues

**Schema Validation Errors**

- Check Zod schema syntax
- Verify parameter types match
- Test with both valid and invalid inputs

**Wrapper Registration Fails**

- Ensure proper import paths
- Check registry initialization
- Verify tool naming conventions

**Performance Regression**

- Monitor execution times
- Check for unnecessary validations
- Optimize parameter conversion

**Compatibility Issues**

- Test with existing workflows
- Verify approval flow preservation
- Check error handling consistency

### Debug Tools

**Schema Validation Debugging:**

```typescript
import { z } from "zod"

const schema = z.string().min(1)
const result = schema.safeParse("")

if (!result.success) {
	console.log("Error details:", result.error.issues)
	result.error.issues.forEach((issue) => {
		console.log(`${issue.path.join(".")}: ${issue.message}`)
	})
}
```

**Tool Registration Debugging:**

```typescript
console.log("Available tools:", registry.list())
console.log("Tool exists:", registry.has("tool_name"))
```

**Execution Debugging:**

```typescript
const stats = executor.getExecutionStats()
console.log("Execution statistics:", stats)
console.log("Recent errors:", executor.getRecentErrors())
```

## Best Practices

### Schema Design

1. Use descriptive error messages
2. Include comprehensive validation
3. Handle edge cases explicitly
4. Document parameter requirements

### Wrapper Implementation

1. Extend base wrapper classes
2. Preserve existing behavior
3. Add custom validation where needed
4. Maintain error handling patterns

### Testing

1. Test both success and failure cases
2. Include edge case testing
3. Test parameter validation
4. Verify backward compatibility

### Migration

1. Migrate incrementally
2. Monitor performance closely
3. Use feature flags for safety
4. Maintain fallback mechanisms

## Conclusion

Migrating existing tools to LangChain wrappers provides:

- **Type Safety**: Zod schema validation
- **Consistency**: Standardized tool interface
- **Security**: Enhanced input validation
- **Maintainability**: Clear separation of concerns
- **Future-Proof**: Ready for LangChain/LangGraph integration

Follow this guide carefully and test thoroughly at each step to ensure a smooth migration process.
