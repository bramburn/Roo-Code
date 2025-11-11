import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useState } from "react";
import { Trans } from "react-i18next";
import { Checkbox } from "vscrui";
import { VSCodeTextField } from "@vscode/webview-ui-toolkit/react";
import { openRouterDefaultModelId } from "@roo-code/types";
import { useAppTranslation } from "@src/i18n/TranslationContext";
import { getOpenRouterAuthUrl } from "@src/oauth/urls";
import { VSCodeButtonLink } from "@src/components/common/VSCodeButtonLink";
import { inputEventTransform, noTransform } from "../transforms";
import { ModelPicker } from "../ModelPicker";
import { OpenRouterBalanceDisplay } from "./OpenRouterBalanceDisplay";
export const OpenRouter = ({ apiConfiguration, setApiConfigurationField, routerModels, uriScheme, fromWelcomeView, organizationAllowList, modelValidationError, }) => {
    const { t } = useAppTranslation();
    const [openRouterBaseUrlSelected, setOpenRouterBaseUrlSelected] = useState(!!apiConfiguration?.openRouterBaseUrl);
    const handleInputChange = useCallback((field, transform = inputEventTransform) => (event) => {
        setApiConfigurationField(field, transform(event));
    }, [setApiConfigurationField]);
    return (_jsxs(_Fragment, { children: [_jsx(VSCodeTextField, { value: apiConfiguration?.openRouterApiKey || "", type: "password", onInput: handleInputChange("openRouterApiKey"), placeholder: t("settings:placeholders.apiKey"), className: "w-full", children: _jsxs("div", { className: "flex justify-between items-center mb-1", children: [_jsx("label", { className: "block font-medium", children: t("settings:providers.openRouterApiKey") }), apiConfiguration?.openRouterApiKey && (_jsx(OpenRouterBalanceDisplay, { apiKey: apiConfiguration.openRouterApiKey, baseUrl: apiConfiguration.openRouterBaseUrl }))] }) }), _jsx("div", { className: "text-sm text-vscode-descriptionForeground -mt-2", children: t("settings:providers.apiKeyStorageNotice") }), !apiConfiguration?.openRouterApiKey && (_jsx(VSCodeButtonLink, { href: getOpenRouterAuthUrl(uriScheme), style: { width: "100%" }, appearance: "primary", children: t("settings:providers.getOpenRouterApiKey") })), !fromWelcomeView && (_jsxs(_Fragment, { children: [_jsxs("div", { children: [_jsx(Checkbox, { checked: openRouterBaseUrlSelected, onChange: (checked) => {
                                    setOpenRouterBaseUrlSelected(checked);
                                    if (!checked) {
                                        setApiConfigurationField("openRouterBaseUrl", "");
                                    }
                                }, children: t("settings:providers.useCustomBaseUrl") }), openRouterBaseUrlSelected && (_jsx(VSCodeTextField, { value: apiConfiguration?.openRouterBaseUrl || "", type: "url", onInput: handleInputChange("openRouterBaseUrl"), placeholder: "Default: https://openrouter.ai/api/v1", className: "w-full mt-1" }))] }), _jsx(Checkbox, { checked: apiConfiguration?.openRouterUseMiddleOutTransform ?? true, onChange: handleInputChange("openRouterUseMiddleOutTransform", noTransform), children: _jsx(Trans, { i18nKey: "settings:providers.openRouterTransformsText", components: {
                                a: _jsx("a", { href: "https://openrouter.ai/docs/transforms" }),
                            } }) })] })), _jsx(ModelPicker, { apiConfiguration: apiConfiguration, setApiConfigurationField: setApiConfigurationField, defaultModelId: openRouterDefaultModelId, models: routerModels?.openrouter ?? {}, modelIdKey: "openRouterModelId", serviceName: "OpenRouter", serviceUrl: "https://openrouter.ai/models", organizationAllowList: organizationAllowList, errorMessage: modelValidationError })] }));
};
//# sourceMappingURL=OpenRouter.js.map