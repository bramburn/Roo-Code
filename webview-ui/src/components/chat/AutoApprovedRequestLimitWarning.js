import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime"
import { memo, useState } from "react"
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react"
import { Trans } from "react-i18next"
import { vscode } from "@src/utils/vscode"
export const AutoApprovedRequestLimitWarning = memo(({ message }) => {
	const [buttonClicked, setButtonClicked] = useState(false)
	const { count, type = "requests" } = JSON.parse(message.text ?? "{}")
	if (buttonClicked) {
		return null
	}
	const isCostLimit = type === "cost"
	const titleKey = isCostLimit
		? "ask.autoApprovedCostLimitReached.title"
		: "ask.autoApprovedRequestLimitReached.title"
	const descriptionKey = isCostLimit
		? "ask.autoApprovedCostLimitReached.description"
		: "ask.autoApprovedRequestLimitReached.description"
	const buttonKey = isCostLimit
		? "ask.autoApprovedCostLimitReached.button"
		: "ask.autoApprovedRequestLimitReached.button"
	return _jsxs(_Fragment, {
		children: [
			_jsxs("div", {
				style: { display: "flex", alignItems: "center", gap: "8px", color: "var(--vscode-foreground)" },
				children: [
					_jsx("span", { className: "codicon codicon-warning" }),
					_jsx("span", {
						style: { fontWeight: "bold" },
						children: _jsx(Trans, { i18nKey: titleKey, ns: "chat" }),
					}),
				],
			}),
			_jsxs("div", {
				className: "bg-vscode-panel-border flex flex-col gap-3",
				style: {
					borderRadius: "4px",
					display: "flex",
					marginTop: "15px",
					padding: "14px 16px 22px",
					justifyContent: "center",
				},
				children: [
					_jsx("div", {
						className: "flex justify-between items-center",
						children: _jsx(Trans, { i18nKey: descriptionKey, ns: "chat", values: { count } }),
					}),
					_jsx(VSCodeButton, {
						style: { width: "100%", padding: "6px", borderRadius: "4px" },
						onClick: (e) => {
							e.preventDefault()
							setButtonClicked(true)
							vscode.postMessage({ type: "askResponse", askResponse: "yesButtonClicked" })
						},
						children: _jsx(Trans, { i18nKey: buttonKey, ns: "chat" }),
					}),
				],
			}),
		],
	})
})
//# sourceMappingURL=AutoApprovedRequestLimitWarning.js.map
