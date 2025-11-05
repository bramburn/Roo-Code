import * as fs from "fs/promises"
import * as path from "path"
import * as vscode from "vscode"
import { ApiMessage } from "../task-persistence/apiMessages"
import type { TruncateResponse } from "../sliding-window"

/**
 * Metadata for context file creation
 */
export interface ContextFileMetadata {
	contextSize: number
	triggerReason: "manual" | "automatic" | "aggressive"
	timestamp: number
	taskId: string
}

/**
 * Context file manager for manual review workflow
 * Handles creating and managing context review files with proper metadata
 */
export class ContextFileManager {
	private readonly workspaceRoot: string
	private readonly contextReviewDir: string

	constructor(workspaceRoot: string) {
		this.workspaceRoot = workspaceRoot
		this.contextReviewDir = path.join(workspaceRoot, ".context-review")
	}

	/**
	 * Get the context review directory path
	 */
	getContextReviewDir(): string {
		return this.contextReviewDir
	}

	/**
	 * Ensure the .context-review directory exists
	 */
	private async ensureContextReviewDirectory(): Promise<void> {
		try {
			await fs.mkdir(this.contextReviewDir, { recursive: true })
		} catch (error) {
			// Directory might already exist, which is fine
			if ((error as any).code !== "EEXIST") {
				throw error
			}
		}
	}

	/**
	 * Generate filename with timestamp
	 */
	private generateFilename(timestamp: number): string {
		const date = new Date(timestamp)
		const dateStr = date.toISOString().replace(/[:.]/g, "-").slice(0, 19) // YYYY-MM-DD-HH-MM-SS
		return `${dateStr}-context.md`
	}

	/**
	 * Format metadata as markdown header
	 */
	private formatMetadata(metadata: ContextFileMetadata): string {
		const date = new Date(metadata.timestamp)
		const dateStr = date.toISOString()

		return `---
# Context Review File

## Metadata
- **Task ID**: ${metadata.taskId}
- **Created**: ${dateStr}
- **Context Size**: ${metadata.contextSize} tokens
- **Trigger Reason**: ${metadata.triggerReason}
- **Status**: Pending Review

---

## Context Content

`
	}

	/**
	 * Convert API messages to markdown format
	 */
	private formatMessagesAsMarkdown(messages: ApiMessage[]): string {
		const markdownLines: string[] = []

		for (const message of messages) {
			const timestamp = message.ts ? new Date(message.ts).toISOString() : "Unknown"
			const role = message.role === "user" ? "👤 User" : "🤖 Assistant"

			markdownLines.push(`### ${role} (${timestamp})`)
			markdownLines.push("")

			if (Array.isArray(message.content)) {
				for (const contentBlock of message.content) {
					if (contentBlock.type === "text") {
						markdownLines.push(contentBlock.text)
					} else if (contentBlock.type === "image") {
						markdownLines.push(`[Image: ${contentBlock.source?.media_type || "unknown"}]`)
					}
				}
			} else if (typeof message.content === "string") {
				markdownLines.push(message.content)
			}

			markdownLines.push("")
			markdownLines.push("---")
			markdownLines.push("")
		}

		return markdownLines.join("\n")
	}

	/**
	 * Create context file with metadata and content
	 */
	async createContextFile(messages: ApiMessage[], metadata: ContextFileMetadata): Promise<string> {
		await this.ensureContextReviewDirectory()

		const filename = this.generateFilename(metadata.timestamp)
		const filepath = path.join(this.contextReviewDir, filename)

		const header = this.formatMetadata(metadata)
		const content = this.formatMessagesAsMarkdown(messages)

		const fullContent = header + content

		await fs.writeFile(filepath, fullContent, "utf-8")

		return filepath
	}

	/**
	 * Get all context review files
	 */
	async getContextFiles(): Promise<string[]> {
		try {
			await this.ensureContextReviewDirectory()
			const files = await fs.readdir(this.contextReviewDir)

			return files
				.filter((file) => file.endsWith("-context.md"))
				.sort()
				.map((file) => path.join(this.contextReviewDir, file))
		} catch (error) {
			console.error("Failed to read context review directory:", error)
			return []
		}
	}

	/**
	 * Delete a context file
	 */
	async deleteContextFile(filepath: string): Promise<void> {
		try {
			await fs.unlink(filepath)
		} catch (error) {
			console.error("Failed to delete context file:", error)
		}
	}

	/**
	 * Clean up old context files (keep only the most recent 10)
	 */
	async cleanupOldFiles(): Promise<void> {
		try {
			const files = await this.getContextFiles()

			if (files.length > 10) {
				const filesToDelete = files.slice(0, -10)

				for (const file of filesToDelete) {
					await this.deleteContextFile(file)
				}
			}
		} catch (error) {
			console.error("Failed to cleanup old context files:", error)
		}
	}

	/**
	 * Show context file in VSCode
	 */
	async showContextFile(filepath: string): Promise<void> {
		try {
			const document = await vscode.workspace.openTextDocument(filepath)
			await vscode.window.showTextDocument(document)
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to open context file: ${error}`)
		}
	}
}
