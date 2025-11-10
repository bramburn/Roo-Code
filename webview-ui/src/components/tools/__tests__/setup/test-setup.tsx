import { vi } from "vitest"
import { configure } from "@testing-library/react"

// Configure React Testing Library
configure({
	testIdAttribute: "data-testid",
	asyncUtilTimeout: 5000,
})

// Mock framer-motion for all component tests
vi.mock("framer-motion", () => ({
	motion: {
		div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
		span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
		button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
		form: ({ children, ...props }: any) => <form {...props}>{children}</form>,
		label: ({ children, ...props }: any) => <label {...props}>{children}</label>,
		input: ({ children, ...props }: any) => <input {...props}>{children}</input>,
		select: ({ children, ...props }: any) => <select {...props}>{children}</select>,
		option: ({ children, ...props }: any) => <option {...props}>{children}</option>,
		textarea: ({ children, ...props }: any) => <textarea {...props}>{children}</textarea>,
	},
	AnimatePresence: ({ children }: any) => <>{children}</>,
	MotionConfig: ({ children }: any) => <>{children}</>,
	LazyMotion: ({ children }: any) => <>{children}</>,
	m: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}))

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
	// Retry component icons
	RefreshCw: ({ className, size, ...props }: any) => (
		<div data-testid="refresh-icon" className={className} data-size={size} {...props} />
	),
	AlertCircle: ({ className, size, ...props }: any) => (
		<div data-testid="alert-icon" className={className} data-size={size} {...props} />
	),
	CheckCircle: ({ className, size, ...props }: any) => (
		<div data-testid="check-icon" className={className} data-size={size} {...props} />
	),
	XCircle: ({ className, size, ...props }: any) => (
		<div data-testid="x-icon" className={className} data-size={size} {...props} />
	),
	Clock: ({ className, size, ...props }: any) => (
		<div data-testid="clock-icon" className={className} data-size={size} {...props} />
	),

	// Settings component icons
	Settings: ({ className, size, ...props }: any) => (
		<div data-testid="settings-icon" className={className} data-size={size} {...props} />
	),
	Save: ({ className, size, ...props }: any) => (
		<div data-testid="save-icon" className={className} data-size={size} {...props} />
	),
	X: ({ className, size, ...props }: any) => (
		<div data-testid="x-icon" className={className} data-size={size} {...props} />
	),
	Info: ({ className, size, ...props }: any) => (
		<div data-testid="info-icon" className={className} data-size={size} {...props} />
	),
	AlertTriangle: ({ className, size, ...props }: any) => (
		<div data-testid="alert-icon" className={className} data-size={size} {...props} />
	),
	Check: ({ className, size, ...props }: any) => (
		<div data-testid="check-icon" className={className} data-size={size} {...props} />
	),

	// Error recovery component icons
	SkipForward: ({ className, size, ...props }: any) => (
		<div data-testid="skip-icon" className={className} data-size={size} {...props} />
	),
	ChevronDown: ({ className, size, ...props }: any) => (
		<div data-testid="chevron-icon" className={className} data-size={size} {...props} />
	),

	// Common icons that might be used
	Loader: ({ className, size, ...props }: any) => (
		<div data-testid="loader-icon" className={className} data-size={size} {...props} />
	),
	Trash: ({ className, size, ...props }: any) => (
		<div data-testid="trash-icon" className={className} data-size={size} {...props} />
	),
	Download: ({ className, size, ...props }: any) => (
		<div data-testid="download-icon" className={className} data-size={size} {...props} />
	),
	Upload: ({ className, size, ...props }: any) => (
		<div data-testid="upload-icon" className={className} data-size={size} {...props} />
	),
	Eye: ({ className, size, ...props }: any) => (
		<div data-testid="eye-icon" className={className} data-size={size} {...props} />
	),
	EyeOff: ({ className, size, ...props }: any) => (
		<div data-testid="eye-off-icon" className={className} data-size={size} {...props} />
	),
	Copy: ({ className, size, ...props }: any) => (
		<div data-testid="copy-icon" className={className} data-size={size} {...props} />
	),
	ExternalLink: ({ className, size, ...props }: any) => (
		<div data-testid="external-link-icon" className={className} data-size={size} {...props} />
	),
}))

// Mock CSS modules for component styling
vi.mock("../RetryStatus.module.css", () => ({
	default: {
		container: "mock-retry-status-container",
		retrying: "mock-retrying",
		success: "mock-success",
		error: "mock-error",
		warning: "mock-warning",
		progress: "mock-progress",
		actions: "mock-actions",
		button: "mock-button",
		buttonPrimary: "mock-button-primary",
		buttonSecondary: "mock-button-secondary",
		icon: "mock-icon",
		spinner: "mock-spinner",
		message: "mock-message",
		errorMessage: "mock-error-message",
		details: "mock-details",
	},
}))

vi.mock("../RetrySettings.module.css", () => ({
	default: {
		container: "mock-retry-settings-container",
		modal: "mock-modal",
		header: "mock-header",
		title: "mock-title",
		content: "mock-content",
		form: "mock-form",
		fieldset: "mock-fieldset",
		legend: "mock-legend",
		field: "mock-field",
		label: "mock-label",
		input: "mock-input",
		select: "mock-select",
		textarea: "mock-textarea",
		checkbox: "mock-checkbox",
		radio: "mock-radio",
		slider: "mock-slider",
		switch: "mock-switch",
		actions: "mock-actions",
		button: "mock-button",
		buttonPrimary: "mock-button-primary",
		buttonSecondary: "mock-button-secondary",
		buttonDanger: "mock-button-danger",
		presetContainer: "mock-preset-container",
		presetSelect: "mock-preset-select",
		helpText: "mock-help-text",
		errorText: "mock-error-text",
		warningText: "mock-warning-text",
		successText: "mock-success-text",
		validationSummary: "mock-validation-summary",
	},
}))

vi.mock("../ErrorRecovery.module.css", () => ({
	default: {
		container: "mock-error-recovery-container",
		modal: "mock-modal",
		overlay: "mock-overlay",
		header: "mock-header",
		title: "mock-title",
		content: "mock-content",
		errorType: "mock-error-type",
		errorMessage: "mock-error-message",
		errorDetails: "mock-error-details",
		actions: "mock-actions",
		button: "mock-button",
		buttonPrimary: "mock-button-primary",
		buttonSecondary: "mock-button-secondary",
		buttonDanger: "mock-button-danger",
		suggestions: "mock-suggestions",
		suggestion: "mock-suggestion",
		progress: "mock-progress",
		progressBar: "mock-progress-bar",
		tips: "mock-tips",
		tip: "mock-tip",
		mobileLayout: "mock-mobile-layout",
		desktopLayout: "mock-desktop-layout",
	},
}))

// Mock React hooks
vi.mock("react", async () => {
	const actual = await vi.importActual("react")
	return {
		...actual,
		// Add any custom hook mocks if needed
	}
})

// Mock React DOM
vi.mock("react-dom", async () => {
	const actual = await vi.importActual("react-dom")
	return {
		...actual,
		// Add any custom DOM mocks if needed
	}
})

// Mock window APIs for UI tests
Object.defineProperty(window, "innerWidth", {
	writable: true,
	configurable: true,
	value: 1024,
})

Object.defineProperty(window, "innerHeight", {
	writable: true,
	configurable: true,
	value: 768,
})

Object.defineProperty(window, "matchMedia", {
	writable: true,
	configurable: true,
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

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
	observe: vi.fn(),
	unobserve: vi.fn(),
	disconnect: vi.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
	observe: vi.fn(),
	unobserve: vi.fn(),
	disconnect: vi.fn(),
}))

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn().mockImplementation((callback) => {
	return setTimeout(callback, 16)
})

global.cancelAnimationFrame = vi.fn().mockImplementation((id) => {
	clearTimeout(id)
})

// Mock localStorage
const localStorageMock = {
	getItem: vi.fn(),
	setItem: vi.fn(),
	removeItem: vi.fn(),
	clear: vi.fn(),
	get length() {
		return 0
	},
	key: vi.fn(),
}

Object.defineProperty(window, "localStorage", {
	value: localStorageMock,
	writable: true,
})

// Mock sessionStorage
const sessionStorageMock = {
	getItem: vi.fn(),
	setItem: vi.fn(),
	removeItem: vi.fn(),
	clear: vi.fn(),
	get length() {
		return 0
	},
	key: vi.fn(),
}

Object.defineProperty(window, "sessionStorage", {
	value: sessionStorageMock,
	writable: true,
})

// Mock CSS.supports
Object.defineProperty(window, "CSS", {
	value: {
		supports: vi.fn().mockReturnValue(true),
	},
	writable: true,
})

// Mock getComputedStyle
Object.defineProperty(window, "getComputedStyle", {
	value: vi.fn().mockReturnValue({
		getPropertyValue: vi.fn().mockReturnValue(""),
	}),
	writable: true,
})

// Mock URL constructor
global.URL = vi.fn().mockImplementation((url: string, base?: string) => {
	return {
		href: base ? `${base}${url}` : url,
		origin: base || "http://localhost",
		protocol: "http:",
		host: "localhost",
		hostname: "localhost",
		port: "",
		pathname: url,
		search: "",
		hash: "",
		toString: () => (base ? `${base}${url}` : url),
	}
}) as any

// Mock Clipboard API
Object.defineProperty(navigator, "clipboard", {
	value: {
		writeText: vi.fn().mockResolvedValue(undefined),
		readText: vi.fn().mockResolvedValue(""),
	},
	writable: true,
})

// Mock Notification API
Object.defineProperty(window, "Notification", {
	value: vi.fn().mockImplementation((title, options) => ({
		title,
		options,
		close: vi.fn(),
		onclick: null,
		onshow: null,
		onerror: null,
		onclose: null,
	})),
	writable: true,
})

Object.defineProperty(Notification, "permission", {
	value: "granted",
	writable: true,
})

Object.defineProperty(Notification, "requestPermission", {
	value: vi.fn().mockResolvedValue("granted"),
	writable: true,
})

// Mock Visual Viewport API
Object.defineProperty(window, "visualViewport", {
	value: {
		width: 1024,
		height: 768,
		offsetLeft: 0,
		offsetTop: 0,
		pageLeft: 0,
		pageTop: 0,
		scale: 1,
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
	},
	writable: true,
})

// Mock Pointer Events
Object.defineProperty(window, "PointerEvent", {
	value: vi.fn().mockImplementation((type, eventInitDict) => ({
		type,
		pointerId: eventInitDict?.pointerId || 0,
		width: eventInitDict?.width || 1,
		height: eventInitDict?.height || 1,
		pressure: eventInitDict?.pressure || 0,
		tangentialPressure: eventInitDict?.tangentialPressure || 0,
		tiltX: eventInitDict?.tiltX || 0,
		tiltY: eventInitDict?.tiltY || 0,
		twist: eventInitDict?.twist || 0,
		pointerType: eventInitDict?.pointerType || "mouse",
		isPrimary: eventInitDict?.isPrimary || false,
		preventDefault: vi.fn(),
		stopPropagation: vi.fn(),
	})),
	writable: true,
})

// Mock Touch Events
Object.defineProperty(window, "TouchEvent", {
	value: vi.fn().mockImplementation((type, eventInitDict) => ({
		type,
		touches: eventInitDict?.touches || [],
		targetTouches: eventInitDict?.targetTouches || [],
		changedTouches: eventInitDict?.changedTouches || [],
		preventDefault: vi.fn(),
		stopPropagation: vi.fn(),
	})),
	writable: true,
})(
	// Global test utilities
	global as any,
).testUtils = {
	// Component testing utilities
	fireEventWithDelay: async (element: HTMLElement, eventType: string, delay: number = 0) => {
		if (delay > 0) {
			await new Promise((resolve) => setTimeout(resolve, delay))
		}
		element.dispatchEvent(new Event(eventType))
	},

	// Form utilities
	fillForm: async (form: HTMLElement, data: Record<string, string>) => {
		const inputs = form.querySelectorAll("input, select, textarea")
		inputs.forEach((input) => {
			const element = input as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
			const name = element.name || element.id
			if (data[name] !== undefined) {
				if (element.type === "checkbox") {
					;(element as HTMLInputElement).checked = Boolean(data[name])
				} else {
					element.value = data[name]
				}
			}
		})
	},

	// Accessibility utilities
	checkAccessibility: (element: HTMLElement) => {
		const issues: string[] = []

		// Check for aria-label
		if (!element.getAttribute("aria-label") && !element.getAttribute("aria-labelledby")) {
			issues.push("Missing aria-label or aria-labelledby")
		}

		// Check for role
		if (!element.getAttribute("role") && element.tagName !== "DIV" && element.tagName !== "SPAN") {
			issues.push("Missing role attribute")
		}

		return issues
	},

	// Responsive testing utilities
	setViewport: (width: number, height: number) => {
		Object.defineProperty(window, "innerWidth", { value: width, writable: true })
		Object.defineProperty(window, "innerHeight", { value: height, writable: true })
		window.dispatchEvent(new Event("resize"))
	},

	// Animation utilities
	waitForAnimation: (element: HTMLElement, animationName: string, timeout: number = 1000) => {
		return new Promise((resolve, reject) => {
			const startTime = Date.now()

			const checkAnimation = () => {
				const animations = (element as any).getAnimations?.() || []
				const hasAnimation = animations.some((anim: any) => anim.animationName.includes(animationName))

				if (hasAnimation) {
					resolve(true)
				} else if (Date.now() - startTime > timeout) {
					reject(new Error(`Animation ${animationName} not found within ${timeout}ms`))
				} else {
					setTimeout(checkAnimation, 16)
				}
			}

			checkAnimation()
		})
	},
}

// Clean up after each test
afterEach(() => {
	vi.clearAllMocks()

	// Reset localStorage
	localStorageMock.getItem.mockClear()
	localStorageMock.setItem.mockClear()
	localStorageMock.removeItem.mockClear()
	localStorageMock.clear.mockClear()

	// Reset sessionStorage
	sessionStorageMock.getItem.mockClear()
	sessionStorageMock.setItem.mockClear()
	sessionStorageMock.removeItem.mockClear()
	sessionStorageMock.clear.mockClear()

	// Reset viewport
	Object.defineProperty(window, "innerWidth", { value: 1024, writable: true })
	Object.defineProperty(window, "innerHeight", { value: 768, writable: true })
})
