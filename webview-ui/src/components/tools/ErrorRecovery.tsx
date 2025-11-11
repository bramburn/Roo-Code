import React from "react"
import { AlertTriangle, RefreshCw, Zap, Shield, XCircle, Info, Lightbulb } from "lucide-react"
import { RetryState, ErrorClassification } from "../../types/retry"
import { vscode } from "../../utils/vscode"

export interface ErrorRecoveryProps {
	retryState?: RetryState
	errorClassification?: ErrorClassification
	toolName: string
	originalError: string
	contextOptimizationAvailable?: boolean
	className?: string
}

export const ErrorRecovery: React.FC<ErrorRecoveryProps> = ({
	retryState,
	errorClassification,
	toolName,
	originalError,
	contextOptimizationAvailable = false,
	className = "",
}) => {
	const handleManualRetry = () => {
		if (!retryState) return

		vscode.postMessage({
			type: "retry-manual",
			retryId: retryState.id,
			action: "immediate-retry",
		})
	}

	const handleOptimizeContext = () => {
		if (!retryState) return

		vscode.postMessage({
			type: "retry-optimize-context",
			retryId: retryState.id,
		})
	}

	const handleCancelRetry = () => {
		if (!retryState) return

		vscode.postMessage({
			type: "retry-cancel",
			retryId: retryState.id,
		})
	}

	const handleResetCircuitBreaker = () => {
		vscode.postMessage({
			type: "retry-reset-circuit-breaker",
			toolName,
		})
	}

	const getSeverityColor = (severity: string) => {
		switch (severity) {
			case "low":
				return "text-yellow-600"
			case "medium":
				return "text-orange-600"
			case "high":
				return "text-red-600"
			case "critical":
				return "text-red-600 font-bold"
			default:
				return "text-gray-600"
		}
	}

	const getCategoryIcon = (category: string) => {
		switch (category) {
			case "network":
				return <RefreshCw className="w-4 h-4" />
			case "timeout":
				return <AlertTriangle className="w-4 h-4" />
			case "rate_limit":
				return <Zap className="w-4 h-4" />
			case "auth":
			case "permission":
				return <Shield className="w-4 h-4" />
			default:
				return <Info className="w-4 h-4" />
		}
	}

	const getRecoverySuggestions = () => {
		if (!errorClassification) return []

		const suggestions = []

		switch (errorClassification.category) {
			case "network":
				suggestions.push({
					title: "Network Issues",
					description: "Retry with exponential backoff and check connection",
					action: "retry",
				})
				break
			case "timeout":
				suggestions.push({
					title: "Timeout Issues",
					description: "Consider increasing timeout or optimizing context",
					action: "optimize",
				})
				break
			case "rate_limit":
				suggestions.push({
					title: "Rate Limiting",
					description: "Wait longer between attempts or reduce request frequency",
					action: "wait",
				})
				break
			case "auth":
				suggestions.push({
					title: "Authentication Issues",
					description: "Check credentials and permissions",
					action: "auth",
				})
				break
			case "permission":
				suggestions.push({
					title: "Permission Issues",
					description: "Verify file/directory permissions",
					action: "permissions",
				})
				break
			case "resource":
				suggestions.push({
					title: "Resource Issues",
					description: "Check available resources and optimize usage",
					action: "optimize",
				})
				break
			case "parsing":
				suggestions.push({
					title: "Parsing Issues",
					description: "Validate input format and content",
					action: "validate",
				})
				break
		}

		return suggestions
	}

	return (
		<div className={`p-4 border rounded-lg bg-white dark:bg-gray-800 ${className}`}>
			{/* Header */}
			<div className="flex items-center gap-2 mb-4">
				<AlertTriangle className="w-5 h-5 text-red-500" />
				<h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Error Recovery</h3>
			</div>

			{/* Error Information */}
			<div className="mb-4">
				<div className="flex items-center gap-2 mb-2">
					<span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tool:</span>
					<span className="text-sm text-gray-600 dark:text-gray-400">{toolName}</span>
				</div>

				<div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
					<p className="text-sm text-red-800 dark:text-red-200">{originalError}</p>
				</div>
			</div>

			{/* Error Classification */}
			{errorClassification && (
				<div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-md">
					<h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Error Analysis</h4>

					<div className="grid grid-cols-2 gap-2 text-sm">
						<div className="flex items-center gap-2">
							{getCategoryIcon(errorClassification.category)}
							<span className="text-gray-600 dark:text-gray-400">Category:</span>
							<span className="capitalize text-gray-800 dark:text-gray-200">
								{errorClassification.category.replace("_", " ")}
							</span>
						</div>

						<div className="flex items-center gap-2">
							<span className="text-gray-600 dark:text-gray-400">Severity:</span>
							<span className={`capitalize ${getSeverityColor(errorClassification.severity)}`}>
								{errorClassification.severity}
							</span>
						</div>

						<div className="flex items-center gap-2">
							<span className="text-gray-600 dark:text-gray-400">Retryable:</span>
							<span className={errorClassification.isRetryable ? "text-green-600" : "text-red-600"}>
								{errorClassification.isRetryable ? "Yes" : "No"}
							</span>
						</div>

						<div className="flex items-center gap-2">
							<span className="text-gray-600 dark:text-gray-400">Strategy:</span>
							<span className="capitalize text-gray-800 dark:text-gray-200">
								{errorClassification.backoffStrategy}
							</span>
						</div>
					</div>

					{errorClassification.triggerCircuitBreaker && (
						<div className="mt-2 flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400">
							<Shield className="w-4 h-4" />
							<span>This error will trigger the circuit breaker</span>
						</div>
					)}
				</div>
			)}

			{/* Recovery Suggestions */}
			{errorClassification && (
				<div className="mb-4">
					<h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Recovery Suggestions</h4>
					<div className="space-y-2">
						{getRecoverySuggestions().map((suggestion, index) => (
							<div
								key={index}
								className="flex items-start gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
								<Lightbulb className="w-4 h-4 text-blue-500 mt-0.5" />
								<div>
									<p className="text-sm font-medium text-blue-800 dark:text-blue-200">
										{suggestion.title}
									</p>
									<p className="text-xs text-blue-600 dark:text-blue-400">{suggestion.description}</p>
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Context Optimization */}
			{contextOptimizationAvailable && (
				<div className="mb-4">
					<div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
						<div className="flex items-center gap-2">
							<Zap className="w-4 h-4 text-yellow-600" />
							<span className="text-sm text-yellow-800 dark:text-yellow-200">
								Context optimization can help reduce token usage
							</span>
						</div>
						<button
							onClick={handleOptimizeContext}
							className="px-3 py-1 text-xs font-medium text-yellow-700 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-800 rounded hover:bg-yellow-200 dark:hover:bg-yellow-700 transition-colors">
							Optimize Context
						</button>
					</div>
				</div>
			)}

			{/* Action Buttons */}
			<div className="flex flex-wrap gap-2">
				{retryState && errorClassification?.isRetryable && (
					<button
						onClick={handleManualRetry}
						className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors">
						<RefreshCw className="w-4 h-4" />
						Retry Now
					</button>
				)}

				{retryState && (
					<button
						onClick={handleCancelRetry}
						className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900 rounded hover:bg-red-200 dark:hover:bg-red-800 transition-colors">
						<XCircle className="w-4 h-4" />
						Cancel Retry
					</button>
				)}

				{errorClassification?.triggerCircuitBreaker && (
					<button
						onClick={handleResetCircuitBreaker}
						className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-orange-700 dark:text-orange-300 bg-orange-100 dark:bg-orange-900 rounded hover:bg-orange-200 dark:hover:bg-orange-800 transition-colors">
						<Shield className="w-4 h-4" />
						Reset Circuit Breaker
					</button>
				)}
			</div>
		</div>
	)
}
