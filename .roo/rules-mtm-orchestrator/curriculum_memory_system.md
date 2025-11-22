# Curriculum Memory System

## Purpose
This system ensures the MTM orchestrator maintains persistent memory of curriculum progress and never loses track of where to continue work.

## Core Memory Rules

### 1. Index File is Authority (CRITICAL)
- `curriculum/index.md` is the **single source of truth** for all curriculum progress
- **ALWAYS** read this file first before any curriculum work
- **NEVER** rely on memory or assumption about curriculum state

### 2. Curriculum Location Memory
The orchestrator must remember:
- **Base Path**: Always `curriculum/` (from project root)
- **Specific Curriculum**: Read from index (e.g., `english-to-korean`)
- **Full Path**: Constructed as `curriculum/[curriculum-name]/`

### 3. Progress Tracking Memory
The orchestrator must track:
- **Current Module**: Highest numbered incomplete module
- **Completed Modules**: All modules marked "✅ Complete"
- **Next Priority**: Value from "Next Module to Create" field

### 4. Sequencing Rules Memory
The orchestrator must enforce:
- **Numerical Order**: 01 → 02 → 03 → ... → 10 → 11+
- **Foundation First**: Modules 01-10 before any 11+ modules
- **No Skipping**: Never jump to advanced modules without completing foundations

## Memory Access Protocol

### Before Starting Work
1. **READ** `curriculum/index.md`
2. **FIND** the target curriculum section
3. **IDENTIFY** "Next Module to Create"
4. **CONFIRM** curriculum path
5. **PROCEED** with that specific module

### After Completing Work
1. **UPDATE** module status to "✅ Complete"
2. **SET** next incomplete module as "Next Module to Create"
3. **REFRESH** "Last Updated" date
4. **SAVE** the index file

## Memory Validation

### Checklist for Memory Integrity
- [ ] Index file exists at `curriculum/index.md`
- [ ] Current curriculum is listed in the index
- [ ] Module statuses are accurate
- [ ] "Next Module to Create" points to correct module
- [ ] Paths are valid and exist

### Error Recovery
If index is missing or corrupted:
1. **SCAN** curriculum directory structure
2. **RECONSTRUCT** index based on existing files
3. **VALIDATE** reconstruction with file system
4. **SAVE** new index file

## Anti-Forgetting Mechanisms

### 1. Mandatory Reading Rule
Every orchestrator instruction must include:
> "First, read curriculum/index.md to understand current progress and identify the next module to work on."

### 2. Explicit Update Requirement
Every module completion instruction must include:
> "Update curriculum/index.md to mark this module as complete and set the next module."

### 3. Path Verification
Before any file operations:
1. Read curriculum path from index
2. Verify directory exists
3. Confirm with file structure
4. Proceed with confirmed path

## Example Memory Flow

### Starting a New Session
1. **Read**: `curriculum/index.md`
2. **Parse**: English to Korean section
3. **Identify**: "Next Module to Create: 02-Questions"
4. **Construct Path**: `curriculum/english-to-korean/modules/02-Questions/`
5. **Proceed**: Create lessons for module 02

### Completing Module 02
1. **Finish**: All 10 lessons created
2. **Update**: Change module 02 status to "✅ Complete"
3. **Set Next**: "Next Module to Create: 03-Negation"
4. **Refresh**: Update "Last Updated" date
5. **Save**: Write updated index file

This system ensures the orchestrator never forgets where it is and always proceeds in the correct order.