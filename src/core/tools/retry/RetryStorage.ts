import * as fs from "fs/promises"
import * as path from "path"
import * as os from "os"
import type { RetryState, RetryStorageEntry } from "./types"

/**
 * Retry storage for persisting retry state across application restarts
 * Provides file-based persistence with automatic cleanup
 */
export class RetryStorage {
	private readonly storagePath: string
	private readonly retentionPeriod: number
	private readonly enablePersistence: boolean

	constructor(
		storageDir?: string,
		retentionPeriod: number = 24 * 60 * 60 * 1000, // 24 hours
		enablePersistence: boolean = true,
	) {
		this.retentionPeriod = retentionPeriod
		this.enablePersistence = enablePersistence

		// Use provided directory or default to temp directory
		const baseDir = storageDir || path.join(os.tmpdir(), "roo-code-retry")
		this.storagePath = path.join(baseDir, "retry-state.json")
	}

	/**
	 * Store retry state
	 * @param state - Retry state to store
	 * @param isPersistent - Whether this state should persist across restarts
	 */
	async storeState(state: RetryState, isPersistent: boolean = true): Promise<void> {
		if (!this.enablePersistence) {
			return
		}

		try {
			// Ensure storage directory exists
			await this.ensureStorageDirectory()

			// Load existing storage
			const storage = await this.loadStorage()

			// Create storage entry
			const entry: RetryStorageEntry = {
				state,
				storedAt: Date.now(),
				expiresAt: Date.now() + this.retentionPeriod,
				isPersistent,
			}

			// Add or update entry
			storage.entries[state.id] = entry

			// Clean up expired entries
			this.cleanupExpiredEntries(storage)

			// Save to file
			await this.saveStorage(storage)
		} catch (error) {
			console.warn("[RetryStorage] Failed to store retry state:", error)
		}
	}

	/**
	 * Load retry state
	 * @param retryId - Retry operation ID
	 * @returns Retry state if found and not expired
	 */
	async loadState(retryId: string): Promise<RetryState | null> {
		if (!this.enablePersistence) {
			return null
		}

		try {
			const storage = await this.loadStorage()
			const entry = storage.entries[retryId]

			if (!entry) {
				return null
			}

			// Check if entry is expired
			if (Date.now() > entry.expiresAt) {
				// Remove expired entry
				delete storage.entries[retryId]
				await this.saveStorage(storage)
				return null
			}

			return entry.state
		} catch (error) {
			console.warn("[RetryStorage] Failed to load retry state:", error)
			return null
		}
	}

	/**
	 * Remove retry state
	 * @param retryId - Retry operation ID
	 */
	async removeState(retryId: string): Promise<void> {
		if (!this.enablePersistence) {
			return
		}

		try {
			const storage = await this.loadStorage()
			delete storage.entries[retryId]
			await this.saveStorage(storage)
		} catch (error) {
			console.warn("[RetryStorage] Failed to remove retry state:", error)
		}
	}

	/**
	 * Get all active retry states
	 * @returns Array of active retry states
	 */
	async getAllActiveStates(): Promise<RetryState[]> {
		if (!this.enablePersistence) {
			return []
		}

		try {
			const storage = await this.loadStorage()
			const now = Date.now()
			const activeStates: RetryState[] = []

			for (const entry of Object.values(storage.entries)) {
				if (now <= entry.expiresAt && entry.state.isActive) {
					activeStates.push(entry.state)
				}
			}

			return activeStates
		} catch (error) {
			console.warn("[RetryStorage] Failed to load active states:", error)
			return []
		}
	}

	/**
	 * Get all retry states for a specific tool
	 * @param toolName - Tool name
	 * @returns Array of retry states for the tool
	 */
	async getStatesByTool(toolName: string): Promise<RetryState[]> {
		if (!this.enablePersistence) {
			return []
		}

		try {
			const storage = await this.loadStorage()
			const now = Date.now()
			const toolStates: RetryState[] = []

			for (const entry of Object.values(storage.entries)) {
				if (now <= entry.expiresAt && entry.state.toolName === toolName) {
					toolStates.push(entry.state)
				}
			}

			return toolStates
		} catch (error) {
			console.warn("[RetryStorage] Failed to load tool states:", error)
			return []
		}
	}

	/**
	 * Clean up expired entries
	 */
	async cleanup(): Promise<void> {
		if (!this.enablePersistence) {
			return
		}

		try {
			const storage = await this.loadStorage()
			const cleanedCount = this.cleanupExpiredEntries(storage)

			if (cleanedCount > 0) {
				await this.saveStorage(storage)
				console.info(`[RetryStorage] Cleaned up ${cleanedCount} expired retry states`)
			}
		} catch (error) {
			console.warn("[RetryStorage] Failed to cleanup storage:", error)
		}
	}

	/**
	 * Get storage statistics
	 * @returns Storage statistics
	 */
	async getStorageStats(): Promise<{
		totalEntries: number
		activeEntries: number
		expiredEntries: number
		persistentEntries: number
		temporaryEntries: number
		storageSize: number
	}> {
		if (!this.enablePersistence) {
			return {
				totalEntries: 0,
				activeEntries: 0,
				expiredEntries: 0,
				persistentEntries: 0,
				temporaryEntries: 0,
				storageSize: 0,
			}
		}

		try {
			const storage = await this.loadStorage()
			const now = Date.now()
			const stats = {
				totalEntries: Object.keys(storage.entries).length,
				activeEntries: 0,
				expiredEntries: 0,
				persistentEntries: 0,
				temporaryEntries: 0,
				storageSize: 0,
			}

			for (const entry of Object.values(storage.entries)) {
				if (now > entry.expiresAt) {
					stats.exiredEntries++
				} else if (entry.state.isActive) {
					stats.activeEntries++
				}

				if (entry.isPersistent) {
					stats.persistentEntries++
				} else {
					stats.temporaryEntries++
				}
			}

			// Calculate storage size
			try {
				const storageData = JSON.stringify(storage, null, 2)
				stats.storageSize = Buffer.byteLength(storageData, "utf8")
			} catch {
				// Ignore size calculation errors
			}

			return stats
		} catch (error) {
			console.warn("[RetryStorage] Failed to get storage stats:", error)
			return {
				totalEntries: 0,
				activeEntries: 0,
				expiredEntries: 0,
				persistentEntries: 0,
				temporaryEntries: 0,
				storageSize: 0,
			}
		}
	}

	/**
	 * Clear all storage
	 */
	async clearStorage(): Promise<void> {
		if (!this.enablePersistence) {
			return
		}

		try {
			await this.saveStorage({ entries: {}, version: 1, lastCleanup: Date.now() })
		} catch (error) {
			console.warn("[RetryStorage] Failed to clear storage:", error)
		}
	}

	/**
	 * Export storage data
	 * @returns JSON string of storage data
	 */
	async exportStorage(): Promise<string> {
		if (!this.enablePersistence) {
			return JSON.stringify({ entries: {}, version: 1, lastCleanup: Date.now() }, null, 2)
		}

		try {
			const storage = await this.loadStorage()
			return JSON.stringify(storage, null, 2)
		} catch (error) {
			console.warn("[RetryStorage] Failed to export storage:", error)
			return "{}"
		}
	}

	/**
	 * Import storage data
	 * @param data - JSON string of storage data
	 */
	async importStorage(data: string): Promise<void> {
		if (!this.enablePersistence) {
			return
		}

		try {
			const storage = JSON.parse(data)

			// Validate storage format
			if (!storage.entries || typeof storage.entries !== "object") {
				throw new Error("Invalid storage format")
			}

			// Clean up expired entries
			this.cleanupExpiredEntries(storage)

			// Save imported storage
			await this.saveStorage(storage)
		} catch (error) {
			console.warn("[RetryStorage] Failed to import storage:", error)
		}
	}

	/**
	 * Ensure storage directory exists
	 */
	private async ensureStorageDirectory(): Promise<void> {
		const dir = path.dirname(this.storagePath)
		try {
			await fs.access(dir)
		} catch {
			await fs.mkdir(dir, { recursive: true })
		}
	}

	/**
	 * Load storage from file
	 * @returns Storage object
	 */
	private async loadStorage(): Promise<{
		entries: Record<string, RetryStorageEntry>
		version: number
		lastCleanup: number
	}> {
		try {
			const data = await fs.readFile(this.storagePath, "utf8")
			const storage = JSON.parse(data)

			// Ensure structure is valid
			if (!storage.entries || typeof storage.entries !== "object") {
				return { entries: {}, version: 1, lastCleanup: Date.now() }
			}

			return {
				entries: storage.entries || {},
				version: storage.version || 1,
				lastCleanup: storage.lastCleanup || Date.now(),
			}
		} catch (error) {
			// File doesn't exist or is corrupted
			return { entries: {}, version: 1, lastCleanup: Date.now() }
		}
	}

	/**
	 * Save storage to file
	 * @param storage - Storage object to save
	 */
	private async saveStorage(storage: {
		entries: Record<string, RetryStorageEntry>
		version: number
		lastCleanup: number
	}): Promise<void> {
		try {
			const data = JSON.stringify(storage, null, 2)
			await fs.writeFile(this.storagePath, data, "utf8")
		} catch (error) {
			console.warn("[RetryStorage] Failed to save storage:", error)
		}
	}

	/**
	 * Clean up expired entries from storage
	 * @param storage - Storage object to clean
	 * @returns Number of entries removed
	 */
	private cleanupExpiredEntries(storage: {
		entries: Record<string, RetryStorageEntry>
		version: number
		lastCleanup: number
	}): number {
		const now = Date.now()
		const expiredKeys: string[] = []

		for (const [key, entry] of Object.entries(storage.entries)) {
			if (now > entry.expiresAt) {
				expiredKeys.push(key)
			}
		}

		for (const key of expiredKeys) {
			delete storage.entries[key]
		}

		storage.lastCleanup = now
		return expiredKeys.length
	}
}
