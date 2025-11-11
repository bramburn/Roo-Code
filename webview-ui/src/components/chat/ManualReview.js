import { jsx as _jsx } from "react/jsx-runtime"
import { useState, useEffect } from "react"
import { ReviewProgress } from "./ReviewProgress"
/**
 * Manual Review Component
 * Integrates with ManualReviewManager to display review progress and handle user interactions
 */
export const ManualReview = ({ manualReviewManager, onFallback, onFileOpen }) => {
	const [status, setStatus] = useState(null)
	useEffect(() => {
		if (!manualReviewManager) {
			return
		}
		// Get initial status
		setStatus(manualReviewManager.getStatus())
		// Listen for status changes
		const handleStatusChange = (newStatus) => {
			setStatus(newStatus)
		}
		const handleReviewComplete = ({ reason }) => {
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
	const handleFileOpen = (filepath) => {
		if (onFileOpen) {
			onFileOpen(filepath)
		}
	}
	return _jsx(ReviewProgress, { status: status, onFallback: handleFallback, onFileOpen: handleFileOpen })
}
//# sourceMappingURL=ManualReview.js.map
