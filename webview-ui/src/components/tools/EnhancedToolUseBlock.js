import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { memo } from "react";
import { useAppTranslation } from "@src/i18n/TranslationContext";
import { cn } from "@src/lib/utils";
import { ToolUseBlock, ToolUseBlockHeader } from "../common/ToolUseBlock";
import { RetryStatus } from "./RetryStatus";
/**
 * Enhanced tool use block that includes retry status and controls
 */
export const EnhancedToolUseBlock = memo(({ children, retryState, showRetryStatus = false, className }) => {
    const { t } = useAppTranslation();
    // Mark as used to avoid ESLint warning
    const _t = t;
    return (_jsxs("div", { className: cn("border border-vscode-panel-border rounded-md p-2", className), children: [_jsx(ToolUseBlockHeader, { className: "mb-3" }), showRetryStatus && retryState && (_jsx(RetryStatus, { retryState: retryState, showDetails: true, className: "mb-4" })), _jsx(ToolUseBlock, { children: children })] }));
});
EnhancedToolUseBlock.displayName = "EnhancedToolUseBlock";
//# sourceMappingURL=EnhancedToolUseBlock.js.map