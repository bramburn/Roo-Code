import { EventEmitter } from "events"
import type { RetryLogEntry, RetryStatistics } from "./types"

/**
 * Retry logger for tracking and analyzing retry operations
 * Provides detailed logging and statistics for retry mechanisms
 */
export class RetryLogger extends EventEmitter {
	private logs: RetryLogEntry[] = []
	private readonly maxLogEntries: number
	private readonly enableDetailedLogging: boolean

	constructor(maxLogEntries: number = 1000, enableDetailedLogging: boolean = true) {
		super()
		this.maxLogEntries = maxLogEntries
		this.enableDetailedLogging = enableDetailedLogging
	}

	/**
	 * Log a debug message
	 * @param retryId - Retry operation ID
	 * @param toolName - Tool name
	 * @param message - Log message
	 * @param data - Additional data
	 * @param attempt - Attempt number
	 */
	debug(retryId: string, toolName: string, message: string, data?: Record<string, any>, attempt?: number): void {
		this.log("debug", retryId, toolName, message, data, attempt)
	}

	/**
	 * Log an info message
	 * @param retryId - Retry operation ID
	 * @param toolName - Tool name
	 * @param message - Log message
	 * @param data - Additional data
	 * @param attempt - Attempt number
	 */
	info(retryId: string, toolName: string, message: string, data?: Record<string, any>, attempt?: number): void {
		this.log("info", retryId, toolName, message, data, attempt)
	}

	/**
	 * Log a warning message
	 * @param retryId - Retry operation ID
	 * @param toolName - Tool name
	 * @param message - Log message
	 * @param data - Additional data
	 * @param attempt - Attempt number
	 */
	warn(retryId: string, toolName: string, message: string, data?: Record<string, any>, attempt?: number): void {
		this.log("warn", retryId, toolName, message, data, attempt)
	}

	/**
	 * Log an error message
	 * @param retryId - Retry operation ID
	 * @param toolName - Tool name
	 * @param message - Log message
	 * @param error - Error object
	 * @param data - Additional data
	 * @param attempt - Attempt number
	 */
	error(
		retryId: string,
		toolName: string,
		message: string,
		error?: Error,
		data?: Record<string, any>,
		attempt?: number,
	): void {
		this.log("error", retryId, toolName, message, data, attempt, error)
	}

	/**
	 * Log retry attempt start
	 * @param retryId - Retry operation ID
	 * @param toolName - Tool name
	 * @param attempt - Attempt number
	 * @param delay - Delay before this attempt
	 */
	logAttemptStart(retryId: string, toolName: string, attempt: number, delay: number): void {
		this.info(retryId, toolName, `Starting retry attempt ${attempt + 1}`, { delay }, attempt)
	}

	/**
	 * Log retry attempt success
	 * @param retryId - Retry operation ID
	 * @param toolName - Tool name
	 * @param attempt - Attempt number
	 * @param duration - Attempt duration in milliseconds
	 */
	logAttemptSuccess(retryId: string, toolName: string, attempt: number, duration: number): void {
		this.info(retryId, toolName, `Retry attempt ${attempt + 1} succeeded`, { duration }, attempt)
	}

	/**
	 * Log retry attempt failure
	 * @param retryId - Retry operation ID
	 * @param toolName - Tool name
	 * @param attempt - Attempt number
	 * @param error - Error that occurred
	 * @param duration - Attempt duration in milliseconds
	 */
	logAttemptFailure(retryId: string, toolName: string, attempt: number, error: Error, duration: number): void {
		this.error(
			retryId,
			toolName,
			`Retry attempt ${attempt + 1} failed`,
			error,
			{
				errorMessage: error.message,
				errorStack: error.stack,
				duration,
			},
			attempt,
		)
	}

	/**
	 * Log retry operation completion
	 * @param retryId - Retry operation ID
	 * @param toolName - Tool name
	 * @param totalAttempts - Total number of attempts
	 * @param success - Whether retry was successful
	 * @param totalDuration - Total duration in milliseconds
	 */
	logRetryCompletion(
		retryId: string,
		toolName: string,
		totalAttempts: number,
		success: boolean,
		totalDuration: number,
	): void {
		this.info(retryId, toolName, `Retry ${success ? "succeeded" : "failed"} after ${totalAttempts} attempts`, {
			totalAttempts,
			success,
			totalDuration,
			averageAttemptDuration: totalDuration / totalAttempts,
		})
	}

	/**
	 * Log circuit breaker state change
	 * @param toolName - Tool name
	 * @param oldState - Previous state
	 * @param newState - New state
	 * @param reason - Reason for change
	 */
	logCircuitBreakerStateChange(toolName: string, oldState: string, newState: string, reason: string): void {
		this.info(
			`circuit-breaker-${toolName}`,
			toolName,
			`Circuit breaker state changed: ${oldState} -> ${newState}`,
			{ reason, oldState, newState },
		)
	}

	/**
	 * Log queue processing
	 * @param itemsProcessed - Number of items processed
	 * @param queueSize - Current queue size
	 */
	logQueueProcessing(itemsProcessed: number, queueSize: number): void {
		this.debug("retry-queue", "retry-queue", `Processed ${itemsProcessed} items from retry queue`, {
			itemsProcessed,
			queueSize,
		})
	}

	/**
	 * Get all log entries
	 * @param filter - Optional filter function
	 * @returns Filtered log entries
	 */
	getLogs(filter?: (entry: RetryLogEntry) => boolean): RetryLogEntry[] {
		const logs = [...this.logs]
		return filter ? logs.filter(filter) : logs
	}

	/**
	 * Get logs for a specific retry operation
	 * @param retryId - Retry operation ID
	 * @returns Log entries for the retry operation
	 */
	getRetryLogs(retryId: string): RetryLogEntry[] {
		return this.logs.filter((entry) => entry.retryId === retryId)
	}

	/**
	 * Get logs for a specific tool
	 * @param toolName - Tool name
	 * @returns Log entries for the tool
	 */
	getToolLogs(toolName: string): RetryLogEntry[] {
		return this.logs.filter((entry) => entry.toolName === toolName)
	}

	/**
	 * Get logs by level
	 * @param level - Log level
	 * @returns Log entries with specified level
	 */
	getLogsByLevel(level: "debug" | "info" | "warn" | "error"): RetryLogEntry[] {
		return this.logs.filter((entry) => entry.level === level)
	}

	/**
	 * Get recent logs within time range
	 * @param sinceMs - Timestamp in milliseconds
	 * @returns Log entries since specified time
	 */
	getRecentLogs(sinceMs: number): RetryLogEntry[] {
		return this.logs.filter((entry) => entry.timestamp >= sinceMs)
	}

	/**
	 * Calculate retry statistics
	 * @param timeRangeMs - Time range in milliseconds (optional)
	 * @returns Retry statistics
	 */
	getStatistics(timeRangeMs?: number): RetryStatistics {
		const cutoffTime = timeRangeMs ? Date.now() - timeRangeMs : 0
		const relevantLogs = timeRangeMs ? this.logs.filter((entry) => entry.timestamp >= cutoffTime) : this.logs

		const retryOperations = new Map<
			string,
			{
				toolName: string
				startTime: number
				endTime?: number
				totalAttempts: number
				successful: boolean
			}
		>()

		// Analyze retry operations
		for (const log of relevantLogs) {
			if (log.message.includes("Retry ")) {
				const parts = log.message.match(/Retry (succeeded|failed) after (\d+) attempts/)
				if (parts) {
					const [, successStr, attemptsStr] = parts
					const successful = successStr === "succeeded"
					const totalAttempts = parseInt(attemptsStr, 10)

					if (!retryOperations.has(log.retryId)) {
						retryOperations.set(log.retryId, {
							toolName: log.toolName,
							startTime: log.timestamp,
							totalAttempts,
							successful,
						})
					} else {
						const op = retryOperations.get(log.retryId)!
						op.totalAttempts = totalAttempts
						op.successful = successful
						op.endTime = log.timestamp
					}
				}
			}
		}

		const operations = Array.from(retryOperations.values())
		const totalRetries = operations.length
		const successfulRetries = operations.filter((op) => op.successful).length
		const failedRetries = totalRetries - successfulRetries

		// Calculate by-tool statistics
		const byTool: Record<
			string,
			{
				total: number
				successful: number
				failed: number
				averageAttempts: number
				averageTime: number
			}
		> = {}

		for (const operation of operations) {
			if (!byTool[operation.toolName]) {
				byTool[operation.toolName] = {
					total: 0,
					successful: 0,
					failed: 0,
					averageAttempts: 0,
					averageTime: 0,
				}
			}

			const stats = byTool[operation.toolName]
			stats.total++
			stats.successful += operation.successful ? 1 : 0
			stats.failed += operation.successful ? 0 : 1
		}

		// Calculate averages for each tool
		for (const [toolName, stats] of Object.entries(byTool)) {
			const toolOps = operations.filter((op) => op.toolName === toolName)
			stats.averageAttempts = toolOps.reduce((sum, op) => sum + op.totalAttempts, 0) / toolOps.length
			stats.averageTime =
				toolOps.reduce((sum, op) => {
					const duration = op.endTime ? op.endTime - op.startTime : 0
					return sum + duration
				}, 0) / toolOps.length
		}

		const averageAttempts =
			totalRetries > 0 ? operations.reduce((sum, op) => sum + op.totalAttempts, 0) / totalRetries : 0

		const totalRetryTime = operations.reduce((sum, op) => {
			return sum + (op.endTime ? op.endTime - op.startTime : 0)
		}, 0)

		const successRate = totalRetries > 0 ? successfulRetries / totalRetries : 0

		return {
			totalRetries,
			successfulRetries,
			failedRetries,
			averageAttempts,
			totalRetryTime,
			successRate,
			byTool,
			circuitBreaker: {
				timesOpened: 0, // TODO: Track circuit breaker events
				totalOpenTime: 0,
				averageOpenTime: 0,
			},
		}
	}

	/**
	 * Clear all logs
	 */
	clearLogs(): void {
		this.logs.length = 0
		this.emit("logs-cleared")
	}

	/**
	 * Clear logs older than specified time
	 * @param olderThanMs - Age threshold in milliseconds
	 */
	clearOldLogs(olderThanMs: number): void {
		const cutoffTime = Date.now() - olderThanMs
		const initialLength = this.logs.length
		this.logs = this.logs.filter((entry) => entry.timestamp >= cutoffTime)

		if (this.logs.length < initialLength) {
			this.emit("logs-cleaned", {
				removed: initialLength - this.logs.length,
				remaining: this.logs.length,
			})
		}
	}

	/**
	 * Export logs to JSON
	 * @param filter - Optional filter function
	 * @returns JSON string of logs
	 */
	exportLogs(filter?: (entry: RetryLogEntry) => boolean): string {
		const logs = filter ? this.logs.filter(filter) : this.logs
		return JSON.stringify(logs, null, 2)
	}

	/**
	 * Internal logging method
	 * @param level - Log level
	 * @param retryId - Retry operation ID
	 * @param toolName - Tool name
	 * @param message - Log message
	 * @param data - Additional data
	 * @param attempt - Attempt number
	 * @param error - Error object
	 */
	private log(
		level: "debug" | "info" | "warn" | "error",
		retryId: string,
		toolName: string,
		message: string,
		data?: Record<string, any>,
		attempt?: number,
		error?: Error,
	): void {
		if (!this.enableDetailedLogging && level === "debug") {
			return
		}

		const entry: RetryLogEntry = {
			id: this.generateLogId(),
			timestamp: Date.now(),
			level,
			retryId,
			toolName,
			message,
			data,
			attempt,
			error,
		}

		// Add to logs and maintain size limit
		this.logs.push(entry)
		if (this.logs.length > this.maxLogEntries) {
			this.logs.splice(0, this.logs.length - this.maxLogEntries)
		}

		// Emit log event
		this.emit("log", entry)

		// Console output for errors and warnings
		if (level === "error" || level === "warn") {
			const consoleMessage = `[RetryLogger:${level.toUpperCase()}] ${toolName}:${retryId} - ${message}`
			if (level === "error") {
				console.error(consoleMessage, error, data)
			} else {
				console.warn(consoleMessage, data)
			}
		}
	}

	/**
	 * Generate unique log entry ID
	 * @returns Unique ID
	 */
	private generateLogId(): string {
		return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
	}
}
