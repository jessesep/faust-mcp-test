# Faust Language: Comprehensive Research & Fundamentals

**Task**: faust-research-dsp-concepts-001
**Author**: thinker
**Date**: 2025-12-11
**Version**: 1.0
**Purpose**: Foundational understanding of Faust for Claude and developers

---

## Table of Contents

1. [Introduction & History](#1-introduction--history)
2. [Design Philosophy & Goals](#2-design-philosophy--goals)
3. [Core Language Concepts](#3-core-language-concepts)
4. [Block Diagram Algebra](#4-block-diagram-algebra)
5. [Syntax Fundamentals](#5-syntax-fundamentals)
6. [DSP Concepts in Faust](#6-dsp-concepts-in-faust)
7. [Standard Library Architecture](#7-standard-library-architecture)
8. [Compilation & Targets](#8-compilation--targets)
9. [Practical Examples](#9-practical-examples)
10. [Learning Path](#10-learning-path)

---

## 1. Introduction & History

### 1.1 What is Faust?

**Faust** (Functional AUdio STream) is a domain-specific purely functional programming language for implementing signal processing algorithms in the form of libraries, audio plug-ins, or standalone applications.

**Key Characteristics:**
- **Functional paradigm** - Pure functions, no side effects
- **Block diagram based** - Visual/algebraic approach to DSP
- **High performance** - Compiles to optimized C++, Rust, WASM, etc.
- **Domain-specific** - Designed specifically for real-time audio

**Source**: [Faust Programming Language](https://faust.grame.fr/)

---

### 1.2 History & Development

**Timeline:**
- **2002** - Development began at GRAME-CNCM Research Department (Lyon, France)
- **2004** - First public release
- **2010s** - Expansion to multiple compilation targets (LLVM, WebAssembly)
- **2024** - Fourth International Faust Conference (November 2024)

**Creator**: Yann Orlarey and the GRAME team

**Evolution**: From a research project for functional DSP to a production-ready language used in commercial audio software, academic research, and open-source projects.

**Sources**:
- [FAUST on Wikipedia](https://en.wikipedia.org/wiki/FAUST_(programming_language))
- [FAUST: Efficient Functional Approach to DSP](https://www.researchgate.net/publication/333892308_FAUST_an_Efficient_Functional_Approach_to_DSP_Programming)

---

### 1.3 Why Faust Exists

**Problem**: Traditional DSP development in C/C++ is:
- Low-level and error-prone
- Hard to reason about mathematically
- Difficult to optimize manually
- Platform-specific

**Faust's Solution**:
- **High-level specification** - Describe DSP mathematically
- **Semantically-driven compilation** - Compiler optimizes based on meaning, not literal code
- **Portable** - One source, many targets (C++, Rust, WASM, LLVM, etc.)
- **Verifiable** - Formal semantics enable correctness proofs

**Quote from Faust documentation**:
> "Faust is a specification language that aims at providing an adequate notation to describe signal processors from a mathematical point of view, and is, as much as possible, free from implementation details."

**Source**: [FAUST: Efficient Functional Approach](https://archive2010.grame.fr/ressources/publications/faust-chapter.pdf)

---

## 2. Design Philosophy & Goals

### 2.1 Core Principles

**1. Specification Over Implementation**

Faust code describes *what* the DSP does, not *how* it's implemented.

```faust
// Mathematical specification
process = + : *(0.5);

// Compiler figures out how to implement this efficiently
```

**2. Semantically-Driven Compilation**

Instead of compiling code literally, Faust compiles the **mathematical function it denotes**.

**Example:**
```faust
// These are semantically equivalent - compiler optimizes both the same way
process = _ * 2;
process = _ + _;
```

**3. Simple, Well-Defined Formal Semantics**

Faust's semantics is based on a small, rigorous formal system:
- Signals are discrete functions of time: `Signal = Time → Value`
- Processors are second-order functions: `Processor = Signal → Signal`
- Composition operators are third-order functions

**Similar to**: Haskell's Arrows type class

**Source**: [FAUST: Efficient Functional Approach](https://hal.science/hal-02159014/)

---

### 2.2 Complementary to C/C++

Faust is **not** intended to replace C++ for general programming. Instead:

| Faust | C/C++ |
|-------|-------|
| DSP algorithm specification | Integration, UI, I/O |
| High-level, mathematical | Low-level, imperative |
| Automatic optimization | Manual optimization |
| Portable across targets | Platform-specific |

**Use Case**: Write DSP core in Faust, compile to C++, integrate with existing C++ application.

**Source**: [Faust Design Philosophy](https://archive2010.grame.fr/ressources/publications/faust-chapter.pdf)

---

### 2.3 Performance Goals

**Target**: Match or exceed hand-optimized C++ code.

**How Faust Achieves This:**

1. **Sample-level code generation** - Operates directly on samples, not buffers
2. **Compiler optimization** - Separates computation rates (compile-time, init-time, control-rate, audio-rate)
3. **No runtime dependencies** - Generated code is self-contained
4. **Deterministic behavior** - Constant memory size, predictable performance
5. **Vectorization** - Automatic SIMD optimization with `-vec` flag

**Benchmark Results**: Faust-generated code often **outperforms** manually-written C++ in real-world tests, especially with vectorization enabled.

**Source**: [Optimizing the Code](https://faustdoc.grame.fr/manual/optimizing/)

---

## 3. Core Language Concepts

### 3.1 Functional Programming Paradigm

**What is Functional Programming?**

Functional programming treats computation as evaluation of mathematical functions, avoiding:
- Mutable state
- Side effects
- Imperative control flow

**In Faust:**
```faust
// Pure function - same input always gives same output
gain(factor) = *(factor);

// No variables, no mutation
// Just signal transformations
process = gain(0.5);
```

**Benefits for DSP:**
- **Predictable** - No hidden state
- **Composable** - Functions combine naturally
- **Optimizable** - Compiler can rearrange without breaking semantics
- **Parallelizable** - No dependencies on mutable state

**Source**: [Primer on the FAUST Language](https://ccrma.stanford.edu/~jos/aspf/Primer_FAUST_Language.html)

---

### 3.2 Signals as Functions of Time

**Conceptual Model:**

```
Signal = Time → Value

A signal is a discrete function that maps each time step to a value.
```

**Example - Sine Wave:**
```
sin(t) at 440 Hz with sample rate 48000:
t=0: sin(0) = 0
t=1: sin(2π * 440 / 48000) = 0.0575
t=2: sin(2π * 440 * 2 / 48000) = 0.115
...
```

**In Faust:**
```faust
import("stdfaust.lib");

// os.osc(440) IS the function (Time → Value)
process = os.osc(440);
```

**Key Insight**: You don't write loops or iterate. You define the function, and Faust generates the sample-by-sample code.

**Source**: [FAUST: Efficient Functional Approach](https://www.researchgate.net/publication/333892308_FAUST_an_Efficient_Functional_Approach_to_DSP_Programming)

---

### 3.3 Block Diagrams

**Visual Representation:**

Faust programs can be visualized as block diagrams where:
- **Boxes** = Signal processors (functions)
- **Wires** = Signal connections
- **Composition operators** = How boxes connect

**Example:**

```faust
process = os.osc(440) : fi.lowpass(4, 1000) : *(0.5);
```

**Visualized:**
```
┌─────────┐      ┌──────────┐      ┌──────┐
│ osc(440)│─────>│ lowpass  │─────>│ *(0.5)│─────> output
└─────────┘      └──────────┘      └──────┘
```

**Generate Diagrams:**
```bash
faust -svg mydsp.dsp
```

This creates `mydsp-svg/process.svg` with a visual block diagram.

**Why This Matters**:
- **Intuitive** - Matches how audio engineers think
- **Debuggable** - See signal flow visually
- **Educational** - Easy to understand complex DSP

**Source**: [Generating FAUST Block Diagrams](https://ccrma.stanford.edu/~jos/aspf/Generating_FAUST_Block_Diagrams.html)

---

## 4. Block Diagram Algebra

### 4.1 The Five Composition Operators

Faust's power comes from **five fundamental operators** that connect block diagrams:

| Operator | Name | ASCII Art | Description |
|----------|------|-----------|-------------|
| `:` | Sequential | `A ──> B` | Output of A feeds input of B |
| `,` | Parallel | `A`<br>`B` | A and B process in parallel |
| `~` | Recursive | `A ⟲` | Feedback loop (implicit 1-sample delay) |
| `<:` | Split | `A ╌┬╌> B`<br>`  └╌> C` | Duplicate signal to multiple outputs |
| `:>` | Merge | `A ╌┐`<br>`B ╌┴╌>` | Sum multiple signals to one output |

**Source**: [Faust Syntax Documentation](https://faustdoc.grame.fr/manual/syntax/)

---

### 4.2 Sequential Composition (`:`)

**Syntax:** `A : B`

**Meaning:** Connect output of A to input of B (serial connection).

**Example:**
```faust
import("stdfaust.lib");

// Oscillator → Filter → Gain
process = os.osc(440) : fi.lowpass(4, 1000) : *(0.5);
```

**Diagram:**
```
osc → lowpass → gain → output
```

**Type Signature:**
```
A : B
where A has n outputs and B has n inputs
```

**Source**: [A Faust Tutorial](https://hal.science/hal-02158895/file/faust_tutorial.pdf)

---

### 4.3 Parallel Composition (`,`)

**Syntax:** `A, B`

**Meaning:** Process A and B side-by-side (independent channels).

**Example:**
```faust
import("stdfaust.lib");

// Left channel: sine wave, Right channel: noise
process = os.osc(440), no.noise;
```

**Diagram:**
```
os.osc(440) ──> output L
no.noise    ──> output R
```

**Type Signature:**
```
A, B
A has m outputs, B has n outputs
Result has m + n outputs
```

**Source**: [Faust Syntax Documentation](https://faustdoc.grame.fr/manual/syntax/)

---

### 4.4 Split (`<:`)

**Syntax:** `A <: B, C, ...`

**Meaning:** Duplicate A's outputs and send to multiple destinations.

**Example - Mono to Stereo:**
```faust
// Split mono signal to left and right channels
monoToStereo = _ <: _, _;

process = os.osc(440) : monoToStereo;
```

**Diagram:**
```
         ┌──> output L
osc ──┬──┤
      └──┼──> output R
```

**Use Cases:**
- Mono → Stereo conversion
- Send signal to multiple effects
- Create parallel processing paths

**Source**: [Faust Quick Start](https://faustdoc.grame.fr/manual/quick-start/)

---

### 4.5 Merge (`:>`)

**Syntax:** `A, B :> _`

**Meaning:** Sum multiple signals into one (mix down).

**Example - Stereo to Mono:**
```faust
// Mix left and right channels to mono
stereoToMono = _, _ :> _;

process = os.osc(440), os.osc(880) : stereoToMono;
```

**Diagram:**
```
osc(440) ──┐
           ├──> summed output
osc(880) ──┘
```

**Use Cases:**
- Stereo → Mono conversion
- Mixing multiple signals
- Combining parallel effects

**Source**: [Faust Syntax Documentation](https://faustdoc.grame.fr/manual/syntax/)

---

### 4.6 Recursive (`~`)

**Syntax:** `A ~ B`

**Meaning:** Feedback loop - output of A fed back to its input through B.

**CRITICAL**: Implicit 1-sample delay to prevent zero-delay feedback.

**Example - Simple Delay with Feedback:**
```faust
import("stdfaust.lib");

// Input + (delayed output * feedback)
echo(delayTime, feedback) = (+ : de.delay(48000, delayTime)) ~ *(feedback);

process = _ : echo(10000, 0.5);
```

**Diagram:**
```
input ──┬──> + ──> delay ──┬──> output
        ^                  |
        |                  v
        └──────< *(0.5) <──┘
                (1-sample delay implicit)
```

**Why the implicit delay?**
Digital systems cannot have zero-delay feedback (would create infinite loop). Faust enforces causality by automatically adding 1-sample delay.

**Source**: [Three Ways to Implement Recursive Circuits](https://www.dariosanfilippo.com/posts/2020/11/28/faust_recursive_circuits.html)

---

### 4.7 Combining Operators

**Power of Composition:**

Complex DSP built from simple combinations.

**Example - Stereo Reverb:**
```faust
import("stdfaust.lib");

// Input → split to stereo → reverb each channel → merge
process = _ <: re.mono_freeverb(0.8, 0.5), re.mono_freeverb(0.8, 0.5);
```

**Example - Parallel Effects:**
```faust
import("stdfaust.lib");

// Split signal → (reverb, delay, original) → mix all three
wetDry(dry, wet1, wet2) = _ <: *(dry), re.mono_freeverb(0.5,0.5)*wet1, de.delay(48000, 10000)*wet2 :> _;

process = wetDry(0.5, 0.3, 0.2);
```

**Source**: [FAUST: Block Diagram Composition](https://archive2010.grame.fr/ressources/publications/faust-chapter.pdf)

---

## 5. Syntax Fundamentals

### 5.1 Primitives

**Primitives** are the atomic building blocks - operations on signals.

| Primitive | Name | Inputs | Outputs | Description |
|-----------|------|--------|---------|-------------|
| `_` | Wire | 1 | 1 | Identity - passes signal through unchanged |
| `!` | Cut | 1 | 0 | Terminates signal (dead end) |
| `0` | Zero | 0 | 1 | Constant zero signal |
| `1` | One | 0 | 1 | Constant one signal |
| `+` | Add | 2 | 1 | Sum two signals |
| `-` | Subtract | 2 | 1 | Subtract second from first |
| `*` | Multiply | 2 | 1 | Multiply two signals |
| `/` | Divide | 2 | 1 | Divide first by second |
| `%` | Modulo | 2 | 1 | Remainder |
| `@` | Delay | 2 | 1 | Delay signal by N samples |
| `mem` | Memory | 1 | 1 | 1-sample delay |

**Source**: [Faust Syntax Documentation](https://faustdoc.grame.fr/manual/syntax/)

---

### 5.2 Numbers as Signals

**Key Concept**: In Faust, numbers are **constant signals** (functions of time that always return the same value).

```faust
// 440 is a signal that outputs 440 at every time step
process = 440;

// This is a constant DC offset
process = 0.5;
```

**Mixing Signals and Constants:**
```faust
// Multiply input by constant 0.5 (gain reduction)
process = _ * 0.5;

// Add constant 1.0 to input (DC offset)
process = _ + 1.0;
```

**Source**: [A Simple Faust Program](https://ccrma.stanford.edu/~jos/faust/Simple_Faust_Program.html)

---

### 5.3 Definitions

**Syntax:**
```faust
identifier = expression;
```

**Example:**
```faust
import("stdfaust.lib");

// Define constants
freq = 440;
gain = 0.5;

// Define functions
oscillator(f) = os.osc(f);
amplify(g) = *(g);

// Use definitions
process = oscillator(freq) : amplify(gain);
```

**The `process` Definition:**

Every Faust program must have a `process` definition (entry point, like `main()` in C).

```faust
process = <expression>;
```

**Source**: [Faust 101 Workshop](https://faustdoc.grame.fr/workshops/2020-04-10-faust-101/)

---

### 5.4 Functions

**Syntax:**
```faust
functionName(param1, param2, ...) = expression;
```

**Example:**
```faust
import("stdfaust.lib");

// Function with parameters
bandpassFilter(freq, q) = fi.bandpass(4, freq, q);

// Use function
process = no.noise : bandpassFilter(1000, 5);
```

**Currying (Partial Application):**
```faust
// Partially applied function
lpf1000 = fi.lowpass(4, 1000);

// Use it
process = _ : lpf1000;
```

**Source**: [Primer on FAUST Language](https://ccrma.stanford.edu/~jos/aspf/Primer_FAUST_Language.html)

---

### 5.5 Pattern Matching with `with`

**Syntax:**
```faust
expression
with {
    definition1;
    definition2;
    ...
};
```

**Purpose**: Define local helper functions/constants.

**Example:**
```faust
import("stdfaust.lib");

voice(freq, gate) = osc * env
with {
    osc = os.osc(freq);
    env = en.adsr(0.01, 0.1, 0.7, 0.2, gate);
};

process = voice(440, button("gate"));
```

**Benefits:**
- Encapsulation - helpers are local to function
- Readability - breaks complex expressions into named parts
- Reusability - define once, use multiple times

**Source**: [Faust Syntax Documentation](https://faustdoc.grame.fr/manual/syntax/)

---

### 5.6 UI Elements

**Syntax:**
```faust
hslider("label", init, min, max, step)
vslider("label", init, min, max, step)
button("label")
checkbox("label")
nentry("label", init, min, max, step)
```

**Example:**
```faust
import("stdfaust.lib");

// Horizontal slider: frequency control
freq = hslider("frequency[unit:Hz]", 440, 20, 20000, 1);

// Vertical slider: gain control
gain = vslider("volume[unit:dB]", -6, -60, 0, 0.1);

// Button: trigger
gate = button("trigger");

// Checkbox: bypass
bypass = checkbox("bypass");

process = os.osc(freq) * ma.db2linear(gain) * gate;
```

**Metadata:**
```faust
freq = hslider("freq[unit:Hz][scale:log]", 440, 20, 20000, 1);
//            ^label  ^unit    ^scale  ^init ^min ^max   ^step
```

**Source**: [Faust Syntax Documentation](https://faustdoc.grame.fr/manual/syntax/)

---

## 6. DSP Concepts in Faust

### 6.1 Signals & Sampling

**Continuous vs Discrete:**

- **Continuous signal** (analog): `s(t)` where t is continuous time
- **Discrete signal** (digital): `s[n]` where n is integer sample index

**Sampling Rate:**

Number of samples per second (Hz).

```
Sample Rate = 48000 Hz
→ 48000 samples per second
→ Time between samples = 1/48000 = 20.8 microseconds
```

**In Faust:**
```faust
import("stdfaust.lib");

// Get current sample rate
sampleRate = ma.SR;

// Calculate Nyquist frequency (max representable frequency)
nyquist = sampleRate / 2;
```

**Nyquist Theorem**: To avoid aliasing, you can only represent frequencies up to half the sample rate.

**Source**: [Digital Signal Processing in Faust](https://www.dsprelated.com/freebooks/filters/Digital_Filtering_Faust_PD.html)

---

### 6.2 Delays

**Delay** stores samples and plays them back after a specified time.

**Faust Primitives:**

| Operator | Description |
|----------|-------------|
| `@` | Fixed delay: `sig @ n` delays by n samples |
| `mem` | 1-sample delay (memory) |
| `de.delay(max, n)` | Variable delay up to `max` samples, current delay `n` |

**Example - Fixed Delay:**
```faust
// Delay by 1000 samples
process = _ @ 1000;
```

**Example - Variable Delay:**
```faust
import("stdfaust.lib");

// Delay from 0 to 48000 samples (1 second at 48kHz)
delayTime = hslider("delay[unit:ms]", 500, 0, 1000, 1) : *(48) : int;
process = de.delay(48000, delayTime);
```

**Use Cases:**
- Echo/delay effects
- Flangers, choruses
- Comb filters
- Reverbs

**Source**: [Faust Delays Library](https://faustlibraries.grame.fr/libs/delays/)

---

### 6.3 Filters

**What is a Filter?**

A signal processor that attenuates (reduces) or amplifies certain frequencies.

**Common Filter Types:**

| Type | Description | Faust Function |
|------|-------------|----------------|
| **Lowpass** | Allows low frequencies, blocks high | `fi.lowpass(order, cutoff)` |
| **Highpass** | Allows high frequencies, blocks low | `fi.highpass(order, cutoff)` |
| **Bandpass** | Allows a range, blocks outside | `fi.bandpass(order, freq, Q)` |
| **Bandstop** | Blocks a range, allows outside | `fi.bandstop(order, freq, Q)` |
| **Resonant Lowpass** | Lowpass with resonance peak | `fi.resonlp(cutoff, Q, gain)` |

**Example - Lowpass Filter:**
```faust
import("stdfaust.lib");

// 4th-order lowpass at 1000 Hz
cutoff = 1000;
process = no.noise : fi.lowpass(4, cutoff);
```

**Example - Resonant Filter Sweep:**
```faust
import("stdfaust.lib");

cutoff = hslider("cutoff[unit:Hz]", 1000, 20, 10000, 1);
resonance = hslider("resonance", 1, 0.1, 20, 0.1);

process = no.noise : fi.resonlp(cutoff, resonance, 1);
```

**Source**: [Faust Filters Library](https://faustlibraries.grame.fr/libs/filters/)

---

### 6.4 Envelopes

**What is an Envelope?**

A time-varying control signal that shapes amplitude over time.

**ADSR Envelope:**

- **A**ttack: Time to reach peak from zero
- **D**ecay: Time to fall from peak to sustain level
- **S**ustain: Level held while key is pressed
- **R**elease: Time to fall from sustain to zero after key release

**In Faust:**
```faust
import("stdfaust.lib");

// ADSR parameters (in seconds)
attack = 0.01;   // 10ms
decay = 0.1;     // 100ms
sustain = 0.7;   // 70% of peak
release = 0.2;   // 200ms

// Gate signal (1 = pressed, 0 = released)
gate = button("trigger");

// Apply envelope to oscillator
process = os.osc(440) * en.adsr(attack, decay, sustain, release, gate);
```

**Visualization:**
```
Amplitude
   ^
   |    /\
   |   /  \___________
   |  /               \
   | /                 \___
   |/____________________________> Time
     A  D    S          R
```

**Source**: [Faust Envelopes Library](https://faustlibraries.grame.fr/libs/envelopes/)

---

### 6.5 Oscillators

**What is an Oscillator?**

A signal generator that produces periodic waveforms.

**Common Waveforms:**

| Waveform | Description | Faust Function | Sound |
|----------|-------------|----------------|-------|
| **Sine** | Pure tone (single frequency) | `os.osc(freq)` | Smooth, flute-like |
| **Sawtooth** | Bright, buzzy | `os.sawtooth(freq)` | Brass-like |
| **Square** | Hollow, clarinet-like | `os.square(freq)` | Retro video game |
| **Triangle** | Softer than square | `os.triangle(freq)` | Mellow |
| **Pulse** | Variable duty cycle square | `os.pulsetrain(freq, duty)` | Adjustable brightness |

**Example - Oscillator Bank:**
```faust
import("stdfaust.lib");

freq = hslider("frequency[unit:Hz]", 440, 20, 2000, 1);

sine = os.osc(freq);
saw = os.sawtooth(freq);
square = os.square(freq);

// Mix all three
process = (sine + saw + square) / 3;
```

**Source**: [Faust Oscillators Library](https://faustlibraries.grame.fr/libs/oscillators/)

---

### 6.6 Feedback & Recursion

**Feedback** = output fed back to input

**In Faust:** Use `~` operator

**Example - Resonator (Comb Filter):**
```faust
import("stdfaust.lib");

// Resonator: input + (delayed output * feedback)
resonator(delay_samples, feedback) = (+ : @(delay_samples)) ~ *(feedback);

process = no.noise : resonator(100, 0.9);
```

**Remember**: `~` includes implicit 1-sample delay!

**Complex Example - Karplus-Strong String:**
```faust
import("stdfaust.lib");

// Plucked string synthesis
karplus(freq, damping) = (no.noise * en.ar(0.001, 0.01, gate) : resonator) <: _, _
with {
    gate = button("pluck");
    delayLength = ma.SR / freq;  // Delay determines pitch
    resonator = (+ : de.fdelay(4096, delayLength)) ~ *(damping);
};

process = karplus(220, 0.995);
```

**Source**: [Software Implementation in Faust](https://www.dsprelated.com/freebooks/filters/Software_Implementation_Faust.html)

---

## 7. Standard Library Architecture

### 7.1 Library Organization

**The `stdfaust.lib` Approach:**

All standard libraries accessible from one import via **environment prefixes**.

```faust
import("stdfaust.lib");

// Now all libraries available with prefixes:
os.osc(440);      // os: oscillators.lib
fi.lowpass(4, 1000);  // fi: filters.lib
en.adsr(0.01, 0.1, 0.7, 0.2, gate);  // en: envelopes.lib
```

**Why This Design?**
- **Convenience** - One import gets everything
- **Namespace safety** - Prefixes prevent name collisions
- **Cross-library references** - Libraries can call each other

**Source**: [Faust Libraries](https://faustlibraries.grame.fr/)

---

### 7.2 Standard Library Environments

| Prefix | Library | Description |
|--------|---------|-------------|
| `aa` | aanl.lib | Auxiliary analysis |
| `an` | analyzers.lib | Analysis tools (spectral, amplitude, etc.) |
| `ba` | basics.lib | Basic utilities and helpers |
| `co` | compressors.lib | Dynamics (compressors, limiters) |
| `de` | delays.lib | Delay lines and related |
| `dm` | demos.lib | Demo/example functions |
| `dx` | dx7.lib | DX7 FM synthesis |
| `en` | envelopes.lib | ADSR, AR, ASR envelopes |
| `fi` | filters.lib | FIR, IIR, lowpass, highpass, etc. |
| `ho` | hoa.lib | Higher-order Ambisonics |
| `ma` | maths.lib | Math functions, constants |
| `mi` | mi.lib | Mutable Instruments (MI) modules |
| `no` | noises.lib | White, pink, brown noise |
| `os` | oscillators.lib | Sine, saw, square, etc. |
| `pm` | physmodels.lib | Physical modeling |
| `re` | reverbs.lib | Reverb algorithms |
| `ro` | routes.lib | Signal routing utilities |
| `si` | signals.lib | Signal operations |
| `sp` | spats.lib | Spatialization |

**Source**: [stdfaust.lib on GitHub](https://github.com/grame-cncm/faustlibraries/blob/master/stdfaust.lib)

---

### 7.3 Commonly Used Functions

**Math (`ma:`):**
```faust
ma.SR           // Current sample rate
ma.PI           // Pi constant (3.14159...)
ma.db2linear(db) // dB to linear amplitude
ma.linear2db(x)  // Linear amplitude to dB
```

**Basics (`ba:`):**
```faust
ba.if(cond, then, else)  // Conditional
ba.take(n, (x0, x1, ...)) // Take nth element from tuple
ba.bypass1(bp, fx)        // Bypass effect if bp==1
```

**Signals (`si:`):**
```faust
si.bus(n)       // n parallel wires
si.block(n)     // n parallel cuts (terminators)
si.smoo         // Exponential smoothing (one-pole lowpass)
```

**Source**: [Faust Libraries Reference](https://faustlibraries.grame.fr/)

---

## 8. Compilation & Targets

### 8.1 Compilation Process

**From Faust to Executable:**

```
1. Faust Source (.dsp)
   ↓
2. Faust Compiler (semantic analysis, optimization)
   ↓
3. Target Language (C++, Rust, WASM, etc.)
   ↓
4. Platform Compiler (g++, rustc, emcc, etc.)
   ↓
5. Executable (plugin, standalone, library)
```

**Example:**
```bash
# Faust → C++
faust mydsp.dsp -o mydsp.cpp

# C++ → Executable (using architecture file)
faust -a jack-gtk.cpp mydsp.dsp -o mydsp.cpp
g++ mydsp.cpp -o mydsp `pkg-config --cflags --libs jack gtk+-2.0`

# Or use faust2xxx tools (automates the process)
faust2jack mydsp.dsp
```

**Source**: [Using the Compiler](https://faustdoc.grame.fr/manual/compiler/)

---

### 8.2 Compilation Targets

**Available Backends:**

- **c** - ANSI C
- **cpp** - C++ (most common, default)
- **cmajor** - Cmajor language
- **csharp** - C#
- **dlang** - D language
- **fir** - Faust Imperative Representation (intermediate format)
- **interp** - Interpreter bytecode
- **java** - Java
- **jax** - JAX (Python ML framework)
- **jsfx** - JSFX (Reaper plugin format)
- **julia** - Julia language
- **llvm** - LLVM bitcode
- **ocpp** - Old C++ (legacy)
- **rust** - Rust
- **vhdl** - VHDL (hardware description)
- **wast/wasm** - WebAssembly

**Example:**
```bash
# Compile to Rust
faust -lang rust mydsp.dsp -o mydsp.rs

# Compile to WebAssembly
faust -lang wasm mydsp.dsp -o mydsp.wasm
```

**Source**: [Compiler Options](https://faustdoc.grame.fr/manual/options/)

---

### 8.3 faust2xxx Tools

**Purpose**: Automate compilation to platform-specific targets.

**Common Tools:**

| Tool | Output | Use Case |
|------|--------|----------|
| `faust2jack` | JACK standalone | Linux/Mac audio testing |
| `faust2jaqt` | JACK + Qt GUI | Standalone with nice UI |
| `faust2lv2` | LV2 plugin | Linux plugin hosts |
| `faust2vst` | VST plugin | DAWs (Ableton, Logic, etc.) |
| `faust2supercollider` | SuperCollider UGen | SC integration |
| `faust2puredata` | Pure Data external | Pd integration |
| `faust2max` | Max/MSP external | Max integration |
| `faust2webaudio` | Web Audio | Browser-based DSP |
| `faust2android` | Android app | Mobile audio |
| `faust2ios` | iOS app | iPhone/iPad |

**Example:**
```bash
# Create LV2 plugin
faust2lv2 -vec reverb.dsp

# Create VST with vectorization
faust2vst -vec -vs 64 synth.dsp

# Create Web Audio module
faust2webaudio delay.dsp
```

**Source**: [faust2[...] Tools](https://faustdoc.grame.fr/manual/tools/)

---

## 9. Practical Examples

### 9.1 Simple Gain

```faust
// Apply -6dB gain to input
process = _ * 0.5;
```

---

### 9.2 Sine Wave Oscillator

```faust
import("stdfaust.lib");

// 440 Hz sine wave
process = os.osc(440);
```

---

### 9.3 Filtered Noise

```faust
import("stdfaust.lib");

// White noise through lowpass filter
cutoff = hslider("cutoff[unit:Hz]", 1000, 20, 10000, 1);
process = no.noise : fi.lowpass(4, cutoff);
```

---

### 9.4 Simple Synthesizer Voice

```faust
import("stdfaust.lib");

// Synthesizer with ADSR envelope
freq = hslider("frequency[unit:Hz]", 440, 20, 2000, 1);
gate = button("trigger");

envelope = en.adsr(0.01, 0.1, 0.7, 0.2, gate);
oscillator = os.sawtooth(freq);

process = oscillator * envelope;
```

---

### 9.5 Stereo Delay

```faust
import("stdfaust.lib");

// Stereo delay with feedback
delayTime = hslider("delay[unit:ms]", 500, 0, 2000, 1) : *(ma.SR/1000) : int;
feedback = hslider("feedback", 0.5, 0, 0.95, 0.01);

delayLine(samples, fb) = (+ : de.delay(96000, samples)) ~ *(fb);

// Left and right delays with slightly different times
process = delayLine(delayTime, feedback), delayLine(delayTime + 100, feedback);
```

---

### 9.6 Stereo Reverb

```faust
import("stdfaust.lib");

// Mono to stereo reverb
roomSize = hslider("room_size", 0.5, 0, 1, 0.01);
damping = hslider("damping", 0.5, 0, 1, 0.01);
wetDry = hslider("wet/dry", 0.5, 0, 1, 0.01);

process = _ <: re.stereo_freeverb(roomSize, damping, wetDry, wetDry);
```

---

## 10. Learning Path

### 10.1 Beginner (Week 1-2)

**Goals**: Understand basics, write simple DSP

1. **Install Faust**
   - Download from https://faust.grame.fr/
   - Test with `faust --version`

2. **Learn Composition Operators**
   - Practice `:`, `,`, `<:`, `:>`
   - Generate SVG diagrams to visualize

3. **Use Standard Library**
   - Import `stdfaust.lib`
   - Try `os.osc`, `fi.lowpass`, `no.noise`

4. **Simple Programs**
   - Oscillators
   - Gain control
   - Filters

**Resources**:
- [Faust Quick Start](https://faustdoc.grame.fr/manual/quick-start/)
- [Faust 101 Workshop](https://faustdoc.grame.fr/workshops/2020-04-10-faust-101/)

---

### 10.2 Intermediate (Week 3-4)

**Goals**: Build effects, understand feedback

1. **Delays & Echoes**
   - Use `@` and `de.delay`
   - Create echo effects

2. **Feedback Loops**
   - Master `~` operator
   - Understand implicit 1-sample delay

3. **Filters & Resonance**
   - Experiment with filter types
   - Use `fi.resonlp` for resonance

4. **Envelopes**
   - ADSR for synthesis voices
   - AR for percussion

**Resources**:
- [Romain Michon - Faust Tutorials](https://ccrma.stanford.edu/~rmichon/faustTutorials/)
- [Recursive Circuits in Faust](https://www.dariosanfilippo.com/posts/2020/11/28/faust_recursive_circuits.html)

---

### 10.3 Advanced (Week 5+)

**Goals**: Optimization, complex algorithms

1. **Performance Optimization**
   - Benchmark with `faustbench`
   - Use `-vec` vectorization
   - Optimize computation rates

2. **Physical Modeling**
   - Waveguide synthesis
   - Karplus-Strong
   - Modal synthesis

3. **Advanced Effects**
   - Reverbs (FDN, convolution)
   - Modulation (chorus, flanger, phaser)
   - Dynamics (compressors, limiters)

4. **Library Development**
   - Write reusable functions
   - Organize into libraries
   - Contribute to Faust ecosystem

**Resources**:
- [Audio Signal Processing in Faust (Stanford CCRMA)](https://ccrma.stanford.edu/~jos/aspf/)
- [Faust Libraries Source Code](https://github.com/grame-cncm/faustlibraries)
- [FAUST: Efficient Functional Approach (Research Paper)](https://archive2010.grame.fr/ressources/publications/faust-chapter.pdf)

---

## 11. Key Takeaways for Claude

**When writing Faust code, remember:**

1. **Think Functionally** - No loops, no variables. Define transformations.
2. **Signals are Functions** - Every expression is a function of time.
3. **Composition is Key** - Build complex DSP from simple parts using `:`, `,`, `~`, `<:`, `:>`.
4. **Use the Libraries** - Import `stdfaust.lib` and leverage hundreds of built-in functions.
5. **Feedback Needs `~`** - Always use recursive operator for feedback, remember implicit delay.
6. **Visualize with SVG** - Generate diagrams to understand signal flow.
7. **Optimize Later** - Write correct code first, then benchmark and vectorize.

---

## 12. Sources & Further Reading

### Official Documentation
- [Faust Programming Language](https://faust.grame.fr/)
- [Faust Manual](https://faustdoc.grame.fr/manual/)
- [Faust Libraries Reference](https://faustlibraries.grame.fr/)
- [Faust Syntax Documentation](https://faustdoc.grame.fr/manual/syntax/)
- [Compiler Options](https://faustdoc.grame.fr/manual/options/)

### Academic Papers
- [FAUST: Efficient Functional Approach to DSP Programming](https://archive2010.grame.fr/ressources/publications/faust-chapter.pdf)
- [FAUST on Wikipedia](https://en.wikipedia.org/wiki/FAUST_(programming_language))

### Tutorials
- [Romain Michon - Faust Tutorials](https://ccrma.stanford.edu/~rmichon/faustTutorials/)
- [Stanford CCRMA - Audio Signal Processing in Faust](https://ccrma.stanford.edu/~jos/aspf/)
- [Faust 101 Workshop](https://faustdoc.grame.fr/workshops/2020-04-10-faust-101/)
- [A Faust Tutorial (HAL)](https://hal.science/hal-02158895/file/faust_tutorial.pdf)

### Advanced Topics
- [Three Ways to Implement Recursive Circuits](https://www.dariosanfilippo.com/posts/2020/11/28/faust_recursive_circuits.html)
- [Digital Filtering in Faust](https://www.dsprelated.com/freebooks/filters/Digital_Filtering_Faust_PD.html)

### Community
- [Faust GitHub Repository](https://github.com/grame-cncm/faust)
- [Faust Libraries GitHub](https://github.com/grame-cncm/faustlibraries)

---

**Author**: thinker
**Date**: 2025-12-11
**Version**: 1.0
**Status**: Complete - Foundational Research Document

**Companion Documents**:
- [Faust Best Practices Guide](FAUST-BEST-PRACTICES-GUIDE.md)
- [Compiler Integration Architecture](COMPILER-INTEGRATION-ARCHITECTURE.md)
- [Performance Analysis Architecture](PERFORMANCE-ANALYSIS-ARCHITECTURE.md)
