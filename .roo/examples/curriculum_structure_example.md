# Example: Complete Curriculum Structure

This example shows the complete directory and file structure for an English-to-Mandarin curriculum.

## Directory Structure

```
curriculum/
└── english-to-mandarin/
    ├── readme.md                          # Main curriculum documentation
    └── modules/
        ├── 01-Foundation/
        │   ├── readme.md                  # Module documentation
        │   ├── 01.json                    # Lesson 1: Psychological Setup & Cognates
        │   ├── 02.json                    # Lesson 2: First Verb - "To Be"
        │   ├── 03.json                    # Lesson 3: Personal Pronouns
        │   ├── 04.json                    # Lesson 4: Common Greetings
        │   ├── 05.json                    # Lesson 5: Basic Courtesy
        │   ├── 06.json                    # Lesson 6: Numbers 1-10
        │   ├── 07.json                    # Lesson 7: Days of Week
        │   ├── 08.json                    # Lesson 8: Time Expressions
        │   ├── 09.json                    # Lesson 9: Foundation Review
        │   └── 10.json                    # Lesson 10: Foundation Consolidation
        │
        ├── 02-Questions/
        │   ├── readme.md
        │   ├── 01.json                    # Lesson 1: Question Formation
        │   ├── 02.json                    # Lesson 2: Yes/No Questions
        │   ├── 03.json                    # Lesson 3: Question Words
        │   ├── 04.json                    # Lesson 4: Asking About People
        │   ├── 05.json                    # Lesson 5: Asking About Things
        │   ├── 06.json                    # Lesson 6: Asking About Location
        │   ├── 07.json                    # Lesson 7: Asking About Time
        │   ├── 08.json                    # Lesson 8: Asking About Quantity
        │   ├── 09.json                    # Lesson 9: Questions Review
        │   └── 10.json                    # Lesson 10: Questions Consolidation
        │
        ├── 03-Negation/
        │   ├── readme.md
        │   ├── 01.json                    # Lesson 1: Negative Particle
        │   ├── 02.json                    # Lesson 2: Negating Verbs
        │   ├── 03.json                    # Lesson 3: Negating Nouns
        │   ├── 04.json                    # Lesson 4: Negating Adjectives
        │   ├── 05.json                    # Lesson 5: Negation Practice
        │   ├── 06.json                    # Lesson 6: Negation in Questions
        │   ├── 07.json                    # Lesson 7: Negation Variations
        │   ├── 08.json                    # Lesson 8: Complex Negation
        │   ├── 09.json                    # Lesson 9: Negation Review
        │   └── 10.json                    # Lesson 10: Negation Consolidation
        │
        └── 04-Pronouns/
            ├── readme.md
            ├── 01.json                    # Lesson 1: All Pronouns
            ├── 02.json                    # Lesson 2: Pronoun Variations
            ├── 03.json                    # Lesson 3: Possessive Pronouns
            ├── 04.json                    # Lesson 4: Reflexive Pronouns
            ├── 05.json                    # Lesson 5: Pronoun Practice
            ├── 06.json                    # Lesson 6: Pronoun in Context
            ├── 07.json                    # Lesson 7: Pronoun Combinations
            ├── 08.json                    # Lesson 8: Advanced Pronouns
            ├── 09.json                    # Lesson 9: Pronouns Review
            └── 10.json                    # Lesson 10: Pronouns Consolidation
```

## Key Naming Conventions

### Module Directories
- Format: `XX-<name>` where XX is two-digit number
- Examples: `01-Foundation`, `02-Questions`, `03-Negation`
- Lowercase names with hyphens between words

### Lesson Files
- Format: `XX.json` where XX is two-digit number
- Examples: `01.json`, `02.json`, `10.json`
- Approximately 10 lessons per module
- Sequential numbering within each module

### Documentation Files
- `readme.md` at curriculum root level
- `readme.md` in each module directory
- Markdown format with proper structure

## Curriculum Progression

This example shows a typical progression:
1. **Module 01 (Foundation):** Basic setup, cognates, pronouns, greetings
2. **Module 02 (Questions):** Question formation and responses
3. **Module 03 (Negation):** Negative structures
4. **Module 04 (Pronouns):** All pronoun forms and uses

Each module builds on previous ones, following the "Ladder of Success" principle.

## File Count Summary

- **Total Modules:** 4
- **Lessons per Module:** 10
- **Total Lessons:** 40
- **Documentation Files:** 5 (1 root + 4 module READMEs)
- **Total Files:** 45

This structure can be expanded with additional modules as needed.

