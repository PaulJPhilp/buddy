# CLI Verification Guide

The Buddy CLI includes powerful verification features to help you ensure that your configuration changes are applied correctly and that your workspace setup is valid.

## Overview

Since CLI operations modify configuration files, it's important to verify that changes were applied correctly. The CLI provides several verification methods:

1. **Built-in verification flags** - Add `--verify` to commands for automatic verification
2. **Dedicated verify commands** - Use `buddy verify` for detailed verification
3. **Configuration comparison** - Compare configs before and after changes

## Built-in Verification

### Workspace Creation with Verification

```bash
# Create workspace with automatic verification
buddy workspace create "My Workspace" --verify

# Create workspace with agents and verify
buddy workspace create "Dev Team" --agents="agent1,agent2" --verify
```

When `--verify` is used, the CLI will:
- ✅ Confirm the workspace was created and can be retrieved
- ✅ Verify all referenced agents exist
- ⚠️ Warn about any missing agent references
- ❌ Report any critical issues

### Chat App Creation with Verification

```bash
# Create chat app with verification
buddy chatapp create "Support Bot" --workspace="workspace-id" --verify

# Create with specific agent and verify
buddy chatapp create "Dev Assistant" --workspace="dev-team" --agent="dev-agent" --verify
```

When `--verify` is used, the CLI will:
- ✅ Confirm the chat app was created and can be retrieved
- ✅ Verify the referenced workspace exists
- ✅ Verify the referenced agent exists
- ⚠️ Warn about any missing references

## Dedicated Verify Commands

### Verify Configuration Health

```bash
# Check overall configuration health
buddy verify config

# Check specific config file
buddy verify config --config-path="/path/to/config.json"

# Verbose verification with detailed validation
buddy verify config --verbose

# Output as JSON for scripting
buddy verify config --format=json
```

### Verify Workspace Integrity

```bash
# Verify a specific workspace
buddy verify workspace "workspace-id"

# Verify with JSON output
buddy verify workspace "workspace-id" --format=json
```

This checks:
- ✅ Workspace exists and can be loaded
- ✅ All referenced agents exist
- ✅ All referenced chat apps exist
- 📊 Detailed verification report

### Verify Chat App Integrity

```bash
# Verify a specific chat app
buddy verify chatapp "chatapp-id"

# Verify with table format
buddy verify chatapp "chatapp-id" --format=table
```

This checks:
- ✅ Chat app exists and can be loaded
- ✅ Referenced workspace exists
- ✅ Referenced agent exists
- 📊 Detailed verification report

## Configuration Comparison

Compare configurations before and after changes:

```bash
# Compare two config files
buddy verify compare /path/to/before.json /path/to/after.json

# Compare with JSON output for scripting
buddy verify compare /path/to/before.json /path/to/after.json --format=json
```

This shows:
- ➕ Added properties
- ➖ Removed properties
- 🔄 Changed values
- 📊 Detailed difference report

## Verification Workflow Examples

### Safe Workspace Creation

```bash
# 1. Create workspace with verification
buddy workspace create "Production Team" --agents="prod-agent" --verify

# 2. List workspaces to confirm
buddy workspace list

# 3. Verify the specific workspace
buddy verify workspace "production-team-id"
```

### Configuration Change Verification

```bash
# 1. Backup current config
cp /configs/index.json /configs/index.backup.json

# 2. Make changes via CLI
buddy workspace create "New Team" --verify
buddy chatapp create "New Bot" --workspace="new-team" --verify

# 3. Compare configurations
buddy verify compare /configs/index.backup.json /configs/index.json

# 4. Verify overall health
buddy verify config --verbose
```

### Troubleshooting Workflow

```bash
# 1. Check overall configuration health
buddy verify config

# 2. If issues found, check specific components
buddy verify workspace "problematic-workspace-id"
buddy verify chatapp "problematic-chatapp-id"

# 3. Get detailed validation info
buddy verify config --verbose --format=json
```

## Output Formats

All verify commands support multiple output formats:

- `--format=table` (default) - Human-readable table format
- `--format=json` - Machine-readable JSON for scripting
- `--format=yaml` - YAML format for configuration files

## Exit Codes

The CLI uses standard exit codes for scripting:

- `0` - Success, no issues found
- `1` - Errors found or command failed
- `2` - Warnings found but no critical errors

## Scripting Example

```bash
#!/bin/bash

# Create workspace and verify
if buddy workspace create "Auto Team" --verify; then
    echo "✅ Workspace created successfully"
    
    # Verify configuration health
    if buddy verify config --format=json > health_check.json; then
        echo "✅ Configuration is healthy"
    else
        echo "❌ Configuration has issues"
        cat health_check.json
        exit 1
    fi
else
    echo "❌ Failed to create workspace"
    exit 1
fi
```

## Tips

1. **Always use `--verify`** when creating resources in production
2. **Check configuration health** after making multiple changes
3. **Use JSON format** for scripting and automation
4. **Compare configurations** before and after major changes
5. **Verify references** when working with complex workspace setups

The verification system helps ensure your Buddy configuration remains consistent and all references are valid, preventing runtime issues in your chat applications. 