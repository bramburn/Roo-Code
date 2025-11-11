import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime"
import { verbosityLevels } from "@roo-code/types"
import { useAppTranslation } from "@src/i18n/TranslationContext"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@src/components/ui"
export const Verbosity = ({ apiConfiguration, setApiConfigurationField, modelInfo }) => {
	const { t } = useAppTranslation()
	// For now, we'll show verbosity for all models, but this can be restricted later
	// based on model capabilities (e.g., only for GPT-5 models)
	if (!modelInfo) {
		return null
	}
	return _jsxs("div", {
		className: "flex flex-col gap-1",
		"data-testid": "verbosity",
		children: [
			_jsx("div", {
				className: "flex justify-between items-center",
				children: _jsx("label", {
					className: "block font-medium mb-1",
					children: t("settings:providers.verbosity.label"),
				}),
			}),
			_jsxs(Select, {
				value: apiConfiguration.verbosity || "medium",
				onValueChange: (value) => setApiConfigurationField("verbosity", value),
				children: [
					_jsx(SelectTrigger, {
						className: "w-full",
						children: _jsx(SelectValue, { placeholder: t("settings:common.select") }),
					}),
					_jsx(SelectContent, {
						children: verbosityLevels.map((value) =>
							_jsx(
								SelectItem,
								{ value: value, children: t(`settings:providers.verbosity.${value}`) },
								value,
							),
						),
					}),
				],
			}),
			_jsx("div", {
				className: "text-xs text-muted-foreground mt-1",
				children: t("settings:providers.verbosity.description"),
			}),
		],
	})
}
//# sourceMappingURL=Verbosity.js.map
