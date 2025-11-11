import { jsx as _jsx } from "react/jsx-runtime"
import { cn } from "@/lib/utils"
export const ToolUseBlock = ({ className, ...props }) =>
	_jsx("div", {
		className: cn("overflow-hidden rounded-md p-2 cursor-pointer bg-vscode-editor-background", className),
		...props,
	})
export const ToolUseBlockHeader = ({ className, ...props }) =>
	_jsx("div", {
		className: cn("flex font-mono items-center select-none text-sm text-vscode-descriptionForeground", className),
		...props,
	})
//# sourceMappingURL=ToolUseBlock.js.map
