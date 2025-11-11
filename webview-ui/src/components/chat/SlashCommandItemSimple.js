import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime"
export const SlashCommandItemSimple = ({ command, onClick }) => {
	return _jsx("div", {
		className: "px-4 py-2 text-sm flex items-center hover:bg-vscode-list-hoverBackground cursor-pointer",
		onClick: () => onClick?.(command),
		children: _jsx("div", {
			className: "flex-1 min-w-0",
			children: _jsxs("div", {
				children: [
					_jsxs("span", { className: "truncate text-vscode-foreground", children: ["/", command.name] }),
					command.description &&
						_jsx("div", {
							className: "text-xs text-vscode-descriptionForeground truncate mt-0.5",
							children: command.description,
						}),
				],
			}),
		}),
	})
}
//# sourceMappingURL=SlashCommandItemSimple.js.map
