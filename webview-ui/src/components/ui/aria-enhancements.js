import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { createContext, useContext, useRef, useEffect, useState } from "react";
const AriaContext = createContext(null);
export const AriaEnhancementProvider = ({ children, enableLiveRegions = true, enableFocusManagement = true, enableLandmarks = true, }) => {
    const [currentFocus, setCurrentFocus] = useState(null);
    const [announcements, setAnnouncements] = useState([]);
    const landmarksRef = useRef(new Map());
    const descriptionsRef = useRef(new Map());
    // Announce messages to screen readers
    const announce = (message, priority = "polite") => {
        if (!enableLiveRegions)
            return;
        const id = `announcement-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        setAnnouncements((prev) => [...prev, { id, message, priority }]);
        // Remove announcement after it's been read
        setTimeout(() => {
            setAnnouncements((prev) => prev.filter((a) => a.id !== id));
        }, 1000);
    };
    // Set focus with announcement
    const setFocus = (element) => {
        if (!enableFocusManagement)
            return;
        if (element) {
            element.focus();
            setCurrentFocus(element);
            // Announce focus change
            const label = getElementLabel(element);
            if (label) {
                announce(`Focused on ${label}`);
            }
        }
        else {
            setCurrentFocus(null);
        }
    };
    // Register landmark
    const registerLandmark = (element, label) => {
        if (!enableLandmarks)
            return () => { };
        landmarksRef.current.set(element, label);
        element.setAttribute("aria-label", label);
        return () => {
            landmarksRef.current.delete(element);
            element.removeAttribute("aria-label");
        };
    };
    // Register description
    const registerDescription = (element, description) => {
        const id = `desc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        descriptionsRef.current.set(element, description);
        // Create hidden description element
        const descElement = document.createElement("div");
        descElement.id = id;
        descElement.setAttribute("aria-hidden", "true");
        descElement.textContent = description;
        descElement.style.display = "none";
        document.body.appendChild(descElement);
        element.setAttribute("aria-describedby", id);
        return () => {
            descriptionsRef.current.delete(element);
            element.removeAttribute("aria-describedby");
            document.body.removeChild(descElement);
        };
    };
    // Get element label for announcements
    const getElementLabel = (element) => {
        // Try various label sources
        if (element.getAttribute("aria-label")) {
            return element.getAttribute("aria-label");
        }
        if (element.getAttribute("aria-labelledby")) {
            const labelId = element.getAttribute("aria-labelledby");
            const labelElement = document.getElementById(labelId);
            if (labelElement) {
                return labelElement.textContent || "";
            }
        }
        if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
            const input = element;
            if (input.placeholder)
                return input.placeholder;
            if (input.title)
                return input.title;
        }
        if (element.tagName === "BUTTON") {
            return element.textContent || "";
        }
        if (element.textContent) {
            return element.textContent.trim();
        }
        return "";
    };
    const contextValue = {
        announce,
        setFocus,
        getFocus: () => currentFocus,
        registerLandmark,
        registerDescription,
    };
    return (_jsxs(AriaContext.Provider, { value: contextValue, children: [children, enableLiveRegions && (_jsxs(_Fragment, { children: [_jsx("div", { "aria-live": "polite", "aria-atomic": "true", className: "sr-only", "aria-relevant": "additions text", children: announcements
                            .filter((a) => a.priority === "polite")
                            .map((a) => (_jsx("div", { children: a.message }, a.id))) }), _jsx("div", { "aria-live": "assertive", "aria-atomic": "true", className: "sr-only", "aria-relevant": "additions text", children: announcements
                            .filter((a) => a.priority === "assertive")
                            .map((a) => (_jsx("div", { children: a.message }, a.id))) })] }))] }));
};
/**
 * Hook to use ARIA enhancements
 */
export const useAria = () => {
    const context = useContext(AriaContext);
    if (!context) {
        throw new Error("useAria must be used within AriaEnhancementProvider");
    }
    return context;
};
export const AriaButton = ({ ariaLabel, ariaDescription, ariaPressed, ariaExpanded, ariaControls, onActivate, announceActivation = true, children, onClick, ...props }) => {
    const { announce, registerDescription } = useAria();
    const buttonRef = useRef(null);
    useEffect(() => {
        if (buttonRef.current && ariaDescription) {
            return registerDescription(buttonRef.current, ariaDescription);
        }
    }, [ariaDescription, registerDescription]);
    const handleClick = (event) => {
        onClick?.(event);
        onActivate?.();
        if (announceActivation && ariaLabel) {
            announce(`${ariaLabel} activated`);
        }
    };
    return (_jsx("button", { ref: buttonRef, "aria-label": ariaLabel, "aria-pressed": ariaPressed, "aria-expanded": ariaExpanded, "aria-controls": ariaControls, onClick: handleClick, ...props, children: children }));
};
export const AriaInput = ({ ariaLabel, ariaDescription, ariaInvalid, ariaErrorMessage, announceChanges = true, onValueChange, onChange, ...props }) => {
    const { announce, registerDescription } = useAria();
    const inputRef = useRef(null);
    const [hasError, setHasError] = useState(false);
    useEffect(() => {
        if (inputRef.current && ariaDescription) {
            return registerDescription(inputRef.current, ariaDescription);
        }
    }, [ariaDescription, registerDescription]);
    const handleChange = (event) => {
        onChange?.(event);
        onValueChange?.(event.target.value);
        if (announceChanges && ariaLabel) {
            announce(`${ariaLabel} value changed to ${event.target.value}`);
        }
    };
    // Update error state
    useEffect(() => {
        setHasError(!!ariaInvalid);
        if (ariaInvalid && ariaErrorMessage) {
            announce(`Error in ${ariaLabel}: ${ariaErrorMessage}`, "assertive");
        }
    }, [ariaInvalid, ariaErrorMessage, ariaLabel, announce]);
    return (_jsx("input", { ref: inputRef, "aria-label": ariaLabel, "aria-invalid": ariaInvalid, "aria-describedby": ariaErrorMessage ? `error-${props.id || "input"}` : undefined, onChange: handleChange, className: `
				${props.className || ""}
				${hasError ? "border-red-500 focus:border-red-500" : ""}
			`, ...props }));
};
export const AriaProgress = ({ value, max = 100, ariaLabel = "Progress", ariaDescription, showValue = true, announceChanges = true, }) => {
    const { announce, registerDescription } = useAria();
    const progressRef = useRef(null);
    const [previousValue, setPreviousValue] = useState(value);
    useEffect(() => {
        if (progressRef.current && ariaDescription) {
            return registerDescription(progressRef.current, ariaDescription);
        }
    }, [ariaDescription, registerDescription]);
    useEffect(() => {
        if (announceChanges && value !== previousValue) {
            const percentage = Math.round((value / max) * 100);
            announce(`${ariaLabel}: ${percentage}% complete`);
            setPreviousValue(value);
        }
    }, [value, previousValue, max, ariaLabel, announceChanges, announce]);
    const percentage = Math.round((value / max) * 100);
    return (_jsxs("div", { ref: progressRef, role: "progressbar", "aria-valuenow": value, "aria-valuemin": 0, "aria-valuemax": max, "aria-label": ariaLabel, className: "relative", children: [_jsx("div", { className: "w-full bg-gray-200 rounded-full h-4 overflow-hidden", children: _jsx("div", { className: "bg-blue-500 h-full rounded-full transition-all duration-300 ease-out", style: { width: `${percentage}%` } }) }), showValue && (_jsxs("div", { className: "absolute inset-0 flex items-center justify-center text-sm font-medium text-white", children: [percentage, "%"] }))] }));
};
export const AriaLandmark = ({ landmarkType, label, children, className = "" }) => {
    const { registerLandmark } = useAria();
    const landmarkRef = useRef(null);
    useEffect(() => {
        if (landmarkRef.current) {
            return registerLandmark(landmarkRef.current, label);
        }
    }, [label, registerLandmark]);
    const getRole = () => {
        switch (landmarkType) {
            case "banner":
                return "banner";
            case "navigation":
                return "navigation";
            case "main":
                return "main";
            case "complementary":
                return "complementary";
            case "contentinfo":
                return "contentinfo";
            case "search":
                return "search";
            case "form":
                return "form";
            default:
                return "region";
        }
    };
    const Tag = landmarkType === "form" ? "form" : "section";
    return (_jsx(Tag, { ref: landmarkRef, role: getRole(), "aria-label": label, className: className, children: children }));
};
export const AriaList = ({ ariaLabel = "List", ariaDescription, items, onSelect, multiSelect = false, className = "", }) => {
    const { announce, registerDescription } = useAria();
    const listRef = useRef(null);
    const [selectedItems, setSelectedItems] = useState(new Set());
    useEffect(() => {
        if (listRef.current && ariaDescription) {
            return registerDescription(listRef.current, ariaDescription);
        }
    }, [ariaDescription, registerDescription]);
    const handleItemClick = (itemId, itemLabel) => {
        if (items.find((item) => item.id === itemId)?.disabled)
            return;
        let newSelected;
        if (multiSelect) {
            newSelected = new Set(selectedItems);
            if (newSelected.has(itemId)) {
                newSelected.delete(itemId);
                announce(`Deselected ${itemLabel}`);
            }
            else {
                newSelected.add(itemId);
                announce(`Selected ${itemLabel}`);
            }
        }
        else {
            newSelected = new Set([itemId]);
            announce(`Selected ${itemLabel}`);
        }
        setSelectedItems(newSelected);
        onSelect?.(itemId);
    };
    return (_jsx("ul", { ref: listRef, role: "listbox", "aria-label": ariaLabel, "aria-multiselectable": multiSelect, "aria-orientation": "vertical", className: className, children: items.map((item, index) => (_jsxs("li", { role: "option", "aria-selected": selectedItems.has(item.id), "aria-disabled": item.disabled, "aria-setsize": items.length, "aria-posinset": index + 1, className: `
						p-2 border rounded cursor-pointer
						${selectedItems.has(item.id) ? "bg-blue-100 border-blue-500" : "border-gray-300"}
						${item.disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"}
					`, onClick: () => handleItemClick(item.id, item.label), children: [_jsx("div", { className: "font-medium", children: item.label }), item.description && _jsx("div", { className: "text-sm text-gray-600", children: item.description })] }, item.id))) }));
};
/**
 * Screen reader only utility
 */
export const ScreenReaderOnly = ({ children }) => (_jsx("div", { className: "sr-only", "aria-hidden": "false", children: children }));
/**
 * Skip to main content link
 */
export const SkipToMain = ({ mainId, label = "Skip to main content", }) => (_jsx("a", { href: `#${mainId}`, className: "sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-blue-600 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-300", children: label }));
export default AriaEnhancementProvider;
//# sourceMappingURL=aria-enhancements.js.map