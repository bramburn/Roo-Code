# Validation Guide for Lesson JSON Files

## Overview

The validation system checks that lesson JSON files comply with both technical requirements and Michel Thomas Method (MTM) pedagogical principles. This guide explains how to run validation and interpret results.

## Running the Validation Script

### Prerequisites
- Python 3.7 or higher
- The validation script: `validate_json_files.py` (located in repository root)

### Basic Usage

```bash
# Navigate to repository root
cd /path/to/audio-lessons

# Run validation on a specific directory
python validate_json_files.py

# The script will check all JSON files in the configured directory
```

### Customizing the Validation Directory

Edit `validate_json_files.py` to change the target directory:

```python
# Line 308 - Change this path to your curriculum directory
json_dir = "curriculum/english-to-mandarin/modules/01-Foundation"
```

## Validation Checks Performed

The validation script performs the following checks:

### 1. JSON Syntax Validation
- **Check:** Valid JSON format
- **Failure:** File cannot be parsed as JSON
- **Fix:** Check for syntax errors (missing commas, quotes, brackets)

### 2. Voice Settings
- **Check:** voiceSettings object exists with rate, pitch, volume all set to 1
- **Failure:** Missing voiceSettings or incorrect values
- **Fix:** Add voiceSettings object with correct structure

### 3. Characters Array
- **Check:** Characters use 'voice' field (not 'voiceId')
- **Failure:** Using old 'voiceId' field or missing 'voice' field
- **Fix:** Rename voiceId to voice for all characters except Listener

### 4. Dialogue Structure
- **Check:** Dialogue array exists (not old 'lines' array)
- **Failure:** Using old 'lines' array or missing 'dialogue'
- **Fix:** Rename 'lines' to 'dialogue'

### 5. Dialogue Entries
- **Check:** Each entry uses 'character' and 'text' fields
- **Failure:** Using old 'speaker' or 'dialogue' field names
- **Fix:** Rename 'speaker' to 'character' and 'dialogue' to 'text'

### 6. Pause Values
- **Check:** pauseAfterMs values are integers (milliseconds)
- **Failure:** Pause values are strings or floats
- **Fix:** Convert pause values to integers (e.g., 2000 not "2000" or 2.0)

### 7. Line Number Fields
- **Check:** No 'line_number' fields remain
- **Failure:** Old 'line_number' fields still present
- **Fix:** Remove all 'line_number' fields from dialogue entries

### 8. Chinese Quotation Marks
- **Check:** Chinese quotation marks are properly escaped
- **Failure:** Unescaped quotation marks in text
- **Fix:** Escape quotes as \" in JSON strings

### 9. Mnemonics
- **Check:** Vocabulary items have mnemonic aids
- **Failure:** Few or no mnemonics for vocabulary
- **Fix:** Add mnemonic objects to dialogue entries with vocabulary

### 10. Mandarin Content
- **Check:** Content teaches Mandarin to English speakers
- **Failure:** Missing Chinese characters or English text
- **Fix:** Ensure both languages are present in appropriate characters

## Interpreting Validation Results

### Successful Validation Output

```
✅ 01.json: PASSED
✅ 02.json: PASSED
✅ 03.json: PASSED

=== Summary ===
Total files checked: 3
Files passed: 3
Files failed: 0

🎉 All files passed validation!
```

### Failed Validation Output

```
❌ 01.json: FAILED
   - Voice Settings:
     * Missing voiceSettings object
   - Dialogue Entries:
     * Dialogue entry 5: missing 'text' field

=== Summary ===
Total files checked: 3
Files passed: 2
Files failed: 1

⚠️  1 file(s) need attention.
```

## Common Issues and Fixes

### Issue: "Missing voiceSettings object"
**Fix:** Add this to root level:
```json
"voiceSettings": {
  "rate": 1,
  "pitch": 1,
  "volume": 1
}
```

### Issue: "pauseAfterMs should be an integer"
**Fix:** Change `"pauseAfterMs": "2000"` to `"pauseAfterMs": 2000`

### Issue: "Dialogue entry X: missing 'text' field"
**Fix:** Add text field or use Listener character for pauses only

### Issue: "Unescaped Chinese quotation marks"
**Fix:** Escape quotes: `"text": "他说\"你好\""` not `"text": "他说"你好""`

### Issue: "No mnemonics found for vocabulary items"
**Fix:** Add mnemonic aids for new vocabulary words

## MTM-Specific Validation

Beyond technical checks, manually verify:

- [ ] **Golden Rule:** No lesson introduces both new vocabulary AND new grammar
- [ ] **Language Separation:** No mixed languages in single dialogue lines
- [ ] **No Inline Tags:** No `[lang=...]` tags in dialogue text
- [ ] **Psychological Setup:** First lesson establishes teacher responsibility
- [ ] **Cognate Bridge:** First lesson uses familiar patterns
- [ ] **Pause Timing:** Pauses are reasonable (1000-5000ms)
- [ ] **Active Recall:** Dialogue includes "pause and produce" moments

## Batch Validation

To validate all lessons in a curriculum:

```bash
# Create a script to validate all modules
for module in curriculum/english-to-mandarin/modules/*/; do
  echo "Validating $module"
  python validate_json_files.py "$module"
done
```

## Next Steps After Validation

1. **Fix Issues:** Address all validation failures
2. **Re-validate:** Run validation again to confirm fixes
3. **Manual Review:** Check MTM compliance manually
4. **Audio Generation:** Once validated, generate audio
5. **Testing:** Test lessons with learners

