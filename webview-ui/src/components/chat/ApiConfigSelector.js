import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useMemo, useCallback } from "react";
import { Fzf } from "fzf";
import { cn } from "@/lib/utils";
import { useRooPortal } from "@/components/ui/hooks/useRooPortal";
import { Popover, PopoverContent, PopoverTrigger, StandardTooltip } from "@/components/ui";
import { useAppTranslation } from "@/i18n/TranslationContext";
import { vscode } from "@/utils/vscode";
import { Button } from "@/components/ui";
import { IconButton } from "./IconButton";
export const ApiConfigSelector = ({ value, displayName, disabled = false, title, onChange, triggerClassName = "", listApiConfigMeta, pinnedApiConfigs, togglePinnedApiConfig, }) => {
    const { t } = useAppTranslation();
    const [open, setOpen] = useState(false);
    const [searchValue, setSearchValue] = useState("");
    const portalContainer = useRooPortal("roo-portal");
    // Create searchable items for fuzzy search.
    const searchableItems = useMemo(() => listApiConfigMeta.map((config) => ({
        original: config,
        searchStr: config.name,
    })), [listApiConfigMeta]);
    // Create Fzf instance.
    const fzfInstance = useMemo(() => new Fzf(searchableItems, { selector: (item) => item.searchStr }), [searchableItems]);
    // Filter configs based on search.
    const filteredConfigs = useMemo(() => {
        if (!searchValue) {
            return listApiConfigMeta;
        }
        const matchingItems = fzfInstance.find(searchValue).map((result) => result.item.original);
        return matchingItems;
    }, [listApiConfigMeta, searchValue, fzfInstance]);
    // Separate pinned and unpinned configs.
    const { pinnedConfigs, unpinnedConfigs } = useMemo(() => {
        const pinned = filteredConfigs.filter((config) => pinnedApiConfigs?.[config.id]);
        const unpinned = filteredConfigs.filter((config) => !pinnedApiConfigs?.[config.id]);
        return { pinnedConfigs: pinned, unpinnedConfigs: unpinned };
    }, [filteredConfigs, pinnedApiConfigs]);
    const handleSelect = useCallback((configId) => {
        onChange(configId);
        setOpen(false);
        setSearchValue("");
    }, [onChange]);
    const handleEditClick = useCallback(() => {
        vscode.postMessage({ type: "switchTab", tab: "settings" });
        setOpen(false);
    }, []);
    const renderConfigItem = useCallback((config, isPinned) => {
        const isCurrentConfig = config.id === value;
        return (_jsxs("div", { onClick: () => handleSelect(config.id), className: cn("px-3 py-1.5 text-sm cursor-pointer flex items-center group", "hover:bg-vscode-list-hoverBackground", isCurrentConfig &&
                "bg-vscode-list-activeSelectionBackground text-vscode-list-activeSelectionForeground"), children: [_jsxs("div", { className: "flex-1 min-w-0 flex items-center gap-1 overflow-hidden", children: [_jsx("span", { className: "flex-shrink-0", children: config.name }), config.modelId && (_jsx(_Fragment, { children: _jsx("span", { className: "text-vscode-descriptionForeground opacity-70 min-w-0 overflow-hidden", style: { direction: "rtl", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: config.modelId }) }))] }), _jsxs("div", { className: "flex items-center gap-1", children: [isCurrentConfig && (_jsx("div", { className: "size-5 p-1 flex items-center justify-center", children: _jsx("span", { className: "codicon codicon-check text-xs" }) })), _jsx(StandardTooltip, { content: isPinned ? t("chat:unpin") : t("chat:pin"), children: _jsx(Button, { variant: "ghost", size: "icon", tabIndex: -1, onClick: (e) => {
                                    e.stopPropagation();
                                    togglePinnedApiConfig(config.id);
                                    vscode.postMessage({ type: "toggleApiConfigPin", text: config.id });
                                }, className: cn("size-5 flex items-center justify-center", {
                                    "opacity-0 group-hover:opacity-100": !isPinned && !isCurrentConfig,
                                    "bg-accent opacity-100": isPinned,
                                }), children: _jsx("span", { className: "codicon codicon-pin text-xs opacity-50" }) }) })] })] }, config.id));
    }, [value, handleSelect, t, togglePinnedApiConfig]);
    return (_jsxs(Popover, { open: open, onOpenChange: setOpen, "data-testid": "api-config-selector-root", children: [_jsx(StandardTooltip, { content: title, children: _jsx(PopoverTrigger, { disabled: disabled, "data-testid": "dropdown-trigger", className: cn("min-w-0 inline-flex items-center relative whitespace-nowrap px-1.5 py-1 text-xs", "bg-transparent border border-[rgba(255,255,255,0.08)] rounded-md text-vscode-foreground", "transition-all duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-vscode-focusBorder focus-visible:ring-inset", disabled
                        ? "opacity-50 cursor-not-allowed"
                        : "opacity-90 hover:opacity-100 hover:bg-[rgba(255,255,255,0.03)] hover:border-[rgba(255,255,255,0.15)] cursor-pointer", triggerClassName), children: _jsx("span", { className: "truncate", children: displayName }) }) }), _jsx(PopoverContent, { align: "start", sideOffset: 4, container: portalContainer, className: "p-0 overflow-hidden w-[300px]", children: _jsxs("div", { className: "flex flex-col w-full", children: [listApiConfigMeta.length > 6 ? (_jsxs("div", { className: "relative p-2 border-b border-vscode-dropdown-border", children: [_jsx("input", { "aria-label": t("common:ui.search_placeholder"), value: searchValue, onChange: (e) => setSearchValue(e.target.value), placeholder: t("common:ui.search_placeholder"), className: "w-full h-8 px-2 py-1 text-xs bg-vscode-input-background text-vscode-input-foreground border border-vscode-input-border rounded focus:outline-0", autoFocus: true }), searchValue.length > 0 && (_jsx("div", { className: "absolute right-4 top-0 bottom-0 flex items-center justify-center", children: _jsx("span", { className: "codicon codicon-close text-vscode-input-foreground opacity-50 hover:opacity-100 text-xs cursor-pointer", onClick: () => setSearchValue("") }) }))] })) : (_jsx("div", { className: "p-3 border-b border-vscode-dropdown-border", children: _jsx("p", { className: "text-xs text-vscode-descriptionForeground m-0", children: t("prompts:apiConfiguration.select") }) })), _jsx("div", { className: "max-h-[300px] overflow-y-auto", children: filteredConfigs.length === 0 && searchValue ? (_jsx("div", { className: "py-2 px-3 text-sm text-vscode-foreground/70", children: t("common:ui.no_results") })) : (_jsxs("div", { className: "py-1", children: [pinnedConfigs.map((config) => renderConfigItem(config, true)), pinnedConfigs.length > 0 && unpinnedConfigs.length > 0 && (_jsx("div", { className: "mx-1 my-1 h-px bg-vscode-dropdown-foreground/10" })), unpinnedConfigs.map((config) => renderConfigItem(config, false))] })) }), _jsxs("div", { className: "flex flex-row items-center justify-between px-2 py-2 border-t border-vscode-dropdown-border", children: [_jsx("div", { className: "flex flex-row gap-1", children: _jsx(IconButton, { iconClass: "codicon-settings-gear", title: t("chat:edit"), onClick: handleEditClick, tooltip: false }) }), _jsxs("div", { className: "flex items-center gap-1 pr-1", children: [listApiConfigMeta.length > 6 && (_jsx(StandardTooltip, { content: t("prompts:apiConfiguration.select"), children: _jsx("span", { className: "codicon codicon-info text-xs text-vscode-descriptionForeground opacity-70 hover:opacity-100 cursor-help" }) })), _jsx("h4", { className: "m-0 font-medium text-sm text-vscode-descriptionForeground", children: t("prompts:apiConfiguration.title") })] })] })] }) })] }));
};
//# sourceMappingURL=ApiConfigSelector.js.map