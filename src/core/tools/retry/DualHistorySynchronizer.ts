import { type ApiMessage } from "../../../shared/ExtensionMessage"
import { type ClineMessage } from "../../../shared/ExtensionMessage"
import { ContextOptimizer, type ContextOptimizationResult } from "./ContextOptimizer"
import { ContextStateManager, type ContextMemoryState } from "./ContextStateManager"

/**
 * Synchronization result for dual history operations
 */
export interface SynchronizationResult {
	success: boolean
	apiHistory: ApiMessage[]
	clineMessages: ClineMessage[]
	syncedElements: number
	unsyncedElements: number
	error?: string
	warnings?: string[]
}

/**
 * Dual-history synchronization state tracking
 */
export interface SynchronizationState {
	lastSyncTime: number
	totalSyncs: number
	successfulSyncs: number
	failedSyncs: number
	averageSyncTime: number
}

/**
 * Manages synchronization between apiConversationHistory and clineMessages
 * Ensures consistency during retry operations and context optimization
 */
export class DualHistorySynchronizer {
	private static readonly SYNC_TOLERANCE = 0.1 // 10% tolerance for sync differences
	private static readonly MIN_SYNC_INTERVAL = 1000 // 1 second minimum between syncs

	private syncState: SynchronizationState = {
		lastSyncTime: Date.now(),
		totalSyncs: 0,
		successfulSyncs: 0,
		failedSyncs: 0,
		averageSyncTime: 0,
	}

	/**
	 * Synchronizes API and Cline message histories
	 *
	 * @param apiHistory - Current API conversation history
	 * @param clineMessages - Current Cline messages
	 * @param operation - Description of the operation being performed
	 * @returns Synchronization result
	 */
	public synchronizeHistories(
		apiHistory: ApiMessage[],
		clineMessages: ClineMessage[],
		operation: string = "synchronization",
	): SynchronizationResult {
		const startTime = Date.now()

		try {
			// Validate inputs
			if (!Array.isArray(apiHistory) || !Array.isArray(clineMessages)) {
				return {
					success: false,
					apiHistory,
					clineMessages,
					syncedElements: 0,
					unsyncedElements: 0,
					error: "Invalid input: histories must be arrays",
				}
			}

			// Perform synchronization
			const result = this.performSynchronization(apiHistory, clineMessages, operation)

			// Update sync state
			this.updateSyncState(result)

			// Log performance metrics
			const syncTime = Date.now() - startTime
			console.log(`[DualHistorySynchronizer] ${operation} completed in ${syncTime}ms`, {
				syncedElements: result.syncedElements,
				unsyncedElements: result.unsyncedElements,
				success: result.success,
			})

			return result
		} catch (error) {
			console.error(`[DualHistorySynchronizer] ${operation} failed:`, error)

			return {
				success: false,
				apiHistory,
				clineMessages,
				syncedElements: 0,
				unsyncedElements: 0,
				error: error.message,
			}
		}
	}

	/**
	 * Synchronizes after context optimization
	 *
	 * @param optimizationResult - Result from context optimization
	 * @param originalApiHistory - Original API history before optimization
	 * @param originalClineMessages - Original Cline messages before optimization
	 * @returns Synchronization result
	 */
	public synchronizeAfterOptimization(
		optimizationResult: ContextOptimizationResult,
		originalApiHistory: ApiMessage[],
		originalClineMessages: ClineMessage[],
	): SynchronizationResult {
		return this.synchronizeHistories(
			optimizationResult.optimizedApiHistory,
			optimizationResult.optimizedClineMessages,
			"post-optimization synchronization",
		)
	}

	/**
	 * Synchronizes after context restoration
	 *
	 * @param restoredApiHistory - Restored API history
	 * @param restoredClineMessages - Restored Cline messages
	 * @returns Synchronization result
	 */
	public synchronizeAfterRestoration(
		restoredApiHistory: ApiMessage[],
		restoredClineMessages: ClineMessage[],
	): SynchronizationResult {
		return this.synchronizeHistories(restoredApiHistory, restoredClineMessages, "post-restoration synchronization")
	}

	/**
	 * Validates synchronization between histories
	 *
	 * @param apiHistory - API history to validate
	 * @param clineMessages - Cline messages to validate
	 * @returns Validation result with issues if any
	 */
	public validateSynchronization(
		apiHistory: ApiMessage[],
		clineMessages: ClineMessage[],
	): { isValid: boolean; issues: string[] } {
		const issues: string[] = []

		// Check length consistency
		const apiLength = apiHistory.length
		const clineLength = clineMessages.length
		const lengthDifference = Math.abs(apiLength - clineLength)
		const maxLength = Math.max(apiLength, clineLength)

		if (lengthDifference > maxLength * this.SYNC_TOLERANCE) {
			issues.push(`Significant length difference: API(${apiLength}) vs Cline(${clineLength})`)
		}

		// Check for message ordering consistency
		if (this.hasMessageOrderingIssues(apiHistory, clineMessages)) {
			issues.push("Message ordering inconsistency detected")
		}

		// Check for duplicate messages
		const duplicates = this.findDuplicateMessages(apiHistory, clineMessages)
		if (duplicates.length > 0) {
			issues.push(`Duplicate messages found: ${duplicates.length}`)
		}

		// Check for orphaned messages
		const orphaned = this.findOrphanedMessages(apiHistory, clineMessages)
		if (orphaned.length > 0) {
			issues.push(`Orphaned messages found: ${orphaned.length}`)
		}

		return {
			isValid: issues.length === 0,
			issues,
		}
	}

	/**
	 * Performs the actual synchronization logic
	 */
	private performSynchronization(
		apiHistory: ApiMessage[],
		clineMessages: ClineMessage[],
		operation: string,
	): SynchronizationResult {
		let syncedElements = 0
		let unsyncedElements = 0

		// Create message maps for efficient lookup
		const apiMessageMap = new Map<string, ApiMessage>()
		const clineMessageMap = new Map<string, ClineMessage>()

		// Build API message map
		for (const message of apiHistory) {
			const messageId = this.getMessageId(message)
			if (messageId) {
				apiMessageMap.set(messageId, message)
			}
		}

		// Build Cline message map
		for (const message of clineMessages) {
			if (message.type === "say" && message.text) {
				clineMessageMap.set(message.text, message)
			}
		}

		// Synchronize API history to Cline messages
		for (const [index, apiMessage] of apiHistory.entries()) {
			const messageId = this.getMessageId(apiMessage)
			if (messageId) {
				const clineMessage = clineMessageMap.get(messageId)
				if (clineMessage) {
					// Found matching Cline message
					syncedElements++
				} else {
					// No matching Cline message - needs to be created
					const newClineMessage = this.createClineMessageFromApi(apiMessage)
					clineMessages.push(newClineMessage)
					unsyncedElements++
				}
			}
		}

		// Synchronize Cline messages to API history
		for (const [index, clineMessage] of clineMessages.entries()) {
			if (clineMessage.type === "say" && clineMessage.text) {
				const apiMessage = apiMessageMap.get(clineMessage.text)
				if (apiMessage) {
					// Found matching API message
					syncedElements++
				} else {
					// No matching API message - needs to be created
					const newApiMessage = this.createApiMessageFromCline(clineMessage)
					apiHistory.push(newApiMessage)
					unsyncedElements++
				}
			}
		}

		return {
			success: true,
			apiHistory,
			clineMessages,
			syncedElements,
			unsyncedElements,
		}
	}

	/**
	 * Updates synchronization state tracking
	 */
	private updateSyncState(result: SynchronizationResult): void {
		this.syncState.lastSyncTime = Date.now()
		this.syncState.totalSyncs++

		if (result.success) {
			this.syncState.successfulSyncs++
		} else {
			this.syncState.failedSyncs++
		}

		// Update average sync time
		const totalSyncTime = this.syncState.totalSyncs * this.MIN_SYNC_INTERVAL
		this.syncState.averageSyncTime =
			(this.syncState.averageSyncTime * (this.syncState.totalSyncs - 1) +
				(Date.now() - this.syncState.lastSyncTime)) /
			this.syncState.totalSyncs
	}

	/**
	 * Checks for message ordering issues
	 */
	private hasMessageOrderingIssues(apiHistory: ApiMessage[], clineMessages: ClineMessage[]): boolean {
		// Check if timestamps are monotonic (within reasonable tolerance)
		const timestamps = apiHistory.filter((msg) => msg.ts).map((msg) => msg.ts || 0)

		for (let i = 1; i < timestamps.length; i++) {
			if (timestamps[i] < timestamps[i - 1] - 1000) {
				// Allow 1 second tolerance
				return true
			}
		}

		return false
	}

	/**
	 * Finds duplicate messages in histories
	 */
	private findDuplicateMessages(apiHistory: ApiMessage[], clineMessages: ClineMessages[]): string[] {
		const duplicates: string[] = []
		const seen = new Set<string>()

		// Check API history for duplicates
		for (const message of apiHistory) {
			const messageId = this.getMessageId(message)
			if (messageId && seen.has(messageId)) {
				duplicates.push(`API duplicate: ${messageId}`)
			}
			seen.add(messageId)
		}

		// Check Cline messages for duplicates
		const seenTexts = new Set<string>()
		for (const message of clineMessages) {
			if (message.type === "say" && message.text) {
				if (seenTexts.has(message.text)) {
					duplicates.push(`Cline duplicate: ${message.text.substring(0, 50)}...`)
				}
				seenTexts.add(message.text)
			}
		}

		return duplicates
	}

	/**
	 * Finds orphaned messages (messages without counterparts)
	 */
	private findOrphanedMessages(apiHistory: ApiMessage[], clineMessages: ClineMessage[]): string[] {
		const orphaned: string[] = []

		// Check for orphaned Cline messages
		const apiMessageTexts = new Set(apiHistory.map((msg) => this.getMessageContent(msg)))
		for (const message of clineMessages) {
			if (message.type === "say" && message.text) {
				if (!apiMessageTexts.has(message.text)) {
					orphaned.push(`Orphaned Cline: ${message.text.substring(0, 50)}...`)
				}
			}
		}

		// Check for orphaned API messages
		const clineMessageTexts = new Set(
			clineMessages.filter((msg) => msg.type === "say" && msg.text).map((msg) => msg.text),
		)

		for (const message of apiHistory) {
			const content = this.getMessageContent(message)
			if (content && !clineMessageTexts.has(content)) {
				orphaned.push(`Orphaned API: ${content.substring(0, 50)}...`)
			}
		}

		return orphaned
	}

	/**
	 * Creates a Cline message from an API message
	 */
	private createClineMessageFromApi(apiMessage: ApiMessage): ClineMessage {
		const content = this.getMessageContent(apiMessage)
		return {
			ts: apiMessage.ts || Date.now(),
			type: "say",
			say: "text",
			text: content,
		}
	}

	/**
	 * Creates an API message from a Cline message
	 */
	private createApiMessageFromCline(clineMessage: ClineMessage): ApiMessage {
		return {
			role: "assistant",
			content: [{ type: "text", text: clineMessage.text || "" }],
			ts: clineMessage.ts || Date.now(),
		}
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
	 * Gets current synchronization state
	 */
	public getSyncState(): SynchronizationState {
		return { ...this.syncState }
	}

	/**
	 * Resets synchronization state for new task
	 */
	public reset(): void {
		this.syncState = {
			lastSyncTime: Date.now(),
			totalSyncs: 0,
			successfulSyncs: 0,
			failedSyncs: 0,
			averageSyncTime: 0,
		}

		console.log("[DualHistorySynchronizer] Synchronization state reset")
	}
}
