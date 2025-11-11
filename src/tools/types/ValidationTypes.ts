import { z } from "zod"
import { ValidationResult } from "../validation/ZodSchemaValidator"

/**
 * Validation rule types
 */
export type ValidationRule =
	| "required"
	| "optional"
	| "string"
	| "number"
	| "boolean"
	| "array"
	| "object"
	| "email"
	| "url"
	| "min"
	| "max"
	| "pattern"

/**
 * Validation rule configuration
 */
export interface ValidationRuleConfig {
	type: ValidationRule
	value?: any
	message?: string
}

/**
 * Parameter validation definition
 */
export interface ParameterValidation {
	name: string
	rules: ValidationRuleConfig[]
	description?: string
}

/**
 * Tool validation definition
 */
export interface ToolValidationDefinition {
	toolName: string
	parameters: ParameterValidation[]
	strict?: boolean
	allowUnknown?: boolean
}

/**
 * Validation error details
 */
export interface ValidationError {
	path: string
	message: string
	code: string
	expected?: string
	received?: string
}

/**
 * Enhanced validation result with detailed errors
 */
export interface DetailedValidationResult<T = any> extends ValidationResult<T> {
	detailedErrors?: ValidationError[]
	warnings?: string[]
	metadata?: {
		schemaVersion: string
		validationTime: number
		transformed: boolean
	}
}

/**
 * Schema transformation options
 */
export interface SchemaTransformOptions {
	coerceStrings?: boolean
	stripUnknown?: boolean
	defaultValues?: Record<string, any>
	transformers?: Record<string, (value: any) => any>
}

/**
 * Validation context for tool execution
 */
export interface ValidationContext {
	toolName: string
	executionId?: string
	userId?: string
	sessionId?: string
	requestId?: string
	timestamp: Date
}

/**
 * Validation metrics
 */
export interface ValidationMetrics {
	totalValidations: number
	successfulValidations: number
	failedValidations: number
	averageValidationTime: number
	errorDistribution: Record<string, number>
	lastValidationTime: Date
}

/**
 * Schema versioning
 */
export interface SchemaVersion {
	version: string
	schema: z.ZodSchema
	migrationFrom?: Record<string, (oldValue: any) => any>
	migrationTo?: Record<string, (newValue: any) => any>
	deprecationDate?: Date
	removalDate?: Date
}

/**
 * Validation pipeline stage
 */
export interface ValidationPipelineStage {
	name: string
	validator: (data: any, context: ValidationContext) => ValidationResult | Promise<ValidationResult>
	executeOnError?: boolean
}

/**
 * Composite validation result
 */
export interface CompositeValidationResult {
	overallSuccess: boolean
	stageResults: Array<{
		stageName: string
		success: boolean
		result: ValidationResult
		executionTime: number
	}>
	totalExecutionTime: number
	context: ValidationContext
}

/**
 * Validation cache entry
 */
export interface ValidationCacheEntry {
	result: ValidationResult
	timestamp: Date
	ttl: number
	contextHash: string
}

/**
 * Schema registry entry
 */
export interface SchemaRegistryEntry {
	name: string
	schema: z.ZodSchema
	version: string
	metadata: Record<string, any>
	createdAt: Date
	updatedAt: Date
}

/**
 * Validation event types
 */
export type ValidationEventType =
	| "validation.started"
	| "validation.completed"
	| "validation.failed"
	| "schema.registered"
	| "schema.updated"
	| "schema.removed"

/**
 * Validation event
 */
export interface ValidationEvent {
	type: ValidationEventType
	timestamp: Date
	data: {
		toolName?: string
		schemaName?: string
		result?: ValidationResult
		error?: Error
		metadata?: Record<string, any>
	}
}

/**
 * Validation configuration
 */
export interface ValidationSystemConfig {
	strictMode: boolean
	cacheEnabled: boolean
	cacheTTL: number
	maxCacheSize: number
	enableMetrics: boolean
	enableEvents: boolean
	logLevel: "debug" | "info" | "warn" | "error"
}
