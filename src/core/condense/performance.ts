import { EventEmitter } from "events"
import * as fs from "fs/promises"
import * as path from "path"

/**
 * Custom metric value types
 */
export type CustomMetricValue = string | number | boolean | null | undefined

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
	operationName: string
	startTime: number
	endTime?: number
	duration?: number
	memoryUsage?: NodeJS.MemoryUsage
	cpuUsage?: NodeJS.CpuUsage
	diskIO?: {
		bytesRead: number
		bytesWritten: number
	}
	networkIO?: {
		bytesReceived: number
		bytesSent: number
	}
	customMetrics?: Record<string, CustomMetricValue>
}

/**
 * Performance threshold configuration
 */
export interface PerformanceThresholds {
	maxOperationDuration: number // in milliseconds
	maxMemoryUsage: number // in MB
	maxCpuUsage: number // in percentage
	maxDiskIO: number // in MB per second
	maxNetworkIO: number // in MB per second
}

/**
 * Performance optimization options
 */
export interface PerformanceOptions {
	enableCaching: boolean
	enableLazyLoading: boolean
	enableBatching: boolean
	enableCompression: boolean
	enableParallelProcessing: boolean
	maxConcurrentOperations: number
	cacheSize: number
	batchSize: number
	compressionLevel: number
}

/**
 * Performance cache entry
 */
interface CacheEntry<T = unknown> {
	data: T
	timestamp: number
	accessCount: number
	lastAccessed: number
	size: number
}

/**
 * Performance batch operation
 */
interface BatchOperation<T = unknown> {
	id: string
	operation: () => Promise<T>
	priority: "low" | "medium" | "high"
	resolve: (value: T) => void
	reject: (error: Error) => void
}

/**
 * Performance monitoring and optimization system
 * Provides caching, batching, lazy loading, and performance monitoring
 */
export class PerformanceManager extends EventEmitter {
	private readonly options: PerformanceOptions
	private readonly thresholds: PerformanceThresholds
	private readonly cache = new Map<string, CacheEntry<Record<string, unknown>>>()
	private readonly batchQueues = new Map<string, BatchOperation[]>()
	private readonly activeOperations = new Map<string, PerformanceMetrics>()
	private readonly performanceHistory: PerformanceMetrics[] = []

	private batchTimers = new Map<string, NodeJS.Timeout>()
	private isProcessing = false
	private initialMemoryUsage: NodeJS.MemoryUsage

	constructor(options: Partial<PerformanceOptions> = {}, thresholds: Partial<PerformanceThresholds> = {}) {
		super()

		this.options = {
			enableCaching: true,
			enableLazyLoading: true,
			enableBatching: true,
			enableCompression: true,
			enableParallelProcessing: true,
			maxConcurrentOperations: 3,
			cacheSize: 100,
			batchSize: 10,
			compressionLevel: 6,
			...options,
		}

		this.thresholds = {
			maxOperationDuration: 5000, // 5 seconds
			maxMemoryUsage: 512, // 512 MB
			maxCpuUsage: 80, // 80%
			maxDiskIO: 100, // 100 MB/s
			maxNetworkIO: 10, // 10 MB/s
			...thresholds,
		}

		this.initialMemoryUsage = process.memoryUsage()

		// Start performance monitoring
		this.startPerformanceMonitoring()
	}

	/**
	 * Start monitoring performance metrics
	 */
	private startPerformanceMonitoring(): void {
		setInterval(() => {
			this.checkPerformanceThresholds()
			this.cleanupCache()
		}, 10000) // Check every 10 seconds
	}

	/**
	 * Start timing an operation
	 */
	startOperation(operationName: string, customData?: Record<string, CustomMetricValue>): string {
		const operationId = `${operationName}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`

		const metrics: PerformanceMetrics = {
			operationName,
			startTime: performance.now(),
			memoryUsage: process.memoryUsage(),
			cpuUsage: process.cpuUsage(),
			customMetrics: customData,
		}

		this.activeOperations.set(operationId, metrics)
		this.emit("operationStarted", { operationId, operationName, metrics })

		return operationId
	}

	/**
	 * End timing an operation
	 */
	endOperation(operationId: string, customData?: Record<string, CustomMetricValue>): PerformanceMetrics | null {
		const metrics = this.activeOperations.get(operationId)
		if (!metrics) return null

		metrics.endTime = performance.now()
		metrics.duration = metrics.endTime - metrics.startTime

		// Calculate resource usage
		const currentMemory = process.memoryUsage()
		const currentCpu = process.cpuUsage(metrics.cpuUsage)

		metrics.memoryUsage = currentMemory
		metrics.cpuUsage = currentCpu

		if (customData) {
			metrics.customMetrics = { ...metrics.customMetrics, ...customData }
		}

		this.activeOperations.delete(operationId)
		this.performanceHistory.push(metrics)

		// Keep only last 1000 operations
		if (this.performanceHistory.length > 1000) {
			const removeCount = this.performanceHistory.length - 1000
			this.performanceHistory.splice(0, removeCount)
		}

		this.emit("operationCompleted", { operationId, metrics })
		this.checkOperationThresholds(metrics)

		return metrics
	}

	/**
	 * Execute operation with performance monitoring
	 */
	async executeOperation<T>(
		operationName: string,
		operation: () => Promise<T>,
		options?: {
			cacheKey?: string
			cacheTTL?: number
			batchGroup?: string
			priority?: "low" | "medium" | "high"
		},
	): Promise<T> {
		const { cacheKey, cacheTTL = 300000, batchGroup, priority = "medium" } = options || {}

		// Check cache first
		if (cacheKey && this.options.enableCaching) {
			const cached = this.getFromCache<T>(cacheKey, cacheTTL)
			if (cached !== null) {
				this.emit("cacheHit", { operationName, cacheKey })
				return cached
			}
		}

		// Use batching if enabled
		if (batchGroup && this.options.enableBatching) {
			return this.executeBatched<T>(operationName, operation, batchGroup, priority)
		}

		// Execute operation directly
		const operationId = this.startOperation(operationName, { cacheKey, batchGroup, priority })

		try {
			const result = await operation()

			// Cache result if applicable
			if (cacheKey && this.options.enableCaching) {
				this.setCache(cacheKey, result)
			}

			this.endOperation(operationId, { success: true })
			return result
		} catch (error) {
			this.endOperation(operationId, { success: false, error: (error as Error).message })
			throw error
		}
	}

	/**
	 * Execute operation in batch
	 */
	private async executeBatched<T>(
		operationName: string,
		operation: () => Promise<T>,
		batchGroup: string,
		priority: "low" | "medium" | "high",
	): Promise<T> {
		return new Promise((resolve, reject) => {
			const batchOperation: BatchOperation<T> = {
				id: `${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
				operation,
				priority,
				resolve,
				reject,
			}

			// Add to batch queue
			if (!this.batchQueues.has(batchGroup)) {
				this.batchQueues.set(batchGroup, [])
			}

			const queue = this.batchQueues.get(batchGroup)!
			queue.push(batchOperation as BatchOperation<any>)

			// Sort by priority
			queue.sort((a, b) => {
				const priorityOrder = { high: 3, medium: 2, low: 1 }
				return priorityOrder[b.priority] - priorityOrder[a.priority]
			})

			// Schedule batch processing
			this.scheduleBatchProcessing(batchGroup)
		})
	}

	/**
	 * Schedule batch processing
	 */
	private scheduleBatchProcessing(batchGroup: string): void {
		if (this.batchTimers.has(batchGroup)) {
			return // Already scheduled
		}

		const timer = setTimeout(() => {
			this.processBatch(batchGroup)
		}, 100) // Process batch after 100ms

		this.batchTimers.set(batchGroup, timer)
	}

	/**
	 * Process batch
	 */
	private async processBatch(batchGroup: string): Promise<void> {
		const queue = this.batchQueues.get(batchGroup)
		if (!queue || queue.length === 0) {
			this.batchTimers.delete(batchGroup)
			return
		}

		const batch = queue.splice(0, Math.min(this.options.batchSize, queue.length))
		this.batchTimers.delete(batchGroup)

		const operationId = this.startOperation(`batch_${batchGroup}`, { batchSize: batch.length })

		try {
			// Execute operations in parallel if enabled
			if (this.options.enableParallelProcessing) {
				const promises = batch.map(async (batchOp) => {
					try {
						const result = await batchOp.operation()
						batchOp.resolve(result)
						return { success: true, result }
					} catch (error) {
						batchOp.reject(error as Error)
						return { success: false, error }
					}
				})

				await Promise.allSettled(promises)
			} else {
				// Execute sequentially
				for (const batchOp of batch) {
					try {
						const result = await batchOp.operation()
						batchOp.resolve(result)
					} catch (error) {
						batchOp.reject(error as Error)
					}
				}
			}

			this.endOperation(operationId, { success: true, processedCount: batch.length })
		} catch (error) {
			this.endOperation(operationId, { success: false, error: (error as Error).message })
		}

		// Schedule next batch if there are more items
		if (queue.length > 0) {
			this.scheduleBatchProcessing(batchGroup)
		}
	}

	/**
	 * Get value from cache
	 */
	getFromCache<T>(key: string, ttl: number = 300000): T | null {
		if (!this.options.enableCaching) return null

		const entry = this.cache.get(key)
		if (!entry) return null

		// Check if expired
		if (Date.now() - entry.timestamp > ttl) {
			this.cache.delete(key)
			return null
		}

		// Update access info
		entry.accessCount++
		entry.lastAccessed = Date.now()

		this.emit("cacheAccess", { key, hit: true })
		return entry.data as T
	}

	/**
	 * Set value in cache
	 */
	setCache<T>(key: string, data: T): void {
		if (!this.options.enableCaching) return

		// Check cache size limit
		if (this.cache.size >= this.options.cacheSize) {
			this.evictLeastRecentlyUsed()
		}

		const entry: CacheEntry<T> = {
			data,
			timestamp: Date.now(),
			accessCount: 1,
			lastAccessed: Date.now(),
			size: this.estimateSize(data),
		}

		this.cache.set(key, entry as CacheEntry<any>)
		this.emit("cacheSet", { key, size: entry.size })
	}

	/**
	 * Evict least recently used cache entries
	 */
	private evictLeastRecentlyUsed(): void {
		let oldestKey = ""
		let oldestTime = Date.now()

		for (const [key, entry] of this.cache.entries()) {
			if (entry.lastAccessed < oldestTime) {
				oldestTime = entry.lastAccessed
				oldestKey = key
			}
		}

		if (oldestKey) {
			this.cache.delete(oldestKey)
			this.emit("cacheEviction", { key: oldestKey })
		}
	}

	/**
	 * Clean up expired cache entries
	 */
	private cleanupCache(): void {
		const now = Date.now()
		const expiredKeys: string[] = []

		for (const [key, entry] of this.cache.entries()) {
			if (now - entry.timestamp > 300000) {
				// 5 minutes TTL
				expiredKeys.push(key)
			}
		}

		for (const key of expiredKeys) {
			this.cache.delete(key)
			this.emit("cacheEviction", { key, reason: "expired" })
		}
	}

	/**
	 * Estimate size of data for cache management
	 */
	private estimateSize(data: unknown): number {
		if (data === null || data === undefined) return 0
		if (typeof data === "string") return data.length * 2 // UTF-16
		if (typeof data === "number") return 8
		if (typeof data === "boolean") return 4
		if (typeof data === "object") {
			try {
				return JSON.stringify(data).length * 2
			} catch {
				return 1024 // Default size for objects
			}
		}
		return 1024 // Default size
	}

	/**
	 * Check performance thresholds
	 */
	private checkPerformanceThresholds(): void {
		const currentMemory = process.memoryUsage()
		const memoryUsageMB = currentMemory.heapUsed / 1024 / 1024

		if (memoryUsageMB > this.thresholds.maxMemoryUsage) {
			this.emit("thresholdExceeded", {
				type: "memory",
				current: memoryUsageMB,
				threshold: this.thresholds.maxMemoryUsage,
			})
		}

		// Check active operations
		for (const [operationId, metrics] of this.activeOperations.entries()) {
			const duration = performance.now() - metrics.startTime
			if (duration > this.thresholds.maxOperationDuration) {
				this.emit("thresholdExceeded", {
					type: "operation_duration",
					operationId,
					operationName: metrics.operationName,
					current: duration,
					threshold: this.thresholds.maxOperationDuration,
				})
			}
		}
	}

	/**
	 * Check operation-specific thresholds
	 */
	private checkOperationThresholds(metrics: PerformanceMetrics): void {
		if (metrics.duration && metrics.duration > this.thresholds.maxOperationDuration) {
			this.emit("performanceWarning", {
				type: "slow_operation",
				operationName: metrics.operationName,
				duration: metrics.duration,
				threshold: this.thresholds.maxOperationDuration,
			})
		}

		if (metrics.memoryUsage) {
			const memoryMB = metrics.memoryUsage.heapUsed / 1024 / 1024
			if (memoryMB > this.thresholds.maxMemoryUsage) {
				this.emit("performanceWarning", {
					type: "high_memory",
					operationName: metrics.operationName,
					memoryUsage: memoryMB,
					threshold: this.thresholds.maxMemoryUsage,
				})
			}
		}
	}

	/**
	 * Get performance statistics
	 */
	getPerformanceStats(): {
		operations: {
			total: number
			averageDuration: number
			slowOperations: number
			failedOperations: number
		}
		cache: {
			size: number
			hitRate: number
			totalAccesses: number
		}
		memory: {
			current: NodeJS.MemoryUsage
			peak: NodeJS.MemoryUsage
			initial: NodeJS.MemoryUsage
		}
	} {
		const completedOperations = this.performanceHistory.filter((m) => m.duration !== undefined)
		const slowOperations = completedOperations.filter(
			(m) => m.duration !== undefined && m.duration > this.thresholds.maxOperationDuration,
		)
		const failedOperations = completedOperations.filter((m) => m.customMetrics?.success === false)

		const averageDuration =
			completedOperations.length > 0
				? completedOperations.reduce((sum, m) => sum + (m.duration ?? 0), 0) / completedOperations.length
				: 0

		const currentMemory = process.memoryUsage()
		const peakMemory = this.performanceHistory.reduce((peak, m) => {
			if (!m.memoryUsage?.heapUsed) return peak
			return m.memoryUsage.heapUsed > peak.heapUsed ? m.memoryUsage : peak
		}, this.initialMemoryUsage)

		// Calculate cache statistics
		let totalAccesses = 0
		let cacheHits = 0

		for (const entry of this.cache.values()) {
			totalAccesses += entry.accessCount
			cacheHits += Math.max(0, entry.accessCount - 1) // First access is a miss, ensure non-negative
		}

		const hitRate = totalAccesses > 0 ? (cacheHits / totalAccesses) * 100 : 0

		return {
			operations: {
				total: this.performanceHistory.length,
				averageDuration,
				slowOperations: slowOperations.length,
				failedOperations: failedOperations.length,
			},
			cache: {
				size: this.cache.size,
				hitRate,
				totalAccesses,
			},
			memory: {
				current: currentMemory,
				peak: peakMemory,
				initial: this.initialMemoryUsage,
			},
		}
	}

	/**
	 * Optimize performance based on current metrics
	 */
	optimizePerformance(): void {
		const stats = this.getPerformanceStats()

		// Clear cache if hit rate is low
		if (stats.cache.hitRate < 50 && stats.cache.size > 50) {
			this.cache.clear()
			this.emit("optimization", { type: "cache_cleared", reason: "low_hit_rate" })
		}

		// Suggest garbage collection if memory usage is high
		if (stats.memory.current.heapUsed > this.thresholds.maxMemoryUsage * 0.8) {
			if (global.gc) {
				global.gc()
				this.emit("optimization", { type: "garbage_collected", reason: "high_memory" })
			}
		}

		// Reduce batch size if operations are slow
		if (stats.operations.averageDuration > this.thresholds.maxOperationDuration * 0.8) {
			this.options.batchSize = Math.max(1, Math.floor(this.options.batchSize * 0.8))
			this.emit("optimization", {
				type: "batch_size_reduced",
				reason: "slow_operations",
				newBatchSize: this.options.batchSize,
			})
		}
	}

	/**
	 * Clear all performance data
	 */
	clearPerformanceData(): void {
		this.performanceHistory.length = 0
		this.cache.clear()
		this.activeOperations.clear()
		this.batchQueues.clear()

		for (const timer of this.batchTimers.values()) {
			clearTimeout(timer)
		}
		this.batchTimers.clear()

		this.emit("dataCleared")
	}

	/**
	 * Dispose of performance manager
	 */
	dispose(): void {
		this.clearPerformanceData()
		this.removeAllListeners()
	}
}

export default PerformanceManager
