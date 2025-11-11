import { z } from "zod"

/**
 * Zod schema for writeToFile tool parameters
 */
export const WriteToFileSchema = z
	.object({
		path: z
			.string()
			.min(1, "File path cannot be empty")
			.refine((path) => !path.includes(".."), {
				message: "Path traversal (..) is not allowed",
			}),
		content: z.string().min(1, "Content cannot be empty"),
		line_count: z.coerce
			.number()
			.int("Line count must be an integer")
			.min(0, "Line count must be non-negative")
			.optional(),
	})
	.describe("Write content to a file with proper validation")

export type WriteToFileInput = z.infer<typeof WriteToFileSchema>

/**
 * Additional validation rules for file paths
 */
export const FilePathValidation = z.object({
	path: z
		.string()
		.min(1, "File path is required")
		.refine(
			(path) => {
				// Check for path traversal attempts
				return !path.includes("..") && !path.startsWith("~")
			},
			{
				message: "Invalid file path: path traversal and home directory shortcuts are not allowed",
			},
		)
		.refine(
			(path) => {
				// Check for invalid characters in Windows paths
				const invalidChars = /[<>:"|?*]/
				return !invalidChars.test(path)
			},
			{
				message: "File path contains invalid characters",
			},
		)
		.refine(
			(path) => {
				// Check for extremely long paths
				return path.length <= 260
			},
			{
				message: "File path is too long (max 260 characters)",
			},
		),
})

/**
 * Content validation rules
 */
export const ContentValidation = z.object({
	content: z
		.string()
		.min(1, "Content cannot be empty")
		.max(10_000_000, "Content is too large (max 10MB)")
		.refine(
			(content) => {
				// Check for null bytes
				return !content.includes("\u0000")
			},
			{
				message: "Content contains invalid null characters",
			},
		),
})

/**
 * Combined validation schema
 */
export const WriteToFileStrictSchema = z
	.object({
		path: FilePathValidation.shape.path,
		content: ContentValidation.shape.content,
		line_count: z.coerce
			.number()
			.int("Line count must be an integer")
			.min(0, "Line count must be non-negative")
			.max(1_000_000, "Line count is too large (max 1,000,000)")
			.optional(),
	})
	.strict() // Only allow defined properties
