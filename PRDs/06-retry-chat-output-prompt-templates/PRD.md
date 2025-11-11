# PRD: Retry Chat Output & Prompt Templates Enhancement

## 1. Title & Overview

- **Project:** Retry Chat Output & Prompt Templates Enhancement
- **Summary:** This feature enhances the existing tool call retry mechanism (PRD-03) by adding comprehensive retry visibility through chat output and customizable prompt templates in settings. Users will see clear retry progress, attempt numbers, error reasons, and success/failure status. Additionally, users can customize retry prompt templates with variables for retry context, attempt numbers, and error types, with preview functionality and reset-to-default options.
- **Dependencies:** This feature builds upon PRD-03 (Tool Call Retry Mechanism) and extends its functionality with user-facing improvements while maintaining compatibility with existing error classification and context optimization systems.

## 2. Goals & Success Metrics

### Business Objectives

- Improve transparency and user understanding of retry behavior
- Enhance user control over retry communication through customizable prompts
- Reduce user confusion during automatic retry attempts
- Increase user satisfaction with retry mechanism visibility
- Maintain backward compatibility with existing retry infrastructure

### Developer & System Success Metrics

- 95% of users report better understanding of retry behavior through chat output
- 80% of users engage with prompt template customization within first month
- Average time to understand retry status reduced by 60%
- Zero increase in retry mechanism latency or resource usage
- 90% user satisfaction score for retry transparency improvements

## 3. User Personas

- **Developer (Primary User):** A developer working on complex tasks who wants clear visibility into retry attempts without interrupting workflow. The developer needs to understand when retries are happening, why they're happening, and what the current status is, while maintaining focus on the primary task.

- **Power User:** An experienced user who wants to customize retry communication to match their workflow preferences. This user needs to modify prompt templates, preview changes before applying, and have fine-grained control over retry messaging.

- **System Administrator:** A user responsible for monitoring system health who needs comprehensive visibility into retry patterns and user experience. This user needs to understand retry frequency, success rates, and user feedback patterns.

## 4. Requirements Breakdown

| Phase                         | Sprint                           | User Story                                                                                                                                              | Acceptance Criteria                                                                                                                                                                                                                                                                                                                                                                            | Duration    |
| :---------------------------- | :------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------ | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| **Phase 1: Chat Output**      | **Sprint 1: Retry Visibility**   | As a Developer, I want to see retry attempts in chat so I can understand when the system is automatically recovering from failures.                     | 1. Clear indication when a tool call is being retried displayed in chat.<br>2. Retry attempt number shown (e.g., "Retry 1/3").<br>3. Error type/reason for retry clearly displayed.<br>4. Progress indicators during retry attempts.<br>5. Final success/failure status communicated.<br>6. Chat output doesn't interfere with primary task flow.                                              | **2 Weeks** |
|                               |                                  | As a Developer, I want retry status to be contextually appropriate so I can quickly understand the situation without reading extensive documentation.   | 1. Retry messages use clear, concise language.<br>2. Error types are translated to user-friendly descriptions.<br>3. Progress indicators show meaningful status (analyzing, retrying, waiting, etc.).<br>4. Color coding or visual indicators for different retry states.<br>5. Retry messages are appropriately timed to avoid spam.                                                          |             |
| **Phase 2: Prompt Templates** | **Sprint 2: Template System**    | As a Power User, I want customizable retry prompt templates so I can tailor retry communication to my preferences and workflow.                         | 1. Default retry prompt template provided in settings.<br>2. User-customizable retry message templates.<br>3. Template variables for retry context (attempt number, error type, tool name).<br>4. Template validation to prevent broken variables.<br>5. Template changes apply immediately to new retry attempts.<br>6. Integration with existing settings infrastructure.                    | **2 Weeks** |
|                               |                                  | As a Power User, I want preview functionality for template changes so I can see how retry messages will look before applying them.                      | 1. Live preview of template changes with sample data.<br>2. Preview shows different retry scenarios (first attempt, final attempt, success, failure).<br>3. Preview updates in real-time as user types.<br>4. Preview includes all available template variables.<br>5. Preview clearly indicates invalid or missing variables.                                                                 |             |
| **Phase 3: Integration**      | **Sprint 3: System Integration** | As a Developer, I want the enhanced retry system to integrate seamlessly with existing PRD-03 infrastructure so all retry functionality works together. | 1. Chat output integrates with existing retry engine.<br>2. Prompt templates work with all error classification types.<br>3. Context optimization and dual-history synchronization remain functional.<br>4. Existing retry settings continue to work unchanged.<br>5. No performance degradation to existing retry mechanisms.<br>6. Backward compatibility maintained for all retry features. | **2 Weeks** |
|                               |                                  | As a System Administrator, I want comprehensive monitoring of retry visibility features so I can understand user experience and system behavior.        | 1. Metrics on template customization rates.<br>2. User feedback collection on retry visibility.<br>3. Analytics on retry message effectiveness.<br>4. Integration with existing retry monitoring systems.<br>5. Reports on user engagement with retry features.<br>6. Dashboard for retry visibility metrics.                                                                                  |             |

## 5. Timeline & Sprints

- **Total Estimated Time:** 6 Weeks
- **Sprint 1:** Retry Chat Output (2 Weeks)
- **Sprint 2:** Prompt Template System (2 Weeks)
- **Sprint 3:** System Integration & Monitoring (2 Weeks)

## 6. Risks & Assumptions

### Assumptions

- PRD-03 retry mechanism is fully implemented and stable
- Existing chat output system can be extended for retry visibility
- Settings infrastructure supports template customization
- Users have sufficient permissions to modify retry settings
- Template variables can be reliably populated from retry context

### Risks

- Chat output may become too verbose during frequent retries
- Template customization may lead to confusing or broken retry messages
- Additional UI elements may impact chat performance
- Template variables may not cover all retry scenarios
- Users may find retry notifications disruptive to workflow

### Mitigations

- Implement intelligent message throttling and consolidation
- Provide strong template validation and preview functionality
- Optimize chat rendering for retry messages
- Design comprehensive variable system with fallbacks
- Allow user control over retry notification frequency and verbosity

## 7. Success Metrics

- **User Understanding:** 95% of users report better understanding of retry behavior
- **Template Adoption:** 80% of users customize prompt templates within first month
- **Reduced Confusion:** 60% reduction in user questions about retry behavior
- **Performance Impact:** Zero increase in retry mechanism latency
- **User Satisfaction:** 90% satisfaction score for retry transparency
- **Integration Success:** 100% compatibility with existing PRD-03 features

## 8. Technical Specifications

### 8.1 Retry Chat Output Architecture

#### 8.1.1 Message Types and Structure

```typescript
interface RetryChatMessage {
	id: string
	type: "retry_start" | "retry_progress" | "retry_success" | "retry_failure"
	timestamp: number
	attemptNumber: number
	maxAttempts: number
	toolName: string
	errorType?: string
	errorReason?: string
	progress?: {
		stage: "analyzing" | "preparing" | "executing" | "validating"
		percentage: number
		estimatedTimeRemaining?: number
	}
	template?: string
	variables?: Record<string, any>
}

interface RetryChatConfig {
	enabled: boolean
	verbosity: "minimal" | "standard" | "detailed"
	showProgress: boolean
	consolidateMessages: boolean
	maxMessagesPerRetry: number
	colorCoding: boolean
}
```

#### 8.1.2 Chat Integration Points

```typescript
class RetryChatOutputManager {
	private config: RetryChatConfig
	private templateEngine: RetryTemplateEngine
	private messageQueue: RetryChatMessage[]

	async outputRetryMessage(retryContext: RetryContext, messageType: RetryChatMessage["type"]): Promise<void> {
		// 1. Generate message using template engine
		const template = await this.templateEngine.getTemplate(messageType, retryContext)

		// 2. Apply template variables
		const renderedMessage = this.templateEngine.render(template, retryContext)

		// 3. Apply message consolidation logic
		if (this.config.consolidateMessages) {
			await this.consolidateWithPreviousMessages(renderedMessage)
		} else {
			await this.outputToChat(renderedMessage)
		}
	}

	async showRetryProgress(retryContext: RetryContext, progress: RetryProgress): Promise<void> {
		if (!this.config.showProgress) return

		const progressMessage = await this.templateEngine.renderProgressTemplate(progress, retryContext)
		await this.updateProgressMessage(progressMessage)
	}

	private async consolidateWithPreviousMessages(newMessage: string): Promise<void> {
		// Implement intelligent message consolidation
		const lastMessage = this.messageQueue[this.messageQueue.length - 1]
		if (this.shouldConsolidate(lastMessage, newMessage)) {
			const consolidated = this.consolidateMessages(lastMessage, newMessage)
			await this.updateLastMessage(consolidated)
		} else {
			await this.outputToChat(newMessage)
		}
	}
}
```

### 8.2 Prompt Template System

#### 8.2.1 Template Engine Architecture

```typescript
interface RetryPromptTemplate {
	id: string
	name: string
	description: string
	category: "retry_start" | "retry_progress" | "retry_success" | "retry_failure"
	template: string
	variables: TemplateVariable[]
	isDefault: boolean
	isCustom: boolean
	createdAt: number
	modifiedAt: number
}

interface TemplateVariable {
	name: string
	type: "string" | "number" | "boolean" | "date"
	description: string
	required: boolean
	defaultValue?: any
	validation?: VariableValidation
}

interface VariableValidation {
	pattern?: string // regex pattern
	minLength?: number
	maxLength?: number
	allowedValues?: any[]
}

class RetryTemplateEngine {
	private templates: Map<string, RetryPromptTemplate> = new Map()
	private defaultTemplates: RetryPromptTemplate[]

	constructor() {
		this.loadDefaultTemplates()
		this.loadUserTemplates()
	}

	async getTemplate(category: string, retryContext: RetryContext): Promise<RetryPromptTemplate> {
		// 1. Try user custom template first
		const customTemplate = this.findCustomTemplate(category)
		if (customTemplate) {
			return customTemplate
		}

		// 2. Fall back to default template
		const defaultTemplate = this.defaultTemplates.find((t) => t.category === category)
		if (!defaultTemplate) {
			throw new Error(`No template found for category: ${category}`)
		}

		return defaultTemplate
	}

	render(template: RetryPromptTemplate, context: RetryContext): string {
		let rendered = template.template

		// Replace all template variables
		for (const variable of template.variables) {
			const value = this.getVariableValue(variable.name, context)
			rendered = rendered.replace(
				new RegExp(`\\{\\{${variable.name}\\}\\}`, "g"),
				this.formatVariableValue(value, variable),
			)
		}

		return rendered
	}

	private getVariableValue(variableName: string, context: RetryContext): any {
		const variableMap: Record<string, any> = {
			attemptNumber: context.attemptNumber,
			maxAttempts: context.maxRetries,
			toolName: context.originalToolCall.name,
			errorType: context.failureReason?.type,
			errorReason: context.failureReason?.message,
			timestamp: new Date().toISOString(),
			elapsedTime: Date.now() - context.startTime,
			retryCount: context.attemptNumber,
			totalRetries: context.maxRetries,
			successRate: this.calculateSuccessRate(context),
			estimatedTimeRemaining: this.estimateTimeRemaining(context),
		}

		return variableMap[variableName] || `{{${variableName}}}`
	}

	validateTemplate(template: string): TemplateValidationResult {
		const variables = this.extractVariables(template)
		const errors: string[] = []

		for (const variable of variables) {
			if (!this.isValidVariable(variable)) {
				errors.push(`Unknown variable: ${variable}`)
			}
		}

		return {
			isValid: errors.length === 0,
			errors,
			variables,
		}
	}
}
```

#### 8.2.2 Default Template Definitions

```typescript
const DEFAULT_RETRY_TEMPLATES: RetryPromptTemplate[] = [
	{
		id: "retry_start_default",
		name: "Retry Start (Default)",
		description: "Default template for retry start messages",
		category: "retry_start",
		template:
			"🔄 Retrying {{toolName}} (Attempt {{attemptNumber}}/{{maxAttempts}})\n\nError: {{errorType}} - {{errorReason}}",
		variables: [
			{ name: "toolName", type: "string", description: "Name of the tool being retried", required: true },
			{ name: "attemptNumber", type: "number", description: "Current attempt number", required: true },
			{ name: "maxAttempts", type: "number", description: "Maximum number of attempts", required: true },
			{ name: "errorType", type: "string", description: "Type of error that triggered retry", required: false },
			{ name: "errorReason", type: "string", description: "Detailed error reason", required: false },
		],
		isDefault: true,
		isCustom: false,
		createdAt: Date.now(),
		modifiedAt: Date.now(),
	},
	{
		id: "retry_progress_default",
		name: "Retry Progress (Default)",
		description: "Default template for retry progress messages",
		category: "retry_progress",
		template: "⏳ {{toolName}} retry progress: {{progress.stage}} ({{progress.percentage}}%)",
		variables: [
			{ name: "toolName", type: "string", description: "Name of the tool being retried", required: true },
			{ name: "progress.stage", type: "string", description: "Current retry stage", required: true },
			{ name: "progress.percentage", type: "number", description: "Progress percentage", required: true },
		],
		isDefault: true,
		isCustom: false,
		createdAt: Date.now(),
		modifiedAt: Date.now(),
	},
	{
		id: "retry_success_default",
		name: "Retry Success (Default)",
		description: "Default template for retry success messages",
		category: "retry_success",
		template: "✅ {{toolName}} succeeded on attempt {{attemptNumber}}/{{maxAttempts}}",
		variables: [
			{ name: "toolName", type: "string", description: "Name of the tool that succeeded", required: true },
			{ name: "attemptNumber", type: "number", description: "Successful attempt number", required: true },
			{ name: "maxAttempts", type: "number", description: "Maximum number of attempts", required: true },
		],
		isDefault: true,
		isCustom: false,
		createdAt: Date.now(),
		modifiedAt: Date.now(),
	},
	{
		id: "retry_failure_default",
		name: "Retry Failure (Default)",
		description: "Default template for retry failure messages",
		category: "retry_failure",
		template:
			"❌ {{toolName}} failed after {{attemptNumber}} attempts\n\nFinal error: {{errorType}} - {{errorReason}}",
		variables: [
			{ name: "toolName", type: "string", description: "Name of the tool that failed", required: true },
			{ name: "attemptNumber", type: "number", description: "Total attempts made", required: true },
			{ name: "errorType", type: "string", description: "Final error type", required: true },
			{ name: "errorReason", type: "string", description: "Final error reason", required: true },
		],
		isDefault: true,
		isCustom: false,
		createdAt: Date.now(),
		modifiedAt: Date.now(),
	},
]
```

### 8.3 Settings Integration

#### 8.3.1 Settings Schema Extension

```typescript
interface RetryVisibilitySettings {
	chatOutput: {
		enabled: boolean
		verbosity: "minimal" | "standard" | "detailed"
		showProgress: boolean
		consolidateMessages: boolean
		maxMessagesPerRetry: number
		colorCoding: boolean
	}
	promptTemplates: {
		customTemplates: RetryPromptTemplate[]
		activeTemplateIds: Record<string, string> // category -> templateId
		enablePreview: boolean
		autoSave: boolean
	}
	advanced: {
		debugMode: boolean
		performanceMonitoring: boolean
		exportTemplates: boolean
		importTemplates: boolean
	}
}

// Extension to existing global settings schema
const retryVisibilitySettingsSchema = z.object({
	chatOutput: z.object({
		enabled: z.boolean().default(true),
		verbosity: z.enum(["minimal", "standard", "detailed"]).default("standard"),
		showProgress: z.boolean().default(true),
		consolidateMessages: z.boolean().default(true),
		maxMessagesPerRetry: z.number().min(1).max(10).default(3),
		colorCoding: z.boolean().default(true),
	}),
	promptTemplates: z.object({
		customTemplates: z.array(retryPromptTemplateSchema).default([]),
		activeTemplateIds: z.record(z.string()).default({}),
		enablePreview: z.boolean().default(true),
		autoSave: z.boolean().default(true),
	}),
	advanced: z.object({
		debugMode: z.boolean().default(false),
		performanceMonitoring: z.boolean().default(true),
		exportTemplates: z.boolean().default(true),
		importTemplates: z.boolean().default(true),
	}),
})
```

#### 8.3.2 Settings UI Components

```typescript
interface RetryVisibilitySettingsProps {
  settings: RetryVisibilitySettings
  onSettingsChange: (settings: Partial<RetryVisibilitySettings>) => void
  onResetToDefaults: () => void
}

const RetryVisibilitySettings: React.FC<RetryVisibilitySettingsProps> = ({
  settings,
  onSettingsChange,
  onResetToDefaults,
}) => {
  return (
    <div className="retry-visibility-settings">
      <Section title="Chat Output">
        <Toggle
          label="Enable Retry Chat Output"
          checked={settings.chatOutput.enabled}
          onChange={(enabled) => onSettingsChange({
            chatOutput: { ...settings.chatOutput, enabled }
          })}
        />

        <Select
          label="Verbosity Level"
          value={settings.chatOutput.verbosity}
          options={[
            { value: 'minimal', label: 'Minimal - Only show start/end' },
            { value: 'standard', label: 'Standard - Show key milestones' },
            { value: 'detailed', label: 'Detailed - Show all progress' },
          ]}
          onChange={(verbosity) => onSettingsChange({
            chatOutput: { ...settings.chatOutput, verbosity }
          })}
        />

        <Toggle
          label="Show Progress Indicators"
          checked={settings.chatOutput.showProgress}
          onChange={(showProgress) => onSettingsChange({
            chatOutput: { ...settings.chatOutput, showProgress }
          })}
        />

        <Toggle
          label="Consolidate Messages"
          checked={settings.chatOutput.consolidateMessages}
          onChange={(consolidateMessages) => onSettingsChange({
            chatOutput: { ...settings.chatOutput, consolidateMessages }
          })}
        />
      </Section>

      <Section title="Prompt Templates">
        <TemplateEditor
          templates={settings.promptTemplates.customTemplates}
          onTemplatesChange={(customTemplates) => onSettingsChange({
            promptTemplates: { ...settings.promptTemplates, customTemplates }
          })}
        />

        <TemplatePreview
          enabled={settings.promptTemplates.enablePreview}
          onEnabledChange={(enablePreview) => onSettingsChange({
            promptTemplates: { ...settings.promptTemplates, enablePreview }
          })}
        />
      </Section>

      <Section title="Advanced">
        <Toggle
          label="Debug Mode"
          checked={settings.advanced.debugMode}
          onChange={(debugMode) => onSettingsChange({
            advanced: { ...settings.advanced, debugMode }
          })}
        />

        <Button onClick={onResetToDefaults}>
          Reset to Defaults
        </Button>
      </Section>
    </div>
  )
}
```

### 8.4 Integration with PRD-03

#### 8.4.1 Retry Engine Enhancement

```typescript
class EnhancedRetryEngine extends RetryEngine {
	private chatOutputManager: RetryChatOutputManager
	private templateEngine: RetryTemplateEngine

	constructor(dependencies: RetryEngineDependencies) {
		super(dependencies)
		this.chatOutputManager = new RetryChatOutputManager()
		this.templateEngine = new RetryTemplateEngine()
	}

	async executeWithRetry<T>(toolCall: ToolCall, context: RetryContext): Promise<T> {
		// 1. Output retry start message
		await this.chatOutputManager.outputRetryMessage(context, "retry_start")

		try {
			// 2. Execute original retry logic
			const result = await super.executeWithRetry(toolCall, context)

			// 3. Output success message
			await this.chatOutputManager.outputRetryMessage(
				{ ...context, attemptNumber: context.attemptNumber },
				"retry_success",
			)

			return result
		} catch (error) {
			// 4. Output failure message
			await this.chatOutputManager.outputRetryMessage(
				{ ...context, attemptNumber: context.attemptNumber },
				"retry_failure",
			)

			throw error
		}
	}

	protected async executeRetryAttempt<T>(
		toolCall: ToolCall,
		context: RetryContext,
		attemptNumber: number,
	): Promise<T> {
		// 1. Show progress for attempt preparation
		await this.chatOutputManager.showRetryProgress(context, {
			stage: "preparing",
			percentage: 10,
		})

		// 2. Execute attempt with progress updates
		const result = await this.executeWithProgress(toolCall, context, attemptNumber)

		return result
	}

	private async executeWithProgress<T>(toolCall: ToolCall, context: RetryContext, attemptNumber: number): Promise<T> {
		// Show progress at different stages
		await this.chatOutputManager.showRetryProgress(context, {
			stage: "analyzing",
			percentage: 25,
		})

		// ... existing retry logic ...

		await this.chatOutputManager.showRetryProgress(context, {
			stage: "executing",
			percentage: 75,
		})

		// ... continue execution ...

		await this.chatOutputManager.showRetryProgress(context, {
			stage: "validating",
			percentage: 90,
		})

		// ... final validation ...
	}
}
```

## 9. Dependencies

### Technical Dependencies

- **PRD-03 Tool Call Retry Mechanism**: Core retry engine and context management
- Existing retry infrastructure (`src/core/tools/retry/`)
- Chat output system (`src/core/webview/`)
- Settings framework (`packages/types/src/global-settings.ts`)
- Template engine infrastructure
- Error classification system from PRD-03
- Context optimization system from PRD-03
- Dual-history synchronization from PRD-03

### Integration Points

- Retry engine for chat output integration
- Settings panel for template customization
- Chat UI for retry message display
- Template engine for message rendering
- Monitoring system for usage analytics
- Existing error handling and classification systems

## 10. Architecture Recommendations

### 10.1 Modular Design

- Separate chat output management from retry logic
- Template engine as independent, reusable component
- Settings integration following existing patterns
- Backward compatibility with PRD-03 features

### 10.2 Performance Considerations

- Minimal impact on existing retry performance
- Efficient template rendering and caching
- Intelligent message consolidation to prevent chat spam
- Lazy loading of template resources

### 10.3 User Experience Design

- Clear, non-intrusive retry notifications
- Intuitive template customization interface
- Real-time preview functionality
- Comprehensive variable documentation

## 11. Implementation Roadmap

### Phase 1: Chat Output (Weeks 1-2)

1. Implement RetryChatOutputManager
2. Create retry message types and structures
3. Integrate with existing retry engine
4. Add chat output integration
5. Implement message consolidation logic

### Phase 2: Template System (Weeks 3-4)

1. Build RetryTemplateEngine
2. Create default template definitions
3. Implement template validation and rendering
4. Add settings UI for template customization
5. Create preview functionality

### Phase 3: Integration (Weeks 5-6)

1. Enhance retry engine with chat output
2. Integrate template system with retry logic
3. Add settings schema extensions
4. Implement monitoring and analytics
5. Complete testing and validation

## 12. Success Metrics and KPIs

### Technical Metrics

- Chat output latency: < 100ms per message
- Template rendering time: < 50ms per template
- Settings load/save time: < 200ms
- Memory overhead: < 2MB additional usage

### User Experience Metrics

- User understanding score: > 90%
- Template customization rate: > 80%
- User satisfaction: > 90%
- Support ticket reduction: > 30%

### Integration Metrics

- 100% compatibility with PRD-03 features
- Zero regression in existing retry functionality
- Complete settings integration
- Successful monitoring deployment

## 13. Implementation Context

### 13.1 Codebase Architecture Analysis

This PRD builds upon comprehensive analysis of the existing codebase architecture. Key integration points and patterns have been identified to ensure seamless implementation.

#### 13.1.1 Chat System Integration

**Primary Integration Points:**

- [`src/core/webview/webviewMessageHandler.ts`](src/core/webview/webviewMessageHandler.ts:1): Message routing and webview communication
- [`src/core/webview/ClineProvider.ts`](src/core/webview/ClineProvider.ts:1): Webview state management and message history

**Architecture Patterns:**

- Event-driven communication using `postMessageToWebview` method
- Structured message types with routing through message handlers
- Message history management with persistence across sessions
- Existing message consolidation patterns to prevent chat spam

**Implementation Strategy:**

- Extend existing message types to include `retryChatMessage`
- Add retry message handlers around line 200 in `webviewMessageHandler.ts`
- Integrate with message history management around line 500 in `ClineProvider.ts`
- Follow existing message consolidation patterns

#### 13.1.2 PRD-03 Retry Infrastructure

**Primary Integration Points:**

- [`src/core/tools/retry/RetryEngine.ts`](src/core/tools/retry/RetryEngine.ts:26): Core retry orchestration with event emission
- [`src/core/tools/retry/RetryLogger.ts`](src/core/tools/retry/RetryLogger.ts:8): Detailed retry logging and statistics
- [`src/core/tools/retry/types.ts`](src/core/tools/retry/types.ts:1): Retry state and context interfaces

**Architecture Patterns:**

- Event-driven retry system with `retry-start`, `retry-attempt`, `retry-success`, `retry-failed` events
- Comprehensive state management with concurrent retry handling
- Detailed logging system with statistics and analytics
- Error classification and context optimization from PRD-03

**Implementation Strategy:**

- Create `RetryChatEmitter` to bridge retry events to chat messages
- Extend `RetryEngine` constructor (line 34) to include chat emitter
- Add chat emission to existing event handlers (lines 134, 178, 189)
- Use existing `RetryLogger` patterns for message formatting

#### 13.1.3 Template System Patterns

**Primary Integration Points:**

- [`src/shared/support-prompt.ts`](src/shared/support-prompt.ts:1): Template variable replacement using `${variable}` syntax
- Existing error formatting patterns in provider handlers
- Settings infrastructure for template customization

**Architecture Patterns:**

- Template variable replacement with regex-based parsing
- Structured error message formatting with categorization
- Settings-based template management with validation
- Existing template validation and safety patterns

**Implementation Strategy:**

- Implement `RetryTemplateEngine` using `{{variable}}` syntax (per PRD specification)
- Follow variable resolution patterns from `support-prompt.ts`
- Use existing error classification from `RetryFactory.classifyError` (line 72)
- Implement template validation using existing validation patterns

#### 13.1.4 Settings Infrastructure

**Primary Integration Points:**

- [`packages/types/src/global-settings.ts`](packages/types/src/global-settings.ts:1): Type-safe settings management
- Existing settings validation and migration patterns
- Settings synchronization between backend and frontend

**Architecture Patterns:**

- TypeScript interfaces with validation and migration support
- Nested settings objects with type safety
- Settings persistence and loading with backward compatibility
- Real-time settings synchronization

**Implementation Strategy:**

- Extend `GlobalSettings` interface around line 100 to include `RetryVisibilitySettings`
- Follow existing settings validation patterns
- Use existing settings synchronization patterns
- Implement settings migration for backward compatibility

### 13.2 Implementation File Structure

#### 13.2.1 New Files to Create

```
src/core/tools/retry/
├── RetryChatEmitter.ts              # Chat message emission from retry events
├── RetryTemplateEngine.ts           # Template processing with {{variable}} syntax
├── RetrySettingsManager.ts          # Settings integration and management
├── RetryAnalytics.ts               # Analytics and monitoring for retry visibility
├── defaultTemplates.ts              # Default template definitions
└── __tests__/                     # Comprehensive test suite

webview-ui/src/components/
├── RetryMessage.tsx                # Retry message display component
├── RetryProgressIndicator.tsx       # Progress indicator for active retries
├── RetryErrorMessage.tsx           # Error display with classification
├── RetrySuccessMessage.tsx         # Success notifications with statistics
├── TemplateEditor.tsx              # Template editing interface
├── TemplatePreview.tsx             # Live template preview component
├── RetryTemplateSettings.tsx       # Settings panel for customization
├── TemplateVariableHelper.tsx       # Variable documentation and helper
└── RetryAnalytics.tsx              # Analytics dashboard component
```

#### 13.2.2 Files to Modify

```
src/core/tools/retry/
├── types.ts                       # Add RetryChatMessage and template interfaces
├── RetryEngine.ts                 # Integrate chat emission with existing events
└── RetryLogger.ts                 # Extend logging for retry visibility

src/core/webview/
├── webviewMessageHandler.ts       # Add retry message routing (line 200)
└── ClineProvider.ts              # Integrate with message history (line 500)

packages/types/src/
└── global-settings.ts            # Add RetryVisibilitySettings (line 100)
```

### 13.3 Performance Requirements Implementation

#### 13.3.1 Message Rendering (<100ms)

- Template compilation and caching in `RetryTemplateEngine`
- React.memo and useMemo for UI components
- Optimized message consolidation algorithms
- Follow existing performance optimization patterns from webview-ui

#### 13.3.2 Memory Usage (<2MB overhead)

- Efficient message consolidation with circular buffers
- Automatic cleanup of old retry messages
- Lazy loading of template resources
- Follow existing memory management patterns from retry system

#### 13.3.3 Concurrent Retry Handling

- Leverage existing `RetryStateManager` concurrent retry management
- Use existing queue processing from `RetryQueue`
- Implement message batching for multiple concurrent retries
- Follow existing concurrency patterns from PRD-03

### 13.4 Testing Strategy

#### 13.4.1 Unit Tests

- Follow existing test patterns in `src/core/tools/retry/__tests__/`
- Use Jest/Vitest patterns from existing codebase
- Test template engine, message emission, and settings integration
- Achieve >90% code coverage following existing coverage standards

#### 13.4.2 Integration Tests

- Test end-to-end retry visibility workflow
- Test settings synchronization between backend and frontend
- Test template system integration with retry events
- Use existing integration test patterns from retry module

#### 13.4.3 Performance Tests

- Benchmark message rendering times to meet <100ms requirement
- Test memory usage under various loads to stay <2MB
- Validate concurrent retry handling performance
- Use existing performance test patterns from codebase

### 13.5 Migration and Backward Compatibility

#### 13.5.1 Settings Migration

- Implement settings migration for existing retry configurations
- Provide default values for new `RetryVisibilitySettings`
- Ensure backward compatibility with existing PRD-03 settings
- Follow existing settings migration patterns from global-settings.ts

#### 13.5.2 API Compatibility

- Maintain existing PRD-03 retry API compatibility
- Add new features as optional extensions without breaking changes
- Provide fallback behavior for missing features
- Follow existing API evolution patterns from retry system

#### 13.5.3 Webview Compatibility

- Ensure webview compatibility across different versions
- Implement graceful degradation for missing features
- Use existing webview compatibility patterns from ClineProvider
- Test with existing webview infrastructure

### 13.6 Security Considerations

#### 13.6.1 Template Injection Prevention

- Validate template syntax and variables using regex patterns
- Sanitize user-provided template content
- Prevent code injection in template rendering
- Follow existing security patterns from settings validation

#### 13.6.2 Settings Validation

- Validate all settings inputs using existing validation patterns
- Prevent malicious configuration values
- Implement proper error handling for invalid settings
- Use existing settings validation infrastructure

#### 13.6.3 Data Privacy

- Ensure retry logs don't contain sensitive information
- Implement proper data sanitization in template rendering
- Follow existing data privacy patterns from retry logging
- Comply with privacy requirements from existing systems

### 13.7 Monitoring and Analytics

#### 13.7.1 Retry Metrics

- Track retry visibility usage patterns
- Monitor template effectiveness and user preferences
- Collect performance metrics for chat output
- Use existing analytics infrastructure from retry system

#### 13.7.2 Error Tracking

- Monitor template rendering errors and validation failures
- Track settings synchronization issues
- Collect user interaction data for retry messages
- Follow existing error tracking patterns from RetryLogger

#### 13.7.3 Performance Monitoring

- Monitor message rendering times to meet <100ms requirement
- Track memory usage patterns to stay <2MB
- Collect system performance data for optimization
- Use existing performance monitoring from retry infrastructure

This implementation context provides comprehensive guidance for successful implementation of PRD-06, ensuring seamless integration with existing codebase architecture while maintaining backward compatibility and meeting performance requirements.
