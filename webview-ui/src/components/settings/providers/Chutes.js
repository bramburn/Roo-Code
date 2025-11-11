import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback } from "react";
import { VSCodeTextField } from "@vscode/webview-ui-toolkit/react";
import { chutesDefaultModelId } from "@roo-code/types";
import { useAppTranslation } from "@src/i18n/TranslationContext";
import { VSCodeButtonLink } from "@src/components/common/VSCodeButtonLink";
import { ModelPicker } from "../ModelPicker";
import { inputEventTransform } from "../transforms";
export const Chutes = ({ apiConfiguration, setApiConfigurationField, routerModels, organizationAllowList, modelValidationError, }) => {
    const { t } = useAppTranslation();
    const handleInputChange = useCallback((field, transform = inputEventTransform) => (event) => {
        setApiConfigurationField(field, transform(event));
    }, [setApiConfigurationField]);
    return (_jsxs(_Fragment, { children: [_jsx(VSCodeTextField, { value: apiConfiguration?.chutesApiKey || "", type: "password", onInput: handleInputChange("chutesApiKey"), placeholder: t("settings:placeholders.apiKey"), className: "w-full", children: _jsx("label", { className: "block font-medium mb-1", children: t("settings:providers.chutesApiKey") }) }), _jsx("div", { className: "text-sm text-vscode-descriptionForeground -mt-2", children: t("settings:providers.apiKeyStorageNotice") }), !apiConfiguration?.chutesApiKey && (_jsx(VSCodeButtonLink, { href: "https://chutes.ai/app/api", appearance: "secondary", children: t("settings:providers.getChutesApiKey") })), _jsx(ModelPicker, { apiConfiguration: apiConfiguration, setApiConfigurationField: setApiConfigurationField, defaultModelId: chutesDefaultModelId, models: routerModels?.chutes ?? {}, modelIdKey: "apiModelId", serviceName: "Chutes AI", serviceUrl: "https://llm.chutes.ai/v1/models", organizationAllowList: organizationAllowList, errorMessage: modelValidationError })] }));
};
//# sourceMappingURL=Chutes.js.map