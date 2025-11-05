import { ContextLoader, type ContextLoadingResult, type TokenComparison } from "../../core/condense/context-loader"
import { ContextFileManager, type ContextFileMetadata } from "../../core/condense/context-file-manager"
import { ContextFileParser } from "../../core/condense/context-file-parser"
import { ApiHandler } from "../../api"
import { ApiMessage } from "../../core/task-persistence/apiMessages"
import * as fs from "fs/promises"
import * as path from "path"

// Mock dependencies
vi.mock("fs/promises")

import { readFile, writeFile, mkdir } from "fs/promises"

const mockReadFile = vi.mocked(readFile)
const mockWriteFile = vi.mocked(writeFile)
const mockMkdir = vi.mocked(mkdir)

// Mock ApiHandler
const mockApiHandler = {
	countTokens: vi.fn() as any,
	getModel: vi.fn().mockReturnValue({
		id: "test-model",
		info: {
			maxTokens: 200000,
			contextWindow: 200000,
		},
	}),
} as any as ApiHandler

describe("Context Loading Integration Tests", () => {
	let contextLoader: ContextLoader
	let contextFileManager: ContextFileManager
	let contextFileParser: ContextFileParser
	let testWorkspaceRoot: string

	beforeEach(() => {
		contextLoader = new ContextLoader(mockApiHandler)
		contextFileManager = new ContextFileManager("/test/workspace")
		contextFileParser = new ContextFileParser()
		testWorkspaceRoot = "/test/workspace"

		// Clear all mocks
		vi.clearAllMocks()
	})

	describe("Complete Context Loading Workflow", () => {
		const validContextFile = `---
# Context Review File

## Metadata
- **Task ID**: integration-test-123
- **Created**: 2025-01-01T00:00:00.000Z
- **Context Size**: 1500 tokens
- **Trigger Reason**: manual
- **Status**: Pending Review

---

## Context Content

### 👤 User (2025-01-01T00:00:00.000Z)
Help me implement a feature for context loading

---

### 🤖 Assistant (2025-01-01T00:00:01.000Z)
I'll help you implement context loading functionality.

---

### 👤 User (2025-01-01T00:00:02.000Z)
Please create a context file parser

---

### 🤖 Assistant (2025-01-01T00:00:03.000Z)
I'll create a parser that can read and validate context files.
`

		const originalMetadata: ContextFileMetadata = {
			taskId: "integration-test-123",
			timestamp: new Date("2025-01-01T00:00:00.000Z").getTime(),
			contextSize: 1500,
			triggerReason: "manual",
		}

		it("should complete full workflow successfully", async () => {
			// Mock file reading
			mockReadFile.mockResolvedValue(validContextFile)

			// Mock token counting (return 1200 tokens for edited content)
			;(mockApiHandler.countTokens as any).mockResolvedValue(1200)

			const result = await contextLoader.loadContextFile(
				"/test/workspace/.context-review/test-context.md",
				originalMetadata,
			)

			// Verify successful loading
			expect(result.success).toBe(true)
			expect(result.messages).toHaveLength(4)
			expect(result.tokenComparison.originalTokens).toBe(1500)
			expect(result.tokenComparison.editedTokens).toBe(1200)
			expect(result.tokenComparison.tokenDifference).toBe(-300)
			expect(result.tokenComparison.isWithinLimit).toBe(true)
		})

		it("should handle token limit exceeded scenario", async () => {
			// Mock file reading
			mockReadFile.mockResolvedValue(validContextFile)

			// Mock token counting (return 250000 tokens - exceeds limit)
			;(mockApiHandler.countTokens as any).mockResolvedValue(250000)

			const result = await contextLoader.loadContextFile(
				"/test/workspace/.context-review/test-context.md",
				originalMetadata,
				{
					maxTokens: 200000,
					allowExceedLimit: false,
				},
			)

			// Verify failed loading due to limit exceeded
			expect(result.success).toBe(false)
			expect(result.requiresUserAction).toBe(true)
			expect(result.userActionMessage).toContain("Context exceeds maximum token limit by 50000 tokens")
			expect(result.tokenComparison.isWithinLimit).toBe(false)
		})

		it("should provide recovery options for different error scenarios", async () => {
			const recoveryOptions = contextLoader.getRecoveryOptions("Context exceeds token limit")

			expect(recoveryOptions).toHaveLength(4) // Default 3 + 1 specific
			expect(recoveryOptions[0].action).toBe("reduce") // Specific option for token limit
			expect(recoveryOptions[0].label).toBe("Reduce Context Size")
			expect(recoveryOptions[1].action).toBe("edit") // Default option
			expect(recoveryOptions[2].action).toBe("compress") // Default option
			expect(recoveryOptions[3].action).toBe("retry") // Default option
		})
	})

	describe("Token Counting Integration", () => {
		const originalMetadata: ContextFileMetadata = {
			taskId: "test",
			timestamp: Date.now(),
			contextSize: 100,
			triggerReason: "manual",
		}

		it("should count tokens accurately for mixed content", async () => {
			const messages: ApiMessage[] = [
				{
					role: "user",
					content: "Hello world",
					ts: Date.now(),
				},
				{
					role: "assistant",
					content: [
						{ type: "text", text: "Here is some text" },
						{ type: "image", source: { media_type: "image/png", type: "base64", data: "fake-data" } },
					],
					ts: Date.now(),
				},
			]

			// Mock token counting to return different values for different content types
			;(mockApiHandler.countTokens as any)
				.mockResolvedValueOnce(10) // "Hello world"
				.mockResolvedValueOnce(25) // Mixed content

			const result = await contextLoader.loadContextFile("/test/context.md", originalMetadata)

			expect(result.success).toBe(true)
			expect(mockApiHandler.countTokens).toHaveBeenCalledTimes(2)
		})

		it("should format token counts correctly", () => {
			expect(contextLoader.formatTokenCount(500)).toBe("500 tokens")
			expect(contextLoader.formatTokenCount(1500)).toBe("1.5K tokens")
			expect(contextLoader.formatTokenCount(1500000)).toBe("1.5M tokens")
		})

		it("should generate accurate token usage summary", () => {
			const tokenComparison: TokenComparison = {
				originalTokens: 2000,
				editedTokens: 1500,
				tokenDifference: -500,
				percentageChange: -25,
				isWithinLimit: true,
			}

			const summary = contextLoader.getTokenUsageSummary(tokenComparison)

			expect(summary).toContain("Original: 2.0K tokens → Edited: 1.5K tokens")
			expect(summary).toContain("(-500 tokens, -25%)")
		})
	})

	describe("Error Recovery and Validation", () => {
		const originalMetadata: ContextFileMetadata = {
			taskId: "integration-test-123",
			timestamp: new Date("2025-01-01T00:00:00.000Z").getTime(),
			contextSize: 1500,
			triggerReason: "manual",
		}

		it("should handle file not found gracefully", async () => {
			const fileNotFoundError = new Error("File not found") as any
			fileNotFoundError.code = "ENOENT"
			mockReadFile.mockRejectedValue(fileNotFoundError)

			const result = await contextLoader.loadContextFile("/nonexistent/context.md", originalMetadata)

			expect(result.success).toBe(false)
			expect(result.error).toContain("Failed to load context file")
		})

		it("should handle validation errors", async () => {
			const invalidFile = `---
# Context Review File

## Metadata
- **Task ID**: 
- **Created**: invalid-date
- **Context Size**: 0 tokens
- **Trigger Reason**: invalid

---

## Context Content

No messages here
`

			mockReadFile.mockResolvedValue(invalidFile)

			const result = await contextLoader.loadContextFile("/test/invalid.md", originalMetadata)

			expect(result.success).toBe(false)
			expect(result.error).toContain("Context file validation failed")
		})

		it("should provide appropriate recovery options for validation errors", async () => {
			const recoveryOptions = contextLoader.getRecoveryOptions(
				"Context file validation failed: Missing task ID in metadata",
			)

			expect(recoveryOptions[0].action).toBe("fix-validation")
			expect(recoveryOptions[0].label).toBe("Fix Validation Errors")
		})
	})

	describe("Context Window Limits", () => {
		const validContextFile = `---
# Context Review File

## Metadata
- **Task ID**: integration-test-123
- **Created**: 2025-01-01T00:00:00.000Z
- **Context Size**: 1500 tokens
- **Trigger Reason**: manual
- **Status**: Pending Review

---

## Context Content

### 👤 User (2025-01-01T00:00:00.000Z)
Help me implement a feature for context loading

---

### 🤖 Assistant (2025-01-01T00:00:01.000Z)
I'll help you implement context loading functionality.
`

		const originalMetadata: ContextFileMetadata = {
			taskId: "integration-test-123",
			timestamp: new Date("2025-01-01T00:00:00.000Z").getTime(),
			contextSize: 1500,
			triggerReason: "manual",
		}

		it("should get correct context window limits", () => {
			const limits = contextLoader.getContextWindowLimits()

			expect(limits.maxTokens).toBe(200000)
			expect(limits.contextWindow).toBe(200000)
		})

		it("should validate against different limit scenarios", async () => {
			// Test within limits
			mockReadFile.mockResolvedValue(validContextFile)
			;(mockApiHandler.countTokens as any).mockResolvedValue(100000) // Within 200K limit

			const result1 = await contextLoader.loadContextFile("/test/context.md", originalMetadata, {
				maxTokens: 200000,
			})

			expect(result1.success).toBe(true)
			expect(result1.tokenComparison.isWithinLimit).toBe(true)

			// Test approaching limits
			;(mockApiHandler.countTokens as any).mockResolvedValue(180000) // 90% of 200K

			const result2 = await contextLoader.loadContextFile("/test/context.md", originalMetadata, {
				maxTokens: 200000,
			})

			expect(result2.success).toBe(true)
			expect(result2.warnings).toContain("Context is approaching context window limit (90% full)")
		})
	})

	describe("Event Emission", () => {
		const validContextFile = `---
# Context Review File

## Metadata
- **Task ID**: integration-test-123
- **Created**: 2025-01-01T00:00:00.000Z
- **Context Size**: 1500 tokens
- **Trigger Reason**: manual
- **Status**: Pending Review

---

## Context Content

### 👤 User (2025-01-01T00:00:00.000Z)
Help me implement a feature for context loading

---

### 🤖 Assistant (2025-01-01T00:00:01.000Z)
I'll help you implement context loading functionality.
`

		const originalMetadata: ContextFileMetadata = {
			taskId: "integration-test-123",
			timestamp: new Date("2025-01-01T00:00:00.000Z").getTime(),
			contextSize: 1500,
			triggerReason: "manual",
		}

		it("should emit loading events", async () => {
			const loadingStartedSpy = vi.fn()
			const loadingErrorSpy = vi.fn()

			contextLoader.on("loadingStarted", loadingStartedSpy)
			contextLoader.on("loadingError", loadingErrorSpy)

			mockReadFile.mockResolvedValue(validContextFile)
			;(mockApiHandler.countTokens as any).mockResolvedValue(1200)

			await contextLoader.loadContextFile("/test/context.md", originalMetadata)

			expect(loadingStartedSpy).toHaveBeenCalledWith({ filepath: "/test/context.md" })
			expect(loadingErrorSpy).not.toHaveBeenCalled()
		})

		it("should emit error events on failure", async () => {
			const loadingErrorSpy = vi.fn()
			const error = new Error("Test error")

			contextLoader.on("loadingError", loadingErrorSpy)

			mockReadFile.mockRejectedValue(error)

			await contextLoader.loadContextFile("/test/context.md", originalMetadata)

			expect(loadingErrorSpy).toHaveBeenCalledWith({
				filepath: "/test/context.md",
				error,
			})
		})
	})

	describe("Performance and Edge Cases", () => {
		const validContextFile = `---
# Context Review File

## Metadata
- **Task ID**: integration-test-123
- **Created**: 2025-01-01T00:00:00.000Z
- **Context Size**: 1500 tokens
- **Trigger Reason**: manual
- **Status**: Pending Review

---

## Context Content

### 👤 User (2025-01-01T00:00:00.000Z)
Help me implement a feature for context loading

---

### 🤖 Assistant (2025-01-01T00:00:01.000Z)
I'll help you implement context loading functionality.
`

		const originalMetadata: ContextFileMetadata = {
			taskId: "integration-test-123",
			timestamp: new Date("2025-01-01T00:00:00.000Z").getTime(),
			contextSize: 1500,
			triggerReason: "manual",
		}

		it("should handle large context files efficiently", async () => {
			const largeContent = validContextFile + "\n" + "Large content block.\n".repeat(1000)
			mockReadFile.mockResolvedValue(largeContent)
			;(mockApiHandler.countTokens as any).mockResolvedValue(50000)

			const startTime = Date.now()
			const result = await contextLoader.loadContextFile("/test/large.md", originalMetadata)
			const endTime = Date.now()

			expect(result.success).toBe(true)
			expect(endTime - startTime).toBeLessThan(5000) // Should complete within 5 seconds
		})

		it("should handle empty context files", async () => {
			const emptyFile = `---
# Context Review File

## Metadata
- **Task ID**: empty-test
- **Created**: 2025-01-01T00:00:00.000Z
- **Context Size**: 0 tokens
- **Trigger Reason**: manual

---

## Context Content

No messages
`

			mockReadFile.mockResolvedValue(emptyFile)

			const result = await contextLoader.loadContextFile("/test/empty.md", originalMetadata)

			expect(result.success).toBe(false)
			expect(result.error).toContain("No messages found in context file")
		})

		it("should handle malformed YAML gracefully", async () => {
			const malformedYaml = `---
Invalid YAML frontmatter without proper structure

---

## Content
Some content here
`

			mockReadFile.mockResolvedValue(malformedYaml)

			const result = await contextLoader.loadContextFile("/test/malformed.md", originalMetadata)

			expect(result.success).toBe(false)
			expect(result.error).toContain("Failed to load context file")
		})
	})
})
