# Faust Syntax Analyzer - Testing and Validation Guide

**Test cases, validation strategies, and quality assurance for the syntax analyzer**

**Version**: 1.0 | **Status**: QA Guidelines | **Updated**: 2025-12-11

---

## Overview

This guide provides comprehensive test cases and validation strategies for the Faust syntax analyzer tool, ensuring all error detection and analysis features work correctly.

---

## Test Categories

### 1. Tokenizer Tests

#### Basic Tokenization
```python
def test_tokenize_keywords():
    """Verify all Faust keywords are recognized"""
    test_cases = [
        ("process", "KEYWORD"),
        ("import", "KEYWORD"),
        ("with", "KEYWORD"),
        ("let", "KEYWORD"),
        ("define", "KEYWORD"),
        ("seq", "KEYWORD"),
    ]
    for code, expected_type in test_cases:
        tokens = tokenize(code)
        assert tokens[0].type == expected_type

def test_tokenize_operators():
    """Verify operator tokenization"""
    operators = [':', ',', '~', '<:', ':>', '+', '-', '*', '/', '%', '&', '|']
    for op in operators:
        tokens = tokenize(f"a {op} b")
        assert any(t.value == op for t in tokens)

def test_tokenize_numbers():
    """Verify numeric literal recognition"""
    test_cases = [
        ("440", "NUMBER"),
        ("3.14159", "NUMBER"),
        ("1e6", "NUMBER"),
        ("0xff", "HEXNUMBER"),
    ]
    for code, expected_type in test_cases:
        tokens = tokenize(code)
        assert tokens[0].type == expected_type

def test_tokenize_strings():
    """Verify string literal recognition"""
    codes = [
        '"hello"',
        '"path/to/lib"',
        '"Frequency (Hz)"',
    ]
    for code in codes:
        tokens = tokenize(code)
        assert any(t.type == "STRING" for t in tokens)

def test_tokenize_comments():
    """Verify comment removal"""
    code = "process = 440; // This is a comment"
    tokens = tokenize(code)
    assert not any("comment" in t.value.lower() for t in tokens)
```

#### Edge Cases
```python
def test_tokenize_empty_code():
    """Empty input should produce no tokens"""
    tokens = tokenize("")
    assert len(tokens) == 0

def test_tokenize_whitespace_only():
    """Whitespace only should produce no tokens"""
    tokens = tokenize("   \n\n  \t")
    assert len(tokens) == 0

def test_tokenize_multiline():
    """Verify line counting across multiple lines"""
    code = "a :\nb ;\nc"
    tokens = tokenize(code)
    assert tokens[0].line == 1  # a
    assert tokens[2].line == 2  # b
    assert tokens[4].line == 3  # c
```

### 2. Parser Tests

#### Simple Expressions
```python
def test_parse_identifier():
    """Single identifier should parse"""
    ast = parse("process = foo;")
    assert ast.process_def.expr.name == "foo"

def test_parse_function_call():
    """Function call should parse"""
    ast = parse("process = os.osc(440);")
    assert ast.process_def.expr.func_name == "os.osc"
    assert len(ast.process_def.expr.args) == 1

def test_parse_number():
    """Numeric literal should parse"""
    ast = parse("process = 440;")
    assert ast.process_def.expr.value == 440
```

#### Operators
```python
def test_parse_sequential():
    """Sequential composition : should parse"""
    ast = parse("process = a : b;")
    assert ast.process_def.expr.operator == ':'
    assert ast.process_def.expr.left.name == 'a'
    assert ast.process_def.expr.right.name == 'b'

def test_parse_parallel():
    """Parallel composition , should parse"""
    ast = parse("process = a , b , c;")
    assert ast.process_def.expr.operator == ','

def test_parse_recursive():
    """Recursive composition ~ should parse"""
    ast = parse("process = a ~ b;")
    assert ast.process_def.expr.operator == '~'

def test_parse_split_merge():
    """Split <: and merge :> should parse"""
    ast1 = parse("process = a <: b;")
    ast2 = parse("process = a :> b;")
    assert ast1.process_def.expr.operator == '<:'
    assert ast2.process_def.expr.operator == ':>'
```

#### Complex Expressions
```python
def test_parse_nested():
    """Nested expressions should parse"""
    ast = parse("process = (a : b) , (c : d);")
    assert ast.process_def.expr.operator == ','

def test_parse_with_clause():
    """'with' clause should parse"""
    ast = parse("process = a with { x = 1; };")
    assert ast.process_def.with_clause is not None
    assert 'x' in ast.process_def.with_clause

def test_parse_import():
    """Import statement should parse"""
    ast = parse('import("stdfaust.lib");')
    assert len(ast.imports) == 1
    assert ast.imports[0] == "stdfaust.lib"
```

#### Error Recovery
```python
def test_parse_missing_semicolon():
    """Parser should detect missing semicolon"""
    result = parse("process = os.osc(440)")
    assert result['error'] is not None
    assert 'semicolon' in result['error'].lower()

def test_parse_unclosed_paren():
    """Parser should detect unclosed parenthesis"""
    result = parse("process = os.osc(440;")
    assert result['error'] is not None
    assert 'parenthesis' in result['error'].lower()
```

### 3. Validation Tests

#### Symbol Resolution
```python
def test_undefined_symbol():
    """Undefined symbol should be detected"""
    code = "process = undefined_function(440);"
    errors = validate(code)
    assert len(errors) > 0
    assert any(e['type'] == 'UNDEFINED_SYMBOL' for e in errors)

def test_defined_symbol():
    """Defined symbol should not error"""
    code = "f(x) = x + 1; process = f(440);"
    errors = validate(code)
    assert not any(e['type'] == 'UNDEFINED_SYMBOL' for e in errors)

def test_import_resolution():
    """Library imports should resolve"""
    code = 'import("stdfaust.lib"); process = os.osc(440);'
    errors = validate(code)
    assert not any('os.osc' in str(e) for e in errors)

def test_missing_import():
    """Missing import should be detected"""
    code = "process = os.osc(440);"
    errors = validate(code)
    assert any(e['type'] == 'UNDEFINED_SYMBOL' for e in errors)
```

#### Variable Scope
```python
def test_local_scope():
    """Variables in 'with' clause should be scoped"""
    code = """
    process = a : b
      with {
        x = 5;
        a = x + 1;
        b = x * 2;
      };
    """
    errors = validate(code)
    assert len(errors) == 0

def test_scope_violation():
    """Variable outside its scope should error"""
    code = """
    process = (a with { x = 5; }) + x;
    a = 1;
    """
    errors = validate(code)
    assert any('scope' in str(e).lower() for e in errors)
```

### 4. Dimension Analysis Tests

#### Valid Connections
```python
def test_dimension_sequential_match():
    """Sequential with matching I/O should pass"""
    code = 'import("stdfaust.lib"); process = os.osc(1) : sin;'
    errors = validate(code, check_dimensions=True)
    # sin takes 1 input, osc produces 1 output - OK

def test_dimension_parallel():
    """Parallel composition any I/O should pass"""
    code = 'import("stdfaust.lib"); process = os.osc(1) , os.osc(2);'
    errors = validate(code, check_dimensions=True)
    # Different I/O OK with parallel (,)

def test_dimension_merge():
    """Merge operator should combine signals"""
    code = 'import("stdfaust.lib"); process = (os.osc(1), os.osc(2)) :> +;'
    errors = validate(code, check_dimensions=True)
    # Merge :> combines 2 outputs to feed + (accepts 2)
```

#### Invalid Connections
```python
def test_dimension_mismatch_sequential():
    """Sequential mismatch should error"""
    code = 'import("stdfaust.lib"); process = (os.osc(1), os.osc(2)) : +;'
    errors = validate(code, check_dimensions=True)
    assert any('dimension' in str(e).lower() for e in errors)

def test_dimension_mismatch_split():
    """Split divisibility error should be detected"""
    code = 'import("stdfaust.lib"); process = (os.osc(1), os.osc(2)) <: (sin, cos, tan);'
    errors = validate(code, check_dimensions=True)
    # 2 outputs can't divide into 3 inputs
    assert any('divisor' in str(e).lower() for e in errors)
```

### 5. Structure Analysis Tests

#### Process Detection
```python
def test_extract_process():
    """Process definition should be extracted"""
    code = 'process = os.osc(1);'
    struct = analyze_structure(code)
    assert len(struct['processes']) == 1
    assert struct['processes'][0]['name'] == 'process'

def test_extract_named_process():
    """Named processes should be identified"""
    code = 'my_synth(f) = os.osc(f); process = my_synth(440);'
    struct = analyze_structure(code)
    processes = [p['name'] for p in struct['processes']]
    assert 'my_synth' in processes
    assert 'process' in processes
```

#### Parameter Extraction
```python
def test_extract_hslider():
    """hslider parameters should be extracted"""
    code = 'process = os.osc(f) with { f = hslider("Freq", 440, 20, 5000, 1); };'
    struct = analyze_structure(code)
    params = struct['processes'][0]['parameters']
    assert len(params) > 0
    assert params[0]['name'] == 'Freq'
    assert params[0]['type'] == 'hslider'
    assert params[0]['default'] == 440

def test_extract_checkbox():
    """Checkbox parameters should be extracted"""
    code = 'process = os.osc(1) * checkbox("Gate");'
    struct = analyze_structure(code)
    params = struct['processes'][0]['parameters']
    assert any(p['type'] == 'checkbox' for p in params)
```

#### I/O Counting
```python
def test_io_single_input_output():
    """Simple processor should have 1 in, 1 out"""
    code = 'process = os.osc(440);'
    struct = analyze_structure(code)
    assert struct['processes'][0]['inputs'] == 1
    assert struct['processes'][0]['outputs'] == 1

def test_io_stereo():
    """Stereo processor should have 2 in, 2 out"""
    code = 'process = (os.osc(440), os.osc(220));'
    struct = analyze_structure(code)
    assert struct['processes'][0]['inputs'] == 1  # No inputs
    assert struct['processes'][0]['outputs'] == 2

def test_io_routing():
    """Complex routing should calculate correctly"""
    code = 'process = (_, _) : (+, -);'
    struct = analyze_structure(code)
    # (_, _) takes 1 input -> 2 outputs -> (+, -) takes 2 inputs -> 2 outputs
    assert struct['processes'][0]['inputs'] == 1
    assert struct['processes'][0]['outputs'] == 2
```

### 6. Error Detection Tests

#### Syntax Errors
```python
test_cases = [
    ("process = os.osc(440)", "missing_semicolon"),
    ("process = os.osc(440);; ", "double_semicolon"),
    ("process = [440];", "invalid_bracket"),
    ("process = 440 440;", "missing_operator"),
    ("process = os.osc;", "missing_args"),  # Needs (freq)
]

for code, error_type in test_cases:
    errors = validate(code)
    assert len(errors) > 0, f"Expected error for: {error_type}"
    assert errors[0]['type'] != 'NO_ERROR'
```

#### Semantic Errors
```python
test_cases = [
    ('process = undefined(1);', 'UNDEFINED_SYMBOL'),
    ('process = 440 + "string";', 'TYPE_MISMATCH'),  # Hypothetical
    ('process = (1,2) : +;', 'BOX_DIMENSION_ERROR'),
    ('process = a with { a = b; b = a; };', 'CIRCULAR_DEFINITION'),
]

for code, expected_error in test_cases:
    errors = validate(code)
    assert any(e['type'] == expected_error for e in errors)
```

### 7. Integration Tests

#### Real-World Examples
```python
def test_simple_synth():
    """Simple synthesizer should validate cleanly"""
    code = '''
    import("stdfaust.lib");
    process = hgroup("Synth",
      os.osc(freq) * ad.adsr(a,d,s,r,gate)
    ) with {
      freq = hslider("Frequency", 440, 20, 5000, 1);
      a = hslider("Attack", 0.01, 0, 1, 0.001);
      d = hslider("Decay", 0.1, 0, 1, 0.001);
      s = hslider("Sustain", 0.5, 0, 1, 0.01);
      r = hslider("Release", 0.5, 0, 2, 0.001);
      gate = button("Gate");
    };
    '''
    errors = validate(code)
    # May have warnings, but no critical errors
    assert not any(e['severity'] == 'ERROR' for e in errors)

def test_multi_stage_effects():
    """Complex effect chain should validate"""
    code = '''
    import("stdfaust.lib");
    process = input :
      fi.lowpass(3, lpf_freq) :
      re.mono_freeverb(1, 0.5, 0.5, 0.5, 1) :
      * (master_gain)
    with {
      input = _;
      lpf_freq = hslider("Filter", 5000, 20, 20000, 1);
      master_gain = hslider("Gain", 0.8, 0, 1, 0.01);
    };
    '''
    errors = validate(code)
    assert len(errors) == 0
```

---

## Test Coverage Metrics

### Minimum Coverage Requirements

| Category | Minimum Coverage | Target Coverage |
|----------|------------------|-----------------|
| Tokenizer | 85% | 95% |
| Parser | 80% | 90% |
| Validator | 75% | 85% |
| Structure Analyzer | 70% | 80% |
| Error Detection | 80% | 95% |

### Code Coverage Tools

```bash
# Use pytest with coverage
pytest --cov=syntax_analyzer tests/
pytest --cov=syntax_analyzer --cov-report=html tests/

# View coverage report
open htmlcov/index.html
```

---

## Performance Testing

### Benchmark Cases

```python
def benchmark_tokenize():
    """Tokenizer should handle large files quickly"""
    large_code = "process = " + " : ".join(["a"] * 1000) + ";"
    start = time.time()
    tokenize(large_code)
    elapsed = time.time() - start
    assert elapsed < 0.01, f"Tokenizer too slow: {elapsed}s"

def benchmark_parse():
    """Parser should handle complex expressions"""
    code = generate_complex_expression(depth=50)
    start = time.time()
    parse(code)
    elapsed = time.time() - start
    assert elapsed < 0.05, f"Parser too slow: {elapsed}s"

def benchmark_validate():
    """Validation should be reasonable speed"""
    code = generate_realistic_faust_program(100_lines)
    start = time.time()
    validate(code)
    elapsed = time.time() - start
    assert elapsed < 0.1, f"Validation too slow: {elapsed}s"
```

---

## Regression Testing

### Automated Regression Suite

```python
# Store known good/bad cases
REGRESSION_CASES = {
    "issue_123": {
        "code": "...",
        "expected_errors": ['SYNTAX_ERROR'],
        "regression_date": "2025-12-10"
    }
}

def test_regression_suite():
    """Ensure previously fixed issues don't regress"""
    for case_name, case in REGRESSION_CASES.items():
        errors = validate(case['code'])
        error_types = [e['type'] for e in errors]
        assert all(et in error_types for et in case['expected_errors']),\
            f"Regression in {case_name}"
```

---

## Quality Gates

### Pre-Release Checklist

- [ ] 95% tokenizer test coverage
- [ ] 90% parser test coverage
- [ ] 85% validation test coverage
- [ ] All integration tests passing
- [ ] Performance benchmarks met
- [ ] No known regressions
- [ ] Error messages reviewed for clarity
- [ ] Documentation complete

---

**Version**: 1.0 | **Status**: QA Guidelines | **Updated**: 2025-12-11
