import React, { forwardRef } from "react"
import "./MentionHighlighter.css"

interface MentionHighlighterProps {
	text: string
	className?: string
}

/**
 * Component that renders text with @ mentions highlighted as pills
 */
const MentionHighlighter = forwardRef<HTMLDivElement, MentionHighlighterProps>(({ text, className = "" }, ref) => {
	// Render the highlighted text with pills for mentions
	const renderHighlightedText = () => {
		// Simple regex to find @mentions - this is a simplified version for the test environment
		const mentionRegex = /(@[\w/.-]+)/g

		// Split the text by mentions
		const parts = text.split(mentionRegex)

		return (
			<>
				{parts.map((part, index) => {
					if (part.startsWith("@")) {
						// This is a mention, render as a pill
						return (
							<span key={index} className="mention-pill" data-testid="mention-pill">
								{part}
							</span>
						)
					}
					return <span key={index}>{part}</span>
				})}
			</>
		)
	}

	return (
		<div ref={ref} className={`mention-highlighted-text ${className}`} data-testid="mention-highlighter">
			{renderHighlightedText()}
		</div>
	)
})

export default MentionHighlighter
