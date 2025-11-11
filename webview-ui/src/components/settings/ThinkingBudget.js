import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect } from "react";
import { Checkbox } from "vscrui";
import { reasoningEfforts, } from "@roo-code/types";
import { DEFAULT_HYBRID_REASONING_MODEL_MAX_TOKENS, DEFAULT_HYBRID_REASONING_MODEL_THINKING_TOKENS, GEMINI_25_PRO_MIN_THINKING_TOKENS, } from "@roo/api";
import { useAppTranslation } from "@src/i18n/TranslationContext";
import { Slider, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@src/components/ui";
import { useSelectedModel } from "@src/components/ui/hooks/useSelectedModel";
// Helper function to determine if minimal option should be shown
const shouldShowMinimalOption = (provider, modelId, supportsEffort) => {
    const isGpt5Model = provider === "openai-native" && modelId?.startsWith("gpt-5");
    const isOpenRouterWithEffort = provider === "openrouter" && supportsEffort === true;
    return !!(isGpt5Model || isOpenRouterWithEffort);
};
export const ThinkingBudget = ({ apiConfiguration, setApiConfigurationField, modelInfo }) => {
    const { t } = useAppTranslation();
    const { id: selectedModelId } = useSelectedModel(apiConfiguration);
    // Check if this is a Gemini 2.5 Pro model
    const isGemini25Pro = selectedModelId && selectedModelId.includes("gemini-2.5-pro");
    const minThinkingTokens = isGemini25Pro ? GEMINI_25_PRO_MIN_THINKING_TOKENS : 1024;
    // Check model capabilities
    const isReasoningSupported = !!modelInfo && modelInfo.supportsReasoningBinary;
    const isReasoningBudgetSupported = !!modelInfo && modelInfo.supportsReasoningBudget;
    const isReasoningBudgetRequired = !!modelInfo && modelInfo.requiredReasoningBudget;
    const isReasoningEffortSupported = !!modelInfo && modelInfo.supportsReasoningEffort;
    // Determine if minimal option should be shown
    const showMinimalOption = shouldShowMinimalOption(apiConfiguration.apiProvider, selectedModelId, isReasoningEffortSupported);
    // Build available reasoning efforts list
    const baseEfforts = [...reasoningEfforts];
    const availableReasoningEfforts = showMinimalOption
        ? ["minimal", ...baseEfforts]
        : baseEfforts;
    // Default reasoning effort - use model's default if available
    // GPT-5 models have "medium" as their default in the model configuration
    const modelDefaultReasoningEffort = modelInfo?.reasoningEffort;
    const defaultReasoningEffort = modelDefaultReasoningEffort || "medium";
    const currentReasoningEffort = apiConfiguration.reasoningEffort || defaultReasoningEffort;
    // Set default reasoning effort when model supports it and no value is set
    useEffect(() => {
        if (isReasoningEffortSupported && !apiConfiguration.reasoningEffort && defaultReasoningEffort) {
            setApiConfigurationField("reasoningEffort", defaultReasoningEffort, false);
        }
    }, [isReasoningEffortSupported, apiConfiguration.reasoningEffort, defaultReasoningEffort, setApiConfigurationField]);
    const enableReasoningEffort = apiConfiguration.enableReasoningEffort;
    const customMaxOutputTokens = apiConfiguration.modelMaxTokens || DEFAULT_HYBRID_REASONING_MODEL_MAX_TOKENS;
    const customMaxThinkingTokens = apiConfiguration.modelMaxThinkingTokens || DEFAULT_HYBRID_REASONING_MODEL_THINKING_TOKENS;
    // Dynamically expand or shrink the max thinking budget based on the custom
    // max output tokens so that there's always a 20% buffer.
    const modelMaxThinkingTokens = modelInfo?.maxThinkingTokens
        ? Math.min(modelInfo.maxThinkingTokens, Math.floor(0.8 * customMaxOutputTokens))
        : Math.floor(0.8 * customMaxOutputTokens);
    // If the custom max thinking tokens are going to exceed it's limit due
    // to the custom max output tokens being reduced then we need to shrink it
    // appropriately.
    useEffect(() => {
        if (isReasoningBudgetSupported && customMaxThinkingTokens > modelMaxThinkingTokens) {
            setApiConfigurationField("modelMaxThinkingTokens", modelMaxThinkingTokens, false);
        }
    }, [isReasoningBudgetSupported, customMaxThinkingTokens, modelMaxThinkingTokens, setApiConfigurationField]);
    if (!modelInfo) {
        return null;
    }
    // Models with supportsReasoningBinary (binary reasoning) show a simple on/off toggle
    if (isReasoningSupported) {
        return (_jsx("div", { className: "flex flex-col gap-1", children: _jsx(Checkbox, { checked: enableReasoningEffort, onChange: (checked) => setApiConfigurationField("enableReasoningEffort", checked === true), children: t("settings:providers.useReasoning") }) }));
    }
    return isReasoningBudgetSupported && !!modelInfo.maxTokens ? (_jsxs(_Fragment, { children: [!isReasoningBudgetRequired && (_jsx("div", { className: "flex flex-col gap-1", children: _jsx(Checkbox, { checked: enableReasoningEffort, onChange: (checked) => setApiConfigurationField("enableReasoningEffort", checked === true), children: t("settings:providers.useReasoning") }) })), (isReasoningBudgetRequired || enableReasoningEffort) && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("div", { className: "font-medium", children: t("settings:thinkingBudget.maxTokens") }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx(Slider, { min: 8192, max: Math.max(modelInfo.maxTokens || 8192, customMaxOutputTokens, DEFAULT_HYBRID_REASONING_MODEL_MAX_TOKENS), step: 1024, value: [customMaxOutputTokens], onValueChange: ([value]) => setApiConfigurationField("modelMaxTokens", value) }), _jsx("div", { className: "w-12 text-sm text-center", children: customMaxOutputTokens })] })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("div", { className: "font-medium", children: t("settings:thinkingBudget.maxThinkingTokens") }), _jsxs("div", { className: "flex items-center gap-1", "data-testid": "reasoning-budget", children: [_jsx(Slider, { min: minThinkingTokens, max: modelMaxThinkingTokens, step: minThinkingTokens === 128 ? 128 : 1024, value: [customMaxThinkingTokens], onValueChange: ([value]) => setApiConfigurationField("modelMaxThinkingTokens", value) }), _jsx("div", { className: "w-12 text-sm text-center", children: customMaxThinkingTokens })] })] })] }))] })) : isReasoningEffortSupported ? (_jsxs("div", { className: "flex flex-col gap-1", "data-testid": "reasoning-effort", children: [_jsx("div", { className: "flex justify-between items-center", children: _jsx("label", { className: "block font-medium mb-1", children: t("settings:providers.reasoningEffort.label") }) }), _jsxs(Select, { value: currentReasoningEffort, onValueChange: (value) => {
                    setApiConfigurationField("reasoningEffort", value);
                }, children: [_jsx(SelectTrigger, { className: "w-full", children: _jsx(SelectValue, { placeholder: currentReasoningEffort
                                ? t(`settings:providers.reasoningEffort.${currentReasoningEffort}`)
                                : t("settings:common.select") }) }), _jsx(SelectContent, { children: availableReasoningEfforts.map((value) => (_jsx(SelectItem, { value: value, children: t(`settings:providers.reasoningEffort.${value}`) }, value))) })] })] })) : null;
};
//# sourceMappingURL=ThinkingBudget.js.map