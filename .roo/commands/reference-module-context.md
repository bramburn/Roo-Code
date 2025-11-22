# /reference-module-context: Retrieve Stored Curriculum Context

## Purpose
This command executes the necessary actions to retrieve key data (vocabulary, grammar) from existing curriculum documentation files, enabling the calling agent (usually Lesson Creator) to adhere to the Layering and Recycling principles of MTM.

## Arguments Provided
- **File Path:** [[file_path]]
- **Requested Section:** [[section]]

## Workflow Steps for MTM Orchestrator or Lesson Creator

1. **Validate Path Access:**
    *   Check if [[file_path]] points to a known curriculum documentation file (e.g., ending in `.md`) that contains the required context.

2. **Retrieve File Content:**
    *   Use the **`read_file`** tool to fetch the entire contents of the file specified by [[file_path]].

3. **Filter Content (If specified):**
    *   If [[section]] is provided, extract only the content relevant to that section (e.g., "New Vocabulary" or "Grammar & Structures").
    *   If no section is specified, return the entire file content.

4. **Format Output:**
    *   Present the retrieved content clearly, indicating the source and purpose, ensuring it can be used by the subsequent lesson generation steps.

5. **Signal Retrieval Success:**
    *   Push the retrieved content (or relevant subset) as the tool result.
    *   **Result Format:**
```json
{
  "reference_source": "[[file_path]]",
  "content_type": "[[section]]",
  "data": "..." // The retrieved, formatted text content
}
```

## Usage Examples

### Example 1: Retrieve all vocabulary from Module 10
```
/reference-module-context file_path:curriculum/english-to-mandarin/modules/10-Consolidation/README.md section:New Vocabulary
```

### Example 2: Retrieve complete module context
```
/reference-module-context file_path:curriculum/english-to-mandarin/modules/09-Future_Tense/README.md
```

