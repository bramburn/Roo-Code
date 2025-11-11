import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime"
import { useCallback } from "react"
import { useAppTranslation } from "@/i18n/TranslationContext"
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	Button,
} from "@/components/ui"
import { vscode } from "@/utils/vscode"
export const BatchDeleteTaskDialog = ({ taskIds, ...props }) => {
	const { t } = useAppTranslation()
	const { onOpenChange } = props
	const onDelete = useCallback(() => {
		if (taskIds.length > 0) {
			vscode.postMessage({ type: "deleteMultipleTasksWithIds", ids: taskIds })
			onOpenChange?.(false)
		}
	}, [taskIds, onOpenChange])
	return _jsx(AlertDialog, {
		...props,
		children: _jsxs(AlertDialogContent, {
			className: "max-w-md",
			children: [
				_jsxs(AlertDialogHeader, {
					children: [
						_jsx(AlertDialogTitle, { children: t("history:deleteTasks") }),
						_jsxs(AlertDialogDescription, {
							className: "text-vscode-foreground",
							children: [
								_jsx("div", {
									className: "mb-2",
									children: t("history:confirmDeleteTasks", { count: taskIds.length }),
								}),
								_jsx("div", {
									className:
										"text-vscode-editor-foreground bg-vscode-editor-background p-2 rounded text-sm",
									children: t("history:deleteTasksWarning"),
								}),
							],
						}),
					],
				}),
				_jsxs(AlertDialogFooter, {
					children: [
						_jsx(AlertDialogCancel, {
							asChild: true,
							children: _jsx(Button, { variant: "secondary", children: t("history:cancel") }),
						}),
						_jsx(AlertDialogAction, {
							asChild: true,
							children: _jsxs(Button, {
								variant: "destructive",
								onClick: onDelete,
								children: [
									_jsx("span", { className: "codicon codicon-trash mr-1" }),
									t("history:deleteItems", { count: taskIds.length }),
								],
							}),
						}),
					],
				}),
			],
		}),
	})
}
//# sourceMappingURL=BatchDeleteTaskDialog.js.map
