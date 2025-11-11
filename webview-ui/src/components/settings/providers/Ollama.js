import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime"
import { useState, useCallback, useMemo, useEffect } from "react"
import { useEvent } from "react-use"
import { VSCodeTextField, VSCodeRadioGroup, VSCodeRadio } from "@vscode/webview-ui-toolkit/react"
import { useAppTranslation } from "@src/i18n/TranslationContext"
import { useRouterModels } from "@src/components/ui/hooks/useRouterModels"
import { vscode } from "@src/utils/vscode"
import { inputEventTransform } from "../transforms"
export const Ollama = ({ apiConfiguration, setApiConfigurationField }) => {
	const { t } = useAppTranslation()
	const [ollamaModels, setOllamaModels] = useState({})
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
			case "ollamaModels":
				{
					const newModels = message.ollamaModels ?? {}
					setOllamaModels(newModels)
				}
				break
		}
	}, [])
	useEvent("message", onMessage)
	// Refresh models on mount
	useEffect(() => {
		// Request fresh models - the handler now flushes cache automatically
		vscode.postMessage({ type: "requestOllamaModels" })
	}, [])
	// Check if the selected model exists in the fetched models
	const modelNotAvailable = useMemo(() => {
		const selectedModel = apiConfiguration?.ollamaModelId
		if (!selectedModel) return false
		// Check if model exists in local ollama models
		if (Object.keys(ollamaModels).length > 0 && selectedModel in ollamaModels) {
			return false // Model is available locally
		}
		// If we have router models data for Ollama
		if (routerModels.data?.ollama) {
			const availableModels = Object.keys(routerModels.data.ollama)
			// Show warning if model is not in the list (regardless of how many models there are)
			return !availableModels.includes(selectedModel)
		}
		// If neither source has loaded yet, don't show warning
		return false
	}, [apiConfiguration?.ollamaModelId, routerModels.data, ollamaModels])
	return _jsxs(_Fragment, {
		children: [
			_jsx(VSCodeTextField, {
				value: apiConfiguration?.ollamaBaseUrl || "",
				type: "url",
				onInput: handleInputChange("ollamaBaseUrl"),
				placeholder: t("settings:defaults.ollamaUrl"),
				className: "w-full",
				children: _jsx("label", {
					className: "block font-medium mb-1",
					children: t("settings:providers.ollama.baseUrl"),
				}),
			}),
			apiConfiguration?.ollamaBaseUrl &&
				_jsxs(VSCodeTextField, {
					value: apiConfiguration?.ollamaApiKey || "",
					type: "password",
					onInput: handleInputChange("ollamaApiKey"),
					placeholder: t("settings:placeholders.apiKey"),
					className: "w-full",
					children: [
						_jsx("label", {
							className: "block font-medium mb-1",
							children: t("settings:providers.ollama.apiKey"),
						}),
						_jsx("div", {
							className: "text-xs text-vscode-descriptionForeground mt-1",
							children: t("settings:providers.ollama.apiKeyHelp"),
						}),
					],
				}),
			_jsx(VSCodeTextField, {
				value: apiConfiguration?.ollamaModelId || "",
				onInput: handleInputChange("ollamaModelId"),
				placeholder: t("settings:placeholders.modelId.ollama"),
				className: "w-full",
				children: _jsx("label", {
					className: "block font-medium mb-1",
					children: t("settings:providers.ollama.modelId"),
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
									modelId: apiConfiguration?.ollamaModelId,
								}),
							}),
						],
					}),
				}),
			Object.keys(ollamaModels).length > 0 &&
				_jsx(VSCodeRadioGroup, {
					value:
						(apiConfiguration?.ollamaModelId || "") in ollamaModels ? apiConfiguration?.ollamaModelId : "",
					onChange: handleInputChange("ollamaModelId"),
					children: Object.keys(ollamaModels).map((model) =>
						_jsx(
							VSCodeRadio,
							{ value: model, checked: apiConfiguration?.ollamaModelId === model, children: model },
							model,
						),
					),
				}),
			_jsxs(VSCodeTextField, {
				value: apiConfiguration?.ollamaNumCtx?.toString() || "",
				onInput: (e) => {
					const value = e.target?.value
					if (value === "") {
						setApiConfigurationField("ollamaNumCtx", undefined)
					} else {
						const numValue = parseInt(value, 10)
						if (!isNaN(numValue) && numValue >= 128) {
							setApiConfigurationField("ollamaNumCtx", numValue)
						}
					}
				},
				placeholder: "e.g., 4096",
				className: "w-full",
				children: [
					_jsx("label", {
						className: "block font-medium mb-1",
						children: t("settings:providers.ollama.numCtx"),
					}),
					_jsx("div", {
						className: "text-xs text-vscode-descriptionForeground mt-1",
						children: t("settings:providers.ollama.numCtxHelp"),
					}),
				],
			}),
			_jsxs("div", {
				className: "text-sm text-vscode-descriptionForeground",
				children: [
					t("settings:providers.ollama.description"),
					_jsx("span", {
						className: "text-vscode-errorForeground ml-1",
						children: t("settings:providers.ollama.warning"),
					}),
				],
			}),
		],
	})
}
//# sourceMappingURL=Ollama.js.map
