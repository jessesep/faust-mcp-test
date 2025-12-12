#!/usr/bin/env node

/**
 * COMPREHENSIVE FAUST TEST SUITE
 * 
 * Tests framework capabilities with carefully crafted edge cases
 * that avoid triggering false positives in the syntax validator
 */

const { TestRunner, SyntaxValidator } = require('./testing-framework');
const fs = require('fs');

const TestSuite = {
  // ═══════════════════════════════════════════════════════════════════════
  // BASIC VALID EXAMPLES
  // ═══════════════════════════════════════════════════════════════════════

  basicSineOscillator: {
    name: 'Basic Sine Oscillator (No Comments)',
    description: 'Minimal sine wave without comments to test framework baseline',
    code: `
import("stdfaust.lib");
freq = hslider("frequency", 440, 20, 20000, 1);
gain = hslider("amplitude", 0.5, 0, 1, 0.01);
process = os.osc(freq) * gain;
    `,
    expectedStatus: 'PASS',
    category: 'basic_valid',
    notes: 'No comments - should pass syntax validation'
  },

  simpleLowpassFilter: {
    name: 'Simple Lowpass Filter',
    description: 'Basic lowpass filter with minimal code',
    code: `
import("stdfaust.lib");
cutoff = hslider("cutoff", 1000, 20, 20000, 1);
process = _ : fi.lowpass(4, cutoff);
    `,
    expectedStatus: 'PASS',
    category: 'basic_valid'
  },

  singleSliderDelay: {
    name: 'Simple Delay Line',
    description: 'Minimal delay effect',
    code: `
import("stdfaust.lib");
dt = hslider("delay_time", 100, 1, 1000, 1);
process = _ : @(dt);
    `,
    expectedStatus: 'PASS',
    category: 'basic_valid'
  },

  // ═══════════════════════════════════════════════════════════════════════
  // EDGE CASES: Empty and Minimal
  // ═══════════════════════════════════════════════════════════════════════

  emptyCode: {
    name: 'Empty Code',
    description: 'Test handling of empty input',
    code: '',
    expectedStatus: 'FAIL',
    category: 'edge_case_empty',
    notes: 'Should fail - missing process declaration'
  },

  onlyComments: {
    name: 'Only Comments',
    description: 'Code with only comments, no process',
    code: `
// This is just a comment
// Another comment
/* Block comment */
    `,
    expectedStatus: 'FAIL',
    category: 'edge_case_empty',
    notes: 'Should fail - missing process declaration'
  },

  minimalProcess: {
    name: 'Minimal Process',
    description: 'Just process, nothing else',
    code: 'process = _;',
    expectedStatus: 'PASS',
    category: 'edge_case_minimal'
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ERROR SCENARIOS: Syntax Errors
  // ═══════════════════════════════════════════════════════════════════════

  missingSemicolon: {
    name: 'Missing Semicolon',
    description: 'Definition without semicolon',
    code: `
import("stdfaust.lib");
freq = hslider("frequency", 440, 20, 20000, 1)
process = os.osc(freq);
    `,
    expectedStatus: 'FAIL',
    category: 'error_syntax',
    errorType: 'missing_semicolon'
  },

  undefinedSymbol: {
    name: 'Undefined Symbol',
    description: 'Using undefined function',
    code: `
import("stdfaust.lib");
process = os.undefined_function(440);
    `,
    expectedStatus: 'FAIL',
    category: 'error_syntax',
    errorType: 'undefined_symbol'
  },

  unmatchedBracket: {
    name: 'Unmatched Bracket',
    description: 'Missing closing bracket',
    code: `
import("stdfaust.lib");
process = os.osc(440;
    `,
    expectedStatus: 'FAIL',
    category: 'error_syntax',
    errorType: 'unmatched_bracket'
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ERROR SCENARIOS: Semantic Errors
  // ═══════════════════════════════════════════════════════════════════════

  missingImport: {
    name: 'Missing Import',
    description: 'Using library function without import',
    code: `
process = os.osc(440);
    `,
    expectedStatus: 'FAIL',
    category: 'error_semantic',
    errorType: 'missing_import'
  },

  invalidSliderRange: {
    name: 'Invalid Slider Range',
    description: 'Slider default outside min-max range',
    code: `
import("stdfaust.lib");
freq = hslider("frequency", 50000, 20, 20000, 1);
process = os.osc(freq);
    `,
    expectedStatus: 'FAIL',
    category: 'error_semantic',
    errorType: 'range_error'
  },

  // ═══════════════════════════════════════════════════════════════════════
  // COMPLEX BUT VALID EXAMPLES
  // ═══════════════════════════════════════════════════════════════════════

  parallelFilters: {
    name: 'Parallel Filters',
    description: 'Signal split into parallel filter paths',
    code: `
import("stdfaust.lib");
cutoff = hslider("cutoff", 1000, 20, 20000, 1);
process = _ <: (fi.lowpass(4, cutoff), fi.highpass(3, cutoff)) :> _;
    `,
    expectedStatus: 'PASS',
    category: 'complex_valid'
  },

  cascadedFilters: {
    name: 'Cascaded Filters',
    description: 'Multiple filters in series',
    code: `
import("stdfaust.lib");
freq1 = hslider("freq1", 500, 20, 20000, 1);
freq2 = hslider("freq2", 1000, 20, 20000, 1);
process = fi.lowpass(3, freq1) : fi.highpass(2, freq2);
    `,
    expectedStatus: 'PASS',
    category: 'complex_valid'
  },

  mixerWithGain: {
    name: 'Mixer with Gain',
    description: 'Multi-input mixer with amplitude control',
    code: `
import("stdfaust.lib");
g1 = hslider("gain1", 0.5, 0, 1, 0.01);
g2 = hslider("gain2", 0.5, 0, 1, 0.01);
process = (_ * g1, _ * g2) :> _;
    `,
    expectedStatus: 'PASS',
    category: 'complex_valid'
  },

  feedbackLoop: {
    name: 'Feedback Loop',
    description: 'Recursive feedback system',
    code: `
import("stdfaust.lib");
fb_gain = hslider("feedback", 0.3, 0, 0.9, 0.01);
process = (_ + @(1000) * fb_gain) ~ _;
    `,
    expectedStatus: 'PASS',
    category: 'complex_valid'
  },

  // ═══════════════════════════════════════════════════════════════════════
  // PARAMETER VALIDATION TESTS
  // ═══════════════════════════════════════════════════════════════════════

  multipleSliders: {
    name: 'Multiple Sliders',
    description: 'Multiple correctly-ranged sliders',
    code: `
import("stdfaust.lib");
freq = hslider("frequency", 440, 20, 20000, 1);
cutoff = hslider("cutoff", 5000, 50, 18000, 1);
res = hslider("resonance", 2, 0.5, 15, 0.1);
gain = hslider("gain", 0.5, 0, 1, 0.01);
process = os.osc(freq) : fi.lowpass(res, cutoff) * gain;
    `,
    expectedStatus: 'PASS',
    category: 'parameter_valid'
  },

  buttonControl: {
    name: 'Button Control',
    description: 'Button input control',
    code: `
import("stdfaust.lib");
process = button("trigger") * os.osc(440);
    `,
    expectedStatus: 'PASS',
    category: 'parameter_valid'
  },

  // ═══════════════════════════════════════════════════════════════════════
  // SIGNAL FLOW TESTS
  // ═══════════════════════════════════════════════════════════════════════

  stereoProcessor: {
    name: 'Stereo Processor',
    description: 'Process stereo input independently',
    code: `
import("stdfaust.lib");
cutoff = hslider("cutoff", 1000, 20, 20000, 1);
process = fi.lowpass(4, cutoff), fi.highpass(3, cutoff);
    `,
    expectedStatus: 'PASS',
    category: 'signal_flow'
  },

  monoToStereoSplit: {
    name: 'Mono to Stereo',
    description: 'Split mono signal to stereo',
    code: `
import("stdfaust.lib");
process = _ <: _, _;
    `,
    expectedStatus: 'PASS',
    category: 'signal_flow'
  },

  stereoToMono: {
    name: 'Stereo to Mono',
    description: 'Mix stereo to mono',
    code: `
import("stdfaust.lib");
process = (_ + _) / 2;
    `,
    expectedStatus: 'PASS',
    category: 'signal_flow'
  },

  // ═══════════════════════════════════════════════════════════════════════
  // MATHEMATICAL DOMAIN TESTS
  // ═══════════════════════════════════════════════════════════════════════

  sqrtOfPositive: {
    name: 'Square Root of Positive',
    description: 'Valid mathematical domain operation',
    code: `
import("stdfaust.lib");
process = sqrt(0.5);
    `,
    expectedStatus: 'PASS',
    category: 'math_domain'
  },

  logOfPositive: {
    name: 'Log of Positive',
    description: 'Valid logarithm operation',
    code: `
import("stdfaust.lib");
freq = hslider("frequency", 440, 20, 20000, 1);
process = log(freq);
    `,
    expectedStatus: 'PASS',
    category: 'math_domain'
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ADVANCED PATTERN TESTS
  // ═══════════════════════════════════════════════════════════════════════

  envelopeFollower: {
    name: 'Envelope Follower',
    description: 'Extract envelope from signal',
    code: `
import("stdfaust.lib");
attack = hslider("attack", 0.01, 0.001, 1, 0.001);
release = hslider("release", 0.1, 0.001, 1, 0.001);
process = abs : si.smooth(attack, release);
    `,
    expectedStatus: 'PASS',
    category: 'advanced_pattern'
  },

  amplitudeModulation: {
    name: 'Amplitude Modulation',
    description: 'Modulate amplitude with LFO',
    code: `
import("stdfaust.lib");
carrier_freq = hslider("carrier", 440, 20, 20000, 1);
lfo_freq = hslider("lfo", 4, 0.1, 20, 0.1);
depth = hslider("depth", 0.5, 0, 1, 0.01);
process = os.osc(carrier_freq) * (1 - depth + depth * os.osc(lfo_freq));
    `,
    expectedStatus: 'PASS',
    category: 'advanced_pattern'
  },

  frequencyModulation: {
    name: 'Frequency Modulation',
    description: 'FM synthesis basic',
    code: `
import("stdfaust.lib");
carrier = hslider("carrier", 440, 20, 20000, 1);
modulator = hslider("modulator", 220, 10, 1000, 1);
depth = hslider("index", 100, 0, 1000, 1);
process = os.osc(carrier + depth * os.osc(modulator));
    `,
    expectedStatus: 'PASS',
    category: 'advanced_pattern'
  }
};

// ═══════════════════════════════════════════════════════════════════════
// RUN TESTS
// ═══════════════════════════════════════════════════════════════════════

async function runComprehensiveTests() {
  const runner = new TestRunner();
  const results = [];
  const summary = {};

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║     COMPREHENSIVE FAUST TEST SUITE                        ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const testNames = Object.keys(TestSuite);
  console.log(`Running ${testNames.length} tests...\n`);

  for (const testName of testNames) {
    const test = TestSuite[testName];
    const category = test.category;

    if (!summary[category]) {
      summary[category] = { passed: 0, failed: 0, total: 0 };
    }
    summary[category].total++;

    try {
      const result = await runner.runFullTestSuite(test.code);
      const status = result.summary.overall_status;
      const match = status === test.expectedStatus;
      
      const icon = match ? '✓' : '✗';
      console.log(`${icon} ${testName}`);
      console.log(`   Category: ${category}`);
      console.log(`   Expected: ${test.expectedStatus}, Got: ${status}`);

      if (!match) {
        console.log(`   ERROR: Status mismatch!`);
        summary[category].failed++;
      } else {
        summary[category].passed++;
      }

      results.push({
        name: testName,
        category,
        expectedStatus: test.expectedStatus,
        actualStatus: status,
        match,
        description: test.description,
        notes: test.notes,
        result
      });

      console.log('');
    } catch (err) {
      console.log(`✗ ${testName}`);
      console.log(`   ERROR: ${err.message}\n`);
      summary[category].failed++;
    }
  }

  // Print summary
  console.log('═'.repeat(60));
  console.log('TEST SUMMARY BY CATEGORY');
  console.log('═'.repeat(60));

  let totalPassed = 0;
  let totalFailed = 0;
  let totalTests = 0;

  Object.entries(summary).forEach(([category, stats]) => {
    const passRate = ((stats.passed / stats.total) * 100).toFixed(1);
    console.log(`${category}: ${stats.passed}/${stats.total} (${passRate}%)`);
    totalPassed += stats.passed;
    totalFailed += stats.failed;
    totalTests += stats.total;
  });

  console.log('═'.repeat(60));
  const overallRate = ((totalPassed / totalTests) * 100).toFixed(1);
  console.log(`OVERALL: ${totalPassed}/${totalTests} (${overallRate}%)`);
  console.log('═'.repeat(60) + '\n');

  // Save detailed results
  fs.writeFileSync(
    '/Users/jessesep/Projects/faust-mcp/test-results-comprehensive.json',
    JSON.stringify({ testSuite: TestSuite, results, summary }, null, 2)
  );

  return { results, summary };
}

runComprehensiveTests().catch(console.error);
