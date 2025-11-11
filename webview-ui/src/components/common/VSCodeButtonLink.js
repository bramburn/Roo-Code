import { jsx as _jsx } from "react/jsx-runtime";
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react";
export const VSCodeButtonLink = ({ href, children, ...props }) => (_jsx("a", { href: href, style: {
        textDecoration: "none",
        color: "inherit",
    }, children: _jsx(VSCodeButton, { ...props, children: children }) }));
//# sourceMappingURL=VSCodeButtonLink.js.map