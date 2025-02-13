import * as path from "path"
import os from "os"

/*
The Node.js 'path' module resolves and normalizes paths differently depending on the platform:
- On Windows, it uses backslashes (\) as the default path separator.
- On POSIX-compliant systems (Linux, macOS), it uses forward slashes (/) as the default path separator.

While modules like 'upath' can be used to normalize paths to use forward slashes consistently,
this can create inconsistencies when interfacing with other modules (like vscode.fs) that use
backslashes on Windows.

Our approach:
1. We present paths with forward slashes to the AI and user for consistency.
2. We use the 'arePathsEqual' function for safe path comparisons.
3. Internally, Node.js gracefully handles both backslashes and forward slashes.

This strategy ensures consistent path presentation while leveraging Node.js's built-in
path handling capabilities across different platforms.

Note: When interacting with the file system or VS Code APIs, we still use the native path module
to ensure correct behavior on all platforms. The toPosixPath and arePathsEqual functions are
primarily used for presentation and comparison purposes, not for actual file system operations.

Observations:
- Macos isn't so flexible with mixed separators, whereas windows can handle both. ("Node.js does automatically handle path separators on Windows, converting forward slashes to backslashes as needed. However, on macOS and other Unix-like systems, the path separator is always a forward slash (/), and backslashes are treated as regular characters.")
*/

function toPosixPath(p: string) {
	// Extended-Length Paths in Windows start with "\\?\" to allow longer paths and bypass usual parsing. If detected, we return the path unmodified to maintain functionality, as altering these paths could break their special syntax.
	const isExtendedLengthPath = p.startsWith("\\\\?\\")

	if (isExtendedLengthPath) {
		return p
	}

	return p.replace(/\\/g, "/")
}

// Declaration merging allows us to add a new method to the String type
// You must import this file in your entry point (extension.ts) to have access at runtime
declare global {
	interface String {
		toPosix(): string
	}
}

String.prototype.toPosix = function (this: string): string {
	return toPosixPath(this)
}

// Safe path comparison that works across different platforms
export function arePathsEqual(path1?: string, path2?: string): boolean {
	if (!path1 && !path2) {
		return true
	}
	if (!path1 || !path2) {
		return false
	}

	path1 = normalizePath(path1)
	path2 = normalizePath(path2)

	if (process.platform === "win32") {
		return path1.toLowerCase() === path2.toLowerCase()
	}
	return path1 === path2
}

function normalizePath(p: string): string {
	// normalize resolve ./.. segments, removes duplicate slashes, and standardizes path separators
	let normalized = path.normalize(p)
	// however it doesn't remove trailing slashes
	// remove trailing slash, except for root paths
	if (normalized.length > 1 && (normalized.endsWith("/") || normalized.endsWith("\\"))) {
		normalized = normalized.slice(0, -1)
	}
	return normalized
}

export function getReadablePath(cwd: string, relPath?: string): string {
	relPath = relPath || ""

	// Convert to posix format first for consistent handling
	const posixCwd = cwd.replace(/\\/g, "/")
	const posixRelPath = relPath.replace(/\\/g, "/")

	// Resolve the absolute path
	let absolutePath = path.resolve(posixCwd, posixRelPath).replace(/\\/g, "/")

	// Handle drive letter on Windows
	if (process.platform === "win32") {
		const match = absolutePath.match(/^([A-Za-z]):(.+)$/)
		if (match) {
			absolutePath = match[2] // Remove drive letter
		}
	}

	// Handle Desktop path specially
	const desktopPath = path.join(os.homedir(), "Desktop").replace(/\\/g, "/")
	if (arePathsEqual(posixCwd, desktopPath)) {
		return absolutePath
	}

	// If path equals cwd, return just the basename
	const normalizedCwd = posixCwd.replace(/^[A-Za-z]:/, "")
	const normalizedPath = absolutePath.replace(/^[A-Za-z]:/, "")

	if (arePathsEqual(normalizedPath, normalizedCwd)) {
		return path.basename(normalizedCwd)
	}

	// For paths within cwd
	if (normalizedPath.startsWith(normalizedCwd + "/")) {
		return normalizedPath.substring(normalizedCwd.length + 1)
	}

	// For absolute paths or paths outside cwd
	if (path.isAbsolute(posixRelPath) || !normalizedPath.startsWith(normalizedCwd)) {
		// For Windows paths with different drive letters
		if (process.platform === "win32") {
			const relMatch = posixRelPath.match(/^[A-Za-z]:/)
			const cwdMatch = posixCwd.match(/^[A-Za-z]:/)

			// If paths are on different drives or relPath has a drive letter
			if (relMatch && (!cwdMatch || relMatch[0] !== cwdMatch[0])) {
				return normalizedPath
			}
		}
		return normalizedPath
	}

	// For relative paths
	return path.relative(normalizedCwd, normalizedPath)
}

export const toRelativePath = (filePath: string, cwd: string) => {
	const relativePath = path.relative(cwd, filePath).toPosix()
	return filePath.endsWith("/") ? relativePath + "/" : relativePath
}
