import { EventEmitter } from "events"
import { Stream } from "stream"
import * as fs from "fs"
import * as childProcess from "child_process"
import { searchWorkspaceFiles } from "../file-search"

describe("File Search with Spaces", () => {
	const mockWorkspacePath = "/test/workspace"

	beforeEach(() => {
		jest.clearAllMocks()
		// Mock file system
		jest.spyOn(fs, "existsSync").mockImplementation(() => true)
		jest.spyOn(fs, "lstatSync").mockImplementation(
			(path: fs.PathLike) =>
				({
					isDirectory: () => path.toString().includes("folder") || path.toString().includes("space"),
					isFile: () => !path.toString().includes("folder") && !path.toString().includes("space"),
				}) as fs.Stats,
		)
	})

	afterEach(() => {
		jest.resetAllMocks()
	})

	it("should handle files with spaces in name", async () => {
		const files = [
			"/test/workspace/my file.txt",
			"/test/workspace/another file.js",
			"/test/workspace/no_spaces.txt",
		]

		// Mock ripgrep process
		jest.spyOn(childProcess, "spawn").mockImplementation(() => {
			const mockProcess = new EventEmitter() as childProcess.ChildProcess
			mockProcess.stdout = new Stream.Readable({ read() {} })

			// Simulate ripgrep output with null-byte separation
			process.nextTick(() => {
				files.forEach((file) => {
					mockProcess.stdout?.emit("data", Buffer.from(file + "\0"))
				})
				mockProcess.emit("close", 0)
			})

			return mockProcess
		})

		const results = await searchWorkspaceFiles("file", mockWorkspacePath)

		expect(results).toContainEqual(
			expect.objectContaining({
				path: "my file.txt",
				type: "file",
				label: "my file.txt",
			}),
		)
	})

	it("should handle directories with spaces", async () => {
		const files = ["/test/workspace/my folder/file.txt", "/test/workspace/another space/test.js"]

		jest.spyOn(childProcess, "spawn").mockImplementation(() => {
			const mockProcess = new EventEmitter() as childProcess.ChildProcess
			mockProcess.stdout = new Stream.Readable({ read() {} })

			process.nextTick(() => {
				files.forEach((file) => {
					mockProcess.stdout?.emit("data", Buffer.from(file + "\0"))
				})
				mockProcess.emit("close", 0)
			})

			return mockProcess
		})

		const results = await searchWorkspaceFiles("space", mockWorkspacePath)

		expect(results).toContainEqual(
			expect.objectContaining({
				path: "another space",
				type: "folder",
				label: "another space",
			}),
		)
	})

	it("should handle multiple consecutive spaces", async () => {
		const files = ["/test/workspace/multiple   spaces.txt", "/test/workspace/normal spaces.txt"]

		jest.spyOn(childProcess, "spawn").mockImplementation(() => {
			const mockProcess = new EventEmitter() as childProcess.ChildProcess
			mockProcess.stdout = new Stream.Readable({ read() {} })

			process.nextTick(() => {
				files.forEach((file) => {
					mockProcess.stdout?.emit("data", Buffer.from(file + "\0"))
				})
				mockProcess.emit("close", 0)
			})

			return mockProcess
		})

		const results = await searchWorkspaceFiles("spaces", mockWorkspacePath)

		expect(results).toHaveLength(2)
		expect(results[0].path).toContain("spaces.txt")
		expect(results[1].path).toContain("spaces.txt")
	})
})
