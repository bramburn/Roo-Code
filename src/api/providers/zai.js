import {
	internationalZAiModels,
	mainlandZAiModels,
	internationalZAiDefaultModelId,
	mainlandZAiDefaultModelId,
	ZAI_DEFAULT_TEMPERATURE,
	zaiApiLineConfigs,
} from "@roo-code/types"
import { getModelMaxOutputTokens } from "../../shared/api"
import { convertToOpenAiMessages } from "../transform/openai-format"
import { handleOpenAIError } from "./utils/openai-error-handler"
import { BaseOpenAiCompatibleProvider } from "./base-openai-compatible-provider"
export class ZAiHandler extends BaseOpenAiCompatibleProvider {
	constructor(options) {
		const isChina = zaiApiLineConfigs[options.zaiApiLine ?? "international_coding"].isChina
		const models = isChina ? mainlandZAiModels : internationalZAiModels
		const defaultModelId = isChina ? mainlandZAiDefaultModelId : internationalZAiDefaultModelId
		super({
			...options,
			providerName: "Z AI",
			baseURL: zaiApiLineConfigs[options.zaiApiLine ?? "international_coding"].baseUrl,
			apiKey: options.zaiApiKey ?? "not-provided",
			defaultProviderModelId: defaultModelId,
			providerModels: models,
			defaultTemperature: ZAI_DEFAULT_TEMPERATURE,
		})
	}
	createStream(systemPrompt, messages, metadata, requestOptions) {
		const { id: model, info } = this.getModel()
		// Centralized cap: clamp to 20% of the context window (unless provider-specific exceptions apply)
		const max_tokens =
			getModelMaxOutputTokens({
				modelId: model,
				model: info,
				settings: this.options,
				format: "openai",
			}) ?? undefined
		const temperature = this.options.modelTemperature ?? this.defaultTemperature
		const params = {
			model,
			max_tokens,
			temperature,
			messages: [{ role: "system", content: systemPrompt }, ...convertToOpenAiMessages(messages)],
			stream: true,
			stream_options: { include_usage: true },
		}
		// Add thinking parameter if reasoning is enabled and model supports it
		const { id: modelId, info: modelInfo } = this.getModel()
		if (this.options.enableReasoningEffort && modelInfo.supportsReasoningBinary) {
			params.thinking = { type: "enabled" }
		}
		try {
			return this.client.chat.completions.create(params, requestOptions)
		} catch (error) {
			throw handleOpenAIError(error, this.providerName)
		}
	}
	async completePrompt(prompt) {
		const { id: modelId } = this.getModel()
		const params = {
			model: modelId,
			messages: [{ role: "user", content: prompt }],
		}
		// Add thinking parameter if reasoning is enabled and model supports it
		const { info: modelInfo } = this.getModel()
		if (this.options.enableReasoningEffort && modelInfo.supportsReasoningBinary) {
			params.thinking = { type: "enabled" }
		}
		try {
			const response = await this.client.chat.completions.create(params)
			return response.choices[0]?.message.content || ""
		} catch (error) {
			throw handleOpenAIError(error, this.providerName)
		}
	}
}
//# sourceMappingURL=zai.js.map
