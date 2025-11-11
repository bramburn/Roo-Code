import { jsx as _jsx } from "react/jsx-runtime"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./App"
import "../node_modules/@vscode/codicons/dist/codicon.css"
import { getHighlighter } from "./utils/highlighter"
// Initialize Shiki early to hide initialization latency (async)
getHighlighter().catch((error) => console.error("Failed to initialize Shiki highlighter:", error))
createRoot(document.getElementById("root")).render(_jsx(StrictMode, { children: _jsx(App, {}) }))
//# sourceMappingURL=index.js.map
