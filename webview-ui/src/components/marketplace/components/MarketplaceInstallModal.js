import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState, useMemo, useEffect } from "react";
import { vscode } from "@/utils/vscode";
import { useAppTranslation } from "@/i18n/TranslationContext";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
export const MarketplaceInstallModal = ({ item, isOpen, onClose, hasWorkspace, }) => {
    const { t } = useAppTranslation();
    const [scope, setScope] = useState(hasWorkspace ? "project" : "global");
    const [selectedMethodIndex, setSelectedMethodIndex] = useState(0);
    const [parameterValues, setParameterValues] = useState({});
    const [validationError, setValidationError] = useState(null);
    const [installationComplete, setInstallationComplete] = useState(false);
    // Reset state when item changes
    React.useEffect(() => {
        if (item) {
            setSelectedMethodIndex(0);
            setParameterValues({});
            setValidationError(null);
            setInstallationComplete(false);
        }
    }, [item]);
    // Check if item has multiple installation methods
    const hasMultipleMethods = useMemo(() => {
        return item && Array.isArray(item.content) && item.content.length > 1;
    }, [item]);
    // Get installation method names (for display in dropdown)
    const methodNames = useMemo(() => {
        if (!item || !Array.isArray(item.content))
            return [];
        // Content is an array of McpInstallationMethod objects
        return item.content.map((method) => method.name);
    }, [item]);
    // Get effective parameters for the selected method (global + method-specific)
    const effectiveParameters = useMemo(() => {
        if (!item)
            return [];
        const globalParams = item.type === "mcp" ? item.parameters || [] : [];
        let methodParams = [];
        // Get method-specific parameters if content is an array
        if (Array.isArray(item.content)) {
            const selectedMethod = item.content[selectedMethodIndex];
            methodParams = selectedMethod?.parameters || [];
        }
        // Create map with global params first, then override with method-specific ones
        const paramMap = new Map();
        globalParams.forEach((p) => paramMap.set(p.key, p));
        methodParams.forEach((p) => paramMap.set(p.key, p));
        return Array.from(paramMap.values());
    }, [item, selectedMethodIndex]);
    // Get effective prerequisites for the selected method (global + method-specific)
    const effectivePrerequisites = useMemo(() => {
        if (!item)
            return [];
        const globalPrereqs = item.prerequisites || [];
        let methodPrereqs = [];
        // Get method-specific prerequisites if content is an array
        if (Array.isArray(item.content)) {
            const selectedMethod = item.content[selectedMethodIndex];
            methodPrereqs = selectedMethod?.prerequisites || [];
        }
        // Combine and deduplicate prerequisites
        const allPrereqs = [...globalPrereqs, ...methodPrereqs];
        return Array.from(new Set(allPrereqs));
    }, [item, selectedMethodIndex]);
    // Update parameter values when method changes
    React.useEffect(() => {
        if (item) {
            // Get effective parameters for current method
            const globalParams = item.type === "mcp" ? item.parameters || [] : [];
            let methodParams = [];
            if (Array.isArray(item.content)) {
                const selectedMethod = item.content[selectedMethodIndex];
                methodParams = selectedMethod?.parameters || [];
            }
            // Create map with global params first, then override with method-specific ones
            const paramMap = new Map();
            globalParams.forEach((p) => paramMap.set(p.key, p));
            methodParams.forEach((p) => paramMap.set(p.key, p));
            const currentEffectiveParams = Array.from(paramMap.values());
            // Initialize parameter values for effective parameters
            setParameterValues((prev) => {
                const newValues = {};
                currentEffectiveParams.forEach((param) => {
                    // Keep existing value if it exists, otherwise empty string
                    newValues[param.key] = prev[param.key] || "";
                });
                return newValues;
            });
        }
    }, [item, selectedMethodIndex]);
    // Listen for installation result messages
    useEffect(() => {
        const handleMessage = (event) => {
            const message = event.data;
            if (message.type === "marketplaceInstallResult" && message.slug === item?.id) {
                if (message.success) {
                    // Installation succeeded - show success state
                    setInstallationComplete(true);
                    setValidationError(null);
                    // Request fresh marketplace data to update installed status
                    vscode.postMessage({
                        type: "fetchMarketplaceData",
                    });
                }
                else {
                    // Installation failed - show error
                    setValidationError(message.error || "Installation failed");
                    setInstallationComplete(false);
                }
            }
        };
        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, [item?.id]);
    const handleInstall = () => {
        if (!item)
            return;
        // Clear previous validation error
        setValidationError(null);
        // Validate required parameters from effective parameters (global + method-specific)
        for (const param of effectiveParameters) {
            // Only validate if parameter is not optional (optional defaults to false)
            if (!param.optional && !parameterValues[param.key]?.trim()) {
                setValidationError(t("marketplace:install.validationRequired", { paramName: param.name }));
                return;
            }
        }
        // Prepare parameters - ensure optional parameters have empty string if not provided
        const finalParameters = { ...parameterValues };
        for (const param of effectiveParameters) {
            if (param.optional && !finalParameters[param.key]) {
                finalParameters[param.key] = "";
            }
        }
        // Send install message with parameters
        vscode.postMessage({
            type: "installMarketplaceItem",
            mpItem: item,
            mpInstallOptions: {
                target: scope,
                parameters: {
                    ...finalParameters,
                    _selectedIndex: hasMultipleMethods ? selectedMethodIndex : undefined,
                },
            },
        });
        // Don't show success immediately - wait for backend result
        // The success state will be shown when installation actually succeeds
        setValidationError(null);
    };
    const handlePostInstallAction = (tab) => {
        if (tab === "mcp") {
            // Navigate to MCP tab
            window.postMessage({
                type: "action",
                action: "mcpButtonClicked",
            }, "*");
        }
        else {
            // Navigate to Modes tab
            window.postMessage({
                type: "action",
                action: "promptsButtonClicked",
            }, "*");
        }
        // Close the modal
        onClose();
    };
    if (!item)
        return null;
    return (_jsx(Dialog, { open: isOpen, onOpenChange: onClose, children: _jsxs(DialogContent, { className: "sm:max-w-[500px]", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: installationComplete
                                ? t("marketplace:install.successTitle", { name: item.name })
                                : item.type === "mcp"
                                    ? t("marketplace:install.titleMcp", { name: item.name })
                                    : t("marketplace:install.titleMode", { name: item.name }) }), _jsx(DialogDescription, { children: installationComplete ? (t("marketplace:install.successDescription")) : item.type === "mcp" && item.url ? (_jsx("a", { href: item.url, target: "_blank", rel: "noopener noreferrer", className: "text-primary hover:underline inline-flex items-center gap-1", children: t("marketplace:install.moreInfoMcp", { name: item.name }) })) : null })] }), installationComplete ? (
                // Post-installation options
                _jsx("div", { className: "space-y-4 py-2", children: _jsxs("div", { className: "text-center space-y-4", children: [_jsxs("div", { className: "text-green-500 text-lg", children: ["\u2713 ", t("marketplace:install.installed")] }), _jsx("p", { className: "text-sm text-muted-foreground", children: item.type === "mcp"
                                    ? t("marketplace:install.whatNextMcp")
                                    : t("marketplace:install.whatNextMode") })] }) })) : (
                // Installation configuration
                _jsxs("div", { className: "space-y-4 py-2", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("div", { className: "text-base font-semibold", children: t("marketplace:install.scope") }), _jsxs("div", { className: "space-y-2", children: [_jsxs("label", { className: "flex items-center space-x-2", children: [_jsx("input", { type: "radio", name: "scope", value: "project", checked: scope === "project", onChange: () => setScope("project"), disabled: !hasWorkspace, className: "rounded-full" }), _jsx("span", { className: !hasWorkspace ? "opacity-50" : "", children: t("marketplace:install.project") })] }), _jsxs("label", { className: "flex items-center space-x-2", children: [_jsx("input", { type: "radio", name: "scope", value: "global", checked: scope === "global", onChange: () => setScope("global"), className: "rounded-full" }), _jsx("span", { children: t("marketplace:install.global") })] })] })] }), hasMultipleMethods && (_jsxs("div", { className: "space-y-2", children: [_jsx("div", { className: "text-base font-semibold", children: t("marketplace:install.method") }), _jsxs(Select, { value: String(selectedMethodIndex), onValueChange: (value) => setSelectedMethodIndex(Number(value)), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsx(SelectContent, { children: methodNames.map((name, index) => (_jsx(SelectItem, { value: String(index), children: name }, index))) })] })] })), effectivePrerequisites.length > 0 && (_jsxs("div", { className: "space-y-2", children: [_jsx("div", { className: "text-base font-semibold", children: t("marketplace:install.prerequisites") }), _jsx("ul", { className: "list-disc list-inside space-y-1 text-sm", children: effectivePrerequisites.map((prereq, index) => (_jsx("li", { className: "text-muted-foreground", children: prereq }, index))) })] })), effectiveParameters.length > 0 && (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "space-y-1", children: [_jsx("div", { className: "text-base font-semibold", children: t("marketplace:install.configuration") }), _jsx("div", { className: "text-sm text-muted-foreground", children: t("marketplace:install.configurationDescription") })] }), effectiveParameters.map((param) => (_jsxs("div", { className: "space-y-1", children: [_jsxs("label", { htmlFor: param.key, className: "text-sm", children: [param.name, param.optional ? " (optional)" : ""] }), _jsx(Input, { id: param.key, type: "text", placeholder: param.placeholder, value: parameterValues[param.key] || "", onChange: (e) => setParameterValues((prev) => ({
                                                ...prev,
                                                [param.key]: e.target.value,
                                            })) })] }, param.key)))] })), validationError && (_jsx("div", { className: "text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded p-2", children: validationError }))] })), _jsx(DialogFooter, { children: installationComplete ? (_jsxs(_Fragment, { children: [_jsx(Button, { variant: "outline", onClick: onClose, children: t("marketplace:install.done") }), _jsx(Button, { onClick: () => handlePostInstallAction(item.type === "mcp" ? "mcp" : "modes"), children: item.type === "mcp"
                                    ? t("marketplace:install.goToMcp")
                                    : t("marketplace:install.goToModes") })] })) : (_jsxs(_Fragment, { children: [_jsx(Button, { variant: "outline", onClick: onClose, children: t("common:answers.cancel") }), _jsx(Button, { onClick: handleInstall, children: t("marketplace:install.button") })] })) })] }) }));
};
//# sourceMappingURL=MarketplaceInstallModal.js.map