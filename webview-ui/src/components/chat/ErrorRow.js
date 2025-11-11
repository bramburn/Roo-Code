import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime"
import { useState, useCallback, memo } from "react"
import { useTranslation } from "react-i18next"
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react"
import { MessageCircleWarning } from "lucide-react"
import { useCopyToClipboard } from "@src/utils/clipboard"
import CodeBlock from "../common/CodeBlock"
/**
 * Unified error display component for all error types in the chat
 */
export const ErrorRow = memo(
	({
		type,
		title,
		message,
		showCopyButton = false,
		expandable = false,
		defaultExpanded = false,
		additionalContent,
		headerClassName,
		messageClassName,
	}) => {
		const { t } = useTranslation()
		const [isExpanded, setIsExpanded] = useState(defaultExpanded)
		const [showCopySuccess, setShowCopySuccess] = useState(false)
		const { copyWithFeedback } = useCopyToClipboard()
		// Default titles for different error types
		const getDefaultTitle = () => {
			if (title) return title
			switch (type) {
				case "error":
					return t("chat:error")
				case "mistake_limit":
					return t("chat:troubleMessage")
				case "api_failure":
					return t("chat:apiRequest.failed")
				case "streaming_failed":
					return t("chat:apiRequest.streamingFailed")
				case "cancelled":
					return t("chat:apiRequest.cancelled")
				case "diff_error":
					return t("chat:diffError.title")
				default:
					return null
			}
		}
		const handleToggleExpand = useCallback(() => {
			if (expandable) {
				setIsExpanded(!isExpanded)
			}
		}, [expandable, isExpanded])
		const handleCopy = useCallback(
			async (e) => {
				e.stopPropagation()
				const success = await copyWithFeedback(message)
				if (success) {
					setShowCopySuccess(true)
					setTimeout(() => {
						setShowCopySuccess(false)
					}, 1000)
				}
			},
			[message, copyWithFeedback],
		)
		const errorTitle = getDefaultTitle()
		// For diff_error type with expandable content
		if (type === "diff_error" && expandable) {
			return _jsxs("div", {
				className: "mt-0 overflow-hidden mb-2",
				children: [
					_jsxs("div", {
						className: `font-normal text-vscode-editor-foreground flex items-center justify-between cursor-pointer ${isExpanded ? "border-b border-vscode-editorGroup-border" : ""}`,
						onClick: handleToggleExpand,
						children: [
							_jsxs("div", {
								className: "flex items-center gap-2 flex-grow",
								children: [
									_jsx(MessageCircleWarning, { className: "w-4 text-vscode-errorForeground" }),
									_jsx("span", { className: "font-bold", children: errorTitle }),
								],
							}),
							_jsxs("div", {
								className: "flex items-center",
								children: [
									showCopyButton &&
										_jsx(VSCodeButton, {
											appearance: "icon",
											className:
												"p-0.75 h-6 mr-1 text-vscode-editor-foreground flex items-center justify-center bg-transparent",
											onClick: handleCopy,
											children: _jsx("span", {
												className: `codicon codicon-${showCopySuccess ? "check" : "copy"}`,
											}),
										}),
									_jsx("span", {
										className: `codicon codicon-chevron-${isExpanded ? "up" : "down"}`,
									}),
								],
							}),
						],
					}),
					isExpanded &&
						_jsx("div", {
							className: "p-2 bg-vscode-editor-background border-t-0",
							children: _jsx(CodeBlock, { source: message, language: "xml" }),
						}),
				],
			})
		}
		// Standard error display
		return _jsxs(_Fragment, {
			children: [
				errorTitle &&
					_jsxs("div", {
						className: headerClassName || "flex items-center gap-2 break-words",
						children: [
							_jsx(MessageCircleWarning, { className: "w-4 text-vscode-errorForeground" }),
							_jsx("span", { className: "text-vscode-errorForeground font-bold", children: errorTitle }),
						],
					}),
				_jsx("p", {
					className:
						messageClassName || "ml-6 my-0 whitespace-pre-wrap break-words text-vscode-errorForeground",
					children: message,
				}),
				additionalContent,
			],
		})
	},
)
export default ErrorRow
//# sourceMappingURL=ErrorRow.js.map
