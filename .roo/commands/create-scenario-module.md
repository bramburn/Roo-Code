# /create-scenario-module: Initiate Scenario-Based Module Creation

## Purpose
This command provides a rigid workflow template for the MTM Orchestrator to plan, coordinate, and delegate the creation of a new scenario-based module (Modules 11 and above), ensuring that content strictly builds upon previous vocabulary and grammar in line with the MTM Golden Rule (MTM-001).

## Arguments Provided
- **Module:** [[module]]
- **Scenario Focus:** [[scenario_focus]]
- **Key Sentences (Target for Reverse Engineering):** [[key_sentences]]

## Workflow Steps for MTM Orchestrator

1. **Retrieve Foundational Context (Vocabulary & Grammar):**
    *   Use the **`read_file`** tool to retrieve the comprehensive curriculum documentation (e.g., `curriculum/english-to-mandarin/README.md` or the latest consolidation module README) to establish the complete list of previously taught Vocabulary and Grammar Structures.
    *   The goal is to ensure the new module recycles and layers existing words and structures into the new scenario context.

2. **Reverse Engineer Scenario Content:**
    *   Analyze the [[key_sentences]] to identify the minimum necessary *new* grammatical concepts and vocabulary required to construct these sentences.
    *   Crucially, **prioritize using existing vocabulary** when possible to reinforce learning (Layering Principle).
    *   Break down the required content into 5 manageable sub-lessons (e.g., "11.01 Booking Inquiries," "11.02 Directional Prepositions").

3. **Delegate Structural Creation (Curriculum Builder):**
    *   Use the **`new_task`** tool to delegate to the **`curriculum-builder`**.
    *   **Message MUST include:**
        *   Module naming convention: `XX-<name of module>` (e.g., [[module]]).
        *   Requirement to create the directory `curriculum/english-to-mandarin/modules/[[module]]/`.
        *   Requirement to generate a `README.md` file using the module template, including the list of new sub-lessons derived in Step 2.

4. **Delegate Lesson Content Generation (MTM Lesson Creator):**
    *   Once the structure is confirmed, iterate through each sub-lesson (from Step 2).
    *   Use the **`new_task`** tool to delegate to the **`mtm-lesson-creator`**.
    *   **Message MUST include:**
        *   The complete inventory of **existing vocabulary** (from Step 1) and **existing grammar** that must be layered into the new lesson.
        *   The single **new concept** (grammar OR vocabulary) to be introduced in that specific lesson (Golden Rule MTM-001).
        *   The **scenario context** ([[scenario_focus]]) and specific mnemonic requirements.

5. **Consolidate and Signal Completion (Orchestrator):**
    *   Track successful completion of all subtasks (Structural and Content).
    *   Signal definitive completion of the module creation using the **`attempt_completion`** tool, providing a concise summary of the module created and the scenarios covered.

