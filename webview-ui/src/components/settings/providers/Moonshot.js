import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback } from "react";
import { VSCodeTextField, VSCodeDropdown, VSCodeOption } from "@vscode/webview-ui-toolkit/react";
import { useAppTranslation } from "@src/i18n/TranslationContext";
import { VSCodeButtonLink } from "@src/components/common/VSCodeButtonLink";
import { inputEventTransform } from "../transforms";
import { cn } from "@/lib/utils";
export const Moonshot = ({ apiConfiguration, setApiConfigurationField }) => {
    const { t } = useAppTranslation();
    const handleInputChange = useCallback((field, transform = inputEventTransform) => (event) => {
        setApiConfigurationField(field, transform(event));
    }, [setApiConfigurationField]);
    return (_jsxs(_Fragment, { children: [_jsxs("div", { children: [_jsx("label", { className: "block font-medium mb-1", children: t("settings:providers.moonshotBaseUrl") }), _jsxs(VSCodeDropdown, { value: apiConfiguration.moonshotBaseUrl, onChange: handleInputChange("moonshotBaseUrl"), className: cn("w-full"), children: [_jsx(VSCodeOption, { value: "https://api.moonshot.ai/v1", className: "p-2", children: "api.moonshot.ai" }), _jsx(VSCodeOption, { value: "https://api.moonshot.cn/v1", className: "p-2", children: "api.moonshot.cn" })] })] }), _jsxs("div", { children: [_jsx(VSCodeTextField, { value: apiConfiguration?.moonshotApiKey || "", type: "password", onInput: handleInputChange("moonshotApiKey"), placeholder: t("settings:placeholders.apiKey"), className: "w-full", children: _jsx("label", { className: "block font-medium mb-1", children: t("settings:providers.moonshotApiKey") }) }), _jsx("div", { className: "text-sm text-vscode-descriptionForeground", children: t("settings:providers.apiKeyStorageNotice") }), !apiConfiguration?.moonshotApiKey && (_jsx(VSCodeButtonLink, { href: apiConfiguration.moonshotBaseUrl === "https://api.moonshot.cn/v1"
                            ? "https://platform.moonshot.cn/console/api-keys"
                            : "https://platform.moonshot.ai/console/api-keys", appearance: "secondary", children: t("settings:providers.getMoonshotApiKey") }))] })] }));
};
//# sourceMappingURL=Moonshot.js.map