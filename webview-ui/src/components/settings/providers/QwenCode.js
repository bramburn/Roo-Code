import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { VSCodeTextField, VSCodeLink } from "@vscode/webview-ui-toolkit/react";
export const QwenCode = ({ apiConfiguration, setApiConfigurationField }) => {
    const defaultPath = "~/.qwen/oauth_creds.json";
    const handleInputChange = (e) => {
        const element = e.target;
        setApiConfigurationField("qwenCodeOauthPath", element.value);
    };
    const handleBlur = (e) => {
        const element = e.target;
        // If the field is empty on blur, set it to the default value
        if (!element.value || element.value.trim() === "") {
            setApiConfigurationField("qwenCodeOauthPath", defaultPath);
        }
    };
    return (_jsx("div", { className: "flex flex-col gap-4", children: _jsxs("div", { children: [_jsx(VSCodeTextField, { value: apiConfiguration?.qwenCodeOauthPath || "", className: "w-full mt-1", type: "text", onInput: handleInputChange, onBlur: handleBlur, placeholder: defaultPath, children: "OAuth Credentials Path" }), _jsx("p", { className: "text-xs mt-1 text-vscode-descriptionForeground", children: "Path to your Qwen OAuth credentials file. Defaults to ~/.qwen/oauth_creds.json if left empty." }), _jsx("div", { className: "text-xs text-vscode-descriptionForeground mt-3", children: "Qwen Code is an OAuth-based API that requires authentication through the official Qwen client. You'll need to set up OAuth credentials first." }), _jsxs("div", { className: "text-xs text-vscode-descriptionForeground mt-2", children: ["To get started:", _jsx("br", {}), "1. Install the official Qwen client", _jsx("br", {}), "2. Authenticate using your account", _jsx("br", {}), "3. OAuth credentials will be stored automatically"] }), _jsx(VSCodeLink, { href: "https://github.com/QwenLM/qwen-code/blob/main/README.md", className: "text-vscode-textLink-foreground mt-2 inline-block text-xs", children: "Setup Instructions" })] }) }));
};
//# sourceMappingURL=QwenCode.js.map