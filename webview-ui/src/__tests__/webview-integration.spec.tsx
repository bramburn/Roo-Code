import { describe, it, expect, beforeEach, afterEach } from "vitest"
import React from "react"

import { VSCodeMockEnvironment, VSCodeTestUtils } from "@src/mocks/vscode-mock"
import { renderWithWebview } from "@src/utils/test-utils"
import type { WebviewMessage as _WebviewMessage } from "@roo/WebviewMessage"
import type { ExtensionMessage } from "@roo/ExtensionMessage"

// Simple test component
const SimpleTestComponent = () => {
	return (
		<div data-testid="simple-component">
			<span data-testid="test-content">Test Content</span>
		</div>
	)
}

describe("Webview Integration Tests", () => {
	let vscodeEnv: VSCodeMockEnvironment

	beforeEach(() => {
		vscodeEnv = new VSCodeMockEnvironment()
	})

	afterEach(() => {
		vscodeEnv.cleanup()
	})

	describe("VSCodeMockEnvironment", () => {
		it("should create mock VS Code API", () => {
			const api = vscodeEnv.api

			expect(api.postMessage).toBeDefined()
			expect(api.getState).toBeDefined()
			expect(api.setState).toBeDefined()
		})

		it("should handle message posting", () => {
			const api = vscodeEnv.api

			api.postMessage({ type: "testMessage", text: "Hello" })

			const messages = vscodeEnv.getPostedMessages()
			expect(messages).toHaveLength(1)
			expect(messages[0]).toEqual({
				type: "testMessage",
				text: "Hello",
			})
		})

		it("should handle state management", () => {
			const api = vscodeEnv.api

			const testState = { test: "value" }
			api.setState(testState)

			expect(api.getState()).toEqual(testState)
			expect(api.state).toEqual(testState)
		})

		it("should simulate extension messages", () => {
			const mockHandler = vi.fn()

			vscodeEnv.api.onMessage = mockHandler
			const testMessage: ExtensionMessage = {
				type: "state",
				state: VSCodeTestUtils.createMockState(),
			}

			vscodeEnv.simulateExtensionMessage(testMessage)

			expect(mockHandler).toHaveBeenCalled()
		})

		it("should wait for specific message types", async () => {
			const api = vscodeEnv.api

			// Post a message asynchronously
			setTimeout(() => {
				api.postMessage({ type: "expectedMessage", text: "test" })
			}, 100)

			const message = await vscodeEnv.waitForMessage("expectedMessage")
			expect(message).toEqual({
				type: "expectedMessage",
				text: "test",
			})
		})
	})

	describe("renderWithWebview", () => {
		it("should render component with webview setup", () => {
			const { getByTestId, vscodeEnv } = renderWithWebview(<SimpleTestComponent />)

			expect(getByTestId("simple-component")).toBeInTheDocument()
			expect(vscodeEnv).toBeDefined()
		})

		it("should provide VS Code utilities", () => {
			const { simulateExtensionMessage, getPostedMessages } = renderWithWebview(<SimpleTestComponent />)

			expect(typeof simulateExtensionMessage).toBe("function")
			expect(typeof getPostedMessages).toBe("function")
		})

		it("should handle custom initial state", () => {
			const customState = VSCodeTestUtils.createMockState({
				version: "2.0.0-test",
			})

			const { vscodeEnv } = renderWithWebview(<SimpleTestComponent />, {
				initialState: customState,
			})

			expect(vscodeEnv.api.getState()).toBeDefined()
		})
	})

	describe("Integration test", () => {
		it("should handle complete webview communication flow", async () => {
			const { getByTestId, vscodeEnv, simulateExtensionMessage, waitForVSCodeMessage } = renderWithWebview(
				<SimpleTestComponent />,
			)

			// 1. Simulate extension sending initial state
			const initialState = VSCodeTestUtils.createMockState()
			simulateExtensionMessage({
				type: "state",
				state: initialState,
			})

			// 2. Verify component rendered
			expect(getByTestId("simple-component")).toBeInTheDocument()
			expect(getByTestId("test-content")).toBeInTheDocument()

			// 3. Wait for specific message type
			const messagePromise = waitForVSCodeMessage("webviewDidLaunch")

			// Simulate webview launch message
			vscodeEnv.api.postMessage({ type: "webviewDidLaunch" })

			const message = await messagePromise
			expect(message.type).toBe("webviewDidLaunch")
		})

		it("should handle cleanup properly", () => {
			const { cleanup, vscodeEnv } = renderWithWebview(<SimpleTestComponent />)

			// Post some messages
			vscodeEnv.api.postMessage({ type: "test1" })
			vscodeEnv.api.postMessage({ type: "test2" })

			expect(vscodeEnv.getPostedMessages()).toHaveLength(2)

			// Cleanup should reset everything
			cleanup()

			expect(vscodeEnv.getPostedMessages()).toHaveLength(0)
		})
	})

	describe("VSCodeTestUtils", () => {
		it("should create mock state with defaults", () => {
			const mockState = VSCodeTestUtils.createMockState()

			expect(mockState.version).toBe("1.0.0-test")
			expect(mockState.language).toBe("en")
			expect(mockState.clineMessages).toEqual([])
		})

		it("should create mock state with overrides", () => {
			const customState = VSCodeTestUtils.createMockState({
				version: "2.0.0",
				language: "fr",
			})

			expect(customState.version).toBe("2.0.0")
			expect(customState.language).toBe("fr")
		})

		it("should create mock messages", () => {
			const mockMessage = VSCodeTestUtils.createMockMessage("testMessage", { text: "hello" })

			expect(mockMessage.type).toBe("testMessage")
			expect(mockMessage.text).toBe("hello")
		})

		it("should simulate webview launch", async () => {
			const mockState = VSCodeTestUtils.createMockState()

			await VSCodeTestUtils.simulateWebviewLaunch(vscodeEnv, mockState)

			// Should have posted webviewDidLaunch message
			const messages = vscodeEnv.getPostedMessages()
			const launchMessage = messages.find((msg) => msg.type === "webviewDidLaunch")
			expect(launchMessage).toBeDefined()
		})
	})

	describe("Error handling", () => {
		it("should handle timeout when waiting for messages", async () => {
			await expect(vscodeEnv.waitForMessage("nonExistentMessage", 100)).rejects.toThrow(
				"Timeout waiting for message type: nonExistentMessage",
			)
		})

		it("should handle empty message queue", () => {
			const messages = vscodeEnv.getPostedMessages()
			expect(messages).toEqual([])
		})

		it("should handle clearing message queue", () => {
			vscodeEnv.api.postMessage({ type: "test1" })
			vscodeEnv.api.postMessage({ type: "test2" })

			expect(vscodeEnv.getPostedMessages()).toHaveLength(2)

			vscodeEnv.clearPostedMessages()
			expect(vscodeEnv.getPostedMessages()).toHaveLength(0)
		})
	})
})
