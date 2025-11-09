# Sub-Sprint 3: Error Classification

## Objective

To implement intelligent error classification and context optimization systems that can identify different types of tool call failures and apply appropriate retry strategies, including dynamic context management for context-related errors.

## Parent Sprint

PRD 3, Sprint 3: Error Classification

## Tasks

1. **Error Classification System**

    - Create error type detection and categorization
    - Implement pattern matching for error messages and codes
    - Build retryable vs permanent error determination logic
    - Create error classification rule engine
    - Add custom classification rule support for different tools

2. **Context Optimization Engine**

    - Implement context window analysis and monitoring
    - Create intelligent context compression algorithms
    - Build context element importance ranking
    - Implement context preservation strategies
    - Add context restoration capabilities after failed retries

3. **Retry Strategy Selection**

    - Create strategy mapping for different error types
    - Implement context reduction strategy for token limit errors
    - Build parameter adjustment strategy for invalid input errors
    - Create delay and retry strategy for rate limiting errors
    - Add fallback strategy for unknown error types

4. **Error-Specific Handling**

    - Implement rate limit detection and backoff adjustment
    - Create token limit error handling with context optimization
    - Build network error handling with connection retry
    - Add authentication error handling with credential refresh
    - Implement timeout error handling with adjusted timeouts

## Acceptance Criteria

- Error classifier accurately identifies retryable vs permanent errors
- Context optimizer reduces context size while preserving critical information
- Different retry strategies are applied based on error classification
- Rate limits are detected and respected during retry attempts
- Context optimization improves success rate for token limit errors
- System gracefully handles unknown or malformed errors

## Dependencies

- Retry engine from Sub-Sprint 2
- Context management system integration
- Error handling framework and logging
- Tool call execution pipeline
- Settings system for classification rules

## Timeline

- **Start Date**: 2025-11-25
- **End Date**: 2025-12-01

## Deliverables

- Error classification system with full functionality
- Context optimization engine with intelligent algorithms
- Retry strategy selection and execution system
- Error-specific handling implementations
- Integration tests for error classification workflows
- Documentation for error types and handling strategies

## Risks

- Error classification may misidentify error types
- Context optimization may remove critical information
- Retry strategies may not be optimal for all error types
- Rate limit detection may be inaccurate or incomplete
- Context optimization may be too slow for real-time use

## Mitigations

- Comprehensive testing with real error scenarios
- Conservative context optimization with user override options
- Configurable retry strategies with learning capabilities
- Multiple rate limit detection methods and fallbacks
- Performance optimization and caching for context operations

## Context Management Integration

### Integration with Existing System

The context optimizer MUST integrate with the existing [`truncateConversationIfNeeded`](src/core/sliding-window/index.ts:102) function from `src/core/sliding-window/index.ts`. This integration ensures compatibility with the established context management infrastructure and prevents duplicate implementation.

**Key Integration Requirements:**

- **Dual History Synchronization**: Retry attempts MUST synchronize both [`apiConversationHistory`](src/core/task/Task.ts:257) and [`clineMessages`](src/core/task/Task.ts:258) to maintain consistency between UI and API-facing histories
- **Context Preservation**: Critical context elements MUST be preserved during optimization to prevent loss of essential information
- **Memory Management**: Efficient retry state management that prevents exponential context growth during multiple retry attempts
- **Error Detection**: Integration with existing [`handleContextWindowExceededError`](src/core/task/Task.ts:2652) method and [`MAX_CONTEXT_WINDOW_RETRIES`](src/core/task/Task.ts:124) constant

### Enhanced Context Management Architecture

#### Context State Manager Implementation

```typescript
interface ContextStateManager {
	// Track context state across retry attempts
	trackContextState(originalContext: ContextData): ContextState

	// Monitor for exponential growth during retries
	detectExponentialGrowth(state: ContextState): boolean

	// Trigger aggressive cleanup when thresholds exceeded
	performAggressiveCleanup(state: ContextState): Promise<void>

	// Synchronize dual message histories
	synchronizeHistories(optimizedContext: ContextData): Promise<void>

	// Validate context integrity after optimization
	validateContextIntegrity(context: ContextData): ValidationResult
}

class RetryContextStateManager implements ContextStateManager {
	private readonly GROWTH_THRESHOLD = 1.5 // 50% growth triggers cleanup
	private readonly MAX_RETRY_COUNT = 5 // Maximum retries before aggressive cleanup
	private readonly MEMORY_LIMIT_MB = 10 // Maximum additional memory for context

	async synchronizeHistories(optimizedContext: ContextData): Promise<void> {
		// 1. Update apiConversationHistory with optimized context
		await this.task.overwriteApiConversationHistory(optimizedContext.messages)

		// 2. Synchronize clineMessages to maintain UI consistency
		await this.task.saveClineMessages()

		// 3. Validate synchronization success
		const syncStatus = await this.validateSynchronization()
		if (!syncStatus.success) {
			throw new Error(`Context synchronization failed: ${syncStatus.error}`)
		}
	}

	async performAggressiveCleanup(state: ContextState): Promise<void> {
		// 1. Force aggressive context reduction using existing system
		const truncationResult = await truncateConversationIfNeeded({
			messages: this.task.apiConversationHistory,
			totalTokens: state.currentContextSize * 0.6, // Aggressive reduction
			maxTokens: this.calculateAggressiveLimit(state),
			preserveCritical: true,
		})

		// 2. Clear non-essential metadata
		await this.clearNonEssentialMetadata()

		// 3. Reset optimization history
		state.optimizationHistory = []

		// 4. Trigger garbage collection if available
		if (global.gc) {
			global.gc()
		}
	}
}
```

#### Context Preservation Strategy Implementation

```typescript
interface ContextPreservationStrategy {
	// Define critical context elements that MUST be preserved
	identifyCriticalElements(context: ContextData): CriticalElement[]

	// Calculate importance scores for context elements
	calculateImportance(element: ContextElement, error: Error): ImportanceScore

	// Apply preservation rules during optimization
	applyPreservationRules(elements: ContextElement[], targetSize: number): ContextData
}

class RetryContextPreservationStrategy implements ContextPreservationStrategy {
	identifyCriticalElements(context: ContextData): CriticalElement[] {
		return context.elements.filter(
			(element) =>
				element.category === "user_input" || // Highest priority
				element.category === "system_prompt" || // High priority
				element.category === "current_task_context" || // Highest priority
				(element.category === "tool_result" && element.isRecent), // Medium-high priority
		)
	}

	applyPreservationRules(elements: ContextElement[], targetSize: number): ContextData {
		// 1. Separate critical and non-critical elements
		const criticalElements = this.identifyCriticalElements({ elements } as ContextData)
		const nonCriticalElements = elements.filter((el) => !criticalElements.includes(el))

		// 2. Always preserve critical elements
		let preservedElements = [...criticalElements]
		let currentSize = this.calculateTokens(preservedElements)

		// 3. Add non-critical elements based on importance until target reached
		const sortedNonCritical = nonCriticalElements.sort(
			(a, b) => this.calculateImportance(b, null).score - this.calculateImportance(a, null).score,
		)

		for (const element of sortedNonCritical) {
			if (currentSize + element.tokens <= targetSize) {
				preservedElements.push(element)
				currentSize += element.tokens
			} else {
				break
			}
		}

		return {
			elements: preservedElements,
			totalTokens: currentSize,
			preservationRatio: preservedElements.length / elements.length,
		}
	}
}
```

### Integration with Existing Error Handling

#### Enhanced Error Classification Integration

```typescript
class EnhancedErrorClassifier extends ErrorClassifier {
	constructor(
		private contextStateManager: ContextStateManager,
		private task: Task,
	) {
		super()
	}

	async classifyAndHandleError(error: Error, toolCall: ToolCall): Promise<ErrorClassification> {
		// 1. Perform standard classification
		const classification = await super.classifyError(error, toolCall)

		// 2. Add context-specific handling for retryable errors
		if (classification.errorType === "context_window_exceeded") {
			return this.handleContextWindowExceeded(error, classification)
		}

		if (classification.errorType === "token_limit_exceeded") {
			return this.handleTokenLimitExceeded(error, classification)
		}

		return classification
	}

	private async handleContextWindowExceeded(
		error: Error,
		baseClassification: ErrorClassification,
	): Promise<ErrorClassification> {
		// 1. Check if we've exceeded MAX_CONTEXT_WINDOW_RETRIES
		const retryCount = this.contextStateManager.getCurrentRetryCount()

		if (retryCount >= MAX_CONTEXT_WINDOW_RETRIES) {
			return {
				...baseClassification,
				errorType: "context_corruption",
				retryStrategy: "manual",
				maxRetries: 0,
				userAction: "Maximum context window retries exceeded, manual intervention required",
				requiresHistorySync: true,
			}
		}

		// 2. Integrate with existing handleContextWindowExceededError
		await this.task.handleContextWindowExceededError(error)

		// 3. Update context state
		await this.contextStateManager.updateContextState({
			errorType: "context_window_exceeded",
			retryCount: retryCount + 1,
			timestamp: new Date(),
		})

		return {
			...baseClassification,
			contextOptimizationLevel: "aggressive",
			requiresHistorySync: true,
		}
	}
}
```

### Context Preservation Strategy

**Critical Context Elements (MUST Preserve):**

- **User Input Messages** (Highest Priority) - Always preserved, never truncated
- **System Prompts and Instructions** (High Priority) - Preserve when possible, essential for maintaining task context
- **Recent Tool Results** (Medium-High Priority) - Prioritize recent results, summarize older ones if needed
- **Current Task Context** (Highest Priority) - Essential for maintaining task continuity
- **Error Context** (High Priority) - Preserve error information for debugging and retry logic

**Removable Context Elements (Low Priority):**

- **Metadata** - Can be removed first if context space is needed
- **Old Conversation History** - Can be summarized or truncated after multiple exchanges
- **Duplicate Information** - Redundant data can be safely removed
- **Debug Information** - Non-essential debug logs can be removed

### Memory Management for Retry State

**Context State Tracking:**

```typescript
interface ContextState {
	originalContextSize: number
	currentContextSize: number
	retryCount: number
	lastOptimization: Date
	memoryUsage: number
	optimizationHistory: ContextOptimizationResult[]
	exponentialGrowthDetected: boolean
}

class ContextStateManager {
	private state: ContextState
	private readonly GROWTH_THRESHOLD = 1.5 // 50% growth triggers cleanup
	private readonly MAX_RETRY_COUNT = 5 // Maximum retries before aggressive cleanup

	updateContextSize(newSize: number): void {
		this.state.currentContextSize = newSize
		this.state.retryCount++

		// Monitor for exponential growth
		if (
			this.state.retryCount > this.MAX_RETRY_COUNT &&
			newSize > this.state.originalContextSize * this.GROWTH_THRESHOLD
		) {
			this.state.exponentialGrowthDetected = true
			this.performAggressiveCleanup()
		}
	}

	performAggressiveCleanup(): void {
		// Implement efficient cleanup strategy
		// 1. Force aggressive context reduction
		// 2. Clear non-essential metadata
		// 3. Reset optimization history
		// 4. Trigger memory garbage collection
	}
}
```

## Technical Implementation Details

### Error Classification Architecture

```typescript
interface ErrorClassification {
	errorType:
		| "retryable"
		| "permanent"
		| "context"
		| "rate_limit"
		| "network"
		| "auth"
		| "timeout"
		| "unknown"
		| "context_window_exceeded"
		| "token_limit_exceeded"
		| "context_truncation"
		| "context_corruption"
	retryStrategy: "immediate" | "backoff" | "context_optimize" | "parameter_adjust" | "credential_refresh" | "manual"
	maxRetries: number
	contextOptimization: boolean
	userAction: string
	confidence: number
	contextOptimizationLevel?: "conservative" | "aggressive" | "minimal"
	requiresHistorySync: boolean
}

class ErrorClassifier {
	private classificationRules: ClassificationRule[]
	private patternMatchers: PatternMatcher[]
	private toolSpecificRules: Map<string, ClassificationRule[]>

	classifyError(error: Error, toolCall: ToolCall): ErrorClassification {
		// Multi-stage classification process
		const toolSpecificResult = this.classifyByTool(error, toolCall)
		if (toolSpecificResult.confidence > 0.8) {
			return toolSpecificResult
		}

		const patternResult = this.classifyByPattern(error)
		if (patternResult.confidence > 0.7) {
			return patternResult
		}

		// Check for context-specific errors first
		const contextErrorResult = this.classifyContextError(error)
		if (contextErrorResult) {
			return contextErrorResult
		}

		return this.classifyByDefault(error)
	}

	private classifyContextError(error: Error): ErrorClassification | null {
		// Integration with existing context window error detection
		if (this.isContextWindowExceededError(error)) {
			return {
				errorType: "context_window_exceeded",
				retryStrategy: "context_optimize",
				maxRetries: 3, // Use existing MAX_CONTEXT_WINDOW_RETRIES
				contextOptimization: true,
				userAction: "Context window exceeded, applying optimization...",
				confidence: 0.95,
				contextOptimizationLevel: "aggressive",
				requiresHistorySync: true,
			}
		}

		// Check for token limit errors
		if (this.isTokenLimitError(error)) {
			return {
				errorType: "token_limit_exceeded",
				retryStrategy: "context_optimize",
				maxRetries: 3,
				contextOptimization: true,
				userAction: "Token limit exceeded, reducing context...",
				confidence: 0.9,
				contextOptimizationLevel: "conservative",
				requiresHistorySync: true,
			}
		}

		// Check for context truncation errors
		if (this.isContextTruncationError(error)) {
			return {
				errorType: "context_truncation",
				retryStrategy: "context_optimize",
				maxRetries: 2,
				contextOptimization: true,
				userAction: "Context truncation detected, restoring context...",
				confidence: 0.85,
				contextOptimizationLevel: "minimal",
				requiresHistorySync: true,
			}
		}

		// Check for context corruption errors
		if (this.isContextCorruptionError(error)) {
			return {
				errorType: "context_corruption",
				retryStrategy: "manual",
				maxRetries: 1,
				contextOptimization: false,
				userAction: "Context corruption detected, manual intervention required",
				confidence: 0.9,
				requiresHistorySync: true,
			}
		}

		return null
	}

	private isContextWindowExceededError(error: Error): boolean {
		// Should integrate with existing checkContextWindowExceededError from Task.ts
		const errorMessage = error.message.toLowerCase()
		const errorStack = error.stack?.toLowerCase() || ""

		// Common context window exceeded error patterns
		const contextWindowPatterns = [
			"context window exceeded",
			"maximum context length",
			"too many tokens",
			"context length exceeded",
			"token limit exceeded",
			"context too large",
		]

		return contextWindowPatterns.some((pattern) => errorMessage.includes(pattern) || errorStack.includes(pattern))
	}

	private isTokenLimitError(error: Error): boolean {
		const errorMessage = error.message.toLowerCase()
		const tokenLimitPatterns = [
			"token limit",
			"maximum tokens",
			"token limit exceeded",
			"too many tokens",
			"rate limit",
			"quota exceeded",
		]

		return tokenLimitPatterns.some((pattern) => errorMessage.includes(pattern))
	}

	private isContextTruncationError(error: Error): boolean {
		const errorMessage = error.message.toLowerCase()
		const truncationPatterns = [
			"context truncated",
			"truncation",
			"context was truncated",
			"conversation truncated",
			"partial context",
		]

		return truncationPatterns.some((pattern) => errorMessage.includes(pattern))
	}

	private isContextCorruptionError(error: Error): boolean {
		const errorMessage = error.message.toLowerCase()
		const corruptionPatterns = [
			"context corruption",
			"malformed context",
			"invalid context",
			"context parsing error",
			"context structure error",
		]

		return corruptionPatterns.some((pattern) => errorMessage.includes(pattern))
	}

	private classifyByTool(error: Error, toolCall: ToolCall): ErrorClassification {
		// Tool-specific classification logic
	}

	private classifyByPattern(error: Error): ErrorClassification {
		// Pattern matching classification logic
	}

	private classifyByDefault(error: Error): ErrorClassification {
		// Default classification logic
	}
}
```

### Pattern Matching System

```typescript
interface ClassificationRule {
	id: string
	pattern: RegExp | string
	errorType: ErrorType
	retryStrategy: RetryStrategy
	maxRetries: number
	contextOptimization: boolean
	priority: number
}

class PatternMatcher {
	private rules: ClassificationRule[]

	matchError(error: Error): ErrorClassification | null {
		for (const rule of this.rules.sort((a, b) => b.priority - a.priority)) {
			if (this.matchesPattern(error, rule.pattern)) {
				return this.createClassificationFromRule(rule, error)
			}
		}
		return null
	}

	private matchesPattern(error: Error, pattern: RegExp | string): boolean {
		const errorMessage = error.message.toLowerCase()
		const errorStack = error.stack?.toLowerCase() || ""

		if (pattern instanceof RegExp) {
			return pattern.test(errorMessage) || pattern.test(errorStack)
		} else {
			return errorMessage.includes(pattern.toLowerCase()) || errorStack.includes(pattern.toLowerCase())
		}
	}

	private createClassificationFromRule(rule: ClassificationRule, error: Error): ErrorClassification {
		return {
			errorType: rule.errorType,
			retryStrategy: rule.retryStrategy,
			maxRetries: rule.maxRetries,
			contextOptimization: rule.contextOptimization,
			userAction: this.generateUserAction(rule.errorType),
			confidence: 0.9,
		}
	}
}
```

### Context Optimization Engine

```typescript
interface ContextElement {
	id: string
	content: string
	importance: number
	category: "user_input" | "system_prompt" | "tool_result" | "conversation_history" | "metadata"
	tokens: number
	timestamp: Date
}

interface ContextOptimizationResult {
	optimizedContext: string
	removedElements: ContextElement[]
	preservedElements: ContextElement[]
	tokenReduction: number
	importancePreserved: number
}

class ContextOptimizer {
	private importanceCalculator: ImportanceCalculator
	private compressionStrategy: CompressionStrategy

	async optimizeContext(
		originalContext: string,
		targetTokenCount: number,
		error: Error,
	): Promise<ContextOptimizationResult> {
		const elements = this.parseContext(originalContext)
		const importanceScores = await this.calculateImportance(elements, error)
		const optimizedElements = this.selectElements(elements, importanceScores, targetTokenCount)

		return this.buildOptimizedContext(elements, optimizedElements)
	}

	private parseContext(context: string): ContextElement[] {
		// Parse context into structured elements
	}

	private async calculateImportance(elements: ContextElement[], error: Error): Promise<Map<string, number>> {
		// Calculate importance scores for each element
	}

	private selectElements(
		elements: ContextElement[],
		importanceScores: Map<string, number>,
		targetTokenCount: number,
	): ContextElement[] {
		// Select elements to preserve based on importance and token constraints
	}

	private buildOptimizedContext(
		originalElements: ContextElement[],
		preservedElements: ContextElement[],
	): ContextOptimizationResult {
		// Build optimized context and return result metadata
	}
}
```

### Retry Strategy Implementation

```typescript
interface RetryStrategy {
	name: string
	execute(
		toolCall: ToolCall,
		error: Error,
		attempt: number,
		classification: ErrorClassification,
	): Promise<ToolCallResult>
}

class ContextOptimizeStrategy implements RetryStrategy {
	name = "context_optimize"

	constructor(
		private contextOptimizer: ContextOptimizer,
		private retryEngine: RetryEngine,
	) {}

	async execute(
		toolCall: ToolCall,
		error: Error,
		attempt: number,
		classification: ErrorClassification,
	): Promise<ToolCallResult> {
		const optimizedContext = await this.contextOptimizer.optimizeContext(
			toolCall.context,
			this.calculateTargetTokenCount(error),
			error,
		)

		const optimizedToolCall = {
			...toolCall,
			context: optimizedContext.optimizedContext,
		}

		return this.retryEngine.executeAttempt(optimizedToolCall, attempt)
	}

	private calculateTargetTokenCount(error: Error): number {
		// Calculate target token count based on error details
	}
}

class ParameterAdjustStrategy implements RetryStrategy {
	name = "parameter_adjust"

	async execute(
		toolCall: ToolCall,
		error: Error,
		attempt: number,
		classification: ErrorClassification,
	): Promise<ToolCallResult> {
		const adjustedParameters = this.adjustParameters(toolCall.parameters, error)

		const adjustedToolCall = {
			...toolCall,
			parameters: adjustedParameters,
		}

		return this.retryEngine.executeAttempt(adjustedToolCall, attempt)
	}

	private adjustParameters(parameters: any, error: Error): any {
		// Adjust parameters based on error type and message
	}
}
```

## Error Type Classifications

### Retryable Errors

- **Network Errors**: Temporary connectivity issues, DNS failures
- **Rate Limit Errors**: API rate limits, throttling responses
- **Timeout Errors**: Operation timeouts, slow responses
- **Server Errors**: 5xx HTTP status codes, service unavailable

### Permanent Errors

- **Authentication Errors**: Invalid credentials, expired tokens
- **Authorization Errors**: Insufficient permissions, access denied
- **Validation Errors**: Invalid parameters, malformed requests
- **Not Found Errors**: Resource not found, invalid endpoints

### Context-Related Errors

- **Token Limit Errors**: Context window exceeded, token limits
- **Context Truncation**: Important context lost during processing
- **Context Corruption**: Malformed context data

## Context Optimization Strategies

### Importance-Based Selection

- **User Input**: Highest importance, always preserved
- **System Prompts**: High importance, preserve when possible
- **Recent Tool Results**: Medium-high importance, prioritize recent
- **Conversation History**: Medium importance, summarize older parts
- **Metadata**: Low importance, remove first if needed

### Compression Techniques

- **Summarization**: Compress conversation history while preserving key points
- **Truncation**: Remove least important elements from context
- **Reorganization**: Reorder context for better token efficiency
- **Deduplication**: Remove redundant or duplicate information

## Performance Considerations

### Classification Performance

- Optimize pattern matching for fast error classification
- Cache classification results for common error types
- Use efficient string matching algorithms
- Minimize computational overhead for classification

### Context Optimization Performance

- Implement incremental context optimization
- Use streaming algorithms for large context processing
- Cache importance calculations for repeated elements
- Optimize token counting and context parsing

## Testing Strategy

### Error Classification Tests

- Test classification accuracy with real error scenarios
- Verify pattern matching for various error formats
- Test tool-specific classification rules
- Validate confidence scoring and threshold handling

### Context Optimization Tests

- Test context reduction while preserving critical information
- Verify importance calculation accuracy
- Test optimization performance with large contexts
- Validate context restoration capabilities

### Integration Tests

- End-to-end error classification and retry workflow
- Context optimization during actual retry attempts
- Performance under various error conditions
- Integration with different tool types and APIs

## Success Metrics

- **Classification Accuracy**: > 90% accurate error classification
- **Context Optimization Success**: > 80% success rate for token limit errors
- **Retry Strategy Effectiveness**: > 85% success rate for applied strategies
- **Performance Impact**: < 100ms additional latency for classification
- **Context Preservation**: > 95% of critical context elements preserved
