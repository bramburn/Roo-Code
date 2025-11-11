import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime"
import { useEffect, useMemo, useRef, useState } from "react"
import { getIconForFilePath, getIconUrlByName, getIconForDirectoryPath } from "vscode-material-icons"
import { Settings } from "lucide-react"
import { ContextMenuOptionType, getContextMenuOptions } from "@src/utils/context-mentions"
import { removeLeadingNonAlphanumeric } from "@src/utils/removeLeadingNonAlphanumeric"
import { vscode } from "@src/utils/vscode"
import { buildDocLink } from "@/utils/docLinks"
import { Trans } from "react-i18next"
import { t } from "i18next"
const ContextMenu = ({
	onSelect,
	searchQuery,
	onMouseDown,
	selectedIndex,
	setSelectedIndex,
	selectedType,
	queryItems,
	modes,
	dynamicSearchResults = [],
	commands = [],
}) => {
	const [materialIconsBaseUri, setMaterialIconsBaseUri] = useState("")
	const menuRef = useRef(null)
	const filteredOptions = useMemo(() => {
		return getContextMenuOptions(searchQuery, selectedType, queryItems, dynamicSearchResults, modes, commands)
	}, [searchQuery, selectedType, queryItems, dynamicSearchResults, modes, commands])
	useEffect(() => {
		if (menuRef.current) {
			const selectedElement = menuRef.current.children[selectedIndex]
			if (selectedElement) {
				const menuRect = menuRef.current.getBoundingClientRect()
				const selectedRect = selectedElement.getBoundingClientRect()
				if (selectedRect.bottom > menuRect.bottom) {
					menuRef.current.scrollTop += selectedRect.bottom - menuRect.bottom
				} else if (selectedRect.top < menuRect.top) {
					menuRef.current.scrollTop -= menuRect.top - selectedRect.top
				}
			}
		}
	}, [selectedIndex])
	// get the icons base uri on mount
	useEffect(() => {
		const w = window
		setMaterialIconsBaseUri(w.MATERIAL_ICONS_BASE_URI)
	}, [])
	const renderOptionContent = (option) => {
		switch (option.type) {
			case ContextMenuOptionType.SectionHeader:
				return _jsx("span", {
					style: {
						fontWeight: "bold",
						fontSize: "0.85em",
						opacity: 0.8,
					},
					children: option.label,
				})
			case ContextMenuOptionType.Mode:
				return _jsxs("div", {
					style: { display: "flex", flexDirection: "column", gap: "2px" },
					children: [
						_jsx("div", {
							style: { lineHeight: "1.2" },
							children: _jsx("span", { children: option.slashCommand }),
						}),
						option.description &&
							_jsx("span", {
								style: {
									opacity: 0.5,
									fontSize: "0.9em",
									lineHeight: "1.2",
									whiteSpace: "nowrap",
									overflow: "hidden",
									textOverflow: "ellipsis",
								},
								children: option.description,
							}),
					],
				})
			case ContextMenuOptionType.Command:
				return _jsxs("div", {
					style: { display: "flex", flexDirection: "column", gap: "2px" },
					children: [
						_jsxs("div", {
							style: { lineHeight: "1.2", display: "flex", alignItems: "center", gap: "6px" },
							children: [
								_jsx("span", { children: option.slashCommand }),
								option.argumentHint &&
									_jsx("span", {
										style: {
											opacity: 0.5,
											fontSize: "0.9em",
											lineHeight: "1.2",
										},
										children: option.argumentHint,
									}),
							],
						}),
						option.description &&
							_jsx("span", {
								style: {
									opacity: 0.5,
									fontSize: "0.9em",
									lineHeight: "1.2",
									whiteSpace: "nowrap",
									overflow: "hidden",
									textOverflow: "ellipsis",
								},
								children: option.description,
							}),
					],
				})
			case ContextMenuOptionType.Problems:
				return _jsx("span", { children: t("chat:contextMenu.problems") })
			case ContextMenuOptionType.Terminal:
				return _jsx("span", { children: t("chat:contextMenu.terminal") })
			case ContextMenuOptionType.URL:
				return _jsx("span", { children: t("chat:contextMenu.url") })
			case ContextMenuOptionType.NoResults:
				return _jsx("span", { children: t("chat:contextMenu.noResults") })
			case ContextMenuOptionType.Git:
				if (option.value) {
					return _jsxs("div", {
						style: { display: "flex", flexDirection: "column", gap: 0 },
						children: [
							_jsx("span", { style: { lineHeight: "1.2" }, children: option.label }),
							_jsx("span", {
								style: {
									fontSize: "0.85em",
									opacity: 0.7,
									whiteSpace: "nowrap",
									overflow: "hidden",
									textOverflow: "ellipsis",
									lineHeight: "1.2",
								},
								children: option.description,
							}),
						],
					})
				} else {
					return _jsx("span", { children: "Git Commits" })
				}
			case ContextMenuOptionType.File:
			case ContextMenuOptionType.OpenedFile:
			case ContextMenuOptionType.Folder:
				if (option.value) {
					// remove trailing slash
					const path = removeLeadingNonAlphanumeric(option.value || "").replace(/\/$/, "")
					const pathList = path.split("/")
					const filename = pathList.at(-1)
					const folderPath = pathList.slice(0, -1).join("/")
					return _jsxs("div", {
						style: {
							flex: 1,
							overflow: "hidden",
							display: "flex",
							gap: "0.5em",
							whiteSpace: "nowrap",
							alignItems: "center",
							justifyContent: "space-between",
							textAlign: "left",
						},
						children: [
							_jsx("span", { children: filename }),
							_jsx("span", {
								style: {
									whiteSpace: "nowrap",
									overflow: "hidden",
									textOverflow: "ellipsis",
									direction: "rtl",
									textAlign: "right",
									flex: 1,
									opacity: 0.75,
									fontSize: "0.75em",
								},
								children: folderPath,
							}),
						],
					})
				} else {
					return _jsxs("span", {
						children: ["Add ", option.type === ContextMenuOptionType.File ? "File" : "Folder"],
					})
				}
		}
	}
	const getIconForOption = (option) => {
		switch (option.type) {
			case ContextMenuOptionType.Mode:
				return "symbol-misc"
			case ContextMenuOptionType.Command:
				return "play"
			case ContextMenuOptionType.OpenedFile:
				return "window"
			case ContextMenuOptionType.File:
				return "file"
			case ContextMenuOptionType.Folder:
				return "folder"
			case ContextMenuOptionType.Problems:
				return "warning"
			case ContextMenuOptionType.Terminal:
				return "terminal"
			case ContextMenuOptionType.URL:
				return "link"
			case ContextMenuOptionType.Git:
				return "git-commit"
			case ContextMenuOptionType.NoResults:
				return "info"
			default:
				return "file"
		}
	}
	const getMaterialIconForOption = (option) => {
		// only take the last part of the path to handle both file and folder icons
		// since material-icons have specific folder icons, we use them if available
		const name = option.value?.split("/").filter(Boolean).at(-1) ?? ""
		const iconName =
			option.type === ContextMenuOptionType.Folder ? getIconForDirectoryPath(name) : getIconForFilePath(name)
		return getIconUrlByName(iconName, materialIconsBaseUri)
	}
	const isOptionSelectable = (option) => {
		return (
			option.type !== ContextMenuOptionType.NoResults &&
			option.type !== ContextMenuOptionType.URL &&
			option.type !== ContextMenuOptionType.SectionHeader
		)
	}
	const handleSettingsClick = (e) => {
		// Prevent any default behavior
		e.preventDefault()
		// Switch to settings tab and navigate to slash commands section
		vscode.postMessage({
			type: "switchTab",
			tab: "settings",
			values: { section: "slashCommands" },
		})
	}
	return _jsx("div", {
		style: {
			position: "absolute",
			bottom: "calc(100% - 10px)",
			left: 15,
			right: 15,
			overflowX: "hidden",
		},
		onMouseDown: onMouseDown,
		children: _jsxs("div", {
			ref: menuRef,
			style: {
				backgroundColor: "var(--vscode-dropdown-background)",
				border: "1px solid var(--vscode-editorGroup-border)",
				borderRadius: "3px",
				boxShadow: "0 4px 10px rgba(0, 0, 0, 0.25)",
				zIndex: 1000,
				display: "flex",
				flexDirection: "column",
				maxHeight: "300px",
				overflowY: "auto",
				overflowX: "hidden",
			},
			children: [
				searchQuery === "/" &&
					_jsxs("div", {
						className: "p-2 flex items-start gap-4 justify-between",
						children: [
							searchQuery.length === 1 &&
								_jsxs("div", {
									className: "text-sm",
									children: [
										_jsx("p", {
											className: "font-bold text-base text-vscode-foreground mt-1 mb-0.5",
											children: "Slash Commands",
										}),
										_jsx("p", {
											className: "text-xs mt-0.5 -mb-1",
											children: _jsx(Trans, {
												i18nKey: "settings:slashCommands.description",
												components: {
													DocsLink: _jsx("a", {
														href: buildDocLink(
															"features/slash-commands",
															"slash_commands_settings",
														),
														target: "_blank",
														rel: "noopener noreferrer",
														className: "text-vscode-textLink-foreground hover:underline",
														children: t("common:docsLink.label"),
													}),
												},
											}),
										}),
									],
								}),
							_jsx("button", {
								className: "mt-1 cursor-pointer",
								onClick: handleSettingsClick,
								onMouseDown: (e) => {
									e.stopPropagation()
									e.preventDefault()
								},
								onMouseEnter: (e) => {
									e.currentTarget.style.opacity = "1"
									e.currentTarget.style.backgroundColor = "var(--vscode-list-hoverBackground)"
								},
								onMouseLeave: (e) => {
									e.currentTarget.style.opacity = "0.7"
									e.currentTarget.style.backgroundColor = "transparent"
								},
								title: t("chat:slashCommands.manageCommands"),
								children: _jsx(Settings, { size: 16 }),
							}),
						],
					}),
				filteredOptions && filteredOptions.length > 0
					? filteredOptions.map((option, index) =>
							_jsxs(
								"div",
								{
									onClick: () => isOptionSelectable(option) && onSelect(option.type, option.value),
									style: {
										padding:
											option.type === ContextMenuOptionType.SectionHeader
												? "16px 8px 4px 8px"
												: "4px 8px",
										cursor: isOptionSelectable(option) ? "pointer" : "default",
										color: "var(--vscode-dropdown-foreground)",
										display: "flex",
										alignItems: "center",
										justifyContent: "space-between",
										position: "relative",
										...(option.type === ContextMenuOptionType.SectionHeader
											? {
													borderBottom: "1px solid var(--vscode-editorGroup-border)",
													marginBottom: "2px",
												}
											: {}),
										...(index === selectedIndex && isOptionSelectable(option)
											? {
													backgroundColor: "var(--vscode-list-activeSelectionBackground)",
													color: "var(--vscode-list-activeSelectionForeground)",
												}
											: {}),
									},
									onMouseEnter: () => isOptionSelectable(option) && setSelectedIndex(index),
									children: [
										_jsxs("div", {
											style: {
												display: "flex",
												alignItems: "center",
												flex: 1,
												minWidth: 0,
												overflow: "hidden",
												paddingTop: 0,
												position: "relative",
											},
											children: [
												(option.type === ContextMenuOptionType.File ||
													option.type === ContextMenuOptionType.Folder ||
													option.type === ContextMenuOptionType.OpenedFile) &&
													_jsx("img", {
														src: getMaterialIconForOption(option),
														alt: "Mode",
														style: {
															marginRight: "6px",
															flexShrink: 0,
															width: "16px",
															height: "16px",
														},
													}),
												option.type !== ContextMenuOptionType.Mode &&
													option.type !== ContextMenuOptionType.Command &&
													option.type !== ContextMenuOptionType.File &&
													option.type !== ContextMenuOptionType.Folder &&
													option.type !== ContextMenuOptionType.OpenedFile &&
													option.type !== ContextMenuOptionType.SectionHeader &&
													getIconForOption(option) &&
													_jsx("i", {
														className: `codicon codicon-${getIconForOption(option)}`,
														style: {
															marginRight: "6px",
															flexShrink: 0,
															fontSize: "14px",
															marginTop: 0,
														},
													}),
												renderOptionContent(option),
											],
										}),
										(option.type === ContextMenuOptionType.File ||
											option.type === ContextMenuOptionType.Folder ||
											option.type === ContextMenuOptionType.Git) &&
											!option.value &&
											_jsx("i", {
												className: "codicon codicon-chevron-right",
												style: { fontSize: "10px", flexShrink: 0, marginLeft: 8 },
											}),
									],
								},
								`${option.type}-${option.value || index}`,
							),
						)
					: _jsx("div", {
							style: {
								padding: "4px",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								color: "var(--vscode-foreground)",
								opacity: 0.7,
							},
							children: _jsx("span", { children: t("chat:contextMenu.noResults") }),
						}),
			],
		}),
	})
}
export default ContextMenu
//# sourceMappingURL=ContextMenu.js.map
