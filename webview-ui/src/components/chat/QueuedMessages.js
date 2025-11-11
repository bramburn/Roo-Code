import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@src/components/ui"
import Thumbnails from "../common/Thumbnails"
import { Mention } from "./Mention"
export const QueuedMessages = ({ queue, onRemove, onUpdate }) => {
	const { t } = useTranslation("chat")
	const [editingStates, setEditingStates] = useState({})
	if (queue.length === 0) {
		return null
	}
	const getEditState = (messageId, currentText) => {
		return editingStates[messageId] || { isEditing: false, value: currentText }
	}
	const setEditState = (messageId, isEditing, value) => {
		setEditingStates((prev) => ({
			...prev,
			[messageId]: { isEditing, value: value ?? prev[messageId]?.value ?? "" },
		}))
	}
	const handleSaveEdit = (index, messageId, newValue) => {
		onUpdate(index, newValue)
		setEditState(messageId, false)
	}
	return _jsxs("div", {
		className: "px-[15px] py-[10px] pr-[6px]",
		"data-testid": "queued-messages",
		children: [
			_jsx("div", {
				className: "text-vscode-descriptionForeground text-md mb-2",
				children: t("queuedMessages.title"),
			}),
			_jsx("div", {
				className: "flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-2",
				children: queue.map((message, index) => {
					const editState = getEditState(message.id, message.text)
					return _jsxs(
						"div",
						{
							className:
								"bg-vscode-editor-background border rounded-xs p-1 overflow-hidden whitespace-pre-wrap flex-shrink-0",
							children: [
								_jsxs("div", {
									className: "flex justify-between",
									children: [
										_jsx("div", {
											className: "flex-grow px-2 py-1 wrap-anywhere",
											children: editState.isEditing
												? _jsx("textarea", {
														ref: (textarea) => {
															if (textarea) {
																// Set cursor at the end
																textarea.setSelectionRange(
																	textarea.value.length,
																	textarea.value.length,
																)
															}
														},
														value: editState.value,
														onChange: (e) => setEditState(message.id, true, e.target.value),
														onBlur: () =>
															handleSaveEdit(index, message.id, editState.value),
														onKeyDown: (e) => {
															if (e.key === "Enter" && !e.shiftKey) {
																e.preventDefault()
																handleSaveEdit(index, message.id, editState.value)
															}
															if (e.key === "Escape") {
																setEditState(message.id, false, message.text)
															}
														},
														className:
															"w-full bg-vscode-input-background text-vscode-input-foreground border border-vscode-input-border rounded px-2 py-1 resize-none focus:outline-0 focus:ring-1 focus:ring-vscode-focusBorder",
														placeholder: t("chat:editMessage.placeholder"),
														autoFocus: true,
														rows: Math.min(editState.value.split("\n").length, 10),
													})
												: _jsx("div", {
														onClick: () => setEditState(message.id, true, message.text),
														className:
															"cursor-pointer hover:bg-vscode-list-hoverBackground px-1 py-0.5 -mx-1 -my-0.5 rounded transition-colors",
														title: t("chat:queuedMessages.clickToEdit"),
														children: _jsx(Mention, {
															text: message.text,
															withShadow: true,
														}),
													}),
										}),
										_jsx("div", {
											className: "flex",
											children: _jsx(Button, {
												variant: "ghost",
												size: "icon",
												className: "shrink-0",
												onClick: (e) => {
													e.stopPropagation()
													onRemove(index)
												},
												children: _jsx("span", { className: "codicon codicon-trash" }),
											}),
										}),
									],
								}),
								message.images &&
									message.images.length > 0 &&
									_jsx(Thumbnails, { images: message.images, style: { marginTop: "8px" } }),
							],
						},
						message.id,
					)
				}),
			}),
		],
	})
}
//# sourceMappingURL=QueuedMessages.js.map
