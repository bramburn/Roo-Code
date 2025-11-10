import type { RetrySettings } from "@roo-code/types"

// Re-export RetrySettings for local use
export { RetrySettings }

// Additional exports for test files
export interface RetryExecution {
	execute: (params: Record<string, any>) => Promise<any>
	result: any
	error?: Error
	duration?: number
}

export interface RetryResult {
	success: boolean
	data?: any
	error?: Error
	attempts?: number
}

export interface MessageHistory {
	messages: Array<{
		id: string
		role: string
		content: string
		timestamp: number
	}>
	apiHistory: Array<{
		id: string
		role: string
		content: string
		timestamp: number
	}>
	clineHistory: Array<{
		id: string
		role: string
		content: string
		timestamp: number
	}>
}

/**
 * Retry state for tracking individual retry attempts
 */
export interface RetryState {
	/** Unique identifier for this retry attempt */
	id: string
	/** Tool name being retried */
	toolName: string
	/** Current attempt number (0-based) */
	currentAttempt: number
	/** Maximum number of attempts allowed */
	maxAttempts: number
	/** Timestamp when retry started */
	startTime: number
	/** Timestamp of last attempt */
	lastAttemptTime: number
	/** Next retry timestamp */
	nextRetryTime: number
	/** Original error that triggered retry */
	originalError: Error
	/** All errors encountered during retry attempts */
	errors: Error[]
	/** Current backoff delay in milliseconds */
	currentDelay: number
	/** Whether this retry is currently active */
	isActive: boolean
	/** Whether this retry has been cancelled */
	isCancelled: boolean
	/** Additional metadata for the retry */
	metadata?: Record<string, any>
}

/**
 * Retry attempt result
 */
export interface RetryAttempt {
	/** Attempt number (1-based) */
	attempt: number
	/** Timestamp when attempt started */
	timestamp: number
	/** Delay before this attempt in milliseconds */
	delay: number
	/** Result of the attempt */
	result: RetryAttemptResult
	/** Error if attempt failed */
	error?: Error
	/** Duration of attempt in milliseconds */
	duration?: number
}

/**
 * Result of a retry attempt
 */
export interface RetryAttemptResult {
	/** Whether the attempt was successful */
	success: boolean
	/** Result data if successful */
	data?: any
	/** Whether to retry this attempt */
	shouldRetry: boolean
	/** Reason for not retrying */
	retryReason?: string
}

/**
 * Retry execution context
 */
export interface RetryContext {
	/** Unique identifier for the retry operation */
	id: string
	/** Tool name being executed */
	toolName: string
	/** Original tool parameters */
	toolParams: Record<string, any>
	/** Retry configuration */
	config: RetrySettings
	/** Task identifier */
	taskId?: string
	/** Execution context */
	executionContext?: {
		workingDirectory?: string
		terminalId?: string
		provider?: any
	}
}

/**
 * Circuit breaker state
 */
export type CircuitBreakerState = "closed" | "open" | "half-open"

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
	/** Number of failures before opening circuit */
	failureThreshold: number
	/** Time in milliseconds to wait before transitioning to half-open */
	recoveryTimeout: number
	/** Time in milliseconds for half-open state */
	halfOpenTimeout: number
	/** Number of successful attempts required to close circuit */
	successThreshold: number
}

/**
 * Circuit breaker metrics
 */
export interface CircuitBreakerMetrics {
	/** Total number of requests */
	totalRequests: number
	/** Number of successful requests */
	successfulRequests: number
	/** Number of failed requests */
	failedRequests: number
	/** Current failure rate */
	failureRate: number
	/** Timestamp of last failure */
	lastFailureTime?: number
	/** Timestamp of last success */
	lastSuccessTime?: number
}

/**
 * Backoff strategy configuration
 */
export interface BackoffConfig {
	/** Base delay in milliseconds */
	baseDelay: number
	/** Maximum delay in milliseconds */
	maxDelay: number
	/** Multiplier for exponential backoff */
	multiplier: number
	/** Jitter factor (0-1) */
	jitterFactor: number
	/** Maximum number of attempts */
	maxAttempts: number
}

/**
 * Retry queue item
 */
export interface RetryQueueItem {
	/** Unique identifier */
	id: string
	/** Priority (lower number = higher priority) */
	priority: number
	/** Retry context */
	context: RetryContext
	/** Timestamp when queued */
	queuedAt: number
	/** Callback to execute retry */
	execute: () => Promise<any>
	/** Timeout for this retry attempt */
	timeout?: number
}

/**
 * Retry storage entry
 */
export interface RetryStorageEntry {
	/** Retry state */
	state: RetryState
	/** Timestamp when stored */
	storedAt: number
	/** Expiration timestamp */
	expiresAt: number
	/** Whether this entry is persisted */
	isPersistent: boolean
}

/**
 * Retry log entry
 */
export interface RetryLogEntry {
	/** Unique identifier */
	id: string
	/** Timestamp */
	timestamp: number
	/** Log level */
	level: "debug" | "info" | "warn" | "error"
	/** Retry ID */
	retryId: string
	/** Tool name */
	toolName: string
	/** Message */
	message: string
	/** Additional data */
	data?: Record<string, any>
	/** Attempt number */
	attempt?: number
	/** Error if applicable */
	error?: Error
}

/**
 * Retry statistics
 */
export interface RetryStatistics {
	/** Total number of retry operations */
	totalRetries: number
	/** Number of successful retries */
	successfulRetries: number
	/** Number of failed retries */
	failedRetries: number
	/** Average number of attempts per retry */
	averageAttempts: number
	/** Total time spent in retries */
	totalRetryTime: number
	/** Retry success rate */
	successRate: number
	/** Statistics by tool name */
	byTool: Record<
		string,
		{
			total: number
			successful: number
			failed: number
			averageAttempts: number
			averageTime: number
		}
	>
	/** Circuit breaker statistics */
	circuitBreaker: {
		timesOpened: number
		totalOpenTime: number
		averageOpenTime: number
	}
}

/**
 * Error classification for retry decisions
 */
export interface ErrorClassification {
	/** Whether the error is retryable */
	isRetryable: boolean
	/** Error category */
	category: "network" | "timeout" | "permission" | "resource" | "rate-limit" | "auth" | "unknown"
	/** Severity level */
	severity: "low" | "medium" | "high" | "critical"
	/** Suggested backoff strategy */
	backoffStrategy: "exponential" | "linear" | "fixed" | "immediate"
	/** Maximum retry attempts for this error type */
	maxRetries?: number
	/** Custom delay in milliseconds */
	customDelay?: number
	/** Whether to trigger circuit breaker */
	triggerCircuitBreaker: boolean
}

/**
 * Retry engine events
 */
export interface RetryEngineEvents {
	/** Emitted when a retry starts */
	"retry-start": (context: RetryContext, state: RetryState) => void
	/** Emitted when a retry attempt is made */
	"retry-attempt": (context: RetryContext, attempt: RetryAttempt) => void
	/** Emitted when a retry succeeds */
	"retry-success": (context: RetryContext, result: any, attempts: number) => void
	/** Emitted when a retry fails */
	"retry-failed": (context: RetryContext, error: Error, attempts: number) => void
	/** Emitted when a retry is cancelled */
	"retry-cancelled": (context: RetryContext, reason: string) => void
	/** Emitted when circuit breaker state changes */
	"circuit-breaker-state-change": (
		toolName: string,
		oldState: CircuitBreakerState,
		newState: CircuitBreakerState,
	) => void
	/** Emitted when retry queue is processed */
	"queue-processed": (items: RetryQueueItem[]) => void
}

/**
 * Tool execution wrapper for retry integration
 */
export interface RetryableToolExecution {
	/** Tool name */
	toolName: string
	/** Tool execution function */
	execute: (params: Record<string, any>) => Promise<any>
	/** Tool parameters */
	params: Record<string, any>
	/** Execution context */
	context?: RetryContext["executionContext"]
	/** Custom retry configuration override */
	retryConfig?: Partial<RetrySettings>
}

/**
 * Retry engine configuration
 */
export interface RetryEngineConfig {
	/** Default retry settings */
	defaultSettings: RetrySettings
	/** Maximum number of concurrent retries */
	maxConcurrentRetries: number
	/** Retry queue processing interval in milliseconds */
	queueProcessingInterval: number
	/** Whether to enable persistence */
	enablePersistence: boolean
	/** Storage retention period in milliseconds */
	storageRetentionPeriod: number
	/** Whether to enable detailed logging */
	enableDetailedLogging: boolean
	/** Maximum log entries to keep */
	maxLogEntries: number
}
