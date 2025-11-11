import { describe, test, expect } from "vitest"
import { WriteToFileSchema, WriteToFileStrictSchema } from "../../../tools/schemas/WriteToFileSchema"

describe("WriteToFileSchema", () => {
	describe("Basic Validation", () => {
		test("should validate correct input", () => {
			const validInput = {
				path: "test.txt",
				content: "Hello, World!",
				line_count: 3,
			}

			const result = WriteToFileSchema.safeParse(validInput)
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data).toEqual(validInput)
			}
		})

		test("should reject empty path", () => {
			const invalidInput = {
				path: "",
				content: "Hello, World!",
			}

			const result = WriteToFileSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
			if (!result.success) {
				expect(result.error.issues.some((issue) => issue.message.includes("File path cannot be empty"))).toBe(
					true,
				)
			}
		})

		test("should reject empty content", () => {
			const invalidInput = {
				path: "test.txt",
				content: "",
			}

			const result = WriteToFileSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
			if (!result.success) {
				expect(result.error.issues.some((issue) => issue.message.includes("Content cannot be empty"))).toBe(
					true,
				)
			}
		})

		test("should accept optional line_count", () => {
			const inputWithoutLineCount = {
				path: "test.txt",
				content: "Hello, World!",
			}

			const result = WriteToFileSchema.safeParse(inputWithoutLineCount)
			expect(result.success).toBe(true)
		})

		test("should coerce line_count to number", () => {
			const inputWithStringNumber = {
				path: "test.txt",
				content: "Hello, World!",
				line_count: "5", // String that should be converted to number
			}

			const result = WriteToFileSchema.safeParse(inputWithStringNumber)
			expect(result.success).toBe(true)
			if (result.success) {
				expect(typeof result.data.line_count).toBe("number")
				expect(result.data.line_count).toBe(5)
			}
		})
	})

	describe("Security Validation", () => {
		test("should reject path traversal attempts", () => {
			const dangerousPaths = [
				{ path: "../../../etc/passwd", content: "test" },
				{ path: "../..", content: "test" },
				{ path: "folder/../../../etc/passwd", content: "test" },
			]

			for (const input of dangerousPaths) {
				const result = WriteToFileSchema.safeParse(input)
				expect(result.success).toBe(false)
				if (!result.success) {
					expect(result.error.issues.some((issue) => issue.message.includes("Path traversal"))).toBe(true)
				}
			}
		})

		test("should reject home directory shortcuts", () => {
			const homePaths = [
				{ path: "~/.ssh/id_rsa", content: "test" },
				{ path: "~/Documents/file.txt", content: "test" },
				{ path: "~root/.bashrc", content: "test" },
			]

			for (const input of homePaths) {
				const result = WriteToFileSchema.safeParse(input)
				expect(result.success).toBe(false)
				if (!result.success) {
					expect(result.error.issues.some((issue) => issue.message.includes("Path traversal"))).toBe(true)
				}
			}
		})

		test("should reject paths with invalid characters", () => {
			const invalidPaths = [
				{ path: "file<name.txt", content: "test" },
				{ path: "file>name.txt", content: "test" },
				{ path: 'file"name.txt', content: "test" },
				{ path: "file|name.txt", content: "test" },
				{ path: "file?name.txt", content: "test" },
				{ path: "file*.txt", content: "test" },
			]

			for (const input of invalidPaths) {
				const result = WriteToFileStrictSchema.safeParse(input)
				expect(result.success).toBe(false)
				if (!result.success) {
					expect(result.error.issues.some((issue) => issue.message.includes("invalid characters"))).toBe(true)
				}
			}
		})

		test("should reject extremely long paths", () => {
			const longPath = "a".repeat(261) + ".txt"
			const input = { path: longPath, content: "test" }

			const result = WriteToFileStrictSchema.safeParse(input)
			expect(result.success).toBe(false)
			if (!result.success) {
				expect(result.error.issues.some((issue) => issue.message.includes("too long"))).toBe(true)
			}
		})
	})

	describe("Content Validation", () => {
		test("should reject content with null bytes", () => {
			const input = {
				path: "test.txt",
				content: "test\u0000content",
			}

			const result = WriteToFileStrictSchema.safeParse(input)
			expect(result.success).toBe(false)
			if (!result.success) {
				expect(result.error.issues.some((issue) => issue.message.includes("null characters"))).toBe(true)
			}
		})

		test("should reject extremely large content", () => {
			const largeContent = "x".repeat(10_000_001) // 10MB + 1 byte
			const input = { path: "test.txt", content: largeContent }

			const result = WriteToFileStrictSchema.safeParse(input)
			expect(result.success).toBe(false)
			if (!result.success) {
				expect(result.error.issues.some((issue) => issue.message.includes("too large"))).toBe(true)
			}
		})
	})

	describe("Line Count Validation", () => {
		test("should accept valid line counts", () => {
			const validInputs = [
				{ path: "test.txt", content: "test", line_count: 0 },
				{ path: "test.txt", content: "test", line_count: 1 },
				{ path: "test.txt", content: "test", line_count: 100 },
				{ path: "test.txt", content: "test", line_count: 1000000 },
			]

			for (const input of validInputs) {
				const result = WriteToFileStrictSchema.safeParse(input)
				expect(result.success).toBe(true)
			}
		})

		test("should reject negative line counts", () => {
			const input = {
				path: "test.txt",
				content: "test",
				line_count: -1,
			}

			const result = WriteToFileStrictSchema.safeParse(input)
			expect(result.success).toBe(false)
			if (!result.success) {
				expect(result.error.issues.some((issue) => issue.message.includes("non-negative"))).toBe(true)
			}
		})

		test("should reject extremely large line counts", () => {
			const input = {
				path: "test.txt",
				content: "test",
				line_count: 1000001,
			}

			const result = WriteToFileStrictSchema.safeParse(input)
			expect(result.success).toBe(false)
			if (!result.success) {
				expect(result.error.issues.some((issue) => issue.message.includes("too large"))).toBe(true)
			}
		})

		test("should reject non-integer line counts", () => {
			const invalidInputs = [
				{ path: "test.txt", content: "test", line_count: 3.14 },
				{ path: "test.txt", content: "test", line_count: NaN },
				{ path: "test.txt", content: "test", line_count: Infinity },
			]

			for (const input of invalidInputs) {
				const result = WriteToFileStrictSchema.safeParse(input)
				expect(result.success).toBe(false)
				if (!result.success) {
					expect(result.error.issues.some((issue) => issue.message.includes("integer"))).toBe(true)
				}
			}
		})
	})

	describe("Type Safety", () => {
		test("should maintain correct types after validation", () => {
			const input = {
				path: "test.txt",
				content: "Hello, World!",
				line_count: 5,
			}

			const result = WriteToFileSchema.safeParse(input)
			expect(result.success).toBe(true)
			if (result.success) {
				expect(typeof result.data.path).toBe("string")
				expect(typeof result.data.content).toBe("string")
				expect(typeof result.data.line_count).toBe("number")
			}
		})

		test("should handle undefined optional fields", () => {
			const input = {
				path: "test.txt",
				content: "Hello, World!",
				// line_count is undefined
			}

			const result = WriteToFileSchema.safeParse(input)
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.line_count).toBeUndefined()
			}
		})
	})
})
