import { jsx as _jsx } from "react/jsx-runtime"
import { forwardRef } from "react"
import { cn } from "@/lib/utils"
export const ToolUseBlock = forwardRef(({ className, ...props }, ref) =>
	_jsx("div", {
		ref: ref,
		className: cn("overflow-hidden rounded-md p-2 cursor-pointer bg-vscode-editor-background", className),
		...props,
	}),
)
ToolUseBlock.displayName = "ToolUseBlock"
export const ToolUseBlockHeader = forwardRef(({ className, ...props }, ref) =>
	_jsx("div", {
		ref: ref,
		className: cn("flex font-mono items-center select-none text-sm text-vscode-descriptionForeground", className),
		...props,
	}),
)
ToolUseBlockHeader.displayName = "ToolUseBlockHeader"
//# sourceMappingURL=ToolUseBlock.js.map
