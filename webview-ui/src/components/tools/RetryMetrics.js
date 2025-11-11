import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime"
import { useState } from "react"
import { BarChart3, TrendingUp, CheckCircle, XCircle, Activity } from "lucide-react"
import { vscode } from "../../utils/vscode"
export const RetryMetricsPanel = ({ metrics, history, className = "" }) => {
	const [selectedTimeRange, setSelectedTimeRange] = useState("24h")
	const [expandedSections, setExpandedSections] = useState(new Set())
	const toggleSection = (section) => {
		setExpandedSections((prev) => {
			const newSet = new Set(prev)
			if (newSet.has(section)) {
				newSet.delete(section)
			} else {
				newSet.add(section)
			}
			return newSet
		})
	}
	const getFilteredHistory = () => {
		const now = Date.now()
		let cutoffTime
		switch (selectedTimeRange) {
			case "1h":
				cutoffTime = now - 60 * 60 * 1000
				break
			case "24h":
				cutoffTime = now - 24 * 60 * 60 * 1000
				break
			case "7d":
				cutoffTime = now - 7 * 24 * 60 * 60 * 1000
				break
			case "30d":
				cutoffTime = now - 30 * 24 * 60 * 60 * 1000
				break
			default:
				cutoffTime = 0
		}
		return history.filter((item) => item.endTime >= cutoffTime)
	}
	const formatDuration = (ms) => {
		if (ms < 1000) return `${ms}ms`
		if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
		return `${(ms / 60000).toFixed(1)}m`
	}
	const formatPercentage = (value) => {
		return `${(value * 100).toFixed(1)}%`
	}
	const successRate = metrics.totalRetries > 0 ? metrics.successfulRetries / metrics.totalRetries : 0
	const filteredHistory = getFilteredHistory()
	return _jsxs("div", {
		className: `p-6 bg-white dark:bg-gray-800 rounded-lg border ${className}`,
		children: [
			_jsxs("div", {
				className: "flex items-center justify-between mb-6",
				children: [
					_jsxs("div", {
						className: "flex items-center gap-2",
						children: [
							_jsx(BarChart3, { className: "w-5 h-5 text-gray-600 dark:text-gray-400" }),
							_jsx("h2", {
								className: "text-lg font-semibold text-gray-900 dark:text-gray-100",
								children: "Retry Metrics & Statistics",
							}),
						],
					}),
					_jsx("div", {
						className: "flex gap-1",
						children: ["1h", "24h", "7d", "30d"].map((range) =>
							_jsx(
								"button",
								{
									onClick: () => setSelectedTimeRange(range),
									className: `px-3 py-1 text-sm rounded transition-colors ${
										selectedTimeRange === range
											? "bg-blue-500 text-white"
											: "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
									}`,
									children: range,
								},
								range,
							),
						),
					}),
				],
			}),
			_jsxs("div", {
				className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6",
				children: [
					_jsxs("div", {
						className:
							"p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg",
						children: [
							_jsxs("div", {
								className: "flex items-center gap-2 mb-2",
								children: [
									_jsx(Activity, { className: "w-4 h-4 text-blue-600 dark:text-blue-400" }),
									_jsx("span", {
										className: "text-sm font-medium text-blue-900 dark:text-blue-100",
										children: "Total Retries",
									}),
								],
							}),
							_jsx("p", {
								className: "text-2xl font-bold text-blue-900 dark:text-blue-100",
								children: metrics.totalRetries,
							}),
						],
					}),
					_jsxs("div", {
						className:
							"p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg",
						children: [
							_jsxs("div", {
								className: "flex items-center gap-2 mb-2",
								children: [
									_jsx(CheckCircle, { className: "w-4 h-4 text-green-600 dark:text-green-400" }),
									_jsx("span", {
										className: "text-sm font-medium text-green-900 dark:text-green-100",
										children: "Successful",
									}),
								],
							}),
							_jsx("p", {
								className: "text-2xl font-bold text-green-900 dark:text-green-100",
								children: metrics.successfulRetries,
							}),
						],
					}),
					_jsxs("div", {
						className:
							"p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg",
						children: [
							_jsxs("div", {
								className: "flex items-center gap-2 mb-2",
								children: [
									_jsx(XCircle, { className: "w-4 h-4 text-red-600 dark:text-red-400" }),
									_jsx("span", {
										className: "text-sm font-medium text-red-900 dark:text-red-100",
										children: "Failed",
									}),
								],
							}),
							_jsx("p", {
								className: "text-2xl font-bold text-red-900 dark:text-red-100",
								children: metrics.failedRetries,
							}),
						],
					}),
					_jsxs("div", {
						className:
							"p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg",
						children: [
							_jsxs("div", {
								className: "flex items-center gap-2 mb-2",
								children: [
									_jsx(TrendingUp, { className: "w-4 h-4 text-yellow-600 dark:text-yellow-400" }),
									_jsx("span", {
										className: "text-sm font-medium text-yellow-900 dark:text-yellow-100",
										children: "Success Rate",
									}),
								],
							}),
							_jsx("p", {
								className: "text-2xl font-bold text-yellow-900 dark:text-yellow-100",
								children: formatPercentage(successRate),
							}),
						],
					}),
				],
			}),
			_jsxs("div", {
				className: "space-y-4",
				children: [
					_jsxs("div", {
						className: "border rounded-lg",
						children: [
							_jsxs("button", {
								onClick: () => toggleSection("performance"),
								className:
									"w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors",
								children: [
									_jsx("span", {
										className: "font-medium text-gray-900 dark:text-gray-100",
										children: "Performance Metrics",
									}),
									_jsx(BarChart3, {
										className: `w-4 h-4 text-gray-500 transition-transform ${expandedSections.has("performance") ? "rotate-180" : ""}`,
									}),
								],
							}),
							expandedSections.has("performance") &&
								_jsx("div", {
									className: "p-4 border-t",
									children: _jsxs("div", {
										className: "grid grid-cols-1 md:grid-cols-2 gap-4",
										children: [
											_jsxs("div", {
												children: [
													_jsx("p", {
														className: "text-sm text-gray-600 dark:text-gray-400 mb-1",
														children: "Average Attempts",
													}),
													_jsx("p", {
														className:
															"text-lg font-semibold text-gray-900 dark:text-gray-100",
														children: metrics.averageAttempts.toFixed(1),
													}),
												],
											}),
											_jsxs("div", {
												children: [
													_jsx("p", {
														className: "text-sm text-gray-600 dark:text-gray-400 mb-1",
														children: "Average Retry Time",
													}),
													_jsx("p", {
														className:
															"text-lg font-semibold text-gray-900 dark:text-gray-100",
														children: formatDuration(
															metrics.totalRetryTime / Math.max(1, metrics.totalRetries),
														),
													}),
												],
											}),
											_jsxs("div", {
												children: [
													_jsx("p", {
														className: "text-sm text-gray-600 dark:text-gray-400 mb-1",
														children: "Circuit Breaker Activations",
													}),
													_jsx("p", {
														className:
															"text-lg font-semibold text-gray-900 dark:text-gray-100",
														children: metrics.circuitBreakerActivations,
													}),
												],
											}),
											_jsxs("div", {
												children: [
													_jsx("p", {
														className: "text-sm text-gray-600 dark:text-gray-400 mb-1",
														children: "Context Optimizations",
													}),
													_jsx("p", {
														className:
															"text-lg font-semibold text-gray-900 dark:text-gray-100",
														children: metrics.contextOptimizations,
													}),
												],
											}),
										],
									}),
								}),
						],
					}),
					_jsxs("div", {
						className: "border rounded-lg",
						children: [
							_jsxs("button", {
								onClick: () => toggleSection("tools"),
								className:
									"w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors",
								children: [
									_jsx("span", {
										className: "font-medium text-gray-900 dark:text-gray-100",
										children: "Tool-Specific Metrics",
									}),
									_jsx(BarChart3, {
										className: `w-4 h-4 text-gray-500 transition-transform ${expandedSections.has("tools") ? "rotate-180" : ""}`,
									}),
								],
							}),
							expandedSections.has("tools") &&
								_jsx("div", {
									className: "p-4 border-t",
									children: _jsx("div", {
										className: "space-y-3",
										children: Object.entries(metrics.toolSpecificMetrics).map(
											([toolName, toolMetrics]) =>
												_jsxs(
													"div",
													{
														className: "p-3 bg-gray-50 dark:bg-gray-900 rounded",
														children: [
															_jsxs("div", {
																className: "flex items-center justify-between mb-2",
																children: [
																	_jsx("span", {
																		className:
																			"font-medium text-gray-900 dark:text-gray-100",
																		children: toolName,
																	}),
																	_jsxs("span", {
																		className:
																			"text-sm text-gray-600 dark:text-gray-400",
																		children: [
																			formatPercentage(
																				toolMetrics.successes /
																					Math.max(1, toolMetrics.attempts),
																			),
																			" ",
																			"success",
																		],
																	}),
																],
															}),
															_jsxs("div", {
																className:
																	"grid grid-cols-2 md:grid-cols-4 gap-2 text-sm",
																children: [
																	_jsxs("div", {
																		children: [
																			_jsx("p", {
																				className:
																					"text-gray-600 dark:text-gray-400",
																				children: "Attempts",
																			}),
																			_jsx("p", {
																				className: "font-medium",
																				children: toolMetrics.attempts,
																			}),
																		],
																	}),
																	_jsxs("div", {
																		children: [
																			_jsx("p", {
																				className:
																					"text-gray-600 dark:text-gray-400",
																				children: "Successes",
																			}),
																			_jsx("p", {
																				className:
																					"font-medium text-green-600 dark:text-green-400",
																				children: toolMetrics.successes,
																			}),
																		],
																	}),
																	_jsxs("div", {
																		children: [
																			_jsx("p", {
																				className:
																					"text-gray-600 dark:text-gray-400",
																				children: "Failures",
																			}),
																			_jsx("p", {
																				className:
																					"font-medium text-red-600 dark:text-red-400",
																				children: toolMetrics.failures,
																			}),
																		],
																	}),
																	_jsxs("div", {
																		children: [
																			_jsx("p", {
																				className:
																					"text-gray-600 dark:text-gray-400",
																				children: "Avg Time",
																			}),
																			_jsx("p", {
																				className: "font-medium",
																				children: formatDuration(
																					toolMetrics.averageTime,
																				),
																			}),
																		],
																	}),
																],
															}),
														],
													},
													toolName,
												),
										),
									}),
								}),
						],
					}),
					_jsxs("div", {
						className: "border rounded-lg",
						children: [
							_jsxs("button", {
								onClick: () => toggleSection("history"),
								className:
									"w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors",
								children: [
									_jsxs("span", {
										className: "font-medium text-gray-900 dark:text-gray-100",
										children: ["Recent Retry History (", filteredHistory.length, ")"],
									}),
									_jsx(BarChart3, {
										className: `w-4 h-4 text-gray-500 transition-transform ${expandedSections.has("history") ? "rotate-180" : ""}`,
									}),
								],
							}),
							expandedSections.has("history") &&
								_jsx("div", {
									className: "p-4 border-t",
									children: _jsxs("div", {
										className: "space-y-2",
										children: [
											filteredHistory.length === 0
												? _jsx("p", {
														className: "text-center text-gray-500 dark:text-gray-400 py-4",
														children: "No retry history in selected time range",
													})
												: filteredHistory
														.slice(0, 10)
														.map((item) =>
															_jsxs(
																"div",
																{
																	className:
																		"flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded",
																	children: [
																		_jsxs("div", {
																			className: "flex-1",
																			children: [
																				_jsxs("div", {
																					className:
																						"flex items-center gap-2 mb-1",
																					children: [
																						_jsx("span", {
																							className:
																								"font-medium text-gray-900 dark:text-gray-100",
																							children: item.toolName,
																						}),
																						_jsx("span", {
																							className: `px-2 py-1 text-xs rounded ${
																								item.status ===
																								"success"
																									? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
																									: item.status ===
																										  "failed"
																										? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
																										: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
																							}`,
																							children: item.status,
																						}),
																					],
																				}),
																				_jsxs("div", {
																					className:
																						"flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400",
																					children: [
																						_jsxs("span", {
																							children: [
																								"Attempts: ",
																								item.attempts,
																							],
																						}),
																						_jsxs("span", {
																							children: [
																								"Duration: ",
																								formatDuration(
																									item.endTime -
																										item.startTime,
																								),
																							],
																						}),
																					],
																				}),
																				item.finalError &&
																					_jsxs("p", {
																						className:
																							"text-xs text-red-600 dark:text-red-400 mt-1",
																						children: [
																							"Error: ",
																							item.finalError,
																						],
																					}),
																			],
																		}),
																		_jsx("div", {
																			className:
																				"text-xs text-gray-500 dark:text-gray-400",
																			children: new Date(
																				item.endTime,
																			).toLocaleString(),
																		}),
																	],
																},
																item.retryId,
															),
														),
											filteredHistory.length > 10 &&
												_jsx("button", {
													onClick: () => {
														vscode.postMessage({
															type: "retry-show-full-history",
															timeRange: selectedTimeRange,
														})
													},
													className:
														"w-full mt-2 p-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300",
													children: "View Full History",
												}),
										],
									}),
								}),
						],
					}),
				],
			}),
			_jsxs("div", {
				className: "flex gap-3 mt-6 pt-6 border-t",
				children: [
					_jsx("button", {
						onClick: () => {
							vscode.postMessage({
								type: "retry-export-metrics",
								metrics,
								history: filteredHistory,
							})
						},
						className:
							"px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors",
						children: "Export Metrics",
					}),
					_jsx("button", {
						onClick: () => {
							vscode.postMessage({
								type: "retry-reset-metrics",
							})
						},
						className:
							"px-4 py-2 text-sm font-medium text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900 rounded hover:bg-red-200 dark:hover:bg-red-800 transition-colors",
						children: "Reset Metrics",
					}),
				],
			}),
		],
	})
}
//# sourceMappingURL=RetryMetrics.js.map
