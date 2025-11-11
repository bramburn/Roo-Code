import { minimaxDefaultModelId, minimaxModels } from "@roo-code/types"
import { BaseOpenAiCompatibleProvider } from "./base-openai-compatible-provider"
export class MiniMaxHandler extends BaseOpenAiCompatibleProvider {
	constructor(options) {
		super({
			...options,
			providerName: "MiniMax",
			baseURL: options.minimaxBaseUrl ?? "https://api.minimax.io/v1",
			apiKey: options.minimaxApiKey,
			defaultProviderModelId: minimaxDefaultModelId,
			providerModels: minimaxModels,
			defaultTemperature: 1.0,
		})
	}
}
//# sourceMappingURL=minimax.js.map
