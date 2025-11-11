import React, { useState, useEffect } from "react"
import { useAppTranslation } from "@src/i18n/TranslationContext"
import type { RetrySettings } from "../../types/retry"
import { vscode } from "../../utils/vscode"
import { RetrySettingsPanel } from "./RetrySettings"

interface RetrySettingsIntegrationProps {
	className?: string
	onSettingsChange?: (settings: RetrySettings) => void
}

export const RetrySettingsIntegration: React.FC<RetrySettingsIntegrationProps> = ({
	className = "",
	onSettingsChange,
}) => {
	const { t } = useAppTranslation()
	const [settings, setSettings] = useState<RetrySettings>({
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
	const [saveStatus, setSaveStatus] = useState<{
		saved: boolean
		error?: string
	}>({ saved: false })

	// Load settings from backend on mount
	useEffect(() => {
		vscode.postMessage({
			type: "retry-get-settings",
		})
	}, [])

	// Handle settings updates from backend
	useEffect(() => {
		const handleMessage = (event: MessageEvent) => {
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

	const handleSettingsChange = (newSettings: RetrySettings) => {
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
			const defaultSettings: RetrySettings = {
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
			const file = (event.target as HTMLInputElement).files?.[0]
			if (file) {
				const reader = new FileReader()
				reader.onload = (e) => {
					try {
						const importedSettings = JSON.parse(e.target?.result as string)
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

	return (
		<div className={`space-y-4 ${className}`}>
			{/* Save Status Indicator */}
			{saveStatus.error && (
				<div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md mb-4">
					<div className="flex items-center gap-2">
						<span className="text-red-800 dark:text-red-200">⚠️ {saveStatus.error}</span>
						<button
							onClick={() => setSaveStatus({ saved: false })}
							className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200">
							×
						</button>
					</div>
				</div>
			)}

			{saveStatus.saved && (
				<div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md mb-4">
					<div className="flex items-center gap-2">
						<span className="text-green-800 dark:text-green-200">✓ {t("retry.saveSuccess")}</span>
						<button
							onClick={() => setSaveStatus({ saved: false })}
							className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200">
							×
						</button>
					</div>
				</div>
			)}

			{/* Settings Form */}
			<RetrySettingsPanel settings={settings} onSettingsChange={handleSettingsChange} className="mb-6" />

			{/* Action Buttons */}
			<div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
				<button
					onClick={handleTestSettings}
					disabled={isLoading}
					className="px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900 rounded hover:bg-blue-200 dark:hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
					{isLoading ? t("retry.testSettings") : t("retry.testSettings")}
				</button>

				<button
					onClick={handleExportSettings}
					className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-900 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
					{t("retry.exportSettings")}
				</button>

				<button
					onClick={handleImportSettings}
					className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-900 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
					{t("retry.importSettings")}
				</button>

				<button
					onClick={handleResetToDefaults}
					className="px-4 py-2 text-sm font-medium text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900 rounded hover:bg-red-200 dark:hover:bg-red-800 transition-colors">
					{t("retry.resetToDefaults")}
				</button>
			</div>

			{/* Settings Info */}
			<div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-md">
				<h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
					{t("retry.settingsInfo.title")}
				</h3>
				<div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
					<p>{t("retry.settingsInfo.description")}</p>
					<ul className="list-disc list-inside space-y-1 ml-4">
						<li>{t("retry.settingsInfo.persistence")}</li>
						<li>{t("retry.settingsInfo.validation")}</li>
						<li>{t("retry.settingsInfo.performance")}</li>
						<li>{t("retry.settingsInfo.compatibility")}</li>
					</ul>
				</div>
			</div>
		</div>
	)
}
