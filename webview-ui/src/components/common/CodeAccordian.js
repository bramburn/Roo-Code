import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { memo, useMemo } from "react";
import { VSCodeProgressRing } from "@vscode/webview-ui-toolkit/react";
import { getLanguageFromPath } from "@src/utils/getLanguageFromPath";
import { removeLeadingNonAlphanumeric } from "@src/utils/removeLeadingNonAlphanumeric";
import { ToolUseBlock, ToolUseBlockHeader } from "./ToolUseBlock";
import CodeBlock from "./CodeBlock";
const CodeAccordian = ({ path, code = "", language, progressStatus, isLoading, isExpanded, isFeedback, onToggleExpand, header, onJumpToFile, }) => {
    const inferredLanguage = useMemo(() => language ?? (path ? getLanguageFromPath(path) : "txt"), [path, language]);
    const source = useMemo(() => code.trim(), [code]);
    const hasHeader = Boolean(path || isFeedback || header);
    return (_jsxs(ToolUseBlock, { children: [hasHeader && (_jsxs(ToolUseBlockHeader, { onClick: onToggleExpand, className: "group", children: [isLoading && _jsx(VSCodeProgressRing, { className: "size-3 mr-2" }), header ? (_jsxs("div", { className: "flex items-center", children: [_jsx("span", { className: "codicon codicon-server mr-1.5" }), _jsx("span", { className: "whitespace-nowrap overflow-hidden text-ellipsis mr-2", children: header })] })) : isFeedback ? (_jsxs("div", { className: "flex items-center", children: [_jsx("span", { className: `codicon codicon-${isFeedback ? "feedback" : "codicon-output"} mr-1.5` }), _jsx("span", { className: "whitespace-nowrap overflow-hidden text-ellipsis mr-2 rtl", children: isFeedback ? "User Edits" : "Console Logs" })] })) : (_jsxs(_Fragment, { children: [path?.startsWith(".") && _jsx("span", { children: "." }), _jsx("span", { className: "whitespace-nowrap overflow-hidden text-ellipsis text-left mr-2 rtl", children: removeLeadingNonAlphanumeric(path ?? "") + "\u200E" })] })), _jsx("div", { className: "flex-grow-1" }), progressStatus && progressStatus.text && (_jsxs(_Fragment, { children: [progressStatus.icon && _jsx("span", { className: `codicon codicon-${progressStatus.icon} mr-1` }), _jsx("span", { className: "mr-1 ml-auto text-vscode-descriptionForeground", children: progressStatus.text })] })), onJumpToFile && path && (_jsx("span", { className: "codicon codicon-link-external mr-1", style: { fontSize: 13.5 }, onClick: (e) => {
                            e.stopPropagation();
                            onJumpToFile();
                        }, "aria-label": `Open file: ${path}` })), !onJumpToFile && (_jsx("span", { className: `opacity-0 group-hover:opacity-100 codicon codicon-chevron-${isExpanded ? "up" : "down"}` }))] })), (!hasHeader || isExpanded) && (_jsx("div", { className: "overflow-x-auto overflow-y-hidden max-w-full", children: _jsx(CodeBlock, { source: source, language: inferredLanguage }) }))] }));
};
export default memo(CodeAccordian);
//# sourceMappingURL=CodeAccordian.js.map