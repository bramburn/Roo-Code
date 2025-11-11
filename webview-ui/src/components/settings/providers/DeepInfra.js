import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime"
import { useCallback, useEffect, useState } from "react"
import { VSCodeTextField } from "@vscode/webview-ui-toolkit/react"
import { deepInfraDefaultModelId } from "@roo-code/types"
import { vscode } from "@src/utils/vscode"
import { useAppTranslation } from "@src/i18n/TranslationContext"
import { Button } from "@src/components/ui"
import { inputEventTransform } from "../transforms"
import { ModelPicker } from "../ModelPicker"
export const DeepInfra = ({
	apiConfiguration,
	setApiConfigurationField,
	routerModels,
	refetchRouterModels,
	organizationAllowList,
	modelValidationError,
}) => {
	const { t } = useAppTranslation()
	const [didRefetch, setDidRefetch] = useState()
	const handleInputChange = useCallback(
		(field, transform = inputEventTransform) =>
			(event) => {
				setApiConfigurationField(field, transform(event))
			},
		[setApiConfigurationField],
	)
	useEffect(() => {
		// When base URL or API key changes, trigger a silent refresh of models
		// The outer ApiOptions debounces and sends requestRouterModels; this keeps UI responsive
	}, [apiConfiguration.deepInfraBaseUrl, apiConfiguration.deepInfraApiKey])
	return _jsxs(_Fragment, {
		children: [
			_jsx(VSCodeTextField, {
				value: apiConfiguration?.deepInfraApiKey || "",
				type: "password",
				onInput: handleInputChange("deepInfraApiKey"),
				placeholder: t("settings:placeholders.apiKey"),
				className: "w-full",
				children: _jsx("label", {
					className: "block font-medium mb-1",
					children: t("settings:providers.apiKey"),
				}),
			}),
			_jsx(Button, {
				variant: "outline",
				onClick: () => {
					vscode.postMessage({ type: "flushRouterModels", text: "deepinfra" })
					refetchRouterModels()
					setDidRefetch(true)
				},
				children: _jsxs("div", {
					className: "flex items-center gap-2",
					children: [
						_jsx("span", { className: "codicon codicon-refresh" }),
						t("settings:providers.refreshModels.label"),
					],
				}),
			}),
			didRefetch &&
				_jsx("div", {
					className: "flex items-center text-vscode-errorForeground",
					children: t("settings:providers.refreshModels.hint"),
				}),
			_jsx(ModelPicker, {
				apiConfiguration: apiConfiguration,
				setApiConfigurationField: setApiConfigurationField,
				defaultModelId: deepInfraDefaultModelId,
				models: routerModels?.deepinfra ?? {},
				modelIdKey: "deepInfraModelId",
				serviceName: "Deep Infra",
				serviceUrl: "https://deepinfra.com/models",
				organizationAllowList: organizationAllowList,
				errorMessage: modelValidationError,
			}),
		],
	})
}
//# sourceMappingURL=DeepInfra.js.map
