import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { ManualReviewManager } from "../../core/condense/manual-review"
import { ContextFileManager } from "../../core/condense/context-file-manager"
import { FileWatcher } from "../../core/condense/file-watcher"
import * as fs from "fs/promises"
import * as path from "path"

describe("Manual Review Integration Tests", () => {
	let manualReviewManager: ManualReviewManager
	let contextFileManager: ContextFileManager
	let fileWatcher: FileWatcher
	let tempDir: string

	beforeEach(() => {
		tempDir = path.join(__dirname, "temp-context-review")
		contextFileManager = new ContextFileManager(tempDir)
		fileWatcher = new FileWatcher(contextFileManager.getContextReviewDir())
		manualReviewManager = new ManualReviewManager(
			5 * 60 * 1000, // 5 minutes
			contextFileManager,
			fileWatcher,
		)
	})

	afterEach(async () => {
		// Clean up temp directory
		try {
			await fs.rm(tempDir, { recursive: true, force: true })
		} catch (error) {
			console.error("Failed to clean up temp directory:", error)
		}

		// Dispose of managers
		manualReviewManager.dispose()
		fileWatcher.dispose()
	})

	describe("ManualReviewManager Integration", () => {
		it("should start manual review successfully", async () => {
			const messages = [
				{ role: "user", content: "Test message", ts: Date.now() },
				{ role: "assistant", content: "Test response", ts: Date.now() + 1000 },
			]

			const contextFile = await manualReviewManager.startManualReview(messages, {
				contextSize: 1000,
				triggerReason: "manual",
				timestamp: Date.now(),
				taskId: "test-task-123",
			})

			expect(contextFile).toBeDefined()
			expect(contextFile).toContain("temp-context-review")
			expect(manualReviewManager.getStatus().state).toBe("waiting")
		})

		it("should complete review when file is modified", async () => {
			const messages = [
				{ role: "user", content: "Test message", ts: Date.now() },
				{ role: "assistant", content: "Test response", ts: Date.now() + 1000 },
			]

			const contextFile = await manualReviewManager.startManualReview(messages, {
				contextSize: 1000,
				triggerReason: "manual",
				timestamp: Date.now(),
				taskId: "test-task-456",
			})

			// Simulate file modification
			await new Promise((resolve) => setTimeout(resolve, 100)).then(() => {
				fs.writeFile(contextFile, "\n\n# Modified content\n\n", { flag: "a" })
			})

			// Wait for review to complete
			const result = await new Promise<string>((resolve) => {
				manualReviewManager.on("reviewComplete", (data) => {
					if (data.reason === "completed") {
						resolve(data.contextFile || "")
					}
				})
			})

			expect(result).toBe("temp-context-review/test-task-456-context.md")
		})

		it("should timeout after 5 minutes", async () => {
			const messages = [
				{ role: "user", content: "Test message", ts: Date.now() },
				{ role: "assistant", content: "Test response", ts: Date.now() + 1000 },
			]

			// Create manager with 1 second timeout
			const shortTimeoutManager = new ManualReviewManager(
				1 * 1000, // 1 second
				contextFileManager,
				fileWatcher,
			)

			const contextFile = await shortTimeoutManager.startManualReview(messages, {
				contextSize: 1000,
				triggerReason: "manual",
				timestamp: Date.now(),
				taskId: "test-task-timeout",
			})

			const result = await new Promise<string>((resolve) => {
				shortTimeoutManager.on("timeout", () => {
					resolve("timeout")
				})
			})

			expect(result).toBe("timeout")
		})

		it("should handle fallback correctly", async () => {
			const messages = [
				{ role: "user", content: "Test message", ts: Date.now() },
				{ role: "assistant", content: "Test response", ts: Date.now() + 1000 },
			]

			const contextFile = await manualReviewManager.startManualReview(messages, {
				contextSize: 1000,
				triggerReason: "manual",
				timestamp: Date.now(),
				taskId: "test-task-fallback",
			})

			// Trigger fallback immediately
			await manualReviewManager.forceFallback()

			const result = await new Promise<string>((resolve) => {
				manualReviewManager.on("reviewComplete", (data) => {
					if (data.reason === "fallback") {
						resolve(data.contextFile || "")
					}
				})
			})

			expect(result).toBe("fallback")
		})

		it("should emit status changes", async () => {
			const statusChanges: string[] = []

			manualReviewManager.on("statusChange", (status) => {
				statusChanges.push(status.state)
			})

			await manualReviewManager.startManualReview(
				[
					{ role: "user", content: "Test", ts: Date.now() },
					{ role: "assistant", content: "Response", ts: Date.now() + 1000 },
				],
				{
					contextSize: 1000,
					triggerReason: "manual",
					timestamp: Date.now(),
					taskId: "test-task-status",
				},
			)

			// Wait a bit and check status changes
			await new Promise((resolve) => setTimeout(resolve, 100)).then(() => {})

			expect(statusChanges).toContain("waiting")
			expect(statusChanges).toContain("completed")
		})

		it("should get current status", () => {
			const status = manualReviewManager.getStatus()
			expect(status.state).toBe("idle")
			expect(status.timeoutDuration).toBe(5 * 60 * 1000)
		})

		it("should check if review is active", async () => {
			expect(manualReviewManager.isActive()).toBe(false)

			await manualReviewManager.startManualReview([{ role: "user", content: "Test", ts: Date.now() }], {
				contextSize: 1000,
				triggerReason: "manual",
				timestamp: Date.now(),
				taskId: "test-task-active",
			})

			expect(manualReviewManager.isActive()).toBe(true)
		})

		it("should dispose properly", () => {
			expect(manualReviewManager.getStatus().state).toBe("idle")

			manualReviewManager.dispose()

			// Should not throw error when calling methods after disposal
			expect(() => manualReviewManager.getStatus()).not.toThrow()
			expect(() =>
				manualReviewManager.startManualReview([], {
					contextSize: 1000,
					triggerReason: "manual",
					timestamp: Date.now(),
					taskId: "test-task-dispose",
				}),
			).rejects.toThrow("Manual review already in progress")
		})
	})
})
