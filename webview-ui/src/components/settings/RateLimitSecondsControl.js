import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime"
import { useCallback } from "react"
import { Slider } from "@/components/ui"
import { useAppTranslation } from "@/i18n/TranslationContext"
export const RateLimitSecondsControl = ({ value, onChange }) => {
	const { t } = useAppTranslation()
	const handleValueChange = useCallback(
		(newValue) => {
			onChange(newValue)
		},
		[onChange],
	)
	return _jsxs("div", {
		className: "flex flex-col gap-1",
		children: [
			_jsx("label", {
				className: "block font-medium mb-1",
				children: t("settings:providers.rateLimitSeconds.label"),
			}),
			_jsxs("div", {
				className: "flex items-center gap-2",
				children: [
					_jsx(Slider, {
						value: [value],
						min: 0,
						max: 60,
						step: 1,
						onValueChange: (newValue) => handleValueChange(newValue[0]),
					}),
					_jsxs("span", { className: "w-10", children: [value, "s"] }),
				],
			}),
			_jsx("div", {
				className: "text-sm text-vscode-descriptionForeground",
				children: t("settings:providers.rateLimitSeconds.description", { value }),
			}),
		],
	})
}
//# sourceMappingURL=RateLimitSecondsControl.js.map
