# MTM Lesson Creator MCP Content Creation Rules

## Core Principle: Memory-Assisted Pedagogical Excellence

The MTM Lesson Creator must use MCP memory as the **knowledge foundation** for content creation, ensuring perfect consistency, high-quality mnemonics, and rigorous adherence to MTM principles through structured memory operations.

## MANDATORY MEMORY-INTEGRATED WORKFLOW

### 1. Pre-Creation Context Retrieval (ABSOLUTELY REQUIRED)

#### Step 1: Curriculum Context Extraction
```javascript
// ALWAYS start with curriculum index
const curriculumIndex = read_file("curriculum/index.md");
const targetLanguage = extractTargetLanguage(curriculumIndex);
const currentModule = extractCurrentModule(curriculumIndex);
const curriculumPath = extractCurriculumPath(curriculumIndex);
```

#### Step 2: Memory-Based Knowledge Retrieval
```javascript
// Retrieve complete existing knowledge base
const existingKnowledge = read_graph();

// Query specific layering context
const knownVocabulary = search_nodes({
  query: `completed vocabulary modules 1-${currentModule-1} ${targetLanguage}`
});

const knownGrammar = search_nodes({
  query: `mastered grammar structures modules 1-${currentModule-1} ${targetLanguage}`
});

const mnemonicPatterns = search_nodes({
  query: `mnemonic patterns for ${targetLanguage} vocabulary`
});
```

#### Step 3: Quality Standards Retrieval
```javascript
// Get established quality parameters
const qualityStandards = search_nodes({
  query: `quality standards for ${targetLanguage} lessons`
});

const pronunciationGuides = search_nodes({
  query: `pronunciation guides ${targetLanguage}`;
});
```

### 2. Mnemonic Creation and Management (CRITICAL PEDAGOGICAL REQUIREMENT)

#### High-Quality Mnemonic Standards (Memory-Enforced):
For every non-cognate vocabulary word, create mnemonics that meet these memory-stored standards:

##### Mnemonic Quality Criteria (from memory):
- **Concise**: Under 80-100 characters maximum
- **Sound-alike bridge**: Connect English pronunciation to target language
- **Visual association**: Create vivid, memorable mental images
- **Context relevance**: Connected to word meaning or usage
- **Cultural appropriateness**: Respects target language culture
- **Multi-sensory appeal**: Engages sound, sight, and meaning

#### Memory-Assisted Mnemonic Creation Process:
```javascript
// Step 1: Check for existing mnemonics
const existingMnemonics = search_nodes({
  query: `mnemonic for ${newWord} ${targetLanguage}`
});

// Step 2: Analyze successful patterns
const successfulPatterns = search_nodes({
  query: `successful mnemonics ${targetLanguage} similar pronunciation`
});

// Step 3: Create new mnemonic with pattern awareness
const newMnemonic = createMnemonic(newWord, successfulPatterns);

// Step 4: Store in memory for future reference
create_entities([{
  name: `${newWord}_${targetLanguage}_mnemonic`,
  entityType: "Mnemonic",
  observations: [
    `Word: ${newWord}`,
    `Pronunciation: ${pronunciation}`,
    `Mnemonic: ${newMnemonic}`,
    `Pattern used: ${patternType}`,
    `Cultural context: ${culturalContext}`,
    `Visual imagery: ${visualImagery}`,
    `Created: ${new Date().toISOString()}`
  ]
}]);
```

#### Mnemonic Conflict Prevention (Memory-Based):
```javascript
// Check for similar-sounding words to avoid confusion
const similarWords = search_nodes({
  query: `${targetLanguage} vocabulary similar pronunciation to ${newWord}`
});

// Ensure mnemonic uniqueness
if (similarWords.length > 0) {
  // Modify mnemonic to distinguish from similar words
  // Add specific differentiator to mnemonic
  // Store distinction in memory for future reference
}
```

### 3. Language Separation Enforcement (MEMORY-VALIDATED)

#### Pre-Creation Language Validation:
```javascript
// Verify target language context from memory
const languageContext = search_nodes({
  query: `curriculum language context ${curriculumPath}`
});

// Validate voice configurations from memory
const voiceConfigs = search_nodes({
  query: `voice configurations ${targetLanguage} TTS`
});

// Ensure correct character assignments
const characterAssignments = search_nodes({
  query: `character roles ${targetLanguage} MTM lessons`;
});
```

#### Dialogue Structure Validation (Memory-Assisted):
```javascript
// Query established dialogue patterns
const dialoguePatterns = search_nodes({
  query: `successful dialogue patterns ${targetLanguage} MTM`);

// Validate each dialogue line against memory-stored rules
dialogue.forEach(line => {
  const languageAssignment = validateLanguageAssignment(line, characterAssignments);
  const separationCompliance = validateSeparation(line, dialoguePatterns);

  if (!languageAssignment.valid || !separationCompliance.valid) {
    // Store error pattern in memory for system improvement
    create_entities([{
      name: `dialogue_error_${Date.now()}`,
      entityType: "ErrorPattern",
      observations: [
        `Type: Language separation violation`,
        `Content: ${JSON.stringify(line)}`,
        `Expected pattern: ${languageAssignment.expected}`,
        `Timestamp: ${new Date().toISOString()}`
      ]
    }]);
  }
});
```

### 4. Speech Rate and Pacing Management (MEMORY-OPTIMIZED)

#### Rate Configuration from Memory:
```javascript
// Retrieve established rate parameters
const rateStandards = search_nodes({
  query: `speech rate standards ${targetLanguage} MTM lessons`
});

// Apply memory-validated rates
const speechRates = {
  teacherEnglish: rateStandards.find(s => s.role === 'TeacherEnglish')?.rate || 1.0,
  targetTeacher: rateStandards.find(s => s.role === 'Teacher')?.rate || 0.9,
  students: rateStandards.find(s => s.role === 'Student')?.rate || 0.95
};
```

#### Pause Timing Optimization (Memory-Guided):
```javascript
// Get successful pause patterns
const pausePatterns = search_nodes({
  query: `effective pause timings ${targetLanguage} lessons`
});

// Apply proven pause durations
const optimizedPauses = {
  newConstruction: pausePatterns.newConstruction || 4000,
  familiarPattern: pausePatterns.familiarPattern || 3000,
  pronunciationMicro: pausePatterns.pronunciationMicro || 500,
  processingTime: pausePatterns.processingTime || 1000,
  confirmationTime: pausePatterns.confirmationTime || 2000
};
```

### 5. Content Quality Assurance (MEMORY-VALIDATED)

#### Pre-Completion Validation Checklist (Memory-Assisted):

##### A. Golden Rule Compliance (Memory-Based):
```javascript
// Verify only one new concept introduced
const newConcepts = identifyNewConcepts(dialogue, knownVocabulary, knownGrammar);

if (newConcepts.vocabulary.length > 0 && newConcepts.grammar.length > 0) {
  // VIOLATION: Both vocabulary and grammar new
  // Store violation pattern in memory
  create_entities([{
    name: `golden_rule_violation_${Date.now()}`,
    entityType: "RuleViolation",
    observations: [
      `Type: Multiple new concepts`,
      `New vocabulary: ${newConcepts.vocabulary.join(', ')}`,
      `New grammar: ${newConcepts.grammar.join(', ')}`,
      `Module: ${currentModule}`,
      `Timestamp: ${new Date().toISOString()}`
    ]
  }]);

  // FORBIDDEN: Cannot complete with violation
  throw new Error("Golden Rule violation detected");
}
```

##### B. Mnemonic Quality Validation (Memory-Standards):
```javascript
// Verify mnemonic quality against stored standards
const mnemonicQuality = validateMnemonics(dialogue, mnemonicPatterns);

if (!mnemonicQuality.meetsStandards) {
  // Store quality issues for improvement
  create_entities([{
    name: `mnemonic_quality_issue_${Date.now()}`,
    entityType: "QualityIssue",
    observations: [
      `Type: Mnemonic below standard`,
      `Issues: ${mnemonicQuality.issues.join(', ')}`,
      `Expected standards: ${qualityStandards.mnemonic.join(', ')}`,
      `Timestamp: ${new Date().toISOString()}`
    ]
  }]);
}
```

##### C. Conversation Length Optimization (Memory-Guided):
```javascript
// Analyze against successful lesson patterns
const lessonMetrics = calculateLessonMetrics(dialogue);
const successfulPatterns = search_nodes({
  query: `successful lesson length patterns ${targetLanguage}`
});

const optimalLength = successfulPatterns.optimalDuration || 7; // minutes
const currentLength = lessonMetrics.estimatedDuration;

if (Math.abs(currentLength - optimalLength) > 2) {
  // Adjust content based on memory-stored patterns
  const adjustments = generateContentAdjustments(currentLength, optimalLength, successfulPatterns);
  applyAdjustments(dialogue, adjustments);
}
```

### 6. Knowledge Storage and Contribution (MANDATORY)

#### Post-Creation Knowledge Addition:
```javascript
// Store new vocabulary entities
newVocabulary.forEach(word => {
  create_entities([{
    name: `${word.word}_${targetLanguage}_vocabulary`,
    entityType: "Vocabulary",
    observations: [
      `Word: ${word.word}`,
      `Pronunciation: ${word.pronunciation}`,
      `Meaning: ${word.meaning}`,
      `Mnemonic: ${word.mnemonic}`,
      `Introduced: Module ${currentModule}`,
      `Lesson: ${lessonNumber}`,
      `Examples: ${word.examples.join(', ')}`,
      `Cultural notes: ${word.culturalNotes}`,
      `Audio ready: ${word.audioReady || 'pending'}`
    ]
  }]);

  // Link to mnemonic entity
  create_relations([{
    from: `${word.word}_${targetLanguage}_vocabulary`,
    to: `${word.word}_${targetLanguage}_mnemonic`,
    relationType: "has_mnemonic"
  }]);
});

// Store lesson success patterns
create_entities([{
  name: `successful_lesson_${curriculumPath}_Module${currentModule}_${lessonNumber}`,
  entityType: "LessonPattern",
  observations: [
    `Duration: ${lessonMetrics.estimatedDuration} minutes`,
    `Dialogue lines: ${dialogue.length}`,
    `New vocabulary: ${newVocabulary.length} words`,
    `New grammar: ${newGrammar.length} concepts`,
    `Student prompts: ${studentPromptCount}`,
    `Success factors: ${lessonMetrics.successFactors}`,
    `Created: ${new Date().toISOString()}`
  ]
}]);
```

### 7. Continuous Improvement (MEMORY-DRIVEN)

#### Success Pattern Storage:
```javascript
// Analyze and store successful elements
const successFactors = analyzeSuccessFactors(dialogue, studentResponsePatterns);

create_relations([{
  from: `successful_lesson_${curriculumPath}_Module${currentModule}_${lessonNumber}`,
  to: extractKeySuccessPatterns(successFactors),
  relationType: "demonstrates"
}]);

// Store improvement insights
if (lessonMetrics.improvementOpportunities.length > 0) {
  create_entities([{
    name: `improvement_insight_${Date.now()}`,
    entityType: "ImprovementOpportunity",
    observations: [
      `Context: ${curriculumPath} Module${currentModule} Lesson${lessonNumber}`,
      `Opportunities: ${lessonMetrics.improvementOpportunities.join(', ')}`,
      `Suggested improvements: ${generateImprovementSuggestions(lessonMetrics)}`,
      `Timestamp: ${new Date().toISOString()}`
    ]
  }]);
}
```

## CRITICAL MEMORY USAGE RULES

### Required MCP Operations (FOR EACH LESSON):

1. **Pre-Creation Context Query**
   ```javascript
   search_nodes({ query: "known vocabulary [modules]" });
   search_nodes({ query: "known grammar [modules]" });
   search_nodes({ query: "mnemonic patterns [language]" });
   ```

2. **Quality Standards Retrieval**
   ```javascript
   search_nodes({ query: "quality standards [language]" });
   search_nodes({ query: "speech rate patterns [language]" });
   search_nodes({ query: "successful dialogue patterns [language]" });
   ```

3. **Mnemonic Creation and Storage**
   ```javascript
   // Check existing mnemonics
   // Create new mnemonic entities
   // Establish mnemonic relationships
   ```

4. **Validation Against Memory**
   ```javascript
   // Golden Rule compliance check
   // Mnemonic quality validation
   // Dialogue structure verification
   ```

5. **Post-Creation Knowledge Storage**
   ```javascript
   create_entities(newVocabulary);
   create_relations(newRelationships);
   add_observations(successMetrics);
   ```

### Forbidden Patterns (NEVER DO THESE):

- ❌ Create lessons without querying existing knowledge
- ❌ Generate mnemonics without checking for conflicts
- ❌ Skip language separation validation
- ❌ Ignore Golden Rule verification
- ❌ Create content inconsistent with stored patterns
- ❌ Complete lesson without storing new knowledge in memory

## Performance Optimization

### Efficient Query Patterns:
```javascript
// GOOD: Targeted queries for specific information
search_nodes({ query: `vocabulary Module01-03 ${targetLanguage}` });

// BAD: Reading entire graph for single pieces of information

// GOOD: Batch entity creation
create_entities([...allNewVocabulary]);

// BAD: Individual operations for each vocabulary word
```

### Caching Strategy:
- Cache retrieved vocabulary and grammar data within lesson creation session
- Reuse mnemonic pattern data across multiple lessons in same module
- Store intermediate validation results for efficiency

## Integration Checklist (MANDATORY COMPLETION)

Before signaling `attempt_completion` for any lesson creation task:

- [ ] **Curriculum context retrieved** from index and memory
- [ ] **Existing knowledge queried** and analyzed for layering
- [ ] **Quality standards retrieved** from memory
- [ ] **Golden Rule verified** through memory comparison
- [ ] **High-quality mnemonics created** and stored in memory
- [ ] **Language separation validated** against memory patterns
- [ ] **Speech rates optimized** using memory-stored standards
- [ ] **Conversation length optimized** based on successful patterns
- [ ] **New vocabulary stored** as memory entities
- [ ] **Relationships established** between concepts
- [ ] **Success patterns stored** for future reference
- [ ] **Improvement insights recorded** for system learning

**FORBIDDEN TO COMPLETE IF ANY MEMORY STEP MISSED**

## Success Metrics

The memory-integrated lesson creator should achieve:

- **Perfect Golden Rule compliance** through memory-based verification
- **Consistently high-quality mnemonics** through pattern learning
- **Optimal conversation length** through successful pattern analysis
- **Perfect language separation** through memory-validated rules
- **Continuous quality improvement** through success pattern storage
- **Zero mnemonic conflicts** through memory-based conflict detection
- **Rapid context switching** through efficient memory queries