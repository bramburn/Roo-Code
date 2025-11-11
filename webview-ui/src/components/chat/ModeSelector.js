import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
import { Fzf } from "fzf";
import { Check, X } from "lucide-react";
import { TelemetryEventName } from "@roo-code/types";
import { getAllModes } from "@roo/modes";
import { vscode } from "@/utils/vscode";
import { telemetryClient } from "@/utils/TelemetryClient";
import { cn } from "@/lib/utils";
import { useExtensionState } from "@/context/ExtensionStateContext";
import { useAppTranslation } from "@/i18n/TranslationContext";
import { useRooPortal } from "@/components/ui/hooks/useRooPortal";
import { Popover, PopoverContent, PopoverTrigger, StandardTooltip } from "@/components/ui";
import { IconButton } from "./IconButton";
const SEARCH_THRESHOLD = 6;
export const ModeSelector = ({ value, onChange, disabled = false, title, triggerClassName = "", modeShortcutText, customModes, customModePrompts, disableSearch = false, }) => {
    const [open, setOpen] = React.useState(false);
    const [searchValue, setSearchValue] = React.useState("");
    const searchInputRef = React.useRef(null);
    const selectedItemRef = React.useRef(null);
    const scrollContainerRef = React.useRef(null);
    const portalContainer = useRooPortal("roo-portal");
    const { hasOpenedModeSelector, setHasOpenedModeSelector } = useExtensionState();
    const { t } = useAppTranslation();
    const trackModeSelectorOpened = React.useCallback(() => {
        // Track telemetry every time the mode selector is opened.
        telemetryClient.capture(TelemetryEventName.MODE_SELECTOR_OPENED);
        // Track first-time usage for UI purposes.
        if (!hasOpenedModeSelector) {
            setHasOpenedModeSelector(true);
            vscode.postMessage({ type: "hasOpenedModeSelector", bool: true });
        }
    }, [hasOpenedModeSelector, setHasOpenedModeSelector]);
    // Get all modes including custom modes and merge custom prompt descriptions.
    const modes = React.useMemo(() => {
        const allModes = getAllModes(customModes);
        return allModes.map((mode) => ({
            ...mode,
            description: customModePrompts?.[mode.slug]?.description ?? mode.description,
        }));
    }, [customModes, customModePrompts]);
    // Find the selected mode.
    const selectedMode = React.useMemo(() => modes.find((mode) => mode.slug === value), [modes, value]);
    // Memoize searchable items for fuzzy search with separate name and
    // description search.
    const nameSearchItems = React.useMemo(() => {
        return modes.map((mode) => ({
            original: mode,
            searchStr: [mode.name, mode.slug].filter(Boolean).join(" "),
        }));
    }, [modes]);
    const descriptionSearchItems = React.useMemo(() => {
        return modes.map((mode) => ({
            original: mode,
            searchStr: mode.description || "",
        }));
    }, [modes]);
    // Create memoized Fzf instances for name and description searches.
    const nameFzfInstance = React.useMemo(() => new Fzf(nameSearchItems, { selector: (item) => item.searchStr }), [nameSearchItems]);
    const descriptionFzfInstance = React.useMemo(() => new Fzf(descriptionSearchItems, { selector: (item) => item.searchStr }), [descriptionSearchItems]);
    // Filter modes based on search value using fuzzy search with priority.
    const filteredModes = React.useMemo(() => {
        if (!searchValue)
            return modes;
        // First search in names/slugs.
        const nameMatches = nameFzfInstance.find(searchValue);
        const nameMatchedModes = new Set(nameMatches.map((result) => result.item.original.slug));
        // Then search in descriptions.
        const descriptionMatches = descriptionFzfInstance.find(searchValue);
        // Combine results: name matches first, then description matches.
        const combinedResults = [
            ...nameMatches.map((result) => result.item.original),
            ...descriptionMatches
                .filter((result) => !nameMatchedModes.has(result.item.original.slug))
                .map((result) => result.item.original),
        ];
        return combinedResults;
    }, [modes, searchValue, nameFzfInstance, descriptionFzfInstance]);
    const onClearSearch = React.useCallback(() => {
        setSearchValue("");
        searchInputRef.current?.focus();
    }, []);
    const handleSelect = React.useCallback((modeSlug) => {
        onChange(modeSlug);
        setOpen(false);
        // Clear search after selection.
        setSearchValue("");
    }, [onChange]);
    const onOpenChange = React.useCallback((isOpen) => {
        if (isOpen)
            trackModeSelectorOpened();
        setOpen(isOpen);
        // Clear search when closing.
        if (!isOpen) {
            setSearchValue("");
        }
    }, [trackModeSelectorOpened]);
    // Auto-focus search input and scroll to selected item when popover opens.
    React.useEffect(() => {
        if (open) {
            // Focus search input
            if (searchInputRef.current) {
                searchInputRef.current.focus();
            }
            requestAnimationFrame(() => {
                if (selectedItemRef.current && scrollContainerRef.current) {
                    const container = scrollContainerRef.current;
                    const item = selectedItemRef.current;
                    // Calculate positions
                    const containerHeight = container.clientHeight;
                    const itemTop = item.offsetTop;
                    const itemHeight = item.offsetHeight;
                    // Center the item in the container
                    const scrollPosition = itemTop - containerHeight / 2 + itemHeight / 2;
                    // Ensure we don't scroll past boundaries
                    const maxScroll = container.scrollHeight - containerHeight;
                    const finalScrollPosition = Math.min(Math.max(0, scrollPosition), maxScroll);
                    container.scrollTo({
                        top: finalScrollPosition,
                        behavior: "instant",
                    });
                }
            });
        }
    }, [open]);
    // Determine if search should be shown.
    const showSearch = !disableSearch && modes.length > SEARCH_THRESHOLD;
    // Combine instruction text for tooltip.
    const instructionText = `${t("chat:modeSelector.description")} ${modeShortcutText}`;
    return (_jsxs(Popover, { open: open, onOpenChange: onOpenChange, "data-testid": "mode-selector-root", children: [_jsx(StandardTooltip, { content: title, children: _jsx(PopoverTrigger, { disabled: disabled, "data-testid": "mode-selector-trigger", className: cn("inline-flex items-center relative whitespace-nowrap px-1.5 py-1 text-xs", "bg-transparent border border-[rgba(255,255,255,0.08)] rounded-md text-vscode-foreground", "transition-all duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-vscode-focusBorder focus-visible:ring-inset", disabled
                        ? "opacity-50 cursor-not-allowed"
                        : "opacity-90 hover:opacity-100 hover:bg-[rgba(255,255,255,0.03)] hover:border-[rgba(255,255,255,0.15)] cursor-pointer", triggerClassName, !disabled && !hasOpenedModeSelector
                        ? "bg-primary opacity-90 hover:bg-primary-hover text-vscode-button-foreground"
                        : null), children: _jsx("span", { className: "truncate", children: selectedMode?.name || "" }) }) }), _jsx(PopoverContent, { align: "start", sideOffset: 4, container: portalContainer, className: "p-0 overflow-hidden min-w-80 max-w-9/10", children: _jsxs("div", { className: "flex flex-col w-full", children: [showSearch ? (_jsxs("div", { className: "relative p-2 border-b border-vscode-dropdown-border", children: [_jsx("input", { "aria-label": "Search modes", ref: searchInputRef, value: searchValue, onChange: (e) => setSearchValue(e.target.value), placeholder: t("chat:modeSelector.searchPlaceholder"), className: "w-full h-8 px-2 py-1 text-xs bg-vscode-input-background text-vscode-input-foreground border border-vscode-input-border rounded focus:outline-0", "data-testid": "mode-search-input" }), searchValue.length > 0 && (_jsx("div", { className: "absolute right-4 top-0 bottom-0 flex items-center justify-center", children: _jsx(X, { className: "text-vscode-input-foreground opacity-50 hover:opacity-100 size-4 p-0.5 cursor-pointer", onClick: onClearSearch }) }))] })) : (_jsx("div", { className: "p-3 border-b border-vscode-dropdown-border", children: _jsx("p", { className: "m-0 text-xs text-vscode-descriptionForeground", children: instructionText }) })), _jsx("div", { ref: scrollContainerRef, className: "max-h-[300px] overflow-y-auto", children: filteredModes.length === 0 && searchValue ? (_jsx("div", { className: "py-2 px-3 text-sm text-vscode-foreground/70", children: t("chat:modeSelector.noResults") })) : (_jsx("div", { className: "py-1", children: filteredModes.map((mode) => {
                                    const isSelected = mode.slug === value;
                                    return (_jsxs("div", { ref: isSelected ? selectedItemRef : null, onClick: () => handleSelect(mode.slug), className: cn("px-3 py-1.5 text-sm cursor-pointer flex items-center", "hover:bg-vscode-list-hoverBackground", isSelected
                                            ? "bg-vscode-list-activeSelectionBackground text-vscode-list-activeSelectionForeground"
                                            : ""), "data-testid": "mode-selector-item", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("div", { className: "font-bold truncate", children: mode.name }), mode.description && (_jsx("div", { className: "text-xs text-vscode-descriptionForeground truncate", children: mode.description }))] }), isSelected && _jsx(Check, { className: "ml-auto size-4 p-0.5" })] }, mode.slug));
                                }) })) }), _jsxs("div", { className: "flex flex-row items-center justify-between px-2 py-2 border-t border-vscode-dropdown-border", children: [_jsxs("div", { className: "flex flex-row gap-1", children: [_jsx(IconButton, { iconClass: "codicon-extensions", title: t("chat:modeSelector.marketplace"), onClick: () => {
                                                window.postMessage({
                                                    type: "action",
                                                    action: "marketplaceButtonClicked",
                                                    values: { marketplaceTab: "mode" },
                                                }, "*");
                                                setOpen(false);
                                            } }), _jsx(IconButton, { iconClass: "codicon-settings-gear", title: t("chat:modeSelector.settings"), onClick: () => {
                                                vscode.postMessage({ type: "switchTab", tab: "modes" });
                                                setOpen(false);
                                            } })] }), _jsxs("div", { className: "flex items-center gap-1 pr-1", children: [showSearch && (_jsx(StandardTooltip, { content: instructionText, children: _jsx("span", { className: "codicon codicon-info text-xs text-vscode-descriptionForeground opacity-70 hover:opacity-100 cursor-help" }) })), _jsx("h4", { className: "m-0 font-medium text-sm text-vscode-descriptionForeground", children: t("chat:modeSelector.title") })] })] })] }) })] }));
};
//# sourceMappingURL=ModeSelector.js.map