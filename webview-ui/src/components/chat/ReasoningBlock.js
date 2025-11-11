import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useExtensionState } from "@src/context/ExtensionStateContext";
import MarkdownBlock from "../common/MarkdownBlock";
import { Lightbulb, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
export const ReasoningBlock = ({ content, isStreaming, isLast }) => {
    const { t } = useTranslation();
    const { reasoningBlockCollapsed } = useExtensionState();
    const [isCollapsed, setIsCollapsed] = useState(reasoningBlockCollapsed);
    const startTimeRef = useRef(Date.now());
    const [elapsed, setElapsed] = useState(0);
    const contentRef = useRef(null);
    useEffect(() => {
        setIsCollapsed(reasoningBlockCollapsed);
    }, [reasoningBlockCollapsed]);
    useEffect(() => {
        if (isLast && isStreaming) {
            const tick = () => setElapsed(Date.now() - startTimeRef.current);
            tick();
            const id = setInterval(tick, 1000);
            return () => clearInterval(id);
        }
    }, [isLast, isStreaming]);
    const seconds = Math.floor(elapsed / 1000);
    const secondsLabel = t("chat:reasoning.seconds", { count: seconds });
    const handleToggle = () => {
        setIsCollapsed(!isCollapsed);
    };
    return (_jsxs("div", { className: "group", children: [_jsxs("div", { className: "flex items-center justify-between mb-2.5 pr-2 cursor-pointer select-none", onClick: handleToggle, children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Lightbulb, { className: "w-4" }), _jsx("span", { className: "font-bold text-vscode-foreground", children: t("chat:reasoning.thinking") }), elapsed > 0 && (_jsx("span", { className: "text-sm text-vscode-descriptionForeground mt-0.5", children: secondsLabel }))] }), _jsx("div", { className: "flex items-center gap-2", children: _jsx(ChevronUp, { className: cn("w-4 transition-all opacity-0 group-hover:opacity-100", isCollapsed && "-rotate-180") }) })] }), (content?.trim()?.length ?? 0) > 0 && !isCollapsed && (_jsx("div", { ref: contentRef, className: "border-l border-vscode-descriptionForeground/20 ml-2 pl-4 pb-1 text-vscode-descriptionForeground", children: _jsx(MarkdownBlock, { markdown: content }) }))] }));
};
//# sourceMappingURL=ReasoningBlock.js.map