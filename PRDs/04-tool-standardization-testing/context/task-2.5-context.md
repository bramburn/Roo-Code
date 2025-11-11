# Context for Task 2.5: Implement tool wrapper registry with discovery and registration mechanisms

- **Status**: To Do
- **Source PRD**: PRDs/04-tool-standardization-testing/tasklists/tasklist_sprint_02.md
- **Target Files**:
    - `src/tools/registry/ToolWrapperRegistry.ts`
    - `src/tools/registry/ToolDiscovery.ts`
    - `src/tools/registry/ToolRegistration.ts`
- **Generated**: 2025-11-11T20:32:00.000Z
- **Last Updated**: 2025-11-11T20:32:00.000Z

---

## 1. Current Code Analysis (Internal)

### Existing Registry Patterns

From codebase analysis, I found existing registry patterns:

**File**: `src/api/index.ts` (lines 1-175)

```typescript
// Current API registry pattern
export const apiHandlers = {
	openai: OpenAIHandler,
	anthropic: AnthropicHandler,
	gemini: GeminiHandler,
	// ... other handlers
}

export function createApiHandler(provider: string): ApiHandler {
	const handler = apiHandlers[provider]
	if (!handler) {
		throw new Error(`Unknown API provider: ${provider}`)
	}
	return new handler()
}
```

**File**: `src/services/mcp/McpHub.ts` (lines 50-100)

```typescript
export class McpHub {
	private servers: Map<string, McpServer> = new Map()

	registerServer(name: string, server: McpServer): void {
		this.servers.set(name, server)
	}

	getServer(name: string): McpServer | undefined {
		return this.servers.get(name)
	}

	getAllServers(): McpServer[] {
		return Array.from(this.servers.values())
	}
}
```

**Tool Registration Patterns** from `src/core/tools/useMcpToolTool.ts`:

```typescript
// Manual tool discovery in MCP servers
const server = mcpHub.getServer(serverName)
if (!server) {
	await handleError("using tool", `Server ${serverName} not found`)
	return
}

const tool = server.tools.find((tool) => tool.name === toolName)
if (!tool) {
	await handleError("using tool", `Tool ${toolName} not found in server ${serverName}`)
	return
}
```

### Current Tool Management

**Tool Function Registration**:

```typescript
// From src/core/prompts/tools.ts
export const toolDefinitions = {
	write_to_file: getWriteToFileDescription,
	read_file: getReadFileDescription,
	search_files: getSearchFilesDescription,
	// ... other tools
}
```

**Tool Execution Patterns**:

```typescript
// From src/core/assistant-message/presentAssistantMessage.ts
switch (block.name) {
  case "write_to_file":
    await writeToFileTool(...)
    break
  case "read_file":
    await readFileTool(...)
    break
  // ... other cases
}
```

---

## 2. External Best Practices (GitHub)

### Best Practice 1: Dynamic Tool Registry

**Source**: https://github.com/langchain-ai/langchainjs
**Pattern**: Dynamic registration and discovery system

```typescript
// Tool registry with dynamic discovery
export class ToolRegistry {
	private tools: Map<string, any> = new Map()
	private toolCategories: Map<string, string[]> = new Map()
	private toolMetadata: Map<string, ToolMetadata> = new Map()

	registerTool(tool: any, category?: string): void {
		if (!tool.name || !tool.schema) {
			throw new Error("Tool must have name and schema")
		}

		this.tools.set(tool.name, tool)

		if (category) {
			if (!this.toolCategories.has(category)) {
				this.toolCategories.set(category, [])
			}
			this.toolCategories.get(category)!.push(tool.name)
		}

		// Store metadata for discovery
		this.toolMetadata.set(tool.name, {
			name: tool.name,
			description: tool.description,
			category: category || "general",
			registeredAt: new Date(),
			version: tool.version || "1.0.0",
		})
	}

	getTool(name: string): any | undefined {
		return this.tools.get(name)
	}

	getAllTools(): any[] {
		return Array.from(this.tools.values())
	}

	getToolsByCategory(category: string): any[] {
		const toolNames = this.toolCategories.get(category) || []
		return toolNames.map((name) => this.tools.get(name)).filter(Boolean)
	}

	discoverTools(query?: string): ToolMetadata[] {
		let tools = Array.from(this.toolMetadata.values())

		if (query) {
			const lowerQuery = query.toLowerCase()
			tools = tools.filter(
				(tool) =>
					tool.name.toLowerCase().includes(lowerQuery) || tool.description.toLowerCase().includes(lowerQuery),
			)
		}

		return tools.sort((a, b) => a.name.localeCompare(b.name))
	}

	unregisterTool(name: string): boolean {
		const removed = this.tools.delete(name)
		if (removed) {
			this.toolMetadata.delete(name)

			// Remove from categories
			for (const [category, tools] of this.toolCategories) {
				const index = tools.indexOf(name)
				if (index > -1) {
					tools.splice(index, 1)
					if (tools.length === 0) {
						this.toolCategories.delete(category)
					}
					break
				}
			}
		}

		return removed
	}
}

interface ToolMetadata {
	name: string
	description: string
	category: string
	registeredAt: Date
	version: string
}
```

### Best Practice 2: Tool Discovery System

**Source**: https://github.com/microsoft/vscode-extension-samples
**Pattern**: Automatic tool discovery with metadata

```typescript
// Tool discovery with reflection and metadata
export class ToolDiscovery {
	private discoveredTools: Map<string, DiscoveredTool> = new Map()

	async discoverTools(paths: string[]): Promise<DiscoveredTool[]> {
		const tools: DiscoveredTool[] = []

		for (const path of paths) {
			const discovered = await this.discoverFromPath(path)
			tools.push(...discovered)
		}

		return tools
	}

	private async discoverFromPath(path: string): Promise<DiscoveredTool[]> {
		const tools: DiscoveredTool[] = []

		try {
			const modules = await this.loadModulesFromPath(path)

			for (const module of modules) {
				const toolInfo = this.extractToolInfo(module)
				if (toolInfo) {
					tools.push(toolInfo)
				}
			}
		} catch (error) {
			console.warn(`Failed to discover tools in ${path}:`, error)
		}

		return tools
	}

	private extractToolInfo(module: any): DiscoveredTool | null {
		// Check for tool exports
		if (module.default && typeof module.default === "function") {
			return {
				name: module.default.name || "unnamed",
				description: module.default.description || "",
				module: path,
				exports: ["default"],
				metadata: this.extractMetadata(module),
			}
		}

		// Check for multiple tool exports
		if (module.tools && Array.isArray(module.tools)) {
			return {
				name: path.basename(module.path, ".js"),
				description: `Tool collection from ${module.path}`,
				module: path,
				exports: module.tools.map((tool: any) => tool.name),
				metadata: {
					type: "collection",
					count: module.tools.length,
				},
			}
		}

		return null
	}

	private extractMetadata(module: any): any {
		return {
			version: module.version || "1.0.0",
			author: module.author || "Unknown",
			license: module.license || "MIT",
			dependencies: module.dependencies || [],
			capabilities: module.capabilities || [],
		}
	}
}

interface DiscoveredTool {
	name: string
	description: string
	module: string
	exports: string[]
	metadata: any
}
```

### Best Practice 3: Registration Validation

**Source**: https://github.com/nodejs/modules
**Pattern**: Comprehensive validation during registration

```typescript
// Tool registration with validation
export class ToolRegistration {
	private validators: Array<(tool: any) => ValidationResult> = []

	addValidator(validator: (Tool: any) => ValidationResult): void {
		this.validators.push(validator)
	}

	registerTool(tool: any): RegistrationResult {
		// Run all validators
		for (const validator of this.validators) {
			const result = validator(tool)
			if (!result.valid) {
				return {
					success: false,
					errors: [result.error],
					tool: null,
				}
			}
		}

		// Additional built-in validations
		const validationResult = this.validateTool(tool)
		if (!validationResult.valid) {
			return {
				success: false,
				errors: validationResult.errors,
				tool: null,
			}
		}

		// Register the tool
		const registeredTool = this.createRegisteredTool(tool)

		return {
			success: true,
			errors: [],
			tool: registeredTool,
		}
	}

	private validateTool(tool: any): ValidationResult {
		const errors: string[] = []

		// Name validation
		if (!tool.name || typeof tool.name !== "string") {
			errors.push("Tool must have a valid name")
		}

		// Schema validation
		if (!tool.schema) {
			errors.push("Tool must have a schema defined")
		}

		// Function validation
		if (typeof tool.func !== "function") {
			errors.push("Tool must have a valid function")
		}

		// Description validation
		if (!tool.description || typeof tool.description !== "string") {
			errors.push("Tool must have a description")
		}

		return {
			valid: errors.length === 0,
			error: errors.length > 0 ? errors.join("; ") : undefined,
		}
	}

	private createRegisteredTool(tool: any): RegisteredTool {
		return {
			id: this.generateToolId(),
			originalTool: tool,
			registeredAt: new Date(),
			version: tool.version || "1.0.0",
			metadata: {
				name: tool.name,
				description: tool.description,
				schema: tool.schema,
				capabilities: this.extractCapabilities(tool),
			},
		}
	}

	private generateToolId(): string {
		return `tool_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
	}

	private extractCapabilities(tool: any): string[] {
		const capabilities: string[] = []

		// Check for file operations
		if (tool.name.includes("file") || tool.description.includes("file")) {
			capabilities.push("file-operations")
		}

		// Check for network operations
		if (tool.name.includes("http") || tool.name.includes("api")) {
			capabilities.push("network-access")
		}

		// Check for system operations
		if (tool.name.includes("command") || tool.name.includes("exec")) {
			capabilities.push("system-access")
		}

		return capabilities
	}
}

interface ValidationResult {
	valid: boolean
	error?: string
}

interface RegistrationResult {
	success: boolean
	errors: string[]
	tool: RegisteredTool | null
}

interface RegisteredTool {
	id: string
	originalTool: any
	registeredAt: Date
	version: string
	metadata: any
}
```

---

## 3. Internal Knowledge Base (Memory)

### Existing Registry Infrastructure

From memory analysis, codebase has:

- **MCP Server Registry**: Existing server registration and discovery
- **API Handler Registry**: Pattern for provider registration
- **Tool Definition System**: Manual tool registration and categorization
- **Validation Patterns**: Existing validation for tool parameters

### Tool Registry Requirements

Based on existing patterns:

- **Dynamic Registration**: Support for runtime tool registration
- **Discovery Mechanisms**: Automatic tool discovery from modules
- **Validation System**: Comprehensive tool validation during registration
- **Metadata Management**: Tool metadata storage and retrieval
- **Category Support**: Tool categorization and filtering

---

## 4. Suggested Implementation Plan

### Phase 1: Core Registry Infrastructure

**File**: `src/tools/registry/ToolWrapperRegistry.ts`

```typescript
import { EventEmitter } from "events"
import { ToolWrapper } from "../types/ToolTypes"
import { ToolMetadata } from "./ToolRegistration"

export interface RegistryEvents {
	toolRegistered: { tool: ToolWrapper; metadata: ToolMetadata }
	toolUnregistered: { toolName: string }
	toolUpdated: { tool: ToolWrapper; oldMetadata: ToolMetadata }
	categoryAdded: { category: string }
	categoryRemoved: { category: string }
}

export class ToolWrapperRegistry extends EventEmitter<RegistryEvents> {
	private tools: Map<string, RegisteredTool> = new Map()
	private categories: Map<string, Set<string>> = new Map()
	private metadata: Map<string, ToolMetadata> = new Map()
	private aliases: Map<string, string> = new Map() // name -> canonical name

	constructor() {
		super()
		this.initializeDefaultCategories()
	}

	// Core registration methods
	registerTool(tool: ToolWrapper, metadata?: Partial<ToolMetadata>): RegistrationResult {
		const validationResult = this.validateTool(tool)
		if (!validationResult.valid) {
			return {
				success: false,
				errors: validationResult.errors,
				toolId: null,
			}
		}

		const toolName = tool.name
		const toolId = this.generateToolId(toolName)

		// Create full metadata
		const fullMetadata: ToolMetadata = {
			name: toolName,
			description: tool.description || "",
			category: metadata?.category || "general",
			version: metadata?.version || "1.0.0",
			author: metadata?.author || "Unknown",
			license: metadata?.license || "MIT",
			capabilities: metadata?.capabilities || [],
			registeredAt: new Date(),
			tags: metadata?.tags || [],
			deprecated: metadata?.deprecated || false,
			...metadata,
		}

		const registeredTool: RegisteredTool = {
			id: ToolId,
			tool,
			metadata: fullMetadata,
			registeredAt: new Date(),
			lastUsed: null,
			usageCount: 0,
		}

		// Store in registry
		this.tools.set(toolName, registeredTool)
		this.metadata.set(toolName, fullMetadata)

		// Add to category
		this.addToCategory(fullMetadata.category, toolName)

		// Add aliases if provided
		if (metadata?.aliases) {
			for (const alias of metadata.aliases) {
				this.aliases.set(alias, toolName)
			}
		}

		// Emit event
		this.emit("toolRegistered", { tool, metadata: fullMetadata })

		return {
			success: true,
			errors: [],
			toolId,
		}
	}

	unregisterTool(toolName: string): boolean {
		const tool = this.tools.get(toolName)
		if (!tool) {
			return false
		}

		const metadata = this.metadata.get(toolName)

		// Remove from registry
		this.tools.delete(toolName)
		this.metadata.delete(toolName)

		// Remove from category
		this.removeFromCategory(metadata.category, toolName)

		// Remove aliases
		for (const [alias, canonical] of this.aliases) {
			if (canonical === toolName) {
				this.aliases.delete(alias)
			}
		}

		// Emit event
		this.emit("toolUnregistered", { toolName })

		return true
	}

	updateTool(toolName: string, updates: Partial<ToolWrapper>): UpdateResult {
		const existing = this.tools.get(toolName)
		if (!existing) {
			return {
				success: false,
				error: `Tool '${toolName}' not found`,
			}
		}

		const oldMetadata = existing.metadata

		// Update tool
		const updatedTool = { ...existing.tool, ...updates }
		const updatedMetadata = { ...existing.metadata }

		if (updates.name && updates.name !== toolName) {
			// Tool name changed, need to re-register
			this.unregisterTool(toolName)
			return this.registerTool(updatedTool, updatedMetadata)
		}

		const updatedRegistered: RegisteredTool = {
			...existing,
			tool: updatedTool,
			metadata: updatedMetadata,
		}

		this.tools.set(toolName, updatedRegistered)
		this.metadata.set(toolName, updatedMetadata)

		// Emit event
		this.emit("toolUpdated", { tool: updatedTool, oldMetadata })

		return {
			success: true,
			error: null,
		}
	}

	// Query methods
	getTool(toolName: string): RegisteredTool | undefined {
		// Check aliases first
		const canonicalName = this.aliases.get(toolName) || toolName
		return this.tools.get(canonicalName)
	}

	getAllTools(): RegisteredTool[] {
		return Array.from(this.tools.values())
	}

	getToolsByCategory(category: string): RegisteredTool[] {
		const toolNames = this.categories.get(category)
		if (!toolNames) return []

		return Array.from(toolNames)
			.map((name) => this.tools.get(name))
			.filter(Boolean) as RegisteredTool[]
	}

	getCategories(): string[] {
		return Array.from(this.categories.keys())
	}

	discoverTools(query: DiscoveryQuery): DiscoveryResult {
		let tools = Array.from(this.tools.values())

		// Filter by category
		if (query.category) {
			tools = tools.filter((tool) => tool.metadata.category === query.category)
		}

		// Filter by capabilities
		if (query.capabilities && query.capabilities.length > 0) {
			tools = tools.filter((tool) => query.capabilities!.some((cap) => tool.metadata.capabilities.includes(cap)))
		}

		// Filter by tags
		if (query.tags && query.tags.length > 0) {
			tools = tools.filter((tool) => query.tags!.some((tag) => tool.metadata.tags.includes(tag)))
		}

		// Text search
		if (query.search) {
			const searchTerm = query.search.toLowerCase()
			tools = tools.filter(
				(tool) =>
					tool.metadata.name.toLowerCase().includes(searchTerm) ||
					tool.metadata.description.toLowerCase().includes(searchTerm),
			)
		}

		// Filter deprecated tools unless explicitly requested
		if (!query.includeDeprecated) {
			tools = tools.filter((tool) => !tool.metadata.deprecated)
		}

		// Sort results
		tools.sort((a, b) => {
			// Prioritize non-deprecated
			if (a.metadata.deprecated !== b.metadata.deprecated) {
				return a.metadata.deprecated ? 1 : -1
			}
			// Then by usage count
			return b.usageCount - a.usageCount
		})

		return {
			tools,
			totalCount: tools.length,
			query,
		}
	}

	// Usage tracking
	recordToolUsage(toolName: string): void {
		const tool = this.tools.get(toolName)
		if (tool) {
			tool.lastUsed = new Date()
			tool.usageCount++
		}
	}

	getUsageStats(toolName: string): UsageStats | null {
		const tool = this.tools.get(toolName)
		if (!tool) return null

		return {
			usageCount: tool.usageCount,
			lastUsed: tool.lastUsed,
			registeredAt: tool.registeredAt,
		}
	}

	// Private helper methods
	private validateTool(tool: ToolWrapper): ValidationResult {
		const errors: string[] = []

		if (!tool.name || typeof tool.name !== "string") {
			errors.push("Tool must have a valid name")
		}

		if (!tool.description || typeof tool.description !== "string") {
			errors.push("Tool must have a description")
		}

		if (typeof tool.execute !== "function") {
			errors.push("Tool must have an execute function")
		}

		if (!tool.schema) {
			errors.push("Tool must have a schema defined")
		}

		return {
			valid: errors.length === 0,
			errors,
		}
	}

	private addToCategory(category: string, toolName: string): void {
		if (!this.categories.has(category)) {
			this.categories.set(category, new Set())
			this.emit("categoryAdded", { category })
		}

		this.categories.get(category)!.add(toolName)
	}

	private removeFromCategory(category: string, toolName: string): void {
		const categoryTools = this.categories.get(category)
		if (categoryTools) {
			categoryTools.delete(toolName)

			if (categoryTools.size === 0) {
				this.categories.delete(category)
				this.emit("categoryRemoved", { category })
			}
		}
	}

	private initializeDefaultCategories(): void {
		const defaultCategories = ["general", "file", "network", "system", "mcp", "langchain"]

		for (const category of defaultCategories) {
			this.categories.set(category, new Set())
		}
	}

	private generateToolId(toolName: string): string {
		return `tool_${toolName}_${Date.now()}`
	}
}

// Supporting interfaces
interface RegisteredTool {
	id: string
	tool: ToolWrapper
	metadata: ToolMetadata
	registeredAt: Date
	lastUsed: Date | null
	usageCount: number
}

interface RegistrationResult {
	success: boolean
	errors: string[]
	toolId: string | null
}

interface UpdateResult {
	success: boolean
	error: string | null
}

interface ValidationResult {
	valid: boolean
	errors: string[]
}

interface DiscoveryQuery {
	category?: string
	capabilities?: string[]
	tags?: string[]
	search?: string
	includeDeprecated?: boolean
}

interface DiscoveryResult {
	tools: RegisteredTool[]
	totalCount: number
	query: DiscoveryQuery
}

interface UsageStats {
	usageCount: number
	lastUsed: Date | null
	registeredAt: Date
}
```

### Phase 2: Tool Discovery System

**File**: `src/tools/registry/ToolDiscovery.ts`

```typescript
import * as fs from "fs/promises"
import * as path from "path"
import { ToolWrapper } from "../types/ToolTypes"
import { ToolWrapperRegistry } from "./ToolWrapperRegistry"

export class ToolDiscovery {
	private registry: ToolWrapperRegistry
	private discoveryPaths: string[] = []
	private watchedPaths: Set<string> = new Set()

	constructor(registry: ToolWrapperRegistry) {
		this.registry = registry
		this.setupDefaultPaths()
	}

	// Discovery methods
	async discoverTools(paths?: string[]): Promise<DiscoveryReport> {
		const searchPaths = paths || this.discoveryPaths
		const report: DiscoveryReport = {
			scannedPaths: [],
			discoveredTools: [],
			errors: [],
			summary: {
				totalScanned: 0,
				totalDiscovered: 0,
				totalErrors: 0,
			},
		}

		for (const discoveryPath of searchPaths) {
			try {
				const pathReport = await this.discoverFromPath(discoveryPath)
				report.scannedPaths.push(pathReport)
				report.summary.totalScanned += pathReport.scannedFiles
				report.summary.totalDiscovered += pathReport.discoveredTools.length
				report.discoveredTools.push(...pathReport.discoveredTools)
			} catch (error) {
				const errorReport = {
					path: discoveryPath,
					error: error instanceof Error ? error.message : String(error),
					timestamp: new Date(),
				}
				report.errors.push(errorReport)
				report.summary.totalErrors++
			}
		}

		return report
	}

	async discoverFromPath(discoveryPath: string): Promise<PathDiscoveryReport> {
		const report: PathDiscoveryReport = {
			path: discoveryPath,
			scannedFiles: 0,
			discoveredTools: [],
			errors: [],
		}

		try {
			const stat = await fs.stat(discoveryPath)

			if (stat.isDirectory()) {
				// Discover from directory
				const files = await fs.readdir(discoveryPath)

				for (const file of files) {
					const filePath = path.join(discoveryPath, file)
					const tool = await this.discoverFromFile(filePath)

					if (tool) {
						report.discoveredTools.push(tool)
					}

					report.scannedFiles++
				}
			} else if (this.isToolFile(discoveryPath)) {
				// Discover from single file
				const tool = await this.discoverFromFile(discoveryPath)
				if (tool) {
					report.discoveredTools.push(tool)
				}
				report.scannedFiles = 1
			}
		} catch (error) {
			report.errors.push({
				file: discoveryPath,
				error: error instanceof Error ? error.message : String(error),
			})
		}

		return report
	}

	private async discoverFromFile(filePath: string): Promise<DiscoveredTool | null> {
		try {
			if (!this.isToolFile(filePath)) {
				return null
			}

			// Dynamic import based on file extension
			const module = await this.importToolModule(filePath)

			if (!module) {
				return null
			}

			return this.extractToolFromModule(module, filePath)
		} catch (error) {
			console.warn(`Failed to discover tool from ${filePath}:`, error)
			return null
		}
	}

	private async importToolModule(filePath: string): Promise<any> {
		const ext = path.extname(filePath)

		switch (ext) {
			case ".js":
				return await import(filePath)
			case ".ts":
				// For TypeScript files, we might need to compile first
				// or use a TypeScript runtime
				return await this.importTypeScriptModule(filePath)
			case ".json":
				return this.importJsonModule(filePath)
			default:
				throw new Error(`Unsupported file extension: ${ext}`)
		}
	}

	private async importTypeScriptModule(filePath: string): Promise<any> {
		// This would require TypeScript compilation or runtime
		// For now, we'll assume compiled JS exists alongside
		const jsPath = filePath.replace(".ts", ".js")
		return await import(jsPath)
	}

	private importJsonModule(filePath: string): any {
		const content = require(filePath)
		return {
			default: content,
			...content,
		}
	}

	private extractToolFromModule(module: any, filePath: string): DiscoveredTool | null {
		// Check for default export
		if (module.default) {
			const tool = this.createToolFromExport(module.default, filePath)
			if (tool) return tool
		}

		// Check for named exports
		for (const [exportName, exportValue] of Object.entries(module)) {
			if (exportName === "default") continue

			const tool = this.createToolFromExport(exportValue, filePath, exportName)
			if (tool) return tool
		}

		return null
	}

	private createToolFromExport(exportValue: any, filePath: string, exportName?: string): DiscoveredTool | null {
		// Check if it's a tool wrapper
		if (this.isToolWrapper(exportValue)) {
			return {
				name: exportValue.name || exportName || "unnamed",
				description: exportValue.description || "",
				filePath,
				exportName,
				type: "wrapper",
				metadata: this.extractToolMetadata(exportValue),
			}
		}

		// Check if it's a tool collection
		if (this.isToolCollection(exportValue)) {
			return {
				name: exportName || path.basename(filePath, path.extname(filePath)),
				description: `Tool collection from ${filePath}`,
				filePath,
				exportName,
				type: "collection",
				metadata: {
					count: exportValue.tools?.length || 0,
					tools: exportValue.tools?.map((tool: any) => tool.name) || [],
				},
			}
		}

		return null
	}

	private isToolWrapper(obj: any): boolean {
		return (
			obj &&
			typeof obj === "object" &&
			typeof obj.name === "string" &&
			typeof obj.description === "string" &&
			typeof obj.execute === "function" &&
			obj.schema
		)
	}

	private isToolCollection(obj: any): boolean {
		return (
			obj &&
			typeof obj === "object" &&
			Array.isArray(obj.tools) &&
			obj.tools.every((tool: any) => this.isToolWrapper(tool))
		)
	}

	private isToolFile(filePath: string): boolean {
		const ext = path.extname(filePath)
		const validExts = [".js", ".ts", ".json"]

		if (!validExts.includes(ext)) {
			return false
		}

		const basename = path.basename(filePath)

		// Skip test files and internal files
		if (basename.includes(".test.") || basename.includes(".spec.")) {
			return false
		}

		if (basename.startsWith("_") || basename.startsWith(".")) {
			return false
		}

		return true
	}

	private extractToolMetadata(tool: any): any {
		return {
			version: tool.version || "1.0.0",
			author: tool.author || "Unknown",
			license: tool.license || "MIT",
			capabilities: tool.capabilities || [],
			deprecated: tool.deprecated || false,
			dependencies: tool.dependencies || [],
		}
	}

	private setupDefaultPaths(): void {
		this.discoveryPaths = [
			path.join(__dirname, "../wrappers"),
			path.join(__dirname, "../collections"),
			path.join(process.cwd(), "tools"),
			path.join(process.cwd(), "plugins"),
		]
	}

	// Watch methods for dynamic discovery
	async watchPaths(): Promise<void> {
		for (const watchPath of this.discoveryPaths) {
			if (this.watchedPaths.has(watchPath)) continue

			try {
				await fs.watch(watchPath, (eventType, filename) => {
					if (eventType === "change") {
						this.handleFileChange(watchPath, filename)
					}
				})
				this.watchedPaths.add(watchPath)
			} catch (error) {
				console.warn(`Failed to watch path ${watchPath}:`, error)
			}
		}
	}

	private async handleFileChange(watchPath: string, filename: string): Promise<void> {
		const filePath = path.join(watchPath, filename)

		if (!this.isToolFile(filePath)) {
			return
		}

		try {
			// Rediscover the modified file
			const tool = await this.discoverFromFile(filePath)

			if (tool) {
				// Update registry with new tool
				await this.registry.updateTool(tool.name, {
					...tool,
					lastModified: new Date(),
				})
			}
		} catch (error) {
			console.warn(`Failed to handle file change for ${filePath}:`, error)
		}
	}
}

// Supporting interfaces
interface DiscoveryReport {
	scannedPaths: PathDiscoveryReport[]
	discoveredTools: DiscoveredTool[]
	errors: Array<{
		path: string
		error: string
		timestamp: Date
	}>
	summary: {
		totalScanned: number
		totalDiscovered: number
		totalErrors: number
	}
}

interface PathDiscoveryReport {
	path: string
	scannedFiles: number
	discoveredTools: DiscoveredTool[]
	errors: Array<{
		file: string
		error: string
	}>
}

interface DiscoveredTool {
	name: string
	description: string
	filePath: string
	exportName?: string
	type: "wrapper" | "collection"
	metadata: any
}
```

### Phase 3: Registration Management

**File**: `src/tools/registry/ToolRegistration.ts`

```typescript
import { ToolWrapper } from "../types/ToolTypes"
import { ToolWrapperRegistry } from "./ToolWrapperRegistry"
import { ToolDiscovery } from "./ToolDiscovery"

export class ToolRegistration {
	private registry: ToolWrapperRegistry
	private discovery: ToolDiscovery
	private registrationQueue: Array<{
		tool: ToolWrapper
		metadata?: any
		resolve: (result: RegistrationResult) => void
		reject: (error: Error) => void
	}> = []

	private isProcessing = false

	constructor(registry: ToolWrapperRegistry, discovery: ToolDiscovery) {
		this.registry = registry
		this.discovery = discovery
	}

	// Batch registration methods
	async registerTools(
		tools: Array<{
			tool: ToolWrapper
			metadata?: any
		}>,
	): Promise<BatchRegistrationResult> {
		const results: RegistrationResult[] = []

		for (const { tool, metadata } of tools) {
			try {
				const result = this.registry.registerTool(tool, metadata)
				results.push(result)
			} catch (error) {
				results.push({
					success: false,
					errors: [error instanceof Error ? error.message : String(error)],
					toolId: null,
				})
			}
		}

		const successCount = results.filter((r) => r.success).length
		const failureCount = results.length - successCount

		return {
			total: results.length,
			success: successCount,
			failures: failureCount,
			results,
		}
	}

	async registerFromDiscovery(paths?: string[]): Promise<DiscoveryRegistrationResult> {
		try {
			// Discover tools from paths
			const discoveryReport = await this.discovery.discoverTools(paths)

			// Register discovered tools
			const registrationResults: RegistrationResult[] = []

			for (const discoveredTool of discoveryReport.discoveredTools) {
				if (discoveredTool.type === "wrapper") {
					try {
						// Load the actual tool module
						const toolModule = await import(discoveredTool.filePath)
						const toolExport = toolModule[discoveredTool.exportName || "default"]

						if (toolExport) {
							const result = this.registry.registerTool(toolExport, discoveredTool.metadata)
							registrationResults.push(result)
						}
					} catch (error) {
						registrationResults.push({
							success: false,
							errors: [`Failed to load tool: ${error}`],
							toolId: null,
						})
					}
				}
			}

			return {
				discovery: discoveryReport,
				registration: {
					total: registrationResults.length,
					success: registrationResults.filter((r) => r.success).length,
					failures: registrationResults.filter((r) => !r.success).length,
					results: registrationResults,
				},
			}
		} catch (error) {
			return {
				discovery: {
					scannedPaths: [],
					discoveredTools: [],
					errors: [
						{
							path: paths?.join(",") || "default",
							error: error instanceof Error ? error.message : String(error),
							timestamp: new Date(),
						},
					],
					summary: {
						totalScanned: 0,
						totalDiscovered: 0,
						totalErrors: 1,
					},
				},
				registration: {
					total: 0,
					success: 0,
					failures: 0,
					results: [],
				},
			}
		}
	}

	// Queued registration for async processing
	queueRegistration(tool: ToolWrapper, metadata?: any): Promise<RegistrationResult> {
		return new Promise((resolve, reject) => {
			this.registrationQueue.push({
				tool,
				metadata,
				resolve,
				reject,
			})

			this.processQueue()
		})
	}

	private async processQueue(): Promise<void> {
		if (this.isProcessing || this.registrationQueue.length === 0) {
			return
		}

		this.isProcessing = true

		while (this.registrationQueue.length > 0) {
			const { tool, metadata, resolve, reject } = this.registrationQueue.shift()!

			try {
				const result = this.registry.registerTool(tool, metadata)
				resolve(result)
			} catch (error) {
				reject(error instanceof Error ? error : new Error(String(error)))
			}
		}

		this.isProcessing = false
	}

	// Validation and health checks
	async validateRegistry(): Promise<ValidationReport> {
		const tools = this.registry.getAllTools()
		const report: ValidationReport = {
			totalTools: tools.length,
			validTools: 0,
			invalidTools: 0,
			issues: [],
		}

		for (const registeredTool of tools) {
			const issues = this.validateTool(registeredTool.tool)

			if (issues.length === 0) {
				report.validTools++
			} else {
				report.invalidTools++
				report.issues.push({
					toolName: registeredTool.tool.name,
					issues,
				})
			}
		}

		return report
	}

	private validateTool(tool: ToolWrapper): string[] {
		const issues: string[] = []

		// Basic validation
		if (!tool.name) {
			issues.push("Tool missing name")
		}

		if (!tool.description) {
			issues.push("Tool missing description")
		}

		if (!tool.execute) {
			issues.push("Tool missing execute function")
		}

		if (!tool.schema) {
			issues.push("Tool missing schema")
		}

		// Schema validation
		if (tool.schema) {
			try {
				// Validate schema structure
				JSON.stringify(tool.schema)
			} catch (error) {
				issues.push(`Invalid schema: ${error}`)
			}
		}

		return issues
	}

	// Cleanup and maintenance
	async cleanupBrokenTools(): Promise<CleanupReport> {
		const tools = this.registry.getAllTools()
		const report: CleanupReport = {
			removed: [],
			errors: [],
		}

		for (const registeredTool of tools) {
			try {
				// Test tool functionality
				await this.testTool(registeredTool.tool)
			} catch (error) {
				// Tool is broken, remove it
				const removed = this.registry.unregisterTool(registeredTool.tool.name)
				if (removed) {
					report.removed.push({
						toolName: registeredTool.tool.name,
						reason: error instanceof Error ? error.message : String(error),
					})
				} else {
					report.errors.push({
						toolName: registeredTool.tool.name,
						error: "Failed to remove broken tool",
					})
				}
			}
		}

		return report
	}

	private async testTool(tool: ToolWrapper): Promise<void> {
		// Basic functionality test
		if (typeof tool.execute !== "function") {
			throw new Error("Tool execute function is not callable")
		}

		// Test with minimal valid input
		const testInput = this.generateTestInput(tool.schema)
		await tool.execute(testInput)
	}

	private generateTestInput(schema: any): any {
		// Generate minimal valid input based on schema
		if (!schema || !schema.properties) {
			return {}
		}

		const input: any = {}

		for (const [key, prop] of Object.entries(schema.properties || {})) {
			if (prop.default !== undefined) {
				input[key] = prop.default
			} else if (prop.type === "boolean") {
				input[key] = false
			} else if (prop.type === "string") {
				input[key] = "test"
			} else if (prop.type === "number") {
				input[key] = 0
			}
		}

		return input
	}
}

// Supporting interfaces
interface BatchRegistrationResult {
	total: number
	success: number
	failures: number
	results: RegistrationResult[]
}

interface DiscoveryRegistrationResult {
	discovery: DiscoveryReport
	registration: BatchRegistrationResult
}

interface ValidationReport {
	totalTools: number
	validTools: number
	invalidTools: number
	issues: Array<{
		toolName: string
		issues: string[]
	}>
}

interface CleanupReport {
	removed: Array<{
		toolName: string
		reason: string
	}>
	errors: Array<{
		toolName: string
		error: string
	}>
}
```

---

## 5. Dependencies Analysis

### Prerequisites from Task 1.1-1.4, 2.1-2.4

Based on tasklist analysis, following must be completed first:

1. **Task 1.1**: LangChain/LangGraph dependencies installed
2. **Task 1.2**: LangGraph tool wrapper base class created
3. **Task 1.3**: Zod schema validation system implemented
4. **Task 1.4**: Transitional execution layer implemented
5. **Task 2.1-2.4**: Individual tool wrappers implemented

### Current Dependencies

From package.json analysis:

- **Node.js fs/promises**: File system operations
- **Node.js path**: Path manipulation
- **EventEmitter**: Event-driven architecture
- **Dynamic imports**: Runtime module loading

### File Dependencies

- [ ] `src/tools/wrappers/`: Tool wrapper implementations to register
- [ ] `src/tools/types/`: Tool type definitions
- [ ] `src/services/mcp/McpHub.ts`: MCP integration
- [ ] `src/core/tools/`: Existing tool implementations

---

## 6. Testing Strategy

### Unit Test Structure

**File**: `src/tests/tools/registry/ToolWrapperRegistry.test.ts`

```typescript
import { describe, test, expect, beforeEach, afterEach } from "vitest"
import { ToolWrapperRegistry } from "../../../tools/registry/ToolWrapperRegistry"
import { createMockTool } from "../../mocks/MockTool"

describe("ToolWrapperRegistry", () => {
	let registry: ToolWrapperRegistry

	beforeEach(() => {
		registry = new ToolWrapperRegistry()
	})

	test("should register tool successfully", () => {
		const tool = createMockTool("test-tool", "Test tool")

		const result = registry.registerTool(tool)

		expect(result.success).toBe(true)
		expect(result.errors).toHaveLength(0)
		expect(result.toolId).toBeDefined()

		const registered = registry.getTool("test-tool")
		expect(registered).toBeDefined()
		expect(registered!.tool).toBe(tool)
	})

	test("should reject invalid tool", () => {
		const invalidTool = {
			name: "", // Invalid empty name
			description: "Test tool",
			execute: () => {},
			schema: {},
		}

		const result = registry.registerTool(invalidTool)

		expect(result.success).toBe(false)
		expect(result.errors.length).toBeGreaterThan(0)
	})

	test("should handle tool categories", () => {
		const tool1 = createMockTool("tool1", "Tool 1")
		const tool2 = createMockTool("tool2", "Tool 2")

		registry.registerTool(tool1, { category: "file" })
		registry.registerTool(tool2, { category: "network" })

		const fileTools = registry.getToolsByCategory("file")
		const networkTools = registry.getToolsByCategory("network")

		expect(fileTools).toHaveLength(1)
		expect(networkTools).toHaveLength(1)
		expect(fileTools[0].tool).toBe(tool1)
		expect(networkTools[0].tool).toBe(tool2)
	})

	test("should discover tools", () => {
		const tool1 = createMockTool("search-tool", "Search tool")
		const tool2 = createMockTool("file-tool", "File tool")

		registry.registerTool(tool1, { tags: ["search", "text"] })
		registry.registerTool(tool2, { tags: ["file", "write"] })

		// Search by tag
		const searchResults = registry.discoverTools({ tags: ["search"] })
		expect(searchResults.tools).toHaveLength(1)
		expect(searchResults.tools[0].tool.name).toBe("search-tool")

		// Search by text
		const textResults = registry.discoverTools({ search: "file" })
		expect(textResults.tools).toHaveLength(1)
		expect(textResults.tools[0].tool.name).toBe("file-tool")
	})
})
```

### Integration Testing

- Test discovery with actual file system
- Verify registration with real tool modules
- Test dynamic loading and unloading
- Validate performance with large numbers of tools

---

## 7. Implementation Checklist

### Pre-Implementation

- [ ] Review existing registry patterns in codebase
- [ ] Define tool metadata structure
- [ ] Plan discovery paths and mechanisms
- [ ] Design validation and error handling

### Implementation Steps

1. [ ] Create ToolWrapperRegistry with core functionality
2. [ ] Implement ToolDiscovery with file system scanning
3. [ ] Create ToolRegistration with batch processing
4. [ ] Add event-driven architecture
5. [ ] Implement usage tracking and statistics
6. [ ] Add validation and health checks
7. [ ] Create comprehensive unit tests
8. [ ] Add integration tests with real tools

### Post-Implementation

- [ ] Run TypeScript compilation: `cd src && npm run check-types`
- [ ] Execute unit tests: `cd src && npx vitest run tools/registry/`
- [ ] Test discovery with actual tool files
- [ ] Validate performance with large tool sets
- [ ] Test dynamic loading and registration

---

## 8. Risk Mitigation

### Technical Risks

1. **Dynamic Loading Security**: Loading arbitrary modules may be risky

    - **Mitigation**: Validate modules before loading, sandbox execution
    - **Strategy**: Whitelist allowed paths, module validation

2. **Performance Impact**: Large numbers of tools may affect performance

    - **Mitigation**: Lazy loading, efficient data structures
    - **Monitoring**: Performance metrics and optimization

3. **Memory Leaks**: Tool registry may accumulate references
    - **Mitigation**: Proper cleanup, weak references
    - **Testing**: Memory usage monitoring

### Integration Risks

1. **Tool Conflicts**: Multiple tools with same name may conflict

    - **Mitigation**: Version management, namespace support
    - **Strategy**: Clear conflict resolution policies

2. **Discovery Failures**: File system issues may break discovery
    - **Mitigation**: Error handling, fallback mechanisms
    - **Testing**: Comprehensive error scenario testing

---

## 9. Success Criteria

### Functional Requirements

- [ ] Dynamic tool registration and unregistration
- [ ] Automatic tool discovery from file system
- [ ] Tool categorization and metadata management
- [ ] Search and filtering capabilities
- [ ] Usage tracking and statistics
- [ ] Event-driven architecture
- [ ] Validation and error handling

### Quality Requirements

- [ ] Unit test coverage >95%
- [ ] Integration test coverage >90%
- [ ] Performance with <100ms registration time
- [ ] Memory usage <10MB for 1000 tools
- [ ] TypeScript strict mode compliance

### Maintainability Requirements

- [ ] Clear API design
- [ ] Comprehensive documentation
- [ ] Extensible architecture
- [ ] Plugin-like system support
- [ ] Monitoring and debugging support

---

## 10. External References

### Registry Patterns

- [Node.js Module Registry](https://nodejs.org/api/esm.html): Module loading patterns
- [Plugin Architecture](https://github.com/webpack/webpack): Plugin system design
- [Service Registry](https://docs.microsoft.com/en-us/aspnet/core/fundamentals/dependency-injection/service-locator): Service registration patterns

### Discovery Systems

- [File System Watching](https://nodejs.org/api/fs.html#fswatchfilename-options-listener): File watching patterns
- [Dynamic Imports](https://nodejs.org/api/esm.html#import): Dynamic module loading
- [Module Resolution](https://nodejs.org/api/esm.html#import-specifiers): Module resolution algorithms

### Best Practices

- [Event-Driven Architecture](https://www.patterns.dev/posts/event-driven-architecture): Event system design
- [Registry Pattern](https://en.wikipedia.org/wiki/Registry_pattern): Registry implementation patterns
- [Plugin Development](https://github.com/webpack/webpack/blob/main/CONTRIBUTING.md#plugin-development): Plugin development guidelines

---

**Note**: This context provides comprehensive registry implementation guidance based on analysis of existing codebase patterns, external best practices, and established architectural patterns. All implementation steps should follow existing conventions while providing a robust, extensible tool management system.
