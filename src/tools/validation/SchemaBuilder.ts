import { z } from "zod"
import { ToolParamName } from "../../shared/tools"
import { ParameterValidation, ToolValidationDefinition } from "../types/ValidationTypes"
import { ValidationRules } from "./ValidationRules"

/**
 * Schema builder for creating Zod schemas from tool definitions
 */
export class SchemaBuilder {
	/**
	 * Build a Zod schema from a tool validation definition
	 */
	public static buildSchema(definition: ToolValidationDefinition): z.ZodSchema {
		const schemaFields: Record<string, z.ZodTypeAny> = {}

		for (const param of definition.parameters) {
			schemaFields[param.name] = ValidationRules.createSchema(param.rules)
		}

		let schema = z.object(schemaFields)

		// Apply strict or unknown handling
		if (definition.strict) {
			schema = schema.strict()
		} else if (!definition.allowUnknown) {
			schema = schema.passthrough()
		}

		return schema
	}

	/**
	 * Create a schema for writeToFile tool
	 */
	public static createWriteToFileSchema(): z.ZodSchema {
		return z.object({
			path: z.string().min(1, "File path is required"),
			content: z.string().min(1, "Content is required"),
			line_count: z.coerce.number().int().min(0).optional(),
		})
	}

	/**
	 * Create a schema for readFile tool
	 */
	public static createReadFileSchema(): z.ZodSchema {
		return z.object({
			path: z.string().min(1, "File path is required"),
			start_line: z.coerce.number().int().min(1).optional(),
			end_line: z.coerce.number().int().min(-1).optional(),
			include_line_numbers: z.coerce.boolean().optional().default(false),
		})
	}

	/**
	 * Create a schema for executeCommand tool
	 */
	public static createExecuteCommandSchema(): z.ZodSchema {
		return z.object({
			command: z.string().min(1, "Command is required"),
			cwd: z.string().optional(),
		})
	}

	/**
	 * Create a schema for useMcpTool tool
	 */
	public static createUseMcpToolSchema(): z.ZodSchema {
		return z.object({
			server_name: z.string().min(1, "Server name is required"),
			tool_name: z.string().min(1, "Tool name is required"),
			arguments: z.string().optional(),
		})
	}

	/**
	 * Create a schema for accessMcpResource tool
	 */
	public static createAccessMcpResourceSchema(): z.ZodSchema {
		return z.object({
			server_name: z.string().min(1, "Server name is required"),
			uri: z.string().min(1, "URI is required"),
		})
	}

	/**
	 * Create a schema for listAvailableTools tool
	 */
	public static createListAvailableToolsSchema(): z.ZodSchema {
		return z.object({
			server_name: z.string().optional(),
		})
	}

	/**
	 * Create a schema for askFollowupQuestion tool
	 */
	public static createAskFollowupQuestionSchema(): z.ZodSchema {
		return z.object({
			question: z.string().min(1, "Question is required"),
		})
	}

	/**
	 * Create a schema for attemptCompletion tool
	 */
	public static createAttemptCompletionSchema(): z.ZodSchema {
		return z.object({
			result: z.string().min(1, "Result is required"),
			command: z.string().optional(),
		})
	}

	/**
	 * Create a schema for askQuestion tool
	 */
	public static createAskQuestionSchema(): z.ZodSchema {
		return z.object({
			question: z.string().min(1, "Question is required"),
		})
	}

	/**
	 * Create a schema for planModeResponse tool
	 */
	public static createPlanModeResponseSchema(): z.ZodSchema {
		return z.object({
			approval: z.enum(["approve", "reject", "revise"]),
			feedback: z.string().optional(),
			revised_plan: z.string().optional(),
		})
	}

	/**
	 * Create a schema for nop tool
	 */
	public static createNopSchema(): z.ZodSchema {
		return z.object({
			message: z.string().optional(),
		})
	}

	/**
	 * Create a schema for webSearch tool
	 */
	public static createWebSearchSchema(): z.ZodSchema {
		return z.object({
			query: z.string().min(1, "Query is required"),
		})
	}

	/**
	 * Create schemas for all built-in tools
	 */
	public static createBuiltInSchemas(): Record<string, z.ZodSchema> {
		return {
			write_to_file: this.createWriteToFileSchema(),
			read_file: this.createReadFileSchema(),
			execute_command: this.createExecuteCommandSchema(),
			use_mcp_tool: this.createUseMcpToolSchema(),
			access_mcp_resource: this.createAccessMcpResourceSchema(),
			list_available_tools: this.createListAvailableToolsSchema(),
			ask_followup_question: this.createAskFollowupQuestionSchema(),
			attempt_completion: this.createAttemptCompletionSchema(),
			ask_question: this.createAskQuestionSchema(),
			plan_mode_response: this.createPlanModeResponseSchema(),
			nop: this.createNopSchema(),
			web_search: this.createWebSearchSchema(),
		}
	}

	/**
	 * Get a schema for a specific tool name
	 */
	public static getSchemaForTool(toolName: string): z.ZodSchema | undefined {
		const schemas = this.createBuiltInSchemas()
		return schemas[toolName]
	}

	/**
	 * Create a schema from parameter names and requirements
	 */
	public static createSchemaFromParameters(
		requiredParams: ToolParamName[],
		optionalParams: ToolParamName[] = [],
	): z.ZodSchema {
		const schemaFields: Record<string, z.ZodTypeAny> = {}

		// Add required parameters
		for (const param of requiredParams) {
			schemaFields[param] = this.createZodTypeForParameter(param, true)
		}

		// Add optional parameters
		for (const param of optionalParams) {
			schemaFields[param] = this.createZodTypeForParameter(param, false)
		}

		return z.object(schemaFields)
	}

	/**
	 * Create appropriate Zod type for a parameter
	 */
	private static createZodTypeForParameter(paramName: ToolParamName, required: boolean): z.ZodTypeAny {
		const rules = ValidationRules.getRulesForParameter(paramName)
		let schema = ValidationRules.createSchema(rules)

		if (!required) {
			schema = schema.optional()
		}

		return schema
	}

	/**
	 * Create a combined schema for multiple tools
	 */
	public static createUnionSchema(toolNames: string[]): z.ZodSchema {
		const schemas = toolNames.map((name) => this.getSchemaForTool(name)).filter(Boolean) as z.ZodSchema[]

		if (schemas.length === 0) {
			return z.any()
		}

		if (schemas.length === 1) {
			return schemas[0]
		}

		return z.union(schemas)
	}

	/**
	 * Create a discriminated union schema for multiple tools
	 */
	public static createDiscriminatedUnionSchema(
		toolNameField: string = "tool_name",
	): z.ZodUnion<[z.ZodTypeAny, ...z.ZodTypeAny[]]> {
		const schemas = this.createBuiltInSchemas()
		const schemaList = Object.values(schemas)

		if (schemaList.length === 0) {
			throw new Error("No schemas available for union")
		}

		if (schemaList.length === 1) {
			return schemaList[0] as any
		}

		return z.union(schemaList as [z.ZodTypeAny, ...z.ZodTypeAny[]])
	}

	/**
	 * Validate a schema definition
	 */
	public static validateSchemaDefinition(definition: ToolValidationDefinition): {
		valid: boolean
		errors: string[]
	} {
		const errors: string[] = []

		if (!definition.toolName) {
			errors.push("Tool name is required")
		}

		if (!definition.parameters || definition.parameters.length === 0) {
			errors.push("At least one parameter must be defined")
		}

		for (const param of definition.parameters) {
			if (!param.name) {
				errors.push("Parameter name is required")
			}

			if (!param.rules || param.rules.length === 0) {
				errors.push(`Parameter ${param.name} must have at least one rule`)
			}
		}

		return {
			valid: errors.length === 0,
			errors,
		}
	}
}
