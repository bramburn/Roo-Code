import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime"
import { useCallback, useState, useEffect, useRef } from "react"
import { VSCodeTextField, VSCodeCheckbox } from "@vscode/webview-ui-toolkit/react"
import { litellmDefaultModelId } from "@roo-code/types"
import { vscode } from "@src/utils/vscode"
import { useExtensionState } from "@src/context/ExtensionStateContext"
import { useAppTranslation } from "@src/i18n/TranslationContext"
import { Button } from "@src/components/ui"
import { inputEventTransform } from "../transforms"
import { ModelPicker } from "../ModelPicker"
export const LiteLLM = ({
	apiConfiguration,
	setApiConfigurationField,
	organizationAllowList,
	modelValidationError,
}) => {
	const { t } = useAppTranslation()
	const { routerModels } = useExtensionState()
	const [refreshStatus, setRefreshStatus] = useState("idle")
	const [refreshError, setRefreshError] = useState()
	const litellmErrorJustReceived = useRef(false)
	useEffect(() => {
		const handleMessage = (event) => {
			const message = event.data
			if (message.type === "singleRouterModelFetchResponse" && !message.success) {
				const providerName = message.values?.provider
				if (providerName === "litellm") {
					litellmErrorJustReceived.current = true
					setRefreshStatus("error")
					setRefreshError(message.error)
				}
			} else if (message.type === "routerModels") {
				// If we were loading and no specific error for litellm was just received, mark as success.
				// The ModelPicker will show available models or "no models found".
				if (refreshStatus === "loading") {
					if (!litellmErrorJustReceived.current) {
						setRefreshStatus("success")
					}
					// If litellmErrorJustReceived.current is true, status is already (or will be) "error".
				}
			}
		}
		window.addEventListener("message", handleMessage)
		return () => {
			window.removeEventListener("message", handleMessage)
		}
	}, [refreshStatus, refreshError, setRefreshStatus, setRefreshError])
	const handleInputChange = useCallback(
		(field, transform = inputEventTransform) =>
			(event) => {
				setApiConfigurationField(field, transform(event))
			},
		[setApiConfigurationField],
	)
	const handleRefreshModels = useCallback(() => {
		litellmErrorJustReceived.current = false // Reset flag on new refresh action
		setRefreshStatus("loading")
		setRefreshError(undefined)
		const key = apiConfiguration.litellmApiKey
		const url = apiConfiguration.litellmBaseUrl
		if (!key || !url) {
			setRefreshStatus("error")
			setRefreshError(t("settings:providers.refreshModels.missingConfig"))
			return
		}
		vscode.postMessage({ type: "requestRouterModels", values: { litellmApiKey: key, litellmBaseUrl: url } })
	}, [apiConfiguration, setRefreshStatus, setRefreshError, t])
	return _jsxs(_Fragment, {
		children: [
			_jsx(VSCodeTextField, {
				value: apiConfiguration?.litellmBaseUrl || "",
				onInput: handleInputChange("litellmBaseUrl"),
				placeholder: t("settings:placeholders.baseUrl"),
				className: "w-full",
				children: _jsx("label", {
					className: "block font-medium mb-1",
					children: t("settings:providers.litellmBaseUrl"),
				}),
			}),
			_jsx(VSCodeTextField, {
				value: apiConfiguration?.litellmApiKey || "",
				type: "password",
				onInput: handleInputChange("litellmApiKey"),
				placeholder: t("settings:placeholders.apiKey"),
				className: "w-full",
				children: _jsx("label", {
					className: "block font-medium mb-1",
					children: t("settings:providers.litellmApiKey"),
				}),
			}),
			_jsx("div", {
				className: "text-sm text-vscode-descriptionForeground -mt-2",
				children: t("settings:providers.apiKeyStorageNotice"),
			}),
			_jsx(Button, {
				variant: "outline",
				onClick: handleRefreshModels,
				disabled:
					refreshStatus === "loading" || !apiConfiguration.litellmApiKey || !apiConfiguration.litellmBaseUrl,
				className: "w-full",
				children: _jsxs("div", {
					className: "flex items-center gap-2",
					children: [
						refreshStatus === "loading"
							? _jsx("span", { className: "codicon codicon-loading codicon-modifier-spin" })
							: _jsx("span", { className: "codicon codicon-refresh" }),
						t("settings:providers.refreshModels.label"),
					],
				}),
			}),
			refreshStatus === "loading" &&
				_jsx("div", {
					className: "text-sm text-vscode-descriptionForeground",
					children: t("settings:providers.refreshModels.loading"),
				}),
			refreshStatus === "success" &&
				_jsx("div", {
					className: "text-sm text-vscode-foreground",
					children: t("settings:providers.refreshModels.success"),
				}),
			refreshStatus === "error" &&
				_jsx("div", {
					className: "text-sm text-vscode-errorForeground",
					children: refreshError || t("settings:providers.refreshModels.error"),
				}),
			_jsx(ModelPicker, {
				apiConfiguration: apiConfiguration,
				defaultModelId: litellmDefaultModelId,
				models: routerModels?.litellm ?? {},
				modelIdKey: "litellmModelId",
				serviceName: "LiteLLM",
				serviceUrl: "https://docs.litellm.ai/",
				setApiConfigurationField: setApiConfigurationField,
				organizationAllowList: organizationAllowList,
				errorMessage: modelValidationError,
			}),
			(() => {
				const selectedModelId = apiConfiguration.litellmModelId || litellmDefaultModelId
				const selectedModel = routerModels?.litellm?.[selectedModelId]
				if (selectedModel?.supportsPromptCache) {
					return _jsxs("div", {
						className: "mt-4",
						children: [
							_jsx(VSCodeCheckbox, {
								checked: apiConfiguration.litellmUsePromptCache || false,
								onChange: (e) => {
									setApiConfigurationField("litellmUsePromptCache", e.target.checked)
								},
								children: _jsx("span", {
									className: "font-medium",
									children: t("settings:providers.enablePromptCaching"),
								}),
							}),
							_jsx("div", {
								className: "text-sm text-vscode-descriptionForeground ml-6 mt-1",
								children: t("settings:providers.enablePromptCachingTitle"),
							}),
						],
					})
				}
				return null
			})(),
		],
	})
}
//# sourceMappingURL=LiteLLM.js.map
