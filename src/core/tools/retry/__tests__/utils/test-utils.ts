import { vi } from "vitest"
import type { RetryExecution, RetrySettings, RetryContext, MessageHistory } from "../../types"

/**
 * Test utilities for retry mechanism testing
 */

export class MockRetryExecutionBuilder {
	private execution: Partial<RetryExecution> = {}

	constructor(toolName: string = "test-tool") {
		this.execution.toolName = toolName
		this.execution.params = {}
	}

	withParams(params: Record<string, any>): MockRetryExecutionBuilder {
		this.execution.params = { ...this.execution.params, ...params }
		return this
	}

	withContext(context: any): MockRetryExecutionBuilder {
		this.execution.context = context
		return this
	}

	withRetryConfig(retryConfig: Partial<RetrySettings>): MockRetryExecutionBuilder {
		this.execution.retryConfig = retryConfig
		return this
	}

	withExecute(execute: (params: Record<string, any>) => Promise<any>): MockRetryExecutionBuilder {
		this.execution.execute = execute
		return this
	}

	build(): RetryExecution {
		return {
			toolName: this.execution.toolName || "test-tool",
			execute: this.execution.execute || vi.fn().mockResolvedValue({ success: true }),
			params: this.execution.params || {},
			context: this.execution.context,
			retryConfig: this.execution.retryConfig,
		}
	}
}

export class MockRetrySettingsBuilder {
	private settings: Partial<RetrySettings> = {}

	constructor() {
		this.settings.enableRetry = true
		this.settings.maxRetryAttempts = 3
		this.settings.baseDelayMs = 1000
		this.settings.maxDelayMs = 30000
		this.settings.backoffMultiplier = 2
		this.settings.jitterFactor = 0.1
		this.settings.enableContextOptimization = true
		this.settings.enableHistorySynchronization = true
		this.settings.enableManualRetry = true
		this.settings.retryTimeoutMs = 60000
	}

	withMaxRetryAttempts(attempts: number): MockRetrySettingsBuilder {
		this.settings.maxRetryAttempts = attempts
		return this
	}

	withBaseDelay(delay: number): MockRetrySettingsBuilder {
		this.settings.baseDelayMs = delay
		return this
	}

	withMaxDelay(delay: number): MockRetrySettingsBuilder {
		this.settings.maxDelayMs = delay
		return this
	}

	withBackoffMultiplier(multiplier: number): MockRetrySettingsBuilder {
		this.settings.backoffMultiplier = multiplier
		return this
	}

	withJitterFactor(jitter: number): MockRetrySettingsBuilder {
		this.settings.jitterFactor = jitter
		return this
	}

	withContextOptimization(enabled: boolean): MockRetrySettingsBuilder {
		this.settings.enableContextOptimization = enabled
		return this
	}

	withHistorySynchronization(enabled: boolean): MockRetrySettingsBuilder {
		this.settings.enableHistorySynchronization = enabled
		return this
	}

	withManualRetry(enabled: boolean): MockRetrySettingsBuilder {
		this.settings.enableManualRetry = enabled
		return this
	}

	withRetryTimeout(timeout: number): MockRetrySettingsBuilder {
		this.settings.retryTimeoutMs = timeout
		return this
	}

	disabled(): MockRetrySettingsBuilder {
		this.settings.enableRetry = false
		return this
	}

	build(): RetrySettings {
		return {
			enableRetry: this.settings.enableRetry ?? true,
			maxRetryAttempts: this.settings.maxRetryAttempts ?? 3,
			baseDelayMs: this.settings.baseDelayMs ?? 1000,
			maxDelayMs: this.settings.maxDelayMs ?? 30000,
			backoffMultiplier: this.settings.backoffMultiplier ?? 2,
			jitterFactor: this.settings.jitterFactor ?? 0.1,
			enableContextOptimization: this.settings.enableContextOptimization ?? true,
			enableHistorySynchronization: this.settings.enableHistorySynchronization ?? true,
			enableManualRetry: this.settings.enableManualRetry ?? true,
			retryTimeoutMs: this.settings.retryTimeoutMs ?? 60000,
		}
	}
}

export class MockRetryContextBuilder {
	private context: Partial<RetryContext> = {}

	constructor(toolName: string = "test-tool") {
		this.context.id = `test-context-${Date.now()}`
		this.context.toolName = toolName
		this.context.toolParams = {}
		this.context.config = new MockRetrySettingsBuilder().build()
		this.context.attemptCount = 1
		this.context.taskId = "test-task"
	}

	withId(id: string): MockRetryContextBuilder {
		this.context.id = id
		return this
	}

	withToolParams(params: Record<string, any>): MockRetryContextBuilder {
		this.context.toolParams = params
		return this
	}

	withConfig(config: RetrySettings): MockRetryContextBuilder {
		this.context.config = config
		return this
	}

	withAttemptCount(count: number): MockRetryContextBuilder {
		this.context.attemptCount = count
		return this
	}

	withTaskId(taskId: string): MockRetryContextBuilder {
		this.context.taskId = taskId
		return this
	}

	withExecutionContext(context: any): MockRetryContextBuilder {
		this.context.executionContext = context
		return this
	}

	withStartTime(time: number): MockRetryContextBuilder {
		this.context.startTime = time
		return this
	}

	withLastAttemptTime(time: number): MockRetryContextBuilder {
		this.context.lastAttemptTime = time
		return this
	}

	build(): RetryContext {
		return {
			id: this.context.id || `test-context-${Date.now()}`,
			toolName: this.context.toolName || "test-tool",
			toolParams: this.context.toolParams || {},
			config: this.context.config || new MockRetrySettingsBuilder().build(),
			attemptCount: this.context.attemptCount || 1,
			taskId: this.context.taskId || "test-task",
			executionContext: this.context.executionContext,
			startTime: this.context.startTime || Date.now(),
			lastAttemptTime: this.context.lastAttemptTime || Date.now(),
		}
	}
}

export class MockMessageHistoryBuilder {
	private messages: MessageHistory[] = []

	addMessage(id: string, role: string, content: string, timestamp?: number): MockMessageHistoryBuilder {
		this.messages.push({
			id,
			role: role as any,
			content,
			timestamp: timestamp || Date.now(),
		})
		return this
	}

	addUserMessage(content: string, id?: string): MockMessageHistoryBuilder {
		return this.addMessage(id || `user-${this.messages.length}`, "user", content)
	}

	addAssistantMessage(content: string, id?: string): MockMessageHistoryBuilder {
		return this.addMessage(id || `assistant-${this.messages.length}`, "assistant", content)
	}

	addSystemMessage(content: string, id?: string): MockMessageHistoryBuilder {
		return this.addMessage(id || `system-${this.messages.length}`, "system", content)
	}

	build(): MessageHistory[] {
		return [...this.messages]
	}
}

/**
 * Error factory for creating different types of errors
 */
export class ErrorFactory {
	static networkError(message: string = "Network error"): Error {
		const error = new Error(message)
		error.name = "NetworkError"
		return error
	}

	static timeoutError(message: string = "Request timeout"): Error {
		const error = new Error(message)
		error.name = "TimeoutError"
		return error
	}

	static authError(message: string = "Authentication failed"): Error {
		const error = new Error(message)
		error.name = "AuthError"
		return error
	}

	static rateLimitError(message: string = "Rate limit exceeded"): Error {
		const error = new Error(message)
		error.name = "RateLimitError"
		return error
	}

	static contextError(message: string = "Context window exceeded"): Error {
		const error = new Error(message)
		error.name = "ContextError"
		return error
	}

	static permissionError(message: string = "Permission denied"): Error {
		const error = new Error(message)
		error.name = "PermissionError"
		return error
	}

	static resourceError(message: string = "Resource not found"): Error {
		const error = new Error(message)
		error.name = "ResourceError"
		return error
	}

	static validationError(message: string = "Validation failed"): Error {
		const error = new Error(message)
		error.name = "ValidationError"
		return error
	}
}

/**
 * Performance measurement utilities
 */
export class PerformanceMeasurer {
	private startTime: number = 0
	private measurements: { name: string; duration: number }[] = []

	startMeasurement(name: string): void {
		this.startTime = performance.now()
	}

	endMeasurement(name: string): number {
		const duration = performance.now() - this.startTime
		this.measurements.push({ name, duration })
		return duration
	}

	getMeasurement(name: string): number | undefined {
		return this.measurements.find((m) => m.name === name)?.duration
	}

	getAllMeasurements(): { name: string; duration: number }[] {
		return [...this.measurements]
	}

	getTotalDuration(): number {
		return this.measurements.reduce((sum, m) => sum + m.duration, 0)
	}

	reset(): void {
		this.measurements = []
		this.startTime = 0
	}
}

/**
 * Memory measurement utilities
 */
export class MemoryMeasurer {
	private initialMemory: number = 0
	private measurements: { name: string; memory: number; delta: number }[] = []

	startMeasurement(): void {
		if (typeof process !== "undefined" && process.memoryUsage) {
			this.initialMemory = process.memoryUsage().heapUsed
		}
	}

	endMeasurement(name: string): { memory: number; delta: number } | null {
		if (typeof process !== "undefined" && process.memoryUsage) {
			const currentMemory = process.memoryUsage().heapUsed
			const delta = currentMemory - this.initialMemory
			this.measurements.push({ name, memory: currentMemory, delta })
			return { memory: currentMemory, delta }
		}
		return null
	}

	getMeasurement(name: string): { memory: number; delta: number } | undefined {
		return this.measurements.find((m) => m.name === name)
	}

	getTotalDelta(): number {
		return this.measurements.reduce((sum, m) => sum + m.delta, 0)
	}

	getMaxMemory(): number {
		return Math.max(...this.measurements.map((m) => m.memory))
	}

	reset(): void {
		this.measurements = []
		this.initialMemory = 0
	}
}

/**
 * Test data generators
 */
export class TestDataGenerator {
	static generateLargeContext(size: number = 1000): any {
		return {
			taskId: "large-context-test",
			messages: Array.from({ length: size }, (_, i) => ({
				role: i % 2 === 0 ? "user" : "assistant",
				content: `Large message content ${i}`.repeat(10),
			})),
		}
	}

	static generateConcurrentExecutions(count: number): RetryExecution[] {
		return Array.from({ length: count }, (_, i) =>
			new MockRetryExecutionBuilder(`concurrent-tool-${i}`)
				.withParams({ id: i })
				.withExecute(vi.fn().mockResolvedValue({ success: true, id: i }))
				.build(),
		)
	}

	static generateErrorSequence(errors: Error[]): RetryExecution {
		const execute = vi.fn()
		errors.forEach((error, index) => {
			if (index === errors.length - 1) {
				// Last call succeeds
				execute.mockResolvedValueOnce({ success: true })
			} else {
				execute.mockRejectedValueOnce(error)
			}
		})

		return new MockRetryExecutionBuilder("error-sequence-tool").withExecute(execute).build()
	}

	static generateMixedHistory(): MessageHistory[] {
		return new MockMessageHistoryBuilder()
			.addUserMessage("Initial request")
			.addAssistantMessage("Initial response")
			.addSystemMessage("System notification")
			.addUserMessage("Follow-up question")
			.addAssistantMessage("Follow-up answer")
			.build()
	}
}

/**
 * Async utilities for testing
 */
export class AsyncUtils {
	static async delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms))
	}

	static async timeout<T>(promise: Promise<T>, ms: number): Promise<T> {
		return Promise.race([
			promise,
			new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)),
		])
	}

	static async waitForCondition(
		condition: () => boolean,
		timeout: number = 5000,
		interval: number = 100,
	): Promise<void> {
		const startTime = Date.now()
		while (Date.now() - startTime < timeout) {
			if (condition()) {
				return
			}
			await this.delay(interval)
		}
		throw new Error(`Condition not met within ${timeout}ms`)
	}
}

/**
 * Mock utilities for external dependencies
 */
export class MockUtils {
	static createMockTruncateConversationIfNeeded(): any {
		return vi.fn().mockImplementation((messages, maxLength) => {
			if (messages.length <= maxLength) {
				return messages
			}
			return messages.slice(-maxLength)
		})
	}

	static createMockPerformanceNow(): any {
		let currentTime = 0
		return vi.fn().mockImplementation(() => {
			currentTime += 100
			return currentTime
		})
	}

	static createMockSetTimeout(): any {
		const callbacks: Array<{ callback: (callback: () => void, delay: number) => void; delay: number }> = []

		const mockSetTimeout = vi.fn().mockImplementation((callback: (callback: () => void, delay: number) => void) => {
			callbacks.push({ callback, delay })
			return callbacks.length
		})

		const executeAllCallbacks = () => {
			callbacks.forEach(({ callback }: { callback: () => void }) => {
				callback()
			})
			callbacks.length = 0
		}

		return { mockSetTimeout, executeAllCallbacks }
	}
}

/**
 * Assertion utilities
 */
export class AssertionUtils {
	static assertRetryResult(
		result: any,
		expectedSuccess: boolean,
		expectedAttempts?: number,
		expectedError?: string,
	): void {
		expect(result).toBeDefined()
		expect(result.success).toBe(expectedSuccess)

		if (expectedAttempts !== undefined) {
			expect(result.attempts).toBe(expectedAttempts)
		}

		if (expectedError) {
			expect(result.error?.message).toContain(expectedError)
		}

		if (expectedSuccess) {
			expect(result.result).toBeDefined()
		} else {
			expect(result.error).toBeDefined()
		}
	}

	static assertContextOptimization(
		optimizationResult: any,
		expectedOptimized: boolean,
		expectedReduction?: number,
	): void {
		expect(optimizationResult).toBeDefined()
		expect(optimizationResult.optimized).toBe(expectedOptimized)

		if (expectedReduction !== undefined) {
			expect(optimizationResult.reduction).toBeGreaterThanOrEqual(expectedReduction)
		}

		if (expectedOptimized) {
			expect(optimizationResult.optimizedContext).toBeDefined()
		}
	}

	static assertHistorySynchronization(
		syncResult: any,
		expectedSynchronized: boolean,
		expectedConflictCount?: number,
	): void {
		expect(syncResult).toBeDefined()
		expect(syncResult.synchronized).toBe(expectedSynchronized)

		if (expectedConflictCount !== undefined) {
			expect(syncResult.conflicts).toHaveLength(expectedConflictCount)
		}

		expect(syncResult.mergedHistory).toBeDefined()
	}
}

/**
 * Environment utilities for testing
 */
export class TestEnvironment {
	static setupNodeEnvironment(): void {
		// Mock Node.js specific APIs if needed
		if (typeof process === "undefined") {
			;(global as any).process = {
				memoryUsage: vi.fn().mockReturnValue({
					heapUsed: 1024 * 1024, // 1MB
					heapTotal: 2 * 1024 * 1024, // 2MB
				}),
			}
		}
	}

	static setupBrowserEnvironment(): void {
		// Mock browser specific APIs if needed
		if (typeof window === "undefined") {
			;(global as any).window = {
				performance: {
					now: vi.fn().mockReturnValue(Date.now()),
				},
			}
		}
	}

	static cleanup(): void {
		vi.clearAllMocks()
	}
}
