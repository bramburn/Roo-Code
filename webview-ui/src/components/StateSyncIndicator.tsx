import React from "react"
import { useExtensionState } from "../context/ExtensionStateContext"
import "../styles/StateSync.css"

export const StateSyncIndicator: React.FC = () => {
	const { localState, lastSyncTimestamp } = useExtensionState()

	// Determine sync status based on unsaved changes
	const hasPendingChanges = Object.keys(localState.unsavedChanges || {}).length > 0

	// Calculate sync status
	const syncStatus = hasPendingChanges ? "pending" : "synced"

	return (
		<div className={`state-sync-indicator ${syncStatus}`}>
			<div className="sync-icon" title={`Last sync: ${new Date(lastSyncTimestamp).toLocaleString()}`}>
				{hasPendingChanges ? "⏳" : "✓"}
			</div>
			{hasPendingChanges && (
				<div className="sync-tooltip">
					{Object.keys(localState.unsavedChanges || {}).length} pending changes
				</div>
			)}
		</div>
	)
}
