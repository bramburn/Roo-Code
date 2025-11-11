import { performance } from "perf_hooks"

/**
 * Performance metrics for tool execution
 */
export interface ToolExecutionMetrics {
	toolName: string
	executionId: string
	startTime: number
	endTime: number
	duration: number
	success: boolean
	error?: string
	inputSize: number
	outputSize: number
	memoryUsage?: number
	cpuUsage?: number
	metadata?: Record<string, any>
}

/**
 * Aggregated performance statistics
 */
export interface ToolPerformanceStats {
	toolName: string
	totalExecutions: number
	successfulExecutions: number
	failedExecutions: number
	totalDuration: number
	averageDuration: number
	minDuration: number
	maxDuration: number
	successRate: number
	averageInputSize: number
	averageOutputSize: number
	lastExecuted: Date
	errorRate: number
	mostCommonError?: string
}

/**
 * Performance monitoring configuration
 */
export interface MonitoringConfig {
	enabled: boolean
	maxHistorySize: number
	memoryMonitoring: boolean
	cpuMonitoring: boolean
	autoCleanup: boolean
	cleanupInterval: number
	alertThresholds: {
		maxExecutionTime: number
		minSuccessRate: number
		maxErrorRate: number
		maxMemoryUsage: number
	}
	reporting: {
		enableRealTimeAlerts: boolean
		enablePeriodicReports: boolean
		reportInterval: number
		enableDetailedMetrics: boolean
	}
}

/**
 * Tool performance monitoring system
 */
export class ToolPerformanceMonitor {
	private metrics: Map<string, ToolExecutionMetrics[]> = new Map()
	private aggregatedStats: Map<string, ToolPerformanceStats> = new Map()
	private config: MonitoringConfig
	private alertCallbacks: Map<string, (metrics: ToolExecutionMetrics) => void> = new Map()
	private cleanupInterval: NodeJS.Timeout | null = null

	constructor(config: Partial<MonitoringConfig> = {}) {
		this.config = {
			enabled: true,
			maxHistorySize: 1000,
			memoryMonitoring: true,
			cpuMonitoring: false, // CPU monitoring can be expensive
			autoCleanup: true,
			cleanupInterval: 300000, // 5 minutes
			alertThresholds: {
				maxExecutionTime: 30000, // 30 seconds
				minSuccessRate: 0.8, // 80%
				maxErrorRate: 0.2, // 20%
				maxMemoryUsage: 100 * 1024 * 1024, // 100MB
			},
			reporting: {
				enableRealTimeAlerts: true,
				enablePeriodicReports: false,
				reportInterval: 60000, // 1 minute
				enableDetailedMetrics: true,
			},
			...config,
		}

		if (this.config.autoCleanup) {
			this.startCleanupProcess()
		}
	}

	/**
	 * Start monitoring tool execution
	 */
	startExecution(toolName: string, metadata?: Record<string, any>): string {
		if (!this.config.enabled) {
			return "no_monitoring"
		}

		const executionId = this.generateExecutionId()
		const startTime = performance.now()

		const metrics: ToolExecutionMetrics = {
			toolName,
			executionId,
			startTime,
			endTime: 0,
			duration: 0,
			success: false,
			inputSize: 0,
			outputSize: 0,
			metadata,
		}

		// Add to metrics history
		if (!this.metrics.has(toolName)) {
			this.metrics.set(toolName, [])
		}
		const toolMetrics = this.metrics.get(toolName)!
		toolMetrics.push(metrics)

		// Enforce history size limit
		if (toolMetrics.length > this.config.maxHistorySize) {
			toolMetrics.shift()
		}

		// Get initial memory usage if enabled
		if (this.config.memoryMonitoring) {
			metrics.memoryUsage = this.getCurrentMemoryUsage()
		}

		return executionId
	}

	/**
	 * Complete monitoring for a tool execution
	 */
	endExecution(
		executionId: string,
		success: boolean,
		result?: string,
		error?: string,
		inputSize?: number,
		outputSize?: number,
	): void {
		if (!this.config.enabled) {
			return
		}

		// Find the metrics record
		let foundMetrics: ToolExecutionMetrics | null = null
		for (const toolMetrics of this.metrics.values()) {
			const index = toolMetrics.findIndex((m) => m.executionId === executionId)
			if (index !== -1) {
				foundMetrics = toolMetrics[index]
				break
			}
		}

		if (!foundMetrics) {
			// This can happen if monitoring was disabled when execution started
			return
		}

		const endTime = performance.now()
		foundMetrics.endTime = endTime
		foundMetrics.duration = endTime - foundMetrics.startTime
		foundMetrics.success = success
		foundMetrics.error = error
		foundMetrics.inputSize = inputSize || 0
		foundMetrics.outputSize = outputSize || (result ? result.length : 0)

		// Update aggregated statistics
		this.updateAggregatedStats(foundMetrics)

		// Check for performance alerts
		if (this.config.reporting.enableRealTimeAlerts) {
			this.checkForAlerts(foundMetrics)
		}
	}

	/**
	 * Get performance metrics for a specific tool
	 */
	getMetrics(toolName: string): ToolExecutionMetrics[] {
		return this.metrics.get(toolName) || []
	}

	/**
	 * Get aggregated statistics for a tool
	 */
	getStats(toolName: string): ToolPerformanceStats | undefined {
		return this.aggregatedStats.get(toolName)
	}

	/**
	 * Get performance statistics for all tools
	 */
	getAllStats(): ToolPerformanceStats[] {
		return Array.from(this.aggregatedStats.values())
	}

	/**
	 * Get top performers by various metrics
	 */
	getTopPerformers(): {
		fastestExecution: ToolPerformanceStats[]
		mostReliable: ToolPerformanceStats[]
		mostUsed: ToolPerformanceStats[]
	} {
		const allStats = this.getAllStats()

		return {
			fastestExecution: allStats
				.filter((stats) => stats.totalExecutions > 0)
				.sort((a, b) => a.averageDuration - b.averageDuration)
				.slice(0, 10),
			mostReliable: allStats
				.filter((stats) => stats.totalExecutions > 0)
				.sort((a, b) => b.successRate - a.successRate)
				.slice(0, 10),
			mostUsed: allStats.sort((a, b) => b.totalExecutions - a.totalExecutions).slice(0, 10),
		}
	}

	/**
	 * Get performance summary report
	 */
	getPerformanceReport(): {
		summary: {
			totalTools: number
			totalExecutions: number
			overallSuccessRate: number
			averageExecutionTime: number
			totalErrors: number
			averageMemoryUsage: number
		}
		tools: ToolPerformanceStats[]
		alerts: string[]
		trends: {
			improving: string[]
			degrading: string[]
			stable: string[]
		}
	} {
		const allStats = this.getAllStats()
		const totalExecutions = allStats.reduce((sum, stats) => sum + stats.totalExecutions, 0)
		const totalSuccessful = allStats.reduce((sum, stats) => sum + stats.successfulExecutions, 0)
		const totalDuration = allStats.reduce((sum, stats) => sum + stats.totalDuration, 0)

		const alerts: string[] = []

		// Check for performance alerts
		for (const stats of allStats) {
			if (stats.averageDuration > this.config.alertThresholds.maxExecutionTime) {
				alerts.push(
					`${stats.toolName}: Average execution time (${stats.averageDuration.toFixed(2)}ms) exceeds threshold`,
				)
			}

			if (stats.successRate < this.config.alertThresholds.minSuccessRate) {
				alerts.push(
					`${stats.toolName}: Success rate (${(stats.successRate * 100).toFixed(1)}%) below threshold`,
				)
			}

			if (stats.failedExecutions / stats.totalExecutions > this.config.alertThresholds.maxErrorRate) {
				alerts.push(
					`${stats.toolName}: Error rate (${((stats.failedExecutions / stats.totalExecutions) * 100).toFixed(1)}%) exceeds threshold`,
				)
			}
		}

		// Analyze trends
		const trends = this.analyzeTrends()

		return {
			summary: {
				totalTools: allStats.length,
				totalExecutions,
				overallSuccessRate: totalExecutions > 0 ? (totalSuccessful / totalExecutions) * 100 : 0,
				averageExecutionTime: totalExecutions > 0 ? totalDuration / totalExecutions : 0,
				totalErrors: totalExecutions - totalSuccessful,
				averageMemoryUsage: this.getAverageMemoryUsage(),
			},
			tools: allStats,
			alerts,
			trends,
		}
	}

	/**
	 * Register alert callback
	 */
	registerAlertCallback(toolName: string, callback: (metrics: ToolExecutionMetrics) => void): void {
		this.alertCallbacks.set(toolName, callback)
	}

	/**
	 * Unregister alert callback
	 */
	unregisterAlertCallback(toolName: string): void {
		this.alertCallbacks.delete(toolName)
	}

	/**
	 * Clear all metrics and statistics
	 */
	clearAll(): void {
		this.metrics.clear()
		this.aggregatedStats.clear()
	}

	/**
	 * Clear metrics for a specific tool
	 */
	clearTool(toolName: string): void {
		this.metrics.delete(toolName)
		this.aggregatedStats.delete(toolName)
	}

	/**
	 * Export metrics data
	 */
	exportData(): {
		metrics: Record<string, ToolExecutionMetrics[]>
		stats: Record<string, ToolPerformanceStats>
		config: MonitoringConfig
		exportTime: string
		version: string
	} {
		const metricsData: Record<string, ToolExecutionMetrics[]> = {}
		const statsData: Record<string, ToolPerformanceStats> = {}

		for (const [toolName, metrics] of this.metrics.entries()) {
			metricsData[toolName] = metrics
		}

		for (const [toolName, stats] of this.aggregatedStats.entries()) {
			statsData[toolName] = stats
		}

		return {
			metrics: metricsData,
			stats: statsData,
			config: this.config,
			exportTime: new Date().toISOString(),
			version: "1.0.0",
		}
	}

	/**
	 * Import metrics data
	 */
	importData(data: {
		metrics: Record<string, ToolExecutionMetrics[]>
		stats?: Record<string, ToolPerformanceStats>
	}): void {
		// Clear existing data
		this.clearAll()

		// Import metrics
		for (const [toolName, metrics] of Object.entries(data.metrics)) {
			this.metrics.set(toolName, metrics)
		}

		// Import stats if provided
		if (data.stats) {
			for (const [toolName, stats] of Object.entries(data.stats)) {
				this.aggregatedStats.set(toolName, stats)
			}
		}
	}

	/**
	 * Update aggregated statistics
	 */
	private updateAggregatedStats(metrics: ToolExecutionMetrics): void {
		const existing = this.aggregatedStats.get(metrics.toolName)

		if (!existing) {
			this.aggregatedStats.set(metrics.toolName, {
				toolName: metrics.toolName,
				totalExecutions: 1,
				successfulExecutions: metrics.success ? 1 : 0,
				failedExecutions: metrics.success ? 0 : 1,
				totalDuration: metrics.duration,
				averageDuration: metrics.duration,
				minDuration: metrics.duration,
				maxDuration: metrics.duration,
				successRate: metrics.success ? 100 : 0,
				averageInputSize: metrics.inputSize,
				averageOutputSize: metrics.outputSize,
				lastExecuted: new Date(),
				errorRate: metrics.success ? 0 : 100,
			})
			return
		}

		// Update existing stats
		existing.totalExecutions++
		existing.totalDuration += metrics.duration
		existing.minDuration = Math.min(existing.minDuration, metrics.duration)
		existing.maxDuration = Math.max(existing.maxDuration, metrics.duration)
		existing.lastExecuted = new Date()

		if (metrics.success) {
			existing.successfulExecutions++
		} else {
			existing.failedExecutions++
		}

		existing.averageDuration = existing.totalDuration / existing.totalExecutions
		existing.successRate = (existing.successfulExecutions / existing.totalExecutions) * 100
		existing.errorRate = 100 - existing.successRate

		// Update average sizes
		const totalInputSize = existing.averageInputSize * (existing.totalExecutions - 1) + metrics.inputSize
		const totalOutputSize = existing.averageOutputSize * (existing.totalExecutions - 1) + metrics.outputSize
		existing.averageInputSize = totalInputSize / existing.totalExecutions
		existing.averageOutputSize = totalOutputSize / existing.totalExecutions
	}

	/**
	 * Check for performance alerts
	 */
	private checkForAlerts(metrics: ToolExecutionMetrics): void {
		const callbacks = this.alertCallbacks.get(metrics.toolName)
		if (callbacks) {
			callbacks.forEach((callback) => callback(metrics))
		}

		// Check threshold violations
		if (metrics.duration > this.config.alertThresholds.maxExecutionTime) {
			console.warn(
				`Performance Alert: ${metrics.toolName} execution time (${metrics.duration.toFixed(2)}ms) exceeds threshold (${this.config.alertThresholds.maxExecutionTime}ms)`,
			)
		}

		if (!metrics.success && metrics.error) {
			console.warn(`Error Alert: ${metrics.toolName} failed with error: ${metrics.error}`)
		}
	}

	/**
	 * Analyze performance trends
	 */
	private analyzeTrends(): {
		improving: string[]
		degrading: string[]
		stable: string[]
	} {
		const trends = { improving: [], degrading: [], stable: [] }
		const allStats = this.getAllStats()

		// Simple trend analysis based on recent vs historical performance
		for (const stats of allStats) {
			const recentMetrics = this.getMetrics(stats.toolName)
			if (recentMetrics.length >= 10) {
				const recentAvgDuration = recentMetrics.slice(-10).reduce((sum, m) => sum + m.duration, 0) / 10

				const historicalAvgDuration = stats.averageDuration
				const improvement = ((historicalAvgDuration - recentAvgDuration) / historicalAvgDuration) * 100

				if (improvement > 10) {
					trends.improving.push(`${stats.toolName} (${improvement.toFixed(1)}% faster)`)
				} else if (improvement < -10) {
					trends.degrading.push(`${stats.toolName} (${Math.abs(improvement).toFixed(1)}% slower)`)
				} else {
					trends.stable.push(`${stats.toolName} (stable performance)`)
				}
			}
		}

		return trends
	}

	/**
	 * Generate unique execution ID
	 */
	private generateExecutionId(): string {
		return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
	}

	/**
	 * Get current memory usage
	 */
	private getCurrentMemoryUsage(): number {
		if (typeof process !== "undefined" && process.memoryUsage) {
			return process.memoryUsage().heapUsed
		}
		return 0
	}

	/**
	 * Get average memory usage across all tools
	 */
	private getAverageMemoryUsage(): number {
		if (!this.config.memoryMonitoring) {
			return 0
		}

		const allStats = this.getAllStats()
		if (allStats.length === 0) {
			return 0
		}

		// This is a simplified calculation
		// In a real implementation, you might want to track actual memory usage per execution
		return this.getCurrentMemoryUsage()
	}

	/**
	 * Start automatic cleanup process
	 */
	private startCleanupProcess(): void {
		if (this.cleanupInterval) {
			clearInterval(this.cleanupInterval)
		}

		this.cleanupInterval = setInterval(() => {
			this.performCleanup()
		}, this.config.cleanupInterval)
	}

	/**
	 * Perform cleanup of old metrics
	 */
	private performCleanup(): void {
		const now = Date.now()
		const maxAge = this.config.cleanupInterval * 10 // Keep data for 10x cleanup interval

		for (const [toolName, metrics] of this.metrics.entries()) {
			const originalLength = metrics.length
			// Keep only recent metrics
			const filtered = metrics.filter((m) => now - m.endTime < maxAge)
			this.metrics.set(toolName, filtered)

			// Update aggregated stats if data was removed
			if (filtered.length < originalLength) {
				this.recalculateStats(toolName, filtered)
			}
		}
	}

	/**
	 * Recalculate aggregated stats from metrics
	 */
	private recalculateStats(toolName: string, metrics: ToolExecutionMetrics[]): void {
		if (metrics.length === 0) {
			this.aggregatedStats.delete(toolName)
			return
		}

		const stats: ToolPerformanceStats = {
			toolName,
			totalExecutions: metrics.length,
			successfulExecutions: metrics.filter((m) => m.success).length,
			failedExecutions: metrics.filter((m) => !m.success).length,
			totalDuration: metrics.reduce((sum, m) => sum + m.duration, 0),
			averageDuration: 0,
			minDuration: Infinity,
			maxDuration: 0,
			successRate: 0,
			averageInputSize: 0,
			averageOutputSize: 0,
			lastExecuted: new Date(),
			errorRate: 0,
		}

		stats.averageDuration = stats.totalDuration / stats.totalExecutions
		stats.minDuration = Math.min(...metrics.map((m) => m.duration))
		stats.maxDuration = Math.max(...metrics.map((m) => m.duration))
		stats.successRate = (stats.successfulExecutions / stats.totalExecutions) * 100
		stats.errorRate = 100 - stats.successRate
		stats.averageInputSize = metrics.reduce((sum, m) => sum + m.inputSize, 0) / stats.totalExecutions
		stats.averageOutputSize = metrics.reduce((sum, m) => sum + m.outputSize, 0) / stats.totalExecutions
		stats.lastExecuted = new Date(Math.max(...metrics.map((m) => m.endTime)))

		this.aggregatedStats.set(toolName, stats)
	}

	/**
	 * Cleanup resources
	 */
	destroy(): void {
		if (this.cleanupInterval) {
			clearInterval(this.cleanupInterval)
			this.cleanupInterval = null
		}

		this.clearAll()
		this.alertCallbacks.clear()
	}
}

// Global performance monitor instance
export const globalToolPerformanceMonitor = new ToolPerformanceMonitor()
