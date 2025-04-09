import React from "react"
import { render, screen } from "@testing-library/react"
import MentionHighlighter from "../MentionHighlighter"

describe("MentionHighlighter", () => {
	it("renders text without mentions", () => {
		render(<MentionHighlighter text="Hello world" />)
		expect(screen.getByText("Hello world")).toBeInTheDocument()
	})

	it("renders text with a single mention", () => {
		render(<MentionHighlighter text="Check out @file.txt" />)

		// The mention should be rendered as a pill
		const pill = screen.getByTestId("mention-pill")
		expect(pill).toBeInTheDocument()
		expect(pill).toHaveTextContent("@file.txt")
		expect(pill).toHaveClass("mention-pill")
	})

	it("renders text with multiple mentions", () => {
		render(<MentionHighlighter text="Check @file.txt and @folder/other.js" />)

		// Both mentions should be rendered as pills
		const pills = screen.getAllByTestId("mention-pill")
		expect(pills).toHaveLength(2)
		expect(pills[0]).toHaveTextContent("@file.txt")
		expect(pills[1]).toHaveTextContent("@folder/other.js")
		expect(pills[0]).toHaveClass("mention-pill")
		expect(pills[1]).toHaveClass("mention-pill")
	})

	it("renders text with mentions and regular text", () => {
		render(<MentionHighlighter text="Hello @world and regular text" />)

		// The mention should be rendered as a pill
		const pill = screen.getByTestId("mention-pill")
		expect(pill).toHaveTextContent("@world")
		expect(pill).toHaveClass("mention-pill")

		// Regular text should be rendered normally
		expect(screen.getByText(/Hello/)).toBeInTheDocument()
		expect(screen.getByText(/and regular text/)).toBeInTheDocument()
	})

	it("applies additional className when provided", () => {
		render(<MentionHighlighter text="Hello @world" className="custom-class" />)

		// The container should have the custom class
		const container = screen.getByTestId("mention-highlighter")
		expect(container).toHaveClass("mention-highlighted-text")
		expect(container).toHaveClass("custom-class")
	})
})
