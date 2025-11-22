# Orchestration Checklist and Completion Tracking

## Pre-Delegation Checklist

Before delegating any subtask, verify:

- [ ] **Curriculum Index Read:** **READ `curriculum/index.md` FIRST** - this is CRITICAL and MANDATORY
- [ ] **Current Progress Understood:** Next module to create identified from index
- [ ] **Curriculum Location Confirmed:** Correct directory path from index (e.g., `curriculum/english-to-korean/`)
- [ ] **Path Structure Validated:** Uses exact format `curriculum/{source}-to-{target}/`
- [ ] **No Wrong Folders:** No folders created outside curriculum directory (like `korean/`)
- [ ] **Sequencing Rules Followed:** Working in numerical order (01 → 02 → 03), not skipping modules
- [ ] **Curriculum Goal Defined:** Clear understanding of source language → target language (e.g., English → Mandarin)
- [ ] **Target Audience Identified:** Proficiency level, learning objectives, time commitment
- [ ] **Reverse Engineering Complete:** High-utility target sentences identified and deconstructed
- [ ] **Module Breakdown Planned:** 8-10 modules identified with clear progression (or expanded modules for 5,000+ word targets)
- [ ] **Golden Rule Verified:** Each module introduces either vocabulary OR grammar, not both
- [ ] **Ladder of Success Mapped:** Logical progression from Foundation → Expansion → Toolkit
- [ ] **Existing Curriculum Reviewed:** If editing, current structure understood and impact assessed

### Additional Checklist for Scenario-Based Modules (Modules 11+)

⚠️ **IMPORTANT**: Foundation modules (01-10) MUST be completed before working on scenario-based modules (11+)

- [ ] **Foundation Modules Complete:** Modules 01-10 are marked "✅ Complete" in curriculum index
- [ ] **Scenario Focus Defined:** Clear real-world context for the module (e.g., Travel, Business, Healthcare)
- [ ] **Key Sentences Identified:** 3-5 complex, high-utility target sentences for reverse-engineering
- [ ] **Vocabulary Layering Plan:** Strategy for recycling previously taught vocabulary within new scenario context
- [ ] **New Concept Identified:** Single new grammatical concept or vocabulary set for the module
- [ ] **Slash Command Ready:** `/create-scenario-module` parameters prepared (module name, scenario focus, key sentences)

## Subtask Delegation Checklist

For each `new_task` call:

- [ ] **Mode Specified:** Correct mode slug (curriculum-builder or mtm-lesson-creator)
- [ ] **Scope Clearly Defined:** Exact deliverables specified (e.g., "Create modules 01-Foundation through 03-Negation")
- [ ] **Context Provided:** All necessary information from parent task included
- [ ] **MTM Constraints Restated:** Relevant MTM rules included in the message
- [ ] **Curriculum Path Enforced:** Exact path from index provided to subtask
- [ ] **Folder Structure Rules Included:** Explicit instructions about correct folder creation
- [ ] **Completion Signal Requested:** Message explicitly requests `attempt_completion` with result summary
- [ ] **File Paths Specified:** Exact directory and file paths provided
- [ ] **Examples Provided:** Few-shot examples included when helpful

## Subtask Completion Verification

When a subtask completes via `attempt_completion`:

- [ ] **Result Summary Reviewed:** Outcome clearly described
- [ ] **Deliverables Verified:** All requested files/directories created
- [ ] **MTM Compliance Checked:** Content adheres to MTM principles
- [ ] **No Deviations:** Subtask stayed within defined scope
- [ ] **Quality Acceptable:** Output meets standards before proceeding

## Module Completion Checklist

When a module is completed:

- [ ] **All Lessons Created:** Required number of lessons generated (8-12 lessons)
- [ ] **Validation Passed:** Run .NET CLI validation commands:
  ```bash
  cd cli/MichelThomas.TtsGenerator
  dotnet run validate-script ../../curriculum/[lang]/modules/[module]/[lesson].json
  dotnet run validate-bilingual ../../curriculum/[lang]/modules/[module]/
  ```
- [ ] **JSON Validation Passed:** All lesson files validate correctly
- [ ] **MTM Compliance Verified:** All lessons follow MTM principles
- [ ] **README Updated:** Module documentation complete
- [ ] **Curriculum Index Updated:** **CRITICAL** - Update `curriculum/index.md` with:
  - Module status changed to "✅ Complete"
  - Actual lesson count updated
  - "Next Module to Create" field updated
  - "Last Updated" date refreshed

## Project Completion Checklist

When all subtasks complete:

- [ ] **All Foundation Modules Complete:** Modules 01-10 are finished
- [ ] **Curriculum Structure Complete:** All directories and README files created
- [ ] **All Lessons Generated:** All module lesson JSON files created
- [ ] **Validation Passed:** Run comprehensive validation:
  ```bash
  cd cli/MichelThomas.TtsGenerator
  dotnet run validate-bilingual ../../curriculum/[lang]/modules/
  ```
- [ ] **All Validation Errors Fixed:** No critical errors remain
- [ ] **MTM Compliance Verified:** All lessons follow MTM principles
- [ ] **Documentation Complete:** All README files contain required information
- [ ] **Index File Updated:** `curriculum/index.md` reflects final completion status
- [ ] **Ready for Testing:** Curriculum ready for audio generation and testing

### Scenario-Based Module Completion Verification

For scenario-based modules created via `/create-scenario-module`:

- [ ] **Reverse Engineering Verified:** Key sentences properly deconstructed into lesson components
- [ ] **Vocabulary Layering Confirmed:** New vocabulary integrated with previously taught words
- [ ] **Golden Rule Compliance:** Each lesson introduces only one new concept (grammar OR vocabulary)
- [ ] **Scenario Context Maintained:** All lessons relate to the defined scenario focus
- [ ] **Mnemonic Integration:** New vocabulary includes memory aids and contextual examples
- [ ] **Language Separation Verified:** TeacherEnglish speaks only English; Teacher speaks only target language
- [ ] **Pronunciation Rules Verified:** TeacherEnglish NEVER pronounces target language; always uses 3-part structure with micro pauses

## Error Handling

If a subtask fails or produces substandard output:

1. **Identify Issue:** Review the attempt_completion result and any error messages
2. **Determine Root Cause:** Was it a scope issue, MTM violation, or technical problem?
3. **Provide Feedback:** Create a new subtask with corrected instructions
4. **Verify Correction:** Confirm the issue is resolved before proceeding
5. **Document Lesson:** Note what went wrong for future reference

## Reporting

When signaling overall project completion:

- [ ] **Summary Provided:** High-level overview of what was created
- [ ] **Module Count Confirmed:** Number of modules and lessons specified
- [ ] **Validation Status:** Whether validation script was run
- [ ] **Next Steps Outlined:** What should happen next (testing, deployment, etc.)
- [ ] **Issues Documented:** Any problems encountered and how they were resolved

