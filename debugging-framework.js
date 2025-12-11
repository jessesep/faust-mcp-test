#!/usr/bin/env node

/**
 * Faust Debugging & Troubleshooting Framework
 *
 * Provides tools to diagnose, understand, and fix errors in Faust DSP code.
 * Integrates with the testing framework to provide guided error recovery.
 */

const fs = require('fs');
const { TestRunner } = require('./testing-framework');

/**
 * ErrorDiagnoser: Analyzes errors and provides detailed diagnostics
 */
class ErrorDiagnoser {
  constructor() {
    this.errorPatterns = this.buildErrorPatterns();
  }

  /**
   * Diagnose all errors in code
   * @param {string} code - Faust code to diagnose
   * @returns {object} Comprehensive error diagnostics
   */
  async diagnoseCode(code) {
    // First run tests to get error information
    const runner = new TestRunner();
    const testResults = await runner.runFullTestSuite(code);

    const diagnosis = {
      timestamp: new Date().toISOString(),
      code_length: code.length,
      errors_found: 0,
      critical_errors: [],
      warnings: [],
      analysis: {}
    };

    // Analyze syntax errors
    if (!testResults.tests.syntax.valid) {
      testResults.tests.syntax.errors.forEach(err => {
        diagnosis.critical_errors.push(this.diagnoseError(err, 'SYNTAX', code));
      });
      diagnosis.errors_found += testResults.tests.syntax.errors.length;
    }

    // Analyze compilation errors
    if (testResults.tests.compilation && !testResults.tests.compilation.compilable) {
      testResults.tests.compilation.errors.forEach(err => {
        diagnosis.critical_errors.push(this.diagnoseError(err, 'COMPILATION', code));
      });
      diagnosis.errors_found += testResults.tests.compilation.errors.length;
    }

    // Collect warnings
    if (testResults.tests.syntax.warnings) {
      diagnosis.warnings.push(...testResults.tests.syntax.warnings);
    }

    // Analyze signal processing issues
    if (testResults.tests.signal_processing && !testResults.tests.signal_processing.valid) {
      testResults.tests.signal_processing.issues.forEach(issue => {
        if (issue.severity === 'error') {
          diagnosis.critical_errors.push(this.diagnoseError(issue, 'SIGNAL_PROCESSING', code));
        } else {
          diagnosis.warnings.push(issue);
        }
      });
      diagnosis.errors_found += testResults.tests.signal_processing.issues.filter(i => i.severity === 'error').length;
    }

    // Add test results for reference
    diagnosis.test_results_summary = testResults.summary;

    return diagnosis;
  }

  /**
   * Diagnose a single error with recovery suggestions
   * @param {object} error - Error object from tests
   * @param {string} errorType - Type of error (SYNTAX, COMPILATION, etc.)
   * @param {string} code - Faust code
   * @returns {object} Detailed diagnosis with recovery steps
   */
  diagnoseError(error, errorType, code) {
    const diagnosis = {
      type: errorType,
      message: error.message || error,
      severity: error.severity || 'error',
      recovery_steps: [],
      examples: {},
      related_patterns: []
    };

    // Find matching error patterns for recovery suggestions
    const matchingPatterns = this.findMatchingPatterns(error, errorType, code);
    diagnosis.related_patterns = matchingPatterns;

    // Generate recovery steps based on error type
    diagnosis.recovery_steps = this.generateRecoverySteps(error, errorType, code);

    // Find code examples
    diagnosis.examples = this.findExamples(error, errorType);

    return diagnosis;
  }

  /**
   * Find error patterns that match the error
   * @param {object} error - Error object
   * @param {string} errorType - Error type
   * @param {string} code - Faust code
   * @returns {array} Matching patterns
   */
  findMatchingPatterns(error, errorType, code) {
    const patterns = this.errorPatterns[errorType] || [];
    const matches = [];

    patterns.forEach(pattern => {
      if (pattern.match(error.message || '')) {
        matches.push({
          pattern: pattern.pattern,
          category: pattern.category,
          frequency: pattern.frequency,
          likelihood: 'HIGH'
        });
      }
    });

    return matches;
  }

  /**
   * Generate recovery steps for an error
   * @param {object} error - Error object
   * @param {string} errorType - Error type
   * @param {string} code - Faust code
   * @returns {array} Recovery steps
   */
  generateRecoverySteps(error, errorType, code) {
    const steps = [];
    const msg = error.message || '';

    // Syntax errors
    if (errorType === 'SYNTAX') {
      if (msg.includes('semicolon')) {
        steps.push({
          step: 1,
          action: 'Check for missing semicolons',
          details: 'Faust requires semicolons at the end of all statements',
          example: 'Add semicolon: process = freq : sin;'
        });
      }

      if (msg.includes('Undefined') || msg.includes('undefined')) {
        steps.push({
          step: 1,
          action: 'Check if symbol is defined or imported',
          details: 'Ensure function/variable is defined before use or imported from library',
          example: 'Add: import("stdfaust.lib");'
        });
      }

      if (msg.includes('bracket') || msg.includes('parenthes') || msg.includes('Unclosed')) {
        steps.push({
          step: 1,
          action: 'Check bracket matching',
          details: 'Ensure all (, [, { have matching closing bracket',
          code_hint: this.findUnmatchedBrackets(code)
        });
      }

      if (msg.includes('process')) {
        steps.push({
          step: 1,
          action: 'Add process declaration',
          details: 'Every Faust program must declare the main algorithm with "process = ..."',
          example: 'process = hslider("freq", 440, 20, 20000, 1) : si.osc;'
        });
      }
    }

    // Compilation errors
    if (errorType === 'COMPILATION') {
      if (msg.includes('outputs') && msg.includes('inputs')) {
        steps.push({
          step: 1,
          action: 'Fix box composition error',
          details: 'Sequential composition (:) requires matching I/O counts',
          fix_options: [
            'Use parallel composition (,) instead',
            'Adjust box to have matching inputs/outputs',
            'Use split (<:) or merge (:>) operators'
          ]
        });
      }

      if (msg.includes('divisor')) {
        steps.push({
          step: 1,
          action: 'Fix split operator dimension',
          details: 'Split (<:) requires left outputs to divide right inputs evenly',
          example: 'Wrong: (a, b) <: (c, d, e)  |  Right: (a) <: (c, d)'
        });
      }

      if (msg.includes('multiple')) {
        steps.push({
          step: 1,
          action: 'Fix merge operator dimension',
          details: 'Merge (:>) requires right outputs to be multiple of left inputs',
          example: 'Wrong: (a, b) :> (c, d)  |  Right: (a, a) :> (c)'
        });
      }

      if (msg.includes('Foreign') || msg.includes('foreign')) {
        steps.push({
          step: 1,
          action: 'Use pure Faust or change backend',
          details: 'Backend (e.g., WASM) does not support foreign functions',
          fix_options: [
            'Remove foreign function calls',
            'Use pure Faust equivalents from standard library',
            'Switch to C++ backend'
          ]
        });
      }
    }

    // Signal processing errors
    if (errorType === 'SIGNAL_PROCESSING') {
      if (msg.includes('DOMAIN')) {
        steps.push({
          step: 1,
          action: 'Fix mathematical domain violation',
          details: 'Function input must stay within valid domain',
          check: 'Verify slider ranges and parameter constraints'
        });
      }

      if (msg.includes('RANGE')) {
        steps.push({
          step: 1,
          action: 'Fix parameter range error',
          details: 'Slider default must be within [min, max] range',
          example: 'Change: hslider("freq", 200, 300, 20000, 1)  To: hslider("freq", 500, 300, 20000, 1)'
        });
      }
    }

    // Generic step if no specific matches
    if (steps.length === 0) {
      steps.push({
        step: 1,
        action: 'Review error message carefully',
        details: error.message || 'See error details above',
        hint: 'Check faust-error-research.md for comprehensive error patterns'
      });
    }

    return steps;
  }

  /**
   * Find code examples for error resolution
   * @param {object} error - Error object
   * @param {string} errorType - Error type
   * @returns {object} Code examples
   */
  findExamples(error, errorType) {
    const examples = {
      correct: [],
      incorrect: []
    };

    // Examples for common errors
    if (errorType === 'SYNTAX' && error.message && error.message.includes('process')) {
      examples.incorrect.push(
        'myfilter(x) = x : cos;  // No process!',
        'import("stdfaust.lib");'
      );
      examples.correct.push(
        'myfilter(x) = x : cos;',
        'process = hslider("freq", 440, 20, 20000, 1) : myfilter;'
      );
    }

    if (errorType === 'COMPILATION' && error.message && error.message.includes('outputs')) {
      examples.incorrect.push(
        '(a, b) : c;  // 2 to 1: ERROR',
        'process = (a, b) : sum;'
      );
      examples.correct.push(
        'a : c, b : c;  // Parallel',
        '(a, b) <: (c, c);  // Split'
      );
    }

    return examples;
  }

  /**
   * Find unmatched brackets in code
   * @param {string} code - Faust code
   * @returns {object} Bracket info
   */
  findUnmatchedBrackets(code) {
    const stack = [];
    const pairs = { ')': '(', ']': '[', '}': '{' };

    for (let i = 0; i < code.length; i++) {
      const char = code[i];

      if (char in pairs) {
        if (stack.length === 0 || stack[stack.length - 1] !== pairs[char]) {
          return {
            position: i,
            unmatched: char,
            line: code.substring(0, i).split('\n').length
          };
        }
        stack.pop();
      } else if ('([{'.includes(char)) {
        stack.push(char);
      }
    }

    if (stack.length > 0) {
      return {
        unclosed: stack[0],
        message: `Unclosed bracket: ${stack[0]}`
      };
    }

    return null;
  }

  /**
   * Build error pattern database
   * @returns {object} Error patterns by category
   */
  buildErrorPatterns() {
    return {
      SYNTAX: [
        {
          pattern: /missing.*semicolon|unexpected/i,
          category: 'Missing Semicolon',
          frequency: 'VERY_HIGH',
          match: (msg) => /unexpected|semicolon/i.test(msg)
        },
        {
          pattern: /undefined.*symbol/i,
          category: 'Undefined Symbol',
          frequency: 'HIGH',
          match: (msg) => /undefined|symbol/i.test(msg)
        },
        {
          pattern: /bracket|paren|unclosed/i,
          category: 'Bracket Matching',
          frequency: 'MEDIUM',
          match: (msg) => /bracket|paren|unclosed/i.test(msg)
        },
        {
          pattern: /process/i,
          category: 'Missing Process',
          frequency: 'MEDIUM',
          match: (msg) => /process/i.test(msg)
        }
      ],
      COMPILATION: [
        {
          pattern: /outputs.*inputs|number of outputs/i,
          category: 'Box Dimension Mismatch',
          frequency: 'HIGH',
          match: (msg) => /outputs.*inputs|number of outputs/i.test(msg)
        },
        {
          pattern: /divisor/i,
          category: 'Split Operator Error',
          frequency: 'MEDIUM',
          match: (msg) => /divisor/i.test(msg)
        },
        {
          pattern: /multiple/i,
          category: 'Merge Operator Error',
          frequency: 'MEDIUM',
          match: (msg) => /multiple/i.test(msg)
        },
        {
          pattern: /foreign|calling foreign/i,
          category: 'Backend Incompatibility',
          frequency: 'LOW',
          match: (msg) => /foreign/i.test(msg)
        },
        {
          pattern: /unbounded|can't compute/i,
          category: 'Unbounded Delay',
          frequency: 'LOW',
          match: (msg) => /unbounded|can't compute/i.test(msg)
        }
      ],
      SIGNAL_PROCESSING: [
        {
          pattern: /domain/i,
          category: 'Mathematical Domain',
          frequency: 'MEDIUM',
          match: (msg) => /domain/i.test(msg)
        },
        {
          pattern: /range/i,
          category: 'Parameter Range',
          frequency: 'MEDIUM',
          match: (msg) => /range/i.test(msg)
        },
        {
          pattern: /causality|recursive/i,
          category: 'Causality Violation',
          frequency: 'LOW',
          match: (msg) => /causality|recursive/i.test(msg)
        }
      ]
    };
  }
}

/**
 * RecoverySuggester: Suggests fixes and recovery steps
 */
class RecoverySuggester {
  /**
   * Get fix suggestions for code
   * @param {object} diagnosis - Diagnosis from ErrorDiagnoser
   * @returns {array} Suggested fixes
   */
  suggestFixes(diagnosis) {
    const suggestions = [];

    diagnosis.critical_errors.forEach((error, idx) => {
      const suggestion = {
        error_index: idx,
        error_type: error.type,
        priority: error.severity === 'error' ? 'HIGH' : 'MEDIUM',
        suggestion: error.recovery_steps
      };

      suggestions.push(suggestion);
    });

    return suggestions;
  }

  /**
   * Get debugging strategies for common issues
   * @param {string} code - Faust code
   * @returns {array} Debugging strategies
   */
  getDebuggingStrategies(code) {
    const strategies = [];

    // Suggest modular testing
    if (code.length > 500) {
      strategies.push({
        name: 'Modular Testing',
        description: 'Code is complex. Test each component independently.',
        steps: [
          '1. Extract smallest test case that fails',
          '2. Test that component in isolation',
          '3. Gradually add complexity',
          '4. Verify each addition works'
        ]
      });
    }

    // Suggest incremental building
    if (!code.includes('import')) {
      strategies.push({
        name: 'Library Import Check',
        description: 'Library functions may require explicit import.',
        steps: [
          '1. Check if using library functions (ba.*, ma.*, fi.*, etc.)',
          '2. Add: import("stdfaust.lib");',
          '3. Test compilation again'
        ]
      });
    }

    // Suggest block diagram visualization
    strategies.push({
      name: 'Block Diagram Visualization',
      description: 'Generate visual block diagram to understand signal flow.',
      command: 'faust -svg mycode.dsp',
      benefit: 'Immediately reveals I/O dimension mismatches'
    });

    // Suggest compiler flag testing
    strategies.push({
      name: 'Compiler Diagnostics',
      description: 'Use compiler flags for more detailed error information.',
      flags: [
        'faust -c mycode.dsp           // Basic syntax check',
        'faust -wall mycode.dsp        // All warnings',
        'faust -me mycode.dsp          // Math exceptions',
        'faust -ct 1 mycode.dsp        // Table range checking'
      ]
    });

    return strategies;
  }
}

/**
 * DiagnosticReporter: Generates detailed diagnostic reports
 */
class DiagnosticReporter {
  /**
   * Generate comprehensive diagnostic report
   * @param {string} code - Faust code
   * @param {object} diagnosis - Diagnosis from ErrorDiagnoser
   * @returns {string} Formatted report
   */
  generateReport(code, diagnosis) {
    const lines = [];

    lines.push('╔════════════════════════════════════════════════════════════╗');
    lines.push('║           FAUST DIAGNOSTIC REPORT                          ║');
    lines.push('╚════════════════════════════════════════════════════════════╝');
    lines.push('');
    lines.push(`Timestamp: ${diagnosis.timestamp}`);
    lines.push(`Code Length: ${diagnosis.code_length} characters`);
    lines.push('');
    lines.push('─────────────────────────────────────────────────────────────');
    lines.push('SUMMARY');
    lines.push('─────────────────────────────────────────────────────────────');

    if (diagnosis.errors_found === 0) {
      lines.push('✓ No errors detected!');
      lines.push(`Overall Status: ${diagnosis.test_results_summary.overall_status}`);
    } else {
      lines.push(`✗ ${diagnosis.errors_found} error(s) found`);
      lines.push(`Critical Errors: ${diagnosis.critical_errors.length}`);
      lines.push(`Warnings: ${diagnosis.warnings.length}`);
    }

    lines.push('');
    lines.push('─────────────────────────────────────────────────────────────');
    lines.push('DETAILED ERRORS');
    lines.push('─────────────────────────────────────────────────────────────');

    diagnosis.critical_errors.forEach((error, idx) => {
      lines.push('');
      lines.push(`Error ${idx + 1}: ${error.type}`);
      lines.push(`Message: ${error.message}`);
      lines.push(`Severity: ${error.severity}`);

      if (error.recovery_steps.length > 0) {
        lines.push('');
        lines.push('Recovery Steps:');
        error.recovery_steps.forEach(step => {
          lines.push(`  ${step.step}. ${step.action}`);
          if (step.details) lines.push(`     Details: ${step.details}`);
          if (step.example) lines.push(`     Example: ${step.example}`);
          if (step.fix_options) {
            lines.push('     Options:');
            step.fix_options.forEach(opt => lines.push(`       - ${opt}`));
          }
        });
      }

      if (error.examples.incorrect.length > 0) {
        lines.push('');
        lines.push('Code Examples:');
        lines.push('  ✗ Incorrect:');
        error.examples.incorrect.forEach(ex => lines.push(`    ${ex}`));
        lines.push('  ✓ Correct:');
        error.examples.correct.forEach(ex => lines.push(`    ${ex}`));
      }
    });

    if (diagnosis.warnings.length > 0) {
      lines.push('');
      lines.push('─────────────────────────────────────────────────────────────');
      lines.push('WARNINGS');
      lines.push('─────────────────────────────────────────────────────────────');

      diagnosis.warnings.forEach((warn, idx) => {
        lines.push(`${idx + 1}. ${warn.message || warn}`);
      });
    }

    return lines.join('\n');
  }

  /**
   * Generate quick fix report
   * @param {object} diagnosis - Diagnosis
   * @param {array} suggestions - Fix suggestions
   * @returns {string} Quick fix report
   */
  generateQuickFixReport(diagnosis, suggestions) {
    const lines = [];

    lines.push('╔════════════════════════════════════════════════════════════╗');
    lines.push('║                QUICK FIX GUIDE                             ║');
    lines.push('╚════════════════════════════════════════════════════════════╝');
    lines.push('');
    lines.push('Fix these issues in order:');
    lines.push('');

    suggestions.forEach((suggestion, idx) => {
      lines.push(`${idx + 1}. ${suggestion.error_type} Error (Priority: ${suggestion.priority})`);
      suggestion.suggestion.forEach(step => {
        if (step.action) {
          lines.push(`   • ${step.action}`);
          if (step.example) lines.push(`     Example: ${step.example}`);
        }
      });
      lines.push('');
    });

    lines.push('Once fixed, re-run: node testing-framework.js yourcode.dsp');

    return lines.join('\n');
  }
}

/**
 * DebuggingSession: Interactive debugging session
 */
class DebuggingSession {
  constructor() {
    this.diagnoser = new ErrorDiagnoser();
    this.suggester = new RecoverySuggester();
    this.reporter = new DiagnosticReporter();
  }

  /**
   * Run full debugging session on code
   * @param {string} code - Faust code
   * @returns {object} Complete debugging output
   */
  async runFullSession(code) {
    const session = {
      timestamp: new Date().toISOString(),
      stages: {}
    };

    // Stage 1: Diagnose
    session.stages.diagnosis = await this.diagnoser.diagnoseCode(code);

    // Stage 2: Suggest
    session.stages.suggestions = this.suggester.suggestFixes(session.stages.diagnosis);
    session.stages.strategies = this.suggester.getDebuggingStrategies(code);

    // Stage 3: Report
    session.stages.detailed_report = this.reporter.generateReport(code, session.stages.diagnosis);
    session.stages.quick_fix = this.reporter.generateQuickFixReport(
      session.stages.diagnosis,
      session.stages.suggestions
    );

    return session;
  }
}

// Export classes
module.exports = {
  ErrorDiagnoser,
  RecoverySuggester,
  DiagnosticReporter,
  DebuggingSession
};

// CLI support
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: node debugging-framework.js <faust-file> [--quick-fix]');
    process.exit(1);
  }

  const filePath = args[0];
  const quickFix = args.includes('--quick-fix');

  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found: ${filePath}`);
    process.exit(1);
  }

  const code = fs.readFileSync(filePath, 'utf8');
  const session = new DebuggingSession();

  session.runFullSession(code).then(result => {
    if (quickFix) {
      console.log(result.stages.quick_fix);
    } else {
      console.log(result.stages.detailed_report);
      console.log('');
      console.log('─────────────────────────────────────────────────────────────');
      console.log('DEBUGGING STRATEGIES');
      console.log('─────────────────────────────────────────────────────────────');
      result.stages.strategies.forEach(strategy => {
        console.log('');
        console.log(`• ${strategy.name}`);
        if (strategy.description) console.log(`  ${strategy.description}`);
        if (strategy.steps) {
          strategy.steps.forEach(step => console.log(`  ${step}`));
        }
        if (strategy.command) console.log(`  Command: ${strategy.command}`);
        if (strategy.flags) {
          strategy.flags.forEach(flag => console.log(`  ${flag}`));
        }
      });
    }
  }).catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
}
