import { WebviewMessage } from "../../../src/shared/WebviewMessage"
import { ExtensionState } from "../../../src/shared/ExtensionMessage"

export type BatchUpdateMessage = {
	type: "batchUpdate"
	changes: Partial<ExtensionState>
	timestamp: number
}

export type FinalSyncMessage = {
	type: "finalSync"
	changes: Partial<ExtensionState>
	timestamp: number
}

export type LocalWebviewMessage = WebviewMessage | BatchUpdateMessage | FinalSyncMessage

export interface CustomVSCodeAPI {
	postMessage(message: LocalWebviewMessage): void
	getState(): unknown | undefined
	setState(state: unknown): void
}

declare global {
	interface Window {
		acquireCustomVSCodeApi: () => CustomVSCodeAPI
	}
}

export {}
