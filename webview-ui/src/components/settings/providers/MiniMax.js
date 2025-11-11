import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback } from "react";
import { VSCodeTextField, VSCodeDropdown, VSCodeOption } from "@vscode/webview-ui-toolkit/react";
import { useAppTranslation } from "@src/i18n/TranslationContext";
import { VSCodeButtonLink } from "@src/components/common/VSCodeButtonLink";
import { inputEventTransform } from "../transforms";
import { cn } from "@/lib/utils";
export const MiniMax = ({ apiConfiguration, setApiConfigurationField }) => {
    const { t } = useAppTranslation();
    const handleInputChange = useCallback((field, transform = inputEventTransform) => (event) => {
        setApiConfigurationField(field, transform(event));
    }, [setApiConfigurationField]);
    return (_jsxs(_Fragment, { children: [_jsxs("div", { children: [_jsx("label", { className: "block font-medium mb-1", children: t("settings:providers.minimaxBaseUrl") }), _jsxs(VSCodeDropdown, { value: apiConfiguration.minimaxBaseUrl, onChange: handleInputChange("minimaxBaseUrl"), className: cn("w-full"), children: [_jsx(VSCodeOption, { value: "https://api.minimax.io/v1", className: "p-2", children: "api.minimax.io" }), _jsx(VSCodeOption, { value: "https://api.minimaxi.com/v1", className: "p-2", children: "api.minimaxi.com" })] })] }), _jsxs("div", { children: [_jsx(VSCodeTextField, { value: apiConfiguration?.minimaxApiKey || "", type: "password", onInput: handleInputChange("minimaxApiKey"), placeholder: t("settings:placeholders.apiKey"), className: "w-full", children: _jsx("label", { className: "block font-medium mb-1", children: t("settings:providers.minimaxApiKey") }) }), _jsx("div", { className: "text-sm text-vscode-descriptionForeground", children: t("settings:providers.apiKeyStorageNotice") }), !apiConfiguration?.minimaxApiKey && (_jsx(VSCodeButtonLink, { href: apiConfiguration.minimaxBaseUrl === "https://api.minimaxi.com/v1"
                            ? "https://platform.minimaxi.com/user-center/basic-information/interface-key"
                            : "https://www.minimax.io/platform/user-center/basic-information/interface-key", appearance: "secondary", children: t("settings:providers.getMiniMaxApiKey") }))] })] }));
};
//# sourceMappingURL=MiniMax.js.map