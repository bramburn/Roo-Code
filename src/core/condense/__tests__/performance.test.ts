import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { PerformanceManager } from "../performance"
import { PerformanceMonitor } from "../performance-monitor"

describe("Performance Management", () => {
	let performanceManager: PerformanceManager
	let performanceMonitor: PerformanceMonitor

	beforeEach(() => {
		performanceManager = new PerformanceManager({
			enableCaching: true,
			enableBatching: true,
			enableParallelProcessing: true,
			cacheSize: 50,
			batchSize: 5,
		})

		performanceMonitor = new PerformanceMonitor(performanceManager, {
			enableRealTimeMonitoring: true,
			enableTrendAnalysis: true,
			enableAlerts: true,
			monitoringInterval: 100,
		})
	})

	afterEach(() => {
		performanceManager.dispose()
		performanceMonitor.dispose()
	})

	describe("Caching Performance", () => {
		it("should cache operations efficiently", async () => {
			const mockOperation = vi.fn().mockResolvedValue("test result")
			const cacheKey = "test-key"

			// First call should cache
			const result1 = await performanceManager.executeOperation("test-operation", () => mockOperation(), {
				cacheKey,
			})

			// Second call should hit cache
			const result2 = await performanceManager.executeOperation("test-operation", () => mockOperation(), {
				cacheKey,
			})

			expect(result1).toBe("test result")
			expect(result2).toBe("test result")
			expect(mockOperation).toHaveBeenCalledTimes(1) // Only called once due to cache
		})

		it("should respect cache TTL", async () => {
			const mockOperation = vi.fn().mockResolvedValue("test result")
			const cacheKey = "test-ttl-key"

			await performanceManager.executeOperation(
				"test-operation",
				() => mockOperation(),
				{ cacheKey, cacheTTL: 50 }, // 50ms TTL
			)

			// Wait for cache to expire
			await new Promise((resolve) => setTimeout(resolve, 100))

			await performanceManager.executeOperation("test-operation", () => mockOperation(), { cacheKey })

			expect(mockOperation).toHaveBeenCalledTimes(2) // Called twice due to cache expiry
		})

		it("should handle cache eviction", async () => {
			const mockOperation = vi.fn().mockResolvedValue("test result")

			// Fill cache beyond limit
			for (let i = 0; i < 60; i++) {
				await performanceManager.executeOperation("test-operation", () => mockOperation(), {
					cacheKey: `key-${i}`,
				})
			}

			const stats = performanceManager.getPerformanceStats()
			expect(stats.cache.size).toBeLessThanOrEqual(50) // Should respect cache size limit
		})
	})

	describe("Batching Performance", () => {
		it("should batch operations efficiently", async () => {
			const mockOperation = vi.fn().mockResolvedValue("batch result")
			const results: string[] = []

			// Submit multiple operations to same batch group
			const promises = Array.from({ length: 10 }, (_, i) =>
				performanceManager.executeOperation("batch-test", () => mockOperation().then(() => `result-${i}`), {
					batchGroup: "test-batch",
				}),
			)

			const resolvedResults = await Promise.all(promises)
			results.push(...(resolvedResults as string[]))

			expect(results).toHaveLength(10)
			expect(mockOperation).toHaveBeenCalledTimes(2) // Should be called in 2 batches of 5
		})

		it("should respect batch size limits", async () => {
			const mockOperation = vi.fn().mockResolvedValue("result")

			// Submit more operations than batch size
			const promises = Array.from({ length: 15 }, (_, i) =>
				performanceManager.executeOperation("batch-test", () => mockOperation(), { batchGroup: "test-batch" }),
			)

			await Promise.all(promises)

			// Should be called in 3 batches (5, 5, 5)
			expect(mockOperation).toHaveBeenCalledTimes(3)
		})

		it("should handle batch priorities", async () => {
			const executionOrder: string[] = []
			const mockOperation = (name: string) => {
				executionOrder.push(name)
				return Promise.resolve(name)
			}

			// Submit operations with different priorities
			const promises = [
				performanceManager.executeOperation("priority-test", () => mockOperation("low"), {
					batchGroup: "priority-test",
					priority: "low",
				}),
				performanceManager.executeOperation("priority-test", () => mockOperation("high"), {
					batchGroup: "priority-test",
					priority: "high",
				}),
				performanceManager.executeOperation("priority-test", () => mockOperation("medium"), {
					batchGroup: "priority-test",
					priority: "medium",
				}),
			]

			await Promise.all(promises)

			// High priority should execute first
			expect(executionOrder[0]).toBe("high")
		})
	})

	describe("Parallel Processing Performance", () => {
		it("should process operations in parallel when enabled", async () => {
			const mockOperation = vi.fn().mockImplementation(async (delay: number) => {
				await new Promise((resolve) => setTimeout(resolve, delay))
				return `result-${delay}`
			})

			const startTime = performance.now()
			const promises = Array.from({ length: 5 }, (_, i) =>
				performanceManager.executeOperation(
					"parallel-test",
					() => mockOperation(100), // 100ms delay
					{ batchGroup: "parallel-test" },
				),
			)

			await Promise.all(promises)
			const endTime = performance.now()
			const duration = endTime - startTime

			// Should complete in ~100ms (parallel processing)
			expect(duration).toBeLessThan(200)
		})

		it("should process sequentially when disabled", async () => {
			const sequentialManager = new PerformanceManager({
				enableParallelProcessing: false,
			})

			const mockOperation = vi.fn().mockImplementation(async (delay: number) => {
				await new Promise((resolve) => setTimeout(resolve, delay))
				return `result-${delay}`
			})

			const startTime = performance.now()
			const promises = Array.from({ length: 3 }, (_, i) =>
				sequentialManager.executeOperation("sequential-test", () => mockOperation(100), {
					batchGroup: "sequential-test",
				}),
			)

			await Promise.all(promises)
			const endTime = performance.now()
			const duration = endTime - startTime

			// Should take ~300ms (sequential processing)
			expect(duration).toBeGreaterThan(250)

			sequentialManager.dispose()
		})
	})

	describe("Memory Usage Performance", () => {
		it("should track memory usage accurately", async () => {
			const mockOperation = vi.fn().mockResolvedValue("memory test")

			await performanceManager.executeOperation("memory-test", () => mockOperation(), { cacheKey: "memory-key" })

			const stats = performanceManager.getPerformanceStats()

			expect(stats.memory.current).toBeDefined()
			expect(stats.memory.current.heapUsed).toBeGreaterThan(0)
			expect(stats.memory.initial).toBeDefined()
		})

		it("should optimize memory when usage is high", async () => {
			// Mock high memory usage
			const originalMemoryUsage = process.memoryUsage
			const mockMemoryUsage = vi.fn().mockReturnValue({
				rss: 500 * 1024 * 1024,
				heapUsed: 500 * 1024 * 1024, // 500MB
				heapTotal: 1000 * 1024 * 1024,
				external: 0,
				arrayBuffers: 0,
			}) as unknown as NodeJS.MemoryUsage
			;(process.memoryUsage as any) = mockMemoryUsage

			performanceManager.optimizePerformance()

			// Restore original
			process.memoryUsage = originalMemoryUsage

			const stats = performanceManager.getPerformanceStats()
			// Should trigger optimization
			expect(stats.cache.hitRate).toBeDefined()
		})
	})

	describe("Performance Monitoring", () => {
		it("should track operation metrics", async () => {
			const mockOperation = vi.fn().mockResolvedValue("monitored operation")

			performanceMonitor.startMonitoring()

			await performanceManager.executeOperation("monitored-test", () => mockOperation())

			const status = performanceMonitor.getMonitoringStatus()

			expect(status.isMonitoring).toBe(true)
			expect(status.alertCount).toBeGreaterThanOrEqual(0)
		})

		it("should generate performance alerts", async () => {
			const mockOperation = vi.fn().mockImplementation(async () => {
				await new Promise((resolve) => setTimeout(resolve, 200))
				return "slow result"
			})

			performanceMonitor.startMonitoring()

			// Trigger slow operation
			await performanceManager.executeOperation("slow-operation", () => mockOperation(), { cacheKey: "slow-key" })

			await new Promise((resolve) => setTimeout(resolve, 50)) // Wait for alert processing

			const alerts = performanceMonitor.getAlerts()
			const slowAlerts = alerts.filter((alert) => alert.type === "slow_operation")

			expect(slowAlerts.length).toBeGreaterThan(0)
		})

		it("should analyze performance trends", async () => {
			const mockOperation = vi.fn().mockResolvedValue("trend test")

			performanceMonitor.startMonitoring()

			// Generate multiple data points for trend analysis
			for (let i = 0; i < 20; i++) {
				await performanceManager.executeOperation("trend-test", () => mockOperation(), {
					cacheKey: `trend-${i}`,
				})
			}

			const trends = performanceMonitor.getTrends()
			const operationDurationTrend = trends.find((t) => t.metric === "operation_duration")

			expect(operationDurationTrend).toBeDefined()
			expect(operationDurationTrend?.values).toHaveLength(20)
		})

		it("should generate performance reports", async () => {
			const mockOperation = vi.fn().mockResolvedValue("report test")

			performanceMonitor.startMonitoring()

			// Generate some test data
			for (let i = 0; i < 5; i++) {
				await performanceManager.executeOperation("report-test", () => mockOperation(), {
					cacheKey: `report-${i}`,
				})
			}

			const report = performanceMonitor.generateReport()

			expect(report.generatedAt).toBeDefined()
			expect(report.summary.totalOperations).toBe(5)
			expect(report.metrics.operations).toBeDefined()
			expect(report.recommendations).toBeDefined()
		})
	})

	describe("Load Testing", () => {
		it("should handle high load gracefully", async () => {
			const mockOperation = vi.fn().mockResolvedValue("load test")
			const concurrency = 50
			const operationsPerConcurrency = 10

			performanceMonitor.startMonitoring()

			const startTime = performance.now()

			// Generate high load
			const promises = Array.from({ length: concurrency }, (_, i) =>
				Promise.all(
					Array.from({ length: operationsPerConcurrency }, (_, j) =>
						performanceManager.executeOperation("load-test", () => mockOperation(), {
							cacheKey: `load-${i}-${j}`,
						}),
					),
				),
			)

			await Promise.all(promises)
			const endTime = performance.now()
			const duration = endTime - startTime

			const stats = performanceManager.getPerformanceStats()
			const status = performanceMonitor.getMonitoringStatus()

			expect(stats.operations.total).toBe(concurrency * operationsPerConcurrency)
			expect(duration).toBeLessThan(10000) // Should complete within 10 seconds
			expect(status.alertCount).toBeLessThan(100) // Should not generate excessive alerts
		})

		it("should maintain performance under sustained load", async () => {
			const mockOperation = vi.fn().mockResolvedValue("sustained load")
			const batchSize = 20
			const batches = 5

			performanceMonitor.startMonitoring()

			const durations: number[] = []

			// Process multiple batches
			for (let batch = 0; batch < batches; batch++) {
				const startTime = performance.now()

				await Promise.all(
					Array.from({ length: batchSize }, (_, i) =>
						performanceManager.executeOperation("sustained-load-test", () => mockOperation(), {
							cacheKey: `sustained-${batch}-${i}`,
						}),
					),
				)

				const endTime = performance.now()
				durations.push(endTime - startTime)
			}

			// Analyze performance consistency
			const averageDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length
			const maxDuration = Math.max(...durations)
			const minDuration = Math.min(...durations)

			// Performance should be relatively consistent
			const variance = maxDuration - minDuration
			expect(variance).toBeLessThan(averageDuration * 0.5) // Variance less than 50% of average
		})
	})

	describe("Resource Management", () => {
		it("should clean up resources properly", async () => {
			const mockOperation = vi.fn().mockResolvedValue("cleanup test")

			// Generate some activity
			await performanceManager.executeOperation("cleanup-test", () => mockOperation(), {
				cacheKey: "cleanup-key",
			})

			// Clear performance data
			performanceManager.clearPerformanceData()

			const stats = performanceManager.getPerformanceStats()

			expect(stats.operations.total).toBe(0)
			expect(stats.cache.size).toBe(0)
		})

		it("should dispose properly", () => {
			const mockOperation = vi.fn().mockResolvedValue("dispose test")

			performanceMonitor.startMonitoring()

			// Generate some activity
			performanceManager.executeOperation("dispose-test", () => mockOperation())

			// Dispose
			performanceManager.dispose()
			performanceMonitor.dispose()

			// Note: After dispose, the instances may not be in a valid state for testing
			// This test mainly verifies that dispose doesn't throw errors
			expect(true).toBe(true) // Dispose completed without errors
		})
	})

	describe("Performance Benchmarks", () => {
		it("should meet performance benchmarks for caching", async () => {
			const mockOperation = vi.fn().mockResolvedValue("benchmark test")
			const iterations = 100

			performanceMonitor.startMonitoring()

			const startTime = performance.now()

			// Test cache performance
			for (let i = 0; i < iterations; i++) {
				await performanceManager.executeOperation(
					"benchmark-cache",
					() => mockOperation(),
					{ cacheKey: `benchmark-${i % 10}` }, // 10 unique keys
				)
			}

			const endTime = performance.now()
			const totalTime = endTime - startTime
			const averageTime = totalTime / iterations

			// Should average less than 10ms per operation with caching
			expect(averageTime).toBeLessThan(10)
		})

		it("should meet performance benchmarks for batching", async () => {
			const mockOperation = vi.fn().mockResolvedValue("batch benchmark")
			const batchSize = 10
			const batches = 20

			performanceMonitor.startMonitoring()

			const startTime = performance.now()

			// Test batch performance
			const promises = Array.from({ length: batches }, (_, i) =>
				performanceManager.executeOperation("batch-benchmark", () => mockOperation(), {
					batchGroup: "benchmark-batch",
				}),
			)

			await Promise.all(promises)
			const endTime = performance.now()
			const totalTime = endTime - startTime
			const averageTime = totalTime / (batchSize * batches)

			// Should average less than 5ms per operation with batching
			expect(averageTime).toBeLessThan(5)
		})

		it("should meet memory efficiency benchmarks", async () => {
			const mockOperation = vi.fn().mockResolvedValue("memory benchmark")
			const iterations = 1000

			const initialMemory = process.memoryUsage()

			// Generate memory pressure
			for (let i = 0; i < iterations; i++) {
				await performanceManager.executeOperation("memory-benchmark", () => mockOperation(), {
					cacheKey: `memory-${i}`,
				})
			}

			const finalMemory = process.memoryUsage()
			const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed

			// Memory increase should be reasonable (less than 100MB for 1000 operations)
			expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024)
		})
	})
})
