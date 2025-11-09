# PRD Agent Action Words - Quick Reference

## Overview

This document provides a quick reference for all agent-specific action words defined in `.roo/guides/prompter.md`. Use this as a cheat sheet when writing agent instructions.

---

## PRD_Feature_Intake Action Words

### INTAKE_VALIDATE_REQUEST

**Format**: `INTAKE_VALIDATE_REQUEST [request_data] CHECKING [required_fields] REPORTING [validation_results]`
**Purpose**: Validate feature request completeness
**Example**: `INTAKE_VALIDATE_REQUEST user_feature_request CHECKING [name, description, users, requirements, priority] REPORTING validation_report.md`

### INTAKE_REQUEST_CLARIFICATION

**Format**: `INTAKE_REQUEST_CLARIFICATION FROM [requester] FOR [missing_fields] WITH_TEMPLATE [clarification_template]`
**Purpose**: Request missing information from user
**Example**: `INTAKE_REQUEST_CLARIFICATION FROM user FOR [target_users, acceptance_criteria] WITH_TEMPLATE feature_intake_clarification.md`

### INTAKE_DETERMINE_NUMBER

**Format**: `INTAKE_DETERMINE_NUMBER IN [prds_directory] SCANNING [existing_folders] RETURNING [next_number]`
**Purpose**: Determine next available PRD number
**Example**: `INTAKE_DETERMINE_NUMBER IN PRDs/ SCANNING [all_numbered_folders] RETURNING next_prd_number`

### INTAKE_CREATE_FOLDER

**Format**: `INTAKE_CREATE_FOLDER AT [prd_path] WITH_STRUCTURE [required_files_and_dirs] FOLLOWING [instruction_spec]`
**Purpose**: Create PRD folder with complete structure
**Example**: `INTAKE_CREATE_FOLDER AT PRDs/23-flashcard-game/ WITH_STRUCTURE [PRD.md, README.md, CHANGELOG.md, dependencies.md, testing-strategy.md, rollback-plan.md, sub-sprints/, tasklists/] FOLLOWING .roo/guides/INSTRUCTION.md`

### INTAKE_POPULATE_PRD

**Format**: `INTAKE_POPULATE_PRD AT [prd_md_path] WITH_CONTENT [feature_details] USING_TEMPLATE [prd_template]`
**Purpose**: Populate PRD.md with initial feature content
**Example**: `INTAKE_POPULATE_PRD AT PRDs/23-flashcard-game/PRD.md WITH_CONTENT [feature_request_data] USING_TEMPLATE .roo/guides/INSTRUCTION.md_prd_structure`

### INTAKE_POPULATE_SIDECAR

**Format**: `INTAKE_POPULATE_SIDECAR FOR [prd_path] CREATING [sidecar_files] REFERENCING [prd_sections]`
**Purpose**: Create and populate all sidecar documents
**Example**: `INTAKE_POPULATE_SIDECAR FOR PRDs/23-flashcard-game/ CREATING [CHANGELOG.md, dependencies.md, testing-strategy.md, rollback-plan.md] REFERENCING [relevant_prd_sections]`

### INTAKE_REGISTER_FEATURE

**Format**: `INTAKE_REGISTER_FEATURE [feature_name] AT [prd_path] WITH_METADATA [feature_metadata] IN_MEMORY_GRAPH`
**Purpose**: Register new feature in memory graph
**Example**: `INTAKE_REGISTER_FEATURE "Flashcard Game Module" AT PRDs/23-flashcard-game/ WITH_METADATA [priority:P1, status:draft, created:2024-11-03] IN_MEMORY_GRAPH`

### INTAKE_DELEGATE_VALIDATION

**Format**: `INTAKE_DELEGATE_VALIDATION TO [validator_agent] FOR [prd_path] WITH_CONTEXT [validation_requirements]`
**Purpose**: Delegate structural validation to prd-validator
**Example**: `INTAKE_DELEGATE_VALIDATION TO prd-validator FOR PRDs/23-flashcard-game/ WITH_CONTEXT [check_all_required_files, verify_template_compliance]`

### INTAKE_DELEGATE_DEPENDENCY_SYNC

**Format**: `INTAKE_DELEGATE_DEPENDENCY_SYNC TO [dependency_manager] FOR [prd_path] WITH_DEPENDENCIES [dependency_list]`
**Purpose**: Delegate dependency registration to prd-dependency-manager
**Example**: `INTAKE_DELEGATE_DEPENDENCY_SYNC TO prd-dependency-manager FOR PRDs/23-flashcard-game/ WITH_DEPENDENCIES [PRDs/01-foundation/, PRDs/05-user-management/]`

### INTAKE_COMPLETE

**Format**: `INTAKE_COMPLETE WITH_REPORT [intake_report] NOTIFYING [stakeholders] DOCUMENTING [actions_taken]`
**Purpose**: Finalize intake process and generate report
**Example**: `INTAKE_COMPLETE WITH_REPORT intake_report_prd_23.md NOTIFYING [user, orchestrator] DOCUMENTING [folder_created, content_populated, validation_delegated]`

---

## PRD_Dependency_Manager Action Words

### DEPENDENCY_SCAN

**Format**: `DEPENDENCY_SCAN [prd_path] FOR [dependency_types] DOCUMENTING [conflicts_found]`  
**Purpose**: Scan PRD dependencies.md for specific dependency types and conflicts  
**Example**: `DEPENDENCY_SCAN PRDs/05-analytics/ FOR [npm_packages, external_apis] DOCUMENTING conflicts_list.md`

### DEPENDENCY_SYNC

**Format**: `DEPENDENCY_SYNC FROM [source_prd] TO [target_prds] PRESERVING [version_constraints]`  
**Purpose**: Synchronize dependencies from one PRD to multiple others  
**Example**: `DEPENDENCY_SYNC FROM PRDs/01-foundation/ TO [PRDs/05-analytics/, PRDs/07-reporting/] PRESERVING [major_version_compatibility]`

### DEPENDENCY_CONFLICT_DETECT

**Format**: `DEPENDENCY_CONFLICT_DETECT ACROSS [prd_list] REPORTING [conflict_severity]`  
**Purpose**: Detect version conflicts across multiple PRDs  
**Example**: `DEPENDENCY_CONFLICT_DETECT ACROSS [all_active_prds] REPORTING [critical, warning, info]`

### DEPENDENCY_GRAPH_BUILD

**Format**: `DEPENDENCY_GRAPH_BUILD FOR [prd_scope] WITH_DEPTH [levels] OUTPUTTING [graph_format]`  
**Purpose**: Build dependency graph visualization  
**Example**: `DEPENDENCY_GRAPH_BUILD FOR PRDs/05-analytics/ WITH_DEPTH 3 OUTPUTTING mermaid_diagram`

### DEPENDENCY_RESOLVE

**Format**: `DEPENDENCY_RESOLVE CONFLICT [conflict_id] USING [resolution_strategy] UPDATING [affected_files]`  
**Purpose**: Resolve specific dependency conflict  
**Example**: `DEPENDENCY_RESOLVE CONFLICT react_version_mismatch USING upgrade_to_latest UPDATING [PRDs/*/dependencies.md]`

### DEPENDENCY_VALIDATE

**Format**: `DEPENDENCY_VALIDATE [prd_path] AGAINST [implementation_files] REPORTING [mismatches]`  
**Purpose**: Validate dependencies.md matches actual code dependencies  
**Example**: `DEPENDENCY_VALIDATE PRDs/05-analytics/ AGAINST [src/analytics/**/*.ts] REPORTING dependency_mismatches.md`

### DEPENDENCY_CIRCULAR_CHECK

**Format**: `DEPENDENCY_CIRCULAR_CHECK IN [prd_scope] BREAKING_AT [max_depth] DOCUMENTING [cycles_found]`  
**Purpose**: Detect circular dependencies  
**Example**: `DEPENDENCY_CIRCULAR_CHECK IN all_prds BREAKING_AT 10 DOCUMENTING circular_dependencies.md`

---

## PRD_Validator Action Words

### VALIDATE_STRUCTURE

**Format**: `VALIDATE_STRUCTURE [prd_path] AGAINST [required_files] REPORTING [missing_files]`  
**Purpose**: Check if all required PRD files exist  
**Example**: `VALIDATE_STRUCTURE PRDs/05-analytics/ AGAINST [PRD.md, README.md, dependencies.md, testing-strategy.md] REPORTING structure_issues.md`

### VALIDATE_CROSS_REFS

**Format**: `VALIDATE_CROSS_REFS IN [file_path] CHECKING [reference_types] REPORTING [broken_links]`  
**Purpose**: Validate internal cross-references  
**Example**: `VALIDATE_CROSS_REFS IN PRDs/05-analytics/PRD.md CHECKING [sprint_links, task_ids, file_paths] REPORTING broken_references.md`

### VALIDATE_CONTENT

**Format**: `VALIDATE_CONTENT [file_path] FOR [required_sections] WITH_DEPTH [detail_level] REPORTING [missing_content]`  
**Purpose**: Check content completeness  
**Example**: `VALIDATE_CONTENT PRDs/05-analytics/PRD.md FOR [Overview, User Stories, Technical Requirements, Sprint Breakdown] WITH_DEPTH detailed REPORTING content_gaps.md`

### VALIDATE_FORMAT

**Format**: `VALIDATE_FORMAT [file_path] AGAINST [style_guide] REPORTING [format_violations]`  
**Purpose**: Check markdown formatting and style compliance  
**Example**: `VALIDATE_FORMAT PRDs/05-analytics/tasklists/tasklist_sprint_01.md AGAINST table_format_spec REPORTING format_issues.md`

### VALIDATE_CONSISTENCY

**Format**: `VALIDATE_CONSISTENCY ACROSS [prd_list] FOR [consistency_rules] REPORTING [inconsistencies]`  
**Purpose**: Check consistency across multiple PRDs  
**Example**: `VALIDATE_CONSISTENCY ACROSS [all_active_prds] FOR [naming_conventions, sprint_numbering, task_id_format] REPORTING consistency_violations.md`

### VALIDATE_DEPENDENCIES

**Format**: `VALIDATE_DEPENDENCIES [prd_path] CHECKING [dependency_validity] REPORTING [invalid_deps]`  
**Purpose**: Validate dependencies.md entries  
**Example**: `VALIDATE_DEPENDENCIES PRDs/05-analytics/ CHECKING [version_format, package_existence, circular_deps] REPORTING dependency_issues.md`

### VALIDATE_COMPLIANCE

**Format**: `VALIDATE_COMPLIANCE [prd_path] WITH [standards] GENERATING [compliance_score]`  
**Purpose**: Generate compliance score against standards  
**Example**: `VALIDATE_COMPLIANCE PRDs/05-analytics/ WITH [.roo/guides/INSTRUCTION.md, .roo/guides/prompter.md] GENERATING compliance_report.md`

---

## PRD_Merger Action Words

### MERGE_ANALYZE

**Format**: `MERGE_ANALYZE [prd_list] FOR [overlap_types] REPORTING [merge_candidates]`  
**Purpose**: Analyze PRDs for merge opportunities  
**Example**: `MERGE_ANALYZE [PRDs/03-auth/, PRDs/08-user-mgmt/] FOR [overlapping_requirements, duplicate_features] REPORTING merge_analysis.md`

### MERGE_CONFLICT_DETECT

**Format**: `MERGE_CONFLICT_DETECT BETWEEN [prd_a] AND [prd_b] IN [content_areas] REPORTING [conflicts]`  
**Purpose**: Detect conflicting requirements between PRDs  
**Example**: `MERGE_CONFLICT_DETECT BETWEEN PRDs/03-auth/ AND PRDs/08-user-mgmt/ IN [user_model, authentication_flow] REPORTING merge_conflicts.md`

### MERGE_CONTENT

**Format**: `MERGE_CONTENT FROM [source_prds] INTO [target_prd] PRESERVING [traceability] RESOLVING [conflicts]`  
**Purpose**: Execute content merge with conflict resolution  
**Example**: `MERGE_CONTENT FROM [PRDs/03-auth/, PRDs/08-user-mgmt/] INTO PRDs/03-unified-auth/ PRESERVING [source_references] RESOLVING [user_model_conflict]`

### MERGE_SPRINTS

**Format**: `MERGE_SPRINTS FROM [source_prds] INTO [target_prd] RESEQUENCING [sprint_numbers] UPDATING [tasklists]`  
**Purpose**: Merge sprint structures  
**Example**: `MERGE_SPRINTS FROM [PRDs/03-auth/, PRDs/08-user-mgmt/] INTO PRDs/03-unified-auth/ RESEQUENCING [1-6] UPDATING [all_tasklists]`

### MERGE_DEPENDENCIES

**Format**: `MERGE_DEPENDENCIES FROM [source_prds] INTO [target_prd] DEDUPLICATING [packages] RESOLVING [version_conflicts]`  
**Purpose**: Merge dependencies.md files  
**Example**: `MERGE_DEPENDENCIES FROM [PRDs/03-auth/, PRDs/08-user-mgmt/] INTO PRDs/03-unified-auth/ DEDUPLICATING [react, express] RESOLVING [version_mismatches]`

### MERGE_ARCHIVE

**Format**: `MERGE_ARCHIVE [source_prds] TO [archive_location] WITH_REFERENCE [merge_target] DOCUMENTING [merge_reason]`  
**Purpose**: Archive source PRDs after merge  
**Example**: `MERGE_ARCHIVE [PRDs/03-auth/, PRDs/08-user-mgmt/] TO PRDs/archive/ WITH_REFERENCE PRDs/03-unified-auth/ DOCUMENTING "Consolidated into unified auth PRD"`

### MERGE_TRACEABILITY_MAP

**Format**: `MERGE_TRACEABILITY_MAP FROM [source_prds] TO [target_prd] TRACKING [content_origins] DOCUMENTING [merge_map]`  
**Purpose**: Create traceability map for merged content  
**Example**: `MERGE_TRACEABILITY_MAP FROM [PRDs/03-auth/, PRDs/08-user-mgmt/] TO PRDs/03-unified-auth/ TRACKING [requirements, sprints, tasks] DOCUMENTING merge_traceability.md`

---

## PRD_Resequencer Action Words

### RESEQUENCE_ANALYZE

**Format**: `RESEQUENCE_ANALYZE [prd_path] FOR [sequence_type] BUILDING [dependency_graph] REPORTING [issues]`  
**Purpose**: Analyze current sequence and build dependency graph  
**Example**: `RESEQUENCE_ANALYZE PRDs/05-analytics/ FOR [sprint_order, task_dependencies] BUILDING dependency_graph.md REPORTING sequence_issues.md`

### RESEQUENCE_DEPENDENCY_GRAPH

**Format**: `RESEQUENCE_DEPENDENCY_GRAPH FOR [prd_path] WITH_DEPTH [levels] DETECTING [circular_deps] OUTPUTTING [graph_format]`  
**Purpose**: Build and visualize dependency graph  
**Example**: `RESEQUENCE_DEPENDENCY_GRAPH FOR PRDs/05-analytics/ WITH_DEPTH 5 DETECTING [circular_dependencies] OUTPUTTING mermaid_diagram`

### RESEQUENCE_SPRINTS

**Format**: `RESEQUENCE_SPRINTS IN [prd_path] FROM [old_order] TO [new_order] PRESERVING [dependencies] UPDATING [references]`  
**Purpose**: Reorder sprints while maintaining dependencies  
**Example**: `RESEQUENCE_SPRINTS IN PRDs/05-analytics/ FROM [S1,S2,S3,S4] TO [S1,S3,S2,S4] PRESERVING [all_dependencies] UPDATING [PRD.md, tasklists, sub-sprints]`

### RESEQUENCE_TASKS

**Format**: `RESEQUENCE_TASKS IN [tasklist_path] USING [algorithm] OPTIMIZING [criteria] DOCUMENTING [rationale]`  
**Purpose**: Reorder tasks for optimal execution  
**Example**: `RESEQUENCE_TASKS IN PRDs/05-analytics/tasklists/tasklist_sprint_01.md USING topological_sort OPTIMIZING [minimize_blocking, maximize_parallelism] DOCUMENTING resequence_rationale.md`

### RESEQUENCE_PARALLEL_GROUPS

**Format**: `RESEQUENCE_PARALLEL_GROUPS IN [prd_path] IDENTIFYING [independent_tasks] CREATING [execution_groups] ESTIMATING [time_savings]`  
**Purpose**: Group independent tasks for parallel execution  
**Example**: `RESEQUENCE_PARALLEL_GROUPS IN PRDs/05-analytics/ IDENTIFYING [independent_tasks] CREATING [group_1, group_2, group_3] ESTIMATING 40_percent_time_reduction`

### RESEQUENCE_CRITICAL_PATH

**Format**: `RESEQUENCE_CRITICAL_PATH FOR [prd_path] IDENTIFYING [bottlenecks] OPTIMIZING [path_length] REPORTING [critical_tasks]`  
**Purpose**: Identify and optimize critical path  
**Example**: `RESEQUENCE_CRITICAL_PATH FOR PRDs/05-analytics/ IDENTIFYING [blocking_tasks] OPTIMIZING [shortest_path] REPORTING critical_path_analysis.md`

### RESEQUENCE_VALIDATE

**Format**: `RESEQUENCE_VALIDATE [prd_path] CHECKING [dependency_satisfaction] DETECTING [violations] REPORTING [validation_results]`  
**Purpose**: Validate resequenced order satisfies all dependencies  
**Example**: `RESEQUENCE_VALIDATE PRDs/05-analytics/ CHECKING [all_dependencies_met] DETECTING [circular_deps, missing_deps] REPORTING validation_report.md`

---

## PRD_Logical_Sorter Action Words

### LOGICAL_ANALYZE

**Format**: `LOGICAL_ANALYZE [prd_scope] FOR [dependency_types] BUILDING [analysis_output]`
**Purpose**: Analyze implementation dependencies across PRDs
**Example**: `LOGICAL_ANALYZE [PRDs/03-auth/, PRDs/07-user-mgmt/] FOR [implementation_dependencies, data_flow] BUILDING dependency_matrix.md`

### LOGICAL_SEQUENCE

**Format**: `LOGICAL_SEQUENCE [prd_list] USING [sequencing_algorithm] OPTIMIZING [optimization_criteria]`
**Purpose**: Determine optimal implementation sequence
**Example**: `LOGICAL_SEQUENCE [all_active_prds] USING topological_sort OPTIMIZING [minimize_blocking, maximize_parallelism]`

### LOGICAL_DEPENDENCY_GRAPH

**Format**: `LOGICAL_DEPENDENCY_GRAPH FOR [prd_scope] WITH_DEPTH [levels] STORING [graph_analysis]`
**Purpose**: Build and analyze dependency relationships
**Example**: `LOGICAL_DEPENDENCY_GRAPH FOR PRDs/05-analytics/ WITH_DEPTH 3 STORING dependency_relationships`

### LOGICAL_CRITICAL_PATH

**Format**: `LOGICAL_CRITICAL_PATH FOR [implementation_roadmap] IDENTIFYING [bottlenecks] OPTIMIZING [timeline]`
**Purpose**: Identify and optimize critical development path
**Example**: `LOGICAL_CRITICAL_PATH FOR full_implementation_roadmap IDENTIFYING blocking_tasks OPTIMIZING development_timeline`

### LOGICAL_PARALLEL_GROUPS

**Format**: `LOGICAL_PARALLEL_GROUPS IN [task_collection] IDENTIFYING [independent_work] STORING [parallel_execution_groups]`
**Purpose**: Group independent work for parallel development
**Example**: `LOGICAL_PARALLEL_GROUPS IN all_sprint_tasks IDENTIFYING independent_tasks STORING parallel_execution_groups`

### LOGICAL_RESOLVE_CONFLICTS

**Format**: `LOGICAL_RESOLVE_CONFLICTS ACROSS [prd_list] FOR [conflict_types] STORING [resolution_strategies]`
**Purpose**: Resolve dependency conflicts and circular references
**Example**: `LOGICAL_RESOLVE_CONFLICTS ACROSS [PRDs/01-foundation/, PRDs/05-analytics/] FOR circular_dependencies STORING resolution_strategies`

### LOGICAL_PROPOSE_SEQUENCE

**Format**: `LOGICAL_PROPOSE_SEQUENCE [old_order] TO [new_order] WITH [rationale] FOR [prd_scope]`
**Purpose**: Propose specific resequencing with detailed rationale
**Example**: `LOGICAL_PROPOSE_SEQUENCE [S1,S2,S3,S4] TO [S1,S3,S2,S4] WITH [eliminates_blocking_S2_on_S3] FOR PRDs/23-feature/`

---

## PRD_Orchestrator Action Words

### ORCHESTRATE_WORKFLOW

**Format**: `ORCHESTRATE_WORKFLOW [workflow_name] USING_AGENTS [agent_list] IN_SEQUENCE [execution_order] WITH_CHECKPOINTS [validation_points]`  
**Purpose**: Execute complex multi-agent workflow  
**Example**: `ORCHESTRATE_WORKFLOW "PRD_Ecosystem_Sync" USING_AGENTS [Dependency_Manager, Validator, Resequencer] IN_SEQUENCE [dep_sync→validate→resequence] WITH_CHECKPOINTS [after_each_agent]`

### ORCHESTRATE_INVOKE_AGENT

**Format**: `ORCHESTRATE_INVOKE_AGENT [agent_name] WITH_TASK [task_description] PASSING_DATA [input_data] EXPECTING_OUTPUT [output_format]`  
**Purpose**: Invoke specific agent with task and data  
**Example**: `ORCHESTRATE_INVOKE_AGENT Dependency_Manager WITH_TASK "Sync React versions" PASSING_DATA [prd_list] EXPECTING_OUTPUT dependency_sync_report.md`

### ORCHESTRATE_CHECKPOINT

**Format**: `ORCHESTRATE_CHECKPOINT AT [workflow_stage] VALIDATING [validation_criteria] ON_FAILURE [rollback_action]`  
**Purpose**: Create validation checkpoint in workflow  
**Example**: `ORCHESTRATE_CHECKPOINT AT "After_Dependency_Sync" VALIDATING [no_conflicts, all_prds_updated] ON_FAILURE rollback_to_previous_state`

### ORCHESTRATE_PARALLEL_AGENTS

**Format**: `ORCHESTRATE_PARALLEL_AGENTS [agent_list] WITH_TASKS [task_list] SYNCHRONIZING_AT [sync_point] MERGING_OUTPUTS [merge_strategy]`  
**Purpose**: Execute multiple agents in parallel  
**Example**: `ORCHESTRATE_PARALLEL_AGENTS [Validator, Dependency_Manager] WITH_TASKS [validate_all_prds, scan_all_dependencies] SYNCHRONIZING_AT completion MERGING_OUTPUTS combined_report.md`

### ORCHESTRATE_ROLLBACK

**Format**: `ORCHESTRATE_ROLLBACK TO [checkpoint_name] UNDOING [operations] RESTORING [state] DOCUMENTING [rollback_reason]`  
**Purpose**: Rollback workflow to previous checkpoint  
**Example**: `ORCHESTRATE_ROLLBACK TO "Before_Merge" UNDOING [merge_operations] RESTORING [original_prds] DOCUMENTING "Merge conflicts unresolvable"`

### ORCHESTRATE_MONITOR

**Format**: `ORCHESTRATE_MONITOR [workflow_id] TRACKING [progress_metrics] REPORTING [status_updates] ALERTING_ON [error_conditions]`  
**Purpose**: Monitor ongoing orchestrated workflow  
**Example**: `ORCHESTRATE_MONITOR "PRD_Ecosystem_Sync_001" TRACKING [agents_completed, errors_encountered] REPORTING status_every_5_minutes ALERTING_ON [agent_failure, validation_failure]`

### ORCHESTRATE_COORDINATE

**Format**: `ORCHESTRATE_COORDINATE BETWEEN [agent_a] AND [agent_b] PASSING [data_flow] ENSURING [consistency_rules]`  
**Purpose**: Coordinate data flow between agents  
**Example**: `ORCHESTRATE_COORDINATE BETWEEN Merger AND Resequencer PASSING [merged_prd_structure] ENSURING [dependency_integrity, sprint_numbering_consistency]`

---

## Usage Guidelines

### 1. Always Use Agent-Specific Action Words

When an agent-specific action word exists, use it instead of generic action words.

**Bad**: `SEARCH PRDs/05-analytics/ for dependencies`  
**Good**: `DEPENDENCY_SCAN PRDs/05-analytics/ FOR [npm_packages] DOCUMENTING conflicts.md`

### 2. Include All Required Parameters

Every action word has required parameters in brackets `[]`. Always specify them.

**Bad**: `VALIDATE_STRUCTURE PRDs/05-analytics/`  
**Good**: `VALIDATE_STRUCTURE PRDs/05-analytics/ AGAINST [PRD.md, README.md] REPORTING structure_issues.md`

### 3. Use Descriptive Parameter Values

Make parameter values specific and actionable.

**Bad**: `MERGE_CONTENT FROM [sources] INTO [target]`  
**Good**: `MERGE_CONTENT FROM [PRDs/03-auth/, PRDs/08-user-mgmt/] INTO PRDs/03-unified-auth/ PRESERVING [source_references] RESOLVING [user_model_conflict]`

### 4. Combine with Sequential Thinking

For complex operations, use `SEQUENTIAL_THINK` before agent-specific action words.

```
1. SEQUENTIAL_THINK "Dependency Analysis" WITH STAGES [Problem Definition, Analysis, Synthesis]
2. DEPENDENCY_SCAN PRDs/05-analytics/ FOR [all_dependencies] DOCUMENTING scan_results.md
3. DEPENDENCY_CONFLICT_DETECT ACROSS [all_prds] REPORTING [critical]
```

### 5. Document Outputs

Always specify output files/formats in action words.

**Bad**: `VALIDATE_COMPLIANCE PRDs/05-analytics/`  
**Good**: `VALIDATE_COMPLIANCE PRDs/05-analytics/ WITH [.roo/guides/INSTRUCTION.md] GENERATING compliance_report.md`

---

## Quick Reference by Use Case

### Feature Intake

- Request Validation: `INTAKE_VALIDATE_REQUEST`
- Clarification: `INTAKE_REQUEST_CLARIFICATION`
- Number Assignment: `INTAKE_DETERMINE_NUMBER`
- Folder Creation: `INTAKE_CREATE_FOLDER`
- Content Population: `INTAKE_POPULATE_PRD`, `INTAKE_POPULATE_SIDECAR`
- Registration: `INTAKE_REGISTER_FEATURE`
- Delegation: `INTAKE_DELEGATE_VALIDATION`, `INTAKE_DELEGATE_DEPENDENCY_SYNC`
- Completion: `INTAKE_COMPLETE`

### Dependency Management

- Scanning: `DEPENDENCY_SCAN`
- Syncing: `DEPENDENCY_SYNC`
- Conflict Detection: `DEPENDENCY_CONFLICT_DETECT`
- Resolution: `DEPENDENCY_RESOLVE`
- Validation: `DEPENDENCY_VALIDATE`

### Validation

- Structure: `VALIDATE_STRUCTURE`
- Content: `VALIDATE_CONTENT`
- Cross-refs: `VALIDATE_CROSS_REFS`
- Compliance: `VALIDATE_COMPLIANCE`

### Merging

- Analysis: `MERGE_ANALYZE`
- Conflict Detection: `MERGE_CONFLICT_DETECT`
- Execution: `MERGE_CONTENT`, `MERGE_SPRINTS`, `MERGE_DEPENDENCIES`
- Archival: `MERGE_ARCHIVE`
- Traceability: `MERGE_TRACEABILITY_MAP`

### Resequencing

- Analysis: `RESEQUENCE_ANALYZE`
- Execution: `RESEQUENCE_SPRINTS`, `RESEQUENCE_TASKS`
- Optimization: `RESEQUENCE_PARALLEL_GROUPS`, `RESEQUENCE_CRITICAL_PATH`
- Validation: `RESEQUENCE_VALIDATE`

### Logical Analysis

- Dependencies: `LOGICAL_ANALYZE`
- Sequencing: `LOGICAL_SEQUENCE`, `LOGICAL_PROPOSE_SEQUENCE`
- Visualization: `LOGICAL_DEPENDENCY_GRAPH`
- Optimization: `LOGICAL_CRITICAL_PATH`, `LOGICAL_PARALLEL_GROUPS`
- Conflict Resolution: `LOGICAL_RESOLVE_CONFLICTS`

### Orchestration

- Workflow: `ORCHESTRATE_WORKFLOW`
- Agent Invocation: `ORCHESTRATE_INVOKE_AGENT`
- Checkpoints: `ORCHESTRATE_CHECKPOINT`
- Rollback: `ORCHESTRATE_ROLLBACK`
- Monitoring: `ORCHESTRATE_MONITOR`

---

## See Also

- **.roo/guides/prompter.md**: Full agent templates with Sequential Thinking protocols
- **PROMPTER_AGENT_TEMPLATES_SUMMARY.md**: Detailed summary of all agent templates
- **.roo/guides/INSTRUCTION.md**: PRD structure and content requirements
