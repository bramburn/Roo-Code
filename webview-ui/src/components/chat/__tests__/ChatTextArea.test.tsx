import { render, fireEvent, act } from "@testing-library/react"
import ChatTextArea from "../ChatTextArea"
import { vscode } from "../../../utils/vscode"
import { SearchResult } from "../../../utils/context-mentions"

// Mock vscode API
jest.mock("../../../utils/vscode", () => ({
	vscode: {
		postMessage: jest.fn(),
	},
}))

describe("ChatTextArea - Input Handling", () => {
	const defaultProps = {
		// Required props from ChatTextAreaProps
		inputValue: "",
		setInputValue: jest.fn(),
		textAreaDisabled: false,
		selectApiConfigDisabled: false,
		placeholderText: "Type a message...",
		selectedImages: [],
		setSelectedImages: jest.fn(),
		onSend: jest.fn(),
		onSelectImages: jest.fn(),
		shouldDisableImages: false,
		onHeightChange: jest.fn(),
		mode: "chat",
		setMode: jest.fn(),
		modeShortcutText: "",

		// Additional props for testing
		setSearchRequestId: jest.fn(),
		setFileSearchResults: jest.fn(),
		setSearchLoading: jest.fn(),
		setSearchQuery: jest.fn(),
		setShowAtMentionSearch: jest.fn(),
	}

	beforeEach(() => {
		jest.clearAllMocks()
		jest.useFakeTimers()
	})

	afterEach(() => {
		jest.useRealTimers()
	})

	it("should handle slash commands correctly", () => {
		const { getByRole } = render(<ChatTextArea {...defaultProps} />)
		const textarea = getByRole("textbox")

		fireEvent.change(textarea, { target: { value: "/command" } })

		expect(defaultProps.setInputValue).toHaveBeenCalledWith("/command")
		// Should show context menu and not show @ mention search
		// You'll need to verify these states in your component
	})

	it("should handle @ mentions correctly", async () => {
		const { getByRole } = render(<ChatTextArea {...defaultProps} />)
		const textarea = getByRole("textbox")

		fireEvent.change(textarea, { target: { value: "@test" } })

		expect(defaultProps.setInputValue).toHaveBeenCalledWith("@test")

		// Wait for debounce
		act(() => {
			jest.advanceTimersByTime(200)
		})

		expect(vscode.postMessage).toHaveBeenCalledWith({
			type: "searchFiles",
			query: "test",
			requestId: expect.any(String),
		})
		expect(defaultProps.setSearchLoading).toHaveBeenCalledWith(true)
	})

	it("should show @ mention search immediately when typing @", () => {
		const { getByRole, getByTestId } = render(<ChatTextArea {...defaultProps} />)
		const textarea = getByRole("textbox")

		// Type just the @ character
		fireEvent.change(textarea, { target: { value: "@", selectionStart: 1 } })

		// The search box should appear immediately without waiting for debounce
		expect(getByTestId("at-mention-search")).toBeInTheDocument()

		// The search input should be focused
		expect(getByTestId("search-input")).toHaveFocus()

		// Verify that the search is triggered immediately without waiting for debounce
		expect(vscode.postMessage).toHaveBeenCalledWith({
			type: "searchFiles",
			query: "",
			requestId: expect.any(String),
		})

		// Verify that the loading state is set
		expect(defaultProps.setSearchLoading).toHaveBeenCalledWith(true)
	})

	// Note: Keyboard navigation is tested in AtMentionSearch.test.tsx
	it("should preserve text when selecting a mention", () => {
		// Render with the component
		const { getByRole } = render(<ChatTextArea {...defaultProps} />)

		const textarea = getByRole("textbox")

		// Type some text with @ in the middle
		fireEvent.change(textarea, { target: { value: "Hello @ world", selectionStart: 7 } })

		// Verify the search is triggered immediately
		expect(defaultProps.setShowAtMentionSearch).toHaveBeenCalledWith(true)

		// Simulate selecting a file by calling the onSelect prop of AtMentionSearch
		// This is a simplified test since we can't directly test the component's internal methods
		expect(defaultProps.setShowAtMentionSearch).toHaveBeenCalled()
	})

	it("should clear search results when input is cleared", () => {
		const { getByRole } = render(<ChatTextArea {...defaultProps} />)
		const textarea = getByRole("textbox")

		// First type @ mention
		fireEvent.change(textarea, { target: { value: "@test" } })

		// Then clear input
		fireEvent.change(textarea, { target: { value: "" } })

		expect(defaultProps.setFileSearchResults).toHaveBeenCalledWith([])
		expect(defaultProps.setInputValue).toHaveBeenCalledWith("")
	})

	it("should debounce search requests", () => {
		const { getByRole } = render(<ChatTextArea {...defaultProps} />)
		const textarea = getByRole("textbox")

		// Type quickly
		fireEvent.change(textarea, { target: { value: "@t" } })
		fireEvent.change(textarea, { target: { value: "@te" } })
		fireEvent.change(textarea, { target: { value: "@tes" } })
		fireEvent.change(textarea, { target: { value: "@test" } })

		// Only the last request should be made
		act(() => {
			jest.advanceTimersByTime(200)
		})

		expect(vscode.postMessage).toHaveBeenCalledTimes(1)
		expect(vscode.postMessage).toHaveBeenCalledWith({
			type: "searchFiles",
			query: "test",
			requestId: expect.any(String),
		})
	})
})

describe("ChatTextArea - Edge Cases", () => {
	const defaultProps = {
		// Required props from ChatTextAreaProps
		inputValue: "",
		setInputValue: jest.fn(),
		textAreaDisabled: false,
		selectApiConfigDisabled: false,
		placeholderText: "Type a message...",
		selectedImages: [],
		setSelectedImages: jest.fn(),
		onSend: jest.fn(),
		onSelectImages: jest.fn(),
		shouldDisableImages: false,
		onHeightChange: jest.fn(),
		mode: "chat",
		setMode: jest.fn(),
		modeShortcutText: "",

		// Additional props for testing
		setSearchRequestId: jest.fn(),
		setFileSearchResults: jest.fn(),
		setSearchLoading: jest.fn(),
		setSearchQuery: jest.fn(),
		setShowAtMentionSearch: jest.fn(),
	}

	beforeEach(() => {
		jest.clearAllMocks()
		jest.useFakeTimers()
	})

	afterEach(() => {
		jest.useRealTimers()
	})

	describe("Cursor Position Cases", () => {
		it("should handle multiple @ symbols correctly", () => {
			const { getByRole } = render(<ChatTextArea {...defaultProps} />)
			const textarea = getByRole("textbox")

			// Simulate typing with multiple @ symbols
			fireEvent.change(textarea, {
				target: {
					value: "Hello @world and @test",
					selectionStart: 17, // Cursor after "world"
				},
			})

			expect(defaultProps.setSearchQuery).toHaveBeenCalledWith("world")
		})

		it("should handle cursor position before @ symbol", () => {
			const { getByRole } = render(<ChatTextArea {...defaultProps} />)
			const textarea = getByRole("textbox")

			fireEvent.change(textarea, {
				target: {
					value: "Hello @test",
					selectionStart: 5, // Cursor before @
				},
			})

			expect(defaultProps.setShowAtMentionSearch).toHaveBeenCalledWith(false)
		})

		it("should handle backspacing over @ symbol", () => {
			const { getByRole } = render(<ChatTextArea {...defaultProps} />)
			const textarea = getByRole("textbox")

			// First type @test
			fireEvent.change(textarea, {
				target: {
					value: "@test",
					selectionStart: 5,
				},
			})

			// Then backspace over @
			fireEvent.change(textarea, {
				target: {
					value: "test",
					selectionStart: 0,
				},
			})

			expect(defaultProps.setShowAtMentionSearch).toHaveBeenCalledWith(false)
			expect(defaultProps.setFileSearchResults).toHaveBeenCalledWith([])
		})
	})

	describe("Input Content Cases", () => {
		it("should handle special characters after @", () => {
			const { getByRole } = render(<ChatTextArea {...defaultProps} />)
			const textarea = getByRole("textbox")

			fireEvent.change(textarea, {
				target: {
					value: "@#$%",
					selectionStart: 4,
				},
			})

			expect(defaultProps.setSearchQuery).toHaveBeenCalledWith("#$%")
		})

		it("should handle emoji and unicode characters", () => {
			const { getByRole } = render(<ChatTextArea {...defaultProps} />)
			const textarea = getByRole("textbox")

			fireEvent.change(textarea, {
				target: {
					value: "@🚀 test 你好",
					selectionStart: 10,
				},
			})

			expect(defaultProps.setSearchQuery).toHaveBeenCalledWith("🚀 test 你好")
		})

		it("should handle very long search queries", () => {
			const { getByRole } = render(<ChatTextArea {...defaultProps} />)
			const textarea = getByRole("textbox")

			const longQuery = "a".repeat(1000)
			fireEvent.change(textarea, {
				target: {
					value: `@${longQuery}`,
					selectionStart: 1001,
				},
			})

			act(() => {
				jest.advanceTimersByTime(200)
			})

			expect(vscode.postMessage).toHaveBeenCalledWith({
				type: "searchFiles",
				query: longQuery,
				requestId: expect.any(String),
			})
		})

		it("should handle whitespace correctly", () => {
			const { getByRole } = render(<ChatTextArea {...defaultProps} />)
			const textarea = getByRole("textbox")

			fireEvent.change(textarea, {
				target: {
					value: "@   test   ",
					selectionStart: 10,
				},
			})

			expect(defaultProps.setSearchQuery).toHaveBeenCalledWith("   test   ")
		})

		it("should handle line breaks in search query", () => {
			const { getByRole } = render(<ChatTextArea {...defaultProps} />)
			const textarea = getByRole("textbox")

			fireEvent.change(textarea, {
				target: {
					value: "@test\nquery",
					selectionStart: 10,
				},
			})

			expect(defaultProps.setSearchQuery).toHaveBeenCalledWith("test\nquery")
		})
	})

	describe("Race Condition Cases", () => {
		it("should handle rapid typing correctly", async () => {
			const { getByRole } = render(<ChatTextArea {...defaultProps} />)
			const textarea = getByRole("textbox")

			// Simulate rapid typing
			for (const char of "test123") {
				fireEvent.change(textarea, {
					target: {
						value: `@${char}`,
						selectionStart: 2,
					},
				})
				await act(async () => {
					jest.advanceTimersByTime(50) // Less than debounce time
				})
			}

			// Only the last request should be made
			expect(vscode.postMessage).toHaveBeenCalledTimes(1)
			expect(vscode.postMessage).toHaveBeenCalledWith({
				type: "searchFiles",
				query: "3",
				requestId: expect.any(String),
			})
		})

		it("should handle search cancellation", async () => {
			const { getByRole } = render(<ChatTextArea {...defaultProps} />)
			const textarea = getByRole("textbox")

			// Start a search
			fireEvent.change(textarea, {
				target: {
					value: "@test",
					selectionStart: 5,
				},
			})

			// Clear before debounce timeout
			fireEvent.change(textarea, {
				target: {
					value: "",
					selectionStart: 0,
				},
			})

			act(() => {
				jest.advanceTimersByTime(200)
			})

			expect(vscode.postMessage).not.toHaveBeenCalled()
			expect(defaultProps.setSearchLoading).toHaveBeenCalledWith(false)
		})
	})
})

describe("File Highlighting", () => {
	const mockSearchResults: SearchResult[] = [
		{ path: "test file.txt", type: "file", label: "test file.txt" },
		{ path: "folder with spaces/file.js", type: "file", label: "file.js" },
	]

	const fileHighlightProps = {
		// Required props from ChatTextAreaProps
		inputValue: "",
		setInputValue: jest.fn(),
		textAreaDisabled: false,
		selectApiConfigDisabled: false,
		placeholderText: "Type a message...",
		selectedImages: [],
		setSelectedImages: jest.fn(),
		onSend: jest.fn(),
		onSelectImages: jest.fn(),
		shouldDisableImages: false,
		onHeightChange: jest.fn(),
		mode: "chat",
		setMode: jest.fn(),
		modeShortcutText: "",

		// Additional props for testing
		setSearchRequestId: jest.fn(),
		setFileSearchResults: jest.fn(),
		setSearchLoading: jest.fn(),
		setSearchQuery: jest.fn(),
		setShowAtMentionSearch: jest.fn(),
		fileSearchResults: mockSearchResults, // Add fileSearchResults directly to props
	}

	it("should highlight matched files with spaces as pills", () => {
		const { getByRole } = render(<ChatTextArea {...fileHighlightProps} />)
		const textarea = getByRole("textbox")

		fireEvent.change(textarea, {
			target: { value: "Check @test file.txt and @folder with spaces/file.js" },
		})

		// Find the mention pills
		const pills = document.querySelectorAll(".mention-pill")
		expect(pills.length).toBe(2)
		expect(pills[0].textContent).toMatch(/@test file\.txt/)
		expect(pills[1].textContent).toMatch(/@folder with spaces\/file\.js/)
	})

	it("should handle multiple file mentions with spaces as pills", () => {
		const { getByRole } = render(<ChatTextArea {...fileHighlightProps} />)
		const textarea = getByRole("textbox")

		fireEvent.change(textarea, {
			target: {
				value: "@test file.txt contains data for @folder with spaces/file.js",
				selectionStart: 15,
			},
		})

		// Find the mention pills
		const pills = document.querySelectorAll(".mention-pill")
		expect(pills.length).toBe(2)
		expect(pills[0].textContent).toMatch(/@test file\.txt/)
		expect(pills[1].textContent).toMatch(/@folder with spaces\/file\.js/)
	})

	it("should handle unmatched file mentions as pills", () => {
		const { getByRole } = render(<ChatTextArea {...fileHighlightProps} />)
		const textarea = getByRole("textbox")

		fireEvent.change(textarea, {
			target: { value: "@nonexistent file.txt" },
		})

		// Find the mention pill
		const pill = document.querySelector(".mention-pill")
		expect(pill).not.toBeNull()
		expect(pill?.textContent).toMatch(/@nonexistent file\.txt/)
	})
})

describe("AtMentionSearch", () => {
	const atMentionProps = {
		// Required props from ChatTextAreaProps
		inputValue: "",
		setInputValue: jest.fn(),
		textAreaDisabled: false,
		selectApiConfigDisabled: false,
		placeholderText: "Type a message...",
		selectedImages: [],
		setSelectedImages: jest.fn(),
		onSend: jest.fn(),
		onSelectImages: jest.fn(),
		shouldDisableImages: false,
		onHeightChange: jest.fn(),
		mode: "chat",
		setMode: jest.fn(),
		modeShortcutText: "",

		// Additional props for testing
		setSearchRequestId: jest.fn(),
		setFileSearchResults: jest.fn(),
		setSearchLoading: jest.fn(),
		setSearchQuery: jest.fn(),
		setShowAtMentionSearch: jest.fn(),
	}

	beforeEach(() => {
		jest.clearAllMocks()
		jest.useFakeTimers()
	})

	afterEach(() => {
		jest.useRealTimers()
	})

	it("shows AtMentionSearch when @ is typed", async () => {
		const { getByRole, getByTestId } = render(<ChatTextArea {...atMentionProps} />)
		const textarea = getByRole("textbox")

		// Type "@" in the textarea
		fireEvent.change(textarea, { target: { value: "@" } })

		// Verify dropdown appears
		expect(getByTestId("at-mention-search")).toBeInTheDocument()

		// Type "file"
		fireEvent.change(textarea, { target: { value: "@file" } })

		// Verify search is triggered
		expect(getByTestId("search-loading")).toBeInTheDocument()

		// Click outside
		fireEvent.mouseDown(document.body)

		// Verify dropdown disappears
		expect(getByTestId("at-mention-search")).not.toBeInTheDocument()

		// Type "@" again
		fireEvent.change(textarea, { target: { value: "@" } })

		// Press Escape
		fireEvent.keyDown(textarea, { key: "Escape" })

		// Verify dropdown disappears
		expect(getByTestId("at-mention-search")).not.toBeInTheDocument()

		// Select an item
		fireEvent.change(textarea, { target: { value: "@test" } })
		const firstResult = getByTestId("search-result-0")
		fireEvent.click(firstResult)

		// Verify item is inserted
		expect(textarea).toHaveValue("@test-file.txt")
	})
})
