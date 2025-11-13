import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { CodeIndexManager } from "../../services/code-index/manager"
import { CodeIndexConfigManager } from "../../services/code-index/config-manager"
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
		readFile: vi.fn(),
		mkdir: vi.fn(),
		writeFile: vi.fn(),
		stat: vi.fn(),
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

describe("CodeIndexManager Error Handling and Recovery Integration Tests", () => {
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
			}) as any,
		} as any

		manager = CodeIndexManager.getInstance(mockContext, testWorkspacePath)!
	})

	afterEach(() => {
		CodeIndexManager.disposeAll()
		vi.restoreAllMocks()
	})

	describe("Initialization Failures and Recovery", () => {
		it("should handle configuration loading failures", async () => {
			// Arrange - mock config manager to fail
			;(mockContextProxy.getGlobalState as any).mockImplementation(() => {
				throw new Error("Configuration loading failed")
			})

			// Act & Assert
			await expect(manager.initialize(mockContextProxy)).rejects.toThrow("Configuration loading failed")
			expect(manager.isInitialized).toBe(false)
		})

		it("should handle service factory creation failures", async () => {
			// Arrange
			;(mockContextProxy.getSecret as any).mockReturnValue("test-api-key")

			// Mock service factory to throw
			const { CodeIndexServiceFactory } = await import("../../services/code-index/service-factory")
			const MockedServiceFactory = CodeIndexServiceFactory as any

			MockedServiceFactory.mockImplementation(() => {
				throw new Error("Service factory creation failed")
			})

			// Act & Assert
			await expect(manager.initialize(mockContextProxy)).rejects.toThrow("Service factory creation failed")
			expect(manager.isInitialized).toBe(false)
		})

		it("should handle embedder validation failures", async () => {
			// Arrange
			;(mockContextProxy.getSecret as any).mockReturnValue("invalid-api-key")

			// Mock service factory to return invalid embedder
			const { CodeIndexServiceFactory } = await import("../../services/code-index/service-factory")
			const MockedServiceFactory = CodeIndexServiceFactory as any

			MockedServiceFactory.mockImplementation(() => ({
				createServices: vi.fn().mockReturnValue({
					embedder: { embedderInfo: { name: "openai" } },
					vectorStore: {},
					scanner: {},
					fileWatcher: {},
				}),
				validateEmbedder: vi.fn().mockResolvedValue({
					valid: false,
					error: "Invalid API key",
				}),
			}))

			// Act & Assert
			await expect(manager.initialize(mockContextProxy)).rejects.toThrow("Invalid API key")
			expect(manager.isInitialized).toBe(false)
		})

		it("should handle cache manager initialization failures", async () => {
			// Arrange
			;(mockContextProxy.getSecret as any).mockReturnValue("test-api-key")

			// Mock cache to fail during initialization
			const mockFs = vi.mocked(fs)
			mockFs.readFile.mockRejectedValue(new Error("Cache file corrupted"))

			// Act & Assert - should handle gracefully
			const result = await manager.initialize(mockContextProxy)
			expect(result.requiresRestart).toBe(true)
			// Cache initialization failure shouldn't prevent overall initialization
		})

		it("should recover from initialization failures", async () => {
			// Arrange - fail first initialization
			;(mockContextProxy.getSecret as any).mockReturnValue(undefined) // No API key
			await expect(manager.initialize(mockContextProxy))
				.resolves.toEqual({ requiresRestart: false })
				(
					// Fix configuration and retry
					mockContextProxy.getSecret as any,
				)
				.mockReturnValue("test-api-key")

			// Mock successful services
			const { CodeIndexServiceFactory } = await import("../../services/code-index/service-factory")
			const MockedServiceFactory = CodeIndexServiceFactory as any

			MockedServiceFactory.mockImplementation(() => ({
				createServices: vi.fn().mockReturnValue({
					embedder: { embedderInfo: { name: "openai" } },
					vectorStore: {
						initialize: vi.fn().mockResolvedValue(false),
						hasIndexedData: vi.fn().mockResolvedValue(false),
					},
					scanner: {},
					fileWatcher: {},
				}),
				validateEmbedder: vi.fn().mockResolvedValue({ valid: true }),
			}))

			// Act - should succeed now
			const result = await manager.initialize(mockContextProxy)

			// Assert
			expect(result.requiresRestart).toBe(true)
			expect(manager.isInitialized).toBe(true)
		})
	})

	describe("Service Unavailability During Initialization", () => {
		it("should handle Qdrant connection failures", async () => {
			// Arrange
			;(mockContextProxy.getSecret as any).mockReturnValue("test-api-key")

			// Mock vector store to fail connection
			const { CodeIndexServiceFactory } = await import("../../services/code-index/service-factory")
			const MockedServiceFactory = CodeIndexServiceFactory as any

			MockedServiceFactory.mockImplementation(() => ({
				createServices: vi.fn().mockReturnValue({
					embedder: { embedderInfo: { name: "openai" } },
					vectorStore: {
						initialize: vi.fn().mockRejectedValue(new Error("Qdrant connection failed")),
						hasIndexedData: vi.fn().mockResolvedValue(false),
					},
					scanner: {},
					fileWatcher: {},
				}),
				validateEmbedder: vi.fn().mockResolvedValue({ valid: true }),
			}))

			// Act & Assert
			await expect(manager.startIndexing()).rejects.toThrow("Qdrant connection failed")
		})

		it("should handle embedder service unavailability", async () => {
			// Arrange
			;(mockContextProxy.getSecret as any).mockReturnValue("test-api-key")

			// Mock embedder to fail
			const { CodeIndexServiceFactory } = await import("../../services/code-index/service-factory")
			const MockedServiceFactory = CodeIndexServiceFactory as any

			MockedServiceFactory.mockImplementation(() => ({
				createServices: vi.fn().mockReturnValue({
					embedder: {
						embedderInfo: { name: "openai" },
						createEmbeddings: vi.fn().mockRejectedValue(new Error("Embedder service unavailable")),
					},
					vectorStore: {
						initialize: vi.fn().mockResolvedValue(false),
						hasIndexedData: vi.fn().mockResolvedValue(true),
						search: vi.fn().mockResolvedValue([]),
					},
					scanner: {},
					fileWatcher: {},
				}),
				validateEmbedder: vi.fn().mockResolvedValue({ valid: true }),
			}))

			await manager.initialize(mockContextProxy)

			// Act & Assert
			await expect(manager.searchIndex("test query")).rejects.toThrow("Embedder service unavailable")
		})

		it("should handle file watcher initialization failures", async () => {
			// Arrange
			;(mockContextProxy.getSecret as any).mockReturnValue("test-api-key")

			// Mock file watcher to fail
			const { CodeIndexServiceFactory } = await import("../../services/code-index/service-factory")
			const MockedServiceFactory = CodeIndexServiceFactory as any

			MockedServiceFactory.mockImplementation(() => ({
				createServices: vi.fn().mockReturnValue({
					embedder: { embedderInfo: { name: "openai" } },
					vectorStore: {
						initialize: vi.fn().mockResolvedValue(false),
						hasIndexedData: vi.fn().mockResolvedValue(false),
					},
					scanner: {},
					fileWatcher: {
						initialize: vi.fn().mockRejectedValue(new Error("File watcher initialization failed")),
						dispose: vi.fn(),
					},
				}),
				validateEmbedder: vi.fn().mockResolvedValue({ valid: true }),
			}))

			// Act & Assert
			await expect(manager.startIndexing()).rejects.toThrow("File watcher initialization failed")
		})
	})

	describe("Configuration Errors and Restart Scenarios", () => {
		it("should handle invalid configuration values", async () => {
			// Arrange - invalid configuration
			;(mockContextProxy.getGlobalState as any)
				.mockReturnValue({
					codebaseIndexEnabled: true,
					codebaseIndexQdrantUrl: "invalid-url", // Invalid URL
					codebaseIndexEmbedderProvider: "openai",
					codebaseIndexEmbedderModelId: "text-embedding-3-small",
				})(mockContextProxy.getSecret as any)
				.mockReturnValue("test-api-key")

			// Act & Assert - should handle gracefully
			const result = await manager.initialize(mockContextProxy)
			expect(result.requiresRestart).toBe(true)
			// Manager should still be considered initialized even with invalid config
		})

		it("should handle missing required configuration", async () => {
			// Arrange - missing Qdrant URL
			;(mockContextProxy.getGlobalState as any)
				.mockReturnValue({
					codebaseIndexEnabled: true,
					codebaseIndexQdrantUrl: undefined, // Missing
					codebaseIndexEmbedderProvider: "openai",
					codebaseIndexEmbedderModelId: "text-embedding-3-small",
				})(mockContextProxy.getSecret as any)
				.mockReturnValue("test-api-key")

			// Act
			const result = await manager.initialize(mockContextProxy)

			// Assert
			expect(result.requiresRestart).toBe(true)
			expect(manager.isFeatureConfigured).toBe(false)
		})

		it("should handle configuration changes during indexing", async () => {
			// Arrange
			;(mockContextProxy.getSecret as any).mockReturnValue("test-api-key")

			// Mock successful services
			const { CodeIndexServiceFactory } = await import("../../services/code-index/service-factory")
			const MockedServiceFactory = CodeIndexServiceFactory as any

			const mockServices = {
				createServices: vi.fn().mockReturnValue({
					embedder: { embedderInfo: { name: "openai" } },
					vectorStore: {
						initialize: vi.fn().mockResolvedValue(false),
						hasIndexedData: vi.fn().mockResolvedValue(false),
					},
					scanner: {},
					fileWatcher: {},
				}),
				validateEmbedder: vi.fn().mockResolvedValue({ valid: true }),
			}
			MockedServiceFactory.mockImplementation(() => mockServices)

			await manager
				.initialize(mockContextProxy)
				(
					// Act - change configuration during indexing
					mockContextProxy.getGlobalState as any,
				)
				.mockReturnValue({
					codebaseIndexEnabled: true,
					codebaseIndexQdrantUrl: "http://localhost:6334", // Different URL
					codebaseIndexEmbedderProvider: "openai",
					codebaseIndexEmbedderModelId: "text-embedding-3-small",
				})

			// Should handle configuration change gracefully
			await expect(manager.handleSettingsChange()).resolves.not.toThrow()
		})
	})

	describe("Network Timeouts and Connection Issues", () => {
		it("should handle network timeouts during embedding", async () => {
			// Arrange
			;(mockContextProxy.getSecret as any).mockReturnValue("test-api-key")

			// Mock embedder to timeout
			const { CodeIndexServiceFactory } = await import("../../services/code-index/service-factory")
			const MockedServiceFactory = CodeIndexServiceFactory as any

			MockedServiceFactory.mockImplementation(() => ({
				createServices: vi.fn().mockReturnValue({
					embedder: {
						embedderInfo: { name: "openai" },
						createEmbeddings: vi.fn().mockImplementation(() => {
							return new Promise((_, reject) => {
								setTimeout(() => reject(new Error("Network timeout")), 100)
							})
						}),
					},
					vectorStore: {
						initialize: vi.fn().mockResolvedValue(false),
						hasIndexedData: vi.fn().mockResolvedValue(true),
						search: vi.fn().mockResolvedValue([]),
					},
					scanner: {},
					fileWatcher: {},
				}),
				validateEmbedder: vi.fn().mockResolvedValue({ valid: true }),
			}))

			await manager.initialize(mockContextProxy)

			// Act & Assert
			await expect(manager.searchIndex("test query")).rejects.toThrow("Network timeout")
		})

		it("should handle connection refused errors", async () => {
			// Arrange
			;(mockContextProxy.getSecret as any).mockReturnValue("test-api-key")

			// Mock vector store to refuse connection
			const { CodeIndexServiceFactory } = await import("../../services/code-index/service-factory")
			const MockedServiceFactory = CodeIndexServiceFactory as any

			MockedServiceFactory.mockImplementation(() => ({
				createServices: vi.fn().mockReturnValue({
					embedder: { embedderInfo: { name: "openai" } },
					vectorStore: {
						initialize: vi.fn().mockRejectedValue(new Error("ECONNREFUSED: Connection refused")),
						hasIndexedData: vi.fn().mockResolvedValue(false),
					},
					scanner: {},
					fileWatcher: {},
				}),
				validateEmbedder: vi.fn().mockResolvedValue({ valid: true }),
			}))

			// Act & Assert
			await expect(manager.startIndexing()).rejects.toThrow("ECONNREFUSED: Connection refused")
		})

		it("should handle rate limiting from embedder service", async () => {
			// Arrange
			;(mockContextProxy.getSecret as any).mockReturnValue("test-api-key")

			// Mock embedder to rate limit
			const { CodeIndexServiceFactory } = await import("../../services/code-index/service-factory")
			const MockedServiceFactory = CodeIndexServiceFactory as any

			MockedServiceFactory.mockImplementation(() => ({
				createServices: vi.fn().mockReturnValue({
					embedder: {
						embedderInfo: { name: "openai" },
						createEmbeddings: vi.fn().mockRejectedValue(new Error("Rate limit exceeded")),
					},
					vectorStore: {
						initialize: vi.fn().mockResolvedValue(false),
						hasIndexedData: vi.fn().mockResolvedValue(true),
						search: vi.fn().mockResolvedValue([]),
					},
					scanner: {},
					fileWatcher: {},
				}),
				validateEmbedder: vi.fn().mockResolvedValue({ valid: true }),
			}))

			await manager.initialize(mockContextProxy)

			// Act & Assert
			await expect(manager.searchIndex("test query")).rejects.toThrow("Rate limit exceeded")
		})
	})

	describe("Memory Constraints and Resource Exhaustion", () => {
		it("should handle out of memory errors during indexing", async () => {
			// Arrange
			;(mockContextProxy.getSecret as any).mockReturnValue("test-api-key")

			// Mock scanner to run out of memory
			const { CodeIndexServiceFactory } = await import("../../services/code-index/service-factory")
			const MockedServiceFactory = CodeIndexServiceFactory as any

			MockedServiceFactory.mockImplementation(() => ({
				createServices: vi.fn().mockReturnValue({
					embedder: { embedderInfo: { name: "openai" } },
					vectorStore: {
						initialize: vi.fn().mockResolvedValue(false),
						hasIndexedData: vi.fn().mockResolvedValue(false),
					},
					scanner: {
						scanDirectory: vi.fn().mockRejectedValue(new Error("JavaScript heap out of memory")),
					},
					fileWatcher: {},
				}),
				validateEmbedder: vi.fn().mockResolvedValue({ valid: true }),
			}))

			// Act & Assert
			await expect(manager.startIndexing()).rejects.toThrow("JavaScript heap out of memory")
		})

		it("should handle file system space exhaustion", async () => {
			// Arrange
			;(mockContextProxy.getSecret as any).mockReturnValue("test-api-key")

			// Mock cache write to fail due to disk space
			const mockFs = vi.mocked(fs)
			mockFs.writeFile.mockRejectedValue(new Error("ENOSPC: No space left on device"))

			// Act & Assert - should handle gracefully
			const result = await manager.initialize(mockContextProxy)
			expect(result.requiresRestart).toBe(true)
		})

		it("should handle too many open files error", async () => {
			// Arrange
			;(mockContextProxy.getSecret as any).mockReturnValue("test-api-key")

			// Mock file operations to fail
			const mockFs = vi.mocked(fs)
			mockFs.readFile.mockRejectedValue(new Error("EMFILE: Too many open files"))

			// Act & Assert - should handle gracefully
			const result = await manager.initialize(mockContextProxy)
			expect(result.requiresRestart).toBe(true)
		})
	})

	describe("Concurrent Access Conflicts", () => {
		it("should handle concurrent initialization attempts", async () => {
			// Arrange
			;(mockContextProxy.getSecret as any).mockReturnValue("test-api-key")

			// Mock slow initialization
			const { CodeIndexServiceFactory } = await import("../../services/code-index/service-factory")
			const MockedServiceFactory = CodeIndexServiceFactory as any

			MockedServiceFactory.mockImplementation(() => ({
				createServices: vi.fn().mockImplementation(async () => {
					await new Promise((resolve) => setTimeout(resolve, 100))
					return {
						embedder: { embedderInfo: { name: "openai" } },
						vectorStore: {
							initialize: vi.fn().mockResolvedValue(false),
							hasIndexedData: vi.fn().mockResolvedValue(false),
						},
						scanner: {},
						fileWatcher: {},
					}
				}),
				validateEmbedder: vi.fn().mockResolvedValue({ valid: true }),
			}))

			// Act - concurrent initializations
			const promises = [
				manager.initialize(mockContextProxy),
				manager.initialize(mockContextProxy),
				manager.initialize(mockContextProxy),
			]

			// Assert - all should complete
			const results = await Promise.allSettled(promises)
			expect(results).toHaveLength(3)
			results.forEach((result) => {
				expect(result.status).toBe("fulfilled")
			})
		})

		it("should handle concurrent search operations", async () => {
			// Arrange
			;(mockContextProxy.getSecret as any).mockReturnValue("test-api-key")

			// Mock successful services
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
						search: vi.fn().mockResolvedValue([]),
					},
					scanner: {},
					fileWatcher: {},
				}),
				validateEmbedder: vi.fn().mockResolvedValue({ valid: true }),
			}))

			await manager.initialize(mockContextProxy)

			// Act - concurrent searches
			const promises = Array.from({ length: 10 }, (_, i) => manager.searchIndex(`test query ${i}`))

			// Assert - all should complete
			const results = await Promise.allSettled(promises)
			expect(results).toHaveLength(10)
			results.forEach((result) => {
				expect(result.status).toBe("fulfilled")
			})
		})

		it("should handle race conditions during error recovery", async () => {
			// Arrange
			;(mockContextProxy.getSecret as any).mockReturnValue("test-api-key")

			// Act - concurrent recovery attempts
			const promises = [manager.recoverFromError(), manager.recoverFromError(), manager.recoverFromError()]

			// Assert - should handle gracefully (only one should actually recover)
			await Promise.all(promises)
			expect(manager.isInitialized).toBe(false)
		})
	})

	describe("Partial Initialization States", () => {
		it("should handle partial service initialization", async () => {
			// Arrange
			;(mockContextProxy.getSecret as any).mockReturnValue("test-api-key")

			// Mock partial service failure
			const { CodeIndexServiceFactory } = await import("../../services/code-index/service-factory")
			const MockedServiceFactory = CodeIndexServiceFactory as any

			MockedServiceFactory.mockImplementation(() => ({
				createServices: vi.fn().mockImplementation(() => {
					// Return partial services
					return {
						embedder: { embedderInfo: { name: "openai" } },
						vectorStore: {
							initialize: vi.fn().mockResolvedValue(false),
							hasIndexedData: vi.fn().mockResolvedValue(false),
						},
						scanner: null, // Missing scanner
						fileWatcher: {},
					}
				}),
				validateEmbedder: vi.fn().mockResolvedValue({ valid: true }),
			}))

			// Act & Assert
			await expect(manager.initialize(mockContextProxy)).rejects.toThrow()
		})

		it("should handle inconsistent state recovery", async () => {
			// Arrange - create inconsistent state
			;(mockContextProxy.getSecret as any).mockReturnValue("test-api-key")

			// Mock services with inconsistent state
			const { CodeIndexServiceFactory } = await import("../../services/code-index/service-factory")
			const MockedServiceFactory = CodeIndexServiceFactory as any

			MockedServiceFactory.mockImplementation(() => ({
				createServices: vi.fn().mockReturnValue({
					embedder: { embedderInfo: { name: "openai" } },
					vectorStore: {
						initialize: vi.fn().mockResolvedValue(false),
						hasIndexedData: vi.fn().mockResolvedValue(true), // Inconsistent
					},
					scanner: {},
					fileWatcher: {},
				}),
				validateEmbedder: vi.fn().mockResolvedValue({ valid: true }),
			}))

			await manager.initialize(mockContextProxy)

			// Act - trigger recovery
			await manager.recoverFromError()

			// Assert - should reset to clean state
			expect(manager.isInitialized).toBe(false)
		})
	})

	describe("Error Recovery Mechanisms", () => {
		it("should recover from error state and reinitialize", async () => {
			// Arrange - put manager in error state
			;(mockContextProxy.getSecret as any).mockReturnValue("test-api-key")

			// Mock services to fail initially
			const { CodeIndexServiceFactory } = await import("../../services/code-index/service-factory")
			const MockedServiceFactory = CodeIndexServiceFactory as any

			let callCount = 0
			MockedServiceFactory.mockImplementation(() => ({
				createServices: vi.fn().mockImplementation(() => {
					callCount++
					if (callCount === 1) {
						throw new Error("Initial failure")
					}
					return {
						embedder: { embedderInfo: { name: "openai" } },
						vectorStore: {
							initialize: vi.fn().mockResolvedValue(false),
							hasIndexedData: vi.fn().mockResolvedValue(false),
						},
						scanner: {},
						fileWatcher: {},
					}
				}),
				validateEmbedder: vi.fn().mockResolvedValue({ valid: true }),
			}))

			// Act - fail first, then recover
			await expect(manager.initialize(mockContextProxy)).rejects.toThrow("Initial failure")

			// Recover and retry
			await manager.recoverFromError()
			const result = await manager.initialize(mockContextProxy)

			// Assert
			expect(result.requiresRestart).toBe(true)
			expect(manager.isInitialized).toBe(true)
		})

		it("should handle graceful degradation scenarios", async () => {
			// Arrange - feature enabled but not fully configured
			;(mockContextProxy.getGlobalState as any)
				.mockReturnValue({
					codebaseIndexEnabled: true,
					codebaseIndexQdrantUrl: "http://localhost:6333",
					codebaseIndexEmbedderProvider: "openai",
					codebaseIndexEmbedderModelId: "text-embedding-3-small",
				})(mockContextProxy.getSecret as any)
				.mockReturnValue(undefined) // No API key

			// Act
			const result = await manager.initialize(mockContextProxy)

			// Assert - should degrade gracefully
			expect(result.requiresRestart).toBe(false)
			expect(manager.isFeatureEnabled).toBe(true)
			expect(manager.isFeatureConfigured).toBe(false)

			// Search should return empty array when not configured
			const searchResults = await manager.searchIndex("test")
			expect(searchResults).toEqual([])
		})

		it("should maintain error state consistency", async () => {
			// Arrange
			;(mockContextProxy.getSecret as any).mockReturnValue("test-api-key")

			// Mock services to fail consistently
			const { CodeIndexServiceFactory } = await import("../../services/code-index/service-factory")
			const MockedServiceFactory = CodeIndexServiceFactory as any

			MockedServiceFactory.mockImplementation(() => ({
				createServices: vi.fn().mockReturnValue({
					embedder: { embedderInfo: { name: "openai" } },
					vectorStore: {
						initialize: vi.fn().mockRejectedValue(new Error("Persistent failure")),
						hasIndexedData: vi.fn().mockResolvedValue(false),
					},
					scanner: {},
					fileWatcher: {},
				}),
				validateEmbedder: vi.fn().mockResolvedValue({ valid: true }),
			}))

			// Act - multiple failed attempts
			await expect(manager.startIndexing()).rejects.toThrow("Persistent failure")
			await expect(manager.startIndexing()).rejects.toThrow("Persistent failure")

			// Assert - error state should be consistent
			const status = manager.getCurrentStatus()
			expect(status.systemStatus).toBeDefined()
		})
	})

	describe("Telemetry and Error Reporting", () => {
		it("should capture telemetry for initialization errors", async () => {
			// Arrange
			;(mockContextProxy.getGlobalState as any).mockImplementation(() => {
				throw new Error("Configuration error")
			})

			const { TelemetryService } = await import("@roo-code/telemetry")
			const mockTelemetry = TelemetryService.instance

			// Act
			await expect(manager.initialize(mockContextProxy)).rejects.toThrow("Configuration error")

			// Assert - telemetry should be captured
			expect(mockTelemetry.captureEvent).toHaveBeenCalled()
		})

		it("should capture telemetry for service errors", async () => {
			// Arrange
			;(mockContextProxy.getSecret as any).mockReturnValue("test-api-key")

			const { TelemetryService } = await import("@roo-code/telemetry")
			const mockTelemetry = TelemetryService.instance

			// Mock services to fail
			const { CodeIndexServiceFactory } = await import("../../services/code-index/service-factory")
			const MockedServiceFactory = CodeIndexServiceFactory as any

			MockedServiceFactory.mockImplementation(() => ({
				createServices: vi.fn().mockReturnValue({
					embedder: { embedderInfo: { name: "openai" } },
					vectorStore: {
						initialize: vi.fn().mockRejectedValue(new Error("Service error")),
						hasIndexedData: vi.fn().mockResolvedValue(false),
					},
					scanner: {},
					fileWatcher: {},
				}),
				validateEmbedder: vi.fn().mockResolvedValue({ valid: true }),
			}))

			// Act
			await expect(manager.startIndexing()).rejects.toThrow("Service error")

			// Assert - telemetry should be captured
			expect(mockTelemetry.captureEvent).toHaveBeenCalledWith(
				expect.objectContaining({
					error: expect.any(String),
					location: expect.any(String),
				}),
			)
		})
	})
})
