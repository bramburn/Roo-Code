# Getting Started with Context-Aware Agents

## Welcome!

This guide will help you get started with the Context-Aware Agent system. By the end, you'll understand how to use the new agents to improve your development workflow.

## What is the Context-Aware Agent System?

The Context-Aware Agent system separates **research** from **implementation**:

- **Before:** The `code` agent did everything - research, planning, and coding (slow, expensive, error-prone)
- **After:** Specialized agents handle research first, then `code` agent implements with a clear plan (fast, cheap, accurate)

## Prerequisites

### 1. MCP Tools Setup

You need these MCP tools configured:

| Tool | Purpose | Setup Required |
|------|---------|----------------|
| **ast-grep-mcp** | Code structure analysis | Install ast-grep CLI |
| **semantic_search** | Pattern matching | Configure codebase index |
| **github_mcp** | External best practices | GitHub Personal Access Token |
| **mcp_memory** | Knowledge caching | Qdrant or vector DB connection |

**Don't have these yet?** See `.roo/guides/MCP_TOOLS_REFERENCE.md` for setup instructions.

### 2. PRD Structure

Your PRD should have:
- `PRD.md` - Main requirements document
- `tasklists/tasklist_sprint_XX.md` - Task lists with this format:

```markdown
| Task ID | Status | Task Description | File(s) To Modify |
|---------|--------|------------------|-------------------|
| 1.1     | ☐ To Do | Setup database | backend/db/setup.sql |
| 1.2     | ☐ To Do | Create User model | backend/models/User.cs |
```

## Your First Context Generation

### Step 1: Choose Your Approach

**Option A: Single Task** (Good for learning)
```bash
@context-engineer generate context for task 1.1 from PRDs/01-Authentication-System/tasklists/tasklist_sprint_01.md
```

**Option B: Entire Sprint** (Recommended for production)
```bash
@context-orchestrator process sprint 1 in PRDs/01-Authentication-System
```

Let's start with Option A to see how it works.

### Step 2: Generate Context for One Task

```bash
@context-engineer generate context for task 1.1 from PRDs/01-Authentication-System/tasklists/tasklist_sprint_01.md
```

**What happens:**
1. Agent reads your tasklist
2. Extracts Task 1.1 details
3. Analyzes your codebase (ast-grep, semantic_search)
4. Checks memory for cached knowledge
5. Searches GitHub if needed (and caches results)
6. Generates implementation plan
7. Creates `PRDs/01-Authentication-System/context/task-1.1-context.md`

**Time:** ~2-3 minutes (first time), ~30-60 seconds (subsequent similar tasks)

### Step 3: Review the Context File

Open `PRDs/01-Authentication-System/context/task-1.1-context.md`

You'll see 6 sections:
1. **Current Code Analysis** - What exists in your codebase
2. **External Best Practices** - High-quality examples from GitHub
3. **Internal Knowledge Base** - Cached knowledge (if available)
4. **Suggested Implementation Plan** - Step-by-step instructions
5. **Dependencies** - What must be done first
6. **Notes and Warnings** - Important considerations

**Focus on Section 4** - This is your implementation guide!

### Step 4: Implement the Task

```bash
@code execute task 1.1
```

**What happens:**
1. Code agent checks for context file
2. Loads the context
3. Follows the implementation plan from Section 4
4. Writes/modifies code
5. Updates task status to "✅ Done"

**Time:** Depends on task complexity, but much faster with context!

### Step 5: Verify

Check your tasklist - Task 1.1 should now be marked "✅ Done"

## Scaling Up: Batch Processing

Now that you understand the basics, let's process an entire sprint:

### Step 1: Generate All Contexts

```bash
@context-orchestrator process sprint 1 in PRDs/01-Authentication-System
```

**What happens:**
1. Orchestrator reads entire tasklist
2. Identifies all "To Do" tasks without context
3. Checks dependencies
4. Delegates to context-engineer for each unblocked task
5. Reports summary

**Example Output:**
```
Context Orchestration Complete: Sprint 1 - Authentication System

Results:
- Contexts created: 6
- Contexts skipped: 2 (already existed)
- Tasks blocked: 2 (dependencies not met)

Generated Context Files:
- PRDs/01-Authentication-System/context/task-1.1-context.md
- PRDs/01-Authentication-System/context/task-1.2-context.md
- PRDs/01-Authentication-System/context/task-1.3-context.md
- PRDs/01-Authentication-System/context/task-1.5-context.md
- PRDs/01-Authentication-System/context/task-1.6-context.md
- PRDs/01-Authentication-System/context/task-1.8-context.md

Blocked Tasks:
- Task 1.4: Blocked by Task 1.3 (status: To Do)
- Task 1.7: Blocked by Task 1.6 (status: To Do)

Next Steps:
1. Review generated context files
2. Execute tasks 1.1, 1.2, 1.3, 1.5, 1.6, 1.8 using @code agent
3. After Task 1.3 completes, re-run orchestrator to unblock Task 1.4
```

### Step 2: Implement Tasks

```bash
@code execute task 1.1
@code execute task 1.2
@code execute task 1.3
```

### Step 3: Unblock Dependencies

After completing Task 1.3, re-run the orchestrator:

```bash
@context-orchestrator process sprint 1 in PRDs/01-Authentication-System
```

**Result:** Task 1.4 is now unblocked and has context!

### Step 4: Continue Implementation

```bash
@code execute task 1.4
@code execute task 1.5
@code execute task 1.6
```

## Understanding Dependencies

### How Dependencies Work

**In your tasklist:**
```markdown
| Task ID | Status | Task Description |
|---------|--------|------------------|
| 1.3     | ✅ Done | Create Auth Service |
| 1.4     | ☐ To Do | Implement Login (depends on Task 1.3) |
```

**Orchestrator logic:**
- Task 1.4 depends on Task 1.3
- Task 1.3 status is "✅ Done"
- ✓ Task 1.4 can proceed

**If Task 1.3 was still "To Do":**
- ✗ Task 1.4 would be blocked
- Orchestrator skips it and reports: "Task 1.4 blocked by Task 1.3"

### Re-running is Safe

You can re-run the orchestrator anytime:
- It skips tasks that already have context
- It only generates missing contexts
- It unblocks tasks when dependencies are met

## Cost Optimization

### First Task: Full Cost
```
Task: "Implement XUnit tests"
- Internal analysis: Local (free)
- Memory check: Miss
- GitHub search: External API ($$)
- Cache results: For next time
Total: ~$0.10 (example)
```

### Second Similar Task: Reduced Cost
```
Task: "Add more XUnit tests"
- Internal analysis: Local (free)
- Memory check: Hit! (cached)
- GitHub search: SKIPPED
- Use cached results
Total: ~$0.01 (90% savings)
```

**The more you use it, the cheaper it gets!**

## Common Workflows

### Workflow 1: New Sprint
```bash
# Generate all contexts
@context-orchestrator process sprint 1 in PRDs/01-Authentication-System

# Implement all tasks
@code execute task 1.1
@code execute task 1.2
@code execute task 1.3
# ... continue for all tasks
```

### Workflow 2: Single Feature
```bash
# Generate context
@context-engineer generate context for task 2.5 from PRDs/02-Content/tasklists/tasklist_sprint_02.md

# Implement
@code execute task 2.5
```

### Workflow 3: Blocked Tasks
```bash
# First run
@context-orchestrator process sprint 1 in PRDs/01-Auth
# Result: Some tasks blocked

# Implement unblocked tasks
@code execute task 1.1
@code execute task 1.2

# Re-run to unblock
@context-orchestrator process sprint 1 in PRDs/01-Auth
# Result: Previously blocked tasks now have context

# Continue implementation
@code execute task 1.4
```

## Troubleshooting

### "Context file not found"
**Problem:** You tried to implement before generating context
**Solution:** Run `@context-engineer` or `@context-orchestrator` first

### "Task blocked by dependency"
**Problem:** Dependent task not completed yet
**Solution:** Complete the dependency first, then re-run orchestrator

### "No matches found in semantic search"
**Problem:** New feature with no existing patterns
**Solution:** This is normal! The agent will rely on external best practices

## Best Practices

✅ **DO:**
- Generate context before coding
- Use orchestrator for batch operations
- Review context files before implementation
- Update task status after completion
- Re-run orchestrator after completing blocking tasks

❌ **DON'T:**
- Skip context generation (unless urgent)
- Ignore dependency warnings
- Modify context files manually
- Delete context files

## Next Steps

1. **Try it yourself** with a simple task
2. **Review the context file** to understand what information is gathered
3. **Implement the task** using the context
4. **Scale up** to batch processing with orchestrator

## Need Help?

- **Quick Reference:** `.roo/guides/CONTEXT_AGENTS_QUICK_REFERENCE.md`
- **Complete Workflow:** `.roo/guides/CONTEXT_WORKFLOW_GUIDE.md`
- **Architecture:** `.roo/guides/CONTEXT_AGENTS_ARCHITECTURE_DIAGRAM.md`
- **MCP Tools:** `.roo/guides/MCP_TOOLS_REFERENCE.md`

## Summary

**Remember the flow:**
1. **Generate Context** → `@context-orchestrator` or `@context-engineer`
2. **Review Context** → Check the generated `.md` files
3. **Implement Code** → `@code execute task X.Y`
4. **Unblock Dependencies** → Re-run orchestrator as needed

**Key Benefits:**
- 🎯 More accurate code (follow verified patterns)
- 💰 Lower costs (60-90% savings after cache builds)
- ⚡ Faster implementation (clear step-by-step plans)
- 🔄 Better consistency (use established patterns)

Welcome to context-aware development! 🚀

