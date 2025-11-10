import { vi } from "vitest"

// Global test setup for retry mechanism tests

// Mock console methods to reduce noise in tests
global.console = {
	...console,
	// Uncomment to ignore specific console logs during tests
	// log: vi.fn(),
	// warn: vi.fn(),
	// error: vi.fn(),
}

// Mock performance API for consistent timing
Object.defineProperty(global, "performance", {
	value: {
		now: vi.fn().mockReturnValue(Date.now()),
		mark: vi.fn(),
		measure: vi.fn(),
		getEntriesByName: vi.fn().mockReturnValue([]),
		getEntriesByType: vi.fn().mockReturnValue([]),
		clearMarks: vi.fn(),
		clearMeasures: vi.fn(),
	},
	writable: true,
})

// Mock process.memoryUsage for Node.js environment
if (typeof process === "undefined") {
	;(global as any).process = {
		memoryUsage: vi.fn().mockReturnValue({
			heapUsed: 1024 * 1024, // 1MB
			heapTotal: 2 * 1024 * 1024, // 2MB
			external: 1024 * 512, // 512KB
			rss: 1024 * 1024 * 1.5, // 1.5MB
		}),
		nextTick: vi.fn((callback) => setTimeout(callback, 0)),
	}
}

// Mock setTimeout and clearTimeout for consistent timing
const originalSetTimeout = global.setTimeout
const originalClearTimeout = global.clearTimeout

global.setTimeout = vi.fn().mockImplementation((callback, delay) => {
	return originalSetTimeout(callback, delay)
})

global.clearTimeout = vi.fn().mockImplementation((id) => {
	return originalClearTimeout(id)
})

// Mock fetch for network-related tests
global.fetch = vi.fn().mockImplementation(() =>
	Promise.resolve({
		ok: true,
		status: 200,
		json: () => Promise.resolve({}),
		text: () => Promise.resolve(""),
		headers: new Map(),
	}),
)

// Mock AbortController for timeout handling
global.AbortController = vi.fn().mockImplementation(() => ({
	signal: {
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		aborted: false,
	},
	abort: vi.fn(),
}))

// Mock ResizeObserver for UI tests
global.ResizeObserver = vi.fn().mockImplementation(() => ({
	observe: vi.fn(),
	unobserve: vi.fn(),
	disconnect: vi.fn(),
}))

// Mock IntersectionObserver for UI tests
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
	observe: vi.fn(),
	unobserve: vi.fn(),
	disconnect: vi.fn(),
}))

// Mock requestAnimationFrame for UI animations
global.requestAnimationFrame = vi.fn().mockImplementation((callback) => {
	return setTimeout(callback, 16) // ~60fps
})

global.cancelAnimationFrame = vi.fn().mockImplementation((id) => {
	clearTimeout(id)
})

// Mock localStorage for settings persistence
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

Object.defineProperty(global, "localStorage", {
	value: localStorageMock,
	writable: true,
})

// Mock sessionStorage for temporary storage
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

Object.defineProperty(global, "sessionStorage", {
	value: sessionStorageMock,
	writable: true,
})

// Mock URL constructor for API endpoint testing
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

// Export for use in tests
export { vi }

// Mock WebSocket for real-time communication tests
global.WebSocket = vi.fn().mockImplementation(() => ({
	readyState: 1, // OPEN
	send: vi.fn(),
	close: vi.fn(),
	addEventListener: vi.fn(),
	removeEventListener: vi.fn(),
	onopen: null,
	onclose: null,
	onmessage: null,
	onerror: null,
}))

// Mock EventSource for server-sent events
global.EventSource = vi.fn().mockImplementation(() => ({
	readyState: 1, // OPEN
	close: vi.fn(),
	addEventListener: vi.fn(),
	removeEventListener: vi.fn(),
	onopen: null,
	onmessage: null,
	onerror: null,
}))

// Mock Crypto API for security-related tests
global.crypto = {
	randomUUID: vi.fn().mockReturnValue("test-uuid-12345"),
	getRandomValues: vi.fn().mockImplementation((array) => {
		for (let i = 0; i < array.length; i++) {
			array[i] = Math.floor(Math.random() * 256)
		}
		return array
	}),
	subtle: {
		digest: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
		encrypt: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
		decrypt: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
	},
} as any

// Mock TextEncoder/TextDecoder for encoding tests
global.TextEncoder = vi.fn().mockImplementation(() => ({
	encode: vi.fn().mockReturnValue(new Uint8Array()),
}))

global.TextDecoder = vi.fn().mockImplementation(() => ({
	decode: vi.fn().mockReturnValue(""),
}))

// Mock Blob for file handling tests
global.Blob = vi.fn().mockImplementation((content, options) => ({
	content,
	options,
	size: content ? content.toString().length : 0,
	type: options?.type || "",
	slice: vi.fn(),
	stream: vi.fn(),
	text: vi.fn().mockResolvedValue(""),
	arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
}))

// Mock File for file upload tests
global.File = vi.fn().mockImplementation((content, name, options) => ({
	content,
	name,
	options,
	size: content ? content.toString().length : 0,
	type: options?.type || "",
	lastModified: Date.now(),
	slice: vi.fn(),
	stream: vi.fn(),
	text: vi.fn().mockResolvedValue(""),
	arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
})) as any

// Mock FormData for multipart form tests
global.FormData = vi.fn().mockImplementation(() => ({
	append: vi.fn(),
	delete: vi.fn(),
	get: vi.fn(),
	getAll: vi.fn(),
	has: vi.fn(),
	set: vi.fn(),
	entries: vi.fn().mockReturnValue([]),
	keys: vi.fn().mockReturnValue([]),
	values: vi.fn().mockReturnValue([]),
}))

// Mock Headers for HTTP header tests
global.Headers = vi.fn().mockImplementation((init) => {
	const headers = new Map()
	if (init) {
		Object.entries(init).forEach(([key, value]) => {
			headers.set(key, value)
		})
	}
	return {
		append: vi.fn((key: string, value: string) => headers.set(key, value)),
		delete: vi.fn((key: string) => headers.delete(key)),
		get: vi.fn((key: string) => headers.get(key)),
		has: vi.fn((key: string) => headers.has(key)),
		set: vi.fn((key: string, value: string) => headers.set(key, value)),
		entries: vi.fn(() => headers.entries()),
		keys: vi.fn(() => headers.keys()),
		values: vi.fn(() => headers.values()),
		forEach: vi.fn((callback: (value: string, key: string, map: Map<string, string>) => void) => {
			headers.forEach((value, key) => callback(value, key, headers))
		}),
	}
})

// Mock Response for fetch response testing
global.Response = vi.fn().mockImplementation((body, init) => ({
	body,
	init,
	ok: (init?.status || 200) < 400,
	status: init?.status || 200,
	statusText: init?.statusText || "OK",
	headers: new Headers(init?.headers),
	json: vi.fn().mockResolvedValue(body ? JSON.parse(body) : {}),
	text: vi.fn().mockResolvedValue(body || ""),
	blob: vi.fn().mockResolvedValue(new Blob()),
	arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
	clone: vi.fn(),
}))

// Mock Request for fetch request testing
global.Request = vi.fn().mockImplementation((input, init) => ({
	input,
	init,
	url: typeof input === "string" ? input : input.url,
	method: init?.method || "GET",
	headers: new Headers(init?.headers),
	body: init?.body,
	clone: vi.fn(),
	json: vi.fn().mockResolvedValue({}),
	text: vi.fn().mockResolvedValue(""),
}))(
	// Setup global test utilities
	global as any,
).testUtils = {
	createMockError: (message: string, type: string = "Error") => {
		const error = new Error(message)
		error.name = type
		return error
	},
	createMockResponse: (data: any, status: number = 200) => ({
		ok: status < 400,
		status,
		data,
		json: () => Promise.resolve(data),
		text: () => Promise.resolve(JSON.stringify(data)),
	}),
	waitFor: (condition: () => boolean, timeout: number = 5000) => {
		return new Promise((resolve, reject) => {
			const startTime = Date.now()
			const check = () => {
				if (condition()) {
					resolve(true)
				} else if (Date.now() - startTime > timeout) {
					reject(new Error("Condition not met within timeout"))
				} else {
					setTimeout(check, 10)
				}
			}
			check()
		})
	},
}

// Clean up function for tests
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
})

// Global error handler for unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
	console.error("Unhandled Promise Rejection in test:", reason)
})

// Global error handler for uncaught exceptions
process.on("uncaughtException", (error) => {
	console.error("Uncaught Exception in test:", error)
})
