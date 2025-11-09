import { describe, test, expect, beforeEach, afterEach } from "vitest"
import { render as _render, screen, renderWithAsyncCleanup } from "@/utils/test-utils"
import React, { useState as _useState, useEffect as _useEffect } from "react"
import {
	getCleanupManager,
	createTrackedTimeout,
	createTrackedInterval,
	checkCleanupState,
	withAsyncCleanup,
} from "@/utils/async-cleanup-utils"

describe("Async Cleanup Utilities", () => {
	beforeEach(() => {
		// Reset cleanup manager before each test
		const cleanupManager = getCleanupManager()
		cleanupManager.getStats()
	})

	afterEach(async () => {
		// Comprehensive cleanup after each test
		const cleanupManager = getCleanupManager()
		await cleanupManager.cleanup()
	})

	test("should track and cleanup timeouts", async () => {
		const cleanupManager = getCleanupManager()

		// Create a tracked timeout
		const timeoutId = createTrackedTimeout(
			() => {
				// This should be called
			},
			100,
			"test-timeout",
		)

		expect(timeoutId).toBeDefined()

		// Check initial state
		let stats = checkCleanupState()
		expect(stats.operations.timeouts).toBeGreaterThan(0)

		// Wait for timeout to complete
		await new Promise((resolve) => setTimeout(resolve, 150))

		// Cleanup should handle the timeout properly
		await cleanupManager.cleanup()

		// Check final state
		stats = checkCleanupState()
		expect(stats.operations.timeouts).toBe(0)
	})

	test("should track and cleanup intervals", async () => {
		const cleanupManager = getCleanupManager()
		let counter = 0

		// Create a tracked interval
		const intervalId = createTrackedInterval(
			() => {
				counter++
			},
			50,
			"test-interval",
		)

		expect(intervalId).toBeDefined()

		// Check initial state
		let stats = checkCleanupState()
		expect(stats.operations.intervals).toBeGreaterThan(0)

		// Wait for a few intervals
		await new Promise((resolve) => setTimeout(resolve, 120))
		expect(counter).toBeGreaterThan(1)

		// Cleanup should clear the interval
		await cleanupManager.cleanup()

		// Check final state
		stats = checkCleanupState()
		expect(stats.operations.intervals).toBe(0)
	})

	test("should handle React component cleanup", async () => {
		// Create a simple component without hooks to avoid React issues
		const TestComponent = () => {
			return <div data-testid="test-component">Test Component</div>
		}

		// Use basic render without providers to avoid issues
		const { unmount: _unmount, asyncCleanup } = renderWithAsyncCleanup(<TestComponent />, {
			translationProvider: false,
		})

		// Component should render
		expect(screen.getByTestId("test-component")).toBeInTheDocument()

		// Cleanup should handle React operations properly
		await asyncCleanup()

		// Component should be unmounted
		expect(screen.queryByTestId("test-component")).not.toBeInTheDocument()
	})

	test("should prevent memory leaks with withAsyncCleanup", async () => {
		let cleanupCalled = false

		await withAsyncCleanup(async () => {
			// Create some async operations
			createTrackedTimeout(
				() => {
					cleanupCalled = true
				},
				50,
				"cleanup-test",
			)

			// Wait for operation
			await new Promise((resolve) => setTimeout(resolve, 100))
		})

		// Cleanup should have been called automatically
		expect(cleanupCalled).toBe(true)

		// No operations should remain
		const stats = checkCleanupState()
		expect(stats.operations.timeouts).toBe(0)
		expect(stats.operations.intervals).toBe(0)
	})

	test("should handle cleanup errors gracefully", async () => {
		const cleanupManager = getCleanupManager()

		// Create a timeout that throws
		const _timeoutId = createTrackedTimeout(
			() => {
				throw new Error("Test error")
			},
			50,
			"error-timeout",
		)

		// Wait for timeout to fire
		await new Promise((resolve) => setTimeout(resolve, 100))

		// Cleanup should handle errors without throwing
		const cleanupPromise = cleanupManager.cleanup()
		await expect(cleanupPromise).resolves.toBeUndefined()

		// State should still be clean
		const stats = checkCleanupState()
		expect(stats.operations.timeouts).toBe(0)
	})

	test("should provide cleanup statistics", () => {
		const cleanupManager = getCleanupManager()

		// Create some operations
		createTrackedTimeout(() => {}, 1000, "stats-timeout-1")
		createTrackedTimeout(() => {}, 1000, "stats-timeout-2")
		createTrackedInterval(() => {}, 1000, "stats-interval")

		// Check statistics
		const stats = cleanupManager.getStats()

		expect(stats.operations.timeouts).toBe(2)
		expect(stats.operations.intervals).toBe(1)
		expect(stats.react.pendingTransitions).toBe(0)
		expect(stats.react.suspensePromises).toBe(0)
		expect(stats.vscode.messageListeners).toBe(0)
		expect(stats.vscode.stateWatchers).toBe(0)
	})
})
