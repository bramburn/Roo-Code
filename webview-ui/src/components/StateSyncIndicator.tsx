import React, { useState, useEffect } from "react"
import { useExtensionState } from "../context/ExtensionStateContext"
import "../styles/StateSync.css"

export const StateSyncIndicator: React.FC = () => {
	const { clineMessages } = useExtensionState()
	const [lastSyncTimestamp, setLastSyncTimestamp] = useState(Date.now())

	useEffect(() => {
		if (clineMessages.length === 0) {
			setLastSyncTimestamp(Date.now())
		}
	}, [clineMessages])

	// Determine sync status based on messages
	const hasPendingChanges = clineMessages.length > 0

	// Calculate sync status
	const syncStatus = hasPendingChanges ? "pending" : "synced"

	return (
		<div className={`state-sync-indicator ${syncStatus}`}>
			<div className="sync-icon" title={`Last sync: ${new Date(lastSyncTimestamp).toLocaleString()}`}>
				{hasPendingChanges ? "⏳" : "✓"}
			</div>
			{hasPendingChanges && <div className="sync-tooltip">{clineMessages.length} pending changes</div>}
		</div>
	)
}
