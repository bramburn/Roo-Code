PRD 3: Adaptive Correction Logic (Phase 3)

1. Title & Overview

Project: Adaptive Self-Healing Tool Execution - Phase 3

Summary: This phase involves building the ToolErrorFixer service, which acts as the "brain" of the self-healing mechanism. When an error is detected (Phase 2), this service constructs a specialized prompt containing the error details and the original failed tool call, sends it to an LLM (potentially a different, cheaper one), and parses the corrected tool call.

Dependencies: PRD 2 (Error Classification) must be complete.

2. Goals & Success Metrics

Business Objectives:

Reduce "Death Loops" where the agent repeatedly tries the same failing command.

Automate the resolution of syntax errors (e.g., JSON escaping issues) without user intervention.

Developer & System Success Metrics:

The ToolErrorFixer service successfully generates a valid "Fix Prompt" containing the error context.

The system can make a secondary API call to an LLM (using the config defined in Phase 1) and receive a response.

The "Fix Prompt" effectively guides the model to correct syntax errors in >80% of test cases.

3. User Personas

The Agent (Roo): Needs a "sub-routine" to call upon when it gets confused or makes a syntax error, acting like a developer checking StackOverflow or reading documentation.

4. Requirements Breakdown

Phase

Sprint

User Story

Acceptance Criteria

Duration

Phase 3

Sprint 3: Fixer Service & Prompts

As the System, I need a dedicated service to construct the "Fix" request so that I don't pollute the main chat context with debugging noise.

1. ToolErrorFixer.ts class is created.



2. It accepts error, originalToolCall, and apiConfig as inputs.



3. It returns a Promise<string> (the corrected JSON or tool call).

1 Week





As the System, I need a specialized System Prompt that forces the LLM to focus only on fixing the JSON/Schema error.

1. A constant TOOL_FIX_SYSTEM_PROMPT is defined.



2. The prompt explicitly instructs the model to output only the corrected tool XML/JSON.



3. The prompt includes examples of common errors and their fixes.







As the System, I need to parse the "Fix" response to extract the corrected tool arguments.

1. The service implements parsing logic to handle the LLM's response (handling potential markdown code blocks).



2. It validates that the output is well-formed JSON.



5. Timeline & Sprints

Total Estimated Time: 1 Week

Sprint 3: Fixer Service & Prompts (1 Week)

6. Risks & Assumptions

Risk: The "Fixer" LLM might hallucinate entirely new tools instead of fixing the parameters.

Mitigation: The System Prompt must be extremely strict about only correcting the syntax/params of the existing tool.

Risk: Token costs for the "Fix" calls might accumulate.

Mitigation: This is why Phase 4 (API selection) is critical, but for now, we assume the user is okay with the cost of fixing errors.Sub-Sprint 3.1: ToolErrorFixer Service Scaffold

Objective: Create the TypeScript service that orchestrates the "Fix" API call.

Parent Sprint: PRD 3, Sprint 3: Fixer Service & Prompts

Tasks:

Create Service Class: Create src/services/ToolErrorFixer.ts.

Define Interface: The fix method signature: fix(error: string, toolCall: ToolCall, config: ApiConfiguration): Promise<ToolCall | null>.

API Client Integration: Instantiate an LLM client (using the existing buildApiHandler or similar factory) within the service using the provided config.

Acceptance Criteria:

The class can be instantiated.

The fix method accepts the necessary arguments.

It successfully initializes an API handler based on the passed configuration.

Dependencies:

Existing ApiHandler logic in the codebase.

Timeline:

Duration: 2 Days

Sub-Sprint 3.2: Prompt Engineering & Parsing

Objective: Design the specific prompt used to correct errors and implement the response parsing logic.

Parent Sprint: PRD 3, Sprint 3: Fixer Service & Prompts

Tasks:

Draft System Prompt: Create src/core/prompts/tool-fix-prompt.ts. This should explain to the LLM that it is a "JSON Repair Agent" or "Tool Parameter Fixer".

Implement Request Construction: In ToolErrorFixer, construct the message history: System Prompt + User Message ("Here is the tool call: X. Here is the error: Y. Fix it.").

Implement Response Parser: Write logic to strip Markdown (json ... ) from the LLM response and JSON.parse the result.

Acceptance Criteria:

The System Prompt includes specific instructions on how to format the output.

The parser correctly handles raw JSON strings and Markdown-wrapped JSON strings.

Unit tests verify that the prompt construction includes the error message and the original tool call.

Dependencies:

Sub-Sprint 3.1 must be complete.

Timeline:

Duration: 3 Days

Task List: Sprint 3 - Fixer Service & Prompts

Goal: Build the ToolErrorFixer service and the specific prompt strategies for self-correction.

Task ID

Status

Task Description (Sequential & Atomic Steps)

File(s) To Modify

3.1

☐ To Do

Create Prompt Constant: Create src/core/prompts/tool-fix-prompt.ts. Add TOOL_FIX_SYSTEM_PROMPT containing strict instructions for JSON repair.

src/core/prompts/tool-fix-prompt.ts

3.2

☐ To Do

Scaffold Service: Create src/services/ToolErrorFixer.ts. Import ApiConfiguration and ToolCall types.

src/services/ToolErrorFixer.ts

3.3

☐ To Do

Implement API Factory: In ToolErrorFixer, add a private method getApiClient(config: ApiConfiguration) that uses buildApiHandler (from core) to get a runnable LLM instance.

src/services/ToolErrorFixer.ts

3.4

☐ To Do

Implement Fix Method: Add public async fix(...). It should construct the messages array using the System Prompt and the error details.

src/services/ToolErrorFixer.ts

3.5

☐ To Do

Call LLM: Inside fix, await apiClient.createMessage(...). Handle potential API errors (try/catch) gracefully (return null if fix fails).

src/services/ToolErrorFixer.ts

3.6

☐ To Do

Parse Response: Implement private parseResponse(text: string). Use regex to extract content between ```json fences if present, otherwise parse raw text.

src/services/ToolErrorFixer.ts

3.7

☐ To Do

Unit Test Parser: Create src/services/ToolErrorFixer.test.ts to test the parseResponse logic against various LLM output styles.

src/services/ToolErrorFixer.test.ts