import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime"
import { useCallback } from "react"
import { VSCodeTextField } from "@vscode/webview-ui-toolkit/react"
import { useAppTranslation } from "@src/i18n/TranslationContext"
import { VSCodeButtonLink } from "@src/components/common/VSCodeButtonLink"
import { inputEventTransform } from "../transforms"
export const XAI = ({ apiConfiguration, setApiConfigurationField }) => {
	const { t } = useAppTranslation()
	const handleInputChange = useCallback(
		(field, transform = inputEventTransform) =>
			(event) => {
				setApiConfigurationField(field, transform(event))
			},
		[setApiConfigurationField],
	)
	return _jsxs(_Fragment, {
		children: [
			_jsx(VSCodeTextField, {
				value: apiConfiguration?.xaiApiKey || "",
				type: "password",
				onInput: handleInputChange("xaiApiKey"),
				placeholder: t("settings:placeholders.apiKey"),
				className: "w-full",
				children: _jsx("label", {
					className: "block font-medium mb-1",
					children: t("settings:providers.xaiApiKey"),
				}),
			}),
			_jsx("div", {
				className: "text-sm text-vscode-descriptionForeground -mt-2",
				children: t("settings:providers.apiKeyStorageNotice"),
			}),
			!apiConfiguration?.xaiApiKey &&
				_jsx(VSCodeButtonLink, {
					href: "https://api.x.ai/docs",
					appearance: "secondary",
					children: t("settings:providers.getXaiApiKey"),
				}),
		],
	})
}
//# sourceMappingURL=XAI.js.map
