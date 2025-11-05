import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { ErrorHandler, type ErrorContext, type ErrorCategory } from "../error-handler"
import * as fs from "fs/promises"

describe("ErrorHandler", () => {
	let errorHandler: ErrorHandler
	let consoleSpy: any

	beforeEach(() => {
		errorHandler = new ErrorHandler({
			maxRetries: 2,
			retryDelay: 100,
			enableAutoRecovery: true,
			logLevel: "low",
		})

		consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
	})

	afterEach(() => {
		errorHandler.dispose()
		consoleSpy.mockRestore()
	})

	describe("Error Categorization", () => {
		it("should categorize file system errors correctly", async () => {
			const error = new Error("ENOENT: no such file or directory")
			const context: ErrorContext = {
				component: "TestComponent",
				operation: "test-operation",
				timestamp: Date.now(),
			}

			const errorInfo = await errorHandler.handleError(error, context, "file-system")

			expect(errorInfo.category).toBe("file-system")
			expect(errorInfo.severity).toBe("medium")
			expect(errorInfo.recoveryStrategy).toBe("user-action")
			expect(errorInfo.canRetry).toBe(false)
		})

		it("should categorize permission errors correctly", async () => {
			const error = new Error("EACCES: permission denied")
			const context: ErrorContext = {
				component: "TestComponent",
				operation: "test-operation",
				timestamp: Date.now(),
			}

			const errorInfo = await errorHandler.handleError(error, context, "permission")

			expect(errorInfo.category).toBe("permission")
			expect(errorInfo.severity).toBe("high")
			expect(errorInfo.recoveryStrategy).toBe("user-action")
			expect(errorInfo.canRetry).toBe(false)
		})

		it("should categorize network errors correctly", async () => {
			const error = new Error("Network timeout")
			const context: ErrorContext = {
				component: "TestComponent",
				operation: "test-operation",
				timestamp: Date.now(),
			}

			const errorInfo = await errorHandler.handleError(error, context, "network")

			expect(errorInfo.category).toBe("network")
			expect(errorInfo.severity).toBe("medium")
			expect(errorInfo.recoveryStrategy).toBe("retry")
			expect(errorInfo.canRetry).toBe(true)
		})

		it("should categorize disk space errors correctly", async () => {
			const error = new Error("ENOSPC: no space left on device")
			const context: ErrorContext = {
				component: "TestComponent",
				operation: "test-operation",
				timestamp: Date.now(),
			}

			const errorInfo = await errorHandler.handleError(error, context, "disk-space")

			expect(errorInfo.category).toBe("disk-space")
			expect(errorInfo.severity).toBe("critical")
			expect(errorInfo.recoveryStrategy).toBe("user-action")
			expect(errorInfo.canRetry).toBe(false)
		})

		it("should categorize stuck state errors correctly", async () => {
			const error = new Error("Operation appears to be stuck")
			const context: ErrorContext = {
				component: "TestComponent",
				operation: "test-operation",
				timestamp: Date.now(),
			}

			const errorInfo = await errorHandler.handleError(error, context, "stuck-state")

			expect(errorInfo.category).toBe("stuck-state")
			expect(errorInfo.severity).toBe("high")
			expect(errorInfo.recoveryStrategy).toBe("auto-recover")
			expect(errorInfo.canRetry).toBe(true)
		})
	})

	describe("Retry Logic", () => {
		it("should retry operations with exponential backoff", async () => {
			const mockOperation = vi.fn()
			const error = new Error("Temporary failure")
			const context: ErrorContext = {
				component: "TestComponent",
				operation: "test-operation",
				timestamp: Date.now(),
			}

			let retryCount = 0
			errorHandler.on("retry", ({ errorInfo }) => {
				retryCount++
				if (retryCount <= 2) {
					mockOperation()
				}
			})

			const errorInfo = await errorHandler.handleError(error, context, "network")

			expect(errorInfo.currentRetry).toBe(0)
			expect(mockOperation).toHaveBeenCalledTimes(2)
		})

		it("should stop retrying after max retries", async () => {
			const mockOperation = vi.fn()
			const error = new Error("Persistent failure")
			const context: ErrorContext = {
				component: "TestComponent",
				operation: "test-operation",
				timestamp: Date.now(),
			}

			let retryCount = 0
			errorHandler.on("retry", ({ errorInfo }) => {
				retryCount++
				if (retryCount <= 3) {
					mockOperation()
				}
			})

			await errorHandler.handleError(error, context, "network")

			// Should only retry 2 times (maxRetries)
			expect(mockOperation).toHaveBeenCalledTimes(2)
		})
	})

	describe("Concurrent Access Management", () => {
		it("should allow concurrent access within limits", async () => {
			const canAccess = await errorHandler.handleConcurrentAccess("test-operation", "task-1", 2)

			expect(canAccess).toBe(true)
		})

		it("should deny concurrent access when limit exceeded", async () => {
			// First access should succeed
			await errorHandler.handleConcurrentAccess("test-operation", "task-1", 1)

			// Second access should fail
			const canAccess = await errorHandler.handleConcurrentAccess("test-operation", "task-2", 1)

			expect(canAccess).toBe(false)
		})

		it("should release concurrent access correctly", async () => {
			await errorHandler.handleConcurrentAccess("test-operation", "task-1", 1)
			errorHandler.releaseConcurrentAccess("test-operation", "task-1")

			// Should be able to access again after release
			const canAccess = await errorHandler.handleConcurrentAccess("test-operation", "task-3", 1)

			expect(canAccess).toBe(true)
		})
	})

	describe("Large File Handling", () => {
		it("should detect large files correctly", async () => {
			vi.mocked(fs).stat = vi.fn().mockResolvedValue({
				size: 60 * 1024 * 1024, // 60MB
			} as any)

			const context: ErrorContext = {
				component: "TestComponent",
				operation: "test-operation",
				filepath: "/test/large-file.txt",
				timestamp: Date.now(),
			}

			const result = await errorHandler.handleLargeFile("/test/large-file.txt")

			expect(result.isLarge).toBe(true)
			expect(result.recommendedAction).toBe("Use chunked processing")
		})

		it("should handle normal sized files correctly", async () => {
			vi.mocked(fs).stat = vi.fn().mockResolvedValue({
				size: 10 * 1024 * 1024, // 10MB
			} as any)

			const context: ErrorContext = {
				component: "TestComponent",
				operation: "test-operation",
				filepath: "/test/normal-file.txt",
				timestamp: Date.now(),
			}

			const result = await errorHandler.handleLargeFile("/test/normal-file.txt")

			expect(result.isLarge).toBe(false)
			expect(result.recommendedAction).toBe("Process normally")
		})
	})

	describe("Stuck State Detection", () => {
		it("should detect stuck operations", async () => {
			const context: ErrorContext = {
				component: "TestComponent",
				operation: "test-operation",
				taskId: "task-1",
				timestamp: Date.now(),
			}

			// Monitor stuck state with short timeout
			errorHandler.monitorStuckState("test-operation", "task-1", 100)

			// Wait for stuck state detection
			await new Promise((resolve) => setTimeout(resolve, 150))

			// Should emit auto-recovery event
			const autoRecoverPromise = new Promise((resolve) => {
				errorHandler.on("auto-recover", resolve)
			})

			const recoveryEvent = await autoRecoverPromise
			expect(recoveryEvent).toBeDefined()
		})

		it("should clear stuck state monitor", async () => {
			const context: ErrorContext = {
				component: "TestComponent",
				operation: "test-operation",
				taskId: "task-1",
				timestamp: Date.now(),
			}

			errorHandler.monitorStuckState("test-operation", "task-1", 1000)
			errorHandler.clearStuckStateMonitor("test-operation", "task-1")

			// Wait to ensure no detection occurs
			await new Promise((resolve) => setTimeout(resolve, 150))

			// Should not emit auto-recovery event
			const autoRecoverPromise = new Promise((resolve, reject) => {
				errorHandler.on("auto-recover", reject)
				setTimeout(() => resolve(null), 100)
			})

			await expect(autoRecoverPromise).rejects.toThrow()
		})
	})

	describe("Disk Space Management", () => {
		it("should check available disk space", async () => {
			const context: ErrorContext = {
				component: "TestComponent",
				operation: "test-operation",
				filepath: "/test/file.txt",
				timestamp: Date.now(),
			}

			const hasSpace = await errorHandler.checkDiskSpace("/test/file.txt", 100 * 1024 * 1024)

			expect(hasSpace).toBe(true)
		})

		it("should detect insufficient disk space", async () => {
			const context: ErrorContext = {
				component: "TestComponent",
				operation: "test-operation",
				filepath: "/test/file.txt",
				timestamp: Date.now(),
			}

			// Mock insufficient space
			vi.mocked(fs).stat = vi.fn().mockRejectedValue(new Error("ENOSPC"))

			const hasSpace = await errorHandler.checkDiskSpace("/test/file.txt", 100 * 1024 * 1024)

			expect(hasSpace).toBe(false)
		})
	})

	describe("Network Error Recovery", () => {
		it("should handle network errors with retry logic", async () => {
			const error = new Error("Network timeout")
			const context: ErrorContext = {
				component: "TestComponent",
				operation: "test-operation",
				timestamp: Date.now(),
			}

			const errorInfo = await errorHandler.handleNetworkError(error, context)

			expect(errorInfo.category).toBe("network")
			expect(errorInfo.canRetry).toBe(true)
			expect(errorInfo.currentRetry).toBe(0)
		})

		it("should respect max retry limit for network errors", async () => {
			const error = new Error("Persistent network failure")
			const context: ErrorContext = {
				component: "TestComponent",
				operation: "test-operation",
				timestamp: Date.now(),
			}

			let retryCount = 0
			errorHandler.on("retry", ({ errorInfo }) => {
				retryCount++
			})

			await errorHandler.handleNetworkError(error, context)
			await errorHandler.handleNetworkError(error, context)
			await errorHandler.handleNetworkError(error, context)

			// Should have retried 2 times (maxRetries)
			expect(retryCount).toBe(2)
		})
	})

	describe("Error Statistics", () => {
		it("should track error statistics correctly", async () => {
			const error1 = new Error("Error 1")
			const error2 = new Error("Error 2")
			const context: ErrorContext = {
				component: "TestComponent",
				operation: "test-operation",
				timestamp: Date.now(),
			}

			await errorHandler.handleError(error1, context, "file-system")
			await errorHandler.handleError(error2, context, "network")

			const stats = errorHandler.getErrorStats()

			expect(stats.total).toBe(2)
			expect(stats.byCategory["file-system"]).toBe(1)
			expect(stats.byCategory["network"]).toBe(1)
			expect(stats.bySeverity["medium"]).toBe(2)
			expect(stats.recentErrors).toHaveLength(2)
		})

		it("should clear error statistics", async () => {
			const error = new Error("Test error")
			const context: ErrorContext = {
				component: "TestComponent",
				operation: "test-operation",
				timestamp: Date.now(),
			}

			await errorHandler.handleError(error, context, "file-system")
			errorHandler.clearErrorLog()

			const stats = errorHandler.getErrorStats()

			expect(stats.total).toBe(0)
			expect(stats.byCategory).toEqual({})
			expect(stats.bySeverity).toEqual({})
			expect(stats.recentErrors).toHaveLength(0)
		})
	})

	describe("Recovery Options", () => {
		it("should provide appropriate recovery options", async () => {
			const error = new Error("Permission denied")
			const context: ErrorContext = {
				component: "TestComponent",
				operation: "test-operation",
				timestamp: Date.now(),
			}

			const errorInfo = await errorHandler.handleError(error, context, "permission")
			const options = errorHandler.getRecoveryOptions(errorInfo)

			expect(options).toHaveLength(3) // Cancel, Get Help, and user action
			expect(options[0].label).toBe("Follow Instructions")
			expect(options[0].requiresUserInput).toBe(true)
		})

		it("should provide retry options for retryable errors", async () => {
			const error = new Error("Network timeout")
			const context: ErrorContext = {
				component: "TestComponent",
				operation: "test-operation",
				timestamp: Date.now(),
			}

			const errorInfo = await errorHandler.handleError(error, context, "network")
			const options = errorHandler.getRecoveryOptions(errorInfo)

			expect(options).toHaveLength(3)
			expect(options[0].label).toBe("Retry")
			expect(options[0].isRecommended).toBe(true)
		})
	})

	describe("Event Emission", () => {
		it("should emit error events", async () => {
			const error = new Error("Test error")
			const context: ErrorContext = {
				component: "TestComponent",
				operation: "test-operation",
				timestamp: Date.now(),
			}

			let errorEmitted = false
			errorHandler.on("error", () => {
				errorEmitted = true
			})

			await errorHandler.handleError(error, context, "unknown")

			expect(errorEmitted).toBe(true)
		})

		it("should emit recovery events", async () => {
			const error = new Error("Recoverable error")
			const context: ErrorContext = {
				component: "TestComponent",
				operation: "test-operation",
				timestamp: Date.now(),
			}

			let recoveryEventEmitted = false
			errorHandler.on("retry", () => {
				recoveryEventEmitted = true
			})

			await errorHandler.handleError(error, context, "network")

			expect(recoveryEventEmitted).toBe(true)
		})
	})

	describe("Resource Cleanup", () => {
		it("should clean up resources on dispose", () => {
			const error = new Error("Test error")
			const context: ErrorContext = {
				component: "TestComponent",
				operation: "test-operation",
				timestamp: Date.now(),
			}

			// Start some operations
			errorHandler.monitorStuckState("test-operation", "task-1", 1000)
			errorHandler.handleConcurrentAccess("test-operation", "task-2", 1)

			// Dispose
			errorHandler.dispose()

			// Should not emit events after dispose
			let eventEmitted = false
			errorHandler.on("retry", () => {
				eventEmitted = true
			})

			// Try to trigger events - should not work
			setTimeout(() => {
				expect(eventEmitted).toBe(false)
			}, 100)
		})
	})
})
