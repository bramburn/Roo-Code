---
name: Validate-Script
description: Commands and policy for validating MTM lesson JSON and modules using the .NET CLI with comprehensive error resolution.
---

## Validation Workflow

**REFERENCE**: See `LESSON_GENERATION_WORKFLOW.md` for complete validation workflow
**QUICK REFERENCE**: See `MANDARIN_LESSON_QUICK_REFERENCE.md` for common errors

Run from repo root unless noted.

### Step 1: Navigate to CLI Project

```bash
cd cli/MichelThomas.TtsGenerator
```

### Step 2: Validate a Single Lesson JSON

```bash
dotnet run validate-script ../../curriculum/{source}-to-{target}/modules/{NN-Name}/{LL}.json
```

**For samples directory:**
```bash
dotnet run validate-script ../../samples/hsk1_new/m13.json
```

### Step 3: Expected Output

**PASSING:**
```
✓ Script validation passed! No issues found.
```

**FAILING:**
```
✗ Script validation failed with X issues:
  • MTM-008: Bilingual Dialogue Separation: Line 45 - Character "Instructor" has mixed languages
  • MTM-005: Pause Timing: Line 67 - pauseAfterMs is 500ms (too short for complex question)
  • MTM-002: Student 1 Usage: No dialogue found for "Student 1"
```

### Step 4: Interpret Results

- **Errors (MTM-001 through MTM-010)**: MUST fix before proceeding
- **Warnings (MTM-006, MTM-011)**: Fix when feasible for quality
- **Info (MTM-009)**: Auto-fixed by validator

### Step 5: Fix Errors Using Common Fixes

**See `GUIDANCE_UPDATE_COMPLETE.txt` for comprehensive error fixes**

## Validation Rules Reference

| Rule | Name | Severity | Description |
|------|------|----------|-------------|
| MTM-001 | Script Structure | Error | Valid JSON with required fields |
| MTM-002 | Student 1 Usage | Error | Must include "Student 1" character |
| MTM-003 | Student 2 Usage | Error | Must include "Student 2" character |
| MTM-004 | Character Configuration | Error | Valid voice settings |
| MTM-005 | Pause Timing | Error | 1000-10000ms (reasonable thinking time) |
| MTM-006 | Line Length | Warning | Appropriate dialogue length |
| MTM-007 | Rate Settings | Error | 0.5-2.0 range |
| MTM-008 | Bilingual Separation | Error | CRITICAL - No mixed languages |
| MTM-009 | Unicode Punctuation | Info | ASCII only (auto-fixed) |
| MTM-010 | Inline Language Tags | Error | CRITICAL - No `[lang=...]` tags |
| MTM-011 | Vocabulary Timing | Warning | Adequate pause after new words |

## Common Error Fixes

### MTM-008: Bilingual Dialogue Separation

**Problem:** Mixed languages in single dialogue line

**WRONG:**
```json
{
  "character": "Instructor",
  "text": "Father is baba. In Mandarin, we say 爸爸."
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

### MTM-002/003: Missing Student Characters

**Problem:** Student 1 or Student 2 has no dialogue

**WRONG:**
```json
[
  {
    "character": "Instructor",
    "text": "Say this..."
  },
  {
    "character": "Listener",
    "pauseAfterMs": 2000
  }
]
```

**CORRECT:**
```json
[
  {
    "character": "Instructor",
    "text": "Say this..."
  },
  {
    "character": "Listener",
    "pauseAfterMs": 4000
  },
  {
    "character": "Student 1",
    "text": "我说这个。"
  },
  {
    "character": "Listener",
    "pauseAfterMs": 1500
  },
  {
    "character": "Student 2",
    "text": "我说这个。"
  }
]
```

### MTM-005: Pause Timing

**Problem:** Pause duration too short or too long

**WRONG:**
```json
{
  "character": "Listener",
  "pauseAfterMs": 500  // Too short for complex question
}
```

**CORRECT:**
```json
{
  "character": "Listener",
  "pauseAfterMs": 4000  // Adequate thinking time
}
```

**Pause Timing Guidelines:**
- Simple recall: 2000-3000ms
- Complex questions: 4000-5000ms
- Between elements: 1000-1500ms
- After new vocabulary: 1500-2000ms

### MTM-010: Inline Language Tags

**Problem:** Using `[lang=...]` tags

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

### MTM-009: Unicode Punctuation

**Problem:** Using Unicode punctuation variants

**WRONG:**
```json
{
  "character": "Instructor",
  "text": "Hello， world！"  // Unicode comma and exclamation
}
```

**CORRECT:**
```json
{
  "character": "Instructor",
  "text": "Hello, world!"  // ASCII comma and exclamation
}
```

**Note:** This is auto-fixed by the validator, but best to use ASCII from the start.

## Character Names (MUST BE EXACT)

For Mandarin-to-English lessons:
- ✅ "Instructor" (English speaker)
- ✅ "Student 1" (Mandarin speaker)
- ✅ "Student 2" (Mandarin speaker)
- ✅ "Listener" (pauses only)

NOT:
- ❌ "Teacher" or "TeacherEnglish"
- ❌ "Student A" or "Student B"

## Validation Retry Loop

```bash
# 1. Run validation
dotnet run validate-script ../../samples/hsk1_new/m13.json

# 2. If errors, fix them in the JSON file

# 3. Re-run validation
dotnet run validate-script ../../samples/hsk1_new/m13.json

# 4. Repeat until:
✓ Script validation passed! No issues found.
```

## MCP Memory Integration

After successful validation, record results:

```bash
# If MCP memory server available
mcp__memory__create_entities
# Entity: ValidationResult
# Properties: status="passed", path="...", timestamp="...", issues=[]

mcp__memory__create_relations
# Relation: Lesson -> ValidationResult
```

## Additional Validation Commands

**Check bilingual separation (file or directory):**
```bash
dotnet run validate-bilingual ../../curriculum/{source}-to-{target}/modules/{NN-Name}/
```

**Validate all lessons in a directory:**
```bash
for file in ../../samples/hsk1_new/m*.json; do
  echo "Validating $file..."
  dotnet run validate-script "$file"
done
```

## Quality Assurance Checklist

Before marking lesson complete:
- [ ] Run `dotnet run validate-script <lesson-file>`
- [ ] Verify: `✓ Script validation passed! No issues found.`
- [ ] All errors (MTM-001 through MTM-010) fixed
- [ ] Warnings (MTM-006, MTM-011) addressed
- [ ] Character names are exact (Instructor, Student 1, Student 2, Listener)
- [ ] Complete language separation (no mixed languages)
- [ ] ASCII punctuation only
- [ ] Adequate pause timing (4000ms+ for complex questions)
- [ ] Both Student 1 and Student 2 have dialogue
- [ ] Record validation result in MCP memory (if available)

## Troubleshooting

**If validation fails repeatedly:**
1. Check `MANDARIN_LESSON_QUICK_REFERENCE.md` for quick fixes
2. Review `LESSON_GENERATION_WORKFLOW.md` for complete workflow
3. Consult `GUIDANCE_UPDATE_COMPLETE.txt` for comprehensive error reference
4. Verify character names are EXACT
5. Ensure complete language separation
6. Check pause timing is adequate

**If validator crashes:**
1. Check JSON syntax is valid
2. Verify all required fields are present
3. Ensure file path is correct
4. Check for special characters in file path

