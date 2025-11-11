import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
import { cn } from "@/lib/utils";
const Textarea = React.forwardRef(({ className, ...props }, ref) => {
    return (_jsx("textarea", { className: cn("flex min-h-[60px] w-full rounded-xs px-3 py-2 text-base placeholder:text-muted-foreground focus:outline-0 focus-visible:outline-none focus-visible:border-vscode-focusBorder disabled:cursor-not-allowed disabled:opacity-50", "border border-[var(--vscode-input-border,var(--vscode-input-background))] focus-visible:border-vscode-focusBorder", "bg-vscode-input-background", "text-vscode-input-foreground", className), ref: ref, ...props }));
});
Textarea.displayName = "Textarea";
export { Textarea };
//# sourceMappingURL=textarea.js.map