import { z } from "zod"

/**
 * Zod schema for executeCommand tool parameters
 */
export const ExecuteCommandSchema = z
	.object({
		command: z
			.string()
			.min(1, "Command cannot be empty")
			.max(10_000, "Command is too long (max 10,000 characters)")
			.refine(
				(cmd) => {
					// Check for extremely dangerous commands
					const dangerousPatterns = [
						/rm\s+-rf\s+\//, // rm -rf /
						/format\s+[c-z]:/, // format C:, D:, etc.
						/del\s+\/[sqa]/, // del /s /q /a
						/sudo\s+rm\s+-rf/, // sudo rm -rf
						/chmod\s+-R\s+777/, // chmod -R 777
					]
					return !dangerousPatterns.some((pattern) => pattern.test(cmd.toLowerCase()))
				},
				{
					message: "Command contains potentially dangerous operations",
				},
			),
		cwd: z
			.string()
			.optional()
			.refine(
				(cwd) => {
					if (!cwd) return true
					// Check for path traversal in cwd
					return !cwd.includes("..") && !cwd.startsWith("~")
				},
				{
					message: "Working directory contains invalid path traversal",
				},
			),
		timeout: z.coerce
			.number()
			.int("Timeout must be an integer")
			.min(0, "Timeout must be non-negative")
			.max(300, "Timeout is too long (max 300 seconds)")
			.optional(),
	})
	.describe("Execute shell commands with safety validations")

export type ExecuteCommandInput = z.infer<typeof ExecuteCommandSchema>

/**
 * Strict validation schema for commands
 */
export const CommandValidation = z.object({
	command: z
		.string()
		.min(1, "Command is required")
		.max(10_000, "Command is too long (max 10,000 characters)")
		.refine(
			(cmd) => {
				// Trim whitespace
				const trimmed = cmd.trim()
				if (trimmed !== cmd) {
					return false
				}
				return true
			},
			{
				message: "Command cannot have leading or trailing whitespace",
			},
		)
		.refine(
			(cmd) => {
				// Check for null bytes
				return !cmd.includes("\u0000")
			},
			{
				message: "Command contains invalid null characters",
			},
		)
		.refine(
			(cmd) => {
				// Check for control characters (except newlines and tabs)
				// eslint-disable-next-line no-control-regex
				const controlChars = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/
				return !controlChars.test(cmd)
			},
			{
				message: "Command contains invalid control characters",
			},
		)
		.refine(
			(cmd) => {
				// Basic command injection protection
				const injectionPatterns = [
					/&&\s*rm\s+-rf/, // && rm -rf
					/\|\|\s*rm\s+-rf/, // || rm -rf
					/;\s*rm\s+-rf/, // ; rm -rf
					/`.*rm\s+-rf.*`/, // `rm -rf`
					/\$\(.*rm\s+-rf.*\)/, // $(rm -rf)
				]
				return !injectionPatterns.some((pattern) => pattern.test(cmd.toLowerCase()))
			},
			{
				message: "Command appears to contain injection attempts",
			},
		),
})

/**
 * Working directory validation
 */
export const WorkingDirectoryValidation = z.object({
	cwd: z
		.string()
		.optional()
		.refine(
			(cwd) => {
				if (!cwd) return true
				// Check path length
				if (cwd.length > 260) return false
				// Check for invalid characters
				const invalidChars = /[<>:"|?*]/
				return !invalidChars.test(cwd)
			},
			{
				message: "Working directory path is invalid",
			},
		)
		.refine(
			(cwd) => {
				if (!cwd) return true
				// Check for path traversal
				return !cwd.includes("..") && !cwd.startsWith("~")
			},
			{
				message: "Working directory contains invalid path traversal",
			},
		),
})

/**
 * Combined strict validation schema
 */
export const ExecuteCommandStrictSchema = z
	.object({
		command: CommandValidation.shape.command,
		cwd: WorkingDirectoryValidation.shape.cwd,
		timeout: z.coerce
			.number()
			.int("Timeout must be an integer")
			.min(0, "Timeout must be non-negative")
			.max(300, "Timeout is too long (max 300 seconds)")
			.optional(),
	})
	.strict() // Only allow defined properties

/**
 * Command safety levels
 */
export enum CommandSafetyLevel {
	SAFE = "safe",
	MODERATE = "moderate",
	RISKY = "risky",
	DANGEROUS = "dangerous",
}

/**
 * Command categories for classification
 */
export enum CommandCategory {
	FILE_OPERATIONS = "file_operations",
	SYSTEM_INFO = "system_info",
	NETWORK = "network",
	DEVELOPMENT = "development",
	PACKAGE_MANAGEMENT = "package_management",
	PROCESS_MANAGEMENT = "process_management",
	OTHER = "other",
}

/**
 * Command classification helpers
 */
export const CommandClassification = {
	/**
	 * Determine if a command is safe to execute
	 */
	isSafeCommand(command: string): { safe: boolean; reason?: string; level: CommandSafetyLevel } {
		const cmd = command.toLowerCase().trim()

		// Definitely dangerous commands
		const dangerous = [
			/rm\s+-rf\s+\//,
			/format\s+[c-z]:/,
			/del\s+\/[sqa]/,
			/sudo\s+rm\s+-rf/,
			/chmod\s+-R\s+777/,
			/dd\s+if=/,
			/mkfs/,
		]

		for (const pattern of dangerous) {
			if (pattern.test(cmd)) {
				return {
					safe: false,
					reason: "Command contains dangerous system operations",
					level: CommandSafetyLevel.DANGEROUS,
				}
			}
		}

		// Moderately risky commands
		const risky = [/rm\s+-rf/, /sudo/, /chmod\s+-R/, /\/etc\//, /\/system\//]

		for (const pattern of risky) {
			if (pattern.test(cmd)) {
				return {
					safe: true,
					reason: "Command requires elevated privileges or system-wide changes",
					level: CommandSafetyLevel.RISKY,
				}
			}
		}

		// Safe commands
		const safe = [
			/^(ls|dir|pwd|cd|echo|cat|less|more|head|tail|grep|find|which|whereis)\b/,
			/^(git|npm|pnpm|yarn|pip|python|node|java|go|rust|cargo)\b/,
			/^(ps|top|htop|df|du|free|uname|whoami|id)\b/,
			/^(ping|curl|wget|nslookup|dig)\b/,
		]

		for (const pattern of safe) {
			if (pattern.test(cmd)) {
				return { safe: true, level: CommandSafetyLevel.SAFE }
			}
		}

		return { safe: true, reason: "Command classification unknown", level: CommandSafetyLevel.MODERATE }
	},

	/**
	 * Categorize a command
	 */
	categorizeCommand(command: string): CommandCategory {
		const cmd = command.toLowerCase().trim()

		if (
			/^(ls|dir|pwd|cd|cat|less|more|head|tail|grep|find|which|whereis|cp|mv|rm|mkdir|rmdir|touch|chmod|chown)\b/.test(
				cmd,
			)
		) {
			return CommandCategory.FILE_OPERATIONS
		}

		if (/^(ps|top|htop|df|du|free|uname|whoami|id|uptime|lscpu|lsblk|lsusb|lspci)\b/.test(cmd)) {
			return CommandCategory.SYSTEM_INFO
		}

		if (/^(ping|curl|wget|nslookup|dig|netstat|ss|ip|ifconfig)\b/.test(cmd)) {
			return CommandCategory.NETWORK
		}

		if (/^(git|npm|pnpm|yarn|pip|python|node|java|go|rust|cargo|make|cmake|gcc|g++)\b/.test(cmd)) {
			return CommandCategory.DEVELOPMENT
		}

		if (/^(apt|yum|dnf|pacman|brew|choco|scoop|apt-get|yum|dnf|pacman)\b/.test(cmd)) {
			return CommandCategory.PACKAGE_MANAGEMENT
		}

		if (/^(kill|killall|pkill|jobs|bg|fg|nohup|screen|tmux)\b/.test(cmd)) {
			return CommandCategory.PROCESS_MANAGEMENT
		}

		return CommandCategory.OTHER
	},
}
