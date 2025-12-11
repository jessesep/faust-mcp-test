# Faust Syntax Analyzer & Linter Implementation Guide

**Design, architecture, and implementation strategy for the Faust syntax analyzer tool**

**Version**: 1.0 | **Status**: Design Document | **Updated**: 2025-12-11

---

## Overview

The Faust Syntax Analyzer is a P1-HIGH MCP tool that provides:
- **Syntax Validation**: Check Faust code for grammar violations
- **Error Detection**: Identify semantic errors before compilation
- **Code Analysis**: Understand structure without full compilation
- **Fix Suggestions**: Provide actionable corrections for errors
- **Pattern Recognition**: Identify code patterns and styles

**MCP Tool Mapping**:
- `faust/validate-syntax` - Core validation
- `faust/analyze-structure` - Code structure analysis
- `faust/debug-error` - Error explanation and fixes

---

## Architecture

### Component Diagram

```
┌─────────────────────────────────────────────────┐
│         MCP Client (Claude Code)                 │
└────────────────────┬────────────────────────────┘
                     │ (JSON-RPC)
                     ↓
┌─────────────────────────────────────────────────┐
│      Syntax Analyzer MCP Tool Handler            │
│  ┌──────────────────────────────────────────┐   │
│  │  Request Router (validate/analyze/debug) │   │
│  └─────────────────────┬────────────────────┘   │
│                        │                         │
│  ┌─────────────────────┼────────────────────┐   │
│  │                     │                    │   │
│  ↓                     ↓                    ↓   │
│ ┌─────────┐  ┌──────────────┐  ┌─────────────┐ │
│ │Validator│  │ StructAnalyzer
 │ │Debugger │ │
│ └────┬────┘  └────────┬──────┘  └──────┬──────┘ │
│      │                │                 │      │
│  ┌───┴────────────────┼─────────────────┴──┐   │
│  │   Lexer/Tokenizer  │                    │   │
│  │   (Faust Grammar)  │                    │   │
│  └────────────────────┼────────────────────┘   │
│                       │                         │
│  ┌────────────────────┼────────────────────┐   │
│  │    Error Database  │                    │   │
│  │    & Patterns      │                    │   │
│  └────────────────────┴────────────────────┘   │
└─────────────────────────────────────────────────┘
                       │
                       ↓
                ┌──────────────┐
                │ Faust Compiler
                │  (for validation)
                └──────────────┘
```

### Core Components

#### 1. Tokenizer/Lexer

**Responsibility**: Break Faust code into tokens

**Tokens to Identify**:
- Keywords: `import`, `process`, `with`, `let`, `seq`, etc.
- Identifiers: Function names, variable names
- Operators: `:`, `,`, `~`, `<:`, `:>`, `+`, `-`, `*`, `/`
- Literals: Numbers, strings
- Punctuation: `(`, `)`, `;`, `=`

**Implementation**:
```python
class Token:
    def __init__(self, type, value, line, column):
        self.type = type      # 'KEYWORD', 'IDENT', 'OPERATOR', etc.
        self.value = value    # The actual text
        self.line = line      # Line number (1-indexed)
        self.column = column  # Column number (1-indexed)

class Tokenizer:
    def tokenize(self, code):
        """Convert code string into list of tokens"""
        tokens = []
        # Implementation: scan code character by character
        # Identify token type and create Token objects
        return tokens
```

#### 2. Parser

**Responsibility**: Build abstract syntax tree (AST) from tokens

**Grammar Structure**:
```
program    → (import_stmt)* process_def
import_stmt → 'import' '(' STRING ')' ';'
process_def → 'process' '=' expression ';'
expression  → composition | primitive
composition → expression ':' expression |
              expression ',' expression |
              expression '~' expression |
              expression '<:' expression |
              expression ':>' expression
primitive   → identifier | function_call | number | '(' expression ')'
```

**Implementation**:
```python
class ASTNode:
    pass

class Expression(ASTNode):
    def __init__(self, operator, left, right):
        self.operator = operator  # ':', ',', '~', etc.
        self.left = left
        self.right = right

class FunctionCall(ASTNode):
    def __init__(self, name, args):
        self.name = name
        self.args = args

class Parser:
    def parse(self, tokens):
        """Build AST from tokens"""
        # Recursive descent parsing
        return self.parse_program(tokens)
```

#### 3. Validator

**Responsibility**: Check syntax and semantic correctness

**Validation Rules**:
1. **Syntax**: Tokens must follow Faust grammar
2. **Symbols**: All referenced symbols must be defined
3. **Imports**: Required libraries must be available
4. **Dimensions**: I/O counts must match in connections
5. **Scoping**: Variables must be used in correct scope

**Implementation**:
```python
class Validator:
    def __init__(self):
        self.errors = []
        self.warnings = []
        self.symbols = {}  # Symbol table

    def validate(self, ast):
        """Traverse AST and check all rules"""
        self.check_imports(ast)
        self.check_symbols(ast)
        self.check_dimensions(ast)
        return {
            'valid': len(self.errors) == 0,
            'errors': self.errors,
            'warnings': self.warnings
        }

    def check_symbols(self, node):
        """Ensure all referenced symbols are defined"""
        if isinstance(node, IdentifierNode):
            if node.name not in self.symbols:
                self.errors.append({
                    'type': 'UNDEFINED_SYMBOL',
                    'message': f"Undefined symbol: {node.name}",
                    'line': node.line,
                    'column': node.column
                })
```

#### 4. Structure Analyzer

**Responsibility**: Analyze code structure without full compilation

**Analysis Results**:
- Process definitions and their I/O counts
- Parameter definitions and ranges
- Imported libraries
- Function calls and references
- UI elements (sliders, buttons, etc.)

**Implementation**:
```python
class StructureAnalyzer:
    def analyze(self, code):
        """Analyze structure without compilation"""
        ast = self.parse(code)
        return {
            'processes': self.extract_processes(ast),
            'parameters': self.extract_parameters(ast),
            'imports': self.extract_imports(ast),
            'functions': self.extract_functions(ast)
        }

    def extract_processes(self, ast):
        """Find all process definitions"""
        processes = []
        for node in ast:
            if isinstance(node, ProcessDef):
                processes.append({
                    'name': node.name,
                    'inputs': self.count_inputs(node),
                    'outputs': self.count_outputs(node),
                    'parameters': self.extract_ui_params(node)
                })
        return processes
```

#### 5. Error Database

**Responsibility**: Store and provide error information

**Structure**:
```python
ERROR_DATABASE = {
    'SYNTAX_ERROR': {
        'category': 'Syntax',
        'description': 'Code violates Faust grammar',
        'recovery': 'Check parentheses, semicolons, operator usage',
        'examples': [
            {
                'error': 'syntax error, unexpected IDENT',
                'cause': 'Missing semicolon or comma',
                'fix': 'Add ; or , between statements'
            }
        ]
    },
    'UNDEFINED_SYMBOL': {
        'category': 'Semantic',
        'description': 'Reference to undefined variable or function',
        'recovery': 'Ensure import statements present, variable defined',
        'examples': [
            {
                'error': 'undefined symbol: foo',
                'cause': 'Variable foo not in scope',
                'fix': 'Define foo or import library containing foo'
            }
        ]
    },
    # ... more error types
}
```

---

## Error Classification System

### Error Categories

#### 1. Syntax Errors
```
Missing semicolons
Malformed operators
Unclosed parentheses
Invalid keywords
```

#### 2. Semantic Errors
```
Undefined symbols
Type mismatches
Dimension mismatches (I/O)
Invalid operators for operands
```

#### 3. Scope Errors
```
Variable out of scope
Duplicate definitions
Library not imported
```

#### 4. Dimension Errors (Box Algebra)
```
Sequential composition mismatch (: operator)
Split/merge operator mismatches
Recursive composition constraints
```

#### 5. Library Errors
```
Library not found
Function not in library
Wrong number of arguments
```

### Error Severity Levels

| Level | Meaning | Action |
|-------|---------|--------|
| **ERROR** | Code cannot compile or run | Must fix before proceeding |
| **WARNING** | Code may compile but likely wrong | Should fix for clarity/performance |
| **INFO** | Informational message | No action required |

---

## Implementation Strategy

### Phase 1: Basic Tokenizer & Parser

**Timeline**: Foundation layer

**Deliverables**:
- Tokenizer that recognizes all Faust tokens
- Simple recursive-descent parser
- Basic AST structure
- Unit tests for tokenization

**Complexity**: Medium
**Dependencies**: None

### Phase 2: Syntax Validation

**Timeline**: Core validation

**Deliverables**:
- Grammar rule checker
- Error message generation
- Line/column tracking
- Basic error recovery suggestions

**Complexity**: Medium
**Dependencies**: Phase 1

### Phase 3: Semantic Analysis

**Timeline**: Symbol tracking and scoping

**Deliverables**:
- Symbol table management
- Import resolution
- Scope tracking
- Undefined symbol detection

**Complexity**: High
**Dependencies**: Phases 1-2

### Phase 4: Dimension Analysis

**Timeline**: Box algebra validation

**Deliverables**:
- I/O count calculation
- Connection rule validation
- Dimension mismatch detection
- Helpful error messages for dimension errors

**Complexity**: High
**Dependencies**: Phases 1-3

### Phase 5: Structure Analysis

**Timeline**: Non-compilation analysis

**Deliverables**:
- Process extraction
- Parameter detection
- UI element identification
- Export to MCP response format

**Complexity**: Medium
**Dependencies**: Phases 1-4

### Phase 6: Debug & Error Assistance

**Timeline**: User-friendly error help

**Deliverables**:
- Error explanation database
- Suggested fixes
- Code examples for common errors
- Links to documentation

**Complexity**: Low
**Dependencies**: Phase 2+

---

## MCP Tool Implementation

### Tool: `faust/validate-syntax`

```python
def validate_syntax(code, imports=[]):
    """
    Validate Faust code syntax

    Args:
        code: Faust source code string
        imports: Additional library paths

    Returns:
        {
            'valid': bool,
            'errors': [
                {
                    'line': int,
                    'column': int,
                    'message': str,
                    'type': str
                }
            ],
            'warnings': [...]
        }
    """
    tokenizer = Tokenizer(code)
    tokens = tokenizer.tokenize()

    parser = Parser(tokens)
    try:
        ast = parser.parse()
    except ParseError as e:
        return {
            'valid': False,
            'errors': [e.to_dict()],
            'warnings': []
        }

    validator = Validator(imports)
    result = validator.validate(ast)

    return result
```

### Tool: `faust/analyze-structure`

```python
def analyze_structure(code, detail_level='detailed'):
    """
    Analyze Faust code structure without compilation

    Args:
        code: Faust source code
        detail_level: 'basic', 'detailed', or 'full'

    Returns:
        {
            'processes': [...],
            'parameters': [...],
            'imports': [...],
            'io_summary': {...}
        }
    """
    analyzer = StructureAnalyzer(detail_level)
    return analyzer.analyze(code)
```

### Tool: `faust/debug-error`

```python
def debug_error(error_message, code=None, error_type=None):
    """
    Provide detailed error explanation and suggestions

    Args:
        error_message: Error message from compiler
        code: Full source code (for context)
        error_type: Classified error type

    Returns:
        {
            'diagnosis': str,
            'root_cause': str,
            'suggested_fixes': [...],
            'reference_docs': [...]
        }
    """
    debugger = ErrorDebugger(ERROR_DATABASE)
    return debugger.debug(error_message, code, error_type)
```

---

## Error Detection Examples

### Example 1: Undefined Symbol

**Code**:
```faust
process = os.osc(freq);
```

**Detection**:
```
Token: os (IDENT)
Symbol Table: os not found
Check imports: "stdfaust.lib" not imported
Error: UNDEFINED_SYMBOL
```

**Diagnostic**:
```
diagnosis: "os.osc is part of the Faust standard library"
root_cause: "Missing import statement"
fix: "Add: import(\"stdfaust.lib\");"
```

### Example 2: Dimension Mismatch

**Code**:
```faust
process = (sin(1000), cos(1000)) : +;
```

**Detection**:
```
Parse: (sin(1000), cos(1000)) produces 2 outputs
       + expects 1 input
Dimension mismatch: 2 ≠ 1
Error: BOX_DIMENSION_ERROR
```

**Diagnostic**:
```
diagnosis: "Sequential composition (:) requires same I/O count"
root_cause: "Trying to add two signals without merging first"
fix: "Use :> (merge) or handle separately: ... :> +"
```

### Example 3: Syntax Error

**Code**:
```faust
process = os.osc(440)
ba.time;
```

**Detection**:
```
Line 1: Missing semicolon before 'ba'
Unexpected token: ba (IDENT) after os.osc(440)
Error: SYNTAX_ERROR
```

**Diagnostic**:
```
diagnosis: "Missing semicolon or connector operator"
fix: "Add , or : between statements"
```

---

## Testing Strategy

### Unit Tests

**Tokenizer Tests**:
```python
def test_tokenize_simple():
    code = "process = os.osc(440);"
    tokens = Tokenizer(code).tokenize()
    assert tokens[0].type == 'KEYWORD'
    assert tokens[0].value == 'process'

def test_tokenize_operators():
    code = "a : b , c ~ d <: e :> f"
    tokens = Tokenizer(code).tokenize()
    assert tokens[1].value == ':'
    assert tokens[3].value == ','
    # ... etc
```

**Parser Tests**:
```python
def test_parse_simple_process():
    code = "process = os.osc(440);"
    ast = Parser(code).parse()
    assert ast.process_def is not None
    assert ast.process_def.expression.function.name == 'os.osc'

def test_parse_composition():
    code = "process = a : b , c;"
    ast = Parser(code).parse()
    assert ast.process_def.expression.operator in [':', ',']
```

**Validator Tests**:
```python
def test_undefined_symbol():
    code = "process = undefined_func(1);"
    result = Validator().validate(code)
    assert not result['valid']
    assert result['errors'][0]['type'] == 'UNDEFINED_SYMBOL'

def test_dimension_mismatch():
    code = "import(\"stdfaust.lib\"); process = (os.osc(1), os.osc(2)) : +;"
    result = Validator().validate(code)
    assert not result['valid']
    assert 'dimension' in result['errors'][0]['message'].lower()
```

### Integration Tests

```python
def test_full_validation_workflow():
    code = """
    import("stdfaust.lib");
    process = hgroup("Synth", osc_section)
      with { osc_section = os.osc(freq)
             with { freq = hslider("Freq", 440, 20, 5000, 1); }; };
    """
    result = validate_syntax(code)
    assert result['valid'] == True

    struct = analyze_structure(code)
    assert len(struct['processes']) == 1
    assert struct['processes'][0]['outputs'] == 1
```

---

## Performance Considerations

### Optimization Points

1. **Caching**: Cache parse results for repeated code
2. **Incremental Analysis**: Re-analyze only changed sections
3. **Parallel Processing**: Tokenize and validate in parallel for large files
4. **Memory**: Use streaming for very large files

### Performance Targets

| Operation | Target Time | Max Size |
|-----------|------------|----------|
| Tokenize | <10ms | 1MB |
| Parse | <50ms | 500KB |
| Validate | <100ms | 500KB |
| Analyze | <50ms | 500KB |

---

## Failure Cases & Recovery

### Case 1: Malformed Code

**Scenario**: Code with unclosed parenthesis

**Handling**:
```
1. Tokenizer identifies unclosed '('
2. Parser attempts to recover
3. Report error with line/column
4. Suggest: "Add closing parenthesis"
```

### Case 2: Missing Library

**Scenario**: Import of non-existent library

**Handling**:
```
1. Validator checks library availability
2. Report: "Library not found: custom.lib"
3. Suggest: "Use standard libraries or check path"
```

### Case 3: Complex Recursive Definition

**Scenario**: Code with complex feedback loop

**Handling**:
```
1. Parser handles recursion syntax
2. Validator checks dimensional constraints
3. Report warning if questionable
```

---

## Future Enhancements

1. **Code Suggestions**: Recommend refactoring or optimization
2. **Type System**: Formal type checking (blocks, numbers)
3. **Visual Diagrams**: Generate block diagrams from code
4. **Auto-fix**: Automatically fix common errors
5. **Pattern Detection**: Identify common DSP patterns
6. **Optimization Hints**: Suggest performance improvements

---

## References

- Faust Documentation: https://faust.grame.fr/
- Box Algebra: https://faust.grame.fr/doc/manual/index.html#box-algebra
- Faust Error Messages: See `faust-error-research.md`
- MCP Specification: See `MCP-SPECIFICATION.md`

---

**Version**: 1.0 | **Status**: Design Document | **Updated**: 2025-12-11 | **Maintained by**: bookkeeper
