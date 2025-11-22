# MTM Pronunciation Guide - Critical Rules with Examples

## GOLDEN RULE: Instructor Never Pronounces Target Language

**CRITICAL**: The English-speaking instructor (TeacherEnglish) must NEVER pronounce target language words, phrases, or sentences. This is a fundamental MTM principle that maintains clear language separation and ensures authentic pronunciation modeling.

## Correct 3-Part Pronunciation Structure

When introducing new target language vocabulary, always use this structure:

### Pattern:
1. **TeacherEnglish**: Sets up the word with English context only
2. **Micro Pause**: 500ms for anticipation
3. **Teacher (Native Speaker)**: Pronounces the target language word clearly
4. **Processing Pause**: 1000ms for learner to absorb
5. **TeacherEnglish**: Connects back to English understanding

## Few-Shot Examples

### Example 1: Korean - "Coffee" ✅ CORRECT
```json
{
  "character": "TeacherEnglish",
  "text": "The Korean word for coffee sounds very similar to the English word..."
},
{
  "character": "Listener",
  "pauseAfterMs": 500
},
{
  "character": "Teacher",
  "text": "카페",
  "rate": 0.9
},
{
  "character": "Listener",
  "pauseAfterMs": 1000
},
{
  "character": "TeacherEnglish",
  "text": "Can you hear how similar that sounds to 'coffee'?"
}
```

### Example 2: Mandarin - "Hello" ✅ CORRECT
```json
{
  "character": "TeacherEnglish",
  "text": "In Mandarin, the formal way to say hello is..."
},
{
  "character": "Listener",
  "pauseAfterMs": 500
},
{
  "character": "Teacher",
  "text": "你好",
  "rate": 0.9
},
{
  "character": "Listener",
  "pauseAfterMs": 1000
},
{
  "character": "TeacherEnglish",
  "text": "That literally means 'you good', which is a common way to greet people."
}
```

### Example 3: Korean - "Thank you" ✅ CORRECT
```json
{
  "character": "TeacherEnglish",
  "text": "The polite way to say thank you in Korean is..."
},
{
  "character": "Listener",
  "pauseAfterMs": 500
},
{
  "character": "Teacher",
  "text": "감사합니다",
  "rate": 0.9
},
{
  "character": "Listener",
  "pauseAfterMs": 1000
},
{
  "character": "TeacherEnglish",
  "text": "Remember to use this when someone does something kind for you."
}
```

## ❌ FORBIDDEN EXAMPLES (NEVER USE)

### Example 1: Direct Pronunciation ❌ WRONG
```json
{
  "character": "TeacherEnglish",
  "text": "It's 'ka-pe'. Can you hear the similarity?"
}
```

### Example 2: Mixed Language ❌ WRONG
```json
{
  "character": "TeacherEnglish",
  "text": "In Korean they say 'annyeonghaseyo' for hello."
}
```

### Example 3: Phonetic Spelling ❌ WRONG
```json
{
  "character": "TeacherEnglish",
  "text": "You say it like 'gamsahamnida' to thank someone."
}
```

## Advanced Examples

### Example 4: Multiple Words ✅ CORRECT
```json
{
  "character": "TeacherEnglish",
  "text": "To introduce yourself formally, you would say..."
},
{
  "character": "Listener",
  "pauseAfterMs": 500
},
{
  "character": "Teacher",
  "text": "만나서 반갑습니다",
  "rate": 0.9
},
{
  "character": "Listener",
  "pauseAfterMs": 1500
},
{
  "character": "Teacher",
  "text": "만나서",
  "rate": 0.9
},
{
  "character": "Listener",
  "pauseAfterMs": 800
},
{
  "character": "Teacher",
  "text": "반갑습니다",
  "rate": 0.9
},
{
  "character": "Listener",
  "pauseAfterMs": 1000
},
{
  "character": "TeacherEnglish",
  "text": "That means 'nice to meet you' - a very polite phrase!"
}
```

### Example 5: With Mnemonic ✅ CORRECT
```json
{
  "character": "TeacherEnglish",
  "text": "The Korean word for 'name' sounds a bit like 'ee-reum' - think 'eerie name' to help remember it..."
},
{
  "character": "Listener",
  "pauseAfterMs": 500
},
{
  "character": "Teacher",
  "text": "이름",
  "rate": 0.9
},
{
  "character": "Listener",
  "pauseAfterMs": 1000
},
{
  "character": "TeacherEnglish",
  "text": "'Eerie name' - 이름. Can you remember that?"
}
```

## Dialogue Flow Templates

### Template 1: Basic Vocabulary Introduction
```json
{
  "character": "TeacherEnglish",
  "text": "Today we're learning how to say [concept] in [language]. The word is..."
},
{
  "character": "Listener",
  "pauseAfterMs": 500
},
{
  "character": "Teacher",
  "text": "[target language word]",
  "rate": 0.9
},
{
  "character": "Listener",
  "pauseAfterMs": 1000
},
{
  "character": "TeacherEnglish",
  "text": "Let's practice that. How do you say [concept]?"
}
```

### Template 2: With Context and Usage
```json
{
  "character": "TeacherEnglish",
  "text": "When you [situation], you would say..."
},
{
  "character": "Listener",
  "pauseAfterMs": 500
},
{
  "character": "Teacher",
  "text": "[target phrase]",
  "rate": 0.9
},
{
  "character": "Listener",
  "pauseAfterMs": 1500
},
{
  "character": "TeacherEnglish",
  "text": "You would use this when [specific context]."
}
```

## Quality Checklist for Pronunciation

Before finalizing any lesson:
- [ ] **TeacherEnglish NEVER pronounces** target language words
- [ ] **All new vocabulary** uses the 3-part structure
- [ ] **Micro pauses** are 500ms before pronunciation
- [ ] **Processing pauses** are 1000ms after pronunciation
- [ ] **Teacher (Native Speaker)** always handles target language pronunciation
- [ ] **Rate is set to 0.9** for pronunciation clarity
- [ ] **No mixed language** dialogue lines
- [ ] **No phonetic spellings** in English dialogue

## Common Mistakes to Avoid

1. **"It sounds like..."** - Don't provide phonetic hints in English
2. **"You say it like..."** - Don't model pronunciation
3. **Mixed sentences** - Never combine languages in one dialogue line
4. **Direct translations** - Let the native speaker handle pronunciation
5. **Skipping pauses** - Always include proper micro pauses

Remember: **Clear language separation = Better learning outcomes**