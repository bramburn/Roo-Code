import * as fs from "fs/promises";
/**
 * Context file parser for loading and validating edited context files
 * Handles markdown file reading, metadata extraction, and content parsing
 */
export class ContextFileParser {
    /**
     * Parse a context file and extract metadata and messages
     */
    async parseContextFile(filepath) {
        const rawContent = await this.readFileContent(filepath);
        const { metadata, content } = this.extractMetadataAndContent(rawContent);
        const messages = this.parseMessagesFromContent(content);
        return {
            metadata,
            messages,
            content,
            rawContent,
        };
    }
    /**
     * Validate context file format and structure
     */
    validateContextFile(parsedFile) {
        const errors = [];
        const warnings = [];
        // Validate metadata
        if (!parsedFile.metadata.taskId) {
            errors.push("Missing task ID in metadata");
        }
        if (!parsedFile.metadata.timestamp) {
            errors.push("Missing timestamp in metadata");
        }
        if (!parsedFile.metadata.contextSize || parsedFile.metadata.contextSize <= 0) {
            errors.push("Invalid context size in metadata");
        }
        if (!["manual", "automatic", "aggressive"].includes(parsedFile.metadata.triggerReason)) {
            errors.push("Invalid trigger reason in metadata");
        }
        // Validate messages
        if (!parsedFile.messages || parsedFile.messages.length === 0) {
            errors.push("No messages found in context file");
        }
        // Check for valid message structure
        for (let i = 0; i < parsedFile.messages.length; i++) {
            const message = parsedFile.messages[i];
            if (!message.role || !["user", "assistant"].includes(message.role)) {
                errors.push(`Invalid message role at index ${i}: ${message.role}`);
            }
            if (!message.content) {
                errors.push(`Empty message content at index ${i}`);
            }
        }
        // Check for potential issues
        if (parsedFile.messages.length > 50) {
            warnings.push("Large number of messages may impact performance");
        }
        if (parsedFile.rawContent.length > 1000000) {
            // 1MB
            warnings.push("Very large context file may be slow to process");
        }
        return {
            isValid: errors.length === 0,
            errors,
            warnings,
        };
    }
    /**
     * Read file content with error handling
     */
    async readFileContent(filepath) {
        try {
            return await fs.readFile(filepath, "utf-8");
        }
        catch (error) {
            if (error.code === "ENOENT") {
                throw new Error(`Context file not found: ${filepath}`);
            }
            else if (error.code === "EACCES") {
                throw new Error(`Permission denied reading context file: ${filepath}`);
            }
            else {
                throw new Error(`Failed to read context file: ${filepath} - ${error}`);
            }
        }
    }
    /**
     * Extract YAML frontmatter metadata and content from markdown
     */
    extractMetadataAndContent(content) {
        // Check if content starts with YAML frontmatter
        if (!content.startsWith("---")) {
            throw new Error("Context file must start with YAML frontmatter metadata");
        }
        const frontmatterEnd = content.indexOf("---", 3);
        if (frontmatterEnd === -1) {
            throw new Error("Context file has unclosed YAML frontmatter");
        }
        const frontmatterText = content.slice(3, frontmatterEnd).trim();
        const markdownContent = content.slice(frontmatterEnd + 3).trim();
        const metadata = this.parseYamlMetadata(frontmatterText);
        return {
            metadata,
            content: markdownContent,
        };
    }
    /**
     * Parse YAML metadata from frontmatter
     */
    parseYamlMetadata(yamlText) {
        const metadata = {};
        // Simple YAML parser for our specific format
        const lines = yamlText.split("\n");
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith("#"))
                continue;
            const colonIndex = trimmed.indexOf(":");
            if (colonIndex === -1)
                continue;
            const key = trimmed.slice(0, colonIndex).trim();
            const value = trimmed.slice(colonIndex + 1).trim();
            switch (key) {
                case "Task ID":
                    metadata.taskId = value.replace(/["']/g, "");
                    break;
                case "Created":
                    metadata.timestamp = new Date(value).getTime();
                    break;
                case "Context Size": {
                    const sizeMatch = value.match(/(\d+)/);
                    if (sizeMatch) {
                        metadata.contextSize = parseInt(sizeMatch[1], 10);
                    }
                    break;
                }
                case "Trigger Reason": {
                    const reason = value.replace(/["']/g, "").toLowerCase();
                    if (["manual", "automatic", "aggressive"].includes(reason)) {
                        metadata.triggerReason = reason;
                    }
                    break;
                }
            }
        }
        // Validate required fields
        if (!metadata.taskId)
            throw new Error("Missing Task ID in metadata");
        if (!metadata.timestamp)
            throw new Error("Missing Created timestamp in metadata");
        if (!metadata.contextSize)
            throw new Error("Missing Context Size in metadata");
        if (!metadata.triggerReason)
            throw new Error("Missing Trigger Reason in metadata");
        return metadata;
    }
    /**
     * Parse messages from markdown content
     */
    parseMessagesFromContent(content) {
        const messages = [];
        // Split by message headers (### 👤 User or ### 🤖 Assistant)
        const messageSections = content.split(/### (👤 User|🤖 Assistant)/);
        for (let i = 1; i < messageSections.length; i++) {
            // Skip first empty section
            const section = messageSections[i];
            const roleMatch = messageSections[i - 1].match(/### (👤 User|🤖 Assistant)/);
            if (!roleMatch)
                continue;
            const role = roleMatch[1] === "👤 User" ? "user" : "assistant";
            // Extract timestamp from section header
            const timestampMatch = section.match(/\(([^)]+)\)/);
            const timestamp = timestampMatch ? new Date(timestampMatch[1]).getTime() : Date.now();
            // Extract content (remove headers and separators)
            let messageContent = section
                .replace(/^\s*\([^)]*\)\s*/, "") // Remove timestamp
                .replace(/^---\s*$/, "") // Remove separator at start
                .replace(/\s*---\s*$/, "") // Remove separator at end
                .trim();
            // Handle different content types
            if (messageContent.includes("[Image:")) {
                // Parse mixed content with images
                const contentBlocks = [];
                const parts = messageContent.split(/(\[Image:[^\]]*\])/);
                for (const part of parts) {
                    if (part.startsWith("[Image:")) {
                        const mediaType = part.match(/\[Image: ([^\]]+)\]/)?.[1] || "unknown";
                        contentBlocks.push({
                            type: "image",
                            source: { media_type: mediaType },
                        });
                    }
                    else if (part.trim()) {
                        contentBlocks.push({
                            type: "text",
                            text: part.trim(),
                        });
                    }
                }
                messages.push({
                    role,
                    content: contentBlocks,
                    ts: timestamp,
                });
            }
            else {
                // Simple text content
                messages.push({
                    role,
                    content: messageContent,
                    ts: timestamp,
                });
            }
        }
        return messages;
    }
    /**
     * Check if file exists and is readable
     */
    async fileExists(filepath) {
        try {
            const stats = await fs.stat(filepath);
            return stats.isFile();
        }
        catch {
            return false;
        }
    }
    /**
     * Get file stats for validation
     */
    async getFileStats(filepath) {
        try {
            const stats = await fs.stat(filepath);
            return {
                size: stats.size,
                modified: stats.mtime.getTime(),
            };
        }
        catch (error) {
            throw new Error(`Failed to get file stats for ${filepath}: ${error}`);
        }
    }
}
//# sourceMappingURL=context-file-parser.js.map