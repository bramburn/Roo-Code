import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { Component } from "react";
import { telemetryClient } from "@src/utils/TelemetryClient";
import { withTranslation } from "react-i18next";
import { enhanceErrorWithSourceMaps } from "@src/utils/sourceMapUtils";
class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = {};
    }
    static getDerivedStateFromError(error) {
        let errorMessage = "";
        if (error instanceof Error) {
            errorMessage = error.stack ?? error.message;
        }
        else {
            errorMessage = `${error}`;
        }
        return {
            error: errorMessage,
            timestamp: Date.now(),
        };
    }
    async componentDidCatch(error, errorInfo) {
        const componentStack = errorInfo.componentStack || "";
        const enhancedError = await enhanceErrorWithSourceMaps(error, componentStack);
        telemetryClient.capture("error_boundary_caught_error", {
            error: enhancedError.message,
            stack: enhancedError.sourceMappedStack || enhancedError.stack,
            componentStack: enhancedError.sourceMappedComponentStack || componentStack,
            timestamp: Date.now(),
            errorType: enhancedError.name,
        });
        this.setState({
            error: enhancedError.sourceMappedStack || enhancedError.stack,
            componentStack: enhancedError.sourceMappedComponentStack || componentStack,
        });
    }
    render() {
        const { t } = this.props;
        if (!this.state.error) {
            return this.props.children;
        }
        const errorDisplay = this.state.error;
        const componentStackDisplay = this.state.componentStack;
        const version = process.env.PKG_VERSION || "unknown";
        return (_jsxs("div", { children: [_jsxs("h2", { className: "text-lg font-bold mt-0 mb-2", children: [t("errorBoundary.title"), " (v", version, ")"] }), _jsxs("p", { className: "mb-4", children: [t("errorBoundary.reportText"), " ", _jsx("a", { href: "https://github.com/RooCodeInc/Roo-Code/issues", target: "_blank", rel: "noreferrer", children: t("errorBoundary.githubText") })] }), _jsx("p", { className: "mb-2", children: t("errorBoundary.copyInstructions") }), _jsxs("div", { className: "mb-4", children: [_jsx("h3", { className: "text-md font-bold mb-1", children: t("errorBoundary.errorStack") }), _jsx("pre", { className: "p-2 border rounded text-sm overflow-auto", children: errorDisplay })] }), componentStackDisplay && (_jsxs("div", { children: [_jsx("h3", { className: "text-md font-bold mb-1", children: t("errorBoundary.componentStack") }), _jsx("pre", { className: "p-2 border rounded text-sm overflow-auto", children: componentStackDisplay })] }))] }));
    }
}
export default withTranslation("common")(ErrorBoundary);
//# sourceMappingURL=ErrorBoundary.js.map