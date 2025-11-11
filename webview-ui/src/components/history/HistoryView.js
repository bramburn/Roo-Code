import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime"
import React, { memo, useState } from "react"
import { DeleteTaskDialog } from "./DeleteTaskDialog"
import { BatchDeleteTaskDialog } from "./BatchDeleteTaskDialog"
import { Virtuoso } from "react-virtuoso"
import { VSCodeTextField } from "@vscode/webview-ui-toolkit/react"
import {
	Button,
	Checkbox,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	StandardTooltip,
} from "@/components/ui"
import { useAppTranslation } from "@/i18n/TranslationContext"
import { Tab, TabContent, TabHeader } from "../common/Tab"
import { useTaskSearch } from "./useTaskSearch"
import TaskItem from "./TaskItem"
const HistoryView = ({ onDone }) => {
	const {
		tasks,
		searchQuery,
		setSearchQuery,
		sortOption,
		setSortOption,
		setLastNonRelevantSort,
		showAllWorkspaces,
		setShowAllWorkspaces,
	} = useTaskSearch()
	const { t } = useAppTranslation()
	const [deleteTaskId, setDeleteTaskId] = useState(null)
	const [isSelectionMode, setIsSelectionMode] = useState(false)
	const [selectedTaskIds, setSelectedTaskIds] = useState([])
	const [showBatchDeleteDialog, setShowBatchDeleteDialog] = useState(false)
	// Toggle selection mode
	const toggleSelectionMode = () => {
		setIsSelectionMode(!isSelectionMode)
		if (isSelectionMode) {
			setSelectedTaskIds([])
		}
	}
	// Toggle selection for a single task
	const toggleTaskSelection = (taskId, isSelected) => {
		if (isSelected) {
			setSelectedTaskIds((prev) => [...prev, taskId])
		} else {
			setSelectedTaskIds((prev) => prev.filter((id) => id !== taskId))
		}
	}
	// Toggle select all tasks
	const toggleSelectAll = (selectAll) => {
		if (selectAll) {
			setSelectedTaskIds(tasks.map((task) => task.id))
		} else {
			setSelectedTaskIds([])
		}
	}
	// Handle batch delete button click
	const handleBatchDelete = () => {
		if (selectedTaskIds.length > 0) {
			setShowBatchDeleteDialog(true)
		}
	}
	return _jsxs(Tab, {
		children: [
			_jsxs(TabHeader, {
				className: "flex flex-col gap-2",
				children: [
					_jsxs("div", {
						className: "flex justify-between items-center",
						children: [
							_jsx("h3", { className: "text-vscode-foreground m-0", children: t("history:history") }),
							_jsxs("div", {
								className: "flex gap-2",
								children: [
									_jsx(StandardTooltip, {
										content: isSelectionMode
											? `${t("history:exitSelectionMode")}`
											: `${t("history:enterSelectionMode")}`,
										children: _jsxs(Button, {
											variant: isSelectionMode ? "default" : "secondary",
											onClick: toggleSelectionMode,
											"data-testid": "toggle-selection-mode-button",
											children: [
												_jsx("span", {
													className: `codicon ${isSelectionMode ? "codicon-check-all" : "codicon-checklist"} mr-1`,
												}),
												isSelectionMode
													? t("history:exitSelection")
													: t("history:selectionMode"),
											],
										}),
									}),
									_jsx(Button, { onClick: onDone, children: t("history:done") }),
								],
							}),
						],
					}),
					_jsxs("div", {
						className: "flex flex-col gap-2",
						children: [
							_jsxs(VSCodeTextField, {
								className: "w-full",
								placeholder: t("history:searchPlaceholder"),
								value: searchQuery,
								"data-testid": "history-search-input",
								onInput: (e) => {
									const newValue = e.target?.value
									setSearchQuery(newValue)
									if (newValue && !searchQuery && sortOption !== "mostRelevant") {
										setLastNonRelevantSort(sortOption)
										setSortOption("mostRelevant")
									}
								},
								children: [
									_jsx("div", {
										slot: "start",
										className: "codicon codicon-search mt-0.5 opacity-80 text-sm!",
									}),
									searchQuery &&
										_jsx("div", {
											className:
												"input-icon-button codicon codicon-close flex justify-center items-center h-full",
											"aria-label": "Clear search",
											onClick: () => setSearchQuery(""),
											slot: "end",
										}),
								],
							}),
							_jsxs("div", {
								className: "flex gap-2",
								children: [
									_jsxs(Select, {
										value: showAllWorkspaces ? "all" : "current",
										onValueChange: (value) => setShowAllWorkspaces(value === "all"),
										children: [
											_jsx(SelectTrigger, {
												className: "flex-1",
												children: _jsxs(SelectValue, {
													children: [
														t("history:workspace.prefix"),
														" ",
														t(`history:workspace.${showAllWorkspaces ? "all" : "current"}`),
													],
												}),
											}),
											_jsxs(SelectContent, {
												children: [
													_jsx(SelectItem, {
														value: "current",
														children: _jsxs("div", {
															className: "flex items-center gap-2",
															children: [
																_jsx("span", { className: "codicon codicon-folder" }),
																t("history:workspace.current"),
															],
														}),
													}),
													_jsx(SelectItem, {
														value: "all",
														children: _jsxs("div", {
															className: "flex items-center gap-2",
															children: [
																_jsx("span", {
																	className: "codicon codicon-folder-opened",
																}),
																t("history:workspace.all"),
															],
														}),
													}),
												],
											}),
										],
									}),
									_jsxs(Select, {
										value: sortOption,
										onValueChange: (value) => setSortOption(value),
										children: [
											_jsx(SelectTrigger, {
												className: "flex-1",
												children: _jsxs(SelectValue, {
													children: [
														t("history:sort.prefix"),
														" ",
														t(`history:sort.${sortOption}`),
													],
												}),
											}),
											_jsxs(SelectContent, {
												children: [
													_jsx(SelectItem, {
														value: "newest",
														"data-testid": "select-newest",
														children: _jsxs("div", {
															className: "flex items-center gap-2",
															children: [
																_jsx("span", {
																	className: "codicon codicon-arrow-down",
																}),
																t("history:newest"),
															],
														}),
													}),
													_jsx(SelectItem, {
														value: "oldest",
														"data-testid": "select-oldest",
														children: _jsxs("div", {
															className: "flex items-center gap-2",
															children: [
																_jsx("span", { className: "codicon codicon-arrow-up" }),
																t("history:oldest"),
															],
														}),
													}),
													_jsx(SelectItem, {
														value: "mostExpensive",
														"data-testid": "select-most-expensive",
														children: _jsxs("div", {
															className: "flex items-center gap-2",
															children: [
																_jsx("span", {
																	className: "codicon codicon-credit-card",
																}),
																t("history:mostExpensive"),
															],
														}),
													}),
													_jsx(SelectItem, {
														value: "mostTokens",
														"data-testid": "select-most-tokens",
														children: _jsxs("div", {
															className: "flex items-center gap-2",
															children: [
																_jsx("span", {
																	className: "codicon codicon-symbol-numeric",
																}),
																t("history:mostTokens"),
															],
														}),
													}),
													_jsx(SelectItem, {
														value: "mostRelevant",
														disabled: !searchQuery,
														"data-testid": "select-most-relevant",
														children: _jsxs("div", {
															className: "flex items-center gap-2",
															children: [
																_jsx("span", { className: "codicon codicon-search" }),
																t("history:mostRelevant"),
															],
														}),
													}),
												],
											}),
										],
									}),
								],
							}),
							isSelectionMode &&
								tasks.length > 0 &&
								_jsx("div", {
									className: "flex items-center py-1",
									children: _jsxs("div", {
										className: "flex items-center gap-2",
										children: [
											_jsx(Checkbox, {
												checked: tasks.length > 0 && selectedTaskIds.length === tasks.length,
												onCheckedChange: (checked) => toggleSelectAll(checked === true),
												variant: "description",
											}),
											_jsx("span", {
												className: "text-vscode-foreground",
												children:
													selectedTaskIds.length === tasks.length
														? t("history:deselectAll")
														: t("history:selectAll"),
											}),
											_jsx("span", {
												className: "ml-auto text-vscode-descriptionForeground text-xs",
												children: t("history:selectedItems", {
													selected: selectedTaskIds.length,
													total: tasks.length,
												}),
											}),
										],
									}),
								}),
						],
					}),
				],
			}),
			_jsx(TabContent, {
				className: "px-2 py-0",
				children: _jsx(Virtuoso, {
					className: "flex-1 overflow-y-scroll",
					data: tasks,
					"data-testid": "virtuoso-container",
					initialTopMostItemIndex: 0,
					components: {
						List: React.forwardRef((props, ref) =>
							_jsx("div", { ...props, ref: ref, "data-testid": "virtuoso-item-list" }),
						),
					},
					itemContent: (_index, item) =>
						_jsx(
							TaskItem,
							{
								item: item,
								variant: "full",
								showWorkspace: showAllWorkspaces,
								isSelectionMode: isSelectionMode,
								isSelected: selectedTaskIds.includes(item.id),
								onToggleSelection: toggleTaskSelection,
								onDelete: setDeleteTaskId,
								className: "m-2",
							},
							item.id,
						),
				}),
			}),
			isSelectionMode &&
				selectedTaskIds.length > 0 &&
				_jsxs("div", {
					className:
						"fixed bottom-0 left-0 right-2 bg-vscode-editor-background border-t border-vscode-panel-border p-2 flex justify-between items-center",
					children: [
						_jsx("div", {
							className: "text-vscode-foreground",
							children: t("history:selectedItems", {
								selected: selectedTaskIds.length,
								total: tasks.length,
							}),
						}),
						_jsxs("div", {
							className: "flex gap-2",
							children: [
								_jsx(Button, {
									variant: "secondary",
									onClick: () => setSelectedTaskIds([]),
									children: t("history:clearSelection"),
								}),
								_jsx(Button, {
									variant: "default",
									onClick: handleBatchDelete,
									children: t("history:deleteSelected"),
								}),
							],
						}),
					],
				}),
			deleteTaskId &&
				_jsx(DeleteTaskDialog, {
					taskId: deleteTaskId,
					onOpenChange: (open) => !open && setDeleteTaskId(null),
					open: true,
				}),
			showBatchDeleteDialog &&
				_jsx(BatchDeleteTaskDialog, {
					taskIds: selectedTaskIds,
					open: showBatchDeleteDialog,
					onOpenChange: (open) => {
						if (!open) {
							setShowBatchDeleteDialog(false)
							setSelectedTaskIds([])
							setIsSelectionMode(false)
						}
					},
				}),
		],
	})
}
export default memo(HistoryView)
//# sourceMappingURL=HistoryView.js.map
