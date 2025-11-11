# Implementation Context for PRD-06: Retry Chat Output & Prompt Templates

## Codebase Analysis Summary

This document provides comprehensive implementation context for PRD-06, mapping requirements to existing codebase patterns and providing detailed integration guidance.

## 1. Existing Infrastructure Analysis

### 1.1 PRD-03 Retry Infrastructure

**Primary Integration Points:**

- **[`src/core/tools/retry/RetryEngine.ts`](src/core/tools/retry/RetryEngine.ts:34)**: Core retry orchestration with event emission

    - Event handlers at lines 134, 178, 189 for retry lifecycle
    - Integration point for chat message emission
    - Uses existing [`EventEmitter`](src/core/tools/retry/RetryEngine.ts:34) patterns

- **[`src/core/tools/retry/RetryLogger.ts`](src/core/tools/retry/RetryLogger.ts:1)**: Comprehensive logging system

    - Methods: [`logAttemptStart`](src/core/tools/retry/RetryLogger.ts:50), [`logAttemptSuccess`](src/core/tools/retry/RetryLogger.ts:80), [`logAttemptFailure`](src/core/tools/retry/RetryLogger.ts:110)
    - Pattern for retry message formatting and statistics
    - Integration point for chat message logging

- **[`src/core/tools/retry/types.ts`](src/core/tools/retry/types.ts:15)**: Type definitions

    - [`RetryContext`](src/core/tools/retry/types.ts:15), [`RetryState`](src/core/tools/retry/types.ts:25), [`RetryAttempt`](src/core/tools/retry/types.ts:25) interfaces
    - [`ErrorClassification`](src/core/tools/retry/types.ts:35) with categories and severity
    - Foundation for extending with chat message types

- **[`src/core/tools/retry/RetryFactory.ts`](src/core/tools/retry/RetryFactory.ts:72)**: Error classification and settings validation
    - [`classifyError`](src/core/tools/retry/RetryFactory.ts:72) method for error categorization
    - Settings validation and merging patterns
    - Template for retry configuration management

### 1.2 Webview Message System

**Primary Integration Points:**

- **[`src/core/webview/ClineProvider.ts`](src/core/webview/ClineProvider.ts:992)**: Webview communication

    - [`postMessageToWebview`](src/core/webview/ClineProvider.ts:992) method for UI communication
    - Webview message listener setup at lines 1171-1177
    - State management and message routing patterns
    - Integration point for retry message delivery

- **[`src/core/webview/webviewMessageHandler.ts`](src/core/webview/webviewMessageHandler.ts:3122)**: Message handling patterns
    - Examples of [`postMessageToWebview`](src/core/webview/webviewMessageHandler.ts:3122) usage at lines 3122-3125, 2579-2583
    - Integration point for retry message handling
    - Message routing and validation patterns

### 1.3 Settings Infrastructure

**Primary Integration Points:**

- **[`packages/types/src/global-settings.ts`](packages/types/src/global-settings.ts:174)**: Type-safe settings management

    - [`GlobalSettings`](packages/types/src/global-settings.ts:174) interface with validation and migration support
    - Settings persistence and loading with backward compatibility
    - Real-time settings synchronization
    - Integration point for retry visibility settings

- **[`src/shared/support-prompt.ts`](src/shared/support-prompt.ts:11)**: Template variable replacement
    - Uses `${variable}` syntax (different from PRD {{variable}} requirement)
    - Variable resolution patterns at lines 12-28
    - Template validation and safety patterns
    - Foundation for template engine implementation

### 1.4 React Component Patterns

**Primary Integration Points:**

- **[`webview-ui/src/components/settings/ApiConfigManager.tsx`](webview-ui/src/components/settings/ApiConfigManager.tsx:184)**: Settings UI patterns

    - Material Design component structure
    - Form validation and error handling patterns
    - Settings synchronization patterns
    - Template for retry settings components

- **[`webview-ui/src/components/chat/ChatRow.tsx`](webview-ui/src/components/chat/ChatRow.tsx:83)**: Chat message display patterns
    - Message type handling and styling
    - Icon and progress indicator patterns
    - User interaction handling
    - Template for retry message components

### 1.5 Test Infrastructure

**Primary Integration Points:**

- **[`webview-ui/src/__tests__/App.spec.tsx`](webview-ui/src/__tests__/App.spec.tsx:180)**: React component test patterns
    - Mock patterns for vscode and components
    - Test utilities and rendering patterns
    - Integration test structure
    - Template for retry component tests

## 2. Implementation Strategy

### 2.1 Architectural Integration

**Event-Driven Architecture:**

- Extend existing [`RetryEngine`](src/core/tools/retry/RetryEngine.ts:34) event system
- Add new event types: `retry-chat-start`, `retry-chat-progress`, `retry-chat-success`, `retry-chat-failure`
- Maintain backward compatibility with existing PRD-03 events
- Use existing [`EventEmitter`](src/core/tools/retry/RetryEngine.ts:34) patterns

**Template System Integration:**

- Implement `RetryTemplateEngine` using {{variable}} syntax (per PRD specification)
- Follow existing variable resolution patterns from [`support-prompt.ts`](src/shared/support-prompt.ts:11)
- Integrate with existing settings validation from [`RetryFactory`](src/core/tools/retry/RetryFactory.ts:72)
- Use existing template validation patterns

**Settings Integration:**

- Extend [`GlobalSettings`](packages/types/src/global-settings.ts:174) interface with `RetryVisibilitySettings`
- Follow existing Zod validation patterns from [`retrySettingsSchema`](packages/types/src/global-settings.ts:50)
- Use existing settings migration and persistence patterns
- Integrate with existing settings synchronization

### 2.2 Performance Requirements

**<100ms Rendering Requirement:**

- Template compilation and caching for performance
- Optimized variable resolution using existing patterns
- Performance monitoring using existing metrics collection
- Memory-efficient message handling

**<2MB Memory Overhead Requirement:**

- Efficient template storage and caching
- Memory usage monitoring and cleanup
- Lazy loading of templates
- Existing memory management patterns

### 2.3 Backward Compatibility

**PRD-03 Compatibility:**

- Maintain existing retry functionality unchanged
- Add new chat output as optional feature
- Preserve existing event emission patterns
- Use existing configuration and settings

**Settings Migration:**

- Automatic migration from existing retry settings
- Backward-compatible settings structure
- Graceful fallback for missing settings
- Existing migration patterns

## 3. Code Patterns to Follow

### 3.1 Message Structure Patterns

**Follow existing [`ClineMessage`](src/core/webview/ClineProvider.ts:181) patterns:**

```typescript
interface RetryChatMessage {
	id: string
	type: "retry_start" | "retry_progress" | "retry_success" | "retry_failure"
	timestamp: number
	retryId: string
	toolName: string
	attempt: number
	maxAttempts: number
	message: string
	error?: string
	duration?: number
	nextRetryTime?: number
	errorClassification?: ErrorClassification
}
```

**Use existing message routing patterns:**

- Follow [`postMessageToWebview`](src/core/webview/ClineProvider.ts:992) pattern
- Use existing message handler structure from [`webviewMessageHandler.ts`](src/core/webview/webviewMessageHandler.ts:200)
- Maintain existing message enhancement patterns

### 3.2 Template Engine Patterns

**Follow existing template patterns from [`support-prompt.ts`](src/shared/support-prompt.ts:11):**

```typescript
// Use {{variable}} syntax (per PRD specification)
private renderTemplate(template: string, context: RetryTemplateContext): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, variableName) => {
    const value = this.getVariableValue(variableName, context)
    return value !== undefined ? String(value) : match
  })
}
```

**Use existing validation patterns:**

- Follow [`RetryFactory.validateSettings`](src/core/tools/retry/RetryFactory.ts:72) patterns
- Use existing error handling and validation
- Maintain existing validation structure

### 3.3 Settings Integration Patterns

**Follow existing settings patterns from [`global-settings.ts`](packages/types/src/global-settings.ts:316):**

```typescript
// Add to existing GlobalSettings interface
export interface GlobalSettings {
  // ... existing settings
  retrySettings: retrySettingsSchema.optional(),
  retryVisibility: retryVisibilitySettingsSchema.optional(), // New addition
}
```

**Use existing migration patterns:**

- Follow existing settings migration structure
- Use existing validation and persistence patterns
- Maintain backward compatibility

### 3.4 React Component Patterns

**Follow existing component patterns from [`ApiConfigManager`](webview-ui/src/components/settings/ApiConfigManager.tsx:184):**

```typescript
// Material Design component structure
const RetryMessage = memo(({ message }: { message: RetryChatMessage }) => {
  const { t } = useTranslation()

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "10px",
      marginBottom: "10px",
      wordBreak: "break-word"
    }}>
      {/* Message content */}
    </div>
  )
})
```

**Use existing form and validation patterns:**

- Follow existing form structure from settings components
- Use existing validation and error display patterns
- Maintain accessibility guidelines

### 3.5 Test Patterns

**Follow existing test patterns from [`App.spec.tsx`](webview-ui/src/__tests__/App.spec.tsx:180):**

```typescript
describe("RetryMessage", () => {
  test("renders retry message correctly", () => {
    render(<RetryMessage message={mockMessage} />)
    expect(screen.getByText("Expected message")).toBeInTheDocument()
  })
})
```

**Use existing mocking patterns:**

- Follow existing vscode and component mocking
- Use existing test utilities and helpers
- Maintain test structure and coverage

## 4. Integration Points Summary

### 4.1 Core Integration Points

1. **RetryEngine Event Integration** (lines 134, 178, 189)

    - Add `RetryChatEmitter` to existing event handlers
    - Maintain backward compatibility with existing events
    - Use existing [`EventEmitter`](src/core/tools/retry/RetryEngine.ts:34) patterns

2. **Webview Message Integration** (line 992)

    - Use existing [`postMessageToWebview`](src/core/webview/ClineProvider.ts:992) method
    - Follow existing message routing patterns
    - Integrate with existing message history management

3. **Settings Schema Integration** (line 316)
    - Extend existing [`GlobalSettings`](packages/types/src/global-settings.ts:174) interface
    - Follow existing Zod validation patterns
    - Use existing settings migration system

### 4.2 Template System Integration

1. **Variable Resolution** (support-prompt.ts:11)

    - Adapt existing `${variable}` patterns to `{{variable}}` syntax
    - Use existing string interpolation logic
    - Maintain existing validation patterns

2. **Template Validation** (RetryFactory.ts:72)

    - Follow existing validation patterns from [`RetryFactory.validateSettings`](src/core/tools/retry/RetryFactory.ts:72)
    - Use existing error handling and reporting
    - Maintain existing validation structure

3. **Settings Management** (global-settings.ts:316)
    - Integrate with existing settings persistence
    - Use existing settings synchronization patterns
    - Maintain backward compatibility

### 4.3 UI Component Integration

1. **Message Display** (ChatRow.tsx:83)

    - Follow existing message component structure
    - Use existing styling and accessibility patterns
    - Integrate with existing message history

2. **Settings UI** (ApiConfigManager.tsx:184)

    - Follow existing form and validation patterns
    - Use existing Material Design components
    - Maintain existing settings synchronization

3. **Test Infrastructure** (App.spec.tsx:180)
    - Follow existing test patterns and utilities
    - Use existing mocking and validation
    - Maintain test coverage and quality

## 5. Implementation Guidelines

### 5.1 Performance Guidelines

- **Template Caching**: Compile templates once and cache for performance
- **Variable Resolution**: Optimize variable lookup and resolution
- **Memory Management**: Implement efficient cleanup and garbage collection
- **Message Consolidation**: Prevent chat spam through message consolidation

### 5.2 Compatibility Guidelines

- **Backward Compatibility**: Maintain existing PRD-03 functionality
- **Settings Migration**: Automatic migration from existing settings
- **API Stability**: Preserve existing event interfaces
- **Graceful Degradation**: Fallback to existing behavior on errors

### 5.3 Quality Guidelines

- **Code Consistency**: Follow existing code patterns and conventions
- **Test Coverage**: Maintain >90% test coverage requirement
- **Documentation**: Update existing documentation patterns
- **Security**: Follow existing security and validation patterns

## 6. Success Criteria

### 6.1 Functional Requirements

- [ ] All retry events generate appropriate chat messages
- [ ] Template engine supports {{variable}} syntax with validation
- [ ] Settings integration works seamlessly with existing system
- [ ] Message consolidation prevents chat spam effectively
- [ ] Performance requirements met (<100ms rendering, <2MB memory)

### 6.2 Integration Requirements

- [ ] Backward compatibility with PRD-03 maintained
- [ ] Existing retry functionality unchanged
- [ ] Settings migration works automatically
- [ ] Webview integration follows existing patterns

### 6.3 Quality Requirements

- [ ] Code follows existing patterns and conventions
- [ ] Test coverage exceeds 90%
- [ ] Documentation updated and accurate
- [ ] Security and privacy requirements satisfied

This implementation context provides comprehensive guidance for implementing PRD-06 while leveraging existing codebase patterns and maintaining architectural consistency.
