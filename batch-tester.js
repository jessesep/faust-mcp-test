#!/usr/bin/env node

/**
 * Faust Batch Testing Runner
 *
 * Run tests on multiple Faust files with comprehensive reporting.
 * Supports directory scanning, parallel testing, and aggregate reporting.
 */

const fs = require('fs');
const path = require('path');
const { TestRunner } = require('./testing-framework');
const { SyntaxAnalyzerTool } = require('./syntax-analyzer');

/**
 * FileScanner: Discover Faust files
 */
class FileScanner {
  /**
   * Scan directory for .dsp files
   * @param {string} directory - Directory to scan
   * @param {boolean} recursive - Scan recursively
   * @returns {array} List of .dsp file paths
   */
  scanDirectory(directory, recursive = true) {
    const files = [];

    const scan = (dir) => {
      if (!fs.existsSync(dir)) {
        throw new Error(`Directory not found: ${dir}`);
      }

      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          if (recursive && !entry.name.startsWith('.')) {
            scan(fullPath);
          }
        } else if (entry.isFile() && entry.name.endsWith('.dsp')) {
          files.push(fullPath);
        }
      }
    };

    scan(directory);
    return files;
  }

  /**
   * Group files by directory
   * @param {array} files - List of file paths
   * @returns {object} Files grouped by directory
   */
  groupByDirectory(files) {
    const groups = {};

    files.forEach(file => {
      const dir = path.dirname(file);
      if (!groups[dir]) {
        groups[dir] = [];
      }
      groups[dir].push(file);
    });

    return groups;
  }
}

/**
 * BatchTestRunner: Run tests on multiple files
 */
class BatchTestRunner {
  constructor(options = {}) {
    this.testRunner = new TestRunner(options);
    this.syntaxAnalyzer = new SyntaxAnalyzerTool();
    this.scanner = new FileScanner();
    this.results = [];
    this.verbose = options.verbose || false;
  }

  /**
   * Run tests on multiple files
   * @param {array} files - List of file paths
   * @param {object} options - Testing options
   * @returns {object} Batch test results
   */
  async runBatchTests(files, options = {}) {
    const startTime = Date.now();
    const batchResult = {
      timestamp: new Date().toISOString(),
      total_files: files.length,
      results: [],
      summary: {
        passed: 0,
        failed: 0,
        skipped: 0,
        total_errors: 0,
        total_warnings: 0
      },
      duration_ms: 0
    };

    console.log(`Running tests on ${files.length} file(s)...\n`);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileResult = await this.testFile(file, i + 1, files.length, options);
      batchResult.results.push(fileResult);

      if (fileResult.status === 'PASS') {
        batchResult.summary.passed++;
      } else if (fileResult.status === 'FAIL') {
        batchResult.summary.failed++;
        batchResult.summary.total_errors += fileResult.error_count || 0;
      } else {
        batchResult.summary.skipped++;
      }

      batchResult.summary.total_warnings += fileResult.warning_count || 0;
    }

    batchResult.duration_ms = Date.now() - startTime;
    this.results.push(batchResult);

    return batchResult;
  }

  /**
   * Test a single file
   * @param {string} filePath - Path to .dsp file
   * @param {number} index - File index
   * @param {number} total - Total files
   * @param {object} options - Testing options
   * @returns {object} Test result
   */
  async testFile(filePath, index, total, options = {}) {
    const fileName = path.basename(filePath);
    const fileDir = path.dirname(filePath);

    if (this.verbose) {
      console.log(`[${index}/${total}] Testing: ${fileName}`);
    } else {
      process.stdout.write(`[${index}/${total}] ${fileName.padEnd(40)} `);
    }

    const result = {
      file: filePath,
      fileName,
      directory: fileDir,
      status: 'UNKNOWN',
      error_count: 0,
      warning_count: 0,
      test_results: null,
      syntax_analysis: null,
      errors: []
    };

    try {
      // Read file
      if (!fs.existsSync(filePath)) {
        result.status = 'SKIP';
        result.errors.push('File not found');
        console.log('SKIP (not found)');
        return result;
      }

      const code = fs.readFileSync(filePath, 'utf8');

      // Run syntax analysis if requested
      if (options.analyzeSyntax) {
        result.syntax_analysis = this.syntaxAnalyzer.analyzeComplete(code);
        result.error_count += result.syntax_analysis.syntax.errors.length;
        result.warning_count += result.syntax_analysis.linting.issues.filter(i => i.severity === 'warning').length;
      }

      // Run full test suite
      result.test_results = await this.testRunner.runFullTestSuite(code);

      // Determine overall status
      if (result.test_results.summary.overall_status === 'PASS') {
        result.status = 'PASS';
        if (!this.verbose) console.log('✓ PASS');
      } else {
        result.status = 'FAIL';
        result.error_count += result.test_results.summary.failed_tests;

        // Collect specific errors
        if (result.test_results.tests.syntax && !result.test_results.tests.syntax.valid) {
          const syntaxErrors = result.test_results.tests.syntax.errors || [];
          result.errors.push(...syntaxErrors.map(e => e.message || e));
        }
        if (result.test_results.tests.compilation && !result.test_results.tests.compilation.compilable) {
          const compErrors = result.test_results.tests.compilation.errors || [];
          result.errors.push(...compErrors.map(e => e.message || e));
        }

        if (!this.verbose) console.log(`✗ FAIL (${result.error_count} errors)`);
      }

      if (this.verbose && result.errors.length > 0) {
        result.errors.forEach(err => console.log(`  ERROR: ${err}`));
      }

    } catch (error) {
      result.status = 'ERROR';
      result.errors.push(error.message);
      if (!this.verbose) console.log(`✗ ERROR: ${error.message}`);
    }

    return result;
  }

  /**
   * Run tests on directory
   * @param {string} directory - Directory path
   * @param {object} options - Testing options
   * @returns {object} Batch test results
   */
  async runDirectoryTests(directory, options = {}) {
    const files = this.scanner.scanDirectory(directory, options.recursive !== false);

    if (files.length === 0) {
      console.log(`No .dsp files found in ${directory}`);
      return {
        timestamp: new Date().toISOString(),
        total_files: 0,
        results: [],
        summary: { passed: 0, failed: 0, skipped: 0 }
      };
    }

    return this.runBatchTests(files, options);
  }

  /**
   * Generate batch test report
   * @param {object} batchResult - Results from runBatchTests
   * @returns {string} Formatted report
   */
  formatReport(batchResult) {
    const lines = [];

    lines.push('╔════════════════════════════════════════════════════════════╗');
    lines.push('║           FAUST BATCH TEST REPORT                          ║');
    lines.push('╚════════════════════════════════════════════════════════════╝');
    lines.push('');
    lines.push(`Timestamp: ${batchResult.timestamp}`);
    lines.push(`Duration: ${(batchResult.duration_ms / 1000).toFixed(2)}s`);
    lines.push('');
    lines.push('─────────────────────────────────────────────────────────────');
    lines.push('SUMMARY');
    lines.push('─────────────────────────────────────────────────────────────');
    lines.push(`Total Files: ${batchResult.total_files}`);
    lines.push(`Passed: ${batchResult.summary.passed} ✓`);
    lines.push(`Failed: ${batchResult.summary.failed} ✗`);
    lines.push(`Skipped: ${batchResult.summary.skipped}`);
    lines.push(`Total Errors: ${batchResult.summary.total_errors}`);
    lines.push(`Total Warnings: ${batchResult.summary.total_warnings}`);
    lines.push('');

    const passRate = ((batchResult.summary.passed / batchResult.total_files) * 100).toFixed(1);
    lines.push(`Pass Rate: ${passRate}%`);
    lines.push('');

    // Group results by status
    const failed = batchResult.results.filter(r => r.status === 'FAIL');
    const passed = batchResult.results.filter(r => r.status === 'PASS');
    const skipped = batchResult.results.filter(r => r.status === 'SKIP' || r.status === 'ERROR');

    if (failed.length > 0) {
      lines.push('─────────────────────────────────────────────────────────────');
      lines.push('FAILED FILES');
      lines.push('─────────────────────────────────────────────────────────────');
      failed.forEach(result => {
        lines.push(`✗ ${result.fileName}`);
        lines.push(`  Directory: ${result.directory}`);
        lines.push(`  Errors: ${result.error_count}`);
        if (result.errors.length > 0) {
          result.errors.slice(0, 3).forEach(err => {
            lines.push(`    - ${err}`);
          });
          if (result.errors.length > 3) {
            lines.push(`    ... and ${result.errors.length - 3} more`);
          }
        }
        lines.push('');
      });
    }

    if (passed.length > 0) {
      lines.push('─────────────────────────────────────────────────────────────');
      lines.push('PASSED FILES');
      lines.push('─────────────────────────────────────────────────────────────');
      passed.forEach(result => {
        lines.push(`✓ ${result.fileName}`);
      });
      lines.push('');
    }

    if (skipped.length > 0) {
      lines.push('─────────────────────────────────────────────────────────────');
      lines.push('SKIPPED/ERROR FILES');
      lines.push('─────────────────────────────────────────────────────────────');
      skipped.forEach(result => {
        lines.push(`• ${result.fileName} (${result.status})`);
        if (result.errors.length > 0) {
          lines.push(`  Reason: ${result.errors[0]}`);
        }
      });
      lines.push('');
    }

    // Group statistics by directory
    const groupedResults = this.groupResultsByDirectory(batchResult.results);
    if (Object.keys(groupedResults).length > 1) {
      lines.push('─────────────────────────────────────────────────────────────');
      lines.push('STATISTICS BY DIRECTORY');
      lines.push('─────────────────────────────────────────────────────────────');

      Object.entries(groupedResults).forEach(([dir, results]) => {
        const dirName = path.basename(dir);
        const passed = results.filter(r => r.status === 'PASS').length;
        const failed = results.filter(r => r.status === 'FAIL').length;
        const total = results.length;
        const passRate = ((passed / total) * 100).toFixed(0);

        lines.push(`${dirName}:`);
        lines.push(`  ${passed}/${total} passed (${passRate}%)`);
      });
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Group results by directory
   * @param {array} results - Test results
   * @returns {object} Results grouped by directory
   */
  groupResultsByDirectory(results) {
    const groups = {};

    results.forEach(result => {
      const dir = result.directory;
      if (!groups[dir]) {
        groups[dir] = [];
      }
      groups[dir].push(result);
    });

    return groups;
  }

  /**
   * Export results to JSON
   * @param {object} batchResult - Batch test results
   * @param {string} outputPath - Output file path
   */
  exportToJSON(batchResult, outputPath) {
    try {
      fs.writeFileSync(outputPath, JSON.stringify(batchResult, null, 2), 'utf8');
      console.log(`Results exported to: ${outputPath}`);
    } catch (error) {
      console.error(`Failed to export results: ${error.message}`);
    }
  }

  /**
   * Export results to CSV
   * @param {object} batchResult - Batch test results
   * @param {string} outputPath - Output file path
   */
  exportToCSV(batchResult, outputPath) {
    try {
      const lines = [];
      lines.push('File,Directory,Status,Errors,Warnings');

      batchResult.results.forEach(result => {
        const row = [
          result.fileName,
          result.directory,
          result.status,
          result.error_count,
          result.warning_count
        ].join(',');
        lines.push(row);
      });

      fs.writeFileSync(outputPath, lines.join('\n'), 'utf8');
      console.log(`Results exported to: ${outputPath}`);
    } catch (error) {
      console.error(`Failed to export CSV: ${error.message}`);
    }
  }
}

// Export for module use
module.exports = {
  BatchTestRunner,
  FileScanner
};

// CLI support
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help')) {
    console.log('Faust Batch Testing Runner');
    console.log('');
    console.log('Usage:');
    console.log('  node batch-tester.js <directory>                    # Test all .dsp files in directory');
    console.log('  node batch-tester.js <file1.dsp> <file2.dsp> ...    # Test specific files');
    console.log('');
    console.log('Options:');
    console.log('  --verbose              Detailed output for each file');
    console.log('  --no-recursive         Don\'t scan subdirectories');
    console.log('  --analyze-syntax       Include syntax analysis');
    console.log('  --export-json=<file>   Export results to JSON');
    console.log('  --export-csv=<file>    Export results to CSV');
    console.log('');
    console.log('Examples:');
    console.log('  # Test all examples');
    console.log('  node batch-tester.js examples/');
    console.log('');
    console.log('  # Test specific files with verbose output');
    console.log('  node batch-tester.js examples/oscillators/*.dsp --verbose');
    console.log('');
    console.log('  # Test directory and export results');
    console.log('  node batch-tester.js examples/ --export-json=results.json');
    process.exit(0);
  }

  const options = {
    verbose: args.includes('--verbose'),
    recursive: !args.includes('--no-recursive'),
    analyzeSyntax: args.includes('--analyze-syntax')
  };

  let exportJSON = null;
  let exportCSV = null;

  // Parse export options
  args.forEach(arg => {
    if (arg.startsWith('--export-json=')) {
      exportJSON = arg.split('=')[1];
    } else if (arg.startsWith('--export-csv=')) {
      exportCSV = arg.split('=')[1];
    }
  });

  const targets = args.filter(arg => !arg.startsWith('--'));

  if (targets.length === 0) {
    console.error('Error: No files or directories specified');
    process.exit(1);
  }

  const runner = new BatchTestRunner(options);

  (async () => {
    try {
      let results;

      // Determine if target is directory or files
      const firstTarget = targets[0];
      const isDirectory = fs.existsSync(firstTarget) && fs.statSync(firstTarget).isDirectory();

      if (isDirectory) {
        results = await runner.runDirectoryTests(firstTarget, options);
      } else {
        // Assume file paths
        const files = targets.filter(f => fs.existsSync(f));
        results = await runner.runBatchTests(files, options);
      }

      console.log('');
      console.log(runner.formatReport(results));

      // Export if requested
      if (exportJSON) {
        runner.exportToJSON(results, exportJSON);
      }
      if (exportCSV) {
        runner.exportToCSV(results, exportCSV);
      }

      // Exit with appropriate code
      process.exit(results.summary.failed > 0 ? 1 : 0);

    } catch (error) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  })();
}
