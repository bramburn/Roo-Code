PRD 2: Detection Engine (Phase 2)

1. Title & Overview

Project: Adaptive Self-Healing Tool Execution - Phase 2

Summary: This phase builds the "nervous system" of the self-healing mechanism. It involves intercepting tool execution results within the main Task loop and applying heuristic analysis (Regex/Parsing) to determine if an error is "fixable" (e.g., JSON syntax error) or "fatal" (e.g., file not found).

Dependencies: PRD 1 (State Management) must be complete.

2. Goals & Success Metrics

Business Objectives: * Accurately identify 90% of common LLM tool-use errors (JSON syntax, missing params).

Prevent the "Death Loop" by correctly incrementing the mistake counter defined in Phase 1.

Developer & System Success Metrics:

The system correctly intercepts JSON.parse exceptions during tool argument parsing.

Regex classifiers correctly categorize "Access Denied" vs "Command Not Found".

Task.ts execution flow is not blocked by the inspection logic.

3. User Personas

System Architecture: acts as the gatekeeper, deciding whether to simply report an error to the user (current behavior) or trigger the Fixer (new behavior).

4. Requirements Breakdown

Phase

Sprint

User Story

Acceptance Criteria

Duration

Phase 2

Sprint 2: Interception & Classification

As the System, I want to intercept tool execution errors before they are finalized so I can analyze them.

1. Task.ts -> executeTool is wrapped or modified to catch exceptions during execution.



2. The raw error message is captured.

1 Week





As the System, I want to classify errors into categories (JSON, Permissions, Schema) using Regex so I know how to fix them.

1. A library of Regex patterns is created for: JSON.parse, Access Denied, Command not found, Missing parameter.



2. A classifyError(errorString) function returns the specific Error Type.







As the System, I want to track consecutive mistakes to determine when to give up.

1. If an error is classified as "Fixable", increment consecutiveMistakeCount.



2. If a tool succeeds, reset consecutiveMistakeCount to 0.



5. Timeline & Sprints

Total Estimated Time: 1 Week

Sprint 2: Heuristic Analysis & Interception (1 Week)

6. Risks & Assumptions

Risk: Regex patterns might be too strict or too loose, missing actual errors or flagging valid output as errors.

Mitigation: extensive unit testing with diverse error strings from different LLMs (Claude vs. GPT).

Risk: Performance overhead in the main loop.

Mitigation: Keep regex simple and non-recursive.

Sub-Sprint 2.1: Task Loop Interception

Objective: Modify the core execution loop to enable "Man-in-the-Middle" analysis of tool results.

Parent Sprint: PRD 2, Sprint 2: Heuristic Analysis

Tasks:

Analyze Task.ts: Locate the executeTool method or the specific point where tool arguments are parsed and the tool is invoked.

Implement Try/Catch Blocks: Wrap the parsing and execution logic in specific try/catch blocks that don't just throw, but pass the error to a new handler.

Mistake Counter Logic: Connect the catch blocks to the consecutiveMistakeCount in ExtensionState (created in PRD 1).

Acceptance Criteria:

Exceptions thrown during tool execution are caught.

consecutiveMistakeCount increments on error.

consecutiveMistakeCount resets to 0 on success.

Dependencies:

PRD 1 (State definitions).

Timeline:

Duration: 2 Days

Sub-Sprint 2.2: Error Classifiers (Regex Engine)

Objective: Build the library of heuristics that determine what went wrong.

Parent Sprint: PRD 2, Sprint 2: Heuristic Analysis

Tasks:

Create ErrorUtils.ts: A new utility file for error analysis.

Implement JSON Parsers: Regex/Logic to detect "Unexpected token" or unterminated strings in JSON.

Implement System Error Parsers: Regex for "EACCES", "ENOENT", and "command not found".

Implement Schema Parsers: Logic to compare provided arguments against expected tool schema (detecting missing required keys).

Acceptance Criteria:

Unit tests pass for detectErrorType(msg) covering:

Malformed JSON

Missing Permissions

Hallucinated Tools

The function returns a structured enum/type indicating the error category.

Dependencies:

None (pure logic).

Timeline:

Duration: 3 Days

Task List: Sprint 2 - Heuristic Analysis

Goal: Implement the logic to catch and categorize errors within the tool execution loop.

Task ID

Status

Task Description (Sequential & Atomic Steps)

File(s) To Modify

2.1

☐ To Do

Create Error Utilities: Create src/utils/toolErrorUtils.ts. Define an Enum ToolErrorType (JSON, PERMISSIONS, SCHEMA, UNKNOWN).

src/utils/toolErrorUtils.ts

2.2

☐ To Do

Implement Regex Patterns: Add const regex patterns for common JSON errors (e.g., Unexpected token, End of data).

src/utils/toolErrorUtils.ts

2.3

☐ To Do

Implement Classifier Function: Write classifyToolError(errorMessage: string): ToolErrorType.

src/utils/toolErrorUtils.ts

2.4

☐ To Do

Unit Test Classifiers: Create src/utils/toolErrorUtils.test.ts and test against sample error strings.

src/utils/toolErrorUtils.test.ts

2.5

☐ To Do

Locate Execution Loop: Open src/core/task/Task.ts and find the loop handling tool_use blocks.

src/core/task/Task.ts

2.6

☐ To Do

Inject Counter Logic (Reset): At the end of a successful tool execution block, add this.provider.setConsecutiveMistakeCount(0).

src/core/task/Task.ts

2.7

☐ To Do

Inject Counter Logic (Increment): In the error handling block of tool execution, add this.provider.setConsecutiveMistakeCount(prev + 1).

src/core/task/Task.ts

2.8

☐ To Do

Integrate Classifier: In the error block, call classifyToolError and log the result (preparation for Phase 3).

src/core/task/Task.ts