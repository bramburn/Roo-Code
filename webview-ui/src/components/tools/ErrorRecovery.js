import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { AlertTriangle, RefreshCw, Zap, Shield, XCircle, Info, Lightbulb } from "lucide-react";
import { vscode } from "../../utils/vscode";
export const ErrorRecovery = ({ retryState, errorClassification, toolName, originalError, contextOptimizationAvailable = false, className = "", }) => {
    const handleManualRetry = () => {
        if (!retryState)
            return;
        vscode.postMessage({
            type: "retry-manual",
            retryId: retryState.id,
            action: "immediate-retry",
        });
    };
    const handleOptimizeContext = () => {
        if (!retryState)
            return;
        vscode.postMessage({
            type: "retry-optimize-context",
            retryId: retryState.id,
        });
    };
    const handleCancelRetry = () => {
        if (!retryState)
            return;
        vscode.postMessage({
            type: "retry-cancel",
            retryId: retryState.id,
        });
    };
    const handleResetCircuitBreaker = () => {
        vscode.postMessage({
            type: "retry-reset-circuit-breaker",
            toolName,
        });
    };
    const getSeverityColor = (severity) => {
        switch (severity) {
            case "low":
                return "text-yellow-600";
            case "medium":
                return "text-orange-600";
            case "high":
                return "text-red-600";
            case "critical":
                return "text-red-600 font-bold";
            default:
                return "text-gray-600";
        }
    };
    const getCategoryIcon = (category) => {
        switch (category) {
            case "network":
                return _jsx(RefreshCw, { className: "w-4 h-4" });
            case "timeout":
                return _jsx(AlertTriangle, { className: "w-4 h-4" });
            case "rate_limit":
                return _jsx(Zap, { className: "w-4 h-4" });
            case "auth":
            case "permission":
                return _jsx(Shield, { className: "w-4 h-4" });
            default:
                return _jsx(Info, { className: "w-4 h-4" });
        }
    };
    const getRecoverySuggestions = () => {
        if (!errorClassification)
            return [];
        const suggestions = [];
        switch (errorClassification.category) {
            case "network":
                suggestions.push({
                    title: "Network Issues",
                    description: "Retry with exponential backoff and check connection",
                    action: "retry",
                });
                break;
            case "timeout":
                suggestions.push({
                    title: "Timeout Issues",
                    description: "Consider increasing timeout or optimizing context",
                    action: "optimize",
                });
                break;
            case "rate_limit":
                suggestions.push({
                    title: "Rate Limiting",
                    description: "Wait longer between attempts or reduce request frequency",
                    action: "wait",
                });
                break;
            case "auth":
                suggestions.push({
                    title: "Authentication Issues",
                    description: "Check credentials and permissions",
                    action: "auth",
                });
                break;
            case "permission":
                suggestions.push({
                    title: "Permission Issues",
                    description: "Verify file/directory permissions",
                    action: "permissions",
                });
                break;
            case "resource":
                suggestions.push({
                    title: "Resource Issues",
                    description: "Check available resources and optimize usage",
                    action: "optimize",
                });
                break;
            case "parsing":
                suggestions.push({
                    title: "Parsing Issues",
                    description: "Validate input format and content",
                    action: "validate",
                });
                break;
        }
        return suggestions;
    };
    return (_jsxs("div", { className: `p-4 border rounded-lg bg-white dark:bg-gray-800 ${className}`, children: [_jsxs("div", { className: "flex items-center gap-2 mb-4", children: [_jsx(AlertTriangle, { className: "w-5 h-5 text-red-500" }), _jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-gray-100", children: "Error Recovery" })] }), _jsxs("div", { className: "mb-4", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx("span", { className: "text-sm font-medium text-gray-700 dark:text-gray-300", children: "Tool:" }), _jsx("span", { className: "text-sm text-gray-600 dark:text-gray-400", children: toolName })] }), _jsx("div", { className: "p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md", children: _jsx("p", { className: "text-sm text-red-800 dark:text-red-200", children: originalError }) })] }), errorClassification && (_jsxs("div", { className: "mb-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-md", children: [_jsx("h4", { className: "text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "Error Analysis" }), _jsxs("div", { className: "grid grid-cols-2 gap-2 text-sm", children: [_jsxs("div", { className: "flex items-center gap-2", children: [getCategoryIcon(errorClassification.category), _jsx("span", { className: "text-gray-600 dark:text-gray-400", children: "Category:" }), _jsx("span", { className: "capitalize text-gray-800 dark:text-gray-200", children: errorClassification.category.replace("_", " ") })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-gray-600 dark:text-gray-400", children: "Severity:" }), _jsx("span", { className: `capitalize ${getSeverityColor(errorClassification.severity)}`, children: errorClassification.severity })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-gray-600 dark:text-gray-400", children: "Retryable:" }), _jsx("span", { className: errorClassification.isRetryable ? "text-green-600" : "text-red-600", children: errorClassification.isRetryable ? "Yes" : "No" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-gray-600 dark:text-gray-400", children: "Strategy:" }), _jsx("span", { className: "capitalize text-gray-800 dark:text-gray-200", children: errorClassification.backoffStrategy })] })] }), errorClassification.triggerCircuitBreaker && (_jsxs("div", { className: "mt-2 flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400", children: [_jsx(Shield, { className: "w-4 h-4" }), _jsx("span", { children: "This error will trigger the circuit breaker" })] }))] })), errorClassification && (_jsxs("div", { className: "mb-4", children: [_jsx("h4", { className: "text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "Recovery Suggestions" }), _jsx("div", { className: "space-y-2", children: getRecoverySuggestions().map((suggestion, index) => (_jsxs("div", { className: "flex items-start gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md", children: [_jsx(Lightbulb, { className: "w-4 h-4 text-blue-500 mt-0.5" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-blue-800 dark:text-blue-200", children: suggestion.title }), _jsx("p", { className: "text-xs text-blue-600 dark:text-blue-400", children: suggestion.description })] })] }, index))) })] })), contextOptimizationAvailable && (_jsx("div", { className: "mb-4", children: _jsxs("div", { className: "flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Zap, { className: "w-4 h-4 text-yellow-600" }), _jsx("span", { className: "text-sm text-yellow-800 dark:text-yellow-200", children: "Context optimization can help reduce token usage" })] }), _jsx("button", { onClick: handleOptimizeContext, className: "px-3 py-1 text-xs font-medium text-yellow-700 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-800 rounded hover:bg-yellow-200 dark:hover:bg-yellow-700 transition-colors", children: "Optimize Context" })] }) })), _jsxs("div", { className: "flex flex-wrap gap-2", children: [retryState && errorClassification?.isRetryable && (_jsxs("button", { onClick: handleManualRetry, className: "flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors", children: [_jsx(RefreshCw, { className: "w-4 h-4" }), "Retry Now"] })), retryState && (_jsxs("button", { onClick: handleCancelRetry, className: "flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900 rounded hover:bg-red-200 dark:hover:bg-red-800 transition-colors", children: [_jsx(XCircle, { className: "w-4 h-4" }), "Cancel Retry"] })), errorClassification?.triggerCircuitBreaker && (_jsxs("button", { onClick: handleResetCircuitBreaker, className: "flex items-center gap-2 px-3 py-2 text-sm font-medium text-orange-700 dark:text-orange-300 bg-orange-100 dark:bg-orange-900 rounded hover:bg-orange-200 dark:hover:bg-orange-800 transition-colors", children: [_jsx(Shield, { className: "w-4 h-4" }), "Reset Circuit Breaker"] }))] })] }));
};
//# sourceMappingURL=ErrorRecovery.js.map