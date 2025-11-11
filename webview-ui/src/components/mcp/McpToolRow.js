import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { VSCodeCheckbox } from "@vscode/webview-ui-toolkit/react";
import { useAppTranslation } from "@src/i18n/TranslationContext";
import { vscode } from "@src/utils/vscode";
import { StandardTooltip, ToggleSwitch } from "@/components/ui";
const McpToolRow = ({ tool, serverName, serverSource, alwaysAllowMcp, isInChatContext = false }) => {
    const { t } = useAppTranslation();
    const isToolEnabled = tool.enabledForPrompt ?? true;
    const handleAlwaysAllowChange = () => {
        if (!serverName)
            return;
        vscode.postMessage({
            type: "toggleToolAlwaysAllow",
            serverName,
            source: serverSource || "global",
            toolName: tool.name,
            alwaysAllow: !tool.alwaysAllow,
        });
    };
    const handleEnabledForPromptChange = () => {
        if (!serverName)
            return;
        vscode.postMessage({
            type: "toggleToolEnabledForPrompt",
            serverName,
            source: serverSource || "global",
            toolName: tool.name,
            isEnabled: !tool.enabledForPrompt,
        });
    };
    return (_jsxs("div", { className: "py-2 border-b border-vscode-panel-border last:border-b-0", children: [_jsxs("div", { "data-testid": "tool-row-container", className: "flex items-center gap-4", onClick: (e) => e.stopPropagation(), children: [_jsxs("div", { className: "flex items-center min-w-0 flex-1", children: [_jsx("span", { className: `codicon codicon-symbol-method mr-2 flex-shrink-0 ${isToolEnabled
                                    ? "text-vscode-symbolIcon-methodForeground"
                                    : "text-vscode-descriptionForeground opacity-60"}` }), _jsx(StandardTooltip, { content: tool.name, children: _jsx("span", { className: `font-medium truncate ${isToolEnabled
                                        ? "text-vscode-foreground"
                                        : "text-vscode-descriptionForeground opacity-60"}`, children: tool.name }) })] }), serverName && (_jsxs("div", { className: "flex items-center gap-4 flex-shrink-0", children: [alwaysAllowMcp && isToolEnabled && (_jsx(VSCodeCheckbox, { checked: tool.alwaysAllow, onChange: handleAlwaysAllowChange, "data-tool": tool.name, className: "text-xs", children: _jsx("span", { className: "text-vscode-descriptionForeground whitespace-nowrap", children: t("mcp:tool.alwaysAllow") }) })), !isInChatContext && (_jsx(StandardTooltip, { content: t("mcp:tool.togglePromptInclusion"), children: _jsx(ToggleSwitch, { checked: isToolEnabled, onChange: handleEnabledForPromptChange, size: "medium", "aria-label": t("mcp:tool.togglePromptInclusion"), "data-testid": `tool-prompt-toggle-${tool.name}` }) }))] }))] }), tool.description && (_jsx("div", { className: `mt-1 text-xs text-vscode-descriptionForeground ${isToolEnabled ? "opacity-80" : "opacity-40"}`, children: tool.description })), isToolEnabled &&
                tool.inputSchema &&
                "properties" in tool.inputSchema &&
                Object.keys(tool.inputSchema.properties).length > 0 && (_jsxs("div", { className: "mt-2 text-xs border border-vscode-panel-border rounded p-2", children: [_jsx("div", { className: "mb-1 text-[11px] uppercase opacity-80 text-vscode-descriptionForeground", children: t("mcp:tool.parameters") }), Object.entries(tool.inputSchema.properties).map(([paramName, schema]) => {
                        const isRequired = tool.inputSchema &&
                            "required" in tool.inputSchema &&
                            Array.isArray(tool.inputSchema.required) &&
                            tool.inputSchema.required.includes(paramName);
                        return (_jsxs("div", { className: "flex items-baseline mt-1", children: [_jsxs("code", { className: "text-vscode-textPreformat-foreground mr-2", children: [paramName, isRequired && _jsx("span", { className: "text-vscode-errorForeground", children: "*" })] }), _jsx("span", { className: "opacity-80 break-words text-vscode-descriptionForeground", children: schema.description || t("mcp:tool.noDescription") })] }, paramName));
                    })] }))] }, tool.name));
};
export default McpToolRow;
//# sourceMappingURL=McpToolRow.js.map