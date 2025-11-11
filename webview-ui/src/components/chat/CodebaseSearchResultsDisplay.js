import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import CodebaseSearchResult from "./CodebaseSearchResult";
import { Trans } from "react-i18next";
const CodebaseSearchResultsDisplay = ({ results }) => {
    const [codebaseSearchResultsExpanded, setCodebaseSearchResultsExpanded] = useState(false);
    return (_jsxs("div", { className: "flex flex-col -mt-4 gap-1", children: [_jsxs("div", { onClick: () => setCodebaseSearchResultsExpanded(!codebaseSearchResultsExpanded), className: "cursor-pointer flex items-center justify-between px-2 py-2 border bg-[var(--vscode-editor-background)] border-[var(--vscode-editorGroup-border)]", children: [_jsx("span", { children: _jsx(Trans, { i18nKey: "chat:codebaseSearch.didSearch", count: results.length, values: { count: results.length } }) }), _jsx("span", { className: `codicon codicon-chevron-${codebaseSearchResultsExpanded ? "up" : "down"}` })] }), codebaseSearchResultsExpanded && (_jsx("div", { className: "flex flex-col gap-1", children: results.map((result, idx) => (_jsx(CodebaseSearchResult, { filePath: result.filePath, score: result.score, startLine: result.startLine, endLine: result.endLine, language: "plaintext", snippet: result.codeChunk }, idx))) }))] }));
};
export default CodebaseSearchResultsDisplay;
//# sourceMappingURL=CodebaseSearchResultsDisplay.js.map