import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime"
import { VSCodeButton, VSCodeCheckbox, VSCodeTextField, VSCodeLink } from "@vscode/webview-ui-toolkit/react"
import { SquareMousePointer } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { Trans } from "react-i18next"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue, Slider } from "@/components/ui"
import { useAppTranslation } from "@/i18n/TranslationContext"
import { vscode } from "@/utils/vscode"
import { buildDocLink } from "@src/utils/docLinks"
import { Section } from "./Section"
import { SectionHeader } from "./SectionHeader"
export const BrowserSettings = ({
	browserToolEnabled,
	browserViewportSize,
	screenshotQuality,
	remoteBrowserHost,
	remoteBrowserEnabled,
	setCachedStateField,
	...props
}) => {
	const { t } = useAppTranslation()
	const [testingConnection, setTestingConnection] = useState(false)
	const [testResult, setTestResult] = useState(null)
	const [discovering, setDiscovering] = useState(false)
	// We don't need a local state for useRemoteBrowser since we're using the
	// `enableRemoteBrowser` prop directly. This ensures the checkbox always
	// reflects the current global state.
	// Set up message listener for browser connection results.
	useEffect(() => {
		const handleMessage = (event) => {
			const message = event.data
			if (message.type === "browserConnectionResult") {
				setTestResult({ success: message.success, text: message.text })
				setTestingConnection(false)
				setDiscovering(false)
			}
		}
		window.addEventListener("message", handleMessage)
		return () => {
			window.removeEventListener("message", handleMessage)
		}
	}, [])
	const testConnection = async () => {
		setTestingConnection(true)
		setTestResult(null)
		try {
			// Send a message to the extension to test the connection.
			vscode.postMessage({ type: "testBrowserConnection", text: remoteBrowserHost })
		} catch (error) {
			setTestResult({
				success: false,
				text: `Error: ${error instanceof Error ? error.message : String(error)}`,
			})
			setTestingConnection(false)
		}
	}
	const options = useMemo(
		() => [
			{
				value: "1280x800",
				label: t("settings:browser.viewport.options.largeDesktop"),
			},
			{
				value: "900x600",
				label: t("settings:browser.viewport.options.smallDesktop"),
			},
			{ value: "768x1024", label: t("settings:browser.viewport.options.tablet") },
			{ value: "360x640", label: t("settings:browser.viewport.options.mobile") },
		],
		[t],
	)
	return _jsxs("div", {
		...props,
		children: [
			_jsx(SectionHeader, {
				children: _jsxs("div", {
					className: "flex items-center gap-2",
					children: [
						_jsx(SquareMousePointer, { className: "w-4" }),
						_jsx("div", { children: t("settings:sections.browser") }),
					],
				}),
			}),
			_jsxs(Section, {
				children: [
					_jsxs("div", {
						children: [
							_jsx(VSCodeCheckbox, {
								checked: browserToolEnabled,
								onChange: (e) => setCachedStateField("browserToolEnabled", e.target.checked),
								children: _jsx("span", {
									className: "font-medium",
									children: t("settings:browser.enable.label"),
								}),
							}),
							_jsx("div", {
								className: "text-vscode-descriptionForeground text-sm mt-1",
								children: _jsx(Trans, {
									i18nKey: "settings:browser.enable.description",
									children: _jsx(VSCodeLink, {
										href: buildDocLink("features/browser-use", "settings_browser_tool"),
										style: { display: "inline" },
										children: " ",
									}),
								}),
							}),
						],
					}),
					browserToolEnabled &&
						_jsxs("div", {
							className: "flex flex-col gap-3 pl-3 border-l-2 border-vscode-button-background",
							children: [
								_jsxs("div", {
									children: [
										_jsx("label", {
											className: "block font-medium mb-1",
											children: t("settings:browser.viewport.label"),
										}),
										_jsxs(Select, {
											value: browserViewportSize,
											onValueChange: (value) => setCachedStateField("browserViewportSize", value),
											children: [
												_jsx(SelectTrigger, {
													className: "w-full",
													children: _jsx(SelectValue, {
														placeholder: t("settings:common.select"),
													}),
												}),
												_jsx(SelectContent, {
													children: _jsx(SelectGroup, {
														children: options.map(({ value, label }) =>
															_jsx(SelectItem, { value: value, children: label }, value),
														),
													}),
												}),
											],
										}),
										_jsx("div", {
											className: "text-vscode-descriptionForeground text-sm mt-1",
											children: t("settings:browser.viewport.description"),
										}),
									],
								}),
								_jsxs("div", {
									children: [
										_jsx("label", {
											className: "block font-medium mb-1",
											children: t("settings:browser.screenshotQuality.label"),
										}),
										_jsxs("div", {
											className: "flex items-center gap-2",
											children: [
												_jsx(Slider, {
													min: 1,
													max: 100,
													step: 1,
													value: [screenshotQuality ?? 75],
													onValueChange: ([value]) =>
														setCachedStateField("screenshotQuality", value),
												}),
												_jsxs("span", {
													className: "w-10",
													children: [screenshotQuality ?? 75, "%"],
												}),
											],
										}),
										_jsx("div", {
											className: "text-vscode-descriptionForeground text-sm mt-1",
											children: t("settings:browser.screenshotQuality.description"),
										}),
									],
								}),
								_jsxs("div", {
									children: [
										_jsx(VSCodeCheckbox, {
											checked: remoteBrowserEnabled,
											onChange: (e) => {
												// Update the global state - remoteBrowserEnabled now means "enable remote browser connection".
												setCachedStateField("remoteBrowserEnabled", e.target.checked)
												if (!e.target.checked) {
													// If disabling remote browser, clear the custom URL.
													setCachedStateField("remoteBrowserHost", undefined)
												}
											},
											children: _jsx("label", {
												className: "block font-medium mb-1",
												children: t("settings:browser.remote.label"),
											}),
										}),
										_jsx("div", {
											className: "text-vscode-descriptionForeground text-sm mt-1",
											children: t("settings:browser.remote.description"),
										}),
									],
								}),
								remoteBrowserEnabled &&
									_jsxs(_Fragment, {
										children: [
											_jsxs("div", {
												className: "flex items-center gap-2",
												children: [
													_jsx(VSCodeTextField, {
														value: remoteBrowserHost ?? "",
														onChange: (e) =>
															setCachedStateField(
																"remoteBrowserHost",
																e.target.value || undefined,
															),
														placeholder: t("settings:browser.remote.urlPlaceholder"),
														style: { flexGrow: 1 },
													}),
													_jsx(VSCodeButton, {
														disabled: testingConnection,
														onClick: testConnection,
														children:
															testingConnection || discovering
																? t("settings:browser.remote.testingButton")
																: t("settings:browser.remote.testButton"),
													}),
												],
											}),
											testResult &&
												_jsx("div", {
													className: `p-2 rounded-xs text-sm ${
														testResult.success
															? "bg-green-800/20 text-green-400"
															: "bg-red-800/20 text-red-400"
													}`,
													children: testResult.text,
												}),
											_jsx("div", {
												className: "text-vscode-descriptionForeground text-sm mt-1",
												children: t("settings:browser.remote.instructions"),
											}),
										],
									}),
							],
						}),
				],
			}),
		],
	})
}
//# sourceMappingURL=BrowserSettings.js.map
