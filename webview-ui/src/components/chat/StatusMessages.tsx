import React, { useState, useEffect, useCallback } from "react"
import { Button } from "../ui/button"

/**
 * Status message types
 */
export type StatusMessageType = "info" | "success" | "warning" | "error" | "loading" | "processing"

/**
 * Status message priority
 */
export type StatusPriority = "low" | "medium" | "high" | "critical"

/**
 * Status message action
 */
export interface StatusAction {
	label: string
	action: () => void
	variant?: "default" | "secondary" | "destructive"
	icon?: string
}

/**
 * Status message interface
 */
export interface StatusMessage {
	id: string
	type: StatusMessageType
	title: string
	description?: string
	actions?: StatusAction[]
	priority: StatusPriority
	timestamp: number
	autoHide?: boolean // Auto-hide after duration
	duration?: number // Auto-hide duration in ms
	persistent?: boolean // Cannot be dismissed
	progress?: number // For progress indicators (0-100)
	icon?: string // Custom icon
	technicalDetails?: string // Technical details for debugging
}

/**
 * Status message system props
 */
export interface StatusMessageSystemProps {
	messages: StatusMessage[]
	onDismiss: (messageId: string) => void
	onAction: (messageId: string, action: StatusAction) => void
	maxMessages?: number
	showTimestamps?: boolean
	groupSimilar?: boolean
	position?: "top" | "bottom" | "inline"
	className?: string
}

/**
 * Enhanced Status Message System
 * Provides contextual status messages with icons, actions, and smart grouping
 */
export const StatusMessageSystem: React.FC<StatusMessageSystemProps> = ({
	messages,
	onDismiss,
	onAction,
	maxMessages = 5,
	showTimestamps = true,
	groupSimilar = true,
	position = "top",
	className = "",
}) => {
	const [groupedMessages, setGroupedMessages] = useState<StatusMessage[]>([])

	// Get highest priority from a group
	const getHighestPriority = useCallback((messages: StatusMessage[]): StatusPriority => {
		const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
		return messages.reduce((highest, message) => {
			return priorityOrder[message.priority] > priorityOrder[highest] ? message.priority : highest
		}, "low" as StatusPriority)
	}, [])

	// Group similar messages function
	const groupSimilarMessages = useCallback(
		(messages: StatusMessage[]): StatusMessage[] => {
			const groups = new Map<string, StatusMessage[]>()

			messages.forEach((message) => {
				const key = `${message.type}:${message.title}`
				if (!groups.has(key)) {
					groups.set(key, [])
				}
				groups.get(key)!.push(message)
			})

			const grouped: StatusMessage[] = []
			groups.forEach((groupMessages, key) => {
				if (groupMessages.length === 1) {
					grouped.push(groupMessages[0])
				} else {
					// Create a grouped message
					const firstMessage = groupMessages[0]
					const groupedMessage: StatusMessage = {
						...firstMessage,
						id: `grouped:${key}`,
						title: `${firstMessage.title} (${groupMessages.length} messages)`,
						description: firstMessage.description,
						actions: [
							{
								label: "Show All",
								action: () => {
									// Expand to show individual messages
									groupMessages.forEach((msg) => onDismiss(msg.id))
								},
								variant: "secondary",
								icon: "📋",
							},
							...(firstMessage.actions || []),
						],
						priority: getHighestPriority(groupMessages),
					}
					grouped.push(groupedMessage)
				}
			})

			return grouped.sort((a, b) => {
				const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
				const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
				if (priorityDiff !== 0) return priorityDiff
				return b.timestamp - a.timestamp
			})
		},
		[onDismiss, getHighestPriority],
	)

	// Group similar messages
	useEffect(() => {
		if (groupSimilar) {
			const grouped = groupSimilarMessages(messages)
			setGroupedMessages(grouped.slice(0, maxMessages))
		} else {
			setGroupedMessages(messages.slice(0, maxMessages))
		}
	}, [messages, groupSimilar, maxMessages, groupSimilarMessages])

	// Auto-hide messages
	useEffect(() => {
		const timers: NodeJS.Timeout[] = []

		groupedMessages.forEach((message) => {
			if (message.autoHide && message.duration && message.duration > 0) {
				const timer = setTimeout(() => {
					onDismiss(message.id)
				}, message.duration)
				timers.push(timer)
			}
		})

		return () => {
			timers.forEach(clearTimeout)
		}
	}, [groupedMessages, onDismiss])

	// Get message type configuration
	const getMessageConfig = (type: StatusMessageType) => {
		switch (type) {
			case "success":
				return {
					icon: "✅",
					bgColor: "bg-green-50 border-green-200",
					textColor: "text-green-800",
					iconBgColor: "bg-green-500",
					borderColor: "border-green-500",
				}
			case "error":
				return {
					icon: "❌",
					bgColor: "bg-red-50 border-red-200",
					textColor: "text-red-800",
					iconBgColor: "bg-red-500",
					borderColor: "border-red-500",
				}
			case "warning":
				return {
					icon: "⚠️",
					bgColor: "bg-yellow-50 border-yellow-200",
					textColor: "text-yellow-800",
					iconBgColor: "bg-yellow-500",
					borderColor: "border-yellow-500",
				}
			case "info":
				return {
					icon: "ℹ️",
					bgColor: "bg-blue-50 border-blue-200",
					textColor: "text-blue-800",
					iconBgColor: "bg-blue-500",
					borderColor: "border-blue-500",
				}
			case "loading":
				return {
					icon: "⏳",
					bgColor: "bg-gray-50 border-gray-200",
					textColor: "text-gray-800",
					iconBgColor: "bg-gray-500",
					borderColor: "border-gray-500",
				}
			case "processing":
				return {
					icon: "🔄",
					bgColor: "bg-purple-50 border-purple-200",
					textColor: "text-purple-800",
					iconBgColor: "bg-purple-500",
					borderColor: "border-purple-500",
				}
			default:
				return {
					icon: "📢",
					bgColor: "bg-gray-50 border-gray-200",
					textColor: "text-gray-800",
					iconBgColor: "bg-gray-500",
					borderColor: "border-gray-500",
				}
		}
	}

	// Get position classes
	const getPositionClasses = () => {
		switch (position) {
			case "top":
				return "top-4 right-4 flex-col-reverse"
			case "bottom":
				return "bottom-4 right-4 flex-col"
			default:
				return "flex-col"
		}
	}

	return (
		<div className={`fixed z-50 flex ${getPositionClasses()} space-y-2 max-w-md ${className}`}>
			{groupedMessages.map((message) => {
				const config = getMessageConfig(message.type)

				return (
					<StatusMessageItem
						key={message.id}
						message={message}
						config={config}
						showTimestamp={showTimestamps}
						onDismiss={onDismiss}
						onAction={onAction}
					/>
				)
			})}
		</div>
	)
}

/**
 * Individual Status Message Item
 */
const StatusMessageItem: React.FC<{
	message: StatusMessage
	config: any
	showTimestamp: boolean
	onDismiss: (messageId: string) => void
	onAction: (messageId: string, action: StatusAction) => void
}> = ({ message, config, showTimestamp, onDismiss, onAction }) => {
	const [isExpanded, setIsExpanded] = useState(false)
	const [isAnimating, setIsAnimating] = useState(false)

	// Handle dismiss
	const handleDismiss = () => {
		if (!message.persistent) {
			setIsAnimating(true)
			setTimeout(() => {
				onDismiss(message.id)
			}, 200)
		}
	}

	// Handle action
	const handleAction = (action: StatusAction) => {
		action.action()
		onAction(message.id, action)
	}

	return (
		<div
			className={`
				relative flex items-start space-x-3 p-4 rounded-lg border shadow-lg
				transition-all duration-300 ease-in-out transform
				${config.bgColor} ${config.borderColor}
				${isAnimating ? "scale-95 opacity-0" : "scale-100 opacity-100"}
				${message.priority === "critical" ? "ring-2 ring-red-500 ring-offset-2" : ""}
			`}
			role="alert"
			aria-live={message.priority === "critical" ? "assertive" : "polite"}>
			{/* Icon */}
			<div
				className={`
				flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white
				${config.iconBgColor}
				${message.type === "loading" || message.type === "processing" ? "animate-pulse" : ""}
			`}>
				{message.icon || config.icon}
			</div>

			{/* Content */}
			<div className="flex-1 min-w-0">
				<div className="flex items-start justify-between">
					<div className="flex-1">
						<h4 className={`text-sm font-medium ${config.textColor}`}>{message.title}</h4>

						{message.description && (
							<p className={`mt-1 text-sm ${config.textColor} opacity-80`}>{message.description}</p>
						)}

						{/* Progress bar for messages with progress */}
						{message.progress !== undefined && (
							<div className="mt-2">
								<div className="w-full bg-gray-200 rounded-full h-2">
									<div
										className="bg-blue-500 h-2 rounded-full transition-all duration-300"
										style={{ width: `${message.progress}%` }}
									/>
								</div>
								<div className="text-xs text-gray-500 mt-1">
									{Math.round(message.progress)}% complete
								</div>
							</div>
						)}

						{/* Actions */}
						{message.actions && message.actions.length > 0 && (
							<div className="mt-3 flex flex-wrap gap-2">
								{message.actions.map((action, index) => (
									<Button
										key={index}
										onClick={() => handleAction(action)}
										variant={action.variant || "default"}
										size="sm"
										className="text-xs">
										{action.icon && <span className="mr-1">{action.icon}</span>}
										{action.label}
									</Button>
								))}
							</div>
						)}

						{/* Technical details (expandable) */}
						{message.technicalDetails && (
							<div className="mt-2">
								<button
									onClick={() => setIsExpanded(!isExpanded)}
									className="text-xs text-gray-500 hover:text-gray-700 underline">
									{isExpanded ? "Hide" : "Show"} technical details
								</button>
								{isExpanded && (
									<pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
										{message.technicalDetails}
									</pre>
								)}
							</div>
						)}
					</div>

					{/* Dismiss button */}
					{!message.persistent && (
						<button
							onClick={handleDismiss}
							className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
							aria-label="Dismiss message">
							×
						</button>
					)}
				</div>

				{/* Timestamp */}
				{showTimestamp && (
					<div className="text-xs text-gray-500 mt-1">{formatTimestamp(message.timestamp)}</div>
				)}
			</div>

			{/* Priority indicator */}
			{message.priority === "critical" && (
				<div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
			)}
		</div>
	)
}

/**
 * Format timestamp helper
 */
const formatTimestamp = (timestamp: number): string => {
	const now = Date.now()
	const diff = now - timestamp

	if (diff < 60000) return "just now"
	if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
	if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
	return new Date(timestamp).toLocaleDateString()
}

/**
 * Hook for managing status messages
 */
export const useStatusMessages = () => {
	const [messages, setMessages] = useState<StatusMessage[]>([])

	// Add a message
	const addMessage = (message: Omit<StatusMessage, "id" | "timestamp">) => {
		const newMessage: StatusMessage = {
			...message,
			id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
			timestamp: Date.now(),
		}

		setMessages((prev) => [...prev, newMessage])

		// Auto-hide if specified
		if (newMessage.autoHide && newMessage.duration && newMessage.duration > 0) {
			setTimeout(() => {
				dismissMessage(newMessage.id)
			}, newMessage.duration)
		}

		return newMessage.id
	}

	// Dismiss a message
	const dismissMessage = (messageId: string) => {
		setMessages((prev) => prev.filter((msg) => msg.id !== messageId))
	}

	// Clear all messages
	const clearMessages = () => {
		setMessages([])
	}

	// Clear messages by type
	const clearMessagesByType = (type: StatusMessageType) => {
		setMessages((prev) => prev.filter((msg) => msg.type !== type))
	}

	// Update a message
	const updateMessage = (messageId: string, updates: Partial<StatusMessage>) => {
		setMessages((prev) => prev.map((msg) => (msg.id === messageId ? { ...msg, ...updates } : msg)))
	}

	// Convenience methods
	const showInfo = (title: string, description?: string, options?: Partial<StatusMessage>) =>
		addMessage({ type: "info", title, description, priority: "medium", ...options })

	const showSuccess = (title: string, description?: string, options?: Partial<StatusMessage>) =>
		addMessage({ type: "success", title, description, priority: "low", ...options })

	const showWarning = (title: string, description?: string, options?: Partial<StatusMessage>) =>
		addMessage({ type: "warning", title, description, priority: "high", ...options })

	const showError = (title: string, description?: string, options?: Partial<StatusMessage>) =>
		addMessage({ type: "error", title, description, priority: "high", persistent: true, ...options })

	const showLoading = (title: string, description?: string, options?: Partial<StatusMessage>) =>
		addMessage({ type: "loading", title, description, priority: "medium", ...options })

	const showProcessing = (title: string, description?: string, options?: Partial<StatusMessage>) =>
		addMessage({ type: "processing", title, description, priority: "medium", ...options })

	return {
		messages,
		addMessage,
		dismissMessage,
		clearMessages,
		clearMessagesByType,
		updateMessage,
		showInfo,
		showSuccess,
		showWarning,
		showError,
		showLoading,
		showProcessing,
	}
}

export default StatusMessageSystem
