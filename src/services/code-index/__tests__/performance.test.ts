import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { CodeIndexManager } from "../manager"
import { CodeIndexServiceFactory } from "../service-factory"
import { PerformanceManager } from "../../../core/condense/performance"
import { PerformanceMonitor } from "../../../core/condense/performance-monitor"
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

/**
 * Performance testing utilities for CodeIndexManager
 */
class CodeIndexPerformanceTester {
	private performanceManager: PerformanceManager
	private performanceMonitor: PerformanceMonitor
	private baselineMetrics: Map<string, number> = new Map()

	constructor() {
		this.performanceManager = new PerformanceManager({
			enableCaching: true,
			enableBatching: true,
			enableParallelProcessing: true,
			maxConcurrentOperations: 5,
			cacheSize: 100,
			batchSize: 10,
		})
		this.performanceMonitor = new PerformanceMonitor(this.performanceManager, {
			enableRealTimeMonitoring: true,
			enableTrendAnalysis: true,
			enableAlerts: true,
			enablePredictions: true,
			monitoringInterval: 1000,
			alertThresholds: {
				slowOperationThreshold: 100, // 100ms for search operations
				memoryUsageThreshold: 200, // 200MB
				errorRateThreshold: 5, // 5%
				cacheHitRateThreshold: 70, // 70%
			},
		})
	}

	/**
	 * Start performance monitoring
	 */
	startMonitoring(): void {
		this.performanceMonitor.startMonitoring()
	}

	/**
	 * Stop performance monitoring
	 */
	stopMonitoring(): void {
		this.performanceMonitor.stopMonitoring()
	}

	/**
	 * Measure operation performance
	 */
	async measureOperation<T>(
		operationName: string,
		operation: () => Promise<T>,
		options?: { cacheKey?: string; batchGroup?: string },
	): Promise<{ result: T; metrics: any }> {
		const operationId = this.performanceManager.startOperation(operationName)

		try {
			const result = await this.performanceManager.executeOperation(operationName, operation, options)

			const metrics = this.performanceManager.endOperation(operationId, { success: true })
			return { result, metrics }
		} catch (error) {
			this.performanceManager.endOperation(operationId, {
				success: false,
				error: error instanceof Error ? error.message : String(error),
			})
			throw error
		}
	}

	/**
	 * Measure search latency with multiple iterations
	 */
	async measureSearchLatency(
		manager: CodeIndexManager,
		query: string,
		iterations: number = 10,
	): Promise<{
		averageLatency: number
		p95Latency: number
		p99Latency: number
		minLatency: number
		maxLatency: number
	}> {
		const latencies: number[] = []

		for (let i = 0; i < iterations; i++) {
			const startTime = performance.now()
			try {
				await manager.searchIndex(query)
				const endTime = performance.now()
				latencies.push(endTime - startTime)
			} catch (error) {
				// Ignore search errors for latency measurement
			}
		}

		if (latencies.length === 0) {
			throw new Error("No successful search operations completed")
		}

		latencies.sort((a, b) => a - b)

		const averageLatency = latencies.reduce((sum, latency) => sum + latency, 0) / latencies.length
		const p95Index = Math.floor(latencies.length * 0.95)
		const p99Index = Math.floor(latencies.length * 0.99)

		return {
			averageLatency,
			p95Latency: latencies[p95Index],
			p99Latency: latencies[p99Index],
			minLatency: latencies[0],
			maxLatency: latencies[latencies.length - 1],
		}
	}

	/**
	 * Measure memory usage during operation
	 */
	async measureMemoryUsage<T>(operation: () => Promise<T>): Promise<{
		result: T
		memoryBefore: NodeJS.MemoryUsage
		memoryAfter: NodeJS.MemoryUsage
		memoryDelta: NodeJS.MemoryUsage
	}> {
		const memoryBefore = process.memoryUsage()
		const result = await operation()
		const memoryAfter = process.memoryUsage()

		const memoryDelta = {
			rss: memoryAfter.rss - memoryBefore.rss,
			heapTotal: memoryAfter.heapTotal - memoryBefore.heapTotal,
			heapUsed: memoryAfter.heapUsed - memoryBefore.heapUsed,
			external: memoryAfter.external - memoryBefore.external,
			arrayBuffers: memoryAfter.arrayBuffers - memoryBefore.arrayBuffers,
		}

		return { result, memoryBefore, memoryAfter, memoryDelta }
	}

	/**
	 * Measure concurrent operation performance
	 */
	async measureConcurrentPerformance<T>(
		operation: () => Promise<T>,
		concurrency: number = 10,
	): Promise<{ totalTime: number; averageTime: number; throughput: number; errors: number }> {
		const startTime = performance.now()

		const promises = Array.from({ length: concurrency }, (_, i) =>
			operation().catch((error) => ({ error, index: i })),
		)

		const results = await Promise.allSettled(promises)
		const endTime = performance.now()

		const totalTime = endTime - startTime
		const successfulResults = results.filter(
			(r) => r.status === "fulfilled" && !("error" in (r as any).value),
		).length
		const errors = concurrency - successfulResults

		return {
			totalTime,
			averageTime: totalTime / concurrency,
			throughput: (successfulResults / totalTime) * 1000, // operations per second
			errors,
		}
	}

	/**
	 * Set baseline metrics for comparison
	 */
	setBaseline(operationName: string, value: number): void {
		this.baselineMetrics.set(operationName, value)
	}

	/**
	 * Compare current metrics against baseline
	 */
	compareAgainstBaseline(
		operationName: string,
		currentValue: number,
	): { withinThreshold: boolean; difference: number; percentageChange: number } {
		const baseline = this.baselineMetrics.get(operationName)
		if (!baseline) {
			throw new Error(`No baseline found for operation: ${operationName}`)
		}

		const difference = currentValue - baseline
		const percentageChange = (difference / baseline) * 100
		const withinThreshold = Math.abs(percentageChange) <= 10 // 10% threshold

		return { withinThreshold, difference, percentageChange }
	}

	/**
	 * Get performance statistics
	 */
	getStats() {
		return {
			performance: this.performanceManager.getPerformanceStats(),
			monitoring: this.performanceMonitor.getMonitoringStatus(),
			alerts: this.performanceMonitor.getAlerts(),
			trends: this.performanceMonitor.getTrends(),
		}
	}

	/**
	 * Generate performance report
	 */
	generateReport() {
		return this.performanceMonitor.generateReport()
	}

	/**
	 * Dispose of performance testing resources
	 */
	dispose(): void {
		this.performanceMonitor.dispose()
		this.performanceManager.dispose()
	}
}

describe("CodeIndexManager - Performance Testing", () => {
	let performanceTester: CodeIndexPerformanceTester
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

		performanceTester = new CodeIndexPerformanceTester()
		performanceTester.startMonitoring()

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
		performanceTester.stopMonitoring()
		performanceTester.dispose()
	})

	describe("Task 4.5: Search Latency Performance", () => {
		it("should maintain search latency below 100ms additional overhead", async () => {
			// Arrange
			await manager.initialize(mockContextProxy)

			// Mock search service with realistic latency
			const mockSearchResults = [
				{
					score: 0.9,
					payload: { filePath: "/test/file.ts", startLine: 1, endLine: 10, codeChunk: "test code" },
				},
			]
			const mockSearchService = {
				searchIndex: vi.fn().mockImplementation(async () => {
					// Simulate base search latency of 50ms
					await new Promise((resolve) => setTimeout(resolve, 50))
					return mockSearchResults
				}),
			}
			;(manager as any)._searchService = mockSearchService

			// Set baseline for comparison (50ms base latency)
			performanceTester.setBaseline("search_latency", 50)

			// Act - measure search latency
			const latencyMetrics = await performanceTester.measureSearchLatency(manager, "test query", 20)

			// Assert
			expect(latencyMetrics.averageLatency).toBeLessThan(150) // Base 50ms + 100ms overhead
			expect(latencyMetrics.p95Latency).toBeLessThan(200) // Allow some variance for P95
			expect(latencyMetrics.p99Latency).toBeLessThan(250) // Allow more variance for P99

			// Compare against baseline
			const baselineComparison = performanceTester.compareAgainstBaseline(
				"search_latency",
				latencyMetrics.averageLatency,
			)
			expect(baselineComparison.withinThreshold).toBe(true)
			expect(baselineComparison.percentageChange).toBeLessThan(100) // Less than 100% increase
		})

		it("should handle concurrent search requests efficiently", async () => {
			// Arrange
			await manager.initialize(mockContextProxy)

			const mockSearchResults = [
				{
					score: 0.9,
					payload: { filePath: "/test/file.ts", startLine: 1, endLine: 10, codeChunk: "test code" },
				},
			]
			const mockSearchService = {
				searchIndex: vi.fn().mockImplementation(async (query: string) => {
					// Simulate variable search latency
					const delay = Math.random() * 50 + 25 // 25-75ms
					await new Promise((resolve) => setTimeout(resolve, delay))
					return mockSearchResults
				}),
			}
			;(manager as any)._searchService = mockSearchService

			// Act - measure concurrent performance
			const concurrentMetrics = await performanceTester.measureConcurrentPerformance(
				() => manager.searchIndex(`test-query-${Math.random()}`),
				20, // 20 concurrent requests
			)

			// Assert
			expect(concurrentMetrics.errors).toBeLessThan(2) // Allow minimal errors
			expect(concurrentMetrics.throughput).toBeGreaterThan(10) // At least 10 ops/sec
			expect(concurrentMetrics.averageTime).toBeLessThan(100) // Average under 100ms
		})

		it("should maintain performance under sustained search load", async () => {
			// Arrange
			await manager.initialize(mockContextProxy)

			const mockSearchResults = [
				{
					score: 0.9,
					payload: { filePath: "/test/file.ts", startLine: 1, endLine: 10, codeChunk: "test code" },
				},
			]
			const mockSearchService = {
				searchIndex: vi.fn().mockImplementation(async () => {
					// Simulate consistent search latency
					await new Promise((resolve) => setTimeout(resolve, 30))
					return mockSearchResults
				}),
			}
			;(manager as any)._searchService = mockSearchService

			// Act - sustained load test
			const batches = 5
			const batchSize = 10
			const batchMetrics: number[] = []

			for (let batch = 0; batch < batches; batch++) {
				const startTime = performance.now()

				const promises = Array.from({ length: batchSize }, (_, i) =>
					manager.searchIndex(`sustained-query-${batch}-${i}`),
				)

				await Promise.all(promises)
				const endTime = performance.now()

				batchMetrics.push(endTime - startTime)

				// Small delay between batches
				await new Promise((resolve) => setTimeout(resolve, 10))
			}

			// Assert - performance should remain consistent
			const averageBatchTime = batchMetrics.reduce((sum, time) => sum + time, 0) / batchMetrics.length
			const maxBatchTime = Math.max(...batchMetrics)
			const minBatchTime = Math.min(...batchMetrics)

			expect(averageBatchTime).toBeLessThan(500) // Average batch under 500ms
			expect(maxBatchTime - minBatchTime).toBeLessThan(200) // Low variance between batches
		})
	})

	describe("Task 4.5: Memory Usage Performance", () => {
		it("should maintain memory usage within acceptable bounds during initialization", async () => {
			// Arrange
			const initialMemory = process.memoryUsage()

			// Act - measure memory during initialization
			const { result, memoryDelta } = await performanceTester.measureMemoryUsage(() =>
				manager.initialize(mockContextProxy),
			)

			// Assert
			expect(result.requiresRestart).toBeDefined()

			// Memory increase should be reasonable (less than 50MB for initialization)
			expect(memoryDelta.heapUsed).toBeLessThan(50 * 1024 * 1024)
			expect(memoryDelta.rss).toBeLessThan(100 * 1024 * 1024)

			// Check final memory usage is within bounds
			const finalMemory = process.memoryUsage()
			expect(finalMemory.heapUsed).toBeLessThan(200 * 1024 * 1024) // Less than 200MB
		})

		it("should not cause memory leaks during repeated search operations", async () => {
			// Arrange
			await manager.initialize(mockContextProxy)

			const mockSearchResults = [
				{
					score: 0.9,
					payload: { filePath: "/test/file.ts", startLine: 1, endLine: 10, codeChunk: "test code" },
				},
			]
			const mockSearchService = {
				searchIndex: vi.fn().mockResolvedValue(mockSearchResults),
			}
			;(manager as any)._searchService = mockSearchService

			const initialMemory = process.memoryUsage()
			const iterations = 100

			// Act - perform many search operations
			for (let i = 0; i < iterations; i++) {
				await manager.searchIndex(`memory-leak-test-${i}`)

				// Force garbage collection every 20 iterations if available
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
			expect(memoryIncrease).toBeLessThan(20 * 1024 * 1024) // Less than 20MB increase
		})

		it("should handle memory pressure gracefully", async () => {
			// Arrange
			await manager.initialize(mockContextProxy)

			// Mock search service to work even under memory pressure
			const mockSearchResults = [
				{
					score: 0.9,
					payload: { filePath: "/test/file.ts", startLine: 1, endLine: 10, codeChunk: "test code" },
				},
			]
			const mockSearchService = {
				searchIndex: vi.fn().mockImplementation(async () => {
					// Simulate operation under memory pressure (slower but still works)
					await new Promise((resolve) => setTimeout(resolve, 100))
					return mockSearchResults
				}),
			}
			;(manager as any)._searchService = mockSearchService

			// Mock high memory usage scenario
			const originalMemoryUsage = process.memoryUsage
			const mockMemoryUsage = vi.fn().mockReturnValue({
				rss: 400 * 1024 * 1024, // 400MB
				heapTotal: 350 * 1024 * 1024, // 350MB
				heapUsed: 300 * 1024 * 1024, // 300MB (high usage)
				external: 50 * 1024 * 1024, // 50MB
				arrayBuffers: 10 * 1024 * 1024, // 10MB
			})

			// Temporarily replace process.memoryUsage
			;(process as any).memoryUsage = mockMemoryUsage

			try {
				// Act - measure operation under memory pressure
				const { result, metrics } = await performanceTester.measureOperation(
					"search_under_memory_pressure",
					() => manager.searchIndex("test query"),
					{ cacheKey: "memory-pressure-test" },
				)

				// Assert - operation should still complete
				expect(result).toBeDefined()
				expect(metrics.duration).toBeLessThan(5000) // Should complete within 5 seconds even under pressure

				// Check for memory-related alerts
				const alerts = performanceTester.getStats().alerts
				const memoryAlerts = alerts.filter((alert) => alert.type === "high_memory")
				expect(memoryAlerts.length).toBeGreaterThan(0) // Should trigger memory alerts
			} finally {
				// Restore original memory usage function
				;(process as any).memoryUsage = originalMemoryUsage
			}
		})
	})

	describe("Task 4.5: CPU Usage Performance", () => {
		it("should handle CPU-intensive operations efficiently", async () => {
			// Arrange
			await manager.initialize(mockContextProxy)

			// Mock CPU-intensive search operation
			const mockSearchService = {
				searchIndex: vi.fn().mockImplementation(async () => {
					// Simulate CPU-intensive work
					const start = Date.now()
					while (Date.now() - start < 50) {
						// Busy wait to simulate CPU work
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

			// Act - measure CPU performance
			const startTime = process.cpuUsage()
			const concurrentMetrics = await performanceTester.measureConcurrentPerformance(
				() => manager.searchIndex(`cpu-test-${Math.random()}`),
				5, // 5 concurrent operations
			)
			const endTime = process.cpuUsage(startTime)

			// Assert - should complete in reasonable time
			expect(concurrentMetrics.totalTime).toBeLessThan(1000) // Under 1 second total
			expect(concurrentMetrics.errors).toBe(0) // No errors under CPU load

			// CPU usage should be reasonable (this is a rough check)
			const cpuPercent = ((endTime.user + endTime.system) / (concurrentMetrics.totalTime * 1000)) * 100
			expect(cpuPercent).toBeLessThan(200) // Less than 200% CPU (considering multiple cores)
		})
	})

	describe("Task 4.5: Initialization Overhead", () => {
		it("should measure initialization time impact", async () => {
			// Arrange
			const baselineManager = new CodeIndexManager(testWorkspacePath, mockContext)

			// Act - measure initialization time
			const { result, metrics } = await performanceTester.measureOperation("initialization", () =>
				manager.initialize(mockContextProxy),
			)

			// Assert
			expect(result.requiresRestart).toBeDefined()
			expect(metrics.duration).toBeLessThan(1000) // Initialization should complete within 1 second
			expect(metrics.memoryUsage).toBeDefined()

			// Clean up
			baselineManager.dispose()
		})

		it("should measure re-initialization overhead", async () => {
			// Arrange - first initialization
			await manager.initialize(mockContextProxy)

			// Act - measure re-initialization time
			const { result, metrics } = await performanceTester.measureOperation("re_initialization", () =>
				manager.initialize(mockContextProxy),
			)

			// Assert
			expect(result.requiresRestart).toBeDefined()
			expect(metrics.duration).toBeLessThan(500) // Re-initialization should be faster
		})
	})

	describe("Task 4.5: Resource Scaling", () => {
		it("should scale performance with varying codebase sizes", async () => {
			// Arrange
			await manager.initialize(mockContextProxy)

			const mockSearchService = {
				searchIndex: vi.fn().mockImplementation(async (query: string) => {
					// Simulate varying response times based on query complexity
					const complexity = query.length
					const delay = Math.min(complexity * 2, 100) // Scale with complexity, max 100ms
					await new Promise((resolve) => setTimeout(resolve, delay))
					return [
						{
							score: 0.9,
							payload: { filePath: "/test/file.ts", startLine: 1, endLine: 10, codeChunk: "test code" },
						},
					]
				}),
			}
			;(manager as any)._searchService = mockSearchService

			// Test with different query complexities
			const testCases = [
				{ query: "simple", expectedMaxLatency: 50 },
				{ query: "medium complexity query with more words", expectedMaxLatency: 100 },
				{
					query: "very complex query with many words and terms that should take longer to process",
					expectedMaxLatency: 150,
				},
			]

			for (const testCase of testCases) {
				// Act
				const latencyMetrics = await performanceTester.measureSearchLatency(manager, testCase.query, 10)

				// Assert
				expect(latencyMetrics.averageLatency).toBeLessThan(testCase.expectedMaxLatency)
				expect(latencyMetrics.p95Latency).toBeLessThan(testCase.expectedMaxLatency * 1.5)
			}
		})
	})

	describe("Performance Regression Tests", () => {
		it("should generate comprehensive performance report", async () => {
			// Arrange
			await manager.initialize(mockContextProxy)

			const mockSearchResults = [
				{
					score: 0.9,
					payload: { filePath: "/test/file.ts", startLine: 1, endLine: 10, codeChunk: "test code" },
				},
			]
			const mockSearchService = {
				searchIndex: vi.fn().mockResolvedValue(mockSearchResults),
			}
			;(manager as any)._searchService = mockSearchService

			// Generate some activity
			for (let i = 0; i < 20; i++) {
				await performanceTester.measureOperation(
					`regression-test-${i}`,
					() => manager.searchIndex(`query-${i}`),
					{ cacheKey: `regression-${i % 5}` },
				)
			}

			// Act
			const report = performanceTester.generateReport()

			// Assert
			expect(report.generatedAt).toBeDefined()
			expect(report.summary.totalOperations).toBeGreaterThan(0)
			expect(report.metrics.operations).toBeDefined()
			expect(report.metrics.alerts).toBeDefined()
			expect(report.metrics.trends).toBeDefined()
			expect(report.recommendations).toBeDefined()
		})

		it("should validate performance against established baselines", async () => {
			// Arrange
			await manager.initialize(mockContextProxy)

			// Set performance baselines
			performanceTester.setBaseline("search_operation", 50) // 50ms baseline
			performanceTester.setBaseline("initialization_time", 200) // 200ms baseline

			// Mock search service
			const mockSearchService = {
				searchIndex: vi.fn().mockImplementation(async () => {
					await new Promise((resolve) => setTimeout(resolve, 60)) // 60ms search time
					return [
						{
							score: 0.9,
							payload: { filePath: "/test/file.ts", startLine: 1, endLine: 10, codeChunk: "test code" },
						},
					]
				}),
			}
			;(manager as any)._searchService = mockSearchService

			// Act - measure current performance
			const searchMetrics = await performanceTester.measureSearchLatency(manager, "baseline test", 10)
			const initMetrics = await performanceTester.measureOperation("initialization", () =>
				manager.initialize(mockContextProxy),
			)

			// Assert - compare against baselines
			const searchComparison = performanceTester.compareAgainstBaseline(
				"search_operation",
				searchMetrics.averageLatency,
			)
			const initComparison = performanceTester.compareAgainstBaseline(
				"initialization_time",
				initMetrics.metrics.duration || 0,
			)

			// Should be within 50% of baseline (more lenient for test environment)
			expect(searchComparison.percentageChange).toBeLessThan(50)
			expect(initComparison.percentageChange).toBeLessThan(50)
		})
	})
})
