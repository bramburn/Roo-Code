# Context for Task 1.3: Implement Zod schema validation system for tool parameters and return types

- **Status**: To Do
- **Source PRD**: PRDs/04-tool-standardization-testing/tasklists/tasklist_sprint_01.md
- **Target Files**:
    - `src/tools/validation/ZodSchemaValidator.ts`
    - `src/tools/types/ValidationTypes.ts`
    - `src/tools/validation/ValidationRules.ts`
- **Generated**: 2025-11-11T20:18:00.000Z
- **Last Updated**: 2025-11-11T20:18:00.000Z

---

## 1. Current Code Analysis (Internal)

### Existing Zod Validation Patterns

From the codebase analysis, I found extensive Zod validation patterns already in use:

**File**: `src/core/config/ModeConfig.ts` (lines 406, 961)

```typescript
const validationResult = modeConfigSchema.safeParse(config)
```

**File**: `src/services/mcp/McpHub.ts` (line 1061)

```typescript
let validatedConfig: z.infer<typeof ServerConfigSchema>
```

**File**: `src/shared/WebviewMessage.ts` (lines 351, 359)

```typescript
type CheckpointDiffPayload = z.infer<typeof checkoutDiffPayloadSchema>
type CheckpointRestorePayload = z.infer<typeof checkoutRestorePayloadSchema>
```

### Current Validation Patterns

1. **Schema Definition Pattern**:

```typescript
export const modeConfigSchema = z.object({
	slug: z.string().uuid(),
	name: z.string().min(1),
	roleDefinition: z.string().min(1),
	groups: z.array(z.union([z.string(), z.tuple([z.string(), z.any()])])),
})
```

2. **Validation Error Handling**:

```typescript
const validationResult = modeConfigSchema.safeParse(config)
if (!validationResult.success) {
	throw new ZodError(validationResult.error)
}
```

3. **Type Inference Pattern**:

```typescript
export type CustomMode = z.infer<typeof modeConfigSchema>
```

### Tool Parameter Validation Analysis

From `src/core/tools/useMcpToolTool.ts` (lines 15-22, 339):

```typescript
type ValidationResult =
	| { isValid: false }
	| {
			isValid: true
			serverName: string
			toolName: string
			parsedArguments?: Record<string, unknown>
	  }

const { serverName, toolName, parsedArguments } = validation
```

**Current Issues**:

- No centralized validation system
- Inconsistent error handling across tools
- Manual parameter parsing without schema validation
- No return type validation

---

## 2. External Best Practices (GitHub)

### Best Practice 1: Zod Schema Validation for Tool Parameters

**Source**: https://github.com/colinhacks/zod
**Pattern**: Comprehensive schema validation with error formatting

```typescript
import { z } from "zod"

// Tool parameter schema definition
export const ToolParameterSchema = z.object({
	name: z.string().min(1, "Parameter name is required"),
	type: z.enum(["string", "number", "boolean", "array", "object"]),
	required: z.boolean().default(false),
	description: z.string().optional(),
	validation: z
		.object({
			min: z.number().optional(),
			max: z.number().optional(),
			pattern: z.string().optional(),
			enum: z.array(z.string()).optional(),
		})
		.optional(),
})

// Validation with detailed error messages
export function validateToolParameters(params: unknown, schema: z.ZodSchema) {
	const result = schema.safeParse(params)

	if (!result.success) {
		const formattedErrors = result.error.issues.map((issue) => ({
			path: issue.path.join("."),
			message: issue.message,
			code: issue.code,
		}))

		throw new ValidationError(formattedErrors)
	}

	return result.data
}
```

### Best Practice 2: Type-Safe Tool Return Validation

**Source**: https://github.com/colinhacks/zod/discussions/2065
**Pattern**: Runtime validation of tool return values

```typescript
// Return type schema definition
export const ToolReturnSchema = z.object({
	success: z.boolean(),
	data: z.unknown().optional(),
	error: z.string().optional(),
	metadata: z.record(z.unknown()).optional(),
})

// Runtime return validation
export function validateToolReturn(result: unknown, expectedType: z.ZodSchema) {
	const validationResult = expectedType.safeParse(result)

	if (!validationResult.success) {
		console.error("Tool return validation failed:", validationResult.error)
		return {
			success: false,
			error: "Invalid return type from tool",
		}
	}

	return validationResult.data
}
```

### Best Practice 3: Schema Composition and Reuse

**Source**: https://github.com/colinhacks/zod/issues/1460
**Pattern**: Modular schema definition for common types

```typescript
// Common base schemas
export const BaseParameterSchema = z.object({
	name: z.string().min(1),
	description: z.string().optional(),
	required: z.boolean().default(false),
})

export const StringParameterSchema = BaseParameterSchema.extend({
	type: z.literal("string"),
	validation: z
		.object({
			minLength: z.number().min(0).optional(),
			maxLength: z.number().min(0).optional(),
			pattern: z.string().optional(),
		})
		.optional(),
})

export const NumberParameterSchema = BaseParameterSchema.extend({
	type: z.literal("number"),
	validation: z
		.object({
			min: z.number().optional(),
			max: z.number().optional(),
			integer: z.boolean().default(false),
		})
		.optional(),
})

// Composed tool schema
export const ToolSchema = z.object({
	name: z.string().min(1),
	description: z.string().min(1),
	parameters: z.array(
		z.union([
			StringParameterSchema,
			NumberParameterSchema,
			// ... other parameter types
		]),
	),
	returnType: z.union([
		z.literal("string"),
		z.literal("number"),
		z.literal("boolean"),
		z.literal("array"),
		z.literal("object"),
	]),
})
```

---

## 3. Internal Knowledge Base (Memory)

### Existing Validation Infrastructure

From memory analysis, the codebase has:

- **Zod Integration**: Already using Zod for configuration validation
- **Error Handling**: Established patterns for ZodError handling
- **Type Safety**: Strong TypeScript integration with Zod inference
- **Testing Patterns**: Comprehensive test coverage for validation scenarios

### Tool Validation Requirements

Based on existing tool patterns:

- **Parameter Extraction**: Tools currently use manual parameter parsing
- **Type Safety**: Need runtime validation for tool inputs/outputs
- **Error Consistency**: Standardized error handling across all tools
- **Performance**: Minimal overhead from validation

---

## 4. Suggested Implementation Plan

### Phase 1: Core Validation Infrastructure

**File**: `src/tools/validation/ZodSchemaValidator.ts`

```typescript
import { z, ZodSchema, ZodError } from "zod"
import { ValidationResult, ValidationError } from "../types/ValidationTypes"

export class ZodSchemaValidator {
	static validate<T>(data: unknown, schema: ZodSchema<T>): ValidationResult<T> {
		const result = schema.safeParse(data)

		if (!result.success) {
			return {
				isValid: false,
				errors: this.formatZodErrors(result.error),
			}
		}

		return {
			isValid: true,
			data: result.data,
		}
	}

	static validateWithDefaults<T>(data: unknown, schema: ZodSchema<T>, defaults: Partial<T>): ValidationResult<T> {
		const result = schema.safeParse({ ...defaults, ...data })

		if (!result.success) {
			return {
				isValid: false,
				errors: this.formatZodErrors(result.error),
			}
		}

		return {
			isValid: true,
			data: result.data,
		}
	}

	private static formatZodErrors(error: ZodError): ValidationError[] {
		return error.issues.map((issue) => ({
			path: issue.path.join("."),
			message: issue.message,
			code: issue.code,
			expected: issue.expected,
			received: issue.received,
		}))
	}
}
```

### Phase 2: Type Definitions

**File**: `src/tools/types/ValidationTypes.ts`

```typescript
import { z } from "zod"

export interface ValidationResult<T = unknown> {
	isValid: boolean
	data?: T
	errors?: ValidationError[]
}

export interface ValidationError {
	path: string
	message: string
	code: string
	expected?: unknown
	received?: unknown
}

export interface ToolParameterDefinition {
	name: string
	type: ParameterType
	required: boolean
	description?: string
	validation?: ParameterValidation
}

export type ParameterType = "string" | "number" | "boolean" | "array" | "object"

export interface ParameterValidation {
	min?: number
	max?: number
	minLength?: number
	maxLength?: number
	pattern?: string
	enum?: string[]
	custom?: (value: unknown) => boolean | string
}

// Tool return type definitions
export interface ToolReturnDefinition {
	type: ParameterType
	schema?: z.ZodSchema
	validation?: ReturnValidation
}

export interface ReturnValidation {
	required: string[]
	optional: string[]
	custom?: (value: unknown) => boolean | string
}
```

### Phase 3: Validation Rules Engine

**File**: `src/tools/validation/ValidationRules.ts`

```typescript
import { z } from "zod"
import { ToolParameterDefinition, ToolReturnDefinition } from "../types/ValidationTypes"

export class ValidationRules {
	static createParameterSchema(param: ToolParameterDefinition): z.ZodSchema {
		let schema: z.ZodSchema

		switch (param.type) {
			case "string":
				schema = z.string()
				if (param.validation?.minLength) {
					schema = (schema as z.ZodString).min(param.validation.minLength)
				}
				if (param.validation?.maxLength) {
					schema = (schema as z.ZodString).max(param.validation.maxLength)
				}
				if (param.validation?.pattern) {
					schema = (schema as z.ZodString).regex(new RegExp(param.validation.pattern))
				}
				break

			case "number":
				schema = z.number()
				if (param.validation?.min !== undefined) {
					schema = (schema as z.ZodNumber).min(param.validation.min)
				}
				if (param.validation?.max !== undefined) {
					schema = (schema as z.ZodNumber).max(param.validation.max)
				}
				break

			case "boolean":
				schema = z.boolean()
				break

			case "array":
				schema = z.array(z.unknown())
				if (param.validation?.min) {
					schema = (schema as z.ZodArray).min(param.validation.min)
				}
				if (param.validation?.max) {
					schema = (schema as z.ZodArray).max(param.validation.max)
				}
				break

			case "object":
				schema = z.record(z.unknown())
				break

			default:
				throw new Error(`Unsupported parameter type: ${param.type}`)
		}

		if (param.validation?.enum) {
			schema = z.enum(param.validation.enum as [string, ...string[]])
		}

		if (param.validation?.custom) {
			schema = schema.refine(param.validation.custom, { message: "Custom validation failed" })
		}

		return param.required ? schema : schema.optional()
	}

	static createToolSchema(parameters: ToolParameterDefinition[], returnType?: ToolReturnDefinition): z.ZodSchema {
		const paramSchemas: Record<string, z.ZodSchema> = {}

		for (const param of parameters) {
			paramSchemas[param.name] = this.createParameterSchema(param)
		}

		const toolSchema = z.object({
			parameters: z.object(paramSchemas).partial(),
			context: z.record(z.unknown()).optional(),
		})

		return toolSchema
	}

	static createReturnSchema(returnDef: ToolReturnDefinition): z.ZodSchema {
		if (returnDef.schema) {
			return returnDef.schema
		}

		switch (returnDef.type) {
			case "string":
				return z.string()
			case "number":
				return z.number()
			case "boolean":
				return z.boolean()
			case "array":
				return z.array(z.unknown())
			case "object":
				return z.record(z.unknown())
			default:
				return z.unknown()
		}
	}
}
```

### Phase 4: Integration with Existing Tools

**Integration Pattern**:

```typescript
// For each existing tool, add validation wrapper
export function withValidation<T, R>(
	toolFunction: (params: T) => Promise<R>,
	paramSchema: z.ZodSchema<T>,
	returnSchema?: z.ZodSchema<R>,
) {
	return async (params: unknown): Promise<R> => {
		// Validate input parameters
		const paramValidation = ZodSchemaValidator.validate(params, paramSchema)
		if (!paramValidation.isValid) {
			throw new ValidationError(paramValidation.errors)
		}

		// Execute tool function
		const result = await toolFunction(paramValidation.data!)

		// Validate return value if schema provided
		if (returnSchema) {
			const returnValidation = ZodSchemaValidator.validate(result, returnSchema)
			if (!returnValidation.isValid) {
				console.error("Tool return validation failed:", returnValidation.errors)
				throw new Error("Tool produced invalid return value")
			}
		}

		return result
	}
}
```

---

## 5. Dependencies Analysis

### Prerequisites from Task 1.1-1.2

- [ ] **Task 1.1**: LangChain/LangGraph dependencies installed

    - Required: `zod` package (already available in project)
    - Required: TypeScript configuration for Zod types

- [ ] **Task 1.2**: LangGraph tool wrapper base class created
    - Integration point: Base wrapper needs validation system
    - Compatibility: Must work with LangChain StructuredTool interface

### Current Dependencies

From package.json analysis:

- **zod**: Already available in project
- **TypeScript**: Strict mode enabled
- **Testing**: Vitest with comprehensive test setup

### File Dependencies

- [ ] `src/core/tools/writeToFileTool.ts`: Needs parameter validation
- [ ] `src/core/tools/readFileTool.ts`: Needs parameter validation
- [ ] `src/core/tools/executeCommandTool.ts`: Needs parameter validation
- [ ] `src/core/tools/useMcpToolTool.ts`: Needs parameter validation

---

## 6. Testing Strategy

### Unit Test Structure

**File**: `src/tests/tools/validation/ZodSchemaValidator.test.ts`

```typescript
import { describe, test, expect } from "vitest"
import { ZodSchemaValidator } from "../../../tools/validation/ZodSchemaValidator"
import { z } from "zod"

describe("ZodSchemaValidator", () => {
	test("should validate valid data correctly", () => {
		const schema = z.object({
			name: z.string().min(1),
			age: z.number().min(0),
		})

		const validData = { name: "test", age: 25 }
		const result = ZodSchemaValidator.validate(validData, schema)

		expect(result.isValid).toBe(true)
		expect(result.data).toEqual(validData)
	})

	test("should handle validation errors correctly", () => {
		const schema = z.object({
			name: z.string().min(1),
			age: z.number().min(0),
		})

		const invalidData = { name: "", age: -5 }
		const result = ZodSchemaValidator.validate(invalidData, schema)

		expect(result.isValid).toBe(false)
		expect(result.errors).toHaveLength(2)
		expect(result.errors![0].path).toBe("name")
		expect(result.errors![1].path).toBe("age")
	})

	test("should apply defaults correctly", () => {
		const schema = z.object({
			name: z.string().min(1),
			age: z.number().min(0).default(18),
		})

		const data = { name: "test" }
		const defaults = { age: 21 }
		const result = ZodSchemaValidator.validateWithDefaults(data, schema, defaults)

		expect(result.isValid).toBe(true)
		expect(result.data).toEqual({ name: "test", age: 21 })
	})
})
```

### Integration Testing

- Test validation with existing tool parameters
- Verify error handling integration
- Test performance impact on tool execution
- Validate return type checking

---

## 7. Implementation Checklist

### Pre-Implementation

- [ ] Verify Zod version compatibility
- [ ] Review existing validation patterns
- [ ] Define validation error handling strategy
- [ ] Plan integration with existing tools

### Implementation Steps

1. [ ] Create ZodSchemaValidator class
2. [ ] Define ValidationTypes interface
3. [ ] Implement ValidationRules engine
4. [ ] Create validation wrapper functions
5. [ ] Integrate with existing tools
6. [ ] Add comprehensive unit tests
7. [ ] Create integration tests
8. [ ] Performance benchmarking

### Post-Implementation

- [ ] Run TypeScript compilation: `cd src && npm run check-types`
- [ ] Execute unit tests: `cd src && npx vitest run tools/validation/`
- [ ] Integration testing with existing tools
- [ ] Performance validation (<5% overhead requirement)

---

## 8. Risk Mitigation

### Technical Risks

1. **Performance Impact**: Validation overhead may slow tool execution

    - **Mitigation**: Efficient schema compilation, caching validation results
    - **Monitoring**: Performance benchmarking against current implementation

2. **Breaking Changes**: New validation may reject previously valid inputs

    - **Mitigation**: Comprehensive testing with existing tool inputs
    - **Fallback**: Graceful degradation with warnings

3. **Complexity**: Validation system may add complexity to tool development
    - **Mitigation**: Clear documentation, helper functions, examples
    - **Training**: Developer guides and best practices

### Integration Risks

1. **Tool Compatibility**: Existing tools may need modification

    - **Mitigation**: Gradual migration, backward compatibility layer
    - **Testing**: Extensive regression testing

2. **Error Handling**: New error types may break existing error handling
    - **Mitigation**: Maintain existing error interface, add new error types
    - **Documentation**: Clear error handling guidelines

---

## 9. Success Criteria

### Functional Requirements

- [ ] Zod schema validation for all tool parameters
- [ ] Runtime validation of tool return values
- [ ] Consistent error handling across all tools
- [ ] Integration with existing tool infrastructure
- [ ] Performance overhead <5%

### Quality Requirements

- [ ] Unit test coverage >95%
- [ ] Integration test coverage >90%
- [ ] TypeScript strict mode compliance
- [ ] No breaking changes to existing functionality
- [ ] Comprehensive error messages

### Documentation Requirements

- [ ] API documentation for validation system
- [ ] Migration guide for existing tools
- [ ] Best practices documentation
- [ ] Examples and code snippets

---

## 10. External References

### Zod Documentation

- [Zod GitHub](https://github.com/colinhacks/zod): Main repository and documentation
- [Zod Schema Composition](https://zod.dev/?id=objects): Object schema patterns
- [Zod Error Handling](https://zod.dev/?id=error-handling): Error formatting and handling

### Validation Patterns

- [Runtime Type Validation](https://github.com/sindresorhus/ow): Alternative validation libraries
- [Schema Validation Best Practices](https://github.com/ajv-validator/ajv): JSON schema validation patterns

### Testing Patterns

- [Vitest Testing](https://vitest.dev/): Testing framework documentation
- [Zod Testing Patterns](https://github.com/colinhacks/zod/discussions/2065): Testing Zod schemas

---

**Note**: This context provides comprehensive implementation guidance based on analysis of existing codebase patterns, external best practices, and established architectural patterns. All implementation steps should follow existing codebase conventions and maintain backward compatibility.
