# MTM Compliance - Critical Rules and Guardrails

## IMPORTANT: Curriculum Memory System

**BEFORE STARTING ANY LESSON CREATION:**
1. **ALWAYS READ** `curriculum/index.md` FIRST to understand current progress
2. **IDENTIFY** the correct module to work on from the "Next Module to Create" field
3. **NEVER SKIP MODULES** - always work in numerical order (01 → 02 → 03)
4. **USE CORRECT CURRICULUM PATH** from the index (e.g., `curriculum/english-to-korean/`)
5. **CRITICAL**: IDENTIFY TARGET LANGUAGE - NEVER assume it's Mandarin Chinese
6. **EXTRACT** exact target language from curriculum path and maintain context
7. **READ FEW-SHOT GUIDE**: Review `few_shot_prompts_guide.md` for proper examples
8. **READ CONTEXT TEMPLATES**: Review `agent_context_templates.md` for language-specific guidance

This prevents the orchestrator from skipping modules and losing track of progress, AND ensures correct target language context.

## I. Core MTM Philosophical Guardrails

### 1. Teacher Responsibility (MUST)
The content must explicitly reflect that the **Instructor is 100% Responsible** for the student's learning and remembering. The learner's only job is to relax and respond.
- Opening dialogue MUST establish this responsibility
- If errors occur in dialogue, teacher must treat it as their fault
- Tone must be supportive and stress-free

### 2. Eliminate Tension (MUST)
The lesson structure must **eliminate all sources of tension**:
- **NO memorization** - explicitly state this
- **NO rote learning** - avoid repetition without context
- **NO note-taking** - students should listen actively
- **NO homework** - all learning happens in the lesson
- Tone must be conversational and relaxed

### 3. Build with Understanding (MUST)
All material must be presented for **understanding, not memorization**:
- Every new piece of information must be a **logical extension** of what the student already knows
- Explain the "why" behind grammar rules
- Connect new concepts to familiar patterns
- Use analogies and comparisons

### 4. Learning Through Success (MUST)
The lesson must be engineered as a **"ladder of successes"**:
- Errors are avoided by design
- If a mistake occurs, it is the teacher's fault
- Use errors as tools for **guided self-correction**
- Build confidence through successful practice

## II. The Golden Rule (CRITICAL)

### Single Concept Rule (ABSOLUTELY CRITICAL)
**NEVER introduce a new vocabulary word and a new grammatical concept in the same step.**

- If teaching a new verb conjugation, use only known vocabulary
- If introducing new vocabulary, use only known grammar structures
- Each dialogue sequence should focus on ONE new element
- Clearly separate vocabulary introduction from grammar practice

## III. Lesson Content and Sequencing Rules

### 1. Vocabulary Introduction (MUST)
Vocabulary is **never taught in lists**:
- New words must be introduced **"Just-in-Time"** within relevant, practical context
- Context must be required to practice the grammatical structure being taught
- Introduce words only when needed for immediate practice
- Never present vocabulary in isolation

### 2. Mnemonic Integration (MUST)
For every non-cognate new vocabulary word, the instructor dialogue must include a **simple mnemonic or memory aid**:
- Mnemonics must be **concise and brief** (under 80-100 characters)
- Use **sound-alike bridges** from English to Mandarin
- Anchor pronunciation and meaning together
- Integrate mnemonics naturally into dialogue flow

### 3. The Bridge (MUST for Lesson 01)
The opening content of Lesson 1 in Module 1 **must** focus on "The Bridge":
- Connect learner's language to target language using cognates
- Use borrowed words or similar-sounding words
- Immediately build confidence with familiar patterns
- Establish that the languages are not completely foreign to each other

### 4. Active Recall - Pause and Produce (MUST)
The dialogue must frequently prompt the listener to **pause and attempt to form the sentence out loud**:
- Use "How would you say...?" prompts
- Provide adequate pause time (3000-5000ms)
- Allow listener to produce before hearing the response
- Reinforce successful production with positive feedback

### 5. Layering and Recycling (MUST)
Previously learned material must be **continuously woven** into new constructions:
- Use old elements in new contexts
- Build complexity gradually
- Reinforce mastery through varied practice
- Create natural, conversational flow

### 6. CRITICAL TARGET LANGUAGE CONTEXT RULE (ABSOLUTELY FORBIDDEN TO VIOLATE)
**NEVER ASSUME TARGET LANGUAGE - ALWAYS IDENTIFY FROM CURRICULUM INDEX**

When creating any lesson content:
- **READ `curriculum/index.md` FIRST** to identify the exact target language
- **EXTRACT** the target language from the curriculum path (e.g., `english-to-korean`)
- **MAINTAIN** this context throughout the entire lesson creation process
- **FORBIDDEN**: Assuming target language is Mandarin Chinese
- **FORBIDDEN**: Using examples from wrong language
- **FORBIDDEN**: Creating generic content without language specificity

#### Target Language Identification Process:
1. Read curriculum index → Find active curriculum
2. Extract from path → `curriculum/{source}-to-{target}/`
3. Confirm target language → Korean, Mandarin, Spanish, etc.
4. Use appropriate examples → Words from correct target language
5. Configure voices correctly → `[target-code]-Chirp3-HD-*`

#### Context Maintenance Examples:
- **Korean Curriculum**: Use 안녕하세요, 감사합니다, configure ko-KR voices
- **Mandarin Curriculum**: Use 你好, 谢谢, configure cmn-CN voices
- **Spanish Curriculum**: Use Hola, Gracias, configure es-ES voices

### 7. CRITICAL PRONUNCIATION RULE (ABSOLUTELY FORBIDDEN TO VIOLATE)
**Instructor MUST NEVER pronounce target language words or sentences.**

When introducing new vocabulary or pronunciation:
- **TeacherEnglish MUST ONLY** provide English explanations and context
- **Teacher (Native Speaker) MUST ALWAYS** pronounce the target language
- **FORBIDDEN**: TeacherEnglish saying "It's 'ka-pe'" or any target language pronunciation
- **REQUIRED**: Use the 3-part pronunciation structure with micro pauses:

#### Correct 3-Part Pronunciation Structure:
```json
{
  "character": "TeacherEnglish",
  "text": "The Korean word for coffee sounds like..."
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

#### FORBIDDEN Structure (NEVER USE):
```json
{
  "character": "TeacherEnglish",
  "text": "It's 'ka-pe'. Can you hear the similarity?"
}
```

#### FEW-SHOT EXAMPLE: Complete Lesson Opening
```json
{
  "character": "TeacherEnglish",
  "text": "Welcome back! You're making excellent progress."
},
{
  "character": "Listener",
  "pauseAfterMs": 3000
},
{
  "character": "TeacherEnglish",
  "text": "Today we're going to learn how to say 'hello' in Korean."
},
{
  "character": "Listener",
  "pauseAfterMs": 2000
},
{
  "character": "TeacherEnglish",
  "text": "The Korean word for hello is..."
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
  "text": "Now you try saying hello in Korean."
},
{
  "character": "Listener",
  "pauseAfterMs": 4000
},
{
  "character": "Student A",
  "text": "안녕하세요"
}
```

### 7. Just-in-Time Vocabulary for Curriculum Expansion (CRITICAL for 5,000+ Word Targets)
When creating scenario-based modules (Modules 11+) or expanding the curriculum to reach 5,000-6,000 word targets:
- **NEVER introduce vocabulary lists** - this violates the core MTM principle
- **ONLY introduce new vocabulary when required to practice a grammatical structure** the student has already mastered
- Each new word must be introduced within a meaningful, practical context that necessitates its use
- Vocabulary scaling is achieved through **breadth of contexts**, not through memorization lists
- Example: Instead of teaching 50 new words in a "Shopping" module, introduce 5-10 new words across 10 lessons, each word appearing in multiple contexts (asking for items, describing quantities, negotiating prices, etc.)
- This approach maintains the Golden Rule while enabling large-scale vocabulary growth

## IV. Technical JSON and Dialogue Formatting Rules

### 1. Required Character Roles (MUST)
The lesson script must utilize these character roles:
- **Teacher** - Speaks target language (Korean, Mandarin, Spanish, etc. - identified from curriculum index)
- **TeacherEnglish** - Speaks English (instruction language)
- **Student A** - Demonstrates responses in target language
- **Student B** - Demonstrates responses in target language
- **Listener** - Represents the learner (for pauses only)

**CRITICAL**: Target language MUST be identified from `curriculum/index.md` - NEVER assume Mandarin Chinese

### 2. CRITICAL RULE: Language Separation (MTM-008) (ABSOLUTELY FORBIDDEN TO VIOLATE)
**DO NOT mix languages within a single dialogue line.**
- **TeacherEnglish** must speak **ONLY** English
- The **Teacher** must speak **ONLY** the target language (Korean, Mandarin, Spanish, etc.)
- **NEVER** include English words in target language dialogue
- **NEVER** include target language words in English dialogue
- Split bilingual sentences across different character lines

**CRITICAL**: Target language must be identified from curriculum index before creating content

### 3. ABSOLUTELY FORBIDDEN: Inline Language Tags (MTM-010) (CRITICAL ERROR)
**NEVER use inline language tags** such as `[lang=zh-CN]text[/lang]` anywhere in dialogue text.
- This is a **CRITICAL ERROR** that causes audio generation failures
- Will be rejected by the validator
- Use character separation instead of tags
- No exceptions to this rule

### 4. Punctuation (MUST)
- Use **standard ASCII punctuation**: `. , ! ? ; :`
- **AVOID Unicode variants**: `， 。 ！ ？ ； ：`
- Ensure reliable TTS processing
- Consistent punctuation across all dialogue

### 5. Pause Timing (MUST)
Pauses (`pauseAfterMs`) must be set to reasonable durations:
- **Thinking pauses for new constructions:** 4000-5000ms
- **Quick recall for familiar patterns:** 3000-4000ms
- **Processing pauses between elements:** 1000-2000ms
- **Confirmation pauses after responses:** 2000ms
- All values must be integers (milliseconds)

## V. Pre-Completion Validation Checklist (CRITICAL)

Before signaling completion of any lesson:

### Automated Validation (MANDATORY - MUST RUN):
```bash
cd cli/MichelThomas.TtsGenerator

# Comprehensive validation
dotnet run validate-script ../../path/to/lesson.json

# Bilingual dialogue check
dotnet run validate-bilingual ../../path/to/lesson.json
```

**MUST PASS** all validation checks before proceeding.

### Context Validation (MANDATORY):
- [ ] **Read curriculum/index.md** and identified correct target language
- [ ] **Target language confirmed** (Korean, Mandarin, Spanish, etc.)
- [ ] **All examples use correct target language** vocabulary
- [ ] **No Chinese/Mandarin content** unless that's the actual target
- [ ] **Voice configuration matches** target language codes
- [ ] **Character roles use** correct target language

### MTM Compliance Validation:
- [ ] **Golden Rule followed**: Only one new concept per lesson
- [ ] **Pronunciation rules followed**: TeacherEnglish never pronounces target language
- [ ] **Language separation maintained**: No mixed languages in dialogue lines
- [ ] **Character roles correct**: Teacher uses target language, TeacherEnglish uses English
- [ ] **Psychological setup included**: Teacher responsibility established

### Technical Validation:
- [ ] **JSON syntax valid**: No parsing errors
- [ ] **All required fields present**: title, description, characters, dialogue
- [ ] **Character references correct**: All dialogue characters exist in character array
- [ ] **Pause times reasonable**: Integer values, appropriate durations
- [ ] **Punctuation correct**: ASCII punctuation used throughout

### Target Language Specific Validation:
- [ ] **Vocabulary appropriate**: Words from identified target language
- [ ] **Cultural context suitable**: Examples appropriate for target culture
- [ ] **Voice IDs correct**: Proper language codes used ([target-code]-Chirp3-HD-*)
- [ ] **Language consistency**: Same target language used throughout

**FORBIDDEN TO COMPLETE IF ANY VALIDATION FAILS**

