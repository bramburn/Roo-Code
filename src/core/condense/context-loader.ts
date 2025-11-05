import { EventEmitter } from "events"
import { ApiHandler } from "../../api"
import { ApiMessage } from "../task-persistence/apiMessages"
import { ContextFileParser, type ParsedContextFile, type ContextFileValidationResult } from "./context-file-parser"
import type { ContextFileMetadata } from "./context-file-manager"
import { ANTHROPIC_DEFAULT_MAX_TOKENS } from "@roo-code/types"

/**
 * Token comparison result
 */
export interface TokenComparison {
	originalTokens: number
	editedTokens: number
	tokenDifference: number
	percentageChange: number
	isWithinLimit: boolean
}

/**
 * Context loading result
 */
export interface ContextLoadingResult {
	success: boolean
	messages: ApiMessage[]
	tokenComparison: TokenComparison
	error?: string
	warnings?: string[]
	requiresUserAction?: boolean
	userActionMessage?: string
}

/**
 * Context loading options
 */
export interface ContextLoadingOptions {
	maxTokens?: number
	contextWindow?: number
	allowExceedLimit?: boolean
	systemPrompt?: string
}

/**
 * Context loader for loading, validating, and integrating edited context files
 * Handles token counting, validation, and conversation state management
 */
export class ContextLoader extends EventEmitter {
	private readonly apiHandler: ApiHandler
	private readonly contextFileParser: ContextFileParser

	constructor(apiHandler: ApiHandler) {
		super()
		this.apiHandler = apiHandler
		this.contextFileParser = new ContextFileParser()
	}

	/**
	 * Load and process an edited context file
	 */
	async loadContextFile(
		filepath: string,
		originalMetadata: ContextFileMetadata,
		options: ContextLoadingOptions = {},
	): Promise<ContextLoadingResult> {
		try {
			this.emit("loadingStarted", { filepath })

			// Parse the context file
			const parsedFile = await this.contextFileParser.parseContextFile(filepath)

			// Validate the parsed file
			const validation = this.contextFileParser.validateContextFile(parsedFile)
			if (!validation.isValid) {
				return {
					success: false,
					messages: [],
					tokenComparison: this.createEmptyTokenComparison(),
					error: `Context file validation failed: ${validation.errors.join(", ")}`,
				}
			}

			// Count tokens in edited content
			const editedTokens = await this.countTokensForMessages(parsedFile.messages)

			// Create token comparison
			const tokenComparison = this.createTokenComparison(
				originalMetadata.contextSize,
				editedTokens,
				options.contextWindow || ANTHROPIC_DEFAULT_MAX_TOKENS,
			)

			// Validate against context window limits
			const limitValidation = this.validateContextLimits(tokenComparison, options)

			if (!limitValidation.isValid) {
				if (options.allowExceedLimit) {
					// Allow exceeding but warn user
					return {
						success: true,
						messages: parsedFile.messages,
						tokenComparison,
						warnings: [
							`Context exceeds token limit by ${tokenComparison.editedTokens - (options.maxTokens || ANTHROPIC_DEFAULT_MAX_TOKENS)} tokens`,
							...limitValidation.warnings,
						],
						requiresUserAction: false,
					}
				} else {
					// Block loading and require user action
					return {
						success: false,
						messages: [],
						tokenComparison,
						error: limitValidation.errorMessage,
						requiresUserAction: true,
						userActionMessage: limitValidation.userActionMessage,
					}
				}
			}

			// Success case
			return {
				success: true,
				messages: parsedFile.messages,
				tokenComparison,
				warnings: [...validation.warnings, ...limitValidation.warnings],
			}
		} catch (error) {
			this.emit("loadingError", { filepath, error })
			return {
				success: false,
				messages: [],
				tokenComparison: this.createEmptyTokenComparison(),
				error: `Failed to load context file: ${error}`,
			}
		}
	}

	/**
	 * Count tokens for a list of messages
	 */
	private async countTokensForMessages(messages: ApiMessage[]): Promise<number> {
		let totalTokens = 0

		for (const message of messages) {
			const contentBlocks =
				typeof message.content === "string"
					? [{ type: "text" as const, text: message.content }]
					: Array.isArray(message.content)
						? message.content
						: [{ type: "text" as const, text: String(message.content) }]

			const messageTokens = await this.apiHandler.countTokens(contentBlocks)
			totalTokens += messageTokens
		}

		return totalTokens
	}

	/**
	 * Create token comparison between original and edited context
	 */
	private createTokenComparison(
		originalTokens: number,
		editedTokens: number,
		contextWindow: number,
	): TokenComparison {
		const tokenDifference = editedTokens - originalTokens
		const percentageChange = originalTokens > 0 ? (tokenDifference / originalTokens) * 100 : 0

		return {
			originalTokens,
			editedTokens,
			tokenDifference,
			percentageChange,
			isWithinLimit: editedTokens <= contextWindow,
		}
	}

	/**
	 * Validate context against limits and provide user guidance
	 */
	private validateContextLimits(
		tokenComparison: TokenComparison,
		options: ContextLoadingOptions,
	): { isValid: boolean; errorMessage?: string; userActionMessage?: string; warnings: string[] } {
		const warnings: string[] = []
		const maxTokens = options.maxTokens || ANTHROPIC_DEFAULT_MAX_TOKENS
		const contextWindow = options.contextWindow || ANTHROPIC_DEFAULT_MAX_TOKENS

		// Check if context exceeds maximum allowed tokens
		if (tokenComparison.editedTokens > maxTokens) {
			const excess = tokenComparison.editedTokens - maxTokens
			const reductionNeeded = (excess / tokenComparison.editedTokens) * 100

			return {
				isValid: false,
				errorMessage: `Context exceeds maximum token limit by ${excess} tokens (${Math.round(reductionNeeded)}% reduction needed)`,
				userActionMessage: `Please reduce the context size by at least ${excess} tokens (approximately ${Math.round(reductionNeeded)}% of current content) or use intelligent compression instead.`,
				warnings,
			}
		}

		// Check if context approaches context window
		if (tokenComparison.editedTokens > contextWindow * 0.9) {
			warnings.push("Context is approaching the context window limit (90% full)")
		}

		// Check for significant token increase
		if (tokenComparison.percentageChange > 50) {
			warnings.push(
				`Context size increased by ${Math.round(tokenComparison.percentageChange)}% compared to original`,
			)
		}

		// Check for very large context
		if (tokenComparison.editedTokens > 100000) {
			warnings.push("Very large context may impact performance")
		}

		return {
			isValid: true,
			warnings,
		}
	}

	/**
	 * Create empty token comparison for error cases
	 */
	private createEmptyTokenComparison(): TokenComparison {
		return {
			originalTokens: 0,
			editedTokens: 0,
			tokenDifference: 0,
			percentageChange: 0,
			isWithinLimit: false,
		}
	}

	/**
	 * Get token count for content blocks
	 */
	async countTokens(content: any[]): Promise<number> {
		return this.apiHandler.countTokens(content)
	}

	/**
	 * Estimate tokens for text content
	 */
	async estimateTextTokens(text: string): Promise<number> {
		return this.apiHandler.countTokens([{ type: "text", text }])
	}

	/**
	 * Get context window limits for current model
	 */
	getContextWindowLimits(): { maxTokens: number; contextWindow: number } {
		const model = this.apiHandler.getModel()
		const modelInfo = model.info

		return {
			maxTokens: modelInfo.maxTokens || ANTHROPIC_DEFAULT_MAX_TOKENS,
			contextWindow: modelInfo.contextWindow || ANTHROPIC_DEFAULT_MAX_TOKENS,
		}
	}

	/**
	 * Provide recovery options when context loading fails
	 */
	getRecoveryOptions(error: string): Array<{ label: string; action: string; description: string }> {
		const options = [
			{
				label: "Edit Context File",
				action: "edit",
				description: "Open the context file to make further edits and reduce size",
			},
			{
				label: "Use Intelligent Compression",
				action: "compress",
				description: "Let the system automatically compress the context using AI",
			},
			{
				label: "Retry Loading",
				action: "retry",
				description: "Try loading the context file again",
			},
		]

		// Add specific options based on error type
		if (error.includes("validation failed")) {
			options.unshift({
				label: "Fix Validation Errors",
				action: "fix-validation",
				description: "Address the specific validation errors in the context file",
			})
		}

		if (error.includes("token limit")) {
			options.unshift({
				label: "Reduce Context Size",
				action: "reduce",
				description: "Remove some content to fit within token limits",
			})
		}

		return options
	}

	/**
	 * Format token count for display
	 */
	formatTokenCount(tokens: number): string {
		if (tokens >= 1000000) {
			return `${(tokens / 1000000).toFixed(1)}M tokens`
		} else if (tokens >= 1000) {
			return `${(tokens / 1000).toFixed(1)}K tokens`
		} else {
			return `${tokens} tokens`
		}
	}

	/**
	 * Get token usage summary
	 */
	getTokenUsageSummary(tokenComparison: TokenComparison): string {
		const { originalTokens, editedTokens, tokenDifference, percentageChange, isWithinLimit } = tokenComparison

		let summary = `Original: ${this.formatTokenCount(originalTokens)} → Edited: ${this.formatTokenCount(editedTokens)}`

		if (tokenDifference !== 0) {
			const change = tokenDifference > 0 ? "+" : ""
			summary += ` (${change}${this.formatTokenCount(Math.abs(tokenDifference))}, ${Math.round(percentageChange)}%)`
		}

		if (!isWithinLimit) {
			summary += " ⚠️ Exceeds limit"
		}

		return summary
	}
}
