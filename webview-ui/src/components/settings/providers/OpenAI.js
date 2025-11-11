import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useState } from "react";
import { Checkbox } from "vscrui";
import { VSCodeTextField } from "@vscode/webview-ui-toolkit/react";
import { useAppTranslation } from "@src/i18n/TranslationContext";
import { VSCodeButtonLink } from "@src/components/common/VSCodeButtonLink";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, StandardTooltip } from "@src/components/ui";
import { inputEventTransform } from "../transforms";
export const OpenAI = ({ apiConfiguration, setApiConfigurationField, selectedModelInfo }) => {
    const { t } = useAppTranslation();
    const [openAiNativeBaseUrlSelected, setOpenAiNativeBaseUrlSelected] = useState(!!apiConfiguration?.openAiNativeBaseUrl);
    const handleInputChange = useCallback((field, transform = inputEventTransform) => (event) => {
        setApiConfigurationField(field, transform(event));
    }, [setApiConfigurationField]);
    return (_jsxs(_Fragment, { children: [_jsx(Checkbox, { checked: openAiNativeBaseUrlSelected, onChange: (checked) => {
                    setOpenAiNativeBaseUrlSelected(checked);
                    if (!checked) {
                        setApiConfigurationField("openAiNativeBaseUrl", "");
                    }
                }, children: t("settings:providers.useCustomBaseUrl") }), openAiNativeBaseUrlSelected && (_jsx(_Fragment, { children: _jsx(VSCodeTextField, { value: apiConfiguration?.openAiNativeBaseUrl || "", type: "url", onInput: handleInputChange("openAiNativeBaseUrl"), placeholder: "https://api.openai.com/v1", className: "w-full mt-1" }) })), _jsx(VSCodeTextField, { value: apiConfiguration?.openAiNativeApiKey || "", type: "password", onInput: handleInputChange("openAiNativeApiKey"), placeholder: t("settings:placeholders.apiKey"), className: "w-full", children: _jsx("label", { className: "block font-medium mb-1", children: t("settings:providers.openAiApiKey") }) }), _jsx("div", { className: "text-sm text-vscode-descriptionForeground -mt-2", children: t("settings:providers.apiKeyStorageNotice") }), !apiConfiguration?.openAiNativeApiKey && (_jsx(VSCodeButtonLink, { href: "https://platform.openai.com/api-keys", appearance: "secondary", children: t("settings:providers.getOpenAiApiKey") })), (() => {
                const allowedTiers = (selectedModelInfo?.tiers?.map((t) => t.name).filter(Boolean) || []).filter((t) => t === "flex" || t === "priority");
                if (allowedTiers.length === 0)
                    return null;
                return (_jsxs("div", { className: "flex flex-col gap-1 mt-2", "data-testid": "openai-service-tier", children: [_jsxs("div", { className: "flex items-center gap-1", children: [_jsx("label", { className: "block font-medium mb-1", children: "Service tier" }), _jsx(StandardTooltip, { content: "For faster processing of API requests, try the priority processing service tier. For lower prices with higher latency, try the flex processing tier.", children: _jsx("i", { className: "codicon codicon-info text-vscode-descriptionForeground text-xs" }) })] }), _jsxs(Select, { value: apiConfiguration.openAiNativeServiceTier || "default", onValueChange: (value) => setApiConfigurationField("openAiNativeServiceTier", value), children: [_jsx(SelectTrigger, { className: "w-full", children: _jsx(SelectValue, { placeholder: t("settings:common.select") }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "default", children: "Standard" }), allowedTiers.includes("flex") && _jsx(SelectItem, { value: "flex", children: "Flex" }), allowedTiers.includes("priority") && (_jsx(SelectItem, { value: "priority", children: "Priority" }))] })] })] }));
            })()] }));
};
//# sourceMappingURL=OpenAI.js.map