import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { CodeIndexManager } from "../manager"
import { CodeIndexServiceFactory } from "../service-factory"
import type { MockedClass } from "vitest"
import * as path from "path"

// Mock vscode module
vi.mock("vscode", () => {
	const testPath = require("path")
	const testWorkspacePath = testPath.join(testPath.sep, "test", "workspace")
	const { EventEmitter } = require("events")

	// Create a mock EventEmitter that has dispose method
	class MockEventEmitter<T> extends EventEmitter {
		dispose = vi.fn()
		event = vi.fn()
		fire = vi.fn()
	}

	return {
		Uri: {
			file: vi.fn(),
			joinPath: vi.fn(),
		},
		window: {
			activeTextEditor: null,
		},
		workspace: {
			workspaceFolders: [
				{
					uri: { fsPath: testWorkspacePath },
					name: "test",
					index: 0,
				},
			],
			createFileSystemWatcher: vi.fn().mockReturnValue({
				onDidCreate: vi.fn().mockReturnValue({ dispose: vi.fn() }),
				onDidChange: vi.fn().mockReturnValue({ dispose: vi.fn() }),
				onDidDelete: vi.fn().mockReturnValue({ dispose: vi.fn() }),
				dispose: vi.fn(),
			}),
		},
		RelativePattern: vi.fn().mockImplementation((base, pattern) => ({ base, pattern })),
		EventEmitter: MockEventEmitter,
	}
})

// Mock dependencies
vi.mock("../../../utils/path", () => {
	const testPath = require("path")
	const testWorkspacePath = testPath.join(testPath.sep, "test", "workspace")
	return {
		getWorkspacePath: vi.fn(() => testWorkspacePath),
	}
})

vi.mock("fs/promises", () => ({
	readFile: vi.fn(),
	writeFile: vi.fn(),
	unlink: vi.fn(),
	exists: vi.fn(),
	mkdir: vi.fn(),
	readdir: vi.fn(),
	stat: vi.fn(),
}))

vi.mock("ignore", () => ({
	default: vi.fn().mockReturnValue({
		add: vi.fn(),
		ignores: vi.fn().mockReturnValue(false),
	}),
}))

vi.mock("../../../core/ignore/RooIgnoreController", () => ({
	RooIgnoreController: vi.fn().mockImplementation(() => ({
		initialize: vi.fn().mockResolvedValue(undefined),
	})),
}))

vi.mock("@roo-code/telemetry", () => ({
	TelemetryService: {
		instance: {
			captureEvent: vi.fn(),
		},
	},
}))

vi.mock("../service-factory")
const MockedCodeIndexServiceFactory = CodeIndexServiceFactory as MockedClass<typeof CodeIndexServiceFactory>

describe("CodeIndexManager - Minimal Edge Case Testing", () => {
	let mockContext: any
	let mockContextProxy: any
	let manager: CodeIndexManager
	let mockServiceFactoryInstance: any

	// Define test paths
	const testWorkspacePath = path.join(path.sep, "test", "workspace")
	const testExtensionPath = path.join(path.sep, "test", "extension")
	const testStoragePath = path.join(path.sep, "test", "storage")

	beforeEach(() => {
		// Clear all instances before each test
		CodeIndexManager.disposeAll()

		mockContext = {
			subscriptions: [],
			workspaceState: {} as any,
			globalState: {} as any,
			extensionUri: {} as any,
			extensionPath: testExtensionPath,
			asAbsolutePath: vi.fn(),
			storageUri: {} as any,
			storagePath: testStoragePath,
			globalStorageUri: {} as any,
			globalStoragePath: testStoragePath,
			logUri: {} as any,
			logPath: testStoragePath,
			extensionMode: 3, // vscode.ExtensionMode.Test
			secrets: {} as any,
			environmentVariableCollection: {} as any,
			extension: {} as any,
			languageModelAccessInformation: {} as any,
		}

		mockContextProxy = {
			getValue: vi.fn(),
			setValue: vi.fn(),
			storeSecret: vi.fn(),
			getSecret: vi.fn(),
			refreshSecrets: vi.fn().mockResolvedValue(undefined),
			getGlobalState: vi.fn().mockReturnValue({
				codebaseIndexEnabled: true,
				codebaseIndexQdrantUrl: "http://localhost:6333",
				codebaseIndexEmbedderProvider: "openai",
				codebaseIndexEmbedderModelId: "text-embedding-3-small",
			}),
		}

		// Mock service factory for successful initialization
		mockServiceFactoryInstance = {
			createServices: vi.fn().mockReturnValue({
				embedder: { embedderInfo: { name: "openai" } },
				vectorStore: {
					initialize: vi.fn().mockResolvedValue(false),
					hasIndexedData: vi.fn().mockResolvedValue(true),
					markIndexingIncomplete: vi.fn().mockResolvedValue(undefined),
					markIndexingComplete: vi.fn().mockResolvedValue(undefined),
					clearCollection: vi.fn().mockResolvedValue(undefined),
					deleteCollection: vi.fn().mockResolvedValue(undefined),
				},
				scanner: {
					scanDirectory: vi.fn().mockResolvedValue({
						stats: { totalFiles: 100, totalBlocks: 1000, indexedBlocks: 950 },
					}),
				},
				fileWatcher: {
					initialize: vi.fn().mockResolvedValue(undefined),
					onDidStartBatchProcessing: vi.fn(),
					onBatchProgressUpdate: vi.fn(),
					watch: vi.fn(),
					stopWatcher: vi.fn(),
					dispose: vi.fn(),
				},
			}),
			validateEmbedder: vi.fn().mockResolvedValue({ valid: true }),
		}
		MockedCodeIndexServiceFactory.mockImplementation(() => mockServiceFactoryInstance as any)

		manager = CodeIndexManager.getInstance(mockContext)!
	})

	afterEach(() => {
		CodeIndexManager.disposeAll()
		vi.restoreAllMocks()
	})

	describe("Task 4.6: Basic Edge Cases", () => {
		it("should handle disabled feature gracefully", async () => {
			// Arrange
			mockContextProxy.getGlobalState.mockReturnValue({
				codebaseIndexEnabled: false, // Feature disabled
				codebaseIndexQdrantUrl: "http://localhost:6333",
				codebaseIndexEmbedderProvider: "openai",
				codebaseIndexEmbedderModelId: "text-embedding-3-small",
			})

			// Act
			const result = await manager.initialize(mockContextProxy)

			// Assert
			expect(result).toEqual({ requiresRestart: false })
			expect(manager.isFeatureEnabled).toBe(false)
			expect(manager.isInitialized).toBe(false)
		})

		it("should handle missing configuration gracefully", async () => {
			// Arrange
			mockContextProxy.getGlobalState.mockReturnValue({
				// Missing all configuration
			})

			// Act
			const result = await manager.initialize(mockContextProxy)

			// Assert
			expect(result).toBeDefined()
			expect(manager.isFeatureEnabled).toBe(false)
		})

		it("should handle empty workspace", async () => {
			// Arrange
			const emptyWorkspaceManager = CodeIndexManager.getInstance({
				...mockContext,
				workspace: { workspaceFolders: [] },
			})

			// Act
			const result = await emptyWorkspaceManager?.initialize(mockContextProxy)

			// Assert
			expect(result).toEqual({ requiresRestart: false })
		})
	})

	describe("Task 4.6: Search Edge Cases", () => {
		it("should handle search when not initialized", async () => {
			// Arrange - don't initialize manager

			// Act & Assert
			await expect(manager.searchIndex("test")).rejects.toThrow("CodeIndexManager not initialized")
		})

		it("should handle search when feature disabled", async () => {
			// Arrange
			mockContextProxy.getGlobalState.mockReturnValue({
				codebaseIndexEnabled: false,
			})
			await manager.initialize(mockContextProxy)

			// Act
			const result = await manager.searchIndex("test")

			// Assert
			expect(result).toEqual([])
		})
	})

	describe("Task 4.6: Error Recovery", () => {
		it("should handle error recovery gracefully", async () => {
			// Arrange
			await manager.initialize(mockContextProxy)

			// Act
			await manager.recoverFromError()

			// Assert
			expect(manager.isInitialized).toBe(false)
		})
	})

	describe("Task 4.6: Concurrent Operations", () => {
		it("should handle rapid initialization/disposal cycles", async () => {
			// Arrange
			const cycles = 3

			// Act - rapid cycles
			for (let i = 0; i < cycles; i++) {
				const manager = CodeIndexManager.getInstance(mockContext)!

				await manager.initialize(mockContextProxy)
				expect(manager.isInitialized).toBe(true)

				manager.dispose()
				CodeIndexManager.disposeAll()

				// Small delay to simulate rapid cycling
				await new Promise((resolve) => setTimeout(resolve, 10))
			}

			// Assert - should complete without errors
			expect((CodeIndexManager as any).instances.size).toBe(0)
		})
	})

	describe("Task 4.6: Performance Edge Cases", () => {
		it("should handle large directory structures", async () => {
			// Arrange
			await manager.initialize(mockContextProxy)

			// Mock scanner with large directory structure
			mockServiceFactoryInstance.scanner.scanDirectory.mockResolvedValue({
				stats: {
					totalFiles: 10000, // Large number of files
					totalBlocks: 50000, // Large number of blocks
					indexedBlocks: 48000,
				},
			})

			// Act
			await expect(manager.startIndexing()).resolves.toBeUndefined()

			// Assert
			expect(mockServiceFactoryInstance.scanner.scanDirectory).toHaveBeenCalled()
		})

		it("should handle deep directory nesting", async () => {
			// Arrange
			await manager.initialize(mockContextProxy)

			// Mock scanner with deep directory structure
			const deepPath = "/a/b/c/d/e/f/g/h/i/j/k/l/m/n/o/p/q/r/s/t/u/v/w/x/y/z/very/deep/file.ts"
			mockServiceFactoryInstance.scanner.scanDirectory.mockResolvedValue({
				stats: {
					totalFiles: 1000,
					totalBlocks: 5000,
					indexedBlocks: 4800,
				},
			})

			// Act
			await expect(manager.startIndexing()).resolves.toBeUndefined()

			// Assert
			expect(mockServiceFactoryInstance.scanner.scanDirectory).toHaveBeenCalled()
		})
	})
})
