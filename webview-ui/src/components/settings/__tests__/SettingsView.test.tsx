import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import SettingsView from "../SettingsView"
import { ExtensionStateContext } from "../../../context/ExtensionStateContext"
import { vscode } from "../../../utils/vscode"
import { ApiConfiguration, ApiProvider } from "../../../../../src/shared/api"
import { ExperimentId } from "../../../../../src/shared/experiments"

// --- Mocks ------------------------------------------------------
// We override the vscode.postMessage so we can assert calls.
jest.mock("../../../utils/vscode", () => ({
	vscode: {
		postMessage: jest.fn(),
	},
}))

// The validation functions are mocked to always return undefined (no error),
// so that submission goes through.
jest.mock("../../../utils/validate", () => ({
	validateApiConfiguration: jest.fn(() => undefined),
	validateModelId: jest.fn(() => undefined),
}))

// --- Default provider state for SettingsView -------------------
const defaultExtensionState = {
	apiConfiguration: {
		apiProvider: "anthropic" as ApiProvider,
		apiModelId: "claude-3-haiku-20240307",
		apiKey: "test-key",
		id: "test-config-id",
	} as ApiConfiguration,
	version: "1.0.0",
	alwaysAllowReadOnly: false,
	setAlwaysAllowReadOnly: jest.fn(),
	alwaysAllowWrite: false,
	setAlwaysAllowWrite: jest.fn(),
	alwaysAllowExecute: false,
	setAlwaysAllowExecute: jest.fn(),
	alwaysAllowBrowser: false,
	setAlwaysAllowBrowser: jest.fn(),
	alwaysAllowMcp: false,
	setAlwaysAllowMcp: jest.fn(),
	soundEnabled: false,
	setSoundEnabled: jest.fn(),
	soundVolume: 0.5,
	setSoundVolume: jest.fn(),
	diffEnabled: false,
	setDiffEnabled: jest.fn(),
	checkpointsEnabled: false,
	setCheckpointsEnabled: jest.fn(),
	browserViewportSize: "1280x800",
	setBrowserViewportSize: jest.fn(),
	openRouterModels: {} as Record<string, any>,
	glamaModels: {} as Record<string, any>,
	allowedCommands: [] as string[],
	setAllowedCommands: jest.fn(),
	fuzzyMatchThreshold: 1.0,
	setFuzzyMatchThreshold: jest.fn(),
	writeDelayMs: 1000,
	setWriteDelayMs: jest.fn(),
	screenshotQuality: 75,
	setScreenshotQuality: jest.fn(),
	terminalOutputLineLimit: 500,
	setTerminalOutputLineLimit: jest.fn(),
	mcpEnabled: false,
	alwaysApproveResubmit: false,
	setAlwaysApproveResubmit: jest.fn(),
	requestDelaySeconds: 5,
	setRequestDelaySeconds: jest.fn(),
	rateLimitSeconds: 1,
	setRateLimitSeconds: jest.fn(),
	currentApiConfigName: "default",
	listApiConfigMeta: [],
	experiments: {
		experimentalDiffStrategy: false,
		search_and_replace: false,
		insert_content: false,
	} as Record<ExperimentId, boolean>,
	setExperimentEnabled: jest.fn(),
	alwaysAllowModeSwitch: false,
	setAlwaysAllowModeSwitch: jest.fn(),
	didHydrateState: true,
	updateState: jest.fn(),
	setApiConfiguration: jest.fn(),
	setCustomInstructions: jest.fn(),
	customInstructions: "",
	currentMode: "default",
	setCurrentMode: jest.fn(),
	currentTask: null,
	setCurrentTask: jest.fn(),
	taskHistory: [],
	setTaskHistory: jest.fn(),
	isRecording: false,
	setIsRecording: jest.fn(),
	recordingStartTime: null,
	setRecordingStartTime: jest.fn(),
	recordedCommands: [],
	setRecordedCommands: jest.fn(),
	isProcessing: false,
	setIsProcessing: jest.fn(),
	processingMessage: "",
	setProcessingMessage: jest.fn(),
	processingProgress: 0,
	setProcessingProgress: jest.fn(),
	processingTotal: 0,
	setProcessingTotal: jest.fn(),
	processingCurrent: 0,
	setProcessingCurrent: jest.fn(),
	processingType: null,
	setProcessingType: jest.fn(),
	processingTarget: null,
	setProcessingTarget: jest.fn(),
	setShowAnnouncement: jest.fn(),
	setPreferredLanguage: jest.fn(),
	setMcpEnabled: jest.fn(),
	setEnableMcpServerCreation: jest.fn(),
	preferredLanguage: "en",
	showAnnouncement: false,
	enableMcpServerCreation: false,
	mcpServers: [],
	setMcpServers: jest.fn(),
	selectedMcpServer: null,
	setSelectedMcpServer: jest.fn(),
	setCurrentApiConfigName: jest.fn(),
	setListApiConfigMeta: jest.fn(),
	onUpdateApiConfig: jest.fn(),
	setMode: jest.fn(),
	setOpenRouterModels: jest.fn(),
	setGlamaModels: jest.fn(),
	setCustomModePrompts: jest.fn(),
	setCustomSupportPrompts: jest.fn(),
	setEnhancementApiConfigId: jest.fn(),
	setAutoApprovalEnabled: jest.fn(),
	customModePrompts: {},
	customSupportPrompts: {},
	enhancementApiConfigId: undefined,
	autoApprovalEnabled: false,
	// Final missing properties
	handleInputChange: jest.fn(),
	setCustomModes: jest.fn(),
	clineMessages: [],
	shouldShowAnnouncement: false,
}

// Helper to render the SettingsView wrapped in the ExtensionStateContext provider.
const renderSettingsView = (
	overrideState: Partial<typeof defaultExtensionState> = {},
	onDone: jest.Mock = jest.fn(),
) => {
	const state = { ...defaultExtensionState, ...overrideState }
	return render(
		<ExtensionStateContext.Provider value={state}>
			<SettingsView onDone={onDone} />
		</ExtensionStateContext.Provider>,
	)
}

beforeEach(() => {
	// Reset all mocks before each test
	jest.clearAllMocks()
})

describe("SettingsView Component", () => {
	describe("Sound Settings", () => {
		test("should call setSoundEnabled when toggling the sound checkbox", () => {
			const setSoundEnabledMock = jest.fn()
			renderSettingsView({ soundEnabled: false, setSoundEnabled: setSoundEnabledMock })

			// The VSCodeCheckbox renders the label; find it via its text.
			const soundCheckbox = screen.getByLabelText(/Enable sound effects/i)
			expect(soundCheckbox).toBeInTheDocument()

			// Simulate a click that toggles the checkbox.
			fireEvent.click(soundCheckbox)
			expect(setSoundEnabledMock).toHaveBeenCalledWith(true)
		})

		test("should call setSoundVolume when the volume slider is adjusted", () => {
			const setSoundVolumeMock = jest.fn()
			// Render with sound enabled so that the volume slider is visible.
			renderSettingsView({ soundEnabled: true, soundVolume: 0.5, setSoundVolume: setSoundVolumeMock })

			// The volume slider has an aria-label "Volume"
			const volumeSlider = screen.getByLabelText(/Volume/i)
			expect(volumeSlider).toBeInTheDocument()

			// Simulate changing the slider value.
			fireEvent.change(volumeSlider, { target: { value: "0.7" } })
			expect(setSoundVolumeMock).toHaveBeenCalledWith(0.7)
		})
	})

	describe("API Configuration Submission", () => {
		// The test block for 'should dispatch correct vscode postMessage calls on submitting valid API configuration' has been removed as per the instructions.
	})

	describe("Allowed Commands", () => {
		test("prevents duplicate commands", async () => {
			const setAllowedCommands = jest.fn()

			renderSettingsView({
				alwaysAllowExecute: true,
				allowedCommands: ["npm test"],
				setAllowedCommands,
			})

			const commandInput = await screen.findByPlaceholderText(/Enter command prefix/i)
			await userEvent.type(commandInput, "npm test{enter}")

			// Verify setAllowedCommands wasn't called again
			expect(setAllowedCommands).not.toHaveBeenCalled()
		})

		test("command input is only visible when alwaysAllowExecute is true", async () => {
			// Render with alwaysAllowExecute false
			renderSettingsView({
				alwaysAllowExecute: false,
			})

			const commandInput = screen.queryByPlaceholderText(/Enter command prefix/i)
			expect(commandInput).not.toBeInTheDocument()

			// Re-render with alwaysAllowExecute true
			renderSettingsView({
				alwaysAllowExecute: true,
			})

			const visibleInput = await screen.findByPlaceholderText(/Enter command prefix/i)
			expect(visibleInput).toBeInTheDocument()
		})
	})

	describe("Reset State", () => {
		test("triggers reset action", async () => {
			renderSettingsView()

			const resetButton = screen.getByRole("button", { name: /Reset State/i })
			expect(resetButton).toBeInTheDocument()

			await userEvent.click(resetButton)

			await waitFor(() => {
				expect(vscode.postMessage).toHaveBeenCalledWith({
					type: "resetState",
				})
			})
		})
	})
})
