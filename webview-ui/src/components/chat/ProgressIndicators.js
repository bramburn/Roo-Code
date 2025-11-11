import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime"
import { useState, useEffect, useRef } from "react"
/**
 * Enhanced Progress Indicators Component
 * Provides multiple types of animated progress indicators with accessibility support
 */
export const ProgressIndicator = ({
	type,
	state,
	value = 0,
	max = 100,
	label,
	description,
	showPercentage = true,
	showTimeRemaining = false,
	estimatedTime,
	size = "medium",
	color,
	backgroundColor,
	animated = true,
	accessible = true,
	className = "",
}) => {
	const [animatedValue, setAnimatedValue] = useState(0)
	const [timeRemaining, setTimeRemaining] = useState(estimatedTime || 0)
	const startTimeRef = useRef(Date.now())
	const animationRef = useRef()
	// Animate progress value
	useEffect(() => {
		if (animated && state !== "idle") {
			const targetValue = Math.min(100, Math.max(0, (value / max) * 100))
			const duration = 500 // Animation duration in ms
			const startTime = Date.now()
			const animate = () => {
				const elapsed = Date.now() - startTime
				const progress = Math.min(elapsed / duration, 1)
				// Easing function for smooth animation
				const easeOutQuart = 1 - Math.pow(1 - progress, 4)
				setAnimatedValue(targetValue * easeOutQuart)
				if (progress < 1) {
					animationRef.current = requestAnimationFrame(animate)
				}
			}
			animationRef.current = requestAnimationFrame(animate)
			return () => {
				if (animationRef.current) {
					cancelAnimationFrame(animationRef.current)
				}
			}
		} else {
			setAnimatedValue((value / max) * 100)
		}
	}, [value, max, animated, state])
	// Update time remaining
	useEffect(() => {
		if (showTimeRemaining && estimatedTime && state === "processing") {
			const interval = setInterval(() => {
				const elapsed = Date.now() - startTimeRef.current
				const remaining = Math.max(0, estimatedTime - elapsed)
				setTimeRemaining(remaining)
				if (remaining === 0) {
					clearInterval(interval)
				}
			}, 100)
			return () => clearInterval(interval)
		}
	}, [showTimeRemaining, estimatedTime, state])
	// Get size classes
	const getSizeClasses = () => {
		switch (size) {
			case "small":
				return "w-4 h-4"
			case "large":
				return "w-12 h-12"
			default:
				return "w-8 h-8"
		}
	}
	// Get state colors
	const getStateColors = () => {
		switch (state) {
			case "success":
				return {
					bg: "bg-green-500",
					text: "text-green-500",
					border: "border-green-500",
					bgLight: "bg-green-500/10",
				}
			case "error":
				return {
					bg: "bg-red-500",
					text: "text-red-500",
					border: "border-red-500",
					bgLight: "bg-red-500/10",
				}
			case "warning":
				return {
					bg: "bg-yellow-500",
					text: "text-yellow-500",
					border: "border-yellow-500",
					bgLight: "bg-yellow-500/10",
				}
			case "paused":
				return {
					bg: "bg-gray-500",
					text: "text-gray-500",
					border: "border-gray-500",
					bgLight: "bg-gray-500/10",
				}
			default:
				return {
					bg: color || "bg-blue-500",
					text: color || "text-blue-500",
					border: color || "border-blue-500",
					bgLight: `${color || "bg-blue-500"}/10`,
				}
		}
	}
	const colors = getStateColors()
	// Format time
	const formatTime = (ms) => {
		if (ms < 1000) return "< 1s"
		const seconds = Math.floor(ms / 1000)
		if (seconds < 60) return `${seconds}s`
		const minutes = Math.floor(seconds / 60)
		const remainingSeconds = seconds % 60
		return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
	}
	// Render different progress types
	const renderProgressIndicator = () => {
		switch (type) {
			case "linear":
				return _jsx(LinearProgress, { animatedValue, colors, backgroundColor })
			case "circular":
				return _jsx(CircularProgress, { animatedValue, colors, getSizeClasses })
			case "dots":
				return _jsx(DotsProgress, { state, colors, getSizeClasses })
			case "pulse":
				return _jsx(PulseProgress, { state, colors, getSizeClasses })
			case "wave":
				return _jsx(WaveProgress, { animatedValue, colors })
			case "spiral":
				return _jsx(SpiralProgress, { animatedValue, colors, getSizeClasses })
			case "segments":
				return _jsx(SegmentsProgress, { animatedValue, colors, size })
			default:
				return _jsx(LinearProgress, { animatedValue, colors, backgroundColor })
		}
	}
	// Accessibility attributes
	const accessibilityProps = accessible
		? {
				role: "progressbar",
				"aria-valuenow": Math.round(animatedValue),
				"aria-valuemin": 0,
				"aria-valuemax": 100,
				"aria-label": label || "Progress indicator",
				"aria-describedby": description ? "progress-description" : undefined,
			}
		: {}
	return _jsxs("div", {
		className: `flex flex-col items-center space-y-2 ${className}`,
		...accessibilityProps,
		children: [
			renderProgressIndicator(),
			(label || showPercentage || (showTimeRemaining && timeRemaining > 0)) &&
				_jsxs("div", {
					className: "text-center space-y-1",
					children: [
						label && _jsx("div", { className: `text-sm font-medium ${colors.text}`, children: label }),
						showPercentage &&
							_jsxs("div", {
								className: "text-lg font-mono font-bold text-vscode-foreground",
								children: [Math.round(animatedValue), "%"],
							}),
						showTimeRemaining &&
							timeRemaining > 0 &&
							_jsxs("div", {
								className: "text-sm text-vscode-descriptionForeground",
								children: [formatTime(timeRemaining), " remaining"],
							}),
						description &&
							_jsx("div", {
								id: "progress-description",
								className: "text-xs text-vscode-descriptionForeground",
								children: description,
							}),
					],
				}),
		],
	})
}
/**
 * Linear Progress Bar
 */
const LinearProgress = ({ animatedValue, colors, backgroundColor }) =>
	_jsx("div", {
		className: `w-full h-2 ${backgroundColor || "bg-gray-200"} rounded-full overflow-hidden relative`,
		children: _jsxs("div", {
			className: `h-full rounded-full transition-all duration-500 ease-out relative ${colors.bg}`,
			style: { width: `${animatedValue}%` },
			children: [
				_jsx("div", {
					className:
						"absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse",
				}),
				animatedValue === 0 &&
					_jsx("div", {
						className:
							"absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse",
					}),
			],
		}),
	})
/**
 * Circular Progress Indicator
 */
const CircularProgress = ({ animatedValue, colors, getSizeClasses }) => {
	const radius = 16
	const circumference = 2 * Math.PI * radius
	const strokeDashoffset = circumference - (animatedValue / 100) * circumference
	return _jsx("div", {
		className: "relative",
		children: _jsxs("svg", {
			className: `transform -rotate-90 ${getSizeClasses()}`,
			width: "64",
			height: "64",
			viewBox: "0 0 64 64",
			children: [
				_jsx("circle", {
					cx: "32",
					cy: "32",
					r: radius,
					stroke: "currentColor",
					strokeWidth: "4",
					fill: "none",
					className: "text-gray-200",
				}),
				_jsx("circle", {
					cx: "32",
					cy: "32",
					r: radius,
					stroke: "currentColor",
					strokeWidth: "4",
					fill: "none",
					strokeDasharray: circumference,
					strokeDashoffset: strokeDashoffset,
					className: `${colors.text} transition-all duration-500 ease-out`,
					strokeLinecap: "round",
				}),
			],
		}),
	})
}
/**
 * Dots Progress Indicator
 */
const DotsProgress = ({ state, colors, getSizeClasses }) =>
	_jsx("div", {
		className: "flex space-x-2",
		children: [0, 1, 2].map((index) =>
			_jsx(
				"div",
				{
					className: `${getSizeClasses()} rounded-full ${colors.bg} transition-all duration-300`,
					style: {
						animationDelay: `${index * 150}ms`,
						animation: state === "processing" ? "pulse 1.5s ease-in-out infinite" : "none",
					},
				},
				index,
			),
		),
	})
/**
 * Pulse Progress Indicator
 */
const PulseProgress = ({ state, colors, getSizeClasses }) =>
	_jsxs("div", {
		className: "relative",
		children: [
			_jsx("div", {
				className: `${getSizeClasses()} rounded-full ${colors.bg} transition-all duration-300`,
				style: {
					animation: state === "processing" ? "pulse 2s ease-in-out infinite" : "none",
				},
			}),
			state === "processing" &&
				_jsx("div", {
					className: `absolute inset-0 rounded-full ${colors.bg} opacity-50`,
					style: {
						animation: "ping 2s ease-in-out infinite",
					},
				}),
		],
	})
/**
 * Wave Progress Indicator
 */
const WaveProgress = ({ animatedValue, colors }) =>
	_jsx("div", {
		className: "relative w-16 h-16 overflow-hidden rounded-full border-2 border-gray-200",
		children: _jsx("div", {
			className: `absolute bottom-0 left-0 right-0 ${colors.bg} transition-all duration-500 ease-out`,
			style: {
				height: `${animatedValue}%`,
				background: `linear-gradient(to top, ${colors.bg.replace("bg-", "rgb(var(--tw-")}) 0%, transparent 100%)`,
			},
			children: _jsx("div", {
				className: "absolute top-0 left-0 right-0 h-2 bg-white/30",
				style: {
					animation: "wave 2s ease-in-out infinite",
					transform: "translateY(-50%)",
				},
			}),
		}),
	})
/**
 * Spiral Progress Indicator
 */
const SpiralProgress = ({ animatedValue, colors, getSizeClasses }) =>
	_jsx("div", {
		className: "relative",
		children: _jsxs("svg", {
			className: `${getSizeClasses()}`,
			width: "64",
			height: "64",
			viewBox: "0 0 64 64",
			children: [
				_jsx("defs", {
					children: _jsx("path", {
						id: "spiral",
						d: "M 32 32 m -20 0 a 20 20 0 1 1 40 0 a 16 16 0 1 1 -32 0 a 12 12 0 1 1 24 0 a 8 8 0 1 1 -16 0 a 4 4 0 1 1 8 0",
						fill: "none",
						stroke: "currentColor",
						strokeWidth: "2",
						className: "text-gray-200",
					}),
				}),
				_jsx("use", { href: "#spiral", className: "text-gray-200" }),
				_jsx("use", {
					href: "#spiral",
					className: `${colors.text} transition-all duration-500 ease-out`,
					style: {
						strokeDasharray: "100",
						strokeDashoffset: `${100 - animatedValue}`,
					},
				}),
			],
		}),
	})
/**
 * Segments Progress Indicator
 */
const SegmentsProgress = ({ animatedValue, colors, size }) => {
	const segmentCount = 8
	const filledSegments = Math.floor((animatedValue / 100) * segmentCount)
	const sizeClasses = {
		small: "w-2 h-2",
		medium: "w-3 h-3",
		large: "w-4 h-4",
	}[size]
	return _jsx("div", {
		className: "flex flex-wrap gap-1 max-w-xs",
		children: Array.from({ length: segmentCount }, (_, index) =>
			_jsx(
				"div",
				{
					className: `${sizeClasses} rounded-sm transition-all duration-300 ${index < filledSegments ? colors.bg : "bg-gray-200"}`,
					style: {
						animationDelay: `${index * 50}ms`,
						animation: index < filledSegments ? "fadeIn 0.5s ease-out" : "none",
					},
				},
				index,
			),
		),
	})
}
export const MultiStageProgress = ({ stages, currentStage, showProgress = true }) => {
	const progressPercentage = ((currentStage + 1) / stages.length) * 100
	return _jsxs("div", {
		className: "w-full space-y-4",
		children: [
			showProgress &&
				_jsx("div", {
					className: "w-full bg-gray-200 rounded-full h-2 overflow-hidden",
					children: _jsx("div", {
						className: "bg-blue-500 h-full rounded-full transition-all duration-500 ease-out",
						style: { width: `${progressPercentage}%` },
					}),
				}),
			_jsx("div", {
				className: "space-y-2",
				children: stages.map((stage, index) => {
					const isActive = index === currentStage
					const isCompleted = index < currentStage
					const hasError = stage.status === "error"
					return _jsxs(
						"div",
						{
							className: `flex items-center space-x-3 p-3 rounded-lg border transition-all duration-200 ${isActive ? "border-blue-500 bg-blue-500/10" : "border-gray-200"} ${hasError ? "border-red-500 bg-red-500/10" : ""}`,
							children: [
								_jsx("div", {
									className: `w-4 h-4 rounded-full flex items-center justify-center text-xs font-medium ${
										isCompleted
											? "bg-green-500 text-white"
											: isActive
												? "bg-blue-500 text-white"
												: hasError
													? "bg-red-500 text-white"
													: "bg-gray-200 text-gray-500"
									}`,
									children: isCompleted ? "✓" : hasError ? "!" : index + 1,
								}),
								_jsxs("div", {
									className: "flex-1",
									children: [
										_jsx("div", {
											className: `font-medium ${isActive ? "text-blue-500" : hasError ? "text-red-500" : "text-gray-700"}`,
											children: stage.name,
										}),
										stage.description &&
											_jsx("div", {
												className: "text-sm text-gray-500",
												children: stage.description,
											}),
									],
								}),
								isActive &&
									_jsx("div", { className: "w-2 h-2 bg-blue-500 rounded-full animate-pulse" }),
							],
						},
						index,
					)
				}),
			}),
		],
	})
}
export default ProgressIndicator
//# sourceMappingURL=ProgressIndicators.js.map
