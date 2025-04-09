import React, { useState, useRef, useEffect, useCallback } from "react"
import "./MentionTextArea.css"

// Define the types for our file/folder search results
export interface SearchResult {
	path: string
	type: "file" | "folder"
	label?: string
}

interface MentionTextAreaProps {
	placeholder?: string
	value: string
	onChange: (value: string) => void
	// Mock search results for testing
	mockSearchResults?: SearchResult[]
}

const MentionTextArea: React.FC<MentionTextAreaProps> = ({
	placeholder = "Type @ to mention a file or folder...",
	value,
	onChange,
	mockSearchResults = [],
}) => {
	const [showSearch, setShowSearch] = useState(false)
	const [searchQuery, setSearchQuery] = useState("")
	const [searchResults, setSearchResults] = useState<SearchResult[]>([])
	const [selectedIndex, setSelectedIndex] = useState(0)
	const [cursorPosition, setCursorPosition] = useState(0)

	const textAreaRef = useRef<HTMLTextAreaElement>(null)
	const searchInputRef = useRef<HTMLInputElement>(null)

	// Function to check if we should show the search dropdown
	const shouldShowSearch = (text: string, position: number): boolean => {
		const beforeCursor = text.slice(0, position)
		const atIndex = beforeCursor.lastIndexOf("@")

		if (atIndex === -1) {
			return false
		}

		const textAfterAt = beforeCursor.slice(atIndex + 1)

		// Check if there's any whitespace after the '@'
		if (/\\s/.test(textAfterAt)) return false

		// Show menu in all other cases
		return true
	}

	// Handle text area input changes
	const handleInputChange = useCallback(
		(e: React.ChangeEvent<HTMLTextAreaElement>) => {
			const newValue = e.target.value
			const newCursorPosition = e.target.selectionStart || 0

			onChange(newValue)
			setCursorPosition(newCursorPosition)

			// Check if the user just typed @ character
			const justTypedAt =
				newValue.length > 0 &&
				newValue[newCursorPosition - 1] === "@" &&
				(newCursorPosition === 1 || /\\s/.test(newValue[newCursorPosition - 2]))

			const showMenu = shouldShowSearch(newValue, newCursorPosition)

			if (showMenu) {
				// @ mention handling
				setShowSearch(true)
				const lastAtIndex = newValue.lastIndexOf("@", newCursorPosition - 1)
				const query = newValue.slice(lastAtIndex + 1, newCursorPosition)
				setSearchQuery(query)

				// Always set a default selection index
				setSelectedIndex(0)

				// If user just typed @, show initial results
				if (justTypedAt || query.length === 0) {
					// For empty query (just @), show all results
					setSearchResults(mockSearchResults)
				} else {
					// Filter results based on query
					const filteredResults = mockSearchResults.filter(
						(result) =>
							result.path.toLowerCase().includes(query.toLowerCase()) ||
							(result.label && result.label.toLowerCase().includes(query.toLowerCase())),
					)
					setSearchResults(filteredResults)
				}
			} else {
				setShowSearch(false)
				setSearchQuery("")
				setSelectedIndex(-1)
				setSearchResults([])
			}
		},
		[onChange, mockSearchResults],
	)

	// Handle search input changes
	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const query = e.target.value
		setSearchQuery(query)

		// Filter results based on query
		if (query.length === 0) {
			setSearchResults(mockSearchResults)
		} else {
			const filteredResults = mockSearchResults.filter(
				(result) =>
					result.path.toLowerCase().includes(query.toLowerCase()) ||
					(result.label && result.label.toLowerCase().includes(query.toLowerCase())),
			)
			setSearchResults(filteredResults)
		}

		// Reset selection index
		setSelectedIndex(0)
	}

	// Handle selecting a search result
	const handleSelect = (result: SearchResult) => {
		if (!textAreaRef.current) return

		const beforeCursor = value.slice(0, cursorPosition)
		const afterCursor = value.slice(cursorPosition)

		// Find the position of the last '@' symbol before the cursor
		const lastAtIndex = beforeCursor.lastIndexOf("@")

		if (lastAtIndex !== -1) {
			// Replace everything after @ with the selected item
			const beforeMention = value.slice(0, lastAtIndex)
			const displayText = result.label || result.path.split("/").pop() || result.path
			const newValue = beforeMention + "@" + displayText + " " + afterCursor.replace(/^[^\\s]*/, "")

			onChange(newValue)
			setShowSearch(false)

			// Focus back on textarea
			setTimeout(() => {
				if (textAreaRef.current) {
					textAreaRef.current.focus()
					const newCursorPos = lastAtIndex + displayText.length + 2 // +2 for @ and space
					textAreaRef.current.setSelectionRange(newCursorPos, newCursorPos)
					setCursorPosition(newCursorPos)
				}
			}, 0)
		}
	}

	// Handle keyboard navigation in search results
	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (!showSearch || searchResults.length === 0) return

			switch (e.key) {
				case "ArrowDown":
					e.preventDefault()
					setSelectedIndex((prev) => (prev + 1) % searchResults.length)
					break
				case "ArrowUp":
					e.preventDefault()
					setSelectedIndex((prev) => (prev - 1 + searchResults.length) % searchResults.length)
					break
				case "Enter":
					e.preventDefault()
					if (searchResults[selectedIndex]) {
						handleSelect(searchResults[selectedIndex])
					}
					break
				case "Escape":
					e.preventDefault()
					setShowSearch(false)
					// Focus back on textarea
					if (textAreaRef.current) {
						textAreaRef.current.focus()
					}
					break
			}
		},
		[showSearch, searchResults, selectedIndex, handleSelect],
	)

	// Focus the search input when the dropdown appears
	useEffect(() => {
		if (showSearch && searchInputRef.current) {
			// Use a small timeout to ensure the input is focused after rendering
			const focusTimer = setTimeout(() => {
				if (searchInputRef.current) {
					searchInputRef.current.focus()
				}
			}, 10)

			return () => clearTimeout(focusTimer)
		}
	}, [showSearch])

	// Render the highlighted text with pills for mentions
	const renderHighlightedText = () => {
		// Simple regex to find @mentions
		const parts = value.split(/(@[\\w\\/.-]+)/g)

		return (
			<div className="highlighted-text">
				{parts.map((part, index) => {
					if (part.startsWith("@") && part.length > 1) {
						// This is a mention, render as a pill
						return (
							<span key={index} className="mention-pill">
								{part}
							</span>
						)
					}
					return <span key={index}>{part}</span>
				})}
			</div>
		)
	}

	return (
		<div className="mention-textarea-container">
			{/* The actual textarea for editing */}
			<textarea
				ref={textAreaRef}
				className="mention-textarea"
				placeholder={placeholder}
				value={value}
				onChange={handleInputChange}
				data-testid="mention-textarea"
			/>

			{/* Highlighted overlay to show pills */}
			{renderHighlightedText()}

			{/* Search dropdown */}
			{showSearch && (
				<div className="search-dropdown" data-testid="search-dropdown">
					<div className="search-input-container">
						<input
							ref={searchInputRef}
							value={searchQuery}
							onChange={handleSearchChange}
							placeholder="Search files and folders..."
							className="search-input"
							data-testid="search-input"
							autoFocus
						/>
					</div>
					<div className="search-results">
						{searchResults.length === 0 ? (
							<div className="no-results" data-testid="no-results">
								No results found
							</div>
						) : (
							<ul className="results-list">
								{searchResults.map((result, index) => (
									<li
										key={result.path}
										onClick={() => handleSelect(result)}
										className={`result-item ${index === selectedIndex ? "selected" : ""}`}
										data-testid={`result-${index}`}
										onKeyDown={(e) => {
											if (e.key === "Enter") handleSelect(result)
										}}
										tabIndex={0}>
										<span className={`icon ${result.type}`}></span>
										<span className="result-label">{result.label || result.path}</span>
									</li>
								))}
							</ul>
						)}
					</div>
				</div>
			)}
		</div>
	)
}

export default MentionTextArea
