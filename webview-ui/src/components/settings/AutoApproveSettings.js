import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime"
import { useState } from "react"
import { X, CheckCheck } from "lucide-react"
import { Trans } from "react-i18next"
import { Package } from "@roo/package"
import { useAppTranslation } from "@/i18n/TranslationContext"
import { VSCodeCheckbox } from "@vscode/webview-ui-toolkit/react"
import { vscode } from "@/utils/vscode"
import { Button, Input, Slider } from "@/components/ui"
import { SectionHeader } from "./SectionHeader"
import { Section } from "./Section"
import { AutoApproveToggle } from "./AutoApproveToggle"
import { MaxLimitInputs } from "./MaxLimitInputs"
import { useExtensionState } from "@/context/ExtensionStateContext"
import { useAutoApprovalState } from "@/hooks/useAutoApprovalState"
import { useAutoApprovalToggles } from "@/hooks/useAutoApprovalToggles"
export const AutoApproveSettings = ({
	alwaysAllowReadOnly,
	alwaysAllowReadOnlyOutsideWorkspace,
	alwaysAllowWrite,
	alwaysAllowWriteOutsideWorkspace,
	alwaysAllowWriteProtected,
	alwaysAllowBrowser,
	alwaysApproveResubmit,
	requestDelaySeconds,
	alwaysAllowMcp,
	alwaysAllowModeSwitch,
	alwaysAllowSubtasks,
	alwaysAllowExecute,
	alwaysAllowFollowupQuestions,
	followupAutoApproveTimeoutMs = 60000,
	alwaysAllowUpdateTodoList,
	allowedCommands,
	allowedMaxRequests,
	allowedMaxCost,
	deniedCommands,
	setCachedStateField,
	...props
}) => {
	const { t } = useAppTranslation()
	const [commandInput, setCommandInput] = useState("")
	const [deniedCommandInput, setDeniedCommandInput] = useState("")
	const { autoApprovalEnabled, setAutoApprovalEnabled } = useExtensionState()
	const toggles = useAutoApprovalToggles()
	const { effectiveAutoApprovalEnabled } = useAutoApprovalState(toggles, autoApprovalEnabled)
	const handleAddCommand = () => {
		const currentCommands = allowedCommands ?? []
		if (commandInput && !currentCommands.includes(commandInput)) {
			const newCommands = [...currentCommands, commandInput]
			setCachedStateField("allowedCommands", newCommands)
			setCommandInput("")
			vscode.postMessage({ type: "allowedCommands", commands: newCommands })
		}
	}
	const handleAddDeniedCommand = () => {
		const currentCommands = deniedCommands ?? []
		if (deniedCommandInput && !currentCommands.includes(deniedCommandInput)) {
			const newCommands = [...currentCommands, deniedCommandInput]
			setCachedStateField("deniedCommands", newCommands)
			setDeniedCommandInput("")
			vscode.postMessage({ type: "deniedCommands", commands: newCommands })
		}
	}
	return _jsxs("div", {
		...props,
		children: [
			_jsx(SectionHeader, {
				children: _jsxs("div", {
					className: "flex items-center gap-2",
					children: [
						_jsx(CheckCheck, { className: "w-4 h-4" }),
						_jsx("div", { children: t("settings:sections.autoApprove") }),
					],
				}),
			}),
			_jsxs(Section, {
				children: [
					_jsxs("div", {
						className: "space-y-4",
						children: [
							_jsx(VSCodeCheckbox, {
								checked: effectiveAutoApprovalEnabled,
								"aria-label": t("settings:autoApprove.toggleAriaLabel"),
								onChange: () => {
									const newValue = !(autoApprovalEnabled ?? false)
									setAutoApprovalEnabled(newValue)
									vscode.postMessage({ type: "autoApprovalEnabled", bool: newValue })
								},
								children: _jsx("span", {
									className: "font-medium",
									children: t("settings:autoApprove.enabled"),
								}),
							}),
							_jsxs("div", {
								className: "text-vscode-descriptionForeground text-sm mt-1",
								children: [
									_jsx("p", { children: t("settings:autoApprove.description") }),
									_jsx("p", {
										children: _jsx(Trans, {
											i18nKey: "settings:autoApprove.toggleShortcut",
											components: {
												SettingsLink: _jsx("a", {
													href: "#",
													className:
														"text-vscode-textLink-foreground hover:underline cursor-pointer",
													onClick: (e) => {
														e.preventDefault()
														// Send message to open keyboard shortcuts with search for toggle command
														vscode.postMessage({
															type: "openKeyboardShortcuts",
															text: `${Package.name}.toggleAutoApprove`,
														})
													},
												}),
											},
										}),
									}),
								],
							}),
							_jsx(AutoApproveToggle, {
								alwaysAllowReadOnly: alwaysAllowReadOnly,
								alwaysAllowWrite: alwaysAllowWrite,
								alwaysAllowBrowser: alwaysAllowBrowser,
								alwaysApproveResubmit: alwaysApproveResubmit,
								alwaysAllowMcp: alwaysAllowMcp,
								alwaysAllowModeSwitch: alwaysAllowModeSwitch,
								alwaysAllowSubtasks: alwaysAllowSubtasks,
								alwaysAllowExecute: alwaysAllowExecute,
								alwaysAllowFollowupQuestions: alwaysAllowFollowupQuestions,
								alwaysAllowUpdateTodoList: alwaysAllowUpdateTodoList,
								onToggle: (key, value) => setCachedStateField(key, value),
							}),
							_jsx(MaxLimitInputs, {
								allowedMaxRequests: allowedMaxRequests,
								allowedMaxCost: allowedMaxCost,
								onMaxRequestsChange: (value) => setCachedStateField("allowedMaxRequests", value),
								onMaxCostChange: (value) => setCachedStateField("allowedMaxCost", value),
							}),
						],
					}),
					alwaysAllowReadOnly &&
						_jsxs("div", {
							className: "flex flex-col gap-3 pl-3 border-l-2 border-vscode-button-background",
							children: [
								_jsxs("div", {
									className: "flex items-center gap-4 font-bold",
									children: [
										_jsx("span", { className: "codicon codicon-eye" }),
										_jsx("div", { children: t("settings:autoApprove.readOnly.label") }),
									],
								}),
								_jsxs("div", {
									children: [
										_jsx(VSCodeCheckbox, {
											checked: alwaysAllowReadOnlyOutsideWorkspace,
											onChange: (e) =>
												setCachedStateField(
													"alwaysAllowReadOnlyOutsideWorkspace",
													e.target.checked,
												),
											"data-testid": "always-allow-readonly-outside-workspace-checkbox",
											children: _jsx("span", {
												className: "font-medium",
												children: t("settings:autoApprove.readOnly.outsideWorkspace.label"),
											}),
										}),
										_jsx("div", {
											className: "text-vscode-descriptionForeground text-sm mt-1",
											children: t("settings:autoApprove.readOnly.outsideWorkspace.description"),
										}),
									],
								}),
							],
						}),
					alwaysAllowWrite &&
						_jsxs("div", {
							className: "flex flex-col gap-3 pl-3 border-l-2 border-vscode-button-background",
							children: [
								_jsxs("div", {
									className: "flex items-center gap-4 font-bold",
									children: [
										_jsx("span", { className: "codicon codicon-edit" }),
										_jsx("div", { children: t("settings:autoApprove.write.label") }),
									],
								}),
								_jsxs("div", {
									children: [
										_jsx(VSCodeCheckbox, {
											checked: alwaysAllowWriteOutsideWorkspace,
											onChange: (e) =>
												setCachedStateField(
													"alwaysAllowWriteOutsideWorkspace",
													e.target.checked,
												),
											"data-testid": "always-allow-write-outside-workspace-checkbox",
											children: _jsx("span", {
												className: "font-medium",
												children: t("settings:autoApprove.write.outsideWorkspace.label"),
											}),
										}),
										_jsx("div", {
											className: "text-vscode-descriptionForeground text-sm mt-1",
											children: t("settings:autoApprove.write.outsideWorkspace.description"),
										}),
									],
								}),
								_jsxs("div", {
									children: [
										_jsx(VSCodeCheckbox, {
											checked: alwaysAllowWriteProtected,
											onChange: (e) =>
												setCachedStateField("alwaysAllowWriteProtected", e.target.checked),
											"data-testid": "always-allow-write-protected-checkbox",
											children: _jsx("span", {
												className: "font-medium",
												children: t("settings:autoApprove.write.protected.label"),
											}),
										}),
										_jsx("div", {
											className: "text-vscode-descriptionForeground text-sm mt-1 mb-3",
											children: t("settings:autoApprove.write.protected.description"),
										}),
									],
								}),
							],
						}),
					alwaysApproveResubmit &&
						_jsxs("div", {
							className: "flex flex-col gap-3 pl-3 border-l-2 border-vscode-button-background",
							children: [
								_jsxs("div", {
									className: "flex items-center gap-4 font-bold",
									children: [
										_jsx("span", { className: "codicon codicon-refresh" }),
										_jsx("div", { children: t("settings:autoApprove.retry.label") }),
									],
								}),
								_jsxs("div", {
									children: [
										_jsxs("div", {
											className: "flex items-center gap-2",
											children: [
												_jsx(Slider, {
													min: 5,
													max: 100,
													step: 1,
													value: [requestDelaySeconds],
													onValueChange: ([value]) =>
														setCachedStateField("requestDelaySeconds", value),
													"data-testid": "request-delay-slider",
												}),
												_jsxs("span", {
													className: "w-20",
													children: [requestDelaySeconds, "s"],
												}),
											],
										}),
										_jsx("div", {
											className: "text-vscode-descriptionForeground text-sm mt-1",
											children: t("settings:autoApprove.retry.delayLabel"),
										}),
									],
								}),
							],
						}),
					alwaysAllowFollowupQuestions &&
						_jsxs("div", {
							className: "flex flex-col gap-3 pl-3 border-l-2 border-vscode-button-background",
							children: [
								_jsxs("div", {
									className: "flex items-center gap-4 font-bold",
									children: [
										_jsx("span", { className: "codicon codicon-question" }),
										_jsx("div", { children: t("settings:autoApprove.followupQuestions.label") }),
									],
								}),
								_jsxs("div", {
									children: [
										_jsxs("div", {
											className: "flex items-center gap-2",
											children: [
												_jsx(Slider, {
													min: 1000,
													max: 300000,
													step: 1000,
													value: [followupAutoApproveTimeoutMs],
													onValueChange: ([value]) =>
														setCachedStateField("followupAutoApproveTimeoutMs", value),
													"data-testid": "followup-timeout-slider",
												}),
												_jsxs("span", {
													className: "w-20",
													children: [followupAutoApproveTimeoutMs / 1000, "s"],
												}),
											],
										}),
										_jsx("div", {
											className: "text-vscode-descriptionForeground text-sm mt-1",
											children: t("settings:autoApprove.followupQuestions.timeoutLabel"),
										}),
									],
								}),
							],
						}),
					alwaysAllowExecute &&
						_jsxs("div", {
							className: "flex flex-col gap-3 pl-3 border-l-2 border-vscode-button-background",
							children: [
								_jsxs("div", {
									className: "flex items-center gap-4 font-bold",
									children: [
										_jsx("span", { className: "codicon codicon-terminal" }),
										_jsx("div", { children: t("settings:autoApprove.execute.label") }),
									],
								}),
								_jsxs("div", {
									children: [
										_jsx("label", {
											className: "block font-medium mb-1",
											"data-testid": "allowed-commands-heading",
											children: t("settings:autoApprove.execute.allowedCommands"),
										}),
										_jsx("div", {
											className: "text-vscode-descriptionForeground text-sm mt-1",
											children: t("settings:autoApprove.execute.allowedCommandsDescription"),
										}),
									],
								}),
								_jsxs("div", {
									className: "flex gap-2",
									children: [
										_jsx(Input, {
											value: commandInput,
											onChange: (e) => setCommandInput(e.target.value),
											onKeyDown: (e) => {
												if (e.key === "Enter") {
													e.preventDefault()
													handleAddCommand()
												}
											},
											placeholder: t("settings:autoApprove.execute.commandPlaceholder"),
											className: "grow",
											"data-testid": "command-input",
										}),
										_jsx(Button, {
											className: "h-8",
											onClick: handleAddCommand,
											"data-testid": "add-command-button",
											children: t("settings:autoApprove.execute.addButton"),
										}),
									],
								}),
								_jsx("div", {
									className: "flex flex-wrap gap-2",
									children: (allowedCommands ?? []).map((cmd, index) =>
										_jsx(
											Button,
											{
												variant: "secondary",
												"data-testid": `remove-command-${index}`,
												onClick: () => {
													const newCommands = (allowedCommands ?? []).filter(
														(_, i) => i !== index,
													)
													setCachedStateField("allowedCommands", newCommands)
													vscode.postMessage({
														type: "allowedCommands",
														commands: newCommands,
													})
												},
												children: _jsxs("div", {
													className: "flex flex-row items-center gap-1",
													children: [
														_jsx("div", { children: cmd }),
														_jsx(X, { className: "text-foreground scale-75" }),
													],
												}),
											},
											index,
										),
									),
								}),
								_jsxs("div", {
									className: "mt-6",
									children: [
										_jsx("label", {
											className: "block font-medium mb-1",
											"data-testid": "denied-commands-heading",
											children: t("settings:autoApprove.execute.deniedCommands"),
										}),
										_jsx("div", {
											className: "text-vscode-descriptionForeground text-sm mt-1",
											children: t("settings:autoApprove.execute.deniedCommandsDescription"),
										}),
									],
								}),
								_jsxs("div", {
									className: "flex gap-2",
									children: [
										_jsx(Input, {
											value: deniedCommandInput,
											onChange: (e) => setDeniedCommandInput(e.target.value),
											onKeyDown: (e) => {
												if (e.key === "Enter") {
													e.preventDefault()
													handleAddDeniedCommand()
												}
											},
											placeholder: t("settings:autoApprove.execute.deniedCommandPlaceholder"),
											className: "grow",
											"data-testid": "denied-command-input",
										}),
										_jsx(Button, {
											className: "h-8",
											onClick: handleAddDeniedCommand,
											"data-testid": "add-denied-command-button",
											children: t("settings:autoApprove.execute.addButton"),
										}),
									],
								}),
								_jsx("div", {
									className: "flex flex-wrap gap-2",
									children: (deniedCommands ?? []).map((cmd, index) =>
										_jsx(
											Button,
											{
												variant: "secondary",
												"data-testid": `remove-denied-command-${index}`,
												onClick: () => {
													const newCommands = (deniedCommands ?? []).filter(
														(_, i) => i !== index,
													)
													setCachedStateField("deniedCommands", newCommands)
													vscode.postMessage({
														type: "deniedCommands",
														commands: newCommands,
													})
												},
												children: _jsxs("div", {
													className: "flex flex-row items-center gap-1",
													children: [
														_jsx("div", { children: cmd }),
														_jsx(X, { className: "text-foreground scale-75" }),
													],
												}),
											},
											index,
										),
									),
								}),
							],
						}),
				],
			}),
		],
	})
}
//# sourceMappingURL=AutoApproveSettings.js.map
