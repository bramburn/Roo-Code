import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { memo } from "react";
import { ToolUseBlock, ToolUseBlockHeader } from "../common/ToolUseBlock";
import { vscode } from "@src/utils/vscode";
import { removeLeadingNonAlphanumeric } from "@src/utils/removeLeadingNonAlphanumeric";
export const BatchFilePermission = memo(({ files = [], onPermissionResponse, ts }) => {
    // Don't render if there are no files or no response handler
    if (!files?.length || !onPermissionResponse) {
        return null;
    }
    return (_jsx("div", { className: "pt-[5px]", children: _jsx("div", { className: "flex flex-col gap-0 border border-border rounded-md p-1", children: files.map((file) => {
                return (_jsx("div", { className: "flex items-center gap-2", children: _jsx(ToolUseBlock, { className: "flex-1", children: _jsxs(ToolUseBlockHeader, { onClick: () => vscode.postMessage({ type: "openFile", text: file.content }), children: [file.path?.startsWith(".") && _jsx("span", { children: "." }), _jsxs("span", { className: "whitespace-nowrap overflow-hidden text-ellipsis text-left mr-2 rtl", children: [removeLeadingNonAlphanumeric(file.path ?? "") + "\u200E", file.lineSnippet && ` ${file.lineSnippet}`] }), _jsx("div", { className: "flex-grow" }), _jsx("span", { className: "codicon codicon-link-external text-[13.5px] my-[1px]" })] }) }) }, `${file.path}-${ts}`));
            }) }) }));
});
BatchFilePermission.displayName = "BatchFilePermission";
//# sourceMappingURL=BatchFilePermission.js.map