import React, { useRef, useEffect, useCallback } from "react"
import { ContextMenuOptionType, SearchResult } from "@/utils/context-mentions"
import { useAppTranslation } from "@/i18n/TranslationContext"
import { cn } from "@/lib/utils"
import { Search, Folder, File, Loader2 } from "lucide-react"

interface AtMentionSearchProps {
	searchQuery: string
	onSelect: (type: ContextMenuOptionType, value?: string) => void
	searchResults: SearchResult[]
	loading: boolean
	onSearchChange?: (query: string) => void
}

const AtMentionSearch: React.FC<AtMentionSearchProps> = ({
	searchQuery,
	onSelect,
	searchResults,
	loading,
	onSearchChange,
}) => {
	const { t } = useAppTranslation()
	const searchInputRef = useRef<HTMLInputElement>(null)
	const [selectedIndex, setSelectedIndex] = React.useState(0)

	// Focus the search input when the component mounts
	useEffect(() => {
		// Use a small timeout to ensure the input is focused after rendering
		const focusTimer = setTimeout(() => {
			if (searchInputRef.current) {
				searchInputRef.current.focus()
			}
		}, 10)

		return () => clearTimeout(focusTimer)
	}, [])

	const handleSelect = useCallback(
		(result: SearchResult) => {
			const type = result.type === "folder" ? ContextMenuOptionType.Folder : ContextMenuOptionType.File
			const value = result.path.startsWith("/") ? result.path : `/${result.path}`
			onSelect(type, value)
		},
		[onSelect],
	)

	// Add keyboard navigation
	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (loading || searchResults.length === 0) return

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
			}
		},
		[loading, searchResults, selectedIndex, handleSelect],
	)

	return (
		<div
			className={cn(
				"at-mention-search",
				"absolute z-50 w-[300px] rounded-md border bg-popover p-1 shadow-md",
				"animate-in fade-in-0 zoom-in-95",
				"top-full left-0 mt-1",
			)}
			data-testid="at-mention-search"
			onKeyDown={handleKeyDown}
			tabIndex={0}>
			<div className="search-input-container flex items-center border-b px-3">
				<input
					ref={searchInputRef}
					value={searchQuery}
					onChange={(e) => onSearchChange?.(e.target.value)}
					placeholder={t("chat:searchFiles")}
					className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none"
					data-testid="search-input"
					autoFocus
				/>
				<Search className="search-icon mr-2 h-4 w-4 shrink-0 opacity-50" />
			</div>
			<div className="search-results">
				{loading ? (
					<div className="loading p-4 text-center text-sm" data-testid="loading-indicator">
						<Loader2 className="loader-icon animate-spin" />
						<span>{t("chat:loading")}</span>
					</div>
				) : searchResults.length === 0 ? (
					<div className="no-results p-4 text-center text-sm" data-testid="no-results">
						{t("chat:noResultsFound")}
					</div>
				) : (
					<ul className="results-list">
						{searchResults.map((result, index) => (
							<li
								key={result.path}
								onClick={() => handleSelect(result)}
								className={cn(
									"result-item flex items-center px-2 py-1.5 text-sm",
									"cursor-pointer rounded-sm",
									"hover:bg-accent hover:text-accent-foreground",
									index === selectedIndex && "bg-accent text-accent-foreground",
								)}
								data-testid={`result-${result.path}`}>
								{result.type === "folder" ? (
									<Folder className="folder-icon mr-2 h-4 w-4" />
								) : (
									<File className="file-icon mr-2 h-4 w-4" />
								)}
								<span className="result-label">{result.label || result.path}</span>
							</li>
						))}
					</ul>
				)}
			</div>
		</div>
	)
}

export default AtMentionSearch
