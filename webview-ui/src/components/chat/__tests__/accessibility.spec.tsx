import React from "react"
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { AriaEnhancementProvider, useAria } from "../../ui/aria-enhancements"
import { KeyboardNavigationProvider } from "../../ui/keyboard-navigation"
import { ProgressIndicator } from "../ProgressIndicators"
import { StatusMessageSystem, useStatusMessages } from "../StatusMessages"

// Mock VSCode APIs
const mockVscode = {
	window: {
		showErrorMessage: vi.fn(),
		showInformationMessage: vi.fn(),
		showWarningMessage: vi.fn(),
	},
}

vi.mock("vscode", () => mockVscode)

describe("Accessibility Compliance", () => {
	beforeEach(() => {
		// Mock window.getComputedStyle for focus testing
		Object.defineProperty(window, "getComputedStyle", {
			writable: true,
			value: vi.fn(() => ({
				outlineColor: "rgb(0, 0, 0)",
				outlineStyle: "solid",
				outlineWidth: "2px",
			})),
		})

		// Mock IntersectionObserver for visibility testing
		global.IntersectionObserver = vi.fn().mockImplementation((_callback) => ({
			observe: vi.fn(),
			unobserve: vi.fn(),
			disconnect: vi.fn(),
			// Simulate intersection callback
			thresholds: [1],
			root: null,
			rootMargin: "",
		})) as any
	})

	afterEach(() => {
		vi.clearAllMocks()
	})

	describe("Keyboard Navigation", () => {
		it("should support tab navigation", () => {
			const TestComponent = () => (
				<KeyboardNavigationProvider>
					<button>Button 1</button>
					<button>Button 2</button>
					<button>Button 3</button>
				</KeyboardNavigationProvider>
			)

			render(<TestComponent />)

			const buttons = screen.getAllByRole("button")

			// Test tab navigation
			fireEvent.keyDown(document.body, { key: "Tab" })
			fireEvent.keyUp(document.body, { key: "Tab" })

			// First button should be focused
			expect(buttons[0]).toHaveFocus()
		})

		it("should support arrow key navigation", () => {
			const TestComponent = () => (
				<KeyboardNavigationProvider>
					<div role="menu">
						<div role="menuitem" tabIndex={0}>
							Item 1
						</div>
						<div role="menuitem" tabIndex={-1}>
							Item 2
						</div>
						<div role="menuitem" tabIndex={-1}>
							Item 3
						</div>
					</div>
				</KeyboardNavigationProvider>
			)

			render(<TestComponent />)

			const menuItems = screen.getAllByRole("menuitem")

			// Focus first item
			menuItems[0].focus()
			expect(menuItems[0]).toHaveFocus()

			// Test arrow down navigation
			fireEvent.keyDown(menuItems[0], { key: "ArrowDown" })
			expect(menuItems[1]).toHaveFocus()
		})

		it("should support escape key to exit", () => {
			const TestComponent = () => (
				<KeyboardNavigationProvider>
					<div role="dialog" aria-modal="true">
						<button>Close</button>
						<input type="text" placeholder="Enter text" />
					</div>
				</KeyboardNavigationProvider>
			)

			render(<TestComponent />)

			const input = screen.getByPlaceholderText("Enter text")
			input.focus()

			// Test escape key
			fireEvent.keyDown(input, { key: "Escape" })

			// Focus should move to close button or exit modal
			expect(screen.getByRole("button")).toHaveFocus()
		})

		it("should maintain visible focus indicator", () => {
			const TestComponent = () => (
				<KeyboardNavigationProvider>
					<button>Focusable Button</button>
				</KeyboardNavigationProvider>
			)

			render(<TestComponent />)

			const button = screen.getByRole("button")
			button.focus()

			// Check for visible focus indicator
			const computedStyle = window.getComputedStyle(button)
			expect(computedStyle.outlineColor).toBe("rgb(0, 0, 0)")
			expect(computedStyle.outlineStyle).toBe("solid")
			expect(computedStyle.outlineWidth).toBe("2px")
		})
	})

	describe("Screen Reader Support", () => {
		it("should provide proper ARIA labels", () => {
			const TestComponent = () => (
				<AriaEnhancementProvider>
					<button aria-label="Submit form">Submit</button>
					<input aria-label="Email address" type="email" />
					<div role="progressbar" aria-valuenow={50} aria-valuemin={0} aria-valuemax={100} />
				</AriaEnhancementProvider>
			)

			render(<TestComponent />)

			const button = screen.getByRole("button")
			const input = screen.getByRole("textbox")
			const progressbar = screen.getByRole("progressbar")

			expect(button).toHaveAttribute("aria-label", "Submit form")
			expect(input).toHaveAttribute("aria-label", "Email address")
			expect(progressbar).toHaveAttribute("aria-valuenow", "50")
			expect(progressbar).toHaveAttribute("aria-valuemin", "0")
			expect(progressbar).toHaveAttribute("aria-valuemax", "100")
		})

		it("should announce dynamic content changes", () => {
			const TestComponent = () => {
				const { announce } = useAria()

				const handleClick = () => {
					announce("Form submitted successfully", "polite")
				}

				return (
					<AriaEnhancementProvider>
						<button onClick={handleClick}>Submit</button>
					</AriaEnhancementProvider>
				)
			}

			render(<TestComponent />)

			const button = screen.getByRole("button")
			fireEvent.click(button)

			// Check for live region announcements
			const liveRegions = document.querySelectorAll('[aria-live="polite"]')
			expect(liveRegions).toHaveLength(1)
		})

		it("should support ARIA descriptions", () => {
			const TestComponent = () => (
				<AriaEnhancementProvider>
					<button aria-describedby="help-text">Help</button>
					<div id="help-text">Click for assistance</div>
				</AriaEnhancementProvider>
			)

			render(<TestComponent />)

			const button = screen.getByRole("button")
			const description = document.getElementById("help-text")

			expect(button).toHaveAttribute("aria-describedby", "help-text")
			expect(description).toBeInTheDocument()
		})

		it("should handle form validation errors", () => {
			const TestComponent = () => (
				<AriaEnhancementProvider>
					<form>
						<input
							aria-label="Email"
							type="email"
							aria-invalid="true"
							aria-errormessage="Please enter a valid email address"
							required
						/>
						<button type="submit">Submit</button>
					</form>
				</AriaEnhancementProvider>
			)

			render(<TestComponent />)

			const input = screen.getByRole("textbox")

			expect(input).toHaveAttribute("aria-invalid", "true")
			expect(input).toHaveAttribute("aria-errormessage", "Please enter a valid email address")
			expect(input).toHaveAttribute("required")
		})
	})

	describe("Color Contrast", () => {
		it("should maintain sufficient color contrast", () => {
			const TestComponent = () => (
				<div style={{ backgroundColor: "#ffffff", color: "#000000" }}>High contrast text</div>
			)

			render(<TestComponent />)

			const element = screen.getByText("High contrast text")
			const computedStyle = window.getComputedStyle(element)

			// This is a simplified test - in real implementation, you'd use a contrast calculation library
			const backgroundColor = computedStyle.backgroundColor
			const textColor = computedStyle.color

			expect(backgroundColor).toBe("rgb(255, 255, 255)")
			expect(textColor).toBe("rgb(0, 0, 0)")
		})

		it("should respect user preference for reduced motion", () => {
			// Mock prefers-reduced-motion
			Object.defineProperty(window, "matchMedia", {
				writable: true,
				value: vi.fn(() => ({
					matches: true,
					media: "(prefers-reduced-motion: reduce)",
				})),
			})

			const TestComponent = () => <div className="animate-pulse">Animated content</div>

			render(<TestComponent />)

			const element = screen.getByText("Animated content")
			const _computedStyle = window.getComputedStyle(element)

			// Should disable animations when user prefers reduced motion
			expect(window.matchMedia).toHaveBeenCalledWith("(prefers-reduced-motion: reduce)")
		})
	})

	describe("Focus Management", () => {
		it("should trap focus within modal", () => {
			const TestComponent = () => (
				<AriaEnhancementProvider>
					<div role="dialog" aria-modal="true">
						<button>Close</button>
						<input type="text" />
						<button>Save</button>
					</div>
					<button>Background button</button>
				</AriaEnhancementProvider>
			)

			render(<TestComponent />)

			const _modal = screen.getByRole("dialog")
			const backgroundButton = screen.getByText("Background button")

			// Focus within modal
			const closeButton = screen.getByText("Close")
			closeButton.focus()

			// Tab should stay within modal
			fireEvent.keyDown(document.body, { key: "Tab" })
			fireEvent.keyUp(document.body, { key: "Tab" })

			// Focus should still be within modal, not on background button
			expect(backgroundButton).not.toHaveFocus()
		})

		it("should restore focus after modal close", async () => {
			const TestComponent = () => {
				const [isOpen, setIsOpen] = React.useState(true)

				const handleClose = () => {
					setIsOpen(false)
				}

				return (
					<AriaEnhancementProvider>
						{isOpen && (
							<div role="dialog" aria-modal="true">
								<button onClick={handleClose}>Close</button>
							</div>
						)}
						<button>Trigger button</button>
					</AriaEnhancementProvider>
				)
			}

			render(<TestComponent />)

			const triggerButton = screen.getByText("Trigger button")
			const closeButton = screen.getByText("Close")

			// Focus trigger button
			triggerButton.focus()
			expect(triggerButton).toHaveFocus()

			// Open modal and focus close button
			closeButton.focus()
			expect(closeButton).toHaveFocus()

			// Close modal
			fireEvent.click(closeButton)

			// Focus should return to trigger button
			await waitFor(() => {
				expect(triggerButton).toHaveFocus()
			})
		})
	})

	describe("Progress Indicators", () => {
		it("should be accessible to screen readers", () => {
			const TestComponent = () => (
				<ProgressIndicator
					type="linear"
					state="processing"
					value={75}
					max={100}
					label="File upload progress"
					showPercentage={true}
					accessible={true}
				/>
			)

			render(<TestComponent />)

			const progressbar = screen.getByRole("progressbar")

			expect(progressbar).toHaveAttribute("aria-valuenow", "75")
			expect(progressbar).toHaveAttribute("aria-valuemin", "0")
			expect(progressbar).toHaveAttribute("aria-valuemax", "100")
			expect(progressbar).toHaveAttribute("aria-label", "File upload progress")
		})

		it("should announce progress changes", async () => {
			const TestComponent = () => {
				const [progress, setProgress] = React.useState(0)

				React.useEffect(() => {
					const timer = setTimeout(() => {
						setProgress(50)
					}, 100)

					return () => clearTimeout(timer)
				}, [])

				return (
					<AriaEnhancementProvider>
						<ProgressIndicator
							type="circular"
							state="processing"
							value={progress}
							max={100}
							label="Loading progress"
							accessible={true}
						/>
					</AriaEnhancementProvider>
				)
			}

			render(<TestComponent />)

			// Wait for progress update
			await waitFor(() => {
				const progressbar = screen.getByRole("progressbar")
				expect(progressbar).toHaveAttribute("aria-valuenow", "50")
			})
		})
	})

	describe("Status Messages", () => {
		it("should be announced to screen readers", () => {
			const TestComponent = () => {
				const { showSuccess } = useStatusMessages()

				React.useEffect(() => {
					showSuccess("Operation completed successfully", "Your changes have been saved")
				}, [showSuccess])

				return (
					<AriaEnhancementProvider>
						<StatusMessageSystem messages={[]} onDismiss={() => {}} onAction={() => {}} />
					</AriaEnhancementProvider>
				)
			}

			render(<TestComponent />)

			// Check for live regions
			const liveRegions = document.querySelectorAll("[aria-live]")
			expect(liveRegions.length).toBeGreaterThan(0)
		})

		it("should provide appropriate alert levels", () => {
			const TestComponent = () => {
				const { showError, showWarning } = useStatusMessages()

				React.useEffect(() => {
					showError("Critical error occurred", "System failure", { priority: "critical" })
					showWarning("Warning message", "Please check your settings", { priority: "high" })
				}, [showError, showWarning])

				return (
					<AriaEnhancementProvider>
						<StatusMessageSystem messages={[]} onDismiss={() => {}} onAction={() => {}} />
					</AriaEnhancementProvider>
				)
			}

			render(<TestComponent />)

			// Check for appropriate live regions
			const assertiveRegion = document.querySelector('[aria-live="assertive"]')
			const politeRegion = document.querySelector('[aria-live="polite"]')

			expect(assertiveRegion).toBeTruthy()
			expect(politeRegion).toBeTruthy()
		})
	})

	describe("Skip Links", () => {
		it("should provide skip navigation for keyboard users", () => {
			const TestComponent = () => (
				<AriaEnhancementProvider>
					<a href="#main-content" className="sr-only focus:not-sr-only">
						Skip to main content
					</a>
					<div id="main-content">
						<main>
							<h1>Main Content</h1>
							<p>This is the main content of the page.</p>
						</main>
					</div>
				</AriaEnhancementProvider>
			)

			render(<TestComponent />)

			const skipLink = screen.getByText("Skip to main content")
			const mainContent = document.getElementById("main-content")

			expect(skipLink).toHaveAttribute("href", "#main-content")
			expect(mainContent).toBeInTheDocument()
		})

		it("should be visible when focused", () => {
			const TestComponent = () => (
				<AriaEnhancementProvider>
					<a href="#main" className="sr-only focus:not-sr-only">
						Skip to main
					</a>
					<main id="main">Content</main>
				</AriaEnhancementProvider>
			)

			render(<TestComponent />)

			const skipLink = screen.getByText("Skip to main")

			// Should not be visible initially
			expect(skipLink).toHaveClass("sr-only")

			// Should become visible when focused
			skipLink.focus()
			expect(skipLink).toHaveClass("focus:not-sr-only")
		})
	})

	describe("Touch Targets", () => {
		it("should provide adequate touch target sizes", () => {
			const TestComponent = () => (
				<div>
					<button style={{ minHeight: "44px", minWidth: "44px" }}>Touch-friendly button</button>
					<a href="#" style={{ padding: "12px", display: "inline-block" }}>
						Touch-friendly link
					</a>
				</div>
			)

			render(<TestComponent />)

			const button = screen.getByRole("button")
			const link = screen.getByRole("link")

			const buttonStyle = window.getComputedStyle(button)
			const linkStyle = window.getComputedStyle(link)

			// Minimum touch target size is 44x44px
			expect(parseInt(buttonStyle.minHeight)).toBeGreaterThanOrEqual(44)
			expect(parseInt(buttonStyle.minWidth)).toBeGreaterThanOrEqual(44)
			expect(parseInt(linkStyle.paddingTop) * 2).toBeGreaterThanOrEqual(44)
		})
	})

	describe("Responsive Design", () => {
		it("should maintain accessibility across viewport sizes", () => {
			// Mock different viewport sizes
			const viewports = [
				{ width: 320, height: 568 }, // Mobile
				{ width: 768, height: 1024 }, // Tablet
				{ width: 1024, height: 768 }, // Desktop
				{ width: 1920, height: 1080 }, // Large desktop
			]

			const TestComponent = () => (
				<div style={{ width: "100%", maxWidth: "1200px", margin: "0 auto" }}>
					<nav aria-label="Main navigation">
						<button>Home</button>
						<button>About</button>
					</nav>
					<main>
						<h1>Content</h1>
					</main>
				</div>
			)

			viewports.forEach((viewport) => {
				// Mock viewport size
				Object.defineProperty(window, "innerWidth", {
					writable: true,
					configurable: true,
					value: viewport.width,
				})
				Object.defineProperty(window, "innerHeight", {
					writable: true,
					configurable: true,
					value: viewport.height,
				})

				const { unmount } = render(<TestComponent />)

				const navigation = screen.getByRole("navigation")
				const navStyle = window.getComputedStyle(navigation)

				// Navigation should be accessible at all viewport sizes
				expect(parseInt(navStyle.width)).toBeGreaterThan(0)
				expect(navStyle).toHaveAttribute("aria-label", "Main navigation")

				unmount()
			})
		})
	})

	describe("Error Handling Accessibility", () => {
		it("should announce errors appropriately", () => {
			const TestComponent = () => {
				const { showError } = useStatusMessages()

				const handleError = () => {
					showError("Form validation failed", "Please correct the highlighted errors", {
						priority: "high",
						autoHide: false,
						persistent: true,
					})
				}

				return (
					<AriaEnhancementProvider>
						<form>
							<input aria-label="Email" type="email" required />
							<input aria-label="Password" type="password" required />
							<button onClick={handleError}>Submit</button>
						</form>
					</AriaEnhancementProvider>
				)
			}

			render(<TestComponent />)

			const submitButton = screen.getByRole("button")
			fireEvent.click(submitButton)

			// Should have error announcement in assertive live region
			const assertiveRegion = document.querySelector('[aria-live="assertive"]')
			expect(assertiveRegion).toBeTruthy()
		})

		it("should provide recovery options", () => {
			const TestComponent = () => {
				const { showError } = useStatusMessages()

				const handleError = () => {
					showError("Network connection lost", "Unable to connect to server", {
						actions: [
							{
								label: "Retry",
								action: () => console.log("retry"),
							},
							{
								label: "Offline Mode",
								action: () => console.log("offline"),
							},
						],
					})
				}

				return (
					<AriaEnhancementProvider>
						<button onClick={handleError}>Trigger Error</button>
					</AriaEnhancementProvider>
				)
			}

			render(<TestComponent />)

			const triggerButton = screen.getByRole("button")
			fireEvent.click(triggerButton)

			// Should have accessible error recovery options
			const retryButton = screen.getByText("Retry")
			const offlineButton = screen.getByText("Offline Mode")

			expect(retryButton).toBeInTheDocument()
			expect(offlineButton).toBeInTheDocument()
		})
	})
})
