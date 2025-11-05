# Context Compression Control - Error Handling Guide

This guide documents error handling patterns and best practices for developers working on the Context Compression Control feature.

## Table of Contents

- [Overview](#overview)
- [Error Handling Architecture](#error-handling-architecture)
- [Error Categories](#error-categories)
- [Recovery Strategies](#recovery-strategies)
- [Implementation Patterns](#implementation-patterns)
- [Best Practices](#best-practices)
- [Testing Error Scenarios](#testing-error-scenarios)
- [Monitoring and Logging](#monitoring-and-logging)
- [Common Pitfalls](#common-pitfalls)
- [Migration Guide](#migration-guide)

## Overview

The Context Compression Control feature implements a comprehensive error handling system designed to:

- Provide consistent error handling across all components
- Enable graceful recovery from error conditions
- Maintain system stability under error conditions
- Offer clear feedback to users and developers

### Key Principles

1. **Fail Fast, Fail Gracefully**: Detect errors early but handle them gracefully
2. **User-Centric Recovery**: Provide users with actionable recovery options
3. **Developer-Friendly**: Include detailed context for debugging
4. **Consistent Patterns**: Use standardized error handling throughout
5. **Event-Driven**: Use events for loose coupling and extensibility

## Error Handling Architecture

### Core Components

```
ErrorHandler (Centralized)
├── Error Categorization
├── Recovery Strategies
├── Event Emission
└── Logging Integration

FileRecovery (Specialized)
├── Backup Management
├── Integrity Verification
├── Template Recreation
└── Cleanup Routines

PerformanceMonitor (Monitoring)
├── Metrics Collection
├── Threshold Monitoring
├── Trend Analysis
└── Alert Generation
```

### Error Flow

```
Error Occurs
    ↓
Error Detection
    ↓
Error Categorization
    ↓
Recovery Strategy Selection
    ↓
Recovery Execution
    ↓
Event Emission
    ↓
Logging & Monitoring
```

## Error Categories

### 1. File System Errors

**Description**: Errors related to file operations, permissions, and disk space

**Common Scenarios**:

- Permission denied
- File not found
- Disk full
- File locked by another process

**Handling Pattern**:

```typescript
try {
	await fs.writeFile(filePath, content)
} catch (error) {
	const errorInfo = await errorHandler.handleError(
		error,
		{
			component: "ContextFileManager",
			operation: "writeFile",
			filepath: filePath,
			timestamp: Date.now(),
		},
		"file-system",
	)

	if (errorInfo.recoveryStrategy === "retry") {
		// Implement retry logic
	} else if (errorInfo.recoveryStrategy === "user-action") {
		// Prompt user for action
	}
}
```

### 2. Network Errors

**Description**: Errors related to network connectivity and remote operations

**Common Scenarios**:

- Connection timeout
- DNS resolution failure
- HTTP errors
- Intermittent connectivity

**Handling Pattern**:

```typescript
try {
	const response = await fetch(url, options)
} catch (error) {
	const errorInfo = await errorHandler.handleError(
		error,
		{
			component: "ApiClient",
			operation: "fetch",
			url: url,
			timestamp: Date.now(),
		},
		"network",
	)

	// Implement exponential backoff retry
	if (errorInfo.recoveryStrategy === "retry") {
		await this.retryWithBackoff(operation, errorInfo.retryCount)
	}
}
```

### 3. Permission Errors

**Description**: Errors related to access rights and security restrictions

**Common Scenarios**:

- Insufficient privileges
- Access denied
- Security policy violations

**Handling Pattern**:

```typescript
try {
	await this.performPrivilegedOperation()
} catch (error) {
	const errorInfo = await errorHandler.handleError(
		error,
		{
			component: "SecurityManager",
			operation: "privilegedOperation",
			timestamp: Date.now(),
		},
		"permission",
	)

	// Provide user with clear guidance
	this.showPermissionErrorDialog(errorInfo.userActionMessage)
}
```

### 4. Validation Errors

**Description**: Errors related to data validation and format issues

**Common Scenarios**:

- Invalid input data
- Schema validation failures
- Type mismatches

**Handling Pattern**:

```typescript
function validateContextData(data: any): ValidationResult {
	try {
		// Validate data structure
		if (!data.items || !Array.isArray(data.items)) {
			throw new ValidationError("Invalid context items structure")
		}

		return { valid: true }
	} catch (error) {
		const errorInfo = errorHandler.handleError(
			error,
			{
				component: "DataValidator",
				operation: "validateContextData",
				timestamp: Date.now(),
			},
			"validation",
		)

		return {
			valid: false,
			errors: [errorInfo.message],
			recoveryOptions: errorInfo.recoveryOptions,
		}
	}
}
```

## Recovery Strategies

### 1. Retry Strategy

**Use Case**: Transient errors that may resolve on retry

**Implementation**:

```typescript
class RetryHandler {
	async executeWithRetry<T>(
		operation: () => Promise<T>,
		maxRetries: number = 3,
		backoffMs: number = 1000,
	): Promise<T> {
		let lastError: Error

		for (let attempt = 0; attempt <= maxRetries; attempt++) {
			try {
				return await operation()
			} catch (error) {
				lastError = error as Error

				if (attempt === maxRetries) {
					throw lastError
				}

				// Exponential backoff
				const delay = backoffMs * Math.pow(2, attempt)
				await new Promise((resolve) => setTimeout(resolve, delay))
			}
		}

		throw lastError!
	}
}
```

### 2. Fallback Strategy

**Use Case**: When primary operation fails, use alternative approach

**Implementation**:

```typescript
class FallbackHandler {
	async executeWithFallback<T>(primaryOperation: () => Promise<T>, fallbackOperation: () => Promise<T>): Promise<T> {
		try {
			return await primaryOperation()
		} catch (primaryError) {
			console.warn("Primary operation failed, using fallback:", primaryError)

			try {
				return await fallbackOperation()
			} catch (fallbackError) {
				// Both operations failed
				throw new Error(`Primary and fallback failed: ${primaryError.message}, ${fallbackError.message}`)
			}
		}
	}
}
```

### 3. Graceful Degradation

**Use Case**: Reduce functionality rather than complete failure

**Implementation**:

```typescript
class GracefulDegradation {
	async getFeatureWithFallback(): Promise<Partial<FeatureData>> {
		try {
			// Try full feature
			return await this.getFullFeature()
		} catch (error) {
			console.warn("Full feature unavailable, using reduced version:", error)

			try {
				// Try reduced feature
				return await this.getReducedFeature()
			} catch (reducedError) {
				console.warn("Reduced feature unavailable, using minimal version:", reducedError)

				// Return minimal functionality
				return this.getMinimalFeature()
			}
		}
	}
}
```

### 4. User Action Strategy

**Use Case**: Errors that require user intervention

**Implementation**:

```typescript
class UserActionHandler {
	async handleUserRequiredError(error: Error, context: ErrorContext, actionPrompt: string): Promise<boolean> {
		const errorInfo = await errorHandler.handleError(error, context, "user-action")

		// Show user dialog
		const userChoice = await this.showUserDialog({
			title: "Action Required",
			message: actionPrompt,
			actions: errorInfo.recoveryOptions,
		})

		if (userChoice.action === "retry") {
			return true // User wants to retry
		} else if (userChoice.action === "skip") {
			return false // User wants to skip
		} else {
			// Handle other user actions
			return await this.executeUserAction(userChoice.action)
		}
	}
}
```

## Implementation Patterns

### 1. Error Boundary Pattern

**Description**: Wrap operations in error boundaries to prevent cascading failures

```typescript
class ErrorBoundary {
	async execute<T>(
		operation: () => Promise<T>,
		errorHandler: ErrorHandler,
		context: ErrorContext,
	): Promise<T | null> {
		try {
			return await operation()
		} catch (error) {
			await errorHandler.handleError(error, context, "boundary")
			return null // Prevent propagation
		}
	}
}

// Usage
const result = await errorBoundary.execute(() => this.processContext(data), errorHandler, {
	component: "ContextProcessor",
	operation: "process",
})
```

### 2. Circuit Breaker Pattern

**Description**: Prevent repeated calls to failing services

```typescript
class CircuitBreaker {
	private failureCount = 0
	private lastFailureTime = 0
	private state: "closed" | "open" | "half-open" = "closed"

	async execute<T>(operation: () => Promise<T>): Promise<T> {
		if (this.state === "open") {
			if (Date.now() - this.lastFailureTime > this.timeout) {
				this.state = "half-open"
			} else {
				throw new Error("Circuit breaker is open")
			}
		}

		try {
			const result = await operation()
			this.onSuccess()
			return result
		} catch (error) {
			this.onFailure()
			throw error
		}
	}

	private onSuccess() {
		this.failureCount = 0
		this.state = "closed"
	}

	private onFailure() {
		this.failureCount++
		this.lastFailureTime = Date.now()

		if (this.failureCount >= this.threshold) {
			this.state = "open"
		}
	}
}
```

### 3. Event-Driven Error Handling

**Description**: Use events for loose coupling and extensibility

```typescript
class ErrorEventEmitter extends EventEmitter {
	emitError(errorInfo: ErrorInfo) {
		this.emit("error", errorInfo)
		this.emit(`error:${errorInfo.category}`, errorInfo)
		this.emit(`error:${errorInfo.component}`, errorInfo)
	}
}

// Error handlers can subscribe to specific error types
errorEmitter.on("error:file-system", (errorInfo) => {
	// Handle file system errors
})

errorEmitter.on("error:network", (errorInfo) => {
	// Handle network errors
})
```

### 4. Contextual Error Handling

**Description**: Include rich context for better debugging

```typescript
interface ErrorContext {
	component: string
	operation: string
	filepath?: string
	userId?: string
	sessionId?: string
	timestamp: number
	metadata?: Record<string, any>
}

class ContextualErrorHandler {
	async handleError(error: Error, context: ErrorContext, category: ErrorCategory): Promise<ErrorInfo> {
		// Enrich error with context
		const enrichedError = {
			...error,
			context,
			category,
			stack: error.stack,
			timestamp: Date.now(),
		}

		// Log with context
		this.logError(enrichedError)

		// Return structured error info
		return this.categorizeAndStrategize(enrichedError)
	}
}
```

## Best Practices

### 1. Always Handle Errors

```typescript
// ❌ Bad - No error handling
const data = await readFile(filePath)

// ✅ Good - Proper error handling
try {
	const data = await readFile(filePath)
} catch (error) {
	await errorHandler.handleError(
		error,
		{
			component: "FileReader",
			operation: "readFile",
			filepath: filePath,
			timestamp: Date.now(),
		},
		"file-system",
	)
}
```

### 2. Provide Context

```typescript
// ❌ Bad - No context
catch (error) {
  console.error('Error:', error.message)
}

// ✅ Good - Rich context
catch (error) {
  await errorHandler.handleError(error, {
    component: 'ContextManager',
    operation: 'compress',
    filepath: contextFile.path,
    contextSize: contextFile.size,
    compressionLevel: settings.compressionLevel,
    timestamp: Date.now()
  }, 'file-system')
}
```

### 3. Use Specific Error Types

```typescript
// ❌ Bad - Generic error
throw new Error("Something went wrong")

// ✅ Good - Specific error types
throw new FileSystemError("File not found", "ENOENT", filePath)
throw new NetworkError("Connection timeout", "ETIMEDOUT", url)
throw new ValidationError("Invalid context size", "INVALID_SIZE", { size: contextSize })
```

### 4. Implement Proper Logging

```typescript
class ErrorLogger {
	async logError(errorInfo: ErrorInfo) {
		// Structured logging
		this.logger.error("Error occurred", {
			message: errorInfo.message,
			category: errorInfo.category,
			component: errorInfo.context.component,
			operation: errorInfo.context.operation,
			timestamp: errorInfo.context.timestamp,
			stack: errorInfo.stack,
		})

		// Send to monitoring
		await this.sendToMonitoring(errorInfo)

		// Store in error database
		await this.storeError(errorInfo)
	}
}
```

### 5. Handle Async Errors

```typescript
// ❌ Bad - Unhandled promise rejection
const promise = someAsyncOperation()

// ✅ Good - Handle async errors
const promise = someAsyncOperation().catch((error) => {
	errorHandler.handleError(
		error,
		{
			component: "AsyncHandler",
			operation: "someAsyncOperation",
			timestamp: Date.now(),
		},
		"async",
	)
})
```

## Testing Error Scenarios

### 1. Unit Testing Error Handling

```typescript
describe("Error Handling", () => {
	it("should handle file system errors", async () => {
		// Mock file system error
		const mockFs = vi.mocked("fs")
		mockFs.readFile.mockRejectedValue(new Error("EACCES: permission denied"))

		const errorHandler = new ErrorHandler()
		const context = {
			component: "TestComponent",
			operation: "readFile",
			filepath: "/test/file.txt",
			timestamp: Date.now(),
		}

		const errorInfo = await errorHandler.handleError(new Error("EACCES: permission denied"), context, "file-system")

		expect(errorInfo.category).toBe("file-system")
		expect(errorInfo.recoveryStrategy).toBe("user-action")
	})
})
```

### 2. Integration Testing Error Recovery

```typescript
describe("Error Recovery Integration", () => {
	it("should recover from network errors with retry", async () => {
		const mockFetch = vi
			.fn()
			.mockRejectedValueOnce(new Error("ETIMEDOUT"))
			.mockRejectedValueOnce(new Error("ETIMEDOUT"))
			.mockResolvedValueOnce({ ok: true, json: () => ({ data: "success" }) })

		global.fetch = mockFetch

		const result = await apiClient.withRetry(() => apiClient.fetchData("/api/data"))

		expect(result).toEqual({ data: "success" })
		expect(mockFetch).toHaveBeenCalledTimes(3)
	})
})
```

### 3. Error Injection Testing

```typescript
class ErrorInjector {
	async testErrorScenarios<T>(operation: () => Promise<T>, errorScenarios: ErrorScenario[]): Promise<TestResult[]> {
		const results: TestResult[] = []

		for (const scenario of errorScenarios) {
			// Inject error
			this.injectError(scenario)

			try {
				await operation()
				results.push({
					scenario: scenario.name,
					success: true,
					error: null,
				})
			} catch (error) {
				results.push({
					scenario: scenario.name,
					success: false,
					error: error as Error,
				})
			}

			// Clean up injection
			this.cleanupInjection(scenario)
		}

		return results
	}
}
```

## Monitoring and Logging

### 1. Error Metrics

```typescript
interface ErrorMetrics {
	totalErrors: number
	errorsByCategory: Record<string, number>
	errorsByComponent: Record<string, number>
	recoverySuccessRate: number
	averageRecoveryTime: number
}

class ErrorMetricsCollector {
	collectMetrics(): ErrorMetrics {
		return {
			totalErrors: this.getTotalErrors(),
			errorsByCategory: this.getErrorsByCategory(),
			errorsByComponent: this.getErrorsByComponent(),
			recoverySuccessRate: this.getRecoverySuccessRate(),
			averageRecoveryTime: this.getAverageRecoveryTime(),
		}
	}
}
```

### 2. Alerting

```typescript
class ErrorAlertManager {
	async checkAlerts(metrics: ErrorMetrics): Promise<Alert[]> {
		const alerts: Alert[] = []

		// Check error rate
		if (metrics.totalErrors > this.errorThreshold) {
			alerts.push({
				type: "high-error-rate",
				severity: "critical",
				message: `Error rate exceeded threshold: ${metrics.totalErrors}`,
			})
		}

		// Check recovery success rate
		if (metrics.recoverySuccessRate < this.recoveryThreshold) {
			alerts.push({
				type: "low-recovery-rate",
				severity: "warning",
				message: `Recovery success rate below threshold: ${metrics.recoverySuccessRate}%`,
			})
		}

		return alerts
	}
}
```

### 3. Dashboard Integration

```typescript
class ErrorDashboard {
	async updateDashboard(metrics: ErrorMetrics): Promise<void> {
		await this.sendMetrics({
			errorRate: metrics.totalErrors,
			errorsByCategory: metrics.errorsByCategory,
			recoveryRate: metrics.recoverySuccessRate,
			timestamp: Date.now(),
		})
	}
}
```

## Common Pitfalls

### 1. Swallowing Errors

```typescript
// ❌ Bad - Swallowing errors
try {
	await riskyOperation()
} catch (error) {
	// Error is silently ignored
}

// ✅ Good - Proper error handling
try {
	await riskyOperation()
} catch (error) {
	await errorHandler.handleError(
		error,
		{
			component: "RiskHandler",
			operation: "riskyOperation",
			timestamp: Date.now(),
		},
		"operation",
	)
}
```

### 2. Inconsistent Error Handling

```typescript
// ❌ Bad - Inconsistent patterns
if (error.code === "ENOENT") {
	// Handle one way
} else if (error.code === "EACCES") {
	// Handle differently
}

// ✅ Good - Consistent centralized handling
await errorHandler.handleError(error, context, "file-system")
```

### 3. Missing Context

```typescript
// ❌ Bad - No context
catch (error) {
  console.error('Error:', error.message)
}

// ✅ Good - Rich context
catch (error) {
  await errorHandler.handleError(error, {
    component: 'ComponentName',
    operation: 'operationName',
    filepath: filePath,
    timestamp: Date.now(),
    metadata: { additional: 'context' }
  }, 'category')
}
```

### 4. Blocking Main Thread

```typescript
// ❌ Bad - Synchronous error handling
try {
	const result = fs.readFileSync(filePath)
} catch (error) {
	// Blocks main thread
}

// ✅ Good - Asynchronous error handling
try {
	const result = await fs.promises.readFile(filePath)
} catch (error) {
	await errorHandler.handleError(error, context, "file-system")
}
```

## Migration Guide

### From Basic Error Handling

**Before:**

```typescript
try {
	await operation()
} catch (error) {
	console.error("Error:", error.message)
}
```

**After:**

```typescript
try {
	await operation()
} catch (error) {
	await errorHandler.handleError(
		error,
		{
			component: "ComponentName",
			operation: "operationName",
			timestamp: Date.now(),
		},
		"category",
	)
}
```

### From Custom Error Classes

**Before:**

```typescript
class CustomError extends Error {
	constructor(
		message: string,
		public code: string,
	) {
		super(message)
	}
}
```

**After:**

```typescript
// Use standardized error types
throw new FileSystemError(message, code, filepath)
throw new NetworkError(message, code, url)
throw new ValidationError(message, code, data)
```

### From Manual Retry Logic

**Before:**

```typescript
let retries = 0
while (retries < 3) {
	try {
		return await operation()
	} catch (error) {
		retries++
		if (retries >= 3) throw error
	}
}
```

**After:**

```typescript
return await errorHandler.executeWithRetry(operation, {
	maxRetries: 3,
	backoffMs: 1000,
})
```

## Conclusion

This error handling guide provides a comprehensive framework for implementing robust error handling in the Context Compression Control feature. By following these patterns and best practices, developers can create resilient applications that handle errors gracefully and provide excellent user experiences.

Key takeaways:

1. **Use centralized error handling** for consistency
2. **Provide rich context** for better debugging
3. **Implement appropriate recovery strategies** for each error type
4. **Test error scenarios thoroughly** to ensure robustness
5. **Monitor and log errors** for continuous improvement
6. **Follow established patterns** for maintainability

For more information, refer to the [API Documentation](./api.md) and [Testing Guide](./testing.md).
