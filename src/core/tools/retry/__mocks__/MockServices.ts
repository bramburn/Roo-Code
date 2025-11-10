import type { RetrySettings, RetryContext, RetryAttempt, RetryAttemptResult, RetryableToolExecution } from "../types"

/**
 * Mock services for testing retry behavior
 * Provides predictable and controllable mock implementations
 */

/**
 * Mock tool execution that simulates various failure scenarios
 */
export class MockToolExecution {
	private readonly scenarios: MockScenario[]
	private currentScenario = 0

	constructor(scenarios: MockScenario[] = []) {
		this.scenarios = scenarios.length > 0 ? scenarios : [MockScenario.success()]
	}

	/**
	 * Create execution function with mock behavior
	 * @param scenarioIndex - Which scenario to use (optional)
	 * @returns Mock execution function
	 */
	createExecution(scenarioIndex?: number): (params: Record<string, any>) => Promise<any> {
		const scenario = this.scenarios[scenarioIndex ?? this.currentScenario]

		return async (params: Record<string, any>) => {
			// Simulate delay
			if (scenario.delay > 0) {
				await new Promise((resolve) => setTimeout(resolve, scenario.delay))
			}

			// Check if params match expected
			if (scenario.expectedParams && !this.paramsMatch(params, scenario.expectedParams)) {
				throw new Error(`Unexpected parameters: ${JSON.stringify(params)}`)
			}

			// Return result or throw error based on scenario
			if (scenario.shouldSucceed) {
				return scenario.result || { success: true, data: params }
			} else {
				throw scenario.error || new Error("Mock failure")
			}
		}
	}

	/**
	 * Get next scenario
	 */
	nextScenario(): void {
		this.currentScenario = (this.currentScenario + 1) % this.scenarios.length
	}

	/**
	 * Reset to first scenario
	 */
	resetScenario(): void {
		this.currentScenario = 0
	}

	/**
	 * Check if parameters match expected values
	 */
	private paramsMatch(actual: Record<string, any>, expected: Record<string, any>): boolean {
		for (const [key, value] of Object.entries(expected)) {
			if (actual[key] !== value) {
				return false
			}
		}
		return true
	}
}

/**
 * Mock scenario definition
 */
export interface MockScenario {
	shouldSucceed: boolean
	delay: number
	result?: any
	error?: Error
	expectedParams?: Record<string, any>
	description?: string
}

/**
 * Factory for common mock scenarios
 */
export class MockScenarios {
	/**
	 * Successful execution scenario
	 */
	static success(delay: number = 0, result?: any): MockScenario {
		return {
			shouldSucceed: true,
			delay,
			result,
			description: "Successful execution",
		}
	}

	/**
	 * Network failure scenario
	 */
	static networkFailure(delay: number = 100): MockScenario {
		return {
			shouldSucceed: false,
			delay,
			error: new Error("Network connection failed"),
			description: "Network failure",
		}
	}

	/**
	 * Timeout failure scenario
	 */
	static timeoutFailure(delay: number = 0): MockScenario {
		return {
			shouldSucceed: false,
			delay,
			error: new Error("Operation timed out"),
			description: "Timeout failure",
		}
	}

	/**
	 * Rate limit scenario
	 */
	static rateLimitFailure(delay: number = 1000): MockScenario {
		return {
			shouldSucceed: false,
			delay,
			error: new Error("Rate limit exceeded"),
			description: "Rate limit failure",
		}
	}

	/**
	 * Authentication failure scenario
	 */
	static authFailure(delay: number = 0): MockScenario {
		return {
			shouldSucceed: false,
			delay,
			error: new Error("Authentication failed"),
			description: "Authentication failure",
		}
	}

	/**
	 * Retry then success scenario
	 */
	static retryThenSuccess(failuresBeforeSuccess: number, delay: number = 100, successResult?: any): MockScenario {
		return {
			shouldSucceed: false,
			delay,
			error: new Error(`Retry scenario - failure ${failuresBeforeSuccess + 1}`),
			description: `Failure ${failuresBeforeSuccess + 1} before success`,
		}
	}

	/**
	 * Create sequence of scenarios
	 */
	static createSequence(
		failuresBeforeSuccess: number,
		failureScenario: MockScenario,
		successScenario: MockScenario,
	): MockScenario[] {
		const scenarios: MockScenario[] = []

		// Add failure scenarios
		for (let i = 0; i < failuresBeforeSuccess; i++) {
			scenarios.push({
				...failureScenario,
				error: new Error(`${failureScenario.error?.message} (attempt ${i + 1})`),
			})
		}

		// Add success scenario
		scenarios.push(successScenario)

		return scenarios
	}
}

/**
 * Mock retry settings for testing
 */
export class MockRetrySettings {
	/**
	 * Create minimal retry settings
	 */
	static minimal(): RetrySettings {
		return {
			enableRetry: true,
			maxRetryAttempts: 2,
			baseDelayMs: 50,
			maxDelayMs: 200,
			backoffMultiplier: 1.5,
			jitterFactor: 0,
			enableContextOptimization: false,
			enableManualRetry: false,
			retryTimeoutMs: 1000,
		}
	}

	/**
	 * Create aggressive retry settings
	 */
	static aggressive(): RetrySettings {
		return {
			enableRetry: true,
			maxRetryAttempts: 10,
			baseDelayMs: 100,
			maxDelayMs: 5000,
			backoffMultiplier: 3,
			jitterFactor: 0.5,
			enableContextOptimization: true,
			enableManualRetry: true,
			retryTimeoutMs: 30000,
		}
	}

	/**
	 * Create disabled retry settings
	 */
	static disabled(): RetrySettings {
		return {
			enableRetry: false,
			maxRetryAttempts: 3,
			baseDelayMs: 1000,
			maxDelayMs: 30000,
			backoffMultiplier: 2,
			jitterFactor: 0.1,
			enableContextOptimization: true,
			enableManualRetry: true,
			retryTimeoutMs: 60000,
		}
	}
}

/**
 * Mock retry context for testing
 */
export class MockRetryContext {
	/**
	 * Create basic retry context
	 */
	static basic(toolName: string = "test_tool"): RetryContext {
		return {
			id: `test_ctx_${Date.now()}`,
			toolName,
			toolParams: { test: "param" },
			config: MockRetrySettings.minimal(),
			taskId: "test_task",
		}
	}

	/**
	 * Create retry context with custom settings
	 */
	static withSettings(toolName: string, settings: RetrySettings, params?: Record<string, any>): RetryContext {
		return {
			id: `test_ctx_${Date.now()}`,
			toolName,
			toolParams: params || { test: "param" },
			config: settings,
			taskId: "test_task",
		}
	}
}

/**
 * Mock retry attempt for testing
 */
export class MockRetryAttempt {
	/**
	 * Create successful attempt
	 */
	static success(attempt: number, delay: number = 0, data?: any): RetryAttempt {
		return {
			attempt,
			timestamp: Date.now(),
			delay,
			result: {
				success: true,
				shouldRetry: false,
				data,
			},
			duration: 100,
		}
	}

	/**
	 * Create failed attempt
	 */
	static failure(attempt: number, delay: number = 0, error?: Error, shouldRetry: boolean = true): RetryAttempt {
		return {
			attempt,
			timestamp: Date.now(),
			delay,
			result: {
				success: false,
				shouldRetry,
				retryReason: error?.message,
			},
			error,
			duration: 100,
		}
	}
}

/**
 * Mock retryable tool execution
 */
export class MockRetryableExecution {
	/**
	 * Create basic mock execution
	 */
	static basic(
		toolName: string = "test_tool",
		executeFn?: (params: Record<string, any>) => Promise<any>,
		params?: Record<string, any>,
	): RetryableToolExecution {
		const defaultExecute = async (p: Record<string, any>) => {
			return { success: true, data: p }
		}

		return {
			toolName,
			execute: executeFn || defaultExecute,
			params: params || { test: "param" },
		}
	}

	/**
	 * Create execution with specific scenarios
	 */
	static withScenarios(
		toolName: string,
		scenarios: MockScenario[],
		params?: Record<string, any>,
	): RetryableToolExecution {
		const mockExecution = new MockToolExecution(scenarios)
		return {
			toolName,
			execute: mockExecution.createExecution(),
			params: params || { test: "param" },
		}
	}
}

/**
 * Performance testing utilities
 */
export class MockPerformance {
	/**
	 * Measure execution time
	 */
	static async measureTime<T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
		const start = Date.now()
		const result = await fn()
		const duration = Date.now() - start
		return { result, duration }
	}

	/**
	 * Create load test scenarios
	 */
	static createLoadTest(concurrency: number, iterations: number, delay: number = 0): Array<() => Promise<any>> {
		const scenarios: Array<() => Promise<any>> = []

		for (let i = 0; i < concurrency * iterations; i++) {
			scenarios.push(async () => {
				if (delay > 0) {
					await new Promise((resolve) => setTimeout(resolve, delay))
				}
				return { iteration: Math.floor(i / concurrency), thread: i % concurrency }
			})
		}

		return scenarios
	}

	/**
	 * Simulate memory usage
	 */
	static simulateMemoryUsage(baseSize: number, growth: number = 0): number {
		return baseSize + growth * Math.random() * 1000
	}
}

/**
 * Event tracking utilities
 */
export class MockEventTracker {
	private readonly events: Array<{ type: string; data: any; timestamp: number }> = []

	/**
	 * Track an event
	 */
	track(type: string, data?: any): void {
		this.events.push({
			type,
			data,
			timestamp: Date.now(),
		})
	}

	/**
	 * Get events by type
	 */
	getEvents(type: string): Array<{ data: any; timestamp: number }> {
		return this.events
			.filter((event) => event.type === type)
			.map((event) => ({ data: event.data, timestamp: event.timestamp }))
	}

	/**
	 * Get event count by type
	 */
	getEventCount(type: string): number {
		return this.events.filter((event) => event.type === type).length
	}

	/**
	 * Clear all events
	 */
	clear(): void {
		this.events.length = 0
	}

	/**
	 * Get all events
	 */
	getAllEvents(): Array<{ type: string; data: any; timestamp: number }> {
		return [...this.events]
	}
}
