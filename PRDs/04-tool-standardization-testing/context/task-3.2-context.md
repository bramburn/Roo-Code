# Context for Task 3.2: Create backward compatibility layer for existing XML-based tools during transition

- **Status**: To Do
- **Source PRD**: PRDs/04-tool-standardization-testing/tasklists/tasklist_sprint_03.md
- **Target Files**:
    - `src/transitional/LegacyToolAdapter.ts`
    - `src/transitional/XMLParameterParser.ts`
    - `src/transitional/ToolResultConverter.ts`
    - **Modify Existing**: Update `src/core/assistant-message/presentAssistantMessage.ts` (lines 595-623) to integrate with legacy adapter. Preserve existing tool execution dispatcher patterns and approval flow.
- **Generated**: 2025-11-11T20:42:00.000Z
- **Last Updated**: 2025-11-11T20:42:00.000Z

---

## 1. Current Code Analysis (Internal)

### File: `src/core/assistant-message/presentAssistantMessage.ts`

**Current Implementation (lines 595-623)**:

```typescript
switch (block.name) {
	case "write_to_file":
		await writeToFileTool(...)
		break
	case "read_file":
		await readFileTool(...)
		break
	case "search_files":
		await searchFilesTool(...)
		break
	case "execute_command":
		await executeCommandTool(...)
		break
	case "use_mcp_tool":
		await useMcpToolTool(...)
		break
	// ... other tool cases
}
```

**Key Integration Points**:

1. **Tool Execution Dispatcher**: Switch statement routing tool calls to specific functions
2. **Parameter Extraction**: Manual parameter extraction from `block.params`
3. **Error Handling**: Consistent error handling across all tool calls
4. **Approval Flow**: Integration with `askApproval` mechanism
5. **Result Delivery**: Using `pushToolResult` for responses

**Parameter Extraction Patterns**:

```typescript
// From writeToFileTool
const relPath: string | undefined = block.params.path
let newContent: string | undefined = block.params.content
let predictedLineCount: number | undefined = parseInt(block.params.line_count ?? "0")

// From executeCommandTool
const command: string = block.params.command
const cwd: string | undefined = block.params.cwd

// From useMcpToolTool
const serverName: string = block.params.server_name
const toolName: string = block.params.tool_name
const arguments: any = block.params.arguments
```

### XML Parameter Structure Analysis

From existing tool implementations, I found consistent XML-based parameter patterns:

```typescript
// ToolUse interface (from shared/tools.ts)
export interface ToolUse {
	type: "tool_use"
	name: string
	params: Record<string, any>
	partial: boolean
}
```

**Current Parameter Types**:

- **String Parameters**: Direct string values (file paths, commands)
- **Number Parameters**: Often as strings that need parsing
- **Object Parameters**: Complex nested structures (MCP tool arguments)
- **Optional Parameters**: May be undefined or missing
- **Type Conversion**: Manual string-to-type conversion throughout

---

## 2. External Best Practices (GitHub)

### Best Practice 1: Adapter Pattern for Legacy Systems

**Source**: https://github.com/microsoft/typescript
**Pattern**: Adapter pattern for backward compatibility

```typescript
// Legacy adapter pattern
export class LegacyToolAdapter {
	private legacyTools: Map<string, LegacyToolFunction>
	private newToolWrappers: Map<string, NewToolWrapper>

	constructor(
		legacyToolFunctions: Record<string, LegacyToolFunction>,
		newToolWrappers: Record<string, NewToolWrapper>,
	) {
		// Map legacy functions
		this.legacyTools = new Map(Object.entries(legacyToolFunctions))

		// Map new wrappers
		this.newToolWrappers = new Map(Object.entries(newToolWrappers))
	}

	// Unified interface for tool execution
	async executeTool(toolName: string, params: any): Promise<any> {
		// Try new wrapper first
		const newWrapper = this.newToolWrappers.get(toolName)
		if (newWrapper) {
			return await this.executeWithNewWrapper(toolName, params, newWrapper)
		}

		// Fallback to legacy tool
		const legacyTool = this.legacyTools.get(toolName)
		if (legacyTool) {
			return await this.executeWithLegacyTool(toolName, params, legacyTool)
		}

		throw new Error(`Tool '${toolName}' not found`)
	}

	private async executeWithNewWrapper(toolName: string, params: any, wrapper: NewToolWrapper): Promise<any> {
		try {
			// Convert parameters for new wrapper
			const convertedParams = this.convertParametersForNewWrapper(params, toolName)

			// Execute with new wrapper
			return await wrapper.invoke(convertedParams)
		} catch (error) {
			// Fallback to legacy on new wrapper failure
			console.warn(`New wrapper failed for ${toolName}, falling back to legacy:`, error)
			const legacyTool = this.legacyTools.get(toolName)
			if (legacyTool) {
				return await this.executeWithLegacyTool(toolName, params, legacyTool)
			}
			throw error
		}
	}

	private async executeWithLegacyTool(toolName: string, params: any, legacyTool: LegacyToolFunction): Promise<any> {
		// Execute with original legacy function
		return await legacyTool(params)
	}

	private convertParametersForNewWrapper(params: any, toolName: string): any {
		// Tool-specific parameter conversion logic
		switch (toolName) {
			case "write_to_file":
				return this.convertWriteFileParams(params)
			case "execute_command":
				return this.convertExecuteCommandParams(params)
			// ... other conversions
			default:
				return params
		}
	}

	private convertWriteFileParams(params: any): WriteFileParams {
		return {
			path: params.path,
			content: params.content,
			line_count: params.line_count ? parseInt(params.line_count) : undefined,
		}
	}

	private convertExecuteCommandParams(params: any): ExecuteCommandParams {
		return {
			command: params.command,
			cwd: params.cwd,
			timeout: params.timeout ? parseInt(params.timeout) : undefined,
		}
	}
}

// Type definitions
interface LegacyToolFunction {
	(params: any): Promise<any>
}

interface NewToolWrapper {
	invoke(params: any): Promise<any>
}

interface WriteFileParams {
	path: string
	content: string
	line_count?: number
}

interface ExecuteCommandParams {
	command: string
	cwd?: string
	timeout?: number
}
```

### Best Practice 2: XML Parameter Parsing and Validation

**Source**: https://github.com/isaacs/sax-js
**Pattern**: Robust XML parameter parsing with validation

```typescript
// XML parameter parser with validation
export class XMLParameterParser {
	private validationSchemas: Map<string, ValidationSchema>

	constructor(validationSchemas: Record<string, ValidationSchema>) {
		this.validationSchemas = new Map(Object.entries(validationSchemas))
	}

	parseToolParameters(xmlString: string): ParsedParameters {
		try {
			const parsed = this.parseXML(xmlString)
			const validated = this.validateParameters(parsed)

			return {
				success: true,
				parameters: validated,
				errors: [],
			}
		} catch (error) {
			return {
				success: false,
				parameters: {},
				errors: [error.message],
			}
		}
	}

	private parseXML(xmlString: string): any {
		// Use robust XML parsing
		const parser = new XMLParser({
			explicitArray: false,
			explicitRoot: false,
			ignoreAttrs: false,
			mergeAttrs: true,
		})

		return parser.parseString(xmlString)
	}

	private validateParameters(params: any): ValidatedParameters {
		const validated: ValidatedParameters = {}
		const errors: string[] = []

		// Validate against known schemas
		for (const [toolName, toolParams] of Object.entries(params)) {
			const schema = this.validationSchemas.get(toolName)
			if (schema) {
				try {
					validated[toolName] = this.validateAgainstSchema(toolParams, schema)
				} catch (error) {
					errors.push(`${toolName}: ${error.message}`)
				}
			} else {
				validated[toolName] = toolParams
			}
		}

		if (errors.length > 0) {
			throw new Error(`Validation errors: ${errors.join(", ")}`)
		}

		return validated
	}

	private validateAgainstSchema(params: any, schema: ValidationSchema): any {
		const validated: any = {}

		for (const [paramName, paramSchema] of Object.entries(schema.properties)) {
			const value = params[paramName]

			if (paramSchema.required && (value === undefined || value === null)) {
				throw new Error(`Required parameter '${paramName}' is missing`)
			}

			if (value !== undefined) {
				validated[paramName] = this.convertParameterType(value, paramSchema)
			}
		}

		return validated
	}

	private convertParameterType(value: any, schema: PropertySchema): any {
		switch (schema.type) {
			case "string":
				return typeof value === "string" ? value : String(value)
			case "number":
				const num = Number(value)
				if (isNaN(num)) {
					throw new Error(`Invalid number: ${value}`)
				}
				return num
			case "boolean":
				if (typeof value === "boolean") return value
				if (typeof value === "string") {
					return value.toLowerCase() === "true"
				}
				return Boolean(value)
			case "array":
				return Array.isArray(value) ? value : [value]
			case "object":
				return typeof value === "object" ? value : {}
			default:
				return value
		}
	}
}

// Supporting interfaces
interface ParsedParameters {
	success: boolean
	parameters: ValidatedParameters
	errors: string[]
}

interface ValidatedParameters {
	[toolName: string]: any
}

interface ValidationSchema {
	type: string
	properties: Record<string, PropertySchema>
	required?: string[]
}

interface PropertySchema {
	type: string
	required?: boolean
	default?: any
}
```

### Best Practice 3: Result Format Conversion

**Source**: https://github.com/microsoft/tslib
**Pattern**: Result format conversion between systems

```typescript
// Result format converter
export class ToolResultConverter {
  private resultMappers: Map<string, ResultMapper>

  constructor(resultMappers: Record<string, ResultMapper>) {
    this.resultMappers = new Map(Object.entries(resultMappers))
  }

  convertLegacyResult(
    toolName: string,
    legacyResult: any,
    targetFormat: 'langchain' | 'xml' | 'unified'
  ): any {
    const mapper = this.resultMappers.get(toolName)
    if (!mapper) {
      return this.defaultConversion(legacyResult, targetFormat)
    }

    return mapper.convert(legacyResult, targetFormat)
  }

  convertNewResultToLegacy(
    toolName: string,
    newResult: any,
    targetFormat: 'xml' | 'legacy'
  ): any {
    const mapper = this.resultMappers.get(toolName)
    if (mapper && mapper.convertToLegacy) {
      return mapper.convertToLegacy(newResult, targetFormat)
    }

    return this.defaultToLegacyConversion(newResult, targetFormat)
  }

  private defaultConversion(result: any, targetFormat: string): any {
    switch (targetFormat) {
      case "langchain":
        return {
          type: "tool_result",
          content: typeof result === 'string' ? result : JSON.stringify(result)
        }
      case "xml":
        return {
          type: "tool_result",
          content: this.escapeXmlContent(String(result))
        }
      case "unified":
        return {
          success: true,
          data: result,
          timestamp: new Date().toISOString()
        }
      default:
        return result
    }
  }

  private defaultToLegacyConversion(result: any, targetFormat: string): any {
    switch (targetFormat) {
      case "xml":
        return `<result>${this.escapeXmlContent(String(result))}</result>`
      case "legacy":
        return {
          output: result,
          status: "success",
          timestamp: new Date().toISOString()
        }
      default:
        return result
    }
  }

  private escapeXmlContent(content: string): string {
    return content
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"')
      .replace(/'/g, ''')
  }
}

// Supporting interfaces
interface ResultMapper {
  convert: (result: any, targetFormat: string) => any
  convertToLegacy?: (result: any, targetFormat: string) => any
}
```

---

## 3. Internal Knowledge Base (Memory)

### Existing Tool Integration

From memory analysis, codebase has:

- **Tool Execution Switch**: Current switch-based tool dispatch
- **Parameter Extraction**: Manual XML parameter parsing
- **Error Handling**: Consistent error patterns across tools
- **Approval Integration**: Existing approval workflow integration

### Backward Compatibility Requirements

Based on existing patterns:

- **Preserve Interface**: Maintain existing ToolUse interface
- **Parameter Compatibility**: Support existing XML parameter formats
- **Result Format**: Maintain existing result delivery patterns
- **Error Handling**: Preserve existing error handling flow
- **Performance**: Minimal overhead from compatibility layer

---

## 4. Suggested Implementation Plan

### Phase 1: Legacy Tool Adapter

**File**: `src/transitional/LegacyToolAdapter.ts`

```typescript
import { ToolUse } from "../../shared/tools"
import { AskApproval, HandleError, PushToolResult, RemoveClosingTag } from "../../shared/tools"

export interface LegacyToolContext {
	cline: Task
	askApproval: AskApproval
	handleError: HandleError
	pushToolResult: PushToolResult
	removeClosingTag: RemoveClosingTag
}

export class LegacyToolAdapter {
	private legacyToolFunctions: Map<string, LegacyToolFunction>
	private newToolWrappers: Map<string, NewToolWrapper>
	private context: LegacyToolContext
	private fallbackEnabled: boolean = true

	constructor(
		legacyToolFunctions: Record<string, LegacyToolFunction>,
		newToolWrappers: Record<string, NewToolWrapper>,
		context: LegacyToolContext,
		options?: AdapterOptions,
	) {
		this.legacyToolFunctions = new Map(Object.entries(legacyToolFunctions))
		this.newToolWrappers = new Map(Object.entries(newToolWrappers))
		this.context = context

		if (options?.fallbackEnabled !== undefined) {
			this.fallbackEnabled = options.fallbackEnabled
		}
	}

	// Main execution interface
	async executeTool(toolUse: ToolUse): Promise<void> {
		const toolName = toolUse.name
		const params = toolUse.params

		try {
			// Try new wrapper first
			const newWrapper = this.newToolWrappers.get(toolName)
			if (newWrapper) {
				await this.executeWithNewWrapper(toolName, params, newWrapper)
				return
			}

			// Try legacy tool
			const legacyTool = this.legacyToolFunctions.get(toolName)
			if (legacyTool) {
				await this.executeWithLegacyTool(toolName, params, legacyTool)
				return
			}

			throw new Error(`Tool '${toolName}' not found in either new or legacy systems`)
		} catch (error) {
			// Handle fallback if enabled
			if (this.fallbackEnabled) {
				await this.handleExecutionError(toolName, params, error)
				return
			}

			throw error
		}
	}

	private async executeWithNewWrapper(toolName: string, params: any, wrapper: NewToolWrapper): Promise<void> {
		try {
			// Convert parameters for new wrapper
			const convertedParams = this.convertParametersForNewWrapper(params, toolName)

			// Create context for new wrapper
			const wrapperContext = this.createWrapperContext()

			// Execute with new wrapper
			const result = await wrapper.invoke(convertedParams, wrapperContext)

			// Convert result back to legacy format
			await this.deliverResult(result, toolName)
		} catch (error) {
			console.warn(`New wrapper failed for ${toolName}:`, error)
			throw error
		}
	}

	private async executeWithLegacyTool(toolName: string, params: any, legacyTool: LegacyToolFunction): Promise<void> {
		try {
			// Execute with original legacy function
			await legacyTool(
				this.context.cline,
				this.createToolUse(toolName, params),
				this.context.askApproval,
				this.context.handleError,
				this.context.pushToolResult,
				this.context.removeClosingTag,
			)
		} catch (error) {
			console.warn(`Legacy tool failed for ${toolName}:`, error)
			throw error
		}
	}

	private async handleExecutionError(toolName: string, params: any, error: Error): Promise<void> {
		// Log the error
		await this.context.handleError("tool execution", error)

		// Try alternative execution methods
		if (this.canRetryExecution(toolName, error)) {
			await this.retryExecution(toolName, params)
		} else {
			// Deliver error result
			await this.deliverErrorResult(error, toolName)
		}
	}

	private createToolUse(toolName: string, params: any): ToolUse {
		return {
			type: "tool_use",
			name: toolName,
			params,
			partial: false,
		}
	}

	private createWrapperContext(): any {
		return {
			cline: this.context.cline,
			askApproval: this.context.askApproval,
			handleError: this.context.handleError,
			pushToolResult: (result: string) => {
				this.context.pushToolResult(result)
			},
			removeClosingTag: this.context.removeClosingTag,
		}
	}

	private async deliverResult(result: any, toolName: string): Promise<void> {
		// Convert result to expected format
		const formattedResult = this.formatResultForLegacy(result, toolName)
		await this.context.pushToolResult(formattedResult)
	}

	private async deliverErrorResult(error: Error, toolName: string): Promise<void> {
		const errorResult = this.formatErrorForLegacy(error, toolName)
		await this.context.pushToolResult(errorResult)
	}

	private convertParametersForNewWrapper(params: any, toolName: string): any {
		// Tool-specific parameter conversion
		const converter = this.getParameterConverter(toolName)
		return converter ? converter(params) : params
	}

	private getParameterConverter(toolName: string): ParameterConverter | null {
		const converters: Record<string, ParameterConverter> = {
			write_to_file: this.convertWriteFileParams,
			read_file: this.convertReadFileParams,
			execute_command: this.convertExecuteCommandParams,
			use_mcp_tool: this.convertMcpToolParams,
			search_files: this.convertSearchFilesParams,
		}

		return converters[toolName] || null
	}

	private convertWriteFileParams(params: any): WriteFileParams {
		return {
			path: params.path,
			content: params.content,
			line_count: params.line_count ? parseInt(params.line_count) : undefined,
		}
	}

	private convertReadFileParams(params: any): ReadFileParams {
		return {
			path: params.path,
			encoding: params.encoding || "utf8",
		}
	}

	private convertExecuteCommandParams(params: any): ExecuteCommandParams {
		return {
			command: params.command,
			cwd: params.cwd,
			timeout: params.timeout ? parseInt(params.timeout) : undefined,
		}
	}

	private convertMcpToolParams(params: any): McpToolParams {
		return {
			server_name: params.server_name,
			tool_name: params.tool_name,
			arguments: params.arguments || {},
		}
	}

	private convertSearchFilesParams(params: any): SearchFilesParams {
		return {
			path: params.path,
			regex: params.regex,
			file_pattern: params.file_pattern,
		}
	}

	private formatResultForLegacy(result: any, toolName: string): string {
		// Convert new wrapper result to legacy format
		if (typeof result === "string") {
			return result
		}

		// Handle structured results
		return JSON.stringify(result)
	}

	private formatErrorForLegacy(error: Error, toolName: string): string {
		return `Error executing ${toolName}: ${error.message}`
	}

	private canRetryExecution(toolName: string, error: Error): boolean {
		// Define retryable error types
		const retryableErrors = ["timeout", "network", "temporary"]

		return retryableErrors.some((retryableError) => error.message.toLowerCase().includes(retryableError))
	}

	private async retryExecution(toolName: string, params: any): Promise<void> {
		// Simple retry with exponential backoff
		const maxRetries = 3
		let retryCount = 0

		while (retryCount < maxRetries) {
			try {
				const delay = Math.pow(2, retryCount) * 1000 // 1s, 2s, 4s
				await new Promise((resolve) => setTimeout(resolve, delay))

				const legacyTool = this.legacyToolFunctions.get(toolName)
				if (legacyTool) {
					await this.executeWithLegacyTool(toolName, params, legacyTool)
					return
				}
			} catch (retryError) {
				retryCount++
				if (retryCount >= maxRetries) {
					throw retryError
				}
			}
		}
	}

	// Configuration methods
	enableFallback(enabled: boolean): void {
		this.fallbackEnabled = enabled
	}

	getAvailableTools(): string[] {
		const legacyTools = Array.from(this.legacyToolFunctions.keys())
		const newTools = Array.from(this.newToolWrappers.keys())
		return [...new Set([...legacyTools, ...newTools])]
	}

	isToolAvailable(toolName: string): boolean {
		return this.legacyToolFunctions.has(toolName) || this.newToolWrappers.has(toolName)
	}
}

// Supporting interfaces
interface AdapterOptions {
	fallbackEnabled?: boolean
	retryAttempts?: number
	timeoutMs?: number
}

interface LegacyToolFunction {
	(
		cline: Task,
		block: ToolUse,
		askApproval: AskApproval,
		handleError: HandleError,
		pushToolResult: PushToolResult,
		removeClosingTag: RemoveClosingTag,
	): Promise<void>
}

interface NewToolWrapper {
	invoke(params: any, context?: any): Promise<any>
}

interface ParameterConverter {
	(params: any): any
}

interface WriteFileParams {
	path: string
	content: string
	line_count?: number
}

interface ReadFileParams {
	path: string
	encoding?: string
}

interface ExecuteCommandParams {
	command: string
	cwd?: string
	timeout?: number
}

interface McpToolParams {
	server_name: string
	tool_name: string
	arguments?: any
}

interface SearchFilesParams {
	path: string
	regex: string
	file_pattern?: string
}
```

### Phase 2: XML Parameter Parser

**File**: `src/transitional/XMLParameterParser.ts`

```typescript
import { z } from "zod"

export class XMLParameterParser {
	private static readonly PARAMETER_PATTERNS = {
		// Common parameter patterns in XML
		STRING_PARAM: /<(\w+)>([^<]*?)<\/\1>/gs,
		NUMBER_PARAM: /<(\w+)>([^<]*?)<\/\1>/gs,
		BOOLEAN_PARAM: /<(\w+)>([^<]*?)<\/\1>/gs,
		OBJECT_PARAM: /<(\w+)>([^<]*?)<\/\1>/gs,
		ARRAY_PARAM: /<(\w+)>([^<]*?)<\/\1>/gs,
	} as const

	private validationSchemas: Map<string, z.ZodSchema>

	constructor(validationSchemas?: Record<string, z.ZodSchema>) {
		if (validationSchemas) {
			this.validationSchemas = new Map(Object.entries(validationSchemas))
		}
	}

	// Main parsing method
	static parseToolParameters(params: Record<string, any>): ParsedParameters {
		const parsed: ParsedParameters = {
			original: params,
			converted: {},
			errors: [],
			warnings: [],
		}

		for (const [paramName, paramValue] of Object.entries(params)) {
			try {
				const converted = this.convertParameterValue(paramName, paramValue)
				parsed.converted[paramName] = converted.value
				parsed.warnings.push(...converted.warnings)
			} catch (error) {
				parsed.errors.push({
					parameter: paramName,
					error: error.message,
					value: paramValue,
				})
			}
		}

		return parsed
	}

	// Advanced XML parsing for complex structures
	static parseXMLParameters(xmlString: string): ParsedParameters {
		const parsed: ParsedParameters = {
			original: {},
			converted: {},
			errors: [],
			warnings: [],
		}

		try {
			// Parse XML structure
			const xmlDoc = this.parseXMLString(xmlString)

			// Extract parameters from XML
			const extractedParams = this.extractParametersFromXML(xmlDoc)
			parsed.original = extractedParams

			// Convert and validate each parameter
			for (const [paramName, paramValue] of Object.entries(extractedParams)) {
				try {
					const converted = this.convertParameterValue(paramName, paramValue)
					parsed.converted[paramName] = converted.value
					parsed.warnings.push(...converted.warnings)
				} catch (error) {
					parsed.errors.push({
						parameter: paramName,
						error: error.message,
						value: paramValue,
					})
				}
			}
		} catch (error) {
			parsed.errors.push({
				error: `XML parsing failed: ${error.message}`,
				xmlString,
			})
		}

		return parsed
	}

	private static convertParameterValue(paramName: string, paramValue: any): ParameterConversion {
		const conversion: ParameterConversion = {
			value: paramValue,
			type: this.inferType(paramValue),
			warnings: [],
		}

		// Type-specific conversions
		switch (conversion.type) {
			case "string":
				conversion.value = this.convertString(paramValue)
				break
			case "number":
				conversion.value = this.convertNumber(paramValue)
				break
			case "boolean":
				conversion.value = this.convertBoolean(paramValue)
				break
			case "array":
				conversion.value = this.convertArray(paramValue)
				break
			case "object":
				conversion.value = this.convertObject(paramValue)
				break
		}

		return conversion
	}

	private static inferType(value: any): "string" | "number" | "boolean" | "array" | "object" {
		if (typeof value === "string") return "string"
		if (typeof value === "number") return "number"
		if (typeof value === "boolean") return "boolean"
		if (Array.isArray(value)) return "array"
		if (typeof value === "object" && value !== null && !Array.isArray(value)) return "object"

		// Default to string for unknown types
		return "string"
	}

	private static convertString(value: any): ParameterConversion {
		const conversion: ParameterConversion = {
			value: String(value),
			type: "string",
			warnings: [],
		}

		// Check for potential issues
		if (typeof value === "string" && value.length > 10000) {
			conversion.warnings.push("Large string parameter may cause performance issues")
		}

		return conversion
	}

	private static convertNumber(value: any): ParameterConversion {
		const conversion: ParameterConversion = {
			value: 0,
			type: "number",
			warnings: [],
		}

		if (typeof value === "number") {
			conversion.value = value
		} else if (typeof value === "string") {
			const num = Number(value)
			if (isNaN(num)) {
				conversion.warnings.push(`Invalid number format: ${value}`)
			} else {
				conversion.value = num
			}
		} else if (typeof value === "boolean") {
			conversion.value = value ? 1 : 0
		} else {
			conversion.warnings.push(`Cannot convert to number: ${typeof value}`)
		}

		return conversion
	}

	private static convertBoolean(value: any): ParameterConversion {
		const conversion: ParameterConversion = {
			value: false,
			type: "boolean",
			warnings: [],
		}

		if (typeof value === "boolean") {
			conversion.value = value
		} else if (typeof value === "string") {
			const lowerValue = value.toLowerCase().trim()
			if (lowerValue === "true" || lowerValue === "1" || lowerValue === "yes") {
				conversion.value = true
			} else if (lowerValue === "false" || lowerValue === "0" || lowerValue === "no") {
				conversion.value = false
			} else {
				conversion.warnings.push(`Invalid boolean format: ${value}`)
			}
		} else if (typeof value === "number") {
			conversion.value = value !== 0
		} else {
			conversion.warnings.push(`Cannot convert to boolean: ${typeof value}`)
		}

		return conversion
	}

	private static convertArray(value: any): ParameterConversion {
		const conversion: ParameterConversion = {
			value: [],
			type: "array",
			warnings: [],
		}

		if (Array.isArray(value)) {
			conversion.value = value
		} else if (typeof value === "string") {
			try {
				// Try to parse as JSON array
				const parsed = JSON.parse(value)
				if (Array.isArray(parsed)) {
					conversion.value = parsed
				} else {
					conversion.warnings.push(`Invalid JSON array format: ${value}`)
				}
			} catch (error) {
				conversion.warnings.push(`JSON parsing failed: ${error.message}`)
			}
		} else {
			conversion.warnings.push(`Cannot convert to array: ${typeof value}`)
		}

		return conversion
	}

	private static convertObject(value: any): ParameterConversion {
		const conversion: ParameterConversion = {
			value: {},
			type: "object",
			warnings: [],
		}

		if (typeof value === "object" && value !== null && !Array.isArray(value)) {
			conversion.value = value
		} else if (typeof value === "string") {
			try {
				const parsed = JSON.parse(value)
				if (typeof parsed === "object" && parsed !== null) {
					conversion.value = parsed
				} else {
					conversion.warnings.push(`Invalid JSON object format: ${value}`)
				}
			} catch (error) {
				conversion.warnings.push(`JSON parsing failed: ${error.message}`)
			}
		} else {
			conversion.warnings.push(`Cannot convert to object: ${typeof value}`)
		}

		return conversion
	}

	private static parseXMLString(xmlString: string): Document {
		// Basic XML parsing - in a real implementation,
		// you might use a proper XML parser library
		const parser = new DOMParser()
		return parser.parseFromString(xmlString, "text/xml")
	}

	private static extractParametersFromXML(xmlDoc: Document): Record<string, any> {
		const params: Record<string, any> = {}

		// Extract parameters from XML structure
		const parameterNodes = xmlDoc.getElementsByTagName("parameter")

		for (let i = 0; i < parameterNodes.length; i++) {
			const node = parameterNodes[i]
			const name = node.getAttribute("name")
			const value = node.textContent || node.nodeValue

			if (name && value !== null) {
				params[name] = this.parseXMLValue(value)
			}
		}

		return params
	}

	private static parseXMLValue(value: string | null): any {
		if (!value) return null

		// Try to parse as JSON first
		try {
			return JSON.parse(value)
		} catch {
			// Return as string if JSON parsing fails
			return value
		}
	}

	// Validation method
	validateParameters(params: Record<string, any>, toolName: string): ValidationResult {
		if (!this.validationSchemas) {
			return {
				valid: true,
				errors: [],
			}
		}

		const schema = this.validationSchemas.get(toolName)
		if (!schema) {
			return {
				valid: true,
				errors: [],
			}
		}

		const result = schema.safeParse(params)

		return {
			valid: result.success,
			errors: result.success
				? []
				: result.error.issues.map((issue) => ({
						parameter: issue.path.join("."),
						message: issue.message,
						code: issue.code,
					})),
		}
	}
}

// Supporting interfaces
interface ParsedParameters {
	original: Record<string, any>
	converted: Record<string, any>
	errors: ParameterError[]
	warnings: string[]
}

interface ParameterConversion {
	value: any
	type: "string" | "number" | "boolean" | "array" | "object"
	warnings: string[]
}

interface ParameterError {
	parameter: string
	error: string
	value?: any
}

interface ValidationResult {
	valid: boolean
	errors: ParameterError[]
}
```

### Phase 3: Tool Result Converter

**File**: `src/transitional/ToolResultConverter.ts`

```typescript
export class ToolResultConverter {
	private static readonly RESULT_FORMATS = {
		LEGACY_XML: "legacy_xml",
		LEGACY_PLAIN: "legacy_plain",
		LANGCHAIN_STRUCTURED: "langchain_structured",
		UNIFIED: "unified",
	} as const

	// Convert between different result formats
	static convertResult(result: any, fromFormat: string, toFormat: string, toolName?: string): any {
		const converter = this.getConverter(fromFormat, toFormat)
		if (!converter) {
			throw new Error(`No converter available from ${fromFormat} to ${toFormat}`)
		}

		return converter(result, toolName)
	}

	// Legacy to LangChain conversion
	private static legacyToLangChain(result: any, toolName?: string): any {
		if (typeof result === "string") {
			return {
				type: "tool_result",
				content: result,
			}
		}

		if (typeof result === "object" && result !== null) {
			return {
				type: "tool_result",
				content: JSON.stringify(result),
			}
		}

		return result
	}

	// LangChain to Legacy conversion
	private static langChainToLegacy(result: any, toolName?: string): string {
		if (typeof result === "object") {
			if (result.type === "tool_result") {
				return result.content || ""
			}
			return JSON.stringify(result)
		}

		return String(result)
	}

	// Unified format conversion
	private static toUnified(result: any, toolName?: string): UnifiedResult {
		return {
			toolName: toolName || "unknown",
			success: true,
			data: result,
			timestamp: new Date().toISOString(),
			format: "unified",
		}
	}

	private static fromUnified(result: UnifiedResult): any {
		// Extract original data from unified format
		return result.data
	}

	// Get appropriate converter
	private static getConverter(fromFormat: string, toFormat: string): ResultConverter | null {
		const converters: Record<string, ResultConverter> = {
			[`${this.RESULT_FORMATS.LEGACY_XML}_${this.RESULT_FORMATS.LANGCHAIN_STRUCTURED}`]: this.legacyToLangChain,
			[`${this.RESULT_FORMATS.LEGACY_XML}_${this.RESULT_FORMATS.UNIFIED}`]: this.toUnified,
			[`${this.RESULT_FORMATS.LEGACY_PLAIN}_${this.RESULT_FORMATS.LANGCHAIN_STRUCTURED}`]: this.legacyToLangChain,
			[`${this.RESULT_FORMATS.LEGACY_PLAIN}_${this.RESULT_FORMATS.UNIFIED}`]: this.toUnified,
			[`${this.RESULT_FORMATS.LANGCHAIN_STRUCTURED}_${this.RESULT_FORMATS.LEGACY_XML}`]: this.langChainToLegacy,
			[`${this.RESULT_FORMATS.LANGCHAIN_STRUCTURED}_${this.RESULT_FORMATS.LEGACY_PLAIN}`]: this.langChainToLegacy,
			[`${this.RESULT_FORMATS.UNIFIED}_${this.RESULT_FORMATS.LEGACY_XML}`]: this.fromUnified,
			[`${this.RESULT_FORMATS.UNIFIED}_${this.RESULT_FORMATS.LEGACY_PLAIN}`]: this.fromUnified,
		}

		return converters[`${fromFormat}_${toFormat}`] || null
	}

	// Format detection
	static detectResultFormat(result: any): string {
		if (typeof result === "string") {
			return this.RESULT_FORMATS.LEGACY_PLAIN
		}

		if (typeof result === "object") {
			if (result.type === "tool_result") {
				return this.RESULT_FORMATS.LANGCHAIN_STRUCTURED
			}

			if (result.toolName || result.timestamp) {
				return this.RESULT_FORMATS.UNIFIED
			}
		}

		return this.RESULT_FORMATS.LEGACY_XML
	}

	// Result validation
	static validateResult(result: any, expectedFormat?: string): ValidationResult {
		const detectedFormat = expectedFormat || this.detectResultFormat(result)

		// Basic structure validation
		if (detectedFormat === this.RESULT_FORMATS.LEGACY_PLAIN) {
			return {
				valid: true,
				format: detectedFormat,
				errors: [],
			}
		}

		if (detectedFormat === this.RESULT_FORMATS.LANGCHAIN_STRUCTURED) {
			return this.validateLangChainResult(result)
		}

		if (detectedFormat === this.RESULT_FORMATS.UNIFIED) {
			return this.validateUnifiedResult(result)
		}

		return {
			valid: false,
			format: "unknown",
			errors: ["Unrecognized result format"],
		}
	}

	private static validateLangChainResult(result: any): ValidationResult {
		const errors: string[] = []

		if (!result.type || result.type !== "tool_result") {
			errors.push("Missing or invalid type field")
		}

		if (!result.content) {
			errors.push("Missing content field")
		}

		return {
			valid: errors.length === 0,
			format: this.RESULT_FORMATS.LANGCHAIN_STRUCTURED,
			errors,
		}
	}

	private static validateUnifiedResult(result: any): ValidationResult {
		const errors: string[] = []

		if (!result.toolName) {
			errors.push("Missing toolName field")
		}

		if (!result.success !== undefined) {
			errors.push("Missing success field")
		}

		if (!result.data) {
			errors.push("Missing data field")
		}

		if (!result.timestamp) {
			errors.push("Missing timestamp field")
		}

		return {
			valid: errors.length === 0,
			format: this.RESULT_FORMATS.UNIFIED,
			errors,
		}
	}
}

// Supporting interfaces
interface ResultConverter {
	(result: any, toolName?: string): any
}

interface UnifiedResult {
	toolName: string
	success: boolean
	data: any
	timestamp: string
	format: string
}

interface ValidationResult {
	valid: boolean
	format: string
	errors: string[]
}
```

---

## 5. Dependencies Analysis

### Prerequisites from Task 1.1-2.6, 3.1

Based on tasklist analysis, following must be completed first:

1. **Task 1.1**: LangChain/LangGraph dependencies installed
2. **Task 1.2**: LangGraph tool wrapper base class created
3. **Task 1.3**: Zod schema validation system implemented
4. **Task 1.4**: Transitional execution layer implemented
5. **Task 1.5**: Testing framework established
6. **Task 1.6**: Documentation created
7. **Task 2.1-2.6**: Tool wrappers implemented
8. **Task 3.1**: LangGraph tool execution bridge implemented

### Current Dependencies

From `src/core/assistant-message/presentAssistantMessage.ts` analysis:

- **Tool Execution Switch**: Current switch-based tool dispatch
- **Parameter Extraction**: Manual parameter extraction from `block.params`
- **Error Handling**: Consistent error handling across all tool calls
- **Approval Integration**: Existing `askApproval` mechanism
- **Result Delivery**: Using `pushToolResult` for responses

### File Dependencies

- [ ] `src/core/assistant-message/presentAssistantMessage.ts`: Must be modified to integrate adapter
- [ ] `src/core/tools/`: Existing tool implementations
- [ ] `src/tools/wrappers/`: New tool wrapper implementations
- [ ] `src/shared/tools.ts`: ToolUse interface and related types

---

## 6. Testing Strategy

### Unit Test Structure

**File**: `src/tests/transitional/LegacyToolAdapter.test.ts`

```typescript
import { describe, test, expect, beforeEach, vi } from "vitest"
import { LegacyToolAdapter } from "../../../transitional/LegacyToolAdapter"
import { createMockTask, createMockToolWrapper } from "../../mocks"

describe("LegacyToolAdapter", () => {
	let adapter: LegacyToolAdapter
	let mockContext: any
	let mockLegacyTools: any
	let mockNewWrappers: any

	beforeEach(() => {
		mockContext = createMockTask()
		mockLegacyTools = {
			write_to_file: vi.fn(),
			read_file: vi.fn(),
			execute_command: vi.fn(),
		}
		mockNewWrappers = {
			write_to_file: createMockToolWrapper("new_write_to_file"),
			read_file: createMockToolWrapper("new_read_file"),
		}

		adapter = new LegacyToolAdapter(mockLegacyTools, mockNewWrappers, mockContext)
	})

	test("should execute with new wrapper when available", async () => {
		const toolUse = {
			type: "tool_use",
			name: "write_to_file",
			params: { path: "test.txt", content: "test" },
		}

		await adapter.executeTool(toolUse)

		expect(mockNewWrappers.write_to_file.invoke).toHaveBeenCalledWith(
			{ path: "test.txt", content: "test" },
			expect.any(Object), // context
		)

		expect(mockLegacyTools.write_to_file).not.toHaveBeenCalled()
	})

	test("should fallback to legacy tool when new wrapper not available", async () => {
		const toolUse = {
			type: "tool_use",
			name: "legacy_only_tool",
			params: { test: "value" },
		}

		await adapter.executeTool(toolUse)

		expect(mockLegacyTools.legacy_only_tool).toHaveBeenCalledWith(
			mockContext.cline,
			expect.objectContaining({ name: "legacy_only_tool", params: { test: "value" } }),
			expect.any(Function), // askApproval
			expect.any(Function), // handleError
			expect.any(Function), // pushToolResult
			expect.any(Function), // removeClosingTag
		)

		expect(mockNewWrappers.legacy_only_tool).not.toHaveBeenCalled()
	})

	test("should handle new wrapper errors with fallback", async () => {
		mockNewWrappers.write_to_file.invoke.mockRejectedValue(new Error("New wrapper failed"))

		const toolUse = {
			type: "tool_use",
			name: "write_to_file",
			params: { path: "test.txt", content: "test" },
		}

		await adapter.executeTool(toolUse)

		// Should have tried new wrapper first
		expect(mockNewWrappers.write_to_file.invoke).toHaveBeenCalledTimes(1)

		// Should have fallen back to legacy
		expect(mockLegacyTools.write_to_file).toHaveBeenCalled()
	})

	test("should convert parameters correctly", async () => {
		const toolUse = {
			type: "tool_use",
			name: "execute_command",
			params: {
				command: "echo 'test'",
				timeout: "5000", // String that should be converted to number
				cwd: "/test",
			},
		}

		await adapter.executeTool(toolUse)

		expect(mockNewWrappers.execute_command.invoke).toHaveBeenCalledWith(
			{
				command: "echo 'test'",
				timeout: 5000, // Should be converted to number
				cwd: "/test",
			},
			expect.any(Object),
		)
	})

	test("should deliver results in correct format", async () => {
		mockNewWrappers.write_to_file.invoke.mockResolvedValue("File written successfully")

		const toolUse = {
			type: "tool_use",
			name: "write_to_file",
			params: { path: "test.txt", content: "test" },
		}

		await adapter.executeTool(toolUse)

		expect(mockContext.pushToolResult).toHaveBeenCalledWith("File written successfully")
	})
})
```

### Integration Testing

- Test adapter with real tool implementations
- Verify parameter conversion accuracy
- Test error handling and fallback mechanisms
- Validate result format conversion

---

## 7. Implementation Checklist

### Pre-Implementation

- [ ] Review existing tool execution patterns
- [ ] Analyze parameter extraction and conversion requirements
- [ ] Plan adapter interface design
- [ ] Define fallback and error handling strategies

### Implementation Steps

1. [ ] Create LegacyToolAdapter with dual execution paths
2. [ ] Implement XMLParameterParser with robust parsing
3. [ ] Create ToolResultConverter for format conversion
4. [ ] Integrate adapter with presentAssistantMessage.ts
5. [ ] Add comprehensive parameter conversion logic
6. [ ] Implement error handling and fallback mechanisms
7. [ ] Add configuration options for adapter behavior
8. [ ] Create comprehensive unit and integration tests

### Post-Implementation

- [ ] Run TypeScript compilation: `cd src && npm run check-types`
- [ ] Execute unit tests: `cd src && npx vitest run transitional/`
- [ ] Test integration with existing tools
- [ ] Validate backward compatibility
- [ ] Test performance overhead (<5% requirement)

---

## 8. Risk Mitigation

### Technical Risks

1. **Parameter Conversion Errors**: Type conversion may introduce bugs

    - **Mitigation**: Comprehensive testing, validation, fallback mechanisms
    - **Strategy**: Progressive rollout with monitoring

2. **Performance Overhead**: Adapter layer may slow execution

    - **Mitigation**: Efficient conversion logic, minimal overhead design
    - **Monitoring**: Performance benchmarking and optimization

3. **Compatibility Issues**: New/old system integration may break
    - **Mitigation**: Thorough integration testing, feature flags
    - **Strategy**: Gradual migration with rollback capability

### Integration Risks

1. **Tool Execution Flow Changes**: Modifying core execution may have side effects

    - **Mitigation**: Careful integration, preserve existing patterns
    - **Testing**: Comprehensive regression testing

2. **Error Handling Conflicts**: Different error handling approaches may conflict
    - **Mitigation**: Unified error handling, clear error propagation
    - **Strategy**: Consistent error reporting and logging

---

## 9. Success Criteria

### Functional Requirements

- [ ] Seamless backward compatibility with existing XML tools
- [ ] Automatic parameter conversion between XML and LangChain formats
- [ ] Intelligent fallback from new wrappers to legacy tools
- [ ] Result format conversion between different systems
- [ ] Error handling and recovery mechanisms
- [ ] Configuration options for adapter behavior

### Quality Requirements

- [ ] Unit test coverage >95%
- [ ] Integration test coverage >90%
- [ ] Performance overhead <5% for tool execution
- [ ] TypeScript strict mode compliance
- [ ] No breaking changes to existing functionality

### Compatibility Requirements

- [ ] All existing tools continue to work without modification
- [ ] New tool wrappers integrate seamlessly
- [ ] Parameter conversion preserves data integrity
- [ ] Error handling maintains existing patterns
- [ ] Result delivery matches existing expectations

---

## 10. External References

### Adapter Pattern Documentation

- [Adapter Pattern](https://refactoring.guru/design-patterns/adapter-pattern): Adapter pattern implementation
- [Legacy System Migration](https://martinfowler.com/articles/legacySystemModernization.html): Legacy system modernization
- [Backward Compatibility](https://12factor.net/backwards-compatibility/): Backward compatibility strategies

### XML Parsing Libraries

- [fast-xml-parser](https://github.com/ibrahim/fast-xml-parser): Fast XML parsing
- [xml2js](https://github.com/Leonidas-from-XIV/node-xml2js): XML to JavaScript conversion
- [sax-js](https://github.com/isaacs/sax-js): Streaming XML parser

### Type Conversion Libraries

- [TypeScript Type Guards](https://www.typescriptlang.org/docs/handbook/advanced-types.html): Type checking and conversion
- [Zod Validation](https://zod.dev/): Schema validation with TypeScript
- [io-ts](https://github.com/io-ts/io-ts): Runtime type checking

---

**Note**: This context provides comprehensive backward compatibility implementation guidance based on analysis of existing tool execution patterns, external best practices, and established architectural patterns. All implementation steps should preserve existing functionality while enabling smooth migration to new tool wrapper systems.
