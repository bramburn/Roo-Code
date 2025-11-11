import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime"
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
export const CheckpointRestoreDialog = ({ open, onOpenChange, onConfirm, type, hasCheckpoint }) => {
	const { t } = useAppTranslation()
	const isEdit = type === "edit"
	const title = isEdit ? t("common:confirmation.editMessage") : t("common:confirmation.deleteMessage")
	const description = isEdit
		? t("common:confirmation.editQuestionWithCheckpoint")
		: t("common:confirmation.deleteQuestionWithCheckpoint")
	const handleConfirmWithRestore = () => {
		onConfirm(true)
		onOpenChange(false)
	}
	const handleConfirmWithoutRestore = () => {
		onConfirm(false)
		onOpenChange(false)
	}
	return _jsx(AlertDialog, {
		open: open,
		onOpenChange: onOpenChange,
		children: _jsxs(AlertDialogContent, {
			children: [
				_jsxs(AlertDialogHeader, {
					children: [
						_jsx(AlertDialogTitle, { className: "text-lg", children: title }),
						_jsx(AlertDialogDescription, { className: "text-base", children: description }),
					],
				}),
				_jsxs(AlertDialogFooter, {
					className: "flex-col gap-2",
					children: [
						_jsx(AlertDialogCancel, {
							className:
								"bg-vscode-button-secondaryBackground hover:bg-vscode-button-secondaryHoverBackground text-vscode-button-secondaryForeground border-vscode-button-border",
							children: t("common:answers.cancel"),
						}),
						_jsx(AlertDialogAction, {
							onClick: handleConfirmWithoutRestore,
							className:
								"bg-vscode-button-background hover:bg-vscode-button-hoverBackground text-vscode-button-foreground border-vscode-button-border",
							children: isEdit ? t("common:confirmation.editOnly") : t("common:confirmation.deleteOnly"),
						}),
						hasCheckpoint &&
							_jsx(AlertDialogAction, {
								onClick: handleConfirmWithRestore,
								className:
									"bg-vscode-button-background hover:bg-vscode-button-hoverBackground text-vscode-button-foreground border-vscode-button-border",
								children: t("common:confirmation.restoreToCheckpoint"),
							}),
					],
				}),
			],
		}),
	})
}
// Export convenience components for backward compatibility
export const EditMessageWithCheckpointDialog = (props) => _jsx(CheckpointRestoreDialog, { ...props, type: "edit" })
export const DeleteMessageWithCheckpointDialog = (props) => _jsx(CheckpointRestoreDialog, { ...props, type: "delete" })
//# sourceMappingURL=CheckpointRestoreDialog.js.map
