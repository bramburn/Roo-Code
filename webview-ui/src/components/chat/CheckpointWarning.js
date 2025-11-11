import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { VSCodeLink } from "@vscode/webview-ui-toolkit/react";
import { Trans } from "react-i18next";
export const CheckpointWarning = ({ warning }) => {
    const settingsLink = (_jsx(VSCodeLink, { href: "#", onClick: (e) => {
            e.preventDefault();
            window.postMessage({
                type: "action",
                action: "settingsButtonClicked",
                values: { section: "checkpoints" },
            }, "*");
        }, className: "inline" }));
    // Map warning type to i18n key
    const i18nKey = warning.type === "WAIT_TIMEOUT" ? "errors.wait_checkpoint_long_time" : "errors.init_checkpoint_fail_long_time";
    return (_jsxs("div", { className: "flex items-center p-3 my-3 bg-vscode-inputValidation-warningBackground border border-vscode-inputValidation-warningBorder rounded", children: [_jsx("span", { className: "codicon codicon-loading codicon-modifier-spin mr-2" }), _jsx("span", { className: "text-vscode-foreground", children: _jsx(Trans, { i18nKey: i18nKey, ns: "common", values: { timeout: warning.timeout }, components: { settingsLink } }) })] }));
};
//# sourceMappingURL=CheckpointWarning.js.map