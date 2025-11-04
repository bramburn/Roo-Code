# PRD Resequencer Usage Guide

## Quick Start

### For Users

**To resequence PRD folders**, use the prd-orchestrator:

```
User: "Resequence the PRD folders according to the new implementation order"

prd-orchestrator will:
1. Invoke prd-logical-sorter to create optimal sequence
2. Create resequencing plan
3. Delegate to prd-resequencer to execute the plan
```

**You do NOT need to**:
- Call prd-resequencer directly
- Call prd-folder-resequencer directly
- Worry about context limits

### For prd-orchestrator

**To delegate resequencing**, use this pattern:

```
new_task -m prd-resequencer "Execute resequencing plan from PRDs/resequencing_plan.md"
```

The prd-resequencer will handle:
- Breaking down the work into folder-level subtasks
- Delegating to prd-folder-resequencer for each folder
- Updating cross-folder dependencies
- Coordinating with prd-dependency-manager

### For prd-resequencer

**To resequence multiple folders**, follow this workflow:

```
1. Analyze resequencing plan
   - Read the resequencing plan file
   - Extract folder operations (source → target paths)
   - Create folder operation list

2. Delegate to folder resequencers
   For each folder in the operation list:
   
   new_task -m prd-folder-resequencer "Resequence folder '<source_path>' to '<target_path>'"
   
   Wait for completion and collect results

3. Update cross-folder dependencies
   - Find all dependencies.md files
   - Update references to moved folders
   - Update any PRD.md files with cross-folder references

4. Validate overall structure
   - Verify all cross-folder dependencies are valid
   - Check folder numbering is sequential
   - Confirm no broken references

5. Delegate to dependency manager
   new_task -m prd-dependency-manager "Update MCP memory graph to reflect resequenced PRD folders"

6. Report completion
   - Summary of folders resequenced
   - List of updated files
   - Validation results
```

### For prd-folder-resequencer

**You will receive a task like**:
```
"Resequence folder 'PRDs/05 - Grammar Pattern Database Backend' to 'PRDs/03-Grammar-Pattern-Database-Backend'"
```

**Your workflow**:
```
1. Analyze folder
   - List files in the specified folder ONLY
   - Identify files with internal references

2. Execute move
   execute_command: git mv "PRDs/05 - Grammar Pattern Database Backend" "PRDs/03-Grammar-Pattern-Database-Backend"

3. Update internal references
   - PRD.md: Fix internal relative paths
   - dependencies.md: Update folder self-reference
   - sub-sprints/*.md: Fix relative paths
   - tasklists/*.md: Fix relative paths

4. Validate folder
   - Verify all files exist
   - Check all internal links resolve

5. Document changes
   - Update CHANGELOG.md with operation details

6. Report completion
   attempt_completion with:
   - Success/failure status
   - List of updated files
   - Any errors or warnings
```

## Common Scenarios

### Scenario 1: Resequence 5 Folders

**Input**: Resequencing plan with 5 folders

**prd-resequencer workflow**:
```
1. Create operation list (5 folders)

2. Delegate folder 1:
   new_task -m prd-folder-resequencer "Resequence folder 'PRDs/05 - Grammar Pattern Database Backend' to 'PRDs/03-Grammar-Pattern-Database-Backend'"
   → Wait for completion
   → Result: ✅ Success

3. Delegate folder 2:
   new_task -m prd-folder-resequencer "Resequence folder 'PRDs/06 - Audio Content Management' to 'PRDs/04-Audio-Content-Management'"
   → Wait for completion
   → Result: ✅ Success

4. [Continue for folders 3-5...]

5. Update cross-folder dependencies (12 files)

6. Validate overall structure
   → Result: ✅ All validations passed

7. Delegate to dependency manager
   new_task -m prd-dependency-manager "Update MCP memory graph"
   → Wait for completion
   → Result: ✅ Memory graph updated

8. Report completion
   ✅ 5 folders resequenced successfully
```

### Scenario 2: Resequence All 64 Folders

**Input**: Comprehensive resequencing plan

**prd-resequencer workflow**:
```
1. Create operation list (64 folders)
   Context usage: LOW (only folder names)

2. Process folders in batches of 10:
   Batch 1 (folders 1-10):
   - Delegate to 10 folder resequencers
   - Wait for all to complete
   - Collect results
   
   Batch 2 (folders 11-20):
   - Delegate to 10 folder resequencers
   - Wait for all to complete
   - Collect results
   
   [Continue for all 64 folders...]

3. Update cross-folder dependencies
   Context usage: MEDIUM (only dependencies.md files)

4. Validate overall structure
   Context usage: LOW (validation checks only)

5. Delegate to dependency manager

6. Report completion
   ✅ 64 folders resequenced successfully
   Total time: ~64 minutes (1 min per folder)
```

### Scenario 3: Single Folder Resequencing

**Input**: Single folder operation

**prd-folder-resequencer workflow**:
```
Task: "Resequence folder 'PRDs/05 - Grammar Pattern Database Backend' to 'PRDs/03-Grammar-Pattern-Database-Backend'"

1. Analyze folder
   - Files found: PRD.md, CHANGELOG.md, dependencies.md, README.md
   - Sub-directories: sub-sprints/ (3 files), tasklists/ (2 files)
   - Internal references: 8 files need updates

2. Execute move
   git mv "PRDs/05 - Grammar Pattern Database Backend" "PRDs/03-Grammar-Pattern-Database-Backend"
   → Result: ✅ Success

3. Update internal references
   - PRD.md: Updated 2 relative paths
   - dependencies.md: Updated self-reference
   - sub-sprints/sprint-01.md: Updated 1 relative path
   - sub-sprints/sprint-02.md: Updated 1 relative path
   - sub-sprints/sprint-03.md: Updated 1 relative path
   - tasklists/tasklist-01.md: Updated 1 relative path
   - tasklists/tasklist-02.md: Updated 1 relative path

4. Validate folder
   - All files exist: ✅
   - All internal links resolve: ✅

5. Document changes
   - CHANGELOG.md updated with operation details

6. Report completion
   ✅ Folder resequenced successfully
   - Files updated: 8
   - Validation: PASSED
```

## Error Handling

### Error: Git Operation Fails

**Scenario**: Target folder already exists

**prd-folder-resequencer**:
```
❌ Git operation failed
- Command: git mv "PRDs/05 - Grammar Pattern Database Backend" "PRDs/03-Grammar-Pattern-Database-Backend"
- Error: fatal: destination exists
- Action: Report to main resequencer

attempt_completion:
"❌ Folder resequencing failed: Target folder already exists. Please resolve conflict and retry."
```

**prd-resequencer**:
```
Received error from folder resequencer
- Folder: PRDs/05 - Grammar Pattern Database Backend
- Error: Target folder already exists
- Action: Report to prd-orchestrator for conflict resolution
```

### Error: Reference Update Fails

**Scenario**: File not found during reference update

**prd-folder-resequencer**:
```
⚠️ Reference update partial failure
- Folder moved successfully
- Files updated: 6/8
- Failed files:
  * sub-sprints/sprint-02.md (file not found)
  * tasklists/tasklist-03.md (parse error)
- Action: Report to main resequencer with details

attempt_completion:
"⚠️ Folder resequenced with warnings: 2 files failed to update. Manual review required."
```

### Error: Validation Fails

**Scenario**: Broken internal links after resequencing

**prd-folder-resequencer**:
```
❌ Validation failed
- Folder moved successfully
- Internal references updated
- Validation errors:
  * PRD.md: Link to ../old-folder/file.md is broken
  * dependencies.md: Reference to non-existent folder
- Action: Report to main resequencer

attempt_completion:
"❌ Folder resequencing validation failed: Broken internal links detected. Rollback recommended."
```

## Best Practices

### For prd-resequencer

1. **Always delegate to folder resequencers**: Never process folders directly
2. **Process folders sequentially**: Avoid race conditions
3. **Collect all results**: Track success/failure for each folder
4. **Update cross-folder dependencies last**: After all folders are moved
5. **Validate before delegating to dependency manager**: Ensure structure is valid

### For prd-folder-resequencer

1. **Process only the specified folder**: Never scan other folders
2. **Use git mv**: Maintain git history
3. **Update all internal references**: Don't miss any files
4. **Validate before reporting**: Ensure folder integrity
5. **Document in CHANGELOG.md**: Maintain audit trail

### For Error Handling

1. **Report errors immediately**: Don't continue on failure
2. **Provide detailed error messages**: Include command, error, and context
3. **Suggest remediation**: Help users resolve issues
4. **Don't attempt automatic rollback**: Let users decide

## Performance Tips

### For Large-Scale Resequencing (50+ folders)

1. **Process in batches**: Group folders into batches of 10-20
2. **Monitor progress**: Report after each batch
3. **Validate incrementally**: Validate after each batch
4. **Use parallel processing**: If folders are independent (future enhancement)

### For Context Efficiency

1. **Load only what you need**: Don't load entire folder contents
2. **Process files one at a time**: Update references sequentially
3. **Use targeted searches**: Search specific files, not entire directory
4. **Report concisely**: Include only essential information

## Troubleshooting

### Issue: Context limit still exceeded

**Possible causes**:
- Loading too many files at once
- Processing multiple folders in single task
- Not delegating to folder resequencers

**Solution**:
- Verify delegation to prd-folder-resequencer
- Check that folder resequencer processes only one folder
- Reduce batch size if processing in batches

### Issue: Folder resequencer not found

**Possible causes**:
- Mode not defined in .roomodes
- Incorrect mode slug in new_task

**Solution**:
- Verify .roomodes contains prd-folder-resequencer definition
- Check mode slug is exactly "prd-folder-resequencer"

### Issue: Cross-folder dependencies not updated

**Possible causes**:
- Main resequencer not updating cross-folder dependencies
- Folder resequencer updating cross-folder dependencies (incorrect)

**Solution**:
- Verify main resequencer updates cross-folder dependencies after all folder moves
- Verify folder resequencer only updates internal references

## Summary

The divide-and-conquer architecture enables:
- ✅ Scalable resequencing of any number of PRD folders
- ✅ Context-efficient processing (one folder at a time)
- ✅ Clear separation of concerns (orchestration vs execution)
- ✅ Error isolation (folder-level errors don't affect others)
- ✅ Maintainable and extensible design

For questions or issues, refer to ARCHITECTURE.md for detailed design documentation.

