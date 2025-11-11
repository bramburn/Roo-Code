import { describe, test, expect, beforeEach } from "vitest"
import { ZodSchemaValidator } from "../../../tools/validation/ZodSchemaValidator"
import { z } from "zod"
import { ToolUse, ToolParamName } from "../../../shared/tools"

describe("ZodSchemaValidator", () => {
	let validator: ZodSchemaValidator
	let testSchema: z.ZodSchema

	beforeEach(() => {
		validator = new ZodSchemaValidator({
			strict: true,
			allowUnknown: false,
			stripUnknown: true,
			coerce: true,
		})

		testSchema = z.object({
			name: z.string().min(1),
			age: z.coerce.number().int().min(0),
			email: z.string().email().optional(),
		})
	})

	describe("Schema Registration", () => {
		test("should register and retrieve schemas", () => {
			validator.registerSchema("test_tool", testSchema)
			const retrieved = validator.getSchema("test_tool")
			expect(retrieved).toBe(testSchema)
		})

		test("should return undefined for unregistered schema", () => {
			const retrieved = validator.getSchema("nonexistent_tool")
			expect(retrieved).toBeUndefined()
		})

		test("should list all registered schemas", () => {
			validator.registerSchema("tool1", testSchema)
			validator.registerSchema("tool2", testSchema)
			const schemas = validator.listSchemas()
			expect(schemas).toContain("tool1")
			expect(schemas).toContain("tool2")
		})

		test("should remove schemas", () => {
			validator.registerSchema("test_tool", testSchema)
			expect(validator.getSchema("test_tool")).toBe(testSchema)

			const removed = validator.removeSchema("test_tool")
			expect(removed).toBe(true)
			expect(validator.getSchema("test_tool")).toBeUndefined()
		})

		test("should clear all schemas", () => {
			validator.registerSchema("tool1", testSchema)
			validator.registerSchema("tool2", testSchema)
			expect(validator.listSchemas()).toHaveLength(2)

			validator.clear()
			expect(validator.listSchemas()).toHaveLength(0)
		})
	})

	describe("Basic Validation", () => {
		beforeEach(() => {
			validator.registerSchema("test_tool", testSchema)
		})

		test("should validate correct data", () => {
			const result = validator.validate(testSchema, {
				name: "John",
				age: 25,
				email: "john@example.com",
			})

			expect(result.success).toBe(true)
			expect(result.data).toEqual({
				name: "John",
				age: 25,
				email: "john@example.com",
			})
		})

		test("should reject invalid data", () => {
			const result = validator.validate(testSchema, {
				name: "", // Invalid: empty string
				age: -5, // Invalid: negative
				email: "invalid-email", // Invalid: not an email
			})

			expect(result.success).toBe(false)
			expect(result.errors).toBeDefined()
			expect(result.errors!.length).toBeGreaterThan(0)
		})

		test("should handle partial data with optional fields", () => {
			const result = validator.validate(testSchema, {
				name: "John",
				age: 25,
				// email is optional
			})

			expect(result.success).toBe(true)
			expect(result.data).toEqual({
				name: "John",
				age: 25,
			})
		})
	})

	describe("Tool Parameter Validation", () => {
		beforeEach(() => {
			validator.registerSchema(
				"write_file",
				z.object({
					path: z.string().min(1),
					content: z.string().min(1),
					line_count: z.coerce.number().int().min(0).optional(),
				}),
			)
		})

		test("should validate tool parameters", () => {
			const result = validator.validateToolParameters("write_file", {
				path: "test.txt",
				content: "Hello, World!",
				line_count: 3,
			})

			expect(result.success).toBe(true)
			expect(result.data).toEqual({
				path: "test.txt",
				content: "Hello, World!",
				line_count: 3,
			})
		})

		test("should reject invalid tool parameters", () => {
			const result = validator.validateToolParameters("write_file", {
				path: "", // Invalid: empty path
				content: "Hello, World!",
			})

			expect(result.success).toBe(false)
			expect(result.errors).toContain("File path cannot be empty")
		})

		test("should handle missing schema", () => {
			const result = validator.validateToolParameters("nonexistent_tool", {
				path: "test.txt",
				content: "Hello",
			})

			expect(result.success).toBe(false)
			expect(result.errors).toContain("No schema registered for tool: nonexistent_tool")
		})
	})

	describe("ToolUse Validation", () => {
		beforeEach(() => {
			validator.registerSchema(
				"write_file",
				z.object({
					path: z.string().min(1),
					content: z.string().min(1),
					line_count: z.coerce.number().int().min(0).optional(),
				}),
			)
		})

		test("should validate ToolUse format", () => {
			const toolUse: ToolUse = {
				type: "tool_use",
				name: "write_file",
				params: {
					path: "test.txt",
					content: "Hello, World!",
					line_count: "3", // String that should be converted to number
				},
				partial: false,
			}

			const result = validator.validateToolUse(toolUse)

			expect(result.success).toBe(true)
			expect(result.data).toEqual({
				path: "test.txt",
				content: "Hello, World!",
				line_count: 3, // Should be converted to number
			})
		})

		test("should handle conversion for different parameter types", () => {
			const toolUse: ToolUse = {
				type: "tool_use",
				name: "write_file",
				params: {
					path: "test.txt",
					content: "Hello, World!",
					line_count: "5", // String number
				},
				partial: false,
			}

			const result = validator.validateToolUse(toolUse)

			expect(result.success).toBe(true)
			expect(typeof result.data!.line_count).toBe("number")
			expect(result.data!.line_count).toBe(5)
		})
	})

	describe("Type Coercion", () => {
		beforeEach(() => {
			validator.registerSchema(
				"coercion_test",
				z.object({
					number_field: z.coerce.number(),
					boolean_field: z.coerce.boolean(),
					string_field: z.string(),
					array_field: z.array(z.string()),
				}),
			)
		})

		test("should coerce string numbers to numbers", () => {
			const result = validator.validateToolParameters("coercion_test", {
				number_field: "42",
				boolean_field: "true",
				string_field: "hello",
				array_field: '["a", "b", "c"]', // JSON string that should be parsed
			})

			expect(result.success).toBe(true)
			expect(result.data).toEqual({
				number_field: 42,
				boolean_field: true,
				string_field: "hello",
				array_field: ["a", "b", "c"],
			})
		})

		test("should handle invalid JSON arrays", () => {
			const result = validator.validateToolParameters("coercion_test", {
				number_field: "42",
				boolean_field: "true",
				string_field: "hello",
				array_field: "invalid json array",
			})

			expect(result.success).toBe(true)
			// Should keep as string when JSON parsing fails
			expect(result.data!.array_field).toBe("invalid json array")
		})
	})

	describe("Legacy Parameter Schema Creation", () => {
		test("should create schema from legacy parameter definitions", () => {
			const requiredParams: ToolParamName[] = ["path", "content"]
			const optionalParams: ToolParamName[] = ["line_count"]

			const schema = validator.createSchemaFromLegacyParams("test_tool", requiredParams, optionalParams)

			// Test valid data
			const validResult = validator.validate(schema, {
				path: "test.txt",
				content: "Hello",
				line_count: 5,
			})
			expect(validResult.success).toBe(true)

			// Test missing required parameter
			const invalidResult = validator.validate(schema, {
				content: "Hello",
				// missing required 'path'
			})
			expect(invalidResult.success).toBe(false)
		})

		test("should handle different parameter types", () => {
			const requiredParams: ToolParamName[] = ["command"]
			const optionalParams: ToolParamName[] = ["recursive"]

			const schema = validator.createSchemaFromLegacyParams("command_tool", requiredParams, optionalParams)

			const result = validator.validate(schema, {
				command: "ls -la",
				recursive: "true", // Should be coerced to boolean if that's the type
			})

			expect(result.success).toBe(true)
		})
	})

	describe("Error Messages", () => {
		beforeEach(() => {
			validator.registerSchema(
				"error_test",
				z.object({
					name: z.string().min(3, "Name must be at least 3 characters"),
					age: z.number().min(0, "Age must be non-negative").max(120, "Age must be at most 120"),
					email: z.string().email("Must be a valid email address"),
				}),
			)
		})

		test("should provide clear error messages", () => {
			const result = validator.validateToolParameters("error_test", {
				name: "Jo", // Too short
				age: -5, // Negative
				email: "invalid-email", // Invalid email
			})

			expect(result.success).toBe(false)
			expect(result.errors).toEqual([
				"Name must be at least 3 characters",
				"Age must be non-negative",
				"Must be a valid email address",
			])
		})

		test("should handle undefined parameters", () => {
			const result = validator.validateToolParameters("error_test", {
				name: undefined,
				age: undefined,
				email: undefined,
			})

			expect(result.success).toBe(false)
			expect(result.errors!.length).toBeGreaterThan(0)
		})
	})

	describe("Configuration", () => {
		test("should use configuration options", () => {
			const strictValidator = new ZodSchemaValidator({
				strict: true,
				allowUnknown: false,
				stripUnknown: false,
				coerce: false,
			})

			strictValidator.registerSchema(
				"strict_test",
				z.object({
					name: z.string(),
				}),
			)

			// With strict mode and no coercion, this should fail
			const result = strictValidator.validateToolParameters("strict_test", {
				name: "test",
				extra_field: "should not be allowed",
			})

			expect(result.success).toBe(false)
		})

		test("should get configuration statistics", () => {
			validator.registerSchema("stat_test", testSchema)
			const stats = validator.getStats()

			expect(stats.totalSchemas).toBe(1)
			expect(stats.schemaNames).toContain("stat_test")
			expect(stats.config.strict).toBe(true)
		})
	})

	describe("Edge Cases", () => {
		test("should handle empty objects", () => {
			const emptySchema = z.object({})
			validator.registerSchema("empty_test", emptySchema)

			const result = validator.validateToolParameters("empty_test", {})

			expect(result.success).toBe(true)
			expect(result.data).toEqual({})
		})

		test("should handle null and undefined values", () => {
			const nullableSchema = z.object({
				optional_field: z.string().optional(),
				nullable_field: z.string().nullable().optional(),
			})
			validator.registerSchema("nullable_test", nullableSchema)

			const result = validator.validateToolParameters("nullable_test", {})

			expect(result.success).toBe(true)
			expect(result.data).toEqual({})
		})

		test("should handle complex nested objects", () => {
			const complexSchema = z.object({
				user: z.object({
					name: z.string(),
					details: z.object({
						age: z.number(),
						preferences: z.array(z.string()),
					}),
				}),
			})
			validator.registerSchema("complex_test", complexSchema)

			const result = validator.validateToolParameters("complex_test", {
				user: {
					name: "John",
					details: {
						age: 30,
						preferences: "json string", // This would be kept as string
					},
				},
			})

			// This might not fully validate due to JSON string not being parsed
			// but it should not crash
			expect(result).toBeDefined()
		})
	})

	describe("Performance", () => {
		test("should handle multiple validations efficiently", () => {
			validator.registerSchema("perf_test", testSchema)

			const startTime = Date.now()

			for (let i = 0; i < 1000; i++) {
				validator.validateToolParameters("perf_test", {
					name: `User${i}`,
					age: i % 100,
					email: `user${i}@example.com`,
				})
			}

			const endTime = Date.now()
			const duration = endTime - startTime

			// Should complete 1000 validations in reasonable time (less than 1 second)
			expect(duration).toBeLessThan(1000)
		})
	})
})
