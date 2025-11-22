# Agent Context Templates - Target Language Awareness

## Purpose
These templates ensure all agents maintain correct target language context and never default to assuming Mandarin Chinese.

## Template 1: Initial Context Reading (For All Agents)

### Context Reading Script:
```
BEFORE STARTING ANY WORK:

1. READ curriculum/index.md
2. IDENTIFY the active curriculum section
3. EXTRACT the target language from the path
4. COPY THE EXACT PATH from the index (e.g., curriculum/english-to-korean/)
5. CONFIRM the language pair (Source → Target)
6. MAINTAIN this context throughout the session
7. USE ONLY THE SPECIFIED PATH FOR ALL FOLDER CREATION

EXAMPLE OUTPUT:
"Based on curriculum/index.md, I'm working on English to Korean curriculum.
Target Language: Korean
Source Language: English
Curriculum Path: curriculum/english-to-korean/
I will ONLY create folders under curriculum/english-to-korean/
I will NEVER create folders like 'korean/' at root level."
```

### CRITICAL PATH RULES:
- ALWAYS use the exact path from curriculum/index.md
- NEVER create folders outside the curriculum/ directory
- NEVER create folders like 'korean/' or 'mandarin/' at root level
- ALWAYS follow the format: curriculum/{source}-to-{target}/

## Template 2: Curriculum-Builder Context

### Curriculum Structure Template:
```
TARGET LANGUAGE: [ACTUAL_TARGET_LANGUAGE]
SOURCE LANGUAGE: English
CURRICULUM PATH: curriculum/english-to-[ACTUAL_TARGET_LANGUAGE]/

MODULE TEMPLATES:
- Module 01: Foundation (Basic greetings, "I am", cognates)
- Module 02: Questions ("Do you...?", responses)
- Module 03: Negation ("I don't...", "You don't...")
- [Continue with 8-10 modules appropriate for target language]

EXAMPLE VOCABULARY:
For [ACTUAL_TARGET_LANGUAGE]:
- Basic greetings: [examples in target language]
- Common verbs: [examples in target language]
- Essential nouns: [examples in target language]

FORBIDDEN:
- Never use Chinese examples unless target is Mandarin
- Never assume Mandarin as default
- Always verify target language from index
```

## Template 3: MTM Lesson-Creator Context

### Lesson Creation Context:
```
LESSON CONTEXT CHECKLIST:
✅ Read curriculum/index.md
✅ Identified target language: [ACTUAL_TARGET_LANGUAGE]
✅ Confirmed source language: English
✅ Module path: curriculum/english-to-[ACTUAL_TARGET_LANGUAGE]/modules/XX-ModuleName/
✅ Character voices configured for [ACTUAL_TARGET_LANGUAGE]

CHARACTER CONFIGURATION:
- TeacherEnglish: en-US-Chirp3-HD-Erinome
- Teacher: [target-code]-Chirp3-HD-Erinome
- Student A: [target-code]-Chirp3-HD-Umbriel
- Student B: [target-code]-Chirp3-HD-Leda

PRONUNCIATION RULES:
- TeacherEnglish NEVER pronounces [ACTUAL_TARGET_LANGUAGE]
- Teacher ALWAYS pronounces [ACTUAL_TARGET_LANGUAGE]
- Use 3-part structure with micro pauses
- Examples must use [ACTUAL_TARGET_LANGUAGE] words

FORBIDDEN PATTERNS:
- Never use Chinese words unless target is Mandarin
- Never assume target language is Mandarin
- Always verify from curriculum index first
```

## Template 4: Language-Specific Examples

### Korean Context (English → Korean):
```
TARGET LANGUAGE: Korean (한국어)
LANGUAGE CODE: ko-KR
VOICE PREFIX: ko-KR-Chirp3-HD-

SAMPLE VOCABULARY:
- Hello: 안녕하세요
- Thank you: 감사합니다
- I am: 저는 입니다
- Name: 이름
- Yes: 네
- No: 아니요

CULTURAL NOTES:
- Use formal endings (-입니다, -습니다)
- Honorifics important in Korean
- Politeness levels in greetings
```

### Mandarin Context (English → Mandarin):
```
TARGET LANGUAGE: Mandarin Chinese (中文)
LANGUAGE CODE: zh-CN
VOICE PREFIX: cmn-CN-Chirp3-HD-

SAMPLE VOCABULARY:
- Hello: 你好
- Thank you: 谢谢
- I am: 我是
- Name: 名字
- Yes: 是的
- No: 不是

CULTURAL NOTES:
- Tones are important in Mandarin
- Simplified characters used
- Politeness in greetings
```

### Spanish Context (English → Spanish):
```
TARGET LANGUAGE: Spanish (Español)
LANGUAGE CODE: es-ES
VOICE PREFIX: es-ES-Chirp3-HD-

SAMPLE VOCABULARY:
- Hello: Hola
- Thank you: Gracias
- I am: Soy
- Name: Nombre
- Yes: Sí
- No: No

CULTURAL NOTES:
- Gendered nouns in Spanish
- Formal vs. informal address
- Verb conjugations important
```

## Template 5: Context Validation Checklist

### For All Agents:
```
CONTEXT VALIDATION:
□ Read curriculum/index.md first
□ Identified correct target language
□ Confirmed language pair
□ Using correct voice configuration
□ All examples use appropriate language
□ No mixed language contexts
□ No assumed Mandarin default

QUALITY CHECKS:
□ Target language consistently used
□ Source language consistently English
□ Character roles properly assigned
□ Pronunciation rules followed
□ Cultural context appropriate
```

## Template 6: Error Prevention

### Common Mistakes to Avoid:
```
❌ FORBIDDEN ASSUMPTIONS:
- Assuming target is Mandarin Chinese
- Using Chinese examples for Korean lessons
- Mixing languages in examples
- Creating generic content without context
- Creating folders without reading curriculum index first
- Creating folders like 'korean/' at root level
- Guessing folder paths or names

✅ CORRECT APPROACH:
- Always read curriculum index first
- Extract exact target language from path
- Copy exact curriculum path from index
- Use language-specific examples
- Maintain context throughout session
- Validate language consistency
- Create folders only under specified curriculum path

ERROR RECOVERY:
If you realize you used wrong target language or created wrong folders:
1. Stop immediately
2. Re-read curriculum index
3. Identify correct target language and path
4. Remove any incorrectly created folders
5. Restart with correct context
6. Validate all content and paths before completion
```

### CRITICAL FOLDER CREATION RULES:
```
BEFORE CREATING ANY FOLDERS:
1. Read curriculum/index.md
2. Copy exact path: curriculum/{source}-to-{target}/
3. Create modules under: curriculum/{source}-to-{target}/modules/
4. NEVER create folders at project root
5. NEVER guess folder names

FORBIDDEN FOLDER CREATION:
❌ korean/
❌ mandarin/
❌ curriculum/korean/
❌ curriculum/mandarin/
❌ Any folder not in curriculum/{source}-to-{target}/ format

CORRECT FOLDER CREATION:
✅ curriculum/english-to-korean/
✅ curriculum/english-to-korean/modules/
✅ curriculum/english-to-korean/modules/01-Foundation/
```

## Template 7: Session Start Protocol

### Standard Opening for Any Agent:
```
SESSION INITIALIZATION:

1. Reading curriculum/index.md...
2. Identifying active curriculum...
3. Target language detected: [ACTUAL_TARGET_LANGUAGE]
4. Source language: English
5. Curriculum path: curriculum/english-to-[ACTUAL_TARGET_LANGUAGE]/
6. Context established and maintained.

I will now proceed with creating [content type] for English to [ACTUAL_TARGET_LANGUAGE] curriculum, ensuring all content uses the correct target language and follows MTM principles.
```

This system ensures agents never lose target language context and always create content for the correct language pair.