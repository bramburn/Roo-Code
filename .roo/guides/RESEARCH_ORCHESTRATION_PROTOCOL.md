# Research Orchestration Protocol

## Overview

This document defines the multi-tool research loop that the `context-engineer` agent executes to gather comprehensive context for a single development task.

## Research Loop: 4-Step Process

```
┌──────────────────────────────────────────────────────────────┐
│ Step 1: Internal Codebase Analysis                           │
│ Tools: ast-grep-mcp, semantic_search                         │
│ Output: Section 1 of context.md                              │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│ Step 2: Memory Check (Knowledge Base)                        │
│ Tool: mcp_memory (Vector DB)                                 │
│ Output: Section 3 of context.md                              │
└──────────────────────────────────────────────────────────────┘
                          ↓
                    [Found in Memory?]
                    /              \
                  YES               NO
                   ↓                 ↓
         ┌─────────────────┐  ┌──────────────────────────────┐
         │ Skip Step 3     │  │ Step 3: External Research    │
         │ (Cost Savings)  │  │ Tool: github_mcp             │
         └─────────────────┘  │ Output: Section 2            │
                              │ Action: Cache to mcp_memory  │
                              └──────────────────────────────┘
                                        ↓
┌──────────────────────────────────────────────────────────────┐
│ Step 4: Planning & Dependencies                              │
│ Tool: LLM Reasoning                                           │
│ Output: Sections 4 & 5 of context.md                         │
└──────────────────────────────────────────────────────────────┘
```

## Step 1: Internal Codebase Analysis

### Objective

Understand the current state of the codebase and identify existing patterns.

### Tools Used

#### 1.1 ast-grep-mcp (Structural Analysis)

**Purpose:** Find exact code structures (classes, methods, interfaces)

**Example Queries:**

```
- "Find class definition for UserController"
- "Find all methods in AuthenticationService"
- "Find interface IRepository implementations"
- "Find all uses of app.UseAuthentication()"
```

**What to Extract:**

- Class definitions and inheritance
- Method signatures and parameters
- Property definitions
- Dependency injection patterns
- Configuration usage

#### 1.2 semantic_search (Pattern Matching)

**Purpose:** Find similar code patterns elsewhere in the repo

**Example Queries:**

```
- "authentication implementation patterns"
- "database repository pattern examples"
- "API controller with validation"
- "service layer with dependency injection"
```

**What to Extract:**

- Similar implementations
- Naming conventions
- Code organization patterns
- Common architectural patterns

### Output: Section 1 of context.md

````markdown
## 1. Current Code Analysis (Internal)

### File: `backend/controllers/UserController.cs`

**Current Implementation:**

```csharp
public class UserController : ControllerBase
{
    private readonly IUserService _userService;
    // ... existing code
}
```
````

**Related Internal Patterns:**

- Similar pattern in `backend/controllers/AuthController.cs`
- Repository pattern used in `backend/repositories/UserRepository.cs`

```

## Step 2: Knowledge Graph Search & Analysis

### Objective
Search the knowledge graph for existing patterns, understand relationships, and decide if external research is needed.

### Tools: mcp_memory (search_nodes, open_nodes, read_graph)

**2.1 Primary Search**
```

search_nodes({
query: "XUnit setup for .NET 8"
})

```

**2.2 Relationship Analysis** (if patterns found)
```

const foundPattern = await open_nodes({ names: ["XUnit Setup for .NET 8"] });
const relatedPatterns = await search_nodes({
query: "patterns related to XUnit testing"
});

```

**2.3 Graph Analysis** (for comprehensive understanding)
```

const fullGraph = await read_graph();
const testingPatterns = fullGraph.nodes.filter(node =>
node.observations.some(obs => obs.includes("XUnit") || obs.includes("testing"))
);

```

**Query Strategy Examples:**
```

- "XUnit setup for .NET 8"
- "ASP.NET Core Identity configuration patterns"
- "Entity Framework Core repository pattern"
- "JWT authentication implementation"
- "patterns related to dependency injection"

````

### Decision Logic

**If Found (Cache Hit):**
- Populate Section 3 with cached knowledge and related patterns
- **Skip Step 3** (github_mcp) to save costs
- Mark as "Using cached knowledge from [date]"
- Include related patterns from graph traversal

**If Partial Results Found:**
- Use existing cached knowledge
- Proceed to Step 3 only for missing patterns
- Focus external research on gaps in knowledge graph

**If Not Found (Cache Miss):**
- Proceed to Step 3 (External Research)
- After Step 3, create comprehensive entities and relationships

### Knowledge Graph Enhancement

**When External Research is Required:**
After completing GitHub MCP research, enhance the knowledge graph:

```typescript
// 1. Create primary entity
await create_entities({
  entities: [{
    name: "XUnit Setup for .NET 8",
    entityType: "Testing Pattern",
    observations: [
      "Use IClassFixture for shared setup between tests",
      "Implement IAsyncLifetime for async test initialization",
      "Use CollectionFixtures for database integration tests"
    ]
  }]
});

// 2. Create relationships to existing patterns
await create_relations({
  relations: [
    { from: "XUnit Setup for .NET 8", to: "Entity Framework Core Testing", relationType: "used_with" },
    { from: "XUnit Setup for .NET 8", to: "Dependency Injection", relationType: "requires" }
  ]
});

// 3. Enhance existing entities
await add_observations({
  observations: [{
    entityName: "Testing Best Practices",
    contents: ["XUnit provides superior async testing support compared to MSTest"]
  }]
});
````

### Output: Section 3 of context.md

```markdown
## 3. Internal Knowledge Base (Memory Graph)

### Primary Cached Knowledge

- **Topic**: "XUnit Setup for .NET 8"
- **Entity Type**: Testing Pattern
- **Last Used**: 2024-01-15
- **Content**: [Previously saved best practices]

### Related Patterns from Knowledge Graph

- **Entity Framework Core Testing**: Often used with XUnit for database tests
- **Dependency Injection**: Required for test fixture setup
- **Clean Architecture**: Compatible pattern for test organization

**Note**: External research skipped (using cached knowledge + graph relationships)
```

## Step 3: External Research + Pattern Validation (Conditional)

### Objective

Find high-quality external examples and validate/adapt them to your codebase structure.

### Tools: github_mcp + ast-grep-mcp

**Only executed if Step 2 found no cached knowledge.**

### Enhanced Research Strategy

**Phase 1: External Discovery (github_mcp)**

**3.1 Repository Discovery**

```
search_repositories({
  query: "[Technology] [Pattern] language:C# stars:>1000",
  sort: "stars" or "updated",
  per_page: 5
})
```

**3.2 Pattern Finding**

```
search_code({
  query: "[Specific Pattern] language:C#",
  sort: "indexed",
  per_page: 10
})
```

**3.3 Complete Analysis**

```
get_file_contents({
  owner: "repo-owner",
  repo: "repo-name",
  path: "path/to/file.cs",
  ref: "main"
})
```

**Phase 2: Local Validation (ast-grep-mcp)**

**3.4 Pattern Testing**

```
test_match_code_rule({
  code: "[External pattern from GitHub]",
  yaml: "[Rule to test the pattern]"
})
```

**3.5 Local Pattern Discovery**

```
find_code({
  pattern: "[Similar local pattern]",
  language: "csharp",
  project_folder: "[target-folder]"
})
```

**3.6 Structural Analysis**

```
dump_syntax_tree({
  code: "[Local vs External pattern]",
  language: "csharp",
  format: "ast"
})
```

### Query Examples

**Repository Search:**

```
- "ASP.NET Core Clean Architecture language:C# stars:>1000"
- "Entity Framework Core repository pattern language:C# updated:>2023"
- "XUnit testing .NET 8 language:C# stars:>500"
```

**Code Search:**

```
- "IRepository interface implementation language:C#"
- "class UserService : IUserService language:C#"
- "IClassFixture Xunit setup language:C#"
```

### Enhanced Selection Criteria

**Repository Quality:**

1. High star count (>1000 preferred, >500 acceptable)
2. Recent activity (updated within last year)
3. Language specificity (C# for .NET projects)
4. Clear documentation and README
5. Production-ready code with tests
6. Matching technology stack (.NET version, frameworks)

**Pattern Quality:**

1. Syntax compatibility with your codebase
2. Following common coding conventions
3. Comprehensive implementation (not just snippets)
4. Includes error handling and validation
5. Well-documented and commented

### Enhanced Extraction Process

1. **Find top 3-5 quality repositories** using `search_repositories`
2. **Search for specific patterns** using `search_code`
3. **Download complete implementations** using `get_file_contents`
4. **Test patterns locally** using `test_match_code_rule`
5. **Find similar local patterns** using `find_code`
6. **Analyze structural differences** using `dump_syntax_tree`
7. **Adapt patterns to project standards**
8. **Document both original and adapted versions**
9. **Note source URLs and repository metadata**

### Enhanced Caching Strategy

**After finding and validating patterns:**

```
mcp_memory.store({
  topic: "XUnit Setup for .NET 8",
  content: {
    best_practices: [...],
    code_snippets: [...],
    adapted_patterns: [...],
    validation_results: [...],
    sources: [...]
  },
  metadata: {
    technology: "XUnit",
    language: "C#",
    version: ".NET 8",
    date: "2024-01-15",
    repositories_analyzed: 5,
    patterns_validated: true,
    adaptation_notes: "..."
  }
})
```

**This ensures:**

- Next similar task skips external research
- Both original and adapted patterns are cached
- Validation results are preserved
- Knowledge accumulates with quality assurance
- Cost savings on repeated patterns with maintained quality

### Output: Section 2 of context.md

````markdown
## 2. External Best Practices (GitHub)

### Best Practice Example 1: XUnit with .NET 8

**Source**: https://github.com/example/xunit-patterns
**Stars**: 2,500 | **Language**: C#

```csharp
// High-quality example code
```
````

**Key Takeaways:**

- Use IClassFixture for shared setup
- Implement IAsyncLifetime for async initialization
- Use Theory for parameterized tests

````

## Step 4: Planning & Dependencies

### Objective
Synthesize all gathered information into an actionable implementation plan.

### Process

#### 4.1 Analyze All Gathered Data
- Internal code patterns (Step 1)
- Cached or external best practices (Steps 2-3)
- Task requirements from tasklist

#### 4.2 Generate Implementation Plan

**Plan Structure:**
1. **Prerequisites**: What must exist first
2. **Implementation Steps**: Ordered, atomic actions
3. **Validation Steps**: How to verify success

**Each step should specify:**
- Exact file paths
- Specific methods/classes to modify
- Code patterns to follow (reference Sections 1-2)
- Commands to run

#### 4.3 Identify Dependencies

**Check for:**
- Other tasks that must complete first
- Files that must be created before this task
- Configuration that must be set up
- External services that must be available

### Output: Sections 4 & 5 of context.md

```markdown
## 4. Suggested Implementation Plan

1. [ ] Add package `XUnit` version `2.6.0` to `Tests.csproj`
2. [ ] Create test class `UserServiceTests.cs` following pattern from Section 1
3. [ ] Implement test methods using patterns from Section 2
4. [ ] Run tests: `dotnet test`

## 5. Dependencies

- [ ] **Task 1.2**: User model must be created first
- [ ] **File `IUserService.cs`**: Interface must exist
````

## Error Handling

### No Matches in Semantic Search

- **Action**: Mark as "No existing patterns found"
- **Result**: Rely more heavily on external best practices
- **Note**: This is expected for new features

### GitHub API Rate Limit

- **Action**: Use cached results if available
- **Fallback**: Provide generic guidance based on LLM knowledge
- **Note**: Log for retry later

### Memory DB Unavailable

- **Action**: Skip Step 2, proceed directly to Step 3
- **Note**: Cannot cache results this run

## Best Practices

1. **Always run all 4 steps** in sequence
2. **Cache aggressively** to build knowledge base
3. **Extract minimal code** (snippets, not full files)
4. **Document sources** for traceability
5. **Be specific** in implementation plans (file paths, line numbers)

## Performance Optimization

### First Run (Cold Start)

- All 4 steps execute
- External research required
- ~2-3 minutes per task

### Subsequent Runs (Warm Cache)

- Steps 1, 2, 4 only
- Skip external research
- ~30-60 seconds per task

**Cost Savings:** ~60-70% reduction in API calls after cache builds up
