import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSize } from "react-use";
import { useTranslation, Trans } from "react-i18next";
import deepEqual from "fast-deep-equal";
import { VSCodeBadge } from "@vscode/webview-ui-toolkit/react";
import { COMMAND_OUTPUT_STRING } from "@roo/combineCommandSequences";
import { safeJsonParse } from "@roo/safeJsonParse";
import { useExtensionState } from "@src/context/ExtensionStateContext";
import { findMatchingResourceOrTemplate } from "@src/utils/mcp";
import { vscode } from "@src/utils/vscode";
import { removeLeadingNonAlphanumeric } from "@src/utils/removeLeadingNonAlphanumeric";
import { getLanguageFromPath } from "@src/utils/getLanguageFromPath";
import { ToolUseBlock, ToolUseBlockHeader } from "../common/ToolUseBlock";
import UpdateTodoListToolBlock from "./UpdateTodoListToolBlock";
import CodeAccordian from "../common/CodeAccordian";
import MarkdownBlock from "../common/MarkdownBlock";
import { ReasoningBlock } from "./ReasoningBlock";
import Thumbnails from "../common/Thumbnails";
import ImageBlock from "../common/ImageBlock";
import ErrorRow from "./ErrorRow";
import McpResourceRow from "../mcp/McpResourceRow";
import { Mention } from "./Mention";
import { CheckpointSaved } from "./checkpoints/CheckpointSaved";
import { FollowUpSuggest } from "./FollowUpSuggest";
import { BatchFilePermission } from "./BatchFilePermission";
import { BatchDiffApproval } from "./BatchDiffApproval";
import { ProgressIndicator } from "./ProgressIndicator";
import { Markdown } from "./Markdown";
import { CommandExecution } from "./CommandExecution";
import { CommandExecutionError } from "./CommandExecutionError";
import { AutoApprovedRequestLimitWarning } from "./AutoApprovedRequestLimitWarning";
import { CondenseContextErrorRow, CondensingContextRow, ContextCondenseRow } from "./ContextCondenseRow";
import CodebaseSearchResultsDisplay from "./CodebaseSearchResultsDisplay";
import { appendImages } from "@src/utils/imageUtils";
import { McpExecution } from "./McpExecution";
import { ChatTextArea } from "./ChatTextArea";
import { MAX_IMAGES_PER_MESSAGE } from "./ChatView";
import { useSelectedModel } from "../ui/hooks/useSelectedModel";
import { Eye, FileDiff, ListTree, User, Edit, Trash2, MessageCircleQuestionMark, SquareArrowOutUpRight, FileCode2, PocketKnife, FolderTree, TerminalSquare, MessageCircle, } from "lucide-react";
import { cn } from "@/lib/utils";
const ChatRow = memo((props) => {
    const { isLast, onHeightChange, message } = props;
    // Store the previous height to compare with the current height
    // This allows us to detect changes without causing re-renders
    const prevHeightRef = useRef(0);
    const [chatrow, { height }] = useSize(_jsx("div", { className: "px-[15px] py-[10px] pr-[6px]", children: _jsx(ChatRowContent, { ...props }) }));
    useEffect(() => {
        // used for partials, command output, etc.
        // NOTE: it's important we don't distinguish between partial or complete here since our scroll effects in chatview need to handle height change during partial -> complete
        const isInitialRender = prevHeightRef.current === 0; // prevents scrolling when new element is added since we already scroll for that
        // height starts off at Infinity
        if (isLast && height !== 0 && height !== Infinity && height !== prevHeightRef.current) {
            if (!isInitialRender) {
                onHeightChange(height > prevHeightRef.current);
            }
            prevHeightRef.current = height;
        }
    }, [height, isLast, onHeightChange, message]);
    // we cannot return null as virtuoso does not support it, so we use a separate visibleMessages array to filter out messages that should not be rendered
    return chatrow;
}, 
// memo does shallow comparison of props, so we need to do deep comparison of arrays/objects whose properties might change
deepEqual);
export default ChatRow;
export const ChatRowContent = ({ message, lastModifiedMessage, isExpanded, isLast, isStreaming, onToggleExpand, onSuggestionClick, onFollowUpUnmount, onBatchFileResponse, isFollowUpAnswered, editable, }) => {
    const { t } = useTranslation();
    const { mcpServers, alwaysAllowMcp, currentCheckpoint, mode, apiConfiguration } = useExtensionState();
    const { info: model } = useSelectedModel(apiConfiguration);
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState("");
    const [editMode, setEditMode] = useState(mode || "code");
    const [editImages, setEditImages] = useState([]);
    // Handle message events for image selection during edit mode
    useEffect(() => {
        const handleMessage = (event) => {
            const msg = event.data;
            if (msg.type === "selectedImages" && msg.context === "edit" && msg.messageTs === message.ts && isEditing) {
                setEditImages((prevImages) => appendImages(prevImages, msg.images, MAX_IMAGES_PER_MESSAGE));
            }
        };
        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, [isEditing, message.ts]);
    // Memoized callback to prevent re-renders caused by inline arrow functions.
    const handleToggleExpand = useCallback(() => {
        onToggleExpand(message.ts);
    }, [onToggleExpand, message.ts]);
    // Handle edit button click
    const handleEditClick = useCallback(() => {
        setIsEditing(true);
        setEditedContent(message.text || "");
        setEditImages(message.images || []);
        setEditMode(mode || "code");
        // Edit mode is now handled entirely in the frontend
        // No need to notify the backend
    }, [message.text, message.images, mode]);
    // Handle cancel edit
    const handleCancelEdit = useCallback(() => {
        setIsEditing(false);
        setEditedContent(message.text || "");
        setEditImages(message.images || []);
        setEditMode(mode || "code");
    }, [message.text, message.images, mode]);
    // Handle save edit
    const handleSaveEdit = useCallback(() => {
        setIsEditing(false);
        // Send edited message to backend
        vscode.postMessage({
            type: "submitEditedMessage",
            value: message.ts,
            editedMessageContent: editedContent,
            images: editImages,
        });
    }, [message.ts, editedContent, editImages]);
    // Handle image selection for editing
    const handleSelectImages = useCallback(() => {
        vscode.postMessage({ type: "selectImages", context: "edit", messageTs: message.ts });
    }, [message.ts]);
    const [cost, apiReqCancelReason, apiReqStreamingFailedMessage] = useMemo(() => {
        if (message.text !== null && message.text !== undefined && message.say === "api_req_started") {
            const info = safeJsonParse(message.text);
            return [info?.cost, info?.cancelReason, info?.streamingFailedMessage];
        }
        return [undefined, undefined, undefined];
    }, [message.text, message.say]);
    // When resuming task, last wont be api_req_failed but a resume_task
    // message, so api_req_started will show loading spinner. That's why we just
    // remove the last api_req_started that failed without streaming anything.
    const apiRequestFailedMessage = isLast && lastModifiedMessage?.ask === "api_req_failed" // if request is retried then the latest message is a api_req_retried
        ? lastModifiedMessage?.text
        : undefined;
    const isCommandExecuting = isLast && lastModifiedMessage?.ask === "command" && lastModifiedMessage?.text?.includes(COMMAND_OUTPUT_STRING);
    const isMcpServerResponding = isLast && lastModifiedMessage?.say === "mcp_server_request_started";
    const type = message.type === "ask" ? message.ask : message.say;
    const normalColor = "var(--vscode-foreground)";
    const errorColor = "var(--vscode-errorForeground)";
    const successColor = "var(--vscode-charts-green)";
    const cancelledColor = "var(--vscode-descriptionForeground)";
    const [icon, title] = useMemo(() => {
        switch (type) {
            case "error":
            case "mistake_limit_reached":
                return [null, null]; // These will be handled by ErrorRow component
            case "command":
                return [
                    isCommandExecuting ? (_jsx(ProgressIndicator, {})) : (_jsx(TerminalSquare, { className: "size-4", "aria-label": "Terminal icon" })),
                    _jsx("span", { style: { color: normalColor, fontWeight: "bold" }, children: t("chat:commandExecution.running") }),
                ];
            case "use_mcp_server":
                const mcpServerUse = safeJsonParse(message.text);
                if (mcpServerUse === undefined) {
                    return [null, null];
                }
                return [
                    isMcpServerResponding ? (_jsx(ProgressIndicator, {})) : (_jsx("span", { className: "codicon codicon-server", style: { color: normalColor, marginBottom: "-1.5px" } })),
                    _jsx("span", { style: { color: normalColor, fontWeight: "bold" }, children: mcpServerUse.type === "use_mcp_tool"
                            ? t("chat:mcp.wantsToUseTool", { serverName: mcpServerUse.serverName })
                            : t("chat:mcp.wantsToAccessResource", { serverName: mcpServerUse.serverName }) }),
                ];
            case "completion_result":
                return [
                    _jsx("span", { className: "codicon codicon-check", style: { color: successColor, marginBottom: "-1.5px" } }),
                    _jsx("span", { style: { color: successColor, fontWeight: "bold" }, children: t("chat:taskCompleted") }),
                ];
            case "api_req_retry_delayed":
                return [];
            case "api_req_started":
                const getIconSpan = (iconName, color) => (_jsx("div", { style: {
                        width: 16,
                        height: 16,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }, children: _jsx("span", { className: `codicon codicon-${iconName}`, style: { color, fontSize: 16, marginBottom: "-1.5px" } }) }));
                return [
                    apiReqCancelReason !== null && apiReqCancelReason !== undefined ? (apiReqCancelReason === "user_cancelled" ? (getIconSpan("error", cancelledColor)) : (getIconSpan("error", errorColor))) : cost !== null && cost !== undefined ? (getIconSpan("arrow-swap", normalColor)) : apiRequestFailedMessage ? (getIconSpan("error", errorColor)) : (_jsx(ProgressIndicator, {})),
                    apiReqCancelReason !== null && apiReqCancelReason !== undefined ? (apiReqCancelReason === "user_cancelled" ? (_jsx("span", { style: { color: normalColor, fontWeight: "bold" }, children: t("chat:apiRequest.cancelled") })) : (_jsx("span", { style: { color: errorColor, fontWeight: "bold" }, children: t("chat:apiRequest.streamingFailed") }))) : cost !== null && cost !== undefined ? (_jsx("span", { style: { color: normalColor }, children: t("chat:apiRequest.title") })) : apiRequestFailedMessage ? (_jsx("span", { style: { color: errorColor }, children: t("chat:apiRequest.failed") })) : (_jsx("span", { style: { color: normalColor }, children: t("chat:apiRequest.streaming") })),
                ];
            case "followup":
                return [
                    _jsx(MessageCircleQuestionMark, { className: "w-4 shrink-0", "aria-label": "Question icon" }),
                    _jsx("span", { style: { color: normalColor, fontWeight: "bold" }, children: t("chat:questions.hasQuestion") }),
                ];
            default:
                return [null, null];
        }
    }, [type, isCommandExecuting, message, isMcpServerResponding, apiReqCancelReason, cost, apiRequestFailedMessage, t]);
    const headerStyle = {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        marginBottom: "10px",
        wordBreak: "break-word",
    };
    const tool = useMemo(() => (message.ask === "tool" ? safeJsonParse(message.text) : null), [message.ask, message.text]);
    const followUpData = useMemo(() => {
        if (message.type === "ask" && message.ask === "followup" && !message.partial) {
            return safeJsonParse(message.text);
        }
        return null;
    }, [message.type, message.ask, message.partial, message.text]);
    if (tool) {
        const toolIcon = (name) => (_jsx("span", { className: `codicon codicon-${name}`, style: { color: "var(--vscode-foreground)", marginBottom: "-1.5px" } }));
        switch (tool.tool) {
            case "editedExistingFile":
            case "appliedDiff":
                // Check if this is a batch diff request
                if (message.type === "ask" && tool.batchDiffs && Array.isArray(tool.batchDiffs)) {
                    return (_jsxs(_Fragment, { children: [_jsxs("div", { style: headerStyle, children: [_jsx(FileDiff, { className: "w-4 shrink-0", "aria-label": "Batch diff icon" }), _jsx("span", { style: { fontWeight: "bold" }, children: t("chat:fileOperations.wantsToApplyBatchChanges") })] }), _jsx(BatchDiffApproval, { files: tool.batchDiffs, ts: message.ts })] }));
                }
                // Regular single file diff
                return (_jsxs(_Fragment, { children: [_jsxs("div", { style: headerStyle, children: [tool.isProtected ? (_jsx("span", { className: "codicon codicon-lock", style: { color: "var(--vscode-editorWarning-foreground)", marginBottom: "-1.5px" } })) : (toolIcon(tool.tool === "appliedDiff" ? "diff" : "edit")), _jsx("span", { style: { fontWeight: "bold" }, children: tool.isProtected
                                        ? t("chat:fileOperations.wantsToEditProtected")
                                        : tool.isOutsideWorkspace
                                            ? t("chat:fileOperations.wantsToEditOutsideWorkspace")
                                            : t("chat:fileOperations.wantsToEdit") })] }), _jsx("div", { className: "pl-6", children: _jsx(CodeAccordian, { path: tool.path, code: tool.content ?? tool.diff, language: "diff", progressStatus: message.progressStatus, isLoading: message.partial, isExpanded: isExpanded, onToggleExpand: handleToggleExpand }) })] }));
            case "insertContent":
                return (_jsxs(_Fragment, { children: [_jsxs("div", { style: headerStyle, children: [tool.isProtected ? (_jsx("span", { className: "codicon codicon-lock", style: { color: "var(--vscode-editorWarning-foreground)", marginBottom: "-1.5px" } })) : (toolIcon("insert")), _jsx("span", { style: { fontWeight: "bold" }, children: tool.isProtected
                                        ? t("chat:fileOperations.wantsToEditProtected")
                                        : tool.isOutsideWorkspace
                                            ? t("chat:fileOperations.wantsToEditOutsideWorkspace")
                                            : tool.lineNumber === 0
                                                ? t("chat:fileOperations.wantsToInsertAtEnd")
                                                : t("chat:fileOperations.wantsToInsertWithLineNumber", {
                                                    lineNumber: tool.lineNumber,
                                                }) })] }), _jsx("div", { className: "pl-6", children: _jsx(CodeAccordian, { path: tool.path, code: tool.diff, language: "diff", progressStatus: message.progressStatus, isLoading: message.partial, isExpanded: isExpanded, onToggleExpand: handleToggleExpand }) })] }));
            case "codebaseSearch": {
                return (_jsxs("div", { style: headerStyle, children: [toolIcon("search"), _jsx("span", { style: { fontWeight: "bold" }, children: tool.path ? (_jsx(Trans, { i18nKey: "chat:codebaseSearch.wantsToSearchWithPath", components: { code: _jsx("code", {}) }, values: { query: tool.query, path: tool.path } })) : (_jsx(Trans, { i18nKey: "chat:codebaseSearch.wantsToSearch", components: { code: _jsx("code", {}) }, values: { query: tool.query } })) })] }));
            }
            case "updateTodoList": {
                const todos = tool.todos || [];
                return (_jsx(UpdateTodoListToolBlock, { todos: todos, content: tool.content, onChange: (updatedTodos) => {
                        if (typeof vscode !== "undefined" && vscode?.postMessage) {
                            vscode.postMessage({ type: "updateTodoList", payload: { todos: updatedTodos } });
                        }
                    }, editable: editable && isLast }));
            }
            case "newFileCreated":
                return (_jsxs(_Fragment, { children: [_jsxs("div", { style: headerStyle, children: [tool.isProtected ? (_jsx("span", { className: "codicon codicon-lock", style: { color: "var(--vscode-editorWarning-foreground)", marginBottom: "-1.5px" } })) : (toolIcon("new-file")), _jsx("span", { style: { fontWeight: "bold" }, children: tool.isProtected
                                        ? t("chat:fileOperations.wantsToEditProtected")
                                        : t("chat:fileOperations.wantsToCreate") })] }), _jsx("div", { className: "pl-6", children: _jsx(CodeAccordian, { path: tool.path, code: tool.content, language: getLanguageFromPath(tool.path || "") || "log", isLoading: message.partial, isExpanded: isExpanded, onToggleExpand: handleToggleExpand, onJumpToFile: () => vscode.postMessage({ type: "openFile", text: "./" + tool.path }) }) })] }));
            case "readFile":
                // Check if this is a batch file permission request
                const isBatchRequest = message.type === "ask" && tool.batchFiles && Array.isArray(tool.batchFiles);
                if (isBatchRequest) {
                    return (_jsxs(_Fragment, { children: [_jsxs("div", { style: headerStyle, children: [_jsx(Eye, { className: "w-4 shrink-0", "aria-label": "View files icon" }), _jsx("span", { style: { fontWeight: "bold" }, children: t("chat:fileOperations.wantsToReadMultiple") })] }), _jsx(BatchFilePermission, { files: tool.batchFiles || [], onPermissionResponse: (response) => {
                                    onBatchFileResponse?.(response);
                                }, ts: message?.ts })] }));
                }
                // Regular single file read request
                return (_jsxs(_Fragment, { children: [_jsxs("div", { style: headerStyle, children: [_jsx(FileCode2, { className: "w-4 shrink-0", "aria-label": "Read file icon" }), _jsx("span", { style: { fontWeight: "bold" }, children: message.type === "ask"
                                        ? tool.isOutsideWorkspace
                                            ? t("chat:fileOperations.wantsToReadOutsideWorkspace")
                                            : tool.additionalFileCount && tool.additionalFileCount > 0
                                                ? t("chat:fileOperations.wantsToReadAndXMore", {
                                                    count: tool.additionalFileCount,
                                                })
                                                : t("chat:fileOperations.wantsToRead")
                                        : t("chat:fileOperations.didRead") })] }), _jsx("div", { className: "pl-6", children: _jsx(ToolUseBlock, { children: _jsxs(ToolUseBlockHeader, { className: "group", onClick: () => vscode.postMessage({ type: "openFile", text: tool.content }), children: [tool.path?.startsWith(".") && _jsx("span", { children: "." }), _jsxs("span", { className: "whitespace-nowrap overflow-hidden text-ellipsis text-left mr-2 rtl", children: [removeLeadingNonAlphanumeric(tool.path ?? "") + "\u200E", tool.reason] }), _jsx("div", { style: { flexGrow: 1 } }), _jsx(SquareArrowOutUpRight, { className: "w-4 shrink-0 codicon codicon-link-external opacity-0 group-hover:opacity-100 transition-opacity", style: { fontSize: 13.5, margin: "1px 0" } })] }) }) })] }));
            case "fetchInstructions":
                return (_jsxs(_Fragment, { children: [_jsxs("div", { style: headerStyle, children: [toolIcon("file-code"), _jsx("span", { style: { fontWeight: "bold" }, children: t("chat:instructions.wantsToFetch") })] }), _jsx("div", { className: "pl-6", children: _jsx(CodeAccordian, { code: tool.content, language: "markdown", isLoading: message.partial, isExpanded: isExpanded, onToggleExpand: handleToggleExpand }) })] }));
            case "listFilesTopLevel":
                return (_jsxs(_Fragment, { children: [_jsxs("div", { style: headerStyle, children: [_jsx(ListTree, { className: "w-4 shrink-0", "aria-label": "List files icon" }), _jsx("span", { style: { fontWeight: "bold" }, children: message.type === "ask"
                                        ? tool.isOutsideWorkspace
                                            ? t("chat:directoryOperations.wantsToViewTopLevelOutsideWorkspace")
                                            : t("chat:directoryOperations.wantsToViewTopLevel")
                                        : tool.isOutsideWorkspace
                                            ? t("chat:directoryOperations.didViewTopLevelOutsideWorkspace")
                                            : t("chat:directoryOperations.didViewTopLevel") })] }), _jsx("div", { className: "pl-6", children: _jsx(CodeAccordian, { path: tool.path, code: tool.content, language: "shell-session", isExpanded: isExpanded, onToggleExpand: handleToggleExpand }) })] }));
            case "listFilesRecursive":
                return (_jsxs(_Fragment, { children: [_jsxs("div", { style: headerStyle, children: [_jsx(FolderTree, { className: "w-4 shrink-0", "aria-label": "Folder tree icon" }), _jsx("span", { style: { fontWeight: "bold" }, children: message.type === "ask"
                                        ? tool.isOutsideWorkspace
                                            ? t("chat:directoryOperations.wantsToViewRecursiveOutsideWorkspace")
                                            : t("chat:directoryOperations.wantsToViewRecursive")
                                        : tool.isOutsideWorkspace
                                            ? t("chat:directoryOperations.didViewRecursiveOutsideWorkspace")
                                            : t("chat:directoryOperations.didViewRecursive") })] }), _jsx("div", { className: "pl-6", children: _jsx(CodeAccordian, { path: tool.path, code: tool.content, language: "shellsession", isExpanded: isExpanded, onToggleExpand: handleToggleExpand }) })] }));
            case "listCodeDefinitionNames":
                return (_jsxs(_Fragment, { children: [_jsxs("div", { style: headerStyle, children: [toolIcon("file-code"), _jsx("span", { style: { fontWeight: "bold" }, children: message.type === "ask"
                                        ? tool.isOutsideWorkspace
                                            ? t("chat:directoryOperations.wantsToViewDefinitionsOutsideWorkspace")
                                            : t("chat:directoryOperations.wantsToViewDefinitions")
                                        : tool.isOutsideWorkspace
                                            ? t("chat:directoryOperations.didViewDefinitionsOutsideWorkspace")
                                            : t("chat:directoryOperations.didViewDefinitions") })] }), _jsx("div", { className: "pl-6", children: _jsx(CodeAccordian, { path: tool.path, code: tool.content, language: "markdown", isExpanded: isExpanded, onToggleExpand: handleToggleExpand }) })] }));
            case "searchFiles":
                return (_jsxs(_Fragment, { children: [_jsxs("div", { style: headerStyle, children: [toolIcon("search"), _jsx("span", { style: { fontWeight: "bold" }, children: message.type === "ask" ? (_jsx(Trans, { i18nKey: tool.isOutsideWorkspace
                                            ? "chat:directoryOperations.wantsToSearchOutsideWorkspace"
                                            : "chat:directoryOperations.wantsToSearch", components: { code: _jsx("code", { className: "font-medium", children: tool.regex }) }, values: { regex: tool.regex } })) : (_jsx(Trans, { i18nKey: tool.isOutsideWorkspace
                                            ? "chat:directoryOperations.didSearchOutsideWorkspace"
                                            : "chat:directoryOperations.didSearch", components: { code: _jsx("code", { className: "font-medium", children: tool.regex }) }, values: { regex: tool.regex } })) })] }), _jsx("div", { className: "pl-6", children: _jsx(CodeAccordian, { path: tool.path + (tool.filePattern ? `/(${tool.filePattern})` : ""), code: tool.content, language: "shellsession", isExpanded: isExpanded, onToggleExpand: handleToggleExpand }) })] }));
            case "switchMode":
                return (_jsx(_Fragment, { children: _jsxs("div", { style: headerStyle, children: [_jsx(PocketKnife, { className: "w-4 shrink-0", "aria-label": "Switch mode icon" }), _jsx("span", { style: { fontWeight: "bold" }, children: message.type === "ask" ? (_jsx(_Fragment, { children: tool.reason ? (_jsx(Trans, { i18nKey: "chat:modes.wantsToSwitchWithReason", components: { code: _jsx("code", { className: "font-medium", children: tool.mode }) }, values: { mode: tool.mode, reason: tool.reason } })) : (_jsx(Trans, { i18nKey: "chat:modes.wantsToSwitch", components: { code: _jsx("code", { className: "font-medium", children: tool.mode }) }, values: { mode: tool.mode } })) })) : (_jsx(_Fragment, { children: tool.reason ? (_jsx(Trans, { i18nKey: "chat:modes.didSwitchWithReason", components: { code: _jsx("code", { className: "font-medium", children: tool.mode }) }, values: { mode: tool.mode, reason: tool.reason } })) : (_jsx(Trans, { i18nKey: "chat:modes.didSwitch", components: { code: _jsx("code", { className: "font-medium", children: tool.mode }) }, values: { mode: tool.mode } })) })) })] }) }));
            case "newTask":
                return (_jsxs(_Fragment, { children: [_jsxs("div", { style: headerStyle, children: [toolIcon("tasklist"), _jsx("span", { style: { fontWeight: "bold" }, children: _jsx(Trans, { i18nKey: "chat:subtasks.wantsToCreate", components: { code: _jsx("code", { children: tool.mode }) }, values: { mode: tool.mode } }) })] }), _jsxs("div", { style: {
                                marginTop: "4px",
                                backgroundColor: "var(--vscode-badge-background)",
                                border: "1px solid var(--vscode-badge-background)",
                                borderRadius: "4px 4px 0 0",
                                overflow: "hidden",
                                marginBottom: "2px",
                            }, children: [_jsxs("div", { style: {
                                        padding: "9px 10px 9px 14px",
                                        backgroundColor: "var(--vscode-badge-background)",
                                        borderBottom: "1px solid var(--vscode-editorGroup-border)",
                                        fontWeight: "bold",
                                        fontSize: "var(--vscode-font-size)",
                                        color: "var(--vscode-badge-foreground)",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "6px",
                                    }, children: [_jsx("span", { className: "codicon codicon-arrow-right" }), t("chat:subtasks.newTaskContent")] }), _jsx("div", { style: { padding: "12px 16px", backgroundColor: "var(--vscode-editor-background)" }, children: _jsx(MarkdownBlock, { markdown: tool.content }) })] })] }));
            case "finishTask":
                return (_jsxs(_Fragment, { children: [_jsxs("div", { style: headerStyle, children: [toolIcon("check-all"), _jsx("span", { style: { fontWeight: "bold" }, children: t("chat:subtasks.wantsToFinish") })] }), _jsxs("div", { style: {
                                marginTop: "4px",
                                backgroundColor: "var(--vscode-editor-background)",
                                border: "1px solid var(--vscode-badge-background)",
                                borderRadius: "4px",
                                overflow: "hidden",
                                marginBottom: "8px",
                            }, children: [_jsxs("div", { style: {
                                        padding: "9px 10px 9px 14px",
                                        backgroundColor: "var(--vscode-badge-background)",
                                        borderBottom: "1px solid var(--vscode-editorGroup-border)",
                                        fontWeight: "bold",
                                        fontSize: "var(--vscode-font-size)",
                                        color: "var(--vscode-badge-foreground)",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "6px",
                                    }, children: [_jsx("span", { className: "codicon codicon-check" }), t("chat:subtasks.completionContent")] }), _jsx("div", { style: { padding: "12px 16px", backgroundColor: "var(--vscode-editor-background)" }, children: _jsx(MarkdownBlock, { markdown: t("chat:subtasks.completionInstructions") }) })] })] }));
            case "runSlashCommand": {
                const slashCommandInfo = tool;
                return (_jsxs(_Fragment, { children: [_jsxs("div", { style: headerStyle, children: [toolIcon("play"), _jsx("span", { style: { fontWeight: "bold" }, children: message.type === "ask"
                                        ? t("chat:slashCommand.wantsToRun")
                                        : t("chat:slashCommand.didRun") })] }), _jsxs("div", { style: {
                                marginTop: "4px",
                                backgroundColor: "var(--vscode-editor-background)",
                                border: "1px solid var(--vscode-editorGroup-border)",
                                borderRadius: "4px",
                                overflow: "hidden",
                                cursor: "pointer",
                            }, onClick: handleToggleExpand, children: [_jsxs(ToolUseBlockHeader, { className: "group", style: {
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        padding: "10px 12px",
                                    }, children: [_jsxs("div", { style: { display: "flex", alignItems: "center", gap: "8px" }, children: [_jsxs("span", { style: { fontWeight: "500", fontSize: "var(--vscode-font-size)" }, children: ["/", slashCommandInfo.command] }), slashCommandInfo.source && (_jsx(VSCodeBadge, { style: { fontSize: "calc(var(--vscode-font-size) - 2px)" }, children: slashCommandInfo.source }))] }), _jsx("span", { className: `codicon codicon-chevron-${isExpanded ? "up" : "down"} opacity-0 group-hover:opacity-100 transition-opacity duration-200` })] }), isExpanded && (slashCommandInfo.args || slashCommandInfo.description) && (_jsxs("div", { style: {
                                        padding: "12px 16px",
                                        borderTop: "1px solid var(--vscode-editorGroup-border)",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "8px",
                                    }, children: [slashCommandInfo.args && (_jsxs("div", { children: [_jsx("span", { style: { fontWeight: "500" }, children: "Arguments: " }), _jsx("span", { style: { color: "var(--vscode-descriptionForeground)" }, children: slashCommandInfo.args })] })), slashCommandInfo.description && (_jsx("div", { style: { color: "var(--vscode-descriptionForeground)" }, children: slashCommandInfo.description }))] }))] })] }));
            }
            case "generateImage":
                return (_jsxs(_Fragment, { children: [_jsxs("div", { style: headerStyle, children: [tool.isProtected ? (_jsx("span", { className: "codicon codicon-lock", style: { color: "var(--vscode-editorWarning-foreground)", marginBottom: "-1.5px" } })) : (toolIcon("file-media")), _jsx("span", { style: { fontWeight: "bold" }, children: message.type === "ask"
                                        ? tool.isProtected
                                            ? t("chat:fileOperations.wantsToGenerateImageProtected")
                                            : tool.isOutsideWorkspace
                                                ? t("chat:fileOperations.wantsToGenerateImageOutsideWorkspace")
                                                : t("chat:fileOperations.wantsToGenerateImage")
                                        : t("chat:fileOperations.didGenerateImage") })] }), message.type === "ask" && (_jsx("div", { className: "pl-6", children: _jsx(CodeAccordian, { path: tool.path, code: tool.content, language: "text", isExpanded: isExpanded, onToggleExpand: handleToggleExpand }) }))] }));
            default:
                return null;
        }
    }
    switch (message.type) {
        case "say":
            switch (message.say) {
                case "diff_error":
                    return (_jsx(ErrorRow, { type: "diff_error", message: message.text || "", expandable: true, showCopyButton: true }));
                case "subtask_result":
                    return (_jsx("div", { children: _jsxs("div", { style: {
                                marginTop: "0px",
                                backgroundColor: "var(--vscode-badge-background)",
                                border: "1px solid var(--vscode-badge-background)",
                                borderRadius: "0 0 4px 4px",
                                overflow: "hidden",
                                marginBottom: "8px",
                            }, children: [_jsxs("div", { style: {
                                        padding: "9px 10px 9px 14px",
                                        backgroundColor: "var(--vscode-badge-background)",
                                        borderBottom: "1px solid var(--vscode-editorGroup-border)",
                                        fontWeight: "bold",
                                        fontSize: "var(--vscode-font-size)",
                                        color: "var(--vscode-badge-foreground)",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "6px",
                                    }, children: [_jsx("span", { className: "codicon codicon-arrow-left" }), t("chat:subtasks.resultContent")] }), _jsx("div", { style: {
                                        padding: "12px 16px",
                                        backgroundColor: "var(--vscode-editor-background)",
                                    }, children: _jsx(MarkdownBlock, { markdown: message.text }) })] }) }));
                case "reasoning":
                    return (_jsx(ReasoningBlock, { content: message.text || "", ts: message.ts, isStreaming: isStreaming, isLast: isLast, metadata: message.metadata }));
                case "api_req_started":
                    // Determine if the API request is in progress
                    const isApiRequestInProgress = apiReqCancelReason === undefined && apiRequestFailedMessage === undefined && cost === undefined;
                    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: `group text-sm transition-opacity ${isApiRequestInProgress ? "opacity-100" : "opacity-40 hover:opacity-100"}`, style: {
                                    ...headerStyle,
                                    marginBottom: ((cost === null || cost === undefined) && apiRequestFailedMessage) ||
                                        apiReqStreamingFailedMessage
                                        ? 10
                                        : 0,
                                    justifyContent: "space-between",
                                }, children: [_jsxs("div", { style: { display: "flex", alignItems: "center", gap: "10px", flexGrow: 1 }, children: [icon, title] }), _jsxs("div", { className: "text-xs text-vscode-dropdown-foreground border-vscode-dropdown-border/50 border px-1.5 py-0.5 rounded-lg", style: { opacity: cost !== null && cost !== undefined && cost > 0 ? 1 : 0 }, children: ["$", Number(cost || 0)?.toFixed(4)] })] }), (((cost === null || cost === undefined) && apiRequestFailedMessage) ||
                                apiReqStreamingFailedMessage) && (_jsx(ErrorRow, { type: "api_failure", message: apiRequestFailedMessage || apiReqStreamingFailedMessage || "", additionalContent: apiRequestFailedMessage?.toLowerCase().includes("powershell") ? (_jsxs(_Fragment, { children: [_jsx("br", {}), _jsx("br", {}), t("chat:powershell.issues"), " ", _jsx("a", { href: "https://github.com/cline/cline/wiki/TroubleShooting-%E2%80%90-%22PowerShell-is-not-recognized-as-an-internal-or-external-command%22", style: { color: "inherit", textDecoration: "underline" }, children: "troubleshooting guide" }), "."] })) : undefined }))] }));
                case "api_req_finished":
                    return null; // we should never see this message type
                case "text":
                    return (_jsxs("div", { children: [_jsxs("div", { style: headerStyle, children: [_jsx(MessageCircle, { className: "w-4 shrink-0", "aria-label": "Speech bubble icon" }), _jsx("span", { style: { fontWeight: "bold" }, children: t("chat:text.rooSaid") })] }), _jsxs("div", { className: "pl-6", children: [_jsx(Markdown, { markdown: message.text, partial: message.partial }), message.images && message.images.length > 0 && (_jsx("div", { style: { marginTop: "10px" }, children: message.images.map((image, index) => (_jsx(ImageBlock, { imageData: image }, index))) }))] })] }));
                case "user_feedback":
                    return (_jsxs("div", { className: "group", children: [_jsxs("div", { style: headerStyle, children: [_jsx(User, { className: "w-4 shrink-0", "aria-label": "User icon" }), _jsx("span", { style: { fontWeight: "bold" }, children: t("chat:feedback.youSaid") })] }), _jsxs("div", { className: cn("ml-6 border rounded-sm overflow-hidden whitespace-pre-wrap", isEditing
                                    ? "bg-vscode-editor-background text-vscode-editor-foreground"
                                    : "cursor-text p-1 bg-vscode-editor-foreground/70 text-vscode-editor-background"), children: [isEditing ? (_jsx("div", { className: "flex flex-col gap-2", children: _jsx(ChatTextArea, { inputValue: editedContent, setInputValue: setEditedContent, sendingDisabled: false, selectApiConfigDisabled: true, placeholderText: t("chat:editMessage.placeholder"), selectedImages: editImages, setSelectedImages: setEditImages, onSend: handleSaveEdit, onSelectImages: handleSelectImages, shouldDisableImages: !model?.supportsImages, mode: editMode, setMode: setEditMode, modeShortcutText: "", isEditMode: true, onCancel: handleCancelEdit }) })) : (_jsxs("div", { className: "flex justify-between", children: [_jsx("div", { className: "flex-grow px-2 py-1 wrap-anywhere rounded-lg transition-colors", onClick: (e) => {
                                                    e.stopPropagation();
                                                    if (!isStreaming) {
                                                        handleEditClick();
                                                    }
                                                }, title: t("chat:queuedMessages.clickToEdit"), children: _jsx(Mention, { text: message.text, withShadow: true }) }), _jsxs("div", { className: "flex gap-2 pr-1", children: [_jsx("div", { className: "cursor-pointer shrink-0 opacity-0 group-hover:opacity-100 transition-opacity", style: { visibility: isStreaming ? "hidden" : "visible" }, onClick: (e) => {
                                                            e.stopPropagation();
                                                            handleEditClick();
                                                        }, children: _jsx(Edit, { className: "w-4 shrink-0", "aria-label": "Edit message icon" }) }), _jsx("div", { className: "cursor-pointer shrink-0 opacity-0 group-hover:opacity-100 transition-opacity", style: { visibility: isStreaming ? "hidden" : "visible" }, onClick: (e) => {
                                                            e.stopPropagation();
                                                            vscode.postMessage({ type: "deleteMessage", value: message.ts });
                                                        }, children: _jsx(Trash2, { className: "w-4 shrink-0", "aria-label": "Delete message icon" }) })] })] })), !isEditing && message.images && message.images.length > 0 && (_jsx(Thumbnails, { images: message.images, style: { marginTop: "8px" } }))] })] }));
                case "user_feedback_diff":
                    const tool = safeJsonParse(message.text);
                    return (_jsx("div", { style: { marginTop: -10, width: "100%" }, children: _jsx(CodeAccordian, { code: tool?.diff, language: "diff", isFeedback: true, isExpanded: isExpanded, onToggleExpand: handleToggleExpand }) }));
                case "error":
                    return _jsx(ErrorRow, { type: "error", message: message.text || "" });
                case "completion_result":
                    return (_jsxs(_Fragment, { children: [_jsxs("div", { style: headerStyle, children: [icon, title] }), _jsx("div", { className: "border-l border-green-600/30 ml-2 pl-4 pb-1", children: _jsx(Markdown, { markdown: message.text }) })] }));
                case "shell_integration_warning":
                    return _jsx(CommandExecutionError, {});
                case "checkpoint_saved":
                    return (_jsx(CheckpointSaved, { ts: message.ts, commitHash: message.text, currentHash: currentCheckpoint, checkpoint: message.checkpoint }));
                case "condense_context":
                    if (message.partial) {
                        return _jsx(CondensingContextRow, {});
                    }
                    return message.contextCondense ? _jsx(ContextCondenseRow, { ...message.contextCondense }) : null;
                case "condense_context_error":
                    return _jsx(CondenseContextErrorRow, { errorText: message.text });
                case "codebase_search_result":
                    let parsed = null;
                    try {
                        if (message.text) {
                            parsed = JSON.parse(message.text);
                        }
                    }
                    catch (error) {
                        console.error("Failed to parse codebaseSearch content:", error);
                    }
                    if (parsed && !parsed?.content) {
                        console.error("Invalid codebaseSearch content structure:", parsed.content);
                        return _jsx("div", { children: "Error displaying search results." });
                    }
                    const { results = [] } = parsed?.content || {};
                    return _jsx(CodebaseSearchResultsDisplay, { results: results });
                case "user_edit_todos":
                    return _jsx(UpdateTodoListToolBlock, { userEdited: true, onChange: () => { } });
                case "tool":
                    // Handle say tool messages
                    const sayTool = safeJsonParse(message.text);
                    if (!sayTool)
                        return null;
                    switch (sayTool.tool) {
                        case "runSlashCommand": {
                            const slashCommandInfo = sayTool;
                            return (_jsxs(_Fragment, { children: [_jsxs("div", { style: headerStyle, children: [_jsx("span", { className: "codicon codicon-terminal-cmd", style: {
                                                    color: "var(--vscode-foreground)",
                                                    marginBottom: "-1.5px",
                                                } }), _jsx("span", { style: { fontWeight: "bold" }, children: t("chat:slashCommand.didRun") })] }), _jsx("div", { className: "pl-6", children: _jsx(ToolUseBlock, { children: _jsxs(ToolUseBlockHeader, { style: {
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    alignItems: "flex-start",
                                                    gap: "4px",
                                                    padding: "10px 12px",
                                                }, children: [_jsxs("div", { style: {
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: "8px",
                                                            width: "100%",
                                                        }, children: [_jsxs("span", { style: {
                                                                    fontWeight: "500",
                                                                    fontSize: "var(--vscode-font-size)",
                                                                }, children: ["/", slashCommandInfo.command] }), slashCommandInfo.args && (_jsx("span", { style: {
                                                                    color: "var(--vscode-descriptionForeground)",
                                                                    fontSize: "var(--vscode-font-size)",
                                                                }, children: slashCommandInfo.args }))] }), slashCommandInfo.description && (_jsx("div", { style: {
                                                            color: "var(--vscode-descriptionForeground)",
                                                            fontSize: "calc(var(--vscode-font-size) - 1px)",
                                                        }, children: slashCommandInfo.description })), slashCommandInfo.source && (_jsx("div", { style: { display: "flex", alignItems: "center", gap: "4px" }, children: _jsx(VSCodeBadge, { style: { fontSize: "calc(var(--vscode-font-size) - 2px)" }, children: slashCommandInfo.source }) }))] }) }) })] }));
                        }
                        default:
                            return null;
                    }
                case "image":
                    // Parse the JSON to get imageUri and imagePath
                    const imageInfo = safeJsonParse(message.text || "{}");
                    if (!imageInfo) {
                        return null;
                    }
                    return (_jsx("div", { style: { marginTop: "10px" }, children: _jsx(ImageBlock, { imageUri: imageInfo.imageUri, imagePath: imageInfo.imagePath }) }));
                default:
                    return (_jsxs(_Fragment, { children: [title && (_jsxs("div", { style: headerStyle, children: [icon, title] })), _jsx("div", { style: { paddingTop: 10 }, children: _jsx(Markdown, { markdown: message.text, partial: message.partial }) })] }));
            }
        case "ask":
            switch (message.ask) {
                case "mistake_limit_reached":
                    return _jsx(ErrorRow, { type: "mistake_limit", message: message.text || "" });
                case "command":
                    return (_jsx(CommandExecution, { executionId: message.ts.toString(), text: message.text, icon: icon, title: title }));
                case "use_mcp_server":
                    // Parse the message text to get the MCP server request
                    const messageJson = safeJsonParse(message.text, {});
                    // Extract the response field if it exists
                    const { response, ...mcpServerRequest } = messageJson;
                    // Create the useMcpServer object with the response field
                    const useMcpServer = {
                        ...mcpServerRequest,
                        response,
                    };
                    if (!useMcpServer) {
                        return null;
                    }
                    const server = mcpServers.find((server) => server.name === useMcpServer.serverName);
                    return (_jsxs(_Fragment, { children: [_jsxs("div", { style: headerStyle, children: [icon, title] }), _jsxs("div", { className: "w-full bg-vscode-editor-background border border-vscode-border rounded-xs p-2 mt-2", children: [useMcpServer.type === "access_mcp_resource" && (_jsx(McpResourceRow, { item: {
                                            // Use the matched resource/template details, with fallbacks
                                            ...(findMatchingResourceOrTemplate(useMcpServer.uri || "", server?.resources, server?.resourceTemplates) || {
                                                name: "",
                                                mimeType: "",
                                                description: "",
                                            }),
                                            // Always use the actual URI from the request
                                            uri: useMcpServer.uri || "",
                                        } })), useMcpServer.type === "use_mcp_tool" && (_jsx(McpExecution, { executionId: message.ts.toString(), text: useMcpServer.arguments !== "{}" ? useMcpServer.arguments : undefined, serverName: useMcpServer.serverName, toolName: useMcpServer.toolName, isArguments: true, server: server, useMcpServer: useMcpServer, alwaysAllowMcp: alwaysAllowMcp }))] })] }));
                case "completion_result":
                    if (message.text) {
                        return (_jsxs("div", { children: [_jsxs("div", { style: headerStyle, children: [icon, title] }), _jsx("div", { style: { color: "var(--vscode-charts-green)", paddingTop: 10 }, children: _jsx(Markdown, { markdown: message.text, partial: message.partial }) })] }));
                    }
                    else {
                        return null; // Don't render anything when we get a completion_result ask without text
                    }
                case "followup":
                    return (_jsxs(_Fragment, { children: [title && (_jsxs("div", { style: headerStyle, children: [icon, title] })), _jsxs("div", { className: "flex flex-col gap-2 ml-6", children: [_jsx(Markdown, { markdown: message.partial === true ? message?.text : followUpData?.question }), _jsx(FollowUpSuggest, { suggestions: followUpData?.suggest, onSuggestionClick: onSuggestionClick, ts: message?.ts, onCancelAutoApproval: onFollowUpUnmount, isAnswered: isFollowUpAnswered })] })] }));
                case "auto_approval_max_req_reached": {
                    return _jsx(AutoApprovedRequestLimitWarning, { message: message });
                }
                default:
                    return null;
            }
    }
};
//# sourceMappingURL=ChatRow.js.map