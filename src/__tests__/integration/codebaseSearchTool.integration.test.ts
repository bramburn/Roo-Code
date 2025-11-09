import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { codebaseSearchTool } from "../../core/tools/codebaseSearchTool"
import { CodeIndexManager } from "../../services/code-index/manager"
import { Task } from "../../core/task/Task"
import * as vscode from "vscode"
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
		asRelativePath: vi.fn((filePath: string) => path.relative("/test/workspace", filePath)),
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
				hasIndexedData: vi.fn().mockResolvedValue(true),
				search: vi.fn().mockImplementation((vector, prefix, minScore, maxResults) => {
					// Mock search results based on query
					if (prefix && prefix.includes("nonexistent")) {
						return []
					}
					return [
						{
							score: 0.9,
							payload: {
								filePath: "/test/workspace/src/test.ts",
								startLine: 1,
								endLine: 10,
								codeChunk: "function test() { return 'hello'; }",
							},
						},
						{
							score: 0.8,
							payload: {
								filePath: "/test/workspace/src/utils.ts",
								startLine: 5,
								endLine: 15,
								codeChunk: "export function utility() { return 'world'; }",
							},
						},
					]
				}),
				markIndexingComplete: vi.fn().mockResolvedValue(undefined),
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

// Mock other dependencies
vi.mock("fs/promises", () => ({
	default: {
		readFile: vi.fn().mockResolvedValue(""),
		mkdir: vi.fn().mockResolvedValue(undefined),
		writeFile: vi.fn().mockResolvedValue(undefined),
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

describe("codebaseSearchTool Integration Tests", () => {
	let mockTask: Task
	let mockContext: vscode.ExtensionContext
	let mockContextProxy: any
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
		}

		// Create and initialize manager
		manager = CodeIndexManager.getInstance(mockContext, testWorkspacePath)!
		manager.initialize(mockContextProxy)

		// Mock task
		mockTask = {
			cwd: testWorkspacePath,
			providerRef: {
				deref: () => ({
					context: mockContext,
				}),
			},
			say: vi.fn().mockResolvedValue(undefined),
			ask: vi.fn().mockResolvedValue(undefined),
			sayAndCreateMissingParamError: vi.fn().mockReturnValue("Missing parameter error"),
			consecutiveMistakeCount: 0,
		} as any

		// Initialize manager
		manager.initialize(mockContextProxy)
	})

	afterEach(() => {
		CodeIndexManager.disposeAll()
		vi.restoreAllMocks()
	})

	describe("Basic Search Integration", () => {
		it("should perform successful codebase search", async () => {
			// Arrange
			const block = {
				params: {
					query: "test function",
				},
				partial: false,
			}

			const askApproval = vi.fn().mockResolvedValue(true)
			const handleError = vi.fn()
			const pushToolResult = vi.fn()
			const removeClosingTag = vi.fn((tag, value) => value)

			// Act
			await codebaseSearchTool(mockTask, block, askApproval, handleError, pushToolResult, removeClosingTag)

			// Assert
			expect(askApproval).toHaveBeenCalledWith(
				"tool",
				JSON.stringify({
					tool: "codebaseSearch",
					query: "test function",
					path: undefined,
					isOutsideWorkspace: false,
				}),
			)
			expect(pushToolResult).toHaveBeenCalled()
		})

		it("should handle search with directory prefix", async () => {
			// Arrange
			const block = {
				params: {
					query: "utility function",
					path: "/src",
				},
				partial: false,
			}

			const askApproval = vi.fn().mockResolvedValue(true)
			const handleError = vi.fn()
			const pushToolResult = vi.fn()
			const removeClosingTag = vi.fn((tag, value) => value)

			// Act
			await codebaseSearchTool(mockTask, block, askApproval, handleError, pushToolResult, removeClosingTag)

			// Assert
			expect(askApproval).toHaveBeenCalledWith(
				"tool",
				JSON.stringify({
					tool: "codebaseSearch",
					query: "utility function",
					path: "/src",
					isOutsideWorkspace: false,
				}),
			)
		})

		it("should handle no results scenario", async () => {
			// Arrange
			const block = {
				params: {
					query: "nonexistent function",
					path: "/nonexistent",
				},
				partial: false,
			}

			const askApproval = vi.fn().mockResolvedValue(true)
			const handleError = vi.fn()
			const pushToolResult = vi.fn()
			const removeClosingTag = vi.fn((tag, value) => value)

			// Act
			await codebaseSearchTool(mockTask, block, askApproval, handleError, pushToolResult, removeClosingTag)

			// Assert
			expect(pushToolResult).toHaveBeenCalledWith(
				'No relevant code snippets found for the query: "nonexistent function"',
			)
		})
	})

	describe("Error Handling Integration", () => {
		it("should handle missing query parameter", async () => {
			// Arrange
			const block = {
				params: {},
				partial: false,
			}

			const askApproval = vi.fn()
			const handleError = vi.fn()
			const pushToolResult = vi.fn()
			const removeClosingTag = vi.fn((tag, value) => value)

			// Act
			await codebaseSearchTool(mockTask, block, askApproval, handleError, pushToolResult, removeClosingTag)

			// Assert
			expect(mockTask.consecutiveMistakeCount).toBe(1)
			expect(pushToolResult).toHaveBeenCalledWith("Missing parameter error")
		})

		it("should handle workspace path missing", async () => {
			// Arrange
			const noWorkspaceTask = {
				...mockTask,
				cwd: "",
				providerRef: {
					deref: () => ({
						context: mockContext,
					}),
				},
			}

			const block = {
				params: {
					query: "test",
				},
				partial: false,
			}

			const askApproval = vi.fn().mockResolvedValue(true)
			const handleError = vi.fn()
			const pushToolResult = vi.fn()
			const removeClosingTag = vi.fn((tag, value) => value)

			// Act
			await codebaseSearchTool(noWorkspaceTask, block, askApproval, handleError, pushToolResult, removeClosingTag)

			// Assert
			expect(handleError).toHaveBeenCalledWith("codebase_search", expect.any(Error))
		})

		it("should handle extension context unavailable", async () => {
			// Arrange
			const noContextTask = {
				...mockTask,
				providerRef: {
					deref: () => null, // No context available
				},
			}

			const block = {
				params: {
					query: "test",
				},
				partial: false,
			}

			const askApproval = vi.fn().mockResolvedValue(true)
			const handleError = vi.fn()
			const pushToolResult = vi.fn()
			const removeClosingTag = vi.fn((tag, value) => value)

			// Act
			await codebaseSearchTool(noContextTask, block, askApproval, handleError, pushToolResult, removeClosingTag)

			// Assert
			expect(handleError).toHaveBeenCalledWith("codebase_search", expect.any(Error))
		})

		it("should handle CodeIndexManager unavailable", async () => {
			// Arrange - dispose all managers
			CodeIndexManager.disposeAll()

			const block = {
				params: {
					query: "test",
				},
				partial: false,
			}

			const askApproval = vi.fn().mockResolvedValue(true)
			const handleError = vi.fn()
			const pushToolResult = vi.fn()
			const removeClosingTag = vi.fn((tag, value) => value)

			// Act
			await codebaseSearchTool(mockTask, block, askApproval, handleError, pushToolResult, removeClosingTag)

			// Assert
			expect(handleError).toHaveBeenCalledWith("codebase_search", expect.any(Error))
		})

		it("should handle feature disabled scenario", async () => {
			// Arrange - disable feature
			mockContextProxy.getGlobalState.mockReturnValue({
				codebaseIndexEnabled: false,
			})

			// Re-initialize manager with disabled feature
			await manager.initialize(mockContextProxy)

			const block = {
				params: {
					query: "test",
				},
				partial: false,
			}

			const askApproval = vi.fn().mockResolvedValue(true)
			const handleError = vi.fn()
			const pushToolResult = vi.fn()
			const removeClosingTag = vi.fn((tag, value) => value)

			// Act
			await codebaseSearchTool(mockTask, block, askApproval, handleError, pushToolResult, removeClosingTag)

			// Assert
			expect(handleError).toHaveBeenCalledWith("codebase_search", expect.any(Error))
		})

		it("should handle feature not configured scenario", async () => {
			// Arrange - feature enabled but not configured
			mockContextProxy.getGlobalState.mockReturnValue({
				codebaseIndexEnabled: true,
				codebaseIndexQdrantUrl: "http://localhost:6333",
				codebaseIndexEmbedderProvider: "openai",
			})
			mockContextProxy.getSecret.mockReturnValue(undefined) // No API key

			// Re-initialize manager
			await manager.initialize(mockContextProxy)

			const block = {
				params: {
					query: "test",
				},
				partial: false,
			}

			const askApproval = vi.fn().mockResolvedValue(true)
			const handleError = vi.fn()
			const pushToolResult = vi.fn()
			const removeClosingTag = vi.fn((tag, value) => value)

			// Act
			await codebaseSearchTool(mockTask, block, askApproval, handleError, pushToolResult, removeClosingTag)

			// Assert
			expect(handleError).toHaveBeenCalledWith("codebase_search", expect.any(Error))
		})
	})

	describe("Search Service Integration", () => {
		it("should handle search service errors", async () => {
			// Arrange - mock search service to fail
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
						search: vi.fn().mockResolvedValue([]),
					},
					scanner: {},
					fileWatcher: {},
				}),
				validateEmbedder: vi.fn().mockResolvedValue({ valid: true }),
			}))

			// Re-initialize manager with failing search service
			await manager.initialize(mockContextProxy)

			const block = {
				params: {
					query: "test",
				},
				partial: false,
			}

			const askApproval = vi.fn().mockResolvedValue(true)
			const handleError = vi.fn()
			const pushToolResult = vi.fn()
			const removeClosingTag = vi.fn((tag, value) => value)

			// Act
			await codebaseSearchTool(mockTask, block, askApproval, handleError, pushToolResult, removeClosingTag)

			// Assert
			expect(handleError).toHaveBeenCalledWith("codebase_search", expect.any(Error))
		})

		it("should handle vector store errors", async () => {
			// Arrange - mock vector store to fail
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
						search: vi.fn().mockRejectedValue(new Error("Vector store error")),
					},
					scanner: {},
					fileWatcher: {},
				}),
				validateEmbedder: vi.fn().mockResolvedValue({ valid: true }),
			}))

			// Re-initialize manager with failing vector store
			await manager.initialize(mockContextProxy)

			const block = {
				params: {
					query: "test",
				},
				partial: false,
			}

			const askApproval = vi.fn().mockResolvedValue(true)
			const handleError = vi.fn()
			const pushToolResult = vi.fn()
			const removeClosingTag = vi.fn((tag, value) => value)

			// Act
			await codebaseSearchTool(mockTask, block, askApproval, handleError, pushToolResult, removeClosingTag)

			// Assert
			expect(handleError).toHaveBeenCalledWith("codebase_search", expect.any(Error))
		})
	})

	describe("Result Formatting Integration", () => {
		it("should format search results correctly", async () => {
			// Arrange
			const block = {
				params: {
					query: "test function",
				},
				partial: false,
			}

			const askApproval = vi.fn().mockResolvedValue(true)
			const handleError = vi.fn()
			const pushToolResult = vi.fn()
			const removeClosingTag = vi.fn((tag, value) => value)

			// Act
			await codebaseSearchTool(mockTask, block, askApproval, handleError, pushToolResult, removeClosingTag)

			// Assert
			expect(mockTask.say).toHaveBeenCalledWith(
				"codebase_search_result",
				expect.stringContaining("test function"),
			)

			// Check that pushToolResult was called with formatted results
			const pushCall = pushToolResult.mock.calls[0][0]
			expect(pushCall).toContain("Query: test function")
			expect(pushCall).toContain("File path: src/test.ts")
			expect(pushCall).toContain("Score: 0.9")
			expect(pushCall).toContain("Lines: 1-10")
			expect(pushCall).toContain("Code Chunk: function test() { return 'hello'; }")
		})

		it("should handle path normalization correctly", async () => {
			// Arrange
			const block = {
				params: {
					query: "test",
					path: "src\\utils", // Windows-style path
				},
				partial: false,
			}

			const askApproval = vi.fn().mockResolvedValue(true)
			const handleError = vi.fn()
			const pushToolResult = vi.fn()
			const removeClosingTag = vi.fn((tag, value) => value)

			// Act
			await codebaseSearchTool(mockTask, block, askApproval, handleError, pushToolResult, removeClosingTag)

			// Assert
			expect(askApproval).toHaveBeenCalledWith(
				"tool",
				expect.stringContaining("src/utils"), // Should be normalized
			)
		})
	})

	describe("Approval and Permission Handling", () => {
		it("should handle approval denial", async () => {
			// Arrange
			const block = {
				params: {
					query: "test",
				},
				partial: false,
			}

			const askApproval = vi.fn().mockResolvedValue(false) // Denied
			const handleError = vi.fn()
			const pushToolResult = vi.fn()
			const removeClosingTag = vi.fn((tag, value) => value)

			// Act
			await codebaseSearchTool(mockTask, block, askApproval, handleError, pushToolResult, removeClosingTag)

			// Assert
			expect(askApproval).toHaveBeenCalled()
			expect(pushToolResult).toHaveBeenCalledWith("Tool execution was denied.")
		})

		it("should handle partial blocks correctly", async () => {
			// Arrange
			const block = {
				params: {
					query: "test",
				},
				partial: true,
			}

			const askApproval = vi.fn().mockResolvedValue(true)
			const handleError = vi.fn()
			const pushToolResult = vi.fn()
			const removeClosingTag = vi.fn((tag, value) => value)

			// Act
			await codebaseSearchTool(mockTask, block, askApproval, handleError, pushToolResult, removeClosingTag)

			// Assert
			expect(mockTask.ask).toHaveBeenCalledWith(
				"tool",
				JSON.stringify({
					tool: "codebaseSearch",
					query: "test",
					path: undefined,
					isOutsideWorkspace: false,
				}),
				true,
			)
			// Should not proceed with search for partial blocks
			expect(pushToolResult).not.toHaveBeenCalled()
		})
	})

	describe("Performance and Concurrent Operations", () => {
		it("should handle concurrent search requests", async () => {
			// Arrange
			const blocks = [
				{ params: { query: "test1" }, partial: false },
				{ params: { query: "test2" }, partial: false },
				{ params: { query: "test3" }, partial: false },
			]

			const askApproval = vi.fn().mockResolvedValue(true)
			const handleError = vi.fn()
			const pushToolResult = vi.fn()
			const removeClosingTag = vi.fn((tag, value) => value)

			// Act - concurrent searches
			const promises = blocks.map((block) =>
				codebaseSearchTool(mockTask, block, askApproval, handleError, pushToolResult, removeClosingTag),
			)

			// Assert - all should complete
			await Promise.all(promises)
			expect(pushToolResult).toHaveBeenCalledTimes(3)
		})

		it("should handle search timeout scenarios", async () => {
			// Arrange - mock slow search
			const { CodeIndexServiceFactory } = await import("../../services/code-index/service-factory")
			const MockedServiceFactory = CodeIndexServiceFactory as any

			MockedServiceFactory.mockImplementation(() => ({
				createServices: vi.fn().mockReturnValue({
					embedder: {
						embedderInfo: { name: "openai" },
						createEmbeddings: vi.fn().mockImplementation(() => {
							return new Promise((_, reject) => {
								setTimeout(() => reject(new Error("Search timeout")), 100)
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

			// Re-initialize manager with slow search
			await manager.initialize(mockContextProxy)

			const block = {
				params: {
					query: "test",
				},
				partial: false,
			}

			const askApproval = vi.fn().mockResolvedValue(true)
			const handleError = vi.fn()
			const pushToolResult = vi.fn()
			const removeClosingTag = vi.fn((tag, value) => value)

			// Act
			await codebaseSearchTool(mockTask, block, askApproval, handleError, pushToolResult, removeClosingTag)

			// Assert
			expect(handleError).toHaveBeenCalledWith("codebase_search", expect.any(Error))
		})
	})
})
