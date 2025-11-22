# Claude Agents Update Summary

## Overview

All Claude agents and skills have been updated to reference the new guidance files and enforce robust validation workflows for MTM lesson generation.

## Files Updated

### Agents

1. **content-creator** (`.claude/agents/content_creator/SKILL.md`)
   - Added comprehensive guidance document references
   - Updated character configuration for Mandarin-to-English lessons
   - Added EXACT character name requirements (Instructor, Student 1, Student 2, Listener)
   - Integrated validation workflow with error fixes
   - Added validation rules reference table
   - Included completion checklist

2. **orchestrator** (`.claude/agents/orchestrator/SKILL.md`)
   - Added guidance document references at top
   - Integrated LESSON_GENERATION_WORKFLOW.md into pipeline
   - Added comprehensive validation requirements
   - Included validation rules reference table
   - Added error recovery procedures
   - Included completion checklist and success metrics

3. **structure-builder** (`.claude/agents/structure_builder/SKILL.md`)
   - Added guidance document references
   - Updated module README template with character configuration
   - Added validation instructions to module README
   - Included EXACT character name documentation
   - Added completion checklist

### Skills

4. **MTM-Lesson-Architect** (`.claude/skills/MTM-Lesson-Architect/SKILL.md`)
   - Added PRIMARY GUIDANCE section with new documentation
   - Updated character configuration to Mandarin-to-English format
   - Changed from Teacher/TeacherEnglish to Instructor/Student 1/Student 2
   - Added comprehensive validation section with error fixes
   - Included validation rules reference table
   - Added pre-deployment checklist
   - Added quick reference section

5. **Validate-Script** (`.claude/skills/Validate-Script/SKILL.md`)
   - Completely rewrote with comprehensive validation workflow
   - Added validation rules reference table
   - Included common error fixes with examples
   - Added character name requirements
   - Included validation retry loop
   - Added quality assurance checklist
   - Added troubleshooting section

6. **MTM-Guardrails** (`.claude/skills/MTM-Guardrails/SKILL.md`)
   - Completely rewrote with detailed guardrails
   - Added language separation examples (WRONG vs CORRECT)
   - Included character name requirements
   - Added pause timing guidelines
   - Included validation rules summary table
   - Added quick checklist
   - Referenced new guidance documents

## Key Improvements

### 1. Guidance Integration

**All agents now reference:**
- `MANDARIN_LESSON_QUICK_REFERENCE.md` - Quick reference for fast lookups
- `LESSON_GENERATION_WORKFLOW.md` - Complete 8-step workflow
- `LLM_lesson_guidance.md` - Comprehensive guidance
- `GUIDANCE_INDEX.md` - Navigation guide
- `GUIDANCE_UPDATE_COMPLETE.txt` - Validation rules reference

### 2. Character Name Enforcement

**EXACT character names required:**
- ✅ "Instructor" (NOT "Teacher" or "TeacherEnglish")
- ✅ "Student 1" (NOT "Student A")
- ✅ "Student 2" (NOT "Student B")
- ✅ "Listener"

**All agents enforce this requirement.**

### 3. Validation-First Approach

**All agents now:**
- Reference validation commands at the top
- Include expected validation output
- Provide error fixes with examples
- Require validation before completion
- Include validation rules reference table

### 4. Language Separation (MTM-008)

**All agents enforce:**
- Instructor speaks ONLY English
- Student 1 speaks ONLY Mandarin
- Student 2 speaks ONLY Mandarin
- NO mixed languages in single lines
- Examples of WRONG vs CORRECT patterns

### 5. Comprehensive Error Fixes

**All agents include:**
- MTM-008: Bilingual Dialogue Separation fixes
- MTM-002/003: Missing Student Characters fixes
- MTM-005: Pause Timing fixes
- MTM-010: Inline Language Tags fixes
- MTM-009: Unicode Punctuation fixes

### 6. Validation Rules Reference

**All agents include table:**
| Rule | Name | Severity | Common Fix |
|------|------|----------|------------|
| MTM-001 | Script Structure | Error | Check JSON |
| MTM-002 | Student 1 Usage | Error | Add Student 1 |
| MTM-003 | Student 2 Usage | Error | Add Student 2 |
| MTM-005 | Pause Timing | Error | Increase pauseAfterMs |
| MTM-008 | Bilingual Separation | Error | Split languages |
| MTM-010 | Inline Language Tags | Error | Remove tags |

## Usage

### For Content Creation

Use **content-creator** agent:
```
Use the content-creator agent to generate lesson content for [specifications]
```

The agent will:
1. Read MANDARIN_LESSON_QUICK_REFERENCE.md
2. Follow LESSON_GENERATION_WORKFLOW.md
3. Use EXACT character names
4. Ensure language separation
5. Run validation
6. Fix all errors
7. Return validated lesson

### For Complete Lesson Creation

Use **MTM-Lesson-Architect** skill:
```
Use the MTM-Lesson-Architect skill to create a complete lesson for [specifications]
```

The skill will:
1. Read all guidance documents
2. Design MTM-compliant lesson structure
3. Generate complete JSON
4. Run validation
5. Fix all errors
6. Return production-ready lesson

### For Curriculum Planning

Use **orchestrator** agent:
```
Use the orchestrator agent to plan a [number]-lesson sequence for [topic]
```

The agent will:
1. Read curriculum context
2. Delegate to structure-builder
3. Delegate to content-creator
4. Run validation on all lessons
5. Update curriculum index
6. Return complete curriculum

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

## Success Metrics

All agents ensure:
- ✅ Validation passes with zero errors
- ✅ EXACT character names used
- ✅ Complete language separation
- ✅ ASCII punctuation only
- ✅ Adequate pause timing
- ✅ Both Student 1 and Student 2 have dialogue
- ✅ Production-ready lessons

