import { describe, it, expect, beforeEach, afterEach } from "vitest"

import { VSCodeMockEnvironment, VSCodeTestUtils } from "@src/mocks/vscode-mock"
import type { WebviewMessage as _WebviewMessage } from "@roo/WebviewMessage"
import type { ExtensionMessage } from "@roo/ExtensionMessage"

describe("VS Code Mock - Basic Functionality", () => {
	let vscodeEnv: VSCodeMockEnvironment

	beforeEach(() => {
		vscodeEnv = new VSCodeMockEnvironment()
	})

	afterEach(() => {
		vscodeEnv.cleanup()
	})

	describe("Core API Mocking", () => {
		it("should create mock VS Code API with all required methods", () => {
			const api = vscodeEnv.api

			expect(api.postMessage).toBeDefined()
			expect(api.getState).toBeDefined()
			expect(api.setState).toBeDefined()
			expect(typeof api.postMessage).toBe("function")
			expect(typeof api.getState).toBe("function")
			expect(typeof api.setState).toBe("function")
		})

		it("should handle message posting and retrieval", () => {
			const api = vscodeEnv.api

			// Post multiple messages
			api.postMessage({ type: "testMessage1", text: "Hello 1" })
			api.postMessage({ type: "testMessage2", text: "Hello 2" })
			api.postMessage({ type: "testMessage3", value: 42 })

			const messages = vscodeEnv.getPostedMessages()
			expect(messages).toHaveLength(3)
			expect(messages[0]).toEqual({ type: "testMessage1", text: "Hello 1" })
			expect(messages[1]).toEqual({ type: "testMessage2", text: "Hello 2" })
			expect(messages[2]).toEqual({ type: "testMessage3", value: 42 })
		})

		it("should handle state management correctly", () => {
			const api = vscodeEnv.api

			// Test initial state
			expect(api.getState()).toBeUndefined()

			// Set state
			const testState = { testKey: "testValue", number: 123 }
			const returnedState = api.setState(testState)

			expect(returnedState).toEqual(testState)
			expect(api.getState()).toEqual(testState)
			expect(vscodeEnv.state).toEqual(testState)

			// Update state
			const updatedState = { ...testState, newKey: "newValue" }
			api.setState(updatedState)
			expect(api.getState()).toEqual(updatedState)
		})

		it("should handle message clearing", () => {
			const api = vscodeEnv.api

			// Post messages
			api.postMessage({ type: "test1" })
			api.postMessage({ type: "test2" })
			expect(vscodeEnv.getPostedMessages()).toHaveLength(2)

			// Clear messages
			vscodeEnv.clearPostedMessages()
			expect(vscodeEnv.getPostedMessages()).toHaveLength(0)
		})

		it("should get last posted message", () => {
			const api = vscodeEnv.api

			// Post messages
			api.postMessage({ type: "first" })
			api.postMessage({ type: "second" })
			api.postMessage({ type: "third" })

			const lastMessage = vscodeEnv.getLastPostedMessage()
			expect(lastMessage).toEqual({ type: "third" })
		})
	})

	describe("Message Event Handling", () => {
		it("should handle message event listeners", () => {
			const mockHandler = vi.fn()

			vscodeEnv.api.onMessage = mockHandler

			const testMessage: ExtensionMessage = {
				type: "state",
				state: VSCodeTestUtils.createMockState(),
			}

			vscodeEnv.simulateExtensionMessage(testMessage)

			expect(mockHandler).toHaveBeenCalledOnce()
			expect(mockHandler).toHaveBeenCalledWith(
				expect.objectContaining({
					data: testMessage,
				}),
			)
		})

		it("should handle multiple message listeners", () => {
			const mockHandler1 = vi.fn()
			const mockHandler2 = vi.fn()

			// Change handler
			vscodeEnv.api.onMessage = mockHandler1
			vscodeEnv.simulateExtensionMessage({ type: "test1" })

			// Change handler again
			vscodeEnv.api.onMessage = mockHandler2
			vscodeEnv.simulateExtensionMessage({ type: "test2" })

			expect(mockHandler1).toHaveBeenCalledOnce()
			expect(mockHandler2).toHaveBeenCalledOnce()
			expect(mockHandler1).not.toHaveBeenCalledWith(expect.objectContaining({ data: { type: "test2" } }))
			expect(mockHandler2).toHaveBeenCalledWith(expect.objectContaining({ data: { type: "test2" } }))
		})
	})

	describe("Async Message Waiting", () => {
		it("should resolve when expected message is posted", async () => {
			const api = vscodeEnv.api

			// Start waiting for message
			const messagePromise = vscodeEnv.waitForMessage("expectedType")

			// Post the message after a delay
			setTimeout(() => {
				api.postMessage({ type: "expectedType", text: "found it!" })
			}, 50)

			const message = await messagePromise
			expect(message).toEqual({ type: "expectedType", text: "found it!" })
		})

		it("should timeout when message is not posted", async () => {
			await expect(vscodeEnv.waitForMessage("nonExistentType", 100)).rejects.toThrow(
				"Timeout waiting for message type: nonExistentType",
			)
		})

		it("should handle multiple concurrent waits", async () => {
			const api = vscodeEnv.api

			// Start multiple waits
			const promise1 = vscodeEnv.waitForMessage("type1")
			const promise2 = vscodeEnv.waitForMessage("type2")

			// Post messages in reverse order
			setTimeout(() => api.postMessage({ type: "type2", text: "second" }), 50)
			setTimeout(() => api.postMessage({ type: "type1", text: "first" }), 100)

			const [message1, message2] = await Promise.all([promise1, promise2])
			expect(message1).toEqual({ type: "type1", text: "first" })
			expect(message2).toEqual({ type: "type2", text: "second" })
		})
	})

	describe("State Update Simulation", () => {
		it("should simulate state updates correctly", () => {
			const mockHandler = vi.fn()

			vscodeEnv.api.onMessage = mockHandler

			const testState = VSCodeTestUtils.createMockState({
				version: "2.0.0-test",
				language: "fr",
			})

			vscodeEnv.simulateStateUpdate(testState)

			expect(mockHandler).toHaveBeenCalledWith(
				expect.objectContaining({
					data: {
						type: "state",
						state: testState,
					},
				}),
			)
		})
	})

	describe("Reset and Cleanup", () => {
		it("should reset all mock state", () => {
			const api = vscodeEnv.api

			// Set up some state
			api.setState({ test: "value" })
			api.postMessage({ type: "test" })
			api.onMessage = vi.fn()

			// Verify setup
			expect(api.getState()).toEqual({ test: "value" })
			expect(vscodeEnv.getPostedMessages()).toHaveLength(1)
			expect(vscodeEnv.api.onMessage).toBeDefined()

			// Reset
			vscodeEnv.reset()

			// Verify reset
			expect(api.getState()).toBeUndefined()
			expect(vscodeEnv.getPostedMessages()).toHaveLength(0)
			expect(api.postMessage).toHaveBeenCalledTimes(0)
			expect(api.getState).toHaveBeenCalledTimes(0)
			expect(api.setState).toHaveBeenCalledTimes(0)
		})

		it("should cleanup properly", () => {
			const api = vscodeEnv.api

			// Set up state
			api.setState({ test: "value" })
			api.postMessage({ type: "test" })

			// Cleanup
			vscodeEnv.cleanup()

			// Verify cleanup (cleanup calls reset internally)
			// The specific cleanup behavior depends on implementation
			// This test mainly ensures cleanup doesn't throw
			expect(true).toBe(true) // If we get here, cleanup worked
		})
	})

	describe("VSCodeTestUtils", () => {
		it("should create mock state with default values", () => {
			const mockState = VSCodeTestUtils.createMockState()

			expect(mockState.version).toBe("1.0.0-test")
			expect(mockState.language).toBe("en")
			expect(mockState.clineMessages).toEqual([])
			expect(mockState.apiConfiguration).toEqual({})
			expect(mockState.shouldShowAnnouncement).toBe(false)
		})

		it("should create mock state with custom overrides", () => {
			const customOverrides = {
				version: "3.0.0-custom",
				language: "es",
				cwd: "/custom/path",
				shouldShowAnnouncement: true,
			}

			const mockState = VSCodeTestUtils.createMockState(customOverrides)

			expect(mockState.version).toBe("3.0.0-custom")
			expect(mockState.language).toBe("es")
			expect(mockState.cwd).toBe("/custom/path")
			expect(mockState.shouldShowAnnouncement).toBe(true)
			// Should still have defaults for unspecified properties
			expect(mockState.clineMessages).toEqual([])
		})

		it("should create mock messages", () => {
			const message1 = VSCodeTestUtils.createMockMessage("testType")
			const message2 = VSCodeTestUtils.createMockMessage("testType", { text: "hello", value: 42 })

			expect(message1).toEqual({ type: "testType" })
			expect(message2).toEqual({ type: "testType", text: "hello", value: 42 })
		})

		it("should simulate webview launch sequence", async () => {
			const mockState = VSCodeTestUtils.createMockState({
				version: "launch-test",
			})

			await VSCodeTestUtils.simulateWebviewLaunch(vscodeEnv, mockState)

			const messages = vscodeEnv.getPostedMessages()
			const launchMessage = messages.find((msg) => msg.type === "webviewDidLaunch")
			expect(launchMessage).toBeDefined()
			expect(launchMessage?.type).toBe("webviewDidLaunch")
		})
	})

	describe("Error Handling", () => {
		it("should handle empty message queue gracefully", () => {
			const messages = vscodeEnv.getPostedMessages()
			const lastMessage = vscodeEnv.getLastPostedMessage()

			expect(messages).toEqual([])
			expect(lastMessage).toBeUndefined()
		})

		it("should handle multiple state updates", () => {
			const api = vscodeEnv.api

			const state1 = { key: "value1" }
			const state2 = { key: "value2" }
			const state3 = { key: "value3" }

			api.setState(state1)
			expect(api.getState()).toEqual(state1)

			api.setState(state2)
			expect(api.getState()).toEqual(state2)

			api.setState(state3)
			expect(api.getState()).toEqual(state3)
		})
	})
})
