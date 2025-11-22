# Dialogue Separation Rules - Language Segregation for TTS Compatibility

## CRITICAL RULE: MTM-008 - Language Separation

**ABSOLUTELY FORBIDDEN:** Mixing English and Mandarin in a single dialogue line.

This is a **CRITICAL ERROR** that causes audio generation failures and will be rejected by validation.

## The Problem

When a single dialogue line contains both English and Mandarin:
- TTS engines cannot determine which language to use
- Audio generation fails or produces incorrect pronunciation
- The lesson becomes unusable
- Validation scripts will reject the file

## The Solution: Character-Based Language Separation

**MUST** split bilingual content across different character lines, each speaking only one language.

### Correct Pattern:

```json
{
  "character": "TeacherEnglish",
  "text": "In Mandarin, we say..."
},
{
  "character": "Teacher",
  "text": "你好"
},
{
  "character": "TeacherEnglish",
  "text": "Which means hello."
}
```

### INCORRECT Pattern (FORBIDDEN):

```json
{
  "character": "TeacherEnglish",
  "text": "In Mandarin, we say 你好 which means hello."
}
```

## Character Language Rules (MUST)

### TeacherEnglish Character
- **ONLY** speaks English
- Used for explanations, instructions, and context
- Never includes Mandarin words or characters
- Examples:
  - "Let's learn how to say hello."
  - "Now you try to say this."
  - "That's correct!"

### Teacher Character
- **ONLY** speaks Mandarin Chinese
- Used for target language content
- Never includes English words
- Examples:
  - "你好"
  - "我叫李明"
  - "你好吗？"

### Student A / Student B Characters
- Speak the target language (Mandarin)
- Used to demonstrate responses
- Never mix languages
- Examples:
  - "你好"
  - "我很好，谢谢"

### Listener Character
- Represents the learner
- No text field (only pauseAfterMs)
- Used to indicate pause points for learner practice

## Common Mistakes to Avoid

### ❌ WRONG: Inline Translation
```json
{
  "character": "Teacher",
  "text": "你好 (hello)"
}
```

### ✅ CORRECT: Separate Lines
```json
{
  "character": "Teacher",
  "text": "你好"
},
{
  "character": "TeacherEnglish",
  "text": "This means hello."
}
```

### ❌ WRONG: Mixed Language Explanation
```json
{
  "character": "TeacherEnglish",
  "text": "The word 你好 means hello in Mandarin."
}
```

### ✅ CORRECT: Separated Explanation
```json
{
  "character": "TeacherEnglish",
  "text": "The word means hello in Mandarin."
},
{
  "character": "Teacher",
  "text": "你好"
}
```

## IMPORTANT: MTM-010 Exception for Korean and Chinese

**For Korean and Mandarin Chinese lessons ONLY**, inline language tags ARE REQUIRED in Instructor dialogue:

### ✅ CORRECT for Korean (MTM-010 Exception):
```json
{
  "character": "Instructor",
  "text": "The word for hello is [lang=ko-KR]annyeonghaseyo[/lang]."
}
```

### ✅ CORRECT for Mandarin Chinese (MTM-010 Exception):
```json
{
  "character": "Instructor",
  "text": "The word for water is [lang=zh-CN]水[/lang]."
}
```

**Why?** These tags are required for the LanguageSegmenterService to properly split bilingual lines for audio generation. The tags are automatically processed and removed during audio synthesis.

### ❌ FORBIDDEN for all other languages:
```json
{
  "character": "Instructor",
  "text": "The word for hello is [lang=fr-FR]Bonjour[/lang]."
}
```

For non-integrated languages (French, Spanish, German, etc.), use character-based separation instead.

## Mnemonic Integration Pattern

When introducing mnemonics for vocabulary:

```json
{
  "character": "TeacherEnglish",
  "text": "The word for water is 水. Think of it like a swimming pool - 水 sounds like 'shway'."
},
{
  "character": "Listener",
  "pauseAfterMs": 1000
},
{
  "character": "Teacher",
  "text": "水"
},
{
  "character": "Listener",
  "pauseAfterMs": 2000
}
```

## Validation Self-Check

Before submitting a lesson file, verify:

- [ ] Every dialogue line contains text in ONLY ONE language
- [ ] TeacherEnglish lines contain ONLY English
- [ ] Teacher lines contain ONLY Mandarin
- [ ] **For Korean/Chinese lessons**: Inline tags `[lang=ko-KR]` or `[lang=zh-CN]` are PRESENT in Instructor dialogue (REQUIRED)
- [ ] **For other languages**: NO inline language tags (e.g., `[lang=fr-FR]...[/lang]`)
- [ ] No parenthetical translations (e.g., "你好 (hello)")
- [ ] No mixed-language explanations
- [ ] Translations/explanations split across separate character lines
- [ ] Mnemonics properly separated from target language text

## Why This Matters

Proper language separation ensures:
1. **TTS Compatibility:** Audio generation works correctly
2. **Clarity:** Learners understand which language is being spoken
3. **Validation Success:** Files pass automated validation
4. **Professional Quality:** Lessons sound natural and well-produced
5. **MTM Compliance:** Maintains pedagogical integrity

