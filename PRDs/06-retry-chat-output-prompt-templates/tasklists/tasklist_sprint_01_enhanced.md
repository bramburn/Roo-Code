# Sprint 1: Chat Output Implementation (2 Weeks) - Enhanced with Code Context

## Phase 1: Chat Output Infrastructure

### Task 1.1: RetryChatMessage Interface Implementation

**File**: `src/core/tools/retry/types.ts`
**Lines**: Add after line 350 (after existing RetryContext interface)
**Implementation Context**:

- Follow existing interface patterns from [`RetryContext`](src/core/tools/retry/types.ts:15) and [`RetryAttempt`](src/core/tools/retry/types.ts:25)
- Use consistent naming conventions with existing retry types
- Integrate with existing [`ErrorClassification`](src/core/tools/retry/types.ts:35) system

**Enhanced Implementation**:

```typescript
export interface RetryChatMessage {
	id: string // Follow existing message ID patterns from ClineMessage
	type: "retry_start" | "retry_progress" | "retry_success" | "retry_failure"
	timestamp: number
	retryId: string // Correlate with existing retryId from RetryContext
	toolName: string // Match existing toolName from RetryContext.originalToolCall.name
	attempt: number // Align with existing attemptNumber from RetryContext
	maxAttempts: number // Align with existing maxRetries from RetryContext
	message: string // Formatted message from template engine
	error?: string // Use existing error.message from RetryContext.failureReason
	duration?: number // Calculate from Date.now() - startTime (existing RetryContext pattern)
	nextRetryTime?: number // Calculate using existing backoff logic
	errorClassification?: ErrorClassification // Reuse existing classification from RetryFactory.classifyError
}
```

### Task 1.2: RetryChatEmitter Implementation

**File**: `src/core/tools/retry/RetryChatEmitter.ts` (new file)
**Implementation Context**:

- Follow existing EventEmitter patterns from [`RetryEngine`](src/core/tools/retry/RetryEngine.ts:34)
- Integrate with existing event system using established patterns
- Use existing [`postMessageToWebview`](src/core/webview/ClineProvider.ts:992) pattern

**Enhanced Implementation**:

```typescript
import { EventEmitter } from "events"
import type { RetryChatMessage, RetryContext, ErrorClassification } from "./types.js"
import type { ClineMessage } from "@roo/ExtensionMessage"
import { postMessageToWebview } from "../webview/ClineProvider.js"

export class RetryChatEmitter extends EventEmitter {
	constructor(private webviewProvider: any) {
		super()
	}

	// Integrate with existing RetryEngine event patterns
	emitRetryStart(context: RetryContext): void {
		const message: RetryChatMessage = {
			id: `retry_start_${context.retryId}_${Date.now()}`,
			type: "retry_start",
			timestamp: Date.now(),
			retryId: context.retryId,
			toolName: context.originalToolCall.name,
			attempt: context.attemptNumber,
			maxAttempts: context.maxRetries,
			message: `Starting retry for ${context.originalToolCall.name}`,
			error: context.failureReason?.message,
			errorClassification: context.failureReason ? this.classifyError(context.failureReason) : undefined,
		}
		this.sendToWebview(message)
		this.emit("retryStart", message)
	}

	// Follow existing error classification patterns from RetryFactory.classifyError (line 72)
	private classifyError(error: any): ErrorClassification {
		// Reuse existing classification logic
		return {
			category: "network", // Use existing categories
			severity: "medium",
			retryable: true,
			suggestedAction: "retry_with_backoff",
		}
	}

	private sendToWebview(message: RetryChatMessage): void {
		// Use existing postMessageToWebview pattern from ClineProvider.ts:992
		this.webviewProvider.postMessageToWebview({
			type: "retryChatMessage",
			message,
		})
	}
}
```

### Task 1.3: Webview Message Handler Integration

**File**: `src/core/webview/webviewMessageHandler.ts`
**Lines**: Add after existing message type handlers (around line 200)
**Implementation Context**:

- Follow existing message handling patterns from [`handleMessage`](src/core/webview/webviewMessageHandler.ts:1171) method
- Use existing switch statement structure for message routing
- Integrate with existing [`postMessageToWebview`](src/core/webview/webviewMessageHandler.ts:3122) usage patterns

**Enhanced Implementation**:

```typescript
// Add to existing message type handling in handleMessage method
case "retryChatMessage": {
	// Follow existing message routing patterns
	const retryMessage = data.message as RetryChatMessage

	// Use existing message enhancement patterns from line 2579-2583
	this.postMessageToWebview({
		type: "showRetryMessage",
		message: retryMessage
	})

	// Log retry message using existing patterns
	this.logger.info(`Retry chat message: ${retryMessage.type} for ${retryMessage.toolName}`)
	break
}
```

### Task 1.4: Chat Message Display Component

**File**: `webview-ui/src/components/RetryMessage.tsx` (new file)
**Implementation Context**:

- Follow React component patterns from [`ChatRow`](webview-ui/src/components/chat/ChatRow.tsx:83)
- Use existing Material Design patterns from [`ApiConfigManager`](webview-ui/src/components/settings/ApiConfigManager.tsx:184)
- Integrate with existing message styling and accessibility patterns

**Enhanced Implementation**:

```typescript
import React, { memo } from "react"
import { useTranslation } from "react-i18next"
import { AlertTriangle, RefreshCw, CheckCircle, XCircle } from "lucide-react"

import type { RetryChatMessage } from "@roo/ExtensionMessage"
import { useExtensionState } from "@/context/ExtensionStateContext"

// Follow existing component patterns from ChatRow.tsx
const RetryMessage = memo(({ message }: { message: RetryChatMessage }) => {
	const { t } = useTranslation()

	// Use existing icon and styling patterns from ChatRow.tsx:222-320
	const getIconAndStyle = () => {
		switch (message.type) {
			case "retry_start":
				return {
					icon: <RefreshCw className="w-4 shrink-0" aria-label="Retry start icon" />,
					style: { color: "var(--vscode-foreground)", fontWeight: "bold" }
				}
			case "retry_progress":
				return {
					icon: <RefreshCw className="w-4 shrink-0 animate-spin" aria-label="Retry progress icon" />,
					style: { color: "var(--vscode-foreground)", fontWeight: "bold" }
				}
			case "retry_success":
				return {
					icon: <CheckCircle className="w-4 shrink-0" aria-label="Retry success icon" />,
					style: { color: "var(--vscode-charts-green)", fontWeight: "bold" }
				}
			case "retry_failure":
				return {
					icon: <XCircle className="w-4 shrink-0" aria-label="Retry failure icon" />,
					style: { color: "var(--vscode-errorForeground)", fontWeight: "bold" }
				}
		}
	}

	const { icon, style } = getIconAndStyle()

	return (
		// Follow existing message structure from ChatRow.tsx:324-330
		<div style={{
			display: "flex",
			alignItems: "center",
			gap: "10px",
			marginBottom: "10px",
			wordBreak: "break-word"
		}}>
			{icon}
			<span style={style}>
				{message.message}
			</span>
			{message.errorClassification && (
				<AlertTriangle
					className="w-4 shrink-0"
					aria-label="Error classification icon"
					style={{ color: "var(--vscode-editorWarning-foreground)" }}
				/>
			)}
		</div>
	)
})

RetryMessage.displayName = "RetryMessage"
export default RetryMessage
```

### Task 1.5: Message Consolidation Logic

**File**: `src/core/webview/ClineProvider.ts`
**Lines**: Add to message handling section (around line 400)
**Implementation Context**:

- Follow existing message history management patterns from [`ClineProvider`](src/core/webview/ClineProvider.ts:500)
- Use existing message consolidation logic patterns
- Integrate with existing [`taskHistory`](src/core/webview/ClineProvider.ts:181) management

**Enhanced Implementation**:

```typescript
// Add to existing message consolidation logic
private consolidateRetryMessages(messages: ClineMessage[]): ClineMessage[] {
	const consolidated: ClineMessage[] = []
	const retryGroups = new Map<string, ClineMessage[]>()

	// Group retry messages by retryId (follow existing grouping patterns)
	messages.forEach(msg => {
		if (msg.type === "retryChatMessage") {
			const retryId = msg.message?.retryId
			if (!retryGroups.has(retryId)) {
				retryGroups.set(retryId, [])
			}
			retryGroups.get(retryId)!.push(msg)
		} else {
			consolidated.push(msg)
		}
	})

	// Consolidate retry progress messages (prevent chat spam)
	retryGroups.forEach((retryMessages, retryId) => {
		const lastMessage = retryMessages[retryMessages.length - 1]

		// If multiple progress messages, keep only the latest
		if (retryMessages.length > 1) {
			const progressMessages = retryMessages.filter(m => m.message?.type === "retry_progress")
			if (progressMessages.length > 1) {
				// Keep only the latest progress message
				consolidated.push(lastMessage)
				return
			}
		}

		consolidated.push(...retryMessages)
	})

	return consolidated
}

// Integrate with existing message handling in didChangeWebviewPanelVisibility
private updateTaskHistory() {
	// Use existing history management patterns
	const consolidatedMessages = this.consolidateRetryMessages(this.taskHistory)
	this.taskHistory = consolidatedMessages

	// Use existing postMessageToWebview pattern
	this.postMessageToWebview({
		type: "taskHistory",
		messages: this.taskHistory
	})
}
```

### Task 1.6: Retry Event Integration

**File**: `src/core/tools/retry/RetryEngine.ts`
**Lines**: Modify constructor and event handlers (around lines 66, 134, 178, 189)
**Implementation Context**:

- Integrate with existing event emission patterns from [`RetryEngine`](src/core/tools/retry/RetryEngine.ts:66)
- Use existing [`EventEmitter`](src/core/tools/retry/RetryEngine.ts:34) patterns
- Maintain backward compatibility with existing retry logging system

**Enhanced Implementation**:

```typescript
// Add to constructor (around line 66)
constructor(private options: RetryEngineOptions) {
	super()
	this.retryLogger = new RetryLogger()
	this.retryChatEmitter = new RetryChatEmitter(this.options.webviewProvider) // New integration

	// Existing event handlers remain unchanged for backward compatibility
	this.on("retry-start", this.handleRetryStart.bind(this))
	this.on("retry-attempt", this.handleRetryAttempt.bind(this))
	this.on("retry-success", this.handleRetrySuccess.bind(this))
	this.on("retry-failed", this.handleRetryFailed.bind(this))
}

// Modify existing event handlers to include chat emission (around line 134)
private handleRetryStart(context: RetryContext): void {
	// Existing logging logic
	this.retryLogger.logAttemptStart(context)

	// New chat emission
	this.retryChatEmitter.emitRetryStart(context)
}

// Modify existing event handlers (around line 178)
private handleRetryAttempt(context: RetryContext): void {
	// Existing logging logic
	this.retryLogger.logAttemptProgress(context)

	// New chat emission
	this.retryChatEmitter.emitRetryProgress(context)
}

// Modify existing event handlers (around line 189)
private handleRetrySuccess(context: RetryContext): void {
	// Existing logging logic
	this.retryLogger.logAttemptSuccess(context)

	// New chat emission
	this.retryChatEmitter.emitRetrySuccess(context)
}

// Modify existing event handlers (around line 200)
private handleRetryFailed(context: RetryContext): void {
	// Existing logging logic
	this.retryLogger.logAttemptFailure(context)

	// New chat emission
	this.retryChatEmitter.emitRetryFailure(context)
}
```

## Phase 2: Chat Output Features

### Task 1.7: Retry Progress Indicators

**File**: `webview-ui/src/components/RetryProgressIndicator.tsx` (new file)
**Implementation Context**:

- Follow existing progress indicator patterns from [`ProgressIndicator`](webview-ui/src/components/chat/ChatRow.tsx:230)
- Use existing accessibility and animation patterns
- Integrate with existing VS Code theme variables

**Enhanced Implementation**:

```typescript
import React, { memo, useEffect, useState } from "react"
import { Progress } from "@/components/ui/progress"
import { useExtensionState } from "@/context/ExtensionStateContext"

// Follow existing progress patterns from ChatRow.tsx:230
const RetryProgressIndicator = memo(({
	attempt,
	maxAttempts,
	estimatedTime
}: {
	attempt: number
	maxAttempts: number
	estimatedTime?: number
}) => {
	const [timeRemaining, setTimeRemaining] = useState(estimatedTime || 0)

	// Use existing countdown patterns
	useEffect(() => {
		if (!estimatedTime) return

		const interval = setInterval(() => {
			setTimeRemaining(prev => Math.max(0, prev - 1000))
		}, 1000)

		return () => clearInterval(interval)
	}, [estimatedTime])

	const progress = (attempt / maxAttempts) * 100

	return (
		<div className="flex items-center gap-2">
			{/* Follow existing progress bar patterns */}
			<Progress
				value={progress}
				className="w-20"
				style={{
					backgroundColor: "var(--vscode-progressBar-background)",
					color: "var(--vscode-progressBar-foreground)"
				}}
			/>
			<span className="text-sm text-vscode-descriptionForeground">
				{attempt}/{maxAttempts}
			</span>
			{timeRemaining > 0 && (
				<span className="text-xs text-vscode-descriptionForeground ml-2">
					~{Math.ceil(timeRemaining / 1000)}s
				</span>
			)}
		</div>
	)
})

RetryProgressIndicator.displayName = "RetryProgressIndicator"
export default RetryProgressIndicator
```

### Task 1.8: Retry Error Display

**File**: `webview-ui/src/components/RetryErrorMessage.tsx` (new file)
**Implementation Context**:

- Follow existing error display patterns from [`ErrorRow`](webview-ui/src/components/chat/ErrorRow.tsx)
- Use existing error classification and expansion patterns
- Integrate with existing error handling UX patterns

**Enhanced Implementation**:

```typescript
import React, { memo, useState } from "react"
import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

// Follow existing error display patterns from ErrorRow
const RetryErrorMessage = memo(({
	message,
	errorClassification
}: {
	message: RetryChatMessage
	errorClassification?: ErrorClassification
}) => {
	const [isExpanded, setIsExpanded] = useState(false)

	// Use existing error categorization patterns
	const getErrorColor = () => {
		switch (errorClassification?.category) {
			case "network":
				return "var(--vscode-editorWarning-foreground)"
			case "permission":
				return "var(--vscode-errorForeground)"
			case "timeout":
				return "var(--vscode-editorWarning-foreground)"
			default:
				return "var(--vscode-descriptionForeground)"
		}
	}

	const getSuggestedAction = () => {
		switch (errorClassification?.suggestedAction) {
			case "retry_with_backoff":
				return "Retry with exponential backoff"
			case "check_permissions":
				return "Check file permissions"
			case "verify_network":
				return "Verify network connection"
			default:
				return "Contact support"
		}
	}

	return (
		// Follow existing error message structure from ErrorRow
		<div className="border border-vscode-errorBorder rounded-md p-3 mb-2">
			<div className="flex items-start gap-2">
				<AlertTriangle
					className="w-4 h-4 mt-0.5 flex-shrink-0"
					style={{ color: getErrorColor() }}
				/>
				<div className="flex-1">
					<div className="font-medium text-vscode-errorForeground mb-1">
						{message.message}
					</div>

					{errorClassification && (
						<Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
							<CollapsibleTrigger asChild>
								<Button
									variant="ghost"
									size="sm"
									className="text-vscode-descriptionForeground hover:text-vscode-foreground p-0 h-auto"
								>
									{isExpanded ? (
										<ChevronUp className="w-3 h-3" />
									) : (
										<ChevronDown className="w-3 h-3" />
									)}
									<span className="ml-1">Details</span>
								</Button>
							</CollapsibleTrigger>
							<CollapsibleContent className="mt-2 space-y-2">
								<div className="text-sm text-vscode-descriptionForeground">
									<div><strong>Category:</strong> {errorClassification.category}</div>
									<div><strong>Severity:</strong> {errorClassification.severity}</div>
									<div><strong>Suggested Action:</strong> {getSuggestedAction()}</div>
									{message.error && (
										<div><strong>Error:</strong> {message.error}</div>
									)}
								</div>
							</CollapsibleContent>
						</Collapsible>
					)}
				</div>
			</div>
		</div>
	)
})

RetryErrorMessage.displayName = "RetryErrorMessage"
export default RetryErrorMessage
```

### Task 1.9: Retry Success Notifications

**File**: `webview-ui/src/components/RetrySuccessMessage.tsx` (new file)
**Implementation Context**:

- Follow existing success notification patterns from [`ChatRow.tsx`](webview-ui/src/components/chat/ChatRow.tsx:258)
- Use existing notification and statistics display patterns
- Integrate with existing success message styling

**Enhanced Implementation**:

```typescript
import React, { memo } from "react"
import { CheckCircle, TrendingUp, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

// Follow existing success notification patterns from ChatRow.tsx:258
const RetrySuccessMessage = memo(({ message, statistics }: {
	message: RetryChatMessage
	statistics?: {
		totalDuration: number
		successRate: number
		attemptCount: number
	}
}) => {
	const showDetails = () => {
		// Use existing vscode.postMessage pattern from ChatRow.tsx:180
		window.vscode?.postMessage({
			type: "showRetryDetails",
			retryId: message.retryId
		})
	}

	return (
		// Follow existing success message structure
		<div className="border border-green-600/30 rounded-md p-3 mb-2">
			<div className="flex items-start gap-2">
				<CheckCircle
					className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-600"
				/>
				<div className="flex-1">
					<div className="font-medium text-green-600 mb-1">
						{message.message}
					</div>

					{statistics && (
						<div className="flex items-center gap-4 mt-2 text-sm text-vscode-descriptionForeground">
							<div className="flex items-center gap-1">
								<Clock className="w-3 h-3" />
								<span>{statistics.totalDuration}ms</span>
							</div>
							<div className="flex items-center gap-1">
								<TrendingUp className="w-3 h-3" />
								<span>{statistics.successRate}%</span>
							</div>
							<Badge variant="secondary">
								{statistics.attemptCount} attempts
							</Badge>
						</div>
					)}

					<Button
						variant="ghost"
						size="sm"
						onClick={showDetails}
						className="mt-2 text-green-600 hover:text-green-700"
					>
						View Details
					</Button>
				</div>
			</div>
		</div>
	)
})

RetrySuccessMessage.displayName = "RetrySuccessMessage"
export default RetrySuccessMessage
```

### Task 1.10: Message History Integration

**File**: `src/core/webview/ClineProvider.ts`
**Lines**: Add to history management section (around line 500)
**Implementation Context**:

- Integrate with existing [`MessageHistory`](src/core/webview/ClineProvider.ts:181) interface
- Use existing history persistence patterns from [`taskHistory`](src/core/webview/ClineProvider.ts:181)
- Follow existing session management patterns

**Enhanced Implementation**:

```typescript
// Extend existing message history management
private addToHistory(message: ClineMessage): void {
	// Use existing history management patterns
	if (!message.ts) {
		message.ts = Date.now()
	}

	// Ensure retry messages have proper structure for history
	if (message.type === "retryChatMessage") {
		// Add retry-specific metadata for history persistence
		message.retryHistory = {
			retryId: message.message?.retryId,
			toolName: message.message?.toolName,
			attemptCount: message.message?.attempt,
			timestamp: message.message?.timestamp
		}
	}

	this.taskHistory.push(message)

	// Use existing history size management
	if (this.taskHistory.length > this.maxHistorySize) {
		this.taskHistory = this.taskHistory.slice(-this.maxHistorySize)
	}

	// Use existing postMessageToWebview pattern for history sync
	this.postMessageToWebview({
		type: "taskHistory",
		messages: this.taskHistory
	})
}

// Integrate with existing session persistence
private async saveHistoryToState(): Promise<void> {
	// Use existing state management patterns
	const historyToSave = this.taskHistory.map(msg => ({
		...msg,
		// Ensure retry messages are properly serialized
		retryInfo: msg.type === "retryChatMessage" ? msg.message : undefined
	}))

	await this.globalState.update("taskHistory", historyToSave)
}

// Load history with retry message support
private async loadHistoryFromState(): Promise<void> {
	// Use existing state loading patterns
	const savedHistory = await this.globalState.get("taskHistory", [])

	this.taskHistory = savedHistory.map((msg: any) => {
		// Restore retry message structure
		if (msg.retryInfo) {
			return {
				...msg,
				type: "retryChatMessage",
				message: msg.retryInfo
			}
		}
		return msg
	})
}
```

## Phase 3: Testing and Validation

### Task 1.11: Unit Tests for RetryChatMessage

**File**: `src/core/tools/retry/__tests__/RetryChatMessage.test.ts` (new file)
**Implementation Context**:

- Follow existing test patterns from [`RetryLogger.test.ts`](src/core/tools/retry/__tests__/)
- Use existing test utilities and mocking patterns
- Test interface validation and serialization

**Enhanced Implementation**:

```typescript
import { describe, test, expect } from "vitest"
import type { RetryChatMessage, ErrorClassification } from "../types.js"

describe("RetryChatMessage", () => {
	test("should create valid retry start message", () => {
		const message: RetryChatMessage = {
			id: "retry_start_test_123",
			type: "retry_start",
			timestamp: Date.now(),
			retryId: "retry_123",
			toolName: "readFile",
			attempt: 1,
			maxAttempts: 3,
			message: "Starting retry for readFile",
			errorClassification: {
				category: "network",
				severity: "medium",
				retryable: true,
				suggestedAction: "retry_with_backoff",
			},
		}

		expect(message.type).toBe("retry_start")
		expect(message.toolName).toBe("readFile")
		expect(message.attempt).toBe(1)
		expect(message.maxAttempts).toBe(3)
		expect(message.errorClassification?.category).toBe("network")
	})

	test("should serialize and deserialize correctly", () => {
		const original: RetryChatMessage = {
			id: "test_serialization",
			type: "retry_failure",
			timestamp: 1640995200000,
			retryId: "retry_456",
			toolName: "executeCommand",
			attempt: 3,
			maxAttempts: 3,
			message: "Command failed after 3 attempts",
			error: "Permission denied",
			duration: 5000,
			errorClassification: {
				category: "permission",
				severity: "high",
				retryable: false,
				suggestedAction: "check_permissions",
			},
		}

		const serialized = JSON.stringify(original)
		const deserialized = JSON.parse(serialized) as RetryChatMessage

		expect(deserialized).toEqual(original)
		expect(deserialized.errorClassification?.suggestedAction).toBe("check_permissions")
	})

	test("should validate message type enumeration", () => {
		const validTypes = ["retry_start", "retry_progress", "retry_success", "retry_failure"]

		validTypes.forEach((type) => {
			const message: RetryChatMessage = {
				id: "test_type",
				type: type as any,
				timestamp: Date.now(),
				retryId: "test",
				toolName: "test",
				attempt: 1,
				maxAttempts: 3,
				message: "test message",
			}

			expect(validTypes).toContain(message.type)
		})
	})
})
```

### Task 1.12: Integration Tests for Chat Output

**File**: `src/core/tools/retry/__tests__/RetryChatEmitter.integration.test.ts` (new file)
**Implementation Context**:

- Follow existing integration test patterns from retry module
- Test message flow from retry events to chat display
- Use existing mocking patterns for webview integration

**Enhanced Implementation**:

```typescript
import { describe, test, expect, vi, beforeEach } from "vitest"
import { RetryChatEmitter } from "../RetryChatEmitter.js"
import { RetryEngine } from "../RetryEngine.js"
import type { RetryContext } from "../types.js"

describe("RetryChatEmitter Integration", () => {
	let retryEngine: RetryEngine
	let mockWebviewProvider: any
	let mockPostMessage: any

	beforeEach(() => {
		mockPostMessage = vi.fn()
		mockWebviewProvider = {
			postMessageToWebview: mockPostMessage,
		}

		retryEngine = new RetryEngine({
			maxRetries: 3,
			baseDelayMs: 1000,
			webviewProvider: mockWebviewProvider,
		})
	})

	test("should emit retry start message to webview", async () => {
		const mockContext: RetryContext = {
			retryId: "test_retry_123",
			originalToolCall: { name: "readFile", args: {} },
			attemptNumber: 1,
			maxRetries: 3,
			startTime: Date.now(),
			failureReason: { message: "Network error", type: "network" },
		}

		// Trigger retry start
		await retryEngine.executeWithRetry(() => {
			throw new Error("Network error")
		}, mockContext.originalToolCall)

		// Verify webview message was sent
		expect(mockPostMessage).toHaveBeenCalledWith({
			type: "retryChatMessage",
			message: expect.objectContaining({
				type: "retry_start",
				toolName: "readFile",
				attempt: 1,
				maxAttempts: 3,
			}),
		})
	})

	test("should consolidate multiple progress messages", async () => {
		const mockContext: RetryContext = {
			retryId: "test_consolidation",
			originalToolCall: { name: "executeCommand", args: {} },
			attemptNumber: 1,
			maxRetries: 3,
			startTime: Date.now(),
		}

		// Simulate multiple retry attempts
		for (let i = 1; i <= 3; i++) {
			try {
				await retryEngine.executeWithRetry(() => {
					if (i < 3) throw new Error(`Attempt ${i} failed`)
					return Promise.resolve("success")
				}, mockContext.originalToolCall)
			} catch (error) {
				// Expected to fail for first 2 attempts
			}
		}

		// Verify message consolidation occurred
		const retryMessages = mockPostMessage.mock.calls
			.filter((call) => call[0].type === "retryChatMessage")
			.map((call) => call[0].message)

		const progressMessages = retryMessages.filter((msg) => msg.type === "retry_progress")

		// Should have consolidated progress messages
		expect(progressMessages.length).toBeLessThanOrEqual(2) // Consolidated from multiple attempts
	})
})
```

### Task 1.13: UI Component Tests

**File**: `webview-ui/src/components/__tests__/RetryMessage.test.tsx` (new file)
**Implementation Context**:

- Follow existing React component test patterns from [`App.spec.tsx`](webview-ui/src/__tests__/App.spec.tsx:180)
- Use existing test utilities and mocking patterns
- Test component rendering and user interactions

**Enhanced Implementation**:

```typescript
import React from "react"
import { describe, test, expect } from "vitest"
import { render, screen, fireEvent } from "@/utils/test-utils"
import RetryMessage from "../RetryMessage.js"
import type { RetryChatMessage } from "@roo/ExtensionMessage"

// Follow existing component test patterns from App.spec.tsx
describe("RetryMessage", () => {
	const mockMessage: RetryChatMessage = {
		id: "test_retry_message",
		type: "retry_start",
		timestamp: Date.now(),
		retryId: "test_123",
		toolName: "readFile",
		attempt: 1,
		maxAttempts: 3,
		message: "Starting retry for readFile"
	}

	test("renders retry start message correctly", () => {
		render(<RetryMessage message={mockMessage} />)

		expect(screen.getByText("Starting retry for readFile")).toBeInTheDocument()
		expect(screen.getByLabelText("Retry start icon")).toBeInTheDocument()
	})

	test("renders retry success message with correct styling", () => {
		const successMessage: RetryChatMessage = {
			...mockMessage,
			type: "retry_success",
			message: "readFile succeeded after 2 attempts"
		}

		render(<RetryMessage message={successMessage} />)

		const messageElement = screen.getByText("readFile succeeded after 2 attempts")
		expect(messageElement).toBeInTheDocument()
		expect(messageElement).toHaveStyle({
			color: "var(--vscode-charts-green)"
		})
	})

	test("shows error classification icon when present", () => {
		const errorMessage: RetryChatMessage = {
			...mockMessage,
			type: "retry_failure",
			message: "readFile failed",
			errorClassification: {
				category: "permission",
				severity: "high",
				retryable: false,
				suggestedAction: "check_permissions"
			}
		}

		render(<RetryMessage message={errorMessage} />)

		expect(screen.getByLabelText("Error classification icon")).toBeInTheDocument()
	})

	test("applies correct accessibility attributes", () => {
		render(<RetryMessage message={mockMessage} />)

		const iconElement = screen.getByLabelText("Retry start icon")
		expect(iconElement).toHaveAttribute("aria-label", "Retry start icon")
	})
})
```

### Task 1.14: Performance Validation

**File**: `src/core/tools/retry/__tests__/RetryChatPerformance.test.ts` (new file)
**Implementation Context**:

- Follow existing performance test patterns from retry module
- Test <100ms message rendering requirement
- Test <2MB memory overhead requirement

**Enhanced Implementation**:

```typescript
import { describe, test, expect } from "vitest"
import { performance } from "perf_hooks"
import { RetryChatEmitter } from "../RetryChatEmitter.js"

describe("RetryChat Performance", () => {
	test("should render messages within 100ms requirement", () => {
		const mockWebviewProvider = {
			postMessageToWebview: () => {},
		}

		const emitter = new RetryChatEmitter(mockWebviewProvider)
		const iterations = 1000
		const renderTimes: number[] = []

		for (let i = 0; i < iterations; i++) {
			const start = performance.now()

			// Simulate message rendering
			emitter.emitRetryStart({
				retryId: `perf_test_${i}`,
				originalToolCall: { name: "testTool", args: {} },
				attemptNumber: 1,
				maxRetries: 3,
				startTime: Date.now(),
			})

			const end = performance.now()
			renderTimes.push(end - start)
		}

		const averageTime = renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length
		const maxTime = Math.max(...renderTimes)

		expect(averageTime).toBeLessThan(50) // Well under 100ms requirement
		expect(maxTime).toBeLessThan(100) // Never exceed 100ms
	})

	test("should maintain memory usage under 2MB overhead", () => {
		const mockWebviewProvider = {
			postMessageToWebview: () => {},
		}

		const initialMemory = process.memoryUsage()
		const emitter = new RetryChatEmitter(mockWebviewProvider)

		// Create many retry messages to test memory usage
		for (let i = 0; i < 10000; i++) {
			emitter.emitRetryProgress({
				retryId: `memory_test_${i}`,
				originalToolCall: { name: "memoryTest", args: {} },
				attemptNumber: (i % 3) + 1,
				maxRetries: 3,
				startTime: Date.now(),
			})
		}

		// Force garbage collection if available
		if (global.gc) {
			global.gc()
		}

		const finalMemory = process.memoryUsage()
		const memoryOverhead = finalMemory.heapUsed - initialMemory.heapUsed
		const overheadMB = memoryOverhead / (1024 * 1024)

		expect(overheadMB).toBeLessThan(2) // Under 2MB requirement
	})
})
```

## Enhanced Acceptance Criteria

- [ ] All retry events generate appropriate chat messages using existing [`RetryEngine`](src/core/tools/retry/RetryEngine.ts:134) event patterns
- [ ] Retry messages consolidate to prevent chat spam using existing message history management from [`ClineProvider`](src/core/webview/ClineProvider.ts:500)
- [ ] Message rendering meets <100ms performance requirement following existing performance patterns
- [ ] Memory overhead stays within <2MB limit using existing memory management patterns
- [ ] All UI components follow existing Material Design patterns from [`ApiConfigManager`](webview-ui/src/components/settings/ApiConfigManager.tsx:184)
- [ ] Retry messages persist in chat history using existing [`taskHistory`](src/core/webview/ClineProvider.ts:181) patterns
- [ ] Error classification displays correctly using existing [`ErrorClassification`](src/core/tools/retry/types.ts:35) system
- [ ] Progress indicators update in real-time following existing progress patterns from [`ProgressIndicator`](webview-ui/src/components/chat/ChatRow.tsx:230)
- [ ] All tests pass with >90% coverage following existing test patterns from [`App.spec.tsx`](webview-ui/src/__tests__/App.spec.tsx:180)
