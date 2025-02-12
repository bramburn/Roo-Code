import { VSCodeAPIWrapper } from "../vscode"
import type { CustomVSCodeAPI, FinalSyncMessage } from "../../types/vscode"

describe("VSCodeAPIWrapper", () => {
	let mockVSCodeAPI: CustomVSCodeAPI

	beforeEach(() => {
		mockVSCodeAPI = {
			postMessage: jest.fn(),
			getState: jest.fn(),
			setState: jest.fn(),
		}

		// Reset singleton instance
		delete (VSCodeAPIWrapper as any).instance
		jest.clearAllMocks()
	})

	describe("Initialization", () => {
		test("should initialize with provided API", () => {
			VSCodeAPIWrapper.initialize(mockVSCodeAPI)
			expect(VSCodeAPIWrapper.getInstance()).toBeInstanceOf(VSCodeAPIWrapper)
		})

		test("should throw error when initialized twice", () => {
			VSCodeAPIWrapper.initialize(mockVSCodeAPI)
			expect(() => VSCodeAPIWrapper.initialize(mockVSCodeAPI)).toThrowError(
				"VSCodeAPIWrapper already initialized",
			)
		})
	})

	describe("Message Handling", () => {
		test("should post messages through vscode API", () => {
			VSCodeAPIWrapper.initialize(mockVSCodeAPI)
			const message: FinalSyncMessage = {
				type: "finalSync",
				changes: {},
				timestamp: Date.now(),
			}

			VSCodeAPIWrapper.getInstance().postMessage(message)
			expect(mockVSCodeAPI.postMessage).toHaveBeenCalledWith(message)
		})
	})

	describe("State Management", () => {
		test("should set and get state correctly", () => {
			const testState = { version: 1 }
			mockVSCodeAPI.setState = jest.fn()
			mockVSCodeAPI.getState = () => ({ _version: 1, data: testState })

			VSCodeAPIWrapper.initialize(mockVSCodeAPI)
			const instance = VSCodeAPIWrapper.getInstance()

			instance.setState(testState)
			expect(mockVSCodeAPI.setState).toHaveBeenCalledWith({
				_version: 1,
				data: testState,
			})
			expect(instance.getState()).toEqual(testState)
		})
	})
})
