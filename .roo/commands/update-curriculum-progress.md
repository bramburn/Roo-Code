# Update Curriculum Progress

## Purpose
Updates the curriculum index file to reflect completed modules and track overall progress. This command ensures the orchestrator maintains accurate memory of curriculum status.

## Usage
`/update-curriculum-progress`

## Parameters
- `curriculum_path`: Path to the curriculum (e.g., "english-to-korean")
- `module_number`: Module number that was completed (e.g., "02")
- `lesson_count`: Number of lessons created in the module
- `notes`: Optional notes about the module completion

## Workflow
1. **Read Current Index**: Load `curriculum/index.md`
2. **Locate Curriculum**: Find the specified curriculum in the index
3. **Update Module Status**: Change module status from "❌ Not Started" to "✅ Complete"
4. **Update Lesson Count**: Set actual lesson count
5. **Update Next Module**: Set "Next Module to Create" to the next incomplete module
6. **Update Timestamp**: Refresh "Last Updated" date
7. **Save Index**: Write updated index back to file

## Output
Returns a summary of what was updated in the curriculum index.

## Example
```bash
/update-curriculum-progress curriculum_path="english-to-korean" module_number="02" lesson_count="10" notes="All lessons focus on question formation with 'do'"
```

This ensures the orchestrator always knows where it left off and what to work on next.