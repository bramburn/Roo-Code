# PRD 1: Foundational State Management (Phase 1)

## 1\. Title & Overview

- **Project:** Adaptive Self-Healing Tool Execution - Phase 1
    
- **Summary:** This phase establishes the architectural foundation for tracking tool execution failures and persisting user configuration. It does not implement the fixing logic yet but creates the necessary data structures (`ToolCallHistory`, `consecutiveMistakeCount`) and global state persistence to support the future "Self-Healing" feature.
    
- **Dependencies:** Existing `ClineProvider.ts` and `GlobalState` definitions.
    

## 2\. Goals & Success Metrics

- **Business Objectives:** \* Prepare the system architecture to support autonomous error recovery without destabilizing existing state management.
    
    - Ensure zero regression in current extension state persistence.
        
- **Developer & System Success Metrics:**
    
    - `GlobalState` successfully persists the `toolCallFixerEnabled` boolean across VS Code reloads.
        
    - `ExtensionState` correctly increments and resets `consecutiveMistakeCount` in memory during a task session.
        

## 3\. User Personas

- **Roo Code Core Developer:** Needs a reliable state mechanism to track how many times a tool has failed to prevent infinite loops in later phases.
    
- **End User (Developer):** Wants their preference for "Auto-fixing" (On/Off) to be remembered permanently.
    

## 4\. Requirements Breakdown

| 
Phase

 | 

Sprint

 | 

User Story

 | 

Acceptance Criteria

 | 

Duration

 |
| --- | --- | --- | --- | --- |
| 

**Phase 1**

 | 

**Sprint 1: Architecture & State**

 | 

As the System, I need to track the history of tool calls and their outcomes so that I can identify repeated failures.

 | 

1\. A `ToolCallHistory` interface is defined with fields for `toolName`, `params`, `outcome`, and `error`.

  

2\. `ExtensionState` includes a `consecutiveMistakeCount` property initialized to 0.

 | 

1 Week

 |
| 

  


 | 

  


 | 

As a User, I want my preference for "Tool Fixer" configuration to be saved so I don't have to re-configure it on every session.

 | 

1\. `GlobalState` is updated to include `toolCallFixerEnabled` (bool) and `toolCallApiConfig` (object).

  

2\. `ClineProvider` correctly reads/writes these values from the VS Code global state storage.

  

3\. Default values are established (Enabled: False initially).

 | 

  


 |

## 5\. Timeline & Sprints

- **Total Estimated Time:** 1 Week
    
- **Sprint 1:** Architecture & State Persistence (1 Week)
    

## 6\. Risks & Assumptions

- **Assumption:** The `GlobalState` storage limit in VS Code is sufficient for storing the additional API configuration object.
    
- **Risk:** Modifying `ExtensionState` might cause type errors in `WebViewProvider` if not propagated correctly to the frontend types.
    
    - _Mitigation:_ Ensure shared type definitions are updated in both the extension and webview-ui folders.

Sub-Sprint 1.1: Types and Local State Definition

Objective: Define the core TypeScript interfaces required to track tool execution history and extend the ExtensionState to hold error counters.

Parent Sprint: PRD 1, Sprint 1: Architecture & State

Tasks:

Define ToolCallHistory Interface: Create a robust interface to track the lifecycle of a tool call.

Update ExtensionState: Modify the core state interface to include the mistake counter.

Update Initial State: Ensure the ClineProvider initializes these new values correctly.

Acceptance Criteria:

ToolCallHistory interface exists and includes: toolName, arguments, error (optional), fixAttempt (number).

ExtensionState in src/core/webview/ClineProvider.ts (or equivalent types file) includes consecutiveMistakeCount: number.

The application compiles without TypeScript errors.

Dependencies:

None.

Timeline:

Duration: 2 Days


Sub-Sprint 1.2: Global State Persistence

Objective: Implement the persistence layer for the Tool Fixer settings, ensuring user preferences survive VS Code window reloads.

Parent Sprint: PRD 1, Sprint 1: Architecture & State

Tasks:

Extend GlobalState: Add keys for toolCallFixId (enabled/disabled strategy) and toolCallApiConfig.

Update ClineProvider Logic: Implement the getter and setter methods for these new state keys.

Message Handling Stubs: specific handlers for webviewToExtension messages regarding these settings (implementation of the full handler logic comes in Phase 4, but the state update logic belongs here).

Acceptance Criteria:

VS Code's context.globalState successfully stores and retrieves the new configuration objects.

Unit tests verify that getToolCallConf() returns the default if no state is saved.

Dependencies:

Sub-Sprint 1.1 must be complete (types definitions).

Timeline:

Duration: 3 Days

Task List: Sprint 1 - Architecture & State

Goal: Establish data structures for tool tracking and configuration persistence.

Task ID

Status

Task Description (Sequential & Atomic Steps)

File(s) To Modify

1.1

☐ To Do

Define Tool Types: Create ToolCallHistory interface in the shared types definition file. Include fields for toolName, params (any), and outcome.

src/shared/ExtensionMessage.ts (or WebviewMessage.ts)

1.2

☐ To Do

Update ExtensionState: Add consecutiveMistakeCount: number to the ExtensionState interface.

src/core/webview/ClineProvider.ts

1.3

☐ To Do

Initialize State: In ClineProvider constructor/initialization, set consecutiveMistakeCount to 0.

src/core/webview/ClineProvider.ts

1.4

☐ To Do

Define Global Keys: Add constants for toolCallFixerEnabled and toolCallApiConfig to be used with globalState.

src/core/webview/ClineProvider.ts

1.5

☐ To Do

Implement State Getters: Add helper methods in ClineProvider to retrieve the fixer config from global state.

src/core/webview/ClineProvider.ts

1.6

☐ To Do

Implement State Setters: Add helper methods to update the global state when a configuration change is requested.

src/core/webview/ClineProvider.ts