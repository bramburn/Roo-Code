# Testing Procedures: CodeIndexManager Initialization Fix

## Overview

This document provides comprehensive testing procedures for the CodeIndexManager initialization fix, covering all test suites, execution commands, and validation workflows developed during Sprint 4 (Testing & Validation).

## Quick Start

### Run All Tests

```bash
# Navigate to source directory
cd src

# Run complete test suite with coverage
npx vitest run services/code-index/__tests__/ --coverage

# Run regression tests specifically
node services/code-index/__tests__/run-regression-tests.js --coverage
```

### Quick Validation

```bash
# Run smoke tests for core functionality
cd src && npx vitest run services/code-index/__tests__/regression-suite.test.ts --reporter=verbose

# Check coverage summary
cd src && npx vitest run --coverage --reporter=summary
```

## Test Suite Organization

### 1. Unit Tests (`src/services/code-index/__tests__/`)

#### Core Unit Test Files

| Test File                                            | Purpose                             | Key Test Areas                                  |
| ---------------------------------------------------- | ----------------------------------- | ----------------------------------------------- |
| [`manager.spec.ts`](manager.spec.ts)                 | CodeIndexManager core functionality | Initialization, state management, access guards |
| [`config-manager.spec.ts`](config-manager.spec.ts)   | Configuration management            | Config loading, validation, error handling      |
| [`orchestrator.spec.ts`](orchestrator.spec.ts)       | Service orchestration               | Service coordination, lifecycle management      |
| [`cache-manager.spec.ts`](cache-manager.spec.ts)     | Cache management                    | Cache operations, cleanup, performance          |
| [`service-factory.spec.ts`](service-factory.spec.ts) | Service creation                    | Dependency injection, factory patterns          |

#### Specialized Unit Tests

| Test File                                          | Purpose             | Test Scenarios                             |
| -------------------------------------------------- | ------------------- | ------------------------------------------ |
| [`initialization.test.ts`](initialization.test.ts) | Initialization flow | Async initialization, state transitions    |
| [`access-guards.test.ts`](access-guards.test.ts)   | Access protection   | Method guards, premature access prevention |
| [`error-handling.test.ts`](error-handling.test.ts) | Error scenarios     | Error recovery, exception handling         |
| [`edge-cases.test.ts`](edge-cases.test.ts)         | Boundary conditions | Extreme scenarios, stress conditions       |

### 2. Integration Tests (`src/__tests__/integration/`)

#### Integration Test Files

| Test File                                                                                                                  | Integration Focus | Key Scenarios                                 |
| -------------------------------------------------------------------------------------------------------------------------- | ----------------- | --------------------------------------------- |
| [`codebaseSearchTool.integration.test.ts`](../../__tests__/integration/codebaseSearchTool.integration.test.ts)             | Tool integration  | Tool waits for initialization, error handling |
| [`codeindex-error-handling.integration.test.ts`](../../__tests__/integration/codeindex-error-handling.integration.test.ts) | Error propagation | End-to-end error handling flow                |
| [`manual-review.test.ts`](../../__tests__/integration/manual-review.test.ts)                                               | Manual validation | Human-validated scenarios                     |

### 3. Regression Test Suite

#### Regression Components

| Component                                              | File                  | Purpose                             |
| ------------------------------------------------------ | --------------------- | ----------------------------------- |
| [`regression-suite.test.ts`](regression-suite.test.ts) | Main regression suite | Comprehensive regression protection |
| [`regression-runner.js`](regression-runner.js)         | Automation script     | Automated test execution            |
| [`run-regression-tests.js`](run-regression-tests.js)   | Node.js runner        | CLI interface for testing           |

## Detailed Test Execution Procedures

### Unit Test Execution

#### 1. Running Individual Unit Test Suites

```bash
# CodeIndexManager core tests
cd src && npx vitest run services/code-index/__tests__/manager.spec.ts

# Configuration manager tests
cd src && npx vitest run services/code-index/__tests__/config-manager.spec.ts

# Orchestrator tests
cd src && npx vitest run services/code-index/__tests__/orchestrator.spec.ts

# Cache manager tests
cd src && npx vitest run services/code-index/__tests__/cache-manager.spec.ts
```

#### 2. Running Specialized Tests

```bash
# Initialization flow tests
cd src && npx vitest run services/code-index/__tests__/initialization.test.ts

# Access guard tests
cd src && npx vitest run services/code-index/__tests__/access-guards.test.ts

# Error handling tests
cd src && npx vitest run services/code-index/__tests__/error-handling.test.ts

# Edge case tests
cd src && npx vitest run services/code-index/__tests__/edge-cases.test.ts
```

#### 3. Running All Unit Tests

```bash
# All unit tests in the code-index module
cd src && npx vitest run services/code-index/__tests__/ --reporter=verbose

# With detailed output
cd src && npx vitest run services/code-index/__tests__/ --reporter=verbose --no-coverage
```

### Integration Test Execution

#### 1. Running Integration Tests

```bash
# All integration tests
cd src && npx vitest run __tests__/integration/

# Specific integration test
cd src && npx vitest run __tests__/integration/codebaseSearchTool.integration.test.ts
```

#### 2. Integration Test with Mocking

```bash
# Integration tests with detailed mocking
cd src && npx vitest run __tests__/integration/ --reporter=verbose
```

### Regression Test Execution

#### 1. Standard Regression Test Run

```bash
# Basic regression test execution
cd src && node services/code-index/__tests__/run-regression-tests.js

# With coverage reporting
cd src && node services/code-index/__tests__/run-regression-tests.js --coverage

# With verbose output
cd src && node services/code-index/__tests__/run-regression-tests.js --verbose
```

#### 2. Advanced Regression Test Options

```bash
# Run specific regression test categories
cd src && node services/code-index/__tests__/run-regression-tests.js --category=smoke

# Run with performance monitoring
cd src && node services/code-index/__tests__/run-regression-tests.js --performance

# Generate HTML report
cd src && node services/code-index/__tests__/run-regression-tests.js --html-report
```

### Coverage Analysis

#### 1. Generating Coverage Reports

```bash
# Generate coverage for all tests
cd src && npx vitest run --coverage

# Coverage for specific module
cd src && npx vitest run services/code-index/__tests__/ --coverage

# Coverage with HTML output
cd src && npx vitest run --coverage --reporter=html
```

#### 2. Coverage Analysis Commands

```bash
# View coverage summary
cd src && npx vitest run --coverage --reporter=summary

# Generate detailed coverage report
cd src && npx vitest run --coverage --reporter=verbose

# Coverage for specific files
cd src && npx vitest run --coverage --coverage.include="services/code-index/**"
```

## Test Environment Setup

### Prerequisites

#### 1. Node.js and Dependencies

```bash
# Ensure Node.js version is compatible
node --version  # Should be v18+ for Vitest v3.2.4

# Install dependencies
npm install

# Install test-specific dependencies
npm install --save-dev vitest @vitest/coverage-v8
```

#### 2. Test Configuration

```bash
# Verify Vitest configuration
cat vitest.config.ts

# Check test environment setup
cat package.json | grep -A 10 "vitest"
```

### Environment Variables

#### Test Environment Configuration

```bash
# Set test environment variables
export NODE_ENV=test
export VITEST_ENVIRONMENT=node

# For integration tests
export TEST_INTEGRATION=true
export TEST_MOCK_SERVICES=false

# For performance tests
export TEST_PERFORMANCE_MONITORING=true
export TEST_PERFORMANCE_THRESHOLD=100
```

### Test Data Setup

#### 1. Mock Data Configuration

```bash
# Test data directory structure
mkdir -p test-data/code-index
mkdir -p test-data/configurations
mkdir -p test-data/workspaces
```

#### 2. Test Workspace Setup

```bash
# Create test workspace
mkdir -p test-workspace/code-index
echo "test file content" > test-workspace/code-index/test-file.ts
```

## Test Execution Workflows

### Daily Development Workflow

#### 1. Before Making Changes

```bash
# Run baseline tests
cd src && npx vitest run services/code-index/__tests__/ --reporter=verbose

# Check current coverage
cd src && npx vitest run services/code-index/__tests__/ --coverage --reporter=summary
```

#### 2. During Development

```bash
# Watch mode for continuous testing
cd src && npx vitest watch services/code-index/__tests__/manager.spec.ts

# Run specific test category
cd src && npx vitest run services/code-index/__tests__/initialization.test.ts
```

#### 3. After Making Changes

```bash
# Full test suite
cd src && npx vitest run services/code-index/__tests__/ --coverage

# Regression validation
cd src && node services/code-index/__tests__/run-regression-tests.js
```

### Pre-Commit Workflow

#### 1. Quick Validation

```bash
# Run smoke tests
cd src && node services/code-index/__tests__/run-regression-tests.js --category=smoke

# Check for syntax errors
cd src && npx tsc --noEmit
```

#### 2. Comprehensive Validation

```bash
# Full test suite
cd src && npx vitest run services/code-index/__tests__/ --coverage

# Integration tests
cd src && npx vitest run __tests__/integration/
```

### Release Preparation Workflow

#### 1. Complete Test Suite

```bash
# All tests with coverage
cd src && npx vitest run --coverage

# Performance validation
cd src && node services/code-index/__tests__/run-regression-tests.js --performance
```

#### 2. Quality Gates

```bash
# Check coverage thresholds
cd src && npx vitest run --coverage --coverage.thresholds.global=95

# Run regression suite
cd src && node services/code-index/__tests__/run-regression-tests.js --verbose
```

## CI/CD Integration

### GitHub Actions Configuration

#### 1. Test Workflow

```yaml
name: CodeIndexManager Tests
on: [push, pull_request]
jobs:
    test:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v3
            - name: Setup Node.js
              uses: actions/setup-node@v3
              with:
                  node-version: "18"
            - name: Install dependencies
              run: npm install
            - name: Run unit tests
              run: cd src && npx vitest run services/code-index/__tests__/ --coverage
            - name: Run integration tests
              run: cd src && npx vitest run __tests__/integration/
            - name: Run regression tests
              run: cd src && node services/code-index/__tests__/run-regression-tests.js
```

### Automated Test Execution

#### 1. Pre-commit Hooks

```bash
# Install husky for git hooks
npm install --save-dev husky

# Setup pre-commit hook
npx husky add .husky/pre-commit "cd src && npx vitest run services/code-index/__tests__/ --reporter=verbose"
```

#### 2. Scheduled Tests

```bash
# Daily regression tests (cron job)
0 2 * * * cd /path/to/project && src/node services/code-index/__tests__/run-regression-tests.js --coverage
```

## Test Result Interpretation

### Understanding Test Output

#### 1. Unit Test Results

```
Test Files: 4 passed (4)
Tests: 98 passed (98)
Duration: 42.45s
Success Rate: 100%
```

#### 2. Coverage Report Interpretation

```
----------|---------|----------|---------|---------|-------------------
File      | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
----------|---------|----------|---------|---------|-------------------
All files |   72.26 |    62.22 |   71.42 |   72.26 |
```

#### 3. Performance Test Results

```
Performance Metrics:
- Initialization Time: 1.2s (Target: <2s) ✅
- Search Latency: 85ms (Target: <100ms) ✅
- Memory Usage: 45MB (Target: <50MB) ✅
```

### Failure Analysis

#### 1. Common Test Failures

```bash
# Check for initialization errors
grep -r "CodeIndexManager not initialized" test-results/

# Check for timeout failures
grep -r "timeout" test-results/

# Check for memory issues
grep -r "memory" test-results/
```

#### 2. Debugging Failed Tests

```bash
# Run with verbose output
cd src && npx vitest run services/code-index/__tests__/manager.spec.ts --reporter=verbose

# Run with debugging
cd src && node --inspect-brk node_modules/.bin/vitest run services/code-index/__tests__/manager.spec.ts
```

## Best Practices

### Test Development Guidelines

#### 1. Test Naming Conventions

```typescript
// Good test naming
describe("CodeIndexManager initialization", () => {
	it("should initialize successfully with valid configuration", async () => {
		// Test implementation
	})

	it("should throw error when configuration is invalid", async () => {
		// Test implementation
	})
})
```

#### 2. Test Structure

```typescript
// AAA Pattern (Arrange, Act, Assert)
it("should prevent access before initialization", async () => {
	// Arrange
	const manager = CodeIndexManager.getInstance()

	// Act
	const action = () => manager.searchIndex("test")

	// Assert
	await expect(action).rejects.toThrow("CodeIndexManager not initialized")
})
```

### Performance Testing Guidelines

#### 1. Performance Test Structure

```typescript
it("should complete initialization within performance targets", async () => {
	const startTime = performance.now()
	await manager.initialize(mockContext)
	const endTime = performance.now()

	expect(endTime - startTime).toBeLessThan(2000) // 2 seconds
})
```

#### 2. Memory Testing

```typescript
it("should not leak memory during initialization cycles", async () => {
	const initialMemory = process.memoryUsage().heapUsed

	// Run multiple initialization cycles
	for (let i = 0; i < 10; i++) {
		await manager.initialize(mockContext)
		await manager.dispose()
	}

	const finalMemory = process.memoryUsage().heapUsed
	expect(finalMemory - initialMemory).toBeLessThan(1024 * 1024) // 1MB
})
```

## Troubleshooting

### Common Issues and Solutions

#### 1. Test Timeout Issues

```bash
# Increase timeout for slow tests
cd src && npx vitest run --test-timeout=10000 services/code-index/__tests__/initialization.test.ts
```

#### 2. Coverage Issues

```bash
# Generate detailed coverage report
cd src && npx vitest run --coverage --reporter=verbose

# Check uncovered lines
cd src && npx vitest run --coverage --coverage.reporters=text-lcov | grep "##"
```

#### 3. Integration Test Failures

```bash
# Check test environment
echo $NODE_ENV
echo $VITEST_ENVIRONMENT

# Reset test environment
cd src && npx vitest run __tests__/integration/ --reset-cache
```

### Getting Help

#### 1. Test Documentation

- [Vitest Documentation](https://vitest.dev/)
- [Test Coverage Guide](COVERAGE_REPORT.md)
- [Test Execution Summary](TEST_EXECUTION_SUMMARY.md)

#### 2. Community Support

- Project Issues: GitHub repository
- Testing Questions: Development team chat
- Performance Issues: Performance optimization team

---

This testing procedures document provides comprehensive guidance for executing, maintaining, and troubleshooting the CodeIndexManager initialization fix test suites. Regular updates should be made as new test scenarios are added or testing procedures evolve.
