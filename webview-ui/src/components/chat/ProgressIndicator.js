import { jsx as _jsx } from "react/jsx-runtime";
import { VSCodeProgressRing } from "@vscode/webview-ui-toolkit/react";
export const ProgressIndicator = () => (_jsx("div", { style: {
        width: "16px",
        height: "16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    }, children: _jsx("div", { style: { transform: "scale(0.55)", transformOrigin: "center" }, children: _jsx(VSCodeProgressRing, {}) }) }));
//# sourceMappingURL=ProgressIndicator.js.map