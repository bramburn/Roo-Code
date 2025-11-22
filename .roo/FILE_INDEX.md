# File Index - Complete Guide to .roo Directory

## Overview Files

| File | Purpose | Read First? |
|------|---------|------------|
| `README.md` | Main documentation for the .roo directory | ✅ YES |
| `SETUP_SUMMARY.md` | Summary of what was created and how to use it | ✅ YES |
| `QUICK_REFERENCE.md` | Quick lookup guide for common tasks | ✅ YES |
| `FILE_INDEX.md` | This file - index of all files | Reference |

## Configuration Files

### Root Level
| File | Location | Purpose |
|------|----------|---------|
| `.roomodes` | `/mnt/persist/workspace/.roomodes` | Main Roo agent configuration (YAML) |

## Agent Rules Files

### MTM Orchestrator Rules
**Directory:** `.roo/rules-mtm-orchestrator/`

| File | Purpose | Key Topics |
|------|---------|-----------|
| `mtm_design_workflow.md` | MTM design principles and delegation strategy | Reverse engineering, Golden Rule, module progression, delegation rules |
| `orchestration_checklist.md` | Checklists for orchestration tasks | Pre-delegation, subtask, completion, error handling |

### Curriculum Builder Rules
**Directory:** `.roo/rules-curriculum-builder/`

| File | Purpose | Key Topics |
|------|---------|-----------|
| `structure_and_documentation.md` | Directory naming and documentation requirements | Naming conventions, README content, file creation rules |
| `markdown_templates.md` | Templates for curriculum and module documentation | Curriculum README template, module README template |

### MTM Lesson Creator Rules
**Directory:** `.roo/rules-mtm-lesson-creator/`

| File | Purpose | Key Topics |
|------|---------|-----------|
| `mtm_compliance_critical.md` | Critical MTM constraints and philosophical guardrails | Teacher responsibility, tension elimination, Golden Rule, content sequencing |
| `json_structure_requirements.md` | JSON format specifications and validation | Root fields, voiceSettings, characters, dialogue, validation checklist |
| `dialogue_separation_rules.md` | Language separation rules and guardrails | MTM-008, MTM-010, character language rules, common mistakes |

## Example Files

**Directory:** `.roo/examples/`

| File | Purpose | Use Case |
|------|---------|----------|
| `curriculum_structure_example.md` | Complete directory structure example | Reference for creating curriculum folders |
| `module_readme_example.md` | Full example module README | Template for module documentation |
| `lesson_json_example.json` | Example lesson JSON file | Reference for lesson structure and formatting |

## Validation Files

**Directory:** `.roo/validation/`

| File | Purpose | Use Case |
|------|---------|----------|
| `validation_guide.md` | How to run and interpret validation | Running validation script, fixing issues |
| `validation_checklist.md` | Comprehensive verification checklist | Manual verification of lessons |

## File Organization by Purpose

### For Creating Curricula
1. Start: `README.md`
2. Understand: `QUICK_REFERENCE.md`
3. Plan: `rules-mtm-orchestrator/mtm_design_workflow.md`
4. Structure: `rules-curriculum-builder/structure_and_documentation.md`
5. Content: `rules-mtm-lesson-creator/mtm_compliance_critical.md`
6. Reference: `examples/`

### For Validating Lessons
1. Guide: `validation/validation_guide.md`
2. Checklist: `validation/validation_checklist.md`
3. Reference: `rules-mtm-lesson-creator/json_structure_requirements.md`

### For Troubleshooting
1. Quick Help: `QUICK_REFERENCE.md`
2. Specific Issue: See relevant rules file
3. Examples: `examples/`
4. Validation: `validation/`

## File Sizes and Line Counts

| File | Size | Lines | Type |
|------|------|-------|------|
| `.roomodes` | 5.7 KB | 150+ | YAML |
| `README.md` | 8.2 KB | 200+ | Markdown |
| `SETUP_SUMMARY.md` | 7.1 KB | 180+ | Markdown |
| `QUICK_REFERENCE.md` | 6.8 KB | 170+ | Markdown |
| `mtm_design_workflow.md` | 4.2 KB | 110+ | Markdown |
| `orchestration_checklist.md` | 3.8 KB | 100+ | Markdown |
| `structure_and_documentation.md` | 5.1 KB | 130+ | Markdown |
| `markdown_templates.md` | 4.5 KB | 120+ | Markdown |
| `mtm_compliance_critical.md` | 6.2 KB | 160+ | Markdown |
| `json_structure_requirements.md` | 5.8 KB | 150+ | Markdown |
| `dialogue_separation_rules.md` | 5.4 KB | 140+ | Markdown |
| `curriculum_structure_example.md` | 3.2 KB | 85+ | Markdown |
| `module_readme_example.md` | 4.1 KB | 110+ | Markdown |
| `lesson_json_example.json` | 3.5 KB | 95+ | JSON |
| `validation_guide.md` | 5.9 KB | 150+ | Markdown |
| `validation_checklist.md` | 6.3 KB | 160+ | Markdown |

## Total Content
- **Total Files:** 16 (plus .roomodes at root = 17)
- **Total Size:** ~100 KB
- **Total Lines:** ~1,800+
- **Directories:** 5

## How to Navigate

### If you want to...

**Create a new curriculum:**
1. Read: `README.md`
2. Review: `examples/curriculum_structure_example.md`
3. Follow: `rules-mtm-orchestrator/mtm_design_workflow.md`

**Create curriculum structure:**
1. Review: `rules-curriculum-builder/structure_and_documentation.md`
2. Use: `markdown_templates.md`
3. Reference: `examples/curriculum_structure_example.md`

**Create lesson files:**
1. Study: `rules-mtm-lesson-creator/mtm_compliance_critical.md`
2. Review: `examples/lesson_json_example.json`
3. Reference: `json_structure_requirements.md`
4. Check: `dialogue_separation_rules.md`

**Validate lessons:**
1. Run: `python validate_json_files.py`
2. Interpret: `validation/validation_guide.md`
3. Verify: `validation/validation_checklist.md`

**Troubleshoot issues:**
1. Check: `QUICK_REFERENCE.md`
2. Find: Relevant rules file
3. Review: `examples/`
4. Validate: `validation/`

## Key Files by Topic

### MTM Principles
- `rules-mtm-orchestrator/mtm_design_workflow.md` - Design principles
- `rules-mtm-lesson-creator/mtm_compliance_critical.md` - Compliance rules
- `rules-mtm-lesson-creator/dialogue_separation_rules.md` - Language separation

### Structure and Organization
- `rules-curriculum-builder/structure_and_documentation.md` - Directory structure
- `examples/curriculum_structure_example.md` - Structure example
- `markdown_templates.md` - Documentation templates

### Technical Requirements
- `rules-mtm-lesson-creator/json_structure_requirements.md` - JSON format
- `examples/lesson_json_example.json` - JSON example
- `validation/validation_guide.md` - Validation process

### Checklists and Verification
- `orchestration_checklist.md` - Orchestration tasks
- `validation/validation_checklist.md` - Lesson verification
- `QUICK_REFERENCE.md` - Quick lookup

## File Dependencies

```
.roomodes (main config)
    ↓
README.md (start here)
    ↓
├─ QUICK_REFERENCE.md (quick lookup)
├─ SETUP_SUMMARY.md (what was created)
├─ FILE_INDEX.md (this file)
│
├─ rules-mtm-orchestrator/ (orchestration)
│   ├─ mtm_design_workflow.md
│   └─ orchestration_checklist.md
│
├─ rules-curriculum-builder/ (structure)
│   ├─ structure_and_documentation.md
│   └─ markdown_templates.md
│
├─ rules-mtm-lesson-creator/ (content)
│   ├─ mtm_compliance_critical.md
│   ├─ json_structure_requirements.md
│   └─ dialogue_separation_rules.md
│
├─ examples/ (reference)
│   ├─ curriculum_structure_example.md
│   ├─ module_readme_example.md
│   └─ lesson_json_example.json
│
└─ validation/ (verification)
    ├─ validation_guide.md
    └─ validation_checklist.md
```

## Quick Links

- **Start Here:** `README.md`
- **Quick Help:** `QUICK_REFERENCE.md`
- **What's New:** `SETUP_SUMMARY.md`
- **File Guide:** `FILE_INDEX.md` (this file)
- **Validation:** `validation/validation_guide.md`
- **Examples:** `examples/`

