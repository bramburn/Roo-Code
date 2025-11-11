# Context Document for Task 1.1: Development Environment Setup

## Task Information

- **Task ID**: 1.1
- **Description**: Set up development environment with necessary LangChain/LangGraph dependencies and configuration
- **Status**: ☐ To Do
- **Target Files**:
    - package.json
    - tsconfig.json
    - esbuild.mjs (build configuration)
    - eslint.config.mjs (linting configuration)

## 1. Current Code Analysis

### Existing Project Structure

The Roo Code extension is a VSCode extension built with:

- **TypeScript**: Strict mode, ES2022 target, ESNext modules
- **Build System**: esbuild with custom configuration
- **Package Manager**: pnpm with monorepo structure
- **Linting**: ESLint with base configuration from @roo-code/config-eslint

### Current package.json Structure

- **Main Dependencies**: 70+ packages including AI SDKs, VSCode APIs, utilities
- **Dev Dependencies**: TypeScript, ESLint, Vitest, build tools
- **Scripts**: lint, test, bundle, build, publish workflows
- **Engines**: Node.js 20.19.2, VSCode ^1.84.0

### Current TypeScript Configuration

```json
{
	"compilerOptions": {
		"types": ["vitest/globals"],
		"esModuleInterop": true,
		"experimentalDecorators": true,
		"forceConsistentCasingInFileNames": true,
		"isolatedModules": true,
		"lib": ["es2022", "esnext.disposable", "DOM"],
		"module": "esnext",
		"moduleResolution": "Bundler",
		"strict": true,
		"target": "ES2022"
	}
}
```

### Current Build Configuration (esbuild.mjs)

- **Bundle**: CommonJS format for Node.js platform
- **External**: vscode package
- **Plugins**: Custom file copying, locale handling, problem matching
- **Output**: dist/extension.js

### Current ESLint Configuration

- **Base**: @roo-code/config-eslint/base
- **Globals**: Node.js and VSCode globals defined
- **Rules**: Several TypeScript rules disabled for compatibility

## 2. External Best Practices

### LangChain/LangGraph Dependency Patterns

Based on analysis of 170+ GitHub repositories using these dependencies:

#### Recommended Versions

```json
{
	"@langchain/core": "^0.3.42",
	"@langchain/langgraph": "^0.2.21",
	"@langchain/openai": "^0.4.4"
}
```

#### Common Integration Patterns

1. **Package.json Structure**:

    - Use caret (^) for flexible versioning
    - Include @langchain/openai for LLM integration
    - Add langchain as main package when needed

2. **TypeScript Configuration**:

    - Include LangChain types in compiler options
    - Use strict mode for better type safety
    - Enable experimentalDecorators for LangGraph features

3. **Build Configuration**:
    - External LangChain packages from bundling (Node.js environment)
    - Handle dynamic imports for optional dependencies
    - Source maps for debugging

#### Repository Examples

- **Layr-Labs/hypesignal**: Pulse agent with LangGraph ^0.2.21
- **Story91/mysphere**: Basebook with comprehensive LangChain setup
- **DiscovAI/DiscovAI-search**: AI-powered search with LangChain integration

### Configuration Best Practices

#### TypeScript Updates

```json
{
	"compilerOptions": {
		"types": ["vitest/globals", "@langchain/core/types"],
		"esModuleInterop": true,
		"allowSyntheticDefaultImports": true
	}
}
```

#### ESLint Configuration

```javascript
{
  "rules": {
    "@typescript-eslint/no-explicit-any": "warn", // LangChain often uses any
    "@typescript-eslint/no-require-imports": "off", // Dynamic imports
    "no-console": "off" // LangChain logging
  }
}
```

#### Build Configuration

```javascript
// External dependencies for esbuild
external: ["vscode", "@langchain/core", "@langchain/langgraph", "@langchain/openai"]
```

## 3. Internal Knowledge Base

### Previous LangChain Integrations

- **No existing LangChain dependencies** found in current codebase
- **AI SDKs present**: @anthropic-ai/sdk, openai, @google/genai
- **MCP Integration**: @modelcontextprotocol/sdk for Model Context Protocol

### Roo Code Extension Patterns

- **Workspace Packages**: @roo-code/\* for shared functionality
- **Build Process**: esbuild with custom plugins
- **Testing**: Vitest with comprehensive test setup
- **Internationalization**: Multi-language support with locale files

### Dependency Management

- **Monorepo**: pnpm workspaces for package management
- **Version Control**: Strict versioning for core dependencies
- **Security**: Regular updates for AI SDKs and dependencies

## 4. Suggested Implementation Plan

### Step 1: Update package.json Dependencies

1. **Add LangChain Core Dependencies**:

    ```json
    {
    	"@langchain/core": "^0.3.42",
    	"@langchain/langgraph": "^0.2.21",
    	"@langchain/openai": "^0.4.4"
    }
    ```

2. **Update package.json**:
    - Add dependencies to dependencies section
    - Maintain existing dependency structure
    - Ensure compatibility with current Node.js version

### Step 2: Update TypeScript Configuration

1. **Modify tsconfig.json**:

    ```json
    {
    	"compilerOptions": {
    		"types": ["vitest/globals", "@langchain/core/types"],
    		"allowSyntheticDefaultImports": true,
    		"esModuleInterop": true
    	}
    }
    ```

2. **Include LangGraph types**:
    - Add type paths if needed
    - Ensure proper module resolution

### Step 3: Update Build Configuration

1. **Modify esbuild.mjs**:

    ```javascript
    external: ["vscode", "@langchain/core", "@langchain/langgraph", "@langchain/openai"]
    ```

2. **Handle dynamic imports**:
    - Configure bundler for optional dependencies
    - Maintain source map generation

### Step 4: Update ESLint Configuration

1. **Modify eslint.config.mjs**:

    ```javascript
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-require-imports": "off",
      "no-console": "off"
    }
    ```

2. **Add LangChain-specific rules**:
    - Allow any types where LangChain requires
    - Enable dynamic imports for graph construction

### Step 5: Validation and Testing

1. **Install dependencies**:

    ```bash
    pnpm install
    ```

2. **Type checking**:

    ```bash
    pnpm check-types
    ```

3. **Build verification**:

    ```bash
    pnpm bundle
    ```

4. **Lint verification**:
    ```bash
    pnpm lint
    ```

## 5. Dependencies

### Task Dependencies

- **None**: This is a foundational setup task

### File Dependencies

- **src/package.json**: Must exist and follow current structure
- **src/tsconfig.json**: Must maintain existing TypeScript configuration
- **src/esbuild.mjs**: Must preserve existing build functionality
- **src/eslint.config.mjs**: Must maintain current linting rules

### External Dependencies

- **Node.js 20.19.2+**: Required for LangChain compatibility
- **pnpm**: Package manager for monorepo
- **Internet access**: For downloading new dependencies

## 6. Notes and Warnings

### Potential Issues

1. **Version Conflicts**: LangChain dependencies may conflict with existing AI SDKs
2. **Bundle Size**: New dependencies will increase extension bundle size
3. **Type Safety**: LangChain uses 'any' types frequently
4. **Performance**: Additional dependencies may impact extension startup time

### Mitigation Strategies

1. **Version Pinning**: Use specific versions to avoid conflicts
2. **External Dependencies**: Keep LangChain external from bundling
3. **Type Overrides**: Use TypeScript overrides for problematic types
4. **Lazy Loading**: Implement dynamic imports for optional features

### Compatibility Considerations

- **VSCode API**: Ensure no conflicts with existing VSCode integration
- **MCP Protocol**: Maintain compatibility with Model Context Protocol
- **Existing AI SDKs**: Preserve current Anthropic, OpenAI, Google integrations

### Future Considerations

- **Migration Path**: Plan for gradual migration to LangChain patterns
- **Testing Strategy**: Implement comprehensive tests for new functionality
- **Documentation**: Update extension documentation for new capabilities
- **Performance Monitoring**: Track impact on extension performance

## 7. Implementation Commands

### Package Installation

```bash
# Install new dependencies
pnpm add @langchain/core@^0.3.42 @langchain/langgraph@^0.2.21 @langchain/openai@^0.4.4

# Verify installation
pnpm list | grep langchain
```

### Build and Test Commands

```bash
# Type checking
pnpm check-types

# Build extension
pnpm bundle

# Run linting
pnpm lint

# Run tests
pnpm test
```

### Validation Commands

```bash
# Check bundle size
ls -la dist/extension.js

# Verify dependencies
pnpm why @langchain/core

# Check for conflicts
pnpm ls --depth=0
```

This context provides comprehensive guidance for implementing Task 1.1 while maintaining compatibility with the existing Roo Code extension architecture.
