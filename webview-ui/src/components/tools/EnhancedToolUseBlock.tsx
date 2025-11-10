import React, { memo } from "react"
import { useAppTranslation } from "@src/i18n/TranslationContext"
import { cn } from "@src/lib/utils"
import type { RetryState } from "@src/types/retry"

import { ToolUseBlock, ToolUseBlockHeader } from "../common/ToolUseBlock"
import { RetryStatus } from "./RetryStatus"

interface EnhancedToolUseBlockProps {
	/** Tool use block content */
	children: React.ReactNode
	/** Current retry state */
	retryState?: RetryState
	/** Whether to show retry status */
	showRetryStatus?: boolean
	/** Custom className */
	className?: string
}

/**
 * Enhanced tool use block that includes retry status and controls
 */
export const EnhancedToolUseBlock = memo<EnhancedToolUseBlockProps>(
	({ children, retryState, showRetryStatus = false, className }) => {
		const { t } = useAppTranslation()
		// Mark as used to avoid ESLint warning
		const _t = t

		return (
			<div className={cn("border border-vscode-panel-border rounded-md p-2", className)}>
				{/* Tool Use Block Header */}
				<ToolUseBlockHeader className="mb-3" />

				{/* Retry Status */}
				{showRetryStatus && retryState && (
					<RetryStatus retryState={retryState} showDetails={true} className="mb-4" />
				)}

				{/* Tool Content */}
				<ToolUseBlock>{children}</ToolUseBlock>
			</div>
		)
	},
)

EnhancedToolUseBlock.displayName = "EnhancedToolUseBlock"
