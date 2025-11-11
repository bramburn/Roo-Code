import { readdir, stat } from "fs/promises"
import { join } from "path"
import { ToolWrapperRegistry } from "./ToolWrapperRegistry"
import { globalToolWrapperRegistry } from "./ToolWrapperRegistry"

/**
 * Tool discovery service for automatically finding and registering tool wrappers
 */
export class ToolDiscovery {
	private registry: ToolWrapperRegistry
	private scannedPaths: Set<string> = new Set()

	constructor(registry: ToolWrapperRegistry = globalToolWrapperRegistry) {
		this.registry = registry
	}

	/**
	 * Discover and register tool wrappers from a directory
	 */
	public async discoverFromDirectory(dirPath: string, recursive: boolean = false): Promise<void> {
		if (this.scannedPaths.has(dirPath)) {
			return // Already scanned
		}

		try {
			const entries = await readdir(dirPath, { withFileTypes: true })

			for (const entry of entries) {
				const fullPath = join(dirPath, entry.name)

				if (entry.isDirectory() && recursive) {
					await this.discoverFromDirectory(fullPath, recursive)
				} else if (entry.isFile() && this.isToolWrapperFile(entry.name)) {
					await this.loadToolWrapper(fullPath)
				}
			}

			this.scannedPaths.add(dirPath)
		} catch (error) {
			console.warn(`Failed to discover tools in directory ${dirPath}:`, error)
		}
	}

	/**
	 * Check if a file is potentially a tool wrapper file
	 */
	private isToolWrapperFile(fileName: string): boolean {
		return (
			(fileName.endsWith("ToolWrapper.ts") ||
				fileName.endsWith("Tool.ts") ||
				fileName.includes("wrapper") ||
				fileName.includes("tool")) &&
			fileName.endsWith(".ts")
		)
	}

	/**
	 * Load a tool wrapper from a file
	 */
	private async loadToolWrapper(filePath: string): Promise<void> {
		try {
			// Dynamic import of the tool wrapper module
			const module = await import(filePath)

			// Look for exported tool wrapper classes or instances
			for (const exportName of Object.keys(module)) {
				const exported = module[exportName]

				if (this.isToolWrapperClass(exported)) {
					// Try to instantiate and register the wrapper
					await this.registerToolWrapperClass(exported, exportName)
				} else if (this.isToolWrapperInstance(exported)) {
					// Register the instance directly
					await this.registerToolWrapperInstance(exported, exportName)
				}
			}
		} catch (error) {
			console.warn(`Failed to load tool wrapper from ${filePath}:`, error)
		}
	}

	/**
	 * Check if an export is a tool wrapper class
	 */
	private isToolWrapperClass(exported: any): boolean {
		return (
			typeof exported === "function" &&
			exported.prototype &&
			(exported.prototype.createLangChainTool ||
				exported.name.includes("ToolWrapper") ||
				exported.name.includes("Tool"))
		)
	}

	/**
	 * Check if an export is a tool wrapper instance
	 */
	private isToolWrapperInstance(exported: any): boolean {
		return (
			typeof exported === "object" &&
			exported !== null &&
			(exported.createLangChainTool || exported.name || exported.schema)
		)
	}

	/**
	 * Register a tool wrapper class
	 */
	private async registerToolWrapperClass(ToolWrapperClass: any, exportName: string): Promise<void> {
		try {
			// For classes, we would need context to instantiate them
			// Store the class for later instantiation
			console.log(`Found tool wrapper class: ${exportName}`)
			// TODO: Implement context-based instantiation
		} catch (error) {
			console.warn(`Failed to register tool wrapper class ${exportName}:`, error)
		}
	}

	/**
	 * Register a tool wrapper instance
	 */
	private async registerToolWrapperInstance(instance: any, exportName: string): Promise<void> {
		try {
			if (instance.createLangChainTool && typeof instance.createLangChainTool === "function") {
				const tool = instance.createLangChainTool()

				// Register the tool with metadata
				this.registry.register({
					tool,
					name: tool.name || exportName,
					description: tool.description || "",
					schema: tool.schema,
					version: "1.0.0",
					metadata: {
						exportName,
						sourcePath: "discovered",
						registrationTime: new Date().toISOString(),
					},
				})

				console.log(`Registered tool wrapper: ${tool.name || exportName}`)
			}
		} catch (error) {
			console.warn(`Failed to register tool wrapper instance ${exportName}:`, error)
		}
	}

	/**
	 * Discover tools from multiple directories
	 */
	public async discoverFromDirectories(directories: string[], recursive: boolean = false): Promise<void> {
		const promises = directories.map((dir) => this.discoverFromDirectory(dir, recursive))
		await Promise.allSettled(promises)
	}

	/**
	 * Refresh discovery (clear cache and rediscover)
	 */
	public async refresh(directories: string[], recursive: boolean = false): Promise<void> {
		this.scannedPaths.clear()
		await this.discoverFromDirectories(directories, recursive)
	}

	/**
	 * Get discovery statistics
	 */
	public getDiscoveryStats(): {
		scannedPaths: number
		registeredTools: number
	} {
		return {
			scannedPaths: this.scannedPaths.size,
			registeredTools: this.registry.list().length,
		}
	}
}

// Global discovery instance
export const globalToolDiscovery = new ToolDiscovery()
