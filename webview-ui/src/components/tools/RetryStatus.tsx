import React, { useState, useEffect } from "react"
import { Clock, RefreshCw, AlertCircle, CheckCircle, XCircle } from "lucide-react"
import { RetryState, RetryStatusVariant } from "../../types/retry"
// import { vscode } from "../../utils/vscode" // eslint-disable-line @typescript-eslint/no-unused-vars

interface RetryStatusProps {
	retryState?: RetryState
	variant?: RetryStatusVariant
	showDetails?: boolean
	className?: string
}

export const RetryStatus: React.FC<RetryStatusProps> = ({
	retryState,
	variant = "default",
	showDetails = false,
	className = "",
}) => {
	const [timeUntilNext, setTimeUntilNext] = useState<number>(0)

	useEffect(() => {
		if (!retryState?.isActive || !retryState.nextRetryTime) return

		const updateTimer = () => {
			const now = Date.now()
			const timeLeft = Math.max(0, retryState.nextRetryTime - now)
			setTimeUntilNext(timeLeft)
		}

		updateTimer()
		const interval = setInterval(updateTimer, 100)

		return () => clearInterval(interval)
	}, [retryState?.nextRetryTime, retryState?.isActive])

	const formatTime = (ms: number): string => {
		if (ms < 1000) return `${ms}ms`
		if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
		return `${(ms / 60000).toFixed(1)}m`
	}

	const getProgressPercentage = (): number => {
		if (!retryState) return 0
		return (retryState.currentAttempt / retryState.maxAttempts) * 100
	}

	const getStatusIcon = () => {
		if (!retryState) return <Clock className="w-4 h-4" />

		if (retryState.isCancelled) {
			return <XCircle className="w-4 h-4 text-red-500" />
		}

		if (!retryState.isActive) {
			return retryState.currentAttempt >= retryState.maxAttempts ? (
				<XCircle className="w-4 h-4 text-red-500" />
			) : (
				<CheckCircle className="w-4 h-4 text-green-500" />
			)
		}

		return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
	}

	const getStatusText = (): string => {
		if (!retryState) return "No retry in progress"

		if (retryState.isCancelled) return "Retry Cancelled"
		if (!retryState.isActive) {
			return retryState.currentAttempt >= retryState.maxAttempts ? "Retry Failed" : "Retry Completed"
		}

		return "Retrying"
	}

	const renderDefaultVariant = () => (
		<div className={`p-4 border rounded-lg bg-white dark:bg-gray-800 ${className}`}>
			<div className="flex items-center justify-between mb-3">
				<div className="flex items-center gap-2">
					{getStatusIcon()}
					<h3 className="font-medium text-gray-900 dark:text-gray-100">{getStatusText()}</h3>
					{retryState && (
						<span className="text-sm text-gray-500 dark:text-gray-400">{retryState.toolName}</span>
					)}
				</div>
				{retryState && (
					<span className="text-sm font-medium text-gray-600 dark:text-gray-300">
						Attempt {retryState.currentAttempt} of {retryState.maxAttempts}
					</span>
				)}
			</div>

			{retryState && (
				<>
					{/* Progress Bar */}
					<div className="mb-3">
						<div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
							<div
								className="bg-blue-500 h-2 rounded-full transition-all duration-300"
								style={{ width: `${getProgressPercentage()}%` }}
							/>
						</div>
					</div>

					{/* Timer */}
					{retryState.isActive && retryState.nextRetryTime && (
						<div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
							<Clock className="w-3 h-3" />
							<span>Next retry in {formatTime(timeUntilNext)}</span>
						</div>
					)}

					{/* Error Details */}
					{(showDetails || retryState.errors.length > 0) && (
						<div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-md">
							<div className="flex items-center gap-2 mb-2">
								<AlertCircle className="w-4 h-4 text-yellow-500" />
								<span className="text-sm font-medium text-gray-700 dark:text-gray-300">
									Error Details
								</span>
							</div>
							<p className="text-sm text-gray-600 dark:text-gray-400">{retryState.originalError}</p>
							{retryState.errors.length > 1 && (
								<div className="mt-2 text-xs text-gray-500 dark:text-gray-500">
									Previous attempts: {retryState.errors.slice(0, -1).join(", ")}
								</div>
							)}
						</div>
					)}
				</>
			)}
		</div>
	)

	const renderCompactVariant = () => (
		<div className={`flex items-center gap-2 p-2 border rounded bg-white dark:bg-gray-800 ${className}`}>
			{getStatusIcon()}
			{retryState ? (
				<>
					<span className="text-sm font-medium text-gray-900 dark:text-gray-100">{retryState.toolName}</span>
					<span className="text-xs text-gray-500 dark:text-gray-400">
						{retryState.currentAttempt}/{retryState.maxAttempts}
					</span>
					{retryState.isActive && timeUntilNext > 0 && (
						<span className="text-xs text-blue-600 dark:text-blue-400">{formatTime(timeUntilNext)}</span>
					)}
				</>
			) : (
				<span className="text-sm text-gray-500 dark:text-gray-400">No retry in progress</span>
			)}
		</div>
	)

	const renderMinimalVariant = () => (
		<div className={`flex items-center gap-1 ${className}`}>
			{getStatusIcon()}
			{retryState && (
				<span className="text-xs text-gray-600 dark:text-gray-400">
					{retryState.currentAttempt}/{retryState.maxAttempts}
				</span>
			)}
		</div>
	)

	switch (variant) {
		case "compact":
			return renderCompactVariant()
		case "minimal":
			return renderMinimalVariant()
		default:
			return renderDefaultVariant()
	}
}
