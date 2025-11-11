import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime"
import { useTranslation } from "react-i18next"
import { MaxRequestsInput } from "./MaxRequestsInput"
import { MaxCostInput } from "./MaxCostInput"
export const MaxLimitInputs = ({ allowedMaxRequests, allowedMaxCost, onMaxRequestsChange, onMaxCostChange }) => {
	const { t } = useTranslation()
	return _jsxs("div", {
		className: "space-y-2",
		children: [
			_jsxs("div", {
				className: "grid grid-cols-[auto_1fr] gap-x-2 gap-y-2 items-center",
				children: [
					_jsx(MaxRequestsInput, {
						allowedMaxRequests: allowedMaxRequests,
						onValueChange: onMaxRequestsChange,
					}),
					_jsx(MaxCostInput, { allowedMaxCost: allowedMaxCost, onValueChange: onMaxCostChange }),
				],
			}),
			_jsx("div", {
				className: "text-xs text-vscode-descriptionForeground",
				children: t("settings:autoApprove.maxLimits.description"),
			}),
		],
	})
}
//# sourceMappingURL=MaxLimitInputs.js.map
