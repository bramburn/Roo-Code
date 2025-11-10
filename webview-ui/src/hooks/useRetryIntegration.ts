import { useState, useEffect, useCallback } from "react"
import { RetryState, RetrySettings, RetryMetrics, RetryHistory } from "../types/retry"
import { vscode } from "../utils/vscode"

interface UseRetryIntegrationOptions {
	toolName?: string
	autoShowRetryStatus?: boolean
	autoShowErrorRecovery?: boolean
}

interface UseRetryIntegrationReturn {
	retryState?: RetryState
	retrySettings: RetrySettings
	metrics: RetryMetrics
	history: RetryHistory[]
	isRetrying: boolean
	showRetryStatus: () => void
	showErrorRecovery: () => void
	updateRetrySettings: (settings: RetrySettings) => void
	manualRetry: () => void
	cancelRetry: () => void
	optimizeContext: () => void
}

export const useRetryIntegration = (options: UseRetryIntegrationOptions = {}): UseRetryIntegrationReturn => {
	const [retryState, setRetryState] = useState<RetryState | undefined>()
	const [retrySettings, setRetrySettings] = useState<RetrySettings>({
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
	const [metrics, setMetrics] = useState<RetryMetrics>({
		totalRetries: 0,
		successfulRetries: 0,
		failedRetries: 0,
		averageAttempts: 0,
		totalRetryTime: 0,
		circuitBreakerActivations: 0,
		contextOptimizations: 0,
		toolSpecificMetrics: {},
	})
	const [history, setHistory] = useState<RetryHistory[]>([])

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
		const handleMessage = (event: MessageEvent) => {
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

	const updateRetrySettings = useCallback((settings: RetrySettings) => {
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
export const useRetryStatusFeedback = (toolName: string) => {
	const [retryStatus, setRetryStatus] = useState<{
		isRetrying: boolean
		attempt?: number
		maxAttempts?: number
		error?: string
	}>({
		isRetrying: false,
	})

	useEffect(() => {
		const handleMessage = (event: MessageEvent) => {
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
