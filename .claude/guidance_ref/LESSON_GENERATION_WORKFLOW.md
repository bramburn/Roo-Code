# Complete Lesson Generation Workflow

## Step 1: Plan the Lesson

- [ ] Identify the single new concept (vocabulary or grammar)
- [ ] Review curriculum (man-curriculum-2.md)
- [ ] Plan lesson structure (opening, vocabulary, practice, integration)
- [ ] Identify which students will speak (Student 1 and/or Student 2)

## Step 2: Create the JSON File

Use this template:

```json
{
  "title": "Mandarin to English: Lesson X - Topic",
  "description": "Brief description of what students will learn",
  "level": "Beginner Mandarin",
  "target_language": "Mandarin",
  "instruction_language": "English",
  "voiceSettings": {
    "rate": 1,
    "pitch": 1,
    "volume": 1
  },
  "characters": [
    {
      "name": "Instructor",
      "provider": "Google",
      "voiceId": "en-US-Chirp3-HD-Erinome",
      "language": "en-US",
      "description": "English instructor",
      "settings": {"model": "chirp"}
    },
    {
      "name": "Student 1",
      "provider": "Google",
      "voiceId": "cmn-CN-Chirp3-HD-Umbriel",
      "language": "cmn-CN",
      "description": "Male learner",
      "settings": {"model": "chirp"}
    },
    {
      "name": "Student 2",
      "provider": "Google",
      "voiceId": "cmn-CN-Chirp3-HD-Leda",
      "language": "cmn-CN",
      "description": "Female learner",
      "settings": {"model": "chirp"}
    },
    {
      "name": "Listener",
      "description": "Represents pauses for the listener to think"
    }
  ],
  "dialogue": [
    // Add dialogue here
  ]
}
```

## Step 3: Write the Dialogue

**CRITICAL RULES:**
- ✅ Instructor speaks ONLY English
- ✅ Student 1 & 2 speak ONLY Mandarin
- ✅ NO mixed language in single lines
- ✅ Use ASCII punctuation: `,` `.` `!` `?`
- ✅ NO inline language tags `[lang=...]`

**Pattern:**
1. Instructor introduces concept
2. Listener pause (1000-1500ms)
3. Instructor explains or gives example
4. Listener pause (1000ms)
5. Student 1 or 2 repeats/responds
6. Listener pause (1500ms)
7. Repeat for practice

## Step 4: Validate the Lesson

```bash
cd cli/MichelThomas.TtsGenerator
dotnet run validate-script ../../samples/hsk1_new/m13.json
```

### Expected Output (PASSING):
```
✓ Script validation passed! No issues found.
```

### If Validation Fails:

Check the error messages and fix using this guide:

| Error | Fix |
|-------|-----|
| MTM-001 | Check JSON structure, required fields |
| MTM-002 | Add dialogue for Student 1 |
| MTM-003 | Add dialogue for Student 2 |
| MTM-004 | Check character voice settings |
| MTM-005 | Increase pauseAfterMs (4000+ for complex) |
| MTM-006 | Shorten dialogue lines |
| MTM-007 | Check rate is 0.5-2.0 |
| MTM-008 | Split mixed languages into separate lines |
| MTM-009 | Use ASCII punctuation (auto-fixed) |
| MTM-010 | Remove `[lang=...]` tags |
| MTM-011 | Add pauses after new vocabulary |

## Step 5: Fix Errors

**Most Common Errors:**

### MTM-008: Bilingual Dialogue Separation
```json
// WRONG
{"character": "Instructor", "text": "Father is baba. In Mandarin, we say 爸爸."}

// CORRECT
[
  {"character": "Instructor", "text": "Father is baba."},
  {"character": "Listener", "pauseAfterMs": 1000},
  {"character": "Student 1", "text": "爸爸。"}
]
```

### MTM-005: Pause Timing
```json
// WRONG
{"character": "Listener", "pauseAfterMs": 500}  // Too short for complex question

// CORRECT
{"character": "Listener", "pauseAfterMs": 4000}  // Adequate thinking time
```

### MTM-002/003: Missing Students
```json
// WRONG - Only Instructor speaks
[
  {"character": "Instructor", "text": "Say this..."},
  {"character": "Listener", "pauseAfterMs": 2000}
]

// CORRECT - Both students practice
[
  {"character": "Instructor", "text": "Say this..."},
  {"character": "Listener", "pauseAfterMs": 4000},
  {"character": "Student 1", "text": "我说这个。"},
  {"character": "Listener", "pauseAfterMs": 1500},
  {"character": "Student 2", "text": "我说这个。"}
]
```

## Step 6: Re-validate

```bash
dotnet run validate-script ../../samples/hsk1_new/m13.json
```

Repeat until you see: `✓ Script validation passed! No issues found.`

## Step 7: Final Checklist

- [ ] Lesson passes validation
- [ ] Both Student 1 and Student 2 have dialogue
- [ ] Pause times are adequate (4000ms+ for complex questions)
- [ ] No mixed languages in single lines
- [ ] ASCII punctuation only
- [ ] Follows Michel Thomas Method principles
- [ ] Lesson teaches ONE concept clearly
- [ ] Students can practice immediately

## Step 8: Deploy

Once validation passes, the lesson is ready for:
- Audio generation via TTS pipeline
- Integration into learning management system
- Student testing and feedback

## Quick Reference

**Validation Command:**
```bash
cd cli/MichelThomas.TtsGenerator
dotnet run validate-script ../../samples/hsk1_new/m{LESSON_NUMBER}.json
```

**Expected Success:**
```
✓ Script validation passed! No issues found.
```

**File Location:**
```
/samples/hsk1_new/m{13-20}.json
```

**Character Names (EXACT):**
- Instructor
- Student 1
- Student 2
- Listener

**Pause Timing:**
- Simple recall: 2000-3000ms
- Complex questions: 4000-5000ms
- Between elements: 1000-1500ms

