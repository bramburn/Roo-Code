import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useTranslation } from "react-i18next";
import { vscode } from "@src/utils/vscode";
import { StandardTooltip } from "@/components/ui";
const CodebaseSearchResult = ({ filePath, score, startLine, endLine }) => {
    const { t } = useTranslation("chat");
    const handleClick = () => {
        console.log(filePath);
        vscode.postMessage({
            type: "openFile",
            text: "./" + filePath,
            values: {
                line: startLine,
            },
        });
    };
    return (_jsx(StandardTooltip, { content: t("codebaseSearch.resultTooltip", { score: score.toFixed(3) }), children: _jsx("div", { onClick: handleClick, className: "p-2 border border-[var(--vscode-editorGroup-border)] cursor-pointer hover:bg-secondary hover:text-white", children: _jsxs("div", { className: "flex gap-2 items-center overflow-hidden", children: [_jsxs("span", { className: "text-primary-300 whitespace-nowrap flex-shrink-0", children: [filePath.split("/").at(-1), ":", startLine === endLine ? startLine : `${startLine}-${endLine}`] }), _jsx("span", { className: "text-gray-500 truncate min-w-0 flex-1", children: filePath.split("/").slice(0, -1).join("/") }), _jsx("span", { className: "text-xs text-vscode-descriptionForeground whitespace-nowrap ml-auto opacity-60", children: score.toFixed(3) })] }) }) }));
};
export default CodebaseSearchResult;
//# sourceMappingURL=CodebaseSearchResult.js.map