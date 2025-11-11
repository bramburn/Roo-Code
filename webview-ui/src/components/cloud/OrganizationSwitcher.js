import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Building2, User, Plus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectSeparator } from "@/components/ui/select";
import { useAppTranslation } from "@src/i18n/TranslationContext";
import { vscode } from "@src/utils/vscode";
export const OrganizationSwitcher = ({ userInfo, organizations, onOrganizationChange, cloudApiUrl, }) => {
    const { t } = useAppTranslation();
    const [selectedOrgId, setSelectedOrgId] = useState(userInfo.organizationId || null);
    const [isLoading, setIsLoading] = useState(false);
    // Update selected org when userInfo changes
    useEffect(() => {
        setSelectedOrgId(userInfo.organizationId || null);
    }, [userInfo.organizationId]);
    // Listen for organization switch results
    useEffect(() => {
        const handleMessage = (event) => {
            const message = event.data;
            if (message.type === "organizationSwitchResult") {
                // Reset loading state when we receive the result
                setIsLoading(false);
                if (message.success) {
                    // Update selected org based on the result
                    setSelectedOrgId(message.organizationId ?? null);
                }
                else {
                    // Revert to the previous organization on error
                    setSelectedOrgId(userInfo.organizationId || null);
                }
            }
        };
        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, [userInfo.organizationId]);
    const handleOrganizationChange = async (value) => {
        // Handle "Create Team Account" option
        if (value === "create-team") {
            if (cloudApiUrl) {
                const billingUrl = `${cloudApiUrl}/billing`;
                vscode.postMessage({ type: "openExternal", url: billingUrl });
            }
            return;
        }
        const newOrgId = value === "personal" ? null : value;
        // Don't do anything if selecting the same organization
        if (newOrgId === selectedOrgId) {
            return;
        }
        setIsLoading(true);
        // Send message to switch organization
        vscode.postMessage({
            type: "switchOrganization",
            organizationId: newOrgId,
        });
        // Update local state optimistically
        setSelectedOrgId(newOrgId);
        // Call the callback if provided
        if (onOrganizationChange) {
            onOrganizationChange(newOrgId);
        }
    };
    // Always show the switcher when user is authenticated
    const currentValue = selectedOrgId || "personal";
    return (_jsx("div", { className: "w-full", children: _jsxs(Select, { value: currentValue, onValueChange: handleOrganizationChange, disabled: isLoading, children: [_jsx(SelectTrigger, { className: "w-full", children: _jsx(SelectValue, { children: _jsx("div", { className: "flex items-center gap-2", children: selectedOrgId ? (_jsxs(_Fragment, { children: [organizations.find((org) => org.organization.id === selectedOrgId)?.organization
                                        .image_url ? (_jsx("img", { src: organizations.find((org) => org.organization.id === selectedOrgId)
                                            ?.organization.image_url, alt: "", className: "w-4.5 h-4.5 rounded-full object-cover overflow-clip" })) : (_jsx(Building2, { className: "w-4.5 h-4.5" })), _jsx("span", { className: "truncate", children: organizations.find((org) => org.organization.id === selectedOrgId)
                                            ?.organization.name })] })) : (_jsxs(_Fragment, { children: [_jsx("div", { className: "p-0.5 bg-vscode-button-background rounded-full flex items-center justify-center text-vscode-button-foreground text-xs", children: _jsx(User, { className: "w-4 h-4 text-vscode-button-foreground" }) }), _jsx("span", { children: t("cloud:personalAccount") })] })) }) }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "personal", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(User, { className: "w-4.5 h-4.5" }), _jsx("span", { children: t("cloud:personalAccount") })] }) }), organizations.length > 0 && _jsx(SelectSeparator, {}), organizations.map((org) => (_jsx(SelectItem, { value: org.organization.id, children: _jsxs("div", { className: "flex items-center gap-2", children: [org.organization.image_url ? (_jsx("img", { src: org.organization.image_url, alt: "", className: "w-4.5 h-4.5 rounded-full object-cover overflow-clip" })) : (_jsx(Building2, { className: "w-4.5 h-4.5" })), _jsx("span", { className: "truncate", children: org.organization.name })] }) }, org.organization.id))), organizations.length === 0 && (_jsxs(_Fragment, { children: [_jsx(SelectSeparator, {}), _jsx(SelectItem, { value: "create-team", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Plus, { className: "w-4.5 h-4.5" }), _jsx("span", { children: t("cloud:createTeamAccount") })] }) })] }))] })] }) }));
};
//# sourceMappingURL=OrganizationSwitcher.js.map