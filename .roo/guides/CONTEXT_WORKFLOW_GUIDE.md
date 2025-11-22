# Context-Aware Agent Workflow Guide

## Overview

This guide documents the complete workflow for the Context-Aware Agent system, which separates research (context generation) from implementation (code writing) to improve accuracy, reduce costs, and enable knowledge reuse.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Phase 1: Context Generation               │
│                                                               │
│  User → @context-orchestrator → @context-engineer (per task) │
│           ↓                              ↓                    │
│      Parse Tasklist              Research Loop:              │
│      Identify Tasks              1. ast-grep-mcp             │
│      Delegate Tasks              2. semantic_search          │
│                                  3. mcp_memory               │
│                                  4. github_mcp               │
│                                       ↓                       │
│                              Generate context.md             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    Phase 2: Code Execution                   │
│                                                               │
│  User → @code execute task X.Y                               │
│           ↓                                                   │
│      Read context/task-X.Y-context.md                        │
│           ↓                                                   │
│      Follow Implementation Plan                              │
│           ↓                                                   │
│      Write/Modify Code                                       │
│           ↓                                                   │
│      Update Task Status                                      │
└─────────────────────────────────────────────────────────────┘
```

## Workflow Phases

### Phase 0: Prerequisites

**Before starting, ensure:**

1. **MCP Tools are configured:**
   - `ast-grep-mcp`: Code structure analysis
   - `semantic_search`: Codebase pattern matching
   - `github_mcp`: External best practices
   - `mcp_memory`: Vector database for knowledge caching

2. **PRD Structure exists:**
   - `PRDs/[PRD-Name]/tasklists/tasklist_sprint_XX.md`
   - `PRDs/[PRD-Name]/context/` directory (will be created if missing)

3. **Task List Format:**
   ```markdown
   | Task ID | Status | Task Description | File(s) To Modify |
   |---------|--------|------------------|-------------------|
   | 1.1     | ☐ To Do | Implement User Model | backend/models/User.cs |
   ```

### Phase 1: Context Generation (Research)

#### Option A: Single Task Context Generation

**Command:**
```
@context-engineer generate context for task 1.3 from PRDs/01-Authentication-System/tasklists/tasklist_sprint_01.md
```

**What happens:**
1. Agent reads the tasklist file
2. Extracts Task 1.3 details
3. Executes research loop (see Research Protocol)
4. Generates `PRDs/01-Authentication-System/context/task-1.3-context.md`
5. Reports completion

#### Option B: Batch Context Generation (Entire Sprint)

**Command:**
```
@context-orchestrator process sprint 1 in PRDs/01-Authentication-System
```

**What happens:**
1. Orchestrator reads `tasklists/tasklist_sprint_01.md`
2. Identifies all "To Do" tasks without context files
3. Delegates each task to `@context-engineer`
4. Monitors completion
5. Reports summary: "3 contexts created, 1 skipped (already done)"

### Phase 2: Code Implementation

**Command:**
```
@code execute task 1.3
```

**What happens:**
1. Code agent checks for `context/task-1.3-context.md`
2. **If found:** Loads context into prompt, follows implementation plan
3. **If not found:** Returns error: "Context file missing. Run @context-engineer first."
4. Implements code changes
5. Updates task status in tasklist to "☑ In Progress" or "✅ Done"

### Phase 3: Dependency Management (Advanced)

**Automatic dependency handling:**

When `@context-orchestrator` runs:
1. Parses task dependencies from Section 5 of context files
2. Checks task status in tasklist
3. Only generates context for tasks whose dependencies are "✅ Done"
4. Reports blocked tasks: "Task 1.4 pending: Task 1.3 not complete"

**Re-run after completion:**
```
@context-orchestrator process sprint 1 in PRDs/01-Authentication-System
```
- Orchestrator sees Task 1.3 is now "✅ Done"
- Generates context for Task 1.4 (previously blocked)

## File Locations

### Context Files
- **Location:** `PRDs/[PRD-Name]/context/task-[ID]-context.md`
- **Example:** `PRDs/01-Authentication-System/context/task-1.3-context.md`

### Task Lists
- **Location:** `PRDs/[PRD-Name]/tasklists/tasklist_sprint_XX.md`
- **Example:** `PRDs/01-Authentication-System/tasklists/tasklist_sprint_01.md`

## Success Metrics

### Cost Reduction
- **Before:** Code agent performs research on every run (expensive)
- **After:** Research done once, reused multiple times (cached)

### Accuracy Improvement
- **Before:** Code agent may hallucinate or miss patterns
- **After:** Context provides verified examples and patterns

### Knowledge Reuse
- **Before:** Same research repeated for similar tasks
- **After:** `mcp_memory` caches results, skips `github_mcp` on subsequent tasks

## Troubleshooting

### "Context file not found"
- **Cause:** `@code` was called before `@context-engineer`
- **Solution:** Run `@context-engineer generate context for task X.Y` first

### "No matches found in semantic search"
- **Expected:** For new features with no existing patterns
- **Result:** Context file marks as "Requires New Implementation"
- **Action:** Code agent creates from scratch using external best practices

### "Task blocked by dependency"
- **Cause:** Dependent task not marked "✅ Done" in tasklist
- **Solution:** Complete dependency first, then re-run orchestrator

## Best Practices

1. **Always generate context before coding**
2. **Use orchestrator for batch operations** (entire sprints)
3. **Review context files** before implementation for accuracy
4. **Update task status** immediately after completion
5. **Re-run orchestrator** after completing blocking tasks

## Next Steps

- See `RESEARCH_ORCHESTRATION_PROTOCOL.md` for detailed research loop
- See `MCP_TOOLS_REFERENCE.md` for MCP tool usage
- See `context_template.md` for context file structure

