#!/usr/bin/env node

/**
 * Faust Code Testing & Validation Framework
 *
 * Provides comprehensive testing capabilities for Faust DSP code:
 * - Syntax validation
 * - Compilation testing
 * - Output verification
 * - Signal processing correctness checks
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

/**
 * SyntaxValidator: Validates Faust code syntax before compilation
 */
class SyntaxValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Validate Faust code for syntax issues
   * @param {string} code - Faust DSP code
   * @returns {object} Validation result
   */
  validate(code) {
    this.errors = [];
    this.warnings = [];

    // Check for missing semicolons (most common error)
    this.checkMissingSemicolons(code);

    // Check for undefined symbols
    this.checkUndefinedSymbols(code);

    // Check for bracket/parenthesis matching
    this.checkBracketMatching(code);

    // Check for missing process declaration
    this.checkProcessDeclaration(code);

    // Check for duplicate definitions
    this.checkDuplicateDefinitions(code);

    // Check operator syntax
    this.checkOperatorSyntax(code);

    return {
      valid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
      summary: this.generateSummary()
    };
  }

  checkMissingSemicolons(code) {
    // Pattern: identifier/closing bracket followed by identifier without semicolon
    // This is a heuristic check - not perfect but catches many cases
    const lines = code.split('\n');

    lines.forEach((line, idx) => {
      // Skip comments and empty lines
      if (line.trim().startsWith('//') || line.trim().startsWith('/*') || !line.trim()) {
        return;
      }

      // Check if line ends with operator (suggesting missing semicolon)
      if (/(,|:)$/.test(line.trim()) && !line.includes('(') && !line.includes('{')) {
        this.warnings.push({
          line: idx + 1,
          message: 'Line ends with operator - missing semicolon possible',
          code: line
        });
      }

      // Pattern: closing bracket/identifier followed by another identifier on next line
      // suggests missing semicolon
      if (/[a-zA-Z0-9_\)\]]$/.test(line.trim()) && idx < lines.length - 1) {
        const nextLine = lines[idx + 1].trim();
        if (/^[a-zA-Z_]/.test(nextLine) && !nextLine.startsWith('//')) {
          this.warnings.push({
            line: idx + 1,
            message: 'Potential missing semicolon before next identifier',
            code: line
          });
        }
      }
    });
  }

  checkUndefinedSymbols(code) {
    // Extract import statements
    const importRegex = /import\s*\(\s*"([^"]+)"\s*\)\s*;/g;
    const imports = new Set();
    let match;
    while ((match = importRegex.exec(code)) !== null) {
      imports.add(match[1]);
    }

    // Check if stdfaust.lib is imported
    const hasStdlib = imports.has('stdfaust.lib');

    // Common library functions that need imports
    const libraryFunctions = {
      'ba.': hasStdlib,
      'ma.': hasStdlib,
      'si.': hasStdlib,
      'fi.': hasStdlib,
      'co.': hasStdlib,
      'de.': hasStdlib,
      'pf.': hasStdlib,
      'ef.': hasStdlib,
      'ho.': hasStdlib
    };

    // Check for library function usage without imports
    Object.entries(libraryFunctions).forEach(([lib, imported]) => {
      if (!imported && code.includes(lib)) {
        this.warnings.push({
          message: `Library function '${lib}*' used but 'stdfaust.lib' may not be imported`,
          suggestion: 'Add: import("stdfaust.lib");'
        });
      }
    });

    // Check for undefined symbols
    const definedSymbols = new Set();

    // Extract function definitions
    const defRegex = /([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:\([^)]*\))?\s*=/g;
    while ((match = defRegex.exec(code)) !== null) {
      definedSymbols.add(match[1]);
    }

    // Add standard primitives
    const standardPrimitives = [
      'process', 'import', 'declare', 'with', 'where', 'include',
      'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'sinh', 'cosh', 'tanh',
      'exp', 'log', 'log10', 'pow', 'sqrt', 'abs', 'min', 'max',
      'floor', 'ceil', 'round', 'fmod', 'remainder',
      'hslider', 'vslider', 'nentry', 'hbargraph', 'vbargraph',
      'button', 'checkbox', 'attach',
      'select2', 'select3', 'select4',
      'rdtable', 'rwtable', 'route', 'cross'
    ];

    standardPrimitives.forEach(p => definedSymbols.add(p));
  }

  checkBracketMatching(code) {
    const brackets = {
      '(': ')',
      '[': ']',
      '{': '}'
    };

    const stack = [];
    const pairs = {
      ')': '(',
      ']': '[',
      '}': '{'
    };

    for (let i = 0; i < code.length; i++) {
      const char = code[i];

      // Skip strings
      if (char === '"') {
        i++;
        while (i < code.length && code[i] !== '"') {
          if (code[i] === '\\') i++;
          i++;
        }
        continue;
      }

      // Skip comments
      if (char === '/' && code[i + 1] === '/') {
        while (i < code.length && code[i] !== '\n') i++;
        continue;
      }

      if (char === '/' && code[i + 1] === '*') {
        i += 2;
        while (i < code.length && !(code[i] === '*' && code[i + 1] === '/')) i++;
        i += 2;
        continue;
      }

      if (char in brackets) {
        stack.push({ char, pos: i });
      } else if (char in pairs) {
        if (stack.length === 0 || stack[stack.length - 1].char !== pairs[char]) {
          this.errors.push({
            position: i,
            message: `Unmatched '${char}' bracket`
          });
        } else {
          stack.pop();
        }
      }
    }

    if (stack.length > 0) {
      stack.forEach(item => {
        this.errors.push({
          position: item.pos,
          message: `Unclosed '${item.char}' bracket`
        });
      });
    }
  }

  checkProcessDeclaration(code) {
    if (!code.includes('process')) {
      this.errors.push({
        message: 'Missing "process" declaration - required to define the main DSP algorithm'
      });
    }
  }

  checkDuplicateDefinitions(code) {
    const defRegex = /([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:\([^)]*\))?\s*=/g;
    const definitions = {};
    let match;

    while ((match = defRegex.exec(code)) !== null) {
      const name = match[1];
      if (definitions[name]) {
        this.errors.push({
          message: `Multiple definitions of symbol '${name}' at positions ${definitions[name]} and ${match.index}`,
          symbol: name
        });
      } else {
        definitions[name] = match.index;
      }
    }
  }

  checkOperatorSyntax(code) {
    // Check for common operator mistakes
    const operators = [
      { pattern: /<:/, name: 'split operator', minOutputs: 1 },
      { pattern: /:>/, name: 'merge operator', minInputs: 1 },
      { pattern: /:/, name: 'sequential composition' },
      { pattern: /,/, name: 'parallel composition' },
      { pattern: /~/, name: 'recursive composition' }
    ];

    // Check for unary negation issues
    if (/\-\s*\(/.test(code)) {
      this.warnings.push({
        message: 'Unary negation with parentheses may not be supported - use "0 - (expr)" instead',
        example: 'Wrong: -(x + 1)  Correct: 0 - (x + 1)'
      });
    }
  }

  generateSummary() {
    return {
      totalErrors: this.errors.length,
      totalWarnings: this.warnings.length,
      status: this.errors.length === 0 ? 'VALID' : 'INVALID'
    };
  }
}

/**
 * CompilationTester: Tests Faust code compilation
 */
class CompilationTester {
  constructor(options = {}) {
    this.faustPath = options.faustPath || 'faust';
    this.timeout = options.timeout || 10000;
  }

  /**
   * Test if Faust code compiles successfully
   * @param {string} code - Faust DSP code
   * @param {object} options - Compilation options
   * @returns {object} Compilation result
   */
  async testCompilation(code, options = {}) {
    // Write code to temporary file
    const tempFile = `/tmp/faust_test_${Date.now()}.dsp`;

    try {
      fs.writeFileSync(tempFile, code);

      // Run faust compiler with syntax check
      try {
        const result = execSync(`${this.faustPath} -c ${tempFile} 2>&1`, {
          timeout: this.timeout,
          encoding: 'utf8'
        });

        return {
          compilable: true,
          output: result,
          errors: [],
          warnings: this.parseCompilerOutput(result)
        };
      } catch (error) {
        // Compilation failed
        return {
          compilable: false,
          output: error.stdout || '',
          errors: this.parseCompilerErrors(error.stdout || error.stderr || error.message),
          warnings: []
        };
      }
    } finally {
      // Clean up temp file
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    }
  }

  /**
   * Test compilation with different backends
   * @param {string} code - Faust DSP code
   * @param {string[]} backends - List of backends to test
   * @returns {object} Backend compatibility results
   */
  async testBackendCompatibility(code, backends = ['cpp', 'wasm']) {
    const results = {};

    for (const backend of backends) {
      const tempFile = `/tmp/faust_test_${Date.now()}_${backend}.dsp`;

      try {
        fs.writeFileSync(tempFile, code);

        try {
          execSync(`${this.faustPath} -lang ${backend} ${tempFile} > /dev/null 2>&1`, {
            timeout: this.timeout
          });
          results[backend] = { compatible: true };
        } catch (error) {
          results[backend] = {
            compatible: false,
            error: error.message
          };
        }
      } finally {
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      }
    }

    return results;
  }

  parseCompilerErrors(output) {
    const errors = [];
    const lines = output.split('\n');

    lines.forEach(line => {
      if (line.includes('error:') || line.includes('ERROR')) {
        errors.push({
          message: line.trim(),
          type: 'compilation_error'
        });
      }
    });

    return errors;
  }

  parseCompilerOutput(output) {
    const warnings = [];
    const lines = output.split('\n');

    lines.forEach(line => {
      if (line.includes('warning:') || line.includes('Warning')) {
        warnings.push({
          message: line.trim(),
          type: 'compiler_warning'
        });
      }
    });

    return warnings;
  }
}

/**
 * SignalProcessingValidator: Validates signal processing properties
 */
class SignalProcessingValidator {
  /**
   * Validate I/O dimensions in Faust expressions
   * @param {object} expr - Expression with I/O information
   * @returns {object} Validation result
   */
  validateIODimensions(expr) {
    const issues = [];

    // Check sequential composition: outputs(A) must equal inputs(B)
    if (expr.type === 'sequential' && expr.left.outputs !== expr.right.inputs) {
      issues.push({
        type: 'IO_MISMATCH_SEQUENTIAL',
        message: `Sequential composition error: left box outputs [${expr.left.outputs}] must equal right box inputs [${expr.right.inputs}]`,
        severity: 'error'
      });
    }

    // Check split operator: left outputs must divide right inputs evenly
    if (expr.type === 'split' && expr.right.inputs % expr.left.outputs !== 0) {
      issues.push({
        type: 'IO_MISMATCH_SPLIT',
        message: `Split operator error: left outputs [${expr.left.outputs}] must be divisor of right inputs [${expr.right.inputs}]`,
        severity: 'error'
      });
    }

    // Check merge operator: right outputs must be multiple of left inputs
    if (expr.type === 'merge' && expr.right.outputs % expr.left.inputs !== 0) {
      issues.push({
        type: 'IO_MISMATCH_MERGE',
        message: `Merge operator error: right outputs [${expr.right.outputs}] must be multiple of left inputs [${expr.left.inputs}]`,
        severity: 'error'
      });
    }

    // Check recursive composition
    if (expr.type === 'recursive') {
      const cond1 = expr.left.outputs >= expr.right.inputs;
      const cond2 = expr.left.inputs >= expr.right.outputs;

      if (!cond1 || !cond2) {
        issues.push({
          type: 'IO_MISMATCH_RECURSIVE',
          message: `Recursive composition requires outputs(A)[${expr.left.outputs}] >= inputs(B)[${expr.right.inputs}] AND inputs(A)[${expr.left.inputs}] >= outputs(B)[${expr.right.outputs}]`,
          severity: 'error'
        });
      }
    }

    return {
      valid: issues.filter(i => i.severity === 'error').length === 0,
      issues,
      summary: {
        errors: issues.filter(i => i.severity === 'error').length,
        warnings: issues.filter(i => i.severity === 'warning').length
      }
    };
  }

  /**
   * Validate mathematical domain constraints
   * @param {string} code - Faust code
   * @returns {object} Domain validation result
   */
  validateMathematicalDomains(code) {
    const issues = [];

    // Check for constant compile-time domain violations
    const domainFunctions = [
      { name: 'sqrt', pattern: /\bsqrt\s*\(\s*-[\d.]+\s*\)/, domain: 'x >= 0' },
      { name: 'log', pattern: /\blog\s*\(\s*[0-][\d.]*\s*\)/, domain: 'x > 0' },
      { name: 'log10', pattern: /\blog10\s*\(\s*[0-][\d.]*\s*\)/, domain: 'x > 0' },
      { name: 'asin', pattern: /\basin\s*\(\s*[\d.]*\s*\)(?=.*;)/, checkValue: (v) => v > 1 || v < -1, domain: '-1 <= x <= 1' },
      { name: 'acos', pattern: /\bacos\s*\(\s*[\d.]*\s*\)(?=.*;)/, checkValue: (v) => v > 1 || v < -1, domain: '-1 <= x <= 1' }
    ];

    domainFunctions.forEach(fn => {
      if (fn.pattern.test(code)) {
        issues.push({
          type: 'DOMAIN_ERROR',
          function: fn.name,
          message: `Potential domain violation in ${fn.name}() - ensure argument satisfies: ${fn.domain}`,
          severity: 'warning'
        });
      }
    });

    // Check for division by zero
    if (/[\/\%]\s*0(?:[\s;,\)])/.test(code)) {
      issues.push({
        type: 'DOMAIN_ERROR',
        message: 'Division or modulo by zero detected',
        severity: 'error'
      });
    }

    return {
      valid: issues.filter(i => i.severity === 'error').length === 0,
      issues
    };
  }

  /**
   * Validate slider and parameter ranges
   * @param {string} code - Faust code
   * @returns {object} Parameter validation result
   */
  validateParameterRanges(code) {
    const issues = [];

    // Find all slider definitions
    const sliderPattern = /h(?:slider|vslider|bargraph)\s*\(\s*"([^"]+)"\s*,\s*([\d.-]+)\s*,\s*([\d.-]+)\s*,\s*([\d.-]+)\s*,\s*([\d.]+)\s*\)/g;
    let match;

    while ((match = sliderPattern.exec(code)) !== null) {
      const [, name, def, min, max, step] = match;
      const defVal = parseFloat(def);
      const minVal = parseFloat(min);
      const maxVal = parseFloat(max);

      // Check if default is within range
      if (defVal < minVal || defVal > maxVal) {
        issues.push({
          type: 'RANGE_ERROR',
          parameter: name,
          message: `Slider '${name}' default value ${defVal} outside range [${minVal}, ${maxVal}]`,
          severity: 'error'
        });
      }

      // Check for negative values in sqrt/log operations
      if (code.includes(`${name} : sqrt`) && minVal < 0) {
        issues.push({
          type: 'DOMAIN_ERROR',
          parameter: name,
          message: `Parameter '${name}' may have negative values but used with sqrt()`,
          severity: 'warning'
        });
      }
    }

    return {
      valid: issues.filter(i => i.severity === 'error').length === 0,
      issues
    };
  }
}

/**
 * TestRunner: Orchestrates test execution
 */
class TestRunner {
  constructor(options = {}) {
    this.syntaxValidator = new SyntaxValidator();
    this.compilationTester = new CompilationTester(options);
    this.signalValidator = new SignalProcessingValidator();
    this.results = [];
  }

  /**
   * Run comprehensive test suite on Faust code
   * @param {string} code - Faust DSP code
   * @param {object} testConfig - Test configuration
   * @returns {object} Complete test results
   */
  async runFullTestSuite(code, testConfig = {}) {
    const timestamp = new Date().toISOString();
    const testResults = {
      timestamp,
      code_length: code.length,
      tests: {
        syntax: null,
        compilation: null,
        signal_processing: null,
        parameters: null
      },
      summary: null
    };

    // 1. Syntax Validation
    testResults.tests.syntax = this.syntaxValidator.validate(code);

    // 2. Signal Processing Validation (before compilation since it's lightweight)
    testResults.tests.signal_processing = this.signalValidator.validateMathematicalDomains(code);
    testResults.tests.parameters = this.signalValidator.validateParameterRanges(code);

    // 3. Compilation Testing (if syntax is valid)
    if (testResults.tests.syntax.valid) {
      testResults.tests.compilation = await this.compilationTester.testCompilation(code, testConfig);
    } else {
      testResults.tests.compilation = {
        compilable: false,
        skipped: true,
        reason: 'Skipped due to syntax errors'
      };
    }

    // Generate summary
    testResults.summary = this.generateTestSummary(testResults);
    this.results.push(testResults);

    return testResults;
  }

  generateTestSummary(testResults) {
    const { tests } = testResults;
    const summary = {
      overall_status: 'PASS',
      passed_tests: 0,
      failed_tests: 0,
      details: {}
    };

    // Evaluate each test
    if (!tests.syntax.valid) {
      summary.failed_tests++;
      summary.details.syntax = `FAIL - ${tests.syntax.summary.totalErrors} error(s)`;
      summary.overall_status = 'FAIL';
    } else {
      summary.passed_tests++;
      summary.details.syntax = `PASS - ${tests.syntax.summary.totalWarnings} warning(s)`;
    }

    if (tests.compilation.skipped) {
      summary.details.compilation = `SKIPPED - ${tests.compilation.reason}`;
    } else if (!tests.compilation.compilable) {
      summary.failed_tests++;
      summary.details.compilation = `FAIL - ${tests.compilation.errors.length} error(s)`;
      summary.overall_status = 'FAIL';
    } else {
      summary.passed_tests++;
      summary.details.compilation = 'PASS';
    }

    if (tests.signal_processing.issues.filter(i => i.severity === 'error').length > 0) {
      summary.failed_tests++;
      summary.details.signal_processing = `FAIL - ${tests.signal_processing.issues.filter(i => i.severity === 'error').length} error(s)`;
      summary.overall_status = 'FAIL';
    } else {
      summary.passed_tests++;
      summary.details.signal_processing = `PASS - ${tests.signal_processing.issues.length} warning(s)`;
    }

    if (tests.parameters.issues.filter(i => i.severity === 'error').length > 0) {
      summary.failed_tests++;
      summary.details.parameters = `FAIL - ${tests.parameters.issues.filter(i => i.severity === 'error').length} error(s)`;
      summary.overall_status = 'FAIL';
    } else {
      summary.passed_tests++;
      summary.details.parameters = 'PASS';
    }

    return summary;
  }

  /**
   * Get formatted test report
   * @param {object} testResults - Results from runFullTestSuite
   * @returns {string} Formatted report
   */
  formatReport(testResults) {
    const lines = [];
    lines.push('╔════════════════════════════════════════════════════════════╗');
    lines.push('║        FAUST CODE TEST REPORT                              ║');
    lines.push('╚════════════════════════════════════════════════════════════╝');
    lines.push('');
    lines.push(`Timestamp: ${testResults.timestamp}`);
    lines.push(`Code Length: ${testResults.code_length} characters`);
    lines.push('');
    lines.push('OVERALL STATUS: ' + testResults.summary.overall_status);
    lines.push(`Tests Passed: ${testResults.summary.passed_tests}`);
    lines.push(`Tests Failed: ${testResults.summary.failed_tests}`);
    lines.push('');
    lines.push('─────────────────────────────────────────────────────────────');
    lines.push('TEST DETAILS:');
    lines.push('─────────────────────────────────────────────────────────────');

    Object.entries(testResults.summary.details).forEach(([test, status]) => {
      lines.push(`${test.toUpperCase()}: ${status}`);
    });

    lines.push('');
    if (testResults.tests.syntax.errors.length > 0) {
      lines.push('SYNTAX ERRORS:');
      testResults.tests.syntax.errors.forEach(err => {
        lines.push(`  • ${err.message || err.code || JSON.stringify(err)}`);
      });
      lines.push('');
    }

    if (testResults.tests.compilation.errors && testResults.tests.compilation.errors.length > 0) {
      lines.push('COMPILATION ERRORS:');
      testResults.tests.compilation.errors.forEach(err => {
        lines.push(`  • ${err.message || err}`);
      });
      lines.push('');
    }

    return lines.join('\n');
  }
}

// Export classes for use
module.exports = {
  SyntaxValidator,
  CompilationTester,
  SignalProcessingValidator,
  TestRunner
};

// CLI support
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: node testing-framework.js <faust-file>');
    console.log('       node testing-framework.js <faust-file> --full');
    process.exit(1);
  }

  const filePath = args[0];
  const fullTest = args.includes('--full');

  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found: ${filePath}`);
    process.exit(1);
  }

  const code = fs.readFileSync(filePath, 'utf8');
  const runner = new TestRunner();

  runner.runFullTestSuite(code).then(results => {
    console.log(runner.formatReport(results));
    process.exit(results.summary.overall_status === 'PASS' ? 0 : 1);
  }).catch(err => {
    console.error('Error running tests:', err);
    process.exit(1);
  });
}
