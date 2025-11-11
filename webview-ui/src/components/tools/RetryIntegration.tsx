import React, { useState, useEffect } from "react"
import { Settings, BarChart3, AlertTriangle, RefreshCw } from "lucide-react"
import { useAppTranslation } from "@src/i18n/TranslationContext"
import type { RetryState, RetrySettings, RetryMetrics, RetryHistory, ErrorClassification } from "../../types/retry"
import { vscode } from "../../utils/vscode"
import { RetryStatus } from "./RetryStatus"
import { ErrorRecovery } from "./ErrorRecovery"
import { RetryNotifications } from "./RetryNotifications"
import { RetryProgressIndicator } from "./RetryNotifications"
import { RetryMetricsPanel } from "./RetryMetrics"
import { RetrySettingsPanel } from "../settings/RetrySettings"

interface RetryIntegrationProps {
	// Current retry state
	retryState?: RetryState

	// Retry configuration
	retrySettings: RetrySettings
	onRetrySettingsChange: (settings: RetrySettings) => void

	// Error classification and recovery
	errorClassification?: ErrorClassification
	toolName: string
	originalError: string
	contextOptimizationAvailable?: boolean

	// Metrics and history
	metrics: RetryMetrics
	history: RetryHistory[]

	// UI state
	showRetryStatus?: boolean
	showErrorRecovery?: boolean
	showMetrics?: boolean
	showSettings?: boolean

	// Custom className
	className?: string
}

export const RetryIntegration: React.FC<RetryIntegrationProps> = ({
	retryState,
	retrySettings,
	onRetrySettingsChange,
	errorClassification,
	toolName,
	originalError,
	contextOptimizationAvailable = false,
	metrics,
	history,
	showRetryStatus = true,
	showErrorRecovery = false,
	showMetrics = false,
	showSettings = false,
	className = "",
}) => {
	const { t } = useAppTranslation()
	const [activeTab, setActiveTab] = useState<"status" | "recovery" | "metrics" | "settings">("status")
	const [notifications, setNotifications] = useState<any[]>([])

	useEffect(() => {
		// Listen for retry-related messages from backend
		const handleMessage = (event: MessageEvent) => {
			const message = event.data

			switch (message.type) {
				case "retry-state-updated":
					// Handle retry state updates
					break
				case "retry-error-occurred":
					// Handle retry errors
					setNotifications((prev) => [
						...prev,
						{
							id: `retry-error-${Date.now()}`,
							type: "retry-failed",
							message: t("recovery.errorOccurred", { tool: toolName }),
							timestamp: Date.now(),
							data: {
								toolName,
								error: message.error,
							},
						},
					])
					break
				case "retry-completed":
					// Handle retry completion
					setNotifications((prev) => [
						...prev,
						{
							id: `retry-success-${Date.now()}`,
							type: "retry-success",
							message: t("retryStatus.success", { tool: toolName, attempts: message.attempts }),
							timestamp: Date.now(),
							data: {
								toolName,
								attempts: message.attempts,
							},
						},
					])
					break
				case "retry-settings-updated":
					// Handle settings updates
					if (message.settings) {
						onRetrySettingsChange(message.settings)
					}
					break
			}
		}

		window.addEventListener("message", handleMessage)
		return () => window.removeEventListener("message", handleMessage)
	}, [toolName, onRetrySettingsChange, t])

	const _handleManualRetry = () => {
		if (!retryState) return

		vscode.postMessage({
			type: "retry-manual",
			retryId: retryState.id,
			action: "immediate-retry",
		})
	}

	const handleCancelRetry = () => {
		if (!retryState) return

		vscode.postMessage({
			type: "retry-cancel",
			retryId: retryState.id,
		})
	}

	const handleOptimizeContext = () => {
		if (!retryState) return

		vscode.postMessage({
			type: "retry-optimize-context",
			retryId: retryState.id,
		})
	}

	const _handleResetCircuitBreaker = () => {
		vscode.postMessage({
			type: "retry-reset-circuit-breaker",
			toolName,
		})
	}

	const dismissNotification = (id: string) => {
		setNotifications((prev) => prev.filter((n) => n.id !== id))
	}

	const retryStates = retryState ? { [retryState.id]: retryState } : {}

	return (
		<div className={`space-y-4 ${className}`}>
			{/* Notifications */}
			<RetryNotifications
				notifications={notifications}
				retryStates={retryStates}
				onDismissNotification={dismissNotification}
				className="fixed top-4 right-4 z-50"
			/>

			{/* Tab Navigation */}
			<div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
				<button
					onClick={() => setActiveTab("status")}
					className={`px-4 py-2 text-sm font-medium transition-colors ${
						activeTab === "status"
							? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
							: "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
					}`}>
					<RefreshCw className="w-4 h-4 mr-2" />
					{t("retryStatus.progress.label")}
				</button>

				{showErrorRecovery && (
					<button
						onClick={() => setActiveTab("recovery")}
						className={`px-4 py-2 text-sm font-medium transition-colors ${
							activeTab === "recovery"
								? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
								: "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
						}`}>
						<AlertTriangle className="w-4 h-4 mr-2" />
						{t("recovery.errorOccurred")}
					</button>
				)}

				{showMetrics && (
					<button
						onClick={() => setActiveTab("metrics")}
						className={`px-4 py-2 text-sm font-medium transition-colors ${
							activeTab === "metrics"
								? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
								: "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
						}`}>
						<BarChart3 className="w-4 h-4 mr-2" />
						Metrics
					</button>
				)}

				{showSettings && (
					<button
						onClick={() => setActiveTab("settings")}
						className={`px-4 py-2 text-sm font-medium transition-colors ${
							activeTab === "settings"
								? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
								: "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
						}`}>
						<Settings className="w-4 h-4 mr-2" />
						{t("retry.title")}
					</button>
				)}
			</div>

			{/* Tab Content */}
			<div className="bg-white dark:bg-gray-800 rounded-lg border">
				{/* Retry Status Tab */}
				{activeTab === "status" && showRetryStatus && (
					<div className="p-4">
						<h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
							{t("retryStatus.progress.label")}
						</h3>

						{retryState ? (
							<>
								<RetryStatus retryState={retryState} showDetails={true} className="mb-4" />

								{/* Quick Actions */}
								<div className="flex gap-2 mb-4">
									{retryState.isActive && (
										<button
											onClick={handleCancelRetry}
											className="px-3 py-2 text-sm font-medium text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900 rounded hover:bg-red-200 dark:hover:bg-red-800 transition-colors">
											Cancel Retry
										</button>
									)}

									{contextOptimizationAvailable && (
										<button
											onClick={handleOptimizeContext}
											className="px-3 py-2 text-sm font-medium text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors">
											Optimize Context
										</button>
									)}
								</div>

								{/* Progress Indicator */}
								<RetryProgressIndicator retryState={retryState} className="mt-4" />
							</>
						) : (
							<div className="text-center py-8 text-gray-500 dark:text-gray-400">
								<RefreshCw className="w-8 h-8 mx-auto mb-4 text-gray-300" />
								<p className="text-lg font-medium">No retry operations in progress</p>
								<p className="text-sm">
									Retry status will appear here when tool calls encounter errors
								</p>
							</div>
						)}
					</div>
				)}

				{/* Error Recovery Tab */}
				{activeTab === "recovery" && showErrorRecovery && (
					<div className="p-4">
						<ErrorRecovery
							retryState={retryState}
							errorClassification={errorClassification}
							toolName={toolName}
							originalError={originalError}
							contextOptimizationAvailable={contextOptimizationAvailable}
						/>
					</div>
				)}

				{/* Metrics Tab */}
				{activeTab === "metrics" && showMetrics && (
					<div className="p-4">
						<RetryMetricsPanel metrics={metrics} history={history} />
					</div>
				)}

				{/* Settings Tab */}
				{activeTab === "settings" && showSettings && (
					<div className="p-4">
						<div className="mb-4">
							<h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
								{t("retry.title")}
							</h3>
							<p className="text-sm text-gray-600 dark:text-gray-400">{t("retry.description")}</p>
						</div>

						<RetrySettingsPanel settings={retrySettings} onSettingsChange={onRetrySettingsChange} />
					</div>
				)}
			</div>
		</div>
	)
}
