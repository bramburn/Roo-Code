# Quick Reference: Generating MTM Language Lessons

## Validation First!

**ALWAYS validate your lesson before considering it complete:**

```bash
cd cli/MichelThomas.TtsGenerator
dotnet run validate-script ../../<path-to-lesson>.json
```

Expected: `✓ Script validation passed! No issues found.`

## Character Setup

### Template (Replace with target language)

```json
"characters": [
  {
    "name": "Instructor",
    "provider": "Google",
    "voiceId": "<instructor-voice-id>",
    "language": "<instructor-language-code>"
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
    "name": "Listener",
    "description": "Represents pauses for the listener to think"
  }
]
```

### Language-Specific Examples

#### Mandarin (Chinese)
```json
"characters": [
  {"name": "Instructor", "provider": "Google", "voiceId": "en-US-Chirp3-HD-Erinome", "language": "en-US"},
  {"name": "Student 1", "provider": "Google", "voiceId": "cmn-CN-Chirp3-HD-Umbriel", "language": "cmn-CN"},
  {"name": "Student 2", "provider": "Google", "voiceId": "cmn-CN-Chirp3-HD-Leda", "language": "cmn-CN"},
  {"name": "Listener"}
]
```

#### Japanese
```json
"characters": [
  {"name": "Instructor", "provider": "Google", "voiceId": "en-US-Chirp3-HD-Erinome", "language": "en-US"},
  {"name": "Student 1", "provider": "Google", "voiceId": "ja-JP-Chirp3-HD-Umbriel", "language": "ja-JP"},
  {"name": "Student 2", "provider": "Google", "voiceId": "ja-JP-Chirp3-HD-Leda", "language": "ja-JP"},
  {"name": "Listener"}
]
```

#### Korean
```json
"characters": [
  {"name": "Instructor", "provider": "Google", "voiceId": "en-US-Chirp3-HD-Erinome", "language": "en-US"},
  {"name": "Student 1", "provider": "Google", "voiceId": "ko-KR-Chirp3-HD-Umbriel", "language": "ko-KR"},
  {"name": "Student 2", "provider": "Google", "voiceId": "ko-KR-Chirp3-HD-Leda", "language": "ko-KR"},
  {"name": "Listener"}
]
```

#### Spanish
```json
"characters": [
  {"name": "Instructor", "provider": "Google", "voiceId": "en-US-Chirp3-HD-Erinome", "language": "en-US"},
  {"name": "Student 1", "provider": "Google", "voiceId": "es-ES-Chirp3-HD-Umbriel", "language": "es-ES"},
  {"name": "Student 2", "provider": "Google", "voiceId": "es-ES-Chirp3-HD-Leda", "language": "es-ES"},
  {"name": "Listener"}
]
```

#### French
```json
"characters": [
  {"name": "Instructor", "provider": "Google", "voiceId": "en-US-Chirp3-HD-Erinome", "language": "en-US"},
  {"name": "Student 1", "provider": "Google", "voiceId": "fr-FR-Chirp3-HD-Umbriel", "language": "fr-FR"},
  {"name": "Student 2", "provider": "Google", "voiceId": "fr-FR-Chirp3-HD-Leda", "language": "fr-FR"},
  {"name": "Listener"}
]
```

#### German
```json
"characters": [
  {"name": "Instructor", "provider": "Google", "voiceId": "en-US-Chirp3-HD-Erinome", "language": "en-US"},
  {"name": "Student 1", "provider": "Google", "voiceId": "de-DE-Chirp3-HD-Umbriel", "language": "de-DE"},
  {"name": "Student 2", "provider": "Google", "voiceId": "de-DE-Chirp3-HD-Leda", "language": "de-DE"},
  {"name": "Listener"}
]
```

## Dialogue Pattern

**CRITICAL RULES:**
- ✅ Instructor speaks ONLY the instruction language (typically English)
- ✅ Student 1 & 2 speak ONLY the target language
- ✅ NO mixed language in single lines
- ✅ Use ASCII punctuation: `,` `.` `!` `?`
- ✅ NO inline language tags `[lang=...]`

### Basic Teaching Pattern

**Example (Mandarin):**
```json
[
  {
    "character": "Instructor",
    "text": "Today we learn family members."
  },
  {
    "character": "Listener",
    "pauseAfterMs": 1500
  },
  {
    "character": "Instructor",
    "text": "Father is baba. Mother is mama."
  },
  {
    "character": "Listener",
    "pauseAfterMs": 1000
  },
  {
    "character": "Student 1",
    "text": "爸爸。妈妈。"
  },
  {
    "character": "Listener",
    "pauseAfterMs": 1500
  }
]
```

**Example (Spanish):**
```json
[
  {
    "character": "Instructor",
    "text": "Today we learn family members."
  },
  {
    "character": "Listener",
    "pauseAfterMs": 1500
  },
  {
    "character": "Instructor",
    "text": "Father is padre. Mother is madre."
  },
  {
    "character": "Listener",
    "pauseAfterMs": 1000
  },
  {
    "character": "Student 1",
    "text": "Padre. Madre."
  },
  {
    "character": "Listener",
    "pauseAfterMs": 1500
  }
]
```

## Pause Timing Guidelines

- **After instruction**: 1000-1500ms
- **After vocabulary**: 1000ms
- **Before student response**: 4000-5000ms (complex), 2000-3000ms (simple)
- **After student response**: 1500ms
- **Between language switches**: 500-1000ms

## Common Validation Errors

| Error | Fix |
|-------|-----|
| MTM-002/003: Missing Student 1/2 | Add dialogue for both students |
| MTM-005: Pause too short | Increase pauseAfterMs to 4000+ for complex questions |
| MTM-008: Mixed languages | Split into separate Instructor/Student lines |
| MTM-010: Inline tags | Remove `[lang=...]` tags, split into separate lines |

## Validation Commands

```bash
# Single lesson
dotnet run validate-script ../../<path-to-lesson>.json

# All lessons in directory
dotnet run validate-bilingual ../../<path-to-directory>/

# With full output
dotnet run validate-script ../../<path-to-lesson>.json 2>&1 | tail -50
```

## Lesson Structure Template

1. **Opening** (1-2 min): Introduce topic
2. **Vocabulary** (2-3 min): Teach new words with pauses
3. **Practice** (3-5 min): Students repeat and respond
4. **Integration** (2-3 min): Combine with previous concepts
5. **Closing** (1 min): Congratulate and preview next lesson

## File Location Examples

- **Mandarin**: `/samples/hsk1_new/m{01-20}.json` or `/curriculum/mandarin-to-english/modules/01-Basics/01.json`
- **Japanese**: `/curriculum/japanese-to-english/modules/01-Basics/01.json`
- **Spanish**: `/curriculum/spanish-to-english/modules/01-Basics/01.json`
- **French**: `/curriculum/french-to-english/modules/01-Basics/01.json`
- **German**: `/curriculum/german-to-english/modules/01-Basics/01.json`
- **Korean**: `/curriculum/korean-to-english/modules/01-Basics/01.json`

## Language Code Reference

| Language | Code | Example Voice ID |
|----------|------|------------------|
| Mandarin | cmn-CN | cmn-CN-Chirp3-HD-Umbriel |
| Japanese | ja-JP | ja-JP-Chirp3-HD-Umbriel |
| Korean | ko-KR | ko-KR-Chirp3-HD-Umbriel |
| Spanish | es-ES | es-ES-Chirp3-HD-Umbriel |
| French | fr-FR | fr-FR-Chirp3-HD-Umbriel |
| German | de-DE | de-DE-Chirp3-HD-Umbriel |
| English | en-US | en-US-Chirp3-HD-Erinome |

**Note**: Voice IDs are examples. Consult Google TTS documentation for available voices.

## Before Deployment

- [ ] Lesson passes validation: `✓ Script validation passed!`
- [ ] Both Student 1 and Student 2 have dialogue
- [ ] Pause times are adequate (4000ms+ for complex questions)
- [ ] No mixed languages in single lines
- [ ] ASCII punctuation only (no Unicode variants)
- [ ] Follows Michel Thomas Method principles
- [ ] Correct language codes used for target language
- [ ] Appropriate voice IDs selected for target language

