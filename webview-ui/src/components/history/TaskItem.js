import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { memo } from "react";
import { vscode } from "@/utils/vscode";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import TaskItemFooter from "./TaskItemFooter";
const TaskItem = ({ item, variant, showWorkspace = false, isSelectionMode = false, isSelected = false, onToggleSelection, onDelete, className, }) => {
    const handleClick = () => {
        if (isSelectionMode && onToggleSelection) {
            onToggleSelection(item.id, !isSelected);
        }
        else {
            vscode.postMessage({ type: "showTaskWithId", text: item.id });
        }
    };
    const isCompact = variant === "compact";
    return (_jsx("div", { "data-testid": `task-item-${item.id}`, className: cn("cursor-pointer group bg-vscode-editor-background rounded relative overflow-hidden border border-transparent hover:bg-vscode-list-hoverBackground transition-colors", className), onClick: handleClick, children: _jsxs("div", { className: (!isCompact && isSelectionMode ? "pl-3 pb-3" : "pl-4") + " flex gap-3 px-3 pt-3 pb-1", children: [!isCompact && isSelectionMode && (_jsx("div", { className: "task-checkbox mt-1", onClick: (e) => {
                        e.stopPropagation();
                    }, children: _jsx(Checkbox, { checked: isSelected, onCheckedChange: (checked) => onToggleSelection?.(item.id, checked === true), variant: "description" }) })), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("div", { className: cn("overflow-hidden whitespace-pre-wrap text-vscode-foreground text-ellipsis line-clamp-2", {
                                "text-base": !isCompact,
                            }, !isCompact && isSelectionMode ? "mb-1" : ""), "data-testid": "task-content", ...(item.highlight ? { dangerouslySetInnerHTML: { __html: item.highlight } } : {}), children: item.highlight ? undefined : item.task }), _jsx(TaskItemFooter, { item: item, variant: variant, isSelectionMode: isSelectionMode, onDelete: onDelete }), showWorkspace && item.workspace && (_jsxs("div", { className: "flex flex-row gap-1 text-vscode-descriptionForeground text-xs mt-1", children: [_jsx("span", { className: "codicon codicon-folder scale-80" }), _jsx("span", { children: item.workspace })] }))] })] }) }, item.id));
};
export default memo(TaskItem);
//# sourceMappingURL=TaskItem.js.map