# PRD: Context Compression Control Enhancement

## 1. Title & Overview

- **Project:** Context Compression Control Enhancement
- **Summary:** This feature enhances the existing context compression system by adding an optional manual review step before automatic intelligent compression occurs. Users can choose to manually edit context as a markdown file in their repository before proceeding, or fall back to the existing intelligent compression.
- **Dependencies:** This feature builds upon the existing context compression system and frontend settings infrastructure.

## 2. Goals & Success Metrics

### Business Objectives

- Provide developers with fine-grained control over context management
- Improve transparency in the context compression process
- Reduce context loss by allowing manual curation before compression
- Maintain backward compatibility with existing intelligent compression

### Developer & System Success Metrics

- 80% of users enable manual context review feature within first month
- Average time spent on manual context editing is under 5 minutes
- Zero increase in context compression failures
- User satisfaction score for context management improves by 25%

## 3. User Personas

- **Developer (Primary User):** A developer working on complex tasks who wants to ensure important context isn't lost during automatic compression and prefers to manually curate what gets preserved.
- **Power User:** An experienced user who understands the context window limitations and wants maximum control over what information is retained.

## 4. Requirements Breakdown

| Phase                    | Sprint                                       | User Story                                                                                                                                                        | Acceptance Criteria                                                                                                                                                                                                                                                                    | Duration    |
| :----------------------- | :------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| **Phase 1: Foundation**  | **Sprint 1: Settings Integration**           | As a Developer, I want a new checkbox in the context settings to enable manual context review before compression so I can choose my preferred workflow.           | 1. A new checkbox "Enable manual context review before compression" is added to context settings.<br>2. Setting is persisted across sessions.<br>3. Default state is disabled for backward compatibility.<br>4. Setting is clearly labeled with tooltip explaining functionality.      | **2 Weeks** |
|                          |                                              | As a Developer, I want the system to detect when context window is about to be hit so it can trigger the manual review workflow instead of automatic compression. | 1. System monitors context usage and predicts when compression will be needed.<br>2. When manual review is enabled, system pauses before automatic compression.<br>3. User is notified that manual review is available.<br>4. No LLM calls are made during this detection phase.       |             |
| **Phase 1: Foundation**  | **Sprint 2: Manual Review Workflow**         | As a Developer, I want the system to dump the current context to a .md file in my repository so I can review and edit it manually.                                | 1. Context is formatted as readable markdown and saved to `.context-review/[timestamp]-context.md`.<br>2. File includes metadata about context size and compression trigger.<br>3. File is created without calling any LLM APIs.<br>4. File path is displayed to user for easy access. | **2 Weeks** |
|                          |                                              | As a Developer, I want the chat to wait for me to finish editing the context file before continuing so I can take my time to review and make changes.             | 1. Chat interface shows "Waiting for context review..." status.<br>2. User can click "Continue" when ready to proceed.<br>3. System watches for file changes to provide live feedback.<br>4. Timeout mechanism prevents indefinite waiting.                                            |             |
|                          |                                              | As a Developer, I want an option to skip manual review and use intelligent compression directly so I can maintain the existing workflow when needed.              | 1. "Use intelligent compression instead" button is available during manual review.<br>2. Button triggers existing compression workflow immediately.<br>3. Choice is remembered for current session.<br>4. No context file is created when skipping.                                    |             |
| **Phase 2: Integration** | **Sprint 3: Context Loading & Continuation** | As a Developer, I want the system to load my edited context file and count tokens accurately so it can continue with the cleaned context.                         | 1. System reads the edited .md file when user clicks "Continue".<br>2. Token counting is performed on the loaded content.<br>3. Context window is updated with new token count.<br>4. Original context is replaced with edited version.                                                | **2 Weeks** |
|                          |                                              | As a Developer, I want the system to validate that my edited context fits within the context window so compression isn't needed immediately after loading.        | 1. System checks if edited context exceeds token limits.<br>2. If exceeded, prompts user to further edit or use intelligent compression.<br>3. If within limits, proceeds normally with the conversation.<br>4. Clear error messages guide user when limits are exceeded.              |             |
| **Phase 2: Integration** | **Sprint 4: Error Handling & Polish**        | As a Developer, I want robust error handling for file operations and edge cases so the feature doesn't break my workflow.                                         | 1. Graceful handling of file permission errors.<br>2. Recovery if context file is accidentally deleted.<br>3. Fallback to intelligent compression if manual review fails.<br>4. Clear error messages with actionable guidance.                                                         | **2 Weeks** |
|                          |                                              | As a Developer, I want visual indicators and feedback throughout the process so I understand what's happening at each step.                                       | 1. Progress indicators show current phase of manual review.<br>2. File status indicators (created, modified, loaded).<br>3. Token count display before and after editing.<br>4. Success confirmation when context is loaded.                                                           |             |

## 5. Timeline & Sprints

- **Total Estimated Time:** 8 Weeks
- **Sprint 1:** Settings Integration (2 Weeks)
- **Sprint 2:** Manual Review Workflow (2 Weeks)
- **Sprint 3:** Context Loading & Continuation (2 Weeks)
- **Sprint 4:** Error Handling & Polish (2 Weeks)

## 6. Risks & Assumptions

### Assumptions

- Users have write permissions to create files in their repository
- Existing context compression system can be triggered manually
- Frontend settings system can accommodate new boolean options
- Token counting API is available and accurate

### Risks

- Users may create malformed context files that break the conversation flow
- Manual editing may introduce inconsistencies or lose important context
- File system operations may fail in restricted environments
- Users may spend excessive time editing context files
- Feature may increase cognitive load for some users

### Mitigations

- Provide clear templates and guidelines for context editing
- Implement validation and error recovery mechanisms
- Offer intelligent compression as reliable fallback
- Add time limits and progress indicators
- Keep feature optional and clearly documented

## 7. Success Metrics

- **Adoption Rate:** 70% of eligible users enable the feature within first month
- **Usage Efficiency:** Average manual review session completes within 5 minutes
- **Error Rate:** Less than 5% of manual review sessions require fallback to intelligent compression
- **User Satisfaction:** Context management satisfaction score improves by 25%
- **Performance:** No measurable impact on conversation startup time when feature is disabled

## 8. Dependencies

### Technical Dependencies

- Existing context compression system (src/core/condense/index.ts)
- Frontend settings infrastructure (packages/types/src/global-settings.ts, webview-ui/src/components/settings/ContextManagementSettings.tsx)
- Token counting API (src/api/index.ts, existing countTokens methods)
- File system access permissions (src/shared/ExtensionMessage.ts, existing file operations)
- Chat state management system (src/shared/ExtensionMessage.ts, existing ExtensionState context)

### External Dependencies

- File system access for context file creation
- Repository write permissions
- Token counting service integration

### Integration Points

- Settings panel for feature enablement
- Context compression trigger points
- Chat interface for user interaction
- File watching and loading mechanisms
