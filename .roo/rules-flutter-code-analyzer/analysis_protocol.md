# Flutter Code Analyzer Rules

## Overview

The Flutter Code Analyzer performs deep, comprehensive analysis of individual Flutter/Dart files to identify code quality issues, test coverage gaps, and best practices violations. This protocol ensures consistent, thorough analysis that coordinates with other Flutter agents for complete code improvement solutions.

## Analysis Framework

### 1. File Reception & Context Analysis

**Initial Analysis Protocol:**
```bash
# Read target file completely
Read /path/to/flutter_file.dart

# Analyze file structure and dependencies
# Identify file type: model, service, widget, screen, utility
# Determine complexity and maintenance requirements
```

**File Classification System:**
- **Model Classes**: Data structures, JSON serialization, business logic
- **Service Classes**: External API integration, Firebase, HTTP clients
- **Widget Classes**: UI components, state management, user interactions
- **Screen Classes**: Full-screen compositions, navigation, routing
- **Provider Classes**: State management, dependency injection
- **Utility Classes**: Helpers, validators, formatters, extensions

### 2. Comprehensive Code Quality Analysis

**A. Code Structure & Organization Assessment:**

**Naming Conventions:**
```dart
// ✅ Good
class UserSessionService { ... }
void validateEmailInput() { ... }
final isUserLoggedIn = true;

// ❌ Bad
class userservice { ... }
void checkemail() { ... }
final loggedin = true;
```

**File Organization:**
- Proper import grouping (dart, flutter, third-party, local)
- Logical class and method organization
- Appropriate file length (ideally < 300 lines)
- Clear separation of concerns

**Documentation Standards:**
- dartdoc comments for all public APIs
- Clear method and parameter descriptions
- Usage examples for complex functionality
- TODO comments with future improvement plans

**B. Flutter/Dart Best Practices Assessment:**

**Widget Lifecycle Management:**
```dart
// ✅ Good
class MyWidget extends StatefulWidget {
  @override
  _MyWidgetState createState() => _MyWidgetState();
}

class _MyWidgetState extends State<MyWidget> {
  StreamSubscription? _subscription;

  @override
  void initState() {
    super.initState();
    _subscription = someStream.listen(callback);
  }

  @override
  void dispose() {
    _subscription?.cancel();
    super.dispose();
  }
}
```

**State Management Patterns:**
- Proper Provider usage with `ChangeNotifier`
- Correct BLoC pattern implementation
- Appropriate setState usage
- State immutability where applicable

**Async/Await & Error Handling:**
```dart
// ✅ Good
Future<void> loadData() async {
  try {
    final result = await apiService.fetchData();
    setState(() => data = result);
  } catch (e) {
    _handleError(e);
  }
}

// ❌ Bad
void loadData() {
  apiService.fetchData().then((result) {
    setState(() => data = result);
  });
}
```

**Null Safety Compliance:**
- Proper nullable and non-nullable type usage
- Null assertion operators used appropriately
- Default values and null checks
- Late keyword usage for deferred initialization

**C. API Usage & Integration Assessment:**

**Firebase Service Integration:**
```dart
// ✅ Good
class AuthService {
  final FirebaseAuth _auth = FirebaseAuth.instance;

  Future<User?> signIn(String email, String password) async {
    try {
      final result = await _auth.signInWithEmailAndPassword(
        email: email,
        password: password,
      );
      return result.user;
    } on FirebaseAuthException catch (e) {
      throw AuthException(e.message);
    }
  }
}
```

**HTTP Client Usage (Dio):**
- Proper error handling and retry logic
- Request/response interceptors
- Timeout configuration
- Request cancellation

**Data Modeling & Serialization:**
```dart
// ✅ Good
class User {
  final String id;
  final String email;
  final String name;

  const User({
    required this.id,
    required this.email,
    required this.name,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as String,
      email: json['email'] as String,
      name: json['name'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'name': name,
    };
  }
}
```

**D. Performance & Optimization Assessment:**

**Widget Rebuild Optimization:**
```dart
// ✅ Good
class OptimizedWidget extends StatelessWidget {
  final String title;
  final VoidCallback onPressed;

  const OptimizedWidget({
    Key? key,
    required this.title,
    required this.onPressed,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      onPressed: onPressed,
      child: Text(title),
    );
  }
}
```

**List and Grid Performance:**
- Use `ListView.builder` for long lists
- Implement proper itemExtent for predictable heights
- Use `AutomaticKeepAliveClientMixin` appropriately
- Implement image caching and lazy loading

**Memory Management:**
- Proper controller disposal
- Stream subscription cancellation
- Timer and animation controller cleanup
- Image and resource management

### 3. Test Coverage Analysis

**Existing Test Discovery:**
```bash
# Find corresponding test files
find mobile/test -name "*${filename}_test.dart" -type f

# Check for related test files
find mobile/test -name "*${classname}_test.dart" -type f
```

**Coverage Assessment Protocol:**
- Analyze existing test files for completeness
- Identify untested public methods and properties
- Check for missing edge case coverage
- Evaluate test quality and meaningfulness

**Gap Identification:**
- Constructor validation tests
- Business logic method coverage
- Error handling scenario tests
- Widget interaction tests
- State change verification

### 4. Code Formatting & Linting

**Automated Checks:**
```bash
# Check formatting compliance
dart format --dry-run /path/to/file.dart

# Run static analysis
flutter analyze /path/to/file.dart
```

**Common Issues to Identify:**
- Inconsistent indentation and spacing
- Missing or incorrect import statements
- Unused imports and variables
- Naming convention violations
- Missing documentation for public APIs

### 5. AST-Assisted Analysis

**Pattern Detection:**
```dart
// Use ast-grep to find problematic patterns
// Example: Find setState calls in build methods
pattern: "setState.*build"
language: "dart"
```

**Common Anti-Patterns:**
- Build method complexity
- Excessive widget nesting
- Improper async usage
- Memory leak patterns
- Performance bottlenecks

### 6. MCP Memory Integration

**Store Analysis Results:**
```javascript
mcp__memory__create_entities({
  entities: [{
    name: "flutter_analysis_${filename}",
    entityType: "code_analysis",
    observations: [
      "quality_score: ${score}/100",
      "test_coverage: ${coverage}%",
      "critical_issues: ${critical_count}",
      "warning_issues: ${warning_count}",
      "recommendations: ${recommendations_count}",
      "analysis_date: ${timestamp}"
    ]
  }]
})
```

**Create Relations:**
```javascript
mcp__memory__create_relations({
  relations: [
    {
      from: "flutter_file_${filename}",
      to: "test_file_${testname}",
      relationType: "requires_test_coverage"
    },
    {
      from: "flutter_file_${filename}",
      to: "quality_issue_${issue_id}",
      relationType: "has_issue"
    }
  ]
})
```

### 7. Analysis Output Structure

**Standard Analysis Report:**

```markdown
## File Analysis Report: ${filename}

### File Summary
- **Purpose**: ${file_purpose}
- **Type**: ${file_type}
- **Complexity**: ${complexity_score}/10
- **Dependencies**: ${dependency_count}

### Quality Assessment
- **Overall Score**: ${quality_score}/100
- **Critical Issues**: ${critical_count}
- **Warnings**: ${warning_count}
- **Info**: ${info_count}

### Test Coverage
- **Current Coverage**: ${coverage_percentage}%
- **Required Coverage**: 80%
- **Gap Analysis**: ${specific_gaps}

### Issues Found
#### Critical Issues
1. ${issue_description}
2. ${issue_description}

#### Warning Issues
1. ${issue_description}
2. ${issue_description}

### Recommendations
1. ${specific_recommendation}
2. ${specific_recommendation}

### Next Steps
- Delegate to flutter-test-creator: ${needs_tests}
- Delegate to flutter-code-fixer: ${needs_fixes}
```

### 8. Delegation Coordination

**Test Creation Delegation:**
```bash
if (coverage_percentage < 80 || critical_untested_methods) {
  new_task -m flutter-test-creator "Create comprehensive test suite for ${filepath} focusing on: ${uncovered_areas}"
}
```

**Code Fixing Delegation:**
```bash
if (critical_issues > 0 || quality_score < 70) {
  new_task -m flutter-code-fixer "Fix critical code quality issues in ${filepath}: ${issue_list}"
}
```

## Quality Standards

**Analysis Completeness:**
- 100% of public methods analyzed
- All import statements reviewed
- Widget lifecycle fully examined
- Performance implications assessed

**Reporting Standards:**
- Specific, actionable recommendations only
- Quantitative metrics for all assessments
- Clear priority assignment for issues
- Estimated effort for recommended fixes

**Best Practices Reference:**
- Current Flutter documentation (2025)
- Dart language style guide
- Effective Dart guidelines
- Flutter testing best practices

## Critical Requirements

### MUST ANALYZE:
- All public methods and properties
- Widget lifecycle implementation
- Async/await error handling
- State management patterns
- Performance implications

### MUST REPORT:
- Quantitative quality metrics
- Specific improvement recommendations
- Test coverage gaps with percentages
- Code complexity assessments

### MUST COORDINATE:
- With flutter-test-creator for coverage gaps
- With flutter-code-fixer for quality issues
- With orchestrator for progress tracking
- With memory graph for historical data

## Analysis Validation

**Self-Validation Checklist:**
- [ ] Entire file read and understood
- [ ] All imports analyzed
- [ ] Public methods assessed
- [ ] Quality metrics calculated
- [ ] Recommendations are specific and actionable
- [ ] Memory integration completed
- [ ] Delegation decisions justified

**Quality Assurance:**
- Analysis consistency across similar files
- Priority assignment accuracy
- Recommendation feasibility assessment
- Memory graph integration verification