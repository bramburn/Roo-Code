import { jsx as _jsx } from "react/jsx-runtime";
import React, { useCallback, forwardRef } from "react";
import { useExtensionState } from "@/context/ExtensionStateContext";
import { cn } from "@/lib/utils";
export const Tab = ({ className, children, ...props }) => (_jsx("div", { className: cn("fixed inset-0 flex flex-col", className), ...props, children: children }));
export const TabHeader = ({ className, children, ...props }) => (_jsx("div", { className: cn("px-5 py-2.5 border-b border-vscode-panel-border", className), ...props, children: children }));
export const TabContent = forwardRef(({ className, children, ...props }, ref) => {
    const { renderContext } = useExtensionState();
    const onWheel = useCallback((e) => {
        if (renderContext !== "editor") {
            return;
        }
        const target = e.target;
        // Prevent scrolling if the target is a listbox or option
        // (e.g. selects, dropdowns, etc).
        if (target.role === "listbox" || target.role === "option") {
            return;
        }
        e.currentTarget.scrollTop += e.deltaY;
    }, [renderContext]);
    return (_jsx("div", { ref: ref, className: cn("flex-1 overflow-auto p-5", className), onWheel: onWheel, ...props, children: children }));
});
TabContent.displayName = "TabContent";
export const TabList = forwardRef(({ children, className, value, onValueChange, ...props }, ref) => {
    return (_jsx("div", { ref: ref, role: "tablist", className: cn("flex", className), ...props, children: React.Children.map(children, (child) => {
            if (React.isValidElement(child)) {
                return React.cloneElement(child, {
                    isSelected: child.props.value === value,
                    onSelect: () => onValueChange(child.props.value),
                });
            }
            return child;
        }) }));
});
export const TabTrigger = forwardRef(({ children, className, value: _value, isSelected, onSelect, ...props }, ref) => {
    return (_jsx("button", { ref: ref, role: "tab", "aria-selected": isSelected, tabIndex: isSelected ? 0 : -1, className: cn("focus:outline-none focus:ring-2 focus:ring-vscode-focusBorder", className), onClick: onSelect, ...props, children: children }));
});
//# sourceMappingURL=Tab.js.map