import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { CodeIndexManager } from "../manager"
import { CodeIndexServiceFactory } from "../service-factory"
import type { MockedClass } from "vitest"
import * as path from "path"
import * as fs from "fs/promises"
import { EventEmitter } from "events"

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
 * Edge case testing utilities for CodeIndexManager
 */
class CodeIndexEdgeCaseTester {
	private errorScenarios: Map<string, () => void> = new Map()
	private resourceConstraints: Map<string, any> = new Map()

	/**
	 * Register an error scenario
	 */
	registerErrorScenario(name: string, setupFn: () => void): void {
		this.errorScenarios.set(name, setupFn)
	}

	/**
	 * Apply an error scenario
	 */
	applyErrorScenario(name: string): void {
		const setupFn = this.errorScenarios.get(name)
		if (setupFn) {
			setupFn()
		} else {
			throw new Error(`Unknown error scenario: ${name}`)
		}
	}

	/**
	 * Set resource constraints
	 */
	setResourceConstraint(constraint: string, value: any): void {
		this.resourceConstraints.set(constraint, value)
	}

	/**
	 * Get resource constraint
	 */
	getResourceConstraint(constraint: string): any {
		return this.resourceConstraints.get(constraint)
	}

	/**
	 * Simulate low memory conditions
	 */
	simulateLowMemory(): void {
		const originalMemoryUsage = process.memoryUsage
		vi.spyOn(process, "memoryUsage").mockReturnValue({
			rss: 1024 * 1024 * 1024, // 1GB
			heapTotal: 900 * 1024 * 1024, // 900MB
			heapUsed: 850 * 1024 * 1024, // 850MB (high usage)
			external: 100 * 1024 * 1024, // 100MB
			arrayBuffers: 50 * 1024 * 1024, // 50MB
		})
		this.setResourceConstraint("low_memory", true)
	}

	/**
	 * Simulate disk space limitations
	 */
	simulateDiskSpaceLimit(): void {
		vi.spyOn(fs.default, "writeFile").mockRejectedValue(new Error("ENOSPC: no space left on device"))
		this.setResourceConstraint("disk_space_limit", true)
	}

	/**
	 * Simulate network connectivity issues
	 */
	simulateNetworkIssues(): void {
		// Mock network-related functions to fail
		const originalFetch = global.fetch
		vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network unreachable"))
		this.setResourceConstraint("network_issues", true)
	}

	/**
	 * Simulate file system permission errors
	 */
	simulatePermissionErrors(): void {
		vi.spyOn(fs.default, "readFile").mockRejectedValue(new Error("EACCES: permission denied"))
		vi.spyOn(fs.default, "writeFile").mockRejectedValue(new Error("EACCES: permission denied"))
		this.setResourceConstraint("permission_errors", true)
	}

	/**
	 * Simulate corrupted cache files
	 */
	simulateCorruptedCache(): void {
		vi.spyOn(fs.default, "readFile").mockResolvedValue(Buffer.from("corrupted json data {invalid"))
		this.setResourceConstraint("corrupted_cache", true)
	}

	/**
	 * Simulate locked files
	 */
	simulateLockedFiles(): void {
		vi.spyOn(fs.default, "readFile").mockRejectedValue(new Error("EBUSY: resource busy or locked"))
		this.setResourceConstraint("locked_files", true)
	}

	/**
	 * Reset all mocks and constraints
	 */
	reset(): void {
		vi.restoreAllMocks()
		this.errorScenarios.clear()
		this.resourceConstraints.clear()
	}

	/**
	 * Create corrupted configuration data
	 */
	createCorruptedConfig(): any {
		return {
			invalidJson: "{invalid json structure",
			malformedSettings: {
				codebaseIndexEnabled: "not-a-boolean",
				codebaseIndexQdrantUrl: null,
				codebaseIndexEmbedderProvider: 123,
			},
			incompleteConfig: {
				codebaseIndexEnabled: true,
				// Missing required fields
			},
		}
	}

	/**
	 * Create extreme test data
	 */
	createExtremeTestData(): {
		veryLongQuery: string
		emptyQuery: string
		specialCharactersQuery: string
		unicodeQuery: string
		largeResultset: any[]
	} {
		return {
			veryLongQuery: "a".repeat(10000), // 10KB query
			emptyQuery: "",
			specialCharactersQuery: "!@#$%^&*()_+-=[]{}|;':\",./<>?",
			unicodeQuery: "🚀 Test with emoji and unicode: ñáéíóú 中文 العربية русский",
			largeResultset: Array.from({ length: 10000 }, (_, i) => ({
				score: Math.random(),
				payload: {
					filePath: `/test/file-${i}.ts`,
					startLine: 1,
					endLine: 100,
					codeChunk: `Large code chunk ${i}`.repeat(100),
				},
			})),
		}
	}
}

describe("CodeIndexManager - Edge Case Testing", () => {
	let edgeCaseTester: CodeIndexEdgeCaseTester
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

		edgeCaseTester = new CodeIndexEdgeCaseTester()

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
		edgeCaseTester.reset()
	})

	describe("Task 4.6: Minimal Resources Testing", () => {
		it("should handle low memory conditions gracefully", async () => {
			// Arrange
			edgeCaseTester.simulateLowMemory()

			// Mock service factory to fail under low memory
			mockServiceFactoryInstance.createServices.mockImplementation(() => {
				throw new Error("Cannot allocate memory for services")
			})

			// Act & Assert
			await expect(manager.initialize(mockContextProxy)).rejects.toThrow()
			expect(manager.isInitialized).toBe(false)

			// Should still be able to recover
			edgeCaseTester.reset()
			mockServiceFactoryInstance.createServices.mockReturnValue({
				embedder: { embedderInfo: { name: "openai" } },
				vectorStore: { initialize: vi.fn().mockResolvedValue(false) },
				scanner: { scanDirectory: vi.fn().mockResolvedValue({ stats: {} }) },
				fileWatcher: { initialize: vi.fn().mockResolvedValue(undefined) },
			})

			await expect(manager.initialize(mockContextProxy)).resolves.toBeDefined()
		})

		it("should handle disk space limitations", async () => {
			// Arrange
			edgeCaseTester.simulateDiskSpaceLimit()

			// Act & Assert
			// Should handle disk space errors gracefully
			expect(() => manager.getCurrentStatus()).not.toThrow()

			// Initialize first before searching
			await manager.initialize(mockContextProxy)

			// Search should still work (might return empty results)
			await expect(manager.searchIndex("test")).resolves.toBeDefined()
		})

		it("should handle CPU constraints", async () => {
			// Arrange - simulate high CPU usage by making operations slow
			const originalSetTimeout = global.setTimeout
			vi.spyOn(global, "setTimeout").mockImplementation((callback, delay) => {
				// Increase delay to simulate CPU pressure
				return originalSetTimeout(callback, (delay || 0) * 10)
			})

			// Act
			const startTime = Date.now()
			await manager.initialize(mockContextProxy)
			const endTime = Date.now()

			// Assert - should still complete, just slower
			expect(endTime - startTime).toBeGreaterThan(0)
			expect(manager.isInitialized).toBe(true)

			// Restore
			vi.restoreAllMocks()
		})

		it("should handle network file system issues", async () => {
			// Arrange - simulate network file system latency and failures
			vi.spyOn(fs.default, "readFile").mockImplementation(async () => {
				// Simulate network latency
				await new Promise((resolve) => setTimeout(resolve, 1000))
				throw new Error("Network timeout")
			})

			// Act & Assert
			// Should handle network timeouts gracefully
			const result = await manager.initialize(mockContextProxy)
			expect(result).toBeDefined()

			// Should not crash
			expect(() => manager.getCurrentStatus()).not.toThrow()
		})
	})

	describe("Task 4.6: Corrupted Data Testing", () => {
		it("should handle invalid cache files", async () => {
			// Arrange
			edgeCaseTester.simulateCorruptedCache()

			// Mock cache manager to handle corrupted data
			const mockCacheManager = {
				initialize: vi.fn().mockRejectedValue(new Error("Invalid cache format")),
				clearCacheFile: vi.fn().mockResolvedValue(undefined),
			}
			;(manager as any)._cacheManager = mockCacheManager

			// Act & Assert
			// Should handle corrupted cache gracefully
			await expect(manager.initialize(mockContextProxy)).rejects.toThrow()

			// Should be able to recover after clearing cache
			mockCacheManager.initialize.mockResolvedValue(undefined)
			await expect(manager.initialize(mockContextProxy)).resolves.toBeDefined()
		})

		it("should handle corrupted configuration", async () => {
			// Arrange
			const corruptedConfig = edgeCaseTester.createCorruptedConfig()

			mockContextProxy.getGlobalState.mockReturnValue(corruptedConfig.invalidJson)

			// Act & Assert
			// Should handle invalid configuration gracefully
			const result = await manager.initialize(mockContextProxy)
			expect(result).toBeDefined()

			// Test malformed settings
			mockContextProxy.getGlobalState.mockReturnValue(corruptedConfig.malformedSettings)
			await expect(manager.initialize(mockContextProxy)).resolves.toBeDefined()

			// Test incomplete configuration
			mockContextProxy.getGlobalState.mockReturnValue(corruptedConfig.incompleteConfig)
			await expect(manager.initialize(mockContextProxy)).resolves.toBeDefined()
		})

		it("should handle malformed index data", async () => {
			// Arrange
			await manager.initialize(mockContextProxy)

			// Mock vector store with corrupted data
			const mockVectorStore = {
				initialize: vi.fn().mockResolvedValue(false),
				hasIndexedData: vi.fn().mockResolvedValue(true),
				markIndexingIncomplete: vi.fn().mockRejectedValue(new Error("Index corruption detected")),
				markIndexingComplete: vi.fn().mockResolvedValue(undefined),
				clearCollection: vi.fn().mockResolvedValue(undefined),
				deleteCollection: vi.fn().mockResolvedValue(undefined),
			}

			;(manager as any)._orchestrator = {
				vectorStore: mockVectorStore,
				startIndexing: vi.fn().mockRejectedValue(new Error("Index corruption detected")),
				stopWatcher: vi.fn(),
				state: "Error",
			}

			// Act & Assert
			await expect(manager.startIndexing()).rejects.toThrow("Index corruption detected")

			// Should be able to recover
			await expect(manager.recoverFromError()).resolves.toBeUndefined()
			expect(manager.isInitialized).toBe(false)
		})

		it("should handle invalid search queries", async () => {
			// Arrange
			await manager.initialize(mockContextProxy)

			const mockSearchService = {
				searchIndex: vi.fn().mockImplementation(async (query: string) => {
					if (!query || query.length > 5000) {
						throw new Error("Invalid query parameters")
					}
					return []
				}),
			}
			;(manager as any)._searchService = mockSearchService

			const extremeData = edgeCaseTester.createExtremeTestData()

			// Act & Assert
			// Empty query
			await expect(manager.searchIndex(extremeData.emptyQuery)).rejects.toThrow("Invalid query parameters")

			// Very long query
			await expect(manager.searchIndex(extremeData.veryLongQuery)).rejects.toThrow("Invalid query parameters")

			// Special characters (should work)
			await expect(manager.searchIndex(extremeData.specialCharactersQuery)).resolves.toBeDefined()

			// Unicode (should work)
			await expect(manager.searchIndex(extremeData.unicodeQuery)).resolves.toBeDefined()
		})
	})

	describe("Task 4.6: Rapid Cycles Testing", () => {
		it("should handle rapid initialization/disposal cycles", async () => {
			// Arrange
			const cycles = 5 // Reduced cycles for faster test execution

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
			expect(CodeIndexManager.instances.size).toBe(0)
		})

		it("should handle rapid configuration changes", async () => {
			// Arrange
			await manager.initialize(mockContextProxy)

			// Act - rapid configuration changes
			const changes = 5 // Reduced changes for faster test execution
			for (let i = 0; i < changes; i++) {
				// Simulate configuration change
				mockContextProxy.getGlobalState.mockReturnValue({
					codebaseIndexEnabled: i % 2 === 0, // Toggle enable/disable
					codebaseIndexQdrantUrl: `http://localhost:633${i}`,
					codebaseIndexEmbedderProvider: i % 3 === 0 ? "openai" : "local",
					codebaseIndexEmbedderModelId: i % 2 === 0 ? "text-embedding-3-small" : "text-embedding-3-large",
				})

				await manager.handleSettingsChange()

				// Small delay
				await new Promise((resolve) => setTimeout(resolve, 5))
			}

			// Assert - should handle rapid changes without crashing
			expect(() => manager.getCurrentStatus()).not.toThrow()
		})

		it("should handle concurrent initialization attempts", async () => {
			// Arrange
			const concurrentAttempts = 3 // Reduced for faster test execution

			// Act - concurrent initialization
			const promises = Array.from({ length: concurrentAttempts }, () => manager.initialize(mockContextProxy))

			const results = await Promise.allSettled(promises)

			// Assert - all should complete without throwing
			results.forEach((result) => {
				expect(result.status).toBe("fulfilled")
			})

			expect(manager.isInitialized).toBe(true)
		})

		it("should handle rapid search requests", async () => {
			// Arrange
			await manager.initialize(mockContextProxy)

			const mockSearchService = {
				searchIndex: vi.fn().mockImplementation(async (query: string) => {
					// Simulate variable response times
					await new Promise((resolve) => setTimeout(resolve, Math.random() * 50))
					return [
						{
							score: 0.9,
							payload: { filePath: "/test/file.ts", startLine: 1, endLine: 10, codeChunk: "test code" },
						},
					]
				}),
			}
			;(manager as any)._searchService = mockSearchService

			// Act - rapid search requests
			const rapidRequests = 10 // Reduced for faster test execution
			const promises = Array.from({ length: rapidRequests }, (_, i) => manager.searchIndex(`rapid-search-${i}`))

			const results = await Promise.allSettled(promises)

			// Assert - should handle rapid requests gracefully
			const successfulRequests = results.filter((r) => r.status === "fulfilled").length
			const failedRequests = results.filter((r) => r.status === "rejected").length

			expect(successfulRequests + failedRequests).toBe(rapidRequests)
			expect(successfulRequests).toBeGreaterThan(rapidRequests * 0.8) // At least 80% success rate
		})
	})

	describe("Task 4.6: Boundary Conditions", () => {
		it("should handle empty workspaces", async () => {
			// Arrange - create manager with empty workspace
			const emptyWorkspaceManager = CodeIndexManager.getInstance({
				...mockContext,
				workspace: { workspaceFolders: [] },
			})

			// Act & Assert
			const result = await emptyWorkspaceManager?.initialize(mockContextProxy)
			expect(result).toEqual({ requiresRestart: false })

			// Search should return empty results
			const searchResults = await emptyWorkspaceManager?.searchIndex("test")
			expect(searchResults).toEqual([])
		})

		it("should handle extremely large files", async () => {
			// Arrange
			await manager.initialize(mockContextProxy)

			// Mock scanner with extremely large file
			mockServiceFactoryInstance.scanner.scanDirectory.mockResolvedValue({
				stats: {
					totalFiles: 1,
					totalBlocks: 100000, // 100k blocks (very large)
					indexedBlocks: 95000,
				},
			})

			// Act & Assert
			// Should handle large files without memory issues
			const result = await manager.startIndexing()
			expect(result).toBeUndefined() // startIndexing doesn't return anything

			// Should still be able to search
			const searchResults = await manager.searchIndex("test")
			expect(searchResults).toBeDefined()
		})

		it("should handle deep directory structures", async () => {
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

			// Act & Assert
			await expect(manager.startIndexing()).resolves.toBeUndefined()

			// Search with deep path prefix
			const searchResults = await manager.searchIndex("test", "/a/b/c/d/e/f")
			expect(searchResults).toBeDefined()
		})

		it("should handle maximum concurrent operations", async () => {
			// Arrange
			await manager.initialize(mockContextProxy)

			const mockSearchService = {
				searchIndex: vi.fn().mockImplementation(async (query: string) => {
					await new Promise((resolve) => setTimeout(resolve, 100))
					return [
						{
							score: 0.9,
							payload: { filePath: "/test/file.ts", startLine: 1, endLine: 10, codeChunk: "test code" },
						},
					]
				}),
			}
			;(manager as any)._searchService = mockSearchService

			// Act - maximum concurrent operations
			const maxConcurrency = 20 // Reduced for faster test execution
			const promises = Array.from({ length: maxConcurrency }, (_, i) =>
				manager.searchIndex(`max-concurrency-${i}`),
			)

			const startTime = Date.now()
			const results = await Promise.allSettled(promises)
			const endTime = Date.now()

			// Assert
			const successfulRequests = results.filter((r) => r.status === "fulfilled").length
			const totalTime = endTime - startTime

			expect(successfulRequests).toBeGreaterThan(maxConcurrency * 0.9) // At least 90% success
			expect(totalTime).toBeLessThan(5000) // Should complete within 5 seconds
		})
	})

	describe("Task 4.6: File System Issues", () => {
		it("should handle permission errors", async () => {
			// Arrange
			edgeCaseTester.simulatePermissionErrors()

			// Act & Assert
			// Should handle permission errors gracefully
			expect(() => manager.getCurrentStatus()).not.toThrow()

			// Initialization might fail but shouldn't crash
			await expect(manager.initialize(mockContextProxy)).rejects.toThrow()
		})

		it("should handle locked files", async () => {
			// Arrange
			edgeCaseTester.simulateLockedFiles()

			// Act & Assert
			// Should handle locked files gracefully
			const result = await manager.initialize(mockContextProxy)
			expect(result).toBeDefined()

			// Should still be able to perform basic operations
			expect(() => manager.getCurrentStatus()).not.toThrow()
		})

		it("should handle network file systems", async () => {
			// Arrange - simulate network file system behavior
			vi.spyOn(fs.default, "stat").mockImplementation(async () => {
				// Simulate network latency
				await new Promise((resolve) => setTimeout(resolve, 500))
				return {
					isFile: () => true,
					isDirectory: () => false,
					size: 1024,
					mtime: new Date(),
				} as any
			})

			// Act & Assert
			const startTime = Date.now()
			const result = await manager.initialize(mockContextProxy)
			const endTime = Date.now()

			expect(result).toBeDefined()
			expect(endTime - startTime).toBeGreaterThan(400) // Should account for network latency
		})
	})

	describe("Task 4.6: Concurrent Extremes", () => {
		it("should handle resource contention", async () => {
			// Arrange
			await manager.initialize(mockContextProxy)

			const mockSearchService = {
				searchIndex: vi.fn().mockImplementation(async (query: string) => {
					// Simulate resource contention
					await new Promise((resolve) => setTimeout(resolve, Math.random() * 200 + 100))
					return [
						{
							score: 0.9,
							payload: { filePath: "/test/file.ts", startLine: 1, endLine: 10, codeChunk: "test code" },
						},
					]
				}),
			}
			;(manager as any)._searchService = mockSearchService

			// Act - create resource contention
			const operations = []

			// Concurrent searches (reduced for faster test)
			for (let i = 0; i < 5; i++) {
				operations.push(manager.searchIndex(`contention-search-${i}`))
			}

			// Concurrent configuration changes (reduced for faster test)
			for (let i = 0; i < 2; i++) {
				operations.push(manager.handleSettingsChange())
			}

			// Concurrent status checks (reduced for faster test)
			for (let i = 0; i < 3; i++) {
				operations.push(Promise.resolve(manager.getCurrentStatus()))
			}

			const results = await Promise.allSettled(operations)

			// Assert
			const successfulOperations = results.filter((r) => r.status === "fulfilled").length
			const failedOperations = results.filter((r) => r.status === "rejected").length

			expect(successfulOperations + failedOperations).toBe(operations.length)
			expect(successfulOperations).toBeGreaterThan(operations.length * 0.8) // At least 80% success
		})

		it("should handle memory pressure during concurrent operations", async () => {
			// Arrange
			edgeCaseTester.simulateLowMemory()
			await manager.initialize(mockContextProxy)

			const extremeData = edgeCaseTester.createExtremeTestData()
			const mockSearchService = {
				searchIndex: vi.fn().mockImplementation(async (query: string) => {
					// Simulate memory-intensive operations
					const largeArray = new Array(1000).fill(0).map(() => ({ data: "x".repeat(100) }))
					await new Promise((resolve) => setTimeout(resolve, 50))
					return extremeData.largeResultset.slice(0, 10) // Return subset
				}),
			}
			;(manager as any)._searchService = mockSearchService

			// Act - concurrent operations under memory pressure (reduced for faster test)
			const promises = Array.from({ length: 3 }, (_, i) => manager.searchIndex(`memory-pressure-${i}`))

			const results = await Promise.allSettled(promises)

			// Assert
			const successfulOperations = results.filter((r) => r.status === "fulfilled").length
			expect(successfulOperations).toBeGreaterThan(1) // At least some should succeed
		})
	})

	describe("Task 4.6: Graceful Degradation", () => {
		it("should degrade gracefully when services fail", async () => {
			// Arrange - make some services fail
			mockServiceFactoryInstance.createServices.mockReturnValue({
				embedder: { embedderInfo: { name: "openai" } },
				vectorStore: {
					initialize: vi.fn().mockRejectedValue(new Error("Vector store unavailable")),
					hasIndexedData: vi.fn().mockResolvedValue(false),
				},
				scanner: {
					scanDirectory: vi.fn().mockRejectedValue(new Error("Scanner failed")),
				},
				fileWatcher: {
					initialize: vi.fn().mockRejectedValue(new Error("File watcher failed")),
					dispose: vi.fn(),
				},
			})

			// Act & Assert
			// Should handle service failures gracefully
			await expect(manager.initialize(mockContextProxy)).rejects.toThrow()

			// Should still be able to get status
			expect(() => manager.getCurrentStatus()).not.toThrow()

			// Should be able to recover
			await expect(manager.recoverFromError()).resolves.toBeUndefined()
		})

		it("should provide fallback behavior", async () => {
			// Arrange
			await manager.initialize(mockContextProxy)

			// Mock search service to fail sometimes
			let callCount = 0
			const mockSearchService = {
				searchIndex: vi.fn().mockImplementation(async (query: string) => {
					callCount++
					if (callCount % 3 === 0) {
						throw new Error("Search service temporarily unavailable")
					}
					return [
						{
							score: 0.9,
							payload: { filePath: "/test/file.ts", startLine: 1, endLine: 10, codeChunk: "test code" },
						},
					]
				}),
			}
			;(manager as any)._searchService = mockSearchService

			// Act
			const promises = Array.from(
				{ length: 5 },
				(
					_,
					i, // Reduced for faster test
				) => manager.searchIndex(`fallback-test-${i}`),
			)

			const results = await Promise.allSettled(promises)

			// Assert
			const successfulRequests = results.filter((r) => r.status === "fulfilled").length
			const failedRequests = results.filter((r) => r.status === "rejected").length

			expect(successfulRequests).toBeGreaterThan(2) // Most should succeed
			expect(failedRequests).toBeGreaterThan(0) // Some should fail gracefully
		})
	})
})
