import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { CodeIndexManager } from "../manager"
import { CodeIndexServiceFactory } from "../service-factory"
import type { MockedClass } from "vitest"
import * as path from "path"
import * as fs from "fs/promises"
import { performance } from "perf_hooks"

// Mock vscode module
vi.mock("vscode", () => {
	const testPath = require("path")
	const testWorkspacePath = testPath.join(testPath.sep, "test", "workspace")
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
		readFile: vi.fn(),
		writeFile: vi.fn(),
		unlink: vi.fn(),
		exists: vi.fn(),
		mkdir: vi.fn(),
		readdir: vi.fn(),
		stat: vi.fn(),
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
		reportFileQueueProgress: vi.fn(),
		reportBlockIndexingProgress: vi.fn(),
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

/**
 * Comprehensive Regression Test Suite for CodeIndexManager Initialization Fix
 *
 * This suite validates that the CodeIndexManager initialization fix works correctly
 * and prevents regression of the "CodeIndexManager not initialized" error.
 *
 * Coverage Areas:
 * - Smoke Tests: Quick validation of core functionality
 * - Critical Path Tests: End-to-end workflow validation
 * - Regression Guards: Prevent future breaks to initialization logic
 * - Automated Regression: Can be run in CI/CD pipelines
 * - Comprehensive Coverage: All major code paths tested
 */
describe("CodeIndexManager - Comprehensive Regression Test Suite", () => {
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
		vi.clearAllMocks()

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

	describe("Task 4.7: Smoke Tests - Quick Core Functionality Validation", () => {
		it("should initialize successfully with valid configuration", async () => {
			// Arrange - mock valid configuration
			mockContextProxy.getSecret.mockReturnValue("test-api-key")

			// Act
			const result = await manager.initialize(mockContextProxy)

			// Assert - basic smoke test
			expect(result).toBeDefined()
			expect(result.requiresRestart).toBeDefined()
			expect(manager.isInitialized).toBe(true)
			expect(manager.isFeatureEnabled).toBe(true)
			expect(manager.isFeatureConfigured).toBe(true)
		})

		it("should handle disabled feature gracefully", async () => {
			// Arrange - disable feature
			mockContextProxy.getGlobalState.mockReturnValue({
				codebaseIndexEnabled: false,
			})

			// Act
			const result = await manager.initialize(mockContextProxy)

			// Assert
			expect(result).toEqual({ requiresRestart: false })
			expect(manager.isFeatureEnabled).toBe(false)
		})

		it("should prevent search before initialization", async () => {
			// Arrange - enable feature but don't initialize
			;(manager as any)._configManager = { isFeatureEnabled: true }

			// Act & Assert
			await expect(manager.searchIndex("test")).rejects.toThrow(
				"CodeIndexManager not initialized. Call initialize() first.",
			)
		})

		it("should allow search after proper initialization", async () => {
			// Arrange
			mockContextProxy.getSecret.mockReturnValue("test-api-key")
			await manager.initialize(mockContextProxy)

			// Mock search service
			const mockResults = [
				{
					score: 0.9,
					payload: { filePath: "/test/file.ts", startLine: 1, endLine: 10, codeChunk: "test code" },
				},
			]
			const mockSearchService = {
				searchIndex: vi.fn().mockResolvedValue(mockResults),
			}
			;(manager as any)._searchService = mockSearchService

			// Act & Assert
			const results = await manager.searchIndex("test query")
			expect(results).toEqual(mockResults)
		})

		it("should maintain singleton pattern", () => {
			// Act
			const manager1 = CodeIndexManager.getInstance(mockContext)
			const manager2 = CodeIndexManager.getInstance(mockContext)

			// Assert
			expect(manager1).toBe(manager2)
			expect(manager1).toBe(manager)
		})
	})

	describe("Task 4.7: Critical Path Tests - End-to-End Workflow Validation", () => {
		it("should complete full initialization workflow", async () => {
			// Arrange - complete valid configuration
			mockContextProxy.getSecret.mockReturnValue("test-api-key")
			mockContextProxy.getGlobalState.mockReturnValue({
				codebaseIndexEnabled: true,
				codebaseIndexQdrantUrl: "http://localhost:6333",
				codebaseIndexEmbedderProvider: "openai",
				codebaseIndexEmbedderModelId: "text-embedding-3-small",
				codebaseIndexEmbedderModelDimension: 1536,
			})

			// Act - full initialization workflow
			const initResult = await manager.initialize(mockContextProxy)

			// Verify initialization
			expect(initResult.requiresRestart).toBe(true) // First time with valid config
			expect(manager.isInitialized).toBe(true)
			expect(manager.isFeatureEnabled).toBe(true)
			expect(manager.isFeatureConfigured).toBe(true)

			// Start indexing
			await manager.startIndexing()
			expect(manager.state).toBe("Indexed")

			// Perform search
			const mockResults = [
				{
					score: 0.9,
					payload: { filePath: "/test/file.ts", startLine: 1, endLine: 10, codeChunk: "test code" },
				},
			]
			const mockSearchService = {
				searchIndex: vi.fn().mockResolvedValue(mockResults),
			}
			;(manager as any)._searchService = mockSearchService

			const searchResults = await manager.searchIndex("test query")
			expect(searchResults).toEqual(mockResults)

			// Clear index data
			const mockClearIndexData = vi.fn().mockResolvedValue(undefined)
			const mockClearCacheFile = vi.fn().mockResolvedValue(undefined)
			;(manager as any)._orchestrator.clearIndexData = mockClearIndexData
			;(manager as any)._cacheManager.clearCacheFile = mockClearCacheFile

			await manager.clearIndexData()
			expect(mockClearIndexData).toHaveBeenCalled()
			expect(mockClearCacheFile).toHaveBeenCalled()
		})

		it("should handle configuration changes correctly", async () => {
			// Arrange - initial configuration
			mockContextProxy.getSecret.mockReturnValue("test-api-key")
			await manager.initialize(mockContextProxy)

			// Mock config manager to simulate configuration change
			const mockConfigManager = {
				loadConfiguration: vi.fn().mockResolvedValue({ requiresRestart: true }),
				isFeatureConfigured: true,
				isFeatureEnabled: true,
				getConfig: vi.fn().mockReturnValue({
					isConfigured: true,
					embedderProvider: "openai",
					modelId: "text-embedding-3-small",
					openAiOptions: { openAiNativeApiKey: "new-test-key" },
					qdrantUrl: "http://localhost:6334", // Different URL
					qdrantApiKey: "new-test-key",
					searchMinScore: 0.4,
				}),
			}
			;(manager as any)._configManager = mockConfigManager

			// Mock cache manager
			const mockCacheManager = {
				initialize: vi.fn().mockResolvedValue(undefined),
				clearCacheFile: vi.fn().mockResolvedValue(undefined),
			}
			;(manager as any)._cacheManager = mockCacheManager

			// Act - handle settings change
			await manager.handleSettingsChange()

			// Assert
			expect(mockConfigManager.loadConfiguration).toHaveBeenCalled()
			expect(mockServiceFactoryInstance.createServices).toHaveBeenCalled()
		})

		it("should recover from error state successfully", async () => {
			// Arrange - put manager in error state
			mockContextProxy.getSecret.mockReturnValue("test-api-key")
			await manager.initialize(mockContextProxy)

			// Mock error state
			;(manager as any)._stateManager.getCurrentStatus.mockReturnValue({
				systemStatus: "Error",
				message: "Test error",
				processedItems: 0,
				totalItems: 0,
				currentItemUnit: "items",
			})

			// Act - recover from error
			await manager.recoverFromError()

			// Assert
			expect(manager.isInitialized).toBe(false)
			expect((manager as any)._configManager).toBeUndefined()
			expect((manager as any)._serviceFactory).toBeUndefined()
			expect((manager as any)._orchestrator).toBeUndefined()
			expect((manager as any)._searchService).toBeUndefined()
		})

		it("should handle concurrent operations safely", async () => {
			// Arrange
			mockContextProxy.getSecret.mockReturnValue("test-api-key")
			await manager.initialize(mockContextProxy)

			// Mock search service
			const mockSearchService = {
				searchIndex: vi.fn().mockImplementation(async (query: string) => {
					await new Promise((resolve) => setTimeout(resolve, 10))
					return [
						{
							score: 0.9,
							payload: {
								filePath: `/test/${query}.ts`,
								startLine: 1,
								endLine: 10,
								codeChunk: "test code",
							},
						},
					]
				}),
			}
			;(manager as any)._searchService = mockSearchService

			// Act - concurrent searches
			const promises = Array.from({ length: 10 }, (_, i) => manager.searchIndex(`concurrent-test-${i}`))

			// Assert
			const results = await Promise.allSettled(promises)
			expect(results).toHaveLength(10)
			results.forEach((result) => {
				expect(result.status).toBe("fulfilled")
			})
		})
	})

	describe("Task 4.7: Regression Guards - Prevent Future Initialization Breaks", () => {
		it("should prevent 'CodeIndexManager not initialized' error in standard workflow", async () => {
			// This is the core regression test for the initialization fix
			// Arrange - complete proper initialization
			mockContextProxy.getSecret.mockReturnValue("test-api-key")
			await manager.initialize(mockContextProxy)

			// Mock search service
			const mockSearchService = {
				searchIndex: vi.fn().mockResolvedValue([]),
			}
			;(manager as any)._searchService = mockSearchService

			// Act & Assert - should NOT throw "CodeIndexManager not initialized"
			await expect(manager.searchIndex("test query")).resolves.not.toThrow(
				"CodeIndexManager not initialized. Call initialize() first.",
			)
		})

		it("should maintain initialization state across method calls", async () => {
			// Arrange
			mockContextProxy.getSecret.mockReturnValue("test-api-key")
			await manager.initialize(mockContextProxy)

			// Act - multiple method calls
			const status1 = manager.getCurrentStatus()
			const state1 = manager.state
			const isInitialized1 = manager.isInitialized
			const isFeatureEnabled1 = manager.isFeatureEnabled
			const isFeatureConfigured1 = manager.isFeatureConfigured

			const status2 = manager.getCurrentStatus()
			const state2 = manager.state
			const isInitialized2 = manager.isInitialized
			const isFeatureEnabled2 = manager.isFeatureEnabled
			const isFeatureConfigured2 = manager.isFeatureConfigured

			// Assert - state should be consistent
			expect(isInitialized1).toBe(true)
			expect(isInitialized2).toBe(true)
			expect(isFeatureEnabled1).toBe(isFeatureEnabled2)
			expect(isFeatureConfigured1).toBe(isFeatureConfigured2)
			expect(status1).toBeDefined()
			expect(status2).toBeDefined()
		})

		it("should handle rapid initialization and disposal cycles", async () => {
			// Arrange
			mockContextProxy.getSecret.mockReturnValue("test-api-key")

			// Act - rapid cycles
			for (let i = 0; i < 3; i++) {
				const manager = CodeIndexManager.getInstance(mockContext)!

				await manager.initialize(mockContextProxy)
				expect(manager.isInitialized).toBe(true)

				manager.dispose()
				CodeIndexManager.disposeAll()

				// Small delay to simulate rapid cycling
				await new Promise((resolve) => setTimeout(resolve, 10))
			}

			// Assert - should complete without errors
			expect(CodeIndexManager.instances.size).toBe(0)
		})

		it("should prevent access to methods before initialization when feature enabled", async () => {
			// Arrange - enable feature but don't initialize
			;(manager as any)._configManager = { isFeatureEnabled: true }

			// Act & Assert - all should throw
			await expect(manager.searchIndex("test")).rejects.toThrow(
				"CodeIndexManager not initialized. Call initialize() first.",
			)

			expect(() => manager.state).toThrow("CodeIndexManager not initialized. Call initialize() first.")

			await expect(manager.clearIndexData()).rejects.toThrow(
				"CodeIndexManager not initialized. Call initialize() first.",
			)
		})

		it("should handle partial initialization scenarios", async () => {
			// Arrange - create partially initialized manager
			;(manager as any)._configManager = { isFeatureEnabled: true }
			;(manager as any)._orchestrator = { stopWatcher: vi.fn() }
			// Leave _searchService and _cacheManager as undefined

			// Act & Assert - should throw due to missing services
			expect(() => manager.state).toThrow("CodeIndexManager not initialized. Call initialize() first.")
			await expect(manager.searchIndex("test")).rejects.toThrow(
				"CodeIndexManager not initialized. Call initialize() first.",
			)
			await expect(manager.clearIndexData()).rejects.toThrow(
				"CodeIndexManager not initialized. Call initialize() first.",
			)
		})
	})

	describe("Task 4.7: Automated Regression - CI/CD Pipeline Compatible", () => {
		it("should run complete regression test in under 5 seconds", async () => {
			// Performance regression test for CI/CD
			const startTime = performance.now()

			// Complete workflow
			mockContextProxy.getSecret.mockReturnValue("test-api-key")
			await manager.initialize(mockContextProxy)

			// Mock search service
			const mockSearchService = {
				searchIndex: vi.fn().mockResolvedValue([
					{
						score: 0.9,
						payload: { filePath: "/test/file.ts", startLine: 1, endLine: 10, codeChunk: "test code" },
					},
				]),
			}
			;(manager as any)._searchService = mockSearchService

			await manager.searchIndex("test query")
			await manager.recoverFromError()
			await manager.initialize(mockContextProxy)

			const endTime = performance.now()
			const duration = endTime - startTime

			// Assert - should complete quickly for CI/CD
			expect(duration).toBeLessThan(5000) // Under 5 seconds
		})

		it("should handle all initialization states correctly", async () => {
			// Test all possible initialization states

			// 1. Uninitialized state
			expect(manager.isInitialized).toBe(false)
			expect(manager.isFeatureEnabled).toBe(false) // No config manager yet

			// 2. Feature disabled state
			mockContextProxy.getGlobalState.mockReturnValue({
				codebaseIndexEnabled: false,
			})
			const result1 = await manager.initialize(mockContextProxy)
			expect(result1.requiresRestart).toBe(false)
			expect(manager.isFeatureEnabled).toBe(false)

			// 3. Feature enabled but not configured
			mockContextProxy.getGlobalState.mockReturnValue({
				codebaseIndexEnabled: true,
				codebaseIndexQdrantUrl: "http://localhost:6333",
				codebaseIndexEmbedderProvider: "openai",
				codebaseIndexEmbedderModelId: "text-embedding-3-small",
			})
			mockContextProxy.getSecret.mockReturnValue(undefined) // No API key

			const result2 = await manager.initialize(mockContextProxy)
			expect(result2.requiresRestart).toBe(false)
			expect(manager.isFeatureEnabled).toBe(true)
			expect(manager.isFeatureConfigured).toBe(false)

			// 4. Fully initialized state
			mockContextProxy.getSecret.mockReturnValue("test-api-key")
			const result3 = await manager.initialize(mockContextProxy)
			expect(result3.requiresRestart).toBe(true) // First time with valid config
			expect(manager.isInitialized).toBe(true)
			expect(manager.isFeatureEnabled).toBe(true)
			expect(manager.isFeatureConfigured).toBe(true)
		})

		it("should validate all public method contracts", async () => {
			// Arrange
			mockContextProxy.getSecret.mockReturnValue("test-api-key")
			await manager.initialize(mockContextProxy)

			// Mock all required services
			const mockSearchService = {
				searchIndex: vi.fn().mockResolvedValue([]),
			}
			const mockOrchestrator = {
				startIndexing: vi.fn().mockResolvedValue(undefined),
				stopWatcher: vi.fn(),
				state: "Indexed",
				clearIndexData: vi.fn().mockResolvedValue(undefined),
			}
			const mockCacheManager = {
				clearCacheFile: vi.fn().mockResolvedValue(undefined),
			}
			const mockStateManager = {
				getCurrentStatus: vi.fn().mockReturnValue({
					systemStatus: "Indexed",
					message: "",
					processedItems: 100,
					totalItems: 100,
					currentItemUnit: "files",
				}),
			}

			;(manager as any)._searchService = mockSearchService
			;(manager as any)._orchestrator = mockOrchestrator
			;(manager as any)._cacheManager = mockCacheManager
			;(manager as any)._stateManager = mockStateManager

			// Act & Assert - validate method contracts
			expect(manager.onProgressUpdate).toBeDefined()
			expect(typeof manager.getCurrentStatus).toBe("function")
			expect(typeof manager.searchIndex).toBe("function")
			expect(typeof manager.startIndexing).toBe("function")
			expect(typeof manager.stopWatcher).toBe("function")
			expect(typeof manager.clearIndexData).toBe("function")
			expect(typeof manager.recoverFromError).toBe("function")
			expect(typeof manager.dispose).toBe("function")
			expect(typeof manager.handleSettingsChange).toBe("function")

			// Test method calls
			expect(manager.getCurrentStatus()).toBeDefined()
			expect(manager.state).toBe("Indexed")
			await expect(manager.searchIndex("test")).resolves.toBeDefined()
			await expect(manager.startIndexing()).resolves.toBeUndefined()
			expect(() => manager.stopWatcher()).not.toThrow()
			await expect(manager.clearIndexData()).resolves.toBeUndefined()
			await expect(manager.recoverFromError()).resolves.toBeUndefined()
			expect(() => manager.dispose()).not.toThrow()
		})
	})

	describe("Task 4.7: Comprehensive Coverage - All Major Code Paths", () => {
		it("should cover all error scenarios in assertInitialized", async () => {
			// Test each missing service in assertInitialized

			// Missing configManager
			;(manager as any)._configManager = { isFeatureEnabled: true }
			;(manager as any)._orchestrator = null
			;(manager as any)._searchService = null
			;(manager as any)._cacheManager = null

			await expect(manager.searchIndex("test")).rejects.toThrow(
				"CodeIndexManager not initialized. Call initialize() first.",
			)

			// Missing orchestrator
			;(manager as any)._configManager = { isFeatureEnabled: true }
			;(manager as any)._orchestrator = { stopWatcher: vi.fn() }
			;(manager as any)._searchService = null
			;(manager as any)._cacheManager = null

			await expect(manager.searchIndex("test")).rejects.toThrow(
				"CodeIndexManager not initialized. Call initialize() first.",
			)

			// Missing searchService
			;(manager as any)._configManager = { isFeatureEnabled: true }
			;(manager as any)._orchestrator = { stopWatcher: vi.fn() }
			;(manager as any)._searchService = null
			;(manager as any)._cacheManager = { initialize: vi.fn() }

			await expect(manager.searchIndex("test")).rejects.toThrow(
				"CodeIndexManager not initialized. Call initialize() first.",
			)

			// Missing cacheManager
			;(manager as any)._configManager = { isFeatureEnabled: true }
			;(manager as any)._orchestrator = { stopWatcher: vi.fn() }
			;(manager as any)._searchService = { searchIndex: vi.fn() }
			;(manager as any)._cacheManager = null

			await expect(manager.searchIndex("test")).rejects.toThrow(
				"CodeIndexManager not initialized. Call initialize() first.",
			)
		})

		it("should cover all initialization paths", async () => {
			// Test different initialization scenarios

			// 1. First time initialization
			mockContextProxy.getSecret.mockReturnValue("test-api-key")
			const result1 = await manager.initialize(mockContextProxy)
			expect(result1.requiresRestart).toBe(true)

			// 2. Re-initialization without changes
			const result2 = await manager.initialize(mockContextProxy)
			expect(result2.requiresRestart).toBe(false)

			// 3. Re-initialization with changes
			mockContextProxy.getGlobalState.mockReturnValue({
				codebaseIndexEnabled: true,
				codebaseIndexQdrantUrl: "http://localhost:6334", // Changed
				codebaseIndexEmbedderProvider: "openai",
				codebaseIndexEmbedderModelId: "text-embedding-3-small",
			})

			const result3 = await manager.initialize(mockContextProxy)
			expect(result3.requiresRestart).toBe(true)
		})

		it("should cover all singleton behavior", () => {
			// Test singleton pattern thoroughly

			// Same workspace should return same instance
			const manager1 = CodeIndexManager.getInstance(mockContext)
			const manager2 = CodeIndexManager.getInstance(mockContext)
			expect(manager1).toBe(manager2)

			// Different workspace should return different instance
			const differentContext = { ...mockContext, workspacePath: "/different/workspace" }
			const manager3 = CodeIndexManager.getInstance(differentContext)
			expect(manager3).not.toBe(manager1)

			// Dispose all should clear instances
			CodeIndexManager.disposeAll()
			expect(CodeIndexManager.instances.size).toBe(0)

			// Should be able to create new instance after disposal
			const manager4 = CodeIndexManager.getInstance(mockContext)
			expect(manager4).toBeDefined()
			expect(manager4).not.toBe(manager1)
		})

		it("should cover all state management scenarios", async () => {
			// Arrange
			mockContextProxy.getSecret.mockReturnValue("test-api-key")
			await manager.initialize(mockContextProxy)

			// Test state getter behavior
			expect(manager.state).toBe("Standby") // Default state

			// Mock orchestrator with different states
			;(manager as any)._orchestrator.state = "Indexing"
			expect(manager.state).toBe("Indexing")
			;(manager as any)._orchestrator.state = "Indexed"
			expect(manager.state).toBe("Indexed")
			;(manager as any)._orchestrator.state = "Error"
			expect(manager.state).toBe("Error")

			// Test feature disabled state
			;(manager as any)._configManager.isFeatureEnabled = false
			expect(manager.state).toBe("Standby")
		})

		it("should cover all error recovery paths", async () => {
			// Arrange
			mockContextProxy.getSecret.mockReturnValue("test-api-key")
			await manager.initialize(mockContextProxy)

			// Test recovery from different error scenarios

			// 1. Recovery when not in error state (should be safe)
			await expect(manager.recoverFromError()).resolves.toBeUndefined()
			expect(manager.isInitialized).toBe(false)

			// 2. Recovery after re-initialization
			await manager.initialize(mockContextProxy)
			expect(manager.isInitialized).toBe(true)

			// 3. Recovery during error state
			;(manager as any)._stateManager.getCurrentStatus.mockReturnValue({
				systemStatus: "Error",
				message: "Test error",
			})

			await manager.recoverFromError()
			expect(manager.isInitialized).toBe(false)
		})
	})

	describe("Task 4.7: Integration Point Validation", () => {
		it("should integrate properly with codebaseSearchTool pattern", async () => {
			// This test validates the exact pattern used by codebaseSearchTool.ts

			// Arrange - complete initialization
			mockContextProxy.getSecret.mockReturnValue("test-api-key")
			await manager.initialize(mockContextProxy)

			// Mock search service
			const mockResults = [
				{
					score: 0.9,
					payload: { filePath: "/test/file.ts", startLine: 1, endLine: 10, codeChunk: "test code" },
				},
			]
			const mockSearchService = {
				searchIndex: vi.fn().mockResolvedValue(mockResults),
			}
			;(manager as any)._searchService = mockSearchService

			// Act - simulate exact codebaseSearchTool pattern
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

			const searchResults = await codeIndexManager.searchIndex("test query", "/test/dir")

			// Assert
			expect(searchResults).toEqual(mockResults)
		})

		it("should handle workspace path resolution correctly", () => {
			// Test different workspace path scenarios

			// 1. With active editor
			const mockContextWithEditor = {
				...mockContext,
				workspace: {
					workspaceFolders: [{ uri: { fsPath: "/test/workspace1" }, name: "test1", index: 0 }],
				},
				window: {
					activeTextEditor: {
						document: {
							uri: { fsPath: "/test/workspace1/file.ts" },
						},
					},
				},
			}

			const manager1 = CodeIndexManager.getInstance(mockContextWithEditor)
			expect(manager1).toBeDefined()

			// 2. With workspace folders but no active editor
			const mockContextWithFolders = {
				...mockContext,
				workspace: {
					workspaceFolders: [{ uri: { fsPath: "/test/workspace2" }, name: "test2", index: 0 }],
				},
				window: {
					activeTextEditor: null,
				},
			}

			const manager2 = CodeIndexManager.getInstance(mockContextWithFolders)
			expect(manager2).toBeDefined()

			// 3. No workspace folders
			const mockContextNoWorkspace = {
				...mockContext,
				workspace: {
					workspaceFolders: [],
				},
				window: {
					activeTextEditor: null,
				},
			}

			const manager3 = CodeIndexManager.getInstance(mockContextNoWorkspace)
			expect(manager3).toBeUndefined()
		})

		it("should handle configuration manager integration", async () => {
			// Test integration with configuration manager

			// Arrange
			const mockConfigManager = {
				loadConfiguration: vi.fn().mockResolvedValue({ requiresRestart: false }),
				isFeatureConfigured: true,
				isFeatureEnabled: true,
				getConfig: vi.fn().mockReturnValue({
					isConfigured: true,
					embedderProvider: "openai",
					modelId: "text-embedding-3-small",
					openAiOptions: { openAiNativeApiKey: "test-key" },
					qdrantUrl: "http://localhost:6333",
					qdrantApiKey: "test-key",
					searchMinScore: 0.4,
				}),
			}
			;(manager as any)._configManager = mockConfigManager

			// Act
			await manager.handleSettingsChange()

			// Assert
			expect(mockConfigManager.loadConfiguration).toHaveBeenCalled()
		})
	})

	describe("Task 4.7: Performance and Memory Validation", () => {
		it("should maintain performance within acceptable limits", async () => {
			// Performance regression test

			// Arrange
			mockContextProxy.getSecret.mockReturnValue("test-api-key")

			// Act - measure initialization time
			const startTime = performance.now()
			await manager.initialize(mockContextProxy)
			const endTime = performance.now()
			const initTime = endTime - startTime

			// Assert
			expect(initTime).toBeLessThan(1000) // Under 1 second

			// Measure search performance
			const mockSearchService = {
				searchIndex: vi.fn().mockImplementation(async () => {
					await new Promise((resolve) => setTimeout(resolve, 10))
					return []
				}),
			}
			;(manager as any)._searchService = mockSearchService

			const searchStartTime = performance.now()
			await manager.searchIndex("test query")
			const searchEndTime = performance.now()
			const searchTime = searchEndTime - searchStartTime

			expect(searchTime).toBeLessThan(100) // Under 100ms
		})

		it("should not cause memory leaks during repeated operations", async () => {
			// Memory leak detection test

			// Arrange
			mockContextProxy.getSecret.mockReturnValue("test-api-key")
			await manager.initialize(mockContextProxy)

			const mockSearchService = {
				searchIndex: vi.fn().mockResolvedValue([]),
			}
			;(manager as any)._searchService = mockSearchService

			const initialMemory = process.memoryUsage()

			// Act - perform many operations
			for (let i = 0; i < 100; i++) {
				await manager.searchIndex(`test query ${i}`)

				// Force garbage collection if available
				if (i % 20 === 0 && global.gc) {
					global.gc()
				}
			}

			// Force final garbage collection
			if (global.gc) {
				global.gc()
			}

			const finalMemory = process.memoryUsage()
			const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed

			// Assert - memory increase should be minimal
			expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024) // Less than 50MB
		})
	})
})
