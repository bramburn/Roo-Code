# Context Compression Control - Troubleshooting Guide

This guide helps you resolve common issues with the Context Compression Control feature in Roo Code.

## Table of Contents

- [General Issues](#general-issues)
- [File System Problems](#file-system-problems)
- [Performance Issues](#performance-issues)
- [Manual Review Problems](#manual-review-problems)
- [Settings and Configuration](#settings-and-configuration)
- [Platform-Specific Issues](#platform-specific-issues)
- [Error Messages](#error-messages)
- [Recovery Procedures](#recovery-procedures)

## General Issues

### Context compression not working

**Symptoms:**

- Context files are not being created
- Manual review is not triggered
- Settings appear to have no effect

**Possible Causes:**

1. Context compression is disabled in settings
2. Context size threshold is too high
3. Manual review is disabled

**Solutions:**

1. **Enable Context Compression:**

    - Open Settings → Context Management
    - Enable "Enable Context Compression"
    - Set appropriate thresholds

2. **Check Threshold Settings:**

    - Set "Context Size Threshold" to a reasonable value (e.g., 10000 tokens)
    - Ensure "Manual Review Threshold" is lower than auto-compression threshold

3. **Verify Manual Review:**
    - Enable "Enable Manual Review"
    - Set "Manual Review Threshold" appropriately

### Feature not appearing in UI

**Symptoms:**

- No context management options in settings
- Manual review interface not showing
- Progress indicators not visible

**Solutions:**

1. **Restart Extension:**

    - Open Command Palette (Ctrl+Shift+P or Cmd+Shift+P)
    - Run "Developer: Reload Window"

2. **Check Extension Version:**

    - Ensure you're using version 3.30.0 or later
    - Update extension if necessary

3. **Clear Extension Cache:**
    - Run "Developer: Clear Extension Host Cache"
    - Restart VS Code

## File System Problems

### "Permission denied" errors

**Symptoms:**

- Error messages about file access permissions
- Unable to create or read context files
- Manual review fails to load files

**Solutions:**

1. **Check File Permissions:**

    ```bash
    # On macOS/Linux
    ls -la ~/.roo-code/context-compression/
    chmod 755 ~/.roo-code/context-compression/

    # On Windows (as Administrator)
    icacls "%USERPROFILE%\.roo-code\context-compression" /grant Users:F
    ```

2. **Run VS Code as Administrator (Windows):**

    - Right-click VS Code icon
    - Select "Run as administrator"

3. **Check Workspace Permissions:**
    - Ensure workspace directory is writable
    - Check if files are locked by other applications

### "File not found" errors

**Symptoms:**

- Context files disappear unexpectedly
- Manual review shows missing files
- Recovery attempts fail

**Solutions:**

1. **Check File Locations:**

    - Context files are stored in: `~/.roo-code/context-compression/`
    - Workspace-specific files in: `.roo/context-compression/`

2. **Enable File Recovery:**

    - Go to Settings → Context Management
    - Enable "Enable File Recovery"
    - Set appropriate backup retention

3. **Manual File Recovery:**
    - Check backup directory: `~/.roo-code/context-compression/backups/`
    - Restore from automatic backups

### Disk space issues

**Symptoms:**

- "Insufficient disk space" errors
- Slow performance during compression
- Files not being saved

**Solutions:**

1. **Check Available Space:**

    ```bash
    # On macOS/Linux
    df -h ~/.roo-code/

    # On Windows
    dir %USERPROFILE%\.roo-code
    ```

2. **Clean Up Old Files:**

    - Go to Settings → Context Management
    - Reduce "Backup Retention Days"
    - Click "Clear Cache"

3. **Manual Cleanup:**

    ```bash
    # Remove old context files
    find ~/.roo-code/context-compression/ -name "*.json" -mtime +7 -delete

    # Clear backup directory
    rm -rf ~/.roo-code/context-compression/backups/*
    ```

## Performance Issues

### Slow context compression

**Symptoms:**

- Compression takes a long time
- UI becomes unresponsive
- High CPU usage

**Solutions:**

1. **Adjust Performance Settings:**

    - Go to Settings → Context Management
    - Enable "Enable Performance Optimization"
    - Set appropriate "Max Memory Usage"

2. **Optimize Context Size:**

    - Reduce "Context Size Threshold"
    - Enable "Enable Lazy Loading"
    - Use "Smart Selection" for context items

3. **Check System Resources:**
    - Close unnecessary applications
    - Ensure sufficient RAM is available
    - Check for background processes

### Memory usage too high

**Symptoms:**

- VS Code becomes slow
- "Out of memory" errors
- System performance degradation

**Solutions:**

1. **Adjust Memory Settings:**

    - Go to Settings → Context Management
    - Reduce "Max Memory Usage"
    - Enable "Enable Memory Optimization"

2. **Clear Cache:**

    - Click "Clear Cache" in settings
    - Restart VS Code

3. **Reduce Concurrent Operations:**
    - Lower "Max Concurrent Operations"
    - Enable "Enable Batching"

## Manual Review Problems

### Manual review not starting

**Symptoms:**

- Manual review button doesn't work
- No review interface appears
- Progress indicators stuck

**Solutions:**

1. **Check Threshold Settings:**

    - Ensure context size exceeds manual review threshold
    - Verify manual review is enabled

2. **Check File Accessibility:**

    - Ensure context files exist and are readable
    - Check file permissions

3. **Restart Manual Review:**
    - Cancel current review if stuck
    - Try starting review again

### Review interface not loading

**Symptoms:**

- Blank review interface
- Items not displaying
- Controls not responding

**Solutions:**

1. **Refresh Interface:**

    - Press F5 to refresh the webview
    - Restart VS Code if needed

2. **Check for Errors:**

    - Open Developer Tools (Help → Toggle Developer Tools)
    - Check console for JavaScript errors

3. **Reset Review State:**
    - Go to Settings → Context Management
    - Click "Reset Review State"

### Cannot save review changes

**Symptoms:**

- Save button not working
- Changes not persisting
- Error messages on save

**Solutions:**

1. **Check File Permissions:**

    - Ensure context files are writable
    - Check disk space availability

2. **Validate Review Data:**

    - Ensure all required fields are filled
    - Check for invalid selections

3. **Retry Save Operation:**
    - Wait a moment and try again
    - Restart review if necessary

## Settings and Configuration

### Settings not saving

**Symptoms:**

- Changes revert after restart
- Settings appear to reset
- Configuration not applied

**Solutions:**

1. **Check Settings File:**

    - Locate settings file: `~/.roo-code/settings.json`
    - Ensure file is writable
    - Check for syntax errors

2. **Reset Settings:**

    - Go to Settings → Context Management
    - Click "Reset to Defaults"
    - Reconfigure settings

3. **Check Extension Permissions:**
    - Ensure extension has permission to write settings
    - Restart VS Code with elevated privileges if needed

### Invalid configuration values

**Symptoms:**

- Error messages about invalid settings
- Settings not applying correctly
- Unexpected behavior

**Solutions:**

1. **Validate Settings:**

    - Ensure numeric values are within valid ranges
    - Check that file paths are correct
    - Verify boolean values are true/false

2. **Use Recommended Values:**

    - Context Size Threshold: 10000
    - Manual Review Threshold: 5000
    - Max Memory Usage: 1024 (MB)
    - Backup Retention Days: 7

3. **Reset Problematic Settings:**
    - Identify problematic setting
    - Reset to default value
    - Reconfigure carefully

## Platform-Specific Issues

### Windows-Specific Issues

#### Long Path Names

**Problem:** Windows has a 260 character path limit

**Solutions:**

1. Enable long path support:

    ```cmd
    # As Administrator
    reg add "HKLM\SYSTEM\CurrentControlSet\Control\FileSystem" /v LongPathsEnabled /t REG_DWORD /d 1 /f
    ```

2. Use shorter workspace paths
3. Move workspace closer to root directory

#### Antivirus Interference

**Problem:** Antivirus software blocks file operations

**Solutions:**

1. Add VS Code to antivirus exclusions
2. Exclude `.roo-code` directory from scanning
3. Temporarily disable real-time protection

#### UAC Issues

**Problem:** User Account Control blocks operations

**Solutions:**

1. Run VS Code as administrator
2. Adjust UAC settings
3. Move workspace to user directory

### macOS-Specific Issues

#### Gatekeeper Blocking

**Problem:** macOS blocks file access

**Solutions:**

1. Allow VS Code in Security & Privacy preferences
2. Run `xattr -d com.apple.quarantine` on VS Code app
3. Use `sudo` for terminal operations

#### File System Permissions

**Problem:** Strict file permissions

**Solutions:**

1. Check and fix permissions:

    ```bash
    chmod -R 755 ~/.roo-code/
    chown -R $USER:staff ~/.roo-code/
    ```

2. Use proper user directories
3. Avoid system-protected locations

#### SIP (System Integrity Protection)

**Problem:** SIP blocks system modifications

**Solutions:**

1. Don't install in system directories
2. Use user home directory for workspace
3. Avoid modifying system files

### Linux-Specific Issues

#### Permission Denied

**Problem:** File permission issues

**Solutions:**

1. Check and fix permissions:

    ```bash
    chmod -R 755 ~/.roo-code/
    chown -R $USER:$USER ~/.roo-code/
    ```

2. Use appropriate user groups
3. Check SELinux/AppArmor policies

#### File System Differences

**Problem:** Different file system behaviors

**Solutions:**

1. Use ext4 or similar filesystem
2. Avoid case-insensitive filesystems
3. Check filesystem mount options

#### Package Dependencies

**Problem:** Missing system dependencies

**Solutions:**

1. Install required packages:

    ```bash
    # Ubuntu/Debian
    sudo apt-get install nodejs npm

    # Fedora/RHEL
    sudo dnf install nodejs npm

    # Arch Linux
    sudo pacman -S nodejs npm
    ```

## Error Messages

### Common Error Codes

#### `EACCES: permission denied`

**Cause:** Insufficient file permissions
**Solution:** Check file permissions, run as administrator if needed

#### `ENOENT: no such file or directory`

**Cause:** File or directory doesn't exist
**Solution:** Check file paths, create missing directories

#### `EMFILE: too many open files`

**Cause:** System file descriptor limit exceeded
**Solution:** Increase file descriptor limit, close unused files

#### `ENOSPC: no space left on device`

**Cause:** Disk full
**Solution:** Free up disk space, clean up old files

#### `ETIMEDOUT: operation timed out`

**Cause:** Operation took too long
**Solution:** Increase timeout, check network connectivity

#### `ECONNREFUSED: connection refused`

**Cause:** Network connection failed
**Solution:** Check network settings, firewall configuration

### Context Compression Specific Errors

#### `Context size exceeds maximum limit`

**Cause:** Context is too large to process
**Solution:** Increase limit or reduce context size

#### `Manual review session already active`

**Cause:** Another review session is running
**Solution:** Complete or cancel existing session

#### `File recovery failed`

**Cause:** Unable to recover lost files
**Solution:** Check backup directory, restore from backup

#### `Performance optimization failed`

**Cause:** Unable to optimize performance
**Solution:** Check system resources, adjust settings

## Recovery Procedures

### Emergency File Recovery

1. **Locate Backup Directory:**

    ```
    ~/.roo-code/context-compression/backups/
    ```

2. **Identify Latest Backup:**

    - Look for files with timestamp
    - Check file integrity

3. **Restore Files:**
    ```bash
    # Copy backup to original location
    cp ~/.roo-code/context-compression/backups/latest/*.json ~/.roo-code/context-compression/
    ```

### Reset to Factory Defaults

1. **Backup Current Settings:**

    ```bash
    cp ~/.roo-code/settings.json ~/.roo-code/settings.backup.json
    ```

2. **Reset Extension Settings:**

    - Open VS Code settings
    - Search for "Context Compression"
    - Click "Reset to Defaults"

3. **Clear All Data:**
    ```bash
    rm -rf ~/.roo-code/context-compression/
    ```

### Performance Recovery

1. **Clear All Caches:**

    - Go to Settings → Context Management
    - Click "Clear Cache"
    - Restart VS Code

2. **Reset Performance Settings:**

    - Disable performance optimization temporarily
    - Restart with conservative settings
    - Gradually re-enable features

3. **Monitor System Resources:**
    - Check CPU and memory usage
    - Identify resource bottlenecks
    - Adjust settings accordingly

## Getting Help

### Collect Diagnostic Information

1. **Export Settings:**

    - Go to Settings → Context Management
    - Click "Export Settings"

2. **Generate Debug Log:**

    - Open Developer Tools
    - Enable debug logging
    - Reproduce the issue

3. **System Information:**
    - Operating system and version
    - VS Code version
    - Extension version
    - Available memory and disk space

### Contact Support

1. **GitHub Issues:**

    - Visit [Roo Code GitHub](https://github.com/roo-code/roo-code)
    - Search existing issues
    - Create new issue with details

2. **Community Forums:**

    - Check discussion forums
    - Search for similar problems
    - Ask for help with specific details

3. **Documentation:**
    - Check [User Guide](./context-compression.md)
    - Review [API Documentation](../developers/)
    - Look for [FAQ](./faq.md)

### Best Practices

1. **Regular Backups:**

    - Enable automatic backups
    - Keep multiple backup versions
    - Test recovery procedures

2. **Monitor Performance:**

    - Check memory usage regularly
    - Monitor disk space
    - Watch for performance degradation

3. **Keep Updated:**

    - Update extension regularly
    - Check release notes
    - Test new versions in safe environment

4. **Document Issues:**
    - Keep track of recurring problems
    - Note successful solutions
    - Share findings with community
