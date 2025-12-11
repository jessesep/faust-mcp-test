#!/usr/bin/env node

/**
 * Faust Debugging Guides & Common Issues
 *
 * Comprehensive collection of debugging techniques, common issues,
 * and step-by-step troubleshooting guides.
 */

/**
 * Organized guide database by error category
 */
const DebuggingGuides = {
  /**
   * Missing Semicolon Guide
   */
  missingSemicolon: {
    title: 'Missing Semicolon Error',
    category: 'SYNTAX',
    frequency: 'VERY_HIGH',
    description: 'Most common Faust error. All statements must end with semicolon.',
    symptoms: [
      'Error: "syntax error, unexpected IDENT"',
      'Error appears on line after missing semicolon',
      'Two function definitions seem connected'
    ],
    rootCauses: [
      'Line ends without semicolon before next statement',
      'Copy-pasted code missing semicolon',
      'Function definition without semicolon'
    ],
    diagnosis: {
      step1: 'Look at error line and line before',
      step2: 'Check if line before ends with semicolon',
      step3: 'Look for unfinished statement',
      hint: 'Faust requires semicolons even for simple variable assignments'
    },
    examples: {
      wrong: [
        `freq = hslider("frequency", 440, 20, 20000, 1)
         process = freq : sin;`,
        `process = sin(x)
         ba.time;`,
        `myfilter(x) = x : cos
         process = myfilter;`
      ],
      correct: [
        `freq = hslider("frequency", 440, 20, 20000, 1);
         process = freq : sin;`,
        `process = sin(x) : ba.time;`,
        `myfilter(x) = x : cos;
         process = myfilter;`
      ]
    },
    recovery: [
      '1. Find the error line number',
      '2. Check the line before it',
      '3. If it ends with identifier/bracket, add semicolon',
      '4. Re-test with: faust -c yourcode.dsp'
    ],
    prevention: [
      '• Always end statements with ;',
      '• After each function definition, add ;',
      '• Review last token on each line',
      '• Use editor with Faust syntax highlighting'
    ]
  },

  /**
   * Undefined Symbol Guide
   */
  undefinedSymbol: {
    title: 'Undefined Symbol Error',
    category: 'SYNTAX/COMPILATION',
    frequency: 'HIGH',
    description: 'Symbol is used but never defined or imported.',
    symptoms: [
      'Error: "undefined symbol : functionName"',
      'Error: "undefined symbol : \'variableName\'"',
      'Library function causes "undefined" error'
    ],
    rootCauses: [
      'Function is not defined before use',
      'Library not imported (missing import statement)',
      'Typo in function name',
      'Function from unimported library'
    ],
    diagnosis: {
      step1: 'Note the undefined symbol name',
      step2: 'Search code for definition of that symbol',
      step3: 'Check if symbol is from standard library',
      step4: 'Check imports at top of code'
    },
    commonLibraryFunctions: {
      'ba.*': 'Basic operations (lowpass, etc.)',
      'ma.*': 'Math operations (sqrt, sin, etc.)',
      'si.*': 'Signal processing (osc, envelope, etc.)',
      'fi.*': 'Filters (highpass, bandpass, etc.)',
      'co.*': 'Composition (cross, etc.)',
      'de.*': 'Delays (delay, etc.)'
    },
    examples: {
      wrong: [
        `process = sin(440);  // Where is sin defined?`,
        `process = lowpass(4, 1000);  // Not defined!`,
        `freq = hslider("f", 440, 20, 20000, 1);
         process = freq : si.osc;  // si.* not imported!`
      ],
      correct: [
        `import("stdfaust.lib");
         process = sin(440);`,
        `import("stdfaust.lib");
         process = fi.lowpass(4, 1000);`,
        `import("stdfaust.lib");
         freq = hslider("f", 440, 20, 20000, 1);
         process = freq : si.osc;`
      ]
    },
    recovery: [
      '1. Note the undefined symbol',
      '2. Check if it\'s from standard library',
      '3. If yes, add: import("stdfaust.lib");',
      '4. If no, define the function before use',
      '5. Check for typos'
    ],
    prevention: [
      '• Always start with: import("stdfaust.lib");',
      '• Define functions before using them',
      '• Double-check function names against docs',
      '• Use editor autocomplete to verify names'
    ]
  },

  /**
   * Box Dimension Mismatch Guide
   */
  boxDimensionMismatch: {
    title: 'Box Dimension Mismatch Error',
    category: 'COMPILATION',
    frequency: 'MEDIUM',
    description: 'Signal flow has wrong number of inputs/outputs.',
    symptoms: [
      'Error: "the number of outputs [N] of A must be equal..."',
      'Error: "number of outputs [N] must be a divisor..."',
      'Error: "number of outputs [N] must be a multiple..."'
    ],
    rootCauses: [
      'Wrong composition operator (:, ,, <:, :>)',
      'Function has different I/O than expected',
      'Incorrect parallel/sequential arrangement'
    ],
    diagnosis: {
      step1: 'Note which boxes have mismatched dimensions',
      step2: 'Check I/O count of each function',
      step3: 'Review composition operator used',
      step4: 'Use faust -svg to visualize signal flow',
      hint: 'Sequential (:) is strictest - inputs must match outputs exactly'
    },
    compositionRules: {
      sequential: {
        operator: ':',
        rule: 'outputs(A) == inputs(B)',
        example: '(1 output) : (1 input)  ✓',
        invalid: '(2 outputs) : (1 input)  ✗'
      },
      parallel: {
        operator: ',',
        rule: 'No constraint - any dimensions work',
        example: '(2 outputs), (3 outputs)  ✓'
      },
      split: {
        operator: '<:',
        rule: 'outputs(A) divides inputs(B) evenly',
        example: '(1 output) <: (3 inputs) - distributes 1 to each  ✓',
        invalid: '(2 outputs) <: (3 inputs) - 2 does not divide 3  ✗'
      },
      merge: {
        operator: ':>',
        rule: 'outputs(B) is multiple of inputs(A)',
        example: '(2 inputs) :> (4 outputs) - 4 is multiple of 2  ✓'
      }
    },
    examples: {
      wrong: [
        `process = (a, b) : c;  // ERROR: 2 outputs to 1 input`,
        `process = _ <: (filter1, filter2, filter3);  // ERROR: 1 doesn't divide 3`,
        `sine = sin;
         filter = lowpass(4, 1000);
         process = (sine, filter) : _;  // ERROR: wrong composition`
      ],
      correct: [
        `process = a : c, b : c;  // Parallel`,
        `process = _ : filter1, _ : filter2, _ : filter3;  // Series`,
        `process = _ <: (_ * 0.3), (_ * 0.7);  // Split then parallel`
      ]
    },
    recovery: [
      '1. Run: faust -svg yourcode.dsp',
      '2. Open generated SVG to see signal flow',
      '3. Identify boxes with dimension mismatch',
      '4. Check library docs for function I/O counts',
      '5. Adjust composition operator or box arrangement'
    ],
    visualDebug: [
      'Block diagram shows boxes and signal connections',
      'Width of connections indicates I/O count',
      'Mismatched widths show dimension errors',
      'Use this to understand required fixes'
    ]
  },

  /**
   * Unbounded Delay Guide
   */
  unboundedDelay: {
    title: 'Unbounded Delay Error',
    category: 'COMPILATION',
    frequency: 'LOW',
    description: 'Delay size cannot be determined at compile time.',
    symptoms: [
      'Error: "can\'t compute the min and max values"',
      'Error occurs with @(variable) where variable range is unknown'
    ],
    rootCauses: [
      'Using variable delay without upper bound',
      'Slider has no maximum value or max is variable',
      'Delay expressed as floating-point time instead of samples'
    ],
    examples: {
      wrong: [
        `delayTime = hslider("delay", 0.5, 0, ?, 0.01);
         process = _ @ (delayTime : (_ * 44100));  // ERROR: max is ?`,
        `process = _ @ (_ * 100);  // ERROR: unbounded variable`,
        `processdelay = hslider("delay_ms", 100, 0, 1000000, 1) : @(_);  // Max too large`
      ],
      correct: [
        `maxDelay = 96000;  // 1 second at 96kHz
         delayTime = hslider("delay", 1000, 1, maxDelay, 1);
         process = _ @ delayTime;`,
        `delayTime = hslider("delay_ms", 500, 1, 5000, 1) : (_ / 1000 * 44100) : int;
         process = de.delay(5 * 44100, delayTime);`,
        `import("stdfaust.lib");
         delayTime = hslider("delay", 100, 1, max(96000, 1), 1);
         process = de.delay(96000, delayTime);`
      ]
    },
    recovery: [
      '1. Specify maximum delay value explicitly',
      '2. Use bounded slider: hslider(..., min, maxValue, step)',
      '3. Or use de.delay(maxSamples, actualDelay)',
      '4. Convert time to samples: ms * sampleRate / 1000'
    ],
    prevention: [
      '• Always specify maximum for delay parameters',
      '• Use de.delay() for variable delays',
      '• Keep max delay reasonable (not ?)',
      '• Test with realistic maximum values'
    ]
  },

  /**
   * Parameter Range Error Guide
   */
  parameterRange: {
    title: 'Parameter Range Error',
    category: 'SIGNAL_PROCESSING',
    frequency: 'MEDIUM',
    description: 'Slider default value outside specified range.',
    symptoms: [
      'Slider default not within [min, max] range',
      'Parameter used with functions expecting positive values'
    ],
    rootCauses: [
      'Default value outside [min, max]',
      'Negative values passed to sqrt or log',
      'Zero divisor in denominator'
    ],
    examples: {
      wrong: [
        `freq = hslider("frequency", 200, 300, 20000, 1);  // 200 outside [300,20000]`,
        `val = hslider("value", 0.5, -1, 1, 0.1) : sqrt;  // -1 to 1 invalid for sqrt`,
        `gain = hslider("gain", 1, 0, 0.99, 0.01);  // 1 > max 0.99`
      ],
      correct: [
        `freq = hslider("frequency", 500, 300, 20000, 1);  // 500 within range`,
        `val = hslider("value", 0.5, 0, 1, 0.1) : sqrt;  // 0 to 1 OK for sqrt`,
        `gain = hslider("gain", 0.5, 0, 0.99, 0.01);  // 0.5 within range`
      ]
    },
    recovery: [
      '1. Find slider definition from error',
      '2. Ensure default >= min',
      '3. Ensure default <= max',
      '4. For sqrt/log, ensure min >= 0 (sqrt) or min > 0 (log)'
    ],
    prevention: [
      '• Review slider ranges carefully',
      '• Use meaningful defaults in middle of range',
      '• Constrain ranges for mathematical operations',
      '• Test with extreme values (min and max)'
    ]
  },

  /**
   * Recursive Composition Error Guide
   */
  recursiveComposition: {
    title: 'Recursive Composition Error',
    category: 'SIGNAL_PROCESSING',
    frequency: 'LOW',
    description: 'Feedback loop violates causality constraints.',
    symptoms: [
      'Error: "recursive composition requires..."',
      'Error: outputs(A) >= inputs(B) and inputs(A) >= outputs(B)'
    ],
    rootCauses: [
      'Feedback loop has mismatched I/O dimensions',
      'Missing delay in feedback path',
      'Incorrect use of ~ operator'
    ],
    causality: {
      rule: 'A ~ B requires outputs(A) >= inputs(B) AND inputs(A) >= outputs(B)',
      implicit_delay: 'The ~ operator automatically inserts one-sample delay',
      requirement: 'Ensures feedback loop is causal (not looking into future)'
    },
    examples: {
      wrong: [
        `onepole = (_ : + ~ (_ * coeff));  // May violate causality`,
        `process = (sin(freq) : +) ~ (_ * 0.5);  // Dimension mismatch`
      ],
      correct: [
        `onepole = + ~ (_ * coeff);  // Both 1-to-1`,
        `process = + ~ (_ * 0.5);  // Simple feedback, 1-to-1`
      ]
    },
    recovery: [
      '1. Count inputs and outputs of each box',
      '2. Ensure outputs(left) >= inputs(right)',
      '3. Ensure inputs(left) >= outputs(right)',
      '4. Add delays if needed: (_ @ 1) in feedback path',
      '5. Consider alternative without feedback'
    ]
  }
};

/**
 * Troubleshooting Decision Tree
 */
const TroubleshootingTree = {
  title: 'Faust Error Diagnosis Decision Tree',
  startQuestion: 'What kind of error are you seeing?',
  branches: [
    {
      error: 'Error at file:line, unexpected IDENT',
      most_likely: 'Missing semicolon',
      diagnostic_steps: [
        'Look at the line before the error',
        'Check if it ends with semicolon',
        'Add semicolon if missing'
      ]
    },
    {
      error: 'undefined symbol : functionName',
      most_likely: 'Undefined function or missing import',
      diagnostic_steps: [
        'Search code for function definition',
        'If not found, check if it\'s from standard library',
        'Add import("stdfaust.lib"); if needed'
      ]
    },
    {
      error: 'the number of outputs',
      most_likely: 'Box dimension mismatch',
      diagnostic_steps: [
        'Run: faust -svg yourcode.dsp',
        'Check signal flow diagram for width mismatches',
        'Adjust composition operators or dimensions'
      ]
    },
    {
      error: 'can\'t compute the min and max values',
      most_likely: 'Unbounded delay',
      diagnostic_steps: [
        'Find delay declaration',
        'Specify maximum delay value',
        'Use de.delay(maxSamples, actualDelay)'
      ]
    },
    {
      error: 'calling foreign function',
      most_likely: 'Backend incompatibility',
      diagnostic_steps: [
        'Remove foreign function call',
        'Use pure Faust equivalent',
        'Or switch to C++ backend'
      ]
    }
  ]
};

/**
 * Common Pitfalls & How to Avoid
 */
const CommonPitfalls = [
  {
    pitfall: 'Forgetting import("stdfaust.lib");',
    consequence: 'All library functions undefined',
    prevention: 'Always start with: import("stdfaust.lib");'
  },
  {
    pitfall: 'Using wrong slider defaults',
    consequence: 'Parameter outside valid range, runtime errors',
    prevention: 'Check: min <= default <= max'
  },
  {
    pitfall: 'Mixing composition operators',
    consequence: 'Dimension mismatches, confusing errors',
    prevention: 'Use : for 1-to-1, , for parallel'
  },
  {
    pitfall: 'Negative values to sqrt/log',
    consequence: 'Domain error, compilation fails',
    prevention: 'Constrain input ranges: hslider(..., 0, 10, ...)'
  },
  {
    pitfall: 'Duplicate UI pathnames',
    consequence: 'Error: path already used',
    prevention: 'Use unique hierarchical names: folder/subname'
  },
  {
    pitfall: 'Variable delays without bounds',
    consequence: 'Can\'t compute min/max, unbounded error',
    prevention: 'Always specify max: hslider(..., min, max, ...)'
  },
  {
    pitfall: 'Complex expressions in single line',
    consequence: 'Hard to debug, error location unclear',
    prevention: 'Break into multiple definitions, one per line'
  },
  {
    pitfall: 'Using -(...) for negation',
    consequence: 'Syntax error with certain expressions',
    prevention: 'Use: 0 - (...) or multiply by -1'
  }
];

/**
 * Quick Decision Aid
 */
function getDiagnosisPath(errorMessage) {
  const msg = errorMessage.toLowerCase();

  if (msg.includes('unexpected') || msg.includes('syntax')) {
    if (msg.includes('ident')) return 'missingSemicolon';
  }

  if (msg.includes('undefined')) {
    return 'undefinedSymbol';
  }

  if (msg.includes('outputs') || msg.includes('inputs')) {
    return 'boxDimensionMismatch';
  }

  if (msg.includes('min') && msg.includes('max')) {
    return 'unboundedDelay';
  }

  if (msg.includes('range') || msg.includes('default')) {
    return 'parameterRange';
  }

  if (msg.includes('recursive')) {
    return 'recursiveComposition';
  }

  return null;
}

// Export guides
module.exports = {
  DebuggingGuides,
  TroubleshootingTree,
  CommonPitfalls,
  getDiagnosisPath
};

// CLI - Display guides
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--list') {
    console.log('Available Debugging Guides:\n');
    Object.entries(DebuggingGuides).forEach(([key, guide]) => {
      console.log(`• ${key}`);
      console.log(`  ${guide.title} (${guide.frequency})`);
    });
    console.log('\nUsage: node debugging-guides.js <guide-name>');
    process.exit(0);
  }

  const guideName = args[0];
  const guide = DebuggingGuides[guideName];

  if (!guide) {
    console.error(`Guide not found: ${guideName}`);
    process.exit(1);
  }

  // Display guide
  console.log('\n' + '='.repeat(60));
  console.log(guide.title);
  console.log('='.repeat(60));
  console.log(`\nCategory: ${guide.category}`);
  console.log(`Frequency: ${guide.frequency}`);
  console.log(`\n${guide.description}\n`);

  console.log('SYMPTOMS:');
  guide.symptoms.forEach(s => console.log(`  • ${s}`));

  console.log('\nROOT CAUSES:');
  guide.rootCauses.forEach(c => console.log(`  • ${c}`));

  console.log('\nDIAGNOSIS:');
  Object.values(guide.diagnosis).forEach(d => console.log(`  • ${d}`));

  console.log('\nEXAMPLES:');
  console.log('\n  ✗ Wrong:');
  guide.examples.wrong.forEach(ex => console.log(`    ${ex}`));
  console.log('\n  ✓ Correct:');
  guide.examples.correct.forEach(ex => console.log(`    ${ex}`));

  console.log('\nRECOVERY:');
  guide.recovery.forEach(step => console.log(`  ${step}`));

  console.log('\nPREVENTION:');
  guide.prevention.forEach(tip => console.log(`  ${tip}`));

  console.log('\n' + '='.repeat(60) + '\n');
}
