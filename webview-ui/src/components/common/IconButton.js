import { jsx as _jsx } from "react/jsx-runtime";
import { StandardTooltip } from "@/components/ui";
export function IconButton({ icon, onClick, onMouseDown, onMouseUp, onMouseLeave, title, size = "medium", variant = "default", }) {
    const sizeClasses = {
        small: "w-6 h-6",
        medium: "w-7 h-7",
    };
    const variantClasses = {
        default: "bg-transparent hover:bg-vscode-toolbar-hoverBackground",
        transparent: "bg-transparent hover:bg-vscode-toolbar-hoverBackground",
    };
    const handleClick = onClick || ((_event) => { });
    const button = (_jsx("button", { className: `${sizeClasses[size]} flex items-center justify-center border-none text-vscode-editor-foreground cursor-pointer rounded-[3px] ${variantClasses[variant]}`, "aria-label": title, onClick: handleClick, onMouseDown: onMouseDown, onMouseUp: onMouseUp, onMouseLeave: onMouseLeave, children: _jsx("span", { className: `codicon codicon-${icon}` }) }));
    if (title) {
        return _jsx(StandardTooltip, { content: title, children: button });
    }
    return button;
}
//# sourceMappingURL=IconButton.js.map