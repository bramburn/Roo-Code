# Claude Agents and Skills for MTM Lesson Generation

This project defines Claude agents and skills for generating Michel Thomas Method (MTM) lessons with comprehensive validation and quality assurance.

**UPDATED**: All agents now reference new guidance documents and enforce robust validation workflows.

## Quick Start

### For Content Creation
```
Use the content-creator agent to generate lesson content for [specifications]
```

### For Complete Lesson Creation
```
Use the MTM-Lesson-Architect skill to create a complete lesson for [specifications]
```

### For Curriculum Planning
```
Use the orchestrator agent to plan a [number]-lesson sequence for [topic]
```

### For Structure Setup
```
Use the structure-builder agent to set up curriculum modules for [topic]
```

## Agents (.claude/agents/)

### orchestrator (mtm-orchestrator)
**Purpose**: Sequential orchestrator for MTM curriculum: plan → structure → content → validate

**Key Features:**
- Manages complete curriculum generation pipeline
- Delegates to structure-builder and content-creator
- Enforces validation on all lessons
- Updates curriculum index and MCP memory

**Updated**: Now references LESSON_GENERATION_WORKFLOW.md and enforces EXACT character names

### structure_builder
**Purpose**: Creates curriculum directories and README files with strict path enforcement

**Key Features:**
- Creates module structure under correct curriculum path
- Generates README with character configuration and validation instructions
- Updates MCP memory with Module entities

**Updated**: Now includes EXACT character names in module README and validation instructions

### content_creator
**Purpose**: Generates MTM-compliant lesson JSON with bilingual separation, pacing, and Google TTS-friendly formatting

**Key Features:**
- Uses EXACT character names (Instructor, Student 1, Student 2, Listener)
- Ensures complete language separation (MTM-008)
- Runs validation before completion
- Includes comprehensive error fixes

**Updated**: Completely rewritten with validation-first approach and comprehensive error fixes

## Skills (.claude/skills/)

### MTM-Lesson-Architect
**Purpose**: Complete Michel Thomas Method lesson creation system with guidance integration, mnemonic generation, and validation

**Key Features:**
- Comprehensive lesson design and structure
- Mnemonic engineering using keyword method
- Technical validation with error resolution
- Quality assurance and production readiness

**Updated**: Now references all new guidance documents and includes validation rules reference table

### MTM-Guardrails
**Purpose**: Core Michel Thomas Method rules for content generation

**Key Features:**
- Language separation rules (MTM-008)
- Character name requirements (EXACT)
- Pause timing guidelines
- Validation rules reference

**Updated**: Completely rewritten with detailed examples of WRONG vs CORRECT patterns

### Validate-Script
**Purpose**: Commands and policy for validating MTM lesson JSON using the .NET CLI

**Key Features:**
- Validation workflow with examples
- Common error fixes with before/after examples
- Validation rules reference table
- Quality assurance checklist

**Updated**: Completely rewritten with comprehensive validation workflow and error fixes

### Curriculum-Path-Enforcer
**Purpose**: Enforces reading index.md and correct path schema

**Key Features:**
- Path enforcement rules
- Curriculum structure validation
- Module naming conventions

## Guidance Documents

All agents reference these guidance documents:

- `MTM_LESSON_QUICK_REFERENCE.md` - Quick reference for MTM lessons (all languages)
- `LESSON_GENERATION_WORKFLOW.md` - Complete 8-step workflow
- `LLM_lesson_guidance.md` - Comprehensive MTM lesson creation guidance
- `GUIDANCE_INDEX.md` - Navigation guide for all documentation
- `GUIDANCE_UPDATE_COMPLETE.txt` - Validation rules reference
- `.claude/guidance_ref/` - Reference copies of all guidance documents

## Critical Rules (ALL AGENTS ENFORCE)

✅ **Character Names (EXACT):**
- "Instructor" (NOT "Teacher" or "TeacherEnglish")
- "Student 1" (NOT "Student A")
- "Student 2" (NOT "Student B")
- "Listener"

✅ **Language Separation (MTM-008):**
- Instructor speaks ONLY English
- Student 1 speaks ONLY Mandarin
- Student 2 speaks ONLY Mandarin
- NO mixed languages in single lines

✅ **Validation:**
- ALL lessons must pass validation
- Expected: `✓ Script validation passed! No issues found.`
- Fix all errors before completion

✅ **Other Requirements:**
- ASCII punctuation only
- Adequate pause timing (4000ms+ for complex questions)
- Both Student 1 and Student 2 have dialogue
- NO inline language tags `[lang=...]`

## Validation Workflow

All agents follow this workflow:

1. **Navigate to CLI:**
   ```bash
   cd cli/MichelThomas.TtsGenerator
   ```

2. **Run validation:**
   ```bash
   dotnet run validate-script ../../<lesson-file-path>
   ```

3. **Expected output:**
   ```
   ✓ Script validation passed! No issues found.
   ```

4. **If errors, fix and re-validate**

## MCP Memory

Configured in `.claude/mcp_servers.json`. Agents use memory to track:
- **Curriculum** - Overall curriculum metadata
- **Module** - Module-level metadata
- **Lesson** - Lesson-level metadata
- **ValidationResult** - Validation status and issues

## Success Metrics

All agents ensure:
- ✅ Validation passes with zero errors
- ✅ EXACT character names used
- ✅ Complete language separation
- ✅ ASCII punctuation only
- ✅ Adequate pause timing
- ✅ Both Student 1 and Student 2 have dialogue
- ✅ Production-ready lessons

## Documentation

- **AGENTS_UPDATE_SUMMARY.md** - Complete summary of recent updates to agents and skills
- **todo.md** - Task tracking and future improvements
- **mcp_servers.json** - MCP server configuration for memory integration

## Usage Examples

**Generate a single lesson:**
```
Use the content-creator agent to generate lesson content for Lesson 21: Colors and Descriptions
```

**Generate a complete curriculum module:**
```
Use the orchestrator agent to plan a 5-lesson sequence for HSK1 Module 3: Daily Activities
```

**Create curriculum structure:**
```
Use the structure-builder agent to set up curriculum modules for Mandarin-to-English HSK1
```

**Create a complete validated lesson:**
```
Use the MTM-Lesson-Architect skill to create a complete lesson for Days of the Week with mnemonics
```

## Support

For questions or issues:
1. Check `AGENTS_UPDATE_SUMMARY.md` for recent changes
2. Review guidance documents in project root
3. Consult validation error fixes in `Validate-Script` skill
4. Review MTM guardrails in `MTM-Guardrails` skill

