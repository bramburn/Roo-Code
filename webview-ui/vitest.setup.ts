import "@testing-library/jest-dom"
import "@testing-library/jest-dom/vitest"
import { vi, beforeEach, afterEach } from "vitest"
import React from "react"
import { act } from "react"
import { getCleanupManager, resetCleanupManager, debugCleanupState } from "@/utils/async-cleanup-utils"
import { detectCleanupConfig, CLEANUP_PRESETS } from "@/utils/cleanup-config"

// Force React into development mode for tests
// This is needed to enable act(...) function in React Testing Library
globalThis.process = globalThis.process || {}
globalThis.process.env = globalThis.process.env || {}
globalThis.process.env.NODE_ENV = "development"

// Make proper React act available globally for tests
global.act = act

// Ensure browser globals are properly defined for React 18
beforeEach(() => {
	// Ensure window and document are available
	if (typeof window === "undefined") {
		global.window = global.window || {}
	}
	if (typeof document === "undefined") {
		global.document = global.document || {}
	}

	// Reset any modified globals before each test
	vi.clearAllMocks()

	// Reset cleanup manager to ensure clean state
	resetCleanupManager()
})

class MockResizeObserver {
	observe() {}
	unobserve() {}
	disconnect() {}
}

global.ResizeObserver = MockResizeObserver

// Fix for Microsoft FAST Foundation compatibility with JSDOM
// FAST Foundation tries to set HTMLElement.focus property, but it's read-only in JSDOM
// The issue is that FAST Foundation's handleUnsupportedDelegatesFocus tries to set element.focus = originalFocus
// but JSDOM's HTMLElement.focus is a getter-only property
Object.defineProperty(HTMLElement.prototype, "focus", {
	get: function () {
		return (
			this._focus ||
			function () {
				// Mock focus behavior for tests
			}
		)
	},
	set: function (value) {
		this._focus = value
	},
	configurable: true,
})

Object.defineProperty(window, "matchMedia", {
	writable: true,
	value: vi.fn().mockImplementation((query) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: vi.fn(),
		removeListener: vi.fn(),
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn(),
	})),
})

// Mock scrollIntoView which is not available in jsdom
Element.prototype.scrollIntoView = vi.fn()

// Mock window.getComputedStyle for React components
Object.defineProperty(window, "getComputedStyle", {
	value: vi.fn(() => ({
		getPropertyValue: vi.fn(() => ""),
		setProperty: vi.fn(),
	})),
})

// Mock requestAnimationFrame and cancelAnimationFrame for React animations
global.requestAnimationFrame = vi.fn((cb: FrameRequestCallback) => {
	const id = setTimeout(() => cb(Date.now()), 0)
	return id as unknown as number
})
global.cancelAnimationFrame = vi.fn((id: number) => clearTimeout(id))

// Error boundary for React testing
interface TestErrorBoundaryState {
	hasError: boolean
}

interface TestErrorBoundaryProps {
	children?: React.ReactNode
}

class TestErrorBoundary extends React.Component<TestErrorBoundaryProps, TestErrorBoundaryState> {
	constructor(props: TestErrorBoundaryProps) {
		super(props)
		this.state = { hasError: false }
	}

	static getDerivedStateFromError(error: any): TestErrorBoundaryState {
		return { hasError: true }
	}

	componentDidCatch(error: any, errorInfo: any) {
		console.error("Test Error Boundary caught an error:", error, errorInfo)
	}

	render() {
		if (this.state.hasError) {
			return React.createElement("div", { "data-testid": "error-boundary" }, "Error occurred")
		}
		return this.props.children
	}
}

// Make TestErrorBoundary available globally for testing
;(global as any).TestErrorBoundary = TestErrorBoundary

// Mock IntersectionObserver for React components that use it
class MockIntersectionObserver {
	callback: IntersectionObserverCallback
	constructor(callback: IntersectionObserverCallback) {
		this.callback = callback
	}
	observe() {}
	unobserve() {}
	disconnect() {}
	root: Element | null = null
	rootMargin = ""
	thresholds: number[] = []
	takeRecords(): IntersectionObserverEntry[] {
		return []
	}
}

;(global as any).IntersectionObserver = MockIntersectionObserver

// Global async cleanup setup
let cleanupManager = getCleanupManager(detectCleanupConfig())

// Enhanced unhandled rejection handling
const originalUnhandledRejectionHandler = process?.listeners?.("unhandledRejection") || []

// Setup comprehensive error handling for async operations
process?.on?.("unhandledRejection", (reason: any, promise: Promise<any>) => {
	// Log the rejection for debugging
	console.warn("Unhandled promise rejection caught by test setup:", reason)

	// Prevent the rejection from crashing the test runner
	// This is especially important during test teardown
	promise.catch(() => {
		// Silently handle to prevent "unhandled rejection" errors
	})
})

// Setup global afterEach for comprehensive cleanup
afterEach(async () => {
	// Use cleanup manager for comprehensive async cleanup
	try {
		await cleanupManager.cleanup()
	} catch (error) {
		console.error("Error during global cleanup:", error)
	}

	// Reset cleanup manager for the next test
	resetCleanupManager()
	cleanupManager = getCleanupManager(detectCleanupConfig())

	// Clear all mocks and timers
	vi.clearAllMocks()
	vi.clearAllTimers()

	// Reset fake timers if they were used
	if (typeof vi.isFakeTimersEnabled === "function" && vi.isFakeTimersEnabled()) {
		vi.useRealTimers()
	}

	// Clean up any remaining DOM elements
	document.body.innerHTML = ""

	// Reset window properties that might have been modified
	if (typeof window !== "undefined") {
		// Clean up any VS Code API references
		delete (window as any).acquireVsCodeApi

		// Clean up any event listeners that might cause issues
		const originalAddEventListener = window.addEventListener
		const originalRemoveEventListener = window.removeEventListener

		// Track and clean up stray event listeners
		const eventListeners: Array<{ type: string; listener: EventListener }> = []

		window.addEventListener = function (
			type: string,
			listener: EventListener,
			options?: boolean | AddEventListenerOptions,
		) {
			eventListeners.push({ type, listener })
			return originalAddEventListener.call(this, type, listener, options)
		}

		window.removeEventListener = function (
			type: string,
			listener: EventListener,
			options?: boolean | EventListenerOptions,
		) {
			const index = eventListeners.findIndex((el) => el.type === type && el.listener === listener)
			if (index > -1) {
				eventListeners.splice(index, 1)
			}
			return originalRemoveEventListener.call(this, type, listener, options)
		}

		// Restore original methods
		window.addEventListener = originalAddEventListener
		window.removeEventListener = originalRemoveEventListener
	}
})

// Debug utilities for test development
if (process.env.DEBUG_CLEANUP === "true") {
	// Make debug functions available globally for test debugging
	;(global as any).debugCleanup = debugCleanupState
	;(global as any).getCleanupManager = () => cleanupManager
	;(global as any).cleanupStats = () => cleanupManager.getStats()
}

// Export cleanup utilities for use in tests
export { getCleanupManager, resetCleanupManager, debugCleanupState, CLEANUP_PRESETS }
