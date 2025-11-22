---
name: MTM-Guardrails
description: Core Michel Thomas Method guardrails for lesson JSON generation with validation rules.
---

## Core MTM Guardrails

**REFERENCE**: See `MANDARIN_LESSON_QUICK_REFERENCE.md` for quick reference
**COMPREHENSIVE**: See `LLM_lesson_guidance.md` for detailed guidance

Use these rules whenever generating lesson JSON:

### Language Separation (MTM-008) ⚠️ CRITICAL

**For Mandarin-to-English lessons:**
- ✅ Instructor speaks ONLY English
- ✅ Student 1 speaks ONLY Mandarin
- ✅ Student 2 speaks ONLY Mandarin
- ❌ NO mixed languages in single dialogue lines
- ❌ NO bilingual content in one character

**WRONG:**
```json
{
  "character": "Instructor",
  "text": "Father is baba. 爸爸."
}
```

**CORRECT:**
```json
[
  {
    "character": "Instructor",
    "text": "Father is baba."
  },
  {
    "character": "Listener",
    "pauseAfterMs": 1000
  },
  {
    "character": "Student 1",
    "text": "爸爸。"
  }
]
```

### Character Names (MTM-002, MTM-003) ⚠️ CRITICAL

**MUST BE EXACT:**
- ✅ "Instructor" (NOT "Teacher" or "TeacherEnglish")
- ✅ "Student 1" (NOT "Student A")
- ✅ "Student 2" (NOT "Student B")
- ✅ "Listener"

**Both Student 1 AND Student 2 must have dialogue in every lesson.**

### No Inline Language Tags (MTM-010) ⚠️ CRITICAL

- ❌ Do NOT use `[lang=...]...[/lang]` or similar tags
- ✅ Represent language via character role only

**WRONG:**
```json
{
  "character": "Instructor",
  "text": "[lang=cmn-CN]爸爸[/lang]"
}
```

**CORRECT:**
```json
{
  "character": "Student 1",
  "text": "爸爸。"
}
```

### ASCII Punctuation Only (MTM-009)

- ✅ Use standard ASCII: `,` `.` `!` `?` `;` `:`
- ❌ Do NOT use Unicode punctuation variants
- **Note**: Auto-fixed by validator, but best to use ASCII from start

### Pacing and Pauses (MTM-005)

**Pause Timing Guidelines:**
- Simple recall: 2000-3000ms
- Complex questions: 4000-5000ms
- Between elements: 1000-1500ms
- After new vocabulary: 1500-2000ms

**After questions and key constructions:**
- Include Listener pauses (2000-3000ms)

**For new constructions:**
- Include longer pauses (4000-5000ms)

**Represent via explicit pause lines:**
```json
{
  "character": "Listener",
  "pauseAfterMs": 4000
}
```

### Layering Principle

- ✅ Build from previously learned phrases
- ❌ NEVER introduce new vocabulary AND new grammar simultaneously in the same step
- ✅ One new concept at a time
- ✅ Recycle and layer previous material

### Mnemonics

- ✅ Introduce Meaningful Memory Associations for each new word
- ✅ Follow immediately with practice lines
- ✅ Keep mnemonics under 80 characters
- ✅ Use vivid, concrete imagery

### Pronunciation (MTM-007)

- ✅ Use slowed rate (e.g., 0.8-0.9) for new words
- ✅ Use normal rate (1.0) for familiar content
- ✅ Rate must be between 0.5-2.0
- ✅ Use minimal pairs where needed

### Length (MTM-006)

- ✅ Target 120-150 dialogue lines
- ✅ ≈15+ minutes of content
- ✅ 3-5 varied contexts per concept
- ⚠️ Warning if lines too long (>200 characters)

### Characters Configuration

**Do NOT create bilingual lines within one character:**
- ❌ Split across Instructor/Student lines
- ✅ Each character speaks ONE language only

**Required characters:**
```json
{
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
      "voiceId": "cmn-CN-Chirp3-HD-Umbriel",
      "language": "cmn-CN"
    },
    {
      "name": "Student 2",
      "provider": "Google",
      "voiceId": "cmn-CN-Chirp3-HD-Leda",
      "language": "cmn-CN"
    },
    {
      "name": "Listener"
    }
  ]
}
```

### Validation (MANDATORY)

**Must pass validation before completion:**

```bash
cd cli/MichelThomas.TtsGenerator
dotnet run validate-script ../../<lesson-file-path>
```

**Expected output:**
```
✓ Script validation passed! No issues found.
```

**If validation fails:**
1. Read error messages carefully
2. Fix ALL errors (MTM-001 through MTM-010)
3. Address warnings (MTM-006, MTM-011) for quality
4. Re-validate until passing

## Validation Rules Summary

| Rule | Name | Severity | Fix |
|------|------|----------|-----|
| MTM-001 | Script Structure | Error | Check JSON structure |
| MTM-002 | Student 1 Usage | Error | Add Student 1 dialogue |
| MTM-003 | Student 2 Usage | Error | Add Student 2 dialogue |
| MTM-004 | Character Config | Error | Check voice settings |
| MTM-005 | Pause Timing | Error | Increase pauseAfterMs |
| MTM-006 | Line Length | Warning | Shorten lines |
| MTM-007 | Rate Settings | Error | Check rate 0.5-2.0 |
| MTM-008 | Bilingual Separation | Error | Split mixed languages |
| MTM-009 | Unicode Punctuation | Info | Use ASCII (auto-fixed) |
| MTM-010 | Inline Language Tags | Error | Remove `[lang=...]` |
| MTM-011 | Vocabulary Timing | Warning | Add pauses after vocab |

## Quick Checklist

Before marking lesson complete:
- [ ] Instructor speaks ONLY English
- [ ] Student 1 speaks ONLY Mandarin
- [ ] Student 2 speaks ONLY Mandarin
- [ ] NO mixed languages in single lines
- [ ] Character names are EXACT (Instructor, Student 1, Student 2, Listener)
- [ ] ASCII punctuation only
- [ ] Adequate pause timing (4000ms+ for complex questions)
- [ ] Both Student 1 and Student 2 have dialogue
- [ ] NO inline language tags `[lang=...]`
- [ ] Validation passes: `✓ Script validation passed! No issues found.`

## Additional Resources

- `MANDARIN_LESSON_QUICK_REFERENCE.md` - Quick reference guide
- `LESSON_GENERATION_WORKFLOW.md` - Complete workflow
- `LLM_lesson_guidance.md` - Comprehensive guidance
- `GUIDANCE_UPDATE_COMPLETE.txt` - Validation rules reference

