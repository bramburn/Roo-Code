import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime"
import { useMemo } from "react"
import { formatRelative } from "date-fns"
export const McpErrorRow = ({ error }) => {
	const color = useMemo(() => {
		switch (error.level) {
			case "error":
				return "var(--vscode-testing-iconFailed)"
			case "warn":
				return "var(--vscode-charts-yellow)"
			case "info":
				return "var(--vscode-testing-iconPassed)"
		}
	}, [error.level])
	return _jsxs("div", {
		className: "text-sm bg-vscode-textCodeBlock-background border-l-2 p-2",
		style: { borderColor: color },
		children: [
			_jsx("div", { className: "mb-1", style: { color }, children: error.message }),
			_jsx("div", {
				className: "text-xs text-vscode-descriptionForeground",
				children: formatRelative(error.timestamp, new Date()),
			}),
		],
	})
}
//# sourceMappingURL=McpErrorRow.js.map
