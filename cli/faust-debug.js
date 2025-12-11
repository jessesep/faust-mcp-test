#!/usr/bin/env node

/**
 * Faust Debug CLI Tool
 *
 * Command-line tool for debugging Faust code errors
 *
 * Usage:
 *   faust-debug <error-file>
 *   faust-debug --interactive
 *   faust-debug <error-file> --source <source.dsp>
 */

const fs = require('fs');
const path = require('path');
const { parseFaustError, categorizeError, extractContext } = require('../tools/error-parser');
const { loadPatterns, matchError, getTopSolutions, formatSolution } = require('../tools/pattern-matcher');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function printBanner() {
  console.log(colors.cyan + colors.bright);
  console.log('╔═══════════════════════════════════════╗');
  console.log('║     Faust Debugging Assistant         ║');
  console.log('║   Error Diagnosis & Solution Tool     ║');
  console.log('╚═══════════════════════════════════════╝');
  console.log(colors.reset);
}

function printError(text) {
  console.log(colors.red + '✗ ' + text + colors.reset);
}

function printSuccess(text) {
  console.log(colors.green + '✓ ' + text + colors.reset);
}

function printInfo(text) {
  console.log(colors.blue + 'ℹ ' + text + colors.reset);
}

function printWarning(text) {
  console.log(colors.yellow + '⚠ ' + text + colors.reset);
}

function printSection(title) {
  console.log('\n' + colors.bright + colors.cyan + '═'.repeat(50) + colors.reset);
  console.log(colors.bright + title + colors.reset);
  console.log(colors.cyan + '═'.repeat(50) + colors.reset + '\n');
}

function analyzeError(errorText, sourceCode, patternsDir) {
  printSection('Parsing Error Output');

  // Parse errors
  const parsed = parseFaustError(errorText);

  if (parsed.count === 0) {
    printWarning('No errors found in input');
    return;
  }

  printSuccess(`Found ${parsed.count} error(s)`);

  // Load patterns
  printSection('Loading Error Pattern Database');
  const patterns = loadPatterns(patternsDir);
  const totalPatterns = Object.values(patterns).reduce((sum, p) => sum + p.length, 0);
  printSuccess(`Loaded ${totalPatterns} error patterns`);

  // Analyze each error
  parsed.errors.forEach((error, index) => {
    printSection(`Error ${index + 1} of ${parsed.count}`);

    console.log(colors.bright + 'Type:' + colors.reset + ' ' + error.type.toUpperCase());
    if (error.file) {
      console.log(colors.bright + 'File:' + colors.reset + ' ' + error.file);
    }
    if (error.line) {
      console.log(colors.bright + 'Line:' + colors.reset + ' ' + error.line);
    }
    console.log(colors.bright + 'Message:' + colors.reset + ' ' + error.message);

    // Categorize
    const category = categorizeError(error);
    console.log(colors.bright + 'Category:' + colors.reset + ' ' + category);

    // Show context if source code provided
    if (sourceCode && error.line) {
      console.log('\n' + colors.bright + 'Code Context:' + colors.reset);
      const context = extractContext(sourceCode, error.line, 3);

      context.lines.forEach(line => {
        const prefix = line.isError ? colors.red + '→ ' : '  ';
        const lineNum = line.lineNumber.toString().padStart(4, ' ');
        const content = line.content || '';

        if (line.isError) {
          console.log(prefix + colors.bright + lineNum + colors.reset + ' | ' + colors.red + content + colors.reset);
        } else {
          console.log(prefix + colors.bright + lineNum + colors.reset + ' | ' + content);
        }
      });
    }

    // Match against patterns
    console.log('\n' + colors.bright + 'Matching Against Pattern Database...' + colors.reset);
    const matches = matchError(error.message, patterns);

    if (matches.length === 0) {
      printWarning('No matching patterns found');
      printInfo('This might be a rare or new error type');
    } else {
      printSuccess(`Found ${matches.length} potential match(es)`);

      // Show top solutions
      const topSolutions = getTopSolutions(matches, 3);

      topSolutions.forEach((solution, idx) => {
        console.log('\n' + colors.bright + colors.green + `Solution ${idx + 1}:` + colors.reset);
        console.log(formatSolution(solution));
      });
    }

    if (index < parsed.errors.length - 1) {
      console.log('\n' + colors.cyan + '─'.repeat(50) + colors.reset);
    }
  });
}

function showHelp() {
  console.log(`
${colors.bright}Usage:${colors.reset}
  faust-debug <error-file>                    Analyze error file
  faust-debug <error-file> --source <file>    Include source context
  faust-debug --help                          Show this help

${colors.bright}Examples:${colors.reset}
  faust-debug error.log
  faust-debug error.log --source mycode.dsp
  echo "ERROR: undefined symbol 'osc'" | faust-debug -

${colors.bright}Options:${colors.reset}
  --source <file>    Path to Faust source file for context
  --help             Show help message
  -                  Read from stdin

${colors.bright}Description:${colors.reset}
  Faust Debug analyzes Faust compiler errors and provides:
  - Error categorization
  - Pattern matching against known errors
  - Suggested solutions with code examples
  - Source code context (when available)
`);
}

// Main CLI logic
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help')) {
    printBanner();
    showHelp();
    process.exit(0);
  }

  printBanner();

  // Parse arguments
  const errorFileArg = args[0];
  const sourceFileIndex = args.indexOf('--source');
  const sourceFile = sourceFileIndex !== -1 ? args[sourceFileIndex + 1] : null;

  // Read error text
  let errorText;
  if (errorFileArg === '-') {
    // Read from stdin (not implemented in this simple version)
    printError('Stdin input not yet implemented');
    process.exit(1);
  } else {
    if (!fs.existsSync(errorFileArg)) {
      printError(`Error file not found: ${errorFileArg}`);
      process.exit(1);
    }
    errorText = fs.readFileSync(errorFileArg, 'utf8');
  }

  // Read source code if provided
  let sourceCode = null;
  if (sourceFile) {
    if (!fs.existsSync(sourceFile)) {
      printWarning(`Source file not found: ${sourceFile}`);
    } else {
      sourceCode = fs.readFileSync(sourceFile, 'utf8');
      printInfo(`Source code loaded from ${sourceFile}`);
    }
  }

  // Patterns directory
  const patternsDir = path.join(__dirname, '..', 'data', 'error-patterns');

  if (!fs.existsSync(patternsDir)) {
    printError(`Patterns directory not found: ${patternsDir}`);
    printInfo('Make sure error pattern database is installed');
    process.exit(1);
  }

  // Analyze
  analyzeError(errorText, sourceCode, patternsDir);

  console.log('\n' + colors.green + '✓ Analysis complete' + colors.reset + '\n');
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { analyzeError };
