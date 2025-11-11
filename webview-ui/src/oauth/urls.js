import { Package } from "@roo/package";
export function getCallbackUrl(provider, uriScheme) {
    return encodeURIComponent(`${uriScheme || "vscode"}://${Package.publisher}.${Package.name}/${provider}`);
}
export function getGlamaAuthUrl(uriScheme) {
    return `https://glama.ai/oauth/authorize?callback_url=${getCallbackUrl("glama", uriScheme)}`;
}
export function getOpenRouterAuthUrl(uriScheme) {
    return `https://openrouter.ai/auth?callback_url=${getCallbackUrl("openrouter", uriScheme)}`;
}
export function getRequestyAuthUrl(uriScheme) {
    return `https://app.requesty.ai/oauth/authorize?callback_url=${getCallbackUrl("requesty", uriScheme)}`;
}
//# sourceMappingURL=urls.js.map