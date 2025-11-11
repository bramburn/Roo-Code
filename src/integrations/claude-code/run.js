import * as vscode from "vscode";
import { execa } from "execa";
import readline from "readline";
import { CLAUDE_CODE_DEFAULT_MAX_OUTPUT_TOKENS } from "@roo-code/types";
import * as os from "os";
import { t } from "../../i18n";
const cwd = vscode.workspace.workspaceFolders?.map((folder) => folder.uri.fsPath).at(0);
// Claude Code installation URL - can be easily updated if needed
const CLAUDE_CODE_INSTALLATION_URL = "https://docs.anthropic.com/en/docs/claude-code/setup";
export async function* runClaudeCode(options) {
    const claudePath = options.path || "claude";
    let process;
    try {
        process = runProcess(options);
    }
    catch (error) {
        // Handle ENOENT errors immediately when spawning the process
        if (error.code === "ENOENT" || error.message?.includes("ENOENT")) {
            throw createClaudeCodeNotFoundError(claudePath, error);
        }
        throw error;
    }
    const rl = readline.createInterface({
        input: process.stdout,
    });
    try {
        const processState = {
            error: null,
            stderrLogs: "",
            exitCode: null,
            partialData: null,
        };
        process.stderr.on("data", (data) => {
            processState.stderrLogs += data.toString();
        });
        process.on("close", (code) => {
            processState.exitCode = code;
        });
        process.on("error", (err) => {
            // Enhance ENOENT errors with helpful installation guidance
            if (err.message.includes("ENOENT") || err.code === "ENOENT") {
                processState.error = createClaudeCodeNotFoundError(claudePath, err);
            }
            else {
                processState.error = err;
            }
            // Close the readline interface to break out of the loop
            rl.close();
        });
        for await (const line of rl) {
            if (processState.error) {
                throw processState.error;
            }
            if (line.trim()) {
                const chunk = parseChunk(line, processState);
                if (!chunk) {
                    continue;
                }
                yield chunk;
            }
        }
        // Check for errors that occurred during processing
        if (processState.error) {
            throw processState.error;
        }
        // We rely on the assistant message. If the output was truncated, it's better having a poorly formatted message
        // from which to extract something, than throwing an error/showing the model didn't return any messages.
        if (processState.partialData && processState.partialData.startsWith(`{"type":"assistant"`)) {
            yield processState.partialData;
        }
        const { exitCode } = await process;
        if (exitCode !== null && exitCode !== 0) {
            // If we have a specific ENOENT error, throw that instead
            if (processState.error && processState.error.name === "ClaudeCodeNotFoundError") {
                throw processState.error;
            }
            const errorOutput = processState.error?.message || processState.stderrLogs?.trim();
            throw new Error(`Claude Code process exited with code ${exitCode}.${errorOutput ? ` Error output: ${errorOutput}` : ""}`);
        }
    }
    finally {
        rl.close();
        if (!process.killed) {
            process.kill();
        }
    }
}
// We want the model to use our custom tool format instead of built-in tools.
// Disabling built-in tools prevents tool-only responses and ensures text output.
const claudeCodeTools = [
    "Task",
    "Bash",
    "Glob",
    "Grep",
    "LS",
    "exit_plan_mode",
    "Read",
    "Edit",
    "MultiEdit",
    "Write",
    "NotebookRead",
    "NotebookEdit",
    "WebFetch",
    "TodoRead",
    "TodoWrite",
    "WebSearch",
    "ExitPlanMode",
    "BashOutput",
    "KillBash",
].join(",");
const CLAUDE_CODE_TIMEOUT = 600000; // 10 minutes
function runProcess({ systemPrompt, messages, path, modelId, maxOutputTokens, }) {
    const claudePath = path || "claude";
    const isWindows = os.platform() === "win32";
    // Build args based on platform
    const args = ["-p"];
    // Pass system prompt as flag on non-Windows, via stdin on Windows (avoids cmd length limits)
    if (!isWindows) {
        args.push("--system-prompt", systemPrompt);
    }
    args.push("--verbose", "--output-format", "stream-json", "--disallowedTools", claudeCodeTools, 
    // Roo Code will handle recursive calls
    "--max-turns", "1");
    if (modelId) {
        args.push("--model", modelId);
    }
    const child = execa(claudePath, args, {
        stdin: "pipe",
        stdout: "pipe",
        stderr: "pipe",
        env: {
            ...process.env,
            // Use the configured value, or the environment variable, or default to CLAUDE_CODE_DEFAULT_MAX_OUTPUT_TOKENS
            CLAUDE_CODE_MAX_OUTPUT_TOKENS: maxOutputTokens?.toString() ||
                process.env.CLAUDE_CODE_MAX_OUTPUT_TOKENS ||
                CLAUDE_CODE_DEFAULT_MAX_OUTPUT_TOKENS.toString(),
        },
        cwd,
        maxBuffer: 1024 * 1024 * 1000,
        timeout: CLAUDE_CODE_TIMEOUT,
    });
    // Prepare stdin data: Windows gets both system prompt & messages (avoids 8191 char limit),
    // other platforms get messages only (avoids Linux E2BIG error from ~128KiB execve limit)
    let stdinData;
    if (isWindows) {
        stdinData = JSON.stringify({
            systemPrompt,
            messages,
        });
    }
    else {
        stdinData = JSON.stringify(messages);
    }
    // Use setImmediate to ensure process is spawned before writing (prevents stdin race conditions)
    setImmediate(() => {
        try {
            child.stdin.write(stdinData, "utf8", (error) => {
                if (error) {
                    console.error("Error writing to Claude Code stdin:", error);
                    child.kill();
                }
            });
            child.stdin.end();
        }
        catch (error) {
            console.error("Error accessing Claude Code stdin:", error);
            child.kill();
        }
    });
    return child;
}
function parseChunk(data, processState) {
    if (processState.partialData) {
        processState.partialData += data;
        const chunk = attemptParseChunk(processState.partialData);
        if (!chunk) {
            return null;
        }
        processState.partialData = null;
        return chunk;
    }
    const chunk = attemptParseChunk(data);
    if (!chunk) {
        processState.partialData = data;
    }
    return chunk;
}
function attemptParseChunk(data) {
    try {
        return JSON.parse(data);
    }
    catch (error) {
        console.error("Error parsing chunk:", error, data.length);
        return null;
    }
}
/**
 * Creates a user-friendly error message for Claude Code ENOENT errors
 */
function createClaudeCodeNotFoundError(claudePath, originalError) {
    const errorMessage = t("common:errors.claudeCode.notFound", {
        claudePath,
        installationUrl: CLAUDE_CODE_INSTALLATION_URL,
        originalError: originalError.message,
    });
    const error = new Error(errorMessage);
    error.name = "ClaudeCodeNotFoundError";
    return error;
}
//# sourceMappingURL=run.js.map