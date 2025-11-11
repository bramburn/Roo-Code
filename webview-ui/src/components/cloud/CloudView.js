import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { VSCodeButton, VSCodeProgressRing, VSCodeTextField } from "@vscode/webview-ui-toolkit/react";
import { TelemetryEventName } from "@roo-code/types";
import { useAppTranslation } from "@src/i18n/TranslationContext";
import { useExtensionState } from "@src/context/ExtensionStateContext";
import { vscode } from "@src/utils/vscode";
import { telemetryClient } from "@src/utils/TelemetryClient";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { renderCloudBenefitsContent } from "./CloudUpsellDialog";
import { CircleAlert, Info, Lock, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tab, TabContent, TabHeader } from "../common/Tab";
import { Button } from "@/components/ui/button";
import { OrganizationSwitcher } from "./OrganizationSwitcher";
import { StandardTooltip } from "../ui";
// Define the production URL constant locally to avoid importing from cloud package in tests
const PRODUCTION_ROO_CODE_API_URL = "https://app.roocode.com";
export const CloudView = ({ userInfo, isAuthenticated, cloudApiUrl, onDone, organizations = [] }) => {
    const { t } = useAppTranslation();
    const { remoteControlEnabled, setRemoteControlEnabled, taskSyncEnabled, setTaskSyncEnabled, featureRoomoteControlEnabled, } = useExtensionState();
    const wasAuthenticatedRef = useRef(false);
    const timeoutRef = useRef(null);
    const manualUrlInputRef = useRef(null);
    // Manual URL entry state
    const [authInProgress, setAuthInProgress] = useState(false);
    const [showManualEntry, setShowManualEntry] = useState(false);
    const [manualUrl, setManualUrl] = useState("");
    // Track authentication state changes to detect successful logout
    useEffect(() => {
        if (isAuthenticated) {
            wasAuthenticatedRef.current = true;
            // Clear auth in progress state when authentication succeeds
            setAuthInProgress(false);
            setShowManualEntry(false);
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        }
        else if (wasAuthenticatedRef.current && !isAuthenticated) {
            // User just logged out successfully
            // NOTE: Telemetry events use ACCOUNT_* naming for continuity with existing analytics
            // and to maintain historical data consistency, even though the UI now uses "Cloud" terminology
            telemetryClient.capture(TelemetryEventName.ACCOUNT_LOGOUT_SUCCESS);
            wasAuthenticatedRef.current = false;
        }
    }, [isAuthenticated]);
    // Focus the manual URL input when it becomes visible
    useEffect(() => {
        if (showManualEntry && manualUrlInputRef.current) {
            // Small delay to ensure the DOM is ready
            setTimeout(() => {
                manualUrlInputRef.current?.focus();
            }, 50);
        }
    }, [showManualEntry]);
    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);
    const handleConnectClick = () => {
        // Send telemetry for cloud connect action
        // NOTE: Using ACCOUNT_* telemetry events for backward compatibility with analytics
        telemetryClient.capture(TelemetryEventName.ACCOUNT_CONNECT_CLICKED);
        vscode.postMessage({ type: "rooCloudSignIn" });
        // Start auth in progress state - show "Having trouble?" immediately for debugging
        setAuthInProgress(true);
    };
    const handleManualUrlChange = (e) => {
        const url = e.target.value;
        setManualUrl(url);
        // Auto-trigger authentication when a complete URL is pasted (with slight delay to ensure full paste is processed)
        setTimeout(() => {
            if (url.trim() && url.includes("://") && url.includes("/auth/clerk/callback")) {
                vscode.postMessage({ type: "rooCloudManualUrl", text: url.trim() });
            }
        }, 100);
    };
    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            const url = manualUrl.trim();
            if (url && url.includes("://") && url.includes("/auth/clerk/callback")) {
                vscode.postMessage({ type: "rooCloudManualUrl", text: url });
            }
        }
    };
    const handleShowManualEntry = () => {
        setShowManualEntry(true);
    };
    const handleReset = () => {
        setAuthInProgress(false);
        setShowManualEntry(false);
        setManualUrl("");
    };
    const handleLogoutClick = () => {
        // Send telemetry for cloud logout action
        // NOTE: Using ACCOUNT_* telemetry events for backward compatibility with analytics
        telemetryClient.capture(TelemetryEventName.ACCOUNT_LOGOUT_CLICKED);
        vscode.postMessage({ type: "rooCloudSignOut" });
    };
    const handleVisitCloudWebsite = () => {
        // Send telemetry for cloud website visit
        // NOTE: Using ACCOUNT_* telemetry events for backward compatibility with analytics
        telemetryClient.capture(TelemetryEventName.ACCOUNT_CONNECT_CLICKED);
        const cloudUrl = cloudApiUrl || PRODUCTION_ROO_CODE_API_URL;
        vscode.postMessage({ type: "openExternal", url: cloudUrl });
    };
    const handleOpenCloudUrl = () => {
        if (cloudApiUrl) {
            vscode.postMessage({ type: "openExternal", url: cloudApiUrl });
        }
    };
    const handleRemoteControlToggle = () => {
        const newValue = !remoteControlEnabled;
        setRemoteControlEnabled(newValue);
        vscode.postMessage({ type: "remoteControlEnabled", bool: newValue });
    };
    const handleTaskSyncToggle = () => {
        const newValue = !taskSyncEnabled;
        setTaskSyncEnabled(newValue);
        vscode.postMessage({ type: "taskSyncEnabled", bool: newValue });
    };
    return (_jsxs(Tab, { children: [_jsxs(TabHeader, { className: "flex justify-between items-center", children: [_jsx("h3", { className: "text-vscode-foreground m-0", children: isAuthenticated && t("cloud:title") }), _jsx(Button, { onClick: onDone, children: t("settings:common.done") })] }), _jsxs(TabContent, { className: "pt-10", children: [isAuthenticated ? (_jsxs(_Fragment, { children: [userInfo && (_jsxs("div", { className: "flex flex-col items-start ml-4 mb-6", children: [_jsx("div", { className: "w-16 h-16 mb-3 rounded-full overflow-hidden", children: userInfo?.picture ? (_jsx("img", { src: userInfo.picture, alt: t("cloud:profilePicture"), className: "w-full h-full object-cover" })) : (_jsx("div", { className: "w-full h-full flex items-center justify-center bg-vscode-button-background text-vscode-button-foreground text-xl", children: userInfo?.name?.charAt(0) || userInfo?.email?.charAt(0) || "?" })) }), userInfo.name && (_jsx("h2", { className: "text-lg font-medium text-vscode-foreground my-0", children: userInfo.name })), userInfo?.email && (_jsx("p", { className: "text-sm text-vscode-descriptionForeground my-0", children: userInfo?.email })), _jsx("div", { className: "w-full max-w-60 mt-4", children: _jsx(OrganizationSwitcher, { userInfo: userInfo, organizations: organizations, cloudApiUrl: cloudApiUrl }) })] })), _jsxs("div", { className: "mt-4 p-4 border-b border-t border-vscode-widget-border pl-4 max-w-140", children: [_jsxs("div", { className: "flex items-center gap-3 mb-2", children: [_jsx(ToggleSwitch, { checked: taskSyncEnabled, onChange: handleTaskSyncToggle, size: "medium", "aria-label": t("cloud:taskSync"), "data-testid": "task-sync-toggle", disabled: !!userInfo?.organizationId }), _jsxs("span", { className: "font-medium text-vscode-foreground flex items-center", children: [t("cloud:taskSync"), userInfo?.organizationId && (_jsx(StandardTooltip, { content: t("cloud:taskSyncManagedByOrganization"), children: _jsx("div", { className: "bg-vscode-badge-background text-vscode-badge-foreground/80 p-1.5 ml-2 -mb-2 relative -top-1 rounded-full inline-block cursor-help", children: _jsx(Lock, { className: "size-3 block" }) }) }))] })] }), _jsx("div", { className: "text-vscode-descriptionForeground text-sm mt-1 ml-8", children: t("cloud:taskSyncDescription") }), userInfo?.extensionBridgeEnabled && featureRoomoteControlEnabled && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex items-center gap-3 mt-4 mb-2", children: [_jsx(ToggleSwitch, { checked: remoteControlEnabled, onChange: handleRemoteControlToggle, size: "medium", "aria-label": t("cloud:remoteControl"), "data-testid": "remote-control-toggle", disabled: !taskSyncEnabled }), _jsx("span", { className: "font-medium text-vscode-foreground", children: t("cloud:remoteControl") })] }), _jsxs("div", { className: "text-vscode-descriptionForeground text-sm mt-1 mb-2 ml-8", children: [t("cloud:remoteControlDescription"), !taskSyncEnabled && (_jsxs("div", { className: "text-vscode-editorWarning-foreground mt-2", children: [_jsx(CircleAlert, { className: "inline size-3 mr-1 mb-0.5 text-vscode-editorWarning-foreground" }), t("cloud:remoteControlRequiresTaskSync")] }))] })] }))] }), _jsxs("div", { className: "text-vscode-descriptionForeground text-sm mt-4 mb-8 pl-4", children: [_jsx(Info, { className: "inline size-3 mr-1 mb-0.5 text-vscode-descriptionForeground" }), t("cloud:usageMetricsAlwaysReported")] }), _jsxs("div", { className: "flex flex-col gap-2 mt-4 pl-4", children: [_jsx(VSCodeButton, { appearance: "secondary", onClick: handleVisitCloudWebsite, className: "w-full max-w-80", children: t("cloud:visitCloudWebsite") }), _jsx(VSCodeButton, { appearance: "secondary", onClick: handleLogoutClick, className: "w-full max-w-80", children: t("cloud:logOut") })] })] })) : (_jsx(_Fragment, { children: _jsxs("div", { className: "flex flex-col items-start gap-4 px-8 max-w-100", children: [_jsx("div", { className: cn(authInProgress && "opacity-50"), children: renderCloudBenefitsContent(t) }), !authInProgress && (_jsx(VSCodeButton, { appearance: "primary", onClick: handleConnectClick, className: "w-full", children: t("cloud:connect") })), authInProgress && !showManualEntry && (
                                // Timeout message with "Having trouble?" link
                                _jsxs("div", { className: "flex flex-col items-start gap-1", children: [_jsxs("div", { className: "flex items-center gap-2 text-base text-vscode-descriptionForeground", children: [_jsx(VSCodeProgressRing, { className: "size-3 text-vscode-foreground" }), t("cloud:authWaiting")] }), !showManualEntry && (_jsx("button", { onClick: handleShowManualEntry, className: "text-base ml-5 text-vscode-textLink-foreground hover:text-vscode-textLink-activeForeground underline cursor-pointer bg-transparent border-none p-0", children: t("cloud:havingTrouble") }))] })), showManualEntry && (
                                // Manual URL entry form
                                _jsxs("div", { className: "space-y-2 max-w-72", children: [_jsx("p", { className: "text-base text-vscode-descriptionForeground", children: t("cloud:pasteCallbackUrl") }), _jsx(VSCodeTextField, { ref: manualUrlInputRef, value: manualUrl, onChange: handleManualUrlChange, onKeyDown: handleKeyDown, placeholder: "vscode://RooVeterinaryInc.roo-cline/auth/clerk/callback?state=...", className: "w-full" }), _jsxs("p", { className: "mt-1", children: ["or", " ", _jsx("button", { onClick: handleReset, className: "text-base text-vscode-textLink-foreground hover:text-vscode-textLink-activeForeground underline cursor-pointer bg-transparent border-none p-0", children: t("cloud:startOver") })] })] }))] }) })), cloudApiUrl && cloudApiUrl !== PRODUCTION_ROO_CODE_API_URL && (_jsx("div", { className: "ml-4 mt-6 flex", children: _jsxs("div", { className: "inline-flex items-center gap-2 text-xs", children: [_jsx(TriangleAlert, { className: "size-3 text-vscode-descriptionForeground" }), _jsxs("span", { className: "text-vscode-foreground/75", children: [t("cloud:cloudUrlPillLabel"), " "] }), _jsx("button", { onClick: handleOpenCloudUrl, className: "text-vscode-textLink-foreground hover:text-vscode-textLink-activeForeground underline cursor-pointer bg-transparent border-none p-0", children: cloudApiUrl })] }) }))] })] }));
};
//# sourceMappingURL=CloudView.js.map