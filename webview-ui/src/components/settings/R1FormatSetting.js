import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Checkbox } from "vscrui";
import { useAppTranslation } from "@/i18n/TranslationContext";
export const R1FormatSetting = ({ onChange, openAiR1FormatEnabled }) => {
    const { t } = useAppTranslation();
    return (_jsxs("div", { children: [_jsx("div", { className: "flex items-center gap-2", children: _jsx(Checkbox, { checked: openAiR1FormatEnabled, onChange: onChange, children: _jsx("span", { className: "font-medium", children: t("settings:modelInfo.enableR1Format") }) }) }), _jsx("p", { className: "text-vscode-descriptionForeground text-sm mt-0", children: t("settings:modelInfo.enableR1FormatTips") })] }));
};
//# sourceMappingURL=R1FormatSetting.js.map