import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";
export const STANDARD_TOOLTIP_DELAY = 300;
/**
 * StandardTooltip component that enforces consistent 300ms delay across the application.
 * This component wraps the Radix UI tooltip with a standardized delay duration.
 *
 * @example
 * // Basic usage
 * <StandardTooltip content="Delete item">
 *   <Button>Delete</Button>
 * </StandardTooltip>
 *
 * // With custom positioning
 * <StandardTooltip content="Long tooltip text" side="right" sideOffset={8}>
 *   <IconButton icon="info" />
 * </StandardTooltip>
 *
 * @note This replaces native HTML title attributes for consistent timing.
 * @note Requires a TooltipProvider to be present in the component tree (typically at the app root).
 * @note Do not nest StandardTooltip components as this can cause UI issues.
 */
export function StandardTooltip({ children, content, side = "top", align = "center", sideOffset = 4, className, asChild = true, maxWidth, }) {
    // Don't render tooltip if content is empty or only whitespace.
    if (!content || (typeof content === "string" && !content.trim())) {
        return _jsx(_Fragment, { children: children });
    }
    const style = maxWidth ? { maxWidth: typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth } : undefined;
    return (_jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: asChild, children: children }), _jsx(TooltipContent, { side: side, align: align, sideOffset: sideOffset, className: className, style: style, children: content })] }));
}
//# sourceMappingURL=standard-tooltip.js.map