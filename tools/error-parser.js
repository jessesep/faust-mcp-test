/**
 * Faust Error Parser
 *
 * Parses Faust compiler error output and extracts structured information
 *
 * @module error-parser
 */

/**
 * Parse Faust error output into structured format
 * @param {string} errorText - Raw error output from Faust compiler
 * @returns {Object} Parsed error information
 */
function parseFaustError(errorText) {
  const errors = [];
  const lines = errorText.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines
    if (!line) continue;

    // Common Faust error patterns
    const patterns = [
      // ERROR: file.dsp : N : undefined symbol 'foo'
      {
        regex: /ERROR\s*:\s*([^:]+)\s*:\s*(\d+)\s*:\s*(.+)/i,
        extract: (match) => ({
          type: 'error',
          file: match[1].trim(),
          line: parseInt(match[2]),
          message: match[3].trim(),
          raw: line
        })
      },
      // file.dsp:N: error message
      {
        regex: /([^:]+):(\d+):\s*(.+)/,
        extract: (match) => ({
          type: 'error',
          file: match[1].trim(),
          line: parseInt(match[2]),
          message: match[3].trim(),
          raw: line
        })
      },
      // ERROR: message without location
      {
        regex: /ERROR\s*:\s*(.+)/i,
        extract: (match) => ({
          type: 'error',
          file: null,
          line: null,
          message: match[1].trim(),
          raw: line
        })
      },
      // WARNING: message
      {
        regex: /WARNING\s*:\s*(.+)/i,
        extract: (match) => ({
          type: 'warning',
          file: null,
          line: null,
          message: match[1].trim(),
          raw: line
        })
      }
    ];

    // Try each pattern
    for (const pattern of patterns) {
      const match = line.match(pattern.regex);
      if (match) {
        errors.push(pattern.extract(match));
        break;
      }
    }
  }

  return {
    errors,
    count: errors.length,
    hasErrors: errors.some(e => e.type === 'error'),
    hasWarnings: errors.some(e => e.type === 'warning')
  };
}

/**
 * Categorize error by type
 * @param {Object} error - Parsed error object
 * @returns {string} Error category
 */
function categorizeError(error) {
  const message = error.message.toLowerCase();

  // Syntax errors
  if (message.includes('expected') && message.includes("';'")) {
    return 'syntax-missing-semicolon';
  }
  if (message.includes('undefined symbol') || message.includes('is undefined')) {
    return 'syntax-undefined-symbol';
  }
  if (message.includes('expected') && message.includes("')'")) {
    return 'syntax-unclosed-parenthesis';
  }
  if (message.includes('process') && message.includes('not defined')) {
    return 'syntax-missing-process';
  }

  // Type errors
  if (message.includes('domain') && message.includes('sqrt')) {
    return 'type-domain-violation-sqrt';
  }
  if (message.includes('domain') && message.includes('log')) {
    return 'type-domain-violation-log';
  }
  if (message.includes('division') && message.includes('zero')) {
    return 'type-division-by-zero';
  }

  // Signal processing errors
  if (message.includes('causality') || message.includes('zero-delay') || message.includes('delay-free loop')) {
    return 'signal-causality-violation';
  }
  if (message.includes('recursive') && message.includes('unbounded')) {
    return 'signal-unbounded-recursion';
  }

  // Composition errors
  if (message.includes('dimension') || message.includes('mismatch') || message.includes('incompatible')) {
    return 'composition-io-mismatch';
  }

  // Compilation errors
  if (message.includes('architecture') && message.includes('not found')) {
    return 'compilation-missing-architecture';
  }
  if (message.includes('import') && message.includes('failed')) {
    return 'compilation-library-import-failed';
  }

  return 'unknown';
}

/**
 * Extract code context around error line
 * @param {string} sourceCode - Full Faust source code
 * @param {number} lineNumber - Error line number
 * @param {number} contextLines - Number of lines before/after to include
 * @returns {Object} Code context
 */
function extractContext(sourceCode, lineNumber, contextLines = 3) {
  const lines = sourceCode.split('\n');
  const startLine = Math.max(0, lineNumber - contextLines - 1);
  const endLine = Math.min(lines.length, lineNumber + contextLines);

  const context = [];
  for (let i = startLine; i < endLine; i++) {
    context.push({
      lineNumber: i + 1,
      content: lines[i],
      isError: i + 1 === lineNumber
    });
  }

  return {
    startLine: startLine + 1,
    endLine: endLine,
    errorLine: lineNumber,
    lines: context
  };
}

module.exports = {
  parseFaustError,
  categorizeError,
  extractContext
};
