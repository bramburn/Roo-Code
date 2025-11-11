import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime"
import { VSCodeLink } from "@vscode/webview-ui-toolkit/react"
import { formatPrice } from "@src/utils/formatPrice"
import { cn } from "@src/lib/utils"
import { useAppTranslation } from "@src/i18n/TranslationContext"
import { ModelDescriptionMarkdown } from "./ModelDescriptionMarkdown"
export const ModelInfoView = ({
	apiProvider,
	selectedModelId,
	modelInfo,
	isDescriptionExpanded,
	setIsDescriptionExpanded,
}) => {
	const { t } = useAppTranslation()
	// Show tiered pricing table for OpenAI Native when model supports non-standard tiers
	const allowedTierNames =
		modelInfo?.tiers?.filter((t) => t.name === "flex" || t.name === "priority")?.map((t) => t.name) ?? []
	const shouldShowTierPricingTable = apiProvider === "openai-native" && allowedTierNames.length > 0
	const fmt = (n) => (typeof n === "number" ? `${formatPrice(n)}` : "—")
	const baseInfoItems = [
		typeof modelInfo?.contextWindow === "number" &&
			modelInfo.contextWindow > 0 &&
			_jsxs(_Fragment, {
				children: [
					_jsx("span", { className: "font-medium", children: t("settings:modelInfo.contextWindow") }),
					" ",
					modelInfo.contextWindow?.toLocaleString(),
					" tokens",
				],
			}),
		typeof modelInfo?.maxTokens === "number" &&
			modelInfo.maxTokens > 0 &&
			_jsxs(_Fragment, {
				children: [
					_jsxs("span", { className: "font-medium", children: [t("settings:modelInfo.maxOutput"), ":"] }),
					" ",
					modelInfo.maxTokens?.toLocaleString(),
					" tokens",
				],
			}),
		_jsx(ModelInfoSupportsItem, {
			isSupported: modelInfo?.supportsImages ?? false,
			supportsLabel: t("settings:modelInfo.supportsImages"),
			doesNotSupportLabel: t("settings:modelInfo.noImages"),
		}),
		_jsx(ModelInfoSupportsItem, {
			isSupported: modelInfo?.supportsPromptCache ?? false,
			supportsLabel: t("settings:modelInfo.supportsPromptCache"),
			doesNotSupportLabel: t("settings:modelInfo.noPromptCache"),
		}),
		apiProvider === "gemini" &&
			_jsxs("span", {
				className: "italic",
				children: [
					selectedModelId.includes("pro-preview")
						? t("settings:modelInfo.gemini.billingEstimate")
						: t("settings:modelInfo.gemini.freeRequests", {
								count: selectedModelId && selectedModelId.includes("flash") ? 15 : 2,
							}),
					" ",
					_jsx(VSCodeLink, {
						href: "https://ai.google.dev/pricing",
						className: "text-sm",
						children: t("settings:modelInfo.gemini.pricingDetails"),
					}),
				],
			}),
	].filter(Boolean)
	const priceInfoItems = [
		modelInfo?.inputPrice !== undefined &&
			modelInfo.inputPrice > 0 &&
			_jsxs(_Fragment, {
				children: [
					_jsxs("span", { className: "font-medium", children: [t("settings:modelInfo.inputPrice"), ":"] }),
					" ",
					formatPrice(modelInfo.inputPrice),
					" / 1M tokens",
				],
			}),
		modelInfo?.outputPrice !== undefined &&
			modelInfo.outputPrice > 0 &&
			_jsxs(_Fragment, {
				children: [
					_jsxs("span", { className: "font-medium", children: [t("settings:modelInfo.outputPrice"), ":"] }),
					" ",
					formatPrice(modelInfo.outputPrice),
					" / 1M tokens",
				],
			}),
		modelInfo?.supportsPromptCache &&
			modelInfo.cacheReadsPrice &&
			_jsxs(_Fragment, {
				children: [
					_jsxs("span", {
						className: "font-medium",
						children: [t("settings:modelInfo.cacheReadsPrice"), ":"],
					}),
					" ",
					formatPrice(modelInfo.cacheReadsPrice || 0),
					" / 1M tokens",
				],
			}),
		modelInfo?.supportsPromptCache &&
			modelInfo.cacheWritesPrice &&
			_jsxs(_Fragment, {
				children: [
					_jsxs("span", {
						className: "font-medium",
						children: [t("settings:modelInfo.cacheWritesPrice"), ":"],
					}),
					" ",
					formatPrice(modelInfo.cacheWritesPrice || 0),
					" / 1M tokens",
				],
			}),
	].filter(Boolean)
	const infoItems = shouldShowTierPricingTable ? baseInfoItems : [...baseInfoItems, ...priceInfoItems]
	return _jsxs(_Fragment, {
		children: [
			modelInfo?.description &&
				_jsx(
					ModelDescriptionMarkdown,
					{
						markdown: modelInfo.description,
						isExpanded: isDescriptionExpanded,
						setIsExpanded: setIsDescriptionExpanded,
					},
					"description",
				),
			_jsx("div", {
				className: "text-sm text-vscode-descriptionForeground",
				children: infoItems.map((item, index) => _jsx("div", { children: item }, index)),
			}),
			shouldShowTierPricingTable &&
				_jsxs("div", {
					className: "mt-2",
					children: [
						_jsx("div", {
							className: "text-xs text-vscode-descriptionForeground mb-1",
							children: t("settings:serviceTier.pricingTableTitle"),
						}),
						_jsx("div", {
							className: "border border-vscode-dropdown-border rounded-xs overflow-hidden",
							children: _jsxs("table", {
								className: "w-full text-sm",
								children: [
									_jsx("thead", {
										className: "bg-vscode-dropdown-background",
										children: _jsxs("tr", {
											children: [
												_jsx("th", {
													className: "text-left px-3 py-1.5",
													children: t("settings:serviceTier.columns.tier"),
												}),
												_jsx("th", {
													className: "text-right px-3 py-1.5",
													children: t("settings:serviceTier.columns.input"),
												}),
												_jsx("th", {
													className: "text-right px-3 py-1.5",
													children: t("settings:serviceTier.columns.output"),
												}),
												_jsx("th", {
													className: "text-right px-3 py-1.5",
													children: t("settings:serviceTier.columns.cacheReads"),
												}),
											],
										}),
									}),
									_jsxs("tbody", {
										children: [
											_jsxs("tr", {
												className: "border-t border-vscode-dropdown-border/60",
												children: [
													_jsx("td", {
														className: "px-3 py-1.5",
														children: t("settings:serviceTier.standard"),
													}),
													_jsx("td", {
														className: "px-3 py-1.5 text-right",
														children: fmt(modelInfo?.inputPrice),
													}),
													_jsx("td", {
														className: "px-3 py-1.5 text-right",
														children: fmt(modelInfo?.outputPrice),
													}),
													_jsx("td", {
														className: "px-3 py-1.5 text-right",
														children: fmt(modelInfo?.cacheReadsPrice),
													}),
												],
											}),
											allowedTierNames.includes("flex") &&
												_jsxs("tr", {
													className: "border-t border-vscode-dropdown-border/60",
													children: [
														_jsx("td", {
															className: "px-3 py-1.5",
															children: t("settings:serviceTier.flex"),
														}),
														_jsx("td", {
															className: "px-3 py-1.5 text-right",
															children: fmt(
																modelInfo?.tiers?.find((t) => t.name === "flex")
																	?.inputPrice ?? modelInfo?.inputPrice,
															),
														}),
														_jsx("td", {
															className: "px-3 py-1.5 text-right",
															children: fmt(
																modelInfo?.tiers?.find((t) => t.name === "flex")
																	?.outputPrice ?? modelInfo?.outputPrice,
															),
														}),
														_jsx("td", {
															className: "px-3 py-1.5 text-right",
															children: fmt(
																modelInfo?.tiers?.find((t) => t.name === "flex")
																	?.cacheReadsPrice ?? modelInfo?.cacheReadsPrice,
															),
														}),
													],
												}),
											allowedTierNames.includes("priority") &&
												_jsxs("tr", {
													className: "border-t border-vscode-dropdown-border/60",
													children: [
														_jsx("td", {
															className: "px-3 py-1.5",
															children: t("settings:serviceTier.priority"),
														}),
														_jsx("td", {
															className: "px-3 py-1.5 text-right",
															children: fmt(
																modelInfo?.tiers?.find((t) => t.name === "priority")
																	?.inputPrice ?? modelInfo?.inputPrice,
															),
														}),
														_jsx("td", {
															className: "px-3 py-1.5 text-right",
															children: fmt(
																modelInfo?.tiers?.find((t) => t.name === "priority")
																	?.outputPrice ?? modelInfo?.outputPrice,
															),
														}),
														_jsx("td", {
															className: "px-3 py-1.5 text-right",
															children: fmt(
																modelInfo?.tiers?.find((t) => t.name === "priority")
																	?.cacheReadsPrice ?? modelInfo?.cacheReadsPrice,
															),
														}),
													],
												}),
										],
									}),
								],
							}),
						}),
					],
				}),
		],
	})
}
const ModelInfoSupportsItem = ({ isSupported, supportsLabel, doesNotSupportLabel }) =>
	_jsxs("div", {
		className: "flex items-center gap-1 font-medium",
		children: [
			_jsx("span", { className: cn("codicon", isSupported ? "codicon-check" : "codicon-x") }),
			isSupported ? supportsLabel : doesNotSupportLabel,
		],
	})
//# sourceMappingURL=ModelInfoView.js.map
