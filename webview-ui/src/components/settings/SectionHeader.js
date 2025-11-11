import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime"
import { cn } from "@/lib/utils"
export const SectionHeader = ({ description, children, className, ...props }) => {
	return _jsxs("div", {
		className: cn(
			"sticky top-0 z-10 text-vscode-sideBar-foreground bg-vscode-sideBar-background brightness-90 px-5 py-4",
			className,
		),
		...props,
		children: [
			_jsx("h4", { className: "m-0", children: children }),
			description &&
				_jsx("p", { className: "text-vscode-descriptionForeground text-sm mt-2 mb-0", children: description }),
		],
	})
}
//# sourceMappingURL=SectionHeader.js.map
