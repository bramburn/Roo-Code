import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useState } from "react";
import { Checkbox } from "vscrui";
import { VSCodeTextField } from "@vscode/webview-ui-toolkit/react";
import { useAppTranslation } from "@src/i18n/TranslationContext";
import { VSCodeButtonLink } from "@src/components/common/VSCodeButtonLink";
import { inputEventTransform } from "../transforms";
export const Gemini = ({ apiConfiguration, setApiConfigurationField, fromWelcomeView }) => {
    const { t } = useAppTranslation();
    const [googleGeminiBaseUrlSelected, setGoogleGeminiBaseUrlSelected] = useState(!!apiConfiguration?.googleGeminiBaseUrl);
    const handleInputChange = useCallback((field, transform = inputEventTransform) => (event) => {
        setApiConfigurationField(field, transform(event));
    }, [setApiConfigurationField]);
    return (_jsxs(_Fragment, { children: [_jsx(VSCodeTextField, { value: apiConfiguration?.geminiApiKey || "", type: "password", onInput: handleInputChange("geminiApiKey"), placeholder: t("settings:placeholders.apiKey"), className: "w-full", children: _jsx("label", { className: "block font-medium mb-1", children: t("settings:providers.geminiApiKey") }) }), _jsx("div", { className: "text-sm text-vscode-descriptionForeground -mt-2", children: t("settings:providers.apiKeyStorageNotice") }), !apiConfiguration?.geminiApiKey && (_jsx(VSCodeButtonLink, { href: "https://ai.google.dev/", appearance: "secondary", children: t("settings:providers.getGeminiApiKey") })), _jsxs("div", { children: [_jsx(Checkbox, { "data-testid": "checkbox-custom-base-url", checked: googleGeminiBaseUrlSelected, onChange: (checked) => {
                            setGoogleGeminiBaseUrlSelected(checked);
                            if (!checked) {
                                setApiConfigurationField("googleGeminiBaseUrl", "");
                            }
                        }, children: t("settings:providers.useCustomBaseUrl") }), googleGeminiBaseUrlSelected && (_jsx(VSCodeTextField, { value: apiConfiguration?.googleGeminiBaseUrl || "", type: "url", onInput: handleInputChange("googleGeminiBaseUrl"), placeholder: t("settings:defaults.geminiUrl"), className: "w-full mt-1" })), !fromWelcomeView && (_jsxs(_Fragment, { children: [_jsx(Checkbox, { className: "mt-6", "data-testid": "checkbox-url-context", checked: !!apiConfiguration.enableUrlContext, onChange: (checked) => setApiConfigurationField("enableUrlContext", checked), children: t("settings:providers.geminiParameters.urlContext.title") }), _jsx("div", { className: "text-sm text-vscode-descriptionForeground mb-3 mt-1.5", children: t("settings:providers.geminiParameters.urlContext.description") }), _jsx(Checkbox, { "data-testid": "checkbox-grounding-search", checked: !!apiConfiguration.enableGrounding, onChange: (checked) => setApiConfigurationField("enableGrounding", checked), children: t("settings:providers.geminiParameters.groundingSearch.title") }), _jsx("div", { className: "text-sm text-vscode-descriptionForeground mb-3 mt-1.5", children: t("settings:providers.geminiParameters.groundingSearch.description") })] }))] })] }));
};
//# sourceMappingURL=Gemini.js.map