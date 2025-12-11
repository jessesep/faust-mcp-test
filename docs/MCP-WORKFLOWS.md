# Faust MCP Workflows & Visual Guides

**Visual workflows and diagrams for common Faust MCP tasks**

**Version**: 1.0 | **Updated**: 2025-12-11

---

## Workflow Diagrams

### Workflow 1: Validate → Compile → Execute

```
START
  │
  ▼
┌──────────────────────────┐
│ Write or receive Code    │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐      ┌─────────────┐
│ Validate Syntax          │─────→│ Has Errors? │
│ (faust/validate-syntax)  │      └─────┬───────┘
└──────────────────────────┘            │
                                   Yes  │  No
                                        │
                                    ┌───┴────────────┐
                                    │                │
                                    ▼                ▼
                            ┌──────────────┐  ┌──────────────────┐
                            │ Fix Errors   │  │ Analyze Structure │
                            │ Ask Claude   │  │ (faust/analyze)  │
                            └──────┬───────┘  └────────┬─────────┘
                                   │                   │
                                   └─────────┬─────────┘
                                             │
                                             ▼
                            ┌──────────────────────────┐
                            │ Compile Code             │
                            │ (faust/compile)          │
                            └────────┬─────────────────┘
                                     │
                                     ▼
                            ┌─────────────────┐
                            │ Compile OK?     │
                            └────┬────────────┘
                                 │
                           Yes   │    No
                                 │    │
                         ┌───────┘    │
                         │            │
                         ▼            ▼
                    ┌─────────┐  ┌──────────────┐
                    │ Execute │  │ Debug Error  │
                    │ (execute)  │ (debug-error)│
                    └────┬─────┘  └──────┬──────┘
                         │              │
                         │              └──→ Fix & Retry
                         │
                         ▼
                    ┌──────────────────┐
                    │ Audio Output     │
                    │ (.wav file)      │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ Listen/Analyze   │
                    │ Output           │
                    └────────┬─────────┘
                             │
                             ▼
                          DONE
```

---

### Workflow 2: Iterative Development Loop

```
┌─────────────────────────────────────────────────────────────┐
│                    DEVELOPMENT LOOP                          │
└─────────────────────────────────────────────────────────────┘

START: Basic Oscillator
  │
  ├─→ Validate ✓
  ├─→ Compile ✓
  ├─→ Execute → Listen
  │
  ▼
ADD: Frequency Slider
  │
  ├─→ Validate ✓
  ├─→ Analyze Structure → See parameter
  ├─→ Compile ✓
  ├─→ Execute (multiple frequencies) → Listen
  │
  ▼
ADD: Envelope (ADSR)
  │
  ├─→ Validate ✓
  ├─→ Analyze Structure → See 4 new parameters
  ├─→ Compile ✓
  ├─→ Execute (gate on/off) → Listen
  │
  ▼
ADD: Reverb Effect
  │
  ├─→ Get Library Docs → Find reverb function
  ├─→ Validate ✓
  ├─→ Analyze Structure → See reverb parameters
  ├─→ Compile ✓
  ├─→ Profile Performance → Check CPU usage
  ├─→ Execute → Listen
  │
  ▼
REFINE: Adjust Parameters
  │
  ├─→ Execute (different values)
  ├─→ Analyze Output (dB level, peak)
  ├─→ Optimize if needed
  │
  ▼
FINAL: Ready for Use
```

---

### Workflow 3: Debug & Troubleshoot

```
ERROR OCCURS
    │
    ▼
┌─────────────────┐
│ What type?      │
└────┬────────────┘
     │
   ┌─┼─────────────────────────┐
   │ │                         │
Syntax  Semantic           Dimension
   │       │                  │
   ▼       ▼                  ▼
Grammar  Undefined        I/O Mismatch
error    symbol           (Box Algebra)
   │       │                  │
   └──┬────┴─────┬────────────┘
      │          │
      ▼          ▼
  Claude asks for full code
      │
      ▼
  Use faust/debug-error
      │
      ▼
  ┌─────────────────────┐
  │ Claude explains:    │
  │ - Diagnosis        │
  │ - Root cause       │
  │ - Suggested fixes  │
  │ - Examples         │
  └────────┬───────────┘
           │
           ▼
  ┌────────────────────┐
  │ Claude updates     │
  │ the code           │
  └────────┬───────────┘
           │
           ▼
  Validate & Retry
           │
           ▼
  Success? → DONE
```

---

### Workflow 4: Library Exploration

```
┌──────────────────────────────┐
│ I want to use a function...  │
│ "How do I create filters?"   │
└──────────────┬───────────────┘
               │
               ▼
        ┌────────────────────┐
        │ Claude asks for    │
        │ which library type │
        │ you want           │
        └────────┬───────────┘
                 │
            ┌────┴─────────┬────────────┐
            │              │            │
        Filters        Effects      Oscillators
            │              │            │
            ▼              ▼            ▼
  faust/get-library-docs (search term)
            │              │            │
            ▼              ▼            ▼
  Returns available functions with:
  - Function signatures
  - Descriptions
  - Parameters
  - Examples
            │
            ▼
  Claude generates code using
  recommended functions
            │
            ▼
  Validate & Test
            │
            ▼
  Works! → Document & Use
```

---

## Tool Invocation Map

```
Code Input
    │
    ├─────────────────┬──────────────┬──────────────┐
    │                 │              │              │
    ▼                 ▼              ▼              ▼
faust/          faust/           faust/        faust/get-
validate-       analyze-         compile       library-
syntax          structure                      docs

Quick check   Understand      Generate        Find
(2-5ms)       structure       executable      reference
              (5-10ms)        (1-10s)        (<1s)
              │
              Returns:       Returns:       Returns:
              - I/O counts   - Binary/     - Function
              - Parameters   - Errors      - Docs
              - Imports      - Warnings    - Examples
              │              │             │
              │              ├─→ Success?  │
              │              │    ├─ Yes   │
              │              │    │        │
              └──────────────┴────┼────────┘
                                 │
                                 ▼
                          faust/execute
                             (5-30s)

                          Returns:
                          - Audio file
                          - Peak level
                          - RMS level
                          - Analysis
```

---

## Parameter Passing Flow

```
User Instruction
    │
    ▼
┌──────────────────────┐
│ Claude parses:       │
│ - Frequency: 1000 Hz │
│ - Gain: -6 dB        │
│ - Reverb: 0.5        │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────────────┐
│ Claude calls faust/execute   │
│ with parameters:             │
│ {                            │
│   "Frequency": 1000,         │
│   "Gain": -6,                │
│   "Reverb Size": 0.5         │
│ }                            │
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
│ MCP Server:                  │
│ - Maps params to Faust vars  │
│ - Injects into code          │
│ - Compiles with values       │
│ - Executes                   │
└──────────┬───────────────────┘
           │
           ▼
    Audio Output
    (unique_name.wav)
```

---

## Error Classification Tree

```
                    ERROR
                      │
         ┌────────────┼────────────┐
         │            │            │
     SYNTAX       SEMANTIC     DIMENSION
         │            │            │
    ┌────┴─────┐  ┌────┴──────┐  │
    │           │  │           │  │
 Grammar    Malformed Undefined Box
 Error      Operator  Symbol    Algebra
            │            │         │
  Missing   Type         Import    I/O
  Semicolon Mismatch    Error      Count
            │            │         Mismatch
  Unclosed  Scope        Library   │
  Paren     Error        Not Found │
            │                      │
  Invalid   Function              Sequential
  Operator  Not Found    Mismatch  Mismatch
                                  (: vs :>)
```

---

## State Diagram: Code Development

```
┌─────────────────────────────────────────────────────────┐
│              DEVELOPMENT STATE MACHINE                   │
└─────────────────────────────────────────────────────────┘

    START
      │
      ▼
  ┌───────────┐
  │  WRITING  │─────────→ Draft code in editor
  └─────┬─────┘
        │
        ▼
  ┌──────────────┐
  │  VALIDATING  │───────→ faust/validate-syntax
  │              │         Check grammar
  └─────┬────────┘
        │
    Has errors?
        │
    ┌───┴────┐
    │        │
   No      Yes
    │        │
    │        ▼
    │    ┌──────────────┐
    │    │   DEBUGGING  │──→ faust/debug-error
    │    │              │    Get help from Claude
    │    └────┬─────────┘
    │         │
    │         └──→ WRITING (fix code)
    │
    ▼
┌──────────────┐
│  ANALYZING   │───────→ faust/analyze-structure
└────┬─────────┘
     │
     ▼
┌───────────────┐
│  COMPILING    │───────→ faust/compile
└────┬──────────┘
     │
  Success?
     │
  ┌──┴────┐
  │       │
 No     Yes
  │       │
  │       ▼
  │   ┌──────────────┐
  │   │  EXECUTING   │──→ faust/execute
  │   │              │    Listen to audio
  │   └────┬─────────┘
  │        │
  │        ▼
  │   ┌──────────────┐
  │   │  PROFILING   │──→ faust/performance-profile
  │   │ (optional)   │    Check CPU usage
  │   └────┬─────────┘
  │        │
  │        ▼
  │   ┌──────────────┐
  │   │  REFINING    │──→ Ask Claude to optimize
  │   │              │    or add features
  │   └────┬─────────┘
  │        │
  │        └──→ WRITING (improvements)
  │
  ▼ (from DEBUGGING)
(back to VALIDATING)
```

---

## Tool Call Sequence Diagram

```
Claude                    MCP Server            Faust
  │                            │                  │
  ├─ faust/validate-syntax ───→│                  │
  │   {code: "..."}            ├─ Tokenize ──────→│
  │                            │                  │
  │                            │ ←─ Tokens ───────┤
  │                            ├─ Parse          │
  │                            │                  │
  │ ←─ {valid: true} ──────────┤                  │
  │                                               │
  ├─ faust/analyze-structure ─→│                  │
  │   {code: "..."}            ├─ Analyze ──────→│
  │                            │                  │
  │ ←─ {processes: [...]} ─────┤                  │
  │                                               │
  ├─ faust/compile ───────────→│                  │
  │   {code: "...", target}    ├─ Compile ──────→│
  │                            │                  │
  │                            │ ←─ Binary ──────┤
  │ ←─ {success: true} ────────┤                  │
  │                                               │
  ├─ faust/execute ───────────→│                  │
  │   {code: "...", params}    ├─ Run audio ────→│
  │                            │  (with params)  │
  │                            │                  │
  │                            │ ←─ WAV data ────┤
  │ ←─ {audio_output: path} ───┤                  │
  │                                               │
  └─ Listen to output audio
```

---

## MCP Response Format Flow

```
Client Request
  │
  ▼
┌──────────────────────┐
│ Parse Parameters     │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│ Call Tool Handler    │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐     ┌──────────────┐
│ Execute Tool         │────→│ Success?     │
└────────┬─────────────┘     └───┬──────────┘
         │                        │
         │                    ┌───┴───┐
         │                    │       │
         │                   Yes     No
         │                    │       │
         ▼                    ▼       ▼
┌──────────────────────┐  ┌────────────────┐
│ Format Response:     │  │ Format Error:   │
│ {                   │  │ {               │
│   "success": true,  │  │   "error": {    │
│   "data": {...}     │  │     "code":..., │
│ }                   │  │     "message":..│
└──────────┬─────────┘  │ }                │
           │            └────────┬────────┘
           │                     │
           └──────┬──────────────┘
                  │
                  ▼
         Return JSON Response
                  │
                  ▼
           Claude Receives
```

---

## Performance Monitoring Loop

```
Code → Compile → Execute → Measure
                               │
                               ▼
                        ┌────────────────┐
                        │ Is CPU < 50%?  │
                        └────┬───────────┘
                             │
                         ┌───┴────┐
                         │        │
                        No      Yes
                         │        │
                         ▼        ▼
                      ┌────┐   ✓ Good
                      │Try │     │
                      │to  │     │
                      │Opt │────→│ DONE
                      │    │
                      └────┘
```

---

## Quick Decision Tree

```
"I want to..."

    │
    ├─ "...create a sine wave"
    │  → Use os.osc(freq)
    │
    ├─ "...add controls"
    │  → Use hslider, vslider, button
    │
    ├─ "...chain effects"
    │  → Use : (sequential) operator
    │
    ├─ "...understand an error"
    │  → Ask Claude "What does this error mean?"
    │  → Claude uses faust/debug-error
    │
    ├─ "...check if code is valid"
    │  → Use faust/validate-syntax
    │
    ├─ "...listen to output"
    │  → Use faust/execute
    │
    ├─ "...find library functions"
    │  → Ask Claude "How do I use reverb?"
    │  → Claude uses faust/get-library-docs
    │
    └─ "...check performance"
       → Ask Claude "What's the CPU usage?"
       → Claude uses faust/performance-profile
```

---

## Resource Usage Visualization

```
MEMORY
┌──────────────────────────────────┐
│ Code Storage:           ~ 10 KB  │
│ AST Tree:               ~ 5 KB   │
│ Symbol Table:           ~ 2 KB   │
│ Execution Context:      ~ 50 KB  │
│ Audio Buffer (1s@44.1k): ~176 KB │
│                        ─────────── │
│ Total Typical:         ~250 KB   │
│                                  │
│ Large program could reach: 1 MB  │
└──────────────────────────────────┘

TIME (per operation, at 44.1 kHz)
┌──────────────────────────────────┐
│ validate-syntax:    2-5 ms        │
│ analyze-structure:  5-10 ms       │
│ compile (simple):   1-2 seconds   │
│ compile (complex):  5-10 seconds  │
│ execute (1 sec):    ~1 second     │
│ execute (10 sec):   ~10 seconds   │
│ performance-profile: 10-20 sec    │
└──────────────────────────────────┘
```

---

## Typical Session Flow

```
TIME PROGRESSES →

User: "Create oscillator"
         │
         ▼
Claude writes code        [ Write ]
         │
         ▼
Claude validates it       [ validate-syntax ]  ~5ms
         │
         ▼
Claude analyzes structure [ analyze-structure ] ~10ms
         │
         ▼
Claude compiles it        [ compile ]          ~2s
         │
         ▼
Claude executes it        [ execute ]          ~1s
         │
         ▼
User listens to audio
         │
User: "Add frequency slider"
         │
         ▼
Claude updates code       [ Write ]
         │
         ▼
Claude validates it       [ validate-syntax ]  ~5ms
         │
         ▼
Claude compiles & tests   [ compile, execute ] ~3s
         │
         ▼
User: "Add reverb"
         │
         ▼
Claude looks up docs      [ get-library-docs ] <1s
         │
         ▼
Claude updates code
         │
         ▼
Claude profiles perf      [ performance-profile ] ~15s
         │
         ▼
Claude executes           [ execute ]          ~1s
         │
         ▼
User: "Sounds good!"
         │
         ▼
Done
```

---

## Troubleshooting Decision Tree

```
Something wrong?
       │
       ├─ Code won't compile
       │  │
       │  └─ Use faust/debug-error
       │     └─ Ask Claude to explain
       │        └─ Fix suggested code
       │
       ├─ Output is silent
       │  │
       │  ├─ Check: Is there a * 0?
       │  ├─ Check: Are parameters set?
       │  └─ Ask Claude for troubleshooting
       │
       ├─ Sounds wrong
       │  │
       │  ├─ Simplify code
       │  ├─ Check individual components
       │  └─ Ask Claude "Why does this sound like...?"
       │
       ├─ Too slow / CPU too high
       │  │
       │  ├─ Use faust/performance-profile
       │  ├─ Claude suggests optimizations
       │  └─ Try lower sample rate or buffer size
       │
       └─ Can't understand error
          │
          └─ Ask Claude: "What does this error mean?"
             └─ Claude uses faust/debug-error
```

---

**Version**: 1.0 | **Updated**: 2025-12-11 | **Maintained by**: bookkeeper
