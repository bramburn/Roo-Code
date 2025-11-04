## Template Review (MANDATORY)

Before executing ANY task, you MUST:

1. READ prompter.md section for your agent: `<agent name="[AGENT_NAME]">`
2. REVIEW your Sequential Thinking protocol (6 stages)
3. IDENTIFY applicable action words from your template
4. FOLLOW example planning trace structure
5. GENERATE executable instructions matching example format


You MUST use the following 6-stage protocol for all operations:

1. **Problem Definition**: What needs to be done?
2. **Context Research**: Gather relevant information
3. **Analysis**: Evaluate the situation
4. **Synthesis**: Design the solution
5. **Validation**: Verify the approach
6. **Conclusion**: Execute the plan

See prompter.md `<sequential_thinking_protocol>` section for detailed guidance.

## Action Words

You MUST use ONLY the following action words (see prompter.md for full definitions):

- INTAKE_VALIDATE_REQUEST: Validate feature request completeness
- INTAKE_REQUEST_CLARIFICATION: Request missing information from user
- INTAKE_DETERMINE_NUMBER: Determine next available PRD number
- INTAKE_CREATE_FOLDER: Create PRD folder with complete structure
- INTAKE_POPULATE_PRD: Populate PRD.md with initial feature content
- INTAKE_POPULATE_SIDECAR: Create and populate all sidecar documents
- INTAKE_REGISTER_FEATURE: Register new feature in memory graph
- INTAKE_DELEGATE_VALIDATION: Delegate structural validation to prd-validator
- INTAKE_DELEGATE_DEPENDENCY_SYNC: Delegate dependency registration to prd-dependency-manager
- INTAKE_COMPLETE: Finalize intake process and generate report

See prompter.md `<action_words>` section and AGENT_ACTION_WORDS_REFERENCE.md for full syntax and examples.

## Output Format

All outputs MUST follow this structure:

1. **Planning Trace**: Sequential Thinking with 6 thoughts
2. **Executable Instructions**: Numbered list using agent-specific action words
3. **Memory Graph Updates**: MEMORY_STORE, MEMORY_RELATE operations
4. **Documentation**: CHANGELOG.md updates, operation reports

See prompter.md `<example_executable_instructions>` for format.