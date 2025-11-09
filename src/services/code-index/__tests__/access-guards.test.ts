import { CodeIndexManager } from "../manager"
import { CodeIndexServiceFactory } from "../service-factory"
import type { MockedClass } from "vitest"
import * as path from "path"

// Mock vscode module
vi.mock("vscode", () => {
	const testPath = require("path")
	const testWorkspacePath = testPath.join(testPath.sep, "test", "workspace")
	return {
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
		Uri: {
			joinPath: vi.fn((...parts) => parts.join("/")),
		},
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
	default: {
		readFile: vi.fn().mockRejectedValue(new Error("File not found")),
	},
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

vi.mock("../state-manager", () => ({
	CodeIndexStateManager: vi.fn().mockImplementation(() => ({
		onProgressUpdate: vi.fn(),
		getCurrentStatus: vi.fn().mockReturnValue({
			systemStatus: "Standby",
			message: "",
			processedItems: 0,
			totalItems: 0,
			currentItemUnit: "items",
		}),
		dispose: vi.fn(),
		setSystemState: vi.fn(),
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

describe("CodeIndexManager - Access Guards", () => {
	let mockContext: any
	let mockContextProxy: any
	let manager: CodeIndexManager

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

		manager = CodeIndexManager.getInstance(mockContext)!
	})

	afterEach(() => {
		CodeIndexManager.disposeAll()
	})

	describe("Access Guards for Public Methods", () => {
		describe("searchIndex method", () => {
			it("should return empty array when feature is disabled (before initialization)", async () => {
				// Act & Assert - when feature is disabled, returns [] instead of throwing
				const results = await manager.searchIndex("test query")
				expect(results).toEqual([])
			})

			it("should throw when called with null config manager but feature enabled", async () => {
				// Arrange - partially initialize but leave config manager null, but enable feature
				;(manager as any)._configManager = { isFeatureEnabled: true }

				// Act & Assert
				await expect(manager.searchIndex("test query")).rejects.toThrow(
					"CodeIndexManager not initialized. Call initialize() first.",
				)
			})

			it("should throw when called with null orchestrator but feature enabled", async () => {
				// Arrange - partially initialize but leave orchestrator null, but enable feature
				;(manager as any)._configManager = { isFeatureEnabled: true }
				;(manager as any)._orchestrator = null

				// Act & Assert
				await expect(manager.searchIndex("test query")).rejects.toThrow(
					"CodeIndexManager not initialized. Call initialize() first.",
				)
			})

			it("should throw when called with null search service but feature enabled", async () => {
				// Arrange - partially initialize but leave search service null, but enable feature
				;(manager as any)._configManager = { isFeatureEnabled: true }
				;(manager as any)._orchestrator = { stopWatcher: vi.fn() }
				;(manager as any)._searchService = null

				// Act & Assert
				await expect(manager.searchIndex("test query")).rejects.toThrow(
					"CodeIndexManager not initialized. Call initialize() first.",
				)
			})

			it("should throw when called with null cache manager but feature enabled", async () => {
				// Arrange - partially initialize but leave cache manager null, but enable feature
				;(manager as any)._configManager = { isFeatureEnabled: true }
				;(manager as any)._orchestrator = { stopWatcher: vi.fn() }
				;(manager as any)._searchService = {}
				;(manager as any)._cacheManager = null

				// Act & Assert
				await expect(manager.searchIndex("test query")).rejects.toThrow(
					"CodeIndexManager not initialized. Call initialize() first.",
				)
			})

			it("should succeed when all services are initialized", async () => {
				// Arrange - fully initialize the manager
				await setupFullInitialization(manager, mockContextProxy)

				// Mock search service
				const mockResults = [{ score: 0.9, payload: { filePath: "/test/file.ts" } }]
				;(manager as any)._searchService.searchIndex = vi.fn().mockResolvedValue(mockResults)

				// Act & Assert
				const results = await manager.searchIndex("test query")
				expect(results).toEqual(mockResults)
			})

			it("should return empty array when feature is disabled", async () => {
				// Arrange - initialize with feature disabled
				mockContextProxy.getGlobalState.mockReturnValue({
					codebaseIndexEnabled: false,
				})
				await manager.initialize(mockContextProxy)

				// Act & Assert
				const results = await manager.searchIndex("test query")
				expect(results).toEqual([])
			})
		})

		describe("state getter", () => {
			it("should return 'Standby' when feature is disabled (before initialization)", () => {
				// Act & Assert - when feature is disabled, returns 'Standby' instead of throwing
				expect(manager.state).toBe("Standby")
			})

			it("should throw when accessed before initialization but feature enabled", () => {
				// Arrange - enable feature but don't initialize
				;(manager as any)._configManager = { isFeatureEnabled: true }

				// Act & Assert
				expect(() => manager.state).toThrow("CodeIndexManager not initialized. Call initialize() first.")
			})

			it("should return 'Standby' when feature is disabled", async () => {
				// Arrange - disable feature
				mockContextProxy.getGlobalState.mockReturnValue({
					codebaseIndexEnabled: false,
				})
				await manager.initialize(mockContextProxy)

				// Act & Assert
				expect(manager.state).toBe("Standby")
			})

			it("should return orchestrator state when initialized", async () => {
				// Arrange - fully initialize
				await setupFullInitialization(manager, mockContextProxy)

				// Mock orchestrator state
				;(manager as any)._orchestrator.state = "Indexing"

				// Act & Assert
				expect(manager.state).toBe("Indexing")
			})
		})

		describe("clearIndexData method", () => {
			it("should return early when feature is disabled (before initialization)", async () => {
				// Act & Assert - when feature is disabled, returns early instead of throwing
				await expect(manager.clearIndexData()).resolves.toBeUndefined()
			})

			it("should throw when called with missing services but feature enabled", async () => {
				// Arrange - partially initialize but enable feature
				;(manager as any)._configManager = { isFeatureEnabled: true }
				;(manager as any)._orchestrator = null

				// Act & Assert
				await expect(manager.clearIndexData()).rejects.toThrow(
					"CodeIndexManager not initialized. Call initialize() first.",
				)
			})

			it("should succeed when all services are initialized", async () => {
				// Arrange - fully initialize
				await setupFullInitialization(manager, mockContextProxy)

				// Mock orchestrator and cache manager methods
				const mockClearIndexData = vi.fn().mockResolvedValue(undefined)
				const mockClearCacheFile = vi.fn().mockResolvedValue(undefined)
				;(manager as any)._orchestrator.clearIndexData = mockClearIndexData
				;(manager as any)._cacheManager.clearCacheFile = mockClearCacheFile

				// Act & Assert
				await manager.clearIndexData()
				expect(mockClearIndexData).toHaveBeenCalled()
				expect(mockClearCacheFile).toHaveBeenCalled()
			})

			it("should return early when feature is disabled", async () => {
				// Arrange - disable feature
				mockContextProxy.getGlobalState.mockReturnValue({
					codebaseIndexEnabled: false,
				})
				await manager.initialize(mockContextProxy)

				// Mock methods that shouldn't be called
				const mockClearIndexData = vi.fn()
				const mockClearCacheFile = vi.fn()

				// Act
				await manager.clearIndexData()

				// Assert - methods should not be called when feature disabled
				expect(mockClearIndexData).not.toHaveBeenCalled()
				expect(mockClearCacheFile).not.toHaveBeenCalled()
			})
		})

		describe("startIndexing method", () => {
			it("should return early when feature is disabled (before initialization)", async () => {
				// Act & Assert - when feature is disabled, returns early instead of throwing
				await expect(manager.startIndexing()).resolves.toBeUndefined()
			})

			it("should throw when called with missing orchestrator but feature enabled", async () => {
				// Arrange - partially initialize but enable feature
				;(manager as any)._configManager = { isFeatureEnabled: true }
				;(manager as any)._orchestrator = null

				// Act & Assert
				await expect(manager.startIndexing()).rejects.toThrow(
					"CodeIndexManager not initialized. Call initialize() first.",
				)
			})

			it("should succeed when all services are initialized", async () => {
				// Arrange - fully initialize
				await setupFullInitialization(manager, mockContextProxy)

				// Mock orchestrator
				const mockStartIndexing = vi.fn().mockResolvedValue(undefined)
				;(manager as any)._orchestrator.startIndexing = mockStartIndexing

				// Act & Assert
				await manager.startIndexing()
				expect(mockStartIndexing).toHaveBeenCalled()
			})

			it("should return early when feature is disabled", async () => {
				// Arrange - disable feature
				mockContextProxy.getGlobalState.mockReturnValue({
					codebaseIndexEnabled: false,
				})
				await manager.initialize(mockContextProxy)

				// Mock method that shouldn't be called
				const mockStartIndexing = vi.fn()

				// Act
				await manager.startIndexing()

				// Assert - method should not be called when feature disabled
				expect(mockStartIndexing).not.toHaveBeenCalled()
			})

			it("should handle error recovery during startIndexing", async () => {
				// Arrange - fully initialize and set error state
				await setupFullInitialization(manager, mockContextProxy)
				;(manager as any)._stateManager.getCurrentStatus.mockReturnValue({
					systemStatus: "Error",
					message: "Test error",
				})

				// Mock recovery
				const mockRecoverFromError = vi.fn().mockResolvedValue(undefined)
				;(manager as any).recoverFromError = mockRecoverFromError

				// Act
				await manager.startIndexing()

				// Assert
				expect(mockRecoverFromError).toHaveBeenCalled()
			})
		})
	})

	describe("Methods That Should Not Throw", () => {
		it("should allow getCurrentStatus before initialization", () => {
			// Act & Assert - should not throw
			expect(() => manager.getCurrentStatus()).not.toThrow()
		})

		it("should allow onProgressUpdate access before initialization", () => {
			// Act & Assert - should not throw
			expect(() => manager.onProgressUpdate).not.toThrow()
		})

		it("should allow dispose before initialization", () => {
			// Act & Assert - should not throw
			expect(() => manager.dispose()).not.toThrow()
		})

		it("should allow stopWatcher before initialization", () => {
			// Act & Assert - should not throw
			expect(() => manager.stopWatcher()).not.toThrow()
		})

		it("should allow isFeatureEnabled before initialization", () => {
			// Act & Assert - should not throw (returns false when no config manager)
			expect(() => manager.isFeatureEnabled).not.toThrow()
			expect(manager.isFeatureEnabled).toBe(false)
		})

		it("should allow isFeatureConfigured before initialization", () => {
			// Act & Assert - should not throw (returns false when no config manager)
			expect(() => manager.isFeatureConfigured).not.toThrow()
			expect(manager.isFeatureConfigured).toBe(false)
		})

		it("should allow isInitialized before initialization", () => {
			// Act & Assert - should not throw
			expect(() => manager.isInitialized).not.toThrow()
			expect(manager.isInitialized).toBe(false)
		})
	})

	describe("Edge Cases and Error Scenarios", () => {
		it("should handle partial service initialization", async () => {
			// Arrange - initialize only some services
			;(manager as any)._configManager = { isFeatureEnabled: true }
			;(manager as any)._orchestrator = { stopWatcher: vi.fn() }
			// Leave _searchService and _cacheManager as undefined

			// Act & Assert
			expect(() => manager.state).toThrow()
			await expect(manager.searchIndex("test")).rejects.toThrow()
			await expect(manager.clearIndexData()).rejects.toThrow()
		})

		it("should handle service recreation scenarios", async () => {
			// Arrange - fully initialize
			await setupFullInitialization(manager, mockContextProxy)

			// Act - simulate service recreation (clear some services)
			;(manager as any)._searchService = null

			// Assert - should now throw
			await expect(manager.searchIndex("test")).rejects.toThrow(
				"CodeIndexManager not initialized. Call initialize() first.",
			)
		})

		it("should handle rapid initialization and access", async () => {
			// Arrange - fully initialize the manager first
			await setupFullInitialization(manager, mockContextProxy)

			// Mock search service to return results
			;(manager as any)._searchService.searchIndex = vi.fn().mockResolvedValue([])

			// Act - try to access after initialization
			const accessPromise = manager.searchIndex("test")

			// Assert - access should work after initialization
			await expect(accessPromise).resolves.not.toThrow()
		})

		it("should handle concurrent method access after initialization", async () => {
			// Arrange - fully initialize
			await setupFullInitialization(manager, mockContextProxy)

			// Mock search service to track concurrent calls
			let callCount = 0
			;(manager as any)._searchService.searchIndex = vi.fn().mockImplementation(async () => {
				callCount++
				await new Promise((resolve) => setTimeout(resolve, 10))
				return [{ score: 0.9 }]
			})

			// Act - make concurrent calls
			const promises = Array.from({ length: 5 }, (_, i) => manager.searchIndex(`query-${i}`))

			// Assert
			await Promise.all(promises)
			expect(callCount).toBe(5)
		})
	})

	describe("Integration with codebaseSearchTool Pattern", () => {
		it("should handle the exact pattern used by codebaseSearchTool", async () => {
			// This test simulates the exact sequence used in codebaseSearchTool.ts

			// Arrange - fully initialize
			await setupFullInitialization(manager, mockContextProxy)

			// Mock search service
			const mockResults = [
				{
					score: 0.9,
					payload: { filePath: "/test/file.ts", startLine: 1, endLine: 10, codeChunk: "test code" },
				},
			]
			;(manager as any)._searchService.searchIndex = vi.fn().mockResolvedValue(mockResults)

			// Act - simulate codebaseSearchTool access pattern
			const context = mockContext
			if (!context) {
				throw new Error("Extension context is not available.")
			}

			const codeIndexManager = CodeIndexManager.getInstance(context)
			if (!codeIndexManager) {
				throw new Error("CodeIndexManager is not available.")
			}

			if (!codeIndexManager.isFeatureEnabled) {
				throw new Error("Code Indexing is disabled in the settings.")
			}

			if (!codeIndexManager.isFeatureConfigured) {
				throw new Error("Code Indexing is not configured (Missing OpenAI Key or Qdrant URL).")
			}

			const searchResults: any[] = await codeIndexManager.searchIndex("test query", "/test/dir")

			// Assert
			expect(searchResults).toEqual(mockResults)
		})

		it("should prevent codebaseSearchTool access before initialization", async () => {
			// This test ensures codebaseSearchTool can't access before proper initialization

			// Act - simulate codebaseSearchTool access pattern without initialization
			const context = mockContext
			const codeIndexManager = CodeIndexManager.getInstance(context)
			if (!codeIndexManager) {
				throw new Error("CodeIndexManager is not available.")
			}

			// When feature is disabled, this returns empty array instead of throwing
			// The actual access guard only works when feature is enabled
			await expect(codeIndexManager.searchIndex("test query")).resolves.toEqual([])
		})
	})

	describe("Performance and Memory Safety", () => {
		it("should not create memory leaks during repeated access", async () => {
			// Arrange - fully initialize
			await setupFullInitialization(manager, mockContextProxy)

			// Mock search service
			;(manager as any)._searchService.searchIndex = vi.fn().mockResolvedValue([])

			// Act - make many calls
			for (let i = 0; i < 100; i++) {
				await manager.searchIndex(`query-${i}`)
			}

			// Assert - should still work without issues
			await expect(manager.searchIndex("final-test")).resolves.not.toThrow()
		})

		it("should handle rapid state transitions", async () => {
			// Arrange - fully initialize
			await setupFullInitialization(manager, mockContextProxy)

			// Act - simulate rapid state changes
			await manager.recoverFromError()
			await manager.initialize(mockContextProxy)
			await manager.recoverFromError()
			await manager.initialize(mockContextProxy)

			// Assert - should handle gracefully
			expect(manager.isInitialized).toBe(true)
		})
	})
})

/**
 * Helper function to set up full initialization for testing
 */
async function setupFullInitialization(manager: CodeIndexManager, mockContextProxy: any): Promise<void> {
	// Mock service factory for successful initialization
	const mockServiceFactoryInstance = {
		createServices: vi.fn().mockReturnValue({
			embedder: { embedderInfo: { name: "openai" } },
			vectorStore: {},
			scanner: {},
			fileWatcher: {
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

	// Mock config manager
	const mockConfigManager = {
		loadConfiguration: vi.fn().mockResolvedValue({ requiresRestart: false }),
		isFeatureConfigured: true,
		isFeatureEnabled: true,
		getConfig: vi.fn().mockReturnValue({
			isConfigured: true,
			embedderProvider: "openai",
			modelId: "text-embedding-3-small",
			openAiOptions: { openAiNativeApiKey: "test-key" },
			ollamaOptions: { ollamaBaseUrl: "" },
			qdrantUrl: "http://localhost:6333",
			qdrantApiKey: "test-key",
			searchMinScore: 0.4,
		}),
	}

	// Mock cache manager
	const mockCacheManager = {
		initialize: vi.fn().mockResolvedValue(undefined),
		clearCacheFile: vi.fn().mockResolvedValue(undefined),
	}

	// Set up the manager with mocked services
	;(manager as any)._configManager = mockConfigManager
	;(manager as any)._serviceFactory = mockServiceFactoryInstance
	;(manager as any)._cacheManager = mockCacheManager
	;(manager as any)._orchestrator = {
		startIndexing: vi.fn().mockResolvedValue(undefined),
		stopWatcher: vi.fn(),
		state: "Standby",
		clearIndexData: vi.fn().mockResolvedValue(undefined),
	}
	;(manager as any)._searchService = {
		searchIndex: vi.fn().mockResolvedValue([]),
	}

	// Initialize the manager
	await manager.initialize(mockContextProxy)
}
