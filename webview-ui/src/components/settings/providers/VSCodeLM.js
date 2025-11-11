import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime"
import { useState, useCallback } from "react"
import { useEvent } from "react-use"
import { useAppTranslation } from "@src/i18n/TranslationContext"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@src/components/ui"
import { inputEventTransform } from "../transforms"
export const VSCodeLM = ({ apiConfiguration, setApiConfigurationField }) => {
	const { t } = useAppTranslation()
	const [vsCodeLmModels, setVsCodeLmModels] = useState([])
	const handleInputChange = useCallback(
		(field, transform = inputEventTransform) =>
			(event) => {
				setApiConfigurationField(field, transform(event))
			},
		[setApiConfigurationField],
	)
	const onMessage = useCallback((event) => {
		const message = event.data
		switch (message.type) {
			case "vsCodeLmModels":
				{
					const newModels = message.vsCodeLmModels ?? []
					setVsCodeLmModels(newModels)
				}
				break
		}
	}, [])
	useEvent("message", onMessage)
	return _jsxs(_Fragment, {
		children: [
			_jsxs("div", {
				children: [
					_jsx("label", {
						className: "block font-medium mb-1",
						children: t("settings:providers.vscodeLmModel"),
					}),
					vsCodeLmModels.length > 0
						? _jsxs(Select, {
								value: apiConfiguration?.vsCodeLmModelSelector
									? `${apiConfiguration.vsCodeLmModelSelector.vendor ?? ""}/${apiConfiguration.vsCodeLmModelSelector.family ?? ""}`
									: "",
								onValueChange: handleInputChange("vsCodeLmModelSelector", (value) => {
									const [vendor, family] = value.split("/")
									return { vendor, family }
								}),
								children: [
									_jsx(SelectTrigger, {
										className: "w-full",
										children: _jsx(SelectValue, { placeholder: t("settings:common.select") }),
									}),
									_jsx(SelectContent, {
										children: vsCodeLmModels.map((model) =>
											_jsx(
												SelectItem,
												{
													value: `${model.vendor}/${model.family}`,
													children: `${model.vendor} - ${model.family}`,
												},
												`${model.vendor}/${model.family}`,
											),
										),
									}),
								],
							})
						: _jsx("div", {
								className: "text-sm text-vscode-descriptionForeground",
								children: t("settings:providers.vscodeLmDescription"),
							}),
				],
			}),
			_jsx("div", {
				className: "text-sm text-vscode-errorForeground",
				children: t("settings:providers.vscodeLmWarning"),
			}),
		],
	})
}
//# sourceMappingURL=VSCodeLM.js.map
