import { EventEmitter } from "events"
import * as fs from "fs/promises"
import * as path from "path"
import * as os from "os"

/**
 * Error severity levels
 */
export type ErrorSeverity = "low" | "medium" | "high" | "critical"

/**
 * Error categories for better organization
 */
export type ErrorCategory =
	| "file-system"
	| "network"
	| "permission"
	| "disk-space"
	| "concurrent-access"
	| "stuck-state"
	| "large-file"
	| "validation"
	| "api"
	| "timeout"
	| "unknown"

/**
 * Recovery strategies for different error types
 */
export type RecoveryStrategy = "retry" | "fallback" | "user-action" | "auto-recover" | "graceful-degrade" | "abort"

/**
 * Error context information
 */
export interface ErrorContext {
	component: string
	operation: string
	filepath?: string
	taskId?: string
	timestamp: number
	additionalData?: Record<string, any>
}

/**
 * Standardized error information
 */
export interface ErrorInfo {
	id: string
	category: ErrorCategory
	severity: ErrorSeverity
	message: string
	originalError: Error | string
	context: ErrorContext
	recoveryStrategy: RecoveryStrategy
	canRetry: boolean
	maxRetries: number
	currentRetry: number
	userActionMessage?: string
	technicalDetails?: string
}

/**
 * Error recovery options
 */
export interface RecoveryOption {
	label: string
	action: string
	description: string
	isRecommended?: boolean
	requiresUserInput?: boolean
}

/**
 * Error handler configuration
 */
export interface ErrorHandlerConfig {
	maxRetries: number
	retryDelay: number
	timeoutDuration: number
	enableAutoRecovery: boolean
	logLevel: ErrorSeverity
	enableTelemetry: boolean
}

/**
 * Centralized error handler for context compression components
 * Provides consistent error handling, recovery strategies, and user guidance
 */
export class ErrorHandler extends EventEmitter {
	private readonly config: ErrorHandlerConfig
	private readonly errorLog: ErrorInfo[] = []
	private readonly activeRecoveries = new Map<string, NodeJS.Timeout>()
	private readonly concurrentOperations = new Map<string, number>()
	private readonly stuckStateDetectors = new Map<string, NodeJS.Timeout>()

	constructor(config: Partial<ErrorHandlerConfig> = {}) {
		super()

		this.config = {
			maxRetries: 3,
			retryDelay: 1000,
			timeoutDuration: 5 * 60 * 1000, // 5 minutes
			enableAutoRecovery: true,
			logLevel: "medium",
			enableTelemetry: true,
			...config,
		}
	}

	/**
	 * Handle an error with appropriate recovery strategy
	 */
	async handleError(
		error: Error | string,
		context: ErrorContext,
		category: ErrorCategory = "unknown",
	): Promise<ErrorInfo> {
		const errorInfo = this.createErrorInfo(error, context, category)

		// Log the error
		this.logError(errorInfo)

		// Emit error event for listeners
		this.emit("error", errorInfo)

		// Attempt recovery if enabled
		if (this.config.enableAutoRecovery && errorInfo.canRetry) {
			await this.attemptRecovery(errorInfo)
		}

		return errorInfo
	}

	/**
	 * Create standardized error information
	 */
	private createErrorInfo(error: Error | string, context: ErrorContext, category: ErrorCategory): ErrorInfo {
		const errorMessage = error instanceof Error ? error.message : error
		const errorId = this.generateErrorId()

		// Determine category and recovery strategy
		const { severity, recoveryStrategy, canRetry, userActionMessage } = this.categorizeError(
			error,
			category,
			context,
		)

		return {
			id: errorId,
			category,
			severity,
			message: errorMessage,
			originalError: error,
			context,
			recoveryStrategy,
			canRetry,
			maxRetries: this.config.maxRetries,
			currentRetry: 0,
			userActionMessage,
			technicalDetails: error instanceof Error ? error.stack : undefined,
		}
	}

	/**
	 * Categorize error and determine recovery strategy
	 */
	private categorizeError(
		error: Error | string,
		category: ErrorCategory,
		context: ErrorContext,
	): {
		severity: ErrorSeverity
		recoveryStrategy: RecoveryStrategy
		canRetry: boolean
		userActionMessage?: string
	} {
		const errorMessage = error instanceof Error ? error.message : error

		// File system errors
		if (category === "file-system") {
			if (errorMessage.includes("ENOENT")) {
				return {
					severity: "medium",
					recoveryStrategy: "user-action",
					canRetry: false,
					userActionMessage: "File not found. Please check if the file exists and try again.",
				}
			} else if (errorMessage.includes("EACCES") || errorMessage.includes("EPERM")) {
				return {
					severity: "high",
					recoveryStrategy: "user-action",
					canRetry: false,
					userActionMessage: "Permission denied. Please check file permissions and try again.",
				}
			}
		}

		// Permission errors
		if (category === "permission") {
			return {
				severity: "high",
				recoveryStrategy: "user-action",
				canRetry: false,
				userActionMessage: "Insufficient permissions. Please check file/directory permissions.",
			}
		}

		// Disk space errors
		if (category === "disk-space") {
			return {
				severity: "critical",
				recoveryStrategy: "user-action",
				canRetry: false,
				userActionMessage: "Insufficient disk space. Please free up disk space and try again.",
			}
		}

		// Network errors
		if (category === "network") {
			return {
				severity: "medium",
				recoveryStrategy: "retry",
				canRetry: true,
				userActionMessage: "Network connection issue. Retrying...",
			}
		}

		// Concurrent access errors
		if (category === "concurrent-access") {
			return {
				severity: "medium",
				recoveryStrategy: "retry",
				canRetry: true,
				userActionMessage: "Resource is busy. Retrying...",
			}
		}

		// Large file errors
		if (category === "large-file") {
			return {
				severity: "medium",
				recoveryStrategy: "fallback",
				canRetry: false,
				userActionMessage: "File too large. Using chunked processing or compression.",
			}
		}

		// Stuck state errors
		if (category === "stuck-state") {
			return {
				severity: "high",
				recoveryStrategy: "auto-recover",
				canRetry: true,
				userActionMessage: "Operation appears to be stuck. Attempting recovery...",
			}
		}

		// Timeout errors
		if (category === "timeout") {
			return {
				severity: "medium",
				recoveryStrategy: "fallback",
				canRetry: false,
				userActionMessage: "Operation timed out. Using alternative approach.",
			}
		}

		// Default handling
		return {
			severity: "medium",
			recoveryStrategy: "retry",
			canRetry: true,
			userActionMessage: "An error occurred. Retrying...",
		}
	}

	/**
	 * Attempt error recovery based on strategy
	 */
	private async attemptRecovery(errorInfo: ErrorInfo): Promise<void> {
		const { id, recoveryStrategy, context } = errorInfo

		switch (recoveryStrategy) {
			case "retry":
				await this.performRetry(errorInfo)
				break

			case "auto-recover":
				await this.performAutoRecovery(errorInfo)
				break

			case "fallback":
				await this.performFallback(errorInfo)
				break

			case "user-action":
				this.emit("userActionRequired", errorInfo)
				break

			case "graceful-degrade":
				await this.performGracefulDegradation(errorInfo)
				break

			case "abort":
				this.emit("abort", errorInfo)
				break
		}
	}

	/**
	 * Perform retry with exponential backoff
	 */
	private async performRetry(errorInfo: ErrorInfo): Promise<void> {
		const { id, maxRetries, currentRetry } = errorInfo

		if (currentRetry >= maxRetries) {
			this.emit("recoveryFailed", errorInfo)
			return
		}

		const delay = this.config.retryDelay * Math.pow(2, currentRetry)

		const timeout = setTimeout(async () => {
			errorInfo.currentRetry++
			this.emit("retryAttempt", errorInfo)

			// Emit event to retry the original operation
			this.emit("retry", {
				errorInfo,
				operation: errorInfo.context.operation,
				context: errorInfo.context,
			})
		}, delay)

		this.activeRecoveries.set(id, timeout)
	}

	/**
	 * Perform automatic recovery for stuck states
	 */
	private async performAutoRecovery(errorInfo: ErrorInfo): Promise<void> {
		const { context } = errorInfo

		// Cancel any stuck operations
		if (context.operation && context.taskId) {
			this.emit("cancelOperation", {
				operation: context.operation,
				taskId: context.taskId,
				reason: "Stuck state detected",
			})
		}

		// Clean up resources
		this.emit("cleanup", errorInfo)

		this.emit("recoveryComplete", errorInfo)
	}

	/**
	 * Perform fallback to alternative approach
	 */
	private async performFallback(errorInfo: ErrorInfo): Promise<void> {
		const { context } = errorInfo

		this.emit("fallback", {
			operation: context.operation,
			fallbackStrategy: this.getFallbackStrategy(errorInfo),
			errorInfo,
		})
	}

	/**
	 * Perform graceful degradation
	 */
	private async performGracefulDegradation(errorInfo: ErrorInfo): Promise<void> {
		const { context } = errorInfo

		this.emit("gracefulDegradation", {
			operation: context.operation,
			degradedFunctionality: this.getDegradedFunctionality(errorInfo),
			errorInfo,
		})
	}

	/**
	 * Get fallback strategy based on error type
	 */
	private getFallbackStrategy(errorInfo: ErrorInfo): string {
		switch (errorInfo.category) {
			case "large-file":
				return "chunked-processing"
			case "timeout":
				return "simplified-operation"
			case "network":
				return "offline-mode"
			default:
				return "default-fallback"
		}
	}

	/**
	 * Get degraded functionality options
	 */
	private getDegradedFunctionality(errorInfo: ErrorInfo): string[] {
		switch (errorInfo.category) {
			case "file-system":
				return ["read-only-mode", "memory-only-operations"]
			case "network":
				return ["offline-operations", "cached-data-only"]
			default:
				return ["basic-functionality"]
		}
	}

	/**
	 * Handle concurrent access scenarios
	 */
	async handleConcurrentAccess(operation: string, taskId: string, maxConcurrent: number = 1): Promise<boolean> {
		const key = `${operation}:${taskId}`
		const current = this.concurrentOperations.get(key) || 0

		if (current >= maxConcurrent) {
			const error: ErrorInfo = await this.handleError(
				new Error(`Concurrent access limit exceeded for ${operation}`),
				{
					component: "ErrorHandler",
					operation: "concurrent-access-check",
					taskId,
					timestamp: Date.now(),
				},
				"concurrent-access",
			)

			return false
		}

		this.concurrentOperations.set(key, current + 1)
		return true
	}

	/**
	 * Release concurrent access lock
	 */
	releaseConcurrentAccess(operation: string, taskId: string): void {
		const key = `${operation}:${taskId}`
		const current = this.concurrentOperations.get(key) || 0

		if (current > 0) {
			this.concurrentOperations.set(key, current - 1)
		}
	}

	/**
	 * Monitor for stuck states
	 */
	monitorStuckState(operation: string, taskId: string, timeoutMs: number = this.config.timeoutDuration): void {
		const key = `${operation}:${taskId}`

		// Clear any existing monitor
		if (this.stuckStateDetectors.has(key)) {
			clearTimeout(this.stuckStateDetectors.get(key)!)
		}

		// Set new monitor
		const timeout = setTimeout(async () => {
			await this.handleError(
				new Error(`Operation ${operation} appears to be stuck`),
				{
					component: "ErrorHandler",
					operation: "stuck-state-detection",
					taskId,
					timestamp: Date.now(),
				},
				"stuck-state",
			)
		}, timeoutMs)

		this.stuckStateDetectors.set(key, timeout)
	}

	/**
	 * Clear stuck state monitor
	 */
	clearStuckStateMonitor(operation: string, taskId: string): void {
		const key = `${operation}:${taskId}`

		if (this.stuckStateDetectors.has(key)) {
			clearTimeout(this.stuckStateDetectors.get(key)!)
			this.stuckStateDetectors.delete(key)
		}
	}

	/**
	 * Handle large file scenarios
	 */
	async handleLargeFile(
		filepath: string,
		maxSizeBytes: number = 50 * 1024 * 1024, // 50MB
	): Promise<{ isLarge: boolean; recommendedAction: string }> {
		try {
			const stats = await fs.stat(filepath)
			const isLarge = stats.size > maxSizeBytes

			if (isLarge) {
				await this.handleError(
					new Error(`File ${filepath} is too large (${stats.size} bytes)`),
					{
						component: "ErrorHandler",
						operation: "large-file-check",
						filepath,
						timestamp: Date.now(),
						additionalData: { fileSize: stats.size, maxSize: maxSizeBytes },
					},
					"large-file",
				)
			}

			return {
				isLarge,
				recommendedAction: isLarge ? "Use chunked processing" : "Process normally",
			}
		} catch (error) {
			await this.handleError(
				error as Error,
				{
					component: "ErrorHandler",
					operation: "large-file-check",
					filepath,
					timestamp: Date.now(),
				},
				"file-system",
			)

			return { isLarge: false, recommendedAction: "Process normally" }
		}
	}

	/**
	 * Check disk space availability
	 */
	async checkDiskSpace(filepath: string, minRequiredBytes: number = 100 * 1024 * 1024): Promise<boolean> {
		try {
			const directory = path.dirname(filepath)
			const stats = await fs.stat(directory)

			// Get free space (this is a simplified check)
			const freeSpace = await this.getFreeSpace(directory)

			if (freeSpace < minRequiredBytes) {
				await this.handleError(
					new Error(`Insufficient disk space: ${freeSpace} bytes available, ${minRequiredBytes} required`),
					{
						component: "ErrorHandler",
						operation: "disk-space-check",
						filepath,
						timestamp: Date.now(),
						additionalData: { freeSpace, requiredSpace: minRequiredBytes },
					},
					"disk-space",
				)

				return false
			}

			return true
		} catch (error) {
			await this.handleError(
				error as Error,
				{
					component: "ErrorHandler",
					operation: "disk-space-check",
					filepath,
					timestamp: Date.now(),
				},
				"file-system",
			)

			return false
		}
	}

	/**
	 * Get free space for directory (simplified implementation)
	 */
	private async getFreeSpace(directory: string): Promise<number> {
		try {
			// This is a simplified check - in a real implementation,
			// you'd use platform-specific APIs to get actual free space
			const stats = await fs.stat(directory)
			return 1024 * 1024 * 1024 // Assume 1GB available for now
		} catch {
			return 0
		}
	}

	/**
	 * Handle network errors with retry logic
	 */
	async handleNetworkError(error: Error, context: ErrorContext, maxRetries: number = 3): Promise<ErrorInfo> {
		const errorInfo = await this.handleError(error, context, "network")

		if (errorInfo.canRetry && errorInfo.currentRetry < maxRetries) {
			// Implement exponential backoff for network retries
			const delay = Math.min(1000 * Math.pow(2, errorInfo.currentRetry), 10000)

			setTimeout(() => {
				this.emit("retry", {
					errorInfo,
					operation: context.operation,
					context,
				})
			}, delay)
		}

		return errorInfo
	}

	/**
	 * Get recovery options for user
	 */
	getRecoveryOptions(errorInfo: ErrorInfo): RecoveryOption[] {
		const options: RecoveryOption[] = []

		switch (errorInfo.recoveryStrategy) {
			case "retry":
				options.push({
					label: "Retry",
					action: "retry",
					description: "Try the operation again",
					isRecommended: true,
				})
				break

			case "user-action":
				if (errorInfo.userActionMessage) {
					options.push({
						label: "Follow Instructions",
						action: "user-action",
						description: errorInfo.userActionMessage,
						isRecommended: true,
						requiresUserInput: true,
					})
				}
				break

			case "fallback":
				options.push({
					label: "Use Alternative",
					action: "fallback",
					description: "Use an alternative approach",
					isRecommended: true,
				})
				break
		}

		// Add common options
		options.push(
			{
				label: "Cancel",
				action: "cancel",
				description: "Cancel the operation",
			},
			{
				label: "Get Help",
				action: "help",
				description: "Open troubleshooting documentation",
			},
		)

		return options
	}

	/**
	 * Generate unique error ID
	 */
	private generateErrorId(): string {
		return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
	}

	/**
	 * Log error information
	 */
	private logError(errorInfo: ErrorInfo): void {
		if (this.shouldLog(errorInfo.severity)) {
			console.error(`[ErrorHandler] ${errorInfo.severity.toUpperCase()}: ${errorInfo.message}`, {
				id: errorInfo.id,
				category: errorInfo.category,
				component: errorInfo.context.component,
				operation: errorInfo.context.operation,
				timestamp: new Date(errorInfo.context.timestamp).toISOString(),
			})
		}

		// Add to error log
		this.errorLog.push(errorInfo)

		// Keep only last 1000 errors
		if (this.errorLog.length > 1000) {
			this.errorLog.splice(0, this.errorLog.length - 1000)
		}
	}

	/**
	 * Check if error should be logged based on severity
	 */
	private shouldLog(severity: ErrorSeverity): boolean {
		const severityLevels = { low: 0, medium: 1, high: 2, critical: 3 }
		const configLevel = severityLevels[this.config.logLevel]
		const errorLevel = severityLevels[severity]

		return errorLevel >= configLevel
	}

	/**
	 * Get error statistics
	 */
	getErrorStats(): {
		total: number
		byCategory: Record<ErrorCategory, number>
		bySeverity: Record<ErrorSeverity, number>
		recentErrors: ErrorInfo[]
	} {
		const byCategory = {} as Record<ErrorCategory, number>
		const bySeverity = {} as Record<ErrorSeverity, number>

		for (const error of this.errorLog) {
			byCategory[error.category] = (byCategory[error.category] || 0) + 1
			bySeverity[error.severity] = (bySeverity[error.severity] || 0) + 1
		}

		return {
			total: this.errorLog.length,
			byCategory,
			bySeverity,
			recentErrors: this.errorLog.slice(-10),
		}
	}

	/**
	 * Clear error log
	 */
	clearErrorLog(): void {
		this.errorLog.length = 0
	}

	/**
	 * Cleanup resources
	 */
	dispose(): void {
		// Clear active recoveries
		for (const timeout of this.activeRecoveries.values()) {
			clearTimeout(timeout)
		}
		this.activeRecoveries.clear()

		// Clear stuck state detectors
		for (const timeout of this.stuckStateDetectors.values()) {
			clearTimeout(timeout)
		}
		this.stuckStateDetectors.clear()

		// Clear concurrent operations
		this.concurrentOperations.clear()

		// Remove all listeners
		this.removeAllListeners()
	}
}
