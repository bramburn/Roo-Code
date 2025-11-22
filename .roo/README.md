# .roo Directory - MTM Curriculum Agent Configuration

This directory contains the complete configuration for Roo agents specialized in creating Michel Thomas Method (MTM) curricula. It includes mode definitions, rules, examples, and validation guidance.

## Directory Structure

```
.roo/
├── README.md                                    # This file
├── rules-mtm-orchestrator/                      # Orchestrator agent rules
│   ├── mtm_design_workflow.md                   # MTM design and delegation strategy
│   └── orchestration_checklist.md               # Delegation and completion tracking
├── rules-curriculum-builder/                    # Curriculum builder agent rules
│   ├── structure_and_documentation.md           # Naming conventions and file requirements
│   └── markdown_templates.md                    # Templates for README files
├── rules-mtm-lesson-creator/                    # Lesson creator agent rules
│   ├── mtm_compliance_critical.md               # Critical MTM constraints
│   ├── json_structure_requirements.md           # JSON format and validation
│   └── dialogue_separation_rules.md             # Language separation guardrails
├── examples/                                    # Few-shot examples
│   ├── curriculum_structure_example.md          # Example curriculum layout
│   ├── module_readme_example.md                 # Example module README
│   └── lesson_json_example.json                 # Example lesson JSON
└── validation/                                  # Validation scripts and guidance
    ├── validation_guide.md                      # How to run validation
    └── validation_checklist.md                  # What to check
```

## Quick Start

### 1. Understanding the Three Agents

The system uses three specialized Roo agents:

#### **MTM Orchestrator** (`mtm-orchestrator`)
- **Role:** Strategic workflow coordinator
- **Responsibility:** Break down curriculum requests into subtasks
- **Tools:** `new_task`, `attempt_completion`, `read_file`
- **When to Use:** Creating or significantly modifying a curriculum

#### **Curriculum Builder** (`curriculum-builder`)
- **Role:** Directory and documentation creator
- **Responsibility:** Create folder structure and README files
- **Tools:** `read`, `edit`, `write`
- **When to Use:** Creating curriculum structure and documentation

#### **MTM Lesson Creator** (`mtm-lesson-creator`)
- **Role:** Content generation specialist
- **Responsibility:** Generate MTM-compliant lesson JSON files
- **Tools:** `read`, `edit`, `write`
- **When to Use:** Creating individual lesson files

### 2. Creating a Curriculum

**Step 1:** Use the MTM Orchestrator to plan the curriculum
```
"Create an English-to-Mandarin curriculum with 4 modules covering Foundation, Questions, Negation, and Pronouns"
```

**Step 2:** The Orchestrator delegates to Curriculum Builder
- Creates `curriculum/english-to-mandarin/` directory
- Creates `modules/` subdirectory
- Creates module folders: `01-Foundation/`, `02-Questions/`, etc.
- Creates README files with documentation

**Step 3:** The Orchestrator delegates to MTM Lesson Creator
- For each module, creates 10-15 lesson JSON files
- Ensures MTM compliance in all lessons
- Validates JSON structure

**Step 4:** Validate the curriculum
- Run validation script on all lesson files
- Check MTM compliance manually
- Prepare for audio generation

## Key Files and Their Purpose

### Mode Configuration
- **`.roomodes`** - Defines the three custom agent modes with roles, tools, and instructions

### Orchestrator Rules
- **`mtm_design_workflow.md`** - MTM design principles and delegation strategy
- **`orchestration_checklist.md`** - Checklists for delegation and completion tracking

### Curriculum Builder Rules
- **`structure_and_documentation.md`** - Directory naming and README requirements
- **`markdown_templates.md`** - Templates for curriculum and module documentation

### Lesson Creator Rules
- **`mtm_compliance_critical.md`** - Critical MTM constraints and philosophical guardrails
- **`json_structure_requirements.md`** - JSON format specifications and validation
- **`dialogue_separation_rules.md`** - Language separation rules (MTM-008, MTM-010)

### Examples
- **`curriculum_structure_example.md`** - Complete directory structure example
- **`module_readme_example.md`** - Example module README with all sections
- **`lesson_json_example.json`** - Example lesson JSON file with proper formatting

### Validation
- **`validation_guide.md`** - How to run and interpret validation results
- **`validation_checklist.md`** - Comprehensive checklist for lesson verification

## Critical Rules to Remember

### The Golden Rule (MTM-001)
**NEVER introduce a new vocabulary word and a new grammatical concept in the same step.**

### Language Separation (MTM-008)
**NEVER mix languages in a single dialogue line.**
- TeacherEnglish speaks ONLY English
- Teacher speaks ONLY Mandarin
- Split bilingual content across character lines

### No Inline Tags (MTM-010)
**ABSOLUTELY FORBIDDEN: Do NOT use inline language tags like `[lang=zh-CN]...[/lang]`**
- This causes critical audio generation failures
- Use character separation instead

## Running Validation

```bash
# Navigate to repository root
cd /path/to/audio-lessons

# Run validation on lesson files
python validate_json_files.py

# Expected output: ✅ All files passed validation!
```

## Common Workflows

### Creating a New Curriculum
1. Ask MTM Orchestrator to create curriculum
2. Specify language pair, modules, and learning objectives
3. Orchestrator delegates to Curriculum Builder and Lesson Creator
4. Review generated files
5. Run validation
6. Generate audio

### Editing an Existing Curriculum
1. Ask MTM Orchestrator to modify curriculum
2. Specify which modules/lessons to change
3. Orchestrator reviews existing structure
4. Delegates appropriate subtasks
5. Validates changes
6. Regenerates affected audio

### Adding New Lessons to a Module
1. Ask MTM Lesson Creator to add lessons
2. Specify module and lesson numbers
3. Provide context from existing lessons
4. Creator generates new lessons
5. Validate new lessons
6. Generate audio for new lessons

## Support and Troubleshooting

### Validation Failures
- Check `validation_guide.md` for common issues
- Review `validation_checklist.md` for manual verification
- Ensure JSON syntax is correct
- Verify language separation rules

### MTM Compliance Issues
- Review `mtm_compliance_critical.md` for rules
- Check `dialogue_separation_rules.md` for language mixing
- Verify "One New Concept at a Time" rule
- Ensure psychological setup in first lesson

### File Structure Issues
- Review `structure_and_documentation.md` for naming conventions
- Check `curriculum_structure_example.md` for correct layout
- Verify module and lesson numbering
- Ensure all required README files exist

## Next Steps

1. **Review Examples:** Study the example files to understand expected output
2. **Read Rules:** Familiarize yourself with rules for each agent
3. **Create Curriculum:** Use MTM Orchestrator to create your first curriculum
4. **Validate:** Run validation on generated files
5. **Generate Audio:** Use validated lessons for audio generation

