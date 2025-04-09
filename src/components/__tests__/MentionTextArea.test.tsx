import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import MentionTextArea, { SearchResult } from "../MentionTextArea"

// Mock search results for testing
const mockSearchResults: SearchResult[] = [
	{ path: "src/components/Button.tsx", type: "file", label: "Button.tsx" },
	{ path: "src/components/Input.tsx", type: "file", label: "Input.tsx" },
	{ path: "src/utils", type: "folder", label: "utils" },
	{ path: "src/hooks/useDebounce.ts", type: "file", label: "useDebounce.ts" },
]

describe("MentionTextArea", () => {
	it("renders the textarea with placeholder", () => {
		const handleChange = jest.fn()
		render(<MentionTextArea value="" onChange={handleChange} placeholder="Test placeholder" />)

		expect(screen.getByPlaceholderText("Test placeholder")).toBeInTheDocument()
	})

	it("calls onChange when typing in the textarea", () => {
		const handleChange = jest.fn()
		render(<MentionTextArea value="" onChange={handleChange} />)

		const textarea = screen.getByTestId("mention-textarea")
		fireEvent.change(textarea, { target: { value: "Hello world" } })

		expect(handleChange).toHaveBeenCalledWith("Hello world")
	})

	it("shows search dropdown when typing @", async () => {
		const handleChange = jest.fn()
		render(<MentionTextArea value="@" onChange={handleChange} mockSearchResults={mockSearchResults} />)

		// The dropdown should be visible
		await waitFor(() => {
			expect(screen.getByTestId("search-dropdown")).toBeInTheDocument()
		})
	})

	it("filters search results based on query", async () => {
		const handleChange = jest.fn()
		render(<MentionTextArea value="@Button" onChange={handleChange} mockSearchResults={mockSearchResults} />)

		// The dropdown should be visible
		await waitFor(() => {
			expect(screen.getByTestId("search-dropdown")).toBeInTheDocument()
		})

		// Only Button.tsx should be in the results
		expect(screen.getByText("Button.tsx")).toBeInTheDocument()
		expect(screen.queryByText("Input.tsx")).not.toBeInTheDocument()
	})

	it("selects a result when clicking on it", async () => {
		const handleChange = jest.fn()
		render(<MentionTextArea value="@" onChange={handleChange} mockSearchResults={mockSearchResults} />)

		// The dropdown should be visible
		await waitFor(() => {
			expect(screen.getByTestId("search-dropdown")).toBeInTheDocument()
		})

		// Click on the first result
		fireEvent.click(screen.getByText("Button.tsx"))

		// The onChange should be called with the selected item
		expect(handleChange).toHaveBeenCalledWith("@Button.tsx ")
	})

	it("supports keyboard navigation in search results", async () => {
		const handleChange = jest.fn()
		const { container } = render(
			<MentionTextArea value="@" onChange={handleChange} mockSearchResults={mockSearchResults} />,
		)

		// The dropdown should be visible
		await waitFor(() => {
			expect(screen.getByTestId("search-dropdown")).toBeInTheDocument()
		})

		// The first item should be selected by default
		expect(screen.getByTestId("result-0")).toHaveClass("selected")

		// Press down arrow to select the second item
		const searchDropdown = screen.getByTestId("search-dropdown")
		fireEvent.keyDown(searchDropdown, { key: "ArrowDown" })

		// The second item should now be selected
		expect(screen.getByTestId("result-1")).toHaveClass("selected")

		// Press Enter to select the item
		fireEvent.keyDown(searchDropdown, { key: "Enter" })

		// The onChange should be called with the selected item
		expect(handleChange).toHaveBeenCalledWith("@Input.tsx ")
	})

	it("renders mentions as pills", () => {
		const handleChange = jest.fn()
		render(<MentionTextArea value="Check out @Button.tsx and @utils" onChange={handleChange} />)

		// Both mentions should be rendered as pills
		const pills = screen.getAllByText(/^@/)
		expect(pills).toHaveLength(2)
		expect(pills[0]).toHaveTextContent("@Button.tsx")
		expect(pills[1]).toHaveTextContent("@utils")
		expect(pills[0]).toHaveClass("mention-pill")
		expect(pills[1]).toHaveClass("mention-pill")
	})

	it("closes the dropdown when pressing Escape", async () => {
		const handleChange = jest.fn()
		render(<MentionTextArea value="@" onChange={handleChange} mockSearchResults={mockSearchResults} />)

		// The dropdown should be visible
		await waitFor(() => {
			expect(screen.getByTestId("search-dropdown")).toBeInTheDocument()
		})

		// Press Escape
		const searchDropdown = screen.getByTestId("search-dropdown")
		fireEvent.keyDown(searchDropdown, { key: "Escape" })

		// The dropdown should be hidden
		await waitFor(() => {
			expect(screen.queryByTestId("search-dropdown")).not.toBeInTheDocument()
		})
	})
})
