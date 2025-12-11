/**
 * Faust Error Pattern Matcher
 *
 * Matches errors against known pattern database and provides solutions
 *
 * @module pattern-matcher
 */

const fs = require('fs');
const path = require('path');

/**
 * Load error patterns from JSON files
 * @param {string} patternsDir - Directory containing pattern files
 * @returns {Object} Loaded patterns by category
 */
function loadPatterns(patternsDir) {
  const patterns = {
    syntax: [],
    type: [],
    signal: [],
    composition: [],
    compilation: []
  };

  const categories = Object.keys(patterns);

  for (const category of categories) {
    const filename = `${category}-errors.json`;
    const filepath = path.join(patternsDir, filename);

    try {
      if (fs.existsSync(filepath)) {
        const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
        patterns[category] = data.patterns || [];
      }
    } catch (error) {
      console.warn(`Warning: Could not load ${filename}: ${error.message}`);
    }
  }

  return patterns;
}

/**
 * Match error message against pattern database
 * @param {string} errorMessage - Error message to match
 * @param {Object} patterns - Pattern database
 * @returns {Array} Matched patterns with confidence scores
 */
function matchError(errorMessage, patterns) {
  const matches = [];
  const messageLower = errorMessage.toLowerCase();

  // Search all categories
  for (const category in patterns) {
    for (const pattern of patterns[category]) {
      try {
        const regex = new RegExp(pattern.pattern, 'i');

        if (regex.test(errorMessage)) {
          // Calculate confidence based on pattern specificity
          let confidence = 0.5;

          // Boost confidence for exact matches
          if (pattern.description && messageLower.includes(pattern.description.toLowerCase())) {
            confidence += 0.3;
          }

          // Boost for matching category keywords
          const categoryKeywords = {
            syntax: ['syntax', 'expected', 'semicolon', 'undefined'],
            type: ['type', 'domain', 'division', 'modulo'],
            signal: ['causality', 'delay', 'feedback', 'recursive'],
            composition: ['dimension', 'mismatch', 'inputs', 'outputs'],
            compilation: ['architecture', 'import', 'library', 'backend']
          };

          const keywords = categoryKeywords[category] || [];
          for (const keyword of keywords) {
            if (messageLower.includes(keyword)) {
              confidence += 0.05;
            }
          }

          confidence = Math.min(1.0, confidence);

          matches.push({
            ...pattern,
            category,
            confidence,
            matched_pattern: pattern.pattern
          });
        }
      } catch (error) {
        // Invalid regex, skip
        console.warn(`Warning: Invalid pattern regex: ${pattern.pattern}`);
      }
    }
  }

  // Sort by confidence (highest first)
  matches.sort((a, b) => b.confidence - a.confidence);

  return matches;
}

/**
 * Get top solution for error
 * @param {Array} matches - Matched patterns
 * @param {number} count - Number of top matches to return
 * @returns {Array} Top solutions
 */
function getTopSolutions(matches, count = 3) {
  return matches.slice(0, count).map(match => ({
    error_id: match.error_id,
    description: match.description,
    confidence: match.confidence,
    solutions: match.solutions || [],
    related_errors: match.related_errors || [],
    beginner_friendly: match.beginner_friendly || false
  }));
}

/**
 * Format solution for display
 * @param {Object} solution - Solution object
 * @returns {string} Formatted solution text
 */
function formatSolution(solution) {
  let text = `\n## ${solution.description}\n\n`;
  text += `**Confidence:** ${(solution.confidence * 100).toFixed(0)}%\n`;
  text += `**Beginner Friendly:** ${solution.beginner_friendly ? 'Yes' : 'No'}\n\n`;

  if (solution.solutions && solution.solutions.length > 0) {
    text += `### Solutions:\n\n`;

    solution.solutions.forEach((sol, index) => {
      text += `#### ${index + 1}. ${sol.approach}\n\n`;

      if (sol.code_before) {
        text += `**Before:**\n\`\`\`faust\n${sol.code_before}\n\`\`\`\n\n`;
      }

      if (sol.code_after) {
        text += `**After:**\n\`\`\`faust\n${sol.code_after}\n\`\`\`\n\n`;
      }

      if (sol.explanation) {
        text += `**Why:** ${sol.explanation}\n\n`;
      }
    });
  }

  if (solution.related_errors && solution.related_errors.length > 0) {
    text += `### Related Errors:\n`;
    solution.related_errors.forEach(rel => {
      text += `- ${rel}\n`;
    });
    text += '\n';
  }

  return text;
}

module.exports = {
  loadPatterns,
  matchError,
  getTopSolutions,
  formatSolution
};
