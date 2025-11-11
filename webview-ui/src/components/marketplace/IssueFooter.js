import { jsx as _jsx } from "react/jsx-runtime"
import { Trans } from "react-i18next"
import { VSCodeLink } from "@vscode/webview-ui-toolkit/react"
export const IssueFooter = () => {
	return _jsx("div", {
		className: "text-xs text-vscode-descriptionForeground p-3",
		children: _jsx(Trans, {
			i18nKey: "marketplace:footer.issueText",
			children: _jsx(VSCodeLink, {
				href: "https://github.com/RooCodeInc/Roo-Code/issues/new?template=marketplace.yml",
				style: { display: "inline", fontSize: "inherit" },
				children: "Open a GitHub issue",
			}),
		}),
	})
}
//# sourceMappingURL=IssueFooter.js.map
