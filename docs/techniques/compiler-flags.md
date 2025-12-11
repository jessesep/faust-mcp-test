# Compiler Flags for Debugging Faust

**Version:** 1.0
**Date:** 2025-12-11
**Author:** builder

---

## Overview

The Faust compiler provides numerous flags that help with debugging, optimization, and understanding your code. This guide covers the most useful flags for debugging.

---

## Essential Debugging Flags

### `-h` - Help
```bash
faust -h
```
Shows all available compiler options.

### `--version` - Version Info
```bash
faust --version
```
Displays Faust compiler version.

---

## Code Analysis Flags

### `-ps` - Print Signals
```bash
faust -ps file.dsp
```
**What it does:** Prints the signal expression tree.
**Use when:** Understanding how Faust interprets your code.

**Example output:**
```
process = proj0(letrec(W0 = (IN[0]); W1 = (proj0(W0)@1) ...
```

### `-svg` - Generate Block Diagram
```bash
faust -svg file.dsp
```
**What it does:** Generates SVG block diagram in `file-svg/` directory.
**Use when:** Visualizing signal flow and composition.

**View with:**
```bash
open file-svg/process.svg
```

### `-xml` - Generate XML Description
```bash
faust -xml file.dsp > file.xml
```
**What it does:** Exports complete program description as XML.
**Use when:** Automated analysis or documentation generation.

---

## Type Checking and Validation

### `-ct` - Check Types
```bash
faust -ct file.dsp
```
**What it does:** Performs type checking without generating code.
**Use when:** Verifying code before compilation.

### `-cn` - Check Causality
```bash
faust -cn file.dsp
```
**What it does:** Checks for causality violations (zero-delay loops).
**Use when:** Debugging feedback loop issues.

---

## Optimization Control

### `-o0` - No Optimization
```bash
faust -o0 file.dsp
```
**What it does:** Disables optimization.
**Use when:**
- Optimizer causes errors
- Debugging generated code
- Comparing optimized vs unoptimized

### `-O <level>` - Optimization Level
```bash
faust -O 0  # Same as -o0
faust -O 1  # Light optimization
faust -O 2  # Medium (default)
faust -O 3  # Aggressive
```
**Use when:** Balancing compilation speed vs runtime performance.

### `-fm <file>` - Metadata
```bash
faust -fm metadata.json file.dsp
```
**What it does:** Includes metadata in generated code.
**Use when:** Embedding documentation or version info.

---

## Code Generation Options

### `-a <arch>` - Architecture File
```bash
faust -a jack-gtk.cpp file.dsp -o file.cpp
```
**What it does:** Uses specified architecture wrapper.
**Common architectures:**
- `jack-gtk.cpp` - JACK audio with GTK GUI
- `jack-qt.cpp` - JACK with Qt GUI
- `ca-qt.cpp` - CoreAudio with Qt (macOS)

### `-lang <target>` - Target Language
```bash
faust -lang cpp file.dsp     # C++ (default)
faust -lang c file.dsp       # C
faust -lang rust file.dsp    # Rust
faust -lang wasm file.dsp    # WebAssembly
```

### `-single` - Single Precision
```bash
faust -single file.dsp
```
**What it does:** Uses `float` instead of `double`.
**Use when:** Targeting mobile or embedded platforms.

### `-double` - Double Precision
```bash
faust -double file.dsp
```
**What it does:** Uses `double` for all calculations (default).

---

## Memory and Performance

### `-vec` - Enable Vectorization
```bash
faust -vec file.dsp
```
**What it does:** Generates vectorized code (SIMD).
**Use when:** Optimizing for performance.

### `-vs <size>` - Vector Size
```bash
faust -vec -vs 128 file.dsp
```
**What it does:** Sets vector size for SIMD.

### `-lv <level>` - Loop Vectorization Level
```bash
faust -vec -lv 1 file.dsp
```
**What it does:** Controls vectorization strategy (0-3).

---

## Debugging Specific Issues

### Finding Causality Violations
```bash
# Check for zero-delay feedback
faust -cn file.dsp

# If error, generate diagram to visualize
faust -svg file.dsp
open file-svg/process.svg
```

### Understanding Type Errors
```bash
# Print signal types
faust -ps file.dsp | less

# Check types explicitly
faust -ct file.dsp
```

### Checking Optimization Issues
```bash
# Compile without optimization
faust -o0 file.dsp -o debug.cpp

# Compile with optimization
faust -O 3 file.dsp -o optimized.cpp

# Compare behavior
```

### Memory Usage Problems
```bash
# Check diagram for large delay lines
faust -svg file.dsp
open file-svg/process.svg

# Compile with memory profiling
faust -mem file.dsp
```

---

## Common Debugging Workflows

### Workflow 1: "It Won't Compile"
```bash
# Step 1: Check types
faust -ct file.dsp

# Step 2: Check causality
faust -cn file.dsp

# Step 3: Try without optimization
faust -o0 file.dsp -o test.cpp

# Step 4: Generate diagram
faust -svg file.dsp
```

### Workflow 2: "It Sounds Wrong"
```bash
# Step 1: Visual inspection
faust -svg file.dsp
open file-svg/process.svg

# Step 2: Check signal flow
faust -ps file.dsp > signals.txt
less signals.txt

# Step 3: Test unoptimized
faust -o0 file.dsp
```

### Workflow 3: "It's Too Slow"
```bash
# Step 1: Profile baseline
faust file.dsp
# ... measure performance ...

# Step 2: Try vectorization
faust -vec -vs 64 file.dsp
# ... measure performance ...

# Step 3: Aggressive optimization
faust -O 3 -vec file.dsp
# ... measure performance ...
```

---

## Platform-Specific Flags

### macOS
```bash
# CoreAudio backend
faust -a ca-qt.cpp file.dsp -o file.cpp
```

### Linux
```bash
# ALSA backend
faust -a alsa-gtk.cpp file.dsp -o file.cpp

# JACK backend
faust -a jack-gtk.cpp file.dsp -o file.cpp
```

### Windows
```bash
# ASIO backend
faust -a asio.cpp file.dsp -o file.cpp
```

### Web/WASM
```bash
# WebAssembly target
faust -lang wasm file.dsp
faust2wasm file.dsp
```

---

## Advanced Flags

### `-I <dir>` - Include Directory
```bash
faust -I /path/to/libraries file.dsp
```
**Use when:** Custom library locations.

### `-L <dir>` - Library Directory
```bash
faust -L /path/to/libs file.dsp
```

### `-D <name>=<value>` - Define Constant
```bash
faust -D SAMPLE_RATE=48000 file.dsp
```
**Use when:** Compile-time configuration.

### `-inpl` - In-Place Processing
```bash
faust -inpl file.dsp
```
**What it does:** Optimizes for in-place audio processing.

---

## Quick Reference Table

| Flag | Purpose | When to Use |
|------|---------|-------------|
| `-svg` | Block diagram | Visualize structure |
| `-ps` | Print signals | Understand compilation |
| `-ct` | Type check | Verify types |
| `-cn` | Check causality | Debug feedback |
| `-o0` | No optimization | Debug optimizer issues |
| `-O 3` | Max optimization | Production builds |
| `-vec` | Vectorization | Performance critical |
| `-single` | Float precision | Mobile/embedded |
| `-double` | Double precision | Audio quality |

---

## Tips

1. **Start simple:** Use `-ct` and `-cn` first
2. **Visualize always:** `-svg` shows what's really happening
3. **Debug unoptimized:** Use `-o0` when hunting bugs
4. **Optimize later:** Use `-O 3 -vec` only when code works
5. **Platform matters:** Use appropriate architecture for your system

---

## Combining Flags

```bash
# Debug build: no optimization, check everything
faust -o0 -ct -cn -svg file.dsp

# Production build: max optimization, vectorization
faust -O 3 -vec -vs 128 file.dsp

# Analysis: generate all documentation
faust -svg -xml -ps file.dsp
```

---

## Conclusion

Compiler flags are your debugging allies. Learn these patterns:

- **Problem?** → `-ct -cn -svg`
- **Slow?** → `-O 3 -vec`
- **Platform build?** → `-a <arch>`
- **Confused?** → `-ps -svg`

Master the flags, master the compilation.
