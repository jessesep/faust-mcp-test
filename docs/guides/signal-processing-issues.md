# Signal Processing Issues in Faust DSP

**Version:** 1.0
**Date:** 2025-12-11
**Audience:** Intermediate Faust users
**Purpose:** Comprehensive guide to understanding and fixing common DSP signal processing issues

---

## Table of Contents

1. [Feedback and Stability Issues](#feedback-and-stability-issues)
2. [Causality and Delays](#causality-and-delays)
3. [DC Offset Problems](#dc-offset-problems)
4. [Sample Rate Independence](#sample-rate-independence)
5. [Amplitude and Clipping](#amplitude-and-clipping)
6. [Denormal Number Performance](#denormal-number-performance)

---

## Feedback and Stability Issues

### Overview

Feedback loops are fundamental to many DSP designs—reverb, delays with feedback, filters, and synthesizers all use them. However, unstable feedback can cause signals to grow without bounds, leading to audio artifacts, CPU spikes, and potential damage to audio hardware.

### The Core Problem: Feedback Gain

Every feedback loop has a **gain** associated with it. This gain determines what happens to the signal as it cycles back:

- **Gain < 1**: Signal decays over time (stable)
- **Gain = 1**: Signal sustains indefinitely (marginally stable)
- **Gain > 1**: Signal grows exponentially (unstable/runaway)

The stability of a feedback system depends on the magnitude of the feedback gain—for a feedback loop to be stable, the gain must be strictly less than 1.

#### Why This Matters

In audio processing, runaway oscillations aren't just annoying clicks and pops. They can:
- Saturate audio output clipping harshly
- Generate DC offset that builds up over time
- Consume excessive CPU cycles
- Create ultrasonic content that can damage speakers

### Problem: Unstable Feedback Gain

#### Wrong Approach

```faust
import("stdfaust.lib");

// BAD: Feedback gain of 0.5 seems safe, but multiplier comes AFTER lowpass
// Problem: gain is applied before filtering, allowing high frequencies through
// Result: Can oscillate at certain frequencies
process = + ~ (mem : fi.lowpass(1, 1000) : *(2.0));
```

**Why This Fails:**
- The gain of 2.0 exceeds 1, causing exponential growth
- Even with the lowpass filter, frequencies near cutoff can oscillate
- The multiplier comes after the filter, so the full signal is amplified

#### Right Approach

```faust
import("stdfaust.lib");

// GOOD: Feedback gain strictly < 1
fbgain = hslider("Feedback", 0.5, 0, 0.99, 0.01);  // Limited to 0.99 max
process = + ~ (mem : *(fbgain));
```

**Why This Works:**
- Gain is limited to < 1, guaranteeing stability
- Multiplier is in the feedback path, controlling gain directly
- Slider constraints prevent accidental instability

#### Step-by-Step Fix

1. **Identify the feedback path**: Find where the `~` operator is used
2. **Locate the multiplier**: Find all `*(value)` operations in feedback
3. **Verify the gain**: Ensure all gains in the loop multiply to < 1
4. **Test boundaries**: Set gain to 0.99 and verify stable operation
5. **Add safety limits**: Use sliders with max < 1

### Problem: Filter-Induced Oscillation

Sometimes a filter in the feedback path can still allow instability at specific frequencies.

#### Wrong Approach

```faust
import("stdfaust.lib");

// Problem: Resonant filter can cause oscillation in feedback
// even with gain < 1 overall, due to resonance peak
Q = 10;  // High Q = sharp resonance
process = + ~ (mem : fi.resonant_filter(1000, Q) : *(0.8));
```

**Why This Fails:**
- Resonant filters have gain peaks at the resonance frequency
- Even with 0.8 multiplier, the filter peak can exceed 1 at resonance
- The combination of filter resonance + gain causes oscillation

#### Right Approach

```faust
import("stdfaust.lib");

// GOOD: Reduce filter resonance and add extra attenuation
Q = 3;  // Moderate Q to limit peak
process = + ~ (mem : fi.resonant_filter(1000, Q) : *(0.7));
```

**Why This Works:**
- Lower Q reduces the resonance peak
- Combined gain (filter + multiplier) stays well below 1
- More margin for stability

### Problem: Leaky Integration (DC Accumulation)

An integrator (pure summing with feedback) will accumulate any DC offset in the input, growing without bound.

#### Wrong Approach

```faust
// Problem: Perfect integrator with no decay
// DC bias slowly accumulates and grows forever
integrator = + ~ mem;
process = integrator;
```

**Why This Fails:**
- An integrator adds all inputs together forever
- Even tiny DC bias (1e-6) compounds every sample
- After 44100 samples at 44.1kHz (1 second), DC offset has grown significantly
- Result: audio drifts and pops when reaching clipping boundary

#### Right Approach: Leaky Integrator

```faust
import("stdfaust.lib");

// GOOD: Leaky integrator with slight decay
leak = 0.9999;  // Just under 1
integrator = + ~ (mem : *(leak));
process = integrator;
```

**Why This Works:**
- Multiplication by 0.9999 in feedback causes slow decay
- DC offset decays instead of accumulating
- 0.9999 is close enough to 1 that it doesn't affect the main signal
- Decay time: 1 / (1 - leak) ≈ 10,000 samples

#### Right Approach: DC Blocking

```faust
import("stdfaust.lib");

integrator = + ~ mem;
// GOOD: Remove DC after integration
process = integrator : fi.dcblocker;
```

**Why This Works:**
- DC blocker is a high-pass filter at very low frequency (typically < 5 Hz)
- Removes accumulated DC without affecting audio content
- Works for any integrator-based design
- Standard solution used in professional audio

### Design Pattern: Safe Feedback Template

```faust
import("stdfaust.lib");

// Safe feedback design pattern
SafeFeedback(input, coef, filter_freq) =
  input : (+ ~ (mem : *(coef))) : filter_freq;

// Apply with DC blocking
fbout = SafeFeedback(input, 0.9, fi.dcblocker);
process = fbout;
```

**Key Principles:**
1. **Gain first**: The multiplier with coefficient < 1 comes immediately after mem
2. **Filtering second**: Optional filters come after gain control
3. **DC blocking last**: High-pass filter at the output removes any DC
4. **Tight coupling**: Keep multiplier and mem adjacent for clarity

### Diagnostic Checklist

- [ ] All feedback multipliers are < 1
- [ ] Resonant filters have Q limited to prevent peaks > 1
- [ ] DC blocking filter is present for integrators
- [ ] Test signal with silence to verify no runaway growth
- [ ] Monitor signal amplitude under quiet input conditions

---

## Causality and Delays

### Overview

**Causality** is a fundamental DSP principle: an output cannot depend on future inputs. In the discrete-time domain, this means a sample at time n cannot depend on samples at times n+1, n+2, etc.

In Faust, the compiler enforces causality strictly. Understanding causality is crucial for writing valid DSP code and designing efficient algorithms.

### Why Causality Matters

Causality ensures that:
- The processor can run in real-time
- Outputs are computable at each sample
- The system is physically realizable
- No infinite loops occur during compilation

### The Fundamental Problem: Zero-Delay Feedback

A **zero-delay feedback loop** violates causality by creating circular dependencies.

#### Wrong Approach: Zero-Delay Recursion

```faust
// ERROR: Zero-delay feedback loop - causality violation!
// process depends on its own future value
process = _ : + ~ _;
```

**Why This Fails:**
```
Compilation error: zero-delay feedback loop detected
Circle detected in dependencies
```

The compiler cannot resolve this because to compute `process`, it needs the previous value of `process`, but that value depends on the current value of `process`.

#### Right Approach: Add Memory/Delay

The solution is to insert a delay element (`mem` or `@`) to break the causality loop.

```faust
// CORRECT: mem adds one-sample delay
process = _ : + ~ mem;
```

**Why This Works:**
- `mem` delays the feedback signal by exactly 1 sample
- Now the current output depends on the *previous* feedback value
- The dependency chain terminates properly
- Compiler can schedule operations: compute sum, store to mem, use in next sample

### Understanding mem vs @()

Faust provides two delay mechanisms:

#### mem: One-Sample Delay

```faust
// mem is equivalent to @(1)
process = input : mem;  // Output is input delayed by 1 sample
```

- **Use**: Feedback loops, recursive definitions
- **Behavior**: `output[n] = input[n-1]`
- **Cost**: Minimal (just 1 sample of storage)
- **Most common**: This is what you use 99% of the time

#### @(N): Explicit Fixed Delay

```faust
// @(1) = 1 sample delay, @(1000) = 1000 samples
process = input : @(100);  // Output is input delayed by 100 samples
```

- **Use**: Precise timing, delay lines
- **Behavior**: `output[n] = input[n-N]`
- **Cost**: N samples of memory
- **Requirement**: N must be a compile-time constant

### Problem: Feedback Loop Without Delay

#### Wrong Approach

```faust
import("stdfaust.lib");

// ERROR: This creates a zero-delay feedback loop
// output directly feeds into the multiplier with no delay
recursive_amp = + ~ *(0.5);
process = recursive_amp;
```

**Compiler Error:**
```
Causality error: zero-delay feedback loop in recursive definition
```

**Why This Fails:**
- The `+` takes two inputs: fresh input and feedback
- Feedback comes from `*(0.5)` applied to output of `+`
- There's no delay between `+` output and its input
- Circular dependency detected

#### Right Approach: Add mem in Feedback

```faust
import("stdfaust.lib");

// CORRECT: mem breaks the causality loop
recursive_amp = + ~ (mem : *(0.5));
process = recursive_amp;
```

**Why This Works:**
- `mem` ensures feedback is delayed by 1 sample
- Output at sample n depends on input at n and feedback from sample n-1
- Clear causal chain: input[n] -> output[n] -> stored -> used at n+1

### Problem: Complex Recursion Without Proper Delays

Recursive definitions become tricky when multiple signals depend on each other.

#### Wrong Approach: Circular letrec

```faust
// ERROR: Mutual recursion without delays
process = x with {
  x = y + input;
  y = x * 0.5;
};
```

**Why This Fails:**
- `x` depends on `y`
- `y` depends on `x`
- No delay in either definition
- The compiler cannot resolve the circular dependency at compile time

#### Right Approach: Use Tick Notation

In Faust's `with` blocks, the special notation `x'` means "the previous value of x" (equivalent to `mem`).

```faust
// CORRECT: Use tick notation for previous values
process = x with {
  x = y' + input;
  y = (x * 0.5);
};
```

**Why This Works:**
- `y'` refers to the previous sample's `y` value
- Creates explicit delay between the definitions
- `x` depends on `y`'s *previous* value
- Causally valid: can compute x[n] from y[n-1]

### Problem: Multiple Feedback Paths

Complex feedback systems might have multiple loops needing careful delay placement.

#### Wrong Approach: Insufficient Delays

```faust
// Problematic: One path might have inadequate delay
feedback1 = + ~ *(0.5);      // mem inside multiplier - OK
feedback2 = + ~ (0.5 * _);   // mem outside - PROBLEM
process = feedback1 : feedback2;
```

**Why This Fails:**
- The arrangement of operations matters
- `0.5 * _` doesn't have mem inside
- May cause causality violations depending on how paths combine

#### Right Approach: Clear Delay Positioning

```faust
import("stdfaust.lib");

// CORRECT: Each feedback path has explicit delay
feedback1 = + ~ (mem : *(0.5));
feedback2 = + ~ (mem : fi.lowpass(1, 5000) : *(0.4));
process = feedback1 : feedback2;
```

**Why This Works:**
- Both loops have `mem` immediately after the summing point
- Filters come after mem, not affecting causality
- Clear intent: mem first, processing second
- Easy to verify stability (both gains < 1)

### Variable-Length Delays

Sometimes you need a delay that changes at runtime (e.g., a delay effect where you can change the delay time).

#### Wrong Approach: Using @ with Variable Input

```faust
import("stdfaust.lib");

// ERROR: @ requires compile-time constant
delaylen = hslider("delay", 1000, 0, 5000, 1);  // Runtime control
process = @(delaylen);  // ERROR: delaylen is not constant!
```

**Compiler Error:**
```
Error: delay size must be compile-time constant
```

**Why This Fails:**
- The `@()` operator needs to allocate fixed memory at compile time
- Runtime values can't control the allocation

#### Right Approach: Use Variable Delay from Library

```faust
import("stdfaust.lib");

// CORRECT: Use de.fdelay for variable delays
delaylen = hslider("delay", 1000, 0, 5000, 1);
max_delay = 5000;
process = de.fdelay(max_delay, delaylen);
```

**Why This Works:**
- `de.fdelay` allocates max_delay samples at compile time
- Reads from this buffer at variable positions at runtime
- Handles fractional delays and linear interpolation automatically

### Design Pattern: Causally Correct Feedback

```faust
import("stdfaust.lib");

// Template for causally correct systems
SafeRecursive(input, coef) =
  output
  with {
    output = input : + ~ (mem : *(coef));
  };

// Usage
process = SafeRecursive(input, 0.8);
```

**Key Principles:**
1. **mem first**: Place delay immediately after summing
2. **Processing second**: Filters/gains come after delay
3. **Explicit**: Make delays obvious in the code
4. **Test early**: Compile frequently to catch causality errors early

### Diagnostic Checklist

- [ ] All feedback loops have `mem` or `@(N)` in the path
- [ ] No circular dependencies without delays
- [ ] Variable delays use `de.fdelay` or similar from library
- [ ] Code compiles without causality warnings
- [ ] Behavior is correct at 44.1kHz and 48kHz

---

## DC Offset Problems

### Overview

**DC offset** (direct current) refers to the mean value of an audio signal. While audio signals should oscillate around zero, poorly designed systems can develop a steady DC bias that:
- Wastes headroom in fixed-point audio
- Can damage amplifiers or speakers with high power DC
- Creates audio pops and clicks when the DC level changes suddenly
- Builds up over time in systems with integration

### Why DC Offset Accumulates

Audio signals in digital systems are represented as signed numbers centered at zero. The ideal signal oscillates between -1 and +1 with a mean of 0. However, several operations can introduce DC:

1. **Integration**: Summing operations without feedback decay
2. **Asymmetric processing**: Filtering that affects low frequencies differently
3. **Rounding errors**: Fixed-point accumulation in feedback loops
4. **Initial conditions**: Filters starting with non-zero state

### Problem: Integrator Without DC Blocking

A pure integrator (summing all inputs) will accumulate any DC in the input.

#### Wrong Approach

```faust
import("stdfaust.lib");

// PROBLEM: Pure integrator accumulates all input values
// Even with zero input, floating point errors accumulate
integrator = + ~ mem;
process = integrator;
```

**What Happens:**
```
Sample 1: input = 0, output = 0
Sample 2: input = 0, output = 0 + 0 = 0
...
Sample 1000: input = 0, output should be 0, but floating point creep added 1e-15
Sample 44100: DC bias has grown to measurable level
After 10 seconds: Signal is noticeably shifted away from zero
```

**Why This Fails:**
- The integrator sums forever without any decay
- Floating point rounding errors compound
- Eventually, the DC bias grows enough to cause clicking when signal level changes
- Any real DC in the input grows exponentially (1 sample delay, so gain=1 feedback)

#### Right Approach: DC Blocking Filter

```faust
import("stdfaust.lib");

integrator = + ~ mem;
process = integrator : fi.dcblocker;
```

**Why This Works:**
- `fi.dcblocker` is a high-pass filter with cutoff around 5 Hz
- Passes audio frequencies (> 5 Hz) unchanged
- Removes the DC component (0 Hz)
- Simple, standard solution used everywhere

**How fi.dcblocker Works:**

```faust
// Simplified DC blocker (real implementation is optimized)
dcblocker = _ : - ~ *(0.995);
// Removes DC while preserving signals above ~5 Hz
```

The trick: subtracting the slow-moving average (0.995 feedback) removes DC.

#### Right Approach: Leaky Integrator

Instead of blocking DC after integration, prevent it from accumulating in the first place.

```faust
import("stdfaust.lib");

leak = 0.9999;
leaky_integrator = + ~ (mem : *(leak));
process = leaky_integrator;
```

**Why This Works:**
- The feedback gain is slightly less than 1 (0.9999)
- This causes slow exponential decay
- DC bias decays instead of accumulating
- Much cleaner than post-filtering

**Decay Time Calculation:**
```
Decay time constant = 1 / (1 - leak) samples
For leak = 0.9999: decay ≈ 10,000 samples ≈ 0.23 seconds at 44.1kHz

So a DC bias will decay to 37% of its value in 0.23 seconds
Complete decay (to noise floor) takes ~1 second
```

This is fast enough for most audio applications.

### Problem: Feedback with DC Bias

#### Wrong Approach

```faust
import("stdfaust.lib");

// PROBLEM: Feedback with no DC prevention
// If input has DC, it gets multiplied by gain in feedback
// Gain < 1 but repeated: sum converges, but to non-zero value
feedback_filter = + ~ (mem : *(0.9));
process = feedback_filter;
```

**What Happens:**
- Input with DC bias of +0.01
- First sample: output = 0.01
- Second: output = 0.01 + (0.01 * 0.9) = 0.019
- Third: output = 0.01 + (0.019 * 0.9) = 0.0271
- Converges to: 0.01 / (1 - 0.9) = 0.1

So the DC bias amplifies by a factor of 1/(1-gain). With gain=0.9, DC amplifies 10x!

#### Right Approach: High-Pass Filter in Feedback

```faust
import("stdfaust.lib");

// GOOD: High-pass filter removes DC from feedback
fbloop = + ~ (mem : *(0.9) : fi.highpass(1, 20));
process = fbloop;
```

**Why This Works:**
- High-pass at 20 Hz removes DC from the feedback
- The 0.9 gain multiplies the AC (audio) component only
- DC cannot accumulate in the loop
- Input DC is not amplified

**Frequency Response Impact:**
- Signals > 20 Hz: behave normally (gain = 0.9)
- Signal at 5 Hz: already attenuated by 20 dB from highpass
- DC (0 Hz): completely removed

### Problem: Asymmetric High-Pass Filtering

Some effects require high-pass filtering for other reasons, but the asymmetry can cause DC problems.

#### Subtle Problem

```faust
import("stdfaust.lib");

// This looks fine, but...
wet = input : fi.highpass(1, 100) : *(0.5);
dry = input : *(0.5);
process = wet, dry :> _;
```

**The Issue:**
- `wet` path has high-pass (removes DC)
- `dry` path has no filtering
- When mixed: 50% of dry DC remains
- Especially problematic if the wet/dry balance changes

#### Right Approach: Block DC Before Mixing

```faust
import("stdfaust.lib");

process = input : fi.dcblocker : (some_processing);
```

**Why This Works:**
- DC is blocked once at the input
- All downstream processing works with DC-free signal
- No matter what you do downstream, DC won't creep back

### Design Pattern: DC-Safe Processing Chain

```faust
import("stdfaust.lib");

// Safe template for DC-prone designs
DCsafeProcessor(input, feedback_coef) =
  (input : fi.dcblocker)           // Block input DC first
  : (+ ~ (mem : *(feedback_coef))) // Safe feedback
  : fi.dcblocker                   // Block output DC just in case
;

process = DCsafeProcessor(input, 0.95);
```

**Key Principles:**
1. **Block at input**: Remove DC before processing
2. **Leaky feedback**: Use gain < 1 in feedback
3. **Block at output**: Extra protection for safety
4. **Verify**: Check scope display shows signal centered at zero

### Diagnostic Checklist

- [ ] Integrators have DC blocking filter or leaky feedback
- [ ] Feedback loops use highpass to prevent DC buildup
- [ ] DC blocker applied before long-delay lines
- [ ] Scope visualization shows signals centered at zero
- [ ] No sudden audio pops when changing parameters

---

## Sample Rate Independence

### Overview

Professional audio systems work at many different sample rates: 44.1 kHz, 48 kHz, 96 kHz, 192 kHz. A well-written Faust DSP should produce musically equivalent results at any sample rate.

However, many implementations accidentally bake in a specific sample rate, causing:
- Timing to be wrong at other sample rates
- Filters to have wrong frequency
- Envelopes to have wrong duration
- Completely broken behavior at non-native sample rates

### Why Sample Rate Independence Matters

Audio software must work in DAWs and hardware that use different sample rates. Writing SR-dependent code is a common mistake that:
- Limits software to specific hardware
- Causes mysterious issues when sample rate changes
- Makes code unmaintainable
- Creates version-specific plugins

### The Core Concept: Samples vs. Time

The key insight: **Time is absolute, samples are relative to sample rate.**

```
Time (seconds) = Samples / Sample_Rate
Samples = Time (seconds) * Sample_Rate
```

This means:
- A 100ms delay should be `0.1 * ma.SR` samples at any rate
- A 100-sample delay is DIFFERENT lengths of time at different rates
- Filter frequencies must be normalized by the sample rate

### Problem: Hard-Coded Delays in Samples

#### Wrong Approach

```faust
// PROBLEM: Assumes 48kHz sample rate
delay_samples = 48000;  // 1 second at 48kHz
process = @(delay_samples);

// At 44.1kHz: This is actually 1.087 seconds (wrong!)
// At 96kHz: This is actually 0.5 seconds (wrong!)
```

**Why This Fails:**
- Code locks in 48,000 samples
- At 44.1kHz: delay = 48,000/44,100 = 1.088 seconds
- At 96kHz: delay = 48,000/96,000 = 0.5 seconds
- Musically wrong at any rate other than 48kHz

#### Right Approach: Calculate from Time

```faust
import("stdfaust.lib");

// CORRECT: Time-based delay works at any SR
delay_time_sec = 1.0;  // 1 second, always
delay_samples = int(delay_time_sec * ma.SR);
process = @(delay_samples);
```

**Why This Works:**
- `ma.SR` is the sample rate (set at runtime)
- Multiplication by sample rate converts seconds to samples
- `int()` rounds to nearest integer (required by @ operator)
- Works identically at 44.1kHz, 48kHz, 96kHz, etc.

**Example Calculations:**
```
At 44.1kHz:  1.0 * 44100 = 44100 samples
At 48kHz:    1.0 * 48000 = 48000 samples
At 96kHz:    1.0 * 96000 = 96000 samples
All represent exactly 1 second!
```

### Problem: Hard-Coded Filter Frequencies

#### Wrong Approach

```faust
import("stdfaust.lib");

// PROBLEM: Filter frequency interpretation changes with SR
// This uses 1000 Hz cutoff, which the library handles...
// but old custom filters might not!
process = fi.lowpass(3, 1000);
```

**Why This CAN Be Wrong:**
- Standard library filters like `fi.lowpass` DO handle SR correctly
- But custom filter implementations might assume 48kHz
- Old code or external libraries might use hard-coded coefficients

#### Right Approach: Use Library Filters

```faust
import("stdfaust.lib");

// CORRECT: Standard library handles SR normalization
cutoff_hz = 1000;
process = fi.lowpass(3, cutoff_hz);
```

**Why This Works:**
- Faust standard library filters automatically normalize by SR
- You specify frequency in Hz (Hz is independent of SR)
- Library calculates the correct coefficient for any SR
- No manual normalization needed

#### Right Approach: Custom Filter Normalization

If you write a custom filter, normalize frequency:

```faust
import("stdfaust.lib");

// Custom one-pole lowpass
custom_lowpass(freq) =
  // Normalize frequency: map Hz to 0-1 range
  coef = 2 * ma.PI * freq / ma.SR;
  // Use normalized coefficient
  _ : - ~ *(1 - coef);
;

process = custom_lowpass(1000);
```

**Key Principle:**
```
// Generic normalized one-pole filter
normalized_freq = 2 * PI * freq_hz / sample_rate
coefficient = tanh(normalized_freq / 2)  // various designs
output = input : - ~ *(1 - coefficient)
```

### Problem: Hard-Coded Time/Attack Envelopes

#### Wrong Approach

```faust
import("stdfaust.lib");

// PROBLEM: Attack time in samples (assumes specific SR)
attack_samples = 1000;  // ~23ms at 44.1kHz, ~21ms at 48kHz
process = an.amp_follower(attack_samples);
```

**Why This Fails:**
- 1000 samples is 22.7ms at 44.1kHz
- 1000 samples is 20.8ms at 48kHz
- 1000 samples is 10.4ms at 96kHz
- Timing behavior changes dramatically with SR

#### Right Approach: Use Time-Based Parameters

```faust
import("stdfaust.lib");

// CORRECT: Specify time, not samples
attack_time = 0.020;  // 20ms, always
release_time = 0.100; // 100ms, always
process = an.amp_follower_ar(attack_time, release_time);
```

**Why This Works:**
- `an.amp_follower_ar` takes time in seconds
- Internally converts to samples using SR
- Behavior identical at any sample rate

### Problem: Tempo/Beat Sync Without SR

#### Wrong Approach

```faust
// PROBLEM: Delay based on beats without SR consideration
// Assumes some fixed tempo and SR
bpm = 120;
delay_samples = 44100 / 4;  // 1/4 beat at 44.1kHz, wrong!
process = @(delay_samples);
```

**Why This Fails:**
- Completely wrong at different sample rate
- Not even correct beat sync without more info

#### Right Approach: Calculate Beats to Time to Samples

```faust
import("stdfaust.lib");

bpm = 120;
seconds_per_beat = 60 / bpm;
beats = 0.25;  // 1/4 beat

delay_time = seconds_per_beat * beats;
delay_samples = int(delay_time * ma.SR);
process = @(delay_samples);
```

**Why This Works:**
- Beats converted to time in seconds
- Time multiplied by SR for samples
- Correct at any sample rate and tempo

### Problem: Lookup Table Interpolation Without SR

Some effects use pre-calculated lookup tables that assume a specific SR.

#### Wrong Approach

```faust
// PROBLEM: LFO rate hard-coded for 48kHz
lfo_rate = 0.1;  // 0.1 Hz perceived at 48kHz
table_size = 512;
process = os.phasor(lfo_rate) : *(table_size) : int : rdtable(table_size, wavetable);
```

**Why This Fails:**
- `os.phasor` outputs 0-1 ramp
- Frequency is in Hz, but implementation might use hard-coded SR
- Actual rate might change if original SR assumption breaks

#### Right Approach: Let Standard Library Handle It

```faust
import("stdfaust.lib");

lfo_rate = hslider("Rate", 0.5, 0, 10, 0.01);
process = os.osc(lfo_rate);  // LFO oscillator
```

**Why This Works:**
- `os.osc` handles frequency normalization internally
- You specify frequency in Hz
- Works at any sample rate

### Design Pattern: SR-Independent Template

```faust
import("stdfaust.lib");

// Template for SR-independent code
SRindependentProcessor(delay_time_sec, filter_freq_hz, attack_time_sec) =
  // Time-based delay
  (@(int(delay_time_sec * ma.SR)))
  // Frequency-based filter (library handles normalization)
  : fi.lowpass(3, filter_freq_hz)
  // Time-based envelope
  : an.amp_follower_ar(attack_time_sec, attack_time_sec)
;

// All parameters in absolute physical units (seconds, Hz)
process = SRindependentProcessor(0.5, 1000, 0.01);
```

**Key Principles:**
1. **Use ma.SR**: Multiply sample counts by ma.SR
2. **Use library filters**: They normalize frequency for you
3. **Use time-based library functions**: Specify time in seconds
4. **Test at multiple rates**: Verify at 44.1kHz, 48kHz, 96kHz
5. **Document assumptions**: Make SR independence explicit

### Diagnostic Checklist

- [ ] All delays calculated from time using ma.SR
- [ ] All time parameters specified in seconds
- [ ] Standard library filters used for frequency-dependent processing
- [ ] Tested successfully at 44.1kHz, 48kHz, 96kHz
- [ ] Code compiles without SR-related warnings
- [ ] Comments document SR independence

---

## Amplitude and Clipping

### Overview

Audio signals represent physical quantities (voltage, pressure) mapped to a digital range, typically -1.0 to +1.0. **Clipping** occurs when the signal exceeds these bounds, causing severe audible distortion. Understanding amplitude management prevents unwanted clipping and maximizes audio quality.

### Why Amplitude Control Matters

Proper gain staging throughout a signal chain:
- Prevents harsh digital clipping
- Maximizes signal-to-noise ratio
- Ensures headroom for unexpected transients
- Enables natural-sounding soft limiting

### Problem: Summing Multiple Signals Without Attenuation

#### Wrong Approach

```faust
import("stdfaust.lib");

// PROBLEM: Summing two full-amplitude signals
sig1 = os.osc(440);    // Amplitude: -1 to +1
sig2 = os.osc(660);    // Amplitude: -1 to +1
process = sig1, sig2 :> _;  // Sum: -2 to +2 (CLIPPING!)
```

**Why This Fails:**
- Each oscillator outputs amplitude -1 to +1
- When summed, max amplitude = 2
- Audio system can only represent -1 to +1
- Everything above ±1 gets hard-clipped (chopped off)
- Result: Hard, digital distortion (not musically pleasant)

**Clipped Waveform:**
```
Unclipped sine wave:      -1 -----0.5----0----0.5----+1
Clipped at ±1:            -1 -----0.5----0----0.5----+1  (OK)

Unclipped sum:            -2 -----0-----0-----0----+2
Clipped at ±1:            -1 -----0-----0-----0----+1  (HARSH!)
The smooth sine becomes a square wave at clipping point
```

#### Right Approach: Attenuate Sum

```faust
import("stdfaust.lib");

sig1 = os.osc(440);
sig2 = os.osc(660);
// CORRECT: Divide by number of signals
process = sig1, sig2 :> /(2);
```

**Why This Works:**
- Sum of two signals: amplitude = ±2
- Divide by 2: amplitude = ±1 (fits in range)
- General rule: sum N signals, divide by N (or use /(sqrt(N)) for RMS)

**Choosing the Attenuation:**
```
// Linear divide: ensures no clipping
sum_N_signals = sig1, sig2, ..., sigN :> /(N);

// Alternative: RMS-based (more even perceived level)
// For N equal-amplitude signals, divide by sqrt(N)
sum_N_signals = sig1, sig2 :> /(sqrt(2));
```

### Problem: Filtered Signal Resonance Peaks

Some filters (resonant filters, bandpass) have peaks in their frequency response that boost certain frequencies.

#### Wrong Approach

```faust
import("stdfaust.lib");

// PROBLEM: Bandpass filter has resonance peak
// Peak gain at resonance frequency can exceed 1
Q = 10;  // High Q = sharp peak
freq = 1000;
input_level = 0.8;  // Seems safe

// At resonance: output = 0.8 * peak_gain
// If peak_gain = 2 (Q=10 at 1kHz), output = 1.6 (CLIPPING!)
process = *(input_level) : fi.resonant(freq, Q);
```

**Why This Fails:**
- Resonant filters have gain peaks at the center frequency
- The peak gain depends on Q (quality factor)
- High Q = sharp, tall peak
- Example: Q=10 can have peak gain of 2-3 at resonance
- Input scaling doesn't account for filter boost

#### Right Approach: Reduce Peak or Scale After Filter

```faust
import("stdfaust.lib");

Q = 10;
freq = 1000;

// OPTION 1: Reduce filter Q to limit peak
Q = 3;  // Lower Q = wider peak with less height
process = fi.resonant(freq, Q);

// OPTION 2: Reduce input to account for peak
input_scaled = *(0.5);  // Reduce input level
process = input_scaled : fi.resonant(freq, Q);

// OPTION 3: Both - safest approach
process = *(0.6) : fi.resonant(freq, 3);
```

**Why This Works:**
- Lower Q = naturally limited peak
- Input scaling creates safety margin
- Combined approach provides double protection

### Problem: Gain Accumulation Across Processing Chain

#### Wrong Approach

```faust
import("stdfaust.lib");

// PROBLEM: Each stage multiplies signal
stage1 = *(2);  // 2x gain
stage2 = *(2);  // 2x gain
stage3 = *(2);  // 2x gain

// Total: input * 2 * 2 * 2 = input * 8
// If input is 0.5, output is 4.0 (SEVERE CLIPPING!)
process = stage1 : stage2 : stage3;
```

**Why This Fails:**
- Each stage seems reasonable individually
- But cascade effect multiplies gains: 2 * 2 * 2 = 8
- Tiny input becomes huge output
- Unpredictable behavior

#### Right Approach: Plan Gain Stages

```faust
import("stdfaust.lib");

// CORRECT: Calculate total gain and plan accordingly
// Plan: each stage processes at level 0.3 - 0.9

stage1 = *(1.0);    // Unity gain, just process
stage2 = *(0.5);    // Reduce by half
stage3 = *(0.5);    // Reduce by half

// Total: 1.0 * 0.5 * 0.5 = 0.25 (safe!)
// Also: scale input to reach desired output level
process = *(0.8) : stage1 : stage2 : stage3 : *(4);
// Now: input * 0.8 * 1.0 * 0.5 * 0.5 * 4 = input * 0.8 (reasonable)
```

**Gain Staging Checklist:**
1. Calculate total gain from all multiplications
2. Ensure intermediate levels stay in 0.1-0.9 range
3. Use output scaling to reach target level
4. Verify with peak-holding meter
5. Test with loudest possible input signal

### Problem: Hard Clipping vs. Soft Clipping

Sometimes clipping is unavoidable. You can choose the type.

#### Hard Clipping (Bad)

```faust
import("stdfaust.lib");

// WRONG: Hard clipping creates harsh digital artifacts
// select2(signal > 1, signal, 1) truncates at boundary
hardclip(x) = select2(x > 1, select2(x < -1, x, -1), 1);
process = highgain_signal : hardclip;
```

**Why This Sounds Bad:**
- Instantaneous transition from linear to flat
- Creates high-frequency artifacts (aliasing)
- Sounds like digital damage
- Not musically pleasant

**Waveform Effect:**
```
Sine wave approaching hard clip:
Before clip: smooth curve up to +1
At clip: instant flat line at +1
After clip: smooth curve continuing
Result: Square wave segment (harsh!)
```

#### Soft Clipping (Better)

```faust
import("stdfaust.lib");

// CORRECT: Soft clipping compresses smoothly
softclip(x) = tanh(x);  // Smooth saturation
process = highgain_signal : softclip;
```

**Why This Sounds Better:**
- `tanh` provides smooth saturation curve
- Transitions gradually from linear to flat
- Sounds like analog tape or tube saturation
- Musically pleasing (not plastic-like clipping)

**Waveform Effect:**
```
Sine wave approaching soft clip:
Before saturation: linear (1:1 input to output)
Saturation region: smooth curve (asymptotic to ±1)
After saturation: approaches ±1 (not quite reaching it)
Result: Soft compression (musical!)
```

**Soft Clipping Functions:**
```faust
// tanh is most common (smooth, gentle)
softclip1(x) = tanh(x);

// tanh(pi*x/2) for different saturation character
softclip2(x) = tanh(ma.PI * x / 2);

// Cubic soft clip (less CPU, approximate)
softclip3(x) = select2(abs(x) > 1, x, sign(x));
  // This isn't quite right, but shows the idea

// Correct cubic for abs(x) > 1:
softclip3(x) = select2(abs(x) > 2/3,
  sign(x) * (1 - (1 - abs(x))^2 / 2),  // For |x| > 2/3
  x);  // For |x| <= 2/3
```

### Problem: Not Using a Limiter

When you absolutely cannot afford clipping (professional audio), use a limiter.

#### Wrong Approach

```faust
import("stdfaust.lib");

// RISKY: Relying on soft clipping for final output
process = (some_processing) : tanh;
```

**Why This Is Risky:**
- Soft clipping works, but distorts audio
- Listeners hear the saturation character
- Not transparent
- Some audio peaks still exceed 0dB before soft clip kicks in

#### Right Approach: Use a Limiter

```faust
import("stdfaust.lib");

// CORRECT: Limiter prevents clipping transparently
// First: process audio
processed = (some_processing);

// Second: apply limiter
// co.limiter_1176_R4_mono is a professional 1176 limiter simulation
process = processed : co.limiter_1176_R4_mono;
```

**Why This Works:**
- Limiter monitors signal level continuously
- Reduces gain when signal approaches 0dB
- Prevents ANY clipping
- Sound is natural (no audible compression if set correctly)
- Transparent (listener can't tell it's there)

**How a Limiter Works:**
```
Input level < threshold: No action, gain = 1
Input level >= threshold: Reduce gain to keep output at threshold
Gain reduction = threshold / input_level

Example with threshold = 0.9:
- Input 0.9: gain = 0.9/0.9 = 1.0 (no reduction)
- Input 1.0: gain = 0.9/1.0 = 0.9 (10% reduction)
- Input 2.0: gain = 0.9/2.0 = 0.45 (55% reduction)

Result: Output never exceeds 0.9, but natural signal levels are unaffected
```

### Design Pattern: Safe Audio Chain

```faust
import("stdfaust.lib");

// Safe template for audio processing
SafeAudioChain(
  input,
  input_gain,    // For user control
  filter_freq,   // User parameter
  output_gain    // For final scaling
) =
  input
  : *(input_gain)           // Controlled input level
  : fi.lowpass(3, filter_freq)  // Processing
  : *(0.5)                  // Intermediate scaling
  : co.limiter_1176_R4_mono // Prevent clipping
  : *(output_gain)          // Output level
;

process = SafeAudioChain(input, 0.5, 5000, 1.0);
```

**Key Principles:**
1. **Input attenuation**: Control input level with slider
2. **Intermediate scaling**: Keep levels in 0.1-0.9 range
3. **Soft clipping or limiting**: Use one for safety
4. **Output scaling**: Reach desired output level
5. **Monitor levels**: Use spectrum analyzer to verify

### Diagnostic Checklist

- [ ] All signal summing includes appropriate attenuation
- [ ] Resonant filters have limited peak gain
- [ ] Total gain across chain is calculated and safe
- [ ] Either soft clipping or limiter is used
- [ ] Intermediate signal levels stay in 0.1-0.9 range
- [ ] Peak meter shows no clipping during loud passages
- [ ] Audio sounds natural, no compression artifacts

---

## Denormal Number Performance

### Overview

**Denormal numbers** (also called subnormal numbers) are a special category of floating-point numbers near zero. They're represented differently in hardware and cause severe performance degradation when processed. Understanding and preventing denormals is crucial for real-time audio processing.

### What Are Denormal Numbers?

In floating-point arithmetic, numbers are represented with an exponent and mantissa. **Denormal numbers** occur when:
- The exponent is at its minimum value
- The number is extremely small (< ~1e-37 in 32-bit float)
- Common in audio: signals that decay to silence

**Why They Exist:**
Without denormals, there would be a "gap" between zero and the smallest normal number. Denormals fill that gap.

**The Problem:**
Modern CPUs have special hardware for normal numbers, but denormal numbers use slower microcode paths. Processing denormals can be 100-1000x slower than normal numbers.

### Problem: Reverb Tail Causing CPU Spikes

#### Wrong Approach

```faust
import("stdfaust.lib");

// PROBLEM: Long reverb with feedback can create denormals
// Feedback decays: 0.99^n approaches zero very slowly
// After 46 seconds at 44.1kHz: signal ≈ 1e-20 (DENORMAL!)

reverb_feedback = + ~ (mem : *(0.99) : fi.lowpass(1, 5000));
long_reverb = reverb_feedback : fi.allpass_pair;

process = input : long_reverb;
```

**Why This Causes Problems:**
- Feedback coefficient 0.99 decays very slowly
- Decay time: -ln(0.01) / ln(0.99) ≈ 460 samples ≈ 10 seconds to reach 1% of original
- Complete decay to denormal levels: 30+ seconds
- During decay, numbers approach subnormal range
- CPU spiking: when denormals are present, reverb processing can take 10-100ms per buffer instead of 1ms

#### Right Approach: Prevent Denormals

```faust
import("stdfaust.lib");

// GOOD: Add small noise floor to prevent denormals
reverb_feedback = + ~ (mem : *(0.99) : fi.lowpass(1, 5000));

// Add tiny noise (inaudible) to prevent denormals
denormal_prevention = reverb_feedback + (no.pink_noise * 1e-20);

process = input : denormal_prevention;
```

**Why This Works:**
- The 1e-20 noise floor is far below human hearing (~-160dB)
- Denormals are still possible but much less likely
- Overall CPU usage stays constant even with long reverb tails
- Audio quality unchanged (noise is inaudible)

**Alternative: Use Library Denormal Protection**

```faust
import("stdfaust.lib");

// Primepower adds denormal protection to delay lines
long_reverb = input : de.primepower(freverbamis(room, damp, wet_dry));

process = long_reverb;
```

### Problem: Feedback Loops Approaching Silence

#### Wrong Approach

```faust
import("stdfaust.lib");

// PROBLEM: Decay without safety net
decay = + ~ (mem : *(0.9999));  // Very slow decay (45 seconds)
process = decay;

// After 5 minutes of silence: signal in feedback line is denormal
// CPU spikes every time input changes and triggers feedback path
```

**Why This Fails:**
- The 0.9999 coefficient gives extremely slow decay
- Denormals definitely occur during the long tail
- Each audio block processes denormals, causing stuttering
- Particularly bad in DAWs with small buffer sizes

#### Right Approach: Gate Quiet Signals

```faust
import("stdfaust.lib");

threshold = 1e-6;  // Gate threshold (extremely quiet)
gate(x) = select2(abs(x) < threshold, x, 0);

decay = + ~ (mem : *(0.9999) : gate);
process = decay;
```

**Why This Works:**
- Signals below 1e-6 (100dB below full scale) are forced to zero
- Denormals never accumulate (they're caught and zeroed)
- Zero has no performance penalty
- The gating is inaudible (threshold is below noise floor)
- Reverb naturally fades because very quiet signals are killed

**Gating Impact:**
```
Signal level > 1e-6: passes through normally (audible)
Signal level < 1e-6: forced to zero immediately (below hearing)

Result: Reverb tail fades naturally over ~10 seconds, then dies abruptly
But the abrupt death is inaudible (already far below noise floor)
```

### Problem: Multiple Delay Lines Accumulating Denormals

#### Wrong Approach

```faust
import("stdfaust.lib");

// PROBLEM: Multiple cascaded delays all decaying
delay1 = @(1000) : *(0.999);
delay2 = @(2000) : *(0.999);
delay3 = @(3000) : *(0.999);

process = input : delay1 : delay2 : delay3;

// Each delay line independently decays to denormal range
// Three denormal-processing units = 3x CPU hit!
```

**Why This Fails:**
- Each delay line is a separate memory buffer
- Each buffer independently accumulates signal that decays to denormals
- Three denormal sources = severe CPU usage

#### Right Approach: Centralized Denormal Prevention

```faust
import("stdfaust.lib");

// BETTER: Apply denormal prevention once at output
delay1 = @(1000) : *(0.999);
delay2 = @(2000) : *(0.999);
delay3 = @(3000) : *(0.999);

denormal_prevention = + (no.pink_noise * 1e-20);

process = input : delay1 : delay2 : delay3 : denormal_prevention;
```

**Why This Works:**
- Single noise floor added at the end
- All delay lines fed with non-denormal signal
- Much more efficient

**Alternative: Use PRIMEpower from Library**

```faust
import("stdfaust.lib");

// Use library's denormal protection
delaybank = @(1000) : @(2000) : @(3000);
process = input : delaybank : de.primepower;
```

### Problem: Detecting Denormal Issues

Sometimes you have denormal performance problems but don't know where they're coming from.

#### Diagnosis

```faust
import("stdfaust.lib");

// Add this to monitor for denormals
check_denormal(x) = x : *(0);  // Dummy computation
check_denormal(x) =
  select2(
    (x > 0) & (x < 1e-30),  // Roughly in denormal range
    x,
    x + 1e-20  // Add prevention
  );

process = some_dsp_chain : check_denormal;
```

**Symptoms of Denormal Problems:**
- CPU usage spikes during silence or reverb tails
- Spikes increase over time (denormals accumulate)
- Stops after fade out (~30+ seconds)
- More noticeable with more complex DSP

### Design Pattern: Denormal-Safe Processor

```faust
import("stdfaust.lib");

// Template for denormal-safe DSP
DenormalSafeProcessor(input, feedback_coef) =
  // Main processing with denormal-prone feedback
  (input : + ~ (mem : *(feedback_coef)))
  // Prevent denormals at output
  : + (no.pink_noise * 1e-20)
;

// Alternative: Gate approach
DenormalSafeProcessor_Gated(input, feedback_coef) =
  threshold = 1e-6;
  gate(x) = select2(abs(x) < threshold, x, 0);

  (input : + ~ (mem : *(feedback_coef) : gate));

process = DenormalSafeProcessor(input, 0.95);
```

**Key Principles:**
1. **Feedback with high gain**: Likely to cause denormals
2. **Prevent early**: Better to add noise than fix denormals
3. **Subsonic noise**: 1e-20 is inaudible (below -160dB)
4. **Gate if preferred**: Alternative to noise approach
5. **Test in DAW**: CPU meter should stay flat during silence

### Diagnostic Checklist

- [ ] Reverb/delay tails don't cause CPU spikes
- [ ] Long decays don't increase latency
- [ ] Silence doesn't trigger high CPU usage
- [ ] Denormal prevention is applied
- [ ] Either noise-floor or gating approach is used
- [ ] CPU usage is consistent over time
- [ ] No audio artifacts from denormal prevention

---

## Summary: DSP Best Practices

### Feedback Stability
- Ensure feedback gain < 1
- Use `mem` for unit delays
- Apply DC blocking after integration
- Test with conservative values

### Causality and Delays
- Every feedback loop must have `mem` or `@(N)`
- Use tick notation `x'` in `with` blocks for delayed references
- Variable delays use `de.fdelay(max_size, variable_delay)`
- Compile frequently to catch causality errors

### DC Offset Prevention
- Use `fi.dcblocker` after integrators
- Or use leaky integration with gain slightly < 1
- Apply high-pass filter to feedback paths
- Monitor scope to verify zero-centered signals

### Sample Rate Independence
- Multiply time (seconds) by `ma.SR` to get samples
- Use library filters (handle SR normalization automatically)
- Test at 44.1kHz, 48kHz, and 96kHz
- Document SR independence explicitly

### Amplitude Management
- Sum N signals and divide by N
- Plan gain stages across processing chain
- Use soft clipping or limiters to prevent hard clipping
- Keep intermediate levels in 0.1-0.9 range

### Denormal Prevention
- Add tiny noise floor (1e-20) to prevent denormals
- Or gate signals below threshold (1e-6)
- Use library `de.primepower` for built-in protection
- Monitor CPU usage during silence/decay

---

## Quick Reference: Common Code Patterns

### Safe Feedback Loop
```faust
import("stdfaust.lib");

feedback_coef = 0.95;
safe_feedback = + ~ (mem : *(feedback_coef));
process = safe_feedback;
```

### Integrator with DC Blocking
```faust
import("stdfaust.lib");

integrator = + ~ mem;
process = integrator : fi.dcblocker;
```

### Variable Delay
```faust
import("stdfaust.lib");

delay_time = hslider("delay", 0.5, 0, 2, 0.01);
max_delay = 2;
process = de.fdelay(max_delay, delay_time);
```

### SR-Independent Delay
```faust
import("stdfaust.lib");

delay_sec = 0.1;
delay_samples = int(delay_sec * ma.SR);
process = @(delay_samples);
```

### Safe Summing
```faust
import("stdfaust.lib");

sig1 = os.osc(440);
sig2 = os.osc(660);
process = sig1, sig2 :> /(2);  // Divide by number of signals
```

### Soft Clipping
```faust
softclip(x) = tanh(x);
process = input : softclip;
```

### Denormal Prevention
```faust
import("stdfaust.lib");

denormal_safe = + (no.pink_noise * 1e-20);
process = dsp_chain : denormal_safe;
```

---

## Troubleshooting Flowchart

**Problem: Signal grows unbounded**
- Check feedback gain < 1
- Verify `mem` is in feedback path
- Test with conservative coefficients

**Problem: Compilation fails with "causality error"**
- Locate the `~` (feedback) operator
- Ensure `mem` or `@(N)` is in the feedback path
- Check for circular `with` block dependencies

**Problem: Signal drifts or pops with DC offset**
- Add `fi.dcblocker` after integration
- Use leaky feedback (gain = 0.9999)
- Apply high-pass to feedback path

**Problem: Timing/filter frequency wrong at different SR**
- Use `ma.SR` for sample calculations
- Use library filters (handle SR internally)
- Test at multiple sample rates

**Problem: Audio clips distorted**
- Reduce input signal amplitude
- Divide sums by number of signals
- Add soft clipping or limiter
- Check filter resonance peaks

**Problem: CPU spikes during silence/decay**
- Add denormal prevention (tiny noise)
- Or gate very quiet signals to zero
- Check reverb feedback coefficients
- Monitor with CPU meter

---

## Further Reading

- **Faust Documentation**: https://faustdoc.grame.fr
- **Standard Library Filters**: `fi.*` functions in stdfaust.lib
- **Delay Functions**: `de.*` functions for variable delays
- **Oscillators**: `os.*` functions
- **Analysis Tools**: `an.*` for analysis functions

---

**Last Updated:** 2025-12-11
**For Intermediate Users:** Assumes familiarity with Faust syntax and basic DSP concepts
**Target Level:** Moving from "it works" to "it works well"
