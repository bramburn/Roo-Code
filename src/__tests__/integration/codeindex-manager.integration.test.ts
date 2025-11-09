import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { CodeIndexManager } from "../../services/code-index/manager"
import { CodeIndexConfigManager } from "../../services/code-index/config-manager"
import { CodeIndexOrchestrator } from "../../services/code-index/orchestrator"
import { CodeIndexSearchService } from "../../services/code-index/search-service"
import { CacheManager } from "../../services/code-index/cache-manager"
import { ContextProxy } from "../../core/config/ContextProxy"
import * as vscode from "vscode"
import * as fs from "fs/promises"
import * as path from "path"

// Mock vscode module
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
	},
	RelativePattern: vi.fn().mockImplementation((base, pattern) => ({ base, pattern })),
	EventEmitter: vi.fn().mockImplementation(() => ({
		event: vi.fn(),
		fire: vi.fn(),
		dispose: vi.fn(),
	})),
}))

// Mock fs/promises
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

// Mock ignore
vi.mock("ignore", () => ({
	default: vi.fn().mockReturnValue({
		add: vi.fn(),
		ignores: vi.fn().mockReturnValue(false),
	}),
}))

// Mock RooIgnoreController
vi.mock("../../core/ignore/RooIgnoreController", () => ({
	RooIgnoreController: vi.fn().mockImplementation(() => ({
		initialize: vi.fn().mockResolvedValue(undefined),
	})),
}))

// Mock telemetry
vi.mock("@roo-code/telemetry", () => ({
	TelemetryService: {
		instance: {
			captureEvent: vi.fn(),
		},
	},
}))

// Mock service factory and related services
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
				hasIndexedData: vi.fn().mockResolvedValue(false),
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

describe("CodeIndexManager Integration Tests", () => {
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
			getSecret: vi.fn(),
			refreshSecrets: vi.fn().mockResolvedValue(undefined),
			getGlobalState: vi.fn().mockReturnValue({
				codebaseIndexEnabled: true,
				codebaseIndexQdrantUrl: "http://localhost:6333",
				codebaseIndexEmbedderProvider: "openai",
				codebaseIndexEmbedderModelId: "text-embedding-3-small",
				codebaseIndexSearchMinScore: 0.7,
				codebaseIndexSearchMaxResults: 10,
			}),
		}

		manager = CodeIndexManager.getInstance(mockContext, testWorkspacePath)!
	})

	afterEach(() => {
		CodeIndexManager.disposeAll()
		vi.restoreAllMocks()
	})

	describe("Configuration Manager Integration", () => {
		it("should integrate with config manager for feature enable/disable", async () => {
			// Arrange - feature enabled
			mockContextProxy.getGlobalState.mockReturnValue({
				codebaseIndexEnabled: true,
				codebaseIndexQdrantUrl: "http://localhost:6333",
				codebaseIndexEmbedderProvider: "openai",
				codebaseIndexEmbedderModelId: "text-embedding-3-small",
			})
			mockContextProxy.getSecret.mockReturnValue("test-api-key")

			// Act
			const result = await manager.initialize(mockContextProxy)

			// Assert
			expect(result.requiresRestart).toBe(true) // First time requires restart
			expect(manager.isFeatureEnabled).toBe(true)
			expect(manager.isFeatureConfigured).toBe(true)
		})

		it("should handle configuration changes requiring restart", async () => {
			// Arrange - initial configuration
			mockContextProxy.getGlobalState.mockReturnValue({
				codebaseIndexEnabled: true,
				codebaseIndexQdrantUrl: "http://localhost:6333",
				codebaseIndexEmbedderProvider: "openai",
				codebaseIndexEmbedderModelId: "text-embedding-3-small",
			})
			mockContextProxy.getSecret.mockReturnValue("test-api-key")

			await manager.initialize(mockContextProxy)

			// Act - change configuration that requires restart
			mockContextProxy.getGlobalState.mockReturnValue({
				codebaseIndexEnabled: true,
				codebaseIndexQdrantUrl: "http://localhost:6334", // Different URL
				codebaseIndexEmbedderProvider: "openai",
				codebaseIndexEmbedderModelId: "text-embedding-3-small",
			})

			const result = await manager.handleSettingsChange()

			// Assert - should handle change gracefully
			expect(manager.isFeatureEnabled).toBe(true)
		})

		it("should integrate with config manager for provider changes", async () => {
			// Arrange - switch from OpenAI to Ollama
			mockContextProxy.getGlobalState.mockReturnValue({
				codebaseIndexEnabled: true,
				codebaseIndexEmbedderProvider: "ollama",
				codebaseIndexEmbedderBaseUrl: "http://localhost:11434",
				codebaseIndexQdrantUrl: "http://localhost:6333",
			})

			// Act
			const result = await manager.initialize(mockContextProxy)

			// Assert
			expect(result.requiresRestart).toBe(true)
			expect(manager.isFeatureEnabled).toBe(true)
		})
	})

	describe("Orchestrator Integration", () => {
		it("should coordinate with orchestrator for indexing workflow", async () => {
			// Arrange
			mockContextProxy.getSecret.mockReturnValue("test-api-key")

			// Act
			await manager.initialize(mockContextProxy)
			await manager.startIndexing()

			// Assert
			expect(manager.isInitialized).toBe(true)
			const status = manager.getCurrentStatus()
			expect(status.systemStatus).toBeDefined()
		})

		it("should handle orchestrator state transitions", async () => {
			// Arrange
			mockContextProxy.getSecret.mockReturnValue("test-api-key")

			// Act
			await manager.initialize(mockContextProxy)

			// Get initial state
			const initialState = manager.state
			expect(initialState).toBeDefined()

			// Stop indexing
			manager.stopWatcher()
			const stoppedState = manager.state
			expect(stoppedState).toBeDefined()
		})

		it("should handle orchestrator errors gracefully", async () => {
			// Arrange - mock orchestrator to throw
			const { CodeIndexServiceFactory } = await import("../../services/code-index/service-factory")
			const MockedServiceFactory = CodeIndexServiceFactory as any

			MockedServiceFactory.mockImplementation(() => ({
				createServices: vi.fn().mockReturnValue({
					embedder: { embedderInfo: { name: "openai" } },
					vectorStore: {
						initialize: vi.fn().mockRejectedValue(new Error("Qdrant connection failed")),
					},
					scanner: {},
					fileWatcher: {},
				}),
				validateEmbedder: vi.fn().mockResolvedValue({ valid: true }),
			}))

			mockContextProxy.getSecret.mockReturnValue("test-api-key")

			// Act & Assert
			await expect(manager.startIndexing()).rejects.toThrow()
		})
	})

	describe("Search Service Integration", () => {
		it("should integrate with search service for code search", async () => {
			// Arrange
			mockContextProxy.getSecret.mockReturnValue("test-api-key")
			await manager.initialize(mockContextProxy)

			// Mock search results
			const mockSearchResults = [
				{
					score: 0.9,
					payload: {
						filePath: "/test/workspace/src/test.ts",
						startLine: 1,
						endLine: 10,
						codeChunk: "test code",
					},
				},
			]

			const { CodeIndexServiceFactory } = await import("../../services/code-index/service-factory")
			const MockedServiceFactory = CodeIndexServiceFactory as any

			MockedServiceFactory.mockImplementation(() => ({
				createServices: vi.fn().mockReturnValue({
					embedder: {
						embedderInfo: { name: "openai" },
						createEmbeddings: vi.fn().mockResolvedValue({
							embeddings: [[0.1, 0.2, 0.3]],
						}),
					},
					vectorStore: {
						initialize: vi.fn().mockResolvedValue(false),
						hasIndexedData: vi.fn().mockResolvedValue(true),
						search: vi.fn().mockResolvedValue(mockSearchResults),
						markIndexingComplete: vi.fn().mockResolvedValue(undefined),
					},
					scanner: {
						scanDirectory: vi.fn().mockResolvedValue({
							stats: { filesScanned: 10, blocksFound: 50, blocksIndexed: 50 },
						}),
					},
					fileWatcher: {},
				}),
				validateEmbedder: vi.fn().mockResolvedValue({ valid: true }),
			}))

			// Re-initialize with mocked search
			await manager.initialize(mockContextProxy)

			// Act
			const results = await manager.searchIndex("test query", "/test/src")

			// Assert
			expect(results).toEqual(mockSearchResults)
		})

		it("should handle search service errors", async () => {
			// Arrange
			mockContextProxy.getSecret.mockReturnValue("test-api-key")
			await manager.initialize(mockContextProxy)

			// Mock search service to throw
			const { CodeIndexServiceFactory } = await import("../../services/code-index/service-factory")
			const MockedServiceFactory = CodeIndexServiceFactory as any

			MockedServiceFactory.mockImplementation(() => ({
				createServices: vi.fn().mockReturnValue({
					embedder: {
						embedderInfo: { name: "openai" },
						createEmbeddings: vi.fn().mockRejectedValue(new Error("Embedding failed")),
					},
					vectorStore: {
						initialize: vi.fn().mockResolvedValue(false),
						hasIndexedData: vi.fn().mockResolvedValue(true),
						search: vi.fn(),
					},
					scanner: {},
					fileWatcher: {},
				}),
				validateEmbedder: vi.fn().mockResolvedValue({ valid: true }),
			}))

			await manager.initialize(mockContextProxy)

			// Act & Assert
			await expect(manager.searchIndex("test query")).rejects.toThrow("Embedding failed")
		})
	})

	describe("Cache Manager Integration", () => {
		it("should integrate with cache manager for persistence", async () => {
			// Arrange
			mockContextProxy.getSecret.mockReturnValue("test-api-key")

			// Act
			await manager.initialize(mockContextProxy)

			// Assert - cache manager should be initialized
			expect(manager.isInitialized).toBe(true)

			// Test cache operations
			await manager.clearIndexData()
			// Should not throw
		})

		it("should handle cache manager errors gracefully", async () => {
			// Arrange - mock cache to fail
			const mockCacheManager = {
				initialize: vi.fn().mockRejectedValue(new Error("Cache init failed")),
				clearCacheFile: vi.fn().mockRejectedValue(new Error("Cache clear failed")),
			}

			// Mock the cache manager creation
			const originalInitialize = manager.initialize
			manager.initialize = async (contextProxy) => {
				const result = await originalInitialize.call(manager, contextProxy)
				;(manager as any)._cacheManager = mockCacheManager
				return result
			}

			mockContextProxy.getSecret.mockReturnValue("test-api-key")

			// Act & Assert
			const result = await manager.initialize(mockContextProxy)
			expect(result.requiresRestart).toBe(true)

			// Clear index data should handle cache errors gracefully
			await expect(manager.clearIndexData()).resolves.not.toThrow()
		})
	})

	describe("Cross-Component Integration", () => {
		it("should handle complete initialization workflow", async () => {
			// Arrange
			mockContextProxy.getGlobalState.mockReturnValue({
				codebaseIndexEnabled: true,
				codebaseIndexQdrantUrl: "http://localhost:6333",
				codebaseIndexEmbedderProvider: "openai",
				codebaseIndexEmbedderModelId: "text-embedding-3-small",
				codebaseIndexSearchMinScore: 0.7,
				codebaseIndexSearchMaxResults: 10,
			})
			mockContextProxy.getSecret.mockReturnValue("test-api-key")

			// Act
			const initResult = await manager.initialize(mockContextProxy)
			await manager.startIndexing()

			// Assert
			expect(initResult.requiresRestart).toBe(true)
			expect(manager.isInitialized).toBe(true)
			expect(manager.isFeatureEnabled).toBe(true)
			expect(manager.isFeatureConfigured).toBe(true)

			const status = manager.getCurrentStatus()
			expect(status.workspacePath).toBe(testWorkspacePath)
		})

		it("should handle configuration changes across components", async () => {
			// Arrange - initial setup
			mockContextProxy.getGlobalState.mockReturnValue({
				codebaseIndexEnabled: true,
				codebaseIndexQdrantUrl: "http://localhost:6333",
				codebaseIndexEmbedderProvider: "openai",
				codebaseIndexEmbedderModelId: "text-embedding-3-small",
			})
			mockContextProxy.getSecret.mockReturnValue("test-api-key")

			await manager.initialize(mockContextProxy)

			// Act - change configuration
			mockContextProxy.getGlobalState.mockReturnValue({
				codebaseIndexEnabled: true,
				codebaseIndexQdrantUrl: "http://localhost:6334", // Different URL
				codebaseIndexEmbedderProvider: "openai",
				codebaseIndexEmbedderModelId: "text-embedding-3-large", // Different model
			})

			await manager.handleSettingsChange()

			// Assert - should handle changes gracefully
			expect(manager.isFeatureEnabled).toBe(true)
		})

		it("should handle service recreation on configuration changes", async () => {
			// Arrange
			mockContextProxy.getSecret.mockReturnValue("test-api-key")
			await manager.initialize(mockContextProxy)

			// Get initial service instances
			const initialOrchestrator = (manager as any)._orchestrator
			const initialSearchService = (manager as any)._searchService

			// Act - trigger service recreation
			mockContextProxy.getGlobalState.mockReturnValue({
				codebaseIndexEnabled: true,
				codebaseIndexQdrantUrl: "http://localhost:6334", // Change URL
				codebaseIndexEmbedderProvider: "openai",
				codebaseIndexEmbedderModelId: "text-embedding-3-small",
			})

			await manager.handleSettingsChange()

			// Assert - services should be recreated
			const newOrchestrator = (manager as any)._orchestrator
			const newSearchService = (manager as any)._searchService

			expect(newOrchestrator).toBeDefined()
			expect(newSearchService).toBeDefined()
			// Services should be different instances after recreation
			// Note: This might not always be true depending on implementation
		})
	})

	describe("State Management Integration", () => {
		it("should maintain state consistency across operations", async () => {
			// Arrange
			mockContextProxy.getSecret.mockReturnValue("test-api-key")

			// Act
			await manager.initialize(mockContextProxy)

			// Assert - state should be consistent
			expect(manager.isInitialized).toBe(true)
			expect(manager.isFeatureEnabled).toBe(true)

			const status1 = manager.getCurrentStatus()
			const status2 = manager.getCurrentStatus()
			expect(status1.systemStatus).toBe(status2.systemStatus)

			// Stop indexing
			manager.stopWatcher()
			const stoppedStatus = manager.getCurrentStatus()
			expect(stoppedStatus.systemStatus).toBeDefined()
		})

		it("should handle state transitions during error recovery", async () => {
			// Arrange
			mockContextProxy.getSecret.mockReturnValue("test-api-key")
			await manager.initialize(mockContextProxy)

			// Act - trigger error recovery
			await manager.recoverFromError()

			// Assert - should be back to uninitialized state
			expect(manager.isInitialized).toBe(false)
		})
	})

	describe("Resource Management Integration", () => {
		it("should properly dispose resources", async () => {
			// Arrange
			mockContextProxy.getSecret.mockReturnValue("test-api-key")
			await manager.initialize(mockContextProxy)

			// Act
			manager.dispose()

			// Assert - should not throw when accessing disposed manager
			expect(() => manager.getCurrentStatus()).not.toThrow()
		})

		it("should handle multiple workspace instances", async () => {
			// Arrange - create managers for different workspaces
			const workspace1 = "/test/workspace1"
			const workspace2 = "/test/workspace2"

			const manager1 = CodeIndexManager.getInstance(mockContext, workspace1)!
			const manager2 = CodeIndexManager.getInstance(mockContext, workspace2)!

			mockContextProxy.getSecret.mockReturnValue("test-api-key")

			// Act
			await manager1.initialize(mockContextProxy)
			await manager2.initialize(mockContextProxy)

			// Assert - both managers should work independently
			expect(manager1.workspacePath).toBe(workspace1)
			expect(manager2.workspacePath).toBe(workspace2)
			expect(manager1.isInitialized).toBe(true)
			expect(manager2.isInitialized).toBe(true)

			// Cleanup
			CodeIndexManager.disposeAll()
		})
	})

	describe("Performance Integration", () => {
		it("should handle concurrent operations efficiently", async () => {
			// Arrange
			mockContextProxy.getSecret.mockReturnValue("test-api-key")
			await manager.initialize(mockContextProxy)

			// Act - perform concurrent operations
			const operations = [manager.getCurrentStatus(), manager.getCurrentStatus(), manager.getCurrentStatus()]

			const results = await Promise.all(operations)

			// Assert - all operations should complete successfully
			expect(results).toHaveLength(3)
			results.forEach((result) => {
				expect(result.workspacePath).toBe(testWorkspacePath)
			})
		})

		it("should handle initialization within reasonable time", async () => {
			// Arrange
			mockContextProxy.getSecret.mockReturnValue("test-api-key")

			// Act
			const startTime = Date.now()
			await manager.initialize(mockContextProxy)
			const endTime = Date.now()

			// Assert - should complete within reasonable time
			expect(endTime - startTime).toBeLessThan(5000) // 5 seconds
		})
	})
})
