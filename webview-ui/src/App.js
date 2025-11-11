import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime"
import React, { useCallback, useEffect, useRef, useState, useMemo } from "react"
import { useEvent } from "react-use"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import TranslationProvider from "./i18n/TranslationContext"
import { MarketplaceViewStateManager } from "./components/marketplace/MarketplaceViewStateManager"
import { vscode } from "./utils/vscode"
import { telemetryClient } from "./utils/TelemetryClient"
import { TelemetryEventName } from "@roo-code/types"
import { initializeSourceMaps, exposeSourceMapsForDebugging } from "./utils/sourceMapInitializer"
import { ExtensionStateContextProvider, useExtensionState } from "./context/ExtensionStateContext"
import ChatView from "./components/chat/ChatView"
import HistoryView from "./components/history/HistoryView"
import SettingsView from "./components/settings/SettingsView"
import WelcomeView from "./components/welcome/WelcomeView"
import McpView from "./components/mcp/McpView"
import { MarketplaceView } from "./components/marketplace/MarketplaceView"
import ModesView from "./components/modes/ModesView"
import { HumanRelayDialog } from "./components/human-relay/HumanRelayDialog"
import { CheckpointRestoreDialog } from "./components/chat/CheckpointRestoreDialog"
import { DeleteMessageDialog, EditMessageDialog } from "./components/chat/MessageModificationConfirmationDialog"
import ErrorBoundary from "./components/ErrorBoundary"
import { CloudView } from "./components/cloud/CloudView"
import { useAddNonInteractiveClickListener } from "./components/ui/hooks/useNonInteractiveClick"
import { TooltipProvider } from "./components/ui/tooltip"
import { STANDARD_TOOLTIP_DELAY } from "./components/ui/standard-tooltip"
// Memoize dialog components to prevent unnecessary re-renders
const MemoizedDeleteMessageDialog = React.memo(DeleteMessageDialog)
const MemoizedEditMessageDialog = React.memo(EditMessageDialog)
const MemoizedCheckpointRestoreDialog = React.memo(CheckpointRestoreDialog)
const MemoizedHumanRelayDialog = React.memo(HumanRelayDialog)
const tabsByMessageAction = {
	chatButtonClicked: "chat",
	settingsButtonClicked: "settings",
	promptsButtonClicked: "modes",
	mcpButtonClicked: "mcp",
	historyButtonClicked: "history",
	marketplaceButtonClicked: "marketplace",
	cloudButtonClicked: "cloud",
}
const App = () => {
	const {
		didHydrateState,
		showWelcome,
		shouldShowAnnouncement,
		telemetrySetting,
		telemetryKey,
		machineId,
		cloudUserInfo,
		cloudIsAuthenticated,
		cloudApiUrl,
		cloudOrganizations,
		renderContext,
		mdmCompliant,
	} = useExtensionState()
	// Create a persistent state manager
	const marketplaceStateManager = useMemo(() => new MarketplaceViewStateManager(), [])
	const [showAnnouncement, setShowAnnouncement] = useState(false)
	const [tab, setTab] = useState("chat")
	const [humanRelayDialogState, setHumanRelayDialogState] = useState({
		isOpen: false,
		requestId: "",
		promptText: "",
	})
	const [deleteMessageDialogState, setDeleteMessageDialogState] = useState({
		isOpen: false,
		messageTs: 0,
		hasCheckpoint: false,
	})
	const [editMessageDialogState, setEditMessageDialogState] = useState({
		isOpen: false,
		messageTs: 0,
		text: "",
		hasCheckpoint: false,
		images: [],
	})
	const settingsRef = useRef(null)
	const chatViewRef = useRef(null)
	const switchTab = useCallback(
		(newTab) => {
			// Only check MDM compliance if mdmCompliant is explicitly false (meaning there's an MDM policy and user is non-compliant)
			// If mdmCompliant is undefined or true, allow tab switching
			if (mdmCompliant === false && newTab !== "cloud") {
				// Notify the user that authentication is required by their organization
				vscode.postMessage({ type: "showMdmAuthRequiredNotification" })
				return
			}
			setCurrentSection(undefined)
			setCurrentMarketplaceTab(undefined)
			if (settingsRef.current?.checkUnsaveChanges) {
				settingsRef.current.checkUnsaveChanges(() => setTab(newTab))
			} else {
				setTab(newTab)
			}
		},
		[mdmCompliant],
	)
	const [currentSection, setCurrentSection] = useState(undefined)
	const [currentMarketplaceTab, setCurrentMarketplaceTab] = useState(undefined)
	const onMessage = useCallback(
		(e) => {
			const message = e.data
			if (message.type === "action" && message.action) {
				// Handle switchTab action with tab parameter
				if (message.action === "switchTab" && message.tab) {
					const targetTab = message.tab
					switchTab(targetTab)
					// Extract targetSection from values if provided
					const targetSection = message.values?.section
					setCurrentSection(targetSection)
					setCurrentMarketplaceTab(undefined)
				} else {
					// Handle other actions using the mapping
					const newTab = tabsByMessageAction[message.action]
					const section = message.values?.section
					const marketplaceTab = message.values?.marketplaceTab
					if (newTab) {
						switchTab(newTab)
						setCurrentSection(section)
						setCurrentMarketplaceTab(marketplaceTab)
					}
				}
			}
			if (message.type === "showHumanRelayDialog" && message.requestId && message.promptText) {
				const { requestId, promptText } = message
				setHumanRelayDialogState({ isOpen: true, requestId, promptText })
			}
			if (message.type === "showDeleteMessageDialog" && message.messageTs) {
				setDeleteMessageDialogState({
					isOpen: true,
					messageTs: message.messageTs,
					hasCheckpoint: message.hasCheckpoint || false,
				})
			}
			if (message.type === "showEditMessageDialog" && message.messageTs && message.text) {
				setEditMessageDialogState({
					isOpen: true,
					messageTs: message.messageTs,
					text: message.text,
					hasCheckpoint: message.hasCheckpoint || false,
					images: message.images || [],
				})
			}
			if (message.type === "acceptInput") {
				chatViewRef.current?.acceptInput()
			}
		},
		[switchTab],
	)
	useEvent("message", onMessage)
	useEffect(() => {
		if (shouldShowAnnouncement && tab === "chat") {
			setShowAnnouncement(true)
			vscode.postMessage({ type: "didShowAnnouncement" })
		}
	}, [shouldShowAnnouncement, tab])
	useEffect(() => {
		if (didHydrateState) {
			telemetryClient.updateTelemetryState(telemetrySetting, telemetryKey, machineId)
		}
	}, [telemetrySetting, telemetryKey, machineId, didHydrateState])
	// Tell the extension that we are ready to receive messages.
	useEffect(() => vscode.postMessage({ type: "webviewDidLaunch" }), [])
	// Initialize source map support for better error reporting
	useEffect(() => {
		// Initialize source maps for better error reporting in production
		initializeSourceMaps()
		// Expose source map debugging utilities in production
		if (process.env.NODE_ENV === "production") {
			exposeSourceMapsForDebugging()
		}
		// Log initialization for debugging
		console.debug("App initialized with source map support")
	}, [])
	// Focus the WebView when non-interactive content is clicked (only in editor/tab mode)
	useAddNonInteractiveClickListener(
		useCallback(() => {
			// Only send focus request if we're in editor (tab) mode, not sidebar
			if (renderContext === "editor") {
				vscode.postMessage({ type: "focusPanelRequest" })
			}
		}, [renderContext]),
	)
	// Track marketplace tab views
	useEffect(() => {
		if (tab === "marketplace") {
			telemetryClient.capture(TelemetryEventName.MARKETPLACE_TAB_VIEWED)
		}
	}, [tab])
	if (!didHydrateState) {
		return null
	}
	// Do not conditionally load ChatView, it's expensive and there's state we
	// don't want to lose (user input, disableInput, askResponse promise, etc.)
	return showWelcome
		? _jsx(WelcomeView, {})
		: _jsxs(_Fragment, {
				children: [
					tab === "modes" && _jsx(ModesView, { onDone: () => switchTab("chat") }),
					tab === "mcp" && _jsx(McpView, { onDone: () => switchTab("chat") }),
					tab === "history" && _jsx(HistoryView, { onDone: () => switchTab("chat") }),
					tab === "settings" &&
						_jsx(SettingsView, {
							ref: settingsRef,
							onDone: () => setTab("chat"),
							targetSection: currentSection,
						}),
					tab === "marketplace" &&
						_jsx(MarketplaceView, {
							stateManager: marketplaceStateManager,
							onDone: () => switchTab("chat"),
							targetTab: currentMarketplaceTab,
						}),
					tab === "cloud" &&
						_jsx(CloudView, {
							userInfo: cloudUserInfo,
							isAuthenticated: cloudIsAuthenticated,
							cloudApiUrl: cloudApiUrl,
							organizations: cloudOrganizations,
							onDone: () => switchTab("chat"),
						}),
					_jsx(ChatView, {
						ref: chatViewRef,
						isHidden: tab !== "chat",
						showAnnouncement: showAnnouncement,
						hideAnnouncement: () => setShowAnnouncement(false),
					}),
					_jsx(MemoizedHumanRelayDialog, {
						isOpen: humanRelayDialogState.isOpen,
						requestId: humanRelayDialogState.requestId,
						promptText: humanRelayDialogState.promptText,
						onClose: () => setHumanRelayDialogState((prev) => ({ ...prev, isOpen: false })),
						onSubmit: (requestId, text) =>
							vscode.postMessage({ type: "humanRelayResponse", requestId, text }),
						onCancel: (requestId) => vscode.postMessage({ type: "humanRelayCancel", requestId }),
					}),
					deleteMessageDialogState.hasCheckpoint
						? _jsx(MemoizedCheckpointRestoreDialog, {
								open: deleteMessageDialogState.isOpen,
								type: "delete",
								hasCheckpoint: deleteMessageDialogState.hasCheckpoint,
								onOpenChange: (open) =>
									setDeleteMessageDialogState((prev) => ({ ...prev, isOpen: open })),
								onConfirm: (restoreCheckpoint) => {
									vscode.postMessage({
										type: "deleteMessageConfirm",
										messageTs: deleteMessageDialogState.messageTs,
										restoreCheckpoint,
									})
									setDeleteMessageDialogState((prev) => ({ ...prev, isOpen: false }))
								},
							})
						: _jsx(MemoizedDeleteMessageDialog, {
								open: deleteMessageDialogState.isOpen,
								onOpenChange: (open) =>
									setDeleteMessageDialogState((prev) => ({ ...prev, isOpen: open })),
								onConfirm: () => {
									vscode.postMessage({
										type: "deleteMessageConfirm",
										messageTs: deleteMessageDialogState.messageTs,
									})
									setDeleteMessageDialogState((prev) => ({ ...prev, isOpen: false }))
								},
							}),
					editMessageDialogState.hasCheckpoint
						? _jsx(MemoizedCheckpointRestoreDialog, {
								open: editMessageDialogState.isOpen,
								type: "edit",
								hasCheckpoint: editMessageDialogState.hasCheckpoint,
								onOpenChange: (open) =>
									setEditMessageDialogState((prev) => ({ ...prev, isOpen: open })),
								onConfirm: (restoreCheckpoint) => {
									vscode.postMessage({
										type: "editMessageConfirm",
										messageTs: editMessageDialogState.messageTs,
										text: editMessageDialogState.text,
										restoreCheckpoint,
									})
									setEditMessageDialogState((prev) => ({ ...prev, isOpen: false }))
								},
							})
						: _jsx(MemoizedEditMessageDialog, {
								open: editMessageDialogState.isOpen,
								onOpenChange: (open) =>
									setEditMessageDialogState((prev) => ({ ...prev, isOpen: open })),
								onConfirm: () => {
									vscode.postMessage({
										type: "editMessageConfirm",
										messageTs: editMessageDialogState.messageTs,
										text: editMessageDialogState.text,
										images: editMessageDialogState.images,
									})
									setEditMessageDialogState((prev) => ({ ...prev, isOpen: false }))
								},
							}),
				],
			})
}
const queryClient = new QueryClient()
const AppWithProviders = () =>
	_jsx(ErrorBoundary, {
		children: _jsx(ExtensionStateContextProvider, {
			children: _jsx(TranslationProvider, {
				children: _jsx(QueryClientProvider, {
					client: queryClient,
					children: _jsx(TooltipProvider, { delayDuration: STANDARD_TOOLTIP_DELAY, children: _jsx(App, {}) }),
				}),
			}),
		}),
	})
export default AppWithProviders
//# sourceMappingURL=App.js.map
