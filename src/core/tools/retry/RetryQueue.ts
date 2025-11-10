import { EventEmitter } from "events"
import type { RetryQueueItem, RetryContext } from "./types"

/**
 * Priority queue for managing concurrent retry operations
 * Provides fair scheduling and resource management
 */
export class RetryQueue extends EventEmitter {
	private queue: RetryQueueItem[] = []
	private activeRetries = new Map<string, RetryQueueItem>()
	private maxConcurrentRetries: number
	private processingInterval?: NodeJS.Timeout
	private isProcessing = false

	constructor(maxConcurrentRetries: number = 5) {
		super()
		this.maxConcurrentRetries = maxConcurrentRetries
	}

	/**
	 * Add a retry item to the queue
	 * @param context - Retry context
	 * @param execute - Execution function
	 * @param priority - Priority (lower number = higher priority)
	 * @param timeout - Optional timeout for execution
	 * @returns Unique ID for the queued item
	 */
	enqueue(context: RetryContext, execute: () => Promise<any>, priority: number = 0, timeout?: number): string {
		const item: RetryQueueItem = {
			id: this.generateItemId(),
			priority,
			context,
			execute,
			timeout,
			queuedAt: Date.now(),
		}

		// Insert into priority queue (lower priority number = higher priority)
		let insertIndex = this.queue.length
		for (let i = 0; i < this.queue.length; i++) {
			if (this.queue[i].priority > priority) {
				insertIndex = i
				break
			}
		}

		this.queue.splice(insertIndex, 0, item)

		this.emit("item-queued", item)

		// Start processing if not already running
		this.startProcessing()

		return item.id
	}

	/**
	 * Remove an item from the queue
	 * @param itemId - Item ID to remove
	 * @returns Whether item was found and removed
	 */
	dequeue(itemId: string): boolean {
		// Check active retries first
		const activeItem = this.activeRetries.get(itemId)
		if (activeItem) {
			this.activeRetries.delete(itemId)
			this.emit("item-cancelled", activeItem)
			return true
		}

		// Check queued items
		const queueIndex = this.queue.findIndex((item) => item.id === itemId)
		if (queueIndex !== -1) {
			const removedItem = this.queue.splice(queueIndex, 1)[0]
			this.emit("item-cancelled", removedItem)
			return true
		}

		return false
	}

	/**
	 * Get queue status
	 * @returns Queue status information
	 */
	getStatus(): {
		queueLength: number
		activeRetries: number
		maxConcurrentRetries: number
		isProcessing: boolean
		oldestQueuedItem?: { id: string; waitTime: number }
		averageWaitTime: number
	} {
		const now = Date.now()
		const queuedItems = this.queue.filter((item) => !this.activeRetries.has(item.id))

		let oldestQueuedItem: { id: string; waitTime: number } | undefined
		if (queuedItems.length > 0) {
			const oldest = queuedItems.reduce((oldest, current) =>
				current.queuedAt < oldest.queuedAt ? current : oldest,
			)
			oldestQueuedItem = {
				id: oldest.id,
				waitTime: now - oldest.queuedAt,
			}
		}

		const averageWaitTime =
			queuedItems.length > 0
				? queuedItems.reduce((sum, item) => sum + (now - item.queuedAt), 0) / queuedItems.length
				: 0

		return {
			queueLength: this.queue.length,
			activeRetries: this.activeRetries.size,
			maxConcurrentRetries: this.maxConcurrentRetries,
			isProcessing: this.isProcessing,
			oldestQueuedItem,
			averageWaitTime,
		}
	}

	/**
	 * Get all queued items
	 * @returns Array of queued items
	 */
	getQueuedItems(): RetryQueueItem[] {
		return [...this.queue]
	}

	/**
	 * Get all active retry items
	 * @returns Array of active retry items
	 */
	getActiveRetries(): RetryQueueItem[] {
		return Array.from(this.activeRetries.values())
	}

	/**
	 * Update maximum concurrent retries
	 * @param maxConcurrent - New maximum concurrent retries
	 */
	updateMaxConcurrentRetries(maxConcurrent: number): void {
		this.maxConcurrentRetries = Math.max(1, maxConcurrent)
		this.emit("config-updated", { maxConcurrentRetries: this.maxConcurrentRetries })
	}

	/**
	 * Pause queue processing
	 */
	pause(): void {
		this.stopProcessing()
		this.emit("paused")
	}

	/**
	 * Resume queue processing
	 */
	resume(): void {
		this.startProcessing()
		this.emit("resumed")
	}

	/**
	 * Clear all items from queue
	 * @param cancelActive - Whether to also cancel active retries
	 */
	clearQueue(cancelActive: boolean = false): void {
		const clearedItems = [...this.queue]
		this.queue.length = 0

		if (cancelActive) {
			const activeItems = Array.from(this.activeRetries.values())
			this.activeRetries.clear()
			clearedItems.push(...activeItems)
		}

		this.emit("queue-cleared", { items: clearedItems, cancelActive })
	}

	/**
	 * Get queue statistics
	 * @returns Queue statistics
	 */
	getStatistics(): {
		totalQueued: number
		totalProcessed: number
		totalCancelled: number
		averageProcessingTime: number
		successRate: number
		byTool: Record<
			string,
			{
				queued: number
				processed: number
				cancelled: number
				averageTime: number
			}
		>
	} {
		// This would require tracking historical data
		// For now, return basic statistics
		return {
			totalQueued: this.queue.length + this.activeRetries.size,
			totalProcessed: 0, // TODO: Track processed items
			totalCancelled: 0, // TODO: Track cancelled items
			averageProcessingTime: 0,
			successRate: 0,
			byTool: {},
		}
	}

	/**
	 * Start processing the queue
	 */
	private startProcessing(): void {
		if (this.isProcessing) {
			return
		}

		this.isProcessing = true
		this.processQueue()
	}

	/**
	 * Stop processing the queue
	 */
	private stopProcessing(): void {
		this.isProcessing = false
		if (this.processingInterval) {
			clearTimeout(this.processingInterval)
			this.processingInterval = undefined
		}
	}

	/**
	 * Process items in the queue
	 */
	private async processQueue(): Promise<void> {
		if (!this.isProcessing) {
			return
		}

		// Process as many items as concurrency allows
		while (this.queue.length > 0 && this.activeRetries.size < this.maxConcurrentRetries && this.isProcessing) {
			const item = this.queue.shift()
			if (!item) {
				break
			}

			// Move to active retries
			this.activeRetries.set(item.id, item)
			this.emit("item-started", item)

			// Execute item with timeout handling
			this.executeItem(item)
		}

		// Schedule next processing cycle if there are still items
		if (this.isProcessing && (this.queue.length > 0 || this.activeRetries.size > 0)) {
			this.processingInterval = setTimeout(() => {
				this.processQueue()
			}, 100) // Process every 100ms
		} else {
			this.stopProcessing()
		}
	}

	/**
	 * Execute a queue item with timeout handling
	 * @param item - Queue item to execute
	 */
	private async executeItem(item: RetryQueueItem): Promise<void> {
		const startTime = Date.now()

		try {
			let executionPromise: Promise<any>

			// Add timeout if specified
			if (item.timeout && item.timeout > 0) {
				executionPromise = Promise.race([
					item.execute(),
					new Promise((_, reject) =>
						setTimeout(() => reject(new Error(`Retry timeout after ${item.timeout}ms`)), item.timeout),
					),
				])
			} else {
				executionPromise = item.execute()
			}

			const result = await executionPromise
			const duration = Date.now() - startTime

			// Remove from active retries
			this.activeRetries.delete(item.id)

			// Emit success event
			this.emit("item-completed", {
				item,
				result,
				duration,
				success: true,
			})
		} catch (error) {
			const duration = Date.now() - startTime

			// Remove from active retries
			this.activeRetries.delete(item.id)

			// Emit failure event
			this.emit("item-completed", {
				item,
				error: error as Error,
				duration,
				success: false,
			})
		}

		// Continue processing
		if (this.isProcessing) {
			setImmediate(() => this.processQueue())
		}
	}

	/**
	 * Generate unique item ID
	 * @returns Unique ID
	 */
	private generateItemId(): string {
		return `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
	}

	/**
	 * Dispose of queue resources
	 */
	dispose(): void {
		this.stopProcessing()
		this.queue.length = 0
		this.activeRetries.clear()
		this.removeAllListeners()
	}
}
