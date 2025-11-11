import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime"
import * as React from "react"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { CheckIcon, DotFilledIcon } from "@radix-ui/react-icons"
import { cn } from "@/lib/utils"
const DropdownMenu = DropdownMenuPrimitive.Root
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger
const DropdownMenuGroup = DropdownMenuPrimitive.Group
const DropdownMenuPortal = DropdownMenuPrimitive.Portal
const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup
const DropdownMenuContent = React.forwardRef(({ className, sideOffset = 4, container, ...props }, ref) =>
	_jsx(DropdownMenuPrimitive.Portal, {
		container: container,
		children: _jsx(DropdownMenuPrimitive.Content, {
			ref: ref,
			sideOffset: sideOffset,
			className: cn(
				"z-50 min-w-[8rem] overflow-hidden rounded-xs p-1 shadow-xs",
				"data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
				"border border-vscode-focusBorder",
				"bg-vscode-dropdown-background bg-opacity-100",
				"text-vscode-dropdown-foreground",
				className,
			),
			...props,
		}),
	}),
)
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName
const DropdownMenuItem = React.forwardRef(({ className, inset, ...props }, ref) =>
	_jsx(DropdownMenuPrimitive.Item, {
		ref: ref,
		className: cn(
			"relative flex select-none items-center gap-2 px-2 py-1.5 outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&>svg]:size-4 [&>svg]:shrink-0",
			"focus:bg-vscode-list-activeSelectionBackground focus:text-vscode-list-activeSelectionForeground",
			"text-vscode-dropdown-foreground text-sm",
			"rounded-xs active:opacity-90 cursor-pointer",
			inset && "pl-8",
			className,
		),
		...props,
	}),
)
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName
const DropdownMenuCheckboxItem = React.forwardRef(({ className, children, checked, ...props }, ref) =>
	_jsxs(DropdownMenuPrimitive.CheckboxItem, {
		ref: ref,
		className: cn(
			"relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
			"focus:bg-vscode-list-activeSelectionBackground focus:text-vscode-list-activeSelectionForeground",
			className,
		),
		checked: checked,
		...props,
		children: [
			_jsx("span", {
				className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center",
				children: _jsx(DropdownMenuPrimitive.ItemIndicator, {
					children: _jsx(CheckIcon, { className: "h-4 w-4" }),
				}),
			}),
			children,
		],
	}),
)
DropdownMenuCheckboxItem.displayName = DropdownMenuPrimitive.CheckboxItem.displayName
const DropdownMenuRadioItem = React.forwardRef(({ className, children, ...props }, ref) =>
	_jsxs(DropdownMenuPrimitive.RadioItem, {
		ref: ref,
		className: cn(
			"relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-vscode-list-activeSelectionBackground focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
			className,
		),
		...props,
		children: [
			_jsx("span", {
				className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center",
				children: _jsx(DropdownMenuPrimitive.ItemIndicator, {
					children: _jsx(DotFilledIcon, { className: "h-2 w-2 fill-current" }),
				}),
			}),
			children,
		],
	}),
)
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName
const DropdownMenuLabel = React.forwardRef(({ className, inset, ...props }, ref) =>
	_jsx(DropdownMenuPrimitive.Label, {
		ref: ref,
		className: cn("px-2 py-1.5 text-sm font-semibold", inset && "pl-8", className),
		...props,
	}),
)
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName
const DropdownMenuSeparator = React.forwardRef(({ className, ...props }, ref) =>
	_jsx(DropdownMenuPrimitive.Separator, {
		ref: ref,
		className: cn("-mx-1 my-1 h-px bg-vscode-dropdown-foreground/10", className),
		...props,
	}),
)
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName
const DropdownMenuShortcut = ({ className, ...props }) => {
	return _jsx("span", { className: cn("ml-auto text-xs tracking-widest opacity-60", className), ...props })
}
DropdownMenuShortcut.displayName = "DropdownMenuShortcut"
export {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuCheckboxItem,
	DropdownMenuRadioItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuGroup,
	DropdownMenuPortal,
	DropdownMenuRadioGroup,
}
//# sourceMappingURL=dropdown-menu.js.map
