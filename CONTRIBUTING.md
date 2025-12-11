# Contributing to Faust MCP

Welcome to the Faust MCP project! We're excited to have you contribute to this comprehensive DSP language integration for Claude AI.

**This document explains how to contribute code, documentation, examples, and error patterns to the project.**

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Contribution Types](#contribution-types)
3. [Development Setup](#development-setup)
4. [Coding Standards](#coding-standards)
5. [Documentation Standards](#documentation-standards)
6. [Adding Examples](#adding-examples)
7. [Adding Error Patterns](#adding-error-patterns)
8. [Testing Your Changes](#testing-your-changes)
9. [Submitting Changes](#submitting-changes)
10. [Code of Conduct](#code-of-conduct)

---

## Getting Started

### Prerequisites

- macOS 10.14+, Linux (Ubuntu 18.04+), or Windows (WSL2)
- Node.js 14+ and npm
- Faust 2.x+ (`brew install faust`)
- Git
- Claude Code (optional, for testing skill integration)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/jessesep/faust-mcp-test.git
cd faust-mcp-test

# Install dependencies
npm install

# Verify setup
npm test

# Run integration tests
node integration-tests.js
```

---

## Contribution Types

### 1. Bug Fixes & Issues

**Priority**: High

Bug fixes improve reliability and stability of the project.

**Process**:
1. Create an issue describing the bug
2. Fork the repository
3. Create a branch: `git checkout -b fix/issue-name`
4. Make minimal changes to fix the issue
5. Add tests if applicable
6. Submit a pull request

**Example**:
```bash
git checkout -b fix/syntax-analyzer-edge-case
# ... fix the code ...
git push origin fix/syntax-analyzer-edge-case
# Create pull request
```

### 2. Documentation Improvements

**Priority**: High

Better documentation helps users understand and use the project.

**Types**:
- Fixing typos or grammar
- Clarifying existing guides
- Adding missing sections
- Improving examples
- Updating guides with new insights

**Process**:
1. Fork the repository
2. Create a branch: `git checkout -b docs/topic-name`
3. Make edits to markdown files
4. Verify formatting and links
5. Submit a pull request

**Example**:
```bash
git checkout -b docs/improve-filter-guide
# ... edit docs/FAUST-BEST-PRACTICES.md ...
git push origin docs/improve-filter-guide
```

### 3. Code Examples

**Priority**: High

New examples expand the project's reference library and help users learn.

**Requirements**:
- Must be syntactically correct Faust code
- Must include comments explaining the code
- Must demonstrate a specific concept or technique
- Must be tested and working
- Must include a brief README

**Process**:
1. Fork the repository
2. Create a branch: `git checkout -b examples/feature-name`
3. Create example in `docs/examples/{category}/`
4. Add comments and documentation
5. Test the example works
6. Submit a pull request

**Categories** (see `docs/examples/`):
- `oscillators/` - Wave generators (sine, square, saw, etc.)
- `filters/` - Frequency filtering
- `effects/` - Audio effects (delay, reverb, etc.)
- `synthesizers/` - Complete instruments
- `control-patterns/` - LFOs, envelopes, modulation
- `utilities/` - Helper functions and patterns

**Example Structure**:

```
docs/examples/filters/butterworth-highpass.dsp
```

```faust
// Butterworth High-Pass Filter
//
// A 4-pole high-pass filter with adjustable cutoff frequency.
// Uses Faust standard library filters for optimal performance.
//
// Inputs:
//   - Audio input
//
// Controls:
//   - Frequency slider: 20 Hz to 20 kHz
//
// Best Practices:
//   - Use this for removing low-frequency rumble
//   - Adjust Q for steeper or gentler roll-off
//   - See: FAUST-BEST-PRACTICES.md for more details

import("stdfaust.lib");

cutoff = hslider("Frequency [unit:Hz]", 1000, 20, 20000, 1);
q = 0.707; // Butterworth (flat response)

process = fi.highpass(4, cutoff);
```

**Submission Process**:
1. Create the `.dsp` file in appropriate category
2. Write clear comments
3. Test: `faust -c {filename}.dsp`
4. Create PR with description of what the example demonstrates

### 4. Error Patterns

**Priority**: Medium-High

Each error pattern added to the database helps users debug problems faster.

**Process**:
1. Identify a Faust error you encounter
2. Document the error in `docs/faust-error-research.md`
3. Include: error message, cause, solution, prevention
4. Add to error database
5. Submit a pull request

**Error Pattern Template**:

```markdown
## Error Pattern: [Error Name]

### Error Message
```
[Exact error message from compiler]
```

### Cause
Clear explanation of what causes this error.

### Example Code (Incorrect)
```faust
[Code that triggers the error]
```

### Solution
Step-by-step fix for the error.

### Corrected Code
```faust
[Fixed code that works]
```

### Prevention
How to avoid this error in the future.

### Related Topics
- [Link to relevant documentation]
- [Link to code example]

### Confidence Score: 95%
```

**Submission**:
1. Edit `docs/faust-error-research.md`
2. Add new error pattern following template
3. Include real error messages and examples
4. Add to error database JSON if applicable
5. Create PR with title: `docs: Add error pattern [name]`

### 5. Framework Improvements

**Priority**: Medium

Enhancements to testing, syntax analysis, or debugging frameworks.

**Process**:
1. Describe the improvement in an issue
2. Fork and create a feature branch
3. Implement the improvement
4. Write unit tests
5. Update documentation
6. Submit a pull request

**Examples**:
- New validators in syntax analyzer
- Additional test patterns
- Improved error diagnosis
- New performance metrics

---

## Development Setup

### Local Development Environment

```bash
# Clone and setup
git clone https://github.com/jessesep/faust-mcp-test.git
cd faust-mcp-test
npm install

# Verify Faust installation
faust --version

# Run tests
npm test

# Run integration tests
node integration-tests.js

# Run specific framework
node testing-framework.js
node syntax-analyzer.js
node debugging-framework.js
```

### Project Structure

```
faust-mcp/
├── docs/                          # Documentation (edit these!)
│   ├── FAUST-LANGUAGE-RESEARCH.md
│   ├── FAUST-BEST-PRACTICES.md
│   ├── MCP-SPECIFICATION.md
│   ├── examples/                  # Add examples here!
│   │   ├── oscillators/
│   │   ├── filters/
│   │   ├── effects/
│   │   ├── synthesizers/
│   │   └── control-patterns/
│   └── guides/                    # Error and technique guides
│
├── scripts/                       # Utility scripts
├── tools/                         # CLI tools
└── {framework}.js                 # Implementation code
    ├── testing-framework.js
    ├── syntax-analyzer.js
    ├── debugging-framework.js
    └── integration-tests.js
```

---

## Coding Standards

### JavaScript Code Style

**Formatting**:
- Use 2-space indentation (no tabs)
- Max line length: 100 characters
- Use semicolons consistently
- Use meaningful variable names

**Example**:
```javascript
// Good
const validateFaustCode = (code) => {
  const lines = code.split('\n');
  return lines.every(line =>
    !line.includes('invalid_syntax')
  );
};

// Avoid
const v = (c) => c.split('\n').every(l => !l.includes('bad'));
```

**Functions**:
- One responsibility per function
- Clear parameter names
- Clear return values
- Add JSDoc comments for complex functions

```javascript
/**
 * Analyzes Faust code structure
 * @param {string} code - Faust source code
 * @returns {Object} Structure analysis with processes and parameters
 */
const analyzeStructure = (code) => {
  // Implementation
};
```

**Error Handling**:
- Use try-catch for recoverable errors
- Provide meaningful error messages
- Log important information
- Return error details, not just true/false

```javascript
try {
  const result = compileFaust(code);
  return { success: true, output: result };
} catch (error) {
  return {
    success: false,
    error: error.message,
    details: error.details
  };
}
```

### Faust Code Style

**Best Practices**:
- Use descriptive signal names
- Add comments for complex sections
- Follow Faust conventions (lowercase, underscores)
- Use standard library functions
- Test with edge cases

**Example**:
```faust
// Good: Clear, documented
import("stdfaust.lib");

// Control inputs
freq = hslider("Frequency [unit:Hz]", 1000, 20, 20000, 1);
cutoff = hslider("Cutoff [unit:Hz]", 5000, 100, 20000, 1);

// Filter chain
process = os.osc(freq) : fi.lowpass(3, cutoff);

// Avoid: Unclear
import("stdfaust.lib");
f = hslider("f", 1000, 20, 20000, 1);
c = hslider("c", 5000, 100, 20000, 1);
process = os.osc(f) : fi.lowpass(3, c);
```

---

## Documentation Standards

### Markdown Style

**Formatting**:
- Use ATX headers (# H1, ## H2, etc.)
- Use backticks for code: `inline_code`
- Use triple backticks for code blocks with language
- Use tables for structured data
- Use bold **emphasis** sparingly
- Line length: 100 characters where reasonable

**File Naming**:
- Use UPPERCASE-WITH-DASHES for main docs
- Use lowercase-with-dashes for guides and subdivisions
- Example: `FAUST-BEST-PRACTICES.md`, `guides/beginner-mistakes.md`

**Structure**:
```markdown
# Title

Brief introduction paragraph.

---

## Section 1

Content with subsections as needed.

### Subsection

More detailed content.

---

## Section 2

More sections...

---

## See Also

Links to related documentation
```

### Link Conventions

**Internal Links**:
```markdown
[Link Text](path/to/file.md)        # Relative paths preferred
[FAUST-BEST-PRACTICES](docs/FAUST-BEST-PRACTICES.md)
```

**External Links**:
```markdown
[Faust Official](https://faust.grame.fr/)
[Claude AI](https://anthropic.com/)
```

**Backreferences**:
Add "See Also" sections linking to related docs.

### Code Examples in Docs

**Format**:
```markdown
# Example Title

Brief explanation.

**Inputs:**
- Description of inputs

**Controls:**
- Description of UI controls

**Output:**
- Description of output

**Code:**
\`\`\`faust
// Code here
\`\`\`

**Explanation:**
Detailed explanation of what the code does.
```

**Tips**:
- Keep examples focused on one concept
- Include comments in code
- Test all code examples
- Show both good and bad patterns

---

## Adding Examples

### Step-by-Step Example Contribution

**1. Choose a Category**

Decide which category your example fits:
- `oscillators/` - Signal generators
- `filters/` - Frequency filtering
- `effects/` - Audio processing effects
- `synthesizers/` - Complete instruments
- `control-patterns/` - Modulation and control
- `utilities/` - Helper functions

**2. Create the File**

```bash
# Create example file
touch docs/examples/{category}/{example-name}.dsp

# Example:
touch docs/examples/filters/parametric-eq.dsp
```

**3. Write the Code**

Include:
- Clear title comment
- Purpose description
- Input/output documentation
- Control documentation
- Working code with comments
- Reference to best practices if relevant

**Example Template**:
```faust
// [Example Title]
//
// [Brief description of what this does]
//
// Inputs:
//   - [Description of audio input(s)]
//
// Controls:
//   - [Slider/Button 1]: [Description and range]
//   - [Slider/Button 2]: [Description and range]
//
// Outputs:
//   - [Description of audio output]
//
// Notes:
//   - [Any important notes or limitations]
//   - Reference: FAUST-BEST-PRACTICES.md section on [topic]
//
// Related Examples:
//   - See: docs/examples/{category}/{related}.dsp

import("stdfaust.lib");

// ... your code here ...

process = /* your processing chain */;
```

**4. Test the Example**

```bash
# Verify syntax
faust -c docs/examples/{category}/{example}.dsp

# If available, test compilation
faust -o /tmp/test.cpp docs/examples/{category}/{example}.dsp
```

**5. Document in PR**

```markdown
## Example: [Title]

**Category**: oscillators

**Description**:
Brief description of what this example demonstrates.

**Skills Demonstrated**:
- Concept 1
- Concept 2
- Concept 3

**Related**:
- Links to related documentation
- Links to related examples
```

### Example Contribution Checklist

- [ ] File in correct category directory
- [ ] Comments explain purpose and usage
- [ ] Code is syntactically correct
- [ ] Code follows Faust style guidelines
- [ ] Input/output/control documented
- [ ] Tested and verified working
- [ ] References related documentation
- [ ] PR description explains contribution
- [ ] No external dependencies (use stdlib)

---

## Adding Error Patterns

### Step-by-Step Error Pattern Contribution

**1. Identify the Error**

When you encounter an error, capture:
- Exact error message from compiler
- The code that caused it
- Why it happened
- How to fix it
- How to prevent it

**2. Document the Pattern**

Edit `docs/faust-error-research.md` and add section:

```markdown
## Error: [Error Name]

### Error Message
"""
[Exact compiler output]
"""

### Root Cause
[Explain what causes this error]

### Code Example (Incorrect)
"""faust
[Code that triggers error]
"""

### Solution
[Step-by-step fix]

### Corrected Code
"""faust
[Working code]
"""

### Prevention
[How to avoid in future]

### Related
- See: [Link to docs]
- Similar: [Link to other error patterns]
```

**3. Add to Database (if applicable)**

Update `docs/data/error-patterns/` JSON files if maintaining error database.

**4. Test Your Pattern**

Verify:
- Error message is accurate
- Code example actually causes error
- Solution actually fixes it
- Corrected code runs

**5. Submit PR**

```bash
git checkout -b docs/error-pattern-descriptive-name
# ... make changes ...
git push origin docs/error-pattern-descriptive-name
```

PR should reference:
- Issue number (if created)
- Error pattern being added
- Frequency/importance of error

---

## Testing Your Changes

### Running Tests

**Framework Tests**:
```bash
# Test syntax analyzer
node syntax-analyzer.js

# Test debugging framework
node debugging-framework.js

# Test testing framework
node testing-framework.js

# Run all integration tests
node integration-tests.js
```

**Manual Testing**:
```bash
# Test your Faust example
faust -c docs/examples/{category}/{example}.dsp

# Validate against style guide
# (Check formatting, comments, structure)
```

### Code Review Checklist

Before submitting a PR, verify:

**For Documentation**:
- [ ] Spelling and grammar correct
- [ ] Links are valid and working
- [ ] Formatting is consistent
- [ ] Code examples are tested
- [ ] Matches existing documentation style
- [ ] Clear and helpful to readers

**For Code Examples**:
- [ ] Faust code is syntactically correct
- [ ] Code demonstrates clear concept
- [ ] Comments explain the code
- [ ] Input/output documented
- [ ] Follows Faust style guidelines
- [ ] Related docs linked

**For Bug Fixes**:
- [ ] Fix is minimal and focused
- [ ] Includes test cases if possible
- [ ] Documentation updated if needed
- [ ] No unrelated changes included

**For Framework Improvements**:
- [ ] Clear purpose and benefit
- [ ] Backward compatible or deprecated gracefully
- [ ] Includes tests
- [ ] Documentation updated
- [ ] Performance acceptable

---

## Submitting Changes

### Pull Request Process

**1. Fork the Repository**
```bash
# Click "Fork" on GitHub
# Clone your fork
git clone https://github.com/your-username/faust-mcp-test.git
cd faust-mcp-test
```

**2. Create a Branch**
```bash
# Use descriptive branch names
git checkout -b type/feature-name

# Types: fix, docs, examples, feature, enhance
# Examples:
#   fix/syntax-analyzer-bug
#   docs/add-filter-guide
#   examples/wavetable-synth
#   feature/new-error-pattern
```

**3. Make Changes**
```bash
# Edit files
# Test your changes
# Commit frequently with clear messages
```

**4. Commit with Clear Messages**

```bash
# Format: type: brief description
git commit -m "docs: Add low-pass filter example"
git commit -m "fix: Handle edge case in syntax analyzer"
git commit -m "examples: Add wavetable synthesizer"

# Detailed commits for larger changes:
git commit -m "examples: Add wavetable synthesizer

This example demonstrates:
- Wavetable generation using table reading
- Bilinear interpolation for smooth playback
- Polyphonic voice management
- ADSR envelope control

Related: FAUST-BEST-PRACTICES.md section on synthesis"
```

**5. Push to Your Fork**
```bash
git push origin type/feature-name
```

**6. Create Pull Request**

On GitHub:
1. Click "Compare & pull request"
2. Fill in title: `type: brief description`
3. Fill in description explaining:
   - What changes were made
   - Why changes were needed
   - Links to related issues/docs
   - Any testing performed

**Example PR Description**:
```markdown
## Description
Add a wavetable synthesizer example demonstrating advanced synthesis techniques.

## Changes
- Added `docs/examples/synthesizers/wavetable-synth.dsp`
- Demonstrates lookup table synthesis
- Includes polyphony and ADSR envelope

## Motivation
Users requested synthesis examples beyond basic oscillators. This example fills that gap and teaches wavetable synthesis techniques.

## Related
- Closes #123 (if applicable)
- Related to: FAUST-BEST-PRACTICES.md synthesis section

## Testing
- Verified Faust syntax: `faust -c docs/examples/synthesizers/wavetable-synth.dsp`
- Code compiles without errors
- Demonstrates intended functionality
```

### PR Guidelines

**Do**:
- Keep PRs focused and reasonably sized
- Reference related issues or PRs
- Provide clear descriptions
- Test changes before submitting
- Respond to feedback promptly
- Be respectful and professional

**Don't**:
- Mix multiple unrelated changes
- Submit untested code
- Include unnecessary whitespace changes
- Make changes outside scope
- Ignore review feedback

### Review Process

Once submitted:
1. Automated checks run
2. Maintainers review changes
3. Feedback provided if needed
4. Once approved, PR is merged
5. Changes appear in main branch

---

## Code of Conduct

### Our Commitment

We are committed to providing a welcoming and inclusive environment for all contributors, regardless of background or experience.

### Expected Behavior

- Be respectful and inclusive
- Provide constructive feedback
- Focus on the code, not the person
- Help others learn and grow
- Follow project guidelines

### Unacceptable Behavior

- Harassment or discrimination
- Disrespectful or offensive comments
- Deliberate disruption
- Unethical behavior

### Reporting Issues

If you experience or witness unacceptable behavior:
1. Document the incident
2. Contact maintainers privately
3. Provide context and details
4. Allow for investigation and response

---

## Recognition

Contributors are recognized in:
- Pull request acknowledgments
- Project changelog/release notes
- Contributors list (maintained)
- Hall of Fame (significant contributions)

---

## Questions?

- Check documentation in `/docs`
- Review existing examples in `/docs/examples`
- Look at similar PRs for patterns
- Open a discussion issue for questions

---

## License

By contributing to this project, you agree that your contributions will be licensed under the Apache 2.0 License (same as the project).

---

**Thank you for contributing to Faust MCP!**

Together, we're making DSP development better for everyone.

For more information:
- Repository: https://github.com/jessesep/faust-mcp-test
- Issues: https://github.com/jessesep/faust-mcp-test/issues
- Documentation: See README.md
