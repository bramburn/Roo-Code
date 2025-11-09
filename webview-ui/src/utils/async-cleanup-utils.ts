import { vi } from "vitest"
import type { MockVSCodeApi } from "@/mocks/vscode-mock"

/**
 * Configuration for cleanup operations
 */
export interface CleanupConfig {
	/** Default timeout for async operations */
	defaultTimeout: number
	/** Maximum time to wait for cleanup */
	cleanupTimeout: number
	/** Interval for checking cleanup completion */
	cleanupCheckInterval: number
	/** Whether to log cleanup operations */
	debugCleanup: boolean
	/** Maximum number of retries for failed cleanup */
	maxRetries: number
}

/**
 * Default cleanup configuration
 */
export const DEFAULT_CLEANUP_CONFIG: CleanupConfig = {
	defaultTimeout: 5000,
	cleanupTimeout: 2000,
	cleanupCheckInterval: 50,
	debugCleanup: false,
	maxRetries: 3,
}

/**
 * Registry for tracking async operations that need cleanup
 */
class AsyncOperationRegistry {
	private operations = new Set<string>()
	private timeouts = new Map<string, NodeJS.Timeout>()
	private intervals = new Map<string, NodeJS.Timeout>()
	private promises = new Map<string, Promise<any>>()

	/**
	 * Register an async operation for tracking
	 */
	register(id: string, type: "timeout" | "interval" | "promise", handle: any): void {
		switch (type) {
			case "timeout":
				this.timeouts.set(id, handle)
				break
			case "interval":
				this.intervals.set(id, handle)
				break
			case "promise":
				this.promises.set(id, handle)
				break
		}
		this.operations.add(id)
	}

	/**
	 * Unregister an operation
	 */
	unregister(id: string): void {
		this.operations.delete(id)
		this.timeouts.delete(id)
		this.intervals.delete(id)
		this.promises.delete(id)
	}

	/**
	 * Get all registered operations
	 */
	getAll(): Set<string> {
		return new Set(this.operations)
	}

	/**
	 * Clear all operations
	 */
	clear(): void {
		// Clear timeouts
		for (const [_id, timeout] of this.timeouts) {
			clearTimeout(timeout)
		}

		// Clear intervals
		for (const [_id, interval] of this.intervals) {
			clearInterval(interval)
		}

		// Note: Promises can't be cancelled, but we track them for debugging
		this.timeouts.clear()
		this.intervals.clear()
		this.promises.clear()
		this.operations.clear()
	}

	/**
	 * Get operation statistics
	 */
	getStats(): { timeouts: number; intervals: number; promises: number } {
		return {
			timeouts: this.timeouts.size,
			intervals: this.intervals.size,
			promises: this.promises.size,
		}
	}
}

// Global registry instance
const globalRegistry = new AsyncOperationRegistry()

/**
 * Enhanced timeout that tracks cleanup
 */
export function trackTimeout(callback: () => void, delay: number, id?: string): NodeJS.Timeout {
	const operationId = id || `timeout_${Date.now()}_${Math.random()}`
	const timeoutId = setTimeout(() => {
		try {
			callback()
		} catch (error) {
			// Log errors but don't let them propagate during test cleanup
			console.warn("Error in tracked timeout callback:", error)
		} finally {
			globalRegistry.unregister(operationId)
		}
	}, delay)

	globalRegistry.register(operationId, "timeout", timeoutId)

	return timeoutId
}

/**
 * Enhanced interval that tracks cleanup
 */
export function trackInterval(callback: () => void, delay: number, id?: string): NodeJS.Timeout {
	const intervalId = setInterval(callback, delay)
	const operationId = id || `interval_${Date.now()}_${Math.random()}`
	globalRegistry.register(operationId, "interval", intervalId)

	return intervalId
}

/**
 * Track a promise for cleanup monitoring
 */
export function trackPromise<T>(promise: Promise<T>, id?: string): Promise<T> {
	const operationId = id || `promise_${Date.now()}_${Math.random()}`
	globalRegistry.register(operationId, "promise", promise)

	return promise.finally(() => {
		globalRegistry.unregister(operationId)
	})
}

/**
 * Clear a tracked timeout
 */
export function clearTrackedTimeout(id: string): void {
	const timeout = globalRegistry["timeouts"].get(id)
	if (timeout) {
		clearTimeout(timeout)
		globalRegistry.unregister(id)
	}
}

/**
 * Clear a tracked interval
 */
export function clearTrackedInterval(id: string): void {
	const interval = globalRegistry["intervals"].get(id)
	if (interval) {
		clearInterval(interval)
		globalRegistry.unregister(id)
	}
}

/**
 * VS Code specific cleanup utilities
 */
export class VSCodeCleanupManager {
	private messageListeners = new Set<(event: MessageEvent) => void>()
	private stateWatchers = new Set<() => void>()

	/**
	 * Register a message listener for cleanup
	 */
	registerMessageListener(listener: (event: MessageEvent) => void): void {
		this.messageListeners.add(listener)
	}

	/**
	 * Register a state watcher for cleanup
	 */
	registerStateWatcher(watcher: () => void): void {
		this.stateWatchers.add(watcher)
	}

	/**
	 * Remove a message listener
	 */
	removeMessageListener(listener: (event: MessageEvent) => void): void {
		this.messageListeners.delete(listener)
	}

	/**
	 * Remove a state watcher
	 */
	removeStateWatcher(watcher: () => void): void {
		this.stateWatchers.delete(watcher)
	}

	/**
	 * Cleanup all VS Code related resources
	 */
	cleanup(mockApi?: MockVSCodeApi): void {
		// Clear message listeners
		this.messageListeners.clear()
		this.stateWatchers.clear()

		// Cleanup VS Code mock if provided
		if (mockApi) {
			mockApi.reset()
		}

		// Remove global VS Code API references
		if (typeof global !== "undefined" && (global as any).acquireVsCodeApi) {
			delete (global as any).acquireVsCodeApi
		}
		if (typeof window !== "undefined" && (window as any).acquireVsCodeApi) {
			delete (window as any).acquireVsCodeApi
		}
	}
}

/**
 * React concurrent features cleanup utilities
 */
export class ReactCleanupManager {
	private pendingTransitions = new Set<any>()
	private suspensePromises = new Set<Promise<any>>()

	/**
	 * Track a React transition for cleanup
	 */
	trackTransition(transition: any): void {
		this.pendingTransitions.add(transition)
	}

	/**
	 * Track a Suspense promise for cleanup
	 */
	trackSuspensePromise(promise: Promise<any>): void {
		this.suspensePromises.add(promise)
		promise.finally(() => {
			this.suspensePromises.delete(promise)
		})
	}

	/**
	 * Wait for all React operations to complete
	 */
	async waitForReactCompletion(timeout = 5000): Promise<void> {
		const startTime = Date.now()

		while (
			(this.pendingTransitions.size > 0 || this.suspensePromises.size > 0) &&
			Date.now() - startTime < timeout
		) {
			await new Promise((resolve) => setTimeout(resolve, 10))
		}

		if (this.pendingTransitions.size > 0 || this.suspensePromises.size > 0) {
			console.warn("React operations did not complete within timeout:", {
				pendingTransitions: this.pendingTransitions.size,
				suspensePromises: this.suspensePromises.size,
			})
		}

		// Clear any remaining operations
		this.pendingTransitions.clear()
		this.suspensePromises.clear()
	}

	/**
	 * Cleanup all React-related resources
	 */
	cleanup(): void {
		this.pendingTransitions.clear()
		this.suspensePromises.clear()
	}
}

/**
 * Main cleanup coordinator
 */
export class AsyncCleanupManager {
	private config: CleanupConfig
	private vscodeCleanup = new VSCodeCleanupManager()
	private reactCleanup = new ReactCleanupManager()
	private unhandledRejectionHandler?: (event: PromiseRejectionEvent) => void
	private errorHandler?: (event: ErrorEvent) => void

	constructor(config: Partial<CleanupConfig> = {}) {
		this.config = { ...DEFAULT_CLEANUP_CONFIG, ...config }
		this.setupErrorHandlers()
	}

	/**
	 * Setup global error handlers to catch async errors during cleanup
	 */
	private setupErrorHandlers(): void {
		this.unhandledRejectionHandler = (event: PromiseRejectionEvent) => {
			if (this.config.debugCleanup) {
				console.warn("Unhandled promise rejection during cleanup:", event.reason)
			}
			// Prevent the rejection from propagating during test teardown
			event.preventDefault()
		}

		this.errorHandler = (event: ErrorEvent) => {
			if (this.config.debugCleanup) {
				console.warn("Unhandled error during cleanup:", event.error)
			}
		}
	}

	/**
	 * Register error handlers for the cleanup period
	 */
	registerErrorHandlers(): void {
		if (typeof window !== "undefined") {
			window.addEventListener("unhandledrejection", this.unhandledRejectionHandler!)
			window.addEventListener("error", this.errorHandler!)
		}
	}

	/**
	 * Unregister error handlers
	 */
	unregisterErrorHandlers(): void {
		if (typeof window !== "undefined") {
			window.removeEventListener("unhandledrejection", this.unhandledRejectionHandler!)
			window.removeEventListener("error", this.errorHandler!)
		}
	}

	/**
	 * Perform comprehensive async cleanup
	 */
	async cleanup(mockApi?: MockVSCodeApi): Promise<void> {
		if (this.config.debugCleanup) {
			console.log("Starting async cleanup...")
		}

		// Register error handlers to catch cleanup issues
		this.registerErrorHandlers()

		try {
			// Step 1: Clear all tracked async operations
			globalRegistry.clear()

			// Step 2: Wait for React operations to complete
			await this.reactCleanup.waitForReactCompletion(this.config.cleanupTimeout)

			// Step 3: Cleanup VS Code specific resources
			this.vscodeCleanup.cleanup(mockApi)

			// Step 4: Clear all Vitest timers
			vi.clearAllTimers()

			// Step 5: Wait for any pending promises to settle
			await this.waitForPendingPromises()

			if (this.config.debugCleanup) {
				console.log("Async cleanup completed successfully")
			}
		} catch (error) {
			console.error("Error during async cleanup:", error)
		} finally {
			// Always unregister error handlers
			this.unregisterErrorHandlers()
		}
	}

	/**
	 * Wait for pending promises to settle with timeout
	 */
	private async waitForPendingPromises(): Promise<void> {
		const startTime = Date.now()

		while (Date.now() - startTime < this.config.cleanupTimeout) {
			// Check if there are any pending operations
			const stats = globalRegistry.getStats()
			if (stats.timeouts === 0 && stats.intervals === 0) {
				break
			}

			await new Promise((resolve) => setTimeout(resolve, this.config.cleanupCheckInterval))
		}
	}

	/**
	 * Get cleanup statistics
	 */
	getStats(): { operations: any; react: any; vscode: any } {
		return {
			operations: globalRegistry.getStats(),
			react: {
				pendingTransitions: this.reactCleanup["pendingTransitions"].size,
				suspensePromises: this.reactCleanup["suspensePromises"].size,
			},
			vscode: {
				messageListeners: this.vscodeCleanup["messageListeners"].size,
				stateWatchers: this.vscodeCleanup["stateWatchers"].size,
			},
		}
	}

	/**
	 * Get the VS Code cleanup manager
	 */
	getVSCodeCleanup(): VSCodeCleanupManager {
		return this.vscodeCleanup
	}

	/**
	 * Get the React cleanup manager
	 */
	getReactCleanup(): ReactCleanupManager {
		return this.reactCleanup
	}
}

/**
 * Global cleanup manager instance
 */
let globalCleanupManager: AsyncCleanupManager | null = null

/**
 * Get or create the global cleanup manager
 */
export function getCleanupManager(config?: Partial<CleanupConfig>): AsyncCleanupManager {
	if (!globalCleanupManager) {
		globalCleanupManager = new AsyncCleanupManager(config)
	}
	return globalCleanupManager
}

/**
 * Reset the global cleanup manager (useful for testing)
 */
export function resetCleanupManager(): void {
	if (globalCleanupManager) {
		globalCleanupManager.unregisterErrorHandlers()
		globalCleanupManager = null
	}
}

/**
 * Utility function to create a cleanup-aware timeout
 */
export function createCleanupAwareTimeout(callback: () => void, delay: number, id?: string): NodeJS.Timeout {
	return trackTimeout(callback, delay, id)
}

/**
 * Utility function to create a cleanup-aware interval
 */
export function createCleanupAwareInterval(callback: () => void, delay: number, id?: string): NodeJS.Timeout {
	return trackInterval(callback, delay, id)
}

/**
 * Utility function to wrap a promise for cleanup tracking
 */
export function wrapPromiseForCleanup<T>(promise: Promise<T>, id?: string): Promise<T> {
	return trackPromise(promise, id)
}

/**
 * Debug utility to log current cleanup state
 */
export function debugCleanupState(): void {
	const manager = getCleanupManager()
	const stats = manager.getStats()
	console.log("Cleanup State:", stats)
}

/**
 * Create a tracked timeout (alias for createCleanupAwareTimeout)
 */
export function createTrackedTimeout(callback: () => void, delay: number, id?: string): NodeJS.Timeout {
	return createCleanupAwareTimeout(callback, delay, id)
}

/**
 * Create a tracked interval (alias for createCleanupAwareInterval)
 */
export function createTrackedInterval(callback: () => void, delay: number, id?: string): NodeJS.Timeout {
	return createCleanupAwareInterval(callback, delay, id)
}

/**
 * Check current cleanup state (alias for getCleanupManager().getStats())
 */
export function checkCleanupState(): { operations: any; react: any; vscode: any } {
	const manager = getCleanupManager()
	return manager.getStats()
}

/**
 * Wrapper function that ensures cleanup is performed after async operations
 */
export async function withAsyncCleanup<T>(
	asyncOperation: () => Promise<T>,
	config?: Partial<CleanupConfig>,
): Promise<T> {
	const manager = getCleanupManager(config)

	try {
		const result = await asyncOperation()
		return result
	} finally {
		await manager.cleanup()
	}
}
