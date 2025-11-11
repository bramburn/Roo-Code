import { useState, useEffect, useCallback } from "react"
import { vscode } from "../utils/vscode"
export const useRetryIntegration = (options = {}) => {
	const [retryState, setRetryState] = useState()
	const [retrySettings, setRetrySettings] = useState({
		enabled: true,
		maxAttempts: 3,
		baseDelay: 1000,
		maxDelay: 30000,
		backoffStrategy: "exponential",
		jitterFactor: 0.1,
		circuitBreakerThreshold: 5,
		circuitBreakerResetTime: 60000,
		contextOptimizationEnabled: true,
		contextOptimizationThreshold: 4000,
	})
	const [metrics, setMetrics] = useState({
		totalRetries: 0,
		successfulRetries: 0,
		failedRetries: 0,
		averageAttempts: 0,
		totalRetryTime: 0,
		circuitBreakerActivations: 0,
		contextOptimizations: 0,
		toolSpecificMetrics: {},
	})
	const [history, setHistory] = useState([])
	// Load initial settings from backend
	useEffect(() => {
		vscode.postMessage({
			type: "retry-get-settings",
		})
		vscode.postMessage({
			type: "retry-get-metrics",
		})
		vscode.postMessage({
			type: "retry-get-history",
		})
	}, [])
	// Handle messages from backend
	useEffect(() => {
		const handleMessage = (event) => {
			const message = event.data
			switch (message.type) {
				case "retry-state-updated":
					if (message.retryState) {
						setRetryState(message.retryState)
					}
					break
				case "retry-settings-updated":
					if (message.settings) {
						setRetrySettings(message.settings)
					}
					break
				case "retry-metrics-updated":
					if (message.metrics) {
						setMetrics(message.metrics)
					}
					break
				case "retry-history-updated":
					if (message.history) {
						setHistory(message.history)
					}
					break
				case "retry-tool-execution":
					// Handle retry status during tool execution
					if (message.retryState && options.autoShowRetryStatus) {
						setRetryState(message.retryState)
					}
					break
				case "retry-tool-error":
					// Handle tool errors and show recovery
					if (message.error && options.autoShowErrorRecovery) {
						// Auto-show error recovery for tool-specific errors
						setRetryState(message.retryState)
					}
					break
			}
		}
		window.addEventListener("message", handleMessage)
		return () => window.removeEventListener("message", handleMessage)
	}, [options])
	const updateRetrySettings = useCallback((settings) => {
		setRetrySettings(settings)
		vscode.postMessage({
			type: "retry-update-settings",
			settings,
		})
	}, [])
	const showRetryStatus = useCallback(() => {
		vscode.postMessage({
			type: "retry-show-status",
		})
	}, [])
	const showErrorRecovery = useCallback(() => {
		vscode.postMessage({
			type: "retry-show-recovery",
		})
	}, [])
	const manualRetry = useCallback(() => {
		if (!retryState) return
		vscode.postMessage({
			type: "retry-manual",
			retryId: retryState.id,
			action: "immediate-retry",
		})
	}, [retryState])
	const cancelRetry = useCallback(() => {
		if (!retryState) return
		vscode.postMessage({
			type: "retry-cancel",
			retryId: retryState.id,
		})
	}, [retryState])
	const optimizeContext = useCallback(() => {
		if (!retryState) return
		vscode.postMessage({
			type: "retry-optimize-context",
			retryId: retryState.id,
		})
	}, [retryState])
	const isRetrying = Boolean(retryState?.isActive)
	return {
		retryState,
		retrySettings,
		metrics,
		history,
		isRetrying,
		showRetryStatus,
		showErrorRecovery,
		updateRetrySettings,
		manualRetry,
		cancelRetry,
		optimizeContext,
	}
}
// Hook for retry status during tool execution feedback
export const useRetryStatusFeedback = (toolName) => {
	const [retryStatus, setRetryStatus] = useState({
		isRetrying: false,
	})
	useEffect(() => {
		const handleMessage = (event) => {
			const message = event.data
			switch (message.type) {
				case "tool-execution-start":
					if (message.toolName === toolName) {
						setRetryStatus({
							isRetrying: false,
						})
					}
					break
				case "tool-execution-retry":
					if (message.toolName === toolName) {
						setRetryStatus({
							isRetrying: true,
							attempt: message.attempt,
							maxAttempts: message.maxAttempts,
							error: message.error,
						})
					}
					break
				case "tool-execution-success":
					if (message.toolName === toolName) {
						setRetryStatus({
							isRetrying: false,
						})
					}
					break
				case "tool-execution-error":
					if (message.toolName === toolName) {
						setRetryStatus({
							isRetrying: false,
							error: message.error,
						})
					}
					break
			}
		}
		window.addEventListener("message", handleMessage)
		return () => window.removeEventListener("message", handleMessage)
	}, [toolName])
	return retryStatus
}
//# sourceMappingURL=useRetryIntegration.js.map
