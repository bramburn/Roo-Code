import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime"
export const ApiErrorMessage = ({ errorMessage, children }) =>
	_jsxs("div", {
		className: "flex flex-col gap-2 text-vscode-errorForeground text-sm",
		"data-testid": "api-error-message",
		children: [
			_jsxs("div", {
				className: "flex flex-row items-center gap-1",
				children: [
					_jsx("div", { className: "codicon codicon-close" }),
					_jsx("div", { children: errorMessage }),
				],
			}),
			children,
		],
	})
//# sourceMappingURL=ApiErrorMessage.js.map
