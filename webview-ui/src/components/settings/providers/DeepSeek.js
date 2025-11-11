import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime"
import { useCallback } from "react"
import { VSCodeTextField } from "@vscode/webview-ui-toolkit/react"
import { useAppTranslation } from "@src/i18n/TranslationContext"
import { VSCodeButtonLink } from "@src/components/common/VSCodeButtonLink"
import { inputEventTransform } from "../transforms"
export const DeepSeek = ({ apiConfiguration, setApiConfigurationField }) => {
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
				value: apiConfiguration?.deepSeekApiKey || "",
				type: "password",
				onInput: handleInputChange("deepSeekApiKey"),
				placeholder: t("settings:placeholders.apiKey"),
				className: "w-full",
				children: _jsx("label", {
					className: "block font-medium mb-1",
					children: t("settings:providers.deepSeekApiKey"),
				}),
			}),
			_jsx("div", {
				className: "text-sm text-vscode-descriptionForeground -mt-2",
				children: t("settings:providers.apiKeyStorageNotice"),
			}),
			!apiConfiguration?.deepSeekApiKey &&
				_jsx(VSCodeButtonLink, {
					href: "https://platform.deepseek.com/",
					appearance: "secondary",
					children: t("settings:providers.getDeepSeekApiKey"),
				}),
		],
	})
}
//# sourceMappingURL=DeepSeek.js.map
