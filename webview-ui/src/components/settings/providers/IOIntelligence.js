import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback } from "react";
import { VSCodeTextField } from "@vscode/webview-ui-toolkit/react";
import { ioIntelligenceDefaultModelId, ioIntelligenceModels, } from "@roo-code/types";
import { useAppTranslation } from "@src/i18n/TranslationContext";
import { VSCodeButtonLink } from "@src/components/common/VSCodeButtonLink";
import { useExtensionState } from "@src/context/ExtensionStateContext";
import { ModelPicker } from "../ModelPicker";
import { inputEventTransform } from "../transforms";
export const IOIntelligence = ({ apiConfiguration, setApiConfigurationField, organizationAllowList, modelValidationError, }) => {
    const { t } = useAppTranslation();
    const { routerModels } = useExtensionState();
    const handleInputChange = useCallback((field, transform = inputEventTransform) => (event) => {
        setApiConfigurationField(field, transform(event));
    }, [setApiConfigurationField]);
    return (_jsxs(_Fragment, { children: [_jsx(VSCodeTextField, { value: apiConfiguration?.ioIntelligenceApiKey || "", type: "password", onInput: handleInputChange("ioIntelligenceApiKey"), placeholder: t("settings:providers.ioIntelligenceApiKeyPlaceholder"), className: "w-full", children: _jsx("label", { className: "block font-medium mb-1", children: t("settings:providers.ioIntelligenceApiKey") }) }), _jsx("div", { className: "text-sm text-vscode-descriptionForeground -mt-2", children: t("settings:providers.apiKeyStorageNotice") }), !apiConfiguration?.ioIntelligenceApiKey && (_jsx(VSCodeButtonLink, { href: "https://ai.io.net/ai/api-keys", appearance: "secondary", children: t("settings:providers.getIoIntelligenceApiKey") })), _jsx(ModelPicker, { apiConfiguration: apiConfiguration, defaultModelId: ioIntelligenceDefaultModelId, models: routerModels?.["io-intelligence"] ?? ioIntelligenceModels, modelIdKey: "ioIntelligenceModelId", serviceName: "IO Intelligence", serviceUrl: "https://api.intelligence.io.solutions/api/v1/models", setApiConfigurationField: setApiConfigurationField, organizationAllowList: organizationAllowList, errorMessage: modelValidationError })] }));
};
//# sourceMappingURL=IOIntelligence.js.map