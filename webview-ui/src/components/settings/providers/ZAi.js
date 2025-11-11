import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback } from "react";
import { VSCodeTextField, VSCodeDropdown, VSCodeOption } from "@vscode/webview-ui-toolkit/react";
import { zaiApiLineConfigs, zaiApiLineSchema } from "@roo-code/types";
import { useAppTranslation } from "@src/i18n/TranslationContext";
import { VSCodeButtonLink } from "@src/components/common/VSCodeButtonLink";
import { inputEventTransform } from "../transforms";
import { cn } from "@/lib/utils";
export const ZAi = ({ apiConfiguration, setApiConfigurationField }) => {
    const { t } = useAppTranslation();
    const handleInputChange = useCallback((field, transform = inputEventTransform) => (event) => {
        setApiConfigurationField(field, transform(event));
    }, [setApiConfigurationField]);
    return (_jsxs(_Fragment, { children: [_jsxs("div", { children: [_jsx("label", { className: "block font-medium mb-1", children: t("settings:providers.zaiEntrypoint") }), _jsx(VSCodeDropdown, { value: apiConfiguration.zaiApiLine || zaiApiLineSchema.enum.international_coding, onChange: handleInputChange("zaiApiLine"), className: cn("w-full"), children: zaiApiLineSchema.options.map((zaiApiLine) => {
                            const config = zaiApiLineConfigs[zaiApiLine];
                            return (_jsxs(VSCodeOption, { value: zaiApiLine, className: "p-2", children: [config.name, " (", config.baseUrl, ")"] }, zaiApiLine));
                        }) }), _jsx("div", { className: "text-xs text-vscode-descriptionForeground mt-1", children: t("settings:providers.zaiEntrypointDescription") })] }), _jsxs("div", { children: [_jsx(VSCodeTextField, { value: apiConfiguration?.zaiApiKey || "", type: "password", onInput: handleInputChange("zaiApiKey"), placeholder: t("settings:placeholders.apiKey"), className: "w-full", children: _jsx("label", { className: "block font-medium mb-1", children: t("settings:providers.zaiApiKey") }) }), _jsx("div", { className: "text-sm text-vscode-descriptionForeground", children: t("settings:providers.apiKeyStorageNotice") }), !apiConfiguration?.zaiApiKey && (_jsx(VSCodeButtonLink, { href: zaiApiLineConfigs[apiConfiguration.zaiApiLine ?? "international_coding"].isChina
                            ? "https://open.bigmodel.cn/console/overview"
                            : "https://z.ai/manage-apikey/apikey-list", appearance: "secondary", children: t("settings:providers.getZaiApiKey") }))] })] }));
};
//# sourceMappingURL=ZAi.js.map