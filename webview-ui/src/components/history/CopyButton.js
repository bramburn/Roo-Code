import { jsx as _jsx } from "react/jsx-runtime"
import { useCallback } from "react"
import { useClipboard } from "@/components/ui/hooks"
import { Button, StandardTooltip } from "@/components/ui"
import { useAppTranslation } from "@/i18n/TranslationContext"
import { cn } from "@/lib/utils"
export const CopyButton = ({ itemTask }) => {
	const { isCopied, copy } = useClipboard()
	const { t } = useAppTranslation()
	const onCopy = useCallback(
		(e) => {
			e.stopPropagation()
			if (!isCopied) {
				copy(itemTask)
			}
		},
		[isCopied, copy, itemTask],
	)
	return _jsx(StandardTooltip, {
		content: t("history:copyPrompt"),
		children: _jsx(Button, {
			variant: "ghost",
			size: "icon",
			onClick: onCopy,
			className: "group-hover:opacity-100 opacity-50 transition-opacity",
			"data-testid": "copy-prompt-button",
			children: _jsx("span", {
				className: cn("codicon scale-80", { "codicon-check": isCopied, "codicon-copy": !isCopied }),
			}),
		}),
	})
}
//# sourceMappingURL=CopyButton.js.map
