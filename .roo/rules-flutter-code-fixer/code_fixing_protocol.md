# Flutter Code Fixer Rules

## Overview

The Flutter Code Fixer is responsible for implementing code quality improvements, refactoring Flutter code for better organization, and ensuring adherence to Flutter/Dart best practices. This protocol ensures systematic, safe code improvements while preserving existing functionality.

## Code Fixing Framework

### 1. Issue Analysis & Planning

**Issue Reception Protocol:**
```dart
// Receive specific code quality issues from flutter-code-analyzer
Input format: {
  "file_path": "/path/to/file.dart",
  "critical_issues": ["issue1", "issue2"],
  "warning_issues": ["issue3", "issue4"],
  "quality_score": 65,
  "priority_fixes": ["null_safety", "memory_leaks"]
}
```

**Impact Assessment:**
- **Critical Issues**: Fix immediately (security vulnerabilities, crashes)
- **Important Issues**: Fix in current session (performance, maintainability)
- **Cosmetic Issues**: Fix if time permits (formatting, documentation)
- **Breaking Changes**: Plan carefully, ensure test coverage first

**Fix Prioritization Matrix:**
```
Priority 1 (Critical):
- Null safety violations
- Memory leaks and disposal issues
- Security vulnerabilities
- Broken functionality

Priority 2 (Important):
- Performance bottlenecks
- Best practices violations
- Test coverage gaps
- Code organization issues

Priority 3 (Cosmetic):
- Formatting inconsistencies
- Documentation gaps
- Naming convention improvements
- Code style violations
```

### 2. Code Quality Fixes Implementation

**A. Formatting & Style Issues**

**Dart Format Compliance:**
```bash
# Apply automatic formatting
dart format /path/to/file.dart

# Verify formatting
dart format --dry-run /path/to/file.dart
```

**Naming Convention Fixes:**
```dart
// ❌ Before
class userservice {
  void checkemail() { }
  final loggedin = true;
}

// ✅ After
class UserService {
  void checkEmail() { }
  final isLoggedIn = true;
}
```

**Import Organization:**
```dart
// ❌ Before
import 'package:flutter/material.dart';
import 'dart:async';
import 'package:flutter/services.dart';
import '../models/user.dart';
import 'dart:io';

// ✅ After
import 'dart:async';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../models/user.dart';
```

**B. Best Practices Compliance**

**Widget Lifecycle Management:**
```dart
// ❌ Before - Memory leak
class MyWidget extends StatefulWidget {
  @override
  _MyWidgetState createState() => _MyWidgetState();
}

class _MyWidgetState extends State<MyWidget> {
  StreamSubscription? _subscription;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _subscription = someStream.listen(callback);
    _timer = Timer.periodic(Duration(seconds: 1), callback);
  }
  // Missing dispose() - memory leak!
}

// ✅ After - Proper disposal
class MyWidget extends StatefulWidget {
  @override
  _MyWidgetState createState() => _MyWidgetState();
}

class _MyWidgetState extends State<MyWidget> {
  StreamSubscription? _subscription;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _subscription = someStream.listen(callback);
    _timer = Timer.periodic(const Duration(seconds: 1), callback);
  }

  @override
  void dispose() {
    _subscription?.cancel();
    _timer?.cancel();
    super.dispose();
  }
}
```

**State Management Pattern Fixes:**
```dart
// ❌ Before - Inefficient rebuilds
class MyWidget extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Consumer<MyProvider>(
      builder: (context, provider, child) {
        return Column(
          children: [
            Text('Static Title'), // Rebuilds unnecessarily
            Text(provider.data),
          ],
        );
      },
    );
  }
}

// ✅ After - Optimized rebuilds
class MyWidget extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        const Text('Static Title'), // Static widget
        Consumer<MyProvider>(
          builder: (context, provider, child) {
            return Text(provider.data); // Only rebuilds this part
          },
        ),
      ],
    );
  }
}
```

**Async/Await Error Handling:**
```dart
// ❌ Before - Poor error handling
Future<void> loadData() async {
  final result = await apiService.fetchData();
  setState(() => data = result);
}

// ✅ After - Comprehensive error handling
Future<void> loadData() async {
  try {
    setState(() => isLoading = true);

    final result = await apiService.fetchData()
        .timeout(const Duration(seconds: 30));

    if (mounted) {
      setState(() {
        data = result;
        isLoading = false;
        error = null;
      });
    }
  } catch (e) {
    if (mounted) {
      setState(() {
        isLoading = false;
        error = _mapErrorToMessage(e);
      });
    }
  }
}

String _mapErrorToMessage(Object error) {
  if (error is SocketException) {
    return 'Network connection error';
  } else if (error is TimeoutException) {
    return 'Request timed out';
  } else {
    return 'An unexpected error occurred';
  }
}
```

**Null Safety Compliance:**
```dart
// ❌ Before - Null safety violations
class UserProfile {
  String name;
  String? email;

  UserProfile(this.name) {
    if (name.isEmpty) {
      throw ArgumentError('Name cannot be empty');
    }
  }

  void displayEmail() {
    print(email.length); // Potential null reference
  }
}

// ✅ After - Null safety compliant
class UserProfile {
  final String name;
  final String? email;

  const UserProfile({
    required this.name,
    this.email,
  }) : assert(name.isNotEmpty, 'Name cannot be empty');

  void displayEmail() {
    if (email != null) {
      print(email!.length); // Safe access after null check
    } else {
      print('No email available');
    }
  }

  String get displayName {
    return email != null ? '$name ($email)' : name;
  }
}
```

**C. Performance Optimizations**

**Widget Rebuild Optimization:**
```dart
// ❌ Before - Unnecessary rebuilds
class ExpensiveWidget extends StatelessWidget {
  final List<int> numbers;

  const ExpensiveWidget({Key? key, required this.numbers}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    // Expensive calculation on every rebuild
    final sum = numbers.reduce((a, b) => a + b);

    return Text('Sum: $sum');
  }
}

// ✅ After - Cached calculation
class ExpensiveWidget extends StatelessWidget {
  final List<int> numbers;

  const ExpensiveWidget({Key? key, required this.numbers}) : super(key: key);

  int _calculateSum() {
    return numbers.reduce((a, b) => a + b);
  }

  @override
  Widget build(BuildContext context) {
    return Text('Sum: ${_calculateSum()}');
  }
}

// Even better - use const where possible
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

**List Performance Optimization:**
```dart
// ❌ Before - Inefficient list rendering
class InefficientList extends StatelessWidget {
  final List<Item> items;

  const InefficientList({Key? key, required this.items}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Column(
      children: items.map((item) {
        return ListTile(
          title: Text(item.title),
          subtitle: Text(item.description),
        );
      }).toList(),
    );
  }
}

// ✅ After - Efficient list rendering
class EfficientList extends StatelessWidget {
  final List<Item> items;

  const EfficientList({Key? key, required this.items}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      itemCount: items.length,
      itemBuilder: (context, index) {
        final item = items[index];
        return ListTile(
          key: ValueKey(item.id),
          title: Text(item.title),
          subtitle: Text(item.description),
        );
      },
    );
  }
}
```

**D. Security & Reliability Improvements**

**Input Validation:**
```dart
// ❌ Before - No input validation
class UserForm extends StatefulWidget {
  @override
  _UserFormState createState() => _UserFormState();
}

class _UserFormState extends State<UserForm> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  void submitForm() {
    final email = _emailController.text;
    final password = _passwordController.text;

    // Direct API call with no validation
    authService.signIn(email, password);
  }
}

// ✅ After - Comprehensive validation
class UserForm extends StatefulWidget {
  @override
  _UserFormState createState() => _UserFormState();
}

class _UserFormState extends State<UserForm> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  String? _validateEmail(String? value) {
    if (value == null || value.isEmpty) {
      return 'Email is required';
    }

    final emailRegex = RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$');
    if (!emailRegex.hasMatch(value)) {
      return 'Please enter a valid email address';
    }

    return null;
  }

  String? _validatePassword(String? value) {
    if (value == null || value.isEmpty) {
      return 'Password is required';
    }

    if (value.length < 8) {
      return 'Password must be at least 8 characters';
    }

    return null;
  }

  Future<void> submitForm() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    try {
      setState(() => isLoading = true);

      await authService.signIn(
        _emailController.text.trim(),
        _passwordController.text,
      );

      // Handle successful sign-in
    } catch (e) {
      // Handle error
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Sign in failed: ${e.toString()}')),
      );
    } finally {
      if (mounted) {
        setState(() => isLoading = false);
      }
    }
  }
}
```

### 3. Refactoring & Organization

**Code Structure Improvements:**
```dart
// ❌ Before - Poor separation of concerns
class UserProfileScreen extends StatefulWidget {
  @override
  _UserProfileScreenState createState() => _UserProfileScreenState();
}

class _UserProfileScreenState extends State<UserProfileScreen> {
  User? user;
  bool isLoading = false;

  @override
  void initState() {
    super.initState();
    loadUser();
  }

  Future<void> loadUser() async {
    // Direct API call in UI layer
    final response = await http.get(Uri.parse('https://api.example.com/user'));
    final data = jsonDecode(response.body);
    setState(() => user = User.fromJson(data));
  }

  @override
  Widget build(BuildContext context) {
    // UI mixed with business logic
    return Scaffold(
      appBar: AppBar(title: Text('Profile')),
      body: user == null
        ? CircularProgressIndicator()
        : Column(
            children: [
              Text(user!.name),
              ElevatedButton(
                onPressed: () {
                  // More API calls in UI layer
                  updateUser({'name': 'New Name'});
                },
                child: Text('Update'),
              ),
            ],
          ),
    );
  }
}

// ✅ After - Proper separation of concerns
class UserProfileScreen extends StatefulWidget {
  @override
  _UserProfileScreenState createState() => _UserProfileScreenState();
}

class _UserProfileScreenState extends State<UserProfileScreen> {
  final UserService _userService = UserService();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: FutureBuilder<User?>(
        future: _userService.getCurrentUser(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          }

          final user = snapshot.data;
          if (user == null) {
            return const Center(child: Text('User not found'));
          }

          return UserProfileContent(user: user);
        },
      ),
    );
  }
}

class UserService {
  final ApiClient _apiClient = ApiClient();

  Future<User?> getCurrentUser() async {
    try {
      final response = await _apiClient.get('/user');
      return User.fromJson(response.data);
    } catch (e) {
      // Handle error logging
      rethrow;
    }
  }

  Future<void> updateUser(Map<String, dynamic> data) async {
    await _apiClient.put('/user', data);
  }
}
```

### 4. AST-Assisted Refactoring

**Pattern Detection and Replacement:**
```dart
// Use ast-grep to find and fix patterns
// Example: Fix setState calls outside build method

// ❌ Pattern to find
pattern: "setState.*void.*build"
language: "dart"

// ✅ Replace with proper state management
```

### 5. Test Compatibility Assurance

**Before Making Changes:**
```bash
# Ensure existing tests pass
flutter test test/path/to/relevant_tests.dart

# Check build success
flutter build apk --debug
```

**After Making Changes:**
```bash
# Verify tests still pass
flutter test test/path/to/relevant_tests.dart

# Run full test suite
flutter test

# Check build still works
flutter build apk --debug
```

### 6. MCP Memory Integration

**Store Fix History:**
```javascript
mcp__memory__create_entities({
  entities: [{
    name: "flutter_fix_${filename}_${timestamp}",
    entityType: "code_fix",
    observations: [
      "file_path: ${filepath}",
      "critical_issues_fixed: ${critical_count}",
      "warning_issues_fixed: ${warning_count}",
      "performance_improvements: ${perf_count}",
      "security_improvements: ${security_count}",
      "quality_score_before: ${before_score}",
      "quality_score_after: ${after_score}"
    ]
  }]
})
```

**Create Relations:**
```javascript
mcp__memory__create_relations({
  relations: [{
    from: "flutter_fix_${fix_id}",
    to: "flutter_file_${filename}",
    relationType: "fixed"
  }]
})
```

### 7. Validation & Quality Assurance

**Static Analysis Verification:**
```bash
# Run comprehensive analysis
flutter analyze --fatal-infos --fatal-warnings

# Check formatting compliance
dart format --set-exit-if-changed .

# Run code coverage
flutter test --coverage
```

**Performance Validation:**
```bash
# Test performance impact
flutter test integration_test/performance_test.dart

# Profile app if needed
flutter run --profile
```

## Quality Standards

**Code Quality Requirements:**
- Zero critical issues after fixes
- All `flutter analyze` warnings resolved
- Consistent code formatting
- Proper documentation for public APIs
- No breaking changes without proper planning

**Performance Standards:**
- Improved or maintained performance
- No memory leaks introduced
- Optimized widget rebuilds
- Efficient list and image loading
- Proper caching strategies

**Security Standards:**
- Input validation for all user inputs
- Secure API integration patterns
- Proper error handling without exposing sensitive information
- Authentication and authorization best practices

## Critical Requirements

### MUST PRESERVE:
- All existing functionality
- Test compatibility (existing tests must pass)
- Build compatibility (app must still build)
- User experience (no breaking UX changes)

### MUST IMPROVE:
- Code quality score (target: +10 points minimum)
- Performance characteristics
- Security posture
- Maintainability and readability

### MUST ENSURE:
- Zero regressions in existing functionality
- All tests pass after fixes
- Static analysis passes without issues
- Memory graph integration completed

## Fixing Protocol Validation

**Pre-Fix Checklist:**
- [ ] Issues fully understood and prioritized
- [ ] Breaking changes identified
- [ ] Test coverage verified
- [ ] Backup/revert strategy planned
- [ ] Impact assessed

**Post-Fix Checklist:**
- [ ] All critical issues resolved
- [ ] Code quality improved
- [ ] Tests pass consistently
- [ ] Build process successful
- [ ] Performance maintained or improved
- [ ] Memory integration completed
- [ ] Documentation updated

**Quality Assurance:**
- Code review against Flutter best practices
- Performance impact assessment
- Security vulnerability assessment
- Maintainability evaluation
- User experience impact assessment