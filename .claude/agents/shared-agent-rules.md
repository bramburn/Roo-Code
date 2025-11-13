# Shared Agent Rules for PRD Management

## Overview

This file contains shared conventions, output formats, and behavioral rules that apply to ALL PRD agents in the `.claude/agents/` directory.

---

## Sequential Thinking Protocol (Universal)

ALL agents MUST use this 6-stage protocol for every operation:

1. **Problem Definition**: What needs to be done?

    - Clearly state the task or request
    - Identify the scope and boundaries
    - Determine success criteria

2. **Context Research**: Gather relevant information

    - **ARCHITECTURE_READ**: Always read ARCHITECTURE.md first for project context
    - **REPO_DETECT_TYPE**: Analyze repository structure and detect repository type
    - **REPO_ANALYZE_TECH_STACK**: Identify technology stack from architecture
    - Search memory graph for related entities
    - Read relevant PRD files and documentation
    - Identify dependencies and constraints
    - Verify repository boundaries (detected from architecture)
    - Check technology stack compatibility (detected from repository)

3. **Analysis**: Evaluate the situation

    - Assess complexity and risks
    - Identify potential approaches
    - **REPO_ADAPT_APPROACH**: Adapt approach based on repository type and tech stack
    - Evaluate trade-offs

4. **Synthesis**: Design the solution

    - Create detailed execution plan
    - **REPO_TAILOR_PLAN**: Tailor plan to detected repository characteristics
    - Define agent coordination if needed
    - Plan rollback strategy

5. **Validation**: Verify the approach

    - Check plan completeness
    - Verify action word compliance
    - Confirm no conflicts with existing PRDs

6. **Conclusion**: Execute the plan
    - Generate numbered executable instructions
    - Use only agent-specific action words
    - Update memory graph and documentation

---

## Universal Output Format

Every agent response MUST include these sections in order:

### 1. Planning Trace

```
## Planning Trace

**Thought 1 - Problem Definition**: [What needs to be done]
**Thought 2 - Context Research**: [Information gathered]
**Thought 3 - Analysis**: [Evaluation of situation]
**Thought 4 - Synthesis**: [Solution design]
**Thought 5 - Validation**: [Verification of approach]
**Thought 6 - Conclusion**: [Execution plan summary]
```

### 2. Executable Instructions

```
## Executable Instructions

1. ACTION_WORD [parameters] USING [resources] OUTPUTTING [results]
2. ACTION_WORD [parameters] CHECKING [validations] REPORTING [status]
...
```

### 3. Memory Graph Updates

```
## Memory Graph Updates

- MEMORY_STORE entity:[entity_name] type:[entity_type] properties:[key_properties]
- MEMORY_RELATE from:[entity_a] to:[entity_b] relation:[relationship_type]
- MEMORY_OBSERVE entity:[entity_name] observation:[fact_or_status]
```

### 4. Documentation

```
## Documentation

- CHANGELOG.md: [updates made]
- Operation Report: [summary of actions]
- Validation Results: [compliance scores, issues found/fixed]
```

---

## Action Word Compliance Rules

### Prohibited Generic Actions

Agents MUST NOT use generic action words when specialized ones exist:

- ❌ SEARCH (use agent-specific search actions)
- ❌ CREATE (use INTAKE_CREATE_FOLDER, MERGE_CREATE, etc.)
- ❌ EDIT (use VALIDATE_CONTENT, MERGE_CONSOLIDATE, etc.)
- ❌ DELETE (use MERGE_ARCHIVE, RESEQUENCE_MOVE, etc.)

### Repository Detection Action Words

- **REPO_DETECT_TYPE**: Analyze repository structure and determine type (mono-repo, single-repo, etc.)
- **REPO_ANALYZE_TECH_STACK**: Identify technology stack from architecture and files
- **REPO_ADAPT_APPROACH**: Modify approach based on repository characteristics
- **REPO_TAILOR_PLAN**: Customize execution plan for repository type
- **REPO_VALIDATE_BOUNDARIES**: Verify working within correct repository boundaries
- **REPO_CHECK_COMPATIBILITY**: Validate technology stack compatibility

### Required Action Word Format

```
ACTION_WORD [primary_target] USING [method/tool] WITH [parameters] OUTPUTTING [result]
```

---

## PRD Folder Structure (Universal Standard)

Every PRD folder MUST contain (per INSTRUCTION.md):

```
PRDs/[NN]-[feature-name]/
├── PRD.md                    # Main PRD document
├── README.md                 # Quick reference with API links
├── CHANGELOG.md              # Version history
├── dependencies.md           # Technical prerequisites
├── testing-strategy.md       # Test coverage plans
├── rollback-plan.md          # Rollback procedures
├── sub-sprints/              # Directory for sub-sprint documents
└── tasklists/                # Directory for sprint tasklists
```

---

## Memory Graph Standards

### Entity Types

- `PRD`: Product Requirements Document
- `Feature`: Specific feature or capability
- `Sprint`: Development sprint
- `Dependency`: Technical or logical dependency
- `Agent_Operation`: Record of agent execution
- `Repository`: Repository instance with type and characteristics
- `Architecture_Component`: Major system components (backend API, extension, admin panel)
- `Technology_Stack`: Technologies and versions (detected from repository)
- `Architecture_Pattern`: Design patterns and conventions (service-based, event-driven)
- `System_Boundary`: System limits and interfaces (detected from repository structure)

### Relation Types

- `depends_on`: Dependency relationship
- `implements`: Implementation relationship
- `validates`: Validation relationship
- `merges_into`: Merge relationship
- `delegates_to`: Delegation relationship
- `architecturally_compliant_with`: Architecture compliance relationship
- `integrates_with`: Integration relationship between components
- `conforms_to`: Conformance to technology standards
- `configured_for`: Repository configuration relationship
- `compatible_with`: Technology compatibility relationship

### Observation Format

```
MEMORY_OBSERVE entity:[entity_name] observation:"[fact] on [date] with [status]"
```

---

## Delegation Protocol

### When to Delegate

Agents delegate when:

- Task requires specialized expertise of another agent
- Operation crosses agent responsibility boundaries
- Validation or synchronization is needed

### Delegation Format

```
AGENT_DELEGATE_TO [target_agent] WITH_TASK "[task_description]" PASSING_DATA [data_structure]
```

### Common Delegation Patterns

- **Intake → Validator**: After PRD creation
- **Intake → Dependency Manager**: After feature registration
- **Merger → Dependency Manager**: After merge completion
- **Resequencer → Dependency Manager**: After folder moves
- **Any → Orchestrator**: For complex multi-agent workflows
- **Code Context Integrator → Dependency Manager**: After architecture mapping
- **System Requirements Manager → Dependency Manager**: After architecture validation

---

## Validation Checklist (Universal)

Before completing ANY task, verify:

- [ ] Planning Trace documented with 6 thoughts
- [ ] **ARCHITECTURE_READ**: ARCHITECTURE.md read and understood
- [ ] **REPO_DETECT_TYPE**: Repository type detected and analyzed
- [ ] **REPO_ANALYZE_TECH_STACK**: Technology stack identified from repository
- [ ] Repository boundaries verified (detected from architecture)
- [ ] Technology stack compatibility checked (detected from repository)
- [ ] All executable instructions use agent-specific action words
- [ ] Memory graph updated with entities, relations, observations
- [ ] Repository entity stored with type and characteristics
- [ ] Architecture entities stored when relevant (Architecture_Component, Technology_Stack, etc.)
- [ ] Documentation files updated (CHANGELOG.md, reports)
- [ ] Delegation completed where required
- [ ] Output matches template format
- [ ] No prohibited generic actions used
- [ ] Architecture compliance validated
- [ ] Repository-agnostic protocols followed

---

## Architecture Integration Protocol

### Mandatory Architecture Reading

ALL agents must perform **ARCHITECTURE_READ** during Context Research phase:

```
ARCHITECTURE_READ() {
  1. Read /ARCHITECTURE.md completely
  2. Identify relevant architecture components
  3. REPO_DETECT_TYPE: Analyze repository structure and detect type
  4. REPO_ANALYZE_TECH_STACK: Identify technology stack from architecture
  5. Verify working directory boundaries (detected from architecture)
  6. Check technology stack compatibility (detected from repository)
  7. Understand integration patterns
  8. Store architecture context in memory graph
  9. Store repository entity with type and characteristics
}
```

### Architecture Memory Graph Storage

When working with architecture-related information:

```markdown
- MEMORY_STORE entity:[Repository_Name] type:[Repository] properties:[type:mono-repo|single-repo, primary_tech:detected_stack, boundaries:detected_paths]
- MEMORY_STORE entity:[Architecture_Name] type:[Architecture_Component] properties:[version:detected_version, last_updated:detected_date]
- MEMORY_STORE entity:[Backend_Component] type:[Architecture_Component] properties:[technology:detected_tech, location:detected_path]
- MEMORY_STORE entity:[Frontend_Component] type:[Architecture_Component] properties:[technology:detected_tech, location:detected_path]
- MEMORY_STORE entity:[Additional_Component] type:[Architecture_Component] properties:[technology:detected_tech, location:detected_path]
- MEMORY_RELATE from:[PRD_or_Feature] to:[Architecture_Component] relation:[integrates_with]
- MEMORY_RELATE from:[Agent_Operation] to:[Architecture_Component] relation:[architecturally_compliant_with]
- MEMORY_RELATE from:[Repository_Name] to:[Architecture_Component] relation:[configured_for]
- MEMORY_RELATE from:[Technology_Stack] to:[Repository_Name] relation:[compatible_with]
```

### Architecture Validation Rules

Agents must validate:

1. **Repository Boundaries**: Operations within detected repository boundaries
2. **Technology Stack**: Compatibility with detected technology stack
3. **Integration Patterns**: Following detected architecture patterns
4. **API Standards**: Using detected API versioning and patterns
5. **Security Integration**: Proper integration with detected security patterns
6. **Repository Type Compliance**: Adherence to detected repository type (mono-repo, single-repo, etc.)

### Architecture Compliance Checking

Before completing any task, agents must:

```markdown
- MEMORY_OBSERVE entity:[Current_Operation] observation:"Validated architecture compliance on [date] with [status] for repository type [repo_type]"
- Verify repository boundaries (detected from architecture)
- Check technology stack compatibility (detected from repository)
- Validate integration patterns (detected from architecture)
- Confirm security integration (detected from repository)
- Update architecture-related memory entities if needed
- Update repository entity with validation results
```

---

## Error Handling

### Safe No-Op Behavior

When operations cannot proceed safely:

1. Report the issue with full context
2. Make ZERO changes to files or state
3. Suggest alternative approaches or clarifications
4. Document the gap for manual review
5. Update memory graph with failure observation

### Rollback Requirements

For destructive operations:

1. Document pre-operation state
2. Create rollback instructions
3. Test rollback feasibility
4. Store rollback plan in memory graph

---

## References

- **Agent Templates**: `prompter.md` (lines 1-2161)
- **Action Words**: `AGENT_ACTION_WORDS_REFERENCE.md` (lines 1-394)
- **Integration Guide**: `ROOMODES_INTEGRATION_GUIDE.md`
- **PRD Structure**: `INSTRUCTION.md` (lines 1-1170)
- **Feasibility**: `Feasibility of Conversion.md`

---

**Last Updated**: 2025-11-04  
**Applies To**: All agents in `.claude/agents/`  
**Maintained By**: PRD Orchestrator
