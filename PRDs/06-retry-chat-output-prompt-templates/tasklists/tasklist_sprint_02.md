# Sprint 2: Prompt Templates Implementation (2 Weeks)

## Phase 1: Template Engine Infrastructure

### Task 2.1: RetryTemplateEngine Implementation

**File**: `src/core/tools/retry/RetryTemplateEngine.ts` (new file)
**Implementation**:

```typescript
export class RetryTemplateEngine {
	private templates: Map<string, RetryTemplate> = new Map()

	constructor(private settings: RetryVisibilitySettings) {
		this.loadDefaultTemplates()
	}

	// Use {{variable}} syntax for consistency with PRD specification
	renderTemplate(type: RetryMessageType, context: RetryTemplateContext): string
	validateTemplate(template: string): ValidationResult
	registerTemplate(type: string, template: string): void
}
```

### Task 2.2: Template Interface Definitions

**File**: `src/core/tools/retry/types.ts`
**Lines**: Add after line 350
**Implementation**:

```typescript
export interface RetryTemplate {
	id: string
	name: string
	description: string
	template: string
	variables: string[]
	category: "start" | "progress" | "success" | "failure"
}

export interface RetryTemplateContext {
	retryId: string
	toolName: string
	attempt: number
	maxAttempts: number
	error?: string
	errorClassification?: ErrorClassification
	duration?: number
	nextRetryTime?: number
	totalDuration?: number
	successRate?: number
}

export type RetryMessageType = "retry_start" | "retry_progress" | "retry_success" | "retry_failure"
```

### Task 2.3: Settings Schema Extension

**File**: `packages/types/src/global-settings.ts`
**Lines**: Add to existing GlobalSettings interface (around line 100)
**Implementation**:

```typescript
export interface RetryVisibilitySettings {
	enableRetryChatOutput: boolean
	enableDetailedProgress: boolean
	consolidateMessages: boolean
	maxProgressMessages: number
	customTemplates: Record<string, string>
	templateVariables: Record<string, any>
}

// Add to GlobalSettings interface
export interface GlobalSettings {
	// ... existing settings
	retryVisibility: RetryVisibilitySettings
}
```

### Task 2.4: Default Template Definitions

**File**: `src/core/tools/retry/defaultTemplates.ts` (new file)
**Implementation**:

```typescript
export const DEFAULT_RETRY_TEMPLATES: Record<RetryMessageType, string> = {
	retry_start: "🔄 Retrying {{toolName}} (attempt {{attempt}}/{{maxAttempts}})",
	retry_progress: "⏳ {{toolName}} retry {{attempt}}/{{maxAttempts}} in progress...",
	retry_success: "✅ {{toolName}} succeeded after {{attempt}} attempts ({{totalDuration}}ms)",
	retry_failure: "❌ {{toolName}} failed after {{maxAttempts}} attempts: {{error}}",
}

export const DETAILED_RETRY_TEMPLATES: Record<RetryMessageType, string> = {
	retry_start:
		"🔄 **{{toolName}}** retry initiated\n- Attempt: {{attempt}}/{{maxAttempts}}\n- Error: {{error}}\n- Classification: {{errorClassification.category}}",
	retry_progress:
		"⏳ **{{toolName}}** retry progress\n- Current attempt: {{attempt}}/{{maxAttempts}}\n- Next retry: {{nextRetryTime}}",
	retry_success:
		"✅ **{{toolName}}** retry successful\n- Total attempts: {{attempt}}\n- Duration: {{totalDuration}}ms\n- Success rate: {{successRate}}%",
	retry_failure:
		"❌ **{{toolName}}** retry failed\n- Attempts: {{maxAttempts}}\n- Final error: {{error}}\n- Classification: {{errorClassification.category}}",
}
```

## Phase 2: Template Management System

### Task 2.5: Template Validation Logic

**File**: `src/core/tools/retry/RetryTemplateEngine.ts`
**Lines**: Add validation methods (around line 50)
**Implementation**:

- Validate {{variable}} syntax using regex patterns
- Check for required variables per template type
- Validate template structure and safety
- Use existing validation patterns from RetryFactory.validateSettings

### Task 2.6: Settings Integration Layer

**File**: `src/core/tools/retry/RetrySettingsManager.ts` (new file)
**Implementation**:

- Integrate with existing global settings system
- Load/save custom templates from settings
- Provide template management API
- Follow existing settings patterns from global-settings.ts

### Task 2.7: Template Variable Resolver

**File**: `src/core/tools/retry/RetryTemplateEngine.ts`
**Lines**: Add variable resolution (around line 80)
**Implementation**:

- Resolve {{variable}} placeholders with context data
- Support nested variable resolution
- Handle missing variables gracefully
- Use existing string interpolation patterns from support-prompt.ts

### Task 2.8: Template Registration System

**File**: `src/core/tools/retry/RetryTemplateEngine.ts`
**Lines**: Add registration methods (around line 120)
**Implementation**:

- Register custom templates from user settings
- Support template categories and metadata
- Validate templates on registration
- Provide template discovery API

## Phase 3: UI Components for Template Management

### Task 2.9: Template Editor Component

**File**: `webview-ui/src/components/TemplateEditor.tsx` (new file)
**Implementation**:

- Create React component for template editing
- Use existing form patterns from webview-ui
- Support {{variable}} syntax highlighting
- Include template validation feedback
- Follow Material Design patterns

### Task 2.10: Template Preview Component

**File**: `webview-ui/src/components/TemplatePreview.tsx` (new file)
**Implementation**:

- Create live preview component for templates
- Use sample retry context for preview
- Show rendered template output
- Support different message types
- Follow existing preview component patterns

### Task 2.11: Template Settings Panel

**File**: `webview-ui/src/components/RetryTemplateSettings.tsx` (new file)
**Implementation**:

- Create settings panel for template customization
- Integrate with existing settings UI patterns
- Support template selection and editing
- Include template import/export functionality
- Use existing settings component patterns

### Task 2.12: Variable Helper Component

**File**: `webview-ui/src/components/TemplateVariableHelper.tsx` (new file)
**Implementation**:

- Create helper component showing available variables
- Display variable descriptions and examples
- Support variable insertion in template editor
- Use existing helper component patterns
- Follow accessibility guidelines

## Phase 4: Integration with Chat System

### Task 2.13: Chat Message Template Integration

**File**: `src/core/tools/retry/RetryChatEmitter.ts`
**Lines**: Modify to use template engine (around line 40)
**Implementation**:

- Integrate RetryTemplateEngine with chat message generation
- Use templates instead of hardcoded messages
- Support both default and custom templates
- Maintain existing event emission patterns

### Task 2.14: Settings Synchronization

**File**: `src/core/webview/ClineProvider.ts`
**Lines**: Add settings sync for templates (around line 300)
**Implementation**:

- Synchronize template settings between backend and frontend
- Use existing settings synchronization patterns
- Handle template updates in real-time
- Ensure settings persistence across sessions

### Task 2.15: Template Performance Optimization

**File**: `src/core/tools/retry/RetryTemplateEngine.ts`
**Lines**: Add caching and optimization (around line 150)
**Implementation**:

- Implement template compilation and caching
- Optimize variable resolution performance
- Use existing performance optimization patterns
- Ensure <100ms rendering requirement is met

## Phase 5: Testing and Validation

### Task 2.16: Template Engine Unit Tests

**File**: `src/core/tools/retry/__tests__/RetryTemplateEngine.test.ts` (new file)
**Implementation**:

- Test template rendering with variables
- Test template validation logic
- Test custom template registration
- Test error handling in templates
- Use existing test patterns from retry module

### Task 2.17: Settings Integration Tests

**File**: `src/core/tools/retry/__tests__/RetrySettingsManager.test.ts` (new file)
**Implementation**:

- Test settings loading and saving
- Test template synchronization
- Test settings validation
- Test default template fallback
- Use existing settings test patterns

### Task 2.18: UI Component Tests

**File**: `webview-ui/src/components/__tests__/TemplateEditor.test.tsx` (new file)
**Implementation**:

- Test template editor functionality
- Test template validation in UI
- Test variable highlighting
- Test template preview updates
- Use existing React component test patterns

### Task 2.19: Integration Tests for Template System

**File**: `src/core/tools/retry/__tests__/RetryTemplateIntegration.test.ts` (new file)
**Implementation**:

- Test end-to-end template workflow
- Test template updates in real-time
- Test template persistence
- Test performance with many templates
- Use existing integration test patterns

## Acceptance Criteria

- [ ] Template engine supports {{variable}} syntax
- [ ] All default templates render correctly
- [ ] Custom templates can be created and saved
- [ ] Template validation prevents invalid syntax
- [ ] Settings integration works seamlessly
- [ ] UI components follow existing design patterns
- [ ] Template preview updates in real-time
- [ ] Performance meets <100ms rendering requirement
- [ ] All tests pass with >90% coverage
- [ ] Template variables resolve correctly from retry context
- [ ] Error handling works for malformed templates
