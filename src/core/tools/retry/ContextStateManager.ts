import { type ApiMessage } from "../../../shared/ExtensionMessage"
import { type ClineMessage } from "../../../shared/ExtensionMessage"
import { ContextOptimizer, type ContextOptimizationResult } from "./ContextOptimizer"
import { ErrorClassifier, type ErrorClassification } from "./ErrorClassifier"

/**
 * Memory management thresholds for context optimization
 */
export const MEMORY_THRESHOLDS = {
	GROWTH_DETECTION: 0.5, // 50% increase in context size indicates growth
	MAX_GROWTH_CYCLES: 3, // Maximum allowed growth cycles before forced cleanup
	AGGRESSIVE_CLEANUP_THRESHOLD: 0.8, // 80% of max tokens triggers aggressive cleanup
	CRITICAL_MEMORY_THRESHOLD: 0.95, // 95% of max tokens is critical
}

/**
 * Context state tracking for memory management
 */
export interface ContextMemoryState {
	totalOptimizations: number
	growthCycles: number
	lastOptimizationTime: number
	averageContextSize: number
	peakContextSize: number
	memoryPressureLevel: number // 0-1 scale
}

/**
 * Context restoration state for failed retries
 */
export interface ContextRestorationState {
	originalApiHistory: ApiMessage[]
	originalClineMessages: ClineMessage[]
	restorationAttempts: number
	lastRestorationTime: number
	successfulRestorations: number
}

/**
 * Manages context state and memory during retry operations
 * Prevents exponential context growth and ensures efficient resource usage
 */
export class ContextStateManager {
	private memoryState: ContextMemoryState = {
		totalOptimizations: 0,
		growthCycles: 0,
		lastOptimizationTime: Date.now(),
		averageContextSize: 0,
		peakContextSize: 0,
		memoryPressureLevel: 0,
	}

	private restorationState: ContextRestorationState = {
		originalApiHistory: [],
		originalClineMessages: [],
		restorationAttempts: 0,
		lastRestorationTime: Date.now(),
		successfulRestorations: 0,
	}

	/**
	 * Updates memory state tracking
	 */
	private updateMemoryState(contextSize: number, optimizationResult: ContextOptimizationResult): void {
		this.memoryState.totalOptimizations++
		this.memoryState.lastOptimizationTime = Date.now()

		// Update running average
		const alpha = 0.3 // Smoothing factor for moving average
		this.memoryState.averageContextSize = this.memoryState.averageContextSize * (1 - alpha) + contextSize * alpha

		// Update peak
		this.memoryState.peakContextSize = Math.max(this.memoryState.peakContextSize, contextSize)

		// Update memory pressure level (0-1 scale)
		this.memoryState.memoryPressureLevel = Math.min(contextSize / 1000000, 1) // Assuming 1M tokens as high pressure

		// Detect growth cycles
		const sizeIncrease = contextSize - this.memoryState.averageContextSize
		if (sizeIncrease > this.memoryState.averageContextSize * MEMORY_THRESHOLDS.GROWTH_DETECTION) {
			this.memoryState.growthCycles++
		} else {
			// Reset growth cycles if size decreases
			this.memoryState.growthCycles = 0
		}

		console.log(`[ContextStateManager] Memory state updated:`, {
			contextSize,
			averageContextSize: this.memoryState.averageContextSize,
			peakContextSize: this.memoryState.peakContextSize,
			memoryPressureLevel: this.memoryState.memoryPressureLevel,
			growthCycles: this.memoryState.growthCycles,
			optimization: optimizationResult.strategy,
		})
	}

	/**
	 * Checks if aggressive cleanup is needed
	 */
	private needsAggressiveCleanup(contextSize: number, maxTokens: number): boolean {
		return contextSize > maxTokens * MEMORY_THRESHOLDS.AGGRESSIVE_CLEANUP_THRESHOLD
	}

	/**
	 * Checks if memory pressure is critical
	 */
	private isCriticalMemoryPressure(contextSize: number, maxTokens: number): boolean {
		return contextSize > maxTokens * MEMORY_THRESHOLDS.CRITICAL_MEMORY_THRESHOLD
	}

	/**
	 * Checks if growth cycles exceed threshold
	 */
	private hasExcessiveGrowthCycles(): boolean {
		return this.memoryState.growthCycles > MEMORY_THRESHOLDS.MAX_GROWTH_CYCLES
	}

	/**
	 * Records a context restoration attempt
	 */
	private recordRestorationAttempt(apiHistory: ApiMessage[], clineMessages: ClineMessage[], success: boolean): void {
		this.restorationState.restorationAttempts++
		this.restorationState.lastRestorationTime = Date.now()

		if (success) {
			this.restorationState.successfulRestorations++
		}

		console.log(
			`[ContextStateManager] Restoration attempt ${this.restorationState.restorationAttempts}: ${success ? "Success" : "Failed"}`,
		)
	}

	/**
	 * Gets current memory state
	 */
	public getMemoryState(): ContextMemoryState {
		return { ...this.memoryState }
	}

	/**
	 * Gets current restoration state
	 */
	public getRestorationState(): ContextRestorationState {
		return { ...this.restorationState }
	}

	/**
	 * Manages context state during optimization operations
	 */
	public manageContextDuringOptimization(
		optimizationResult: ContextOptimizationResult,
		apiHistory: ApiMessage[],
		clineMessages: ClineMessage[],
		contextSize: number,
		maxTokens: number,
	): void {
		// Update memory state
		this.updateMemoryState(contextSize, optimizationResult)

		// Store original state for potential restoration
		if (optimizationResult.success) {
			this.restorationState.originalApiHistory = [...apiHistory]
			this.restorationState.originalClineMessages = [...clineMessages]
		}

		// Check for memory pressure issues
		if (this.isCriticalMemoryPressure(contextSize, maxTokens)) {
			console.warn(`[ContextStateManager] Critical memory pressure detected: ${contextSize}/${maxTokens} tokens`)
			// Trigger immediate cleanup
			this.triggerEmergencyCleanup(apiHistory, clineMessages)
			return
		}

		// Check for excessive growth
		if (this.hasExcessiveGrowthCycles()) {
			console.warn(`[ContextStateManager] Excessive growth cycles detected: ${this.memoryState.growthCycles}`)
			this.triggerEmergencyCleanup(apiHistory, clineMessages)
			return
		}

		// Check if aggressive cleanup is needed
		if (this.needsAggressiveCleanup(contextSize, maxTokens)) {
			console.warn(`[ContextStateManager] Aggressive cleanup triggered: ${contextSize}/${maxTokens} tokens`)
			this.triggerAggressiveCleanup(apiHistory, clineMessages)
			return
		}

		console.log(`[ContextStateManager] Context optimization completed successfully`)
	}

	/**
	 * Triggers emergency cleanup to prevent memory issues
	 */
	private triggerEmergencyCleanup(originalApiHistory: ApiMessage[], originalClineMessages: ClineMessage[]): void {
		console.warn(`[ContextStateManager] Emergency cleanup triggered`)

		// Keep only the most recent essential messages
		const maxMessages = 20
		const apiHistory = originalApiHistory.slice(-maxMessages)
		const clineMessagesHistory = originalClineMessages.slice(-maxMessages)

		console.log(
			`[ContextStateManager] Emergency cleanup: reduced from ${originalApiHistory.length} to ${apiHistory.length} API messages`,
		)
		console.log(
			`[ContextStateManager] Emergency cleanup: reduced from ${originalClineMessages.length} to ${clineMessagesHistory.length} Cline messages`,
		)

		// Update memory state to reflect cleanup
		this.updateMemoryState(
			apiHistory.length * 100, // Estimate
			{
				success: true,
				optimizedApiHistory: apiHistory,
				optimizedClineMessages: clineMessagesHistory,
				preservedElements: [],
				removedElements: [
					`Emergency cleanup: removed ${originalApiHistory.length - apiHistory.length} messages`,
				],
				strategy: "emergency_cleanup",
				contextReduction: Math.round((1 - apiHistory.length / originalApiHistory.length) * 100),
			},
		)
	}

	/**
	 * Triggers aggressive cleanup to reduce memory pressure
	 */
	private triggerAggressiveCleanup(originalApiHistory: ApiMessage[], originalClineMessages: ClineMessage[]): void {
		console.warn(`[ContextStateManager] Aggressive cleanup triggered`)

		// Keep only recent messages (last 50)
		const maxMessages = 50
		const apiHistory = originalApiHistory.slice(-maxMessages)
		const clineMessagesHistory = originalClineMessages.slice(-maxMessages)

		console.log(
			`[ContextStateManager] Aggressive cleanup: reduced from ${originalApiHistory.length} to ${apiHistory.length} API messages`,
		)
		console.log(
			`[ContextStateManager] Aggressive cleanup: reduced from ${originalClineMessages.length} to ${clineMessagesHistory.length} Cline messages`,
		)

		// Reset growth cycles
		this.memoryState.growthCycles = 0

		// Update memory state
		this.updateMemoryState(
			apiHistory.length * 100, // Estimate
			{
				success: true,
				optimizedApiHistory: apiHistory,
				optimizedClineMessages: clineMessagesHistory,
				preservedElements: [],
				removedElements: [
					`Aggressive cleanup: removed ${originalApiHistory.length - apiHistory.length} messages`,
				],
				strategy: "aggressive_cleanup",
				contextReduction: Math.round((1 - apiHistory.length / originalApiHistory.length) * 100),
			},
		)
	}

	/**
	 * Restores context from a failed optimization attempt
	 */
	public restoreContextAfterFailure(
		apiHistory: ApiMessage[],
		clineMessages: ClineMessage[],
	): { success: boolean; restoredApiHistory: ApiMessage[]; restoredClineMessages: ClineMessage[] } {
		console.log(`[ContextStateManager] Attempting context restoration after optimization failure`)

		if (this.restorationState.restorationAttempts === 0) {
			console.warn(`[ContextStateManager] No restoration state available`)
			return {
				success: false,
				restoredApiHistory: apiHistory,
				restoredClineMessages: clineMessages,
			}
		}

		this.recordRestorationAttempt(apiHistory, clineMessages, false)

		try {
			// Attempt to restore from the original state
			const restoredApiHistory = [...this.restorationState.originalApiHistory]
			const restoredClineMessages = [...this.restorationState.originalClineMessages]

			// Validate that we have restoration data
			if (restoredApiHistory.length === 0 || restoredClineMessages.length === 0) {
				console.error(`[ContextStateManager] No restoration data available`)
				return {
					success: false,
					restoredApiHistory: apiHistory,
					restoredClineMessages: clineMessages,
				}
			}

			this.recordRestorationAttempt(restoredApiHistory, restoredClineMessages, true)

			console.log(
				`[ContextStateManager] Context restoration successful: restored ${restoredApiHistory.length} API messages, ${restoredClineMessages.length} Cline messages`,
			)

			return {
				success: true,
				restoredApiHistory,
				restoredClineMessages,
			}
		} catch (error) {
			console.error(`[ContextStateManager] Context restoration failed:`, error)
			this.recordRestorationAttempt(apiHistory, clineMessages, false)

			return {
				success: false,
				restoredApiHistory: apiHistory,
				restoredClineMessages: clineMessages,
			}
		}
	}

	/**
	 * Validates context preservation requirements
	 */
	public validateContextPreservation(
		apiHistory: ApiMessage[],
		clineMessages: ClineMessage[],
		originalApiHistory: ApiMessage[],
		originalClineMessages: ClineMessage[],
	): { isValid: boolean; issues: string[] } {
		const issues: string[] = []

		// Check for exponential growth
		if (this.hasExcessiveGrowthCycles()) {
			issues.push("Excessive context growth cycles detected")
		}

		// Check for critical memory pressure
		const currentContextSize = apiHistory.length * 100 // Estimate
		const maxTokens = 1000000 // Assumed max tokens
		if (this.isCriticalMemoryPressure(currentContextSize, maxTokens)) {
			issues.push("Critical memory pressure level detected")
		}

		// Check for synchronization issues
		const apiLength = apiHistory.length
		const clineLength = clineMessages.length
		const expectedRatio = 0.9 // Allow 10% deviation
		const actualRatio = clineLength / Math.max(apiLength, 1)

		if (Math.abs(actualRatio - expectedRatio) > 0.1) {
			issues.push(
				`History synchronization imbalance: API/Cline ratio ${actualRatio.toFixed(2)} (expected ~${expectedRatio})`,
			)
		}

		// Check for context corruption
		if (this.detectContextCorruption(apiHistory, clineMessages)) {
			issues.push("Potential context corruption detected")
		}

		return {
			isValid: issues.length === 0,
			issues,
		}
	}

	/**
	 * Detects potential context corruption
	 */
	private detectContextCorruption(apiHistory: ApiMessage[], clineMessages: ClineMessage[]): boolean {
		// Check for duplicate messages
		const apiMessageIds = new Set()
		for (const message of apiHistory) {
			const messageId = this.getMessageId(message)
			if (messageId && apiMessageIds.has(messageId)) {
				return true // Duplicate found
			}
			apiMessageIds.add(messageId)
		}

		// Check for orphaned Cline messages (messages without corresponding API messages)
		const apiMessageContents = new Set(apiHistory.map((msg) => this.getMessageContent(msg)))
		for (const clineMessage of clineMessages) {
			if (clineMessage.type === "say" && clineMessage.text) {
				if (!apiMessageContents.has(clineMessage.text)) {
					return true // Orphaned message found
				}
			}
		}

		return false
	}

	/**
	 * Gets a unique identifier for a message
	 */
	private getMessageId(message: ApiMessage): string {
		const content = this.getMessageContent(message)
		if (!content) return ""

		// Create a simple hash from content (first 50 chars)
		return content.substring(0, 50)
	}

	/**
	 * Gets the content of an API message
	 */
	private getMessageContent(message: ApiMessage): string {
		if (Array.isArray(message.content)) {
			return message.content
				.map((block) => (block.type === "text" ? block.text : ""))
				.join(" ")
				.trim()
		}
		return typeof message.content === "string" ? message.content : ""
	}

	/**
	 * Resets memory state for new task
	 */
	public reset(): void {
		this.memoryState = {
			totalOptimizations: 0,
			growthCycles: 0,
			lastOptimizationTime: Date.now(),
			averageContextSize: 0,
			peakContextSize: 0,
			memoryPressureLevel: 0,
		}

		this.restorationState = {
			originalApiHistory: [],
			originalClineMessages: [],
			restorationAttempts: 0,
			lastRestorationTime: Date.now(),
			successfulRestorations: 0,
		}

		console.log("[ContextStateManager] Memory state reset")
	}
}
