import { truncateConversationIfNeeded, type TruncateResponse } from "../../sliding-window"

// Define local types since imports are failing
export interface ApiMessage {
	id: string
	role: string
	content: string | Array<{ type: string; text: string }>
	timestamp?: number
}

export interface ClineMessage {
	id: string
	type: string
	text?: string
	content?: any
	ts?: number
	timestamp?: number
	say?: string
	ask?: string
	think?: string
}

/**
 * Context optimization strategies for retry mechanisms
 */
export enum ContextOptimizationStrategy {
	AGGRESSIVE_TRUNCATION = "aggressive_truncation",
	SMART_SUMMARIZATION = "smart_summarization",
	PRESERVE_CRITICAL_CONTEXT = "preserve_critical_context",
}

/**
 * Context preservation priority levels
 */
export enum ContextPreservationPriority {
	CRITICAL = 0, // System prompts, task definitions, essential context
	HIGH = 1, // Recent tool results, important user feedback
	MEDIUM = 2, // General conversation context
	LOW = 3, // Older conversation history
}

/**
 * Context state tracking for optimization operations
 */
export interface ContextState {
	originalApiHistory: ApiMessage[]
	originalClineMessages: ClineMessage[]
	optimizedApiHistory: ApiMessage[]
	optimizedClineMessages: ClineMessage[]
	preservedElements: string[]
	removedElements: string[]
	optimizationStrategy: ContextOptimizationStrategy
	timestamp: number
	retryCount: number
}

/**
 * Context optimization result
 */
export interface ContextOptimizationResult {
	success: boolean
	optimizedApiHistory: ApiMessage[]
	optimizedClineMessages: ClineMessage[]
	preservedElements: string[]
	removedElements: string[]
	strategy: ContextOptimizationStrategy
	contextReduction: number // Percentage of context reduced (0-100)
	error?: string
}

/**
 * ContextOptimizer provides intelligent context management during retry operations.
 * Integrates with the existing truncateConversationIfNeeded function to ensure
 * seamless compatibility with the current context management system.
 */
export class ContextOptimizer {
	private static readonly CRITICAL_CONTEXT_PATTERNS = [
		/system\s*prompt/i,
		/task\s*definition/i,
		/.*task.*>/i,
		/.*user.*instructions.*>/i,
		/.*important.*context/i,
	]

	private static readonly HIGH_PRIORITY_PATTERNS = [
		/tool\s*result/i,
		/user\s*feedback/i,
		/recent\s*tool.*call/i,
		/last\s*\d+\s*messages?/i,
	]

	private static readonly PRESERVE_MESSAGE_COUNT = {
		[ContextPreservationPriority.CRITICAL]: 5,
		[ContextPreservationPriority.HIGH]: 10,
		[ContextPreservationPriority.MEDIUM]: 20,
		[ContextPreservationPriority.LOW]: 50,
	}

	/**
	 * Optimizes conversation context for retry attempts
	 *
	 * @param apiHistory - Current API conversation history
	 * @param clineMessages - Current Cline messages
	 * @param contextTokens - Current context token count
	 * @param maxTokens - Maximum allowed tokens
	 * @param contextWindow - Model context window size
	 * @param retryCount - Current retry attempt number
	 * @param systemPrompt - Current system prompt
	 * @param taskId - Task identifier for logging
	 * @returns Optimization result with updated histories
	 */
	static async optimizeContext(
		apiHistory: ApiMessage[],
		clineMessages: ClineMessage[],
		contextTokens: number,
		maxTokens: number,
		contextWindow: number,
		retryCount: number,
		systemPrompt: string,
		taskId: string,
	): Promise<ContextOptimizationResult> {
		const originalState: ContextState = {
			originalApiHistory: [...apiHistory],
			originalClineMessages: [...clineMessages],
			optimizedApiHistory: [...apiHistory],
			optimizedClineMessages: [...clineMessages],
			preservedElements: [],
			removedElements: [],
			optimizationStrategy: ContextOptimizationStrategy.PRESERVE_CRITICAL_CONTEXT,
			timestamp: Date.now(),
			retryCount,
		}

		try {
			// Determine optimization strategy based on retry count and context pressure
			const strategy = this.determineOptimizationStrategy(contextTokens, maxTokens, contextWindow, retryCount)

			// Analyze and categorize messages by importance
			const analysis = this.analyzeMessageImportance(apiHistory, clineMessages)

			// Apply optimization strategy
			let result: ContextOptimizationResult
			switch (strategy) {
				case ContextOptimizationStrategy.AGGRESSIVE_TRUNCATION:
					result = await this.performAggressiveTruncation(originalState, analysis, contextTokens, maxTokens)
					break

				case ContextOptimizationStrategy.SMART_SUMMARIZATION:
					result = await this.performSmartSummarization(
						originalState,
						analysis,
						contextTokens,
						maxTokens,
						systemPrompt,
						taskId,
					)
					break

				case ContextOptimizationStrategy.PRESERVE_CRITICAL_CONTEXT:
				default:
					result = await this.performCriticalContextPreservation(
						originalState,
						analysis,
						contextTokens,
						maxTokens,
					)
					break
			}

			// Ensure synchronization between API and Cline histories
			result.optimizedApiHistory = this.synchronizeHistories(
				result.optimizedApiHistory,
				result.optimizedClineMessages,
			)

			return result
		} catch (error) {
			console.error(`[ContextOptimizer] Error optimizing context for task ${taskId}:`, error)
			return {
				success: false,
				optimizedApiHistory: apiHistory,
				optimizedClineMessages: clineMessages,
				preservedElements: [],
				removedElements: [],
				strategy: ContextOptimizationStrategy.PRESERVE_CRITICAL_CONTEXT,
				contextReduction: 0,
				error: error.message,
			}
		}
	}

	/**
	 * Determines the best optimization strategy based on current conditions
	 */
	private static determineOptimizationStrategy(
		contextTokens: number,
		maxTokens: number,
		contextWindow: number,
		retryCount: number,
	): ContextOptimizationStrategy {
		// Calculate context pressure (0-1 scale)
		const contextPressure = contextTokens / maxTokens

		// Use more aggressive strategies on higher retry counts
		if (retryCount >= 2) {
			if (contextPressure > 0.9) {
				return ContextOptimizationStrategy.AGGRESSIVE_TRUNCATION
			}
			return ContextOptimizationStrategy.SMART_SUMMARIZATION
		}

		// Use smart summarization for moderate pressure
		if (contextPressure > 0.7) {
			return ContextOptimizationStrategy.SMART_SUMMARIZATION
		}

		// Preserve critical context for low to moderate pressure
		return ContextOptimizationStrategy.PRESERVE_CRITICAL_CONTEXT
	}

	/**
	 * Analyzes messages to determine their importance for preservation
	 */
	private static analyzeMessageImportance(apiHistory: ApiMessage[], clineMessages: ClineMessage[]) {
		const analysis = {
			critical: [] as string[],
			high: [] as string[],
			medium: [] as string[],
			low: [] as string[],
		}

		// Analyze API messages
		for (const message of apiHistory) {
			const importance = this.getMessageImportance(message)
			switch (importance) {
				case ContextPreservationPriority.CRITICAL:
					analysis.critical.push(`API: ${this.getMessageSummary(message)}`)
					break
				case ContextPreservationPriority.HIGH:
					analysis.high.push(`API: ${this.getMessageSummary(message)}`)
					break
				case ContextPreservationPriority.MEDIUM:
					analysis.medium.push(`API: ${this.getMessageSummary(message)}`)
					break
				case ContextPreservationPriority.LOW:
					analysis.low.push(`API: ${this.getMessageSummary(message)}`)
					break
			}
		}

		// Analyze Cline messages
		for (const message of clineMessages) {
			const importance = this.getClineMessageImportance(message)
			switch (importance) {
				case ContextPreservationPriority.CRITICAL:
					analysis.critical.push(`UI: ${this.getClineMessageSummary(message)}`)
					break
				case ContextPreservationPriority.HIGH:
					analysis.high.push(`UI: ${this.getClineMessageSummary(message)}`)
					break
				case ContextPreservationPriority.MEDIUM:
					analysis.medium.push(`UI: ${this.getClineMessageSummary(message)}`)
					break
				case ContextPreservationPriority.LOW:
					analysis.low.push(`UI: ${this.getClineMessageSummary(message)}`)
					break
			}
		}

		return analysis
	}

	/**
	 * Gets the importance level of an API message
	 */
	private static getMessageImportance(message: ApiMessage): ContextPreservationPriority {
		const content = this.getMessageContent(message)
		if (!content) return ContextPreservationPriority.LOW

		// Check for critical context patterns
		for (const pattern of this.CRITICAL_CONTEXT_PATTERNS) {
			if (pattern.test(content)) {
				return ContextPreservationPriority.CRITICAL
			}
		}

		// Check for high priority patterns
		for (const pattern of this.HIGH_PRIORITY_PATTERNS) {
			if (pattern.test(content)) {
				return ContextPreservationPriority.HIGH
			}
		}

		// Check message age (newer = higher priority)
		const messageAge = Date.now() - ((message as any).ts || 0)
		const ageInHours = MessageAge / (1000 * 60 * 60)

		if (ageInHours < 1) {
			return ContextPreservationPriority.HIGH
		} else if (ageInHours < 6) {
			return ContextPreservationPriority.MEDIUM
		}

		return ContextPreservationPriority.LOW
	}

	/**
	 * Gets the importance level of a Cline message
	 */
	private static getClineMessageImportance(message: ClineMessage): ContextPreservationPriority {
		// Skip system messages and partial messages
		if (message.type === "say" && message.say !== "text") {
			return ContextPreservationPriority.LOW
		}

		const content = this.getClineMessageContent(message)
		if (!content) return ContextPreservationPriority.LOW

		// Check for critical context patterns
		for (const pattern of this.CRITICAL_CONTEXT_PATTERNS) {
			if (pattern.test(content)) {
				return ContextPreservationPriority.CRITICAL
			}
		}

		// Check for high priority patterns
		for (const pattern of this.HIGH_PRIORITY_PATTERNS) {
			if (pattern.test(content)) {
				return ContextPreservationPriority.HIGH
			}
		}

		// Check message age
		const messageAge = Date.now() - (message.ts || 0)
		const ageInHours = MessageAge / (1000 * 60 * 60)

		if (ageInHours < 1) {
			return ContextPreservationPriority.HIGH
		} else if (ageInHours < 6) {
			return ContextPreservationPriority.MEDIUM
		}

		return ContextPreservationPriority.LOW
	}

	/**
	 * Performs aggressive truncation strategy
	 */
	private static async performAggressiveTruncation(
		originalState: ContextState,
		analysis: any,
		contextTokens: number,
		maxTokens: number,
	): Promise<ContextOptimizationResult> {
		const targetTokens = Math.floor(maxTokens * 0.6) // Keep 60% of max

		let preservedCount = 0
		const optimizedApiHistory: ApiMessage[] = []
		const optimizedClineMessages: ClineMessage[] = []
		const preservedElements: string[] = []
		const removedElements: string[] = []

		// Preserve critical messages first
		for (const element of analysis.critical) {
			if (preservedCount >= this.PRESERVE_MESSAGE_COUNT[ContextPreservationPriority.CRITICAL]) {
				break
			}
			const message = this.findMessageByContent(originalState.originalApiHistory, element)
			if (message) {
				optimizedApiHistory.push(message)
				preservedElements.push(element)
				preservedCount++
			}
		}

		// Add high priority messages until we reach target
		for (const element of analysis.high) {
			if (this.calculateTotalTokens(optimizedApiHistory) >= targetTokens) {
				break
			}
			const message = this.findMessageByContent(originalState.originalApiHistory, element)
			if (message) {
				optimizedApiHistory.push(message)
				preservedElements.push(element)
				preservedCount++
			}
		}

		// Calculate context reduction
		const contextReduction = Math.round((1 - this.calculateTotalTokens(optimizedApiHistory) / contextTokens) * 100)

		return {
			success: true,
			optimizedApiHistory,
			optimizedClineMessages: this.synchronizeHistories(optimizedApiHistory, optimizedClineMessages),
			preservedElements,
			removedElements: analysis.low.concat(analysis.medium), // All low and medium priority elements are removed
			strategy: ContextOptimizationStrategy.AGGRESSIVE_TRUNCATION,
			contextReduction,
		}
	}

	/**
	 * Performs smart summarization strategy using existing truncateConversationIfNeeded
	 */
	private static async performSmartSummarization(
		originalState: ContextState,
		analysis: any,
		contextTokens: number,
		maxTokens: number,
		systemPrompt: string,
		taskId: string,
	): Promise<ContextOptimizationResult> {
		try {
			// Use the existing truncateConversationIfNeeded function
			const truncateResult = await truncateConversationIfNeeded({
				messages: originalState.originalApiHistory,
				totalTokens: contextTokens,
				maxTokens,
				contextWindow: contextWindow,
				apiHandler: undefined, // Will be provided by the calling context
				autoCondenseContext: true,
				autoCondenseContextPercent: 75, // Reduce by 25%
				systemPrompt,
				taskId,
			})

			if (truncateResult.error) {
				return {
					success: false,
					optimizedApiHistory: originalState.originalApiHistory,
					optimizedClineMessages: originalState.originalClineMessages,
					preservedElements: [],
					removedElements: [],
					strategy: ContextOptimizationStrategy.SMART_SUMMARIZATION,
					contextReduction: 0,
					error: truncateResult.error,
				}
			}

			const optimizedApiHistory = truncateResult.messages || originalState.originalApiHistory
			const preservedElements = this.extractPreservedElements(originalState, truncateResult)
			const removedElements = this.extractRemovedElements(originalState, truncateResult)

			const contextReduction = Math.round(
				(1 - this.calculateTotalTokens(optimizedApiHistory) / contextTokens) * 100,
			)

			return {
				success: true,
				optimizedApiHistory,
				optimizedClineMessages: this.synchronizeHistories(
					optimizedApiHistory,
					originalState.originalClineMessages,
				),
				preservedElements,
				removedElements,
				strategy: ContextOptimizationStrategy.SMART_SUMMARIZATION,
				contextReduction,
			}
		} catch (error) {
			console.error(`[ContextOptimizer] Smart summarization failed for task ${taskId}:`, error)
			return {
				success: false,
				optimizedApiHistory: originalState.originalApiHistory,
				optimizedClineMessages: originalState.originalClineMessages,
				preservedElements: [],
				removedElements: [],
				strategy: ContextOptimizationStrategy.SMART_SUMMARIZATION,
				contextReduction: 0,
				error: error.message,
			}
		}
	}

	/**
	 * Performs critical context preservation strategy
	 */
	private static performCriticalContextPreservation(
		originalState: ContextState,
		analysis: any,
		contextTokens: number,
		maxTokens: number,
	): Promise<ContextOptimizationResult> {
		const targetTokens = Math.floor(maxTokens * 0.9) // Keep 90% of max

		let preservedCount = 0
		const optimizedApiHistory: ApiMessage[] = []
		const optimizedClineMessages: ClineMessage[] = []
		const preservedElements: string[] = []
		const removedElements: string[] = []

		// Preserve critical and high priority messages
		const criticalAndHigh = [...analysis.critical, ...analysis.high]
		for (const element of criticalAndHigh) {
			if (
				preservedCount >=
				this.PRESERVE_MESSAGE_COUNT[ContextPreservationPriority.CRITICAL] +
					this.PRESERVE_MESSAGE_COUNT[ContextPreservationPriority.HIGH]
			) {
				break
			}
			const apiMessage = this.findMessageByContent(originalState.originalApiHistory, element)
			const clineMessage = this.findMessageByContent(originalState.originalClineMessages, element)

			if (apiMessage) {
				optimizedApiHistory.push(apiMessage)
			}
			if (clineMessage) {
				optimizedClineMessages.push(clineMessage)
			}

			preservedElements.push(element)
			preservedCount++
		}

		// Add medium priority messages until we reach target
		for (const element of analysis.medium) {
			if (this.calculateTotalTokens(optimizedApiHistory) >= targetTokens) {
				break
			}
			const apiMessage = this.findMessageByContent(originalState.originalApiHistory, element)
			const clineMessage = this.findMessageByContent(originalState.originalClineMessages, element)

			if (apiMessage) {
				optimizedApiHistory.push(apiMessage)
			}
			if (clineMessage) {
				optimizedClineMessages.push(clineMessage)
			}

			preservedElements.push(element)
			preservedCount++
		}

		// Calculate context reduction
		const contextReduction = Math.round((1 - this.calculateTotalTokens(optimizedApiHistory) / contextTokens) * 100)

		return {
			success: true,
			optimizedApiHistory,
			optimizedClineMessages: this.synchronizeHistories(optimizedApiHistory, originalState.originalClineMessages),
			preservedElements,
			removedElements: analysis.low, // Only low priority elements are removed
			strategy: ContextOptimizationStrategy.PRESERVE_CRITICAL_CONTEXT,
			contextReduction,
		}
	}

	/**
	 * Synchronizes API and Cline message histories to maintain consistency
	 */
	private static synchronizeHistories(apiHistory: ApiMessage[], clineMessages: ClineMessage[]): ClineMessage[] {
		// For now, return the original Cline messages as is
		// The synchronization logic will be handled by the calling context
		// This ensures we don't duplicate or lose messages during optimization
		return [...clineMessages]
	}

	/**
	 * Extracts preserved elements from truncation result
	 */
	private static extractPreservedElements(originalState: ContextState, truncateResult: TruncateResponse): string[] {
		const preserved: string[] = []

		// Extract preserved elements from the result
		if (truncateResult.messages) {
			for (const message of truncateResult.messages) {
				const content = this.getMessageContent(message)
				if (content) {
					preserved.push(`API: ${content.substring(0, 100)}...`)
				}
			}
		}

		// Add critical elements that were preserved by strategy
		for (const element of originalState.preservedElements) {
			preserved.push(element)
		}

		return preserved
	}

	/**
	 * Extracts removed elements from truncation result
	 */
	private static extractRemovedElements(originalState: ContextState, truncateResult: TruncateResponse): string[] {
		const removed: string[] = []

		// Extract removed elements from the analysis
		if (originalState.removedElements) {
			removed.push(...originalState.removedElements)
		}

		// Add elements that were truncated by the operation
		if (truncateResult.messages && truncateResult.messages.length < originalState.originalApiHistory.length) {
			const removedCount = originalState.originalApiHistory.length - truncateResult.messages.length
			removed.push(`Removed ${removedCount} Messages via truncation`)
		}

		return removed
	}

	/**
	 * Finds a message by its content in the history
	 */
	private static findMessageByContent(
		history: ApiMessage[] | ClineMessage[],
		content: string,
	): ApiMessage | ClineMessage | undefined {
		return history.find((msg) => {
			const msgContent = this.getMessageContent(msg)
			return msgContent && msgContent.includes(content.substring(0, 50))
		})
	}

	/**
	 * Gets the content of an API message
	 */
	private static getMessageContent(message: ApiMessage): string {
		if (Array.isArray(message.content)) {
			return message.content
				.map((block) => (block.type === "text" ? block.text : ""))
				.join(" ")
				.trim()
		}
		return typeof message.content === "string" ? message.content : ""
	}

	/**
	 * Gets the content of a Cline message
	 */
	private static getClineMessageContent(message: ClineMessage): string {
		return message.text || ""
	}

	/**
	 * Gets a summary of a message for logging
	 */
	private static getMessageSummary(message: ApiMessage | ClineMessage): string {
		const content = this.getMessageContent(message) || this.getClineMessageContent(message)
		return content.length > 100 ? `${content.substring(0, 100)}...` : content
	}

	/**
	 * Calculates total tokens for a list of messages
	 */
	private static calculateTotalTokens(messages: ApiMessage[]): number {
		// This is a simplified estimation - in practice, this would use
		// the actual token counting from the API handler
		return messages.length * 100 // Rough estimate
	}
}
