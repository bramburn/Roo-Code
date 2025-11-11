import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { vscode } from "@/utils/vscode"
import { useCopyToClipboard } from "@/utils/clipboard"
import { DeleteTaskDialog } from "../history/DeleteTaskDialog"
import { IconButton } from "./IconButton"
import { ShareButton } from "./ShareButton"
import { CloudTaskButton } from "./CloudTaskButton"
export const TaskActions = ({ item, buttonsDisabled }) => {
	const [deleteTaskId, setDeleteTaskId] = useState(null)
	const { t } = useTranslation()
	const { copyWithFeedback, showCopyFeedback } = useCopyToClipboard()
	return _jsxs("div", {
		className: "flex flex-row items-center",
		children: [
			_jsx(IconButton, {
				iconClass: "codicon-desktop-download",
				title: t("chat:task.export"),
				onClick: () => vscode.postMessage({ type: "exportCurrentTask" }),
			}),
			item?.task &&
				_jsx(IconButton, {
					iconClass: showCopyFeedback ? "codicon-check" : "codicon-copy",
					title: t("history:copyPrompt"),
					onClick: (e) => copyWithFeedback(item.task, e),
				}),
			!!item?.size &&
				item.size > 0 &&
				_jsxs(_Fragment, {
					children: [
						_jsx("div", {
							className: "flex items-center",
							children: _jsx(IconButton, {
								iconClass: "codicon-trash",
								title: t("chat:task.delete"),
								disabled: buttonsDisabled,
								onClick: (e) => {
									e.stopPropagation()
									if (e.shiftKey) {
										vscode.postMessage({ type: "deleteTaskWithId", text: item.id })
									} else {
										setDeleteTaskId(item.id)
									}
								},
							}),
						}),
						deleteTaskId &&
							_jsx(DeleteTaskDialog, {
								taskId: deleteTaskId,
								onOpenChange: (open) => !open && setDeleteTaskId(null),
								open: true,
							}),
					],
				}),
			_jsx(ShareButton, { item: item, disabled: false, showLabel: false }),
			_jsx(CloudTaskButton, { item: item, disabled: buttonsDisabled }),
		],
	})
}
//# sourceMappingURL=TaskActions.js.map
