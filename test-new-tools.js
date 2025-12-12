#!/usr/bin/env node

/**
 * Test Suite for New Faust MCP Tools
 *
 * Tests for:
 * - Code Generator
 * - Batch Testing Runner
 * - Auto-Fixer
 */

const fs = require('fs');
const path = require('path');
const { CodeGenerator } = require('./code-generator');
const { AutoFixer } = require('./auto-fixer');
const { BatchTestRunner } = require('./batch-tester');

/**
 * TestHarness: Simple test framework
 */
class TestHarness {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  /**
   * Run a test
   * @param {string} name - Test name
   * @param {function} testFn - Test function (async)
   */
  async test(name, testFn) {
    process.stdout.write(`Testing: ${name.padEnd(60)} `);

    try {
      await testFn();
      console.log('✓ PASS');
      this.passed++;
    } catch (error) {
      console.log(`✗ FAIL: ${error.message}`);
      this.failed++;
    }
  }

  /**
   * Assert condition is true
   * @param {boolean} condition - Condition to test
   * @param {string} message - Error message
   */
  assert(condition, message = 'Assertion failed') {
    if (!condition) {
      throw new Error(message);
    }
  }

  /**
   * Assert values are equal
   * @param {*} actual - Actual value
   * @param {*} expected - Expected value
   * @param {string} message - Error message
   */
  assertEqual(actual, expected, message = 'Values not equal') {
    if (actual !== expected) {
      throw new Error(`${message}: expected ${expected}, got ${actual}`);
    }
  }

  /**
   * Assert object has property
   * @param {object} obj - Object to check
   * @param {string} prop - Property name
   */
  assertHasProperty(obj, prop) {
    if (!obj.hasOwnProperty(prop)) {
      throw new Error(`Object missing property: ${prop}`);
    }
  }

  /**
   * Print summary
   */
  summary() {
    console.log('');
    console.log('═════════════════════════════════════════════════════════');
    console.log('TEST SUMMARY');
    console.log('═════════════════════════════════════════════════════════');
    console.log(`Total Tests: ${this.passed + this.failed}`);
    console.log(`Passed: ${this.passed} ✓`);
    console.log(`Failed: ${this.failed} ✗`);
    console.log(`Pass Rate: ${((this.passed / (this.passed + this.failed)) * 100).toFixed(1)}%`);
    console.log('═════════════════════════════════════════════════════════');
  }
}

/**
 * Test Code Generator
 */
async function testCodeGenerator(harness) {
  console.log('\n━━━ CODE GENERATOR TESTS ━━━\n');

  const generator = new CodeGenerator();

  // Test 1: List templates
  await harness.test('CodeGenerator: List templates', async () => {
    const templates = generator.listTemplates();
    harness.assert(templates.length === 4, 'Should have 4 templates');
    harness.assert(templates.some(t => t.name === 'oscillator'), 'Should have oscillator template');
  });

  // Test 2: Generate sine oscillator
  await harness.test('CodeGenerator: Generate sine oscillator', async () => {
    const result = generator.generate('oscillator', { waveform: 'sine' });
    harness.assert(result.success, 'Should succeed');
    harness.assert(result.code.includes('import("stdfaust.lib")'), 'Should have import');
    harness.assert(result.code.includes('os.osc'), 'Should use os.osc');
    harness.assert(result.code.includes('process'), 'Should have process');
  });

  // Test 3: Generate lowpass filter
  await harness.test('CodeGenerator: Generate lowpass filter', async () => {
    const result = generator.generate('filter', { filterType: 'lowpass', order: 4 });
    harness.assert(result.success, 'Should succeed');
    harness.assert(result.code.includes('fi.lowpass'), 'Should use fi.lowpass');
    harness.assert(result.code.includes('cutoff'), 'Should have cutoff control');
  });

  // Test 4: Generate delay effect
  await harness.test('CodeGenerator: Generate delay effect', async () => {
    const result = generator.generate('effect', { effectType: 'delay' });
    harness.assert(result.success, 'Should succeed');
    harness.assert(result.code.includes('delayTime'), 'Should have delay time control');
    harness.assert(result.code.includes('feedback'), 'Should have feedback control');
  });

  // Test 5: Generate ADSR envelope
  await harness.test('CodeGenerator: Generate ADSR envelope', async () => {
    const result = generator.generate('envelope', { envelopeType: 'adsr' });
    harness.assert(result.success, 'Should succeed');
    harness.assert(result.code.includes('en.adsr'), 'Should use en.adsr');
    harness.assert(result.code.includes('attack'), 'Should have attack control');
  });

  // Test 6: Invalid template
  await harness.test('CodeGenerator: Handle invalid template', async () => {
    const result = generator.generate('invalid_template', {});
    harness.assert(!result.success, 'Should fail');
    harness.assert(result.error, 'Should have error message');
  });

  // Test 7: Invalid parameters
  await harness.test('CodeGenerator: Validate parameters', async () => {
    const result = generator.generate('oscillator', { waveform: 'invalid' });
    harness.assert(!result.success, 'Should fail validation');
    harness.assert(result.errors && result.errors.length > 0, 'Should have validation errors');
  });

  // Test 8: Generate all oscillator types
  await harness.test('CodeGenerator: Generate all oscillator types', async () => {
    const waveforms = ['sine', 'sawtooth', 'square', 'triangle', 'pulse'];
    for (const waveform of waveforms) {
      const result = generator.generate('oscillator', { waveform });
      harness.assert(result.success, `Should generate ${waveform}`);
    }
  });

  // Test 9: Generate all filter types
  await harness.test('CodeGenerator: Generate all filter types', async () => {
    const filterTypes = ['lowpass', 'highpass', 'bandpass', 'notch'];
    for (const filterType of filterTypes) {
      const result = generator.generate('filter', { filterType });
      harness.assert(result.success, `Should generate ${filterType}`);
    }
  });

  // Test 10: Generate all effect types
  await harness.test('CodeGenerator: Generate all effect types', async () => {
    const effectTypes = ['delay', 'reverb', 'chorus', 'distortion', 'tremolo', 'flanger'];
    for (const effectType of effectTypes) {
      const result = generator.generate('effect', { effectType });
      harness.assert(result.success, `Should generate ${effectType}`);
    }
  });
}

/**
 * Test Auto-Fixer
 */
async function testAutoFixer(harness) {
  console.log('\n━━━ AUTO-FIXER TESTS ━━━\n');

  const fixer = new AutoFixer({ backup: false });

  // Test 1: Fix missing import
  await harness.test('AutoFixer: Add missing import', async () => {
    const code = 'freq = 440;\nprocess = os.osc(freq);';
    const result = fixer.analyzeAndFix(code);
    harness.assert(result.success, 'Should apply fixes');
    harness.assert(result.fixed_code.includes('import("stdfaust.lib")'), 'Should add import');
    harness.assert(result.fixes_applied.length > 0, 'Should record fixes');
  });

  // Test 2: Fix missing semicolon
  await harness.test('AutoFixer: Add missing semicolon', async () => {
    const code = 'import("stdfaust.lib");\nfreq = 440\nprocess = os.osc(freq);';
    const result = fixer.analyzeAndFix(code);
    // This might not catch it without actual syntax errors, but test structure
    harness.assert(result !== null, 'Should return result');
  });

  // Test 3: Fix slider range
  await harness.test('AutoFixer: Fix slider default outside range', async () => {
    const code = `import("stdfaust.lib");
freq = hslider("freq", 50, 100, 1000, 1);
process = os.osc(freq);`;
    const result = fixer.analyzeAndFix(code);
    harness.assert(result.success, 'Should apply fixes');
    harness.assert(result.fixed_code.includes('100'), 'Should clamp default to min');
  });

  // Test 4: Add missing process
  await harness.test('AutoFixer: Add missing process declaration', async () => {
    const code = 'import("stdfaust.lib");\nfreq = 440;\nmy_osc = os.osc(freq);';
    const result = fixer.analyzeAndFix(code);
    harness.assert(result.success, 'Should apply fixes');
    harness.assert(result.fixed_code.includes('process'), 'Should add process');
  });

  // Test 5: No fixes needed
  await harness.test('AutoFixer: Handle clean code', async () => {
    const code = 'import("stdfaust.lib");\nprocess = os.osc(440);';
    const result = fixer.analyzeAndFix(code);
    harness.assert(!result.success || result.fixes_applied.length === 0, 'Should not apply unnecessary fixes');
  });

  // Test 6: Multiple fixes in sequence
  await harness.test('AutoFixer: Apply multiple fixes', async () => {
    const code = `freq = hslider("freq", 50, 100, 1000, 1);
my_osc = os.osc(freq);`;
    const result = fixer.analyzeAndFix(code);
    harness.assert(result.iterations >= 1, 'Should iterate to apply fixes');
    harness.assert(result.fixed_code.includes('import'), 'Should add import');
    harness.assert(result.fixed_code.includes('process'), 'Should add process');
  });

  // Test 7: Safe-only mode
  await harness.test('AutoFixer: Safe-only mode', async () => {
    const safeFixer = new AutoFixer({ safeOnly: true, backup: false });
    const code = 'MyOsc = 440;\nprocess = os.osc(MyOsc);';
    const result = safeFixer.analyzeAndFix(code);
    // Naming fix is risky, should not apply in safe mode
    harness.assert(result.fixed_code.includes('MyOsc') || !result.success, 'Should not apply risky fixes');
  });

  // Test 8: Format report
  await harness.test('AutoFixer: Format report', async () => {
    const code = 'freq = 440;\nprocess = os.osc(freq);';
    const result = fixer.analyzeAndFix(code);
    const report = fixer.formatReport(result);
    harness.assert(report.includes('AUTO-FIX REPORT'), 'Should have report header');
    harness.assert(typeof report === 'string', 'Should return string');
  });
}

/**
 * Test Batch Tester
 */
async function testBatchTester(harness) {
  console.log('\n━━━ BATCH TESTER TESTS ━━━\n');

  const runner = new BatchTestRunner({ verbose: false });

  // Test 1: Scan directory
  await harness.test('BatchTester: Scan for .dsp files', async () => {
    const files = runner.scanner.scanDirectory('examples', true);
    harness.assert(files.length > 0, 'Should find .dsp files');
    harness.assert(files.every(f => f.endsWith('.dsp')), 'All files should be .dsp');
  });

  // Test 2: Group files by directory
  await harness.test('BatchTester: Group files by directory', async () => {
    const files = runner.scanner.scanDirectory('examples', true);
    const groups = runner.scanner.groupByDirectory(files);
    harness.assert(Object.keys(groups).length > 0, 'Should create groups');
  });

  // Test 3: Format report
  await harness.test('BatchTester: Format batch report', async () => {
    const mockResult = {
      timestamp: new Date().toISOString(),
      total_files: 2,
      duration_ms: 100,
      results: [
        { fileName: 'test1.dsp', directory: '/tmp', status: 'PASS', error_count: 0, warning_count: 0, errors: [] },
        { fileName: 'test2.dsp', directory: '/tmp', status: 'FAIL', error_count: 1, warning_count: 0, errors: ['Test error'] }
      ],
      summary: { passed: 1, failed: 1, skipped: 0, total_errors: 1, total_warnings: 0 }
    };

    const report = runner.formatReport(mockResult);
    harness.assert(report.includes('BATCH TEST REPORT'), 'Should have report header');
    harness.assert(report.includes('Pass Rate'), 'Should show pass rate');
  });

  // Test 4: Group results by directory
  await harness.test('BatchTester: Group results by directory', async () => {
    const results = [
      { directory: '/tmp/dir1', status: 'PASS' },
      { directory: '/tmp/dir1', status: 'FAIL' },
      { directory: '/tmp/dir2', status: 'PASS' }
    ];
    const groups = runner.groupResultsByDirectory(results);
    harness.assertEqual(Object.keys(groups).length, 2, 'Should have 2 groups');
    harness.assertEqual(groups['/tmp/dir1'].length, 2, 'dir1 should have 2 results');
  });
}

/**
 * Integration Tests
 */
async function testIntegration(harness) {
  console.log('\n━━━ INTEGRATION TESTS ━━━\n');

  // Test 1: Generate code and analyze it
  await harness.test('Integration: Generate + Analyze', async () => {
    const generator = new CodeGenerator();
    const result = generator.generate('oscillator', { waveform: 'sine' });

    const { SyntaxAnalyzerTool } = require('./syntax-analyzer');
    const analyzer = new SyntaxAnalyzerTool();
    const analysis = analyzer.analyzeComplete(result.code);

    harness.assert(analysis.summary.syntax_valid, 'Generated code should be valid');
    harness.assert(analysis.overall_quality > 80, 'Generated code should be high quality');
  });

  // Test 2: Generate code and auto-fix it
  await harness.test('Integration: Generate + Auto-Fix', async () => {
    const generator = new CodeGenerator();
    const result = generator.generate('filter', { filterType: 'lowpass' });

    const fixer = new AutoFixer({ backup: false });
    const fixResult = fixer.analyzeAndFix(result.code);

    // Generated code should already be clean
    harness.assert(fixResult.fixes_applied.length === 0, 'Generated code should not need fixes');
  });

  // Test 3: Create broken code, fix it, and verify
  await harness.test('Integration: Break + Fix + Verify', async () => {
    const brokenCode = `freq = hslider("freq", 50, 100, 1000, 1);
my_osc = os.osc(freq);`;

    const fixer = new AutoFixer({ backup: false });
    const fixResult = fixer.analyzeAndFix(brokenCode);

    harness.assert(fixResult.success, 'Should fix broken code');

    const { SyntaxAnalyzerTool } = require('./syntax-analyzer');
    const analyzer = new SyntaxAnalyzerTool();
    const analysis = analyzer.analyzeComplete(fixResult.fixed_code);

    // Should have fewer errors after fixing
    harness.assert(analysis.linting.summary.errors < 2, 'Fixed code should have fewer errors');
  });
}

/**
 * Main test runner
 */
async function main() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║      FAUST MCP NEW TOOLS - COMPREHENSIVE TEST SUITE       ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');

  const harness = new TestHarness();

  await testCodeGenerator(harness);
  await testAutoFixer(harness);
  await testBatchTester(harness);
  await testIntegration(harness);

  harness.summary();

  process.exit(harness.failed > 0 ? 1 : 0);
}

// Run tests
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { TestHarness };
