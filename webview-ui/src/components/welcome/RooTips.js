import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime"
import { VSCodeLink } from "@vscode/webview-ui-toolkit/react"
import { useTranslation } from "react-i18next"
import { Trans } from "react-i18next"
import { buildDocLink } from "@src/utils/docLinks"
const tips = [
	{
		icon: "codicon-account",
		href: buildDocLink("basic-usage/using-modes", "tips"),
		titleKey: "rooTips.customizableModes.title",
		descriptionKey: "rooTips.customizableModes.description",
	},
	{
		icon: "codicon-list-tree",
		href: buildDocLink("features/boomerang-tasks", "tips"),
		titleKey: "rooTips.boomerangTasks.title",
		descriptionKey: "rooTips.boomerangTasks.description",
	},
]
const RooTips = () => {
	const { t } = useTranslation("chat")
	return _jsxs("div", {
		children: [
			_jsx("p", {
				className:
					"text-vscode-editor-foreground leading-tight font-vscode-font-family text-center text-balance max-w-[380px] mx-auto my-0",
				children: _jsx(Trans, {
					i18nKey: "chat:about",
					components: {
						DocsLink: _jsx("a", {
							href: buildDocLink("", "welcome"),
							target: "_blank",
							rel: "noopener noreferrer",
							children: "the docs",
						}),
					},
				}),
			}),
			_jsx("div", {
				className: "flex flex-col items-center justify-center px-5 py-2.5 gap-4",
				children: tips.map((tip) =>
					_jsxs(
						"div",
						{
							className:
								"flex items-center gap-2 text-vscode-editor-foreground font-vscode max-w-[250px]",
							children: [
								_jsx("span", { className: `codicon ${tip.icon}` }),
								_jsxs("span", {
									children: [
										_jsx(VSCodeLink, {
											className: "forced-color-adjust-none",
											href: tip.href,
											children: t(tip.titleKey),
										}),
										": ",
										t(tip.descriptionKey),
									],
								}),
							],
						},
						tip.titleKey,
					),
				),
			}),
		],
	})
}
export default RooTips
//# sourceMappingURL=RooTips.js.map
