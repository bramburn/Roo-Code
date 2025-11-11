import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime"
import { useState, useEffect } from "react"
import { VSCodeCheckbox, VSCodeTextField, VSCodeDropdown, VSCodeOption } from "@vscode/webview-ui-toolkit/react"
import { useAppTranslation } from "@/i18n/TranslationContext"
// Hardcoded list of image generation models
const IMAGE_GENERATION_MODELS = [
	{ value: "google/gemini-2.5-flash-image", label: "Gemini 2.5 Flash Image" },
	{ value: "openai/gpt-5-image", label: "GPT-5 Image" },
	{ value: "openai/gpt-5-image-mini", label: "GPT-5 Image Mini" },
	// Add more models as they become available
]
export const ImageGenerationSettings = ({
	enabled,
	onChange,
	openRouterImageApiKey,
	openRouterImageGenerationSelectedModel,
	setOpenRouterImageApiKey,
	setImageGenerationSelectedModel,
}) => {
	const { t } = useAppTranslation()
	const [apiKey, setApiKey] = useState(openRouterImageApiKey || "")
	const [selectedModel, setSelectedModel] = useState(
		openRouterImageGenerationSelectedModel || IMAGE_GENERATION_MODELS[0].value,
	)
	// Update local state when props change (e.g., when switching profiles)
	useEffect(() => {
		setApiKey(openRouterImageApiKey || "")
		setSelectedModel(openRouterImageGenerationSelectedModel || IMAGE_GENERATION_MODELS[0].value)
	}, [openRouterImageApiKey, openRouterImageGenerationSelectedModel])
	// Handle API key changes
	const handleApiKeyChange = (value) => {
		setApiKey(value)
		setOpenRouterImageApiKey(value)
	}
	// Handle model selection changes
	const handleModelChange = (value) => {
		setSelectedModel(value)
		setImageGenerationSelectedModel(value)
	}
	return _jsxs("div", {
		className: "space-y-4",
		children: [
			_jsxs("div", {
				children: [
					_jsx("div", {
						className: "flex items-center gap-2",
						children: _jsx(VSCodeCheckbox, {
							checked: enabled,
							onChange: (e) => onChange(e.target.checked),
							children: _jsx("span", {
								className: "font-medium",
								children: t("settings:experimental.IMAGE_GENERATION.name"),
							}),
						}),
					}),
					_jsx("p", {
						className: "text-vscode-descriptionForeground text-sm mt-0",
						children: t("settings:experimental.IMAGE_GENERATION.description"),
					}),
				],
			}),
			enabled &&
				_jsxs("div", {
					className: "ml-2 space-y-3",
					children: [
						_jsxs("div", {
							children: [
								_jsx("label", {
									className: "block font-medium mb-1",
									children: t("settings:experimental.IMAGE_GENERATION.openRouterApiKeyLabel"),
								}),
								_jsx(VSCodeTextField, {
									value: apiKey,
									onInput: (e) => handleApiKeyChange(e.target.value),
									placeholder: t(
										"settings:experimental.IMAGE_GENERATION.openRouterApiKeyPlaceholder",
									),
									className: "w-full",
									type: "password",
								}),
								_jsxs("p", {
									className: "text-vscode-descriptionForeground text-xs mt-1",
									children: [
										t("settings:experimental.IMAGE_GENERATION.getApiKeyText"),
										" ",
										_jsx("a", {
											href: "https://openrouter.ai/keys",
											target: "_blank",
											rel: "noopener noreferrer",
											className:
												"text-vscode-textLink-foreground hover:text-vscode-textLink-activeForeground",
											children: "openrouter.ai/keys",
										}),
									],
								}),
							],
						}),
						_jsxs("div", {
							children: [
								_jsx("label", {
									className: "block font-medium mb-1",
									children: t("settings:experimental.IMAGE_GENERATION.modelSelectionLabel"),
								}),
								_jsx(VSCodeDropdown, {
									value: selectedModel,
									onChange: (e) => handleModelChange(e.target.value),
									className: "w-full",
									children: IMAGE_GENERATION_MODELS.map((model) =>
										_jsx(
											VSCodeOption,
											{ value: model.value, className: "py-2 px-3", children: model.label },
											model.value,
										),
									),
								}),
								_jsx("p", {
									className: "text-vscode-descriptionForeground text-xs mt-1",
									children: t("settings:experimental.IMAGE_GENERATION.modelSelectionDescription"),
								}),
							],
						}),
						enabled &&
							!apiKey &&
							_jsx("div", {
								className:
									"p-2 bg-vscode-editorWarning-background text-vscode-editorWarning-foreground rounded text-sm",
								children: t("settings:experimental.IMAGE_GENERATION.warningMissingKey"),
							}),
						enabled &&
							apiKey &&
							_jsx("div", {
								className:
									"p-2 bg-vscode-editorInfo-background text-vscode-editorInfo-foreground rounded text-sm",
								children: t("settings:experimental.IMAGE_GENERATION.successConfigured"),
							}),
					],
				}),
		],
	})
}
//# sourceMappingURL=ImageGenerationSettings.js.map
