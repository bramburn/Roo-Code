## Large File Editing Workflow (Additional Rule)

When editing code in large files (>1000 lines, e.g., Tasks.ts), assess context limits first. If direct edits fail (e.g., truncation or errors), apply this workflow:

1. **Locate the Section:** Use PowerShell for line-based searches (`Select-String -Path [file] -Pattern "[regex or keyword]" -LineNumber -Context 5`) to find functions, variables, or patterns. For structural analysis, integrate AST-grep via MCP if enabled (`ast-grep --pattern '[AST pattern, e.g., $FUNC($ARG)]' --lang ts [file] --range [start-end]`) or run directly for metavariable matching.

2. **Delegate if Stuck:** Offload to Gemini CLI: `gemini -y -p "In [file], edit [specific changes, e.g., add null checks to process calls] around lines [X-Y]; read full context or chunk as needed."` Wait for completion.

3. **Verify Changes:** Post-edit, re-run PowerShell `Select-String` or AST-grep to confirm (e.g., check for new patterns and absence of old ones). If incomplete, retry delegation or suggest modularization (split file into smaller modules <500 lines).

4. **Proactive Tips:** Always target small diffs; use file read settings (e.g., increase "File read auto-truncate threshold" to full file if possible, or enable context condensing). Recommend breaking large files during refactors to avoid future issues.

Apply this rule in Code or Augment modes for Windows environments, leveraging MCP for tool orchestration.

Key rules for tool invocation:

- Server name: Always "memory" for the knowledge graph MCP.
- Tool name: "read_graph" – no parameters needed, so arguments are empty {}.
- Format: Enclose in <use_mcp_tool> tags with sub-tags for server_name, tool_name, and arguments.
- After the tool call, explain the next steps briefly, but let Roo Code handle execution and result injection.
- If the graph is needed for chaining (e.g., analysis or export), note it in your response post-call.

Few-shot examples:

Example 1:
User: "What is the current state of my knowledge graph in the MCP memory server? Show all entities and relations."
Assistant: To retrieve the full knowledge graph, I will call the read_graph tool from the memory MCP server.
<use_mcp_tool>
<server_name>memory</server_name>
<tool_name>read_graph</tool_name>
<arguments>{}</arguments>
</use_mcp_tool>
Once the graph is fetched, I can summarize the key entities and relations for you.

Example 2:
User: "Debug the MCP memory: read the entire graph to check for any recent additions to observations."
Assistant: Invoking read_graph to inspect the complete persisted knowledge graph, including all observations.
<use_mcp_tool>
<server_name>memory</server_name>
<tool_name>read_graph</tool_name>
<arguments>{}</arguments>
</use_mcp_tool>

After reviewing the output, I'll highlight any new observations or potential issues.

Example 3:
User: "Export the MCP graph for backup purposes—get the full structure."
Assistant: Calling read_graph to obtain the entire graph JSON for export.
<use_mcp_tool>
<server_name>memory</server_name>
<tool_name>read_graph</tool_name>
<arguments>{}</arguments>
</use_mcp_tool>
The result will include all entities, relations, and observations in a structured format ready for saving.
