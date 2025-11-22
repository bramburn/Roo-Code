# Curriculum Structure and Documentation Rules

## ⚠️ CRITICAL: Curriculum Path and Structure Rules

**VIOLATING THESE RULES WILL CREATE BROKEN CURRICULUM STRUCTURE**

### 1. Read Curriculum Index First (ABSOLUTELY MANDATORY - NO EXCEPTIONS)
- **ALWAYS READ** `curriculum/index.md` BEFORE creating ANY folders or files
- **EXTRACT** the exact curriculum path from the index
- **USE ONLY** the path specified in the index
- **NEVER CREATE** folders outside the specified curriculum path

### 2. Curriculum Path Structure (CRITICAL - FOLLOW EXACTLY)
- **BASE PATH**: `curriculum/` (NEVER create at root level)
- **FORMAT**: `curriculum/{source}-to-{target}/` (e.g., `curriculum/english-to-korean/`)
- **MODULES PATH**: `curriculum/{source}-to-{target}/modules/`
- **FORBIDDEN**: Creating folders like `korean/` or `mandarin/` at root level

### 3. Path Extraction Process (MANDATORY STEPS)
1. **READ** `curriculum/index.md`
2. **FIND** the target curriculum section
3. **COPY** the exact path from the "Path" field
4. **USE** that exact path for ALL folder creation
5. **VERIFY** path format: `curriculum/english-to-korean/`

### 4. FORBIDDEN Folder Creation (NEVER DO THESE):
- ❌ NEVER create `korean/` folder at project root
- ❌ NEVER create `mandarin/` folder at project root
- ❌ NEVER create folders outside `curriculum/` directory
- ❌ NEVER guess folder names or paths
- ❌ NEVER create folders without reading index first

### 5. CORRECT Folder Creation Examples:
- ✅ `curriculum/english-to-korean/modules/01-Foundation/`
- ✅ `curriculum/english-to-mandarin/modules/02-Questions/`
- ✅ `curriculum/english-to-spanish/modules/03-Negation/`
- ❌ `korean/modules/01-Foundation/` (WRONG - missing curriculum/ prefix)
- ❌ `curriculum/korean/` (WRONG - wrong format)
- ❌ `korean/` (WRONG - completely wrong location)

## ⚠️ CRITICAL: Target Language Context Awareness

**BEFORE ANY CURRICULUM WORK - YOU MUST MAINTAIN TARGET LANGUAGE CONTEXT**

### 2. Target Language Identification Process
1. **Read curriculum index** to find active curriculum
2. **Extract from path**: `curriculum/{source}-to-{target}/`
3. **Confirm language pair** from the curriculum details
4. **Use ONLY the identified target language** in all content

### 3. Forbidden Assumptions (NEVER DO THESE)
- ❌ NEVER assume target language is Mandarin/Chinese
- ❌ NEVER use Chinese examples unless explicitly specified
- ❌ NEVER create content for wrong language pair
- ❌ NEVER mix language contexts in the same curriculum

### 4. Context Maintenance (CRITICAL)
- **EVERY document** you create must reference the correct target language
- **EVERY example** must use the identified target language
- **EVERY module name** must reflect the correct language pair
- **EVERY description** must mention the specific languages

### 5. Examples for Different Languages

#### If creating English to Korean curriculum:
- **Title**: "English to Korean - Michel Thomas Method"
- **Target Language**: Korean (한국어)
- **Examples**: Use Korean words like "안녕하세요", "감사합니다"
- **File path**: `curriculum/english-to-korean/`

#### If creating English to Mandarin curriculum:
- **Title**: "English to Mandarin Chinese - Michel Thomas Method"
- **Target Language**: Mandarin Chinese (中文)
- **Examples**: Use Mandarin words like "你好", "谢谢"
- **File path**: `curriculum/english-to-mandarin/`

#### If creating English to Spanish curriculum:
- **Title**: "English to Spanish - Michel Thomas Method"
- **Target Language**: Spanish (Español)
- **Examples**: Use Spanish words like "hola", "gracias"
- **File path**: `curriculum/english-to-spanish/`

## Directory Naming Conventions

### 1. Curriculum Root Directory (MUST)
- Format: `curriculum/{language-pair}/` (e.g., `curriculum/english-to-mandarin/`)
- Use lowercase with hyphens for multi-word language pairs
- Create a `modules/` subdirectory within the curriculum root

### 2. Module Directory Naming (MUST)
- Format: `XX-<name of module>` where XX is a two-digit number (e.g., `01-Foundation`, `02-Questions`)
- Use leading zeros for single-digit numbers
- Use hyphens to separate number from name
- Use descriptive, concise module names (1-3 words)
- Module names should reflect the primary concept or grammar point

### 3. Lesson File Naming (MUST)
- Format: `XX.json` where XX is a two-digit number (e.g., `01.json`, `10.json`, `15.json`)
- Use leading zeros for single-digit numbers
- Approximately 10-15 lessons per module
- Files should be numbered sequentially within each module

## Curriculum README.md Content (MUST)

The main `curriculum/{language-pair}/readme.md` file **MUST** include:

### Required Sections:
1. **Title:** Curriculum name (e.g., "English to [Target Language] - Michel Thomas Method")
2. **Overview:** 2-3 sentence description of the curriculum goals
3. **MTM Philosophy:** Section detailing:
   - Teacher Responsibility: "The teacher takes 100% responsibility for student learning"
   - Understanding Over Memorization: "Focus on understanding, not rote learning"
   - Stress-Free Environment: "No memorization, no homework, no pressure"
   - Ladder of Success: "Building blocks progress logically"
4. **Target Audience:** Who this curriculum is for
5. **Learning Objectives:** What students will be able to do
6. **Curriculum Structure:** Overview of modules and their progression
7. **Module List:** Table with module numbers, names, and brief descriptions
8. **Time Commitment:** Estimated hours per module
9. **Prerequisites:** Any prior knowledge required

### Title Template (CRITICAL - USE CORRECT LANGUAGE):
- **Format**: "English to [ACTUAL_TARGET_LANGUAGE] - Michel Thomas Method"
- **Examples**:
  - ✅ "English to Korean - Michel Thomas Method"
  - ✅ "English to Mandarin Chinese - Michel Thomas Method"
  - ✅ "English to Spanish - Michel Thomas Method"
  - ❌ "English to [LANGUAGE] - Michel Thomas Method" (replace placeholder)

## Module README.md Content (MUST)

Each module's `README.md` file **MUST** include:

### Required Sections:
1. **Module Title:** (e.g., "Module 01: Foundation")
2. **Module Overview:** 2-3 sentences describing the module's focus
3. **Learning Objectives:** 3-5 bullet points of what students will learn
4. **Key Concepts:** Grammar points and vocabulary themes
5. **Lesson Table:** Table with columns:
   - Lesson # (01, 02, etc.)
   - Lesson Title/Focus
   - Key Grammar Point
   - Key Vocabulary
   - Estimated Duration
6. **MTM Approach:** How this module applies MTM principles
7. **Prerequisites:** What students should know before this module
8. **Next Steps:** What comes after this module

### Lesson Table Format (MUST):
```markdown
| Lesson | Focus | Grammar Point | Key Vocabulary | Duration |
|--------|-------|---------------|----------------|----------|
| 01 | Psychological Setup & Cognates | Sentence structure | Cognates, greetings | 5 min |
| 02 | First Verb | Present tense "to be" | Common verbs | 8 min |
```

## File Creation Rules (MUST)

1. **Use write_to_file Tool:** All file and directory creation MUST use the `write_to_file` tool
2. **Recursive Directory Creation:** The tool automatically creates parent directories
3. **Encoding:** All files MUST be UTF-8 encoded
4. **Line Endings:** Use Unix-style line endings (LF, not CRLF)
5. **Markdown Formatting:** Follow standard Markdown conventions with proper heading hierarchy

## Validation Before Completion

Before signaling completion via `attempt_completion`:

- [ ] **CRITICAL**: Target language correctly identified from curriculum index
- [ ] **CRITICAL**: All content uses correct target language (not assumed Mandarin)
- [ ] **CRITICAL**: All titles use actual target language name
- [ ] **CRITICAL**: All examples use appropriate target language words
- [ ] All directories created with correct naming
- [ ] All README files contain required sections
- [ ] Markdown formatting is valid and readable
- [ ] File paths match the specified curriculum structure
- [ ] No typos or formatting errors in documentation
- [ ] Module progression is logical and clear

### Target Language Validation Checklist:
- [ ] Read `curriculum/index.md` and identified correct language pair
- [ ] All titles reflect the actual target language (not placeholders)
- [ ] All examples use words from the correct target language
- [ ] No Chinese/Mandarin content unless that's the actual target
- [ ] Language pair is consistent throughout all documents

### Path Structure Validation (CRITICAL):
- [ ] **READ curriculum/index.md FIRST** before creating any folders
- [ ] **USED EXACT PATH** from index (e.g., `curriculum/english-to-korean/`)
- [ ] **NO FOLDERS CREATED** outside curriculum/ directory
- [ ] **CORRECT FORMAT** used: `curriculum/{source}-to-{target}/`
- [ ] **NO WRONG FOLDERS** like `korean/` or `mandarin/` at root level
- [ ] **ALL MODULES** created under correct curriculum path

### FORBIDDEN PATTERNS CHECK:
- [ ] No folders created at project root (like `korean/`)
- [ ] No folders created without reading index first
- [ ] No guessing of paths or folder names
- [ ] All paths follow the exact format from index

## Curriculum Validation with .NET CLI

After creating curriculum modules and lessons, validate them using the .NET CLI:

### Validate Individual Lesson
```bash
cd cli/MichelThomas.TtsGenerator
dotnet run validate-script ../../curriculum/[lang]/modules/[module]/[lesson].json
```

### Validate Entire Module
```bash
dotnet run validate-bilingual ../../curriculum/[lang]/modules/[module]/
```

### Validate Entire Curriculum
```bash
dotnet run validate-bilingual ../../curriculum/[lang]/modules/
```

**Always validate curriculum before marking as complete.**

