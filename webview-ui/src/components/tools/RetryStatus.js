import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Clock, RefreshCw, AlertCircle, CheckCircle, XCircle } from "lucide-react";
export const RetryStatus = ({ retryState, variant = "default", showDetails = false, className = "", }) => {
    const [timeUntilNext, setTimeUntilNext] = useState(0);
    useEffect(() => {
        if (!retryState?.isActive || !retryState.nextRetryTime)
            return;
        const updateTimer = () => {
            const now = Date.now();
            const timeLeft = Math.max(0, retryState.nextRetryTime - now);
            setTimeUntilNext(timeLeft);
        };
        updateTimer();
        const interval = setInterval(updateTimer, 100);
        return () => clearInterval(interval);
    }, [retryState?.nextRetryTime, retryState?.isActive]);
    const formatTime = (ms) => {
        if (ms < 1000)
            return `${ms}ms`;
        if (ms < 60000)
            return `${(ms / 1000).toFixed(1)}s`;
        return `${(ms / 60000).toFixed(1)}m`;
    };
    const getProgressPercentage = () => {
        if (!retryState)
            return 0;
        return (retryState.currentAttempt / retryState.maxAttempts) * 100;
    };
    const getStatusIcon = () => {
        if (!retryState)
            return _jsx(Clock, { className: "w-4 h-4" });
        if (retryState.isCancelled) {
            return _jsx(XCircle, { className: "w-4 h-4 text-red-500" });
        }
        if (!retryState.isActive) {
            return retryState.currentAttempt >= retryState.maxAttempts ? (_jsx(XCircle, { className: "w-4 h-4 text-red-500" })) : (_jsx(CheckCircle, { className: "w-4 h-4 text-green-500" }));
        }
        return _jsx(RefreshCw, { className: "w-4 h-4 text-blue-500 animate-spin" });
    };
    const getStatusText = () => {
        if (!retryState)
            return "No retry in progress";
        if (retryState.isCancelled)
            return "Retry Cancelled";
        if (!retryState.isActive) {
            return retryState.currentAttempt >= retryState.maxAttempts ? "Retry Failed" : "Retry Completed";
        }
        return "Retrying";
    };
    const renderDefaultVariant = () => (_jsxs("div", { className: `p-4 border rounded-lg bg-white dark:bg-gray-800 ${className}`, children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [getStatusIcon(), _jsx("h3", { className: "font-medium text-gray-900 dark:text-gray-100", children: getStatusText() }), retryState && (_jsx("span", { className: "text-sm text-gray-500 dark:text-gray-400", children: retryState.toolName }))] }), retryState && (_jsxs("span", { className: "text-sm font-medium text-gray-600 dark:text-gray-300", children: ["Attempt ", retryState.currentAttempt, " of ", retryState.maxAttempts] }))] }), retryState && (_jsxs(_Fragment, { children: [_jsx("div", { className: "mb-3", children: _jsx("div", { className: "w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2", children: _jsx("div", { className: "bg-blue-500 h-2 rounded-full transition-all duration-300", style: { width: `${getProgressPercentage()}%` } }) }) }), retryState.isActive && retryState.nextRetryTime && (_jsxs("div", { className: "flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3", children: [_jsx(Clock, { className: "w-3 h-3" }), _jsxs("span", { children: ["Next retry in ", formatTime(timeUntilNext)] })] })), (showDetails || retryState.errors.length > 0) && (_jsxs("div", { className: "mt-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-md", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx(AlertCircle, { className: "w-4 h-4 text-yellow-500" }), _jsx("span", { className: "text-sm font-medium text-gray-700 dark:text-gray-300", children: "Error Details" })] }), _jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: retryState.originalError }), retryState.errors.length > 1 && (_jsxs("div", { className: "mt-2 text-xs text-gray-500 dark:text-gray-500", children: ["Previous attempts: ", retryState.errors.slice(0, -1).join(", ")] }))] }))] }))] }));
    const renderCompactVariant = () => (_jsxs("div", { className: `flex items-center gap-2 p-2 border rounded bg-white dark:bg-gray-800 ${className}`, children: [getStatusIcon(), retryState ? (_jsxs(_Fragment, { children: [_jsx("span", { className: "text-sm font-medium text-gray-900 dark:text-gray-100", children: retryState.toolName }), _jsxs("span", { className: "text-xs text-gray-500 dark:text-gray-400", children: [retryState.currentAttempt, "/", retryState.maxAttempts] }), retryState.isActive && timeUntilNext > 0 && (_jsx("span", { className: "text-xs text-blue-600 dark:text-blue-400", children: formatTime(timeUntilNext) }))] })) : (_jsx("span", { className: "text-sm text-gray-500 dark:text-gray-400", children: "No retry in progress" }))] }));
    const renderMinimalVariant = () => (_jsxs("div", { className: `flex items-center gap-1 ${className}`, children: [getStatusIcon(), retryState && (_jsxs("span", { className: "text-xs text-gray-600 dark:text-gray-400", children: [retryState.currentAttempt, "/", retryState.maxAttempts] }))] }));
    switch (variant) {
        case "compact":
            return renderCompactVariant();
        case "minimal":
            return renderMinimalVariant();
        default:
            return renderDefaultVariant();
    }
};
//# sourceMappingURL=RetryStatus.js.map