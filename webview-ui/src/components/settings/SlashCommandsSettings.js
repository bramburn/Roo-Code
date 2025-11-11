import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Plus, Globe, Folder, Settings, SquareSlash } from "lucide-react";
import { Trans } from "react-i18next";
import { useAppTranslation } from "@/i18n/TranslationContext";
import { useExtensionState } from "@/context/ExtensionStateContext";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, Button, } from "@/components/ui";
import { vscode } from "@/utils/vscode";
import { buildDocLink } from "@/utils/docLinks";
import { SectionHeader } from "./SectionHeader";
import { Section } from "./Section";
import { SlashCommandItem } from "../chat/SlashCommandItem";
export const SlashCommandsSettings = () => {
    const { t } = useAppTranslation();
    const { commands, cwd } = useExtensionState();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [commandToDelete, setCommandToDelete] = useState(null);
    const [globalNewName, setGlobalNewName] = useState("");
    const [workspaceNewName, setWorkspaceNewName] = useState("");
    // Check if we're in a workspace/project
    const hasWorkspace = Boolean(cwd);
    // Request commands when component mounts
    useEffect(() => {
        handleRefresh();
    }, []);
    const handleRefresh = () => {
        vscode.postMessage({ type: "requestCommands" });
    };
    const handleDeleteClick = (command) => {
        setCommandToDelete(command);
        setDeleteDialogOpen(true);
    };
    const handleDeleteConfirm = () => {
        if (commandToDelete) {
            vscode.postMessage({
                type: "deleteCommand",
                text: commandToDelete.name,
                values: { source: commandToDelete.source },
            });
            setDeleteDialogOpen(false);
            setCommandToDelete(null);
            // Refresh the commands list after deletion
            setTimeout(handleRefresh, 100);
        }
    };
    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false);
        setCommandToDelete(null);
    };
    const handleCreateCommand = (source, name) => {
        if (!name.trim())
            return;
        // Append .md if not already present
        const fileName = name.trim().endsWith(".md") ? name.trim() : `${name.trim()}.md`;
        vscode.postMessage({
            type: "createCommand",
            text: fileName,
            values: { source },
        });
        // Clear the input and refresh
        if (source === "global") {
            setGlobalNewName("");
        }
        else {
            setWorkspaceNewName("");
        }
        setTimeout(handleRefresh, 500);
    };
    const handleCommandClick = (command) => {
        // For now, we'll just show the command name - editing functionality can be added later
        // This could be enhanced to open the command file in the editor
        console.log(`Command clicked: ${command.name} (${command.source})`);
    };
    // Group commands by source
    const builtInCommands = commands?.filter((cmd) => cmd.source === "built-in") || [];
    const globalCommands = commands?.filter((cmd) => cmd.source === "global") || [];
    const projectCommands = commands?.filter((cmd) => cmd.source === "project") || [];
    return (_jsxs("div", { children: [_jsx(SectionHeader, { children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(SquareSlash, { className: "w-4" }), _jsx("div", { children: t("settings:sections.slashCommands") })] }) }), _jsxs(Section, { children: [_jsx("div", { className: "mb-4", children: _jsx("p", { className: "text-sm text-vscode-descriptionForeground", children: _jsx(Trans, { i18nKey: "settings:slashCommands.description", components: {
                                    DocsLink: (_jsx("a", { href: buildDocLink("features/slash-commands", "slash_commands_settings"), target: "_blank", rel: "noopener noreferrer", className: "text-vscode-textLink-foreground hover:underline", children: "Docs" })),
                                } }) }) }), _jsxs("div", { className: "mb-6", children: [_jsxs("div", { className: "flex items-center gap-1.5 mb-2", children: [_jsx(Globe, { className: "w-3 h-3" }), _jsx("h4", { className: "text-sm font-medium m-0", children: t("chat:slashCommands.globalCommands") })] }), _jsxs("div", { className: "border border-vscode-panel-border rounded-md", children: [globalCommands.map((command) => (_jsx(SlashCommandItem, { command: command, onDelete: handleDeleteClick, onClick: handleCommandClick }, `global-${command.name}`))), _jsxs("div", { className: "px-4 py-2 flex items-center gap-2 hover:bg-vscode-list-hoverBackground border-t border-vscode-panel-border", children: [_jsx("input", { type: "text", value: globalNewName, onChange: (e) => setGlobalNewName(e.target.value), placeholder: t("chat:slashCommands.newGlobalCommandPlaceholder"), className: "flex-1 bg-vscode-input-background text-vscode-input-foreground placeholder-vscode-input-placeholderForeground border border-vscode-input-border rounded px-2 py-1 text-sm focus:outline-none focus:border-vscode-focusBorder", onKeyDown: (e) => {
                                                    if (e.key === "Enter") {
                                                        handleCreateCommand("global", globalNewName);
                                                    }
                                                } }), _jsx(Button, { variant: "ghost", size: "icon", onClick: () => handleCreateCommand("global", globalNewName), disabled: !globalNewName.trim(), className: "size-6 flex items-center justify-center opacity-60 hover:opacity-100", children: _jsx(Plus, { className: "w-4 h-4" }) })] })] })] }), hasWorkspace && (_jsxs("div", { className: "mb-6", children: [_jsxs("div", { className: "flex items-center gap-1.5 mb-2", children: [_jsx(Folder, { className: "w-3 h-3" }), _jsx("h4", { className: "text-sm font-medium m-0", children: t("chat:slashCommands.workspaceCommands") })] }), _jsxs("div", { className: "border border-vscode-panel-border rounded-md", children: [projectCommands.map((command) => (_jsx(SlashCommandItem, { command: command, onDelete: handleDeleteClick, onClick: handleCommandClick }, `project-${command.name}`))), _jsxs("div", { className: "px-4 py-2 flex items-center gap-2 hover:bg-vscode-list-hoverBackground border-t border-vscode-panel-border", children: [_jsx("input", { type: "text", value: workspaceNewName, onChange: (e) => setWorkspaceNewName(e.target.value), placeholder: t("chat:slashCommands.newWorkspaceCommandPlaceholder"), className: "flex-1 bg-vscode-input-background text-vscode-input-foreground placeholder-vscode-input-placeholderForeground border border-vscode-input-border rounded px-2 py-1 text-sm focus:outline-none focus:border-vscode-focusBorder", onKeyDown: (e) => {
                                                    if (e.key === "Enter") {
                                                        handleCreateCommand("project", workspaceNewName);
                                                    }
                                                } }), _jsx(Button, { variant: "ghost", size: "icon", onClick: () => handleCreateCommand("project", workspaceNewName), disabled: !workspaceNewName.trim(), className: "size-6 flex items-center justify-center opacity-60 hover:opacity-100", children: _jsx(Plus, { className: "w-4 h-4" }) })] })] })] })), builtInCommands.length > 0 && (_jsxs("div", { className: "mb-6", children: [_jsxs("div", { className: "flex items-center gap-1.5 mb-2", children: [_jsx(Settings, { className: "w-3 h-3" }), _jsx("h4", { className: "text-sm font-medium m-0", children: t("chat:slashCommands.builtInCommands") })] }), _jsx("div", { className: "border border-vscode-panel-border rounded-md", children: builtInCommands.map((command) => (_jsx(SlashCommandItem, { command: command, onDelete: handleDeleteClick, onClick: handleCommandClick }, `built-in-${command.name}`))) })] }))] }), _jsx(AlertDialog, { open: deleteDialogOpen, onOpenChange: setDeleteDialogOpen, children: _jsxs(AlertDialogContent, { children: [_jsxs(AlertDialogHeader, { children: [_jsx(AlertDialogTitle, { children: t("chat:slashCommands.deleteDialog.title") }), _jsx(AlertDialogDescription, { children: t("chat:slashCommands.deleteDialog.description", { name: commandToDelete?.name }) })] }), _jsxs(AlertDialogFooter, { children: [_jsx(AlertDialogCancel, { onClick: handleDeleteCancel, children: t("chat:slashCommands.deleteDialog.cancel") }), _jsx(AlertDialogAction, { onClick: handleDeleteConfirm, children: t("chat:slashCommands.deleteDialog.confirm") })] })] }) })] }));
};
//# sourceMappingURL=SlashCommandsSettings.js.map