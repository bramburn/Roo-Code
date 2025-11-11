import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { VSCodeBadge } from "@vscode/webview-ui-toolkit/react";
import { Markdown } from "./Markdown";
import { ProgressIndicator } from "./ProgressIndicator";
export const ContextCondenseRow = ({ cost, prevContextTokens, newContextTokens, summary }) => {
    const { t } = useTranslation();
    const [isExpanded, setIsExpanded] = useState(false);
    // Handle null/undefined token values to prevent crashes
    const prevTokens = prevContextTokens ?? 0;
    const newTokens = newContextTokens ?? 0;
    const displayCost = cost ?? 0;
    return (_jsxs("div", { className: "mb-2", children: [_jsxs("div", { className: "flex items-center justify-between cursor-pointer select-none", onClick: () => setIsExpanded(!isExpanded), children: [_jsx("div", { style: {
                            width: 16,
                            height: 16,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }, children: _jsx("span", { className: `codicon codicon-check`, style: { color: "var(--vscode-charts-green)", fontSize: 16, marginBottom: "-1.5px" } }) }), _jsxs("div", { className: "flex items-center gap-2 flex-grow", children: [_jsx("span", { className: "codicon codicon-compress text-blue-400" }), _jsx("span", { className: "font-bold text-vscode-foreground", children: t("chat:contextCondense.title") }), _jsxs("span", { className: "text-vscode-descriptionForeground text-sm", children: [prevTokens.toLocaleString(), " \u2192 ", newTokens.toLocaleString(), " ", t("tokens")] }), _jsxs(VSCodeBadge, { className: displayCost > 0 ? "opacity-100" : "opacity-0", children: ["$", displayCost.toFixed(2)] })] }), _jsx("span", { className: `codicon codicon-chevron-${isExpanded ? "up" : "down"}` })] }), isExpanded && (_jsx("div", { className: "mt-2 ml-0 p-4 bg-vscode-editor-background rounded text-vscode-foreground text-sm", children: _jsx(Markdown, { markdown: summary }) }))] }));
};
export const CondensingContextRow = () => {
    const { t } = useTranslation();
    return (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(ProgressIndicator, {}), _jsx("span", { className: "codicon codicon-compress text-blue-400" }), _jsx("span", { className: "font-bold text-vscode-foreground", children: t("chat:contextCondense.condensing") })] }));
};
export const CondenseContextErrorRow = ({ errorText }) => {
    const { t } = useTranslation();
    return (_jsxs("div", { className: "flex flex-col gap-1", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "codicon codicon-warning text-vscode-editorWarning-foreground opacity-80 text-base -mb-0.5" }), _jsx("span", { className: "font-bold text-vscode-foreground", children: t("chat:contextCondense.errorHeader") })] }), _jsx("span", { className: "text-vscode-descriptionForeground text-sm", children: errorText })] }));
};
//# sourceMappingURL=ContextCondenseRow.js.map