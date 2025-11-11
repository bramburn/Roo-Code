import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime"
import { useCallback } from "react"
import { Slider } from "@/components/ui"
import { useAppTranslation } from "@/i18n/TranslationContext"
import { VSCodeCheckbox } from "@vscode/webview-ui-toolkit/react"
export const DiffSettingsControl = ({ diffEnabled = true, fuzzyMatchThreshold = 1.0, onChange }) => {
	const { t } = useAppTranslation()
	const handleDiffEnabledChange = useCallback(
		(e) => {
			onChange("diffEnabled", e.target.checked)
		},
		[onChange],
	)
	const handleThresholdChange = useCallback(
		(newValue) => {
			onChange("fuzzyMatchThreshold", newValue[0])
		},
		[onChange],
	)
	return _jsxs("div", {
		className: "flex flex-col gap-1",
		children: [
			_jsxs("div", {
				children: [
					_jsx(VSCodeCheckbox, {
						checked: diffEnabled,
						onChange: handleDiffEnabledChange,
						children: _jsx("span", {
							className: "font-medium",
							children: t("settings:advanced.diff.label"),
						}),
					}),
					_jsx("div", {
						className: "text-vscode-descriptionForeground text-sm",
						children: t("settings:advanced.diff.description"),
					}),
				],
			}),
			diffEnabled &&
				_jsx("div", {
					className: "flex flex-col gap-3 pl-3 border-l-2 border-vscode-button-background",
					children: _jsxs("div", {
						children: [
							_jsx("label", {
								className: "block font-medium mb-1",
								children: t("settings:advanced.diff.matchPrecision.label"),
							}),
							_jsxs("div", {
								className: "flex items-center gap-2",
								children: [
									_jsx(Slider, {
										min: 0.8,
										max: 1,
										step: 0.005,
										value: [fuzzyMatchThreshold],
										onValueChange: handleThresholdChange,
									}),
									_jsxs("span", {
										className: "w-10",
										children: [Math.round(fuzzyMatchThreshold * 100), "%"],
									}),
								],
							}),
							_jsx("div", {
								className: "text-vscode-descriptionForeground text-sm mt-1",
								children: t("settings:advanced.diff.matchPrecision.description"),
							}),
						],
					}),
				}),
		],
	})
}
//# sourceMappingURL=DiffSettingsControl.js.map
