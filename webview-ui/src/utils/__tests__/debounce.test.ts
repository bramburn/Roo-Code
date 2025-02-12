import { debounce } from "../debounce"

describe("debounce utility", () => {
	beforeEach(() => {
		jest.useFakeTimers()
	})

	afterEach(() => {
		jest.clearAllTimers()
		jest.useRealTimers()
	})

	describe("basic debouncing behavior", () => {
		it("should delay function execution by specified time", () => {
			const mockFn = jest.fn()
			const delay = 100
			const debouncedFn = debounce(mockFn, delay)

			debouncedFn()
			expect(mockFn).not.toBeCalled()

			jest.advanceTimersByTime(delay - 1)
			expect(mockFn).not.toBeCalled()

			jest.advanceTimersByTime(1)
			expect(mockFn).toBeCalledTimes(1)
		})

		it("should execute function with correct arguments", () => {
			const mockFn = jest.fn()
			const delay = 100
			const debouncedFn = debounce(mockFn, delay)
			const testArg1 = "test"
			const testArg2 = 123

			debouncedFn(testArg1, testArg2)
			jest.advanceTimersByTime(delay)

			expect(mockFn).toBeCalledWith(testArg1, testArg2)
		})
	})

	describe("multiple rapid invocations", () => {
		it("should cancel previous pending execution on subsequent calls", () => {
			const mockFn = jest.fn()
			const delay = 100
			const debouncedFn = debounce(mockFn, delay)

			debouncedFn()
			jest.advanceTimersByTime(50) // Half the delay

			debouncedFn()
			jest.advanceTimersByTime(50) // Complete first delay, but function shouldn't be called

			expect(mockFn).not.toBeCalled()

			jest.advanceTimersByTime(50) // Complete second delay
			expect(mockFn).toBeCalledTimes(1)
		})

		it("should only execute once for multiple rapid calls", () => {
			const mockFn = jest.fn()
			const delay = 100
			const debouncedFn = debounce(mockFn, delay)

			// Simulate rapid calls
			for (let i = 0; i < 5; i++) {
				debouncedFn()
			}

			jest.advanceTimersByTime(delay)
			expect(mockFn).toBeCalledTimes(1)
		})
	})

	describe("arguments handling", () => {
		it("should work with functions taking no arguments", () => {
			const mockFn = jest.fn()
			const delay = 100
			const debouncedFn = debounce(mockFn, delay)

			debouncedFn()
			jest.advanceTimersByTime(delay)

			expect(mockFn).toBeCalledWith()
		})

		it("should work with functions taking multiple arguments", () => {
			const mockFn = jest.fn()
			const delay = 100
			const debouncedFn = debounce(mockFn, delay)
			const args = ["string", 123, { key: "value" }, [1, 2, 3]]

			debouncedFn(...args)
			jest.advanceTimersByTime(delay)

			expect(mockFn).toBeCalledWith(...args)
		})
	})

	describe("timeout management", () => {
		it("should not execute if cleared before delay", () => {
			const mockFn = jest.fn()
			const delay = 100
			const debouncedFn = debounce(mockFn, delay)

			debouncedFn()
			jest.advanceTimersByTime(delay - 1)

			// Call again just before execution
			debouncedFn()
			jest.advanceTimersByTime(delay - 1)
			expect(mockFn).not.toBeCalled()
		})

		it("should handle zero delay", () => {
			const mockFn = jest.fn()
			const debouncedFn = debounce(mockFn, 0)

			debouncedFn()
			jest.advanceTimersByTime(0)

			expect(mockFn).toBeCalledTimes(1)
		})

		it("should handle multiple calls with different arguments", () => {
			const mockFn = jest.fn()
			const delay = 100
			const debouncedFn = debounce(mockFn, delay)

			debouncedFn("first")
			debouncedFn("second")
			debouncedFn("third")

			jest.advanceTimersByTime(delay)
			expect(mockFn).toBeCalledTimes(1)
			expect(mockFn).toBeCalledWith("third")
		})
	})
})
