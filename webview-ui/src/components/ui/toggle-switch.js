import { jsx as _jsx } from "react/jsx-runtime";
export const ToggleSwitch = ({ checked, onChange, disabled = false, size = "small", "aria-label": ariaLabel, "data-testid": dataTestId, }) => {
    const dimensions = size === "small" ? { width: 16, height: 8, dotSize: 4 } : { width: 20, height: 10, dotSize: 6 };
    const handleKeyDown = (e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (!disabled) {
                onChange();
            }
        }
    };
    return (_jsx("div", { role: "switch", "aria-checked": checked, "aria-label": ariaLabel, tabIndex: disabled ? -1 : 0, "data-testid": dataTestId, style: {
            width: `${dimensions.width}px`,
            height: `${dimensions.height}px`,
            backgroundColor: checked
                ? "var(--vscode-button-background)"
                : "var(--vscode-titleBar-inactiveForeground)",
            borderRadius: `${dimensions.height / 2}px`,
            position: "relative",
            cursor: disabled ? "not-allowed" : "pointer",
            transition: "background-color 0.2s",
            opacity: disabled ? 0.4 : checked ? 0.8 : 0.6,
        }, onClick: disabled ? undefined : onChange, onKeyDown: handleKeyDown, children: _jsx("div", { style: {
                width: `${dimensions.dotSize}px`,
                height: `${dimensions.dotSize}px`,
                backgroundColor: "var(--vscode-titleBar-activeForeground)",
                borderRadius: "50%",
                position: "absolute",
                top: `${(dimensions.height - dimensions.dotSize) / 2}px`,
                left: checked
                    ? `${dimensions.width - dimensions.dotSize - (dimensions.height - dimensions.dotSize) / 2}px`
                    : `${(dimensions.height - dimensions.dotSize) / 2}px`,
                transition: "left 0.2s",
            } }) }));
};
//# sourceMappingURL=toggle-switch.js.map