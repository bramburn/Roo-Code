import { z } from "zod"
import { ToolUse, ToolParamName } from "../../shared/tools"

/**
 * Validation result interface
 */
export interface ValidationResult<T = any> {
	success: boolean
	data?: T
	errors?: string[]
	warnings?: string[]
}

/**
 * Schema validation configuration
 */
export interface ValidationConfig {
	strict?: boolean
	allowUnknown?: boolean
	stripUnknown?: boolean
	coerce?: boolean
}

/**
 * Zod schema validator for tool parameters
 */
export class ZodSchemaValidator {
	private schemas: Map<string, z.ZodSchema> = new Map()
	private config: ValidationConfig

	constructor(config: ValidationConfig = {}) {
		this.config = {
			strict: true,
			allowUnknown: false,
			stripUnknown: true,
			coerce: true,
			...config,
		}
	}

	/**
	 * Register a schema for a tool
	 */
	public registerSchema(toolName: string, schema: z.ZodSchema): void {
		this.schemas.set(toolName, schema)
	}

	/**
	 * Get a schema for a tool
	 */
	public getSchema(toolName: string): z.ZodSchema | undefined {
		return this.schemas.get(toolName)
	}

	/**
	 * Validate tool parameters against registered schema
	 */
	public validateToolParameters(toolName: string, params: Record<string, any>): ValidationResult {
		const schema = this.getSchema(toolName)
		if (!schema) {
			return {
				success: false,
				errors: [`No schema registered for tool: ${toolName}`],
			}
		}

		return this.validate(schema, params)
	}

	/**
	 * Validate data against a schema
	 */
	public validate<T>(schema: z.ZodSchema<T>, data: unknown): ValidationResult<T> {
		try {
			const result = schema.safeParse(data, {
				errorMap: (issue, ctx) => {
					// Custom error messages for better UX
					switch (issue.code) {
						case z.ZodIssueCode.invalid_type:
							if (issue.received === "undefined") {
								return { message: `Missing required parameter: ${issue.path.join(".")}` }
							}
							return {
								message: `Invalid type for ${issue.path.join(".")}: expected ${issue.expected}, received ${issue.received}`,
							}
						case z.ZodIssueCode.invalid_string:
							if (issue.validation === "email") {
								return { message: `Invalid email format for ${issue.path.join(".")}` }
							}
							if (issue.validation === "url") {
								return { message: `Invalid URL format for ${issue.path.join(".")}` }
							}
							return { message: `Invalid string value for ${issue.path.join(".")}: ${issue.message}` }
						case z.ZodIssueCode.too_small:
							return {
								message: `Value too small for ${issue.path.join(".")}: minimum is ${issue.minimum}`,
							}
						case z.ZodIssueCode.too_big:
							return {
								message: `Value too large for ${issue.path.join(".")}: maximum is ${issue.maximum}`,
							}
						default:
							return { message: `Invalid value for ${issue.path.join(".")}: ${issue.message}` }
					}
				},
			})

			if (result.success) {
				return {
					success: true,
					data: result.data,
				}
			} else {
				const errors = result.error.issues.map((issue) => issue.message)
				return {
					success: false,
					errors,
				}
			}
		} catch (error) {
			return {
				success: false,
				errors: [`Validation error: ${error instanceof Error ? error.message : "Unknown error"}`],
			}
		}
	}

	/**
	 * Validate and convert ToolUse to LangChain parameters
	 */
	public validateToolUse(toolUse: ToolUse): ValidationResult<Record<string, any>> {
		const validation = this.validateToolParameters(toolUse.name, toolUse.params)

		if (!validation.success) {
			return validation
		}

		// Convert string parameters to appropriate types based on schema
		const convertedParams = this.convertParameters(toolUse.name, validation.data!)

		return {
			success: true,
			data: convertedParams,
		}
	}

	/**
	 * Convert parameters based on schema types
	 */
	private convertParameters(toolName: string, params: Record<string, any>): Record<string, any> {
		const schema = this.getSchema(toolName)
		if (!schema) {
			return params
		}

		const converted: Record<string, any> = {}

		// Get the schema shape if it's an object schema
		if (schema instanceof z.ZodObject) {
			const shape = schema._def.shape()

			for (const [key, value] of Object.entries(params)) {
				if (value === undefined || value === null) {
					continue
				}

				const fieldSchema = shape[key]
				if (fieldSchema) {
					converted[key] = this.convertValue(value, fieldSchema)
				} else if (this.config.allowUnknown) {
					converted[key] = value
				}
			}
		} else {
			// For non-object schemas, return as-is
			return params
		}

		return converted
	}

	/**
	 * Convert a single value based on its schema
	 */
	private convertValue(value: any, schema: z.ZodTypeAny): any {
		// If it's already not a string or coercion is disabled, return as-is
		if (typeof value !== "string" || !this.config.coerce) {
			return value
		}

		// Handle different schema types
		if (schema instanceof z.ZodNumber) {
			const num = Number(value)
			return isNaN(num) ? value : num
		}

		if (schema instanceof z.ZodBoolean) {
			if (value.toLowerCase() === "true") return true
			if (value.toLowerCase() === "false") return false
			return value
		}

		if (schema instanceof z.ZodArray) {
			try {
				return JSON.parse(value)
			} catch {
				return value
			}
		}

		if (schema instanceof z.ZodObject) {
			try {
				return JSON.parse(value)
			} catch {
				return value
			}
		}

		// Return as-is for strings and other types
		return value
	}

	/**
	 * Create a schema from legacy tool parameter definitions
	 */
	public createSchemaFromLegacyParams(
		toolName: string,
		requiredParams: ToolParamName[],
		optionalParams: ToolParamName[] = [],
	): z.ZodSchema {
		const schemaFields: Record<string, z.ZodTypeAny> = {}

		// Add required parameters
		for (const param of requiredParams) {
			schemaFields[param] = this.createZodTypeForParam(param, true)
		}

		// Add optional parameters
		for (const param of optionalParams) {
			schemaFields[param] = this.createZodTypeForParam(param, false)
		}

		return z.object(schemaFields)
	}

	/**
	 * Create appropriate Zod type for a tool parameter
	 */
	private createZodTypeForParam(paramName: ToolParamName, required: boolean): z.ZodTypeAny {
		let baseType: z.ZodTypeAny

		// Determine base type based on parameter name
		switch (paramName) {
			case "path":
			case "url":
			case "coordinate":
				baseType = z.string().min(1, "Path cannot be empty")
				break
			case "content":
			case "text":
			case "command":
			case "question":
			case "reason":
			case "message":
			case "prompt":
				baseType = z.string()
				break
			case "line_count":
			case "start_line":
			case "end_line":
			case "line":
			case "size":
				baseType = z.number().int().min(0)
				break
			case "recursive":
				baseType = z.boolean()
				break
			case "args":
			case "arguments":
				baseType = z.array(z.string())
				break
			case "todos":
				baseType = z.array(z.string())
				break
			default:
				baseType = z.string()
		}

		return required ? baseType : baseType.optional()
	}

	/**
	 * List all registered schemas
	 */
	public listSchemas(): string[] {
		return Array.from(this.schemas.keys())
	}

	/**
	 * Remove a schema
	 */
	public removeSchema(toolName: string): boolean {
		return this.schemas.delete(toolName)
	}

	/**
	 * Clear all schemas
	 */
	public clear(): void {
		this.schemas.clear()
	}

	/**
	 * Get validation statistics
	 */
	public getStats(): {
		totalSchemas: number
		schemaNames: string[]
		config: ValidationConfig
	} {
		return {
			totalSchemas: this.schemas.size,
			schemaNames: this.listSchemas(),
			config: { ...this.config },
		}
	}
}

// Global validator instance
export const globalZodSchemaValidator = new ZodSchemaValidator()
