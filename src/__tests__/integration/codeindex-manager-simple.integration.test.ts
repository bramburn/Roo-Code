import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { CodeIndexManager } from "../../services/code-index/manager"
import { ContextProxy } from "../../core/config/ContextProxy"
import * as vscode from "vscode"

// Mock vscode module with all required exports
vi.mock("vscode", () => ({
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
				uri: { fsPath: "/test/workspace" },
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
		asRelativePath: vi.fn((filePath: string) => filePath),
	},
	RelativePattern: vi.fn().mockImplementation((base, pattern) => ({ base, pattern })),
	EventEmitter: vi.fn().mockImplementation(() => ({
		event: vi.fn(),
		fire: vi.fn(),
		dispose: vi.fn(),
	})),
}))

// Mock all dependencies to avoid complex setup
vi.mock("../../services/code-index/service-factory", () => ({
	CodeIndexServiceFactory: vi.fn().mockImplementation(() => ({
		createServices: vi.fn().mockReturnValue({
			embedder: {
				embedderInfo: { name: "openai" },
				createEmbeddings: vi.fn().mockResolvedValue({
					embeddings: [[0.1, 0.2, 0.3]],
					usage: { total_tokens: 10 },
				}),
			},
			vectorStore: {
				initialize: vi.fn().mockResolvedValue(false),
				hasIndexedData: vi.fn().mockResolvedValue(true),
				search: vi.fn().mockResolvedValue([]),
				markIndexingIncomplete: vi.fn().mockResolvedValue(undefined),
				markIndexingComplete: vi.fn().mockResolvedValue(undefined),
				clearCollection: vi.fn().mockResolvedValue(undefined),
				deleteCollection: vi.fn().mockResolvedValue(undefined),
			},
			scanner: {
				scanDirectory: vi.fn().mockResolvedValue({
					stats: { filesScanned: 10, blocksFound: 50, blocksIndexed: 50 },
				}),
			},
			fileWatcher: {
				initialize: vi.fn().mockResolvedValue(undefined),
				onDidStartBatchProcessing: vi.fn().mockReturnValue({ dispose: vi.fn() }),
				onBatchProgressUpdate: vi.fn().mockReturnValue({ dispose: vi.fn() }),
				onDidFinishBatchProcessing: vi.fn().mockReturnValue({ dispose: vi.fn() }),
				dispose: vi.fn(),
			},
		}),
		validateEmbedder: vi.fn().mockResolvedValue({ valid: true }),
	})),
}))

vi.mock("fs/promises", () => ({
	default: {
		readFile: vi.fn().mockResolvedValue(""),
		mkdir: vi.fn().mockResolvedValue(undefined),
		writeFile: vi.fn().mockResolvedValue(undefined),
		stat: vi.fn().mockResolvedValue({
			isFile: () => true,
			isDirectory: () => false,
			size: 1024,
		}),
	},
}))

vi.mock("ignore", () => ({
	default: vi.fn().mockReturnValue({
		add: vi.fn(),
		ignores: vi.fn().mockReturnValue(false),
	}),
}))

vi.mock("../../core/ignore/RooIgnoreController", () => ({
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

describe("CodeIndexManager Simple Integration Tests", () => {
	let mockContext: vscode.ExtensionContext
	let mockContextProxy: ContextProxy
	let manager: CodeIndexManager
	let testWorkspacePath: string

	beforeEach(() => {
		// Clear all instances before each test
		CodeIndexManager.disposeAll()
		vi.clearAllMocks()

		testWorkspacePath = "/test/workspace"

		mockContext = {
			subscriptions: [],
			workspaceState: {} as any,
			globalState: {} as any,
			extensionUri: {} as any,
			extensionPath: "/test/extension",
			asAbsolutePath: vi.fn(),
			storageUri: {} as any,
			storagePath: "/test/storage",
			globalStorageUri: { fsPath: "/test/global-storage" } as any,
			globalStoragePath: "/test/global-storage",
			logUri: {} as any,
			logPath: "/test/logs",
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
			getSecret: vi.fn().mockReturnValue("test-api-key"),
			refreshSecrets: vi.fn().mockResolvedValue(undefined),
			getGlobalState: vi.fn().mockReturnValue({
				codebaseIndexEnabled: true,
				codebaseIndexQdrantUrl: "http://localhost:6333",
				codebaseIndexEmbedderProvider: "openai",
				codebaseIndexEmbedderModelId: "text-embedding-3-small",
				codebaseIndexSearchMinScore: 0.7,
				codebaseIndexSearchMaxResults: 10,
			}),
		} as any

		manager = CodeIndexManager.getInstance(mockContext, testWorkspacePath)!
	})

	afterEach(() => {
		CodeIndexManager.disposeAll()
		vi.restoreAllMocks()
	})

	describe("Basic Integration", () => {
		it("should initialize successfully with valid configuration", async () => {
			// Act
			const result = await manager.initialize(mockContextProxy)

			// Assert
			expect(result.requiresRestart).toBe(true) // First time requires restart
			expect(manager.isInitialized).toBe(true)
			expect(manager.isFeatureEnabled).toBe(true)
			expect(manager.isFeatureConfigured).toBe(true)
		})

		it("should handle disabled feature", async () => {
			// Arrange
			const disabledContextProxy = {
				...mockContextProxy,
				getGlobalState: vi.fn().mockReturnValue({
					codebaseIndexEnabled: false,
				}),
			} as any

			// Act
			const result = await manager.initialize(disabledContextProxy)

			// Assert
			expect(result.requiresRestart).toBe(false)
			expect(manager.isFeatureEnabled).toBe(false)
		})

		it("should handle unconfigured feature", async () => {
			// Arrange
			const unconfiguredContextProxy = {
				...mockContextProxy,
				getSecret: vi.fn().mockReturnValue(undefined), // No API key
			}

			// Act
			const result = await manager.initialize(unconfiguredContextProxy)

			// Assert
			expect(result.requiresRestart).toBe(true)
			expect(manager.isFeatureEnabled).toBe(true)
			expect(manager.isFeatureConfigured).toBe(false)
		})
	})

	describe("State Management Integration", () => {
		it("should maintain state consistency", async () => {
			// Arrange
			await manager.initialize(mockContextProxy)

			// Act
			const status1 = manager.getCurrentStatus()
			const status2 = manager.getCurrentStatus()

			// Assert
			expect(status1.systemStatus).toBe(status2.systemStatus)
			expect(status1.workspacePath).toBe(testWorkspacePath)
		})

		it("should handle error recovery", async () => {
			// Arrange
			await manager.initialize(mockContextProxy)

			// Act
			await manager.recoverFromError()

			// Assert
			expect(manager.isInitialized).toBe(false)
		})
	})

	describe("Search Integration", () => {
		it("should handle search when feature disabled", async () => {
			// Arrange
			const disabledContextProxy = {
				...mockContextProxy,
				getGlobalState: vi.fn().mockReturnValue({
					codebaseIndexEnabled: false,
				}),
			} as any

			await manager.initialize(disabledContextProxy)

			// Act
			const results = await manager.searchIndex("test query")

			// Assert
			expect(results).toEqual([])
		})

		it("should handle search when not configured", async () => {
			// Arrange
			const unconfiguredContextProxy = {
				...mockContextProxy,
				getSecret: vi.fn().mockReturnValue(undefined),
			}

			await manager.initialize(unconfiguredContextProxy)

			// Act
			const results = await manager.searchIndex("test query")

			// Assert
			expect(results).toEqual([])
		})
	})

	describe("Resource Management Integration", () => {
		it("should handle multiple workspace instances", async () => {
			// Arrange
			const workspace1 = "/test/workspace1"
			const workspace2 = "/test/workspace2"

			const manager1 = CodeIndexManager.getInstance(mockContext, workspace1)!
			const manager2 = CodeIndexManager.getInstance(mockContext, workspace2)!

			// Act
			await manager1.initialize(mockContextProxy)
			await manager2.initialize(mockContextProxy)

			// Assert
			expect(manager1.workspacePath).toBe(workspace1)
			expect(manager2.workspacePath).toBe(workspace2)
			expect(manager1.isInitialized).toBe(true)
			expect(manager2.isInitialized).toBe(true)

			// Cleanup
			CodeIndexManager.disposeAll()
		})

		it("should handle disposal properly", async () => {
			// Arrange
			await manager.initialize(mockContextProxy)

			// Act
			manager.dispose()

			// Assert - should not throw when accessing disposed manager
			expect(() => manager.getCurrentStatus()).not.toThrow()
		})
	})

	describe("Error Handling Integration", () => {
		it("should handle initialization errors gracefully", async () => {
			// Arrange
			const errorContextProxy = {
				...mockContextProxy,
				getGlobalState: vi.fn().mockImplementation(() => {
					throw new Error("Configuration error")
				}),
			}

			// Act & Assert
			await expect(manager.initialize(errorContextProxy)).rejects.toThrow("Configuration error")
			expect(manager.isInitialized).toBe(false)
		})

		it("should handle search errors gracefully", async () => {
			// Arrange
			await manager.initialize(mockContextProxy)

			// Enable feature but don't configure services properly
			;(manager as any)._configManager = { isFeatureEnabled: true }
			;(manager as any)._searchService = undefined

			// Act & Assert
			await expect(manager.searchIndex("test")).rejects.toThrow("CodeIndexManager not initialized")
		})
	})

	describe("Configuration Changes Integration", () => {
		it("should handle settings changes", async () => {
			// Arrange
			await manager.initialize(mockContextProxy)

			// Act
			await expect(manager.handleSettingsChange()).resolves.not.toThrow()

			// Assert
			expect(manager.isFeatureEnabled).toBe(true)
		})

		it("should handle feature disable via settings", async () => {
			// Arrange
			await manager.initialize(mockContextProxy)

			const disabledContextProxy = {
				...mockContextProxy,
				getGlobalState: vi.fn().mockReturnValue({
					codebaseIndexEnabled: false,
				}),
			} as any

			// Act
			await manager.handleSettingsChange()

			// Assert - should handle gracefully
			expect(manager.isFeatureEnabled).toBe(true) // Still enabled until next init
		})
	})

	describe("Performance Integration", () => {
		it("should handle concurrent operations", async () => {
			// Arrange
			await manager.initialize(mockContextProxy)

			// Act
			const operations = [manager.getCurrentStatus(), manager.getCurrentStatus(), manager.getCurrentStatus()]

			const results = await Promise.all(operations)

			// Assert
			expect(results).toHaveLength(3)
			results.forEach((result) => {
				expect(result.workspacePath).toBe(testWorkspacePath)
			})
		})

		it("should initialize within reasonable time", async () => {
			// Act
			const startTime = Date.now()
			await manager.initialize(mockContextProxy)
			const endTime = Date.now()

			// Assert
			expect(endTime - startTime).toBeLessThan(5000) // 5 seconds
		})
	})
})
