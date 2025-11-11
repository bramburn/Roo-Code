# Context for Task 2.7: Implement tool wrapper performance monitoring and metrics collection

- **Status**: To Do
- **Source PRD**: PRDs/04-tool-standardization-testing/tasklists/tasklist_sprint_02.md
- **Target Files**:
    - `src/tools/monitoring/ToolPerformanceMonitor.ts`
    - `src/tools/monitoring/MetricsCollector.ts`
    - `src/tools/monitoring/PerformanceAnalytics.ts`
- **Generated**: 2025-11-11T20:36:00.000Z
- **Last Updated**: 2025-11-11T20:36:00.000Z

---

## 1. Current Code Analysis (Internal)

### Existing Performance Monitoring Patterns

From codebase analysis, I found existing performance patterns:

**File**: `src/shared/cost.ts` (lines 1-50)

```typescript
// Current cost tracking implementation
export interface TokenUsage {
	inputTokens: number
	outputTokens: number
	cacheReadInputTokens: number
	cacheWriteInputTokens: number
}

export interface ApiCost {
	cost: number
	usage: TokenUsage
	model: string
	provider: string
}

export function calculateCost(usage: TokenUsage, model: string, provider: string): number {
	// Cost calculation logic
}
```

**File**: `src/shared/getApiMetrics.ts` (lines 1-50)

```typescript
// API metrics collection
export interface ApiMetrics {
	requestCount: number
	totalTokens: number
	totalCost: number
	averageResponseTime: number
	errorRate: number
}

export function getApiMetrics(): ApiMetrics {
	// Metrics aggregation logic
}
```

**Tool Usage Tracking** from `src/core/task/Task.ts`:

```typescript
// Tool usage tracking in task
toolUsage: ToolUsage = {}

public recordToolUsage(toolName: ToolName) {
  this.toolUsage[toolName] = (this.toolUsage[toolName] || 0) + 1
}

public recordToolError(toolName: ToolName, error?: string) {
  // Error tracking logic
}
```

### Current Monitoring Infrastructure

**Performance Patterns**:

- **Token Usage**: Tracking input/output tokens for API calls
- **Cost Tracking**: Calculating API costs per request
- **Tool Usage**: Counting tool executions per task
- **Error Tracking**: Recording tool execution errors

**Missing Capabilities**:

- **Execution Time**: No timing for individual tool executions
- **Memory Usage**: No memory usage monitoring
- **Performance Analytics**: No trend analysis or reporting
- **Real-time Monitoring**: No live performance dashboards

---

## 2. External Best Practices (GitHub)

### Best Practice 1: Comprehensive Performance Monitoring

**Source**: https://github.com/Netflix/Hystrix
**Pattern**: Circuit breaker with performance metrics

```typescript
// Performance monitoring with circuit breaker pattern
export class ToolPerformanceMonitor {
	private metrics: Map<string, ToolMetrics> = new Map()
	private circuitBreakers: Map<string, CircuitBreaker> = new Map()

	async executeTool<T>(
		toolName: string,
		toolFunction: () => Promise<T>,
		options?: MonitoringOptions,
	): Promise<ToolExecutionResult<T>> {
		const startTime = performance.now()
		const startMemory = this.getMemoryUsage()

		try {
			// Check circuit breaker
			const circuitBreaker = this.circuitBreakers.get(toolName)
			if (circuitBreaker && circuitBreaker.isOpen()) {
				throw new Error(`Circuit breaker open for tool: ${toolName}`)
			}

			// Execute tool with timeout
			const result = await this.executeWithTimeout(toolFunction, options?.timeout || 30000)

			const endTime = performance.now()
			const endMemory = this.getMemoryUsage()

			// Record successful execution
			this.recordExecution(toolName, {
				duration: endTime - startTime,
				memoryDelta: endMemory - startMemory,
				success: true,
				result: result,
			})

			// Reset circuit breaker on success
			if (circuitBreaker) {
				circuitBreaker.recordSuccess()
			}

			return {
				success: true,
				result,
				metrics: this.getToolMetrics(toolName),
			}
		} catch (error) {
			const endTime = performance.now()
			const endMemory = this.getMemoryUsage()

			// Record failed execution
			this.recordExecution(toolName, {
				duration: endTime - startTime,
				memoryDelta: endMemory - startMemory,
				success: false,
				error: error.message,
			})

			// Trip circuit breaker on failure
			if (circuitBreaker) {
				circuitBreaker.recordFailure()
			}

			return {
				success: false,
				error: error.message,
				metrics: this.getToolMetrics(toolName),
			}
		}
	}

	private recordExecution(toolName: string, metrics: ExecutionMetrics): void {
		const existing = this.metrics.get(toolName) || this.createEmptyMetrics(toolName)

		// Update rolling metrics
		existing.totalExecutions++
		existing.successfulExecutions += metrics.success ? 1 : 0
		existing.failedExecutions += metrics.success ? 0 : 1

		// Update timing metrics
		existing.totalDuration += metrics.duration
		existing.averageDuration = existing.totalDuration / existing.totalExecutions
		existing.minDuration = Math.min(existing.minDuration, metrics.duration)
		existing.maxDuration = Math.max(existing.maxDuration, metrics.duration)

		// Update memory metrics
		existing.totalMemoryDelta += metrics.memoryDelta
		existing.averageMemoryDelta = existing.totalMemoryDelta / existing.totalExecutions
		existing.minMemoryDelta = Math.min(existing.minMemoryDelta, metrics.memoryDelta)
		existing.maxMemoryDelta = Math.max(existing.maxMemoryDelta, metrics.memoryDelta)

		// Update recent executions for trend analysis
		existing.recentExecutions.push({
			timestamp: Date.now(),
			duration: metrics.duration,
			memoryDelta: metrics.memoryDelta,
			success: metrics.success,
			error: metrics.error,
		})

		// Keep only recent executions (last 100)
		if (existing.recentExecutions.length > 100) {
			existing.recentExecutions = existing.recentExecutions.slice(-100)
		}

		this.metrics.set(toolName, existing)
	}

	private executeWithTimeout<T>(fn: () => Promise<T>, timeoutMs: number): Promise<T> {
		return Promise.race([
			fn(),
			new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Tool execution timeout")), timeoutMs)),
		])
	}

	private getMemoryUsage(): number {
		if (typeof process !== "undefined" && process.memoryUsage) {
			return process.memoryUsage().heapUsed
		}
		return 0
	}

	private createEmptyMetrics(toolName: string): ToolMetrics {
		return {
			toolName,
			totalExecutions: 0,
			successfulExecutions: 0,
			failedExecutions: 0,
			totalDuration: 0,
			averageDuration: 0,
			minDuration: Infinity,
			maxDuration: 0,
			totalMemoryDelta: 0,
			averageMemoryDelta: 0,
			minMemoryDelta: Infinity,
			maxMemoryDelta: 0,
			recentExecutions: [],
			createdAt: new Date(),
			lastUpdated: new Date(),
		}
	}
}

interface ToolMetrics {
	toolName: string
	totalExecutions: number
	successfulExecutions: number
	failedExecutions: number
	totalDuration: number
	averageDuration: number
	minDuration: number
	maxDuration: number
	totalMemoryDelta: number
	averageMemoryDelta: number
	minMemoryDelta: number
	maxMemoryDelta: number
	recentExecutions: ExecutionRecord[]
	createdAt: Date
	lastUpdated: Date
}

interface ExecutionMetrics {
	duration: number
	memoryDelta: number
	success: boolean
	result?: any
	error?: string
}

interface ExecutionRecord {
	timestamp: number
	duration: number
	memoryDelta: number
	success: boolean
	error?: string
}

interface MonitoringOptions {
	timeout?: number
	circuitBreaker?: CircuitBreakerOptions
}

interface ToolExecutionResult<T> {
	success: boolean
	result?: T
	error?: string
	metrics: ToolMetrics
}
```

### Best Practice 2: Metrics Collection and Aggregation

**Source**: https://github.com/prometheus/client_model
**Pattern**: Prometheus-style metrics collection

```typescript
// Metrics collection with Prometheus-style patterns
export class MetricsCollector {
	private counters: Map<string, Counter> = new Map()
	private histograms: Map<string, Histogram> = new Map()
	private gauges: Map<string, Gauge> = new Map()

	// Counter metrics
	incrementCounter(name: string, labels?: Record<string, string>, value: number = 1): void {
		const key = this.buildKey(name, labels)
		const counter = this.counters.get(key) || new Counter()
		counter.inc(value)
		this.counters.set(key, counter)
	}

	// Histogram metrics for timing
	recordHistogram(name: string, value: number, labels?: Record<string, string>): void {
		const key = this.buildKey(name, labels)
		const histogram = this.histograms.get(key) || new Histogram()
		histogram.observe(value)
		this.histograms.set(key, histogram)
	}

	// Gauge metrics for current values
	setGauge(name: string, value: number, labels?: Record<string, string>): void {
		const key = this.buildKey(name, labels)
		const gauge = this.gauges.get(key) || new Gauge()
		gauge.set(value)
		this.gauges.set(key, gauge)
	}

	// Tool-specific metrics
	recordToolExecution(toolName: string, duration: number, success: boolean): void {
		this.incrementCounter("tool_executions_total", { tool: toolName, status: success ? "success" : "error" })
		this.recordHistogram("tool_execution_duration_seconds", duration / 1000, { tool: toolName })

		if (!success) {
			this.incrementCounter("tool_errors_total", { tool: toolName })
		}
	}

	recordToolMemoryUsage(toolName: string, memoryUsage: number): void {
		this.setGauge("tool_memory_usage_bytes", memoryUsage, { tool: toolName })
	}

	recordToolParameters(toolName: string, paramCount: number, paramSize: number): void {
		this.recordHistogram("tool_parameter_count", paramCount, { tool: toolName })
		this.recordHistogram("tool_parameter_size_bytes", paramSize, { tool: toolName })
	}

	// Metrics export
	getMetrics(): MetricsSnapshot {
		const snapshot: MetricsSnapshot = {
			counters: {},
			histograms: {},
			gauges: {},
			timestamp: new Date(),
		}

		// Export counters
		for (const [key, counter] of this.counters) {
			snapshot.counters[key] = counter.get()
		}

		// Export histograms
		for (const [key, histogram] of this.histograms) {
			const data = histogram.get()
			snapshot.histograms[key] = {
				count: data.count,
				sum: data.sum,
				min: data.min,
				max: data.max,
				mean: data.mean,
				median: data.median,
				p95: data.percentiles[0.95],
				p99: data.percentiles[0.99],
			}
		}

		// Export gauges
		for (const [key, gauge] of this.gauges) {
			snapshot.gauges[key] = gauge.get()
		}

		return snapshot
	}

	private buildKey(name: string, labels?: Record<string, string>): string {
		if (!labels) return name

		const labelStr = Object.entries(labels)
			.sort(([a]) => a)
			.map(([k, v]) => `${k}="${v}"`)
			.join(",")

		return `${name}{${labelStr}}`
	}
}

// Metric types
class Counter {
	private value = 0

	inc(delta: number = 1): void {
		this.value += delta
	}

	get(): number {
		return this.value
	}
}

class Histogram {
	private values: number[] = []

	observe(value: number): void {
		this.values.push(value)

		// Keep only recent values (last 1000)
		if (this.values.length > 1000) {
			this.values = this.values.slice(-1000)
		}
	}

	get(): HistogramData {
		if (this.values.length === 0) {
			return {
				count: 0,
				sum: 0,
				min: 0,
				max: 0,
				mean: 0,
				median: 0,
				percentiles: {},
			}
		}

		const sorted = [...this.values].sort((a, b) => a - b)
		const count = sorted.length
		const sum = sorted.reduce((a, b) => a + b, 0)
		const mean = sum / count

		return {
			count,
			sum,
			min: sorted[0],
			max: sorted[count - 1],
			mean,
			median: this.percentile(sorted, 0.5),
			percentiles: {
				0.5: this.percentile(sorted, 0.5),
				0.9: this.percentile(sorted, 0.9),
				0.95: this.percentile(sorted, 0.95),
				0.99: this.percentile(sorted, 0.99),
			},
		}
	}

	private percentile(sorted: number[], p: number): number {
		const index = Math.floor(sorted.length * p)
		return sorted[Math.max(0, Math.min(index, sorted.length - 1))]
	}
}

class Gauge {
	private value = 0

	set(value: number): void {
		this.value = value
	}

	get(): number {
		return this.value
	}
}

interface MetricsSnapshot {
	counters: Record<string, number>
	histograms: Record<string, HistogramData>
	gauges: Record<string, number>
	timestamp: Date
}

interface HistogramData {
	count: number
	sum: number
	min: number
	max: number
	mean: number
	median: number
	percentiles: Record<string, number>
}
```

### Best Practice 3: Performance Analytics and Alerting

**Source**: https://github.com/elastic/elasticsearch
**Pattern**: Analytics with anomaly detection and alerting

```typescript
// Performance analytics with anomaly detection
export class PerformanceAnalytics {
	private metrics: MetricsCollector
	private alertThresholds: Map<string, AlertThreshold> = new Map()
	private anomalyDetector: AnomalyDetector

	constructor(metrics: MetricsCollector) {
		this.metrics = metrics
		this.anomalyDetector = new AnomalyDetector()
		this.setupDefaultThresholds()
	}

	// Real-time analytics
	analyzePerformance(toolName: string): PerformanceAnalysis {
		const toolMetrics = this.metrics.getToolMetrics(toolName)
		if (!toolMetrics) {
			return { status: "no_data", analysis: null }
		}

		const analysis: PerformanceAnalysis = {
			toolName,
			status: "analyzed",
			currentPerformance: this.calculateCurrentPerformance(toolMetrics),
			trends: this.calculateTrends(toolMetrics),
			anomalies: this.anomalyDetector.detectAnomalies(toolMetrics),
			recommendations: this.generateRecommendations(toolMetrics),
			alerts: this.checkAlerts(toolName, toolMetrics),
		}

		return analysis
	}

	private calculateCurrentPerformance(metrics: ToolMetrics): CurrentPerformance {
		const recentExecutions = metrics.recentExecutions.slice(-10) // Last 10 executions

		if (recentExecutions.length === 0) {
			return {
				status: "no_recent_data",
				averageDuration: 0,
				successRate: 0,
				errorRate: 0,
				memoryEfficiency: 0,
			}
		}

		const successfulExecutions = recentExecutions.filter((e) => e.success)
		const successRate = successfulExecutions.length / recentExecutions.length
		const errorRate = 1 - successRate

		const averageDuration = recentExecutions.reduce((sum, e) => sum + e.duration, 0) / recentExecutions.length
		const averageMemoryDelta = recentExecutions.reduce((sum, e) => sum + e.memoryDelta, 0) / recentExecutions.length

		return {
			status: "calculated",
			averageDuration,
			successRate,
			errorRate,
			memoryEfficiency: this.calculateMemoryEfficiency(averageMemoryDelta),
		}
	}

	private calculateTrends(metrics: ToolMetrics): PerformanceTrends {
		const recentExecutions = metrics.recentExecutions

		if (recentExecutions.length < 5) {
			return {
				status: "insufficient_data",
				durationTrend: "stable",
				errorTrend: "stable",
				memoryTrend: "stable",
			}
		}

		// Calculate trends using linear regression
		const durationTrend = this.calculateTrend(recentExecutions.map((e) => e.duration))
		const errorTrend = this.calculateTrend(recentExecutions.map((e) => (e.success ? 0 : 1)))
		const memoryTrend = this.calculateTrend(recentExecutions.map((e) => e.memoryDelta))

		return {
			status: "calculated",
			durationTrend: this.classifyTrend(durationTrend),
			errorTrend: this.classifyTrend(errorTrend),
			memoryTrend: this.classifyTrend(memoryTrend),
		}
	}

	private calculateTrend(values: number[]): number {
		if (values.length < 2) return 0

		const n = values.length
		const x = Array.from({ length: n }, (_, i) => i)
		const sumX = x.reduce((sum, val) => sum + val, 0)
		const sumY = values.reduce((sum, val) => sum + val, 0)
		const sumXY = x.reduce((sum, val, i) => sum + val * values[i], 0)
		const sumXX = x.reduce((sum, val) => sum + val * val, 0)

		// Linear regression slope
		const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)

		return slope
	}

	private classifyTrend(slope: number): "improving" | "degrading" | "stable" {
		const threshold = 0.01 // 1% change threshold

		if (slope > threshold) return "degrading"
		if (slope < -threshold) return "improving"
		return "stable"
	}

	private calculateMemoryEfficiency(memoryDelta: number): number {
		// Normalize memory efficiency (lower is better)
		return Math.max(0, 1 - memoryDelta / 1024 / 1024) // Normalize to MB
	}

	private generateRecommendations(metrics: ToolMetrics): string[] {
		const recommendations: string[] = []

		// Performance recommendations
		if (metrics.averageDuration > 5000) {
			// 5 seconds
			recommendations.push("Consider optimizing tool execution for better performance")
		}

		if (metrics.failedExecutions / metrics.totalExecutions > 0.1) {
			// >10% error rate
			recommendations.push("High error rate detected, review error handling")
		}

		if (metrics.averageMemoryDelta > 10 * 1024 * 1024) {
			// >10MB
			recommendations.push("High memory usage detected, consider memory optimization")
		}

		// Usage recommendations
		if (metrics.totalExecutions < 10) {
			recommendations.push("Low usage detected, consider tool optimization or better documentation")
		}

		return recommendations
	}

	private checkAlerts(toolName: string, metrics: ToolMetrics): Alert[] {
		const alerts: Alert[] = []
		const threshold = this.alertThresholds.get(toolName)

		if (!threshold) return alerts

		// Duration alerts
		if (metrics.averageDuration > threshold.maxDuration) {
			alerts.push({
				type: "duration",
				severity: "warning",
				message: `Average duration ${metrics.averageDuration}ms exceeds threshold ${threshold.maxDuration}ms`,
				value: metrics.averageDuration,
				threshold: threshold.maxDuration,
			})
		}

		// Error rate alerts
		const errorRate = metrics.failedExecutions / metrics.totalExecutions
		if (errorRate > threshold.maxErrorRate) {
			alerts.push({
				type: "error_rate",
				severity: "critical",
				message: `Error rate ${(errorRate * 100).toFixed(2)}% exceeds threshold ${(threshold.maxErrorRate * 100).toFixed(2)}%`,
				value: errorRate,
				threshold: threshold.maxErrorRate,
			})
		}

		return alerts
	}

	private setupDefaultThresholds(): void {
		// Set default thresholds for common tools
		this.alertThresholds.set("write_to_file", {
			maxDuration: 2000, // 2 seconds
			maxErrorRate: 0.05, // 5%
			maxMemoryDelta: 5 * 1024 * 1024, // 5MB
		})

		this.alertThresholds.set("read_file", {
			maxDuration: 1000, // 1 second
			maxErrorRate: 0.02, // 2%
			maxMemoryDelta: 2 * 1024 * 1024, // 2MB
		})

		this.alertThresholds.set("execute_command", {
			maxDuration: 10000, // 10 seconds
			maxErrorRate: 0.1, // 10%
			maxMemoryDelta: 20 * 1024 * 1024, // 20MB
		})
	}
}

// Supporting interfaces
interface PerformanceAnalysis {
	toolName: string
	status: "no_data" | "analyzed"
	currentPerformance: CurrentPerformance
	trends: PerformanceTrends
	anomalies: Anomaly[]
	recommendations: string[]
	alerts: Alert[]
}

interface CurrentPerformance {
	status: "no_recent_data" | "calculated"
	averageDuration: number
	successRate: number
	errorRate: number
	memoryEfficiency: number
}

interface PerformanceTrends {
	status: "insufficient_data" | "calculated"
	durationTrend: "improving" | "degrading" | "stable"
	errorTrend: "improving" | "degrading" | "stable"
	memoryTrend: "improving" | "degrading" | "stable"
}

interface AlertThreshold {
	maxDuration: number
	maxErrorRate: number
	maxMemoryDelta: number
}

interface Alert {
	type: "duration" | "error_rate" | "memory_usage"
	severity: "info" | "warning" | "critical"
	message: string
	value: number
	threshold: number
}

interface Anomaly {
	type: "duration_spike" | "error_burst" | "memory_leak"
	severity: "low" | "medium" | "high"
	description: string
	detectedAt: Date
}
```

---

## 3. Internal Knowledge Base (Memory)

### Existing Performance Infrastructure

From memory analysis, codebase has:

- **Token Usage Tracking**: API token counting and cost calculation
- **Tool Usage Counting**: Basic tool execution counting
- **Error Tracking**: Tool error recording and reporting
- **Cost Calculation**: API cost tracking per request

### Performance Monitoring Requirements

Based on existing patterns:

- **Execution Timing**: Measure tool execution duration
- **Memory Usage**: Track memory consumption during execution
- **Success Rate**: Monitor tool success/failure rates
- **Performance Trends**: Analyze performance over time
- **Alerting**: Notify on performance degradation

---

## 4. Suggested Implementation Plan

### Phase 1: Core Performance Monitor

**File**: `src/tools/monitoring/ToolPerformanceMonitor.ts`

```typescript
import { EventEmitter } from "events"
import { MetricsCollector } from "./MetricsCollector"
import { PerformanceAnalytics } from "./PerformanceAnalytics"

export interface MonitoringEvents {
	toolExecutionStarted: { toolName: string; executionId: string }
	toolExecutionCompleted: { toolName: string; executionId: string; duration: number; success: boolean }
	toolError: { toolName: string; executionId: string; error: string }
	performanceAlert: { toolName: string; alert: Alert }
}

export class ToolPerformanceMonitor extends EventEmitter<MonitoringEvents> {
	private metrics: MetricsCollector
	private analytics: PerformanceAnalytics
	private activeExecutions: Map<string, ActiveExecution> = new Map()
	private executionHistory: Map<string, ExecutionRecord[]> = new Map()

	constructor() {
		super()
		this.metrics = new MetricsCollector()
		this.analytics = new PerformanceAnalytics(this.metrics)
	}

	// Start monitoring a tool execution
	startExecution(toolName: string, context?: any): string {
		const executionId = this.generateExecutionId()
		const startTime = performance.now()
		const startMemory = this.getMemoryUsage()

		const activeExecution: ActiveExecution = {
			executionId,
			toolName,
			startTime,
			startMemory,
			context,
		}

		this.activeExecutions.set(executionId, activeExecution)

		// Record start metrics
		this.metrics.incrementCounter("tool_executions_started", { tool: toolName })

		// Emit event
		this.emit("toolExecutionStarted", { toolName, executionId })

		return executionId
	}

	// Complete monitoring a tool execution
	completeExecution(executionId: string, result?: any, error?: string): void {
		const activeExecution = this.activeExecutions.get(executionId)
		if (!activeExecution) {
			console.warn(`No active execution found for ID: ${executionId}`)
			return
		}

		const endTime = performance.now()
		const endMemory = this.getMemoryUsage()
		const duration = endTime - activeExecution.startTime
		const memoryDelta = endMemory - activeExecution.startMemory
		const success = !error

		// Create execution record
		const record: ExecutionRecord = {
			executionId,
			toolName: activeExecution.toolName,
			startTime: activeExecution.startTime,
			endTime,
			duration,
			memoryDelta,
			success,
			result,
			error,
			context: activeExecution.context,
		}

		// Store in history
		if (!this.executionHistory.has(activeExecution.toolName)) {
			this.executionHistory.set(activeExecution.toolName, [])
		}
		this.executionHistory.get(activeExecution.toolName)!.push(record)

		// Keep only recent executions (last 1000 per tool)
		const history = this.executionHistory.get(activeExecution.toolName)!
		if (history.length > 1000) {
			this.executionHistory.set(activeExecution.toolName, history.slice(-1000))
		}

		// Record metrics
		this.metrics.recordToolExecution(activeExecution.toolName, duration, success)
		this.metrics.recordToolMemoryUsage(activeExecution.toolName, endMemory)

		// Remove from active executions
		this.activeExecutions.delete(executionId)

		// Emit completion event
		this.emit("toolExecutionCompleted", {
			toolName: activeExecution.toolName,
			executionId,
			duration,
			success,
		})

		// Handle error
		if (error) {
			this.emit("toolError", { toolName: activeExecution.toolName, executionId, error })
			this.metrics.incrementCounter("tool_errors_total", { tool: activeExecution.toolName })
		}

		// Check for performance alerts
		this.checkPerformanceAlerts(activeExecution.toolName)
	}

	// Get performance data
	getToolMetrics(toolName: string): ToolMetrics | null {
		return this.metrics.getToolMetrics(toolName)
	}

	getExecutionHistory(toolName: string, limit?: number): ExecutionRecord[] {
		const history = this.executionHistory.get(toolName) || []
		return limit ? history.slice(-limit) : history
	}

	getActiveExecutions(): ActiveExecution[] {
		return Array.from(this.activeExecutions.values())
	}

	getPerformanceAnalysis(toolName: string): PerformanceAnalysis {
		return this.analytics.analyzePerformance(toolName)
	}

	getAllPerformanceAnalysis(): Map<string, PerformanceAnalysis> {
		const analyses = new Map<string, PerformanceAnalysis>()

		for (const toolName of this.executionHistory.keys()) {
			analyses.set(toolName, this.analytics.analyzePerformance(toolName))
		}

		return analyses
	}

	// Export and reporting
	generateReport(toolName?: string): PerformanceReport {
		const tools = toolName ? [toolName] : Array.from(this.executionHistory.keys())

		const report: PerformanceReport = {
			generatedAt: new Date(),
			tools: {},
		}

		for (const tn of tools) {
			const metrics = this.getToolMetrics(tn)
			const analysis = this.getPerformanceAnalysis(tn)
			const history = this.getExecutionHistory(tn, 100) // Last 100 executions

			report.tools[tn] = {
				metrics,
				analysis,
				recentExecutions: history,
				summary: this.generateToolSummary(metrics, analysis),
			}
		}

		return report
	}

	// Private helper methods
	private generateExecutionId(): string {
		return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
	}

	private getMemoryUsage(): number {
		if (typeof process !== "undefined" && process.memoryUsage) {
			return process.memoryUsage().heapUsed
		}
		return 0
	}

	private checkPerformanceAlerts(toolName: string): void {
		const analysis = this.getPerformanceAnalysis(toolName)

		for (const alert of analysis.alerts) {
			this.emit("performanceAlert", { toolName, alert })
		}
	}

	private generateToolSummary(metrics: ToolMetrics, analysis: PerformanceAnalysis): ToolSummary {
		return {
			totalExecutions: metrics.totalExecutions,
			successRate: analysis.currentPerformance.successRate,
			averageDuration: metrics.averageDuration,
			errorRate: analysis.currentPerformance.errorRate,
			performanceStatus: this.classifyPerformanceStatus(analysis),
			lastExecution: metrics.recentExecutions[metrics.recentExecutions.length - 1]?.timestamp || null,
		}
	}

	private classifyPerformanceStatus(analysis: PerformanceAnalysis): "excellent" | "good" | "warning" | "critical" {
		const { currentPerformance, alerts } = analysis

		// Critical alerts
		if (alerts.some((a) => a.severity === "critical")) {
			return "critical"
		}

		// Warning alerts
		if (alerts.some((a) => a.severity === "warning")) {
			return "warning"
		}

		// Performance-based classification
		if (currentPerformance.successRate >= 0.95 && currentPerformance.averageDuration < 1000) {
			return "excellent"
		}

		if (currentPerformance.successRate >= 0.9 && currentPerformance.averageDuration < 3000) {
			return "good"
		}

		return "warning"
	}
}

// Supporting interfaces
interface ActiveExecution {
	executionId: string
	toolName: string
	startTime: number
	startMemory: number
	context?: any
}

interface ExecutionRecord {
	executionId: string
	toolName: string
	startTime: number
	endTime: number
	duration: number
	memoryDelta: number
	success: boolean
	result?: any
	error?: string
	context?: any
}

interface ToolSummary {
	totalExecutions: number
	successRate: number
	averageDuration: number
	errorRate: number
	performanceStatus: "excellent" | "good" | "warning" | "critical"
	lastExecution: number | null
}

interface PerformanceReport {
	generatedAt: Date
	tools: Record<
		string,
		{
			metrics: ToolMetrics
			analysis: PerformanceAnalysis
			recentExecutions: ExecutionRecord[]
			summary: ToolSummary
		}
	>
}
```

### Phase 2: Metrics Collection System

**File**: `src/tools/monitoring/MetricsCollector.ts`

```typescript
export class MetricsCollector {
	private counters: Map<string, Counter> = new Map()
	private histograms: Map<string, Histogram> = new Map()
	private gauges: Map<string, Gauge> = new Map()
	private timers: Map<string, Timer> = new Map()

	// Counter operations
	incrementCounter(name: string, labels?: Record<string, string>, value: number = 1): void {
		const key = this.buildKey(name, labels)
		const counter = this.counters.get(key) || new Counter()
		counter.inc(value)
		this.counters.set(key, counter)
	}

	// Histogram operations for timing and distributions
	recordHistogram(name: string, value: number, labels?: Record<string, string>): void {
		const key = this.buildKey(name, labels)
		const histogram = this.histograms.get(key) || new Histogram()
		histogram.observe(value)
		this.histograms.set(key, histogram)
	}

	// Gauge operations for current values
	setGauge(name: string, value: number, labels?: Record<string, string>): void {
		const key = this.buildKey(name, labels)
		const gauge = this.gauges.get(key) || new Gauge()
		gauge.set(value)
		this.gauges.set(key, gauge)
	}

	// Timer operations for duration measurement
	startTimer(name: string, labels?: Record<string, string>): string {
		const timerId = this.generateTimerId()
		const timer = new Timer()

		this.timers.set(timerId, {
			name,
			labels,
			timer,
			startTime: performance.now(),
		})

		return timerId
	}

	endTimer(timerId: string, labels?: Record<string, string>): void {
		const timer = this.timers.get(timerId)
		if (!timer) {
			console.warn(`Timer not found: ${timerId}`)
			return
		}

		const duration = performance.now() - timer.startTime
		const finalLabels = { ...timer.labels, ...labels }

		this.recordHistogram(`${timer.name}_duration_ms`, duration, finalLabels)
		this.timers.delete(timerId)
	}

	// Tool-specific metrics
	recordToolExecution(toolName: string, duration: number, success: boolean): void {
		this.incrementCounter("tool_executions_total", { tool: toolName, status: success ? "success" : "error" })
		this.recordHistogram("tool_execution_duration_ms", duration, { tool: toolName })

		if (!success) {
			this.incrementCounter("tool_errors_total", { tool: toolName })
		}
	}

	recordToolParameters(toolName: string, paramCount: number, paramSize: number): void {
		this.recordHistogram("tool_parameter_count", paramCount, { tool: toolName })
		this.recordHistogram("tool_parameter_size_bytes", paramSize, { tool: toolName })
	}

	recordToolMemoryUsage(toolName: string, memoryUsage: number): void {
		this.setGauge("tool_memory_usage_bytes", memoryUsage, { tool: toolName })
	}

	recordToolCpuUsage(toolName: string, cpuUsage: number): void {
		this.setGauge("tool_cpu_usage_percent", cpuUsage, { tool: toolName })
	}

	recordToolNetworkIO(toolName: string, bytesIn: number, bytesOut: number): void {
		this.incrementCounter("tool_network_bytes_total", { tool: toolName, direction: "in" }, bytesIn)
		this.incrementCounter("tool_network_bytes_total", { tool: toolName, direction: "out" }, bytesOut)
	}

	// Metrics aggregation and export
	getToolMetrics(toolName: string): ToolMetrics | null {
		const executionCounter = this.counters.get('tool_executions_total{tool="' + toolName + '",status="success"}')
		const errorCounter = this.counters.get('tool_executions_total{tool="' + toolName + '",status="error"}')
		const durationHistogram = this.histograms.get('tool_execution_duration_ms{tool="' + toolName + '"}')
		const memoryGauge = this.gauges.get('tool_memory_usage_bytes{tool="' + toolName + '"}')

		if (!executionCounter || !durationHistogram || !memoryGauge) {
			return null
		}

		const totalExecutions = executionCounter.get() + (errorCounter?.get() || 0)
		const successfulExecutions = executionCounter.get() || 0
		const failedExecutions = errorCounter?.get() || 0

		const durationData = durationHistogram.get()
		const memoryUsage = memoryGauge.get()

		return {
			toolName,
			totalExecutions,
			successfulExecutions,
			failedExecutions,
			totalDuration: durationData.sum || 0,
			averageDuration: durationData.mean || 0,
			minDuration: durationData.min || 0,
			maxDuration: durationData.max || 0,
			totalMemoryDelta: 0, // Would need to track memory deltas
			averageMemoryDelta: memoryUsage || 0,
			minMemoryDelta: memoryUsage || 0,
			maxMemoryDelta: memoryUsage || 0,
			recentExecutions: [], // Would need to track recent executions
			createdAt: new Date(),
			lastUpdated: new Date(),
		}
	}

	getAllMetrics(): MetricsSnapshot {
		const snapshot: MetricsSnapshot = {
			counters: {},
			histograms: {},
			gauges: {},
			timestamp: new Date(),
		}

		// Export all counters
		for (const [key, counter] of this.counters) {
			snapshot.counters[key] = counter.get()
		}

		// Export all histograms
		for (const [key, histogram] of this.histograms) {
			const data = histogram.get()
			snapshot.histograms[key] = {
				count: data.count,
				sum: data.sum,
				min: data.min,
				max: data.max,
				mean: data.mean,
				median: data.median,
				p95: data.percentiles[0.95],
				p99: data.percentiles[0.99],
			}
		}

		// Export all gauges
		for (const [key, gauge] of this.gauges) {
			snapshot.gauges[key] = gauge.get()
		}

		return snapshot
	}

	resetMetrics(toolName?: string): void {
		if (toolName) {
			// Reset metrics for specific tool
			const keysToDelete = Array.from(this.counters.keys())
				.concat(Array.from(this.histograms.keys()))
				.concat(Array.from(this.gauges.keys()))
				.filter((key) => key.includes(`tool="${toolName}"`))

			for (const key of keysToDelete) {
				this.counters.delete(key)
				this.histograms.delete(key)
				this.gauges.delete(key)
			}
		} else {
			// Reset all metrics
			this.counters.clear()
			this.histograms.clear()
			this.gauges.clear()
			this.timers.clear()
		}
	}

	// Private helper methods
	private buildKey(name: string, labels?: Record<string, string>): string {
		if (!labels) return name

		const labelStr = Object.entries(labels)
			.sort(([a]) => a)
			.map(([k, v]) => `${k}="${v}"`)
			.join(",")

		return `${name}{${labelStr}}`
	}

	private generateTimerId(): string {
		return `timer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
	}
}

// Metric type implementations
class Counter {
	private value = 0

	inc(delta: number = 1): void {
		this.value += delta
	}

	get(): number {
		return this.value
	}

	reset(): void {
		this.value = 0
	}
}

class Histogram {
	private values: number[] = []
	private sum = 0
	private count = 0

	observe(value: number): void {
		this.values.push(value)
		this.sum += value
		this.count++

		// Keep only recent values (last 1000)
		if (this.values.length > 1000) {
			const removed = this.values.shift()!
			this.sum -= removed
			this.count--
		}
	}

	get(): HistogramData {
		if (this.count === 0) {
			return {
				count: 0,
				sum: 0,
				min: 0,
				max: 0,
				mean: 0,
				median: 0,
				percentiles: {},
			}
		}

		const sorted = [...this.values].sort((a, b) => a - b)

		return {
			count: this.count,
			sum: this.sum,
			min: sorted[0],
			max: sorted[this.count - 1],
			mean: this.sum / this.count,
			median: this.percentile(sorted, 0.5),
			percentiles: {
				0.5: this.percentile(sorted, 0.5),
				0.75: this.percentile(sorted, 0.75),
				0.9: this.percentile(sorted, 0.9),
				0.95: this.percentile(sorted, 0.95),
				0.99: this.percentile(sorted, 0.99),
			},
		}
	}

	private percentile(sorted: number[], p: number): number {
		const index = Math.floor(sorted.length * p)
		return sorted[Math.max(0, Math.min(index, sorted.length - 1))]
	}
}

class Gauge {
	private value = 0

	set(value: number): void {
		this.value = value
	}

	get(): number {
		return this.value
	}
}

class Timer {
	startTime: number = 0

	start(): void {
		this.startTime = performance.now()
	}

	end(): number {
		return performance.now() - this.startTime
	}
}

interface TimerData {
	name: string
	labels?: Record<string, string>
	timer: Timer
	startTime: number
}
```

### Phase 3: Performance Analytics

**File**: `src/tools/monitoring/PerformanceAnalytics.ts`

```typescript
export class PerformanceAnalytics {
	private metrics: MetricsCollector
	private alertThresholds: Map<string, AlertThreshold> = new Map()
	private anomalyDetector: AnomalyDetector

	constructor(metrics: MetricsCollector) {
		this.metrics = metrics
		this.anomalyDetector = new AnomalyDetector()
		this.setupDefaultThresholds()
	}

	// Real-time analytics
	analyzePerformance(toolName: string): PerformanceAnalysis {
		const toolMetrics = this.metrics.getToolMetrics(toolName)
		if (!toolMetrics) {
			return { status: "no_data", analysis: null }
		}

		const analysis: PerformanceAnalysis = {
			toolName,
			status: "analyzed",
			currentPerformance: this.calculateCurrentPerformance(toolMetrics),
			trends: this.calculateTrends(toolMetrics),
			anomalies: this.anomalyDetector.detectAnomalies(toolMetrics),
			recommendations: this.generateRecommendations(toolMetrics),
			alerts: this.checkAlerts(toolName, toolMetrics),
		}

		return analysis
	}

	// Anomaly detection
	detectAnomalies(toolName: string): Anomaly[] {
		const toolMetrics = this.metrics.getToolMetrics(toolName)
		if (!toolMetrics || toolMetrics.recentExecutions.length < 10) {
			return []
		}

		return this.anomalyDetector.detectAnomalies(toolMetrics)
	}

	// Performance benchmarking
	benchmarkTools(toolNames: string[]): BenchmarkReport {
		const report: BenchmarkReport = {
			timestamp: new Date(),
			tools: {},
			summary: {
				totalTools: toolNames.length,
				averagePerformance: "good",
				recommendations: [],
			},
		}

		for (const toolName of toolNames) {
			const metrics = this.metrics.getToolMetrics(toolName)
			if (!metrics) {
				continue
			}

			const analysis = this.analyzePerformance(toolName)
			const benchmark: ToolBenchmark = {
				toolName,
				metrics,
				analysis,
				grade: this.calculatePerformanceGrade(analysis),
				rank: 0, // Will be calculated after all tools analyzed
			}

			report.tools[toolName] = benchmark
		}

		// Calculate rankings
		const benchmarks = Object.values(report.tools)
		benchmarks.sort((a, b) => {
			const scoreA = this.calculatePerformanceScore(a.analysis)
			const scoreB = this.calculatePerformanceScore(b.analysis)
			return scoreB - scoreA
		})

		benchmarks.forEach((benchmark, index) => {
			benchmark.rank = index + 1
		})

		// Generate summary
		report.summary.averagePerformance = this.calculateOverallGrade(benchmarks)
		report.summary.recommendations = this.generateBenchmarkRecommendations(benchmarks)

		return report
	}

	// Private helper methods
	private calculateCurrentPerformance(metrics: ToolMetrics): CurrentPerformance {
		const recentExecutions = metrics.recentExecutions.slice(-10)

		if (recentExecutions.length === 0) {
			return {
				status: "no_recent_data",
				averageDuration: 0,
				successRate: 0,
				errorRate: 0,
				memoryEfficiency: 0,
			}
		}

		const successfulExecutions = recentExecutions.filter((e) => e.success)
		const successRate = successfulExecutions.length / recentExecutions.length
		const errorRate = 1 - successRate

		const averageDuration = recentExecutions.reduce((sum, e) => sum + e.duration, 0) / recentExecutions.length
		const averageMemoryDelta = recentExecutions.reduce((sum, e) => sum + e.memoryDelta, 0) / recentExecutions.length

		return {
			status: "calculated",
			averageDuration,
			successRate,
			errorRate,
			memoryEfficiency: this.calculateMemoryEfficiency(averageMemoryDelta),
		}
	}

	private calculateTrends(metrics: ToolMetrics): PerformanceTrends {
		const recentExecutions = metrics.recentExecutions

		if (recentExecutions.length < 5) {
			return {
				status: "insufficient_data",
				durationTrend: "stable",
				errorTrend: "stable",
				memoryTrend: "stable",
			}
		}

		const durationTrend = this.calculateTrend(recentExecutions.map((e) => e.duration))
		const errorTrend = this.calculateTrend(recentExecutions.map((e) => (e.success ? 0 : 1)))
		const memoryTrend = this.calculateTrend(recentExecutions.map((e) => e.memoryDelta))

		return {
			status: "calculated",
			durationTrend: this.classifyTrend(durationTrend),
			errorTrend: this.classifyTrend(errorTrend),
			memoryTrend: this.classifyTrend(memoryTrend),
		}
	}

	private calculateTrend(values: number[]): number {
		if (values.length < 2) return 0

		const n = values.length
		const x = Array.from({ length: n }, (_, i) => i)
		const sumX = x.reduce((sum, val) => sum + val, 0)
		const sumY = values.reduce((sum, val) => sum + val, 0)
		const sumXY = x.reduce((sum, val, i) => sum + val * values[i], 0)
		const sumXX = x.reduce((sum, val) => sum + val * val, 0)

		return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
	}

	private classifyTrend(slope: number): "improving" | "degrading" | "stable" {
		const threshold = 0.01

		if (slope > threshold) return "degrading"
		if (slope < -threshold) return "improving"
		return "stable"
	}

	private calculateMemoryEfficiency(memoryDelta: number): number {
		return Math.max(0, 1 - memoryDelta / (50 * 1024 * 1024)) // Normalize to 50MB
	}

	private generateRecommendations(metrics: ToolMetrics): string[] {
		const recommendations: string[] = []

		if (metrics.averageDuration > 5000) {
			recommendations.push("Consider optimizing tool execution for better performance")
		}

		if (metrics.failedExecutions / metrics.totalExecutions > 0.1) {
			recommendations.push("High error rate detected, review error handling")
		}

		if (metrics.averageMemoryDelta > 10 * 1024 * 1024) {
			recommendations.push("High memory usage detected, consider memory optimization")
		}

		return recommendations
	}

	private checkAlerts(toolName: string, metrics: ToolMetrics): Alert[] {
		const alerts: Alert[] = []
		const threshold = this.alertThresholds.get(toolName)

		if (!threshold) return alerts

		if (metrics.averageDuration > threshold.maxDuration) {
			alerts.push({
				type: "duration",
				severity: "warning",
				message: `Average duration exceeds threshold`,
				value: metrics.averageDuration,
				threshold: threshold.maxDuration,
			})
		}

		const errorRate = metrics.failedExecutions / metrics.totalExecutions
		if (errorRate > threshold.maxErrorRate) {
			alerts.push({
				type: "error_rate",
				severity: "critical",
				message: `Error rate exceeds threshold`,
				value: errorRate,
				threshold: threshold.maxErrorRate,
			})
		}

		return alerts
	}

	private setupDefaultThresholds(): void {
		this.alertThresholds.set("write_to_file", {
			maxDuration: 2000,
			maxErrorRate: 0.05,
			maxMemoryDelta: 5 * 1024 * 1024,
		})

		this.alertThresholds.set("read_file", {
			maxDuration: 1000,
			maxErrorRate: 0.02,
			maxMemoryDelta: 2 * 1024 * 1024,
		})

		this.alertThresholds.set("execute_command", {
			maxDuration: 10000,
			maxErrorRate: 0.1,
			maxMemoryDelta: 20 * 1024 * 1024,
		})
	}

	private calculatePerformanceGrade(analysis: PerformanceAnalysis): "A+" | "A" | "B" | "C" | "D" | "F" {
		const { currentPerformance } = analysis

		if (currentPerformance.successRate >= 0.99 && currentPerformance.averageDuration < 500) {
			return "A+"
		}

		if (currentPerformance.successRate >= 0.95 && currentPerformance.averageDuration < 1000) {
			return "A"
		}

		if (currentPerformance.successRate >= 0.9 && currentPerformance.averageDuration < 2000) {
			return "B"
		}

		if (currentPerformance.successRate >= 0.8 && currentPerformance.averageDuration < 5000) {
			return "C"
		}

		if (currentPerformance.successRate >= 0.7) {
			return "D"
		}

		return "F"
	}

	private calculatePerformanceScore(analysis: PerformanceAnalysis): number {
		const { currentPerformance } = analysis

		const successScore = currentPerformance.successRate * 100
		const speedScore = Math.max(0, 100 - currentPerformance.averageDuration / 100) // 100ms = perfect
		const memoryScore = currentPerformance.memoryEfficiency * 100

		return successScore * 0.5 + speedScore * 0.3 + memoryScore * 0.2
	}

	private calculateOverallGrade(benchmarks: ToolBenchmark[]): "excellent" | "good" | "fair" | "poor" {
		if (benchmarks.length === 0) return "fair"

		const grades = benchmarks.map((b) => this.calculatePerformanceGrade(b.analysis))
		const gradeScores = grades.map((grade) => this.gradeToScore(grade))
		const averageScore = gradeScores.reduce((sum, score) => sum + score, 0) / gradeScores.length

		if (averageScore >= 90) return "excellent"
		if (averageScore >= 80) return "good"
		if (averageScore >= 70) return "fair"
		return "poor"
	}

	private gradeToScore(grade: string): number {
		const gradeMap: Record<string, number> = {
			"A+": 95,
			A: 90,
			B: 80,
			C: 70,
			D: 60,
			F: 50,
		}

		return gradeMap[grade] || 50
	}

	private generateBenchmarkRecommendations(benchmarks: ToolBenchmark[]): string[] {
		const recommendations: string[] = []
		const poorPerformers = benchmarks.filter((b) => ["D", "F"].includes(b.grade))

		if (poorPerformers.length > 0) {
			recommendations.push(`${poorPerformers.length} tools need immediate optimization`)
		}

		const slowTools = benchmarks.filter((b) => b.analysis.currentPerformance.averageDuration > 5000)
		if (slowTools.length > 0) {
			recommendations.push(`${slowTools.length} tools have performance issues`)
		}

		return recommendations
	}
}

// Supporting interfaces
interface BenchmarkReport {
	timestamp: Date
	tools: Record<string, ToolBenchmark>
	summary: {
		totalTools: number
		averagePerformance: "excellent" | "good" | "fair" | "poor"
		recommendations: string[]
	}
}

interface ToolBenchmark {
	toolName: string
	metrics: ToolMetrics
	analysis: PerformanceAnalysis
	grade: "A+" | "A" | "B" | "C" | "D" | "F"
	rank: number
}
```

---

## 5. Dependencies Analysis

### Prerequisites from Task 1.1-1.4, 2.1-2.6

Based on tasklist analysis, following must be completed first:

1. **Task 1.1**: LangChain/LangGraph dependencies installed
2. **Task 1.2**: LangGraph tool wrapper base class created
3. **Task 1.3**: Zod schema validation system implemented
4. **Task 1.4**: Transitional execution layer implemented
5. **Task 2.1-2.6**: All tool wrappers implemented

### Current Dependencies

From package.json analysis:

- **Node.js performance API**: Built-in performance monitoring
- **Node.js process API**: Memory and CPU usage tracking
- **EventEmitter**: Event-driven architecture
- **No external dependencies**: Self-contained monitoring system

### File Dependencies

- [ ] `src/tools/wrappers/`: Tool wrappers to monitor
- [ ] `src/tools/registry/`: Tool registry for integration
- [ ] `src/core/task/Task.ts`: Existing tool usage tracking
- [ ] `src/shared/cost.ts`: Existing cost tracking patterns

---

## 6. Testing Strategy

### Unit Test Structure

**File**: `src/tests/tools/monitoring/ToolPerformanceMonitor.test.ts`

```typescript
import { describe, test, expect, beforeEach, afterEach } from "vitest"
import { ToolPerformanceMonitor } from "../../../tools/monitoring/ToolPerformanceMonitor"

describe("ToolPerformanceMonitor", () => {
	let monitor: ToolPerformanceMonitor

	beforeEach(() => {
		monitor = new ToolPerformanceMonitor()
	})

	test("should track tool execution", async () => {
		const toolName = "test-tool"
		const executionId = monitor.startExecution(toolName)

		expect(executionId).toBeDefined()
		expect(monitor.getActiveExecutions()).toHaveLength(1)

		// Simulate tool execution
		await new Promise((resolve) => setTimeout(resolve, 100))

		monitor.completeExecution(executionId, "test-result")

		const metrics = monitor.getToolMetrics(toolName)
		expect(metrics).toBeDefined()
		expect(metrics!.totalExecutions).toBe(1)
		expect(metrics!.successfulExecutions).toBe(1)
	})

	test("should record execution duration", async () => {
		const toolName = "test-tool"
		const executionId = monitor.startExecution(toolName)

		// Simulate 100ms execution
		await new Promise((resolve) => setTimeout(resolve, 100))

		monitor.completeExecution(executionId)

		const metrics = monitor.getToolMetrics(toolName)
		expect(metrics!.averageDuration).toBeGreaterThan(90)
		expect(metrics!.averageDuration).toBeLessThan(110)
	})

	test("should handle execution errors", async () => {
		const toolName = "test-tool"
		const executionId = monitor.startExecution(toolName)

		monitor.completeExecution(executionId, undefined, "Test error")

		const metrics = monitor.getToolMetrics(toolName)
		expect(metrics!.failedExecutions).toBe(1)
		expect(metrics!.successfulExecutions).toBe(0)
	})

	test("should generate performance reports", () => {
		// Add some test data
		const executionId1 = monitor.startExecution("tool1")
		monitor.completeExecution(executionId1, "result1")

		const executionId2 = monitor.startExecution("tool2")
		monitor.completeExecution(executionId2, undefined, "error")

		const report = monitor.generateReport()

		expect(report.tools).toHaveProperty("tool1")
		expect(report.tools).toHaveProperty("tool2")
		expect(report.tools.tool1.summary.performanceStatus).toBe("excellent")
		expect(report.tools.tool2.summary.performanceStatus).toBe("warning")
	})
})
```

### Integration Testing

- Test monitoring with actual tool wrappers
- Verify performance data accuracy
- Test alert generation and notification
- Validate memory usage tracking
- Test report generation and export

---

## 7. Implementation Checklist

### Pre-Implementation

- [ ] Review existing performance patterns in codebase
- [ ] Define monitoring requirements and metrics
- [ ] Plan alert thresholds and anomaly detection
- [ ] Design performance analytics algorithms

### Implementation Steps

1. [ ] Create ToolPerformanceMonitor with execution tracking
2. [ ] Implement MetricsCollector with Prometheus-style metrics
3. [ ] Create PerformanceAnalytics with trend analysis
4. [ ] Add anomaly detection and alerting
5. [ ] Implement performance benchmarking
6. [ ] Add memory and CPU usage monitoring
7. [ ] Create comprehensive unit tests
8. [ ] Add integration tests with real tools

### Post-Implementation

- [ ] Run TypeScript compilation: `cd src && npm run check-types`
- [ ] Execute unit tests: `cd src && npx vitest run tools/monitoring/`
- [ ] Test monitoring with actual tool executions
- [ ] Validate performance overhead (<1% requirement)
- [ ] Test alert generation and notification

---

## 8. Risk Mitigation

### Technical Risks

1. **Performance Overhead**: Monitoring system may impact tool performance

    - **Mitigation**: Efficient data structures, minimal overhead design
    - **Monitoring**: Track monitoring system performance separately

2. **Memory Leaks**: Metrics storage may accumulate memory

    - **Mitigation**: Circular buffers, automatic cleanup
    - **Testing**: Memory usage monitoring and leak detection

3. **Data Accuracy**: Performance measurements may be inaccurate
    - **Mitigation**: High-precision timing, validation checks
    - **Testing**: Compare with external monitoring tools

### Integration Risks

1. **Tool Compatibility**: Monitoring may interfere with tool execution

    - **Mitigation**: Non-intrusive monitoring, async operation
    - **Testing**: Comprehensive compatibility testing

2. **Alert Fatigue**: Too many alerts may overwhelm users
    - **Mitigation**: Intelligent alerting, rate limiting
    - **Strategy**: Configurable thresholds, alert aggregation

---

## 9. Success Criteria

### Functional Requirements

- [ ] Real-time tool execution monitoring
- [ ] Comprehensive metrics collection (timing, memory, CPU)
- [ ] Performance trend analysis and anomaly detection
- [ ] Configurable alert thresholds and notification
- [ ] Performance benchmarking and grading
- [ ] Detailed reporting and data export
- [ ] Integration with existing tool usage tracking

### Quality Requirements

- [ ] Unit test coverage >95%
- [ ] Integration test coverage >90%
- [ ] Performance overhead <1% of tool execution time
- [ ] Memory usage <5MB for monitoring system
- [ ] TypeScript strict mode compliance
- [ ] Real-time monitoring with <10ms latency

### Analytics Requirements

- [ ] Accurate performance trend detection
- [ ] Effective anomaly detection with <5% false positives
- [ ] Comprehensive performance grading system
- [ ] Actionable recommendations generation
- [ ] Historical data retention and analysis

---

## 10. External References

### Performance Monitoring

- [Node.js Performance API](https://nodejs.org/api/perf_hooks.html): Performance monitoring in Node.js
- [Prometheus Metrics](https://prometheus.io/docs/concepts/metric_types/): Metrics collection patterns
- [Grafana Dashboard](https://grafana.com/docs/): Performance visualization

### Analytics Libraries

- [Stats.js](https://github.com/mrdoob/stats.js): Statistics calculation
- [Simple Statistics](https://github.com/tmcw/simple-statistics): Trend analysis
- [Anomaly Detection](https://github.com/ServiceNow/anomaly-detector): Anomaly detection algorithms

### Best Practices

- [Performance Monitoring](https://www.patterns.dev/posts/performance-monitoring): Monitoring patterns
- [Metrics Collection](https://www.oreilly.com/library/view/0596000129743994): Metrics collection strategies
- [Alerting Systems](https://www.oreilly.com/library/view/0596000129743994): Alert design patterns

---

**Note**: This context provides comprehensive performance monitoring implementation guidance based on analysis of existing patterns, external best practices, and established monitoring architectures. All implementation steps should follow existing conventions while providing robust, low-overhead performance monitoring capabilities.
