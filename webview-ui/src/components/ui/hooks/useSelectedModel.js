import {
	anthropicDefaultModelId,
	anthropicModels,
	bedrockDefaultModelId,
	bedrockModels,
	cerebrasDefaultModelId,
	cerebrasModels,
	deepSeekDefaultModelId,
	deepSeekModels,
	moonshotDefaultModelId,
	moonshotModels,
	minimaxDefaultModelId,
	minimaxModels,
	geminiDefaultModelId,
	geminiModels,
	mistralDefaultModelId,
	mistralModels,
	openAiModelInfoSaneDefaults,
	openAiNativeDefaultModelId,
	openAiNativeModels,
	vertexDefaultModelId,
	vertexModels,
	xaiDefaultModelId,
	xaiModels,
	groqModels,
	groqDefaultModelId,
	chutesDefaultModelId,
	vscodeLlmModels,
	vscodeLlmDefaultModelId,
	openRouterDefaultModelId,
	requestyDefaultModelId,
	glamaDefaultModelId,
	unboundDefaultModelId,
	litellmDefaultModelId,
	claudeCodeDefaultModelId,
	claudeCodeModels,
	sambaNovaModels,
	sambaNovaDefaultModelId,
	doubaoModels,
	doubaoDefaultModelId,
	internationalZAiDefaultModelId,
	mainlandZAiDefaultModelId,
	internationalZAiModels,
	mainlandZAiModels,
	fireworksModels,
	fireworksDefaultModelId,
	featherlessModels,
	featherlessDefaultModelId,
	ioIntelligenceDefaultModelId,
	ioIntelligenceModels,
	rooDefaultModelId,
	qwenCodeDefaultModelId,
	qwenCodeModels,
	vercelAiGatewayDefaultModelId,
	BEDROCK_1M_CONTEXT_MODEL_IDS,
	deepInfraDefaultModelId,
	isDynamicProvider,
} from "@roo-code/types"
import { useRouterModels } from "./useRouterModels"
import { useOpenRouterModelProviders } from "./useOpenRouterModelProviders"
import { useLmStudioModels } from "./useLmStudioModels"
import { useOllamaModels } from "./useOllamaModels"
export const useSelectedModel = (apiConfiguration) => {
	const provider = apiConfiguration?.apiProvider || "anthropic"
	const openRouterModelId = provider === "openrouter" ? apiConfiguration?.openRouterModelId : undefined
	const lmStudioModelId = provider === "lmstudio" ? apiConfiguration?.lmStudioModelId : undefined
	const ollamaModelId = provider === "ollama" ? apiConfiguration?.ollamaModelId : undefined
	// Only fetch router models for dynamic providers
	const shouldFetchRouterModels = isDynamicProvider(provider)
	const routerModels = useRouterModels({
		provider: shouldFetchRouterModels ? provider : undefined,
		enabled: shouldFetchRouterModels,
	})
	const openRouterModelProviders = useOpenRouterModelProviders(openRouterModelId)
	const lmStudioModels = useLmStudioModels(lmStudioModelId)
	const ollamaModels = useOllamaModels(ollamaModelId)
	// Compute readiness only for the data actually needed for the selected provider
	const needRouterModels = shouldFetchRouterModels
	const needOpenRouterProviders = provider === "openrouter"
	const needLmStudio = typeof lmStudioModelId !== "undefined"
	const needOllama = typeof ollamaModelId !== "undefined"
	const isReady =
		(!needLmStudio || typeof lmStudioModels.data !== "undefined") &&
		(!needOllama || typeof ollamaModels.data !== "undefined") &&
		(!needRouterModels || typeof routerModels.data !== "undefined") &&
		(!needOpenRouterProviders || typeof openRouterModelProviders.data !== "undefined")
	const { id, info } =
		apiConfiguration && isReady
			? getSelectedModel({
					provider,
					apiConfiguration,
					routerModels: routerModels.data || {},
					openRouterModelProviders: openRouterModelProviders.data || {},
					lmStudioModels: lmStudioModels.data || undefined,
					ollamaModels: ollamaModels.data || undefined,
				})
			: { id: anthropicDefaultModelId, info: undefined }
	return {
		provider,
		id,
		info,
		isLoading:
			(needRouterModels && routerModels.isLoading) ||
			(needOpenRouterProviders && openRouterModelProviders.isLoading) ||
			(needLmStudio && lmStudioModels.isLoading) ||
			(needOllama && ollamaModels.isLoading),
		isError:
			(needRouterModels && routerModels.isError) ||
			(needOpenRouterProviders && openRouterModelProviders.isError) ||
			(needLmStudio && lmStudioModels.isError) ||
			(needOllama && ollamaModels.isError),
	}
}
function getSelectedModel({
	provider,
	apiConfiguration,
	routerModels,
	openRouterModelProviders,
	lmStudioModels,
	ollamaModels,
}) {
	// the `undefined` case are used to show the invalid selection to prevent
	// users from seeing the default model if their selection is invalid
	// this gives a better UX than showing the default model
	switch (provider) {
		case "openrouter": {
			const id = apiConfiguration.openRouterModelId ?? openRouterDefaultModelId
			let info = routerModels.openrouter[id]
			const specificProvider = apiConfiguration.openRouterSpecificProvider
			if (specificProvider && openRouterModelProviders[specificProvider]) {
				// Overwrite the info with the specific provider info. Some
				// fields are missing the model info for `openRouterModelProviders`
				// so we need to merge the two.
				info = info
					? { ...info, ...openRouterModelProviders[specificProvider] }
					: openRouterModelProviders[specificProvider]
			}
			return { id, info }
		}
		case "requesty": {
			const id = apiConfiguration.requestyModelId ?? requestyDefaultModelId
			const info = routerModels.requesty[id]
			return { id, info }
		}
		case "glama": {
			const id = apiConfiguration.glamaModelId ?? glamaDefaultModelId
			const info = routerModels.glama[id]
			return { id, info }
		}
		case "unbound": {
			const id = apiConfiguration.unboundModelId ?? unboundDefaultModelId
			const info = routerModels.unbound[id]
			return { id, info }
		}
		case "litellm": {
			const id = apiConfiguration.litellmModelId ?? litellmDefaultModelId
			const info = routerModels.litellm[id]
			return { id, info }
		}
		case "xai": {
			const id = apiConfiguration.apiModelId ?? xaiDefaultModelId
			const info = xaiModels[id]
			return info ? { id, info } : { id, info: undefined }
		}
		case "groq": {
			const id = apiConfiguration.apiModelId ?? groqDefaultModelId
			const info = groqModels[id]
			return { id, info }
		}
		case "huggingface": {
			const id = apiConfiguration.huggingFaceModelId ?? "meta-llama/Llama-3.3-70B-Instruct"
			const info = {
				maxTokens: 8192,
				contextWindow: 131072,
				supportsImages: false,
				supportsPromptCache: false,
			}
			return { id, info }
		}
		case "chutes": {
			const id = apiConfiguration.apiModelId ?? chutesDefaultModelId
			const info = routerModels.chutes[id]
			return { id, info }
		}
		case "bedrock": {
			const id = apiConfiguration.apiModelId ?? bedrockDefaultModelId
			const baseInfo = bedrockModels[id]
			// Special case for custom ARN.
			if (id === "custom-arn") {
				return {
					id,
					info: { maxTokens: 5000, contextWindow: 128_000, supportsPromptCache: false, supportsImages: true },
				}
			}
			// Apply 1M context for Claude Sonnet 4 / 4.5 when enabled
			if (BEDROCK_1M_CONTEXT_MODEL_IDS.includes(id) && apiConfiguration.awsBedrock1MContext && baseInfo) {
				// Create a new ModelInfo object with updated context window
				const info = {
					...baseInfo,
					contextWindow: 1_000_000,
				}
				return { id, info }
			}
			return { id, info: baseInfo }
		}
		case "vertex": {
			const id = apiConfiguration.apiModelId ?? vertexDefaultModelId
			const info = vertexModels[id]
			return { id, info }
		}
		case "gemini": {
			const id = apiConfiguration.apiModelId ?? geminiDefaultModelId
			const info = geminiModels[id]
			return { id, info }
		}
		case "deepseek": {
			const id = apiConfiguration.apiModelId ?? deepSeekDefaultModelId
			const info = deepSeekModels[id]
			return { id, info }
		}
		case "doubao": {
			const id = apiConfiguration.apiModelId ?? doubaoDefaultModelId
			const info = doubaoModels[id]
			return { id, info }
		}
		case "moonshot": {
			const id = apiConfiguration.apiModelId ?? moonshotDefaultModelId
			const info = moonshotModels[id]
			return { id, info }
		}
		case "minimax": {
			const id = apiConfiguration.apiModelId ?? minimaxDefaultModelId
			const info = minimaxModels[id]
			return { id, info }
		}
		case "zai": {
			const isChina = apiConfiguration.zaiApiLine === "china_coding"
			const models = isChina ? mainlandZAiModels : internationalZAiModels
			const defaultModelId = isChina ? mainlandZAiDefaultModelId : internationalZAiDefaultModelId
			const id = apiConfiguration.apiModelId ?? defaultModelId
			const info = models[id]
			return { id, info }
		}
		case "openai-native": {
			const id = apiConfiguration.apiModelId ?? openAiNativeDefaultModelId
			const info = openAiNativeModels[id]
			return { id, info }
		}
		case "mistral": {
			const id = apiConfiguration.apiModelId ?? mistralDefaultModelId
			const info = mistralModels[id]
			return { id, info }
		}
		case "openai": {
			const id = apiConfiguration.openAiModelId ?? ""
			const info = apiConfiguration?.openAiCustomModelInfo ?? openAiModelInfoSaneDefaults
			return { id, info }
		}
		case "ollama": {
			const id = apiConfiguration.ollamaModelId ?? ""
			const info = ollamaModels && ollamaModels[apiConfiguration.ollamaModelId]
			const adjustedInfo =
				info?.contextWindow &&
				apiConfiguration?.ollamaNumCtx &&
				apiConfiguration.ollamaNumCtx < info.contextWindow
					? { ...info, contextWindow: apiConfiguration.ollamaNumCtx }
					: info
			return {
				id,
				info: adjustedInfo || undefined,
			}
		}
		case "lmstudio": {
			const id = apiConfiguration.lmStudioModelId ?? ""
			const info = lmStudioModels && lmStudioModels[apiConfiguration.lmStudioModelId]
			return {
				id,
				info: info || undefined,
			}
		}
		case "deepinfra": {
			const id = apiConfiguration.deepInfraModelId ?? deepInfraDefaultModelId
			const info = routerModels.deepinfra?.[id]
			return { id, info }
		}
		case "vscode-lm": {
			const id = apiConfiguration?.vsCodeLmModelSelector
				? `${apiConfiguration.vsCodeLmModelSelector.vendor}/${apiConfiguration.vsCodeLmModelSelector.family}`
				: vscodeLlmDefaultModelId
			const modelFamily = apiConfiguration?.vsCodeLmModelSelector?.family ?? vscodeLlmDefaultModelId
			const info = vscodeLlmModels[modelFamily]
			return { id, info: { ...openAiModelInfoSaneDefaults, ...info, supportsImages: false } } // VSCode LM API currently doesn't support images.
		}
		case "claude-code": {
			// Claude Code models extend anthropic models but with images and prompt caching disabled
			const id = apiConfiguration.apiModelId ?? claudeCodeDefaultModelId
			const info = claudeCodeModels[id]
			return { id, info: { ...openAiModelInfoSaneDefaults, ...info } }
		}
		case "cerebras": {
			const id = apiConfiguration.apiModelId ?? cerebrasDefaultModelId
			const info = cerebrasModels[id]
			return { id, info }
		}
		case "sambanova": {
			const id = apiConfiguration.apiModelId ?? sambaNovaDefaultModelId
			const info = sambaNovaModels[id]
			return { id, info }
		}
		case "fireworks": {
			const id = apiConfiguration.apiModelId ?? fireworksDefaultModelId
			const info = fireworksModels[id]
			return { id, info }
		}
		case "featherless": {
			const id = apiConfiguration.apiModelId ?? featherlessDefaultModelId
			const info = featherlessModels[id]
			return { id, info }
		}
		case "io-intelligence": {
			const id = apiConfiguration.ioIntelligenceModelId ?? ioIntelligenceDefaultModelId
			const info = routerModels["io-intelligence"]?.[id] ?? ioIntelligenceModels[id]
			return { id, info }
		}
		case "roo": {
			// Roo is a dynamic provider - models are loaded from API
			const id = apiConfiguration.apiModelId ?? rooDefaultModelId
			const info = routerModels.roo[id]
			return { id, info }
		}
		case "qwen-code": {
			const id = apiConfiguration.apiModelId ?? qwenCodeDefaultModelId
			const info = qwenCodeModels[id]
			return { id, info }
		}
		case "vercel-ai-gateway": {
			const id = apiConfiguration.vercelAiGatewayModelId ?? vercelAiGatewayDefaultModelId
			const info = routerModels["vercel-ai-gateway"]?.[id]
			return { id, info }
		}
		// case "anthropic":
		// case "human-relay":
		// case "fake-ai":
		default: {
			provider
			const id = apiConfiguration.apiModelId ?? anthropicDefaultModelId
			const baseInfo = anthropicModels[id]
			// Apply 1M context beta tier pricing for Claude Sonnet 4
			if (
				provider === "anthropic" &&
				(id === "claude-sonnet-4-20250514" || id === "claude-sonnet-4-5") &&
				apiConfiguration.anthropicBeta1MContext &&
				baseInfo
			) {
				// Type assertion since we know claude-sonnet-4-20250514 and claude-sonnet-4-5 have tiers
				const modelWithTiers = baseInfo
				const tier = modelWithTiers.tiers?.[0]
				if (tier) {
					// Create a new ModelInfo object with updated values
					const info = {
						...baseInfo,
						contextWindow: tier.contextWindow,
						inputPrice: tier.inputPrice ?? baseInfo.inputPrice,
						outputPrice: tier.outputPrice ?? baseInfo.outputPrice,
						cacheWritesPrice: tier.cacheWritesPrice ?? baseInfo.cacheWritesPrice,
						cacheReadsPrice: tier.cacheReadsPrice ?? baseInfo.cacheReadsPrice,
					}
					return { id, info }
				}
			}
			return { id, info: baseInfo }
		}
	}
}
//# sourceMappingURL=useSelectedModel.js.map
