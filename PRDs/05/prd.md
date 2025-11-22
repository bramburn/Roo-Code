PRD 5: Integration & Testing (Phases 5 & 6)

1. Title & Overview

Project: Adaptive Self-Healing Tool Execution - Integration & Testing

Summary: This final PRD covers the wiring of the entire system: connecting the Detection Engine (Phase 2) to the Fixer Service (Phase 3) within the Task Loop, controlled by the Settings (Phase 4). It also includes the Validation & Safety phase to ensure the system behaves reliably.

Dependencies: PRD 2, 3, and 4 must be complete.

2. Goals & Success Metrics

Business Objectives:

Deliver a fully functional "Self-Healing" agent that autonomously fixes >80% of syntax errors.

Ensure no regression in normal tool execution speed or reliability.

Developer & System Success Metrics:

The Task.ts loop successfully pauses on error, invokes ToolErrorFixer, and retries execution with the corrected output.

The consecutiveMistakeCount correctly prevents infinite loops (stopping at 3 attempts).

Integration tests pass for the "End-to-End Repair" scenario.

3. User Personas

End User: Sees a status message "Attempting to fix tool error..." instead of a generic failure, and watches as the agent corrects itself and proceeds.

4. Requirements Breakdown

Phase

Sprint

User Story

Acceptance Criteria

Duration

Phase 5

Sprint 5: End-to-End Integration

As the System, I want to trigger the ToolErrorFixer only when the User has enabled it and an error is detected.

1. In Task.ts, check GlobalState for toolCallFixerEnabled before attempting a fix.



2. Use the ToolErrorFixer service to generate the new tool call.



3. Re-inject the new tool call into the execution queue.

1 Week





As a User, I want to know when the agent is fixing itself.

1. The UI displays a specific status/loading state: "Attempting to self-heal...".



Phase 6

Sprint 6: Validation & Safety

As the System, I want to ensure I never get stuck in a loop.

1. Strict enforcement of consecutiveMistakeCount >= 3 triggers a hard failure (throws the original error).

1 Week





As a Developer, I want to verify costs are tracked.

1. Ensure token usage from the ToolErrorFixer client is added to the task's total token usage.



5. Timeline & Sprints

Total Estimated Time: 2 Weeks

Sprint 5: End-to-End Integration (1 Week)

Sprint 6: Validation & Safety (1 Week)

6. Risks & Assumptions

Risk: Re-injecting the tool call might mess up the chat history/context window.

Mitigation: We must decide if the "failed" attempt is kept in history. Recommendation: Keep it, so the model sees it tried and failed, but the Fixer's internal dialogue is hidden (transient), only the result (the corrected tool call) is executed as if the model typed it correctly the second time.


Sub-Sprint 5.1: Wiring the Loop

Objective: Connect the Task.ts execution flow to the ToolErrorFixer.

Parent Sprint: PRD 5, Sprint 5: End-to-End Integration

Tasks:

Modify Catch Block: In Task.ts (where we added the counter in Phase 2), add the logic branch: if (mistakeCount < 3 && settings.toolFixerEnabled).

Instantiate Fixer: Create an instance of ToolErrorFixer using the config from GlobalState.

Await Fix: Call await fixer.fix(...).

Handle Result:

If fix returns a valid ToolCall, recursively call executeTool (or loop back) with the new parameters.

If fix returns null/error, throw the original error.

Acceptance Criteria:

A mocked "JSON Error" triggers the fix logic.

The system logs "Fixing..." to the console/output.

The tool is re-executed with the new parameters.

Dependencies:

Phase 2 (Detection) and Phase 3 (Fixer) complete.

Timeline:

Duration: 4 Days


Task List: Sprint 5 & 6 - Integration & Validation

Goal: Complete the wiring of the self-healing loop and validate system safety.

Task ID

Status

Task Description (Sequential & Atomic Steps)

File(s) To Modify

5.1

☐ To Do

Import Fixer: Import ToolErrorFixer in src/core/task/Task.ts.

src/core/task/Task.ts

5.2

☐ To Do

Retrieve Config: In Task.ts, add logic to retrieve toolCallFixerEnabled and toolCallApiConfig from the provider/global state.

src/core/task/Task.ts

5.3

☐ To Do

Implement Fix Logic Branch: Inside the error catch block, add the if condition checks (enabled? count < limit?).

src/core/task/Task.ts

5.4

☐ To Do

Execute Fix: Call fixer.fix(error, originalTool, config).

src/core/task/Task.ts

5.5

☐ To Do

Apply Fix: If a fix is returned, update the tool execution arguments and retry. (This might require refactoring executeTool to allow re-entry or returning a specific signal).

src/core/task/Task.ts

5.6

☐ To Do

User Feedback: Emit a status update event say('text', 'Attempting to auto-correct tool error...', ...) to the UI.

src/core/task/Task.ts

6.1

☐ To Do

Integration Test: Create tests/integration/self-healing.test.ts. Mock the API to return a bad JSON, then a fixed JSON, and assert success.

tests/integration/self-healing.test.ts

6.2

☐ To Do

Safety Test: Create tests/integration/death-loop.test.ts. Mock the API to return bad JSON 4 times. Assert that the system throws the error on the 4th try.

tests/integration/death-loop.test.ts