import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { VSCodeCheckbox } from "@vscode/webview-ui-toolkit/react";
import { useAppTranslation } from "@/i18n/TranslationContext";
export const ExperimentalFeature = ({ enabled, onChange, experimentKey }) => {
    const { t } = useAppTranslation();
    // Generate translation keys based on experiment key
    const nameKey = experimentKey ? `settings:experimental.${experimentKey}.name` : "";
    const descriptionKey = experimentKey ? `settings:experimental.${experimentKey}.description` : "";
    return (_jsxs("div", { children: [_jsx("div", { className: "flex items-center gap-2", children: _jsx(VSCodeCheckbox, { checked: enabled, onChange: (e) => onChange(e.target.checked), children: _jsx("span", { className: "font-medium", children: t(nameKey) }) }) }), _jsx("p", { className: "text-vscode-descriptionForeground text-sm mt-0", children: t(descriptionKey) })] }));
};
//# sourceMappingURL=ExperimentalFeature.js.map