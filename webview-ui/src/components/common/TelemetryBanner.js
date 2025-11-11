import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { memo, useState } from "react";
import { Trans } from "react-i18next";
import { VSCodeLink } from "@vscode/webview-ui-toolkit/react";
import { vscode } from "@src/utils/vscode";
import { useAppTranslation } from "@src/i18n/TranslationContext";
const TelemetryBanner = () => {
    const { t } = useAppTranslation();
    const [isDismissed, setIsDismissed] = useState(false);
    const handleClose = () => {
        setIsDismissed(true);
        vscode.postMessage({ type: "telemetrySetting", text: "enabled" });
    };
    const handleOpenSettings = () => {
        window.postMessage({
            type: "action",
            action: "settingsButtonClicked",
            values: { section: "about" },
        });
    };
    if (isDismissed) {
        return null;
    }
    return (_jsxs("div", { className: "relative px-4 py-2.5 pr-10 bg-vscode-banner-background border-b border-vscode-panel-border text-sm leading-normal text-vscode-foreground", children: [_jsx("button", { onClick: handleClose, className: "absolute top-1.5 right-2 bg-transparent border-none text-vscode-foreground cursor-pointer text-2xl p-1 opacity-70 hover:opacity-100 transition-opacity duration-200 leading-none", "aria-label": "Close", children: "\u00D7" }), _jsx("div", { className: "mb-0.5 font-bold", children: t("welcome:telemetry.helpImprove") }), _jsx("div", { children: _jsx(Trans, { i18nKey: "welcome:telemetry.helpImproveMessage", components: {
                        settingsLink: _jsx(VSCodeLink, { href: "#", onClick: handleOpenSettings }),
                    } }) })] }));
};
export default memo(TelemetryBanner);
//# sourceMappingURL=TelemetryBanner.js.map