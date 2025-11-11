import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useCallback } from "react";
import { useCopyToClipboard } from "@src/utils/clipboard";
import { useAppTranslation } from "@src/i18n/TranslationContext";
import { vscode } from "@src/utils/vscode";
import { MermaidActionButtons } from "./MermaidActionButtons";
import { Modal } from "./Modal";
import { TabButton } from "./TabButton";
import { IconButton } from "./IconButton";
import { ZoomControls } from "./ZoomControls";
import { StandardTooltip } from "@/components/ui";
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 20;
export function MermaidButton({ containerRef, code, isLoading, svgToPng, children }) {
    const [showModal, setShowModal] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [copyFeedback, setCopyFeedback] = useState(false);
    const [isHovering, setIsHovering] = useState(false);
    const [modalViewMode, setModalViewMode] = useState("diagram");
    const [isDragging, setIsDragging] = useState(false);
    const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
    const { copyWithFeedback } = useCopyToClipboard();
    const { t } = useAppTranslation();
    /**
     * Opens a modal with the diagram for zooming
     */
    const handleZoom = async (e) => {
        e.stopPropagation();
        setShowModal(true);
        setZoomLevel(1);
        setModalViewMode("diagram");
    };
    /**
     * Copies the diagram text to clipboard
     */
    const handleCopy = async (e) => {
        e.stopPropagation();
        try {
            await copyWithFeedback(code, e);
            // Show feedback
            setCopyFeedback(true);
            setTimeout(() => setCopyFeedback(false), 2000);
        }
        catch (err) {
            console.error("Error copying text:", err instanceof Error ? err.message : String(err));
        }
    };
    /**
     * Saves the diagram as an image file
     */
    const handleSave = async (e) => {
        e.stopPropagation();
        // Get the SVG element from the container
        const svgEl = containerRef.current?.querySelector("svg");
        if (!svgEl) {
            console.error("SVG element not found");
            return;
        }
        try {
            // Convert SVG to PNG
            const pngDataUrl = await svgToPng(svgEl);
            // Send message to VSCode to save the image
            vscode.postMessage({
                type: "saveImage",
                dataUri: pngDataUrl,
            });
        }
        catch (error) {
            console.error("Error saving image:", error);
        }
    };
    /**
     * Adjust zoom level in the modal
     */
    const adjustZoom = (amount) => {
        setZoomLevel((prev) => {
            const newZoom = prev + amount;
            return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));
        });
    };
    /**
     * Handle wheel event for zooming with scroll wheel
     */
    const handleWheel = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        // Determine zoom direction and amount
        // Negative deltaY means scrolling up (zoom in), positive means scrolling down (zoom out)
        const delta = e.deltaY > 0 ? -0.2 : 0.2;
        adjustZoom(delta);
    }, []);
    /**
     * Handle mouse enter event for diagram container
     */
    const handleMouseEnter = () => {
        setIsHovering(true);
    };
    /**
     * Handle mouse leave event for diagram container
     */
    const handleMouseLeave = () => {
        setIsHovering(false);
    };
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "relative w-full", onMouseEnter: handleMouseEnter, onMouseLeave: handleMouseLeave, children: [children, !isLoading && isHovering && (_jsx("div", { className: "absolute bottom-2 right-2 flex gap-1 bg-vscode-editor-background/90 rounded p-0.5 z-10 opacity-100 transition-opacity duration-200 ease-in-out", children: _jsx(MermaidActionButtons, { onZoom: handleZoom, onCopy: handleCopy, onSave: handleSave, onViewCode: () => {
                                setShowModal(true);
                                setModalViewMode("code");
                                setZoomLevel(1);
                            }, copyFeedback: copyFeedback }) }))] }), _jsxs(Modal, { isOpen: showModal, onClose: () => setShowModal(false), children: [_jsxs("div", { className: "flex justify-between items-center border-b border-vscode-editorGroup-border", children: [_jsxs("div", { className: "flex gap-0", children: [_jsx(TabButton, { icon: "graph", label: t("common:mermaid.tabs.diagram"), isActive: modalViewMode === "diagram", onClick: () => setModalViewMode("diagram") }), _jsx(TabButton, { icon: "code", label: t("common:mermaid.tabs.code"), isActive: modalViewMode === "code", onClick: () => setModalViewMode("code") })] }), _jsx("div", { className: "pr-3", children: _jsx(StandardTooltip, { content: t("common:mermaid.buttons.close"), children: _jsx(IconButton, { icon: "close", onClick: () => setShowModal(false) }) }) })] }), _jsx("div", { className: "flex-1 p-4 pb-[60px] overflow-auto flex items-center justify-center", onWheel: modalViewMode === "diagram" ? handleWheel : undefined, children: modalViewMode === "diagram" ? (_jsxs(_Fragment, { children: [_jsx("div", { style: {
                                        transform: `scale(${zoomLevel}) translate(${dragPosition.x}px, ${dragPosition.y}px)`,
                                        transformOrigin: "center center",
                                        transition: isDragging ? "none" : "transform 0.1s ease",
                                        cursor: isDragging ? "grabbing" : "grab",
                                    }, onMouseDown: (e) => {
                                        setIsDragging(true);
                                        e.preventDefault();
                                    }, onMouseMove: (e) => {
                                        if (isDragging) {
                                            setDragPosition((prev) => ({
                                                x: prev.x + e.movementX / zoomLevel,
                                                y: prev.y + e.movementY / zoomLevel,
                                            }));
                                        }
                                    }, onMouseUp: () => setIsDragging(false), onMouseLeave: () => setIsDragging(false), children: containerRef.current && containerRef.current.innerHTML && (_jsx("div", { dangerouslySetInnerHTML: { __html: containerRef.current.innerHTML } })) }), _jsxs("div", { className: "absolute bottom-4 left-4 bg-vscode-editor-background border border-vscode-editorGroup-border rounded px-2 py-1 text-xs text-vscode-descriptionForeground pointer-events-none opacity-80", children: [Math.round(zoomLevel * 100), "%"] })] })) : (_jsx("textarea", { className: "w-full min-h-[200px] bg-vscode-editor-background text-vscode-editor-foreground border border-vscode-editorGroup-border rounded-[3px] p-2 font-mono resize-y outline-none", readOnly: true, value: code, style: { height: "100%", minHeight: "unset", fontSize: "var(--vscode-editor-font-size)" } })) }), _jsx("div", { className: "absolute bottom-0 right-0 left-0 p-3 flex items-center justify-end gap-2 bg-vscode-editor-background border-t border-vscode-editorGroup-border rounded-b", children: modalViewMode === "diagram" ? (_jsxs(_Fragment, { children: [_jsx(ZoomControls, { zoomLevel: zoomLevel, zoomInTitle: t("common:mermaid.buttons.zoomIn"), zoomOutTitle: t("common:mermaid.buttons.zoomOut"), useContinuousZoom: true, adjustZoom: adjustZoom, zoomInStep: 0.2, zoomOutStep: -0.2 }), _jsx(StandardTooltip, { content: t("common:mermaid.buttons.copy"), children: _jsx(IconButton, { icon: copyFeedback ? "check" : "copy", onClick: handleCopy }) }), _jsx(StandardTooltip, { content: t("common:mermaid.buttons.save"), children: _jsx(IconButton, { icon: "save", onClick: handleSave }) })] })) : (_jsx(StandardTooltip, { content: t("common:mermaid.buttons.copy"), children: _jsx(IconButton, { icon: copyFeedback ? "check" : "copy", onClick: (e) => {
                                    e.stopPropagation();
                                    copyWithFeedback(code, e);
                                } }) })) })] })] }));
}
//# sourceMappingURL=MermaidButton.js.map