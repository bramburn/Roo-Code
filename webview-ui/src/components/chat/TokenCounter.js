import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
/**
 * Token Counter Component
 * Displays token count comparison between original and edited context
 */
export const TokenCounter = ({ tokenComparison, showDetails = true, compact = false }) => {
    const { originalTokens, editedTokens, tokenDifference, percentageChange, isWithinLimit } = tokenComparison;
    const formatTokenCount = (tokens) => {
        if (tokens >= 1000000) {
            return `${(tokens / 1000000).toFixed(1)}M`;
        }
        else if (tokens >= 1000) {
            return `${(tokens / 1000).toFixed(1)}K`;
        }
        return tokens.toString();
    };
    const getChangeColor = (change) => {
        if (change > 0)
            return "text-red-500";
        if (change < 0)
            return "text-green-500";
        return "text-gray-500";
    };
    const getChangeIcon = (change) => {
        if (change > 0)
            return "📈";
        if (change < 0)
            return "📉";
        return "➡️";
    };
    const getStatusColor = (isWithinLimit) => {
        return isWithinLimit ? "text-green-500" : "text-red-500";
    };
    const getStatusIcon = (isWithinLimit) => {
        return isWithinLimit ? "✅" : "⚠️";
    };
    const getStatusText = (isWithinLimit) => {
        return isWithinLimit ? "Within Limits" : "Exceeds Limits";
    };
    // Compact version for inline display
    if (compact) {
        return (_jsxs("div", { className: "flex items-center space-x-2 text-sm", children: [_jsxs("span", { className: "text-vscode-descriptionForeground", children: [formatTokenCount(originalTokens), " \u2192 ", formatTokenCount(editedTokens)] }), _jsxs("span", { className: `flex items-center space-x-1 ${getChangeColor(tokenDifference)}`, children: [_jsx("span", { children: getChangeIcon(tokenDifference) }), _jsxs("span", { children: [tokenDifference > 0 ? "+" : "", formatTokenCount(Math.abs(tokenDifference))] })] }), _jsxs("span", { className: `flex items-center space-x-1 ${getStatusColor(isWithinLimit)}`, children: [_jsx("span", { children: getStatusIcon(isWithinLimit) }), _jsx("span", { children: getStatusText(isWithinLimit) })] })] }));
    }
    // Full detailed version
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-lg font-medium text-vscode-foreground mb-2", children: "Token Usage Comparison" }), _jsxs("div", { className: `flex items-center justify-center space-x-2 ${getStatusColor(isWithinLimit)}`, children: [_jsx("span", { className: "text-xl", children: getStatusIcon(isWithinLimit) }), _jsx("span", { className: "font-medium", children: getStatusText(isWithinLimit) })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "text-center p-4 bg-vscode-input-background rounded-lg border border-vscode-editor-border", children: [_jsx("div", { className: "text-xs text-vscode-descriptionForeground mb-1", children: "Original Context" }), _jsx("div", { className: "text-2xl font-mono font-medium text-vscode-foreground", children: formatTokenCount(originalTokens) }), _jsx("div", { className: "text-xs text-vscode-descriptionForeground mt-1", children: "tokens" })] }), _jsxs("div", { className: "text-center p-4 bg-vscode-input-background rounded-lg border border-vscode-editor-border", children: [_jsx("div", { className: "text-xs text-vscode-descriptionForeground mb-1", children: "Edited Context" }), _jsx("div", { className: "text-2xl font-mono font-medium text-vscode-foreground", children: formatTokenCount(editedTokens) }), _jsx("div", { className: "text-xs text-vscode-descriptionForeground mt-1", children: "tokens" })] })] }), tokenDifference !== 0 && (_jsx("div", { className: "text-center p-4 bg-vscode-input-background rounded-lg border border-vscode-editor-border", children: _jsxs("div", { className: "flex items-center justify-center space-x-3", children: [_jsx("span", { className: "text-2xl", children: getChangeIcon(tokenDifference) }), _jsxs("div", { className: "text-left", children: [_jsxs("div", { className: `text-lg font-medium ${getChangeColor(tokenDifference)}`, children: [tokenDifference > 0 ? "+" : "", formatTokenCount(Math.abs(tokenDifference)), " tokens"] }), _jsxs("div", { className: `text-sm ${getChangeColor(tokenDifference)}`, children: ["(", tokenDifference > 0 ? "+" : "", Math.round(percentageChange), "% change)"] })] })] }) })), showDetails && (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "grid grid-cols-3 gap-2 text-center", children: [_jsxs("div", { className: "p-2 bg-vscode-input-background rounded border border-vscode-editor-border", children: [_jsx("div", { className: "text-xs text-vscode-descriptionForeground", children: "Original" }), _jsxs("div", { className: "text-sm font-mono text-vscode-foreground", children: [Math.round((originalTokens / editedTokens) * 100), "%"] })] }), _jsxs("div", { className: "p-2 bg-vscode-input-background rounded border border-vscode-editor-border", children: [_jsx("div", { className: "text-xs text-vscode-descriptionForeground", children: "Edited" }), _jsx("div", { className: "text-sm font-mono text-vscode-foreground", children: "100%" })] }), _jsxs("div", { className: "p-2 bg-vscode-input-background rounded border border-vscode-editor-border", children: [_jsx("div", { className: "text-xs text-vscode-descriptionForeground", children: "Change" }), _jsxs("div", { className: `text-sm font-mono ${getChangeColor(tokenDifference)}`, children: [tokenDifference > 0 ? "+" : "", Math.round(percentageChange), "%"] })] })] }), _jsxs("div", { className: "relative h-8 bg-vscode-progress-background rounded-full overflow-hidden", children: [_jsx("div", { className: "absolute left-0 top-0 h-full bg-blue-500 rounded-full", style: { width: `${Math.min(100, (originalTokens / editedTokens) * 100)}%` } }), tokenDifference > 0 && (_jsx("div", { className: "absolute top-0 h-full bg-red-500 rounded-full", style: {
                                    left: `${Math.min(100, (originalTokens / editedTokens) * 100)}%`,
                                    width: `${Math.min(100, (tokenDifference / editedTokens) * 100)}%`,
                                } })), tokenDifference < 0 && (_jsx("div", { className: "absolute top-0 h-full bg-green-500 rounded-full", style: {
                                    left: `${Math.min(100, (editedTokens / originalTokens) * 100)}%`,
                                    width: `${Math.min(100, (Math.abs(tokenDifference) / originalTokens) * 100)}%`,
                                } }))] }), _jsxs("div", { className: "flex justify-center space-x-4 text-xs text-vscode-descriptionForeground", children: [_jsxs("div", { className: "flex items-center space-x-1", children: [_jsx("div", { className: "w-3 h-3 bg-blue-500 rounded" }), _jsx("span", { children: "Original" })] }), tokenDifference > 0 && (_jsxs("div", { className: "flex items-center space-x-1", children: [_jsx("div", { className: "w-3 h-3 bg-red-500 rounded" }), _jsx("span", { children: "Increase" })] })), tokenDifference < 0 && (_jsxs("div", { className: "flex items-center space-x-1", children: [_jsx("div", { className: "w-3 h-3 bg-green-500 rounded" }), _jsx("span", { children: "Decrease" })] }))] })] })), _jsx("div", { className: `text-center p-3 rounded-lg border ${isWithinLimit ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30"}`, children: _jsxs("div", { className: "flex items-center justify-center space-x-2", children: [_jsx("span", { className: "text-lg", children: getStatusIcon(isWithinLimit) }), _jsxs("div", { children: [_jsx("div", { className: `font-medium ${getStatusColor(isWithinLimit)}`, children: getStatusText(isWithinLimit) }), !isWithinLimit && (_jsx("div", { className: "text-sm text-vscode-descriptionForeground", children: "Context exceeds token limits and may cause issues" }))] })] }) })] }));
};
//# sourceMappingURL=TokenCounter.js.map