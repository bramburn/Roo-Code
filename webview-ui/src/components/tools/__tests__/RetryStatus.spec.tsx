import { describe, test, expect, beforeEach, vi } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { RetryStatus } from "../RetryStatus"
import type { RetryStatusProps } from "../RetryStatus"

// Mock framer-motion
vi.mock("framer-motion", () => ({
	motion: {
		div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
		span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
	},
	AnimatePresence: ({ children }: any) => <>{children}</>,
}))

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
	RefreshCw: ({ className }: any) => <div data-testid="refresh-icon" className={className} />,
	AlertCircle: ({ className }: any) => <div data-testid="alert-icon" className={className} />,
	CheckCircle: ({ className }: any) => <div data-testid="check-icon" className={className} />,
	XCircle: ({ className }: any) => <div data-testid="x-icon" className={className} />,
	Clock: ({ className }: any) => <div data-testid="clock-icon" className={className} />,
}))

describe("RetryStatus Component", () => {
	const defaultProps: RetryStatusProps = {
		status: "idle",
		attemptCount: 0,
		maxAttempts: 3,
		lastError: null,
		isRetrying: false,
		onRetry: vi.fn(),
		onCancel: vi.fn(),
	}

	beforeEach(() => {
		vi.clearAllMocks()
	})

	describe("Component Rendering", () => {
		test("should render idle status correctly", () => {
			render(<RetryStatus {...defaultProps} />)

			expect(screen.queryByTestId("retry-status")).not.toBeInTheDocument()
		})

		test("should render retrying status correctly", () => {
			const props: RetryStatusProps = {
				...defaultProps,
				status: "retrying",
				attemptCount: 2,
				maxAttempts: 3,
				isRetrying: true,
			}

			render(<RetryStatus {...props} />)

			expect(screen.getByTestId("retry-status")).toBeInTheDocument()
			expect(screen.getByTestId("refresh-icon")).toBeInTheDocument()
			expect(screen.getByText(/attempt 2 of 3/i)).toBeInTheDocument()
		})

		test("should render success status correctly", () => {
			const props: RetryStatusProps = {
				...defaultProps,
				status: "success",
				attemptCount: 2,
				maxAttempts: 3,
			}

			render(<RetryStatus {...props} />)

			expect(screen.getByTestId("retry-status")).toBeInTheDocument()
			expect(screen.getByTestId("check-icon")).toBeInTheDocument()
			expect(screen.getByText(/succeeded after 2 attempts/i)).toBeInTheDocument()
		})

		test("should render failed status correctly", () => {
			const props: RetryStatusProps = {
				...defaultProps,
				status: "failed",
				attemptCount: 3,
				maxAttempts: 3,
				lastError: new Error("Network timeout"),
			}

			render(<RetryStatus {...props} />)

			expect(screen.getByTestId("retry-status")).toBeInTheDocument()
			expect(screen.getByTestId("x-icon")).toBeInTheDocument()
			expect(screen.getByText(/failed after 3 attempts/i)).toBeInTheDocument()
			expect(screen.getByText("Network timeout")).toBeInTheDocument()
		})

		test("should render circuit breaker open status correctly", () => {
			const props: RetryStatusProps = {
				...defaultProps,
				status: "circuit-breaker-open",
				attemptCount: 5,
				maxAttempts: 3,
			}

			render(<RetryStatus {...props} />)

			expect(screen.getByTestId("retry-status")).toBeInTheDocument()
			expect(screen.getByTestId("alert-icon")).toBeInTheDocument()
			expect(screen.getByText(/circuit breaker is open/i)).toBeInTheDocument()
		})
	})

	describe("User Interactions", () => {
		test("should call onRetry when retry button is clicked", async () => {
			const onRetry = vi.fn()
			const props: RetryStatusProps = {
				...defaultProps,
				status: "failed",
				attemptCount: 2,
				maxAttempts: 3,
				onRetry,
			}

			render(<RetryStatus {...props} />)

			const retryButton = screen.getByRole("button", { name: /retry/i })
			fireEvent.click(retryButton)

			await waitFor(() => {
				expect(onRetry).toHaveBeenCalledTimes(1)
			})
		})

		test("should call onCancel when cancel button is clicked", async () => {
			const onCancel = vi.fn()
			const props: RetryStatusProps = {
				...defaultProps,
				status: "retrying",
				attemptCount: 1,
				maxAttempts: 3,
				isRetrying: true,
				onCancel,
			}

			render(<RetryStatus {...props} />)

			const cancelButton = screen.getByRole("button", { name: /cancel/i })
			fireEvent.click(cancelButton)

			await waitFor(() => {
				expect(onCancel).toHaveBeenCalledTimes(1)
			})
		})

		test("should disable retry button when max attempts reached", () => {
			const props: RetryStatusProps = {
				...defaultProps,
				status: "failed",
				attemptCount: 3,
				maxAttempts: 3,
			}

			render(<RetryStatus {...props} />)

			const retryButton = screen.queryByRole("button", { name: /retry/i })
			expect(retryButton).not.toBeInTheDocument()
		})

		test("should disable buttons during retry", () => {
			const props: RetryStatusProps = {
				...defaultProps,
				status: "retrying",
				attemptCount: 1,
				maxAttempts: 3,
				isRetrying: true,
			}

			render(<RetryStatus {...props} />)

			const retryButton = screen.queryByRole("button", { name: /retry/i })
			const cancelButton = screen.getByRole("button", { name: /cancel/i })

			expect(retryButton).not.toBeInTheDocument()
			expect(cancelButton).not.toBeDisabled()
		})
	})

	describe("Error Display", () => {
		test("should display error message when provided", () => {
			const errorMessage = "Connection refused"
			const props: RetryStatusProps = {
				...defaultProps,
				status: "failed",
				attemptCount: 1,
				maxAttempts: 3,
				lastError: new Error(errorMessage),
			}

			render(<RetryStatus {...props} />)

			expect(screen.getByText(errorMessage)).toBeInTheDocument()
		})

		test("should display truncated error message for long errors", () => {
			const longErrorMessage = "This is a very long error message that should be truncated".repeat(5)
			const props: RetryStatusProps = {
				...defaultProps,
				status: "failed",
				attemptCount: 1,
				maxAttempts: 3,
				lastError: new Error(longErrorMessage),
			}

			render(<RetryStatus {...props} />)

			const errorElement = screen.getByText(/This is a very long error message/)
			expect(errorElement.textContent?.length).toBeLessThan(longErrorMessage.length)
		})

		test("should handle error without message", () => {
			const props: RetryStatusProps = {
				...defaultProps,
				status: "failed",
				attemptCount: 1,
				maxAttempts: 3,
				lastError: new Error(),
			}

			render(<RetryStatus {...props} />)

			expect(screen.getByText(/unknown error/i)).toBeInTheDocument()
		})

		test("should handle null error gracefully", () => {
			const props: RetryStatusProps = {
				...defaultProps,
				status: "failed",
				attemptCount: 1,
				maxAttempts: 3,
				lastError: null,
			}

			render(<RetryStatus {...props} />)

			expect(screen.queryByText(/unknown error/i)).not.toBeInTheDocument()
		})
	})

	describe("Progress Indication", () => {
		test("should show correct progress for retrying status", () => {
			const props: RetryStatusProps = {
				...defaultProps,
				status: "retrying",
				attemptCount: 2,
				maxAttempts: 5,
			}

			render(<RetryStatus {...props} />)

			expect(screen.getByText(/attempt 2 of 5/i)).toBeInTheDocument()
		})

		test("should show progress bar for retrying status", () => {
			const props: RetryStatusProps = {
				...defaultProps,
				status: "retrying",
				attemptCount: 2,
				maxAttempts: 4,
			}

			render(<RetryStatus {...props} />)

			const progressBar = screen.getByRole("progressbar")
			expect(progressBar).toBeInTheDocument()
			expect(progressBar).toHaveAttribute("aria-valuenow", "50") // 2/4 = 50%
		})

		test("should show time remaining for retrying status", () => {
			const props: RetryStatusProps = {
				...defaultProps,
				status: "retrying",
				attemptCount: 1,
				maxAttempts: 3,
				estimatedTimeRemaining: 5000,
			}

			render(<RetryStatus {...props} />)

			expect(screen.getByTestId("clock-icon")).toBeInTheDocument()
			expect(screen.getByText(/5s remaining/i)).toBeInTheDocument()
		})
	})

	describe("Accessibility", () => {
		test("should have proper ARIA labels", () => {
			const props: RetryStatusProps = {
				...defaultProps,
				status: "retrying",
				attemptCount: 1,
				maxAttempts: 3,
			}

			render(<RetryStatus {...props} />)

			const statusElement = screen.getByTestId("retry-status")
			expect(statusElement).toHaveAttribute("role", "status")
			expect(statusElement).toHaveAttribute("aria-live", "polite")
		})

		test("should have proper button labels", () => {
			const props: RetryStatusProps = {
				...defaultProps,
				status: "failed",
				attemptCount: 1,
				maxAttempts: 3,
			}

			render(<RetryStatus {...props} />)

			const retryButton = screen.getByRole("button", { name: /retry operation/i })
			expect(retryButton).toBeInTheDocument()
		})

		test("should announce status changes to screen readers", async () => {
			const { rerender } = render(<RetryStatus {...defaultProps} />)

			const props: RetryStatusProps = {
				...defaultProps,
				status: "retrying",
				attemptCount: 1,
				maxAttempts: 3,
			}

			rerender(<RetryStatus {...props} />)

			const statusElement = screen.getByTestId("retry-status")
			expect(statusElement).toHaveAttribute("aria-live", "polite")
		})
	})

	describe("Visual States", () => {
		test("should apply correct CSS classes for different statuses", () => {
			const testCases = [
				{ status: "retrying", expectedClass: "retrying" },
				{ status: "success", expectedClass: "success" },
				{ status: "failed", expectedClass: "error" },
				{ status: "circuit-breaker-open", expectedClass: "warning" },
			]

			testCases.forEach(({ status, expectedClass }) => {
				const { unmount } = render(<RetryStatus {...defaultProps} status={status as any} />)

				const statusElement = screen.getByTestId("retry-status")
				expect(statusElement).toHaveClass(expectedClass)

				unmount()
			})
		})

		test("should show spinning animation during retry", () => {
			const props: RetryStatusProps = {
				...defaultProps,
				status: "retrying",
				attemptCount: 1,
				maxAttempts: 3,
				isRetrying: true,
			}

			render(<RetryStatus {...props} />)

			const refreshIcon = screen.getByTestId("refresh-icon")
			expect(refreshIcon).toHaveClass("animate-spin")
		})

		test("should show appropriate icons for different statuses", () => {
			const statusIcons = [
				{ status: "retrying", testId: "refresh-icon" },
				{ status: "success", testId: "check-icon" },
				{ status: "failed", testId: "x-icon" },
				{ status: "circuit-breaker-open", testId: "alert-icon" },
			]

			statusIcons.forEach(({ status, testId }) => {
				const { unmount } = render(<RetryStatus {...defaultProps} status={status as any} />)

				expect(screen.getByTestId(testId)).toBeInTheDocument()
				unmount()
			})
		})
	})

	describe("Responsive Design", () => {
		test("should adapt to mobile viewport", () => {
			const props: RetryStatusProps = {
				...defaultProps,
				status: "retrying",
				attemptCount: 1,
				maxAttempts: 3,
			}

			// Mock mobile viewport
			Object.defineProperty(window, "innerWidth", {
				writable: true,
				configurable: true,
				value: 375,
			})

			render(<RetryStatus {...props} />)

			const statusElement = screen.getByTestId("retry-status")
			expect(statusElement).toHaveClass("mobile-layout")
		})

		test("should adapt to desktop viewport", () => {
			const props: RetryStatusProps = {
				...defaultProps,
				status: "retrying",
				attemptCount: 1,
				maxAttempts: 3,
			}

			// Mock desktop viewport
			Object.defineProperty(window, "innerWidth", {
				writable: true,
				configurable: true,
				value: 1024,
			})

			render(<RetryStatus {...props} />)

			const statusElement = screen.getByTestId("retry-status")
			expect(statusElement).toHaveClass("desktop-layout")
		})
	})

	describe("Edge Cases", () => {
		test("should handle zero max attempts", () => {
			const props: RetryStatusProps = {
				...defaultProps,
				status: "failed",
				attemptCount: 0,
				maxAttempts: 0,
			}

			render(<RetryStatus {...props} />)

			expect(screen.getByText(/no retries available/i)).toBeInTheDocument()
		})

		test("should handle negative attempt count", () => {
			const props: RetryStatusProps = {
				...defaultProps,
				status: "retrying",
				attemptCount: -1,
				maxAttempts: 3,
			}

			render(<RetryStatus {...props} />)

			expect(screen.getByText(/attempt 1 of 3/i)).toBeInTheDocument() // Should normalize to 1
		})

		test("should handle attempt count greater than max attempts", () => {
			const props: RetryStatusProps = {
				...defaultProps,
				status: "retrying",
				attemptCount: 5,
				maxAttempts: 3,
			}

			render(<RetryStatus {...props} />)

			expect(screen.getByText(/attempt 5 of 3/i)).toBeInTheDocument()
		})

		test("should handle missing callbacks gracefully", () => {
			const props: RetryStatusProps = {
				...defaultProps,
				status: "failed",
				attemptCount: 1,
				maxAttempts: 3,
				onRetry: undefined as any,
				onCancel: undefined as any,
			}

			render(<RetryStatus {...props} />)

			// Should not throw error when callbacks are missing
			expect(screen.getByTestId("retry-status")).toBeInTheDocument()
		})
	})
})
