import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime"
import { useMemo } from "react"
import { VSCodeTextField } from "@vscode/webview-ui-toolkit/react"
import { validateBedrockArn } from "@src/utils/validate"
import { useAppTranslation } from "@src/i18n/TranslationContext"
export const BedrockCustomArn = ({ apiConfiguration, setApiConfigurationField }) => {
	const { t } = useAppTranslation()
	const validation = useMemo(() => {
		const { awsCustomArn, awsRegion } = apiConfiguration
		return awsCustomArn ? validateBedrockArn(awsCustomArn, awsRegion) : { isValid: true, errorMessage: undefined }
	}, [apiConfiguration])
	return _jsxs(_Fragment, {
		children: [
			_jsx(VSCodeTextField, {
				value: apiConfiguration?.awsCustomArn || "",
				onInput: (e) => setApiConfigurationField("awsCustomArn", e.target.value),
				placeholder: t("settings:placeholders.customArn"),
				className: "w-full",
				children: _jsx("label", {
					className: "block font-medium mb-1",
					children: t("settings:labels.customArn"),
				}),
			}),
			_jsxs("div", {
				className: "text-sm text-vscode-descriptionForeground -mt-2",
				children: [
					t("settings:providers.awsCustomArnUse"),
					_jsxs("ul", {
						className: "list-disc pl-5 mt-1",
						children: [
							_jsx("li", {
								children:
									"arn:aws:bedrock:eu-west-1:123456789012:inference-profile/eu.anthropic.claude-3-7-sonnet-20250219-v1:0",
							}),
							_jsx("li", {
								children:
									"arn:aws:bedrock:us-west-2:123456789012:provisioned-model/my-provisioned-model",
							}),
							_jsx("li", {
								children:
									"arn:aws:bedrock:us-east-1:123456789012:default-prompt-router/anthropic.claude:1",
							}),
						],
					}),
					t("settings:providers.awsCustomArnDesc"),
				],
			}),
			!validation.isValid
				? _jsx("div", {
						className: "text-sm text-vscode-errorForeground mt-2",
						children: validation.errorMessage || t("settings:providers.invalidArnFormat"),
					})
				: validation.errorMessage &&
					_jsx("div", {
						className: "text-sm text-vscode-errorForeground mt-2",
						children: validation.errorMessage,
					}),
		],
	})
}
//# sourceMappingURL=BedrockCustomArn.js.map
