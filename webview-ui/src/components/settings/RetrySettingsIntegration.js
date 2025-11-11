import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime"
import { useState, useEffect } from "react"
import { useAppTranslation } from "@src/i18n/TranslationContext"
import { vscode } from "../../utils/vscode"
import { RetrySettingsPanel } from "./RetrySettings"
export const RetrySettingsIntegration = ({ className = "", onSettingsChange }) => {
	const { t } = useAppTranslation()
	const [settings, setSettings] = useState({
		enabled: true,
		maxAttempts: 3,
		baseDelay: 1000,
		maxDelay: 30000,
		backoffStrategy: "exponential",
		jitterFactor: 0.1,
		circuitBreakerThreshold: 5,
		circuitBreakerResetTime: 60000,
		contextOptimizationEnabled: true,
		contextOptimizationThreshold: 4000,
	})
	const [isLoading, setIsLoading] = useState(false)
	const [saveStatus, setSaveStatus] = useState({ saved: false })
	// Load settings from backend on mount
	useEffect(() => {
		vscode.postMessage({
			type: "retry-get-settings",
		})
	}, [])
	// Handle settings updates from backend
	useEffect(() => {
		const handleMessage = (event) => {
			const message = event.data
			switch (message.type) {
				case "retry-settings-loaded":
					if (message.settings) {
						setSettings(message.settings)
					}
					break
				case "retry-settings-saved":
					setIsLoading(false)
					setSaveStatus({ saved: true })
					setTimeout(() => setSaveStatus({ saved: false }), 2000)
					break
				case "retry-settings-error":
					setIsLoading(false)
					setSaveStatus({ saved: false, error: message.error })
					setTimeout(() => setSaveStatus({ saved: false }), 3000)
					break
			}
		}
		window.addEventListener("message", handleMessage)
		return () => window.removeEventListener("message", handleMessage)
	}, [])
	const handleSettingsChange = (newSettings) => {
		setSettings(newSettings)
		onSettingsChange?.(newSettings)
		// Auto-save settings with debouncing
		setIsLoading(true)
		setSaveStatus({ saved: false })
		vscode.postMessage({
			type: "retry-update-settings",
			settings: newSettings,
		})
	}
	const handleResetToDefaults = () => {
		if (confirm(t("retry.resetToDefaults"))) {
			const defaultSettings = {
				enabled: true,
				maxAttempts: 3,
				baseDelay: 1000,
				maxDelay: 30000,
				backoffStrategy: "exponential",
				jitterFactor: 0.1,
				circuitBreakerThreshold: 5,
				circuitBreakerResetTime: 60000,
				contextOptimizationEnabled: true,
				contextOptimizationThreshold: 4000,
			}
			handleSettingsChange(defaultSettings)
		}
	}
	const handleExportSettings = () => {
		vscode.postMessage({
			type: "retry-export-settings",
			settings,
		})
	}
	const handleImportSettings = () => {
		const input = document.createElement("input")
		input.type = "file"
		input.accept = ".json"
		input.onchange = (event) => {
			const file = event.target.files?.[0]
			if (file) {
				const reader = new FileReader()
				reader.onload = (e) => {
					try {
						const importedSettings = JSON.parse(e.target?.result)
						handleSettingsChange(importedSettings)
					} catch (_error) {
						setSaveStatus({
							saved: false,
							error: t("retry.invalidSettingsFile"),
						})
					}
				}
				reader.readAsText(file)
			}
		}
		input.click()
	}
	const handleTestSettings = () => {
		setIsLoading(true)
		vscode.postMessage({
			type: "retry-test-settings",
			settings,
		})
	}
	return _jsxs("div", {
		className: `space-y-4 ${className}`,
		children: [
			saveStatus.error &&
				_jsx("div", {
					className:
						"p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md mb-4",
					children: _jsxs("div", {
						className: "flex items-center gap-2",
						children: [
							_jsxs("span", {
								className: "text-red-800 dark:text-red-200",
								children: ["\u26A0\uFE0F ", saveStatus.error],
							}),
							_jsx("button", {
								onClick: () => setSaveStatus({ saved: false }),
								className: "text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200",
								children: "\u00D7",
							}),
						],
					}),
				}),
			saveStatus.saved &&
				_jsx("div", {
					className:
						"p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md mb-4",
					children: _jsxs("div", {
						className: "flex items-center gap-2",
						children: [
							_jsxs("span", {
								className: "text-green-800 dark:text-green-200",
								children: ["\u2713 ", t("retry.saveSuccess")],
							}),
							_jsx("button", {
								onClick: () => setSaveStatus({ saved: false }),
								className:
									"text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200",
								children: "\u00D7",
							}),
						],
					}),
				}),
			_jsx(RetrySettingsPanel, { settings: settings, onSettingsChange: handleSettingsChange, className: "mb-6" }),
			_jsxs("div", {
				className: "flex flex-wrap gap-3 pt-4 border-t border-gray-200 dark:border-gray-700",
				children: [
					_jsx("button", {
						onClick: handleTestSettings,
						disabled: isLoading,
						className:
							"px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900 rounded hover:bg-blue-200 dark:hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
						children: isLoading ? t("retry.testSettings") : t("retry.testSettings"),
					}),
					_jsx("button", {
						onClick: handleExportSettings,
						className:
							"px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-900 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors",
						children: t("retry.exportSettings"),
					}),
					_jsx("button", {
						onClick: handleImportSettings,
						className:
							"px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-900 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors",
						children: t("retry.importSettings"),
					}),
					_jsx("button", {
						onClick: handleResetToDefaults,
						className:
							"px-4 py-2 text-sm font-medium text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900 rounded hover:bg-red-200 dark:hover:bg-red-800 transition-colors",
						children: t("retry.resetToDefaults"),
					}),
				],
			}),
			_jsxs("div", {
				className:
					"mt-6 p-4 bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-md",
				children: [
					_jsx("h3", {
						className: "text-sm font-medium text-gray-900 dark:text-gray-100 mb-2",
						children: t("retry.settingsInfo.title"),
					}),
					_jsxs("div", {
						className: "space-y-2 text-sm text-gray-600 dark:text-gray-400",
						children: [
							_jsx("p", { children: t("retry.settingsInfo.description") }),
							_jsxs("ul", {
								className: "list-disc list-inside space-y-1 ml-4",
								children: [
									_jsx("li", { children: t("retry.settingsInfo.persistence") }),
									_jsx("li", { children: t("retry.settingsInfo.validation") }),
									_jsx("li", { children: t("retry.settingsInfo.performance") }),
									_jsx("li", { children: t("retry.settingsInfo.compatibility") }),
								],
							}),
						],
					}),
				],
			}),
		],
	})
}
//# sourceMappingURL=RetrySettingsIntegration.js.map
