import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useState, useEffect } from "react";
import knuthShuffle from "knuth-shuffle-seeded";
import { Trans } from "react-i18next";
import { VSCodeButton, VSCodeLink } from "@vscode/webview-ui-toolkit/react";
import posthog from "posthog-js";
import { TelemetryEventName } from "@roo-code/types";
import { useExtensionState } from "@src/context/ExtensionStateContext";
import { validateApiConfiguration } from "@src/utils/validate";
import { vscode } from "@src/utils/vscode";
import { useAppTranslation } from "@src/i18n/TranslationContext";
import { getRequestyAuthUrl, getOpenRouterAuthUrl } from "@src/oauth/urls";
import { telemetryClient } from "@src/utils/TelemetryClient";
import ApiOptions from "../settings/ApiOptions";
import { Tab, TabContent } from "../common/Tab";
import RooHero from "./RooHero";
const WelcomeView = () => {
    const { apiConfiguration, currentApiConfigName, setApiConfiguration, uriScheme, machineId } = useExtensionState();
    const { t } = useAppTranslation();
    const [errorMessage, setErrorMessage] = useState(undefined);
    const [showRooProvider, setShowRooProvider] = useState(false);
    // Check PostHog feature flag for Roo provider
    useEffect(() => {
        posthog.onFeatureFlags(function () {
            setShowRooProvider(posthog?.getFeatureFlag("roo-provider-featured") === "test");
        });
    }, []);
    // Memoize the setApiConfigurationField function to pass to ApiOptions
    const setApiConfigurationFieldForApiOptions = useCallback((field, value) => {
        setApiConfiguration({ [field]: value });
    }, [setApiConfiguration]);
    const handleSubmit = useCallback(() => {
        const error = apiConfiguration ? validateApiConfiguration(apiConfiguration) : undefined;
        if (error) {
            setErrorMessage(error);
            return;
        }
        setErrorMessage(undefined);
        vscode.postMessage({ type: "upsertApiConfiguration", text: currentApiConfigName, apiConfiguration });
    }, [apiConfiguration, currentApiConfigName]);
    // Using a lazy initializer so it reads once at mount
    const [imagesBaseUri] = useState(() => {
        const w = window;
        return w.IMAGES_BASE_URI || "";
    });
    return (_jsxs(Tab, { children: [_jsxs(TabContent, { className: "flex flex-col gap-4 p-6", children: [_jsx(RooHero, {}), _jsx("h2", { className: "mt-0 mb-4 text-xl text-center", children: t("welcome:greeting") }), _jsxs("div", { className: "text-base text-vscode-foreground py-2 px-2 mb-4", children: [_jsx("p", { className: "mb-3 leading-relaxed", children: _jsx(Trans, { i18nKey: "welcome:introduction" }) }), _jsx("p", { className: "mb-0 leading-relaxed", children: _jsx(Trans, { i18nKey: "welcome:chooseProvider" }) })] }), _jsxs("div", { className: "mb-4", children: [_jsx("p", { className: "text-sm font-medium mt-4 mb-3", children: t("welcome:startRouter") }), _jsx("div", { children: (() => {
                                    // Provider card configuration
                                    const baseProviders = [
                                        {
                                            slug: "requesty",
                                            name: "Requesty",
                                            description: t("welcome:routers.requesty.description"),
                                            incentive: t("welcome:routers.requesty.incentive"),
                                            authUrl: getRequestyAuthUrl(uriScheme),
                                        },
                                        {
                                            slug: "openrouter",
                                            name: "OpenRouter",
                                            description: t("welcome:routers.openrouter.description"),
                                            authUrl: getOpenRouterAuthUrl(uriScheme),
                                        },
                                    ];
                                    // Conditionally add Roo provider based on feature flag
                                    const providers = showRooProvider
                                        ? [
                                            ...baseProviders,
                                            {
                                                slug: "roo",
                                                name: "Roo Code Cloud",
                                                description: t("welcome:routers.roo.description"),
                                                incentive: t("welcome:routers.roo.incentive"),
                                                authUrl: "#", // Placeholder since onClick handler will prevent default
                                            },
                                        ]
                                        : baseProviders;
                                    // Shuffle providers based on machine ID (will be consistent for the same machine)
                                    const orderedProviders = [...providers];
                                    knuthShuffle(orderedProviders, machineId || Date.now());
                                    // Render the provider cards
                                    return orderedProviders.map((provider, index) => (_jsxs("a", { href: provider.authUrl, className: "relative flex-1 border border-vscode-panel-border hover:bg-secondary rounded-md py-3 px-4 mb-2 flex flex-row gap-3 cursor-pointer transition-all no-underline text-inherit", target: "_blank", rel: "noopener noreferrer", onClick: (e) => {
                                            // Track telemetry for featured provider click
                                            telemetryClient.capture(TelemetryEventName.FEATURED_PROVIDER_CLICKED, {
                                                provider: provider.slug,
                                            });
                                            // Special handling for Roo provider
                                            if (provider.slug === "roo") {
                                                e.preventDefault();
                                                // Set the Roo provider configuration
                                                const rooConfig = {
                                                    apiProvider: "roo",
                                                };
                                                // Save the Roo provider configuration
                                                vscode.postMessage({
                                                    type: "upsertApiConfiguration",
                                                    text: currentApiConfigName,
                                                    apiConfiguration: rooConfig,
                                                });
                                                // Then trigger cloud sign-in
                                                vscode.postMessage({ type: "rooCloudSignIn" });
                                            }
                                            // For other providers, let the default link behavior work
                                        }, children: [provider.incentive && (_jsx("div", { className: "absolute top-0 right-0 text-[10px] text-vscode-badge-foreground bg-vscode-badge-background px-2 py-0.5 rounded-bl rounded-tr-md", children: provider.incentive })), _jsx("div", { className: "w-8 h-8 flex-shrink-0", children: _jsx("img", { src: `${imagesBaseUri}/${provider.slug}.png`, alt: provider.name, className: "w-full h-full object-contain" }) }), _jsxs("div", { children: [_jsx("div", { className: "text-sm font-medium text-vscode-foreground", children: provider.name }), _jsx("div", { className: "text-xs text-vscode-descriptionForeground", children: provider.description })] })] }, index)));
                                })() }), _jsx("p", { className: "text-sm font-medium mt-6 mb-3", children: t("welcome:startCustom") }), _jsx(ApiOptions, { fromWelcomeView: true, apiConfiguration: apiConfiguration || {}, uriScheme: uriScheme, setApiConfigurationField: setApiConfigurationFieldForApiOptions, errorMessage: errorMessage, setErrorMessage: setErrorMessage })] })] }), _jsx("div", { className: "sticky bottom-0 bg-vscode-sideBar-background p-4 border-t border-vscode-panel-border", children: _jsxs("div", { className: "flex flex-col gap-2", children: [_jsx("div", { className: "flex justify-end", children: _jsx(VSCodeLink, { href: "#", onClick: (e) => {
                                    e.preventDefault();
                                    vscode.postMessage({ type: "importSettings" });
                                }, className: "text-sm", children: t("welcome:importSettings") }) }), _jsx(VSCodeButton, { onClick: handleSubmit, appearance: "primary", children: t("welcome:start") }), errorMessage && _jsx("div", { className: "text-vscode-errorForeground", children: errorMessage })] }) })] }));
};
export default WelcomeView;
//# sourceMappingURL=WelcomeView.js.map