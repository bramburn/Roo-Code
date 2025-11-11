import React, { forwardRef } from "react"
import { cn } from "@/lib/utils"

export const ToolUseBlock = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
	({ className, ...props }, ref) => (
		<div
			ref={ref}
			className={cn("overflow-hidden rounded-md p-2 cursor-pointer bg-vscode-editor-background", className)}
			{...props}
		/>
	),
)
ToolUseBlock.displayName = "ToolUseBlock"

export const ToolUseBlockHeader = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
	({ className, ...props }, ref) => (
		<div
			ref={ref}
			className={cn(
				"flex font-mono items-center select-none text-sm text-vscode-descriptionForeground",
				className,
			)}
			{...props}
		/>
	),
)
ToolUseBlockHeader.displayName = "ToolUseBlockHeader"
