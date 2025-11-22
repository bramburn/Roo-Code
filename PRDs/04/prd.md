PRD 4: Configuration & UI (Phase 4)

1. Title & Overview

Project: Adaptive Self-Healing Tool Execution - Phase 4

Summary: This phase implements the user interface controls in the VS Code Webview (SettingsView) and the corresponding backend message handling. It allows users to enable/disable the feature, customize the prompt, and most importantly, select a specific API configuration (Provider/Model) for the "Fixer" to use, independent of the main chat model.

Dependencies: PRD 1 (Global State) and PRD 3 (Fixer Service) must be complete (or at least defined).

2. Goals & Success Metrics

Business Objectives:

Provide transparency and control to the user (Self-healing should be opt-in or clearly configurable).

Optimize costs by allowing users to select cheaper models (e.g., Gemini Flash, Haiku) for the "Fixer" task.

Developer & System Success Metrics:

The Webview correctly displays the new "Prompts" section with the "Tool call fix system prompt" and API selector.

Changes in the UI are immediately sent to the extension and persisted in GlobalState.

The API Configuration dropdown correctly populates with available providers.

3. User Personas

Cost-Conscious Developer: Wants to use Claude 3.5 Sonnet for coding, but GPT-4o-mini or Haiku for fixing simple JSON errors to save money.

Power User: Wants to tweak the "System Prompt" for the fixer to handle a specific edge case they encounter often.

4. Requirements Breakdown

Phase

Sprint

User Story

Acceptance Criteria

Duration

Phase 4

Sprint 4: Frontend Settings & Backend Wiring

As a User, I want to see a "Tool call fix system prompt" section in settings so I can configure how the agent fixes itself.

1. SettingsView.tsx is updated.



2. A new text area is added for the prompt.



3. The description matches the detailed spec.

1.5 Weeks





As a User, I want to choose a specific API configuration for the Fixer, or just use the default one.

1. A Radio Button group is added: "Use currently selected API" vs "Select specific API".



2. If "Select specific API" is chosen, an ApiOptions component (reused or new) appears to select provider/model.







As the System, I need to listen for these setting changes and save them.

1. ClineProvider adds a case for toolCallFixId and toolCallApiConfig in the message listener.



2. Updates are saved to GlobalState immediately.



5. Timeline & Sprints

Total Estimated Time: 1.5 Weeks

Sprint 4: Frontend Settings & Backend Wiring (1.5 Weeks)

6. Risks & Assumptions

Assumption: We can reuse existing UI components (like the API provider dropdown) within the Settings view without major refactoring.

Risk: The ApiConfiguration object is complex. Storing a second full configuration in Global State requires careful serialization.

Mitigation: Ensure we only store necessary fields or reuse the existing ApiConfiguration type definition for strict typing.

Sub-Sprint 4.1: Frontend Implementation (React/Webview)

Objective: Implement the visual elements in the React Webview matching the detailed UI spec.

Parent Sprint: PRD 4, Sprint 4: Frontend Settings & Backend Wiring

Tasks:

Update Prompts Section: Modify src/webview-ui/src/components/SettingsView.tsx. Update the header text description.

Add Prompt Field: Add a VSCodeTextArea for the "Tool call fix system prompt". Bind it to local state.

Add API Selector: Implement the Radio Group ("Default" vs "Custom").

Integrate API Dropdown: conditionally render the API Provider/Model selector when "Custom" is selected. (May need to refactor ApiOptions to be reusable if it isn't already).

Acceptance Criteria:

The UI matches the "Detailed Settings View Specification".

Toggling the Radio Button shows/hides the custom API selector.

Changing values sends a postMessage to the extension.

Dependencies:

None (Frontend only).

Timeline:

Duration: 4 Days

Sub-Sprint 4.2: Backend Persistence & Message Handling

Objective: Handle the incoming configuration messages from the Webview and ensure they are stored and available to the ToolErrorFixer.

Parent Sprint: PRD 4, Sprint 4: Frontend Settings & Backend Wiring

Tasks:

Update Message Types: Ensure WebviewToExtensionMessage type definition includes the new setting fields.

Implement Message Listener: In ClineProvider.ts, inside setWebviewMessageListener, add handlers for the new messages.

Global State Storage: Use the setters created in Phase 1 to persist the received values.

Hydrate Webview: Ensure that when the Webview loads, the current values of these settings are sent to the Webview (in getValidationState or getState).

Acceptance Criteria:

Reloading the extension preserves the user's selection in the Settings View.

The GlobalState correctly reflects the JSON structure of the selected API config.

Dependencies:

Sub-Sprint 4.1 (Frontend messages must be defined).

Timeline:

Duration: 3 Days

Task List: Sprint 4 - Frontend Settings & Backend Wiring

Goal: Implement the UI for configuring the Tool Fixer and wire it to the backend storage.

Task ID

Status

Task Description (Sequential & Atomic Steps)

File(s) To Modify

4.1

☐ To Do

Update Message Types: Add toolCallFixId (or similar prompt key) and toolCallApiConfig to src/shared/WebviewMessage.ts.

src/shared/WebviewMessage.ts

4.2

☐ To Do

Modify SettingsView UI: Open src/webview-ui/src/components/settings/SettingsView.tsx. Find the "Prompts" section.

src/webview-ui/src/components/settings/SettingsView.tsx

4.3

☐ To Do

Add Prompt Text Area: Add the "Tool call fix system prompt" text area. Use the existing VSCodeTextArea component.

src/webview-ui/src/components/settings/SettingsView.tsx

4.4

☐ To Do

Add API Radio Group: Add a radio group for "Use currently selected API" vs "Select specific API".

src/webview-ui/src/components/settings/SettingsView.tsx

4.5

☐ To Do

Reuse/Create API Options: Ensure there is a component to select Provider/Model. If ApiOptions is coupled to the main view, refactor or create a simplified ApiConfigSelector component.

src/webview-ui/src/components/settings/ApiConfigSelector.tsx (New)

4.6

☐ To Do

Wire onChange Events: Ensure changing the prompt or API config sends the correct vscode.postMessage to the extension.

src/webview-ui/src/components/settings/SettingsView.tsx

4.7

☐ To Do

Handle Messages in Provider: In src/core/webview/ClineProvider.ts, update onDidReceiveMessage. Add cases for saving the new settings.

src/core/webview/ClineProvider.ts

4.8

☐ To Do

Update Initial State: Ensure getVirtualState (or equivalent) sends the stored toolCallFix... settings back to the webview on load.

src/core/webview/ClineProvider.ts