import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { VSCodeTextArea, VSCodeCheckbox } from "@vscode/webview-ui-toolkit/react";
import { supportPrompt } from "@roo/support-prompt";
import { vscode } from "@src/utils/vscode";
import { useAppTranslation } from "@src/i18n/TranslationContext";
import { useExtensionState } from "@src/context/ExtensionStateContext";
import { Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, StandardTooltip, } from "@src/components/ui";
import { SectionHeader } from "./SectionHeader";
import { Section } from "./Section";
import { MessageSquare } from "lucide-react";
const PromptsSettings = ({ customSupportPrompts, setCustomSupportPrompts, includeTaskHistoryInEnhance: propsIncludeTaskHistoryInEnhance, setIncludeTaskHistoryInEnhance: propsSetIncludeTaskHistoryInEnhance, }) => {
    const { t } = useAppTranslation();
    const { listApiConfigMeta, enhancementApiConfigId, setEnhancementApiConfigId, condensingApiConfigId, setCondensingApiConfigId, customCondensingPrompt, setCustomCondensingPrompt, includeTaskHistoryInEnhance: contextIncludeTaskHistoryInEnhance, setIncludeTaskHistoryInEnhance: contextSetIncludeTaskHistoryInEnhance, } = useExtensionState();
    // Use props if provided, otherwise fall back to context
    const includeTaskHistoryInEnhance = propsIncludeTaskHistoryInEnhance ?? contextIncludeTaskHistoryInEnhance ?? true;
    const setIncludeTaskHistoryInEnhance = propsSetIncludeTaskHistoryInEnhance ?? contextSetIncludeTaskHistoryInEnhance;
    const [testPrompt, setTestPrompt] = useState("");
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [activeSupportOption, setActiveSupportOption] = useState("ENHANCE");
    useEffect(() => {
        const handler = (event) => {
            const message = event.data;
            if (message.type === "enhancedPrompt") {
                if (message.text) {
                    setTestPrompt(message.text);
                }
                setIsEnhancing(false);
            }
        };
        window.addEventListener("message", handler);
        return () => window.removeEventListener("message", handler);
    }, []);
    const updateSupportPrompt = (type, value) => {
        // Don't trim during editing to preserve intentional whitespace
        // Use nullish coalescing to preserve empty strings
        const finalValue = value ?? undefined;
        if (type === "CONDENSE") {
            setCustomCondensingPrompt(finalValue ?? supportPrompt.default.CONDENSE);
            vscode.postMessage({
                type: "updateCondensingPrompt",
                text: finalValue ?? supportPrompt.default.CONDENSE,
            });
            // Also update the customSupportPrompts to trigger change detection
            const updatedPrompts = { ...customSupportPrompts };
            if (finalValue === undefined) {
                delete updatedPrompts[type];
            }
            else {
                updatedPrompts[type] = finalValue;
            }
            setCustomSupportPrompts(updatedPrompts);
        }
        else {
            const updatedPrompts = { ...customSupportPrompts };
            if (finalValue === undefined) {
                delete updatedPrompts[type];
            }
            else {
                updatedPrompts[type] = finalValue;
            }
            setCustomSupportPrompts(updatedPrompts);
        }
    };
    const handleSupportReset = (type) => {
        if (type === "CONDENSE") {
            setCustomCondensingPrompt(supportPrompt.default.CONDENSE);
            vscode.postMessage({
                type: "updateCondensingPrompt",
                text: supportPrompt.default.CONDENSE,
            });
            // Also update the customSupportPrompts to trigger change detection
            const updatedPrompts = { ...customSupportPrompts };
            delete updatedPrompts[type];
            setCustomSupportPrompts(updatedPrompts);
        }
        else {
            const updatedPrompts = { ...customSupportPrompts };
            delete updatedPrompts[type];
            setCustomSupportPrompts(updatedPrompts);
        }
    };
    const getSupportPromptValue = (type) => {
        if (type === "CONDENSE") {
            // Preserve empty string - only fall back to default when value is nullish
            return customCondensingPrompt ?? supportPrompt.default.CONDENSE;
        }
        return supportPrompt.get(customSupportPrompts, type);
    };
    const handleTestEnhancement = () => {
        if (!testPrompt.trim())
            return;
        setIsEnhancing(true);
        vscode.postMessage({
            type: "enhancePrompt",
            text: testPrompt,
        });
    };
    return (_jsxs("div", { children: [_jsx(SectionHeader, { description: t("settings:prompts.description"), children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(MessageSquare, { className: "w-4" }), _jsx("div", { children: t("settings:sections.prompts") })] }) }), _jsxs(Section, { children: [_jsxs("div", { children: [_jsxs(Select, { value: activeSupportOption, onValueChange: (type) => setActiveSupportOption(type), children: [_jsx(SelectTrigger, { className: "w-full", "data-testid": "support-prompt-select-trigger", children: _jsx(SelectValue, { placeholder: t("settings:common.select") }) }), _jsx(SelectContent, { children: Object.keys(supportPrompt.default).map((type) => (_jsx(SelectItem, { value: type, "data-testid": `${type}-option`, children: t(`prompts:supportPrompts.types.${type}.label`) }, type))) })] }), _jsx("div", { className: "text-sm text-vscode-descriptionForeground mt-1", children: t(`prompts:supportPrompts.types.${activeSupportOption}.description`) })] }), _jsxs("div", { className: "mt-4", children: [_jsxs("div", { className: "flex justify-between items-center mb-1", children: [_jsx("label", { className: "block font-medium", children: t("prompts:supportPrompts.prompt") }), _jsx(StandardTooltip, { content: t("prompts:supportPrompts.resetPrompt", {
                                            promptType: activeSupportOption,
                                        }), children: _jsx(Button, { variant: "ghost", size: "icon", onClick: () => handleSupportReset(activeSupportOption), children: _jsx("span", { className: "codicon codicon-discard" }) }) })] }), _jsx(VSCodeTextArea, { resize: "vertical", value: getSupportPromptValue(activeSupportOption), onInput: (e) => {
                                    const value = e?.detail?.target?.value ??
                                        e.target.value;
                                    updateSupportPrompt(activeSupportOption, value);
                                }, rows: 6, className: "w-full" }), (activeSupportOption === "ENHANCE" || activeSupportOption === "CONDENSE") && (_jsxs("div", { className: "mt-4 flex flex-col gap-3 pl-3 border-l-2 border-vscode-button-background", children: [_jsxs("div", { children: [_jsx("label", { className: "block font-medium mb-1", children: activeSupportOption === "ENHANCE"
                                                    ? t("prompts:supportPrompts.enhance.apiConfiguration")
                                                    : t("prompts:supportPrompts.condense.apiConfiguration") }), _jsxs(Select, { value: activeSupportOption === "ENHANCE"
                                                    ? enhancementApiConfigId || "-"
                                                    : condensingApiConfigId || "-", onValueChange: (value) => {
                                                    const newConfigId = value === "-" ? "" : value;
                                                    if (activeSupportOption === "ENHANCE") {
                                                        setEnhancementApiConfigId(newConfigId);
                                                        vscode.postMessage({
                                                            type: "enhancementApiConfigId",
                                                            text: value,
                                                        });
                                                    }
                                                    else {
                                                        setCondensingApiConfigId(newConfigId);
                                                        vscode.postMessage({
                                                            type: "condensingApiConfigId",
                                                            text: newConfigId,
                                                        });
                                                    }
                                                }, children: [_jsx(SelectTrigger, { "data-testid": "api-config-select", className: "w-full", children: _jsx(SelectValue, { placeholder: activeSupportOption === "ENHANCE"
                                                                ? t("prompts:supportPrompts.enhance.useCurrentConfig")
                                                                : t("prompts:supportPrompts.condense.useCurrentConfig") }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "-", children: activeSupportOption === "ENHANCE"
                                                                    ? t("prompts:supportPrompts.enhance.useCurrentConfig")
                                                                    : t("prompts:supportPrompts.condense.useCurrentConfig") }), (listApiConfigMeta || []).map((config) => (_jsx(SelectItem, { value: config.id, "data-testid": `${config.id}-option`, children: config.name }, config.id)))] })] }), _jsx("div", { className: "text-sm text-vscode-descriptionForeground mt-1", children: activeSupportOption === "ENHANCE"
                                                    ? t("prompts:supportPrompts.enhance.apiConfigDescription")
                                                    : t("prompts:supportPrompts.condense.apiConfigDescription") })] }), activeSupportOption === "ENHANCE" && (_jsxs(_Fragment, { children: [_jsxs("div", { children: [_jsx(VSCodeCheckbox, { checked: includeTaskHistoryInEnhance, onChange: (e) => {
                                                            const value = e.target.checked;
                                                            setIncludeTaskHistoryInEnhance(value);
                                                            vscode.postMessage({
                                                                type: "includeTaskHistoryInEnhance",
                                                                bool: value,
                                                            });
                                                        }, children: _jsx("span", { className: "font-medium", children: t("prompts:supportPrompts.enhance.includeTaskHistory") }) }), _jsx("div", { className: "text-vscode-descriptionForeground text-sm mt-1 mb-3", children: t("prompts:supportPrompts.enhance.includeTaskHistoryDescription") })] }), _jsxs("div", { children: [_jsx("label", { className: "block font-medium mb-1", children: t("prompts:supportPrompts.enhance.testEnhancement") }), _jsx(VSCodeTextArea, { resize: "vertical", value: testPrompt, onChange: (e) => setTestPrompt(e.target.value), placeholder: t("prompts:supportPrompts.enhance.testPromptPlaceholder"), rows: 3, className: "w-full", "data-testid": "test-prompt-textarea" }), _jsx("div", { className: "mt-2 flex justify-start items-center gap-2", children: _jsx(Button, { variant: "default", onClick: handleTestEnhancement, disabled: isEnhancing, children: t("prompts:supportPrompts.enhance.previewButton") }) })] })] }))] }))] }, activeSupportOption)] })] }));
};
export default PromptsSettings;
//# sourceMappingURL=PromptsSettings.js.map