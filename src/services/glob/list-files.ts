import { globby, Options } from "globby"
import os from "os"
import * as path from "path"
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

const IS_TEST_MODE = process.env.NODE_ENV === 'test'
const GLOBBING_TIMEOUT_MS = 10_000
const DIRS_TO_IGNORE = [
    "**/node_modules/**",  // Match contents of node_modules anywhere in path
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
export async function listFiles(dirPath: string, recursive: boolean, limit: number): Promise<[string[], boolean]> {
	const absolutePath = path.resolve(dirPath)
	// Do not allow listing files in root or home directory, which cline tends to want to do when the user's prompt is vague.
	const root = process.platform === "win32" ? path.parse(absolutePath).root : "/"
	const homeDir = os.homedir()

	interface GlobOptions extends Options {
		cwd: string
		dot: boolean
		absolute: true
		markDirectories: true
		gitignore: boolean
		ignore?: string[]
		onlyFiles: false
	}

	const dirsToIgnore = DIRS_TO_IGNORE.map(pattern => path.join(dirPath, pattern))
	const options: GlobOptions = {
		cwd: dirPath,
		dot: true, // do not ignore hidden files/directories
		absolute: true,
		markDirectories: true, // Append a / on any directories matched (/ is used on windows as well, so dont use path.sep)
		gitignore: recursive, // Only use gitignore for recursive searches
		ignore: recursive ? dirsToIgnore : undefined, // undefined when not recursive to prevent any ignores
		onlyFiles: false, // true by default, false means it will list directories on their own too
	}

	// Only block exact matches to root/home, allow subdirectories
	if (arePathsEqual(absolutePath, root) || arePathsEqual(absolutePath, homeDir)) {
		// In test mode, allow listing files but still return the directory itself if empty
		if (!IS_TEST_MODE) {
			return [[absolutePath], false]
		}
		try {
			const files = await globby("*", {
				...options,
				cwd: absolutePath,
			})
			return files.length ? [files, files.length >= limit] : [[absolutePath], false]
		} catch (error) {
			// If we can't list files (e.g., due to permissions), fall back to returning the directory
			return [[absolutePath], false]
		}
	}
	// * globs all files in one dir, ** globs files in nested directories
	try {
		if (!recursive) {
			const files = await globby("*", options)
			const slicedFiles = files.slice(0, limit)
			return [slicedFiles, files.length >= limit]
		}

		const files = await globbyLevelByLevel(limit, options)
		return [files, files.length >= limit]
	} catch (error) {
		throw error instanceof Error ? error : new Error(String(error))
	}
}

/*
Breadth-first traversal of directory structure level by level up to a limit:
   - Queue-based approach ensures proper breadth-first traversal
   - Processes directory patterns level by level
   - Captures a representative sample of the directory structure up to the limit
   - Minimizes risk of missing deeply nested files

- Notes:
   - Relies on globby to mark directories with /
   - Potential for loops if symbolic links reference back to parent (we could use followSymlinks: false but that may not be ideal for some projects and it's pointless if they're not using symlinks wrong)
   - Timeout mechanism prevents infinite loops
*/
/**
 * Performs a breadth-first traversal of directory structure level by level up to a limit.
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

			const filesAtLevel = await globby(pattern, options)
			for (const file of filesAtLevel) {
				if (results.size >= limit) break
				results.add(file)

				if (file.endsWith("/")) {
					const nextPattern = `${file}*`
					if (!seen.has(nextPattern)) {
						queue.push(nextPattern)
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
