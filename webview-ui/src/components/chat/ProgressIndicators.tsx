import React, { useState, useEffect, useRef } from "react"

/**
 * Progress indicator types
 */
export type ProgressType = "linear" | "circular" | "dots" | "pulse" | "wave" | "spiral" | "segments"

/**
 * Progress states
 */
export type ProgressState = "idle" | "loading" | "processing" | "success" | "error" | "warning" | "paused"

/**
 * Progress indicator props
 */
export interface ProgressIndicatorProps {
	type: ProgressType
	state: ProgressState
	value?: number // 0-100
	max?: number
	label?: string
	description?: string
	showPercentage?: boolean
	showTimeRemaining?: boolean
	estimatedTime?: number // in milliseconds
	size?: "small" | "medium" | "large"
	color?: string
	backgroundColor?: string
	animated?: boolean
	accessible?: boolean
	className?: string
}

/**
 * Enhanced Progress Indicators Component
 * Provides multiple types of animated progress indicators with accessibility support
 */
export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
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
	const startTimeRef = useRef<number>(Date.now())
	const animationRef = useRef<number>()

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
	const formatTime = (ms: number): string => {
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
				return <LinearProgress {...{ animatedValue, colors, backgroundColor }} />
			case "circular":
				return <CircularProgress {...{ animatedValue, colors, getSizeClasses }} />
			case "dots":
				return <DotsProgress {...{ state, colors, getSizeClasses }} />
			case "pulse":
				return <PulseProgress {...{ state, colors, getSizeClasses }} />
			case "wave":
				return <WaveProgress {...{ animatedValue, colors }} />
			case "spiral":
				return <SpiralProgress {...{ animatedValue, colors, getSizeClasses }} />
			case "segments":
				return <SegmentsProgress {...{ animatedValue, colors, size }} />
			default:
				return <LinearProgress {...{ animatedValue, colors, backgroundColor }} />
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

	return (
		<div className={`flex flex-col items-center space-y-2 ${className}`} {...accessibilityProps}>
			{renderProgressIndicator()}

			{(label || showPercentage || (showTimeRemaining && timeRemaining > 0)) && (
				<div className="text-center space-y-1">
					{label && <div className={`text-sm font-medium ${colors.text}`}>{label}</div>}

					{showPercentage && (
						<div className="text-lg font-mono font-bold text-vscode-foreground">
							{Math.round(animatedValue)}%
						</div>
					)}

					{showTimeRemaining && timeRemaining > 0 && (
						<div className="text-sm text-vscode-descriptionForeground">
							{formatTime(timeRemaining)} remaining
						</div>
					)}

					{description && (
						<div id="progress-description" className="text-xs text-vscode-descriptionForeground">
							{description}
						</div>
					)}
				</div>
			)}
		</div>
	)
}

/**
 * Linear Progress Bar
 */
const LinearProgress: React.FC<{
	animatedValue: number
	colors: any
	backgroundColor?: string
}> = ({ animatedValue, colors, backgroundColor }) => (
	<div className={`w-full h-2 ${backgroundColor || "bg-gray-200"} rounded-full overflow-hidden relative`}>
		<div
			className={`h-full rounded-full transition-all duration-500 ease-out relative ${colors.bg}`}
			style={{ width: `${animatedValue}%` }}>
			{/* Animated shine effect */}
			<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />

			{/* Striped pattern for indeterminate state */}
			{animatedValue === 0 && (
				<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
			)}
		</div>
	</div>
)

/**
 * Circular Progress Indicator
 */
const CircularProgress: React.FC<{
	animatedValue: number
	colors: any
	getSizeClasses: () => string
}> = ({ animatedValue, colors, getSizeClasses }) => {
	const radius = 16
	const circumference = 2 * Math.PI * radius
	const strokeDashoffset = circumference - (animatedValue / 100) * circumference

	return (
		<div className="relative">
			<svg className={`transform -rotate-90 ${getSizeClasses()}`} width="64" height="64" viewBox="0 0 64 64">
				{/* Background circle */}
				<circle
					cx="32"
					cy="32"
					r={radius}
					stroke="currentColor"
					strokeWidth="4"
					fill="none"
					className="text-gray-200"
				/>

				{/* Progress circle */}
				<circle
					cx="32"
					cy="32"
					r={radius}
					stroke="currentColor"
					strokeWidth="4"
					fill="none"
					strokeDasharray={circumference}
					strokeDashoffset={strokeDashoffset}
					className={`${colors.text} transition-all duration-500 ease-out`}
					strokeLinecap="round"
				/>
			</svg>
		</div>
	)
}

/**
 * Dots Progress Indicator
 */
const DotsProgress: React.FC<{
	state: ProgressState
	colors: any
	getSizeClasses: () => string
}> = ({ state, colors, getSizeClasses }) => (
	<div className="flex space-x-2">
		{[0, 1, 2].map((index) => (
			<div
				key={index}
				className={`${getSizeClasses()} rounded-full ${colors.bg} transition-all duration-300`}
				style={{
					animationDelay: `${index * 150}ms`,
					animation: state === "processing" ? "pulse 1.5s ease-in-out infinite" : "none",
				}}
			/>
		))}
	</div>
)

/**
 * Pulse Progress Indicator
 */
const PulseProgress: React.FC<{
	state: ProgressState
	colors: any
	getSizeClasses: () => string
}> = ({ state, colors, getSizeClasses }) => (
	<div className="relative">
		<div
			className={`${getSizeClasses()} rounded-full ${colors.bg} transition-all duration-300`}
			style={{
				animation: state === "processing" ? "pulse 2s ease-in-out infinite" : "none",
			}}
		/>
		{state === "processing" && (
			<div
				className={`absolute inset-0 rounded-full ${colors.bg} opacity-50`}
				style={{
					animation: "ping 2s ease-in-out infinite",
				}}
			/>
		)}
	</div>
)

/**
 * Wave Progress Indicator
 */
const WaveProgress: React.FC<{
	animatedValue: number
	colors: any
}> = ({ animatedValue, colors }) => (
	<div className="relative w-16 h-16 overflow-hidden rounded-full border-2 border-gray-200">
		<div
			className={`absolute bottom-0 left-0 right-0 ${colors.bg} transition-all duration-500 ease-out`}
			style={{
				height: `${animatedValue}%`,
				background: `linear-gradient(to top, ${colors.bg.replace("bg-", "rgb(var(--tw-")}) 0%, transparent 100%)`,
			}}>
			{/* Wave animation */}
			<div
				className="absolute top-0 left-0 right-0 h-2 bg-white/30"
				style={{
					animation: "wave 2s ease-in-out infinite",
					transform: "translateY(-50%)",
				}}
			/>
		</div>
	</div>
)

/**
 * Spiral Progress Indicator
 */
const SpiralProgress: React.FC<{
	animatedValue: number
	colors: any
	getSizeClasses: () => string
}> = ({ animatedValue, colors, getSizeClasses }) => (
	<div className="relative">
		<svg className={`${getSizeClasses()}`} width="64" height="64" viewBox="0 0 64 64">
			<defs>
				<path
					id="spiral"
					d="M 32 32 m -20 0 a 20 20 0 1 1 40 0 a 16 16 0 1 1 -32 0 a 12 12 0 1 1 24 0 a 8 8 0 1 1 -16 0 a 4 4 0 1 1 8 0"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					className="text-gray-200"
				/>
			</defs>

			<use href="#spiral" className="text-gray-200" />

			{/* Animated spiral progress */}
			<use
				href="#spiral"
				className={`${colors.text} transition-all duration-500 ease-out`}
				style={{
					strokeDasharray: "100",
					strokeDashoffset: `${100 - animatedValue}`,
				}}
			/>
		</svg>
	</div>
)

/**
 * Segments Progress Indicator
 */
const SegmentsProgress: React.FC<{
	animatedValue: number
	colors: any
	size: "small" | "medium" | "large"
}> = ({ animatedValue, colors, size }) => {
	const segmentCount = 8
	const filledSegments = Math.floor((animatedValue / 100) * segmentCount)

	const sizeClasses = {
		small: "w-2 h-2",
		medium: "w-3 h-3",
		large: "w-4 h-4",
	}[size]

	return (
		<div className="flex flex-wrap gap-1 max-w-xs">
			{Array.from({ length: segmentCount }, (_, index) => (
				<div
					key={index}
					className={`${sizeClasses} rounded-sm transition-all duration-300 ${
						index < filledSegments ? colors.bg : "bg-gray-200"
					}`}
					style={{
						animationDelay: `${index * 50}ms`,
						animation: index < filledSegments ? "fadeIn 0.5s ease-out" : "none",
					}}
				/>
			))}
		</div>
	)
}

/**
 * Multi-Stage Progress Component
 * For complex operations with multiple stages
 */
export interface MultiStageProgressProps {
	stages: Array<{
		name: string
		status: "pending" | "active" | "completed" | "error"
		description?: string
	}>
	currentStage: number
	showProgress?: boolean
}

export const MultiStageProgress: React.FC<MultiStageProgressProps> = ({
	stages,
	currentStage,
	showProgress = true,
}) => {
	const progressPercentage = ((currentStage + 1) / stages.length) * 100

	return (
		<div className="w-full space-y-4">
			{showProgress && (
				<div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
					<div
						className="bg-blue-500 h-full rounded-full transition-all duration-500 ease-out"
						style={{ width: `${progressPercentage}%` }}
					/>
				</div>
			)}

			<div className="space-y-2">
				{stages.map((stage, index) => {
					const isActive = index === currentStage
					const isCompleted = index < currentStage
					const hasError = stage.status === "error"

					return (
						<div
							key={index}
							className={`flex items-center space-x-3 p-3 rounded-lg border transition-all duration-200 ${
								isActive ? "border-blue-500 bg-blue-500/10" : "border-gray-200"
							} ${hasError ? "border-red-500 bg-red-500/10" : ""}`}>
							<div
								className={`w-4 h-4 rounded-full flex items-center justify-center text-xs font-medium ${
									isCompleted
										? "bg-green-500 text-white"
										: isActive
											? "bg-blue-500 text-white"
											: hasError
												? "bg-red-500 text-white"
												: "bg-gray-200 text-gray-500"
								}`}>
								{isCompleted ? "✓" : hasError ? "!" : index + 1}
							</div>

							<div className="flex-1">
								<div
									className={`font-medium ${
										isActive ? "text-blue-500" : hasError ? "text-red-500" : "text-gray-700"
									}`}>
									{stage.name}
								</div>
								{stage.description && <div className="text-sm text-gray-500">{stage.description}</div>}
							</div>

							{isActive && <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />}
						</div>
					)
				})}
			</div>
		</div>
	)
}

export default ProgressIndicator
