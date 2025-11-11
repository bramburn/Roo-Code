import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime"
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
function AlertDialog({ ...props }) {
	return _jsx(AlertDialogPrimitive.Root, { "data-slot": "alert-dialog", ...props })
}
function AlertDialogTrigger({ ...props }) {
	return _jsx(AlertDialogPrimitive.Trigger, { "data-slot": "alert-dialog-trigger", ...props })
}
function AlertDialogPortal({ ...props }) {
	return _jsx(AlertDialogPrimitive.Portal, { "data-slot": "alert-dialog-portal", ...props })
}
function AlertDialogOverlay({ className, ...props }) {
	return _jsx(AlertDialogPrimitive.Overlay, {
		"data-slot": "alert-dialog-overlay",
		className: cn(
			"data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
			className,
		),
		...props,
	})
}
function AlertDialogContent({ className, ...props }) {
	return _jsxs(AlertDialogPortal, {
		children: [
			_jsx(AlertDialogOverlay, {}),
			_jsx(AlertDialogPrimitive.Content, {
				"data-slot": "alert-dialog-content",
				className: cn(
					"bg-vscode-editor-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-3 rounded-sm border border-vscode-panel-border p-4 shadow-lg duration-200 sm:max-w-md",
					className,
				),
				...props,
			}),
		],
	})
}
function AlertDialogHeader({ className, ...props }) {
	return _jsx("div", {
		"data-slot": "alert-dialog-header",
		className: cn("flex flex-col gap-1 text-left", className),
		...props,
	})
}
function AlertDialogFooter({ className, ...props }) {
	return _jsx("div", {
		"data-slot": "alert-dialog-footer",
		className: cn("flex flex-row justify-end gap-2 mt-4", className),
		...props,
	})
}
function AlertDialogTitle({ className, ...props }) {
	return _jsx(AlertDialogPrimitive.Title, {
		"data-slot": "alert-dialog-title",
		className: cn(
			"text-base font-medium text-vscode-editor-foreground flex items-center gap-2 text-left",
			className,
		),
		...props,
	})
}
function AlertDialogDescription({ className, ...props }) {
	return _jsx(AlertDialogPrimitive.Description, {
		"data-slot": "alert-dialog-description",
		className: cn("text-vscode-descriptionForeground text-sm text-left", className),
		...props,
	})
}
function AlertDialogAction({ className, ...props }) {
	return _jsx(AlertDialogPrimitive.Action, {
		className: cn(
			buttonVariants(),
			"bg-vscode-button-background text-vscode-button-foreground hover:bg-vscode-button-hoverBackground h-6 px-3 py-1 border",
			className,
		),
		...props,
	})
}
function AlertDialogCancel({ className, ...props }) {
	return _jsx(AlertDialogPrimitive.Cancel, {
		className: cn(
			buttonVariants({ variant: "outline" }),
			"bg-vscode-button-secondaryBackground text-vscode-button-secondaryForeground hover:bg-vscode-button-secondaryHoverBackground h-6 px-3 py-1 border",
			className,
		),
		...props,
	})
}
export {
	AlertDialog,
	AlertDialogPortal,
	AlertDialogOverlay,
	AlertDialogTrigger,
	AlertDialogContent,
	AlertDialogHeader,
	AlertDialogFooter,
	AlertDialogTitle,
	AlertDialogDescription,
	AlertDialogAction,
	AlertDialogCancel,
}
//# sourceMappingURL=alert-dialog.js.map
