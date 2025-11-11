import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState } from "react";
import { Trans } from "react-i18next";
import { VSCodeButton, VSCodeCheckbox, VSCodeLink, VSCodePanels, VSCodePanelTab, VSCodePanelView, } from "@vscode/webview-ui-toolkit/react";
import { vscode } from "@src/utils/vscode";
import { useExtensionState } from "@src/context/ExtensionStateContext";
import { useAppTranslation } from "@src/i18n/TranslationContext";
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, ToggleSwitch, StandardTooltip, } from "@src/components/ui";
import { buildDocLink } from "@src/utils/docLinks";
import { Tab, TabContent, TabHeader } from "../common/Tab";
import McpToolRow from "./McpToolRow";
import McpResourceRow from "./McpResourceRow";
import McpEnabledToggle from "./McpEnabledToggle";
import { McpErrorRow } from "./McpErrorRow";
const McpView = ({ onDone }) => {
    const { mcpServers: servers, alwaysAllowMcp, mcpEnabled, enableMcpServerCreation, setEnableMcpServerCreation, } = useExtensionState();
    const { t } = useAppTranslation();
    return (_jsxs(Tab, { children: [_jsxs(TabHeader, { className: "flex justify-between items-center", children: [_jsx("h3", { className: "text-vscode-foreground m-0", children: t("mcp:title") }), _jsx(Button, { onClick: onDone, children: t("mcp:done") })] }), _jsxs(TabContent, { children: [_jsx("div", { style: {
                            color: "var(--vscode-foreground)",
                            fontSize: "13px",
                            marginBottom: "10px",
                            marginTop: "5px",
                        }, children: _jsx(Trans, { i18nKey: "mcp:description", children: _jsx(VSCodeLink, { href: buildDocLink("features/mcp/using-mcp-in-roo", "mcp_settings"), style: { display: "inline" }, children: "Learn More" }) }) }), _jsx(McpEnabledToggle, {}), mcpEnabled && (_jsxs(_Fragment, { children: [_jsxs("div", { style: { marginBottom: 15 }, children: [_jsx(VSCodeCheckbox, { checked: enableMcpServerCreation, onChange: (e) => {
                                            setEnableMcpServerCreation(e.target.checked);
                                            vscode.postMessage({ type: "enableMcpServerCreation", bool: e.target.checked });
                                        }, children: _jsx("span", { style: { fontWeight: "500" }, children: t("mcp:enableServerCreation.title") }) }), _jsxs("div", { style: {
                                            fontSize: "12px",
                                            marginTop: "5px",
                                            color: "var(--vscode-descriptionForeground)",
                                        }, children: [_jsxs(Trans, { i18nKey: "mcp:enableServerCreation.description", children: [_jsx(VSCodeLink, { href: buildDocLink("features/mcp/using-mcp-in-roo#how-to-use-roo-to-create-an-mcp-server", "mcp_server_creation"), style: { display: "inline" }, children: "Learn about server creation" }), _jsx("strong", { children: "new" })] }), _jsx("p", { style: { marginTop: "8px" }, children: t("mcp:enableServerCreation.hint") })] })] }), servers.length > 0 && (_jsx("div", { style: { display: "flex", flexDirection: "column", gap: "10px" }, children: servers.map((server) => (_jsx(ServerRow, { server: server, alwaysAllowMcp: alwaysAllowMcp }, `${server.name}-${server.source || "global"}`))) })), _jsxs("div", { style: {
                                    marginTop: "10px",
                                    width: "100%",
                                    display: "grid",
                                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                                    gap: "10px",
                                }, children: [_jsxs(Button, { variant: "secondary", style: { width: "100%" }, onClick: () => {
                                            vscode.postMessage({ type: "openMcpSettings" });
                                        }, children: [_jsx("span", { className: "codicon codicon-edit", style: { marginRight: "6px" } }), t("mcp:editGlobalMCP")] }), _jsxs(Button, { variant: "secondary", style: { width: "100%" }, onClick: () => {
                                            vscode.postMessage({ type: "openProjectMcpSettings" });
                                        }, children: [_jsx("span", { className: "codicon codicon-edit", style: { marginRight: "6px" } }), t("mcp:editProjectMCP")] }), _jsxs(Button, { variant: "secondary", style: { width: "100%" }, onClick: () => {
                                            vscode.postMessage({ type: "refreshAllMcpServers" });
                                        }, children: [_jsx("span", { className: "codicon codicon-refresh", style: { marginRight: "6px" } }), t("mcp:refreshMCP")] }), _jsx(StandardTooltip, { content: t("mcp:marketplace"), children: _jsxs(Button, { variant: "secondary", style: { width: "100%" }, onClick: () => {
                                                window.postMessage({
                                                    type: "action",
                                                    action: "marketplaceButtonClicked",
                                                    values: { marketplaceTab: "mcp" },
                                                }, "*");
                                            }, children: [_jsx("span", { className: "codicon codicon-extensions", style: { marginRight: "6px" } }), t("mcp:marketplace")] }) })] }), _jsx("div", { style: {
                                    marginTop: "15px",
                                    fontSize: "12px",
                                    color: "var(--vscode-descriptionForeground)",
                                }, children: _jsx(VSCodeLink, { href: buildDocLink("features/mcp/using-mcp-in-roo#editing-mcp-settings-files", "mcp_edit_settings"), style: { display: "inline" }, children: t("mcp:learnMoreEditingSettings") }) })] }))] })] }));
};
const ServerRow = ({ server, alwaysAllowMcp }) => {
    const { t } = useAppTranslation();
    const [isExpanded, setIsExpanded] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [timeoutValue, setTimeoutValue] = useState(() => {
        const configTimeout = JSON.parse(server.config)?.timeout;
        return configTimeout ?? 60; // Default 1 minute (60 seconds)
    });
    // Computed property to check if server is expandable
    const isExpandable = server.status === "connected" && !server.disabled;
    const timeoutOptions = [
        { value: 15, label: t("mcp:networkTimeout.options.15seconds") },
        { value: 30, label: t("mcp:networkTimeout.options.30seconds") },
        { value: 60, label: t("mcp:networkTimeout.options.1minute") },
        { value: 300, label: t("mcp:networkTimeout.options.5minutes") },
        { value: 600, label: t("mcp:networkTimeout.options.10minutes") },
        { value: 900, label: t("mcp:networkTimeout.options.15minutes") },
        { value: 1800, label: t("mcp:networkTimeout.options.30minutes") },
        { value: 3600, label: t("mcp:networkTimeout.options.60minutes") },
    ];
    const getStatusColor = () => {
        // Disabled servers should always show grey regardless of connection status
        if (server.disabled) {
            return "var(--vscode-descriptionForeground)";
        }
        switch (server.status) {
            case "connected":
                return "var(--vscode-testing-iconPassed)";
            case "connecting":
                return "var(--vscode-charts-yellow)";
            case "disconnected":
                return "var(--vscode-testing-iconFailed)";
        }
    };
    const handleRowClick = () => {
        // Only allow expansion for connected and enabled servers
        if (isExpandable) {
            setIsExpanded(!isExpanded);
        }
    };
    const handleRestart = () => {
        vscode.postMessage({
            type: "restartMcpServer",
            text: server.name,
            source: server.source || "global",
        });
    };
    const handleTimeoutChange = (event) => {
        const seconds = parseInt(event.target.value);
        setTimeoutValue(seconds);
        vscode.postMessage({
            type: "updateMcpTimeout",
            serverName: server.name,
            source: server.source || "global",
            timeout: seconds,
        });
    };
    const handleDelete = () => {
        vscode.postMessage({
            type: "deleteMcpServer",
            serverName: server.name,
            source: server.source || "global",
        });
        setShowDeleteConfirm(false);
    };
    return (_jsxs("div", { style: { marginBottom: "10px" }, children: [_jsxs("div", { style: {
                    display: "flex",
                    alignItems: "center",
                    padding: "8px",
                    background: "var(--vscode-textCodeBlock-background)",
                    cursor: isExpandable ? "pointer" : "default",
                    borderRadius: isExpanded || isExpandable ? "4px" : "4px 4px 0 0",
                    opacity: server.disabled ? 0.6 : 1,
                }, onClick: handleRowClick, children: [isExpandable && (_jsx("span", { className: `codicon codicon-chevron-${isExpanded ? "down" : "right"}`, style: { marginRight: "8px" } })), _jsxs("span", { style: { flex: 1 }, children: [server.name, server.source && (_jsx("span", { style: {
                                    marginLeft: "8px",
                                    padding: "1px 6px",
                                    fontSize: "11px",
                                    borderRadius: "4px",
                                    background: "var(--vscode-badge-background)",
                                    color: "var(--vscode-badge-foreground)",
                                }, children: server.source }))] }), _jsxs("div", { style: { display: "flex", alignItems: "center", marginRight: "8px" }, onClick: (e) => e.stopPropagation(), children: [_jsx(Button, { variant: "ghost", size: "icon", onClick: () => setShowDeleteConfirm(true), style: { marginRight: "8px" }, children: _jsx("span", { className: "codicon codicon-trash", style: { fontSize: "14px" } }) }), _jsx(Button, { variant: "ghost", size: "icon", onClick: handleRestart, disabled: server.status === "connecting", style: { marginRight: "8px" }, children: _jsx("span", { className: "codicon codicon-refresh", style: { fontSize: "14px" } }) })] }), _jsx("div", { style: {
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            background: getStatusColor(),
                            marginLeft: "8px",
                        } }), _jsx("div", { style: { marginLeft: "8px" }, children: _jsx(ToggleSwitch, { checked: !server.disabled, onChange: () => {
                                vscode.postMessage({
                                    type: "toggleMcpServer",
                                    serverName: server.name,
                                    source: server.source || "global",
                                    disabled: !server.disabled,
                                });
                            }, size: "medium", "aria-label": `Toggle ${server.name} server` }) })] }), isExpandable
                ? isExpanded && (_jsxs("div", { style: {
                        background: "var(--vscode-textCodeBlock-background)",
                        padding: "0 10px 10px 10px",
                        fontSize: "13px",
                        borderRadius: "0 0 4px 4px",
                    }, children: [_jsxs(VSCodePanels, { style: { marginBottom: "10px" }, children: [_jsxs(VSCodePanelTab, { id: "tools", children: [t("mcp:tabs.tools"), " (", server.tools?.length || 0, ")"] }), _jsxs(VSCodePanelTab, { id: "resources", children: [t("mcp:tabs.resources"), " (", [...(server.resourceTemplates || []), ...(server.resources || [])].length || 0, ")"] }), server.instructions && (_jsx(VSCodePanelTab, { id: "instructions", children: t("mcp:instructions") })), _jsxs(VSCodePanelTab, { id: "logs", children: [t("mcp:tabs.logs"), " (", server.errorHistory?.length || 0, ")"] }), _jsx(VSCodePanelView, { id: "tools-view", children: server.tools && server.tools.length > 0 ? (_jsx("div", { style: {
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "8px",
                                            width: "100%",
                                        }, children: server.tools.map((tool) => (_jsx(McpToolRow, { tool: tool, serverName: server.name, serverSource: server.source || "global", alwaysAllowMcp: alwaysAllowMcp }, `${tool.name}-${server.name}-${server.source || "global"}`))) })) : (_jsx("div", { style: { padding: "10px 0", color: "var(--vscode-descriptionForeground)" }, children: t("mcp:emptyState.noTools") })) }), _jsx(VSCodePanelView, { id: "resources-view", children: (server.resources && server.resources.length > 0) ||
                                        (server.resourceTemplates && server.resourceTemplates.length > 0) ? (_jsx("div", { style: {
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "8px",
                                            width: "100%",
                                        }, children: [...(server.resourceTemplates || []), ...(server.resources || [])].map((item) => (_jsx(McpResourceRow, { item: item }, "uriTemplate" in item ? item.uriTemplate : item.uri))) })) : (_jsx("div", { style: { padding: "10px 0", color: "var(--vscode-descriptionForeground)" }, children: t("mcp:emptyState.noResources") })) }), server.instructions && (_jsx(VSCodePanelView, { id: "instructions-view", children: _jsx("div", { style: { padding: "10px 0", fontSize: "12px" }, children: _jsx("div", { className: "opacity-80 whitespace-pre-wrap break-words", children: server.instructions }) }) })), _jsx(VSCodePanelView, { id: "logs-view", children: server.errorHistory && server.errorHistory.length > 0 ? (_jsx("div", { style: {
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "8px",
                                            width: "100%",
                                        }, children: [...server.errorHistory]
                                            .sort((a, b) => b.timestamp - a.timestamp)
                                            .map((error, index) => (_jsx(McpErrorRow, { error: error }, `${error.timestamp}-${index}`))) })) : (_jsx("div", { style: { padding: "10px 0", color: "var(--vscode-descriptionForeground)" }, children: t("mcp:emptyState.noLogs") })) })] }), _jsxs("div", { style: { padding: "10px 7px" }, children: [_jsxs("div", { style: {
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "10px",
                                        marginBottom: "8px",
                                    }, children: [_jsx("span", { children: t("mcp:networkTimeout.label") }), _jsx("select", { value: timeoutValue, onChange: handleTimeoutChange, style: {
                                                flex: 1,
                                                padding: "4px",
                                                background: "var(--vscode-dropdown-background)",
                                                color: "var(--vscode-dropdown-foreground)",
                                                border: "1px solid var(--vscode-dropdown-border)",
                                                borderRadius: "2px",
                                                outline: "none",
                                                cursor: "pointer",
                                            }, children: timeoutOptions.map((option) => (_jsx("option", { value: option.value, children: option.label }, option.value))) })] }), _jsx("span", { style: {
                                        fontSize: "12px",
                                        color: "var(--vscode-descriptionForeground)",
                                        display: "block",
                                    }, children: t("mcp:networkTimeout.description") })] })] }))
                : // Only show error UI for non-disabled servers
                    !server.disabled && (_jsxs("div", { style: {
                            fontSize: "13px",
                            background: "var(--vscode-textCodeBlock-background)",
                            borderRadius: "0 0 4px 4px",
                            width: "100%",
                        }, children: [_jsx("div", { style: {
                                    color: "var(--vscode-testing-iconFailed)",
                                    marginBottom: "8px",
                                    padding: "0 10px",
                                    overflowWrap: "break-word",
                                    wordBreak: "break-word",
                                }, children: server.error &&
                                    server.error.split("\n").map((item, index) => (_jsxs(React.Fragment, { children: [index > 0 && _jsx("br", {}), item] }, index))) }), _jsx(VSCodeButton, { appearance: "secondary", onClick: handleRestart, disabled: server.status === "connecting", style: { width: "calc(100% - 20px)", margin: "0 10px 10px 10px" }, children: server.status === "connecting"
                                    ? t("mcp:serverStatus.retrying")
                                    : t("mcp:serverStatus.retryConnection") })] })), _jsx(Dialog, { open: showDeleteConfirm, onOpenChange: setShowDeleteConfirm, children: _jsxs(DialogContent, { children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: t("mcp:deleteDialog.title") }), _jsx(DialogDescription, { children: t("mcp:deleteDialog.description", { serverName: server.name }) })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "secondary", onClick: () => setShowDeleteConfirm(false), children: t("mcp:deleteDialog.cancel") }), _jsx(Button, { variant: "default", onClick: handleDelete, children: t("mcp:deleteDialog.delete") })] })] }) })] }));
};
export default McpView;
//# sourceMappingURL=McpView.js.map