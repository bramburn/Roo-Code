import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime"
import { useAppTranslation } from "@/i18n/TranslationContext"
import { Trans } from "react-i18next"
import { Info, Download, Upload, TriangleAlert } from "lucide-react"
import { VSCodeCheckbox, VSCodeLink } from "@vscode/webview-ui-toolkit/react"
import { Package } from "@roo/package"
import { vscode } from "@/utils/vscode"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui"
import { SectionHeader } from "./SectionHeader"
import { Section } from "./Section"
export const About = ({ telemetrySetting, setTelemetrySetting, className, ...props }) => {
	const { t } = useAppTranslation()
	return _jsxs("div", {
		className: cn("flex flex-col gap-2", className),
		...props,
		children: [
			_jsx(SectionHeader, {
				description: Package.sha
					? `Version: ${Package.version} (${Package.sha.slice(0, 8)})`
					: `Version: ${Package.version}`,
				children: _jsxs("div", {
					className: "flex items-center gap-2",
					children: [
						_jsx(Info, { className: "w-4" }),
						_jsx("div", { children: t("settings:sections.about") }),
					],
				}),
			}),
			_jsxs(Section, {
				children: [
					_jsxs("div", {
						children: [
							_jsx(VSCodeCheckbox, {
								checked: telemetrySetting !== "disabled",
								onChange: (e) => {
									const checked = e.target.checked === true
									setTelemetrySetting(checked ? "enabled" : "disabled")
								},
								children: t("settings:footer.telemetry.label"),
							}),
							_jsx("p", {
								className: "text-vscode-descriptionForeground text-sm mt-0",
								children: _jsx(Trans, {
									i18nKey: "settings:footer.telemetry.description",
									components: {
										privacyLink: _jsx(VSCodeLink, { href: "https://roocode.com/privacy" }),
									},
								}),
							}),
						],
					}),
					_jsx("div", {
						children: _jsx(Trans, {
							i18nKey: "settings:footer.feedback",
							components: {
								githubLink: _jsx(VSCodeLink, { href: "https://github.com/RooCodeInc/Roo-Code" }),
								redditLink: _jsx(VSCodeLink, { href: "https://reddit.com/r/RooCode" }),
								discordLink: _jsx(VSCodeLink, { href: "https://discord.gg/roocode" }),
							},
						}),
					}),
					_jsxs("div", {
						className: "flex flex-wrap items-center gap-2 mt-2",
						children: [
							_jsxs(Button, {
								onClick: () => vscode.postMessage({ type: "exportSettings" }),
								className: "w-28",
								children: [_jsx(Upload, { className: "p-0.5" }), t("settings:footer.settings.export")],
							}),
							_jsxs(Button, {
								onClick: () => vscode.postMessage({ type: "importSettings" }),
								className: "w-28",
								children: [
									_jsx(Download, { className: "p-0.5" }),
									t("settings:footer.settings.import"),
								],
							}),
							_jsxs(Button, {
								variant: "destructive",
								onClick: () => vscode.postMessage({ type: "resetState" }),
								className: "w-28",
								children: [
									_jsx(TriangleAlert, { className: "p-0.5" }),
									t("settings:footer.settings.reset"),
								],
							}),
						],
					}),
				],
			}),
		],
	})
}
//# sourceMappingURL=About.js.map
