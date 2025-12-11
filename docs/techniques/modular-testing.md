# Modular Testing Technique for Faust

**Version:** 1.0
**Date:** 2025-12-11
**Author:** builder

---

## Overview

Modular testing is the practice of breaking complex Faust code into small, testable pieces. By testing each module independently, you can quickly isolate bugs and verify correctness.

**Key Principle:** If each small piece works, and they compose correctly, the whole system works.

---

## Why Modular Testing?

### Without Modular Testing
```faust
// 200-line monolithic synthesizer
// Bug somewhere... but where?
process = massive_complex_expression;
```
**Problem:** Hard to debug, hard to verify, hard to maintain.

### With Modular Testing
```faust
// Test each piece separately
osc_test = os.osc(440);
filter_test = fi.lowpass(3, 1000);
envelope_test = en.adsr(0.01, 0.1, 0.7, 0.5, gate);

// Then compose
process = osc_test : filter_test : envelope_test;
```
**Benefit:** Each module verified independently, composition is simple.

---

## Technique 1: Function Extraction

### Strategy
Extract logical units into named functions.

### Example: Extracting a Voice

**Before:**
```faust
import("stdfaust.lib");

process = (
    os.sawtooth(440) :
    fi.lowpass(3, hslider("cutoff", 1000, 100, 10000, 1)) *
    en.adsr(0.01, 0.1, 0.7, 0.5, button("gate"))
);
```

**After:**
```faust
import("stdfaust.lib");

// Extracted modules
oscillator(f) = os.sawtooth(f);

lowpass_filter = fi.lowpass(3, cutoff)
with {
    cutoff = hslider("cutoff", 1000, 100, 10000, 1);
};

envelope = en.adsr(0.01, 0.1, 0.7, 0.5, gate)
with {
    gate = button("gate");
};

// Compose
voice(freq) = oscillator(freq) : lowpass_filter * envelope;
process = voice(440);
```

**Benefits:**
- Each function testable independently
- Clear signal flow
- Easy to swap implementations
- Reusable components

---

## Technique 2: Isolated Module Testing

### Strategy
Test each module in its own `.dsp` file before integration.

### Example: Testing a Filter Module

**File: `test_filter.dsp`**
```faust
import("stdfaust.lib");

// The filter module
my_resonant_filter(cutoff, resonance) = fi.resonlp(cutoff, resonance, 1);

// Test with simple input
test_input = os.osc(440) * 0.3;

// Test controls
cutoff = hslider("cutoff", 1000, 100, 10000, 1);
resonance = hslider("Q", 5, 0.1, 20, 0.1);

// Test process
process = test_input : my_resonant_filter(cutoff, resonance);
```

**Compile and test:**
```bash
faust2jaqt test_filter.dsp
./test_filter
```

**What to verify:**
- [ ] Filter responds to cutoff changes
- [ ] Resonance control works correctly
- [ ] No instability at high Q
- [ ] No DC offset
- [ ] Frequency response is correct

**Once verified**, copy the filter module to your main project.

---

## Technique 3: Progressive Integration

### Strategy
Build complex systems one piece at a time, testing after each addition.

### Example: Building a Synthesizer Progressively

**Step 1: Test oscillator only**
```faust
import("stdfaust.lib");
process = os.sawtooth(440);
```
✓ Verify: Sawtooth wave output

**Step 2: Add filter**
```faust
import("stdfaust.lib");
oscillator = os.sawtooth(440);
filtered = oscillator : fi.lowpass(3, 1000);
process = filtered;
```
✓ Verify: Filtered sawtooth, cutoff works

**Step 3: Add envelope**
```faust
import("stdfaust.lib");
oscillator = os.sawtooth(440);
filtered = oscillator : fi.lowpass(3, 1000);
gate = button("gate");
envelope = en.adsr(0.01, 0.1, 0.7, 0.5, gate);
process = filtered * envelope;
```
✓ Verify: Envelope triggers, attack/release work

**Step 4: Add LFO modulation**
```faust
import("stdfaust.lib");
oscillator = os.sawtooth(440);
lfo = os.osc(2) * 200 + 1000;  // 800-1200 Hz sweep
filtered = oscillator : fi.lowpass(3, lfo);
gate = button("gate");
envelope = en.adsr(0.01, 0.1, 0.7, 0.5, gate);
process = filtered * envelope;
```
✓ Verify: LFO modulates filter cutoff

**Benefits:**
- Bug isolated to most recent addition
- Each step is small and manageable
- Can stop at working state if needed

---

## Technique 4: Test Fixtures

### Strategy
Create standard test signals to feed into modules.

### Common Test Signals

```faust
import("stdfaust.lib");

// Impulse: test transient response
impulse = 1 - 1';

// Dirac comb: test periodicity
dirac_comb(freq) = (ba.time % int(ma.SR/freq)) == 0;

// White noise: test frequency response
white_noise = no.noise;

// Sine sweep: test frequency response
sine_sweep(start_f, end_f, duration) = os.osc(freq)
with {
    ramp = ba.time / (duration * ma.SR);
    freq = start_f + (end_f - start_f) * ramp;
};

// DC signal: test DC blocking
dc_signal = 0.5;

// Nyquist test: test aliasing
nyquist_test = os.osc(ma.SR/2 - 100);
```

### Using Test Fixtures

**Example: Testing DC Blocking Filter**
```faust
import("stdfaust.lib");

// Module under test
dc_blocker = fi.dcblocker;

// Test signal: DC + audio
test_signal = 0.3 + os.osc(440) * 0.1;

// Expected: DC removed, audio passes
process = test_signal : dc_blocker;

// Visual check: should see no DC offset
```

**Example: Testing Filter Frequency Response**
```faust
import("stdfaust.lib");

// Module under test
test_filter = fi.lowpass(3, 1000);

// Sweep 20Hz to 20kHz over 10 seconds
test_signal = os.osc(freq)
with {
    duration = 10;
    freq = 20 * pow(1000, ba.time / (duration * ma.SR));
};

process = test_signal : test_filter;

// Listen: should roll off above 1kHz
```

---

## Technique 5: Comparison Testing

### Strategy
Compare your implementation against known-good reference.

### Example: Verifying Custom Filter

```faust
import("stdfaust.lib");

// Your custom implementation
my_lowpass(fc) = // ... your code ...

// Reference implementation
reference_lowpass(fc) = fi.lowpass(1, fc);

// Test signal
test_signal = no.noise * 0.1;

// Compare
cutoff = hslider("cutoff", 1000, 100, 10000, 1);
switch = checkbox("show_reference");

custom = test_signal : my_lowpass(cutoff);
reference = test_signal : reference_lowpass(cutoff);

process = select2(switch, custom, reference);

// Toggle between implementations and listen
// Should sound very similar
```

---

## Technique 6: Boundary Testing

### Strategy
Test modules with extreme values to find edge cases.

### Checklist for Each Module

Test with:
- [ ] **Zero input**: Does it handle silence?
- [ ] **Maximum input**: Does it clip gracefully?
- [ ] **Zero parameters**: Does it work with gain=0, freq=0?
- [ ] **Maximum parameters**: Does it handle extreme settings?
- [ ] **Negative values**: Are negative inputs handled?
- [ ] **Rapid changes**: Do fast parameter changes cause issues?

### Example: Testing Filter Stability

```faust
import("stdfaust.lib");

my_filter(cutoff, resonance) = fi.resonlp(cutoff, resonance, 1);

test_signal = os.osc(440);

// Test extreme resonance
cutoff = 1000;
resonance = hslider("Q", 10, 0.1, 100, 0.1);  // Allow extreme values

process = test_signal : my_filter(cutoff, resonance);

// Listen at high Q: does it stay stable or explode?
// If unstable, add limiter or clamp Q
```

---

## Technique 7: Scaffolding Code

### Strategy
Add temporary test code around your module, remove it later.

### Example: Testing Feedback Path

```faust
import("stdfaust.lib");

// Module to test: feedback delay
feedback_delay(fb_gain) = + ~ (de.delay(48000, delay_samples) : *(fb_gain))
with {
    delay_samples = 24000;  // 0.5 sec at 48kHz
};

// SCAFFOLD: Test input (remove later)
test_input = button("trigger") : ba.impulsify;

// SCAFFOLD: Monitor feedback gain (remove later)
fb_gain = hslider("feedback", 0.5, 0, 0.99, 0.01);

// SCAFFOLD: Visual feedback (remove later)
output_level = _ <: _, abs : _, vbargraph("level", 0, 1);

// Test
process = test_input : feedback_delay(fb_gain) : output_level;

// Once verified:
// 1. Remove test_input, fb_gain slider, output_level
// 2. Parameterize feedback_delay properly
// 3. Integrate into main code
```

---

## Real-World Example: Modular Reverb Testing

### Goal
Build a simple reverb, test each component.

### Module 1: Allpass Filter
**File: `test_allpass.dsp`**
```faust
import("stdfaust.lib");

allpass(maxdelay, delay, feedback) = (+ : de.delay(maxdelay, delay)) ~ *(feedback);

test_signal = button("impulse") : ba.impulsify;
process = test_signal : allpass(1000, 347, 0.7);

// Verify: echo with specific delay time
```

### Module 2: Comb Filter
**File: `test_comb.dsp`**
```faust
import("stdfaust.lib");

comb(maxdelay, delay, feedback) = + ~ (de.delay(maxdelay, delay) : *(feedback));

test_signal = button("impulse") : ba.impulsify;
process = test_signal : comb(10000, 4799, 0.8);

// Verify: resonant delay with pitch
```

### Module 3: Parallel Combs
**File: `test_parallel_combs.dsp`**
```faust
import("stdfaust.lib");

comb(maxdelay, delay, feedback) = + ~ (de.delay(maxdelay, delay) : *(feedback));

// Schroeder reverb comb delays (in samples at 48kHz)
parallel_combs = _ <:
    comb(10000, 4799, 0.8),
    comb(10000, 4999, 0.8),
    comb(10000, 5399, 0.8),
    comb(10000, 5801, 0.8)
    :> _;

test_signal = button("impulse") : ba.impulsify;
process = test_signal : parallel_combs;

// Verify: dense, diffuse tail
```

### Module 4: Full Reverb
**File: `reverb.dsp`**
```faust
import("stdfaust.lib");

allpass(maxdelay, delay, feedback) = (+ : de.delay(maxdelay, delay)) ~ *(feedback);
comb(maxdelay, delay, feedback) = + ~ (de.delay(maxdelay, delay) : *(feedback));

schroeder_reverb = _ : parallel_combs : series_allpasses
with {
    parallel_combs = _ <:
        comb(10000, 4799, 0.8),
        comb(10000, 4999, 0.8),
        comb(10000, 5399, 0.8),
        comb(10000, 5801, 0.8)
        :> _;

    series_allpasses =
        allpass(1000, 347, 0.7) :
        allpass(1000, 113, 0.7);
};

// Final integration test
mix = hslider("mix", 0.3, 0, 1, 0.01);
input_signal = _ ;  // Your audio source here

process = input_signal <: _, (schroeder_reverb : *(mix)) :> _;
```

**Benefits of this approach:**
- Each component verified independently
- Can swap implementations easily
- Easy to debug (know which module has bug)
- Can optimize individual modules

---

## Best Practices Summary

1. **Extract functions** - Give every logical unit a name
2. **Test in isolation** - Each module gets its own test file
3. **Progressive integration** - Add one piece at a time
4. **Use test fixtures** - Standard signals expose issues
5. **Compare to references** - Verify against known-good code
6. **Test boundaries** - Extreme values reveal bugs
7. **Scaffold temporarily** - Add test code, remove later

---

## Modular Testing Checklist

For each module:
- [ ] Extracted into named function
- [ ] Tested in isolated `.dsp` file
- [ ] Verified with test signals
- [ ] Boundary cases tested
- [ ] Compared to reference (if available)
- [ ] Documentation written
- [ ] Integration test passed

---

## When to Use Modular Testing

**Always:**
- Building complex systems
- Creating reusable libraries
- Debugging mysterious issues
- Optimizing performance (test before/after)

**Especially when:**
- Code exceeds 50 lines
- Multiple signal processing stages
- Feedback or recursion involved
- Sharing code with others

---

## Tools for Modular Testing

- **faust2jaqt**: Quick GUI for testing
- **faust2plot**: Visualize impulse/frequency response
- **faust2octave**: Export to Octave/MATLAB for analysis
- **faustide**: Online editor with instant feedback
- **Block diagrams**: faust -svg to see structure

---

## Conclusion

Modular testing transforms debugging from "find the needle in the haystack" to "verify each module, then composition."

**Remember:**
- Small modules are easy to test
- Tested modules compose confidently
- Composition errors are routing, not logic

Test small, integrate carefully, win big.
