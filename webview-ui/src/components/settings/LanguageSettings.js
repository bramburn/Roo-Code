import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useAppTranslation } from "@/i18n/TranslationContext";
import { Globe } from "lucide-react";
import { LANGUAGES } from "@roo/language";
import { cn } from "@src/lib/utils";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@src/components/ui";
import { SectionHeader } from "./SectionHeader";
import { Section } from "./Section";
export const LanguageSettings = ({ language, setCachedStateField, className, ...props }) => {
    const { t } = useAppTranslation();
    return (_jsxs("div", { className: cn("flex flex-col gap-2", className), ...props, children: [_jsx(SectionHeader, { children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Globe, { className: "w-4" }), _jsx("div", { children: t("settings:sections.language") })] }) }), _jsx(Section, { children: _jsxs(Select, { value: language, onValueChange: (value) => setCachedStateField("language", value), children: [_jsx(SelectTrigger, { className: "w-full", children: _jsx(SelectValue, { placeholder: t("settings:common.select") }) }), _jsx(SelectContent, { children: _jsx(SelectGroup, { children: Object.entries(LANGUAGES).map(([code, name]) => (_jsxs(SelectItem, { value: code, children: [name, _jsxs("span", { className: "text-muted-foreground", children: ["(", code, ")"] })] }, code))) }) })] }) })] }));
};
//# sourceMappingURL=LanguageSettings.js.map