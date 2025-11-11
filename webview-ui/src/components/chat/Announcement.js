import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, memo } from "react";
import { Trans } from "react-i18next";
import { VSCodeLink } from "@vscode/webview-ui-toolkit/react";
import { Package } from "@roo/package";
import { useAppTranslation } from "@src/i18n/TranslationContext";
import { vscode } from "@src/utils/vscode";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@src/components/ui";
import { Button } from "@src/components/ui";
/**
 * You must update the `latestAnnouncementId` in ClineProvider for new
 * announcements to show to users. This new id will be compared with what's in
 * state for the 'last announcement shown', and if it's different then the
 * announcement will render. As soon as an announcement is shown, the id will be
 * updated in state. This ensures that announcements are not shown more than
 * once, even if the user doesn't close it themselves.
 */
const Announcement = ({ hideAnnouncement }) => {
    const { t } = useAppTranslation();
    const [open, setOpen] = useState(true);
    return (_jsx(Dialog, { open: open, onOpenChange: (open) => {
            setOpen(open);
            if (!open) {
                hideAnnouncement();
            }
        }, children: _jsxs(DialogContent, { className: "max-w-96", children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: t("chat:announcement.title", { version: Package.version }) }) }), _jsxs("div", { children: [_jsxs("div", { className: "mb-4", children: [_jsx("p", { className: "mb-3", children: t("chat:announcement.release.heading") }), _jsxs("ul", { className: "list-disc list-inside text-sm space-y-1", children: [_jsx("li", { children: t("chat:announcement.release.openRouterEmbeddings") }), _jsx("li", { children: t("chat:announcement.release.chutesDynamic") }), _jsx("li", { children: t("chat:announcement.release.queuedMessagesFix") })] })] }), _jsx("hr", { className: "my-4 border-vscode-widget-border" }), _jsxs("div", { children: [_jsx("p", { className: "mb-3", children: t("chat:announcement.cloudAgents.heading") }), _jsx("div", { className: "mb-3", children: _jsx(Trans, { i18nKey: "chat:announcement.cloudAgents.prFixer", components: {
                                            bold: _jsx("b", {}),
                                        } }) }), _jsx("p", { className: "mb-3 text-sm text-vscode-descriptionForeground", children: t("chat:announcement.cloudAgents.prFixerDescription") }), _jsx("div", { className: "mt-4", children: _jsx(Button, { onClick: () => {
                                            vscode.postMessage({
                                                type: "openExternal",
                                                url: "https://roocode.com/pr-fixer?utm_source=roocode&utm_medium=extension&utm_campaign=announcement",
                                            });
                                            setOpen(false);
                                            hideAnnouncement();
                                        }, className: "w-full", children: t("chat:announcement.cloudAgents.tryPrFixerButton") }) })] }), _jsx("div", { className: "mt-4 text-sm text-center", children: _jsx(Trans, { i18nKey: "chat:announcement.socialLinks", components: {
                                    xLink: _jsx(XLink, {}),
                                    discordLink: _jsx(DiscordLink, {}),
                                    redditLink: _jsx(RedditLink, {}),
                                } }) }), _jsx("div", { className: "mt-2 text-sm text-center", children: _jsx(Trans, { i18nKey: "chat:announcement.careers", components: {
                                    careersLink: _jsx(CareersLink, {}),
                                } }) })] })] }) }));
};
const XLink = () => (_jsx(VSCodeLink, { href: "https://x.com/roocode", onClick: (e) => {
        e.preventDefault();
        vscode.postMessage({ type: "openExternal", url: "https://x.com/roocode" });
    }, children: "X" }));
const DiscordLink = () => (_jsx(VSCodeLink, { href: "https://discord.gg/rCQcvT7Fnt", onClick: (e) => {
        e.preventDefault();
        vscode.postMessage({ type: "openExternal", url: "https://discord.gg/rCQcvT7Fnt" });
    }, children: "Discord" }));
const RedditLink = () => (_jsx(VSCodeLink, { href: "https://www.reddit.com/r/RooCode/", onClick: (e) => {
        e.preventDefault();
        vscode.postMessage({ type: "openExternal", url: "https://www.reddit.com/r/RooCode/" });
    }, children: "r/RooCode" }));
const CareersLink = ({ children }) => (_jsx(VSCodeLink, { href: "https://careers.roocode.com", onClick: (e) => {
        e.preventDefault();
        vscode.postMessage({ type: "openExternal", url: "https://careers.roocode.com" });
    }, children: children }));
export default memo(Announcement);
//# sourceMappingURL=Announcement.js.map