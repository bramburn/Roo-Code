import { jsxs as _jsxs } from "react/jsx-runtime"
import { VSCodeLink } from "@vscode/webview-ui-toolkit/react"
import { useOpenRouterKeyInfo } from "@/components/ui/hooks/useOpenRouterKeyInfo"
export const OpenRouterBalanceDisplay = ({ apiKey, baseUrl }) => {
	const { data: keyInfo } = useOpenRouterKeyInfo(apiKey, baseUrl)
	if (!keyInfo || !keyInfo.limit) {
		return null
	}
	const formattedBalance = (keyInfo.limit - keyInfo.usage).toFixed(2)
	return _jsxs(VSCodeLink, {
		href: "https://openrouter.ai/settings/keys",
		className: "text-vscode-foreground hover:underline",
		children: ["$", formattedBalance],
	})
}
//# sourceMappingURL=OpenRouterBalanceDisplay.js.map
