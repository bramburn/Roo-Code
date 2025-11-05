# Context Compression and Manual Review

This guide explains how to use the context compression and manual review features in Roo Code.

## Overview

Roo Code provides intelligent context compression to manage conversation length and prevent context window overflow. Additionally, you can enable manual review to have more control over what gets compressed.

## Automatic Context Compression

Automatic compression happens when the conversation reaches configurable thresholds:

- **Trigger Thresholds**: Configure when compression should trigger (5% - 100% of context window)
- **Custom Prompts**: Use your own compression prompts for better results
- **Multiple API Handlers**: Configure different AI models for compression
- **Profile-based Configuration**: Save different compression settings per model/profile

### Configuration

Access these settings in **Settings → Context Management**:

1. **Enable Automatic Compression**: Toggle automatic context compression
2. **Compression Thresholds**: Set minimum (5%) and maximum (100%) trigger points
3. **Custom Compression Prompt**: Define your own compression instructions
4. **API Handler Selection**: Choose specific AI models for compression
5. **Compression History**: View past compression operations

## Manual Review Workflow

When enabled, manual review gives you direct control over context compression:

### How It Works

1. **Context File Creation**: When compression would trigger, Roo Code creates a `.context-review/context.md` file instead
2. **File Structure**: Each context file contains:
    - Metadata (task ID, creation time, context size, trigger reason)
    - Full conversation history in markdown format
    - Clear instructions for review
3. **File Watching**: Roo Code monitors the context file for changes
4. **Timeout Handling**: 5-minute countdown with automatic fallback
5. **Integration**: Seamlessly integrates with existing compression system

### Enabling Manual Review

In **Settings → Context Management**:

1. **Enable Manual Review**: Toggle the manual review workflow
2. **Review Timeout**: Configure timeout duration (default: 5 minutes)

### During Manual Review

When a context file is created:

1. **File Location**: `.context-review/[timestamp]-context.md`
2. **Automatic Opening**: File opens automatically in VSCode
3. **Real-time Updates**: UI shows review progress and countdown timer
4. **Change Detection**: File changes are detected automatically

### Review Actions

- **Complete Review**: Edit the context file and save - Roo Code detects changes
- **Skip Review**: Use "Use intelligent compression instead" button
- **Timeout**: Automatic fallback after timeout period

### File Format

Context files use this structure:

```markdown
---
# Context Review File

## Metadata
- **Task ID**: [task-identifier]
- **Created**: [ISO-timestamp]
- **Context Size**: [token-count]
- **Trigger Reason**: manual
- **Status**: Pending Review

---

## Context Content

[Full conversation history in markdown format]

---

## Instructions

Review the context above and make your edits. When you're done:

1. Save the file
2. Close the file
3. Continue with your task

Roo Code will automatically detect your changes and continue the conversation.
```

### Best Practices

1. **Review Key Information**: Focus on recent messages and technical details
2. **Preserve Important Context**: Don't remove critical code, error messages, or key decisions
3. **Be Specific**: Use clear, actionable edits rather than vague comments
4. **Check Your Work**: Verify changes don't break existing functionality
5. **Save Regularly**: VSCode auto-saves, but manual saves are recommended

### Troubleshooting

**File not created**: Check that context compression is enabled and threshold is reached
**File not opening**: Ensure the file path exists and VSCode has proper permissions
**Changes not detected**: Verify the file watcher is running and check file permissions
**Timeout issues**: Check timeout settings and ensure automatic fallback is working

## Integration with Existing Features

Manual review integrates seamlessly with:

- **Context Management Settings**: All configuration happens in one place
- **Compression History**: Manual reviews appear in compression history
- **Token Counting**: Context size is tracked accurately
- **Error Handling**: Graceful fallback to automatic compression if needed

## Example Context File

```markdown
---
# Context Review File

## Metadata
- **Task ID**: task-abc123-def456
- **Created**: 2023-12-07T15:30:00.000Z
- **Context Size**: 2500 tokens
- **Trigger Reason**: automatic
- **Status**: Pending Review

---

## Context Content

### 👤 User (2023-12-07T15:30:00.000Z)

I need to implement a new feature for user authentication that will work with the existing system.

### 🤖 Assistant (2023-12-07T15:31:45.123Z)

I'll help you implement the authentication feature. Here's what we need to do:

1. Create a new authentication service
2. Add user login/logout functionality
3. Integrate with existing session management
4. Update the UI to show authentication status
5. Add proper error handling and security measures

### Implementation Plan

1. **Authentication Service**: Create `src/core/auth/AuthService.ts`
2. **UI Components**: Create authentication components in `webview-ui/src/components/auth/`
3. **Integration**: Connect auth service with existing task management
4. **Testing**: Add comprehensive tests for authentication flow

Would you like me to start implementing this authentication feature?
```

### 👤 User (2023-12-07T15:32:15.456Z)

That's a great idea! I can see how this authentication feature would improve the user experience. Let me break this down into implementation steps:

1. **Authentication Service**: Handle login/logout, token management, session persistence
2. **UI Components**: Login form, user status indicator, logout button
3. **Task Integration**: Connect auth state with task creation and management
4. **Security**: Proper token handling, CSRF protection, secure storage

### Technical Approach

- **JWT Tokens**: Use JSON Web Tokens for secure session management
- **Encrypted Storage**: Sensitive data encrypted at rest
- **OAuth Integration**: Support for external authentication providers
- **Biometric Options**: Future enhancement for fingerprint/face ID

### Questions

1. Should we support multiple authentication providers (GitHub, GitLab, etc.)?
2. What should be the default session duration?
3. Should we implement two-factor authentication?
4. How should we handle authentication failures gracefully?

This authentication system will significantly improve the security and user experience of Roo Code.

### 🤖 Assistant (2023-12-07T15:33:22.789Z)

Excellent questions! Let me address each one:

1. **Multiple Providers**: Yes, we should support GitHub, GitLab, and custom OAuth providers. I'll implement a provider pattern that allows easy extension.

2. **Session Duration**: Default to 24 hours with configurable override option.

3. **Two-Factor**: Yes, implement TOTP support with backup codes.

4. **Graceful Failures**: Implement exponential backoff, clear error messages, and fallback to guest mode.

### Implementation Architecture

```
src/core/auth/
├── AuthService.ts          # Main authentication service
├── TokenManager.ts         # JWT token management
├── SessionManager.ts       # Session persistence
├── providers/
│   ├── GitHubProvider.ts    # GitHub OAuth
│   ├── GitLabProvider.ts    # GitLab OAuth
│   └── CustomProvider.ts     # Custom OAuth
└── types/
    ├── AuthProvider.ts       # Base provider interface
    └── AuthResult.ts        # Authentication result type

webview-ui/src/components/auth/
├── LoginForm.tsx           # Login form component
├── AuthStatus.tsx          # User authentication status
├── ProviderSelector.tsx     # Choose auth provider
└── UserProfile.tsx          # User profile display
```

### Security Considerations

- **Token Storage**: Encrypt tokens and store in VSCode's secure storage
- **CSRF Protection**: Implement state tokens for OAuth flow
- **Rate Limiting**: Prevent brute force attacks
- **Session Expiration**: Automatic cleanup and refresh

### User Experience Flow

1. **Initial State**: Check for existing session on startup
2. **Login Required**: Prompt when authentication needed for actions
3. **Seamless Reauth**: Automatic token refresh with transparent UX
4. **Persistent State**: Maintain authentication across VSCode restarts

This architecture will provide enterprise-grade security while maintaining a smooth user experience.

### 🤖 Assistant (2023-12-07T15:35:48.123Z)

Perfect! This comprehensive approach covers all the key requirements. I particularly like your emphasis on:

- **Enterprise-grade security** with encrypted storage and CSRF protection
- **Seamless UX** with transparent token refresh and persistent state
- **Extensible provider pattern** for future authentication methods
- **Graceful failure handling** with proper error messages

### Implementation Priority

1. **High Priority**: Core authentication service and token management
2. **Medium Priority**: Provider interfaces and GitHub integration
3. **Low Priority**: UI components and two-factor authentication

### 🤖 Assistant (2023-12-07T15:38:05.678Z)

Excellent! This prioritization makes perfect sense. Starting with the core authentication service will give us a solid foundation to build upon.

### Development Strategy

I'll implement this incrementally:

1. **Phase 1**: Core authentication service with JWT tokens
2. **Phase 2**: GitHub OAuth provider integration
3. **Phase 3**: UI components and session management
4. **Phase 4**: Testing and error handling

This approach allows us to test each component independently while maintaining the overall system integrity.

### 🤖 Assistant (2023-12-07T15:40:12.345Z)

Great! I'm ready to start implementing this comprehensive authentication system. Let me begin with the core authentication service.

### 🚀 Implementation Starting

I'll create the authentication service with enterprise-grade security features, following the architecture we've outlined. This will provide a solid foundation for the user authentication feature in Roo Code.
