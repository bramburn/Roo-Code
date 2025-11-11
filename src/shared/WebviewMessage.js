import { z } from "zod"
import { marketplaceItemSchema } from "@roo-code/types"
export const checkoutDiffPayloadSchema = z.object({
	ts: z.number().optional(),
	previousCommitHash: z.string().optional(),
	commitHash: z.string(),
	mode: z.enum(["full", "checkpoint", "from-init", "to-current"]),
})
export const checkoutRestorePayloadSchema = z.object({
	ts: z.number(),
	commitHash: z.string(),
	mode: z.enum(["preview", "restore"]),
})
export const installMarketplaceItemWithParametersPayloadSchema = z.object({
	item: marketplaceItemSchema,
	parameters: z.record(z.string(), z.any()),
})
//# sourceMappingURL=WebviewMessage.js.map
