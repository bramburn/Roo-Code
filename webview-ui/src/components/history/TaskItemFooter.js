import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime"
import { formatTimeAgo } from "@/utils/format"
import { CopyButton } from "./CopyButton"
import { ExportButton } from "./ExportButton"
import { DeleteButton } from "./DeleteButton"
import { StandardTooltip } from "../ui/standard-tooltip"
const TaskItemFooter = ({ item, variant, isSelectionMode = false, onDelete }) => {
	return _jsxs("div", {
		className: "text-xs text-vscode-descriptionForeground flex justify-between items-center",
		children: [
			_jsxs("div", {
				className: "flex gap-2 items-center text-vscode-descriptionForeground/60",
				children: [
					_jsx(StandardTooltip, {
						content: new Date(item.ts).toLocaleString(),
						children: _jsx("span", {
							className: "first-letter:uppercase",
							children: formatTimeAgo(item.ts),
						}),
					}),
					_jsx("span", { children: "\u00B7" }),
					!!item.totalCost &&
						_jsx("span", {
							className: "flex items-center",
							"data-testid": "cost-footer-compact",
							children: "$" + item.totalCost.toFixed(2),
						}),
				],
			}),
			!isSelectionMode &&
				_jsxs("div", {
					className:
						"flex flex-row gap-0 items-center text-vscode-descriptionForeground/60 hover:text-vscode-descriptionForeground",
					children: [
						_jsx(CopyButton, { itemTask: item.task }),
						variant === "full" && _jsx(ExportButton, { itemId: item.id }),
						onDelete && _jsx(DeleteButton, { itemId: item.id, onDelete: onDelete }),
					],
				}),
		],
	})
}
export default TaskItemFooter
//# sourceMappingURL=TaskItemFooter.js.map
