import { DynamicStructuredTool } from "@langchain/core/tools"
import { z } from "zod"
import { ToolWrapperRegistration, ToolWrapperRegistry as IToolWrapperRegistry } from "../types/ToolWrapperTypes"

/**
 * Registry for managing LangChain tool wrappers
 */
export class ToolWrapperRegistry implements IToolWrapperRegistry {
	private wrappers: Map<string, ToolWrapperRegistration> = new Map()

	/**
	 * Register a new tool wrapper
	 */
	public register(wrapper: ToolWrapperRegistration): void {
		if (this.wrappers.has(wrapper.name)) {
			throw new Error(`Tool wrapper '${wrapper.name}' is already registered`)
		}
		this.wrappers.set(wrapper.name, wrapper)
	}

	/**
	 * Unregister a tool wrapper
	 */
	public unregister(name: string): void {
		if (!this.wrappers.has(name)) {
			throw new Error(`Tool wrapper '${name}' is not registered`)
		}
		this.wrappers.delete(name)
	}

	/**
	 * Get a tool wrapper by name
	 */
	public get(name: string): ToolWrapperRegistration | undefined {
		return this.wrappers.get(name)
	}

	/**
	 * List all registered tool wrappers
	 */
	public list(): ToolWrapperRegistration[] {
		return Array.from(this.wrappers.values())
	}

	/**
	 * Clear all registered tool wrappers
	 */
	public clear(): void {
		this.wrappers.clear()
	}

	/**
	 * Check if a tool wrapper is registered
	 */
	public has(name: string): boolean {
		return this.wrappers.has(name)
	}

	/**
	 * Get all tool names
	 */
	public getToolNames(): string[] {
		return Array.from(this.wrappers.keys())
	}

	/**
	 * Get all LangChain tools (for LLM binding)
	 */
	public getLangChainTools(): DynamicStructuredTool[] {
		return Array.from(this.wrappers.values()).map((wrapper) => wrapper.tool)
	}

	/**
	 * Get tools by tag
	 */
	public getByTag(tag: string): ToolWrapperRegistration[] {
		return Array.from(this.wrappers.values()).filter((wrapper) => wrapper.metadata?.tags?.includes(tag))
	}

	/**
	 * Get tool metadata
	 */
	public getMetadata(name: string): Record<string, any> | undefined {
		const wrapper = this.wrappers.get(name)
		return wrapper?.metadata
	}

	/**
	 * Get registry statistics
	 */
	public getStats(): {
		totalTools: number
		toolsByTag: Record<string, number>
		versions: Record<string, string>
	} {
		const tools = this.list()
		const toolsByTag: Record<string, number> = {}
		const versions: Record<string, string> = {}

		for (const tool of tools) {
			// Count by tags
			const tags = tool.metadata?.tags || []
			for (const tag of tags) {
				toolsByTag[tag] = (toolsByTag[tag] || 0) + 1
			}

			// Track versions
			versions[tool.name] = tool.version
		}

		return {
			totalTools: tools.length,
			toolsByTag,
			versions,
		}
	}
}

// Global registry instance
export const globalToolWrapperRegistry = new ToolWrapperRegistry()
