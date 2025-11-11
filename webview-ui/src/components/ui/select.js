import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"
function Select({ ...props }) {
	return _jsx(SelectPrimitive.Root, { "data-slot": "select", ...props })
}
function SelectGroup({ ...props }) {
	return _jsx(SelectPrimitive.Group, { "data-slot": "select-group", ...props })
}
function SelectValue({ ...props }) {
	return _jsx(SelectPrimitive.Value, { "data-slot": "select-value", ...props })
}
function SelectTrigger({ className, children, ...props }) {
	return _jsxs(SelectPrimitive.Trigger, {
		"data-slot": "select-trigger",
		className: cn(
			"data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground aria-invalid:border-destructive flex h-7 w-fit items-center justify-between gap-2 rounded-xs px-3 py-2 whitespace-nowrap transition-[color,box-shadow] outline-none disabled:cursor-not-allowed disabled:opacity-50 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 cursor-pointer",
			"border border-vscode-dropdown-border aria-expanded:border-vscode-focusBorder focus-visible:border-vscode-focusBorder",
			"bg-vscode-dropdown-background hover:bg-transparent",
			"text-vscode-dropdown-foreground",
			className,
		),
		...props,
		children: [
			children,
			_jsx(SelectPrimitive.Icon, {
				asChild: true,
				children: _jsx(ChevronDown, { className: "size-4 opacity-50" }),
			}),
		],
	})
}
function SelectContent({ className, children, position = "popper", container, ...props }) {
	return _jsx(SelectPrimitive.Portal, {
		container: container,
		children: _jsxs(SelectPrimitive.Content, {
			"data-slot": "select-content",
			className: cn(
				"data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 relative z-50 max-h-72 min-w-[8rem] overflow-hidden rounded-xs shadow-xs",
				"bg-popover",
				"border border-vscode-focusBorder",
				"text-popover-foreground",
				position === "popper" &&
					"data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
				className,
			),
			position: position,
			...props,
			children: [
				_jsx(SelectScrollUpButton, {}),
				_jsx(SelectPrimitive.Viewport, {
					className: cn(
						"p-1",
						position === "popper" &&
							"h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)] scroll-my-1",
					),
					children: children,
				}),
				_jsx(SelectScrollDownButton, {}),
			],
		}),
	})
}
function SelectLabel({ className, ...props }) {
	return _jsx(SelectPrimitive.Label, {
		"data-slot": "select-label",
		className: cn("px-2 py-1.5 text-sm font-medium", className),
		...props,
	})
}
function SelectItem({ className, children, ...props }) {
	return _jsxs(SelectPrimitive.Item, {
		"data-slot": "select-item",
		className: cn(
			"[&_svg:not([class*='text-'])]:text-muted-foreground relative flex w-full items-center gap-2 py-1.5 pr-8 pl-2 outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
			"focus:bg-vscode-list-activeSelectionBackground focus:text-vscode-list-activeSelectionForeground",
			"text-vscode-dropdown-foreground text-sm",
			"rounded-xs active:opacity-90 cursor-pointer",
			className,
		),
		...props,
		children: [
			_jsx("span", {
				className: "absolute right-2 flex size-3.5 items-center justify-center",
				children: _jsx(SelectPrimitive.ItemIndicator, { children: _jsx(Check, { className: "size-4 p-0.5" }) }),
			}),
			_jsx(SelectPrimitive.ItemText, { children: children }),
		],
	})
}
function SelectSeparator({ className, ...props }) {
	return _jsx(SelectPrimitive.Separator, {
		"data-slot": "select-separator",
		className: cn("bg-vscode-dropdown-foreground/10 pointer-events-none -mx-1 my-1 h-px", className),
		...props,
	})
}
function SelectScrollUpButton({ className, ...props }) {
	return _jsx(SelectPrimitive.ScrollUpButton, {
		"data-slot": "select-scroll-up-button",
		className: cn("flex cursor-default items-center justify-center py-1", className),
		...props,
		children: _jsx(ChevronUp, { className: "size-4" }),
	})
}
function SelectScrollDownButton({ className, ...props }) {
	return _jsx(SelectPrimitive.ScrollDownButton, {
		"data-slot": "select-scroll-down-button",
		className: cn("flex cursor-default items-center justify-center py-1", className),
		...props,
		children: _jsx(ChevronDown, { className: "size-4" }),
	})
}
export {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectScrollDownButton,
	SelectScrollUpButton,
	SelectSeparator,
	SelectTrigger,
	SelectValue,
}
//# sourceMappingURL=select.js.map
