# Flutter Agents MCP Memory Integration Rules

## Overview

This document defines the mandatory MCP memory integration protocols for all Flutter testing agents. Memory integration ensures continuity, prevents duplicate work, and maintains comprehensive audit trails for all code quality and testing activities.

## Memory Graph Schema

### Entity Types

**Flutter File Entities:**
```javascript
{
  "name": "flutter_file_[filename]",
  "entityType": "flutter_source_file",
  "observations": [
    "file_path: /mobile/lib/path/to/file.dart",
    "file_type: model|service|widget|screen|provider|utility",
    "line_count: 123",
    "complexity_score: 7/10",
    "last_modified: timestamp",
    "dependencies: [dependency1, dependency2]",
    "test_files: [test_file1, test_file2]"
  ]
}
```

**Test Suite Entities:**
```javascript
{
  "name": "flutter_test_[test_filename]",
  "entityType": "test_suite",
  "observations": [
    "source_file: /mobile/lib/path/to/file.dart",
    "coverage_achieved: 87%",
    "test_types: unit,widget,integration",
    "test_count: 23",
    "mocks_used: [MockService, MockRepository]",
    "creation_date: timestamp",
    "last_execution: timestamp",
    "execution_time_ms: 2456"
  ]
}
```

**Analysis Entities:**
```javascript
{
  "name": "flutter_analysis_[filename]_[timestamp]",
  "entityType": "code_analysis",
  "observations": [
    "analyzed_file: /mobile/lib/path/to/file.dart",
    "quality_score: 73/100",
    "critical_issues: 2",
    "warning_issues: 5",
    "info_issues: 12",
    "test_coverage: 45%",
    "recommendations_count: 8",
    "analysis_agent: flutter-code-analyzer",
    "analysis_duration_ms: 1234"
  ]
}
```

**Code Fix Entities:**
```javascript
{
  "name": "flutter_fix_[filename]_[timestamp]",
  "entityType": "code_fix",
  "observations": [
    "fixed_file: /mobile/lib/path/to/file.dart",
    "critical_issues_fixed: 3",
    "warning_issues_fixed: 7",
    "performance_improvements: 2",
    "security_improvements: 1",
    "quality_score_before: 62/100",
    "quality_score_after: 84/100",
    "fixing_agent: flutter-code-fixer",
    "breaking_changes: false"
  ]
}
```

### Relation Types

**File Dependencies:**
```javascript
{
  "from": "flutter_file_[filename]",
  "to": "flutter_file_[dependency_filename]",
  "relationType": "imports"
}
```

**Test Coverage:**
```javascript
{
  "from": "flutter_test_[test_filename]",
  "to": "flutter_file_[source_filename]",
  "relationType": "tests"
}
```

**Required Testing:**
```javascript
{
  "from": "flutter_file_[filename]",
  "to": "flutter_test_[expected_test_filename]",
  "relationType": "requires_test_coverage"
}
```

**Code Issues:**
```javascript
{
  "from": "flutter_file_[filename]",
  "to": "flutter_issue_[issue_id]",
  "relationType": "has_issue"
}
```

**Applied Fixes:**
```javascript
{
  "from": "flutter_fix_[fix_id]",
  "to": "flutter_file_[filename]",
  "relationType": "fixed"
}
```

## Mandatory Memory Operations

### 1. Pre-Analysis Checks (MANDATORY)

All agents MUST query memory before analyzing any file:

```javascript
// Check if file has been recently analyzed
mcp__memory__search_nodes({
  query: "flutter_analysis_[filename] AND analysis_date > [24_hours_ago]"
})

// Check for existing test coverage data
mcp__memory__search_nodes({
  query: "flutter_test_[source_filename] AND creation_date > [7_days_ago]"
})

// Check for recent fixes applied
mcp__memory__search_nodes({
  query: "flutter_fix_[filename] AND creation_date > [7_days_ago]"
})
```

### 2. Analysis Result Storage (MANDATORY)

After completing any analysis, agents MUST store results:

```javascript
mcp__memory__create_entities({
  entities: [{
    name: "flutter_analysis_[filename]_[timestamp]",
    entityType: "code_analysis",
    observations: [
      "analyzed_file: ${filepath}",
      "quality_score: ${calculated_score}/100",
      "critical_issues: ${critical_count}",
      "warning_issues: ${warning_count}",
      "info_issues: ${info_count}",
      "test_coverage: ${coverage_percentage}%",
      "recommendations_count: ${rec_count}",
      "analysis_agent: flutter-code-analyzer",
      "analysis_duration_ms: ${duration}"
    ]
  }]
})
```

### 3. Test Metadata Storage (MANDATORY)

When creating tests, agents MUST store comprehensive metadata:

```javascript
mcp__memory__create_entities({
  entities: [{
    name: "flutter_test_[test_filename]",
    entityType: "test_suite",
    observations: [
      "source_file: ${source_file_path}",
      "coverage_achieved: ${coverage_percentage}%",
      "test_types: ${test_types.join(',')}",
      "test_count: ${total_tests}",
      "mocks_used: ${mock_list.join(',')}",
      "creation_agent: flutter-test-creator",
      "creation_date: ${timestamp}",
      "file_size_bytes: ${file_size}"
    ]
  }]
})
```

### 4. Fix History Storage (MANDATORY)

When applying code fixes, agents MUST track all changes:

```javascript
mcp__memory__create_entities({
  entities: [{
    name: "flutter_fix_[filename]_[timestamp]",
    entityType: "code_fix",
    observations: [
      "fixed_file: ${filepath}",
      "critical_issues_fixed: ${critical_fixed}",
      "warning_issues_fixed: ${warnings_fixed}",
      "performance_improvements: ${perf_improvements}",
      "security_improvements: ${security_improvements}",
      "quality_score_before: ${before_score}/100",
      "quality_score_after: ${after_score}/100",
      "fixing_agent: flutter-code-fixer",
      "breaking_changes: ${has_breaking_changes}",
      "files_modified: ${modified_files_count}"
    ]
  }]
})
```

### 5. Relationship Management (MANDATORY)

Agents MUST create appropriate relations:

```javascript
// File-to-test relations
mcp__memory__create_relations({
  relations: [{
    from: "flutter_test_[test_filename]",
    to: "flutter_file_[source_filename]",
    relationType: "tests"
  }]
})

// File-to-issue relations
mcp__memory__create_relations({
  relations: [{
    from: "flutter_file_[filename]",
    to: "flutter_issue_[issue_id]",
    relationType: "has_issue"
  }]
})

// Fix-to-file relations
mcp__memory__create_relations({
  relations: [{
    from: "flutter_fix_[fix_id]",
    to: "flutter_file_[filename]",
    relationType: "fixed"
  }]
})
```

## Memory Integration Workflow

### For flutter-test-orchestrator:

1. **Session Start**: Query memory for existing coverage data and analysis history
2. **File Selection**: Use memory data to prioritize files needing attention
3. **Progress Tracking**: Store session progress and intermediate results
4. **Session Completion**: Store final coverage improvements and quality metrics

### For flutter-code-analyzer:

1. **Pre-Analysis**: Check memory for recent analysis of target file
2. **Analysis Storage**: Store comprehensive analysis results
3. **Dependency Mapping**: Create relations for identified dependencies
4. **Delegation Tracking**: Store delegation recommendations and outcomes

### For flutter-test-creator:

1. **Coverage Check**: Query memory for existing test coverage
2. **Test Planning**: Use memory data to identify gaps and priorities
3. **Creation Tracking**: Store test metadata and coverage achievements
4. **Quality Assurance**: Store test execution results and quality metrics

### For flutter-code-fixer:

1. **Issue Verification**: Cross-reference issues with memory data
2. **Fix Planning**: Use memory history to avoid重复 fixes
3. **Change Tracking**: Store comprehensive fix history and impact
4. **Quality Validation**: Store before/after quality comparisons

## Data Consistency Rules

### Unique Naming Convention:
- `flutter_file_[filename]` - Source file entities
- `flutter_test_[test_filename]` - Test suite entities
- `flutter_analysis_[filename]_[timestamp]` - Analysis entities
- `flutter_fix_[filename]_[timestamp]` - Fix entities

### Timestamp Format:
Use ISO 8601 format: `2025-01-15T10:30:45Z`

### Score Formatting:
- Quality scores: `0-100/100` format
- Coverage percentages: `0-100%` format
- Complexity scores: `1-10/10` format

### File Path Consistency:
Always use absolute paths from project root:
`/Users/bramburn/dev/audio-lessons/mobile/lib/path/to/file.dart`

## Memory Query Patterns

### Finding Files Needing Attention:
```javascript
mcp__memory__search_nodes({
  query: "flutter_file_ AND (test_coverage < 80 OR quality_score < 70)"
})
```

### Tracking Progress Over Time:
```javascript
mcp__memory__search_nodes({
  query: "flutter_analysis_[filename] ORDER BY analysis_date DESC"
})
```

### Identifying Duplicate Work:
```javascript
mcp__memory__search_nodes({
  query: "flutter_analysis_[filename] AND analysis_date > [1_hour_ago]"
})
```

### Quality Trend Analysis:
```javascript
mcp__memory__search_nodes({
  query: "flutter_file_ AND (quality_score_history: [trend_data])"
})
```

## Integration with PRD System

The Flutter memory integration follows the same patterns as the PRD system:

### Shared Entity Types:
- Both systems use `observations` arrays for data storage
- Similar timestamp and naming conventions
- Consistent relation type patterns

### Cross-System Relations:
- Flutter files can be related to PRDs that require their implementation
- Test coverage can be linked to PRD quality requirements
- Code fixes can be tracked against PRD completion

### Audit Trail Continuity:
- All agent activities stored in unified memory graph
- Cross-reference between Flutter and PRD activities
- Comprehensive project-level quality tracking

## Performance Considerations

### Memory Query Optimization:
- Use specific queries to avoid large result sets
- Include timestamp filters for recent data
- Query by entity type when possible

### Storage Efficiency:
- Store only essential observations
- Use concise but descriptive content
- Avoid redundant data storage

### Relation Management:
- Create relations only when meaningful
- Use specific relation types
- Avoid circular relation dependencies

## Error Handling

### Memory Service Failures:
- Continue with analysis but log memory integration failure
- Retry memory operations with exponential backoff
- Provide alternative progress tracking

### Data Validation:
- Validate entity names follow naming conventions
- Ensure required observations are present
- Verify relation integrity

### Conflict Resolution:
- Use timestamps to resolve conflicting data
- Merge overlapping analysis results
- Maintain audit trail of resolution decisions

## Memory Integration Validation

Each Flutter agent must self-validate memory integration:

### Pre-Operation Validation:
- [ ] Memory service is accessible
- [ ] Required entity data is available
- [ ] No recent duplicate operations detected

### Post-Operation Validation:
- [ ] Entities created successfully
- [ ] Relations established correctly
- [ ] Data stored matches expected format
- [ ] Query verification passes

### Continuous Monitoring:
- Monitor memory service performance
- Track data consistency over time
- Validate cross-agent data integrity