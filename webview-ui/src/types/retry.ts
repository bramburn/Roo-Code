/**
 * Retry mechanism types for the webview-ui
 */

export interface RetryState {
	id: string
	toolName: string
	currentAttempt: number
	maxAttempts: number
	startTime: number
	lastAttemptTime: number
	nextRetryTime: number
	originalError: string
	errors: string[]
	currentDelay: number
	isActive: boolean
	isCancelled: boolean
}

export interface RetrySettings {
	enabled: boolean
	maxAttempts: number
	baseDelay: number
	maxDelay: number
	backoffStrategy: "exponential" | "linear" | "fixed"
	jitterFactor: number
	circuitBreakerThreshold: number
	circuitBreakerResetTime: number
	contextOptimizationEnabled: boolean
	contextOptimizationThreshold: number
}

export interface ErrorClassification {
	isRetryable: boolean
	category: "network" | "timeout" | "rate_limit" | "auth" | "permission" | "resource" | "parsing" | "unknown"
	severity: "low" | "medium" | "high" | "critical"
	backoffStrategy: "exponential" | "linear" | "fixed"
	message: string
	triggerCircuitBreaker?: boolean
}

export interface RetryMetrics {
	totalRetries: number
	successfulRetries: number
	failedRetries: number
	averageAttempts: number
	totalRetryTime: number
	circuitBreakerActivations: number
	contextOptimizations: number
	toolSpecificMetrics: Record<
		string,
		{
			attempts: number
			successes: number
			failures: number
			averageTime: number
		}
	>
}

export interface RetryNotification {
	id: string
	type: "retry-started" | "retry-progress" | "retry-success" | "retry-failed" | "retry-cancelled"
	retryId: string
	toolName: string
	message: string
	timestamp: number
	data?: any
}

export type RetryStatusVariant = "default" | "compact" | "minimal"

export interface RetryStatusProps {
	retryState?: RetryState
	variant?: RetryStatusVariant
	showDetails?: boolean
	className?: string
}

export interface RetrySettingsProps {
	settings: RetrySettings
	onSettingsChange: (settings: RetrySettings) => void
	className?: string
}

export interface ErrorRecoveryProps {
	retryState?: RetryState
	errorClassification?: ErrorClassification
	toolName: string
	originalError: string
	contextOptimizationAvailable?: boolean
	className?: string
}

export interface RetryLogEntry {
	id: string
	retryId: string
	timestamp: number
	level: "info" | "warn" | "error" | "debug"
	message: string
	data?: any
}

export interface RetryHistory {
	retryId: string
	toolName: string
	startTime: number
	endTime: number
	status: "success" | "failed" | "cancelled"
	attempts: number
	errors: string[]
	finalError?: string
}
