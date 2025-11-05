import { EventEmitter } from "events"
import { PerformanceManager, type PerformanceMetrics } from "./performance"

/**
 * Performance event data types
 */
interface OperationCompletedEvent {
	metrics: PerformanceMetrics
}

interface PerformanceWarningEvent {
	type: string
	metrics?: Partial<PerformanceMetrics>
	threshold?: number
	currentValue?: number
	operationName?: string
	duration?: number
	memoryUsage?: number
}

interface ThresholdExceededEvent {
	type: string
	current: number
	threshold: number
	operationId?: string
	operationName?: string
}

interface CacheHitEvent {
	[key: string]: unknown
}

interface CacheAccessEvent {
	hit: boolean
}

/**
 * Performance alert levels
 */
export type AlertLevel = "info" | "warning" | "critical"

/**
 * Performance alert configuration
 */
export interface PerformanceAlert {
	id: string
	level: AlertLevel
	type: string
	message: string
	timestamp: number
	metrics: Partial<PerformanceMetrics>
	threshold: number
	currentValue: number
	resolved?: boolean
	resolvedAt?: number
}

/**
 * Performance trend data
 */
export interface PerformanceTrend {
	metric: string
	values: number[]
	timestamps: number[]
	trend: "improving" | "degrading" | "stable"
	averageChange: number
	prediction?: number
}

/**
 * Performance monitoring configuration
 */
export interface MonitoringConfig {
	enableRealTimeMonitoring: boolean
	enableTrendAnalysis: boolean
	enableAlerts: boolean
	enablePredictions: boolean
	monitoringInterval: number // in milliseconds
	trendWindowSize: number // number of data points for trend analysis
	alertThresholds: {
		slowOperationThreshold: number
		memoryUsageThreshold: number
		errorRateThreshold: number
		cacheHitRateThreshold: number
	}
}

/**
 * Performance report data
 */
export interface PerformanceReport {
	generatedAt: number
	timeRange: {
		start: number
		end: number
		duration: number
	}
	summary: {
		totalOperations: number
		successfulOperations: number
		failedOperations: number
		averageDuration: number
		slowOperations: number
		errorRate: number
	}
	metrics: {
		operations: PerformanceMetrics[]
		alerts: PerformanceAlert[]
		trends: PerformanceTrend[]
	}
	recommendations: string[]
}

/**
 * Performance Monitoring System
 * Provides comprehensive monitoring, alerting, and analysis of performance metrics
 */
export class PerformanceMonitor extends EventEmitter {
	private readonly performanceManager: PerformanceManager
	private readonly config: MonitoringConfig
	private readonly alerts: PerformanceAlert[] = []
	private readonly trends = new Map<string, PerformanceTrend>()
	private monitoringInterval?: NodeJS.Timeout
	private isMonitoring = false

	constructor(performanceManager: PerformanceManager, config: Partial<MonitoringConfig> = {}) {
		super()

		this.performanceManager = performanceManager
		this.config = {
			enableRealTimeMonitoring: true,
			enableTrendAnalysis: true,
			enableAlerts: true,
			enablePredictions: true,
			monitoringInterval: 5000, // 5 seconds
			trendWindowSize: 100,
			alertThresholds: {
				slowOperationThreshold: 3000, // 3 seconds
				memoryUsageThreshold: 400, // 400 MB
				errorRateThreshold: 10, // 10%
				cacheHitRateThreshold: 70, // 70%
			},
			...config,
		}

		this.setupEventListeners()
	}

	/**
	 * Setup event listeners for performance manager
	 */
	private setupEventListeners(): void {
		this.performanceManager.on("operationCompleted", (data: OperationCompletedEvent) => {
			this.handleOperationCompleted(data.metrics)
		})

		this.performanceManager.on("performanceWarning", (data: PerformanceWarningEvent) => {
			this.handlePerformanceWarning(data)
		})

		this.performanceManager.on("thresholdExceeded", (data: ThresholdExceededEvent) => {
			this.handleThresholdExceeded(data)
		})

		this.performanceManager.on("cacheHit", (_data: CacheHitEvent) => {
			this.updateTrend("cache_hit_rate", 1)
		})

		this.performanceManager.on("cacheAccess", (data: CacheAccessEvent) => {
			this.updateTrend("cache_hit_rate", data.hit ? 1 : 0)
		})
	}

	/**
	 * Start performance monitoring
	 */
	startMonitoring(): void {
		if (this.isMonitoring || !this.config.enableRealTimeMonitoring) return

		this.isMonitoring = true
		this.emit("monitoringStarted")

		// Start periodic monitoring
		this.monitoringInterval = setInterval(() => {
			this.performPeriodicCheck()
		}, this.config.monitoringInterval)

		// Start trend analysis
		if (this.config.enableTrendAnalysis) {
			this.startTrendAnalysis()
		}
	}

	/**
	 * Stop performance monitoring
	 */
	stopMonitoring(): void {
		if (!this.isMonitoring) return

		this.isMonitoring = false
		this.emit("monitoringStopped")

		if (this.monitoringInterval) {
			clearInterval(this.monitoringInterval)
			this.monitoringInterval = undefined
		}
	}

	/**
	 * Handle operation completion
	 */
	private handleOperationCompleted(metrics: PerformanceMetrics): void {
		if (!this.config.enableRealTimeMonitoring) return

		// Update trends
		this.updateTrend("operation_duration", metrics.duration ?? 0)
		this.updateTrend("memory_usage", metrics.memoryUsage?.heapUsed ?? 0)

		// Check for alerts
		if (this.config.enableAlerts) {
			this.checkForAlerts(metrics)
		}
	}

	/**
	 * Handle performance warning
	 */
	private handlePerformanceWarning(data: PerformanceWarningEvent): void {
		if (!this.config.enableAlerts) return

		const alert: PerformanceAlert = {
			id: `warning_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
			level: "warning",
			type: data.type,
			message: this.formatWarningMessage(data),
			timestamp: Date.now(),
			metrics: data.metrics || {},
			threshold: data.threshold || 0,
			currentValue: data.currentValue || 0,
		}

		this.addAlert(alert)
	}

	/**
	 * Handle threshold exceeded
	 */
	private handleThresholdExceeded(data: ThresholdExceededEvent): void {
		if (!this.config.enableAlerts) return

		const alert: PerformanceAlert = {
			id: `threshold_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
			level: "critical",
			type: data.type,
			message: this.formatThresholdMessage(data),
			timestamp: Date.now(),
			metrics: {},
			threshold: data.threshold,
			currentValue: data.current,
		}

		this.addAlert(alert)
	}

	/**
	 * Check for performance alerts
	 */
	private checkForAlerts(metrics: PerformanceMetrics): void {
		const { alertThresholds } = this.config

		// Check slow operations
		if (metrics.duration !== undefined && metrics.duration > alertThresholds.slowOperationThreshold) {
			const alert: PerformanceAlert = {
				id: `slow_op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
				level: "warning",
				type: "slow_operation",
				message: `Slow operation detected: ${metrics.operationName} took ${metrics.duration}ms`,
				timestamp: Date.now(),
				metrics,
				threshold: alertThresholds.slowOperationThreshold,
				currentValue: metrics.duration,
			}
			this.addAlert(alert)
		}

		// Check memory usage
		if (metrics.memoryUsage?.heapUsed !== undefined) {
			const memoryMB = metrics.memoryUsage.heapUsed / 1024 / 1024
			if (memoryMB > alertThresholds.memoryUsageThreshold) {
				const alert: PerformanceAlert = {
					id: `memory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
					level: "warning",
					type: "high_memory",
					message: `High memory usage: ${memoryMB.toFixed(1)}MB`,
					timestamp: Date.now(),
					metrics,
					threshold: alertThresholds.memoryUsageThreshold,
					currentValue: memoryMB,
				}
				this.addAlert(alert)
			}
		}
	}

	/**
	 * Update trend data
	 */
	private updateTrend(metric: string, value: number): void {
		if (!this.config.enableTrendAnalysis) return

		let trend = this.trends.get(metric)
		if (!trend) {
			trend = {
				metric,
				values: [],
				timestamps: [],
				trend: "stable",
				averageChange: 0,
			}
			this.trends.set(metric, trend)
		}

		// Add new data point
		trend.values.push(value)
		trend.timestamps.push(Date.now())

		// Keep only recent data points
		if (trend.values.length > this.config.trendWindowSize) {
			trend.values.shift()
			trend.timestamps.shift()
		}

		// Calculate trend
		this.calculateTrend(trend)
	}

	/**
	 * Calculate trend direction
	 */
	private calculateTrend(trend: PerformanceTrend): void {
		if (trend.values.length < 10) {
			trend.trend = "stable"
			return
		}

		// Calculate moving averages
		const recentValues = trend.values.slice(-10)
		const olderValues = trend.values.length >= 20 ? trend.values.slice(-20, -10) : []

		if (olderValues.length === 0) {
			trend.trend = "stable"
			return
		}

		const recentAvg = recentValues.reduce((sum, val) => sum + val, 0) / recentValues.length
		const olderAvg = olderValues.reduce((sum, val) => sum + val, 0) / olderValues.length

		const change = recentAvg - olderAvg
		const percentChange = olderAvg !== 0 ? (change / olderAvg) * 100 : 0

		trend.averageChange = percentChange

		// Determine trend direction
		if (Math.abs(percentChange) < 5) {
			trend.trend = "stable"
		} else if (percentChange > 0) {
			trend.trend = "degrading"
		} else {
			trend.trend = "improving"
		}

		// Simple prediction (linear extrapolation)
		if (this.config.enablePredictions && trend.values.length >= 20 && recentValues.length > 0) {
			const slope = this.calculateSlope(trend.values.slice(-20))
			const lastValue = recentValues[recentValues.length - 1]
			if (lastValue !== undefined) {
				trend.prediction = lastValue + slope * 10
			}
		}
	}

	/**
	 * Calculate slope for trend prediction
	 */
	private calculateSlope(values: number[]): number {
		const n = values.length
		if (n < 2) return 0

		const sumX = (n * (n - 1)) / 2 // Sum of indices
		const sumY = values.reduce((sum, val) => sum + val, 0)
		const sumXY = values.reduce((sum, val, index) => sum + val * index, 0)
		const sumX2 = values.reduce((sum, _, index) => sum + index * index, 0)

		const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
		return slope
	}

	/**
	 * Start trend analysis
	 */
	private startTrendAnalysis(): void {
		// This is already handled by updateTrend calls
	}

	/**
	 * Perform periodic health check
	 */
	private performPeriodicCheck(): void {
		const stats = this.performanceManager.getPerformanceStats()

		// Check error rate
		const errorRate =
			stats.operations.total > 0 ? (stats.operations.failedOperations / stats.operations.total) * 100 : 0

		if (errorRate > this.config.alertThresholds.errorRateThreshold) {
			const alert: PerformanceAlert = {
				id: `error_rate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
				level: "critical",
				type: "high_error_rate",
				message: `High error rate: ${errorRate.toFixed(1)}%`,
				timestamp: Date.now(),
				metrics: {},
				threshold: this.config.alertThresholds.errorRateThreshold,
				currentValue: errorRate,
			}
			this.addAlert(alert)
		}

		// Check cache hit rate
		if (
			stats.cache.hitRate < this.config.alertThresholds.cacheHitRateThreshold &&
			stats.cache.totalAccesses > 100
		) {
			const alert: PerformanceAlert = {
				id: `cache_hit_rate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
				level: "warning",
				type: "low_cache_hit_rate",
				message: `Low cache hit rate: ${stats.cache.hitRate.toFixed(1)}%`,
				timestamp: Date.now(),
				metrics: {},
				threshold: this.config.alertThresholds.cacheHitRateThreshold,
				currentValue: stats.cache.hitRate,
			}
			this.addAlert(alert)
		}

		// Emit periodic stats
		this.emit("periodicStats", stats)
	}

	/**
	 * Add alert to list
	 */
	private addAlert(alert: PerformanceAlert): void {
		this.alerts.push(alert)
		this.emit("alert", alert)

		// Keep only last 1000 alerts
		if (this.alerts.length > 1000) {
			const removeCount = this.alerts.length - 1000
			this.alerts.splice(0, removeCount)
		}
	}

	/**
	 * Format warning message
	 */
	private formatWarningMessage(data: PerformanceWarningEvent): string {
		switch (data.type) {
			case "slow_operation":
				return `Slow operation: ${data.operationName || "unknown"} (${data.duration || 0}ms)`
			case "high_memory":
				return `High memory usage: ${(data.memoryUsage || 0).toFixed(1)}MB`
			default:
				return `Performance warning: ${data.type}`
		}
	}

	/**
	 * Format threshold message
	 */
	private formatThresholdMessage(data: ThresholdExceededEvent): string {
		switch (data.type) {
			case "memory":
				return `Memory threshold exceeded: ${data.current.toFixed(1)}MB > ${data.threshold}MB`
			case "operation_duration":
				return `Operation duration threshold exceeded: ${data.current.toFixed(1)}ms > ${data.threshold}ms`
			default:
				return `Threshold exceeded: ${data.type}`
		}
	}

	/**
	 * Get current alerts
	 */
	getAlerts(level?: AlertLevel, unresolvedOnly?: boolean): PerformanceAlert[] {
		let alerts = this.alerts

		if (level) {
			alerts = alerts.filter((alert) => alert.level === level)
		}

		if (unresolvedOnly) {
			alerts = alerts.filter((alert) => !alert.resolved)
		}

		return alerts.sort((a, b) => b.timestamp - a.timestamp)
	}

	/**
	 * Resolve alert
	 */
	resolveAlert(alertId: string): void {
		const alert = this.alerts.find((a) => a.id === alertId)
		if (alert && !alert.resolved) {
			alert.resolved = true
			alert.resolvedAt = Date.now()
			this.emit("alertResolved", alert)
		}
	}

	/**
	 * Get performance trends
	 */
	getTrends(): PerformanceTrend[] {
		return Array.from(this.trends.values())
	}

	/**
	 * Get specific trend
	 */
	getTrend(metric: string): PerformanceTrend | undefined {
		return this.trends.get(metric)
	}

	/**
	 * Generate performance report
	 */
	generateReport(timeRange?: { start: number; end: number }): PerformanceReport {
		const now = Date.now()
		const range = timeRange || {
			start: now - 24 * 60 * 60 * 1000, // Last 24 hours
			end: now,
		}

		const stats = this.performanceManager.getPerformanceStats()
		const alerts = this.getAlerts(undefined, true).filter(
			(alert) => alert.timestamp >= range.start && alert.timestamp <= range.end,
		)
		const trends = this.getTrends()

		// Calculate summary
		const totalOperations = stats.operations.total
		const successfulOperations = totalOperations - stats.operations.failedOperations
		const errorRate = totalOperations > 0 ? (stats.operations.failedOperations / totalOperations) * 100 : 0

		const summary = {
			totalOperations,
			successfulOperations,
			failedOperations: stats.operations.failedOperations,
			averageDuration: stats.operations.averageDuration,
			slowOperations: stats.operations.slowOperations,
			errorRate,
		}

		// Generate recommendations
		const recommendations = this.generateRecommendations(stats, alerts, trends)

		return {
			generatedAt: now,
			timeRange: {
				...range,
				duration: range.end - range.start,
			},
			summary,
			metrics: {
				operations: [
					{
						operationName: "system_performance_report",
						startTime: now - (range.end - range.start),
						endTime: now,
						duration: range.end - range.start,
						memoryUsage: this.performanceManager.getPerformanceStats().memory.current,
						customMetrics: {
							totalOperations: stats.operations.total,
							averageDuration: stats.operations.averageDuration,
							cacheHitRate: stats.cache.hitRate,
							memoryUsageMB: stats.memory.current.heapUsed / 1024 / 1024,
						},
					},
				],
				alerts,
				trends,
			},
			recommendations,
		}
	}

	/**
	 * Generate performance recommendations
	 */
	private generateRecommendations(
		stats: ReturnType<PerformanceManager["getPerformanceStats"]>,
		alerts: PerformanceAlert[],
		trends: PerformanceTrend[],
	): string[] {
		const recommendations: string[] = []

		// Memory recommendations
		if (stats.memory.current.heapUsed > this.config.alertThresholds.memoryUsageThreshold * 0.8) {
			recommendations.push("Consider implementing memory optimization strategies or increasing memory limits")
		}

		// Performance recommendations
		if (stats.operations.averageDuration > this.config.alertThresholds.slowOperationThreshold * 0.7) {
			recommendations.push("Review slow operations and consider optimization or caching improvements")
		}

		// Cache recommendations
		if (stats.cache.hitRate < this.config.alertThresholds.cacheHitRateThreshold) {
			recommendations.push("Cache hit rate is low, consider reviewing caching strategy")
		}

		// Error rate recommendations
		const recentAlerts = alerts.filter((a) => Date.now() - a.timestamp < 3600000) // Last hour
		if (recentAlerts.length > 10) {
			recommendations.push("High number of recent alerts, investigate system stability")
		}

		// Trend recommendations
		const degradingTrends = trends.filter((t) => t.trend === "degrading")
		if (degradingTrends.length > 0) {
			recommendations.push("Some metrics are showing degrading trends, proactive intervention may be needed")
		}

		if (recommendations.length === 0) {
			recommendations.push("Performance is within acceptable ranges")
		}

		return recommendations
	}

	/**
	 * Get monitoring status
	 */
	getMonitoringStatus(): {
		isMonitoring: boolean
		config: MonitoringConfig
		alertCount: number
		activeAlerts: number
		trendCount: number
	} {
		return {
			isMonitoring: this.isMonitoring,
			config: this.config,
			alertCount: this.alerts.length,
			activeAlerts: this.getAlerts(undefined, true).length,
			trendCount: this.trends.size,
		}
	}

	/**
	 * Clear all monitoring data
	 */
	clearData(): void {
		this.alerts.length = 0
		this.trends.clear()
		this.emit("dataCleared")
	}

	/**
	 * Dispose of performance monitor
	 */
	dispose(): void {
		this.stopMonitoring()
		this.clearData()
		this.removeAllListeners()
	}
}

export default PerformanceMonitor
