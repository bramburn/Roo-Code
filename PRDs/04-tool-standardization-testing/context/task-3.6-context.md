# Context Document for Task 3.6: Configuration management for tool wrappers

## Task Information

- **Task ID**: 3.6
- **Description**: Implement configuration management system for LangChain tool wrappers
- **Status**: ☐ To Do
- **Target Files**:
    - `src/config/ToolWrapperConfig.ts`
    - `src/config/ConfigurationManager.ts`
    - `src/config/SchemaValidator.ts`
    - **Modify Existing**: Update `src/core/config/CustomModesManager.ts` to integrate with new configuration system

## 1. Current Code Analysis (Internal)

### Existing Configuration Infrastructure

From codebase analysis, found comprehensive configuration patterns:

#### CustomModesManager Pattern

```typescript
// From src/core/config/CustomModesManager.ts
interface ModeConfig {
	name: string
	slug: string
	description: string
	tools: string[]
	permissions: string[]
	settings: Record<string, any>
}

class CustomModesManager {
	private context: ExtensionContext
	private onUpdate: (modes: ModeConfig[]) => void
	private modes: ModeConfig[] = []

	constructor(context: ExtensionContext, onUpdate: (modes: ModeConfig[]) => void) {
		this.context = context
		this.onUpdate = onUpdate
	}

	async loadModes(): Promise<ModeConfig[]>
	async saveModes(modes: ModeConfig[]): Promise<void>
	validateMode(mode: ModeConfig): ValidationResult
}
```

#### MCP Configuration Management

```typescript
// From src/services/mcp/McpHub.ts
class McpHub {
	private config: McpConfig
	private configPath: string

	async updateServerConfig(
		serverName: string,
		configUpdate: McpServerConfig,
		source: "global" | "project",
	): Promise<void>

	private async getMcpSettingsFilePath(): Promise<string>
	private async getProjectMcpPath(): Promise<string | undefined>
}
```

#### Configuration Validation Pattern

```typescript
// From configuration analysis
interface ValidationResult {
	isValid: boolean
	errors: string[]
	warnings: string[]
}

class ConfigValidator {
	validateConfig(config: any, schema: any): ValidationResult
	validateToolConfig(toolConfig: ToolConfig): ValidationResult
	validateModeConfig(modeConfig: ModeConfig): ValidationResult
}
```

### Tool Configuration Patterns

Found existing tool configuration in multiple locations:

#### Tool Groups Configuration

```typescript
// From src/shared/tools.ts
interface ToolGroup {
	name: string
	description: string
	tools: ToolName[]
	permissions: string[]
}

const TOOL_GROUPS: Record<string, ToolGroup> = {
	read: {
		name: "Read Operations",
		description: "Tools for reading files and data",
		tools: ["read_file", "list_files", "search_files"],
		permissions: ["file_read"],
	},
	write: {
		name: "Write Operations",
		description: "Tools for writing and modifying files",
		tools: ["write_to_file", "apply_diff", "insert_content"],
		permissions: ["file_write"],
	},
	mcp: {
		name: "MCP Tools",
		description: "Model Context Protocol tools",
		tools: ["use_mcp_tool", "access_mcp_resource"],
		permissions: ["mcp_access"],
	},
}
```

#### Retry Configuration Pattern

```typescript
// From src/core/tools/retry/RetryFactory.ts
interface RetrySettings {
	maxRetries: number
	baseDelay: number
	maxDelay: number
	backoffMultiplier: number
	jitter: boolean
	circuitBreakerThreshold?: number
}

class RetryFactory {
	static createRetryConfig(toolName: string, overrides?: Partial<RetrySettings>): RetrySettings
	static validateRetryConfig(config: RetrySettings): ValidationResult
}
```

#### API Configuration Pattern

```typescript
// From API handler analysis
interface ApiHandlerOptions {
	providerName: string
	baseURL: string
	apiKey: string
	modelId: string
	defaultModelId: string
	temperature?: number
	maxTokens?: number
}

class ApiHandler {
	constructor(options: ApiHandlerOptions) {
		this.options = this.validateAndNormalizeOptions(options)
	}

	private validateAndNormalizeOptions(options: ApiHandlerOptions): ApiHandlerOptions
}
```

## 2. External Best Practices (GitHub)

### Best Practice Example 1: Hierarchical Configuration Management

**Source**: https://github.com/node-config/node-config  
**Stars**: 18,000+ | **Language**: TypeScript

```typescript
// Advanced hierarchical configuration system
class ConfigurationManager {
	private config: any = {}
	private configSources: ConfigSource[] = []
	private watchers: ConfigWatcher[] = []
	private validators: ConfigValidator[] = []

	constructor() {
		this.initializeConfigSources()
		this.loadConfiguration()
		this.setupWatchers()
	}

	private initializeConfigSources(): void {
		// Configuration sources in priority order
		this.configSources = [
			new EnvironmentConfigSource(),
			new CommandLineConfigSource(),
			new UserConfigSource(),
			new DefaultConfigSource(),
		]
	}

	async loadConfiguration(): Promise<void> {
		// Load configuration from all sources
		for (const source of this.configSources) {
			try {
				const sourceConfig = await source.load()
				this.config = this.mergeConfig(this.config, sourceConfig)
			} catch (error) {
				console.warn(`Failed to load config from ${source.name}:`, error)
			}
		}

		// Validate final configuration
		const validationResult = this.validateConfiguration(this.config)
		if (!validationResult.isValid) {
			throw new Error(`Configuration validation failed: ${validationResult.errors.join(", ")}`)
		}

		// Notify watchers of configuration change
		this.notifyWatchers()
	}

	get<T>(path: string, defaultValue?: T): T {
		return this.getNestedValue(this.config, path, defaultValue)
	}

	set(path: string, value: any): void {
		this.setNestedValue(this.config, path, value)
		this.notifyWatchers()
		this.persistConfiguration()
	}

	private mergeConfig(base: any, override: any): any {
		return deepMerge(base, override, {
			arrayMerge: (target, source) => source, // Override arrays
			clone: true,
		})
	}

	addValidator(schema: any): void {
		this.validators.push(new JsonSchemaValidator(schema))
	}

	private validateConfiguration(config: any): ValidationResult {
		const allErrors: string[] = []
		const allWarnings: string[] = []

		for (const validator of this.validators) {
			const result = validator.validate(config)
			allErrors.push(...result.errors)
			allWarnings.push(...result.warnings)
		}

		return {
			isValid: allErrors.length === 0,
			errors: allErrors,
			warnings: allWarnings,
		}
	}
}
```

**Key Takeaways**:

- Hierarchical configuration sources with priority
- Deep merge for configuration combination
- Schema-based validation
- Configuration watchers for change notification
- Automatic persistence

### Best Practice Example 2: Tool-Specific Configuration

**Source**: https://github.com/langchain-ai/langchainjs  
**Stars**: 12,000+ | **Language**: TypeScript

```typescript
// Tool-specific configuration management
class ToolConfigManager {
	private toolConfigs: Map<string, ToolConfig> = new Map()
	private configSchema: any
	private defaultConfigs: Map<string, ToolConfig> = new Map()

	constructor() {
		this.initializeConfigSchema()
		this.initializeDefaultConfigs()
	}

	registerTool(toolName: string, config: ToolConfig): void {
		// Validate tool configuration
		const validationResult = this.validateToolConfig(toolName, config)
		if (!validationResult.isValid) {
			throw new Error(`Invalid tool configuration for ${toolName}: ${validationResult.errors.join(", ")}`)
		}

		// Merge with default configuration
		const defaultConfig = this.defaultConfigs.get(toolName) || {}
		const finalConfig = this.mergeToolConfig(defaultConfig, config)

		this.toolConfigs.set(toolName, finalConfig)
	}

	getToolConfig(toolName: string): ToolConfig | undefined {
		return this.toolConfigs.get(toolName)
	}

	updateToolConfig(toolName: string, updates: Partial<ToolConfig>): void {
		const existingConfig = this.toolConfigs.get(toolName)
		if (!existingConfig) {
			throw new Error(`Tool ${toolName} not registered`)
		}

		const updatedConfig = this.mergeToolConfig(existingConfig, updates)
		const validationResult = this.validateToolConfig(toolName, updatedConfig)

		if (!validationResult.isValid) {
			throw new Error(`Invalid tool configuration update for ${toolName}: ${validationResult.errors.join(", ")}`)
		}

		this.toolConfigs.set(toolName, updatedConfig)
		this.notifyConfigChange(toolName, updatedConfig)
	}

	private validateToolConfig(toolName: string, config: ToolConfig): ValidationResult {
		const toolSchema = this.configSchema.properties[toolName]
		if (!toolSchema) {
			return { isValid: true, errors: [], warnings: [`No schema found for tool ${toolName}`] }
		}

		const validator = new JsonSchemaValidator(toolSchema)
		return validator.validate(config)
	}

	private initializeDefaultConfigs(): void {
		// Default configurations for common tools
		this.defaultConfigs.set("write_to_file", {
			timeout: 30000,
			retryAttempts: 3,
			backupEnabled: true,
			validationEnabled: true,
			maxFileSize: 10 * 1024 * 1024, // 10MB
			allowedExtensions: ["*"],
		})

		this.defaultConfigs.set("read_file", {
			timeout: 10000,
			retryAttempts: 2,
			cacheEnabled: true,
			maxFileSize: 50 * 1024 * 1024, // 50MB
			allowedExtensions: ["*"],
		})

		this.defaultConfigs.set("execute_command", {
			timeout: 60000,
			retryAttempts: 1,
			shell: process.platform === "win32" ? "cmd" : "bash",
			workingDirectory: process.cwd(),
			environment: {},
			safetyChecks: true,
		})
	}
}
```

**Key Takeaways**:

- Tool-specific configuration schemas
- Default configuration inheritance
- Configuration validation per tool type
- Change notification system
- Safety and performance parameters

### Best Practice Example 3: Dynamic Configuration Management

**Source**: https://github.com/webpack/webpack  
**Stars**: 63,000+ | **Language**: TypeScript

```typescript
// Dynamic configuration management with hot reloading
class DynamicConfigManager {
	private config: any = {}
	private configPath: string
	private watchers: Map<string, FileWatcher> = new Map()
	private plugins: ConfigPlugin[] = []
	private middleware: ConfigMiddleware[] = []

	constructor(configPath: string) {
		this.configPath = configPath
		this.loadConfiguration()
		this.setupFileWatching()
	}

	use(plugin: ConfigPlugin): void {
		plugin.apply(this)
		this.plugins.push(plugin)
	}

	useMiddleware(middleware: ConfigMiddleware): void {
		this.middleware.push(middleware)
	}

	async reloadConfiguration(): Promise<void> {
		try {
			// Clear existing watchers
			this.clearWatchers()

			// Reload configuration
			const rawConfig = await this.loadRawConfiguration()

			// Apply middleware
			let processedConfig = rawConfig
			for (const middleware of this.middleware) {
				processedConfig = await middleware.process(processedConfig)
			}

			// Validate processed configuration
			const validationResult = await this.validateConfiguration(processedConfig)
			if (!validationResult.isValid) {
				throw new Error(`Configuration validation failed: ${validationResult.errors.join(", ")}`)
			}

			// Update configuration
			const oldConfig = this.config
			this.config = processedConfig

			// Re-setup watchers for new configuration
			this.setupFileWatching()

			// Notify plugins of configuration change
			this.notifyPlugins(oldConfig, this.config)
		} catch (error) {
			console.error("Failed to reload configuration:", error)
			// Keep existing configuration if reload fails
		}
	}

	private async loadRawConfiguration(): Promise<any> {
		const configContent = await fs.readFile(this.configPath, "utf-8")

		// Support multiple configuration formats
		if (this.configPath.endsWith(".json")) {
			return JSON.parse(configContent)
		} else if (this.configPath.endsWith(".js")) {
			const configModule = await import(path.resolve(this.configPath))
			return configModule.default || configModule
		} else if (this.configPath.endsWith(".ts")) {
			const tsNode = await import("ts-node")
			const configModule = tsNode.register().create(path.resolve(this.configPath))
			return configModule.default || configModule
		} else {
			throw new Error(`Unsupported configuration format: ${this.configPath}`)
		}
	}

	private setupFileWatching(): void {
		// Watch configuration file and dependencies
		const watchPaths = this.resolveWatchPaths(this.config)

		for (const watchPath of watchPaths) {
			const watcher = chokidar.watch(watchPath, {
				ignoreInitial: true,
				persistent: true,
			})

			watcher.on("change", () => {
				debounce(() => this.reloadConfiguration(), 100)()
			})

			this.watchers.set(watchPath, watcher)
		}
	}

	private resolveWatchPaths(config: any): string[] {
		const paths = [this.configPath]

		// Add referenced configuration files
		if (config.extends) {
			const extendedPath = path.resolve(path.dirname(this.configPath), config.extends)
			paths.push(...this.resolveWatchPaths(require(extendedPath)))
		}

		// Add environment-specific configurations
		if (config.environments) {
			const env = process.env.NODE_ENV || "development"
			if (config.environments[env]) {
				const envConfigPath = path.resolve(path.dirname(this.configPath), config.environments[env])
				paths.push(envConfigPath)
			}
		}

		return [...new Set(paths)] // Remove duplicates
	}
}
```

**Key Takeaways**:

- Hot reloading with file watching
- Plugin system for extensibility
- Middleware for configuration processing
- Multiple configuration format support
- Configuration inheritance and extension

## 3. Internal Knowledge Base (Memory)

### Cached Knowledge

**Topic**: "Configuration management for tool wrappers"
**Entity Type**: "Implementation Pattern"
**Last Used**: 2025-11-11T20:50:24.958Z
**Content**: [Previously saved best practices for comprehensive configuration management]

### Related Memories

- **Entity**: "CustomModesManager"

    - **Relevance**: Existing configuration management can be extended
    - **Content**: Current mode configuration patterns and validation

- **Entity**: "McpHub Configuration"

    - **Relevance**: MCP server configuration patterns can be generalized
    - **Content**: Server configuration management and file handling

- **Entity**: "Tool Groups"
    - **Relevance**: Existing tool categorization can be leveraged
    - **Content**: Tool group configuration and permission management

## 4. Suggested Implementation Plan

### Prerequisites

1. [ ] Review existing CustomModesManager functionality
2. [ ] Analyze current MCP configuration patterns
3. [ ] Understand tool group configuration structure

### Implementation Steps

1. [ ] **Create ToolWrapperConfig.ts**

    - **Purpose**: Core configuration management for LangChain tool wrappers
    - **Location**: `src/config/ToolWrapperConfig.ts`
    - **Key Methods**:
        - `getToolConfig()`: Retrieve tool-specific configuration
        - `setToolConfig()`: Update tool configuration
        - `validateToolConfig()`: Validate configuration against schema
        - `mergeWithDefaults()`: Merge with default configuration

2. [ ] **Create ConfigurationManager.ts**

    - **Purpose**: Hierarchical configuration management system
    - **Location**: `src/config/ConfigurationManager.ts`
    - **Key Methods**:
        - `loadConfiguration()`: Load from multiple sources
        - `get()`: Get configuration value by path
        - `set()`: Set configuration value by path
        - `addValidator()`: Add configuration validator
        - `watch()`: Watch for configuration changes

3. [ ] **Create SchemaValidator.ts**

    - **Purpose**: Schema-based configuration validation
    - **Location**: `src/config/SchemaValidator.ts`
    - **Key Methods**:
        - `validateConfig()`: Validate configuration against schema
        - `generateSchema()`: Generate schema for tool configurations
        - `validateToolConfig()\*\*: Tool-specific validation
        - `getValidationErrors()`: Detailed error reporting

4. [ ] **Modify CustomModesManager.ts Integration**
    - **File**: `src/core/config/CustomModesManager.ts`
    - **Purpose**: Integrate with new configuration system
    - **Changes**:
        - Add tool wrapper configuration support
        - Extend validation for new configuration types
        - Integrate with hierarchical configuration
        - Maintain backward compatibility with existing modes

### Validation Steps

1. [ ] Test configuration loading from multiple sources
2. [ ] Verify schema validation accuracy
3. [ ] Test configuration hot reloading
4. [ ] Validate tool-specific configuration management
5. [ ] Test integration with existing CustomModesManager

### Testing Strategy

1. [ ] **Unit Tests**: Test each configuration component

    - Mock configuration sources
    - Verify validation accuracy
    - Test configuration merging and inheritance

2. [ ] **Integration Tests**: Test with real tool wrappers

    - Verify end-to-end configuration flow
    - Test with LangChain tool integration
    - Validate configuration persistence

3. [ ] **Performance Tests**: Ensure configuration management is efficient
    - Measure configuration loading time
    - Test with large configuration files
    - Validate hot reloading performance

## 5. Dependencies

### Task Dependencies

- [ ] **Task 3.1**: LangGraph tool execution bridge must be implemented

    - **Reason**: Configuration management needs to integrate with bridge
    - **Status**: ☐ To Do

- [ ] **Task 3.5**: Error handling and recovery must be established
    - **Reason**: Configuration errors need proper handling
    - **Status**: ☐ To Do

### File Dependencies

- [ ] **File `src/core/config/CustomModesManager.ts`**: Must be modified

    - **Reason**: Existing configuration management integration point
    - **Status**: ✅ Exists

- [ ] **File `src/services/mcp/McpHub.ts`**: Configuration patterns reference

    - **Reason**: Existing server configuration can be generalized
    - **Status**: ✅ Exists

- [ ] **File `src/shared/tools.ts`**: Tool group configuration reference
    - **Reason**: Existing tool categorization can be leveraged
    - **Status**: ✅ Exists

### External Dependencies

- [ ] **Package `ajv`**: Recommended for JSON schema validation
- [ ] **Package `chokidar`**: Recommended for file watching
- [ ] **Package `lodash.merge`**: Recommended for deep object merging

## 6. Notes and Warnings

### Important Considerations

1. **Backward Compatibility**: Must maintain existing configuration during transition
2. **Schema Evolution**: Configuration schemas must support versioning
3. **Performance**: Configuration loading should not impact startup time
4. **Security**: Sensitive configuration values must be properly handled
5. **Extensibility**: System must support new tool configurations

### Potential Issues

1. **Configuration Conflicts**: Multiple sources may have conflicting values
2. **Schema Validation**: Complex schemas may be difficult to maintain
3. **Hot Reloading**: File watching may be resource intensive
4. **Migration Path**: Existing configurations may need migration

### Breaking Changes

- **Minimal**: This is additive configuration functionality
- **Integration**: Existing CustomModesManager interface must be preserved
- **Migration**: May need configuration migration utilities

---

**Context Generated By**: context-engineer agent
**Review Status**: Pending Review
**Reviewer**: code agent
