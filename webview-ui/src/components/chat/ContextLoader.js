import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Button } from "../ui/button";
/**
 * Context Loader Component
 * Displays loading progress and token comparison for context file loading
 */
export const ContextLoaderComponent = ({ contextLoader, filepath, originalMetadata, onLoadComplete, onError, onRetry, onFallback, }) => {
    const [loadingState, setLoadingState] = useState("idle");
    const [loadingResult, setLoadingResult] = useState(null);
    const [progress, setProgress] = useState(0);
    const [currentStep, setCurrentStep] = useState("");
    useEffect(() => {
        if (!contextLoader || !filepath) {
            return;
        }
        const loadContextFile = async () => {
            setLoadingState("loading");
            setProgress(0);
            setCurrentStep("Reading file...");
            try {
                // Listen to loading events
                const handleLoadingStarted = () => {
                    setProgress(10);
                    setCurrentStep("Parsing content...");
                };
                // Simulate progress updates (in real implementation, these would come from actual loading events)
                const progressInterval = setInterval(() => {
                    setProgress((prev) => Math.min(prev + 5, 90));
                }, 200);
                contextLoader.on("loadingStarted", handleLoadingStarted);
                const result = await contextLoader.loadContextFile(filepath, originalMetadata || {}, {
                    maxTokens: 200000, // Default max tokens
                    contextWindow: 200000, // Default context window
                    allowExceedLimit: false,
                });
                clearInterval(progressInterval);
                setProgress(100);
                setCurrentStep("Complete");
                setLoadingResult(result);
                if (result.success) {
                    setLoadingState("success");
                    onLoadComplete?.(result);
                }
                else {
                    setLoadingState("error");
                    if (result.requiresUserAction) {
                        // Handle user action required case
                        onError?.(result.userActionMessage || result.error || "Unknown error");
                    }
                    else {
                        onError?.(result.error || "Unknown error");
                    }
                }
            }
            catch (error) {
                setLoadingState("error");
                onError?.(`Failed to load context: ${error}`);
            }
        };
        loadContextFile();
        return () => {
            // Cleanup listeners
            contextLoader?.removeAllListeners();
        };
    }, [contextLoader, filepath, originalMetadata, onLoadComplete, onError]);
    const formatTokenCount = (tokens) => {
        if (tokens >= 1000000) {
            return `${(tokens / 1000000).toFixed(1)}M`;
        }
        else if (tokens >= 1000) {
            return `${(tokens / 1000).toFixed(1)}K`;
        }
        return tokens.toString();
    };
    const getTokenChangeColor = (change) => {
        if (change > 0)
            return "text-red-500";
        if (change < 0)
            return "text-green-500";
        return "text-gray-500";
    };
    const getTokenChangeIcon = (change) => {
        if (change > 0)
            return "📈";
        if (change < 0)
            return "📉";
        return "➡️";
    };
    const renderTokenComparison = (tokenComparison) => {
        const { originalTokens, editedTokens, tokenDifference, percentageChange, isWithinLimit } = tokenComparison;
        return (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "text-center p-3 bg-vscode-input-background rounded-lg border border-vscode-editor-border", children: [_jsx("div", { className: "text-xs text-vscode-descriptionForeground mb-1", children: "Original" }), _jsx("div", { className: "text-lg font-mono font-medium text-vscode-foreground", children: formatTokenCount(originalTokens) })] }), _jsxs("div", { className: "text-center p-3 bg-vscode-input-background rounded-lg border border-vscode-editor-border", children: [_jsx("div", { className: "text-xs text-vscode-descriptionForeground mb-1", children: "Edited" }), _jsx("div", { className: "text-lg font-mono font-medium text-vscode-foreground", children: formatTokenCount(editedTokens) })] })] }), _jsx("div", { className: "text-center p-3 bg-vscode-input-background rounded-lg border border-vscode-editor-border", children: _jsxs("div", { className: "flex items-center justify-center space-x-2", children: [_jsx("span", { className: "text-2xl", children: getTokenChangeIcon(tokenDifference) }), _jsxs("div", { className: "text-left", children: [_jsxs("div", { className: `font-medium ${getTokenChangeColor(tokenDifference)}`, children: [tokenDifference > 0 ? "+" : "", formatTokenCount(Math.abs(tokenDifference)), " tokens"] }), _jsxs("div", { className: `text-sm ${getTokenChangeColor(tokenDifference)}`, children: ["(", tokenDifference > 0 ? "+" : "", Math.round(percentageChange), "%)"] })] })] }) }), _jsx("div", { className: `text-center p-3 rounded-lg border ${isWithinLimit ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30"}`, children: _jsxs("div", { className: "flex items-center justify-center space-x-2", children: [_jsx("span", { className: "text-xl", children: isWithinLimit ? "✅" : "⚠️" }), _jsx("span", { className: `font-medium ${isWithinLimit ? "text-green-500" : "text-red-500"}`, children: isWithinLimit ? "Within token limits" : "Exceeds token limits" })] }) })] }));
    };
    // Loading state
    if (loadingState === "loading") {
        return (_jsxs("div", { className: "flex flex-col items-center justify-center p-6 border border-vscode-editor-border rounded-lg bg-vscode-editor-background", children: [_jsx("div", { className: "w-16 h-16 rounded-full border-4 border-vscode-progress-background border-t-vscode-progress-foreground animate-spin mb-4" }), _jsx("div", { className: "text-lg font-medium text-vscode-foreground mb-2", children: "Loading Context File" }), _jsx("div", { className: "text-sm text-vscode-descriptionForeground mb-4 text-center", children: currentStep }), _jsxs("div", { className: "w-full max-w-md", children: [_jsx("div", { className: "w-full bg-vscode-progress-background rounded-full h-3 overflow-hidden", children: _jsx("div", { className: "bg-gradient-to-r from-vscode-progress-foreground to-vscode-progress-foreground h-3 rounded-full transition-all duration-300 ease-out", style: { width: `${progress}%` }, children: _jsx("div", { className: "absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" }) }) }), _jsxs("div", { className: "text-center mt-2 text-sm text-vscode-descriptionForeground", children: [Math.round(progress), "%"] })] })] }));
    }
    // Success state
    if (loadingState === "success" && loadingResult) {
        return (_jsxs("div", { className: "flex flex-col items-center justify-center p-6 border border-vscode-editor-border rounded-lg bg-vscode-editor-background", children: [_jsx("div", { className: "w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4", children: _jsx("div", { className: "text-2xl", children: "\u2705" }) }), _jsx("div", { className: "text-lg font-medium text-green-500 mb-4", children: "Context Loaded Successfully" }), loadingResult.tokenComparison && (_jsx("div", { className: "w-full max-w-lg mb-6", children: renderTokenComparison(loadingResult.tokenComparison) })), loadingResult.warnings && loadingResult.warnings.length > 0 && (_jsxs("div", { className: "w-full max-w-lg mb-6", children: [_jsx("div", { className: "text-sm font-medium text-yellow-500 mb-2", children: "\u26A0\uFE0F Warnings:" }), _jsx("ul", { className: "text-xs text-yellow-600 space-y-1", children: loadingResult.warnings.map((warning, index) => (_jsxs("li", { children: ["\u2022 ", warning] }, index))) })] })), _jsx("div", { className: "flex space-x-3", children: onRetry && (_jsx(Button, { onClick: onRetry, variant: "secondary", className: "min-w-32", children: "\uD83D\uDD04 Reload" })) })] }));
    }
    // Error state
    if (loadingState === "error") {
        return (_jsxs("div", { className: "flex flex-col items-center justify-center p-6 border border-vscode-editor-border rounded-lg bg-vscode-editor-background", children: [_jsx("div", { className: "w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4", children: _jsx("div", { className: "text-2xl", children: "\u274C" }) }), _jsx("div", { className: "text-lg font-medium text-red-500 mb-4 text-center", children: "Failed to Load Context" }), loadingResult?.error && (_jsx("div", { className: "text-sm text-vscode-descriptionForeground mb-6 text-center max-w-md", children: loadingResult.error })), loadingResult?.requiresUserAction && loadingResult?.userActionMessage && (_jsxs("div", { className: "w-full max-w-md mb-6 p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/30", children: [_jsx("div", { className: "text-sm font-medium text-yellow-600 mb-2", children: "\uD83D\uDCCB Action Required:" }), _jsx("div", { className: "text-sm text-yellow-700", children: loadingResult.userActionMessage })] })), _jsxs("div", { className: "flex flex-col space-y-2 w-full max-w-md", children: [onRetry && (_jsx(Button, { onClick: onRetry, variant: "default", className: "w-full", children: "\uD83D\uDD04 Try Again" })), onFallback && (_jsx(Button, { onClick: onFallback, variant: "secondary", className: "w-full", children: "\uD83D\uDE80 Use Intelligent Compression" }))] })] }));
    }
    // Idle state
    return (_jsx("div", { className: "flex flex-col items-center justify-center p-6 border border-vscode-editor-border rounded-lg bg-vscode-editor-background", children: _jsx("div", { className: "text-center text-vscode-descriptionForeground", children: "Ready to load context file" }) }));
};
//# sourceMappingURL=ContextLoader.js.map