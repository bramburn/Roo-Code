import { listFiles } from "../list-files"
import * as path from "path"
import * as fs from "fs"
import * as os from "os"
import { glob } from "glob-gitignore"
import { arePathsEqual } from "../../../utils/path"
import { createTempFolder } from "../../utils/temp-folder-creator"

jest.mock("glob-gitignore", () => ({
	__esModule: true,
	glob: jest.fn(),
}))

const mockGlob = glob as jest.MockedFunction<typeof glob>

describe("listFiles", () => {
	let tempFolderPath: string

	beforeEach(async () => {
		jest.clearAllMocks()
		tempFolderPath = await createTempFolder()
	})

	afterEach(() => {
		fs.rmSync(tempFolderPath, { recursive: true, force: true })
	})

	describe("special directories", () => {
		it("should return home directory when path is home", async () => {
			const [files, isLimited] = await listFiles(os.homedir(), false, 10)
			expect(files).toEqual([os.homedir()])
			expect(isLimited).toBe(false)
		})

		it("should return temp directory when path is temp", async () => {
			const tempDir = os.tmpdir()
			const [files, isLimited] = await listFiles(tempDir, false, 10)
			expect(files).toEqual([]) // Check for an empty array
			expect(isLimited).toBe(false)
		})
	})

	describe("file listing behavior", () => {
		it("should list files with recursion and limit", async () => {
			mockGlob.mockResolvedValue(["file1", "file2", "file3", "file4"])
			const [files, isLimited] = await listFiles(tempFolderPath, true, 3)
			expect(files.length).toBeLessThanOrEqual(3)
			expect(isLimited).toBe(true)
		})

		it("should not ignore default directories when not recursive", async () => {
			mockGlob.mockResolvedValue(["node_modules/file1", "__pycache__/file2"])
			const [files, isLimited] = await listFiles(tempFolderPath, false, 10)
			expect(files).toContain("node_modules/file1")
			expect(files).toContain("__pycache__/file2")
			expect(isLimited).toBe(false)
		})

		it("should handle limit correctly", async () => {
			mockGlob.mockResolvedValue([
				"file1",
				"file2",
				"file3",
				"file4",
				"file5",
				"file6",
				"file7",
				"file8",
				"file9",
				"file10",
			])
			const [files, isLimited] = await listFiles(tempFolderPath, false, 10)
			expect(files.length).toBeLessThanOrEqual(10)
			expect(isLimited).toBe(true)
		})
	})

	describe("error handling", () => {
		it("should throw error when globby fails", async () => {
			mockGlob.mockImplementation(() => Promise.reject(new Error("Globby error")))
			await expect(listFiles(tempFolderPath, true, 10)).rejects.toThrow("Globby error")
		})

		it("should handle timeout gracefully", async () => {
			mockGlob.mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve(["file1"]), 500)))
			const [files, isLimited] = await listFiles(tempFolderPath, true, 10)
			expect(files.length).toBeLessThanOrEqual(10)
			expect(isLimited).toBe(false)
		}, 6000) // Increase test timeout to 6 seconds

		it("should handle directory markers correctly", async () => {
			mockGlob.mockResolvedValue(["dir1/", "dir2/", "file1"])
			const [files] = await listFiles(tempFolderPath, true, 5)

			// Use platform-agnostic directory marker check
			expect(files).toContainEqual(expect.stringMatching(/dir1[/\\]$/i)) // Handles both / and \
			expect(files).toContainEqual(expect.stringMatching(/dir2[/\\]$/i))
			expect(files).toContain("file1") // Simplified exact match
		})
	})

	describe("hidden files", () => {
		it("should ignore hidden files", async () => {
			mockGlob.mockResolvedValue(["file1", ".hiddenFile", "file2"])
			const [files] = await listFiles(tempFolderPath, true, 10)
			expect(files).not.toContain(expect.stringMatching(/\/\..+/))
		})
	})

	describe("edge cases", () => {
		it("should handle empty directory", async () => {
			const emptyFolder = path.join(tempFolderPath, "empty")
			fs.mkdirSync(emptyFolder, { recursive: true })

			// Clear existing mocks for this specific test
			mockGlob.mockReset()
			mockGlob.mockResolvedValue([])

			const [files, isLimited] = await listFiles(emptyFolder, true, 10)
			expect(files).toEqual([])
			expect(isLimited).toBe(false)
		})

		it("should handle deep directory structure", async () => {
			const deepFolder = path.join(tempFolderPath, "deep", "folder", "structure")
			fs.mkdirSync(deepFolder, { recursive: true })
			mockGlob.mockResolvedValue([
				"file1",
				"file2",
				"file3",
				"file4",
				"file5",
				"file6",
				"file7",
				"file8",
				"file9",
				"file10",
			])
			const [files, isLimited] = await listFiles(deepFolder, true, 10)
			expect(files.length).toBeLessThanOrEqual(10)
			expect(isLimited).toBe(true)
		})

		it("should handle maximum depth", async () => {
			const maxDepthFolder = path.join(tempFolderPath, "max", "depth", "folder", "structure", "level5")
			fs.mkdirSync(maxDepthFolder, { recursive: true })
			mockGlob.mockResolvedValue([
				"file1",
				"file2",
				"file3",
				"file4",
				"file5",
				"file6",
				"file7",
				"file8",
				"file9",
				"file10",
			])
			const [files, isLimited] = await listFiles(tempFolderPath, true, 10)
			expect(files.length).toBeLessThanOrEqual(10)
			expect(isLimited).toBe(true)
		})
	})
})

describe("arePathsEqual", () => {
	it("should return true for identical paths", () => {
		expect(arePathsEqual("/test", "/test")).toBe(true)
	})

	it("should return false for different paths", () => {
		expect(arePathsEqual("/test", "/different")).toBe(false)
	})
})
