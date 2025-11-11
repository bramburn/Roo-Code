import OpenAI from "openai"
import { getModelMaxOutputTokens } from "../../shared/api"
import { XmlMatcher } from "../../utils/xml-matcher"
import { convertToOpenAiMessages } from "../transform/openai-format"
import { DEFAULT_HEADERS } from "./constants"
import { BaseProvider } from "./base-provider"
import { handleOpenAIError } from "./utils/openai-error-handler"
export class BaseOpenAiCompatibleProvider extends BaseProvider {
	providerName
	baseURL
	defaultTemperature
	defaultProviderModelId
	providerModels
	options
	client
	constructor({ providerName, baseURL, defaultProviderModelId, providerModels, defaultTemperature, ...options }) {
		super()
		this.providerName = providerName
		this.baseURL = baseURL
		this.defaultProviderModelId = defaultProviderModelId
		this.providerModels = providerModels
		this.defaultTemperature = defaultTemperature ?? 0
		this.options = options
		if (!this.options.apiKey) {
			throw new Error("API key is required")
		}
		this.client = new OpenAI({
			baseURL,
			apiKey: this.options.apiKey,
			defaultHeaders: DEFAULT_HEADERS,
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
		try {
			return this.client.chat.completions.create(params, requestOptions)
		} catch (error) {
			throw handleOpenAIError(error, this.providerName)
		}
	}
	async *createMessage(systemPrompt, messages, metadata) {
		const stream = await this.createStream(systemPrompt, messages, metadata)
		const matcher = new XmlMatcher("think", (chunk) => ({
			type: chunk.matched ? "reasoning" : "text",
			text: chunk.data,
		}))
		for await (const chunk of stream) {
			const delta = chunk.choices[0]?.delta
			if (delta?.content) {
				for (const processedChunk of matcher.update(delta.content)) {
					yield processedChunk
				}
			}
			if (delta && "reasoning_content" in delta) {
				const reasoning_content = delta.reasoning_content || ""
				if (reasoning_content?.trim()) {
					yield { type: "reasoning", text: reasoning_content }
				}
			}
			if (chunk.usage) {
				yield {
					type: "usage",
					inputTokens: chunk.usage.prompt_tokens || 0,
					outputTokens: chunk.usage.completion_tokens || 0,
				}
			}
		}
		// Process any remaining content
		for (const processedChunk of matcher.final()) {
			yield processedChunk
		}
	}
	async completePrompt(prompt) {
		const { id: modelId } = this.getModel()
		try {
			const response = await this.client.chat.completions.create({
				model: modelId,
				messages: [{ role: "user", content: prompt }],
			})
			return response.choices[0]?.message.content || ""
		} catch (error) {
			throw handleOpenAIError(error, this.providerName)
		}
	}
	getModel() {
		const id =
			this.options.apiModelId && this.options.apiModelId in this.providerModels
				? this.options.apiModelId
				: this.defaultProviderModelId
		return { id, info: this.providerModels[id] }
	}
}
//# sourceMappingURL=base-openai-compatible-provider.js.map
