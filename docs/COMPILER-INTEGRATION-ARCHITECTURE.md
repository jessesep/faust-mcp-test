# Faust Compiler Integration Architecture

**Task**: faust-compiler-integration-001
**Author**: thinker
**Date**: 2025-12-11
**Status**: Design Complete - Ready for Implementation

---

## Executive Summary

This document defines the architecture for integrating the Faust DSP compiler with the Model Context Protocol (MCP), enabling Claude to compile, validate, and analyze Faust DSP code.

**Recommended Approach**: Hybrid architecture (Option C) - direct compiler invocation with structured error handling and helper utilities.

---

## 1. Faust Compiler Capabilities

### 1.1 Basic Invocation

```bash
faust [options] file.dsp
```

**Key Options:**
- `-o <file>` - Output file path
- `-a <file>` - Wrapper architecture file
- `-svg` - Generate SVG block diagram
- `-I <dir>` - Import search path
- `-vec` - Enable vectorization
- `-omp` - OpenMP pragmas

### 1.2 Output Targets

Supported backends: `c`, `cpp`, `cmajor`, `codebox`, `csharp`, `dlang`, `fir`, `interp`, `java`, `jax`, `jsfx`, `julia`, `llvm`, `ocpp`, `rust`, `sdf3`, `vhdl`, `wast/wasm`

### 1.3 Diagnostic Outputs

- **SVG Block Diagrams**: Visual representation of signal flow (`-svg`)
- **PostScript**: Alternative diagram format (`-ps`)
- **Error Messages**: Detailed syntax and type errors on stderr

### 1.4 faust2xxx Ecosystem

Specialized tools for platform-specific builds:
- `faust2jack` - JACK audio applications
- `faust2lv2` - LV2 plugins
- `faust2vst` - VST plugins
- And many more...

**Research Sources:**
- [Using the Compiler - Faust Documentation](https://faustdoc.grame.fr/manual/compiler/)
- [Compiler Options - Faust Documentation](https://faustdoc.grame.fr/manual/options/)
- [Generating FAUST Block Diagrams](https://ccrma.stanford.edu/~jos/aspf/Generating_FAUST_Block_Diagrams.html)
- [faust2[...] Tools - Faust Documentation](https://faustdoc.grame.fr/manual/tools/)

---

## 2. Architecture Options Analysis

### Option A: Direct Compiler Wrapper

**Description**: MCP tools directly invoke `faust` binary via shell, capture stdout/stderr.

**Pros:**
- ✅ Minimal abstraction overhead
- ✅ Direct access to all compiler options
- ✅ Simple implementation
- ✅ No intermediate services to manage

**Cons:**
- ❌ Requires Faust installed on system
- ❌ Error parsing can be brittle
- ❌ No caching or optimization layer
- ❌ Limited testing flexibility (requires real compiler)

**Use Case**: Lightweight integration, minimal features.

---

### Option B: Faust-as-Service Layer

**Description**: Build intermediate service that wraps compiler. MCP communicates with service via structured API (JSON).

**Pros:**
- ✅ Clean, structured error handling
- ✅ Potential for compilation caching
- ✅ Easier testing (mock service)
- ✅ Could add optimizations (batching, parallel compilation)
- ✅ Version abstraction (service handles Faust updates)

**Cons:**
- ❌ Significant additional complexity
- ❌ Additional process management overhead
- ❌ Requires service deployment and monitoring
- ❌ Network latency (if remote service)
- ❌ Over-engineered for initial version

**Use Case**: Production-scale system with many users, cloud deployment.

---

### Option C: Hybrid Approach (RECOMMENDED)

**Description**: Direct invocation for simple operations (compile, validate), plus structured helper layer for error parsing, diagram generation, and workflow orchestration.

**Architecture:**
```
┌──────────────────────────────────────────────────┐
│              MCP Tools Layer                     │
│  (compile_faust, validate_syntax, gen_diagram)   │
└────────────────┬─────────────────────────────────┘
                 │
┌────────────────┴─────────────────────────────────┐
│          Integration Helper Layer                │
│  - Error parser (stderr → structured errors)     │
│  - Output formatter (SVG, diagrams)              │
│  - Workflow orchestrator (compile + diagram)     │
│  - Timeout & resource management                 │
└────────────────┬─────────────────────────────────┘
                 │
┌────────────────┴─────────────────────────────────┐
│         Faust Compiler (Direct Exec)             │
│          `faust [options] file.dsp`              │
└──────────────────────────────────────────────────┘
```

**Pros:**
- ✅ Balance of simplicity and robustness
- ✅ Good error handling without service overhead
- ✅ Can evolve toward Option B if needed
- ✅ Testable (can mock helper layer)
- ✅ Structured errors for Claude to interpret

**Cons:**
- ⚠️ Slightly more complex than Option A
- ⚠️ Still requires Faust installed locally
- ⚠️ Need clear boundaries on helper layer scope

**Recommendation**: Start with Option C. Build the integration helper layer as a lightweight module, keep it focused on parsing/formatting.

---

## 3. MCP Tool Specifications

### 3.1 compile_faust

**Purpose**: Compile Faust DSP code to target language.

```typescript
{
  name: "compile_faust",
  description: "Compile Faust DSP code to target language (C++, Rust, WASM, etc.)",

  parameters: {
    source: {
      type: "string",
      description: "Faust DSP code as string OR file path to .dsp file"
    },
    target: {
      type: "enum",
      values: ["cpp", "c", "rust", "wasm", "java", "llvm"],
      default: "cpp",
      description: "Target language/backend"
    },
    output_file: {
      type: "string",
      optional: true,
      description: "Path for output file (default: stdout)"
    },
    options: {
      type: "object",
      optional: true,
      properties: {
        vectorize: "boolean (enable -vec)",
        architecture: "string (wrapper architecture file path)",
        import_dirs: "string[] (directories for -I option)",
        openmp: "boolean (enable -omp)"
      }
    }
  },

  returns: {
    success: "boolean",
    output: "string (compiled code or path to output file)",
    errors: "CompilerError[] (structured error objects)",
    warnings: "string[]",
    compilation_time_ms: "number",
    raw_stderr: "string (for debugging)"
  }
}
```

**Example Usage:**
```typescript
compile_faust({
  source: "process = osc(440);",
  target: "cpp",
  options: { vectorize: true }
})
// Returns compiled C++ code
```

---

### 3.2 generate_faust_diagram

**Purpose**: Generate SVG block diagram visualization.

```typescript
{
  name: "generate_faust_diagram",
  description: "Generate SVG block diagram from Faust DSP code",

  parameters: {
    source: {
      type: "string",
      description: "Faust DSP code as string OR file path"
    },
    simplify: {
      type: "boolean",
      default: true,
      description: "Simplify diagrams (--simplify-diagrams)"
    },
    scaled: {
      type: "boolean",
      default: true,
      description: "Generate auto-scalable SVG (--scaled-svg)"
    },
    output_dir: {
      type: "string",
      optional: true,
      description: "Directory for SVG output"
    }
  },

  returns: {
    success: "boolean",
    svg_path: "string (absolute path to generated SVG)",
    svg_data: "string (base64 encoded SVG content)",
    diagram_complexity: "number (element count)",
    errors: "CompilerError[]"
  }
}
```

**Example Usage:**
```typescript
generate_faust_diagram({
  source: "process = _ : filter : reverb;",
  simplify: true,
  scaled: true
})
// Returns SVG diagram of signal flow
```

---

### 3.3 validate_faust_syntax

**Purpose**: Fast syntax validation without full compilation.

```typescript
{
  name: "validate_faust_syntax",
  description: "Validate Faust code syntax without full compilation (fast check)",

  parameters: {
    source: {
      type: "string",
      description: "Faust DSP code to validate"
    },
    strict: {
      type: "boolean",
      default: false,
      description: "Enable strict validation (warnings as errors)"
    }
  },

  returns: {
    valid: "boolean",
    errors: "SyntaxError[] (structured syntax errors)",
    warnings: "string[]",
    suggestions: "string[] (helpful fix hints)",
    parsed_successfully: "boolean"
  }
}
```

**Implementation Note**: This can use a lightweight parse-only mode or attempt compilation to null backend and check for errors.

---

### 3.4 get_faust_info

**Purpose**: Check Faust installation and capabilities.

```typescript
{
  name: "get_faust_info",
  description: "Get Faust compiler version, available backends, and system info",

  parameters: {},

  returns: {
    installed: "boolean",
    version: "string (e.g., '2.70.3')",
    backends: "string[] (available output targets)",
    faust2_tools: "string[] (installed faust2xxx scripts)",
    install_path: "string"
  }
}
```

**Example Usage:**
```typescript
get_faust_info()
// Returns: { installed: true, version: "2.70.3", backends: ["cpp", "rust", ...] }
```

---

### 3.5 Potential Future Tools

**Consider for later phases:**

- `execute_faust_code` - Compile and run (requires audio output handling)
- `analyze_faust_performance` - Profile DSP computation cost
- `convert_faust_format` - Cross-compile between targets
- `invoke_faust2_tool` - Generic wrapper for faust2xxx tools

---

## 4. Error Handling & Parsing Strategy

### 4.1 Error Categories

```typescript
type ErrorType =
  | 'syntax'        // Parse errors in DSP code
  | 'import'        // Missing libraries or files
  | 'type'          // Signal type mismatches
  | 'compilation'   // Backend-specific failures
  | 'runtime'       // Execution issues
  | 'system';       // Faust not installed, permissions, etc.

interface CompilerError {
  type: ErrorType,
  severity: 'error' | 'warning',
  line: number | null,
  column: number | null,
  message: string,
  context: string,          // Surrounding code lines
  suggestion: string | null, // Helpful fix hint
  raw_message: string        // Original stderr
}
```

### 4.2 Parsing Strategy

**Faust Error Format (typical):**
```
filename.dsp : 15 : ERROR : undefined symbol 'osci'
filename.dsp : 23 : WARNING : unused variable 'gain'
```

**Regex Pattern:**
```regex
(?<file>[\w\-\.]+\.dsp)\s*:\s*(?<line>\d+)\s*:\s*(?<severity>ERROR|WARNING)\s*:\s*(?<message>.+)
```

**Parsing Steps:**
1. Capture stderr from Faust invocation
2. Apply regex to extract structured fields
3. Categorize error type based on message keywords
4. Extract context (read source line number)
5. Generate suggestion using pattern matching

**Example Transformation:**

```javascript
// Input (stderr):
"noise.dsp : 15 : ERROR : undefined symbol 'osci'"

// Output (structured):
{
  type: 'syntax',
  severity: 'error',
  line: 15,
  column: null,
  message: "undefined symbol 'osci'",
  context: "process = osci(440);", // line 15 from source
  suggestion: "Did you mean 'osc'? Check spelling or import 'oscillators.lib'",
  raw_message: "noise.dsp : 15 : ERROR : undefined symbol 'osci'"
}
```

### 4.3 Suggestion Generation

**Common Patterns:**

| Error Pattern | Suggestion |
|---------------|------------|
| `undefined symbol 'X'` | "Did you mean 'Y'? Check spelling or import relevant library" |
| `type mismatch` | "Check signal dimensions and types. Use ':' for serial composition" |
| `file not found: 'lib.lib'` | "Ensure library is in import path. Use -I option or check library name" |
| `syntax error` | "Check parentheses, semicolons, and operator usage" |

**Implementation**: Build lookup table of regex patterns → suggestion templates.

### 4.4 Robustness Features

1. **Timeout Handling**: Kill compilation after configurable timeout (default 30s)
2. **Partial Output Preservation**: Save stdout even if stderr has errors
3. **Raw Logs**: Always preserve raw stderr for debugging
4. **Graceful Degradation**: If parsing fails, return raw error messages

---

## 5. Implementation Guidelines

### 5.1 Technology Stack

**Language**: TypeScript (Node.js) or Python

**Rationale**:
- TypeScript: Better MCP integration, type safety, async/await
- Python: Easier subprocess handling, regex, might be simpler

**Recommendation**: TypeScript for consistency with MCP ecosystem.

### 5.2 Core Modules

```
faust-mcp/
├── src/
│   ├── tools/
│   │   ├── compile.ts          # compile_faust tool
│   │   ├── diagram.ts          # generate_faust_diagram tool
│   │   ├── validate.ts         # validate_faust_syntax tool
│   │   └── info.ts             # get_faust_info tool
│   ├── helpers/
│   │   ├── error-parser.ts     # Parse stderr → CompilerError[]
│   │   ├── executor.ts         # Execute faust binary with timeout
│   │   └── suggestions.ts      # Generate helpful error suggestions
│   ├── types/
│   │   └── index.ts            # TypeScript interfaces
│   └── index.ts                # MCP server entry point
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/               # Sample .dsp files for testing
└── docs/
    └── COMPILER-INTEGRATION-ARCHITECTURE.md (this file)
```

### 5.3 Dependencies

- `@modelcontextprotocol/sdk` - MCP SDK
- `execa` or `child_process` - Subprocess execution
- `zod` - Runtime type validation
- `chalk` - Error formatting (optional)

### 5.4 Testing Strategy

**Unit Tests**:
- Error parser with various stderr formats
- Suggestion generator with known patterns
- Timeout handling

**Integration Tests**:
- Compile valid Faust code
- Handle compilation errors gracefully
- Generate diagrams
- Validate syntax

**Fixtures**: Create `.dsp` files with:
- Valid code
- Syntax errors
- Type errors
- Import errors

---

## 6. Open Questions & Decisions Needed

### 6.1 faust2xxx Tool Support

**Question**: Should we support the `faust2xxx` ecosystem (faust2jack, faust2lv2, etc.)?

**Options**:
- **A**: Core compiler only (simpler, focused)
- **B**: Add generic `invoke_faust2_tool` wrapper (more powerful, complex)

**Recommendation**: Start with Option A. Add faust2xxx support in later phase if users request it.

---

### 6.2 Diagram Output Format

**Question**: How should SVG diagrams be returned?

**Options**:
- **A**: File path only (requires Claude to read file)
- **B**: Base64 encoded string (inline in response)
- **C**: Both (flexible, but larger response)

**Recommendation**: Option C - return both path and base64. Claude can choose based on context.

---

### 6.3 Working Directory Strategy

**Question**: Where should temporary files (.dsp, compiled output) be stored?

**Options**:
- **A**: User's current directory (simple, but clutters workspace)
- **B**: System temp directory (clean, but files disappear)
- **C**: Configurable project directory (flexible, best practice)

**Recommendation**: Option C - add `working_dir` parameter to tools, default to temp directory.

---

### 6.4 Dependency on faust-mcp-specification-001

**Status**: Task `faust-mcp-specification-001` (assigned to bookkeeper) will define official MCP protocol specs.

**Action**: This architecture should be reviewed alongside bookkeeper's spec. If conflicts arise, align on tool names, parameter formats, and return types.

---

## 7. Next Steps

1. **Review with bookkeeper** - Align on MCP specification
2. **Implement helper layer** - Error parser, executor, suggestions
3. **Build MCP tools** - Start with `compile_faust` and `validate_faust_syntax`
4. **Write integration tests** - Use sample .dsp files
5. **Create examples library** - Work with ui-pro on code examples
6. **Document usage** - How Claude should invoke tools

---

## 8. Success Criteria

**This integration is successful when:**

✅ Claude can compile Faust code and receive structured errors
✅ Claude can generate and view SVG block diagrams
✅ Claude can validate syntax before full compilation
✅ Error messages include helpful suggestions for common mistakes
✅ All operations have reasonable timeouts (no hanging)
✅ Integration tests pass with 90%+ coverage

---

**Author**: thinker
**Date**: 2025-12-11
**Version**: 1.0
**Status**: Design Complete - Ready for Implementation Review
