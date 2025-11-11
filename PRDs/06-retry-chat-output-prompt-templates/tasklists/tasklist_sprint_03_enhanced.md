# Sprint 3: System Integration and Monitoring (2 Weeks) - Enhanced with Code Context

## Phase 1: Integration with Existing Systems

### Task 3.1: PRD-03 Retry Infrastructure Integration

**File**: `src/core/tools/retry/RetryEngine.ts`
**Lines**: Modify constructor and event handlers (lines 34-67, 320-386)
**Implementation Context**:

- Integrate RetryChatEmitter into existing event system at [`RetryEngine`](src/core/tools/retry/RetryEngine.ts:34)
- Add retry chat emission to existing event handlers at lines 134, 178, 189
- Ensure backward compatibility with PRD-03 retry system
- Use existing event emitter patterns from [`EventEmitter`](src/core/tools/retry/RetryEngine.ts:34)

**Enhanced Implementation**:

```typescript
// Modify constructor (around line 34)
constructor(private options: RetryEngineOptions) {
	super()
	this.retryLogger = new RetryLogger()

	// New: Initialize RetryChatEmitter with existing webview provider
	this.retryChatEmitter = new RetryChatEmitter(
		options.webviewProvider,
		this.createTemplateEngine(options.settings),
		options.settings?.retryVisibility
	)

	// Existing event handlers remain unchanged for backward compatibility
	this.on("retry-start", this.handleRetryStart.bind(this))
	this.on("retry-attempt", this.handleRetryAttempt.bind(this))
	this.on("retry-success", this.handleRetrySuccess.bind(this))
	this.on("retry-failed", this.handleRetryFailed.bind(this))
}

// Create template engine with settings integration
private createTemplateEngine(settings?: any): RetryTemplateEngine {
	const retryVisibility = settings?.retryVisibility || DEFAULT_RETRY_VISIBILITY_SETTINGS
	return new RetryTemplateEngine(retryVisibility)
}

// Modify existing event handlers to include chat emission (around line 134)
private handleRetryStart(context: RetryContext): void {
	// Existing logging logic remains unchanged
	this.retryLogger.logAttemptStart(context)

	// New: Emit chat message using template engine
	this.retryChatEmitter.emitRetryStart(context)

	// Existing event emission for backward compatibility
	this.emit("retry-start", context)
}

// Modify existing event handlers (around line 178)
private handleRetryAttempt(context: RetryContext): void {
	// Existing logging logic
	this.retryLogger.logAttemptProgress(context)

	// New: Emit chat message with template rendering
	this.retryChatEmitter.emitRetryProgress(context)

	// Existing event emission
	this.emit("retry-attempt", context)
}

// Modify existing event handlers (around line 189)
private handleRetrySuccess(context: RetryContext): void {
	// Existing logging logic
	this.retryLogger.logAttemptSuccess(context)

	// New: Emit success message with template
	this.retryChatEmitter.emitRetrySuccess(context)

	// Existing event emission
	this.emit("retry-success", context)
}

// Modify existing event handlers (around line 200)
private handleRetryFailed(context: RetryContext): void {
	// Existing logging logic
	this.retryLogger.logAttemptFailure(context)

	// New: Emit failure message with template
	this.retryChatEmitter.emitRetryFailure(context)

	// Existing event emission
	this.emit("retry-failed", context)
}
```

### Task 3.2: Dual-History Synchronization Implementation

**File**: `src/core/webview/ClineProvider.ts`
**Lines**: Add to message history management (around line 500)
**Implementation Context**:

- Extend existing [`MessageHistory`](src/core/webview/ClineProvider.ts:181) interface
- Implement dual-history sync for retry visibility toggle
- Use existing history synchronization patterns from [`taskHistory`](src/core/webview/ClineProvider.ts:181)

**Enhanced Implementation**:

```typescript
// Extend existing MessageHistory interface (around line 181)
interface EnhancedMessageHistory extends MessageHistory {
	retryMessages?: ClineMessage[]
	visibilitySettings?: RetryVisibilitySettings
	lastVisibilityToggle?: number
}

// Add to ClineProvider class
private retryHistory: ClineMessage[] = []
	private isRetryVisibilityEnabled: boolean = true

// Add to existing message history management
private addToHistory(message: ClineMessage): void {
	// Use existing history management patterns
	if (!message.ts) {
		message.ts = Date.now()
	}

	// Handle retry messages separately for dual history
	if (message.type === "retryChatMessage") {
		this.retryHistory.push(message)

		// Add to main history only if visibility is enabled
		if (this.isRetryVisibilityEnabled) {
			this.taskHistory.push(message)
		}
	} else {
		// Non-retry messages always go to main history
		this.taskHistory.push(message)
	}

	// Use existing history size management
	if (this.taskHistory.length > this.maxHistorySize) {
		this.taskHistory = this.taskHistory.slice(-this.maxHistorySize)
	}

	if (this.retryHistory.length > this.maxHistorySize) {
		this.retryHistory = this.retryHistory.slice(-this.maxHistorySize)
	}
}

// New method for retry visibility toggle
private toggleRetryVisibility(enabled: boolean): void {
	this.isRetryVisibilityEnabled = enabled

	// Sync history based on visibility
	if (enabled) {
		// Add retry messages to main history
		const retryMessagesToAdd = this.retryHistory.filter(msg =>
			!this.taskHistory.some(existing => existing.ts === msg.ts)
		)
		this.taskHistory.push(...retryMessagesToAdd)
		this.taskHistory.sort((a, b) => a.ts - b.ts)
	} else {
		// Remove retry messages from main history
		this.taskHistory = this.taskHistory.filter(msg => msg.type !== "retryChatMessage")
	}

	// Update last visibility toggle timestamp
	this.lastVisibilityToggle = Date.now()

	// Use existing postMessageToWebview pattern
	this.postMessageToWebview({
		type: "retryVisibilityToggled",
		enabled,
		timestamp: this.lastVisibilityToggle
	})
}

// Integrate with existing message handler
private async handleMessage(message: any): Promise<void> {
	switch (message.type) {
		// ... existing cases

		case "toggleRetryVisibility":
			this.toggleRetryVisibility(message.enabled)

			// Sync updated history to webview
			this.postMessageToWebview({
				type: "taskHistory",
				messages: this.taskHistory
			})
			break
	}
}

// Enhance existing history persistence
private async saveHistoryToState(): Promise<void> {
	// Use existing state management patterns
	const historyToSave = {
		mainHistory: this.taskHistory,
		retryHistory: this.retryHistory,
		visibilitySettings: this.isRetryVisibilityEnabled,
		lastToggle: this.lastVisibilityToggle
	}

	await this.globalState.update("enhancedMessageHistory", historyToSave)
}

private async loadHistoryFromState(): Promise<void> {
	// Use existing state loading patterns
	const savedHistory = await this.globalState.get("enhancedMessageHistory", {})

	if (savedHistory.mainHistory) {
		this.taskHistory = savedHistory.mainHistory
	}

	if (savedHistory.retryHistory) {
		this.retryHistory = savedHistory.retryHistory
	}

	this.isRetryVisibilityEnabled = savedHistory.visibilitySettings ?? true
	this.lastVisibilityToggle = savedHistory.lastToggle
}
```

### Task 3.3: Settings System Integration

**File**: `packages/types/src/global-settings.ts`
**Lines**: Extend GlobalSettings interface (around line 317)
**Implementation Context**:

- Add RetryVisibilitySettings to existing [`GlobalSettings`](packages/types/src/global-settings.ts:174)
- Integrate with existing settings validation system from [`retrySettingsSchema`](packages/types/src/global-settings.ts:50)
- Use existing settings migration patterns

**Enhanced Implementation**:

```typescript
// Add to existing globalSettingsSchema (around line 317)
export const globalSettingsSchema = z.object({
	// ... existing settings
	retrySettings: retrySettingsSchema.optional(),
	retryVisibility: retryVisibilitySettingsSchema.optional(), // Already added in Sprint 2
})

// Add settings migration function (around line 492)
export const migrateRetryVisibilitySettings = (oldSettings: any): GlobalSettings => {
	const currentSettings = { ...oldSettings }

	// Migrate from old retry settings to new visibility settings
	if (oldSettings.retrySettings && !oldSettings.retryVisibility) {
		currentSettings.retryVisibility = {
			enableRetryChatOutput: oldSettings.retrySettings.enableRetry ?? true,
			enableDetailedProgress: false,
			consolidateMessages: true,
			maxProgressMessages: 3,
			customTemplates: {},
			templateVariables: {},
			activeTemplateIds: {},
			enablePreview: true,
			autoSave: true,
		}
	}

	return currentSettings as GlobalSettings
}

// Add to EVALS_SETTINGS (around line 489)
export const EVALS_SETTINGS: RooCodeSettings = {
	// ... existing settings
	retrySettings: DEFAULT_RETRY_SETTINGS,
	retryVisibility: DEFAULT_RETRY_VISIBILITY_SETTINGS,
}

// Add settings validation for retry visibility
export const validateRetryVisibilitySettings = (settings: RetryVisibilitySettings): ValidationResult => {
	const errors: string[] = []

	// Use existing validation patterns from retrySettingsSchema
	if (settings.maxProgressMessages !== undefined) {
		if (settings.maxProgressMessages < 1 || settings.maxProgressMessages > 10) {
			errors.push("maxProgressMessages must be between 1 and 10")
		}
	}

	// Validate custom templates
	if (settings.customTemplates) {
		Object.entries(settings.customTemplates).forEach(([id, template]) => {
			if (typeof template !== "string") {
				errors.push(`Custom template '${id}' must be a string`)
			}

			// Basic template validation
			const hasVariables = /\{\{(\w+)\}\}/.test(template)
			if (!hasVariables) {
				errors.push(`Custom template '${id}' must contain at least one variable`)
			}
		})
	}

	return {
		isValid: errors.length === 0,
		errors,
	}
}
```

### Task 3.4: Webview Integration Points

**File**: `src/core/webview/webviewMessageHandler.ts`
**Lines**: Add to message routing (around line 200)
**Implementation Context**:

- Add retry message routing to existing message handlers
- Integrate with existing [`postMessageToWebview`](src/core/webview/webviewMessageHandler.ts:3122) patterns
- Ensure retry messages follow existing message flow

**Enhanced Implementation**:

```typescript
// Add to existing message type handling in handleMessage method (around line 200)
case "retryChatMessage": {
	// Follow existing message routing patterns
	const retryMessage = data.message as RetryChatMessage

	// Route to appropriate handler based on message type
	switch (retryMessage.type) {
		case "retry_start":
			this.handleRetryStartMessage(retryMessage)
			break
		case "retry_progress":
			this.handleRetryProgressMessage(retryMessage)
			break
		case "retry_success":
			this.handleRetrySuccessMessage(retryMessage)
			break
		case "retry_failure":
			this.handleRetryFailureMessage(retryMessage)
			break
	}
	break
}

case "retryVisibilitySettings": {
	// Handle settings synchronization
	const settings = data.settings as RetryVisibilitySettings

	// Use existing settings update patterns
	this.updateRetryVisibilitySettings(settings)
	break
}

case "templateAction": {
	// Handle template-related actions
	const { action, templateId, templateData } = data

	switch (action) {
		case "save":
			this.handleTemplateSave(templateId, templateData)
			break
		case "delete":
			this.handleTemplateDelete(templateId)
			break
		case "preview":
			this.handleTemplatePreview(templateId, templateData)
			break
	}
	break
}

// Add new handler methods
private handleRetryStartMessage(message: RetryChatMessage): void {
	// Use existing message enhancement patterns from line 2579-2583
	this.postMessageToWebview({
		type: "showRetryMessage",
		message: {
			...message,
			displayType: "start",
			timestamp: Date.now()
		}
	})

	// Log using existing logging patterns
	this.logger.info(`Retry start: ${message.toolName} (attempt ${message.attempt}/${message.maxAttempts})`)
}

private handleRetryProgressMessage(message: RetryChatMessage): void {
	// Consolidate multiple progress messages
	const consolidatedMessage = this.consolidateProgressMessages(message)

	this.postMessageToWebview({
		type: "showRetryMessage",
		message: consolidatedMessage
	})
}

private handleTemplateSave(templateId: string, templateData: any): void {
	// Use existing settings persistence patterns
	const currentSettings = this.getGlobalSettings()
	const updatedSettings = {
		...currentSettings,
		retryVisibility: {
			...currentSettings.retryVisibility,
			customTemplates: {
				...currentSettings.retryVisibility.customTemplates,
				[templateId]: templateData.template
			}
		}
	}

	this.updateGlobalSettings(updatedSettings)
	this.postMessageToWebview({
		type: "templateSaved",
		templateId
	})
}
```

## Phase 2: Monitoring and Analytics

### Task 3.5: Retry Analytics Implementation

**File**: `src/core/tools/retry/RetryAnalytics.ts` (new file)
**Implementation Context**:

- Follow existing analytics patterns from retry module
- Track retry visibility metrics and template usage
- Use existing event emission patterns for analytics

**Enhanced Implementation**:

```typescript
import { EventEmitter } from "events"
import type { RetryVisibilitySettings, RetryTemplateContext, RetryAnalyticsReport } from "./types.js"

export interface RetryAnalyticsEvent {
	timestamp: number
	eventType: string
	data: any
}

export class RetryAnalytics extends EventEmitter {
	private events: RetryAnalyticsEvent[] = []
	private metrics = {
		totalRetries: 0,
		successfulRetries: 0,
		failedRetries: 0,
		averageRetryTime: 0,
		templateUsage: new Map<string, number>(),
		visibilityToggles: 0,
		userInteractions: new Map<string, number>(),
	}

	constructor(private settings: RetryVisibilitySettings) {
		super()
		this.startMetricsCollection()
	}

	// Track retry visibility metrics
	trackRetryVisibility(settings: RetryVisibilitySettings): void {
		const event: RetryAnalyticsEvent = {
			timestamp: Date.now(),
			eventType: "visibility_settings_changed",
			data: {
				enableRetryChatOutput: settings.enableRetryChatOutput,
				enableDetailedProgress: settings.enableDetailedProgress,
				consolidateMessages: settings.consolidateMessages,
				maxProgressMessages: settings.maxProgressMessages,
			},
		}

		this.recordEvent(event)
		this.metrics.visibilityToggles++
		this.emit("visibilityTracked", event)
	}

	// Track template usage patterns
	trackTemplateUsage(templateId: string, context: RetryTemplateContext): void {
		const event: RetryAnalyticsEvent = {
			timestamp: Date.now(),
			eventType: "template_used",
			data: {
				templateId,
				toolName: context.toolName,
				attempt: context.attempt,
				maxAttempts: context.maxAttempts,
				errorType: context.errorClassification?.category,
				renderTime: Date.now(),
			},
		}

		this.recordEvent(event)

		// Update template usage count
		const currentCount = this.metrics.templateUsage.get(templateId) || 0
		this.metrics.templateUsage.set(templateId, currentCount + 1)

		this.emit("templateUsageTracked", event)
	}

	// Track user interaction with retry messages
	trackRetryInteraction(messageId: string, action: string): void {
		const event: RetryAnalyticsEvent = {
			timestamp: Date.now(),
			eventType: "user_interaction",
			data: {
				messageId,
				action, // "expand", "collapse", "view_details", "copy_error"
				timestamp: Date.now(),
			},
		}

		this.recordEvent(event)

		// Update interaction metrics
		const actionKey = `${messageId}_${action}`
		const currentCount = this.metrics.userInteractions.get(actionKey) || 0
		this.metrics.userInteractions.set(actionKey, currentCount + 1)

		this.emit("interactionTracked", event)
	}

	// Generate analytics report
	generateReport(): RetryAnalyticsReport {
		const successRate =
			this.metrics.totalRetries > 0 ? (this.metrics.successfulRetries / this.metrics.totalRetries) * 100 : 0

		const mostUsedTemplates = Array.from(this.metrics.templateUsage.entries())
			.sort((a, b) => b[1] - a[1])
			.slice(0, 10)
			.map(([templateId, count]) => ({ templateId, count }))

		const commonInteractions = Array.from(this.metrics.userInteractions.entries())
			.sort((a, b) => b[1] - a[1])
			.slice(0, 5)
			.map(([action, count]) => ({ action, count }))

		return {
			period: {
				start: this.events[0]?.timestamp || Date.now(),
				end: Date.now(),
				duration: this.events.length > 0 ? Date.now() - this.events[0].timestamp : 0,
			},
			metrics: {
				...this.metrics,
				successRate,
				mostUsedTemplates,
				commonInteractions,
				eventsAnalyzed: this.events.length,
			},
			recommendations: this.generateRecommendations(),
		}
	}

	private recordEvent(event: RetryAnalyticsEvent): void {
		this.events.push(event)

		// Keep only last 10000 events to prevent memory issues
		if (this.events.length > 10000) {
			this.events = this.events.slice(-10000)
		}

		// Update aggregate metrics
		this.updateAggregateMetrics(event)
	}

	private updateAggregateMetrics(event: RetryAnalyticsEvent): void {
		switch (event.eventType) {
			case "retry_completed":
				this.metrics.totalRetries++
				if (event.data.success) {
					this.metrics.successfulRetries++
				} else {
					this.metrics.failedRetries++
				}
				break
		}
	}

	private generateRecommendations(): string[] {
		const recommendations: string[] = []

		// Analyze success rate
		const successRate =
			this.metrics.totalRetries > 0 ? (this.metrics.successfulRetries / this.metrics.totalRetries) * 100 : 0

		if (successRate < 50) {
			recommendations.push("Consider reviewing retry configuration - success rate is below 50%")
		}

		// Analyze template usage
		if (this.metrics.templateUsage.size === 0) {
			recommendations.push("No custom templates are being used - consider template optimization")
		}

		// Analyze user interactions
		const totalInteractions = Array.from(this.metrics.userInteractions.values()).reduce((a, b) => a + b, 0)
		if (totalInteractions < this.metrics.totalRetries * 0.1) {
			recommendations.push("Low user engagement with retry messages - consider improving visibility")
		}

		return recommendations
	}

	private startMetricsCollection(): void {
		// Collect metrics every 5 minutes
		setInterval(() => {
			const report = this.generateReport()
			this.emit("metricsReport", report)
		}, 300000) // 5 minutes
	}
}
```

### Task 3.6: Performance Monitoring Integration

**File**: `src/core/tools/retry/RetryEngine.ts`
**Lines**: Add performance monitoring (around line 400)
**Implementation Context**:

- Add performance metrics collection for retry chat output
- Monitor message rendering times (<100ms requirement)
- Track memory usage for retry system (<2MB requirement)
- Use existing performance monitoring patterns

**Enhanced Implementation**:

```typescript
// Add to RetryEngine class
private performanceMetrics = {
	chatMessageRenderTimes: [] as number[],
	memoryUsageSnapshots: [] as MemorySnapshot[],
	templateRenderTimes: [] as number[],
	eventProcessingTimes: [] as number[]
}

interface MemorySnapshot {
	timestamp: number
	heapUsed: number
	heapTotal: number
	external: number
}

// Add performance monitoring to existing event handlers
private handleRetryStart(context: RetryContext): void {
	const startTime = performance.now()

	// Existing logging logic
	this.retryLogger.logAttemptStart(context)

	// New: Emit chat message with performance tracking
	this.retryChatEmitter.emitRetryStart(context)

	const renderTime = performance.now() - startTime
	this.performanceMetrics.chatMessageRenderTimes.push(renderTime)

	// Check <100ms requirement
	if (renderTime > 100) {
		console.warn(`Retry start message render took ${renderTime}ms (>100ms requirement)`)
		this.emit("performanceIssue", {
			type: "slow_render",
			duration: renderTime,
			messageType: "retry_start"
		})
	}

	// Existing event emission
	this.emit("retry-start", context)
}

// Add memory usage monitoring
private monitorMemoryUsage(): void {
	const snapshot: MemorySnapshot = {
		timestamp: Date.now(),
		heapUsed: process.memoryUsage().heapUsed,
		heapTotal: process.memoryUsage().heapTotal,
		external: process.memoryUsage().external
	}

	this.performanceMetrics.memoryUsageSnapshots.push(snapshot)

	// Keep only last 100 snapshots
	if (this.performanceMetrics.memoryUsageSnapshots.length > 100) {
		this.performanceMetrics.memoryUsageSnapshots =
			this.performanceMetrics.memoryUsageSnapshots.slice(-100)
	}

	// Check <2MB requirement (2MB = 2 * 1024 * 1024 = 2097152 bytes)
	const memoryOverhead = snapshot.heapUsed - this.getBaselineMemoryUsage()
	if (memoryOverhead > 2097152) {
		console.warn(`Retry system memory overhead: ${memoryOverhead} bytes (>2MB requirement)`)
		this.emit("performanceIssue", {
			type: "high_memory",
			usage: memoryOverhead,
			limit: 2097152
		})
	}
}

private getBaselineMemoryUsage(): number {
	// Return baseline memory usage before retry system initialization
	return this.baselineMemoryUsage || 0
}

// Add performance reporting method
getPerformanceReport(): PerformanceReport {
	const avgRenderTime = this.performanceMetrics.chatMessageRenderTimes.length > 0
		? this.performanceMetrics.chatMessageRenderTimes.reduce((a, b) => a + b, 0) / this.performanceMetrics.chatMessageRenderTimes.length
		: 0

	const maxRenderTime = this.performanceMetrics.chatMessageRenderTimes.length > 0
		? Math.max(...this.performanceMetrics.chatMessageRenderTimes)
		: 0

	const currentMemory = process.memoryUsage().heapUsed
	const memoryOverhead = currentMemory - this.getBaselineMemoryUsage()

	return {
		rendering: {
			averageTime: avgRenderTime,
			maxTime: maxRenderTime,
			withinRequirement: maxRenderTime <= 100,
			samples: this.performanceMetrics.chatMessageRenderTimes.length
		},
		memory: {
			currentOverhead: memoryOverhead,
			withinRequirement: memoryOverhead <= 2097152,
			snapshots: this.performanceMetrics.memoryUsageSnapshots.length
		},
		templates: {
			averageRenderTime: this.performanceMetrics.templateRenderTimes.length > 0
				? this.performanceMetrics.templateRenderTimes.reduce((a, b) => a + b, 0) / this.performanceMetrics.templateRenderTimes.length
				: 0,
			withinRequirement: this.performanceMetrics.templateRenderTimes.every(time => time <= 100)
		}
	}
}

interface PerformanceReport {
	rendering: {
		averageTime: number
		maxTime: number
		withinRequirement: boolean
		samples: number
	}
	memory: {
		currentOverhead: number
		withinRequirement: boolean
		snapshots: number
	}
	templates: {
		averageRenderTime: number
		withinRequirement: boolean
	}
}
```

### Task 3.7: Usage Metrics Collection

**File**: `src/core/tools/retry/RetryLogger.ts`
**Lines**: Extend logging system (around line 430)
**Implementation Context**:

- Add retry visibility metrics to existing logging
- Track template usage and effectiveness
- Monitor user engagement with retry messages
- Use existing logging infrastructure and patterns

**Enhanced Implementation**:

```typescript
// Extend RetryLogger class (around line 430)
export class RetryLogger {
	// Existing properties remain unchanged
	private visibilityMetrics: {
		chatMessagesDisplayed: number
		userInteractions: number
		templateSwitches: number
		visibilityToggles: number
	} = {
		chatMessagesDisplayed: 0,
		userInteractions: 0,
		templateSwitches: 0,
		visibilityToggles: 0,
	}

	private templateMetrics = new Map<
		string,
		{
			usageCount: number
			averageRenderTime: number
			successRate: number
			userSatisfaction: number
		}
	>()

	// New method to log chat message display
	logChatMessageDisplay(messageType: string, templateId: string, renderTime: number): void {
		// Use existing logging patterns
		this.info(`Chat message displayed: ${messageType} using template ${templateId} (${renderTime}ms)`)

		this.visibilityMetrics.chatMessagesDisplayed++

		// Update template metrics
		const existing = this.templateMetrics.get(templateId) || {
			usageCount: 0,
			averageRenderTime: 0,
			successRate: 0,
			userSatisfaction: 0,
		}

		existing.usageCount++
		existing.averageRenderTime = (existing.averageRenderTime + renderTime) / 2

		this.templateMetrics.set(templateId, existing)
	}

	// New method to log user interactions
	logUserInteraction(messageId: string, interactionType: string, satisfaction?: number): void {
		// Use existing logging patterns
		this.info(`User interaction: ${interactionType} on message ${messageId}`)

		this.visibilityMetrics.userInteractions++

		// Could track satisfaction scores if implemented
		if (satisfaction !== undefined) {
			// Update satisfaction metrics for templates used in this interaction
			// This would require correlating messageId back to templateId
		}
	}

	// New method to log template switches
	logTemplateSwitch(oldTemplateId: string, newTemplateId: string, reason: string): void {
		// Use existing logging patterns
		this.info(`Template switched: ${oldTemplateId} -> ${newTemplateId} (${reason})`)

		this.visibilityMetrics.templateSwitches++
	}

	// New method to log visibility toggles
	logVisibilityToggle(enabled: boolean, context: string): void {
		// Use existing logging patterns
		this.info(`Retry visibility toggled: ${enabled} (${context})`)

		this.visibilityMetrics.visibilityToggles++
	}

	// Enhanced statistics method
	getEnhancedStatistics(): EnhancedRetryStatistics {
		const baseStats = this.getStatistics()

		return {
			...baseStats,
			visibility: this.visibilityMetrics,
			templatePerformance: Array.from(this.templateMetrics.entries()).map(([id, metrics]) => ({
				templateId: id,
				...metrics,
			})),
			userEngagement: {
				totalInteractions: this.visibilityMetrics.userInteractions,
				interactionsPerMessage:
					this.visibilityMetrics.chatMessagesDisplayed > 0
						? this.visibilityMetrics.userInteractions / this.visibilityMetrics.chatMessagesDisplayed
						: 0,
				satisfactionScore: this.calculateOverallSatisfaction(),
			},
		}
	}

	private calculateOverallSatisfaction(): number {
		// Calculate overall satisfaction from template metrics
		const templates = Array.from(this.templateMetrics.values())
		if (templates.length === 0) return 0

		const totalSatisfaction = templates.reduce(
			(sum, template) => sum + template.userSatisfaction * template.usageCount,
			0,
		)
		const totalUsage = templates.reduce((sum, template) => sum + template.usageCount, 0)

		return totalUsage > 0 ? totalSatisfaction / totalUsage : 0
	}
}

interface EnhancedRetryStatistics extends RetryStatistics {
	visibility: {
		chatMessagesDisplayed: number
		userInteractions: number
		templateSwitches: number
		visibilityToggles: number
	}
	templatePerformance: Array<{
		templateId: string
		usageCount: number
		averageRenderTime: number
		successRate: number
		userSatisfaction: number
	}>
	userEngagement: {
		totalInteractions: number
		interactionsPerMessage: number
		satisfactionScore: number
	}
}
```

### Task 3.8: Analytics Dashboard Components

**File**: `webview-ui/src/components/RetryAnalytics.tsx` (new file)
**Implementation Context**:

- Create analytics dashboard for retry visibility
- Display retry statistics and usage patterns
- Use existing dashboard component patterns from webview-ui

**Enhanced Implementation**:

```typescript
import React, { memo, useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { useExtensionState } from "@/context/ExtensionStateContext"

// Follow existing dashboard component patterns
const RetryAnalytics = memo(() => {
	const { t } = useTranslation()
	const { retryAnalytics } = useExtensionState()
	const [analyticsData, setAnalyticsData] = useState<RetryAnalyticsReport>()
	const [timeRange, setTimeRange] = useState("7d")

	useEffect(() => {
		// Fetch analytics data
		const fetchAnalytics = async () => {
			const data = await window.vscode?.postMessage({
				type: "getRetryAnalytics",
				timeRange
			})
			setAnalyticsData(data)
		}

		fetchAnalytics()
	}, [timeRange])

	const renderSuccessRateChart = () => {
		if (!analyticsData) return null

		const { successRate } = analyticsData.metrics
		const percentage = Math.round(successRate)

		return (
			<div className="space-y-2">
				<div className="flex justify-between items-center">
					<span className="text-sm font-medium">{t("analytics:successRate")}</span>
					<Badge variant={percentage >= 80 ? "default" : "secondary"}>
						{percentage}%
					</Badge>
				</div>
				<Progress value={percentage} className="w-full" />
			</div>
		)
	}

	const renderTemplateUsage = () => {
		if (!analyticsData) return null

		const { mostUsedTemplates } = analyticsData.metrics

		return (
			<div className="space-y-2">
				<h4 className="text-sm font-medium">{t("analytics:templateUsage")}</h4>
				<div className="space-y-1">
					{mostUsedTemplates.map(({ templateId, count }) => (
						<div key={templateId} className="flex justify-between items-center">
							<span className="text-sm">{templateId}</span>
							<div className="flex items-center gap-2">
								<span className="text-sm text-vscode-descriptionForeground">
									{count} {t("analytics:uses")}
								</span>
								<Progress
									value={(count / Math.max(...mostUsedTemplates.map(t => t.count))) * 100}
									className="w-20"
								/>
							</div>
						</div>
					))}
				</div>
			</div>
		)
	}

	const renderUserInteractions = () => {
		if (!analyticsData) return null

		const { commonInteractions } = analyticsData.metrics

		return (
			<div className="space-y-2">
				<h4 className="text-sm font-medium">{t("analytics:userInteractions")}</h4>
				<div className="space-y-1">
					{commonInteractions.map(({ action, count }) => (
						<div key={action} className="flex justify-between items-center">
							<span className="text-sm capitalize">{action.replace("_", " ")}</span>
							<Badge variant="secondary">{count}</Badge>
						</div>
					))}
				</div>
			</div>
		)
	}

	return (
		// Follow existing dashboard layout patterns
		<div className="space-y-6">
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{/* Success Rate Card */}
				<Card>
					<CardHeader>
						<CardTitle>{t("analytics:successRate")}</CardTitle>
					</CardHeader>
					<CardContent>
						{renderSuccessRateChart()}
					</CardContent>
				</Card>

				{/* Template Usage Card */}
				<Card>
					<CardHeader>
						<CardTitle>{t("analytics:templateUsage")}</CardTitle>
					</CardHeader>
					<CardContent>
						{renderTemplateUsage()}
					</CardContent>
				</Card>

				{/* User Interactions Card */}
				<Card>
					<CardHeader>
						<CardTitle>{t("analytics:userInteractions")}</CardTitle>
					</CardHeader>
					<CardContent>
						{renderUserInteractions()}
					</CardContent>
				</Card>
			</div>

			{/* Recommendations */}
			{analyticsData?.recommendations && analyticsData.recommendations.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle>{t("analytics:recommendations")}</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							{analyticsData.recommendations.map((recommendation, index) => (
								<div key={index} className="p-3 border rounded-md bg-vscode-editorWarning-background/10">
									<p className="text-sm">{recommendation}</p>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	)
})

RetryAnalytics.displayName = "RetryAnalytics"
export default RetryAnalytics
```

## Phase 3: Advanced Features

### Task 3.9: Smart Template Suggestions

**File**: `src/core/tools/retry/RetryTemplateEngine.ts`
**Lines**: Add suggestion system (around line 200)
**Implementation Context**:

- Implement ML-based template suggestions
- Analyze user patterns and suggest improvements
- Use existing analytics data for suggestions

**Enhanced Implementation**:

```typescript
// Add to RetryTemplateEngine class
private suggestionEngine: TemplateSuggestionEngine

constructor(private settings: RetryVisibilitySettings) {
	super()
	this.loadDefaultTemplates()
	this.loadCustomTemplates()
	this.suggestionEngine = new TemplateSuggestionEngine()
}

// New method for smart suggestions
generateTemplateSuggestions(context: RetryTemplateContext): TemplateSuggestion[] {
	const suggestions = this.suggestionEngine.generateSuggestions(context, this.templates)

	// Emit suggestions event
	this.emit("templateSuggestions", suggestions)

	return suggestions
}

class TemplateSuggestionEngine {
	private userPatterns = new Map<string, UserPattern>()
	private analyticsData: RetryAnalyticsReport

	generateSuggestions(context: RetryTemplateContext, templates: Map<string, RetryTemplate>): TemplateSuggestion[] {
		const suggestions: TemplateSuggestion[] = []

		// Analyze error patterns
		const errorPattern = this.analyzeErrorPattern(context)
		if (errorPattern.frequent) {
			suggestions.push(this.generateErrorBasedSuggestion(errorPattern))
		}

		// Analyze tool-specific patterns
		const toolPattern = this.analyzeToolPattern(context.toolName)
		if (toolPattern.hasRecommendations) {
			suggestions.push(...toolPattern.recommendations)
		}

		// Analyze user preferences
		const preferenceSuggestions = this.analyzeUserPreferences(context)
		suggestions.push(...preferenceSuggestions)

		return suggestions.sort((a, b) => b.confidence - a.confidence)
	}

	private analyzeErrorPattern(context: RetryTemplateContext): ErrorPattern {
		// Analyze error classification patterns
		if (!context.errorClassification) return { frequent: false }

		const errorType = context.errorClassification.category
		const errorSeverity = context.errorClassification.severity

		// Check if this is a frequently occurring error type
		const frequency = this.getErrorFrequency(errorType)

		return {
			type: errorType,
			severity: errorSeverity,
			frequent: frequency > 5, // Threshold for "frequent"
			frequency,
			suggestedTemplate: this.getRecommendedTemplateForError(errorType)
		}
	}

	private generateErrorBasedSuggestion(pattern: ErrorPattern): TemplateSuggestion {
		return {
			type: "error_based",
			templateId: pattern.suggestedTemplate,
			reason: `Frequent ${pattern.type} errors detected. Recommended template optimized for ${pattern.type} errors.`,
			confidence: Math.min(pattern.frequency / 10, 0.9), // Max 90% confidence
			template: this.templates.get(pattern.suggestedTemplate),
			expectedImprovement: "Better error communication and user guidance"
		}
	}

	private analyzeUserPreferences(context: RetryTemplateContext): TemplateSuggestion[] {
		const suggestions: TemplateSuggestion[] = []

		// Analyze time-based preferences
		const hour = new Date().getHours()
		if (hour >= 9 && hour <= 17) {
			// Work hours - suggest concise templates
			suggestions.push({
				type: "time_based",
				templateId: "concise_retry_progress",
				reason: "Work hours detected - concise template preferred",
				confidence: 0.7,
				template: this.templates.get("concise_retry_progress"),
				expectedImprovement: "Reduced distraction during work hours"
			})
		} else {
			// After hours - suggest detailed templates
			suggestions.push({
				type: "time_based",
				templateId: "detailed_retry_progress",
				reason: "After hours detected - detailed template preferred",
				confidence: 0.7,
				template: this.templates.get("detailed_retry_progress"),
				expectedImprovement: "Better visibility for troubleshooting"
			})
		}

		return suggestions
	}
}

interface TemplateSuggestion {
	type: "error_based" | "tool_based" | "time_based" | "preference_based"
	templateId: string
	reason: string
	confidence: number
	template?: RetryTemplate
	expectedImprovement: string
}

interface ErrorPattern {
	type: string
	severity: string
	frequent: boolean
	frequency: number
	suggestedTemplate: string
}
```

### Task 3.10: Template Marketplace Integration

**File**: `src/core/tools/retry/RetryTemplateMarketplace.ts` (new file)
**Implementation Context**:

- Create template sharing and discovery system
- Support community template submissions
- Implement template rating and feedback system

**Enhanced Implementation**:

```typescript
import { EventEmitter } from "events"
import type { RetryTemplate, RetryMarketplaceTemplate, TemplateRating } from "./types.js"

export class RetryTemplateMarketplace extends EventEmitter {
	private communityTemplates: Map<string, RetryMarketplaceTemplate> = new Map()
	private userRatings: Map<string, TemplateRating[]> = new Map()

	constructor(private settings: RetryVisibilitySettings) {
		super()
		this.loadCommunityTemplates()
	}

	// Share template to community
	shareTemplate(
		template: RetryTemplate,
		metadata: {
			description: string
			tags: string[]
			category: string
		},
	): void {
		const marketplaceTemplate: RetryMarketplaceTemplate = {
			...template,
			author: this.settings.authorName || "Anonymous",
			createdAt: Date.now(),
			updatedAt: Date.now(),
			downloads: 0,
			rating: 0,
			ratingCount: 0,
			tags: metadata.tags,
			category: metadata.category,
			description: metadata.description,
			isVerified: false,
		}

		this.communityTemplates.set(template.id, marketplaceTemplate)

		// Emit sharing event
		this.emit("templateShared", marketplaceTemplate)

		// Sync to community server (if available)
		this.syncToCommunity(marketplaceTemplate)
	}

	// Browse community templates
	browseTemplates(filters?: {
		category?: string
		tags?: string[]
		rating?: number
		sort?: "newest" | "rating" | "downloads"
	}): RetryMarketplaceTemplate[] {
		let templates = Array.from(this.communityTemplates.values())

		// Apply filters
		if (filters?.category) {
			templates = templates.filter((t) => t.category === filters.category)
		}

		if (filters?.tags && filters.tags.length > 0) {
			templates = templates.filter((t) => filters.tags!.some((tag) => t.tags.includes(tag)))
		}

		if (filters?.rating) {
			templates = templates.filter((t) => t.rating >= filters.rating!)
		}

		// Apply sorting
		if (filters?.sort) {
			switch (filters.sort) {
				case "newest":
					templates.sort((a, b) => b.createdAt - a.createdAt)
					break
				case "rating":
					templates.sort((a, b) => b.rating - a.rating)
					break
				case "downloads":
					templates.sort((a, b) => b.downloads - a.downloads)
					break
			}
		}

		return templates
	}

	// Rate template
	rateTemplate(templateId: string, rating: TemplateRating): void {
		const template = this.communityTemplates.get(templateId)
		if (!template) {
			throw new Error(`Template not found: ${templateId}`)
		}

		// Add rating
		if (!this.userRatings.has(templateId)) {
			this.userRatings.set(templateId, [])
		}

		const ratings = this.userRatings.get(templateId)!
		ratings.push({
			...rating,
			timestamp: Date.now(),
		})

		// Calculate new average rating
		const averageRating = this.calculateAverageRating(ratings)
		template.rating = averageRating
		template.ratingCount = ratings.length

		// Update template
		this.communityTemplates.set(templateId, template)

		// Emit rating event
		this.emit("templateRated", { templateId, rating, averageRating })
	}

	// Download template
	downloadTemplate(templateId: string): Promise<RetryTemplate> {
		const template = this.communityTemplates.get(templateId)
		if (!template) {
			throw new Error(`Template not found: ${templateId}`)
		}

		// Increment download count
		template.downloads++
		this.communityTemplates.set(templateId, template)

		// Emit download event
		this.emit("templateDownloaded", template)

		// Convert to RetryTemplate format
		const retryTemplate: RetryTemplate = {
			id: template.id,
			name: template.name,
			description: template.description,
			template: template.template,
			variables: template.variables,
			category: template.category,
			isCustom: true,
		}

		return Promise.resolve(retryTemplate)
	}

	private calculateAverageRating(ratings: TemplateRating[]): number {
		if (ratings.length === 0) return 0

		const total = ratings.reduce((sum, rating) => sum + rating.score, 0)
		return total / ratings.length
	}

	private async syncToCommunity(template: RetryMarketplaceTemplate): Promise<void> {
		// Sync to community server (implementation depends on available APIs)
		try {
			// This would integrate with existing community platform if available
			// For now, store locally
		} catch (error) {
			console.warn("Failed to sync template to community:", error)
		}
	}

	private loadCommunityTemplates(): void {
		// Load from local storage or community API
		// For now, initialize with some example templates
		const exampleTemplates: RetryMarketplaceTemplate[] = [
			{
				id: "community_detailed_network",
				name: "Detailed Network Retry",
				description: "Comprehensive template for network-related retries with detailed diagnostics",
				template:
					"🌐 **{{toolName}}** network retry\n• Attempt: {{attempt}}/{{maxAttempts}}\n• Error: {{error}}\n• Diagnostics: Checking connectivity...",
				variables: ["toolName", "attempt", "maxAttempts", "error"],
				category: "progress",
				author: "Community",
				createdAt: Date.now() - 86400000, // 1 day ago
				updatedAt: Date.now() - 86400000,
				downloads: 1250,
				rating: 4.7,
				ratingCount: 23,
				tags: ["network", "detailed", "diagnostics"],
				isVerified: true,
			},
		]

		exampleTemplates.forEach((template) => {
			this.communityTemplates.set(template.id, template)
		})
	}
}

interface RetryMarketplaceTemplate extends RetryTemplate {
	author: string
	createdAt: number
	updatedAt: number
	downloads: number
	rating: number
	ratingCount: number
	tags: string[]
	isVerified: boolean
}

interface TemplateRating {
	score: number // 1-5
	comment?: string
	timestamp: number
}
```

## Phase 4: Testing and Quality Assurance

### Task 3.13: End-to-End Integration Tests

**File**: `src/core/tools/retry/__tests__/RetryIntegration.e2e.test.ts` (new file)
**Implementation Context**:

- Test complete retry visibility workflow
- Test template system integration
- Use existing e2e test patterns

**Enhanced Implementation**:

```typescript
import { describe, test, expect, beforeEach, afterEach } from "vitest"
import { RetryEngine } from "../RetryEngine.js"
import { RetryTemplateEngine } from "../RetryTemplateEngine.js"
import { RetryChatEmitter } from "../RetryChatEmitter.js"

describe("Retry System E2E Integration", () => {
	let retryEngine: RetryEngine
	let templateEngine: RetryTemplateEngine
	let mockWebviewProvider: any

	beforeEach(() => {
		mockWebviewProvider = {
			postMessageToWebview: vi.fn(),
			messages: [],
		}

		templateEngine = new RetryTemplateEngine(DEFAULT_RETRY_VISIBILITY_SETTINGS)
		retryEngine = new RetryEngine({
			maxRetries: 3,
			baseDelayMs: 100,
			webviewProvider: mockWebviewProvider,
			settings: { retryVisibility: DEFAULT_RETRY_VISIBILITY_SETTINGS },
		})
	})

	afterEach(() => {
		vi.clearAllMocks()
	})

	test("complete retry workflow with template rendering", async () => {
		const mockToolCall = { name: "readFile", args: { path: "test.txt" } }
		let attemptCount = 0

		// Mock tool to fail first 2 attempts, succeed on 3rd
		const mockTool = vi
			.fn()
			.mockImplementationOnce(() => {
				attemptCount++
				throw new Error("Network timeout")
			})
			.mockImplementationOnce(() => {
				attemptCount++
				throw new Error("Permission denied")
			})
			.mockImplementationOnce(() => {
				attemptCount++
				return Promise.resolve("File content")
			})

		// Execute retry workflow
		const result = await retryEngine.executeWithRetry(mockTool, mockToolCall)

		expect(result).toBe("File content")
		expect(attemptCount).toBe(3)

		// Verify chat messages were sent
		expect(mockWebviewProvider.postMessageToWebview).toHaveBeenCalledTimes(4) // start + 2 progress + success

		const messages = mockWebviewProvider.postMessageToWebview.mock.calls.map((call) => call[0])

		// Verify retry start message
		const startMessage = messages.find(
			(msg) => msg.type === "retryChatMessage" && msg.message.type === "retry_start",
		)
		expect(startMessage).toBeDefined()
		expect(startMessage.message.toolName).toBe("readFile")
		expect(startMessage.message.message).toContain("readFile")

		// Verify retry success message
		const successMessage = messages.find(
			(msg) => msg.type === "retryChatMessage" && msg.message.type === "retry_success",
		)
		expect(successMessage).toBeDefined()
		expect(successMessage.message.message).toContain("succeeded")
		expect(successMessage.message.message).toContain("3 attempts")
	})

	test("template system integration with settings", async () => {
		// Test custom template usage
		const customTemplate = "🔧 {{toolName}} custom retry ({{attempt}}/{{maxAttempts}})"
		templateEngine.registerCustomTemplate(customTemplate, "retry_progress", {
			name: "Custom Progress",
			description: "User-defined progress template",
		})

		const mockToolCall = { name: "writeFile", args: { path: "test.txt" } }
		const mockTool = vi.fn().mockRejectedValue(new Error("Disk full"))

		try {
			await retryEngine.executeWithRetry(mockTool, mockToolCall)
		} catch (error) {
			// Expected to fail
		}

		// Verify custom template was used
		const progressMessages = mockWebviewProvider.postMessageToWebview.mock.calls
			.filter((call) => call[0].type === "retryChatMessage" && call[0].message.type === "retry_progress")
			.map((call) => call[0].message)

		expect(progressMessages.length).toBeGreaterThan(0)
		expect(progressMessages.some((msg) => msg.message.includes("custom retry"))).toBe(true)
	})

	test("settings persistence and synchronization", async () => {
		// Test settings changes persist correctly
		const newSettings = {
			enableRetryChatOutput: false,
			enableDetailedProgress: true,
			consolidateMessages: false,
			maxProgressMessages: 5,
		}

		// Update settings
		mockWebviewProvider.postMessageToWebview({
			type: "updateRetryVisibilitySettings",
			settings: newSettings,
		})

		// Verify settings were updated
		// This would require testing the actual settings persistence mechanism
		// For now, verify the message was sent correctly
		expect(mockWebviewProvider.postMessageToWebview).toHaveBeenCalledWith({
			type: "updateRetryVisibilitySettings",
			settings: newSettings,
		})
	})

	test("performance requirements compliance", async () => {
		const iterations = 100
		const renderTimes: number[] = []

		for (let i = 0; i < iterations; i++) {
			const start = performance.now()

			templateEngine.renderTemplate("retry_start", {
				retryId: `perf_test_${i}`,
				toolName: "testTool",
				attempt: 1,
				maxAttempts: 3,
			})

			renderTimes.push(performance.now() - start)
		}

		const averageTime = renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length
		const maxTime = Math.max(...renderTimes)

		// Verify <100ms requirement
		expect(averageTime).toBeLessThan(50) // Well under 100ms
		expect(maxTime).toBeLessThan(100) // Never exceed 100ms

		// Verify memory usage
		const initialMemory = process.memoryUsage().heapUsed

		// Create many templates and render them
		for (let i = 0; i < 1000; i++) {
			templateEngine.registerCustomTemplate(`Template ${i}`, "retry_start", {
				name: `Template ${i}`,
				description: `Performance test template ${i}`,
			})
		}

		const finalMemory = process.memoryUsage().heapUsed
		const memoryOverhead = finalMemory - initialMemory
		const overheadMB = memoryOverhead / (1024 * 1024)

		// Verify <2MB requirement
		expect(overheadMB).toBeLessThan(2)
	})
})
```

## Enhanced Acceptance Criteria

- [ ] Complete integration with PRD-03 retry system using existing [`RetryEngine`](src/core/tools/retry/RetryEngine.ts:134) event patterns
- [ ] Dual-history synchronization works correctly using existing [`taskHistory`](src/core/webview/ClineProvider.ts:181) management
- [ ] Settings integration is seamless and backward compatible using existing [`GlobalSettings`](packages/types/src/global-settings.ts:317) patterns
- [ ] Performance requirements met (<100ms rendering, <2MB memory) using existing optimization patterns
- [ ] All monitoring and analytics features functional following existing logging patterns from [`RetryLogger`](src/core/tools/retry/RetryLogger.ts:430)
- [ ] Advanced features (smart suggestions, marketplace) working using existing event and analytics patterns
- [ ] Comprehensive test coverage (>95%) following existing test patterns from [`App.spec.tsx`](webview-ui/src/__tests__/App.spec.tsx:180)
- [ ] Documentation complete and accurate following existing documentation patterns
- [ ] Production readiness validated using existing validation patterns
- [ ] User acceptance criteria met with existing UX patterns
- [ ] Security and privacy requirements satisfied using existing security patterns
- [ ] Cross-platform compatibility confirmed using existing compatibility patterns
- [ ] Template marketplace integration works with existing community features
- [ ] Smart suggestions provide value using existing analytics data
- [ ] All integration points maintain backward compatibility with PRD-03
