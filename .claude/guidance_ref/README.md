# MTM Lesson Generation Guidance Reference

This directory contains reference copies of all guidance documents for Michel Thomas Method (MTM) lesson generation.

## Purpose

These files are reference copies for Claude agents and skills. The canonical versions are in the project root directory.

## Files

### Quick Reference
- **MTM_LESSON_QUICK_REFERENCE.md** - Quick reference for generating MTM lessons in any language
  - Language-agnostic template
  - Examples for Mandarin, Japanese, Korean, Spanish, French, German
  - Character setup for each language
  - Validation commands
  - Common error fixes

### Workflow
- **LESSON_GENERATION_WORKFLOW.md** - Complete 8-step workflow for lesson generation
  - Planning and preparation
  - Template JSON structure
  - Step-by-step validation process
  - Common error fixes with examples

### Comprehensive Guidance
- **LLM_lesson_guidance.md** - Comprehensive MTM lesson creation guidance
  - Complete character definitions
  - Language separation rules
  - Validation section with .NET script emphasis
  - Validation rules reference table (MTM-001 through MTM-011)

### Navigation
- **GUIDANCE_INDEX.md** - Navigation guide for all documentation
  - Use cases for each document
  - Quick reference of critical requirements

### Updates and Summaries
- **GUIDANCE_UPDATES_SUMMARY.md** - Summary of all changes made to guidance files
  - How to use the updated guides
  - Validation commands reference

- **GUIDANCE_UPDATE_COMPLETE.txt** - Complete summary of all changes
  - Validation commands and expected output
  - Character names reference
  - Critical rules checklist

## Supported Languages

The guidance now supports lessons for:
- **Mandarin** (cmn-CN)
- **Japanese** (ja-JP)
- **Korean** (ko-KR)
- **Spanish** (es-ES)
- **French** (fr-FR)
- **German** (de-DE)
- And any other language supported by Google TTS

## Character Setup Template

All languages follow this pattern:

```json
"characters": [
  {
    "name": "Instructor",
    "provider": "Google",
    "voiceId": "en-US-Chirp3-HD-Erinome",
    "language": "en-US"
  },
  {
    "name": "Student 1",
    "provider": "Google",
    "voiceId": "<target-language-voice-1>",
    "language": "<target-language-code>"
  },
  {
    "name": "Student 2",
    "provider": "Google",
    "voiceId": "<target-language-voice-2>",
    "language": "<target-language-code>"
  },
  {
    "name": "Listener"
  }
]
```

## Critical Rules (All Languages)

✅ **Character Names (EXACT):**
- "Instructor" (NOT "Teacher" or "TeacherEnglish")
- "Student 1" (NOT "Student A")
- "Student 2" (NOT "Student B")
- "Listener"

✅ **Language Separation:**
- Instructor speaks ONLY the instruction language (typically English)
- Student 1 speaks ONLY the target language
- Student 2 speaks ONLY the target language
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

```bash
# Navigate to CLI
cd cli/MichelThomas.TtsGenerator

# Run validation
dotnet run validate-script ../../<path-to-lesson>.json

# Expected output
✓ Script validation passed! No issues found.
```

## Usage

Claude agents automatically reference these files when generating lessons. You can also reference them directly:

- For quick lookups: `MTM_LESSON_QUICK_REFERENCE.md`
- For complete workflow: `LESSON_GENERATION_WORKFLOW.md`
- For comprehensive guidance: `LLM_lesson_guidance.md`
- For navigation: `GUIDANCE_INDEX.md`

## Updates

These are reference copies. To update:
1. Edit the canonical version in project root
2. Copy updated file to `.claude/guidance_ref/`
3. Update agents if necessary

## Canonical Locations

The canonical versions of these files are in the project root:
- `/MTM_LESSON_QUICK_REFERENCE.md`
- `/LESSON_GENERATION_WORKFLOW.md`
- `/LLM_lesson_guidance.md`
- `/GUIDANCE_INDEX.md`
- `/GUIDANCE_UPDATES_SUMMARY.md`
- `/GUIDANCE_UPDATE_COMPLETE.txt`

