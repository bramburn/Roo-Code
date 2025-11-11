import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime"
import { useState, useCallback } from "react"
import { useAppTranslation } from "@/i18n/TranslationContext"
import { vscode } from "@/utils/vscode"
import { SquareTerminal } from "lucide-react"
import { VSCodeCheckbox, VSCodeLink } from "@vscode/webview-ui-toolkit/react"
import { Trans } from "react-i18next"
import { buildDocLink } from "@src/utils/docLinks"
import { useEvent, useMount } from "react-use"
import { cn } from "@/lib/utils"
import { Slider } from "@/components/ui"
import { SectionHeader } from "./SectionHeader"
import { Section } from "./Section"
export const TerminalSettings = ({
	terminalOutputLineLimit,
	terminalOutputCharacterLimit,
	terminalShellIntegrationTimeout,
	terminalShellIntegrationDisabled,
	terminalCommandDelay,
	terminalPowershellCounter,
	terminalZshClearEolMark,
	terminalZshOhMy,
	terminalZshP10k,
	terminalZdotdir,
	terminalCompressProgressBar,
	setCachedStateField,
	className,
	...props
}) => {
	const { t } = useAppTranslation()
	const [inheritEnv, setInheritEnv] = useState(true)
	useMount(() => vscode.postMessage({ type: "getVSCodeSetting", setting: "terminal.integrated.inheritEnv" }))
	const onMessage = useCallback((event) => {
		const message = event.data
		switch (message.type) {
			case "vsCodeSetting":
				switch (message.setting) {
					case "terminal.integrated.inheritEnv":
						setInheritEnv(message.value ?? true)
						break
					default:
						break
				}
				break
			default:
				break
		}
	}, [])
	useEvent("message", onMessage)
	return _jsxs("div", {
		className: cn("flex flex-col", className),
		...props,
		children: [
			_jsx(SectionHeader, {
				children: _jsxs("div", {
					className: "flex items-center gap-2",
					children: [
						_jsx(SquareTerminal, { className: "w-4" }),
						_jsx("div", { children: t("settings:sections.terminal") }),
					],
				}),
			}),
			_jsxs(Section, {
				children: [
					_jsxs("div", {
						className: "flex flex-col gap-3",
						children: [
							_jsx("div", {
								className: "flex flex-col gap-1",
								children: _jsxs("div", {
									className: "flex items-center gap-2 font-bold",
									children: [
										_jsx("span", { className: "codicon codicon-settings-gear" }),
										_jsx("div", { children: t("settings:terminal.basic.label") }),
									],
								}),
							}),
							_jsxs("div", {
								className: "flex flex-col gap-3 pl-3 border-l-2 border-vscode-button-background",
								children: [
									_jsxs("div", {
										children: [
											_jsx("label", {
												className: "block font-medium mb-1",
												children: t("settings:terminal.outputLineLimit.label"),
											}),
											_jsxs("div", {
												className: "flex items-center gap-2",
												children: [
													_jsx(Slider, {
														min: 100,
														max: 5000,
														step: 100,
														value: [terminalOutputLineLimit ?? 500],
														onValueChange: ([value]) =>
															setCachedStateField("terminalOutputLineLimit", value),
														"data-testid": "terminal-output-limit-slider",
													}),
													_jsx("span", {
														className: "w-10",
														children: terminalOutputLineLimit ?? 500,
													}),
												],
											}),
											_jsx("div", {
												className: "text-vscode-descriptionForeground text-sm mt-1",
												children: _jsx(Trans, {
													i18nKey: "settings:terminal.outputLineLimit.description",
													children: _jsx(VSCodeLink, {
														href: buildDocLink(
															"features/shell-integration#terminal-output-limit",
															"settings_terminal_output_limit",
														),
														style: { display: "inline" },
														children: " ",
													}),
												}),
											}),
										],
									}),
									_jsxs("div", {
										children: [
											_jsx("label", {
												className: "block font-medium mb-1",
												children: t("settings:terminal.outputCharacterLimit.label"),
											}),
											_jsxs("div", {
												className: "flex items-center gap-2",
												children: [
													_jsx(Slider, {
														min: 1000,
														max: 100000,
														step: 1000,
														value: [terminalOutputCharacterLimit ?? 50000],
														onValueChange: ([value]) =>
															setCachedStateField("terminalOutputCharacterLimit", value),
														"data-testid": "terminal-output-character-limit-slider",
													}),
													_jsx("span", {
														className: "w-16",
														children: terminalOutputCharacterLimit ?? 50000,
													}),
												],
											}),
											_jsx("div", {
												className: "text-vscode-descriptionForeground text-sm mt-1",
												children: _jsx(Trans, {
													i18nKey: "settings:terminal.outputCharacterLimit.description",
													children: _jsx(VSCodeLink, {
														href: buildDocLink(
															"features/shell-integration#terminal-output-limit",
															"settings_terminal_output_character_limit",
														),
														style: { display: "inline" },
														children: " ",
													}),
												}),
											}),
										],
									}),
									_jsxs("div", {
										children: [
											_jsx(VSCodeCheckbox, {
												checked: terminalCompressProgressBar ?? true,
												onChange: (e) =>
													setCachedStateField(
														"terminalCompressProgressBar",
														e.target.checked,
													),
												"data-testid": "terminal-compress-progress-bar-checkbox",
												children: _jsx("span", {
													className: "font-medium",
													children: t("settings:terminal.compressProgressBar.label"),
												}),
											}),
											_jsx("div", {
												className: "text-vscode-descriptionForeground text-sm mt-1",
												children: _jsx(Trans, {
													i18nKey: "settings:terminal.compressProgressBar.description",
													children: _jsx(VSCodeLink, {
														href: buildDocLink(
															"features/shell-integration#compress-progress-bar-output",
															"settings_terminal_compress_progress_bar",
														),
														style: { display: "inline" },
														children: " ",
													}),
												}),
											}),
										],
									}),
								],
							}),
						],
					}),
					_jsxs("div", {
						className: "flex flex-col gap-3",
						children: [
							_jsxs("div", {
								className: "flex flex-col gap-1",
								children: [
									_jsxs("div", {
										className: "flex items-center gap-2 font-bold",
										children: [
											_jsx("span", { className: "codicon codicon-tools" }),
											_jsx("div", { children: t("settings:terminal.advanced.label") }),
										],
									}),
									_jsx("div", {
										className: "text-vscode-descriptionForeground",
										children: t("settings:terminal.advanced.description"),
									}),
								],
							}),
							_jsxs("div", {
								className: "flex flex-col gap-3 pl-3 border-l-2 border-vscode-button-background",
								children: [
									_jsxs("div", {
										children: [
											_jsx(VSCodeCheckbox, {
												checked: terminalShellIntegrationDisabled ?? true,
												onChange: (e) =>
													setCachedStateField(
														"terminalShellIntegrationDisabled",
														e.target.checked,
													),
												children: _jsx("span", {
													className: "font-medium",
													children: t("settings:terminal.shellIntegrationDisabled.label"),
												}),
											}),
											_jsx("div", {
												className: "text-vscode-descriptionForeground text-sm mt-1",
												children: _jsx(Trans, {
													i18nKey: "settings:terminal.shellIntegrationDisabled.description",
													children: _jsx(VSCodeLink, {
														href: buildDocLink(
															"features/shell-integration#use-inline-terminal-recommended",
															"settings_terminal_shell_integration_disabled",
														),
														style: { display: "inline" },
														children: " ",
													}),
												}),
											}),
										],
									}),
									!terminalShellIntegrationDisabled &&
										_jsxs(_Fragment, {
											children: [
												_jsxs("div", {
													children: [
														_jsx(VSCodeCheckbox, {
															checked: inheritEnv,
															onChange: (e) => {
																setInheritEnv(e.target.checked)
																vscode.postMessage({
																	type: "updateVSCodeSetting",
																	setting: "terminal.integrated.inheritEnv",
																	value: e.target.checked,
																})
															},
															"data-testid": "terminal-inherit-env-checkbox",
															children: _jsx("span", {
																className: "font-medium",
																children: t("settings:terminal.inheritEnv.label"),
															}),
														}),
														_jsx("div", {
															className: "text-vscode-descriptionForeground text-sm mt-1",
															children: _jsx(Trans, {
																i18nKey: "settings:terminal.inheritEnv.description",
																children: _jsx(VSCodeLink, {
																	href: buildDocLink(
																		"features/shell-integration#inherit-environment-variables",
																		"settings_terminal_inherit_env",
																	),
																	style: { display: "inline" },
																	children: " ",
																}),
															}),
														}),
													],
												}),
												_jsxs("div", {
													children: [
														_jsx("label", {
															className: "block font-medium mb-1",
															children: t(
																"settings:terminal.shellIntegrationTimeout.label",
															),
														}),
														_jsxs("div", {
															className: "flex items-center gap-2",
															children: [
																_jsx(Slider, {
																	min: 1000,
																	max: 60000,
																	step: 1000,
																	value: [terminalShellIntegrationTimeout ?? 5000],
																	onValueChange: ([value]) =>
																		setCachedStateField(
																			"terminalShellIntegrationTimeout",
																			Math.min(60000, Math.max(1000, value)),
																		),
																}),
																_jsxs("span", {
																	className: "w-10",
																	children: [
																		(terminalShellIntegrationTimeout ?? 5000) /
																			1000,
																		"s",
																	],
																}),
															],
														}),
														_jsx("div", {
															className: "text-vscode-descriptionForeground text-sm mt-1",
															children: _jsx(Trans, {
																i18nKey:
																	"settings:terminal.shellIntegrationTimeout.description",
																children: _jsx(VSCodeLink, {
																	href: buildDocLink(
																		"features/shell-integration#terminal-shell-integration-timeout",
																		"settings_terminal_shell_integration_timeout",
																	),
																	style: { display: "inline" },
																	children: " ",
																}),
															}),
														}),
													],
												}),
												_jsxs("div", {
													children: [
														_jsx("label", {
															className: "block font-medium mb-1",
															children: t("settings:terminal.commandDelay.label"),
														}),
														_jsxs("div", {
															className: "flex items-center gap-2",
															children: [
																_jsx(Slider, {
																	min: 0,
																	max: 1000,
																	step: 10,
																	value: [terminalCommandDelay ?? 0],
																	onValueChange: ([value]) =>
																		setCachedStateField(
																			"terminalCommandDelay",
																			Math.min(1000, Math.max(0, value)),
																		),
																}),
																_jsxs("span", {
																	className: "w-10",
																	children: [terminalCommandDelay ?? 50, "ms"],
																}),
															],
														}),
														_jsx("div", {
															className: "text-vscode-descriptionForeground text-sm mt-1",
															children: _jsx(Trans, {
																i18nKey: "settings:terminal.commandDelay.description",
																children: _jsx(VSCodeLink, {
																	href: buildDocLink(
																		"features/shell-integration#terminal-command-delay",
																		"settings_terminal_command_delay",
																	),
																	style: { display: "inline" },
																	children: " ",
																}),
															}),
														}),
													],
												}),
												_jsxs("div", {
													children: [
														_jsx(VSCodeCheckbox, {
															checked: terminalPowershellCounter ?? false,
															onChange: (e) =>
																setCachedStateField(
																	"terminalPowershellCounter",
																	e.target.checked,
																),
															"data-testid": "terminal-powershell-counter-checkbox",
															children: _jsx("span", {
																className: "font-medium",
																children: t(
																	"settings:terminal.powershellCounter.label",
																),
															}),
														}),
														_jsx("div", {
															className: "text-vscode-descriptionForeground text-sm mt-1",
															children: _jsx(Trans, {
																i18nKey:
																	"settings:terminal.powershellCounter.description",
																children: _jsx(VSCodeLink, {
																	href: buildDocLink(
																		"features/shell-integration#enable-powershell-counter-workaround",
																		"settings_terminal_powershell_counter",
																	),
																	style: { display: "inline" },
																	children: " ",
																}),
															}),
														}),
													],
												}),
												_jsxs("div", {
													children: [
														_jsx(VSCodeCheckbox, {
															checked: terminalZshClearEolMark ?? true,
															onChange: (e) =>
																setCachedStateField(
																	"terminalZshClearEolMark",
																	e.target.checked,
																),
															"data-testid": "terminal-zsh-clear-eol-mark-checkbox",
															children: _jsx("span", {
																className: "font-medium",
																children: t("settings:terminal.zshClearEolMark.label"),
															}),
														}),
														_jsx("div", {
															className: "text-vscode-descriptionForeground text-sm mt-1",
															children: _jsx(Trans, {
																i18nKey:
																	"settings:terminal.zshClearEolMark.description",
																children: _jsx(VSCodeLink, {
																	href: buildDocLink(
																		"features/shell-integration#clear-zsh-eol-mark",
																		"settings_terminal_zsh_clear_eol_mark",
																	),
																	style: { display: "inline" },
																	children: " ",
																}),
															}),
														}),
													],
												}),
												_jsxs("div", {
													children: [
														_jsx(VSCodeCheckbox, {
															checked: terminalZshOhMy ?? false,
															onChange: (e) =>
																setCachedStateField(
																	"terminalZshOhMy",
																	e.target.checked,
																),
															"data-testid": "terminal-zsh-oh-my-checkbox",
															children: _jsx("span", {
																className: "font-medium",
																children: t("settings:terminal.zshOhMy.label"),
															}),
														}),
														_jsx("div", {
															className: "text-vscode-descriptionForeground text-sm mt-1",
															children: _jsx(Trans, {
																i18nKey: "settings:terminal.zshOhMy.description",
																children: _jsx(VSCodeLink, {
																	href: buildDocLink(
																		"features/shell-integration#enable-oh-my-zsh-integration",
																		"settings_terminal_zsh_oh_my",
																	),
																	style: { display: "inline" },
																	children: " ",
																}),
															}),
														}),
													],
												}),
												_jsxs("div", {
													children: [
														_jsx(VSCodeCheckbox, {
															checked: terminalZshP10k ?? false,
															onChange: (e) =>
																setCachedStateField(
																	"terminalZshP10k",
																	e.target.checked,
																),
															"data-testid": "terminal-zsh-p10k-checkbox",
															children: _jsx("span", {
																className: "font-medium",
																children: t("settings:terminal.zshP10k.label"),
															}),
														}),
														_jsx("div", {
															className: "text-vscode-descriptionForeground text-sm mt-1",
															children: _jsx(Trans, {
																i18nKey: "settings:terminal.zshP10k.description",
																children: _jsx(VSCodeLink, {
																	href: buildDocLink(
																		"features/shell-integration#enable-powerlevel10k-integration",
																		"settings_terminal_zsh_p10k",
																	),
																	style: { display: "inline" },
																	children: " ",
																}),
															}),
														}),
													],
												}),
												_jsxs("div", {
													children: [
														_jsx(VSCodeCheckbox, {
															checked: terminalZdotdir ?? false,
															onChange: (e) =>
																setCachedStateField(
																	"terminalZdotdir",
																	e.target.checked,
																),
															"data-testid": "terminal-zdotdir-checkbox",
															children: _jsx("span", {
																className: "font-medium",
																children: t("settings:terminal.zdotdir.label"),
															}),
														}),
														_jsx("div", {
															className: "text-vscode-descriptionForeground text-sm mt-1",
															children: _jsx(Trans, {
																i18nKey: "settings:terminal.zdotdir.description",
																children: _jsx(VSCodeLink, {
																	href: buildDocLink(
																		"features/shell-integration#enable-zdotdir-handling",
																		"settings_terminal_zdotdir",
																	),
																	style: { display: "inline" },
																	children: " ",
																}),
															}),
														}),
													],
												}),
											],
										}),
								],
							}),
						],
					}),
				],
			}),
		],
	})
}
//# sourceMappingURL=TerminalSettings.js.map
