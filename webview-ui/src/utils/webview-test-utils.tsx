import { ReactElement } from "react"
import { fireEvent, waitFor, screen } from "@testing-library/react"
import { vi } from "vitest"

import { VSCodeMockEnvironment, VSCodeTestUtils } from "@src/mocks/vscode-mock"
import { renderWithWebview, createWebviewTestUtils as _createWebviewTestUtils } from "@src/utils/test-utils"
import { vscode as _vscode } from "@src/utils/vscode"
import type { WebviewMessage } from "@roo/WebviewMessage"
import type { ExtensionMessage, ExtensionState } from "@roo/ExtensionMessage"

/**
 * Comprehensive webview testing utilities for VS Code extension webviews
 * Provides specialized testing patterns for webview-specific functionality
 */

export interface WebviewTestConfig {
	initialState?: Partial<ExtensionState>
	autoSetupVSCode?: boolean
	mockVsCodeApi?: boolean
	enableTranslationProvider?: boolean
}

export interface WebviewTestResult extends ReturnType<typeof renderWithWebview> {
	// Webview-specific utilities
	vscodeEnv: VSCodeMockEnvironment
	simulateExtensionMessage: (message: ExtensionMessage) => void
	simulateStateUpdate: (state: Partial<ExtensionState>) => void
	simulateWebviewLaunch: () => Promise<void>
	waitForVSCodeMessage: (type: WebviewMessage["type"], timeout?: number) => Promise<WebviewMessage>
	assertVSCodeMessagePosted: (type: WebviewMessage["type"], payload?: Partial<WebviewMessage>) => WebviewMessage
	assertNoVSCodeMessagePosted: (type: WebviewMessage["type"]) => void
	getPostedMessages: () => WebviewMessage[]
	getLastPostedMessage: () => WebviewMessage | undefined
	clearPostedMessages: () => void
	clickVSCodeCommand: (command: string) => void
	typeInChatInput: (text: string) => void
	submitChatMessage: (text?: string) => void
	waitForChatResponse: (timeout?: number) => Promise<void>
}

/**
 * Render a component with full webview testing setup
 */
export function renderWebviewComponent(ui: ReactElement, config: WebviewTestConfig = {}): WebviewTestResult {
	const {
		initialState: partialInitialState,
		autoSetupVSCode = true,
		mockVsCodeApi = true,
		enableTranslationProvider = true,
	} = config

	// Create VS Code mock environment
	const vscodeEnv = new VSCodeMockEnvironment()

	// Create complete initial state
	const initialState = VSCodeTestUtils.createMockState(partialInitialState)

	// Mock the vscode utility if requested
	if (mockVsCodeApi) {
		vi.mock("@src/utils/vscode", () => ({
			vscode: vscodeEnv.api,
		}))
	}

	// Render the component with webview setup
	const result = renderWithWebview(ui, {
		initialState,
		vscodeEnv,
		translationProvider: enableTranslationProvider,
		autoSetupVSCode,
	})

	// Webview-specific utility functions
	const simulateExtensionMessage = (message: ExtensionMessage) => {
		vscodeEnv.simulateExtensionMessage(message)
	}

	const simulateStateUpdate = (stateUpdate: Partial<ExtensionState>) => {
		const updatedState = { ...initialState, ...stateUpdate }
		vscodeEnv.simulateStateUpdate(updatedState)
	}

	const simulateWebviewLaunch = async () => {
		await VSCodeTestUtils.simulateWebviewLaunch(vscodeEnv, initialState)
	}

	const waitForVSCodeMessage = async (type: WebviewMessage["type"], timeout = 5000) => {
		return vscodeEnv.waitForMessage(type, timeout)
	}

	const assertVSCodeMessagePosted = (type: WebviewMessage["type"], payload?: Partial<WebviewMessage>) => {
		const messages = vscodeEnv.getPostedMessages()
		const targetMessage = messages.find((msg) => msg.type === type)

		if (!targetMessage) {
			throw new Error(
				`Expected VS Code message of type "${type}" was not posted. Posted messages: ${JSON.stringify(messages, null, 2)}`,
			)
		}

		if (payload) {
			expect(targetMessage).toEqual(expect.objectContaining(payload))
		}

		return targetMessage
	}

	const assertNoVSCodeMessagePosted = (type: WebviewMessage["type"]) => {
		const messages = vscodeEnv.getPostedMessages()
		const targetMessage = messages.find((msg) => msg.type === type)

		if (targetMessage) {
			throw new Error(`Unexpected VS Code message of type "${type}" was posted: ${JSON.stringify(targetMessage)}`)
		}
	}

	const getPostedMessages = () => vscodeEnv.getPostedMessages()

	const getLastPostedMessage = () => vscodeEnv.getLastPostedMessage()

	const clearPostedMessages = () => vscodeEnv.clearPostedMessages()

	// Common webview interaction utilities
	const clickVSCodeCommand = (command: string) => {
		const commandButton = screen.getByTestId(`command-${command}`)
		fireEvent.click(commandButton)
	}

	const typeInChatInput = (text: string) => {
		const chatInput = screen.getByTestId("chat-input") || screen.getByRole("textbox")
		fireEvent.change(chatInput, { target: { value: text } })
	}

	const submitChatMessage = (text?: string) => {
		if (text) {
			typeInChatInput(text)
		}
		const submitButton = screen.getByTestId("chat-submit-button")
		fireEvent.click(submitButton)
	}

	const waitForChatResponse = async (timeout = 10000) => {
		await waitFor(
			() => {
				// Look for any response indicators
				const responseElements = screen.queryAllByTestId(/chat-message|response|assistant/)
				expect(responseElements.length).toBeGreaterThan(0)
			},
			{ timeout },
		)
	}

	return {
		...result,
		vscodeEnv,
		simulateExtensionMessage,
		simulateStateUpdate,
		simulateWebviewLaunch,
		waitForVSCodeMessage,
		assertVSCodeMessagePosted,
		assertNoVSCodeMessagePosted,
		getPostedMessages,
		getLastPostedMessage,
		clearPostedMessages,
		clickVSCodeCommand,
		typeInChatInput,
		submitChatMessage,
		waitForChatResponse,
	}
}

/**
 * Test utilities for specific webview scenarios
 */
export class WebviewTestScenarios {
	/**
	 * Test a component that sends messages to VS Code
	 */
	static async testMessageSending(
		component: ReactElement,
		expectedMessage: WebviewMessage,
		userAction: () => void,
		config: WebviewTestConfig = {},
	): Promise<void> {
		const { assertVSCodeMessagePosted, clearPostedMessages, ...utils } = renderWebviewComponent(component, config)

		clearPostedMessages()

		// Perform user action
		userAction()

		// Assert message was sent
		assertVSCodeMessagePosted(expectedMessage.type, expectedMessage)

		utils.cleanup()
	}

	/**
	 * Test a component that receives messages from VS Code
	 */
	static async testMessageReceiving(
		component: ReactElement,
		incomingMessage: ExtensionMessage,
		expectedUIChange: () => void,
		config: WebviewTestConfig = {},
	): Promise<void> {
		const { simulateExtensionMessage, ...utils } = renderWebviewComponent(component, config)

		// Simulate incoming message
		simulateExtensionMessage(incomingMessage)

		// Assert UI changed as expected
		await waitFor(expectedUIChange)

		utils.cleanup()
	}

	/**
	 * Test bidirectional communication
	 */
	static async testBidirectionalCommunication(
		component: ReactElement,
		incomingMessage: ExtensionMessage,
		userAction: () => void,
		expectedOutgoingMessage: WebviewMessage,
		config: WebviewTestConfig = {},
	): Promise<void> {
		const { simulateExtensionMessage, assertVSCodeMessagePosted, clearPostedMessages, ...utils } =
			renderWebviewComponent(component, config)

		clearPostedMessages()

		// Simulate incoming message
		simulateExtensionMessage(incomingMessage)

		// Perform user action
		userAction()

		// Assert outgoing message
		assertVSCodeMessagePosted(expectedOutgoingMessage.type, expectedOutgoingMessage)

		utils.cleanup()
	}

	/**
	 * Test state management
	 */
	static async testStateManagement(
		component: ReactElement,
		stateUpdates: Partial<ExtensionState>[],
		expectedUIChanges: (() => void)[],
		config: WebviewTestConfig = {},
	): Promise<void> {
		const { simulateStateUpdate, ...utils } = renderWebviewComponent(component, config)

		for (let i = 0; i < stateUpdates.length; i++) {
			const stateUpdate = stateUpdates[i]
			const expectedChange = expectedUIChanges[i]

			// Apply state update
			simulateStateUpdate(stateUpdate)

			// Wait for UI to update
			await waitFor(expectedChange)
		}

		utils.cleanup()
	}

	/**
	 * Test async operations with proper cleanup
	 */
	static async testAsyncOperation(
		component: ReactElement,
		asyncOperation: () => Promise<void>,
		expectedResult: () => void,
		config: WebviewTestConfig = {},
	): Promise<void> {
		const { ...utils } = renderWebviewComponent(component, config)

		// Perform async operation
		await asyncOperation()

		// Assert result
		await waitFor(expectedResult)

		utils.cleanup()
	}
}

/**
 * Utilities for testing specific VS Code webview patterns
 */
export const VSCodeWebviewTestUtils = {
	/**
	 * Test a settings component
	 */
	testSettingsComponent: async (
		component: ReactElement,
		settingKey: string,
		settingValue: any,
		expectedMessage: WebviewMessage,
	) => {
		await WebviewTestScenarios.testMessageSending(component, expectedMessage, () => {
			// Find and interact with the setting control
			const settingControl = screen.getByTestId(`setting-${settingKey}`)
			fireEvent.change(settingControl, { target: { value: settingValue } })
		})
	},

	/**
	 * Test a chat component
	 */
	testChatComponent: async (component: ReactElement, message: string, expectedMessage?: WebviewMessage) => {
		const { submitChatMessage, assertVSCodeMessagePosted, clearPostedMessages } = renderWebviewComponent(component)

		clearPostedMessages()
		submitChatMessage(message)

		if (expectedMessage) {
			assertVSCodeMessagePosted(expectedMessage.type, expectedMessage)
		}
	},

	/**
	 * Test a command palette component
	 */
	testCommandComponent: async (component: ReactElement, command: string, expectedMessage: WebviewMessage) => {
		await WebviewTestScenarios.testMessageSending(component, expectedMessage, () => {
			const commandButton = screen.getByTestId(`command-${command}`)
			fireEvent.click(commandButton)
		})
	},

	/**
	 * Test a notification component
	 */
	testNotificationComponent: async (
		component: ReactElement,
		notificationMessage: ExtensionMessage,
		expectedNotificationText: string,
	) => {
		await WebviewTestScenarios.testMessageReceiving(component, notificationMessage, () => {
			const notification = screen.getByText(expectedNotificationText)
			expect(notification).toBeInTheDocument()
		})
	},

	/**
	 * Test file operations
	 */
	testFileOperation: async (
		component: ReactElement,
		filePath: string,
		operation: "open" | "save" | "delete",
		expectedMessage: WebviewMessage,
	) => {
		await WebviewTestScenarios.testMessageSending(component, expectedMessage, () => {
			const fileButton = screen.getByTestId(`file-${operation}-${filePath}`)
			fireEvent.click(fileButton)
		})
	},
}

/**
 * Mock data generators for webview testing
 */
export const WebviewMockData = {
	/**
	 * Create a mock chat message
	 */
	createChatMessage: (type: "user" | "assistant", content: string, timestamp = Date.now()) => ({
		type,
		content,
		timestamp,
		id: `msg-${timestamp}`,
	}),

	/**
	 * Create mock file data
	 */
	createFileData: (path: string, content = "mock file content") => ({
		path,
		content,
		size: content.length,
		lastModified: new Date().toISOString(),
	}),

	/**
	 * Create mock command data
	 */
	createCommand: (id: string, title: string, description = "") => ({
		id,
		title,
		description,
		category: "test",
	}),

	/**
	 * Create mock workspace data
	 */
	createWorkspaceData: (files: string[] = []) => ({
		name: "test-workspace",
		path: "/test/workspace",
		files,
		folders: [],
	}),

	/**
	 * Create mock notification data
	 */
	createNotification: (type: "info" | "warning" | "error", message: string) => ({
		type,
		message,
		timestamp: Date.now(),
		id: `notif-${Date.now()}`,
	}),
}

/**
 * Performance testing utilities for webview components
 */
export const WebviewPerformanceTestUtils = {
	/**
	 * Measure render performance
	 */
	measureRenderTime: async (component: ReactElement, iterations = 10) => {
		const times: number[] = []

		for (let i = 0; i < iterations; i++) {
			const { unmount } = renderWebviewComponent(component)
			const startTime = performance.now()
			unmount()
			const endTime = performance.now()
			times.push(endTime - startTime)
		}

		return {
			average: times.reduce((a, b) => a + b, 0) / times.length,
			min: Math.min(...times),
			max: Math.max(...times),
			times,
		}
	},

	/**
	 * Measure message processing performance
	 */
	measureMessageProcessingTime: async (
		component: ReactElement,
		messages: ExtensionMessage[],
		config: WebviewTestConfig = {},
	) => {
		const { simulateExtensionMessage } = renderWebviewComponent(component, config)
		const times: number[] = []

		for (const message of messages) {
			const startTime = performance.now()
			simulateExtensionMessage(message)
			const endTime = performance.now()
			times.push(endTime - startTime)
		}

		return {
			average: times.reduce((a, b) => a + b, 0) / times.length,
			min: Math.min(...times),
			max: Math.max(...times),
			times,
		}
	},
}

export default renderWebviewComponent
