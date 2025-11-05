import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import * as fs from "fs/promises"
import * as path from "path"
import { ContextFileManager, type ContextFileMetadata } from "../context-file-manager"

describe("ContextFileManager (Simple)", () => {
	let contextFileManager: ContextFileManager
	let tempDir: string

	beforeEach(() => {
		tempDir = path.join(__dirname, "temp-context-review-simple")
		contextFileManager = new ContextFileManager(tempDir)
	})

	afterEach(async () => {
		// Clean up temp directory
		try {
			await fs.rm(tempDir, { recursive: true, force: true })
		} catch (error) {
			console.error("Failed to clean up temp directory:", error)
		}
	})

	describe("Basic Functionality", () => {
		it("should create context file with correct structure", async () => {
			const messages = [
				{ role: "user" as const, content: "Test message", ts: 1000 },
				{ role: "assistant" as const, content: "Test response", ts: 2000 },
			]

			const metadata: ContextFileMetadata = {
				contextSize: 1000,
				triggerReason: "manual",
				timestamp: new Date("2023-01-15T10:30:00.000Z").getTime(),
				taskId: "test-task-123",
			}

			const filepath = await contextFileManager.createContextFile(messages, metadata)

			// Verify file was created
			const stats = await fs.stat(filepath)
			expect(stats.isFile()).toBe(true)

			// Verify file content exists
			const content = await fs.readFile(filepath, "utf-8")
			expect(content).toContain("# Context Review File")
			expect(content).toContain("**Task ID**: test-task-123")
			expect(content).toContain("**Context Size**: 1000 tokens")
			expect(content).toContain("**Trigger Reason**: manual")
			expect(content).toContain("Test message")
			expect(content).toContain("Test response")
		})

		it("should generate correct filename format", () => {
			const timestamp = new Date("2023-01-15T10:30:00.000Z").getTime()
			const filename = (contextFileManager as any)["generateFilename"](timestamp)

			// Should match format: YYYY-MM-DDTHH-MM-SS-context.md (ISO format with T)
			const expectedPattern = /^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-context\.md$/
			expect(expectedPattern.test(filename)).toBe(true)
		})

		it("should format metadata correctly", () => {
			const metadata: ContextFileMetadata = {
				contextSize: 1500,
				triggerReason: "automatic",
				timestamp: new Date("2023-01-15T10:30:00.000Z").getTime(),
				taskId: "task-456",
			}

			const formatted = (contextFileManager as any)["formatMetadata"](metadata)

			expect(formatted).toContain("# Context Review File")
			expect(formatted).toContain("## Metadata")
			expect(formatted).toContain("**Task ID**: task-456")
			expect(formatted).toContain("**Created**: 2023-01-15T10:30:00.000Z")
			expect(formatted).toContain("**Context Size**: 1500 tokens")
			expect(formatted).toContain("**Trigger Reason**: automatic")
			expect(formatted).toContain("**Status**: Pending Review")
		})

		it("should format messages as markdown correctly", () => {
			const messages = [
				{ role: "user" as const, content: "Hello world", ts: 1000 },
				{ role: "assistant" as const, content: "Hi there!", ts: 2000 },
			]

			const formatted = (contextFileManager as any)["formatMessagesAsMarkdown"](messages)

			expect(formatted).toContain("### 👤 User (1970-01-01T00:00:01.000Z)")
			expect(formatted).toContain("Hello world")
			expect(formatted).toContain("### 🤖 Assistant (1970-01-01T00:00:02.000Z)")
			expect(formatted).toContain("Hi there!")
		})

		it("should provide context review directory path", () => {
			const contextDir = contextFileManager.getContextReviewDir()
			expect(contextDir).toContain(".context-review")
			expect(contextDir).toContain(tempDir)
		})
	})
})
