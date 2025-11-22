# JSON Structure Requirements for Lesson Files

## Root-Level Fields (MUST)

Every lesson JSON file **MUST** contain these root-level fields:

```json
{
  "title": "string - Lesson title (e.g., 'Lesson 01: Psychological Setup & Cognates')",
  "description": "string - Brief description of lesson content",
  "level": "string - Difficulty level (e.g., 'HSK 1', 'Beginner')",
  "target_language": "string - Language being taught (e.g., 'Chinese (Mandarin)')",
  "instruction_language": "string - Language of instruction (e.g., 'English')",
  "voiceSettings": { ... },
  "characters": [ ... ],
  "dialogue": [ ... ]
}
```

## voiceSettings Object (MUST)

The `voiceSettings` object **MUST** be present with these fields:

```json
"voiceSettings": {
  "rate": 1,
  "pitch": 1,
  "volume": 1
}
```

- All values must be numeric (typically 1 for standard settings)
- These control the voice output characteristics

## characters Array (MUST)

The `characters` array **MUST** contain character definitions:

```json
"characters": [
  {
    "name": "string - Character name (e.g., 'Teacher', 'TeacherEnglish', 'Student A')",
    "provider": "string - Voice provider (e.g., 'Google')",
    "voiceId": "string - Voice identifier (e.g., 'cmn-CN-Chirp3-HD-Erinome')",
    "language": "string - Language code (e.g., 'zh-CN', 'en-US')",
    "description": "string - Character description",
    "settings": {
      "model": "string - TTS model (e.g., 'chirp')"
    }
  }
]
```

### Required Characters (MUST):
- **Teacher** - Speaks Mandarin (voice: cmn-CN-Chirp3-HD-Erinome)
- **TeacherEnglish** - Speaks English (voice: en-US-Chirp3-HD-Erinome)
- **Student A** - Demonstrates in target language (voice: cmn-CN-Chirp3-HD-Umbriel)
- **Student B** - Demonstrates in target language (voice: cmn-CN-Chirp3-HD-Leda)
- **Listener** - Represents learner (no voice needed, used for pauses)

### Voice Field Rules:
- Use Google Chirp3 HD voices for Mandarin: `cmn-CN-Chirp3-HD-*`
- Use Google Chirp3 HD voices for English: `en-US-Chirp3-HD-*`
- All voices should use the HD variant for consistent quality
- Listener character does NOT need a voice field

## dialogue Array (MUST)

The `dialogue` array contains all dialogue lines and pauses:

```json
"dialogue": [
  {
    "character": "string - Character name",
    "text": "string - Dialogue text",
    "pauseAfterMs": "integer - Pause duration in milliseconds (optional)"
  }
]
```

### Dialogue Entry Rules (MUST):
- **character** field: Must match a character name from the characters array
- **text** field: Required for all characters except Listener
- **pauseAfterMs** field: Optional, must be an integer (milliseconds)
- Listener entries: Only need `character` and `pauseAfterMs`, no text field

### Text Field Rules (MUST):
- Use UTF-8 encoding for all text
- Use ASCII punctuation (. , ! ? ; :)
- Escape double quotes as `\"`
- NO inline language tags (e.g., `[lang=zh-CN]...[/lang]`)
- NO mixed languages in a single line

## Complete Example Structure

```json
{
  "title": "Lesson 01: Psychological Setup & Cognates",
  "description": "Introduction to Mandarin with psychological setup and cognate bridge",
  "level": "HSK 1",
  "target_language": "Chinese (Mandarin)",
  "instruction_language": "English",
  "voiceSettings": {
    "rate": 1,
    "pitch": 1,
    "volume": 1
  },
  "characters": [
    {
      "name": "Teacher",
      "provider": "Google",
      "voiceId": "cmn-CN-Chirp3-HD-Erinome",
      "language": "cmn-CN",
      "description": "Mandarin-speaking teacher for target language instruction",
      "settings": {
        "model": "chirp"
      }
    },
    {
      "name": "TeacherEnglish",
      "provider": "Google",
      "voiceId": "en-US-Chirp3-HD-Erinome",
      "language": "en-US",
      "description": "English-speaking teacher for instruction and explanations",
      "settings": {
        "model": "chirp"
      }
    },
    {
      "name": "Student A",
      "provider": "Google",
      "voiceId": "cmn-CN-Chirp3-HD-Umbriel",
      "language": "cmn-CN",
      "description": "Male student demonstrating responses",
      "settings": {
        "model": "chirp"
      }
    },
    {
      "name": "Student B",
      "provider": "Google",
      "voiceId": "cmn-CN-Chirp3-HD-Leda",
      "language": "cmn-CN",
      "description": "Female student demonstrating responses",
      "settings": {
        "model": "chirp"
      }
    },
    {
      "name": "Listener",
      "description": "Represents the learner (for pauses only)"
    }
  ],
  "dialogue": [
    {
      "character": "TeacherEnglish",
      "text": "Welcome to this lesson."
    },
    {
      "character": "Listener",
      "pauseAfterMs": 2000
    }
  ]
}
```

## Validation Checklist

Before completing a lesson file:

- [ ] Valid JSON syntax (no parsing errors)
- [ ] All required root fields present
- [ ] voiceSettings object with rate, pitch, volume
- [ ] All required characters defined
- [ ] All dialogue entries have valid character references
- [ ] No inline language tags in any text
- [ ] No mixed languages in single dialogue lines
- [ ] All pauseAfterMs values are integers
- [ ] ASCII punctuation used throughout
- [ ] UTF-8 encoding maintained
- [ ] File named correctly (XX.json format)

## Automated Validation with .NET CLI

After creating a lesson file, validate it using the .NET CLI commands:

### Comprehensive Validation
```bash
cd cli/MichelThomas.TtsGenerator
dotnet run validate-script ../../path/to/lesson.json
```

This validates all MTM rules (MTM-001 through MTM-009) and provides detailed error reporting.

### Bilingual Dialogue Validation
```bash
dotnet run validate-bilingual ../../path/to/lesson.json
```

This focuses on language separation and Unicode punctuation issues.

### Batch Directory Validation
```bash
dotnet run validate-bilingual ../../curriculum/[lang]/modules/[module]/
```

Validates all lessons in a module directory.

**Always run validation before marking a lesson as complete.**

