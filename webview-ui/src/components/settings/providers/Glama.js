import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback } from "react";
import { VSCodeTextField } from "@vscode/webview-ui-toolkit/react";
import { glamaDefaultModelId } from "@roo-code/types";
import { useAppTranslation } from "@src/i18n/TranslationContext";
import { getGlamaAuthUrl } from "@src/oauth/urls";
import { VSCodeButtonLink } from "@src/components/common/VSCodeButtonLink";
import { inputEventTransform } from "../transforms";
import { ModelPicker } from "../ModelPicker";
export const Glama = ({ apiConfiguration, setApiConfigurationField, routerModels, uriScheme, organizationAllowList, modelValidationError, }) => {
    const { t } = useAppTranslation();
    const handleInputChange = useCallback((field, transform = inputEventTransform) => (event) => {
        setApiConfigurationField(field, transform(event));
    }, [setApiConfigurationField]);
    return (_jsxs(_Fragment, { children: [_jsx(VSCodeTextField, { value: apiConfiguration?.glamaApiKey || "", type: "password", onInput: handleInputChange("glamaApiKey"), placeholder: t("settings:placeholders.apiKey"), className: "w-full", children: _jsx("label", { className: "block font-medium mb-1", children: t("settings:providers.glamaApiKey") }) }), _jsx("div", { className: "text-sm text-vscode-descriptionForeground -mt-2", children: t("settings:providers.apiKeyStorageNotice") }), !apiConfiguration?.glamaApiKey && (_jsx(VSCodeButtonLink, { href: getGlamaAuthUrl(uriScheme), style: { width: "100%" }, appearance: "primary", children: t("settings:providers.getGlamaApiKey") })), _jsx(ModelPicker, { apiConfiguration: apiConfiguration, setApiConfigurationField: setApiConfigurationField, defaultModelId: glamaDefaultModelId, models: routerModels?.glama ?? {}, modelIdKey: "glamaModelId", serviceName: "Glama", serviceUrl: "https://glama.ai/models", organizationAllowList: organizationAllowList, errorMessage: modelValidationError })] }));
};
//# sourceMappingURL=Glama.js.map