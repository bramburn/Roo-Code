import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime"
import { IconButton } from "./IconButton"
import { useRef, useEffect } from "react"
import { StandardTooltip } from "@/components/ui"
export function ZoomControls({
	zoomLevel,
	zoomInTitle,
	zoomOutTitle,
	useContinuousZoom = false,
	adjustZoom,
	zoomInStep = 0.1,
	zoomOutStep = -0.1,
	onZoomIn,
	onZoomOut,
}) {
	const zoomIntervalRef = useRef(null)
	/**
	 * Start continuous zoom on mouse down
	 */
	const startContinuousZoom = (amount) => {
		if (!useContinuousZoom || !adjustZoom) return
		// Clear any existing interval first
		if (zoomIntervalRef.current) {
			clearInterval(zoomIntervalRef.current)
		}
		// Immediately apply first zoom adjustment
		adjustZoom(amount)
		// Set up interval for continuous zooming
		zoomIntervalRef.current = setInterval(() => {
			adjustZoom(amount)
		}, 150) // Adjust every 150ms while button is held down
	}
	/**
	 * Stop continuous zoom on mouse up or mouse leave
	 */
	const stopContinuousZoom = () => {
		if (zoomIntervalRef.current) {
			clearInterval(zoomIntervalRef.current)
			zoomIntervalRef.current = null
		}
	}
	// Clean up interval on unmount
	useEffect(() => {
		return () => {
			if (zoomIntervalRef.current) {
				clearInterval(zoomIntervalRef.current)
			}
		}
	}, [])
	return _jsxs("div", {
		className: "flex items-center gap-2",
		children: [
			_jsx(StandardTooltip, {
				content: zoomOutTitle,
				children: _jsx(IconButton, {
					icon: "zoom-out",
					onClick: !useContinuousZoom ? onZoomOut || (() => adjustZoom?.(zoomOutStep)) : undefined,
					onMouseDown: useContinuousZoom && adjustZoom ? () => startContinuousZoom(zoomOutStep) : undefined,
					onMouseUp: useContinuousZoom && adjustZoom ? stopContinuousZoom : undefined,
					onMouseLeave: useContinuousZoom && adjustZoom ? stopContinuousZoom : undefined,
				}),
			}),
			_jsxs("div", {
				className: "text-sm text-vscode-editor-foreground min-w-[50px] text-center",
				children: [Math.round(zoomLevel * 100), "%"],
			}),
			_jsx(StandardTooltip, {
				content: zoomInTitle,
				children: _jsx(IconButton, {
					icon: "zoom-in",
					onClick: !useContinuousZoom ? onZoomIn || (() => adjustZoom?.(zoomInStep)) : undefined,
					onMouseDown: useContinuousZoom && adjustZoom ? () => startContinuousZoom(zoomInStep) : undefined,
					onMouseUp: useContinuousZoom && adjustZoom ? stopContinuousZoom : undefined,
					onMouseLeave: useContinuousZoom && adjustZoom ? stopContinuousZoom : undefined,
				}),
			}),
		],
	})
}
//# sourceMappingURL=ZoomControls.js.map
