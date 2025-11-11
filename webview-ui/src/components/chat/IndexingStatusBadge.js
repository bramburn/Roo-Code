import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from "react";
import { Database } from "lucide-react";
import { cn } from "@src/lib/utils";
import { vscode } from "@src/utils/vscode";
import { useAppTranslation } from "@/i18n/TranslationContext";
import { useExtensionState } from "@src/context/ExtensionStateContext";
import { PopoverTrigger, StandardTooltip, Button } from "@src/components/ui";
import { CodeIndexPopover } from "./CodeIndexPopover";
export const IndexingStatusBadge = ({ className }) => {
    const { t } = useAppTranslation();
    const { cwd } = useExtensionState();
    const [indexingStatus, setIndexingStatus] = useState({
        systemStatus: "Standby",
        processedItems: 0,
        totalItems: 0,
        currentItemUnit: "items",
    });
    useEffect(() => {
        // Request initial indexing status.
        vscode.postMessage({ type: "requestIndexingStatus" });
        // Set up message listener for status updates.
        const handleMessage = (event) => {
            if (event.data.type === "indexingStatusUpdate") {
                const status = event.data.values;
                if (!status.workspacePath || status.workspacePath === cwd) {
                    setIndexingStatus(status);
                }
            }
        };
        window.addEventListener("message", handleMessage);
        return () => {
            window.removeEventListener("message", handleMessage);
        };
    }, [cwd]);
    const progressPercentage = useMemo(() => indexingStatus.totalItems > 0
        ? Math.round((indexingStatus.processedItems / indexingStatus.totalItems) * 100)
        : 0, [indexingStatus.processedItems, indexingStatus.totalItems]);
    const tooltipText = useMemo(() => {
        switch (indexingStatus.systemStatus) {
            case "Standby":
                return t("chat:indexingStatus.ready");
            case "Indexing":
                return t("chat:indexingStatus.indexing", { percentage: progressPercentage });
            case "Indexed":
                return t("chat:indexingStatus.indexed");
            case "Error":
                return t("chat:indexingStatus.error");
            default:
                return t("chat:indexingStatus.status");
        }
    }, [indexingStatus.systemStatus, progressPercentage, t]);
    const statusColorClass = useMemo(() => {
        const statusColors = {
            Standby: "bg-vscode-descriptionForeground/60",
            Indexing: "bg-yellow-500 animate-pulse",
            Indexed: "bg-green-500",
            Error: "bg-red-500",
        };
        return statusColors[indexingStatus.systemStatus] || statusColors.Standby;
    }, [indexingStatus.systemStatus]);
    return (_jsx(CodeIndexPopover, { indexingStatus: indexingStatus, children: _jsx(StandardTooltip, { content: tooltipText, children: _jsx(PopoverTrigger, { asChild: true, children: _jsxs(Button, { variant: "ghost", size: "sm", "aria-label": tooltipText, className: cn("relative h-5 w-5 p-0", "text-vscode-foreground opacity-85", "hover:opacity-100 hover:bg-[rgba(255,255,255,0.03)]", "focus:outline-none focus-visible:ring-1 focus-visible:ring-vscode-focusBorder", className), children: [_jsx(Database, { className: "w-4 h-4" }), _jsx("span", { className: cn("absolute top-0 right-0 w-1.5 h-1.5 rounded-full transition-colors duration-200", statusColorClass) })] }) }) }) }));
};
//# sourceMappingURL=IndexingStatusBadge.js.map