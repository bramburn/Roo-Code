export const EXPERIMENT_IDS = {
	MULTI_FILE_APPLY_DIFF: "multiFileApplyDiff",
	POWER_STEERING: "powerSteering",
	PREVENT_FOCUS_DISRUPTION: "preventFocusDisruption",
	IMAGE_GENERATION: "imageGeneration",
	RUN_SLASH_COMMAND: "runSlashCommand",
}
export const experimentConfigsMap = {
	MULTI_FILE_APPLY_DIFF: { enabled: false },
	POWER_STEERING: { enabled: false },
	PREVENT_FOCUS_DISRUPTION: { enabled: false },
	IMAGE_GENERATION: { enabled: false },
	RUN_SLASH_COMMAND: { enabled: false },
}
export const experimentDefault = Object.fromEntries(
	Object.entries(experimentConfigsMap).map(([_, config]) => [EXPERIMENT_IDS[_], config.enabled]),
)
export const experiments = {
	get: (id) => experimentConfigsMap[id],
	isEnabled: (experimentsConfig, id) => experimentsConfig[id] ?? experimentDefault[id],
}
//# sourceMappingURL=experiments.js.map
