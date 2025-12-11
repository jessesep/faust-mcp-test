# Faust Performance Analysis & Profiling Tools Architecture

**Task**: faust-performance-analysis-tools-001
**Author**: thinker
**Date**: 2025-12-11
**Version**: 1.0
**Purpose**: Enable Claude to analyze and optimize Faust DSP code performance

---

## Executive Summary

This document defines the architecture for performance analysis and profiling tools that integrate Faust's benchmarking ecosystem with the Model Context Protocol (MCP). These tools enable Claude to measure DSP performance, identify bottlenecks, and recommend optimizations.

**Core Capability**: Wrap `faustbench` tools to provide structured performance metrics accessible via MCP.

---

## 1. Faust Benchmarking Ecosystem

### 1.1 Available Tools

| Tool | Backend | Purpose | Use Case |
|------|---------|---------|----------|
| **faustbench** | C++ | Test multiple compiler options in single binary | Find optimal C++ compilation flags |
| **faustbench-llvm** | LLVM | Dynamic compilation & testing with LLVM | JIT compilation optimization |
| **faustbench-wasm** | WebAssembly | Test in Node.js with Binaryen optimization | WebAudio/browser deployment |

**Source**: [Faust Benchmark Tools](https://github.com/grame-cncm/faust/tree/master-dev/tools/benchmark)

---

### 1.2 Performance Metrics

Faust benchmark tools provide these key metrics:

| Metric | Unit | Interpretation |
|--------|------|----------------|
| **Throughput** | MBytes/sec | Higher is better - mean of 10 best values |
| **DSP CPU %** | Percentage | CPU usage at 44.1 kHz (lower is better) |
| **Memory Size** | Bytes | DSP struct memory footprint |

**Throughput Calculation**:
- Measured over a test period
- Takes into account number of channels processed
- Mean of 10 best measurements (reduces noise)

**DSP CPU % Calculation**:
- Effective duration of measurement
- Percentage of available bandwidth at 44.1 kHz
- Example: 25% means DSP uses 1/4 of available CPU time

**Sources**:
- [Faust Benchmark README](https://github.com/grame-cncm/faust/blob/master-dev/tools/benchmark/README.md)
- [Optimizing the Code](https://faustdoc.grame.fr/manual/optimizing/)

---

### 1.3 Optimization Workflow

**Standard Process**:

```
1. Write DSP code
   ↓
2. Run faustbench with multiple compiler options
   ↓
3. Analyze results → find best options
   ↓
4. Use optimal options in faust2xxx tool
   ↓
5. Deploy optimized binary
```

**Example**:
```bash
# Step 1: Benchmark to find best options
faustbench mydsp.dsp

# Output shows "-vec -fun -vs 64" is fastest

# Step 2: Use discovered options in production
faust2jack -vec -fun -vs 64 mydsp.dsp
```

**Source**: [Optimizing the Code](https://faustdoc.grame.fr/manual/optimizing/)

---

## 2. MCP Performance Analysis Tools

### 2.1 Tool: analyze_faust_performance

**Purpose**: Benchmark Faust DSP code and return structured performance metrics.

```typescript
{
  name: "analyze_faust_performance",
  description: "Benchmark Faust DSP code with multiple compiler options and return performance metrics",

  parameters: {
    source: {
      type: "string",
      description: "Faust DSP code or file path to .dsp file"
    },
    backend: {
      type: "enum",
      values: ["cpp", "llvm", "wasm"],
      default: "llvm",
      description: "Benchmark backend (llvm recommended for speed)"
    },
    options_to_test: {
      type: "string[]",
      optional: true,
      description: "Specific compiler option sets to test (default: common presets)",
      default: [
        "",                          // Baseline (scalar)
        "-vec",                      // Vectorized
        "-vec -fun",                 // Vectorized + functions
        "-vec -fun -vs 32",          // + vector size 32
        "-vec -fun -vs 64",          // + vector size 64
        "-vec -fun -vs 128",         // + vector size 128
        "-vec -omp",                 // Vectorized + OpenMP
        "-vec -fun -vs 64 -dfs -mcd 32"  // Highly optimized
      ]
    },
    duration_seconds: {
      type: "number",
      default: 5,
      description: "Measurement duration per configuration"
    },
    sample_rate: {
      type: "number",
      default: 44100,
      description: "Sample rate for CPU % calculation"
    }
  },

  returns: {
    success: "boolean",
    results: {
      type: "PerformanceResult[]",
      schema: {
        compiler_options: "string",
        throughput_mbps: "number",
        cpu_percent: "number",
        memory_bytes: "number",
        rank: "number (1 = best)"
      }
    },
    recommended_options: "string (best performing option set)",
    baseline_comparison: {
      speedup: "number (compared to scalar baseline)",
      description: "string"
    },
    errors: "CompilerError[]"
  }
}
```

**Example Usage**:

```typescript
analyze_faust_performance({
  source: "process = os.osc(440);",
  backend: "llvm",
  duration_seconds: 3
})

// Returns:
{
  success: true,
  results: [
    {
      compiler_options: "-vec -fun -vs 64",
      throughput_mbps: 1234.5,
      cpu_percent: 12.3,
      memory_bytes: 2048,
      rank: 1
    },
    {
      compiler_options: "-vec",
      throughput_mbps: 982.1,
      cpu_percent: 15.8,
      memory_bytes: 1856,
      rank: 2
    },
    {
      compiler_options: "" // baseline
      throughput_mbps: 423.7,
      cpu_percent: 38.2,
      memory_bytes: 1536,
      rank: 8
    }
  ],
  recommended_options: "-vec -fun -vs 64",
  baseline_comparison: {
    speedup: 2.91,
    description: "Recommended options achieve 2.91x speedup vs scalar baseline"
  },
  errors: []
}
```

---

### 2.2 Tool: profile_faust_execution

**Purpose**: Profile a specific Faust compilation for detailed performance characteristics.

```typescript
{
  name: "profile_faust_execution",
  description: "Profile Faust code execution to identify performance bottlenecks",

  parameters: {
    source: {
      type: "string",
      description: "Faust DSP code or file path"
    },
    compiler_options: {
      type: "string",
      default: "",
      description: "Compiler options to use for this profile run"
    },
    input_signal: {
      type: "enum",
      values: ["silence", "noise", "sine", "custom"],
      default: "noise",
      description: "Test signal for profiling"
    },
    duration_seconds: {
      type: "number",
      default: 10,
      description: "Profiling duration"
    }
  },

  returns: {
    success: "boolean",
    metrics: {
      avg_cpu_percent: "number",
      peak_cpu_percent: "number",
      avg_latency_samples: "number",
      peak_latency_samples: "number",
      memory_peak_bytes: "number",
      buffer_underruns: "number",
      sample_rate_achieved: "number"
    },
    timeline: {
      cpu_usage_over_time: "number[] (sampled every 100ms)",
      timestamps: "number[]"
    },
    recommendations: "string[]"
  }
}
```

---

### 2.3 Tool: compare_faust_implementations

**Purpose**: Compare multiple DSP implementations (A/B testing).

```typescript
{
  name: "compare_faust_implementations",
  description: "Compare performance of two or more Faust implementations",

  parameters: {
    implementations: {
      type: "Implementation[]",
      schema: {
        name: "string",
        source: "string (Faust code)",
        compiler_options: "string"
      },
      description: "Array of implementations to compare"
    },
    test_duration_seconds: {
      type: "number",
      default: 5
    }
  },

  returns: {
    success: "boolean",
    comparison: {
      type: "ComparisonResult[]",
      schema: {
        name: "string",
        throughput_mbps: "number",
        cpu_percent: "number",
        memory_bytes: "number",
        rank: "number",
        relative_performance: "string (e.g., '1.5x faster than baseline')"
      }
    },
    winner: "string (implementation name)",
    recommendations: "string"
  }
}
```

**Example Usage - Comparing Filter Implementations**:

```typescript
compare_faust_implementations({
  implementations: [
    {
      name: "resonlp",
      source: "process = fi.resonlp(1000, 1, 1);",
      compiler_options: "-vec"
    },
    {
      name: "lowpass6e",
      source: "process = fi.lowpass6e(1000);",
      compiler_options: "-vec"
    },
    {
      name: "butterworth",
      source: "process = fi.lowpass(4, 1000);",
      compiler_options: "-vec"
    }
  ]
})

// Returns which filter is most efficient for this use case
```

---

## 3. Performance Metrics Framework

### 3.1 Metric Categories

```typescript
interface PerformanceMetrics {
  // Throughput
  throughput: {
    mbps: number,              // MBytes/sec
    samples_per_second: number, // Derived
    channels_processed: number
  },

  // CPU Usage
  cpu: {
    percent_at_44100: number,  // % at 44.1 kHz
    percent_at_48000: number,  // % at 48 kHz
    percent_at_96000: number,  // % at 96 kHz
    headroom_percent: number   // 100 - cpu_percent
  },

  // Memory
  memory: {
    dsp_struct_bytes: number,
    estimated_heap_bytes: number,
    estimated_stack_bytes: number
  },

  // Latency (if measurable)
  latency: {
    avg_samples: number,
    max_samples: number,
    avg_milliseconds: number
  },

  // Optimization Potential
  optimization: {
    baseline_speedup: number,    // vs scalar compilation
    vectorization_benefit: number, // % improvement from -vec
    openmp_benefit: number         // % improvement from -omp
  }
}
```

---

### 3.2 Performance Categories

Categorize DSP performance to help Claude provide context:

| CPU % | Category | Interpretation |
|-------|----------|----------------|
| 0-10% | Excellent | Very lightweight, leaves headroom |
| 10-25% | Good | Efficient, suitable for complex projects |
| 25-50% | Moderate | Usable, but optimize for complex contexts |
| 50-75% | Heavy | Requires optimization before deployment |
| 75-100% | Critical | Unusable in real-time, needs major optimization |
| >100% | Impossible | Cannot run in real-time at this sample rate |

**Recommendations by Category**:
- **Excellent**: Ship as-is
- **Good**: Consider optimization if combining multiple DSPs
- **Moderate**: Apply vectorization (-vec)
- **Heavy**: Enable all optimizations (-vec -fun -vs 64 -dfs)
- **Critical**: Rethink algorithm, simplify DSP
- **Impossible**: Reduce sample rate or redesign

---

### 3.3 Optimization Suggestions Engine

**Algorithm**: Based on benchmark results, generate actionable recommendations.

```typescript
function generateRecommendations(results: PerformanceResult[]): string[] {
  const recommendations = [];
  const baseline = results.find(r => r.compiler_options === "");
  const best = results[0]; // Rank 1

  // Vectorization check
  const vecResult = results.find(r => r.compiler_options.includes("-vec"));
  if (vecResult && baseline) {
    const speedup = vecResult.throughput_mbps / baseline.throughput_mbps;
    if (speedup > 1.5) {
      recommendations.push(
        `Vectorization provides ${speedup.toFixed(2)}x speedup. Use -vec flag.`
      );
    }
  }

  // Vector size optimization
  const vs32 = results.find(r => r.compiler_options.includes("-vs 32"));
  const vs64 = results.find(r => r.compiler_options.includes("-vs 64"));
  const vs128 = results.find(r => r.compiler_options.includes("-vs 128"));

  if (vs64 && vs32 && vs64.throughput_mbps > vs32.throughput_mbps * 1.1) {
    recommendations.push("Vector size 64 is optimal for this DSP.");
  }

  // OpenMP check
  const ompResult = results.find(r => r.compiler_options.includes("-omp"));
  if (ompResult && baseline && ompResult.throughput_mbps / baseline.throughput_mbps > 2) {
    recommendations.push("Multi-core scaling effective. Use -omp for multi-threaded contexts.");
  }

  // CPU usage warning
  if (best.cpu_percent > 75) {
    recommendations.push(
      "WARNING: Even with optimal flags, CPU usage is high (${best.cpu_percent}%). Consider simplifying DSP algorithm."
    );
  }

  // Memory concern
  if (best.memory_bytes > 10 * 1024 * 1024) { // 10MB
    recommendations.push(
      "Large memory footprint (${(best.memory_bytes / 1024 / 1024).toFixed(2)} MB). Check delay line usage."
    );
  }

  return recommendations;
}
```

---

## 4. Integration with Compiler

### 4.1 Workflow Integration

Performance analysis tools integrate with the compiler integration layer (from `faust-compiler-integration-001`):

```
┌─────────────────────────────────────────────┐
│       MCP Performance Analysis Tools        │
│  (analyze_faust_performance, profile, etc.) │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────┴──────────────────────────┐
│      Integration Helper Layer               │
│  - Invoke faustbench/faustbench-llvm        │
│  - Parse benchmark output                   │
│  - Compute derived metrics                  │
│  - Generate recommendations                 │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────┴──────────────────────────┐
│       Faust Benchmark Tools                 │
│  (faustbench, faustbench-llvm, ...)         │
└─────────────────────────────────────────────┘
```

---

### 4.2 Benchmark Execution Strategy

**For `analyze_faust_performance`:**

1. **Validate DSP** - Check syntax before benchmarking
2. **Generate test matrix** - Create test configurations (options combinations)
3. **Run faustbench-llvm** - Execute benchmarks (LLVM is fastest for iteration)
4. **Parse output** - Extract throughput, CPU%, memory
5. **Rank results** - Sort by throughput (higher is better)
6. **Compute comparisons** - Calculate speedups vs baseline
7. **Generate recommendations** - Apply optimization suggestion engine
8. **Return structured data** - Format as JSON for Claude

**Timeout**: Set reasonable timeout (default 60s for all tests). Complex DSP may take longer.

---

## 5. Metrics Reporting Format

### 5.1 Human-Readable Summary

**Example Output for Claude**:

```
Performance Analysis Results
============================

DSP: Reverb with Feedback
Sample Rate: 44100 Hz
Test Duration: 5 seconds per configuration

Results (ranked by throughput):
--------------------------------

1. [BEST] -vec -fun -vs 64 -dfs
   Throughput: 1,234 MBps
   CPU Usage: 12.3%
   Memory: 2.0 KB
   Speedup vs Baseline: 2.9x

2. -vec -fun -vs 32
   Throughput: 1,102 MBps
   CPU Usage: 14.1%
   Memory: 1.9 KB
   Speedup vs Baseline: 2.6x

3. -vec
   Throughput: 982 MBps
   CPU Usage: 15.8%
   Memory: 1.8 KB
   Speedup vs Baseline: 2.3x

...

8. [BASELINE] (scalar, no optimization)
   Throughput: 424 MBps
   CPU Usage: 38.2%
   Memory: 1.5 KB

Recommendations:
- ✅ Use '-vec -fun -vs 64 -dfs' for optimal performance
- ✅ Vectorization provides 2.9x speedup - highly effective
- ✅ CPU usage is excellent (12.3%) - leaves headroom for other processing
- ℹ️ Memory footprint is small - no concerns

Conclusion: This DSP is well-optimized. Deploy with recommended flags.
```

---

### 5.2 Machine-Readable JSON

```json
{
  "dsp_analyzed": "reverb_feedback.dsp",
  "test_config": {
    "sample_rate": 44100,
    "duration_seconds": 5,
    "backend": "llvm"
  },
  "results": [
    {
      "rank": 1,
      "compiler_options": "-vec -fun -vs 64 -dfs",
      "metrics": {
        "throughput_mbps": 1234.0,
        "cpu_percent": 12.3,
        "memory_bytes": 2048,
        "headroom_percent": 87.7
      },
      "comparison": {
        "speedup_vs_baseline": 2.91,
        "category": "excellent"
      }
    }
  ],
  "recommended": {
    "options": "-vec -fun -vs 64 -dfs",
    "rationale": "Best throughput with low CPU usage",
    "speedup": 2.91
  },
  "suggestions": [
    "Use '-vec -fun -vs 64 -dfs' for optimal performance",
    "Vectorization provides 2.9x speedup - highly effective",
    "CPU usage is excellent (12.3%) - leaves headroom"
  ]
}
```

---

## 6. Implementation Guidelines

### 6.1 Wrapper Script Structure

```typescript
// pseudo-code
async function analyzeFaustPerformance(params) {
  // 1. Validate DSP
  const validationResult = await validateFaustSyntax(params.source);
  if (!validationResult.valid) {
    return { success: false, errors: validationResult.errors };
  }

  // 2. Prepare test configurations
  const testConfigs = params.options_to_test || DEFAULT_OPTIONS;

  // 3. Execute faustbench-llvm
  const benchmarkOutput = await execFaustbench({
    source: params.source,
    backend: params.backend,
    options: testConfigs,
    duration: params.duration_seconds
  });

  // 4. Parse results
  const results = parseBenchmarkOutput(benchmarkOutput);

  // 5. Rank and compute comparisons
  const rankedResults = rankResults(results);
  const baseline = results.find(r => r.compiler_options === "");

  // 6. Generate recommendations
  const recommendations = generateRecommendations(rankedResults, baseline);

  // 7. Return structured data
  return {
    success: true,
    results: rankedResults,
    recommended_options: rankedResults[0].compiler_options,
    baseline_comparison: {
      speedup: rankedResults[0].throughput_mbps / baseline.throughput_mbps,
      description: `Recommended options achieve ${speedup.toFixed(2)}x speedup`
    },
    suggestions: recommendations
  };
}
```

---

### 6.2 Output Parsing

**faustbench-llvm output format** (example):

```
Testing: scalar
  Throughput: 423.7 MBps
  CPU Usage: 38.2%
  Memory: 1536 bytes

Testing: -vec
  Throughput: 982.1 MBps
  CPU Usage: 15.8%
  Memory: 1856 bytes

...
```

**Parser**:
```typescript
function parseBenchmarkOutput(output: string): PerformanceResult[] {
  const results = [];
  const blocks = output.split(/Testing: /);

  for (const block of blocks.slice(1)) { // skip first empty
    const lines = block.trim().split('\n');
    const options = lines[0].trim();
    const throughput = parseFloat(lines[1].match(/Throughput: ([\d\.]+)/)?.[1]);
    const cpu = parseFloat(lines[2].match(/CPU Usage: ([\d\.]+)/)?.[1]);
    const memory = parseInt(lines[3].match(/Memory: (\d+)/)?.[1]);

    results.push({
      compiler_options: options === "scalar" ? "" : options,
      throughput_mbps: throughput,
      cpu_percent: cpu,
      memory_bytes: memory
    });
  }

  return results;
}
```

---

## 7. Testing & Validation

### 7.1 Test Cases

**Simple DSP** (baseline validation):
```faust
import("stdfaust.lib");
process = os.osc(440);
```
Expected: Low CPU%, vectorization shows moderate improvement

**Complex DSP** (vectorization benefit):
```faust
import("stdfaust.lib");
process = _ <: re.stereo_freeverb(0.8, 0.5, 0.5, 0.5);
```
Expected: High baseline CPU%, significant vectorization speedup (2-3x)

**Heavy DSP** (optimization critical):
```faust
import("stdfaust.lib");
delay_network = seq(i, 10, de.delay(48000, 10000 + i*1000));
process = _ : delay_network;
```
Expected: Very high CPU%, memory concerns, vectorization essential

---

### 7.2 Validation Criteria

- [ ] Benchmarks complete without errors
- [ ] Results are ranked correctly (by throughput)
- [ ] Speedup calculations are accurate
- [ ] Recommendations are sensible
- [ ] CPU% values are realistic (<100% for runnable code)
- [ ] Memory values are non-zero and reasonable

---

## 8. Open Questions & Future Enhancements

### 8.1 Current Scope

**Included**:
- ✅ Wrapper for faustbench-llvm
- ✅ Structured performance metrics
- ✅ Optimization recommendations
- ✅ A/B comparison tool

**Not Included** (future work):
- ❌ Real-time latency measurement (requires audio I/O)
- ❌ GPU acceleration benchmarking
- ❌ Multi-device profiling (iOS, Android, embedded)

---

### 8.2 Integration with Other Tasks

**Dependencies Met**:
- `faust-compiler-integration-001` ✅ (provides compiler execution layer)

**Coordination Needed**:
- `faust-code-examples-library-001` (ui-pro) - Use examples for performance testing
- `faust-mcp-specification-001` (bookkeeper) - Align on MCP tool naming/structure

---

## 9. Success Criteria

**This implementation is successful when:**

✅ Claude can benchmark any Faust DSP and receive performance metrics
✅ Recommendations guide users to optimal compiler flags
✅ A/B comparisons help choose between algorithm implementations
✅ Performance categories (Excellent/Good/Critical) provide clear guidance
✅ Integration tests validate accuracy of metrics
✅ Documentation enables developers to extend profiling capabilities

---

## Sources

- [Faust Benchmark Tools GitHub](https://github.com/grame-cncm/faust/tree/master-dev/tools/benchmark)
- [Faust Benchmark README](https://github.com/grame-cncm/faust/blob/master-dev/tools/benchmark/README.md)
- [Optimizing the Code - Faust Documentation](https://faustdoc.grame.fr/manual/optimizing/)

---

**Author**: thinker
**Date**: 2025-12-11
**Version**: 1.0
**Status**: Architecture Complete - Ready for Implementation
