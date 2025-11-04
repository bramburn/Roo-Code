# PRD Resequencer Architecture: Divide-and-Conquer Approach

## Problem Statement

The original PRD resequencer implementation experienced context limit issues when processing large numbers of PRD folders (64+ folders). The agent would attempt to:
1. Load all folder contents at once
2. Analyze all folders simultaneously
3. Process all file operations in a single context
4. Update all cross-references in one operation

This approach exceeded the context window limit during the planning phase, causing failures.

## Solution: Two-Tier Divide-and-Conquer Architecture

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    prd-orchestrator                         │
│              (Receives resequencing request)                │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    prd-resequencer                          │
│              (Resequencing Orchestrator)                    │
│                                                             │
│  1. Creates folder operation list                          │
│  2. Delegates to folder resequencers                       │
│  3. Updates cross-folder dependencies                      │
│  4. Validates overall structure                            │
│  5. Delegates to prd-dependency-manager                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ├──────────────┬──────────────┬──────────────┐
                         ▼              ▼              ▼              ▼
              ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
              │ prd-folder-  │ │ prd-folder-  │ │ prd-folder-  │ │ prd-folder-  │
              │ resequencer  │ │ resequencer  │ │ resequencer  │ │ resequencer  │
              │  (Folder 1)  │ │  (Folder 2)  │ │  (Folder 3)  │ │  (Folder N)  │
              │              │ │              │ │              │ │              │
              │ - git mv     │ │ - git mv     │ │ - git mv     │ │ - git mv     │
              │ - Update     │ │ - Update     │ │ - Update     │ │ - Update     │
              │   internal   │ │   internal   │ │   internal   │ │   internal   │
              │   refs       │ │   refs       │ │   refs       │ │   refs       │
              │ - Validate   │ │ - Validate   │ │ - Validate   │ │ - Validate   │
              │ - Document   │ │ - Document   │ │ - Document   │ │ - Document   │
              └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

### Tier 1: Main PRD Resequencer (Orchestrator)

**Mode**: `prd-resequencer`
**Location**: `.roo/rules-prd-resequencer/`

**Responsibilities**:
1. Receive resequencing plan from prd-orchestrator
2. Create folder-by-folder operation list
3. Delegate each folder to prd-folder-resequencer using `new_task`
4. Collect results from all folder resequencers
5. Update cross-folder dependencies (dependencies.md files that reference other folders)
6. Validate overall PRD structure
7. Delegate to prd-dependency-manager for memory graph updates

**Key Characteristics**:
- Does NOT load all folder contents at once
- Does NOT process folders directly
- Focuses on orchestration and coordination
- Maintains minimal context by delegating heavy work

### Tier 2: Folder-Level Resequencer (Worker)

**Mode**: `prd-folder-resequencer`
**Location**: `.roo/rules-prd-folder-resequencer/`

**Responsibilities**:
1. Receive single folder resequencing task
2. Execute git mv for that folder
3. Update internal references within the folder
4. Validate folder integrity
5. Document changes in folder's CHANGELOG.md
6. Report completion back to main resequencer

**Key Characteristics**:
- Processes ONLY ONE folder
- Does NOT scan other PRD folders
- Does NOT update cross-folder dependencies
- Does NOT update memory graph
- Maintains minimal context by focusing on single folder

## Workflow Example

### Scenario: Resequence 5 PRD Folders

**Input**: Resequencing plan from prd-orchestrator
```
Move PRDs/05 - Grammar Pattern Database Backend → PRDs/03-Grammar-Pattern-Database-Backend
Move PRDs/06 - Audio Content Management → PRDs/04-Audio-Content-Management
Move PRDs/07 - Anki Export Backend API → PRDs/05-Anki-Export-Backend-API
Move PRDs/12 - Search Functionality → PRDs/06-Search-Functionality
Move PRDs/14 - Notification System → PRDs/07-Notification-System
```

**Step 1: Main Resequencer Creates Plan**
```
prd-resequencer:
- Analyzes resequencing requirements
- Creates folder operation list (5 folders)
- Context usage: LOW (only folder names, no content)
```

**Step 2: Delegate to Folder Resequencers**
```
prd-resequencer → new_task -m prd-folder-resequencer "Folder 1"
  prd-folder-resequencer:
  - Loads ONLY Folder 1 contents
  - Executes git mv
  - Updates internal references
  - Validates folder
  - Reports completion
  - Context usage: LOW (single folder)

prd-resequencer → new_task -m prd-folder-resequencer "Folder 2"
  prd-folder-resequencer:
  - Loads ONLY Folder 2 contents
  - Executes git mv
  - Updates internal references
  - Validates folder
  - Reports completion
  - Context usage: LOW (single folder)

[Continues for all 5 folders...]
```

**Step 3: Update Cross-Folder Dependencies**
```
prd-resequencer:
- Scans all dependencies.md files
- Updates cross-folder references
- Context usage: MEDIUM (only dependencies.md files)
```

**Step 4: Validate and Delegate**
```
prd-resequencer:
- Validates overall structure
- Delegates to prd-dependency-manager for memory graph
- Reports completion
```

## Context Limit Management

### Before (Monolithic Approach)
```
Context Usage:
- Load all 64 folder structures: HIGH
- Load all PRD.md files: VERY HIGH
- Load all dependencies.md files: HIGH
- Load all sub-sprints: VERY HIGH
- Load all tasklists: VERY HIGH
- Total: EXCEEDS LIMIT ❌
```

### After (Divide-and-Conquer Approach)
```
Main Resequencer Context Usage:
- Load folder names only: LOW
- Create operation list: LOW
- Update cross-folder dependencies: MEDIUM
- Total: WELL WITHIN LIMIT ✅

Each Folder Resequencer Context Usage:
- Load single folder structure: LOW
- Load single folder files: LOW
- Update single folder references: LOW
- Total per folder: WELL WITHIN LIMIT ✅
```

## Benefits

1. **Scalability**: Works with any number of PRD folders (tested with 64+)
2. **Context Efficiency**: Each subtask processes minimal context
3. **Error Isolation**: Folder-level errors don't affect other folders
4. **Clear Progress**: Each folder completion is a clear milestone
5. **Parallelization Potential**: Independent folders can be processed in parallel
6. **Maintainability**: Clear separation of concerns

## Implementation Details

### File Structure
```
.roo/
├── rules-prd-resequencer/          # Main orchestrator
│   ├── 01-custominstruction.md
│   ├── 02-general.md
│   └── ARCHITECTURE.md             # This file
└── rules-prd-folder-resequencer/   # Folder-level worker
    ├── 01-custominstruction.md
    └── 02-general.md

.roomodes                            # Mode definitions
```

### Mode Definitions

**prd-resequencer** (Main Orchestrator):
- Groups: read, edit, command, mcp
- Can create subtasks using `new_task`
- Coordinates overall resequencing workflow

**prd-folder-resequencer** (Folder Worker):
- Groups: read, edit, command
- Cannot create subtasks (leaf worker)
- Processes single folder only

## Testing Strategy

### Unit Testing (Per Folder)
```
Test: Single folder resequencing
Input: "Resequence PRDs/05-test to PRDs/03-test"
Expected:
- ✅ Folder moved successfully
- ✅ Internal references updated
- ✅ CHANGELOG.md documented
- ✅ Validation passed
- ✅ Context usage < 50%
```

### Integration Testing (Multiple Folders)
```
Test: 10 folder resequencing
Input: Resequencing plan with 10 folders
Expected:
- ✅ All 10 folders moved successfully
- ✅ All internal references updated
- ✅ Cross-folder dependencies updated
- ✅ Overall validation passed
- ✅ Memory graph updated
- ✅ Context usage < 80% at any point
```

### Stress Testing (Large Scale)
```
Test: 64 folder resequencing
Input: Resequencing plan with all 64 folders
Expected:
- ✅ All folders processed successfully
- ✅ No context limit errors
- ✅ Completion time reasonable (~1 min per folder)
- ✅ All validations passed
```

## Future Enhancements

1. **Parallel Processing**: Process independent folders in parallel
2. **Batch Processing**: Group related folders for efficiency
3. **Incremental Validation**: Validate after each batch
4. **Rollback Support**: Implement rollback for failed operations
5. **Progress Reporting**: Real-time progress updates for large operations

## Conclusion

The divide-and-conquer architecture solves the context limit issue by:
- Breaking down large resequencing operations into manageable subtasks
- Processing one folder at a time to minimize context usage
- Maintaining clear separation between orchestration and execution
- Enabling scalability to any number of PRD folders

This approach is based on Roo Code's `new_task` tool, which supports hierarchical task relationships and context isolation between parent and child tasks.

