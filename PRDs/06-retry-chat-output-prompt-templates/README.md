# Retry Chat Output & Prompt Templates Enhancement

## Quick Reference

This PRD enhances the existing tool call retry mechanism (PRD-03) by adding comprehensive retry visibility through chat output and customizable prompt templates in settings.

### Key Features

- **Retry Chat Output**: Clear visibility into retry attempts with progress indicators
- **Prompt Templates**: Customizable retry message templates with variables
- **Settings Integration**: Full integration with existing settings infrastructure
- **Template Preview**: Real-time preview of template changes
- **Backward Compatibility**: Maintains compatibility with PRD-03 features

### Quick Links

- [Main PRD Document](./PRD.md) - Complete specifications and requirements
- [Dependencies](./dependencies.md) - Technical prerequisites and integration points
- [Testing Strategy](./testing-strategy.md) - Comprehensive testing approach
- [Rollback Plan](./rollback-plan.md) - Emergency procedures and fallbacks
- [Change Log](./CHANGELOG.md) - Version history and updates

### Status

**Current Status**: Draft - Pending Validation

**Dependencies**:

- ✅ PRD-03 (Tool Call Retry Mechanism) - Foundation
- ⏳ Settings Infrastructure Integration
- ⏳ Chat Output System Enhancement

**Next Steps**:

1. Context integration and code analysis
2. Structural validation
3. Dependency synchronization
4. Sprint planning and implementation

### Quick API Links

#### Template Variables Reference

| Variable            | Type   | Description                        | Example                   |
| ------------------- | ------ | ---------------------------------- | ------------------------- |
| `{{attemptNumber}}` | number | Current retry attempt number       | `2`                       |
| `{{maxAttempts}}`   | number | Maximum retry attempts allowed     | `3`                       |
| `{{toolName}}`      | string | Name of tool being retried         | `write_to_file`           |
| `{{errorType}}`     | string | Type of error that triggered retry | `CONTEXT_WINDOW_EXCEEDED` |
| `{{errorReason}}`   | string | Detailed error description         | `Token limit exceeded`    |
| `{{timestamp}}`     | string | Current timestamp                  | `2024-01-15T10:30:00Z`    |
| `{{elapsedTime}}`   | number | Time elapsed since first attempt   | `5000`                    |

#### Default Templates

**Retry Start**: `🔄 Retrying {{toolName}} (Attempt {{attemptNumber}}/{{maxAttempts}})\n\nError: {{errorType}} - {{errorReason}}`

**Retry Success**: `✅ {{toolName}} succeeded on attempt {{attemptNumber}}/{{maxAttempts}}`

**Retry Failure**: `❌ {{toolName}} failed after {{attemptNumber}} attempts\n\nFinal error: {{errorType}} - {{errorReason}}`

#### Configuration Options

```typescript
// Chat Output Settings
{
  enabled: true,
  verbosity: "standard", // "minimal" | "standard" | "detailed"
  showProgress: true,
  consolidateMessages: true,
  maxMessagesPerRetry: 3,
  colorCoding: true
}

// Template Settings
{
  customTemplates: [...],
  activeTemplateIds: {
    "retry_start": "custom_retry_start",
    "retry_success": "default_retry_success"
  },
  enablePreview: true,
  autoSave: true
}
```

### Integration Points

#### PRD-03 Integration

- Extends existing `RetryEngine` class
- Maintains compatibility with error classification
- Preserves context optimization and dual-history synchronization
- No changes to core retry logic

#### Settings Integration

- Extends `globalSettingsSchema` with retry visibility options
- Integrates with existing experimental settings framework
- Follows established settings persistence patterns

#### Chat Integration

- Extends existing chat output system
- Maintains compatibility with existing message types
- Adds new retry-specific message categories

### Development Guidelines

#### Template Development

- Use double curly braces for variables: `{{variableName}}`
- Provide fallback values for optional variables
- Test templates with different retry scenarios
- Follow established naming conventions

#### Chat Output Guidelines

- Keep messages concise and informative
- Use appropriate emoji and formatting
- Consider message consolidation to prevent spam
- Maintain consistency with existing chat style

#### Performance Considerations

- Cache rendered templates when possible
- Minimize DOM updates during progress indicators
- Use efficient message consolidation algorithms
- Monitor memory usage during high retry volumes

### Monitoring and Analytics

#### Key Metrics

- Retry visibility engagement rate
- Template customization frequency
- User satisfaction scores
- Performance impact measurements
- Error reduction effectiveness

#### Dashboard Integration

- Retry visibility metrics
- Template usage statistics
- User feedback collection
- Performance monitoring

### Support and Troubleshooting

#### Common Issues

- Template variables not rendering
- Chat output not appearing
- Settings not persisting
- Performance degradation

#### Debug Mode

Enable debug mode in settings for:

- Detailed template rendering logs
- Chat output debugging information
- Performance metrics collection
- Error tracking and reporting

### Documentation Resources

- [PRD-03 Documentation](../03-tool-call-retry-mechanism/) - Foundation retry mechanism
- [Settings Framework Documentation](../../docs/settings/) - Settings integration patterns
- [Chat System Documentation](../../docs/chat/) - Chat output integration
- [Template Development Guide](../../docs/templates/) - Template creation guidelines

### Contact and Support

For questions or issues related to this PRD:

1. Check existing documentation and troubleshooting guides
2. Review PRD-03 foundation documentation
3. Consult template development guidelines
4. Contact the development team through established channels

---

**Last Updated**: 2024-01-15  
**Version**: 0.1.0 (Initial Draft)  
**Dependencies**: PRD-03, Settings Framework, Chat System  
**Status**: Draft - Pending Validation and Context Integration
