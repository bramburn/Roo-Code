import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { VSCodeLink } from "@vscode/webview-ui-toolkit/react";
import { memo, useEffect, useRef, useState } from "react";
import { useRemark } from "react-remark";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleTrigger } from "@/components/ui";
import { StyledMarkdown } from "./styles";
export const ModelDescriptionMarkdown = memo(({ markdown = "", key, isExpanded, setIsExpanded, }) => {
    const [content, setContent] = useRemark();
    const [isExpandable, setIsExpandable] = useState(false);
    const textContainerRef = useRef(null);
    const textRef = useRef(null);
    useEffect(() => setContent(markdown), [markdown, setContent]);
    useEffect(() => {
        if (textRef.current && textContainerRef.current) {
            setIsExpandable(textRef.current.scrollHeight > textContainerRef.current.clientHeight);
        }
    }, [content]);
    return (_jsxs(Collapsible, { open: isExpanded, onOpenChange: setIsExpanded, className: "relative", children: [_jsx("div", { ref: textContainerRef, className: cn({ "line-clamp-4": !isExpanded }), children: _jsx("div", { ref: textRef, children: _jsx(StyledMarkdown, { children: content }, key) }) }), _jsx(CollapsibleTrigger, { asChild: true, className: cn({ hidden: !isExpandable }), children: _jsx(VSCodeLink, { className: "text-sm", children: isExpanded ? "Less" : "More" }) })] }));
});
//# sourceMappingURL=ModelDescriptionMarkdown.js.map