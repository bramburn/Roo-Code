import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime"
import { useEffect } from "react"
import { reasoningEfforts } from "@roo-code/types"
import { useAppTranslation } from "@src/i18n/TranslationContext"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@src/components/ui"
export const SimpleThinkingBudget = ({ apiConfiguration, setApiConfigurationField, modelInfo }) => {
	const { t } = useAppTranslation()
	// Check model capabilities
	const isReasoningEffortSupported = !!modelInfo && modelInfo.supportsReasoningEffort
	const isReasoningEffortRequired = !!modelInfo && modelInfo.requiredReasoningEffort
	// Build available reasoning efforts list
	// Include "none" option unless reasoning effort is required
	const baseEfforts = [...reasoningEfforts]
	const availableReasoningEfforts = isReasoningEffortRequired ? baseEfforts : ["none", ...baseEfforts]
	// Default reasoning effort - use model's default if available, otherwise "medium"
	const modelDefaultReasoningEffort = modelInfo?.reasoningEffort
	const defaultReasoningEffort = isReasoningEffortRequired ? modelDefaultReasoningEffort || "medium" : "none"
	// Current reasoning effort - treat undefined/null as "none"
	const currentReasoningEffort = apiConfiguration.reasoningEffort || defaultReasoningEffort
	// Set default reasoning effort when model supports it and no value is set
	useEffect(() => {
		if (isReasoningEffortSupported && !apiConfiguration.reasoningEffort) {
			// Only set a default if reasoning is required, otherwise leave as undefined (which maps to "none")
			if (isReasoningEffortRequired && defaultReasoningEffort !== "none") {
				setApiConfigurationField("reasoningEffort", defaultReasoningEffort, false)
			}
		}
	}, [
		isReasoningEffortSupported,
		isReasoningEffortRequired,
		apiConfiguration.reasoningEffort,
		defaultReasoningEffort,
		setApiConfigurationField,
	])
	useEffect(() => {
		if (!isReasoningEffortSupported) return
		const shouldEnable = isReasoningEffortRequired || currentReasoningEffort !== "none"
		if (shouldEnable && apiConfiguration.enableReasoningEffort !== true) {
			setApiConfigurationField("enableReasoningEffort", true, false)
		}
	}, [
		isReasoningEffortSupported,
		isReasoningEffortRequired,
		currentReasoningEffort,
		apiConfiguration.enableReasoningEffort,
		setApiConfigurationField,
	])
	if (!modelInfo || !isReasoningEffortSupported) {
		return null
	}
	return _jsxs("div", {
		className: "flex flex-col gap-1",
		"data-testid": "simple-reasoning-effort",
		children: [
			_jsx("div", {
				className: "flex justify-between items-center",
				children: _jsx("label", {
					className: "block font-medium mb-1",
					children: t("settings:providers.reasoningEffort.label"),
				}),
			}),
			_jsxs(Select, {
				value: currentReasoningEffort,
				onValueChange: (value) => {
					// If "none" is selected, clear the reasoningEffort field
					if (value === "none") {
						setApiConfigurationField("reasoningEffort", undefined)
					} else {
						setApiConfigurationField("reasoningEffort", value)
					}
				},
				children: [
					_jsx(SelectTrigger, {
						className: "w-full",
						children: _jsx(SelectValue, {
							placeholder: currentReasoningEffort
								? currentReasoningEffort === "none"
									? t("settings:providers.reasoningEffort.none")
									: t(`settings:providers.reasoningEffort.${currentReasoningEffort}`)
								: t("settings:common.select"),
						}),
					}),
					_jsx(SelectContent, {
						children: availableReasoningEfforts.map((value) =>
							_jsx(
								SelectItem,
								{
									value: value,
									children:
										value === "none"
											? t("settings:providers.reasoningEffort.none")
											: t(`settings:providers.reasoningEffort.${value}`),
								},
								value,
							),
						),
					}),
				],
			}),
		],
	})
}
//# sourceMappingURL=SimpleThinkingBudget.js.map
