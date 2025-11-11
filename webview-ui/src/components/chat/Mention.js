import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime"
import { mentionRegexGlobal } from "@roo/context-mentions"
import { vscode } from "../../utils/vscode"
export const Mention = ({ text, withShadow = false }) => {
	if (!text) {
		return _jsx(_Fragment, { children: text })
	}
	const parts = text.split(mentionRegexGlobal).map((part, index) => {
		if (index % 2 === 0) {
			// This is regular text.
			return part
		} else {
			// This is a mention.
			return _jsxs(
				"span",
				{
					className: `${withShadow ? "mention-context-highlight-with-shadow" : "mention-context-highlight"} cursor-pointer`,
					onClick: () => vscode.postMessage({ type: "openMention", text: part }),
					children: ["@", part],
				},
				index,
			)
		}
	})
	return _jsx(_Fragment, { children: parts })
}
//# sourceMappingURL=Mention.js.map
