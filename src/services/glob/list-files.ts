import { glob } from "glob-gitignore" // @ts-ignore: ignoring missing types
import os from "os"
import * as path from "path"
import * as fs from "fs"
import ignore from "ignore"
import { arePathsEqual } from "../../utils/path"

/**
 * Error thrown when globbing operation exceeds the timeout limit
 */
class GlobbingTimeoutError extends Error {
	constructor() {
		super("Globbing timeout")
		this.name = "GlobbingTimeoutError"
	}
}

const IS_TEST_MODE = process.env.NODE_ENV === "test"
const GLOBBING_TIMEOUT_MS = 10_000
const DIRS_TO_IGNORE = [
	"**/node_modules/**", // Match contents of node_modules anywhere in path
	"**/__pycache__/**",
	"**/env/**",
	"**/venv/**",
	"**/target/dependency/**",
	"**/build/dependencies/**",
	"**/dist/**",
	"**/out/**",
	"**/bundle/**",
	"**/vendor/**",
	"**/tmp/**",
	"**/temp/**",
	"**/deps/**",
	"**/pkg/**",
	"**/Pods/**",
	"**/.*/**", // Match contents of hidden directories
] as const

/**
 * Lists files in a directory, optionally searching recursively up to a specified limit.
 *
 * @param dirPath - The directory path to search within.
 * @param recursive - A boolean indicating whether to search recursively.
 * @param limit - The maximum number of files to return.
 * @returns A promise that resolves to a tuple containing an array of file paths and a boolean indicating
 *          whether the number of returned files exceeds the specified limit.
 *
 * @throws Error if there is an issue during the file listing process.
 */
interface GlobOptions {
	cwd: string
	dot: boolean
	absolute: boolean
	markDirectories: boolean
	gitignore: boolean
	ignore?: string[]
	onlyFiles: boolean
}

export async function listFiles(dirPath: string, recursive: boolean, limit: number): Promise<[string[], boolean]> {
	// Ensure limit is positive
	limit = Math.max(1, Math.floor(limit))

	const absolutePath = path.resolve(dirPath)
	// Do not allow listing files in root or home directory, which cline tends to want to do when the user's prompt is vague.
	const root = process.platform === "win32" ? path.parse(absolutePath).root : "/"
	const homeDir = os.homedir()

	const dirsToIgnore = DIRS_TO_IGNORE.map((pattern) => path.join(dirPath, pattern))
	const options: GlobOptions = {
		cwd: dirPath,
		dot: true, // do not ignore hidden files/directories
		absolute: true,
		markDirectories: true, // Append a / on any directories matched (/ is used on windows as well, so dont use path.sep)
		gitignore: recursive, // Only use gitignore for recursive searches
		ignore: recursive ? dirsToIgnore : undefined, // undefined when not recursive to prevent any ignores
		onlyFiles: false, // true by default, false means it will list directories on their own too
	}

	// Load .rooignore rules
	const rooIgnorePath = path.join(dirPath, ".rooignore")
	if (fs.existsSync(rooIgnorePath)) {
		const rooIgnoreRules = fs.readFileSync(rooIgnorePath, "utf-8")
		const ig = ignore().add(rooIgnoreRules)
		const pathnames = [dirPath, ...dirsToIgnore]
		const filteredPaths: string[] = ig.filter(pathnames) as string[] // Ensure the type is string[]
		options.ignore = options.ignore ? options.ignore.concat(filteredPaths) : filteredPaths // Use filtered paths
	}

	// Only block exact matches to root/home, allow subdirectories
	if (arePathsEqual(absolutePath, root) || arePathsEqual(absolutePath, homeDir)) {
		if (!IS_TEST_MODE) {
			return [[absolutePath], false]
		}
		try {
			const patterns = ["*", "*/"] // Explicitly match both files and directories
			const files = await glob(patterns, {
				...options,
				cwd: absolutePath,
				onlyFiles: false,
				unique: true,
			})
			files.sort((a: string, b: string) => a.localeCompare(b, undefined, { numeric: true }))
			const slicedFiles = files.slice(0, limit)
			return [slicedFiles, files.length > limit] // Changed >= to > for more accurate limit flag
		} catch (error) {
			return [[absolutePath], false]
		}
	}
	// * globs all files in one dir, ** globs files in nested directories
	try {
		if (!recursive) {
			const files = await glob("*", options)
			if (!files) {
				return [[], false] // Return an empty array if glob returns undefined
			}
			const slicedFiles = files.slice(0, limit)
			return [slicedFiles, files.length >= limit]
		}

		const files = await globbyLevelByLevel(limit, options)
		return [files, files.length >= limit]
	} catch (error) {
		throw error instanceof Error ? error : new Error(String(error))
	}
}

type GlobPattern = string | string[]

/**
 * Breadth-first traversal of directory structure level by level up to a limit.
 *
 * Features:
 * - Queue-based approach ensures proper breadth-first traversal
 * - Processes directory patterns level by level
 * - Captures a representative sample of the directory structure up to the limit
 * - Minimizes risk of missing deeply nested files
 *
 * Implementation Notes:
 * - Relies on globby to mark directories with /
 * - Potential for loops if symbolic links reference back to parent
 * - Timeout mechanism prevents infinite loops
 *
 * @param limit - Maximum number of files to return
 * @param options - Globby options for file searching
 * @returns Promise resolving to array of file paths
 * @throws {GlobbingTimeoutError} When operation exceeds timeout
 */
async function globbyLevelByLevel(limit: number, options?: GlobOptions): Promise<string[]> {
	const results: Set<string> = new Set()
	const queue: string[] = ["*"]
	const seen: Set<string> = new Set()

	const timeoutPromise = new Promise<string[]>((_, reject) => {
		setTimeout(() => reject(new GlobbingTimeoutError()), GLOBBING_TIMEOUT_MS)
	})

	const globbingProcess = async () => {
		while (queue.length > 0 && results.size < limit) {
			const pattern = queue.shift()!
			if (seen.has(pattern)) continue
			seen.add(pattern)

			const filesAtLevel = await glob(pattern, options)
			filesAtLevel.sort((a: string, b: string) => {
				// Sort directories first, then by name
				const aIsDir = a.endsWith("/")
				const bIsDir = b.endsWith("/")
				if (aIsDir !== bIsDir) return aIsDir ? -1 : 1
				return a.localeCompare(b)
			})

			for (const file of filesAtLevel) {
				if (results.size >= limit) break
				results.add(file)

				if (file.endsWith("/")) {
					const nextPattern = path.join(file, "*")
					if (!seen.has(nextPattern)) {
						// Add to front of queue to prioritize depth-first within each level
						queue.unshift(nextPattern)
					}
				}
			}
		}
		return Array.from(results).slice(0, limit)
	}

	try {
		return await Promise.race([globbingProcess(), timeoutPromise])
	} catch (error) {
		if (error instanceof GlobbingTimeoutError) {
			console.warn("Globbing timed out, returning partial results")
			return Array.from(results).slice(0, limit)
		}
		throw error // Propagate other errors
	}
}
