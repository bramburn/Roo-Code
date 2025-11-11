import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime"
import { useCallback, useState, useEffect } from "react"
import { Checkbox } from "vscrui"
import { VSCodeTextField } from "@vscode/webview-ui-toolkit/react"
import { BEDROCK_REGIONS, BEDROCK_1M_CONTEXT_MODEL_IDS } from "@roo-code/types"
import { useAppTranslation } from "@src/i18n/TranslationContext"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, StandardTooltip } from "@src/components/ui"
import { inputEventTransform, noTransform } from "../transforms"
export const Bedrock = ({ apiConfiguration, setApiConfigurationField, selectedModelInfo }) => {
	const { t } = useAppTranslation()
	const [awsEndpointSelected, setAwsEndpointSelected] = useState(!!apiConfiguration?.awsBedrockEndpointEnabled)
	// Check if the selected model supports 1M context (Claude Sonnet 4 / 4.5)
	const supports1MContextBeta =
		!!apiConfiguration?.apiModelId && BEDROCK_1M_CONTEXT_MODEL_IDS.includes(apiConfiguration.apiModelId)
	// Update the endpoint enabled state when the configuration changes
	useEffect(() => {
		setAwsEndpointSelected(!!apiConfiguration?.awsBedrockEndpointEnabled)
	}, [apiConfiguration?.awsBedrockEndpointEnabled])
	const handleInputChange = useCallback(
		(field, transform = inputEventTransform) =>
			(event) => {
				setApiConfigurationField(field, transform(event))
			},
		[setApiConfigurationField],
	)
	return _jsxs(_Fragment, {
		children: [
			_jsxs("div", {
				children: [
					_jsx("label", { className: "block font-medium mb-1", children: "Authentication Method" }),
					_jsxs(Select, {
						value: apiConfiguration?.awsUseApiKey
							? "apikey"
							: apiConfiguration?.awsUseProfile
								? "profile"
								: "credentials",
						onValueChange: (value) => {
							if (value === "apikey") {
								setApiConfigurationField("awsUseApiKey", true)
								setApiConfigurationField("awsUseProfile", false)
							} else if (value === "profile") {
								setApiConfigurationField("awsUseApiKey", false)
								setApiConfigurationField("awsUseProfile", true)
							} else {
								setApiConfigurationField("awsUseApiKey", false)
								setApiConfigurationField("awsUseProfile", false)
							}
						},
						children: [
							_jsx(SelectTrigger, {
								className: "w-full",
								children: _jsx(SelectValue, { placeholder: t("settings:common.select") }),
							}),
							_jsxs(SelectContent, {
								children: [
									_jsx(SelectItem, {
										value: "credentials",
										children: t("settings:providers.awsCredentials"),
									}),
									_jsx(SelectItem, {
										value: "profile",
										children: t("settings:providers.awsProfile"),
									}),
									_jsx(SelectItem, { value: "apikey", children: t("settings:providers.awsApiKey") }),
								],
							}),
						],
					}),
				],
			}),
			_jsx("div", {
				className: "text-sm text-vscode-descriptionForeground -mt-3",
				children: t("settings:providers.apiKeyStorageNotice"),
			}),
			apiConfiguration?.awsUseApiKey
				? _jsx(VSCodeTextField, {
						value: apiConfiguration?.awsApiKey || "",
						type: "password",
						onInput: handleInputChange("awsApiKey"),
						placeholder: t("settings:placeholders.apiKey"),
						className: "w-full",
						children: _jsx("label", {
							className: "block font-medium mb-1",
							children: t("settings:providers.awsApiKey"),
						}),
					})
				: apiConfiguration?.awsUseProfile
					? _jsx(VSCodeTextField, {
							value: apiConfiguration?.awsProfile || "",
							onInput: handleInputChange("awsProfile"),
							placeholder: t("settings:placeholders.profileName"),
							className: "w-full",
							children: _jsx("label", {
								className: "block font-medium mb-1",
								children: t("settings:providers.awsProfileName"),
							}),
						})
					: _jsxs(_Fragment, {
							children: [
								_jsx(VSCodeTextField, {
									value: apiConfiguration?.awsAccessKey || "",
									type: "password",
									onInput: handleInputChange("awsAccessKey"),
									placeholder: t("settings:placeholders.accessKey"),
									className: "w-full",
									children: _jsx("label", {
										className: "block font-medium mb-1",
										children: t("settings:providers.awsAccessKey"),
									}),
								}),
								_jsx(VSCodeTextField, {
									value: apiConfiguration?.awsSecretKey || "",
									type: "password",
									onInput: handleInputChange("awsSecretKey"),
									placeholder: t("settings:placeholders.secretKey"),
									className: "w-full",
									children: _jsx("label", {
										className: "block font-medium mb-1",
										children: t("settings:providers.awsSecretKey"),
									}),
								}),
								_jsx(VSCodeTextField, {
									value: apiConfiguration?.awsSessionToken || "",
									type: "password",
									onInput: handleInputChange("awsSessionToken"),
									placeholder: t("settings:placeholders.sessionToken"),
									className: "w-full",
									children: _jsx("label", {
										className: "block font-medium mb-1",
										children: t("settings:providers.awsSessionToken"),
									}),
								}),
							],
						}),
			_jsxs("div", {
				children: [
					_jsx("label", { className: "block font-medium mb-1", children: t("settings:providers.awsRegion") }),
					_jsxs(Select, {
						value: apiConfiguration?.awsRegion || "",
						onValueChange: (value) => setApiConfigurationField("awsRegion", value),
						children: [
							_jsx(SelectTrigger, {
								className: "w-full",
								children: _jsx(SelectValue, { placeholder: t("settings:common.select") }),
							}),
							_jsx(SelectContent, {
								children: BEDROCK_REGIONS.map(({ value, label }) =>
									_jsx(SelectItem, { value: value, children: label }, value),
								),
							}),
						],
					}),
				],
			}),
			_jsx(Checkbox, {
				checked: apiConfiguration?.awsUseCrossRegionInference || false,
				onChange: handleInputChange("awsUseCrossRegionInference", noTransform),
				children: t("settings:providers.awsCrossRegion"),
			}),
			selectedModelInfo?.supportsPromptCache &&
				_jsxs(_Fragment, {
					children: [
						_jsx(Checkbox, {
							checked: apiConfiguration?.awsUsePromptCache || false,
							onChange: handleInputChange("awsUsePromptCache", noTransform),
							children: _jsxs("div", {
								className: "flex items-center gap-1",
								children: [
									_jsx("span", { children: t("settings:providers.enablePromptCaching") }),
									_jsx(StandardTooltip, {
										content: t("settings:providers.enablePromptCachingTitle"),
										children: _jsx("i", {
											className: "codicon codicon-info text-vscode-descriptionForeground",
											style: { fontSize: "12px" },
										}),
									}),
								],
							}),
						}),
						_jsx("div", {
							className: "text-sm text-vscode-descriptionForeground ml-6 mt-1",
							children: t("settings:providers.cacheUsageNote"),
						}),
					],
				}),
			supports1MContextBeta &&
				_jsxs("div", {
					children: [
						_jsx(Checkbox, {
							checked: apiConfiguration?.awsBedrock1MContext ?? false,
							onChange: (checked) => {
								setApiConfigurationField("awsBedrock1MContext", checked)
							},
							children: t("settings:providers.awsBedrock1MContextBetaLabel"),
						}),
						_jsx("div", {
							className: "text-sm text-vscode-descriptionForeground mt-1 ml-6",
							children: t("settings:providers.awsBedrock1MContextBetaDescription"),
						}),
					],
				}),
			_jsx(Checkbox, {
				checked: awsEndpointSelected,
				onChange: (isChecked) => {
					setAwsEndpointSelected(isChecked)
					setApiConfigurationField("awsBedrockEndpointEnabled", isChecked)
				},
				children: t("settings:providers.awsBedrockVpc.useCustomVpcEndpoint"),
			}),
			awsEndpointSelected &&
				_jsxs(_Fragment, {
					children: [
						_jsx(VSCodeTextField, {
							value: apiConfiguration?.awsBedrockEndpoint || "",
							style: { width: "100%", marginTop: 3, marginBottom: 5 },
							type: "url",
							onInput: handleInputChange("awsBedrockEndpoint"),
							placeholder: t("settings:providers.awsBedrockVpc.vpcEndpointUrlPlaceholder"),
							"data-testid": "vpc-endpoint-input",
						}),
						_jsxs("div", {
							className: "text-sm text-vscode-descriptionForeground ml-6 mt-1 mb-3",
							children: [
								t("settings:providers.awsBedrockVpc.examples"),
								_jsx("div", {
									className: "ml-2",
									children: "\u2022 https://vpce-xxx.bedrock.region.vpce.amazonaws.com/",
								}),
								_jsx("div", {
									className: "ml-2",
									children: "\u2022 https://gateway.my-company.com/route/app/bedrock",
								}),
							],
						}),
					],
				}),
		],
	})
}
//# sourceMappingURL=Bedrock.js.map
