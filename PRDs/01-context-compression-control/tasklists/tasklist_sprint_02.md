# Task List: Sprint 2 - Manual Review Workflow

**Goal:** To implement the core manual context review functionality, allowing users to review and edit context before compression occurs, with proper waiting states and fallback options.

| Task ID  | Status  | Task Description (Sequential & Atomic Steps)                                                                                                | File(s) To Modify                                                       |
| :------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------ | :---------------------------------------------------------------------- |
| **2.1**  | ☐ To Do | **Enhance Compression Trigger**: Modify existing compression trigger to check manual review setting and pause before automatic compression. | `src/core/sliding-window/index.ts` (modify existing condensation logic) |
| **2.2**  | ☐ To Do | **Add Context Metadata Collection**: Implement logic to collect context size, timing, and compression trigger metadata.                     | `src/core/sliding-window/index.ts` (extend existing logic)              |
| **2.3**  | ☐ To Do | **Create Context File Manager**: Implement context dumping to markdown format with proper structure and metadata.                           | `src/core/condense/context-file-manager.ts` (new file)                  |
| **2.4**  | ☐ To Do | **Implement Directory Creation**: Add logic to create `.context-review/` directory and handle file system permissions.                      | `src/core/condense/context-file-manager.ts` (new file)                  |
| **2.5**  | ☐ To Do | **Add Markdown Formatting**: Implement proper markdown formatting for context content with metadata headers.                                | `src/core/condense/context-file-manager.ts` (new file)                  |
| **2.6**  | ☐ To Do | **Create Chat Waiting State**: Implement "Waiting for context review..." status display in chat interface.                                  | `webview-ui/src/components/chat/ManualReview.tsx` (new file)            |
| **2.7**  | ☐ To Do | **Add Progress Indicators**: Implement visual progress indicators for manual review process.                                                | `webview-ui/src/components/chat/ReviewProgress.tsx` (new file)          |
| **2.8**  | ☐ To Do | **Implement File Watching**: Add file change detection for context files with debouncing.                                                   | `src/core/condense/file-watcher.ts` (new file)                          |
| **2.9**  | ☐ To Do | **Add Timeout Handling**: Implement timeout mechanism for extended manual review periods.                                                   | `src/core/condense/manual-review.ts` (new file)                         |
| **2.10** | ☐ To Do | **Create Fallback Button**: Add "Use intelligent compression instead" button with immediate action.                                         | `webview-ui/src/components/chat/ManualReview.tsx` (new file)            |
| **2.11** | ☐ To Do | **Implement Fallback Logic**: Add immediate transition to existing compression workflow.                                                    | `src/core/condense/manual-review.ts` (new file)                         |
| **2.12** | ☐ To Do | **Create Unit Tests**: Write comprehensive tests for manual review workflow components.                                                     | `src/core/condense/__tests__/context-file-manager.test.ts` (new file)   |
| **2.13** | ☐ To Do | **Create Integration Tests**: Test complete manual review workflow from trigger to completion.                                              | `src/__tests__/integration/manual-review.test.ts` (new file)            |
| **2.14** | ☐ To Do | **Update Documentation**: Document manual review workflow in user guide.                                                                    | `docs/user-guide/context-compression.md` (if exists, otherwise create)  |

## Dependencies

- Context compression trigger system must be available
- File system access permissions must be granted
- Chat interface components must be extensible
- Existing intelligent compression logic must be accessible

## Notes

- Ensure no LLM API calls are made during context file creation
- Implement proper error handling for all file system operations
- Test file watching performance with large context files
