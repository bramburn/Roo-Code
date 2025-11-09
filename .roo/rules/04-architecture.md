# Architecture-Aware Development Rules

## Architecture Reading Protocol

### MANDATORY ARCHITECTURE READING

Before any code modification, you MUST:

1. **Read ARCHITECTURE.md completely** - Understand project structure, technology stack, and patterns
2. **Identify relevant components** - Determine which parts of the architecture your changes affect
3. **Check boundaries** - Verify you're working within the `finch/` directory only
4. **Review standards** - Understand established technical standards and patterns
5. **Plan integration** - Consider how changes integrate with existing architecture

### Architecture Initialization Process

When starting any development task:

```
1. ARCHITECTURE_READ()
   ├── Read ARCHITECTURE.md
   ├── Identify project boundaries (finch/ only)
   ├── Understand technology stack (.NET 9.0, Angular, Chrome MV3)
   └── Review relevant architectural patterns

2. CONTEXT_ANALYSIS()
   ├── Analyze existing code patterns
   ├── Check PRD requirements
   ├── Identify dependencies and integration points
   └── Verify compliance with established standards

3. IMPLEMENTATION_PLANNING()
   ├── Follow established patterns
   ├── Maintain backward compatibility
   ├── Plan testing strategy
   └── Consider performance impact
```

## Technology Stack Integration Rules

### .NET Backend Integration

- **Entity Framework Core**: Use EF Core for all database operations
- **API Versioning**: Use `/api/v1/` for all endpoints
- **Authentication**: Integrate with existing JWT system
- **Error Handling**: Follow global exception handling patterns
- **Validation**: Use FluentValidation for model validation
- **Configuration**: Use appsettings.json + fly.io secrets pattern

### Angular Frontend Integration

- **Component Architecture**: Follow established component structure
- **State Management**: Use NgRx for global state management
- **AG-Grid Integration**: Use AG-Grid Enterprise for data tables
- **Material Design**: Follow Angular Material design patterns
- **HTTP Interceptors**: Use existing interceptors for auth and error handling
- **Testing**: Follow Jasmine + Karma patterns, Cypress for E2E

### Chrome Extension Integration

- **Service Architecture**: Follow service-based extension architecture
- **Context Awareness**: Integrate with ContextAnalysisService
- **Performance**: Follow performance optimization guidelines
- **Manifest V3**: Ensure compliance with Manifest V3 requirements
- **Event-Driven**: Use event-driven communication patterns

## Architectural Pattern Compliance

### Repository Boundaries

```
toucan/
├── finch/                    # ✅ ACTIVE DEVELOPMENT
│   ├── backend/FinchApi/     # ✅ .NET 9.0 Web API
│   ├── extension/            # ✅ Chrome Extension MV3
│   ├── admin-app/            # ✅ Angular Admin Panel
│   └── [other active code]   # ✅ Active development
├── PRDs/                     # ✅ Documentation (read/write)
├── .claude/                  # ✅ Agent configuration (read/write)
├── .roo/                     # ✅ Rules (read/write)
└── [ALL OTHER FILES]         # 🚫 READ-ONLY LEGACY
```

### Code Integration Patterns

#### Backend API Patterns

```csharp
// ✅ CORRECT: Follow established patterns
[ApiController]
[Route("api/v1/[controller]")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    // Use existing service layer patterns
    // Integrate with JWT authentication
    // Follow EF Core patterns
}

// ❌ INCORRECT: Bypassing established patterns
public class LegacyUserController : ApiController // Old API version
{
    // Don't create new patterns without architectural review
}
```

#### Frontend Component Patterns

```typescript
// ✅ CORRECT: Follow established Angular patterns
@Component({
  selector: 'app-user-management',
  template: './user-management.component.html',
  styleUrls: ['./user-management.component.scss']
})
export class UserManagementComponent implements OnInit {
  // Use NgRx for state management
  // Follow Material Design patterns
  // Use existing HTTP interceptors
}

// ❌ INCORRECT: Bypassing established patterns
@Component({
  // Don't create new architectural patterns without review
})
```

#### Chrome Extension Patterns

```javascript
// ✅ CORRECT: Follow service-based architecture
class ContextAnalysisService {
	constructor() {
		// Follow event-driven patterns
		// Integrate with existing services
		// Maintain performance standards
	}
}

// ❌ INCORRECT: Bypassing service architecture
// Don't create standalone modules without service integration
```

## Data Flow and Communication Rules

### Inter-Service Communication

- **Event-Driven Architecture**: Use event-driven patterns for loose coupling
- **RESTful APIs**: Follow RESTful patterns for service communication
- **Real-time Updates**: Use SignalR for real-time features
- **Background Jobs**: Use Hangfire for background processing

### Data Access Patterns

- **Repository Pattern**: Use repository pattern for data access
- **Unit of Work**: Use unit of work pattern for transaction management
- **Caching**: Implement appropriate caching strategies
- **Connection Management**: Use proper connection pooling and management

### Authentication and Security

- **JWT Integration**: Proper integration with existing authentication system
- **RBAC Compliance**: Follow role-based access control patterns
- **Data Validation**: Validate all inputs and outputs
- **Error Handling**: Proper error handling without information leakage

## Performance and Optimization Rules

### Backend Performance

- **Database Optimization**: Use proper indexing and query optimization
- **Async Operations**: Use async/await patterns consistently
- **Resource Management**: Proper resource disposal and management
- **Caching Strategies**: Implement appropriate caching at multiple levels

### Frontend Performance

- **Lazy Loading**: Implement lazy loading for large datasets
- **Bundle Optimization**: Optimize bundle sizes and loading
- **Change Detection**: Use OnPush change detection strategy
- **Memory Management**: Proper memory cleanup and management

### Chrome Extension Performance

- **DOM Manipulation**: Minimize DOM operations and use efficient patterns
- **Event Handling**: Use efficient event handling with proper cleanup
- **Memory Usage**: Monitor and optimize extension memory usage
- **Background Processing**: Use efficient background service patterns

## Testing and Quality Assurance

### Architecture Compliance Testing

- **Pattern Validation**: Verify adherence to established architectural patterns
- **Integration Testing**: Test cross-component integration thoroughly
- **Performance Testing**: Validate performance impact of architectural changes
- **Security Testing**: Ensure security patterns are properly implemented

### Code Quality Standards

- **Consistent Patterns**: Maintain consistency with existing code patterns
- **Documentation**: Update architecture documentation when making changes
- **Review Process**: Ensure architectural changes are properly reviewed
- **Backward Compatibility**: Maintain compatibility with existing systems

## Architecture Evolution Rules

### Making Architectural Changes

1. **Propose Changes**: Document proposed architectural changes clearly
2. **Impact Analysis**: Analyze impact on existing systems and components
3. **Review Process**: Get proper review for architectural changes
4. **Incremental Implementation**: Implement changes incrementally with testing
5. **Documentation Updates**: Update ARCHITECTURE.md and related documentation

### Technology Adoption

- **Evaluate New Technologies**: Assess compatibility with existing architecture
- **Pilot Implementation**: Test new technologies in isolated contexts
- **Integration Planning**: Plan integration with existing patterns
- **Migration Strategy**: Develop clear migration strategies for major changes

## Architecture Monitoring and Maintenance

### Health Checks

- **Architectural Compliance**: Regular checks for architectural compliance
- **Performance Monitoring**: Monitor architectural performance metrics
- **Dependency Management**: Track and manage architectural dependencies
- **Documentation Currency**: Keep architecture documentation current

### Continuous Improvement

- **Pattern Refinement**: Continuously refine architectural patterns
- **Technology Updates**: Plan for technology stack updates
- **Performance Optimization**: Ongoing performance optimization efforts
- **Security Enhancements**: Regular security architecture reviews

---

## Quick Reference Checklist

### Before Starting Work

- [ ] Read ARCHITECTURE.md completely
- [ ] Identify working directory (must be in finch/)
- [ ] Check relevant PRDs for requirements
- [ ] Analyze existing code patterns
- [ ] Verify integration points

### During Development

- [ ] Follow established patterns consistently
- [ ] Maintain backward compatibility
- [ ] Include appropriate tests
- [ ] Monitor performance impact
- [ ] Validate security integration

### Before Completion

- [ ] Review architectural compliance
- [ ] Update relevant documentation
- [ ] Verify integration with existing systems
- [ ] Test cross-component functionality
- [ ] Update PRDs if applicable

---

**Remember**: The architecture exists to enable scalable, maintainable development. Respect established patterns while continuously improving the system through proper evolution processes.
