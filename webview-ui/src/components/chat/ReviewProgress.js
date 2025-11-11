import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from "react";
import { Button } from "../ui/button";
/**
 * Review Progress Component
 * Displays visual progress indicators for manual review
 */
export const ReviewProgress = ({ status, onFallback, onFileOpen }) => {
    const [animatedProgress, setAnimatedProgress] = useState(0);
    // Format time display
    const formatTime = (ms) => {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    };
    // Calculate progress percentage
    const getProgressPercentage = useCallback(() => {
        if (!status || status.timeoutDuration === 0)
            return 0;
        const elapsed = status.timeoutDuration - (status.remainingTime || 0);
        return Math.min(100, (elapsed / status.timeoutDuration) * 100);
    }, [status]);
    // Animate progress bar
    useEffect(() => {
        if (status && status.state === "waiting") {
            const targetProgress = getProgressPercentage();
            const timer = setTimeout(() => {
                setAnimatedProgress(targetProgress);
            }, 100); // Small delay for smooth animation
            return () => clearTimeout(timer);
        }
        else {
            setAnimatedProgress(0);
        }
    }, [status, getProgressPercentage]);
    // Get status icon and color
    const getStatusInfo = () => {
        switch (status?.state) {
            case "waiting":
                return { icon: "⏳", color: "text-yellow-500", bgColor: "bg-yellow-500/10" };
            case "completed":
                return { icon: "✅", color: "text-green-500", bgColor: "bg-green-500/10" };
            case "timeout":
                return { icon: "⏰", color: "text-red-500", bgColor: "bg-red-500/10" };
            case "fallback":
                return { icon: "🔄", color: "text-blue-500", bgColor: "bg-blue-500/10" };
            default:
                return { icon: "⏸", color: "text-gray-500", bgColor: "bg-gray-500/10" };
        }
    };
    // Get status text
    const getStatusText = () => {
        switch (status?.state) {
            case "waiting":
                return "Waiting for manual context review...";
            case "completed":
                return "Review completed successfully";
            case "timeout":
                return "Review timed out - using intelligent compression";
            case "fallback":
                return "Using intelligent compression instead";
            default:
                return "Unknown status";
        }
    };
    const statusInfo = getStatusInfo();
    if (!status) {
        return (_jsx("div", { className: "flex flex-col items-center justify-center p-8", children: _jsx("div", { className: "text-center text-vscode-descriptionForeground", children: "Loading review progress..." }) }));
    }
    return (_jsxs("div", { className: "flex flex-col items-center justify-center p-6 border border-vscode-editor-border rounded-lg bg-vscode-editor-background", children: [_jsx("div", { className: `w-16 h-16 rounded-full flex items-center justify-center mb-4 ${statusInfo.bgColor}`, children: _jsx("div", { className: "text-2xl", children: statusInfo.icon }) }), _jsx("div", { className: `text-lg font-medium mb-4 ${statusInfo.color}`, children: getStatusText() }), status.state === "waiting" && (_jsxs("div", { className: "w-full max-w-md space-y-3", children: [_jsxs("div", { className: "relative", children: [_jsx("div", { className: "w-full bg-vscode-progress-background rounded-full h-3 overflow-hidden", children: _jsx("div", { className: "bg-gradient-to-r from-vscode-progress-foreground to-vscode-progress-foreground h-3 rounded-full transition-all duration-1000 ease-out relative", style: { width: `${animatedProgress}%` }, children: _jsx("div", { className: "absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" }) }) }), _jsxs("div", { className: "absolute -top-6 right-0 text-xs text-vscode-descriptionForeground", children: [Math.round(getProgressPercentage()), "%"] })] }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-sm text-vscode-descriptionForeground", children: "Time remaining" }), _jsx("div", { className: `text-lg font-mono font-medium text-vscode-foreground ${status.remainingTime && status.remainingTime < 60000 ? "animate-pulse text-red-500" : ""}`, children: formatTime(status.remainingTime || 0) })] }), status.remainingTime && status.remainingTime < 60000 && (_jsx("div", { className: "text-xs text-red-500 text-center animate-pulse", children: "\u26A0\uFE0F Less than 1 minute remaining" }))] })), (status.state === "waiting" || status.state === "timeout") && (_jsxs("div", { className: "mt-6 space-y-2 w-full max-w-md", children: [status.state === "waiting" && status.contextFile && (_jsx(Button, { onClick: () => onFileOpen?.(status.contextFile), variant: "secondary", className: "w-full", children: "\uD83D\uDCDD Open Context File" })), _jsx(Button, { onClick: () => onFallback?.(), variant: "default", className: "w-full", children: "\uD83D\uDE80 Use Intelligent Compression Instead" })] })), status.contextFile && (_jsxs("div", { className: "mt-6 p-4 bg-vscode-input-background rounded-lg border border-vscode-editor-border w-full max-w-md", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("div", { className: "text-sm font-medium text-vscode-foreground", children: "\uD83D\uDCC4 Context File" }), status.state === "waiting" && (_jsx("div", { className: "text-xs text-yellow-500 animate-pulse", children: "\u2022 Pending Review" }))] }), _jsx("div", { className: "text-xs text-vscode-descriptionForeground font-mono truncate mb-2", children: status.contextFile.split("/").pop() }), _jsx("div", { className: "text-xs text-vscode-descriptionForeground", children: status.state === "waiting"
                            ? "Review the context file and make your edits. Changes will be detected automatically."
                            : status.state === "completed"
                                ? "Context file has been reviewed and processed."
                                : "Context file review was completed via fallback." })] })), status.startTime && (_jsxs("div", { className: "mt-4 text-xs text-vscode-descriptionForeground text-center", children: ["Started: ", new Date(status.startTime).toLocaleTimeString()] }))] }));
};
//# sourceMappingURL=ReviewProgress.js.map