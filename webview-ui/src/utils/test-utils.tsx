import React, { ReactElement } from "react"
import { render, RenderOptions, configure } from "@testing-library/react"
import { cleanup } from "@testing-library/react"
import { vi, afterEach } from "vitest"

import { TooltipProvider } from "@src/components/ui/tooltip"
import { ExtensionStateContextProvider } from "@src/context/ExtensionStateContext"
import { TranslationProvider as _TranslationContextProvider } from "@src/i18n/TranslationContext"
import { VSCodeMockEnvironment, VSCodeTestUtils } from "@src/mocks/vscode-mock"
import type { ExtensionState } from "@roo/ExtensionMessage"
import {
	getCleanupManager,
	createCleanupAwareTimeout,
	createCleanupAwareInterval,
	wrapPromiseForCleanup,
	VSCodeCleanupManager as _VSCodeCleanupManager,
	ReactCleanupManager as _ReactCleanupManager,
} from "@src/utils/async-cleanup-utils"
import { CLEANUP_PRESETS } from "@src/utils/cleanup-config"

// Configure React Testing Library for better test experience
configure({
	testIdAttribute: "data-testid",
	// Improve error messages for debugging
	asyncUtilTimeout: 5000,
})

interface AllTheProvidersProps {
	children: React.ReactNode
	initialState?: ExtensionState
	vscodeEnv?: VSCodeMockEnvironment
	translationProvider?: boolean
}

const AllTheProviders = ({ children, initialState, _vscodeEnv, translationProvider = true }: AllTheProvidersProps) => {
	const content = <TooltipProvider delayDuration={0}>{children}</TooltipProvider>

	// Wrap with translation provider if needed
	const withTranslation = translationProvider ? (
		<_TranslationContextProvider>{content}</_TranslationContextProvider>
	) : (
		content
	)

	// Wrap with extension state provider if initial state is provided
	const withExtensionState = initialState ? (
		<ExtensionStateContextProvider>{withTranslation}</ExtensionStateContextProvider>
	) : (
		withTranslation
	)

	return withExtensionState
}

interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
	initialState?: ExtensionState
	vscodeEnv?: VSCodeMockEnvironment
	translationProvider?: boolean
}

const customRender = (ui: ReactElement, options: CustomRenderOptions = {}) => {
	const { initialState, vscodeEnv, translationProvider, ...renderOptions } = options

	const wrapper = ({ children }: { children: React.ReactNode }) => (
		<AllTheProviders initialState={initialState} vscodeEnv={vscodeEnv} translationProvider={translationProvider}>
			{children}
		</AllTheProviders>
	)

	return render(ui, { wrapper, ...renderOptions })
}

// Enhanced render function specifically for webview testing
interface WebviewRenderOptions extends CustomRenderOptions {
	autoSetupVSCode?: boolean
	mockInitialState?: boolean
}

const renderWithWebview = (ui: ReactElement, options: WebviewRenderOptions = {}) => {
	const { autoSetupVSCode = true, mockInitialState = true, ...customOptions } = options

	let vscodeEnv = options.vscodeEnv

	// Auto-create VS Code mock environment if needed
	if (autoSetupVSCode && !vscodeEnv) {
		vscodeEnv = new VSCodeMockEnvironment()
	}

	// Auto-create mock initial state if needed
	let initialState = options.initialState
	if (mockInitialState && !initialState) {
		initialState = VSCodeTestUtils.createMockState()
	}

	const result = customRender(ui, {
		...customOptions,
		initialState,
		vscodeEnv,
	})

	// Return enhanced result with webview utilities
	return {
		...result,
		vscodeEnv,
		simulateExtensionMessage: (message: any) => vscodeEnv?.simulateExtensionMessage(message),
		simulateStateUpdate: (state: ExtensionState) => vscodeEnv?.simulateStateUpdate(state),
		getPostedMessages: () => vscodeEnv?.getPostedMessages() || [],
		waitForMessage: (type: string, timeout?: number) => vscodeEnv?.waitForMessage(type as any, timeout),
		cleanup: async () => {
			// Use cleanup manager for proper async cleanup
			const cleanupManager = getCleanupManager(CLEANUP_PRESETS.integration)

			try {
				// Wait for React operations to complete
				await cleanupManager.getReactCleanup().waitForReactCompletion()

				// Unmount the component
				result.unmount()

				// Cleanup VS Code environment
				if (vscodeEnv) {
					await cleanupManager.getVSCodeCleanup().cleanup(vscodeEnv.api)
				}
			} catch (error) {
				console.error("Error during renderWithWebview cleanup:", error)
			}
		},
	}
}

// Enhanced cleanup after each test to prevent memory leaks and teardown errors
afterEach(async () => {
	// Use cleanup manager for comprehensive async cleanup
	const cleanupManager = getCleanupManager(CLEANUP_PRESETS.component)

	try {
		// Perform comprehensive cleanup
		await cleanupManager.cleanup()
	} catch (error) {
		console.error("Error during test-utils cleanup:", error)
	}

	// Standard React Testing Library cleanup
	cleanup()

	// Clear all Vitest timers and mocks
	vi.clearAllTimers()
	vi.clearAllMocks()

	// Clean up any global VS Code mocks
	if (typeof global !== "undefined" && (global as any).acquireVsCodeApi) {
		delete (global as any).acquireVsCodeApi
	}
	if (typeof window !== "undefined" && (window as any).acquireVsCodeApi) {
		delete (window as any).acquireVsCodeApi
	}
})

// re-export everything
export * from "@testing-library/react"
export * from "@testing-library/user-event"
export { cleanup }

// override render method
export { customRender as render, renderWithWebview }

// Export VS Code testing utilities
export { VSCodeMockEnvironment, VSCodeTestUtils } from "@src/mocks/vscode-mock"
export type { MockVSCodeApi } from "@src/mocks/vscode-mock"

// Utility functions for common testing patterns
export const createWebviewTestUtils = () => {
	const vscodeEnv = new VSCodeMockEnvironment()
	const mockState = VSCodeTestUtils.createMockState()

	return {
		vscodeEnv,
		mockState,
		render: (ui: ReactElement, options: Omit<WebviewRenderOptions, "vscodeEnv" | "initialState"> = {}) =>
			renderWithWebview(ui, { ...options, vscodeEnv, initialState: mockState }),
		simulateWebviewLaunch: () => VSCodeTestUtils.simulateWebviewLaunch(vscodeEnv, mockState),
		cleanup: async () => {
			const cleanupManager = getCleanupManager(CLEANUP_PRESETS.integration)

			try {
				await cleanupManager.cleanup(vscodeEnv.api)
			} catch (error) {
				console.error("Error during createWebviewTestUtils cleanup:", error)
			}
		},
	}
}

// Async testing utilities
export const waitForVSCodeMessage = async (
	vscodeEnv: VSCodeMockEnvironment,
	messageType: string,
	timeout = 5000,
): Promise<any> => {
	// Wrap the promise in cleanup tracking
	const messagePromise = vscodeEnv.waitForMessage(messageType as any, timeout)
	return wrapPromiseForCleanup(messagePromise, `vscode-message-${messageType}`)
}

export const assertVSCodeMessagePosted = (
	vscodeEnv: VSCodeMockEnvironment,
	expectedType: string,
	expectedPartial?: Record<string, any>,
) => {
	const messages = vscodeEnv.getPostedMessages()
	const targetMessage = messages.find((msg) => msg.type === expectedType)

	expect(targetMessage).toBeDefined()

	if (expectedPartial) {
		expect(targetMessage).toEqual(expect.objectContaining(expectedPartial))
	}

	return targetMessage
}

export const assertNoVSCodeMessagePosted = (vscodeEnv: VSCodeMockEnvironment, messageType: string) => {
	const messages = vscodeEnv.getPostedMessages()
	const targetMessage = messages.find((msg) => msg.type === messageType)

	expect(targetMessage).toBeUndefined()
}

// Enhanced async testing utilities with cleanup integration

/**
 * Create a timeout that is automatically tracked for cleanup
 */
export const createTrackedTimeout = (callback: () => void, delay: number, id?: string): NodeJS.Timeout => {
	return createCleanupAwareTimeout(callback, delay, id)
}

/**
 * Create an interval that is automatically tracked for cleanup
 */
export const createTrackedInterval = (callback: () => void, delay: number, id?: string): NodeJS.Timeout => {
	return createCleanupAwareInterval(callback, delay, id)
}

/**
 * Wait for a condition with cleanup tracking
 */
export const waitForWithCleanup = async function <T>(
	condition: () => T | Promise<T>,
	timeout = 5000,
	interval = 50,
	id?: string,
): Promise<T> {
	const startTime = Date.now()
	const timeoutId = createTrackedTimeout(
		() => {
			throw new Error(`Timeout waiting for condition after ${timeout}ms`)
		},
		timeout,
		id ? `${id}-timeout` : undefined,
	)

	try {
		while (true) {
			try {
				const result = await condition()
				if (result) {
					return result
				}
			} catch (_error) {
				// Continue waiting if condition throws
			}

			if (Date.now() - startTime >= timeout) {
				throw new Error(`Timeout waiting for condition after ${timeout}ms`)
			}

			await new Promise((resolve) => createTrackedTimeout(resolve, interval, id ? `${id}-check` : undefined))
		}
	} finally {
		clearTimeout(timeoutId)
	}
}

/**
 * Enhanced render result with async cleanup capabilities
 */
interface AsyncCleanupRenderResult extends ReturnType<typeof customRender> {
	/** Enhanced unmount function that waits for async operations */
	unmount: () => Promise<void>
	/** Perform comprehensive async cleanup */
	asyncCleanup: () => Promise<void>
}

/**
 * Enhanced render function with async cleanup tracking
 */
export const renderWithAsyncCleanup = (
	ui: ReactElement,
	options: CustomRenderOptions & { cleanupPreset?: keyof typeof CLEANUP_PRESETS } = {},
): AsyncCleanupRenderResult => {
	const { cleanupPreset = "component", ...renderOptions } = options
	const cleanupManager = getCleanupManager(CLEANUP_PRESETS[cleanupPreset])

	const result = customRender(ui, renderOptions)

	// Track the unmount function for cleanup
	const originalUnmount = result.unmount
	const enhancedUnmount = async () => {
		try {
			// Wait for React operations to complete before unmounting
			await cleanupManager.getReactCleanup().waitForReactCompletion(2000)
			originalUnmount()
		} catch (error) {
			console.error("Error during async unmount:", error)
			originalUnmount() // Fallback to synchronous unmount
		}
	}

	// Add async cleanup method
	const asyncCleanup = async () => {
		await enhancedUnmount()
		await cleanupManager.cleanup()
	}

	return {
		...result,
		unmount: enhancedUnmount,
		asyncCleanup,
	}
}

/**
 * Enhanced webview render with comprehensive async cleanup
 */
/**
 * Enhanced webview render result with async cleanup capabilities
 */
interface WebviewAsyncRenderResult extends ReturnType<typeof renderWithWebview> {
	/** Enhanced cleanup function that waits for async operations */
	cleanup: () => Promise<void>
	/** Wait for specific async operations to complete */
	waitForAsyncOperations: (timeout?: number) => Promise<void>
}

export const renderWithWebviewAsync = (
	ui: ReactElement,
	options: WebviewRenderOptions & { cleanupPreset?: keyof typeof CLEANUP_PRESETS } = {},
): WebviewAsyncRenderResult => {
	const { cleanupPreset = "integration", ...webviewOptions } = options
	const cleanupManager = getCleanupManager(CLEANUP_PRESETS[cleanupPreset])

	// Create the basic webview render
	const result = renderWithWebview(ui, webviewOptions)

	// Enhance the cleanup function
	const originalCleanup = result.cleanup
	const enhancedCleanup = async () => {
		try {
			// Wait for all async operations to complete
			await cleanupManager.getReactCleanup().waitForReactCompletion(3000)

			// Perform original cleanup
			if (originalCleanup) {
				await originalCleanup()
			}

			// Final cleanup pass
			await cleanupManager.cleanup(result.vscodeEnv?.api)
		} catch (error) {
			console.error("Error during webview async cleanup:", error)
		}
	}

	// Add method to wait for specific operations
	const waitForAsyncOperations = async (timeout = 5000) => {
		await cleanupManager.getReactCleanup().waitForReactCompletion(timeout)
	}

	return {
		...result,
		cleanup: enhancedCleanup,
		waitForAsyncOperations,
	}
}

/**
 * Utility to create async test utilities with proper cleanup
 */
export const createAsyncWebviewTestUtils = (preset: keyof typeof CLEANUP_PRESETS = "integration") => {
	const cleanupManager = getCleanupManager(CLEANUP_PRESETS[preset])
	const vscodeEnv = new VSCodeMockEnvironment()
	const mockState = VSCodeTestUtils.createMockState()

	return {
		vscodeEnv,
		mockState,
		cleanupManager,
		render: (ui: ReactElement, options: Omit<WebviewRenderOptions, "vscodeEnv" | "initialState"> = {}) =>
			renderWithWebviewAsync(ui, { ...options, vscodeEnv, initialState: mockState, cleanupPreset: preset }),
		simulateWebviewLaunch: async () => {
			await VSCodeTestUtils.simulateWebviewLaunch(vscodeEnv, mockState)
			await cleanupManager.getReactCleanup().waitForReactCompletion(2000)
		},
		cleanup: async () => {
			try {
				await cleanupManager.cleanup(vscodeEnv.api)
			} catch (error) {
				console.error("Error during async webview test utils cleanup:", error)
			}
		},
		waitForOperations: async (timeout = 5000) => {
			await cleanupManager.getReactCleanup().waitForReactCompletion(timeout)
		},
	}
}

/**
 * Debug utility to check cleanup state during tests
 */
export const checkCleanupState = () => {
	const cleanupManager = getCleanupManager()
	const stats = cleanupManager.getStats()

	if (stats.operations.timeouts > 0 || stats.operations.intervals > 0) {
		console.warn("Pending async operations detected:", stats)
	}

	return stats
}

/**
 * Utility to run a test function with automatic cleanup
 */
export const withAsyncCleanup = async function <T>(
	testFn: () => Promise<T>,
	preset: keyof typeof CLEANUP_PRESETS = "component",
): Promise<T> {
	const cleanupManager = getCleanupManager(CLEANUP_PRESETS[preset])

	try {
		return await testFn()
	} finally {
		try {
			await cleanupManager.cleanup()
		} catch (error) {
			console.error("Error in withAsyncCleanup:", error)
		}
	}
}
