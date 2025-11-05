import "@testing-library/jest-dom"
import "@testing-library/jest-dom/vitest"
import { vi, beforeEach } from "vitest"

// Force React into development mode for tests
// This is needed to enable act(...) function in React Testing Library
globalThis.process = globalThis.process || {}
globalThis.process.env = globalThis.process.env || {}
globalThis.process.env.NODE_ENV = "development"

// Mock React's internal act function
const React = require("react")
React.act = vi.fn((callback) => {
	// Simple implementation for React.act in test environment
	const result = callback()
	// In a real implementation, this would handle async updates and batching
	return result
})

// Ensure React hooks are available globally
beforeEach(() => {
	// Reset React's internal state before each test
	// This ensures hooks like useMemo, useState, etc. work properly
	// Verify that React hooks are available
	if (!React.useState || !React.useMemo || !React.useEffect) {
		throw new Error("React hooks are not available in test environment")
	}
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
