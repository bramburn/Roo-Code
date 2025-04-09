import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import AtMentionSearch from "../AtMentionSearch"
import { ContextMenuOptionType, SearchResult } from "@/utils/context-mentions"

describe("AtMentionSearch", () => {
	const mockOnSelect = jest.fn()
	const mockSearchResults: SearchResult[] = [
		{ path: "file1.ts", type: "file", label: "file1.ts" },
		{ path: "folder1", type: "folder", label: "folder1" },
	]

	beforeEach(() => {
		jest.clearAllMocks()
	})

	it("renders search input", () => {
		render(
			<AtMentionSearch
				searchQuery=""
				onSelect={mockOnSelect}
				searchResults={mockSearchResults}
				loading={false}
			/>,
		)

		expect(screen.getByTestId("search-input")).toBeInTheDocument()
	})

	it("displays loading state", () => {
		render(<AtMentionSearch searchQuery="" onSelect={mockOnSelect} searchResults={[]} loading={true} />)

		expect(screen.getByTestId("loading-indicator")).toBeInTheDocument()
	})

	it("displays search results", () => {
		render(
			<AtMentionSearch
				searchQuery="file"
				onSelect={mockOnSelect}
				searchResults={mockSearchResults}
				loading={false}
			/>,
		)

		expect(screen.getByText("file1.ts")).toBeInTheDocument()
		expect(screen.getByText("folder1")).toBeInTheDocument()
	})

	it("displays no results message when no results are found", () => {
		render(<AtMentionSearch searchQuery="nonexistent" onSelect={mockOnSelect} searchResults={[]} loading={false} />)

		expect(screen.getByTestId("no-results")).toBeInTheDocument()
	})

	it("calls onSelect when a result is clicked", () => {
		render(
			<AtMentionSearch
				searchQuery="file"
				onSelect={mockOnSelect}
				searchResults={mockSearchResults}
				loading={false}
			/>,
		)

		fireEvent.click(screen.getByText("file1.ts"))
		expect(mockOnSelect).toHaveBeenCalledWith(ContextMenuOptionType.File, "/file1.ts")
	})
})
