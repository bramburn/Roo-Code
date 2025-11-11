import { z } from "zod"
import { ParameterValidation, ValidationRuleConfig } from "../types/ValidationTypes"

/**
 * Validation rules builder for creating Zod schemas from rule configurations
 */
export class ValidationRules {
	/**
	 * Create a Zod schema from validation rules
	 */
	public static createSchema(rules: ValidationRuleConfig[]): z.ZodTypeAny {
		let schema: z.ZodTypeAny = z.any()

		for (const rule of rules) {
			schema = this.applyRule(schema, rule)
		}

		return schema
	}

	/**
	 * Apply a single validation rule to a schema
	 */
	private static applyRule(schema: z.ZodTypeAny, rule: ValidationRuleConfig): z.ZodTypeAny {
		switch (rule.type) {
			case "required":
				return this.makeRequired(schema, rule.message)
			case "optional":
				return schema.optional()
			case "string":
				return this.applyStringRules(schema, rule)
			case "number":
				return this.applyNumberRules(schema, rule)
			case "boolean":
				return this.applyBooleanRules(schema, rule)
			case "array":
				return this.applyArrayRules(schema, rule)
			case "object":
				return this.applyObjectRules(schema, rule)
			case "email":
				return this.applyEmailRules(schema, rule)
			case "url":
				return this.applyUrlRules(schema, rule)
			case "min":
				return this.applyMinRules(schema, rule)
			case "max":
				return this.applyMaxRules(schema, rule)
			case "pattern":
				return this.applyPatternRules(schema, rule)
			default:
				return schema
		}
	}

	/**
	 * Make schema required
	 */
	private static makeRequired(schema: z.ZodTypeAny, message?: string): z.ZodEffects<z.ZodTypeAny> {
		return schema.refine((val) => val !== undefined && val !== null && val !== "", {
			message: message || "This field is required",
		})
	}

	/**
	 * Apply string validation rules
	 */
	private static applyStringRules(schema: z.ZodTypeAny, rule: ValidationRuleConfig): z.ZodString {
		let stringSchema = schema instanceof z.ZodString ? schema : z.string()

		if (rule.value && typeof rule.value === "object") {
			const options = rule.value
			if (options.min !== undefined) {
				stringSchema = stringSchema.min(options.min, options.message || rule.message)
			}
			if (options.max !== undefined) {
				stringSchema = stringSchema.max(options.max, options.message || rule.message)
			}
			if (options.pattern) {
				stringSchema = stringSchema.regex(new RegExp(options.pattern), options.message || rule.message)
			}
			if (options.email) {
				stringSchema = stringSchema.email(options.message || rule.message)
			}
			if (options.url) {
				stringSchema = stringSchema.url(options.message || rule.message)
			}
		}

		return stringSchema
	}

	/**
	 * Apply number validation rules
	 */
	private static applyNumberRules(schema: z.ZodTypeAny, rule: ValidationRuleConfig): z.ZodNumber {
		let numberSchema = schema instanceof z.ZodNumber ? schema : z.number()

		if (rule.value && typeof rule.value === "object") {
			const options = rule.value
			if (options.min !== undefined) {
				numberSchema = numberSchema.min(options.min, options.message || rule.message)
			}
			if (options.max !== undefined) {
				numberSchema = numberSchema.max(options.max, options.message || rule.message)
			}
			if (options.integer) {
				numberSchema = numberSchema.int(options.message || rule.message)
			}
			if (options.positive) {
				numberSchema = numberSchema.positive(options.message || rule.message)
			}
			if (options.negative) {
				numberSchema = numberSchema.negative(options.message || rule.message)
			}
		}

		return numberSchema
	}

	/**
	 * Apply boolean validation rules
	 */
	private static applyBooleanRules(schema: z.ZodTypeAny, rule: ValidationRuleConfig): z.ZodBoolean {
		return schema instanceof z.ZodBoolean ? schema : z.boolean()
	}

	/**
	 * Apply array validation rules
	 */
	private static applyArrayRules(schema: z.ZodTypeAny, rule: ValidationRuleConfig): z.ZodArray<any> {
		let arraySchema: z.ZodArray<any>

		if (schema instanceof z.ZodArray) {
			arraySchema = schema
		} else {
			const itemType = rule.value?.itemType || z.any()
			arraySchema = z.array(itemType)
		}

		if (rule.value && typeof rule.value === "object") {
			const options = rule.value
			if (options.min !== undefined) {
				arraySchema = arraySchema.min(options.min, options.message || rule.message)
			}
			if (options.max !== undefined) {
				arraySchema = arraySchema.max(options.max, options.message || rule.message)
			}
			if (options.length) {
				arraySchema = arraySchema.length(options.length, options.message || rule.message)
			}
		}

		return arraySchema
	}

	/**
	 * Apply object validation rules
	 */
	private static applyObjectRules(schema: z.ZodTypeAny, rule: ValidationRuleConfig): z.ZodObject<any> {
		if (schema instanceof z.ZodObject) {
			return schema
		}

		const shape = rule.value?.shape || {}
		return z.object(shape)
	}

	/**
	 * Apply email validation rules
	 */
	private static applyEmailRules(schema: z.ZodTypeAny, rule: ValidationRuleConfig): z.ZodString {
		let stringSchema = schema instanceof z.ZodString ? schema : z.string()
		return stringSchema.email(rule.message || "Invalid email format")
	}

	/**
	 * Apply URL validation rules
	 */
	private static applyUrlRules(schema: z.ZodTypeAny, rule: ValidationRuleConfig): z.ZodString {
		let stringSchema = schema instanceof z.ZodString ? schema : z.string()
		return stringSchema.url(rule.message || "Invalid URL format")
	}

	/**
	 * Apply minimum value rules
	 */
	private static applyMinRules(schema: z.ZodTypeAny, rule: ValidationRuleConfig): z.ZodTypeAny {
		const minValue = rule.value
		if (typeof minValue !== "number") return schema

		if (schema instanceof z.ZodString) {
			return schema.min(minValue, rule.message || `Must be at least ${minValue} characters`)
		}
		if (schema instanceof z.ZodNumber) {
			return schema.min(minValue, rule.message || `Must be at least ${minValue}`)
		}
		if (schema instanceof z.ZodArray) {
			return schema.min(minValue, rule.message || `Must have at least ${minValue} items`)
		}

		return schema
	}

	/**
	 * Apply maximum value rules
	 */
	private static applyMaxRules(schema: z.ZodTypeAny, rule: ValidationRuleConfig): z.ZodTypeAny {
		const maxValue = rule.value
		if (typeof maxValue !== "number") return schema

		if (schema instanceof z.ZodString) {
			return schema.max(maxValue, rule.message || `Must be at most ${maxValue} characters`)
		}
		if (schema instanceof z.ZodNumber) {
			return schema.max(maxValue, rule.message || `Must be at most ${maxValue}`)
		}
		if (schema instanceof z.ZodArray) {
			return schema.max(maxValue, rule.message || `Must have at most ${maxValue} items`)
		}

		return schema
	}

	/**
	 * Apply pattern rules
	 */
	private static applyPatternRules(schema: z.ZodTypeAny, rule: ValidationRuleConfig): z.ZodTypeAny {
		const pattern = rule.value
		if (typeof pattern !== "string") return schema

		if (schema instanceof z.ZodString) {
			return schema.regex(new RegExp(pattern), rule.message || "Invalid format")
		}

		return schema
	}

	/**
	 * Create validation rules for common parameter types
	 */
	public static createCommonRules(): Record<string, ValidationRuleConfig[]> {
		return {
			path: [
				{ type: "required" as const, message: "File path is required" },
				{ type: "string" as const, value: { min: 1 }, message: "File path cannot be empty" },
			],
			content: [{ type: "required" as const, message: "Content is required" }, { type: "string" as const }],
			command: [
				{ type: "required" as const, message: "Command is required" },
				{ type: "string" as const, value: { min: 1 }, message: "Command cannot be empty" },
			],
			lineCount: [
				{
					type: "number" as const,
					value: { integer: true, min: 0 },
					message: "Line count must be a non-negative integer",
				},
			],
			startLine: [
				{
					type: "number" as const,
					value: { integer: true, min: 1 },
					message: "Start line must be a positive integer",
				},
			],
			endLine: [
				{
					type: "number" as const,
					value: { integer: true, min: -1 },
					message: "End line must be -1 or a positive integer",
				},
			],
			recursive: [{ type: "boolean" as const }],
			url: [{ type: "required" as const, message: "URL is required" }, { type: "url" as const }],
			email: [{ type: "required" as const, message: "Email is required" }, { type: "email" as const }],
			query: [
				{ type: "required" as const, message: "Query is required" },
				{ type: "string" as const, value: { min: 1 }, message: "Query cannot be empty" },
			],
		}
	}

	/**
	 * Get rules for a parameter by name
	 */
	public static getRulesForParameter(paramName: string): ValidationRuleConfig[] {
		const commonRules = this.createCommonRules()
		return commonRules[paramName] || [{ type: "string" as const }]
	}

	/**
	 * Create parameter validation from name and type
	 */
	public static createParameterValidation(
		name: string,
		required: boolean = false,
		type: "string" | "number" | "boolean" | "array" | "object" = "string",
	): ParameterValidation {
		const rules: ValidationRuleConfig[] = []

		if (required) {
			rules.push({ type: "required", message: `${name} is required` })
		} else {
			rules.push({ type: "optional" })
		}

		rules.push({ type })

		return {
			name,
			rules,
			description: `Parameter: ${name} (${type}${required ? ", required" : ", optional"})`,
		}
	}
}
