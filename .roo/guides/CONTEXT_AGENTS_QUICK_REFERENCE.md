# Context Agents Quick Reference Card

## Quick Commands

### Generate Context for Single Task
```bash
@context-engineer generate context for task 1.3 from PRDs/01-Authentication-System/tasklists/tasklist_sprint_01.md
```

### Generate Context for Entire Sprint (Batch)
```bash
@context-orchestrator process sprint 1 in PRDs/01-Authentication-System
```

### Implement Task (Context-Aware)
```bash
@code execute task 1.3
```

## Agent Overview

| Agent | Role | Permissions | Purpose |
|-------|------|-------------|---------|
| **context-engineer** | Research | read, mcp, browser | Generate context for single task |
| **context-orchestrator** | Orchestration | read, mcp, command | Batch context generation for sprint |
| **code** | Implementation | read, edit, command, mcp | Implement code using context |

## Workflow Cheat Sheet

```
1. Generate Context (Batch)
   @context-orchestrator process sprint 1 in PRDs/[PRD-Name]
   ↓
2. Review Context Files (Optional)
   Check PRDs/[PRD-Name]/context/task-*.md
   ↓
3. Implement Tasks
   @code execute task 1.1
   @code execute task 1.2
   ↓
4. Unblock Dependencies (If Needed)
   @context-orchestrator process sprint 1 in PRDs/[PRD-Name]
   ↓
5. Continue Implementation
   @code execute task 1.4
```

## File Locations

| Item | Location |
|------|----------|
| Context Files | `PRDs/[PRD-Name]/context/task-[ID]-context.md` |
| Task Lists | `PRDs/[PRD-Name]/tasklists/tasklist_sprint_XX.md` |
| Context Template | `.roo/templates/context_template.md` |
| Workflow Guide | `.roo/guides/CONTEXT_WORKFLOW_GUIDE.md` |

## Context File Structure

```markdown
# Context for Task [ID]: [Description]

## 1. Current Code Analysis (Internal)
   - Existing code patterns
   - Architecture analysis

## 2. External Best Practices (GitHub)
   - High-quality examples
   - Best practices

## 3. Internal Knowledge Base (Memory)
   - Cached knowledge
   - Previous findings

## 4. Suggested Implementation Plan
   - Step-by-step instructions
   - Exact file paths

## 5. Dependencies
   - Task dependencies
   - File dependencies

## 6. Notes and Warnings
   - Important considerations
   - Potential issues
```

## Research Loop (4 Steps)

```
Step 1: Internal Analysis
   ↓ ast-grep-mcp, semantic_search
Step 2: Memory Check
   ↓ mcp_memory (cache hit?)
Step 3: External Research (if no cache)
   ↓ github_mcp → cache results
Step 4: Planning
   ↓ Generate implementation plan
```

## MCP Tools

| Tool | Purpose | When to Use |
|------|---------|-------------|
| **ast-grep-mcp** | Code structure analysis | Find classes, methods, patterns |
| **semantic_search** | Pattern matching | Find similar implementations |
| **github_mcp** | External research | Get best practices (if not cached) |
| **mcp_memory** | Knowledge cache | Store/retrieve findings |

## Common Scenarios

### Scenario 1: Start New Sprint
```bash
# Generate all contexts
@context-orchestrator process sprint 1 in PRDs/01-Authentication-System

# Implement tasks
@code execute task 1.1
@code execute task 1.2
```

### Scenario 2: Single Task
```bash
# Generate context
@context-engineer generate context for task 1.3 from PRDs/01-Authentication-System/tasklists/tasklist_sprint_01.md

# Implement
@code execute task 1.3
```

### Scenario 3: Blocked Tasks
```bash
# First run - some tasks blocked
@context-orchestrator process sprint 1 in PRDs/01-Authentication-System
# Result: Tasks 1.4, 1.7 blocked

# Implement unblocked tasks
@code execute task 1.1
@code execute task 1.2
@code execute task 1.3

# Re-run to unblock
@context-orchestrator process sprint 1 in PRDs/01-Authentication-System
# Result: Task 1.4 now unblocked

# Continue implementation
@code execute task 1.4
```

## Error Messages

### "Context file not found"
**Cause:** Code agent called before context generation
**Solution:** Run `@context-engineer` or `@context-orchestrator` first

### "Task blocked by dependency"
**Cause:** Dependent task not marked "Done"
**Solution:** Complete dependency first, then re-run orchestrator

### "No matches found in semantic search"
**Cause:** New feature with no existing patterns
**Solution:** Normal - rely on external best practices

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
- Modify context files manually (regenerate instead)
- Delete context files (keep for reference)

## Performance Tips

### First Run (Cold Start)
- All research steps execute
- External API calls required
- Time: ~2-3 minutes per task

### Subsequent Runs (Warm Cache)
- Memory cache hits
- Skip external research
- Time: ~30-60 seconds per task
- Cost savings: 60-90%

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Context directory missing | Run orchestrator (creates automatically) |
| Task not in tasklist | Check task ID, verify tasklist path |
| MCP tool unavailable | Check tool configuration, authentication |
| Rate limit exceeded | Use cached results, wait for reset |

## Key Benefits

🎯 **Accuracy:** Follow verified patterns and best practices
💰 **Cost Savings:** 60-90% reduction after cache builds up
⚡ **Speed:** Faster implementation with clear plans
🔄 **Consistency:** Use established codebase patterns
📊 **Knowledge Reuse:** Build organizational knowledge base

## Quick Links

- [Complete Workflow Guide](.roo/guides/CONTEXT_WORKFLOW_GUIDE.md)
- [Research Protocol](.roo/guides/RESEARCH_ORCHESTRATION_PROTOCOL.md)
- [MCP Tools Reference](.roo/guides/MCP_TOOLS_REFERENCE.md)
- [Directory Structure](.roo/guides/CONTEXT_DIRECTORY_STRUCTURE.md)
- [Context Template](.roo/templates/context_template.md)
- [Implementation Summary](../../CONTEXT_AGENTS_IMPLEMENTATION_SUMMARY.md)

