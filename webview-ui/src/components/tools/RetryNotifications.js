import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { X, CheckCircle, AlertTriangle, Info, RefreshCw, Zap } from "lucide-react";
import { vscode } from "../../utils/vscode";
export const RetryNotifications = ({ notifications, retryStates, onDismissNotification, className = "", }) => {
    const [visibleNotifications, setVisibleNotifications] = useState([]);
    useEffect(() => {
        // Show new notifications
        const newNotifications = notifications.filter((notif) => !visibleNotifications.find((v) => v.id === notif.id));
        if (newNotifications.length > 0) {
            setVisibleNotifications((prev) => [...prev, ...newNotifications]);
            // Auto-dismiss success notifications after 3 seconds
            newNotifications.forEach((notif) => {
                if (notif.type === "retry-success") {
                    setTimeout(() => onDismissNotification(notif.id), 3000);
                }
            });
        }
        // Remove dismissed notifications
        setVisibleNotifications((prev) => prev.filter((notif) => notifications.find((n) => n.id === notif.id)));
    }, [notifications, onDismissNotification, visibleNotifications]);
    const getNotificationIcon = (type) => {
        switch (type) {
            case "retry-started":
                return _jsx(RefreshCw, { className: "w-4 h-4 text-blue-500" });
            case "retry-progress":
                return _jsx(RefreshCw, { className: "w-4 h-4 text-blue-500 animate-spin" });
            case "retry-success":
                return _jsx(CheckCircle, { className: "w-4 h-4 text-green-500" });
            case "retry-failed":
                return _jsx(X, { className: "w-4 h-4 text-red-500" });
            case "retry-cancelled":
                return _jsx(AlertTriangle, { className: "w-4 h-4 text-yellow-500" });
            default:
                return _jsx(Info, { className: "w-4 h-4 text-gray-500" });
        }
    };
    const getNotificationColor = (type) => {
        switch (type) {
            case "retry-started":
                return "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20";
            case "retry-progress":
                return "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20";
            case "retry-success":
                return "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20";
            case "retry-failed":
                return "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20";
            case "retry-cancelled":
                return "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20";
            default:
                return "border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/20";
        }
    };
    const formatNotificationMessage = (notification) => {
        const { message, data } = notification;
        // Replace placeholders with actual values
        let formattedMessage = message;
        if (data) {
            if (data.toolName) {
                formattedMessage = formattedMessage.replace(/{{tool}}/g, data.toolName);
            }
            if (data.attempt !== undefined) {
                formattedMessage = formattedMessage.replace(/{{attempt}}/g, data.attempt.toString());
            }
            if (data.maxAttempts !== undefined) {
                formattedMessage = formattedMessage.replace(/{{maxAttempts}}/g, data.maxAttempts.toString());
            }
        }
        return formattedMessage;
    };
    const handleNotificationClick = (notification) => {
        // Handle different notification actions
        switch (notification.type) {
            case "retry-started":
            case "retry-progress":
                // Focus on the retry state
                if (notification.retryId && retryStates[notification.retryId]) {
                    vscode.postMessage({
                        type: "retry-focus",
                        retryId: notification.retryId,
                    });
                }
                break;
            case "retry-failed":
                // Show error recovery options
                if (notification.retryId && retryStates[notification.retryId]) {
                    vscode.postMessage({
                        type: "retry-show-recovery",
                        retryId: notification.retryId,
                    });
                }
                break;
        }
    };
    if (visibleNotifications.length === 0) {
        return null;
    }
    return (_jsx("div", { className: `fixed top-4 right-4 z-50 space-y-2 max-w-sm ${className}`, children: visibleNotifications.map((notification) => (_jsxs("div", { className: `flex items-start gap-3 p-3 rounded-lg border shadow-lg cursor-pointer transition-all duration-200 hover:shadow-xl ${getNotificationColor(notification.type)}`, onClick: () => handleNotificationClick(notification), children: [_jsx("div", { className: "flex-shrink-0 mt-0.5", children: getNotificationIcon(notification.type) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center justify-between mb-1", children: [_jsx("p", { className: "text-sm font-medium text-gray-900 dark:text-gray-100", children: formatNotificationMessage(notification) }), _jsx("button", { onClick: (e) => {
                                        e.stopPropagation();
                                        onDismissNotification(notification.id);
                                    }, className: "flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300", children: _jsx(X, { className: "w-3 h-3" }) })] }), notification.timestamp && (_jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400", children: new Date(notification.timestamp).toLocaleTimeString() })), notification.data && (_jsxs("div", { className: "mt-2 text-xs text-gray-600 dark:text-gray-400", children: [notification.data.toolName && _jsxs("span", { children: ["Tool: ", notification.data.toolName] }), notification.data.attempt !== undefined && (_jsxs("span", { className: "ml-2", children: ["Attempt: ", notification.data.attempt, notification.data.maxAttempts && `/${notification.data.maxAttempts}`] }))] }))] })] }, notification.id))) }));
};
export const RetryProgressIndicator = ({ retryState, className = "" }) => {
    const [progress, setProgress] = useState(0);
    const [timeRemaining, setTimeRemaining] = useState(0);
    useEffect(() => {
        if (!retryState.isActive || !retryState.nextRetryTime)
            return;
        const updateProgress = () => {
            const now = Date.now();
            const totalDuration = retryState.nextRetryTime - retryState.startTime;
            const elapsed = now - retryState.startTime;
            const newProgress = Math.min(100, (elapsed / totalDuration) * 100);
            setProgress(newProgress);
            setTimeRemaining(Math.max(0, retryState.nextRetryTime - now));
        };
        updateProgress();
        const interval = setInterval(updateProgress, 100);
        return () => clearInterval(interval);
    }, [retryState]);
    const formatTime = (ms) => {
        if (ms < 1000)
            return `${ms}ms`;
        if (ms < 60000)
            return `${(ms / 1000).toFixed(1)}s`;
        return `${(ms / 60000).toFixed(1)}m`;
    };
    return (_jsxs("div", { className: `flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg ${className}`, children: [_jsx("div", { className: "flex-shrink-0", children: _jsx(RefreshCw, { className: "w-5 h-5 text-blue-500 animate-spin" }) }), _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsxs("span", { className: "text-sm font-medium text-blue-900 dark:text-blue-100", children: ["Retrying ", retryState.toolName, "..."] }), _jsxs("span", { className: "text-sm text-blue-700 dark:text-blue-300", children: [retryState.currentAttempt, "/", retryState.maxAttempts] })] }), _jsx("div", { className: "w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2 mb-2", children: _jsx("div", { className: "bg-blue-500 h-2 rounded-full transition-all duration-300", style: { width: `${progress}%` } }) }), timeRemaining > 0 && (_jsxs("div", { className: "flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400", children: [_jsx(Zap, { className: "w-3 h-3" }), _jsxs("span", { children: ["Next retry in ", formatTime(timeRemaining)] })] })), retryState.errors.length > 0 && (_jsx("div", { className: "mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs", children: _jsxs("p", { className: "text-red-800 dark:text-red-200", children: ["Last error: ", retryState.errors[retryState.errors.length - 1]] }) }))] })] }));
};
//# sourceMappingURL=RetryNotifications.js.map