import type { CleanupConfig } from "./async-cleanup-utils"

/**
 * Environment-specific cleanup configurations
 */
export const CLEANUP_CONFIGS = {
	/** Default configuration for most tests */
	default: {
		defaultTimeout: 5000,
		cleanupTimeout: 2000,
		cleanupCheckInterval: 50,
		debugCleanup: false,
		maxRetries: 3,
	} as CleanupConfig,

	/** Fast configuration for quick unit tests */
	fast: {
		defaultTimeout: 1000,
		cleanupTimeout: 500,
		cleanupCheckInterval: 25,
		debugCleanup: false,
		maxRetries: 1,
	} as CleanupConfig,

	/** Slow configuration for integration tests */
	slow: {
		defaultTimeout: 10000,
		cleanupTimeout: 5000,
		cleanupCheckInterval: 100,
		debugCleanup: false,
		maxRetries: 5,
	} as CleanupConfig,

	/** Debug configuration with extensive logging */
	debug: {
		defaultTimeout: 5000,
		cleanupTimeout: 3000,
		cleanupCheckInterval: 50,
		debugCleanup: true,
		maxRetries: 3,
	} as CleanupConfig,
}

/**
 * Performance monitoring configuration
 */
export interface PerformanceConfig {
	/** Enable performance monitoring */
	enabled: boolean
	/** Threshold for warning about slow cleanup (ms) */
	slowCleanupThreshold: number
	/** Maximum cleanup time before forcing completion (ms) */
	maxCleanupTime: number
	/** Track memory usage during cleanup */
	trackMemoryUsage: boolean
	/** Log detailed performance metrics */
	logDetailedMetrics: boolean
}

/**
 * Default performance configuration
 */
export const DEFAULT_PERFORMANCE_CONFIG: PerformanceConfig = {
	enabled: true,
	slowCleanupThreshold: 1000,
	maxCleanupTime: 5000,
	trackMemoryUsage: false,
	logDetailedMetrics: false,
}

/**
 * Cleanup operation categories for fine-tuned control
 */
export type CleanupCategory = "timeouts" | "intervals" | "promises" | "react" | "vscode" | "dom" | "events" | "all"

/**
 * Category-specific cleanup configurations
 */
export interface CategoryCleanupConfig {
	/** Whether to cleanup this category */
	enabled: boolean
	/** Priority level (lower numbers = higher priority) */
	priority: number
	/** Maximum time to wait for this category (ms) */
	timeout: number
	/** Whether to force cleanup if timeout is exceeded */
	forceOnTimeout: boolean
}

/**
 * Default category configurations
 */
export const DEFAULT_CATEGORY_CONFIGS: Record<CleanupCategory, CategoryCleanupConfig> = {
	timeouts: {
		enabled: true,
		priority: 1,
		timeout: 1000,
		forceOnTimeout: true,
	},
	intervals: {
		enabled: true,
		priority: 1,
		timeout: 1000,
		forceOnTimeout: true,
	},
	promises: {
		enabled: true,
		priority: 2,
		timeout: 2000,
		forceOnTimeout: false,
	},
	react: {
		enabled: true,
		priority: 3,
		timeout: 3000,
		forceOnTimeout: false,
	},
	vscode: {
		enabled: true,
		priority: 1,
		timeout: 1000,
		forceOnTimeout: true,
	},
	dom: {
		enabled: true,
		priority: 4,
		timeout: 500,
		forceOnTimeout: true,
	},
	events: {
		enabled: true,
		priority: 2,
		timeout: 1000,
		forceOnTimeout: true,
	},
	all: {
		enabled: true,
		priority: 0,
		timeout: 5000,
		forceOnTimeout: true,
	},
}

/**
 * Complete cleanup configuration with all options
 */
export interface CompleteCleanupConfig extends CleanupConfig {
	/** Performance monitoring configuration */
	performance: PerformanceConfig
	/** Category-specific configurations */
	categories: Record<CleanupCategory, CategoryCleanupConfig>
	/** Environment override */
	environment?: "test" | "development" | "production"
	/** Custom cleanup hooks */
	hooks: {
		/** Called before cleanup starts */
		beforeCleanup?: () => Promise<void> | void
		/** Called after cleanup completes */
		afterCleanup?: () => Promise<void> | void
		/** Called when cleanup times out */
		onTimeout?: (category: CleanupCategory, duration: number) => void
		/** Called when cleanup fails */
		onError?: (error: Error, category: CleanupCategory) => void
	}
}

/**
 * Get configuration for a specific environment
 */
export function getCleanupConfig(
	environment: keyof typeof CLEANUP_CONFIGS = "default",
	overrides: Partial<CompleteCleanupConfig> = {},
): CompleteCleanupConfig {
	const baseConfig = CLEANUP_CONFIGS[environment]

	return {
		...baseConfig,
		performance: { ...DEFAULT_PERFORMANCE_CONFIG },
		categories: { ...DEFAULT_CATEGORY_CONFIGS },
		environment,
		hooks: {},
		...overrides,
	}
}

/**
 * Cleanup configuration presets for common test scenarios
 */
export const CLEANUP_PRESETS = {
	/** Unit tests with minimal async operations */
	unit: getCleanupConfig("fast", {
		performance: {
			enabled: false,
			slowCleanupThreshold: 500,
			maxCleanupTime: 1000,
			trackMemoryUsage: false,
			logDetailedMetrics: false,
		},
		categories: {
			...DEFAULT_CATEGORY_CONFIGS,
			react: {
				...DEFAULT_CATEGORY_CONFIGS.react,
				timeout: 1000,
			},
		},
	}),

	/** Integration tests with VS Code communication */
	integration: getCleanupConfig("slow", {
		performance: {
			enabled: true,
			slowCleanupThreshold: 2000,
			maxCleanupTime: 10000,
			trackMemoryUsage: true,
			logDetailedMetrics: true,
		},
		categories: {
			...DEFAULT_CATEGORY_CONFIGS,
			vscode: {
				...DEFAULT_CATEGORY_CONFIGS.vscode,
				timeout: 2000,
			},
			react: {
				...DEFAULT_CATEGORY_CONFIGS.react,
				timeout: 5000,
			},
		},
	}),

	/** Component tests with React features */
	component: getCleanupConfig("default", {
		performance: {
			enabled: true,
			slowCleanupThreshold: 1500,
			maxCleanupTime: 3000,
			trackMemoryUsage: false,
			logDetailedMetrics: false,
		},
		categories: {
			...DEFAULT_CATEGORY_CONFIGS,
			react: {
				...DEFAULT_CATEGORY_CONFIGS.react,
				timeout: 3000,
				priority: 1, // Higher priority for component tests
			},
		},
	}),

	/** Debug configuration for troubleshooting */
	debug: getCleanupConfig("debug", {
		performance: {
			enabled: true,
			slowCleanupThreshold: 500,
			maxCleanupTime: 10000,
			trackMemoryUsage: true,
			logDetailedMetrics: true,
		},
		hooks: {
			beforeCleanup: () => console.log("🧹 Starting cleanup..."),
			afterCleanup: () => console.log("✅ Cleanup completed"),
			onTimeout: (category, duration) => console.warn(`⏰ Cleanup timeout for ${category} after ${duration}ms`),
			onError: (error, category) => console.error(`❌ Cleanup error in ${category}:`, error),
		},
	}),
}

/**
 * Utility to detect the appropriate configuration based on test context
 */
export function detectCleanupConfig(): CompleteCleanupConfig {
	// Check environment variables
	const env = process?.env?.NODE_ENV || process?.env?.TEST_ENV

	// Check for debug mode
	if (process?.env?.DEBUG_CLEANUP === "true") {
		return CLEANUP_PRESETS.debug
	}

	// Check test type from file name or other context
	if (typeof window !== "undefined" && (window as any).__TEST_TYPE__) {
		const testType = (window as any).__TEST_TYPE__
		switch (testType) {
			case "unit":
				return CLEANUP_PRESETS.unit
			case "integration":
				return CLEANUP_PRESETS.integration
			case "component":
				return CLEANUP_PRESETS.component
		}
	}

	// Default based on environment
	switch (env) {
		case "test":
			return CLEANUP_PRESETS.unit
		case "development":
			return CLEANUP_PRESETS.debug
		default:
			return CLEANUP_PRESETS.component
	}
}

/**
 * Configuration validation utilities
 */
export function validateCleanupConfig(config: CompleteCleanupConfig): {
	valid: boolean
	errors: string[]
} {
	const errors: string[] = []

	// Validate timeouts
	if (config.defaultTimeout <= 0) {
		errors.push("defaultTimeout must be positive")
	}

	if (config.cleanupTimeout <= 0) {
		errors.push("cleanupTimeout must be positive")
	}

	if (config.cleanupCheckInterval <= 0) {
		errors.push("cleanupCheckInterval must be positive")
	}

	// Validate performance config
	if (config.performance.slowCleanupThreshold <= 0) {
		errors.push("slowCleanupThreshold must be positive")
	}

	if (config.performance.maxCleanupTime <= 0) {
		errors.push("maxCleanupTime must be positive")
	}

	// Validate category configs
	for (const [category, catConfig] of Object.entries(config.categories)) {
		if (catConfig.timeout <= 0) {
			errors.push(`${category} timeout must be positive`)
		}

		if (catConfig.priority < 0) {
			errors.push(`${category} priority must be non-negative`)
		}
	}

	return {
		valid: errors.length === 0,
		errors,
	}
}

/**
 * Utility to merge configurations with proper validation
 */
export function mergeCleanupConfig(
	base: CompleteCleanupConfig,
	overrides: Partial<CompleteCleanupConfig>,
): CompleteCleanupConfig {
	const merged = {
		...base,
		...overrides,
		performance: {
			...base.performance,
			...overrides.performance,
		},
		categories: {
			...base.categories,
			...overrides.categories,
		},
		hooks: {
			...base.hooks,
			...overrides.hooks,
		},
	}

	const validation = validateCleanupConfig(merged)
	if (!validation.valid) {
		throw new Error(`Invalid cleanup configuration: ${validation.errors.join(", ")}`)
	}

	return merged
}
