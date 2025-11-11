import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { VSCodeLink } from "@vscode/webview-ui-toolkit/react";
import { Trans } from "react-i18next";
import { ChevronsUpDown, Check, X } from "lucide-react";
import { useAppTranslation } from "@src/i18n/TranslationContext";
import { useSelectedModel } from "@/components/ui/hooks/useSelectedModel";
import { filterModels } from "./utils/organizationFilters";
import { cn } from "@src/lib/utils";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, Popover, PopoverContent, PopoverTrigger, Button, } from "@src/components/ui";
import { useEscapeKey } from "@src/hooks/useEscapeKey";
import { ModelInfoView } from "./ModelInfoView";
import { ApiErrorMessage } from "./ApiErrorMessage";
export const ModelPicker = ({ defaultModelId, models, modelIdKey, serviceName, serviceUrl, apiConfiguration, setApiConfigurationField, organizationAllowList, errorMessage, }) => {
    const { t } = useAppTranslation();
    const [open, setOpen] = useState(false);
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    const isInitialized = useRef(false);
    const searchInputRef = useRef(null);
    const selectTimeoutRef = useRef(null);
    const closeTimeoutRef = useRef(null);
    const { id: selectedModelId, info: selectedModelInfo } = useSelectedModel(apiConfiguration);
    const modelIds = useMemo(() => {
        const filteredModels = filterModels(models, apiConfiguration.apiProvider, organizationAllowList);
        // Include the currently selected model even if deprecated (so users can see what they have selected)
        // But filter out other deprecated models from being newly selectable
        const availableModels = Object.entries(filteredModels ?? {})
            .filter(([modelId, modelInfo]) => {
            // Always include the currently selected model
            if (modelId === selectedModelId)
                return true;
            // Filter out deprecated models that aren't currently selected
            return !modelInfo.deprecated;
        })
            .reduce((acc, [modelId, modelInfo]) => {
            acc[modelId] = modelInfo;
            return acc;
        }, {});
        return Object.keys(availableModels).sort((a, b) => a.localeCompare(b));
    }, [models, apiConfiguration.apiProvider, organizationAllowList, selectedModelId]);
    const [searchValue, setSearchValue] = useState("");
    const onSelect = useCallback((modelId) => {
        if (!modelId) {
            return;
        }
        setOpen(false);
        setApiConfigurationField(modelIdKey, modelId);
        // Clear any existing timeout
        if (selectTimeoutRef.current) {
            clearTimeout(selectTimeoutRef.current);
        }
        // Delay to ensure the popover is closed before setting the search value.
        selectTimeoutRef.current = setTimeout(() => setSearchValue(""), 100);
    }, [modelIdKey, setApiConfigurationField]);
    const onOpenChange = useCallback((open) => {
        setOpen(open);
        // Abandon the current search if the popover is closed.
        if (!open) {
            // Clear any existing timeout
            if (closeTimeoutRef.current) {
                clearTimeout(closeTimeoutRef.current);
            }
            // Clear the search value when closing instead of prefilling it
            closeTimeoutRef.current = setTimeout(() => setSearchValue(""), 100);
        }
    }, []);
    const onClearSearch = useCallback(() => {
        setSearchValue("");
        searchInputRef.current?.focus();
    }, []);
    useEffect(() => {
        if (!selectedModelId && !isInitialized.current) {
            const initialValue = modelIds.includes(selectedModelId) ? selectedModelId : defaultModelId;
            setApiConfigurationField(modelIdKey, initialValue, false); // false = automatic initialization
        }
        isInitialized.current = true;
    }, [modelIds, setApiConfigurationField, modelIdKey, selectedModelId, defaultModelId]);
    // Cleanup timeouts on unmount to prevent test flakiness
    useEffect(() => {
        return () => {
            if (selectTimeoutRef.current) {
                clearTimeout(selectTimeoutRef.current);
            }
            if (closeTimeoutRef.current) {
                clearTimeout(closeTimeoutRef.current);
            }
        };
    }, []);
    // Use the shared ESC key handler hook
    useEscapeKey(open, () => setOpen(false));
    return (_jsxs(_Fragment, { children: [_jsxs("div", { children: [_jsx("label", { className: "block font-medium mb-1", children: t("settings:modelPicker.label") }), _jsxs(Popover, { open: open, onOpenChange: onOpenChange, children: [_jsx(PopoverTrigger, { asChild: true, children: _jsxs(Button, { variant: "combobox", role: "combobox", "aria-expanded": open, className: "w-full justify-between", "data-testid": "model-picker-button", children: [_jsx("div", { className: "truncate", children: selectedModelId ?? t("settings:common.select") }), _jsx(ChevronsUpDown, { className: "opacity-50" })] }) }), _jsx(PopoverContent, { className: "p-0 w-[var(--radix-popover-trigger-width)]", children: _jsxs(Command, { children: [_jsxs("div", { className: "relative", children: [_jsx(CommandInput, { ref: searchInputRef, value: searchValue, onValueChange: setSearchValue, placeholder: t("settings:modelPicker.searchPlaceholder"), className: "h-9 mr-4", "data-testid": "model-input" }), searchValue.length > 0 && (_jsx("div", { className: "absolute right-2 top-0 bottom-0 flex items-center justify-center", children: _jsx(X, { className: "text-vscode-input-foreground opacity-50 hover:opacity-100 size-4 p-0.5 cursor-pointer", onClick: onClearSearch }) }))] }), _jsxs(CommandList, { children: [_jsx(CommandEmpty, { children: searchValue && (_jsx("div", { className: "py-2 px-1 text-sm", children: t("settings:modelPicker.noMatchFound") })) }), _jsx(CommandGroup, { children: modelIds.map((model) => (_jsxs(CommandItem, { value: model, onSelect: onSelect, "data-testid": `model-option-${model}`, children: [_jsx("span", { className: "truncate", title: model, children: model }), _jsx(Check, { className: cn("size-4 p-0.5 ml-auto", model === selectedModelId ? "opacity-100" : "opacity-0") })] }, model))) })] }), searchValue && !modelIds.includes(searchValue) && (_jsx("div", { className: "p-1 border-t border-vscode-input-border", children: _jsx(CommandItem, { "data-testid": "use-custom-model", value: searchValue, onSelect: onSelect, children: t("settings:modelPicker.useCustomModel", { modelId: searchValue }) }) }))] }) })] })] }), errorMessage && _jsx(ApiErrorMessage, { errorMessage: errorMessage }), selectedModelInfo?.deprecated && (_jsx(ApiErrorMessage, { errorMessage: t("settings:validation.modelDeprecated") })), selectedModelId && selectedModelInfo && !selectedModelInfo.deprecated && (_jsx(ModelInfoView, { apiProvider: apiConfiguration.apiProvider, selectedModelId: selectedModelId, modelInfo: selectedModelInfo, isDescriptionExpanded: isDescriptionExpanded, setIsDescriptionExpanded: setIsDescriptionExpanded })), _jsx("div", { className: "text-sm text-vscode-descriptionForeground", children: _jsx(Trans, { i18nKey: "settings:modelPicker.automaticFetch", components: {
                        serviceLink: _jsx(VSCodeLink, { href: serviceUrl, className: "text-sm" }),
                        defaultModelLink: _jsx(VSCodeLink, { onClick: () => onSelect(defaultModelId), className: "text-sm" }),
                    }, values: { serviceName, defaultModelId } }) })] }));
};
//# sourceMappingURL=ModelPicker.js.map