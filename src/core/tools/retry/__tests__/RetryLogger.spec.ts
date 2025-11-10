import { describe, test, expect, beforeEach, afterEach, vi } from "vitest"
import { RetryLogger } from "../RetryLogger"

describe("RetryLogger", () => {
	let logger: RetryLogger
	let consoleSpy: any

	beforeEach(() => {
		logger = new RetryLogger(100, true) // Max 100 entries, detailed logging enabled
		consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
		vi.spyOn(console, "warn").mockImplementation(() => {})
		vi.spyOn(console, "log").mockImplementation(() => {})
	})

	afterEach(() => {
		consoleSpy.mockRestore()
		logger.clearLogs()
	})

	describe("Basic Logging", () => {
		test("should log debug messages", () => {
			logger.debug("retry-1", "test-tool", "Debug message", { data: "test" }, 1)

			const logs = logger.getLogs()
			const debugLogs = logger.getLogsByLevel("debug")

			expect(debugLogs).toHaveLength(1)
			expect(debugLogs[0].level).toBe("debug")
			expect(debugLogs[0].retryId).toBe("retry-1")
			expect(debugLogs[0].toolName).toBe("test-tool")
			expect(debugLogs[0].message).toBe("Debug message")
			expect(debugLogs[0].data).toEqual({ data: "test" })
			expect(debugLogs[0].attempt).toBe(1)
		})

		test("should log info messages", () => {
			logger.info("retry-2", "test-tool", "Info message", { data: "test" }, 2)

			const logs = logger.getLogs()
			const infoLogs = logger.getLogsByLevel("info")

			expect(infoLogs).toHaveLength(1)
			expect(infoLogs[0].level).toBe("info")
			expect(infoLogs[0].retryId).toBe("retry-2")
			expect(infoLogs[0].toolName).toBe("test-tool")
			expect(infoLogs[0].message).toBe("Info message")
			expect(infoLogs[0].data).toEqual({ data: "test" })
			expect(infoLogs[0].attempt).toBe(2)
		})

		test("should log warning messages", () => {
			logger.warn("retry-3", "test-tool", "Warning message", { data: "test" }, 3)

			const logs = logger.getLogs()
			const warnLogs = logger.getLogsByLevel("warn")

			expect(warnLogs).toHaveLength(1)
			expect(warnLogs[0].level).toBe("warn")
			expect(warnLogs[0].retryId).toBe("retry-3")
			expect(warnLogs[0].toolName).toBe("test-tool")
			expect(warnLogs[0].message).toBe("Warning message")
			expect(warnLogs[0].data).toEqual({ data: "test" })
			expect(warnLogs[0].attempt).toBe(3)

			// Should call console.warn
			expect(consoleSpy).toHaveBeenCalled()
		})

		test("should log error messages", () => {
			const error = new Error("Test error")
			logger.error("retry-4", "test-tool", "Error message", error, { data: "test" }, 4)

			const logs = logger.getLogs()
			const errorLogs = logger.getLogsByLevel("error")

			expect(errorLogs).toHaveLength(1)
			expect(errorLogs[0].level).toBe("error")
			expect(errorLogs[0].retryId).toBe("retry-4")
			expect(errorLogs[0].toolName).toBe("test-tool")
			expect(errorLogs[0].message).toBe("Error message")
			expect(errorLogs[0].error).toBe(error)
			expect(errorLogs[0].data).toEqual({ data: "test" })
			expect(errorLogs[0].attempt).toBe(4)

			// Should call console.error
			expect(consoleSpy).toHaveBeenCalled()
		})
	})

	describe("Specialized Logging Methods", () => {
		test("should log attempt start", () => {
			logger.logAttemptStart("retry-5", "test-tool", 2, 1500)

			const logs = logger.getLogs()
			const startLogs = logs.filter((log) => log.message.includes("Starting retry attempt"))

			expect(startLogs).toHaveLength(1)
			expect(startLogs[0].retryId).toBe("retry-5")
			expect(startLogs[0].toolName).toBe("test-tool")
			expect(startLogs[0].attempt).toBe(2)
			expect(startLogs[0].data).toEqual({ delay: 1500 })
		})

		test("should log attempt success", () => {
			logger.logAttemptSuccess("retry-6", "test-tool", 3, 2500)

			const logs = logger.getLogs()
			const successLogs = logs.filter((log) => log.message.includes("succeeded"))

			expect(successLogs).toHaveLength(1)
			expect(successLogs[0].retryId).toBe("retry-6")
			expect(successLogs[0].toolName).toBe("test-tool")
			expect(successLogs[0].attempt).toBe(3)
			expect(successLogs[0].data).toEqual({ duration: 2500 })
		})

		test("should log attempt failure", () => {
			const error = new Error("Attempt failed")
			logger.logAttemptFailure("retry-7", "test-tool", 4, error, 3000)

			const logs = logger.getLogs()
			const failureLogs = logs.filter((log) => log.message.includes("failed"))

			expect(failureLogs).toHaveLength(1)
			expect(failureLogs[0].retryId).toBe("retry-7")
			expect(failureLogs[0].toolName).toBe("test-tool")
			expect(failureLogs[0].attempt).toBe(4)
			expect(failureLogs[0].error).toBe(error)
			expect(failureLogs[0].data).toEqual({
				errorMessage: "Attempt failed",
				errorStack: error.stack,
				duration: 3000,
			})
		})

		test("should log retry completion", () => {
			logger.logRetryCompletion("retry-8", "test-tool", 3, true, 5000)

			const logs = logger.getLogs()
			const completionLogs = logs.filter((log) => log.message.includes("succeeded after"))

			expect(completionLogs).toHaveLength(1)
			expect(completionLogs[0].retryId).toBe("retry-8")
			expect(completionLogs[0].toolName).toBe("test-tool")
			expect(completionLogs[0].data).toEqual({
				totalAttempts: 3,
				success: true,
				totalDuration: 5000,
				averageAttemptDuration: 1666.6666666666667,
			})
		})

		test("should log circuit breaker state change", () => {
			logger.logCircuitBreakerStateChange("test-tool", "closed", "open", "failure threshold reached")

			const logs = logger.getLogs()
			const cbLogs = logs.filter((log) => log.retryId === "circuit-breaker-test-tool")

			expect(cbLogs).toHaveLength(1)
			expect(cbLogs[0].toolName).toBe("test-tool")
			expect(cbLogs[0].message).toContain("Circuit breaker state changed: closed -> open")
			expect(cbLogs[0].data).toEqual({
				reason: "failure threshold reached",
				oldState: "closed",
				newState: "open",
			})
		})

		test("should log queue processing", () => {
			logger.logQueueProcessing(5, 10)

			const logs = logger.getLogs()
			const queueLogs = logs.filter((log) => log.retryId === "retry-queue")

			expect(queueLogs).toHaveLength(1)
			expect(queueLogs[0].toolName).toBe("retry-queue")
			expect(queueLogs[0].message).toBe("Processed 5 items from retry queue")
			expect(queueLogs[0].data).toEqual({
				itemsProcessed: 5,
				queueSize: 10,
			})
		})
	})

	describe("Log Filtering", () => {
		test("should get logs by retry ID", () => {
			// Add multiple logs for different retries
			logger.info("retry-1", "tool-a", "Message 1")
			logger.info("retry-1", "tool-a", "Message 2")
			logger.info("retry-2", "tool-b", "Message 1")
			logger.info("retry-2", "tool-b", "Message 2")

			const retry1Logs = logger.getRetryLogs("retry-1")
			const retry2Logs = logger.getRetryLogs("retry-2")

			expect(retry1Logs).toHaveLength(2)
			expect(retry2Logs).toHaveLength(2)
			expect(retry1Logs.every((log) => log.retryId === "retry-1")).toBe(true)
			expect(retry2Logs.every((log) => log.retryId === "retry-2")).toBe(true)
		})

		test("should get logs by tool name", () => {
			// Add logs for different tools
			logger.info("retry-1", "tool-a", "Message 1")
			logger.info("retry-2", "tool-b", "Message 1")
			logger.info("retry-3", "tool-a", "Message 2")
			logger.info("retry-4", "tool-c", "Message 1")

			const toolALogs = logger.getToolLogs("tool-a")
			const toolBlog = logger.getToolLogs("tool-b")
			const toolClogs = logger.getToolLogs("tool-c")

			expect(toolALogs).toHaveLength(2)
			expect(toolBlog).toHaveLength(1)
			expect(toolClogs).toHaveLength(1)
		})

		test("should get logs by level", () => {
			logger.debug("retry-1", "tool-a", "Debug message")
			logger.info("retry-1", "tool-a", "Info message")
			logger.warn("retry-1", "tool-a", "Warning message")
			logger.error("retry-1", "tool-a", new Error("Error message"))

			const debugLogs = logger.getLogsByLevel("debug")
			const infoLogs = logger.getLogsByLevel("info")
			const warnLogs = logger.getLogsByLevel("warn")
			const errorLogs = logger.getLogsByLevel("error")

			expect(debugLogs).toHaveLength(1)
			expect(infoLogs).toHaveLength(1)
			expect(warnLogs).toHaveLength(1)
			expect(errorLogs).toHaveLength(1)
		})

		test("should get recent logs", () => {
			const now = Date.now()
			const oneSecondAgo = now - 1000

			logger.info("retry-1", "tool-a", "Old message")
			logger.info("retry-2", "tool-b", "Recent message")

			// Wait a bit to ensure timestamp difference
			await new Promise((resolve) => setTimeout(resolve, 10))

			const recentLogs = logger.getRecentLogs(oneSecondAgo)

			expect(recentLogs.length).toBeGreaterThan(0)
			expect(recentLogs.every((log) => log.timestamp >= oneSecondAgo)).toBe(true)
		})

		test("should filter logs with custom function", () => {
			logger.info("retry-1", "tool-a", "Message 1")
			logger.info("retry-2", "tool-b", "Message 2")
			logger.error("retry-3", "tool-c", "Error message")

			const infoAndErrorLogs = logger.getLogs((log) => log.level === "info" || log.level === "error")

			expect(infoAndErrorLogs).toHaveLength(3)
			expect(infoAndErrorLogs.every((log) => log.level === "info" || log.level === "error")).toBe(true)
		})
	})

	describe("Statistics Calculation", () => {
		test("should calculate retry statistics", () => {
			// Simulate a complete retry operation
			logger.logAttemptStart("retry-stats", "tool-a", 1, 1000)
			logger.logAttemptFailure("retry-stats", "tool-a", 1, new Error("Failed 1"), 2000)
			logger.logAttemptStart("retry-stats", "tool-a", 2, 1500)
			logger.logAttemptSuccess("retry-stats", "tool-a", 2, 1500)
			logger.logRetryCompletion("retry-stats", "tool-a", 2, true, 3500)

			// Another successful retry
			logger.logAttemptStart("retry-stats-2", "tool-b", 1, 800)
			logger.logAttemptSuccess("retry-stats-2", "tool-b", 1, 800)
			logger.logRetryCompletion("retry-stats-2", "tool-b", 1, true, 800)

			// A failed retry
			logger.logAttemptStart("retry-stats-3", "tool-c", 1, 1200)
			logger.logAttemptFailure("retry-stats-3", "tool-c", 1, new Error("Failed"), 1000)
			logger.logAttemptFailure("retry-stats-3", "tool-c", 2, new Error("Failed"), 1000)
			logger.logRetryCompletion("retry-stats-3", "tool-c", 2, false, 2200)

			const stats = logger.getStatistics()

			expect(stats.totalRetries).toBe(3)
			expect(stats.successfulRetries).toBe(2)
			expect(stats.failedRetries).toBe(1)
			expect(stats.averageAttempts).toBeCloseTo(1.67, 2) // (2 + 1 + 2) / 3
			expect(stats.totalRetryTime).toBe(6500) // 3500 + 800 + 2200
			expect(stats.successRate).toBeCloseTo(0.667, 2) // 2/3

			// Check by-tool statistics
			expect(stats.byTool).toBeDefined()
			expect(stats.byTool["tool-a"].total).toBe(1)
			expect(stats.byTool["tool-a"].successful).toBe(1)
			expect(stats.byTool["tool-b"].total).toBe(1)
			expect(stats.byTool["tool-b"].successful).toBe(1)
			expect(stats.byTool["tool-c"].total).toBe(1)
			expect(stats.byTool["tool-c"].successful).toBe(0)
		})

		test("should calculate statistics with time range", () => {
			const now = Date.now()
			const oneSecondAgo = now - 1000

			// Add logs within time range
			logger.logRetryCompletion("recent-retry", "tool-a", 1, true, 500)

			// Add logs outside time range
			await new Promise((resolve) => setTimeout(resolve, 10))
			logger.logRetryCompletion("old-retry", "tool-b", 1, true, 500)

			const stats = logger.getStatistics(1000) // Last 1 second

			expect(stats.totalRetries).toBe(1)
			expect(stats.successfulRetries).toBe(1)
			expect(stats.failedRetries).toBe(0)
		})
	})

	describe("Log Management", () => {
		test("should maintain maximum log entries", () => {
			// Fill up to the maximum
			for (let i = 0; i < 150; i++) {
				logger.info(`retry-${i}`, "tool-a", `Message ${i}`)
			}

			const allLogs = logger.getLogs()
			expect(allLogs.length).toBeLessThanOrEqual(100) // Max entries
		})

		test("should clear all logs", () => {
			logger.info("retry-1", "tool-a", "Message 1")
			logger.info("retry-2", "tool-b", "Message 2")

			expect(logger.getLogs()).toHaveLength(2)

			logger.clearLogs()

			expect(logger.getLogs()).toHaveLength(0)
		})

		test("should clear old logs", () => {
			const now = Date.now()

			// Add an old log
			const oldTimestamp = now - 2000 // 2 seconds ago
			logger.info("old-retry", "tool-a", "Old message")
			logger.log.entries[logger.log.entries.length - 1] = {
				...logger.log.entries[logger.log.entries.length - 1],
				timestamp: oldTimestamp,
			}

			// Add a recent log
			logger.info("recent-retry", "tool-b", "Recent message")

			expect(logger.getLogs()).toHaveLength(2)

			logger.clearOldLogs(1500) // Clear logs older than 1.5 seconds

			const remainingLogs = logger.getLogs()
			expect(remainingLogs).toHaveLength(1)
			expect(remainingLogs[0].retryId).toBe("recent-retry")
		})

		test("should export logs to JSON", () => {
			logger.info("retry-1", "tool-a", "Message 1", { data: "test" })
			logger.error("retry-2", "tool-b", "Error message", new Error("Test error"))

			const exportedJson = logger.exportLogs()
			const parsedLogs = JSON.parse(exportedJson)

			expect(Array.isArray(parsedLogs)).toBe(true)
			expect(parsedLogs).toHaveLength(2)
			expect(parsedLogs[0].retryId).toBe("retry-1")
			expect(parsedLogs[1].retryId).toBe("retry-2")
			expect(parsedLogs[1].error).toBeDefined()
		})
	})

	describe("Event Emission", () => {
		test("should emit log events", () => {
			const eventSpy = vi.fn()
			logger.on("log", eventSpy)

			logger.info("retry-1", "tool-a", "Test message")

			expect(eventSpy).toHaveBeenCalled()
			const logEntry = eventSpy.mock.calls[0][0]

			expect(logEntry.level).toBe("info")
			expect(logEntry.retryId).toBe("retry-1")
			expect(logEntry.toolName).toBe("tool-a")
			expect(logEntry.message).toBe("Test message")
		})

		test("should emit logs-cleared events", () => {
			const eventSpy = vi.fn()
			logger.on("logs-cleared", eventSpy)

			logger.info("retry-1", "tool-a", "Message 1")
			logger.clearLogs()

			expect(eventSpy).toHaveBeenCalledWith({
				removed: 1,
				remaining: 0,
			})
		})

		test("should emit logs-cleaned events", () => {
			const eventSpy = vi.fn()
			logger.on("logs-cleaned", eventSpy)

			logger.info("retry-1", "tool-a", "Message 1")
			logger.clearOldLogs(100) // Clear everything

			expect(eventSpy).toHaveBeenCalledWith({
				removed: 1,
				remaining: 0,
			})
		})
	})

	describe("Configuration", () => {
		test("should respect detailed logging setting", () => {
			const detailedLogger = new RetryLogger(10, true)
			const simpleLogger = new RetryLogger(10, false)

			detailedLogger.debug("retry-1", "tool-a", "Debug message")
			simpleLogger.debug("retry-2", "tool-b", "Debug message")

			const detailedLogs = detailedLogger.getLogs()
			const simpleLogs = simpleLogger.getLogs()

			// Detailed logger should include debug logs
			expect(detailedLogs.some((log) => log.level === "debug")).toBe(true)
			// Simple logger should not include debug logs
			expect(simpleLogs.some((log) => log.level === "debug")).toBe(false)
		})

		test("should respect maximum entries setting", () => {
			const limitedLogger = new RetryLogger(5, true)

			// Add more logs than the limit
			for (let i = 0; i < 10; i++) {
				limitedLogger.info(`retry-${i}`, "tool-a", `Message ${i}`)
			}

			const logs = limitedLogger.getLogs()
			expect(logs.length).toBeLessThanOrEqual(5)
		})
	})

	describe("Edge Cases", () => {
		test("should handle very long messages", () => {
			const longMessage = "a".repeat(10000)
			logger.info("retry-1", "tool-a", longMessage)

			const logs = logger.getLogs()
			expect(logs).toHaveLength(1)
			expect(logs[0].message).toBe(longMessage)
		})

		test("should handle special characters", () => {
			const specialMessage = "🚀 Special chars: \n\t\r\"'\\"
			logger.info("retry-1", "tool-a", specialMessage)

			const logs = logger.getLogs()
			expect(logs).toHaveLength(1)
			expect(logs[0].message).toBe(specialMessage)
		})

		test("should handle concurrent logging", async () => {
			const promises = Array.from({ length: 10 }, (_, i) =>
				Promise.resolve().then(() => logger.info(`retry-${i}`, "tool-a", `Concurrent message ${i}`)),
			)

			await Promise.all(promises)

			const logs = logger.getLogs()
			expect(logs.length).toBe(10)
			// Should handle concurrent logging without corruption
		})

		test("should handle invalid parameters", () => {
			// These should not crash the logger
			logger.info("", "tool-a", "Empty retry ID")
			logger.info("retry-1", "", "Empty tool name")
			logger.info("retry-1", "tool-a", null as any)
			logger.info("retry-1", "tool-a", undefined as any)

			const logs = logger.getLogs()
			expect(logs.length).toBe(4)
		})
	})
})
