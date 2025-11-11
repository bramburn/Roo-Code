import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime"
import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Share2 } from "lucide-react"
import { TelemetryEventName } from "@roo-code/types"
import { vscode } from "@/utils/vscode"
import { telemetryClient } from "@/utils/TelemetryClient"
import { useExtensionState } from "@/context/ExtensionStateContext"
import { useCloudUpsell } from "@/hooks/useCloudUpsell"
import { CloudUpsellDialog } from "@/components/cloud/CloudUpsellDialog"
import {
	Button,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Command,
	CommandList,
	CommandItem,
	CommandGroup,
	StandardTooltip,
} from "@/components/ui"
export const ShareButton = ({ item, disabled = false, showLabel = false }) => {
	const [shareDropdownOpen, setShareDropdownOpen] = useState(false)
	const [shareSuccess, setShareSuccess] = useState(null)
	const [wasConnectInitiatedFromShare, setWasConnectInitiatedFromShare] = useState(false)
	const { t } = useTranslation()
	const { cloudUserInfo } = useExtensionState()
	// Use enhanced cloud upsell hook with auto-open on auth success
	const {
		isOpen: connectModalOpen,
		openUpsell,
		closeUpsell,
		handleConnect,
		isAuthenticated: cloudIsAuthenticated,
		sharingEnabled,
	} = useCloudUpsell({
		onAuthSuccess: () => {
			// Auto-open share dropdown after successful authentication
			setShareDropdownOpen(true)
			setWasConnectInitiatedFromShare(false)
		},
	})
	// Auto-open popover when user becomes authenticated after clicking Connect from share button
	useEffect(() => {
		if (wasConnectInitiatedFromShare && cloudIsAuthenticated) {
			setShareDropdownOpen(true)
			setWasConnectInitiatedFromShare(false)
		}
	}, [wasConnectInitiatedFromShare, cloudIsAuthenticated])
	// Listen for share success messages from the extension
	useEffect(() => {
		const handleMessage = (event) => {
			const message = event.data
			if (message.type === "shareTaskSuccess") {
				setShareSuccess({
					visibility: message.visibility,
					url: message.text,
				})
				// Auto-hide success message and close popover after 5 seconds
				setTimeout(() => {
					setShareSuccess(null)
					setShareDropdownOpen(false)
				}, 5000)
			}
		}
		window.addEventListener("message", handleMessage)
		return () => window.removeEventListener("message", handleMessage)
	}, [])
	const handleShare = (visibility) => {
		// Clear any previous success state
		setShareSuccess(null)
		// Send telemetry for share action
		if (visibility === "organization") {
			telemetryClient.capture(TelemetryEventName.SHARE_ORGANIZATION_CLICKED)
		} else {
			telemetryClient.capture(TelemetryEventName.SHARE_PUBLIC_CLICKED)
		}
		vscode.postMessage({
			type: "shareCurrentTask",
			visibility,
		})
		// Don't close the dropdown immediately - let success message show first
	}
	const handleConnectToCloud = () => {
		setWasConnectInitiatedFromShare(true)
		handleConnect()
		setShareDropdownOpen(false)
	}
	const handleShareButtonClick = () => {
		// Send telemetry for share button click
		telemetryClient.capture(TelemetryEventName.SHARE_BUTTON_CLICKED)
		if (!cloudIsAuthenticated) {
			// Show modal for unauthenticated users
			openUpsell()
			telemetryClient.capture(TelemetryEventName.SHARE_CONNECT_TO_CLOUD_CLICKED)
		} else {
			// Show popover for authenticated users
			setShareDropdownOpen(true)
		}
	}
	// Determine share button state
	const getShareButtonState = () => {
		if (!cloudIsAuthenticated) {
			return {
				disabled: false,
				title: t("chat:task.share"),
				showPopover: false, // We'll show modal instead
			}
		} else if (!sharingEnabled) {
			return {
				disabled: true,
				title: t("chat:task.sharingDisabledByOrganization"),
				showPopover: false,
			}
		} else {
			return {
				disabled: false,
				title: t("chat:task.share"),
				showPopover: true,
			}
		}
	}
	const shareButtonState = getShareButtonState()
	// Don't render if no item ID
	if (!item?.id) {
		return null
	}
	return _jsxs(_Fragment, {
		children: [
			shareButtonState.showPopover
				? _jsxs(Popover, {
						open: shareDropdownOpen,
						onOpenChange: setShareDropdownOpen,
						children: [
							_jsx(StandardTooltip, {
								content: shareButtonState.title,
								children: _jsx(PopoverTrigger, {
									asChild: true,
									children: _jsxs(Button, {
										variant: "ghost",
										size: showLabel ? "sm" : "icon",
										disabled: disabled || shareButtonState.disabled,
										className: showLabel
											? "h-7 px-2 hover:bg-vscode-toolbar-hoverBackground"
											: "h-7 w-7 p-1.5 hover:bg-vscode-toolbar-hoverBackground",
										onClick: handleShareButtonClick,
										"data-testid": "share-button",
										children: [
											_jsx(Share2, {}),
											showLabel &&
												_jsx("span", { className: "ml-0", children: t("chat:task.share") }),
										],
									}),
								}),
							}),
							_jsx(PopoverContent, {
								className: "w-56 p-0",
								align: "start",
								children: shareSuccess
									? _jsx("div", {
											className: "p-3",
											children: _jsxs("div", {
												className:
													"flex items-center gap-2 text-sm text-green-600 dark:text-green-400",
												children: [
													_jsx("span", { className: "codicon codicon-check" }),
													_jsx("span", {
														children:
															shareSuccess.visibility === "public"
																? t("chat:task.shareSuccessPublic")
																: t("chat:task.shareSuccessOrganization"),
													}),
												],
											}),
										})
									: _jsx(Command, {
											children: _jsx(CommandList, {
												children: _jsxs(CommandGroup, {
													children: [
														cloudUserInfo?.organizationName &&
															_jsx(CommandItem, {
																onSelect: () => handleShare("organization"),
																className: "cursor-pointer",
																children: _jsxs("div", {
																	className: "flex items-center gap-2",
																	children: [
																		_jsx("span", {
																			className:
																				"codicon codicon-organization text-sm",
																		}),
																		_jsxs("div", {
																			className: "flex flex-col",
																			children: [
																				_jsx("span", {
																					className: "text-sm",
																					children: t(
																						"chat:task.shareWithOrganization",
																					),
																				}),
																				_jsx("span", {
																					className:
																						"text-xs text-vscode-descriptionForeground",
																					children: t(
																						"chat:task.shareWithOrganizationDescription",
																					),
																				}),
																			],
																		}),
																	],
																}),
															}),
														_jsx(CommandItem, {
															onSelect: () => handleShare("public"),
															className: "cursor-pointer",
															children: _jsxs("div", {
																className: "flex items-center gap-2",
																children: [
																	_jsx("span", {
																		className: "codicon codicon-globe text-sm",
																	}),
																	_jsxs("div", {
																		className: "flex flex-col",
																		children: [
																			_jsx("span", {
																				className: "text-sm",
																				children: t("chat:task.sharePublicly"),
																			}),
																			_jsx("span", {
																				className:
																					"text-xs text-vscode-descriptionForeground",
																				children: t(
																					"chat:task.sharePubliclyDescription",
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
										}),
							}),
						],
					})
				: _jsx(StandardTooltip, {
						content: shareButtonState.title,
						children: _jsxs(Button, {
							variant: "ghost",
							size: showLabel ? "sm" : "icon",
							disabled: disabled || shareButtonState.disabled,
							className: showLabel
								? "h-7 px-2 hover:bg-vscode-toolbar-hoverBackground"
								: "h-7 w-7 p-1.5 hover:bg-vscode-toolbar-hoverBackground",
							onClick: handleShareButtonClick,
							"data-testid": "share-button",
							children: [
								_jsx(Share2, {}),
								showLabel && _jsx("span", { className: "ml-1", children: t("chat:task.share") }),
							],
						}),
					}),
			_jsx(CloudUpsellDialog, {
				open: connectModalOpen,
				onOpenChange: closeUpsell,
				onConnect: handleConnectToCloud,
			}),
		],
	})
}
//# sourceMappingURL=ShareButton.js.map
