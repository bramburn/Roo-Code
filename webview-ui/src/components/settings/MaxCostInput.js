import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime"
import { useTranslation } from "react-i18next"
import { vscode } from "@/utils/vscode"
import { useCallback } from "react"
import { FormattedTextField, unlimitedDecimalFormatter } from "../common/FormattedTextField"
export function MaxCostInput({ allowedMaxCost, onValueChange }) {
	const { t } = useTranslation()
	const handleValueChange = useCallback(
		(value) => {
			onValueChange(value)
			vscode.postMessage({ type: "allowedMaxCost", value })
		},
		[onValueChange],
	)
	return _jsxs(_Fragment, {
		children: [
			_jsxs("label", {
				className: "flex items-center gap-2 text-sm font-medium whitespace-nowrap",
				children: [
					_jsx("span", { className: "codicon codicon-credit-card" }),
					t("settings:autoApprove.apiCostLimit.title"),
					":",
				],
			}),
			_jsx(FormattedTextField, {
				value: allowedMaxCost,
				onValueChange: handleValueChange,
				formatter: unlimitedDecimalFormatter,
				placeholder: t("settings:autoApprove.apiCostLimit.unlimited"),
				style: { maxWidth: "200px" },
				"data-testid": "max-cost-input",
				leftNodes: [_jsx("span", { children: "$" }, "dollar")],
			}),
		],
	})
}
//# sourceMappingURL=MaxCostInput.js.map
