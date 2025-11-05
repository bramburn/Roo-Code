import { EventEmitter } from "events"
import * as fs from "fs/promises"
import * as path from "path"
import * as os from "os"
import { ErrorHandler, type ErrorContext } from "./error-handler"

/**
 * File recovery status
 */
export type RecoveryStatus = "pending" | "in-progress" | "completed" | "failed"

/**
 * File recovery information
 */
export interface RecoveryInfo {
	id: string
	originalPath: string
	backupPath?: string
	recoveryPath?: string
	status: RecoveryStatus
	timestamp: number
	fileSize?: number
	checksum?: string
	attempts: number
	maxAttempts: number
	error?: string
}

/**
 * File recovery options
 */
export interface RecoveryOptions {
	createBackup: boolean
	backupLocation?: string
	maxAttempts: number
	recoveryTimeout: number
	enableAutoRecovery: boolean
}

/**
 * File recovery strategies
 */
export type RecoveryStrategy = "backup-restore" | "temp-recreate" | "user-assisted" | "graceful-fallback"

/**
 * File recovery system for context compression
 * Handles recovery of deleted/moved context files with multiple strategies
 */
export class FileRecovery extends EventEmitter {
	private readonly errorHandler: ErrorHandler
	private readonly config: RecoveryOptions
	private readonly recoveryCache = new Map<string, RecoveryInfo>()
	private readonly backupDir: string

	constructor(errorHandler: ErrorHandler, config: Partial<RecoveryOptions> = {}) {
		super()

		this.errorHandler = errorHandler
		this.config = {
			createBackup: true,
			maxAttempts: 3,
			recoveryTimeout: 30000, // 30 seconds
			enableAutoRecovery: true,
			...config,
		}

		// Create backup directory
		this.backupDir = this.config.backupLocation || path.join(os.tmpdir(), "roo-code-context-recovery")
		this.ensureBackupDirectory()
	}

	/**
	 * Ensure backup directory exists
	 */
	private async ensureBackupDirectory(): Promise<void> {
		try {
			await fs.mkdir(this.backupDir, { recursive: true })
		} catch (error) {
			await this.errorHandler.handleError(
				error as Error,
				{
					component: "FileRecovery",
					operation: "ensure-backup-directory",
					timestamp: Date.now(),
				},
				"file-system",
			)
		}
	}

	/**
	 * Create backup of a file before operations
	 */
	async createBackup(filepath: string): Promise<string | null> {
		if (!this.config.createBackup) {
			return null
		}

		try {
			const stats = await fs.stat(filepath)
			const backupFilename = `${path.basename(filepath)}.backup.${Date.now()}`
			const backupPath = path.join(this.backupDir, backupFilename)

			// Copy file to backup location
			await fs.copyFile(filepath, backupPath)

			// Calculate checksum for integrity verification
			const checksum = await this.calculateChecksum(filepath)

			// Store recovery info
			const recoveryInfo: RecoveryInfo = {
				id: this.generateRecoveryId(),
				originalPath: filepath,
				backupPath,
				status: "completed",
				timestamp: Date.now(),
				fileSize: stats.size,
				checksum,
				attempts: 1,
				maxAttempts: this.config.maxAttempts,
			}

			this.recoveryCache.set(filepath, recoveryInfo)

			this.emit("backupCreated", { filepath, backupPath, recoveryInfo })

			return backupPath
		} catch (error) {
			await this.errorHandler.handleError(
				error as Error,
				{
					component: "FileRecovery",
					operation: "create-backup",
					filepath,
					timestamp: Date.now(),
				},
				"file-system",
			)

			return null
		}
	}

	/**
	 * Attempt to recover a missing file
	 */
	async recoverFile(originalPath: string, strategy: RecoveryStrategy = "backup-restore"): Promise<RecoveryInfo> {
		const recoveryInfo = this.getOrCreateRecoveryInfo(originalPath)

		try {
			recoveryInfo.status = "in-progress"
			recoveryInfo.attempts++

			this.emit("recoveryStarted", { originalPath, strategy, recoveryInfo })

			let recovered = false

			switch (strategy) {
				case "backup-restore":
					recovered = await this.recoverFromBackup(recoveryInfo)
					break
				case "temp-recreate":
					recovered = await this.recreateFromTemplate(recoveryInfo)
					break
				case "user-assisted":
					recovered = await this.requestUserAssistance(recoveryInfo)
					break
				case "graceful-fallback":
					recovered = await this.gracefulFallback(recoveryInfo)
					break
			}

			if (recovered) {
				recoveryInfo.status = "completed"
				this.emit("recoveryCompleted", { originalPath, strategy, recoveryInfo })
			} else {
				recoveryInfo.status = "failed"
				recoveryInfo.error = `Recovery failed with strategy: ${strategy}`
				this.emit("recoveryFailed", { originalPath, strategy, recoveryInfo })
			}
		} catch (error) {
			recoveryInfo.status = "failed"
			recoveryInfo.error = error instanceof Error ? error.message : String(error)

			await this.errorHandler.handleError(
				error as Error,
				{
					component: "FileRecovery",
					operation: "recover-file",
					filepath: originalPath,
					timestamp: Date.now(),
				},
				"file-system",
			)
		}

		return recoveryInfo
	}

	/**
	 * Recover file from backup
	 */
	private async recoverFromBackup(recoveryInfo: RecoveryInfo): Promise<boolean> {
		if (!recoveryInfo.backupPath) {
			return false
		}

		try {
			// Check if backup exists
			await fs.access(recoveryInfo.backupPath)

			// Verify backup integrity
			const backupChecksum = await this.calculateChecksum(recoveryInfo.backupPath)
			if (backupChecksum !== recoveryInfo.checksum) {
				throw new Error("Backup integrity check failed")
			}

			// Ensure original directory exists
			const originalDir = path.dirname(recoveryInfo.originalPath)
			await fs.mkdir(originalDir, { recursive: true })

			// Restore from backup
			await fs.copyFile(recoveryInfo.backupPath, recoveryInfo.originalPath)

			// Verify restored file
			const restoredChecksum = await this.calculateChecksum(recoveryInfo.originalPath)
			if (restoredChecksum !== recoveryInfo.checksum) {
				throw new Error("Restored file integrity check failed")
			}

			recoveryInfo.recoveryPath = recoveryInfo.originalPath
			return true
		} catch (error) {
			console.error("Backup recovery failed:", error)
			return false
		}
	}

	/**
	 * Recreate file from template
	 */
	private async recreateFromTemplate(recoveryInfo: RecoveryInfo): Promise<boolean> {
		try {
			const originalDir = path.dirname(recoveryInfo.originalPath)
			await fs.mkdir(originalDir, { recursive: true })

			// Create a basic template file
			const templateContent = this.generateTemplateContent(recoveryInfo.originalPath)
			await fs.writeFile(recoveryInfo.originalPath, templateContent, "utf-8")

			recoveryInfo.recoveryPath = recoveryInfo.originalPath
			return true
		} catch (error) {
			console.error("Template recreation failed:", error)
			return false
		}
	}

	/**
	 * Request user assistance for file recovery
	 */
	private async requestUserAssistance(recoveryInfo: RecoveryInfo): Promise<boolean> {
		this.emit("userAssistanceRequired", {
			originalPath: recoveryInfo.originalPath,
			backupPath: recoveryInfo.backupPath,
			recoveryInfo,
		})

		// Return false for now - user assistance will be handled externally
		return false
	}

	/**
	 * Graceful fallback when recovery is not possible
	 */
	private async gracefulFallback(recoveryInfo: RecoveryInfo): Promise<boolean> {
		try {
			// Create a minimal fallback file
			const fallbackContent = this.generateFallbackContent(recoveryInfo.originalPath)
			const fallbackPath = path.join(
				path.dirname(recoveryInfo.originalPath),
				`${path.basename(recoveryInfo.originalPath)}.fallback`,
			)

			await fs.writeFile(fallbackPath, fallbackContent, "utf-8")

			recoveryInfo.recoveryPath = fallbackPath
			return true
		} catch (error) {
			console.error("Graceful fallback failed:", error)
			return false
		}
	}

	/**
	 * Generate template content based on file type
	 */
	private generateTemplateContent(filepath: string): string {
		const ext = path.extname(filepath).toLowerCase()

		switch (ext) {
			case ".md":
				return `# Context Review File

## Metadata
- **Created**: ${new Date().toISOString()}
- **Status**: Recovered from template
- **Note**: This file was automatically recreated due to loss of original

## Context Content

*Content recovery failed. This is a template file.*

---

## Recovery Information
- Original file was lost and recreated from template
- Please review and update content as needed
- Consider checking backup locations for original content
`

			case ".json":
				return JSON.stringify(
					{
						metadata: {
							created: new Date().toISOString(),
							status: "recovered-from-template",
							note: "This file was automatically recreated due to loss of original",
						},
						content: {},
						recovery: {
							originalFile: filepath,
							timestamp: Date.now(),
							method: "template-recreation",
						},
					},
					null,
					2,
				)

			default:
				return `# Recovered File

This file was automatically recreated on ${new Date().toISOString()} 
because the original file was lost or corrupted.

Original path: ${filepath}

Please review and update this content as needed.
`
		}
	}

	/**
	 * Generate fallback content
	 */
	private generateFallbackContent(filepath: string): string {
		return `# Fallback Context File

## Recovery Information
- **Original Path**: ${filepath}
- **Recovery Timestamp**: ${new Date().toISOString()}
- **Status**: Fallback created due to recovery failure
- **Note**: This is a minimal fallback file

## Instructions
The original context file could not be recovered. Please:
1. Check if you have a backup of the original file
2. Recreate the content from memory if possible
3. Contact support if you need assistance recovering the original content

## Next Steps
- Review any available backups
- Consider using the manual review workflow with a new context file
- Check the error logs for more information about the recovery failure
`
	}

	/**
	 * Check if file exists and is accessible
	 */
	async checkFileAccessibility(filepath: string): Promise<{
		exists: boolean
		readable: boolean
		writable: boolean
		error?: string
	}> {
		try {
			await fs.access(filepath, fs.constants.F_OK)

			// Check readability
			await fs.access(filepath, fs.constants.R_OK)

			// Check writability
			await fs.access(filepath, fs.constants.W_OK)

			return {
				exists: true,
				readable: true,
				writable: true,
			}
		} catch (error) {
			const err = error as any
			let exists = false
			let readable = false
			let writable = false

			if (err.code === "ENOENT") {
				// File doesn't exist
			} else if (err.code === "EACCES") {
				// Permission denied
				try {
					await fs.access(filepath, fs.constants.F_OK)
					exists = true
				} catch {
					// File doesn't exist
				}
			}

			return {
				exists,
				readable,
				writable,
				error: err.message,
			}
		}
	}

	/**
	 * Monitor file for changes and create automatic backups
	 */
	async monitorFile(filepath: string, intervalMs: number = 60000): Promise<void> {
		const monitor = async () => {
			try {
				const accessibility = await this.checkFileAccessibility(filepath)

				if (accessibility.exists && accessibility.readable) {
					// Check if we need to create a new backup
					const recoveryInfo = this.recoveryCache.get(filepath)
					const shouldBackup = !recoveryInfo || Date.now() - recoveryInfo.timestamp > intervalMs

					if (shouldBackup) {
						await this.createBackup(filepath)
					}
				} else if (!accessibility.exists) {
					// File is missing, attempt recovery
					await this.attemptAutoRecovery(filepath)
				}
			} catch (error) {
				await this.errorHandler.handleError(
					error as Error,
					{
						component: "FileRecovery",
						operation: "monitor-file",
						filepath,
						timestamp: Date.now(),
					},
					"file-system",
				)
			}
		}

		// Initial check
		await monitor()

		// Set up periodic monitoring
		setInterval(monitor, intervalMs)
	}

	/**
	 * Attempt automatic recovery
	 */
	private async attemptAutoRecovery(filepath: string): Promise<void> {
		if (!this.config.enableAutoRecovery) {
			return
		}

		const recoveryInfo = this.recoveryCache.get(filepath)
		if (!recoveryInfo || recoveryInfo.attempts >= recoveryInfo.maxAttempts) {
			return
		}

		// Try recovery strategies in order
		const strategies: RecoveryStrategy[] = ["backup-restore", "temp-recreate", "graceful-fallback"]

		for (const strategy of strategies) {
			const result = await this.recoverFile(filepath, strategy)

			if (result.status === "completed") {
				this.emit("autoRecoveryCompleted", { filepath, strategy, recoveryInfo: result })
				return
			}
		}

		this.emit("autoRecoveryFailed", { filepath, recoveryInfo })
	}

	/**
	 * Get or create recovery info for a file
	 */
	private getOrCreateRecoveryInfo(filepath: string): RecoveryInfo {
		let recoveryInfo = this.recoveryCache.get(filepath)

		if (!recoveryInfo) {
			recoveryInfo = {
				id: this.generateRecoveryId(),
				originalPath: filepath,
				status: "pending",
				timestamp: Date.now(),
				attempts: 0,
				maxAttempts: this.config.maxAttempts,
			}

			this.recoveryCache.set(filepath, recoveryInfo)
		}

		return recoveryInfo
	}

	/**
	 * Calculate file checksum for integrity verification
	 */
	private async calculateChecksum(filepath: string): Promise<string> {
		try {
			const content = await fs.readFile(filepath)
			// Simple checksum - in production, use crypto.createHash
			return Buffer.from(content).toString("base64")
		} catch {
			return ""
		}
	}

	/**
	 * Generate unique recovery ID
	 */
	private generateRecoveryId(): string {
		return `recovery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
	}

	/**
	 * Get recovery information for a file
	 */
	getRecoveryInfo(filepath: string): RecoveryInfo | undefined {
		return this.recoveryCache.get(filepath)
	}

	/**
	 * Get all recovery information
	 */
	getAllRecoveryInfo(): RecoveryInfo[] {
		return Array.from(this.recoveryCache.values())
	}

	/**
	 * Clean up old recovery information and backups
	 */
	async cleanup(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
		const now = Date.now()
		const toDelete: string[] = []

		for (const [filepath, recoveryInfo] of this.recoveryCache.entries()) {
			if (now - recoveryInfo.timestamp > maxAge) {
				toDelete.push(filepath)

				// Delete backup file if it exists
				if (recoveryInfo.backupPath) {
					try {
						await fs.unlink(recoveryInfo.backupPath)
					} catch (error) {
						console.error("Failed to delete backup file:", error)
					}
				}
			}
		}

		// Remove from cache
		for (const filepath of toDelete) {
			this.recoveryCache.delete(filepath)
		}

		this.emit("cleanup", { deletedCount: toDelete.length })
	}

	/**
	 * Dispose of resources
	 */
	dispose(): void {
		this.removeAllListeners()
		this.recoveryCache.clear()
	}
}
