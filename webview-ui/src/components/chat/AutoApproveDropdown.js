import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
import { ListChecks, LayoutList, Settings, CheckCheck, X } from "lucide-react";
import { vscode } from "@/utils/vscode";
import { cn } from "@/lib/utils";
import { useExtensionState } from "@/context/ExtensionStateContext";
import { useAppTranslation } from "@/i18n/TranslationContext";
import { useRooPortal } from "@/components/ui/hooks/useRooPortal";
import { Popover, PopoverContent, PopoverTrigger, StandardTooltip, ToggleSwitch } from "@/components/ui";
import { autoApproveSettingsConfig } from "../settings/AutoApproveToggle";
import { useAutoApprovalToggles } from "@/hooks/useAutoApprovalToggles";
import { useAutoApprovalState } from "@/hooks/useAutoApprovalState";
export const AutoApproveDropdown = ({ disabled = false, triggerClassName = "" }) => {
    const [open, setOpen] = React.useState(false);
    const portalContainer = useRooPortal("roo-portal");
    const { t } = useAppTranslation();
    const { autoApprovalEnabled, setAutoApprovalEnabled, alwaysApproveResubmit, setAlwaysAllowReadOnly, setAlwaysAllowWrite, setAlwaysAllowExecute, setAlwaysAllowBrowser, setAlwaysAllowMcp, setAlwaysAllowModeSwitch, setAlwaysAllowSubtasks, setAlwaysApproveResubmit, setAlwaysAllowFollowupQuestions, setAlwaysAllowUpdateTodoList, } = useExtensionState();
    const baseToggles = useAutoApprovalToggles();
    // Include alwaysApproveResubmit in addition to the base toggles
    const toggles = React.useMemo(() => ({
        ...baseToggles,
        alwaysApproveResubmit: alwaysApproveResubmit,
    }), [baseToggles, alwaysApproveResubmit]);
    const onAutoApproveToggle = React.useCallback((key, value) => {
        vscode.postMessage({ type: key, bool: value });
        // Update the specific toggle state
        switch (key) {
            case "alwaysAllowReadOnly":
                setAlwaysAllowReadOnly(value);
                break;
            case "alwaysAllowWrite":
                setAlwaysAllowWrite(value);
                break;
            case "alwaysAllowExecute":
                setAlwaysAllowExecute(value);
                break;
            case "alwaysAllowBrowser":
                setAlwaysAllowBrowser(value);
                break;
            case "alwaysAllowMcp":
                setAlwaysAllowMcp(value);
                break;
            case "alwaysAllowModeSwitch":
                setAlwaysAllowModeSwitch(value);
                break;
            case "alwaysAllowSubtasks":
                setAlwaysAllowSubtasks(value);
                break;
            case "alwaysApproveResubmit":
                setAlwaysApproveResubmit(value);
                break;
            case "alwaysAllowFollowupQuestions":
                setAlwaysAllowFollowupQuestions(value);
                break;
            case "alwaysAllowUpdateTodoList":
                setAlwaysAllowUpdateTodoList(value);
                break;
        }
        // If enabling any option, ensure autoApprovalEnabled is true
        if (value && !autoApprovalEnabled) {
            setAutoApprovalEnabled(true);
            vscode.postMessage({ type: "autoApprovalEnabled", bool: true });
        }
    }, [
        autoApprovalEnabled,
        setAlwaysAllowReadOnly,
        setAlwaysAllowWrite,
        setAlwaysAllowExecute,
        setAlwaysAllowBrowser,
        setAlwaysAllowMcp,
        setAlwaysAllowModeSwitch,
        setAlwaysAllowSubtasks,
        setAlwaysApproveResubmit,
        setAlwaysAllowFollowupQuestions,
        setAlwaysAllowUpdateTodoList,
        setAutoApprovalEnabled,
    ]);
    const handleSelectAll = React.useCallback(() => {
        // Enable all options
        Object.keys(autoApproveSettingsConfig).forEach((key) => {
            onAutoApproveToggle(key, true);
        });
        // Enable master auto-approval
        if (!autoApprovalEnabled) {
            setAutoApprovalEnabled(true);
            vscode.postMessage({ type: "autoApprovalEnabled", bool: true });
        }
    }, [onAutoApproveToggle, autoApprovalEnabled, setAutoApprovalEnabled]);
    const handleSelectNone = React.useCallback(() => {
        // Disable all options
        Object.keys(autoApproveSettingsConfig).forEach((key) => {
            onAutoApproveToggle(key, false);
        });
    }, [onAutoApproveToggle]);
    const handleOpenSettings = React.useCallback(() => window.postMessage({ type: "action", action: "settingsButtonClicked", values: { section: "autoApprove" } }), []);
    // Handle the main auto-approval toggle
    const handleAutoApprovalToggle = React.useCallback(() => {
        const newValue = !(autoApprovalEnabled ?? false);
        setAutoApprovalEnabled(newValue);
        vscode.postMessage({ type: "autoApprovalEnabled", bool: newValue });
    }, [autoApprovalEnabled, setAutoApprovalEnabled]);
    // Calculate enabled and total counts as separate properties
    const settingsArray = Object.values(autoApproveSettingsConfig);
    const enabledCount = React.useMemo(() => {
        return Object.values(toggles).filter((value) => !!value).length;
    }, [toggles]);
    const totalCount = React.useMemo(() => {
        return Object.keys(toggles).length;
    }, [toggles]);
    const { effectiveAutoApprovalEnabled } = useAutoApprovalState(toggles, autoApprovalEnabled);
    const tooltipText = !effectiveAutoApprovalEnabled || enabledCount === 0
        ? t("chat:autoApprove.tooltipManage")
        : t("chat:autoApprove.tooltipStatus", {
            toggles: settingsArray
                .filter((setting) => toggles[setting.key])
                .map((setting) => t(setting.labelKey))
                .join(", "),
        });
    return (_jsxs(Popover, { open: open, onOpenChange: setOpen, "data-testid": "auto-approve-dropdown-root", children: [_jsx(StandardTooltip, { content: tooltipText, children: _jsxs(PopoverTrigger, { disabled: disabled, "data-testid": "auto-approve-dropdown-trigger", className: cn("inline-flex items-center gap-1.5 relative whitespace-nowrap px-1.5 py-1 text-xs", "bg-transparent border border-[rgba(255,255,255,0.08)] rounded-md text-vscode-foreground", "transition-all duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-vscode-focusBorder focus-visible:ring-inset", "max-[300px]:shrink-0", disabled
                        ? "opacity-50 cursor-not-allowed"
                        : "opacity-90 hover:opacity-100 hover:bg-[rgba(255,255,255,0.03)] hover:border-[rgba(255,255,255,0.15)] cursor-pointer", triggerClassName), children: [!effectiveAutoApprovalEnabled ? (_jsx(X, { className: "size-3 flex-shrink-0" })) : (_jsx(CheckCheck, { className: "size-3 flex-shrink-0" })), _jsx("span", { className: "hidden min-[300px]:inline truncate min-w-0", children: !effectiveAutoApprovalEnabled
                                ? t("chat:autoApprove.triggerLabelOff")
                                : enabledCount === totalCount
                                    ? t("chat:autoApprove.triggerLabelAll")
                                    : t("chat:autoApprove.triggerLabel", { count: enabledCount }) }), _jsx("span", { className: "inline min-[300px]:hidden min-w-0", children: !effectiveAutoApprovalEnabled
                                ? t("chat:autoApprove.triggerLabelOffShort")
                                : enabledCount === totalCount
                                    ? t("chat:autoApprove.triggerLabelAll")
                                    : enabledCount })] }) }), _jsx(PopoverContent, { align: "start", sideOffset: 4, container: portalContainer, className: "p-0 overflow-hidden w-[min(440px,calc(100vw-2rem))]", onOpenAutoFocus: (e) => e.preventDefault(), children: _jsxs("div", { className: "flex flex-col w-full", children: [_jsxs("div", { className: "p-3 border-b border-vscode-dropdown-border", children: [_jsxs("div", { className: "flex items-center justify-between gap-1 pr-1 pb-2", children: [_jsx("h4", { className: "m-0 font-bold text-base text-vscode-foreground", children: t("chat:autoApprove.title") }), _jsx(Settings, { className: "inline mb-0.5 mr-1 size-4 cursor-pointer", onClick: handleOpenSettings })] }), _jsx("p", { className: "m-0 text-xs text-vscode-descriptionForeground", children: t("chat:autoApprove.description") })] }), _jsx("div", { className: "grid grid-cols-1 min-[340px]:grid-cols-2 gap-x-2 gap-y-2 p-3", children: settingsArray.map(({ key, labelKey, descriptionKey, icon }) => {
                                const isEnabled = toggles[key];
                                return (_jsx(StandardTooltip, { content: t(descriptionKey), children: _jsxs("button", { onClick: () => onAutoApproveToggle(key, !isEnabled), className: cn("flex items-center gap-2 px-2 py-2 rounded text-sm text-left", "transition-all duration-150", "opacity-100 hover:opacity-70", "cursor-pointer", !effectiveAutoApprovalEnabled &&
                                            "opacity-50 cursor-not-allowed hover:opacity-50", isEnabled
                                            ? "bg-vscode-button-background text-vscode-button-foreground"
                                            : "bg-vscode-button-background/15 text-vscode-foreground hover:bg-vscode-list-hoverBackground"), disabled: !effectiveAutoApprovalEnabled, "data-testid": `auto-approve-${key}`, children: [_jsx("span", { className: `codicon codicon-${icon} text-sm flex-shrink-0` }), _jsx("span", { className: "flex-1 truncate", children: t(labelKey) })] }) }, key));
                            }) }), _jsxs("div", { className: "flex flex-row items-center justify-between px-2 py-2 border-t border-vscode-dropdown-border", children: [_jsxs("div", { className: "flex flex-row gap-1", children: [_jsxs("button", { "aria-label": t("chat:autoApprove.selectAll"), onClick: handleSelectAll, disabled: !effectiveAutoApprovalEnabled, className: cn("relative inline-flex items-center justify-center gap-1", "bg-transparent border-none px-2 py-1", "rounded-md text-base font-bold", "text-vscode-foreground", "transition-all duration-150", "hover:opacity-100 hover:bg-[rgba(255,255,255,0.03)]", "focus:outline-none focus-visible:ring-1 focus-visible:ring-vscode-focusBorder", "active:bg-[rgba(255,255,255,0.1)]", "cursor-pointer", !effectiveAutoApprovalEnabled && "opacity-50 hover:opacity-50 cursor-not-allowed"), children: [_jsx(ListChecks, { className: "w-3.5 h-3.5" }), _jsx("span", { children: t("chat:autoApprove.all") })] }), _jsxs("button", { "aria-label": t("chat:autoApprove.selectNone"), onClick: handleSelectNone, disabled: !effectiveAutoApprovalEnabled, className: cn("relative inline-flex items-center justify-center gap-1", "bg-transparent border-none px-2 py-1", "rounded-md text-base font-bold", "text-vscode-foreground", "transition-all duration-150", "hover:opacity-100 hover:bg-[rgba(255,255,255,0.03)]", "focus:outline-none focus-visible:ring-1 focus-visible:ring-vscode-focusBorder", "active:bg-[rgba(255,255,255,0.1)]", "cursor-pointer", !effectiveAutoApprovalEnabled && "opacity-50 hover:opacity-50 cursor-not-allowed"), children: [_jsx(LayoutList, { className: "w-3.5 h-3.5" }), _jsx("span", { children: t("chat:autoApprove.none") })] })] }), _jsxs("label", { className: "flex items-center gap-2 pr-2 cursor-pointer", onClick: (e) => {
                                        // Prevent label click when clicking on the toggle switch itself
                                        if (e.target.closest('[role="switch"]')) {
                                            e.preventDefault();
                                            return;
                                        }
                                        handleAutoApprovalToggle();
                                    }, children: [_jsx(ToggleSwitch, { checked: effectiveAutoApprovalEnabled, "aria-label": "Toggle auto-approval", onChange: handleAutoApprovalToggle }), _jsx("span", { className: cn("text-sm font-bold select-none"), children: "Enabled" })] })] })] }) })] }));
};
//# sourceMappingURL=AutoApproveDropdown.js.map