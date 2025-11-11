import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime"
import { memo } from "react"
import { vscode } from "@src/utils/vscode"
import { useAppTranslation } from "@src/i18n/TranslationContext"
import { useTaskSearch } from "./useTaskSearch"
import TaskItem from "./TaskItem"
const HistoryPreview = () => {
	const { tasks } = useTaskSearch()
	const { t } = useAppTranslation()
	const handleViewAllHistory = () => {
		vscode.postMessage({ type: "switchTab", tab: "history" })
	}
	return _jsx("div", {
		className: "flex flex-col gap-3",
		children:
			tasks.length !== 0 &&
			_jsxs(_Fragment, {
				children: [
					tasks.slice(0, 3).map((item) => _jsx(TaskItem, { item: item, variant: "compact" }, item.id)),
					_jsx("button", {
						onClick: handleViewAllHistory,
						className:
							"text-base text-vscode-descriptionForeground hover:text-vscode-textLink-foreground transition-colors cursor-pointer text-center w-full",
						"aria-label": t("history:viewAllHistory"),
						children: t("history:viewAllHistory"),
					}),
				],
			}),
	})
}
export default memo(HistoryPreview)
//# sourceMappingURL=HistoryPreview.js.map
