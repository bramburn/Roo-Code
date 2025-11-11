import { z } from "zod"

/**
 * Zod schema for readFile tool parameters
 */
export const ReadFileSchema = z
	.object({
		path: z
			.string()
			.min(1, "File path cannot be empty")
			.refine((path) => !path.includes(".."), {
				message: "Path traversal (..) is not allowed",
			}),
		start_line: z.coerce
			.number()
			.int("Start line must be an integer")
			.min(1, "Start line must be at least 1")
			.optional(),
		end_line: z.coerce
			.number()
			.int("End line must be an integer")
			.min(-1, "End line must be -1 or a positive integer")
			.optional(),
		include_line_numbers: z.coerce.boolean().optional().default(false),
	})
	.refine(
		(data) => {
			// Custom validation: if both start_line and end_line are provided, ensure start_line <= end_line
			if (data.start_line !== undefined && data.end_line !== undefined && data.end_line !== -1) {
				return data.start_line <= data.end_line
			}
			return true
		},
		{
			message: "Start line must be less than or equal to end line",
			path: ["start_line"],
		},
	)
	.describe("Read content from a file with optional line range and line number display")

export type ReadFileInput = z.infer<typeof ReadFileSchema>

/**
 * Strict validation schema for file paths
 */
export const ReadFilePathValidation = z.object({
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
 * Line range validation schema
 */
export const LineRangeValidation = z
	.object({
		start_line: z.coerce
			.number()
			.int("Start line must be an integer")
			.min(1, "Start line must be at least 1")
			.max(1_000_000, "Start line is too large (max 1,000,000)")
			.optional(),
		end_line: z.coerce
			.number()
			.int("End line must be an integer")
			.min(-1, "End line must be -1 or a positive integer")
			.max(1_000_000, "End line is too large (max 1,000,000)")
			.optional(),
	})
	.refine(
		(data) => {
			// Validate line range
			if (data.start_line !== undefined && data.end_line !== undefined && data.end_line !== -1) {
				return data.start_line <= data.end_line
			}
			return true
		},
		{
			message: "Start line must be less than or equal to end line",
			path: ["start_line"],
		},
	)

/**
 * Combined strict validation schema
 */
export const ReadFileStrictSchema = z
	.object({
		path: z
			.string()
			.min(1, "File path is required")
			.refine(
				(path) => {
					return !path.includes("..") && !path.startsWith("~")
				},
				{
					message: "Invalid file path: path traversal and home directory shortcuts are not allowed",
				},
			)
			.refine(
				(path) => {
					const invalidChars = /[<>:"|?*]/
					return !invalidChars.test(path)
				},
				{
					message: "File path contains invalid characters",
				},
			)
			.refine(
				(path) => {
					return path.length <= 260
				},
				{
					message: "File path is too long (max 260 characters)",
				},
			),
		start_line: z.coerce
			.number()
			.int("Start line must be an integer")
			.min(1, "Start line must be at least 1")
			.max(1_000_000, "Start line is too large (max 1,000,000)")
			.optional(),
		end_line: z.coerce
			.number()
			.int("End line must be an integer")
			.min(-1, "End line must be -1 or a positive integer")
			.max(1_000_000, "End line is too large (max 1,000,000)")
			.optional(),
		include_line_numbers: z.coerce.boolean().optional().default(false),
	})
	.strict() // Only allow defined properties

/**
 * Line range presets for common use cases
 */
export const LineRangePresets = {
	FIRST_10_LINES: { start_line: 1, end_line: 10 },
	FIRST_50_LINES: { start_line: 1, end_line: 50 },
	FIRST_100_LINES: { start_line: 1, end_line: 100 },
	LAST_10_LINES: { start_line: -10, end_line: -1 },
	LAST_50_LINES: { start_line: -50, end_line: -1 },
	FULL_FILE: { start_line: undefined, end_line: undefined },
} as const
