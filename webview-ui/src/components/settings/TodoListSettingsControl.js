import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime"
import { useCallback } from "react"
import { useAppTranslation } from "@/i18n/TranslationContext"
import { VSCodeCheckbox } from "@vscode/webview-ui-toolkit/react"
export const TodoListSettingsControl = ({ todoListEnabled = true, onChange }) => {
	const { t } = useAppTranslation()
	const handleTodoListEnabledChange = useCallback(
		(e) => {
			onChange("todoListEnabled", e.target.checked)
		},
		[onChange],
	)
	return _jsx("div", {
		className: "flex flex-col gap-1",
		children: _jsxs("div", {
			children: [
				_jsx(VSCodeCheckbox, {
					checked: todoListEnabled,
					onChange: handleTodoListEnabledChange,
					children: _jsx("span", {
						className: "font-medium",
						children: t("settings:advanced.todoList.label"),
					}),
				}),
				_jsx("div", {
					className: "text-vscode-descriptionForeground text-sm",
					children: t("settings:advanced.todoList.description"),
				}),
			],
		}),
	})
}
//# sourceMappingURL=TodoListSettingsControl.js.map
