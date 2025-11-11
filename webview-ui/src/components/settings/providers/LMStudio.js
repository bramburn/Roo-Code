import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime"
import { useCallback, useState, useMemo, useEffect } from "react"
import { useEvent } from "react-use"
import { Trans } from "react-i18next"
import { Checkbox } from "vscrui"
import { VSCodeLink, VSCodeRadio, VSCodeRadioGroup, VSCodeTextField } from "@vscode/webview-ui-toolkit/react"
import { useAppTranslation } from "@src/i18n/TranslationContext"
import { useRouterModels } from "@src/components/ui/hooks/useRouterModels"
import { vscode } from "@src/utils/vscode"
import { inputEventTransform } from "../transforms"
export const LMStudio = ({ apiConfiguration, setApiConfigurationField }) => {
	const { t } = useAppTranslation()
	const [lmStudioModels, setLmStudioModels] = useState({})
	const routerModels = useRouterModels()
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
			case "lmStudioModels":
				{
					const newModels = message.lmStudioModels ?? {}
					setLmStudioModels(newModels)
				}
				break
		}
	}, [])
	useEvent("message", onMessage)
	// Refresh models on mount
	useEffect(() => {
		// Request fresh models - the handler now flushes cache automatically
		vscode.postMessage({ type: "requestLmStudioModels" })
	}, [])
	// Check if the selected model exists in the fetched models
	const modelNotAvailable = useMemo(() => {
		const selectedModel = apiConfiguration?.lmStudioModelId
		if (!selectedModel) return false
		// Check if model exists in local LM Studio models
		if (Object.keys(lmStudioModels).length > 0 && selectedModel in lmStudioModels) {
			return false // Model is available locally
		}
		// If we have router models data for LM Studio
		if (routerModels.data?.lmstudio) {
			const availableModels = Object.keys(routerModels.data.lmstudio)
			// Show warning if model is not in the list (regardless of how many models there are)
			return !availableModels.includes(selectedModel)
		}
		// If neither source has loaded yet, don't show warning
		return false
	}, [apiConfiguration?.lmStudioModelId, routerModels.data, lmStudioModels])
	// Check if the draft model exists
	const draftModelNotAvailable = useMemo(() => {
		const draftModel = apiConfiguration?.lmStudioDraftModelId
		if (!draftModel) return false
		// Check if model exists in local LM Studio models
		if (Object.keys(lmStudioModels).length > 0 && draftModel in lmStudioModels) {
			return false // Model is available locally
		}
		// If we have router models data for LM Studio
		if (routerModels.data?.lmstudio) {
			const availableModels = Object.keys(routerModels.data.lmstudio)
			// Show warning if model is not in the list (regardless of how many models there are)
			return !availableModels.includes(draftModel)
		}
		// If neither source has loaded yet, don't show warning
		return false
	}, [apiConfiguration?.lmStudioDraftModelId, routerModels.data, lmStudioModels])
	return _jsxs(_Fragment, {
		children: [
			_jsx(VSCodeTextField, {
				value: apiConfiguration?.lmStudioBaseUrl || "",
				type: "url",
				onInput: handleInputChange("lmStudioBaseUrl"),
				placeholder: t("settings:defaults.lmStudioUrl"),
				className: "w-full",
				children: _jsx("label", {
					className: "block font-medium mb-1",
					children: t("settings:providers.lmStudio.baseUrl"),
				}),
			}),
			_jsx(VSCodeTextField, {
				value: apiConfiguration?.lmStudioModelId || "",
				onInput: handleInputChange("lmStudioModelId"),
				placeholder: t("settings:placeholders.modelId.lmStudio"),
				className: "w-full",
				children: _jsx("label", {
					className: "block font-medium mb-1",
					children: t("settings:providers.lmStudio.modelId"),
				}),
			}),
			modelNotAvailable &&
				_jsx("div", {
					className: "flex flex-col gap-2 text-vscode-errorForeground text-sm",
					children: _jsxs("div", {
						className: "flex flex-row items-center gap-1",
						children: [
							_jsx("div", { className: "codicon codicon-close" }),
							_jsx("div", {
								children: t("settings:validation.modelAvailability", {
									modelId: apiConfiguration?.lmStudioModelId,
								}),
							}),
						],
					}),
				}),
			Object.keys(lmStudioModels).length > 0 &&
				_jsx(VSCodeRadioGroup, {
					value:
						(apiConfiguration?.lmStudioModelId || "") in lmStudioModels
							? apiConfiguration?.lmStudioModelId
							: "",
					onChange: handleInputChange("lmStudioModelId"),
					children: Object.keys(lmStudioModels).map((model) =>
						_jsx(
							VSCodeRadio,
							{ value: model, checked: apiConfiguration?.lmStudioModelId === model, children: model },
							model,
						),
					),
				}),
			_jsx(Checkbox, {
				checked: apiConfiguration?.lmStudioSpeculativeDecodingEnabled === true,
				onChange: (checked) => {
					setApiConfigurationField("lmStudioSpeculativeDecodingEnabled", checked)
				},
				children: t("settings:providers.lmStudio.speculativeDecoding"),
			}),
			apiConfiguration?.lmStudioSpeculativeDecodingEnabled &&
				_jsxs(_Fragment, {
					children: [
						_jsxs("div", {
							children: [
								_jsx(VSCodeTextField, {
									value: apiConfiguration?.lmStudioDraftModelId || "",
									onInput: handleInputChange("lmStudioDraftModelId"),
									placeholder: t("settings:placeholders.modelId.lmStudioDraft"),
									className: "w-full",
									children: _jsx("label", {
										className: "block font-medium mb-1",
										children: t("settings:providers.lmStudio.draftModelId"),
									}),
								}),
								_jsx("div", {
									className: "text-sm text-vscode-descriptionForeground",
									children: t("settings:providers.lmStudio.draftModelDesc"),
								}),
								draftModelNotAvailable &&
									_jsx("div", {
										className: "flex flex-col gap-2 text-vscode-errorForeground text-sm mt-2",
										children: _jsxs("div", {
											className: "flex flex-row items-center gap-1",
											children: [
												_jsx("div", { className: "codicon codicon-close" }),
												_jsx("div", {
													children: t("settings:validation.modelAvailability", {
														modelId: apiConfiguration?.lmStudioDraftModelId,
													}),
												}),
											],
										}),
									}),
							],
						}),
						Object.keys(lmStudioModels).length > 0 &&
							_jsxs(_Fragment, {
								children: [
									_jsx("div", {
										className: "font-medium",
										children: t("settings:providers.lmStudio.selectDraftModel"),
									}),
									_jsx(VSCodeRadioGroup, {
										value:
											(apiConfiguration?.lmStudioDraftModelId || "") in lmStudioModels
												? apiConfiguration?.lmStudioDraftModelId
												: "",
										onChange: handleInputChange("lmStudioDraftModelId"),
										children: Object.keys(lmStudioModels).map((model) =>
											_jsx(VSCodeRadio, { value: model, children: model }, `draft-${model}`),
										),
									}),
									Object.keys(lmStudioModels).length === 0 &&
										_jsx("div", {
											className: "text-sm rounded-xs p-2",
											style: {
												backgroundColor: "var(--vscode-inputValidation-infoBackground)",
												border: "1px solid var(--vscode-inputValidation-infoBorder)",
												color: "var(--vscode-inputValidation-infoForeground)",
											},
											children: t("settings:providers.lmStudio.noModelsFound"),
										}),
								],
							}),
					],
				}),
			_jsx("div", {
				className: "text-sm text-vscode-descriptionForeground",
				children: _jsx(Trans, {
					i18nKey: "settings:providers.lmStudio.description",
					components: {
						a: _jsx(VSCodeLink, { href: "https://lmstudio.ai/docs" }),
						b: _jsx(VSCodeLink, { href: "https://lmstudio.ai/docs/basics/server" }),
						span: _jsx("span", {
							className: "text-vscode-errorForeground ml-1",
							children: _jsx("span", { className: "font-medium", children: "Note:" }),
						}),
					},
				}),
			}),
		],
	})
}
//# sourceMappingURL=LMStudio.js.map
