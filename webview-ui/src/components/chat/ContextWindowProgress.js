import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { formatLargeNumber } from "@/utils/format"
import { calculateTokenDistribution } from "@/utils/model-utils"
import { StandardTooltip } from "@/components/ui"
export const ContextWindowProgress = ({ contextWindow, contextTokens, maxTokens }) => {
	const { t } = useTranslation()
	// Use the shared utility function to calculate all token distribution values
	const tokenDistribution = useMemo(
		() => calculateTokenDistribution(contextWindow, contextTokens, maxTokens),
		[contextWindow, contextTokens, maxTokens],
	)
	// Destructure the values we need
	const { currentPercent, reservedPercent, availableSize, reservedForOutput, availablePercent } = tokenDistribution
	// For display purposes
	const safeContextWindow = Math.max(0, contextWindow)
	const safeContextTokens = Math.max(0, contextTokens)
	// Combine all tooltip content into a single tooltip
	const tooltipContent = _jsxs("div", {
		className: "space-y-1",
		children: [
			_jsx("div", {
				children: t("chat:tokenProgress.tokensUsed", {
					used: formatLargeNumber(safeContextTokens),
					total: formatLargeNumber(safeContextWindow),
				}),
			}),
			reservedForOutput > 0 &&
				_jsx("div", {
					children: t("chat:tokenProgress.reservedForResponse", {
						amount: formatLargeNumber(reservedForOutput),
					}),
				}),
			availableSize > 0 &&
				_jsx("div", {
					children: t("chat:tokenProgress.availableSpace", {
						amount: formatLargeNumber(availableSize),
					}),
				}),
		],
	})
	return _jsx(_Fragment, {
		children: _jsxs("div", {
			className: "flex items-center gap-2 flex-1 whitespace-nowrap",
			children: [
				_jsx("div", { "data-testid": "context-tokens-count", children: formatLargeNumber(safeContextTokens) }),
				_jsx(StandardTooltip, {
					content: tooltipContent,
					side: "top",
					sideOffset: 8,
					children: _jsx("div", {
						className: "flex-1 relative",
						children: _jsxs("div", {
							className:
								"flex items-center h-1 rounded-[2px] overflow-hidden w-full bg-[color-mix(in_srgb,var(--vscode-foreground)_20%,transparent)]",
							children: [
								_jsx("div", {
									className: "relative h-full",
									style: { width: `${currentPercent}%` },
									"data-testid": "context-tokens-used",
									children: _jsx("div", {
										className:
											"h-full w-full bg-[var(--vscode-foreground)] transition-width duration-300 ease-out",
									}),
								}),
								_jsx("div", {
									className: "relative h-full",
									style: { width: `${reservedPercent}%` },
									"data-testid": "context-reserved-tokens",
									children: _jsx("div", {
										className:
											"h-full w-full bg-[color-mix(in_srgb,var(--vscode-foreground)_30%,transparent)] transition-width duration-300 ease-out",
									}),
								}),
								availablePercent > 0 &&
									_jsx("div", {
										className: "relative h-full",
										style: { width: `${availablePercent}%` },
										"data-testid": "context-available-space-section",
									}),
							],
						}),
					}),
				}),
				_jsx("div", { "data-testid": "context-window-size", children: formatLargeNumber(safeContextWindow) }),
			],
		}),
	})
}
//# sourceMappingURL=ContextWindowProgress.js.map
