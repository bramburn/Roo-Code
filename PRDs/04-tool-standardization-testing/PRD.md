# PRD: Phase 1 - Tool Standardization and Testing (Native Tool Conversion)

## Executive Summary

This PRD defines Phase 1 of the Roocode to LangChain/LangGraph migration roadmap, focusing on converting all existing tool capabilities and MCP integrations into native LangChain tool objects. This phase establishes the foundation for modern LLM interaction while maintaining compatibility with the existing task execution framework.

## 1. Overview

### 1.1 Problem Statement

The current Roocode system relies on custom XML-based tool calling, which limits LLM compatibility with modern frameworks and creates maintenance overhead. To enable migration to LangGraph (Phase 2), we must first standardize all tools using native LangChain interfaces while maintaining backward compatibility.

### 1.2 Solution Approach

Phase 1 implements a transitional approach that:

- Wraps existing Roocode functions as LangChain `StructuredTool` objects
- Integrates MCP tools using standard LangChain adapters
- Configures LLM for native tool calling instead of XML parsing
- Creates a temporary execution layer to bridge new and old formats
- Establishes comprehensive testing infrastructure

## 2. Goals and Objectives

### 2.1 Primary Goals

1. **Tool Standardization**: Convert all Roocode tools to LangChain `StructuredTool` format with Zod schema validation
2. **MCP Integration**: Implement native LangChain MCP adapters for external tool integration
3. **LLM Modernization**: Switch from XML-based to native JSON tool calling (`AIMessage` with `tool_calls`)
4. **Backward Compatibility**: Maintain existing task execution loop during transition
5. **Testing Infrastructure**: Establish comprehensive testing for all tool wrappers and integration points

### 2.2 Success Metrics

- [ ] All core tools (file I/O, command execution) wrapped with proper schema validation
- [ ] MCP tools integrated using LangChain `MultiServerMCPClient`
- [ ] LLM configured for native tool calling with `bindTools` method
- [ ] Transitional execution layer handles `AIMessage.tool_calls` correctly
- [ ] All tools pass comprehensive unit and integration tests
- [ ] Zero regression in existing functionality during transition

## 3. User Personas

### 3.1 Development Team

- **Backend Developers**: Need to implement tool wrappers, MCP integration, and LLM configuration changes
- **Frontend Developers**: Require updated event handling for new tool call formats
- **QA Engineers**: Responsible for testing new tool wrappers and integration points
- **DevOps Engineers**: Need to deploy and monitor the transitional architecture

### 3.2 System Administrators

- Need to understand the migration roadmap and monitor Phase 1 progress
- Responsible for ensuring compatibility during the transition period
- Will manage rollback procedures if issues arise

## 4. Requirements Breakdown

### 4.1 Core Tool Wrappers (Epic: Tool Standardization)

**User Story 1**: As a developer, I want to use native LangChain tool calling to execute file operations with structured schema validation

**Acceptance Criteria**:

- [ ] File I/O tools (`write_to_file`, `read_file`) wrapped as `StructuredTool` objects
- [ ] Each tool includes Zod schema for input validation
- [ ] Tools provide clear descriptions and parameter documentation
- [ ] All tools maintain backward compatibility with existing Roocode functions

**Technical Requirements**:

- Implement `tool()` helper function for wrapper creation
- Define Zod schemas for all input parameters
- Create wrapper functions in `src/core/tools/` directory
- Follow LangChain `StructuredTool` interface patterns

---

### 4.2 MCP Tool Integration (Epic: External Tool Support)

**User Story 2**: As a developer, I want to integrate external MCP servers using LangChain's standard MCP adapters

**Acceptance Criteria**:

- [ ] MCP client supports multiple servers using `MultiServerMCPClient`
- [ ] MCP tools loaded as `ClientTool` or `ServerTool` objects
- [ ] Output handling configured for different content types (text, image, resource, audio)
- [ ] Tool discovery works dynamically with configured servers

**Technical Requirements**:

- Implement `MultiServerMCPClient` from `@langchain/mcp-adapters`
- Configure `OutputHandling` for different MCP output types
- Create MCP tool wrappers in `src/core/tools/` directory
- Support dynamic tool loading and server configuration

---

### 4.3 LLM Configuration (Epic: Native Tool Calling)

**User Story 3**: As a developer, I want the LLM to use native tool calling instead of XML-based tool invocation

**Acceptance Criteria**:

- [ ] LLM configured with `bindTools` method
- [ ] Tool schemas transmitted to model provider
- [ ] LLM returns `AIMessage` objects with `tool_calls` array
- [ ] XML parsing logic removed or bypassed
- [ ] Support for parallel tool execution if available

**Technical Requirements**:

- Update LLM invocation in `src/api/index.ts`
- Remove XML parsing logic from `src/core/prompts/tools/attempt-completion.ts`
- Configure ChatModel with `bindTools` method
- Handle `AIMessage.tool_calls` in transitional execution layer

---

### 4.4 Transitional Execution Layer (Epic: Bridge Implementation)

**User Story 4**: As a developer, I want a temporary bridge to handle new tool call format while maintaining existing task loop

**Acceptance Criteria**:

- [ ] Transitional layer intercepts `AIMessage.tool_calls`
- [ ] Tool calls executed using new wrapper functions
- [ ] Results formatted as `ToolMessage` objects
- [ ] Existing task loop continues without modification
- [ ] No breaking changes to existing functionality

**Technical Requirements**:

- Implement tool call interception in `src/activate/handleTask.ts`
- Create execution bridge for `tool_calls` → wrapper function → `ToolMessage`
- Maintain compatibility with existing event system
- Ensure proper error handling and result formatting

---

### 4.5 Comprehensive Testing (Epic: Test Coverage)

**User Story 5**: As a QA engineer, I want comprehensive testing for all new tool wrappers and integration points

**Acceptance Criteria**:

- [ ] Unit tests for all tool wrapper functions
- [ ] Integration tests for MCP client functionality
- [ ] Tests for LLM configuration and tool binding
- [ ] Tests for transitional execution layer
- [ ] Tests for complex scenarios (error handling, edge cases)
- [ ] Performance tests for tool execution overhead

**Technical Requirements**:

- Test suites in `src/core/tools/__tests__/`
- Mock implementations for external dependencies
- Integration test coverage for all components
- Automated testing pipeline integration
- Performance benchmarking for tool execution

## 5. Sprint Breakdown

### 5.1 Sprint 1: Core Tool Wrapper Development (2 weeks)

**Focus**: Implement basic file I/O and command execution tool wrappers
**Deliverables**:

- `writeToFileTool.ts` and `write_to_file.ts` wrapper implementations
- `readFileTool.ts` and `read_file.ts` wrapper implementations
- `executeCommandTool.ts` and `execute_command.ts` wrapper implementations
- Basic unit test coverage for all wrappers

### 5.2 Sprint 2: MCP Integration (2 weeks)

**Focus**: Implement MCP client and tool integration
**Deliverables**:

- `MultiServerMCPClient` implementation
- `useMcpTool.ts` and `accessMcpResourceTool.ts` wrappers
- Output handling configuration for different content types
- Integration tests for MCP functionality

### 5.3 Sprint 3: LLM Configuration (1 week)

**Focus**: Update LLM invocation for native tool calling
**Deliverables**:

- Updated `src/api/index.ts` with `bindTools` configuration
- Modified `attempt-completion.ts` to handle `AIMessage` format
- Tests for LLM configuration and tool binding

### 5.4 Sprint 4: Transitional Execution Layer (2 weeks)

**Focus**: Implement bridge between new tool calls and existing task loop
**Deliverables**:

- Tool call interception logic in `handleTask.ts`
- Execution bridge for `tool_calls` → wrapper → result
- Integration tests for transitional layer
- Error handling and edge case coverage

### 5.5 Sprint 5: Comprehensive Testing (3 weeks)

**Focus**: Complete testing infrastructure and validation
**Deliverables**:

- Complete test suite for all components
- Performance benchmarking
- Integration testing with external MCP servers
- Documentation and deployment guides
- Rollback procedure testing

## 6. Acceptance Criteria

### 6.1 Functional Requirements

- [ ] All existing Roocode tools work unchanged through transitional layer
- [ ] New LangChain tool wrappers execute identical functionality
- [ ] MCP tools integrate seamlessly with existing tool ecosystem
- [ ] LLM uses native tool calling with no regression in capabilities
- [ ] Transitional layer can be disabled once Phase 2 is complete

### 6.2 Performance Requirements

- [ ] Tool execution overhead < 5% compared to current implementation
- [ ] Memory usage remains stable during transition
- [ ] No degradation in existing task execution performance
- [ ] MCP integration adds < 2% latency to tool operations

### 6.3 Compatibility Requirements

- [ ] Existing XML-based agents continue to function during transition
- [ ] New tool wrappers maintain 100% API compatibility
- [ ] No breaking changes to existing event system
- [ ] Rollback to previous state possible within 24 hours

### 6.4 Security Requirements

- [ ] All tool inputs validated through Zod schemas
- [ ] MCP server connections authenticated and authorized
- [ ] No elevation of privileges for tool execution
- [ ] Audit trail maintained for all tool operations
- [ ] Sensitive operations require explicit approval

## 7. Timeline Estimate

**Total Duration**: 10 weeks

**Milestones**:

- **Week 1-2**: Core tool wrapper development and testing
- **Week 3-4**: MCP integration and configuration
- **Week 5-6**: LLM configuration and transitional layer
- **Week 7-8**: Comprehensive testing and validation
- **Week 9-10**: Documentation, deployment, and rollout preparation

## 8. Risks and Assumptions

### 8.1 Technical Risks

- **Schema Validation Complexity**: Zod schema validation may introduce breaking changes for existing tools
- **MCP Integration Complexity**: External server compatibility issues may cause integration failures
- **Performance Impact**: Additional abstraction layer may introduce execution overhead
- **LLM Compatibility**: Not all model providers support native tool calling equally
- **Transition Complexity**: Maintaining two execution paths simultaneously increases code complexity

### 8.2 Mitigation Strategies

- Implement comprehensive unit and integration testing for all components
- Use feature flags to enable/disable transitional layer
- Monitor performance metrics during rollout
- Establish rollback procedures for each component
- Provide detailed migration documentation for development teams

### 8.3 Assumptions

- Existing Roocode codebase structure and patterns are well understood
- LangChain and MCP adapter libraries are stable and well-documented
- Development team has experience with Zod schema validation and tool integration
- Sufficient time allocated for testing and validation
- Existing test infrastructure can be leveraged for new components

## 9. Dependencies

### 9.1 Technical Dependencies

- **@langchain/core**: For `StructuredTool`, `tool()` helper, and base functionality
- **@langchain/mcp-adapters**: For `MultiServerMCPClient` and MCP tool integration
- **zod**: For schema validation and type safety
- **Existing Roocode APIs**: File I/O, command execution, and task management systems

### 9.2 External Dependencies

- **MCP Servers**: External Model Context Protocol servers for tool integration
- **Model Providers**: LLM providers that support native tool calling (OpenAI, Anthropic, etc.)
- **Testing Frameworks**: Vitest for unit testing, integration testing frameworks

### 9.3 PRD Dependencies

- **chatlang.md**: Source requirements document for Phase 1 implementation
- **Existing Tool Wrappers**: Current implementations in `src/core/prompts/tools/` directory
- **Task Management System**: Existing task execution loop in `src/core/task/` directory

## 10. Success Metrics

### 10.1 Development Metrics

- Number of tool wrappers successfully implemented and tested
- Code coverage percentage for new functionality
- Performance benchmarks for tool execution overhead
- Number of integration points completed
- Defect density in production

### 10.2 Operational Metrics

- Tool execution success rate (post-launch)
- Average tool execution time
- System stability during transition period
- Rollback success rate (if needed)
- Developer productivity metrics

### 10.3 User Experience Metrics

- Reduction in tool execution errors
- Improvement in tool discovery and documentation
- Developer satisfaction with new tool interfaces
- Adoption rate of new tool calling capabilities

## 11. Appendices

### 11.1 Technical Implementation Details

#### File Structure Reference

```
src/core/tools/
├── writeToFileTool.ts          # Write tool wrapper
├── readFileTool.ts           # Read tool wrapper
├── executeCommandTool.ts     # Command execution wrapper
├── useMcpTool.ts           # MCP tool usage wrapper
└── accessMcpResourceTool.ts  # MCP resource access wrapper

src/core/prompts/tools/
├── write-to-file.ts            # Original write tool implementation
├── read-file.ts              # Original read tool implementation
├── execute-command.ts         # Original command execution implementation
└── attempt-completion.ts       # Original completion logic

src/api/
└── index.ts                     # LLM configuration and invocation

src/activate/
└── handleTask.ts               # Task management and tool execution
```

#### LangChain Concepts Reference

- **`StructuredTool`**: Base interface for all tool wrappers
- **`tool()` helper**: Function for creating structured tools with schemas
- **`MultiServerMCPClient`**: MCP client for multiple server connections
- **`bindTools`**: Method for configuring LLM with native tool calling
- **`AIMessage`**: New message format with `tool_calls` array
- **`ToolMessage`**: Response format for tool execution results

### 11.2 Testing Strategy

#### Unit Testing Approach

- Test each tool wrapper in isolation with mocked dependencies
- Validate Zod schema enforcement for input validation
- Test error handling and edge cases
- Verify backward compatibility with existing Roocode functions

#### Integration Testing Approach

- Test MCP client connection and tool discovery
- Test LLM configuration with various model providers
- Test transitional execution layer with existing task loop
- Verify end-to-end tool execution workflows

#### Performance Testing Approach

- Benchmark tool execution overhead compared to current implementation
- Test memory usage during intensive tool operations
- Validate that abstraction layer doesn't impact system responsiveness
- Load test concurrent tool execution scenarios

### 11.3 Rollback Procedures

#### Component-Level Rollback

- Feature flags to disable new functionality and revert to XML parsing
- Database migrations to revert schema changes if needed
- Configuration rollback for LLM binding changes
- Code versioning with clear rollback points

#### System-Level Rollback

- Emergency disable switch for Phase 1 functionality
- Complete system restore from backups within 4 hours
- Post-incident review and improvement process

## Implementation Context

### Existing Codebase Analysis

The current codebase uses XML-based tool calling with well-established patterns:

#### Current Tool Implementation Patterns

- **Tool Interface**: All tools implement the `ToolUse` interface with `name` and `params` properties
- **Execution Flow**: Tools are executed through a switch statement in [`presentAssistantMessage.ts:595-623`](src/core/assistant-message/presentAssistantMessage.ts:595)
- **Parameter Handling**: Tool parameters are extracted from XML `<parameter>` tags
- **Result Processing**: Results are pushed through `pushToolResult` and handled via approval flow
- **Error Handling**: Errors are handled through `handleError` with consistent patterns

#### Key Files and Patterns

| File                                                                                                             | Purpose                             | Key Patterns | Lines |
| ---------------------------------------------------------------------------------------------------------------- | ----------------------------------- | ------------ | ----- |
| [`src/core/tools/writeToFileTool.ts`](src/core/tools/writeToFileTool.ts)                                         | Write file tool implementation      | 1-321        |
| [`src/core/tools/readFileTool.ts`](src/core/tools/readFileTool.ts)                                               | Read file tool implementation       | 1-749        |
| [`src/core/tools/executeCommandTool.ts`](src/core/tools/executeCommandTool.ts)                                   | Command execution tool              | 1-402        |
| [`src/core/tools/useMcpToolTool.ts`](src/core/tools/useMcpToolTool.ts)                                           | MCP tool usage implementation       | 1-372        |
| [`src/core/assistant-message/presentAssistantMessage.ts`](src/core/assistant-message/presentAssistantMessage.ts) | Tool execution dispatcher           | 1-623        |
| [`src/api/index.ts`](src/api/index.ts)                                                                           | API handler and provider management | 1-175        |

#### Architectural Patterns to Follow

- **Tool Wrapper Pattern**: Follow LangChain `StructuredTool` interface with Zod schema validation
- **Error Handling Pattern**: Use existing `handleError` and `pushToolResult` patterns
- **Configuration Pattern**: Follow existing settings management from [`src/utils/config.ts`](src/utils/config.ts)
- **Testing Pattern**: Use Vitest with comprehensive coverage and performance monitoring

### Breaking Changes and Refactoring Needs

#### 1. Backward Compatibility

- Maintain existing XML tool calling during transition period
- Provide configuration switch for gradual migration to native format
- Preserve existing tool interfaces and execution patterns

#### 2. API Changes

- Update [`buildApiHandler`](src/api/index.ts:91) to support tool binding with `bindTools` method
- Add conditional logic for native vs XML tool calling modes
- Maintain existing provider interfaces and error handling patterns

#### 3. Tool Execution Changes

- Modify [`presentAssistantMessage.ts`](src/core/assistant-message/presentAssistantMessage.ts:595) to handle both XML and native formats
- Add tool call bridge for native format conversion
- Preserve existing switch statement for XML format compatibility

## System Requirements Compliance

### Technology Stack Alignment

- **LangChain Integration**: Aligns with existing TypeScript patterns and error handling
- **Zod Validation**: Provides type-safe parameter validation replacing XML parsing
- **Vitest Testing**: Integrates with existing test patterns and CI/CD pipeline
- **Configuration Management**: Follows existing settings patterns from [`src/utils/config.ts`](src/utils/config.ts)

### Performance Requirements

- **Minimal Overhead**: Target <5% performance impact for tool conversion
- **Memory Efficiency**: Maintain existing memory usage patterns during transition
- **Concurrent Execution**: Support existing concurrent tool execution patterns

### Security Requirements

- **Input Validation**: Zod schema validation provides stronger type safety than XML parsing
- **Path Traversal Prevention**: Maintain existing file access controls and validation
- **Command Injection Prevention**: Preserve existing command sanitization patterns

### Testing Requirements

- **Comprehensive Coverage**: Target >95% test coverage for all tool wrappers
- **Integration Testing**: Test complete workflow from message to execution
- **Performance Testing**: Monitor execution performance and memory usage
- **Backward Compatibility**: Ensure existing workflows continue to work during transition

- Communication plan for rollback coordination
