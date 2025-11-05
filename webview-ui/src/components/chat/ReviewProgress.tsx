import React, { useState, useEffect, useCallback } from "react"
import { Button } from "../ui/button"
import { type ManualReviewStatus } from "../../../../src/core/condense/manual-review"

interface ReviewProgressProps {
	status: ManualReviewStatus | null
	onFallback?: () => void
	onFileOpen?: (filepath: string) => void
}

/**
 * Review Progress Component
 * Displays visual progress indicators for manual review
 */
export const ReviewProgress: React.FC<ReviewProgressProps> = ({ status, onFallback, onFileOpen }) => {
	const [animatedProgress, setAnimatedProgress] = useState(0)

	// Format time display
	const formatTime = (ms: number): string => {
		const minutes = Math.floor(ms / 60000)
		const seconds = Math.floor((ms % 60000) / 1000)
		return `${minutes}:${seconds.toString().padStart(2, "0")}`
	}

	// Calculate progress percentage
	const getProgressPercentage = useCallback((): number => {
		if (!status || status.timeoutDuration === 0) return 0
		const elapsed = status.timeoutDuration - (status.remainingTime || 0)
		return Math.min(100, (elapsed / status.timeoutDuration) * 100)
	}, [status])

	// Animate progress bar
	useEffect(() => {
		if (status && status.state === "waiting") {
			const targetProgress = getProgressPercentage()
			const timer = setTimeout(() => {
				setAnimatedProgress(targetProgress)
			}, 100) // Small delay for smooth animation
			return () => clearTimeout(timer)
		} else {
			setAnimatedProgress(0)
		}
	}, [status, getProgressPercentage])

	// Get status icon and color
	const getStatusInfo = () => {
		switch (status?.state) {
			case "waiting":
				return { icon: "⏳", color: "text-yellow-500", bgColor: "bg-yellow-500/10" }
			case "completed":
				return { icon: "✅", color: "text-green-500", bgColor: "bg-green-500/10" }
			case "timeout":
				return { icon: "⏰", color: "text-red-500", bgColor: "bg-red-500/10" }
			case "fallback":
				return { icon: "🔄", color: "text-blue-500", bgColor: "bg-blue-500/10" }
			default:
				return { icon: "⏸", color: "text-gray-500", bgColor: "bg-gray-500/10" }
		}
	}

	// Get status text
	const getStatusText = (): string => {
		switch (status?.state) {
			case "waiting":
				return "Waiting for manual context review..."
			case "completed":
				return "Review completed successfully"
			case "timeout":
				return "Review timed out - using intelligent compression"
			case "fallback":
				return "Using intelligent compression instead"
			default:
				return "Unknown status"
		}
	}

	const statusInfo = getStatusInfo()

	if (!status) {
		return (
			<div className="flex flex-col items-center justify-center p-8">
				<div className="text-center text-vscode-descriptionForeground">Loading review progress...</div>
			</div>
		)
	}

	return (
		<div className="flex flex-col items-center justify-center p-6 border border-vscode-editor-border rounded-lg bg-vscode-editor-background">
			{/* Status Icon with background */}
			<div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${statusInfo.bgColor}`}>
				<div className="text-2xl">{statusInfo.icon}</div>
			</div>

			{/* Status Text */}
			<div className={`text-lg font-medium mb-4 ${statusInfo.color}`}>{getStatusText()}</div>

			{/* Progress Section for waiting state */}
			{status.state === "waiting" && (
				<div className="w-full max-w-md space-y-3">
					{/* Progress Bar */}
					<div className="relative">
						<div className="w-full bg-vscode-progress-background rounded-full h-3 overflow-hidden">
							<div
								className="bg-gradient-to-r from-vscode-progress-foreground to-vscode-progress-foreground h-3 rounded-full transition-all duration-1000 ease-out relative"
								style={{ width: `${animatedProgress}%` }}>
								{/* Animated shine effect */}
								<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
							</div>
						</div>

						{/* Progress percentage */}
						<div className="absolute -top-6 right-0 text-xs text-vscode-descriptionForeground">
							{Math.round(getProgressPercentage())}%
						</div>
					</div>

					{/* Time remaining with pulse animation */}
					<div className="text-center">
						<div className="text-sm text-vscode-descriptionForeground">Time remaining</div>
						<div
							className={`text-lg font-mono font-medium text-vscode-foreground ${
								status.remainingTime && status.remainingTime < 60000 ? "animate-pulse text-red-500" : ""
							}`}>
							{formatTime(status.remainingTime || 0)}
						</div>
					</div>

					{/* Warning when time is running out */}
					{status.remainingTime && status.remainingTime < 60000 && (
						<div className="text-xs text-red-500 text-center animate-pulse">
							⚠️ Less than 1 minute remaining
						</div>
					)}
				</div>
			)}

			{/* Action Buttons */}
			{(status.state === "waiting" || status.state === "timeout") && (
				<div className="mt-6 space-y-2 w-full max-w-md">
					{status.state === "waiting" && status.contextFile && (
						<Button
							onClick={() => onFileOpen?.(status.contextFile!)}
							variant="secondary"
							className="w-full">
							📝 Open Context File
						</Button>
					)}

					<Button onClick={() => onFallback?.()} variant="default" className="w-full">
						🚀 Use Intelligent Compression Instead
					</Button>
				</div>
			)}

			{/* Context File Info */}
			{status.contextFile && (
				<div className="mt-6 p-4 bg-vscode-input-background rounded-lg border border-vscode-editor-border w-full max-w-md">
					<div className="flex items-center justify-between mb-2">
						<div className="text-sm font-medium text-vscode-foreground">📄 Context File</div>
						{status.state === "waiting" && (
							<div className="text-xs text-yellow-500 animate-pulse">• Pending Review</div>
						)}
					</div>

					<div className="text-xs text-vscode-descriptionForeground font-mono truncate mb-2">
						{status.contextFile.split("/").pop()}
					</div>

					<div className="text-xs text-vscode-descriptionForeground">
						{status.state === "waiting"
							? "Review the context file and make your edits. Changes will be detected automatically."
							: status.state === "completed"
								? "Context file has been reviewed and processed."
								: "Context file review was completed via fallback."}
					</div>
				</div>
			)}

			{/* Additional Status Information */}
			{status.startTime && (
				<div className="mt-4 text-xs text-vscode-descriptionForeground text-center">
					Started: {new Date(status.startTime).toLocaleTimeString()}
				</div>
			)}
		</div>
	)
}
