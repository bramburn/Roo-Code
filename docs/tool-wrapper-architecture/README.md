# Tool Wrapper Architecture

## Overview

The Tool Wrapper Architecture provides a standardized way to integrate legacy Roo Code tools with LangChain's native tool calling system while maintaining backward compatibility during the transition period.

## Architecture Components

### Core Components

#### 1. Base Wrapper Classes (`src/tools/wrappers/base/`)

**LangGraphToolWrapper.ts**

- Abstract base class for all tool wrappers
- Provides common functionality for parameter validation and conversion
- Handles legacy tool execution bridging
- Implements error handling and result formatting

**Key Features:**

- Zod schema validation
- Parameter conversion between LangChain and legacy formats
- Error handling and recovery
- Result formatting and consistency

#### 2. Tool Schemas (`src/tools/schemas/`)

**WriteToFileSchema.ts**

- Zod schema for writeToFile tool parameters
- Security validations (path traversal, content limits)
- Type safety and input validation

**ReadFileSchema.ts**

- Zod schema for readFile tool parameters
- Line range validation
- File path security checks

**ExecuteCommandSchema.ts**

- Zod schema for executeCommand tool parameters
- Command safety classification
- Injection prevention
- Command validation rules

**UseMcpToolSchema.ts**

- Zod schema for MCP tool parameters
- Server and tool name validation
- Argument format validation
- MCP protocol compliance

#### 3. Validation System (`src/tools/validation/`)

**ZodSchemaValidator.ts**

- Centralized schema validation
- Parameter conversion and type coercion
- Error message formatting
- Validation statistics and monitoring

**ValidationRules.ts**

- Pre-built validation rules for common parameter types
- Rule composition and chaining
- Custom validation patterns

**SchemaBuilder.ts**

- Schema creation utilities
- Legacy parameter to Zod schema conversion
- Built-in tool schemas

#### 4. Registry System (`src/tools/registry/`)

**ToolWrapperRegistry.ts**

- Tool registration and discovery
- LangChain tool management
- Metadata and statistics

**ToolDiscovery.ts**

- Automatic tool discovery from file system
- Dynamic tool loading
- Plugin-like architecture

**ToolRegistration.ts**

- Simplified registration API
- Batch operations
- Validation and error handling

#### 5. Transitional Layer (`src/transitional/`)

**TransitionalExecutor.ts**

- Bridge between LangGraph and existing task loop
- Tool execution coordination
- Performance monitoring and logging

**TaskLoopBridge.ts**

- Message flow management
- Task state synchronization
- History tracking and analytics

**LegacyToolAdapter.ts**

- Legacy tool format conversion
- Compatibility layer
- Migration utilities

**TransitionalConfig.ts**

- Configuration management
- Feature flags
- Environment variable integration

## Tool Wrapper Implementation Pattern

### 1. Schema Definition

```typescript
// src/tools/schemas/ExampleToolSchema.ts
import { z } from "zod"

export const ExampleToolSchema = z
	.object({
		parameter1: z.string().min(1, "Parameter 1 is required"),
		parameter2: z.number().int().min(0).optional(),
	})
	.describe("Description of the tool")

export type ExampleToolInput = z.infer<typeof ExampleToolSchema>
```

### 2. Wrapper Implementation

```typescript
// src/tools/wrappers/ExampleToolWrapper.ts
import { DynamicStructuredTool } from "@langchain/core/tools"
import { LangGraphToolWrapper, ToolWrapperConfig } from "./base/LangGraphToolWrapper"
import { ExampleToolSchema, ExampleToolInput } from "../schemas/ExampleToolSchema"
import { exampleToolFunction } from "../../core/tools/exampleTool"

export class ExampleToolWrapper extends LangGraphToolWrapper {
	constructor(context) {
		const config: ToolWrapperConfig = {
			toolName: "example_tool",
			description: "Description of the tool",
			zodSchema: ExampleToolSchema,
			legacyToolFunction: exampleToolFunction,
		}

		super(context, config)
	}

	public static create(context): DynamicStructuredTool {
		const wrapper = new ExampleToolWrapper(context)
		return wrapper.createLangChainTool()
	}

	protected override async executeTool(params: ExampleToolInput): Promise<string> {
		// Custom validation logic if needed
		// Call parent execute method
		return super.executeTool(params)
	}
}
```

### 3. Registration

```typescript
// Register the tool
import { ToolRegistration } from "../tools/registry/ToolRegistration"
import { ExampleToolWrapper } from "./ExampleToolWrapper"

const tool = ExampleToolWrapper.create(context)
ToolRegistration.registerFromLangChainTool(tool, "1.0.0", {
	category: "example",
	tags: ["example", "demo"],
})
```

## Integration Flow

### 1. Tool Registration Phase

1. Tool schemas defined using Zod
2. Wrapper classes extend LangGraphToolWrapper
3. Tools registered in ToolWrapperRegistry
4. Discovery mechanisms auto-load tools

### 2. Execution Phase

1. LLM generates tool calls in native LangChain format
2. TransitionalExecutor receives AIMessage with tool_calls
3. Tool calls validated using Zod schemas
4. Parameters converted to legacy format
5. Legacy tool functions executed
6. Results formatted and returned

### 3. Bridge Phase

1. Results captured through wrapper system
2. TaskLoopBridge manages state synchronization
3. Legacy approval flow preserved
4. Error handling maintains existing patterns

## Security Features

### Input Validation

- **Path Traversal Protection**: Blocks `../` sequences and `~` shortcuts
- **Content Limits**: Maximum file sizes and parameter lengths
- **Character Filtering**: Invalid character detection
- **Type Safety**: Strict Zod schema validation

### Command Security

- **Injection Prevention**: Command pattern detection
- **Safety Classification**: Risk assessment and categorization
- **Resource Limits**: Execution timeouts and memory limits
- **Audit Trail**: Complete execution logging

### MCP Integration

- **Server Validation**: Server name format checking
- **Tool Authorization**: Permission verification
- **Argument Validation**: JSON format and size limits
- **Connection Monitoring**: Status tracking

## Performance Considerations

### Optimization Strategies

- **Schema Caching**: Pre-compiled Zod schemas
- **Parameter Conversion**: Efficient type coercion
- **Execution Pooling**: Concurrent tool execution limits
- **Result Streaming**: Early result return for long operations

### Monitoring

- **Execution Metrics**: Time, success rate, error tracking
- **Resource Usage**: Memory and CPU monitoring
- **Tool Statistics**: Usage patterns and frequency
- **Performance Alerts**: Anomaly detection

## Configuration Management

### Feature Flags

```typescript
interface TransitionalFeatureFlags {
	ENABLE_LANGGRAPH_TOOLS: boolean
	ENABLE_LEGACY_COMPATIBILITY: boolean
	ENABLE_PERFORMANCE_MONITORING: boolean
	ENABLE_ADVANCED_ERROR_HANDLING: boolean
	ENABLE_TOOL_CACHING: boolean
	ENABLE_SECURITY_VALIDATION: boolean
}
```

### Environment Variables

```bash
TRANSITIONAL_ENABLED=true
TRANSITIONAL_LOGGING=true
TRANSITIONAL_TIMEOUT=30000
TRANSITIONAL_MAX_CONCURRENT=5
ENABLE_LANGGRAPH_TOOLS=true
ENABLE_LEGACY_COMPATIBILITY=true
```

## Migration Path

### Phase 1: Foundation

1. LangChain dependencies installed
2. Base wrapper classes implemented
3. Validation system created
4. Registry system established

### Phase 2: Tool Conversion

1. Individual tool wrappers created
2. Schemas defined and validated
3. Legacy compatibility tested
4. Performance benchmarked

### Phase 3: Integration

1. Transitional layer implemented
2. Task loop bridge created
3. Configuration management
4. Error handling validation

### Phase 4: Testing

1. Comprehensive test suites
2. Integration testing
3. Performance validation
4. Security testing

### Phase 5: Deployment

1. Feature flag management
2. Gradual rollout
3. Monitoring setup
4. Documentation complete

## Best Practices

### Schema Design

- Use strict Zod schemas
- Provide clear error messages
- Include comprehensive validation
- Document parameter requirements

### Wrapper Implementation

- Extend base wrapper classes
- Override executeTool for custom logic
- Maintain backward compatibility
- Handle errors gracefully

### Security

- Validate all inputs
- Implement path traversal protection
- Use parameter limits
- Log all security events

### Performance

- Minimize validation overhead
- Cache compiled schemas
- Use efficient parameter conversion
- Monitor execution metrics

## Troubleshooting

### Common Issues

**Tool Registration Fails**

- Check schema validity
- Verify import paths
- Ensure registry initialization

**Validation Errors**

- Review Zod schema definitions
- Check parameter types
- Validate custom rules

**Performance Issues**

- Monitor execution times
- Check for blocking operations
- Review configuration settings

**Integration Problems**

- Verify context parameters
- Check legacy tool compatibility
- Review error handling flow

### Debug Tools

**Validation Debugging**

```typescript
const result = schema.safeParse(input)
if (!result.success) {
	console.log("Validation errors:", result.error.issues)
}
```

**Execution Monitoring**

```typescript
const stats = executor.getExecutionStats()
console.log("Execution statistics:", stats)
```

**Registry Inspection**

```typescript
const tools = registry.list()
console.log("Registered tools:", tools)
```

## Future Enhancements

### Planned Features

- **Dynamic Schema Loading**: Runtime schema updates
- **Advanced Caching**: Intelligent result caching
- **Plugin System**: External tool loading
- **Analytics Dashboard**: Real-time monitoring UI

### Extension Points

- **Custom Validators**: Domain-specific validation rules
- **Tool Categories**: Advanced classification system
- **Execution Policies**: Configurable execution rules
- **Integration Hooks**: Custom event handling

## Conclusion

The Tool Wrapper Architecture provides a robust foundation for integrating LangChain with existing Roo Code functionality while maintaining security, performance, and backward compatibility. The modular design allows for incremental migration and extensibility as new requirements emerge.
