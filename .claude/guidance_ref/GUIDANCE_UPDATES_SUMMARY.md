# Guidance Files Updated - Summary

## Files Updated

### 1. LLM_lesson_guidance.md (MAJOR UPDATE)

**Key Changes:**

#### ✅ Added Critical Validation Section at Top
- Emphasizes that ALL lessons MUST pass .NET validation script
- Shows exact command to run: `dotnet run validate-script`
- Shows expected output: `✓ Script validation passed! No issues found.`

#### ✅ Updated Character Definitions
- Changed from "Teacher/TeacherEnglish/Student A/B" to "Instructor/Student 1/Student 2"
- Added explicit note: Character names must match EXACTLY
- Clarified for Mandarin-to-English lessons specifically

#### ✅ Rewrote Language Separation Section
- Clarified Mandarin-to-English lesson structure
- Instructor speaks ONLY English
- Student 1 & 2 speak ONLY Mandarin
- Updated examples to match actual lesson structure
- Emphasized ASCII punctuation requirement

#### ✅ Completely Rewrote Validation Section
- Replaced old "Automatic Validation Integration" with ".NET Validation Script (REQUIRED)"
- Added quick validation commands with examples
- Added comprehensive Validation Rules Reference table (MTM-001 through MTM-011)
- Added Quality Assurance Workflow (6-step process)
- Added Common Validation Errors and Fixes section with real examples

#### ✅ Added Practical Error Fixes
- MTM-008: Bilingual Dialogue Separation
- MTM-002/003: Missing Student Characters
- MTM-005: Pause Timing
- MTM-010: Inline Language Tags

### 2. MANDARIN_LESSON_QUICK_REFERENCE.md (NEW FILE)

**Purpose**: Quick reference guide for generating Mandarin-to-English lessons

**Contents:**
- Validation command (first thing!)
- Character setup (copy-paste ready)
- Dialogue pattern with CRITICAL RULES
- Pause timing guidelines
- Common validation errors table
- Validation commands
- Lesson structure template
- Pre-deployment checklist

## Key Improvements

### 1. Validation-First Approach
- Validation script is now mentioned FIRST in guidance
- Clear, actionable commands provided
- Expected output shown for both passing and failing cases

### 2. Mandarin-to-English Specific
- Guidance now reflects actual lesson structure (Instructor + Students)
- Character names match validator requirements exactly
- Examples use Mandarin-to-English pattern

### 3. Practical Error Fixes
- Real validation errors shown with solutions
- Before/after examples for common mistakes
- Specific pause timing recommendations

### 4. Comprehensive Validation Rules
- All 11 MTM rules documented in table format
- Severity levels (Error vs Warning vs Info)
- Clear descriptions of what each rule checks

### 5. Quality Assurance Workflow
- 6-step process from creation to deployment
- Clear checkpoints for validation
- Emphasis on fixing errors before proceeding

## How to Use These Guides

### For LLM Lesson Generation:
1. Read the CRITICAL section at the top
2. Follow the JSON Structure Requirements
3. Use the Character Definitions section
4. Follow the Dialogue Patterns section
5. Before finalizing, go to Validation and Quality Assurance section
6. Run the validation script
7. Fix any errors using Common Validation Errors and Fixes

### For Quick Reference:
1. Use MANDARIN_LESSON_QUICK_REFERENCE.md for fast lookup
2. Copy character setup from the file
3. Follow the dialogue pattern
4. Use pause timing guidelines
5. Check pre-deployment checklist

## Validation Commands Reference

```bash
# Single lesson validation
cd cli/MichelThomas.TtsGenerator
dotnet run validate-script ../../samples/hsk1_new/m13.json

# All lessons in directory
dotnet run validate-bilingual ../../samples/hsk1_new/

# With full output
dotnet run validate-script ../../samples/hsk1_new/m13.json 2>&1 | tail -50
```

## Expected Validation Output

**PASSING:**
```
✓ Script validation passed! No issues found.
```

**FAILING:**
```
✗ Script validation failed with X issues:
  • MTM-008: Bilingual Dialogue Separation: ...
  • MTM-005: Pause Timing: ...
```

## Next Steps

When generating new lessons:
1. Follow the guidance in LLM_lesson_guidance.md
2. Use MANDARIN_LESSON_QUICK_REFERENCE.md for quick lookups
3. ALWAYS run validation before considering lesson complete
4. Fix all errors (MTM-001 through MTM-010)
5. Address warnings (MTM-006, MTM-011) for quality
6. Verify: `✓ Script validation passed! No issues found.`

