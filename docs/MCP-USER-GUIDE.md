# Faust MCP User Guide

**Complete guide to using the Faust Model Context Protocol for DSP development with Claude**

**Version**: 1.0 | **Updated**: 2025-12-11

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Basic Workflows](#basic-workflows)
3. [Common Tasks](#common-tasks)
4. [Visual Reference](#visual-reference)
5. [Tutorials](#tutorials)
6. [Troubleshooting](#troubleshooting)
7. [FAQ](#faq)

---

## Getting Started

### What is Faust MCP?

The Faust Model Context Protocol (MCP) enables Claude and other MCP clients to:
- **Write** Faust DSP code with validation
- **Execute** Faust programs and get audio output
- **Debug** compilation errors with detailed explanations
- **Analyze** code structure without full compilation
- **Optimize** performance through profiling

### Prerequisites

Before using Faust MCP, you need:
- ✅ Faust installed (`faust --version`)
- ✅ MCP server running (handles tool invocations)
- ✅ Basic understanding of DSP concepts (helpful but not required)
- ✅ Access to Claude with MCP support

### Quick Setup

1. **Install Faust** (if not already installed):
   ```bash
   brew install faust  # macOS
   sudo apt-get install faust  # Linux
   ```

2. **Verify installation**:
   ```bash
   faust --version
   faust -libdir
   ```

3. **Start using Faust tools** in Claude by asking to work with Faust code

---

## Basic Workflows

### Workflow 1: Validate and Execute Code

```
┌─────────────────────────┐
│  Write Faust Code       │
│  (ask Claude to write)  │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ Validate Syntax         │
│ (faust/validate-syntax) │
└──────────┬──────────────┘
           │
      ┌────┴─────┐
      │           │
  Errors?       No
      │          │
      ▼          ▼
   Fix       Analyze
   Code      Structure
            (faust/analyze-structure)
            │
            ▼
         Compile
      (faust/compile)
            │
      ┌─────┴─────┐
      │           │
  Errors?       No
      │          │
      ▼          ▼
  Debug      Execute
  Error    (faust/execute)
            │
            ▼
         Listen/
         Analyze
         Output
```

### Workflow 2: Develop New Synthesizer

```
1. Ask Claude: "Create a simple sine wave synthesizer"
   → Claude writes basic osc code

2. Validate Syntax
   → MCP checks grammar

3. Analyze Structure
   → Understand inputs/outputs/parameters

4. Execute with test parameters
   → Listen to output

5. Refine (add envelope, add effects, etc.)
   → Return to step 1

6. Profile Performance
   → Check CPU usage

7. Finalize and document
```

### Workflow 3: Debug Compilation Error

```
Error from Compiler
    │
    ▼
Ask Claude: "What does this error mean?"
    │
    ▼
Claude uses faust/debug-error
    │
    ▼
Get diagnosis, root cause, suggested fixes
    │
    ▼
Claude updates code
    │
    ▼
Try faust/compile again
    │
    ▼
Success → Execute
```

---

## Common Tasks

### Task 1: Create a Simple Oscillator

**You say**: "Create a simple sine wave oscillator at 440 Hz"

**Claude uses**:
```
faust/validate-syntax
→ Check it's valid Faust
↓
faust/analyze-structure
→ Understand the I/O: 1 in, 1 out
↓
faust/compile
→ Generate runnable code
↓
faust/execute
→ Generate audio output
```

**Result**: You get audio file with sine wave at 440 Hz

---

### Task 2: Add Frequency Control

**You say**: "Add a slider to control the frequency from 20Hz to 5000Hz"

**Claude uses**:
```
faust/validate-syntax
→ Check syntax of modified code
↓
faust/analyze-structure
→ Identify the new parameter
↓
faust/compile
→ Test with frequency control
↓
faust/execute
→ Test with different frequency values
```

**Result**: Oscillator with frequency control

---

### Task 3: Build Complete Effect

**You say**: "Create a reverb effect with size and damping controls"

**Claude uses**:
```
faust/get-library-docs
→ Find reverb functions
↓
faust/validate-syntax
→ Check grammar
↓
faust/analyze-structure
→ Understand parameters
↓
faust/compile
→ Build the effect
↓
faust/performance-profile
→ Check CPU usage
↓
faust/execute
→ Test with audio
```

**Result**: Working reverb with controls

---

### Task 4: Debug Error Message

**You say**: "I get an error about box dimensions. What does it mean?"

**Claude uses**:
```
faust/debug-error
→ Analyze error message
↓
Return:
- diagnosis: What went wrong
- root_cause: Why it happened
- suggested_fixes: How to fix it
- examples: Before/after code
```

**Result**: Clear explanation and fix suggestion

---

## Visual Reference

### MCP Tool Relationships

```
┌──────────────────────────────────┐
│     MCP Tools Flowchart          │
├──────────────────────────────────┤
│                                  │
│  Source Code                     │
│      │                           │
│      ├─→ validate-syntax ─→ Errors? │
│      │       (2-5ms)       │      │
│      │                     ├─ Yes: Debug
│      │                     │       │
│      └─→ analyze-structure │    debug-error
│              (5-10ms)       │       │
│                             ├─ No: Compile
│                             │       │
│                         compile    │
│                        (1-10s)     │
│                             │      │
│                             ├─ Success: Execute
│                             │       │
│                         execute    │
│                       (5-30s)      │
│                             │      │
│                             └─→ Audio Output
│
└──────────────────────────────────┘
```

### Information Flow

```
Input (Code)
    │
    ▼
Analysis Layer
├─ Tokenization
├─ Parsing
├─ Validation
└─ Structure Analysis
    │
    ▼
Output (Results)
├─ Syntax Errors (if any)
├─ Structure Info
├─ Compilation Status
└─ Audio/Analysis Data
```

---

## Tutorials

### Tutorial 1: Hello, Sine Wave! (10 minutes)

**Goal**: Create and listen to a simple sine wave

**Steps**:

1. **Ask Claude**:
   ```
   "Create a simple Faust DSP program that outputs a 440 Hz sine wave"
   ```

2. **Claude response** will be Faust code like:
   ```faust
   import("stdfaust.lib");
   process = os.osc(440);
   ```

3. **Validate syntax**:
   - Claude uses `faust/validate-syntax`
   - You see: ✓ Syntax valid

4. **Analyze structure**:
   - Claude uses `faust/analyze-structure`
   - You see: 1 input, 1 output

5. **Execute**:
   - Claude uses `faust/execute`
   - You get: `output.wav` with sine wave

6. **Listen**:
   - Play the audio file
   - You hear: Pure sine wave at 440 Hz

**Next step**: Add frequency control (Tutorial 2)

---

### Tutorial 2: Add Frequency Control (15 minutes)

**Goal**: Make frequency adjustable via slider

**Starting point**: Sine wave from Tutorial 1

**Steps**:

1. **Ask Claude**:
   ```
   "Modify the oscillator to have a frequency slider from 20 Hz to 5000 Hz,
    default 440 Hz"
   ```

2. **Claude updates code**:
   ```faust
   import("stdfaust.lib");
   process = os.osc(freq)
     with { freq = hslider("Frequency", 440, 20, 5000, 1); };
   ```

3. **Validate syntax**:
   - Claude uses `faust/validate-syntax`
   - You see: ✓ Valid

4. **Analyze structure**:
   - Claude uses `faust/analyze-structure`
   - You see:
     - Process: 1 input, 1 output
     - Parameters:
       - Frequency (hslider): 20-5000, default 440

5. **Test with different frequencies**:
   ```
   "Execute the code with frequency set to 1000 Hz"
   ```
   - Claude uses `faust/execute` with `parameters: { "Frequency": 1000 }`
   - You get: `output.wav` at 1000 Hz

6. **Listen**:
   - Higher frequency = higher pitch
   - Lower frequency = lower pitch

**Key learning**: How to add UI controls with `hslider`

---

### Tutorial 3: Add Envelope (20 minutes)

**Goal**: Add attack/decay/sustain/release envelope

**Starting point**: Oscillator with frequency control

**Steps**:

1. **Ask Claude**:
   ```
   "Add an ADSR envelope to the oscillator. Include attack, decay, sustain,
    and release controls"
   ```

2. **Claude updates code**:
   ```faust
   import("stdfaust.lib");

   process = os.osc(freq) * env
     with {
       freq = hslider("Frequency", 440, 20, 5000, 1);
       env = ad.adsr(a, d, s, r, gate)
         with {
           a = hslider("Attack", 0.01, 0.001, 1, 0.001);
           d = hslider("Decay", 0.1, 0.001, 1, 0.001);
           s = hslider("Sustain", 0.5, 0, 1, 0.01);
           r = hslider("Release", 0.5, 0.001, 2, 0.001);
           gate = button("Gate");
         };
     };
   ```

3. **Validate and execute**:
   - Claude validates syntax and structure
   - Executes with gate button pressed/released
   - You get: Oscillator with envelope shape

4. **Listen and observe**:
   - Attack: Sound fades in
   - Decay: Sound drops to sustain level
   - Sustain: Holds at constant level while gate is pressed
   - Release: Sound fades out when gate released

**Key learning**: How to use `ad.adsr` for envelope shaping

---

### Tutorial 4: Add Effects (25 minutes)

**Goal**: Add reverb effect to the synthesizer

**Starting point**: Synth with envelope from Tutorial 3

**Steps**:

1. **Ask Claude for library docs**:
   ```
   "Show me the reverb functions available in Faust"
   ```
   - Claude uses `faust/get-library-docs` (search: "reverb")
   - You see: Available reverb options

2. **Ask Claude to add reverb**:
   ```
   "Add a freeverb reverb to the output with size and damping controls"
   ```

3. **Claude updates code**:
   ```faust
   import("stdfaust.lib");

   process = synth : reverb_effect
     with {
       synth = os.osc(freq) * env
         with {
           freq = hslider("Freq", 440, 20, 5000, 1);
           env = ad.adsr(a, d, s, r, gate)
             with {
               a = hslider("Attack", 0.01, 0.001, 1, 0.001);
               d = hslider("Decay", 0.1, 0.001, 1, 0.001);
               s = hslider("Sustain", 0.5, 0, 1, 0.01);
               r = hslider("Release", 0.5, 0.001, 2, 0.001);
               gate = button("Gate");
             };
         };

       reverb_effect = re.mono_freeverb(1, room_size, damping, width, wet_level)
         with {
           room_size = hslider("Reverb Size", 0.5, 0, 1, 0.01);
           damping = hslider("Reverb Damping", 0.5, 0, 1, 0.01);
           width = hslider("Width", 1, 0, 1, 0.01);
           wet_level = hslider("Wet Level", 0.3, 0, 1, 0.01);
         };
     };
   ```

4. **Validate and analyze**:
   - Claude validates syntax
   - Analyzes structure to show all parameters

5. **Profile performance**:
   ```
   "Check the CPU usage and latency"
   ```
   - Claude uses `faust/performance-profile`
   - You see: CPU %, memory usage, latency

6. **Execute and listen**:
   - Adjust reverb size and damping
   - Listen to the reverb tail
   - Adjust wet level

**Key learning**: How to use library functions and chain effects

---

### Tutorial 5: Debug an Error (15 minutes)

**Goal**: Understand and fix an error

**Scenario**: You ask Claude to create code, but it has an error

**Steps**:

1. **Error occurs**:
   ```faust
   process = (os.osc(freq), os.osc(freq*2)) : +;
   ```
   Error: "the number of outputs [2] of (os.osc(freq), os.osc(freq*2))
           must be equal to the number of inputs [1] of +"

2. **Ask Claude**:
   ```
   "What does this error mean and how do I fix it?"
   ```

3. **Claude uses `faust/debug-error`**:
   - **Diagnosis**: "Sequential composition (:) requires matching I/O counts"
   - **Root cause**: "You're trying to feed 2 outputs into an adder that accepts 1 input"
   - **Fix**:
     ```faust
     // Option 1: Merge the signals first
     process = (os.osc(freq), os.osc(freq*2)) :> +;

     // Option 2: Add each separately
     process = (os.osc(freq) : +, os.osc(freq*2));
     ```

4. **Understanding**:
   - `:` (sequential) requires same I/O
   - `:>` (merge) combines multiple outputs into fewer inputs
   - `,` (parallel) keeps everything separate

5. **Test the fix**:
   - Claude validates the corrected code
   - You listen to result

**Key learning**: How to read and understand error messages

---

## Troubleshooting

### Common Issues

#### Issue 1: "undefined symbol: os"

**Error**:
```
Error: undefined symbol: os
```

**Cause**: You're using `os.osc()` but haven't imported the library

**Solution**:
```faust
// Add this at the top:
import("stdfaust.lib");

// Now os.osc() will work
process = os.osc(440);
```

**How Claude helps**:
```
"I get an undefined symbol error for os"
→ Claude: "You need to import stdfaust.lib"
→ Claude adds: import("stdfaust.lib");
```

---

#### Issue 2: "the number of outputs [2] must equal inputs [1]"

**Error**:
```
the number of outputs [2] of (a, b) must be equal to the number of inputs [1] of c
```

**Cause**: Trying to connect 2 outputs to 1 input using `:` (sequential)

**Solution**:
```faust
// Wrong:
process = (a, b) : c;

// Right - use :> to merge:
process = (a, b) :> c;

// Or use , to keep separate:
process = (a, b) , c;
```

**How Claude helps**:
```
"I get a box dimension error"
→ Claude: "This means you're trying to connect signals with mismatched I/O"
→ Claude suggests: Use :> to merge or , to keep separate
```

---

#### Issue 3: "Execution produces silence"

**Cause**: Output gain is 0, parameters not connected, or code has no sound generation

**Solution**:
```faust
// Check for explicit gain reduction:
process = oscillator * 0;  // Removes sound!

// Fix:
process = oscillator * 0.5;  // Reduce to half volume

// Or check library function defaults:
process = os.osc(freq);  // Should produce sound

// Add explicit gain:
process = (os.osc(freq) * gain)
  with { gain = hslider("Gain", 0.5, 0, 1, 0.01); };
```

**How Claude helps**:
```
"The output is silent"
→ Claude: "Let me check the code structure"
→ Claude analyzes and suggests: "Add gain control"
```

---

#### Issue 4: "Code compiles but doesn't sound right"

**Cause**: Logic error, wrong parameters, or unexpected behavior

**Solution**:
1. Simplify: Remove effects, use basic oscillator
2. Check parameters: Are sliders responding?
3. Listen to intermediate stages
4. Use output analysis: Check dB level, peak, RMS

**How Claude helps**:
```
"The sound doesn't match what I expect"
→ Claude: "Let me analyze the structure and parameters"
→ Claude suggests: "Try simplifying by removing effects"
```

---

### Performance Issues

#### Compilation Too Slow

**Problem**: `faust/compile` takes >10 seconds

**Solution**:
1. Simplify the code - remove complex effects
2. Use lower optimization level: `-O 0`
3. Split into smaller components

---

#### Execution Too Slow

**Problem**: `faust/execute` produces CPU overload

**Solution**:
1. Profile with `faust/performance-profile`
2. Reduce reverb size/parameters
3. Lower sample rate or buffer size
4. Optimize algorithms

---

#### Memory Issues

**Problem**: Out of memory during execution

**Solution**:
1. Reduce buffer size
2. Reduce reverb room size
3. Limit execution duration
4. Profile memory usage

---

## FAQ

### Q: Do I need to know Faust to use this?

**A**: No! Claude can teach you as you go. But basic understanding helps:
- Signals are like audio streams
- `:` means sequential (chain)
- `,` means parallel (split)
- Numbers are constants

---

### Q: Can I edit generated code?

**A**: Yes! You can:
1. Modify and ask Claude to validate
2. Ask Claude to explain what each part does
3. Ask Claude for specific modifications

Example:
```
"Change the reverb size from 0.5 to 0.7 as default"
```

---

### Q: How do I save generated audio?

**A**: The audio files are saved as:
```
output.wav              # From faust/execute
execution_1.wav        # First execution
execution_2.wav        # Second execution
etc.
```

You can download or move them to your system.

---

### Q: Can I use Faust MCP for live coding?

**A**: Not directly - there's a compilation delay. But you can:
1. Prepare code with Faust MCP
2. Compile once
3. Use JACK or live environment with compiled version

---

### Q: What sample rates are supported?

**A**: Default is 44100 Hz. You can specify:
- 44100 Hz (CD quality) - default
- 48000 Hz (professional)
- 96000 Hz (high fidelity)
- 192000 Hz (mastering)

Higher rates = more CPU, more file size.

---

### Q: Can I combine multiple effects?

**A**: Yes! Using the `:` (sequential) operator:

```faust
process = input
  : effect1
  : effect2
  : effect3
  : output_limiter;
```

Effects are applied in order (left to right).

---

### Q: How do I add interactivity/UI controls?

**A**: Use UI elements:
```faust
hslider("Label", default, min, max, step)   // Horizontal slider
vslider("Label", default, min, max, step)   // Vertical slider
button("Label")                              // Button
checkbox("Label")                            // Checkbox
```

Example:
```faust
process = os.osc(freq) * gain
  with {
    freq = hslider("Frequency", 440, 20, 5000, 1);
    gain = vslider("Volume", 0.5, 0, 1, 0.01);
  };
```

---

### Q: Is the audio output stereo or mono?

**A**: Default is mono (1 output channel). For stereo:
```faust
process = (os.osc(freq), os.osc(freq*1.05))  // 2 outputs = stereo
  with { freq = hslider("Freq", 440, 20, 5000, 1); };
```

---

### Q: Can I use external audio files?

**A**: The `faust/execute` tool can accept audio input:
```
faust/execute with audio_input: "path/to/audio.wav"
```

Claude can set this up for effects that process input.

---

## Next Steps

- **Start**: Create your first oscillator (Tutorial 1)
- **Learn**: Add frequency control (Tutorial 2)
- **Explore**: Build more complex synthesizers
- **Master**: Chain effects and optimize performance
- **Share**: Use Faust MCP to create professional DSP designs

---

## Resources

- Full MCP Specification: `MCP-SPECIFICATION.md`
- Quick Reference: `MCP-QUICK-REFERENCE.md`
- Configuration Guide: `MCP-CONFIGURATION.md`
- Best Practices: `FAUST-BEST-PRACTICES.md`
- Faust Documentation: https://faust.grame.fr/

---

**Version**: 1.0 | **Updated**: 2025-12-11 | **Maintained by**: bookkeeper
