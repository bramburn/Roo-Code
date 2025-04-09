import { HTMLAttributes, useCallback } from "react"
import { useAppTranslation } from "@/i18n/TranslationContext"
import { VSCodeCheckbox } from "@vscode/webview-ui-toolkit/react"

import { useExtensionState } from "@/context/ExtensionStateContext"
import { cn } from "@/lib/utils"
import { ApiConfiguration, ApiProvider } from "../../../../src/shared/api"

import { SectionHeader } from "./SectionHeader"
import { Section } from "./Section"
import ApiOptions from "./ApiOptions"

type AiCommitSettingsProps = HTMLAttributes<HTMLDivElement> & {
  useSecondaryModelForCommit: boolean
  commitModelConfiguration: ApiConfiguration | null
  onUseSecondaryModelChange: (value: boolean) => void
  onCommitModelConfigChange: (config: ApiConfiguration) => void
  setChangeDetected: (detected: boolean) => void
}

export const AiCommitSettings = ({
  useSecondaryModelForCommit,
  commitModelConfiguration,
  onUseSecondaryModelChange,
  onCommitModelConfigChange,
  setChangeDetected,
  className,
  ...props
}: AiCommitSettingsProps) => {
  const { t } = useAppTranslation()
  const { apiConfiguration } = useExtensionState()

  // Handle checkbox change
  const handleCheckboxChange = useCallback((e: any) => {
    const isChecked = e.target.checked
    onUseSecondaryModelChange(isChecked)
    setChangeDetected(true)
  }, [onUseSecondaryModelChange, setChangeDetected])

  // Handle API configuration field changes
  const handleApiConfigFieldChange = useCallback((field: string, value: any) => {
    // Create a complete updated configuration object
    const updatedConfig = {
      ...(commitModelConfiguration || {}),
      [field]: value,
      // Ensure apiProvider is always set
      apiProvider: (commitModelConfiguration?.apiProvider || value?.apiProvider || 'anthropic' as ApiProvider)
    }

    onCommitModelConfigChange(updatedConfig)
    setChangeDetected(true)
  }, [commitModelConfiguration, onCommitModelConfigChange, setChangeDetected])

  return (
    <div className={cn("flex flex-col gap-2", className)} {...props}>
      <SectionHeader>
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <line x1="3" y1="12" x2="9" y2="12"></line>
            <line x1="15" y1="12" x2="21" y2="12"></line>
          </svg>
          <div>{t("settings:sections.aiCommit")}</div>
        </div>
      </SectionHeader>

      <Section>
        <div>
          <VSCodeCheckbox
            checked={useSecondaryModelForCommit}
            onChange={handleCheckboxChange}>
            <span className="font-medium">{t("settings:aiCommit.useSecondaryModel")}</span>
          </VSCodeCheckbox>
          <p className="text-vscode-descriptionForeground text-sm mt-0">
            {t("settings:aiCommit.description")}
          </p>
        </div>

        {useSecondaryModelForCommit && (
          <ApiOptions
            apiConfiguration={commitModelConfiguration || apiConfiguration || {apiProvider: 'anthropic'}}
            setApiConfigurationField={handleApiConfigFieldChange}
            uriScheme="vscode"
            errorMessage=""
            setErrorMessage={() => {}} // No-op since we don't need error handling for commit settings
          />
        )}
      </Section>
    </div>
  )
}


