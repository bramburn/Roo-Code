import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime"
import { cn } from "@/lib/utils"
import { VSCodeTextField } from "@vscode/webview-ui-toolkit/react"
import { forwardRef, useCallback, useRef } from "react"
function VSCodeTextFieldWithNodesInner(props, forwardedRef) {
	const { className, style, "data-testid": dataTestId, leftNodes, rightNodes, ...restProps } = props
	const inputRef = useRef(null)
	// Callback ref to get access to the underlying input element.
	// VSCodeTextField doesn't expose this directly so we have to query for it!
	const handleVSCodeFieldRef = useCallback(
		(element) => {
			if (!element) return
			const webComponent = element
			const inputElement =
				webComponent.shadowRoot?.querySelector?.("input") || webComponent.querySelector?.("input")
			if (inputElement && inputElement instanceof HTMLInputElement) {
				inputRef.current = inputElement
				if (typeof forwardedRef === "function") {
					forwardedRef?.(inputElement)
				} else if (forwardedRef) {
					forwardedRef.current = inputElement
				}
			}
		},
		[forwardedRef],
	)
	const focusInput = useCallback(async () => {
		if (inputRef.current && document.activeElement !== inputRef.current) {
			setTimeout(() => {
				inputRef.current?.focus()
			})
		}
	}, [])
	const hasLeftNodes = leftNodes && leftNodes.filter(Boolean).length > 0
	const hasRightNodes = rightNodes && rightNodes.filter(Boolean).length > 0
	return _jsxs("div", {
		className: cn(
			`group`,
			`relative flex items-center cursor-text`,
			`bg-[var(--input-background)] text-[var(--input-foreground)]`,
			`rounded-[calc(var(--corner-radius-round)*1px)]`,
			className,
		),
		style: style,
		onMouseDown: focusInput,
		children: [
			hasLeftNodes &&
				_jsx("div", {
					className: "absolute left-2 z-10 flex items-center gap-1 pointer-events-none",
					children: leftNodes,
				}),
			_jsx(VSCodeTextField, {
				"data-testid": dataTestId,
				ref: handleVSCodeFieldRef,
				style: {
					flex: 1,
					paddingLeft: hasLeftNodes ? "24px" : undefined,
					paddingRight: hasRightNodes ? "24px" : undefined,
				},
				className: "[--border-width:0]",
				...restProps,
			}),
			hasRightNodes &&
				_jsx("div", {
					className: "absolute right-2 z-10 flex items-center gap-1 pointer-events-none",
					children: rightNodes,
				}),
			_jsx("div", {
				className:
					"absolute top-0 left-0 size-full border border-vscode-input-border group-focus-within:border-[var(--focus-border)] rounded",
			}),
		],
	})
}
export const DecoratedVSCodeTextField = forwardRef(VSCodeTextFieldWithNodesInner)
//# sourceMappingURL=DecoratedVSCodeTextField.js.map
