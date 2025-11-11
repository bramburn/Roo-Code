import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Edit, Trash2 } from "lucide-react";
import { useAppTranslation } from "@/i18n/TranslationContext";
import { Button, StandardTooltip } from "@/components/ui";
import { vscode } from "@/utils/vscode";
export const SlashCommandItem = ({ command, onDelete, onClick }) => {
    const { t } = useAppTranslation();
    // Built-in commands cannot be edited or deleted
    const isBuiltIn = command.source === "built-in";
    const handleEdit = () => {
        if (command.filePath) {
            vscode.postMessage({
                type: "openFile",
                text: command.filePath,
            });
        }
        else {
            // Fallback: request to open command file by name and source
            vscode.postMessage({
                type: "openCommandFile",
                text: command.name,
                values: { source: command.source },
            });
        }
    };
    const handleDelete = () => {
        onDelete(command);
    };
    return (_jsxs("div", { className: "px-4 py-2 text-sm flex items-center group hover:bg-vscode-list-hoverBackground", children: [_jsx("div", { className: "flex-1 min-w-0 cursor-pointer", onClick: () => onClick?.(command), children: _jsxs("div", { children: [_jsx("span", { className: "truncate text-vscode-foreground", children: command.name }), command.description && (_jsx("div", { className: "text-xs text-vscode-descriptionForeground truncate mt-0.5", children: command.description }))] }) }), !isBuiltIn && (_jsxs("div", { className: "flex items-center gap-2 ml-2", children: [_jsx(StandardTooltip, { content: t("chat:slashCommands.editCommand"), children: _jsx(Button, { variant: "ghost", size: "icon", tabIndex: -1, onClick: handleEdit, className: "size-6 flex items-center justify-center opacity-60 hover:opacity-100", children: _jsx(Edit, { className: "w-4 h-4" }) }) }), _jsx(StandardTooltip, { content: t("chat:slashCommands.deleteCommand"), children: _jsx(Button, { variant: "ghost", size: "icon", tabIndex: -1, onClick: handleDelete, className: "size-6 flex items-center justify-center opacity-60 hover:opacity-100 hover:text-red-400", children: _jsx(Trash2, { className: "w-4 h-4" }) }) })] }))] }));
};
//# sourceMappingURL=SlashCommandItem.js.map