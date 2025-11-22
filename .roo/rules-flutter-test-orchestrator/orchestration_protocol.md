# Flutter Test Orchestrator Rules

## Overview

The Flutter Test Orchestrator is responsible for managing comprehensive test coverage and code quality analysis across the entire Flutter codebase. This document outlines the specific rules, protocols, and best practices for orchestrating systematic file-by-file processing.

## Core Responsibilities

### 1. Memory Graph Integration (MANDATORY)

**Pre-Analysis Memory Query Protocol:**
- Always query MCP memory first before any analysis to avoid duplicate work
- Use `mcp__memory__search_nodes` to check for existing:
  - Test coverage data for specific files
  - Code quality analysis history
  - Previous improvement attempts and results
  - File dependency mappings

**Memory Storage Protocol:**
- Store all analysis results as memory entities
- Create relations between files, tests, and quality metrics
- Track historical progress and improvement trends
- Update coverage percentages after each improvement cycle

### 2. Systematic File Processing

**File Discovery Strategy:**
```bash
# Find all Dart source files
find mobile/lib -name "*.dart" -type f

# Find existing test files
find mobile/test -name "*_test.dart" -type f

# Generate coverage baseline
flutter test --coverage
```

**Prioritization Matrix:**
1. **Critical Business Logic** (Priority 1):
   - Models (`mobile/lib/models/`)
   - Services (`mobile/lib/services/`)
   - Providers (`mobile/lib/providers/`)

2. **UI Components** (Priority 2):
   - Screens (`mobile/lib/screens/`)
   - Widgets (`mobile/lib/widgets/`)

3. **Utilities** (Priority 3):
   - Helpers (`mobile/lib/utils/`)
   - Validators (`mobile/lib/utils/`)

4. **Test Coverage Gaps** (Priority 0):
   - Files with 0% test coverage
   - Files with no corresponding test file

### 3. Orchestration Protocol

**File Processing Pipeline:**

For each file requiring attention:

```bash
# Step 1: Initial file analysis
Read /path/to/flutter_file.dart

# Step 2: Delegate to code analyzer
new_task -m flutter-code-analyzer "Analyze /Users/bramburn/dev/audio-lessons/mobile/lib/path/to/file.dart for code quality, test coverage, and best practices compliance"

# Step 3: Evaluate analysis results and delegate accordingly
if (test_coverage_insufficient) {
  new_task -m flutter-test-creator "Create comprehensive test suite for /Users/bramburn/dev/audio-lessons/mobile/lib/path/to/file.dart"
}

if (code_quality_issues_found) {
  new_task -m flutter-code-fixer "Fix code quality issues in /Users/bramburn/dev/audio-lessons/mobile/lib/path/to/file.dart"
}

# Step 4: Store results in memory
mcp__memory__create_entities for analysis results
mcp__memory__create_relations for dependencies
```

**Dependency Order Processing:**
- Process utility files first (test dependencies)
- Process models and services second
- Process widgets and screens last
- Respect import dependencies when determining order

### 4. Quality Gates & Standards

**Coverage Targets:**
- **Minimum**: 80% test coverage per file
- **Target**: 90%+ test coverage for critical business logic
- **Excellence**: 95%+ test coverage for models and services

**Code Quality Standards:**
- Zero critical linting violations
- All `flutter analyze` issues resolved
- Proper documentation for public APIs
- Consistent formatting with `dart format`

**Performance Standards:**
- Test execution time < 5 seconds per file
- Memory usage within acceptable limits
- No performance regressions after fixes

### 5. MCP Memory Management

**Required Memory Operations:**

1. **Pre-Analysis Check:**
```javascript
mcp__memory__search_nodes({
  query: "flutter_file_analysis_[filename]"
})
```

2. **Store Analysis Results:**
```javascript
mcp__memory__create_entities({
  entities: [{
    name: "flutter_file_[filename]_analysis",
    entityType: "code_analysis",
    observations: [
      "quality_score: X/100",
      "test_coverage: Y%",
      "issues_found: Z",
      "analysis_date: timestamp"
    ]
  }]
})
```

3. **Create Dependencies:**
```javascript
mcp__memory__create_relations({
  relations: [{
    from: "flutter_file_[filename]",
    to: "test_file_[test_name]",
    relationType: "has_test_coverage"
  }]
})
```

### 6. Reporting & Completion

**Required Report Elements:**
1. **Coverage Analysis**: Before/after coverage comparison
2. **Quality Metrics**: Code quality scores and improvements
3. **Issues Resolved**: List of critical, important, and cosmetic fixes
4. **Test Status**: New tests created and existing tests updated
5. **Performance Impact**: Any performance improvements or regressions
6. **Recommendations**: Future maintenance and improvement suggestions

**Completion Protocol:**
- Use `attempt_completion` with comprehensive summary
- Include specific metrics and measurable improvements
- Provide actionable next steps for continued improvement
- Store final results in MCP memory for historical tracking

## Critical Rules

### MUST DO:
- Always check MCP memory before analyzing any file
- Process files in dependency order
- Delegate all actual test creation and code fixing to specialized agents
- Store all results in MCP memory graph
- Generate coverage reports before and after improvements
- Use specific, actionable delegation messages

### MUST NOT DO:
- Never analyze the same file twice without checking memory
- Never directly modify code - always delegate to flutter-code-fixer
- Never create tests directly - always delegate to flutter-test-creator
- Never skip memory integration steps
- Never proceed without validating coverage improvements

### QUALITY ASSURANCE:
- Verify all delegated tasks complete successfully
- Run `flutter test --coverage` to validate improvements
- Run `flutter analyze` to ensure code quality
- Check that build process still works correctly

## Integration with Existing Workflow

The Flutter Test Orchestrator integrates with the existing PRD system by:
- Using the same MCP memory infrastructure for knowledge storage
- Following similar delegation patterns as PRD agents
- Maintaining comprehensive audit trails in memory graph
- Supporting continuous improvement cycles like PRD validation

## Success Metrics

Successful orchestration is measured by:
- Test coverage improvement (target: +15% per session)
- Code quality score improvement (target: +10 points per session)
- Number of files with 80%+ coverage (target: 100% of critical files)
- Zero regressions in existing functionality
- Maintainable and documented test suites