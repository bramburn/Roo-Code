import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime"
import { useCallback, useState, useEffect, useMemo } from "react"
import { useEvent } from "react-use"
import { VSCodeTextField } from "@vscode/webview-ui-toolkit/react"
import { vscode } from "@src/utils/vscode"
import { useAppTranslation } from "@src/i18n/TranslationContext"
import { VSCodeButtonLink } from "@src/components/common/VSCodeButtonLink"
import { SearchableSelect } from "@src/components/ui"
import { cn } from "@src/lib/utils"
import { formatPrice } from "@/utils/formatPrice"
import { inputEventTransform } from "../transforms"
export const HuggingFace = ({ apiConfiguration, setApiConfigurationField }) => {
	const { t } = useAppTranslation()
	const [models, setModels] = useState([])
	const [loading, setLoading] = useState(false)
	const [selectedProvider, setSelectedProvider] = useState(apiConfiguration?.huggingFaceInferenceProvider || "auto")
	const handleInputChange = useCallback(
		(field, transform = inputEventTransform) =>
			(event) => {
				setApiConfigurationField(field, transform(event))
			},
		[setApiConfigurationField],
	)
	// Fetch models when component mounts.
	useEffect(() => {
		setLoading(true)
		vscode.postMessage({ type: "requestHuggingFaceModels" })
	}, [])
	// Handle messages from extension.
	const onMessage = useCallback((event) => {
		const message = event.data
		switch (message.type) {
			case "huggingFaceModels":
				setModels(message.huggingFaceModels?.sort((a, b) => a.id.localeCompare(b.id)) || [])
				setLoading(false)
				break
		}
	}, [])
	useEvent("message", onMessage)
	// Get current model and its providers
	const currentModel = models.find((m) => m.id === apiConfiguration?.huggingFaceModelId)
	const availableProviders = useMemo(() => currentModel?.providers || [], [currentModel?.providers])
	// Set default provider when model changes
	useEffect(() => {
		if (currentModel && availableProviders.length > 0) {
			const savedProvider = apiConfiguration?.huggingFaceInferenceProvider
			if (savedProvider) {
				// Use saved provider if it exists
				setSelectedProvider(savedProvider)
			} else {
				const currentProvider = availableProviders.find((p) => p.provider === selectedProvider)
				if (!currentProvider) {
					// Set to "auto" as default
					const defaultProvider = "auto"
					setSelectedProvider(defaultProvider)
					setApiConfigurationField("huggingFaceInferenceProvider", defaultProvider, false) // false = automatic default
				}
			}
		}
	}, [
		currentModel,
		availableProviders,
		selectedProvider,
		apiConfiguration?.huggingFaceInferenceProvider,
		setApiConfigurationField,
	])
	const handleModelSelect = (modelId) => {
		setApiConfigurationField("huggingFaceModelId", modelId)
		// Reset provider selection when model changes
		const defaultProvider = "auto"
		setSelectedProvider(defaultProvider)
		setApiConfigurationField("huggingFaceInferenceProvider", defaultProvider)
	}
	const handleProviderSelect = (provider) => {
		setSelectedProvider(provider)
		setApiConfigurationField("huggingFaceInferenceProvider", provider)
	}
	// Format provider name for display
	const formatProviderName = (provider) => {
		const nameMap = {
			sambanova: "SambaNova",
			"fireworks-ai": "Fireworks",
			together: "Together AI",
			nebius: "Nebius AI Studio",
			hyperbolic: "Hyperbolic",
			novita: "Novita",
			cohere: "Cohere",
			"hf-inference": "HF Inference API",
			replicate: "Replicate",
		}
		return nameMap[provider] || provider.charAt(0).toUpperCase() + provider.slice(1)
	}
	// Get current provider
	const currentProvider = useMemo(() => {
		if (!currentModel || !selectedProvider || selectedProvider === "auto") return null
		return currentModel.providers.find((p) => p.provider === selectedProvider)
	}, [currentModel, selectedProvider])
	// Get model capabilities based on current provider
	const modelCapabilities = useMemo(() => {
		if (!currentModel) return null
		// For now, assume text-only models since we don't have pipeline_tag in new API
		// This could be enhanced by checking model name patterns or adding vision support detection
		const supportsImages = false
		// Use provider-specific capabilities if a specific provider is selected
		const maxTokens =
			currentProvider?.context_length || currentModel.providers.find((p) => p.context_length)?.context_length
		const supportsTools = currentProvider?.supports_tools || currentModel.providers.some((p) => p.supports_tools)
		return {
			supportsImages,
			maxTokens,
			supportsTools,
		}
	}, [currentModel, currentProvider])
	return _jsxs(_Fragment, {
		children: [
			_jsx(VSCodeTextField, {
				value: apiConfiguration?.huggingFaceApiKey || "",
				type: "password",
				onInput: handleInputChange("huggingFaceApiKey"),
				placeholder: t("settings:placeholders.apiKey"),
				className: "w-full",
				children: _jsx("label", {
					className: "block font-medium mb-1",
					children: t("settings:providers.huggingFaceApiKey"),
				}),
			}),
			_jsx("div", {
				className: "text-sm text-vscode-descriptionForeground -mt-2",
				children: t("settings:providers.apiKeyStorageNotice"),
			}),
			!apiConfiguration?.huggingFaceApiKey &&
				_jsx(VSCodeButtonLink, {
					href: "https://huggingface.co/settings/tokens",
					appearance: "secondary",
					children: t("settings:providers.getHuggingFaceApiKey"),
				}),
			_jsxs("div", {
				className: "flex flex-col gap-2",
				children: [
					_jsxs("label", {
						className: "block font-medium text-sm",
						children: [
							t("settings:providers.huggingFaceModelId"),
							loading &&
								_jsx("span", {
									className: "text-xs text-gray-400 ml-2",
									children: t("settings:providers.huggingFaceLoading"),
								}),
							!loading &&
								_jsx("span", {
									className: "text-xs text-gray-400 ml-2",
									children: t("settings:providers.huggingFaceModelsCount", { count: models.length }),
								}),
						],
					}),
					_jsx(SearchableSelect, {
						value: apiConfiguration?.huggingFaceModelId || "",
						onValueChange: handleModelSelect,
						options: models.map((model) => ({
							value: model.id,
							label: model.id,
						})),
						placeholder: t("settings:providers.huggingFaceSelectModel"),
						searchPlaceholder: t("settings:providers.huggingFaceSearchModels"),
						emptyMessage: t("settings:providers.huggingFaceNoModelsFound"),
						disabled: loading,
					}),
				],
			}),
			currentModel &&
				availableProviders.length > 0 &&
				_jsxs("div", {
					className: "flex flex-col gap-2",
					children: [
						_jsx("label", {
							className: "block font-medium text-sm",
							children: t("settings:providers.huggingFaceProvider"),
						}),
						_jsx(SearchableSelect, {
							value: selectedProvider,
							onValueChange: handleProviderSelect,
							options: [
								{ value: "auto", label: t("settings:providers.huggingFaceProviderAuto") },
								...availableProviders.map((mapping) => ({
									value: mapping.provider,
									label: `${formatProviderName(mapping.provider)} (${mapping.status})`,
								})),
							],
							placeholder: t("settings:providers.huggingFaceSelectProvider"),
							searchPlaceholder: t("settings:providers.huggingFaceSearchProviders"),
							emptyMessage: t("settings:providers.huggingFaceNoProvidersFound"),
						}),
					],
				}),
			currentModel &&
				modelCapabilities &&
				_jsxs("div", {
					className: "text-sm text-vscode-descriptionForeground",
					children: [
						_jsxs("div", {
							className: cn(
								"flex items-center gap-1 font-medium",
								modelCapabilities.supportsImages
									? "text-vscode-charts-green"
									: "text-vscode-errorForeground",
							),
							children: [
								_jsx("span", {
									className: cn(
										"codicon",
										modelCapabilities.supportsImages ? "codicon-check" : "codicon-x",
									),
								}),
								modelCapabilities.supportsImages
									? t("settings:modelInfo.supportsImages")
									: t("settings:modelInfo.noImages"),
							],
						}),
						modelCapabilities.maxTokens &&
							_jsxs("div", {
								children: [
									_jsxs("span", {
										className: "font-medium",
										children: [t("settings:modelInfo.maxOutput"), ":"],
									}),
									" ",
									modelCapabilities.maxTokens.toLocaleString(),
									" tokens",
								],
							}),
						currentProvider?.pricing &&
							_jsxs(_Fragment, {
								children: [
									_jsxs("div", {
										children: [
											_jsxs("span", {
												className: "font-medium",
												children: [t("settings:modelInfo.inputPrice"), ":"],
											}),
											" ",
											formatPrice(currentProvider.pricing.input),
											" / 1M tokens",
										],
									}),
									_jsxs("div", {
										children: [
											_jsxs("span", {
												className: "font-medium",
												children: [t("settings:modelInfo.outputPrice"), ":"],
											}),
											" ",
											formatPrice(currentProvider.pricing.output),
											" / 1M tokens",
										],
									}),
								],
							}),
					],
				}),
		],
	})
}
//# sourceMappingURL=HuggingFace.js.map
