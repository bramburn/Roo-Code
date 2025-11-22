# Validation Checklist for Lesson JSON Files

Use this checklist to verify that lesson JSON files meet all technical and pedagogical requirements before deployment.

## Pre-Validation Checklist

Before running the automated validation script:

- [ ] **File Naming:** Lesson files named correctly (XX.json format)
- [ ] **File Location:** Lessons in correct module directory
- [ ] **File Count:** Module has 10-15 lessons as expected
- [ ] **JSON Syntax:** File opens in text editor without obvious errors
- [ ] **Encoding:** File saved as UTF-8

## Automated Validation Checklist

Run the validation script and verify:

- [ ] **JSON Syntax:** ✅ Valid JSON syntax
- [ ] **Voice Settings:** ✅ voiceSettings object present with correct values
- [ ] **Characters:** ✅ All characters use 'voice' field (not 'voiceId')
- [ ] **Dialogue Structure:** ✅ Using 'dialogue' array (not 'lines')
- [ ] **Dialogue Entries:** ✅ Using 'character' and 'text' fields
- [ ] **Pause Values:** ✅ pauseAfterMs values are integers
- [ ] **Line Numbers:** ✅ No 'line_number' fields present
- [ ] **Quotation Marks:** ✅ Chinese quotes properly escaped
- [ ] **Mnemonics:** ✅ Vocabulary items have mnemonic aids
- [ ] **Mandarin Content:** ✅ Contains both Chinese and English

## MTM Compliance Checklist

Manually verify MTM principles:

### Golden Rule (One New Concept at a Time)
- [ ] **Vocabulary Introduction:** Each lesson introduces vocabulary OR grammar, not both
- [ ] **Concept Isolation:** New concepts clearly separated from known concepts
- [ ] **Progressive Complexity:** Each lesson builds on previous knowledge
- [ ] **No Surprises:** Learners never encounter unexpected structures

### Language Separation (MTM-008)
- [ ] **TeacherEnglish Lines:** Contain ONLY English text
- [ ] **Teacher Lines:** Contain ONLY Mandarin Chinese text
- [ ] **No Mixed Languages:** No single line contains both languages
- [ ] **No Inline Tags:** No `[lang=...]` tags anywhere in text
- [ ] **No Parenthetical Translations:** No "(translation)" patterns
- [ ] **Proper Separation:** Translations split across character lines

### Psychological Setup
- [ ] **First Lesson:** Establishes teacher responsibility
- [ ] **Stress-Free Message:** Explicitly states no memorization required
- [ ] **Confidence Building:** Starts with familiar patterns (cognates)
- [ ] **Relaxed Tone:** Conversational, supportive language throughout

### Dialogue Quality
- [ ] **Character Consistency:** Characters speak consistently throughout
- [ ] **Natural Flow:** Dialogue sounds conversational, not robotic
- [ ] **Pause Placement:** Pauses allow time for learner response
- [ ] **Active Recall:** Includes "How would you say...?" prompts
- [ ] **Positive Reinforcement:** Acknowledges correct responses

### Vocabulary and Mnemonics
- [ ] **Just-in-Time Introduction:** Vocabulary introduced when needed
- [ ] **Mnemonic Quality:** Mnemonics are concise and memorable
- [ ] **Sound-Alike Bridges:** Mnemonics use English-Mandarin connections
- [ ] **Natural Integration:** Mnemonics flow naturally in dialogue
- [ ] **Consistent Format:** Mnemonics follow similar patterns

### Punctuation and Formatting
- [ ] **ASCII Punctuation:** Uses . , ! ? ; : (not Unicode variants)
- [ ] **Proper Escaping:** Quotes and special characters properly escaped
- [ ] **Consistent Spacing:** No extra spaces or formatting issues
- [ ] **Character Names:** Consistent spelling of character names
- [ ] **Text Clarity:** No typos or grammatical errors

### Timing and Pacing
- [ ] **Pause Duration:** Pauses are 1000-5000ms (reasonable for processing)
- [ ] **Lesson Length:** Lesson is appropriate length (5-10 minutes typical)
- [ ] **Pacing:** Content flows at natural, conversational pace
- [ ] **Thinking Time:** Adequate pauses for learner to think and respond
- [ ] **No Rushing:** Learner never feels rushed

## Content Verification Checklist

Verify the actual content quality:

- [ ] **Accuracy:** All Mandarin text is correct
- [ ] **Pronunciation:** Romanization (if included) is accurate
- [ ] **Grammar:** Grammar explanations are correct
- [ ] **Vocabulary:** Vocabulary is appropriate for level
- [ ] **Cultural Appropriateness:** Content is culturally appropriate
- [ ] **Relevance:** Content is relevant to learners' needs

## File Structure Checklist

Verify the JSON structure:

- [ ] **Root Fields:** title, description, level, target_language, instruction_language
- [ ] **voiceSettings:** rate, pitch, volume all present
- [ ] **characters:** Array with Teacher, TeacherEnglish, Student A, Student B, Listener
- [ ] **dialogue:** Array with character, text, pauseAfterMs fields
- [ ] **No Extra Fields:** No unexpected or deprecated fields
- [ ] **Proper Nesting:** All objects and arrays properly nested

## Final Approval Checklist

Before marking lesson as complete:

- [ ] **All Automated Checks:** ✅ Passed
- [ ] **All MTM Checks:** ✅ Verified
- [ ] **All Content Checks:** ✅ Verified
- [ ] **All Structure Checks:** ✅ Verified
- [ ] **Ready for Audio Generation:** ✅ Yes
- [ ] **Ready for Deployment:** ✅ Yes

## Sign-Off

- **Lesson File:** `________________`
- **Validated By:** `________________`
- **Date:** `________________`
- **Status:** ☐ Approved ☐ Needs Revision

## Notes

```
_________________________________________________________________

_________________________________________________________________

_________________________________________________________________
```

