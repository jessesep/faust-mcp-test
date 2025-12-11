#!/usr/bin/env node

/**
 * Faust Syntax Analyzer & Linter
 *
 * Comprehensive syntax analysis, linting, and code structure analysis for Faust DSP code.
 * Provides detailed error detection, suggestions, and code quality metrics.
 */

const fs = require('fs');

/**
 * Tokenizer: Converts Faust code into tokens
 */
class Tokenizer {
  constructor() {
    this.tokens = [];
    this.position = 0;
    this.line = 1;
    this.column = 1;
  }

  /**
   * Tokenize Faust code
   * @param {string} code - Faust DSP code
   * @returns {array} Array of tokens
   */
  tokenize(code) {
    this.tokens = [];
    this.position = 0;
    this.line = 1;
    this.column = 1;

    while (this.position < code.length) {
      const char = code[this.position];

      // Skip whitespace
      if (/\s/.test(char)) {
        if (char === '\n') {
          this.line++;
          this.column = 1;
        } else {
          this.column++;
        }
        this.position++;
        continue;
      }

      // Skip comments
      if (char === '/' && code[this.position + 1] === '/') {
        while (this.position < code.length && code[this.position] !== '\n') {
          this.position++;
        }
        continue;
      }

      if (char === '/' && code[this.position + 1] === '*') {
        this.position += 2;
        while (this.position < code.length) {
          if (code[this.position] === '*' && code[this.position + 1] === '/') {
            this.position += 2;
            break;
          }
          if (code[this.position] === '\n') {
            this.line++;
            this.column = 1;
          }
          this.position++;
        }
        continue;
      }

      // String literals
      if (char === '"') {
        const start = this.position;
        this.position++;
        const startLine = this.line;
        const startCol = this.column;

        while (this.position < code.length) {
          if (code[this.position] === '"' && code[this.position - 1] !== '\\') {
            this.position++;
            break;
          }
          if (code[this.position] === '\n') {
            this.line++;
            this.column = 1;
          }
          this.position++;
        }

        this.tokens.push({
          type: 'STRING',
          value: code.substring(start, this.position),
          line: startLine,
          column: startCol
        });
        continue;
      }

      // Numbers
      if (/\d/.test(char)) {
        const startLine = this.line;
        const startCol = this.column;
        const start = this.position;

        while (this.position < code.length && /[\d.eE+-]/.test(code[this.position])) {
          this.position++;
        }

        this.tokens.push({
          type: 'NUMBER',
          value: code.substring(start, this.position),
          line: startLine,
          column: startCol
        });
        continue;
      }

      // Identifiers and keywords
      if (/[a-zA-Z_]/.test(char)) {
        const startLine = this.line;
        const startCol = this.column;
        const start = this.position;

        while (this.position < code.length && /[a-zA-Z0-9_]/.test(code[this.position])) {
          this.position++;
        }

        const value = code.substring(start, this.position);
        const keywords = [
          'process', 'import', 'declare', 'with', 'where', 'include',
          'def', 'let', 'par', 'seq', 'int', 'float'
        ];

        this.tokens.push({
          type: keywords.includes(value) ? 'KEYWORD' : 'IDENTIFIER',
          value,
          line: startLine,
          column: startCol
        });
        continue;
      }

      // Operators and symbols
      const twoCharOps = ['<:', ':>', '::', '==', '!=', '<=', '>=', '&&', '||'];
      const twoCharOp = code.substr(this.position, 2);

      if (twoCharOps.includes(twoCharOp)) {
        this.tokens.push({
          type: 'OPERATOR',
          value: twoCharOp,
          line: this.line,
          column: this.column
        });
        this.position += 2;
        this.column += 2;
        continue;
      }

      // Single character tokens
      const singleCharOps = '()[]{}:,;<>=-+*/%@~`!&|.?';
      if (singleCharOps.includes(char)) {
        this.tokens.push({
          type: 'OPERATOR',
          value: char,
          line: this.line,
          column: this.column
        });
      } else {
        this.tokens.push({
          type: 'UNKNOWN',
          value: char,
          line: this.line,
          column: this.column
        });
      }

      this.position++;
      this.column++;
    }

    return this.tokens;
  }
}

/**
 * SyntaxAnalyzer: Analyzes Faust syntax structure
 */
class SyntaxAnalyzer {
  constructor() {
    this.tokenizer = new Tokenizer();
    this.tokens = [];
    this.position = 0;
    this.ast = null;
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Analyze code syntax
   * @param {string} code - Faust code
   * @returns {object} Analysis results
   */
  analyze(code) {
    this.tokens = this.tokenizer.tokenize(code);
    this.position = 0;
    this.errors = [];
    this.warnings = [];
    this.ast = {};

    // Parse structure
    this.parseProgram();

    return {
      valid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
      ast: this.ast,
      tokens: this.tokens,
      metrics: this.calculateMetrics(code)
    };
  }

  /**
   * Parse top-level program structure
   */
  parseProgram() {
    this.ast.imports = [];
    this.ast.declarations = [];
    this.ast.definitions = [];
    this.ast.process = null;

    while (this.position < this.tokens.length) {
      const token = this.tokens[this.position];

      if (token.type === 'KEYWORD') {
        if (token.value === 'import') {
          this.parseImport();
        } else if (token.value === 'declare') {
          this.parseDeclaration();
        } else if (token.value === 'process') {
          this.parseProcess();
        } else {
          this.advance();
        }
      } else if (token.type === 'IDENTIFIER') {
        this.parseDefinition();
      } else {
        this.advance();
      }
    }

    // Check for missing process
    if (!this.ast.process) {
      this.warnings.push({
        type: 'MISSING_PROCESS',
        message: 'No "process" declaration found',
        severity: 'warning'
      });
    }
  }

  /**
   * Parse import statement
   */
  parseImport() {
    const startLine = this.currentToken().line;
    this.advance(); // skip 'import'

    if (this.currentToken()?.value !== '(') {
      this.errors.push({
        line: startLine,
        message: 'Expected "(" after import',
        type: 'SYNTAX_ERROR'
      });
      return;
    }
    this.advance();

    const libToken = this.currentToken();
    if (libToken?.type !== 'STRING') {
      this.errors.push({
        line: startLine,
        message: 'Expected library name as string',
        type: 'SYNTAX_ERROR'
      });
    } else {
      this.ast.imports.push({
        library: libToken.value.slice(1, -1), // Remove quotes
        line: startLine
      });
      this.advance();
    }

    if (this.currentToken()?.value !== ')') {
      this.errors.push({
        line: startLine,
        message: 'Expected ")" after import',
        type: 'SYNTAX_ERROR'
      });
    } else {
      this.advance();
    }

    if (this.currentToken()?.value !== ';') {
      this.errors.push({
        line: startLine,
        message: 'Expected ";" after import statement',
        type: 'SYNTAX_ERROR'
      });
    } else {
      this.advance();
    }
  }

  /**
   * Parse declaration statement
   */
  parseDeclaration() {
    const startLine = this.currentToken().line;
    this.advance(); // skip 'declare'

    while (this.currentToken() && this.currentToken().value !== ';') {
      this.advance();
    }

    if (this.currentToken()?.value === ';') {
      this.ast.declarations.push({ line: startLine });
      this.advance();
    }
  }

  /**
   * Parse process definition
   */
  parseProcess() {
    const startLine = this.currentToken().line;
    this.advance(); // skip 'process'

    if (this.currentToken()?.value !== '=') {
      this.errors.push({
        line: startLine,
        message: 'Expected "=" after process',
        type: 'SYNTAX_ERROR'
      });
      return;
    }
    this.advance();

    const expr = this.parseExpression();

    if (this.currentToken()?.value !== ';') {
      this.errors.push({
        line: startLine,
        message: 'Expected ";" after process expression',
        type: 'SYNTAX_ERROR'
      });
    } else {
      this.advance();
    }

    this.ast.process = {
      line: startLine,
      expression: expr
    };
  }

  /**
   * Parse function/variable definition
   */
  parseDefinition() {
    const startLine = this.currentToken().line;
    const nameToken = this.currentToken();
    const name = nameToken.value;
    this.advance();

    // Check for duplicate definition
    if (this.ast.definitions.some(d => d.name === name)) {
      this.warnings.push({
        type: 'DUPLICATE_DEFINITION',
        message: `Symbol "${name}" defined multiple times`,
        line: startLine,
        severity: 'error'
      });
    }

    let params = [];

    // Parse parameters if present
    if (this.currentToken()?.value === '(') {
      this.advance();
      while (this.currentToken() && this.currentToken().value !== ')') {
        if (this.currentToken().type === 'IDENTIFIER') {
          params.push(this.currentToken().value);
          this.advance();
        }
        if (this.currentToken()?.value === ',') {
          this.advance();
        }
      }
      if (this.currentToken()?.value === ')') {
        this.advance();
      }
    }

    // Expect =
    if (this.currentToken()?.value !== '=') {
      this.errors.push({
        line: startLine,
        message: `Expected "=" in definition of "${name}"`,
        type: 'SYNTAX_ERROR'
      });
      return;
    }
    this.advance();

    // Parse expression
    const expr = this.parseExpression();

    // Expect ;
    if (this.currentToken()?.value !== ';') {
      this.errors.push({
        line: startLine,
        message: `Expected ";" after definition of "${name}"`,
        type: 'SYNTAX_ERROR'
      });
    } else {
      this.advance();
    }

    this.ast.definitions.push({
      name,
      params,
      line: startLine,
      expression: expr
    });
  }

  /**
   * Parse expression (simplified)
   */
  parseExpression() {
    const start = this.position;
    let depth = 0;

    while (this.position < this.tokens.length) {
      const token = this.currentToken();

      if (!token) break;

      // Track nesting depth
      if ('([{'.includes(token.value)) depth++;
      if (')]}'.includes(token.value)) depth--;

      // Stop at statement terminators at depth 0
      if (depth === 0 && (token.value === ';' || token.value === ',')) {
        break;
      }

      this.advance();
    }

    return {
      tokens: this.tokens.slice(start, this.position),
      start,
      end: this.position
    };
  }

  /**
   * Get current token
   */
  currentToken() {
    return this.tokens[this.position];
  }

  /**
   * Advance to next token
   */
  advance() {
    this.position++;
  }

  /**
   * Calculate code metrics
   */
  calculateMetrics(code) {
    return {
      lines: code.split('\n').length,
      characters: code.length,
      imports: this.ast.imports?.length || 0,
      definitions: this.ast.definitions?.length || 0,
      has_process: !!this.ast.process,
      tokens_total: this.tokens.length,
      identifiers: this.tokens.filter(t => t.type === 'IDENTIFIER').length,
      keywords: this.tokens.filter(t => t.type === 'KEYWORD').length,
      operators: this.tokens.filter(t => t.type === 'OPERATOR').length,
      strings: this.tokens.filter(t => t.type === 'STRING').length,
      numbers: this.tokens.filter(t => t.type === 'NUMBER').length
    };
  }
}

/**
 * Linter: Applies linting rules to Faust code
 */
class Linter {
  constructor() {
    this.rules = this.buildRules();
  }

  /**
   * Lint code
   * @param {string} code - Faust code
   * @param {object} analysis - Analysis from SyntaxAnalyzer
   * @returns {object} Linting results
   */
  lint(code, analysis) {
    const issues = [];
    const lines = code.split('\n');

    // Apply each rule
    this.rules.forEach(rule => {
      const result = rule.check(code, analysis, lines);
      if (result) {
        issues.push(...result);
      }
    });

    return {
      issues,
      summary: {
        total: issues.length,
        errors: issues.filter(i => i.severity === 'error').length,
        warnings: issues.filter(i => i.severity === 'warning').length,
        style: issues.filter(i => i.severity === 'style').length
      }
    };
  }

  /**
   * Build linting rules
   */
  buildRules() {
    return [
      {
        name: 'Missing import',
        check: (code, analysis) => {
          const issues = [];
          if (!analysis.ast.imports.some(i => i.library === 'stdfaust.lib')) {
            const libraryFunctions = ['ba.', 'ma.', 'fi.', 'si.', 'co.', 'de.'];
            if (libraryFunctions.some(lib => code.includes(lib))) {
              issues.push({
                line: 1,
                message: 'Standard library functions used but stdfaust.lib not imported',
                severity: 'error',
                suggestion: 'Add: import("stdfaust.lib");'
              });
            }
          }
          return issues;
        }
      },

      {
        name: 'Unused definitions',
        check: (code, analysis) => {
          const issues = [];
          const defs = analysis.ast.definitions;
          const processCode = analysis.ast.process?.expression?.tokens || [];

          defs.forEach(def => {
            const used = processCode.some(t => t.value === def.name) ||
                        defs.some((d, i) => d !== def &&
                                  d.expression.tokens.some(t => t.value === def.name));

            if (!used && !def.name.startsWith('_')) {
              issues.push({
                line: def.line,
                message: `Definition "${def.name}" is never used`,
                severity: 'warning'
              });
            }
          });
          return issues;
        }
      },

      {
        name: 'Missing semicolons',
        check: (code, analysis) => {
          const issues = [];
          const defs = analysis.ast.definitions;

          defs.forEach(def => {
            if (def.line && def.name) {
              const lineText = code.split('\n')[def.line - 1] || '';
              if (!lineText.includes(';')) {
                issues.push({
                  line: def.line,
                  message: 'Possible missing semicolon',
                  severity: 'warning'
                });
              }
            }
          });
          return issues;
        }
      },

      {
        name: 'Naming conventions',
        check: (code, analysis) => {
          const issues = [];
          const defs = analysis.ast.definitions;

          defs.forEach(def => {
            if (/[A-Z]/.test(def.name)) {
              issues.push({
                line: def.line,
                message: `Definition "${def.name}" uses uppercase - consider lowercase`,
                severity: 'style'
              });
            }
          });
          return issues;
        }
      },

      {
        name: 'Slider parameter bounds',
        check: (code) => {
          const issues = [];
          const sliderRegex = /hslider\s*\(\s*"([^"]+)"\s*,\s*([\d.-]+)\s*,\s*([\d.-]+)\s*,\s*([\d.-]+)\s*,\s*([\d.]+)\s*\)/g;
          let match;

          while ((match = sliderRegex.exec(code)) !== null) {
            const name = match[1];
            const def = parseFloat(match[2]);
            const min = parseFloat(match[3]);
            const max = parseFloat(match[4]);

            if (def < min || def > max) {
              issues.push({
                line: code.substring(0, match.index).split('\n').length,
                message: `Slider "${name}" default ${def} outside range [${min}, ${max}]`,
                severity: 'error'
              });
            }
          }
          return issues;
        }
      },

      {
        name: 'Complex expressions',
        check: (code, analysis) => {
          const issues = [];
          analysis.ast.definitions.forEach(def => {
            if (def.expression.tokens.length > 50) {
              issues.push({
                line: def.line,
                message: `Definition "${def.name}" is very complex (${def.expression.tokens.length} tokens)`,
                severity: 'style',
                suggestion: 'Consider breaking into smaller definitions'
              });
            }
          });
          return issues;
        }
      }
    ];
  }
}

/**
 * CodeAnalyzer: Analyzes code structure and patterns
 */
class CodeAnalyzer {
  /**
   * Analyze code structure
   * @param {object} analysis - Analysis from SyntaxAnalyzer
   * @returns {object} Code structure analysis
   */
  analyzeStructure(analysis) {
    return {
      architecture: this.analyzeArchitecture(analysis),
      complexity: this.analyzeComplexity(analysis),
      quality: this.analyzeQuality(analysis),
      patterns: this.detectPatterns(analysis)
    };
  }

  /**
   * Analyze code architecture
   */
  analyzeArchitecture(analysis) {
    const defs = analysis.ast.definitions || [];
    return {
      definition_count: defs.length,
      functions_with_params: defs.filter(d => d.params.length > 0).length,
      max_params: Math.max(...defs.map(d => d.params.length), 0),
      max_expression_length: Math.max(...defs.map(d => d.expression.tokens.length), 0),
      average_expression_length: defs.length > 0
        ? defs.reduce((sum, d) => sum + d.expression.tokens.length, 0) / defs.length
        : 0
    };
  }

  /**
   * Analyze code complexity
   */
  analyzeComplexity(analysis) {
    const defs = analysis.ast.definitions || [];
    const nested = this.countNesting(analysis);

    return {
      max_nesting: nested.max,
      average_nesting: nested.total / defs.length || 0,
      total_definitions: defs.length,
      recursive_likely: defs.some(d =>
        d.expression.tokens.some(t => t.value === '~'))
    };
  }

  /**
   * Analyze code quality
   */
  analyzeQuality(analysis) {
    const metrics = analysis.metrics;
    return {
      has_process: metrics.has_process,
      imports_used: metrics.imports,
      documented: false, // Could scan for comments
      follows_conventions: true, // Based on naming
      token_ratio: {
        identifiers: (metrics.identifiers / metrics.tokens_total * 100).toFixed(1) + '%',
        operators: (metrics.operators / metrics.tokens_total * 100).toFixed(1) + '%',
        keywords: (metrics.keywords / metrics.tokens_total * 100).toFixed(1) + '%'
      }
    };
  }

  /**
   * Detect code patterns
   */
  detectPatterns(analysis) {
    const code = '';
    const patterns = [];

    analysis.ast.definitions.forEach(def => {
      // Detect filter pattern
      if (def.expression.tokens.some(t => t.value === 'lowpass' || t.value === 'highpass')) {
        patterns.push({ type: 'FILTER', name: def.name });
      }

      // Detect oscillator pattern
      if (def.expression.tokens.some(t => t.value === 'sin' || t.value === 'osc')) {
        patterns.push({ type: 'OSCILLATOR', name: def.name });
      }

      // Detect envelope pattern
      if (def.expression.tokens.some(t => t.value === 'en.' || t.value === 'envelope')) {
        patterns.push({ type: 'ENVELOPE', name: def.name });
      }

      // Detect feedback/recursive pattern
      if (def.expression.tokens.some(t => t.value === '~')) {
        patterns.push({ type: 'RECURSIVE', name: def.name });
      }

      // Detect delay pattern
      if (def.expression.tokens.some(t => t.value === '@' || t.value === 'delay')) {
        patterns.push({ type: 'DELAY', name: def.name });
      }
    });

    return patterns;
  }

  /**
   * Count nesting depth
   */
  countNesting(analysis) {
    let max = 0;
    let total = 0;

    analysis.ast.definitions.forEach(def => {
      let depth = 0;
      let maxDepth = 0;

      def.expression.tokens.forEach(token => {
        if ('([{'.includes(token.value)) depth++;
        if (')]}'.includes(token.value)) depth--;
        maxDepth = Math.max(maxDepth, depth);
      });

      max = Math.max(max, maxDepth);
      total += maxDepth;
    });

    return { max, total };
  }
}

/**
 * SyntaxAnalyzerTool: Main entry point combining all analysis
 */
class SyntaxAnalyzerTool {
  constructor() {
    this.analyzer = new SyntaxAnalyzer();
    this.linter = new Linter();
    this.codeAnalyzer = new CodeAnalyzer();
  }

  /**
   * Perform complete analysis
   * @param {string} code - Faust code
   * @returns {object} Complete analysis results
   */
  analyzeComplete(code) {
    // Step 1: Syntax analysis
    const syntaxAnalysis = this.analyzer.analyze(code);

    // Step 2: Linting
    const lintResults = this.linter.lint(code, syntaxAnalysis);

    // Step 3: Code structure analysis
    const structureAnalysis = this.codeAnalyzer.analyzeStructure(syntaxAnalysis);

    // Combine results
    return {
      timestamp: new Date().toISOString(),
      summary: {
        syntax_valid: syntaxAnalysis.valid,
        lint_issues: lintResults.summary.total,
        lint_errors: lintResults.summary.errors,
        lint_warnings: lintResults.summary.warnings
      },
      syntax: syntaxAnalysis,
      linting: lintResults,
      structure: structureAnalysis,
      overall_quality: this.calculateQuality(syntaxAnalysis, lintResults, structureAnalysis)
    };
  }

  /**
   * Calculate overall quality score
   */
  calculateQuality(syntax, linting, structure) {
    let score = 100;

    // Deduct for syntax errors
    score -= syntax.errors.length * 10;

    // Deduct for lint issues
    score -= linting.summary.errors * 5;
    score -= linting.summary.warnings * 2;
    score -= linting.summary.style * 1;

    // Bonus for good structure
    if (structure.quality.has_process) score += 5;
    if (structure.quality.imports_used > 0) score += 3;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Format analysis report
   */
  formatReport(analysis) {
    const lines = [];

    lines.push('╔════════════════════════════════════════════════════════════╗');
    lines.push('║           FAUST SYNTAX ANALYSIS REPORT                     ║');
    lines.push('╚════════════════════════════════════════════════════════════╝');
    lines.push('');
    lines.push(`Timestamp: ${analysis.timestamp}`);
    lines.push('');
    lines.push('─────────────────────────────────────────────────────────────');
    lines.push('SUMMARY');
    lines.push('─────────────────────────────────────────────────────────────');

    lines.push(`Syntax Valid: ${analysis.summary.syntax_valid ? '✓ YES' : '✗ NO'}`);
    lines.push(`Quality Score: ${analysis.overall_quality}/100`);
    lines.push(`Lint Issues: ${analysis.summary.lint_issues}`);
    lines.push(`  - Errors: ${analysis.summary.lint_errors}`);
    lines.push(`  - Warnings: ${analysis.summary.lint_warnings}`);
    lines.push('');

    if (analysis.syntax.errors.length > 0) {
      lines.push('SYNTAX ERRORS:');
      analysis.syntax.errors.forEach(err => {
        lines.push(`  [Line ${err.line}] ${err.message}`);
      });
      lines.push('');
    }

    if (analysis.linting.issues.length > 0) {
      lines.push('LINTING ISSUES:');
      analysis.linting.issues.forEach(issue => {
        const icon = issue.severity === 'error' ? '✗' : issue.severity === 'warning' ? '⚠' : 'ℹ';
        lines.push(`  ${icon} [Line ${issue.line || '?'}] ${issue.message}`);
        if (issue.suggestion) lines.push(`     → ${issue.suggestion}`);
      });
      lines.push('');
    }

    lines.push('CODE STRUCTURE:');
    const arch = analysis.structure.architecture;
    lines.push(`  Definitions: ${arch.definition_count}`);
    lines.push(`  Functions with params: ${arch.functions_with_params}`);
    lines.push(`  Max expression length: ${arch.max_expression_length} tokens`);
    lines.push('');

    if (analysis.structure.patterns.length > 0) {
      lines.push('DETECTED PATTERNS:');
      analysis.structure.patterns.forEach(pattern => {
        lines.push(`  • ${pattern.type}: ${pattern.name}`);
      });
      lines.push('');
    }

    lines.push('METRICS:');
    const metrics = analysis.syntax.metrics;
    lines.push(`  Lines: ${metrics.lines}`);
    lines.push(`  Characters: ${metrics.characters}`);
    lines.push(`  Imports: ${metrics.imports}`);
    lines.push(`  Has process: ${metrics.has_process ? 'yes' : 'no'}`);

    return lines.join('\n');
  }
}

// Export classes
module.exports = {
  Tokenizer,
  SyntaxAnalyzer,
  Linter,
  CodeAnalyzer,
  SyntaxAnalyzerTool
};

// CLI support
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: node syntax-analyzer.js <faust-file>');
    process.exit(1);
  }

  const filePath = args[0];

  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found: ${filePath}`);
    process.exit(1);
  }

  const code = fs.readFileSync(filePath, 'utf8');
  const tool = new SyntaxAnalyzerTool();

  const analysis = tool.analyzeComplete(code);
  console.log(tool.formatReport(analysis));

  process.exit(analysis.summary.syntax_valid ? 0 : 1);
}
