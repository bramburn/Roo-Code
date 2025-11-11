import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { X, ChevronsUpDown } from "lucide-react";
import { MarketplaceItemCard } from "./components/MarketplaceItemCard";
import { useAppTranslation } from "@/i18n/TranslationContext";
import { useStateManager } from "./useStateManager";
import { useExtensionState } from "@/context/ExtensionStateContext";
import { IssueFooter } from "./IssueFooter";
export function MarketplaceListView({ stateManager, allTags, filteredTags, filterByType }) {
    const [state, manager] = useStateManager(stateManager);
    const { t } = useAppTranslation();
    const { marketplaceInstalledMetadata, cloudUserInfo } = useExtensionState();
    const [isTagPopoverOpen, setIsTagPopoverOpen] = React.useState(false);
    const [tagSearch, setTagSearch] = React.useState("");
    const allItems = state.displayItems || [];
    const organizationMcps = state.displayOrganizationMcps || [];
    // NOTE: installed metadata is already synchronized into the state manager via handleMessage("state"/"marketplaceData")
    // in MarketplaceViewStateManager; avoid dispatching UPDATE_FILTERS here to prevent render loops.
    // Filter items by type if specified
    const items = filterByType ? allItems.filter((item) => item.type === filterByType) : allItems;
    const orgMcps = filterByType === "mcp" ? organizationMcps : [];
    const isEmpty = items.length === 0 && orgMcps.length === 0;
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "mb-4", children: [_jsx("div", { className: "relative", children: _jsx(Input, { type: "text", placeholder: filterByType === "mcp"
                                ? t("marketplace:filters.search.placeholderMcp")
                                : filterByType === "mode"
                                    ? t("marketplace:filters.search.placeholderMode")
                                    : t("marketplace:filters.search.placeholder"), value: state.filters.search, onChange: (e) => manager.transition({
                                type: "UPDATE_FILTERS",
                                payload: { filters: { search: e.target.value } },
                            }) }) }), _jsxs("div", { className: "mt-2 flex gap-2", children: [_jsxs(Select, { value: state.filters.installed, onValueChange: (value) => manager.transition({
                                    type: "UPDATE_FILTERS",
                                    payload: { filters: { installed: value } },
                                }), children: [_jsx(SelectTrigger, { className: "flex-1 h-7", children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: t("marketplace:filters.installed.all") }), _jsx(SelectItem, { value: "installed", children: t("marketplace:filters.installed.installed") }), _jsx(SelectItem, { value: "not_installed", children: t("marketplace:filters.installed.notInstalled") })] })] }), allTags.length > 0 && (_jsx("div", { className: "flex-1", children: _jsxs(Popover, { open: isTagPopoverOpen, onOpenChange: (open) => setIsTagPopoverOpen(open), children: [_jsx(PopoverTrigger, { asChild: true, children: _jsxs(Button, { variant: "combobox", role: "combobox", "aria-expanded": isTagPopoverOpen, className: "w-full justify-between h-7", children: [_jsx("span", { className: "truncate", children: state.filters.tags.length > 0
                                                            ? state.filters.tags
                                                                .map((t) => t.charAt(0).toUpperCase() + t.slice(1))
                                                                .join(", ")
                                                            : t("marketplace:filters.tags.label") }), _jsx(ChevronsUpDown, { className: "ml-2 h-4 w-4 shrink-0 opacity-50" })] }) }), _jsx(PopoverContent, { className: "w-[var(--radix-popover-trigger-width)] p-0", onClick: (e) => e.stopPropagation(), children: _jsxs(Command, { children: [_jsxs("div", { className: "relative", children: [_jsx(CommandInput, { className: "h-9 pr-8", placeholder: t("marketplace:filters.tags.placeholder"), value: tagSearch, onValueChange: setTagSearch }), tagSearch && (_jsx(Button, { variant: "ghost", size: "icon", className: "absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7", onClick: () => setTagSearch(""), children: _jsx(X, { className: "h-4 w-4" }) }))] }), _jsxs(CommandList, { className: "max-h-[200px] overflow-y-auto bg-vscode-dropdown-background divide-y divide-vscode-panel-border", children: [_jsx(CommandEmpty, { className: "p-2 text-sm text-vscode-descriptionForeground", children: t("marketplace:filters.tags.noResults") }), _jsx(CommandGroup, { children: filteredTags.map((tag) => (_jsxs(CommandItem, { value: tag, onSelect: () => {
                                                                        const isSelected = state.filters.tags.includes(tag);
                                                                        manager.transition({
                                                                            type: "UPDATE_FILTERS",
                                                                            payload: {
                                                                                filters: {
                                                                                    tags: isSelected
                                                                                        ? state.filters.tags.filter((t) => t !== tag)
                                                                                        : [...state.filters.tags, tag],
                                                                                },
                                                                            },
                                                                        });
                                                                    }, "data-selected": state.filters.tags.includes(tag), className: "grid grid-cols-[1rem_1fr] gap-2 cursor-pointer text-sm capitalize", onMouseDown: (e) => {
                                                                        e.stopPropagation();
                                                                        e.preventDefault();
                                                                    }, children: [state.filters.tags.includes(tag) ? (_jsx("span", { className: "codicon codicon-check" })) : (_jsx("span", {})), tag] }, tag))) })] })] }) })] }) }))] }), state.filters.tags.length > 0 && (_jsxs("div", { className: "text-xs text-vscode-descriptionForeground mt-2 flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center", children: [_jsx("span", { className: "codicon codicon-tag mr-1" }), t("marketplace:filters.tags.selected")] }), _jsxs(Button, { className: "shadow-none font-normal flex items-center gap-1 h-auto py-0.5 px-1.5 text-xs", size: "sm", variant: "secondary", onClick: (e) => {
                                    e.stopPropagation();
                                    manager.transition({
                                        type: "UPDATE_FILTERS",
                                        payload: { filters: { tags: [] } },
                                    });
                                }, children: [_jsx("span", { className: "codicon codicon-close" }), t("marketplace:filters.tags.clear")] })] }))] }), state.isFetching && isEmpty && (_jsxs("div", { className: "flex flex-col items-center justify-center h-64 text-vscode-descriptionForeground animate-fade-in", children: [_jsx("div", { className: "animate-spin mb-4", children: _jsx("span", { className: "codicon codicon-sync text-3xl" }) }), _jsx("p", { children: t("marketplace:items.refresh.refreshing") }), _jsx("p", { className: "text-sm mt-2 animate-pulse", children: t("marketplace:items.refresh.mayTakeMoment") })] })), !state.isFetching && isEmpty && (_jsxs("div", { className: "flex flex-col items-center justify-center h-64 text-vscode-descriptionForeground animate-fade-in", children: [_jsx("span", { className: "codicon codicon-inbox text-4xl mb-4 opacity-70" }), _jsx("p", { className: "font-medium", children: t("marketplace:items.empty.noItems") }), _jsx("p", { className: "text-sm mt-2", children: t("marketplace:items.empty.adjustFilters") }), _jsxs(Button, { onClick: () => manager.transition({
                            type: "UPDATE_FILTERS",
                            payload: { filters: { search: "", type: "", tags: [], installed: "all" } },
                        }), className: "mt-4 bg-vscode-button-secondaryBackground text-vscode-button-secondaryForeground hover:bg-vscode-button-secondaryHoverBackground transition-colors", children: [_jsx("span", { className: "codicon codicon-clear-all mr-2" }), t("marketplace:items.empty.clearAllFilters")] })] })), !state.isFetching && !isEmpty && (_jsxs("div", { className: "pb-3", children: [orgMcps.length > 0 && (_jsxs("div", { className: "mb-6", children: [_jsxs("div", { className: "flex items-center gap-2 mb-3 px-1", children: [_jsx("span", { className: "codicon codicon-organization text-lg" }), _jsx("h3", { className: "text-sm font-semibold text-vscode-foreground", children: t("marketplace:sections.organizationMcps", {
                                            organization: cloudUserInfo?.organizationName,
                                        }) }), _jsx("div", { className: "flex-1 h-px bg-vscode-input-border" })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3", children: orgMcps.map((item) => (_jsx(MarketplaceItemCard, { item: item, filters: state.filters, setFilters: (filters) => manager.transition({
                                        type: "UPDATE_FILTERS",
                                        payload: { filters },
                                    }), installed: {
                                        project: marketplaceInstalledMetadata?.project?.[item.id],
                                        global: marketplaceInstalledMetadata?.global?.[item.id],
                                    } }, `org-${item.id}`))) })] })), items.length > 0 && (_jsxs("div", { children: [orgMcps.length > 0 && (_jsxs("div", { className: "flex items-center gap-2 mb-3 px-1", children: [_jsx("span", { className: "codicon codicon-globe text-lg" }), _jsx("h3", { className: "text-sm font-semibold text-vscode-foreground", children: t("marketplace:sections.marketplace") }), _jsx("div", { className: "flex-1 h-px bg-vscode-input-border" })] })), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3", children: items.map((item) => (_jsx(MarketplaceItemCard, { item: item, filters: state.filters, setFilters: (filters) => manager.transition({
                                        type: "UPDATE_FILTERS",
                                        payload: { filters },
                                    }), installed: {
                                        project: marketplaceInstalledMetadata?.project?.[item.id],
                                        global: marketplaceInstalledMetadata?.global?.[item.id],
                                    } }, item.id))) })] }))] })), _jsx(IssueFooter, {})] }));
}
//# sourceMappingURL=MarketplaceListView.js.map