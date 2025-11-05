import React, { useState, useEffect } from "react"
import { Button } from "../ui/button"
import {
	ContextLoader as ContextLoaderService,
	type ContextLoadingResult,
	type TokenComparison,
} from "../../../../src/core/condense/context-loader"

interface ContextLoaderProps {
	contextLoader?: ContextLoaderService
	filepath?: string
	originalMetadata?: any
	onLoadComplete?: (result: ContextLoadingResult) => void
	onError?: (error: string) => void
	onRetry?: () => void
	onFallback?: () => void
}

/**
 * Context Loader Component
 * Displays loading progress and token comparison for context file loading
 */
export const ContextLoaderComponent: React.FC<ContextLoaderProps> = ({
	contextLoader,
	filepath,
	originalMetadata,
	onLoadComplete,
	onError,
	onRetry,
	onFallback,
}) => {
	const [loadingState, setLoadingState] = useState<"idle" | "loading" | "success" | "error">("idle")
	const [loadingResult, setLoadingResult] = useState<ContextLoadingResult | null>(null)
	const [progress, setProgress] = useState(0)
	const [currentStep, setCurrentStep] = useState("")

	useEffect(() => {
		if (!contextLoader || !filepath) {
			return
		}

		const loadContextFile = async () => {
			setLoadingState("loading")
			setProgress(0)
			setCurrentStep("Reading file...")

			try {
				// Listen to loading events
				const handleLoadingStarted = () => {
					setProgress(10)
					setCurrentStep("Parsing content...")
				}

				// Simulate progress updates (in real implementation, these would come from actual loading events)
				const progressInterval = setInterval(() => {
					setProgress((prev) => Math.min(prev + 5, 90))
				}, 200)

				contextLoader.on("loadingStarted", handleLoadingStarted)

				const result = await contextLoader.loadContextFile(filepath, originalMetadata || {}, {
					maxTokens: 200000, // Default max tokens
					contextWindow: 200000, // Default context window
					allowExceedLimit: false,
				})

				clearInterval(progressInterval)
				setProgress(100)
				setCurrentStep("Complete")

				setLoadingResult(result)
				if (result.success) {
					setLoadingState("success")
					onLoadComplete?.(result)
				} else {
					setLoadingState("error")
					if (result.requiresUserAction) {
						// Handle user action required case
						onError?.(result.userActionMessage || result.error || "Unknown error")
					} else {
						onError?.(result.error || "Unknown error")
					}
				}
			} catch (error) {
				setLoadingState("error")
				onError?.(`Failed to load context: ${error}`)
			}
		}

		loadContextFile()

		return () => {
			// Cleanup listeners
			contextLoader?.removeAllListeners()
		}
	}, [contextLoader, filepath, originalMetadata, onLoadComplete, onError])

	const formatTokenCount = (tokens: number): string => {
		if (tokens >= 1000000) {
			return `${(tokens / 1000000).toFixed(1)}M`
		} else if (tokens >= 1000) {
			return `${(tokens / 1000).toFixed(1)}K`
		}
		return tokens.toString()
	}

	const getTokenChangeColor = (change: number): string => {
		if (change > 0) return "text-red-500"
		if (change < 0) return "text-green-500"
		return "text-gray-500"
	}

	const getTokenChangeIcon = (change: number): string => {
		if (change > 0) return "📈"
		if (change < 0) return "📉"
		return "➡️"
	}

	const renderTokenComparison = (tokenComparison: TokenComparison) => {
		const { originalTokens, editedTokens, tokenDifference, percentageChange, isWithinLimit } = tokenComparison

		return (
			<div className="space-y-3">
				{/* Token counts */}
				<div className="grid grid-cols-2 gap-4">
					<div className="text-center p-3 bg-vscode-input-background rounded-lg border border-vscode-editor-border">
						<div className="text-xs text-vscode-descriptionForeground mb-1">Original</div>
						<div className="text-lg font-mono font-medium text-vscode-foreground">
							{formatTokenCount(originalTokens)}
						</div>
					</div>
					<div className="text-center p-3 bg-vscode-input-background rounded-lg border border-vscode-editor-border">
						<div className="text-xs text-vscode-descriptionForeground mb-1">Edited</div>
						<div className="text-lg font-mono font-medium text-vscode-foreground">
							{formatTokenCount(editedTokens)}
						</div>
					</div>
				</div>

				{/* Change indicator */}
				<div className="text-center p-3 bg-vscode-input-background rounded-lg border border-vscode-editor-border">
					<div className="flex items-center justify-center space-x-2">
						<span className="text-2xl">{getTokenChangeIcon(tokenDifference)}</span>
						<div className="text-left">
							<div className={`font-medium ${getTokenChangeColor(tokenDifference)}`}>
								{tokenDifference > 0 ? "+" : ""}
								{formatTokenCount(Math.abs(tokenDifference))} tokens
							</div>
							<div className={`text-sm ${getTokenChangeColor(tokenDifference)}`}>
								({tokenDifference > 0 ? "+" : ""}
								{Math.round(percentageChange)}%)
							</div>
						</div>
					</div>
				</div>

				{/* Status indicator */}
				<div
					className={`text-center p-3 rounded-lg border ${
						isWithinLimit ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30"
					}`}>
					<div className="flex items-center justify-center space-x-2">
						<span className="text-xl">{isWithinLimit ? "✅" : "⚠️"}</span>
						<span className={`font-medium ${isWithinLimit ? "text-green-500" : "text-red-500"}`}>
							{isWithinLimit ? "Within token limits" : "Exceeds token limits"}
						</span>
					</div>
				</div>
			</div>
		)
	}

	// Loading state
	if (loadingState === "loading") {
		return (
			<div className="flex flex-col items-center justify-center p-6 border border-vscode-editor-border rounded-lg bg-vscode-editor-background">
				{/* Loading animation */}
				<div className="w-16 h-16 rounded-full border-4 border-vscode-progress-background border-t-vscode-progress-foreground animate-spin mb-4"></div>

				{/* Loading text */}
				<div className="text-lg font-medium text-vscode-foreground mb-2">Loading Context File</div>

				{/* Current step */}
				<div className="text-sm text-vscode-descriptionForeground mb-4 text-center">{currentStep}</div>

				{/* Progress bar */}
				<div className="w-full max-w-md">
					<div className="w-full bg-vscode-progress-background rounded-full h-3 overflow-hidden">
						<div
							className="bg-gradient-to-r from-vscode-progress-foreground to-vscode-progress-foreground h-3 rounded-full transition-all duration-300 ease-out"
							style={{ width: `${progress}%` }}>
							{/* Animated shine effect */}
							<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
						</div>
					</div>

					{/* Progress percentage */}
					<div className="text-center mt-2 text-sm text-vscode-descriptionForeground">
						{Math.round(progress)}%
					</div>
				</div>
			</div>
		)
	}

	// Success state
	if (loadingState === "success" && loadingResult) {
		return (
			<div className="flex flex-col items-center justify-center p-6 border border-vscode-editor-border rounded-lg bg-vscode-editor-background">
				{/* Success icon */}
				<div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
					<div className="text-2xl">✅</div>
				</div>

				{/* Success message */}
				<div className="text-lg font-medium text-green-500 mb-4">Context Loaded Successfully</div>

				{/* Token comparison */}
				{loadingResult.tokenComparison && (
					<div className="w-full max-w-lg mb-6">{renderTokenComparison(loadingResult.tokenComparison)}</div>
				)}

				{/* Warnings */}
				{loadingResult.warnings && loadingResult.warnings.length > 0 && (
					<div className="w-full max-w-lg mb-6">
						<div className="text-sm font-medium text-yellow-500 mb-2">⚠️ Warnings:</div>
						<ul className="text-xs text-yellow-600 space-y-1">
							{loadingResult.warnings.map((warning, index) => (
								<li key={index}>• {warning}</li>
							))}
						</ul>
					</div>
				)}

				{/* Action buttons */}
				<div className="flex space-x-3">
					{onRetry && (
						<Button onClick={onRetry} variant="secondary" className="min-w-32">
							🔄 Reload
						</Button>
					)}
				</div>
			</div>
		)
	}

	// Error state
	if (loadingState === "error") {
		return (
			<div className="flex flex-col items-center justify-center p-6 border border-vscode-editor-border rounded-lg bg-vscode-editor-background">
				{/* Error icon */}
				<div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
					<div className="text-2xl">❌</div>
				</div>

				{/* Error message */}
				<div className="text-lg font-medium text-red-500 mb-4 text-center">Failed to Load Context</div>

				{/* Error details */}
				{loadingResult?.error && (
					<div className="text-sm text-vscode-descriptionForeground mb-6 text-center max-w-md">
						{loadingResult.error}
					</div>
				)}

				{/* User action required */}
				{loadingResult?.requiresUserAction && loadingResult?.userActionMessage && (
					<div className="w-full max-w-md mb-6 p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
						<div className="text-sm font-medium text-yellow-600 mb-2">📋 Action Required:</div>
						<div className="text-sm text-yellow-700">{loadingResult.userActionMessage}</div>
					</div>
				)}

				{/* Recovery options */}
				<div className="flex flex-col space-y-2 w-full max-w-md">
					{onRetry && (
						<Button onClick={onRetry} variant="default" className="w-full">
							🔄 Try Again
						</Button>
					)}

					{onFallback && (
						<Button onClick={onFallback} variant="secondary" className="w-full">
							🚀 Use Intelligent Compression
						</Button>
					)}
				</div>
			</div>
		)
	}

	// Idle state
	return (
		<div className="flex flex-col items-center justify-center p-6 border border-vscode-editor-border rounded-lg bg-vscode-editor-background">
			<div className="text-center text-vscode-descriptionForeground">Ready to load context file</div>
		</div>
	)
}
