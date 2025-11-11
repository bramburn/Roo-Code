import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef } from "react";
import { ToolUseBlock, ToolUseBlockHeader } from "../common/ToolUseBlock";
import MarkdownBlock from "../common/MarkdownBlock";
const STATUS_OPTIONS = [
    { value: "", label: "Not Started", color: "var(--vscode-foreground)", border: "#bbb", bg: "transparent" },
    {
        value: "in_progress",
        label: "In Progress",
        color: "var(--vscode-charts-yellow)",
        border: "var(--vscode-charts-yellow)",
        bg: "rgba(255, 221, 51, 0.15)",
    },
    {
        value: "completed",
        label: "Completed",
        color: "var(--vscode-charts-green)",
        border: "var(--vscode-charts-green)",
        bg: "var(--vscode-charts-green)",
    },
];
const genId = () => Math.random().toString(36).slice(2, 10);
const UpdateTodoListToolBlock = ({ todos = [], content, onChange, editable = true, userEdited = false, }) => {
    const [editTodos, setEditTodos] = useState(todos.length > 0 ? todos.map((todo) => ({ ...todo, id: todo.id || genId() })) : []);
    const [adding, setAdding] = useState(false);
    const [newContent, setNewContent] = useState("");
    const newInputRef = useRef(null);
    const [deleteId, setDeleteId] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    // Automatically exit edit mode when external editable becomes false
    useEffect(() => {
        if (!editable && isEditing) {
            setIsEditing(false);
        }
    }, [editable, isEditing]);
    // Check if onChange is passed
    useEffect(() => {
        if (typeof onChange !== "function") {
            console.warn("UpdateTodoListToolBlock: onChange callback not passed, cannot notify model after todo changes!");
        }
        // Only check once on mount
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    // Sync when external props.todos changes
    useEffect(() => {
        setEditTodos(todos.length > 0 ? todos.map((todo) => ({ ...todo, id: todo.id || genId() })) : []);
    }, [todos]);
    // Auto focus on new item
    useEffect(() => {
        if (adding && newInputRef.current) {
            newInputRef.current.focus();
        }
    }, [adding]);
    // Edit content
    const handleContentChange = (id, value) => {
        const newTodos = editTodos.map((todo) => (todo.id === id ? { ...todo, content: value } : todo));
        setEditTodos(newTodos);
        onChange?.(newTodos);
    };
    // Change status
    const handleStatusChange = (id, status) => {
        const newTodos = editTodos.map((todo) => (todo.id === id ? { ...todo, status } : todo));
        setEditTodos(newTodos);
        onChange?.(newTodos);
    };
    // Delete (confirmation dialog)
    const handleDelete = (id) => {
        setDeleteId(id);
    };
    const confirmDelete = () => {
        if (!deleteId)
            return;
        const newTodos = editTodos.filter((todo) => todo.id !== deleteId);
        setEditTodos(newTodos);
        onChange?.(newTodos);
        setDeleteId(null);
    };
    const cancelDelete = () => setDeleteId(null);
    // Add
    const handleAdd = () => {
        if (!newContent.trim())
            return;
        const newTodo = {
            id: genId(),
            content: newContent.trim(),
            status: "",
        };
        const newTodos = [...editTodos, newTodo];
        setEditTodos(newTodos);
        onChange?.(newTodos);
        setNewContent("");
        setAdding(false);
    };
    // Add on Enter
    const handleNewInputKeyDown = (e) => {
        if (e.key === "Enter") {
            handleAdd();
        }
        else if (e.key === "Escape") {
            setAdding(false);
            setNewContent("");
        }
    };
    if (userEdited) {
        return (_jsxs(ToolUseBlock, { children: [_jsx(ToolUseBlockHeader, { children: _jsxs("div", { className: "flex items-center w-full", style: { width: "100%" }, children: [_jsx("span", { className: "codicon codicon-feedback mr-1.5", style: { color: "var(--vscode-charts-yellow)" } }), _jsx("span", { className: "font-bold mr-2", style: { fontWeight: "bold" }, children: "User Edit" }), _jsx("div", { className: "flex-grow" })] }) }), _jsx("div", { className: "overflow-x-auto max-w-full", style: { padding: "12px 0 8px 0" }, children: _jsx("span", { className: "text-vscode-descriptionForeground", children: "User Edits" }) })] }));
    }
    return (_jsx(_Fragment, { children: _jsxs(ToolUseBlock, { children: [_jsx(ToolUseBlockHeader, { children: _jsxs("div", { className: "flex items-center w-full", style: { width: "100%" }, children: [_jsx("span", { className: "codicon codicon-checklist mr-1.5", style: { color: "var(--vscode-foreground)" } }), _jsx("span", { className: "font-bold mr-2", style: { fontWeight: "bold" }, children: "Todo List Updated" }), _jsx("div", { className: "flex-grow" }), editable && (_jsx("button", { onClick: () => setIsEditing(!isEditing), style: {
                                    border: isEditing
                                        ? "1px solid var(--vscode-button-border)"
                                        : "1px solid var(--vscode-button-secondaryBorder)",
                                    background: isEditing
                                        ? "var(--vscode-button-background)"
                                        : "var(--vscode-button-secondaryBackground)",
                                    color: isEditing
                                        ? "var(--vscode-button-foreground)"
                                        : "var(--vscode-button-secondaryForeground)",
                                    borderRadius: 4,
                                    padding: "2px 8px",
                                    cursor: "pointer",
                                    fontSize: 13,
                                    marginLeft: 8,
                                }, children: isEditing ? "Done" : "Edit" }))] }) }), _jsx("div", { className: "overflow-x-auto max-w-full", style: { padding: "6px 0 2px 0" }, children: Array.isArray(editTodos) && editTodos.length > 0 ? (_jsxs("ul", { style: { margin: 0, paddingLeft: 0, listStyle: "none" }, children: [editTodos.map((todo, idx) => {
                                let icon;
                                if (todo.status === "completed") {
                                    icon = (_jsx("span", { style: {
                                            display: "inline-block",
                                            width: 8,
                                            height: 8,
                                            borderRadius: "50%",
                                            background: "var(--vscode-charts-green)",
                                            marginRight: 6,
                                            marginTop: 7,
                                            flexShrink: 0,
                                        } }));
                                }
                                else if (todo.status === "in_progress") {
                                    icon = (_jsx("span", { style: {
                                            display: "inline-block",
                                            width: 8,
                                            height: 8,
                                            borderRadius: "50%",
                                            background: "var(--vscode-charts-yellow)",
                                            marginRight: 6,
                                            marginTop: 7,
                                            flexShrink: 0,
                                        } }));
                                }
                                else {
                                    icon = (_jsx("span", { style: {
                                            display: "inline-block",
                                            width: 8,
                                            height: 8,
                                            borderRadius: "50%",
                                            border: "1px solid var(--vscode-descriptionForeground)",
                                            background: "transparent",
                                            marginRight: 6,
                                            marginTop: 7,
                                            flexShrink: 0,
                                        } }));
                                }
                                return (_jsxs("li", { style: {
                                        marginBottom: 2,
                                        display: "flex",
                                        alignItems: "flex-start",
                                        minHeight: 20,
                                    }, children: [icon, isEditing ? (_jsx("input", { type: "text", value: todo.content, placeholder: "Enter todo item", onChange: (e) => handleContentChange(todo.id, e.target.value), style: {
                                                flex: 1,
                                                minWidth: 0,
                                                fontWeight: 500,
                                                color: "var(--vscode-input-foreground)",
                                                background: "var(--vscode-input-background)",
                                                border: "none",
                                                outline: "none",
                                                fontSize: 13,
                                                marginRight: 6,
                                                padding: "1px 3px",
                                                borderBottom: "1px solid var(--vscode-input-border)",
                                            }, onBlur: (e) => {
                                                if (!e.target.value.trim()) {
                                                    handleDelete(todo.id);
                                                }
                                            } })) : (_jsx("span", { style: {
                                                flex: 1,
                                                minWidth: 0,
                                                fontWeight: 500,
                                                color: todo.status === "completed"
                                                    ? "var(--vscode-charts-green)"
                                                    : todo.status === "in_progress"
                                                        ? "var(--vscode-charts-yellow)"
                                                        : "var(--vscode-foreground)",
                                                fontSize: 13,
                                                marginRight: 6,
                                                padding: "1px 3px",
                                                lineHeight: "1.4",
                                            }, children: todo.content })), isEditing && (_jsx("select", { value: todo.status || "", onChange: (e) => handleStatusChange(todo.id, e.target.value), style: {
                                                marginRight: 6,
                                                borderRadius: 4,
                                                border: "1px solid var(--vscode-input-border)",
                                                background: "var(--vscode-input-background)",
                                                color: "var(--vscode-input-foreground)",
                                                fontSize: 12,
                                                padding: "1px 4px",
                                            }, children: STATUS_OPTIONS.map((opt) => (_jsx("option", { value: opt.value, children: opt.label }, opt.value))) })), isEditing && (_jsx("button", { onClick: () => handleDelete(todo.id), style: {
                                                border: "none",
                                                background: "transparent",
                                                color: "#f14c4c",
                                                cursor: "pointer",
                                                fontSize: 14,
                                                marginLeft: 2,
                                                padding: 0,
                                                lineHeight: 1,
                                            }, title: "Remove", children: "\u00D7" }))] }, todo.id || idx));
                            }), adding ? (_jsxs("li", { style: { marginTop: 2, display: "flex", alignItems: "center" }, children: [_jsx("span", { style: { width: 14, marginRight: 6 } }), _jsx("input", { ref: newInputRef, type: "text", value: newContent, placeholder: "Enter todo item, press Enter to add", onChange: (e) => setNewContent(e.target.value), onKeyDown: handleNewInputKeyDown, style: {
                                            flex: 1,
                                            minWidth: 0,
                                            fontWeight: 500,
                                            color: "var(--vscode-foreground)",
                                            background: "transparent",
                                            border: "none",
                                            outline: "none",
                                            fontSize: 13,
                                            marginRight: 6,
                                            padding: "1px 3px",
                                            borderBottom: "1px solid #eee",
                                        } }), _jsx("button", { onClick: handleAdd, disabled: !newContent.trim(), style: {
                                            border: "1px solid var(--vscode-button-border)",
                                            background: "var(--vscode-button-background)",
                                            color: "var(--vscode-button-foreground)",
                                            borderRadius: 4,
                                            padding: "1px 7px",
                                            cursor: newContent.trim() ? "pointer" : "not-allowed",
                                            fontSize: 12,
                                            marginRight: 4,
                                        }, children: "Add" }), _jsx("button", { onClick: () => {
                                            setAdding(false);
                                            setNewContent("");
                                        }, style: {
                                            border: "1px solid var(--vscode-button-secondaryBorder)",
                                            background: "var(--vscode-button-secondaryBackground)",
                                            color: "var(--vscode-button-secondaryForeground)",
                                            borderRadius: 4,
                                            padding: "1px 7px",
                                            cursor: "pointer",
                                            fontSize: 12,
                                        }, children: "Cancel" })] })) : (_jsx("li", { style: { marginTop: 2 }, children: isEditing && (_jsx("button", { onClick: () => setAdding(true), style: {
                                        border: "1px dashed var(--vscode-button-secondaryBorder)",
                                        background: "var(--vscode-button-secondaryBackground)",
                                        color: "var(--vscode-button-secondaryForeground)",
                                        borderRadius: 4,
                                        padding: "1px 8px",
                                        cursor: "pointer",
                                        fontSize: 12,
                                    }, children: "+ Add Todo" })) }))] })) : (_jsx(MarkdownBlock, { markdown: content })) }), deleteId && (_jsx("div", { style: {
                        position: "fixed",
                        left: 0,
                        top: 0,
                        right: 0,
                        bottom: 0,
                        background: "rgba(0,0,0,0.15)",
                        zIndex: 9999,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }, onClick: cancelDelete, children: _jsxs("div", { style: {
                            background: "#fff",
                            borderRadius: 8,
                            boxShadow: "0 2px 16px rgba(0,0,0,0.15)",
                            padding: "16px 20px",
                            minWidth: 200,
                            zIndex: 10000,
                        }, onClick: (e) => e.stopPropagation(), children: [_jsx("div", { style: { marginBottom: 12, fontSize: 14, color: "#333" }, children: "Are you sure you want to delete this todo item?" }), _jsxs("div", { style: { display: "flex", justifyContent: "flex-end", gap: 8 }, children: [_jsx("button", { onClick: cancelDelete, style: {
                                            border: "1px solid #bbb",
                                            background: "transparent",
                                            color: "#888",
                                            borderRadius: 4,
                                            padding: "2px 10px",
                                            cursor: "pointer",
                                            fontSize: 12,
                                        }, children: "Cancel" }), _jsx("button", { onClick: confirmDelete, style: {
                                            border: "1px solid #f14c4c",
                                            background: "#f14c4c",
                                            color: "#fff",
                                            borderRadius: 4,
                                            padding: "2px 10px",
                                            cursor: "pointer",
                                            fontSize: 12,
                                        }, children: "Delete" })] })] }) }))] }) }));
};
export default UpdateTodoListToolBlock;
//# sourceMappingURL=UpdateTodoListToolBlock.js.map