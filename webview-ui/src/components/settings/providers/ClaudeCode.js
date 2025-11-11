import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime"
import { VSCodeTextField } from "@vscode/webview-ui-toolkit/react"
import { useAppTranslation } from "@src/i18n/TranslationContext"
import { Slider } from "@src/components/ui"
export const ClaudeCode = ({ apiConfiguration, setApiConfigurationField }) => {
	const { t } = useAppTranslation()
	const handleInputChange = (e) => {
		const element = e.target
		setApiConfigurationField("claudeCodePath", element.value)
	}
	const maxOutputTokens = apiConfiguration?.claudeCodeMaxOutputTokens || 8000
	return _jsxs("div", {
		className: "flex flex-col gap-4",
		children: [
			_jsxs("div", {
				children: [
					_jsx(VSCodeTextField, {
						value: apiConfiguration?.claudeCodePath || "",
						style: { width: "100%", marginTop: 3 },
						type: "text",
						onInput: handleInputChange,
						placeholder: t("settings:providers.claudeCode.placeholder"),
						children: t("settings:providers.claudeCode.pathLabel"),
					}),
					_jsx("p", {
						style: {
							fontSize: "12px",
							marginTop: 3,
							color: "var(--vscode-descriptionForeground)",
						},
						children: t("settings:providers.claudeCode.description"),
					}),
				],
			}),
			_jsxs("div", {
				className: "flex flex-col gap-1",
				children: [
					_jsx("div", {
						className: "font-medium",
						children: t("settings:providers.claudeCode.maxTokensLabel"),
					}),
					_jsxs("div", {
						className: "flex items-center gap-1",
						children: [
							_jsx(Slider, {
								min: 8000,
								max: 64000,
								step: 1024,
								value: [maxOutputTokens],
								onValueChange: ([value]) =>
									setApiConfigurationField("claudeCodeMaxOutputTokens", value),
							}),
							_jsx("div", { className: "w-16 text-sm text-center", children: maxOutputTokens }),
						],
					}),
					_jsx("p", {
						className: "text-sm text-vscode-descriptionForeground mt-1",
						children: t("settings:providers.claudeCode.maxTokensDescription"),
					}),
				],
			}),
		],
	})
}
//# sourceMappingURL=ClaudeCode.js.map
