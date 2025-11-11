import { AIMessage, HumanMessage } from "@langchain/core/messages"
import { Task } from "../core/task/Task"
import { TransitionalExecutor, ToolExecutionContext } from "./TransitionalExecutor"
import { AskApproval, HandleError, PushToolResult, RemoveClosingTag } from "../shared/tools"
import { globalToolWrapperRegistry } from "../tools/registry/ToolWrapperRegistry"

/**
 * Message types for task loop communication
 */
export interface TaskLoopMessage {
	id: string
	type: "ai_message" | "tool_result" | "error" | "completion"
	timestamp: Date
	content: any
	metadata?: Record<string, any>
}

/**
 * Task execution state
 */
export interface TaskExecutionState {
	taskId: string
	messages: TaskLoopMessage[]
	currentStep: number
	totalSteps?: number
	isCompleted: boolean
	hasErrors: boolean
	startTime: Date
	endTime?: Date
}

/**
 * Bridge between LangGraph message flow and existing task loop
 */
export class TaskLoopBridge {
	private transitionalExecutor: TransitionalExecutor
	private activeTasks: Map<string, TaskExecutionState> = new Map()
	private messageHandlers: Map<string, (message: TaskLoopMessage) => void> = new Map()

	constructor(transitionalExecutor?: TransitionalExecutor) {
		this.transitionalExecutor = transitionalExecutor || new TransitionalExecutor(globalToolWrapperRegistry)
	}

	/**
	 * Process an AI message with tool calls and bridge to task loop
	 */
	async processAIMessage(
		aiMessage: AIMessage,
		context: ToolExecutionContext,
		taskId: string,
	): Promise<TaskLoopMessage[]> {
		const messages: TaskLoopMessage[] = []
		const taskState = this.getOrCreateTaskState(taskId)

		// Create AI message record
		const aiMessageRecord: TaskLoopMessage = {
			id: this.generateMessageId(),
			type: "ai_message",
			timestamp: new Date(),
			content: {
				text: aiMessage.content as string,
				toolCalls: aiMessage.tool_calls || [],
			},
			metadata: {
				step: taskState.currentStep,
				hasToolCalls: !!(aiMessage.tool_calls && aiMessage.tool_calls.length > 0),
			},
		}
		messages.push(aiMessageRecord)
		taskState.messages.push(aiMessageRecord)

		// Execute tool calls if present
		if (aiMessage.tool_calls && aiMessage.tool_calls.length > 0) {
			try {
				const toolResults = await this.transitionalExecutor.executeToolCalls(aiMessage, context)

				for (const result of toolResults) {
					const toolMessage: TaskLoopMessage = {
						id: this.generateMessageId(),
						type: result.success ? "tool_result" : "error",
						timestamp: new Date(),
						content: {
							toolName: result.toolName,
							result: result.result,
							error: result.error,
							executionTime: result.executionTime,
						},
						metadata: {
							success: result.success,
							step: taskState.currentStep,
						},
					}
					messages.push(toolMessage)
					taskState.messages.push(toolMessage)

					if (!result.success) {
						taskState.hasErrors = true
					}
				}

				// Notify message handlers
				this.notifyHandlers(toolMessage)
			} catch (error) {
				const errorMessage: TaskLoopMessage = {
					id: this.generateMessageId(),
					type: "error",
					timestamp: new Date(),
					content: {
						error: error instanceof Error ? error.message : "Unknown error",
						context: "tool_execution",
					},
					metadata: {
						step: taskState.currentStep,
					},
				}
				messages.push(errorMessage)
				taskState.messages.push(errorMessage)
				taskState.hasErrors = true

				this.notifyHandlers(errorMessage)
			}
		}

		// Update task state
		taskState.currentStep++
		this.updateTaskState(taskId, taskState)

		return messages
	}

	/**
	 * Process a human message and update task state
	 */
	processHumanMessage(humanMessage: HumanMessage, taskId: string): TaskLoopMessage {
		const taskState = this.getOrCreateTaskState(taskId)

		const message: TaskLoopMessage = {
			id: this.generateMessageId(),
			type: "ai_message", // Reuse ai_message type for human messages
			timestamp: new Date(),
			content: {
				text: humanMessage.content as string,
				isHuman: true,
			},
			metadata: {
				step: taskState.currentStep,
			},
		}

		taskState.messages.push(message)
		this.updateTaskState(taskId, taskState)

		this.notifyHandlers(message)

		return message
	}

	/**
	 * Mark a task as completed
	 */
	completeTask(taskId: string, finalResult?: any): TaskLoopMessage {
		const taskState = this.activeTasks.get(taskId)
		if (!taskState) {
			throw new Error(`Task ${taskId} not found`)
		}

		taskState.isCompleted = true
		taskState.endTime = new Date()

		const completionMessage: TaskLoopMessage = {
			id: this.generateMessageId(),
			type: "completion",
			timestamp: new Date(),
			content: {
				result: finalResult,
				duration: taskState.endTime.getTime() - taskState.startTime.getTime(),
				totalSteps: taskState.currentStep,
				hasErrors: taskState.hasErrors,
			},
			metadata: {
				taskCompleted: true,
			},
		}

		taskState.messages.push(completionMessage)
		this.updateTaskState(taskId, taskState)

		this.notifyHandlers(completionMessage)

		return completionMessage
	}

	/**
	 * Get or create task execution state
	 */
	private getOrCreateTaskState(taskId: string): TaskExecutionState {
		let taskState = this.activeTasks.get(taskId)

		if (!taskState) {
			taskState = {
				taskId,
				messages: [],
				currentStep: 0,
				isCompleted: false,
				hasErrors: false,
				startTime: new Date(),
			}
			this.activeTasks.set(taskId, taskState)
		}

		return taskState
	}

	/**
	 * Update task execution state
	 */
	private updateTaskState(taskId: string, state: TaskExecutionState): void {
		this.activeTasks.set(taskId, state)
	}

	/**
	 * Generate unique message ID
	 */
	private generateMessageId(): string {
		return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
	}

	/**
	 * Register message handler
	 */
	public registerMessageHandler(id: string, handler: (message: TaskLoopMessage) => void): void {
		this.messageHandlers.set(id, handler)
	}

	/**
	 * Unregister message handler
	 */
	public unregisterMessageHandler(id: string): void {
		this.messageHandlers.delete(id)
	}

	/**
	 * Notify all message handlers
	 */
	private notifyHandlers(message: TaskLoopMessage): void {
		for (const handler of this.messageHandlers.values()) {
			try {
				handler(message)
			} catch (error) {
				console.error("Error in message handler:", error)
			}
		}
	}

	/**
	 * Get task execution state
	 */
	public getTaskState(taskId: string): TaskExecutionState | undefined {
		return this.activeTasks.get(taskId)
	}

	/**
	 * Get all active tasks
	 */
	public getActiveTasks(): TaskExecutionState[] {
		return Array.from(this.activeTasks.values())
	}

	/**
	 * Get completed tasks
	 */
	public getCompletedTasks(): TaskExecutionState[] {
		return this.getActiveTasks().filter((task) => task.isCompleted)
	}

	/**
	 * Get task messages
	 */
	public getTaskMessages(taskId: string): TaskLoopMessage[] {
		const taskState = this.activeTasks.get(taskId)
		return taskState ? taskState.messages : []
	}

	/**
	 * Get recent messages across all tasks
	 */
	public getRecentMessages(limit: number = 50): TaskLoopMessage[] {
		const allMessages: TaskLoopMessage[] = []

		for (const taskState of this.activeTasks.values()) {
			allMessages.push(...taskState.messages)
		}

		// Sort by timestamp and limit
		return allMessages.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, limit)
	}

	/**
	 * Clear completed tasks
	 */
	public clearCompletedTasks(): void {
		for (const [taskId, taskState] of this.activeTasks.entries()) {
			if (taskState.isCompleted) {
				this.activeTasks.delete(taskId)
			}
		}
	}

	/**
	 * Get task statistics
	 */
	public getTaskStatistics(): {
		totalTasks: number
		activeTasks: number
		completedTasks: number
		tasksWithErrors: number
		averageTaskDuration: number
		totalMessages: number
		messagesByType: Record<string, number>
	} {
		const allTasks = this.getActiveTasks()
		const completedTasks = allTasks.filter((task) => task.isCompleted)
		const tasksWithErrors = allTasks.filter((task) => task.hasErrors)

		// Calculate average duration for completed tasks
		const totalDuration = completedTasks.reduce((sum, task) => {
			if (task.endTime) {
				return sum + (task.endTime.getTime() - task.startTime.getTime())
			}
			return sum
		}, 0)

		const averageDuration = completedTasks.length > 0 ? totalDuration / completedTasks.length : 0

		// Count message types
		const messagesByType: Record<string, number> = {}
		let totalMessages = 0

		for (const taskState of allTasks) {
			for (const message of taskState.messages) {
				messagesByType[message.type] = (messagesByType[message.type] || 0) + 1
				totalMessages++
			}
		}

		return {
			totalTasks: allTasks.length,
			activeTasks: allTasks.length - completedTasks.length,
			completedTasks: completedTasks.length,
			tasksWithErrors: tasksWithErrors.length,
			averageTaskDuration: averageDuration,
			totalMessages,
			messagesByType,
		}
	}

	/**
	 * Export task data for analysis
	 */
	public exportTaskData(): {
		tasks: TaskExecutionState[]
		statistics: ReturnType<typeof TaskLoopBridge.prototype.getTaskStatistics>
		executionHistory: any[]
		exportTime: string
	} {
		return {
			tasks: this.getActiveTasks(),
			statistics: this.getTaskStatistics(),
			executionHistory: this.transitionalExecutor.getExecutionHistory(),
			exportTime: new Date().toISOString(),
		}
	}

	/**
	 * Get transitional executor
	 */
	public getTransitionalExecutor(): TransitionalExecutor {
		return this.transitionalExecutor
	}
}

// Global task loop bridge instance
export const globalTaskLoopBridge = new TaskLoopBridge()
