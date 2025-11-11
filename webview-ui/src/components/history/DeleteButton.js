import { jsx as _jsx } from "react/jsx-runtime";
import { useCallback } from "react";
import { Button, StandardTooltip } from "@/components/ui";
import { useAppTranslation } from "@/i18n/TranslationContext";
import { vscode } from "@/utils/vscode";
export const DeleteButton = ({ itemId, onDelete }) => {
    const { t } = useAppTranslation();
    const handleDeleteClick = useCallback((e) => {
        e.stopPropagation();
        if (e.shiftKey) {
            vscode.postMessage({ type: "deleteTaskWithId", text: itemId });
        }
        else if (onDelete) {
            onDelete(itemId);
        }
    }, [itemId, onDelete]);
    return (_jsx(StandardTooltip, { content: t("history:deleteTaskTitle"), children: _jsx(Button, { variant: "ghost", size: "icon", "data-testid": "delete-task-button", onClick: handleDeleteClick, className: "opacity-70", children: _jsx("span", { className: "codicon codicon-trash size-4 align-middle text-vscode-descriptionForeground" }) }) }));
};
//# sourceMappingURL=DeleteButton.js.map