import { config } from "@roo-code/config-eslint/base"

/** @type {import("eslint").Linter.Config} */
export default [
	...config,
	{
		languageOptions: {
			globals: {
				// Node.js globals
				console: "readonly",
				process: "readonly",
				__dirname: "readonly",
				__filename: "readonly",
				Buffer: "readonly",
				global: "readonly",
				module: "writable",
				exports: "writable",
				require: "readonly",
				setTimeout: "readonly",
				clearTimeout: "readonly",
				setInterval: "readonly",
				clearInterval: "readonly",
				setImmediate: "readonly",
				clearImmediate: "readonly",
				URL: "readonly",
				URLSearchParams: "readonly",
				fetch: "readonly",
				AbortController: "readonly",
				AbortSignal: "readonly",
				TextDecoder: "readonly",
				TextEncoder: "readonly",
				atob: "readonly",
				btoa: "readonly",
				// VSCode globals
				window: "readonly",
				document: "readonly",
			},
		},
		rules: {
			// TODO: These should be fixed and the rules re-enabled.
			"no-regex-spaces": "off",
			"no-useless-escape": "off",
			"no-empty": "off",
			"prefer-const": "off",

			"@typescript-eslint/no-unused-vars": "off",
			"@typescript-eslint/no-explicit-any": "off",
			"@typescript-eslint/no-require-imports": "off",
			"@typescript-eslint/ban-ts-comment": "off",
			// LangChain compatibility rules
			"no-console": "off", // LangChain uses console logging
		},
	},
	{
		files: ["core/assistant-message/presentAssistantMessage.ts", "core/webview/webviewMessageHandler.ts"],
		rules: {
			"no-case-declarations": "off",
		},
	},
	{
		files: ["__mocks__/**/*.js"],
		rules: {
			"no-undef": "off",
		},
	},
	{
		files: ["**/__tests__/**/*.js", "**/__tests__/**/*.ts", "**/*.test.js", "**/*.test.ts", "**/*.spec.js", "**/*.spec.ts"],
		languageOptions: {
			globals: {
				// Test globals
				describe: "readonly",
				it: "readonly",
				test: "readonly",
				expect: "readonly",
				beforeAll: "readonly",
				afterAll: "readonly",
				beforeEach: "readonly",
				afterEach: "readonly",
				jest: "readonly",
				vi: "readonly",
				// Node.js globals (redundant but explicit)
				require: "readonly",
				console: "readonly",
				process: "readonly",
				__dirname: "readonly",
				__filename: "readonly",
				module: "writable",
				exports: "writable",
			},
		},
	},
	{
		files: ["api/index.js"],
		rules: {
			"@typescript-eslint/no-unused-expressions": "off",
		},
	},
	{
		ignores: ["webview-ui", "out"],
	},
]
