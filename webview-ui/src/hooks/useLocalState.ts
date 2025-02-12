import { useCallback, useEffect, useRef, useState } from "react"
import { ExtensionState } from "../../../src/shared/ExtensionMessage"
import { vscode } from "../utils/vscode"
import { debounce } from "../utils/debounce"
import { storageUtils } from "../utils/storageUtils"
import { WebviewMessage } from "../../../src/shared/WebviewMessage"

type BatchUpdateMessage = {
	type: "batchUpdate"
	changes: Partial<ExtensionState>
	timestamp: number
}

type FinalSyncMessage = {
	type: "finalSync"
	changes: Partial<ExtensionState>
	timestamp: number
}

type LocalWebviewMessage = WebviewMessage | BatchUpdateMessage | FinalSyncMessage

export const useLocalState = (initialState: ExtensionState) => {
	const [localState, setLocalState] = useState<ExtensionState>(initialState)
	const unsavedChanges = useRef<Partial<ExtensionState>>({})

	// Sync with VS Code state when received
	const updateFromVscode = useCallback(
		(newState: Partial<ExtensionState>) => {
			setLocalState((prev: ExtensionState) => ({ ...prev, ...newState }))
		},
		[setLocalState],
	)

	// Debounced save to VS Code
	const saveChanges = useCallback(() => {
		if (Object.keys(unsavedChanges.current).length > 0) {
			const message: BatchUpdateMessage = {
				type: "batchUpdate",
				changes: unsavedChanges.current,
				timestamp: Date.now(),
			}

			vscode.postMessage(message as LocalWebviewMessage)

			// Persist to local storage as backup
			storageUtils.setItem("vscodeStateBuffer", JSON.stringify(localState))

			unsavedChanges.current = {}
		}
	}, [localState, unsavedChanges])

	// Debounced save with 500ms delay
	const debouncedSave = useCallback(() => {
		const debounced = debounce(() => {
			saveChanges()
		}, 500)
		debounced()
	}, [saveChanges])

	// Update handler with local-first strategy
	const updateState = useCallback(
		(changes: Partial<ExtensionState>) => {
			setLocalState((prev: ExtensionState) => {
				const newState = { ...prev, ...changes }

				// Store unsaved changes
				unsavedChanges.current = {
					...unsavedChanges.current,
					...changes,
				}

				// Trigger debounced save
				debouncedSave()

				return newState
			})
		},
		[debouncedSave, setLocalState],
	)

	// Initial hydration from storage
	useEffect(() => {
		const savedState = storageUtils.getItem("vscodeStateBuffer")
		if (savedState) {
			try {
				const parsedState = JSON.parse(savedState)
				updateFromVscode(parsedState)
			} catch (e) {
				console.error("Local storage read error:", e)
			}
		}
	}, [updateFromVscode])

	// Disposal handling
	useEffect(() => {
		const handleBeforeUnload = () => {
			// Immediate sync for remaining changes
			if (Object.keys(unsavedChanges.current).length > 0) {
				const message: FinalSyncMessage = {
					type: "finalSync",
					changes: unsavedChanges.current,
					timestamp: Date.now(),
				}

				vscode.postMessage(message as LocalWebviewMessage)

				// Fallback: Write to storage
				storageUtils.setItem(
					"finalSyncState",
					JSON.stringify({
						state: localState,
						unsaved: unsavedChanges.current,
					}),
				)
			}
		}

		window.addEventListener("beforeunload", handleBeforeUnload)

		return () => {
			window.removeEventListener("beforeunload", handleBeforeUnload)
			saveChanges() // Final sync attempt
		}
	}, [localState, saveChanges, unsavedChanges])

	return {
		localState,
		updateState,
		updateFromVscode,
	}
}
