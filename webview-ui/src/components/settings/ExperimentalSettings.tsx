import { HTMLAttributes, useCallback } from "react"
import { useAppTranslation } from "@/i18n/TranslationContext"
import { FlaskConical } from "lucide-react"

import { EXPERIMENT_IDS, experimentConfigsMap, ExperimentId } from "../../../../src/shared/experiments"
import { ApiConfiguration } from "../../../../src/shared/api"

import { cn } from "@/lib/utils"

import { SetCachedStateField, SetExperimentEnabled } from "./types"
import { SectionHeader } from "./SectionHeader"
import { Section } from "./Section"
import { ExperimentalFeature } from "./ExperimentalFeature"
import { AiCommitSettings } from "./AiCommitSettings"

type ExperimentalSettingsProps = HTMLAttributes<HTMLDivElement> & {
	setCachedStateField: SetCachedStateField<
		| "rateLimitSeconds"
		| "terminalOutputLineLimit"
		| "maxOpenTabsContext"
		| "diffEnabled"
		| "fuzzyMatchThreshold"
		| "useSecondaryModelForCommit"
		| "commitModelConfiguration"
	>
	experiments: Record<ExperimentId, boolean>
	setExperimentEnabled: SetExperimentEnabled
	useSecondaryModelForCommit: boolean
	commitModelConfiguration: ApiConfiguration | null
	setChangeDetected: (detected: boolean) => void
}

export const ExperimentalSettings = ({
	setCachedStateField,
	experiments,
	setExperimentEnabled,
	useSecondaryModelForCommit,
	commitModelConfiguration,
	setChangeDetected,
	className,
	...props
}: ExperimentalSettingsProps) => {
	const { t } = useAppTranslation()

	// Handle changes to useSecondaryModelForCommit
	const handleUseSecondaryModelChange = useCallback((value: boolean) => {
		setCachedStateField("useSecondaryModelForCommit", value)
	}, [setCachedStateField])

	// Handle changes to commitModelConfiguration
	const handleCommitModelConfigChange = useCallback((config: ApiConfiguration) => {
		setCachedStateField("commitModelConfiguration", config)
	}, [setCachedStateField])

	return (
		<div className={cn("flex flex-col gap-2", className)} {...props}>
			<SectionHeader>
				<div className="flex items-center gap-2">
					<FlaskConical className="w-4" />
					<div>{t("settings:sections.experimental")}</div>
				</div>
			</SectionHeader>

			<Section>
				{Object.entries(experimentConfigsMap)
					.filter((config) => config[0] !== "DIFF_STRATEGY" && config[0] !== "MULTI_SEARCH_AND_REPLACE")
					.map((config) => (
						<ExperimentalFeature
							key={config[0]}
							experimentKey={config[0]}
							enabled={experiments[EXPERIMENT_IDS[config[0] as keyof typeof EXPERIMENT_IDS]] ?? false}
							onChange={(enabled) =>
								setExperimentEnabled(EXPERIMENT_IDS[config[0] as keyof typeof EXPERIMENT_IDS], enabled)
							}
						/>
					))}
			</Section>

			<AiCommitSettings
				useSecondaryModelForCommit={useSecondaryModelForCommit}
				commitModelConfiguration={commitModelConfiguration}
				onUseSecondaryModelChange={handleUseSecondaryModelChange}
				onCommitModelConfigChange={handleCommitModelConfigChange}
				setChangeDetected={setChangeDetected}
			/>
		</div>
	)
}
