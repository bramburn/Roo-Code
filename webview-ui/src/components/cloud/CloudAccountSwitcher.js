import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime"
import { useState, useEffect } from "react"
import { Building2, Plus } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectSeparator } from "@/components/ui/select"
import { useAppTranslation } from "@src/i18n/TranslationContext"
import { vscode } from "@src/utils/vscode"
import { useExtensionState } from "@src/context/ExtensionStateContext"
import { cn } from "@src/lib/utils"
export const CloudAccountSwitcher = () => {
	const { t } = useAppTranslation()
	const { cloudUserInfo, cloudOrganizations = [], cloudApiUrl } = useExtensionState()
	const [selectedOrgId, setSelectedOrgId] = useState(cloudUserInfo?.organizationId || null)
	const [isLoading, setIsLoading] = useState(false)
	// Update selected org when userInfo changes
	useEffect(() => {
		setSelectedOrgId(cloudUserInfo?.organizationId || null)
	}, [cloudUserInfo?.organizationId])
	// Show the switcher whenever user is authenticated
	if (!cloudUserInfo) {
		return null
	}
	const handleOrganizationChange = async (value) => {
		// Handle "Create Team Account" option
		if (value === "create-team") {
			if (cloudApiUrl) {
				const billingUrl = `${cloudApiUrl}/billing`
				vscode.postMessage({ type: "openExternal", url: billingUrl })
			}
			return
		}
		const newOrgId = value === "personal" ? null : value
		// Don't do anything if selecting the same organization
		if (newOrgId === selectedOrgId) {
			return
		}
		setIsLoading(true)
		// Send message to switch organization
		vscode.postMessage({
			type: "switchOrganization",
			organizationId: newOrgId,
		})
		// Update local state optimistically
		setSelectedOrgId(newOrgId)
		// Reset loading state after a delay
		setTimeout(() => {
			setIsLoading(false)
		}, 1000)
	}
	const currentValue = selectedOrgId || "personal"
	const currentOrg = cloudOrganizations.find((org) => org.organization.id === selectedOrgId)
	// Render the account icon based on current context
	const renderAccountIcon = () => {
		if (selectedOrgId && currentOrg?.organization.image_url) {
			// Organization with logo
			return _jsx("img", {
				src: currentOrg.organization.image_url,
				alt: currentOrg.organization.name,
				className: "w-5 h-5 rounded object-cover",
			})
		} else if (selectedOrgId) {
			// Organization without logo
			return _jsx(Building2, { className: "w-4.5 h-4.5" })
		} else if (cloudUserInfo.picture) {
			// Personal account with avatar
			return _jsx("img", {
				src: cloudUserInfo.picture,
				alt: cloudUserInfo.name || cloudUserInfo.email,
				className: "w-5 h-5 rounded-full object-cover",
			})
		} else {
			// Personal account without avatar - show initials
			const initial = cloudUserInfo.name?.charAt(0) || cloudUserInfo.email?.charAt(0) || "?"
			return _jsx("div", {
				className:
					"w-5 h-5 rounded-full flex items-center justify-center bg-vscode-button-background text-vscode-button-foreground text-xs",
				children: initial,
			})
		}
	}
	return _jsx("div", {
		className: "inline-block ml-1",
		children: _jsxs(Select, {
			value: currentValue,
			onValueChange: handleOrganizationChange,
			disabled: isLoading,
			children: [
				_jsx(SelectTrigger, {
					className: cn(
						"h-4.5 w-4.5 p-0 gap-0",
						"bg-transparent opacity-90 hover:opacity-50",
						"flex items-center justify-center",
						"rounded-lg overflow-clip",
						"border border-vscode-dropdown-border",
						"[&>svg]:hidden", // Hide the default chevron/caret
						isLoading && "opacity-50",
					),
					"aria-label": selectedOrgId ? currentOrg?.organization.name : t("cloud:personalAccount"),
					children: renderAccountIcon(),
				}),
				_jsxs(SelectContent, {
					children: [
						_jsx(SelectItem, {
							value: "personal",
							children: _jsxs("div", {
								className: "flex items-center gap-2",
								children: [
									cloudUserInfo.picture
										? _jsx("img", {
												src: cloudUserInfo.picture,
												alt: cloudUserInfo.name || cloudUserInfo.email,
												className: "w-4.5 h-4.5 rounded-full object-cover overflow-clip",
											})
										: _jsx("div", {
												className:
													"w-4.5 h-4.5 rounded-full flex items-center justify-center bg-vscode-button-background text-vscode-button-foreground text-xs",
												children:
													cloudUserInfo.name?.charAt(0) ||
													cloudUserInfo.email?.charAt(0) ||
													"?",
											}),
									_jsx("span", { children: t("cloud:personalAccount") }),
								],
							}),
						}),
						cloudOrganizations.length > 0 && _jsx(SelectSeparator, {}),
						cloudOrganizations.map((org) =>
							_jsx(
								SelectItem,
								{
									value: org.organization.id,
									children: _jsxs("div", {
										className: "flex items-center gap-2",
										children: [
											org.organization.image_url
												? _jsx("img", {
														src: org.organization.image_url,
														alt: "",
														className:
															"w-4.5 h-4.5 rounded-full object-cover overflow-clip",
													})
												: _jsx(Building2, { className: "w-4.5 h-4.5" }),
											_jsx("span", { className: "truncate", children: org.organization.name }),
										],
									}),
								},
								org.organization.id,
							),
						),
						cloudOrganizations.length === 0 &&
							_jsxs(_Fragment, {
								children: [
									_jsx(SelectSeparator, {}),
									_jsx(SelectItem, {
										value: "create-team",
										children: _jsxs("div", {
											className: "flex items-center gap-2",
											children: [
												_jsx(Plus, { className: "w-4.5 h-4.5" }),
												_jsx("span", { children: t("cloud:createTeamAccount") }),
											],
										}),
									}),
								],
							}),
					],
				}),
			],
		}),
	})
}
//# sourceMappingURL=CloudAccountSwitcher.js.map
