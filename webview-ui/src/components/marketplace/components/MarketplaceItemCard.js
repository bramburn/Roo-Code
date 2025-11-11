import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime"
import { useMemo, useState, useEffect } from "react"
import { TelemetryEventName } from "@roo-code/types"
import { vscode } from "@/utils/vscode"
import { telemetryClient } from "@/utils/TelemetryClient"
import { useAppTranslation } from "@/i18n/TranslationContext"
import { isValidUrl } from "../../../utils/url"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { StandardTooltip } from "@/components/ui"
import { MarketplaceInstallModal } from "./MarketplaceInstallModal"
import { useExtensionState } from "@/context/ExtensionStateContext"
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui"
export const MarketplaceItemCard = ({ item, filters, setFilters, installed }) => {
	const { t } = useAppTranslation()
	const { cwd } = useExtensionState()
	const [showInstallModal, setShowInstallModal] = useState(false)
	const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)
	const [removeTarget, setRemoveTarget] = useState("project")
	const [removeError, setRemoveError] = useState(null)
	// Listen for removal result messages
	useEffect(() => {
		const handleMessage = (event) => {
			const message = event.data
			if (message.type === "marketplaceRemoveResult" && message.slug === item.id) {
				if (message.success) {
					// Removal succeeded - refresh marketplace data
					vscode.postMessage({
						type: "fetchMarketplaceData",
					})
				} else {
					// Removal failed - show error message to user
					setRemoveError(message.error || t("marketplace:items.unknownError"))
				}
			}
		}
		window.addEventListener("message", handleMessage)
		return () => window.removeEventListener("message", handleMessage)
	}, [item.id, t])
	const typeLabel = useMemo(() => {
		const labels = {
			mode: t("marketplace:filters.type.mode"),
			mcp: t("marketplace:filters.type.mcpServer"),
		}
		return labels[item.type] ?? "N/A"
	}, [item.type, t])
	// Determine installation status
	const isInstalledGlobally = !!installed.global
	const isInstalledInProject = !!installed.project
	const isInstalled = isInstalledGlobally || isInstalledInProject
	const handleInstallClick = () => {
		// Send telemetry for install button click
		telemetryClient.capture(TelemetryEventName.MARKETPLACE_INSTALL_BUTTON_CLICKED, {
			itemId: item.id,
			itemType: item.type,
			itemName: item.name,
		})
		// Show modal for all item types (MCP and modes)
		setShowInstallModal(true)
	}
	return _jsxs(_Fragment, {
		children: [
			_jsxs("div", {
				className: "border border-vscode-panel-border rounded-sm p-3 bg-vscode-editor-background",
				children: [
					_jsxs("div", {
						className: "flex gap-2 items-start justify-between",
						children: [
							_jsx("div", {
								className: "flex gap-2 items-start",
								children: _jsxs("div", {
									children: [
										_jsx("h3", {
											className:
												"text-lg font-semibold text-vscode-foreground mt-0 mb-1 leading-none",
											children:
												item.type === "mcp" && item.url && isValidUrl(item.url)
													? _jsx(Button, {
															variant: "link",
															className:
																"p-0 h-auto text-lg font-semibold text-vscode-foreground hover:underline",
															onClick: () =>
																vscode.postMessage({
																	type: "openExternal",
																	url: item.url,
																}),
															children: item.name,
														})
													: item.name,
										}),
										_jsx(AuthorInfo, { item: item, typeLabel: typeLabel }),
									],
								}),
							}),
							_jsxs("div", {
								className: "flex items-center gap-1",
								children: [
									isInstalled
										? /* Single Remove button when installed */
											_jsx(StandardTooltip, {
												content: isInstalledInProject
													? t("marketplace:items.card.removeProjectTooltip")
													: t("marketplace:items.card.removeGlobalTooltip"),
												children: _jsx(Button, {
													size: "sm",
													variant: "secondary",
													className: "text-xs h-5 py-0 px-2",
													onClick: () => {
														// Determine which installation to remove (prefer project over global)
														const target = isInstalledInProject ? "project" : "global"
														setRemoveTarget(target)
														setShowRemoveConfirm(true)
													},
													children: t("marketplace:items.card.remove"),
												}),
											})
										: /* Single Install button when not installed */
											_jsx(Button, {
												size: "sm",
												variant: "default",
												className: "text-xs h-5 py-0 px-2",
												onClick: handleInstallClick,
												children: t("marketplace:items.card.install"),
											}),
									removeError &&
										_jsx("div", {
											className: "text-vscode-errorForeground text-sm mt-2",
											children: t("marketplace:items.removeFailed", { error: removeError }),
										}),
								],
							}),
						],
					}),
					_jsx("p", { className: "my-2 text-vscode-foreground", children: item.description }),
					(isInstalled || (item.tags && item.tags.length > 0)) &&
						_jsxs("div", {
							className: "relative flex flex-wrap gap-1 my-2",
							children: [
								isInstalled &&
									_jsx("span", {
										className:
											"text-xs px-2 py-0.5 rounded-sm h-5 flex items-center bg-green-600/20 text-green-400 border border-green-600/30 shrink-0",
										children: t("marketplace:items.card.installed"),
									}),
								item.tags &&
									item.tags.length > 0 &&
									item.tags.map((tag) =>
										_jsx(
											StandardTooltip,
											{
												content: filters.tags.includes(tag)
													? t("marketplace:filters.tags.clear", { count: tag })
													: t("marketplace:filters.tags.clickToFilter"),
												children: _jsx(Button, {
													size: "sm",
													variant: "secondary",
													className: cn("rounded-sm capitalize text-xs px-2 h-5", {
														"border-solid border-primary text-primary":
															filters.tags.includes(tag),
													}),
													onClick: () => {
														const newTags = filters.tags.includes(tag)
															? filters.tags.filter((t) => t !== tag)
															: [...filters.tags, tag]
														setFilters({ tags: newTags })
													},
													children: tag,
												}),
											},
											tag,
										),
									),
							],
						}),
				],
			}),
			_jsx(MarketplaceInstallModal, {
				item: item,
				isOpen: showInstallModal,
				onClose: () => setShowInstallModal(false),
				hasWorkspace: !!cwd,
			}),
			_jsx(AlertDialog, {
				open: showRemoveConfirm,
				onOpenChange: setShowRemoveConfirm,
				children: _jsxs(AlertDialogContent, {
					children: [
						_jsxs(AlertDialogHeader, {
							children: [
								_jsx(AlertDialogTitle, {
									children:
										item.type === "mode"
											? t("marketplace:removeConfirm.mode.title")
											: t("marketplace:removeConfirm.mcp.title"),
								}),
								_jsx(AlertDialogDescription, {
									children:
										item.type === "mode"
											? _jsxs(_Fragment, {
													children: [
														t("marketplace:removeConfirm.mode.message", {
															modeName: item.name,
														}),
														_jsx("div", {
															className: "mt-2 text-sm",
															children: t("marketplace:removeConfirm.mode.rulesWarning"),
														}),
													],
												})
											: t("marketplace:removeConfirm.mcp.message", { mcpName: item.name }),
								}),
							],
						}),
						_jsxs(AlertDialogFooter, {
							children: [
								_jsx(AlertDialogCancel, { children: t("marketplace:removeConfirm.cancel") }),
								_jsx(AlertDialogAction, {
									onClick: () => {
										// Clear any previous error
										setRemoveError(null)
										vscode.postMessage({
											type: "removeInstalledMarketplaceItem",
											mpItem: item,
											mpInstallOptions: { target: removeTarget },
										})
										setShowRemoveConfirm(false)
									},
									children: t("marketplace:removeConfirm.confirm"),
								}),
							],
						}),
					],
				}),
			}),
		],
	})
}
const AuthorInfo = ({ item, typeLabel }) => {
	const { t } = useAppTranslation()
	const handleOpenAuthorUrl = () => {
		if (item.authorUrl && isValidUrl(item.authorUrl)) {
			vscode.postMessage({ type: "openExternal", url: item.authorUrl })
		}
	}
	if (item.author) {
		return _jsxs("p", {
			className: "text-sm text-vscode-descriptionForeground my-0",
			children: [
				typeLabel,
				" ",
				item.authorUrl && isValidUrl(item.authorUrl)
					? _jsx(Button, {
							variant: "link",
							className: "p-0 h-auto text-sm text-vscode-textLink hover:underline",
							onClick: handleOpenAuthorUrl,
							children: t("marketplace:items.card.by", { author: item.author }),
						})
					: t("marketplace:items.card.by", { author: item.author }),
			],
		})
	}
	return null
}
//# sourceMappingURL=MarketplaceItemCard.js.map
