import { describe, test, expect, beforeEach, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
// import { fireEvent } from "@testing-library/react" // eslint-disable-line @typescript-eslint/no-unused-vars
import userEvent from "@testing-library/user-event"
import { ErrorRecovery } from "../ErrorRecovery"
import type { ErrorRecoveryProps } from "../ErrorRecovery"

// Mock framer-motion
vi.mock("framer-motion", () => ({
	motion: {
		div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
		button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
	},
	AnimatePresence: ({ children }: any) => <>{children}</>,
}))

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
	AlertTriangle: ({ className }: any) => <div data-testid="alert-icon" className={className} />,
	RefreshCw: ({ className }: any) => <div data-testid="refresh-icon" className={className} />,
	SkipForward: ({ className }: any) => <div data-testid="skip-icon" className={className} />,
	Info: ({ className }: any) => <div data-testid="info-icon" className={className} />,
	ChevronDown: ({ className }: any) => <div data-testid="chevron-icon" className={className} />,
	CheckCircle: ({ className }: any) => <div data-testid="check-icon" className={className} />,
	XCircle: ({ className }: any) => <div data-testid="x-icon" className={className} />,
}))

describe("ErrorRecovery Component", () => {
	const defaultProps: ErrorRecoveryProps = {
		isOpen: true,
		error: new Error("Test error message"),
		errorType: "network",
		onRetry: vi.fn(),
		onSkip: vi.fn(),
		onCancel: vi.fn(),
		onDismiss: vi.fn(),
		retryCount: 1,
		maxRetries: 3,
		estimatedTimeRemaining: 5000,
	}

	beforeEach(() => {
		vi.clearAllMocks()
	})

	describe("Component Rendering", () => {
		test("should render error recovery modal when open", () => {
			render(<ErrorRecovery {...defaultProps} />)

			expect(screen.getByTestId("error-recovery-modal")).toBeInTheDocument()
			expect(screen.getByTestId("alert-icon")).toBeInTheDocument()
			expect(screen.getByText(/test error message/i)).toBeInTheDocument()
		})

		test("should not render when closed", () => {
			const props: ErrorRecoveryProps = {
				...defaultProps,
				isOpen: false,
			}

			render(<ErrorRecovery {...props} />)

			expect(screen.queryByTestId("error-recovery-modal")).not.toBeInTheDocument()
		})

		test("should render error type specific content", () => {
			const testCases = [
				{ errorType: "network", expectedText: /network error/i },
				{ errorType: "timeout", expectedText: /timeout error/i },
				{ errorType: "auth", expectedText: /authentication error/i },
				{ errorType: "permission", expectedText: /permission error/i },
				{ errorType: "resource", expectedText: /resource error/i },
				{ errorType: "rate-limit", expectedText: /rate limit error/i },
				{ errorType: "context", expectedText: /context error/i },
			]

			testCases.forEach(({ errorType, expectedText }) => {
				const { unmount } = render(<ErrorRecovery {...defaultProps} errorType={errorType as any} />)

				expect(screen.getByText(expectedText)).toBeInTheDocument()
				unmount()
			})
		})

		test("should render retry information", () => {
			const props: ErrorRecoveryProps = {
				...defaultProps,
				retryCount: 2,
				maxRetries: 5,
			}

			render(<ErrorRecovery {...props} />)

			expect(screen.getByText(/retry 2 of 5/i)).toBeInTheDocument()
			expect(screen.getByTestId("refresh-icon")).toBeInTheDocument()
		})

		test("should render estimated time remaining", () => {
			const props: ErrorRecoveryProps = {
				...defaultProps,
				estimatedTimeRemaining: 15000,
			}

			render(<ErrorRecovery {...props} />)

			expect(screen.getByText(/15s remaining/i)).toBeInTheDocument()
		})

		test("should render action buttons", () => {
			render(<ErrorRecovery {...defaultProps} />)

			expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument()
			expect(screen.getByRole("button", { name: /skip/i })).toBeInTheDocument()
			expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument()
		})
	})

	describe("Error Type Specific Actions", () => {
		test("should show context optimization option for context errors", () => {
			const props: ErrorRecoveryProps = {
				...defaultProps,
				errorType: "context",
			}

			render(<ErrorRecovery {...props} />)

			expect(screen.getByText(/optimize context/i)).toBeInTheDocument()
			expect(screen.getByRole("button", { name: /optimize and retry/i })).toBeInTheDocument()
		})

		test("should show authentication option for auth errors", () => {
			const props: ErrorRecoveryProps = {
				...defaultProps,
				errorType: "auth",
			}

			render(<ErrorRecovery {...props} />)

			expect(screen.getByText(/re-authenticate/i)).toBeInTheDocument()
			expect(screen.getByRole("button", { name: /re-authenticate/i })).toBeInTheDocument()
		})

		test("should show wait option for rate limit errors", () => {
			const props: ErrorRecoveryProps = {
				...defaultProps,
				errorType: "rate-limit",
			}

			render(<ErrorRecovery {...props} />)

			expect(screen.getByText(/wait and retry/i)).toBeInTheDocument()
			expect(screen.getByRole("button", { name: /wait and retry/i })).toBeInTheDocument()
		})

		test("should show different options for non-retryable errors", () => {
			const props: ErrorRecoveryProps = {
				...defaultProps,
				errorType: "permission",
			}

			render(<ErrorRecovery {...props} />)

			// Should not show retry button for permission errors
			expect(screen.queryByRole("button", { name: /retry/i })).not.toBeInTheDocument()
			expect(screen.getByRole("button", { name: /skip/i })).toBeInTheDocument()
			expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument()
		})
	})

	describe("User Interactions", () => {
		test("should call onRetry when retry button is clicked", async () => {
			const user = userEvent.setup()
			const onRetry = vi.fn()

			const props: ErrorRecoveryProps = {
				...defaultProps,
				onRetry,
			}

			render(<ErrorRecovery {...props} />)

			const retryButton = screen.getByRole("button", { name: /retry/i })
			await user.click(retryButton)

			await waitFor(() => {
				expect(onRetry).toHaveBeenCalledTimes(1)
			})
		})

		test("should call onSkip when skip button is clicked", async () => {
			const user = userEvent.setup()
			const onSkip = vi.fn()

			const props: ErrorRecoveryProps = {
				...defaultProps,
				onSkip,
			}

			render(<ErrorRecovery {...props} />)

			const skipButton = screen.getByRole("button", { name: /skip/i })
			await user.click(skipButton)

			await waitFor(() => {
				expect(onSkip).toHaveBeenCalledTimes(1)
			})
		})

		test("should call onCancel when cancel button is clicked", async () => {
			const user = userEvent.setup()
			const onCancel = vi.fn()

			const props: ErrorRecoveryProps = {
				...defaultProps,
				onCancel,
			}

			render(<ErrorRecovery {...props} />)

			const cancelButton = screen.getByRole("button", { name: /cancel/i })
			await user.click(cancelButton)

			await waitFor(() => {
				expect(onCancel).toHaveBeenCalledTimes(1)
			})
		})

		test("should call onDismiss when dismiss button is clicked", async () => {
			const user = userEvent.setup()
			const onDismiss = vi.fn()

			const props: ErrorRecoveryProps = {
				...defaultProps,
				onDismiss,
			}

			render(<ErrorRecovery {...props} />)

			const dismissButton = screen.getByRole("button", { name: /dismiss/i })
			await user.click(dismissButton)

			await waitFor(() => {
				expect(onDismiss).toHaveBeenCalledTimes(1)
			})
		})

		test("should call onOptimize when optimize button is clicked", async () => {
			const user = userEvent.setup()
			const onRetry = vi.fn()

			const props: ErrorRecoveryProps = {
				...defaultProps,
				errorType: "context",
				onRetry,
			}

			render(<ErrorRecovery {...props} />)

			const optimizeButton = screen.getByRole("button", { name: /optimize and retry/i })
			await user.click(optimizeButton)

			await waitFor(() => {
				expect(onRetry).toHaveBeenCalledWith({ optimizeContext: true })
			})
		})

		test("should call onReauthenticate when re-auth button is clicked", async () => {
			const user = userEvent.setup()
			const onRetry = vi.fn()

			const props: ErrorRecoveryProps = {
				...defaultProps,
				errorType: "auth",
				onRetry,
			}

			render(<ErrorRecovery {...props} />)

			const reauthButton = screen.getByRole("button", { name: /re-authenticate/i })
			await user.click(reauthButton)

			await waitFor(() => {
				expect(onRetry).toHaveBeenCalledWith({ reauthenticate: true })
			})
		})
	})

	describe("Error Details", () => {
		test("should show error details when expanded", async () => {
			const user = userEvent.setup()
			const error = new Error("Detailed error message")
			error.stack = "Error stack trace"

			const props: ErrorRecoveryProps = {
				...defaultProps,
				error,
			}

			render(<ErrorRecovery {...props} />)

			const expandButton = screen.getByRole("button", { name: /show details/i })
			await user.click(expandButton)

			await waitFor(() => {
				expect(screen.getByText(/detailed error message/i)).toBeInTheDocument()
				expect(screen.getByText(/error stack trace/i)).toBeInTheDocument()
			})
		})

		test("should hide error details when collapsed", async () => {
			const user = userEvent.setup()
			const error = new Error("Detailed error message")
			error.stack = "Error stack trace"

			const props: ErrorRecoveryProps = {
				...defaultProps,
				error,
			}

			render(<ErrorRecovery {...props} />)

			// Initially collapsed
			expect(screen.queryByText(/detailed error message/i)).not.toBeInTheDocument()

			const expandButton = screen.getByRole("button", { name: /show details/i })
			await user.click(expandButton)

			// Expanded
			await waitFor(() => {
				expect(screen.getByText(/detailed error message/i)).toBeInTheDocument()
			})

			const collapseButton = screen.getByRole("button", { name: /hide details/i })
			await user.click(collapseButton)

			// Collapsed again
			await waitFor(() => {
				expect(screen.queryByText(/detailed error message/i)).not.toBeInTheDocument()
			})
		})

		test("should handle errors without stack trace", async () => {
			const user = userEvent.setup()
			const error = new Error("Simple error message")

			const props: ErrorRecoveryProps = {
				...defaultProps,
				error,
			}

			render(<ErrorRecovery {...props} />)

			const expandButton = screen.getByRole("button", { name: /show details/i })
			await user.click(expandButton)

			await waitFor(() => {
				expect(screen.getByText(/simple error message/i)).toBeInTheDocument()
				expect(screen.queryByText(/stack trace/i)).not.toBeInTheDocument()
			})
		})
	})

	describe("Retry Progress", () => {
		test("should show progress bar for retry attempts", () => {
			const props: ErrorRecoveryProps = {
				...defaultProps,
				retryCount: 2,
				maxRetries: 5,
			}

			render(<ErrorRecovery {...props} />)

			const progressBar = screen.getByRole("progressbar")
			expect(progressBar).toBeInTheDocument()
			expect(progressBar).toHaveAttribute("aria-valuenow", "40") // 2/5 = 40%
		})

		test("should show countdown timer for estimated time", () => {
			const props: ErrorRecoveryProps = {
				...defaultProps,
				estimatedTimeRemaining: 10000,
			}

			render(<ErrorRecovery {...props} />)

			expect(screen.getByText(/10s remaining/i)).toBeInTheDocument()
		})

		test("should disable retry button at max attempts", () => {
			const props: ErrorRecoveryProps = {
				...defaultProps,
				retryCount: 3,
				maxRetries: 3,
			}

			render(<ErrorRecovery {...props} />)

			const retryButton = screen.queryByRole("button", { name: /retry/i })
			expect(retryButton).not.toBeInTheDocument()
		})
	})

	describe("Suggestions and Help", () => {
		test("should show suggestions for network errors", () => {
			const props: ErrorRecoveryProps = {
				...defaultProps,
				errorType: "network",
			}

			render(<ErrorRecovery {...props} />)

			expect(screen.getByText(/check your internet connection/i)).toBeInTheDocument()
			expect(screen.getByText(/try again in a few moments/i)).toBeInTheDocument()
		})

		test("should show suggestions for timeout errors", () => {
			const props: ErrorRecoveryProps = {
				...defaultProps,
				errorType: "timeout",
			}

			render(<ErrorRecovery {...props} />)

			expect(screen.getByText(/the operation took too long/i)).toBeInTheDocument()
			expect(screen.getByText(/try with a smaller request/i)).toBeInTheDocument()
		})

		test("should show suggestions for context errors", () => {
			const props: ErrorRecoveryProps = {
				...defaultProps,
				errorType: "context",
			}

			render(<ErrorRecovery {...props} />)

			expect(screen.getByText(/context window is too large/i)).toBeInTheDocument()
			expect(screen.getByText(/optimize context to continue/i)).toBeInTheDocument()
		})

		test("should show help tooltip", async () => {
			const user = userEvent.setup()
			render(<ErrorRecovery {...defaultProps} />)

			const helpIcon = screen.getByTestId("info-icon")
			await user.click(helpIcon)

			await waitFor(() => {
				expect(screen.getByText(/need help\?/i)).toBeInTheDocument()
			})
		})
	})

	describe("Accessibility", () => {
		test("should have proper ARIA labels", () => {
			render(<ErrorRecovery {...defaultProps} />)

			const modal = screen.getByRole("dialog")
			expect(modal).toHaveAttribute("aria-modal", "true")
			expect(modal).toHaveAttribute("aria-labelledby", expect.stringContaining("error-recovery-title"))
		})

		test("should announce error type to screen readers", () => {
			const props: ErrorRecoveryProps = {
				...defaultProps,
				errorType: "network",
			}

			render(<ErrorRecovery {...props} />)

			const alertElement = screen.getByRole("alert")
			expect(alertElement).toBeInTheDocument()
			expect(alertElement).toHaveTextContent(/network error/i)
		})

		test("should support keyboard navigation", async () => {
			const user = userEvent.setup()
			render(<ErrorRecovery {...defaultProps} />)

			// Tab through buttons
			await user.tab()
			expect(screen.getByRole("button", { name: /retry/i })).toHaveFocus()

			await user.tab()
			expect(screen.getByRole("button", { name: /skip/i })).toHaveFocus()

			await user.tab()
			expect(screen.getByRole("button", { name: /cancel/i })).toHaveFocus()
		})

		test("should trap focus within modal", async () => {
			const user = userEvent.setup()
			render(<ErrorRecovery {...defaultProps} />)

			// Tab to last button
			await user.tab()
			await user.tab()
			await user.tab()

			// Next tab should go back to first button
			await user.tab()
			expect(screen.getByRole("button", { name: /retry/i })).toHaveFocus()
		})
	})

	describe("Visual States", () => {
		test("should apply error type specific styling", () => {
			const testCases = [
				{ errorType: "network", expectedClass: "network-error" },
				{ errorType: "timeout", expectedClass: "timeout-error" },
				{ errorType: "auth", expectedClass: "auth-error" },
				{ errorType: "permission", expectedClass: "permission-error" },
				{ errorType: "resource", expectedClass: "resource-error" },
				{ errorType: "rate-limit", expectedClass: "rate-limit-error" },
				{ errorType: "context", expectedClass: "context-error" },
			]

			testCases.forEach(({ errorType, expectedClass }) => {
				const { unmount } = render(<ErrorRecovery {...defaultProps} errorType={errorType as any} />)

				const modal = screen.getByTestId("error-recovery-modal")
				expect(modal).toHaveClass(expectedClass)

				unmount()
			})
		})

		test("should show loading state during retry", () => {
			const props: ErrorRecoveryProps = {
				...defaultProps,
				isRetrying: true,
			}

			render(<ErrorRecovery {...props} />)

			const retryButton = screen.getByRole("button", { name: /retrying/i })
			expect(retryButton).toBeDisabled()
			expect(screen.getByTestId("refresh-icon")).toHaveClass("animate-spin")
		})

		test("should show success state after successful retry", () => {
			const props: ErrorRecoveryProps = {
				...defaultProps,
				recoveryStatus: "success",
			}

			render(<ErrorRecovery {...props} />)

			expect(screen.getByTestId("check-icon")).toBeInTheDocument()
			expect(screen.getByText(/recovery successful/i)).toBeInTheDocument()
		})

		test("should show failure state after failed recovery", () => {
			const props: ErrorRecoveryProps = {
				...defaultProps,
				recoveryStatus: "failed",
			}

			render(<ErrorRecovery {...props} />)

			expect(screen.getByTestId("x-icon")).toBeInTheDocument()
			expect(screen.getByText(/recovery failed/i)).toBeInTheDocument()
		})
	})

	describe("Responsive Design", () => {
		test("should adapt to mobile viewport", () => {
			// Mock mobile viewport
			Object.defineProperty(window, "innerWidth", {
				writable: true,
				configurable: true,
				value: 375,
			})

			render(<ErrorRecovery {...defaultProps} />)

			const modal = screen.getByTestId("error-recovery-modal")
			expect(modal).toHaveClass("mobile-layout")
		})

		test("should adapt to desktop viewport", () => {
			// Mock desktop viewport
			Object.defineProperty(window, "innerWidth", {
				writable: true,
				configurable: true,
				value: 1024,
			})

			render(<ErrorRecovery {...defaultProps} />)

			const modal = screen.getByTestId("error-recovery-modal")
			expect(modal).toHaveClass("desktop-layout")
		})
	})

	describe("Edge Cases", () => {
		test("should handle null error gracefully", () => {
			const props: ErrorRecoveryProps = {
				...defaultProps,
				error: null,
			}

			render(<ErrorRecovery {...props} />)

			expect(screen.getByText(/unknown error occurred/i)).toBeInTheDocument()
		})

		test("should handle error without message", () => {
			const error = new Error()
			const props: ErrorRecoveryProps = {
				...defaultProps,
				error,
			}

			render(<ErrorRecovery {...props} />)

			expect(screen.getByText(/unknown error occurred/i)).toBeInTheDocument()
		})

		test("should handle very long error messages", () => {
			const longErrorMessage = "This is a very long error message that should be truncated".repeat(10)
			const error = new Error(longErrorMessage)
			const props: ErrorRecoveryProps = {
				...defaultProps,
				error,
			}

			render(<ErrorRecovery {...props} />)

			const errorElement = screen.getByText(/this is a very long error message/)
			expect(errorElement.textContent?.length).toBeLessThan(longErrorMessage.length)
		})

		test("should handle missing callbacks gracefully", () => {
			const props: ErrorRecoveryProps = {
				...defaultProps,
				onRetry: undefined as any,
				onSkip: undefined as any,
				onCancel: undefined as any,
				onDismiss: undefined as any,
			}

			render(<ErrorRecovery {...props} />)

			// Should not throw error
			expect(screen.getByTestId("error-recovery-modal")).toBeInTheDocument()
		})

		test("should handle zero max retries", () => {
			const props: ErrorRecoveryProps = {
				...defaultProps,
				maxRetries: 0,
				retryCount: 0,
			}

			render(<ErrorRecovery {...props} />)

			expect(screen.queryByRole("button", { name: /retry/i })).not.toBeInTheDocument()
			expect(screen.getByText(/no retries available/i)).toBeInTheDocument()
		})
	})
})
