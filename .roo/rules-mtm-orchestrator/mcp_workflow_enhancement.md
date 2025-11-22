# MTM Orchestrator MCP Workflow Enhancement

## Core Principle: Memory-Augmented Orchestration

The MTM Orchestrator must use MCP memory as the **primary intelligence layer** for decision-making, context retrieval, and quality assurance. Memory queries replace slow file parsing and provide instant access to structured curriculum knowledge.

## MANDATORY MCP Integration Points

### 1. Pre-Work Context Retrieval (ABSOLUTELY REQUIRED)

#### Step 1: Curriculum Index Reading (File-Based Truth)
```
ALWAYS: read_file("curriculum/index.md") FIRST
```

#### Step 2: Memory Graph Context Retrieval (MCP Memory)
```
MANDATORY: Use read_graph() to retrieve complete knowledge state
```

#### Step 3: Cross-Reference Validation (Critical Error Prevention)
```
VALIDATE: Compare index progress with memory graph data
RESOLVE: Any discrepancies before proceeding
```

### 2. Golden Rule Enforcement via Memory (CRITICAL WORKFLOW)

#### Before ANY Lesson Delegation:
```javascript
// Query existing vocabulary knowledge
search_nodes({
  query: "vocabulary taught in modules 1-[current_module-1] [target_language]"
})

// Query existing grammar structures
search_nodes({
  query: "grammar structures taught in modules 1-[current_module-1] [target_language]"
})

// Analyze new lesson requirements
// If both new vocabulary AND new grammar detected:
// -> SPLIT into separate subtasks
// -> Each subtask must have only ONE new concept
```

#### Memory-Based Decision Matrix:
| Existing Knowledge | New Content Requested | Action Required |
|-------------------|----------------------|-----------------|
| Vocabulary Known + Grammar Known | Both New | ❌ **SPLIT TASK** |
| Vocabulary Known + Grammar New | Grammar Only | ✅ **PROCEED** |
| Vocabulary New + Grammar Known | Vocabulary Only | ✅ **PROCEED** |
| Both New | Single Concept | ✅ **PROCEED** |

### 3. Structured Delegation Enhancement (MEMORY-ENRICHED)

#### Standard Delegation Template with Memory Data:
```javascript
// Before delegation, query memory for context
const knownVocabulary = search_nodes({
  query: `completed vocabulary modules 1-${module-1} ${targetLanguage}`
});

const knownGrammar = search_nodes({
  query: `mastered grammar structures modules 1-${module-1} ${targetLanguage}`
});

const mnemonicPatterns = search_nodes({
  query: `mnemonic patterns for ${targetLanguage} vocabulary`
});

// Enrich delegation message
const delegationMessage = `
Create ${lessonCount} lessons for Module ${moduleNumber}: ${moduleTitle}

MEMORY CONTEXT PROVIDED:
- Known Vocabulary: ${knownVocabulary.length} words
- Known Grammar: ${knownGrammar.length} structures
- Mnemonic Patterns: ${mnemonicPatterns.length} established patterns

LAYERING REQUIREMENTS:
- Must layer: [list from memory]
- Must reinforce: [structures from memory]
- Must avoid: [completed concepts from memory]

TARGET LANGUAGE: ${targetLanguage} (extracted from curriculum path)
CURRICULUM PATH: ${exactPathFromIndex}
`;
```

### 4. Progress Tracking and Memory Updates (MANDATORY)

#### After Each Module Completion:
```javascript
// Store module completion entity
create_entities([{
  name: `Module${moduleNumber}_${curriculumPath}`,
  entityType: "Module",
  observations: [
    `Completed on ${new Date().toISOString()}`,
    `Lessons created: ${lessonCount}`,
    `Target language: ${targetLanguage}`,
    `Golden rule compliance: Verified`,
    `Quality validation: Passed`
  ]
}]);

// Link to curriculum entity
create_relations([{
  from: `Module${moduleNumber}_${curriculumPath}`,
  to: curriculumPath.replace(/\//g, "_"),
  relationType: "part_of"
}]);

// Store vocabulary introduced
newVocabulary.forEach(word => {
  create_entities([{
    name: `${word}_${targetLanguage}_vocabulary`,
    entityType: "Vocabulary",
    observations: [
      `Introduced in Module ${moduleNumber}`,
      `Pronunciation: ${pronunciation}`,
      `Meaning: ${meaning}`,
      `Mnemonic: ${mnemonic}`,
      `Examples: ${examples}`
    ]
  }]);
});
```

### 5. Scenario-Based Module Creation (MCP-POWERED)

#### Enhanced Workflow for Modules 11+:
```javascript
// Step 1: Retrieve comprehensive foundation knowledge
const foundationKnowledge = read_graph();

// Step 2: Query specific layering context
const layeringContext = search_nodes({
  query: "vocabulary and grammar suitable for [scenario] scenarios"
});

// Step 3: Analyze target sentences for reverse engineering
const targetSentenceAnalysis = targetSentences.map(sentence => ({
  sentence,
  requiredVocabulary: extractVocabulary(sentence, foundationKnowledge),
  requiredGrammar: extractGrammar(sentence, foundationKnowledge),
  complexity: assessComplexity(sentence)
}));

// Step 4: Validate Golden Rule compliance before delegation
// Ensure each lesson introduces only ONE new concept
// Use memory to verify no concept duplication

// Step 5: Create memory-enriched delegation
// Include all context from steps 1-4 in delegation message
```

### 6. Error Prevention and Recovery (MEMORY-ASSISTED)

#### Cross-Reference Validation Rules:
```javascript
// ALWAYS validate memory data against file system
const indexProgress = read_file("curriculum/index.md");
const memoryProgress = search_nodes({
  query: "module completion status [curriculum_path]"
});

// DISCREPANCY HANDLING:
if (indexProgress !== memoryProgress) {
  // 1. Identify specific discrepancies
  // 2. Determine authoritative source (usually index file)
  // 3. Update memory to match file-based truth
  // 4. Log discrepancy for system improvement
}
```

#### Skip Prevention Logic:
```javascript
// ALWAYS verify sequential module completion
const currentModule = extractNextModule(indexFile);
const completedModules = search_nodes({
  query: `completed modules before ${currentModule} [curriculum_path]`
});

// VERIFY: No modules skipped
const expectedSequence = generateExpectedSequence(currentModule);
const actualSequence = completedModules.map(m => extractModuleNumber(m.name));

if (!arraysMatch(expectedSequence, actualSequence)) {
  // IDENTIFY missing modules
  // PREVENT proceeding to advanced modules
  // REQUIRE completion of missing modules first
}
```

## CRITICAL MCP Usage Rules

### Required MCP Operations (FOR EACH TASK):

1. **Pre-Task Context Retrieval**
   ```javascript
   read_graph(); // Get complete knowledge state
   search_nodes({ query: "relevant context" }); // Get specific data
   ```

2. **Golden Rule Verification**
   ```javascript
   search_nodes({ query: "existing vocabulary" });
   search_nodes({ query: "existing grammar" });
   // Analyze and split tasks if necessary
   ```

3. **Post-Task Knowledge Storage**
   ```javascript
   create_entities(newKnowledge);
   create_relations(newRelationships);
   add_observersations(newMetadata);
   ```

### Forbidden Patterns (NEVER DO THESE):

- ❌ Delegate lesson creation without memory context
- ❌ Skip cross-reference validation between memory and files
- ❌ Allow Golden Rule violations without memory-based checking
- ❌ Proceed with module sequencing without memory verification
- ❌ Create duplicate entities without searching existing ones

## Performance Optimization Patterns

### Efficient Query Strategies:
```javascript
// GOOD: Specific targeted queries
search_nodes({ query: "vocabulary Module01-03 korean" });

// BAD: Reading entire graph for small pieces of information
read_graph(); // Only when complete context needed

// GOOD: Batch operations
create_entities([...manyEntities]);
create_relations([...manyRelations]);

// BAD: Individual operations in loops
// (creates excessive MCP calls)
```

### Caching Strategy:
- Cache frequently accessed module data in working memory
- Reuse query results within single task session
- Store intermediate results for complex multi-step operations

## Integration Checklist (MANDATORY COMPLETION)

Before signaling `attempt_completion` for any orchestrator task:

- [ ] **Curriculum index read** and path extracted
- [ ] **Memory graph queried** for relevant context
- [ ] **Cross-reference validation** completed and resolved
- [ ] **Golden Rule verified** using memory data
- [ ] **Delegations enriched** with memory context
- [ ] **New knowledge stored** in appropriate entities
- [ ] **Progress updated** in memory tracking
- [ ] **Relationships created** between related concepts
- [ ] **Quality validation** completed using memory data
- [ ] **Consistency verified** across memory and file system

**FORBIDDEN TO COMPLETE IF ANY MCP STEP MISSED**

## Success Metrics

The MCP-integrated orchestrator should achieve:

- **100% Golden Rule compliance** through memory-based verification
- **Zero module skipping** through cross-reference validation
- **Perfect vocabulary layering** through structured context retrieval
- **Consistent quality standards** through memory-stored patterns
- **Rapid context switching** through efficient memory queries
- **Complete progress tracking** through persistent memory updates