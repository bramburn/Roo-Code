# Context Loading and Continuation

This guide explains how to use the context loading and continuation features in Roo Code after manual review editing.

## Overview

Context loading allows you to seamlessly continue your conversation after manually editing context files. The system validates your edits, counts tokens, and ensures your changes fit within model limits.

## How Context Loading Works

### 1. Automatic Detection

When you finish editing a context file and save it, Roo Code automatically:

- Detects the file change
- Parses the edited content
- Validates the file format and structure
- Counts tokens in your edited context
- Compares with original token usage

### 2. Loading Process

The loading process includes several steps:

1. **File Reading**: Reads the edited context file from `.context-review/`
2. **Parsing**: Extracts metadata and messages from markdown format
3. **Validation**: Ensures file structure is correct and complete
4. **Token Counting**: Calculates token usage for edited content
5. **Limit Validation**: Checks against model context window limits
6. **Integration**: Replaces original context with your edited version

### 3. Progress Indicators

During loading, you'll see:

- **Progress Bar**: Shows loading completion percentage
- **Current Step**: Displays the active loading phase
- **Status Messages**: Provides real-time feedback

## Token Counting and Validation

### Token Comparison

The system provides detailed token comparison:

```
Original: 2.0K tokens → Edited: 1.5K tokens (-500 tokens, -25%)
```

- **Original**: Token count before your edits
- **Edited**: Token count after your edits
- **Change**: Difference and percentage change
- **Status**: Whether edited context fits within limits

### Validation Rules

#### Required Metadata

- Task ID: Must be present and valid
- Created: Valid timestamp required
- Context Size: Positive number of tokens
- Trigger Reason: One of: manual, automatic, aggressive

#### Message Validation

- All messages must have valid roles (user/assistant)
- Content cannot be empty
- Timestamps must be valid when present

#### Token Limits

- Context must fit within model's context window
- Warnings appear when approaching limits (>90%)
- Errors block loading when exceeding maximum tokens

## Error Handling and Recovery

### Common Issues

#### File System Errors

- **File Not Found**: Check the file path and ensure file exists
- **Permission Denied**: Verify file permissions in your workspace
- **Corrupted File**: File may be damaged, try recovering from backup

#### Validation Errors

- **Missing Metadata**: Ensure YAML frontmatter is complete
- **Invalid Messages**: Check message format and content
- **Malformed Structure**: Verify markdown syntax and headers

#### Token Limit Issues

- **Context Too Large**: Reduce content size or use compression
- **Approaching Limit**: Consider trimming non-essential content

### Recovery Options

When loading fails, you can:

1. **Edit Context File**: Open file to make corrections
2. **Reduce Context Size**: Remove content to fit limits
3. **Use Intelligent Compression**: Let AI compress automatically
4. **Retry Loading**: Try loading the file again

## Best Practices

### Editing Context Files

1. **Preserve Important Information**

    - Keep key technical details and decisions
    - Maintain recent conversation context
    - Preserve code snippets and examples

2. **Optimize Token Usage**

    - Remove redundant explanations
    - Combine related messages
    - Use concise language

3. **Maintain Structure**

    - Keep YAML metadata intact
    - Preserve message format
    - Don't modify separator lines

4. **Validate Before Saving**
    - Check for missing required fields
    - Ensure message roles are correct
    - Verify content completeness

### Token Management

1. **Monitor Usage**

    - Watch token count indicators
    - Heed approaching limit warnings
    - Consider impact of additions

2. **Efficient Editing**

    - Focus on high-value content
    - Remove conversational filler
    - Consolidate related topics

3. **Plan Ahead**
    - Consider future conversation needs
    - Leave room for additional context
    - Balance completeness vs. size

## File Format Reference

### YAML Metadata Structure

```yaml
---
# Context Review File

## Metadata
- **Task ID**: your-task-id
- **Created**: 2025-01-01T00:00:00.000Z
- **Context Size**: 1500 tokens
- **Trigger Reason**: manual
- **Status**: Pending Review

---
```

### Message Format

```markdown
### 👤 User (2025-01-01T00:00:00.000Z)

Your message content here

---

### 🤖 Assistant (2025-01-01T00:00:01.000Z)

Assistant response here

---
```

### Mixed Content

```markdown
### 👤 User (2025-01-01T00:00:00.000Z)

Here's some text:

[Image: image/png]

And more text after the image.

---
```

## Troubleshooting

### Loading Issues

**Problem**: Context file not loading
**Solution**:

- Check file exists in `.context-review/` directory
- Verify file has proper YAML frontmatter
- Ensure file permissions allow reading

**Problem**: Token count seems wrong
**Solution**:

- Refresh the loading process
- Check for hidden characters or formatting
- Verify content parsing accuracy

**Problem**: Validation errors persist
**Solution**:

- Use recovery options to fix validation
- Compare with original file format
- Consider using intelligent compression

### Performance Issues

**Problem**: Loading is very slow
**Solution**:

- Reduce file size if very large
- Check system resources
- Close other applications

**Problem**: Memory usage high
**Solution**:

- Split large context into smaller files
- Use more aggressive editing
- Restart application if needed

## Integration with Other Features

Context loading integrates seamlessly with:

- **Manual Review Workflow**: Automatic file watching and detection
- **Context Compression**: Fallback option when limits exceeded
- **Token Management**: Real-time counting and validation
- **Settings Configuration**: Customizable limits and options

## Advanced Usage

### Custom Limits

You can configure custom token limits in settings:

1. Open **Settings → Context Management**
2. Adjust **Maximum Context Tokens**
3. Set **Context Window Percentage**
4. Configure **Compression Thresholds**

### Batch Operations

For multiple context files:

1. Edit files sequentially
2. Wait for each to load completely
3. Monitor cumulative token usage
4. Use compression for remaining content

### Automation

Advanced users can automate context loading by:

- Using file templates for consistent structure
- Setting up keyboard shortcuts for common actions
- Configuring automatic compression fallbacks
- Creating custom validation rules

## Security and Privacy

- Context files are stored locally in your workspace
- No content is sent to external services during loading
- Token counting happens locally using your configured model
- File access respects your system permissions
- Sensitive information remains under your control

## Getting Help

If you encounter issues with context loading:

1. Check this documentation for common solutions
2. Review error messages for specific guidance
3. Use built-in recovery options when available
4. Consult the main context compression guide
5. Report persistent issues to the development team

Context loading is designed to be robust and user-friendly, with comprehensive error handling and recovery options to ensure you can always continue your work effectively.
