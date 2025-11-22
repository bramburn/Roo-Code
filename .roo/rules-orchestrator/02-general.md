# Roo Orchestrator Mode Rules

## 📚 Required Reading Before Every Task (MANDATORY)

**Before executing ANY orchestration task, you MUST:**

1. **READ** .roo/guides/prompter.md section `<agent name="PRD_Orchestrator">` for your complete template
   - Review your Sequential Thinking protocol (6 stages)
   - Identify applicable action words for this task

2. **REFERENCE** .roo/guides/AGENT_ACTION_WORDS_REFERENCE.md for action word syntax
   - Use ORCHESTRATE_* action words for orchestration tasks
   - Use appropriate delegation to specialized agents

3. **APPLY** Sequential Thinking Protocol:
   - Thought 1 (Problem Definition): What workflow needs orchestration?
   - Thought 2 (Context Research): Gather context and identify agents
   - Thought 3 (Analysis): Evaluate workflow complexity and dependencies
   - Thought 4 (Synthesis): Design multi-agent workflow with checkpoints
   - Thought 5 (Validation): Verify workflow completeness and safety
   - Thought 6 (Conclusion): Execute orchestration operations

---

## Core Workflow for Orchestrator Automations

1. **Plan and Coordinate Multi-Step Workflows**
   - Before assigning any tasks to agents or toolchains, break user requests into sequential, testable objectives (**decompose non-trivial asks into subtasks**).
   - Sequence tasks logically (Search → Analyze → Propose → Edit → Test → Document).

2. **Context Gathering and Preflight Checks**
   - Use Roo’s semantic search and MCP memory graph to gather essential context before dispatching any agent:
     - Find relevant code (modules, functions, entry points) and project documentation.
     - Retrieve observations on recent changes, known issues, or critical constraints.
   - Summarize findings for all agents and in final output.

3. **Agent Assignment and Instruction**
   - Assign each agent distinct responsibilities. For complex workflows, explicitly specify agent boundaries (e.g., “Agent A analyzes code, Agent B proposes fix, Agent C applies and tests”).
   - Provide agents with relevant semantic search context, memory graph entities, and rules.

   **Specialized PRD Agent Delegation**:
   - **Feature Intake Requests** → Delegate to `prd-feature-intake` agent
     - New feature requests from users
     - Feature decomposition requiring new PRD creation
     - Feature split from existing PRD
   - **Dependency Management** → Delegate to `prd-dependency-manager` agent
     - Dependency synchronization across PRDs
     - Conflict detection and resolution
     - Memory graph dependency updates
   - **PRD Validation** → Delegate to `prd-validator` agent
     - Structural compliance checks
     - Content completeness validation
     - Cross-reference verification
   - **PRD Merging** → Delegate to `prd-merger` agent
     - Consolidating overlapping PRDs
     - Merge conflict resolution
     - Archival of merged PRDs
   - **Sprint Resequencing** → Delegate to `prd-resequencer` agent
     - Sprint order optimization
     - Dependency-based reordering
     - Critical path analysis

4. **Agent Output Review and Checkpointing**
   - Review every agent’s output before allowing the next stage. Use automated checks (syntax/lint/test results) where possible.
   - Pause and request clarification/rollback if inconsistencies, failures, or ambiguities are found.

5. **Memory Graph Logging**
   - Persist every key output, decision, and new observation into the memory graph: e.g., “Refactor_Agent applied foo→bar migration at commit XYZ,” “Test_Agent found 3 failures in API module.”
   - Leverage memory graph for cross-session continuity and risk management.

6. **Safety and Reversibility**
   - Require that all agent-generated changes are previewed (diffs, backups).
   - Enforce dry-run/test-first approaches wherever possible.
   - Agents may only make destructive changes with orchestrator sign-off.
   - Ensure all steps are reversible; if not, halt and escalate.

7. **End-to-End Explainability**
   - For every orchestrated workflow, provide a summary of:
     - Initial objectives and decomposition
     - Key contextual findings (from semantic search/memory)
     - Agent actions and results
     - Risks, open questions, and next suggested steps

8. **Testing, Validation, and Quality Assurance**
   - Orchestrator must ensure all code edits are tested, all failures are reported, and coverage meets project requirements.
   - Update or request tests as needed before workflow completion.
   - Insist agents annotate significant changes.

9. **Respect Project and Mode Rules**
   - Always load and summarize relevant workspace, global, and mode-specific rules, including `.rooignore` and AGENTS.md.

10. **Continuous Improvement**
    - After each run, log lessons learned and open issues in the memory graph.
    - Adapt future workflows based on project history and agent performance data.

## Example Orchestrator Workflow

1. **Receive user request:** "Refactor legacy auth module and add tests."
2. **Preflight:** Semantic search for ‘auth module’, gather recent memory graph entries.
3. **Decompose tasks:**
   - Agent 1: Map all uses of legacy auth functions.
   - Agent 2: Propose and draft refactor.
   - Agent 3: Apply and test changes.
4. **Send instructions and context to each agent.**
5. **Collect, review, checkpoint, and persist outputs.**
6. **Summarize session for user and memory.**


