import { z } from "zod"

import { type Keys } from "./type-fu.js"
import {
	type ProviderSettings,
	PROVIDER_SETTINGS_KEYS,
	providerSettingsEntrySchema,
	providerSettingsSchema,
} from "./provider-settings.js"
import { historyItemSchema } from "./history.js"
import { codebaseIndexModelsSchema, codebaseIndexConfigSchema } from "./codebase-index.js"
import { experimentsSchema } from "./experiment.js"
import { telemetrySettingsSchema } from "./telemetry.js"
import { modeConfigSchema } from "./mode.js"
import { customModePromptsSchema, customSupportPromptsSchema } from "./mode.js"
import { languagesSchema } from "./vscode.js"

/**
 * Default retry configuration constants
 */
export const DEFAULT_MAX_RETRY_ATTEMPTS = 3
export const DEFAULT_BASE_DELAY_MS = 1000
export const DEFAULT_MAX_DELAY_MS = 30000
export const DEFAULT_BACKOFF_MULTIPLIER = 2
export const DEFAULT_JITTER_FACTOR = 0.1
export const DEFAULT_RETRY_TIMEOUT_MS = 60000

/**
 * Minimum and maximum bounds for retry settings
 */
export const MIN_MAX_RETRY_ATTEMPTS = 2
export const MAX_MAX_RETRY_ATTEMPTS = 10
export const MIN_BASE_DELAY_MS = 100
export const MAX_BASE_DELAY_MS = 10000
export const MIN_MAX_DELAY_MS = 1000
export const MAX_MAX_DELAY_MS = 300000
export const MIN_BACKOFF_MULTIPLIER = 1.1
export const MAX_BACKOFF_MULTIPLIER = 5
export const MIN_JITTER_FACTOR = 0
export const MAX_JITTER_FACTOR = 0.5
export const MIN_RETRY_TIMEOUT_MS = 5000
export const MAX_RETRY_TIMEOUT_MS = 300000

/**
 * Retry Settings Schema
 *
 * Configuration for tool call retry mechanism with exponential backoff and jitter.
 * All settings are optional to maintain backward compatibility.
 */
export const retrySettingsSchema = z.object({
	/**
	 * Whether the retry mechanism is enabled
	 * @default false
	 */
	enableRetry: z.boolean().optional(),

	/**
	 * Maximum number of retry attempts for failed tool calls
	 * @min 2
	 * @max 10
	 * @default 3
	 */
	maxRetryAttempts: z.number().int().min(MIN_MAX_RETRY_ATTEMPTS).max(MAX_MAX_RETRY_ATTEMPTS).optional(),

	/**
	 * Base delay in milliseconds before the first retry attempt
	 * @min 100
	 * @max 10000
	 * @default 1000
	 */
	baseDelayMs: z.number().int().min(MIN_BASE_DELAY_MS).max(MAX_BASE_DELAY_MS).optional(),

	/**
	 * Maximum delay in milliseconds between retry attempts
	 * @min 1000
	 * @max 300000
	 * @default 30000
	 */
	maxDelayMs: z.number().int().min(MIN_MAX_DELAY_MS).max(MAX_MAX_DELAY_MS).optional(),

	/**
	 * Multiplier for exponential backoff calculation
	 * @min 1.1
	 * @max 5
	 * @default 2
	 */
	backoffMultiplier: z.number().min(MIN_BACKOFF_MULTIPLIER).max(MAX_BACKOFF_MULTIPLIER).optional(),

	/**
	 * Jitter factor to add randomness to retry delays (0-0.5)
	 * Helps prevent thundering herd problems
	 * @min 0
	 * @max 0.5
	 * @default 0.1
	 */
	jitterFactor: z.number().min(MIN_JITTER_FACTOR).max(MAX_JITTER_FACTOR).optional(),

	/**
	 * Whether to enable context optimization during retries
	 * Reduces context window size for retry attempts to improve success rate
	 * @default true
	 */
	enableContextOptimization: z.boolean().optional(),

	/**
	 * Whether to enable manual retry prompts for users
	 * Allows users to manually trigger retries for failed tool calls
	 * @default true
	 */
	enableManualRetry: z.boolean().optional(),

	/**
	 * Timeout in milliseconds for individual retry attempts
	 * @min 5000
	 * @max 300000
	 * @default 60000
	 */
	retryTimeoutMs: z.number().int().min(MIN_RETRY_TIMEOUT_MS).max(MAX_RETRY_TIMEOUT_MS).optional(),
})

/**
 * Type definition for retry settings
 */
export type RetrySettings = z.infer<typeof retrySettingsSchema>

/**
 * Default retry settings configuration
 */
export const DEFAULT_RETRY_SETTINGS: RetrySettings = {
	enableRetry: false,
	maxRetryAttempts: DEFAULT_MAX_RETRY_ATTEMPTS,
	baseDelayMs: DEFAULT_BASE_DELAY_MS,
	maxDelayMs: DEFAULT_MAX_DELAY_MS,
	backoffMultiplier: DEFAULT_BACKOFF_MULTIPLIER,
	jitterFactor: DEFAULT_JITTER_FACTOR,
	enableContextOptimization: true,
	enableManualRetry: true,
	retryTimeoutMs: DEFAULT_RETRY_TIMEOUT_MS,
}

/**
 * Default delay in milliseconds after writes to allow diagnostics to detect potential problems.
 * This delay is particularly important for Go and other languages where tools like goimports
 * need time to automatically clean up unused imports.
 */
export const DEFAULT_WRITE_DELAY_MS = 1000

/**
 * Default terminal output character limit constant.
 * This provides a reasonable default that aligns with typical terminal usage
 * while preventing context window explosions from extremely long lines.
 */
export const DEFAULT_TERMINAL_OUTPUT_CHARACTER_LIMIT = 50_000

/**
 * Minimum checkpoint timeout in seconds.
 */
export const MIN_CHECKPOINT_TIMEOUT_SECONDS = 10

/**
 * Maximum checkpoint timeout in seconds.
 */
export const MAX_CHECKPOINT_TIMEOUT_SECONDS = 60

/**
 * Default checkpoint timeout in seconds.
 */
export const DEFAULT_CHECKPOINT_TIMEOUT_SECONDS = 15

/**
 * GlobalSettings
 */

export const globalSettingsSchema = z.object({
	currentApiConfigName: z.string().optional(),
	listApiConfigMeta: z.array(providerSettingsEntrySchema).optional(),
	pinnedApiConfigs: z.record(z.string(), z.boolean()).optional(),

	lastShownAnnouncementId: z.string().optional(),
	customInstructions: z.string().optional(),
	taskHistory: z.array(historyItemSchema).optional(),
	dismissedUpsells: z.array(z.string()).optional(),

	// Image generation settings (experimental) - flattened for simplicity
	openRouterImageApiKey: z.string().optional(),
	openRouterImageGenerationSelectedModel: z.string().optional(),

	condensingApiConfigId: z.string().optional(),
	customCondensingPrompt: z.string().optional(),

	autoApprovalEnabled: z.boolean().optional(),
	alwaysAllowReadOnly: z.boolean().optional(),
	alwaysAllowReadOnlyOutsideWorkspace: z.boolean().optional(),
	alwaysAllowWrite: z.boolean().optional(),
	alwaysAllowWriteOutsideWorkspace: z.boolean().optional(),
	alwaysAllowWriteProtected: z.boolean().optional(),
	writeDelayMs: z.number().min(0).optional(),
	alwaysAllowBrowser: z.boolean().optional(),
	alwaysApproveResubmit: z.boolean().optional(),
	requestDelaySeconds: z.number().optional(),
	alwaysAllowMcp: z.boolean().optional(),
	alwaysAllowModeSwitch: z.boolean().optional(),
	alwaysAllowSubtasks: z.boolean().optional(),
	alwaysAllowExecute: z.boolean().optional(),
	alwaysAllowFollowupQuestions: z.boolean().optional(),
	followupAutoApproveTimeoutMs: z.number().optional(),
	alwaysAllowUpdateTodoList: z.boolean().optional(),
	allowedCommands: z.array(z.string()).optional(),
	deniedCommands: z.array(z.string()).optional(),
	commandExecutionTimeout: z.number().optional(),
	commandTimeoutAllowlist: z.array(z.string()).optional(),
	preventCompletionWithOpenTodos: z.boolean().optional(),
	allowedMaxRequests: z.number().nullish(),
	allowedMaxCost: z.number().nullish(),
	autoCondenseContext: z.boolean().optional(),
	autoCondenseContextPercent: z.number().optional(),
	maxConcurrentFileReads: z.number().optional(),
	enableManualReview: z.boolean().optional(),

	/**
	 * Whether to include current time in the environment details
	 * @default true
	 */
	includeCurrentTime: z.boolean().optional(),
	/**
	 * Whether to include current cost in the environment details
	 * @default true
	 */
	includeCurrentCost: z.boolean().optional(),

	/**
	 * Whether to include diagnostic messages (errors, warnings) in tool outputs
	 * @default true
	 */
	includeDiagnosticMessages: z.boolean().optional(),
	/**
	 * Maximum number of diagnostic messages to include in tool outputs
	 * @default 50
	 */
	maxDiagnosticMessages: z.number().optional(),

	browserToolEnabled: z.boolean().optional(),
	browserViewportSize: z.string().optional(),
	screenshotQuality: z.number().optional(),
	remoteBrowserEnabled: z.boolean().optional(),
	remoteBrowserHost: z.string().optional(),
	cachedChromeHostUrl: z.string().optional(),

	enableCheckpoints: z.boolean().optional(),
	checkpointTimeout: z
		.number()
		.int()
		.min(MIN_CHECKPOINT_TIMEOUT_SECONDS)
		.max(MAX_CHECKPOINT_TIMEOUT_SECONDS)
		.optional(),

	ttsEnabled: z.boolean().optional(),
	ttsSpeed: z.number().optional(),
	soundEnabled: z.boolean().optional(),
	soundVolume: z.number().optional(),

	maxOpenTabsContext: z.number().optional(),
	maxWorkspaceFiles: z.number().optional(),
	showRooIgnoredFiles: z.boolean().optional(),
	maxReadFileLine: z.number().optional(),
	maxImageFileSize: z.number().optional(),
	maxTotalImageSize: z.number().optional(),

	terminalOutputLineLimit: z.number().optional(),
	terminalOutputCharacterLimit: z.number().optional(),
	terminalShellIntegrationTimeout: z.number().optional(),
	terminalShellIntegrationDisabled: z.boolean().optional(),
	terminalCommandDelay: z.number().optional(),
	terminalPowershellCounter: z.boolean().optional(),
	terminalZshClearEolMark: z.boolean().optional(),
	terminalZshOhMy: z.boolean().optional(),
	terminalZshP10k: z.boolean().optional(),
	terminalZdotdir: z.boolean().optional(),
	terminalCompressProgressBar: z.boolean().optional(),

	diagnosticsEnabled: z.boolean().optional(),

	rateLimitSeconds: z.number().optional(),
	diffEnabled: z.boolean().optional(),
	fuzzyMatchThreshold: z.number().optional(),
	experiments: experimentsSchema.optional(),

	codebaseIndexModels: codebaseIndexModelsSchema.optional(),
	codebaseIndexConfig: codebaseIndexConfigSchema.optional(),

	language: languagesSchema.optional(),

	telemetrySetting: telemetrySettingsSchema.optional(),

	mcpEnabled: z.boolean().optional(),
	enableMcpServerCreation: z.boolean().optional(),

	mode: z.string().optional(),
	modeApiConfigs: z.record(z.string(), z.string()).optional(),
	customModes: z.array(modeConfigSchema).optional(),
	customModePrompts: customModePromptsSchema.optional(),
	customSupportPrompts: customSupportPromptsSchema.optional(),
	enhancementApiConfigId: z.string().optional(),
	includeTaskHistoryInEnhance: z.boolean().optional(),
	historyPreviewCollapsed: z.boolean().optional(),
	reasoningBlockCollapsed: z.boolean().optional(),
	profileThresholds: z.record(z.string(), z.number()).optional(),
	hasOpenedModeSelector: z.boolean().optional(),
	lastModeExportPath: z.string().optional(),
	lastModeImportPath: z.string().optional(),

	/**
	 * Tool call retry mechanism settings
	 * Provides configurable retry behavior for failed tool calls with exponential backoff
	 */
	retrySettings: retrySettingsSchema.optional(),
})

export type GlobalSettings = z.infer<typeof globalSettingsSchema>

export const GLOBAL_SETTINGS_KEYS = globalSettingsSchema.keyof().options

/**
 * RooCodeSettings
 */

export const rooCodeSettingsSchema = providerSettingsSchema.merge(globalSettingsSchema)

export type RooCodeSettings = GlobalSettings & ProviderSettings

/**
 * SecretState
 */
export const SECRET_STATE_KEYS = [
	"apiKey",
	"glamaApiKey",
	"openRouterApiKey",
	"awsAccessKey",
	"awsApiKey",
	"awsSecretKey",
	"awsSessionToken",
	"openAiApiKey",
	"ollamaApiKey",
	"geminiApiKey",
	"openAiNativeApiKey",
	"cerebrasApiKey",
	"deepSeekApiKey",
	"doubaoApiKey",
	"moonshotApiKey",
	"mistralApiKey",
	"minimaxApiKey",
	"unboundApiKey",
	"requestyApiKey",
	"xaiApiKey",
	"groqApiKey",
	"chutesApiKey",
	"litellmApiKey",
	"deepInfraApiKey",
	"codeIndexOpenAiKey",
	"codeIndexQdrantApiKey",
	"codebaseIndexOpenAiCompatibleApiKey",
	"codebaseIndexGeminiApiKey",
	"codebaseIndexMistralApiKey",
	"codebaseIndexVercelAiGatewayApiKey",
	"codebaseIndexOpenRouterApiKey",
	"huggingFaceApiKey",
	"sambaNovaApiKey",
	"zaiApiKey",
	"fireworksApiKey",
	"featherlessApiKey",
	"ioIntelligenceApiKey",
	"vercelAiGatewayApiKey",
] as const

// Global secrets that are part of GlobalSettings (not ProviderSettings)
export const GLOBAL_SECRET_KEYS = [
	"openRouterImageApiKey", // For image generation
] as const

// Type for the actual secret storage keys
type ProviderSecretKey = (typeof SECRET_STATE_KEYS)[number]
type GlobalSecretKey = (typeof GLOBAL_SECRET_KEYS)[number]

// Type representing all secrets that can be stored
export type SecretState = Pick<ProviderSettings, Extract<ProviderSecretKey, keyof ProviderSettings>> & {
	[K in GlobalSecretKey]?: string
}

export const isSecretStateKey = (key: string): key is Keys<SecretState> =>
	SECRET_STATE_KEYS.includes(key as ProviderSecretKey) || GLOBAL_SECRET_KEYS.includes(key as GlobalSecretKey)

/**
 * GlobalState
 */

export type GlobalState = Omit<RooCodeSettings, Keys<SecretState>>

export const GLOBAL_STATE_KEYS = [...GLOBAL_SETTINGS_KEYS, ...PROVIDER_SETTINGS_KEYS].filter(
	(key: Keys<RooCodeSettings>) => !isSecretStateKey(key),
) as Keys<GlobalState>[]

export const isGlobalStateKey = (key: string): key is Keys<GlobalState> =>
	GLOBAL_STATE_KEYS.includes(key as Keys<GlobalState>)

/**
 * Evals
 */

// Default settings when running evals (unless overridden).
export const EVALS_SETTINGS: RooCodeSettings = {
	apiProvider: "openrouter",
	openRouterUseMiddleOutTransform: false,

	lastShownAnnouncementId: "jul-09-2025-3-23-0",

	pinnedApiConfigs: {},

	autoApprovalEnabled: true,
	alwaysAllowReadOnly: true,
	alwaysAllowReadOnlyOutsideWorkspace: false,
	alwaysAllowWrite: true,
	alwaysAllowWriteOutsideWorkspace: false,
	alwaysAllowWriteProtected: false,
	writeDelayMs: 1000,
	alwaysAllowBrowser: true,
	alwaysApproveResubmit: true,
	requestDelaySeconds: 10,
	alwaysAllowMcp: true,
	alwaysAllowModeSwitch: true,
	alwaysAllowSubtasks: true,
	alwaysAllowExecute: true,
	alwaysAllowFollowupQuestions: true,
	alwaysAllowUpdateTodoList: true,
	followupAutoApproveTimeoutMs: 0,
	allowedCommands: ["*"],
	commandExecutionTimeout: 20,
	commandTimeoutAllowlist: [],
	preventCompletionWithOpenTodos: false,

	browserToolEnabled: false,
	browserViewportSize: "900x600",
	screenshotQuality: 75,
	remoteBrowserEnabled: false,

	ttsEnabled: false,
	ttsSpeed: 1,
	soundEnabled: false,
	soundVolume: 0.5,

	terminalOutputLineLimit: 500,
	terminalOutputCharacterLimit: DEFAULT_TERMINAL_OUTPUT_CHARACTER_LIMIT,
	terminalShellIntegrationTimeout: 30000,
	terminalCommandDelay: 0,
	terminalPowershellCounter: false,
	terminalZshOhMy: true,
	terminalZshClearEolMark: true,
	terminalZshP10k: false,
	terminalZdotdir: true,
	terminalCompressProgressBar: true,
	terminalShellIntegrationDisabled: true,

	diagnosticsEnabled: true,

	diffEnabled: true,
	fuzzyMatchThreshold: 1,

	enableCheckpoints: false,

	rateLimitSeconds: 0,
	maxOpenTabsContext: 20,
	maxWorkspaceFiles: 200,
	showRooIgnoredFiles: true,
	maxReadFileLine: -1, // -1 to enable full file reading.

	includeDiagnosticMessages: true,
	maxDiagnosticMessages: 50,

	language: "en",
	telemetrySetting: "enabled",

	mcpEnabled: false,

	mode: "code", // "architect",

	customModes: [],
	enableManualReview: false,

	// Retry settings defaults
	retrySettings: DEFAULT_RETRY_SETTINGS,
}

export const EVALS_TIMEOUT = 5 * 60 * 1_000
