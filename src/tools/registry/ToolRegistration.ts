import { DynamicStructuredTool } from "@langchain/core/tools"
import { z } from "zod"
import { ToolWrapperRegistration } from "../types/ToolWrapperTypes"
import { globalToolWrapperRegistry } from "./ToolWrapperRegistry"

/**
 * Utility class for tool wrapper registration
 */
export class ToolRegistration {
	/**
	 * Register a tool wrapper with the global registry
	 */
	public static register(wrapper: ToolWrapperRegistration): void {
		globalToolWrapperRegistry.register(wrapper)
	}

	/**
	 * Create and register a tool wrapper from a LangChain tool
	 */
	public static registerFromLangChainTool(
		tool: DynamicStructuredTool,
		version: string = "1.0.0",
		metadata?: Record<string, any>,
	): void {
		const registration: ToolWrapperRegistration = {
			tool: tool as any,
			name: tool.name,
			description: tool.description,
			schema: tool.schema as z.ZodSchema,
			version,
			metadata: {
				...metadata,
				registrationTime: new Date().toISOString(),
				source: "manual",
			},
		}

		this.register(registration)
	}

	/**
	 * Batch register multiple tool wrappers
	 */
	public static registerBatch(wrappers: ToolWrapperRegistration[]): void {
		for (const wrapper of wrappers) {
			this.register(wrapper)
		}
	}

	/**
	 * Register a tool wrapper with custom metadata
	 */
	public static registerWithMetadata(
		tool: DynamicStructuredTool,
		metadata: {
			version?: string
			tags?: string[]
			category?: string
			author?: string
			[Key: string]: any
		},
	): void {
		const registration: ToolWrapperRegistration = {
			tool: tool as any,
			name: tool.name,
			description: tool.description,
			schema: tool.schema as z.ZodSchema,
			version: metadata.version || "1.0.0",
			metadata: {
				...metadata,
				registrationTime: new Date().toISOString(),
				source: "manual",
			},
		}

		this.register(registration)
	}

	/**
	 * Unregister a tool wrapper
	 */
	public static unregister(name: string): void {
		globalToolWrapperRegistry.unregister(name)
	}

	/**
	 * Get a registered tool wrapper
	 */
	public static get(name: string): ToolWrapperRegistration | undefined {
		return globalToolWrapperRegistry.get(name)
	}

	/**
	 * List all registered tool wrappers
	 */
	public static list(): ToolWrapperRegistration[] {
		return globalToolWrapperRegistry.list()
	}

	/**
	 * Check if a tool wrapper is registered
	 */
	public static isRegistered(name: string): boolean {
		return globalToolWrapperRegistry.has(name)
	}

	/**
	 * Get all LangChain tools for LLM binding
	 */
	public static getLangChainTools(): DynamicStructuredTool[] {
		return globalToolWrapperRegistry.getLangChainTools()
	}

	/**
	 * Get tools by tag
	 */
	public static getByTag(tag: string): ToolWrapperRegistration[] {
		return globalToolWrapperRegistry.getByTag(tag)
	}

	/**
	 * Get tools by category
	 */
	public static getByCategory(category: string): ToolWrapperRegistration[] {
		return this.list().filter((wrapper) => wrapper.metadata?.category === category)
	}

	/**
	 * Clear all registered tool wrappers
	 */
	public static clear(): void {
		globalToolWrapperRegistry.clear()
	}

	/**
	 * Get registry statistics
	 */
	public static getStats(): {
		totalTools: number
		toolsByTag: Record<string, number>
		versions: Record<string, string>
	} {
		return globalToolWrapperRegistry.getStats()
	}

	/**
	 * Export registry configuration
	 */
	public static exportConfig(): {
		wrappers: Array<{
			name: string
			description: string
			version: string
			metadata?: Record<string, any>
		}>
		stats: ReturnType<typeof ToolRegistration.getStats>
		exportTime: string
	} {
		return {
			wrappers: this.list().map((wrapper) => ({
				name: wrapper.name,
				description: wrapper.description,
				version: wrapper.version,
				metadata: wrapper.metadata,
			})),
			stats: this.getStats(),
			exportTime: new Date().toISOString(),
		}
	}

	/**
	 * Validate tool wrapper before registration
	 */
	public static validateToolWrapper(wrapper: ToolWrapperRegistration): {
		valid: boolean
		errors: string[]
	} {
		const errors: string[] = []

		if (!wrapper.name || typeof wrapper.name !== "string") {
			errors.push("Tool wrapper must have a valid name")
		}

		if (!wrapper.description || typeof wrapper.description !== "string") {
			errors.push("Tool wrapper must have a valid description")
		}

		if (!wrapper.schema || !(wrapper.schema instanceof z.ZodSchema)) {
			errors.push("Tool wrapper must have a valid Zod schema")
		}

		if (!wrapper.tool || typeof wrapper.tool !== "object") {
			errors.push("Tool wrapper must have a valid LangChain tool")
		}

		if (!wrapper.version || typeof wrapper.version !== "string") {
			errors.push("Tool wrapper must have a valid version")
		}

		return {
			valid: errors.length === 0,
			errors,
		}
	}
}
