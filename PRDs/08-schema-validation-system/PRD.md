# PRD 08: Sophisticated Schema Validation System for Legacy Tool Compatibility

## 1. Title & Overview

- **Project:** Sophisticated Schema Validation System for Legacy Tool Compatibility
- **Summary:** This PRD implements the second critical TODO item from improve-lang.md by replacing the basic flexible schema in LegacyToolAdapter with sophisticated Zod-based schemas derived from legacy tool functions. This enhancement provides automated schema generation, type safety improvements, and comprehensive input validation for all legacy tools before LangChain integration.
- **Dependencies:** PRD 07 (Context-Based Instantiation) must be complete for proper tool wrapper integration

## 2. Goals & Success Metrics

### Business Objectives

- Eliminate runtime validation errors in legacy tool execution
- Improve LLM reliability through precise schema definitions
- Reduce development overhead with automated schema generation
- Maintain backward compatibility with existing legacy tools

### Developer Success Metrics

- 100% of legacy tools have strict Zod schemas before LangChain integration
- Zero runtime type conversion errors in automated tests
- Schema generation time reduced from manual to automated (< 1 second per tool)
- All parameter validation failures caught at schema level, not runtime

## 3. User Personas

- **David (Backend Developer):** David needs reliable type-safe tool integration with LangChain. He wants automated schema generation to eliminate manual parameter mapping and reduce integration errors.
- **Sarah (DevOps Engineer):** Sarah needs predictable tool behavior and clear error messages for debugging. She wants comprehensive validation that fails fast with meaningful error messages.
- **Alex (System Architect):** Alex needs to ensure the schema validation system integrates seamlessly with existing LangChain architecture while maintaining security and performance standards.

## 4. Requirements Breakdown

| Phase                    | Sprint                                                 | User Story                                                                                                                                                                        | Acceptance Criteria                                                                                                                                                                                                                                                                                                                                 | Duration    |
| ------------------------ | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| **Phase 1: Foundation**  | **Sprint 1: Parameter Analysis Implementation**        | As David, I want to implement LegacyToolAdapter.extractParameterInfo to analyze tool function signatures so that I can automatically determine parameter requirements.            | 1. Function analyzes TypeScript function signatures to extract parameter names, types, and requirements<br>2. Handles complex parameter types (string, number, boolean, arrays, objects)<br>3. Identifies optional vs required parameters based on default values and nullability<br>4. Returns structured parameter metadata for schema generation | **2 Weeks** |
|                          |                                                        | As David, I want to create dynamic Zod schema generation in LegacyToolAdapter.createLegacySchema so that I can replace the basic flexible schema with type-safe schemas.          | 1. Schema generation uses extracted parameter information to create Zod objects<br>2. Supports nested object validation and array types<br>3. Generates appropriate validation rules for each parameter type<br>4. Maintains backward compatibility with existing parameter formats                                                                 |             |
|                          |                                                        | As Sarah, I want to implement parameter type transformation from LangChain JSON to legacy string format so that I can ensure seamless data flow between systems.                  | 1. Transformation handles all supported parameter types correctly<br>2. Preserves data integrity during type conversion<br>3. Provides clear error messages for conversion failures<br>4. Maintains existing custom validation as additional security layer                                                                                         |             |
| **Phase 1: Foundation**  | **Sprint 2: Schema Validation & Security Integration** | As Alex, I want to maintain existing custom validation (path traversal, command safety) as additional security layer so that I can preserve security while improving type safety. | 1. Custom validation rules are preserved and executed after Zod schema validation<br>2. Security validation runs in parallel with schema validation<br>3. Failed security validation blocks execution regardless of schema validity<br>4. Clear error messages distinguish between schema and security failures                                     | **2 Weeks** |
|                          |                                                        | As David, I want to ensure all legacy tools have proper schema validation before LangChain integration so that I can prevent runtime errors and improve LLM reliability.          | 1. All legacy tools are registered with generated Zod schemas<br>2. Schema validation occurs before tool execution<br>3. Invalid parameters are caught early with descriptive error messages<br>4. Integration tests verify end-to-end validation workflow                                                                                          |             |
| **Phase 2: Enhancement** | **Sprint 3: Advanced Schema Features**                 | As Sarah, I want to implement schema caching and optimization so that I can improve performance for frequently used tools.                                                        | 1. Schema generation results are cached for repeated tool calls<br>2. Cache invalidation occurs when tool definitions change<br>3. Performance metrics show >50% reduction in schema generation time<br>4. Memory usage remains within acceptable limits                                                                                            | **2 Weeks** |
|                          |                                                        | As David, I want to add schema introspection and debugging tools so that I can troubleshoot schema generation issues.                                                             | 1. Tool to inspect generated schemas for common issues<br>2. Debug mode provides detailed parameter analysis<br>3. Schema validation errors include parameter context and suggestions<br>4. Documentation includes troubleshooting guide for schema issues                                                                                          |             |

## 5. Timeline & Sprints

- **Total Estimated Time:** 6 Weeks
- **Sprint 1:** Parameter Analysis Implementation (2 Weeks)
- **Sprint 2:** Schema Validation & Security Integration (2 Weeks)
- **Sprint 3:** Advanced Schema Features (2 Weeks)

## 6. Risks & Assumptions

### Assumptions

- Legacy tool functions follow consistent parameter naming patterns
- TypeScript function signatures accurately reflect parameter requirements
- Existing custom validation logic is well-tested and secure
- LangChain integration points are clearly defined and stable

### Risks

- **Risk:** Complex parameter types in legacy functions may be difficult to analyze automatically
    - **Mitigation:** Provide manual override options for edge cases and comprehensive testing
- **Risk:** Schema generation may introduce breaking changes for existing tools
    - **Mitigation:** Implement backward compatibility layer and gradual migration path
- **Risk:** Performance impact of runtime schema validation
    - **Mitigation:** Implement schema caching and lazy validation where appropriate

## 7. Success Metrics

- 100% of legacy tools use Zod schemas instead of flexible schemas
- Zero runtime type conversion errors in production
- Schema generation time < 100ms per tool
- All parameter validation failures caught at schema level
- Existing security validation preserved and functional
- Developer satisfaction score > 4.5/5.0 in post-implementation survey

## 8. Technical Architecture

### Core Components

1. **Parameter Analysis Engine**

    - TypeScript AST parsing for function signature analysis
    - Parameter type inference and validation
    - Optional/required parameter detection
    - Complex type support (arrays, objects, unions)

2. **Dynamic Schema Generator**

    - Zod schema construction from parameter metadata
    - Type-safe schema compilation
    - Validation rule generation
    - Error message customization

3. **Type Transformation Layer**

    - LangChain JSON to legacy string conversion
    - Bidirectional type mapping
    - Error handling and recovery
    - Performance optimization

4. **Security Integration Layer**
    - Custom validation preservation
    - Parallel validation execution
    - Security-first error handling
    - Audit logging for security events

### Integration Points

- **LegacyToolAdapter.extractParameterInfo**: Core analysis function
- **LegacyToolAdapter.createLegacySchema**: Schema generation entry point
- **LegacyToolAdapter.convertArgsToLegacyParams**: Enhanced type transformation
- **Tool Registry Integration**: Schema registration for LangChain
- **Security Validation Hooks**: Integration points for existing security checks

## 8.1. Implementation Context

### Existing Infrastructure Analysis

#### Available Validation Framework

- **ZodSchemaValidator** (`src/tools/validation/ZodSchemaValidator.ts`): Comprehensive validation framework with schema registration, parameter conversion, and error handling
- **ValidationRules** (`src/tools/validation/ValidationRules.ts`): Rule-based schema building with support for strings, numbers, booleans, arrays, and objects
- **Security Validation** (`src/tools/wrappers/ExecuteCommandToolWrapper.ts`): Command classification, injection prevention, path traversal protection, and safety assessment

#### TypeScript AST Parsing Infrastructure

- **Tree-sitter Services** (`src/services/tree-sitter/`): Multi-language parsing with TypeScript support for function signature analysis
- **AST Analysis Patterns**: Existing patterns for extracting function declarations, parameter types, and type definitions

#### Legacy Tool Adapter Current State

- **File**: `src/transitional/LegacyToolAdapter.ts`
- **Current Implementation**: Placeholder functions returning empty/default values
- **Key Functions to Enhance**:
    - `extractParameterInfo()` (lines 149-163): Currently returns empty placeholder
    - `createLegacySchema()` (lines 132-144): Currently returns flexible schema accepting any object
    - `createWrapperFromLegacyFunction()` (lines 74-127): Uses basic schema without validation

### Implementation Strategy

#### Phase 1: Parameter Analysis Implementation

**Target**: `src/transitional/LegacyToolAdapter.ts:extractParameterInfo()`
**Approach**:

1. Use TypeScript compiler API (`ts.createProgram()`) to analyze function signatures
2. Leverage tree-sitter patterns from `src/services/tree-sitter/` for AST parsing
3. Extract parameter names, types, and optional/required status
4. Handle complex types (arrays, objects, unions, generics)
5. Provide structured metadata for schema generation

#### Phase 2: Dynamic Schema Generation

**Target**: `src/transitional/LegacyToolAdapter.ts:createLegacySchema()`
**Approach**:

1. Use parameter info from `extractParameterInfo()` to build Zod schemas
2. Leverage existing `ZodSchemaValidator.createSchemaFromLegacyParams()` patterns
3. Support nested objects, arrays, and complex parameter structures
4. Generate type-safe schemas with appropriate validation rules
5. Implement schema compilation and validation

#### Phase 3: Security Integration

**Target**: `src/transitional/LegacyToolAdapter.ts:createWrapperFromLegacyFunction()`
**Approach**:

1. Preserve existing security validation from `ExecuteCommandToolWrapper` patterns
2. Implement parallel validation (schema + security)
3. Security validation takes precedence over schema validation
4. Maintain existing error handling and logging patterns
5. Ensure backward compatibility with existing security checks

### Code Patterns to Follow

#### Schema Generation Pattern

```typescript
// Based on ZodSchemaValidator.createSchemaFromLegacyParams
static createLegacySchema(toolName: string): z.ZodSchema {
  const parameterInfo = this.extractParameterInfo(getToolFunction(toolName))

  const schemaFields: Record<string, z.ZodTypeAny> = {}

  // Add required parameters
  for (const param of parameterInfo.required) {
    schemaFields[param] = this.createZodTypeForParam(param, true)
  }

  // Add optional parameters
  for (const param of parameterInfo.optional) {
    schemaFields[param] = this.createZodTypeForParam(param, false)
  }

  return z.object(schemaFields)
}
```

#### Security Integration Pattern

```typescript
// Based on ExecuteCommandToolWrapper.executeTool
protected override async executeTool(params: any, context?: any): Promise<string> {
  // First validate with Zod schema
  const schemaValidation = this.validateSchema(params)
  if (!schemaValidation.success) {
    throw new Error(`Schema validation failed: ${schemaValidation.errors.join(", ")}`)
  }

  // Then run security validation
  const securityValidation = this.validateSecurity(params)
  if (!securityValidation.safe) {
    throw new Error(`Security validation failed: ${securityValidation.reason}`)
  }

  // Execute tool if both validations pass
  return super.executeTool(params, context)
}
```

### File Dependencies and Integration Points

#### Core Files to Modify

1. **`src/transitional/LegacyToolAdapter.ts`**

    - Lines 146-163: Replace `extractParameterInfo()` placeholder
    - Lines 132-144: Replace `createLegacySchema()` placeholder
    - Lines 94-126: Enhance `createWrapperFromLegacyFunction()` with security integration

2. **Test Files to Create**

    - `src/tests/transitional/LegacyToolAdapter.test.ts`: Unit tests for parameter analysis
    - `src/tests/integration/parameter-analysis.test.ts`: Integration tests with real tools
    - `src/tests/transitional/schema-generation.test.ts`: Schema generation tests
    - `src/tests/transitional/security-integration.test.ts`: Security validation tests

3. **Documentation Files**
    - `docs/transitional/LegacyToolAdapter.md`: API documentation and usage examples

#### Integration with Existing Systems

- **LangChain Integration**: Use existing `DynamicStructuredTool` from `@langchain/core/tools`
- **Validation Framework**: Leverage `ZodSchemaValidator` and `ValidationRules` from `src/tools/validation/`
- **Security Framework**: Preserve patterns from `ExecuteCommandToolWrapper` for command safety
- **AST Parsing**: Use tree-sitter services from `src/services/tree-sitter/` for function analysis

### Performance Considerations

#### Schema Caching Strategy

- Cache generated schemas to avoid repeated AST parsing
- Implement cache invalidation when tool definitions change
- Target <100ms schema generation time per tool
- Monitor memory usage with large parameter sets

#### Error Handling Strategy

- Use existing error handling patterns from `ZodSchemaValidator.validate()`
- Provide clear, actionable error messages
- Distinguish between schema validation and security validation failures
- Maintain backward compatibility with existing error formats

## 9. Dependencies

### Internal Dependencies

- TypeScript compiler API for AST analysis
- Zod schema validation library
- Existing LegacyToolAdapter infrastructure
- Tool registry and discovery systems
- Security validation frameworks

### External Dependencies

- **@langchain/core/tools**: DynamicStructuredTool integration
- **zod**: Schema validation and type safety
- **TypeScript**: AST parsing and type analysis
- Existing security validation libraries

## 10. Testing Strategy

### Unit Testing

- Parameter analysis function testing with various function signatures
- Schema generation validation for all supported types
- Type transformation accuracy testing
- Security integration testing

### Integration Testing

- End-to-end legacy tool execution with new schemas
- LangChain integration testing with generated schemas
- Performance testing for schema generation and validation
- Error handling and recovery testing

### Manual Testing

- Real-world legacy tool validation
- Developer workflow testing
- Performance benchmarking
- Security validation verification

## 11. Rollback Plan

### Scenario 1: Schema Generation Failures

**Symptoms**: Tools fail to register, runtime type errors
**Rollback Steps**:

1. Revert LegacyToolAdapter to previous version
2. Restore basic flexible schema for affected tools
3. Clear schema cache and regenerated schemas
4. Verify tool execution continues with basic validation

### Scenario 2: Performance Degradation

**Symptoms**: Slow tool execution, increased latency
**Rollback Steps**:

1. Disable schema caching temporarily
2. Implement simplified validation logic
3. Monitor performance metrics
4. Optimize critical path before re-enabling caching

### Scenario 3: Security Validation Conflicts

**Symptoms**: Security checks bypassed, validation errors
**Rollback Steps**:

1. Isolate schema validation from security validation
2. Revert to serial validation execution
3. Verify security rules execute properly
4. Test with known security test cases
