import { jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from "react-i18next";
import { Package } from "@roo/package";
const VersionIndicator = ({ onClick, className = "" }) => {
    const { t } = useTranslation();
    return (_jsxs("button", { onClick: onClick, className: `text-xs text-vscode-descriptionForeground hover:text-vscode-foreground transition-colors cursor-pointer px-2 py-1 rounded border ${className}`, "aria-label": t("chat:versionIndicator.ariaLabel", { version: Package.version }), children: ["v", Package.version] }));
};
export default VersionIndicator;
//# sourceMappingURL=VersionIndicator.js.map