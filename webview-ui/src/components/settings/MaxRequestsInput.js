import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime"
import { useTranslation } from "react-i18next"
import { vscode } from "@/utils/vscode"
import { useCallback } from "react"
import { FormattedTextField, unlimitedIntegerFormatter } from "../common/FormattedTextField"
export function MaxRequestsInput({ allowedMaxRequests, onValueChange }) {
	const { t } = useTranslation()
	const handleValueChange = useCallback(
		(value) => {
			onValueChange(value)
			vscode.postMessage({ type: "allowedMaxRequests", value })
		},
		[onValueChange],
	)
	return _jsxs(_Fragment, {
		children: [
			_jsxs("label", {
				className: "flex items-center gap-2 text-sm font-medium whitespace-nowrap",
				children: [
					_jsx("span", { className: "codicon codicon-pulse" }),
					t("settings:autoApprove.apiRequestLimit.title"),
					":",
				],
			}),
			_jsx(FormattedTextField, {
				value: allowedMaxRequests,
				onValueChange: handleValueChange,
				formatter: unlimitedIntegerFormatter,
				placeholder: t("settings:autoApprove.apiRequestLimit.unlimited"),
				style: { maxWidth: "200px" },
				"data-testid": "max-requests-input",
			}),
		],
	})
}
//# sourceMappingURL=MaxRequestsInput.js.map
