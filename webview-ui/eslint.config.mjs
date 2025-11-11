import { reactConfig } from "@roo-code/config-eslint/react"

/** @type {import("eslint").Linter.Config} */
export default [
	...reactConfig,
	{
		languageOptions: {
			globals: {
				// Browser globals
				window: "readonly",
				document: "readonly",
				navigator: "readonly",
				localStorage: "readonly",
				sessionStorage: "readonly",
				location: "readonly",
				history: "readonly",
				fetch: "readonly",
				setTimeout: "readonly",
				clearTimeout: "readonly",
				setInterval: "readonly",
				clearInterval: "readonly",
				requestAnimationFrame: "readonly",
				cancelAnimationFrame: "readonly",
				HTMLElement: "readonly",
				HTMLInputElement: "readonly",
				HTMLDivElement: "readonly",
				Element: "readonly",
				Node: "readonly",
				Event: "readonly",
				XMLSerializer: "readonly",
				Image: "readonly",
				ResizeObserver: "readonly",
				getComputedStyle: "readonly",
				confirm: "readonly",
				alert: "readonly",
				// Node.js globals
				process: "readonly",
				Buffer: "readonly",
				__dirname: "readonly",
				__filename: "readonly",
				// VSCode webview API
				acquireVsCodeApi: "readonly",
				// Other web globals
				console: "readonly",
			},
		},
		rules: {
			"@typescript-eslint/no-unused-vars": [
				"error",
				{
					args: "all",
					ignoreRestSiblings: true,
					varsIgnorePattern: "^_",
					argsIgnorePattern: "^_",
					caughtErrorsIgnorePattern: "^_",
				},
			],
			"@typescript-eslint/no-explicit-any": "off",
			"react/prop-types": "off",
			"react/display-name": "off",
		},
	},
	{
		files: ["src/components/chat/ChatRow.tsx", "src/components/settings/ModelInfoView.tsx"],
		rules: {
			"react/jsx-key": "off",
		},
	},
	{
		files: [
			"src/components/chat/ChatRow.tsx",
			"src/components/chat/ChatView.tsx",
			"src/components/chat/BrowserSessionRow.tsx",
			"src/components/history/useTaskSearch.ts",
			"src/components/chat/ChatRow.js",
			"src/components/chat/ChatView.js",
			"src/components/chat/BrowserSessionRow.js",
			"src/components/history/useTaskSearch.js",
		],
		rules: {
			"no-case-declarations": "off",
		},
	},
	{
		files: ["**/*.js"],
		rules: {
			"no-undef": "off",
		},
	},
	{
		files: ["src/components/ui/hooks/useSelectedModel.js"],
		rules: {
			"@typescript-eslint/no-unused-expressions": "off",
		},
	},
	{
		files: ["src/__mocks__/**/*.js"],
		rules: {
			"no-undef": "off",
		},
	},
]
