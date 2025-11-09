import { describe, it, expect, beforeEach, afterEach } from "vitest"
import React from "react"

import { renderWebviewComponent, WebviewTestScenarios, VSCodeWebviewTestUtils } from "@src/utils/webview-test-utils"
import { VSCodeMockEnvironment, VSCodeTestUtils } from "@src/mocks/vscode-mock"
import { renderWithWebview } from "@src/utils/test-utils"
import type { WebviewMessage } from "@roo/WebviewMessage"
import type { ExtensionMessage } from "@roo/ExtensionMessage"

// Simple test component that sends messages to VS Code
const TestComponent = () => {
	const handleClick = () => {
		// This would normally use the vscode utility
		if (typeof window !== "undefined" && (window as any).acquireVsCodeApi) {
			const vscode = (window as any).acquireVsCodeApi()
			vscode.postMessage({ type: "testMessage", text: "Hello from test" })
		}
	}

	return (
		<div data-testid="test-component">
			<button data-testid="test-button" onClick={handleClick}>
				Click me
			</button>
		</div>
	)
}

// Test component that receives messages from VS Code
const MessageReceiverComponent = ({ message }: { message?: string }) => {
	return <div data-testid="message-receiver">{message && <span data-testid="received-message">{message}</span>}</div>
}

describe("Webview Testing Utilities", () => {
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

	describe("renderWebviewComponent", () => {
		it("should render component with webview setup", () => {
			const { getByTestId, vscodeEnv } = renderWebviewComponent(<TestComponent />)

			expect(getByTestId("test-component")).toBeInTheDocument()
			expect(vscodeEnv).toBeDefined()
		})

		it("should provide VS Code utilities", () => {
			const { simulateExtensionMessage, getPostedMessages } = renderWebviewComponent(<TestComponent />)

			expect(typeof simulateExtensionMessage).toBe("function")
			expect(typeof getPostedMessages).toBe("function")
		})

		it("should handle custom initial state", () => {
			const customState = VSCodeTestUtils.createMockState({
				version: "2.0.0-test",
			})

			const { vscodeEnv } = renderWebviewComponent(<TestComponent />, {
				initialState: customState,
			})

			expect(vscodeEnv.api.getState()).toBeDefined()
		})
	})

	describe("WebviewTestScenarios", () => {
		it("should test message sending scenario", async () => {
			const expectedMessage: WebviewMessage = {
				type: "testMessage",
				text: "Hello from test",
			}

			await WebviewTestScenarios.testMessageSending(<TestComponent />, expectedMessage, () => {
				// Simulate clicking the button
				const button = document.querySelector('[data-testid="test-button"]')
				if (button) {
					button.click()
				}
			})
		})

		it("should test message receiving scenario", async () => {
			const incomingMessage: ExtensionMessage = {
				type: "state",
				state: VSCodeTestUtils.createMockState(),
			}

			await WebviewTestScenarios.testMessageReceiving(
				<MessageReceiverComponent message="test" />,
				incomingMessage,
				() => {
					const receivedMessage = document.querySelector('[data-testid="received-message"]')
					expect(receivedMessage).toBeInTheDocument()
				},
			)
		})
	})

	describe("VSCodeWebviewTestUtils", () => {
		it("should test settings components", async () => {
			const SettingsComponent = () => {
				return (
					<div>
						<input
							data-testid="setting-testSetting"
							onChange={(e) => {
								// Mock settings change
								if (typeof window !== "undefined" && (window as any).acquireVsCodeApi) {
									const vscode = (window as any).acquireVsCodeApi()
									vscode.postMessage({
										type: "settingChanged",
										value: e.target.value,
									})
								}
							}}
						/>
					</div>
				)
			}

			const expectedMessage: WebviewMessage = {
				type: "settingChanged",
				value: "test-value",
			}

			await VSCodeWebviewTestUtils.testSettingsComponent(
				<SettingsComponent />,
				"testSetting",
				"test-value",
				expectedMessage,
			)
		})

		it("should test command components", async () => {
			const CommandComponent = () => {
				return (
					<button
						data-testid="command-testCommand"
						onClick={() => {
							if (typeof window !== "undefined" && (window as any).acquireVsCodeApi) {
								const vscode = (window as any).acquireVsCodeApi()
								vscode.postMessage({ type: "executeCommand", command: "testCommand" })
							}
						}}>
						Test Command
					</button>
				)
			}

			const expectedMessage: WebviewMessage = {
				type: "executeCommand",
				command: "testCommand",
			}

			await VSCodeWebviewTestUtils.testCommandComponent(<CommandComponent />, "testCommand", expectedMessage)
		})
	})

	describe("renderWithWebview", () => {
		it("should render with webview utilities", () => {
			const { getByTestId, vscodeEnv, simulateExtensionMessage } = renderWithWebview(<TestComponent />)

			expect(getByTestId("test-component")).toBeInTheDocument()
			expect(vscodeEnv).toBeDefined()
			expect(simulateExtensionMessage).toBeDefined()
		})

		it("should provide assertion utilities", () => {
			const { assertVSCodeMessagePosted, assertNoVSCodeMessagePosted } = renderWithWebview(<TestComponent />)

			expect(typeof assertVSCodeMessagePosted).toBe("function")
			expect(typeof assertNoVSCodeMessagePosted).toBe("function")
		})
	})

	describe("Integration test", () => {
		it("should handle complete webview communication flow", async () => {
			const {
				getByTestId,
				vscodeEnv,
				simulateExtensionMessage,
				assertVSCodeMessagePosted,
				waitForVSCodeMessage,
			} = renderWebviewComponent(<TestComponent />)

			// 1. Simulate extension sending initial state
			const initialState = VSCodeTestUtils.createMockState()
			simulateExtensionMessage({
				type: "state",
				state: initialState,
			})

			// 2. User interacts with component
			const button = getByTestId("test-button")
			button.click()

			// 3. Verify message was sent to extension
			assertVSCodeMessagePosted("testMessage", { text: "Hello from test" })

			// 4. Wait for specific message type
			const messagePromise = waitForVSCodeMessage("testMessage")

			// Simulate another message
			vscodeEnv.api.postMessage({ type: "testMessage", text: "Another message" })

			const message = await messagePromise
			expect(message.text).toBe("Another message")
		})

		it("should handle cleanup properly", () => {
			const { cleanup, vscodeEnv } = renderWebviewComponent(<TestComponent />)

			// Post some messages
			vscodeEnv.api.postMessage({ type: "test1" })
			vscodeEnv.api.postMessage({ type: "test2" })

			expect(vscodeEnv.getPostedMessages()).toHaveLength(2)

			// Cleanup should reset everything
			cleanup()

			expect(vscodeEnv.getPostedMessages()).toHaveLength(0)
		})
	})

	describe("Error handling", () => {
		it("should handle missing messages gracefully", () => {
			const { assertVSCodeMessagePosted } = renderWebviewComponent(<TestComponent />)

			expect(() => {
				assertVSCodeMessagePosted("nonExistentMessage" as any)
			}).toThrow('Expected VS Code message of type "nonExistentMessage" was not posted')
		})

		it("should handle unexpected messages", () => {
			const { vscodeEnv, assertNoVSCodeMessagePosted } = renderWebviewComponent(<TestComponent />)

			// Post an unexpected message
			vscodeEnv.api.postMessage({ type: "unexpectedMessage" })

			expect(() => {
				assertNoVSCodeMessagePosted("unexpectedMessage")
			}).toThrow('Unexpected VS Code message of type "unexpectedMessage" was posted')
		})
	})
})
