#!/usr/bin/env node

/**
 * Faust Auto-Fix Tool
 *
 * Automatically fixes common syntax issues detected by the syntax analyzer.
 * Provides safe, reversible fixes with preview and backup options.
 */

const fs = require('fs');
const path = require('path');
const { SyntaxAnalyzerTool } = require('./syntax-analyzer');

/**
 * FixRule: Base class for fix rules
 */
class FixRule {
  constructor(name, description, severity) {
    this.name = name;
    this.description = description;
    this.severity = severity; // 'safe', 'moderate', 'risky'
  }

  /**
   * Check if rule applies to code
   * @param {string} code - Faust code
   * @param {object} analysis - Syntax analysis result
   * @returns {boolean} True if rule applies
   */
  applies(code, analysis) {
    return false;
  }

  /**
   * Apply fix to code
   * @param {string} code - Faust code
   * @param {object} analysis - Syntax analysis result
   * @returns {object} Fix result
   */
  fix(code, analysis) {
    return {
      success: false,
      message: 'Not implemented'
    };
  }
}

/**
 * AddMissingImportFix: Add missing stdfaust.lib import
 */
class AddMissingImportFix extends FixRule {
  constructor() {
    super(
      'add-missing-import',
      'Add missing import("stdfaust.lib")',
      'safe'
    );
  }

  applies(code, analysis) {
    // Check if code uses library functions but doesn't import stdfaust.lib
    const hasLibraryUsage = /\b(os\.|ma\.|fi\.|si\.|ba\.|co\.|de\.|pf\.|ef\.|ho\.|re\.|en\.)/.test(code);
    const hasStdImport = code.includes('import("stdfaust.lib")');

    // Also check linting issues if available
    const lintingIssue = analysis.linting && analysis.linting.issues && analysis.linting.issues.some(
      issue => issue.message && issue.message.includes('stdfaust.lib not imported')
    );

    return (hasLibraryUsage || lintingIssue) && !hasStdImport;
  }

  fix(code, analysis) {
    // Add import at the beginning
    const lines = code.split('\n');
    let insertIndex = 0;

    // Skip leading comments
    while (insertIndex < lines.length &&
           (lines[insertIndex].trim().startsWith('//') ||
            lines[insertIndex].trim().startsWith('/*') ||
            lines[insertIndex].trim() === '')) {
      insertIndex++;
    }

    lines.splice(insertIndex, 0, 'import("stdfaust.lib");', '');

    return {
      success: true,
      code: lines.join('\n'),
      message: 'Added import("stdfaust.lib");',
      changes: [
        {
          type: 'INSERT',
          line: insertIndex + 1,
          content: 'import("stdfaust.lib");'
        }
      ]
    };
  }
}

/**
 * AddMissingSemicolonFix: Add missing semicolons
 */
class AddMissingSemicolonFix extends FixRule {
  constructor() {
    super(
      'add-missing-semicolon',
      'Add missing semicolons to statements',
      'moderate'
    );
  }

  applies(code, analysis) {
    return analysis.syntax.errors.some(
      err => err.message && err.message.toLowerCase().includes('semicolon')
    );
  }

  fix(code, analysis) {
    const lines = code.split('\n');
    const changes = [];
    let modified = false;

    // Find lines that need semicolons
    const semicolonErrors = analysis.syntax.errors.filter(
      err => err.message && err.message.toLowerCase().includes('semicolon') && err.line
    );

    semicolonErrors.forEach(error => {
      const lineIndex = error.line - 1;
      if (lineIndex >= 0 && lineIndex < lines.length) {
        const line = lines[lineIndex];

        // Check if line doesn't already end with semicolon
        if (!line.trim().endsWith(';') && !line.trim().endsWith('{') && !line.trim().endsWith('}')) {
          lines[lineIndex] = line.trimEnd() + ';';
          changes.push({
            type: 'MODIFY',
            line: error.line,
            content: lines[lineIndex]
          });
          modified = true;
        }
      }
    });

    if (!modified) {
      return {
        success: false,
        message: 'No semicolon fixes applied'
      };
    }

    return {
      success: true,
      code: lines.join('\n'),
      message: `Added ${changes.length} missing semicolon(s)`,
      changes
    };
  }
}

/**
 * FixSliderRangeFix: Fix slider default values outside range
 */
class FixSliderRangeFix extends FixRule {
  constructor() {
    super(
      'fix-slider-range',
      'Fix slider default values to be within min/max range',
      'safe'
    );
  }

  applies(code, analysis) {
    return analysis.linting.issues.some(
      issue => issue.message && issue.message.includes('default') && issue.message.includes('outside range')
    );
  }

  fix(code, analysis) {
    let fixedCode = code;
    const changes = [];

    const sliderPattern = /hslider\s*\(\s*"([^"]+)"\s*,\s*([\d.-]+)\s*,\s*([\d.-]+)\s*,\s*([\d.-]+)\s*,\s*([\d.]+)\s*\)/g;
    let match;

    while ((match = sliderPattern.exec(code)) !== null) {
      const [fullMatch, name, def, min, max, step] = match;
      const defVal = parseFloat(def);
      const minVal = parseFloat(min);
      const maxVal = parseFloat(max);

      if (defVal < minVal || defVal > maxVal) {
        // Clamp default to range
        const newDef = Math.max(minVal, Math.min(maxVal, defVal));
        const replacement = `hslider("${name}", ${newDef}, ${min}, ${max}, ${step})`;
        fixedCode = fixedCode.replace(fullMatch, replacement);

        changes.push({
          type: 'MODIFY',
          slider: name,
          old_default: defVal,
          new_default: newDef,
          content: replacement
        });
      }
    }

    if (changes.length === 0) {
      return {
        success: false,
        message: 'No slider range fixes needed'
      };
    }

    return {
      success: true,
      code: fixedCode,
      message: `Fixed ${changes.length} slider range(s)`,
      changes
    };
  }
}

/**
 * FixNamingConventionFix: Convert uppercase identifiers to lowercase
 */
class FixNamingConventionFix extends FixRule {
  constructor() {
    super(
      'fix-naming-convention',
      'Convert uppercase identifiers to lowercase',
      'risky'
    );
  }

  applies(code, analysis) {
    return analysis.linting.issues.some(
      issue => issue.severity === 'style' && issue.message && issue.message.includes('uppercase')
    );
  }

  fix(code, analysis) {
    // Extract definitions with uppercase
    const defRegex = /([A-Z][a-zA-Z0-9_]*)\s*(?:\([^)]*\))?\s*=/g;
    const changes = [];
    let fixedCode = code;

    const uppercaseDefs = [];
    let match;

    while ((match = defRegex.exec(code)) !== null) {
      const name = match[1];
      if (/[A-Z]/.test(name)) {
        uppercaseDefs.push(name);
      }
    }

    // Replace each uppercase identifier with lowercase
    uppercaseDefs.forEach(name => {
      const lowerName = name.toLowerCase();

      // Use word boundaries to avoid partial replacements
      const regex = new RegExp(`\\b${name}\\b`, 'g');
      fixedCode = fixedCode.replace(regex, lowerName);

      changes.push({
        type: 'RENAME',
        old_name: name,
        new_name: lowerName
      });
    });

    if (changes.length === 0) {
      return {
        success: false,
        message: 'No naming convention fixes needed'
      };
    }

    return {
      success: true,
      code: fixedCode,
      message: `Renamed ${changes.length} identifier(s) to lowercase`,
      changes
    };
  }
}

/**
 * AddMissingProcessFix: Add process declaration
 */
class AddMissingProcessFix extends FixRule {
  constructor() {
    super(
      'add-missing-process',
      'Add missing process declaration',
      'moderate'
    );
  }

  applies(code, analysis) {
    return !code.includes('process') && analysis.syntax.warnings.some(
      w => w.type === 'MISSING_PROCESS'
    );
  }

  fix(code, analysis) {
    // Try to find the last definition to use as process
    const definitions = analysis.syntax.ast.definitions || [];

    if (definitions.length === 0) {
      return {
        success: false,
        message: 'No definitions found to create process from'
      };
    }

    const lastDef = definitions[definitions.length - 1];
    const processLine = `process = ${lastDef.name};`;

    const lines = code.split('\n');
    lines.push('');
    lines.push('// Auto-generated process declaration');
    lines.push(processLine);

    return {
      success: true,
      code: lines.join('\n'),
      message: `Added process = ${lastDef.name};`,
      changes: [
        {
          type: 'INSERT',
          line: lines.length,
          content: processLine
        }
      ]
    };
  }
}

/**
 * AutoFixer: Main auto-fix orchestrator
 */
class AutoFixer {
  constructor(options = {}) {
    this.analyzer = new SyntaxAnalyzerTool();
    this.rules = this.buildRules();
    this.options = {
      safeOnly: options.safeOnly || false,
      backup: options.backup !== false,
      ...options
    };
  }

  /**
   * Build fix rules
   */
  buildRules() {
    return [
      new AddMissingImportFix(),
      new AddMissingSemicolonFix(),
      new FixSliderRangeFix(),
      new AddMissingProcessFix(),
      new FixNamingConventionFix()
    ];
  }

  /**
   * Analyze and fix code
   * @param {string} code - Faust code
   * @returns {object} Fix result
   */
  analyzeAndFix(code) {
    const result = {
      original_code: code,
      fixed_code: code,
      analysis: null,
      fixes_applied: [],
      success: false,
      iterations: 0,
      max_iterations: 5
    };

    let currentCode = code;
    let fixesApplied = true;

    // Iteratively apply fixes
    while (fixesApplied && result.iterations < result.max_iterations) {
      fixesApplied = false;
      result.iterations++;

      // Analyze current code
      const analysis = this.analyzer.analyzeComplete(currentCode);
      result.analysis = analysis;

      // Apply applicable fixes
      for (const rule of this.rules) {
        // Skip risky fixes if safeOnly mode
        if (this.options.safeOnly && rule.severity === 'risky') {
          continue;
        }

        if (rule.applies(currentCode, analysis)) {
          const fixResult = rule.fix(currentCode, analysis);

          if (fixResult.success) {
            currentCode = fixResult.code;
            result.fixes_applied.push({
              rule: rule.name,
              description: rule.description,
              severity: rule.severity,
              message: fixResult.message,
              changes: fixResult.changes
            });
            fixesApplied = true;

            // Re-analyze after each fix
            break;
          }
        }
      }
    }

    result.fixed_code = currentCode;
    result.success = result.fixes_applied.length > 0;

    return result;
  }

  /**
   * Fix file with backup
   * @param {string} filePath - Path to .dsp file
   * @param {object} options - Fix options
   * @returns {object} Fix result
   */
  fixFile(filePath, options = {}) {
    if (!fs.existsSync(filePath)) {
      return {
        success: false,
        error: `File not found: ${filePath}`
      };
    }

    try {
      const code = fs.readFileSync(filePath, 'utf8');
      const fixResult = this.analyzeAndFix(code);

      if (!fixResult.success) {
        return {
          success: false,
          message: 'No fixes applied',
          file: filePath
        };
      }

      // Create backup if requested
      if (this.options.backup) {
        const backupPath = filePath + '.backup';
        fs.writeFileSync(backupPath, code, 'utf8');
        fixResult.backup_path = backupPath;
      }

      // Write fixed code
      if (!options.preview) {
        fs.writeFileSync(filePath, fixResult.fixed_code, 'utf8');
      }

      return {
        success: true,
        file: filePath,
        backup_path: fixResult.backup_path,
        fixes_applied: fixResult.fixes_applied,
        iterations: fixResult.iterations,
        preview: options.preview ? fixResult.fixed_code : null
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        file: filePath
      };
    }
  }

  /**
   * Format fix report
   * @param {object} fixResult - Result from analyzeAndFix or fixFile
   * @returns {string} Formatted report
   */
  formatReport(fixResult) {
    const lines = [];

    lines.push('╔════════════════════════════════════════════════════════════╗');
    lines.push('║           FAUST AUTO-FIX REPORT                            ║');
    lines.push('╚════════════════════════════════════════════════════════════╝');
    lines.push('');

    if (fixResult.file) {
      lines.push(`File: ${fixResult.file}`);
      if (fixResult.backup_path) {
        lines.push(`Backup: ${fixResult.backup_path}`);
      }
      lines.push('');
    }

    if (!fixResult.success) {
      lines.push(`Status: No fixes applied`);
      if (fixResult.error) {
        lines.push(`Error: ${fixResult.error}`);
      }
      return lines.join('\n');
    }

    lines.push(`Status: ${fixResult.fixes_applied.length} fix(es) applied`);
    lines.push(`Iterations: ${fixResult.iterations}`);
    lines.push('');
    lines.push('─────────────────────────────────────────────────────────────');
    lines.push('FIXES APPLIED');
    lines.push('─────────────────────────────────────────────────────────────');

    fixResult.fixes_applied.forEach((fix, idx) => {
      lines.push(`${idx + 1}. ${fix.description}`);
      lines.push(`   Rule: ${fix.rule}`);
      lines.push(`   Severity: ${fix.severity}`);
      lines.push(`   Result: ${fix.message}`);

      if (fix.changes && fix.changes.length > 0) {
        lines.push(`   Changes:`);
        fix.changes.slice(0, 3).forEach(change => {
          if (change.type === 'INSERT') {
            lines.push(`     + Line ${change.line}: ${change.content}`);
          } else if (change.type === 'MODIFY') {
            lines.push(`     ~ Line ${change.line || '?'}: ${change.content || 'modified'}`);
          } else if (change.type === 'RENAME') {
            lines.push(`     → ${change.old_name} → ${change.new_name}`);
          }
        });
        if (fix.changes.length > 3) {
          lines.push(`     ... and ${fix.changes.length - 3} more changes`);
        }
      }
      lines.push('');
    });

    return lines.join('\n');
  }
}

// Export for module use
module.exports = {
  AutoFixer,
  FixRule,
  AddMissingImportFix,
  AddMissingSemicolonFix,
  FixSliderRangeFix,
  FixNamingConventionFix,
  AddMissingProcessFix
};

// CLI support
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help')) {
    console.log('Faust Auto-Fix Tool');
    console.log('');
    console.log('Usage:');
    console.log('  node auto-fixer.js <file.dsp>              # Fix file (creates backup)');
    console.log('  node auto-fixer.js <file.dsp> --preview    # Preview fixes without applying');
    console.log('  node auto-fixer.js <file.dsp> --no-backup  # Fix without creating backup');
    console.log('  node auto-fixer.js <file.dsp> --safe-only  # Apply only safe fixes');
    console.log('');
    console.log('Examples:');
    console.log('  # Preview fixes');
    console.log('  node auto-fixer.js mycode.dsp --preview');
    console.log('');
    console.log('  # Apply all fixes with backup');
    console.log('  node auto-fixer.js mycode.dsp');
    console.log('');
    console.log('  # Apply only safe fixes');
    console.log('  node auto-fixer.js mycode.dsp --safe-only');
    process.exit(0);
  }

  const filePath = args[0];
  const options = {
    preview: args.includes('--preview'),
    backup: !args.includes('--no-backup'),
    safeOnly: args.includes('--safe-only')
  };

  const fixer = new AutoFixer(options);
  const result = fixer.fixFile(filePath, options);

  console.log(fixer.formatReport(result));

  if (options.preview && result.preview) {
    console.log('─────────────────────────────────────────────────────────────');
    console.log('PREVIEW OF FIXED CODE');
    console.log('─────────────────────────────────────────────────────────────');
    console.log(result.preview);
  }

  process.exit(result.success ? 0 : 1);
}
