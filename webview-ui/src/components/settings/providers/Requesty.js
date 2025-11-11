import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useState } from "react";
import { VSCodeCheckbox, VSCodeTextField } from "@vscode/webview-ui-toolkit/react";
import { requestyDefaultModelId } from "@roo-code/types";
import { vscode } from "@src/utils/vscode";
import { useAppTranslation } from "@src/i18n/TranslationContext";
import { Button } from "@src/components/ui";
import { inputEventTransform } from "../transforms";
import { ModelPicker } from "../ModelPicker";
import { RequestyBalanceDisplay } from "./RequestyBalanceDisplay";
import { getCallbackUrl } from "@/oauth/urls";
import { toRequestyServiceUrl } from "@roo/utils/requesty";
export const Requesty = ({ apiConfiguration, setApiConfigurationField, routerModels, refetchRouterModels, organizationAllowList, modelValidationError, uriScheme, }) => {
    const { t } = useAppTranslation();
    const [requestyEndpointSelected, setRequestyEndpointSelected] = useState(!!apiConfiguration.requestyBaseUrl);
    // This ensures that the "Use custom URL" checkbox is hidden when the user deletes the URL.
    useEffect(() => {
        setRequestyEndpointSelected(!!apiConfiguration?.requestyBaseUrl);
    }, [apiConfiguration?.requestyBaseUrl]);
    const handleInputChange = useCallback((field, transform = inputEventTransform) => (event) => {
        setApiConfigurationField(field, transform(event));
    }, [setApiConfigurationField]);
    const getApiKeyUrl = () => {
        const callbackUrl = getCallbackUrl("requesty", uriScheme);
        const baseUrl = toRequestyServiceUrl(apiConfiguration.requestyBaseUrl, "app");
        const authUrl = new URL(`oauth/authorize?callback_url=${callbackUrl}`, baseUrl);
        return authUrl.toString();
    };
    return (_jsxs(_Fragment, { children: [_jsx(VSCodeTextField, { value: apiConfiguration?.requestyApiKey || "", type: "password", onInput: handleInputChange("requestyApiKey"), placeholder: t("settings:providers.getRequestyApiKey"), className: "w-full", children: _jsxs("div", { className: "flex justify-between items-center mb-1", children: [_jsx("label", { className: "block font-medium", children: t("settings:providers.requestyApiKey") }), apiConfiguration?.requestyApiKey && (_jsx(RequestyBalanceDisplay, { baseUrl: apiConfiguration.requestyBaseUrl, apiKey: apiConfiguration.requestyApiKey }))] }) }), _jsx("div", { className: "text-sm text-vscode-descriptionForeground -mt-2", children: t("settings:providers.apiKeyStorageNotice") }), _jsx("a", { href: getApiKeyUrl(), target: "_blank", rel: "noopener noreferrer", className: "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 rounded-md px-3 w-full", style: {
                    width: "100%",
                    textDecoration: "none",
                    color: "var(--vscode-button-foreground)",
                    backgroundColor: "var(--vscode-button-background)",
                }, children: t("settings:providers.getRequestyApiKey") }), _jsx(VSCodeCheckbox, { checked: requestyEndpointSelected, onChange: (e) => {
                    const isChecked = e.target.checked === true;
                    if (!isChecked) {
                        setApiConfigurationField("requestyBaseUrl", undefined);
                    }
                    setRequestyEndpointSelected(isChecked);
                }, children: t("settings:providers.requestyUseCustomBaseUrl") }), requestyEndpointSelected && (_jsx(VSCodeTextField, { value: apiConfiguration?.requestyBaseUrl || "", type: "text", onInput: handleInputChange("requestyBaseUrl"), placeholder: t("settings:providers.getRequestyBaseUrl"), className: "w-full", children: _jsx("div", { className: "flex justify-between items-center mb-1", children: _jsx("label", { className: "block font-medium", children: t("settings:providers.getRequestyBaseUrl") }) }) })), _jsx(Button, { variant: "outline", onClick: () => {
                    vscode.postMessage({ type: "flushRouterModels", text: "requesty" });
                    refetchRouterModels();
                }, children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "codicon codicon-refresh" }), t("settings:providers.refreshModels.label")] }) }), _jsx(ModelPicker, { apiConfiguration: apiConfiguration, setApiConfigurationField: setApiConfigurationField, defaultModelId: requestyDefaultModelId, models: routerModels?.requesty ?? {}, modelIdKey: "requestyModelId", serviceName: "Requesty", serviceUrl: "https://requesty.ai", organizationAllowList: organizationAllowList, errorMessage: modelValidationError })] }));
};
//# sourceMappingURL=Requesty.js.map