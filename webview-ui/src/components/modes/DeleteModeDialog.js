import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime"
import { useAppTranslation } from "@src/i18n/TranslationContext"
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@src/components/ui"
export const DeleteModeDialog = ({ open, onOpenChange, modeToDelete, onConfirm }) => {
	const { t } = useAppTranslation()
	return _jsx(AlertDialog, {
		open: open,
		onOpenChange: onOpenChange,
		children: _jsxs(AlertDialogContent, {
			children: [
				_jsxs(AlertDialogHeader, {
					children: [
						_jsx(AlertDialogTitle, { children: t("prompts:deleteMode.title") }),
						_jsx(AlertDialogDescription, {
							children:
								modeToDelete &&
								_jsxs(_Fragment, {
									children: [
										t("prompts:deleteMode.message", { modeName: modeToDelete.name }),
										modeToDelete.rulesFolderPath &&
											_jsx("div", {
												className: "mt-2",
												children: t("prompts:deleteMode.rulesFolder", {
													folderPath: modeToDelete.rulesFolderPath,
												}),
											}),
									],
								}),
						}),
					],
				}),
				_jsxs(AlertDialogFooter, {
					children: [
						_jsx(AlertDialogCancel, { children: t("prompts:deleteMode.cancel") }),
						_jsx(AlertDialogAction, { onClick: onConfirm, children: t("prompts:deleteMode.confirm") }),
					],
				}),
			],
		}),
	})
}
//# sourceMappingURL=DeleteModeDialog.js.map
