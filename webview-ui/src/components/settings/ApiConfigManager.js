import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { memo, useEffect, useRef, useState } from "react";
import { VSCodeTextField } from "@vscode/webview-ui-toolkit/react";
import { AlertTriangle } from "lucide-react";
import { useAppTranslation } from "@/i18n/TranslationContext";
import { Button, Input, Dialog, DialogContent, DialogTitle, StandardTooltip, SearchableSelect, } from "@/components/ui";
const ApiConfigManager = ({ currentApiConfigName = "", listApiConfigMeta = [], organizationAllowList, onSelectConfig, onDeleteConfig, onRenameConfig, onUpsertConfig, }) => {
    const { t } = useAppTranslation();
    const [isRenaming, setIsRenaming] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const [newProfileName, setNewProfileName] = useState("");
    const [error, setError] = useState(null);
    const inputRef = useRef(null);
    const newProfileInputRef = useRef(null);
    // Check if a profile is valid based on the organization allow list
    const isProfileValid = (profile) => {
        // If no organization allow list or allowAll is true, all profiles are valid
        if (!organizationAllowList || organizationAllowList.allowAll) {
            return true;
        }
        // Check if the provider is allowed
        const provider = profile.apiProvider;
        if (!provider)
            return true;
        const providerConfig = organizationAllowList.providers[provider];
        if (!providerConfig) {
            return false;
        }
        // If provider allows all models, profile is valid
        return !!providerConfig.allowAll || !!(providerConfig.models && providerConfig.models.length > 0);
    };
    const validateName = (name, isNewProfile) => {
        const trimmed = name.trim();
        if (!trimmed)
            return t("settings:providers.nameEmpty");
        const nameExists = listApiConfigMeta?.some((config) => config.name.toLowerCase() === trimmed.toLowerCase());
        // For new profiles, any existing name is invalid.
        if (isNewProfile && nameExists) {
            return t("settings:providers.nameExists");
        }
        // For rename, only block if trying to rename to a different existing profile.
        if (!isNewProfile && nameExists && trimmed.toLowerCase() !== currentApiConfigName?.toLowerCase()) {
            return t("settings:providers.nameExists");
        }
        return null;
    };
    const resetCreateState = () => {
        setIsCreating(false);
        setNewProfileName("");
        setError(null);
    };
    const resetRenameState = () => {
        setIsRenaming(false);
        setInputValue("");
        setError(null);
    };
    // Focus input when entering rename mode.
    useEffect(() => {
        if (isRenaming) {
            const timeoutId = setTimeout(() => inputRef.current?.focus(), 0);
            return () => clearTimeout(timeoutId);
        }
    }, [isRenaming]);
    // Focus input when opening new dialog.
    useEffect(() => {
        if (isCreating) {
            const timeoutId = setTimeout(() => newProfileInputRef.current?.focus(), 0);
            return () => clearTimeout(timeoutId);
        }
    }, [isCreating]);
    // Reset state when current profile changes.
    useEffect(() => {
        resetCreateState();
        resetRenameState();
    }, [currentApiConfigName]);
    const handleSelectConfig = (configName) => {
        if (!configName)
            return;
        onSelectConfig(configName);
    };
    const handleAdd = () => {
        resetCreateState();
        setIsCreating(true);
    };
    const handleStartRename = () => {
        setIsRenaming(true);
        setInputValue(currentApiConfigName || "");
        setError(null);
    };
    const handleCancel = () => {
        resetRenameState();
    };
    const handleSave = () => {
        const trimmedValue = inputValue.trim();
        const error = validateName(trimmedValue, false);
        if (error) {
            setError(error);
            return;
        }
        if (isRenaming && currentApiConfigName) {
            if (currentApiConfigName === trimmedValue) {
                resetRenameState();
                return;
            }
            onRenameConfig(currentApiConfigName, trimmedValue);
        }
        resetRenameState();
    };
    const handleNewProfileSave = () => {
        const trimmedValue = newProfileName.trim();
        const error = validateName(trimmedValue, true);
        if (error) {
            setError(error);
            return;
        }
        onUpsertConfig(trimmedValue);
        resetCreateState();
    };
    const handleDelete = () => {
        if (!currentApiConfigName || !listApiConfigMeta || listApiConfigMeta.length <= 1)
            return;
        // Let the extension handle both deletion and selection.
        onDeleteConfig(currentApiConfigName);
    };
    const isOnlyProfile = listApiConfigMeta?.length === 1;
    return (_jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { className: "block font-medium mb-1", children: t("settings:providers.configProfile") }), isRenaming ? (_jsxs("div", { "data-testid": "rename-form", children: [_jsxs("div", { className: "flex items-center gap-1", children: [_jsx(VSCodeTextField, { ref: inputRef, value: inputValue, onInput: (e) => {
                                    const target = e;
                                    setInputValue(target.target.value);
                                    setError(null);
                                }, placeholder: t("settings:providers.enterNewName"), onKeyDown: ({ key }) => {
                                    if (key === "Enter" && inputValue.trim()) {
                                        handleSave();
                                    }
                                    else if (key === "Escape") {
                                        handleCancel();
                                    }
                                }, className: "grow" }), _jsx(StandardTooltip, { content: t("settings:common.save"), children: _jsx(Button, { variant: "ghost", size: "icon", disabled: !inputValue.trim(), onClick: handleSave, "data-testid": "save-rename-button", children: _jsx("span", { className: "codicon codicon-check" }) }) }), _jsx(StandardTooltip, { content: t("settings:common.cancel"), children: _jsx(Button, { variant: "ghost", size: "icon", onClick: handleCancel, "data-testid": "cancel-rename-button", children: _jsx("span", { className: "codicon codicon-close" }) }) })] }), error && (_jsx("div", { className: "text-vscode-descriptionForeground text-sm mt-1", "data-testid": "error-message", children: error }))] })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex items-center gap-1", children: [_jsx(SearchableSelect, { value: currentApiConfigName, onValueChange: handleSelectConfig, options: listApiConfigMeta.map((config) => {
                                    const valid = isProfileValid(config);
                                    return {
                                        value: config.name,
                                        label: config.name,
                                        disabled: !valid,
                                        icon: !valid ? (_jsx(StandardTooltip, { content: t("settings:validation.profileInvalid"), children: _jsx("span", { children: _jsx(AlertTriangle, { size: 16, className: "mr-2 text-vscode-errorForeground" }) }) })) : undefined,
                                    };
                                }), placeholder: t("settings:common.select"), searchPlaceholder: t("settings:providers.searchPlaceholder"), emptyMessage: t("settings:providers.noMatchFound"), className: "grow", "data-testid": "select-component" }), _jsx(StandardTooltip, { content: t("settings:providers.addProfile"), children: _jsx(Button, { variant: "ghost", size: "icon", onClick: handleAdd, "data-testid": "add-profile-button", children: _jsx("span", { className: "codicon codicon-add" }) }) }), currentApiConfigName && (_jsxs(_Fragment, { children: [_jsx(StandardTooltip, { content: t("settings:providers.renameProfile"), children: _jsx(Button, { variant: "ghost", size: "icon", onClick: handleStartRename, "data-testid": "rename-profile-button", children: _jsx("span", { className: "codicon codicon-edit" }) }) }), _jsx(StandardTooltip, { content: isOnlyProfile
                                            ? t("settings:providers.cannotDeleteOnlyProfile")
                                            : t("settings:providers.deleteProfile"), children: _jsx(Button, { variant: "ghost", size: "icon", onClick: handleDelete, "data-testid": "delete-profile-button", disabled: isOnlyProfile, children: _jsx("span", { className: "codicon codicon-trash" }) }) })] }))] }), _jsx("div", { className: "text-vscode-descriptionForeground text-sm mt-1", children: t("settings:providers.description") })] })), _jsx(Dialog, { open: isCreating, onOpenChange: (open) => {
                    if (open) {
                        setIsCreating(true);
                        setNewProfileName("");
                        setError(null);
                    }
                    else {
                        resetCreateState();
                    }
                }, "aria-labelledby": "new-profile-title", children: _jsxs(DialogContent, { className: "p-4 max-w-sm bg-card", children: [_jsx(DialogTitle, { children: t("settings:providers.newProfile") }), _jsx(Input, { ref: newProfileInputRef, value: newProfileName, onInput: (e) => {
                                const target = e;
                                setNewProfileName(target.target.value);
                                setError(null);
                            }, placeholder: t("settings:providers.enterProfileName"), "data-testid": "new-profile-input", style: { width: "100%" }, onKeyDown: (e) => {
                                const event = e;
                                if (event.key === "Enter" && newProfileName.trim()) {
                                    handleNewProfileSave();
                                }
                                else if (event.key === "Escape") {
                                    resetCreateState();
                                }
                            } }), error && (_jsx("p", { className: "text-vscode-errorForeground text-sm mt-2", "data-testid": "error-message", children: error })), _jsxs("div", { className: "flex justify-end gap-2 mt-4", children: [_jsx(Button, { variant: "secondary", onClick: resetCreateState, "data-testid": "cancel-new-profile-button", children: t("settings:common.cancel") }), _jsx(Button, { variant: "default", disabled: !newProfileName.trim(), onClick: handleNewProfileSave, "data-testid": "create-profile-button", children: t("settings:providers.createProfile") })] })] }) })] }));
};
export default memo(ApiConfigManager);
//# sourceMappingURL=ApiConfigManager.js.map