import React, { createContext, useContext, useRef, useEffect, useState } from "react"

/**
 * ARIA context for managing announcements and live regions
 */
interface AriaContextType {
	announce: (message: string, priority?: "polite" | "assertive") => void
	setFocus: (element: HTMLElement | null) => void
	getFocus: () => HTMLElement | null
	registerLandmark: (element: HTMLElement, label: string) => () => void
	registerDescription: (element: HTMLElement, description: string) => () => void
}

const AriaContext = createContext<AriaContextType | null>(null)

/**
 * ARIA enhancement provider
 */
export interface AriaEnhancementProviderProps {
	children: React.ReactNode
	enableLiveRegions?: boolean
	enableFocusManagement?: boolean
	enableLandmarks?: boolean
}

export const AriaEnhancementProvider: React.FC<AriaEnhancementProviderProps> = ({
	children,
	enableLiveRegions = true,
	enableFocusManagement = true,
	enableLandmarks = true,
}) => {
	const [currentFocus, setCurrentFocus] = useState<HTMLElement | null>(null)
	const [announcements, setAnnouncements] = useState<Array<{ id: string; message: string; priority: string }>>([])
	const landmarksRef = useRef<Map<HTMLElement, string>>(new Map())
	const descriptionsRef = useRef<Map<HTMLElement, string>>(new Map())

	// Announce messages to screen readers
	const announce = (message: string, priority: "polite" | "assertive" = "polite") => {
		if (!enableLiveRegions) return

		const id = `announcement-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
		setAnnouncements((prev) => [...prev, { id, message, priority }])

		// Remove announcement after it's been read
		setTimeout(() => {
			setAnnouncements((prev) => prev.filter((a) => a.id !== id))
		}, 1000)
	}

	// Set focus with announcement
	const setFocus = (element: HTMLElement | null) => {
		if (!enableFocusManagement) return

		if (element) {
			element.focus()
			setCurrentFocus(element)

			// Announce focus change
			const label = getElementLabel(element)
			if (label) {
				announce(`Focused on ${label}`)
			}
		} else {
			setCurrentFocus(null)
		}
	}

	// Register landmark
	const registerLandmark = (element: HTMLElement, label: string) => {
		if (!enableLandmarks) return () => {}

		landmarksRef.current.set(element, label)
		element.setAttribute("aria-label", label)

		return () => {
			landmarksRef.current.delete(element)
			element.removeAttribute("aria-label")
		}
	}

	// Register description
	const registerDescription = (element: HTMLElement, description: string) => {
		const id = `desc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
		descriptionsRef.current.set(element, description)

		// Create hidden description element
		const descElement = document.createElement("div")
		descElement.id = id
		descElement.setAttribute("aria-hidden", "true")
		descElement.textContent = description
		descElement.style.display = "none"
		document.body.appendChild(descElement)

		element.setAttribute("aria-describedby", id)

		return () => {
			descriptionsRef.current.delete(element)
			element.removeAttribute("aria-describedby")
			document.body.removeChild(descElement)
		}
	}

	// Get element label for announcements
	const getElementLabel = (element: HTMLElement): string => {
		// Try various label sources
		if (element.getAttribute("aria-label")) {
			return element.getAttribute("aria-label")!
		}

		if (element.getAttribute("aria-labelledby")) {
			const labelId = element.getAttribute("aria-labelledby")!
			const labelElement = document.getElementById(labelId)
			if (labelElement) {
				return labelElement.textContent || ""
			}
		}

		if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
			const input = element as HTMLInputElement | HTMLTextAreaElement
			if (input.placeholder) return input.placeholder
			if (input.title) return input.title
		}

		if (element.tagName === "BUTTON") {
			return element.textContent || ""
		}

		if (element.textContent) {
			return element.textContent.trim()
		}

		return ""
	}

	const contextValue: AriaContextType = {
		announce,
		setFocus,
		getFocus: () => currentFocus,
		registerLandmark,
		registerDescription,
	}

	return (
		<AriaContext.Provider value={contextValue}>
			{children}

			{/* Live regions for screen reader announcements */}
			{enableLiveRegions && (
				<>
					<div aria-live="polite" aria-atomic="true" className="sr-only" aria-relevant="additions text">
						{announcements
							.filter((a) => a.priority === "polite")
							.map((a) => (
								<div key={a.id}>{a.message}</div>
							))}
					</div>

					<div aria-live="assertive" aria-atomic="true" className="sr-only" aria-relevant="additions text">
						{announcements
							.filter((a) => a.priority === "assertive")
							.map((a) => (
								<div key={a.id}>{a.message}</div>
							))}
					</div>
				</>
			)}
		</AriaContext.Provider>
	)
}

/**
 * Hook to use ARIA enhancements
 */
export const useAria = () => {
	const context = useContext(AriaContext)
	if (!context) {
		throw new Error("useAria must be used within AriaEnhancementProvider")
	}
	return context
}

/**
 * Enhanced ARIA button component
 */
export interface AriaButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	ariaLabel?: string
	ariaDescription?: string
	ariaPressed?: boolean
	ariaExpanded?: boolean
	ariaControls?: string
	onActivate?: () => void
	announceActivation?: boolean
}

export const AriaButton: React.FC<AriaButtonProps> = ({
	ariaLabel,
	ariaDescription,
	ariaPressed,
	ariaExpanded,
	ariaControls,
	onActivate,
	announceActivation = true,
	children,
	onClick,
	...props
}) => {
	const { announce, registerDescription } = useAria()
	const buttonRef = useRef<HTMLButtonElement>(null)

	useEffect(() => {
		if (buttonRef.current && ariaDescription) {
			return registerDescription(buttonRef.current, ariaDescription)
		}
	}, [ariaDescription, registerDescription])

	const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		onClick?.(event)
		onActivate?.()

		if (announceActivation && ariaLabel) {
			announce(`${ariaLabel} activated`)
		}
	}

	return (
		<button
			ref={buttonRef}
			aria-label={ariaLabel}
			aria-pressed={ariaPressed}
			aria-expanded={ariaExpanded}
			aria-controls={ariaControls}
			onClick={handleClick}
			{...props}>
			{children}
		</button>
	)
}

/**
 * Enhanced ARIA input component
 */
export interface AriaInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
	ariaLabel?: string
	ariaDescription?: string
	ariaInvalid?: boolean
	ariaErrorMessage?: string
	announceChanges?: boolean
	onValueChange?: (value: string) => void
}

export const AriaInput: React.FC<AriaInputProps> = ({
	ariaLabel,
	ariaDescription,
	ariaInvalid,
	ariaErrorMessage,
	announceChanges = true,
	onValueChange,
	onChange,
	...props
}) => {
	const { announce, registerDescription } = useAria()
	const inputRef = useRef<HTMLInputElement>(null)
	const [hasError, setHasError] = useState(false)

	useEffect(() => {
		if (inputRef.current && ariaDescription) {
			return registerDescription(inputRef.current, ariaDescription)
		}
	}, [ariaDescription, registerDescription])

	const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		onChange?.(event)
		onValueChange?.(event.target.value)

		if (announceChanges && ariaLabel) {
			announce(`${ariaLabel} value changed to ${event.target.value}`)
		}
	}

	// Update error state
	useEffect(() => {
		setHasError(!!ariaInvalid)
		if (ariaInvalid && ariaErrorMessage) {
			announce(`Error in ${ariaLabel}: ${ariaErrorMessage}`, "assertive")
		}
	}, [ariaInvalid, ariaErrorMessage, ariaLabel, announce])

	return (
		<input
			ref={inputRef}
			aria-label={ariaLabel}
			aria-invalid={ariaInvalid}
			aria-describedby={ariaErrorMessage ? `error-${props.id || "input"}` : undefined}
			onChange={handleChange}
			className={`
				${props.className || ""}
				${hasError ? "border-red-500 focus:border-red-500" : ""}
			`}
			{...props}
		/>
	)
}

/**
 * Enhanced ARIA progress component
 */
export interface AriaProgressProps {
	value: number
	max?: number
	ariaLabel?: string
	ariaDescription?: string
	showValue?: boolean
	announceChanges?: boolean
}

export const AriaProgress: React.FC<AriaProgressProps> = ({
	value,
	max = 100,
	ariaLabel = "Progress",
	ariaDescription,
	showValue = true,
	announceChanges = true,
}) => {
	const { announce, registerDescription } = useAria()
	const progressRef = useRef<HTMLDivElement>(null)
	const [previousValue, setPreviousValue] = useState(value)

	useEffect(() => {
		if (progressRef.current && ariaDescription) {
			return registerDescription(progressRef.current, ariaDescription)
		}
	}, [ariaDescription, registerDescription])

	useEffect(() => {
		if (announceChanges && value !== previousValue) {
			const percentage = Math.round((value / max) * 100)
			announce(`${ariaLabel}: ${percentage}% complete`)
			setPreviousValue(value)
		}
	}, [value, previousValue, max, ariaLabel, announceChanges, announce])

	const percentage = Math.round((value / max) * 100)

	return (
		<div
			ref={progressRef}
			role="progressbar"
			aria-valuenow={value}
			aria-valuemin={0}
			aria-valuemax={max}
			aria-label={ariaLabel}
			className="relative">
			<div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
				<div
					className="bg-blue-500 h-full rounded-full transition-all duration-300 ease-out"
					style={{ width: `${percentage}%` }}
				/>
			</div>
			{showValue && (
				<div className="absolute inset-0 flex items-center justify-center text-sm font-medium text-white">
					{percentage}%
				</div>
			)}
		</div>
	)
}

/**
 * Enhanced ARIA landmark component
 */
export interface AriaLandmarkProps {
	landmarkType: "banner" | "navigation" | "main" | "complementary" | "contentinfo" | "search" | "form"
	label: string
	children: React.ReactNode
	className?: string
}

export const AriaLandmark: React.FC<AriaLandmarkProps> = ({ landmarkType, label, children, className = "" }) => {
	const { registerLandmark } = useAria()
	const landmarkRef = useRef<HTMLElement>(null)

	useEffect(() => {
		if (landmarkRef.current) {
			return registerLandmark(landmarkRef.current, label)
		}
	}, [label, registerLandmark])

	const getRole = () => {
		switch (landmarkType) {
			case "banner":
				return "banner"
			case "navigation":
				return "navigation"
			case "main":
				return "main"
			case "complementary":
				return "complementary"
			case "contentinfo":
				return "contentinfo"
			case "search":
				return "search"
			case "form":
				return "form"
			default:
				return "region"
		}
	}

	const Tag = landmarkType === "form" ? "form" : "section"

	return (
		<Tag ref={landmarkRef as any} role={getRole()} aria-label={label} className={className}>
			{children}
		</Tag>
	)
}

/**
 * Enhanced ARIA list component
 */
export interface AriaListProps {
	ariaLabel?: string
	ariaDescription?: string
	items: Array<{
		id: string
		label: string
		description?: string
		selected?: boolean
		disabled?: boolean
	}>
	onSelect?: (itemId: string) => void
	multiSelect?: boolean
	className?: string
}

export const AriaList: React.FC<AriaListProps> = ({
	ariaLabel = "List",
	ariaDescription,
	items,
	onSelect,
	multiSelect = false,
	className = "",
}) => {
	const { announce, registerDescription } = useAria()
	const listRef = useRef<HTMLUListElement>(null)
	const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())

	useEffect(() => {
		if (listRef.current && ariaDescription) {
			return registerDescription(listRef.current, ariaDescription)
		}
	}, [ariaDescription, registerDescription])

	const handleItemClick = (itemId: string, itemLabel: string) => {
		if (items.find((item) => item.id === itemId)?.disabled) return

		let newSelected: Set<string>

		if (multiSelect) {
			newSelected = new Set(selectedItems)
			if (newSelected.has(itemId)) {
				newSelected.delete(itemId)
				announce(`Deselected ${itemLabel}`)
			} else {
				newSelected.add(itemId)
				announce(`Selected ${itemLabel}`)
			}
		} else {
			newSelected = new Set([itemId])
			announce(`Selected ${itemLabel}`)
		}

		setSelectedItems(newSelected)
		onSelect?.(itemId)
	}

	return (
		<ul
			ref={listRef}
			role="listbox"
			aria-label={ariaLabel}
			aria-multiselectable={multiSelect}
			aria-orientation="vertical"
			className={className}>
			{items.map((item, index) => (
				<li
					key={item.id}
					role="option"
					aria-selected={selectedItems.has(item.id)}
					aria-disabled={item.disabled}
					aria-setsize={items.length}
					aria-posinset={index + 1}
					className={`
						p-2 border rounded cursor-pointer
						${selectedItems.has(item.id) ? "bg-blue-100 border-blue-500" : "border-gray-300"}
						${item.disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"}
					`}
					onClick={() => handleItemClick(item.id, item.label)}>
					<div className="font-medium">{item.label}</div>
					{item.description && <div className="text-sm text-gray-600">{item.description}</div>}
				</li>
			))}
		</ul>
	)
}

/**
 * Screen reader only utility
 */
export const ScreenReaderOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => (
	<div className="sr-only" aria-hidden="false">
		{children}
	</div>
)

/**
 * Skip to main content link
 */
export const SkipToMain: React.FC<{ mainId: string; label?: string }> = ({
	mainId,
	label = "Skip to main content",
}) => (
	<a
		href={`#${mainId}`}
		className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-blue-600 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-300">
		{label}
	</a>
)

export default AriaEnhancementProvider
