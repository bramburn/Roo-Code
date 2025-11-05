# Sub-Sprint 2: Manual Review Workflow

## Objective

To implement the core manual context review functionality, allowing users to review and edit context before compression occurs, with proper waiting states and fallback options.

## Parent Sprint

PRD 1, Sprint 2: Manual Review Workflow

## Tasks

1. **Context Compression Trigger Enhancement**

    - Modify existing compression trigger to detect manual review setting
    - Implement logic to pause before automatic compression
    - Add context size and timing metadata collection
    - Create trigger for manual review workflow initiation

2. **Context File Creation**

    - Implement context dumping to markdown format
    - Create `.context-review/` directory structure
    - Add metadata header to context files
    - Ensure no LLM calls during file creation

3. **Chat Interface Waiting State**

    - Implement "Waiting for context review..." status display
    - Add progress indicators for manual review process
    - Create file watching mechanism for context file changes
    - Add timeout handling for extended review periods

4. **Intelligent Compression Fallback**
    - Add "Use intelligent compression instead" button
    - Implement immediate fallback to existing compression
    - Ensure seamless transition between workflows
    - Maintain conversation state continuity

## Acceptance Criteria

- System pauses before compression when manual review is enabled
- Context is dumped to markdown file without LLM API calls
- Chat interface shows clear waiting state during manual review
- Users can choose intelligent compression fallback at any time
- File watching detects and responds to context file changes

## Dependencies

- Context compression trigger system
- File system access and directory creation
- Chat state management and UI components
- Existing intelligent compression logic

## Timeline

- **Start Date**: 2025-11-18
- **End Date**: 2025-11-24

## Deliverables

- Enhanced compression trigger with manual review detection
- Context file creation and management system
- Chat interface with waiting state and controls
- Intelligent compression fallback mechanism

## Risks

- Users may create malformed context files
- File watching may have performance overhead
- Waiting state may confuse users without proper guidance

## Mitigations

- Context file validation and error handling
- Efficient file watching with debouncing
- Clear UI instructions and progress indicators
