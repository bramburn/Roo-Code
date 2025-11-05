# Testing Infrastructure Scripts

This directory contains the core testing infrastructure scripts for the Roo-Code VSCode extension project.

## 📁 Scripts Overview

### Core Scripts

| Script                                               | Purpose              | Key Features                                       |
| ---------------------------------------------------- | -------------------- | -------------------------------------------------- |
| [`test-runner.mjs`](./test-runner.mjs)               | Unified test runner  | Cross-platform test execution, coverage, filtering |
| [`test-env-config.mjs`](./test-env-config.mjs)       | Environment setup    | Test environment configuration, directory setup    |
| [`test-scenarios.mjs`](./test-scenarios.mjs)         | Test scenario runner | Specialized test scenarios, templates              |
| [`coverage-reporter.mjs`](./coverage-reporter.mjs)   | Coverage reporting   | HTML/JSON reports, threshold checking              |
| [`continuous-testing.mjs`](./continuous-testing.mjs) | Continuous testing   | File watching, automated test execution            |

## 🚀 Quick Start

```bash
# Setup test environment
node scripts/test-env-config.mjs setup

# Run all tests
node scripts/test-runner.mjs --coverage

# Start continuous testing
node scripts/continuous-testing.mjs start

# Generate coverage report
node scripts/coverage-reporter.mjs full
```

## 📋 Detailed Usage

### test-runner.mjs

The unified test runner that can execute tests across different platforms and categories.

```bash
# Basic usage
node scripts/test-runner.mjs

# Run specific category
node scripts/test-runner.mjs --category unit
node scripts/test-runner.mjs --platform backend

# With coverage
node scripts/test-runner.mjs --coverage

# Watch mode
node scripts/test-runner.mjs --watch

# Verbose output
node scripts/test-runner.mjs --verbose

# Custom pattern
node scripts/test-runner.mjs --pattern "**/api.spec.ts"

# Bail on first failure
node scripts/test-runner.mjs --bail
```

**Options:**

- `--category <type>`: Test category (unit, integration, component, performance, e2e, regression)
- `--platform <type>`: Platform (backend, frontend)
- `--coverage`: Generate coverage report
- `--watch`: Run tests in watch mode
- `--verbose`: Enable verbose output
- `--silent`: Silent mode
- `--pattern <pattern>`: Custom test file pattern
- `--bail`: Stop on first failure
- `--reporter <type>`: Test reporter (default, verbose, json)

### test-env-config.mjs

Sets up the test environment with proper configuration files and directories.

```bash
# Complete setup
node scripts/test-env-config.mjs setup

# Clean environment
node scripts/test-env-config.mjs clean

# Setup specific components
node scripts/test-env-config.mjs directories
node scripts/test-env-config.mjs env-files
node scripts/test-env-config.mjs vitest
node scripts/test-env-config.mjs github
node scripts/test-env-config.mjs scripts
```

**What it sets up:**

- Test directories (test-storage, test-cache, etc.)
- Environment files (.env.test, .env.coverage)
- Enhanced Vitest configurations with coverage
- GitHub Actions workflows
- Package.json test scripts

### test-scenarios.mjs

Runs specialized test scenarios and creates test templates.

```bash
# List all scenarios
node scripts/test-scenarios.mjs list

# Run specific scenario
node scripts/test-scenarios.mjs unit
node scripts/test-scenarios.mjs integration:api
node scripts/test-scenarios.mjs performance:codeIndexing

# Create templates
node scripts/test-scenarios.mjs templates
node scripts/test-scenarios.mjs performance-templates
node scripts/test-scenarios.mjs integration-templates
```

**Available Scenarios:**

- `unit`: Backend and frontend unit tests
- `component`: React and extension component tests
- `integration`: API, cross-platform, context loading tests
- `performance`: Code indexing, tree-sitter, memory tests
- `e2e`: Extension lifecycle and user workflow tests
- `regression`: Critical bug and security regression tests

### coverage-reporter.mjs

Generates comprehensive coverage reports from backend and frontend tests.

```bash
# Show coverage summary
node scripts/coverage-reporter.mjs summary

# Generate HTML report
node scripts/coverage-reporter.mjs html

# Generate JSON report
node scripts/coverage-reporter.mjs json

# Generate full report (both HTML and JSON)
node scripts/coverage-reporter.mjs full

# Clean old reports
node scripts/coverage-reporter.mjs cleanup
```

**Features:**

- Combines coverage from backend and frontend
- Generates interactive HTML reports
- Creates JSON reports for CI/CD integration
- Checks coverage thresholds
- Visual coverage indicators

### continuous-testing.mjs

Provides continuous testing capabilities with file watching and automated execution.

```bash
# Start continuous testing
node scripts/continuous-testing.mjs start

# Create GitHub Actions workflow
node scripts/continuous-testing.mjs workflow

# Run single test cycle
node scripts/continuous-testing.mjs test
```

**Features:**

- File watching with debouncing
- Smart test selection based on changed files
- Failure tracking and automatic stopping
- Report generation
- Status reporting

## 🔧 Configuration

### Test Categories

The testing infrastructure is organized into these categories:

1. **Unit Tests**: Individual component and function testing
2. **Component Tests**: React component and extension component testing
3. **Integration Tests**: Cross-system interaction testing
4. **Performance Tests**: Performance and memory testing
5. **E2E Tests**: End-to-end workflow testing
6. **Regression Tests**: Bug regression and security testing

### Coverage Thresholds

Default coverage thresholds (configurable in environment):

- **Lines**: ≥ 80%
- **Functions**: ≥ 80%
- **Branches**: ≥ 75%
- **Statements**: ≥ 80%

### Test Environment

The scripts configure these environment variables:

- `NODE_ENV=test`: Test environment flag
- `VITEST=true`: Vitest test runner flag
- `TELEMETRY_DISABLED=true`: Disable telemetry in tests
- `VSCODE_TEST=true`: VS Code extension test mode
- `API_MOCK_MODE=true`: Mock external APIs

## 📁 Generated Files

### Environment Files

- `.env.test`: Global test environment
- `src/.env.test`: Backend-specific test environment
- `webview-ui/.env.test`: Frontend-specific test environment
- `.env.coverage`: Coverage configuration

### Test Directories

- `test-storage/`: Test file storage
- `test-cache/`: Test cache directory
- `test-extension-storage/`: Extension test storage
- `test-database/`: Test database files
- `coverage-reports/`: Combined coverage reports
- `test-reports/`: Individual test reports

### CI/CD Files

- `.github/workflows/test.yml`: GitHub Actions test workflow
- `.github/workflows/continuous-testing.yml`: Continuous testing workflow

## 🚨 Troubleshooting

### Common Issues

1. **Permission Errors**

    ```bash
    # Ensure scripts are executable
    chmod +x scripts/*.mjs
    ```

2. **Environment Issues**

    ```bash
    # Reset environment
    node scripts/test-env-config.mjs clean
    node scripts/test-env-config.mjs setup
    ```

3. **Coverage Issues**
    ```bash
    # Clean coverage
    node scripts/coverage-reporter.mjs cleanup
    # Regenerate
    node scripts/test-runner.mjs --coverage
    ```

### Debug Mode

Enable debug output for troubleshooting:

```bash
# Verbose test runner
node scripts/test-runner.mjs --verbose

# Debug continuous testing
DEBUG=true node scripts/continuous-testing.mjs start
```

## 🤝 Contributing

When modifying the testing infrastructure:

1. **Test Your Changes**: Ensure scripts work with existing tests
2. **Update Documentation**: Keep this README and the main testing guide updated
3. **Maintain Compatibility**: Ensure backward compatibility with existing workflows
4. **Add Tests**: Test the infrastructure itself where appropriate

## 📚 Related Documentation

- [Main Testing Guide](../docs/testing-guide.md): Comprehensive testing documentation
- [Vitest Configuration](../src/vitest.config.ts): Backend test configuration
- [Frontend Test Config](../webview-ui/vitest.config.ts): Frontend test configuration
- [Package.json Scripts](../package.json): Available npm scripts

## 🔄 Version History

- **v1.0.0**: Initial testing infrastructure
    - Unified test runner
    - Environment configuration
    - Coverage reporting
    - Continuous testing
    - Test scenarios

---

For questions or issues with the testing infrastructure, please refer to the main testing guide or open an issue in the project repository.
