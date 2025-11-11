import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime"
import { useState, useCallback } from "react"
import { CheckIcon, Cross2Icon } from "@radix-ui/react-icons"
import { useTranslation } from "react-i18next"
import { Button, Popover, PopoverContent, PopoverTrigger, StandardTooltip } from "@/components/ui"
import { useRooPortal } from "@/components/ui/hooks"
import { vscode } from "@src/utils/vscode"
export const CheckpointMenu = ({ ts, commitHash, checkpoint, onOpenChange }) => {
	const { t } = useTranslation()
	const [internalRestoreOpen, setInternalRestoreOpen] = useState(false)
	const [restoreConfirming, setRestoreConfirming] = useState(false)
	const [internalMoreOpen, setInternalMoreOpen] = useState(false)
	const portalContainer = useRooPortal("roo-portal")
	const previousCommitHash = checkpoint?.from
	const restoreOpen = internalRestoreOpen
	const moreOpen = internalMoreOpen
	const setRestoreOpen = useCallback(
		(open) => {
			setInternalRestoreOpen(open)
			if (onOpenChange) {
				onOpenChange(open)
			}
		},
		[onOpenChange],
	)
	const setMoreOpen = useCallback(
		(open) => {
			setInternalMoreOpen(open)
			if (onOpenChange) {
				onOpenChange(open)
			}
		},
		[onOpenChange],
	)
	const onCheckpointDiff = useCallback(() => {
		vscode.postMessage({
			type: "checkpointDiff",
			payload: { ts, previousCommitHash, commitHash, mode: "checkpoint" },
		})
	}, [ts, previousCommitHash, commitHash])
	const onDiffFromInit = useCallback(() => {
		vscode.postMessage({
			type: "checkpointDiff",
			payload: { ts, commitHash, mode: "from-init" },
		})
	}, [ts, commitHash])
	const onDiffWithCurrent = useCallback(() => {
		vscode.postMessage({
			type: "checkpointDiff",
			payload: { ts, commitHash, mode: "to-current" },
		})
	}, [ts, commitHash])
	const onPreview = useCallback(() => {
		vscode.postMessage({ type: "checkpointRestore", payload: { ts, commitHash, mode: "preview" } })
		setRestoreOpen(false)
	}, [ts, commitHash, setRestoreOpen])
	const onRestore = useCallback(() => {
		vscode.postMessage({ type: "checkpointRestore", payload: { ts, commitHash, mode: "restore" } })
		setRestoreOpen(false)
	}, [ts, commitHash, setRestoreOpen])
	const handleOpenChange = useCallback(
		(open) => {
			setRestoreOpen(open)
			if (!open) {
				setRestoreConfirming(false)
			}
		},
		[setRestoreOpen],
	)
	return _jsxs("div", {
		className: "flex flex-row gap-1",
		children: [
			_jsx(StandardTooltip, {
				content: t("chat:checkpoint.menu.viewDiff"),
				children: _jsx(Button, {
					variant: "ghost",
					size: "icon",
					onClick: onCheckpointDiff,
					children: _jsx("span", { className: "codicon codicon-diff-single" }),
				}),
			}),
			_jsxs(Popover, {
				open: restoreOpen,
				onOpenChange: (open) => {
					handleOpenChange(open)
					setRestoreConfirming(false)
				},
				"data-testid": "restore-popover",
				children: [
					_jsx(StandardTooltip, {
						content: t("chat:checkpoint.menu.restore"),
						children: _jsx(PopoverTrigger, {
							asChild: true,
							children: _jsx(Button, {
								variant: "ghost",
								size: "icon",
								"aria-label": t("chat:checkpoint.menu.restore"),
								children: _jsx("span", { className: "codicon codicon-history" }),
							}),
						}),
					}),
					_jsx(PopoverContent, {
						align: "end",
						container: portalContainer,
						children: _jsxs("div", {
							className: "flex flex-col gap-2",
							children: [
								_jsxs("div", {
									className: "flex flex-col gap-1 group hover:text-foreground",
									children: [
										_jsx(Button, {
											variant: "secondary",
											onClick: onPreview,
											"data-testid": "restore-files-btn",
											children: t("chat:checkpoint.menu.restoreFiles"),
										}),
										_jsx("div", {
											className: "text-muted transition-colors group-hover:text-foreground",
											children: t("chat:checkpoint.menu.restoreFilesDescription"),
										}),
									],
								}),
								_jsxs("div", {
									className: "flex flex-col gap-1 group hover:text-foreground",
									children: [
										!restoreConfirming
											? _jsx(Button, {
													variant: "secondary",
													onClick: () => setRestoreConfirming(true),
													"data-testid": "restore-files-and-task-btn",
													children: t("chat:checkpoint.menu.restoreFilesAndTask"),
												})
											: _jsxs(_Fragment, {
													children: [
														_jsx(Button, {
															variant: "default",
															onClick: onRestore,
															className: "grow",
															"data-testid": "confirm-restore-btn",
															children: _jsxs("div", {
																className: "flex flex-row gap-1",
																children: [
																	_jsx(CheckIcon, {}),
																	_jsx("div", {
																		children: t("chat:checkpoint.menu.confirm"),
																	}),
																],
															}),
														}),
														_jsx(Button, {
															variant: "secondary",
															onClick: () => setRestoreConfirming(false),
															children: _jsxs("div", {
																className: "flex flex-row gap-1",
																children: [
																	_jsx(Cross2Icon, {}),
																	_jsx("div", {
																		children: t("chat:checkpoint.menu.cancel"),
																	}),
																],
															}),
														}),
													],
												}),
										restoreConfirming
											? _jsx("div", {
													"data-testid": "checkpoint-confirm-warning",
													className: "text-destructive font-bold",
													children: t("chat:checkpoint.menu.cannotUndo"),
												})
											: _jsx("div", {
													className:
														"text-muted transition-colors group-hover:text-foreground",
													children: t("chat:checkpoint.menu.restoreFilesAndTaskDescription"),
												}),
									],
								}),
							],
						}),
					}),
				],
			}),
			_jsxs(Popover, {
				open: moreOpen,
				onOpenChange: (open) => setMoreOpen(open),
				"data-testid": "more-popover",
				children: [
					_jsx(StandardTooltip, {
						content: t("chat:task.seeMore"),
						children: _jsx(PopoverTrigger, {
							asChild: true,
							children: _jsx(Button, {
								variant: "ghost",
								size: "icon",
								"aria-label": t("chat:checkpoint.menu.more"),
								children: _jsx("span", { className: "codicon codicon-kebab-vertical" }),
							}),
						}),
					}),
					_jsx(PopoverContent, {
						align: "end",
						container: portalContainer,
						className: "w-auto min-w-max",
						children: _jsxs("div", {
							className: "flex flex-col gap-2",
							children: [
								_jsxs(Button, {
									variant: "secondary",
									onClick: () => {
										onDiffFromInit()
										setMoreOpen(false)
									},
									children: [
										_jsx("span", { className: "codicon codicon-versions mr-2" }),
										t("chat:checkpoint.menu.viewDiffFromInit"),
									],
								}),
								_jsxs(Button, {
									variant: "secondary",
									onClick: () => {
										onDiffWithCurrent()
										setMoreOpen(false)
									},
									children: [
										_jsx("span", { className: "codicon codicon-diff mr-2" }),
										t("chat:checkpoint.menu.viewDiffWithCurrent"),
									],
								}),
							],
						}),
					}),
				],
			}),
		],
	})
}
//# sourceMappingURL=CheckpointMenu.js.map
