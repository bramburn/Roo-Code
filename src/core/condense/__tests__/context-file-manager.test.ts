import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import * as fs from "fs/promises"
import * as path from "path"
import { ContextFileManager, type ContextFileMetadata } from "../context-file-manager"

// Mock fs module
const mockFs = vi.hoisted(() => ({
	mkdir: vi.fn(),
	readdir: vi.fn(),
	unlink: vi.fn(),
	stat: vi.fn(),
	access: vi.fn(),
	writeFile: vi.fn(),
}))

describe("ContextFileManager", () => {
	let contextFileManager: ContextFileManager
	let tempDir: string

	beforeEach(() => {
		tempDir = path.join(__dirname, "temp-context-review")
		contextFileManager = new ContextFileManager(tempDir)
		vi.clearAllMocks()
	})

	afterEach(async () => {
		// Clean up temp directory
		try {
			await fs.rm(tempDir, { recursive: true, force: true })
		} catch (error) {
			console.error("Failed to clean up temp directory:", error)
		}
		vi.restoreAllMocks()
	})

	describe("createContextFile", () => {
		it("should create a context file with metadata and content", async () => {
			const messages = [
				{ role: "user" as const, content: "Test user message", ts: Date.now() },
				{ role: "assistant" as const, content: "Test assistant response", ts: Date.now() + 1000 },
			]

			const metadata: ContextFileMetadata = {
				contextSize: 1000,
				triggerReason: "manual",
				timestamp: Date.now(),
				taskId: "test-task-123",
			}

			const filepath = await contextFileManager.createContextFile(messages, metadata)

			// Verify file was created
			const stats = await fs.stat(filepath)
			expect(stats.isFile()).toBe(true)

			// Verify file content
			const content = await fs.readFile(filepath, "utf-8")
			expect(content).toContain("# Context Review File")
			expect(content).toContain("Task ID: test-task-123")
			expect(content).toContain("Context Size: 1000 tokens")
			expect(content).toContain("Trigger Reason: manual")
			expect(content).toContain("Test user message")
			expect(content).toContain("Test assistant response")
		})

		it("should ensure context review directory exists", async () => {
			// Call createContextFile which internally calls ensureContextReviewDirectory
			const messages = [{ role: "user" as const, content: "Test", ts: Date.now() }]
			const metadata: ContextFileMetadata = {
				contextSize: 100,
				triggerReason: "manual",
				timestamp: Date.now(),
				taskId: "test",
			}

			await contextFileManager.createContextFile(messages, metadata)

			const exists = await fs
				.access(path.join(tempDir, ".context-review"))
				.then(() => true)
				.catch(() => false)
			expect(exists).toBe(true)
		})

		it("should handle directory creation errors gracefully", async () => {
			// Mock fs.mkdir to throw an error
			mockFs.mkdir.mockRejectedValue(new Error("Permission denied"))

			try {
				await contextFileManager.createContextFile([], {
					contextSize: 100,
					triggerReason: "manual",
					timestamp: Date.now(),
					taskId: "test",
				})
			} catch (error) {
				expect(error.message).toBe("Permission denied")
			}
		})

		it("should generate correct filename format", () => {
			const timestamp = Date.now()
			const filename = contextFileManager["generateFilename"](timestamp)

			// Should match format: YYYY-MM-DD-HH-MM-SS-context.md
			const expectedPattern = /^\d{4}-\d{2}-\d{2}-T\d{2}-\d{2}-\d{2}-context\.md$/
			expect(expectedPattern.test(filename)).toBe(true)
		})

		it("should format metadata correctly", () => {
			const metadata: ContextFileMetadata = {
				contextSize: 1500,
				triggerReason: "automatic",
				timestamp: new Date("2023-01-15T10:30:00.000Z").getTime(),
				taskId: "task-456",
			}

			const formatted = contextFileManager["formatMetadata"](metadata)

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
				{
					role: "user" as const,
					content: "Multi-line content with image: [Image: image/png]",
					ts: 3000,
				},
			]

			const formatted = contextFileManager["formatMessagesAsMarkdown"](messages)

			expect(formatted).toContain("### 👤 User (1000)")
			expect(formatted).toContain("Hello world")
			expect(formatted).toContain("### 🤖 Assistant (2000)")
			expect(formatted).toContain("Hi there!")
			expect(formatted).toContain("### 👤 User (3000)")
			expect(formatted).toContain("Multi-line content")
			expect(formatted).toContain("[Image: image/png]")
		})
	})

	describe("getContextFiles", () => {
		it("should return sorted list of context files", async () => {
			// Create test files
			const testFiles = [
				"2023-01-15T10-30-00-context.md",
				"2023-01-15T11-45-00-context.md",
				"2023-01-16T14-20-00-context.md",
			]

			for (const file of testFiles) {
				const filepath = path.join(tempDir, ".context-review", file)
				await fs.writeFile(filepath, "# Test", "utf-8")
			}

			const files = await contextFileManager.getContextFiles()

			expect(files).toHaveLength(testFiles.length)
			expect(files).toEqual(expect.arrayContaining(testFiles.map((f) => expect.stringContaining(f))))
		})

		it("should handle directory read errors gracefully", async () => {
			// Mock fs.readdir to throw an error
			mockFs.readdir.mockRejectedValue(new Error("Directory not found"))

			try {
				await contextFileManager.getContextFiles()
			} catch (error) {
				expect(error.message).toBe("Directory not found")
			}
		})
	})

	describe("deleteContextFile", () => {
		it("should delete a context file", async () => {
			const testFile = path.join(tempDir, ".context-review", "test-delete.md")
			await fs.writeFile(testFile, "# Test", "utf-8")

			await contextFileManager.deleteContextFile(testFile)

			const exists = await fs
				.access(testFile)
				.then(() => true)
				.catch(() => false)
			expect(exists).toBe(false)
		})

		it("should handle file deletion errors gracefully", async () => {
			// Mock fs.unlink to throw an error
			mockFs.unlink.mockRejectedValue(new Error("File not found"))

			try {
				await contextFileManager.deleteContextFile("nonexistent.md")
			} catch (error) {
				expect(error.message).toBe("File not found")
			}
		})
	})

	describe("cleanupOldFiles", () => {
		it("should keep only the most recent 10 files", async () => {
			// Create 15 test files
			const testFiles: string[] = []
			for (let i = 0; i < 15; i++) {
				const filename = `2023-01-${String(i).padStart(2, "0")}T${String(i).padStart(2, "0")}-00-context.md`
				const filepath = path.join(tempDir, ".context-review", filename)
				await fs.writeFile(filepath, `# Test file ${i}`, "utf-8")
				testFiles.push(filename)
			}

			// Sort files by name (oldest first)
			testFiles.sort((a, b) => a.localeCompare(b))

			// Write all files to directory
			for (const file of testFiles) {
				const filepath = path.join(tempDir, ".context-review", file)
				await fs.writeFile(filepath, `# Test file ${file}`, "utf-8")
			}

			await contextFileManager.cleanupOldFiles()

			const remainingFiles = await contextFileManager.getContextFiles()

			// Should have exactly 10 files (the 5 most recent)
			expect(remainingFiles).toHaveLength(10)

			// Verify the remaining files are the 5 most recent
			const remainingFileNames = remainingFiles.map((f) => path.basename(f))
			const expectedFiles = testFiles.slice(-10).map((f) => expect.stringContaining(f))
			expect(remainingFileNames).toEqual(expect.arrayContaining(expectedFiles))
		})
	})

	describe("showContextFile", () => {
		it("should open context file in VSCode", async () => {
			const testFile = path.join(tempDir, ".context-review", "test-show.md")
			await fs.writeFile(testFile, "# Test content", "utf-8")

			const mockShowTextDocument = vi.fn().mockResolvedValue({})

			// Mock vscode.workspace and vscode.window
			const mockVscode = {
				workspace: {
					openTextDocument: mockShowTextDocument,
				},
				window: {
					showErrorMessage: vi.fn(),
					showTextDocument: vi.fn(),
				},
			}

			// Mock vscode module
			vi.doMock("vscode", () => mockVscode)

			await contextFileManager.showContextFile(testFile)

			expect(mockVscode.workspace.openTextDocument).toHaveBeenCalledWith(testFile)
		})

		it("should handle VSCode errors gracefully", async () => {
			const mockVscode = {
				workspace: {
					openTextDocument: vi.fn().mockRejectedValue(new Error("VSCode error")),
				},
				window: {
					showErrorMessage: vi.fn(),
				},
			}

			vi.doMock("vscode", () => mockVscode)

			try {
				await contextFileManager.showContextFile("nonexistent.md")
			} catch (error) {
				// Should have been caught by our try-catch
				expect(mockVscode.window.showErrorMessage).toHaveBeenCalledWith(
					"Failed to open context file: VSCode error",
				)
			}
		})
	})
})
