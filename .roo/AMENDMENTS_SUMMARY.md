# Amendments Summary - Roomodes and Slash Commands

## Overview
This document summarizes the amendments made to the MTM curriculum system to support scenario-based module creation, curriculum expansion (5,000-6,000 word targets), and the introduction of slash commands for streamlined workflow management.

## Changes Made

### 1. Slash Commands Created

Two new slash command files have been created in `.roo/commands/`:

#### `/create-scenario-module` (`.roo/commands/create-scenario-module.md`)
- **Purpose:** Provides a rigid workflow template for planning and delegating scenario-based module creation (Modules 11+)
- **Parameters:** `module`, `scenario_focus`, `key_sentences`
- **Workflow:** Retrieves foundational context → Reverse engineers scenario content → Delegates to Curriculum Builder → Delegates to MTM Lesson Creator → Consolidates completion
- **Key Feature:** Ensures vocabulary layering and Golden Rule compliance for expanded curricula

#### `/reference-module-context` (`.roo/commands/reference-module-context.md`)
- **Purpose:** Retrieves stored curriculum documentation for vocabulary and grammar reference
- **Parameters:** `file_path`, `section` (optional)
- **Workflow:** Validates path → Retrieves file content → Filters by section if specified → Formats and returns data
- **Key Feature:** Enables proper layering and recycling of previously taught content

### 2. MTM Orchestrator Roomode Amended (`.roomodes`)

**Updated `customInstructions` section:**
- Added guidance for scenario-based module creation (Modules 11+)
- Integrated slash command usage (`/create-scenario-module`, `/reference-module-context`)
- Added curriculum expansion mandate (5,000-6,000 word targets)
- Reinforced Just-in-Time vocabulary introduction and Golden Rule compliance

### 3. MTM Orchestrator Rules Amended

#### `mtm_design_workflow.md`
- **Added:** Section 6 - "Curriculum Expansion Beyond Foundation (Modules 11+)"
  - Defines expansion strategy with Stages 2-4
  - Describes scenario-based module design principles
  - Emphasizes reverse-engineering from complex target sentences
  - Mandates vocabulary layering with previously taught content

- **Added:** Section 4 in Delegation Strategy - "Slash Commands for Scenario-Based Workflows"
  - Documents `/create-scenario-module` and `/reference-module-context` usage
  - Explains how commands externalize complex logic into reusable templates

#### `orchestration_checklist.md`
- **Enhanced:** Pre-Delegation Checklist with scenario-based module items
  - Scenario focus definition
  - Key sentences identification
  - Vocabulary layering plan
  - New concept identification
  - Slash command parameter preparation

- **Added:** Scenario-Based Module Completion Verification section
  - Reverse engineering verification
  - Vocabulary layering confirmation
  - Golden Rule compliance checks
  - Scenario context maintenance
  - Mnemonic integration verification
  - Language separation verification

### 4. MTM Lesson Creator Rules Amended

#### `mtm_compliance_critical.md`
- **Added:** Section 6 - "Just-in-Time Vocabulary for Curriculum Expansion (CRITICAL for 5,000+ Word Targets)"
  - Reinforces prohibition on vocabulary lists
  - Mandates vocabulary introduction only when required for grammatical practice
  - Explains vocabulary scaling through breadth of contexts
  - Provides concrete example of scenario-based vocabulary introduction
  - Maintains Golden Rule while enabling large-scale vocabulary growth

## Impact

These amendments enable:

1. **Curriculum Expansion:** Support for scaling from 1,700 words (Foundation Course) to 5,000-6,000 words through additional Stages and Modules
2. **Scenario-Based Learning:** Structured creation of real-world context modules (Travel, Business, Healthcare, etc.)
3. **Streamlined Workflows:** Slash commands provide reusable templates for complex orchestration tasks
4. **Vocabulary Layering:** Systematic recycling and reinforcement of previously taught vocabulary
5. **Maintained Compliance:** All expansions strictly adhere to MTM principles, especially the Golden Rule and Language Separation

## Usage Example

To create a scenario-based module using the new slash command:

```
/create-scenario-module module:11-Travel_Scenarios scenario_focus:Booking hotels and asking for directions key_sentences:"I need a room with a window." "How do I get to the train station?" "What time does the restaurant close?"
```

The MTM Orchestrator will execute the complete workflow defined in the `/create-scenario-module` command, ensuring proper reverse-engineering, vocabulary layering, and delegation to specialized agents.

