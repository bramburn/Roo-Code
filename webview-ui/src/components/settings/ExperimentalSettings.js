import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { FlaskConical } from "lucide-react";
import { EXPERIMENT_IDS, experimentConfigsMap } from "@roo/experiments";
import { useAppTranslation } from "@src/i18n/TranslationContext";
import { cn } from "@src/lib/utils";
import { SectionHeader } from "./SectionHeader";
import { Section } from "./Section";
import { ExperimentalFeature } from "./ExperimentalFeature";
import { ImageGenerationSettings } from "./ImageGenerationSettings";
export const ExperimentalSettings = ({ experiments, setExperimentEnabled, apiConfiguration, setApiConfigurationField, openRouterImageApiKey, openRouterImageGenerationSelectedModel, setOpenRouterImageApiKey, setImageGenerationSelectedModel, className, ...props }) => {
    const { t } = useAppTranslation();
    return (_jsxs("div", { className: cn("flex flex-col gap-2", className), ...props, children: [_jsx(SectionHeader, { children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(FlaskConical, { className: "w-4" }), _jsx("div", { children: t("settings:sections.experimental") })] }) }), _jsx(Section, { children: Object.entries(experimentConfigsMap)
                    .filter(([key]) => key in EXPERIMENT_IDS)
                    .map((config) => {
                    if (config[0] === "MULTI_FILE_APPLY_DIFF") {
                        return (_jsx(ExperimentalFeature, { experimentKey: config[0], enabled: experiments[EXPERIMENT_IDS.MULTI_FILE_APPLY_DIFF] ?? false, onChange: (enabled) => setExperimentEnabled(EXPERIMENT_IDS.MULTI_FILE_APPLY_DIFF, enabled) }, config[0]));
                    }
                    if (config[0] === "IMAGE_GENERATION" &&
                        setOpenRouterImageApiKey &&
                        setImageGenerationSelectedModel) {
                        return (_jsx(ImageGenerationSettings, { enabled: experiments[EXPERIMENT_IDS.IMAGE_GENERATION] ?? false, onChange: (enabled) => setExperimentEnabled(EXPERIMENT_IDS.IMAGE_GENERATION, enabled), openRouterImageApiKey: openRouterImageApiKey, openRouterImageGenerationSelectedModel: openRouterImageGenerationSelectedModel, setOpenRouterImageApiKey: setOpenRouterImageApiKey, setImageGenerationSelectedModel: setImageGenerationSelectedModel }, config[0]));
                    }
                    return (_jsx(ExperimentalFeature, { experimentKey: config[0], enabled: experiments[EXPERIMENT_IDS[config[0]]] ?? false, onChange: (enabled) => setExperimentEnabled(EXPERIMENT_IDS[config[0]], enabled) }, config[0]));
                }) })] }));
};
//# sourceMappingURL=ExperimentalSettings.js.map