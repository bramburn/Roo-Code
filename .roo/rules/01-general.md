# General Development Rules

## Architecture Awareness

**MANDATORY**: Always read `ARCHITECTURE.md` at the root of the repository before making any changes to understand:

1. **Project Structure**: This is a mono-repo with multiple active components
2. **Repository Boundaries**: Work within appropriate directories for the relevant components
3. **Technology Stack**: .NET 9.0 backend, Angular frontend, Chrome Extension MV3
4. **Development Patterns**: PRD-driven development with established technical standards
5. **AI Agent Guidelines**: Specific instructions for AI agents working on this codebase

## Code Analysis Tools

You are allowed to use ast-grep MCP to get a better understanding of the code structure and patterns.

## Critical Development Rules

### Repository Boundaries
- **ACTIVE DEVELOPMENT**: Work within appropriate directories for the relevant components
- **COMPONENT AWARENESS**: Understand the purpose of each directory and work within relevant boundaries
- **RESPECT ARCHITECTURE**: Follow established patterns and technology choices

### Code Quality Standards
- Follow existing code patterns and conventions
- Maintain backward compatibility
- Include appropriate tests for new functionality
- Update relevant documentation and PRDs

### Security & Performance
- Integrate with existing JWT authentication system
- Validate all inputs and outputs
- Follow established error handling patterns
- Monitor performance impact of changes

## Development Workflow

1. **Read Architecture First**: Always read ARCHITECTURE.md before starting work
2. **Check PRDs**: Find relevant PRDs for feature requirements and guidance
3. **Analyze Existing Code**: Understand existing patterns and conventions
4. **Follow Standards**: Use established technology choices and patterns
5. **Update Documentation**: Keep documentation and PRDs updated with changes