import { jsx as _jsx } from "react/jsx-runtime";
import { vscode } from "@/utils/vscode";
import { Button, StandardTooltip } from "@/components/ui";
import { useAppTranslation } from "@/i18n/TranslationContext";
import { useCallback } from "react";
export const ExportButton = ({ itemId }) => {
    const { t } = useAppTranslation();
    const handleExportClick = useCallback((e) => {
        e.stopPropagation();
        vscode.postMessage({ type: "exportTaskWithId", text: itemId });
    }, [itemId]);
    return (_jsx(StandardTooltip, { content: t("history:exportTask"), children: _jsx(Button, { "data-testid": "export", variant: "ghost", size: "icon", className: "group-hover:opacity-100 opacity-50 transition-opacity", onClick: handleExportClick, children: _jsx("span", { className: "codicon codicon-desktop-download scale-80" }) }) }));
};
//# sourceMappingURL=ExportButton.js.map