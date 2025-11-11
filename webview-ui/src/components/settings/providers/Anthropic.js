import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useState } from "react";
import { Checkbox } from "vscrui";
import { VSCodeTextField } from "@vscode/webview-ui-toolkit/react";
import { useAppTranslation } from "@src/i18n/TranslationContext";
import { VSCodeButtonLink } from "@src/components/common/VSCodeButtonLink";
import { useSelectedModel } from "@src/components/ui/hooks/useSelectedModel";
import { inputEventTransform, noTransform } from "../transforms";
export const Anthropic = ({ apiConfiguration, setApiConfigurationField }) => {
    const { t } = useAppTranslation();
    const selectedModel = useSelectedModel(apiConfiguration);
    const [anthropicBaseUrlSelected, setAnthropicBaseUrlSelected] = useState(!!apiConfiguration?.anthropicBaseUrl);
    // Check if the current model supports 1M context beta
    const supports1MContextBeta = selectedModel?.id === "claude-sonnet-4-20250514" || selectedModel?.id === "claude-sonnet-4-5";
    const handleInputChange = useCallback((field, transform = inputEventTransform) => (event) => {
        setApiConfigurationField(field, transform(event));
    }, [setApiConfigurationField]);
    return (_jsxs(_Fragment, { children: [_jsx(VSCodeTextField, { value: apiConfiguration?.apiKey || "", type: "password", onInput: handleInputChange("apiKey"), placeholder: t("settings:placeholders.apiKey"), className: "w-full", children: _jsx("label", { className: "block font-medium mb-1", children: t("settings:providers.anthropicApiKey") }) }), _jsx("div", { className: "text-sm text-vscode-descriptionForeground -mt-2", children: t("settings:providers.apiKeyStorageNotice") }), !apiConfiguration?.apiKey && (_jsx(VSCodeButtonLink, { href: "https://console.anthropic.com/settings/keys", appearance: "secondary", children: t("settings:providers.getAnthropicApiKey") })), _jsxs("div", { children: [_jsx(Checkbox, { checked: anthropicBaseUrlSelected, onChange: (checked) => {
                            setAnthropicBaseUrlSelected(checked);
                            if (!checked) {
                                setApiConfigurationField("anthropicBaseUrl", "");
                                setApiConfigurationField("anthropicUseAuthToken", false);
                            }
                        }, children: t("settings:providers.useCustomBaseUrl") }), anthropicBaseUrlSelected && (_jsxs(_Fragment, { children: [_jsx(VSCodeTextField, { value: apiConfiguration?.anthropicBaseUrl || "", type: "url", onInput: handleInputChange("anthropicBaseUrl"), placeholder: "https://api.anthropic.com", className: "w-full mt-1" }), _jsx(Checkbox, { checked: apiConfiguration?.anthropicUseAuthToken ?? false, onChange: handleInputChange("anthropicUseAuthToken", noTransform), className: "w-full mt-1", children: t("settings:providers.anthropicUseAuthToken") })] }))] }), supports1MContextBeta && (_jsxs("div", { children: [_jsx(Checkbox, { checked: apiConfiguration?.anthropicBeta1MContext ?? false, onChange: (checked) => {
                            setApiConfigurationField("anthropicBeta1MContext", checked);
                        }, children: t("settings:providers.anthropic1MContextBetaLabel") }), _jsx("div", { className: "text-sm text-vscode-descriptionForeground mt-1 ml-6", children: t("settings:providers.anthropic1MContextBetaDescription") })] }))] }));
};
//# sourceMappingURL=Anthropic.js.map