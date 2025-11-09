# Roo Code Mode Rules

## Context-Aware Code Implementation (MANDATORY)

**CRITICAL:** Before implementing ANY task, you MUST check for a context file.

### Context File Check Protocol

1. **Identify Task ID**: Extract task ID from user request (e.g., "execute task 1.3")
2. **Locate Context File**: Check for `PRDs/[PRD-Name]/context/task-[ID]-context.md`
3. **Decision Logic**:
    - **If Found**: Load context file, follow implementation plan (Section 4)
    - **If Not Found**: Return error and request context generation

### Context File Usage

**When context file exists:**

1. **Read ALL 6 sections** of the context file
2. **Prioritize Section 4** (Suggested Implementation Plan) as primary instructions
3. **Reference Section 1** (Current Code Analysis) for existing patterns
4. **Reference Section 2/3** (Best Practices/Memory) for implementation guidance
5. **Check Section 5** (Dependencies) before starting
6. **Follow exact file paths** and method names from the plan

**Error Handling:**

```
User: @code execute task 1.3

Code Agent Response:
"Error: Context file not found at PRDs/01-Authentication-System/context/task-1.3-context.md

Please run context generation first:
@context-engineer generate context for task 1.3 from PRDs/01-Authentication-System/tasklists/tasklist_sprint_01.md

Or for batch generation:
@context-orchestrator process sprint 1 in PRDs/01-Authentication-System"
```

### Task Status Updates

**After implementation:**

1. Update task status in tasklist from "☐ To Do" to "✅ Done"
2. Note completion in context file (optional)
3. Report completion to user

## Core Workflow Principles for Automations & Refactoring

1. **Always Analyze Code Context Before Editing**

    - **FIRST**: Check for context file (see Context-Aware Protocol above)
    - Use semantic codebase search via `codebase_search` to understand usage patterns, related logic, and architectural dependencies.
    - Employ MCP tools (such as ast-grep MCP and memory graph) to traverse code relationships and persist insights.

2. **Multi-Step AI Workflows—Inspired by Augment**

    - Break every code task into clear stages: Search → Understand → Plan → Edit → Validate → Document.
    - For orchestrator mode, coordinate each agent step and checkpoint. Always log actions and results as "memories" for future reference.

3. **Semantic Codebase Search First**

    - Utilize Roo's semantic search before writing/refactoring code:
        - Example queries: "Find all API authentication middleware," "Locate database connection setup in src/data," "Show error handling patterns in src/api."
    - Prefer feature-focused and concept-oriented queries to maximize coverage.

4. **AST-Based Safe Refactoring**

    - For any rewrite, use ast-grep MCP to:
        - Analyze structure (dump syntax tree).
        - Detect patterns using YAML-based rules.
        - Preview and confirm all changes before applying.
    - Back up all modified files and generate diffs.

5. **Memory Graph Integration**

    - Before editing or refactoring, retrieve related entities and observations (e.g. deprecated functions, module ownership, prior bug fixes) from the MCP memory graph.
    - After each major automation or refactor, add or update graph nodes to persist new knowledge/context.

6. **Code Quality and Consistency**

    - Write code in strict accordance with workspace coding guidelines.
    - Use descriptive naming (camelCase for JS, snake_case for Python, etc.).
    - Add inline comments for complex logic and JSDoc/Docstring for public APIs.

7. **Unit and Integration Testing Requirement**

    - For every new function, write unit tests.
    - When refactoring, validate that all affected tests still pass or update them as needed.

8. **Reasoning and Explainability**

    - Always explain your plan before showing code.
    - For orchestrator/ask modes, summarize the context, steps taken, and risks.
    - Document known limitations or assumptions.

9. **Agent and Orchestrator Rules**

    - Agents must independently confirm all assumptions via semantic search, MCP facts, or code reading.
    - Orchestrator coordinates agents, reviews checkpoint outputs, and revises instructions as needed.
    - In ask mode, provide concise answers enriched by semantic context and relevant search results.

10. **Incremental and Reversible Changes**

    - Prefer gradual, reversible edits; apply in small batches with clear rollback/backup options.

11. **Accessibility and Responsiveness**
    - For any UI-related code, ensure it meets accessibility standards and adapts to all device sizes.

## Example Agent Workflow for Code Mode (Context-Aware)

### With Context File (Preferred)

1. **Check for Context File:**

    - User: `@code execute task 1.3`
    - Agent: Check `PRDs/01-Authentication-System/context/task-1.3-context.md`
    - **If found**: Proceed to step 2
    - **If not found**: Return error and request context generation

2. **Load Context:**

    - Read all 6 sections of context file
    - Extract implementation plan (Section 4)
    - Note dependencies (Section 5)
    - Review code patterns (Sections 1-3)

3. **Verify Dependencies:**

    - Check Section 5 for task dependencies
    - Verify dependent tasks are marked "✅ Done" in tasklist
    - If blocked, report and wait

4. **Follow Implementation Plan:**

    - Execute steps from Section 4 in order
    - Use exact file paths specified
    - Follow code patterns from Sections 1-3
    - Reference best practices from Section 2

5. **Validate & Update:**
    - Run tests as specified in plan
    - Update task status to "✅ Done" in tasklist
    - Report completion with summary

### Without Context File (Legacy/Fallback)

1. **Start with Semantic Search:**

    - Search for the concept: "user profile update workflow."
    - Review results: implementation files, function names, context.

2. **Context/Memory Scan:**

    - Query MCP memory graph for relevant node: "UserProfileModule."
    - Retrieve documentation, known issues, linked entities.

3. **Plan Refactor/Addition:**

    - Outline planned changes referencing findings from semantic search and memory context.
    - Get orchestrator approval if multi-agent.

4. **Edit Code:**

    - Use ast-grep MCP for safe pattern matching/rewrite if structure edit needed.
    - Annotate important changes.

5. **Validate & Document:**
    - Run all tests or relevant subset (unit/integration).
    - Add observations/links to MCP memory graph.
    - Summarize edits in latest commit message.

## Additional Rules

- Always check if `.rooignore` excludes files/directories before processing them.
- Symbolic links in rules directories are supported; skip temp, cache, and log files.
- Use workspace-wide rules to override global organization standards when necessary.
- Respect AGENTS.md agent rules if present.

## Context System Integration

### Benefits of Context-Aware Implementation

1. **Reduced Token Usage**: Context file provides pre-researched information
2. **Improved Accuracy**: Follow verified patterns and best practices
3. **Faster Implementation**: Clear step-by-step plan eliminates guesswork
4. **Consistency**: Use established codebase patterns
5. **Dependency Awareness**: Know what must be done first

### Context File Location

**Standard Path:** `PRDs/[PRD-Name]/context/task-[ID]-context.md`

**Examples:**

- `PRDs/01-Authentication-System/context/task-1.3-context.md`
- `PRDs/02-Content-Structure/context/task-2.1-context.md`

### When Context is Not Available

**If context file doesn't exist:**

1. Inform user context is missing
2. Suggest running `@context-engineer` or `@context-orchestrator`
3. Provide exact command to generate context
4. Do NOT proceed with implementation without context (unless user explicitly requests)

**Exception:** For urgent fixes or simple tasks, user may request proceeding without context.

### References

- Context Workflow: `.roo/guides/CONTEXT_WORKFLOW_GUIDE.md`
- Context Template: `.roo/templates/context_template.md`
- Directory Structure: `.roo/guides/CONTEXT_DIRECTORY_STRUCTURE.md`
