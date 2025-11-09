# Context Directory Structure Guide

## Overview

This guide defines the standardized directory structure and naming conventions for context files within the PRD ecosystem.

## Directory Structure

### Standard PRD Structure with Context

```
PRDs/
└── [PRD-Name]/
    ├── PRD.md
    ├── README.md
    ├── CHANGELOG.md
    ├── dependencies.md
    ├── testing-strategy.md
    ├── rollback-plan.md
    ├── sub-sprints/
    │   ├── Sub-Sprint-1-1.md
    │   ├── Sub-Sprint-1-2.md
    │   └── ...
    ├── tasklists/
    │   ├── tasklist_sprint_01.md
    │   ├── tasklist_sprint_02.md
    │   └── ...
    └── context/                          ← NEW: Context files directory
        ├── task-1.1-context.md
        ├── task-1.2-context.md
        ├── task-1.3-context.md
        ├── task-2.1-context.md
        └── ...
```

## Naming Conventions

### Context Files

**Format:** `task-[TASK_ID]-context.md`

**Examples:**

- `task-1.1-context.md` → Context for Task 1.1
- `task-1.2-context.md` → Context for Task 1.2
- `task-2.1-context.md` → Context for Task 2.1 (Sprint 2)

**Task ID Format:**

- `[SPRINT_NUMBER].[TASK_NUMBER]`
- Sprint 1, Task 1 → `1.1`
- Sprint 1, Task 2 → `1.2`
- Sprint 2, Task 1 → `2.1`

### Context Directory

**Location:** Always at PRD root level

- ✅ `PRDs/01-Authentication-System/context/`
- ✅ `PRDs/02-Content-Structure/context/`
- ❌ `PRDs/01-Authentication-System/sub-sprints/context/` (wrong)
- ❌ `PRDs/01-Authentication-System/tasklists/context/` (wrong)

**Rationale:** Centralized location for all context files across all sprints

## File Relationships

### Task List → Context File Mapping

**Task List:** `PRDs/01-Authentication-System/tasklists/tasklist_sprint_01.md`

```markdown
| Task ID | Status  | Task Description       | File(s) To Modify               |
| ------- | ------- | ---------------------- | ------------------------------- |
| 1.1     | ☐ To Do | Set up database        | backend/db/setup.sql            |
| 1.2     | ☐ To Do | Create User model      | backend/models/User.cs          |
| 1.3     | ☐ To Do | Implement auth service | backend/services/AuthService.cs |
```

**Context Files:**

- `PRDs/01-Authentication-System/context/task-1.1-context.md`
- `PRDs/01-Authentication-System/context/task-1.2-context.md`
- `PRDs/01-Authentication-System/context/task-1.3-context.md`

### Cross-References

**In Context File:**

```markdown
# Context for Task 1.3: Implement auth service

- **Source PRD**: `../PRD.md`
- **Task List**: `../tasklists/tasklist_sprint_01.md`
- **Sub-Sprint**: `../sub-sprints/Sub-Sprint-1-2.md`
```

**In Task List:**

```markdown
| Task ID | Status  | Task Description       | Context File                              |
| ------- | ------- | ---------------------- | ----------------------------------------- |
| 1.3     | ☐ To Do | Implement auth service | [Context](../context/task-1.3-context.md) |
```

## Complete Example

### Example PRD: Authentication System

```
PRDs/01-Authentication-System/
├── PRD.md                                    # Main requirements document
├── README.md                                 # Overview and quick links
├── CHANGELOG.md                              # Version history
├── dependencies.md                           # Technical dependencies
├── testing-strategy.md                       # Test plans
├── rollback-plan.md                          # Rollback procedures
│
├── sub-sprints/                              # Sprint breakdowns
│   ├── Sub-Sprint-1-1.md                     # Week 1 of Sprint 1
│   ├── Sub-Sprint-1-2.md                     # Week 2 of Sprint 1
│   ├── Sub-Sprint-2-1.md                     # Week 1 of Sprint 2
│   └── Sub-Sprint-2-2.md                     # Week 2 of Sprint 2
│
├── tasklists/                                # Atomic task lists
│   ├── tasklist_sprint_01.md                # Sprint 1 tasks (1.1, 1.2, 1.3, ...)
│   └── tasklist_sprint_02.md                # Sprint 2 tasks (2.1, 2.2, 2.3, ...)
│
└── context/                                  # Research context files
    ├── task-1.1-context.md                   # Context for Sprint 1, Task 1
    ├── task-1.2-context.md                   # Context for Sprint 1, Task 2
    ├── task-1.3-context.md                   # Context for Sprint 1, Task 3
    ├── task-2.1-context.md                   # Context for Sprint 2, Task 1
    └── task-2.2-context.md                   # Context for Sprint 2, Task 2
```

## Context File Lifecycle

### 1. Creation

**Trigger:** `@context-engineer` or `@context-orchestrator`
**Location:** `PRDs/[PRD-Name]/context/task-[ID]-context.md`
**Status:** "To Do" in task list

### 2. Usage

**Trigger:** `@code execute task [ID]`
**Action:** Code agent reads context file
**Status:** "In Progress" in task list

### 3. Completion

**Trigger:** Task implementation finished
**Action:** Task marked "Done" in task list
**Status:** Context file remains for reference

### 4. Archival (Optional)

**Trigger:** Sprint/PRD completion
**Action:** Move to `PRDs/completed/[PRD-Name]/context/`
**Status:** Preserved for historical reference

## Directory Creation

### Automatic Creation

**When:** `@context-engineer` runs for first time in a PRD
**Action:** Creates `context/` directory if it doesn't exist

```bash
mkdir -p PRDs/01-Authentication-System/context
```

### Manual Creation

```bash
# For a new PRD
mkdir -p PRDs/[PRD-Name]/context

# For multiple PRDs
for prd in PRDs/*/; do
  mkdir -p "$prd/context"
done
```

## Best Practices

### 1. Consistent Naming

- Always use lowercase `context` (not `Context` or `CONTEXT`)
- Always use hyphen-separated task IDs (`task-1.1`, not `task_1_1` or `task1.1`)
- Always include `-context.md` suffix

### 2. One Context Per Task

- Each task gets exactly one context file
- Never combine multiple tasks in one context file
- Never split one task across multiple context files

### 3. Relative Paths

- Use relative paths in cross-references (`../PRD.md`, not absolute paths)
- Ensures portability if PRD is moved or renamed

### 4. Git Tracking

- Commit context files to version control
- Include in PRD pull requests
- Track changes alongside code changes

### 5. Cleanup

- Keep context files even after task completion (for reference)
- Archive entire PRD context directory when PRD is completed
- Never delete context files unless PRD is deprecated

## Integration with Existing Tools

### PRD Validator

**Update:** Validate that context files match task list entries
**Check:** Ensure all "Done" tasks have corresponding context files

### PRD Dependency Manager

**Update:** Track context file dependencies in memory graph
**Check:** Ensure dependent tasks have context files before proceeding

### PRD Orchestrator

**Update:** Create context directory during PRD initialization
**Check:** Verify context directory exists before delegating to context-engineer

## Migration Guide

### For Existing PRDs

**Step 1:** Create context directories

```bash
for prd in PRDs/*/; do
  mkdir -p "$prd/context"
done
```

**Step 2:** Generate context for existing tasks

```bash
@context-orchestrator process sprint 1 in PRDs/01-Authentication-System
```

**Step 3:** Update task lists with context file links (optional)

```markdown
| Task ID | Status  | Task Description | Context                                   |
| ------- | ------- | ---------------- | ----------------------------------------- |
| 1.1     | ✅ Done | Setup database   | [Context](../context/task-1.1-context.md) |
```

## Troubleshooting

### Context directory not found

**Cause:** Directory not created
**Solution:** Run `mkdir -p PRDs/[PRD-Name]/context`

### Context file naming mismatch

**Cause:** Incorrect naming convention
**Solution:** Rename to `task-[ID]-context.md` format

### Cross-reference broken

**Cause:** Incorrect relative path
**Solution:** Use `../` to navigate from context/ to PRD root

## Next Steps

- See `CONTEXT_WORKFLOW_GUIDE.md` for complete workflow
- See `context_template.md` for file structure
- See `RESEARCH_ORCHESTRATION_PROTOCOL.md` for generation process
