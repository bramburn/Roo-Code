# MTM Lesson Creator - Few-Shot Prompts Guide

## Purpose
This guide provides concrete examples and templates for creating MTM-compliant lessons with proper pronunciation handling and character usage.

## Critical Few-Shot Examples

### Example 1: Proper Vocabulary Introduction (Korean - "Hello")
```json
{
  "character": "TeacherEnglish",
  "text": "Now that you've seen how similar some words can be, let's learn a very common and useful phrase: 'hello'."
},
{
  "character": "Listener",
  "pauseAfterMs": 2000
},
{
  "character": "TeacherEnglish",
  "text": "In Korean, the formal way to say hello is..."
},
{
  "character": "Listener",
  "pauseAfterMs": 500
},
{
  "character": "Teacher",
  "text": "안녕하세요",
  "rate": 0.9
},
{
  "character": "Listener",
  "pauseAfterMs": 2000
},
{
  "character": "TeacherEnglish",
  "text": "Let's break that down so you can hear each part clearly."
},
{
  "character": "Listener",
  "pauseAfterMs": 1000
},
{
  "character": "Teacher",
  "text": "안녕",
  "rate": 0.9
},
{
  "character": "Listener",
  "pauseAfterMs": 800
},
{
  "character": "Teacher",
  "text": "하세요",
  "rate": 0.9
}
```

### Example 2: Two-Part Vocabulary (Korean - "I am")
```json
{
  "character": "TeacherEnglish",
  "text": "Let's practice each part. First, the word for 'I' is..."
},
{
  "character": "Listener",
  "pauseAfterMs": 500
},
{
  "character": "Teacher",
  "text": "저는",
  "rate": 0.9
},
{
  "character": "Listener",
  "pauseAfterMs": 1500
},
{
  "character": "TeacherEnglish",
  "text": "And the formal verb 'to be' is..."
},
{
  "character": "Listener",
  "pauseAfterMs": 500
},
{
  "character": "Teacher",
  "text": "입니다",
  "rate": 0.9
},
{
  "character": "Listener",
  "pauseAfterMs": 1500
},
{
  "character": "TeacherEnglish",
  "text": "Together, to say 'I am', you would say..."
},
{
  "character": "Listener",
  "pauseAfterMs": 500
},
{
  "character": "Teacher",
  "text": "저는 입니다",
  "rate": 0.9
}
```

### Example 3: Student Response Pattern
```json
{
  "character": "TeacherEnglish",
  "text": "Perfect! Now you try to say 'hello' in Korean."
},
{
  "character": "Listener",
  "pauseAfterMs": 3000
},
{
  "character": "Student A",
  "text": "안녕하세요"
},
{
  "character": "Listener",
  "pauseAfterMs": 2000
},
{
  "character": "TeacherEnglish",
  "text": "Excellent! You've got it exactly right."
}
```

## Dialogue Flow Templates

### Template A: Basic Vocabulary Introduction
```json
[
  {"character": "TeacherEnglish", "text": "Today we're learning how to say [concept] in [language]."},
  {"character": "Listener", "pauseAfterMs": 2000},
  {"character": "TeacherEnglish", "text": "The word for [concept] is..."},
  {"character": "Listener", "pauseAfterMs": 500},
  {"character": "Teacher", "text": "[target word]", "rate": 0.9},
  {"character": "Listener", "pauseAfterMs": 1500},
  {"character": "TeacherEnglish", "text": "Let's practice that. How would you say [concept]?"},
  {"character": "Listener", "pauseAfterMs": 4000},
  {"character": "Student A", "text": "[target word]"},
  {"character": "Listener", "pauseAfterMs": 2000},
  {"character": "TeacherEnglish", "text": "Perfect! You're doing great."}
]
```

### Template B: Complex Phrase Breakdown
```json
[
  {"character": "TeacherEnglish", "text": "Now let's learn a longer phrase: [English translation]."},
  {"character": "Listener", "pauseAfterMs": 2000},
  {"character": "TeacherEnglish", "text": "In [language], this is..."},
  {"character": "Listener", "pauseAfterMs": 500},
  {"character": "Teacher", "text": "[full phrase]", "rate": 0.9},
  {"character": "Listener", "pauseAfterMs": 2000},
  {"character": "TeacherEnglish", "text": "Let's break it down into parts."},
  {"character": "Listener", "pauseAfterMs": 1000},
  {"character": "Teacher", "text": "[part 1]", "rate": 0.9},
  {"character": "Listener", "pauseAfterMs": 800},
  {"character": "Teacher", "text": "[part 2]", "rate": 0.9},
  {"character": "Listener", "pauseAfterMs": 1500},
  {"character": "TeacherEnglish", "text": "Now you try saying the whole phrase."},
  {"character": "Listener", "pauseAfterMs": 5000},
  {"character": "Student B", "text": "[full phrase]"}
]
```

### Template C: Question and Answer Pattern
```json
[
  {"character": "TeacherEnglish", "text": "Now let's learn how to ask questions. How would you ask '[question]'?"},
  {"character": "Listener", "pauseAfterMs": 5000},
  {"character": "Student A", "text": "[question in target language]"},
  {"character": "Listener", "pauseAfterMs": 2000},
  {"character": "TeacherEnglish", "text": "Excellent! And how would you answer '[answer]'?"},
  {"character": "Listener", "pauseAfterMs": 5000},
  {"character": "Student B", "text": "[answer in target language]"},
  {"character": "Listener", "pauseAfterMs": 2000},
  {"character": "TeacherEnglish", "text": "Perfect! You're having real conversations now."}
]
```

## Pronunciation Rules - Do's and Don'ts

### ✅ DO:
- Use micro pauses (500ms) before target language pronunciation
- Use processing pauses (1000-1500ms) after pronunciation
- Set rate to 0.9 for pronunciation clarity
- Let Teacher (Native Speaker) handle ALL target language pronunciation
- Break down complex words into syllables when helpful

### ❌ DON'T:
- Never have TeacherEnglish say target language words
- Never use phonetic spellings like "sounds like kah-peh"
- Never mix languages in one dialogue line
- Never skip the micro pause structure
- Never have TeacherEnglish provide pronunciation hints

## Character Voice Consistency

### Always Use These Voices:
- **TeacherEnglish**: `en-US-Chirp3-HD-Erinome`
- **Teacher**: `[language-code]-Chirp3-HD-Erinome` (e.g., `ko-KR-Chirp3-HD-Erinome`)
- **Student A**: `[language-code]-Chirp3-HD-Umbriel` (male)
- **Student B**: `[language-code]-Chirp3-HD-Leda` (female)

### Rate Settings:
- **Normal speech**: rate 1.0 (default)
- **Pronunciation emphasis**: rate 0.9
- **Very slow breakdown**: rate 0.8

## Pause Timing Guidelines

### Micro Pauses (Before Pronunciation):
- **Standard**: 500ms
- **Complex setup**: 800ms

### Processing Pauses (After Pronunciation):
- **Single word**: 1000-1500ms
- **Short phrase**: 1500-2000ms
- **Complex phrase**: 2000-3000ms

### Thinking Pauses (For Student Response):
- **Simple recall**: 3000-4000ms
- **Complex construction**: 5000-6000ms
- **Very complex**: 7000-8000ms

### Confirmation Pauses:
- **After student response**: 2000ms
- **Between teaching points**: 1000-2000ms

## Lesson Structure Template

### Opening (Psychological Setup):
```json
[
  {"character": "TeacherEnglish", "text": "Welcome back! You're making excellent progress."},
  {"character": "Listener", "pauseAfterMs": 3000},
  {"character": "TeacherEnglish", "text": "Remember, my job is to make sure you learn without effort. Your only job is to relax and respond."},
  {"character": "Listener", "pauseAfterMs": 4000},
  {"character": "TeacherEnglish", "text": "Today we're going to learn [new concept]. This builds perfectly on what you already know."}
]
```

### Main Content (3-5 vocabulary items):
- Each vocabulary item follows the 3-part pronunciation structure
- Mix of Teacher explanations and Teacher pronunciations
- Student practice opportunities after each item

### Closing (Confidence Building):
```json
[
  {"character": "TeacherEnglish", "text": "Look at what you've accomplished today! You can now [ability]."},
  {"character": "Listener", "pauseAfterMs": 3000},
  {"character": "TeacherEnglish", "text": "This confidence comes from understanding, not from trying hard. You're not memorizing - you're learning how the language works."},
  {"character": "Listener", "pauseAfterMs": 3000}
]
```

Remember: **Clear language separation + Authentic pronunciation = Successful MTM lessons**