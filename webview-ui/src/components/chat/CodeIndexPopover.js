import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Trans } from "react-i18next";
import { z } from "zod";
import { VSCodeButton, VSCodeTextField, VSCodeDropdown, VSCodeOption, VSCodeLink, VSCodeCheckbox, } from "@vscode/webview-ui-toolkit/react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { AlertTriangle } from "lucide-react";
import { CODEBASE_INDEX_DEFAULTS } from "@roo-code/types";
import { vscode } from "@src/utils/vscode";
import { useExtensionState } from "@src/context/ExtensionStateContext";
import { useAppTranslation } from "@src/i18n/TranslationContext";
import { buildDocLink } from "@src/utils/docLinks";
import { cn } from "@src/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, Popover, PopoverContent, Slider, StandardTooltip, } from "@src/components/ui";
import { useRooPortal } from "@src/components/ui/hooks/useRooPortal";
import { useEscapeKey } from "@src/hooks/useEscapeKey";
// Default URLs for providers
const DEFAULT_QDRANT_URL = "http://localhost:6333";
const DEFAULT_OLLAMA_URL = "http://localhost:11434";
// Validation schema for codebase index settings
const createValidationSchema = (provider, t) => {
    const baseSchema = z.object({
        codebaseIndexEnabled: z.boolean(),
        codebaseIndexQdrantUrl: z
            .string()
            .min(1, t("settings:codeIndex.validation.qdrantUrlRequired"))
            .url(t("settings:codeIndex.validation.invalidQdrantUrl")),
        codeIndexQdrantApiKey: z.string().optional(),
    });
    switch (provider) {
        case "openai":
            return baseSchema.extend({
                codeIndexOpenAiKey: z.string().min(1, t("settings:codeIndex.validation.openaiApiKeyRequired")),
                codebaseIndexEmbedderModelId: z
                    .string()
                    .min(1, t("settings:codeIndex.validation.modelSelectionRequired")),
            });
        case "ollama":
            return baseSchema.extend({
                codebaseIndexEmbedderBaseUrl: z
                    .string()
                    .min(1, t("settings:codeIndex.validation.ollamaBaseUrlRequired"))
                    .url(t("settings:codeIndex.validation.invalidOllamaUrl")),
                codebaseIndexEmbedderModelId: z.string().min(1, t("settings:codeIndex.validation.modelIdRequired")),
                codebaseIndexEmbedderModelDimension: z
                    .number()
                    .min(1, t("settings:codeIndex.validation.modelDimensionRequired"))
                    .optional(),
            });
        case "openai-compatible":
            return baseSchema.extend({
                codebaseIndexOpenAiCompatibleBaseUrl: z
                    .string()
                    .min(1, t("settings:codeIndex.validation.baseUrlRequired"))
                    .url(t("settings:codeIndex.validation.invalidBaseUrl")),
                codebaseIndexOpenAiCompatibleApiKey: z
                    .string()
                    .min(1, t("settings:codeIndex.validation.apiKeyRequired")),
                codebaseIndexEmbedderModelId: z.string().min(1, t("settings:codeIndex.validation.modelIdRequired")),
                codebaseIndexEmbedderModelDimension: z
                    .number()
                    .min(1, t("settings:codeIndex.validation.modelDimensionRequired")),
            });
        case "gemini":
            return baseSchema.extend({
                codebaseIndexGeminiApiKey: z.string().min(1, t("settings:codeIndex.validation.geminiApiKeyRequired")),
                codebaseIndexEmbedderModelId: z
                    .string()
                    .min(1, t("settings:codeIndex.validation.modelSelectionRequired")),
            });
        case "mistral":
            return baseSchema.extend({
                codebaseIndexMistralApiKey: z.string().min(1, t("settings:codeIndex.validation.mistralApiKeyRequired")),
                codebaseIndexEmbedderModelId: z
                    .string()
                    .min(1, t("settings:codeIndex.validation.modelSelectionRequired")),
            });
        case "vercel-ai-gateway":
            return baseSchema.extend({
                codebaseIndexVercelAiGatewayApiKey: z
                    .string()
                    .min(1, t("settings:codeIndex.validation.vercelAiGatewayApiKeyRequired")),
                codebaseIndexEmbedderModelId: z
                    .string()
                    .min(1, t("settings:codeIndex.validation.modelSelectionRequired")),
            });
        case "openrouter":
            return baseSchema.extend({
                codebaseIndexOpenRouterApiKey: z
                    .string()
                    .min(1, t("settings:codeIndex.validation.openRouterApiKeyRequired")),
                codebaseIndexEmbedderModelId: z
                    .string()
                    .min(1, t("settings:codeIndex.validation.modelSelectionRequired")),
            });
        default:
            return baseSchema;
    }
};
export const CodeIndexPopover = ({ children, indexingStatus: externalIndexingStatus, }) => {
    const SECRET_PLACEHOLDER = "••••••••••••••••";
    const { t } = useAppTranslation();
    const { codebaseIndexConfig, codebaseIndexModels, cwd } = useExtensionState();
    const [open, setOpen] = useState(false);
    const [isAdvancedSettingsOpen, setIsAdvancedSettingsOpen] = useState(false);
    const [isSetupSettingsOpen, setIsSetupSettingsOpen] = useState(false);
    const [indexingStatus, setIndexingStatus] = useState(externalIndexingStatus);
    const [saveStatus, setSaveStatus] = useState("idle");
    const [saveError, setSaveError] = useState(null);
    // Form validation state
    const [formErrors, setFormErrors] = useState({});
    // Discard changes dialog state
    const [isDiscardDialogShow, setDiscardDialogShow] = useState(false);
    const confirmDialogHandler = useRef(null);
    // Default settings template
    const getDefaultSettings = () => ({
        codebaseIndexEnabled: true,
        codebaseIndexQdrantUrl: "",
        codebaseIndexEmbedderProvider: "openai",
        codebaseIndexEmbedderBaseUrl: "",
        codebaseIndexEmbedderModelId: "",
        codebaseIndexEmbedderModelDimension: undefined,
        codebaseIndexSearchMaxResults: CODEBASE_INDEX_DEFAULTS.DEFAULT_SEARCH_RESULTS,
        codebaseIndexSearchMinScore: CODEBASE_INDEX_DEFAULTS.DEFAULT_SEARCH_MIN_SCORE,
        codeIndexOpenAiKey: "",
        codeIndexQdrantApiKey: "",
        codebaseIndexOpenAiCompatibleBaseUrl: "",
        codebaseIndexOpenAiCompatibleApiKey: "",
        codebaseIndexGeminiApiKey: "",
        codebaseIndexMistralApiKey: "",
        codebaseIndexVercelAiGatewayApiKey: "",
        codebaseIndexOpenRouterApiKey: "",
    });
    // Initial settings state - stores the settings when popover opens
    const [initialSettings, setInitialSettings] = useState(getDefaultSettings());
    // Current settings state - tracks user changes
    const [currentSettings, setCurrentSettings] = useState(getDefaultSettings());
    // Update indexing status from parent
    useEffect(() => {
        setIndexingStatus(externalIndexingStatus);
    }, [externalIndexingStatus]);
    // Initialize settings from global state
    useEffect(() => {
        if (codebaseIndexConfig) {
            const settings = {
                codebaseIndexEnabled: codebaseIndexConfig.codebaseIndexEnabled ?? true,
                codebaseIndexQdrantUrl: codebaseIndexConfig.codebaseIndexQdrantUrl || "",
                codebaseIndexEmbedderProvider: codebaseIndexConfig.codebaseIndexEmbedderProvider || "openai",
                codebaseIndexEmbedderBaseUrl: codebaseIndexConfig.codebaseIndexEmbedderBaseUrl || "",
                codebaseIndexEmbedderModelId: codebaseIndexConfig.codebaseIndexEmbedderModelId || "",
                codebaseIndexEmbedderModelDimension: codebaseIndexConfig.codebaseIndexEmbedderModelDimension || undefined,
                codebaseIndexSearchMaxResults: codebaseIndexConfig.codebaseIndexSearchMaxResults ?? CODEBASE_INDEX_DEFAULTS.DEFAULT_SEARCH_RESULTS,
                codebaseIndexSearchMinScore: codebaseIndexConfig.codebaseIndexSearchMinScore ?? CODEBASE_INDEX_DEFAULTS.DEFAULT_SEARCH_MIN_SCORE,
                codeIndexOpenAiKey: "",
                codeIndexQdrantApiKey: "",
                codebaseIndexOpenAiCompatibleBaseUrl: codebaseIndexConfig.codebaseIndexOpenAiCompatibleBaseUrl || "",
                codebaseIndexOpenAiCompatibleApiKey: "",
                codebaseIndexGeminiApiKey: "",
                codebaseIndexMistralApiKey: "",
                codebaseIndexVercelAiGatewayApiKey: "",
                codebaseIndexOpenRouterApiKey: "",
            };
            setInitialSettings(settings);
            setCurrentSettings(settings);
            // Request secret status to check if secrets exist
            vscode.postMessage({ type: "requestCodeIndexSecretStatus" });
        }
    }, [codebaseIndexConfig]);
    // Request initial indexing status
    useEffect(() => {
        if (open) {
            vscode.postMessage({ type: "requestIndexingStatus" });
            vscode.postMessage({ type: "requestCodeIndexSecretStatus" });
        }
        const handleMessage = (event) => {
            if (event.data.type === "workspaceUpdated") {
                // When workspace changes, request updated indexing status
                if (open) {
                    vscode.postMessage({ type: "requestIndexingStatus" });
                    vscode.postMessage({ type: "requestCodeIndexSecretStatus" });
                }
            }
        };
        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, [open]);
    // Use a ref to capture current settings for the save handler
    const currentSettingsRef = useRef(currentSettings);
    currentSettingsRef.current = currentSettings;
    // Listen for indexing status updates and save responses
    useEffect(() => {
        const handleMessage = (event) => {
            if (event.data.type === "indexingStatusUpdate") {
                if (!event.data.values.workspacePath || event.data.values.workspacePath === cwd) {
                    setIndexingStatus({
                        systemStatus: event.data.values.systemStatus,
                        message: event.data.values.message || "",
                        processedItems: event.data.values.processedItems,
                        totalItems: event.data.values.totalItems,
                        currentItemUnit: event.data.values.currentItemUnit || "items",
                    });
                }
            }
            else if (event.data.type === "codeIndexSettingsSaved") {
                if (event.data.success) {
                    setSaveStatus("saved");
                    // Update initial settings to match current settings after successful save
                    // This ensures hasUnsavedChanges becomes false
                    const savedSettings = { ...currentSettingsRef.current };
                    setInitialSettings(savedSettings);
                    // Also update current settings to maintain consistency
                    setCurrentSettings(savedSettings);
                    // Request secret status to ensure we have the latest state
                    // This is important to maintain placeholder display after save
                    vscode.postMessage({ type: "requestCodeIndexSecretStatus" });
                    setSaveStatus("idle");
                }
                else {
                    setSaveStatus("error");
                    setSaveError(event.data.error || t("settings:codeIndex.saveError"));
                    // Clear error message after 5 seconds
                    setSaveStatus("idle");
                    setSaveError(null);
                }
            }
        };
        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, [t, cwd]);
    // Listen for secret status
    useEffect(() => {
        const handleMessage = (event) => {
            if (event.data.type === "codeIndexSecretStatus") {
                // Update settings to show placeholders for existing secrets
                const secretStatus = event.data.values;
                // Update both current and initial settings based on what secrets exist
                const updateWithSecrets = (prev) => {
                    const updated = { ...prev };
                    // Only update to placeholder if the field is currently empty or already a placeholder
                    // This preserves user input when they're actively editing
                    if (!prev.codeIndexOpenAiKey || prev.codeIndexOpenAiKey === SECRET_PLACEHOLDER) {
                        updated.codeIndexOpenAiKey = secretStatus.hasOpenAiKey ? SECRET_PLACEHOLDER : "";
                    }
                    if (!prev.codeIndexQdrantApiKey || prev.codeIndexQdrantApiKey === SECRET_PLACEHOLDER) {
                        updated.codeIndexQdrantApiKey = secretStatus.hasQdrantApiKey ? SECRET_PLACEHOLDER : "";
                    }
                    if (!prev.codebaseIndexOpenAiCompatibleApiKey ||
                        prev.codebaseIndexOpenAiCompatibleApiKey === SECRET_PLACEHOLDER) {
                        updated.codebaseIndexOpenAiCompatibleApiKey = secretStatus.hasOpenAiCompatibleApiKey
                            ? SECRET_PLACEHOLDER
                            : "";
                    }
                    if (!prev.codebaseIndexGeminiApiKey || prev.codebaseIndexGeminiApiKey === SECRET_PLACEHOLDER) {
                        updated.codebaseIndexGeminiApiKey = secretStatus.hasGeminiApiKey ? SECRET_PLACEHOLDER : "";
                    }
                    if (!prev.codebaseIndexMistralApiKey || prev.codebaseIndexMistralApiKey === SECRET_PLACEHOLDER) {
                        updated.codebaseIndexMistralApiKey = secretStatus.hasMistralApiKey ? SECRET_PLACEHOLDER : "";
                    }
                    if (!prev.codebaseIndexVercelAiGatewayApiKey ||
                        prev.codebaseIndexVercelAiGatewayApiKey === SECRET_PLACEHOLDER) {
                        updated.codebaseIndexVercelAiGatewayApiKey = secretStatus.hasVercelAiGatewayApiKey
                            ? SECRET_PLACEHOLDER
                            : "";
                    }
                    if (!prev.codebaseIndexOpenRouterApiKey ||
                        prev.codebaseIndexOpenRouterApiKey === SECRET_PLACEHOLDER) {
                        updated.codebaseIndexOpenRouterApiKey = secretStatus.hasOpenRouterApiKey
                            ? SECRET_PLACEHOLDER
                            : "";
                    }
                    return updated;
                };
                // Only update settings if we're not in the middle of saving
                // After save is complete (saved status), we still want to update to maintain consistency
                if (saveStatus === "idle" || saveStatus === "saved") {
                    setCurrentSettings(updateWithSecrets);
                    setInitialSettings(updateWithSecrets);
                }
            }
        };
        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, [saveStatus]);
    // Generic comparison function that detects changes between initial and current settings
    const hasUnsavedChanges = useMemo(() => {
        // Get all keys from both objects to handle any field
        const allKeys = [...Object.keys(initialSettings), ...Object.keys(currentSettings)];
        // Use a Set to ensure unique keys
        const uniqueKeys = Array.from(new Set(allKeys));
        for (const key of uniqueKeys) {
            const currentValue = currentSettings[key];
            const initialValue = initialSettings[key];
            // For secret fields, check if the value has been modified from placeholder
            if (currentValue === SECRET_PLACEHOLDER) {
                // If it's still showing placeholder, no change
                continue;
            }
            // Compare values - handles all types including undefined
            if (currentValue !== initialValue) {
                return true;
            }
        }
        return false;
    }, [currentSettings, initialSettings]);
    const updateSetting = (key, value) => {
        setCurrentSettings((prev) => ({ ...prev, [key]: value }));
        // Clear validation error for this field when user starts typing
        if (formErrors[key]) {
            setFormErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[key];
                return newErrors;
            });
        }
    };
    // Validation function
    const validateSettings = () => {
        const schema = createValidationSchema(currentSettings.codebaseIndexEmbedderProvider, t);
        // Prepare data for validation
        const dataToValidate = {};
        for (const [key, value] of Object.entries(currentSettings)) {
            // For secret fields with placeholder values, treat them as valid (they exist in backend)
            if (value === SECRET_PLACEHOLDER) {
                // Add a dummy value that will pass validation for these fields
                if (key === "codeIndexOpenAiKey" ||
                    key === "codebaseIndexOpenAiCompatibleApiKey" ||
                    key === "codebaseIndexGeminiApiKey" ||
                    key === "codebaseIndexMistralApiKey" ||
                    key === "codebaseIndexVercelAiGatewayApiKey" ||
                    key === "codebaseIndexOpenRouterApiKey") {
                    dataToValidate[key] = "placeholder-valid";
                }
            }
            else {
                dataToValidate[key] = value;
            }
        }
        try {
            // Validate using the schema
            schema.parse(dataToValidate);
            setFormErrors({});
            return true;
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                const errors = {};
                error.errors.forEach((err) => {
                    if (err.path[0]) {
                        errors[err.path[0]] = err.message;
                    }
                });
                setFormErrors(errors);
            }
            return false;
        }
    };
    // Discard changes functionality
    const checkUnsavedChanges = useCallback((then) => {
        if (hasUnsavedChanges) {
            confirmDialogHandler.current = then;
            setDiscardDialogShow(true);
        }
        else {
            then();
        }
    }, [hasUnsavedChanges]);
    const onConfirmDialogResult = useCallback((confirm) => {
        if (confirm) {
            // Discard changes: Reset to initial settings
            setCurrentSettings(initialSettings);
            setFormErrors({}); // Clear any validation errors
            confirmDialogHandler.current?.(); // Execute the pending action (e.g., close popover)
        }
        setDiscardDialogShow(false);
    }, [initialSettings]);
    // Handle popover close with unsaved changes check
    const handlePopoverClose = useCallback(() => {
        checkUnsavedChanges(() => {
            setOpen(false);
        });
    }, [checkUnsavedChanges]);
    // Use the shared ESC key handler hook - respects unsaved changes logic
    useEscapeKey(open, handlePopoverClose);
    const handleSaveSettings = () => {
        // Validate settings before saving
        if (!validateSettings()) {
            return;
        }
        setSaveStatus("saving");
        setSaveError(null);
        // Prepare settings to save
        const settingsToSave = {};
        // Iterate through all current settings
        for (const [key, value] of Object.entries(currentSettings)) {
            // For secret fields with placeholder, don't send the placeholder
            // but also don't send an empty string - just skip the field
            // This tells the backend to keep the existing secret
            if (value === SECRET_PLACEHOLDER) {
                // Skip sending placeholder values - backend will preserve existing secrets
                continue;
            }
            // Include all other fields, including empty strings (which clear secrets)
            settingsToSave[key] = value;
        }
        // Always include codebaseIndexEnabled to ensure it's persisted
        settingsToSave.codebaseIndexEnabled = currentSettings.codebaseIndexEnabled;
        // Save settings to backend
        vscode.postMessage({
            type: "saveCodeIndexSettingsAtomic",
            codeIndexSettings: settingsToSave,
        });
    };
    const progressPercentage = useMemo(() => indexingStatus.totalItems > 0
        ? Math.round((indexingStatus.processedItems / indexingStatus.totalItems) * 100)
        : 0, [indexingStatus.processedItems, indexingStatus.totalItems]);
    const transformStyleString = `translateX(-${100 - progressPercentage}%)`;
    const getAvailableModels = () => {
        if (!codebaseIndexModels)
            return [];
        const models = codebaseIndexModels[currentSettings.codebaseIndexEmbedderProvider];
        return models ? Object.keys(models) : [];
    };
    const portalContainer = useRooPortal("roo-portal");
    return (_jsxs(_Fragment, { children: [_jsxs(Popover, { open: open, onOpenChange: (newOpen) => {
                    if (!newOpen) {
                        // User is trying to close the popover
                        handlePopoverClose();
                    }
                    else {
                        setOpen(newOpen);
                    }
                }, children: [children, _jsxs(PopoverContent, { className: "w-[calc(100vw-32px)] max-w-[450px] max-h-[80vh] overflow-y-auto p-0", align: "end", alignOffset: 0, side: "bottom", sideOffset: 5, collisionPadding: 16, avoidCollisions: true, container: portalContainer, children: [_jsxs("div", { className: "p-3 border-b border-vscode-dropdown-border cursor-default", children: [_jsx("div", { className: "flex flex-row items-center gap-1 p-0 mt-0 mb-1 w-full", children: _jsx("h4", { className: "m-0 pb-2 flex-1", children: t("settings:codeIndex.title") }) }), _jsx("p", { className: "my-0 pr-4 text-sm w-full", children: _jsx(Trans, { i18nKey: "settings:codeIndex.description", children: _jsx(VSCodeLink, { href: buildDocLink("features/experimental/codebase-indexing", "settings"), style: { display: "inline" } }) }) })] }), _jsxs("div", { className: "p-4", children: [_jsx("div", { className: "mb-4", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(VSCodeCheckbox, { checked: currentSettings.codebaseIndexEnabled, onChange: (e) => updateSetting("codebaseIndexEnabled", e.target.checked), children: _jsx("span", { className: "font-medium", children: t("settings:codeIndex.enableLabel") }) }), _jsx(StandardTooltip, { content: t("settings:codeIndex.enableDescription"), children: _jsx("span", { className: "codicon codicon-info text-xs text-vscode-descriptionForeground cursor-help" }) })] }) }), _jsxs("div", { className: "space-y-2", children: [_jsx("h4", { className: "text-sm font-medium", children: t("settings:codeIndex.statusTitle") }), _jsxs("div", { className: "text-sm text-vscode-descriptionForeground", children: [_jsx("span", { className: cn("inline-block w-3 h-3 rounded-full mr-2", {
                                                            "bg-gray-400": indexingStatus.systemStatus === "Standby",
                                                            "bg-yellow-500 animate-pulse": indexingStatus.systemStatus === "Indexing",
                                                            "bg-green-500": indexingStatus.systemStatus === "Indexed",
                                                            "bg-red-500": indexingStatus.systemStatus === "Error",
                                                        }) }), t(`settings:codeIndex.indexingStatuses.${indexingStatus.systemStatus.toLowerCase()}`), indexingStatus.message ? ` - ${indexingStatus.message}` : ""] }), indexingStatus.systemStatus === "Indexing" && (_jsx("div", { className: "mt-2", children: _jsx(ProgressPrimitive.Root, { className: "relative h-2 w-full overflow-hidden rounded-full bg-secondary", value: progressPercentage, children: _jsx(ProgressPrimitive.Indicator, { className: "h-full w-full flex-1 bg-primary transition-transform duration-300 ease-in-out", style: {
                                                            transform: transformStyleString,
                                                        } }) }) }))] }), _jsxs("div", { className: "mt-4", children: [_jsxs("button", { onClick: () => setIsSetupSettingsOpen(!isSetupSettingsOpen), className: "flex items-center text-xs text-vscode-foreground hover:text-vscode-textLink-foreground focus:outline-none", "aria-expanded": isSetupSettingsOpen, children: [_jsx("span", { className: `codicon codicon-${isSetupSettingsOpen ? "chevron-down" : "chevron-right"} mr-1` }), _jsx("span", { className: "text-base font-semibold", children: t("settings:codeIndex.setupConfigLabel") })] }), isSetupSettingsOpen && (_jsxs("div", { className: "mt-4 space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium", children: t("settings:codeIndex.embedderProviderLabel") }), _jsxs(Select, { value: currentSettings.codebaseIndexEmbedderProvider, onValueChange: (value) => {
                                                                    updateSetting("codebaseIndexEmbedderProvider", value);
                                                                    // Clear model selection when switching providers
                                                                    updateSetting("codebaseIndexEmbedderModelId", "");
                                                                }, children: [_jsx(SelectTrigger, { className: "w-full", children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "openai", children: t("settings:codeIndex.openaiProvider") }), _jsx(SelectItem, { value: "ollama", children: t("settings:codeIndex.ollamaProvider") }), _jsx(SelectItem, { value: "openai-compatible", children: t("settings:codeIndex.openaiCompatibleProvider") }), _jsx(SelectItem, { value: "gemini", children: t("settings:codeIndex.geminiProvider") }), _jsx(SelectItem, { value: "mistral", children: t("settings:codeIndex.mistralProvider") }), _jsx(SelectItem, { value: "vercel-ai-gateway", children: t("settings:codeIndex.vercelAiGatewayProvider") }), _jsx(SelectItem, { value: "openrouter", children: t("settings:codeIndex.openRouterProvider") })] })] })] }), currentSettings.codebaseIndexEmbedderProvider === "openai" && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium", children: t("settings:codeIndex.openAiKeyLabel") }), _jsx(VSCodeTextField, { type: "password", value: currentSettings.codeIndexOpenAiKey || "", onInput: (e) => updateSetting("codeIndexOpenAiKey", e.target.value), placeholder: t("settings:codeIndex.openAiKeyPlaceholder"), className: cn("w-full", {
                                                                            "border-red-500": formErrors.codeIndexOpenAiKey,
                                                                        }) }), formErrors.codeIndexOpenAiKey && (_jsx("p", { className: "text-xs text-vscode-errorForeground mt-1 mb-0", children: formErrors.codeIndexOpenAiKey }))] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium", children: t("settings:codeIndex.modelLabel") }), _jsxs(VSCodeDropdown, { value: currentSettings.codebaseIndexEmbedderModelId, onChange: (e) => updateSetting("codebaseIndexEmbedderModelId", e.target.value), className: cn("w-full", {
                                                                            "border-red-500": formErrors.codebaseIndexEmbedderModelId,
                                                                        }), children: [_jsx(VSCodeOption, { value: "", className: "p-2", children: t("settings:codeIndex.selectModel") }), getAvailableModels().map((modelId) => {
                                                                                const model = codebaseIndexModels?.[currentSettings.codebaseIndexEmbedderProvider]?.[modelId];
                                                                                return (_jsxs(VSCodeOption, { value: modelId, className: "p-2", children: [modelId, " ", model
                                                                                            ? t("settings:codeIndex.modelDimensions", {
                                                                                                dimension: model.dimension,
                                                                                            })
                                                                                            : ""] }, modelId));
                                                                            })] }), formErrors.codebaseIndexEmbedderModelId && (_jsx("p", { className: "text-xs text-vscode-errorForeground mt-1 mb-0", children: formErrors.codebaseIndexEmbedderModelId }))] })] })), currentSettings.codebaseIndexEmbedderProvider === "ollama" && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium", children: t("settings:codeIndex.ollamaBaseUrlLabel") }), _jsx(VSCodeTextField, { value: currentSettings.codebaseIndexEmbedderBaseUrl || "", onInput: (e) => updateSetting("codebaseIndexEmbedderBaseUrl", e.target.value), onBlur: (e) => {
                                                                            // Set default Ollama URL if field is empty
                                                                            if (!e.target.value.trim()) {
                                                                                e.target.value = DEFAULT_OLLAMA_URL;
                                                                                updateSetting("codebaseIndexEmbedderBaseUrl", DEFAULT_OLLAMA_URL);
                                                                            }
                                                                        }, placeholder: t("settings:codeIndex.ollamaUrlPlaceholder"), className: cn("w-full", {
                                                                            "border-red-500": formErrors.codebaseIndexEmbedderBaseUrl,
                                                                        }) }), formErrors.codebaseIndexEmbedderBaseUrl && (_jsx("p", { className: "text-xs text-vscode-errorForeground mt-1 mb-0", children: formErrors.codebaseIndexEmbedderBaseUrl }))] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium", children: t("settings:codeIndex.modelLabel") }), _jsx(VSCodeTextField, { value: currentSettings.codebaseIndexEmbedderModelId || "", onInput: (e) => updateSetting("codebaseIndexEmbedderModelId", e.target.value), placeholder: t("settings:codeIndex.modelPlaceholder"), className: cn("w-full", {
                                                                            "border-red-500": formErrors.codebaseIndexEmbedderModelId,
                                                                        }) }), formErrors.codebaseIndexEmbedderModelId && (_jsx("p", { className: "text-xs text-vscode-errorForeground mt-1 mb-0", children: formErrors.codebaseIndexEmbedderModelId }))] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium", children: t("settings:codeIndex.modelDimensionLabel") }), _jsx(VSCodeTextField, { value: currentSettings.codebaseIndexEmbedderModelDimension?.toString() ||
                                                                            "", onInput: (e) => {
                                                                            const value = e.target.value
                                                                                ? parseInt(e.target.value, 10) || undefined
                                                                                : undefined;
                                                                            updateSetting("codebaseIndexEmbedderModelDimension", value);
                                                                        }, placeholder: t("settings:codeIndex.modelDimensionPlaceholder"), className: cn("w-full", {
                                                                            "border-red-500": formErrors.codebaseIndexEmbedderModelDimension,
                                                                        }) }), formErrors.codebaseIndexEmbedderModelDimension && (_jsx("p", { className: "text-xs text-vscode-errorForeground mt-1 mb-0", children: formErrors.codebaseIndexEmbedderModelDimension }))] })] })), currentSettings.codebaseIndexEmbedderProvider === "openai-compatible" && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium", children: t("settings:codeIndex.openAiCompatibleBaseUrlLabel") }), _jsx(VSCodeTextField, { value: currentSettings.codebaseIndexOpenAiCompatibleBaseUrl || "", onInput: (e) => updateSetting("codebaseIndexOpenAiCompatibleBaseUrl", e.target.value), placeholder: t("settings:codeIndex.openAiCompatibleBaseUrlPlaceholder"), className: cn("w-full", {
                                                                            "border-red-500": formErrors.codebaseIndexOpenAiCompatibleBaseUrl,
                                                                        }) }), formErrors.codebaseIndexOpenAiCompatibleBaseUrl && (_jsx("p", { className: "text-xs text-vscode-errorForeground mt-1 mb-0", children: formErrors.codebaseIndexOpenAiCompatibleBaseUrl }))] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium", children: t("settings:codeIndex.openAiCompatibleApiKeyLabel") }), _jsx(VSCodeTextField, { type: "password", value: currentSettings.codebaseIndexOpenAiCompatibleApiKey || "", onInput: (e) => updateSetting("codebaseIndexOpenAiCompatibleApiKey", e.target.value), placeholder: t("settings:codeIndex.openAiCompatibleApiKeyPlaceholder"), className: cn("w-full", {
                                                                            "border-red-500": formErrors.codebaseIndexOpenAiCompatibleApiKey,
                                                                        }) }), formErrors.codebaseIndexOpenAiCompatibleApiKey && (_jsx("p", { className: "text-xs text-vscode-errorForeground mt-1 mb-0", children: formErrors.codebaseIndexOpenAiCompatibleApiKey }))] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium", children: t("settings:codeIndex.modelLabel") }), _jsx(VSCodeTextField, { value: currentSettings.codebaseIndexEmbedderModelId || "", onInput: (e) => updateSetting("codebaseIndexEmbedderModelId", e.target.value), placeholder: t("settings:codeIndex.modelPlaceholder"), className: cn("w-full", {
                                                                            "border-red-500": formErrors.codebaseIndexEmbedderModelId,
                                                                        }) }), formErrors.codebaseIndexEmbedderModelId && (_jsx("p", { className: "text-xs text-vscode-errorForeground mt-1 mb-0", children: formErrors.codebaseIndexEmbedderModelId }))] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium", children: t("settings:codeIndex.modelDimensionLabel") }), _jsx(VSCodeTextField, { value: currentSettings.codebaseIndexEmbedderModelDimension?.toString() ||
                                                                            "", onInput: (e) => {
                                                                            const value = e.target.value
                                                                                ? parseInt(e.target.value, 10) || undefined
                                                                                : undefined;
                                                                            updateSetting("codebaseIndexEmbedderModelDimension", value);
                                                                        }, placeholder: t("settings:codeIndex.modelDimensionPlaceholder"), className: cn("w-full", {
                                                                            "border-red-500": formErrors.codebaseIndexEmbedderModelDimension,
                                                                        }) }), formErrors.codebaseIndexEmbedderModelDimension && (_jsx("p", { className: "text-xs text-vscode-errorForeground mt-1 mb-0", children: formErrors.codebaseIndexEmbedderModelDimension }))] })] })), currentSettings.codebaseIndexEmbedderProvider === "gemini" && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium", children: t("settings:codeIndex.geminiApiKeyLabel") }), _jsx(VSCodeTextField, { type: "password", value: currentSettings.codebaseIndexGeminiApiKey || "", onInput: (e) => updateSetting("codebaseIndexGeminiApiKey", e.target.value), placeholder: t("settings:codeIndex.geminiApiKeyPlaceholder"), className: cn("w-full", {
                                                                            "border-red-500": formErrors.codebaseIndexGeminiApiKey,
                                                                        }) }), formErrors.codebaseIndexGeminiApiKey && (_jsx("p", { className: "text-xs text-vscode-errorForeground mt-1 mb-0", children: formErrors.codebaseIndexGeminiApiKey }))] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium", children: t("settings:codeIndex.modelLabel") }), _jsxs(VSCodeDropdown, { value: currentSettings.codebaseIndexEmbedderModelId, onChange: (e) => updateSetting("codebaseIndexEmbedderModelId", e.target.value), className: cn("w-full", {
                                                                            "border-red-500": formErrors.codebaseIndexEmbedderModelId,
                                                                        }), children: [_jsx(VSCodeOption, { value: "", className: "p-2", children: t("settings:codeIndex.selectModel") }), getAvailableModels().map((modelId) => {
                                                                                const model = codebaseIndexModels?.[currentSettings.codebaseIndexEmbedderProvider]?.[modelId];
                                                                                return (_jsxs(VSCodeOption, { value: modelId, className: "p-2", children: [modelId, " ", model
                                                                                            ? t("settings:codeIndex.modelDimensions", {
                                                                                                dimension: model.dimension,
                                                                                            })
                                                                                            : ""] }, modelId));
                                                                            })] }), formErrors.codebaseIndexEmbedderModelId && (_jsx("p", { className: "text-xs text-vscode-errorForeground mt-1 mb-0", children: formErrors.codebaseIndexEmbedderModelId }))] })] })), currentSettings.codebaseIndexEmbedderProvider === "mistral" && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium", children: t("settings:codeIndex.mistralApiKeyLabel") }), _jsx(VSCodeTextField, { type: "password", value: currentSettings.codebaseIndexMistralApiKey || "", onInput: (e) => updateSetting("codebaseIndexMistralApiKey", e.target.value), placeholder: t("settings:codeIndex.mistralApiKeyPlaceholder"), className: cn("w-full", {
                                                                            "border-red-500": formErrors.codebaseIndexMistralApiKey,
                                                                        }) }), formErrors.codebaseIndexMistralApiKey && (_jsx("p", { className: "text-xs text-vscode-errorForeground mt-1 mb-0", children: formErrors.codebaseIndexMistralApiKey }))] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium", children: t("settings:codeIndex.modelLabel") }), _jsxs(VSCodeDropdown, { value: currentSettings.codebaseIndexEmbedderModelId, onChange: (e) => updateSetting("codebaseIndexEmbedderModelId", e.target.value), className: cn("w-full", {
                                                                            "border-red-500": formErrors.codebaseIndexEmbedderModelId,
                                                                        }), children: [_jsx(VSCodeOption, { value: "", className: "p-2", children: t("settings:codeIndex.selectModel") }), getAvailableModels().map((modelId) => {
                                                                                const model = codebaseIndexModels?.[currentSettings.codebaseIndexEmbedderProvider]?.[modelId];
                                                                                return (_jsxs(VSCodeOption, { value: modelId, className: "p-2", children: [modelId, " ", model
                                                                                            ? t("settings:codeIndex.modelDimensions", {
                                                                                                dimension: model.dimension,
                                                                                            })
                                                                                            : ""] }, modelId));
                                                                            })] }), formErrors.codebaseIndexEmbedderModelId && (_jsx("p", { className: "text-xs text-vscode-errorForeground mt-1 mb-0", children: formErrors.codebaseIndexEmbedderModelId }))] })] })), currentSettings.codebaseIndexEmbedderProvider === "vercel-ai-gateway" && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium", children: t("settings:codeIndex.vercelAiGatewayApiKeyLabel") }), _jsx(VSCodeTextField, { type: "password", value: currentSettings.codebaseIndexVercelAiGatewayApiKey || "", onInput: (e) => updateSetting("codebaseIndexVercelAiGatewayApiKey", e.target.value), placeholder: t("settings:codeIndex.vercelAiGatewayApiKeyPlaceholder"), className: cn("w-full", {
                                                                            "border-red-500": formErrors.codebaseIndexVercelAiGatewayApiKey,
                                                                        }) }), formErrors.codebaseIndexVercelAiGatewayApiKey && (_jsx("p", { className: "text-xs text-vscode-errorForeground mt-1 mb-0", children: formErrors.codebaseIndexVercelAiGatewayApiKey }))] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium", children: t("settings:codeIndex.modelLabel") }), _jsxs(VSCodeDropdown, { value: currentSettings.codebaseIndexEmbedderModelId, onChange: (e) => updateSetting("codebaseIndexEmbedderModelId", e.target.value), className: cn("w-full", {
                                                                            "border-red-500": formErrors.codebaseIndexEmbedderModelId,
                                                                        }), children: [_jsx(VSCodeOption, { value: "", className: "p-2", children: t("settings:codeIndex.selectModel") }), getAvailableModels().map((modelId) => {
                                                                                const model = codebaseIndexModels?.[currentSettings.codebaseIndexEmbedderProvider]?.[modelId];
                                                                                return (_jsxs(VSCodeOption, { value: modelId, className: "p-2", children: [modelId, " ", model
                                                                                            ? t("settings:codeIndex.modelDimensions", {
                                                                                                dimension: model.dimension,
                                                                                            })
                                                                                            : ""] }, modelId));
                                                                            })] }), formErrors.codebaseIndexEmbedderModelId && (_jsx("p", { className: "text-xs text-vscode-errorForeground mt-1 mb-0", children: formErrors.codebaseIndexEmbedderModelId }))] })] })), currentSettings.codebaseIndexEmbedderProvider === "openrouter" && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium", children: t("settings:codeIndex.openRouterApiKeyLabel") }), _jsx(VSCodeTextField, { type: "password", value: currentSettings.codebaseIndexOpenRouterApiKey || "", onInput: (e) => updateSetting("codebaseIndexOpenRouterApiKey", e.target.value), placeholder: t("settings:codeIndex.openRouterApiKeyPlaceholder"), className: cn("w-full", {
                                                                            "border-red-500": formErrors.codebaseIndexOpenRouterApiKey,
                                                                        }) }), formErrors.codebaseIndexOpenRouterApiKey && (_jsx("p", { className: "text-xs text-vscode-errorForeground mt-1 mb-0", children: formErrors.codebaseIndexOpenRouterApiKey }))] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium", children: t("settings:codeIndex.modelLabel") }), _jsxs(VSCodeDropdown, { value: currentSettings.codebaseIndexEmbedderModelId, onChange: (e) => updateSetting("codebaseIndexEmbedderModelId", e.target.value), className: cn("w-full", {
                                                                            "border-red-500": formErrors.codebaseIndexEmbedderModelId,
                                                                        }), children: [_jsx(VSCodeOption, { value: "", className: "p-2", children: t("settings:codeIndex.selectModel") }), getAvailableModels().map((modelId) => {
                                                                                const model = codebaseIndexModels?.[currentSettings.codebaseIndexEmbedderProvider]?.[modelId];
                                                                                return (_jsxs(VSCodeOption, { value: modelId, className: "p-2", children: [modelId, " ", model
                                                                                            ? t("settings:codeIndex.modelDimensions", {
                                                                                                dimension: model.dimension,
                                                                                            })
                                                                                            : ""] }, modelId));
                                                                            })] }), formErrors.codebaseIndexEmbedderModelId && (_jsx("p", { className: "text-xs text-vscode-errorForeground mt-1 mb-0", children: formErrors.codebaseIndexEmbedderModelId }))] })] })), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium", children: t("settings:codeIndex.qdrantUrlLabel") }), _jsx(VSCodeTextField, { value: currentSettings.codebaseIndexQdrantUrl || "", onInput: (e) => updateSetting("codebaseIndexQdrantUrl", e.target.value), onBlur: (e) => {
                                                                    // Set default Qdrant URL if field is empty
                                                                    if (!e.target.value.trim()) {
                                                                        currentSettings.codebaseIndexQdrantUrl = DEFAULT_QDRANT_URL;
                                                                        updateSetting("codebaseIndexQdrantUrl", DEFAULT_QDRANT_URL);
                                                                    }
                                                                }, placeholder: t("settings:codeIndex.qdrantUrlPlaceholder"), className: cn("w-full", {
                                                                    "border-red-500": formErrors.codebaseIndexQdrantUrl,
                                                                }) }), formErrors.codebaseIndexQdrantUrl && (_jsx("p", { className: "text-xs text-vscode-errorForeground mt-1 mb-0", children: formErrors.codebaseIndexQdrantUrl }))] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium", children: t("settings:codeIndex.qdrantApiKeyLabel") }), _jsx(VSCodeTextField, { type: "password", value: currentSettings.codeIndexQdrantApiKey || "", onInput: (e) => updateSetting("codeIndexQdrantApiKey", e.target.value), placeholder: t("settings:codeIndex.qdrantApiKeyPlaceholder"), className: cn("w-full", {
                                                                    "border-red-500": formErrors.codeIndexQdrantApiKey,
                                                                }) }), formErrors.codeIndexQdrantApiKey && (_jsx("p", { className: "text-xs text-vscode-errorForeground mt-1 mb-0", children: formErrors.codeIndexQdrantApiKey }))] })] }))] }), _jsxs("div", { className: "mt-4", children: [_jsxs("button", { onClick: () => setIsAdvancedSettingsOpen(!isAdvancedSettingsOpen), className: "flex items-center text-xs text-vscode-foreground hover:text-vscode-textLink-foreground focus:outline-none", "aria-expanded": isAdvancedSettingsOpen, children: [_jsx("span", { className: `codicon codicon-${isAdvancedSettingsOpen ? "chevron-down" : "chevron-right"} mr-1` }), _jsx("span", { className: "text-base font-semibold", children: t("settings:codeIndex.advancedConfigLabel") })] }), isAdvancedSettingsOpen && (_jsxs("div", { className: "mt-4 space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("label", { className: "text-sm font-medium", children: t("settings:codeIndex.searchMinScoreLabel") }), _jsx(StandardTooltip, { content: t("settings:codeIndex.searchMinScoreDescription"), children: _jsx("span", { className: "codicon codicon-info text-xs text-vscode-descriptionForeground cursor-help" }) })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Slider, { min: CODEBASE_INDEX_DEFAULTS.MIN_SEARCH_SCORE, max: CODEBASE_INDEX_DEFAULTS.MAX_SEARCH_SCORE, step: CODEBASE_INDEX_DEFAULTS.SEARCH_SCORE_STEP, value: [
                                                                            currentSettings.codebaseIndexSearchMinScore ??
                                                                                CODEBASE_INDEX_DEFAULTS.DEFAULT_SEARCH_MIN_SCORE,
                                                                        ], onValueChange: (values) => updateSetting("codebaseIndexSearchMinScore", values[0]), className: "flex-1", "data-testid": "search-min-score-slider" }), _jsx("span", { className: "w-12 text-center", children: (currentSettings.codebaseIndexSearchMinScore ??
                                                                            CODEBASE_INDEX_DEFAULTS.DEFAULT_SEARCH_MIN_SCORE).toFixed(2) }), _jsx(VSCodeButton, { appearance: "icon", title: t("settings:codeIndex.resetToDefault"), onClick: () => updateSetting("codebaseIndexSearchMinScore", CODEBASE_INDEX_DEFAULTS.DEFAULT_SEARCH_MIN_SCORE), children: _jsx("span", { className: "codicon codicon-discard" }) })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("label", { className: "text-sm font-medium", children: t("settings:codeIndex.searchMaxResultsLabel") }), _jsx(StandardTooltip, { content: t("settings:codeIndex.searchMaxResultsDescription"), children: _jsx("span", { className: "codicon codicon-info text-xs text-vscode-descriptionForeground cursor-help" }) })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Slider, { min: CODEBASE_INDEX_DEFAULTS.MIN_SEARCH_RESULTS, max: CODEBASE_INDEX_DEFAULTS.MAX_SEARCH_RESULTS, step: CODEBASE_INDEX_DEFAULTS.SEARCH_RESULTS_STEP, value: [
                                                                            currentSettings.codebaseIndexSearchMaxResults ??
                                                                                CODEBASE_INDEX_DEFAULTS.DEFAULT_SEARCH_RESULTS,
                                                                        ], onValueChange: (values) => updateSetting("codebaseIndexSearchMaxResults", values[0]), className: "flex-1", "data-testid": "search-max-results-slider" }), _jsx("span", { className: "w-12 text-center", children: currentSettings.codebaseIndexSearchMaxResults ??
                                                                            CODEBASE_INDEX_DEFAULTS.DEFAULT_SEARCH_RESULTS }), _jsx(VSCodeButton, { appearance: "icon", title: t("settings:codeIndex.resetToDefault"), onClick: () => updateSetting("codebaseIndexSearchMaxResults", CODEBASE_INDEX_DEFAULTS.DEFAULT_SEARCH_RESULTS), children: _jsx("span", { className: "codicon codicon-discard" }) })] })] })] }))] }), _jsxs("div", { className: "flex items-center justify-between gap-2 pt-6", children: [_jsxs("div", { className: "flex gap-2", children: [currentSettings.codebaseIndexEnabled &&
                                                        (indexingStatus.systemStatus === "Error" ||
                                                            indexingStatus.systemStatus === "Standby") && (_jsx(VSCodeButton, { onClick: () => vscode.postMessage({ type: "startIndexing" }), disabled: saveStatus === "saving" || hasUnsavedChanges, children: t("settings:codeIndex.startIndexingButton") })), currentSettings.codebaseIndexEnabled &&
                                                        (indexingStatus.systemStatus === "Indexed" ||
                                                            indexingStatus.systemStatus === "Error") && (_jsxs(AlertDialog, { children: [_jsx(AlertDialogTrigger, { asChild: true, children: _jsx(VSCodeButton, { appearance: "secondary", children: t("settings:codeIndex.clearIndexDataButton") }) }), _jsxs(AlertDialogContent, { children: [_jsxs(AlertDialogHeader, { children: [_jsx(AlertDialogTitle, { children: t("settings:codeIndex.clearDataDialog.title") }), _jsx(AlertDialogDescription, { children: t("settings:codeIndex.clearDataDialog.description") })] }), _jsxs(AlertDialogFooter, { children: [_jsx(AlertDialogCancel, { children: t("settings:codeIndex.clearDataDialog.cancelButton") }), _jsx(AlertDialogAction, { onClick: () => vscode.postMessage({ type: "clearIndexData" }), children: t("settings:codeIndex.clearDataDialog.confirmButton") })] })] })] }))] }), _jsx(VSCodeButton, { onClick: handleSaveSettings, disabled: !hasUnsavedChanges || saveStatus === "saving", children: saveStatus === "saving"
                                                    ? t("settings:codeIndex.saving")
                                                    : t("settings:codeIndex.saveSettings") })] }), saveStatus === "error" && (_jsx("div", { className: "mt-2", children: _jsx("span", { className: "text-sm text-vscode-errorForeground block", children: saveError || t("settings:codeIndex.saveError") }) }))] })] })] }), _jsx(AlertDialog, { open: isDiscardDialogShow, onOpenChange: setDiscardDialogShow, children: _jsxs(AlertDialogContent, { children: [_jsxs(AlertDialogHeader, { children: [_jsxs(AlertDialogTitle, { className: "flex items-center gap-2", children: [_jsx(AlertTriangle, { className: "w-5 h-5 text-yellow-500" }), t("settings:unsavedChangesDialog.title")] }), _jsx(AlertDialogDescription, { children: t("settings:unsavedChangesDialog.description") })] }), _jsxs(AlertDialogFooter, { children: [_jsx(AlertDialogCancel, { onClick: () => onConfirmDialogResult(false), children: t("settings:unsavedChangesDialog.cancelButton") }), _jsx(AlertDialogAction, { onClick: () => onConfirmDialogResult(true), children: t("settings:unsavedChangesDialog.discardButton") })] })] }) })] }));
};
//# sourceMappingURL=CodeIndexPopover.js.map