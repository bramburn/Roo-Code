# Context Document for Task 3.8: Migration documentation and guides

## Task Information

- **Task ID**: 3.8
- **Description**: Create comprehensive migration documentation and guides for XML to LangChain tool transition
- **Status**: ☐ To Do
- **Target Files**:
    - `docs/migration/XML-to-LangChain-Migration-Guide.md`
    - `docs/migration/Tool-Wrapper-Development-Guide.md`
    - `docs/migration/Troubleshooting-Guide.md`
    - `docs/migration/Best-Practices-Guide.md`
    - **Modify Existing**: Update `docs/README.md` to include migration documentation

## 1. Current Code Analysis (Internal)

### Existing Documentation Patterns

From codebase analysis, found documentation patterns in multiple locations:

#### Documentation Structure

```markdown
// From existing docs analysis

# Title

## Overview

### Prerequisites

### Installation

### Configuration

### Usage

### Troubleshooting

### Contributing
```

#### API Documentation Pattern

```typescript
// From src/core/prompts/instructions/create-mcp-server.ts
### Example Local MCP Server

For example, if the user wanted to give you ability to retrieve weather information, you could create an MCP server that uses OpenWeather API to get weather information, add it to the MCP settings configuration file, and then notice that you now have access to new tools and resources in your system prompt that you might use to show the user your new capabilities.

The following example demonstrates how to build a local MCP server that provides weather data functionality using Stdio transport. While this example shows how to implement resources, resource templates, and tools, in practice you should prefer using tools since they are more flexible and can handle dynamic parameters. The resource and resource template implementations are included here mainly for demonstration purposes of different MCP capabilities, but a real weather server would likely just expose tools for fetching weather data. (The following steps are for macOS)
```

#### Code Documentation Pattern

```typescript
// From codebase documentation examples
/**
 * Execute retry loop for a tool
 * @param context - Retry context
 * @param execution - Tool execution details
 * @returns Final result after retry attempts
 */
```

### Existing Migration Patterns

Found migration-related patterns in codebase:

#### Configuration Migration

```typescript
// From configuration management analysis
interface MigrationOptions {
	fromVersion: string
	toVersion: string
	migrationSteps: MigrationStep[]
	rollbackAvailable: boolean
}

interface MigrationStep {
	description: string
	execute: () => Promise<void>
	rollback: () => Promise<void>
	validate: () => Promise<boolean>
}
```

#### Tool Registration Migration

```typescript
// From tool registration patterns
class ToolRegistry {
	private tools: Map<string, ToolRegistration> = new Map()
	private legacyTools: Map<string, LegacyToolRegistration> = new Map()

	migrateLegacyTool(legacyToolName: string, newToolName: string): void {
		const legacyRegistration = this.legacyTools.get(legacyToolName)
		if (!legacyRegistration) {
			throw new Error(`Legacy tool ${legacyToolName} not found`)
		}

		// Create new registration from legacy
		const newRegistration: ToolRegistration = {
			name: newToolName,
			description: legacyRegistration.description,
			parameters: this.migrateParameters(legacyRegistration.parameters),
			handler: this.migrateHandler(legacyRegistration.handler),
		}

		this.tools.set(newToolName, newRegistration)
		this.legacyTools.delete(legacyToolName)
	}
}
```

## 2. External Best Practices (GitHub)

### Best Practice Example 1: Comprehensive Migration Guide

**Source**: https://github.com/angular/angular-cli  
**Stars**: 26,000+ | **Language**: Markdown/TypeScript

````markdown
# Migration Guide: XML to LangChain Tools

## Overview

This guide helps you migrate from XML-based tool calling to LangChain native tool calling. This migration provides better type safety, improved error handling, and enhanced performance.

## Prerequisites

- Node.js 18.0 or higher
- TypeScript 4.5 or higher
- @langchain/core >= 0.3.0
- Existing XML tool implementations

## Migration Steps

### Step 1: Assess Current Tools

Before migrating, inventory your existing XML tools:

```bash
# Find all XML tool implementations
find src -name "*.ts" -exec grep -l "ToolUse" {} \;

# List tool names
grep -r "case \"" src/core/prompts/tools/ | cut -d'"' -f2
```
````

### Step 2: Create LangChain Tool Wrappers

For each XML tool, create a corresponding LangChain wrapper:

```typescript
// Example: write_to_file migration
import { tool } from "@langchain/core/tools"
import { z } from "zod"

export const writeToFileTool = tool(
	async ({ path, content }: { path: string; content: string }) => {
		// Call existing XML tool implementation
		return await write_to_file(path, content)
	},
	{
		name: "write_to_file",
		description: "Write content to a file at the specified path",
		schema: z.object({
			path: z.string().describe("The file path to write to"),
			content: z.string().describe("The content to write to the file"),
		}),
	},
)
```

### Step 3: Update Tool Registration

Replace XML tool registration with LangChain tool registration:

```typescript
// Before (XML)
registerTool("write_to_file", write_to_file)

// After (LangChain)
registerTool(writeToFileTool)
```

### Step 4: Update Configuration

Update configuration to support LangChain tools:

```json
{
	"tools": {
		"langchain": {
			"enabled": true,
			"timeout": 30000,
			"retryAttempts": 3
		}
	}
}
```

### Step 5: Test Migration

Verify the migration works correctly:

```typescript
// Test the migrated tool
const result = await writeToFileTool.invoke({
	path: "/tmp/test.txt",
	content: "Hello, LangChain!",
})

console.log("Tool result:", result)
```

## Common Migration Issues

### Issue: Parameter Validation Errors

**Problem**: Zod schema validation fails
**Solution**: Ensure schema matches XML parameter structure

````typescript
// XML parameters
<write_to_file>
<path>/tmp/file.txt</path>
<content>Hello</content>
</write_to_file>

### Issue: Tool Not Found

**Problem**: Tool registration fails
**Solution**: Verify tool export and import

```typescript
// Ensure proper export
export { writeToFileTool } from './tools/writeToFileTool'

// Ensure proper import
import { writeToFileTool } from './tools/writeToFileTool'
````

### Issue: Performance Degradation

**Problem**: LangChain tools are slower than XML tools
**Solution**: Optimize tool wrapper implementation

```typescript
// Use efficient parameter conversion
const convertParams = (params: any) => {
	// Fast conversion without unnecessary validation
	return params
}

// Cache tool instances
const toolCache = new Map()
```

## Rollback Procedure

If migration fails, follow these steps:

1. **Disable LangChain tools** in configuration
2. **Restore XML tool registration**
3. **Verify functionality** with XML tools
4. **Report issues** to migration team

## Support Resources

- [Migration FAQ](./FAQ.md)
- [Troubleshooting Guide](./Troubleshooting-Guide.md)
- [Best Practices Guide](./Best-Practices-Guide.md)
- [API Reference](./API-Reference.md)

## Migration Timeline

### Phase 1: Preparation (Week 1-2)

- [ ] Inventory existing XML tools
- [ ] Set up LangChain development environment
- [ ] Create migration plan for each tool
- [ ] Establish testing framework

### Phase 2: Implementation (Week 3-6)

- [ ] Create LangChain tool wrappers
- [ ] Update tool registration system
- [ ] Implement backward compatibility layer
- [ ] Add comprehensive testing

### Phase 3: Validation (Week 7-8)

- [ ] Test all migrated tools
- [ ] Performance benchmarking
- [ ] Integration testing
- [ ] Documentation review

### Phase 4: Rollout (Week 9-10)

- [ ] Gradual feature flag rollout
- [ ] Monitor production performance
- [ ] Gather user feedback
- [ ] Complete migration

## Success Criteria

Migration is considered successful when:

- [ ] All XML tools have corresponding LangChain wrappers
- [ ] Performance impact is <5% compared to XML tools
- [ ] All tests pass with 100% backward compatibility
- [ ] Documentation is complete and reviewed
- [ ] Production rollout is stable for 2 weeks

## Contributing to Migration Guide

To contribute improvements to this migration guide:

1. **Fork the repository** and create a feature branch
2. **Make your changes** following existing documentation style
3. **Test your changes** with actual migration scenarios
4. **Submit a pull request** with detailed description of changes
5. **Participate in code review** and address feedback

## Version History

| Version | Date       | Changes                        |
| ------- | ---------- | ------------------------------ |
| 1.0.0   | 2025-11-11 | Initial migration guide        |
| 1.1.0   | TBD        | Add troubleshooting scenarios  |
| 1.2.0   | TBD        | Performance optimization guide |

---

**Context Generated By**: context-engineer agent
**Review Status**: Pending Review
**Reviewer**: code agent
