import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { convertHeadersToObject } from "./utils/headers";
import { useDebounce } from "react-use";
import { VSCodeLink } from "@vscode/webview-ui-toolkit/react";
import { ExternalLinkIcon } from "@radix-ui/react-icons";
import { DEFAULT_CONSECUTIVE_MISTAKE_LIMIT, openRouterDefaultModelId, requestyDefaultModelId, glamaDefaultModelId, unboundDefaultModelId, litellmDefaultModelId, openAiNativeDefaultModelId, anthropicDefaultModelId, doubaoDefaultModelId, claudeCodeDefaultModelId, qwenCodeDefaultModelId, geminiDefaultModelId, deepSeekDefaultModelId, moonshotDefaultModelId, mistralDefaultModelId, xaiDefaultModelId, groqDefaultModelId, cerebrasDefaultModelId, chutesDefaultModelId, bedrockDefaultModelId, vertexDefaultModelId, sambaNovaDefaultModelId, internationalZAiDefaultModelId, mainlandZAiDefaultModelId, fireworksDefaultModelId, featherlessDefaultModelId, ioIntelligenceDefaultModelId, rooDefaultModelId, vercelAiGatewayDefaultModelId, deepInfraDefaultModelId, minimaxDefaultModelId, } from "@roo-code/types";
import { vscode } from "@src/utils/vscode";
import { validateApiConfigurationExcludingModelErrors, getModelValidationError } from "@src/utils/validate";
import { useAppTranslation } from "@src/i18n/TranslationContext";
import { useRouterModels } from "@src/components/ui/hooks/useRouterModels";
import { useSelectedModel } from "@src/components/ui/hooks/useSelectedModel";
import { useExtensionState } from "@src/context/ExtensionStateContext";
import { useOpenRouterModelProviders, OPENROUTER_DEFAULT_PROVIDER_NAME, } from "@src/components/ui/hooks/useOpenRouterModelProviders";
import { filterProviders, filterModels } from "./utils/organizationFilters";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SearchableSelect, Collapsible, CollapsibleTrigger, CollapsibleContent, } from "@src/components/ui";
import { Anthropic, Bedrock, Cerebras, Chutes, ClaudeCode, DeepSeek, Doubao, Gemini, Glama, Groq, HuggingFace, IOIntelligence, LMStudio, LiteLLM, Mistral, Moonshot, Ollama, OpenAI, OpenAICompatible, OpenRouter, QwenCode, Requesty, Roo, SambaNova, Unbound, Vertex, VSCodeLM, XAI, ZAi, Fireworks, Featherless, VercelAiGateway, DeepInfra, MiniMax, } from "./providers";
import { MODELS_BY_PROVIDER, PROVIDERS } from "./constants";
import { inputEventTransform, noTransform } from "./transforms";
import { ModelInfoView } from "./ModelInfoView";
import { ApiErrorMessage } from "./ApiErrorMessage";
import { ThinkingBudget } from "./ThinkingBudget";
import { SimpleThinkingBudget } from "./SimpleThinkingBudget";
import { Verbosity } from "./Verbosity";
import { DiffSettingsControl } from "./DiffSettingsControl";
import { TodoListSettingsControl } from "./TodoListSettingsControl";
import { TemperatureControl } from "./TemperatureControl";
import { RateLimitSecondsControl } from "./RateLimitSecondsControl";
import { ConsecutiveMistakeLimitControl } from "./ConsecutiveMistakeLimitControl";
import { BedrockCustomArn } from "./providers/BedrockCustomArn";
import { buildDocLink } from "@src/utils/docLinks";
const ApiOptions = ({ uriScheme, apiConfiguration, setApiConfigurationField, fromWelcomeView, errorMessage, setErrorMessage, }) => {
    const { t } = useAppTranslation();
    const { organizationAllowList, cloudIsAuthenticated } = useExtensionState();
    const [customHeaders, setCustomHeaders] = useState(() => {
        const headers = apiConfiguration?.openAiHeaders || {};
        return Object.entries(headers);
    });
    useEffect(() => {
        const propHeaders = apiConfiguration?.openAiHeaders || {};
        if (JSON.stringify(customHeaders) !== JSON.stringify(Object.entries(propHeaders))) {
            setCustomHeaders(Object.entries(propHeaders));
        }
    }, [apiConfiguration?.openAiHeaders, customHeaders]);
    // Helper to convert array of tuples to object (filtering out empty keys).
    // Debounced effect to update the main configuration when local
    // customHeaders state stabilizes.
    useDebounce(() => {
        const currentConfigHeaders = apiConfiguration?.openAiHeaders || {};
        const newHeadersObject = convertHeadersToObject(customHeaders);
        // Only update if the processed object is different from the current config.
        if (JSON.stringify(currentConfigHeaders) !== JSON.stringify(newHeadersObject)) {
            setApiConfigurationField("openAiHeaders", newHeadersObject);
        }
    }, 300, [customHeaders, apiConfiguration?.openAiHeaders, setApiConfigurationField]);
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    const [isAdvancedSettingsOpen, setIsAdvancedSettingsOpen] = useState(false);
    const handleInputChange = useCallback((field, transform = inputEventTransform) => (event) => {
        setApiConfigurationField(field, transform(event));
    }, [setApiConfigurationField]);
    const { provider: selectedProvider, id: selectedModelId, info: selectedModelInfo, } = useSelectedModel(apiConfiguration);
    const { data: routerModels, refetch: refetchRouterModels } = useRouterModels();
    const { data: openRouterModelProviders } = useOpenRouterModelProviders(apiConfiguration?.openRouterModelId, {
        enabled: !!apiConfiguration?.openRouterModelId &&
            routerModels?.openrouter &&
            Object.keys(routerModels.openrouter).length > 1 &&
            apiConfiguration.openRouterModelId in routerModels.openrouter,
    });
    // Update `apiModelId` whenever `selectedModelId` changes.
    useEffect(() => {
        if (selectedModelId && apiConfiguration.apiModelId !== selectedModelId) {
            // Pass false as third parameter to indicate this is not a user action
            // This is an internal sync, not a user-initiated change
            setApiConfigurationField("apiModelId", selectedModelId, false);
        }
    }, [selectedModelId, setApiConfigurationField, apiConfiguration.apiModelId]);
    // Debounced refresh model updates, only executed 250ms after the user
    // stops typing.
    useDebounce(() => {
        if (selectedProvider === "openai") {
            // Use our custom headers state to build the headers object.
            const headerObject = convertHeadersToObject(customHeaders);
            vscode.postMessage({
                type: "requestOpenAiModels",
                values: {
                    baseUrl: apiConfiguration?.openAiBaseUrl,
                    apiKey: apiConfiguration?.openAiApiKey,
                    customHeaders: {}, // Reserved for any additional headers.
                    openAiHeaders: headerObject,
                },
            });
        }
        else if (selectedProvider === "ollama") {
            vscode.postMessage({ type: "requestOllamaModels" });
        }
        else if (selectedProvider === "lmstudio") {
            vscode.postMessage({ type: "requestLmStudioModels" });
        }
        else if (selectedProvider === "vscode-lm") {
            vscode.postMessage({ type: "requestVsCodeLmModels" });
        }
        else if (selectedProvider === "litellm" ||
            selectedProvider === "deepinfra" ||
            selectedProvider === "roo") {
            vscode.postMessage({ type: "requestRouterModels" });
        }
    }, 250, [
        selectedProvider,
        apiConfiguration?.requestyApiKey,
        apiConfiguration?.openAiBaseUrl,
        apiConfiguration?.openAiApiKey,
        apiConfiguration?.ollamaBaseUrl,
        apiConfiguration?.lmStudioBaseUrl,
        apiConfiguration?.litellmBaseUrl,
        apiConfiguration?.litellmApiKey,
        apiConfiguration?.deepInfraApiKey,
        apiConfiguration?.deepInfraBaseUrl,
        customHeaders,
    ]);
    useEffect(() => {
        const apiValidationResult = validateApiConfigurationExcludingModelErrors(apiConfiguration, routerModels, organizationAllowList);
        setErrorMessage(apiValidationResult);
    }, [apiConfiguration, routerModels, organizationAllowList, setErrorMessage]);
    const selectedProviderModels = useMemo(() => {
        const models = MODELS_BY_PROVIDER[selectedProvider];
        if (!models)
            return [];
        const filteredModels = filterModels(models, selectedProvider, organizationAllowList);
        // Include the currently selected model even if deprecated (so users can see what they have selected)
        // But filter out other deprecated models from being newly selectable
        const availableModels = filteredModels
            ? Object.entries(filteredModels)
                .filter(([modelId, modelInfo]) => {
                // Always include the currently selected model
                if (modelId === selectedModelId)
                    return true;
                // Filter out deprecated models that aren't currently selected
                return !modelInfo.deprecated;
            })
                .map(([modelId]) => ({
                value: modelId,
                label: modelId,
            }))
            : [];
        return availableModels;
    }, [selectedProvider, organizationAllowList, selectedModelId]);
    const onProviderChange = useCallback((value) => {
        setApiConfigurationField("apiProvider", value);
        // It would be much easier to have a single attribute that stores
        // the modelId, but we have a separate attribute for each of
        // OpenRouter, Glama, Unbound, and Requesty.
        // If you switch to one of these providers and the corresponding
        // modelId is not set then you immediately end up in an error state.
        // To address that we set the modelId to the default value for th
        // provider if it's not already set.
        const validateAndResetModel = (modelId, field, defaultValue) => {
            // in case we haven't set a default value for a provider
            if (!defaultValue)
                return;
            // only set default if no model is set, but don't reset invalid models
            // let users see and decide what to do with invalid model selections
            const shouldSetDefault = !modelId;
            if (shouldSetDefault) {
                setApiConfigurationField(field, defaultValue, false);
            }
        };
        // Define a mapping object that associates each provider with its model configuration
        const PROVIDER_MODEL_CONFIG = {
            deepinfra: { field: "deepInfraModelId", default: deepInfraDefaultModelId },
            openrouter: { field: "openRouterModelId", default: openRouterDefaultModelId },
            glama: { field: "glamaModelId", default: glamaDefaultModelId },
            unbound: { field: "unboundModelId", default: unboundDefaultModelId },
            requesty: { field: "requestyModelId", default: requestyDefaultModelId },
            litellm: { field: "litellmModelId", default: litellmDefaultModelId },
            anthropic: { field: "apiModelId", default: anthropicDefaultModelId },
            cerebras: { field: "apiModelId", default: cerebrasDefaultModelId },
            "claude-code": { field: "apiModelId", default: claudeCodeDefaultModelId },
            "qwen-code": { field: "apiModelId", default: qwenCodeDefaultModelId },
            "openai-native": { field: "apiModelId", default: openAiNativeDefaultModelId },
            gemini: { field: "apiModelId", default: geminiDefaultModelId },
            deepseek: { field: "apiModelId", default: deepSeekDefaultModelId },
            doubao: { field: "apiModelId", default: doubaoDefaultModelId },
            moonshot: { field: "apiModelId", default: moonshotDefaultModelId },
            minimax: { field: "apiModelId", default: minimaxDefaultModelId },
            mistral: { field: "apiModelId", default: mistralDefaultModelId },
            xai: { field: "apiModelId", default: xaiDefaultModelId },
            groq: { field: "apiModelId", default: groqDefaultModelId },
            chutes: { field: "apiModelId", default: chutesDefaultModelId },
            bedrock: { field: "apiModelId", default: bedrockDefaultModelId },
            vertex: { field: "apiModelId", default: vertexDefaultModelId },
            sambanova: { field: "apiModelId", default: sambaNovaDefaultModelId },
            zai: {
                field: "apiModelId",
                default: apiConfiguration.zaiApiLine === "china_coding"
                    ? mainlandZAiDefaultModelId
                    : internationalZAiDefaultModelId,
            },
            fireworks: { field: "apiModelId", default: fireworksDefaultModelId },
            featherless: { field: "apiModelId", default: featherlessDefaultModelId },
            "io-intelligence": { field: "ioIntelligenceModelId", default: ioIntelligenceDefaultModelId },
            roo: { field: "apiModelId", default: rooDefaultModelId },
            "vercel-ai-gateway": { field: "vercelAiGatewayModelId", default: vercelAiGatewayDefaultModelId },
            openai: { field: "openAiModelId" },
            ollama: { field: "ollamaModelId" },
            lmstudio: { field: "lmStudioModelId" },
        };
        const config = PROVIDER_MODEL_CONFIG[value];
        if (config) {
            validateAndResetModel(apiConfiguration[config.field], config.field, config.default);
        }
    }, [setApiConfigurationField, apiConfiguration]);
    const modelValidationError = useMemo(() => {
        return getModelValidationError(apiConfiguration, routerModels, organizationAllowList);
    }, [apiConfiguration, routerModels, organizationAllowList]);
    const docs = useMemo(() => {
        const provider = PROVIDERS.find(({ value }) => value === selectedProvider);
        const name = provider?.label;
        if (!name) {
            return undefined;
        }
        // Get the URL slug - use custom mapping if available, otherwise use the provider key.
        const slugs = {
            "openai-native": "openai",
            openai: "openai-compatible",
        };
        const slug = slugs[selectedProvider] || selectedProvider;
        return {
            url: buildDocLink(`providers/${slug}`, "provider_docs"),
            name,
        };
    }, [selectedProvider]);
    // Convert providers to SearchableSelect options
    const providerOptions = useMemo(() => {
        // First filter by organization allow list
        const allowedProviders = filterProviders(PROVIDERS, organizationAllowList);
        // Then filter out static providers that have no models (unless currently selected)
        const providersWithModels = allowedProviders.filter(({ value }) => {
            // Always show the currently selected provider to avoid breaking existing configurations
            // Use apiConfiguration.apiProvider directly since that's what's actually selected
            if (value === apiConfiguration.apiProvider) {
                return true;
            }
            // Check if this is a static provider (has models in MODELS_BY_PROVIDER)
            const staticModels = MODELS_BY_PROVIDER[value];
            // If it's a static provider, check if it has any models after filtering
            if (staticModels) {
                const filteredModels = filterModels(staticModels, value, organizationAllowList);
                // Hide the provider if it has no models after filtering
                return filteredModels && Object.keys(filteredModels).length > 0;
            }
            // If it's a dynamic provider (not in MODELS_BY_PROVIDER), always show it
            // to avoid race conditions with async model fetching
            return true;
        });
        return providersWithModels.map(({ value, label }) => ({
            value,
            label,
        }));
    }, [organizationAllowList, apiConfiguration.apiProvider]);
    return (_jsxs("div", { className: "flex flex-col gap-3", children: [_jsxs("div", { className: "flex flex-col gap-1 relative", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("label", { className: "block font-medium mb-1", children: t("settings:providers.apiProvider") }), docs && (_jsx("div", { className: "text-xs text-vscode-descriptionForeground", children: _jsx(VSCodeLink, { href: docs.url, className: "hover:text-vscode-foreground", target: "_blank", children: t("settings:providers.providerDocumentation", { provider: docs.name }) }) }))] }), _jsx(SearchableSelect, { value: selectedProvider, onValueChange: (value) => onProviderChange(value), options: providerOptions, placeholder: t("settings:common.select"), searchPlaceholder: t("settings:providers.searchProviderPlaceholder"), emptyMessage: t("settings:providers.noProviderMatchFound"), className: "w-full", "data-testid": "provider-select" })] }), errorMessage && _jsx(ApiErrorMessage, { errorMessage: errorMessage }), selectedProvider === "openrouter" && (_jsx(OpenRouter, { apiConfiguration: apiConfiguration, setApiConfigurationField: setApiConfigurationField, routerModels: routerModels, selectedModelId: selectedModelId, uriScheme: uriScheme, fromWelcomeView: fromWelcomeView, organizationAllowList: organizationAllowList, modelValidationError: modelValidationError })), selectedProvider === "requesty" && (_jsx(Requesty, { uriScheme: uriScheme, apiConfiguration: apiConfiguration, setApiConfigurationField: setApiConfigurationField, routerModels: routerModels, refetchRouterModels: refetchRouterModels, organizationAllowList: organizationAllowList, modelValidationError: modelValidationError })), selectedProvider === "glama" && (_jsx(Glama, { apiConfiguration: apiConfiguration, setApiConfigurationField: setApiConfigurationField, routerModels: routerModels, uriScheme: uriScheme, organizationAllowList: organizationAllowList, modelValidationError: modelValidationError })), selectedProvider === "unbound" && (_jsx(Unbound, { apiConfiguration: apiConfiguration, setApiConfigurationField: setApiConfigurationField, routerModels: routerModels, organizationAllowList: organizationAllowList, modelValidationError: modelValidationError })), selectedProvider === "deepinfra" && (_jsx(DeepInfra, { apiConfiguration: apiConfiguration, setApiConfigurationField: setApiConfigurationField, routerModels: routerModels, refetchRouterModels: refetchRouterModels, organizationAllowList: organizationAllowList, modelValidationError: modelValidationError })), selectedProvider === "anthropic" && (_jsx(Anthropic, { apiConfiguration: apiConfiguration, setApiConfigurationField: setApiConfigurationField })), selectedProvider === "claude-code" && (_jsx(ClaudeCode, { apiConfiguration: apiConfiguration, setApiConfigurationField: setApiConfigurationField })), selectedProvider === "openai-native" && (_jsx(OpenAI, { apiConfiguration: apiConfiguration, setApiConfigurationField: setApiConfigurationField, selectedModelInfo: selectedModelInfo })), selectedProvider === "mistral" && (_jsx(Mistral, { apiConfiguration: apiConfiguration, setApiConfigurationField: setApiConfigurationField })), selectedProvider === "bedrock" && (_jsx(Bedrock, { apiConfiguration: apiConfiguration, setApiConfigurationField: setApiConfigurationField, selectedModelInfo: selectedModelInfo })), selectedProvider === "vertex" && (_jsx(Vertex, { apiConfiguration: apiConfiguration, setApiConfigurationField: setApiConfigurationField, fromWelcomeView: fromWelcomeView })), selectedProvider === "gemini" && (_jsx(Gemini, { apiConfiguration: apiConfiguration, setApiConfigurationField: setApiConfigurationField, fromWelcomeView: fromWelcomeView })), selectedProvider === "openai" && (_jsx(OpenAICompatible, { apiConfiguration: apiConfiguration, setApiConfigurationField: setApiConfigurationField, organizationAllowList: organizationAllowList, modelValidationError: modelValidationError })), selectedProvider === "lmstudio" && (_jsx(LMStudio, { apiConfiguration: apiConfiguration, setApiConfigurationField: setApiConfigurationField })), selectedProvider === "deepseek" && (_jsx(DeepSeek, { apiConfiguration: apiConfiguration, setApiConfigurationField: setApiConfigurationField })), selectedProvider === "doubao" && (_jsx(Doubao, { apiConfiguration: apiConfiguration, setApiConfigurationField: setApiConfigurationField })), selectedProvider === "qwen-code" && (_jsx(QwenCode, { apiConfiguration: apiConfiguration, setApiConfigurationField: setApiConfigurationField })), selectedProvider === "moonshot" && (_jsx(Moonshot, { apiConfiguration: apiConfiguration, setApiConfigurationField: setApiConfigurationField })), selectedProvider === "minimax" && (_jsx(MiniMax, { apiConfiguration: apiConfiguration, setApiConfigurationField: setApiConfigurationField })), selectedProvider === "vscode-lm" && (_jsx(VSCodeLM, { apiConfiguration: apiConfiguration, setApiConfigurationField: setApiConfigurationField })), selectedProvider === "ollama" && (_jsx(Ollama, { apiConfiguration: apiConfiguration, setApiConfigurationField: setApiConfigurationField })), selectedProvider === "xai" && (_jsx(XAI, { apiConfiguration: apiConfiguration, setApiConfigurationField: setApiConfigurationField })), selectedProvider === "groq" && (_jsx(Groq, { apiConfiguration: apiConfiguration, setApiConfigurationField: setApiConfigurationField })), selectedProvider === "huggingface" && (_jsx(HuggingFace, { apiConfiguration: apiConfiguration, setApiConfigurationField: setApiConfigurationField })), selectedProvider === "cerebras" && (_jsx(Cerebras, { apiConfiguration: apiConfiguration, setApiConfigurationField: setApiConfigurationField })), selectedProvider === "chutes" && (_jsx(Chutes, { apiConfiguration: apiConfiguration, setApiConfigurationField: setApiConfigurationField, routerModels: routerModels, organizationAllowList: organizationAllowList, modelValidationError: modelValidationError })), selectedProvider === "litellm" && (_jsx(LiteLLM, { apiConfiguration: apiConfiguration, setApiConfigurationField: setApiConfigurationField, organizationAllowList: organizationAllowList, modelValidationError: modelValidationError })), selectedProvider === "sambanova" && (_jsx(SambaNova, { apiConfiguration: apiConfiguration, setApiConfigurationField: setApiConfigurationField })), selectedProvider === "zai" && (_jsx(ZAi, { apiConfiguration: apiConfiguration, setApiConfigurationField: setApiConfigurationField })), selectedProvider === "io-intelligence" && (_jsx(IOIntelligence, { apiConfiguration: apiConfiguration, setApiConfigurationField: setApiConfigurationField, organizationAllowList: organizationAllowList, modelValidationError: modelValidationError })), selectedProvider === "vercel-ai-gateway" && (_jsx(VercelAiGateway, { apiConfiguration: apiConfiguration, setApiConfigurationField: setApiConfigurationField, routerModels: routerModels, organizationAllowList: organizationAllowList, modelValidationError: modelValidationError })), selectedProvider === "human-relay" && (_jsxs(_Fragment, { children: [_jsx("div", { className: "text-sm text-vscode-descriptionForeground", children: t("settings:providers.humanRelay.description") }), _jsx("div", { className: "text-sm text-vscode-descriptionForeground", children: t("settings:providers.humanRelay.instructions") })] })), selectedProvider === "fireworks" && (_jsx(Fireworks, { apiConfiguration: apiConfiguration, setApiConfigurationField: setApiConfigurationField })), selectedProvider === "roo" && (_jsx(Roo, { apiConfiguration: apiConfiguration, setApiConfigurationField: setApiConfigurationField, routerModels: routerModels, cloudIsAuthenticated: cloudIsAuthenticated, organizationAllowList: organizationAllowList, modelValidationError: modelValidationError })), selectedProvider === "featherless" && (_jsx(Featherless, { apiConfiguration: apiConfiguration, setApiConfigurationField: setApiConfigurationField })), selectedProviderModels.length > 0 && (_jsxs(_Fragment, { children: [_jsxs("div", { children: [_jsx("label", { className: "block font-medium mb-1", children: t("settings:providers.model") }), _jsxs(Select, { value: selectedModelId === "custom-arn" ? "custom-arn" : selectedModelId, onValueChange: (value) => {
                                    setApiConfigurationField("apiModelId", value);
                                    // Clear custom ARN if not using custom ARN option.
                                    if (value !== "custom-arn" && selectedProvider === "bedrock") {
                                        setApiConfigurationField("awsCustomArn", "");
                                    }
                                    // Clear reasoning effort when switching models to allow the new model's default to take effect
                                    // This is especially important for GPT-5 models which default to "medium"
                                    if (selectedProvider === "openai-native") {
                                        setApiConfigurationField("reasoningEffort", undefined);
                                    }
                                }, children: [_jsx(SelectTrigger, { className: "w-full", children: _jsx(SelectValue, { placeholder: t("settings:common.select") }) }), _jsxs(SelectContent, { children: [selectedProviderModels.map((option) => (_jsx(SelectItem, { value: option.value, children: option.label }, option.value))), selectedProvider === "bedrock" && (_jsx(SelectItem, { value: "custom-arn", children: t("settings:labels.useCustomArn") }))] })] })] }), selectedModelInfo?.deprecated && (_jsx(ApiErrorMessage, { errorMessage: t("settings:validation.modelDeprecated") })), selectedProvider === "bedrock" && selectedModelId === "custom-arn" && (_jsx(BedrockCustomArn, { apiConfiguration: apiConfiguration, setApiConfigurationField: setApiConfigurationField })), !selectedModelInfo?.deprecated && (_jsx(ModelInfoView, { apiProvider: selectedProvider, selectedModelId: selectedModelId, modelInfo: selectedModelInfo, isDescriptionExpanded: isDescriptionExpanded, setIsDescriptionExpanded: setIsDescriptionExpanded }))] })), selectedProvider === "roo" ? (_jsx(SimpleThinkingBudget, { apiConfiguration: apiConfiguration, setApiConfigurationField: setApiConfigurationField, modelInfo: selectedModelInfo }, `${selectedProvider}-${selectedModelId}`)) : (_jsx(ThinkingBudget, { apiConfiguration: apiConfiguration, setApiConfigurationField: setApiConfigurationField, modelInfo: selectedModelInfo }, `${selectedProvider}-${selectedModelId}`)), selectedModelInfo?.supportsVerbosity && (_jsx(Verbosity, { apiConfiguration: apiConfiguration, setApiConfigurationField: setApiConfigurationField, modelInfo: selectedModelInfo })), !fromWelcomeView && (_jsxs(Collapsible, { open: isAdvancedSettingsOpen, onOpenChange: setIsAdvancedSettingsOpen, children: [_jsxs(CollapsibleTrigger, { className: "flex items-center gap-1 w-full cursor-pointer hover:opacity-80 mb-2", children: [_jsx("span", { className: `codicon codicon-chevron-${isAdvancedSettingsOpen ? "down" : "right"}` }), _jsx("span", { className: "font-medium", children: t("settings:advancedSettings.title") })] }), _jsxs(CollapsibleContent, { className: "space-y-3", children: [_jsx(TodoListSettingsControl, { todoListEnabled: apiConfiguration.todoListEnabled, onChange: (field, value) => setApiConfigurationField(field, value) }), _jsx(DiffSettingsControl, { diffEnabled: apiConfiguration.diffEnabled, fuzzyMatchThreshold: apiConfiguration.fuzzyMatchThreshold, onChange: (field, value) => setApiConfigurationField(field, value) }), selectedModelInfo?.supportsTemperature !== false && (_jsx(TemperatureControl, { value: apiConfiguration.modelTemperature, onChange: handleInputChange("modelTemperature", noTransform), maxValue: 2 })), _jsx(RateLimitSecondsControl, { value: apiConfiguration.rateLimitSeconds || 0, onChange: (value) => setApiConfigurationField("rateLimitSeconds", value) }), _jsx(ConsecutiveMistakeLimitControl, { value: apiConfiguration.consecutiveMistakeLimit !== undefined
                                    ? apiConfiguration.consecutiveMistakeLimit
                                    : DEFAULT_CONSECUTIVE_MISTAKE_LIMIT, onChange: (value) => setApiConfigurationField("consecutiveMistakeLimit", value) }), selectedProvider === "openrouter" &&
                                openRouterModelProviders &&
                                Object.keys(openRouterModelProviders).length > 0 && (_jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-1", children: [_jsx("label", { className: "block font-medium mb-1", children: t("settings:providers.openRouter.providerRouting.title") }), _jsx("a", { href: `https://openrouter.ai/${selectedModelId}/providers`, children: _jsx(ExternalLinkIcon, { className: "w-4 h-4" }) })] }), _jsxs(Select, { value: apiConfiguration?.openRouterSpecificProvider ||
                                            OPENROUTER_DEFAULT_PROVIDER_NAME, onValueChange: (value) => setApiConfigurationField("openRouterSpecificProvider", value), children: [_jsx(SelectTrigger, { className: "w-full", children: _jsx(SelectValue, { placeholder: t("settings:common.select") }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: OPENROUTER_DEFAULT_PROVIDER_NAME, children: OPENROUTER_DEFAULT_PROVIDER_NAME }), Object.entries(openRouterModelProviders).map(([value, { label }]) => (_jsx(SelectItem, { value: value, children: label }, value)))] })] }), _jsxs("div", { className: "text-sm text-vscode-descriptionForeground mt-1", children: [t("settings:providers.openRouter.providerRouting.description"), " ", _jsxs("a", { href: "https://openrouter.ai/docs/features/provider-routing", children: [t("settings:providers.openRouter.providerRouting.learnMore"), "."] })] })] }))] })] }))] }));
};
export default memo(ApiOptions);
//# sourceMappingURL=ApiOptions.js.map