import { jsx as _jsx } from "react/jsx-runtime"
import { createContext, useCallback, useContext, useEffect, useState } from "react"
import { ORGANIZATION_ALLOW_ALL, DEFAULT_CHECKPOINT_TIMEOUT_SECONDS } from "@roo-code/types"
import { findLastIndex } from "@roo/array"
import { checkExistKey } from "@roo/checkExistApiConfig"
import { defaultModeSlug, defaultPrompts } from "@roo/modes"
import { experimentDefault } from "@roo/experiments"
import { vscode } from "@src/utils/vscode"
import { convertTextMateToHljs } from "@src/utils/textMateToHljs"
export const ExtensionStateContext = createContext(undefined)
export const mergeExtensionState = (prevState, newState) => {
	const { customModePrompts: prevCustomModePrompts, experiments: prevExperiments, ...prevRest } = prevState
	const {
		apiConfiguration,
		customModePrompts: newCustomModePrompts,
		customSupportPrompts,
		experiments: newExperiments,
		...newRest
	} = newState
	const customModePrompts = { ...prevCustomModePrompts, ...newCustomModePrompts }
	const experiments = { ...prevExperiments, ...newExperiments }
	const rest = { ...prevRest, ...newRest }
	// Note that we completely replace the previous apiConfiguration and customSupportPrompts objects
	// with new ones since the state that is broadcast is the entire objects so merging is not necessary.
	return { ...rest, apiConfiguration, customModePrompts, customSupportPrompts, experiments }
}
export const ExtensionStateContextProvider = ({ children }) => {
	const [state, setState] = useState({
		apiConfiguration: {},
		version: "",
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
		checkpointTimeout: DEFAULT_CHECKPOINT_TIMEOUT_SECONDS, // Default to 15 seconds
		fuzzyMatchThreshold: 1.0,
		language: "en", // Default language code
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
		mode: defaultModeSlug,
		customModePrompts: defaultPrompts,
		customSupportPrompts: {},
		experiments: experimentDefault,
		enhancementApiConfigId: "",
		condensingApiConfigId: "", // Default empty string for condensing API config ID
		customCondensingPrompt: "", // Default empty string for custom condensing prompt
		hasOpenedModeSelector: false, // Default to false (not opened yet)
		autoApprovalEnabled: false,
		customModes: [],
		maxOpenTabsContext: 20,
		maxWorkspaceFiles: 200,
		cwd: "",
		browserToolEnabled: true,
		telemetrySetting: "unset",
		showRooIgnoredFiles: true, // Default to showing .rooignore'd files with lock symbol (current behavior).
		renderContext: "sidebar",
		maxReadFileLine: -1, // Default max read file line limit
		maxImageFileSize: 5, // Default max image file size in MB
		maxTotalImageSize: 20, // Default max total image size in MB
		pinnedApiConfigs: {}, // Empty object for pinned API configs
		terminalZshOhMy: false, // Default Oh My Zsh integration setting
		maxConcurrentFileReads: 5, // Default concurrent file reads
		terminalZshP10k: false, // Default Powerlevel10k integration setting
		terminalZdotdir: false, // Default ZDOTDIR handling setting
		terminalCompressProgressBar: true, // Default to compress progress bar output
		historyPreviewCollapsed: false, // Initialize the new state (default to expanded)
		reasoningBlockCollapsed: true, // Default to collapsed
		cloudUserInfo: null,
		cloudIsAuthenticated: false,
		cloudOrganizations: [],
		sharingEnabled: false,
		organizationAllowList: ORGANIZATION_ALLOW_ALL,
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
	})
	const [didHydrateState, setDidHydrateState] = useState(false)
	const [showWelcome, setShowWelcome] = useState(false)
	const [theme, setTheme] = useState(undefined)
	const [filePaths, setFilePaths] = useState([])
	const [openedTabs, setOpenedTabs] = useState([])
	const [commands, setCommands] = useState([])
	const [mcpServers, setMcpServers] = useState([])
	const [currentCheckpoint, setCurrentCheckpoint] = useState()
	const [extensionRouterModels, setExtensionRouterModels] = useState(undefined)
	const [marketplaceItems, setMarketplaceItems] = useState([])
	const [alwaysAllowFollowupQuestions, setAlwaysAllowFollowupQuestions] = useState(false) // Add state for follow-up questions auto-approve
	const [followupAutoApproveTimeoutMs, setFollowupAutoApproveTimeoutMs] = useState(undefined) // Will be set from global settings
	const [marketplaceInstalledMetadata, setMarketplaceInstalledMetadata] = useState({
		project: {},
		global: {},
	})
	const [includeTaskHistoryInEnhance, setIncludeTaskHistoryInEnhance] = useState(true)
	const [prevCloudIsAuthenticated, setPrevCloudIsAuthenticated] = useState(false)
	const [includeCurrentTime, setIncludeCurrentTime] = useState(true)
	const [includeCurrentCost, setIncludeCurrentCost] = useState(true)
	const setListApiConfigMeta = useCallback(
		(value) => setState((prevState) => ({ ...prevState, listApiConfigMeta: value })),
		[],
	)
	const setApiConfiguration = useCallback((value) => {
		setState((prevState) => ({
			...prevState,
			apiConfiguration: {
				...prevState.apiConfiguration,
				...value,
			},
		}))
	}, [])
	const handleMessage = useCallback(
		(event) => {
			const message = event.data
			switch (message.type) {
				case "state": {
					const newState = message.state
					setState((prevState) => mergeExtensionState(prevState, newState))
					setShowWelcome(!checkExistKey(newState.apiConfiguration))
					setDidHydrateState(true)
					// Update alwaysAllowFollowupQuestions if present in state message
					if (newState.alwaysAllowFollowupQuestions !== undefined) {
						setAlwaysAllowFollowupQuestions(newState.alwaysAllowFollowupQuestions)
					}
					// Update followupAutoApproveTimeoutMs if present in state message
					if (newState.followupAutoApproveTimeoutMs !== undefined) {
						setFollowupAutoApproveTimeoutMs(newState.followupAutoApproveTimeoutMs)
					}
					// Update includeTaskHistoryInEnhance if present in state message
					if (newState.includeTaskHistoryInEnhance !== undefined) {
						setIncludeTaskHistoryInEnhance(newState.includeTaskHistoryInEnhance)
					}
					// Update includeCurrentTime if present in state message
					if (newState.includeCurrentTime !== undefined) {
						setIncludeCurrentTime(newState.includeCurrentTime)
					}
					// Update includeCurrentCost if present in state message
					if (newState.includeCurrentCost !== undefined) {
						setIncludeCurrentCost(newState.includeCurrentCost)
					}
					// Handle marketplace data if present in state message
					if (newState.marketplaceItems !== undefined) {
						setMarketplaceItems(newState.marketplaceItems)
					}
					if (newState.marketplaceInstalledMetadata !== undefined) {
						setMarketplaceInstalledMetadata(newState.marketplaceInstalledMetadata)
					}
					break
				}
				case "action": {
					if (message.action === "toggleAutoApprove") {
						// Toggle the auto-approval state
						setState((prevState) => {
							const newValue = !(prevState.autoApprovalEnabled ?? false)
							// Also send the update to the extension
							vscode.postMessage({ type: "autoApprovalEnabled", bool: newValue })
							return { ...prevState, autoApprovalEnabled: newValue }
						})
					}
					break
				}
				case "theme": {
					if (message.text) {
						setTheme(convertTextMateToHljs(JSON.parse(message.text)))
					}
					break
				}
				case "workspaceUpdated": {
					const paths = message.filePaths ?? []
					const tabs = message.openedTabs ?? []
					setFilePaths(paths)
					setOpenedTabs(tabs)
					break
				}
				case "commands": {
					setCommands(message.commands ?? [])
					break
				}
				case "messageUpdated": {
					const clineMessage = message.clineMessage
					setState((prevState) => {
						// worth noting it will never be possible for a more up-to-date message to be sent here or in normal messages post since the presentAssistantContent function uses lock
						const lastIndex = findLastIndex(prevState.clineMessages, (msg) => msg.ts === clineMessage.ts)
						if (lastIndex !== -1) {
							const newClineMessages = [...prevState.clineMessages]
							newClineMessages[lastIndex] = clineMessage
							return { ...prevState, clineMessages: newClineMessages }
						}
						return prevState
					})
					break
				}
				case "mcpServers": {
					setMcpServers(message.mcpServers ?? [])
					break
				}
				case "currentCheckpointUpdated": {
					setCurrentCheckpoint(message.text)
					break
				}
				case "listApiConfig": {
					setListApiConfigMeta(message.listApiConfig ?? [])
					break
				}
				case "routerModels": {
					setExtensionRouterModels(message.routerModels)
					break
				}
				case "marketplaceData": {
					if (message.marketplaceItems !== undefined) {
						setMarketplaceItems(message.marketplaceItems)
					}
					if (message.marketplaceInstalledMetadata !== undefined) {
						setMarketplaceInstalledMetadata(message.marketplaceInstalledMetadata)
					}
					break
				}
			}
		},
		[setListApiConfigMeta],
	)
	useEffect(() => {
		window.addEventListener("message", handleMessage)
		return () => {
			window.removeEventListener("message", handleMessage)
		}
	}, [handleMessage])
	useEffect(() => {
		vscode.postMessage({ type: "webviewDidLaunch" })
	}, [])
	// Watch for authentication state changes and refresh Roo models
	useEffect(() => {
		const currentAuth = state.cloudIsAuthenticated ?? false
		const currentProvider = state.apiConfiguration?.apiProvider
		if (!prevCloudIsAuthenticated && currentAuth && currentProvider === "roo") {
			// User just authenticated and Roo is the active provider - refresh Roo models
			vscode.postMessage({ type: "requestRooModels" })
		}
		setPrevCloudIsAuthenticated(currentAuth)
	}, [state.cloudIsAuthenticated, prevCloudIsAuthenticated, state.apiConfiguration?.apiProvider])
	const contextValue = {
		...state,
		reasoningBlockCollapsed: state.reasoningBlockCollapsed ?? true,
		didHydrateState,
		showWelcome,
		theme,
		mcpServers,
		currentCheckpoint,
		filePaths,
		openedTabs,
		commands,
		soundVolume: state.soundVolume,
		ttsSpeed: state.ttsSpeed,
		fuzzyMatchThreshold: state.fuzzyMatchThreshold,
		writeDelayMs: state.writeDelayMs,
		screenshotQuality: state.screenshotQuality,
		routerModels: extensionRouterModels,
		cloudIsAuthenticated: state.cloudIsAuthenticated ?? false,
		cloudOrganizations: state.cloudOrganizations ?? [],
		organizationSettingsVersion: state.organizationSettingsVersion ?? -1,
		marketplaceItems,
		marketplaceInstalledMetadata,
		profileThresholds: state.profileThresholds ?? {},
		alwaysAllowFollowupQuestions,
		followupAutoApproveTimeoutMs,
		remoteControlEnabled: state.remoteControlEnabled ?? false,
		taskSyncEnabled: state.taskSyncEnabled,
		featureRoomoteControlEnabled: state.featureRoomoteControlEnabled ?? false,
		setExperimentEnabled: (id, enabled) =>
			setState((prevState) => ({ ...prevState, experiments: { ...prevState.experiments, [id]: enabled } })),
		setApiConfiguration,
		setCustomInstructions: (value) => setState((prevState) => ({ ...prevState, customInstructions: value })),
		setAlwaysAllowReadOnly: (value) => setState((prevState) => ({ ...prevState, alwaysAllowReadOnly: value })),
		setAlwaysAllowReadOnlyOutsideWorkspace: (value) =>
			setState((prevState) => ({ ...prevState, alwaysAllowReadOnlyOutsideWorkspace: value })),
		setAlwaysAllowWrite: (value) => setState((prevState) => ({ ...prevState, alwaysAllowWrite: value })),
		setAlwaysAllowWriteOutsideWorkspace: (value) =>
			setState((prevState) => ({ ...prevState, alwaysAllowWriteOutsideWorkspace: value })),
		setAlwaysAllowExecute: (value) => setState((prevState) => ({ ...prevState, alwaysAllowExecute: value })),
		setAlwaysAllowBrowser: (value) => setState((prevState) => ({ ...prevState, alwaysAllowBrowser: value })),
		setAlwaysAllowMcp: (value) => setState((prevState) => ({ ...prevState, alwaysAllowMcp: value })),
		setAlwaysAllowModeSwitch: (value) => setState((prevState) => ({ ...prevState, alwaysAllowModeSwitch: value })),
		setAlwaysAllowSubtasks: (value) => setState((prevState) => ({ ...prevState, alwaysAllowSubtasks: value })),
		setAlwaysAllowFollowupQuestions,
		setFollowupAutoApproveTimeoutMs: (value) =>
			setState((prevState) => ({ ...prevState, followupAutoApproveTimeoutMs: value })),
		setShowAnnouncement: (value) => setState((prevState) => ({ ...prevState, shouldShowAnnouncement: value })),
		setAllowedCommands: (value) => setState((prevState) => ({ ...prevState, allowedCommands: value })),
		setDeniedCommands: (value) => setState((prevState) => ({ ...prevState, deniedCommands: value })),
		setAllowedMaxRequests: (value) => setState((prevState) => ({ ...prevState, allowedMaxRequests: value })),
		setAllowedMaxCost: (value) => setState((prevState) => ({ ...prevState, allowedMaxCost: value })),
		setSoundEnabled: (value) => setState((prevState) => ({ ...prevState, soundEnabled: value })),
		setSoundVolume: (value) => setState((prevState) => ({ ...prevState, soundVolume: value })),
		setTtsEnabled: (value) => setState((prevState) => ({ ...prevState, ttsEnabled: value })),
		setTtsSpeed: (value) => setState((prevState) => ({ ...prevState, ttsSpeed: value })),
		setDiffEnabled: (value) => setState((prevState) => ({ ...prevState, diffEnabled: value })),
		setEnableCheckpoints: (value) => setState((prevState) => ({ ...prevState, enableCheckpoints: value })),
		setCheckpointTimeout: (value) => setState((prevState) => ({ ...prevState, checkpointTimeout: value })),
		setBrowserViewportSize: (value) => setState((prevState) => ({ ...prevState, browserViewportSize: value })),
		setFuzzyMatchThreshold: (value) => setState((prevState) => ({ ...prevState, fuzzyMatchThreshold: value })),
		setWriteDelayMs: (value) => setState((prevState) => ({ ...prevState, writeDelayMs: value })),
		setScreenshotQuality: (value) => setState((prevState) => ({ ...prevState, screenshotQuality: value })),
		setTerminalOutputLineLimit: (value) =>
			setState((prevState) => ({ ...prevState, terminalOutputLineLimit: value })),
		setTerminalOutputCharacterLimit: (value) =>
			setState((prevState) => ({ ...prevState, terminalOutputCharacterLimit: value })),
		setTerminalShellIntegrationTimeout: (value) =>
			setState((prevState) => ({ ...prevState, terminalShellIntegrationTimeout: value })),
		setTerminalShellIntegrationDisabled: (value) =>
			setState((prevState) => ({ ...prevState, terminalShellIntegrationDisabled: value })),
		setTerminalZdotdir: (value) => setState((prevState) => ({ ...prevState, terminalZdotdir: value })),
		setMcpEnabled: (value) => setState((prevState) => ({ ...prevState, mcpEnabled: value })),
		setEnableMcpServerCreation: (value) =>
			setState((prevState) => ({ ...prevState, enableMcpServerCreation: value })),
		setRemoteControlEnabled: (value) => setState((prevState) => ({ ...prevState, remoteControlEnabled: value })),
		setTaskSyncEnabled: (value) => setState((prevState) => ({ ...prevState, taskSyncEnabled: value })),
		setFeatureRoomoteControlEnabled: (value) =>
			setState((prevState) => ({ ...prevState, featureRoomoteControlEnabled: value })),
		setAlwaysApproveResubmit: (value) => setState((prevState) => ({ ...prevState, alwaysApproveResubmit: value })),
		setRequestDelaySeconds: (value) => setState((prevState) => ({ ...prevState, requestDelaySeconds: value })),
		setCurrentApiConfigName: (value) => setState((prevState) => ({ ...prevState, currentApiConfigName: value })),
		setListApiConfigMeta,
		setMode: (value) => setState((prevState) => ({ ...prevState, mode: value })),
		setCustomModePrompts: (value) => setState((prevState) => ({ ...prevState, customModePrompts: value })),
		setCustomSupportPrompts: (value) => setState((prevState) => ({ ...prevState, customSupportPrompts: value })),
		setEnhancementApiConfigId: (value) =>
			setState((prevState) => ({ ...prevState, enhancementApiConfigId: value })),
		setAutoApprovalEnabled: (value) => setState((prevState) => ({ ...prevState, autoApprovalEnabled: value })),
		setCustomModes: (value) => setState((prevState) => ({ ...prevState, customModes: value })),
		setMaxOpenTabsContext: (value) => setState((prevState) => ({ ...prevState, maxOpenTabsContext: value })),
		setMaxWorkspaceFiles: (value) => setState((prevState) => ({ ...prevState, maxWorkspaceFiles: value })),
		setBrowserToolEnabled: (value) => setState((prevState) => ({ ...prevState, browserToolEnabled: value })),
		setTelemetrySetting: (value) => setState((prevState) => ({ ...prevState, telemetrySetting: value })),
		setShowRooIgnoredFiles: (value) => setState((prevState) => ({ ...prevState, showRooIgnoredFiles: value })),
		setRemoteBrowserEnabled: (value) => setState((prevState) => ({ ...prevState, remoteBrowserEnabled: value })),
		setAwsUsePromptCache: (value) => setState((prevState) => ({ ...prevState, awsUsePromptCache: value })),
		setMaxReadFileLine: (value) => setState((prevState) => ({ ...prevState, maxReadFileLine: value })),
		setMaxImageFileSize: (value) => setState((prevState) => ({ ...prevState, maxImageFileSize: value })),
		setMaxTotalImageSize: (value) => setState((prevState) => ({ ...prevState, maxTotalImageSize: value })),
		setPinnedApiConfigs: (value) => setState((prevState) => ({ ...prevState, pinnedApiConfigs: value })),
		setTerminalCompressProgressBar: (value) =>
			setState((prevState) => ({ ...prevState, terminalCompressProgressBar: value })),
		togglePinnedApiConfig: (configId) =>
			setState((prevState) => {
				const currentPinned = prevState.pinnedApiConfigs || {}
				const newPinned = {
					...currentPinned,
					[configId]: !currentPinned[configId],
				}
				// If the config is now unpinned, remove it from the object
				if (!newPinned[configId]) {
					delete newPinned[configId]
				}
				return { ...prevState, pinnedApiConfigs: newPinned }
			}),
		setHistoryPreviewCollapsed: (value) =>
			setState((prevState) => ({ ...prevState, historyPreviewCollapsed: value })),
		setReasoningBlockCollapsed: (value) =>
			setState((prevState) => ({ ...prevState, reasoningBlockCollapsed: value })),
		setHasOpenedModeSelector: (value) => setState((prevState) => ({ ...prevState, hasOpenedModeSelector: value })),
		setAutoCondenseContext: (value) => setState((prevState) => ({ ...prevState, autoCondenseContext: value })),
		setAutoCondenseContextPercent: (value) =>
			setState((prevState) => ({ ...prevState, autoCondenseContextPercent: value })),
		setCondensingApiConfigId: (value) => setState((prevState) => ({ ...prevState, condensingApiConfigId: value })),
		setCustomCondensingPrompt: (value) =>
			setState((prevState) => ({ ...prevState, customCondensingPrompt: value })),
		setProfileThresholds: (value) => setState((prevState) => ({ ...prevState, profileThresholds: value })),
		alwaysAllowUpdateTodoList: state.alwaysAllowUpdateTodoList,
		setAlwaysAllowUpdateTodoList: (value) => {
			setState((prevState) => ({ ...prevState, alwaysAllowUpdateTodoList: value }))
		},
		includeDiagnosticMessages: state.includeDiagnosticMessages,
		setIncludeDiagnosticMessages: (value) => {
			setState((prevState) => ({ ...prevState, includeDiagnosticMessages: value }))
		},
		maxDiagnosticMessages: state.maxDiagnosticMessages,
		setMaxDiagnosticMessages: (value) => {
			setState((prevState) => ({ ...prevState, maxDiagnosticMessages: value }))
		},
		includeTaskHistoryInEnhance,
		setIncludeTaskHistoryInEnhance,
		includeCurrentTime,
		setIncludeCurrentTime,
		includeCurrentCost,
		setIncludeCurrentCost,
		enableManualReview: state.enableManualReview,
		setEnableManualReview: (value) => setState((prevState) => ({ ...prevState, enableManualReview: value })),
	}
	return _jsx(ExtensionStateContext.Provider, { value: contextValue, children: children })
}
export const useExtensionState = () => {
	const context = useContext(ExtensionStateContext)
	if (context === undefined) {
		throw new Error("useExtensionState must be used within an ExtensionStateContextProvider")
	}
	return context
}
//# sourceMappingURL=ExtensionStateContext.js.map
