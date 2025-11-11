import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, Button } from "@/components/ui";
import RooHero from "../welcome/RooHero";
import { CircleDollarSign, FileStack, Router, Share } from "lucide-react";
import { DialogTitle } from "@radix-ui/react-dialog";
// Reusable method to render cloud benefits content
export const renderCloudBenefitsContent = (t) => {
    return (_jsxs("div", { className: "text-left cursor-default", children: [_jsx("div", { className: "w-15", children: _jsx(RooHero, {}) }), _jsx("h1", { className: "text-xl font-bold text-vscode-foreground", children: t("cloud:cloudBenefitsTitle") }), _jsx("div", { className: "text-lg", children: _jsxs("ul", { className: "text-vscode-descriptionForeground space-y-4 my-8", children: [_jsxs("li", { className: "flex items-start gap-2", children: [_jsx(Router, { className: "size-4 mt-0.5 shrink-0" }), t("cloud:cloudBenefitWalkaway")] }), _jsxs("li", { className: "flex items-start gap-2", children: [_jsx(Share, { className: "size-4 mt-0.5 shrink-0" }), t("cloud:cloudBenefitSharing")] }), _jsxs("li", { className: "flex items-start gap-2", children: [_jsx(CircleDollarSign, { className: "size-4 mt-0.5 shrink-0" }), t("cloud:cloudBenefitMetrics")] }), _jsxs("li", { className: "flex items-start gap-2", children: [_jsx(FileStack, { className: "size-4 mt-0.5 shrink-0" }), t("cloud:cloudBenefitHistory")] })] }) })] }));
};
export const CloudUpsellDialog = ({ open, onOpenChange, onConnect }) => {
    const { t } = useTranslation();
    return (_jsx(Dialog, { open: open, onOpenChange: onOpenChange, children: _jsxs(DialogContent, { className: "max-w-sm", children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, {}) }), _jsxs("div", { className: "text-left space-y-6", children: [renderCloudBenefitsContent(t), _jsx("div", { className: "flex flex-col gap-4", children: _jsx(Button, { onClick: onConnect, className: "w-full", children: t("cloud:connect") }) })] })] }) }));
};
//# sourceMappingURL=CloudUpsellDialog.js.map