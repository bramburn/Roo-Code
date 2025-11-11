import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime"
import { useAppTranslation } from "@/i18n/TranslationContext"
import { VSCodeCheckbox, VSCodeLink } from "@vscode/webview-ui-toolkit/react"
import { GitBranch } from "lucide-react"
import { Trans } from "react-i18next"
import { buildDocLink } from "@src/utils/docLinks"
import { Slider } from "@/components/ui"
import { SectionHeader } from "./SectionHeader"
import { Section } from "./Section"
import {
	DEFAULT_CHECKPOINT_TIMEOUT_SECONDS,
	MAX_CHECKPOINT_TIMEOUT_SECONDS,
	MIN_CHECKPOINT_TIMEOUT_SECONDS,
} from "@roo-code/types"
export const CheckpointSettings = ({ enableCheckpoints, checkpointTimeout, setCachedStateField, ...props }) => {
	const { t } = useAppTranslation()
	return _jsxs("div", {
		...props,
		children: [
			_jsx(SectionHeader, {
				children: _jsxs("div", {
					className: "flex items-center gap-2",
					children: [
						_jsx(GitBranch, { className: "w-4" }),
						_jsx("div", { children: t("settings:sections.checkpoints") }),
					],
				}),
			}),
			_jsxs(Section, {
				children: [
					_jsxs("div", {
						children: [
							_jsx(VSCodeCheckbox, {
								checked: enableCheckpoints,
								onChange: (e) => {
									setCachedStateField("enableCheckpoints", e.target.checked)
								},
								children: _jsx("span", {
									className: "font-medium",
									children: t("settings:checkpoints.enable.label"),
								}),
							}),
							_jsx("div", {
								className: "text-vscode-descriptionForeground text-sm mt-1",
								children: _jsx(Trans, {
									i18nKey: "settings:checkpoints.enable.description",
									children: _jsx(VSCodeLink, {
										href: buildDocLink("features/checkpoints", "settings_checkpoints"),
										style: { display: "inline" },
										children: " ",
									}),
								}),
							}),
						],
					}),
					enableCheckpoints &&
						_jsxs("div", {
							className: "mt-4",
							children: [
								_jsx("label", {
									className: "block text-sm font-medium mb-2",
									children: t("settings:checkpoints.timeout.label"),
								}),
								_jsxs("div", {
									className: "flex items-center gap-2",
									children: [
										_jsx(Slider, {
											min: MIN_CHECKPOINT_TIMEOUT_SECONDS,
											max: MAX_CHECKPOINT_TIMEOUT_SECONDS,
											step: 1,
											defaultValue: [checkpointTimeout ?? DEFAULT_CHECKPOINT_TIMEOUT_SECONDS],
											onValueChange: ([value]) => {
												setCachedStateField("checkpointTimeout", value)
											},
											className: "flex-1",
											"data-testid": "checkpoint-timeout-slider",
										}),
										_jsx("span", {
											className: "w-12 text-center",
											children: checkpointTimeout ?? DEFAULT_CHECKPOINT_TIMEOUT_SECONDS,
										}),
									],
								}),
								_jsx("div", {
									className: "text-vscode-descriptionForeground text-sm mt-1",
									children: t("settings:checkpoints.timeout.description"),
								}),
							],
						}),
				],
			}),
		],
	})
}
//# sourceMappingURL=CheckpointSettings.js.map
