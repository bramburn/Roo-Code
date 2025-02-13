import React, { createContext, useContext, useEffect, useMemo } from "react"
import { ApiConfigMeta, ExtensionMessage, ExtensionState } from "../../../src/shared/ExtensionMessage"
import { ClineMessage } from "../../../src/shared/ExtensionMessage"
import {
	ApiConfiguration,
	ModelInfo,
	glamaDefaultModelId,
	glamaDefaultModelInfo,
	openRouterDefaultModelId,
	openRouterDefaultModelInfo,
	requestyDefaultModelId,
	requestyDefaultModelInfo,
} from "../../../src/shared/api"

import { convertTextMateToHljs } from "../utils/textMateToHljs"

import { McpServer } from "../../../src/shared/mcp"

import { Mode, CustomModePrompts, defaultModeSlug, defaultPrompts, ModeConfig } from "../../../src/shared/modes"
import { CustomSupportPrompts } from "../../../src/shared/support-prompt"
import { experimentDefault, ExperimentId } from "../../../src/shared/experiments"
import { useLocalState } from "../hooks/useLocalState"

export interface ExtensionStateContextType extends ExtensionState {
	didHydrateState: boolean
	showWelcome?: boolean
	theme?: any
	glamaModels?: Record<string, ModelInfo>
	requestyModels?: Record<string, ModelInfo>
	openRouterModels?: Record<string, ModelInfo>
	unboundModels?: Record<string, ModelInfo>
	openAiModels?: string[]
	mcpServers?: McpServer[]
	currentCheckpoint?: string
	filePaths?: string[]
	openedTabs?: Array<{ label: string; isActive: boolean; path?: string }>
	updateState: (changes: Partial<ExtensionState>) => void
	setApiConfiguration: (config: ApiConfiguration) => void
	setCustomInstructions: (value?: string) => void
	setAlwaysAllowReadOnly: (value: boolean) => void
	setAlwaysAllowWrite: (value: boolean) => void
	setAlwaysAllowExecute: (value: boolean) => void
	setAlwaysAllowBrowser: (value: boolean) => void
	setAlwaysAllowMcp: (value: boolean) => void
	setAlwaysAllowModeSwitch: (value: boolean) => void
	setShowAnnouncement: (value: boolean) => void
	setAllowedCommands: (value: string[]) => void
	setSoundEnabled: (value: boolean) => void
	setSoundVolume: (value: number) => void
	setDiffEnabled: (value: boolean) => void
	setCheckpointsEnabled: (value: boolean) => void
	preferredLanguage?: string
	setPreferredLanguage: (value: string) => void
	setWriteDelayMs: (value: number) => void
	screenshotQuality?: number
	setScreenshotQuality: (value: number) => void
	terminalOutputLineLimit?: number
	setTerminalOutputLineLimit: (value: number) => void
	mcpEnabled?: boolean
	setMcpEnabled: (value: boolean) => void
	enableMcpServerCreation?: boolean
	setEnableMcpServerCreation: (value: boolean) => void
	alwaysApproveResubmit?: boolean
	setAlwaysApproveResubmit: (value: boolean) => void
	requestDelaySeconds?: number
	setRequestDelaySeconds: (value: number) => void
	rateLimitSeconds?: number
	setRateLimitSeconds: (value: number) => void
	setCurrentApiConfigName: (value: string) => void
	setListApiConfigMeta: (value: ApiConfigMeta[]) => void
	onUpdateApiConfig: (apiConfig: ApiConfiguration) => void
	mode?: Mode
	setMode: (value: Mode) => void
	setCustomModePrompts: (value: CustomModePrompts) => void
	setCustomSupportPrompts: (value: CustomSupportPrompts) => void
	enhancementApiConfigId?: string
	setEnhancementApiConfigId: (value: string) => void
	setExperimentEnabled: (id: ExperimentId, enabled: boolean) => void
	setAutoApprovalEnabled: (value: boolean) => void
	handleInputChange: (field: keyof ApiConfiguration, softUpdate?: boolean) => (event: any) => void
	customModes?: ModeConfig[]
	setCustomModes: (value: ModeConfig[]) => void
	setBrowserViewportSize: (size: { width: number; height: number }) => void
	setFuzzyMatchThreshold: (threshold: number) => void
}

export const ExtensionStateContext = createContext<ExtensionStateContextType | undefined>(undefined)

export const ExtensionStateContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	// Initial state with default values
	const initialState: ExtensionState = {
		version: "",
		clineMessages: [],
		taskHistory: [],
		shouldShowAnnouncement: false,
		allowedCommands: [],
		soundEnabled: false,
		soundVolume: 0.5,
		diffEnabled: false,
		checkpointsEnabled: false,
		fuzzyMatchThreshold: 1.0,
		experiments: experimentDefault as Record<ExperimentId, boolean>,
		customModes: [],
		openedTabs: [],
		filePaths: [],
		glamaModels: {},
		requestyModels: {},
		openRouterModels: {},
		unboundModels: {},
		openAiModels: [],
		mcpServers: [],
		preferredLanguage: "English",
		writeDelayMs: 1000,
		browserViewportSize: "900x600",
		screenshotQuality: 100,
		terminalOutputLineLimit: 1000,
		mcpEnabled: false,
		enableMcpServerCreation: false,
		alwaysAllowModeSwitch: false,
		mode: defaultModeSlug,
		customModePrompts: defaultPrompts,
		customSupportPrompts: {},
		enhancementApiConfigId: "",
		autoApprovalEnabled: false,
	}

	// Use the new useLocalState hook
	const { localState, updateState, updateFromVscode } = useLocalState(initialState)

	// Message handling effect
	useEffect(() => {
		const handleMessage = (event: MessageEvent) => {
			const message: ExtensionMessage = event.data
			switch (message.type) {
				case "state":
					// Full state update from VS Code
					updateFromVscode(message.state || {})
					break
				case "partialMessage":
					// Partial state update, e.g., for chat messages
					if (message.partialMessage) {
						updateState({
							clineMessages: localState.clineMessages.map((msg: ClineMessage) =>
								msg.ts === message.partialMessage?.ts ? { ...msg, ...message.partialMessage } : msg,
							),
						})
					}
					break
				case "theme":
					if (message.text) {
						updateState({ theme: convertTextMateToHljs(JSON.parse(message.text)) })
					}
					break
				case "workspaceUpdated": {
					const paths = message.filePaths ?? []
					const tabs = message.openedTabs ?? []

					updateState({
						filePaths: paths,
						openedTabs: tabs,
					})
					break
				}
				case "glamaModels": {
					const updatedModels = message.glamaModels ?? {}
					updateState({
						glamaModels: {
							[glamaDefaultModelId]: glamaDefaultModelInfo, // in case the extension sent a model list without the default model
							...updatedModels,
						},
					})
					break
				}
				case "openRouterModels": {
					const updatedModels = message.openRouterModels ?? {}
					updateState({
						openRouterModels: {
							[openRouterDefaultModelId]: openRouterDefaultModelInfo, // in case the extension sent a model list without the default model
							...updatedModels,
						},
					})
					break
				}
				case "openAiModels": {
					const updatedModels = message.openAiModels ?? []
					updateState({
						openAiModels: updatedModels,
					})
					break
				}
				case "unboundModels": {
					const updatedModels = message.unboundModels ?? {}
					updateState({
						unboundModels: updatedModels,
					})
					break
				}
				case "requestyModels": {
					const updatedModels = message.requestyModels ?? {}
					updateState({
						requestyModels: {
							[requestyDefaultModelId]: requestyDefaultModelInfo, // in case the extension sent a model list without the default model
							...updatedModels,
						},
					})
					break
				}
				case "mcpServers": {
					updateState({
						mcpServers: message.mcpServers ?? [],
					})
					break
				}
				case "currentCheckpointUpdated": {
					updateState({
						currentCheckpoint: message.text,
					})
					break
				}
				case "listApiConfig": {
					updateState({
						listApiConfigMeta: message.listApiConfig ?? [],
					})
					break
				}
			}
		}

		window.addEventListener("message", handleMessage)
		return () => window.removeEventListener("message", handleMessage)
	}, [updateFromVscode, updateState, localState.clineMessages])

	// Memoized context value to prevent unnecessary re-renders
	const contextValue = useMemo<ExtensionStateContextType>(
		() => ({
			...localState,
			didHydrateState: true, // Placeholder, adjust as needed
			showWelcome: false, // Placeholder, adjust as needed
			theme: localState.theme, // Placeholder, adjust as needed
			glamaModels: localState.glamaModels,
			requestyModels: localState.requestyModels,
			openRouterModels: localState.openRouterModels,
			unboundModels: localState.unboundModels,
			openAiModels: localState.openAiModels,
			mcpServers: localState.mcpServers,
			currentCheckpoint: localState.currentCheckpoint,
			filePaths: localState.filePaths,
			openedTabs: localState.openedTabs,
			updateState,

			// Setter methods that use updateState
			setApiConfiguration: (config: ApiConfiguration) => updateState({ apiConfiguration: config }),
			setCustomInstructions: (value?: string) => {
				console.log("[DEBUG] setCustomInstructions called with:", value)
				updateState({ customInstructions: value === "" ? undefined : value })
			},
			setAlwaysAllowReadOnly: (value: boolean) => updateState({ alwaysAllowReadOnly: value }),
			setAlwaysAllowWrite: (value: boolean) => updateState({ alwaysAllowWrite: value }),
			setAlwaysAllowExecute: (value: boolean) => updateState({ alwaysAllowExecute: value }),
			setAlwaysAllowBrowser: (value: boolean) => updateState({ alwaysAllowBrowser: value }),
			setAlwaysAllowMcp: (value: boolean) => updateState({ alwaysAllowMcp: value }),
			setAlwaysAllowModeSwitch: (value: boolean) => updateState({ alwaysAllowModeSwitch: value }),
			setShowAnnouncement: (value: boolean) => updateState({ shouldShowAnnouncement: value }),
			setAllowedCommands: (value: string[]) => updateState({ allowedCommands: value }),
			setSoundEnabled: (value: boolean) => updateState({ soundEnabled: value }),
			setSoundVolume: (value: number) => updateState({ soundVolume: value }),
			setDiffEnabled: (value: boolean) => updateState({ diffEnabled: value }),
			setCheckpointsEnabled: (value: boolean) => updateState({ checkpointsEnabled: value }),
			setBrowserViewportSize: (size: { width: number; height: number }) =>
				updateState({ browserViewportSize: `${size.width}x${size.height}` }),
			setFuzzyMatchThreshold: (threshold: number) => updateState({ fuzzyMatchThreshold: threshold }),
			setPreferredLanguage: (value: string) => updateState({ preferredLanguage: value }),
			setWriteDelayMs: (value: number) => updateState({ writeDelayMs: value }),
			setScreenshotQuality: (value: number) => updateState({ screenshotQuality: value }),
			setTerminalOutputLineLimit: (value: number) => updateState({ terminalOutputLineLimit: value }),
			setMcpEnabled: (value: boolean) => updateState({ mcpEnabled: value }),
			setEnableMcpServerCreation: (value: boolean) => updateState({ enableMcpServerCreation: value }),
			setAlwaysApproveResubmit: (value: boolean) => updateState({ alwaysApproveResubmit: value }),
			setRequestDelaySeconds: (value: number) => updateState({ requestDelaySeconds: value }),
			setRateLimitSeconds: (value: number) => updateState({ rateLimitSeconds: value }),
			setCurrentApiConfigName: (value: string) => updateState({ currentApiConfigName: value }),
			setListApiConfigMeta: (value: ApiConfigMeta[]) => updateState({ listApiConfigMeta: value }),
			onUpdateApiConfig: (apiConfig: ApiConfiguration) => updateState({ apiConfiguration: apiConfig }),
			setMode: (value: Mode) => updateState({ mode: value }),
			setCustomModePrompts: (value: CustomModePrompts) => updateState({ customModePrompts: value }),
			setCustomSupportPrompts: (value: CustomSupportPrompts) => updateState({ customSupportPrompts: value }),
			setEnhancementApiConfigId: (value: string) => updateState({ enhancementApiConfigId: value }),
			setExperimentEnabled: (id: ExperimentId, enabled: boolean) =>
				updateState({
					experiments: {
						...localState.experiments,
						[id]: enabled,
					} as Record<ExperimentId, boolean>,
				}),
			setAutoApprovalEnabled: (value: boolean) => updateState({ autoApprovalEnabled: value }),
			handleInputChange:
				(field: keyof ApiConfiguration, softUpdate = false) =>
				(event: any) => {
					const value = event.target.value
					updateState({
						apiConfiguration: {
							...localState.apiConfiguration,
							[field]: value,
						},
					})
				},
			setCustomModes: (value: ModeConfig[]) => updateState({ customModes: value }),
			alwaysAllowModeSwitch: localState.alwaysAllowModeSwitch,
		}),
		[localState, updateState],
	)

	return <ExtensionStateContext.Provider value={contextValue}>{children}</ExtensionStateContext.Provider>
}

export const useExtensionState = () => {
	const context = useContext(ExtensionStateContext)
	if (!context) {
		throw new Error("useExtensionState must be used within an ExtensionStateContextProvider")
	}
	return context
}
