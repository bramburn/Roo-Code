import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime"
import { useAppTranslation } from "@/i18n/TranslationContext"
import { VSCodeCheckbox } from "@vscode/webview-ui-toolkit/react"
import { Glasses } from "lucide-react"
import { telemetryClient } from "@/utils/TelemetryClient"
import { SectionHeader } from "./SectionHeader"
import { Section } from "./Section"
export const UISettings = ({ reasoningBlockCollapsed, setCachedStateField, ...props }) => {
	const { t } = useAppTranslation()
	const handleReasoningBlockCollapsedChange = (value) => {
		setCachedStateField("reasoningBlockCollapsed", value)
		// Track telemetry event
		telemetryClient.capture("ui_settings_collapse_thinking_changed", {
			enabled: value,
		})
	}
	return _jsxs("div", {
		...props,
		children: [
			_jsx(SectionHeader, {
				children: _jsxs("div", {
					className: "flex items-center gap-2",
					children: [
						_jsx(Glasses, { className: "w-4" }),
						_jsx("div", { children: t("settings:sections.ui") }),
					],
				}),
			}),
			_jsx(Section, {
				children: _jsx("div", {
					className: "space-y-6",
					children: _jsxs("div", {
						className: "flex flex-col gap-1",
						children: [
							_jsx(VSCodeCheckbox, {
								checked: reasoningBlockCollapsed,
								onChange: (e) => handleReasoningBlockCollapsedChange(e.target.checked),
								"data-testid": "collapse-thinking-checkbox",
								children: _jsx("span", {
									className: "font-medium",
									children: t("settings:ui.collapseThinking.label"),
								}),
							}),
							_jsx("div", {
								className: "text-vscode-descriptionForeground text-sm ml-5 mt-1",
								children: t("settings:ui.collapseThinking.description"),
							}),
						],
					}),
				}),
			}),
		],
	})
}
//# sourceMappingURL=UISettings.js.map
