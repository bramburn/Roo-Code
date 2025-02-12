import { renderHook, act } from "@testing-library/react"
import { useLocalState } from "../useLocalState"
import { vscode } from "../../utils/vscode"
import { storageUtils } from "../../utils/storageUtils"
import { EXPERIMENT_IDS } from "../../../../src/shared/experiments"

// Mock dependencies
jest.mock("../../utils/vscode", () => ({
	vscode: {
		postMessage: jest.fn(),
	},
}))

jest.mock("../../utils/storageUtils", () => ({
	storageUtils: {
		getItem: jest.fn(),
		setItem: jest.fn(),
	},
}))

// Mock timer functions
jest.useFakeTimers()

describe("useLocalState", () => {
	const initialState = {
		version: "1.0.0",
		clineMessages: [],
		taskHistory: [],
		shouldShowAnnouncement: false,
		requestDelaySeconds: 0,
		rateLimitSeconds: 0,
		checkpointsEnabled: false,
		mcpEnabled: false,
		enableMcpServerCreation: false,
		mode: "default" as const,
		experiments: {
			[EXPERIMENT_IDS.DIFF_STRATEGY]: false,
			[EXPERIMENT_IDS.SEARCH_AND_REPLACE]: false,
			[EXPERIMENT_IDS.INSERT_BLOCK]: false,
		},
		preferredLanguage: "en",
		writeDelayMs: 0,
		customModes: [],
		apiConfiguration: undefined,
		currentApiConfigName: undefined,
		customInstructions: undefined,
		alwaysAllowReadOnly: false,
		alwaysAllowWrite: false,
		alwaysAllowExecute: false,
		alwaysAllowBrowser: false,
		alwaysAllowMcp: false,
		alwaysApproveResubmit: false,
		alwaysAllowModeSwitch: false,
		soundEnabled: false,
		soundVolume: 50,
		diffEnabled: false,
		browserViewportSize: undefined,
		screenshotQuality: undefined,
		fuzzyMatchThreshold: undefined,
		terminalOutputLineLimit: undefined,
		autoApprovalEnabled: false,
		toolRequirements: {},
	}

	beforeEach(() => {
		// Clear all mocks before each test
		jest.clearAllMocks()
		// Clear local storage mock
		;(storageUtils.getItem as jest.Mock).mockReturnValue(null)
	})

	it("should initialize with the provided state", () => {
		console.log("Test: Initialize with provided state")
		console.log("Input:", initialState)

		const { result } = renderHook(() => useLocalState(initialState))

		console.log("Output:", result.current.localState)
		expect(result.current.localState).toEqual(initialState)
	})

	it("should update local state and trigger debounced save", async () => {
		console.log("Test: Update local state and trigger debounced save")

		const { result } = renderHook(() => useLocalState(initialState))

		const update = { preferredLanguage: "fr" }
		console.log("Update input:", update)

		act(() => {
			result.current.updateState(update)
		})

		console.log("State after update:", result.current.localState)
		expect(result.current.localState.preferredLanguage).toBe("fr")

		// Fast-forward timers to trigger debounced save
		act(() => {
			jest.advanceTimersByTime(500)
		})

		console.log("vscode.postMessage calls:", (vscode.postMessage as jest.Mock).mock.calls)
		expect(vscode.postMessage).toHaveBeenCalledWith(
			expect.objectContaining({
				type: "batchUpdate",
				changes: update,
			}),
		)
	})

	it("should handle multiple rapid updates", () => {
		console.log("Test: Handle multiple rapid updates")

		const { result } = renderHook(() => useLocalState(initialState))

		const updates = [{ preferredLanguage: "fr" }, { preferredLanguage: "es" }, { preferredLanguage: "de" }]

		console.log("Multiple updates:", updates)

		act(() => {
			updates.forEach((update) => {
				result.current.updateState(update)
			})
		})

		console.log("State after rapid updates:", result.current.localState)
		expect(result.current.localState.preferredLanguage).toBe("de")

		// Only the last update should be saved after debounce
		act(() => {
			jest.advanceTimersByTime(500)
		})

		console.log("vscode.postMessage calls:", (vscode.postMessage as jest.Mock).mock.calls)
		expect(vscode.postMessage).toHaveBeenCalledTimes(1)
	})

	it("should sync with VS Code state", () => {
		console.log("Test: Sync with VS Code state")

		const { result } = renderHook(() => useLocalState(initialState))

		const vscodeUpdate = { preferredLanguage: "it" }
		console.log("VS Code update:", vscodeUpdate)

		act(() => {
			result.current.updateFromVscode(vscodeUpdate)
		})

		console.log("State after VS Code sync:", result.current.localState)
		expect(result.current.localState.preferredLanguage).toBe("it")
	})

	it("should restore state from storage on mount", () => {
		console.log("Test: Restore state from storage")

		const savedState = { ...initialState, preferredLanguage: "ja" }
		console.log("Saved state in storage:", savedState)
		;(storageUtils.getItem as jest.Mock).mockReturnValue(JSON.stringify(savedState))

		const { result } = renderHook(() => useLocalState(initialState))

		console.log("State after restoration:", result.current.localState)
		expect(result.current.localState).toEqual(savedState)
	})
})
