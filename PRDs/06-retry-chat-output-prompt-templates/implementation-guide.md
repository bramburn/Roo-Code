# Implementation Guide for PRD-06: Retry Chat Output & Prompt Templates Enhancement

## Codebase Context and Architecture

This guide provides detailed implementation context for PRD-06, building on the comprehensive codebase analysis performed during context integration.

### Key Integration Points

#### 1. Chat System Integration

**Primary Files**: [`src/core/webview/webviewMessageHandler.ts`](src/core/webview/webviewMessageHandler.ts:1), [`src/core/webview/ClineProvider.ts`](src/core/webview/ClineProvider.ts:1)

**Architecture Pattern**: The chat system uses event-driven communication between the backend and webview frontend. Messages are structured with types and routed through the `postMessageToWebview` method.

**Integration Strategy**:

- Extend existing message types to include `retryChatMessage`
- Add retry message handlers to `webviewMessageHandler.ts` around line 200
- Integrate with `ClineProvider.ts` message history management around line 500
- Follow existing message consolidation patterns to prevent chat spam

#### 2. PRD-03 Retry Infrastructure

**Primary Files**: [`src/core/tools/retry/RetryEngine.ts`](src/core/tools/retry/RetryEngine.ts:26), [`src/core/tools/retry/RetryLogger.ts`](src/core/tools/retry/RetryLogger.ts:8), [`src/core/tools/retry/types.ts`](src/core/tools/retry/types.ts:1)

**Architecture Pattern**: PRD-03 implements a comprehensive retry system with event emission, state management, and detailed logging. The `RetryEngine` emits events for `retry-start`, `retry-attempt`, `retry-success`, and `retry-failed`.

**Integration Strategy**:

- Create `RetryChatEmitter` to bridge retry events to chat messages
- Extend `RetryEngine` constructor (line 34) to include chat emitter
- Add chat emission to existing event handlers (lines 134, 178, 189)
- Use existing `RetryLogger` patterns for message formatting

#### 3. Template System Patterns

**Primary Files**: [`src/shared/support-prompt.ts`](src/shared/support-prompt.ts:1), existing error formatting in provider handlers

**Architecture Pattern**: The codebase uses `${variable}` syntax for template variable replacement. Error messages follow structured formatting patterns with categorization and user-friendly descriptions.

**Integration Strategy**:

- Implement `RetryTemplateEngine` using `{{variable}}` syntax (per PRD specification)
- Follow variable resolution patterns from `support-prompt.ts`
- Use existing error classification from `RetryFactory.classifyError` (line 72)
- Implement template validation using regex patterns similar to existing validation

#### 4. Settings Infrastructure

**Primary Files**: [`packages/types/src/global-settings.ts`](packages/types/src/global-settings.ts:1)

**Architecture Pattern**: Settings use TypeScript interfaces with validation, migration support, and persistence. The system supports nested settings objects with type safety.

**Integration Strategy**:

- Extend `GlobalSettings` interface around line 100 to include `RetryVisibilitySettings`
- Follow existing settings validation patterns
- Use existing settings synchronization between backend and frontend
- Implement settings migration for backward compatibility

### Implementation Patterns to Follow

#### 1. Event-Driven Architecture

```typescript
// Follow existing RetryEngine event patterns
this.emit("retry-start", context, retryState)
this.emit("retry-attempt", context, attempt)
this.emit("retry-success", context, result, attempts)
this.emit("retry-failed", context, error, attempts)
```

#### 2. Message Type System

```typescript
// Extend existing message type patterns
interface RetryChatMessage {
	id: string
	type: "retry_start" | "retry_progress" | "retry_success" | "retry_failure"
	timestamp: number
	retryId: string
	toolName: string
	// ... other fields
}
```

#### 3. Template Variable Resolution

```typescript
// Follow support-prompt.ts patterns
private resolveVariables(template: string, context: RetryTemplateContext): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
    return context[variable as keyof RetryTemplateContext]?.toString() || match
  })
}
```

#### 4. Settings Integration

```typescript
// Follow global-settings.ts patterns
export interface RetryVisibilitySettings {
	enableRetryChatOutput: boolean
	enableDetailedProgress: boolean
	consolidateMessages: boolean
	maxProgressMessages: number
	customTemplates: Record<string, string>
	templateVariables: Record<string, any>
}
```

### File Structure and Organization

#### New Files to Create

```
src/core/tools/retry/
├── RetryChatEmitter.ts              # Chat message emission
├── RetryTemplateEngine.ts           # Template processing
├── RetrySettingsManager.ts          # Settings integration
├── RetryAnalytics.ts               # Analytics and monitoring
├── defaultTemplates.ts              # Default template definitions
└── __tests__/                     # Test files

webview-ui/src/components/
├── RetryMessage.tsx                # Retry message display
├── RetryProgressIndicator.tsx       # Progress indicators
├── RetryErrorMessage.tsx           # Error display
├── RetrySuccessMessage.tsx         # Success notifications
├── TemplateEditor.tsx              # Template editing
├── TemplatePreview.tsx             # Template preview
├── RetryTemplateSettings.tsx       # Settings panel
├── TemplateVariableHelper.tsx       # Variable helper
└── RetryAnalytics.tsx              # Analytics dashboard
```

#### Files to Modify

```
src/core/tools/retry/
├── types.ts                       # Add new interfaces
├── RetryEngine.ts                 # Integrate chat emission
└── RetryLogger.ts                 # Extend logging

src/core/webview/
├── webviewMessageHandler.ts       # Add retry message routing
└── ClineProvider.ts              # Integrate with history

packages/types/src/
└── global-settings.ts            # Add RetryVisibilitySettings
```

### Performance Requirements Implementation

#### 1. Message Rendering (<100ms)

- Implement template compilation and caching in `RetryTemplateEngine`
- Use React.memo and useMemo for UI components
- Optimize message consolidation algorithms
- Follow existing performance optimization patterns

#### 2. Memory Usage (<2MB overhead)

- Implement efficient message consolidation
- Use circular buffers for retry history
- Clean up old retry messages automatically
- Follow existing memory management patterns

#### 3. Concurrent Retry Handling

- Leverage existing `RetryStateManager` concurrent retry management
- Use existing queue processing from `RetryQueue`
- Implement message batching for multiple concurrent retries
- Follow existing concurrency patterns

### Testing Strategy

#### 1. Unit Tests

- Follow existing test patterns in `src/core/tools/retry/__tests__/`
- Use Jest/Vitest patterns from existing codebase
- Test template engine, message emission, and settings integration
- Achieve >90% code coverage

#### 2. Integration Tests

- Test end-to-end retry visibility workflow
- Test settings synchronization between backend and frontend
- Test template system integration with retry events
- Use existing integration test patterns

#### 3. Performance Tests

- Benchmark message rendering times
- Test memory usage under various loads
- Validate concurrent retry handling
- Use existing performance test patterns

### Migration and Backward Compatibility

#### 1. Settings Migration

- Implement settings migration for existing retry settings
- Provide default values for new settings
- Ensure backward compatibility with existing configurations
- Follow existing settings migration patterns

#### 2. API Compatibility

- Maintain existing PRD-03 retry API compatibility
- Add new features as optional extensions
- Provide fallback behavior for missing features
- Follow existing API evolution patterns

#### 3. Webview Compatibility

- Ensure webview compatibility across different versions
- Implement graceful degradation for missing features
- Use existing webview compatibility patterns
- Test with existing webview infrastructure

### Security Considerations

#### 1. Template Injection Prevention

- Validate template syntax and variables
- Sanitize user-provided template content
- Prevent code injection in template rendering
- Follow existing security patterns

#### 2. Settings Validation

- Validate all settings inputs
- Prevent malicious configuration values
- Use existing settings validation patterns
- Implement proper error handling

#### 3. Data Privacy

- Ensure retry logs don't contain sensitive information
- Implement proper data sanitization
- Follow existing data privacy patterns
- Comply with privacy requirements

### Monitoring and Analytics

#### 1. Retry Metrics

- Track retry visibility usage patterns
- Monitor template effectiveness
- Collect performance metrics
- Use existing analytics infrastructure

#### 2. Error Tracking

- Monitor template rendering errors
- Track settings validation failures
- Collect user interaction data
- Follow existing error tracking patterns

#### 3. Performance Monitoring

- Monitor message rendering times
- Track memory usage patterns
- Collect system performance data
- Use existing performance monitoring

### Documentation Requirements

#### 1. API Documentation

- Document all new interfaces and classes
- Provide usage examples and best practices
- Include migration guides for existing users
- Follow existing documentation patterns

#### 2. User Documentation

- Create user guides for template customization
- Document settings configuration
- Provide troubleshooting guides
- Follow existing user documentation patterns

#### 3. Developer Documentation

- Document integration points and patterns
- Provide extension guidelines
- Include code examples and tutorials
- Follow existing developer documentation patterns

This implementation guide provides the necessary context and patterns for successful implementation of PRD-06, ensuring seamless integration with existing codebase architecture and maintaining backward compatibility.
