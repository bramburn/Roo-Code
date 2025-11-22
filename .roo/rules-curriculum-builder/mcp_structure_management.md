# Curriculum Builder MCP Structure Management Rules

## Core Principle: Memory-Augmented Structural Excellence

The Curriculum Builder must use MCP memory as the **structural intelligence layer** for creating consistent, scalable, and well-organized curriculum architectures that align with proven successful patterns.

## MANDATORY MEMORY-INTEGRATED WORKFLOW

### 1. Pre-Creation Pattern Analysis (ABSOLUTELY REQUIRED)

#### Step 1: Curriculum Context Validation
```javascript
// ALWAYS verify curriculum context from index file
const curriculumIndex = read_file("curriculum/index.md");
const targetLanguage = extractTargetLanguage(curriculumIndex);
const curriculumPath = extractCurriculumPath(curriculumIndex);
const moduleCount = extractModuleCount(curriculumIndex);
```

#### Step 2: Memory-Based Pattern Retrieval
```javascript
// Query successful curriculum structures
const successfulStructures = search_nodes({
  query: `successful curriculum structures ${targetLanguage} MTM`
});

// Query module progression patterns
const modulePatterns = search_nodes({
  query: `effective module progression sequences ${targetLanguage}`
});

// Query naming conventions
const namingStandards = search_nodes({
  query: `curriculum naming conventions ${targetLanguage}`);
});
```

#### Step 3: Cross-Reference Validation
```javascript
// Validate against existing memory structures
const existingCurricula = search_nodes({
  query: "existing curriculum paths and structures"
});

// Ensure no path conflicts or duplications
const pathValidation = validateCurriculumPath(curriculumPath, existingCurricula);
if (!pathValidation.valid) {
  // Store conflict pattern and resolve before proceeding
  create_entities([{
    name: `path_conflict_${Date.now()}`,
    entityType: "StructuralConflict",
    observations: [
      `Type: Curriculum path conflict`,
      `Requested path: ${curriculumPath}`,
      `Conflicting paths: ${pathValidation.conflicts.join(', ')}`,
      `Resolution required: ${pathValidation.resolution}`,
      `Timestamp: ${new Date().toISOString()}`
    ]
  }]);
}
```

### 2. Structure Creation with Memory Patterns (ENHANCED QUALITY)

#### Module Structure Design (Memory-Guided):
```javascript
// Analyze successful module sequences
const moduleSequence = analyzeModuleSequence(moduleCount, modulePatterns);

// Create memory-informed module structure
const moduleStructure = {
  foundation: generateFoundationModules(targetLanguage, successfulStructures),
  expansion: generateExpansionModules(targetLanguage, successfulStructures),
  application: generateApplicationModules(targetLanguage, successfulStructures)
};

// Store structure design for future reference
create_entities([{
  name: `${curriculumPath}_structure_design`,
  entityType: "CurriculumStructure",
  observations: [
    `Target language: ${targetLanguage}`,
    `Total modules: ${moduleCount}`,
    `Foundation modules: ${moduleStructure.foundation.length}`,
    `Expansion modules: ${moduleStructure.expansion.length}`,
    `Application modules: ${moduleStructure.application.length}`,
    `Design patterns used: ${moduleSequence.patterns.join(', ')}`,
    `Created: ${new Date().toISOString()}`
  ]
}]);
```

#### Directory Naming Convention Enforcement (Memory-Validated):
```javascript
// Apply naming standards from memory
const namingRules = namingStandards[0]?.observations || [];

const moduleNames = moduleStructure.foundation.map((module, index) => {
  const moduleNumber = String(index + 1).padStart(2, '0');
  const moduleName = applyNamingConvention(module.title, namingRules);

  // Store naming decision for consistency
  create_entities([{
    name: `${curriculumPath}_module_${moduleNumber}_naming`,
    entityType: "NamingDecision",
    observations: [
      `Module number: ${moduleNumber}`,
      `Original title: ${module.title}`,
      `Formatted name: ${moduleName}`,
      `Convention applied: ${module.convention}`,
      `Timestamp: ${new Date().toISOString()}`
    ]
  }]);

  return `${moduleNumber}-${moduleName}`;
});
```

### 3. README Content Generation (MEMORY-ENHANCED)

#### Content Template Retrieval:
```javascript
// Get successful README templates
const readmeTemplates = search_nodes({
  query: `effective README templates ${targetLanguage} curriculum`
});

// Query MTM philosophy content patterns
const mtmPhilosophy = search_nodes({
  query: "MTM philosophy explanations and descriptions"
});

// Get target audience descriptions
const audiencePatterns = search_nodes({
  query: `target audience descriptions ${targetLanguage} language learning`
});
```

#### Memory-Enhanced README Generation:
```javascript
// Generate curriculum README with proven patterns
const curriculumREADME = generateCurriculumREADME({
  targetLanguage,
  moduleStructure,
  successfulPatterns: readmeTemplates,
  mtmContent: mtmPhilosophy,
  audienceInsights: audiencePatterns
});

// Store README success pattern
create_entities([{
  name: `${curriculumPath}_README_pattern`,
  entityType: "DocumentPattern",
  observations: [
    `Type: Curriculum README`,
    `Target language: ${targetLanguage}`,
    `Template used: ${curriculumREADME.templateSource}`,
    `MTM philosophy integrated: ${curriculumREADME.mtmIntegrated}`,
    `Audience section optimized: ${curriculumREADME.audienceOptimized}`,
    `Word count: ${curriculumREADME.wordCount}`,
    `Created: ${new Date().toISOString()}`
  ]
}]);
```

#### Module README Optimization:
```javascript
// Generate module-specific READMEs with memory patterns
moduleStructure.foundation.forEach((module, index) => {
  const moduleREADME = generateModuleREADME({
    moduleNumber: index + 1,
    moduleData: module,
    targetLanguage,
    lessonPatterns: search_nodes({
      query: `effective lesson progressions ${module.focus} ${targetLanguage}`
    }),
    objectivesPatterns: search_nodes({
      query: `learning objective formulations ${targetLanguage}`
    })
  });

  // Store module README success factors
  create_entities([{
    name: `${curriculumPath}_module_${index + 1}_README_pattern`,
    entityType: "DocumentPattern",
    observations: [
      `Module: ${index + 1}`,
      `Focus area: ${module.focus}`,
      `Lesson count: ${module.lessonCount}`,
      `Objectives quality: ${moduleREADME.objectivesScore}`,
      `Table completeness: ${moduleREADME.tableComplete}`,
      `MTM alignment: ${moduleREADME.mtmAlignment}`,
      `Created: ${new Date().toISOString()}`
    ]
  }]);
});
```

### 4. Quality Assurance and Validation (MEMORY-DRIVEN)

#### Structure Quality Validation:
```javascript
// Validate against successful curriculum structures
const qualityMetrics = validateCurriculumStructure({
  created: moduleStructure,
  patterns: successfulStructures,
  standards: search_nodes({
    query: "curriculum quality standards MTM"
  })
});

// Store quality assessment
if (qualityMetrics.score < 0.9) {
  // Store quality issues for improvement
  create_entities([{
    name: `${curriculumPath}_quality_issues_${Date.now()}`,
    entityType: "QualityIssue",
    observations: [
      `Type: Structure quality below threshold`,
      `Score: ${qualityMetrics.score}`,
      `Issues: ${qualityMetrics.issues.join(', ')}`,
      `Recommended improvements: ${qualityMetrics.recommendations.join(', ')}`,
      `Timestamp: ${new Date().toISOString()}`
    ]
  }]);

  // Apply improvements before completion
  applyImprovements(moduleStructure, qualityMetrics.recommendations);
}
```

#### MTM Compliance Verification:
```javascript
// Verify MTM principle integration
const mtmCompliance = validateMTMCompliance({
  structure: moduleStructure,
  readmeContent: curriculumREADME,
  mtmRules: search_nodes({
    query: "MTM core principles and requirements"
  })
});

// Store compliance assessment
create_entities([{
  name: `${curriculumPath}_MTM_compliance`,
  entityType: "ComplianceAssessment",
  observations: [
    `Overall compliance: ${mtmCompliance.percentage}%`,
    `Teacher responsibility: ${mtmCompliance.teacherResponsibility ? 'Yes' : 'No'}`,
    `Understanding over memorization: ${mtmCompliance.understandingFocus ? 'Yes' : 'No'}`,
    `Stress-free environment: ${mtmCompliance.stressFree ? 'Yes' : 'No'}`,
    `Ladder of success: ${mtmCompliance.ladderOfSuccess ? 'Yes' : 'No'}`,
    `Missing elements: ${mtmCompliance.missingElements.join(', ')}`,
    `Timestamp: ${new Date().toISOString()}`
  ]
}]);
```

### 5. Template Creation and Storage (ENHANCING FUTURE WORK)

#### Successful Pattern Extraction:
```javascript
// Extract reusable patterns from created structure
const extractedPatterns = extractSuccessfulPatterns({
  structure: moduleStructure,
  documents: [curriculumREADME, ...moduleREADMEs],
  qualityScore: qualityMetrics.score,
  mtmCompliance: mtmCompliance.percentage
});

// Store patterns for future curriculum creation
extractedPatterns.forEach(pattern => {
  create_entities([{
    name: `successful_pattern_${pattern.type}_${Date.now()}`,
    entityType: "ReusablePattern",
    observations: [
      `Pattern type: ${pattern.type}`,
      `Target language: ${targetLanguage}`,
      `Success factors: ${pattern.successFactors.join(', ')}`,
      `Applicable contexts: ${pattern.contexts.join(', ')}`,
      `Quality score: ${pattern.qualityScore}`,
      `MTM compliance: ${pattern.mtmCompliance}%`,
      `Usage count: 1`,
      `Timestamp: ${new Date().toISOString()}`
    ]
  }]);
});
```

#### Template Categorization:
```javascript
// Categorize patterns for easy retrieval
const categorizedPatterns = categorizePatterns(extractedPatterns);

categorizedPatterns.forEach(category => {
  create_relations([{
    from: category.patterns.map(p => p.name),
    to: `curriculum_template_category_${category.name}`,
    relationType: "belongs_to"
  }]);

  create_entities([{
    name: `curriculum_template_category_${category.name}`,
    entityType: "PatternCategory",
    observations: [
      `Category: ${category.name}`,
      `Pattern count: ${category.patterns.length}`,
      `Average quality score: ${category.averageScore}`,
      `Best for: ${category.bestContexts.join(', ')}`,
      `Timestamp: ${new Date().toISOString()}`
    ]
  }]);
});
```

### 6. Progress Tracking and Knowledge Contribution (MANDATORY)

#### Structure Completion Storage:
```javascript
// Store completed curriculum structure
create_entities([{
  name: `${curriculumPath}_completed_structure`,
  entityType: "CompletedCurriculum",
  observations: [
    `Target language: ${targetLanguage}`,
    `Module count: ${moduleStructure.totalModules}`,
    `Estimated lesson count: ${moduleStructure.totalLessons}`,
    `Structure score: ${qualityMetrics.score}`,
    `MTM compliance: ${mtmCompliance.percentage}%`,
    `Completion date: ${new Date().toISOString()}`,
    `Created by: curriculum-builder with MCP assistance`
  ]
}]);

// Link to template patterns used
const patternUsage = trackPatternUsage(extractedPatterns);
patternUsage.forEach(usage => {
  create_relations([{
    from: `${curriculumPath}_completed_structure`,
    to: usage.patternName,
    relationType: "used_pattern"
  }]);

  // Update pattern usage count
  add_observations([{
    entityName: usage.patternName,
    contents: [`Usage count incremented to: ${usage.newCount}`]
  }]);
});
```

## CRITICAL MEMORY USAGE RULES

### Required MCP Operations (FOR EACH STRUCTURE CREATION):

1. **Pre-Creation Pattern Query**
   ```javascript
   search_nodes({ query: "successful curriculum structures [language]" });
   search_nodes({ query: "effective module progression patterns [language]" });
   search_nodes({ query: "curriculum naming conventions [language]" });
   ```

2. **Quality Standards Retrieval**
   ```javascript
   search_nodes({ query: "curriculum quality standards MTM" });
   search_nodes({ query: "effective README templates [language]" });
   search_nodes({ query: "MTM philosophy explanations" });
   ```

3. **Path Validation**
   ```javascript
   search_nodes({ query: "existing curriculum paths and structures" });
   // Validate no conflicts or duplications
   ```

4. **Pattern Application and Storage**
   ```javascript
   // Apply successful patterns
   // Store new successful patterns
   // Create reusable templates
   ```

5. **Quality and Compliance Validation**
   ```javascript
   // Validate structure quality
   // Verify MTM compliance
   // Store assessment results
   ```

### Forbidden Patterns (NEVER DO THESE):

- ❌ Create curriculum structures without querying successful patterns
- ❌ Ignore naming conventions stored in memory
- ❌ Skip path conflict validation
- ❌ Create content inconsistent with MTM principles in memory
- ❌ Complete structure without storing successful patterns
- ❌ Fail to validate quality against memory standards

## Performance Optimization

### Efficient Pattern Retrieval:
```javascript
// GOOD: Specific pattern queries
search_nodes({ query: `foundation module patterns ${targetLanguage}` });

// BAD: Reading entire graph for pattern information

// GOOD: Batch entity creation for patterns
create_entities([...allNewPatterns]);

// BAD: Individual pattern operations
```

### Template Caching:
- Cache frequently used naming conventions
- Store successful module sequences for rapid reuse
- Maintain quality threshold patterns for quick validation

## Integration Checklist (MANDATORY COMPLETION)

Before signaling `attempt_completion` for any curriculum structure creation:

- [ ] **Curriculum context validated** from index and memory
- [ ] **Successful patterns queried** and applied
- [ ] **Naming conventions enforced** from memory standards
- [ ] **Path conflicts resolved** through memory validation
- [ ] **Quality standards applied** from memory patterns
- [ ] **MTM compliance verified** against stored principles
- [ ] **README templates optimized** using successful patterns
- [ ] **New successful patterns stored** for future reuse
- [ ] **Template categories created** for easy retrieval
- [ ] **Quality metrics stored** for continuous improvement
- [ ] **Pattern usage tracked** for system learning

**FORBIDDEN TO COMPLETE IF ANY MEMORY STEP MISSED**

## Success Metrics

The memory-integrated curriculum builder should achieve:

- **Consistent high-quality structures** through pattern application
- **Perfect naming convention compliance** through memory enforcement
- **Zero path conflicts** through validation against stored structures
- **High MTM compliance** through principle-aligned templates
- **Continuous improvement** through success pattern storage
- **Rapid template creation** through categorized pattern retrieval
- **Scalable architecture** through reusable pattern library