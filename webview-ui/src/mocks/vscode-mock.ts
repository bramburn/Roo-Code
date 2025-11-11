import { vi } from "vitest"
import type { WebviewApi } from "vscode-webview"
import type { WebviewMessage } from "@roo/WebviewMessage"
import type { ExtensionMessage, ExtensionState } from "@roo/ExtensionMessage"

/**
 * Mock VS Code API for testing webview components
 * Provides comprehensive mocking of VS Code webview functionality
 */

export interface MockVSCodeApi extends WebviewApi<unknown> {
	// Enhanced mock methods for testing
	_postMessage: vi.Mock
	_getState: vi.Mock
	_setState: vi.Mock
	// Event handling
	onMessage: ((event: MessageEvent) => void) | null
	// Message queue for testing
	messageQueue: WebviewMessage[]
	// State management
	state: unknown
	// Event simulation utilities
	simulateMessage: (message: ExtensionMessage) => void
	simulateStateUpdate: (state: ExtensionState) => void
	clearMessageQueue: () => void
	getPostedMessages: () => WebviewMessage[]
	reset: () => void
}

/**
 * Create a mock VS Code API instance
 */
export function createMockVSCodeApi(): MockVSCodeApi {
	const messageQueue: WebviewMessage[] = []
	let state: unknown = undefined
	let onMessageHandler: ((event: MessageEvent) => void) | null = null

	const mockApi = {
		// Core WebviewApi methods
		postMessage: vi.fn((message: WebviewMessage) => {
			messageQueue.push(message)
			// Simulate async message posting
			Promise.resolve().then(() => {
				// In real VS Code, this would trigger the extension's message handler
				// For testing, we just store the message
			})
		}),

		getState: vi.fn(() => state),

		setState: vi.fn((newState: unknown) => {
			state = newState
			return newState
		}),

		// Enhanced testing utilities
		get _postMessage() {
			return this.postMessage
		},
		get _getState() {
			return this.getState
		},
		get _setState() {
			return this.setState
		},

		// Event handling
		get onMessage() {
			return onMessageHandler
		},
		set onMessage(handler: ((event: MessageEvent) => void) | null) {
			onMessageHandler = handler
		},

		// Message queue for testing
		get messageQueue() {
			return [...messageQueue]
		},

		// State management
		get state() {
			return state
		},
		set state(newState: unknown) {
			state = newState
		},

		// Event simulation utilities
		simulateMessage: (message: ExtensionMessage) => {
			if (onMessageHandler) {
				const mockEvent = new MessageEvent("message", { data: message })
				onMessageHandler(mockEvent)
			}
		},

		simulateStateUpdate: (newState: ExtensionState) => {
			const stateMessage: ExtensionMessage = {
				type: "state",
				state: newState,
			}
			mockApi.simulateMessage(stateMessage)
		},

		clearMessageQueue: () => {
			messageQueue.length = 0
		},

		getPostedMessages: () => {
			return [...messageQueue]
		},

		reset: () => {
			messageQueue.length = 0
			state = undefined
			onMessageHandler = null
			mockApi.postMessage.mockClear()
			mockApi.getState.mockClear()
			mockApi.setState.mockClear()
		},
	}

	return mockApi
}

/**
 * Mock acquireVsCodeApi function
 */
export function mockAcquireVsCodeApi(): MockVSCodeApi {
	const mockApi = createMockVSCodeApi()

	// Mock the global acquireVsCodeApi function
	if (typeof global !== "undefined") {
		;(global as any).acquireVsCodeApi = vi.fn(() => mockApi)
	} else if (typeof window !== "undefined") {
		;(window as any).acquireVsCodeApi = vi.fn(() => mockApi)
	}

	return mockApi
}

/**
 * Restore the original acquireVsCodeApi function
 */
export function restoreAcquireVsCodeApi(): void {
	if (typeof global !== "undefined") {
		delete (global as any).acquireVsCodeApi
	} else if (typeof window !== "undefined") {
		delete (window as any).acquireVsCodeApi
	}
}

/**
 * Mock VS Code environment setup and teardown utilities
 */
export class VSCodeMockEnvironment {
	private mockApi: MockVSCodeApi

	constructor() {
		this.mockApi = mockAcquireVsCodeApi()
	}

	/**
	 * Get the mock VS Code API instance
	 */
	get api(): MockVSCodeApi {
		return this.mockApi
	}

	/**
	 * Simulate a message from the extension to the webview
	 */
	simulateExtensionMessage(message: ExtensionMessage): void {
		this.mockApi.simulateMessage(message)
	}

	/**
	 * Simulate a state update from the extension
	 */
	simulateStateUpdate(state: ExtensionState): void {
		this.mockApi.simulateStateUpdate(state)
	}

	/**
	 * Get all messages posted from webview to extension
	 */
	getPostedMessages(): WebviewMessage[] {
		return this.mockApi.getPostedMessages()
	}

	/**
	 * Get the last message posted from webview to extension
	 */
	getLastPostedMessage(): WebviewMessage | undefined {
		const messages = this.mockApi.getPostedMessages()
		return messages[messages.length - 1]
	}

	/**
	 * Clear all posted messages
	 */
	clearPostedMessages(): void {
		this.mockApi.clearMessageQueue()
	}

	/**
	 * Set initial state for the webview
	 */
	setInitialState(state: unknown): void {
		this.mockApi.state = state
	}

	/**
	 * Wait for a specific message type to be posted
	 */
	async waitForMessage(type: WebviewMessage["type"], timeout = 5000): Promise<WebviewMessage> {
		return new Promise((resolve, reject) => {
			const checkMessage = () => {
				const messages = this.mockApi.getPostedMessages()
				const message = messages.find((msg) => msg.type === type)
				if (message) {
					clearTimeout(timeoutId)
					resolve(message)
				} else {
					setTimeout(checkMessage, 10)
				}
			}

			const timeoutId = setTimeout(() => {
				reject(new Error(`Timeout waiting for message type: ${type}`))
			}, timeout)

			checkMessage()
		})
	}

	/**
	 * Cleanup and restore original environment
	 */
	cleanup(): void {
		this.mockApi.reset()
		restoreAcquireVsCodeApi()
	}

	/**
	 * Reset the mock environment (alias for cleanup)
	 */
	reset(): void {
		this.cleanup()
	}
}

/**
 * Utility functions for common VS Code testing scenarios
 */
export const VSCodeTestUtils = {
	/**
	 * Create a mock extension state with default values
	 */
	createMockState: (overrides: Partial<ExtensionState> = {}): ExtensionState => ({
		version: "1.0.0-test",
		clineMessages: [],
		taskHistory: [],
		shouldShowAnnouncement: false,
		allowedCommands: [],
		deniedCommands: [],
		soundEnabled: false,
		soundVolume: 0.5,
		ttsEnabled: false,
		ttsSpeed: 1.0,
		diffEnabled: false,
		enableCheckpoints: true,
		checkpointTimeout: 15,
		fuzzyMatchThreshold: 1.0,
		language: "en",
		writeDelayMs: 1000,
		browserViewportSize: "900x600",
		screenshotQuality: 75,
		terminalOutputLineLimit: 500,
		terminalOutputCharacterLimit: 50000,
		terminalShellIntegrationTimeout: 4000,
		mcpEnabled: true,
		enableMcpServerCreation: false,
		remoteControlEnabled: false,
		taskSyncEnabled: false,
		featureRoomoteControlEnabled: false,
		alwaysApproveResubmit: false,
		requestDelaySeconds: 5,
		currentApiConfigName: "default",
		listApiConfigMeta: [],
		mode: "code",
		customModePrompts: {},
		customSupportPrompts: {},
		experiments: {},
		enhancementApiConfigId: "",
		condensingApiConfigId: "",
		customCondensingPrompt: "",
		hasOpenedModeSelector: false,
		autoApprovalEnabled: false,
		customModes: [],
		maxOpenTabsContext: 20,
		maxWorkspaceFiles: 200,
		cwd: "/test/workspace",
		browserToolEnabled: true,
		telemetrySetting: "unset",
		showRooIgnoredFiles: true,
		renderContext: "sidebar",
		maxReadFileLine: -1,
		maxImageFileSize: 5,
		maxTotalImageSize: 20,
		pinnedApiConfigs: {},
		terminalZshOhMy: false,
		maxConcurrentFileReads: 5,
		terminalZshP10k: false,
		terminalZdotdir: false,
		terminalCompressProgressBar: true,
		historyPreviewCollapsed: false,
		reasoningBlockCollapsed: true,
		cloudUserInfo: null,
		cloudIsAuthenticated: false,
		cloudOrganizations: [],
		sharingEnabled: false,
		organizationAllowList: { allowList: [], enabled: false },
		organizationSettingsVersion: -1,
		autoCondenseContext: true,
		autoCondenseContextPercent: 100,
		profileThresholds: {},
		codebaseIndexConfig: {
			codebaseIndexEnabled: true,
			codebaseIndexQdrantUrl: "http://localhost:6333",
			codebaseIndexEmbedderProvider: "openai",
			codebaseIndexEmbedderBaseUrl: "",
			codebaseIndexEmbedderModelId: "",
			codebaseIndexSearchMaxResults: undefined,
			codebaseIndexSearchMinScore: undefined,
		},
		codebaseIndexModels: { ollama: {}, openai: {} },
		alwaysAllowUpdateTodoList: true,
		includeDiagnosticMessages: true,
		maxDiagnosticMessages: 50,
		openRouterImageApiKey: "",
		openRouterImageGenerationSelectedModel: "",
		includeCurrentTime: true,
		includeCurrentCost: true,
		enableManualReview: false,
		...overrides,
	}),

	/**
	 * Create a mock webview message
	 */
	createMockMessage: (type: WebviewMessage["type"], overrides: Partial<WebviewMessage> = {}): WebviewMessage =>
		({
			type,
			...overrides,
		}) as WebviewMessage,

	/**
	 * Simulate a typical webview launch sequence
	 */
	simulateWebviewLaunch: async (env: VSCodeMockEnvironment, initialState?: ExtensionState): Promise<void> => {
		if (initialState) {
			env.setInitialState(initialState)
		}

		// Simulate the initial state message that would come from the extension
		const mockState = VSCodeTestUtils.createMockState(initialState)
		env.simulateStateUpdate(mockState)

		// Wait for webviewDidLaunch message
		await env.waitForMessage("webviewDidLaunch")
	},
}

export default VSCodeMockEnvironment
