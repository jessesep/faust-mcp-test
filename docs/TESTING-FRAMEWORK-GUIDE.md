# Faust Code Testing & Validation Framework

**Version**: 1.0
**Created**: 2025-12-11
**Status**: Complete

## Overview

The Faust Code Testing & Validation Framework provides comprehensive testing capabilities for Faust DSP code. It enables Claude to validate, test, and analyze Faust code with multiple validation layers:

1. **Syntax Validation** - Catches syntax errors before compilation
2. **Compilation Testing** - Verifies code compiles successfully
3. **Signal Processing Validation** - Checks I/O dimensions and causality
4. **Parameter Validation** - Ensures slider ranges and parameter constraints
5. **Mathematical Domain Checking** - Validates function inputs stay within valid domains

---

## Architecture

### Core Components

#### 1. SyntaxValidator

Validates Faust code syntax without requiring compilation.

**Checks**:
- Missing semicolons (most common error)
- Undefined symbols and missing imports
- Bracket/parenthesis matching
- Missing `process` declaration
- Duplicate definitions
- Operator syntax issues

**Usage**:
```javascript
const { SyntaxValidator } = require('./testing-framework');

const validator = new SyntaxValidator();
const result = validator.validate(faustCode);

console.log(result.valid);      // true/false
console.log(result.errors);     // Array of errors
console.log(result.warnings);   // Array of warnings
```

#### 2. CompilationTester

Tests code compilation using the Faust compiler.

**Features**:
- Syntax checking via `faust -c`
- Error and warning parsing
- Backend compatibility testing
- Configurable timeout

**Usage**:
```javascript
const { CompilationTester } = require('./testing-framework');

const tester = new CompilationTester({
  faustPath: '/usr/local/bin/faust',  // Path to faust binary
  timeout: 10000                      // Compilation timeout in ms
});

const result = await tester.testCompilation(faustCode);
console.log(result.compilable);   // true/false
console.log(result.errors);       // Compilation errors
console.log(result.warnings);     // Compiler warnings
```

#### 3. SignalProcessingValidator

Validates signal flow and DSP correctness.

**Checks**:
- I/O dimension matching for compositions
- Causality constraints for feedback loops
- Mathematical domain violations
- Parameter range constraints
- Feedback loop feasibility

**Usage**:
```javascript
const { SignalProcessingValidator } = require('./testing-framework');

const validator = new SignalProcessingValidator();

// Check I/O dimensions
const expr = {
  type: 'sequential',
  left: { outputs: 1 },
  right: { inputs: 2 }
};
const result = validator.validateIODimensions(expr);

// Check mathematical domains
const domainResult = validator.validateMathematicalDomains(code);

// Validate parameter ranges
const paramResult = validator.validateParameterRanges(code);
```

#### 4. TestRunner

Orchestrates all tests and generates comprehensive reports.

**Features**:
- Runs all tests in sequence
- Generates formatted reports
- Tracks test history
- Produces detailed diagnostics

**Usage**:
```javascript
const { TestRunner } = require('./testing-framework');

const runner = new TestRunner();
const results = await runner.runFullTestSuite(faustCode);

console.log(runner.formatReport(results));
```

---

## Testing Workflow

### Complete Test Suite Flow

```
┌─────────────────────────────────────────────────────────┐
│         Input: Faust Code                               │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│  1. Syntax Validation                                   │
│     • Missing semicolons                                │
│     • Undefined symbols                                 │
│     • Bracket matching                                  │
│     • Process declaration                               │
│     • Duplicate definitions                             │
└─────────────────────────────────────────────────────────┘
                           ↓
              ┌────────────┴────────────┐
              │                         │
          FAIL                      PASS
              │                         │
              ↓                         ↓
         Report Errors    ┌──────────────────────────────┐
                         │  2. Parameter Validation       │
                         │     • Slider ranges           │
                         │     • Domain constraints       │
                         │     • Math function inputs     │
                         └──────────────────────────────┘
                                     ↓
                         ┌──────────────────────────────┐
                         │  3. Signal Processing Check   │
                         │     • I/O dimensions          │
                         │     • Causality              │
                         │     • Math domains            │
                         └──────────────────────────────┘
                                     ↓
                         ┌──────────────────────────────┐
                         │  4. Compilation Testing       │
                         │     • faust -c                │
                         │     • Error parsing           │
                         │     • Backend compatibility   │
                         └──────────────────────────────┘
                                     ↓
┌─────────────────────────────────────────────────────────┐
│         Output: Comprehensive Test Report               │
└─────────────────────────────────────────────────────────┘
```

---

## Usage Examples

### Example 1: Quick Syntax Check

```javascript
const code = `
import("stdfaust.lib");
freq = hslider("frequency", 440, 20, 20000, 1);
process = freq : si.osc;
`;

const validator = new SyntaxValidator();
const result = validator.validate(code);

if (result.valid) {
  console.log('✓ Code syntax is valid');
} else {
  console.log('✗ Syntax errors found:');
  result.errors.forEach(err => console.log(`  - ${err.message}`));
}
```

### Example 2: Full Test Suite

```javascript
const { TestRunner } = require('./testing-framework');

const code = `
import("stdfaust.lib");

freq = hslider("frequency", 440, 20, 20000, 1);
cutoff = hslider("cutoff", 1000, 20, 20000, 1);

process = freq : si.osc : fi.lowpass(4, cutoff);
`;

const runner = new TestRunner();
runner.runFullTestSuite(code).then(results => {
  console.log(runner.formatReport(results));

  if (results.summary.overall_status === 'PASS') {
    console.log('✓ All tests passed!');
  }
});
```

### Example 3: Targeted Validation

```javascript
const { SignalProcessingValidator } = require('./testing-framework');

const validator = new SignalProcessingValidator();

// Validate parameter ranges
const paramResult = validator.validateParameterRanges(code);
if (paramResult.issues.length > 0) {
  console.log('Parameter issues:');
  paramResult.issues.forEach(issue => {
    console.log(`  ${issue.parameter}: ${issue.message}`);
  });
}

// Validate mathematical domains
const domainResult = validator.validateMathematicalDomains(code);
if (!domainResult.valid) {
  console.log('Domain errors:');
  domainResult.issues.forEach(issue => {
    console.log(`  ${issue.function}: ${issue.message}`);
  });
}
```

---

## Test Categories

### 1. Syntax Validation Tests

**What It Checks**:
- ✓ All statements end with semicolons
- ✓ All functions/variables are defined before use
- ✓ Required imports are present
- ✓ No duplicate definitions
- ✓ Proper bracket/parenthesis matching
- ✓ Process declaration exists

**Error Types**:
```javascript
{
  type: 'SYNTAX_ERROR',
  message: 'Description of syntax error',
  line: 5,              // Optional: line number
  code: 'source code'   // Optional: problematic code
}
```

**Example Errors**:
- `Missing "process" declaration`
- `Unclosed bracket`
- `Multiple definitions of symbol 'foo'`

### 2. Compilation Tests

**What It Checks**:
- ✓ Code compiles with `faust -c`
- ✓ No compiler errors
- ✓ Compatibility with different backends

**Error Types**:
```javascript
{
  type: 'COMPILATION_ERROR',
  message: 'Compiler error message',
  line: 10
}
```

**Example Errors**:
- `error: undefined symbol : lowpass`
- `error: the number of outputs [2] of A must be equal to the number of inputs [1] of B`

### 3. Signal Processing Validation

**I/O Dimension Checks**:
- Sequential (`:`) - outputs of A must equal inputs of B
- Parallel (`,`) - no dimension constraints
- Split (`<:`) - outputs of A must divide inputs of B
- Merge (`:>`) - outputs of B must be multiple of inputs of A
- Recursive (`~`) - causality constraints

**Example**:
```faust
// ERROR: 2 outputs to 1 input
wrong = (a, b) : c;

// CORRECT: Use parallel then sequential
correct = a : c, b : c;
```

### 4. Parameter Validation

**Checks**:
- Slider default values within specified range
- No negative values for `sqrt()` operations
- Valid parameter ranges for bounded operations

**Example**:
```javascript
// ERROR: Default 200 outside range [300, 20000]
freq = hslider("frequency", 200, 300, 20000, 1);

// CORRECT:
freq = hslider("frequency", 500, 300, 20000, 1);
```

### 5. Mathematical Domain Validation

**Functions Checked**:
- `sqrt(x)` - requires x >= 0
- `log(x)`, `log10(x)` - requires x > 0
- `asin(x)`, `acos(x)` - requires -1 <= x <= 1
- `fmod(x, y)`, `remainder(x, y)` - requires y ≠ 0
- `x % y` - requires y ≠ 0

**Example**:
```faust
// ERROR: sqrt with potentially negative input
bad = hslider("val", 0, -10, 10, 0.1) : sqrt;

// CORRECT: Constrain range
good = hslider("val", 0, 0, 10, 0.1) : sqrt;
```

---

## Command-Line Interface

### Testing Framework CLI

```bash
# Test a single Faust file
node testing-framework.js mycode.dsp

# Full test mode
node testing-framework.js mycode.dsp --full
```

**Output**:
```
╔════════════════════════════════════════════════════════════╗
║        FAUST CODE TEST REPORT                              ║
╚════════════════════════════════════════════════════════════╝

Timestamp: 2025-12-11T22:30:45.123Z
Code Length: 456 characters

OVERALL STATUS: PASS
Tests Passed: 4
Tests Failed: 0

───────────────────────────────────────────────────────────
TEST DETAILS:
───────────────────────────────────────────────────────────
SYNTAX: PASS - 0 warning(s)
COMPILATION: PASS
SIGNAL_PROCESSING: PASS - 0 warning(s)
PARAMETERS: PASS
```

### Example Test Suites CLI

```bash
# List all examples
node example-test-suites.js --list

# Run all examples
node example-test-suites.js --all

# Run specific example
node example-test-suites.js oscillator
node example-test-suites.js lowPassFilter
node example-test-suites.js syntaxErrorExample
```

---

## Example Test Suites

The framework includes 10 pre-built test suites demonstrating common patterns:

### 1. **oscillator** - Simple Sine Oscillator
```faust
import("stdfaust.lib");
freq = hslider("frequency", 440, 20, 20000, 1);
gain = hslider("gain", 0.1, 0, 1, 0.01);
process = freq : si.osc : (_ * gain);
```
**Tests**: Synthesis basics, parameter handling
**Status**: PASS

### 2. **lowPassFilter** - First-Order Low-Pass Filter
```faust
import("stdfaust.lib");
cutoff = hslider("cutoff [unit:Hz]", 1000, 20, 20000, 1);
process = fi.lowpass(4, cutoff);
```
**Tests**: Filter implementation, library usage
**Status**: PASS

### 3. **delayEffect** - Stereo Delay with Feedback
```faust
import("stdfaust.lib");
delayTime = hslider("time [unit:ms]", 500, 1, 1000, 1) / 1000 : (_ * 44100) : int;
feedback = hslider("feedback", 0.5, 0, 0.99, 0.01);
// ... delay implementation
```
**Tests**: Delay control, feedback loops, type conversion
**Status**: PASS

### 4. **envelopeFollower** - Envelope Follower
```faust
import("stdfaust.lib");
attack = hslider("attack [unit:ms]", 10, 1, 100, 1) / 1000 : (_ * 44100);
release = hslider("release [unit:ms]", 100, 10, 1000, 1) / 1000 : (_ * 44100);
envFollower(att, rel) = abs : (+ ~ (_ * (1 - 1 / att))) : (_ * (1 / (1 + rel)));
process = envFollower(attack, release);
```
**Tests**: Time-domain processing, state management
**Status**: PASS

### 5. **syntaxErrorExample** - Missing Semicolon
```faust
import("stdfaust.lib");
freq = hslider("frequency", 440, 20, 20000, 1)   // MISSING SEMICOLON
gain = hslider("gain", 0.1, 0, 1, 0.01);
process = freq : si.osc;
```
**Tests**: Syntax error detection
**Status**: FAIL (as expected)

### 6. **undefinedSymbolExample** - Undefined Function
```faust
process = myUndefinedFunction;
```
**Tests**: Symbol resolution
**Status**: FAIL

### 7. **domainErrorExample** - Math Domain Violation
```faust
import("stdfaust.lib");
process = sqrt(-1);
```
**Tests**: Domain validation
**Status**: FAIL (compilation error)

### 8. **feedbackFilter** - Simple Feedback
```faust
import("stdfaust.lib");
coeff = hslider("feedback", 0.5, 0, 0.99, 0.01);
process = + ~ (_ * coeff);
```
**Tests**: Recursive composition, causality
**Status**: PASS

### 9. **filterBank** - Parallel Filter Bank
```faust
import("stdfaust.lib");
process = _ <: (
  fi.lowpass(2, 100),
  fi.lowpass(2, 1000),
  fi.lowpass(2, 10000)
);
```
**Tests**: Parallel composition, split operator
**Status**: PASS

### 10. **parameterValidationExample** - Out-of-Range Parameter
```faust
import("stdfaust.lib");
freq = hslider("frequency", 200, 300, 20000, 1);  // Default outside range!
process = freq : si.osc;
```
**Tests**: Parameter range validation
**Status**: FAIL (parameter check fails)

---

## API Reference

### TestRunner

```javascript
class TestRunner {
  constructor(options = {})

  async runFullTestSuite(code, testConfig = {})
  generateTestSummary(testResults)
  formatReport(testResults)
}
```

**Methods**:

#### `runFullTestSuite(code, testConfig)`
Runs all tests on the provided Faust code.

**Parameters**:
- `code` (string): Faust DSP code
- `testConfig` (object): Optional compilation configuration

**Returns**:
```javascript
{
  timestamp: '2025-12-11T22:30:45.123Z',
  code_length: 456,
  tests: {
    syntax: { valid, errors, warnings, summary },
    compilation: { compilable, errors, warnings, output },
    signal_processing: { valid, issues },
    parameters: { valid, issues }
  },
  summary: {
    overall_status: 'PASS' | 'FAIL',
    passed_tests: number,
    failed_tests: number,
    details: object
  }
}
```

#### `formatReport(testResults)`
Formats test results as human-readable text.

**Parameters**:
- `testResults` (object): Results from `runFullTestSuite()`

**Returns**: Formatted string report

### SyntaxValidator

```javascript
class SyntaxValidator {
  validate(code)
}
```

**Returns**:
```javascript
{
  valid: boolean,
  errors: array,
  warnings: array,
  summary: {
    totalErrors: number,
    totalWarnings: number,
    status: 'VALID' | 'INVALID'
  }
}
```

### CompilationTester

```javascript
class CompilationTester {
  constructor(options = {})
  async testCompilation(code, options = {})
  async testBackendCompatibility(code, backends = [])
}
```

### SignalProcessingValidator

```javascript
class SignalProcessingValidator {
  validateIODimensions(expr)
  validateMathematicalDomains(code)
  validateParameterRanges(code)
}
```

---

## Error Reference

### Syntax Errors

| Error | Meaning | Fix |
|-------|---------|-----|
| `Missing "process" declaration` | Code defines functions but not main process | Add `process = ...;` |
| `Multiple definitions of symbol 'foo'` | Symbol defined twice | Remove duplicate or use different names |
| `Unclosed bracket` | Mismatched parentheses/brackets | Count opening and closing brackets |
| `Undefined symbol : foo` | Function/variable not imported or defined | Import library or define symbol |

### Compilation Errors

| Error | Meaning | Fix |
|-------|---------|-----|
| `the number of outputs [N] of A must be equal to the number of inputs [M] of B` | Box dimension mismatch in `:` | Use `,` or fix dimensions |
| `number of outputs [N] of A must be a divisor of the number of inputs [M]` | Invalid split `<:` | Adjust dimensions |
| `can't compute the min and max values` | Unbounded delay | Specify max delay value |
| `calling foreign function 'foo' is not allowed` | Backend doesn't support function | Use different backend or pure Faust |

### Signal Processing Errors

| Error | Meaning | Fix |
|-------|---------|-----|
| `IO_MISMATCH_SEQUENTIAL` | Sequential composition dimension mismatch | Use parallel composition or adjust boxes |
| `IO_MISMATCH_SPLIT` | Split operator dimension problem | Ensure divisibility |
| `IO_MISMATCH_MERGE` | Merge operator dimension problem | Ensure outputs are multiple |
| `IO_MISMATCH_RECURSIVE` | Recursive composition causality issue | Adjust box dimensions |

### Parameter Errors

| Error | Meaning | Fix |
|-------|---------|-----|
| `RANGE_ERROR` | Default value outside specified range | Adjust default within [min, max] |
| `DOMAIN_ERROR` | Parameter values may cause math errors | Constrain range (e.g., >= 0 for sqrt) |

---

## Best Practices

### 1. Test Early and Often
```javascript
// Test at each stage of development
const code = `
import("stdfaust.lib");
freq = hslider("frequency", 440, 20, 20000, 1);
process = freq : si.osc;  // Test this simple version first
`;

runner.runFullTestSuite(code).then(results => {
  if (results.summary.overall_status !== 'PASS') {
    // Fix issues before adding more complexity
  }
});
```

### 2. Validate Parameter Ranges Carefully
```javascript
// GOOD: Conservative, safe ranges
freq = hslider("frequency", 1000, 20, 20000, 1);
gain = hslider("gain", 0.5, 0, 1, 0.01);

// BAD: Ranges that may cause issues
freq = hslider("frequency", 1000, -1000, 1000000, 1);
```

### 3. Handle Mathematical Domains
```javascript
// GOOD: Safe sqrt
val = hslider("value", 0.5, 0, 1, 0.01) : sqrt;

// BAD: Potentially unsafe
val = hslider("value", 0.5, -1, 1, 0.01) : sqrt;
```

### 4. Use Explicit Composition
```javascript
// GOOD: Clear intent
process = (a, b) : c;  // Sequential
process = a : c, b : c;  // Alternative clear form

// RISKY: Operator precedence confusion
process = a, b : c;  // Interprets as a, (b : c)
```

### 5. Test with Different Backends
```javascript
const tester = new CompilationTester();
const backends = await tester.testBackendCompatibility(code, ['cpp', 'wasm', 'js']);

Object.entries(backends).forEach(([backend, result]) => {
  console.log(`${backend}: ${result.compatible ? 'compatible' : 'incompatible'}`);
});
```

---

## Integration with MCP

The testing framework is designed to integrate with Model Context Protocol:

```javascript
// As MCP tool
{
  "name": "validate_faust_code",
  "description": "Comprehensive testing of Faust DSP code",
  "inputSchema": {
    "type": "object",
    "properties": {
      "code": {
        "type": "string",
        "description": "Faust DSP code to validate"
      },
      "test_type": {
        "type": "string",
        "enum": ["syntax", "full", "compilation", "signal_processing"],
        "description": "Type of validation to perform"
      }
    }
  }
}
```

---

## Limitations and Future Improvements

### Current Limitations

1. **Heuristic Syntax Checking** - Some syntax errors may not be caught by the SyntaxValidator. Compilation testing is the definitive check.

2. **I/O Dimension Analysis** - Requires explicit box dimension specification. Inferring dimensions from code is not yet implemented.

3. **Numeric Constraint Propagation** - Domain validation uses heuristics rather than rigorous constraint solving.

4. **No Runtime Behavior Testing** - Framework validates static properties only. Runtime behavior (audio output quality, etc.) is not tested.

### Planned Improvements

- [ ] Integrate Faust compiler IR analysis for better dimension inference
- [ ] Add constraint solver for mathematical domain validation
- [ ] Implement audio quality testing harness
- [ ] Support for custom validators and test plugins
- [ ] Visual block diagram generation and analysis
- [ ] Performance profiling integration
- [ ] Test coverage metrics

---

## Troubleshooting

### "faust: command not found"
**Solution**: Install Faust or provide path:
```javascript
const tester = new CompilationTester({
  faustPath: '/usr/local/bin/faust'
});
```

### Compilation timeouts
**Solution**: Increase timeout:
```javascript
const tester = new CompilationTester({
  timeout: 30000  // 30 seconds
});
```

### Tests pass but code doesn't work
**Solution**: Framework validates structure, not behavior. Test with actual Faust compilation and audio execution.

---

## Related Documents

- [faust-error-research.md](./faust-error-research.md) - Comprehensive Faust error patterns and debugging guide
- [faust-research-dsp-concepts-001](./faust-research-dsp-concepts-001.md) - Faust DSP fundamentals (created by thinker)
- [faust-mcp-architecture-001](./faust-mcp-architecture-001.md) - MCP architecture design (created by builder)

---

## Support

For issues or questions about the testing framework:

1. Check [faust-error-research.md](./faust-error-research.md) for Faust-specific error information
2. Run example test suites to understand framework behavior
3. Review test output carefully - detailed diagnostics are provided
4. Isolate problems by testing components individually

---

**Framework Version**: 1.0
**Last Updated**: 2025-12-11
**Maintainer**: tester agent
**Status**: Production Ready
