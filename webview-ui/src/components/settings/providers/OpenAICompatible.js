import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime"
import { useState, useCallback, useEffect } from "react"
import { useEvent } from "react-use"
import { Checkbox } from "vscrui"
import { VSCodeButton, VSCodeTextField } from "@vscode/webview-ui-toolkit/react"
import { azureOpenAiDefaultApiVersion, openAiModelInfoSaneDefaults } from "@roo-code/types"
import { useAppTranslation } from "@src/i18n/TranslationContext"
import { Button, StandardTooltip } from "@src/components/ui"
import { convertHeadersToObject } from "../utils/headers"
import { inputEventTransform, noTransform } from "../transforms"
import { ModelPicker } from "../ModelPicker"
import { R1FormatSetting } from "../R1FormatSetting"
import { ThinkingBudget } from "../ThinkingBudget"
export const OpenAICompatible = ({
	apiConfiguration,
	setApiConfigurationField,
	organizationAllowList,
	modelValidationError,
}) => {
	const { t } = useAppTranslation()
	const [azureApiVersionSelected, setAzureApiVersionSelected] = useState(!!apiConfiguration?.azureApiVersion)
	const [openAiLegacyFormatSelected, setOpenAiLegacyFormatSelected] = useState(!!apiConfiguration?.openAiLegacyFormat)
	const [openAiModels, setOpenAiModels] = useState(null)
	const [customHeaders, setCustomHeaders] = useState(() => {
		const headers = apiConfiguration?.openAiHeaders || {}
		return Object.entries(headers)
	})
	const handleAddCustomHeader = useCallback(() => {
		// Only update the local state to show the new row in the UI.
		setCustomHeaders((prev) => [...prev, ["", ""]])
		// Do not update the main configuration yet, wait for user input.
	}, [])
	const handleUpdateHeaderKey = useCallback((index, newKey) => {
		setCustomHeaders((prev) => {
			const updated = [...prev]
			if (updated[index]) {
				updated[index] = [newKey, updated[index][1]]
			}
			return updated
		})
	}, [])
	const handleUpdateHeaderValue = useCallback((index, newValue) => {
		setCustomHeaders((prev) => {
			const updated = [...prev]
			if (updated[index]) {
				updated[index] = [updated[index][0], newValue]
			}
			return updated
		})
	}, [])
	const handleRemoveCustomHeader = useCallback((index) => {
		setCustomHeaders((prev) => prev.filter((_, i) => i !== index))
	}, [])
	// Helper to convert array of tuples to object
	// Add effect to update the parent component's state when local headers change
	useEffect(() => {
		const timer = setTimeout(() => {
			const headerObject = convertHeadersToObject(customHeaders)
			setApiConfigurationField("openAiHeaders", headerObject)
		}, 300)
		return () => clearTimeout(timer)
	}, [customHeaders, setApiConfigurationField])
	const handleInputChange = useCallback(
		(field, transform = inputEventTransform) =>
			(event) => {
				setApiConfigurationField(field, transform(event))
			},
		[setApiConfigurationField],
	)
	const onMessage = useCallback((event) => {
		const message = event.data
		switch (message.type) {
			case "openAiModels": {
				const updatedModels = message.openAiModels ?? []
				setOpenAiModels(Object.fromEntries(updatedModels.map((item) => [item, openAiModelInfoSaneDefaults])))
				break
			}
		}
	}, [])
	useEvent("message", onMessage)
	return _jsxs(_Fragment, {
		children: [
			_jsx(VSCodeTextField, {
				value: apiConfiguration?.openAiBaseUrl || "",
				type: "url",
				onInput: handleInputChange("openAiBaseUrl"),
				placeholder: t("settings:placeholders.baseUrl"),
				className: "w-full",
				children: _jsx("label", {
					className: "block font-medium mb-1",
					children: t("settings:providers.openAiBaseUrl"),
				}),
			}),
			_jsx(VSCodeTextField, {
				value: apiConfiguration?.openAiApiKey || "",
				type: "password",
				onInput: handleInputChange("openAiApiKey"),
				placeholder: t("settings:placeholders.apiKey"),
				className: "w-full",
				children: _jsx("label", {
					className: "block font-medium mb-1",
					children: t("settings:providers.apiKey"),
				}),
			}),
			_jsx(ModelPicker, {
				apiConfiguration: apiConfiguration,
				setApiConfigurationField: setApiConfigurationField,
				defaultModelId: "gpt-4o",
				models: openAiModels,
				modelIdKey: "openAiModelId",
				serviceName: "OpenAI",
				serviceUrl: "https://platform.openai.com",
				organizationAllowList: organizationAllowList,
				errorMessage: modelValidationError,
			}),
			_jsx(R1FormatSetting, {
				onChange: handleInputChange("openAiR1FormatEnabled", noTransform),
				openAiR1FormatEnabled: apiConfiguration?.openAiR1FormatEnabled ?? false,
			}),
			_jsx("div", {
				children: _jsx(Checkbox, {
					checked: openAiLegacyFormatSelected,
					onChange: (checked) => {
						setOpenAiLegacyFormatSelected(checked)
						setApiConfigurationField("openAiLegacyFormat", checked)
					},
					children: t("settings:providers.useLegacyFormat"),
				}),
			}),
			_jsx(Checkbox, {
				checked: apiConfiguration?.openAiStreamingEnabled ?? true,
				onChange: handleInputChange("openAiStreamingEnabled", noTransform),
				children: t("settings:modelInfo.enableStreaming"),
			}),
			_jsxs("div", {
				children: [
					_jsx(Checkbox, {
						checked: apiConfiguration?.includeMaxTokens ?? true,
						onChange: handleInputChange("includeMaxTokens", noTransform),
						children: t("settings:includeMaxOutputTokens"),
					}),
					_jsx("div", {
						className: "text-sm text-vscode-descriptionForeground ml-6",
						children: t("settings:includeMaxOutputTokensDescription"),
					}),
				],
			}),
			_jsx(Checkbox, {
				checked: apiConfiguration?.openAiUseAzure ?? false,
				onChange: handleInputChange("openAiUseAzure", noTransform),
				children: t("settings:modelInfo.useAzure"),
			}),
			_jsxs("div", {
				children: [
					_jsx(Checkbox, {
						checked: azureApiVersionSelected,
						onChange: (checked) => {
							setAzureApiVersionSelected(checked)
							if (!checked) {
								setApiConfigurationField("azureApiVersion", "")
							}
						},
						children: t("settings:modelInfo.azureApiVersion"),
					}),
					azureApiVersionSelected &&
						_jsx(VSCodeTextField, {
							value: apiConfiguration?.azureApiVersion || "",
							onInput: handleInputChange("azureApiVersion"),
							placeholder: `Default: ${azureOpenAiDefaultApiVersion}`,
							className: "w-full mt-1",
						}),
				],
			}),
			_jsxs("div", {
				className: "mb-4",
				children: [
					_jsxs("div", {
						className: "flex justify-between items-center mb-2",
						children: [
							_jsx("label", {
								className: "block font-medium",
								children: t("settings:providers.customHeaders"),
							}),
							_jsx(StandardTooltip, {
								content: t("settings:common.add"),
								children: _jsx(VSCodeButton, {
									appearance: "icon",
									onClick: handleAddCustomHeader,
									children: _jsx("span", { className: "codicon codicon-add" }),
								}),
							}),
						],
					}),
					!customHeaders.length
						? _jsx("div", {
								className: "text-sm text-vscode-descriptionForeground",
								children: t("settings:providers.noCustomHeaders"),
							})
						: customHeaders.map(([key, value], index) =>
								_jsxs(
									"div",
									{
										className: "flex items-center mb-2",
										children: [
											_jsx(VSCodeTextField, {
												value: key,
												className: "flex-1 mr-2",
												placeholder: t("settings:providers.headerName"),
												onInput: (e) => handleUpdateHeaderKey(index, e.target.value),
											}),
											_jsx(VSCodeTextField, {
												value: value,
												className: "flex-1 mr-2",
												placeholder: t("settings:providers.headerValue"),
												onInput: (e) => handleUpdateHeaderValue(index, e.target.value),
											}),
											_jsx(StandardTooltip, {
												content: t("settings:common.remove"),
												children: _jsx(VSCodeButton, {
													appearance: "icon",
													onClick: () => handleRemoveCustomHeader(index),
													children: _jsx("span", { className: "codicon codicon-trash" }),
												}),
											}),
										],
									},
									index,
								),
							),
				],
			}),
			_jsxs("div", {
				className: "flex flex-col gap-1",
				children: [
					_jsx(Checkbox, {
						checked: apiConfiguration.enableReasoningEffort ?? false,
						onChange: (checked) => {
							setApiConfigurationField("enableReasoningEffort", checked)
							if (!checked) {
								const { reasoningEffort: _, ...openAiCustomModelInfo } =
									apiConfiguration.openAiCustomModelInfo || openAiModelInfoSaneDefaults
								setApiConfigurationField("openAiCustomModelInfo", openAiCustomModelInfo)
							}
						},
						children: t("settings:providers.setReasoningLevel"),
					}),
					!!apiConfiguration.enableReasoningEffort &&
						_jsx(ThinkingBudget, {
							apiConfiguration: {
								...apiConfiguration,
								reasoningEffort: apiConfiguration.openAiCustomModelInfo?.reasoningEffort,
							},
							setApiConfigurationField: (field, value) => {
								if (field === "reasoningEffort") {
									const openAiCustomModelInfo =
										apiConfiguration.openAiCustomModelInfo || openAiModelInfoSaneDefaults
									setApiConfigurationField("openAiCustomModelInfo", {
										...openAiCustomModelInfo,
										reasoningEffort: value,
									})
								}
							},
							modelInfo: {
								...(apiConfiguration.openAiCustomModelInfo || openAiModelInfoSaneDefaults),
								supportsReasoningEffort: true,
							},
						}),
				],
			}),
			_jsxs("div", {
				className: "flex flex-col gap-3",
				children: [
					_jsx("div", {
						className: "text-sm text-vscode-descriptionForeground whitespace-pre-line",
						children: t("settings:providers.customModel.capabilities"),
					}),
					_jsxs("div", {
						children: [
							_jsx(VSCodeTextField, {
								value:
									apiConfiguration?.openAiCustomModelInfo?.maxTokens?.toString() ||
									openAiModelInfoSaneDefaults.maxTokens?.toString() ||
									"",
								type: "text",
								style: {
									borderColor: (() => {
										const value = apiConfiguration?.openAiCustomModelInfo?.maxTokens
										if (!value) {
											return "var(--vscode-input-border)"
										}
										return value > 0
											? "var(--vscode-charts-green)"
											: "var(--vscode-errorForeground)"
									})(),
								},
								onInput: handleInputChange("openAiCustomModelInfo", (e) => {
									const value = parseInt(e.target.value)
									return {
										...(apiConfiguration?.openAiCustomModelInfo || openAiModelInfoSaneDefaults),
										maxTokens: isNaN(value) ? undefined : value,
									}
								}),
								placeholder: t("settings:placeholders.numbers.maxTokens"),
								className: "w-full",
								children: _jsx("label", {
									className: "block font-medium mb-1",
									children: t("settings:providers.customModel.maxTokens.label"),
								}),
							}),
							_jsx("div", {
								className: "text-sm text-vscode-descriptionForeground",
								children: t("settings:providers.customModel.maxTokens.description"),
							}),
						],
					}),
					_jsxs("div", {
						children: [
							_jsx(VSCodeTextField, {
								value:
									apiConfiguration?.openAiCustomModelInfo?.contextWindow?.toString() ||
									openAiModelInfoSaneDefaults.contextWindow?.toString() ||
									"",
								type: "text",
								style: {
									borderColor: (() => {
										const value = apiConfiguration?.openAiCustomModelInfo?.contextWindow
										if (!value) {
											return "var(--vscode-input-border)"
										}
										return value > 0
											? "var(--vscode-charts-green)"
											: "var(--vscode-errorForeground)"
									})(),
								},
								onInput: handleInputChange("openAiCustomModelInfo", (e) => {
									const value = e.target.value
									const parsed = parseInt(value)
									return {
										...(apiConfiguration?.openAiCustomModelInfo || openAiModelInfoSaneDefaults),
										contextWindow: isNaN(parsed)
											? openAiModelInfoSaneDefaults.contextWindow
											: parsed,
									}
								}),
								placeholder: t("settings:placeholders.numbers.contextWindow"),
								className: "w-full",
								children: _jsx("label", {
									className: "block font-medium mb-1",
									children: t("settings:providers.customModel.contextWindow.label"),
								}),
							}),
							_jsx("div", {
								className: "text-sm text-vscode-descriptionForeground",
								children: t("settings:providers.customModel.contextWindow.description"),
							}),
						],
					}),
					_jsxs("div", {
						children: [
							_jsxs("div", {
								className: "flex items-center gap-1",
								children: [
									_jsx(Checkbox, {
										checked:
											apiConfiguration?.openAiCustomModelInfo?.supportsImages ??
											openAiModelInfoSaneDefaults.supportsImages,
										onChange: handleInputChange("openAiCustomModelInfo", (checked) => {
											return {
												...(apiConfiguration?.openAiCustomModelInfo ||
													openAiModelInfoSaneDefaults),
												supportsImages: checked,
											}
										}),
										children: _jsx("span", {
											className: "font-medium",
											children: t("settings:providers.customModel.imageSupport.label"),
										}),
									}),
									_jsx(StandardTooltip, {
										content: t("settings:providers.customModel.imageSupport.description"),
										children: _jsx("i", {
											className: "codicon codicon-info text-vscode-descriptionForeground",
											style: { fontSize: "12px" },
										}),
									}),
								],
							}),
							_jsx("div", {
								className: "text-sm text-vscode-descriptionForeground pt-1",
								children: t("settings:providers.customModel.imageSupport.description"),
							}),
						],
					}),
					_jsxs("div", {
						children: [
							_jsxs("div", {
								className: "flex items-center gap-1",
								children: [
									_jsx(Checkbox, {
										checked: apiConfiguration?.openAiCustomModelInfo?.supportsPromptCache ?? false,
										onChange: handleInputChange("openAiCustomModelInfo", (checked) => {
											return {
												...(apiConfiguration?.openAiCustomModelInfo ||
													openAiModelInfoSaneDefaults),
												supportsPromptCache: checked,
											}
										}),
										children: _jsx("span", {
											className: "font-medium",
											children: t("settings:providers.customModel.promptCache.label"),
										}),
									}),
									_jsx(StandardTooltip, {
										content: t("settings:providers.customModel.promptCache.description"),
										children: _jsx("i", {
											className: "codicon codicon-info text-vscode-descriptionForeground",
											style: { fontSize: "12px" },
										}),
									}),
								],
							}),
							_jsx("div", {
								className: "text-sm text-vscode-descriptionForeground pt-1",
								children: t("settings:providers.customModel.promptCache.description"),
							}),
						],
					}),
					_jsx("div", {
						children: _jsx(VSCodeTextField, {
							value:
								apiConfiguration?.openAiCustomModelInfo?.inputPrice?.toString() ??
								openAiModelInfoSaneDefaults.inputPrice?.toString() ??
								"",
							type: "text",
							style: {
								borderColor: (() => {
									const value = apiConfiguration?.openAiCustomModelInfo?.inputPrice
									if (!value && value !== 0) {
										return "var(--vscode-input-border)"
									}
									return value >= 0 ? "var(--vscode-charts-green)" : "var(--vscode-errorForeground)"
								})(),
							},
							onChange: handleInputChange("openAiCustomModelInfo", (e) => {
								const value = e.target.value
								const parsed = parseFloat(value)
								return {
									...(apiConfiguration?.openAiCustomModelInfo ?? openAiModelInfoSaneDefaults),
									inputPrice: isNaN(parsed) ? openAiModelInfoSaneDefaults.inputPrice : parsed,
								}
							}),
							placeholder: t("settings:placeholders.numbers.inputPrice"),
							className: "w-full",
							children: _jsxs("div", {
								className: "flex items-center gap-1",
								children: [
									_jsx("label", {
										className: "block font-medium mb-1",
										children: t("settings:providers.customModel.pricing.input.label"),
									}),
									_jsx(StandardTooltip, {
										content: t("settings:providers.customModel.pricing.input.description"),
										children: _jsx("i", {
											className: "codicon codicon-info text-vscode-descriptionForeground",
											style: { fontSize: "12px" },
										}),
									}),
								],
							}),
						}),
					}),
					_jsx("div", {
						children: _jsx(VSCodeTextField, {
							value:
								apiConfiguration?.openAiCustomModelInfo?.outputPrice?.toString() ||
								openAiModelInfoSaneDefaults.outputPrice?.toString() ||
								"",
							type: "text",
							style: {
								borderColor: (() => {
									const value = apiConfiguration?.openAiCustomModelInfo?.outputPrice
									if (!value && value !== 0) {
										return "var(--vscode-input-border)"
									}
									return value >= 0 ? "var(--vscode-charts-green)" : "var(--vscode-errorForeground)"
								})(),
							},
							onChange: handleInputChange("openAiCustomModelInfo", (e) => {
								const value = e.target.value
								const parsed = parseFloat(value)
								return {
									...(apiConfiguration?.openAiCustomModelInfo || openAiModelInfoSaneDefaults),
									outputPrice: isNaN(parsed) ? openAiModelInfoSaneDefaults.outputPrice : parsed,
								}
							}),
							placeholder: t("settings:placeholders.numbers.outputPrice"),
							className: "w-full",
							children: _jsxs("div", {
								className: "flex items-center gap-1",
								children: [
									_jsx("label", {
										className: "block font-medium mb-1",
										children: t("settings:providers.customModel.pricing.output.label"),
									}),
									_jsx(StandardTooltip, {
										content: t("settings:providers.customModel.pricing.output.description"),
										children: _jsx("i", {
											className: "codicon codicon-info text-vscode-descriptionForeground",
											style: { fontSize: "12px" },
										}),
									}),
								],
							}),
						}),
					}),
					apiConfiguration?.openAiCustomModelInfo?.supportsPromptCache &&
						_jsxs(_Fragment, {
							children: [
								_jsx("div", {
									children: _jsx(VSCodeTextField, {
										value:
											apiConfiguration?.openAiCustomModelInfo?.cacheReadsPrice?.toString() ?? "0",
										type: "text",
										style: {
											borderColor: (() => {
												const value = apiConfiguration?.openAiCustomModelInfo?.cacheReadsPrice
												if (!value && value !== 0) {
													return "var(--vscode-input-border)"
												}
												return value >= 0
													? "var(--vscode-charts-green)"
													: "var(--vscode-errorForeground)"
											})(),
										},
										onChange: handleInputChange("openAiCustomModelInfo", (e) => {
											const value = e.target.value
											const parsed = parseFloat(value)
											return {
												...(apiConfiguration?.openAiCustomModelInfo ??
													openAiModelInfoSaneDefaults),
												cacheReadsPrice: isNaN(parsed) ? 0 : parsed,
											}
										}),
										placeholder: t("settings:placeholders.numbers.inputPrice"),
										className: "w-full",
										children: _jsxs("div", {
											className: "flex items-center gap-1",
											children: [
												_jsx("span", {
													className: "font-medium",
													children: t(
														"settings:providers.customModel.pricing.cacheReads.label",
													),
												}),
												_jsx(StandardTooltip, {
													content: t(
														"settings:providers.customModel.pricing.cacheReads.description",
													),
													children: _jsx("i", {
														className:
															"codicon codicon-info text-vscode-descriptionForeground",
														style: { fontSize: "12px" },
													}),
												}),
											],
										}),
									}),
								}),
								_jsx("div", {
									children: _jsx(VSCodeTextField, {
										value:
											apiConfiguration?.openAiCustomModelInfo?.cacheWritesPrice?.toString() ??
											"0",
										type: "text",
										style: {
											borderColor: (() => {
												const value = apiConfiguration?.openAiCustomModelInfo?.cacheWritesPrice
												if (!value && value !== 0) {
													return "var(--vscode-input-border)"
												}
												return value >= 0
													? "var(--vscode-charts-green)"
													: "var(--vscode-errorForeground)"
											})(),
										},
										onChange: handleInputChange("openAiCustomModelInfo", (e) => {
											const value = e.target.value
											const parsed = parseFloat(value)
											return {
												...(apiConfiguration?.openAiCustomModelInfo ??
													openAiModelInfoSaneDefaults),
												cacheWritesPrice: isNaN(parsed) ? 0 : parsed,
											}
										}),
										placeholder: t("settings:placeholders.numbers.cacheWritePrice"),
										className: "w-full",
										children: _jsxs("div", {
											className: "flex items-center gap-1",
											children: [
												_jsx("label", {
													className: "block font-medium mb-1",
													children: t(
														"settings:providers.customModel.pricing.cacheWrites.label",
													),
												}),
												_jsx(StandardTooltip, {
													content: t(
														"settings:providers.customModel.pricing.cacheWrites.description",
													),
													children: _jsx("i", {
														className:
															"codicon codicon-info text-vscode-descriptionForeground",
														style: { fontSize: "12px" },
													}),
												}),
											],
										}),
									}),
								}),
							],
						}),
					_jsx(Button, {
						variant: "secondary",
						onClick: () => setApiConfigurationField("openAiCustomModelInfo", openAiModelInfoSaneDefaults),
						children: t("settings:providers.customModel.resetDefaults"),
					}),
				],
			}),
		],
	})
}
//# sourceMappingURL=OpenAICompatible.js.map
