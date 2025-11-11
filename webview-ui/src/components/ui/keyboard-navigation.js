import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime"
import React, { createContext, useContext, useRef, useEffect, useState, useCallback } from "react"
const KeyboardNavigationContext = createContext(null)
/**
 * Default keyboard shortcuts
 */
const DEFAULT_SHORTCUTS = {
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
export const KeyboardNavigationProvider = ({
	children,
	enabled = true,
	wrapNavigation = true,
	shortcuts = DEFAULT_SHORTCUTS,
	onShortcut,
}) => {
	const [focusableElements, setFocusableElements] = useState([])
	const [currentFocus, setCurrentFocus] = useState(null)
	const [focusedIndex, setFocusedIndex] = useState(-1)
	const _containerRef = useRef(null)
	// Register a focusable element
	const registerFocusable = useCallback(
		(element, options = {}) => {
			if (options.disabled || options.skip) {
				return () => {}
			}
			const focusableElement = {
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
			const handleKeyDown = (event) => {
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
		(group) => {
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
		(group) => {
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
		(group) => {
			const elements = group ? focusableElements.filter((fe) => fe.options.group === group) : focusableElements
			if (elements.length > 0) {
				elements[0].element.focus()
			}
		},
		[focusableElements],
	)
	const focusLast = useCallback(
		(group) => {
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
		const handleKeyDown = (event) => {
			// Skip if inside input field
			const target = event.target
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
	const contextValue = {
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
	return _jsx(KeyboardNavigationContext.Provider, {
		value: contextValue,
		children: _jsx("div", { className: "keyboard-navigation-container", children: children }),
	})
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
export const useFocusable = (options = {}) => {
	const { registerFocusable } = useKeyboardNavigation()
	const elementRef = useRef(null)
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
const getKeyString = (event) => {
	const parts = []
	if (event.ctrlKey) parts.push("Ctrl")
	if (event.altKey) parts.push("Alt")
	if (event.shiftKey) parts.push("Shift")
	if (event.metaKey) parts.push("Meta")
	parts.push(event.key)
	return parts.join("+")
}
export const Focusable = ({ as: Component = "div", focusableOptions = {}, children, ...props }) => {
	const { registerFocusable } = useKeyboardNavigation()
	const elementRef = useRef(null)
	useEffect(() => {
		if (elementRef.current) {
			return registerFocusable(elementRef.current, focusableOptions)
		}
	}, [registerFocusable, focusableOptions])
	return React.createElement(Component, { ref: elementRef, ...props }, children)
}
export const KeyboardButton = ({ focusableOptions = {}, shortcut, showShortcut = false, children, ...props }) => {
	const { registerFocusable } = useKeyboardNavigation()
	const buttonRef = useRef(null)
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
	return _jsxs("button", {
		ref: buttonRef,
		...props,
		children: [
			children,
			showShortcut && shortcut && _jsx("span", { className: "ml-2 text-xs opacity-60", children: shortcut }),
		],
	})
}
export const KeyboardNavigationHelp = ({ shortcuts = DEFAULT_SHORTCUTS, className = "" }) => {
	const [isVisible, setIsVisible] = useState(false)
	const toggleHelp = () => setIsVisible(!isVisible)
	if (!isVisible) {
		return _jsx("button", {
			onClick: toggleHelp,
			className:
				"fixed bottom-4 right-4 p-2 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300",
			"aria-label": "Show keyboard shortcuts",
			children: _jsx("span", { className: "text-sm", children: "\u2328\uFE0F" }),
		})
	}
	return _jsx("div", {
		className: `fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`,
		children: _jsx("div", {
			className: "bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-96 overflow-y-auto",
			children: _jsxs("div", {
				className: "p-6",
				children: [
					_jsxs("div", {
						className: "flex justify-between items-center mb-4",
						children: [
							_jsx("h2", { className: "text-lg font-semibold", children: "Keyboard Shortcuts" }),
							_jsx("button", {
								onClick: toggleHelp,
								className:
									"text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300",
								"aria-label": "Close keyboard shortcuts",
								children: "\u00D7",
							}),
						],
					}),
					_jsx("div", {
						className: "space-y-2",
						children: Object.entries(shortcuts).map(([key, action]) =>
							_jsxs(
								"div",
								{
									className: "flex justify-between items-center py-2 border-b border-gray-100",
									children: [
										_jsx("kbd", {
											className:
												"px-2 py-1 bg-gray-100 border border-gray-300 rounded text-sm font-mono",
											children: key,
										}),
										_jsx("span", {
											className: "text-sm text-gray-600 capitalize",
											children: action.replace(/([A-Z])/g, " $1").trim(),
										}),
									],
								},
								key,
							),
						),
					}),
					_jsx("div", {
						className: "mt-4 text-xs text-gray-500",
						children: _jsx("p", {
							children: "These shortcuts work throughout the interface. Press Escape to close this help.",
						}),
					}),
				],
			}),
		}),
	})
}
export const SkipLinks = ({ links }) => {
	return _jsx("div", {
		className:
			"sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-white p-4 rounded shadow-lg border",
		children: links.map((link, index) =>
			_jsx(
				"a",
				{
					href: link.href,
					className:
						"block py-2 text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-300",
					children: link.label,
				},
				index,
			),
		),
	})
}
export default KeyboardNavigationProvider
//# sourceMappingURL=keyboard-navigation.js.map
