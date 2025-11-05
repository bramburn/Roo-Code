import React, { createContext, useContext, useRef, useEffect, useState, useCallback } from "react"

/**
 * Keyboard navigation context
 */
interface KeyboardNavigationContextType {
	registerFocusable: (element: HTMLElement, options?: FocusableOptions) => () => void
	focusNext: (group?: string) => void
	focusPrevious: (group?: string) => void
	focusFirst: (group?: string) => void
	focusLast: (group?: string) => void
	activateCurrent: () => void
	currentFocus: HTMLElement | null
	focusedIndex: number
	totalFocusable: number
}

const KeyboardNavigationContext = createContext<KeyboardNavigationContextType | null>(null)

/**
 * Focusable element options
 */
export interface FocusableOptions {
	group?: string
	priority?: number
	disabled?: boolean
	onFocus?: (element: HTMLElement) => void
	onBlur?: (element: HTMLElement) => void
	onActivate?: (element: HTMLElement) => void
	skip?: boolean
}

/**
 * Focusable element data
 */
interface FocusableElement {
	element: HTMLElement
	options: FocusableOptions
	index: number
}

/**
 * Keyboard navigation provider props
 */
export interface KeyboardNavigationProviderProps {
	children: React.ReactNode
	enabled?: boolean
	wrapNavigation?: boolean
	shortcuts?: KeyboardShortcuts
	onShortcut?: (shortcut: string, event: KeyboardEvent) => void
}

/**
 * Keyboard shortcuts configuration
 */
export interface KeyboardShortcuts {
	[key: string]: string
}

/**
 * Default keyboard shortcuts
 */
const DEFAULT_SHORTCUTS: KeyboardShortcuts = {
	ArrowDown: "focusNext",
	ArrowUp: "focusPrevious",
	ArrowRight: "focusNext",
	ArrowLeft: "focusPrevious",
	Home: "focusFirst",
	End: "focusLast",
	Enter: "activate",
	" ": "activate",
	Escape: "exit",
	Tab: "focusNext",
	"Shift+Tab": "focusPrevious",
}

/**
 * Keyboard Navigation Provider
 * Provides comprehensive keyboard navigation for all focusable elements
 */
export const KeyboardNavigationProvider: React.FC<KeyboardNavigationProviderProps> = ({
	children,
	enabled = true,
	wrapNavigation = true,
	shortcuts = DEFAULT_SHORTCUTS,
	onShortcut,
}) => {
	const [focusableElements, setFocusableElements] = useState<FocusableElement[]>([])
	const [currentFocus, setCurrentFocus] = useState<HTMLElement | null>(null)
	const [focusedIndex, setFocusedIndex] = useState(-1)
	const _containerRef = useRef<HTMLElement>(null)

	// Register a focusable element
	const registerFocusable = useCallback(
		(element: HTMLElement, options: FocusableOptions = {}) => {
			if (options.disabled || options.skip) {
				return () => {}
			}

			const focusableElement: FocusableElement = {
				element,
				options,
				index: focusableElements.length,
			}

			setFocusableElements((prev) => {
				const filtered = prev.filter((fe) => fe.element !== element)
				const sorted = [...filtered, focusableElement].sort((a, b) => {
					// Sort by group first, then by priority, then by DOM order
					if (a.options.group !== b.options.group) {
						return (a.options.group || "").localeCompare(b.options.group || "")
					}
					if (a.options.priority !== b.options.priority) {
						return (a.options.priority || 0) - (b.options.priority || 0)
					}
					return a.index - b.index
				})

				// Update indices
				return sorted.map((fe, index) => ({ ...fe, index }))
			})

			// Add event listeners
			const handleFocus = () => {
				setCurrentFocus(element)
				setFocusedIndex(focusableElement.index)
				options.onFocus?.(element)
			}

			const handleBlur = () => {
				options.onBlur?.(element)
			}

			const handleKeyDown = (event: KeyboardEvent) => {
				if (event.key === "Enter" || event.key === " ") {
					event.preventDefault()
					options.onActivate?.(element)
				}
			}

			element.addEventListener("focus", handleFocus)
			element.addEventListener("blur", handleBlur)
			element.addEventListener("keydown", handleKeyDown)

			// Ensure element is focusable
			if (!element.hasAttribute("tabindex")) {
				element.setAttribute("tabindex", "0")
			}

			return () => {
				element.removeEventListener("focus", handleFocus)
				element.removeEventListener("blur", handleBlur)
				element.removeEventListener("keydown", handleKeyDown)

				setFocusableElements((prev) => {
					const filtered = prev.filter((fe) => fe.element !== element)
					return filtered.map((fe, index) => ({ ...fe, index }))
				})
			}
		},
		[focusableElements],
	)

	// Navigation functions
	const focusNext = useCallback(
		(group?: string) => {
			const elements = group ? focusableElements.filter((fe) => fe.options.group === group) : focusableElements

			if (elements.length === 0) return

			const currentIndex = elements.findIndex((fe) => fe.element === currentFocus)
			let nextIndex = currentIndex + 1

			if (nextIndex >= elements.length) {
				nextIndex = wrapNavigation ? 0 : elements.length - 1
			}

			elements[nextIndex].element.focus()
		},
		[focusableElements, currentFocus, wrapNavigation],
	)

	const focusPrevious = useCallback(
		(group?: string) => {
			const elements = group ? focusableElements.filter((fe) => fe.options.group === group) : focusableElements

			if (elements.length === 0) return

			const currentIndex = elements.findIndex((fe) => fe.element === currentFocus)
			let prevIndex = currentIndex - 1

			if (prevIndex < 0) {
				prevIndex = wrapNavigation ? elements.length - 1 : 0
			}

			elements[prevIndex].element.focus()
		},
		[focusableElements, currentFocus, wrapNavigation],
	)

	const focusFirst = useCallback(
		(group?: string) => {
			const elements = group ? focusableElements.filter((fe) => fe.options.group === group) : focusableElements

			if (elements.length > 0) {
				elements[0].element.focus()
			}
		},
		[focusableElements],
	)

	const focusLast = useCallback(
		(group?: string) => {
			const elements = group ? focusableElements.filter((fe) => fe.options.group === group) : focusableElements

			if (elements.length > 0) {
				elements[elements.length - 1].element.focus()
			}
		},
		[focusableElements],
	)

	const activateCurrent = useCallback(() => {
		if (currentFocus) {
			const focusableElement = focusableElements.find((fe) => fe.element === currentFocus)
			focusableElement?.options.onActivate?.(currentFocus)

			// Simulate click if no custom handler
			if (!focusableElement?.options.onActivate) {
				currentFocus.click()
			}
		}
	}, [currentFocus, focusableElements])

	// Handle global keyboard events
	useEffect(() => {
		if (!enabled) return

		const handleKeyDown = (event: KeyboardEvent) => {
			// Skip if inside input field
			const target = event.target as HTMLElement
			if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.contentEditable === "true") {
				// Allow navigation keys but not shortcuts that might interfere with typing
				if (["Tab", "Enter", "Escape"].includes(event.key)) {
					// Allow these keys
				} else {
					return
				}
			}

			const key = getKeyString(event)
			const action = shortcuts[key]

			if (action) {
				event.preventDefault()

				switch (action) {
					case "focusNext":
						focusNext()
						break
					case "focusPrevious":
						focusPrevious()
						break
					case "focusFirst":
						focusFirst()
						break
					case "focusLast":
						focusLast()
						break
					case "activate":
						activateCurrent()
						break
					case "exit":
						// Blur current element
						if (currentFocus) {
							currentFocus.blur()
						}
						break
				}

				onShortcut?.(action, event)
			}
		}

		document.addEventListener("keydown", handleKeyDown)
		return () => document.removeEventListener("keydown", handleKeyDown)
	}, [enabled, shortcuts, focusNext, focusPrevious, focusFirst, focusLast, activateCurrent, currentFocus, onShortcut])

	const contextValue: KeyboardNavigationContextType = {
		registerFocusable,
		focusNext,
		focusPrevious,
		focusFirst,
		focusLast,
		activateCurrent,
		currentFocus,
		focusedIndex,
		totalFocusable: focusableElements.length,
	}

	return (
		<KeyboardNavigationContext.Provider value={contextValue}>
			<div className="keyboard-navigation-container">{children}</div>
		</KeyboardNavigationContext.Provider>
	)
}

/**
 * Hook to use keyboard navigation
 */
export const useKeyboardNavigation = () => {
	const context = useContext(KeyboardNavigationContext)
	if (!context) {
		throw new Error("useKeyboardNavigation must be used within KeyboardNavigationProvider")
	}
	return context
}

/**
 * Hook to make an element focusable
 */
export const useFocusable = (options: FocusableOptions = {}) => {
	const { registerFocusable } = useKeyboardNavigation()
	const elementRef = useRef<HTMLElement>(null)

	useEffect(() => {
		if (elementRef.current) {
			return registerFocusable(elementRef.current, options)
		}
	}, [registerFocusable, options])

	return elementRef
}

/**
 * Get key string from keyboard event
 */
const getKeyString = (event: KeyboardEvent): string => {
	const parts: string[] = []

	if (event.ctrlKey) parts.push("Ctrl")
	if (event.altKey) parts.push("Alt")
	if (event.shiftKey) parts.push("Shift")
	if (event.metaKey) parts.push("Meta")

	parts.push(event.key)

	return parts.join("+")
}

/**
 * Focusable component wrapper
 */
export interface FocusableProps extends React.HTMLAttributes<HTMLElement> {
	as?: keyof JSX.IntrinsicElements
	focusableOptions?: FocusableOptions
	children: React.ReactNode
}

export const Focusable: React.FC<FocusableProps> = ({
	as: Component = "div",
	focusableOptions = {},
	children,
	...props
}) => {
	const { registerFocusable } = useKeyboardNavigation()
	const elementRef = useRef<HTMLElement>(null)

	useEffect(() => {
		if (elementRef.current) {
			return registerFocusable(elementRef.current, focusableOptions)
		}
	}, [registerFocusable, focusableOptions])

	return React.createElement(Component, { ref: elementRef, ...props }, children)
}

/**
 * Enhanced button with keyboard navigation
 */
export interface KeyboardButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	focusableOptions?: FocusableOptions
	shortcut?: string
	showShortcut?: boolean
}

export const KeyboardButton: React.FC<KeyboardButtonProps> = ({
	focusableOptions = {},
	shortcut,
	showShortcut = false,
	children,
	...props
}) => {
	const { registerFocusable } = useKeyboardNavigation()
	const buttonRef = useRef<HTMLButtonElement>(null)

	useEffect(() => {
		if (buttonRef.current) {
			return registerFocusable(buttonRef.current, {
				...focusableOptions,
				onActivate: (element) => {
					element.click()
					focusableOptions.onActivate?.(element)
				},
			})
		}
	}, [registerFocusable, focusableOptions])

	return (
		<button ref={buttonRef} {...props}>
			{children}
			{showShortcut && shortcut && <span className="ml-2 text-xs opacity-60">{shortcut}</span>}
		</button>
	)
}

/**
 * Keyboard navigation help panel
 */
export interface KeyboardNavigationHelpProps {
	shortcuts?: KeyboardShortcuts
	className?: string
}

export const KeyboardNavigationHelp: React.FC<KeyboardNavigationHelpProps> = ({
	shortcuts = DEFAULT_SHORTCUTS,
	className = "",
}) => {
	const [isVisible, setIsVisible] = useState(false)

	const toggleHelp = () => setIsVisible(!isVisible)

	if (!isVisible) {
		return (
			<button
				onClick={toggleHelp}
				className="fixed bottom-4 right-4 p-2 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
				aria-label="Show keyboard shortcuts">
				<span className="text-sm">⌨️</span>
			</button>
		)
	}

	return (
		<div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`}>
			<div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-96 overflow-y-auto">
				<div className="p-6">
					<div className="flex justify-between items-center mb-4">
						<h2 className="text-lg font-semibold">Keyboard Shortcuts</h2>
						<button
							onClick={toggleHelp}
							className="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
							aria-label="Close keyboard shortcuts">
							×
						</button>
					</div>

					<div className="space-y-2">
						{Object.entries(shortcuts).map(([key, action]) => (
							<div key={key} className="flex justify-between items-center py-2 border-b border-gray-100">
								<kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-sm font-mono">
									{key}
								</kbd>
								<span className="text-sm text-gray-600 capitalize">
									{action.replace(/([A-Z])/g, " $1").trim()}
								</span>
							</div>
						))}
					</div>

					<div className="mt-4 text-xs text-gray-500">
						<p>These shortcuts work throughout the interface. Press Escape to close this help.</p>
					</div>
				</div>
			</div>
		</div>
	)
}

/**
 * Skip links component for accessibility
 */
export interface SkipLinksProps {
	links: Array<{
		href: string
		label: string
	}>
}

export const SkipLinks: React.FC<SkipLinksProps> = ({ links }) => {
	return (
		<div className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-white p-4 rounded shadow-lg border">
			{links.map((link, index) => (
				<a
					key={index}
					href={link.href}
					className="block py-2 text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-300">
					{link.label}
				</a>
			))}
		</div>
	)
}

export default KeyboardNavigationProvider
