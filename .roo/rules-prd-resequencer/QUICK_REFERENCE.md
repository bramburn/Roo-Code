# PRD Resequencer Quick Reference Card

## 🎯 Purpose
Avoid context limit issues when resequencing large numbers of PRD folders (64+) by using a divide-and-conquer approach.

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│     prd-resequencer                 │  ← Orchestrator (YOU)
│     (Main Orchestrator)             │
│                                     │
│  1. Create folder operation list    │
│  2. Delegate to folder resequencers │
│  3. Update cross-folder deps        │
│  4. Validate overall structure      │
└──────────────┬──────────────────────┘
               │
               ├─────────────┬─────────────┬─────────────┐
               ▼             ▼             ▼             ▼
         ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐
         │ Folder  │   │ Folder  │   │ Folder  │   │ Folder  │
         │ Reseq 1 │   │ Reseq 2 │   │ Reseq 3 │   │ Reseq N │
         └─────────┘   └─────────┘   └─────────┘   └─────────┘
         ← Workers (process one folder each)
```

## 📋 Quick Workflow

### For prd-resequencer (Main Orchestrator)

```bash
# Step 1: Analyze plan
RESEQUENCE_ANALYZE PRDs/ FOR [folders_to_resequence] BUILDING folder_operation_list.md

# Step 2: Delegate each folder
new_task -m prd-folder-resequencer "Resequence folder 'PRDs/05 - Grammar Pattern Database Backend' to 'PRDs/03-Grammar-Pattern-Database-Backend'"
# Wait for completion, repeat for each folder

# Step 3: Update cross-folder dependencies
RESEQUENCE_UPDATE_CROSS_DEPENDENCIES IN PRDs/ FOR [all_resequenced_folders]

# Step 4: Validate
RESEQUENCE_VALIDATE PRDs/ CHECKING [cross_folder_dependencies, reference_validity]

# Step 5: Delegate to dependency manager
new_task -m prd-dependency-manager "Update MCP memory graph to reflect resequenced PRD folders"

# Step 6: Report
RESEQUENCE_REPORT_COMPLETION
```

### For prd-folder-resequencer (Folder Worker)

```bash
# Step 1: Analyze folder
FOLDER_RESEQUENCE_ANALYZE "PRDs/05 - Grammar Pattern Database Backend"

# Step 2: Execute move
FOLDER_RESEQUENCE_EXECUTE FROM "PRDs/05 - Grammar Pattern Database Backend" TO "PRDs/03-Grammar-Pattern-Database-Backend"

# Step 3: Update internal references
FOLDER_RESEQUENCE_UPDATE_REFS IN "PRDs/03-Grammar-Pattern-Database-Backend"

# Step 4: Validate
FOLDER_RESEQUENCE_VALIDATE "PRDs/03-Grammar-Pattern-Database-Backend"

# Step 5: Document
FOLDER_RESEQUENCE_DOCUMENT IN "PRDs/03-Grammar-Pattern-Database-Backend/CHANGELOG.md"

# Step 6: Report
attempt_completion "✅ Folder resequenced successfully"
```

## 🚫 Critical Constraints

### prd-resequencer (Main Orchestrator)
- ❌ Do NOT load all folder contents at once
- ❌ Do NOT process folders directly
- ✅ DO delegate each folder to prd-folder-resequencer
- ✅ DO update cross-folder dependencies after all moves

### prd-folder-resequencer (Folder Worker)
- ❌ Do NOT scan other PRD folders
- ❌ Do NOT update cross-folder dependencies
- ❌ Do NOT update memory graph
- ✅ DO process ONLY the specified folder
- ✅ DO update internal references only

## 📊 Context Usage

| Agent | Context Usage | Why |
|-------|---------------|-----|
| prd-resequencer | LOW | Only loads folder names, not contents |
| prd-folder-resequencer | LOW | Processes one folder at a time |
| Total | WELL WITHIN LIMIT | Divide-and-conquer approach |

## 🎯 Action Words

### prd-resequencer
- `RESEQUENCE_ANALYZE` - Analyze resequencing requirements
- `RESEQUENCE_DELEGATE_FOLDER` - Delegate to folder resequencer
- `RESEQUENCE_UPDATE_CROSS_DEPENDENCIES` - Update cross-folder deps
- `RESEQUENCE_VALIDATE` - Validate overall structure
- `RESEQUENCE_DELEGATE_TO_DEPENDENCY_MANAGER` - Delegate to dep manager
- `RESEQUENCE_REPORT_COMPLETION` - Report completion

### prd-folder-resequencer
- `FOLDER_RESEQUENCE_ANALYZE` - Analyze single folder
- `FOLDER_RESEQUENCE_EXECUTE` - Execute folder move
- `FOLDER_RESEQUENCE_UPDATE_REFS` - Update internal references
- `FOLDER_RESEQUENCE_VALIDATE` - Validate folder integrity
- `FOLDER_RESEQUENCE_DOCUMENT` - Document in CHANGELOG

## 💡 Example: Resequence 5 Folders

```
Input: Resequencing plan with 5 folders

prd-resequencer:
  1. Create operation list (5 folders) → LOW context
  2. Delegate folder 1 → new_task → LOW context
  3. Delegate folder 2 → new_task → LOW context
  4. Delegate folder 3 → new_task → LOW context
  5. Delegate folder 4 → new_task → LOW context
  6. Delegate folder 5 → new_task → LOW context
  7. Update cross-folder deps → MEDIUM context
  8. Validate overall → LOW context
  9. Delegate to dep manager → new_task
  10. Report completion

Total time: ~5 minutes (1 min per folder)
Total context: WELL WITHIN LIMIT ✅
```

## 🔧 Troubleshooting

### Issue: Context limit still exceeded
**Solution**: Verify delegation to prd-folder-resequencer is happening

### Issue: Folder resequencer not found
**Solution**: Check .roomodes contains prd-folder-resequencer definition

### Issue: Cross-folder dependencies not updated
**Solution**: Verify main resequencer updates cross-folder deps after all moves

## 📚 Documentation

- **Architecture**: `.roo/rules-prd-resequencer/ARCHITECTURE.md`
- **Usage Guide**: `.roo/rules-prd-resequencer/USAGE_GUIDE.md`
- **Summary**: `PRD_RESEQUENCER_REFACTORING_SUMMARY.md`

## ✅ Success Criteria

- ✅ All folders resequenced successfully
- ✅ No context limit errors
- ✅ All internal references updated
- ✅ All cross-folder dependencies updated
- ✅ Overall validation passed
- ✅ Memory graph updated

## 🎓 Key Takeaway

**Divide-and-Conquer = Scalability**

By processing one folder at a time through subtasks, we can resequence any number of PRD folders without hitting context limits.

