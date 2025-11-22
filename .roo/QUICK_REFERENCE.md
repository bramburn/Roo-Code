# Quick Reference Guide - MTM Curriculum Agents

## Three Agents at a Glance

| Agent | Slug | Purpose | When to Use |
|-------|------|---------|------------|
| **MTM Orchestrator** | `mtm-orchestrator` | Coordinate curriculum creation | Creating/modifying entire curriculum |
| **Curriculum Builder** | `curriculum-builder` | Create structure & docs | Creating directories and README files |
| **MTM Lesson Creator** | `mtm-lesson-creator` | Generate lesson JSON | Creating individual lesson files |

## Common Commands

### Create a New Curriculum
```
Use: MTM Orchestrator
Ask: "Create an English-to-Mandarin curriculum with 4 modules: 
Foundation, Questions, Negation, Pronouns. 
Each module should have 10-15 lessons."
```

### Create Module Structure Only
```
Use: Curriculum Builder
Ask: "Create the directory structure for curriculum/english-to-mandarin 
with modules 01-Foundation through 04-Pronouns, 
including README files for each."
```

### Create Lessons for a Module
```
Use: MTM Lesson Creator
Ask: "Create 10 lesson JSON files for Module 01-Foundation 
(lessons 01.json through 10.json) following MTM principles."
```

### Validate Lessons
```
Run: python validate_json_files.py
Check: All files pass validation
Review: .roo/validation/validation_checklist.md
```

## Critical Rules (MUST Remember)

### 1. Golden Rule (MTM-001)
❌ **NEVER:** Introduce new vocabulary AND new grammar in same step
✅ **DO:** Introduce vocabulary OR grammar, one at a time

### 2. Language Separation (MTM-008)
❌ **NEVER:** Mix English and Mandarin in single dialogue line
✅ **DO:** Split across character lines (TeacherEnglish + Teacher)

### 3. No Inline Tags (MTM-010)
❌ **NEVER:** Use `[lang=zh-CN]text[/lang]` tags
✅ **DO:** Use character separation instead

### 4. Teacher Responsibility
❌ **NEVER:** Suggest student should memorize or try hard
✅ **DO:** Establish teacher takes 100% responsibility

### 5. Stress-Free Environment
❌ **NEVER:** Include homework, pressure, or memorization
✅ **DO:** Emphasize relaxed, conversational learning

## File Structure Template

```
curriculum/
└── {language-pair}/
    ├── readme.md
    └── modules/
        ├── 01-{Module Name}/
        │   ├── readme.md
        │   ├── 01.json
        │   ├── 02.json
        │   └── ... (10-15 lessons)
        ├── 02-{Module Name}/
        │   └── ... (similar structure)
        └── ... (more modules)
```

## Naming Conventions

| Item | Format | Example |
|------|--------|---------|
| Curriculum | `curriculum/{language-pair}/` | `curriculum/english-to-mandarin/` |
| Module | `XX-<name>` | `01-Foundation` |
| Lesson | `XX.json` | `01.json`, `10.json` |
| README | `readme.md` | At curriculum and module levels |

## JSON Structure Essentials

```json
{
  "title": "Lesson title",
  "description": "Brief description",
  "level": "HSK 1",
  "target_language": "Chinese (Mandarin)",
  "instruction_language": "English",
  "voiceSettings": {
    "rate": 1,
    "pitch": 1,
    "volume": 1
  },
  "characters": [
    { "name": "Teacher", "voice": "cmn-CN-Chirp3-HD-Erinome" },
    { "name": "TeacherEnglish", "voice": "en-US-Chirp3-HD-Erinome" },
    { "name": "Student A", "voice": "cmn-CN-Chirp3-HD-Erinome" },
    { "name": "Listener" }
  ],
  "dialogue": [
    { "character": "TeacherEnglish", "text": "English text" },
    { "character": "Teacher", "text": "中文文本" },
    { "character": "Listener", "pauseAfterMs": 3000 }
  ]
}
```

## Character Rules

| Character | Language | Purpose |
|-----------|----------|---------|
| **Teacher** | Mandarin ONLY | Target language content |
| **TeacherEnglish** | English ONLY | Instructions and explanations |
| **Student A** | Mandarin ONLY | Demonstrates responses |
| **Student B** | Mandarin ONLY | Demonstrates responses |
| **Listener** | N/A | Represents learner (pauses only) |

## Pause Timing Guidelines

| Type | Duration | Use Case |
|------|----------|----------|
| Quick recall | 3000-4000ms | Familiar patterns |
| Thinking pause | 4000-5000ms | New constructions |
| Processing | 1000-2000ms | Between elements |
| Confirmation | 2000ms | After responses |

## Validation Checklist (Quick)

- [ ] Valid JSON syntax
- [ ] voiceSettings present (rate, pitch, volume = 1)
- [ ] Characters use 'voice' field (not 'voiceId')
- [ ] Using 'dialogue' array (not 'lines')
- [ ] Using 'character' and 'text' fields
- [ ] pauseAfterMs values are integers
- [ ] No 'line_number' fields
- [ ] No inline language tags
- [ ] No mixed languages in single line
- [ ] ASCII punctuation (not Unicode)

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| `"pauseAfterMs": "2000"` | Change to `"pauseAfterMs": 2000` |
| `"voiceId": "..."` | Change to `"voice": "..."` |
| `"lines": [...]` | Change to `"dialogue": [...]` |
| `"speaker": "..."` | Change to `"character": "..."` |
| `"dialogue": "text"` | Change to `"text": "text"` |
| `你好 (hello)` | Split: Teacher says 你好, TeacherEnglish says hello |
| `[lang=zh-CN]你好[/lang]` | Remove tags, use character separation |

## Documentation Files

| File | Purpose |
|------|---------|
| `.roo/README.md` | Main documentation |
| `.roo/SETUP_SUMMARY.md` | What was created |
| `.roo/QUICK_REFERENCE.md` | This file |
| `.roo/rules-*/` | Agent-specific rules |
| `.roo/examples/` | Few-shot examples |
| `.roo/validation/` | Validation guidance |

## Getting Help

1. **Orchestration Issues:** See `rules-mtm-orchestrator/orchestration_checklist.md`
2. **Structure Issues:** See `rules-curriculum-builder/structure_and_documentation.md`
3. **Lesson Issues:** See `rules-mtm-lesson-creator/mtm_compliance_critical.md`
4. **Language Separation:** See `rules-mtm-lesson-creator/dialogue_separation_rules.md`
5. **Validation Issues:** See `validation/validation_guide.md`
6. **Examples:** See `examples/` directory

## Workflow Summary

```
1. Ask MTM Orchestrator to create curriculum
   ↓
2. Orchestrator delegates to Curriculum Builder
   ↓
3. Curriculum Builder creates structure and docs
   ↓
4. Orchestrator delegates to MTM Lesson Creator
   ↓
5. Lesson Creator generates lesson JSON files
   ↓
6. Run validation script
   ↓
7. Fix any issues
   ↓
8. Generate audio from validated lessons
```

## Key Resources

- **Main Config:** `.roomodes` (at repository root)
- **Rules:** `.roo/rules-{agent-slug}/`
- **Examples:** `.roo/examples/`
- **Validation:** `.roo/validation/`
- **Validation Script:** `validate_json_files.py` (at repository root)

