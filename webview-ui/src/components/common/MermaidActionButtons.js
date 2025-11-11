import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime"
import { useAppTranslation } from "@src/i18n/TranslationContext"
import { IconButton } from "./IconButton"
import { ZoomControls } from "./ZoomControls"
import { StandardTooltip } from "@/components/ui"
export const MermaidActionButtons = ({
	onZoom,
	onZoomIn,
	onZoomOut,
	onCopy,
	onSave,
	onViewCode,
	onClose,
	copyFeedback,
	showZoomControls = false,
	zoomLevel,
}) => {
	const { t } = useAppTranslation()
	if (showZoomControls && onZoomOut && onZoomIn && zoomLevel !== undefined) {
		return _jsxs(_Fragment, {
			children: [
				_jsx(ZoomControls, {
					zoomLevel: zoomLevel,
					onZoomIn: onZoomIn,
					onZoomOut: onZoomOut,
					zoomInTitle: t("common:mermaid.buttons.zoomIn"),
					zoomOutTitle: t("common:mermaid.buttons.zoomOut"),
				}),
				_jsx(StandardTooltip, {
					content: t("common:mermaid.buttons.viewCode"),
					children: _jsx(IconButton, {
						icon: "code",
						onClick: (e) => {
							e.stopPropagation()
							onViewCode()
						},
					}),
				}),
				_jsx(StandardTooltip, {
					content: t("common:mermaid.buttons.copy"),
					children: _jsx(IconButton, { icon: copyFeedback ? "check" : "copy", onClick: onCopy }),
				}),
			],
		})
	}
	return _jsxs(_Fragment, {
		children: [
			onZoom &&
				_jsx(StandardTooltip, {
					content: t("common:mermaid.buttons.zoom"),
					children: _jsx(IconButton, { icon: "zoom-in", onClick: onZoom }),
				}),
			_jsx(StandardTooltip, {
				content: t("common:mermaid.buttons.viewCode"),
				children: _jsx(IconButton, {
					icon: "code",
					onClick: (e) => {
						e.stopPropagation()
						onViewCode()
					},
				}),
			}),
			_jsx(StandardTooltip, {
				content: t("common:mermaid.buttons.copy"),
				children: _jsx(IconButton, { icon: copyFeedback ? "check" : "copy", onClick: onCopy }),
			}),
			onSave &&
				_jsx(StandardTooltip, {
					content: t("common:mermaid.buttons.save"),
					children: _jsx(IconButton, { icon: "save", onClick: onSave }),
				}),
			onClose &&
				_jsx(StandardTooltip, {
					content: t("common:mermaid.buttons.close"),
					children: _jsx(IconButton, { icon: "close", onClick: onClose }),
				}),
		],
	})
}
//# sourceMappingURL=MermaidActionButtons.js.map
