/**
 * Configuration options for the transitional execution layer
 */
export interface TransitionalConfig {
	enabled: boolean
	loggingEnabled: boolean
	maxConcurrentTools: number
	defaultTimeout: number
	enablePerformanceMonitoring: boolean
	enableErrorRecovery: boolean
	strictValidation: boolean
	fallbackToLegacy: boolean
	allowedTools: string[]
	blockedTools: string[]
	customWrappers: Record<string, string>
	environmentVariables: Record<string, string>
}

/**
 * Feature flags for transitional layer functionality
 */
export interface TransitionalFeatureFlags {
	ENABLE_LANGGRAPH_TOOLS: boolean
	ENABLE_LEGACY_COMPATIBILITY: boolean
	ENABLE_PERFORMANCE_MONITORING: boolean
	ENABLE_ADVANCED_ERROR_HANDLING: boolean
	ENABLE_TOOL_CACHING: boolean
	ENABLE_EXECUTION_LOGGING: boolean
	ENABLE_SECURITY_VALIDATION: boolean
	ENABLE_MCP_INTEGRATION: boolean
	ENABLE_AUTO_MIGRATION: boolean
	ENABLE_BATCH_EXECUTION: boolean
}

/**
 * Default configuration for transitional layer
 */
export const DEFAULT_TRANSITIONAL_CONFIG: TransitionalConfig = {
	enabled: true,
	loggingEnabled: true,
	maxConcurrentTools: 5,
	defaultTimeout: 30000, // 30 seconds
	enablePerformanceMonitoring: true,
	enableErrorRecovery: true,
	strictValidation: true,
	fallbackToLegacy: true,
	allowedTools: [], // Empty means all tools allowed
	blockedTools: [], // Empty means no tools blocked
	customWrappers: {},
	environmentVariables: {},
}

/**
 * Default feature flags
 */
export const DEFAULT_FEATURE_FLAGS: TransitionalFeatureFlags = {
	ENABLE_LANGGRAPH_TOOLS: true,
	ENABLE_LEGACY_COMPATIBILITY: true,
	ENABLE_PERFORMANCE_MONITORING: true,
	ENABLE_ADVANCED_ERROR_HANDLING: true,
	ENABLE_TOOL_CACHING: false,
	ENABLE_EXECUTION_LOGGING: true,
	ENABLE_SECURITY_VALIDATION: true,
	ENABLE_MCP_INTEGRATION: true,
	ENABLE_AUTO_MIGRATION: false,
	ENABLE_BATCH_EXECUTION: false,
}

/**
 * Configuration manager for transitional execution layer
 */
export class TransitionalConfigManager {
	private config: TransitionalConfig
	private featureFlags: TransitionalFeatureFlags
	private configPath: string

	constructor(configPath?: string) {
		this.configPath = configPath || this.getDefaultConfigPath()
		this.config = { ...DEFAULT_TRANSITIONAL_CONFIG }
		this.featureFlags = { ...DEFAULT_FEATURE_FLAGS }
		this.loadConfiguration()
	}

	/**
	 * Get current configuration
	 */
	public getConfig(): TransitionalConfig {
		return { ...this.config }
	}

	/**
	 * Get feature flags
	 */
	public getFeatureFlags(): TransitionalFeatureFlags {
		return { ...this.featureFlags }
	}

	/**
	 * Update configuration
	 */
	public updateConfig(updates: Partial<TransitionalConfig>): void {
		this.config = { ...this.config, ...updates }
		this.saveConfiguration()
	}

	/**
	 * Update feature flags
	 */
	public updateFeatureFlags(updates: Partial<TransitionalFeatureFlags>): void {
		this.featureFlags = { ...this.featureFlags, ...updates }
		this.saveConfiguration()
	}

	/**
	 * Check if a feature is enabled
	 */
	public isFeatureEnabled(feature: keyof TransitionalFeatureFlags): boolean {
		return this.featureFlags[feature]
	}

	/**
	 * Check if a tool is allowed
	 */
	public isToolAllowed(toolName: string): boolean {
		// Check blocked tools first
		if (this.config.blockedTools.includes(toolName)) {
			return false
		}

		// If allowed tools list is empty, all tools are allowed
		if (this.config.allowedTools.length === 0) {
			return true
		}

		// Check if tool is in allowed list
		return this.config.allowedTools.includes(toolName)
	}

	/**
	 * Check if transitional layer is enabled
	 */
	public isEnabled(): boolean {
		return this.config.enabled
	}

	/**
	 * Get timeout for tool execution
	 */
	public getTimeout(toolName?: string): number {
		// Tool-specific timeouts could be configured here
		return this.config.defaultTimeout
	}

	/**
	 * Get maximum concurrent tool executions
	 */
	public getMaxConcurrentTools(): number {
		return this.config.maxConcurrentTools
	}

	/**
	 * Check if performance monitoring is enabled
	 */
	public isPerformanceMonitoringEnabled(): boolean {
		return this.config.enablePerformanceMonitoring && this.featureFlags.ENABLE_PERFORMANCE_MONITORING
	}

	/**
	 * Check if error recovery is enabled
	 */
	public isErrorRecoveryEnabled(): boolean {
		return this.config.enableErrorRecovery && this.featureFlags.ENABLE_ADVANCED_ERROR_HANDLING
	}

	/**
	 * Check if strict validation is enabled
	 */
	public isStrictValidationEnabled(): boolean {
		return this.config.strictValidation && this.featureFlags.ENABLE_SECURITY_VALIDATION
	}

	/**
	 * Check if fallback to legacy tools is enabled
	 */
	public isFallbackEnabled(): boolean {
		return this.config.fallbackToLegacy && this.featureFlags.ENABLE_LEGACY_COMPATIBILITY
	}

	/**
	 * Get custom wrapper configuration
	 */
	public getCustomWrapper(toolName: string): string | undefined {
		return this.config.customWrappers[toolName]
	}

	/**
	 * Get environment variable
	 */
	public getEnvironmentVariable(key: string): string | undefined {
		return this.config.environmentVariables[key] || process.env[key]
	}

	/**
	 * Reset configuration to defaults
	 */
	public resetToDefaults(): void {
		this.config = { ...DEFAULT_TRANSITIONAL_CONFIG }
		this.featureFlags = { ...DEFAULT_FEATURE_FLAGS }
		this.saveConfiguration()
	}

	/**
	 * Validate configuration
	 */
	public validateConfiguration(): {
		valid: boolean
		errors: string[]
		warnings: string[]
	} {
		const errors: string[] = []
		const warnings: string[] = []

		// Validate timeout
		if (this.config.defaultTimeout <= 0) {
			errors.push("Default timeout must be positive")
		}

		// Validate concurrent tools
		if (this.config.maxConcurrentTools <= 0) {
			errors.push("Max concurrent tools must be positive")
		}

		// Validate tool lists
		for (const tool of this.config.blockedTools) {
			if (this.config.allowedTools.includes(tool)) {
				warnings.push(`Tool ${tool} is both allowed and blocked`)
			}
		}

		// Validate feature flags consistency
		if (this.featureFlags.ENABLE_LANGGRAPH_TOOLS && !this.featureFlags.ENABLE_LEGACY_COMPATIBILITY) {
			warnings.push("LangGraph tools enabled but legacy compatibility disabled - may break existing workflows")
		}

		return {
			valid: errors.length === 0,
			errors,
			warnings,
		}
	}

	/**
	 * Export configuration
	 */
	public exportConfiguration(): {
		config: TransitionalConfig
		featureFlags: TransitionalFeatureFlags
		validation: ReturnType<typeof TransitionalConfigManager.prototype.validateConfiguration>
		exportTime: string
		version: string
	} {
		return {
			config: this.getConfig(),
			featureFlags: this.getFeatureFlags(),
			validation: this.validateConfiguration(),
			exportTime: new Date().toISOString(),
			version: "1.0.0",
		}
	}

	/**
	 * Import configuration
	 */
	public importConfiguration(importedConfig: {
		config: TransitionalConfig
		featureFlags: TransitionalFeatureFlags
	}): void {
		// Validate imported configuration before applying
		const tempConfig = { ...this.config, ...importedConfig.config }
		const tempFlags = { ...this.featureFlags, ...importedConfig.featureFlags }

		// Basic validation
		if (tempConfig.defaultTimeout <= 0 || tempConfig.maxConcurrentTools <= 0) {
			throw new Error("Invalid configuration values detected")
		}

		this.config = tempConfig
		this.featureFlags = tempFlags
		this.saveConfiguration()
	}

	/**
	 * Get default configuration file path
	 */
	private getDefaultConfigPath(): string {
		// This would return an appropriate path based on the environment
		return process.env.TRANSITIONAL_CONFIG_PATH || "./transitional-config.json"
	}

	/**
	 * Load configuration from file
	 */
	private loadConfiguration(): void {
		try {
			// In a real implementation, this would read from the config file
			// For now, we'll use environment variables and defaults
			this.loadFromEnvironment()
		} catch (error) {
			console.warn("Failed to load transitional configuration:", error)
			// Continue with defaults
		}
	}

	/**
	 * Load configuration from environment variables
	 */
	private loadFromEnvironment(): void {
		// Load boolean flags
		if (process.env.TRANSITIONAL_ENABLED !== undefined) {
			this.config.enabled = process.env.TRANSITIONAL_ENABLED === "true"
		}

		if (process.env.TRANSITIONAL_LOGGING !== undefined) {
			this.config.loggingEnabled = process.env.TRANSITIONAL_LOGGING === "true"
		}

		// Load numeric values
		if (process.env.TRANSITIONAL_TIMEOUT) {
			const timeout = parseInt(process.env.TRANSITIONAL_TIMEOUT, 10)
			if (!isNaN(timeout) && timeout > 0) {
				this.config.defaultTimeout = timeout
			}
		}

		if (process.env.TRANSITIONAL_MAX_CONCURRENT) {
			const maxConcurrent = parseInt(process.env.TRANSITIONAL_MAX_CONCURRENT, 10)
			if (!isNaN(maxConcurrent) && maxConcurrent > 0) {
				this.config.maxConcurrentTools = maxConcurrent
			}
		}

		// Load tool lists
		if (process.env.TRANSITIONAL_ALLOWED_TOOLS) {
			this.config.allowedTools = process.env.TRANSITIONAL_ALLOWED_TOOLS.split(",").map((t) => t.trim())
		}

		if (process.env.TRANSITIONAL_BLOCKED_TOOLS) {
			this.config.blockedTools = process.env.TRANSITIONAL_BLOCKED_TOOLS.split(",").map((t) => t.trim())
		}

		// Load feature flags
		if (process.env.ENABLE_LANGGRAPH_TOOLS !== undefined) {
			this.featureFlags.ENABLE_LANGGRAPH_TOOLS = process.env.ENABLE_LANGGRAPH_TOOLS === "true"
		}

		if (process.env.ENABLE_LEGACY_COMPATIBILITY !== undefined) {
			this.featureFlags.ENABLE_LEGACY_COMPATIBILITY = process.env.ENABLE_LEGACY_COMPATIBILITY === "true"
		}
	}

	/**
	 * Save configuration to file
	 */
	private saveConfiguration(): void {
		try {
			// In a real implementation, this would write to the config file
			console.log("Configuration updated:", {
				config: this.config,
				featureFlags: this.featureFlags,
			})
		} catch (error) {
			console.error("Failed to save transitional configuration:", error)
		}
	}

	/**
	 * Get configuration summary
	 */
	public getSummary(): {
		enabled: boolean
		totalTools: number
		allowedTools: number
		blockedTools: number
		featuresEnabled: number
		validation: ReturnType<typeof TransitionalConfigManager.prototype.validateConfiguration>
	} {
		const validation = this.validateConfiguration()
		const featuresEnabled = Object.values(this.featureFlags).filter(Boolean).length

		return {
			enabled: this.config.enabled,
			totalTools: this.config.allowedTools.length || Infinity,
			allowedTools: this.config.allowedTools.length,
			blockedTools: this.config.blockedTools.length,
			featuresEnabled,
			validation,
		}
	}
}

// Global configuration manager instance
export const globalTransitionalConfig = new TransitionalConfigManager()

// Export configuration getters for convenience
export const isTransitionalEnabled = () => globalTransitionalConfig.isEnabled()
export const isFeatureEnabled = (feature: keyof TransitionalFeatureFlags) =>
	globalTransitionalConfig.isFeatureEnabled(feature)
export const isToolAllowed = (toolName: string) => globalTransitionalConfig.isToolAllowed(toolName)
export const getTransitionalConfig = () => globalTransitionalConfig.getConfig()
export const getFeatureFlags = () => globalTransitionalConfig.getFeatureFlags()
