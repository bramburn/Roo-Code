# MCP Tools Reference for Context Agents

## Overview

This guide documents the Model Context Protocol (MCP) tools required for the Context-Aware Agent system and provides usage examples for each.

## Required MCP Tools

### 1. ast-grep-mcp (Code Structure Analysis)

**Purpose:** Find exact code structures using AST (Abstract Syntax Tree) pattern matching.

**Available Tools:**
- `find_code`: Simple pattern matching across codebase
- `find_code_by_rule`: Complex YAML-based rule queries
- `dump_syntax_tree`: Debug and understand code structure
- `test_match_code_rule`: Test patterns before deployment

**Core Usage Examples:**

```typescript
// Find a specific class
find_code({
  pattern: "class UserController",
  language: "csharp",
  project_folder: "/path/to/project"
})

// Find all methods in a class
find_code({
  pattern: "public $_ $METHOD_NAME($$$) { $$$ }",
  language: "csharp",
  project_folder: "backend/controllers"
})

// Find interface implementations
find_code({
  pattern: "class $CLASS : IRepository<$TYPE>",
  language: "csharp",
  max_results: 10
})

// Find dependency injection patterns
find_code({
  pattern: "private readonly $TYPE $_field;",
  language: "csharp"
})
```

**Advanced Pattern Matching:**

```typescript
// 1. Complex pattern with YAML rule for detailed analysis
find_code_by_rule({
  yaml: `
    id: find-service-constructors
    language: csharp
    rule:
      pattern: |
        public $NAME($$$PARAMS) : base($$$ARGS)
          {
            $$$BODY
          }
      inside:
        pattern: class $CLASS : ServiceBase
        kind: class_declaration
    `,
  project_folder: "backend/Services"
})

// 2. Pattern matching for architectural validation
find_code_by_rule({
  yaml: `
    id: validate-repository-pattern
    language: csharp
    rule:
      pattern: |
        class $REPO : IRepository<$ENTITY>
          {
            private readonly $CONTEXT _context;

            public async Task<$ENTITY> GetByIdAsync($ID id)
            {
              $$$BODY
            }
          }
      inside:
        pattern: namespace $NAMESPACE.Repositories
        kind: namespace_declaration
    `,
  max_results: 20
})

// 3. Debug complex patterns by examining syntax tree
dump_syntax_tree({
  code: "public class UserService : IUserService { private readonly DbContext _context; }",
  language: "csharp",
  format: "ast"
})
```

**Integration with GitHub MCP Workflow:**

```typescript
// After finding patterns on GitHub, validate and adapt to local codebase
async function adaptGitHubPatternToLocal(githubPattern, localProject) {
  // 1. Test if GitHub pattern works locally
  const testResult = test_match_code_rule({
    code: githubPattern,
    yaml: generateRuleFromPattern(githubPattern)
  });

  if (!testResult.matches) {
    // 2. Find similar local patterns
    const localPatterns = find_code({
      pattern: adaptPatternToLocalSyntax(githubPattern),
      language: "csharp",
      project_folder: localProject
    });

    // 3. Analyze structural differences
    const localSyntax = dump_syntax_tree({
      code: localPatterns[0].code,
      language: "csharp",
      format: "ast"
    });

    return adaptPatternToProjectStandards(githubPattern, localSyntax);
  }

  return githubPattern;
}
```

**Best Practices:**
- Use `find_code` for simple pattern searches
- Use `find_code_by_rule` for complex structural queries
- Use `dump_syntax_tree` to debug pattern matching issues
- Use `test_match_code_rule` before deploying complex patterns
- Combine with GitHub MCP: find external patterns → validate with ast-grep → adapt to local codebase
- Specify `project_folder` to limit search scope and improve performance
- Use `max_results` to avoid overwhelming context windows

**Pattern Development Workflow:**

1. **Discovery**: Use GitHub MCP to find best practice patterns
2. **Validation**: Use `test_match_code_rule` to test patterns locally
3. **Adaptation**: Use `dump_syntax_tree` to understand local vs external differences
4. **Implementation**: Use `find_code_by_rule` to find all places needing updates
5. **Verification**: Use `find_code` to confirm changes were applied correctly

**Language-Specific Patterns:**

```csharp
// C# Controller patterns
find_code({
  pattern: "[Route(\"api/[controller]\")] public class $CONTROLLER : ControllerBase",
  language: "csharp"
})

// Dependency injection patterns
find_code({
  pattern: "public $CLASS($$$_PARAMS) { $$$_PARAMS.ForEach(param => _param = param; } }",
  language: "csharp"
})

// Entity Framework patterns
find_code({
  pattern: "public DbSet<$ENTITY> $ENTITIES { get; set; }",
  language: "csharp"
})

// Async/await patterns
find_code({
  pattern: "public async Task<$RETURN> $METHOD($$$PARAMS) { await $CALL; }",
  language: "csharp"
})
```

---

### 2. semantic_search (Pattern Matching)

**Purpose:** Find similar code patterns and implementations across the codebase using semantic understanding.

**Capabilities:**
- Find similar implementations
- Identify architectural patterns
- Discover naming conventions
- Locate related functionality
- Search by concept, not exact syntax

**Usage Examples:**

```typescript
// Find authentication implementations
semantic_search.query({
  query: "authentication service implementation",
  limit: 5
})

// Find repository pattern examples
semantic_search.query({
  query: "repository pattern with Entity Framework",
  file_types: [".cs"],
  limit: 3
})

// Find API controller patterns
semantic_search.query({
  query: "REST API controller with validation",
  directory: "backend/controllers",
  limit: 5
})

// Find dependency injection setup
semantic_search.query({
  query: "dependency injection configuration startup",
  limit: 3
})
```

**Best Practices:**
- Use descriptive, concept-based queries
- Limit results to avoid overwhelming context
- Focus on architectural patterns, not specific implementations
- Combine with ast-grep for precise extraction

---

### 3. github_mcp (External Best Practices)

**Purpose:** Search GitHub for high-quality code examples and best practices using your configured GitHub MCP server.

**Available Tools:**
- `search_repositories`: Find repositories by topic, language, stars
- `search_code`: Find specific code patterns across repositories
- `get_file_contents`: Retrieve complete file contents from repositories

**Usage Examples:**

```typescript
// Search for XUnit testing repositories
search_repositories({
  query: "XUnit .NET 8 testing patterns language:C# stars:>1000",
  sort: "stars",
  order: "desc",
  per_page: 5
})

// Search for specific code patterns
search_code({
  query: "IClassFixture Xunit language:C#",
  sort: "indexed",
  order: "desc",
  per_page: 10
})

// Get complete file contents for detailed analysis
get_file_contents({
  owner: "dotnet",
  repo: "samples",
  path: "core/testing/xunit-basic/UnitTest1.cs",
  ref: "main"
})
```

**Advanced Usage Patterns:**

```typescript
// 1. Repository-first approach: Find repos, then explore files
const repos = await search_repositories({
  query: "ASP.NET Core Identity Clean Architecture language:C# stars:>500",
  sort: "stars",
  per_page: 3
});

for (const repo of repos) {
  // Search for specific patterns within the repo
  const codeResults = await search_code({
    query: `repo:${repo.full_name} IIdentityService language:C#`,
    sort: "indexed"
  });

  // Get complete implementation files
  for (const result of codeResults) {
    const fileContent = await get_file_contents({
      owner: repo.owner.login,
      repo: repo.name,
      path: result.path
    });
  }
}

// 2. Code-first approach: Find patterns, then get context
const authServices = await search_code({
  query: "class AuthenticationService : IAuthenticationService language:C#",
  sort: "indexed",
  per_page: 5
});

// 3. Technology-specific searches
const entityFrameworkPatterns = await search_repositories({
  query: "Entity Framework Core repository pattern unit-of-work language:C# stars:>1000",
  sort: "updated",
  per_page: 5
});
```

**Best Practices:**
- Always filter by stars (>500 or >1000) for quality
- Use `sort: "updated"` for recent best practices
- Combine `search_repositories` + `search_code` for comprehensive analysis
- Use `get_file_contents` for complete implementations, not just snippets
- **Cache results immediately** to mcp_memory with rich metadata
- Prefer `language:C#` filter for .NET projects to reduce noise

**Integration with ast-grep:**
After finding patterns with GitHub MCP, use ast-grep to:
1. Find similar patterns in your local codebase
2. Validate that external patterns match your project structure
3. Adapt external patterns to your coding standards

**Cost Considerations:**
- GitHub API rate limits: 5,000 requests/hour (authenticated)
- Each search and file fetch counts against quota
- **Always check mcp_memory first** before GitHub searches
- Cache complete file contents to minimize future API calls
- Use `get_file_contents` sparingly - prefer search results when possible

---

### 4. mcp_memory (Knowledge Graph & Memory Cache)

**Purpose:** Store and retrieve research findings as a knowledge graph to enable knowledge reuse and cost savings.

**Available Tools:**
- `search_nodes`: Semantic search across stored knowledge graph
- `create_entities`: Store new knowledge entities (code patterns, best practices)
- `create_relations`: Create relationships between knowledge entities
- `read_graph`: Read the complete knowledge graph structure
- `open_nodes`: Retrieve specific entities by name
- `add_observations`: Add new observations to existing entities
- `delete_entities`, `delete_relations`, `delete_observations`: Manage knowledge graph

**Core Usage Examples:**

```typescript
// Search for cached knowledge (primary method)
search_nodes({
  query: "XUnit setup for .NET 8"
})

// Create comprehensive knowledge entity
create_entities({
  entities: [{
    name: "XUnit Setup for .NET 8",
    entityType: "Technology Pattern",
    observations: [
      "Use IClassFixture for shared setup between tests",
      "Implement IAsyncLifetime for async test initialization",
      "Use CollectionFixtures for database integration tests",
      "Configure test services in separate fixture classes"
    ]
  }]
})

// Create relationships between patterns
create_relations({
  relations: [{
    from: "XUnit Setup for .NET 8",
    to: "Entity Framework Core Testing",
    relationType: "used_with"
  }]
})

// Add new findings to existing knowledge
add_observations({
  observations: [{
    entityName: "XUnit Setup for .NET 8",
    contents: [
      "Use TheoryData for parameterized tests with complex objects",
      "Implement CustomAttribute for test categorization"
    ]
  }]
})
```

**Advanced Usage Patterns:**

```typescript
// 1. Technology-specific searches with context
search_nodes({
  query: "authentication patterns ASP.NET Core JWT"
})

// 2. Pattern relationship analysis
const searchResults = await search_nodes({ query: "repository pattern" });
const relatedNodes = searchResults.map(result =>
  open_nodes({ names: [result.name] })
);

// 3. Complete knowledge graph read for analysis
const fullGraph = await read_graph();
const csharpPatterns = fullGraph.nodes.filter(node =>
  node.observations.some(obs =>
    obs.includes("C#") || obs.includes(".NET")
  )
);

// 4. Pattern discovery and relationship mapping
async function discoverPatternRelationships(patternName) {
  const entity = await open_nodes({ names: [patternName] });
  const relatedSearch = await search_nodes({
    query: `patterns related to ${patternName}`
  });

  // Create relationships if they don't exist
  await create_relations({
    relations: relatedSearch.map(related => ({
      from: patternName,
      to: related.name,
      relationType: "similar_to"
    }))
  });
}
```

**Knowledge Organization Strategy:**

```typescript
// 1. Store technology-specific patterns
create_entities({
  entities: [{
    name: "ASP.NET Core Dependency Injection",
    entityType: "Architecture Pattern",
    observations: [
      "Use AddScoped for services with per-request lifetime",
      "Use AddSingleton for application-wide services",
      "Use AddTransient for short-lived services",
      "Configure services in Program.cs or Startup.cs"
    ]
  }]
})

// 2. Create implementation relationships
create_relations({
  relations: [
    { from: "ASP.NET Core Dependency Injection", to: "Service Pattern", relationType: "enables" },
    { from: "Service Pattern", to: "Repository Pattern", relationType: "often_used_with" },
    { from: "Repository Pattern", to: "Entity Framework Core", relationType: "implements" }
  ]
})

// 3. Store code examples as observations
add_observations({
  observations: [{
    entityName: "Service Pattern",
    contents: [
      "public class UserService : IUserService { private readonly IRepository<User> _repository; }",
      "Constructor injection preferred over property injection",
      "Use interfaces for dependency inversion"
    ]
  }]
})
```

**Integration with Context Engineer:**

The context engineer should:

1. **Always search first**: `search_nodes()` before any external research
2. **Create rich entities**: Use `create_entities()` with comprehensive observations
3. **Map relationships**: Use `create_relations()` to connect related patterns
4. **Build knowledge graph**: Continuously expand the organizational knowledge base
5. **Update usage**: Track which patterns are most valuable through repeated access

**Best Practices:**
- **Always search memory first** before external APIs using `search_nodes()`
- Store knowledge as entities with descriptive names and types
- Create meaningful relationships between related concepts
- Include comprehensive observations (patterns, code snippets, sources)
- Use `add_observations()` to enhance existing knowledge rather than creating duplicates
- Query the knowledge graph to understand patterns before external research
- Build relationships to create a comprehensive knowledge network

**Knowledge Accumulation Benefits:**
- **First task**: Cache miss → External search → Create entities + relations
- **Second task**: Cache hit → Skip external search → 60% cost savings
- **Fifth task**: Rich graph traversal → Related pattern discovery → 80% cost savings
- **Tenth+ task**: Complete knowledge graph → Instant recommendations → 90% cost savings

**Context Engineer Documentation:**
The context engineer **writes context.md files directly** to the filesystem, not returning content to the orchestrator. This ensures:
- Context files are created in the correct PRD directories
- File system permissions are properly handled
- Direct integration with the code agent workflow
- Immediate availability for implementation tasks

---

## Integration Workflow

### Enhanced Step-by-Step MCP Tool Usage

```
1. Task Received
   ↓
2. ast-grep-mcp: Find current code structures and patterns
   ↓
3. semantic_search: Find similar internal patterns
   ↓
4. mcp_memory.search: Check for cached knowledge
   ↓
   [Found in cache?]
   ↓ NO                    ↓ YES
5a. GitHub MCP Research    5b. Use cached results
   │                       ↓
   ├─ 5a.1. search_repositories: Find quality repos
   │     ↓
   ├─ 5a.2. search_code: Find specific patterns
   │     ↓
   ├─ 5a.3. get_file_contents: Get complete examples
   │     ↓
   ├─ 5a.4. ast-grep-mcp: Validate patterns locally
   │     ↓
   └─ 5a.5. ast-grep-mcp: Adapt to project structure
                           ↓
6a. mcp_memory.store       6b. mcp_memory.update (last_used)
   ↓                       ↓
7. Generate implementation plan
   ↓
8. Write context.md file
```

### GitHub MCP + ast-grep Synergy Workflow

**Phase 1: External Discovery (GitHub MCP)**
```
1. search_repositories: "ASP.NET Core Clean Architecture stars:>1000"
   ↓
2. search_code: "IRepository pattern implementation language:C#"
   ↓
3. get_file_contents: Download complete implementations
```

**Phase 2: Local Validation (ast-grep)**
```
4. test_match_code_rule: Test if external patterns work locally
   ↓
5. find_code: Find similar existing patterns in codebase
   ↓
6. dump_syntax_tree: Analyze structural differences
```

**Phase 3: Pattern Adaptation**
```
7. find_code_by_rule: Locate all places needing updates
   ↓
8. Create context-specific implementation plan
```

### Cost Optimization Strategy

**First Run (Cold Start):**
- ast-grep (internal analysis): ~0.2s (local)
- semantic_search: ~0.5s (local)
- mcp_memory: ~0.2s (cache miss)
- GitHub MCP (research): ~3-5s (external API)
  - search_repositories: ~1s
  - search_code: ~1-2s
  - get_file_contents: ~1-2s
- ast-grep (validation): ~0.3s (local)
- **Total: ~4-6 seconds**

**Subsequent Runs (Warm Cache):**
- ast-grep (internal analysis): ~0.2s (local)
- semantic_search: ~0.5s (local)
- mcp_memory: ~0.2s (cache hit)
- GitHub MCP: **SKIPPED**
- ast-grep (validation): **SKIPPED**
- **Total: ~0.9 seconds (85% faster)**

**Cache Effectiveness:**
- 1st similar task: Full cost, full research
- 2nd similar task: ~60% cost reduction (cached external research)
- 5th similar task: ~80% cost reduction
- 10th+ similar task: ~90% cost reduction

### Quality Assurance Workflow

**Pattern Quality Validation:**
1. **GitHub Quality Filters**: stars:>1000, updated recently, language-specific
2. **ast-grep Validation**: Test patterns in local context before implementation
3. **Syntax Analysis**: Use `dump_syntax_tree` to ensure compatibility
4. **Pattern Adaptation**: Modify external patterns to match project standards

**Implementation Verification:**
1. **Pre-implementation**: `test_match_code_rule` to validate patterns
2. **During implementation**: `find_code_by_rule` to locate all instances
3. **Post-implementation**: `find_code` to verify changes applied correctly

### Error Recovery Strategy

**GitHub API Rate Limited:**
- Fall back to cached mcp_memory results
- Use generic best practices from LLM knowledge
- Mark as "limited external research" in context file

**ast-grep Pattern Fails:**
- Simplify pattern syntax
- Use `dump_syntax_tree` to debug
- Fall back to basic text search
- Note pattern limitations in context

**Memory Cache Miss:**
- Proceed with full GitHub MCP research
- Cache results aggressively for future use
- Update knowledge base with new patterns

---

## Authentication & Setup

### ast-grep-mcp
- **Setup:** Install ast-grep CLI
- **Config:** No authentication required
- **Limits:** Local execution, no rate limits

### semantic_search
- **Setup:** Configure with codebase index
- **Config:** May require initial indexing
- **Limits:** Local execution, no rate limits

### github_mcp
- **Setup:** GitHub Personal Access Token required
- **Config:** Set GITHUB_TOKEN environment variable
- **Limits:** 5,000 requests/hour (authenticated)

### mcp_memory
- **Setup:** Qdrant or compatible vector DB
- **Config:** Connection string and API key
- **Limits:** Depends on hosting plan

---

## Troubleshooting

### ast-grep returns no results
- **Cause:** Pattern syntax incorrect
- **Solution:** Simplify pattern, check language syntax

### semantic_search returns too many results
- **Cause:** Query too broad
- **Solution:** Add more specific terms, limit by directory

### github_mcp rate limit exceeded
- **Cause:** Too many API calls
- **Solution:** Use mcp_memory cache more aggressively

### mcp_memory connection failed
- **Cause:** Vector DB unavailable
- **Solution:** Skip caching, proceed with external search

---

## Next Steps

- See `RESEARCH_ORCHESTRATION_PROTOCOL.md` for complete research workflow
- See `CONTEXT_WORKFLOW_GUIDE.md` for end-to-end process
- See `context_template.md` for output format

