# Context Document for Task 3.4: Tool execution monitoring and logging

## Task Information

- **Task ID**: 3.4
- **Description**: Implement comprehensive monitoring and logging for LangChain tool execution
- **Status**: ☐ To Do
- **Target Files**:
    - `src/monitoring/ToolExecutionMonitor.ts`
    - `src/monitoring/ExecutionLogger.ts`
    - `src/monitoring/PerformanceTracker.ts`
    - **Modify Existing**: Update `src/core/tools/retry/RetryLogger.ts` to integrate with new monitoring system

## 1. Current Code Analysis (Internal)

### Existing Logging Infrastructure

From codebase analysis, found comprehensive logging patterns:

#### RetryLogger Pattern

```typescript
// From src/core/tools/retry/RetryLogger.ts
interface RetryLogEntry {
	timestamp: number
	level: "debug" | "info" | "warn" | "error"
	retryId: string
	toolName: string
	message: string
	data?: Record<string, any>
	attempt?: number
	error?: Error
}

class RetryLogger {
	private logs: RetryLogEntry[] = []
	private maxLogEntries: number
	private detailedLogging: boolean

	info(retryId: string, toolName: string, message: string, data?: Record<string, any>, attempt?: number): void
	error(
		retryId: string,
		toolName: string,
		message: string,
		error?: Error,
		data?: Record<string, any>,
		attempt?: number,
	): void
	getToolLogs(toolName: string): RetryLogEntry[]
	getRetryLogs(retryId: string): RetryLogEntry[]
}
```

#### Performance Monitoring Pattern

```typescript
// From src/core/condense/performance.ts
class PerformanceMonitor {
	private isMonitoring: boolean = false
	private startTime?: number
	private operations: PerformanceOperation[] = []

	startMonitoring(): void
	stopMonitoring(): MonitoringStatus
	getMonitoringStatus(): MonitoringStatus
}

interface PerformanceOperation {
	name: string
	startTime: number
	endTime: number
	duration: number
	memoryBefore: number
	memoryAfter: number
}
```

#### Tool Usage Tracking Pattern

```typescript
// From src/core/task/Task.ts
interface ToolUsage {
	[toolName: string]: {
		count: number
		totalDuration: number
		averageDuration: number
		lastUsed: number
	}
}

class Task {
	toolUsage: ToolUsage = {}

	recordToolUsage(toolName: ToolName): void
	recordToolError(toolName: ToolName, error?: string): void
}
```

### Current Monitoring Patterns

Found existing monitoring in multiple locations:

#### API Metrics Tracking

```typescript
// From src/shared/getApiMetrics.ts
export function getApiMetrics(messages: ClineMessage[]): TokenUsage {
	const result: TokenUsage = {
		totalTokensIn: 0,
		totalTokensOut: 0,
		totalCacheWrites: undefined,
		totalCacheReads: undefined,
		totalCost: 0,
		contextTokens: 0,
	}

	// Calculate running totals from message history
	messages.forEach((message) => {
		if (message.type === "say" && message.say === "api_req_started" && message.text) {
			const parsedText: ParsedApiReqStartedTextType = JSON.parse(message.text)
			const { tokensIn, tokensOut, cacheWrites, cacheReads, cost } = parsedText
			// Update totals
		}
	})

	return result
}
```

#### Terminal Process Monitoring

```typescript
// From src/integrations/terminal/__tests__/TerminalProcessExec.bash.spec.ts
console.log(`Large output command (${lines} lines) execution time: ${executionTimeUs} microseconds`)
```

#### Benchmark Performance Tracking

```typescript
// From src/integrations/misc/__tests__/performance/processCarriageReturns.benchmark.ts
function runPerformanceTest(name: string, fn: Function, input: string, iterations: number, args: any[] = []) {
	// Pre-warm
	const warmupResult = fn(input, ...args)

	// Measure performance
	const durations: number[] = []
	for (let i = 0; i < iterations; i++) {
		const startTime = performance.now()
		fn(input, ...args)
		const endTime = performance.now()
		durations.push(endTime - startTime)
	}

	// Calculate stats
	const stats = calculateStats(durations)
	return { stats, resultSize, reduction, averageThroughput, peakThroughput }
}
```

## 2. External Best Practices (GitHub)

### Best Practice Example 1: Comprehensive Tool Monitoring

**Source**: https://github.com/langchain-ai/langchainjs  
**Stars**: 12,000+ | **Language**: TypeScript

```typescript
// Advanced tool execution monitoring
class ToolExecutionMonitor {
	private executionHistory: ToolExecutionRecord[] = []
	private performanceMetrics: Map<string, PerformanceMetrics> = new Map()
	private alertThresholds: AlertThresholds

	async monitorToolExecution(
		toolName: string,
		parameters: Record<string, any>,
		execution: () => Promise<any>,
	): Promise<ToolExecutionResult> {
		const executionId = generateExecutionId()
		const startTime = performance.now()
		const memoryBefore = process.memoryUsage().heapUsed

		try {
			// Log execution start
			this.logExecutionStart(executionId, toolName, parameters)

			// Execute tool with monitoring
			const result = await this.executeWithMonitoring(toolName, execution, executionId)

			// Calculate metrics
			const endTime = performance.now()
			const memoryAfter = process.memoryUsage().heapUsed
			const duration = endTime - startTime

			// Record execution
			const record: ToolExecutionRecord = {
				executionId,
				toolName,
				parameters,
				result,
				duration,
				memoryDelta: memoryAfter - memoryBefore,
				timestamp: Date.now(),
				status: "success",
			}

			this.executionHistory.push(record)
			this.updatePerformanceMetrics(toolName, duration, memoryAfter - memoryBefore)

			// Check for performance alerts
			this.checkPerformanceAlerts(toolName, duration, memoryAfter - memoryBefore)

			return result
		} catch (error) {
			// Log execution failure
			this.logExecutionFailure(executionId, toolName, error)
			throw error
		}
	}

	private updatePerformanceMetrics(toolName: string, duration: number, memoryDelta: number): void {
		const existing = this.performanceMetrics.get(toolName) || {
			count: 0,
			totalDuration: 0,
			averageDuration: 0,
			maxDuration: 0,
			minDuration: Infinity,
			totalMemoryDelta: 0,
			averageMemoryDelta: 0,
		}

		existing.count++
		existing.totalDuration += duration
		existing.averageDuration = existing.totalDuration / existing.count
		existing.maxDuration = Math.max(existing.maxDuration, duration)
		existing.minDuration = Math.min(existing.minDuration, duration)
		existing.totalMemoryDelta += memoryDelta
		existing.averageMemoryDelta = existing.totalMemoryDelta / existing.count

		this.performanceMetrics.set(toolName, existing)
	}
}
```

**Key Takeaways**:

- Execution ID tracking for correlation
- Performance metrics aggregation
- Memory usage monitoring
- Alert threshold checking
- Comprehensive execution history

### Best Practice Example 2: Structured Logging for Tools

**Source**: https://github.com/winstonjs/winston  
**Stars**: 22,000+ | **Language**: TypeScript

```typescript
// Structured logging for tool execution
class ToolExecutionLogger {
	private logger: Logger

	constructor() {
		this.logger = winston.createLogger({
			level: "info",
			format: winston.format.combine(
				winston.format.timestamp(),
				winston.format.errors({ stack: true }),
				winston.format.json(),
			),
			transports: [
				new winston.transports.File({ filename: "tool-execution.log" }),
				new winston.transports.Console({
					format: winston.format.simple(),
				}),
			],
		})
	}

	logToolStart(toolName: string, parameters: Record<string, any>, executionId: string): void {
		this.logger.info("Tool execution started", {
			event: "tool_start",
			toolName,
			executionId,
			parameters: this.sanitizeParameters(parameters),
			timestamp: new Date().toISOString(),
		})
	}

	logToolSuccess(toolName: string, result: any, duration: number, executionId: string): void {
		this.logger.info("Tool execution completed", {
			event: "tool_success",
			toolName,
			executionId,
			duration,
			resultSize: this.calculateResultSize(result),
			timestamp: new Date().toISOString(),
		})
	}

	logToolError(toolName: string, error: Error, duration: number, executionId: string): void {
		this.logger.error("Tool execution failed", {
			event: "tool_error",
			toolName,
			executionId,
			duration,
			error: {
				message: error.message,
				stack: error.stack,
				name: error.name,
			},
			timestamp: new Date().toISOString(),
		})
	}

	private sanitizeParameters(parameters: Record<string, any>): Record<string, any> {
		// Remove sensitive data from parameters
		const sanitized = { ...parameters }
		const sensitiveKeys = ["password", "token", "apiKey", "secret"]

		for (const key of sensitiveKeys) {
			if (key in sanitized) {
				sanitized[key] = "[REDACTED]"
			}
		}

		return sanitized
	}
}
```

**Key Takeaways**:

- Structured JSON logging format
- Event-based log categorization
- Parameter sanitization for security
- Multiple transport support
- Error stack capture

### Best Practice Example 3: Real-time Performance Tracking

**Source**: https://github.com/elastic/apm-agent-nodejs  
**Stars**: 1,500+ | **Language**: TypeScript

```typescript
// Real-time performance tracking for tool execution
class PerformanceTracker {
	private metrics: Map<string, MetricSeries> = new Map()
	private alerts: AlertRule[] = []
	private isCollecting: boolean = false

	startCollection(): void {
		this.isCollecting = true
		this.startPeriodicCollection()
	}

	stopCollection(): void {
		this.isCollecting = false
		this.stopPeriodicCollection()
	}

	recordExecution(toolName: string, duration: number, success: boolean): void {
		if (!this.isCollecting) return

		const timestamp = Date.now()
		const series = this.getOrCreateSeries(toolName)

		// Add data point
		series.dataPoints.push({
			timestamp,
			duration,
			success,
			memoryUsage: process.memoryUsage().heapUsed,
		})

		// Keep only recent data points (last 1000)
		if (series.dataPoints.length > 1000) {
			series.dataPoints = series.dataPoints.slice(-1000)
		}

		// Check alerts
		this.checkAlerts(toolName, series)
	}

	getMetrics(toolName: string, timeRange?: TimeRange): MetricSummary {
		const series = this.metrics.get(toolName)
		if (!series) return null

		let dataPoints = series.dataPoints
		if (timeRange) {
			const now = Date.now()
			dataPoints = dataPoints.filter((dp) => dp.timestamp >= now - timeRange.duration)
		}

		if (dataPoints.length === 0) return null

		const durations = dataPoints.map((dp) => dp.duration)
		const successRate = dataPoints.filter((dp) => dp.success).length / dataPoints.length

		return {
			count: dataPoints.length,
			averageDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
			minDuration: Math.min(...durations),
			maxDuration: Math.max(...durations),
			p95Duration: this.calculatePercentile(durations, 0.95),
			p99Duration: this.calculatePercentile(durations, 0.99),
			successRate,
			timeRange,
		}
	}

	private checkAlerts(toolName: string, series: MetricSeries): void {
		const recentData = series.dataPoints.slice(-10) // Last 10 executions

		for (const alert of this.alerts) {
			if (alert.toolName && alert.toolName !== toolName) continue

			const triggered = alert.evaluate(recentData)
			if (triggered) {
				this.sendAlert(alert, toolName, recentData)
			}
		}
	}
}
```

**Key Takeaways**:

- Time-series data collection
- Real-time alerting
- Statistical analysis (percentiles)
- Configurable time ranges
- Rolling window data management

## 3. Internal Knowledge Base (Memory)

### Cached Knowledge

**Topic**: "Tool execution monitoring and logging"
**Entity Type**: "Implementation Pattern"
**Last Used**: 2025-11-11T20:50:12.680Z
**Content**: [Previously saved best practices for comprehensive tool monitoring]

### Related Memories

- **Entity**: "RetryLogger"

    - **Relevance**: Existing logging infrastructure can be extended
    - **Content**: Current retry logging patterns and log entry structures

- **Entity**: "Performance Monitoring"

    - **Relevance**: Existing performance tracking can be integrated
    - **Content**: PerformanceManager and monitoring status tracking

- **Entity**: "Tool Usage Tracking"
    - **Relevance**: Current tool usage patterns in Task class
    - **Content**: Tool usage statistics and error tracking

## 4. Suggested Implementation Plan

### Prerequisites

1. [ ] Review existing RetryLogger functionality
2. [ ] Analyze current performance monitoring patterns
3. [ ] Understand tool usage tracking in Task class

### Implementation Steps

1. [ ] **Create ToolExecutionMonitor.ts**

    - **Purpose**: Core monitoring logic for tool execution
    - **Location**: `src/monitoring/ToolExecutionMonitor.ts`
    - **Key Methods**:
        - `monitorToolExecution()`: Main monitoring wrapper
        - `recordExecutionMetrics()`: Record performance data
        - `checkPerformanceAlerts()`: Alert threshold checking
        - `getExecutionHistory()`: Retrieve execution records

2. [ ] **Create ExecutionLogger.ts**

    - **Purpose**: Structured logging for tool execution events
    - **Location**: `src/monitoring/ExecutionLogger.ts`
    - **Key Methods**:
        - `logToolStart()`: Log execution start
        - `logToolSuccess()`: Log successful completion
        - `logToolError()`: Log execution failures
        - `sanitizeParameters()`: Remove sensitive data

3. [ ] **Create PerformanceTracker.ts**

    - **Purpose**: Real-time performance tracking and analysis
    - **Location**: `src/monitoring/PerformanceTracker.ts`
    - **Key Methods**:
        - `recordExecution()`: Record performance data point
        - `getMetrics()`: Retrieve performance statistics
        - `checkAlerts()\*\*: Evaluate alert conditions
        - `calculatePercentiles()\*\*: Statistical analysis

4. [ ] **Modify RetryLogger.ts Integration**

    - **File**: `src/core/tools/retry/RetryLogger.ts`
    - **Purpose**: Integrate with new monitoring system
    - **Changes**:
        - Add monitoring system integration
        - Extend log entry structure for monitoring data
        - Provide backward compatibility with existing logging

5. [ ] **Create Monitoring Configuration**
    - **File**: `src/monitoring/MonitoringConfig.ts`
    - **Purpose**: Configuration for monitoring settings
    - **Features**:
        - Alert thresholds configuration
        - Log level settings
        - Performance tracking options
        - Data retention policies

### Validation Steps

1. [ ] Test monitoring with various tool executions
2. [ ] Verify performance tracking accuracy
3. [ ] Test alert generation and notification
4. [ ] Validate log formatting and sanitization
5. [ ] Test integration with existing RetryLogger

### Testing Strategy

1. [ ] **Unit Tests**: Test each monitoring component

    - Mock tool executions
    - Verify metric collection accuracy
    - Test alert threshold logic

2. [ ] **Integration Tests**: Test with real tool executions

    - Verify end-to-end monitoring flow
    - Test with LangChain tool wrappers
    - Validate data persistence

3. [ ] **Performance Tests**: Ensure monitoring overhead is minimal
    - Measure monitoring system overhead
    - Ensure <5% performance impact requirement
    - Test with high-frequency tool executions

## 5. Dependencies

### Task Dependencies

- [ ] **Task 3.1**: LangGraph tool execution bridge must be implemented

    - **Reason**: Monitoring needs to integrate with bridge execution
    - **Status**: ☐ To Do

- [ ] **Task 3.3**: State synchronization must be established
    - **Reason**: Monitoring should track synchronization operations
    - **Status**: ☐ To Do

### File Dependencies

- [ ] **File `src/core/tools/retry/RetryLogger.ts`**: Must be modified

    - **Reason**: Existing logging infrastructure integration point
    - **Status**: ✅ Exists

- [ ] **File `src/core/task/Task.ts`**: Tool usage tracking integration

    - **Reason**: Current tool usage patterns need monitoring integration
    - **Status**: ✅ Exists

- [ ] **File `src/core/condense/performance.ts`**: Performance monitoring integration
    - **Reason**: Existing performance patterns can be leveraged
    - **Status**: ✅ Exists

### External Dependencies

- [ ] **Package `winston`**: Recommended for structured logging
- [ ] **Package `@types/node`**: For process.memoryUsage() and performance APIs
- [ ] **Existing performance APIs**: Node.js built-in performance monitoring

## 6. Notes and Warnings

### Important Considerations

1. **Performance Impact**: Monitoring must add <5% execution overhead
2. **Data Privacy**: Sensitive parameters must be sanitized in logs
3. **Storage Management**: Log files and metrics need rotation policies
4. **Real-time Requirements**: Monitoring should not block tool execution
5. **Alert Fatigue**: Alert thresholds must be carefully configured

### Potential Issues

1. **Memory Usage**: Extensive monitoring may increase memory consumption
2. **Log Volume**: High-frequency tool execution may generate large log files
3. **Performance Overhead**: Additional monitoring code may impact tool execution speed
4. **Data Accuracy**: Performance measurements must be precise and consistent

### Breaking Changes

- **Minimal**: This is additive monitoring functionality
- **Configuration**: May need feature flags for gradual rollout
- **Integration**: Existing RetryLogger interface must be preserved

---

**Context Generated By**: context-engineer agent
**Review Status**: Pending Review
**Reviewer**: code agent
