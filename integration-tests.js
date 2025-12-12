#!/usr/bin/env node

/**
 * Faust MCP Integration Test Suite
 *
 * Comprehensive testing of all MCP tools together:
 * - Testing framework validation
 * - Debugging framework validation
 * - Syntax analyzer validation
 * - End-to-end workflows
 * - Pattern coverage testing
 * - Error scenario testing
 * - Edge case testing
 */

const { TestRunner } = require('./testing-framework');
const { DebuggingSession } = require('./debugging-framework');
const { SyntaxAnalyzerTool } = require('./syntax-analyzer');

/**
 * IntegrationTestSuite: Orchestrates comprehensive testing
 */
class IntegrationTestSuite {
  constructor() {
    this.testRunner = new TestRunner();
    this.debugSession = new DebuggingSession();
    this.syntaxTool = new SyntaxAnalyzerTool();
    this.results = {
      timestamp: new Date().toISOString(),
      tests: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        errors: []
      }
    };
  }

  /**
   * Run complete integration test suite
   */
  async runFullSuite() {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║     FAUST MCP COMPREHENSIVE INTEGRATION TEST SUITE          ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('Starting tests...\n');

    // Test Groups
    await this.testFrameworkIntegration();
    await this.testWorkflows();
    await this.testPatterns();
    await this.testErrorScenarios();
    await this.testEdgeCases();

    return this.results;
  }

  /**
   * Test framework integration
   */
  async testFrameworkIntegration() {
    console.log('═══ FRAMEWORK INTEGRATION TESTS ═══\n');

    // Test 1: Testing framework standalone
    await this.runTest('TEST-1', 'Testing framework: Basic syntax validation', async () => {
      const code = 'import("stdfaust.lib"); process = sin(440);';
      const result = await this.testRunner.runFullTestSuite(code);
      return result.summary.overall_status === 'PASS';
    });

    // Test 2: Debugging framework standalone
    await this.runTest('TEST-2', 'Debugging framework: Error diagnosis', async () => {
      const code = 'wrong syntax here';
      const result = await this.debugSession.runFullSession(code);
      return result.stages.diagnosis.errors_found > 0;
    });

    // Test 3: Syntax analyzer standalone
    await this.runTest('TEST-3', 'Syntax analyzer: Complete analysis', async () => {
      const code = 'import("stdfaust.lib"); process = sin(440);';
      const result = this.syntaxTool.analyzeComplete(code);
      return result.summary.syntax_valid && result.overall_quality >= 60;
    });

    // Test 4: Testing + Debugging integration
    await this.runTest('TEST-4', 'Testing + Debugging integration', async () => {
      const code = 'freq = hslider("f", 440, 20, 20000, 1)\nprocess = freq : sin;';
      const testResult = await this.testRunner.runFullTestSuite(code);
      if (!testResult.summary.overall_status === 'PASS') {
        const debugResult = await this.debugSession.runFullSession(code);
        return debugResult.stages.diagnosis.errors_found > 0;
      }
      return true;
    });

    // Test 5: Testing + Syntax integration
    await this.runTest('TEST-5', 'Testing + Syntax integration', async () => {
      const code = 'import("stdfaust.lib"); process = sin(440);';
      const testResult = await this.testRunner.runFullTestSuite(code);
      const syntaxResult = this.syntaxTool.analyzeComplete(code);
      return testResult.summary.overall_status === 'PASS' && syntaxResult.summary.syntax_valid;
    });

    // Test 6: Full pipeline integration
    await this.runTest('TEST-6', 'Full pipeline: All tools together', async () => {
      const code = 'import("stdfaust.lib"); freq = hslider("freq", 440, 20, 20000, 1); process = freq : si.osc : fi.lowpass(4, 1000);';

      const syntaxResult = this.syntaxTool.analyzeComplete(code);
      const testResult = await this.testRunner.runFullTestSuite(code);
      const debugResult = await this.debugSession.runFullSession(code);

      return syntaxResult.summary.syntax_valid &&
             testResult.summary.overall_status === 'PASS' &&
             debugResult.stages.diagnosis.errors_found === 0;
    });

    console.log('');
  }

  /**
   * Test common workflows
   */
  async testWorkflows() {
    console.log('═══ WORKFLOW TESTS ═══\n');

    // Workflow 1: Write → Test → Debug cycle
    await this.runTest('FLOW-1', 'Workflow: Write → Test → Debug', async () => {
      const code = 'import("stdfaust.lib"); process = hslider("freq", 440, 20, 20000, 1) : sin;';

      // Step 1: Test
      const testResult = await this.testRunner.runFullTestSuite(code);
      if (testResult.summary.overall_status !== 'PASS') {
        // Step 2: Debug
        const debugResult = await this.debugSession.runFullSession(code);
        return debugResult.stages.suggestions.length > 0;
      }
      return true;
    });

    // Workflow 2: Analyze → Lint → Test
    await this.runTest('FLOW-2', 'Workflow: Analyze → Lint → Test', async () => {
      const code = 'import("stdfaust.lib"); freq = hslider("freq", 440, 20, 20000, 1); process = freq : sin;';

      const syntaxResult = this.syntaxTool.analyzeComplete(code);
      if (syntaxResult.linting.summary.total > 0) {
        const testResult = await this.testRunner.runFullTestSuite(code);
        return testResult.summary.overall_status !== 'FAIL';
      }
      return true;
    });

    // Workflow 3: Complex code development
    await this.runTest('FLOW-3', 'Workflow: Complex code development', async () => {
      const code = `
import("stdfaust.lib");

freq = hslider("frequency", 440, 20, 20000, 1);
cutoff = hslider("cutoff", 1000, 20, 20000, 1);
resonance = hslider("resonance", 1, 0.1, 10, 0.1);

oscillator = freq : si.osc;
filtered = fi.lowpass(4, cutoff);

process = oscillator : filtered;
      `;

      const syntaxResult = this.syntaxTool.analyzeComplete(code);
      const testResult = await this.testRunner.runFullTestSuite(code);

      return syntaxResult.summary.syntax_valid &&
             testResult.summary.overall_status === 'PASS' &&
             syntaxResult.structure.patterns.length > 0;
    });

    console.log('');
  }

  /**
   * Test common Faust patterns
   */
  async testPatterns() {
    console.log('═══ FAUST PATTERN COVERAGE TESTS ═══\n');

    const patterns = {
      'FILTER': `import("stdfaust.lib"); process = fi.lowpass(4, 1000);`,
      'OSCILLATOR': `import("stdfaust.lib"); process = 440 : si.osc;`,
      'DELAY': `import("stdfaust.lib"); process = _ @ 44100;`,
      'FEEDBACK': `process = + ~ (_ * 0.5);`,
      'ENVELOPE': `import("stdfaust.lib"); process = en.asr(0.01, 0.1, 0.1);`,
      'PARALLEL': `import("stdfaust.lib"); process = _ <: (fi.lowpass(4, 100), fi.lowpass(4, 1000));`,
      'MIXER': `process = (_ * 0.3), (_ * 0.7) :> _;`,
      'MODULATION': `import("stdfaust.lib"); process = * (440 : si.osc : (_ + 1) : (_ * 0.5));`,
      'RESONATOR': `import("stdfaust.lib"); process = fi.resonator(1000, 10);`,
      'DISTORTION': `process = (_ : * (10) : tanh);`
    };

    for (const [name, code] of Object.entries(patterns)) {
      await this.runTest(`PAT-${name}`, `Pattern: ${name}`, async () => {
        const syntaxResult = this.syntaxTool.analyzeComplete(code);
        const testResult = await this.testRunner.runFullTestSuite(code);

        return syntaxResult.summary.syntax_valid &&
               testResult.summary.overall_status !== 'FAIL';
      });
    }

    console.log('');
  }

  /**
   * Test error scenarios
   */
  async testErrorScenarios() {
    console.log('═══ ERROR SCENARIO TESTS ═══\n');

    const errors = {
      'MISSING_SEMICOLON': 'freq = hslider("freq", 440, 20, 20000, 1)\nprocess = sin;',
      'UNDEFINED_SYMBOL': 'process = undefinedFunction;',
      'NO_PROCESS': 'import("stdfaust.lib"); freq = 440;',
      'UNMATCHED_BRACKET': 'process = (sin(440);',
      'DOMAIN_ERROR': 'process = sqrt(-1);',
      'RANGE_ERROR': 'freq = hslider("f", 100, 200, 500, 1); process = freq;',
      'MISSING_IMPORT': 'process = lowpass(4, 1000);',
      'DUPLICATE_DEFINITION': 'f = sin; f = cos; process = f;',
      'BOX_DIMENSION': 'process = (a, b) : c;',
      'NEGATIVE_SQRT': 'process = hslider("v", -0.5, -1, 1, 0.1) : sqrt;'
    };

    for (const [name, code] of Object.entries(errors)) {
      await this.runTest(`ERR-${name}`, `Error scenario: ${name}`, async () => {
        const syntaxResult = this.syntaxTool.analyzeComplete(code);
        const debugResult = await this.debugSession.runFullSession(code);

        // Should detect errors in both
        return (syntaxResult.syntax.errors.length > 0 ||
                syntaxResult.linting.summary.errors > 0) &&
               debugResult.stages.diagnosis.errors_found > 0;
      });
    }

    console.log('');
  }

  /**
   * Test edge cases
   */
  async testEdgeCases() {
    console.log('═══ EDGE CASE TESTS ═══\n');

    // Edge case 1: Empty code
    await this.runTest('EDGE-1', 'Edge case: Empty code', async () => {
      const code = '';
      const syntaxResult = this.syntaxTool.analyzeComplete(code);
      return syntaxResult.linting.summary.total >= 0; // Should complete without crash
    });

    // Edge case 2: Only comments
    await this.runTest('EDGE-2', 'Edge case: Only comments', async () => {
      const code = '// This is a comment\n/* Block comment */';
      const syntaxResult = this.syntaxTool.analyzeComplete(code);
      return true; // Should complete without crash
    });

    // Edge case 3: Very long code
    await this.runTest('EDGE-3', 'Edge case: Very long code', async () => {
      let code = 'import("stdfaust.lib");\n';
      for (let i = 0; i < 100; i++) {
        code += `f${i} = * (${i});\n`;
      }
      code += 'process = f99;';

      const syntaxResult = this.syntaxTool.analyzeComplete(code);
      return syntaxResult.syntax.metrics.definitions > 50;
    });

    // Edge case 4: Deeply nested expressions
    await this.runTest('EDGE-4', 'Edge case: Deeply nested', async () => {
      let code = 'process = (((((';
      for (let i = 0; i < 10; i++) code += 'sin(';
      code += '440';
      for (let i = 0; i < 10; i++) code += ')';
      for (let i = 0; i < 5; i++) code += ')';
      code += ';';

      const syntaxResult = this.syntaxTool.analyzeComplete(code);
      return syntaxResult.structure.complexity.max_nesting > 0;
    });

    // Edge case 5: Unicode and special characters
    await this.runTest('EDGE-5', 'Edge case: Special characters', async () => {
      const code = 'f_oo_bar = sin; process = f_oo_bar;';
      const syntaxResult = this.syntaxTool.analyzeComplete(code);
      return syntaxResult.summary.syntax_valid;
    });

    // Edge case 6: Multiple imports
    await this.runTest('EDGE-6', 'Edge case: Multiple imports', async () => {
      const code = 'import("stdfaust.lib");\nimport("stdfaust.lib");\nprocess = sin;';
      const syntaxResult = this.syntaxTool.analyzeComplete(code);
      return syntaxResult.syntax.ast.imports.length > 0;
    });

    // Edge case 7: Mix of operators
    await this.runTest('EDGE-7', 'Edge case: Complex operators', async () => {
      const code = 'process = (a : b, c <: d :> e) ~ f;';
      const syntaxResult = this.syntaxTool.analyzeComplete(code);
      return true; // Should parse without error
    });

    // Edge case 8: Slider parameter edge values
    await this.runTest('EDGE-8', 'Edge case: Slider bounds', async () => {
      const code = 'f = hslider("f", 0, 0, 0, 0); process = f;';
      const syntaxResult = this.syntaxTool.analyzeComplete(code);
      return true; // Should handle degenerate range
    });

    console.log('');
  }

  /**
   * Run individual test
   */
  async runTest(id, name, testFn) {
    const startTime = Date.now();
    let passed = false;
    let error = null;

    try {
      passed = await testFn();
    } catch (err) {
      error = err.message;
      this.results.summary.errors.push(`${id}: ${err.message}`);
    }

    const duration = Date.now() - startTime;
    const status = passed ? 'PASS' : 'FAIL';
    const symbol = passed ? '✓' : '✗';

    console.log(`${symbol} ${id}: ${name} (${duration}ms)`);
    if (error) console.log(`   Error: ${error}`);

    this.results.tests.push({
      id,
      name,
      status,
      duration,
      error
    });

    this.results.summary.total++;
    if (passed) {
      this.results.summary.passed++;
    } else {
      this.results.summary.failed++;
    }
  }

  /**
   * Generate test report
   */
  generateReport() {
    const lines = [];

    lines.push('╔════════════════════════════════════════════════════════════╗');
    lines.push('║         INTEGRATION TEST RESULTS REPORT                     ║');
    lines.push('╚════════════════════════════════════════════════════════════╝');
    lines.push('');
    lines.push(`Timestamp: ${this.results.timestamp}`);
    lines.push('');
    lines.push('─────────────────────────────────────────────────────────────');
    lines.push('SUMMARY');
    lines.push('─────────────────────────────────────────────────────────────');
    lines.push(`Total Tests: ${this.results.summary.total}`);
    lines.push(`Passed: ${this.results.summary.passed} (${(this.results.summary.passed / this.results.summary.total * 100).toFixed(1)}%)`);
    lines.push(`Failed: ${this.results.summary.failed} (${(this.results.summary.failed / this.results.summary.total * 100).toFixed(1)}%)`);
    lines.push('');

    if (this.results.summary.failed > 0) {
      lines.push('FAILED TESTS:');
      this.results.tests.filter(t => t.status === 'FAIL').forEach(t => {
        lines.push(`  ✗ ${t.id}: ${t.name}`);
        if (t.error) lines.push(`    ${t.error}`);
      });
      lines.push('');
    }

    lines.push('─────────────────────────────────────────────────────────────');
    lines.push('TEST DETAILS');
    lines.push('─────────────────────────────────────────────────────────────');

    const grouped = {};
    this.results.tests.forEach(t => {
      const group = t.id.split('-')[0];
      if (!grouped[group]) grouped[group] = [];
      grouped[group].push(t);
    });

    Object.entries(grouped).forEach(([group, tests]) => {
      const passed = tests.filter(t => t.status === 'PASS').length;
      const total = tests.length;
      lines.push(`\n${group} Tests: ${passed}/${total}`);
      tests.forEach(t => {
        const symbol = t.status === 'PASS' ? '✓' : '✗';
        lines.push(`  ${symbol} ${t.id}: ${t.name}`);
      });
    });

    lines.push('');

    if (this.results.summary.errors.length > 0) {
      lines.push('─────────────────────────────────────────────────────────────');
      lines.push('ERRORS');
      lines.push('─────────────────────────────────────────────────────────────');
      this.results.summary.errors.forEach(err => {
        lines.push(`  • ${err}`);
      });
      lines.push('');
    }

    return lines.join('\n');
  }
}

// Run tests if called directly
if (require.main === module) {
  const suite = new IntegrationTestSuite();

  suite.runFullSuite().then(() => {
    console.log(suite.generateReport());

    const allPassed = suite.results.summary.failed === 0;
    process.exit(allPassed ? 0 : 1);
  }).catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}

module.exports = { IntegrationTestSuite };
