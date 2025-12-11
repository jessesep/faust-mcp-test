# Faust MCP Quick Reference Guide

**For developers integrating with Faust MCP**

---

## Tool Summary

| Tool | Purpose | Input | Output |
|------|---------|-------|--------|
| `faust/validate-syntax` | Check syntax correctness | Code | Errors, warnings |
| `faust/compile` | Generate target code | Code + target | Compiled code, log |
| `faust/analyze-structure` | Understand code structure | Code | Processes, I/O, params |
| `faust/execute` | Run code and get audio | Code + params | Audio file, analysis |
| `faust/debug-error` | Get error explanations | Error message | Diagnosis, fixes |
| `faust/get-library-docs` | Find library functions | Query | Function docs |
| `faust/performance-profile` | Analyze performance | Code | CPU, memory, latency |
| `faust/format-code` | Apply style rules | Code | Formatted code |
| `faust/suggest-completion` | Get completion hints | Partial code | Suggestions |

---

## Common Workflows

### Validate and Compile
```
validate-syntax → analyze-structure → compile
```

### Debug Errors
```
compile (fails) → debug-error → suggest-completion → validate-syntax
```

### Execute and Test
```
compile (success) → execute → profile-performance
```

### Explore Library
```
get-library-docs (search term) → analyze-structure (example code)
```

---

## Response Quick Check

**Always check these fields**:
```
- .success (boolean)     ← First check this
- .errors (array)        ← Read if success=false
- .valid (boolean)       ← For validate-syntax
- .code or .result       ← Your actual output
```

---

## Error Categories

| Error | Meaning | Solution |
|-------|---------|----------|
| `SYNTAX_ERROR` | Grammar violation | Check semicolons, parentheses |
| `UNDEFINED_SYMBOL` | Unknown variable/function | Import library or define it |
| `BOX_DIMENSION_ERROR` | I/O mismatch | Review input/output counts |
| `COMPILATION_ERROR` | Type/connection error | Use `debug-error` tool |

---

## Timeout Handling

**Operation timeouts**:
- Syntax validation: <1s
- Compilation: 1-10s
- Execution: 5-30s (depends on duration)
- Library lookup: <1s

**If stuck**: Simplify code or increase timeout to 60s max

---

## Parameter Tips

### For `compile` tool:
- `target`: Use "cpp" for fastest iteration, "wasm" for web
- `optimization_level`: 0 for debug, 2 for normal, 3 for max speed
- Set `include_paths` if using custom libraries

### For `execute` tool:
- Default sample rate: 44100 Hz
- Default buffer size: 256 samples
- Provide `audio_input` as WAV path or sample array
- Set `duration` to limit execution time

### For `analyze-structure` tool:
- Use `detail_level: "basic"` for quick overview
- Use `detail_level: "full"` to see all intermediate definitions
- Check `io_summary` to understand overall I/O

---

## Common Code Patterns

### Simple Filter
```faust
import("stdfaust.lib");
process = fi.lowpass(3, co)
  with { co = hslider("Freq", 1000, 20, 20000, 1); };
```

### Oscillator + Envelope
```faust
import("stdfaust.lib");
process = os.osc(freq) * env
  with {
    freq = hslider("Freq", 440, 20, 5000, 1);
    env = ba.gate(gate) * ad.adsr(0.01, 0.1, 0.7, 0.5, gate)
    with { gate = button("Gate"); };
  };
```

### Multi-Output Effect
```faust
import("stdfaust.lib");
split_stereo = fi.lowpass(3, co), fi.highpass(3, co)
  with { co = hslider("Crossover", 1000, 20, 20000, 1); };
process = split_stereo;
```

---

## Troubleshooting

**"undefined symbol"?**
→ Add import: `import("stdfaust.lib");`

**"number of outputs [N] must equal inputs [M]"?**
→ Use `,` (parallel) instead of `:` (sequential)

**Execution produces silence?**
→ Check parameter values, multiply output by gain

**Compilation very slow?**
→ Simplify code, use lower optimization level

**Need library function list?**
→ Call `get-library-docs` with library name

---

## Best Practices

✅ **DO**:
- Start with `validate-syntax` before compiling
- Use `analyze-structure` to check I/O before execution
- Call `debug-error` when compilation fails
- Profile code before optimization
- Cache library documentation results
- Provide `architecture` file for special targets

❌ **DON'T**:
- Skip validation
- Ignore dimensional mismatches
- Execute untested code
- Assume import defaults
- Timeout waiting on long compilations
- Leave temporary files in system

---

## Configuration Example

```json
{
  "faust": {
    "validate_before_compile": true,
    "default_optimization": 2,
    "max_execution_time": 30,
    "cache_library_docs": true
  }
}
```

---

## Links

- Full specification: `MCP-SPECIFICATION.md`
- Error reference: `faust-error-research.md`
- Examples: `FAUST-CODE-EXAMPLES.md`
- Architecture: `FAUST-ARCHITECTURE.md`

---

**Version**: 1.0 | **Updated**: 2025-12-11
