import React from "react"
import { Settings, Info, RotateCcw, Zap, Shield, Database, Clock } from "lucide-react"
import { RetrySettings } from "../../types/retry"
import { vscode } from "../../utils/vscode"

interface RetrySettingsPanelProps {
	settings: RetrySettings
	onSettingsChange: (settings: RetrySettings) => void
	className?: string
}

export const RetrySettingsPanel: React.FC<RetrySettingsPanelProps> = ({
	settings,
	onSettingsChange,
	className = "",
}) => {
	const handleSettingChange = (key: keyof RetrySettings, value: any) => {
		onSettingsChange({
			...settings,
			[key]: value,
		})
	}

	const SettingField: React.FC<{
		label: string
		value: any
		onChange: (value: any) => void
		type?: "number" | "select" | "toggle"
		min?: number
		max?: number
		step?: number
		options?: { value: string; label: string }[]
		tooltip?: string
		icon?: React.ReactNode
	}> = ({ label, value, onChange, type = "number", min, max, step = 1, options, tooltip, icon }) => (
		<div className="flex flex-col gap-1">
			<div className="flex items-center gap-2">
				{icon && <span className="w-4 h-4 text-gray-500">{icon}</span>}
				<label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
				{tooltip && (
					<div className="group relative">
						<Info className="w-3 h-3 text-gray-400 cursor-help" />
						<div className="absolute left-0 top-5 z-10 hidden w-64 p-2 text-xs bg-gray-900 text-white rounded shadow-lg group-hover:block">
							{tooltip}
						</div>
					</div>
				)}
			</div>

			{type === "toggle" && (
				<button
					onClick={() => onChange(!value)}
					className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
						value ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"
					}`}>
					<span
						className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
							value ? "translate-x-6" : "translate-x-1"
						}`}
					/>
				</button>
			)}

			{type === "number" && (
				<input
					type="number"
					value={value}
					onChange={(e) => onChange(Number(e.target.value))}
					min={min}
					max={max}
					step={step}
					className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			)}

			{type === "select" && options && (
				<select
					value={value}
					onChange={(e) => onChange(e.target.value)}
					className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
					{options.map((option) => (
						<option key={option.value} value={option.value}>
							{option.label}
						</option>
					))}
				</select>
			)}
		</div>
	)

	return (
		<div className={`p-6 bg-white dark:bg-gray-800 rounded-lg border ${className}`}>
			<div className="flex items-center gap-2 mb-6">
				<Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
				<h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Retry Configuration</h2>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				{/* Basic Settings */}
				<div className="space-y-4">
					<h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Basic Settings</h3>

					<SettingField
						label="Enable Retry Mechanism"
						value={settings.enabled}
						onChange={(value) => handleSettingChange("enabled", value)}
						type="toggle"
						tooltip="Enable or disable the automatic retry mechanism for failed tool calls"
						icon={<RotateCcw className="w-4 h-4" />}
					/>

					<SettingField
						label="Maximum Attempts"
						value={settings.maxAttempts}
						onChange={(value) => handleSettingChange("maxAttempts", value)}
						type="number"
						min={1}
						max={10}
						tooltip="Maximum number of retry attempts for failed tool calls"
						icon={<RotateCcw className="w-4 h-4" />}
					/>

					<SettingField
						label="Base Delay (ms)"
						value={settings.baseDelay}
						onChange={(value) => handleSettingChange("baseDelay", value)}
						type="number"
						min={100}
						max={10000}
						step={100}
						tooltip="Initial delay between retry attempts in milliseconds"
						icon={<Clock className="w-4 h-4" />}
					/>

					<SettingField
						label="Maximum Delay (ms)"
						value={settings.maxDelay}
						onChange={(value) => handleSettingChange("maxDelay", value)}
						type="number"
						min={1000}
						max={60000}
						step={1000}
						tooltip="Maximum delay between retry attempts in milliseconds"
						icon={<Clock className="w-4 h-4" />}
					/>
				</div>

				{/* Advanced Settings */}
				<div className="space-y-4">
					<h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Advanced Settings</h3>

					<SettingField
						label="Backoff Strategy"
						value={settings.backoffStrategy}
						onChange={(value) => handleSettingChange("backoffStrategy", value)}
						type="select"
						options={[
							{ value: "exponential", label: "Exponential" },
							{ value: "linear", label: "Linear" },
							{ value: "fixed", label: "Fixed" },
						]}
						tooltip="Strategy for calculating delay between retry attempts"
						icon={<Zap className="w-4 h-4" />}
					/>

					<SettingField
						label="Jitter Factor"
						value={settings.jitterFactor}
						onChange={(value) => handleSettingChange("jitterFactor", value)}
						type="number"
						min={0}
						max={1}
						step={0.1}
						tooltip="Randomization factor to prevent thundering herd problems (0-1)"
						icon={<Zap className="w-4 h-4" />}
					/>
				</div>

				{/* Circuit Breaker Settings */}
				<div className="space-y-4">
					<h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Circuit Breaker</h3>

					<SettingField
						label="Failure Threshold"
						value={settings.circuitBreakerThreshold}
						onChange={(value) => handleSettingChange("circuitBreakerThreshold", value)}
						type="number"
						min={1}
						max={20}
						tooltip="Number of consecutive failures before circuit breaker opens"
						icon={<Shield className="w-4 h-4" />}
					/>

					<SettingField
						label="Reset Time (ms)"
						value={settings.circuitBreakerResetTime}
						onChange={(value) => handleSettingChange("circuitBreakerResetTime", value)}
						type="number"
						min={10000}
						max={300000}
						step={10000}
						tooltip="Time to wait before attempting to reset the circuit breaker"
						icon={<Clock className="w-4 h-4" />}
					/>
				</div>

				{/* Context Optimization Settings */}
				<div className="space-y-4">
					<h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Context Optimization</h3>

					<SettingField
						label="Enable Context Optimization"
						value={settings.contextOptimizationEnabled}
						onChange={(value) => handleSettingChange("contextOptimizationEnabled", value)}
						type="toggle"
						tooltip="Automatically optimize context to reduce token usage during retries"
						icon={<Database className="w-4 h-4" />}
					/>

					<SettingField
						label="Optimization Threshold"
						value={settings.contextOptimizationThreshold}
						onChange={(value) => handleSettingChange("contextOptimizationThreshold", value)}
						type="number"
						min={1000}
						max={10000}
						step={100}
						tooltip="Token count threshold for triggering context optimization"
						icon={<Database className="w-4 h-4" />}
					/>
				</div>
			</div>

			{/* Action Buttons */}
			<div className="flex gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
				<button
					onClick={() => {
						vscode.postMessage({
							type: "retry-settings-reset",
						})
					}}
					className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
					Reset to Defaults
				</button>

				<button
					onClick={() => {
						vscode.postMessage({
							type: "retry-settings-export",
							settings,
						})
					}}
					className="px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors">
					Export Settings
				</button>
			</div>
		</div>
	)
}
