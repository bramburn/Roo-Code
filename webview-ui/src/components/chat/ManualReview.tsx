import React, { useState, useEffect } from "react"
import { ReviewProgress } from "./ReviewProgress"
import { ManualReviewManager, type ManualReviewStatus } from "../../../../src/core/condense/manual-review"

interface ManualReviewProps {
	manualReviewManager?: ManualReviewManager
	onFallback?: () => void
	onFileOpen?: (filepath: string) => void
}

/**
 * Manual Review Component
 * Integrates with ManualReviewManager to display review progress and handle user interactions
 */
export const ManualReview: React.FC<ManualReviewProps> = ({ manualReviewManager, onFallback, onFileOpen }) => {
	const [status, setStatus] = useState<ManualReviewStatus | null>(null)

	useEffect(() => {
		if (!manualReviewManager) {
			return
		}

		// Get initial status
		setStatus(manualReviewManager.getStatus())

		// Listen for status changes
		const handleStatusChange = (newStatus: ManualReviewStatus) => {
			setStatus(newStatus)
		}

		const handleReviewComplete = ({ reason }: { reason: string; contextFile?: string; duration: number }) => {
			console.log(`Manual review completed: ${reason}`)
			if (reason === "timeout" && onFallback) {
				// Auto-fallback on timeout
				setTimeout(() => onFallback(), 1000)
			}
		}

		manualReviewManager.on("statusChange", handleStatusChange)
		manualReviewManager.on("reviewComplete", handleReviewComplete)

		return () => {
			manualReviewManager.off("statusChange", handleStatusChange)
			manualReviewManager.off("reviewComplete", handleReviewComplete)
		}
	}, [manualReviewManager, onFallback])

	const handleFallback = () => {
		if (onFallback) {
			onFallback()
		}
	}

	const handleFileOpen = (filepath: string) => {
		if (onFileOpen) {
			onFileOpen(filepath)
		}
	}

	return <ReviewProgress status={status} onFallback={handleFallback} onFileOpen={handleFileOpen} />
}
