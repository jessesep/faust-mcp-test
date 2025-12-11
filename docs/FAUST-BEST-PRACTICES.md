# Faust Best Practices & Design Patterns Guide

**Best practices, design patterns, and optimization strategies for Faust DSP development**

**Version**: 1.0 | **Updated**: 2025-12-11 | **Maintained by**: bookkeeper agent

---

## Table of Contents

1. [Code Organization](#code-organization)
2. [Design Patterns](#design-patterns)
3. [Performance Optimization](#performance-optimization)
4. [Common Pitfalls & Anti-Patterns](#common-pitfalls--anti-patterns)
5. [Debugging Strategies](#debugging-strategies)
6. [Testing Practices](#testing-practices)
7. [Library Usage](#library-usage)
8. [Signal Flow Design](#signal-flow-design)

---

## Code Organization

### 1.1 Project Structure

**Recommended Layout**:
```
my-faust-project/
├── src/
│   ├── main.dsp          # Main process definition
│   ├── synths/           # Synthesizer definitions
│   │   ├── oscillators.lib
│   │   └── envelopes.lib
│   ├── effects/          # Effect processors
│   │   ├── filters.lib
│   │   ├── delays.lib
│   │   └── reverbs.lib
│   ├── utils/            # Utility functions
│   │   ├── math-utils.lib
│   │   └── routing.lib
│   └── ui/               # UI definitions
│       └── controls.lib
├── architecture/         # Custom architectures
├── examples/            # Example usage
└── docs/               # Documentation
```

**Benefits**:
- Clear separation of concerns
- Easy to reuse components
- Simplified testing and debugging
- Better collaboration potential

### 1.2 Naming Conventions

**Good Naming**:
```faust
// Use descriptive names
my_lowpass_filter = fi.lowpass(order, cutoff_freq);

// Clear process names
process = my_synth : my_effects : output_limiter;

// Descriptive UI elements
freq = hslider("Frequency [Hz]", 440, 20, 5000, 1);
```

**Avoid**:
```faust
// Ambiguous abbreviations
lpf = fi.lowpass(o, cf);

// Generic names
x = y : z;

// Undocumented magic numbers
process = something(3.14159, 0.707, 44100);
```

### 1.3 Library Organization

**Structure Multi-Library Projects**:
```faust
// oscillators.lib - Single responsibility
sin_osc(freq) = os.osc(freq);
tri_osc(freq) = os.triangle(freq);
saw_osc(freq) = os.sawtooth(freq);

// effects.lib - Cohesive effect group
distortion(gain) = (_ * gain) : min(1) : max(-1);
chorus(depth, rate) = ... ; // chorus implementation
reverb(size, decay) = ... ; // reverb implementation

// main.dsp - Clear orchestration
import("oscillators.lib");
import("effects.lib");
process = sin_osc(freq) : reverb(0.7, 3.0);
```

---

## Design Patterns

### 2.1 Functional Composition Pattern

**Best Practice**: Build complex processors from simple, composable functions.

```faust
// Single-responsibility components
lowpass(Q, freq, input) = input : fi.lowpass(Q, freq);
highpass(Q, freq, input) = input : fi.highpass(Q, freq);

// Compose into complex filter
bandpass(Q, center_freq, input) =
  lowpass(Q, center_freq + bandwidth/2,
    highpass(Q, center_freq - bandwidth/2, input))
  with { bandwidth = center_freq / Q; };

// Use in larger system
process = bandpass(1.0, 1000, _);
```

**Benefits**:
- Easy to test individual components
- Reusable throughout project
- Clear data flow
- Easier debugging

### 2.2 Parameterized Filter Design

**Pattern**: Use parameters instead of hardcoded values.

```faust
// GOOD: Parameterized and reusable
filter_chain(freq1, freq2, input) =
  fi.lowpass(3, freq1, input) : fi.highpass(3, freq2);

// Interactive controls
process = filter_chain(low_freq, high_freq, _)
  with {
    low_freq = hslider("High-Pass [Hz]", 100, 20, 1000, 1);
    high_freq = hslider("Low-Pass [Hz]", 5000, 1000, 20000, 1);
  };

// BAD: Hardcoded values
fixed_filter = fi.lowpass(3, 1000) : fi.highpass(3, 100);
```

### 2.3 Control Hierarchies

**Pattern**: Organize UI controls logically with groups.

```faust
import("stdfaust.lib");

process = hgroup("Synthesizer",
  vgroup("Oscillator",
    sine_section
  )
  :
  vgroup("Envelope",
    envelope_section
  )
  :
  vgroup("Effects",
    effects_section
  )
);

sine_section = os.osc(freq)
  with { freq = hslider("Frequency", 440, 20, 5000, 1); };

envelope_section = * (ba.db2linear(gain) * env)
  with {
    gain = hslider("Gain [dB]", -20, -60, 0, 1);
    env = ad.adsr(attack, decay, sustain, release, gate)
      with {
        attack = hslider("Attack [s]", 0.01, 0.001, 1, 0.001);
        decay = hslider("Decay [s]", 0.1, 0.001, 1, 0.001);
        sustain = hslider("Sustain", 0.5, 0, 1, 0.01);
        release = hslider("Release [s]", 0.5, 0.001, 2, 0.001);
        gate = button("Gate");
      };
  };

effects_section =
  ((hslider("Reverb", 0, 0, 1, 0.01) > 0) :
   re.freeverb(1, 0.5, 0.5, 0.5, 1));
```

### 2.4 Signal Routing Pattern

**Pattern**: Use explicit routing for multi-channel processing.

```faust
// Stereo delay with cross-feedback
stereo_delay_xfb(delay_time, feedback, wet) =
  (left_sig, right_sig) :
  (left_in, right_in) :
  (left_out, right_out)
  with {
    left_in = _ - (right_sig * feedback) : fi.delay(65536, delay_time);
    right_in = _ - (left_sig * feedback) : fi.delay(65536, delay_time);
    left_out = _ * (1 - wet) + (left_sig * wet);
    right_out = _ * (1 - wet) + (right_sig * wet);
  };
```

### 2.5 UI State Management Pattern

**Pattern**: Centralize parameter handling and defaults.

```faust
// Define all UI parameters in one place
defaults = environment {
  // Oscillator
  frequency = 440;
  waveform = 0; // 0=sine, 1=triangle, 2=sawtooth

  // Envelope
  attack = 0.01;
  decay = 0.1;
  sustain = 0.5;
  release = 0.5;

  // Effects
  reverb_size = 0.5;
  reverb_damping = 0.5;

  // Output
  master_gain = -6; // dB
};

// Use defaults with hsliders
freq = hslider("Freq", defaults.frequency, 20, 5000, 1);
reverb_sz = hslider("Reverb", defaults.reverb_size, 0, 1, 0.01);
```

---

## Performance Optimization

### 3.1 Minimize Computation Burden

**Good**:
```faust
// Single filter calculation
my_filter = fi.lowpass(3, 1000);
process = input : my_filter;

// Reuse computed values
env = ba.gate(gate) * ad.adsr(a,d,s,r,gate);
process = (sine * env) + (square * env);
```

**Avoid**:
```faust
// Redundant calculations (computed twice)
process = (input : fi.lowpass(3, 1000)) : ...
          + (input : fi.lowpass(3, 1000)) : ...;

// Computing envelope multiple times
process = (sine * ad.adsr(a,d,s,r,gate))
        + (square * ad.adsr(a,d,s,r,gate))
        + (triangle * ad.adsr(a,d,s,r,gate));
```

### 3.2 Sample-Rate Awareness

**Pattern**: Use sample-rate dependent values correctly.

```faust
// GOOD: Sample-rate aware design
sr = 44100.0; // This value is typically provided
buffer_size = sr / 1000; // 44 samples at 44.1kHz

// Time-based calculations scale with sample rate
time_seconds = 1.0;
num_samples = time_seconds * sr;

// Frequency calculations
nyquist = sr / 2;
cutoff = min(1000, nyquist * 0.9);
```

### 3.3 Avoid Recursive Feedback Loops

**Good**:
```faust
// Simple delay with feedback
dsp = _ : fi.delay(max_delay, time) : * (feedback) : +(_);
```

**Problematic**:
```faust
// Recursive composition can cause performance issues
dsp = _ ~ (delays : feedback);

// Long feedback chains
dsp = _ ~ (filter1 ~ (filter2 ~ (filter3 ~ reverb)));
```

### 3.4 Memory Allocation

**Best Practices**:
```faust
// Pre-allocate appropriate buffer sizes
delay_memory = 48000; // 1 second at 48kHz, allocate once
my_delay(time, input) = input : fi.delay(delay_memory, time);

// Avoid dynamic allocation in audio loop
// Don't create new delays inside process definition
```

### 3.5 Parallel Processing

**Pattern**: Use parallel composition for independent processors.

```faust
// Efficient parallel processing
// Both channels processed independently, can run in parallel
process =
  (left_channel : filter1 : effect1),
  (right_channel : filter2 : effect2);

// Sequential is slower for independent processes
// Left THEN Right must complete sequentially
// process = left_channel : filter1 : effect1 : right_channel : filter2 : effect2;
```

---

## Common Pitfalls & Anti-Patterns

### 4.1 Box Dimension Mismatches

**Problem**: Incorrect input/output count connections.

```faust
// ERROR: (sine, cos) produces 2 outputs but + expects 1
process = (sin(1000), cos(1000)) : +;

// CORRECT: Use , to sum, not :
process = (sin(1000), cos(1000)) : +;
// or use >: (merge)
process = (sin(1000), cos(1000)) :> +;
```

**Prevention**:
- Understand `:` (sequential) vs `,` (parallel)
- Know input/output counts of library functions
- Visualize signal flow before coding
- Test components individually

### 4.2 Undefined Variables

**Problem**: Reference to non-existent variable or function.

```faust
// ERROR: 'freq' not defined in scope
process = os.osc(freq);

// CORRECT: Define with 'with' clause
process = os.osc(freq)
  with { freq = hslider("Freq", 440, 20, 5000, 1); };

// or import required library
import("stdfaust.lib");
process = os.osc(440);
```

**Prevention**:
- Always import required libraries
- Define all variables before use
- Use `with` clause for local scopes
- Check spelling carefully

### 4.3 Unused Parameters

**Antipattern**:
```faust
// Parameter defined but never used (memory waste)
unused_param = hslider("Not Used", 0, 0, 1, 0.01);
process = os.osc(440); // 'unused_param' not connected

// CORRECT: Only define used parameters
process = os.osc(freq)
  with { freq = hslider("Frequency", 440, 20, 5000, 1); };
```

### 4.4 Infinite Feedback Loops

**Problem**:
```faust
// Recursive without escape: infinite loop
feedback_loop = feedback_loop;
```

**Solution**:
```faust
// Add output feedback safely
safe_feedback = _ : filter : (_ ~ (delay_line : * (0.5)));
```

### 4.5 Type Inconsistencies

**Problem**:
```faust
// Attempting to use function on wrong type
my_value = "string"; // Faust doesn't support this
process = my_value + 5; // Type mismatch
```

**Solution**:
```faust
// Faust works with block diagrams, not traditional types
my_value = 42; // Numeric value
process = my_value : + (5);
```

### 4.6 Over-Complex Designs

**Antipattern**:
```faust
// Too nested, hard to understand or debug
process = ((((a : b) ~ c) : d), (((e : f) : g) : (h ~ i))) : j;
```

**Better**:
```faust
// Break into named components
stage1 = a : b;
stage2 = stage1 ~ c : d;
stage3 = e : f : g;
stage4 = stage3 : (h ~ i);
process = (stage2, stage4) : j;
```

---

## Debugging Strategies

### 5.1 Incremental Development

**Approach**:
1. Start with simplest possible code
2. Compile and test
3. Add one feature at a time
4. Test after each addition
5. Isolate problematic sections

```faust
// Start simple
process = os.osc(440);

// Add control
process = os.osc(freq)
  with { freq = hslider("Freq", 440, 20, 5000, 1); };

// Add envelope
process = os.osc(freq) * env
  with {
    freq = hslider("Freq", 440, 20, 5000, 1);
    env = ba.gate(gate) * ad.adsr(a, d, s, r, gate)
      with {
        a = hslider("A", 0.01, 0.001, 1, 0.001);
        d = hslider("D", 0.1, 0.001, 1, 0.001);
        s = hslider("S", 0.5, 0, 1, 0.01);
        r = hslider("R", 0.5, 0.001, 2, 0.001);
        gate = button("Gate");
      };
  };
```

### 5.2 Error Message Interpretation

**Common Errors and Solutions**:

| Error Message | Likely Cause | Solution |
|---------------|--------------|----------|
| `undefined symbol: foo` | `foo` not defined or imported | Check import statements; define variable with `with` |
| `the number of outputs [2] must equal inputs [1]` | Dimension mismatch | Use `,` instead of `:` or adjust signal routing |
| `syntax error, unexpected IDENT` | Missing semicolon or operator | Check line endings and operators |
| `number of outputs [1] must be divisor of [3]` | Split operator mismatch | Ensure left outputs divide right inputs evenly |

### 5.3 Modular Testing

**Pattern**: Test each component in isolation.

```faust
// Test oscillator alone
test_osc = os.osc(1000);

// Test envelope alone
test_env = ba.gate(1) * ad.adsr(0.01, 0.1, 0.5, 0.5, 1);

// Test effect alone
test_effect = fi.lowpass(3, 1000);

// Only when each works, combine them
process = test_osc * test_env : test_effect;
```

### 5.4 Signal Inspection Points

**Add monitoring points** to understand signal flow:

```faust
// Visual feedback of signal levels
import("stdfaust.lib");

process = input : lpf : vbargraph("Output", -60, 0)
  with { lpf = fi.lowpass(3, 1000); };
```

---

## Testing Practices

### 6.1 Unit Test Pattern

```faust
// Test individual components
test_sine = os.osc(1000);
test_filter = fi.lowpass(3, 1000);
test_envelope = ad.adsr(0.01, 0.1, 0.5, 0.5, 1);

// Test combinations
test_combined = os.osc(1000) * ad.adsr(0.01, 0.1, 0.5, 0.5, 1)
                : fi.lowpass(3, 1000);
```

### 6.2 Edge Case Testing

```faust
// Test with extreme values
test_zero_freq = os.osc(0);
test_max_freq = os.osc(sr/2);
test_negative = os.osc(-440);
test_very_low = os.osc(0.1);
```

### 6.3 Compilation Verification

**Always verify**:
- ✓ Code compiles without errors
- ✓ Code compiles without warnings
- ✓ Output produces sound (not silent)
- ✓ Output is properly scaled (not clipping or too quiet)
- ✓ Controls respond as expected

---

## Library Usage

### 7.1 Essential Libraries

**Standard imports**:
```faust
import("stdfaust.lib");
// Includes: SI (signals), RO (routing), FI (filters),
//           OS (oscillators), EN (envelopes), MA (math),
//           EF (effects), BA (basic), RE (reverbs)
```

**Selective imports** (for specific needs):
```faust
import("all.lib");              // Everything
import("signals.lib");          // Only signal processing
import("oscillators.lib");      // Only oscillators
import("filters.lib");          // Only filters
```

### 7.2 Library Function Selection

**Oscillators**:
- `os.osc(freq)` - Basic sine oscillator
- `os.triangle(freq)` - Triangle wave
- `os.sawtooth(freq)` - Sawtooth wave
- `os.square(freq)` - Square wave

**Filters**:
- `fi.lowpass(Q, freq)` - Low-pass (remove highs)
- `fi.highpass(Q, freq)` - High-pass (remove lows)
- `fi.bandpass(Q, freq)` - Band-pass (isolate frequency band)
- `fi.notch(Q, freq)` - Notch (remove specific frequency)

**Envelopes**:
- `ad.adsr(a,d,s,r,gate)` - ADSR envelope
- `ba.gate(gate)` - Simple gate
- `ad.asr(a,s,r,gate)` - ASR (no decay)

**Delays**:
- `fi.delay(max_len, len)` - Simple delay
- `re.mono_freeverb(...)` - Mono reverb
- `re.stereo_freeverb(...)` - Stereo reverb

---

## Signal Flow Design

### 8.1 Clean Architecture Pattern

```faust
import("stdfaust.lib");

// SYNTHESIS LAYER
synth_section = vgroup("Synth",
  hgroup("Oscillators",
    sine_osc + square_osc
  )
);

sine_osc = os.osc(sine_freq) * sine_level
  with {
    sine_freq = hslider("Sine Freq", 440, 20, 5000, 1);
    sine_level = hslider("Sine Level", 0.5, 0, 1, 0.01);
  };

square_osc = os.square(square_freq) * square_level
  with {
    square_freq = hslider("Square Freq", 220, 20, 5000, 1);
    square_level = hslider("Square Level", 0.3, 0, 1, 0.01);
  };

// MODULATION LAYER
envelope = ad.adsr(attack, decay, sustain, release, gate)
  with {
    attack = hslider("Attack", 0.01, 0.001, 1, 0.001);
    decay = hslider("Decay", 0.1, 0.001, 1, 0.001);
    sustain = hslider("Sustain", 0.7, 0, 1, 0.01);
    release = hslider("Release", 0.5, 0.001, 2, 0.001);
    gate = button("Gate");
  };

// PROCESSING LAYER
processing = vgroup("Processing",
  hgroup("Filters",
    fi.lowpass(3, lpf_freq)
  )
  :
  hgroup("Effects",
    re.mono_freeverb(1, 0.5, 0.5, 0.5, 1) * reverb_wet
  )
)
  with {
    lpf_freq = hslider("Filter Freq", 5000, 20, 20000, 1);
    reverb_wet = hslider("Reverb", 0.3, 0, 1, 0.01);
  };

// MASTER LAYER
master = vgroup("Master",
  _ * master_level : max(-1) : min(1)
)
  with {
    master_level = hslider("Master Level", 0.8, 0, 1, 0.01);
  };

// ORCHESTRATION
process = synth_section * envelope : processing : master;
```

### 8.2 Avoid Common Signal Flow Issues

**Good**:
```faust
// Clear, unambiguous flow
audio_in
  : preprocessing
  : main_effect
  : master_processing
  : audio_out;
```

**Bad**:
```faust
// Ambiguous - which operates first?
audio = preprocessing : main_effect;
audio = audio : master_processing;
process = audio;
```

---

## Summary: Golden Rules

1. **Start Simple**: Build complexity incrementally
2. **Know Your I/O**: Understand input/output counts before combining
3. **Name Clearly**: Use descriptive names for variables and functions
4. **Test Often**: Compile and test after each change
5. **Organize Logically**: Group related code into libraries
6. **Reuse Components**: Build from small, tested pieces
7. **Avoid Recursion**: Complex feedback loops are hard to debug
8. **Document Patterns**: Record your design decisions
9. **Profile Performance**: Monitor CPU and memory usage
10. **Read Error Messages**: Faust compiler messages are usually accurate

---

## Related Documentation

- `MCP-SPECIFICATION.md` - API for invoking Faust tools
- `faust-error-research.md` - Detailed error reference
- `FAUST-CODE-EXAMPLES.md` - Practical code examples

---

**Version**: 1.0 | **Updated**: 2025-12-11 | **Maintained by**: bookkeeper agent
