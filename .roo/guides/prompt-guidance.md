## Detailed Guidance for Improving Your PRD Prompt Template

Based on analysis of your `paste.txt` file and current best practices in PRD automation, prompt engineering, and sequential thinking integration, here's comprehensive guidance to enhance your workflow and LLM output quality:

### **1. Integrate Sequential Thinking Framework**

Your current prompt uses a rigid step-based workflow. Enhance it by incorporating explicit sequential thinking capabilities that allow for revision and reflection.[1][2][3]

**Add this instruction section:**

```xml
<instruction>
    **Sequential Thinking Integration**:

    - Before executing any workflow step, use Sequential Thinking to plan the approach
    - For each major decision point (Steps 3, 4, 7, 16, 19), articulate reasoning explicitly
    - Document thought progression: Problem Definition → Research → Analysis → Synthesis → Conclusion
    - Allow for revision of earlier steps when new information emerges
    - Create branches for alternative approaches when uncertainty exists
    - Track your reasoning chain to maintain context across multi-step PRD operations

    When processing complex PRD requests:
    1. INVOKE Sequential Thinking to decompose the request into logical phases
    2. For each phase, document assumptions, constraints, and decision rationale
    3. Review and revise the plan before executing file operations
    4. Generate a summary of the thinking process alongside the instruction output
</instruction>
```

### **2. Enhance Request Clarification Section**

Your current "Request Clarification" is basic. Make it more robust and structured.[4][5][6]

**Replace existing clarification instruction with:**

```xml
<instruction>
    **Enhanced Request Clarification Process**:

    Before generating numbered instructions, create a comprehensive Request Clarification section that:

    1. **Restates the Original Request**: Paraphrase the user query in clear, unambiguous language
    2. **Identifies Implicit Requirements**: Surface unstated assumptions (e.g., "This requires authentication integration")
    3. **Defines Success Criteria**: What does "done" look like for this request?
    4. **Highlights Uncertainties**: Flag any ambiguous elements that need user confirmation
    5. **Provides Context Enrichment**: Add relevant domain knowledge from web search or memory graph
    6. **Proposes Scope Boundaries**: Define what is and isn't included in this PRD

    Format example:

    **Request Clarification**:

    *Original Request Summary*: [Paraphrased user query]

    *Inferred Requirements*:
    - [Requirement 1 based on domain knowledge]
    - [Requirement 2 based on similar PRDs]

    *Success Criteria*:
    - [Measurable outcome 1]
    - [Measurable outcome 2]

    *Assumptions & Uncertainties*:
    - Assuming: [Assumption 1]
    - Need clarification on: [Uncertainty 1]

    *Scope*:
    - In Scope: [Items included]
    - Out of Scope: [Items excluded]
</instruction>
```

### **3. Add Iterative Reflection and Quality Checks**

Build in self-correction and quality validation before finalizing output.[7][8][9]

**Add this instruction:**

```xml
<instruction>
    **Output Quality Validation**:

    After generating numbered instructions but before presenting to user:

    1. **Completeness Check**:
       - Validate all referenced files exist or will be created
       - Ensure all workflow steps (1-22) are accounted for
       - Verify all sidecar documents (dependencies.md, testing-strategy.md, etc.) are included

    2. **Consistency Check**:
       - Verify step references are accurate (no references to non-existent steps)
       - Ensure action words match the defined vocabulary exactly
       - Validate that memory graph operations are present where needed

    3. **Clarity Check**:
       - Each instruction must be specific and executable
       - No vague phrases like "update as needed"
       - Include exact file paths and content descriptions

    4. **Self-Correction Protocol**:
       - If any check fails, revise the instruction set before output
       - Annotate any assumptions or limitations with [NOTE: ...]
       - Flag instructions requiring manual review with [REQUIRES REVIEW: ...]

    Do NOT output failed instruction sets. Always self-correct first.
</instruction>
```

### **4. Improve Action Word Specificity**

Your action words are good but can be more precise with parameters.[5][10]

**Enhance action word definitions:**

```xml
<instruction>
    **Enhanced Action Word Definitions**:

    Replace generic actions with specific, parameterized formats:

    - CREATE [file_path] WITH CONTENT [exact_content_description] AND SECTIONS [section1, section2, ...]
    - EDIT [file_path] SECTION [section_name] TO [exact_change] PRESERVING [elements_to_keep]
    - WEB SEARCH [query] FOR PURPOSE [research_objective] DOCUMENTING [specific_findings_needed]
    - VALIDATE [file_path] AGAINST REQUIREMENTS [requirement1, requirement2, ...]
    - MEMORY_SEARCH [query] EXPECTING [entity_types] TO INFORM [decision_point]

    Each action must include:
    - What: The operation to perform
    - Where: The exact location (file path, memory node, etc.)
    - Why: The purpose (links back to requirement or workflow step)
    - How: The specific method or format to use

    Example:
    Instead of: "CREATE PRD.md"
    Use: "CREATE PRDs/05-analytics/PRD.md WITH CONTENT [comprehensive analytics dashboard requirements] AND SECTIONS [Overview, User Stories, Technical Requirements, Sprint Breakdown, Dependencies] BASED ON WEB SEARCH FINDINGS"
</instruction>
```

### **5. Enhance Web Search Integration**

Make web search more strategic and integrated into the workflow.[11][12][5]

**Add this instruction:**

```xml
<instruction>
    **Strategic Web Search Integration**:

    Invoke web search at specific workflow points for maximum value:

    **At Step 8 (New PRD Creation)**:
    - Search for: "[feature/domain] best practices [current year]"
    - Search for: "[feature/domain] implementation patterns and architecture"
    - Search for: "[feature/domain] security considerations and compliance requirements"

    **Document findings in structured format**:
    - Industry Standards: [findings from search 1]
    - Implementation Approaches: [findings from search 2]
    - Security & Compliance: [findings from search 3]

    **Integrate findings into PRD content**:
    - Reference best practices in Technical Requirements section
    - Incorporate security standards into testing-strategy.md
    - Document architectural patterns in dependencies.md

    **Citation requirement**:
    - Add [NOTE: Based on industry research [date]] to web-informed sections
    - Preserve source URLs in dependencies.md under "Research References" section
</instruction>
```

### **6. Add Few-Shot Learning Examples**

Your examples are good but can be enhanced with explicit reasoning traces.[2][6][7]

**Enhance example format:**

```xml
<example>
    <user-query>Create a PRD for real-time notification system</user-query>

    <sequential-thinking-trace>
        Thought 1 (Problem Definition): User needs PRD for real-time notifications. This implies WebSocket/SSE technology, push notification services, and user preference management.

        Thought 2 (Research): Need to search for notification system best practices, real-time architecture patterns, and push service providers.

        Thought 3 (Analysis): Similar to existing PRDs? Check for messaging, real-time features. Found PRD-03 has some overlap but different scope.

        Thought 4 (Synthesis): Will create new PRD with sprints: 1) WebSocket infrastructure, 2) Notification service integration, 3) User preferences, 4) Mobile push.

        Thought 5 (Conclusion): New PRD needed. Web search required for technical standards. Memory graph should link to existing messaging PRDs.
    </sequential-thinking-trace>

    <generated-instructions>
        **Request Clarification**:
        [Enhanced clarification as described in improvement #2]

        1. Initialize Memory Graph... [rest of instructions]
    </generated-instructions>
</example>
```

### **7. Strengthen Guardrails and Error Prevention**

Add explicit constraints to prevent common errors.[13][10][9]

**Add this instruction:**

```xml
<instruction>
    **Guardrails and Error Prevention**:

    **Prohibited Patterns**:
    - NEVER reference steps beyond Step 22
    - NEVER use action words not in the defined vocabulary
    - NEVER create PRDs without web search for new domains
    - NEVER skip memory graph initialization (Step 2)
    - NEVER output instructions without Request Clarification section

    **Required Validations**:
    - Before EDIT: Confirm file exists via READ or CREATE
    - Before MOVE: Validate source and destination paths
    - Before MEMORY_RELATE: Ensure both entities exist
    - Before creating sub-sprints: Confirm parent PRD.md exists and contains sprint definitions

    **Automatic Corrections**:
    - If file reference missing: Insert CREATE instruction before dependent operations
    - If step reference invalid: Revise workflow to include missing step or update reference
    - If action word undefined: Use closest defined action or flag for manual review
    - If memory graph operation missing: Insert at Step 2 and relevant update points
</instruction>
```

### **8. Optimize for Codebase Integration**

Your codebase integration instruction is good but needs more specificity.[5][11]

**Enhance codebase integration:**

```xml
<instruction>
    **Enhanced Codebase Integration Protocol**:

    Before creating tasklists for any PRD:

    1. **Architecture Analysis**:
       - READ ARCHITECTURE.md to identify relevant modules, services, and integration points
       - SEARCH codebase for existing implementations of similar features
       - IDENTIFY entry points, API endpoints, and data models that will be affected

    2. **Dependency Mapping**:
       - LIST all files that will need modification
       - IDENTIFY shared utilities or services that can be leveraged
       - DETECT potential conflicts with existing features

    3. **Task Specification Format**:
       Each task in tasklist must include:
       - File Path: `src/services/auth/AuthService.ts`
       - Function/Class: `class AuthService { ... }`
       - Change Type: [CREATE | MODIFY | DELETE]
       - Integration Point: Links to other files/services affected
       - Testing File: Corresponding test file path

    4. **Cross-Reference Requirements**:
       - In dependencies.md: List all code dependencies (files, packages, services)
       - In testing-strategy.md: Reference specific test files and integration test scenarios
       - In rollback-plan.md: Document files to revert and database migrations to reverse
</instruction>
```

### **9. Add Progress Tracking and Metrics**

Enhance visibility into PRD workflow execution.[14][4]

**Add this instruction:**

```xml
<instruction>
    **Progress Tracking and Metrics**:

    Maintain execution metrics for transparency:

    **During Execution**:
    - Track: Number of files created, edited, moved
    - Track: Web searches performed and key findings
    - Track: Memory graph operations (entities created, relations established)
    - Track: Workflow path taken (which branches in Steps 3-22)

    **In Output**:
    - Include execution summary at end: "[EXECUTION SUMMARY: Created 7 files, performed 3 web searches, established 4 memory relations, workflow path: Steps 1→2→3→4→5→8→9→10→11→13→15→16→17→19→22]"

    **In Memory Graph**:
    - Store execution metadata with each PRD entity
    - Track: Creation time, last updated, completion percentage, blocker status

    **In README.md Updates**:
    - Maintain status dashboard showing: Active PRDs, Completed PRDs, Blocked PRDs with reasons
</instruction>
```

### **10. Add Explicit Output Format Template**

Standardize output for consistency.[10][5]

**Add this instruction:**

```xml
<instruction>
    **Standardized Output Format**:

    Every response must follow this exact structure:

    ---
    ## Request Clarification
    [Comprehensive clarification following enhancement #2]

    ---
    ## Sequential Thinking Summary
    [Brief summary of reasoning process, 3-5 key thoughts]

    ---
    ## Executable Instructions

    1. [Instruction with exact action word, file path, and specific operation]
    2. [Instruction with exact action word, file path, and specific operation]
    ...
    N. [Final instruction]

    ---
    ## Execution Summary
    [Metrics and workflow path as described in enhancement #9]

    ---

    **Format Rules**:
    - Use markdown headers (##) for section breaks
    - Number all instructions sequentially starting from 1
    - Use [NOTE: ...] for explanatory annotations
    - Use [REQUIRES REVIEW: ...] for flagged items
    - Never include XML tags in output
</instruction>
```

### **Summary: Key Improvements**

| Improvement Area      | Current State        | Enhanced State                           | Impact                                              |
| --------------------- | -------------------- | ---------------------------------------- | --------------------------------------------------- |
| Sequential Thinking   | Rigid step workflow  | Reflective, revisable reasoning          | Higher quality decisions, better edge case handling |
| Request Clarification | Basic paraphrase     | Structured 6-part clarification          | Reduced ambiguity, explicit success criteria        |
| Quality Validation    | None                 | 4-check validation with self-correction  | Fewer errors, consistent output                     |
| Action Words          | Generic              | Parameterized with purpose               | More executable, traceable instructions             |
| Web Search            | Basic integration    | Strategic, documented, cited             | Better-informed PRDs, current best practices        |
| Examples              | Good structure       | Include reasoning traces                 | Better LLM learning, consistent pattern matching    |
| Guardrails            | Basic rules          | Explicit prohibitions + auto-corrections | Prevents common errors, self-healing                |
| Codebase Integration  | High-level           | File-specific with integration points    | More actionable tasks, better testing               |
| Progress Tracking     | Minimal              | Comprehensive metrics                    | Transparency, debugging capability                  |
| Output Format         | Consistent but basic | Standardized template with sections      | Easier parsing, better UX                           |

### **Implementation Priority**

1. **High Priority** (Implement first for immediate impact):

    - Sequential Thinking Integration (#1)
    - Enhanced Request Clarification (#2)
    - Output Quality Validation (#3)

2. **Medium Priority** (Implement for workflow improvement):

    - Action Word Specificity (#4)
    - Web Search Integration (#5)
    - Guardrails and Error Prevention (#7)

3. **Lower Priority** (Implement for polish and metrics):
    - Few-Shot Learning Examples (#6)
    - Codebase Integration Enhancement (#8)
    - Progress Tracking (#9)
    - Standardized Output Format (#10)

These enhancements will transform your PRD automation from a rigid instruction generator into an intelligent, reflective, and self-correcting system that produces higher-quality, more actionable PRD workflows.[15][6][3][4][1][2][11][7][5]

[1](https://www.magicslides.app/mcps/arben-adm-sequential-thinking)
[2](https://skeet.build/docs/integrations/sequentialthinking)
[3](https://skywork.ai/skypage/en/unlocking-structured-ai-reasoning/1977642632387035136)
[4](https://www.smartsheet.com/content/ai-prompts-project-management)
[5](https://chatprd.ai/resources/PRD-for-Cursor)
[6](https://www.productboard.com/blog/6-ai-prompt-templates-for-product-managers/)
[7](https://www.promptingguide.ai/guides/optimizing-prompts)
[8](https://blog.langchain.com/exploring-prompt-optimization/)
[9](https://www.supercharge.io/us/blog/ai-prompt-engineering-best-practices)
[10](https://help.openai.com/en/articles/6654000-best-practices-for-prompt-engineering-with-the-openai-api)
[11](https://skywork.ai/skypage/en/agentic-ai-anthropic-mcp-server/1977625471811522560)
[12](https://kovyrin.net/2025/06/20/prd-tasklist-process/)
[13](https://www.atlassian.com/blog/announcements/best-practices-for-generating-ai-prompts)
[14](https://www.forbes.com/sites/bernardmarr/2025/05/07/7-powerful-ai-prompts-every-project-manager-needs-to-master-now/)
[15](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/127604006/51ddbdd0-a79a-4c05-a1ce-e55f9f66db29/paste.txt)
[16](https://cloud.google.com/discover/what-is-prompt-engineering)
[17](https://www.atlassian.com/blog/artificial-intelligence/ultimate-guide-writing-ai-prompts)
[18](https://pmprompt.com/blog/prd-templates)
[19](https://playbooks.com/mcp/agentdesk-workflows)
[20](https://www.news.aakashg.com/p/product-requirements-documents-prds)
[21](https://triskellsoftware.com/blog/ai-project-management/)
[22](https://www.reddit.com/r/ClaudeAI/comments/1mx0899/crash_mcp_yeah_its_another_sequential_thinking/)
[23](https://www.reddit.com/r/ChatGPTCoding/comments/1k5jvgn/prompt_templates_for_creating_documentation_fast/)
[24](https://www.glean.com/blog/ai-prompts-for-project-managers)
