# Context Agents Architecture Diagrams

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CONTEXT-AWARE AGENT SYSTEM                   │
│                                                                       │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌──────────────┐│
│  │  context-engineer   │  │ context-orchestrator│  │     code     ││
│  │   (Research)        │  │   (Orchestration)   │  │(Implementation)│
│  │                     │  │                     │  │              ││
│  │ • ast-grep-mcp      │  │ • Parse tasklists   │  │ • Read context│
│  │ • semantic_search   │  │ • Check dependencies│  │ • Follow plan ││
│  │ • github_mcp        │  │ • Delegate tasks    │  │ • Write code  ││
│  │ • mcp_memory        │  │ • Track progress    │  │ • Update status│
│  └─────────────────────┘  └─────────────────────┘  └──────────────┘│
│           ↓                         ↓                       ↓        │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                    SHARED RESOURCES                              ││
│  │                                                                  ││
│  │  • Context Files (PRDs/.../context/task-*.md)                   ││
│  │  • Task Lists (PRDs/.../tasklists/tasklist_sprint_*.md)         ││
│  │  • Memory Graph (mcp_memory - Vector DB)                        ││
│  │  • Codebase (Source files)                                      ││
│  └─────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

## Complete Workflow Sequence

```
┌──────────────────────────────────────────────────────────────────────┐
│ PHASE 1: CONTEXT GENERATION                                          │
└──────────────────────────────────────────────────────────────────────┘

User
  │
  │ @context-orchestrator process sprint 1 in PRDs/01-Auth
  │
  ▼
┌─────────────────────────┐
│  context-orchestrator   │
│                         │
│ 1. Read tasklist        │
│ 2. List context files   │
│ 3. Identify gaps        │
│ 4. Check dependencies   │
└─────────────────────────┘
  │
  │ Delegate: new_task -m context-engineer
  │
  ├──────────────┬──────────────┬──────────────┐
  ▼              ▼              ▼              ▼
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│ Task 1.1 │  │ Task 1.2 │  │ Task 1.5 │  │ Task 1.6 │
│ Engineer │  │ Engineer │  │ Engineer │  │ Engineer │
└──────────┘  └──────────┘  └──────────┘  └──────────┘
  │              │              │              │
  │ Research     │ Research     │ Research     │ Research
  │ Loop         │ Loop         │ Loop         │ Loop
  │              │              │              │
  ▼              ▼              ▼              ▼
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│context.md│  │context.md│  │context.md│  │context.md│
└──────────┘  └──────────┘  └──────────┘  └──────────┘

┌──────────────────────────────────────────────────────────────────────┐
│ PHASE 2: CODE IMPLEMENTATION                                         │
└──────────────────────────────────────────────────────────────────────┘

User
  │
  │ @code execute task 1.1
  │
  ▼
┌─────────────────────────┐
│      code agent         │
│                         │
│ 1. Check for context    │──────┐
│ 2. Load context.md      │      │ Context file exists?
│ 3. Read Section 4       │      │
│ 4. Follow plan          │◄─────┘ YES
│ 5. Write code           │
│ 6. Update task status   │
└─────────────────────────┘
  │
  │ Task marked "✅ Done"
  │
  ▼
Updated Tasklist

┌──────────────────────────────────────────────────────────────────────┐
│ PHASE 3: DEPENDENCY UNBLOCKING                                       │
└──────────────────────────────────────────────────────────────────────┘

User
  │
  │ @context-orchestrator process sprint 1 in PRDs/01-Auth
  │
  ▼
┌─────────────────────────┐
│  context-orchestrator   │
│                         │
│ 1. Re-read tasklist     │
│ 2. Check dependencies   │
│ 3. Task 1.4 unblocked!  │──────┐ Task 1.3 now "Done"
│ 4. Delegate Task 1.4    │      │
└─────────────────────────┘      │
  │                              │
  │ new_task -m context-engineer │
  │                              │
  ▼                              │
┌──────────┐                     │
│ Task 1.4 │◄────────────────────┘
│ Engineer │
└──────────┘
  │
  ▼
context.md created
```

## Research Loop Detail

```
┌──────────────────────────────────────────────────────────────────────┐
│ CONTEXT-ENGINEER RESEARCH LOOP (4 STEPS)                             │
└──────────────────────────────────────────────────────────────────────┘

Task Received
  │
  ▼
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 1: INTERNAL CODEBASE ANALYSIS                                  │
│                                                                      │
│  ┌──────────────────┐         ┌──────────────────┐                 │
│  │  ast-grep-mcp    │         │ semantic_search  │                 │
│  │                  │         │                  │                 │
│  │ • Find classes   │         │ • Find patterns  │                 │
│  │ • Find methods   │         │ • Find similar   │                 │
│  │ • Find patterns  │         │   implementations│                 │
│  └──────────────────┘         └──────────────────┘                 │
│         │                              │                            │
│         └──────────────┬───────────────┘                            │
│                        ▼                                            │
│              Section 1: Current Code Analysis                       │
└─────────────────────────────────────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 2: MEMORY CHECK                                                │
│                                                                      │
│  ┌──────────────────┐                                               │
│  │   mcp_memory     │                                               │
│  │                  │                                               │
│  │ Search: "XUnit   │                                               │
│  │  setup .NET 8"   │                                               │
│  └──────────────────┘                                               │
│         │                                                            │
│         ├─────────────┬─────────────┐                               │
│         │             │             │                               │
│    CACHE HIT     CACHE MISS    CACHE MISS                           │
│         │             │             │                               │
│         ▼             ▼             ▼                               │
│  Section 3:    SKIP STEP 3   GO TO STEP 3                           │
│  Memory Found  (Cost Savings) (External Search)                     │
└─────────────────────────────────────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 3: EXTERNAL RESEARCH (CONDITIONAL)                             │
│                                                                      │
│  ┌──────────────────┐                                               │
│  │   github_mcp     │                                               │
│  │                  │                                               │
│  │ Search: "XUnit   │                                               │
│  │  .NET 8 patterns │                                               │
│  │  stars:>1000"    │                                               │
│  └──────────────────┘                                               │
│         │                                                            │
│         ▼                                                            │
│  Section 2: External Best Practices                                 │
│         │                                                            │
│         ▼                                                            │
│  ┌──────────────────┐                                               │
│  │ CACHE TO MEMORY  │ ◄─── CRITICAL: Save for next time            │
│  │   mcp_memory     │                                               │
│  └──────────────────┘                                               │
└─────────────────────────────────────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 4: PLANNING & DEPENDENCIES                                     │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ LLM Reasoning                                                 │  │
│  │                                                               │  │
│  │ • Analyze all gathered data                                  │  │
│  │ • Generate step-by-step plan                                 │  │
│  │ • Identify dependencies                                      │  │
│  │ • Specify exact file paths                                   │  │
│  └──────────────────────────────────────────────────────────────┘  │
│         │                                                            │
│         ├─────────────────┬──────────────────┐                      │
│         ▼                 ▼                  ▼                      │
│  Section 4:        Section 5:         Section 6:                    │
│  Implementation    Dependencies        Notes & Warnings             │
│  Plan                                                               │
└─────────────────────────────────────────────────────────────────────┘
  │
  ▼
context.md file created
```

## Dependency Management Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│ DEPENDENCY DETECTION & RESOLUTION                                    │
└──────────────────────────────────────────────────────────────────────┘

Tasklist:
┌─────────────────────────────────────────────────────────────────────┐
│ Task 1.1: Setup Database          [☐ To Do]                         │
│ Task 1.2: Create User Model       [☐ To Do]                         │
│ Task 1.3: Create Auth Service     [☐ To Do]                         │
│ Task 1.4: Implement Login         [☐ To Do] (depends on 1.2, 1.3)  │
│ Task 1.5: Add Validation           [☐ To Do]                         │
└─────────────────────────────────────────────────────────────────────┘

First Orchestration Run:
┌─────────────────────────────────────────────────────────────────────┐
│ context-orchestrator analyzes:                                      │
│                                                                      │
│ Task 1.1: No dependencies → DELEGATE ✓                              │
│ Task 1.2: No dependencies → DELEGATE ✓                              │
│ Task 1.3: No dependencies → DELEGATE ✓                              │
│ Task 1.4: Depends on 1.2, 1.3 (both "To Do") → BLOCK ✗              │
│ Task 1.5: No dependencies → DELEGATE ✓                              │
│                                                                      │
│ Result: 4 contexts created, 1 blocked                               │
└─────────────────────────────────────────────────────────────────────┘

After Implementation:
┌─────────────────────────────────────────────────────────────────────┐
│ Task 1.1: Setup Database          [✅ Done]                         │
│ Task 1.2: Create User Model       [✅ Done]                         │
│ Task 1.3: Create Auth Service     [✅ Done]                         │
│ Task 1.4: Implement Login         [☐ To Do] (depends on 1.2, 1.3)  │
│ Task 1.5: Add Validation           [✅ Done]                         │
└─────────────────────────────────────────────────────────────────────┘

Second Orchestration Run:
┌─────────────────────────────────────────────────────────────────────┐
│ context-orchestrator re-analyzes:                                   │
│                                                                      │
│ Task 1.1: Has context, Done → SKIP                                  │
│ Task 1.2: Has context, Done → SKIP                                  │
│ Task 1.3: Has context, Done → SKIP                                  │
│ Task 1.4: Depends on 1.2, 1.3 (both "Done") → DELEGATE ✓            │
│ Task 1.5: Has context, Done → SKIP                                  │
│                                                                      │
│ Result: 1 context created (Task 1.4 unblocked), 4 skipped           │
└─────────────────────────────────────────────────────────────────────┘
```

## Cost Optimization Over Time

```
┌──────────────────────────────────────────────────────────────────────┐
│ KNOWLEDGE ACCUMULATION & COST REDUCTION                              │
└──────────────────────────────────────────────────────────────────────┘

First Task (Cold Start):
┌─────────────────────────────────────────────────────────────────────┐
│ Task: "Implement XUnit tests"                                       │
│                                                                      │
│ Step 1: ast-grep + semantic_search    [~0.6s, local]               │
│ Step 2: mcp_memory search             [~0.2s, MISS]                │
│ Step 3: github_mcp search             [~2.5s, external API] $$      │
│         └─> Cache to mcp_memory       [~0.3s]                       │
│ Step 4: Generate plan                 [~0.5s]                       │
│                                                                      │
│ Total: ~4.1 seconds, External API cost: $$                          │
└─────────────────────────────────────────────────────────────────────┘

Second Similar Task (Warm Cache):
┌─────────────────────────────────────────────────────────────────────┐
│ Task: "Add more XUnit tests"                                        │
│                                                                      │
│ Step 1: ast-grep + semantic_search    [~0.6s, local]               │
│ Step 2: mcp_memory search             [~0.2s, HIT!] ✓              │
│ Step 3: github_mcp search             [SKIPPED] 💰 60% savings      │
│ Step 4: Generate plan                 [~0.5s]                       │
│                                                                      │
│ Total: ~1.3 seconds, External API cost: $0                          │
└─────────────────────────────────────────────────────────────────────┘

Tenth Similar Task (Hot Cache):
┌─────────────────────────────────────────────────────────────────────┐
│ Task: "Refactor XUnit test suite"                                   │
│                                                                      │
│ Step 1: ast-grep + semantic_search    [~0.6s, local]               │
│ Step 2: mcp_memory search             [~0.2s, HIT!] ✓              │
│ Step 3: github_mcp search             [SKIPPED] 💰 90% savings      │
│ Step 4: Generate plan                 [~0.5s]                       │
│                                                                      │
│ Total: ~1.3 seconds, External API cost: $0                          │
│                                                                      │
│ Knowledge Base: 10+ XUnit patterns cached, reusable across team    │
└─────────────────────────────────────────────────────────────────────┘
```

## File Organization

```
Repository Root
│
├── PRDs/
│   ├── 01-Authentication-System/
│   │   ├── PRD.md
│   │   ├── README.md
│   │   ├── tasklists/
│   │   │   ├── tasklist_sprint_01.md
│   │   │   └── tasklist_sprint_02.md
│   │   └── context/                    ← NEW
│   │       ├── task-1.1-context.md
│   │       ├── task-1.2-context.md
│   │       ├── task-1.3-context.md
│   │       └── task-2.1-context.md
│   │
│   └── 02-Content-Structure/
│       └── context/                    ← NEW
│           └── task-*.md
│
└── .roo/
    ├── templates/
    │   └── context_template.md         ← Context file schema
    │
    ├── guides/
    │   ├── CONTEXT_WORKFLOW_GUIDE.md
    │   ├── RESEARCH_ORCHESTRATION_PROTOCOL.md
    │   ├── MCP_TOOLS_REFERENCE.md
    │   └── CONTEXT_DIRECTORY_STRUCTURE.md
    │
    ├── rules-context-engineer/
    │   ├── 01-custominstruction.md
    │   └── 02-general.md
    │
    └── rules-context-orchestrator/
        ├── 01-custominstruction.md
        └── 02-general.md
```
