import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime"
import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import {
	VSCodeCheckbox,
	VSCodeRadioGroup,
	VSCodeRadio,
	VSCodeTextArea,
	VSCodeLink,
	VSCodeTextField,
} from "@vscode/webview-ui-toolkit/react"
import { Trans } from "react-i18next"
import { ChevronDown, X, Upload, Download } from "lucide-react"
import { modeConfigSchema } from "@roo-code/types"
import {
	getRoleDefinition,
	getWhenToUse,
	getDescription,
	getCustomInstructions,
	getAllModes,
	findModeBySlug as findCustomModeBySlug,
} from "@roo/modes"
import { TOOL_GROUPS } from "@roo/tools"
import { vscode } from "@src/utils/vscode"
import { buildDocLink } from "@src/utils/docLinks"
import { useAppTranslation } from "@src/i18n/TranslationContext"
import { useExtensionState } from "@src/context/ExtensionStateContext"
import { Tab, TabContent, TabHeader } from "@src/components/common/Tab"
import {
	Button,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Command,
	CommandInput,
	CommandList,
	CommandEmpty,
	CommandItem,
	CommandGroup,
	Input,
	StandardTooltip,
} from "@src/components/ui"
import { DeleteModeDialog } from "@src/components/modes/DeleteModeDialog"
import { useEscapeKey } from "@src/hooks/useEscapeKey"
// Get all available groups that should show in prompts view
const availableGroups = Object.keys(TOOL_GROUPS).filter((group) => !TOOL_GROUPS[group].alwaysAvailable)
// Helper to get group name regardless of format
function getGroupName(group) {
	return Array.isArray(group) ? group[0] : group
}
const ModesView = ({ onDone }) => {
	const { t } = useAppTranslation()
	const {
		customModePrompts,
		listApiConfigMeta,
		currentApiConfigName,
		mode,
		customInstructions,
		setCustomInstructions,
		customModes,
	} = useExtensionState()
	// Use a local state to track the visually active mode
	// This prevents flickering when switching modes rapidly by:
	// 1. Updating the UI immediately when a mode is clicked
	// 2. Not syncing with the backend mode state (which would cause flickering)
	// 3. Still sending the mode change to the backend for persistence
	const [visualMode, setVisualMode] = useState(mode)
	// Memoize modes to preserve array order
	const modes = useMemo(() => getAllModes(customModes), [customModes])
	const [isDialogOpen, setIsDialogOpen] = useState(false)
	const [selectedPromptContent, setSelectedPromptContent] = useState("")
	const [selectedPromptTitle, setSelectedPromptTitle] = useState("")
	const [isToolsEditMode, setIsToolsEditMode] = useState(false)
	const [showConfigMenu, setShowConfigMenu] = useState(false)
	const [isCreateModeDialogOpen, setIsCreateModeDialogOpen] = useState(false)
	const [isSystemPromptDisclosureOpen, setIsSystemPromptDisclosureOpen] = useState(false)
	const [isExporting, setIsExporting] = useState(false)
	const [isImporting, setIsImporting] = useState(false)
	const [showImportDialog, setShowImportDialog] = useState(false)
	const [hasRulesToExport, setHasRulesToExport] = useState({})
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
	const [modeToDelete, setModeToDelete] = useState(null)
	// State for mode selection popover and search
	const [open, setOpen] = useState(false)
	const [searchValue, setSearchValue] = useState("")
	const searchInputRef = useRef(null)
	// Local state for mode name input to allow visual emptying
	const [localModeName, setLocalModeName] = useState("")
	const [currentEditingModeSlug, setCurrentEditingModeSlug] = useState(null)
	// Direct update functions
	const updateAgentPrompt = useCallback(
		(mode, promptData) => {
			const existingPrompt = customModePrompts?.[mode]
			const updatedPrompt = { ...existingPrompt, ...promptData }
			// Only include properties that differ from defaults
			if (updatedPrompt.roleDefinition === getRoleDefinition(mode)) {
				delete updatedPrompt.roleDefinition
			}
			if (updatedPrompt.description === getDescription(mode)) {
				delete updatedPrompt.description
			}
			if (updatedPrompt.whenToUse === getWhenToUse(mode)) {
				delete updatedPrompt.whenToUse
			}
			vscode.postMessage({
				type: "updatePrompt",
				promptMode: mode,
				customPrompt: updatedPrompt,
			})
		},
		[customModePrompts],
	)
	const updateCustomMode = useCallback((slug, modeConfig) => {
		const source = modeConfig.source || "global"
		vscode.postMessage({
			type: "updateCustomMode",
			slug,
			modeConfig: {
				...modeConfig,
				source, // Ensure source is set
			},
		})
	}, [])
	// Helper function to find a mode by slug
	const findModeBySlug = useCallback((searchSlug, modes) => {
		return findCustomModeBySlug(searchSlug, modes)
	}, [])
	const switchMode = useCallback((slug) => {
		vscode.postMessage({
			type: "mode",
			text: slug,
		})
	}, [])
	// Handle mode switching with explicit state initialization
	const handleModeSwitch = useCallback(
		(modeConfig) => {
			if (modeConfig.slug === visualMode) return // Prevent unnecessary updates
			// Immediately update visual state for instant feedback
			setVisualMode(modeConfig.slug)
			// Then send the mode change message to the backend
			switchMode(modeConfig.slug)
			// Exit tools edit mode when switching modes
			setIsToolsEditMode(false)
		},
		[visualMode, switchMode],
	)
	// Handler for popover open state change
	const onOpenChange = useCallback((open) => {
		setOpen(open)
		// Reset search when closing the popover
		if (!open) {
			setTimeout(() => setSearchValue(""), 100)
		}
	}, [])
	// Use the shared ESC key handler hook
	useEscapeKey(open, () => setOpen(false))
	// Handler for clearing search input
	const onClearSearch = useCallback(() => {
		setSearchValue("")
		searchInputRef.current?.focus()
	}, [])
	// Helper function to get current mode's config
	const getCurrentMode = useCallback(() => {
		const findMode = (m) => m.slug === visualMode
		return customModes?.find(findMode) || modes.find(findMode)
	}, [visualMode, customModes, modes])
	// Check if the current mode has rules to export
	const checkRulesDirectory = useCallback((slug) => {
		vscode.postMessage({
			type: "checkRulesDirectory",
			slug: slug,
		})
	}, [])
	// Check rules directory when mode changes
	useEffect(() => {
		const currentMode = getCurrentMode()
		if (currentMode?.slug && hasRulesToExport[currentMode.slug] === undefined) {
			checkRulesDirectory(currentMode.slug)
		}
	}, [getCurrentMode, checkRulesDirectory, hasRulesToExport])
	// Reset local name state when mode changes
	useEffect(() => {
		if (currentEditingModeSlug && currentEditingModeSlug !== visualMode) {
			setCurrentEditingModeSlug(null)
			setLocalModeName("")
		}
	}, [visualMode, currentEditingModeSlug])
	// Helper function to safely access mode properties
	const getModeProperty = (mode, property) => {
		return mode?.[property]
	}
	// State for create mode dialog
	const [newModeName, setNewModeName] = useState("")
	const [newModeSlug, setNewModeSlug] = useState("")
	const [newModeDescription, setNewModeDescription] = useState("")
	const [newModeRoleDefinition, setNewModeRoleDefinition] = useState("")
	const [newModeWhenToUse, setNewModeWhenToUse] = useState("")
	const [newModeCustomInstructions, setNewModeCustomInstructions] = useState("")
	const [newModeGroups, setNewModeGroups] = useState(availableGroups)
	const [newModeSource, setNewModeSource] = useState("global")
	// Field-specific error states
	const [nameError, setNameError] = useState("")
	const [slugError, setSlugError] = useState("")
	const [descriptionError, setDescriptionError] = useState("")
	const [roleDefinitionError, setRoleDefinitionError] = useState("")
	const [groupsError, setGroupsError] = useState("")
	// Helper to reset form state
	const resetFormState = useCallback(() => {
		// Reset form fields
		setNewModeName("")
		setNewModeSlug("")
		setNewModeDescription("")
		setNewModeGroups(availableGroups)
		setNewModeRoleDefinition("")
		setNewModeWhenToUse("")
		setNewModeCustomInstructions("")
		setNewModeSource("global")
		// Reset error states
		setNameError("")
		setSlugError("")
		setDescriptionError("")
		setRoleDefinitionError("")
		setGroupsError("")
	}, [])
	// Reset form fields when dialog opens
	useEffect(() => {
		if (isCreateModeDialogOpen) {
			resetFormState()
		}
	}, [isCreateModeDialogOpen, resetFormState])
	// Helper function to generate a unique slug from a name
	const generateSlug = useCallback((name, attempt = 0) => {
		const baseSlug = name
			.toLowerCase()
			.replace(/[^a-z0-9-]+/g, "-")
			.replace(/^-+|-+$/g, "")
		return attempt === 0 ? baseSlug : `${baseSlug}-${attempt}`
	}, [])
	// Handler for name changes
	const handleNameChange = useCallback(
		(name) => {
			setNewModeName(name)
			setNewModeSlug(generateSlug(name))
		},
		[generateSlug],
	)
	const handleCreateMode = useCallback(() => {
		// Clear previous errors
		setNameError("")
		setSlugError("")
		setDescriptionError("")
		setRoleDefinitionError("")
		setGroupsError("")
		const source = newModeSource
		const newMode = {
			slug: newModeSlug,
			name: newModeName,
			description: newModeDescription.trim() || undefined,
			roleDefinition: newModeRoleDefinition.trim(),
			whenToUse: newModeWhenToUse.trim() || undefined,
			customInstructions: newModeCustomInstructions.trim() || undefined,
			groups: newModeGroups,
			source,
		}
		// Validate the mode against the schema
		const result = modeConfigSchema.safeParse(newMode)
		if (!result.success) {
			// Map Zod errors to specific fields
			result.error.errors.forEach((error) => {
				const field = error.path[0]
				const message = error.message
				switch (field) {
					case "name":
						setNameError(message)
						break
					case "slug":
						setSlugError(message)
						break
					case "description":
						setDescriptionError(message)
						break
					case "roleDefinition":
						setRoleDefinitionError(message)
						break
					case "groups":
						setGroupsError(message)
						break
				}
			})
			return
		}
		updateCustomMode(newModeSlug, newMode)
		switchMode(newModeSlug)
		setIsCreateModeDialogOpen(false)
		resetFormState()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		newModeName,
		newModeSlug,
		newModeDescription,
		newModeRoleDefinition,
		newModeWhenToUse, // Add whenToUse dependency
		newModeCustomInstructions,
		newModeGroups,
		newModeSource,
		updateCustomMode,
	])
	const isNameOrSlugTaken = useCallback(
		(name, slug) => {
			return modes.some((m) => m.slug === slug || m.name === name)
		},
		[modes],
	)
	const openCreateModeDialog = useCallback(() => {
		const baseNamePrefix = "New Custom Mode"
		// Find unique name and slug
		let attempt = 0
		let name = baseNamePrefix
		let slug = generateSlug(name)
		while (isNameOrSlugTaken(name, slug)) {
			attempt++
			name = `${baseNamePrefix} ${attempt + 1}`
			slug = generateSlug(name)
		}
		setNewModeName(name)
		setNewModeSlug(slug)
		setIsCreateModeDialogOpen(true)
	}, [generateSlug, isNameOrSlugTaken])
	// Handler for group checkbox changes
	const handleGroupChange = useCallback(
		(group, isCustomMode, customMode) => (e) => {
			if (!isCustomMode) return // Prevent changes to built-in modes
			const target = e?.detail?.target || e.target
			const checked = target.checked
			const oldGroups = customMode?.groups || []
			let newGroups
			if (checked) {
				newGroups = [...oldGroups, group]
			} else {
				newGroups = oldGroups.filter((g) => getGroupName(g) !== group)
			}
			if (customMode) {
				const source = customMode.source || "global"
				updateCustomMode(customMode.slug, {
					...customMode,
					groups: newGroups,
					source,
				})
			}
		},
		[updateCustomMode],
	)
	// Handle clicks outside the config menu
	useEffect(() => {
		const handleClickOutside = () => {
			if (showConfigMenu) {
				setShowConfigMenu(false)
			}
		}
		document.addEventListener("click", handleClickOutside)
		return () => document.removeEventListener("click", handleClickOutside)
	}, [showConfigMenu])
	// Use a ref to store the current modeToDelete value
	const modeToDeleteRef = useRef(modeToDelete)
	// Update the ref whenever modeToDelete changes
	useEffect(() => {
		modeToDeleteRef.current = modeToDelete
	}, [modeToDelete])
	useEffect(() => {
		const handler = (event) => {
			const message = event.data
			if (message.type === "systemPrompt") {
				if (message.text) {
					setSelectedPromptContent(message.text)
					setSelectedPromptTitle(`System Prompt (${message.mode} mode)`)
					setIsDialogOpen(true)
				}
			} else if (message.type === "exportModeResult") {
				setIsExporting(false)
				if (!message.success) {
					// Show error message
					console.error("Failed to export mode:", message.error)
				}
			} else if (message.type === "importModeResult") {
				setIsImporting(false)
				setShowImportDialog(false)
				if (!message.success) {
					// Only log error if it's not a cancellation
					if (message.error !== "cancelled") {
						console.error("Failed to import mode:", message.error)
					}
				}
			} else if (message.type === "checkRulesDirectoryResult") {
				setHasRulesToExport((prev) => ({
					...prev,
					[message.slug]: message.hasContent,
				}))
			} else if (message.type === "deleteCustomModeCheck") {
				// Handle the check response
				// Use the ref to get the current modeToDelete value
				const currentModeToDelete = modeToDeleteRef.current
				if (message.slug && currentModeToDelete && currentModeToDelete.slug === message.slug) {
					setModeToDelete({
						...currentModeToDelete,
						rulesFolderPath: message.rulesFolderPath,
					})
					setShowDeleteConfirm(true)
				}
			}
		}
		window.addEventListener("message", handler)
		return () => window.removeEventListener("message", handler)
	}, []) // Empty dependency array - only register once
	const handleAgentReset = (modeSlug, type) => {
		// Only reset for built-in modes
		const existingPrompt = customModePrompts?.[modeSlug]
		const updatedPrompt = { ...existingPrompt }
		delete updatedPrompt[type] // Remove the field entirely to ensure it reloads from defaults
		vscode.postMessage({
			type: "updatePrompt",
			promptMode: modeSlug,
			customPrompt: updatedPrompt,
		})
	}
	return _jsxs(Tab, {
		children: [
			_jsxs(TabHeader, {
				className: "flex justify-between items-center",
				children: [
					_jsx("h3", { className: "text-vscode-foreground m-0", children: t("prompts:title") }),
					_jsx(Button, { onClick: onDone, children: t("prompts:done") }),
				],
			}),
			_jsxs(TabContent, {
				children: [
					_jsxs("div", {
						children: [
							_jsxs("div", {
								onClick: (e) => e.stopPropagation(),
								className: "flex justify-between items-center mb-3",
								children: [
									_jsx("h3", {
										className: "text-vscode-foreground m-0",
										children: t("prompts:modes.title"),
									}),
									_jsxs("div", {
										className: "flex gap-2",
										children: [
											_jsx(StandardTooltip, {
												content: t("prompts:modes.createNewMode"),
												children: _jsx(Button, {
													variant: "ghost",
													size: "icon",
													onClick: openCreateModeDialog,
													children: _jsx("span", { className: "codicon codicon-add" }),
												}),
											}),
											_jsxs("div", {
												className: "relative inline-block",
												children: [
													_jsx(StandardTooltip, {
														content: t("prompts:modes.editModesConfig"),
														children: _jsx(Button, {
															variant: "ghost",
															size: "icon",
															className: "flex",
															onClick: (e) => {
																e.preventDefault()
																e.stopPropagation()
																setShowConfigMenu((prev) => !prev)
															},
															onBlur: () => {
																// Add slight delay to allow menu item clicks to register
																setTimeout(() => setShowConfigMenu(false), 200)
															},
															children: _jsx("span", {
																className: "codicon codicon-json",
															}),
														}),
													}),
													showConfigMenu &&
														_jsxs("div", {
															onClick: (e) => e.stopPropagation(),
															onMouseDown: (e) => e.stopPropagation(),
															className:
																"absolute top-full right-0 w-[200px] mt-1 bg-vscode-editor-background border border-vscode-input-border rounded shadow-md z-[1000]",
															children: [
																_jsx("div", {
																	className:
																		"p-2 cursor-pointer text-vscode-foreground text-sm",
																	onMouseDown: (e) => {
																		e.preventDefault() // Prevent blur
																		vscode.postMessage({
																			type: "openCustomModesSettings",
																		})
																		setShowConfigMenu(false)
																	},
																	onClick: (e) => e.preventDefault(),
																	children: t("prompts:modes.editGlobalModes"),
																}),
																_jsx("div", {
																	className:
																		"p-2 cursor-pointer text-vscode-foreground text-sm border-t border-vscode-input-border",
																	onMouseDown: (e) => {
																		e.preventDefault() // Prevent blur
																		vscode.postMessage({
																			type: "openFile",
																			text: "./.roomodes",
																			values: {
																				create: true,
																				content: JSON.stringify(
																					{ customModes: [] },
																					null,
																					2,
																				),
																			},
																		})
																		setShowConfigMenu(false)
																	},
																	onClick: (e) => e.preventDefault(),
																	children: t("prompts:modes.editProjectModes"),
																}),
															],
														}),
												],
											}),
											_jsx(StandardTooltip, {
												content: t("chat:modeSelector.marketplace"),
												children: _jsx(Button, {
													variant: "ghost",
													size: "icon",
													onClick: () => {
														window.postMessage(
															{
																type: "action",
																action: "marketplaceButtonClicked",
																values: { marketplaceTab: "mode" },
															},
															"*",
														)
													},
													children: _jsx("span", { className: "codicon codicon-extensions" }),
												}),
											}),
										],
									}),
								],
							}),
							_jsx("div", {
								className: "text-sm text-vscode-descriptionForeground mb-3",
								children: _jsxs(Trans, {
									i18nKey: "prompts:modes.createModeHelpText",
									children: [
										_jsx(VSCodeLink, {
											href: buildDocLink("basic-usage/using-modes", "prompts_view_modes"),
											style: { display: "inline" },
											"aria-label": "Learn about using modes",
										}),
										_jsx(VSCodeLink, {
											href: buildDocLink("features/custom-modes", "prompts_view_modes"),
											style: { display: "inline" },
											"aria-label": "Learn about customizing modes",
										}),
									],
								}),
							}),
							_jsx("div", {
								className: "flex items-center gap-1 mb-3",
								children: _jsxs(Popover, {
									open: open,
									onOpenChange: onOpenChange,
									children: [
										_jsx(PopoverTrigger, {
											asChild: true,
											children: _jsxs(Button, {
												variant: "combobox",
												role: "combobox",
												"aria-expanded": open,
												className: "justify-between w-full",
												"data-testid": "mode-select-trigger",
												children: [
													_jsx("div", {
														className: "truncate",
														children:
															getCurrentMode()?.name || t("prompts:modes.selectMode"),
													}),
													_jsx(ChevronDown, { className: "opacity-50" }),
												],
											}),
										}),
										_jsx(PopoverContent, {
											className: "p-0 w-[var(--radix-popover-trigger-width)]",
											children: _jsxs(Command, {
												children: [
													_jsxs("div", {
														className: "relative",
														children: [
															_jsx(CommandInput, {
																ref: searchInputRef,
																value: searchValue,
																onValueChange: setSearchValue,
																placeholder: t("prompts:modes.selectMode"),
																className: "h-9 mr-4",
																"data-testid": "mode-search-input",
															}),
															searchValue.length > 0 &&
																_jsx("div", {
																	className:
																		"absolute right-2 top-0 bottom-0 flex items-center justify-center",
																	children: _jsx(X, {
																		className:
																			"text-vscode-input-foreground opacity-50 hover:opacity-100 size-4 p-0.5 cursor-pointer",
																		onClick: onClearSearch,
																	}),
																}),
														],
													}),
													_jsxs(CommandList, {
														children: [
															_jsx(CommandEmpty, {
																children:
																	searchValue &&
																	_jsx("div", {
																		className: "py-2 px-1 text-sm",
																		children: t("prompts:modes.noMatchFound"),
																	}),
															}),
															_jsx(CommandGroup, {
																children: modes
																	.filter((modeConfig) =>
																		searchValue
																			? modeConfig.name
																					.toLowerCase()
																					.includes(searchValue.toLowerCase())
																			: true,
																	)
																	.map((modeConfig) =>
																		_jsx(
																			CommandItem,
																			{
																				value: modeConfig.slug,
																				onSelect: () => {
																					handleModeSwitch(modeConfig)
																					setOpen(false)
																				},
																				"data-testid": `mode-option-${modeConfig.slug}`,
																				children: _jsxs("div", {
																					className:
																						"flex items-center justify-between w-full",
																					children: [
																						_jsx("span", {
																							style: {
																								whiteSpace: "nowrap",
																								overflow: "hidden",
																								textOverflow:
																									"ellipsis",
																								flex: 2,
																								minWidth: 0,
																							},
																							children: modeConfig.name,
																						}),
																						_jsx("span", {
																							className:
																								"text-foreground",
																							style: {
																								whiteSpace: "nowrap",
																								overflow: "hidden",
																								textOverflow:
																									"ellipsis",
																								direction: "rtl",
																								textAlign: "right",
																								flex: 1,
																								minWidth: 0,
																								marginLeft: "0.5em",
																							},
																							children: modeConfig.slug,
																						}),
																					],
																				}),
																			},
																			modeConfig.slug,
																		),
																	),
															}),
														],
													}),
												],
											}),
										}),
									],
								}),
							}),
							_jsxs("div", {
								className: "mb-3",
								children: [
									_jsx("div", {
										className: "font-bold mb-1",
										children: t("prompts:apiConfiguration.title"),
									}),
									_jsx("div", {
										className: "text-sm text-vscode-descriptionForeground mb-2",
										children: t("prompts:apiConfiguration.select"),
									}),
									_jsx("div", {
										className: "mb-2",
										children: _jsxs(Select, {
											value: currentApiConfigName,
											onValueChange: (value) => {
												vscode.postMessage({
													type: "loadApiConfiguration",
													text: value,
												})
											},
											children: [
												_jsx(SelectTrigger, {
													className: "w-full",
													children: _jsx(SelectValue, {
														placeholder: t("settings:common.select"),
													}),
												}),
												_jsx(SelectContent, {
													children: (listApiConfigMeta || []).map((config) =>
														_jsx(
															SelectItem,
															{ value: config.name, children: config.name },
															config.id,
														),
													),
												}),
											],
										}),
									}),
								],
							}),
						],
					}),
					_jsxs("div", {
						className: "mb-5",
						children: [
							visualMode &&
								findModeBySlug(visualMode, customModes) &&
								_jsx("div", {
									className: "flex gap-3 mb-4",
									children: _jsxs("div", {
										className: "flex-1",
										children: [
											_jsx("div", {
												className: "font-bold mb-1",
												children: t("prompts:createModeDialog.name.label"),
											}),
											_jsxs("div", {
												className: "flex gap-2",
												children: [
													_jsx(Input, {
														type: "text",
														value:
															currentEditingModeSlug === visualMode
																? localModeName
																: (getModeProperty(
																		findModeBySlug(visualMode, customModes),
																		"name",
																	) ?? ""),
														onFocus: () => {
															const customMode = findModeBySlug(visualMode, customModes)
															if (customMode) {
																setCurrentEditingModeSlug(visualMode)
																setLocalModeName(customMode.name)
															}
														},
														onChange: (e) => {
															const newName = e.target.value
															// Allow users to type freely, including emptying the field
															setLocalModeName(newName)
														},
														onBlur: () => {
															const customMode = findModeBySlug(visualMode, customModes)
															if (customMode) {
																const trimmedName = localModeName.trim()
																// Only update if the name is not empty
																if (trimmedName) {
																	updateCustomMode(visualMode, {
																		...customMode,
																		name: trimmedName,
																		source: customMode.source || "global",
																	})
																} else {
																	// Revert to the original name if empty
																	setLocalModeName(customMode.name)
																}
															}
															// Clear the editing state
															setCurrentEditingModeSlug(null)
														},
														className: "w-full",
													}),
													_jsx(StandardTooltip, {
														content: t("prompts:createModeDialog.deleteMode"),
														children: _jsx(Button, {
															variant: "ghost",
															size: "icon",
															onClick: () => {
																const customMode = findModeBySlug(
																	visualMode,
																	customModes,
																)
																if (customMode) {
																	setModeToDelete({
																		slug: customMode.slug,
																		name: customMode.name,
																		source: customMode.source || "global",
																	})
																	// First check if rules folder exists
																	vscode.postMessage({
																		type: "deleteCustomMode",
																		slug: customMode.slug,
																		checkOnly: true,
																	})
																}
															},
															children: _jsx("span", {
																className: "codicon codicon-trash",
															}),
														}),
													}),
												],
											}),
										],
									}),
								}),
							_jsxs("div", {
								className: "mb-4",
								children: [
									_jsxs("div", {
										className: "flex justify-between items-center mb-1",
										children: [
											_jsx("div", {
												className: "font-bold",
												children: t("prompts:roleDefinition.title"),
											}),
											!findModeBySlug(visualMode, customModes) &&
												_jsx(StandardTooltip, {
													content: t("prompts:roleDefinition.resetToDefault"),
													children: _jsx(Button, {
														variant: "ghost",
														size: "icon",
														onClick: () => {
															const currentMode = getCurrentMode()
															if (currentMode?.slug) {
																handleAgentReset(currentMode.slug, "roleDefinition")
															}
														},
														"data-testid": "role-definition-reset",
														children: _jsx("span", {
															className: "codicon codicon-discard",
														}),
													}),
												}),
										],
									}),
									_jsx("div", {
										className: "text-sm text-vscode-descriptionForeground mb-2",
										children: t("prompts:roleDefinition.description"),
									}),
									_jsx(VSCodeTextArea, {
										resize: "vertical",
										value: (() => {
											const customMode = findModeBySlug(visualMode, customModes)
											const prompt = customModePrompts?.[visualMode]
											return (
												customMode?.roleDefinition ??
												prompt?.roleDefinition ??
												getRoleDefinition(visualMode)
											)
										})(),
										onChange: (e) => {
											const value = e?.detail?.target?.value ?? e.target.value
											const customMode = findModeBySlug(visualMode, customModes)
											if (customMode) {
												// For custom modes, update the JSON file
												updateCustomMode(visualMode, {
													...customMode,
													roleDefinition: value.trim() || "",
													source: customMode.source || "global",
												})
											} else {
												// For built-in modes, update the prompts
												updateAgentPrompt(visualMode, {
													roleDefinition: value.trim() || undefined,
												})
											}
										},
										className: "w-full",
										rows: 5,
										"data-testid": `${getCurrentMode()?.slug || "code"}-prompt-textarea`,
									}),
								],
							}),
							_jsxs("div", {
								className: "mb-4",
								children: [
									_jsxs("div", {
										className: "flex justify-between items-center mb-1",
										children: [
											_jsx("div", {
												className: "font-bold",
												children: t("prompts:description.title"),
											}),
											!findModeBySlug(visualMode, customModes) &&
												_jsx(StandardTooltip, {
													content: t("prompts:description.resetToDefault"),
													children: _jsx(Button, {
														variant: "ghost",
														size: "icon",
														onClick: () => {
															const currentMode = getCurrentMode()
															if (currentMode?.slug) {
																handleAgentReset(currentMode.slug, "description")
															}
														},
														"data-testid": "description-reset",
														children: _jsx("span", {
															className: "codicon codicon-discard",
														}),
													}),
												}),
										],
									}),
									_jsx("div", {
										className: "text-sm text-vscode-descriptionForeground mb-2",
										children: t("prompts:description.description"),
									}),
									_jsx(VSCodeTextField, {
										value: (() => {
											const customMode = findModeBySlug(visualMode, customModes)
											const prompt = customModePrompts?.[visualMode]
											return (
												customMode?.description ??
												prompt?.description ??
												getDescription(visualMode)
											)
										})(),
										onChange: (e) => {
											const value = e?.detail?.target?.value ?? e.target.value
											const customMode = findModeBySlug(visualMode, customModes)
											if (customMode) {
												// For custom modes, update the JSON file
												updateCustomMode(visualMode, {
													...customMode,
													description: value.trim() || undefined,
													source: customMode.source || "global",
												})
											} else {
												// For built-in modes, update the prompts
												updateAgentPrompt(visualMode, {
													description: value.trim() || undefined,
												})
											}
										},
										className: "w-full",
										"data-testid": `${getCurrentMode()?.slug || "code"}-description-textfield`,
									}),
								],
							}),
							_jsxs("div", {
								className: "mb-4",
								children: [
									_jsxs("div", {
										className: "flex justify-between items-center mb-1",
										children: [
											_jsx("div", {
												className: "font-bold",
												children: t("prompts:whenToUse.title"),
											}),
											!findModeBySlug(visualMode, customModes) &&
												_jsx(StandardTooltip, {
													content: t("prompts:whenToUse.resetToDefault"),
													children: _jsx(Button, {
														variant: "ghost",
														size: "icon",
														onClick: () => {
															const currentMode = getCurrentMode()
															if (currentMode?.slug) {
																handleAgentReset(currentMode.slug, "whenToUse")
															}
														},
														"data-testid": "when-to-use-reset",
														children: _jsx("span", {
															className: "codicon codicon-discard",
														}),
													}),
												}),
										],
									}),
									_jsx("div", {
										className: "text-sm text-vscode-descriptionForeground mb-2",
										children: t("prompts:whenToUse.description"),
									}),
									_jsx(VSCodeTextArea, {
										resize: "vertical",
										value: (() => {
											const customMode = findModeBySlug(visualMode, customModes)
											const prompt = customModePrompts?.[visualMode]
											return (
												customMode?.whenToUse ?? prompt?.whenToUse ?? getWhenToUse(visualMode)
											)
										})(),
										onChange: (e) => {
											const value = e?.detail?.target?.value ?? e.target.value
											const customMode = findModeBySlug(visualMode, customModes)
											if (customMode) {
												// For custom modes, update the JSON file
												updateCustomMode(visualMode, {
													...customMode,
													whenToUse: value.trim() || undefined,
													source: customMode.source || "global",
												})
											} else {
												// For built-in modes, update the prompts
												updateAgentPrompt(visualMode, {
													whenToUse: value.trim() || undefined,
												})
											}
										},
										className: "w-full",
										rows: 4,
										"data-testid": `${getCurrentMode()?.slug || "code"}-when-to-use-textarea`,
									}),
								],
							}),
							_jsx(_Fragment, {
								children: _jsxs("div", {
									className: "mb-4",
									children: [
										_jsxs("div", {
											className: "flex justify-between items-center mb-1",
											children: [
												_jsx("div", {
													className: "font-bold",
													children: t("prompts:tools.title"),
												}),
												findModeBySlug(visualMode, customModes) &&
													_jsx(StandardTooltip, {
														content: isToolsEditMode
															? t("prompts:tools.doneEditing")
															: t("prompts:tools.editTools"),
														children: _jsx(Button, {
															variant: "ghost",
															size: "icon",
															onClick: () => setIsToolsEditMode(!isToolsEditMode),
															children: _jsx("span", {
																className: `codicon codicon-${isToolsEditMode ? "check" : "edit"}`,
															}),
														}),
													}),
											],
										}),
										!findModeBySlug(visualMode, customModes) &&
											_jsx("div", {
												className: "text-sm text-vscode-descriptionForeground mb-2",
												children: t("prompts:tools.builtInModesText"),
											}),
										isToolsEditMode && findModeBySlug(visualMode, customModes)
											? _jsx("div", {
													className:
														"grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-2",
													children: availableGroups.map((group) => {
														const currentMode = getCurrentMode()
														const isCustomMode = findModeBySlug(visualMode, customModes)
														const customMode = isCustomMode
														const isGroupEnabled = isCustomMode
															? customMode?.groups?.some((g) => getGroupName(g) === group)
															: currentMode?.groups?.some(
																	(g) => getGroupName(g) === group,
																)
														return _jsxs(
															VSCodeCheckbox,
															{
																checked: isGroupEnabled,
																onChange: handleGroupChange(
																	group,
																	Boolean(isCustomMode),
																	customMode,
																),
																disabled: !isCustomMode,
																children: [
																	t(`prompts:tools.toolNames.${group}`),
																	group === "edit" &&
																		_jsxs("div", {
																			className:
																				"text-xs text-vscode-descriptionForeground mt-0.5",
																			children: [
																				t("prompts:tools.allowedFiles"),
																				" ",
																				(() => {
																					const currentMode = getCurrentMode()
																					const editGroup =
																						currentMode?.groups?.find(
																							(g) =>
																								Array.isArray(g) &&
																								g[0] === "edit" &&
																								g[1]?.fileRegex,
																						)
																					if (!Array.isArray(editGroup))
																						return t("prompts:allFiles")
																					return (
																						editGroup[1].description ||
																						`/${editGroup[1].fileRegex}/`
																					)
																				})(),
																			],
																		}),
																],
															},
															group,
														)
													}),
												})
											: _jsx("div", {
													className: "text-sm text-vscode-foreground mb-2 leading-relaxed",
													children: (() => {
														const currentMode = getCurrentMode()
														const enabledGroups = currentMode?.groups || []
														// If there are no enabled groups, display translated "None"
														if (enabledGroups.length === 0) {
															return t("prompts:tools.noTools")
														}
														return enabledGroups
															.map((group) => {
																const groupName = getGroupName(group)
																const displayName = t(
																	`prompts:tools.toolNames.${groupName}`,
																)
																if (Array.isArray(group) && group[1]?.fileRegex) {
																	const description =
																		group[1].description ||
																		`/${group[1].fileRegex}/`
																	return `${displayName} (${description})`
																}
																return displayName
															})
															.join(", ")
													})(),
												}),
									],
								}),
							}),
							_jsxs("div", {
								className: "mb-2",
								children: [
									_jsxs("div", {
										className: "flex justify-between items-center mb-1",
										children: [
											_jsx("div", {
												className: "font-bold",
												children: t("prompts:customInstructions.title"),
											}),
											!findModeBySlug(visualMode, customModes) &&
												_jsx(StandardTooltip, {
													content: t("prompts:customInstructions.resetToDefault"),
													children: _jsx(Button, {
														variant: "ghost",
														size: "icon",
														onClick: () => {
															const currentMode = getCurrentMode()
															if (currentMode?.slug) {
																handleAgentReset(currentMode.slug, "customInstructions")
															}
														},
														"data-testid": "custom-instructions-reset",
														children: _jsx("span", {
															className: "codicon codicon-discard",
														}),
													}),
												}),
										],
									}),
									_jsx("div", {
										className: "text-[13px] text-vscode-descriptionForeground mb-2",
										children: t("prompts:customInstructions.description", {
											modeName: getCurrentMode()?.name || "Code",
										}),
									}),
									_jsx(VSCodeTextArea, {
										resize: "vertical",
										value: (() => {
											const customMode = findModeBySlug(visualMode, customModes)
											const prompt = customModePrompts?.[visualMode]
											return (
												customMode?.customInstructions ??
												prompt?.customInstructions ??
												getCustomInstructions(mode, customModes)
											)
										})(),
										onChange: (e) => {
											const value = e?.detail?.target?.value ?? e.target.value
											const customMode = findModeBySlug(visualMode, customModes)
											if (customMode) {
												// For custom modes, update the JSON file
												updateCustomMode(visualMode, {
													...customMode,
													// Preserve empty string; only treat null/undefined as unset
													customInstructions: value ?? undefined,
													source: customMode.source || "global",
												})
											} else {
												// For built-in modes, update the prompts
												const existingPrompt = customModePrompts?.[visualMode]
												updateAgentPrompt(visualMode, {
													...existingPrompt,
													customInstructions: value.trim(),
												})
											}
										},
										rows: 10,
										className: "w-full",
										"data-testid": `${getCurrentMode()?.slug || "code"}-custom-instructions-textarea`,
									}),
									_jsx("div", {
										className: "text-xs text-vscode-descriptionForeground mt-1.5",
										children: _jsx(Trans, {
											i18nKey: "prompts:customInstructions.loadFromFile",
											values: {
												mode: getCurrentMode()?.name || "Code",
												slug: getCurrentMode()?.slug || "code",
											},
											components: {
												span: _jsx("span", {
													className:
														"text-vscode-textLink-foreground cursor-pointer underline",
													onClick: () => {
														const currentMode = getCurrentMode()
														if (!currentMode) return
														// Open or create an empty file
														vscode.postMessage({
															type: "openFile",
															text: `./.roo/rules-${currentMode.slug}/rules.md`,
															values: {
																create: true,
																content: "",
															},
														})
													},
												}),
												0: _jsx(VSCodeLink, {
													href: buildDocLink(
														"features/custom-instructions#global-rules-directory",
														"prompts_mode_specific_global_rules",
													),
													style: { display: "inline" },
													"aria-label": "Learn about global custom instructions for modes",
												}),
											},
										}),
									}),
								],
							}),
						],
					}),
					_jsxs("div", {
						className: "pb-4 border-b border-vscode-input-border",
						children: [
							_jsxs("div", {
								className: "flex gap-2 mb-4",
								children: [
									_jsx(Button, {
										variant: "default",
										onClick: () => {
											const currentMode = getCurrentMode()
											if (currentMode) {
												vscode.postMessage({
													type: "getSystemPrompt",
													mode: currentMode.slug,
												})
											}
										},
										"data-testid": "preview-prompt-button",
										children: t("prompts:systemPrompt.preview"),
									}),
									_jsx(StandardTooltip, {
										content: t("prompts:systemPrompt.copy"),
										children: _jsx(Button, {
											variant: "ghost",
											size: "icon",
											onClick: () => {
												const currentMode = getCurrentMode()
												if (currentMode) {
													vscode.postMessage({
														type: "copySystemPrompt",
														mode: currentMode.slug,
													})
												}
											},
											"data-testid": "copy-prompt-button",
											children: _jsx("span", { className: "codicon codicon-copy" }),
										}),
									}),
								],
							}),
							_jsxs("div", {
								className: "flex items-center gap-2",
								children: [
									getCurrentMode() &&
										_jsxs(Button, {
											variant: "default",
											onClick: () => {
												const currentMode = getCurrentMode()
												if (currentMode?.slug && !isExporting) {
													setIsExporting(true)
													vscode.postMessage({
														type: "exportMode",
														slug: currentMode.slug,
													})
												}
											},
											disabled: isExporting,
											title: t("prompts:exportMode.title"),
											"data-testid": "export-mode-button",
											children: [
												_jsx(Upload, { className: "h-4 w-4" }),
												isExporting
													? t("prompts:exportMode.exporting")
													: t("prompts:exportMode.title"),
											],
										}),
									_jsxs(Button, {
										variant: "default",
										onClick: () => setShowImportDialog(true),
										disabled: isImporting,
										title: t("prompts:modes.importMode"),
										"data-testid": "import-mode-button",
										children: [
											_jsx(Download, { className: "h-4 w-4" }),
											isImporting
												? t("prompts:importMode.importing")
												: t("prompts:modes.importMode"),
										],
									}),
								],
							}),
							_jsxs("div", {
								className: "mt-4",
								children: [
									_jsxs("button", {
										onClick: () => setIsSystemPromptDisclosureOpen(!isSystemPromptDisclosureOpen),
										className:
											"flex items-center text-xs text-vscode-foreground hover:text-vscode-textLink-foreground focus:outline-none",
										"aria-expanded": isSystemPromptDisclosureOpen,
										children: [
											_jsx("span", {
												className: `codicon codicon-${isSystemPromptDisclosureOpen ? "chevron-down" : "chevron-right"} mr-1`,
											}),
											_jsx("span", { children: t("prompts:advanced.title") }),
										],
									}),
									isSystemPromptDisclosureOpen &&
										_jsx("div", {
											className: "mt-2 ml-5 space-y-4",
											children: _jsxs("div", {
												children: [
													_jsx("h4", {
														className: "text-xs font-semibold text-vscode-foreground mb-2",
														children: "Override System Prompt",
													}),
													_jsx("div", {
														className: "text-xs text-vscode-descriptionForeground",
														children: _jsx(Trans, {
															i18nKey: "prompts:advancedSystemPrompt.description",
															values: {
																slug: getCurrentMode()?.slug || "code",
															},
															components: {
																span: _jsx("span", {
																	className:
																		"text-vscode-textLink-foreground cursor-pointer underline",
																	onClick: () => {
																		const currentMode = getCurrentMode()
																		if (!currentMode) return
																		vscode.postMessage({
																			type: "openFile",
																			text: `./.roo/system-prompt-${currentMode.slug}`,
																			values: {
																				create: true,
																				content: "",
																			},
																		})
																	},
																}),
																1: _jsx(VSCodeLink, {
																	href: buildDocLink(
																		"features/footgun-prompting",
																		"prompts_advanced_system_prompt",
																	),
																	style: { display: "inline" },
																	"aria-label":
																		"Read important information about overriding system prompts",
																}),
																2: _jsx("strong", {}),
															},
														}),
													}),
												],
											}),
										}),
								],
							}),
						],
					}),
					_jsxs("div", {
						className: "pb-5",
						children: [
							_jsx("h3", {
								className: "text-vscode-foreground mb-3",
								children: t("prompts:globalCustomInstructions.title"),
							}),
							_jsx("div", {
								className: "text-sm text-vscode-descriptionForeground mb-2",
								children: _jsx(Trans, {
									i18nKey: "prompts:globalCustomInstructions.description",
									children: _jsx(VSCodeLink, {
										href: buildDocLink(
											"features/custom-instructions#setting-up-global-rules",
											"prompts_global_custom_instructions",
										),
										style: { display: "inline" },
										"aria-label": "Learn more about global custom instructions",
									}),
								}),
							}),
							_jsx(VSCodeTextArea, {
								resize: "vertical",
								value: customInstructions || "",
								onChange: (e) => {
									const value = e?.detail?.target?.value ?? e.target.value
									setCustomInstructions(value ?? undefined)
									vscode.postMessage({
										type: "customInstructions",
										text: value ?? undefined,
									})
								},
								rows: 4,
								className: "w-full",
								"data-testid": "global-custom-instructions-textarea",
							}),
							_jsx("div", {
								className: "text-xs text-vscode-descriptionForeground mt-1.5",
								children: _jsx(Trans, {
									i18nKey: "prompts:globalCustomInstructions.loadFromFile",
									components: {
										span: _jsx("span", {
											className: "text-vscode-textLink-foreground cursor-pointer underline",
											onClick: () =>
												vscode.postMessage({
													type: "openFile",
													text: "./.roo/rules/rules.md",
													values: {
														create: true,
														content: "",
													},
												}),
										}),
										0: _jsx(VSCodeLink, {
											href: buildDocLink(
												"features/custom-instructions#setting-up-global-rules",
												"prompts_global_rules",
											),
											style: { display: "inline" },
											"aria-label": "Learn about setting up global custom instructions",
										}),
									},
								}),
							}),
						],
					}),
				],
			}),
			isCreateModeDialogOpen &&
				_jsx("div", {
					className: "fixed inset-0 flex justify-end bg-black/50 z-[1000]",
					children: _jsxs("div", {
						className:
							"w-[calc(100vw-100px)] h-full bg-vscode-editor-background shadow-md flex flex-col relative",
						children: [
							_jsxs("div", {
								className: "flex-1 p-5 overflow-y-auto min-h-0",
								children: [
									_jsx(Button, {
										variant: "ghost",
										size: "icon",
										onClick: () => setIsCreateModeDialogOpen(false),
										className: "absolute top-5 right-5",
										children: _jsx("span", { className: "codicon codicon-close" }),
									}),
									_jsx("h2", { className: "mb-4", children: t("prompts:createModeDialog.title") }),
									_jsxs("div", {
										className: "mb-4",
										children: [
											_jsx("div", {
												className: "font-bold mb-1",
												children: t("prompts:createModeDialog.name.label"),
											}),
											_jsx(Input, {
												type: "text",
												value: newModeName,
												onChange: (e) => {
													handleNameChange(e.target.value)
												},
												className: "w-full",
											}),
											nameError &&
												_jsx("div", {
													className: "text-xs text-vscode-errorForeground mt-1",
													children: nameError,
												}),
										],
									}),
									_jsxs("div", {
										className: "mb-4",
										children: [
											_jsx("div", {
												className: "font-bold mb-1",
												children: t("prompts:createModeDialog.slug.label"),
											}),
											_jsx(Input, {
												type: "text",
												value: newModeSlug,
												onChange: (e) => {
													setNewModeSlug(e.target.value)
												},
												className: "w-full",
											}),
											_jsx("div", {
												className: "text-xs text-vscode-descriptionForeground mt-1",
												children: t("prompts:createModeDialog.slug.description"),
											}),
											slugError &&
												_jsx("div", {
													className: "text-xs text-vscode-errorForeground mt-1",
													children: slugError,
												}),
										],
									}),
									_jsxs("div", {
										className: "mb-4",
										children: [
											_jsx("div", {
												className: "font-bold mb-1",
												children: t("prompts:createModeDialog.saveLocation.label"),
											}),
											_jsx("div", {
												className: "text-sm text-vscode-descriptionForeground mb-2",
												children: t("prompts:createModeDialog.saveLocation.description"),
											}),
											_jsxs(VSCodeRadioGroup, {
												value: newModeSource,
												onChange: (e) => {
													const target = e?.detail?.target || e.target
													setNewModeSource(target.value)
												},
												children: [
													_jsxs(VSCodeRadio, {
														value: "global",
														children: [
															t("prompts:createModeDialog.saveLocation.global.label"),
															_jsx("div", {
																className:
																	"text-xs text-vscode-descriptionForeground mt-0.5",
																children: t(
																	"prompts:createModeDialog.saveLocation.global.description",
																),
															}),
														],
													}),
													_jsxs(VSCodeRadio, {
														value: "project",
														children: [
															t("prompts:createModeDialog.saveLocation.project.label"),
															_jsx("div", {
																className:
																	"text-xs text-vscode-descriptionForeground mt-0.5",
																children: t(
																	"prompts:createModeDialog.saveLocation.project.description",
																),
															}),
														],
													}),
												],
											}),
										],
									}),
									_jsxs("div", {
										style: { marginBottom: "16px" },
										children: [
											_jsx("div", {
												style: { fontWeight: "bold", marginBottom: "4px" },
												children: t("prompts:createModeDialog.roleDefinition.label"),
											}),
											_jsx("div", {
												style: {
													fontSize: "13px",
													color: "var(--vscode-descriptionForeground)",
													marginBottom: "8px",
												},
												children: t("prompts:createModeDialog.roleDefinition.description"),
											}),
											_jsx(VSCodeTextArea, {
												resize: "vertical",
												value: newModeRoleDefinition,
												onChange: (e) => {
													setNewModeRoleDefinition(e.target.value)
												},
												rows: 4,
												className: "w-full",
											}),
											roleDefinitionError &&
												_jsx("div", {
													className: "text-xs text-vscode-errorForeground mt-1",
													children: roleDefinitionError,
												}),
										],
									}),
									_jsxs("div", {
										className: "mb-4",
										children: [
											_jsx("div", {
												className: "font-bold mb-1",
												children: t("prompts:createModeDialog.description.label"),
											}),
											_jsx("div", {
												className: "text-[13px] text-vscode-descriptionForeground mb-2",
												children: t("prompts:createModeDialog.description.description"),
											}),
											_jsx(VSCodeTextField, {
												value: newModeDescription,
												onChange: (e) => {
													setNewModeDescription(e.target.value)
												},
												className: "w-full",
											}),
											descriptionError &&
												_jsx("div", {
													className: "text-xs text-vscode-errorForeground mt-1",
													children: descriptionError,
												}),
										],
									}),
									_jsxs("div", {
										className: "mb-4",
										children: [
											_jsx("div", {
												className: "font-bold mb-1",
												children: t("prompts:createModeDialog.whenToUse.label"),
											}),
											_jsx("div", {
												className: "text-[13px] text-vscode-descriptionForeground mb-2",
												children: t("prompts:createModeDialog.whenToUse.description"),
											}),
											_jsx(VSCodeTextArea, {
												resize: "vertical",
												value: newModeWhenToUse,
												onChange: (e) => {
													setNewModeWhenToUse(e.target.value)
												},
												rows: 3,
												className: "w-full",
											}),
										],
									}),
									_jsxs("div", {
										className: "mb-4",
										children: [
											_jsx("div", {
												className: "font-bold mb-1",
												children: t("prompts:createModeDialog.tools.label"),
											}),
											_jsx("div", {
												className: "text-[13px] text-vscode-descriptionForeground mb-2",
												children: t("prompts:createModeDialog.tools.description"),
											}),
											_jsx("div", {
												className: "grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-2",
												children: availableGroups.map((group) =>
													_jsx(
														VSCodeCheckbox,
														{
															checked: newModeGroups.some(
																(g) => getGroupName(g) === group,
															),
															onChange: (e) => {
																const target = e?.detail?.target || e.target
																const checked = target.checked
																if (checked) {
																	setNewModeGroups([...newModeGroups, group])
																} else {
																	setNewModeGroups(
																		newModeGroups.filter(
																			(g) => getGroupName(g) !== group,
																		),
																	)
																}
															},
															children: t(`prompts:tools.toolNames.${group}`),
														},
														group,
													),
												),
											}),
											groupsError &&
												_jsx("div", {
													className: "text-xs text-vscode-errorForeground mt-1",
													children: groupsError,
												}),
										],
									}),
									_jsxs("div", {
										className: "mb-4",
										children: [
											_jsx("div", {
												className: "font-bold mb-1",
												children: t("prompts:createModeDialog.customInstructions.label"),
											}),
											_jsx("div", {
												className: "text-[13px] text-vscode-descriptionForeground mb-2",
												children: t("prompts:createModeDialog.customInstructions.description"),
											}),
											_jsx(VSCodeTextArea, {
												resize: "vertical",
												value: newModeCustomInstructions,
												onChange: (e) => {
													setNewModeCustomInstructions(e.target.value)
												},
												rows: 4,
												className: "w-full",
											}),
										],
									}),
								],
							}),
							_jsxs("div", {
								className:
									"flex justify-end p-3 px-5 gap-2 border-t border-vscode-editor-lineHighlightBorder bg-vscode-editor-background",
								children: [
									_jsx(Button, {
										variant: "secondary",
										onClick: () => setIsCreateModeDialogOpen(false),
										children: t("prompts:createModeDialog.buttons.cancel"),
									}),
									_jsx(Button, {
										variant: "default",
										onClick: handleCreateMode,
										children: t("prompts:createModeDialog.buttons.create"),
									}),
								],
							}),
						],
					}),
				}),
			isDialogOpen &&
				_jsx("div", {
					className: "fixed inset-0 flex justify-end bg-black/50 z-[1000]",
					children: _jsxs("div", {
						className:
							"w-[calc(100vw-100px)] h-full bg-vscode-editor-background shadow-md flex flex-col relative",
						children: [
							_jsxs("div", {
								className: "flex-1 p-5 overflow-y-auto min-h-0",
								children: [
									_jsx(Button, {
										variant: "ghost",
										size: "icon",
										onClick: () => setIsDialogOpen(false),
										className: "absolute top-5 right-5",
										children: _jsx("span", { className: "codicon codicon-close" }),
									}),
									_jsx("h2", {
										className: "mb-4",
										children:
											selectedPromptTitle ||
											t("prompts:systemPrompt.title", {
												modeName: getCurrentMode()?.name || "Code",
											}),
									}),
									_jsx("pre", {
										className:
											"p-2 whitespace-pre-wrap break-words font-mono text-vscode-editor-font-size text-vscode-editor-foreground bg-vscode-editor-background border border-vscode-editor-lineHighlightBorder rounded overflow-y-auto",
										children: selectedPromptContent,
									}),
								],
							}),
							_jsx("div", {
								className:
									"flex justify-end p-3 px-5 border-t border-vscode-editor-lineHighlightBorder bg-vscode-editor-background",
								children: _jsx(Button, {
									variant: "secondary",
									onClick: () => setIsDialogOpen(false),
									children: t("prompts:createModeDialog.close"),
								}),
							}),
						],
					}),
				}),
			showImportDialog &&
				_jsx("div", {
					className: "fixed inset-0 flex items-center justify-center bg-black/50 z-[1000]",
					children: _jsxs("div", {
						className:
							"bg-vscode-editor-background border border-vscode-editor-lineHighlightBorder rounded-lg shadow-lg p-6 max-w-md w-full",
						children: [
							_jsx("h3", {
								className: "text-lg font-semibold mb-4",
								children: t("prompts:modes.importMode"),
							}),
							_jsx("p", {
								className: "text-sm text-vscode-descriptionForeground mb-4",
								children: t("prompts:importMode.selectLevel"),
							}),
							_jsxs("div", {
								className: "space-y-3 mb-6",
								children: [
									_jsxs("label", {
										className: "flex items-start gap-2 cursor-pointer",
										children: [
											_jsx("input", {
												type: "radio",
												name: "importLevel",
												value: "project",
												className: "mt-1",
												defaultChecked: true,
											}),
											_jsxs("div", {
												children: [
													_jsx("div", {
														className: "font-medium",
														children: t("prompts:importMode.project.label"),
													}),
													_jsx("div", {
														className: "text-xs text-vscode-descriptionForeground",
														children: t("prompts:importMode.project.description"),
													}),
												],
											}),
										],
									}),
									_jsxs("label", {
										className: "flex items-start gap-2 cursor-pointer",
										children: [
											_jsx("input", {
												type: "radio",
												name: "importLevel",
												value: "global",
												className: "mt-1",
											}),
											_jsxs("div", {
												children: [
													_jsx("div", {
														className: "font-medium",
														children: t("prompts:importMode.global.label"),
													}),
													_jsx("div", {
														className: "text-xs text-vscode-descriptionForeground",
														children: t("prompts:importMode.global.description"),
													}),
												],
											}),
										],
									}),
								],
							}),
							_jsxs("div", {
								className: "flex justify-end gap-2",
								children: [
									_jsx(Button, {
										variant: "secondary",
										onClick: () => setShowImportDialog(false),
										children: t("prompts:createModeDialog.buttons.cancel"),
									}),
									_jsx(Button, {
										variant: "default",
										onClick: () => {
											if (!isImporting) {
												const selectedLevel = document.querySelector(
													'input[name="importLevel"]:checked',
												)?.value
												setIsImporting(true)
												vscode.postMessage({
													type: "importMode",
													source: selectedLevel || "project",
												})
											}
										},
										disabled: isImporting,
										children: isImporting
											? t("prompts:importMode.importing")
											: t("prompts:importMode.import"),
									}),
								],
							}),
						],
					}),
				}),
			_jsx(DeleteModeDialog, {
				open: showDeleteConfirm,
				onOpenChange: setShowDeleteConfirm,
				modeToDelete: modeToDelete,
				onConfirm: () => {
					if (modeToDelete) {
						vscode.postMessage({
							type: "deleteCustomMode",
							slug: modeToDelete.slug,
						})
						setShowDeleteConfirm(false)
						setModeToDelete(null)
					}
				},
			}),
		],
	})
}
export default ModesView
//# sourceMappingURL=ModesView.js.map
