# Flutter Test Creator Rules

## Overview

The Flutter Test Creator is responsible for generating comprehensive test suites for Flutter/Dart files following industry best practices. This protocol ensures systematic, thorough test creation that achieves high coverage while maintaining test quality and maintainability.

## Test Creation Framework

### 1. File Analysis & Test Planning

**Target File Analysis Protocol:**
```dart
// Read and understand the target file
Read /Users/bramburn/dev/audio-lessons/mobile/lib/path/to/file.dart

// Analyze file structure
- Identify class types (Model, Service, Widget, Provider)
- List all public methods and properties
- Understand dependencies and imports
- Assess complexity and business logic criticality
```

**Test Strategy Planning:**
```dart
// Determine required test types based on file type
switch (file_type) {
  case 'model':
    require_tests = ['unit', 'serialization'];
  case 'service':
    require_tests = ['unit', 'integration', 'mock'];
  case 'widget':
    require_tests = ['unit', 'widget', 'accessibility'];
  case 'screen':
    require_tests = ['unit', 'widget', 'integration', 'navigation'];
  case 'provider':
    require_tests = ['unit', 'state_management'];
}
```

**Coverage Goals Establishment:**
- **Minimum Target**: 80% line coverage per file
- **Excellence Target**: 90%+ for critical business logic
- **Complete Coverage**: 95%+ for models and services
- **Branch Coverage**: 100% for conditional logic

### 2. Test Structure Design by File Type

**A. Model Classes Test Structure:**

```dart
void main() {
  group('ModelName Tests', () {
    group('Constructor', () {
      test('should create instance with required parameters', () {
        // Constructor validation tests
      });

      test('should handle null parameters appropriately', () {
        // Null safety tests
      });
    });

    group('Properties', () {
      test('should get property values correctly', () {
        // Getter tests
      });

      test('should set property values correctly', () {
        // Setter tests (if applicable)
      });
    });

    group('Serialization', () {
      test('should serialize to JSON correctly', () {
        // toJson tests
      });

      test('should deserialize from JSON correctly', () {
        // fromJson tests
      });

      test('should handle malformed JSON gracefully', () {
        // Error handling tests
      });
    });

    group('Equality & HashCode', () {
      test('should be equal when properties match', () {
        // Equality tests
      });

      test('should have consistent hashCode', () {
        // HashCode tests
      });
    });

    group('Business Logic', () {
      test('should validate data correctly', () {
        // Validation method tests
      });

      test('should calculate derived properties correctly', () {
        // Computed property tests
      });
    });
  });
}
```

**B. Service Classes Test Structure:**

```dart
void main() {
  group('ServiceName Tests', () {
    late MockDependency mockDependency;
    late ServiceName service;

    setUp(() {
      mockDependency = MockDependency();
      service = ServiceName(dependency: mockDependency);
    });

    group('Method Tests', () {
      test('should return expected result on success', () async {
        // Arrange
        when(mockDependency.someMethod())
            .thenAnswer((_) async => ExpectedResult());

        // Act
        final result = await service.methodUnderTest();

        // Assert
        expect(result, isA<ExpectedResult>());
        verify(mockDependency.someMethod()).called(1);
      });

      test('should handle network errors gracefully', () async {
        // Error handling tests
      });

      test('should timeout appropriately', () async {
        // Timeout tests
      });
    });

    group('Edge Cases', () {
      test('should handle empty responses', () {
        // Edge case tests
      });

      test('should handle concurrent requests', () {
        // Concurrency tests
      });
    });
  });
}
```

**C. Widget Classes Test Structure:**

```dart
void main() {
  group('WidgetName Tests', () {
    testWidgets('should render correctly', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: WidgetName(),
        ),
      );

      expect(find.byType(WidgetName), findsOneWidget);
    });

    testWidgets('should display child widgets', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: WidgetName(),
        ),
      );

      expect(find.text('Expected Text'), findsOneWidget);
      expect(find.byIcon(Icons.expected), findsOneWidget);
    });

    testWidgets('should handle user interactions', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: WidgetName(
            onPressed: () {},
          ),
        ),
      );

      await tester.tap(find.byType(ElevatedButton));
      await tester.pump();

      // Verify interaction results
    });

    testWidgets('should update state correctly', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: WidgetName(),
        ),
      );

      // Trigger state change
      await tester.tap(find.byKey(Key('state_trigger')));
      await tester.pump();

      // Verify state update
    });

    testWidgets('should meet accessibility requirements', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: WidgetName(),
        ),
      );

      // Verify semantic labels
      expect(
        tester.semantics(find.byType(WidgetName)),
        matchesSemantics(
          label: 'Widget Description',
          isButton: true,
        ),
      );
    });
  });
}
```

### 3. Mock and Fixture Creation

**Mock Generation Protocol:**
```dart
// Generate mocks using mockito
@GenerateMocks([AuthService, ApiService])
void main() {
  // Mock implementation
}
```

**Test Data Factories:**
```dart
class TestDataFactory {
  static User createTestUser({
    String id = 'test-id',
    String email = 'test@example.com',
    String name = 'Test User',
  }) {
    return User(
      id: id,
      email: email,
      name: name,
    );
  }

  static Map<String, dynamic> createTestUserJson() {
    return {
      'id': 'test-id',
      'email': 'test@example.com',
      'name': 'Test User',
    };
  }
}
```

**Reusable Test Utilities:**
```dart
class TestHelpers {
  static Future<void> pumpAndSettleWithTimeout(
    WidgetTester tester, {
    Duration timeout = const Duration(seconds: 10),
  }) async {
    await tester.pumpAndSettle(timeout);
  }

  static Widget createTestApp(Widget child) {
    return MaterialApp(
      home: Scaffold(
        body: child,
      ),
    );
  }
}
```

### 4. Firebase & External Service Testing

**Firebase Auth Testing:**
```dart
import 'package:firebase_auth_mocks/firebase_auth_mocks.dart';

void main() {
  group('Firebase Auth Tests', () {
    late MockFirebaseAuth mockAuth;
    late AuthService authService;

    setUp(() {
      mockAuth = MockFirebaseAuth();
      authService = AuthService(auth: mockAuth);
    });

    test('should sign in user successfully', () async {
      // Arrange
      final mockUser = MockUser(
        uid: 'test-uid',
        email: 'test@example.com',
      );
      when(mockAuth.signInWithEmailAndPassword(
        email: 'test@example.com',
        password: 'password',
      )).thenAnswer((_) async => UserCredential.fromAuthResult(
        AuthResult(mockUser),
      ));

      // Act
      final result = await authService.signIn('test@example.com', 'password');

      // Assert
      expect(result, isNotNull);
      expect(result!.email, 'test@example.com');
    });
  });
}
```

**Firestore Testing:**
```dart
import 'package:fake_cloud_firestore/fake_cloud_firestore.dart';

void main() {
  group('Firestore Tests', () {
    late FakeFirestore fakeFirestore;
    late DataService dataService;

    setUp(() {
      fakeFirestore = FakeFirestore();
      dataService = DataService(firestore: fakeFirestore);
    });

    test('should save data correctly', () async {
      // Arrange
      final testData = TestDataFactory.createTestModel();

      // Act
      await dataService.saveData(testData);

      // Assert
      final snapshot = await fakeFirestore
          .collection('test_collection')
          .doc(testData.id)
          .get();
      expect(snapshot.exists, isTrue);
      expect(snapshot.get('name'), testData.name);
    });
  });
}
```

### 5. Widget Testing Best Practices

**Finder Usage:**
```dart
// ✅ Good - Specific finders
expect(find.byKey(Key('specific_widget_key')), findsOneWidget);
expect(find.text('Specific Text'), findsOneWidget);
expect(find.byType(SpecificWidget), findsOneWidget);

// ❌ Bad - Vague finders
expect(find.byType(Container), findsWidgets);
```

**Widget Pumping Strategy:**
```dart
testWidgets('should handle async operations', (WidgetTester tester) async {
  await tester.pumpWidget(MyApp());

  // Initial build
  await tester.pump();

  // Wait for async operations
  await tester.pump(Duration.zero);

  // Wait for all animations and futures
  await tester.pumpAndSettle();
});
```

**Golden Testing:**
```dart
testWidgets('should match golden snapshot', (WidgetTester tester) async {
  await tester.pumpWidget(
    MaterialApp(
      home: MyWidget(),
    ),
  );

  await expectLater(
    find.byType(MyWidget),
    matchesGoldenFile('goldens/my_widget.png'),
  );
});
```

### 6. Integration Testing

**End-to-End Flow Tests:**
```dart
void main() {
  integrationTest('Complete user registration flow', () async {
    // Arrange
    app.main();
    await tester.pumpAndSettle();

    // Act
    await tester.tap(find.text('Sign Up'));
    await tester.pumpAndSettle();

    await tester.enterText(find.byKey(Key('email_field')), 'test@example.com');
    await tester.enterText(find.byKey(Key('password_field')), 'password123');
    await tester.tap(find.byKey(Key('submit_button')));
    await tester.pumpAndSettle();

    // Assert
    expect(find.text('Welcome!'), findsOneWidget);
  });
}
```

### 7. Code Coverage Optimization

**Coverage Strategy:**
- Test all public methods and properties
- Cover all conditional branches
- Include exception scenarios
- Test edge cases and boundary conditions
- Verify widget state changes

**Coverage Verification:**
```bash
# Run tests with coverage
flutter test --coverage

# Generate coverage report
genhtml coverage/lcov.info -o coverage/html

# View coverage report
open coverage/html/index.html
```

### 8. MCP Memory Integration

**Store Test Metadata:**
```javascript
mcp__memory__create_entities({
  entities: [{
    name: "flutter_test_${testfile_name}",
    entityType: "test_suite",
    observations: [
      "source_file: ${source_file_path}",
      "coverage_achieved: ${coverage_percentage}%",
      "test_types: ${test_types.join(', ')}",
      "creation_date: ${timestamp}",
      "mocks_created: ${mock_count}"
    ]
  }]
})
```

**Create Relations:**
```javascript
mcp__memory__create_relations({
  relations: [{
    from: "flutter_test_${testfile_name}",
    to: "flutter_file_${source_file_name}",
    relationType: "tests"
  }]
})
```

### 9. Test Validation & Quality Assurance

**Test Execution Protocol:**
```bash
# Run specific test file
flutter test test/path/to/test_file.dart

# Run with coverage
flutter test test/path/to/test_file.dart --coverage

# Check test quality
flutter analyze test/path/to/test_file.dart
```

**Quality Checklist:**
- [ ] All tests pass consistently
- [ ] Coverage meets targets (80%+)
- [ ] Tests are readable and maintainable
- [ ] Proper test documentation
- [ ] Appropriate mocking strategy
- [ ] No flaky tests

### 10. Test File Structure

**Standard File Organization:**
```dart
// test/path/to/test_file.dart

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/mockito.dart';
import 'package:audio_lessons_mobile/...';

// Import mocks and test utilities
import '../mocks/mock_services.dart';
import '../helpers/test_helpers.dart';

// Test implementation
void main() {
  // Test groups and cases
}
```

## Quality Standards

**Test Quality Requirements:**
- 80%+ code coverage for all files
- Descriptive test names that explain scenarios
- Proper setup/teardown procedures
- Comprehensive mocking of external dependencies
- No flaky or unreliable tests

**Best Practices Compliance:**
- Arrange-Act-Assert pattern
- Single responsibility per test
- Appropriate use of matchers and assertions
- Proper async/await handling
- Accessibility testing for widgets

**Maintainability Standards:**
- Clear test documentation
- Reusable test utilities
- Consistent naming conventions
- Appropriate test organization
- Meaningful test data

## Critical Requirements

### MUST CREATE:
- Comprehensive test suites covering all public APIs
- Proper mocks for external dependencies
- Test utilities and helper functions
- Documentation for complex test scenarios
- Coverage reports showing 80%+ coverage

### MUST FOLLOW:
- Flutter testing best practices (2025)
- Arrange-Act-Assert pattern
- Proper async testing patterns
- Accessibility testing guidelines
- Golden testing for UI consistency

### MUST ENSURE:
- All tests pass consistently
- No flaky or unreliable tests
- Proper error scenario coverage
- Performance testing where relevant
- Integration with existing test infrastructure

## Test Creation Validation

**Pre-Completion Checklist:**
- [ ] Source file fully analyzed
- [ ] Test strategy planned appropriately
- [ ] All public methods covered
- [ ] Error scenarios tested
- [ ] Mocks created correctly
- [ ] Coverage target achieved
- [ ] Tests run successfully
- [ ] Memory integration completed
- [ ] Documentation provided

**Quality Assurance:**
- Test consistency with existing test suite
- Integration with test utilities
- Performance impact assessment
- Maintenance requirements evaluation