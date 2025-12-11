# Faust MCP Skill - Installation & Activation Guide

**Step-by-step guide to install and activate the Faust MCP skill**

**Version**: 1.0 | **Updated**: 2025-12-11

---

## Quick Installation (2 minutes)

### One-Command Installation

```bash
# Install the skill
claude-code install faust-mcp

# Verify installation
claude-code list skills | grep faust
# Output: faust-mcp    Faust DSP Language MCP    v1.0.0

# Start using
claude-code .
```

---

## Step-by-Step Installation

### Step 1: Verify Prerequisites

```bash
# Check Faust installation
faust --version
# Output should be: Faust 2.x.x

# Check Faust libraries are available
faust -libdir
# Output: /usr/local/share/faust/libraries

# Check Claude Code is installed
claude-code --version
# Output: Claude Code v1.x.x or higher
```

If any command fails, see **Prerequisites** section below.

### Step 2: Install the Skill

```bash
# Download and install
claude-code install faust-mcp

# Installation output:
# Installing faust-mcp...
# ✓ Downloaded: 45 MB
# ✓ Verified: Signature OK
# ✓ Installed to: ~/.claude/skills/faust-mcp/
# ✓ Configuration: ~/.claude/faust-mcp/config.json
# ✓ Ready to use!
```

### Step 3: Configure (Optional)

The skill uses default configuration, but you can customize:

```bash
# Interactive configuration
claude-code config faust-mcp

# Or edit config directly
nano ~/.claude/faust-mcp/config.json
```

**Default configuration provides**:
- ✓ Auto-detection of Faust installation
- ✓ Optimal compiler settings (optimization level 2)
- ✓ Standard library paths
- ✓ 44100 Hz sample rate
- ✓ 256-sample buffer size
- ✓ 30-second execution timeout

### Step 4: Verify Installation

```bash
# Run verification check
faust-mcp check

# Output:
# Faust MCP Skill Verification
# ✓ Faust compiler: /usr/local/bin/faust (v2.39.0)
# ✓ Faust libraries: /usr/local/share/faust/libraries (14 libs)
# ✓ Architecture files: Available
# ✓ MCP server: Ready
# ✓ Tools: 9/9 operational
# ✓ Configuration: Valid
#
# STATUS: Ready to use!
```

### Step 5: Test the Installation

```bash
# Create a simple test
cat > test.dsp << 'EOF'
import("stdfaust.lib");
process = os.osc(440);
EOF

# Ask Claude to validate it
claude-code .
# Tell Claude: "Validate and execute test.dsp"

# Or test directly
faust-mcp test --file test.dsp
```

---

## Platform-Specific Installation

### macOS Installation

**Prerequisites**:
- macOS 10.14 or later
- Xcode Command Line Tools

**Install Faust**:
```bash
brew install faust
```

**Install Skill**:
```bash
claude-code install faust-mcp
```

**Verify**:
```bash
faust --version  # Should show v2.x.x
faust-mcp check  # Should show all OK
```

### Linux Installation

**Prerequisites**:
- Ubuntu 18.04+ or equivalent
- Build tools: gcc, g++, cmake

**Install Faust** (Ubuntu/Debian):
```bash
sudo add-apt-repository ppa:kxstudio-team/builds
sudo apt-get update
sudo apt-get install faust
```

**Install Faust** (Fedora/RHEL):
```bash
sudo dnf install faust
```

**Install Skill**:
```bash
claude-code install faust-mcp
```

**Verify**:
```bash
faust --version
faust-mcp check
```

### Windows Installation (WSL2)

**Prerequisites**:
- Windows 10/11 with WSL2 enabled
- Ubuntu 18.04+ in WSL2
- X11 server running (for optional GUI)

**Install in WSL2 terminal**:
```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install dependencies
sudo apt-get install -y gcc g++ cmake libjack-jackd2-dev

# Install Faust from source
git clone https://github.com/grame-cncm/faust.git
cd faust
make
sudo make install

# Install Claude Code skill
claude-code install faust-mcp

# Verify
faust --version
faust-mcp check
```

---

## Prerequisites

### Required Software

#### Faust Compiler

**Check if installed**:
```bash
which faust
faust --version
```

**Install if missing**:

**macOS**:
```bash
brew install faust
```

**Linux (Ubuntu/Debian)**:
```bash
sudo apt-get install faust
```

**Linux (Fedora)**:
```bash
sudo dnf install faust
```

**From Source**:
```bash
git clone https://github.com/grame-cncm/faust.git
cd faust
make
sudo make install
```

#### Claude Code

**Check if installed**:
```bash
claude-code --version
```

**Install if missing**:
```bash
npm install -g @anthropic-ai/claude-code
```

Or download from: https://github.com/anthropics/claude-code

### System Requirements

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| RAM | 2 GB | 8 GB |
| Disk | 500 MB | 2 GB |
| CPU | 2 cores | 4+ cores |
| OS | macOS 10.14+ | macOS 11+, Ubuntu 20.04+ |

### Network Requirements

- Internet access for initial download
- No internet required after installation (tools run locally)

---

## Configuration

### Default Configuration

```json
{
  "faust": {
    "binary_path": "auto-detected",
    "library_path": "auto-detected",
    "architecture_path": "auto-detected",
    "compiler_optimization": 2,
    "parallel_jobs": "auto"
  },
  "execution": {
    "sample_rate": 44100,
    "buffer_size": 256,
    "max_duration": 30,
    "output_directory": "~/.claude/faust-mcp/output"
  },
  "features": {
    "library_docs": true,
    "performance_profile": true,
    "code_caching": true,
    "auto_formatting": true
  }
}
```

### Custom Configuration

**Edit configuration**:
```bash
nano ~/.claude/faust-mcp/config.json
```

**Common customizations**:

**Different optimization level**:
```json
"compiler_optimization": 3  // Maximum (slower compile, faster runtime)
```

**Lower latency (smaller buffer)**:
```json
"buffer_size": 64  // Lower latency, higher CPU
```

**Higher quality (higher sample rate)**:
```json
"sample_rate": 96000  // More CPU, better quality
```

**Custom library paths**:
```json
"library_path": "/path/to/custom/libraries:/usr/local/share/faust/libraries"
```

---

## Activation

### Activate for Current Project

```bash
# Navigate to project
cd my-faust-project

# Activate Claude Code with Faust support
claude-code .

# Claude will have access to Faust MCP tools
# Ask Claude: "Create a sine wave"
```

### Activate Globally

```bash
# Enable Faust MCP for all Claude Code sessions
claude-code config --global
# Check: Faust MCP Skill > Enable

# Now every Claude Code session includes Faust support
```

### Custom Skill Configuration per Project

Create `.claude-faust.json` in your project:

```json
{
  "faust_config": {
    "compiler_optimization": 3,
    "sample_rate": 48000,
    "library_paths": [
      "./custom-libs",
      "/usr/local/share/faust/libraries"
    ]
  }
}
```

---

## Verification

### Full System Check

```bash
# Run comprehensive check
faust-mcp check

# Output shows:
# Faust Compiler: ✓ OK
# Faust Libraries: ✓ OK (14 libraries found)
# Architecture Files: ✓ OK
# MCP Server: ✓ OK
# Tools Available: 9/9
# Configuration: ✓ Valid
# Permissions: ✓ OK
# Disk Space: ✓ OK (2.3 GB available)
```

### Individual Component Tests

```bash
# Test compiler
faust-mcp test --compiler

# Test libraries
faust-mcp test --libraries

# Test execution
faust-mcp test --execute

# Test performance profiling
faust-mcp test --profiler

# Test error diagnostics
faust-mcp test --diagnostics
```

### Create Test Program

```bash
# Create simple test
faust-mcp create-test

# Output: Created test.dsp with simple oscillator

# Validate it
faust-mcp validate test.dsp

# Execute it
faust-mcp execute test.dsp

# You'll hear: 440 Hz sine wave
```

---

## Troubleshooting Installation

### Problem: "Faust not found"

```
Error: Faust compiler not found
```

**Solution**:
```bash
# Check installation
which faust
faust --version

# If not found, install:
brew install faust  # macOS
# or
sudo apt-get install faust  # Linux
```

### Problem: "Libraries not accessible"

```
Error: Faust libraries not found at /usr/local/share/faust/libraries
```

**Solution**:
```bash
# Find where libraries actually are
faust -libdir

# Update config with correct path
claude-code config faust-mcp
# Set library_path to output from faust -libdir
```

### Problem: "Permission denied"

```
Error: Permission denied writing to output directory
```

**Solution**:
```bash
# Create output directory with permissions
mkdir -p ~/.claude/faust-mcp/output
chmod 755 ~/.claude/faust-mcp/output

# Or change output path in config
# Set output_directory to writable location
```

### Problem: "Out of memory"

```
Error: Out of memory during compilation
```

**Solution**:
```bash
# Reduce compilation complexity
# In config:
"compiler_optimization": 0  # Faster, less memory

# Or split code into smaller modules
# Or increase system swap space
```

### Problem: "Skill not activating"

```
Error: Faust MCP skill not available
```

**Solution**:
```bash
# Reinstall skill
claude-code uninstall faust-mcp
claude-code install faust-mcp

# Check installation
claude-code list skills | grep faust

# Restart Claude Code
claude-code restart
```

---

## Uninstallation

### Remove Skill

```bash
# Uninstall
claude-code uninstall faust-mcp

# Remove configuration and cache
rm -rf ~/.claude/faust-mcp/

# Faust compiler remains (in case you need it elsewhere)
```

### Remove Faust Compiler (Optional)

```bash
# macOS
brew uninstall faust

# Linux
sudo apt-get remove faust

# From source
cd faust
sudo make uninstall
```

---

## Updates & Maintenance

### Check for Updates

```bash
# Check available updates
claude-code update check --faust-mcp

# View changelog
claude-code update info --faust-mcp
```

### Update Skill

```bash
# Automatic update
claude-code update faust-mcp

# Or manual
claude-code uninstall faust-mcp
claude-code install faust-mcp --version latest
```

### Clear Cache

```bash
# Clear compilation cache
rm -rf ~/.claude/faust-mcp/cache/compiled_code/

# Clear documentation cache
rm -rf ~/.claude/faust-mcp/cache/library_docs/

# Clear all caches
rm -rf ~/.claude/faust-mcp/cache/
```

### View Logs

```bash
# View recent errors
tail -50 ~/.claude/faust-mcp/logs/error.log

# View all activity
tail -100 ~/.claude/faust-mcp/logs/execution.log

# Search logs
grep "compilation error" ~/.claude/faust-mcp/logs/*.log
```

---

## Next Steps

After installation:

1. **Run a test** (see above)
2. **Read the user guide**: `MCP-USER-GUIDE.md`
3. **Try first example**: Ask Claude to create an oscillator
4. **Learn best practices**: See `FAUST-BEST-PRACTICES.md`
5. **Explore workflows**: Read `MCP-WORKFLOWS.md`

---

## Support

### Getting Help

```bash
# Built-in help
faust-mcp help

# Specific command help
faust-mcp help <command>

# Examples
faust-mcp examples

# API documentation
faust-mcp api-docs
```

### Report Issues

```bash
# Report a bug
faust-mcp report-issue
# Opens form to describe issue

# View known issues
faust-mcp issues --list

# Check status
faust-mcp status
```

### Community

- GitHub Issues: https://github.com/grame-cncm/faust-mcp/issues
- Discussion Forum: https://github.com/grame-cncm/faust-mcp/discussions
- Faust Community: https://faust.grame.fr/community/

---

**Installation Complete! Ready to start creating Faust DSP code!**

Next: Read `SKILL-FAUST-MCP.md` for full feature overview or `MCP-USER-GUIDE.md` for tutorials.

---

**Faust MCP Skill Installation Guide v1.0** | 2025-12-11
