import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime"
import { useCallback, useState, useRef } from "react"
import { VSCodeTextField } from "@vscode/webview-ui-toolkit/react"
import { useQueryClient } from "@tanstack/react-query"
import { unboundDefaultModelId } from "@roo-code/types"
import { useAppTranslation } from "@src/i18n/TranslationContext"
import { VSCodeButtonLink } from "@src/components/common/VSCodeButtonLink"
import { vscode } from "@src/utils/vscode"
import { Button } from "@src/components/ui"
import { inputEventTransform } from "../transforms"
import { ModelPicker } from "../ModelPicker"
export const Unbound = ({
	apiConfiguration,
	setApiConfigurationField,
	routerModels,
	organizationAllowList,
	modelValidationError,
}) => {
	const { t } = useAppTranslation()
	const [didRefetch, setDidRefetch] = useState()
	const [isInvalidKey, setIsInvalidKey] = useState(false)
	const queryClient = useQueryClient()
	// Add refs to store timer IDs
	const didRefetchTimerRef = useRef()
	const invalidKeyTimerRef = useRef()
	const handleInputChange = useCallback(
		(field, transform = inputEventTransform) =>
			(event) => {
				setApiConfigurationField(field, transform(event))
			},
		[setApiConfigurationField],
	)
	const saveConfiguration = useCallback(async () => {
		vscode.postMessage({
			type: "upsertApiConfiguration",
			text: "default",
			apiConfiguration: apiConfiguration,
		})
		const waitForStateUpdate = new Promise((resolve, reject) => {
			const timeoutId = setTimeout(() => {
				window.removeEventListener("message", messageHandler)
				reject(new Error("Timeout waiting for state update"))
			}, 10000) // 10 second timeout
			const messageHandler = (event) => {
				const message = event.data
				if (message.type === "state") {
					clearTimeout(timeoutId)
					window.removeEventListener("message", messageHandler)
					resolve()
				}
			}
			window.addEventListener("message", messageHandler)
		})
		try {
			await waitForStateUpdate
		} catch (error) {
			console.error("Failed to save configuration:", error)
		}
	}, [apiConfiguration])
	const requestModels = useCallback(async () => {
		vscode.postMessage({ type: "flushRouterModels", text: "unbound" })
		const modelsPromise = new Promise((resolve) => {
			const messageHandler = (event) => {
				const message = event.data
				if (message.type === "routerModels") {
					window.removeEventListener("message", messageHandler)
					resolve()
				}
			}
			window.addEventListener("message", messageHandler)
		})
		vscode.postMessage({ type: "requestRouterModels" })
		await modelsPromise
		await queryClient.invalidateQueries({ queryKey: ["routerModels"] })
		// After refreshing models, check if current model is in the updated list
		// If not, select the first available model
		const updatedModels = queryClient.getQueryData(["routerModels"])?.unbound
		if (updatedModels && Object.keys(updatedModels).length > 0) {
			const currentModelId = apiConfiguration?.unboundModelId
			const modelExists = currentModelId && Object.prototype.hasOwnProperty.call(updatedModels, currentModelId)
			if (!currentModelId || !modelExists) {
				const firstAvailableModelId = Object.keys(updatedModels)[0]
				setApiConfigurationField("unboundModelId", firstAvailableModelId, false) // false = automatic model selection
			}
		}
		if (!updatedModels || Object.keys(updatedModels).includes("error")) {
			return false
		} else {
			return true
		}
	}, [queryClient, apiConfiguration, setApiConfigurationField])
	const handleRefresh = useCallback(async () => {
		await saveConfiguration()
		const requestModelsResult = await requestModels()
		if (requestModelsResult) {
			setDidRefetch(true)
			didRefetchTimerRef.current = setTimeout(() => setDidRefetch(false), 3000)
		} else {
			setIsInvalidKey(true)
			invalidKeyTimerRef.current = setTimeout(() => setIsInvalidKey(false), 3000)
		}
	}, [saveConfiguration, requestModels])
	return _jsxs(_Fragment, {
		children: [
			_jsx(VSCodeTextField, {
				value: apiConfiguration?.unboundApiKey || "",
				type: "password",
				onInput: handleInputChange("unboundApiKey"),
				placeholder: t("settings:placeholders.apiKey"),
				className: "w-full",
				children: _jsx("label", {
					className: "block font-medium mb-1",
					children: t("settings:providers.unboundApiKey"),
				}),
			}),
			_jsx("div", {
				className: "text-sm text-vscode-descriptionForeground -mt-2",
				children: t("settings:providers.apiKeyStorageNotice"),
			}),
			!apiConfiguration?.unboundApiKey &&
				_jsx(VSCodeButtonLink, {
					href: "https://gateway.getunbound.ai",
					appearance: "secondary",
					children: t("settings:providers.getUnboundApiKey"),
				}),
			_jsx("div", {
				className: "flex justify-end",
				children: _jsx(Button, {
					variant: "outline",
					onClick: handleRefresh,
					className: "w-1/2 max-w-xs",
					children: _jsxs("div", {
						className: "flex items-center gap-2 justify-center",
						children: [
							_jsx("span", { className: "codicon codicon-refresh" }),
							t("settings:providers.refreshModels.label"),
						],
					}),
				}),
			}),
			didRefetch &&
				_jsx("div", {
					className: "flex items-center text-vscode-charts-green",
					children: t("settings:providers.unboundRefreshModelsSuccess"),
				}),
			isInvalidKey &&
				_jsx("div", {
					className: "flex items-center text-vscode-errorForeground",
					children: t("settings:providers.unboundInvalidApiKey"),
				}),
			_jsx(ModelPicker, {
				apiConfiguration: apiConfiguration,
				defaultModelId: unboundDefaultModelId,
				models: routerModels?.unbound ?? {},
				modelIdKey: "unboundModelId",
				serviceName: "Unbound",
				serviceUrl: "https://api.getunbound.ai/models",
				setApiConfigurationField: setApiConfigurationField,
				organizationAllowList: organizationAllowList,
				errorMessage: modelValidationError,
			}),
		],
	})
}
//# sourceMappingURL=Unbound.js.map
