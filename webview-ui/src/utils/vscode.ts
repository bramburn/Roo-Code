import { WebviewMessage } from "../../../src/shared/WebviewMessage"
import { ExtensionState } from "../../../src/shared/ExtensionMessage"
import type { CustomVSCodeAPI } from "../types/vscode"

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

/**
 * Wrapper for VS Code's webview API with improved testability
 */
export class VSCodeAPIWrapper {
	private static instance: VSCodeAPIWrapper
	private api: CustomVSCodeAPI
	private stateVersion = 0

	private constructor(api: CustomVSCodeAPI) {
		this.api = api
		// Removed Object.freeze(this) to allow state updates
	}

	static initialize(api?: CustomVSCodeAPI): void {
		if (this.instance) {
			throw new Error("VSCodeAPIWrapper already initialized")
		}

		// Use provided API or acquire from window
		const vscodeApi = api || (typeof window !== "undefined" ? window.acquireCustomVSCodeApi() : undefined)

		if (!vscodeApi) {
			throw new Error("Failed to acquire VS Code API")
		}

		this.instance = new VSCodeAPIWrapper(vscodeApi)
	}

	static getInstance(): VSCodeAPIWrapper {
		if (!this.instance) {
			throw new Error("VSCodeAPIWrapper not initialized")
		}
		return this.instance
	}

	postMessage(message: LocalWebviewMessage): void {
		if (typeof message !== "object" || message === null) {
			throw new Error("Message must be a non-null object")
		}
		this.api.postMessage(message)
	}

	setState(state: unknown): void {
		const version = ++this.stateVersion
		this.api.setState({
			_version: version,
			data: state,
		})
	}

	getState(): unknown | undefined {
		const state = this.api.getState()
		return state && (state as { data: unknown }).data
	}
}

// Initialize in non-test environment or during testing
if (process.env.NODE_ENV !== "test" || process.env.NODE_ENV === "test") {
	try {
		VSCodeAPIWrapper.initialize()
	} catch (error) {
		// Ignore initialization errors during testing
		if (process.env.NODE_ENV !== "test") {
			throw error
		}
	}
}

// Export a vscode object to match test mocks
export const vscode = {
	postMessage: (message: any) => {
		try {
			const instance = VSCodeAPIWrapper.getInstance()
			instance.postMessage(message)
		} catch (error) {
			// Fallback for test environments
			console.warn("VSCodeAPIWrapper not initialized, using mock postMessage")
		}
	},
}

export default VSCodeAPIWrapper
