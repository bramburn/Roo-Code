import React, { useState } from "react"
import { BarChart3, TrendingUp, CheckCircle, XCircle, Activity } from "lucide-react"
import { RetryMetrics, RetryHistory } from "../../types/retry"
import { vscode } from "../../utils/vscode"

interface RetryMetricsPanelProps {
	metrics: RetryMetrics
	history: RetryHistory[]
	className?: string
}

export const RetryMetricsPanel: React.FC<RetryMetricsPanelProps> = ({ metrics, history, className = "" }) => {
	const [selectedTimeRange, setSelectedTimeRange] = useState<"1h" | "24h" | "7d" | "30d">("24h")
	const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())

	const toggleSection = (section: string) => {
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
		let cutoffTime: number

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

	const formatDuration = (ms: number): string => {
		if (ms < 1000) return `${ms}ms`
		if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
		return `${(ms / 60000).toFixed(1)}m`
	}

	const formatPercentage = (value: number): string => {
		return `${(value * 100).toFixed(1)}%`
	}

	const successRate = metrics.totalRetries > 0 ? metrics.successfulRetries / metrics.totalRetries : 0

	const filteredHistory = getFilteredHistory()

	return (
		<div className={`p-6 bg-white dark:bg-gray-800 rounded-lg border ${className}`}>
			{/* Header */}
			<div className="flex items-center justify-between mb-6">
				<div className="flex items-center gap-2">
					<BarChart3 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
					<h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
						Retry Metrics & Statistics
					</h2>
				</div>

				{/* Time Range Selector */}
				<div className="flex gap-1">
					{(["1h", "24h", "7d", "30d"] as const).map((range) => (
						<button
							key={range}
							onClick={() => setSelectedTimeRange(range)}
							className={`px-3 py-1 text-sm rounded transition-colors ${
								selectedTimeRange === range
									? "bg-blue-500 text-white"
									: "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
							}`}>
							{range}
						</button>
					))}
				</div>
			</div>

			{/* Overview Cards */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
				<div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
					<div className="flex items-center gap-2 mb-2">
						<Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
						<span className="text-sm font-medium text-blue-900 dark:text-blue-100">Total Retries</span>
					</div>
					<p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{metrics.totalRetries}</p>
				</div>

				<div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
					<div className="flex items-center gap-2 mb-2">
						<CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
						<span className="text-sm font-medium text-green-900 dark:text-green-100">Successful</span>
					</div>
					<p className="text-2xl font-bold text-green-900 dark:text-green-100">{metrics.successfulRetries}</p>
				</div>

				<div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
					<div className="flex items-center gap-2 mb-2">
						<XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
						<span className="text-sm font-medium text-red-900 dark:text-red-100">Failed</span>
					</div>
					<p className="text-2xl font-bold text-red-900 dark:text-red-100">{metrics.failedRetries}</p>
				</div>

				<div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
					<div className="flex items-center gap-2 mb-2">
						<TrendingUp className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
						<span className="text-sm font-medium text-yellow-900 dark:text-yellow-100">Success Rate</span>
					</div>
					<p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
						{formatPercentage(successRate)}
					</p>
				</div>
			</div>

			{/* Detailed Metrics */}
			<div className="space-y-4">
				{/* Performance Metrics */}
				<div className="border rounded-lg">
					<button
						onClick={() => toggleSection("performance")}
						className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
						<span className="font-medium text-gray-900 dark:text-gray-100">Performance Metrics</span>
						<BarChart3
							className={`w-4 h-4 text-gray-500 transition-transform ${
								expandedSections.has("performance") ? "rotate-180" : ""
							}`}
						/>
					</button>

					{expandedSections.has("performance") && (
						<div className="p-4 border-t">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Average Attempts</p>
									<p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
										{metrics.averageAttempts.toFixed(1)}
									</p>
								</div>

								<div>
									<p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Average Retry Time</p>
									<p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
										{formatDuration(metrics.totalRetryTime / Math.max(1, metrics.totalRetries))}
									</p>
								</div>

								<div>
									<p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
										Circuit Breaker Activations
									</p>
									<p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
										{metrics.circuitBreakerActivations}
									</p>
								</div>

								<div>
									<p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
										Context Optimizations
									</p>
									<p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
										{metrics.contextOptimizations}
									</p>
								</div>
							</div>
						</div>
					)}
				</div>

				{/* Tool-Specific Metrics */}
				<div className="border rounded-lg">
					<button
						onClick={() => toggleSection("tools")}
						className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
						<span className="font-medium text-gray-900 dark:text-gray-100">Tool-Specific Metrics</span>
						<BarChart3
							className={`w-4 h-4 text-gray-500 transition-transform ${
								expandedSections.has("tools") ? "rotate-180" : ""
							}`}
						/>
					</button>

					{expandedSections.has("tools") && (
						<div className="p-4 border-t">
							<div className="space-y-3">
								{Object.entries(metrics.toolSpecificMetrics).map(([toolName, toolMetrics]) => (
									<div key={toolName} className="p-3 bg-gray-50 dark:bg-gray-900 rounded">
										<div className="flex items-center justify-between mb-2">
											<span className="font-medium text-gray-900 dark:text-gray-100">
												{toolName}
											</span>
											<span className="text-sm text-gray-600 dark:text-gray-400">
												{formatPercentage(
													toolMetrics.successes / Math.max(1, toolMetrics.attempts),
												)}{" "}
												success
											</span>
										</div>

										<div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
											<div>
												<p className="text-gray-600 dark:text-gray-400">Attempts</p>
												<p className="font-medium">{toolMetrics.attempts}</p>
											</div>
											<div>
												<p className="text-gray-600 dark:text-gray-400">Successes</p>
												<p className="font-medium text-green-600 dark:text-green-400">
													{toolMetrics.successes}
												</p>
											</div>
											<div>
												<p className="text-gray-600 dark:text-gray-400">Failures</p>
												<p className="font-medium text-red-600 dark:text-red-400">
													{toolMetrics.failures}
												</p>
											</div>
											<div>
												<p className="text-gray-600 dark:text-gray-400">Avg Time</p>
												<p className="font-medium">{formatDuration(toolMetrics.averageTime)}</p>
											</div>
										</div>
									</div>
								))}
							</div>
						</div>
					)}
				</div>

				{/* Recent History */}
				<div className="border rounded-lg">
					<button
						onClick={() => toggleSection("history")}
						className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
						<span className="font-medium text-gray-900 dark:text-gray-100">
							Recent Retry History ({filteredHistory.length})
						</span>
						<BarChart3
							className={`w-4 h-4 text-gray-500 transition-transform ${
								expandedSections.has("history") ? "rotate-180" : ""
							}`}
						/>
					</button>

					{expandedSections.has("history") && (
						<div className="p-4 border-t">
							<div className="space-y-2">
								{filteredHistory.length === 0 ? (
									<p className="text-center text-gray-500 dark:text-gray-400 py-4">
										No retry history in selected time range
									</p>
								) : (
									filteredHistory.slice(0, 10).map((item) => (
										<div
											key={item.retryId}
											className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded">
											<div className="flex-1">
												<div className="flex items-center gap-2 mb-1">
													<span className="font-medium text-gray-900 dark:text-gray-100">
														{item.toolName}
													</span>
													<span
														className={`px-2 py-1 text-xs rounded ${
															item.status === "success"
																? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
																: item.status === "failed"
																	? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
																	: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
														}`}>
														{item.status}
													</span>
												</div>

												<div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
													<span>Attempts: {item.attempts}</span>
													<span>
														Duration: {formatDuration(item.endTime - item.startTime)}
													</span>
												</div>

												{item.finalError && (
													<p className="text-xs text-red-600 dark:text-red-400 mt-1">
														Error: {item.finalError}
													</p>
												)}
											</div>

											<div className="text-xs text-gray-500 dark:text-gray-400">
												{new Date(item.endTime).toLocaleString()}
											</div>
										</div>
									))
								)}

								{filteredHistory.length > 10 && (
									<button
										onClick={() => {
											vscode.postMessage({
												type: "retry-show-full-history",
												timeRange: selectedTimeRange,
											})
										}}
										className="w-full mt-2 p-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
										View Full History
									</button>
								)}
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Action Buttons */}
			<div className="flex gap-3 mt-6 pt-6 border-t">
				<button
					onClick={() => {
						vscode.postMessage({
							type: "retry-export-metrics",
							metrics,
							history: filteredHistory,
						})
					}}
					className="px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors">
					Export Metrics
				</button>

				<button
					onClick={() => {
						vscode.postMessage({
							type: "retry-reset-metrics",
						})
					}}
					className="px-4 py-2 text-sm font-medium text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900 rounded hover:bg-red-200 dark:hover:bg-red-800 transition-colors">
					Reset Metrics
				</button>
			</div>
		</div>
	)
}
