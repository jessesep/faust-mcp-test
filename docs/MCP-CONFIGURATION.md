# Faust MCP Configuration Guide

**Setting up the Faust MCP server and client integration**

---

## Overview

The Faust MCP server requires configuration of:
1. **Faust Installation** - Compiler binary and library paths
2. **Compilation Settings** - Targets, optimization, parallel build
3. **Execution Environment** - Sample rate, buffer size, timeouts
4. **Resource Limits** - Memory, file size, process constraints

---

## Server Configuration

### Minimal Configuration

```json
{
  "faust": {
    "binary_path": "/usr/local/bin/faust",
    "library_path": "/usr/local/share/faust/libraries",
    "architecture_path": "/usr/local/share/faust/architecture"
  }
}
```

### Complete Configuration

```json
{
  "server": {
    "name": "faust-mcp",
    "version": "1.0",
    "transport": "stdio"
  },
  "faust": {
    "paths": {
      "binary": "/usr/local/bin/faust",
      "libraries": "/usr/local/share/faust/libraries",
      "architecture": "/usr/local/share/faust/architecture",
      "temp_dir": "/tmp/faust-mcp",
      "cache_dir": "~/.faust-mcp-cache"
    },
    "compiler": {
      "default_target": "cpp",
      "default_optimization": 2,
      "parallel_jobs": -1,
      "enable_inlining": true,
      "vectorize": true,
      "max_compilation_time": 60,
      "cleanup_artifacts": true
    },
    "execution": {
      "default_sample_rate": 44100,
      "default_buffer_size": 256,
      "max_buffer_size": 4096,
      "max_execution_duration": 30,
      "audio_backend": "auto"
    },
    "validation": {
      "strict_mode": false,
      "warn_unused_variables": true,
      "warn_type_mismatch": true
    }
  },
  "resource_limits": {
    "max_process_memory_mb": 512,
    "max_output_size_mb": 100,
    "max_compilation_threads": 4,
    "max_concurrent_executions": 2
  },
  "caching": {
    "cache_compiled_code": true,
    "cache_library_docs": true,
    "cache_analysis_results": true,
    "cache_ttl_hours": 24
  },
  "logging": {
    "level": "info",
    "log_file": "~/.faust-mcp/logs/server.log",
    "enable_debug": false
  }
}
```

---

## Installation Prerequisites

### macOS
```bash
# Install via Homebrew
brew install faust

# Verify installation
faust --version
which faust
```

### Linux (Ubuntu/Debian)
```bash
# Add PPA and install
sudo add-apt-repository ppa:kxstudio-team/builds
sudo apt-get install faust
```

### Linux (Fedora/RHEL)
```bash
sudo dnf install faust
```

### From Source
```bash
# Clone and build
git clone https://github.com/grame-cncm/faust.git
cd faust
make
sudo make install
```

---

## Path Configuration

### Verify Installation Paths

```bash
# Find Faust binary
which faust
# Expected: /usr/local/bin/faust (macOS) or /usr/bin/faust (Linux)

# Find library directory
faust -libdir
# Expected output: /usr/local/share/faust/libraries

# List available libraries
ls $(faust -libdir)
```

### Custom Library Paths

If Faust is installed in non-standard location:

```json
{
  "faust": {
    "paths": {
      "binary": "/opt/faust/bin/faust",
      "libraries": "/opt/faust/share/libraries",
      "architecture": "/opt/faust/share/architecture"
    }
  }
}
```

---

## Compilation Configuration

### Target Selection

Choose compilation target based on use case:

| Target | Best For | Notes |
|--------|----------|-------|
| `cpp` | Desktop apps | Fastest iteration, widely compatible |
| `c` | Embedded systems | More compact than C++ |
| `llvm` | JIT compilation | Fast runtime, good for live coding |
| `wasm` | Web audio | Run in browser, sandbox safe |
| `java` | Java integration | Cross-platform JVM |

Default is `cpp` - recommended for most cases.

### Optimization Levels

```json
{
  "faust": {
    "compiler": {
      "optimization_level": 2
    }
  }
}
```

| Level | Speed | Compilation Time | Use Case |
|-------|-------|------------------|----------|
| 0 | Slow | Instant | Debugging, development |
| 1 | Medium | <1s | Testing |
| 2 | Fast | 1-5s | Normal use (default) |
| 3 | Maximum | 5-30s | Production releases |

### Parallel Compilation

```json
{
  "faust": {
    "compiler": {
      "parallel_jobs": 4
    }
  }
}
```

- Set to `-1` for auto-detection (CPU count)
- Set to `1` for single-threaded
- Useful for large projects

---

## Execution Configuration

### Sample Rate and Buffer Size

```json
{
  "faust": {
    "execution": {
      "default_sample_rate": 44100,
      "default_buffer_size": 256
    }
  }
}
```

**Common configurations**:

| Sample Rate | Use Case | Audio Quality |
|-------------|----------|---------------|
| 44100 Hz | CD quality | Standard (default) |
| 48000 Hz | Professional | Standard (film) |
| 96000 Hz | High fidelity | Premium |
| 192000 Hz | Mastering | Extreme (not typical) |

| Buffer Size | Latency | CPU Load |
|-------------|---------|----------|
| 64 samples | Very low | Very high |
| 256 samples | Low | Moderate (default) |
| 512 samples | Medium | Low |
| 2048 samples | High | Very low |

**Note**: Smaller buffers = lower latency but higher CPU usage. Balance depends on application.

### Audio Backend

```json
{
  "faust": {
    "execution": {
      "audio_backend": "auto"
    }
  }
}
```

Available backends:
- `auto` - Automatic selection (recommended)
- `jack` - JACK Audio Connection Kit (low latency)
- `portaudio` - Cross-platform
- `coreaudio` - macOS native
- `alsa` - Linux native
- `pulse` - PulseAudio (Linux)

---

## Resource Limits

### Memory Management

```json
{
  "resource_limits": {
    "max_process_memory_mb": 512,
    "max_output_size_mb": 100,
    "max_compilation_threads": 4,
    "max_concurrent_executions": 2
  }
}
```

**Recommendations**:
- `max_process_memory`: 512 MB for personal, 2GB for server
- `max_output_size`: 100-500 MB depending on storage
- `max_compilation_threads`: CPU count (4 for quad-core)
- `max_concurrent_executions`: 1-4 (higher = more memory)

### Timeout Settings

```json
{
  "faust": {
    "compiler": {
      "max_compilation_time": 60
    },
    "execution": {
      "max_execution_duration": 30
    }
  }
}
```

- **Compilation timeout**: 60 seconds (increase for complex code)
- **Execution timeout**: 30 seconds (prevent infinite loops)

---

## Caching Configuration

### Enable/Disable Caching

```json
{
  "caching": {
    "cache_compiled_code": true,
    "cache_library_docs": true,
    "cache_analysis_results": true,
    "cache_ttl_hours": 24
  }
}
```

**What gets cached**:
- Compiled C++ code (reuse same compilation)
- Library documentation (avoid re-parsing)
- Analysis results (structure/I/O analysis)

**Cache location**: `~/.faust-mcp-cache/`

**Clear cache**:
```bash
rm -rf ~/.faust-mcp-cache/
```

---

## Development vs Production

### Development Configuration
```json
{
  "faust": {
    "compiler": {
      "default_optimization": 0,
      "enable_inlining": false
    },
    "validation": {
      "strict_mode": true,
      "warn_unused_variables": true,
      "warn_type_mismatch": true
    }
  },
  "logging": {
    "level": "debug",
    "enable_debug": true
  }
}
```

### Production Configuration
```json
{
  "faust": {
    "compiler": {
      "default_optimization": 3,
      "enable_inlining": true,
      "vectorize": true
    },
    "execution": {
      "max_execution_duration": 5
    }
  },
  "resource_limits": {
    "max_concurrent_executions": 8
  },
  "logging": {
    "level": "error",
    "enable_debug": false
  }
}
```

---

## Configuration File Location

The MCP server looks for configuration in this order:

1. Command-line argument: `--config /path/to/config.json`
2. Environment variable: `FAUST_MCP_CONFIG=/path/to/config.json`
3. Current directory: `./faust-mcp-config.json`
4. Home directory: `~/.faust-mcp/config.json`
5. System config: `/etc/faust-mcp/config.json`
6. Built-in defaults (if none above exist)

### Example Setup

```bash
# Create config directory
mkdir -p ~/.faust-mcp

# Place config file
cp faust-mcp-config.json ~/.faust-mcp/config.json

# Start server with explicit config
faust-mcp-server --config ~/.faust-mcp/config.json

# Or use environment variable
export FAUST_MCP_CONFIG=~/.faust-mcp/config.json
faust-mcp-server
```

---

## Environment Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `FAUST_MCP_CONFIG` | Config file path | `/home/user/.faust-mcp/config.json` |
| `FAUST_PATH` | Faust libraries path | `/usr/local/share/faust` |
| `FAUST_ARCH_PATH` | Architecture files path | `/usr/local/share/faust/architecture` |
| `FAUST_MCP_TEMP` | Temp directory | `/tmp/faust-mcp` |
| `FAUST_MCP_DEBUG` | Enable debug logging | `1` or `true` |

---

## Troubleshooting Configuration

### "Faust binary not found"
```bash
# Check if Faust is installed
which faust

# If not found, install or add to PATH
export PATH="/usr/local/bin:$PATH"
```

### "Library not found"
```bash
# Verify library path
faust -libdir

# Check config points to correct path
cat ~/.faust-mcp/config.json | grep library_path
```

### "Permission denied"
```bash
# Check temp directory permissions
ls -la /tmp/faust-mcp

# Create if missing
mkdir -p /tmp/faust-mcp
chmod 755 /tmp/faust-mcp
```

### "Out of memory"
```json
{
  "resource_limits": {
    "max_process_memory_mb": 2048,
    "max_output_size_mb": 500
  }
}
```

### "Compilation timeout"
Increase timeout and check system resources:
```json
{
  "faust": {
    "compiler": {
      "max_compilation_time": 120
    }
  }
}
```

---

## Verification Checklist

- [ ] Faust binary installed: `faust --version`
- [ ] Config file created: `~/.faust-mcp/config.json`
- [ ] Paths verified: `faust -libdir`
- [ ] Temp directory writable: `touch /tmp/faust-mcp/test`
- [ ] Server starts: `faust-mcp-server --help`
- [ ] Client connects: `faust-mcp-client`

---

## Next Steps

1. Install Faust: Follow Prerequisites section
2. Create configuration: Use template above
3. Test setup: Run verification checklist
4. See MCP-SPECIFICATION.md for tool usage
5. Review FAUST-CODE-EXAMPLES.md for sample code

---

**Version**: 1.0 | **Updated**: 2025-12-11
