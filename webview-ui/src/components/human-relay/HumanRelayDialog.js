import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime"
import * as React from "react"
import { Button } from "../ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog"
import { Textarea } from "../ui/textarea"
import { useClipboard } from "../ui/hooks"
import { Check, Copy, X } from "lucide-react"
import { useAppTranslation } from "@/i18n/TranslationContext"
/**
 * Human Relay Dialog Component
 * Displays the prompt text that needs to be copied and provides an input box for the user to paste the AI's response.
 */
export const HumanRelayDialog = ({ isOpen, onClose, requestId, promptText, onSubmit, onCancel }) => {
	const { t } = useAppTranslation()
	const [response, setResponse] = React.useState("")
	const { copy } = useClipboard()
	const [isCopyClicked, setIsCopyClicked] = React.useState(false)
	// Clear input when dialog opens
	React.useEffect(() => {
		if (isOpen) {
			setResponse("")
			setIsCopyClicked(false)
		}
	}, [isOpen])
	// Copy to clipboard and show success message
	const handleCopy = () => {
		copy(promptText)
		setIsCopyClicked(true)
		setTimeout(() => {
			setIsCopyClicked(false)
		}, 2000)
	}
	// Submit response
	const handleSubmit = (e) => {
		e.preventDefault()
		if (response.trim()) {
			onSubmit(requestId, response)
			onClose()
		}
	}
	// Cancel operation
	const handleCancel = () => {
		onCancel(requestId)
		onClose()
	}
	return _jsx(Dialog, {
		open: isOpen,
		onOpenChange: (open) => !open && handleCancel(),
		children: _jsxs(DialogContent, {
			className: "sm:max-w-[600px] overflow-y-auto max-h-[80vh]",
			children: [
				_jsxs(DialogHeader, {
					children: [
						_jsx(DialogTitle, { children: t("humanRelay:dialogTitle") }),
						_jsx(DialogDescription, { children: t("humanRelay:dialogDescription") }),
					],
				}),
				_jsxs("div", {
					className: "grid gap-6 py-6",
					children: [
						_jsxs("div", {
							className: "relative",
							children: [
								_jsx(Textarea, {
									className: "min-h-[200px] font-mono text-sm p-4 pr-12 whitespace-pre-wrap",
									value: promptText,
									readOnly: true,
								}),
								_jsx(Button, {
									variant: "ghost",
									size: "icon",
									className: "absolute top-2 right-2",
									onClick: handleCopy,
									children: isCopyClicked
										? _jsx(Check, { className: "h-4 w-4" })
										: _jsx(Copy, { className: "h-4 w-4" }),
								}),
							],
						}),
						isCopyClicked &&
							_jsx("div", {
								className: "text-sm text-emerald-500 font-medium",
								children: t("humanRelay:copiedToClipboard"),
							}),
						_jsxs("div", {
							children: [
								_jsx("div", {
									className: "mb-2 font-medium",
									children: t("humanRelay:aiResponse.label"),
								}),
								_jsx(Textarea, {
									placeholder: t("humanRelay:aiResponse.placeholder"),
									value: response,
									onChange: (e) => setResponse(e.target.value),
									className: "min-h-[150px]",
								}),
							],
						}),
					],
				}),
				_jsxs(DialogFooter, {
					children: [
						_jsxs(Button, {
							variant: "outline",
							onClick: handleCancel,
							className: "gap-1",
							children: [_jsx(X, { className: "h-4 w-4" }), t("humanRelay:actions.cancel")],
						}),
						_jsxs(Button, {
							onClick: handleSubmit,
							disabled: !response.trim(),
							className: "gap-1",
							children: [_jsx(Check, { className: "h-4 w-4" }), t("humanRelay:actions.submit")],
						}),
					],
				}),
			],
		}),
	})
}
//# sourceMappingURL=HumanRelayDialog.js.map
