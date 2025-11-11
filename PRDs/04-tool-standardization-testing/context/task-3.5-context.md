# Context Document for Task 3.5: Error handling and recovery mechanisms

## Task Information

- **Task ID**: 3.5
- **Description**: Implement comprehensive error handling and recovery mechanisms for LangChain tool execution
- **Status**: ☐ To Do
- **Target Files**:
    - `src/recovery/ToolErrorHandler.ts`
    - `src/recovery/RecoveryStrategy.ts`
    - `src/recovery/ErrorClassifier.ts`
    - **Modify Existing**: Update `src/core/condense/error-handler.ts` to integrate with new recovery system

## 1. Current Code Analysis (Internal)

### Existing Error Handling Infrastructure

From codebase analysis, found comprehensive error handling patterns:

#### ErrorHandler Pattern

```typescript
// From src/core/condense/error-handler.ts
interface ErrorContext {
	component: string
	operation: string
	timestamp: number
	additionalData?: Record<string, any>
}

interface ErrorSeverity {
	level: "low" | "medium" | "high" | "critical"
	impact: string
	requiresAttention: boolean
}

interface RecoveryStrategy {
	type: "retry" | "fallback" | "skip" | "abort"
	maxAttempts?: number
	delay?: number
	fallbackAction?: () => Promise<any>
}

class ErrorHandler extends EventEmitter {
	async handleError(error: Error, context: ErrorContext, category: string): Promise<ErrorHandlingResult>

	categorizeError(error: Error): ErrorSeverity
	determineRecoveryStrategy(error: Error, context: ErrorContext): RecoveryStrategy
}
```

#### File Recovery Pattern

```typescript
// From src/core/condense/file-recovery.ts
class FileRecovery extends EventEmitter {
	constructor(errorHandler: ErrorHandler, config: Partial<RecoveryOptions> = {}) {
		this.errorHandler = errorHandler
		this.config = {
			createBackup: true,
			maxAttempts: 3,
			recoveryTimeout: 30000,
			enableAutoRecovery: true,
			...config,
		}
	}

	async recoverFile(originalPath: string, backupPath?: string): Promise<RecoveryResult> {
		try {
			// Attempt recovery from backup
			const recoveryInfo = await this.attemptRecovery(originalPath, backupPath)

			if (recoveryInfo.status === "success") {
				await this.errorHandler.handleError(
					new Error(`File recovered successfully: ${originalPath}`),
					{
						component: "FileRecovery",
						operation: "recover-file",
						filepath: originalPath,
						timestamp: Date.now(),
					},
					"file-system",
				)
			}

			return recoveryInfo
		} catch (error) {
			recoveryInfo.status = "failed"
			recoveryInfo.error = error instanceof Error ? error.message : String(error)

			await this.errorHandler.handleError(
				error as Error,
				{
					component: "FileRecovery",
					operation: "recover-file",
					filepath: originalPath,
					timestamp: Date.now(),
				},
				"file-system",
			)
		}
	}
}
```

#### Tool Error Handling Pattern

```typescript
// From src/core/tools/codebaseSearchTool.ts
catch (error: any) {
	await handleError(toolName, error) // Use standard error handler
}

// From src/core/tools/useMcpToolTool.ts
catch (error) {
	await handleError("executing MCP tool", error)
}
```

#### Retry Engine Error Handling

```typescript
// From src/core/tools/retry/RetryEngine.ts
class RetryEngine {
	async executeWithRetry<T>(context: RetryContext, execution: () => Promise<T>): Promise<T> {
		let lastError: Error

		for (let attempt = 1; attempt <= this.config.maxRetries + 1; attempt++) {
			try {
				return await execution()
			} catch (error) {
				lastError = error as Error

				if (attempt <= this.config.maxRetries) {
					const shouldRetry = await this.shouldRetry(error, attempt, context)
					if (shouldRetry.retry) {
						await this.delay(shouldRetry.delay)
						continue
					}
				}

				break
			}
		}

		throw lastError
	}
}
```

### Error Classification Patterns

Found existing error categorization in multiple locations:

#### Error Severity Classification

```typescript
// From error handling analysis
interface ErrorSeverity {
	level: "low" | "medium" | "high" | "critical"
	impact: string
	requiresAttention: boolean
}

// Examples found:
- Network errors: "medium" severity, retry strategy
- File system errors: "high" severity, fallback strategy
- Validation errors: "low" severity, skip strategy
- Authentication errors: "critical" severity, abort strategy
```

#### Recovery Strategy Patterns

```typescript
// From src/core/condense/error-handler.ts
interface RecoveryStrategy {
	type: "retry" | "fallback" | "skip" | "abort"
	maxAttempts?: number
	delay?: number
	fallbackAction?: () => Promise<any>
}

// Recovery strategies found:
1. Retry: For transient errors (network, timeouts)
2. Fallback: For tool unavailability (alternative tools)
3. Skip: For non-critical errors (optional features)
4. Abort: For critical errors (authentication, permissions)
```

## 2. External Best Practices (GitHub)

### Best Practice Example 1: Comprehensive Error Classification

**Source**: https://github.com/goldbergyoni/node-best-practices  
**Stars**: 15,000+ | **Language**: TypeScript

```typescript
// Advanced error classification system
class ErrorClassifier {
	private errorPatterns: Map<RegExp, ErrorClassification> = new Map()
	private errorTypes: Map<string, ErrorType> = new Map()

	constructor() {
		this.initializeErrorPatterns()
		this.initializeErrorTypes()
	}

	classifyError(error: Error, context: ErrorContext): ErrorClassification {
		const errorMessage = error.message.toLowerCase()
		const stackTrace = error.stack || ""

		// Check for known error patterns
		for (const [pattern, classification] of this.errorPatterns) {
			if (pattern.test(errorMessage) || pattern.test(stackTrace)) {
				return {
					...classification,
					originalError: error,
					context,
					confidence: this.calculateConfidence(pattern, errorMessage, stackTrace),
				}
			}
		}

		// Default classification based on error type
		return this.classifyByErrorType(error, context)
	}

	private initializeErrorPatterns(): void {
		// Network errors
		this.errorPatterns.set(/ECONNREFUSED|ENOTFOUND|ETIMEDOUT/, {
			category: "network",
			severity: "medium",
			isRetryable: true,
			suggestedAction: "retry_with_backoff",
			maxRetries: 3,
			backoffMultiplier: 2,
		})

		// File system errors
		this.errorPatterns.set(/ENOENT|EACCES|EPERM/, {
			category: "filesystem",
			severity: "high",
			isRetryable: false,
			suggestedAction: "fallback_or_abort",
			requiresUserIntervention: true,
		})

		// Validation errors
		this.errorPatterns.set(/ValidationError|SchemaError|InvalidParameter/, {
			category: "validation",
			severity: "low",
			isRetryable: false,
			suggestedAction: "skip_or_correct",
			requiresParameterFix: true,
		})

		// Authentication errors
		this.errorPatterns.set(/Unauthorized|AuthenticationError|Forbidden/, {
			category: "authentication",
			severity: "critical",
			isRetryable: false,
			suggestedAction: "abort_and_notify",
			requiresReauthentication: true,
		})
	}

	calculateRecoveryStrategy(classification: ErrorClassification): RecoveryStrategy {
		switch (classification.suggestedAction) {
			case "retry_with_backoff":
				return {
					type: "retry",
					maxAttempts: classification.maxRetries || 3,
					delay: 1000,
					backoffMultiplier: 2,
					jitter: true,
				}

			case "fallback_or_abort":
				return {
					type: classification.requiresUserIntervention ? "abort" : "fallback",
					fallbackAction: () => this.attemptAlternativeTool(classification.context),
				}

			case "skip_or_correct":
				return {
					type: classification.requiresParameterFix ? "skip" : "retry",
					maxAttempts: 1,
					delay: 0,
				}

			case "abort_and_notify":
				return {
					type: "abort",
					reason: "Authentication required",
					userMessage: "Please reauthenticate to continue",
				}

			default:
				return { type: "abort", reason: "Unknown error pattern" }
		}
	}
}
```

**Key Takeaways**:

- Pattern-based error classification
- Confidence scoring for classifications
- Context-aware recovery strategies
- Configurable retry and backoff strategies

### Best Practice Example 2: Advanced Recovery Strategies

**Source**: https://github.com/trentm/node-prune  
**Stars**: 2,000+ | **Language**: TypeScript

```typescript
// Sophisticated recovery strategy implementation
class RecoveryStrategy {
	private strategies: Map<string, RecoveryHandler> = new Map()
	private fallbackChain: RecoveryHandler[] = []

	constructor() {
		this.initializeStrategies()
		this.initializeFallbackChain()
	}

	async executeRecovery(
		error: Error,
		context: ErrorContext,
		classification: ErrorClassification,
	): Promise<RecoveryResult> {
		const strategyName = classification.suggestedAction
		const strategy = this.strategies.get(strategyName)

		if (!strategy) {
			return this.executeFallbackChain(error, context, classification)
		}

		try {
			const result = await strategy.handle(error, context, classification)

			if (result.success) {
				await this.logRecoverySuccess(strategyName, error, context)
				return result
			} else {
				return this.executeFallbackChain(error, context, classification)
			}
		} catch (recoveryError) {
			await this.logRecoveryFailure(strategyName, recoveryError, error, context)
			return this.executeFallbackChain(error, context, classification)
		}
	}

	private initializeStrategies(): void {
		// Retry with exponential backoff
		this.strategies.set(
			"retry_with_backoff",
			new ExponentialBackoffRetry({
				maxRetries: 3,
				initialDelay: 1000,
				maxDelay: 30000,
				multiplier: 2,
				jitter: true,
			}),
		)

		// Circuit breaker pattern
		this.strategies.set(
			"circuit_breaker",
			new CircuitBreaker({
				failureThreshold: 5,
				recoveryTimeout: 60000,
				monitoringPeriod: 10000,
			}),
		)

		// Tool fallback
		this.strategies.set(
			"tool_fallback",
			new ToolFallback({
				fallbackTools: this.getAlternativeTools(),
				fallbackStrategy: "similar_functionality",
			}),
		)

		// Graceful degradation
		this.strategies.set(
			"graceful_degradation",
			new GracefulDegradation({
				degradationLevels: ["full", "partial", "minimal"],
				currentLevel: "full",
			}),
		)
	}

	private initializeFallbackChain(): void {
		// Fallback chain in order of preference
		this.fallbackChain = [
			new RetryWithDifferentParameters(),
			new UseAlternativeTool(),
			new SkipOperation(),
			new AbortWithUserNotification(),
		]
	}
}
```

**Key Takeaways**:

- Multiple recovery strategies with fallback chain
- Circuit breaker pattern for repeated failures
- Tool-specific fallback mechanisms
- Graceful degradation options

### Best Practice Example 3: Tool-Specific Error Recovery

**Source**: https://github.com/langchain-ai/langchainjs  
**Stars**: 12,000+ | **Language**: TypeScript

```typescript
// Tool-specific error recovery implementation
class ToolErrorHandler {
	private toolRecoveryHandlers: Map<string, ToolRecoveryHandler> = new Map()
	private generalRecoveryHandler: GeneralRecoveryHandler

	constructor() {
		this.generalRecoveryHandler = new GeneralRecoveryHandler()
		this.initializeToolSpecificHandlers()
	}

	async handleToolError(toolName: string, error: Error, context: ToolExecutionContext): Promise<ToolErrorResult> {
		const handler = this.toolRecoveryHandlers.get(toolName)

		if (handler) {
			try {
				return await handler.handle(error, context)
			} catch (handlerError) {
				// Fall back to general handler if tool-specific handler fails
				return await this.generalRecoveryHandler.handle(toolName, error, context)
			}
		} else {
			return await this.generalRecoveryHandler.handle(toolName, error, context)
		}
	}

	private initializeToolSpecificHandlers(): void {
		// File operation tools
		this.toolRecoveryHandlers.set(
			"write_to_file",
			new FileOperationRecovery({
				backupStrategy: "create_backup",
				retryStrategy: "retry_with_different_path",
				fallbackStrategy: "write_to_temp_location",
			}),
		)

		this.toolRecoveryHandlers.set(
			"read_file",
			new FileOperationRecovery({
				backupStrategy: "use_cache_if_available",
				retryStrategy: "retry_with_permissions_check",
				fallbackStrategy: "request_manual_input",
			}),
		)

		// Command execution tools
		this.toolRecoveryHandlers.set(
			"execute_command",
			new CommandExecutionRecovery({
				shellFallback: true,
				alternativeCommands: this.getAlternativeCommands(),
				safetyChecks: true,
			}),
		)

		// MCP tools
		this.toolRecoveryHandlers.set(
			"use_mcp_tool",
			new McpToolRecovery({
				serverReconnect: true,
				toolRediscovery: true,
				fallbackToSimilarTools: true,
			}),
		)
	}
}

// File operation specific recovery
class FileOperationRecovery implements ToolRecoveryHandler {
	async handle(error: Error, context: ToolExecutionContext): Promise<ToolErrorResult> {
		const classification = this.classifyFileError(error)

		switch (classification.type) {
			case "permission_denied":
				return this.handlePermissionError(error, context)

			case "file_not_found":
				return this.handleFileNotFound(error, context)

			case "disk_full":
				return this.handleDiskFull(error, context)

			case "path_too_long":
				return this.handlePathTooLong(error, context)

			default:
				return this.handleGenericFileError(error, context)
		}
	}

	private async handlePermissionError(error: Error, context: ToolExecutionContext): Promise<ToolErrorResult> {
		// Try to fix permissions
		try {
			await this.attemptPermissionFix(context.parameters.path)

			// Retry the operation
			const result = await this.retryOperation(context)

			return {
				success: true,
				result,
				recoveryAction: "permission_fix_and_retry",
				message: "Fixed file permissions and retried operation",
			}
		} catch (fixError) {
			return {
				success: false,
				error: fixError,
				recoveryAction: "permission_fix_failed",
				suggestion: "Check file permissions or run with elevated privileges",
			}
		}
	}
}
```

**Key Takeaways**:

- Tool-specific recovery handlers
- General fallback for unknown tools
- Detailed error classification per tool type
- Multiple recovery attempts with different strategies

## 3. Internal Knowledge Base (Memory)

### Cached Knowledge

**Topic**: "Error handling and recovery mechanisms for tool execution"
**Entity Type**: "Implementation Pattern"
**Last Used**: 2025-11-11T20:50:19.872Z
**Content**: [Previously saved best practices for comprehensive error recovery]

### Related Memories

- **Entity**: "ErrorHandler"

    - **Relevance**: Existing error handling infrastructure can be extended
    - **Content**: Current error categorization and recovery strategy patterns

- **Entity**: "FileRecovery"

    - **Relevance**: File-specific recovery patterns can be generalized
    - **Content**: File operation recovery with backup strategies

- **Entity**: "RetryEngine"
    - **Relevance**: Existing retry mechanisms can be integrated
    - **Content**: Retry logic with backoff and circuit breaker patterns

## 4. Suggested Implementation Plan

### Prerequisites

1. [ ] Review existing ErrorHandler functionality
2. [ ] Analyze current retry mechanisms
3. [ ] Understand tool-specific error patterns

### Implementation Steps

1. [ ] **Create ErrorClassifier.ts**

    - **Purpose**: Advanced error classification for LangChain tools
    - **Location**: `src/recovery/ErrorClassifier.ts`
    - **Key Methods**:
        - `classifyError()`: Main classification method
        - `detectErrorPattern()`: Pattern matching for known errors
        - `calculateConfidence()`: Confidence scoring for classifications
        - `getRecoveryStrategy()`: Map classification to recovery strategy

2. [ ] **Create RecoveryStrategy.ts**

    - **Purpose**: Comprehensive recovery strategy implementation
    - **Location**: `src/recovery/RecoveryStrategy.ts`
    - **Key Methods**:
        - `executeRecovery()`: Main recovery orchestration
        - `initializeStrategies()`: Setup recovery handlers
        - `executeFallbackChain()\*\*: Fallback chain execution
        - `logRecoveryResult()\*\*: Recovery outcome tracking

3. [ ] **Create ToolErrorHandler.ts**

    - **Purpose**: Tool-specific error handling and recovery
    - **Location**: `src/recovery/ToolErrorHandler.ts`
    - **Key Methods**:
        - `handleToolError()`: Main error handling method
        - `initializeToolHandlers()\*\*: Tool-specific recovery setup
        - `getToolSpecificHandler()\*\*: Handler lookup
        - `fallbackToGeneralHandler()\*\*: General error handling

4. [ ] **Modify ErrorHandler.ts Integration**
    - **File**: `src/core/condense/error-handler.ts`
    - **Purpose**: Integrate with new recovery system
    - **Changes**:
        - Add tool-specific error handling integration
        - Extend error categorization for LangChain tools
        - Provide recovery strategy delegation
        - Maintain backward compatibility with existing error handling

### Validation Steps

1. [ ] Test error classification accuracy
2. [ ] Verify recovery strategy execution
3. [ ] Test tool-specific recovery handlers
4. [ ] Validate fallback chain functionality
5. [ ] Test integration with existing ErrorHandler

### Testing Strategy

1. [ ] **Unit Tests**: Test each recovery component

    - Mock various error types and scenarios
    - Verify classification accuracy
    - Test recovery strategy execution

2. [ ] **Integration Tests**: Test with real tool executions

    - Verify end-to-end error handling flow
    - Test with LangChain tool wrappers
    - Validate recovery outcome tracking

3. [ ] **Edge Case Tests**: Test unusual error scenarios
    - Unknown error types
    - Multiple concurrent errors
    - Recovery strategy failures

## 5. Dependencies

### Task Dependencies

- [ ] **Task 3.1**: LangGraph tool execution bridge must be implemented

    - **Reason**: Error handling needs to integrate with bridge execution
    - **Status**: ☐ To Do

- [ ] **Task 3.4**: Tool execution monitoring must be established
    - **Reason**: Error handling should integrate with monitoring system
    - **Status**: ☐ To Do

### File Dependencies

- [ ] **File `src/core/condense/error-handler.ts`**: Must be modified

    - **Reason**: Existing error handling infrastructure integration point
    - **Status**: ✅ Exists

- [ ] **File `src/core/condense/file-recovery.ts`**: Recovery patterns reference

    - **Reason**: Existing recovery patterns can be generalized
    - **Status**: ✅ Exists

- [ ] **File `src/core/tools/retry/RetryEngine.ts`**: Retry mechanism integration
    - **Reason**: Existing retry logic can be leveraged
    - **Status**: ✅ Exists

### External Dependencies

- [ ] **Package `@langchain/core`**: Required for LangChain tool error types
- [ ] **Package `@langchain/langgraph`**: Required for LangGraph error handling
- [ ] **Existing error patterns**: Current error classification patterns

## 6. Notes and Warnings

### Important Considerations

1. **Backward Compatibility**: Must maintain existing error handling during transition
2. **Recovery Reliability**: Recovery strategies must be thoroughly tested
3. **Performance Impact**: Error handling should not significantly impact performance
4. **User Experience**: Recovery actions should be transparent to users when possible
5. **Logging**: All recovery actions must be properly logged for debugging

### Potential Issues

1. **Complex Error Scenarios**: Multiple simultaneous errors may be difficult to handle
2. **Recovery Failures**: Recovery strategies themselves may fail
3. **Infinite Loops**: Poorly designed recovery may cause infinite retry loops
4. **Tool Compatibility**: Different tools may require incompatible recovery strategies

### Breaking Changes

- **Minimal**: This is additive error handling functionality
- **Integration**: Existing ErrorHandler interface must be preserved
- **Configuration**: May need feature flags for gradual rollout

---

**Context Generated By**: context-engineer agent
**Review Status**: Pending Review
**Reviewer**: code agent
