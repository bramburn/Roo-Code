import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime"
import { useAppTranslation } from "@/i18n/TranslationContext"
export const ProfileViolationWarning = () => {
	const { t } = useAppTranslation()
	return _jsxs("div", {
		className:
			"flex items-center px-4 py-2 mb-2 text-sm rounded bg-vscode-editorWarning-foreground text-vscode-editor-background",
		children: [
			_jsx("div", {
				className: "flex items-center justify-center w-5 h-5 mr-2",
				children: _jsx("span", { className: "codicon codicon-warning" }),
			}),
			_jsx("span", { children: t("chat:profileViolationWarning") }),
		],
	})
}
export default ProfileViolationWarning
//# sourceMappingURL=ProfileViolationWarning.js.map
