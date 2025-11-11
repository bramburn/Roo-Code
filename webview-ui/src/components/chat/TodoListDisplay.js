import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime"
import { useState, useRef, useMemo, useEffect } from "react"
export function TodoListDisplay({ todos }) {
	const [isCollapsed, setIsCollapsed] = useState(true)
	const ulRef = useRef(null)
	const itemRefs = useRef([])
	const scrollIndex = useMemo(() => {
		const inProgressIdx = todos.findIndex((todo) => todo.status === "in_progress")
		if (inProgressIdx !== -1) return inProgressIdx
		return todos.findIndex((todo) => todo.status !== "completed")
	}, [todos])
	// Find the most important todo to display when collapsed
	const mostImportantTodo = useMemo(() => {
		const inProgress = todos.find((todo) => todo.status === "in_progress")
		if (inProgress) return inProgress
		return todos.find((todo) => todo.status !== "completed")
	}, [todos])
	useEffect(() => {
		if (isCollapsed) return
		if (!ulRef.current) return
		if (scrollIndex === -1) return
		const target = itemRefs.current[scrollIndex]
		if (target && ulRef.current) {
			const ul = ulRef.current
			const targetTop = target.offsetTop - ul.offsetTop
			const targetHeight = target.offsetHeight
			const ulHeight = ul.clientHeight
			const scrollTo = targetTop - (ulHeight / 2 - targetHeight / 2)
			ul.scrollTop = scrollTo
		}
	}, [todos, isCollapsed, scrollIndex])
	if (!Array.isArray(todos) || todos.length === 0) return null
	const totalCount = todos.length
	const completedCount = todos.filter((todo) => todo.status === "completed").length
	const allCompleted = completedCount === totalCount && totalCount > 0
	// Create the status icon for the most important todo
	const getMostImportantTodoIcon = () => {
		if (allCompleted) {
			return _jsx("span", {
				style: {
					display: "inline-block",
					width: 8,
					height: 8,
					borderRadius: "50%",
					background: "var(--vscode-charts-green)",
					marginRight: 8,
					marginLeft: 2,
					flexShrink: 0,
				},
			})
		}
		if (!mostImportantTodo) {
			return _jsx("span", {
				className: "codicon codicon-checklist",
				style: {
					color: "var(--vscode-foreground)",
					marginRight: 8,
					marginLeft: 2,
					flexShrink: 0,
					fontSize: 14,
				},
			})
		}
		if (mostImportantTodo.status === "completed") {
			return _jsx("span", {
				style: {
					display: "inline-block",
					width: 8,
					height: 8,
					borderRadius: "50%",
					background: "var(--vscode-charts-green)",
					marginRight: 8,
					marginLeft: 2,
					flexShrink: 0,
				},
			})
		}
		if (mostImportantTodo.status === "in_progress") {
			return _jsx("span", {
				style: {
					display: "inline-block",
					width: 8,
					height: 8,
					borderRadius: "50%",
					background: "var(--vscode-charts-yellow)",
					marginRight: 8,
					marginLeft: 2,
					flexShrink: 0,
				},
			})
		}
		// Default not-started todo
		return _jsx("span", {
			style: {
				display: "inline-block",
				width: 8,
				height: 8,
				borderRadius: "50%",
				border: "1px solid var(--vscode-descriptionForeground)",
				background: "transparent",
				marginRight: 8,
				marginLeft: 2,
				flexShrink: 0,
			},
		})
	}
	return _jsxs("div", {
		className: "border border-t-0 rounded-b-xs relative",
		style: {
			margin: "0",
			padding: "6px 10px",
			background: "var(--vscode-editor-background,transparent)",
			borderColor: "var(--vscode-panel-border)",
		},
		children: [
			_jsxs("div", {
				style: {
					display: "flex",
					alignItems: "center",
					gap: 2,
					marginBottom: 0,
					cursor: "pointer",
					userSelect: "none",
				},
				onClick: () => setIsCollapsed((v) => !v),
				children: [
					getMostImportantTodoIcon(),
					_jsx("span", {
						style: {
							fontWeight: 500,
							color: allCompleted
								? "var(--vscode-charts-green)"
								: mostImportantTodo?.status === "in_progress"
									? "var(--vscode-charts-yellow)"
									: "var(--vscode-foreground)",
							flex: 1,
							overflow: "hidden",
							textOverflow: "ellipsis",
							whiteSpace: "nowrap",
						},
						children: allCompleted
							? "All tasks completed!"
							: mostImportantTodo?.content || "No pending tasks",
					}),
					_jsxs("div", {
						style: { display: "flex", alignItems: "center", gap: 4, flexShrink: 0 },
						children: [
							_jsx("span", {
								className: "codicon codicon-checklist",
								style: {
									color: "var(--vscode-descriptionForeground)",
									fontSize: 12,
								},
							}),
							_jsxs("span", {
								style: {
									color: "var(--vscode-descriptionForeground)",
									fontSize: 12,
									fontWeight: 500,
								},
								children: [completedCount, "/", totalCount],
							}),
						],
					}),
				],
			}),
			!isCollapsed &&
				_jsxs(_Fragment, {
					children: [
						_jsx("div", {
							style: {
								position: "fixed",
								top: 0,
								left: 0,
								right: 0,
								bottom: 0,
								background: "rgba(0, 0, 0, 0.1)",
								zIndex: 1000,
							},
							onClick: () => setIsCollapsed(true),
						}),
						_jsxs("div", {
							style: {
								position: "absolute",
								top: "100%",
								left: 0,
								right: 0,
								marginTop: 4,
								background: "var(--vscode-editor-background)",
								border: "1px solid var(--vscode-panel-border)",
								borderRadius: 6,
								boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
								zIndex: 1001,
								maxHeight: "400px",
								minHeight: "200px",
								overflow: "hidden",
							},
							children: [
								_jsxs("div", {
									style: {
										display: "flex",
										alignItems: "center",
										justifyContent: "space-between",
										padding: "12px 16px",
										borderBottom: "1px solid var(--vscode-panel-border)",
										background: "var(--vscode-editor-background)",
									},
									children: [
										_jsxs("div", {
											style: { display: "flex", alignItems: "center", gap: 8 },
											children: [
												_jsx("span", {
													className: "codicon codicon-checklist",
													style: { color: "var(--vscode-foreground)" },
												}),
												_jsx("span", {
													style: { fontWeight: "bold", fontSize: 14 },
													children: "Todo List",
												}),
												_jsxs("span", {
													style: {
														color: "var(--vscode-descriptionForeground)",
														fontSize: 13,
														fontWeight: 500,
													},
													children: [completedCount, "/", totalCount],
												}),
											],
										}),
										_jsx("span", {
											className: "codicon codicon-chevron-up",
											style: {
												fontSize: 14,
												opacity: 0.7,
												cursor: "pointer",
												padding: "4px",
												borderRadius: "2px",
											},
											onClick: (e) => {
												e.stopPropagation()
												setIsCollapsed(true)
											},
											onMouseEnter: (e) => {
												e.currentTarget.style.opacity = "1"
												e.currentTarget.style.background =
													"var(--vscode-toolbar-hoverBackground)"
											},
											onMouseLeave: (e) => {
												e.currentTarget.style.opacity = "0.7"
												e.currentTarget.style.background = "transparent"
											},
										}),
									],
								}),
								_jsx("ul", {
									ref: ulRef,
									style: {
										margin: 0,
										paddingLeft: 0,
										listStyle: "none",
										maxHeight: "340px",
										overflowY: "auto",
										padding: "12px 16px",
									},
									children: todos.map((todo, idx) => {
										let icon
										if (todo.status === "completed") {
											icon = _jsx("span", {
												style: {
													display: "inline-block",
													width: 8,
													height: 8,
													borderRadius: "50%",
													background: "var(--vscode-charts-green)",
													marginRight: 8,
													marginTop: 7,
													flexShrink: 0,
												},
											})
										} else if (todo.status === "in_progress") {
											icon = _jsx("span", {
												style: {
													display: "inline-block",
													width: 8,
													height: 8,
													borderRadius: "50%",
													background: "var(--vscode-charts-yellow)",
													marginRight: 8,
													marginTop: 7,
													flexShrink: 0,
												},
											})
										} else {
											icon = _jsx("span", {
												style: {
													display: "inline-block",
													width: 8,
													height: 8,
													borderRadius: "50%",
													border: "1px solid var(--vscode-descriptionForeground)",
													background: "transparent",
													marginRight: 8,
													marginTop: 7,
													flexShrink: 0,
												},
											})
										}
										return _jsxs(
											"li",
											{
												ref: (el) => (itemRefs.current[idx] = el),
												style: {
													marginBottom: 8,
													display: "flex",
													alignItems: "flex-start",
													minHeight: 20,
													lineHeight: "1.4",
												},
												children: [
													icon,
													_jsx("span", {
														style: {
															fontWeight: 500,
															color:
																todo.status === "completed"
																	? "var(--vscode-charts-green)"
																	: todo.status === "in_progress"
																		? "var(--vscode-charts-yellow)"
																		: "var(--vscode-foreground)",
															wordBreak: "break-word",
														},
														children: todo.content,
													}),
												],
											},
											todo.id || todo.content,
										)
									}),
								}),
							],
						}),
					],
				}),
		],
	})
}
//# sourceMappingURL=TodoListDisplay.js.map
