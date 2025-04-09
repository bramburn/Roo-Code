import { useState } from "react"
import "./App.css"
import MentionTextArea, { SearchResult } from "./components/MentionTextArea"

// Mock search results for demonstration
const mockSearchResults: SearchResult[] = [
	{ path: "src/components/Button.tsx", type: "file", label: "Button.tsx" },
	{ path: "src/components/Input.tsx", type: "file", label: "Input.tsx" },
	{ path: "src/utils", type: "folder", label: "utils" },
	{ path: "src/hooks/useDebounce.ts", type: "file", label: "useDebounce.ts" },
	{ path: "src/App.tsx", type: "file", label: "App.tsx" },
	{ path: "src/main.tsx", type: "file", label: "main.tsx" },
	{ path: "public", type: "folder", label: "public" },
	{ path: "package.json", type: "file", label: "package.json" },
	{ path: "tsconfig.json", type: "file", label: "tsconfig.json" },
	{ path: "README.md", type: "file", label: "README.md" },
]

function App() {
	const [inputValue, setInputValue] = useState("")

	return (
		<div className="app">
			<h1>@ Mention TextArea Demo</h1>
			<p>Type @ to mention a file or folder</p>

			<div className="textarea-container">
				<MentionTextArea
					value={inputValue}
					onChange={setInputValue}
					placeholder="Type @ to mention a file or folder..."
					mockSearchResults={mockSearchResults}
				/>
			</div>

			<div className="instructions">
				<h2>Instructions:</h2>
				<ul>
					<li>
						Type <code>@</code> to trigger the file/folder search
					</li>
					<li>Start typing to filter the results</li>
					<li>Use up/down arrow keys to navigate the results</li>
					<li>Press Enter or click on a result to select it</li>
					<li>Selected files/folders will appear as highlighted pills</li>
				</ul>
			</div>

			<div className="value-display">
				<h3>Current Value:</h3>
				<pre>{inputValue}</pre>
			</div>
		</div>
	)
}

export default App
