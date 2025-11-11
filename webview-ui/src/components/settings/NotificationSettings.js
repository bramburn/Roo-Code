import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime"
import { useAppTranslation } from "@/i18n/TranslationContext"
import { VSCodeCheckbox } from "@vscode/webview-ui-toolkit/react"
import { Bell } from "lucide-react"
import { SectionHeader } from "./SectionHeader"
import { Section } from "./Section"
import { Slider } from "../ui"
export const NotificationSettings = ({
	ttsEnabled,
	ttsSpeed,
	soundEnabled,
	soundVolume,
	setCachedStateField,
	...props
}) => {
	const { t } = useAppTranslation()
	return _jsxs("div", {
		...props,
		children: [
			_jsx(SectionHeader, {
				children: _jsxs("div", {
					className: "flex items-center gap-2",
					children: [
						_jsx(Bell, { className: "w-4" }),
						_jsx("div", { children: t("settings:sections.notifications") }),
					],
				}),
			}),
			_jsxs(Section, {
				children: [
					_jsxs("div", {
						children: [
							_jsx(VSCodeCheckbox, {
								checked: ttsEnabled,
								onChange: (e) => setCachedStateField("ttsEnabled", e.target.checked),
								"data-testid": "tts-enabled-checkbox",
								children: _jsx("span", {
									className: "font-medium",
									children: t("settings:notifications.tts.label"),
								}),
							}),
							_jsx("div", {
								className: "text-vscode-descriptionForeground text-sm mt-1",
								children: t("settings:notifications.tts.description"),
							}),
						],
					}),
					ttsEnabled &&
						_jsx("div", {
							className: "flex flex-col gap-3 pl-3 border-l-2 border-vscode-button-background",
							children: _jsxs("div", {
								children: [
									_jsx("label", {
										className: "block font-medium mb-1",
										children: t("settings:notifications.tts.speedLabel"),
									}),
									_jsxs("div", {
										className: "flex items-center gap-2",
										children: [
											_jsx(Slider, {
												min: 0.1,
												max: 2.0,
												step: 0.01,
												value: [ttsSpeed ?? 1.0],
												onValueChange: ([value]) => setCachedStateField("ttsSpeed", value),
												"data-testid": "tts-speed-slider",
											}),
											_jsxs("span", {
												className: "w-10",
												children: [((ttsSpeed ?? 1.0) * 100).toFixed(0), "%"],
											}),
										],
									}),
								],
							}),
						}),
					_jsxs("div", {
						children: [
							_jsx(VSCodeCheckbox, {
								checked: soundEnabled,
								onChange: (e) => setCachedStateField("soundEnabled", e.target.checked),
								"data-testid": "sound-enabled-checkbox",
								children: _jsx("span", {
									className: "font-medium",
									children: t("settings:notifications.sound.label"),
								}),
							}),
							_jsx("div", {
								className: "text-vscode-descriptionForeground text-sm mt-1",
								children: t("settings:notifications.sound.description"),
							}),
						],
					}),
					soundEnabled &&
						_jsx("div", {
							className: "flex flex-col gap-3 pl-3 border-l-2 border-vscode-button-background",
							children: _jsxs("div", {
								children: [
									_jsx("label", {
										className: "block font-medium mb-1",
										children: t("settings:notifications.sound.volumeLabel"),
									}),
									_jsxs("div", {
										className: "flex items-center gap-2",
										children: [
											_jsx(Slider, {
												min: 0,
												max: 1,
												step: 0.01,
												value: [soundVolume ?? 0.5],
												onValueChange: ([value]) => setCachedStateField("soundVolume", value),
												"data-testid": "sound-volume-slider",
											}),
											_jsxs("span", {
												className: "w-10",
												children: [((soundVolume ?? 0.5) * 100).toFixed(0), "%"],
											}),
										],
									}),
								],
							}),
						}),
				],
			}),
		],
	})
}
//# sourceMappingURL=NotificationSettings.js.map
