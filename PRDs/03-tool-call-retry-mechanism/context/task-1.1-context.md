# Context for Task 1.1: Create Retry Settings Schema: Add retry configuration schema to existing settings system with proper TypeScript interfaces.

- **Status**: To Do
- **Source PRD**: PRDs/03-tool-call-retry-mechanism/
- **Target Files**:
    - `packages/types/src/global-settings.ts`
- **Generated**: 2025-11-09T20:54:00.000Z
- **Last Updated**: 2025-11-09T20:54:00.000Z

---

## 1. Current Code Analysis (Internal)

_Findings from `ast-grep-mcp` and `semantic_search`._

### File: `packages/types/src/global-settings.ts`

**Current Implementation:**

```typescript
export const globalSettingsSchema = z.object({
	currentApiConfigName: z.string().optional(),
	listApiConfigMeta: z.array(providerSettingsEntrySchema).optional(),
	pinnedApiConfigs: z.record(z.string(), z.boolean()).optional(),

	lastShownAnnouncementId: z.string().optional(),
	customInstructions: z.string().optional(),
	taskHistory: z.array(historyItemSchema).optional(),
	dismissedUpsells: z.array(z.string()).optional(),

	// Image generation settings (experimental) - flattened for simplicity
	openRouterImageApiKey: z.string().optional(),
	openRouterImageGenerationSelectedModel: z.string().optional(),

	condensingApiConfigId: z.string().optional(),
	customCondensingPrompt: z.string().optional(),

	autoApprovalEnabled: z.boolean().optional(),
	alwaysAllowReadOnly: z.boolean().optional(),
	alwaysAllowReadOnlyOutsideWorkspace: z.boolean().optional(),
	alwaysAllowWrite: z.boolean().optional(),
	alwaysAllowWriteOutsideWorkspace: z.boolean().optional(),
	alwaysAllowWriteProtected: z.boolean().optional(),
	writeDelayMs: z.number().min(0).optional(),
	alwaysAllowBrowser: z.boolean().optional(),
	alwaysApproveResubmit: z.boolean().optional(),
	requestDelaySeconds: z.number().optional(),
	alwaysAllowMcp: z.boolean().optional(),
	alwaysAllowModeSwitch: z.boolean().optional(),
	alwaysAllowSubtasks: z.boolean().optional(),
	alwaysAllowExecute: z.boolean().optional(),
	alwaysAllowFollowupQuestions: z.boolean().optional(),
	followupAutoApproveTimeoutMs: z.number().optional(),
	alwaysAllowUpdateTodoList: z.boolean().optional(),
	allowedCommands: z.array(z.string()).optional(),
	deniedCommands: z.array(z.string()).optional(),
	commandExecutionTimeout: z.number().optional(),
	commandTimeoutAllowlist: z.array(z.string()).optional(),
	preventCompletionWithOpenTodos: z.boolean().optional(),
	allowedMaxRequests: z.number().nullish(),
	allowedMaxCost: z.number().nullish(),
	autoCondenseContext: z.boolean().optional(),
	autoCondenseContextPercent: z.number().optional(),
	maxConcurrentFileReads: z.number().optional(),
	enableManualReview: z.boolean().optional(),

	/**
	 * Whether to include current time in the environment details
	 * @default true
	 */
	includeCurrentTime: z.boolean().optional(),
	/**
	 * Whether to include current cost in the environment details
	 * @default true
	 */
	includeCurrentCost: z.boolean().optional(),

	/**
	 * Whether to include diagnostic messages (errors, warnings) in tool outputs
	 * @default true
	 */
	includeDiagnosticMessages: z.boolean().optional(),
	/**
	 * Maximum number of diagnostic messages to include in tool outputs
	 * @default 50
	 */
	maxDiagnosticMessages: z.number().optional(),

	browserToolEnabled: z.boolean().optional(),
	browserViewportSize: z.string().optional(),
	screenshotQuality: z.number().optional(),
	remoteBrowserEnabled: z.boolean().optional(),
	remoteBrowserHost: z.string().optional(),
	cachedChromeHostUrl: z.string().optional(),

	enableCheckpoints: z.boolean().optional(),
	checkpointTimeout: z
		.number()
		.int()
		.min(MIN_CHECKPOINT_TIMEOUT_SECONDS)
		.max(MAX_CHECKPOINT_TIMEOUT_SECONDS)
		.optional(),

	ttsEnabled: z.boolean().optional(),
	ttsSpeed: z.number().optional(),
	soundEnabled: z.boolean().optional(),
	soundVolume: z.number().optional(),

	maxOpenTabsContext: z.number().optional(),
	maxWorkspaceFiles: z.number().optional(),
	showRooIgnoredFiles: z.boolean().optional(),
	maxReadFileLine: z.number().optional(),
	maxImageFileSize: z.number().optional(),
	maxTotalImageSize: z.number().optional(),

	terminalOutputLineLimit: z.number().optional(),
	terminalOutputCharacterLimit: z.number().optional(),
	terminalShellIntegrationTimeout: z.number().optional(),
	terminalShellIntegrationDisabled: z.boolean().optional(),
	terminalCommandDelay: z.number().optional(),
	terminalPowershellCounter: z.boolean().optional(),
	terminalZshClearEolMark: z.boolean().optional(),
	terminalZshOhMy: z.boolean().optional(),
	terminalZshP10k: z.boolean().optional(),
	terminalZdotdir: z.boolean().optional(),
	terminalCompressProgressBar: z.boolean().optional(),

	diagnosticsEnabled: z.boolean().optional(),

	rateLimitSeconds: z.number().optional(),
	diffEnabled: z.boolean().optional(),
	fuzzyMatchThreshold: z.number().optional(),
	experiments: experimentsSchema.optional(),

	codebaseIndexModels: codebaseIndexModelsSchema.optional(),
	codebaseIndexConfig: codebaseIndexConfigSchema.optional(),

	language: languagesSchema.optional(),

	telemetrySetting: telemetrySettingsSchema.optional(),

	mcpEnabled: z.boolean().optional(),
	enableMcpServerCreation: z.boolean().optional(),

	mode: z.string().optional(),
	modeApiConfigs: z.record(z.string(), z.string()).optional(),
	customModes: z.array(modeConfigSchema).optional(),
	customModePrompts: customModePromptsSchema.optional(),
	customSupportPrompts: customSupportPromptsSchema.optional(),
	enhancementApiConfigId: z.string().optional(),
	includeTaskHistoryInEnhance: z.boolean().optional(),
	historyPreviewCollapsed: z.boolean().optional(),
	reasoningBlockCollapsed: z.boolean().optional(),
	profileThresholds: z.record(z.string(), z.number()).optional(),
	hasOpenedModeSelector: z.boolean().optional(),
	lastModeExportPath: z.string().optional(),
	lastModeImportPath: z.string().optional(),
})
```

**Analysis Notes:**

- Current architecture pattern: Zod schema-based configuration with optional fields
- Existing dependencies: zod validation library, imported schemas from other modules
- Modification points: Add retry configuration fields to globalSettingsSchema object

### Related Internal Patterns

**Similar Implementations Found:**

```typescript
// From packages/types/src/cloud.ts - existing RetryConfig interface
export interface RetryConfig {
	maxInitialAttempts: number
	initialDelay: number
	maxDelay: number
	backoffMultiplier: number
}

// From packages/cloud/src/bridge/SocketTransport.ts - retry configuration usage
private readonly retryConfig: RetryConfig = {
	maxInitialAttempts: Infinity,
	initialDelay: 1_000,
	maxDelay: 15_000,
	backoffMultiplier: 2,
}
```

**Pattern Analysis:**

- Common patterns identified: Zod schema validation with optional fields, JSDoc comments for defaults
- Naming conventions: camelCase for properties, descriptive names with clear purpose
- Code organization: Grouped related settings together, clear separation of concerns

---

## 2. External Best Practices (GitHub)

_Findings from `github_mcp` for required packages, e.g., "XUnit", "ASP.NET Core Identity"._

### Best Practice Example 1: Retry Configuration Patterns

**Source**: https://github.com/djnovin/djnovin-fetch
**Stars**: 0 | **Language**: TypeScript

```typescript
// Example retry configuration with validation
interface RetryOptions {
	maxAttempts?: number
	delay?: number
	backoff?: "linear" | "exponential"
	retryCondition?: (error: Error) => boolean
}

const retrySchema = z.object({
	maxAttempts: z.number().min(1).max(10).default(3),
	delay: z.number().min(0).default(1000),
	backoff: z.enum(["linear", "exponential"]).default("exponential"),
	retryCondition: z.function().optional(),
})
```

**Key Takeaways:**

- Use Zod enum for constrained string values (backoff strategies)
- Provide sensible defaults for all retry parameters
- Include validation ranges for numeric values
- Support conditional retry logic through functions

### Best Practice Example 2: Settings Schema Organization

**Source**: Internal codebase patterns
**Stars**: N/A | **Language**: TypeScript

```typescript
// Grouped settings with clear documentation
/**
 * Retry configuration settings
 * @default { enabled: false, maxAttempts: 3, backoffStrategy: "exponential" }
 */
retrySettings: z.object({
  enabled: z.boolean().default(false),
  maxAttempts: z.number().min(1).max(10).default(3),
  initialDelay: z.number().min(100).max(10000).default(1000),
  maxDelay: z.number().min(1000).max(60000).default(30000),
  backoffStrategy: z.enum(['none', 'linear', 'exponential']).default('exponential'),
  jitterEnabled: z.boolean().default(true),
}).optional(),
```

**Key Takeaways:**

- Group related settings into nested objects
- Use JSDoc comments to document default behavior
- Apply reasonable min/max constraints for safety
- Support multiple backoff strategies for flexibility

---

## 3. Internal Knowledge Base (Memory)

_Findings from `mcp_memory` (Vector DB)._

### Cached Knowledge

- **Topic**: "Experimental_Settings_Framework"
- **Last Used**: 2025-11-09T20:51:48.000Z
- **Content**: Framework for managing experimental feature settings, Integration point for Tool Call Retry Mechanism configuration, Provides persistence for retry preferences across sessions, Supports enable/disable toggle and retry attempt configuration, Location: packages/types/src/global-settings.ts, Status: Existing framework - integration required

### Related Memories

- **Experimental_Settings_Framework**: Framework for managing experimental feature settings with persistence and toggle support, located in global settings system, ready for retry mechanism integration

**Note**: _If this section is populated with relevant information, Section 2 (External Best Practices) may be skipped to save costs and time._

---

## 4. Suggested Implementation Plan

_A step-by-step plan generated by agent for `code` agent._

### Prerequisites

1. [ ] Verify existing global settings schema structure
2. [ ] Ensure zod library is available (already imported)

### Implementation Steps

1. [ ] **Define Retry Settings Schema**

    - Add retry settings object schema to packages/types/src/global-settings.ts
    - Include: enabled, maxAttempts, initialDelay, maxDelay, backoffStrategy, jitterEnabled
    - Command: Follow existing zod patterns

2. [ ] **Modify Existing Code**

    - File: `packages/types/src/global-settings.ts`
    - Class: `globalSettingsSchema`
    - Action: Add retrySettings field to the z.object schema
    - Lines: Around line 188, before closing brace of globalSettingsSchema

3. [ ] **Create New Files** (if needed)

    - No new files needed - integration into existing schema

4. [ ] **Update Configuration**

    - File: `packages/types/src/global-settings.ts`
    - Add: Retry settings with proper validation and defaults
    - Location: Within EVALS_SETTINGS object (around line 281)

5. [ ] **Add Tests**

    - File: `packages/types/src/__tests__/global-settings.test.ts` (if exists)
    - Test cases: Retry settings validation, default values, type safety

6. [ ] **Update Documentation**

    - Update inline JSDoc comments for retry settings
    - Add descriptions for each retry configuration option

### Validation Steps

1. [ ] Run type checking: `tsc --noEmit`
2. [ ] Verify schema compilation: Check zod schema parsing
3. [ ] Test integration: Ensure retry settings are accessible in GlobalSettings type

---

## 5. Dependencies

_Other tasks or files this task depends on._

### Task Dependencies

- [ ] **Task `1.2`**: Implement Settings Validation

    - Reason: Retry settings schema must be in place before validation logic
    - Status: ☐ To Do

- [ ] **Task `1.3`**: Add Default Configuration
    - Reason: Default retry values need to be configured after schema is defined
    - Status: ☐ To Do

### File Dependencies

- [ ] **File `packages/types/src/global-settings.ts`**: Must be modified first

    - Reason: Core schema definition location for all settings

- [ ] **Configuration `EVALS_SETTINGS`**: Must be updated
    - Reason: Default retry configuration for testing environments

### External Dependencies

- [ ] **Package `zod`**: Must be available (already imported)
- [ ] **TypeScript compiler**: Must support new schema structure

---

## 6. Notes and Warnings

### Important Considerations

- Must maintain backward compatibility by making all retry settings optional
- Should follow existing naming conventions and schema patterns
- Need to provide sensible defaults for optimal out-of-the-box experience
- Must integrate with existing settings persistence mechanism

### Potential Issues

- **Issue**: Schema validation conflicts with existing settings
    - **Mitigation**: Use proper zod optional() chaining and default values

### Breaking Changes

- No breaking changes expected as all fields will be optional with sensible defaults

---

**Context Generated By**: context-engineer agent
**Review Status**: Pending Review
**Reviewer**: code agent
