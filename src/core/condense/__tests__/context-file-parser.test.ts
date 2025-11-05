import { ContextFileParser, type ParsedContextFile, type ContextFileValidationResult } from "../context-file-parser"
import { ApiMessage } from "../../task-persistence/apiMessages"
import * as fs from "fs/promises"

// Mock fs module
const mockReadFile = vi.fn()
const mockStat = vi.fn()

// @ts-ignore - Mocking fs/promises for testing
vi.mock("fs/promises", () => ({
	readFile: mockReadFile,
	stat: mockStat,
}))

describe("ContextFileParser", () => {
	let parser: ContextFileParser

	beforeEach(() => {
		parser = new ContextFileParser()
		mockReadFile.mockClear()
		mockStat.mockClear()
	})

	describe("parseContextFile", () => {
		const validContextFile = `---
# Context Review File

## Metadata
- **Task ID**: test-task-123
- **Created**: 2025-01-01T00:00:00.000Z
- **Context Size**: 1000 tokens
- **Trigger Reason**: manual
- **Status**: Pending Review

---

## Context Content

### 👤 User (2025-01-01T00:00:00.000Z)
Hello, how are you?

---

### 🤖 Assistant (2025-01-01T00:00:01.000Z)
I'm doing well, thank you for asking!

---

### 👤 User (2025-01-01T00:00:02.000Z)
Can you help me with a coding task?

---

### 🤖 Assistant (2025-01-01T00:00:03.000Z)
Of course! I'd be happy to help you with your coding task.
`

		it("should parse valid context file correctly", async () => {
			mockReadFile.mockResolvedValue(validContextFile)

			const result = await parser.parseContextFile("/path/to/context.md")

			expect(result).toMatchObject({
				metadata: {
					taskId: "test-task-123",
					timestamp: new Date("2025-01-01T00:00:00.000Z").getTime(),
					contextSize: 1000,
					triggerReason: "manual",
				},
				messages: [
					{
						role: "user",
						content: "Hello, how are you?",
						ts: new Date("2025-01-01T00:00:00.000Z").getTime(),
					},
					{
						role: "assistant",
						content: "I'm doing well, thank you for asking!",
						ts: new Date("2025-01-01T00:00:01.000Z").getTime(),
					},
					{
						role: "user",
						content: "Can you help me with a coding task?",
						ts: new Date("2025-01-01T00:00:02.000Z").getTime(),
					},
					{
						role: "assistant",
						content: "Of course! I'd be happy to help you with your coding task.",
						ts: new Date("2025-01-01T00:00:03.000Z").getTime(),
					},
				],
				content: expect.stringContaining("## Context Content"),
				rawContent: validContextFile,
			})
		})

		it("should handle files with image content", async () => {
			const fileWithImages = `---
# Context Review File

## Metadata
- **Task ID**: test-task-456
- **Created**: 2025-01-01T00:00:00.000Z
- **Context Size**: 1500 tokens
- **Trigger Reason**: manual
- **Status**: Pending Review

---

## Context Content

### 👤 User (2025-01-01T00:00:00.000Z)
Here's an image of my code:

[Image: image/png]

And here's some text after the image.

---

### 🤖 Assistant (2025-01-01T00:00:01.000Z)
I can see you shared an image. Let me help you with that.
`

			mockReadFile.mockResolvedValue(fileWithImages)

			const result = await parser.parseContextFile("/path/to/context.md")

			expect(result.messages).toHaveLength(2)
			expect(result.messages[0]).toMatchObject({
				role: "user",
				content: [
					{ type: "text", text: "Here's an image of my code:\n\nAnd here's some text after the image." },
					{ type: "image", source: { media_type: "image/png" } },
				],
				ts: new Date("2025-01-01T00:00:00.000Z").getTime(),
			})
		})

		it("should throw error for missing file", async () => {
			const fileNotFoundError = new Error("File not found") as any
			fileNotFoundError.code = "ENOENT"
			mockReadFile.mockRejectedValue(fileNotFoundError)

			await expect(parser.parseContextFile("/nonexistent/file.md")).rejects.toThrow(
				"Context file not found: /nonexistent/file.md",
			)
		})

		it("should throw error for permission denied", async () => {
			const permissionError = new Error("Permission denied") as any
			permissionError.code = "EACCES"
			mockReadFile.mockRejectedValue(permissionError)

			await expect(parser.parseContextFile("/restricted/file.md")).rejects.toThrow(
				"Permission denied reading context file: /restricted/file.md",
			)
		})

		it("should throw error for invalid YAML frontmatter", async () => {
			const invalidYaml = `---
# Context Review File

## Metadata
- **Task ID**: test-task-123
- **Created**: invalid-date
- **Context Size**: 1000 tokens
- **Trigger Reason**: manual

---

## Context Content

### 👤 User
Hello world
`

			mockReadFile.mockResolvedValue(invalidYaml)

			await expect(parser.parseContextFile("/path/to/invalid.md")).rejects.toThrow(
				"Missing Created timestamp in metadata",
			)
		})

		it("should throw error for missing YAML frontmatter", async () => {
			const noFrontmatter = `## Context Content

### 👤 User
Hello world
`

			mockReadFile.mockResolvedValue(noFrontmatter)

			await expect(parser.parseContextFile("/path/to/no-frontmatter.md")).rejects.toThrow(
				"Context file must start with YAML frontmatter",
			)
		})
	})

	describe("validateContextFile", () => {
		const validParsedFile: ParsedContextFile = {
			metadata: {
				taskId: "test-task-123",
				timestamp: Date.now(),
				contextSize: 1000,
				triggerReason: "manual",
			},
			messages: [
				{ role: "user" as const, content: "Hello", ts: Date.now() },
				{ role: "assistant" as const, content: "Hi there!", ts: Date.now() },
			],
			content: "Some content",
			rawContent: "Raw content",
		}

		it("should validate a correct context file", () => {
			const result = parser.validateContextFile(validParsedFile)

			expect(result.isValid).toBe(true)
			expect(result.errors).toHaveLength(0)
		})

		it("should detect missing task ID", () => {
			const invalidFile = {
				...validParsedFile,
				metadata: { ...validParsedFile.metadata, taskId: "" },
			}

			const result = parser.validateContextFile(invalidFile)

			expect(result.isValid).toBe(false)
			expect(result.errors).toContain("Missing task ID in metadata")
		})

		it("should detect missing timestamp", () => {
			const invalidFile = {
				...validParsedFile,
				metadata: { ...validParsedFile.metadata, timestamp: 0 },
			}

			const result = parser.validateContextFile(invalidFile)

			expect(result.isValid).toBe(false)
			expect(result.errors).toContain("Missing timestamp in metadata")
		})

		it("should detect invalid context size", () => {
			const invalidFile = {
				...validParsedFile,
				metadata: { ...validParsedFile.metadata, contextSize: 0 },
			}

			const result = parser.validateContextFile(invalidFile)

			expect(result.isValid).toBe(false)
			expect(result.errors).toContain("Invalid context size in metadata")
		})

		it("should detect invalid trigger reason", () => {
			const invalidFile = {
				...validParsedFile,
				metadata: { ...validParsedFile.metadata, triggerReason: "invalid" as any },
			}

			const result = parser.validateContextFile(invalidFile)

			expect(result.isValid).toBe(false)
			expect(result.errors).toContain("Invalid trigger reason in metadata")
		})

		it("should detect missing messages", () => {
			const invalidFile = {
				...validParsedFile,
				messages: [],
			}

			const result = parser.validateContextFile(invalidFile)

			expect(result.isValid).toBe(false)
			expect(result.errors).toContain("No messages found in context file")
		})

		it("should detect invalid message role", () => {
			const invalidFile = {
				...validParsedFile,
				messages: [{ role: "invalid" as "user" | "assistant", content: "Hello", ts: Date.now() }],
			}

			const result = parser.validateContextFile(invalidFile)

			expect(result.isValid).toBe(false)
			expect(result.errors).toContain("Invalid message role at index 0: invalid")
		})

		it("should detect empty message content", () => {
			const invalidFile = {
				...validParsedFile,
				messages: [{ role: "user" as const, content: "", ts: Date.now() }],
			}

			const result = parser.validateContextFile(invalidFile)

			expect(result.isValid).toBe(false)
			expect(result.errors).toContain("Empty message content at index 0")
		})

		it("should generate warnings for large files", () => {
			const largeFile = {
				...validParsedFile,
				messages: Array(60)
					.fill(null)
					.map((_, i) => ({
						role: "user" as const,
						content: `Message ${i}`,
						ts: Date.now(),
					})),
				rawContent: "x".repeat(2000000), // 2MB
			}

			const result = parser.validateContextFile(largeFile)

			expect(result.warnings).toContain("Large number of messages may impact performance")
			expect(result.warnings).toContain("Very large context file may be slow to process")
		})
	})

	describe("fileExists", () => {
		it("should return true for existing file", async () => {
			mockStat.mockResolvedValue({
				isFile: () => true,
			} as any)

			const exists = await parser.fileExists("/existing/file.md")

			expect(exists).toBe(true)
		})

		it("should return false for non-existing file", async () => {
			const fileNotFoundError = new Error("File not found") as any
			fileNotFoundError.code = "ENOENT"
			mockStat.mockRejectedValue(fileNotFoundError)

			const exists = await parser.fileExists("/nonexistent/file.md")

			expect(exists).toBe(false)
		})
	})

	describe("getFileStats", () => {
		it("should return file stats for existing file", async () => {
			const mockStats = {
				size: 1024,
				mtime: new Date("2025-01-01T00:00:00.000Z"),
			}
			mockStat.mockResolvedValue(mockStats as any)

			const stats = await parser.getFileStats("/path/to/file.md")

			expect(stats).toEqual({
				size: 1024,
				modified: mockStats.mtime.getTime(),
			})
		})

		it("should throw error for file stat failure", async () => {
			const statError = new Error("Stat failed")
			mockStat.mockRejectedValue(statError)

			await expect(parser.getFileStats("/path/to/file.md")).rejects.toThrow(
				"Failed to get file stats for /path/to/file.md: Error: Stat failed",
			)
		})
	})
})
