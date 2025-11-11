import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime"
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react"
import { rooDefaultModelId } from "@roo-code/types"
import { useAppTranslation } from "@src/i18n/TranslationContext"
import { vscode } from "@src/utils/vscode"
import { ModelPicker } from "../ModelPicker"
export const Roo = ({
	apiConfiguration,
	setApiConfigurationField,
	routerModels,
	cloudIsAuthenticated,
	organizationAllowList,
	modelValidationError,
}) => {
	const { t } = useAppTranslation()
	return _jsxs(_Fragment, {
		children: [
			cloudIsAuthenticated
				? _jsx("div", {
						className: "text-sm text-vscode-descriptionForeground",
						children: t("settings:providers.roo.authenticatedMessage"),
					})
				: _jsx("div", {
						className: "flex flex-col gap-2",
						children: _jsx(VSCodeButton, {
							appearance: "primary",
							onClick: () => vscode.postMessage({ type: "rooCloudSignIn" }),
							className: "w-fit",
							children: t("settings:providers.roo.connectButton"),
						}),
					}),
			_jsx(ModelPicker, {
				apiConfiguration: apiConfiguration,
				setApiConfigurationField: setApiConfigurationField,
				defaultModelId: rooDefaultModelId,
				models: routerModels?.roo ?? {},
				modelIdKey: "apiModelId",
				serviceName: "Roo Code Cloud",
				serviceUrl: "https://roocode.com",
				organizationAllowList: organizationAllowList,
				errorMessage: modelValidationError,
			}),
		],
	})
}
//# sourceMappingURL=Roo.js.map
