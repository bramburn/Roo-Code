import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback } from "react";
import { VSCodeTextField } from "@vscode/webview-ui-toolkit/react";
import { vercelAiGatewayDefaultModelId } from "@roo-code/types";
import { useAppTranslation } from "@src/i18n/TranslationContext";
import { VSCodeButtonLink } from "@src/components/common/VSCodeButtonLink";
import { inputEventTransform } from "../transforms";
import { ModelPicker } from "../ModelPicker";
export const VercelAiGateway = ({ apiConfiguration, setApiConfigurationField, routerModels, organizationAllowList, modelValidationError, }) => {
    const { t } = useAppTranslation();
    const handleInputChange = useCallback((field, transform = inputEventTransform) => (event) => {
        setApiConfigurationField(field, transform(event));
    }, [setApiConfigurationField]);
    return (_jsxs(_Fragment, { children: [_jsx(VSCodeTextField, { value: apiConfiguration?.vercelAiGatewayApiKey || "", type: "password", onInput: handleInputChange("vercelAiGatewayApiKey"), placeholder: t("settings:placeholders.apiKey"), className: "w-full", children: _jsx("label", { className: "block font-medium mb-1", children: t("settings:providers.vercelAiGatewayApiKey") }) }), _jsx("div", { className: "text-sm text-vscode-descriptionForeground -mt-2", children: t("settings:providers.apiKeyStorageNotice") }), !apiConfiguration?.vercelAiGatewayApiKey && (_jsx(VSCodeButtonLink, { href: "https://vercel.com/d?to=%2F%5Bteam%5D%2F%7E%2Fai%2Fapi-keys&title=AI+Gateway+API+Key", appearance: "primary", style: { width: "100%" }, children: t("settings:providers.getVercelAiGatewayApiKey") })), _jsx(ModelPicker, { apiConfiguration: apiConfiguration, setApiConfigurationField: setApiConfigurationField, defaultModelId: vercelAiGatewayDefaultModelId, models: routerModels?.["vercel-ai-gateway"] ?? {}, modelIdKey: "vercelAiGatewayModelId", serviceName: "Vercel AI Gateway", serviceUrl: "https://vercel.com/ai-gateway/models", organizationAllowList: organizationAllowList, errorMessage: modelValidationError })] }));
};
//# sourceMappingURL=VercelAiGateway.js.map