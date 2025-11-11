import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime"
import { useCallback, useState, memo, useMemo } from "react"
import { useEvent } from "react-use"
import { ChevronDown, OctagonX } from "lucide-react"
import { commandExecutionStatusSchema } from "@roo-code/types"
import { safeJsonParse } from "@roo/safeJsonParse"
import { COMMAND_OUTPUT_STRING } from "@roo/combineCommandSequences"
import { vscode } from "@src/utils/vscode"
import { useExtensionState } from "@src/context/ExtensionStateContext"
import { cn } from "@src/lib/utils"
import { Button, StandardTooltip } from "@src/components/ui"
import CodeBlock from "../common/CodeBlock"
import { CommandPatternSelector } from "./CommandPatternSelector"
import { parseCommand } from "../../utils/command-validation"
import { extractPatternsFromCommand } from "../../utils/command-parser"
import { t } from "i18next"
export const CommandExecution = ({ executionId, text, icon, title }) => {
	const {
		terminalShellIntegrationDisabled = false,
		allowedCommands = [],
		deniedCommands = [],
		setAllowedCommands,
		setDeniedCommands,
	} = useExtensionState()
	const { command, output: parsedOutput } = useMemo(() => parseCommandAndOutput(text), [text])
	// If we aren't opening the VSCode terminal for this command then we default
	// to expanding the command execution output.
	const [isExpanded, setIsExpanded] = useState(terminalShellIntegrationDisabled)
	const [streamingOutput, setStreamingOutput] = useState("")
	const [status, setStatus] = useState(null)
	// The command's output can either come from the text associated with the
	// task message (this is the case for completed commands) or from the
	// streaming output (this is the case for running commands).
	const output = streamingOutput || parsedOutput
	// Extract command patterns from the actual command that was executed
	const commandPatterns = useMemo(() => {
		// First get all individual commands (including subshell commands) using parseCommand
		const allCommands = parseCommand(command)
		// Then extract patterns from each command using the existing pattern extraction logic
		const allPatterns = new Set()
		// Add all individual commands first
		allCommands.forEach((cmd) => {
			if (cmd.trim()) {
				allPatterns.add(cmd.trim())
			}
		})
		// Then add extracted patterns for each command
		allCommands.forEach((cmd) => {
			const patterns = extractPatternsFromCommand(cmd)
			patterns.forEach((pattern) => allPatterns.add(pattern))
		})
		return Array.from(allPatterns).map((pattern) => ({
			pattern,
		}))
	}, [command])
	// Handle pattern changes
	const handleAllowPatternChange = (pattern) => {
		const isAllowed = allowedCommands.includes(pattern)
		const newAllowed = isAllowed ? allowedCommands.filter((p) => p !== pattern) : [...allowedCommands, pattern]
		const newDenied = deniedCommands.filter((p) => p !== pattern)
		setAllowedCommands(newAllowed)
		setDeniedCommands(newDenied)
		vscode.postMessage({ type: "allowedCommands", commands: newAllowed })
		vscode.postMessage({ type: "deniedCommands", commands: newDenied })
	}
	const handleDenyPatternChange = (pattern) => {
		const isDenied = deniedCommands.includes(pattern)
		const newDenied = isDenied ? deniedCommands.filter((p) => p !== pattern) : [...deniedCommands, pattern]
		const newAllowed = allowedCommands.filter((p) => p !== pattern)
		setAllowedCommands(newAllowed)
		setDeniedCommands(newDenied)
		vscode.postMessage({ type: "allowedCommands", commands: newAllowed })
		vscode.postMessage({ type: "deniedCommands", commands: newDenied })
	}
	const onMessage = useCallback(
		(event) => {
			const message = event.data
			if (message.type === "commandExecutionStatus") {
				const result = commandExecutionStatusSchema.safeParse(safeJsonParse(message.text, {}))
				if (result.success) {
					const data = result.data
					if (data.executionId !== executionId) {
						return
					}
					switch (data.status) {
						case "started":
							setStatus(data)
							break
						case "output":
							setStreamingOutput(data.output)
							break
						case "fallback":
							setIsExpanded(true)
							break
						default:
							setStatus(data)
							break
					}
				}
			}
		},
		[executionId],
	)
	useEvent("message", onMessage)
	return _jsxs(_Fragment, {
		children: [
			_jsxs("div", {
				className: "flex flex-row items-center justify-between gap-2 mb-1",
				children: [
					_jsxs("div", {
						className: "flex flex-row items-center gap-2",
						children: [
							icon,
							title,
							status?.status === "exited" &&
								_jsx("div", {
									className: "flex flex-row items-center gap-2 font-mono text-xs",
									children: _jsx(StandardTooltip, {
										content: t("chat.commandExecution.exitStatus", { exitStatus: status.exitCode }),
										children: _jsx("div", {
											className: cn(
												"rounded-full size-2",
												status.exitCode === 0 ? "bg-green-600" : "bg-red-600",
											),
										}),
									}),
								}),
						],
					}),
					_jsx("div", {
						className: " flex flex-row items-center justify-between gap-2 px-1",
						children: _jsxs("div", {
							className: "flex flex-row items-center gap-1",
							children: [
								status?.status === "started" &&
									_jsxs("div", {
										className: "flex flex-row items-center gap-2 font-mono text-xs",
										children: [
											status.pid &&
												_jsxs("div", {
													className: "whitespace-nowrap",
													children: ["(PID: ", status.pid, ")"],
												}),
											_jsx(StandardTooltip, {
												content: t("chat:commandExecution.abort"),
												children: _jsx(Button, {
													variant: "ghost",
													size: "icon",
													onClick: () =>
														vscode.postMessage({
															type: "terminalOperation",
															terminalOperation: "abort",
														}),
													children: _jsx(OctagonX, { className: "size-4" }),
												}),
											}),
										],
									}),
								output.length > 0 &&
									_jsx(Button, {
										variant: "ghost",
										size: "icon",
										onClick: () => setIsExpanded(!isExpanded),
										children: _jsx(ChevronDown, {
											className: cn(
												"size-4 transition-transform duration-300",
												isExpanded && "rotate-180",
											),
										}),
									}),
							],
						}),
					}),
				],
			}),
			_jsxs("div", {
				className: "bg-vscode-editor-background border border-vscode-border rounded-xs ml-6 mt-2",
				children: [
					_jsxs("div", {
						className: "p-2",
						children: [
							_jsx(CodeBlock, { source: command, language: "shell" }),
							_jsx(OutputContainer, { isExpanded: isExpanded, output: output }),
						],
					}),
					command &&
						command.trim() &&
						_jsx(CommandPatternSelector, {
							patterns: commandPatterns,
							allowedCommands: allowedCommands,
							deniedCommands: deniedCommands,
							onAllowPatternChange: handleAllowPatternChange,
							onDenyPatternChange: handleDenyPatternChange,
						}),
				],
			}),
		],
	})
}
CommandExecution.displayName = "CommandExecution"
const OutputContainerInternal = ({ isExpanded, output }) =>
	_jsx("div", {
		className: cn("overflow-hidden", {
			"max-h-0": !isExpanded,
			"max-h-[100%] mt-1 pt-1 border-t border-border/25": isExpanded,
		}),
		children: output.length > 0 && _jsx(CodeBlock, { source: output, language: "log" }),
	})
const OutputContainer = memo(OutputContainerInternal)
const parseCommandAndOutput = (text) => {
	if (!text) {
		return { command: "", output: "" }
	}
	const index = text.indexOf(COMMAND_OUTPUT_STRING)
	if (index === -1) {
		return { command: text, output: "" }
	}
	return {
		command: text.slice(0, index),
		output: text.slice(index + COMMAND_OUTPUT_STRING.length),
	}
}
//# sourceMappingURL=CommandExecution.js.map
