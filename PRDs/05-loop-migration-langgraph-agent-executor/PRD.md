# PRD: Phase 2 - Loop Migration to LangGraph/Agent Executor

## Overview

This PRD defines the technical implementation for Phase 2 of the Roocode to LangChain/LangGraph migration roadmap. The objective is to replace the imperative, manual task execution loop with a declarative LangGraph workflow that leverages the standardized tools created in Phase 1.

## Goals and Objectives

### Primary Goals

1. **Replace Manual Loop with Declarative Graph**: Eliminate the manual `while (!this.abort)` loop structure and replace with a compiled LangGraph runnable that manages flow control automatically
2. **Implement StateGraph Architecture**: Define agent workflow using StateGraph with proper nodes and conditional edges for reasoning and action cycles
3. **Integrate Governance Controls**: Implement LangGraph's interrupt mechanisms for human-in-the-loop scenarios, replacing manual approval workflows
4. **Enable Tool Integration**: Ensure task management tools return Command objects for direct state manipulation and flow control
5. **Maintain Backward Compatibility**: Ensure existing tool execution patterns remain functional during migration

### Success Metrics

- **Complete Graph Migration**: 100% of manual loop logic replaced with LangGraph workflow
- **Tool Integration**: All task management tools integrated with Command pattern
- **Governance Implementation**: Interrupt mechanisms functional for sensitive operations
- **Performance**: No regression in tool execution performance
- **Compatibility**: Existing XML-based tools continue to work during transition

## User Personas

### Primary Users

1. **Development Team**: Software engineers responsible for implementing the LangGraph migration
2. **System Administrators**: DevOps engineers who need to understand the new graph-based execution model for monitoring and maintenance
3. **Quality Assurance Engineers**: Test engineers who need to validate the migration maintains functionality and performance

### Secondary Users

1. **Existing Tool Users**: End users who currently interact with Roocode tools and will benefit from improved reliability and consistency
2. **Extension Users**: Chrome extension users who will experience more responsive and reliable task execution

## Requirements Breakdown

### User Stories

#### US-01: Graph Workflow Implementation

**As a** development team member, **I want to** implement the core StateGraph structure that defines the agent execution cycle with proper node routing and conditional edges

**Acceptance Criteria**:

- StateGraph successfully compiles and executes without errors
- Tool nodes properly handle native LangChain tool calls
- Conditional routing correctly directs flow between reasoning and action phases
- Graph state management preserves context across execution cycles

#### US-02: Node and Edge Configuration

**As a** development team member, **I want to** configure the graph nodes (callModel, tools) and edges (routeModelOutput, conditional routing) to match the ReAct pattern described in chatlang.md

**Acceptance Criteria**:

- Graph structure follows LangGraph best practices
- Tool execution integrates seamlessly with existing tool ecosystem
- Conditional edges properly handle both tool calls and final responses

#### US-03: Governance and Interrupts

**As a** development team member, **I want to** implement interrupt mechanisms for sensitive operations like file writes and MCP tool calls, replacing the manual approval system

**Acceptance Criteria**:

- Interrupts trigger correctly on specified nodes or tool types
- Human-in-the-loop workflow functions properly with Command objects for resumption
- Governance controls maintain security while enabling human oversight

#### US-04: Task Management Tools Integration

**As a** development team member, **I want to** ensure that task management tools (updateTodoListTool, newTaskTool) return Command objects that can directly modify graph state or control flow

**Acceptance Criteria**:

- Command objects properly update graph state without requiring LLM intervention
- Task management tools maintain compatibility with existing workflows
- State modifications preserve graph consistency and execution context

#### US-05: Complete Manual Loop Replacement

**As a** development team member, **I want to** completely replace the manual task execution loop with the compiled LangGraph runnable, ensuring no regression in existing functionality

**Acceptance Criteria**:

- Manual loop logic completely removed from codebase
- Compiled graph handles all execution scenarios without errors
- Existing tools continue to work through new graph-based execution
- Performance metrics meet or exceed baseline measurements

## Technical Requirements

### Core Architecture Components

#### 1. StateGraph Implementation

- **State Definition**: Define comprehensive state schema including messages, tool calls, and execution context
- **Node Types**: Implement Agent node (LLM reasoning) and Tool node (tool execution)
- **Edge Configuration**: Configure conditional routing between nodes based on tool call presence

#### 2. Tool Integration

- **Native Tool Support**: Ensure all Phase 1 tools work seamlessly with LangGraph tool execution
- **Command Pattern**: Implement Command objects for state-modifying tools
- **Tool Node**: Use LangGraph's ToolNode for standardized tool execution

#### 3. Governance Controls

- **Interrupt Mechanism**: Implement LangGraph interrupts for sensitive operations
- **Human-in-the-Loop**: Create workflow for human approval and resumption
- **Security Integration**: Maintain existing security patterns within graph execution

#### 4. Context Management

- **State Persistence**: Implement checkpointer for maintaining execution state across cycles
- **Memory Management**: Integrate with existing context trimming mechanisms
- **Streaming Support**: Maintain real-time output capabilities

#### 5. Migration Strategy

- **Phased Approach**: Implement gradual migration from manual loop to graph execution
- **Compatibility Layer**: Maintain backward compatibility during transition
- **Rollback Capability**: Preserve ability to revert to manual loop if needed

## Sprint Breakdown

### Sprint 1: Foundation and Planning (2 weeks)

- StateGraph architecture design and implementation
- Tool integration testing and validation
- Governance control implementation planning
- Documentation and training materials

### Sprint 2: Core Implementation (3 weeks)

- StateGraph node and edge implementation
- Tool integration with Command objects
- Interrupt mechanism implementation
- Context management and state persistence

### Sprint 3: Integration and Testing (2 weeks)

- Complete manual loop replacement
- End-to-end testing and validation
- Performance optimization and monitoring
- Documentation completion

### Sprint 4: Deployment and Migration (2 weeks)

- Final migration from manual loop to LangGraph
- Production deployment and monitoring
- Training and knowledge transfer
- Post-migration support and optimization

## Acceptance Criteria

- All user stories completed with working implementation
- Graph execution passes comprehensive testing suite
- Manual loop completely replaced with LangGraph workflow
- Performance metrics meet or exceed baseline
- Documentation complete and team trained
- Zero regression in existing functionality

## Timeline Estimate

**Total Duration**: 9 weeks
**Key Milestones**:

- Week 2: StateGraph architecture complete
- Week 5: Core implementation finished
- Week 7: Integration testing complete
- Week 9: Production migration complete

## Risks and Assumptions

### Technical Risks

1. **Complexity**: LangGraph introduces new concepts and patterns that may have steep learning curve
2. **Integration Challenges**: Replacing core execution loop may impact existing tool integrations
3. **Performance Impact**: Graph execution overhead may affect performance characteristics
4. **Migration Risks**: Potential for data corruption or state inconsistency during migration

### Mitigation Strategies

1. **Incremental Migration**: Phase approach allows for gradual transition and testing
2. **Comprehensive Testing**: Extensive testing at each phase reduces risks
3. **Performance Monitoring**: Continuous monitoring during and after migration
4. **Rollback Planning**: Clear rollback procedures and backup strategies

### Assumptions

1. **Phase 1 Complete**: Tool standardization from Phase 1 is assumed to be complete
2. **Existing Infrastructure**: Current tool ecosystem and execution environment are stable
3. **Team Capacity**: Development team has necessary LangChain and LangGraph expertise
4. **No Breaking Changes**: Migration maintains backward compatibility for existing tools

## Success Metrics

### Performance Metrics

- **Execution Time**: Measure average task completion time before and after migration
- **Tool Success Rate**: Track successful tool execution rate through graph vs manual loop
- **Error Rate**: Monitor tool execution errors and graph failures
- **Memory Usage**: Track state size and context management efficiency

### Quality Metrics

- **Test Coverage**: Maintain >90% test coverage for all graph components
- **Bug Count**: Target <5 critical bugs in production after migration
- **Documentation Quality**: Ensure all technical documentation is complete and accurate

### User Experience Metrics

- **Task Completion Rate**: Monitor user task completion success rate
- **Response Time**: Measure average response time for tool executions
- **User Satisfaction**: Track user satisfaction with new execution model
- **Adoption Rate**: Measure percentage of users successfully migrating to new workflow

## Dependencies

### Technical Dependencies

- **LangChain Libraries**: @langchain/core, @langchain/langgraph, @langchain/community
- **Phase 1 Completion**: Requires successful completion of tool standardization (PRD 04)
- **Existing Tool Infrastructure**: Current tool execution environment must remain stable during migration
- **State Management**: Requires checkpointer implementation for state persistence

### External Dependencies

- **Model Provider**: OpenAI API or compatible LLM provider with native tool calling support
- **Monitoring Tools**: Application performance monitoring and logging infrastructure
- **Documentation Platform**: Internal knowledge base or documentation system for technical specifications

### System Dependencies

- **Development Environment**: Stable development environment with necessary tooling and testing infrastructure
- **Build Pipeline**: CI/CD pipeline capable of building and deploying graph-based applications
- **Version Control**: Git-based version control with proper branching and tagging strategies

## Implementation Context

### Existing Codebase Analysis

The current codebase uses a manual task execution loop with well-established patterns:

#### Current Task Execution Architecture

- **Manual Loop Control**: [`src/core/task/Task.ts`](src/core/task/Task.ts) contains `while (!this.abort)` loop structure (lines 1-321)
- **Tool Dispatch**: [`src/core/assistant-message/presentAssistantMessage.ts`](src/core/assistant-message/presentAssistantMessage.ts) handles tool execution through switch statement (lines 595-623)
- **State Management**: Task state is managed through class properties and method calls
- **Checkpoint Integration**: Checkpoints are created at task boundaries via existing checkpoint service

#### Checkpoint Service Architecture

The checkpoint system provides comprehensive state management:

- **Type Definitions**: [`src/services/checkpoints/types.ts`](src/services/checkpoints/types.ts) defines checkpoint interfaces (lines 16-35)
- **Service Implementation**: [`src/services/checkpoints/ShadowCheckpointService.ts`](src/services/checkpoints/ShadowCheckpointService.ts) provides checkpoint functionality
- **Task Integration**: [`src/core/checkpoints/index.ts`](src/core/checkpoints/index.ts) integrates checkpoints with task management
- **Restore Handler**: [`src/core/webview/checkpointRestoreHandler.ts`](src/core/webview/checkpointRestoreHandler.ts) handles checkpoint restoration

#### Key Files and Patterns

| File                                                                                                             | Purpose                           | Key Patterns | Lines |
| ---------------------------------------------------------------------------------------------------------------- | --------------------------------- | ------------ | ----- |
| [`src/core/task/Task.ts`](src/core/task/Task.ts)                                                                 | Main task execution loop          | 1-321        |
| [`src/core/assistant-message/presentAssistantMessage.ts`](src/core/assistant-message/presentAssistantMessage.ts) | Tool execution dispatcher         | 1-623        |
| [`src/services/checkpoints/types.ts`](src/services/checkpoints/types.ts)                                         | Checkpoint type definitions       | 16-35        |
| [`src/services/checkpoints/ShadowCheckpointService.ts`](src/services/checkpoints/ShadowCheckpointService.ts)     | Checkpoint service implementation | 1-200        |
| [`src/core/checkpoints/index.ts`](src/core/checkpoints/index.ts)                                                 | Checkpoint integration            | 1-100        |
| [`src/core/webview/checkpointRestoreHandler.ts`](src/core/webview/checkpointRestoreHandler.ts)                   | Checkpoint restoration            | 1-150        |

#### Architectural Patterns to Follow

- **Task Management Pattern**: Follow existing task lifecycle and state management patterns
- **Checkpoint Integration Pattern**: Use existing checkpoint service for state persistence
- **Error Handling Pattern**: Use existing `handleError` and `pushToolResult` patterns
- **Configuration Pattern**: Follow existing settings management from [`src/utils/config.ts`](src/utils/config.ts)
- **Testing Pattern**: Use Vitest with comprehensive coverage and performance monitoring

### Breaking Changes and Refactoring Needs

#### 1. Task Loop Replacement

- **Manual Loop Removal**: Replace `while (!this.abort)` structure in [`Task.ts`](src/core/task/Task.ts:1) with StateGraph execution
- **State Management**: Migrate from manual state management to LangGraph state schema
- **Tool Dispatch**: Update [`presentAssistantMessage.ts`](src/core/assistant-message/presentAssistantMessage.ts:595) to work with StateGraph node execution

#### 2. Checkpoint Integration

- **LangGraph Checkpointer**: Create LangGraph-compatible checkpoint adapter using existing service
- **State Persistence**: Maintain existing checkpoint functionality while supporting LangGraph state format
- **Restore Compatibility**: Ensure existing restore mechanisms work with new graph execution

#### 3. Tool Integration

- **Native Tool Support**: Ensure Phase 1 tool wrappers work seamlessly with LangGraph ToolNode
- **Command Objects**: Implement Command pattern for task management tools to control graph state
- **Backward Compatibility**: Maintain existing tool interfaces during migration

## System Requirements Compliance

### Technology Stack Alignment

- **LangGraph Integration**: Aligns with existing TypeScript patterns and error handling
- **StateGraph Architecture**: Provides declarative workflow management replacing imperative loops
- **Checkpoint Integration**: Leverages existing checkpoint service for state persistence
- **Vitest Testing**: Integrates with existing test patterns and CI/CD pipeline

### Performance Requirements

- **Minimal Overhead**: Target <5% performance impact for StateGraph migration
- **Memory Efficiency**: Maintain existing memory usage patterns during transition
- **Concurrent Execution**: Support existing concurrent tool execution patterns
- **Streaming Support**: Maintain real-time output capabilities through StateGraph streaming

### Security Requirements

- **State Validation**: Ensure proper state validation and sanitization in graph execution
- **Checkpoint Security**: Maintain existing security controls for state persistence
- **Tool Execution**: Preserve existing security patterns for tool access control
- **Interrupt Security**: Implement secure interrupt mechanisms with proper authorization

### Testing Requirements

- **Comprehensive Coverage**: Target >95% test coverage for all StateGraph components
- **Integration Testing**: Test complete workflow from state initialization to completion
- **Performance Testing**: Monitor execution performance and memory usage
- **Backward Compatibility**: Ensure existing workflows continue to work during transition
- **Migration Testing**: Validate smooth transition from manual loop to StateGraph execution

## Implementation Notes

### Key Files from chatlang.md

Based on the detailed requirements in PRDs/chatlang.md, the following files and components are key implementation targets:

- **src/core/task/Task.ts**: Main manual loop structure to be replaced
- **src/core/assistant-message/presentAssistantMessage.ts**: Tool execution dispatcher to be updated
- **src/core/tools/**: Existing tool implementations to be wrapped as LangChain tools
- **src/activate/humanRelay.ts**: Manual approval system to be replaced with interrupts

### LangGraph Components

- **StateGraph**: Core graph structure for defining agent workflow
- **ToolNode**: Pre-built node for tool execution in LangGraph
- **Conditional Edges**: Routing logic based on tool call presence and content
- **Interrupt Mechanism**: Human-in-the-loop controls for sensitive operations
- **Command Objects**: State modification objects returned by tools for direct graph control

### Migration Strategy

The implementation should follow the phased approach outlined in chatlang.md:

1. Implement StateGraph foundation with basic agent workflow
2. Integrate existing tools as LangChain-compatible tools
3. Add governance controls and interrupt mechanisms
4. Implement Command objects for task management tools
5. Replace manual loop with compiled graph execution
6. Test thoroughly and monitor performance
