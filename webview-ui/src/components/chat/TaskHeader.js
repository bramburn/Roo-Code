import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime"
import { memo, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useCloudUpsell } from "@src/hooks/useCloudUpsell"
import { CloudUpsellDialog } from "@src/components/cloud/CloudUpsellDialog"
import DismissibleUpsell from "@src/components/common/DismissibleUpsell"
import { FoldVertical, ChevronUp, ChevronDown } from "lucide-react"
import prettyBytes from "pretty-bytes"
import { getModelMaxOutputTokens } from "@roo/api"
import { findLastIndex } from "@roo/array"
import { formatLargeNumber } from "@src/utils/format"
import { cn } from "@src/lib/utils"
import { StandardTooltip } from "@src/components/ui"
import { useExtensionState } from "@src/context/ExtensionStateContext"
import { useSelectedModel } from "@/components/ui/hooks/useSelectedModel"
import Thumbnails from "../common/Thumbnails"
import { TaskActions } from "./TaskActions"
import { ContextWindowProgress } from "./ContextWindowProgress"
import { Mention } from "./Mention"
import { TodoListDisplay } from "./TodoListDisplay"
const TaskHeader = ({
	task,
	tokensIn,
	tokensOut,
	cacheWrites,
	cacheReads,
	totalCost,
	contextTokens,
	buttonsDisabled,
	handleCondenseContext,
	todos,
}) => {
	const { t } = useTranslation()
	const { apiConfiguration, currentTaskItem, clineMessages } = useExtensionState()
	const { id: modelId, info: model } = useSelectedModel(apiConfiguration)
	const [isTaskExpanded, setIsTaskExpanded] = useState(false)
	const [showLongRunningTaskMessage, setShowLongRunningTaskMessage] = useState(false)
	const { isOpen, openUpsell, closeUpsell, handleConnect } = useCloudUpsell({
		autoOpenOnAuth: false,
	})
	// Check if the task is complete by looking at the last relevant message (skipping resume messages)
	const isTaskComplete =
		clineMessages && clineMessages.length > 0
			? (() => {
					const lastRelevantIndex = findLastIndex(
						clineMessages,
						(m) => !(m.ask === "resume_task" || m.ask === "resume_completed_task"),
					)
					return lastRelevantIndex !== -1
						? clineMessages[lastRelevantIndex]?.ask === "completion_result"
						: false
				})()
			: false
	useEffect(() => {
		const timer = setTimeout(() => {
			if (currentTaskItem && !isTaskComplete) {
				setShowLongRunningTaskMessage(true)
			}
		}, 120_000) // Show upsell after 2 minutes
		return () => clearTimeout(timer)
	}, [currentTaskItem, isTaskComplete])
	const textContainerRef = useRef(null)
	const textRef = useRef(null)
	const contextWindow = model?.contextWindow || 1
	const condenseButton = _jsx(StandardTooltip, {
		content: t("chat:task.condenseContext"),
		children: _jsx("button", {
			disabled: buttonsDisabled,
			onClick: () => currentTaskItem && handleCondenseContext(currentTaskItem.id),
			className:
				"shrink-0 min-h-[20px] min-w-[20px] p-[2px] cursor-pointer disabled:cursor-not-allowed opacity-85 hover:opacity-100 bg-transparent border-none rounded-md",
			children: _jsx(FoldVertical, { size: 16 }),
		}),
	})
	const hasTodos = todos && Array.isArray(todos) && todos.length > 0
	return _jsxs("div", {
		className: "pt-2 pb-0 px-3",
		children: [
			showLongRunningTaskMessage &&
				!isTaskComplete &&
				_jsx(DismissibleUpsell, {
					upsellId: "longRunningTask",
					onClick: () => openUpsell(),
					dismissOnClick: false,
					variant: "banner",
					children: t("cloud:upsell.longRunningTask"),
				}),
			_jsxs("div", {
				className: cn(
					"px-2.5 pt-2.5 pb-2 flex flex-col gap-1.5 relative z-1 cursor-pointer",
					"bg-vscode-input-background hover:bg-vscode-input-background/90",
					"text-vscode-foreground/80 hover:text-vscode-foreground",
					"shadow-sm shadow-black/30 rounded-md",
					hasTodos && "border-b-0",
				),
				onClick: (e) => {
					// Don't expand if clicking on buttons or interactive elements
					if (
						e.target instanceof Element &&
						(e.target.closest("button") ||
							e.target.closest('[role="button"]') ||
							e.target.closest(".share-button") ||
							e.target.closest("[data-radix-popper-content-wrapper]") ||
							e.target.closest("img") ||
							e.target.tagName === "IMG")
					) {
						return
					}
					// Don't expand/collapse if user is selecting text
					const selection = window.getSelection()
					if (selection && selection.toString().length > 0) {
						return
					}
					setIsTaskExpanded(!isTaskExpanded)
				},
				children: [
					_jsx("div", {
						className: "flex justify-between items-center gap-0",
						children: _jsxs("div", {
							className: "flex items-center select-none grow min-w-0",
							children: [
								_jsxs("div", {
									className: "whitespace-nowrap overflow-hidden text-ellipsis grow min-w-0",
									children: [
										isTaskExpanded &&
											_jsx("span", { className: "font-bold", children: t("chat:task.title") }),
										!isTaskExpanded &&
											_jsxs("div", {
												children: [
													_jsx("span", {
														className: "font-bold mr-1",
														children: t("chat:task.title"),
													}),
													_jsx(Mention, { text: task.text }),
												],
											}),
									],
								}),
								_jsx("div", {
									className: "flex items-center shrink-0 ml-2",
									onClick: (e) => e.stopPropagation(),
									children: _jsx(StandardTooltip, {
										content: isTaskExpanded ? t("chat:task.collapse") : t("chat:task.expand"),
										children: _jsx("button", {
											onClick: () => setIsTaskExpanded(!isTaskExpanded),
											className:
												"shrink-0 min-h-[20px] min-w-[20px] p-[2px] cursor-pointer opacity-85 hover:opacity-100 bg-transparent border-none rounded-md",
											children: isTaskExpanded
												? _jsx(ChevronUp, { size: 16 })
												: _jsx(ChevronDown, { size: 16 }),
										}),
									}),
								}),
							],
						}),
					}),
					!isTaskExpanded &&
						contextWindow > 0 &&
						_jsxs("div", {
							className: "flex items-center gap-2 text-sm",
							onClick: (e) => e.stopPropagation(),
							children: [
								_jsx(StandardTooltip, {
									content: _jsxs("div", {
										className: "space-y-1",
										children: [
											_jsx("div", {
												children: t("chat:tokenProgress.tokensUsed", {
													used: formatLargeNumber(contextTokens || 0),
													total: formatLargeNumber(contextWindow),
												}),
											}),
											(() => {
												const maxTokens = model
													? getModelMaxOutputTokens({
															modelId,
															model,
															settings: apiConfiguration,
														})
													: 0
												const reservedForOutput = maxTokens || 0
												const availableSpace =
													contextWindow - (contextTokens || 0) - reservedForOutput
												return _jsxs(_Fragment, {
													children: [
														reservedForOutput > 0 &&
															_jsx("div", {
																children: t("chat:tokenProgress.reservedForResponse", {
																	amount: formatLargeNumber(reservedForOutput),
																}),
															}),
														availableSpace > 0 &&
															_jsx("div", {
																children: t("chat:tokenProgress.availableSpace", {
																	amount: formatLargeNumber(availableSpace),
																}),
															}),
													],
												})
											})(),
										],
									}),
									side: "top",
									sideOffset: 8,
									children: _jsxs("span", {
										className: "mr-1",
										children: [
											formatLargeNumber(contextTokens || 0),
											" / ",
											formatLargeNumber(contextWindow),
										],
									}),
								}),
								!!totalCost && _jsxs("span", { children: ["$", totalCost.toFixed(2)] }),
							],
						}),
					isTaskExpanded &&
						_jsxs(_Fragment, {
							children: [
								_jsx("div", {
									ref: textContainerRef,
									className:
										"text-vscode-font-size overflow-y-auto break-words break-anywhere relative",
									children: _jsx("div", {
										ref: textRef,
										className:
											"overflow-auto max-h-80 whitespace-pre-wrap break-words break-anywhere cursor-text",
										style: {
											display: "-webkit-box",
											WebkitLineClamp: "unset",
											WebkitBoxOrient: "vertical",
										},
										children: _jsx(Mention, { text: task.text }),
									}),
								}),
								task.images && task.images.length > 0 && _jsx(Thumbnails, { images: task.images }),
								_jsx("div", {
									className: "border-t border-b border-vscode-panel-border/50 py-4 mt-2 mb-1",
									children: _jsx("table", {
										className: "w-full",
										children: _jsxs("tbody", {
											children: [
												contextWindow > 0 &&
													_jsxs("tr", {
														children: [
															_jsx("th", {
																className:
																	"font-bold text-left align-top w-1 whitespace-nowrap pl-1 pr-3 h-[24px]",
																"data-testid": "context-window-label",
																children: t("chat:task.contextWindow"),
															}),
															_jsx("td", {
																className: "align-top",
																children: _jsxs("div", {
																	className: `max-w-80 -mt-0.5 flex flex-nowrap gap-1`,
																	children: [
																		_jsx(ContextWindowProgress, {
																			contextWindow: contextWindow,
																			contextTokens: contextTokens || 0,
																			maxTokens: model
																				? getModelMaxOutputTokens({
																						modelId,
																						model,
																						settings: apiConfiguration,
																					})
																				: undefined,
																		}),
																		condenseButton,
																	],
																}),
															}),
														],
													}),
												_jsxs("tr", {
													children: [
														_jsx("th", {
															className:
																"font-bold text-left align-top w-1 whitespace-nowrap pl-1 pr-3 h-[24px]",
															children: t("chat:task.tokens"),
														}),
														_jsx("td", {
															className: "align-top",
															children: _jsxs("div", {
																className: "flex items-center gap-1 flex-wrap",
																children: [
																	typeof tokensIn === "number" &&
																		tokensIn > 0 &&
																		_jsxs("span", {
																			children: [
																				"\u2191 ",
																				formatLargeNumber(tokensIn),
																			],
																		}),
																	typeof tokensOut === "number" &&
																		tokensOut > 0 &&
																		_jsxs("span", {
																			children: [
																				"\u2193 ",
																				formatLargeNumber(tokensOut),
																			],
																		}),
																],
															}),
														}),
													],
												}),
												((typeof cacheReads === "number" && cacheReads > 0) ||
													(typeof cacheWrites === "number" && cacheWrites > 0)) &&
													_jsxs("tr", {
														children: [
															_jsx("th", {
																className:
																	"font-bold text-left align-top w-1 whitespace-nowrap pl-1 pr-3 h-[24px]",
																children: t("chat:task.cache"),
															}),
															_jsx("td", {
																className: "align-top",
																children: _jsxs("div", {
																	className: "flex items-center gap-1 flex-wrap",
																	children: [
																		typeof cacheWrites === "number" &&
																			cacheWrites > 0 &&
																			_jsxs("span", {
																				children: [
																					"\u2191 ",
																					formatLargeNumber(cacheWrites),
																				],
																			}),
																		typeof cacheReads === "number" &&
																			cacheReads > 0 &&
																			_jsxs("span", {
																				children: [
																					"\u2193 ",
																					formatLargeNumber(cacheReads),
																				],
																			}),
																	],
																}),
															}),
														],
													}),
												!!totalCost &&
													_jsxs("tr", {
														children: [
															_jsx("th", {
																className:
																	"font-bold text-left align-top w-1 whitespace-nowrap pl-1 pr-3 h-[24px]",
																children: t("chat:task.apiCost"),
															}),
															_jsx("td", {
																className: "align-top",
																children: _jsxs("span", {
																	children: ["$", totalCost?.toFixed(2)],
																}),
															}),
														],
													}),
												!!currentTaskItem?.size &&
													currentTaskItem.size > 0 &&
													_jsxs("tr", {
														children: [
															_jsx("th", {
																className:
																	"font-bold text-left align-top w-1 whitespace-nowrap pl-1 pr-2  h-[20px]",
																children: t("chat:task.size"),
															}),
															_jsx("td", {
																className: "align-top",
																children: prettyBytes(currentTaskItem.size),
															}),
														],
													}),
											],
										}),
									}),
								}),
								_jsx("div", {
									onClick: (e) => e.stopPropagation(),
									children: _jsx(TaskActions, {
										item: currentTaskItem,
										buttonsDisabled: buttonsDisabled,
									}),
								}),
							],
						}),
				],
			}),
			_jsx(TodoListDisplay, { todos: todos ?? task?.tool?.todos ?? [] }),
			_jsx(CloudUpsellDialog, { open: isOpen, onOpenChange: closeUpsell, onConnect: handleConnect }),
		],
	})
}
export default memo(TaskHeader)
//# sourceMappingURL=TaskHeader.js.map
