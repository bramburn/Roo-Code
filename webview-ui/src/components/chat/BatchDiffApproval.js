import { jsx as _jsx } from "react/jsx-runtime";
import { memo, useState } from "react";
import CodeAccordian from "../common/CodeAccordian";
export const BatchDiffApproval = memo(({ files = [], ts }) => {
    const [expandedFiles, setExpandedFiles] = useState({});
    if (!files?.length) {
        return null;
    }
    const handleToggleExpand = (filePath) => {
        setExpandedFiles((prev) => ({
            ...prev,
            [filePath]: !prev[filePath],
        }));
    };
    return (_jsx("div", { className: "pt-[5px]", children: _jsx("div", { className: "flex flex-col gap-0 border border-border rounded-md p-1", children: files.map((file) => {
                // Combine all diffs into a single diff string for this file
                const combinedDiff = file.diffs?.map((diff) => diff.content).join("\n\n") || file.content;
                return (_jsx("div", { children: _jsx(CodeAccordian, { path: file.path, code: combinedDiff, language: "diff", isExpanded: expandedFiles[file.path] || false, onToggleExpand: () => handleToggleExpand(file.path) }) }, `${file.path}-${ts}`));
            }) }) }));
});
BatchDiffApproval.displayName = "BatchDiffApproval";
//# sourceMappingURL=BatchDiffApproval.js.map