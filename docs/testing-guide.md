# Roo-Code Testing Guide

This comprehensive guide covers the testing infrastructure and best practices for the Roo-Code VSCode extension project.

## 📋 Table of Contents

- [Overview](#overview)
- [Test Structure](#test-structure)
- [Quick Start](#quick-start)
- [Test Categories](#test-categories)
- [Test Scripts](#test-scripts)
- [Coverage Reporting](#coverage-reporting)
- [Continuous Testing](#continuous-testing)
- [Test Scenarios](#test-scenarios)
- [Environment Setup](#environment-setup)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

The Roo-Code project uses a comprehensive testing pipeline that includes:

- **Unit Tests**: Test individual components and functions in isolation
- **Component Tests**: Test React components and VSCode extension components
- **Integration Tests**: Test interactions between different parts of the system
- **Performance Tests**: Monitor performance characteristics and memory usage
- **E2E Tests**: Test complete user workflows
- **Regression Tests**: Ensure previously fixed bugs don't reoccur

### Key Technologies

- **Vitest**: Primary test runner for both backend and frontend
- **React Testing Library**: For React component testing
- **Turbo**: Monorepo task runner for coordinated test execution
- **Coverage Reporting**: Comprehensive coverage analysis with HTML and JSON reports

## 🏗️ Test Structure

```
Roo-Code/
├── src/                          # Backend (VSCode Extension)
│   ├── __tests__/                 # Backend tests
│   │   ├── integration/           # Integration tests
│   │   ├── performance/           # Performance tests
│   │   ├── e2e/                # End-to-end tests
│   │   └── regression/           # Regression tests
│   ├── shared/__tests__/          # Shared utility tests
│   ├── utils/__tests__/           # Utility function tests
│   ├── services/**/__tests__/     # Service layer tests
│   └── vitest.config.ts          # Backend test configuration
├── webview-ui/                   # Frontend (React Webview)
│   ├── src/
│   │   ├── __tests__/            # Frontend tests
│   │   ├── components/**/__tests__/  # Component tests
│   │   ├── utils/__tests__/       # Utility tests
│   │   └── hooks/__tests__/      # Hook tests
│   └── vitest.config.ts          # Frontend test configuration
├── scripts/                      # Test automation scripts
│   ├── test-runner.mjs           # Unified test runner
│   ├── test-env-config.mjs       # Environment configuration
│   ├── test-scenarios.mjs        # Test scenario runner
│   ├── coverage-reporter.mjs      # Coverage reporting
│   └── continuous-testing.mjs    # Continuous testing
└── docs/                        # Documentation
    └── testing-guide.md          # This guide
```

## 🚀 Quick Start

### 1. Initial Setup

```bash
# Install dependencies
pnpm install

# Setup test environment
pnpm test:env:setup
```

### 2. Run All Tests

```bash
# Run all tests with coverage
pnpm test:all

# Or use the unified test runner directly
node scripts/test-runner.mjs --coverage
```

### 3. Run Specific Test Categories

```bash
# Run unit tests only
pnpm test:unit

# Run integration tests only
pnpm test:integration

# Run component tests only
pnpm test:component

# Run performance tests only
pnpm test:performance
```

### 4. Run Tests by Platform

```bash
# Run backend tests only
pnpm test:backend

# Run frontend tests only
pnpm test:frontend
```

## 📂 Test Categories

### Unit Tests

Test individual functions, classes, and modules in isolation.

**Location**:

- Backend: `src/**/__tests__/*.spec.ts`
- Frontend: `webview-ui/src/**/__tests__/*.spec.ts`

**Examples**:

```bash
# Run all unit tests
pnpm test:unit

# Run specific unit test file
node scripts/test-runner.mjs --pattern "src/utils/__tests__/cost.spec.ts"

# Run unit tests with coverage
pnpm test:unit --coverage
```

### Component Tests

Test React components and VSCode extension components with user interactions.

**Location**:

- Frontend: `webview-ui/src/components/**/__tests__/*.spec.tsx`
- Backend: `src/activate/__tests__/*.spec.ts`

**Examples**:

```bash
# Run all component tests
pnpm test:component

# Run React component tests only
node scripts/test-runner.mjs --platform frontend --category component
```

### Integration Tests

Test interactions between different parts of the system.

**Location**: `src/__tests__/integration/`

**Examples**:

```bash
# Run all integration tests
pnpm test:integration

# Run API integration tests only
node scripts/test-scenarios.mjs integration:api

# Run cross-platform integration tests
node scripts/test-scenarios.mjs integration:crossPlatform
```

### Performance Tests

Monitor performance characteristics, memory usage, and execution times.

**Location**: `src/__tests__/performance/`

**Examples**:

```bash
# Run all performance tests
pnpm test:performance

# Run code indexing performance tests
node scripts/test-scenarios.mjs performance:codeIndexing

# Run memory usage tests
node scripts/test-scenarios.mjs performance:memoryUsage
```

### E2E Tests

Test complete user workflows from start to finish.

**Location**: `src/__tests__/e2e/`

**Examples**:

```bash
# Run all E2E tests
pnpm test:e2e

# Run extension lifecycle tests
node scripts/test-scenarios.mjs e2e:extensionLifecycle
```

### Regression Tests

Ensure previously fixed bugs don't reoccur.

**Location**: `src/__tests__/regression/`

**Examples**:

```bash
# Run all regression tests
pnpm test:regression

# Run security regression tests
node scripts/test-scenarios.mjs regression:security
```

## 📜 Test Scripts

### Core Test Scripts

| Script             | Description           | Example                 |
| ------------------ | --------------------- | ----------------------- |
| `test:all`         | Run all tests         | `pnpm test:all`         |
| `test:unit`        | Run unit tests        | `pnpm test:unit`        |
| `test:integration` | Run integration tests | `pnpm test:integration` |
| `test:component`   | Run component tests   | `pnpm test:component`   |
| `test:performance` | Run performance tests | `pnpm test:performance` |
| `test:e2e`         | Run E2E tests         | `pnpm test:e2e`         |
| `test:regression`  | Run regression tests  | `pnpm test:regression`  |
| `test:backend`     | Run backend tests     | `pnpm test:backend`     |
| `test:frontend`    | Run frontend tests    | `pnpm test:frontend`    |

### Coverage Scripts

| Script             | Description                   | Example                 |
| ------------------ | ----------------------------- | ----------------------- |
| `test:coverage`    | Run tests with coverage       | `pnpm test:coverage`    |
| `coverage:summary` | Show coverage summary         | `pnpm coverage:summary` |
| `coverage:html`    | Generate HTML coverage report | `pnpm coverage:html`    |
| `coverage:json`    | Generate JSON coverage report | `pnpm coverage:json`    |
| `coverage:full`    | Generate full coverage report | `pnpm coverage:full`    |
| `coverage:cleanup` | Clean old coverage reports    | `pnpm coverage:cleanup` |

### Environment Scripts

| Script           | Description            | Example               |
| ---------------- | ---------------------- | --------------------- |
| `test:env:setup` | Setup test environment | `pnpm test:env:setup` |
| `test:env:clean` | Clean test environment | `pnpm test:env:clean` |

### Advanced Scripts

| Script            | Description              | Example                |
| ----------------- | ------------------------ | ---------------------- |
| `test:scenarios`  | Run test scenarios       | `pnpm test:scenarios`  |
| `test:continuous` | Start continuous testing | `pnpm test:continuous` |
| `test:templates`  | Create test templates    | `pnpm test:templates`  |
| `test:workflow`   | Setup CI/CD workflow     | `pnpm test:workflow`   |

## 📊 Coverage Reporting

### Coverage Thresholds

The project maintains the following coverage thresholds:

- **Lines**: ≥ 80%
- **Functions**: ≥ 80%
- **Branches**: ≥ 75%
- **Statements**: ≥ 80%

### Generating Coverage Reports

```bash
# Run tests with coverage
pnpm test:coverage

# Generate HTML report
pnpm coverage:html

# Generate JSON report
pnpm coverage:json

# Generate full report with both HTML and JSON
pnpm coverage:full
```

### Coverage Reports Location

- **Backend Coverage**: `src/coverage/`
- **Frontend Coverage**: `webview-ui/coverage/`
- **Combined Reports**: `coverage-reports/`
- **HTML Report**: `coverage-reports/index.html`
- **JSON Report**: `coverage-reports/coverage-report.json`

### Viewing Coverage Reports

```bash
# Open HTML report in browser
open coverage-reports/index.html

# Or serve it locally
npx serve coverage-reports
```

## 🔄 Continuous Testing

### Local Continuous Testing

Start continuous testing that watches for file changes and runs relevant tests:

```bash
# Start continuous testing
pnpm test:continuous

# Or run directly
node scripts/continuous-testing.mjs start
```

### CI/CD Integration

The project includes GitHub Actions workflows for automated testing:

```bash
# Setup GitHub Actions workflow
pnpm test:workflow

# Or create manually
node scripts/continuous-testing.mjs workflow
```

### Continuous Testing Features

- **File Watching**: Monitors file changes and runs relevant tests
- **Debouncing**: Prevents excessive test runs during rapid changes
- **Smart Test Selection**: Runs only tests relevant to changed files
- **Failure Tracking**: Stops after maximum failures to prevent infinite loops
- **Report Generation**: Automatically generates test reports

## 🎭 Test Scenarios

### Available Scenarios

```bash
# List all available scenarios
node scripts/test-scenarios.mjs list

# Run specific scenario
node scripts/test-scenarios.mjs unit
node scripts/test-scenarios.mjs integration:api
node scripts/test-scenarios.mjs performance:codeIndexing
```

### Scenario Categories

1. **Unit Tests**

    - Backend unit tests
    - Frontend unit tests

2. **Component Tests**

    - React component tests
    - Extension component tests

3. **Integration Tests**

    - API integration tests
    - Cross-platform integration tests
    - Context loading tests

4. **Performance Tests**

    - Code indexing performance
    - Tree-sitter performance
    - Memory usage tests

5. **E2E Tests**

    - Extension lifecycle tests
    - User workflow tests

6. **Regression Tests**
    - Critical bug regression tests
    - Security regression tests

## 🌍 Environment Setup

### Test Environment Variables

The test environment is configured with specific variables:

```bash
# Global test environment
NODE_ENV=test
VITEST=true
TELEMETRY_DISABLED=true
VSCODE_IPC_HOOK=test-mode

# Backend-specific
VSCODE_TEST=true
API_BASE_URL=http://localhost:3001
API_MOCK_MODE=true

# Frontend-specific
REACT_APP_TEST_MODE=true
VSCODE_WEBVIEW_TEST=true
REACT_APP_DISABLE_ANIMATIONS=true
```

### Environment Files

- `.env.test`: Global test environment
- `src/.env.test`: Backend test environment
- `webview-ui/.env.test`: Frontend test environment
- `.env.coverage`: Coverage configuration

### Mock Services

The test environment includes mock services:

- **VS Code API**: Mocked for extension tests
- **External APIs**: Mocked to prevent real network calls
- **File System**: Isolated test storage
- **Database**: In-memory test database

## ✅ Best Practices

### Writing Tests

1. **Test Naming**

    - Use descriptive test names
    - Follow the pattern: `should [expected behavior] when [condition]`

2. **Test Structure**

    ```typescript
    describe("Component/Function", () => {
    	beforeEach(() => {
    		// Setup before each test
    	})

    	afterEach(() => {
    		// Cleanup after each test
    	})

    	test("should do something", () => {
    		// Test implementation
    	})
    })
    ```

3. **Assertions**

    - Use specific assertions
    - Test both positive and negative cases
    - Include edge cases

4. **Mocking**
    - Mock external dependencies
    - Use consistent mock data
    - Clean up mocks after tests

### Test Organization

1. **File Structure**

    - Keep tests close to source files
    - Use `__tests__` directories
    - Name test files consistently (`.spec.ts` or `.test.ts`)

2. **Test Categories**

    - Separate unit, integration, and E2E tests
    - Use appropriate test patterns
    - Document test purposes

3. **Test Data**
    - Use consistent test data
    - Create reusable test fixtures
    - Avoid hardcoded values

### Performance Testing

1. **Metrics**

    - Measure execution time
    - Monitor memory usage
    - Track resource consumption

2. **Thresholds**

    - Set performance thresholds
    - Monitor regressions
    - Document performance expectations

3. **Tools**
    - Use performance APIs
    - Profile memory usage
    - Generate performance reports

## 🔧 Troubleshooting

### Common Issues

1. **Test Environment Issues**

    ```bash
    # Reset test environment
    pnpm test:env:clean
    pnpm test:env:setup
    ```

2. **Coverage Issues**

    ```bash
    # Clean and regenerate coverage
    pnpm coverage:cleanup
    pnpm test:coverage
    ```

3. **Test Failures**

    ```bash
    # Run tests with verbose output
    pnpm test:unit --verbose

    # Run specific failing test
    node scripts/test-runner.mjs --pattern "path/to/failing.test.ts"
    ```

### Debugging Tests

1. **Console Output**

    ```bash
    # Enable verbose output
    node scripts/test-runner.mjs --verbose

    # Disable silent mode
    node scripts/test-runner.mjs --no-silent
    ```

2. **Breakpoints**

    ```typescript
    // Add debugger statements
    test("should debug", () => {
    	debugger
    	// Test code
    })
    ```

3. **Test Isolation**

    ```bash
    # Run single test file
    node scripts/test-runner.mjs --pattern "specific-test.test.ts"

    # Run tests without bail
    node scripts/test-runner.mjs --no-bail
    ```

### Performance Issues

1. **Slow Tests**

    - Check for unnecessary delays
    - Optimize test setup/teardown
    - Use appropriate test timeouts

2. **Memory Issues**

    - Clean up test data
    - Use weak references where appropriate
    - Monitor memory usage

3. **Resource Leaks**
    - Ensure proper cleanup
    - Close file handles
    - Disconnect network connections

### Getting Help

1. **Command Help**

    ```bash
    # Get help for test runner
    node scripts/test-runner.mjs --help

    # Get help for test scenarios
    node scripts/test-scenarios.mjs --help
    ```

2. **Documentation**

    - Check this guide
    - Review test file comments
    - Look at existing test examples

3. **Community**
    - Check GitHub issues
    - Review pull requests
    - Ask questions in discussions

## 📚 Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Turbo Documentation](https://turbo.build/)
- [VSCode Extension Testing Guide](https://code.visualstudio.com/api/working-with-extensions/testing-extension)

## 🤝 Contributing

When contributing to the testing infrastructure:

1. **Follow Patterns**: Use existing test patterns and conventions
2. **Add Coverage**: Ensure new code has appropriate test coverage
3. **Document Changes**: Update this guide for significant changes
4. **Test Tests**: Ensure your tests actually test what they claim to
5. **Performance**: Consider performance implications of new tests

---

For questions or issues related to testing, please refer to this guide or open an issue in the project repository.
