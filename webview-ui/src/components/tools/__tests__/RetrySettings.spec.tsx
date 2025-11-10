import { describe, test, expect, beforeEach, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
// import { fireEvent } from "@testing-library/react" // eslint-disable-line @typescript-eslint/no-unused-vars
import userEvent from "@testing-library/user-event"
import { RetrySettings } from "../RetrySettings"
import type { RetrySettingsProps } from "../RetrySettings"

// Mock framer-motion
vi.mock("framer-motion", () => ({
	motion: {
		div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
		form: ({ children, ...props }: any) => <form {...props}>{children}</form>,
		label: ({ children, ...props }: any) => <label {...props}>{children}</label>,
		input: ({ children, ...props }: any) => <input {...props}>{children}</input>,
		select: ({ children, ...props }: any) => <select {...props}>{children}</select>,
		option: ({ children, ...props }: any) => <option {...props}>{children}</option>,
	},
	AnimatePresence: ({ children }: any) => <>{children}</>,
}))

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
	Settings: ({ className }: any) => <div data-testid="settings-icon" className={className} />,
	RefreshCw: ({ className }: any) => <div data-testid="refresh-icon" className={className} />,
	Save: ({ className }: any) => <div data-testid="save-icon" className={className} />,
	X: ({ className }: any) => <div data-testid="x-icon" className={className} />,
	Info: ({ className }: any) => <div data-testid="info-icon" className={className} />,
	AlertTriangle: ({ className }: any) => <div data-testid="alert-icon" className={className} />,
	Check: ({ className }: any) => <div data-testid="check-icon" className={className} />,
}))

describe("RetrySettings Component", () => {
	const defaultProps: RetrySettingsProps = {
		isOpen: true,
		settings: {
			enableRetry: true,
			maxRetryAttempts: 3,
			baseDelayMs: 1000,
			maxDelayMs: 30000,
			backoffMultiplier: 2,
			jitterFactor: 0.1,
			enableContextOptimization: true,
			enableHistorySynchronization: true,
			enableManualRetry: true,
			retryTimeoutMs: 60000,
		},
		onSave: vi.fn(),
		onCancel: vi.fn(),
		onReset: vi.fn(),
		onSettingsChange: vi.fn(),
	}

	beforeEach(() => {
		vi.clearAllMocks()
	})

	describe("Component Rendering", () => {
		test("should render settings modal when open", () => {
			render(<RetrySettings {...defaultProps} />)

			expect(screen.getByTestId("retry-settings-modal")).toBeInTheDocument()
			expect(screen.getByTestId("settings-icon")).toBeInTheDocument()
			expect(screen.getByText(/retry settings/i)).toBeInTheDocument()
		})

		test("should not render when closed", () => {
			const props: RetrySettingsProps = {
				...defaultProps,
				isOpen: false,
			}

			render(<RetrySettings {...props} />)

			expect(screen.queryByTestId("retry-settings-modal")).not.toBeInTheDocument()
		})

		test("should render all form fields", () => {
			render(<RetrySettings {...defaultProps} />)

			// Basic retry settings
			expect(screen.getByLabelText(/enable retry/i)).toBeInTheDocument()
			expect(screen.getByLabelText(/max retry attempts/i)).toBeInTheDocument()
			expect(screen.getByLabelText(/base delay \(ms\)/i)).toBeInTheDocument()
			expect(screen.getByLabelText(/max delay \(ms\)/i)).toBeInTheDocument()
			expect(screen.getByLabelText(/backoff multiplier/i)).toBeInTheDocument()
			expect(screen.getByLabelText(/jitter factor/i)).toBeInTheDocument()

			// Advanced settings
			expect(screen.getByLabelText(/enable context optimization/i)).toBeInTheDocument()
			expect(screen.getByLabelText(/enable history synchronization/i)).toBeInTheDocument()
			expect(screen.getByLabelText(/enable manual retry/i)).toBeInTheDocument()
			expect(screen.getByLabelText(/retry timeout \(ms\)/i)).toBeInTheDocument()
		})

		test("should render action buttons", () => {
			render(<RetrySettings {...defaultProps} />)

			expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument()
			expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument()
			expect(screen.getByRole("button", { name: /reset to defaults/i })).toBeInTheDocument()
		})
	})

	describe("Form Interactions", () => {
		test("should toggle enable retry checkbox", async () => {
			const user = userEvent.setup()
			const onSettingsChange = vi.fn()

			const props: RetrySettingsProps = {
				...defaultProps,
				onSettingsChange,
			}

			render(<RetrySettings {...props} />)

			const enableRetryCheckbox = screen.getByLabelText(/enable retry/i)
			await user.click(enableRetryCheckbox)

			expect(onSettingsChange).toHaveBeenCalledWith(expect.objectContaining({ enableRetry: false }))
		})

		test("should update max retry attempts", async () => {
			const user = userEvent.setup()
			const onSettingsChange = vi.fn()

			const props: RetrySettingsProps = {
				...defaultProps,
				onSettingsChange,
			}

			render(<RetrySettings {...props} />)

			const maxAttemptsInput = screen.getByLabelText(/max retry attempts/i)
			await user.clear(maxAttemptsInput)
			await user.type(maxAttemptsInput, "5")

			expect(onSettingsChange).toHaveBeenCalledWith(expect.objectContaining({ maxRetryAttempts: 5 }))
		})

		test("should update base delay", async () => {
			const user = userEvent.setup()
			const onSettingsChange = vi.fn()

			const props: RetrySettingsProps = {
				...defaultProps,
				onSettingsChange,
			}

			render(<RetrySettings {...props} />)

			const baseDelayInput = screen.getByLabelText(/base delay \(ms\)/i)
			await user.clear(baseDelayInput)
			await user.type(baseDelayInput, "2000")

			expect(onSettingsChange).toHaveBeenCalledWith(expect.objectContaining({ baseDelayMs: 2000 }))
		})

		test("should update backoff multiplier", async () => {
			const user = userEvent.setup()
			const onSettingsChange = vi.fn()

			const props: RetrySettingsProps = {
				...defaultProps,
				onSettingsChange,
			}

			render(<RetrySettings {...props} />)

			const backoffInput = screen.getByLabelText(/backoff multiplier/i)
			await user.clear(backoffInput)
			await user.type(backoffInput, "2.5")

			expect(onSettingsChange).toHaveBeenCalledWith(expect.objectContaining({ backoffMultiplier: 2.5 }))
		})

		test("should update jitter factor", async () => {
			const user = userEvent.setup()
			const onSettingsChange = vi.fn()

			const props: RetrySettingsProps = {
				...defaultProps,
				onSettingsChange,
			}

			render(<RetrySettings {...props} />)

			const jitterInput = screen.getByLabelText(/jitter factor/i)
			await user.clear(jitterInput)
			await user.type(jitterInput, "0.2")

			expect(onSettingsChange).toHaveBeenCalledWith(expect.objectContaining({ jitterFactor: 0.2 }))
		})

		test("should toggle context optimization", async () => {
			const user = userEvent.setup()
			const onSettingsChange = vi.fn()

			const props: RetrySettingsProps = {
				...defaultProps,
				onSettingsChange,
			}

			render(<RetrySettings {...props} />)

			const contextOptCheckbox = screen.getByLabelText(/enable context optimization/i)
			await user.click(contextOptCheckbox)

			expect(onSettingsChange).toHaveBeenCalledWith(expect.objectContaining({ enableContextOptimization: false }))
		})

		test("should toggle history synchronization", async () => {
			const user = userEvent.setup()
			const onSettingsChange = vi.fn()

			const props: RetrySettingsProps = {
				...defaultProps,
				onSettingsChange,
			}

			render(<RetrySettings {...props} />)

			const historySyncCheckbox = screen.getByLabelText(/enable history synchronization/i)
			await user.click(historySyncCheckbox)

			expect(onSettingsChange).toHaveBeenCalledWith(
				expect.objectContaining({ enableHistorySynchronization: false }),
			)
		})

		test("should toggle manual retry", async () => {
			const user = userEvent.setup()
			const onSettingsChange = vi.fn()

			const props: RetrySettingsProps = {
				...defaultProps,
				onSettingsChange,
			}

			render(<RetrySettings {...props} />)

			const manualRetryCheckbox = screen.getByLabelText(/enable manual retry/i)
			await user.click(manualRetryCheckbox)

			expect(onSettingsChange).toHaveBeenCalledWith(expect.objectContaining({ enableManualRetry: false }))
		})
	})

	describe("Form Validation", () => {
		test("should validate max retry attempts range", async () => {
			const user = userEvent.setup()
			const props: RetrySettingsProps = {
				...defaultProps,
			}

			render(<RetrySettings {...props} />)

			const maxAttemptsInput = screen.getByLabelText(/max retry attempts/i)
			await user.clear(maxAttemptsInput)
			await user.type(maxAttemptsInput, "15") // Above max (10)

			expect(screen.getByText(/max retry attempts must be between 1 and 10/i)).toBeInTheDocument()

			const saveButton = screen.getByRole("button", { name: /save/i })
			expect(saveButton).toBeDisabled()
		})

		test("should validate base delay range", async () => {
			const user = userEvent.setup()
			const props: RetrySettingsProps = {
				...defaultProps,
			}

			render(<RetrySettings {...props} />)

			const baseDelayInput = screen.getByLabelText(/base delay \(ms\)/i)
			await user.clear(baseDelayInput)
			await user.type(baseDelayInput, "50") // Below min (100)

			expect(screen.getByText(/base delay must be between 100 and 10000/i)).toBeInTheDocument()

			const saveButton = screen.getByRole("button", { name: /save/i })
			expect(saveButton).toBeDisabled()
		})

		test("should validate max delay range", async () => {
			const user = userEvent.setup()
			const props: RetrySettingsProps = {
				...defaultProps,
			}

			render(<RetrySettings {...props} />)

			const maxDelayInput = screen.getByLabelText(/max delay \(ms\)/i)
			await user.clear(maxDelayInput)
			await user.type(maxDelayInput, "500") // Below min (1000)

			expect(screen.getByText(/max delay must be between 1000 and 300000/i)).toBeInTheDocument()

			const saveButton = screen.getByRole("button", { name: /save/i })
			expect(saveButton).toBeDisabled()
		})

		test("should validate backoff multiplier range", async () => {
			const user = userEvent.setup()
			const props: RetrySettingsProps = {
				...defaultProps,
			}

			render(<RetrySettings {...props} />)

			const backoffInput = screen.getByLabelText(/backoff multiplier/i)
			await user.clear(backoffInput)
			await user.type(backoffInput, "0.5") // Below min (1.1)

			expect(screen.getByText(/backoff multiplier must be between 1\.1 and 5/i)).toBeInTheDocument()

			const saveButton = screen.getByRole("button", { name: /save/i })
			expect(saveButton).toBeDisabled()
		})

		test("should validate jitter factor range", async () => {
			const user = userEvent.setup()
			const props: RetrySettingsProps = {
				...defaultProps,
			}

			render(<RetrySettings {...props} />)

			const jitterInput = screen.getByLabelText(/jitter factor/i)
			await user.clear(jitterInput)
			await user.type(jitterInput, "0.6") // Above max (0.5)

			expect(screen.getByText(/jitter factor must be between 0 and 0\.5/i)).toBeInTheDocument()

			const saveButton = screen.getByRole("button", { name: /save/i })
			expect(saveButton).toBeDisabled()
		})

		test("should validate logical consistency", async () => {
			const user = userEvent.setup()
			const props: RetrySettingsProps = {
				...defaultProps,
			}

			render(<RetrySettings {...props} />)

			const baseDelayInput = screen.getByLabelText(/base delay \(ms\)/i)
			const maxDelayInput = screen.getByLabelText(/max delay \(ms\)/i)

			await user.clear(baseDelayInput)
			await user.type(baseDelayInput, "5000")
			await user.clear(maxDelayInput)
			await user.type(maxDelayInput, "3000") // Less than base delay

			expect(screen.getByText(/base delay cannot be greater than max delay/i)).toBeInTheDocument()

			const saveButton = screen.getByRole("button", { name: /save/i })
			expect(saveButton).toBeDisabled()
		})
	})

	describe("Action Buttons", () => {
		test("should call onSave when save button is clicked", async () => {
			const user = userEvent.setup()
			const onSave = vi.fn()

			const props: RetrySettingsProps = {
				...defaultProps,
				onSave,
			}

			render(<RetrySettings {...props} />)

			const saveButton = screen.getByRole("button", { name: /save/i })
			await user.click(saveButton)

			await waitFor(() => {
				expect(onSave).toHaveBeenCalledWith(defaultProps.settings)
			})
		})

		test("should call onCancel when cancel button is clicked", async () => {
			const user = userEvent.setup()
			const onCancel = vi.fn()

			const props: RetrySettingsProps = {
				...defaultProps,
				onCancel,
			}

			render(<RetrySettings {...props} />)

			const cancelButton = screen.getByRole("button", { name: /cancel/i })
			await user.click(cancelButton)

			await waitFor(() => {
				expect(onCancel).toHaveBeenCalledTimes(1)
			})
		})

		test("should call onReset when reset button is clicked", async () => {
			const user = userEvent.setup()
			const onReset = vi.fn()

			const props: RetrySettingsProps = {
				...defaultProps,
				onReset,
			}

			render(<RetrySettings {...props} />)

			const resetButton = screen.getByRole("button", { name: /reset to defaults/i })
			await user.click(resetButton)

			await waitFor(() => {
				expect(onReset).toHaveBeenCalledTimes(1)
			})
		})

		test("should disable save button when form is invalid", () => {
			const props: RetrySettingsProps = {
				...defaultProps,
				settings: {
					...defaultProps.settings,
					maxRetryAttempts: 15, // Invalid value
				},
			}

			render(<RetrySettings {...props} />)

			const saveButton = screen.getByRole("button", { name: /save/i })
			expect(saveButton).toBeDisabled()
		})

		test("should enable save button when form is valid", () => {
			render(<RetrySettings {...defaultProps} />)

			const saveButton = screen.getByRole("button", { name: /save/i })
			expect(saveButton).not.toBeDisabled()
		})
	})

	describe("Preset Selection", () => {
		test("should render preset options", () => {
			render(<RetrySettings {...defaultProps} />)

			expect(screen.getByLabelText(/preset/i)).toBeInTheDocument()
			expect(screen.getByRole("option", { name: /custom/i })).toBeInTheDocument()
			expect(screen.getByRole("option", { name: /network/i })).toBeInTheDocument()
			expect(screen.getByRole("option", { name: /filesystem/i })).toBeInTheDocument()
			expect(screen.getByRole("option", { name: /api/i })).toBeInTheDocument()
			expect(screen.getByRole("option", { name: /quick/i })).toBeInTheDocument()
			expect(screen.getByRole("option", { name: /resilient/i })).toBeInTheDocument()
		})

		test("should apply network preset", async () => {
			const user = userEvent.setup()
			const onSettingsChange = vi.fn()

			const props: RetrySettingsProps = {
				...defaultProps,
				onSettingsChange,
			}

			render(<RetrySettings {...props} />)

			const presetSelect = screen.getByLabelText(/preset/i)
			await user.selectOptions(presetSelect, "network")

			expect(onSettingsChange).toHaveBeenCalledWith(
				expect.objectContaining({
					maxRetryAttempts: 5,
					baseDelayMs: 1000,
					maxDelayMs: 30000,
					backoffMultiplier: 2,
					jitterFactor: 0.2,
					enableContextOptimization: true,
					enableManualRetry: true,
				}),
			)
		})

		test("should apply filesystem preset", async () => {
			const user = userEvent.setup()
			const onSettingsChange = vi.fn()

			const props: RetrySettingsProps = {
				...defaultProps,
				onSettingsChange,
			}

			render(<RetrySettings {...props} />)

			const presetSelect = screen.getByLabelText(/preset/i)
			await user.selectOptions(presetSelect, "filesystem")

			expect(onSettingsChange).toHaveBeenCalledWith(
				expect.objectContaining({
					maxRetryAttempts: 3,
					baseDelayMs: 500,
					maxDelayMs: 5000,
					backoffMultiplier: 1.5,
					jitterFactor: 0.1,
					enableContextOptimization: false,
					enableManualRetry: true,
				}),
			)
		})

		test("should apply resilient preset", async () => {
			const user = userEvent.setup()
			const onSettingsChange = vi.fn()

			const props: RetrySettingsProps = {
				...defaultProps,
				onSettingsChange,
			}

			render(<RetrySettings {...props} />)

			const presetSelect = screen.getByLabelText(/preset/i)
			await user.selectOptions(presetSelect, "resilient")

			expect(onSettingsChange).toHaveBeenCalledWith(
				expect.objectContaining({
					maxRetryAttempts: 10,
					baseDelayMs: 2000,
					maxDelayMs: 120000,
					backoffMultiplier: 3,
					jitterFactor: 0.5,
					enableContextOptimization: true,
					enableManualRetry: true,
				}),
			)
		})
	})

	describe("Help and Tooltips", () => {
		test("should show help tooltips", async () => {
			const user = userEvent.setup()
			render(<RetrySettings {...defaultProps} />)

			const helpIcons = screen.getAllByTestId("info-icon")
			expect(helpIcons.length).toBeGreaterThan(0)

			// Test first help icon
			await user.click(helpIcons[0])

			await waitFor(() => {
				expect(screen.getByText(/help information/i)).toBeInTheDocument()
			})
		})

		test("should show validation warnings", () => {
			const props: RetrySettingsProps = {
				...defaultProps,
				settings: {
					...defaultProps.settings,
					maxRetryAttempts: 15, // Invalid
				},
			}

			render(<RetrySettings {...props} />)

			expect(screen.getByTestId("alert-icon")).toBeInTheDocument()
			expect(screen.getByText(/validation errors/i)).toBeInTheDocument()
		})
	})

	describe("Accessibility", () => {
		test("should have proper ARIA labels", () => {
			render(<RetrySettings {...defaultProps} />)

			const modal = screen.getByRole("dialog")
			expect(modal).toHaveAttribute("aria-modal", "true")
			expect(modal).toHaveAttribute("aria-labelledby", expect.stringContaining("retry-settings-title"))
		})

		test("should support keyboard navigation", async () => {
			const user = userEvent.setup()
			render(<RetrySettings {...defaultProps} />)

			// Tab through form elements
			await user.tab()
			expect(screen.getByLabelText(/enable retry/i)).toHaveFocus()

			await user.tab()
			expect(screen.getByLabelText(/max retry attempts/i)).toHaveFocus()
		})

		test("should announce form validation errors", async () => {
			const user = userEvent.setup()
			const props: RetrySettingsProps = {
				...defaultProps,
			}

			render(<RetrySettings {...props} />)

			const maxAttemptsInput = screen.getByLabelText(/max retry attempts/i)
			await user.clear(maxAttemptsInput)
			await user.type(maxAttemptsInput, "15")

			await waitFor(() => {
				const errorMessage = screen.getByText(/max retry attempts must be between 1 and 10/i)
				expect(errorMessage).toHaveAttribute("role", "alert")
			})
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

			render(<RetrySettings {...defaultProps} />)

			const modal = screen.getByTestId("retry-settings-modal")
			expect(modal).toHaveClass("mobile-layout")
		})

		test("should adapt to desktop viewport", () => {
			// Mock desktop viewport
			Object.defineProperty(window, "innerWidth", {
				writable: true,
				configurable: true,
				value: 1024,
			})

			render(<RetrySettings {...defaultProps} />)

			const modal = screen.getByTestId("retry-settings-modal")
			expect(modal).toHaveClass("desktop-layout")
		})
	})

	describe("Edge Cases", () => {
		test("should handle empty settings", () => {
			const props: RetrySettingsProps = {
				...defaultProps,
				settings: {} as any,
			}

			render(<RetrySettings {...props} />)

			// Should render with default values
			expect(screen.getByLabelText(/enable retry/i)).toBeInTheDocument()
		})

		test("should handle missing callbacks gracefully", () => {
			const props: RetrySettingsProps = {
				...defaultProps,
				onSave: undefined as any,
				onCancel: undefined as any,
				onReset: undefined as any,
				onSettingsChange: undefined as any,
			}

			render(<RetrySettings {...props} />)

			// Should not throw error
			expect(screen.getByTestId("retry-settings-modal")).toBeInTheDocument()
		})

		test("should handle rapid preset changes", async () => {
			const user = userEvent.setup()
			const onSettingsChange = vi.fn()

			const props: RetrySettingsProps = {
				...defaultProps,
				onSettingsChange,
			}

			render(<RetrySettings {...props} />)

			const presetSelect = screen.getByLabelText(/preset/i)

			// Rapidly change presets
			await user.selectOptions(presetSelect, "network")
			await user.selectOptions(presetSelect, "filesystem")
			await user.selectOptions(presetSelect, "api")

			// Should handle without errors
			expect(onSettingsChange).toHaveBeenCalledTimes(3)
		})
	})
})
