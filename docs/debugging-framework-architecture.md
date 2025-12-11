# Faust Debugging Framework Architecture

**Version:** 1.0
**Date:** 2025-12-11
**Author:** builder
**Task:** faust-debugging-framework-001

---

## Overview

The Faust Debugging Framework provides comprehensive error diagnosis, output interpretation, and troubleshooting capabilities for Faust DSP code. This framework enables Claude to understand, diagnose, and help fix Faust errors effectively.

---

## Architecture Components

### 1. Error Pattern Database

**Purpose:** Central repository of known Faust error patterns with solutions

**Structure:**
```
error-patterns/
├── syntax-errors.json          # Syntax and parsing errors
├── type-errors.json            # Type system violations
├── signal-errors.json          # Signal processing errors
├── composition-errors.json     # Box connection errors
└── compilation-errors.json     # Backend compilation issues
```

**Error Pattern Schema:**
```json
{
  "error_id": "unique-error-identifier",
  "category": "syntax|type|signal|composition|compilation",
  "pattern": "regex pattern for error message",
  "description": "Human-readable error description",
  "common_causes": ["cause1", "cause2"],
  "symptoms": ["what the user sees"],
  "diagnosis_steps": ["step1", "step2"],
  "solutions": [
    {
      "approach": "solution description",
      "code_before": "incorrect code example",
      "code_after": "corrected code example",
      "explanation": "why this works"
    }
  ],
  "related_errors": ["other-error-ids"],
  "severity": "error|warning|info",
  "beginner_friendly": true|false
}
```

---

### 2. Error Diagnosis Engine

**Purpose:** Analyze error messages and provide actionable diagnostics

**Components:**

#### 2.1 Error Parser
- Extracts error information from Faust compiler output
- Identifies file location, line number, error type
- Normalizes error messages for pattern matching

#### 2.2 Pattern Matcher
- Matches error messages against error pattern database
- Fuzzy matching for variations in error messages
- Confidence scoring for matches

#### 2.3 Context Analyzer
- Reads source code around error location
- Analyzes surrounding code structure
- Identifies relevant Faust constructs

#### 2.4 Solution Suggester
- Ranks solutions by likelihood
- Provides code examples
- Explains why each solution might work

**Files:**
```
tools/
├── error-parser.js          # Parse compiler output
├── pattern-matcher.js       # Match against database
├── context-analyzer.js      # Code context analysis
└── solution-suggester.js    # Generate fix suggestions
```

---

### 3. Common Issues Guide

**Purpose:** Curated knowledge base of frequent Faust problems

**Structure:**
```
guides/
├── beginner-mistakes.md          # Common beginner errors
├── signal-processing-issues.md   # DSP-specific problems
├── composition-patterns.md       # Box algebra issues
├── performance-problems.md       # Efficiency concerns
└── backend-compatibility.md      # Target platform issues
```

**Each Guide Contains:**
- Problem description
- How to recognize it
- Why it happens
- Step-by-step fix
- Prevention tips
- Related topics

---

### 4. Debugging Techniques Documentation

**Purpose:** Teach effective Faust debugging strategies

**Structure:**
```
techniques/
├── modular-testing.md           # Break code into testable parts
├── signal-inspection.md         # Techniques for examining signals
├── block-diagrams.md            # Visual debugging with diagrams
├── compiler-flags.md            # Using debug flags effectively
├── incremental-development.md   # Build iteratively
└── error-isolation.md           # Systematic narrowing
```

---

### 5. Interactive Diagnostic Tool (CLI)

**Purpose:** Command-line tool for interactive debugging

**Features:**
- Parse Faust error output
- Identify error patterns
- Display relevant documentation
- Suggest fixes with code examples
- Link to detailed guides

**Usage:**
```bash
# Basic usage
faust-debug error.log

# With source file context
faust-debug error.log --source myfile.dsp

# Interactive mode
faust-debug --interactive

# Export diagnostics
faust-debug error.log --output report.md
```

**Files:**
```
cli/
├── faust-debug.js       # Main CLI entry point
├── commands/
│   ├── analyze.js       # Analyze error logs
│   ├── explain.js       # Explain error patterns
│   ├── suggest.js       # Suggest solutions
│   └── guide.js         # Show relevant guide sections
└── formatters/
    ├── markdown.js      # Markdown output
    ├── terminal.js      # Pretty terminal output
    └── json.js          # JSON structured output
```

---

### 6. MCP Integration Layer

**Purpose:** Expose debugging capabilities through MCP protocol

**MCP Tools:**

#### 6.1 `diagnose_faust_error`
**Input:**
- `error_message`: Faust compiler error output
- `source_code`: Optional Faust source code
- `context_lines`: Number of lines around error (default: 5)

**Output:**
- Parsed error information
- Matched error patterns
- Suggested solutions with examples
- Relevant documentation links

#### 6.2 `explain_faust_concept`
**Input:**
- `concept`: Faust concept name (e.g., "recursive composition", "causality")
- `context`: Optional code example

**Output:**
- Concept explanation
- Common mistakes
- Correct usage examples
- Related concepts

#### 6.3 `get_debugging_guide`
**Input:**
- `topic`: Guide topic (e.g., "beginner-mistakes", "signal-processing")
- `subtopic`: Optional specific subtopic

**Output:**
- Formatted guide content
- Code examples
- Related guides

#### 6.4 `validate_faust_code`
**Input:**
- `code`: Faust source code
- `check_level`: "syntax|semantic|performance"

**Output:**
- Validation results
- Detected issues
- Suggestions for improvements

**Files:**
```
mcp/
├── tools/
│   ├── diagnose-error.js
│   ├── explain-concept.js
│   ├── get-guide.js
│   └── validate-code.js
└── server.js                 # MCP server implementation
```

---

## Data Flow

### Error Diagnosis Flow

```
1. User encounters Faust error
   ↓
2. Error output captured
   ↓
3. Error Parser extracts structured info
   ↓
4. Pattern Matcher finds matching patterns
   ↓
5. Context Analyzer reads source code
   ↓
6. Solution Suggester ranks fixes
   ↓
7. Results formatted and returned
```

### Interactive Debugging Flow

```
1. User invokes faust-debug CLI
   ↓
2. CLI loads error log or accepts input
   ↓
3. Displays parsed error information
   ↓
4. Shows matched patterns with confidence
   ↓
5. Presents solutions in priority order
   ↓
6. Links to detailed guides
   ↓
7. User selects action (explain, suggest, guide)
```

---

## Implementation Phases

### Phase 1: Foundation (Current)
- [x] Research Faust errors and debugging patterns
- [ ] Create error pattern database schema
- [ ] Build initial error patterns (top 20 errors)
- [ ] Write common issues guide
- [ ] Document core debugging techniques

### Phase 2: Tooling
- [ ] Implement error parser
- [ ] Build pattern matcher
- [ ] Create context analyzer
- [ ] Develop solution suggester
- [ ] Build CLI tool

### Phase 3: MCP Integration
- [ ] Design MCP tool interfaces
- [ ] Implement MCP tools
- [ ] Test with sample errors
- [ ] Document MCP usage

### Phase 4: Enhancement
- [ ] Expand error pattern database
- [ ] Add performance debugging
- [ ] Backend-specific guides
- [ ] Advanced debugging techniques
- [ ] Integration with testing framework

---

## Dependencies

### Current Dependencies
- **faust-code-testing-framework-001**: Testing framework for validation (pending)
- Faust compiler (system dependency)
- Node.js runtime for tools

### Future Dependencies
- faust-compiler-integration-001: For live compilation testing
- faust-syntax-analyzer-001: For deeper code analysis

---

## Success Metrics

### Framework Completeness
- ✅ Error pattern coverage: ≥ 80% of common errors
- ✅ Guide comprehensiveness: All major error categories documented
- ✅ Tool functionality: All MCP tools working
- ✅ Response accuracy: ≥ 90% correct diagnoses

### User Experience
- Error diagnosis time: < 5 seconds
- Solution relevance: ≥ 85% helpful
- Documentation clarity: Beginner-friendly
- Integration seamless: Works with existing tools

---

## File Structure Summary

```
faust-mcp/
├── docs/
│   ├── faust-error-research.md              # ✓ Complete
│   ├── debugging-framework-architecture.md  # ✓ This file
│   ├── guides/
│   │   ├── beginner-mistakes.md
│   │   ├── signal-processing-issues.md
│   │   ├── composition-patterns.md
│   │   ├── performance-problems.md
│   │   └── backend-compatibility.md
│   └── techniques/
│       ├── modular-testing.md
│       ├── signal-inspection.md
│       ├── block-diagrams.md
│       ├── compiler-flags.md
│       ├── incremental-development.md
│       └── error-isolation.md
├── data/
│   └── error-patterns/
│       ├── syntax-errors.json
│       ├── type-errors.json
│       ├── signal-errors.json
│       ├── composition-errors.json
│       └── compilation-errors.json
├── tools/
│   ├── error-parser.js
│   ├── pattern-matcher.js
│   ├── context-analyzer.js
│   └── solution-suggester.js
├── cli/
│   ├── faust-debug.js
│   ├── commands/
│   └── formatters/
└── mcp/
    ├── tools/
    └── server.js
```

---

## Next Steps

1. Create error pattern database with top 20 errors
2. Build common issues guide from research
3. Document debugging techniques
4. Implement error parser tool
5. Test with real Faust error examples

---

**Task Deliverable Progress:**
- ✅ Error diagnosis framework design: Complete
- ⏳ Output interpretation tools: In progress
- ⏳ Common issues guide: Next
- ⏳ Debugging techniques documentation: Planned
