import React, { useState, useEffect } from "react"
import { X, CheckCircle, AlertTriangle, Info, RefreshCw, Zap } from "lucide-react"
import { RetryNotification, RetryState } from "../../types/retry"
import { vscode } from "../../utils/vscode"

interface RetryNotificationsProps {
	notifications: RetryNotification[]
	retryStates: Record<string, RetryState>
	onDismissNotification: (id: string) => void
	className?: string
}

export const RetryNotifications: React.FC<RetryNotificationsProps> = ({
	notifications,
	retryStates,
	onDismissNotification,
	className = "",
}) => {
	const [visibleNotifications, setVisibleNotifications] = useState<RetryNotification[]>([])

	useEffect(() => {
		// Show new notifications
		const newNotifications = notifications.filter((notif) => !visibleNotifications.find((v) => v.id === notif.id))

		if (newNotifications.length > 0) {
			setVisibleNotifications((prev) => [...prev, ...newNotifications])

			// Auto-dismiss success notifications after 3 seconds
			newNotifications.forEach((notif) => {
				if (notif.type === "retry-success") {
					setTimeout(() => onDismissNotification(notif.id), 3000)
				}
			})
		}

		// Remove dismissed notifications
		setVisibleNotifications((prev) => prev.filter((notif) => notifications.find((n) => n.id === notif.id)))
	}, [notifications, onDismissNotification, visibleNotifications])

	const getNotificationIcon = (type: RetryNotification["type"]) => {
		switch (type) {
			case "retry-started":
				return <RefreshCw className="w-4 h-4 text-blue-500" />
			case "retry-progress":
				return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
			case "retry-success":
				return <CheckCircle className="w-4 h-4 text-green-500" />
			case "retry-failed":
				return <X className="w-4 h-4 text-red-500" />
			case "retry-cancelled":
				return <AlertTriangle className="w-4 h-4 text-yellow-500" />
			default:
				return <Info className="w-4 h-4 text-gray-500" />
		}
	}

	const getNotificationColor = (type: RetryNotification["type"]) => {
		switch (type) {
			case "retry-started":
				return "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20"
			case "retry-progress":
				return "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20"
			case "retry-success":
				return "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
			case "retry-failed":
				return "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
			case "retry-cancelled":
				return "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20"
			default:
				return "border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/20"
		}
	}

	const formatNotificationMessage = (notification: RetryNotification) => {
		const { message, data } = notification

		// Replace placeholders with actual values
		let formattedMessage = message
		if (data) {
			if (data.toolName) {
				formattedMessage = formattedMessage.replace(/{{tool}}/g, data.toolName)
			}
			if (data.attempt !== undefined) {
				formattedMessage = formattedMessage.replace(/{{attempt}}/g, data.attempt.toString())
			}
			if (data.maxAttempts !== undefined) {
				formattedMessage = formattedMessage.replace(/{{maxAttempts}}/g, data.maxAttempts.toString())
			}
		}

		return formattedMessage
	}

	const handleNotificationClick = (notification: RetryNotification) => {
		// Handle different notification actions
		switch (notification.type) {
			case "retry-started":
			case "retry-progress":
				// Focus on the retry state
				if (notification.retryId && retryStates[notification.retryId]) {
					vscode.postMessage({
						type: "retry-focus",
						retryId: notification.retryId,
					})
				}
				break
			case "retry-failed":
				// Show error recovery options
				if (notification.retryId && retryStates[notification.retryId]) {
					vscode.postMessage({
						type: "retry-show-recovery",
						retryId: notification.retryId,
					})
				}
				break
		}
	}

	if (visibleNotifications.length === 0) {
		return null
	}

	return (
		<div className={`fixed top-4 right-4 z-50 space-y-2 max-w-sm ${className}`}>
			{visibleNotifications.map((notification) => (
				<div
					key={notification.id}
					className={`flex items-start gap-3 p-3 rounded-lg border shadow-lg cursor-pointer transition-all duration-200 hover:shadow-xl ${getNotificationColor(
						notification.type,
					)}`}
					onClick={() => handleNotificationClick(notification)}>
					<div className="flex-shrink-0 mt-0.5">{getNotificationIcon(notification.type)}</div>

					<div className="flex-1 min-w-0">
						<div className="flex items-center justify-between mb-1">
							<p className="text-sm font-medium text-gray-900 dark:text-gray-100">
								{formatNotificationMessage(notification)}
							</p>
							<button
								onClick={(e) => {
									e.stopPropagation()
									onDismissNotification(notification.id)
								}}
								className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300">
								<X className="w-3 h-3" />
							</button>
						</div>

						{notification.timestamp && (
							<p className="text-xs text-gray-500 dark:text-gray-400">
								{new Date(notification.timestamp).toLocaleTimeString()}
							</p>
						)}

						{notification.data && (
							<div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
								{notification.data.toolName && <span>Tool: {notification.data.toolName}</span>}
								{notification.data.attempt !== undefined && (
									<span className="ml-2">
										Attempt: {notification.data.attempt}
										{notification.data.maxAttempts && `/${notification.data.maxAttempts}`}
									</span>
								)}
							</div>
						)}
					</div>
				</div>
			))}
		</div>
	)
}

// Progress indicator component for retry operations
interface RetryProgressIndicatorProps {
	retryState: RetryState
	className?: string
}

export const RetryProgressIndicator: React.FC<RetryProgressIndicatorProps> = ({ retryState, className = "" }) => {
	const [progress, setProgress] = useState(0)
	const [timeRemaining, setTimeRemaining] = useState(0)

	useEffect(() => {
		if (!retryState.isActive || !retryState.nextRetryTime) return

		const updateProgress = () => {
			const now = Date.now()
			const totalDuration = retryState.nextRetryTime - retryState.startTime
			const elapsed = now - retryState.startTime
			const newProgress = Math.min(100, (elapsed / totalDuration) * 100)

			setProgress(newProgress)
			setTimeRemaining(Math.max(0, retryState.nextRetryTime - now))
		}

		updateProgress()
		const interval = setInterval(updateProgress, 100)

		return () => clearInterval(interval)
	}, [retryState])

	const formatTime = (ms: number): string => {
		if (ms < 1000) return `${ms}ms`
		if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
		return `${(ms / 60000).toFixed(1)}m`
	}

	return (
		<div
			className={`flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg ${className}`}>
			<div className="flex-shrink-0">
				<RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
			</div>

			<div className="flex-1">
				<div className="flex items-center justify-between mb-2">
					<span className="text-sm font-medium text-blue-900 dark:text-blue-100">
						Retrying {retryState.toolName}...
					</span>
					<span className="text-sm text-blue-700 dark:text-blue-300">
						{retryState.currentAttempt}/{retryState.maxAttempts}
					</span>
				</div>

				{/* Progress bar */}
				<div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2 mb-2">
					<div
						className="bg-blue-500 h-2 rounded-full transition-all duration-300"
						style={{ width: `${progress}%` }}
					/>
				</div>

				{/* Time remaining */}
				{timeRemaining > 0 && (
					<div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
						<Zap className="w-3 h-3" />
						<span>Next retry in {formatTime(timeRemaining)}</span>
					</div>
				)}

				{/* Error details */}
				{retryState.errors.length > 0 && (
					<div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs">
						<p className="text-red-800 dark:text-red-200">
							Last error: {retryState.errors[retryState.errors.length - 1]}
						</p>
					</div>
				)}
			</div>
		</div>
	)
}
