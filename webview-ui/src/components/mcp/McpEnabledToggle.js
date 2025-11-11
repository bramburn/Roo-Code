import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { VSCodeCheckbox } from "@vscode/webview-ui-toolkit/react";
import { useExtensionState } from "@src/context/ExtensionStateContext";
import { useAppTranslation } from "@src/i18n/TranslationContext";
import { vscode } from "@src/utils/vscode";
const McpEnabledToggle = () => {
    const { mcpEnabled, setMcpEnabled } = useExtensionState();
    const { t } = useAppTranslation();
    const handleChange = (e) => {
        const target = ("target" in e ? e.target : null);
        if (!target)
            return;
        setMcpEnabled(target.checked);
        vscode.postMessage({ type: "mcpEnabled", bool: target.checked });
    };
    return (_jsxs("div", { style: { marginBottom: "20px" }, children: [_jsx(VSCodeCheckbox, { checked: mcpEnabled, onChange: handleChange, children: _jsx("span", { style: { fontWeight: "500" }, children: t("mcp:enableToggle.title") }) }), _jsx("p", { style: {
                    fontSize: "12px",
                    marginTop: "5px",
                    color: "var(--vscode-descriptionForeground)",
                }, children: t("mcp:enableToggle.description") })] }));
};
export default McpEnabledToggle;
//# sourceMappingURL=McpEnabledToggle.js.map