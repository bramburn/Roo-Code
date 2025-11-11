import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback } from "react";
import { Slider } from "@/components/ui";
import { useAppTranslation } from "@/i18n/TranslationContext";
import { DEFAULT_CONSECUTIVE_MISTAKE_LIMIT } from "@roo-code/types";
export const ConsecutiveMistakeLimitControl = ({ value, onChange }) => {
    const { t } = useAppTranslation();
    const handleValueChange = useCallback((newValue) => {
        // Ensure value is not negative
        const validValue = Math.max(0, newValue);
        onChange(validValue);
    }, [onChange]);
    return (_jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { className: "block font-medium mb-1", children: t("settings:providers.consecutiveMistakeLimit.label") }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Slider, { value: [value ?? DEFAULT_CONSECUTIVE_MISTAKE_LIMIT], min: 0, max: 10, step: 1, onValueChange: (newValue) => handleValueChange(newValue[0]) }), _jsx("span", { className: "w-10", children: Math.max(0, value ?? DEFAULT_CONSECUTIVE_MISTAKE_LIMIT) })] }), _jsx("div", { className: "text-sm text-vscode-descriptionForeground", children: value === 0
                    ? t("settings:providers.consecutiveMistakeLimit.unlimitedDescription")
                    : t("settings:providers.consecutiveMistakeLimit.description", {
                        value: value ?? DEFAULT_CONSECUTIVE_MISTAKE_LIMIT,
                    }) }), value === 0 && (_jsx("div", { className: "text-sm text-vscode-errorForeground mt-1", children: t("settings:providers.consecutiveMistakeLimit.warning") }))] }));
};
//# sourceMappingURL=ConsecutiveMistakeLimitControl.js.map