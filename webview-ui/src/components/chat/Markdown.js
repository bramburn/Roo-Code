import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { memo, useState } from "react";
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react";
import { useCopyToClipboard } from "@src/utils/clipboard";
import { StandardTooltip } from "@src/components/ui";
import MarkdownBlock from "../common/MarkdownBlock";
export const Markdown = memo(({ markdown, partial }) => {
    const [isHovering, setIsHovering] = useState(false);
    // Shorter feedback duration for copy button flash.
    const { copyWithFeedback } = useCopyToClipboard(200);
    if (!markdown || markdown.length === 0) {
        return null;
    }
    return (_jsxs("div", { onMouseEnter: () => setIsHovering(true), onMouseLeave: () => setIsHovering(false), style: { position: "relative" }, children: [_jsx("div", { style: { wordBreak: "break-word", overflowWrap: "anywhere" }, children: _jsx(MarkdownBlock, { markdown: markdown }) }), markdown && !partial && isHovering && (_jsxs("div", { style: {
                    position: "absolute",
                    bottom: "-4px",
                    right: "8px",
                    opacity: 0,
                    animation: "fadeIn 0.2s ease-in-out forwards",
                    borderRadius: "4px",
                }, children: [_jsx("style", { children: `@keyframes fadeIn { from { opacity: 0; } to { opacity: 1.0; } }` }), _jsx(StandardTooltip, { content: "Copy as markdown", children: _jsx(VSCodeButton, { className: "copy-button", appearance: "icon", style: {
                                height: "24px",
                                border: "none",
                                background: "var(--vscode-editor-background)",
                                transition: "background 0.2s ease-in-out",
                            }, onClick: async () => {
                                const success = await copyWithFeedback(markdown);
                                if (success) {
                                    const button = document.activeElement;
                                    if (button) {
                                        button.style.background = "var(--vscode-button-background)";
                                        setTimeout(() => {
                                            button.style.background = "";
                                        }, 200);
                                    }
                                }
                            }, children: _jsx("span", { className: "codicon codicon-copy" }) }) })] }))] }));
});
//# sourceMappingURL=Markdown.js.map