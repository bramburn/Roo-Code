import * as fs from "fs"
import * as fsPromises from "fs/promises"
import * as path from "path"
import { EventEmitter } from "events"

/**
 * File change event information
 */
export interface FileChangeEvent {
	filepath: string
	exists: boolean
	content?: string
}

/**
 * File watcher for context review files
 * Implements debouncing (300ms delay) and provides change notifications
 */
export class FileWatcher extends EventEmitter {
	private readonly contextReviewDir: string
	private readonly debounceDelay: number = 300
	private debounceTimer: NodeJS.Timeout | undefined
	private isWatching: boolean = false
	private watcher: fs.FSWatcher | undefined

	constructor(contextReviewDir: string) {
		super()
		this.contextReviewDir = contextReviewDir
	}

	/**
	 * Start watching for file changes
	 */
	async start(): Promise<void> {
		try {
			// Ensure directory exists
			await fsPromises.mkdir(this.contextReviewDir, { recursive: true })

			// Create file system watcher
			this.watcher = fs.watch(this.contextReviewDir, (eventType: string, filename: string | null) => {
				if (eventType === "change" && filename) {
					const filepath = path.join(this.contextReviewDir, filename)
					this.handleFileChange(filepath)
				}
			})

			this.isWatching = true
			console.log(`FileWatcher: Started watching ${this.contextReviewDir}`)
		} catch (error) {
			console.error("FileWatcher: Failed to start watching:", error)
			throw error
		}
	}

	/**
	 * Stop watching for file changes
	 */
	stop(): void {
		if (this.watcher) {
			this.watcher.close()
			this.watcher = undefined
		}

		if (this.debounceTimer) {
			clearTimeout(this.debounceTimer)
			this.debounceTimer = undefined
		}

		this.isWatching = false
		console.log(`FileWatcher: Stopped watching ${this.contextReviewDir}`)
	}

	/**
	 * Handle file change with debouncing
	 */
	private async handleFileChange(filepath: string): Promise<void> {
		// Clear existing debounce timer
		if (this.debounceTimer) {
			clearTimeout(this.debounceTimer)
		}

		// Set new debounce timer
		this.debounceTimer = setTimeout(async () => {
			await this.processFileChange(filepath)
			this.debounceTimer = undefined
		}, this.debounceDelay)
	}

	/**
	 * Process actual file change
	 */
	private async processFileChange(filepath: string): Promise<void> {
		try {
			// Check if file exists
			const stats = await fsPromises.stat(filepath).catch(() => null)
			const exists = stats !== null

			let content: string | undefined
			if (exists) {
				content = await fsPromises.readFile(filepath, "utf-8")
			}

			const event: FileChangeEvent = {
				filepath,
				exists,
				content,
			}

			// Emit change event
			this.emit("fileChange", event)

			console.log(`FileWatcher: File changed: ${filepath} (exists: ${exists})`)
		} catch (error) {
			console.error(`FileWatcher: Error processing file change for ${filepath}:`, error)
		}
	}

	/**
	 * Get all context files in the directory
	 */
	async getContextFiles(): Promise<string[]> {
		try {
			const files = await fsPromises.readdir(this.contextReviewDir)
			return files
				.filter((file) => file.endsWith("-context.md"))
				.map((file) => path.join(this.contextReviewDir, file))
				.sort()
		} catch (error) {
			console.error("FileWatcher: Failed to get context files:", error)
			return []
		}
	}

	/**
	 * Check if currently watching
	 */
	isActive(): boolean {
		return this.isWatching
	}

	/**
	 * Cleanup resources
	 */
	dispose(): void {
		this.stop()
		this.removeAllListeners()
	}
}
