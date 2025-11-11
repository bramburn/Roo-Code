# Sprint 2: Prompt Templates Implementation (2 Weeks) - Enhanced with Code Context

## Phase 1: Template Engine Infrastructure

### Task 2.1: RetryTemplateEngine Implementation

**File**: `src/core/tools/retry/RetryTemplateEngine.ts` (new file)
**Implementation Context**:

- Follow existing engine patterns from [`RetryEngine`](src/core/tools/retry/RetryEngine.ts:34)
- Use existing template variable replacement patterns from [`support-prompt.ts`](src/shared/support-prompt.ts:11)
- Integrate with existing settings validation patterns from [`RetryFactory`](src/core/tools/retry/RetryFactory.ts:72)

**Enhanced Implementation**:

```typescript
import { EventEmitter } from "events"
import type {
	RetryTemplate,
	RetryTemplateContext,
	RetryMessageType,
	RetryVisibilitySettings,
	ErrorClassification,
} from "./types.js"

export class RetryTemplateEngine extends EventEmitter {
	private templates: Map<string, RetryTemplate> = new Map()
	private compiledTemplates: Map<string, (context: RetryTemplateContext) => string> = new Map()

	constructor(private settings: RetryVisibilitySettings) {
		super()
		this.loadDefaultTemplates()
		this.loadCustomTemplates()
	}

	// Use {{variable}} syntax per PRD specification (different from ${variable} in support-prompt.ts)
	renderTemplate(type: RetryMessageType, context: RetryTemplateContext): string {
		const template = this.getTemplate(type)
		if (!template) {
			return this.getDefaultMessage(type, context)
		}

		// Use compiled template for performance (<100ms requirement)
		const compiled = this.compiledTemplates.get(template.id)
		if (compiled) {
			return compiled(context)
		}

		// Fallback to runtime compilation
		return this.compileAndRender(template, context)
	}

	validateTemplate(template: string): ValidationResult {
		// Follow existing validation patterns from RetryFactory.validateSettings
		const errors: string[] = []

		// Validate {{variable}} syntax
		const variableRegex = /\{\{(\w+)\}\}/g
		const variables = template.match(variableRegex)

		if (!variables) {
			errors.push("Template must contain at least one variable")
		}

		// Check for malformed variables
		const malformedVars = template.match(/\{[^}]*$/g)
		if (malformedVars) {
			errors.push(`Malformed variables: ${malformedVars.join(", ")}`)
		}

		// Validate required variables per message type
		const requiredVars = this.getRequiredVariables(template.type)
		const foundVars = variables?.map((v) => v.replace(/[{}]/g, "")) || []
		const missingVars = requiredVars.filter((v) => !foundVars.includes(v))

		if (missingVars.length > 0) {
			errors.push(`Missing required variables: ${missingVars.join(", ")}`)
		}

		return {
			isValid: errors.length === 0,
			errors,
		}
	}

	registerTemplate(type: string, template: string): void {
		const validation = this.validateTemplate(template)
		if (!validation.isValid) {
			throw new Error(`Invalid template: ${validation.errors.join(", ")}`)
		}

		const retryTemplate: RetryTemplate = {
			id: `custom_${type}_${Date.now()}`,
			name: `Custom ${type} Template`,
			description: `User-defined template for ${type} messages`,
			template,
			variables: this.extractVariables(template),
			category: type as any,
		}

		this.templates.set(retryTemplate.id, retryTemplate)
		this.compiledTemplates.set(retryTemplate.id, this.compileTemplate(template))

		// Save to settings using existing patterns
		this.saveCustomTemplate(retryTemplate)
	}

	private compileTemplate(template: string): (context: RetryTemplateContext) => string {
		// Pre-compile template for performance using existing patterns from support-prompt.ts:11
		const variableRegex = /\{\{(\w+)\}\}/g
		return (context: RetryTemplateContext) => {
			return template.replace(variableRegex, (match, variableName) => {
				const value = this.getVariableValue(variableName, context)
				return value !== undefined ? String(value) : match
			})
		}
	}

	private getVariableValue(variableName: string, context: RetryTemplateContext): any {
		// Follow existing variable resolution patterns from support-prompt.ts:12-28
		const variableMap: Record<string, any> = {
			retryId: context.retryId,
			toolName: context.toolName,
			attempt: context.attempt,
			maxAttempts: context.maxAttempts,
			error: context.error,
			errorType: context.errorClassification?.category,
			errorReason: context.error,
			timestamp: new Date().toISOString(),
			elapsedTime: context.duration,
			retryCount: context.attempt,
			nextRetryTime: context.nextRetryTime,
			totalDuration: context.totalDuration,
			successRate: context.successRate,
		}

		return variableMap[variableName]
	}
}
```

### Task 2.2: Template Interface Definitions

**File**: `src/core/tools/retry/types.ts`
**Lines**: Add after line 350 (after existing retry types)
**Implementation Context**:

- Follow existing interface patterns from [`RetryContext`](src/core/tools/retry/types.ts:15)
- Integrate with existing [`ErrorClassification`](src/core/tools/retry/types.ts:35) system
- Use consistent naming conventions with existing types

**Enhanced Implementation**:

```typescript
export interface RetryTemplate {
	id: string
	name: string
	description: string
	template: string
	variables: string[]
	category: "start" | "progress" | "success" | "failure"
	isCustom?: boolean
	createdAt?: number
	updatedAt?: number
}

export interface RetryTemplateContext {
	retryId: string
	toolName: string
	attempt: number
	maxAttempts: number
	error?: string
	errorClassification?: ErrorClassification // Reuse existing classification
	duration?: number
	nextRetryTime?: number
	totalDuration?: number
	successRate?: number
	startTime?: number
	originalToolCall?: any // Reuse existing tool call structure
}

export interface ValidationResult {
	isValid: boolean
	errors: string[]
	warnings?: string[]
}

export type RetryMessageType = "retry_start" | "retry_progress" | "retry_success" | "retry_failure"

// Template variable definitions for validation and documentation
export interface TemplateVariable {
	name: string
	description: string
	type: "string" | "number" | "boolean" | "object"
	required: boolean
	example?: any
}

export const TEMPLATE_VARIABLES: Record<string, TemplateVariable> = {
	retryId: {
		name: "retryId",
		description: "Unique identifier for the retry operation",
		type: "string",
		required: true,
		example: "retry_12345",
	},
	toolName: {
		name: "toolName",
		description: "Name of the tool being retried",
		type: "string",
		required: true,
		example: "readFile",
	},
	attempt: {
		name: "attempt",
		description: "Current attempt number (1-based)",
		type: "number",
		required: true,
		example: 2,
	},
	maxAttempts: {
		name: "maxAttempts",
		description: "Maximum number of retry attempts",
		type: "number",
		required: true,
		example: 3,
	},
	error: {
		name: "error",
		description: "Error message from failed attempt",
		type: "string",
		required: false,
		example: "Permission denied",
	},
	errorType: {
		name: "errorType",
		description: "Error classification category",
		type: "string",
		required: false,
		example: "permission",
	},
	nextRetryTime: {
		name: "nextRetryTime",
		description: "Timestamp of next retry attempt",
		type: "number",
		required: false,
		example: 1640995260000,
	},
}
```

### Task 2.3: Settings Schema Extension

**File**: `packages/types/src/global-settings.ts`
**Lines**: Add to existing GlobalSettings interface (around line 316, after retrySettings)
**Implementation Context**:

- Follow existing settings patterns from [`GlobalSettings`](packages/types/src/global-settings.ts:174)
- Use existing Zod validation patterns from [`retrySettingsSchema`](packages/types/src/global-settings.ts:50)
- Integrate with existing settings migration system

**Enhanced Implementation**:

```typescript
// Add after retrySettingsSchema (around line 119)
export const retryVisibilitySettingsSchema = z.object({
	/**
	 * Whether to show retry messages in chat
	 * @default true
	 */
	enableRetryChatOutput: z.boolean().optional(),

	/**
	 * Whether to show detailed retry progress
	 * @default false
	 */
	enableDetailedProgress: z.boolean().optional(),

	/**
	 * Whether to consolidate multiple retry messages
	 * @default true
	 */
	consolidateMessages: z.boolean().optional(),

	/**
	 * Maximum number of progress messages to show
	 * @min 1
	 * @max 10
	 * @default 3
	 */
	maxProgressMessages: z.number().int().min(1).max(10).optional(),

	/**
	 * Custom retry templates defined by user
	 * @default {}
	 */
	customTemplates: z.record(z.string(), z.string()).optional(),

	/**
	 * Custom template variables for user-defined context
	 * @default {}
	 */
	templateVariables: z.record(z.string(), z.any()).optional(),

	/**
	 * Active template IDs for each message type
	 * @default {}
	 */
	activeTemplateIds: z.record(z.string(), z.string()).optional(),

	/**
	 * Whether to enable template preview
	 * @default true
	 */
	enablePreview: z.boolean().optional(),

	/**
	 * Whether to auto-save template changes
	 * @default true
	 */
	autoSave: z.boolean().optional(),
})

export type RetryVisibilitySettings = z.infer<typeof retryVisibilitySettingsSchema>

// Add to GlobalSettings interface (around line 317)
export const globalSettingsSchema = z.object({
	// ... existing settings
	retrySettings: retrySettingsSchema.optional(),
	retryVisibility: retryVisibilitySettingsSchema.optional(), // New addition
})

// Add default settings (around line 489)
export const DEFAULT_RETRY_VISIBILITY_SETTINGS: RetryVisibilitySettings = {
	enableRetryChatOutput: true,
	enableDetailedProgress: false,
	consolidateMessages: true,
	maxProgressMessages: 3,
	customTemplates: {},
	templateVariables: {},
	activeTemplateIds: {},
	enablePreview: true,
	autoSave: true,
}

// Update EVALS_SETTINGS (around line 489)
export const EVALS_SETTINGS: RooCodeSettings = {
	// ... existing settings
	retrySettings: DEFAULT_RETRY_SETTINGS,
	retryVisibility: DEFAULT_RETRY_VISIBILITY_SETTINGS,
}
```

### Task 2.4: Default Template Definitions

**File**: `src/core/tools/retry/defaultTemplates.ts` (new file)
**Implementation Context**:

- Follow existing template patterns from [`support-prompt.ts`](src/shared/support-prompt.ts:47)
- Use {{variable}} syntax per PRD specification
- Provide both minimal and detailed template variants

**Enhanced Implementation**:

```typescript
import type { RetryTemplate, RetryMessageType } from "./types.js"

export const DEFAULT_RETRY_TEMPLATES: Record<RetryMessageType, string> = {
	retry_start: "🔄 Retrying {{toolName}} (attempt {{attempt}}/{{maxAttempts}})",
	retry_progress: "⏳ {{toolName}} retry {{attempt}}/{{maxAttempts}} in progress...",
	retry_success: "✅ {{toolName}} succeeded after {{attempt}} attempts ({{totalDuration}}ms)",
	retry_failure: "❌ {{toolName}} failed after {{maxAttempts}} attempts: {{error}}",
}

export const DETAILED_RETRY_TEMPLATES: Record<RetryMessageType, string> = {
	retry_start:
		"🔄 **{{toolName}}** retry initiated\n" +
		"- Attempt: {{attempt}}/{{maxAttempts}}\n" +
		"- Error: {{error}}\n" +
		"- Classification: {{errorType}}",
	retry_progress:
		"⏳ **{{toolName}}** retry progress\n" +
		"- Current attempt: {{attempt}}/{{maxAttempts}}\n" +
		"- Next retry: {{nextRetryTime}}",
	retry_success:
		"✅ **{{toolName}}** retry successful\n" +
		"- Total attempts: {{attempt}}\n" +
		"- Duration: {{totalDuration}}ms\n" +
		"- Success rate: {{successRate}}%",
	retry_failure:
		"❌ **{{toolName}}** retry failed\n" +
		"- Attempts: {{maxAttempts}}\n" +
		"- Final error: {{error}}\n" +
		"- Classification: {{errorType}}",
}

export const DEFAULT_TEMPLATE_DEFINITIONS: RetryTemplate[] = [
	{
		id: "default_retry_start",
		name: "Default Retry Start",
		description: "Standard template for retry start messages",
		template: DEFAULT_RETRY_TEMPLATES.retry_start,
		variables: ["toolName", "attempt", "maxAttempts"],
		category: "start",
		isCustom: false,
	},
	{
		id: "default_retry_progress",
		name: "Default Retry Progress",
		description: "Standard template for retry progress messages",
		template: DEFAULT_RETRY_TEMPLATES.retry_progress,
		variables: ["toolName", "attempt", "maxAttempts"],
		category: "progress",
		isCustom: false,
	},
	{
		id: "default_retry_success",
		name: "Default Retry Success",
		description: "Standard template for retry success messages",
		template: DEFAULT_RETRY_TEMPLATES.retry_success,
		variables: ["toolName", "attempt", "totalDuration"],
		category: "success",
		isCustom: false,
	},
	{
		id: "default_retry_failure",
		name: "Default Retry Failure",
		description: "Standard template for retry failure messages",
		template: DEFAULT_RETRY_TEMPLATES.retry_failure,
		variables: ["toolName", "maxAttempts", "error"],
		category: "failure",
		isCustom: false,
	},
	{
		id: "detailed_retry_start",
		name: "Detailed Retry Start",
		description: "Detailed template for retry start messages",
		template: DETAILED_RETRY_TEMPLATES.retry_start,
		variables: ["toolName", "attempt", "maxAttempts", "error", "errorType"],
		category: "start",
		isCustom: false,
	},
	{
		id: "detailed_retry_progress",
		name: "Detailed Retry Progress",
		description: "Detailed template for retry progress messages",
		template: DETAILED_RETRY_TEMPLATES.retry_progress,
		variables: ["toolName", "attempt", "maxAttempts", "nextRetryTime"],
		category: "progress",
		isCustom: false,
	},
	{
		id: "detailed_retry_success",
		name: "Detailed Retry Success",
		description: "Detailed template for retry success messages",
		template: DETAILED_RETRY_TEMPLATES.retry_success,
		variables: ["toolName", "attempt", "totalDuration", "successRate"],
		category: "success",
		isCustom: false,
	},
	{
		id: "detailed_retry_failure",
		name: "Detailed Retry Failure",
		description: "Detailed template for retry failure messages",
		template: DETAILED_RETRY_TEMPLATES.retry_failure,
		variables: ["toolName", "maxAttempts", "error", "errorType"],
		category: "failure",
		isCustom: false,
	},
]
```

## Phase 2: Template Management System

### Task 2.5: Template Validation Logic

**File**: `src/core/tools/retry/RetryTemplateEngine.ts`
**Lines**: Add validation methods (around line 50)
**Implementation Context**:

- Follow existing validation patterns from [`RetryFactory.validateSettings`](src/core/tools/retry/RetryFactory.ts:72)
- Use existing regex patterns for template validation
- Integrate with existing error handling patterns

**Enhanced Implementation**:

```typescript
// Add to RetryTemplateEngine class
private validateTemplateSyntax(template: string): ValidationResult {
	const errors: string[] = []
	const warnings: string[] = []

	// Validate {{variable}} syntax (not ${variable} like support-prompt.ts)
	const variablePattern = /\{\{([^}]+)\}\}/g
	const variables = template.match(variablePattern)

	if (!variables) {
		errors.push("Template must contain at least one variable")
		return { isValid: false, errors, warnings }
	}

	// Check for malformed variable syntax
	const malformedBraces = template.match(/\{[^{]|[^}]\}/g)
	if (malformedBraces) {
		errors.push(`Malformed variable syntax: ${malformedBraces.join(", ")}`)
	}

	// Validate variable names
	variables.forEach(variable => {
		const varName = variable.replace(/[{}]/g, '')

		// Check for invalid characters
		if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(varName)) {
			errors.push(`Invalid variable name: ${varName}. Must start with letter/underscore and contain only letters, numbers, underscores`)
		}

		// Check for reserved words
		const reservedWords = ['if', 'else', 'for', 'while', 'function', 'return']
		if (reservedWords.includes(varName)) {
			warnings.push(`Variable name '${varName}' is a reserved word and may cause issues`)
		}
	})

	// Check for nested variables (not supported)
	const nestedVarPattern = /\{\{[^}]*\{[^}]*\}\}/g
	if (nestedVarPattern.test(template)) {
		warnings.push("Nested variables are not supported and may not render as expected")
	}

	return {
		isValid: errors.length === 0,
		errors,
		warnings
	}
}

private validateRequiredVariables(template: RetryTemplate): ValidationResult {
	const errors: string[] = []
	const requiredVars = this.getRequiredVariables(template.category)
	const foundVars = template.variables || []

	const missingVars = requiredVars.filter(requiredVar =>
		!foundVars.some(foundVar => foundVar === requiredVar)
	)

	if (missingVars.length > 0) {
		errors.push(`Missing required variables for ${template.category}: ${missingVars.join(", ")}`)
	}

	return {
		isValid: errors.length === 0,
		errors
	}
}

private getRequiredVariables(category: string): string[] {
	switch (category) {
		case "start":
			return ["toolName", "attempt", "maxAttempts"]
		case "progress":
			return ["toolName", "attempt", "maxAttempts"]
		case "success":
			return ["toolName", "attempt", "totalDuration"]
		case "failure":
			return ["toolName", "maxAttempts", "error"]
		default:
			return []
	}
}
```

### Task 2.6: Settings Integration Layer

**File**: `src/core/tools/retry/RetrySettingsManager.ts` (new file)
**Implementation Context**:

- Follow existing settings patterns from [`global-settings.ts`](packages/types/src/global-settings.ts:174)
- Use existing settings persistence and loading patterns
- Integrate with existing settings validation system

**Enhanced Implementation**:

```typescript
import type { RetryVisibilitySettings, RetryTemplate } from "./types.js"
import { DEFAULT_RETRY_VISIBILITY_SETTINGS } from "./defaultTemplates.js"

export class RetrySettingsManager {
	private settings: RetryVisibilitySettings

	constructor(
		private getGlobalSettings: () => any,
		private updateGlobalSettings: (updates: any) => void,
	) {
		this.settings = this.loadSettings()
	}

	loadSettings(): RetryVisibilitySettings {
		// Use existing settings loading patterns
		const globalSettings = this.getGlobalSettings()
		return {
			...DEFAULT_RETRY_VISIBILITY_SETTINGS,
			...globalSettings.retryVisibility,
		}
	}

	saveSettings(updates: Partial<RetryVisibilitySettings>): void {
		// Use existing settings update patterns
		const updatedSettings = {
			...this.settings,
			...updates,
		}

		this.updateGlobalSettings({
			retryVisibility: updatedSettings,
		})

		this.settings = updatedSettings
	}

	getCustomTemplates(): Record<string, string> {
		return this.settings.customTemplates || {}
	}

	saveCustomTemplate(template: RetryTemplate): void {
		const customTemplates = {
			...this.getCustomTemplates(),
			[template.id]: template.template,
		}

		this.saveSettings({
			customTemplates,
			activeTemplateIds: {
				...this.settings.activeTemplateIds,
				[template.category]: template.id,
			},
		})
	}

	deleteCustomTemplate(templateId: string): void {
		const customTemplates = this.getCustomTemplates()
		delete customTemplates[templateId]

		// Update active template IDs if necessary
		const activeIds = { ...this.settings.activeTemplateIds }
		Object.keys(activeIds).forEach((category) => {
			if (activeIds[category] === templateId) {
				delete activeIds[category]
			}
		})

		this.saveSettings({
			customTemplates,
			activeTemplateIds: activeIds,
		})
	}

	getActiveTemplateId(category: string): string {
		return this.settings.activeTemplateIds?.[category] || `default_${category}`
	}

	setActiveTemplateId(category: string, templateId: string): void {
		this.saveSettings({
			activeTemplateIds: {
				...this.settings.activeTemplateIds,
				[category]: templateId,
			},
		})
	}

	validateSettings(settings: RetryVisibilitySettings): ValidationResult {
		// Use existing validation patterns from RetryFactory
		const errors: string[] = []

		if (settings.maxProgressMessages !== undefined) {
			if (settings.maxProgressMessages < 1 || settings.maxProgressMessages > 10) {
				errors.push("maxProgressMessages must be between 1 and 10")
			}
		}

		// Validate custom templates
		if (settings.customTemplates) {
			Object.entries(settings.customTemplates).forEach(([id, template]) => {
				const validation = this.validateTemplateSyntax(template)
				if (!validation.isValid) {
					errors.push(`Custom template '${id}': ${validation.errors.join(", ")}`)
				}
			})
		}

		return {
			isValid: errors.length === 0,
			errors,
		}
	}
}
```

### Task 2.7: Template Variable Resolver

**File**: `src/core/tools/retry/RetryTemplateEngine.ts`
**Lines**: Add variable resolution (around line 80)
**Implementation Context**:

- Follow existing variable resolution patterns from [`support-prompt.ts`](src/shared/support-prompt.ts:11)
- Use {{variable}} syntax instead of ${variable} for PRD compliance
- Handle missing variables gracefully with fallbacks

**Enhanced Implementation**:

```typescript
// Add to RetryTemplateEngine class
private resolveVariables(template: string, context: RetryTemplateContext): string {
	// Use {{variable}} syntax (different from support-prompt.ts ${variable})
	const variableRegex = /\{\{(\w+)\}\}/g

	return template.replace(variableRegex, (match, variableName) => {
		const value = this.getVariableValue(variableName, context)

		// Handle missing variables gracefully
		if (value === undefined || value === null) {
			// Log warning for debugging
			console.warn(`Template variable '${variableName}' not found in context`)
			return match // Keep original placeholder
		}

		// Format value based on type
		return this.formatVariableValue(value, variableName)
	})
}

private formatVariableValue(value: any, variableName: string): string {
	// Follow existing formatting patterns from support-prompt.ts:17-23
	if (typeof value === "string") {
		return value
	}

	if (typeof value === "number") {
		// Format numbers appropriately
		if (variableName.includes("Time") || variableName.includes("Duration")) {
			return value.toString()
		}
		return value.toString()
	}

	if (typeof value === "boolean") {
		return value ? "true" : "false"
	}

	if (typeof value === "object") {
		try {
			return JSON.stringify(value, null, 2)
		} catch (error) {
			return "[Object]"
		}
	}

	// Fallback for other types
	return String(value)
}

private getVariableValue(variableName: string, context: RetryTemplateContext): any {
	// Enhanced variable mapping with more context
	const variableMap: Record<string, any> = {
		// Basic retry information
		retryId: context.retryId,
		toolName: context.toolName,
		attempt: context.attempt,
		maxAttempts: context.maxAttempts,

		// Error information
		error: context.error,
		errorType: context.errorClassification?.category,
		errorSeverity: context.errorClassification?.severity,
		errorReason: context.error,

		// Timing information
		timestamp: new Date().toISOString(),
		elapsedTime: context.duration,
		nextRetryTime: context.nextRetryTime ? new Date(context.nextRetryTime).toISOString() : undefined,
		totalDuration: context.totalDuration,

		// Statistics
		successRate: context.successRate,
		retryCount: context.attempt,

		// Tool information
		toolType: context.originalToolCall?.name,
		toolArgs: context.originalToolCall?.args,
	}

	return variableMap[variableName]
}
```

### Task 2.8: Template Registration System

**File**: `src/core/tools/retry/RetryTemplateEngine.ts`
**Lines**: Add registration methods (around line 120)
**Implementation Context**:

- Follow existing registration patterns from settings system
- Support template categories and metadata
- Validate templates on registration using existing validation patterns

**Enhanced Implementation**:

```typescript
// Add to RetryTemplateEngine class
registerCustomTemplate(template: string, category: RetryMessageType, metadata?: Partial<RetryTemplate>): string {
	const validation = this.validateTemplateSyntax(template)
	if (!validation.isValid) {
		throw new Error(`Invalid template: ${validation.errors.join(", ")}`)
	}

	const templateId = `custom_${category}_${Date.now()}`
	const retryTemplate: RetryTemplate = {
		id: templateId,
		name: metadata?.name || `Custom ${category} Template`,
		description: metadata?.description || `User-defined template for ${category} messages`,
		template,
		variables: this.extractVariables(template),
		category,
		isCustom: true,
		createdAt: Date.now(),
		updatedAt: Date.now()
	}

	// Register in memory
	this.templates.set(templateId, retryTemplate)
	this.compiledTemplates.set(templateId, this.compileTemplate(template))

	// Save to settings using existing patterns
	this.settingsManager.saveCustomTemplate(retryTemplate)

	// Emit registration event
	this.emit("templateRegistered", retryTemplate)

	return templateId
}

updateTemplate(templateId: string, updates: Partial<RetryTemplate>): void {
	const existingTemplate = this.templates.get(templateId)
	if (!existingTemplate) {
		throw new Error(`Template not found: ${templateId}`)
	}

	const updatedTemplate: RetryTemplate = {
		...existingTemplate,
		...updates,
		updatedAt: Date.now()
	}

	// Validate updated template
	if (updates.template) {
		const validation = this.validateTemplateSyntax(updates.template)
		if (!validation.isValid) {
			throw new Error(`Invalid template update: ${validation.errors.join(", ")}`)
		}
	}

	// Update in memory
	this.templates.set(templateId, updatedTemplate)

	// Recompile if template changed
	if (updates.template) {
		this.compiledTemplates.set(templateId, this.compileTemplate(updates.template))
	}

	// Save to settings
	this.settingsManager.saveCustomTemplate(updatedTemplate)

	// Emit update event
	this.emit("templateUpdated", updatedTemplate)
}

deleteTemplate(templateId: string): void {
	const template = this.templates.get(templateId)
	if (!template) {
		throw new Error(`Template not found: ${templateId}`)
	}

	// Cannot delete default templates
	if (!template.isCustom) {
		throw new Error("Cannot delete default templates")
	}

	// Remove from memory
	this.templates.delete(templateId)
	this.compiledTemplates.delete(templateId)

	// Remove from settings
	this.settingsManager.deleteCustomTemplate(templateId)

	// Emit deletion event
	this.emit("templateDeleted", { templateId, template })
}

getTemplatesByCategory(category?: RetryMessageType): RetryTemplate[] {
	const templates = Array.from(this.templates.values())

	if (category) {
		return templates.filter(template => template.category === category)
	}

	return templates
}

searchTemplates(query: string): RetryTemplate[] {
	const lowercaseQuery = query.toLowerCase()
	return Array.from(this.templates.values()).filter(template =>
		template.name.toLowerCase().includes(lowercaseQuery) ||
		template.description.toLowerCase().includes(lowercaseQuery) ||
		template.template.toLowerCase().includes(lowercaseQuery)
	)
}
```

## Phase 3: UI Components for Template Management

### Task 2.9: Template Editor Component

**File**: `webview-ui/src/components/TemplateEditor.tsx` (new file)
**Implementation Context**:

- Follow existing form patterns from [`ApiConfigManager`](webview-ui/src/components/settings/ApiConfigManager.tsx:188)
- Use existing validation and error display patterns
- Support {{variable}} syntax highlighting

**Enhanced Implementation**:

```typescript
import React, { memo, useState, useEffect, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { useExtensionState } from "@/context/ExtensionStateContext"

// Follow existing form patterns from ApiConfigManager.tsx
const TemplateEditor = memo(({
	template,
	onSave,
	onCancel
}: {
	template?: RetryTemplate
	onSave: (template: Partial<RetryTemplate>) => void
	onCancel: () => void
}) => {
	const { t } = useTranslation()
	const [name, setName] = useState(template?.name || "")
	const [description, setDescription] = useState(template?.description || "")
	const [templateText, setTemplateText] = useState(template?.template || "")
	const [errors, setErrors] = useState<string[]>([])
	const [isValid, setIsValid] = useState(false)

	// Validate template on change
	useEffect(() => {
		const validation = validateTemplate(templateText)
		setErrors(validation.errors)
		setIsValid(validation.isValid)
	}, [templateText])

	const handleSave = useCallback(() => {
		if (!isValid) return

		onSave({
			name,
			description,
			template: templateText,
			variables: extractVariables(templateText)
		})
	}, [name, description, templateText, isValid, onSave])

	const renderHighlightedTemplate = () => {
		// Highlight {{variable}} syntax
		const highlighted = templateText.replace(
			/\{\{(\w+)\}\}/g,
			(match, variable) => `<span class="template-variable">{{${variable}}}</span>`
		)
		return { __html: highlighted }
	}

	return (
		<div className="space-y-4">
			{/* Follow existing form structure from ApiConfigManager.tsx */}
			<div className="space-y-2">
				<label className="block font-medium">{t("templates:name")}</label>
				<Input
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder={t("templates:namePlaceholder")}
					className="w-full"
				/>
			</div>

			<div className="space-y-2">
				<label className="block font-medium">{t("templates:description")}</label>
				<Textarea
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					placeholder={t("templates:descriptionPlaceholder")}
					rows={3}
					className="w-full"
				/>
			</div>

			<div className="space-y-2">
				<label className="block font-medium">{t("templates:template")}</label>
				<div className="relative">
					<Textarea
						value={templateText}
						onChange={(e) => setTemplateText(e.target.value)}
						placeholder={t("templates:templatePlaceholder")}
						rows={8}
						className="w-full font-mono text-sm"
					/>

					{/* Template preview with highlighting */}
					<div
						className="mt-2 p-3 border rounded-md bg-vscode-editor-background text-sm"
						dangerouslySetInnerHTML={renderHighlightedTemplate()}
					/>
				</div>
			</div>

			{/* Variable hints */}
			<div className="space-y-2">
				<label className="block font-medium">{t("templates:availableVariables")}</label>
				<div className="flex flex-wrap gap-2">
					{extractVariables(templateText).map(variable => (
						<Badge key={variable} variant="secondary">
							{{variable}}
						</Badge>
					))}
				</div>
			</div>

			{/* Validation errors */}
			{errors.length > 0 && (
				<Alert>
					<AlertDescription>
						{errors.map((error, index) => (
							<div key={index}>{error}</div>
						))}
					</AlertDescription>
				</Alert>
			)}

			{/* Form actions */}
			<div className="flex justify-end gap-2 pt-4">
				<Button variant="outline" onClick={onCancel}>
					{t("common:cancel")}
				</Button>
				<Button onClick={handleSave} disabled={!isValid}>
					{t("common:save")}
				</Button>
			</div>
		</div>
	)
})

// Add CSS for template variable highlighting
const templateStyles = `
.template-variable {
	background-color: var(--vscode-editor-selectionBackground);
	color: var(--vscode-editor-selectionForeground);
	padding: 1px 2px;
	border-radius: 2px;
	font-weight: 500;
}
`

TemplateEditor.displayName = "TemplateEditor"
export default TemplateEditor
```

### Task 2.10: Template Preview Component

**File**: `webview-ui/src/components/TemplatePreview.tsx` (new file)
**Implementation Context**:

- Follow existing preview component patterns from webview-ui
- Use sample retry context for realistic preview
- Support different message types with live updates

**Enhanced Implementation**:

```typescript
import React, { memo, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Follow existing preview component patterns
const TemplatePreview = memo(({
	template,
	messageType
}: {
	template: string
	messageType: RetryMessageType
}) => {
	const { t } = useTranslation()
	const [previewContext, setPreviewContext] = useState<RetryTemplateContext>()
	const [renderedOutput, setRenderedOutput] = useState<string>("")

	// Sample context for preview
	useEffect(() => {
		const sampleContext: RetryTemplateContext = {
			retryId: "preview_retry_123",
			toolName: "readFile",
			attempt: 2,
			maxAttempts: 3,
			error: "Network timeout",
			errorClassification: {
				category: "network",
				severity: "medium",
				retryable: true,
				suggestedAction: "retry_with_backoff"
			},
			duration: 1500,
			nextRetryTime: Date.now() + 5000,
			totalDuration: 3000,
			successRate: 75,
			startTime: Date.now() - 3000,
			originalToolCall: {
				name: "readFile",
				args: { path: "src/example.txt" }
			}
		}

		setPreviewContext(sampleContext)

		// Render template with sample context
		const rendered = renderTemplateWithVariables(template, sampleContext)
		setRenderedOutput(rendered)
	}, [template, messageType])

	const renderTemplateWithVariables = (template: string, context: RetryTemplateContext): string => {
		return template.replace(/\{\{(\w+)\}\}/g, (match, variableName) => {
			const value = (context as any)[variableName]
			return value !== undefined ? String(value) : match
		})
	}

	const getMessageTypeColor = () => {
		switch (messageType) {
			case "retry_start":
				return "bg-blue-100 text-blue-800"
			case "retry_progress":
				return "bg-yellow-100 text-yellow-800"
			case "retry_success":
				return "bg-green-100 text-green-800"
			case "retry_failure":
				return "bg-red-100 text-red-800"
			default:
				return "bg-gray-100 text-gray-800"
		}
	}

	return (
		// Follow existing card structure from webview-ui
		<Card className="w-full">
			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle className="text-lg">{t("templates:preview")}</CardTitle>
					<Badge className={getMessageTypeColor()}>
						{messageType}
					</Badge>
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Sample context */}
				<div className="space-y-2">
					<h4 className="font-medium">{t("templates:sampleContext")}</h4>
					<div className="text-sm text-vscode-descriptionForeground bg-vscode-editor-background p-3 rounded font-mono">
						{JSON.stringify(previewContext, null, 2)}
					</div>
				</div>

				{/* Rendered output */}
				<div className="space-y-2">
					<h4 className="font-medium">{t("templates:renderedOutput")}</h4>
					<div className="p-3 border rounded-md bg-vscode-editor-background">
						<div dangerouslySetInnerHTML={{ __html: renderedOutput.replace(/\n/g, '<br>') }} />
					</div>
				</div>

				{/* Variable mapping */}
				<div className="space-y-2">
					<h4 className="font-medium">{t("templates:variableMapping")}</h4>
					<div className="grid grid-cols-2 gap-2 text-sm">
						{Object.entries(previewContext).map(([key, value]) => (
							<div key={key} className="flex justify-between">
								<span className="font-mono bg-vscode-editorSelectionBackground px-1 rounded">
									{{key}}}
								</span>
								<span className="text-vscode-descriptionForeground">
									{typeof value === 'object' ? JSON.stringify(value) : String(value)}
								</span>
							</div>
						))}
					</div>
				</div>
			</CardContent>
		</Card>
	)
})

TemplatePreview.displayName = "TemplatePreview"
export default TemplatePreview
```

### Task 2.11: Template Settings Panel

**File**: `webview-ui/src/components/RetryTemplateSettings.tsx` (new file)
**Implementation Context**:

- Follow existing settings panel patterns from [`ApiConfigManager`](webview-ui/src/components/settings/ApiConfigManager.tsx:29)
- Use existing settings synchronization patterns
- Support template selection and editing with import/export

**Enhanced Implementation**:

```typescript
import React, { memo, useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useExtensionState } from "@/context/ExtensionStateContext"

// Follow existing settings panel patterns from ApiConfigManager.tsx
const RetryTemplateSettings = memo(() => {
	const { t } = useTranslation()
	const { retryVisibility, updateSettings } = useExtensionState()
	const [activeTab, setActiveTab] = useState("general")
	const [isEditing, setIsEditing] = useState(false)
	const [editingTemplate, setEditingTemplate] = useState<RetryTemplate>()

	const handleSettingChange = (key: keyof RetryVisibilitySettings, value: any) => {
		updateSettings({
			retryVisibility: {
				...retryVisibility,
				[key]: value
			}
		})
	}

	const exportTemplates = () => {
		// Use existing vscode.postMessage pattern
		window.vscode?.postMessage({
			type: "exportTemplates",
			templates: retryVisibility.customTemplates
		})
	}

	const importTemplates = () => {
		// Use existing file selection pattern
		window.vscode?.postMessage({
			type: "importTemplates"
		})
	}

	return (
		<div className="space-y-6">
			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<TabsList className="grid w-full grid-cols-3">
					<TabsTrigger value="general">{t("templates:generalSettings")}</TabsTrigger>
					<TabsTrigger value="templates">{t("templates:templateManagement")}</TabsTrigger>
					<TabsTrigger value="advanced">{t("templates:advancedSettings")}</TabsTrigger>
				</TabsList>

				{/* General Settings */}
				<TabsContent value="general" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>{t("templates:displaySettings")}</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							{/* Follow existing switch patterns from settings */}
							<div className="flex items-center justify-between">
								<Label htmlFor="enableRetryChatOutput">
									{t("templates:enableRetryOutput")}
								</Label>
								<Switch
									id="enableRetryChatOutput"
									checked={retryVisibility.enableRetryChatOutput}
									onCheckedChange={(checked) => handleSettingChange("enableRetryChatOutput", checked)}
								/>
							</div>

							<div className="flex items-center justify-between">
								<Label htmlFor="enableDetailedProgress">
									{t("templates:enableDetailedProgress")}
								</Label>
								<Switch
									id="enableDetailedProgress"
									checked={retryVisibility.enableDetailedProgress}
									onCheckedChange={(checked) => handleSettingChange("enableDetailedProgress", checked)}
								/>
							</div>

							<div className="flex items-center justify-between">
								<Label htmlFor="consolidateMessages">
									{t("templates:consolidateMessages")}
								</Label>
								<Switch
									id="consolidateMessages"
									checked={retryVisibility.consolidateMessages}
									onCheckedChange={(checked) => handleSettingChange("consolidateMessages", checked)}
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="maxProgressMessages">
									{t("templates:maxProgressMessages")}
								</Label>
								<Input
									id="maxProgressMessages"
									type="number"
									min="1"
									max="10"
									value={retryVisibility.maxProgressMessages}
									onChange={(e) => handleSettingChange("maxProgressMessages", parseInt(e.target.value))}
									className="w-20"
								/>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Template Management */}
				<TabsContent value="templates" className="space-y-4">
					<div className="flex justify-between items-center">
						<h3 className="text-lg font-medium">{t("templates:customTemplates")}</h3>
						<div className="flex gap-2">
							<Button variant="outline" onClick={importTemplates}>
								{t("templates:import")}
							</Button>
							<Button variant="outline" onClick={exportTemplates}>
								{t("templates:export")}
							</Button>
							<Button onClick={() => setIsEditing(true)}>
								{t("templates:createNew")}
							</Button>
						</div>
					</div>

					{/* Template list */}
					<div className="space-y-2">
						{Object.entries(retryVisibility.customTemplates || {}).map(([id, template]) => (
							<Card key={id}>
								<CardContent className="flex justify-between items-center">
									<div>
										<h4 className="font-medium">{template.name}</h4>
										<p className="text-sm text-vscode-descriptionForeground">
											{template.description}
										</p>
									</div>
									<div className="flex gap-2">
										<Button variant="outline" size="sm">
											{t("templates:edit")}
										</Button>
										<Button variant="outline" size="sm">
											{t("templates:delete")}
										</Button>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</TabsContent>

				{/* Advanced Settings */}
				<TabsContent value="advanced" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>{t("templates:advancedSettings")}</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex items-center justify-between">
								<Label htmlFor="enablePreview">
									{t("templates:enablePreview")}
								</Label>
								<Switch
									id="enablePreview"
									checked={retryVisibility.enablePreview}
									onCheckedChange={(checked) => handleSettingChange("enablePreview", checked)}
								/>
							</div>

							<div className="flex items-center justify-between">
								<Label htmlFor="autoSave">
									{t("templates:autoSave")}
								</Label>
								<Switch
									id="autoSave"
									checked={retryVisibility.autoSave}
									onCheckedChange={(checked) => handleSettingChange("autoSave", checked)}
								/>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	)
})

RetryTemplateSettings.displayName = "RetryTemplateSettings"
export default RetryTemplateSettings
```

### Task 2.12: Variable Helper Component

**File**: `webview-ui/src/components/TemplateVariableHelper.tsx` (new file)
**Implementation Context**:

- Follow existing helper component patterns from webview-ui
- Use existing tooltip and documentation patterns
- Support variable insertion in template editor

**Enhanced Implementation**:

```typescript
import React, { memo } from "react"
import { useTranslation } from "react-i18next"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Info } from "lucide-react"
import { TEMPLATE_VARIABLES } from "@roo/types"

// Follow existing helper component patterns
const TemplateVariableHelper = memo(({ onInsertVariable }: {
	onInsertVariable: (variable: string) => void
}) => {
	const { t } = useTranslation()

	const handleVariableClick = (variableName: string) => {
		// Insert {{variable}} syntax
		onInsertVariable(`{{${variableName}}}`)
	}

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button variant="outline" size="sm">
					<Info className="w-4 h-4 mr-2" />
					{t("templates:variableHelper")}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-96 max-h-96 overflow-y-auto">
				<div className="space-y-4">
					<div className="text-sm font-medium">
						{t("templates:variableDescription")}
					</div>

					{/* Variable list */}
					<div className="space-y-2">
						{Object.entries(TEMPLATE_VARIABLES).map(([key, variable]) => (
							<div
								key={key}
								className="flex items-start justify-between p-2 border rounded hover:bg-vscode-editor-selectionBackground cursor-pointer"
								onClick={() => handleVariableClick(key)}
							>
								<div className="flex-1">
									<div className="flex items-center gap-2">
										<Badge variant="secondary" className="font-mono text-xs">
											{{key}}}
										</Badge>
										<span className="font-medium">{variable.name}</span>
									</div>
									<p className="text-sm text-vscode-descriptionForeground mt-1">
										{variable.description}
									</p>
								</div>
								<div className="text-right">
									<div className="text-xs text-vscode-descriptionForeground mb-1">
										{t("templates:type")}: {variable.type}
									</div>
									<div className="text-xs text-vscode-descriptionForeground">
										{t("templates:required")}: {variable.required ? t("common:yes") : t("common:no")}
									</div>
									{variable.example && (
										<div className="text-xs font-mono bg-vscode-editor-background p-1 rounded mt-1">
											{variable.example}
										</div>
									)}
								</div>
							</div>
						))}
					</div>

					{/* Usage instructions */}
					<div className="border-t pt-4">
						<h4 className="font-medium mb-2">{t("templates:usageInstructions")}</h4>
						<div className="text-sm text-vscode-descriptionForeground space-y-1">
							<p>• {t("templates:usageSyntax", { syntax: "{{variableName}}" })}</p>
							<p>• {t("templates:usageClickToInsert")}</p>
							<p>• {t("templates:usageRequiredNote")}</p>
						</div>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	)
})

TemplateVariableHelper.displayName = "TemplateVariableHelper"
export default TemplateVariableHelper
```

## Phase 4: Integration with Chat System

### Task 2.13: Chat Message Template Integration

**File**: `src/core/tools/retry/RetryChatEmitter.ts`
**Lines**: Modify to use template engine (around line 40)
**Implementation Context**:

- Integrate RetryTemplateEngine with chat message generation
- Use templates instead of hardcoded messages
- Maintain existing event emission patterns

**Enhanced Implementation**:

```typescript
// Modify RetryChatEmitter to integrate with template engine
export class RetryChatEmitter extends EventEmitter {
	constructor(
		private webviewProvider: any,
		private templateEngine: RetryTemplateEngine,
		private settings: RetryVisibilitySettings,
	) {
		super()
	}

	emitRetryStart(context: RetryContext): void {
		const templateType: RetryMessageType = "retry_start"
		const templateContext = this.createTemplateContext(context)

		// Use template engine instead of hardcoded messages
		const message = this.templateEngine.renderTemplate(templateType, templateContext)

		const retryMessage: RetryChatMessage = {
			id: `retry_start_${context.retryId}_${Date.now()}`,
			type: templateType,
			timestamp: Date.now(),
			retryId: context.retryId,
			toolName: context.originalToolCall.name,
			attempt: context.attemptNumber,
			maxAttempts: context.maxRetries,
			message,
			error: context.failureReason?.message,
			errorClassification: context.failureReason ? this.classifyError(context.failureReason) : undefined,
		}

		this.sendToWebview(retryMessage)
		this.emit("retryStart", retryMessage)
	}

	emitRetryProgress(context: RetryContext): void {
		const templateType: RetryMessageType = "retry_progress"
		const templateContext = this.createTemplateContext(context)

		// Use detailed template if enabled
		const useDetailed = this.settings.enableDetailedProgress
		const templateId = this.templateEngine.getActiveTemplateId(templateType)
		const isDetailedTemplate = templateId?.includes("detailed")

		const message = this.templateEngine.renderTemplate(templateType, templateContext)

		const retryMessage: RetryChatMessage = {
			id: `retry_progress_${context.retryId}_${Date.now()}`,
			type: templateType,
			timestamp: Date.now(),
			retryId: context.retryId,
			toolName: context.originalToolCall.name,
			attempt: context.attemptNumber,
			maxAttempts: context.maxRetries,
			message,
			nextRetryTime: context.nextRetryTime,
		}

		this.sendToWebview(retryMessage)
		this.emit("retryProgress", retryMessage)
	}

	private createTemplateContext(context: RetryContext): RetryTemplateContext {
		return {
			retryId: context.retryId,
			toolName: context.originalToolCall.name,
			attempt: context.attemptNumber,
			maxAttempts: context.maxRetries,
			error: context.failureReason?.message,
			errorClassification: context.failureReason ? this.classifyError(context.failureReason) : undefined,
			duration: Date.now() - context.startTime,
			nextRetryTime: context.nextRetryTime,
			startTime: context.startTime,
			originalToolCall: context.originalToolCall,
		}
	}
}
```

### Task 2.14: Settings Synchronization

**File**: `src/core/webview/ClineProvider.ts`
**Lines**: Add settings sync for templates (around line 300)
**Implementation Context**:

- Use existing settings synchronization patterns from [`ClineProvider`](src/core/webview/ClineProvider.ts:300)
- Handle template updates in real-time
- Ensure settings persistence across sessions

**Enhanced Implementation**:

```typescript
// Add to ClineProvider class
private async syncRetryVisibilitySettings(): Promise<void> {
	// Use existing settings sync patterns
	const settings = await this.getGlobalSettings()
	const retryVisibility = settings.retryVisibility || DEFAULT_RETRY_VISIBILITY_SETTINGS

	// Sync to webview
	this.postMessageToWebview({
		type: "retryVisibilitySettings",
		settings: retryVisibility
	})
}

// Add to existing message handler
private async handleMessage(message: any): Promise<void> {
	switch (message.type) {
		// ... existing cases

		case "updateRetryVisibilitySettings":
			// Use existing settings update patterns
			const currentSettings = await this.getGlobalSettings()
			const updatedSettings = {
				...currentSettings,
				retryVisibility: {
					...currentSettings.retryVisibility,
					...message.settings
				}
			}

			await this.updateGlobalSettings(updatedSettings)
			await this.syncRetryVisibilitySettings()
			break

		case "saveCustomTemplate":
			// Handle custom template saving
			const { template } = message
			const templateEngine = this.getRetryTemplateEngine() // Get or create instance
			templateEngine.registerCustomTemplate(template.template, template.category, template.metadata)

			// Sync updated settings
			await this.syncRetryVisibilitySettings()
			break

		case "deleteCustomTemplate":
			// Handle custom template deletion
			const { templateId } = message
			const templateEngine = this.getRetryTemplateEngine()
			templateEngine.deleteTemplate(templateId)

			// Sync updated settings
			await this.syncRetryVisibilitySettings()
			break
	}
}

// Add to initialization
private async initializeRetryTemplateEngine(): Promise<void> {
	// Initialize template engine with current settings
	const settings = await this.getGlobalSettings()
	const retryVisibility = settings.retryVisibility || DEFAULT_RETRY_VISIBILITY_SETTINGS

	this.retryTemplateEngine = new RetryTemplateEngine(retryVisibility)

	// Sync settings to webview
	await this.syncRetryVisibilitySettings()
}
```

### Task 2.15: Template Performance Optimization

**File**: `src/core/tools/retry/RetryTemplateEngine.ts`
**Lines**: Add caching and optimization (around line 150)
**Implementation Context**:

- Implement template compilation and caching for <100ms requirement
- Optimize variable resolution performance
- Use existing performance optimization patterns

**Enhanced Implementation**:

```typescript
// Add to RetryTemplateEngine class
private templateCache = new Map<string, CompiledTemplate>()
private variableCache = new Map<string, any>()
private performanceMetrics = {
	renderCount: 0,
	totalRenderTime: 0,
	cacheHits: 0,
	cacheMisses: 0
}

interface CompiledTemplate {
	render: (context: RetryTemplateContext) => string
	variableNames: string[]
	compiledAt: number
	lastUsed: number
}

renderTemplate(type: RetryMessageType, context: RetryTemplateContext): string {
	const startTime = performance.now()
	this.performanceMetrics.renderCount++

	const template = this.getTemplate(type)
	if (!template) {
		return this.getDefaultMessage(type, context)
	}

	// Check cache first
	const cacheKey = `${template.id}_${this.getContextHash(context)}`
	const cached = this.templateCache.get(cacheKey)

	if (cached && (Date.now() - cached.compiledAt) < 300000) { // 5 minutes cache
		this.performanceMetrics.cacheHits++
		cached.lastUsed = Date.now()

		const renderTime = performance.now() - startTime
		this.performanceMetrics.totalRenderTime += renderTime

		return cached.render(context)
	}

	this.performanceMetrics.cacheMisses++

	// Compile and cache template
	const compiled = this.compileTemplate(template.template)
	const compiledTemplate: CompiledTemplate = {
		render: compiled,
		variableNames: this.extractVariables(template.template),
		compiledAt: Date.now(),
		lastUsed: Date.now()
	}

	this.templateCache.set(cacheKey, compiledTemplate)

	// Clean old cache entries periodically
	if (this.performanceMetrics.renderCount % 100 === 0) {
		this.cleanCache()
	}

	const result = compiled.render(context)
	const renderTime = performance.now() - startTime
	this.performanceMetrics.totalRenderTime += renderTime

	// Ensure <100ms requirement
	if (renderTime > 100) {
		console.warn(`Template render took ${renderTime}ms for type ${type}`)
	}

	return result
}

private compileTemplate(template: string): (context: RetryTemplateContext) => string {
	// Pre-compile template for optimal performance
	const variableRegex = /\{\{(\w+)\}\}/g
	const variables = []
	let match

	while ((match = variableRegex.exec(template)) !== null) {
		variables.push(match[1])
	}

	// Reset regex for compilation
	variableRegex.lastIndex = 0

	// Create optimized render function
	return (context: RetryTemplateContext) => {
		let result = template

		// Use direct property access for performance
		for (const variable of variables) {
			const value = context[variable as keyof RetryTemplateContext]
			if (value !== undefined && value !== null) {
				result = result.replace(new RegExp(`\\{\\{${variable}\\}\\}`, 'g'), String(value))
			}
		}

		return result
	}
}

private cleanCache(): void {
	const now = Date.now()
	const maxAge = 600000 // 10 minutes

	for (const [key, template] of this.templateCache.entries()) {
		if (now - template.lastUsed > maxAge) {
			this.templateCache.delete(key)
		}
	}

	// Limit cache size
	if (this.templateCache.size > 100) {
		const entries = Array.from(this.templateCache.entries())
		entries.sort((a, b) => a[1].lastUsed - b[1].lastUsed)

		// Remove oldest 50%
		const toRemove = entries.slice(0, 50)
		toRemove.forEach(([key]) => this.templateCache.delete(key))
	}
}

getPerformanceMetrics() {
	const avgRenderTime = this.performanceMetrics.renderCount > 0
		? this.performanceMetrics.totalRenderTime / this.performanceMetrics.renderCount
		: 0

	const cacheHitRate = this.performanceMetrics.cacheHits + this.performanceMetrics.cacheMisses > 0
		? (this.performanceMetrics.cacheHits / (this.performanceMetrics.cacheHits + this.performanceMetrics.cacheMisses)) * 100
		: 0

	return {
		...this.performanceMetrics,
		averageRenderTime: avgRenderTime,
		cacheHitRate
	}
}
```

## Phase 5: Testing and Validation

### Task 2.16: Template Engine Unit Tests

**File**: `src/core/tools/retry/__tests__/RetryTemplateEngine.test.ts` (new file)
**Implementation Context**:

- Follow existing test patterns from retry module
- Test template rendering with variables
- Test performance and caching

**Enhanced Implementation**:

```typescript
import { describe, test, expect, beforeEach } from "vitest"
import { RetryTemplateEngine } from "../RetryTemplateEngine.js"
import { DEFAULT_RETRY_VISIBILITY_SETTINGS } from "../defaultTemplates.js"

describe("RetryTemplateEngine", () => {
	let templateEngine: RetryTemplateEngine

	beforeEach(() => {
		templateEngine = new RetryTemplateEngine(DEFAULT_RETRY_VISIBILITY_SETTINGS)
	})

	test("should render template with variables", () => {
		const template = "🔄 Retrying {{toolName}} (attempt {{attempt}}/{{maxAttempts}})"
		const context = {
			retryId: "test_123",
			toolName: "readFile",
			attempt: 2,
			maxAttempts: 3,
		}

		const result = templateEngine.renderTemplate("retry_start", context)

		expect(result).toBe("🔄 Retrying readFile (attempt 2/3)")
	})

	test("should handle missing variables gracefully", () => {
		const template = "✅ {{toolName}} succeeded"
		const context = {
			retryId: "test_123",
			toolName: "writeFile",
			attempt: 1,
			maxAttempts: 3,
		}

		const result = templateEngine.renderTemplate("retry_success", context)

		expect(result).toBe("✅ writeFile succeeded")
	})

	test("should validate template syntax correctly", () => {
		const validTemplate = "🔄 {{toolName}} attempt {{attempt}}"
		const invalidTemplate = "🔄 {{toolName attempt {{attempt}}" // Missing closing brace

		const validResult = templateEngine.validateTemplate(validTemplate)
		const invalidResult = templateEngine.validateTemplate(invalidTemplate)

		expect(validResult.isValid).toBe(true)
		expect(invalidResult.isValid).toBe(false)
		expect(invalidResult.errors).toContain("Malformed variable syntax")
	})

	test("should cache compiled templates for performance", () => {
		const template = "⏳ {{toolName}} in progress..."
		const context = {
			retryId: "cache_test",
			toolName: "executeCommand",
			attempt: 1,
			maxAttempts: 3,
		}

		// First render should compile and cache
		const start1 = performance.now()
		const result1 = templateEngine.renderTemplate("retry_progress", context)
		const time1 = performance.now() - start1

		// Second render should use cache
		const start2 = performance.now()
		const result2 = templateEngine.renderTemplate("retry_progress", context)
		const time2 = performance.now() - start2

		expect(result1).toBe(result2)
		expect(time2).toBeLessThan(time1) // Cache should be faster

		const metrics = templateEngine.getPerformanceMetrics()
		expect(metrics.cacheHits).toBeGreaterThan(0)
	})

	test("should meet <100ms performance requirement", () => {
		const context = {
			retryId: "perf_test",
			toolName: "testTool",
			attempt: 1,
			maxAttempts: 3,
		}

		const iterations = 1000
		const times: number[] = []

		for (let i = 0; i < iterations; i++) {
			const start = performance.now()
			templateEngine.renderTemplate("retry_start", context)
			times.push(performance.now() - start)
		}

		const averageTime = times.reduce((a, b) => a + b, 0) / times.length
		const maxTime = Math.max(...times)

		expect(averageTime).toBeLessThan(50) // Well under 100ms
		expect(maxTime).toBeLessThan(100) // Never exceed 100ms
	})
})
```

## Enhanced Acceptance Criteria

- [ ] Template engine supports {{variable}} syntax following existing patterns from [`support-prompt.ts`](src/shared/support-prompt.ts:11)
- [ ] All default templates render correctly using existing template patterns
- [ ] Custom templates can be created and saved using existing settings patterns from [`global-settings.ts`](packages/types/src/global-settings.ts:316)
- [ ] Template validation prevents invalid syntax using existing validation patterns from [`RetryFactory`](src/core/tools/retry/RetryFactory.ts:72)
- [ ] Settings integration works seamlessly following existing settings synchronization patterns from [`ClineProvider`](src/core/webview/ClineProvider.ts:300)
- [ ] UI components follow existing Material Design patterns from [`ApiConfigManager`](webview-ui/src/components/settings/ApiConfigManager.tsx:184)
- [ ] Template preview updates in real-time using existing React patterns
- [ ] Performance meets <100ms rendering requirement using existing optimization patterns
- [ ] All tests pass with >90% coverage following existing test patterns from [`App.spec.tsx`](webview-ui/src/__tests__/App.spec.tsx:180)
- [ ] Template variables resolve correctly from retry context using existing variable resolution patterns
- [ ] Error handling works for malformed templates following existing error handling patterns
- [ ] Template caching and optimization meet performance requirements
- [ ] Settings persistence and migration work with existing patterns
- [ ] Template import/export functionality integrates with existing file handling patterns
