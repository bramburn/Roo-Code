# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

This is a Turborepo monorepo using pnpm. Here are the essential commands:

### Installation & Setup

```bash
pnpm install              # Install all dependencies and bootstrap packages
pnpm clean               # Clean all build artifacts
```

### Core Development Tasks

```bash
# Build everything
pnpm build               # Build all packages in the correct order

# Testing & Quality
pnpm test                # Run all tests across packages
pnpm test <package>      # Run tests for a specific package
pnpm lint                # Lint all packages
pnpm check-types         # Type check all packages
pnpm format              # Format all code with Prettier

# Extension Development
pnpm vsix                # Build the VSCode extension as a .vsix file
pnpm vsix:nightly        # Build the nightly version
pnpm install:vsix        # Build and install extension directly into VSCode
pnpm install:vsix [-y] [--editor=<command>]  # With options: -y to skip prompts, --editor to specify editor

# Development Mode
# Press F5 in VSCode to launch the extension in a new development window
# This provides hot reloading for both extension and webview changes
```

### Package-Specific Commands

```bash
# From root, run commands on specific packages
pnpm --filter @roo-code/vscode-webview dev     # Start webview dev server
pnpm --filter @roo-code/cloud test             # Run cloud package tests
pnpm --filter @roo-code/evals <command>        # Run commands on evals package
```

### Advanced Commands

```bash
pnpm bundle              # Bundle the extension (production-ready)
pnpm bundle:nightly      # Bundle nightly version
pnpm knip                # Detect unused files and exports
pnpm changeset:version   # Version management with changesets
```

## Project Architecture

This is a sophisticated VSCode extension built as a monorepo with the following key components:

### Core Structure

- **`src/`** - Main VSCode extension code (TypeScript)

    - `extension.ts` - Extension entry point and activation logic
    - `core/` - Core business logic including:
        - `webview/ClineProvider.ts` - Main webview provider
        - `assistant-message/` - Message parsing and handling
        - `prompts/` - System prompt generation and management
        - `config/` - Extension configuration and settings management
        - `diff/` - Code diff strategy implementations
    - `activate/` - Extension activation utilities and command registration
    - `api/providers/` - 30+ AI provider integrations (OpenAI, Anthropic, Bedrock, etc.)
    - `services/` - Core services (MCP server management, code indexing, etc.)
    - `integrations/` - VSCode editor and terminal integrations

- **`webview-ui/`** - React-based user interface (TypeScript + Vite)

    - Built with Radix UI components
    - Uses shadcn/ui design system
    - Real-time chat interface, file editing, and task management
    - Hot reloads automatically during development

- **`packages/`** - Shared packages:
    - `cloud/` - Cloud services and API integration
    - `build/` - Build tooling and utilities
    - `config-eslint/` & `config-typescript/` - Shared config packages
    - `evals/` - Evaluation framework for testing AI responses
    - `types/` - Shared TypeScript type definitions

### Key Architectural Patterns

**Provider Architecture**: The extension uses a provider pattern for AI integrations with 30+ providers in `src/api/providers/`. Each provider implements a consistent interface for different AI services.

**WebView Communication**: The extension uses VSCode's webview API with a sophisticated React frontend. Communication happens through serialized messages between the extension backend and webview UI.

**Multi-Modal Operation**: Supports different modes (Code, Architect, Ask, Debug, Custom) with tailored prompts and behaviors for each mode.

** MCP (Model Context Protocol)**: Full MCP server support for extending functionality with external tools and data sources.

**Context Management**: Sophisticated context tracking and management system for maintaining conversation history and file context.

### Testing Strategy

- Unit tests with Vitest
- Integration tests for provider implementations
- Snapshot tests for prompts and message parsing
- VSCode extension tests using the test runner

### Build Process

The extension uses Turborepo for efficient builds with proper dependency ordering. The build process:

1. Builds shared packages first (`types`, `config-*`, `build`)
2. Builds the webview UI (React app)
3. Copies webview build artifacts to `src/webview-ui/`
4. Builds the main VSCode extension
5. Packages everything into a `.vsix` file

### Configuration Files

- `turbo.json` - Turborepo task configuration
- `pnpm-workspace.yaml` - Workspace package definitions
- `knip.json` - Unused file detection configuration
- `ellipsis.yaml` - Code coverage configuration

## Development Notes

**Extension Testing**: Use F5 in VSCode for development. This opens a new VSCode window (Extension Development Host) with your extension loaded and provides hot reloading for both extension and webview changes.

**Webview Development**: The webview UI can be developed independently with `pnpm --filter @roo-code/vscode-webview dev` for faster iteration.

**Provider Development**: When adding new AI providers, follow the patterns in `src/api/providers/` and ensure proper error handling, timeout management, and test coverage.

**Internationalization**: The extension supports multiple languages with i18n configuration in `src/i18n/`.

**Security**: The codebase includes comprehensive security measures including RooIgnore support (`.rooignore` files), content security policies, and input validation.

## Advanced Code Analysis & Fixes with AST-Grep

This repository includes **ast-grep** for advanced code analysis and automated fixes. AST-grep is a powerful tool for searching and rewriting code using Abstract Syntax Trees (ASTs).

### When to Use AST-Grep

Use ast-grep for:

- **Large-scale refactoring** across multiple files
- **Consistent API changes** that affect many code locations
- **Code pattern migrations** and deprecations
- **Automated code quality fixes**
- **Type system updates** and interface changes

### Getting Started

```bash
# Check if ast-grep is available
ast-grep --help

# Run basic search and rewrite operations
ast-grep --pattern 'console\.log' --rewrite 'console.warn' src/

# Scan for issues using configuration files
ast-grep scan --config .astgprc.yml

# Test rules before applying
ast-grep test --config .astgprc.yml
```

### Common AST-Grep Patterns

#### Type Migration

```bash
# Replace deprecated API with new one
ast-grep --pattern 'oldApiName' --rewrite 'newApiName' src/

# Add type annotations
ast-grep --pattern 'function ($$){' --rewrite 'function ($1): ReturnType {' src/
```

#### Code Quality Improvements

```bash
# Fix common TypeScript errors
ast-grep --pattern 'any[\s*[]]' --rewrite 'unknown[]' src/

# Remove unused imports
astsgrep --pattern 'import.*from.*unused' --rewrite '' src/
```

#### Architecture Refactoring

```bash
# Rename interfaces consistently
ast-grep --pattern 'interface OldName' --rewrite 'interface NewName' src/

# Update method signatures
ast-grep --pattern 'oldMethod\(.*\)' --rewrite 'newMethod($1)' src/
```

### Configuration Examples

Create `.astgprc.yml` for reusable rules:

```yaml
# Example .astgprc.yml
rules:
    - id: fix-console-log
      pattern: console.log($$$)
      rewrite: console.warn($$)
      language: ts
      message: "Replace console.log with console.warn"

    - id: fix-null-checks
      pattern: if ($expr == null)
      rewrite: if ($expr === null)
      language: ts
      message: "Use === for null checks"

    - id: update-deprecated-api
      pattern: oldApiMethod($$ARGS)
      rewrite: newApiMethod($$ARGS)
      language: ts
      message: "Update to new API method"
```

### Integration with Development Workflow

```bash
# Before making large changes
ast-grep scan --rule deprecated-api src/ > changes.md

# Apply fixes interactively
ast-grep rewrite --config .astgprc.yml src/

# Verify changes
ast-grep test --config .astgprc.yml

# Run final type checking
pnpm check-types
```

### Benefits

- **Pattern Matching**: Precise AST-based pattern matching vs regex
- **Type-Aware**: Understands TypeScript/JavaScript structure
- **Safe Operations**: Preserves formatting and comments
- **Batch Operations**: Apply changes across entire codebase
- **Undo Support**: Rollback changes if needed

For more complex refactoring tasks, ast-grep can significantly speed up development and ensure consistency across the entire codebase.
