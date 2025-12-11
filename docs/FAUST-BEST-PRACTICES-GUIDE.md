# Faust DSP Best Practices & Design Patterns Guide

**Task**: faust-best-practices-guide-001
**Author**: thinker
**Date**: 2025-12-11
**Version**: 1.0
**Purpose**: Enable Claude (and developers) to write idiomatic, efficient, maintainable Faust code

---

## Table of Contents

1. [Code Organization](#1-code-organization)
2. [Performance Optimization](#2-performance-optimization)
3. [Common Design Patterns](#3-common-design-patterns)
4. [Anti-Patterns to Avoid](#4-anti-patterns-to-avoid)
5. [Library Usage](#5-library-usage)
6. [Debugging & Troubleshooting](#6-debugging--troubleshooting)
7. [Quick Reference](#7-quick-reference)

---

## 1. Code Organization

### 1.1 Computation Rate Organization

**Best Practice**: Distribute computations across the four rate domains to optimize efficiency.

Faust's type system separates computations into four categories:

| Rate Domain | Purpose | Examples | Optimization Goal |
|-------------|---------|----------|-------------------|
| **Compilation/Specialization Time** | Constants, table generation | Sample tables, lookup tables | Pre-compute everything possible |
| **Init Time** | Sample rate-dependent setup | Filter coefficient calculation, table filling | One-time setup |
| **Control Rate** | UI/parameter updates | Reading sliders, buttons | Minimize audio-rate work |
| **Audio Rate** | Per-sample processing | Signal processing loops | Keep minimal, highly optimized |

**Example - Good Organization:**

```faust
import("stdfaust.lib");

// Compilation-time constant
tablesize = 1024;

// Init-time computation
sampleRateDependent = ma.SR;

// Control-rate parameter
freq = hslider("frequency", 440, 20, 20000, 0.1);

// Audio-rate processing (minimal work)
process = os.osc(freq);
```

**Why**: Prefer slower-rate domains when possible. Moving computation from audio-rate to control-rate or init-time yields significant performance gains.

**Source**: [FAUST: an Efficient Functional Approach to DSP Programming](https://archive2010.grame.fr/ressources/publications/faust-chapter.pdf)

---

### 1.2 Program Structure

**Best Practice**: Organize code with clear definitions and a `process` entry point.

```faust
import("stdfaust.lib");

// === Constants ===
sampleRate = ma.SR;
nyquist = sampleRate / 2;

// === Parameters ===
cutoff = hslider("cutoff", 1000, 20, nyquist, 1);
resonance = hslider("Q", 1, 0.5, 10, 0.1);

// === Helper Functions ===
normalize(sig) = sig / max(0.001, sig);

// === Main DSP ===
myFilter = fi.resonlp(cutoff, resonance, 1);

// === Process (entry point) ===
process = _ : myFilter : normalize;
```

**Structure**:
1. **Imports** - Always at top
2. **Constants** - Compilation-time values
3. **Parameters** - UI controls
4. **Helper Functions** - Reusable components
5. **Main DSP** - Core processing logic
6. **Process** - Entry point (equivalent to `main()` in C)

**Why**: Modular structure improves readability and aligns with functional programming best practices.

**Source**: [Faust Syntax Documentation](https://faustdoc.grame.fr/manual/syntax/)

---

### 1.3 File Organization for Large Projects

**Best Practice**: Split code into modular files, use imports.

```
project/
├── main.dsp              # Entry point with process
├── filters/
│   ├── lowpass.dsp
│   └── highpass.dsp
├── effects/
│   ├── reverb.dsp
│   └── delay.dsp
└── utilities/
    └── normalize.dsp
```

**main.dsp:**
```faust
import("stdfaust.lib");
import("filters/lowpass.dsp");
import("effects/reverb.dsp");

process = lowpass : reverb;
```

**Why**: Modular files promote reusability and maintainability. Follows the Faust project's own organizational structure.

**Source**: [Faust GitHub Repository Structure](https://github.com/grame-cncm/faust)

---

## 2. Performance Optimization

### 2.1 Vectorization

**Best Practice**: Enable vectorization for significant performance gains.

```bash
# Compile with vectorization
faust -vec -vs 32 mydsp.dsp
```

**Options**:
- `-vec` - Enable vectorized mode
- `-vs <n>` - Vector size (typically 32, 64, 128)
- `-fun` - Separate tasks as functions (with -vec)
- `-dfs` - Deep-first order scheduling

**Performance Impact**:
- **Mac**: ~3x speedup with vectorization
- **XPS**: ~2.5x speedup with vectorization

**Source**: [Optimizing the Code - Faust Documentation](https://faustdoc.grame.fr/manual/optimizing/)

**When to Use**:
- ✅ Complex DSP with multiple parallel signals
- ✅ Production/deployment builds
- ❌ Simple prototypes (scalar mode is fine)

---

### 2.2 Compiler Optimization Flags

**Best Practice**: Use benchmarking tools to find optimal flags for your DSP.

```bash
# Benchmark to find best options
faustbench mydsp.dsp

# Then use discovered optimal flags
faust -vec -fun -vs 32 -dfs -mcd 32 mydsp.dsp
```

**Key Flags**:

| Flag | Effect | Trade-off |
|------|--------|-----------|
| `-vec` | Vectorize loops | More complex code, big speedup |
| `-omp` | OpenMP parallelization | Multi-core, requires OpenMP |
| `-mcd <n>` | Mask/delay compilation mode | Memory vs performance |
| `-fun` | Separate functions | Better for inlining |
| `-dfs` | Deep-first scheduling | Better cache locality |

**Why**: Different DSP algorithms benefit from different optimization strategies. Benchmarking reveals the best combination.

**Source**: [Optimizing the Code - Faust Documentation](https://faustdoc.grame.fr/manual/optimizing/)

---

### 2.3 Memory Optimization

**Best Practice**: Be mindful of delay line memory usage.

**Good - Efficient delay:**
```faust
// Small, fixed delay
shortDelay = _ @ 1000;  // 1000 samples
```

**Bad - Wasteful delay:**
```faust
// Huge delay consumes memory
unnecessaryDelay = _ @ 192000;  // 4 seconds at 48kHz
```

**Consideration**: Choosing large `-mcd <n>` values consumes less memory but makes shift loops time-consuming with large delays. Balance memory and CPU based on your use case.

**Source**: [Optimizing the Code - Faust Documentation](https://faustdoc.grame.fr/manual/optimizing/)

---

## 3. Common Design Patterns

### 3.1 Feedback Loops (Recursive Composition)

**Pattern**: Use the `~` operator for feedback, but understand implicit delays.

**Syntax:**
```faust
// Basic feedback: output fed back to input
process = (+ : delay(1000)) ~ *(0.5);
```

**Critical Concept**: **Implicit One-Sample Delay**

Every feedback loop using `~` automatically includes a one-sample delay. This is essential for digital systems (prevents zero-delay feedback).

**Example - Echo with Feedback:**
```faust
import("stdfaust.lib");

echo(delayTime, feedback) = (+ : de.delay(48000, delayTime)) ~ *(feedback);

process = _ : echo(10000, 0.5);
```

**Common Mistake:**
```faust
// WRONG - Forgetting implicit delay
// If you need exactly 1000 samples delay, you get 1001 (1000 + implicit 1)
process = (+ : de.delay(48000, 1000)) ~ _;
```

**Correct:**
```faust
// RIGHT - Account for implicit delay
process = (+ : de.delay(48000, 999)) ~ _;  // 999 + 1 implicit = 1000 total
```

**Why**: Faust's `~` operator enforces causality by adding automatic delay. Always account for this "free pipeline delay."

**Sources**:
- [Three ways to implement recursive circuits in Faust](https://www.dariosanfilippo.com/posts/2020/11/28/faust_recursive_circuits.html)
- [Software Implementation in Faust](https://www.dsprelated.com/freebooks/filters/Software_Implementation_Faust.html)

---

### 3.2 Parallel Processing

**Pattern**: Use `,` for parallel signal routing.

```faust
// Process left and right channels independently
stereoReverb = reverb, reverb;

// Split mono to stereo
monoToStereo = _ <: _, _;

process = monoToStereo : stereoReverb;
```

**Composition Operators:**

| Operator | Name | Description | Example |
|----------|------|-------------|---------|
| `:` | Sequential | Connect output to input | `f : g` |
| `,` | Parallel | Process signals side-by-side | `f, g` |
| `<:` | Split | Duplicate signal | `_ <: _, _` (mono→stereo) |
| `:>` | Merge | Sum signals | `_, _ :> _` (stereo→mono) |
| `~` | Recursive | Feedback loop | `(+) ~ *(0.5)` |

**Example - Stereo Width Control:**
```faust
import("stdfaust.lib");

width = hslider("width", 1, 0, 2, 0.01);

// Mid-side processing
stereoWidth(w) = _ <: mid, side
with {
    mid = + : *(0.5);
    side = - : *(0.5 * w);
};

process = stereoWidth(width);
```

**Source**: [Faust Syntax Documentation](https://faustdoc.grame.fr/manual/syntax/)

---

### 3.3 Modular Component Design

**Pattern**: Build reusable components with clear interfaces.

```faust
import("stdfaust.lib");

// Reusable envelope generator
adsr(attack, decay, sustain, release, gate) =
    en.adsr(attack, decay, sustain, release, gate);

// Reusable oscillator
myOsc(freq) = os.osc(freq);

// Combine into voice
voice(freq, gate) = myOsc(freq) * adsr(0.01, 0.1, 0.7, 0.2, gate);

// UI parameters
frequency = hslider("freq", 440, 20, 2000, 1);
trigger = button("gate");

process = voice(frequency, trigger);
```

**Why**: Modular design complies with sound engineers' habits and promotes reusability across projects.

**Source**: [FAUST: Efficient Functional Approach](https://archive2010.grame.fr/ressources/publications/faust-chapter.pdf)

---

## 4. Anti-Patterns to Avoid

### 4.1 Library Import Mistakes

**Anti-Pattern**: Importing individual libraries instead of using `stdfaust.lib`.

```faust
// ❌ BAD - Manual imports prone to errors
import("oscillators.lib");
import("filters.lib");
import("envelopes.lib");

process = osc(440);  // ERROR - function not in scope
```

**Best Practice**: Use `stdfaust.lib` with environment prefixes.

```faust
// ✅ GOOD - Standard approach
import("stdfaust.lib");

process = os.osc(440);  // os: oscillators.lib
```

**Environment Prefixes:**
- `os:` oscillators.lib
- `fi:` filters.lib
- `en:` envelopes.lib
- `no:` noises.lib
- `ma:` maths.lib
- `si:` signals.lib
- `de:` delays.lib
- `re:` reverbs.lib

**Common Error**: `ERROR: unable to open file stdfaust.lib`

**Cause**: Library path not configured. Use `-I` flag to specify library directory.

```bash
faust -I /usr/local/share/faust mydsp.dsp
```

**Sources**:
- [Faust Libraries Documentation](https://faustlibraries.grame.fr/)
- [Forum: unable to open stdfaust.lib](https://forum.hise.audio/topic/6619/unable-to-open-file-stdfaust-lib)

---

### 4.2 Forgetting Semicolons

**Anti-Pattern**: Missing semicolons at end of definitions.

```faust
// ❌ BAD - Missing semicolons causes parse error
import("stdfaust.lib")
freq = 440
process = os.osc(freq)
```

**Best Practice**: Always end definitions with semicolons.

```faust
// ✅ GOOD
import("stdfaust.lib");
freq = 440;
process = os.osc(freq);
```

**Source**: [Faust 101 Workshop](https://faustdoc.grame.fr/workshops/2020-04-10-faust-101/)

---

### 4.3 Signal Count Mismatches (Stereo/Mono)

**Anti-Pattern**: Connecting components with incompatible signal counts.

```faust
// ❌ BAD - Stereo reverb expects 2 inputs, gets 1
monoSignal = os.osc(440);
process = monoSignal : re.stereo_freeverb;  // ERROR
```

**Best Practice**: Match signal counts explicitly.

```faust
// ✅ GOOD - Split mono to stereo before reverb
monoSignal = os.osc(440);
toStereo = _ <: _, _;
process = monoSignal : toStereo : re.stereo_freeverb;
```

**Source**: [Faust Rebel Technology Forum](https://community.rebeltech.org/t/faust-problems/476)

---

### 4.4 Ignoring Chain-Induced Delays

**Anti-Pattern**: Not accounting for delays in physical modeling chains.

```faust
// ❌ BAD - Each waveguide block adds implicit delay
// Total delay is NOT what you expect
chain = block1 : block2 : block3;
```

**Best Practice**: Understand that each block in a waveguide chain induces one-sample delay in both directions (due to implicit `~` in left-going waves).

**Why**: Physical modeling often uses bidirectional signal flow. Each block's feedback creates delay.

**Source**: [Software Implementation in Faust](https://www.dsprelated.com/freebooks/filters/Software_Implementation_Faust.html)

---

### 4.5 Inefficient Computation Placement

**Anti-Pattern**: Computing expensive operations at audio rate unnecessarily.

```faust
// ❌ BAD - Recomputing constant every sample
process = os.osc(440 * sin(2 * ma.PI));  // sin() computed every sample!
```

**Best Practice**: Pre-compute or move to control rate.

```faust
// ✅ GOOD - Compute once
freqModulation = 440 * sin(2 * ma.PI);  // Computed at compile or init time
process = os.osc(freqModulation);
```

**Source**: [Faust Optimizing Documentation](https://faustdoc.grame.fr/manual/optimizing/)

---

## 5. Library Usage

### 5.1 Standard Library Overview

**Always import `stdfaust.lib`:**

```faust
import("stdfaust.lib");
```

This gives access to all standard libraries through environment prefixes.

### 5.2 Common Library Functions

| Category | Prefix | Examples |
|----------|--------|----------|
| **Oscillators** | `os:` | `os.osc(freq)`, `os.sawtooth(freq)`, `os.square(freq)` |
| **Filters** | `fi:` | `fi.lowpass(order, cutoff)`, `fi.resonlp(cutoff, Q, gain)` |
| **Envelopes** | `en:` | `en.adsr(a, d, s, r, gate)`, `en.ar(a, r, gate)` |
| **Delays** | `de:` | `de.delay(maxDelay, delay)`, `de.fdelay(maxDelay, delay)` |
| **Reverbs** | `re:` | `re.mono_freeverb(...)`, `re.stereo_freeverb(...)` |
| **Math** | `ma:` | `ma.SR` (sample rate), `ma.PI`, `ma.db2linear(db)` |
| **Noises** | `no:` | `no.noise`, `no.pink_noise` |

### 5.3 Example - Using Libraries Effectively

```faust
import("stdfaust.lib");

// Parameters
cutoff = hslider("cutoff", 1000, 20, 10000, 1);
resonance = hslider("resonance", 1, 0.1, 10, 0.1);
reverbSize = hslider("room_size", 0.5, 0, 1, 0.01);
reverbDamp = hslider("damping", 0.5, 0, 1, 0.01);

// DSP chain using standard libraries
process =
    // Input
    no.noise
    // Resonant lowpass filter
    : fi.resonlp(cutoff, resonance, 1)
    // Normalize
    : *(0.3)
    // Split to stereo
    : _ <: _, _
    // Stereo reverb
    : re.stereo_freeverb(reverbSize, reverbDamp, 0.5, 0.5);
```

**Source**: [Faust Libraries Reference](https://faustlibraries.grame.fr/)

---

## 6. Debugging & Troubleshooting

### 6.1 Generate Block Diagrams

**Best Practice**: Use `-svg` flag to visualize signal flow.

```bash
faust -svg mydsp.dsp
```

This generates `mydsp-svg/process.svg` showing the block diagram.

**Why**: Visual representation helps debug signal routing issues and understand complex processing chains.

**Options:**
- `-sd` - Simplify diagrams
- `-sc` - Scalable SVG
- `-f <n>` - Folding threshold (default 25)

**Source**: [Generating Faust Block Diagrams](https://ccrma.stanford.edu/~jos/aspf/Generating_FAUST_Block_Diagrams.html)

---

### 6.2 Common Error Messages & Fixes

| Error | Cause | Solution |
|-------|-------|----------|
| `unable to open file stdfaust.lib` | Library path not set | Use `-I` flag or set FAUST_LIB_PATH |
| `undefined symbol 'osc'` | Missing library prefix | Use `os.osc` instead of `osc` |
| `type mismatch` | Signal count mismatch | Check inputs/outputs match (use `<:` or `:>`) |
| `syntax error` | Missing semicolon | Add `;` at end of definitions |
| `file not found: 'mylib.lib'` | Import path issue | Use `-I` to add import directory |

---

### 6.3 Testing Strategy

**Best Practice**: Test with simple signals first.

```faust
// Test 1: Pass-through (should output input unchanged)
process = _;

// Test 2: Constant signal
process = 0.5;

// Test 3: Simple oscillator
import("stdfaust.lib");
process = os.osc(440);

// Test 4: Your complex DSP
import("stdfaust.lib");
process = myComplexFilter : myReverb;
```

**Why**: Incremental testing isolates issues. If pass-through fails, problem is in compilation setup, not your DSP logic.

---

## 7. Quick Reference

### 7.1 Essential Compilation Commands

```bash
# Basic compilation to C++
faust mydsp.dsp -o mydsp.cpp

# With vectorization
faust -vec -vs 32 mydsp.dsp -o mydsp.cpp

# Generate block diagram
faust -svg mydsp.dsp

# Specify library path
faust -I /path/to/libraries mydsp.dsp

# Benchmarking
faustbench mydsp.dsp

# Optimal compilation (after benchmarking)
faust -vec -fun -vs 64 -dfs -mcd 32 mydsp.dsp -o mydsp.cpp
```

---

### 7.2 Composition Operators Cheat Sheet

```faust
// Sequential: f then g
f : g

// Parallel: f and g side-by-side
f, g

// Split: duplicate signal
<:

// Merge: sum signals
:>

// Recursive: feedback
~

// Examples:
_ <: _, _        // Mono to stereo (split)
_, _ :> _        // Stereo to mono (merge)
f : g : h        // Chain: f then g then h
f, g, h          // Parallel: 3 separate processes
(+ : delay) ~ *  // Feedback loop
```

---

### 7.3 Standard Library Prefixes

```faust
import("stdfaust.lib");

os:   // Oscillators
fi:   // Filters
en:   // Envelopes
de:   // Delays
re:   // Reverbs
ma:   // Math
no:   // Noises
si:   // Signals
an:   // Analyzers
ba:   // Basics
dm:   // Demos
dx:   // DX7
ef:   // Effects
ho:   // Higher-Order functions
pm:   // Physical Models
sp:   // Spats (spatial)
```

---

### 7.4 Performance Optimization Checklist

**Before Release:**
- [ ] Benchmarked with `faustbench`
- [ ] Enabled `-vec` vectorization
- [ ] Tuned vector size (`-vs 32/64/128`)
- [ ] Considered `-omp` for multi-core
- [ ] Verified no unnecessary audio-rate computation
- [ ] Minimized delay memory usage
- [ ] Tested on target platform

---

## 8. Further Reading

### Official Documentation
- [Faust Manual](https://faustdoc.grame.fr/manual/)
- [Faust Libraries Reference](https://faustlibraries.grame.fr/)
- [Compiler Options](https://faustdoc.grame.fr/manual/options/)
- [Optimizing the Code](https://faustdoc.grame.fr/manual/optimizing/)

### Tutorials
- [Romain Michon - Faust Tutorials](https://ccrma.stanford.edu/~rmichon/faustTutorials/)
- [Stanford CCRMA - Audio Signal Processing in Faust](https://ccrma.stanford.edu/~jos/aspf/)
- [Faust 101 Workshop](https://faustdoc.grame.fr/workshops/2020-04-10-faust-101/)

### Advanced Topics
- [Three Ways to Implement Recursive Circuits](https://www.dariosanfilippo.com/posts/2020/11/28/faust_recursive_circuits.html)
- [FAUST: Efficient Functional Approach (Research Paper)](https://archive2010.grame.fr/ressources/publications/faust-chapter.pdf)

---

**Author**: thinker
**Date**: 2025-12-11
**Version**: 1.0
**Status**: Complete - Ready for Review

**Next Steps**:
- Coordinate with ui-pro on `faust-code-examples-library-001` to add practical examples
- Align with `faust-research-dsp-concepts-001` when completed
- Consider creating interactive tutorial based on this guide
