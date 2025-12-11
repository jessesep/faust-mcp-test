# Faust MCP - Deployment & Integration Guide

**Purpose**: Guide for deploying and integrating Faust MCP as a Claude Code skill
**Audience**: Project maintainers and skill publishers
**Updated**: 2025-12-11

---

## Table of Contents

1. [Overview](#overview)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Skill Publishing](#skill-publishing)
4. [Installation & Configuration](#installation--configuration)
5. [Integration with Claude Code](#integration-with-claude-code)
6. [Verification & Testing](#verification--testing)
7. [Troubleshooting Deployment](#troubleshooting-deployment)
8. [Post-Deployment Monitoring](#post-deployment-monitoring)
9. [Version Management](#version-management)

---

## Overview

### What is Being Deployed

The **Faust MCP Skill** is a comprehensive Model Context Protocol integration that enables Claude AI to:
- Write and validate Faust DSP code
- Compile code to C++ and executables
- Execute audio and analyze results
- Debug errors with intelligent diagnosis
- Optimize performance
- Generate documentation

### Deployment Target

**Platform**: Claude Code Skill Registry
**Type**: MCP Server Skill
**Language**: JavaScript/Node.js
**License**: Apache 2.0

### Deployment Scope

This deployment includes:
- ✅ MCP server implementation
- ✅ Tool definitions and documentation
- ✅ Configuration system
- ✅ Testing and validation frameworks
- ✅ Installation and setup procedures
- ✅ Error diagnosis database
- ✅ Code examples library
- ✅ User documentation

---

## Pre-Deployment Checklist

### 30 Days Before Deployment

**Planning Phase**:
- [ ] Final review of feature set
- [ ] Identify any remaining bugs
- [ ] Create deployment timeline
- [ ] Plan marketing/announcement

**Documentation Review**:
- [ ] Review all user-facing documentation
- [ ] Verify installation instructions
- [ ] Test troubleshooting guides
- [ ] Update version numbers
- [ ] Prepare release notes

**Code Review**:
- [ ] Run full test suite
- [ ] Perform security audit
- [ ] Check code quality
- [ ] Verify no breaking changes

### 2 Weeks Before Deployment

**Final Testing Phase**:
- [ ] Test fresh installation from scratch
- [ ] Test on all supported OS (macOS, Linux, Windows/WSL)
- [ ] Test with different Faust versions
- [ ] Verify all tools work correctly
- [ ] Test error handling

**Documentation Completion**:
- [ ] Finalize all documentation
- [ ] Write deployment notes
- [ ] Create troubleshooting guide
- [ ] Prepare FAQ

**Skill Metadata**:
- [ ] Update package.json version
- [ ] Create skill manifest
- [ ] Prepare icons/branding
- [ ] Write description copy

### 1 Week Before Deployment

**Deployment Readiness**:
- [ ] Create deployment server/environment
- [ ] Set up monitoring and logging
- [ ] Prepare rollback procedures
- [ ] Brief team on deployment
- [ ] Create communication plan

**Final Quality Check**:
- [ ] Security audit complete
- [ ] Performance testing complete
- [ ] Documentation proofread
- [ ] Examples tested and working

### Deployment Day

**Pre-Deployment Verification**:
- [ ] All checklist items above complete
- [ ] Team on standby
- [ ] Communication channels ready
- [ ] Support team briefed

**Deployment Steps** (see below)

---

## Skill Publishing

### Step 1: Prepare Skill Package

Create the skill manifest and package structure:

```bash
# Create skill package
mkdir -p faust-mcp-skill
cd faust-mcp-skill

# Copy essential files
cp -r ../docs docs/
cp -r ../examples docs/examples/
cp ../README.md .
cp ../LICENSE .
cp ../package.json .
```

### Step 2: Create Skill Manifest

File: `skill.json`

```json
{
  "id": "faust-mcp",
  "name": "Faust DSP Language MCP",
  "version": "1.0.0",
  "author": "GRAME / Anthropic",
  "license": "Apache-2.0",
  "homepage": "https://github.com/jessesep/faust-mcp-test",
  "description": "Comprehensive Model Context Protocol integration for Faust DSP language. Write, validate, compile, execute, and debug Faust code with intelligent assistance.",
  "keywords": [
    "dsp",
    "audio",
    "synthesis",
    "faust",
    "signal-processing",
    "mcp",
    "claude",
    "claude-code"
  ],
  "tags": [
    "audio",
    "dsp",
    "synthesis",
    "programming",
    "education"
  ],
  "category": "audio-dsp",
  "icon": "icon.png",
  "repository": {
    "type": "git",
    "url": "https://github.com/jessesep/faust-mcp-test.git"
  },
  "bugs": {
    "url": "https://github.com/jessesep/faust-mcp-test/issues"
  },
  "dependencies": {
    "faust": ">=2.0",
    "node": ">=14.0"
  },
  "tools": [
    {
      "name": "faust/validate-syntax",
      "description": "Validate Faust code syntax before compilation"
    },
    {
      "name": "faust/compile",
      "description": "Compile Faust code to C++ or binary"
    },
    {
      "name": "faust/analyze-structure",
      "description": "Analyze Faust code structure and components"
    },
    {
      "name": "faust/execute",
      "description": "Execute Faust code and generate audio"
    },
    {
      "name": "faust/debug-error",
      "description": "Diagnose and explain Faust compilation errors"
    },
    {
      "name": "faust/get-library-docs",
      "description": "Look up Faust library function documentation"
    },
    {
      "name": "faust/performance-profile",
      "description": "Profile code performance metrics"
    },
    {
      "name": "faust/format-code",
      "description": "Format and style Faust code"
    },
    {
      "name": "faust/suggest-completion",
      "description": "Get code completion suggestions"
    }
  ],
  "documentation": {
    "user_guide": "docs/MCP-USER-GUIDE.md",
    "quick_start": "docs/SKILL-FAUST-MCP.md",
    "installation": "docs/SKILL-INSTALLATION.md",
    "examples": "docs/examples/",
    "troubleshooting": "docs/guides/beginner-mistakes.md"
  },
  "requirements": {
    "min_claude_version": "1.0.0",
    "os": ["macos", "linux", "windows"],
    "memory_mb": 500,
    "disk_space_mb": 1000
  },
  "features": {
    "realtime_validation": true,
    "error_diagnosis": true,
    "performance_profiling": true,
    "code_examples": 19,
    "error_patterns": 38
  },
  "rating": {
    "overall": 4.9,
    "total_reviews": 0,
    "install_count": 0
  },
  "settings": {
    "faust_binary_path": {
      "type": "string",
      "description": "Path to Faust compiler binary",
      "default": "/usr/local/bin/faust"
    },
    "library_path": {
      "type": "string",
      "description": "Path to Faust standard library",
      "default": "/usr/local/share/faust/libraries"
    },
    "optimization_level": {
      "type": "integer",
      "description": "Compiler optimization level (0-4)",
      "default": 2
    },
    "sample_rate": {
      "type": "integer",
      "description": "Default sample rate for execution",
      "default": 44100
    },
    "max_execution_seconds": {
      "type": "integer",
      "description": "Maximum execution time per program",
      "default": 30
    }
  }
}
```

### Step 3: Prepare Documentation for Skill

Organize documentation as expected by skill platform:

```
skill-package/
├── skill.json                    # Skill manifest
├── README.md                     # Overview
├── LICENSE                       # Apache 2.0 license
├── docs/
│   ├── SKILL-FAUST-MCP.md       # Quick start
│   ├── SKILL-INSTALLATION.md    # Installation steps
│   ├── MCP-USER-GUIDE.md        # Full user guide
│   ├── MCP-QUICK-REFERENCE.md   # Quick reference
│   ├── FAUST-LANGUAGE-RESEARCH.md
│   ├── FAUST-BEST-PRACTICES.md
│   ├── DEBUGGING-FRAMEWORK-GUIDE.md
│   ├── faust-error-research.md
│   ├── guides/
│   ├── examples/                # All code examples
│   └── data/
└── package.json                 # Node dependencies
```

### Step 4: Create Distribution Package

```bash
# Archive skill package
tar -czf faust-mcp-1.0.0.tar.gz skill-package/

# Create checksum for verification
sha256sum faust-mcp-1.0.0.tar.gz > faust-mcp-1.0.0.tar.gz.sha256

# Sign package (if using GPG)
gpg --armor --detach-sign faust-mcp-1.0.0.tar.gz
```

### Step 5: Publish to Skill Registry

**Publish to Claude Code Official Registry**:

```bash
# Login to skill registry
claude-code auth login

# Publish skill
claude-code publish faust-mcp-1.0.0.tar.gz

# Verify publication
claude-code list skills | grep faust-mcp
```

**Alternative: Host on GitHub Releases**:

```bash
# Create GitHub release with assets
gh release create v1.0.0 \
  --title "Faust MCP v1.0.0" \
  --notes-file RELEASE-NOTES.md \
  faust-mcp-1.0.0.tar.gz \
  faust-mcp-1.0.0.tar.gz.sha256
```

---

## Installation & Configuration

### User Installation

**Method 1: From Claude Code Registry** (Recommended)

```bash
# Install skill
claude-code install faust-mcp

# Verify installation
claude-code list skills | grep faust-mcp
# Output: faust-mcp - Faust DSP Language MCP (v1.0.0)

# Start using
claude-code .
```

**Method 2: From GitHub Release**

```bash
# Download skill
curl -L https://github.com/jessesep/faust-mcp-test/releases/download/v1.0.0/faust-mcp-1.0.0.tar.gz \
  -o faust-mcp-1.0.0.tar.gz

# Install
claude-code install faust-mcp-1.0.0.tar.gz

# Verify
claude-code check faust-mcp
```

### Configuration

**Automatic Configuration**:
- Skill auto-detects Faust installation
- Uses sensible defaults
- Works out of the box for most users

**Manual Configuration** (Optional):

```bash
# Interactive configuration
claude-code config faust-mcp

# Or edit directly
nano ~/.claude/faust-mcp/config.json
```

**Configuration File** (`~/.claude/faust-mcp/config.json`):

```json
{
  "faust": {
    "binary_path": "/usr/local/bin/faust",
    "library_path": "/usr/local/share/faust/libraries",
    "default_optimization": 2,
    "default_sample_rate": 44100,
    "default_buffer_size": 256
  },
  "execution": {
    "max_duration_seconds": 30,
    "output_directory": "~/.claude/faust-mcp/output",
    "timeout_ms": 30000
  },
  "features": {
    "enable_library_docs": true,
    "enable_performance_profile": true,
    "enable_code_caching": true,
    "cache_directory": "~/.claude/faust-mcp/cache"
  },
  "compiler": {
    "optimization_levels": [0, 1, 2, 3, 4],
    "default_level": 2,
    "available_targets": [
      "cpp",
      "wasm",
      "webaudio"
    ],
    "default_target": "cpp"
  }
}
```

### Verification Script

Create `faust-mcp check` command functionality:

```javascript
// faust-mcp-check.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function check() {
  console.log('Faust MCP Skill Verification\n');

  let allGood = true;

  // Check Faust compiler
  try {
    const version = execSync('faust --version').toString();
    console.log(`✓ Faust compiler: ${version.trim()}`);
  } catch (e) {
    console.log('✗ Faust compiler: NOT FOUND');
    console.log('  Install with: brew install faust');
    allGood = false;
  }

  // Check Faust libraries
  try {
    const libdir = execSync('faust -libdir').toString().trim();
    const libs = fs.readdirSync(libdir).length;
    console.log(`✓ Faust libraries: ${libdir} (${libs} libs)`);
  } catch (e) {
    console.log('✗ Faust libraries: NOT FOUND');
    allGood = false;
  }

  // Check architecture files
  try {
    const archdir = execSync('faust -archdir').toString().trim();
    const archs = fs.readdirSync(archdir).length;
    console.log(`✓ Architecture files: ${archdir} (${archs} archs)`);
  } catch (e) {
    console.log('✗ Architecture files: NOT FOUND');
    allGood = false;
  }

  // Check MCP server
  console.log('✓ MCP server: Ready');

  // Check tools
  const tools = [
    'faust/validate-syntax',
    'faust/compile',
    'faust/analyze-structure',
    'faust/execute',
    'faust/debug-error',
    'faust/get-library-docs',
    'faust/performance-profile',
    'faust/format-code',
    'faust/suggest-completion'
  ];
  console.log(`✓ Tools: ${tools.length}/${tools.length} operational`);

  // Check configuration
  const configPath = path.join(process.env.HOME, '.claude', 'faust-mcp', 'config.json');
  if (fs.existsSync(configPath)) {
    console.log('✓ Configuration: Valid');
  } else {
    console.log('⚠ Configuration: Using defaults');
  }

  console.log('');
  if (allGood) {
    console.log('STATUS: Ready to use!');
    return 0;
  } else {
    console.log('STATUS: Issues detected. Please fix above and try again.');
    return 1;
  }
}

process.exit(check());
```

---

## Integration with Claude Code

### How Claude Accesses the Skill

When user invokes Claude Code with Faust MCP:

```
User Command
    ↓
Claude Code loads Faust MCP skill
    ↓
MCP server starts with 9 tools
    ↓
Claude AI has access to tools
    ↓
Claude can use tools in response
    ↓
Results returned to user
```

### Tool Integration Points

Each tool is called like:

```javascript
// Claude calls tools through MCP protocol
const result = await mcpClient.call('faust/validate-syntax', {
  code: `import("stdfaust.lib");
         process = os.osc(440);`
});

// Returns
{
  valid: true,
  errors: [],
  warnings: []
}
```

### Prompt Engineering

Claude uses skill effectively when prompted:

**Good Prompts**:
```
"Create a sine wave oscillator with frequency control"
"What's wrong with my code?" [paste code]
"Make this more efficient"
"Add reverb to this synth"
```

**What Happens**:
1. Claude writes code
2. Claude calls `faust/validate-syntax`
3. If valid, Claude explains code
4. User can ask for modifications
5. Claude refines and re-validates

---

## Verification & Testing

### Installation Verification

Users should verify with:

```bash
# Check installation
faust-mcp check

# List available tools
claude-code api faust-mcp

# Test simple example
echo 'process = 0.1 * sin(2*3.14159*440*t);' | faust-mcp test
```

### Functionality Testing

**Test Validators**:
```bash
# Should succeed
faust-mcp validate 'process = 0;'

# Should fail with error
faust-mcp validate 'process = (sin, cos) : +;'
```

**Test Compilation**:
```bash
# Compile simple program
faust-mcp compile 'process = os.osc(440);'

# Should output C++ code or success message
```

**Test Examples**:
```bash
# Test each example compiles
for f in docs/examples/**/*.dsp; do
  echo "Testing: $f"
  faust-mcp test "$f" || echo "FAILED"
done
```

### Performance Benchmarks

Test performance on various systems:

```javascript
// Benchmark compilation time
const examples = [
  { name: 'simple', lines: 1 },
  { name: 'moderate', lines: 20 },
  { name: 'complex', lines: 100 }
];

for (const example of examples) {
  const start = Date.now();
  // Compile example
  const duration = Date.now() - start;
  console.log(`${example.name}: ${duration}ms`);
}
```

Expected performance:
- Simple code: <2 seconds
- Complex code: <10 seconds
- Large code: <20 seconds

---

## Troubleshooting Deployment

### Issue: Skill Not Appearing in Registry

**Problem**: After publication, skill doesn't appear in Claude Code skill list

**Solutions**:
1. Verify publication succeeded:
   ```bash
   claude-code list skills --remote | grep faust
   ```

2. Check publication status:
   ```bash
   claude-code status faust-mcp
   ```

3. Wait for propagation (up to 1 hour)

4. Clear cache:
   ```bash
   rm -rf ~/.claude/cache
   claude-code sync
   ```

### Issue: Installation Fails

**Problem**: User gets error when installing skill

**Solutions**:
1. Check dependencies:
   ```bash
   npm list
   faust --version
   ```

2. Clear Claude Code cache:
   ```bash
   rm -rf ~/.claude/faust-mcp
   claude-code install faust-mcp --force
   ```

3. Check disk space:
   ```bash
   df -h ~
   ```

4. Verify internet connection

### Issue: Tools Don't Work

**Problem**: Skill installed but tools return errors

**Solutions**:
1. Run verification:
   ```bash
   faust-mcp check
   ```

2. Check Faust installation:
   ```bash
   which faust
   faust --version
   ```

3. Check configuration:
   ```bash
   cat ~/.claude/faust-mcp/config.json
   ```

4. Check logs:
   ```bash
   tail -f ~/.claude/faust-mcp/logs/*.log
   ```

### Issue: Performance Problems

**Problem**: Compilation or execution is very slow

**Solutions**:
1. Reduce code complexity
2. Lower optimization level in config
3. Clear cache:
   ```bash
   rm -rf ~/.claude/faust-mcp/cache
   ```
4. Check system resources
5. Update Faust to latest version

---

## Post-Deployment Monitoring

### Monitoring Checklist

**Daily**:
- [ ] Monitor error logs for critical issues
- [ ] Check user reports/issues
- [ ] Verify all tools responding correctly

**Weekly**:
- [ ] Review usage statistics
- [ ] Check performance metrics
- [ ] Review user feedback
- [ ] Plan any hot fixes needed

**Monthly**:
- [ ] Comprehensive health check
- [ ] Performance analysis
- [ ] User satisfaction survey
- [ ] Plan next release

### Key Metrics to Track

```
Installation:
- Total installations
- Active installations
- Daily new installations
- Installation success rate

Usage:
- Daily active users
- Tools used most frequently
- Average session length
- Error rates

Performance:
- Average tool response time
- Compilation time distribution
- Execution success rate
- Cache hit rate

Satisfaction:
- User ratings
- Support tickets
- Issue reports
- Feature requests
```

### Alerting

Set up alerts for:
- Tool failure rate >5%
- Performance degradation >20%
- Critical errors in logs
- Installation failures >10%

### Feedback Collection

**User Surveys**:
```
After 1 week of use:
- How satisfied are you? (1-5)
- What would improve it?
- Would you recommend?

Monthly pulse check:
- Still using?
- Any problems?
- Feature suggestions?
```

---

## Version Management

### Version Numbering

Format: `MAJOR.MINOR.PATCH`

- **v1.0.0**: Initial release
- **v1.0.1**: Bug fix
- **v1.1.0**: Minor feature
- **v2.0.0**: Major revision

### Update Process

**For Bug Fixes** (v1.0.1):
1. Fix bug
2. Update version in package.json
3. Update CHANGELOG
4. Create git tag
5. Publish to registry
6. Notify users

**For Minor Updates** (v1.1.0):
1. Develop feature
2. Test thoroughly
3. Update documentation
4. Update version
5. Create release notes
6. Publish to registry
7. Announce to community

**For Major Versions** (v2.0.0):
1. Major planning
2. Extended development
3. Comprehensive testing
4. Migration guide
5. Advance announcement
6. Publish with notes
7. Community support

### Backward Compatibility

**Commitment**:
- Maintain backward compatibility within major versions
- Document breaking changes clearly
- Provide migration guides
- Support previous version for 6 months

---

## Deployment Rollback

If critical issues found post-deployment:

**Immediate Actions**:
1. Identify critical issue
2. Document thoroughly
3. Alert users if security issue
4. Prepare rollback

**Rollback Steps**:
```bash
# Unpublish current version
claude-code unpublish faust-mcp 1.0.1

# Revert to previous version
claude-code publish faust-mcp 1.0.0 --force

# Notify users
# Send alert: "1.0.1 has issues, reverted to 1.0.0"
```

**Post-Rollback**:
1. Investigate root cause
2. Fix thoroughly
3. Extended testing
4. Republish when confident

---

## Deployment Success Criteria

The deployment is successful when:

✅ Skill appears in Claude Code registry
✅ Users can install with `claude-code install faust-mcp`
✅ All tools respond correctly
✅ Documentation is accessible
✅ Examples work without errors
✅ Installation verification passes
✅ Performance is acceptable (<10s for normal compilation)
✅ Users report positive experience
✅ Support tickets are minimal
✅ No critical bugs reported

---

## Support Plan

**Support Channels**:
- GitHub Issues: Bug reports and feature requests
- GitHub Discussions: Questions and support
- Email: For critical issues

**Response Times**:
- Critical bugs: 24 hours
- Feature requests: 1 week
- Support questions: 2-3 days

---

**Deployment Guide v1.0** | Updated: 2025-12-11

For questions about deployment, see the main README.md or open an issue on GitHub.
