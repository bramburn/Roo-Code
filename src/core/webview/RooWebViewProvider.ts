/**
 * Provides a webview view for the Roo Cline extension.
 */
import * as vscode from "vscode"
import * as fs from "fs/promises"
import { WebviewMessage } from "../../shared/WebviewMessage"

export class RooWebViewProvider implements vscode.WebviewViewProvider {
	public static readonly sideBarId = "roo-cline.SidebarProvider" // used in package.json as the view's id. This value cannot be changed due to how vscode caches views based on their id, and updating the id would break existing instances of the extension.
	public static readonly tabPanelId = "roo-cline.TabPanelProvider"
	async resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		token: vscode.CancellationToken,
	): Promise<void> {
		throw new Error("Method not implemented.")
	}
}

const logFilePath = "c:\\dev\\Roo-Code\\dev.log"

export const rooEventListener = async (messages: WebviewMessage): Promise<void> => {
	// Handle the incoming messages here
	try {
		const logData = JSON.stringify(messages, null, 2) // Format the incoming data nicely
		await fs.appendFile(logFilePath, `${new Date().toISOString()} - ${logData}\n`)
	} catch (error) {
		console.error("Failed to log data:", error)
	}
}
