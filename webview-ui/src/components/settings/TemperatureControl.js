import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime"
import { VSCodeCheckbox } from "@vscode/webview-ui-toolkit/react"
import { useEffect, useState } from "react"
import { useAppTranslation } from "@/i18n/TranslationContext"
import { useDebounce } from "react-use"
import { Slider } from "@/components/ui"
export const TemperatureControl = ({ value, onChange, maxValue = 1 }) => {
	const { t } = useAppTranslation()
	const [isCustomTemperature, setIsCustomTemperature] = useState(value !== undefined)
	const [inputValue, setInputValue] = useState(value)
	useDebounce(() => onChange(inputValue), 50, [onChange, inputValue])
	// Sync internal state with prop changes when switching profiles.
	useEffect(() => {
		const hasCustomTemperature = value !== undefined && value !== null
		setIsCustomTemperature(hasCustomTemperature)
		setInputValue(value)
	}, [value])
	return _jsxs(_Fragment, {
		children: [
			_jsxs("div", {
				children: [
					_jsx(VSCodeCheckbox, {
						checked: isCustomTemperature,
						onChange: (e) => {
							const isChecked = e.target.checked
							setIsCustomTemperature(isChecked)
							if (!isChecked) {
								setInputValue(null) // Unset the temperature, note that undefined is unserializable.
							} else {
								setInputValue(value ?? 0) // Use the value from apiConfiguration, if set.
							}
						},
						children: _jsx("label", {
							className: "block font-medium mb-1",
							children: t("settings:temperature.useCustom"),
						}),
					}),
					_jsx("div", {
						className: "text-sm text-vscode-descriptionForeground mt-1",
						children: t("settings:temperature.description"),
					}),
				],
			}),
			isCustomTemperature &&
				_jsx("div", {
					className: "flex flex-col gap-3 pl-3 border-l-2 border-vscode-button-background",
					children: _jsxs("div", {
						children: [
							_jsxs("div", {
								className: "flex items-center gap-2",
								children: [
									_jsx(Slider, {
										min: 0,
										max: maxValue,
										step: 0.01,
										value: [inputValue ?? 0],
										onValueChange: ([value]) => setInputValue(value),
									}),
									_jsx("span", { className: "w-10", children: inputValue }),
								],
							}),
							_jsx("div", {
								className: "text-vscode-descriptionForeground text-sm mt-1",
								children: t("settings:temperature.rangeDescription"),
							}),
						],
					}),
				}),
		],
	})
}
//# sourceMappingURL=TemperatureControl.js.map
