#!/usr/bin/env node

/**
 * Example Test Suites for Common Faust Patterns
 *
 * Demonstrates how to test various DSP algorithms and Faust patterns
 */

const { TestRunner } = require('./testing-framework');
const fs = require('fs');

/**
 * Collection of example Faust patterns with test cases
 */
const ExampleTestSuites = {
  /**
   * Simple sine oscillator
   */
  oscillator: {
    name: 'Simple Sine Oscillator',
    code: `
import("stdfaust.lib");

freq = hslider("frequency", 440, 20, 20000, 1);
gain = hslider("gain", 0.1, 0, 1, 0.01);

process = freq : si.osc : (_ * gain);
    `,
    description: 'Basic sine wave oscillator with frequency and gain controls',
    expectedTests: {
      syntax: 'PASS',
      compilation: 'PASS',
      signal_processing: 'PASS'
    }
  },

  /**
   * Low-pass filter
   */
  lowPassFilter: {
    name: 'First-Order Low-Pass Filter',
    code: `
import("stdfaust.lib");

cutoff = hslider("cutoff [unit:Hz]", 1000, 20, 20000, 1);
q = hslider("resonance [unit:dB]", 1, 0.1, 10, 0.1);

process = fi.lowpass(4, cutoff);
    `,
    description: 'Low-pass filter with cutoff frequency control',
    expectedTests: {
      syntax: 'PASS',
      compilation: 'PASS',
      signal_processing: 'PASS'
    }
  },

  /**
   * Delay effect
   */
  delayEffect: {
    name: 'Stereo Delay Effect',
    code: `
import("stdfaust.lib");

maxTime = 1.0;
maxSamples = 44100 : int;

delayTime = hslider("time [unit:ms]", 500, 1, 1000, 1) / 1000 : (_ * 44100) : int;
feedback = hslider("feedback", 0.5, 0, 0.99, 0.01);
wet = hslider("wet", 0.5, 0, 1, 0.01);

delayLine(delayLen, input) = input : de.delay(maxSamples, delayLen);

stereoDelay =
  (delayLine(delayTime, _) : (_ * feedback)) + (_) : (_ * wet);

process = stereoDelay;
    `,
    description: 'Stereo delay with feedback and wet/dry mix',
    expectedTests: {
      syntax: 'PASS',
      compilation: 'PASS',
      signal_processing: 'PASS'
    }
  },

  /**
   * Frequency response envelope follower
   */
  envelopeFollower: {
    name: 'Envelope Follower',
    code: `
import("stdfaust.lib");

attack = hslider("attack [unit:ms]", 10, 1, 100, 1) / 1000 : (_ * 44100);
release = hslider("release [unit:ms]", 100, 10, 1000, 1) / 1000 : (_ * 44100);

envFollower(att, rel) =
  abs :
  (+ ~ (_ * (1 - 1 / att))) :
  (_ * (1 / (1 + rel)));

process = envFollower(attack, release);
    `,
    description: 'Envelope follower with configurable attack and release',
    expectedTests: {
      syntax: 'PASS',
      compilation: 'PASS',
      signal_processing: 'PASS'
    }
  },

  /**
   * Example with syntax error (missing semicolon)
   */
  syntaxErrorExample: {
    name: 'Syntax Error Example - Missing Semicolon',
    code: `
import("stdfaust.lib");

freq = hslider("frequency", 440, 20, 20000, 1)
gain = hslider("gain", 0.1, 0, 1, 0.01);

process = freq : si.osc;
    `,
    description: 'Example containing a syntax error (missing semicolon)',
    expectedTests: {
      syntax: 'FAIL',
      compilation: 'SKIPPED',
      signal_processing: 'CHECK'
    }
  },

  /**
   * Example with undefined symbol
   */
  undefinedSymbolExample: {
    name: 'Undefined Symbol Example',
    code: `
process = myUndefinedFunction;
    `,
    description: 'Example with undefined symbol',
    expectedTests: {
      syntax: 'FAIL',
      compilation: 'FAIL',
      signal_processing: 'CHECK'
    }
  },

  /**
   * Example with domain error (sqrt of negative)
   */
  domainErrorExample: {
    name: 'Domain Error Example - Sqrt of Negative',
    code: `
import("stdfaust.lib");

process = sqrt(-1);
    `,
    description: 'Example with mathematical domain error',
    expectedTests: {
      syntax: 'PASS',
      compilation: 'FAIL',
      signal_processing: 'FAIL'
    }
  },

  /**
   * Feedback filter
   */
  feedbackFilter: {
    name: 'Simple Feedback Filter',
    code: `
import("stdfaust.lib");

coeff = hslider("feedback", 0.5, 0, 0.99, 0.01);

// y = x + coeff * y(t-1)
process = + ~ (_ * coeff);
    `,
    description: 'Simple one-pole feedback filter',
    expectedTests: {
      syntax: 'PASS',
      compilation: 'PASS',
      signal_processing: 'PASS'
    }
  },

  /**
   * Parallel filter bank
   */
  filterBank: {
    name: 'Filter Bank - Parallel Filters',
    code: `
import("stdfaust.lib");

// Split input to 3 parallel filters
process =
  _ <: (
    fi.lowpass(2, 100),
    fi.lowpass(2, 1000),
    fi.lowpass(2, 10000)
  );
    `,
    description: 'Parallel filter bank with three different cutoff frequencies',
    expectedTests: {
      syntax: 'PASS',
      compilation: 'PASS',
      signal_processing: 'PASS'
    }
  },

  /**
   * Parameter validation test
   */
  parameterValidationExample: {
    name: 'Parameter Validation - Out of Range',
    code: `
import("stdfaust.lib");

// Default value (200) is outside range [300, 20000]
freq = hslider("frequency", 200, 300, 20000, 1);

process = freq : si.osc;
    `,
    description: 'Example with default parameter outside specified range',
    expectedTests: {
      syntax: 'PASS',
      compilation: 'PASS',
      signal_processing: 'PASS',
      parameters: 'FAIL'
    }
  }
};

/**
 * Run all example tests
 */
async function runAllExamples() {
  const runner = new TestRunner();
  const results = {};

  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   FAUST TESTING FRAMEWORK - EXAMPLE TEST SUITES              ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');

  for (const [key, suite] of Object.entries(ExampleTestSuites)) {
    console.log(`Testing: ${suite.name}`);
    console.log(`Description: ${suite.description}`);
    console.log('');

    try {
      const testResults = await runner.runFullTestSuite(suite.code);
      results[key] = testResults;

      console.log(runner.formatReport(testResults));
      console.log('');
      console.log('─────────────────────────────────────────────────────────────');
      console.log('');
    } catch (error) {
      console.error(`Error testing ${key}:`, error.message);
      console.log('');
    }
  }

  // Summary
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                    TEST SUMMARY                              ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');

  let passed = 0;
  let failed = 0;

  Object.entries(results).forEach(([key, result]) => {
    const status = result.summary.overall_status;
    const symbol = status === 'PASS' ? '✓' : '✗';
    console.log(`${symbol} ${ExampleTestSuites[key].name}: ${status}`);

    if (status === 'PASS') {
      passed++;
    } else {
      failed++;
    }
  });

  console.log('');
  console.log(`Total: ${passed} passed, ${failed} failed`);
}

/**
 * Run single test example
 */
async function runSingleExample(exampleKey) {
  if (!ExampleTestSuites[exampleKey]) {
    console.error(`Example not found: ${exampleKey}`);
    console.error(`Available examples: ${Object.keys(ExampleTestSuites).join(', ')}`);
    process.exit(1);
  }

  const suite = ExampleTestSuites[exampleKey];
  const runner = new TestRunner();

  console.log(`Running: ${suite.name}`);
  console.log(`Description: ${suite.description}`);
  console.log('');

  const testResults = await runner.runFullTestSuite(suite.code);
  console.log(runner.formatReport(testResults));

  // Show detailed results
  console.log('');
  console.log('DETAILED RESULTS:');
  console.log(JSON.stringify(testResults, null, 2));
}

/**
 * List all available examples
 */
function listExamples() {
  console.log('Available Test Suites:');
  console.log('');

  Object.entries(ExampleTestSuites).forEach(([key, suite]) => {
    console.log(`  ${key}`);
    console.log(`    Name: ${suite.name}`);
    console.log(`    Description: ${suite.description}`);
    console.log('');
  });
}

// CLI support
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--all') {
    runAllExamples().catch(err => {
      console.error('Error:', err);
      process.exit(1);
    });
  } else if (args[0] === '--list') {
    listExamples();
  } else {
    runSingleExample(args[0]).catch(err => {
      console.error('Error:', err);
      process.exit(1);
    });
  }
}

module.exports = {
  ExampleTestSuites,
  runAllExamples,
  runSingleExample,
  listExamples
};
