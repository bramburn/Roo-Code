import React from "react"
import { type TokenComparison } from "../../../../src/core/condense/context-loader"

interface TokenCounterProps {
	tokenComparison: TokenComparison
	showDetails?: boolean
	compact?: boolean
}

/**
 * Token Counter Component
 * Displays token count comparison between original and edited context
 */
export const TokenCounter: React.FC<TokenCounterProps> = ({ tokenComparison, showDetails = true, compact = false }) => {
	const { originalTokens, editedTokens, tokenDifference, percentageChange, isWithinLimit } = tokenComparison

	const formatTokenCount = (tokens: number): string => {
		if (tokens >= 1000000) {
			return `${(tokens / 1000000).toFixed(1)}M`
		} else if (tokens >= 1000) {
			return `${(tokens / 1000).toFixed(1)}K`
		}
		return tokens.toString()
	}

	const getChangeColor = (change: number): string => {
		if (change > 0) return "text-red-500"
		if (change < 0) return "text-green-500"
		return "text-gray-500"
	}

	const getChangeIcon = (change: number): string => {
		if (change > 0) return "📈"
		if (change < 0) return "📉"
		return "➡️"
	}

	const getStatusColor = (isWithinLimit: boolean): string => {
		return isWithinLimit ? "text-green-500" : "text-red-500"
	}

	const getStatusIcon = (isWithinLimit: boolean): string => {
		return isWithinLimit ? "✅" : "⚠️"
	}

	const getStatusText = (isWithinLimit: boolean): string => {
		return isWithinLimit ? "Within Limits" : "Exceeds Limits"
	}

	// Compact version for inline display
	if (compact) {
		return (
			<div className="flex items-center space-x-2 text-sm">
				<span className="text-vscode-descriptionForeground">
					{formatTokenCount(originalTokens)} → {formatTokenCount(editedTokens)}
				</span>
				<span className={`flex items-center space-x-1 ${getChangeColor(tokenDifference)}`}>
					<span>{getChangeIcon(tokenDifference)}</span>
					<span>
						{tokenDifference > 0 ? "+" : ""}
						{formatTokenCount(Math.abs(tokenDifference))}
					</span>
				</span>
				<span className={`flex items-center space-x-1 ${getStatusColor(isWithinLimit)}`}>
					<span>{getStatusIcon(isWithinLimit)}</span>
					<span>{getStatusText(isWithinLimit)}</span>
				</span>
			</div>
		)
	}

	// Full detailed version
	return (
		<div className="space-y-4">
			{/* Header */}
			<div className="text-center">
				<div className="text-lg font-medium text-vscode-foreground mb-2">Token Usage Comparison</div>
				<div className={`flex items-center justify-center space-x-2 ${getStatusColor(isWithinLimit)}`}>
					<span className="text-xl">{getStatusIcon(isWithinLimit)}</span>
					<span className="font-medium">{getStatusText(isWithinLimit)}</span>
				</div>
			</div>

			{/* Token Counts Grid */}
			<div className="grid grid-cols-2 gap-4">
				{/* Original Tokens */}
				<div className="text-center p-4 bg-vscode-input-background rounded-lg border border-vscode-editor-border">
					<div className="text-xs text-vscode-descriptionForeground mb-1">Original Context</div>
					<div className="text-2xl font-mono font-medium text-vscode-foreground">
						{formatTokenCount(originalTokens)}
					</div>
					<div className="text-xs text-vscode-descriptionForeground mt-1">tokens</div>
				</div>

				{/* Edited Tokens */}
				<div className="text-center p-4 bg-vscode-input-background rounded-lg border border-vscode-editor-border">
					<div className="text-xs text-vscode-descriptionForeground mb-1">Edited Context</div>
					<div className="text-2xl font-mono font-medium text-vscode-foreground">
						{formatTokenCount(editedTokens)}
					</div>
					<div className="text-xs text-vscode-descriptionForeground mt-1">tokens</div>
				</div>
			</div>

			{/* Change Summary */}
			{tokenDifference !== 0 && (
				<div className="text-center p-4 bg-vscode-input-background rounded-lg border border-vscode-editor-border">
					<div className="flex items-center justify-center space-x-3">
						<span className="text-2xl">{getChangeIcon(tokenDifference)}</span>
						<div className="text-left">
							<div className={`text-lg font-medium ${getChangeColor(tokenDifference)}`}>
								{tokenDifference > 0 ? "+" : ""}
								{formatTokenCount(Math.abs(tokenDifference))} tokens
							</div>
							<div className={`text-sm ${getChangeColor(tokenDifference)}`}>
								({tokenDifference > 0 ? "+" : ""}
								{Math.round(percentageChange)}% change)
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Detailed Breakdown */}
			{showDetails && (
				<div className="space-y-3">
					{/* Percentage Breakdown */}
					<div className="grid grid-cols-3 gap-2 text-center">
						<div className="p-2 bg-vscode-input-background rounded border border-vscode-editor-border">
							<div className="text-xs text-vscode-descriptionForeground">Original</div>
							<div className="text-sm font-mono text-vscode-foreground">
								{Math.round((originalTokens / editedTokens) * 100)}%
							</div>
						</div>
						<div className="p-2 bg-vscode-input-background rounded border border-vscode-editor-border">
							<div className="text-xs text-vscode-descriptionForeground">Edited</div>
							<div className="text-sm font-mono text-vscode-foreground">100%</div>
						</div>
						<div className="p-2 bg-vscode-input-background rounded border border-vscode-editor-border">
							<div className="text-xs text-vscode-descriptionForeground">Change</div>
							<div className={`text-sm font-mono ${getChangeColor(tokenDifference)}`}>
								{tokenDifference > 0 ? "+" : ""}
								{Math.round(percentageChange)}%
							</div>
						</div>
					</div>

					{/* Visual Bar */}
					<div className="relative h-8 bg-vscode-progress-background rounded-full overflow-hidden">
						<div
							className="absolute left-0 top-0 h-full bg-blue-500 rounded-full"
							style={{ width: `${Math.min(100, (originalTokens / editedTokens) * 100)}%` }}
						/>
						{tokenDifference > 0 && (
							<div
								className="absolute top-0 h-full bg-red-500 rounded-full"
								style={{
									left: `${Math.min(100, (originalTokens / editedTokens) * 100)}%`,
									width: `${Math.min(100, (tokenDifference / editedTokens) * 100)}%`,
								}}
							/>
						)}
						{tokenDifference < 0 && (
							<div
								className="absolute top-0 h-full bg-green-500 rounded-full"
								style={{
									left: `${Math.min(100, (editedTokens / originalTokens) * 100)}%`,
									width: `${Math.min(100, (Math.abs(tokenDifference) / originalTokens) * 100)}%`,
								}}
							/>
						)}
					</div>

					{/* Legend */}
					<div className="flex justify-center space-x-4 text-xs text-vscode-descriptionForeground">
						<div className="flex items-center space-x-1">
							<div className="w-3 h-3 bg-blue-500 rounded"></div>
							<span>Original</span>
						</div>
						{tokenDifference > 0 && (
							<div className="flex items-center space-x-1">
								<div className="w-3 h-3 bg-red-500 rounded"></div>
								<span>Increase</span>
							</div>
						)}
						{tokenDifference < 0 && (
							<div className="flex items-center space-x-1">
								<div className="w-3 h-3 bg-green-500 rounded"></div>
								<span>Decrease</span>
							</div>
						)}
					</div>
				</div>
			)}

			{/* Status Message */}
			<div
				className={`text-center p-3 rounded-lg border ${
					isWithinLimit ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30"
				}`}>
				<div className="flex items-center justify-center space-x-2">
					<span className="text-lg">{getStatusIcon(isWithinLimit)}</span>
					<div>
						<div className={`font-medium ${getStatusColor(isWithinLimit)}`}>
							{getStatusText(isWithinLimit)}
						</div>
						{!isWithinLimit && (
							<div className="text-sm text-vscode-descriptionForeground">
								Context exceeds token limits and may cause issues
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}
