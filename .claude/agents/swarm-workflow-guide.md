# Swarm Agent Workflow Guide

## Overview

This guide describes how to orchestrate a swarm of Claude agents for comprehensive PRD (Product Requirements Document) analysis, implementation, and validation. The swarm consists of 8 specialized agents working in coordinated sequence to transform PRDs into fully implemented and validated solutions.

## Agent Swarm Architecture

```
┌─────────────────────┐
│   Swarm Orchestrator │ ← Central coordinator
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐    ┌─────────────────────┐
│ PRD Extractor/Matcher│ → │   Task Navigator     │
└─────────┬───────────┘    └─────────┬───────────┘
          │                        │
          ▼                        ▼
┌─────────────────────┐    ┌─────────────────────┐
│     Code Finder      │ → │    Gap Detector      │
└─────────┬───────────┘    └─────────┬───────────┘
          │                        │
          ▼                        ▼
┌─────────────────────┐    ┌─────────────────────┐
│  Fixer/Implementer  │ → │  Reviewer/Tester     │
└─────────┬───────────┘    └─────────┬───────────┘
          │                        │
          └──────────┬─────────────┘
                     ▼
          ┌─────────────────────┐
          │       Reporter       │
          └─────────────────────┘
```

## Standard Workflow Sequence

### Phase 1: Planning and Requirements Analysis

1. **Swarm Orchestrator**
   - Receives user request (e.g., "Implement authentication system from PRD-101")
   - Plans overall workflow and assigns tasks to agents
   - Coordinates parallel vs. sequential execution

2. **PRD Extractor/Matcher**
   - Parses PRD documents and extracts structured requirements
   - Normalizes acceptance criteria and identifies dependencies
   - Creates requirement matrices and feature categorization

3. **Task Navigator**
   - Analyzes task dependencies and creates optimal execution sequence
   - Identifies opportunities for parallel processing
   - Schedules agents and manages handoffs between them

### Phase 2: Discovery and Analysis

4. **Code Finder**
   - Uses ast-grep to search existing codebase for related implementations
   - Identifies patterns, dependencies, and existing functionality
   - Maps code architecture and integration points

5. **Gap Detector**
   - Compares requirements against discovered implementations
   - Identifies missing functionality, incomplete features, and quality gaps
   - Generates detailed gap analysis with severity assessments

### Phase 3: Implementation and Validation

6. **Fixer/Implementer**
   - Writes code to fill identified gaps
   - Creates new components and modifies existing ones
   - Ensures integration with existing architecture

7. **Reviewer/Tester**
   - Validates implementations against requirements
   - Executes tests and performs quality assurance
   - Provides approval or feedback for revisions

### Phase 4: Reporting and Documentation

8. **Reporter**
   - Aggregates results from all agents
   - Generates comprehensive reports for different audiences
   - Creates dashboards and communicates outcomes

## Usage Patterns

### Single PRD Implementation
```
User: "Implement the authentication system described in PRDs/101-auth"

Swarm Orchestrator → PRD Extractor → Task Navigator → Code Finder
→ Gap Detector → Fixer → Reviewer → Reporter
```

### Multi-PRD Coordination
```
User: "Coordinate implementation across PRDs/101-auth, PRDs/102-user-mgmt"

Swarm Orchestrator creates parallel workflows:
├── PRD Extractor → Task Navigator → Code Finder → Gap Detector
└── [Same for second PRD]
    ↓
Swarm Orchestrator synchronizes → Fixer → Reviewer → Reporter
```

### Gap Analysis Only
```
User: "Analyze implementation gaps for existing system"

Swarm Orchestrator → PRD Extractor → Code Finder → Gap Detector → Reporter
```

## Agent Communication Protocol

### Standard Handoff Format
```yaml
handoff:
  from_agent: agent_name
  to_agent: agent_name
  data_structure: structured_output_format
  completion_criteria: success_conditions
  next_steps: subsequent_tasks
```

### Memory Graph Integration
All agents update the shared memory graph with:
- Entity creation (PRDs, requirements, implementations)
- Relationship mapping (dependencies, implements, validates)
- Observations (status updates, completion events)

### Error Handling and Rollback
- Each agent performs safe validation before operations
- Checkpoints created before destructive actions
- Rollback procedures documented and available
- Swarm Orchestrator monitors for failures and coordinates recovery

## Configuration

### Agent Activation
- Agents can be invoked individually for specific tasks
- Swarm Orchestrator manages complete workflows
- Task Navigator optimizes execution sequences
- Parallel execution supported where appropriate

### Customization
- Each agent can be customized for specific project needs
- Action words can be extended for domain-specific tasks
- Memory graph schema adapts to project characteristics
- Reporting formats configurable for stakeholder needs

## Best Practices

### Workflow Optimization
- Use Task Navigator to identify parallel execution opportunities
- Let Code Finder run concurrently with Gap Detector where possible
- Implement incremental review cycles for large projects
- Create checkpoints at major milestones

### Quality Assurance
- Ensure each agent completes validation checklists
- Use Reviewer/Tester results for continuous improvement
- Track metrics across workflow executions
- Document lessons learned for future optimization

### Stakeholder Communication
- Use Reporter for executive summaries and technical documentation
- Create role-specific dashboards for different audiences
- Establish regular communication schedules
- Archive all project artifacts for audit and reference

## Integration with Existing Systems

### Repository Compatibility
- Agents adapt to detected repository types (mono-repo, multi-repo)
- Technology stack analysis ensures appropriate patterns
- Existing documentation and coding standards respected
- Integration with CI/CD pipelines supported

### Memory and Context Management
- Shared memory graph maintains project state
- Agent context preserved across handoffs
- Historical patterns inform future decisions
- Scalable to large codebases and complex requirements

## Example Complete Workflow

**User Request**: "Implement user authentication system from PRD-101"

**Execution Flow**:
1. **Swarm Orchestrator** plans workflow, assigns agents
2. **PRD Extractor** parses requirements, creates structured data
3. **Task Navigator** sequences tasks, identifies parallel opportunities
4. **Code Finder** searches for existing auth patterns and implementations
5. **Gap Detector** identifies missing login, logout, token refresh features
6. **Fixer** implements missing auth service methods and middleware
7. **Reviewer** validates implementation, runs security tests
8. **Reporter** creates executive summary, technical docs, progress dashboard

**Result**: Complete, tested authentication system with comprehensive documentation

---

*For detailed agent capabilities and action words, see individual agent documentation files.*