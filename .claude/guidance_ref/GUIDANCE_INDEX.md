# Guidance Documentation Index

## 📋 Quick Navigation

### For Lesson Generation

1. **[MANDARIN_LESSON_QUICK_REFERENCE.md](MANDARIN_LESSON_QUICK_REFERENCE.md)** ⭐ START HERE
   - Quick reference for generating Mandarin-to-English lessons
   - Copy-paste ready templates
   - Common errors and fixes
   - Pre-deployment checklist
   - **Best for**: Quick lookups while generating lessons

2. **[LESSON_GENERATION_WORKFLOW.md](LESSON_GENERATION_WORKFLOW.md)** 📝 STEP-BY-STEP
   - Complete 8-step workflow from planning to deployment
   - Template JSON structure
   - Validation process with examples
   - Common error fixes
   - **Best for**: Following a complete process from start to finish

3. **[LLM_lesson_guidance.md](LLM_lesson_guidance.md)** 📚 COMPREHENSIVE
   - Complete guidance for MTM lesson creation
   - Core MTM principles
   - JSON structure requirements
   - Character definitions
   - Language separation rules
   - Dialogue patterns
   - Validation and quality assurance
   - **Best for**: Deep understanding of MTM methodology

### For Validation

4. **[GUIDANCE_UPDATES_SUMMARY.md](GUIDANCE_UPDATES_SUMMARY.md)** 📊 WHAT CHANGED
   - Summary of all guidance updates
   - Key improvements made
   - How to use the updated guides
   - Validation commands reference
   - **Best for**: Understanding what was updated and why

5. **[GUIDANCE_UPDATE_COMPLETE.txt](GUIDANCE_UPDATE_COMPLETE.txt)** ✅ COMPLETE SUMMARY
   - Complete summary of all changes
   - Validation commands
   - Expected output
   - Character names reference
   - Critical rules checklist
   - **Best for**: Quick reference of all requirements

## 🎯 Use Cases

### "I need to generate a lesson quickly"
→ Use **MANDARIN_LESSON_QUICK_REFERENCE.md**

### "I want to understand the complete process"
→ Use **LESSON_GENERATION_WORKFLOW.md**

### "I need comprehensive guidance on MTM methodology"
→ Use **LLM_lesson_guidance.md**

### "I want to know what changed in the guidance"
→ Use **GUIDANCE_UPDATES_SUMMARY.md**

### "I need a quick checklist of all requirements"
→ Use **GUIDANCE_UPDATE_COMPLETE.txt**

## ⚠️ Critical Requirements

### Validation Script (REQUIRED)
```bash
cd cli/MichelThomas.TtsGenerator
dotnet run validate-script ../../samples/hsk1_new/m13.json
```

Expected: `✓ Script validation passed! No issues found.`

### Character Names (EXACT)
- Instructor (English speaker)
- Student 1 (Mandarin speaker)
- Student 2 (Mandarin speaker)
- Listener (pauses only)

### Critical Rules
✅ Instructor speaks ONLY English
✅ Student 1 & 2 speak ONLY Mandarin
✅ NO mixed language in single lines
✅ Use ASCII punctuation: `,` `.` `!` `?`
✅ NO inline language tags `[lang=...]`
✅ Adequate pause times (4000ms+ for complex questions)
✅ Both Student 1 and Student 2 must have dialogue

## 📖 Validation Rules Reference

| Rule | Name | Severity |
|------|------|----------|
| MTM-001 | Script Structure | Error |
| MTM-002 | Student 1 Usage | Error |
| MTM-003 | Student 2 Usage | Error |
| MTM-004 | Character Configuration | Error |
| MTM-005 | Pause Timing | Error |
| MTM-006 | Line Length | Warning |
| MTM-007 | Rate Settings | Error |
| MTM-008 | Bilingual Separation | Error ⚠️ CRITICAL |
| MTM-009 | Unicode Punctuation | Info |
| MTM-010 | Inline Language Tags | Error ⚠️ CRITICAL |
| MTM-011 | Vocabulary Timing | Warning |

## ✅ Lessons 13-20 Status

All lessons have been generated and validated:
- ✓ m13.json - Days of the Week
- ✓ m14.json - Family Members
- ✓ m15.json - Common Locations
- ✓ m16.json - Transportation
- ✓ m17.json - Basic Adjectives
- ✓ m18.json - Question Words
- ✓ m19.json - Conjunctions and Contrast
- ✓ m20.json - Past Actions with le

All lessons pass validation with 0 errors.

## 🚀 Next Steps

1. Read the appropriate guidance document for your use case
2. Follow the step-by-step process
3. Run validation: `dotnet run validate-script <lesson-file.json>`
4. Fix any errors using the provided error fixes
5. Verify: `✓ Script validation passed! No issues found.`
6. Deploy to production

## 📞 Support

For questions about:
- **Lesson generation**: See LESSON_GENERATION_WORKFLOW.md
- **Validation errors**: See GUIDANCE_UPDATE_COMPLETE.txt
- **MTM methodology**: See LLM_lesson_guidance.md
- **Quick reference**: See MANDARIN_LESSON_QUICK_REFERENCE.md

