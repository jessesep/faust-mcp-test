# Faust DSP Model Context Protocol (MCP) Specification

**Version**: 1.0
**Status**: Draft (awaiting architecture review)
**Last Updated**: 2025-12-11
**Maintained by**: bookkeeper agent

---

## 1. Overview

This specification defines the Model Context Protocol (MCP) interface for the Faust DSP programming language. The Faust MCP enables Claude and other MCP clients to:

- **Write** Faust DSP code with intelligent syntax assistance
- **Analyze** Faust code structure and detect errors
- **Execute** Faust programs and capture output
- **Test** code correctness through compilation and verification
- **Debug** issues with comprehensive error reporting
- **Profile** code performance and efficiency metrics

The MCP provides a standardized interface that abstracts the complexity of Faust compiler integration while exposing the capabilities needed for effective AI-assisted DSP development.

---

## 2. Architecture Overview

### 2.1 Core Components

The Faust MCP consists of:

1. **Context Server** - Provides tools and resources to MCP clients
2. **Tool Interface Layer** - Exposes Faust operations as discrete MCP tools
3. **Faust Integration Layer** - Manages compiler interaction and environment
4. **Response Serialization** - Formats outputs for client consumption

### 2.2 Data Flow

```
MCP Client (Claude)
    ↓
Tool Invocation (JSON-RPC)
    ↓
MCP Server (Faust Context)
    ↓
Tool Handler
    ↓
Faust Integration (Compiler/Validator)
    ↓
System Resources (Files, Compiler, etc.)
    ↓
Response (JSON)
    ↓
MCP Client
```

### 2.3 Communication Pattern

All communication follows the MCP specification:
- **Request**: JSON-RPC 2.0 format
- **Response**: Structured JSON with status, data, and error fields
- **Transport**: Configurable (stdio, HTTP, WebSocket)

---

## 3. Tool Definitions

### 3.1 Core Tools

The Faust MCP exposes the following primary tools:

#### 3.1.1 `faust/validate-syntax`

**Purpose**: Validate Faust code syntax without full compilation.

**Parameters**:
```json
{
  "code": "string (required) - Faust source code to validate",
  "imports": "array[string] (optional) - Additional library paths to include"
}
```

**Response**:
```json
{
  "valid": "boolean - Whether syntax is correct",
  "errors": [
    {
      "line": "number",
      "column": "number",
      "message": "string - Error description",
      "type": "string - Error category (syntax, undefined_symbol, etc.)"
    }
  ],
  "warnings": [
    {
      "line": "number",
      "message": "string"
    }
  ]
}
```

**Error Categories**:
- `syntax`: Grammar violations
- `undefined_symbol`: Reference to undefined variable/function
- `undefined_output`: Unknown output specification
- `malformed_operator`: Invalid operator usage

---

#### 3.1.2 `faust/compile`

**Purpose**: Compile Faust code to target backend.

**Parameters**:
```json
{
  "code": "string (required) - Faust source code",
  "target": "string (required) - Compilation target (c, cpp, llvm, wasm, etc.)",
  "architecture": "string (optional) - Architecture file to use",
  "options": {
    "optimization_level": "number (0-3, default 2)",
    "include_paths": "array[string]",
    "defines": "object - Preprocessor definitions"
  }
}
```

**Response**:
```json
{
  "success": "boolean",
  "target_code": "string - Generated code (if applicable)",
  "compilation_log": "string - Compiler output and diagnostics",
  "size_stats": {
    "output_size": "number - Size of generated code in bytes",
    "dsp_size": "number - DSP graph size estimate"
  },
  "errors": [
    {
      "severity": "error|warning",
      "line": "number",
      "message": "string",
      "context": "string - Code snippet around error"
    }
  ]
}
```

---

#### 3.1.3 `faust/analyze-structure`

**Purpose**: Analyze Faust code structure without compilation.

**Parameters**:
```json
{
  "code": "string (required) - Faust source code",
  "detail_level": "string (basic|detailed|full, default: detailed)"
}
```

**Response**:
```json
{
  "processes": [
    {
      "name": "string - Declared process name",
      "inputs": "number - Expected input count",
      "outputs": "number - Expected output count",
      "parameters": [
        {
          "name": "string",
          "type": "string - ui parameter type (hslider, checkbox, etc.)",
          "min": "number",
          "max": "number",
          "default": "number",
          "label": "string"
        }
      ]
    }
  ],
  "imported_libraries": [
    {
      "name": "string",
      "path": "string",
      "available": "boolean"
    }
  ],
  "io_summary": {
    "total_inputs": "number",
    "total_outputs": "number",
    "parameter_count": "number"
  },
  "structure_warnings": [
    {
      "type": "string - Warning category",
      "message": "string"
    }
  ]
}
```

---

#### 3.1.4 `faust/execute`

**Purpose**: Execute compiled Faust code with test input.

**Parameters**:
```json
{
  "code": "string (required) - Faust source code",
  "audio_input": "string|array (optional) - Input audio as WAV path or samples",
  "parameters": {
    "key": "number - Parameter name to value mapping"
  },
  "duration": "number (optional) - Execution duration in seconds",
  "sample_rate": "number (default: 44100)",
  "buffer_size": "number (default: 256)"
}
```

**Response**:
```json
{
  "success": "boolean",
  "audio_output": "string - Path to output WAV file",
  "sample_count": "number",
  "execution_stats": {
    "duration_ms": "number",
    "peak_cpu": "number - Estimated CPU usage percentage",
    "memory_used": "number - Memory in MB"
  },
  "output_analysis": {
    "peak_level": "number - dB",
    "rms_level": "number - dB",
    "clipped": "boolean",
    "dc_offset": "number"
  },
  "errors": [
    {
      "type": "string",
      "message": "string"
    }
  ]
}
```

---

#### 3.1.5 `faust/debug-error`

**Purpose**: Provide detailed debugging assistance for compilation or runtime errors.

**Parameters**:
```json
{
  "error_message": "string (required) - The error message from compiler",
  "code": "string (optional) - Full source code for context",
  "error_type": "string (optional) - Classification of error"
}
```

**Response**:
```json
{
  "diagnosis": "string - Plain English explanation of the error",
  "root_cause": "string - What likely caused the problem",
  "affected_areas": [
    "string - Code sections or constructs involved"
  ],
  "suggested_fixes": [
    {
      "fix": "string - Suggested code change",
      "explanation": "string - Why this fixes the issue",
      "code_example": "string - Before/after example"
    }
  ],
  "reference_docs": [
    {
      "title": "string",
      "url": "string - Link to relevant documentation"
    }
  ]
}
```

---

#### 3.1.6 `faust/get-library-docs`

**Purpose**: Retrieve documentation for Faust standard library functions.

**Parameters**:
```json
{
  "function_name": "string (optional) - Specific function to document",
  "library": "string (optional) - Library (math, si, ro, fi, etc.)",
  "search_term": "string (optional) - Search for functions matching term"
}
```

**Response**:
```json
{
  "functions": [
    {
      "name": "string",
      "library": "string",
      "signature": "string - Function signature",
      "description": "string",
      "parameters": [
        {
          "name": "string",
          "type": "string",
          "description": "string"
        }
      ],
      "returns": "string - Return value description",
      "examples": [
        "string - Usage examples"
      ],
      "related": [
        "string - Related functions"
      ]
    }
  ]
}
```

---

#### 3.1.7 `faust/performance-profile`

**Purpose**: Analyze code performance characteristics.

**Parameters**:
```json
{
  "code": "string (required)",
  "test_configuration": {
    "sample_rate": "number (default: 44100)",
    "buffer_sizes": "array[number] - Test multiple sizes",
    "iterations": "number (default: 1000)"
  }
}
```

**Response**:
```json
{
  "compilation_time_ms": "number",
  "execution_profile": {
    "buffer_size_256": {
      "avg_cpu_percent": "number",
      "peak_cpu_percent": "number",
      "latency_ms": "number",
      "throughput_samples_sec": "number"
    }
  },
  "memory_profile": {
    "static_memory_bytes": "number",
    "dynamic_memory_peak_bytes": "number",
    "heap_allocations": "number"
  },
  "optimization_suggestions": [
    "string - Performance improvement recommendations"
  ]
}
```

---

### 3.2 Utility Tools

#### 3.2.1 `faust/format-code`

**Purpose**: Format Faust code according to style guidelines.

**Parameters**:
```json
{
  "code": "string (required)",
  "style": "string (default: google - faust coding style)"
}
```

**Response**:
```json
{
  "formatted_code": "string",
  "changes_made": [
    {
      "line": "number",
      "type": "string - indent|spacing|naming|etc",
      "before": "string",
      "after": "string"
    }
  ]
}
```

---

#### 3.2.2 `faust/suggest-completion`

**Purpose**: Provide code completion suggestions.

**Parameters**:
```json
{
  "code": "string (required) - Code with cursor at end",
  "context": "string (optional) - Surrounding context",
  "position": "number (optional) - Cursor line/column"
}
```

**Response**:
```json
{
  "suggestions": [
    {
      "text": "string - Completion text",
      "type": "string - function|variable|operator|keyword",
      "description": "string",
      "score": "number - Relevance 0-1",
      "insert": "string - Full insertion text"
    }
  ]
}
```

---

## 4. Error Handling

### 4.1 Standard Error Response Format

All tools can return structured errors:

```json
{
  "error": {
    "code": "string - Error code (COMPILATION_ERROR, SYNTAX_ERROR, etc.)",
    "message": "string - Human-readable error description",
    "details": {
      "line": "number (optional)",
      "column": "number (optional)",
      "context": "string (optional) - Code snippet"
    }
  }
}
```

### 4.2 Error Categories

| Code | Meaning | Recoverable |
|------|---------|-------------|
| `SYNTAX_ERROR` | Code violates Faust grammar | Yes |
| `COMPILATION_ERROR` | Type/connection errors | Yes |
| `UNDEFINED_SYMBOL` | Reference to undefined identifier | Yes |
| `BOX_DIMENSION_ERROR` | I/O count mismatch | Yes |
| `EXECUTION_ERROR` | Runtime error during execution | Yes |
| `FILE_ERROR` | Cannot read/write files | No |
| `COMPILER_ERROR` | Internal compiler issue | No |
| `RESOURCE_ERROR` | Insufficient system resources | No |

---

## 5. API Usage Patterns

### 5.1 Basic Development Workflow

```
1. Client: faust/validate-syntax
   Server: Returns syntax errors (if any)

2. Client: faust/analyze-structure
   Server: Returns process definition, I/O counts, parameters

3. Client: faust/compile
   Server: Returns compiled output or compilation errors

4. Client: faust/debug-error (if compilation failed)
   Server: Returns diagnosis and suggestions

5. Client: faust/execute (if compilation succeeded)
   Server: Returns output audio and analysis
```

### 5.2 Iterative Development Pattern

```
Start with simple code → Validate syntax → Analyze structure
    ↓
   Add complexity → Validate → Compile → Debug errors
    ↓
   Refine implementation → Execute → Analyze results
    ↓
   Profile performance → Optimize → Repeat
```

### 5.3 Learning Pattern

```
User asks: "How do I create an oscillator?"
    ↓
Client: faust/get-library-docs (search: "oscillator")
    ↓
Server: Returns oscillator functions with examples
    ↓
User: Writes code using suggested patterns
    ↓
Client: faust/validate-syntax → faust/execute
```

---

## 6. Integration Guide

### 6.1 Prerequisite Setup

1. **Faust Installation**: Must have Faust 2.x+ installed
2. **Library Paths**: Standard library accessible
3. **Compiler Targets**: C++ compiler for C/C++ target
4. **Audio Backend**: JACK, PortAudio, or CoreAudio

### 6.2 Configuration

The MCP server requires:

```json
{
  "faust_paths": {
    "binary": "/usr/local/bin/faust",
    "libraries": "/usr/local/share/faust",
    "architecture": "/usr/local/share/faust/architecture"
  },
  "compilation": {
    "default_target": "cpp",
    "optimization_level": 2,
    "parallel_compile": true
  },
  "execution": {
    "default_sample_rate": 44100,
    "max_buffer_size": 2048,
    "timeout_seconds": 30
  }
}
```

### 6.3 Client Implementation

Clients using the Faust MCP should:

1. **Initialize** context with configuration
2. **Validate** code before compilation
3. **Check** structure to understand I/O expectations
4. **Handle** errors with graceful fallbacks
5. **Cache** library documentation locally
6. **Timeout** long operations (>30s)

### 6.4 Response Validation

Clients should validate responses:
- Check `success` flag in applicable responses
- Validate compiled code before execution
- Verify output audio integrity
- Handle partial responses gracefully

---

## 7. Implementation Notes

### 7.1 Scope Limitations

The Faust MCP currently:
- ✅ Validates and compiles Faust code
- ✅ Executes code and analyzes output
- ✅ Provides error diagnosis
- ❌ Does NOT provide real-time editing (compile on save)
- ❌ Does NOT integrate debuggers
- ❌ Does NOT provide visualization tools

### 7.2 Performance Considerations

- Compilation can take 1-10 seconds depending on code complexity
- Execution time depends on sample rate and buffer size
- Large WAV files require proportional memory
- Recommended timeout: 30 seconds per operation

### 7.3 Resource Management

- Clean up temporary compilation artifacts
- Limit concurrent compilations to CPU count
- Monitor process memory usage
- Set limits on WAV file size (default: 100MB)

---

## 8. Examples

### 8.1 Simple Sine Oscillator

**Request**: `faust/validate-syntax`
```json
{
  "code": "process = os.osc(1000);"
}
```

**Response**:
```json
{
  "valid": true,
  "errors": [],
  "warnings": []
}
```

---

### 8.2 Compilation with Error

**Request**: `faust/compile`
```json
{
  "code": "process = (sin(1000), cos(1000)) : +;",
  "target": "cpp"
}
```

**Response** (error):
```json
{
  "success": false,
  "errors": [
    {
      "severity": "error",
      "line": 1,
      "message": "the number of outputs [2] of (sin(1000), cos(1000)) must be equal to the number of inputs [1] of +",
      "context": "process = (sin(1000), cos(1000)) : +"
    }
  ]
}
```

---

### 8.3 Structure Analysis

**Request**: `faust/analyze-structure`
```json
{
  "code": "import(\"stdfaust.lib\");\nprocess = hgroup(\"Filter\", lowpass(co, Q))\n  with {\n    co = hslider(\"Cutoff\", 1000, 20, 20000, 1);\n    Q = hslider(\"Q\", 1, 0.1, 10, 0.1);\n  };"
}
```

**Response**:
```json
{
  "processes": [
    {
      "name": "process",
      "inputs": 1,
      "outputs": 1,
      "parameters": [
        {
          "name": "Cutoff",
          "type": "hslider",
          "min": 20,
          "max": 20000,
          "default": 1000
        },
        {
          "name": "Q",
          "type": "hslider",
          "min": 0.1,
          "max": 10,
          "default": 1
        }
      ]
    }
  ],
  "io_summary": {
    "total_inputs": 1,
    "total_outputs": 1,
    "parameter_count": 2
  }
}
```

---

## 9. Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-11 | Initial specification draft |

---

## 10. Related Documentation

- `faust-error-research.md` - Comprehensive error patterns and debugging guide
- `FAUST-ARCHITECTURE.md` - MCP architectural design (in progress)
- `FAUST-BEST-PRACTICES.md` - Faust coding patterns and optimization
- `FAUST-CODE-EXAMPLES.md` - Library of example programs

---

**Specification Status**: ✏️ Draft - Awaiting architecture review and implementation feedback

**Last Updated By**: bookkeeper agent
**Next Review**: After architecture design completion
