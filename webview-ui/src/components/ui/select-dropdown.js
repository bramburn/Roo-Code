import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import * as React from "react";
import { CaretUpIcon } from "@radix-ui/react-icons";
import { Check, X } from "lucide-react";
import { Fzf } from "fzf";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useRooPortal } from "./hooks/useRooPortal";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui";
import { StandardTooltip } from "@/components/ui";
export var DropdownOptionType;
(function (DropdownOptionType) {
    DropdownOptionType["ITEM"] = "item";
    DropdownOptionType["SEPARATOR"] = "separator";
    DropdownOptionType["SHORTCUT"] = "shortcut";
    DropdownOptionType["ACTION"] = "action";
})(DropdownOptionType || (DropdownOptionType = {}));
export const SelectDropdown = React.memo(React.forwardRef(({ value, options, onChange, disabled = false, title = "", triggerClassName = "", contentClassName = "", itemClassName = "", sideOffset = 4, align = "start", placeholder = "", shortcutText = "", renderItem, disableSearch = false, }, ref) => {
    const { t } = useTranslation();
    const [open, setOpen] = React.useState(false);
    const [searchValue, setSearchValue] = React.useState("");
    const searchInputRef = React.useRef(null);
    const portalContainer = useRooPortal("roo-portal");
    // Memoize the selected option to prevent unnecessary calculations
    const selectedOption = React.useMemo(() => options.find((option) => option.value === value), [options, value]);
    // Memoize the display text to prevent recalculation on every render
    const displayText = React.useMemo(() => value && !selectedOption && placeholder ? placeholder : selectedOption?.label || placeholder || "", [value, selectedOption, placeholder]);
    // Reset search value when dropdown closes
    const onOpenChange = React.useCallback((open) => {
        setOpen(open);
        // Clear search when closing - no need for setTimeout
        if (!open) {
            // Use requestAnimationFrame instead of setTimeout for better performance
            requestAnimationFrame(() => setSearchValue(""));
        }
    }, []);
    // Clear search and focus input
    const onClearSearch = React.useCallback(() => {
        setSearchValue("");
        searchInputRef.current?.focus();
    }, []);
    // Filter options based on search value using Fzf for fuzzy search
    // Memoize searchable items to avoid recreating them on every search
    const searchableItems = React.useMemo(() => {
        return options
            .filter((option) => option.type !== DropdownOptionType.SEPARATOR && option.type !== DropdownOptionType.SHORTCUT)
            .map((option) => ({
            original: option,
            searchStr: [option.label, option.value].filter(Boolean).join(" "),
        }));
    }, [options]);
    // Create a memoized Fzf instance that only updates when searchable items change
    const fzfInstance = React.useMemo(() => {
        return new Fzf(searchableItems, {
            selector: (item) => item.searchStr,
        });
    }, [searchableItems]);
    // Filter options based on search value using memoized Fzf instance
    const filteredOptions = React.useMemo(() => {
        // If search is disabled or no search value, return all options without filtering
        if (disableSearch || !searchValue)
            return options;
        // Get fuzzy matching items - only perform search if we have a search value
        const matchingItems = fzfInstance.find(searchValue).map((result) => result.item.original);
        // Always include separators and shortcuts
        return options.filter((option) => {
            if (option.type === DropdownOptionType.SEPARATOR || option.type === DropdownOptionType.SHORTCUT) {
                return true;
            }
            // Include if it's in the matching items
            return matchingItems.some((item) => item.value === option.value);
        });
    }, [options, searchValue, fzfInstance, disableSearch]);
    // Group options by type and handle separators
    const groupedOptions = React.useMemo(() => {
        const result = [];
        let lastWasSeparator = false;
        filteredOptions.forEach((option) => {
            if (option.type === DropdownOptionType.SEPARATOR) {
                // Only add separator if we have items before and after it
                if (result.length > 0 && !lastWasSeparator) {
                    result.push(option);
                    lastWasSeparator = true;
                }
            }
            else {
                result.push(option);
                lastWasSeparator = false;
            }
        });
        // Remove trailing separator if present
        if (result.length > 0 && result[result.length - 1].type === DropdownOptionType.SEPARATOR) {
            result.pop();
        }
        return result;
    }, [filteredOptions]);
    const handleSelect = React.useCallback((optionValue) => {
        const option = options.find((opt) => opt.value === optionValue);
        if (!option)
            return;
        if (option.type === DropdownOptionType.ACTION) {
            window.postMessage({ type: "action", action: option.value });
            setSearchValue("");
            setOpen(false);
            return;
        }
        if (option.disabled)
            return;
        onChange(option.value);
        setSearchValue("");
        setOpen(false);
        // Clear search value immediately
    }, [onChange, options]);
    const triggerContent = (_jsxs(PopoverTrigger, { ref: ref, disabled: disabled, "data-testid": "dropdown-trigger", className: cn("w-full min-w-0 max-w-full inline-flex items-center gap-1.5 relative whitespace-nowrap px-1.5 py-1 text-xs", "bg-transparent border border-[rgba(255,255,255,0.08)] rounded-md text-vscode-foreground w-auto", "transition-all duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-vscode-focusBorder focus-visible:ring-inset", disabled
            ? "opacity-50 cursor-not-allowed"
            : "opacity-90 hover:opacity-100 hover:bg-[rgba(255,255,255,0.03)] hover:border-[rgba(255,255,255,0.15)] cursor-pointer", triggerClassName), children: [_jsx(CaretUpIcon, { className: "pointer-events-none opacity-80 flex-shrink-0 size-3" }), _jsx("span", { className: "truncate", children: displayText })] }));
    return (_jsxs(Popover, { open: open, onOpenChange: onOpenChange, "data-testid": "dropdown-root", children: [title ? _jsx(StandardTooltip, { content: title, children: triggerContent }) : triggerContent, _jsx(PopoverContent, { align: align, sideOffset: sideOffset, container: portalContainer, className: cn("p-0 overflow-hidden", contentClassName), children: _jsxs("div", { className: "flex flex-col w-full", children: [!disableSearch && (_jsxs("div", { className: "relative p-2 border-b border-vscode-dropdown-border", children: [_jsx("input", { "aria-label": "Search", ref: searchInputRef, value: searchValue, onChange: (e) => setSearchValue(e.target.value), placeholder: t("common:ui.search_placeholder"), className: "w-full h-8 px-2 py-1 text-xs bg-vscode-input-background text-vscode-input-foreground border border-vscode-input-border rounded focus:outline-0" }), searchValue.length > 0 && (_jsx("div", { className: "absolute right-4 top-0 bottom-0 flex items-center justify-center", children: _jsx(X, { className: "text-vscode-input-foreground opacity-50 hover:opacity-100 size-4 p-0.5 cursor-pointer", onClick: onClearSearch }) }))] })), _jsx("div", { className: "max-h-[300px] overflow-y-auto", children: groupedOptions.length === 0 && searchValue ? (_jsx("div", { className: "py-2 px-3 text-sm text-vscode-foreground/70", children: "No results found" })) : (_jsx("div", { className: "py-1", children: groupedOptions.map((option, index) => {
                                    // Memoize rendering of each item type for better performance
                                    if (option.type === DropdownOptionType.SEPARATOR) {
                                        return (_jsx("div", { className: "mx-1 my-1 h-px bg-vscode-dropdown-foreground/10", "data-testid": "dropdown-separator" }, `sep-${index}`));
                                    }
                                    if (option.type === DropdownOptionType.SHORTCUT ||
                                        (option.disabled && shortcutText && option.label.includes(shortcutText))) {
                                        return (_jsx("div", { className: "px-3 py-1.5 text-sm opacity-50", children: option.label }, `label-${index}`));
                                    }
                                    // Use stable keys for better reconciliation
                                    const itemKey = `item-${option.value || option.label || index}`;
                                    return (_jsx("div", { onClick: () => !option.disabled && handleSelect(option.value), className: cn("px-3 py-1.5 text-sm cursor-pointer flex items-center", option.disabled
                                            ? "opacity-50 cursor-not-allowed"
                                            : "hover:bg-vscode-list-hoverBackground", option.value === value
                                            ? "bg-vscode-list-activeSelectionBackground text-vscode-list-activeSelectionForeground"
                                            : "", itemClassName), "data-testid": "dropdown-item", children: renderItem ? (renderItem(option)) : (_jsxs(_Fragment, { children: [_jsx("span", { children: option.label }), option.value === value && (_jsx(Check, { className: "ml-auto size-4 p-0.5" }))] })) }, itemKey));
                                }) })) })] }) })] }));
}));
SelectDropdown.displayName = "SelectDropdown";
//# sourceMappingURL=select-dropdown.js.map