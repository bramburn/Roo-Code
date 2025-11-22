# MTM Design Workflow and Delegation Strategy

## Core MTM Design Mandate

### 1. Goal Definition
The curriculum's primary objective is to give the learner a **complete and functional understanding of the grammatical structure** of the language (e.g., Mandarin), not to teach thousands of words. The student should possess the "toolkit" to construct their own sentences.

### 2. Reverse Engineering (MUST)
All content planning (module breakdown) **MUST** begin by reverse-engineering highly useful target sentences into their smallest logical parts:
- Start with complex, useful target sentences (e.g., "I want to go to the restaurant")
- Deconstruct into smallest logical parts (pronouns, verbs, particles, prepositions)
- Reconstruct step-by-step through modules and lessons

### 3. The Golden Rule (CRITICAL)
**NEVER introduce a new vocabulary word and a new grammar rule in the same step.**
- When outlining modules and delegating lesson creation, ensure **One New Concept at a Time**
- The curriculum structure must enforce this at the module level
- Each lesson must introduce either vocabulary OR grammar, not both

### 4. Logical Sequencing - Ladder of Success
Modules must follow a systematic flow building a "ladder of successes":
- **Phase 1 (Foundation):** Psychological setup, establishing the bridge (cognates/familiarity), introducing first building blocks (e.g., "I" and a high-frequency verb)
- **Phase 2 (Expansion):** Introducing questions, simple answers, and negation
- **Phase 3 (Toolkit):** Adding conjunctions, prepositions, tenses, and consolidation exercises

### 5. Module Progression Template
Typical module structure for English → Mandarin:

**Foundation Course (Modules 1-10):**
1. **01-Foundation:** Psychological setup, cognates, "I am", basic greetings
2. **02-Questions:** Question formation, "Do you...?", basic responses
3. **03-Negation:** Negative particles, "I don't...", "You don't..."
4. **04-Pronouns:** All pronouns (I, you, he, she, we, they)
5. **05-Verbs:** Common action verbs, verb conjugation patterns
6. **06-Objects:** Direct objects, "I want X", "I see X"
7. **07-Time:** Past tense, future tense, time expressions
8. **08-Adjectives:** Descriptive adjectives, comparatives
9. **09-Prepositions:** Location, direction, time prepositions
10. **10-Consolidation:** Integration of all concepts, complex sentences

### 6. Curriculum Expansion Beyond Foundation (Modules 11+)
The curriculum framework supports expansion to reach vocabulary targets of 5,000-6,000 words through additional Stages and Modules:

**Expansion Strategy:**
- **Modules 11-15 (Stage 2 Advanced):** Scenario-based application modules focusing on real-world contexts (Travel, Business, Healthcare, Social Interactions)
- **Modules 16-20 (Stage 3 Mastery):** Complex grammatical structures and specialized vocabulary within scenario contexts
- **Modules 21+ (Stage 4 Specialization):** Domain-specific content (professional, academic, cultural)

**Scenario-Based Module Design:**
- Each scenario module must be reverse-engineered from complex, high-utility target sentences relevant to that scenario
- Modules are named by scenario (e.g., `11-Travel_Scenarios`, `12-Business_Communication`)
- Content within each module strictly adheres to the Golden Rule: vocabulary and grammar are introduced Just-in-Time within the scenario context
- All new vocabulary must be layered with previously taught vocabulary and grammar structures to reinforce learning

## Delegation Strategy

### 1. Use `new_task` for Subtasks (MUST)
The creation or update of any physical file (Markdown structure or Lesson JSON) **MUST** be delegated using the `new_task` tool to the relevant specialist mode:
- `curriculum-builder` for directory and documentation creation
- `mtm-lesson-creator` for lesson JSON generation

### 2. Instruction Completeness (MUST)
For every subtask initiated using `new_task`, the `message` parameter **MUST** include:
- All necessary context from the parent task or previous subtasks
- A clearly defined scope specifying exactly what the subtask must accomplish
- An explicit instruction that the subtask should only perform the work outlined

### 3. Subtask Completion (MUST)
Every subtask initiated **MUST** be instructed to signal its definitive completion using the **`attempt_completion` tool**, providing a concise and thorough summary of the work done in the `result` parameter.

### 4. Slash Commands for Scenario-Based Workflows (NEW)
For creating scenario-based modules (Modules 11+), use the structured slash command workflows:
- **`/create-scenario-module`**: Executes a rigid workflow for planning and delegating scenario-based module creation, ensuring proper reverse-engineering, vocabulary layering, and Golden Rule compliance
- **`/reference-module-context`**: Retrieves stored curriculum documentation to access previously taught vocabulary and grammar, enabling proper layering and recycling of content

These commands externalize complex logic into reusable templates, allowing the Orchestrator to focus on coordination while ensuring consistent adherence to MTM principles.

## Curriculum Memory and Sequencing System

### 1. Curriculum Index Reading (CRITICAL - FIRST STEP)
Before ANY curriculum work:
1. **READ** `curriculum/index.md` to understand current progress
2. **IDENTIFY** the correct curriculum directory (e.g., `curriculum/english-to-korean/`)
3. **DETERMINE** the next module to work on (highest numbered incomplete module)
4. **FOLLOW** strict numerical sequencing (01 → 02 → 03, never skip)

### 2. Module Sequencing Rules (ABSOLUTELY CRITICAL)
- **FOUNDATION MODULES (01-10) MUST BE COMPLETED FIRST** before any advanced modules (11+)
- **NEVER SKIP MODULES** - always work in numerical order
- **COMPLETE ALL LESSONS** in a module before moving to the next
- **UPDATE THE INDEX** after each module completion

### 3. Curriculum Location Memory
The orchestrator **MUST**:
- **ALWAYS** reference `curriculum/index.md` for the correct base path
- **NEVER** assume curriculum locations - read from the index
- **MAINTAIN** consistent folder structure: `curriculum/[source]-to-[target]/modules/`
- **UPDATE** the index file with progress after each module

### 4. Progress Tracking Workflow
When starting work:
1. Read `curriculum/index.md`
2. Identify "Next Module to Create" field
3. Work on that specific module
4. Update the index when complete

When completing a module:
1. Update module status to "✅ Complete"
2. Update lesson count
3. Update "Next Module to Create" field
4. Update "Last Updated" date

## Handling Edits/Updates

When editing an existing curriculum:
1. **READ `curriculum/index.md` FIRST** to understand current state
2. Use `read_file` to review the master `readme.md` and relevant module `README.md` files
3. Identify the point in the structural progression that needs modification
4. Determine if changes affect downstream modules (Golden Rule compliance)
5. Delegate appropriate subtasks to `curriculum-builder` or `mtm-lesson-creator`
6. **UPDATE `curriculum/index.md`** with any changes to progress
7. Ensure all changes maintain MTM compliance across the entire curriculum

