import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime"
import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { cn } from "@/lib/utils"
const Slider = React.forwardRef(({ className, ...props }, ref) =>
	_jsxs(SliderPrimitive.Root, {
		ref: ref,
		className: cn("relative flex w-full touch-none select-none items-center", className),
		...props,
		children: [
			_jsx(SliderPrimitive.Track, {
				className: "relative w-full h-[8px] grow overflow-hidden bg-accent rounded-sm border",
				children: _jsx(SliderPrimitive.Range, { className: "absolute h-full bg-vscode-button-background" }),
			}),
			_jsx(SliderPrimitive.Thumb, {
				className:
					"block h-3 w-3 rounded-full border border-primary/50 bg-vscode-button-background transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
			}),
		],
	}),
)
Slider.displayName = SliderPrimitive.Root.displayName
export { Slider }
//# sourceMappingURL=slider.js.map
