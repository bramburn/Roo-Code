# Implementation Context for PRD 08: Schema Validation System

## Codebase Analysis Results

### Existing Infrastructure Available

#### 1. LegacyToolAdapter Implementation

**File**: `src/transitional/LegacyToolAdapter.ts`
**Current State**: Contains placeholder implementations for key functions

- `extractParameterInfo()` (lines 149-163): Returns empty placeholder
- `createLegacySchema()` (lines 132-144): Returns flexible schema accepting any object
- `createWrapperFromLegacyFunction()` (lines 74-127): Uses basic schema in DynamicStructuredTool
- Parameter conversion functions (lines 29-69): Basic JSON/string conversion

#### 2. Zod Validation Infrastructure

**Files**:

- `src/tools/validation/ZodSchemaValidator.ts`: Comprehensive validation framework
- `src/tools/validation/ValidationRules.ts`: Rule-based schema building
  **Available Patterns**:
- Schema registration and management
- Parameter type conversion (string/number/boolean/array/object)
- Error handling with custom messages
- Validation rule composition

#### 3. Security Validation Framework

**File**: `src/tools/wrappers/ExecuteCommandToolWrapper.ts`
**Available Patterns**:

- Command classification and safety assessment
- Path traversal prevention
- Injection attempt detection
- Control character filtering
- Working directory validation

#### 4. TypeScript AST Parsing Infrastructure

**Files**: `src/services/tree-sitter/` directory
**Available Capabilities**:

- Function signature parsing
- Type definition extraction
- Parameter analysis for multiple languages (TypeScript, JavaScript, Rust, etc.)

### Implementation Mapping

#### PRD Requirement → Code Location Mapping

| PRD Requirement            | Implementation Location                                                   | Existing Pattern                         | Enhancement Needed                                    |
| -------------------------- | ------------------------------------------------------------------------- | ---------------------------------------- | ----------------------------------------------------- |
| Parameter Analysis Engine  | `src/transitional/LegacyToolAdapter.ts:extractParameterInfo()`            | Tree-sitter AST parsing available        | Replace placeholder with TypeScript AST analysis      |
| Dynamic Schema Generator   | `src/transitional/LegacyToolAdapter.ts:createLegacySchema()`              | Zod validation infrastructure exists     | Use ZodSchemaValidator for dynamic schema creation    |
| Type Transformation Layer  | `src/transitional/LegacyToolAdapter.ts:convertArgsToLegacyParams()`       | Basic conversion exists                  | Enhance with type-aware conversion                    |
| Security Integration Layer | `src/transitional/LegacyToolAdapter.ts:createWrapperFromLegacyFunction()` | ExecuteCommandToolWrapper patterns exist | Integrate security validation after schema validation |

### Architectural Patterns to Follow

#### 1. Schema Generation Pattern

```typescript
// Based on ZodSchemaValidator.createSchemaFromLegacyParams
static createLegacySchema(toolName: string, parameterInfo: ParameterInfo): z.ZodSchema {
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

#### 2. Parameter Analysis Pattern

```typescript
// Based on tree-sitter patterns
static extractParameterInfo(legacyFunction: (...args: any[]) => any): ParameterInfo {
  // Use TypeScript compiler API to analyze function signature
  const sourceCode = legacyFunction.toString()
  const program = ts.createProgram([{
    fileName: "legacyFunction.ts",
    sourceText: sourceCode
  }])

  // Extract parameter information from AST
  const checker = program.getTypeChecker()
  const signature = checker.getSignatureFromDeclaration(declaration)

  return {
    required: [],
    optional: [],
    types: {}
  }
}
```

#### 3. Security Integration Pattern

```typescript
// Based on ExecuteCommandToolWrapper
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

### Integration with Existing Systems

#### LangChain Integration

- Use existing `DynamicStructuredTool` from `@langchain/core/tools`
- Follow existing wrapper pattern from `src/tools/wrappers/base/LangGraphToolWrapper.ts`
- Maintain compatibility with existing `ToolUse` interface from `src/shared/tools.ts`

#### Security Integration

- Leverage existing validation from `ExecuteCommandToolWrapper.ts`
- Preserve path traversal prevention
- Maintain command injection detection
- Use existing error handling patterns

#### Performance Optimization

- Implement schema caching in `LegacyToolAdapter`
- Use existing validation performance patterns
- Follow memory management from existing validation infrastructure

### Breaking Changes and Migration Path

#### Breaking Changes

- `extractParameterInfo()` return type changes (from placeholder to structured data)
- `createLegacySchema()` behavior changes (from flexible to strict validation)
- Enhanced error messages for validation failures

#### Migration Strategy

1. **Phase 1**: Implement new functionality alongside existing (backward compatibility)
2. **Phase 2**: Gradually migrate tools to use new schema validation
3. **Phase 3**: Remove old flexible schema approach
4. **Phase 4**: Clean up deprecated code paths

### Testing Strategy

#### Unit Testing

- Test parameter analysis with various function signatures
- Test schema generation for all supported types
- Test error handling for edge cases
- Test security validation integration

#### Integration Testing

- Test with real legacy tools (`executeCommandTool`, `writeToFileTool`, etc.)
- Test end-to-end validation workflow
- Test LangChain integration with generated schemas

#### Performance Testing

- Benchmark schema generation time (<100ms target)
- Test memory usage with schema caching
- Validate performance impact on tool execution

### Success Metrics

#### Technical Metrics

- Schema generation time < 100ms per tool
- 100% parameter analysis accuracy
- Zero runtime type conversion errors
- All validation failures caught at schema level

#### Quality Metrics

- 95%+ code coverage for new functionality
- All existing security validations preserved
- Clear error messages for debugging
- Comprehensive documentation coverage

### Risks and Mitigations

#### Technical Risks

1. **Complex Function Signatures**: Some legacy tools may have complex signatures difficult to analyze
    - **Mitigation**: Provide manual override options and comprehensive testing
2. **Performance Impact**: AST parsing and schema generation may impact performance

    - **Mitigation**: Implement schema caching and lazy evaluation

3. **Breaking Changes**: New strict validation may break existing tool usage
    - **Mitigation**: Implement backward compatibility layer and gradual migration

#### Security Risks

1. **Validation Bypass**: New schema validation must not bypass existing security checks
    - **Mitigation**: Run security validation in parallel with schema validation
2. **Error Information**: Validation errors must not leak sensitive information
    - **Mitigation**: Sanitize error messages and follow existing security patterns
