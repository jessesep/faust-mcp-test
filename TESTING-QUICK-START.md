# Faust Testing Framework - Quick Start Guide

## 30-Second Overview

The Faust Testing Framework provides **5 levels of validation** for DSP code:

1. ✓ **Syntax** - Catches missing semicolons, undefined symbols
2. ✓ **Compilation** - Tests with `faust -c` compiler
3. ✓ **Signal Flow** - Validates I/O dimensions, causality
4. ✓ **Parameters** - Checks slider ranges, math domains
5. ✓ **Comprehensive** - All tests with detailed report

---

## Installation

```bash
# Framework requires Node.js
# No external dependencies beyond standard library

# Make executable
chmod +x testing-framework.js
chmod +x example-test-suites.js
```

---

## Usage Patterns

### Pattern 1: Quick Syntax Check

```bash
node testing-framework.js mycode.dsp
```

### Pattern 2: Full Test Report

```bash
node testing-framework.js mycode.dsp --full
```

### Pattern 3: Programmatic Use

```javascript
const { TestRunner } = require('./testing-framework');

const code = `
import("stdfaust.lib");
process = hslider("freq", 440, 20, 20000, 1) : si.osc;
`;

const runner = new TestRunner();
runner.runFullTestSuite(code).then(results => {
  console.log(runner.formatReport(results));
});
```

---

## Common Test Scenarios

### Scenario 1: Validate New Code

```javascript
const code = fs.readFileSync('newfilter.dsp', 'utf8');
const runner = new TestRunner();
const results = await runner.runFullTestSuite(code);

if (results.summary.overall_status === 'PASS') {
  console.log('✓ Code is valid');
} else {
  console.log('✗ Issues found:');
  Object.values(results.tests).forEach(test => {
    if (!test.valid) {
      test.errors?.forEach(e => console.log(`  - ${e.message}`));
    }
  });
}
```

### Scenario 2: Find Specific Errors

```javascript
// Just syntax validation
const validator = new SyntaxValidator();
const result = validator.validate(code);
result.errors.forEach(err => console.error(err.message));

// Just signal processing validation
const spValidator = new SignalProcessingValidator();
const domainIssues = spValidator.validateMathematicalDomains(code);
domainIssues.issues.forEach(issue => console.warn(issue.message));
```

### Scenario 3: Batch Test Multiple Files

```javascript
const files = fs.readdirSync('./dsp').filter(f => f.endsWith('.dsp'));
const runner = new TestRunner();
const results = [];

for (const file of files) {
  const code = fs.readFileSync(`./dsp/${file}`, 'utf8');
  const result = await runner.runFullTestSuite(code);
  results.push({ file, result });
}

// Report summary
results.forEach(({ file, result }) => {
  console.log(`${file}: ${result.summary.overall_status}`);
});
```

### Scenario 4: Validate Before Integration

```javascript
const code = `... faust code ...`;
const runner = new TestRunner();
const result = await runner.runFullTestSuite(code);

if (result.summary.overall_status !== 'PASS') {
  throw new Error(`Code validation failed:\n${runner.formatReport(result)}`);
}

// Safe to integrate
integrateFaustCode(code);
```

---

## Test Reports Explained

### PASS Report

```
╔════════════════════════════════════════════════════════════╗
║        FAUST CODE TEST REPORT                              ║
╚════════════════════════════════════════════════════════════╝

Timestamp: 2025-12-11T22:30:45.123Z
Code Length: 456 characters

OVERALL STATUS: PASS          ← All tests passed!
Tests Passed: 4
Tests Failed: 0

─────────────────────────────────────────────────────────────
TEST DETAILS:
─────────────────────────────────────────────────────────────
SYNTAX: PASS - 0 warning(s)              ← No syntax errors
COMPILATION: PASS                        ← Compiles with faust -c
SIGNAL_PROCESSING: PASS - 0 warning(s)   ← Valid signal flow
PARAMETERS: PASS                         ← Slider ranges OK
```

### FAIL Report

```
╔════════════════════════════════════════════════════════════╗
║        FAUST CODE TEST REPORT                              ║
╚════════════════════════════════════════════════════════════╝

OVERALL STATUS: FAIL          ← Fix issues before use
Tests Passed: 1
Tests Failed: 3

─────────────────────────────────────────────────────────────
TEST DETAILS:
─────────────────────────────────────────────────────────────
SYNTAX: FAIL - 1 error(s)     ← Syntax problem found
COMPILATION: SKIPPED          ← Skipped due to syntax errors
SIGNAL_PROCESSING: PASS       ← No signal flow issues
PARAMETERS: PASS

SYNTAX ERRORS:
  • Unclosed bracket at position 142
```

---

## Example Test Suites

Run pre-built examples to see the framework in action:

```bash
# List all examples
node example-test-suites.js --list

# Run all examples with reports
node example-test-suites.js --all

# Run specific example
node example-test-suites.js oscillator
node example-test-suites.js lowPassFilter
node example-test-suites.js syntaxErrorExample
node example-test-suites.js domainErrorExample
```

### Available Examples

1. **oscillator** - Simple sine wave (PASS)
2. **lowPassFilter** - Low-pass filter (PASS)
3. **delayEffect** - Stereo delay with feedback (PASS)
4. **envelopeFollower** - Envelope follower (PASS)
5. **syntaxErrorExample** - Missing semicolon (FAIL)
6. **undefinedSymbolExample** - Undefined function (FAIL)
7. **domainErrorExample** - sqrt of negative (FAIL)
8. **feedbackFilter** - Recursive composition (PASS)
9. **filterBank** - Parallel filters (PASS)
10. **parameterValidationExample** - Out-of-range default (FAIL)

---

## Error Checklist

When code fails validation, check in this order:

- [ ] **SYNTAX errors?** → Fix missing semicolons, undefined symbols
- [ ] **COMPILATION errors?** → Check box dimensions, import statements
- [ ] **SIGNAL_PROCESSING warnings?** → Review I/O dimensions, causality
- [ ] **PARAMETERS errors?** → Verify slider default values within range
- [ ] Still failing? → Review `faust-error-research.md` guide

---

## Common Issues & Fixes

### Issue: "SYNTAX: FAIL - 1 error(s)"

**Common causes**:
1. Missing semicolon at end of statement
2. Undefined function (not imported)
3. Mismatched brackets

**Fix**: Check each line ends with `;` and all functions are imported or defined

### Issue: "COMPILATION: FAIL"

**Common causes**:
1. Box dimension mismatch (`:` operator)
2. Split/merge operator dimension issue
3. Missing library import

**Fix**: Review error message, check I/O counts, add imports

### Issue: "PARAMETERS: FAIL"

**Common causes**:
1. Slider default outside [min, max] range
2. Parameter values invalid for math functions

**Fix**: Adjust slider defaults to be within specified range

### Issue: Tests PASS but code doesn't work

**Likely causes**:
- Framework validates structure, not audio behavior
- Compilation with different target backend may have different results

**Solution**: Also test with actual Faust tools and listen to output

---

## API Quick Reference

```javascript
const { TestRunner, SyntaxValidator, CompilationTester, SignalProcessingValidator } = require('./testing-framework');

// Full testing
const runner = new TestRunner();
const results = await runner.runFullTestSuite(code);
console.log(runner.formatReport(results));

// Syntax only
const syntaxValidator = new SyntaxValidator();
const syntaxResult = syntaxValidator.validate(code);

// Compilation only
const compiler = new CompilationTester();
const compileResult = await compiler.testCompilation(code);

// Signal processing only
const signalValidator = new SignalProcessingValidator();
const domainIssues = signalValidator.validateMathematicalDomains(code);
const paramIssues = signalValidator.validateParameterRanges(code);
const ioIssues = signalValidator.validateIODimensions(expr);
```

---

## Integration Points

### With Claude Code MCP

```javascript
// As a callable MCP tool
const tool = {
  name: 'test_faust',
  description: 'Comprehensive testing of Faust DSP code',
  implementation: async (code) => {
    const runner = new TestRunner();
    const result = await runner.runFullTestSuite(code);
    return runner.formatReport(result);
  }
};
```

### With Build Systems

```javascript
// As build pre-flight check
const { TestRunner } = require('./testing-framework');

function validateBeforeBuild(faustCode) {
  const runner = new TestRunner();
  return runner.runFullTestSuite(faustCode);
}

// In build script
const result = await validateBeforeBuild(code);
if (result.summary.overall_status !== 'PASS') {
  throw new Error('Code validation failed');
}
```

---

## Performance Notes

- **Syntax validation**: < 1ms
- **Full test suite**: 100-500ms (depends on compilation)
- **Parallel testing**: Tests run sequentially in current version

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `faust: command not found` | Install Faust or set `faustPath` option |
| Compilation timeout | Increase `timeout` option (default 10s) |
| Tests hang | Check if Faust process is stuck; kill and retry |
| All tests PASS but code doesn't compile | Try `faust mycode.dsp -c` manually; framework may be outdated |

---

## Next Steps

1. **Try examples**: `node example-test-suites.js --all`
2. **Test your code**: `node testing-framework.js yourcode.dsp`
3. **Integrate**: Use `TestRunner` in your build pipeline
4. **Reference**: Check `TESTING-FRAMEWORK-GUIDE.md` for detailed docs

---

## Files

- `testing-framework.js` - Core framework implementation
- `example-test-suites.js` - 10 pre-built test examples
- `docs/TESTING-FRAMEWORK-GUIDE.md` - Comprehensive documentation
- `TESTING-QUICK-START.md` - This file

---

**Last Updated**: 2025-12-11
**Version**: 1.0
**Status**: Production Ready
