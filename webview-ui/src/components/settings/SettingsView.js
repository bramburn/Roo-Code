import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime"
import React, {
	forwardRef,
	memo,
	useCallback,
	useEffect,
	useImperativeHandle,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react"
import {
	CheckCheck,
	SquareMousePointer,
	Webhook,
	GitBranch,
	Bell,
	Database,
	SquareTerminal,
	FlaskConical,
	AlertTriangle,
	Globe,
	Info,
	MessageSquare,
	SquareSlash,
	Glasses,
} from "lucide-react"
import { vscode } from "@src/utils/vscode"
import { cn } from "@src/lib/utils"
import { useAppTranslation } from "@src/i18n/TranslationContext"
import { useExtensionState } from "@src/context/ExtensionStateContext"
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogTitle,
	AlertDialogDescription,
	AlertDialogCancel,
	AlertDialogAction,
	AlertDialogHeader,
	AlertDialogFooter,
	Button,
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
	StandardTooltip,
} from "@src/components/ui"
import { Tab, TabContent, TabHeader, TabList, TabTrigger } from "../common/Tab"
import { SectionHeader } from "./SectionHeader"
import ApiConfigManager from "./ApiConfigManager"
import ApiOptions from "./ApiOptions"
import { AutoApproveSettings } from "./AutoApproveSettings"
import { BrowserSettings } from "./BrowserSettings"
import { CheckpointSettings } from "./CheckpointSettings"
import { NotificationSettings } from "./NotificationSettings"
import { ContextManagementSettings } from "./ContextManagementSettings"
import { TerminalSettings } from "./TerminalSettings"
import { ExperimentalSettings } from "./ExperimentalSettings"
import { LanguageSettings } from "./LanguageSettings"
import { About } from "./About"
import { Section } from "./Section"
import PromptsSettings from "./PromptsSettings"
import { SlashCommandsSettings } from "./SlashCommandsSettings"
import { UISettings } from "./UISettings"
export const settingsTabsContainer = "flex flex-1 overflow-hidden [&.narrow_.tab-label]:hidden"
export const settingsTabList =
	"w-48 data-[compact=true]:w-12 flex-shrink-0 flex flex-col overflow-y-auto overflow-x-hidden border-r border-vscode-sideBar-background"
export const settingsTabTrigger =
	"whitespace-nowrap overflow-hidden min-w-0 h-12 px-4 py-3 box-border flex items-center border-l-2 border-transparent text-vscode-foreground opacity-70 hover:bg-vscode-list-hoverBackground data-[compact=true]:w-12 data-[compact=true]:p-4"
export const settingsTabTriggerActive = "opacity-100 border-vscode-focusBorder bg-vscode-list-activeSelectionBackground"
const sectionNames = [
	"providers",
	"autoApprove",
	"slashCommands",
	"browser",
	"checkpoints",
	"notifications",
	"contextManagement",
	"terminal",
	"prompts",
	"ui",
	"experimental",
	"retry",
	"language",
	"about",
]
const SettingsView = forwardRef(({ onDone, targetSection }, ref) => {
	const { t } = useAppTranslation()
	const extensionState = useExtensionState()
	const { currentApiConfigName, listApiConfigMeta, uriScheme, settingsImportedAt } = extensionState
	const [isDiscardDialogShow, setDiscardDialogShow] = useState(false)
	const [isChangeDetected, setChangeDetected] = useState(false)
	const [errorMessage, setErrorMessage] = useState(undefined)
	const [activeTab, setActiveTab] = useState(
		targetSection && sectionNames.includes(targetSection) ? targetSection : "providers",
	)
	const scrollPositions = useRef(Object.fromEntries(sectionNames.map((s) => [s, 0])))
	const contentRef = useRef(null)
	const prevApiConfigName = useRef(currentApiConfigName)
	const confirmDialogHandler = useRef()
	const [cachedState, setCachedState] = useState(() => extensionState)
	const {
		alwaysAllowReadOnly,
		alwaysAllowReadOnlyOutsideWorkspace,
		allowedCommands,
		deniedCommands,
		allowedMaxRequests,
		allowedMaxCost,
		language,
		alwaysAllowBrowser,
		alwaysAllowExecute,
		alwaysAllowMcp,
		alwaysAllowModeSwitch,
		alwaysAllowSubtasks,
		alwaysAllowWrite,
		alwaysAllowWriteOutsideWorkspace,
		alwaysAllowWriteProtected,
		alwaysApproveResubmit,
		autoCondenseContext,
		autoCondenseContextPercent,
		browserToolEnabled,
		browserViewportSize,
		enableCheckpoints,
		checkpointTimeout,
		diffEnabled,
		experiments,
		fuzzyMatchThreshold,
		maxOpenTabsContext,
		maxWorkspaceFiles,
		mcpEnabled,
		requestDelaySeconds,
		remoteBrowserHost,
		screenshotQuality,
		soundEnabled,
		ttsEnabled,
		ttsSpeed,
		soundVolume,
		telemetrySetting,
		terminalOutputLineLimit,
		terminalOutputCharacterLimit,
		terminalShellIntegrationTimeout,
		terminalShellIntegrationDisabled, // Added from upstream
		terminalCommandDelay,
		terminalPowershellCounter,
		terminalZshClearEolMark,
		terminalZshOhMy,
		terminalZshP10k,
		terminalZdotdir,
		writeDelayMs,
		showRooIgnoredFiles,
		remoteBrowserEnabled,
		maxReadFileLine,
		maxImageFileSize,
		maxTotalImageSize,
		terminalCompressProgressBar,
		maxConcurrentFileReads,
		condensingApiConfigId,
		customCondensingPrompt,
		customSupportPrompts,
		profileThresholds,
		alwaysAllowFollowupQuestions,
		alwaysAllowUpdateTodoList,
		followupAutoApproveTimeoutMs,
		includeDiagnosticMessages,
		maxDiagnosticMessages,
		includeTaskHistoryInEnhance,
		openRouterImageApiKey,
		openRouterImageGenerationSelectedModel,
		reasoningBlockCollapsed,
		includeCurrentTime,
		includeCurrentCost,
		enableManualReview,
	} = cachedState
	const apiConfiguration = useMemo(() => cachedState.apiConfiguration ?? {}, [cachedState.apiConfiguration])
	useEffect(() => {
		// Update only when currentApiConfigName is changed.
		// Expected to be triggered by loadApiConfiguration/upsertApiConfiguration.
		if (prevApiConfigName.current === currentApiConfigName) {
			return
		}
		setCachedState((prevCachedState) => ({ ...prevCachedState, ...extensionState }))
		prevApiConfigName.current = currentApiConfigName
		setChangeDetected(false)
	}, [currentApiConfigName, extensionState])
	// Bust the cache when settings are imported.
	useEffect(() => {
		if (settingsImportedAt) {
			setCachedState((prevCachedState) => ({ ...prevCachedState, ...extensionState }))
			setChangeDetected(false)
		}
	}, [settingsImportedAt, extensionState])
	const setCachedStateField = useCallback((field, value) => {
		setCachedState((prevState) => {
			if (prevState[field] === value) {
				return prevState
			}
			setChangeDetected(true)
			return { ...prevState, [field]: value }
		})
	}, [])
	const setApiConfigurationField = useCallback((field, value, isUserAction = true) => {
		setCachedState((prevState) => {
			if (prevState.apiConfiguration?.[field] === value) {
				return prevState
			}
			const previousValue = prevState.apiConfiguration?.[field]
			// Only skip change detection for automatic initialization (not user actions)
			// This prevents the dirty state when the component initializes and auto-syncs values
			// Treat undefined, null, and empty string as uninitialized states
			const isInitialSync =
				!isUserAction &&
				(previousValue === undefined || previousValue === "" || previousValue === null) &&
				value !== undefined &&
				value !== "" &&
				value !== null
			if (!isInitialSync) {
				setChangeDetected(true)
			}
			return { ...prevState, apiConfiguration: { ...prevState.apiConfiguration, [field]: value } }
		})
	}, [])
	const setExperimentEnabled = useCallback((id, enabled) => {
		setCachedState((prevState) => {
			if (prevState.experiments?.[id] === enabled) {
				return prevState
			}
			setChangeDetected(true)
			return { ...prevState, experiments: { ...prevState.experiments, [id]: enabled } }
		})
	}, [])
	const setTelemetrySetting = useCallback((setting) => {
		setCachedState((prevState) => {
			if (prevState.telemetrySetting === setting) {
				return prevState
			}
			setChangeDetected(true)
			return { ...prevState, telemetrySetting: setting }
		})
	}, [])
	const setOpenRouterImageApiKey = useCallback((apiKey) => {
		setCachedState((prevState) => {
			// Only set change detected if value actually changed
			if (prevState.openRouterImageApiKey !== apiKey) {
				setChangeDetected(true)
			}
			return { ...prevState, openRouterImageApiKey: apiKey }
		})
	}, [])
	const setImageGenerationSelectedModel = useCallback((model) => {
		setCachedState((prevState) => {
			// Only set change detected if value actually changed
			if (prevState.openRouterImageGenerationSelectedModel !== model) {
				setChangeDetected(true)
			}
			return { ...prevState, openRouterImageGenerationSelectedModel: model }
		})
	}, [])
	const setCustomSupportPromptsField = useCallback((prompts) => {
		setCachedState((prevState) => {
			const previousStr = JSON.stringify(prevState.customSupportPrompts)
			const newStr = JSON.stringify(prompts)
			if (previousStr === newStr) {
				return prevState
			}
			setChangeDetected(true)
			return { ...prevState, customSupportPrompts: prompts }
		})
	}, [])
	const isSettingValid = !errorMessage
	const handleSubmit = () => {
		if (isSettingValid) {
			vscode.postMessage({ type: "language", text: language })
			vscode.postMessage({ type: "alwaysAllowReadOnly", bool: alwaysAllowReadOnly })
			vscode.postMessage({
				type: "alwaysAllowReadOnlyOutsideWorkspace",
				bool: alwaysAllowReadOnlyOutsideWorkspace,
			})
			vscode.postMessage({ type: "alwaysAllowWrite", bool: alwaysAllowWrite })
			vscode.postMessage({ type: "alwaysAllowWriteOutsideWorkspace", bool: alwaysAllowWriteOutsideWorkspace })
			vscode.postMessage({ type: "alwaysAllowWriteProtected", bool: alwaysAllowWriteProtected })
			vscode.postMessage({ type: "alwaysAllowExecute", bool: alwaysAllowExecute })
			vscode.postMessage({ type: "alwaysAllowBrowser", bool: alwaysAllowBrowser })
			vscode.postMessage({ type: "alwaysAllowMcp", bool: alwaysAllowMcp })
			vscode.postMessage({ type: "allowedCommands", commands: allowedCommands ?? [] })
			vscode.postMessage({ type: "deniedCommands", commands: deniedCommands ?? [] })
			vscode.postMessage({ type: "allowedMaxRequests", value: allowedMaxRequests ?? undefined })
			vscode.postMessage({ type: "allowedMaxCost", value: allowedMaxCost ?? undefined })
			vscode.postMessage({ type: "autoCondenseContext", bool: autoCondenseContext })
			vscode.postMessage({ type: "autoCondenseContextPercent", value: autoCondenseContextPercent })
			vscode.postMessage({ type: "browserToolEnabled", bool: browserToolEnabled })
			vscode.postMessage({ type: "soundEnabled", bool: soundEnabled })
			vscode.postMessage({ type: "ttsEnabled", bool: ttsEnabled })
			vscode.postMessage({ type: "ttsSpeed", value: ttsSpeed })
			vscode.postMessage({ type: "soundVolume", value: soundVolume })
			vscode.postMessage({ type: "diffEnabled", bool: diffEnabled })
			vscode.postMessage({ type: "enableCheckpoints", bool: enableCheckpoints })
			vscode.postMessage({ type: "checkpointTimeout", value: checkpointTimeout })
			vscode.postMessage({ type: "browserViewportSize", text: browserViewportSize })
			vscode.postMessage({ type: "remoteBrowserHost", text: remoteBrowserHost })
			vscode.postMessage({ type: "remoteBrowserEnabled", bool: remoteBrowserEnabled })
			vscode.postMessage({ type: "fuzzyMatchThreshold", value: fuzzyMatchThreshold ?? 1.0 })
			vscode.postMessage({ type: "writeDelayMs", value: writeDelayMs })
			vscode.postMessage({ type: "screenshotQuality", value: screenshotQuality ?? 75 })
			vscode.postMessage({ type: "terminalOutputLineLimit", value: terminalOutputLineLimit ?? 500 })
			vscode.postMessage({ type: "terminalOutputCharacterLimit", value: terminalOutputCharacterLimit ?? 50000 })
			vscode.postMessage({ type: "terminalShellIntegrationTimeout", value: terminalShellIntegrationTimeout })
			vscode.postMessage({ type: "terminalShellIntegrationDisabled", bool: terminalShellIntegrationDisabled })
			vscode.postMessage({ type: "terminalCommandDelay", value: terminalCommandDelay })
			vscode.postMessage({ type: "terminalPowershellCounter", bool: terminalPowershellCounter })
			vscode.postMessage({ type: "terminalZshClearEolMark", bool: terminalZshClearEolMark })
			vscode.postMessage({ type: "terminalZshOhMy", bool: terminalZshOhMy })
			vscode.postMessage({ type: "terminalZshP10k", bool: terminalZshP10k })
			vscode.postMessage({ type: "terminalZdotdir", bool: terminalZdotdir })
			vscode.postMessage({ type: "terminalCompressProgressBar", bool: terminalCompressProgressBar })
			vscode.postMessage({ type: "mcpEnabled", bool: mcpEnabled })
			vscode.postMessage({ type: "alwaysApproveResubmit", bool: alwaysApproveResubmit })
			vscode.postMessage({ type: "requestDelaySeconds", value: requestDelaySeconds })
			vscode.postMessage({ type: "maxOpenTabsContext", value: maxOpenTabsContext })
			vscode.postMessage({ type: "maxWorkspaceFiles", value: maxWorkspaceFiles ?? 200 })
			vscode.postMessage({ type: "showRooIgnoredFiles", bool: showRooIgnoredFiles })
			vscode.postMessage({ type: "maxReadFileLine", value: maxReadFileLine ?? -1 })
			vscode.postMessage({ type: "maxImageFileSize", value: maxImageFileSize ?? 5 })
			vscode.postMessage({ type: "maxTotalImageSize", value: maxTotalImageSize ?? 20 })
			vscode.postMessage({ type: "maxConcurrentFileReads", value: cachedState.maxConcurrentFileReads ?? 5 })
			vscode.postMessage({ type: "includeDiagnosticMessages", bool: includeDiagnosticMessages })
			vscode.postMessage({ type: "maxDiagnosticMessages", value: maxDiagnosticMessages ?? 50 })
			vscode.postMessage({ type: "currentApiConfigName", text: currentApiConfigName })
			vscode.postMessage({ type: "updateExperimental", values: experiments })
			vscode.postMessage({ type: "alwaysAllowModeSwitch", bool: alwaysAllowModeSwitch })
			vscode.postMessage({ type: "alwaysAllowSubtasks", bool: alwaysAllowSubtasks })
			vscode.postMessage({ type: "alwaysAllowFollowupQuestions", bool: alwaysAllowFollowupQuestions })
			vscode.postMessage({ type: "alwaysAllowUpdateTodoList", bool: alwaysAllowUpdateTodoList })
			vscode.postMessage({ type: "followupAutoApproveTimeoutMs", value: followupAutoApproveTimeoutMs })
			vscode.postMessage({ type: "condensingApiConfigId", text: condensingApiConfigId || "" })
			vscode.postMessage({ type: "updateCondensingPrompt", text: customCondensingPrompt || "" })
			vscode.postMessage({ type: "updateSupportPrompt", values: customSupportPrompts || {} })
			vscode.postMessage({ type: "includeTaskHistoryInEnhance", bool: includeTaskHistoryInEnhance ?? true })
			vscode.postMessage({ type: "setReasoningBlockCollapsed", bool: reasoningBlockCollapsed ?? true })
			vscode.postMessage({ type: "includeCurrentTime", bool: includeCurrentTime ?? true })
			vscode.postMessage({ type: "includeCurrentCost", bool: includeCurrentCost ?? true })
			vscode.postMessage({ type: "enableManualReview", bool: enableManualReview ?? false })
			vscode.postMessage({ type: "upsertApiConfiguration", text: currentApiConfigName, apiConfiguration })
			vscode.postMessage({ type: "telemetrySetting", text: telemetrySetting })
			vscode.postMessage({ type: "profileThresholds", values: profileThresholds })
			vscode.postMessage({ type: "openRouterImageApiKey", text: openRouterImageApiKey })
			vscode.postMessage({
				type: "openRouterImageGenerationSelectedModel",
				text: openRouterImageGenerationSelectedModel,
			})
			setChangeDetected(false)
		}
	}
	const checkUnsaveChanges = useCallback(
		(then) => {
			if (isChangeDetected) {
				confirmDialogHandler.current = then
				setDiscardDialogShow(true)
			} else {
				then()
			}
		},
		[isChangeDetected],
	)
	useImperativeHandle(ref, () => ({ checkUnsaveChanges }), [checkUnsaveChanges])
	const onConfirmDialogResult = useCallback(
		(confirm) => {
			if (confirm) {
				// Discard changes: Reset state and flag
				setCachedState(extensionState) // Revert to original state
				setChangeDetected(false) // Reset change flag
				confirmDialogHandler.current?.() // Execute the pending action (e.g., tab switch)
			}
			// If confirm is false (Cancel), do nothing, dialog closes automatically
		},
		[extensionState],
	)
	// Handle tab changes with unsaved changes check
	const handleTabChange = useCallback(
		(newTab) => {
			if (contentRef.current) {
				scrollPositions.current[activeTab] = contentRef.current.scrollTop
			}
			setActiveTab(newTab)
		},
		[activeTab],
	)
	useLayoutEffect(() => {
		if (contentRef.current) {
			contentRef.current.scrollTop = scrollPositions.current[activeTab] ?? 0
		}
	}, [activeTab])
	// Store direct DOM element refs for each tab
	const tabRefs = useRef(Object.fromEntries(sectionNames.map((name) => [name, null])))
	// Track whether we're in compact mode
	const [isCompactMode, setIsCompactMode] = useState(false)
	const containerRef = useRef(null)
	// Setup resize observer to detect when we should switch to compact mode
	useEffect(() => {
		if (!containerRef.current) return
		const observer = new ResizeObserver((entries) => {
			for (const entry of entries) {
				// If container width is less than 500px, switch to compact mode
				setIsCompactMode(entry.contentRect.width < 500)
			}
		})
		observer.observe(containerRef.current)
		return () => {
			observer?.disconnect()
		}
	}, [])
	const sections = useMemo(
		() => [
			{ id: "providers", icon: Webhook },
			{ id: "autoApprove", icon: CheckCheck },
			{ id: "slashCommands", icon: SquareSlash },
			{ id: "browser", icon: SquareMousePointer },
			{ id: "checkpoints", icon: GitBranch },
			{ id: "notifications", icon: Bell },
			{ id: "contextManagement", icon: Database },
			{ id: "terminal", icon: SquareTerminal },
			{ id: "prompts", icon: MessageSquare },
			{ id: "ui", icon: Glasses },
			{ id: "experimental", icon: FlaskConical },
			{ id: "language", icon: Globe },
			{ id: "about", icon: Info },
		],
		[],
	)
	// Update target section logic to set active tab
	useEffect(() => {
		if (targetSection && sectionNames.includes(targetSection)) {
			setActiveTab(targetSection)
		}
	}, [targetSection])
	// Function to scroll the active tab into view for vertical layout
	const scrollToActiveTab = useCallback(() => {
		const activeTabElement = tabRefs.current[activeTab]
		if (activeTabElement) {
			activeTabElement.scrollIntoView({
				behavior: "auto",
				block: "nearest",
			})
		}
	}, [activeTab])
	// Effect to scroll when the active tab changes
	useEffect(() => {
		scrollToActiveTab()
	}, [activeTab, scrollToActiveTab])
	// Effect to scroll when the webview becomes visible
	useLayoutEffect(() => {
		const handleMessage = (event) => {
			const message = event.data
			if (message.type === "action" && message.action === "didBecomeVisible") {
				scrollToActiveTab()
			}
		}
		window.addEventListener("message", handleMessage)
		return () => {
			window.removeEventListener("message", handleMessage)
		}
	}, [scrollToActiveTab])
	return _jsxs(Tab, {
		children: [
			_jsxs(TabHeader, {
				className: "flex justify-between items-center gap-2",
				children: [
					_jsx("div", {
						className: "flex items-center gap-1",
						children: _jsx("h3", {
							className: "text-vscode-foreground m-0",
							children: t("settings:header.title"),
						}),
					}),
					_jsxs("div", {
						className: "flex gap-2",
						children: [
							_jsx(StandardTooltip, {
								content: !isSettingValid
									? errorMessage
									: isChangeDetected
										? t("settings:header.saveButtonTooltip")
										: t("settings:header.nothingChangedTooltip"),
								children: _jsx(Button, {
									variant: isSettingValid ? "default" : "secondary",
									className: !isSettingValid ? "!border-vscode-errorForeground" : "",
									onClick: handleSubmit,
									disabled: !isChangeDetected || !isSettingValid,
									"data-testid": "save-button",
									children: t("settings:common.save"),
								}),
							}),
							_jsx(StandardTooltip, {
								content: t("settings:header.doneButtonTooltip"),
								children: _jsx(Button, {
									variant: "secondary",
									onClick: () => checkUnsaveChanges(onDone),
									children: t("settings:common.done"),
								}),
							}),
						],
					}),
				],
			}),
			_jsxs("div", {
				ref: containerRef,
				className: cn(settingsTabsContainer, isCompactMode && "narrow"),
				children: [
					_jsx(TabList, {
						value: activeTab,
						onValueChange: (value) => handleTabChange(value),
						className: cn(settingsTabList),
						"data-compact": isCompactMode,
						"data-testid": "settings-tab-list",
						children: sections.map(({ id, icon: Icon }) => {
							const isSelected = id === activeTab
							const onSelect = () => handleTabChange(id)
							// Base TabTrigger component definition
							// We pass isSelected manually for styling, but onSelect is handled conditionally
							const triggerComponent = _jsx(TabTrigger, {
								ref: (element) => (tabRefs.current[id] = element),
								value: id,
								isSelected: isSelected,
								className: cn(
									isSelected // Use manual isSelected for styling
										? `${settingsTabTrigger} ${settingsTabTriggerActive}`
										: settingsTabTrigger,
									"focus:ring-0",
								),
								"data-testid": `tab-${id}`,
								"data-compact": isCompactMode,
								children: _jsxs("div", {
									className: cn("flex items-center gap-2", isCompactMode && "justify-center"),
									children: [
										_jsx(Icon, { className: "w-4 h-4" }),
										_jsx("span", {
											className: "tab-label",
											children: t(`settings:sections.${id}`),
										}),
									],
								}),
							})
							if (isCompactMode) {
								// Wrap in Tooltip and manually add onClick to the trigger
								return _jsx(
									TooltipProvider,
									{
										delayDuration: 300,
										children: _jsxs(Tooltip, {
											children: [
												_jsx(TooltipTrigger, {
													asChild: true,
													onClick: onSelect,
													children: React.cloneElement(triggerComponent),
												}),
												_jsx(TooltipContent, {
													side: "right",
													className: "text-base",
													children: _jsx("p", {
														className: "m-0",
														children: t(`settings:sections.${id}`),
													}),
												}),
											],
										}),
									},
									id,
								)
							} else {
								// Render trigger directly; TabList will inject onSelect via cloning
								// Ensure the element passed to TabList has the key
								return React.cloneElement(triggerComponent, { key: id })
							}
						}),
					}),
					_jsxs(TabContent, {
						ref: contentRef,
						className: "p-0 flex-1 overflow-auto",
						children: [
							activeTab === "providers" &&
								_jsxs("div", {
									children: [
										_jsx(SectionHeader, {
											children: _jsxs("div", {
												className: "flex items-center gap-2",
												children: [
													_jsx(Webhook, { className: "w-4" }),
													_jsx("div", { children: t("settings:sections.providers") }),
												],
											}),
										}),
										_jsxs(Section, {
											children: [
												_jsx(ApiConfigManager, {
													currentApiConfigName: currentApiConfigName,
													listApiConfigMeta: listApiConfigMeta,
													onSelectConfig: (configName) =>
														checkUnsaveChanges(() =>
															vscode.postMessage({
																type: "loadApiConfiguration",
																text: configName,
															}),
														),
													onDeleteConfig: (configName) =>
														vscode.postMessage({
															type: "deleteApiConfiguration",
															text: configName,
														}),
													onRenameConfig: (oldName, newName) => {
														vscode.postMessage({
															type: "renameApiConfiguration",
															values: { oldName, newName },
															apiConfiguration,
														})
														prevApiConfigName.current = newName
													},
													onUpsertConfig: (configName) =>
														vscode.postMessage({
															type: "upsertApiConfiguration",
															text: configName,
															apiConfiguration,
														}),
												}),
												_jsx(ApiOptions, {
													uriScheme: uriScheme,
													apiConfiguration: apiConfiguration,
													setApiConfigurationField: setApiConfigurationField,
													errorMessage: errorMessage,
													setErrorMessage: setErrorMessage,
												}),
											],
										}),
									],
								}),
							activeTab === "autoApprove" &&
								_jsx(AutoApproveSettings, {
									alwaysAllowReadOnly: alwaysAllowReadOnly,
									alwaysAllowReadOnlyOutsideWorkspace: alwaysAllowReadOnlyOutsideWorkspace,
									alwaysAllowWrite: alwaysAllowWrite,
									alwaysAllowWriteOutsideWorkspace: alwaysAllowWriteOutsideWorkspace,
									alwaysAllowWriteProtected: alwaysAllowWriteProtected,
									alwaysAllowBrowser: alwaysAllowBrowser,
									alwaysApproveResubmit: alwaysApproveResubmit,
									requestDelaySeconds: requestDelaySeconds,
									alwaysAllowMcp: alwaysAllowMcp,
									alwaysAllowModeSwitch: alwaysAllowModeSwitch,
									alwaysAllowSubtasks: alwaysAllowSubtasks,
									alwaysAllowExecute: alwaysAllowExecute,
									alwaysAllowFollowupQuestions: alwaysAllowFollowupQuestions,
									alwaysAllowUpdateTodoList: alwaysAllowUpdateTodoList,
									followupAutoApproveTimeoutMs: followupAutoApproveTimeoutMs,
									allowedCommands: allowedCommands,
									allowedMaxRequests: allowedMaxRequests ?? undefined,
									allowedMaxCost: allowedMaxCost ?? undefined,
									deniedCommands: deniedCommands,
									setCachedStateField: setCachedStateField,
								}),
							activeTab === "slashCommands" && _jsx(SlashCommandsSettings, {}),
							activeTab === "browser" &&
								_jsx(BrowserSettings, {
									browserToolEnabled: browserToolEnabled,
									browserViewportSize: browserViewportSize,
									screenshotQuality: screenshotQuality,
									remoteBrowserHost: remoteBrowserHost,
									remoteBrowserEnabled: remoteBrowserEnabled,
									setCachedStateField: setCachedStateField,
								}),
							activeTab === "checkpoints" &&
								_jsx(CheckpointSettings, {
									enableCheckpoints: enableCheckpoints,
									checkpointTimeout: checkpointTimeout,
									setCachedStateField: setCachedStateField,
								}),
							activeTab === "notifications" &&
								_jsx(NotificationSettings, {
									ttsEnabled: ttsEnabled,
									ttsSpeed: ttsSpeed,
									soundEnabled: soundEnabled,
									soundVolume: soundVolume,
									setCachedStateField: setCachedStateField,
								}),
							activeTab === "contextManagement" &&
								_jsx(ContextManagementSettings, {
									autoCondenseContext: autoCondenseContext,
									autoCondenseContextPercent: autoCondenseContextPercent,
									listApiConfigMeta: listApiConfigMeta ?? [],
									maxOpenTabsContext: maxOpenTabsContext,
									maxWorkspaceFiles: maxWorkspaceFiles ?? 200,
									showRooIgnoredFiles: showRooIgnoredFiles,
									maxReadFileLine: maxReadFileLine,
									maxImageFileSize: maxImageFileSize,
									maxTotalImageSize: maxTotalImageSize,
									maxConcurrentFileReads: maxConcurrentFileReads,
									profileThresholds: profileThresholds,
									includeDiagnosticMessages: includeDiagnosticMessages,
									maxDiagnosticMessages: maxDiagnosticMessages,
									writeDelayMs: writeDelayMs,
									includeCurrentTime: includeCurrentTime,
									includeCurrentCost: includeCurrentCost,
									enableManualReview: enableManualReview,
									setCachedStateField: setCachedStateField,
								}),
							activeTab === "terminal" &&
								_jsx(TerminalSettings, {
									terminalOutputLineLimit: terminalOutputLineLimit,
									terminalOutputCharacterLimit: terminalOutputCharacterLimit,
									terminalShellIntegrationTimeout: terminalShellIntegrationTimeout,
									terminalShellIntegrationDisabled: terminalShellIntegrationDisabled,
									terminalCommandDelay: terminalCommandDelay,
									terminalPowershellCounter: terminalPowershellCounter,
									terminalZshClearEolMark: terminalZshClearEolMark,
									terminalZshOhMy: terminalZshOhMy,
									terminalZshP10k: terminalZshP10k,
									terminalZdotdir: terminalZdotdir,
									terminalCompressProgressBar: terminalCompressProgressBar,
									setCachedStateField: setCachedStateField,
								}),
							activeTab === "prompts" &&
								_jsx(PromptsSettings, {
									customSupportPrompts: customSupportPrompts || {},
									setCustomSupportPrompts: setCustomSupportPromptsField,
									includeTaskHistoryInEnhance: includeTaskHistoryInEnhance,
									setIncludeTaskHistoryInEnhance: (value) =>
										setCachedStateField("includeTaskHistoryInEnhance", value),
								}),
							activeTab === "ui" &&
								_jsx(UISettings, {
									reasoningBlockCollapsed: reasoningBlockCollapsed ?? true,
									setCachedStateField: setCachedStateField,
								}),
							activeTab === "experimental" &&
								_jsx(ExperimentalSettings, {
									setExperimentEnabled: setExperimentEnabled,
									experiments: experiments,
									apiConfiguration: apiConfiguration,
									setApiConfigurationField: setApiConfigurationField,
									openRouterImageApiKey: openRouterImageApiKey,
									openRouterImageGenerationSelectedModel: openRouterImageGenerationSelectedModel,
									setOpenRouterImageApiKey: setOpenRouterImageApiKey,
									setImageGenerationSelectedModel: setImageGenerationSelectedModel,
								}),
							activeTab === "language" &&
								_jsx(LanguageSettings, {
									language: language || "en",
									setCachedStateField: setCachedStateField,
								}),
							activeTab === "about" &&
								_jsx(About, {
									telemetrySetting: telemetrySetting,
									setTelemetrySetting: setTelemetrySetting,
								}),
						],
					}),
				],
			}),
			_jsx(AlertDialog, {
				open: isDiscardDialogShow,
				onOpenChange: setDiscardDialogShow,
				children: _jsxs(AlertDialogContent, {
					children: [
						_jsxs(AlertDialogHeader, {
							children: [
								_jsxs(AlertDialogTitle, {
									children: [
										_jsx(AlertTriangle, { className: "w-5 h-5 text-yellow-500" }),
										t("settings:unsavedChangesDialog.title"),
									],
								}),
								_jsx(AlertDialogDescription, {
									children: t("settings:unsavedChangesDialog.description"),
								}),
							],
						}),
						_jsxs(AlertDialogFooter, {
							children: [
								_jsx(AlertDialogCancel, {
									onClick: () => onConfirmDialogResult(false),
									children: t("settings:unsavedChangesDialog.cancelButton"),
								}),
								_jsx(AlertDialogAction, {
									onClick: () => onConfirmDialogResult(true),
									children: t("settings:unsavedChangesDialog.discardButton"),
								}),
							],
						}),
					],
				}),
			}),
		],
	})
})
export default memo(SettingsView)
//# sourceMappingURL=SettingsView.js.map
