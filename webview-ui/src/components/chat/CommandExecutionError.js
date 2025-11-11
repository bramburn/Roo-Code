import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime"
import { useCallback } from "react"
import { useTranslation, Trans } from "react-i18next"
import { VSCodeLink } from "@vscode/webview-ui-toolkit/react"
import { buildDocLink } from "../../utils/docLinks"
export const CommandExecutionError = () => {
	const { t } = useTranslation()
	const onClick = useCallback((e) => {
		e.preventDefault()
		window.postMessage({ type: "action", action: "settingsButtonClicked", values: { section: "terminal" } }, "*")
	}, [])
	return _jsx("div", {
		className: "text-sm bg-vscode-editor-background border border-vscode-border rounded-xs p-2",
		children: _jsxs("div", {
			className: "flex flex-col gap-2",
			children: [
				_jsxs("div", {
					className: "flex items-center",
					children: [
						_jsx("i", { className: "codicon codicon-warning mr-1 text-vscode-editorWarning-foreground" }),
						_jsx("span", {
							className: "text-vscode-editorWarning-foreground font-medium",
							children: t("chat:shellIntegration.title"),
						}),
					],
				}),
				_jsx("div", {
					children: _jsx(Trans, {
						i18nKey: "chat:shellIntegration.description",
						components: {
							settingsLink: _jsx(VSCodeLink, { href: "#", onClick: onClick, className: "inline" }),
						},
					}),
				}),
				_jsx("a", {
					href: buildDocLink("troubleshooting/shell-integration/", "error_tooltip"),
					className: "underline",
					style: { color: "inherit" },
					children: t("chat:shellIntegration.troubleshooting"),
				}),
			],
		}),
	})
}
//# sourceMappingURL=CommandExecutionError.js.map
