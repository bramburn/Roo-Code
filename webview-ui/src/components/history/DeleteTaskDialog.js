import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect } from "react";
import { useKeyPress } from "react-use";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, Button, } from "@/components/ui";
import { useAppTranslation } from "@/i18n/TranslationContext";
import { vscode } from "@/utils/vscode";
export const DeleteTaskDialog = ({ taskId, ...props }) => {
    const { t } = useAppTranslation();
    const [isEnterPressed] = useKeyPress("Enter");
    const { onOpenChange } = props;
    const onDelete = useCallback(() => {
        if (taskId) {
            vscode.postMessage({ type: "deleteTaskWithId", text: taskId });
            onOpenChange?.(false);
        }
    }, [taskId, onOpenChange]);
    useEffect(() => {
        if (taskId && isEnterPressed) {
            onDelete();
        }
    }, [taskId, isEnterPressed, onDelete]);
    return (_jsx(AlertDialog, { ...props, children: _jsxs(AlertDialogContent, { onEscapeKeyDown: () => onOpenChange?.(false), children: [_jsxs(AlertDialogHeader, { children: [_jsx(AlertDialogTitle, { children: t("history:deleteTask") }), _jsx(AlertDialogDescription, { children: t("history:deleteTaskMessage") })] }), _jsxs(AlertDialogFooter, { children: [_jsx(AlertDialogCancel, { asChild: true, children: _jsx(Button, { variant: "secondary", children: t("history:cancel") }) }), _jsx(AlertDialogAction, { asChild: true, children: _jsx(Button, { variant: "destructive", onClick: onDelete, children: t("history:delete") }) })] })] }) }));
};
//# sourceMappingURL=DeleteTaskDialog.js.map