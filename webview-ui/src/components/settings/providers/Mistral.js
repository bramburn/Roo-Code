import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback } from "react";
import { VSCodeTextField } from "@vscode/webview-ui-toolkit/react";
import { mistralDefaultModelId } from "@roo-code/types";
import { useAppTranslation } from "@src/i18n/TranslationContext";
import { VSCodeButtonLink } from "@src/components/common/VSCodeButtonLink";
import { inputEventTransform } from "../transforms";
export const Mistral = ({ apiConfiguration, setApiConfigurationField }) => {
    const { t } = useAppTranslation();
    const handleInputChange = useCallback((field, transform = inputEventTransform) => (event) => {
        setApiConfigurationField(field, transform(event));
    }, [setApiConfigurationField]);
    return (_jsxs(_Fragment, { children: [_jsx(VSCodeTextField, { value: apiConfiguration?.mistralApiKey || "", type: "password", onInput: handleInputChange("mistralApiKey"), placeholder: t("settings:placeholders.apiKey"), className: "w-full", children: _jsx("span", { className: "font-medium", children: t("settings:providers.mistralApiKey") }) }), _jsx("div", { className: "text-sm text-vscode-descriptionForeground -mt-2", children: t("settings:providers.apiKeyStorageNotice") }), !apiConfiguration?.mistralApiKey && (_jsx(VSCodeButtonLink, { href: "https://console.mistral.ai/", appearance: "secondary", children: t("settings:providers.getMistralApiKey") })), (apiConfiguration?.apiModelId?.startsWith("codestral-") ||
                (!apiConfiguration?.apiModelId && mistralDefaultModelId.startsWith("codestral-"))) && (_jsxs(_Fragment, { children: [_jsx(VSCodeTextField, { value: apiConfiguration?.mistralCodestralUrl || "", type: "url", onInput: handleInputChange("mistralCodestralUrl"), placeholder: "https://codestral.mistral.ai", className: "w-full", children: _jsx("label", { className: "block font-medium mb-1", children: t("settings:providers.codestralBaseUrl") }) }), _jsx("div", { className: "text-sm text-vscode-descriptionForeground -mt-2", children: t("settings:providers.codestralBaseUrlDesc") })] }))] }));
};
//# sourceMappingURL=Mistral.js.map