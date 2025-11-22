# LLM Lesson Guidance for Michel Thomas Method Audio Lessons

## ⚠️ CRITICAL: Validation Script Requirement

**ALL lessons MUST pass the .NET validation script before deployment.**

```bash
cd cli/MichelThomas.TtsGenerator
dotnet run validate-script ../../samples/hsk1_new/m13.json
```

Expected output:
```
✓ Script validation passed! No issues found.
```

**If validation fails, fix all errors before proceeding.** See the [Validation and Quality Assurance](#validation-and-quality-assurance) section for common errors and fixes.

## Overview

This document provides comprehensive guidance for creating Michel Thomas Method (MTM) audio lessons using Large Language Models. It includes few-shot examples, instructions, guard rails, and methodologies based on successful lesson patterns.

**Key Focus**: Lessons must comply with the .NET validator's MTM rules (MTM-001 through MTM-011) to ensure proper audio generation and pedagogical quality.

## Core MTM Principles

### 1. Teacher Responsibility
- The teacher takes 100% responsibility for student learning
- Students should never feel pressure to memorize or "try hard"
- If a student doesn't understand, it's the teacher's fault, not theirs
- Create a stress-free, relaxed learning environment

### 2. One Concept at a Time
- **Golden Rule**: Never introduce new vocabulary AND new grammar together
- Build understanding through logical progression
- Each new element must be a logical extension of what's already known
- Use familiar building blocks to construct new knowledge

### 3. Learning Through Success
- Design lessons as a "ladder of successes"
- Avoid errors by design - if they occur, use them as teaching opportunities
- Build confidence through immediate, achievable wins
- Use guided self-correction rather than direct correction

## JSON Structure Requirements

### Required Fields
```json
{
  "title": "Mandarin to English: Lesson X",
  "description": "Brief description of lesson content and objectives",
  "level": "Beginner English",
  "target_language": "English",
  "instruction_language": "Chinese (Mandarin)",
  "voiceSettings": {
    "rate": 1,
    "pitch": 1,
    "volume": 1
  },
  "characters": [...],
  "dialogue": [...]
}
```

### Character Definitions

For **Mandarin to English lessons**, use these 4 characters:
1. **Instructor** - English speaker (Google Chirp3-HD-Erinome, en-US)
2. **Student 1** - Male learner (Google Chirp3-HD-Umbriel, cmn-CN)
3. **Student 2** - Female learner (Google Chirp3-HD-Leda, cmn-CN)
4. **Listener** - Represents pauses for the actual listener

**IMPORTANT**: Character names must match EXACTLY:
- ✅ "Student 1" and "Student 2" (NOT "Student A" or "Student B")
- ✅ "Instructor" for English instruction
- ✅ "Listener" for pauses (no text, only pauseAfterMs)

### CRITICAL RULE: Language Separation

**NEVER mix languages in a single dialogue line.** This is essential for proper TTS processing and clear audio generation.

#### For Mandarin-to-English Lessons:
1. **Instructor** speaks ONLY English (instruction and explanations)
2. **Student 1 & 2** speak ONLY Mandarin Chinese (practice and responses)
3. **NO mixed language in single lines** - split across characters
4. **Insert 500-1000ms pauses** between language switches using Listener
5. **Use proper punctuation** - ASCII only: `,` `.` `!` `?` (NOT `，` `。` `！` `？`)
6. **NO inline language tags** - split into separate dialogue lines instead

**INLINE LANGUAGE TAGS: Conditional Rule (MTM-010)**

**General Rule**: DO NOT use inline language tags like `[lang=fr-FR]text[/lang]` in dialogue text.

**EXCEPTION**: For Korean (`[lang=ko-KR]`) and Mandarin Chinese (`[lang=zh-CN]`, `[lang=cmn-CN]`), inline tags ARE REQUIRED in Instructor dialogue for proper audio segmentation. These tags are:
- ✅ Required for the LanguageSegmenterService to split bilingual lines
- ✅ Necessary for proper TTS processing of mixed-language content
- ✅ Automatically handled by the audio generation pipeline
- ✅ Will NOT trigger MTM-010 errors for Korean/Chinese

**For all other languages** (French, Spanish, German, etc.):
- ❌ Inline language tags are NOT supported
- ❌ Cause audio generation failures
- ❌ Produce broken, unnatural speech
- ❌ Will be flagged as critical errors by the validator (MTM-010)

**If you see `[lang=` tags for non-integrated languages, they MUST be split into separate lines immediately.**

#### Example of INCORRECT bilingual dialogue (FORBIDDEN):
```json
{
  "character": "Instructor",
  "text": "Father is baba. In Mandarin, we say 爸爸."
}
```

#### Example of INCORRECT inline language tags (ABSOLUTELY FORBIDDEN):
```json
{
  "character": "Instructor",
  "text": "Father is [lang=zh-CN]爸爸[/lang] (bàba)",
  "rate": 0.9
}
```

**This format is NEVER allowed. The validator will reject it with a critical error (MTM-010).**

#### Example of CORRECT split dialogue (Mandarin-to-English):
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
  },
  {
    "character": "Listener",
    "pauseAfterMs": 1500
  }
]
```

#### Punctuation Guidelines for TTS:
- Use standard ASCII punctuation: `,` `.` `!` `?`
- Avoid Unicode variants: `，` `。` `！` `？`
- This ensures proper TTS processing across all providers

### Common Bilingual Dialogue Patterns to Fix

When updating existing lessons, watch for these common patterns that need to be split:

**Pattern 1: English words embedded in Chinese explanations**
```json
// INCORRECT
{
  "character": "Teacher",
  "text": "现在我们学习'going to'这个结构。"
}

// CORRECT
[
  {"character": "Teacher", "text": "现在我们学习"},
  {"character": "Listener", "pauseAfterMs": 250},
  {"character": "TeacherEnglish", "text": "going to", "rate": 0.8},
  {"character": "Listener", "pauseAfterMs": 250},
  {"character": "Teacher", "text": "这个结构。"}
]
```

**Pattern 2: Example sentences in explanations**
```json
// INCORRECT
{
  "character": "Teacher",
  "text": "'我想要咖啡'是'I want coffee'。那么问句怎么说？"
}

// CORRECT
[
  {"character": "Teacher", "text": "'我想要咖啡'是"},
  {"character": "Listener", "pauseAfterMs": 250},
  {"character": "TeacherEnglish", "text": "I want coffee", "rate": 0.8},
  {"character": "Listener", "pauseAfterMs": 250},
  {"character": "Teacher", "text": "那么问句怎么说？"}
]
```

**Pattern 3: Grammar explanations with English terms**
```json
// INCORRECT
{
  "character": "Teacher",
  "text": "当我们用'does'时，'s'就跳到'does'上面。"
}

// CORRECT
[
  {"character": "Teacher", "text": "当我们用"},
  {"character": "Listener", "pauseAfterMs": 250},
  {"character": "TeacherEnglish", "text": "does", "rate": 0.8},
  {"character": "Listener", "pauseAfterMs": 250},
  {"character": "Teacher", "text": "时，'s'就跳到"},
  {"character": "Listener", "pauseAfterMs": 250},
  {"character": "TeacherEnglish", "text": "does", "rate": 0.8},
  {"character": "Listener", "pauseAfterMs": 250},
  {"character": "Teacher", "text": "上面。"}
]
```

## Lesson Structure Template

### 1. Opening (2-3 minutes)
- Welcome and psychological setup
- Remove pressure and establish teacher responsibility
- Brief review of previous concepts if applicable
- Introduce the lesson's single new concept

### 2. Bridge Building (3-5 minutes)
- Connect new concept to familiar knowledge
- Use cognates, loanwords, or logical extensions
- Provide memory aids and mnemonics
- Immediate practice with known vocabulary

### 3. Systematic Building (10-15 minutes)
- Introduce one element at a time
- Combine immediately with known elements
- Use the "pause and produce" technique
- Provide guided practice with increasing complexity

### 4. Integration and Review (5-8 minutes)
- Mix new concept with all previous learning
- Practice in varied contexts
- Build confidence through successful combinations
- Prepare for next lesson's foundation

## Mnemonic Integration

### Memory Aid Format
```json
"mnemonic": {
  "text": "Acoustic link + imagery connection + retrieval cue",
  "character": "Teacher"
}
```

### Transforming Mnemonics into Audio Dialogue

The mnemonic field in JSON is NOT directly processed by the TTS generator. To include mnemonics in your audio lessons, you MUST expand them into separate dialogue lines. This ensures they are spoken aloud at the right moment in the lesson flow.

#### Two-Step Transformation Process:

1. **Identify entries with mnemonics** in your source JSON
2. **Convert to separate dialogue lines** following the pattern below

#### Mnemonic Expansion Pattern:

**Original JSON with mnemonic:**
```json
{
  "character": "TeacherEnglish",
  "text": "office",
  "rate": 0.8,
  "mnemonic": {
    "text": "office (àofēisī) - 奥菲斯，奥菲斯的办公室",
    "character": "Teacher"
  }
}
```

**Expanded for audio generation:**
```json
[
  {
    "character": "TeacherEnglish",
    "text": "office",
    "rate": 0.8
  },
  {
    "character": "Listener",
    "pauseAfterMs": 500
  },
  {
    "character": "Teacher",
    "text": "office (àofēisī) - 奥菲斯，奥菲斯的办公室",
    "rate": 0.9
  },
  {
    "character": "Listener",
    "pauseAfterMs": 2000
  }
]
```

### Mnemonic Guidelines for Audio

#### 1. Timing and Placement
- **Immediate delivery**: Place mnemonic right after introducing the new word
- **Micro-pause**: 500ms between word and mnemonic for mental preparation
- **Processing pause**: 2000ms after mnemonic for retention
- **Slower rate**: Use `rate: 0.9` for mnemonic delivery (slower than normal speech)

#### 2. Voice Assignment
- **New vocabulary**: TeacherEnglish (native pronunciation)
- **Mnemonic explanation**: Teacher (in Mandarin, connects to Chinese sounds)
- **Rate variations**:
  - Vocabulary word: `rate: 0.8` (slower for learning)
  - Mnemonic: `rate: 0.9` (slightly slower for clarity)

#### 3. Content Structure
- **Sound bridge**: Chinese phonetic approximation in parentheses
- **Visual imagery**: Concrete, memorable image or story
- **Connection link**: Clear bridge between sound and meaning
- **Keep it brief**: Under 80 characters for optimal retention

### Mnemonic Templates and Examples

#### Template 1: Sound-Alike Bridge
```
English word (Chinese sound) - Visual story with connection
```

**Examples:**
- `office (àofēisī) - 奥菲斯，奥菲斯的办公室`
- `coffee (kāfēi) - 咖啡，咖啡的颜色像咖啡豆`
- `school (sīkùlǔ) - 思库鲁，思考库鲁的学校`

#### Template 2: Action-Based Memory
```
English word (action sound) - Action verb + location/context
```

**Examples:**
- `want (wàng) - 望，我望着想要的东西`
- `go (gōu) - 勾，勾手指表示要去`
- `see (sī) - 思，思考才能看见真相`

#### Template 3: Character Story
```
English word (character name) - Character + action + meaning
```

**Examples:**
- `and (àn) - 按，按按钮连接两个东西`
- `but (bātè) - 巴特，巴特但是不同意`
- `for (fó) - 佛，佛为了众生而存在`

### Advanced Mnemonic Techniques

#### 1. Multi-Sensory Association
- **Visual**: Create vivid mental images
- **Auditory**: Use similar-sounding Chinese words
- **Kinesthetic**: Include action or movement
- **Emotional**: Add feeling or emotion

#### 2. Progressive Elaboration
- **First pass**: Simple sound association
- **Second pass**: Add visual element
- **Third pass**: Create mini-story
- **Review**: Connect to previously learned words

#### 3. Spaced Retrieval Integration
- **Immediate recall**: Test right after mnemonic
- **Short-term**: Use in next practice sentence
- **Long-term**: Reference in later lessons

### Common Mnemonic Pitfalls to Avoid

1. **Too complex**: Keep it simple and memorable
2. **Cultural mismatch**: Ensure cultural references are appropriate
3. **Phonetic stretch**: Don't force sounds that don't match
4. **Abstract imagery**: Use concrete, visualizable concepts
5. **Too long**: Keep under 80 characters for retention

### Mnemonic Quality Checklist

For each mnemonic, verify:
- [ ] Sound similarity is clear and natural
- [ ] Visual imagery is vivid and memorable
- [ ] Connection to meaning is logical
- [ ] Length is under 80 characters
- [ ] Cultural reference is appropriate
- [ ] Follows one of the approved templates
- [ ] Includes proper timing in dialogue expansion

## Dialogue Patterns

### Question-Response Cycle
```json
[
  {
    "character": "Teacher",
    "text": "那么，你怎么说'I want coffee'？"
  },
  {
    "character": "Listener",
    "pauseAfterMs": 4000
  },
  {
    "character": "Student A",
    "text": "I want coffee."
  },
  {
    "character": "Listener",
    "pauseAfterMs": 2000
  },
  {
    "character": "Teacher",
    "text": "完美。"
  },
  {
    "character": "TeacherEnglish",
    "text": "I want coffee.",
    "rate": 0.9
  }
]
```

### Pause Timing Guidelines
- **Thinking pauses**: 4000-5000ms for new constructions
- **Quick recall**: 3000-4000ms for familiar patterns
- **Processing pauses**: 1000-2000ms between elements
- **Confirmation pauses**: 2000ms after student responses

## Grammar Introduction Methodology

### Step 1: Contextual Motivation
- Explain why the grammar point is useful
- Frame in terms of practical communication needs
- Compare to Chinese when helpful

### Step 2: Demystification
- Explain the concept simply and clearly
- Point out where English is simpler than expected
- Provide positive reinforcement

### Step 3: Pattern Recognition
- Show the core rule with clear examples
- Use building block analogies
- Provide memory hooks

### Step 4: Immediate Practice
- Apply the rule with known vocabulary
- Use guided participation
- Build from simple to complex

## Vocabulary Introduction Methodology

### Step 1: Contextual Framing
- Introduce in practical, usable contexts
- Explain relevance to daily communication
- Use familiar categories (food, drinks, etc.)

### Step 2: Sound Bridging
- Highlight cognates and loanwords
- Provide acoustic anchors using Chinese sounds
- Create memorable sound associations

### Step 3: Immediate Integration
- Use in simple sentence structures
- Combine with known grammar patterns
- Practice pronunciation with native speaker model

### Step 4: Recycling
- Use in multiple contexts immediately
- Combine with other known vocabulary
- Build complexity gradually

## Common Teaching Techniques

### The "Hot Potato" Rule
Used for explaining how grammatical elements move:
- "When we use 'does', the 's' jumps from the verb to 'does'"
- Visual metaphor helps students understand transformations
- Makes abstract grammar concrete and memorable

### Guided Self-Correction
- Never directly correct errors
- Guide students to discover the right answer
- Use questions like "Does that sound right?"
- Provide the correct model after self-correction

### Recycling Strategy
- Constantly revisit previous vocabulary and grammar
- Use old elements in new contexts
- Build complexity by layering, not replacing
- Ensure nothing is forgotten

## Guard Rails and Quality Checks

### Content Validation
- [ ] Only one new concept per lesson
- [ ] All new vocabulary has mnemonic aids
- [ ] Logical progression from previous lessons
- [ ] Adequate pause times for processing
- [ ] Mix of student voices for variety

### Technical Validation
- [ ] Valid JSON structure
- [ ] All required fields present
- [ ] Character names match exactly
- [ ] Pause timings are reasonable (1000-5000ms)
- [ ] Rate adjustments for clarity (0.8-1.0)

### MTM Methodology Validation
- [ ] Teacher takes responsibility for learning
- [ ] Stress-free environment maintained
- [ ] Building blocks approach used
- [ ] Immediate practice provided
- [ ] Success-oriented progression

## Few-Shot Examples

### Example 1: Introducing New Vocabulary with Mnemonic (Full Audio Sequence)

```json
[
  {
    "character": "Teacher",
    "text": "现在，我们来学第一个可以添加的词。很多语言会互相借词，这就像一座桥梁。在中文里，你说咖啡，在英语中，就是..."
  },
  {
    "character": "Listener",
    "pauseAfterMs": 1500
  },
  {
    "character": "TeacherEnglish",
    "text": "coffee",
    "rate": 0.8
  },
  {
    "character": "Listener",
    "pauseAfterMs": 500
  },
  {
    "character": "Teacher",
    "text": "coffee (kāfēi) - 咖啡，咖啡的颜色像咖啡豆",
    "rate": 0.9
  },
  {
    "character": "Listener",
    "pauseAfterMs": 2000
  },
  {
    "character": "Teacher",
    "text": "现在我们练习。'我想喝咖啡'怎么说？"
  },
  {
    "character": "Listener",
    "pauseAfterMs": 4000
  },
  {
    "character": "Student A",
    "text": "I want coffee."
  }
]
```

### Example 2: Multiple Vocabulary with Mnemonics

```json
[
  {
    "character": "Teacher",
    "text": "很好！现在让我们学习两个新的地点词汇。首先是'这里'，英语中是..."
  },
  {
    "character": "Listener",
    "pauseAfterMs": 1500
  },
  {
    "character": "TeacherEnglish",
    "text": "here",
    "rate": 0.8
  },
  {
    "character": "Listener",
    "pauseAfterMs": 500
  },
  {
    "character": "Teacher",
    "text": "here (hī'ěr) - 嗨尔，嗨，你在这里！",
    "rate": 0.9
  },
  {
    "character": "Listener",
    "pauseAfterMs": 2000
  },
  {
    "character": "Teacher",
    "text": "'那里'是..."
  },
  {
    "character": "Listener",
    "pauseAfterMs": 1500
  },
  {
    "character": "TeacherEnglish",
    "text": "there",
    "rate": 0.8
  },
  {
    "character": "Listener",
    "pauseAfterMs": 500
  },
  {
    "character": "Teacher",
    "text": "there (dēi'ěr) - 得尔，得到尔朵在那里",
    "rate": 0.9
  },
  {
    "character": "Listener",
    "pauseAfterMs": 2000
  }
]
```

### Example 3: Introducing Grammar Pattern with Visual Metaphor

```json
[
  {
    "character": "Teacher",
    "text": "现在，这里有一个非常重要的规则，我称之为'热土豆规则'。当我们用'does'提问时，动词上的's'就像热土豆一样跳到'does'上面。"
  },
  {
    "character": "TeacherEnglish",
    "text": "does",
    "rate": 0.8
  },
  {
    "character": "Listener",
    "pauseAfterMs": 500
  },
  {
    "character": "Teacher",
    "text": "does (dázī) - 达子，达到目标时用的达子",
    "rate": 0.9
  },
  {
    "character": "Listener",
    "pauseAfterMs": 2000
  },
  {
    "character": "Teacher",
    "text": "看，'she wants'变成了'she wants'，但问句时's'跳到'does'上，变成'does she want'。"
  }
]
```

### Example 4: Complete Teaching Sequence with Mnemonics

```json
[
  {
    "character": "Teacher",
    "text": "今天我们要学习如何表达'想要'。在英语中，我们用..."
  },
  {
    "character": "Listener",
    "pauseAfterMs": 1500
  },
  {
    "character": "TeacherEnglish",
    "text": "want",
    "rate": 0.8
  },
  {
    "character": "Listener",
    "pauseAfterMs": 500
  },
  {
    "character": "Teacher",
    "text": "want (wàng) - 望，我望着想要的东西",
    "rate": 0.9
  },
  {
    "character": "Listener",
    "pauseAfterMs": 2000
  },
  {
    "character": "Teacher",
    "text": "现在我们学习连接词'和'，英语中是..."
  },
  {
    "character": "Listener",
    "pauseAfterMs": 1500
  },
  {
    "character": "TeacherEnglish",
    "text": "and",
    "rate": 0.8
  },
  {
    "character": "Listener",
    "pauseAfterMs": 500
  },
  {
    "character": "Teacher",
    "text": "and (àn) - 按，按按钮连接两个东西，and就是连接词",
    "rate": 0.9
  },
  {
    "character": "Listener",
    "pauseAfterMs": 2000
  },
  {
    "character": "Teacher",
    "text": "现在你可以组合：'I want coffee and tea'。试试看！"
  },
  {
    "character": "Listener",
    "pauseAfterMs": 4000
  },
  {
    "character": "Student B",
    "text": "I want coffee and tea."
  },
  {
    "character": "Teacher",
    "text": "完美！你看到了吗？用want连接两个东西，就像按按钮一样简单。"
  }
]
```

### Example 5: Guided Practice Sequence with Mnemonic Reinforcement

```json
[
  {
    "character": "Teacher",
    "text": "那么，你怎么构建这个句子：'I want coffee'？记住coffee的发音..."
  },
  {
    "character": "Listener",
    "pauseAfterMs": 5000
  },
  {
    "character": "Student B",
    "text": "I want coffee."
  },
  {
    "character": "Teacher",
    "text": "很好！咖啡coffee，记住咖啡豆的颜色，kāfēi，coffee。"
  },
  {
    "character": "Listener",
    "pauseAfterMs": 2000
  },
  {
    "character": "TeacherEnglish",
    "text": "coffee",
    "rate": 0.9
  },
  {
    "character": "Teacher",
    "text": "完美。你刚刚完成了你的第一个完整的英语句子。"
  }
]
```

## Lesson Progression Guidelines

### Lessons 1-3: Foundation Building
- Focus on cognates and basic sentence structure
- Introduce "I want" + familiar vocabulary
- Build confidence with immediate success

### Lessons 4-6: System Expansion
- Add pronouns (you, he, she)
- Introduce helper verbs (do, does)
- Practice questions and negatives

### Lessons 7-8: System Completion
- Complete all persons and forms
- Master the "hot potato" rule
- Integrate all patterns naturally

### Lessons 9-10: Time Dimension
- Introduce past tense with -ed pattern
- Add "did" as universal past helper
- Practice mixing present and past

## Success Metrics

A successful MTM lesson should result in:
- Students speaking without hesitation
- Natural self-correction when something "sounds wrong"
- Confidence in building new sentence combinations
- Eagerness to learn more rather than feeling overwhelmed
- Ability to use new concepts in multiple contexts immediately

## Advanced Techniques

### Building Complexity Gradually
- Start with single words, move to phrases, then full sentences
- Use substitution exercises: "I want coffee" → "I want tea" → "You want tea"
- Layer new elements onto solid foundations
- Never skip logical steps in progression

### Creating Natural Dialogue Flow
- Use realistic conversation scenarios
- Mix statement, question, and response patterns
- Include natural hesitations and thinking time
- Model real student learning pace

### Error Prevention Strategies
- Anticipate common mistakes and address them preemptively
- Use positive framing: "The good news is..." instead of "Don't..."
- Provide multiple examples before asking for production
- Use guided discovery rather than direct instruction

## Troubleshooting Common Issues

### If Students Struggle with Pronunciation
- Slow down the native speaker model (rate: 0.7-0.8)
- Break words into syllables
- Use more Chinese sound associations
- Provide additional practice opportunities

### If Concepts Feel Too Abstract
- Use more concrete examples and scenarios
- Add visual metaphors and analogies
- Increase the number of practice repetitions
- Simplify the explanation further

### If Pacing Feels Too Fast
- Increase pause times by 1000-2000ms
- Add more intermediate steps
- Include additional review cycles
- Use more recycling of previous concepts

## Quality Assurance Checklist

### Pre-Production Review
- [ ] Lesson follows single-concept rule
- [ ] All mnemonics are culturally appropriate and memorable
- [ ] Progression is logical and builds on previous lessons
- [ ] Pause times allow for genuine thinking
- [ ] Student responses are realistic and achievable

### Post-Production Review
- [ ] Audio flows naturally without jarring transitions
- [ ] Student voices show appropriate learning progression
- [ ] Teacher maintains encouraging, supportive tone
- [ ] Native speaker provides clear pronunciation models
- [ ] Overall lesson achieves stated learning objectives

## Adaptation Guidelines

### For Different Language Pairs
- Adjust mnemonic strategies to source language sounds
- Modify cultural references appropriately
- Consider different grammatical starting points
- Adapt metaphors to cultural context

### For Different Proficiency Levels
- **Absolute Beginners**: More cognates, slower pace, shorter lessons
- **False Beginners**: Faster progression, more complex combinations
- **Intermediate**: Focus on nuanced usage and natural expression

## Final Notes

Remember: The Michel Thomas Method is about understanding, not memorization. Every element should feel logical and inevitable to the student. If something feels forced or arbitrary, reconsider the approach. The goal is natural, confident communication, not perfect grammar recitation.

The success of an MTM lesson is measured not by how much content is covered, but by how confident and capable students feel at the end. A student who can confidently use three new words in multiple contexts has learned more than one who has been exposed to twenty words but can't use any of them naturally.

Always prioritize understanding over coverage, confidence over perfection, and natural communication over grammatical accuracy. The MTM approach trusts that accuracy will emerge naturally from understanding and practice.

## Validation and Quality Assurance

### .NET Validation Script (REQUIRED)

**All lessons MUST be validated using the .NET validate script before deployment.** This is the authoritative validation tool for MTM lessons.

#### Quick Validation Commands

```bash
# Navigate to CLI directory
cd cli/MichelThomas.TtsGenerator

# Validate a single lesson
dotnet run validate-script ../../samples/hsk1_new/m13.json

# Validate all lessons in a directory
dotnet run validate-bilingual ../../samples/hsk1_new/

# Validate with full output
dotnet run validate-script ../../samples/hsk1_new/m13.json 2>&1 | tail -50
```

#### Example Validation Output (PASSING):
```
[13:32:22 INF] Parsing script file: ../../samples/hsk1_new/m13.json
[13:32:22 INF] Fixed 25 Unicode punctuation characters for TTS compatibility
[13:32:22 INF] Successfully parsed script: Mandarin to English: Lesson 13 - Days of the Week with 5 characters and 47 lines
[13:32:22 INF] Validating script with 47 lines
[13:32:22 INF] Validation complete. Found 0 errors
✓ Script validation passed! No issues found.
```

#### Example Validation Output (FAILING):
```
[13:32:22 INF] Validation complete. Found 10 errors
✗ Script validation failed with 10 issues:
  • MTM-008: Bilingual Dialogue Separation: Teacher character contains quoted English phrases: ['my mother']. These should be spoken by TeacherEnglish character.
  • MTM-010: Mnemonic Suggestion: Found 3 single-word vocabulary items that could benefit from mnemonics.
  • MTM-011: Vocabulary Timing: Vocabulary word 'father' may need more processing time.
```

### Validation Rules Reference

| Rule | Name | Severity | Description |
|------|------|----------|-------------|
| **MTM-001** | Script Structure | Error | Valid JSON with required fields (title, description, level, characters, dialogue) |
| **MTM-002** | Student 1 Usage | Error | Must include "Student 1" character in dialogue |
| **MTM-003** | Student 2 Usage | Error | Must include "Student 2" character in dialogue |
| **MTM-004** | Character Configuration | Error | All characters must have valid voice settings |
| **MTM-005** | Pause Timing | Error | Pause durations must be 1000-10000ms (reasonable thinking time) |
| **MTM-006** | Line Length | Warning | Dialogue lines should be appropriate length (not too long) |
| **MTM-007** | Rate Settings | Error | Speech rate must be between 0.5-2.0 |
| **MTM-008** | Bilingual Separation | Error | **CRITICAL** - No mixed languages in single lines. Instructor speaks English only, Students speak Mandarin only |
| **MTM-009** | Unicode Punctuation | Info | Use ASCII punctuation (`,` `.` `!` `?`) not Unicode (`，` `。` `！` `？`) - auto-fixed |
| **MTM-010** | Inline Language Tags | Error | **CONDITIONAL** - `[lang=ko-KR]` and `[lang=zh-CN]` tags REQUIRED for Korean/Chinese in Instructor dialogue. All other language tags FORBIDDEN. |
| **MTM-011** | Vocabulary Timing | Warning | New vocabulary should have adequate pause time (1000ms+) for processing |

### Quality Assurance Workflow

**Before finalizing any lesson:**

1. ✅ **Create the lesson** following the structure and patterns in this document
2. ✅ **Run validation** using: `dotnet run validate-script <lesson-file.json>`
3. ✅ **Fix all errors** (MTM-001 through MTM-010) - these block deployment
4. ✅ **Address warnings** (MTM-006, MTM-011) - these improve quality
5. ✅ **Verify output** shows: `✓ Script validation passed! No issues found.`
6. ✅ **Test audio** for natural flow and pronunciation

### Common Validation Errors and Fixes

**Error: MTM-008 - Bilingual Dialogue Separation**
```
Problem: Instructor character contains English and Mandarin in same line
❌ "Father is baba. In Mandarin, we say 爸爸."

Solution: Split into separate lines
✅ Instructor: "Father is baba."
✅ Listener: pause 1000ms
✅ Student 1: "爸爸。"
```

**Error: MTM-002/MTM-003 - Missing Student Characters**
```
Problem: Dialogue only uses Instructor, never uses Student 1 or Student 2
Solution: Add practice lines where students repeat or respond
✅ Include at least one line for Student 1
✅ Include at least one line for Student 2
```

**Error: MTM-005 - Pause Timing**
```
Problem: Pause is too short (e.g., 500ms) for complex question
Solution: Increase pause duration based on complexity
✅ Simple recall: 2000-3000ms
✅ Complex questions: 4000-5000ms
✅ Pattern explanation: 4000ms
```

**Error: MTM-010 - Inline Language Tags (Conditional Rule)**
```
IMPORTANT: MTM-010 is conditional based on language:

✅ ALLOWED for Korean and Mandarin Chinese in Instructor dialogue:
✅ "The word for hello is [lang=ko-KR]annyeonghaseyo[/lang]."
✅ "The word for water is [lang=zh-CN]水[/lang]."

❌ FORBIDDEN for all other languages:
❌ "The word for hello is [lang=fr-FR]Bonjour[/lang]."
❌ "The word for hello is [lang=es-ES]Hola[/lang]."

Solution for non-integrated languages: Remove tags and split into separate lines
✅ Instructor: "The word for hello is..."
✅ Student 1: "Bonjour."
```
