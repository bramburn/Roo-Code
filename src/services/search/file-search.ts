import * as vscode from "vscode"
import * as path from "path"
import * as fs from "fs"
import * as childProcess from "child_process"
import * as readline from "readline"
import { byLengthAsc, Fzf } from "fzf"
import { getBinPath } from "../ripgrep"

async function executeRipgrepForFiles(
	rgPath: string,
	workspacePath: string,
	limit: number = 5000,
): Promise<{ path: string; type: "file" | "folder"; label?: string }[]> {
	return new Promise((resolve, reject) => {
		const args = [
			"--files",
			"--follow",
			"--hidden",
			"-g",
			"!**/node_modules/**",
			"-g",
			"!**/.git/**",
			"-g",
			"!**/out/**",
			"-g",
			"!**/dist/**",
			// Use null-byte as separator to safely handle paths with spaces
			"--null",
			workspacePath,
		]

		const rgProcess = childProcess.spawn(rgPath, args)
		const rl = readline.createInterface({
			input: rgProcess.stdout,
			crlfDelay: Infinity,
		})

		const fileResults: { path: string; type: "file" | "folder"; label?: string }[] = []
		const dirSet = new Set<string>() // Track unique directory paths
		let count = 0

		// Buffer to store partial lines (when using null-byte separator)
		let buffer = ""

		rgProcess.stdout.on("data", (data) => {
			buffer += data.toString()

			// Split on null bytes, keeping the last partial chunk in the buffer
			const lines = buffer.split("\0")
			buffer = lines.pop() || ""

			for (const line of lines) {
				if (count >= limit) {
					rgProcess.kill()
					break
				}

				if (!line.trim()) continue

				try {
					const relativePath = path.relative(workspacePath, line)

					// Add the file itself
					fileResults.push({
						path: relativePath,
						type: "file",
						// Preserve spaces in label
						label: path.basename(relativePath),
					})

					// Extract and store all parent directory paths
					let dirPath = path.dirname(relativePath)
					while (dirPath && dirPath !== "." && dirPath !== "/") {
						// Preserve spaces in directory paths
						dirSet.add(dirPath)
						dirPath = path.dirname(dirPath)
					}

					count++
				} catch (error) {
					// Silently ignore errors processing individual paths
				}
			}
		})

		rgProcess.on("close", () => {
			// Process any remaining data in buffer
			if (buffer && count < limit) {
				try {
					const relativePath = path.relative(workspacePath, buffer)
					fileResults.push({
						path: relativePath,
						type: "file",
						label: path.basename(relativePath),
					})
				} catch {}
			}

			// Add directory entries
			const dirResults = Array.from(dirSet).map((dir) => ({
				path: dir,
				type: "folder" as const,
				label: path.basename(dir),
			}))

			resolve([...fileResults, ...dirResults])
		})

		rgProcess.on("error", reject)
	})
}

export async function searchWorkspaceFiles(
	query: string,
	workspacePath: string,
	limit: number = 20,
): Promise<{ path: string; type: "file" | "folder"; label?: string }[]> {
	try {
		const vscodeAppRoot = vscode.env.appRoot
		const rgPath = await getBinPath(vscodeAppRoot)

		if (!rgPath) {
			throw new Error("Could not find ripgrep binary")
		}

		// Get all files and directories
		const allItems = await executeRipgrepForFiles(rgPath, workspacePath, 5000)

		// If no query, just return the top items
		if (!query.trim()) {
			return allItems.slice(0, limit)
		}

		// Create search items for all files AND directories
		const searchItems = allItems.map((item) => ({
			original: item,
			// Include both path and label in search, but normalize spaces for matching
			searchStr: `${item.path.replace(/\s+/g, " ")} ${item.label || ""}`,
		}))

		// Run fzf search on all items
		const fzf = new Fzf(searchItems, {
			selector: (item) => item.searchStr,
			tiebreakers: [byLengthAsc],
			limit: limit,
			// Use v2 fuzzy matching algorithm
			fuzzy: "v2",
		})

		// Get all matching results from fzf
		const fzfResults = fzf.find(query).map((result) => result.item.original)

		// Verify types of the shortest results
		const verifiedResults = await Promise.all(
			fzfResults.map(async (result) => {
				const fullPath = path.join(workspacePath, result.path)
				if (fs.existsSync(fullPath)) {
					const isDirectory = fs.lstatSync(fullPath).isDirectory()
					return {
						...result,
						type: isDirectory ? ("folder" as const) : ("file" as const),
					}
				}
				return result
			}),
		)

		return verifiedResults
	} catch (error) {
		console.error("Error searching workspace files:", error)
		return []
	}
}
