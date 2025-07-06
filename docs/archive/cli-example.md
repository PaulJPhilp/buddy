# CLI Workspace Control: Usage Examples

## Installation and Setup

```bash
# Install the CLI (hypothetical)
npm install -g @buddy/cli

# Or build locally
cd buddy-workspace-cli
bun install
bun run build

# Make executable
chmod +x dist/buddy
sudo ln -s $(pwd)/dist/buddy /usr/local/bin/buddy
```

## Basic Usage Examples

### 1. Workspace Management

#### Create a New Workspace
```bash
# Basic workspace creation
buddy workspace create "My Project"

# Advanced workspace with all options
buddy workspace create "Project Alpha" \
  --icon "🚀" \
  --color "#ff6b35" \
  --description "Main development workspace" \
  --agents "default-agent,business-agent"

# Output:
✅ Created workspace: workspace-project-alpha-1705123456789
📁 Name: Project Alpha
🎨 Icon: 🚀
```

#### List Workspaces
```bash
# List active workspaces (default table format)
buddy workspace list

# Output:
┌─────────────────────┬─────────────────┬──────┬─────────────┬─────────────┐
│ ID                  │ Name            │ Icon │ Status      │ Last Active │
├─────────────────────┼─────────────────┼──────┼─────────────┼─────────────┤
│ workspace-alpha-123 │ Project Alpha   │ 🚀   │ Active      │ 2 mins ago  │
│ workspace-beta-456  │ Beta Testing    │ 🧪   │ Active      │ 1 hour ago  │
└─────────────────────┴─────────────────┴──────┴─────────────┴─────────────┘

# List with archived workspaces
buddy workspace list --include-archived

# List in JSON format
buddy workspace list --format json

# List in YAML format
buddy workspace list --format yaml
```

#### Show Workspace Details
```bash
buddy workspace show workspace-alpha-123

# Output:
Workspace Details:
  ID: workspace-alpha-123
  Name: Project Alpha
  Icon: 🚀
  Color: #ff6b35
  Description: Main development workspace
  Created: 1/15/2024
  Last Active: 2 mins ago
  Status: Active
  Available Agents: default-agent, business-agent
  Max Expanded Apps: 2
  Active App: None

Chat Apps (0):
  None
```

#### Update Workspace
```bash
# Update workspace name
buddy workspace update workspace-alpha-123 --name "Alpha Project v2"

# Update multiple properties
buddy workspace update workspace-alpha-123 \
  --name "Alpha Project v2" \
  --description "Updated description" \
  --color "#3b82f6" \
  --icon "⚡"

# Output:
✅ Updated workspace: workspace-alpha-123
```

#### Archive and Activate Workspaces
```bash
# Archive a workspace
buddy workspace archive workspace-old-project-789
# Output: ✅ Archived workspace: workspace-old-project-789

# Activate a different workspace
buddy workspace activate workspace-alpha-123
# Output: ✅ Activated workspace: workspace-alpha-123

# Show current workspace
buddy workspace current

# Show workspaces with active chat apps
buddy workspace active
```

### 2. Chat App Management

#### List Chat Apps
```bash
# List chat apps in current workspace
buddy chatapp list

# List chat apps in specific workspace
buddy chatapp list workspace-alpha-123

# Filter by status
buddy chatapp list --status expanded
buddy chatapp list --status compact
buddy chatapp list --status stashed

# Output (example):
┌─────────────────────┬─────────────────┬──────────┬─────────────┐
│ ID                  │ Name            │ Status   │ Last Active │
├─────────────────────┼─────────────────┼──────────┼─────────────┤
│ app-main-chat-123   │ Main Chat       │ expanded │ 1 min ago   │
│ app-secondary-456   │ Secondary Chat  │ compact  │ 5 mins ago  │
└─────────────────────┴─────────────────┴──────────┴─────────────┘
```

#### Chat App Status Management
```bash
# Expand a chat app
buddy chatapp expand app-main-chat-123

# Compact a chat app
buddy chatapp compact app-main-chat-123

# Stash a chat app
buddy chatapp stash app-main-chat-123

# Close a chat app
buddy chatapp close app-main-chat-123

# Focus mode
buddy chatapp focus app-main-chat-123
buddy chatapp unfocus workspace-alpha-123
buddy chatapp focus-status
```

#### Bulk Operations
```bash
# Stash all apps in current workspace
buddy chatapp stash-all

# Stash all apps in specific workspace
buddy chatapp stash-all --workspace workspace-alpha-123

# Expand multiple apps
buddy chatapp expand app-1 app-2 app-3

# Set status for multiple apps
buddy chatapp set-status compact --apps app-1,app-2,app-3
```

### 3. Configuration Management

#### View Configuration
```bash
# Show current configuration
buddy config show

# Output:
{
  "format": "table",
  "verbose": false,
  "autoSync": true,
  "server": {
    "httpUrl": "http://localhost:3000",
    "websocketUrl": "ws://localhost:3000/cli-sync"
  },
  "workspace": {
    "defaultIcon": "📁",
    "defaultColor": "#3b82f6",
    "maxExpandedApps": 2
  }
}
```

#### Update Configuration
```bash
# Set default output format
buddy config set format json

# Set default workspace icon
buddy config set workspace.defaultIcon "🏠"

# Set default workspace color
buddy config set workspace.defaultColor "#ff6b35"

# Enable verbose logging
buddy config set verbose true

# Disable auto-sync
buddy config set autoSync false

# Update server URLs
buddy config set server.httpUrl "http://localhost:3001"
buddy config set server.websocketUrl "ws://localhost:3001/cli-sync"

# Output:
✅ Set format = json
```

### 4. Global Options

#### Output Formatting
```bash
# Use different output formats
buddy workspace list --format table    # Default
buddy workspace list --format json     # JSON output
buddy workspace list --format yaml     # YAML output

# Verbose output for debugging
buddy --verbose workspace create "Debug Project"
```

#### Using Custom Config
```bash
# Use custom config file
buddy --config ~/.buddy-custom/config.json workspace list

# Override format for single command
buddy --format json workspace current
```

## Advanced Usage Scenarios

### 1. Workspace Backup and Restore
```bash
# Export workspace data
buddy workspace export workspace-alpha-123 --file backup.json

# Import workspace data
buddy workspace import --file backup.json

# Bulk archive old workspaces
buddy workspace archive --all --older-than "30 days"
```

### 2. Scripting and Automation
```bash
#!/bin/bash

# Create development environment
echo "Setting up development environment..."

# Create main workspace
WORKSPACE_ID=$(buddy workspace create "Development" \
  --icon "💻" \
  --color "#22c55e" \
  --description "Main development workspace" \
  --agents "default-agent,code-agent" \
  --format json | jq -r '.id')

echo "Created workspace: $WORKSPACE_ID"

# Add chat apps
buddy chatapp add simple-chat --workspace $WORKSPACE_ID
buddy chatapp add code-assistant --workspace $WORKSPACE_ID

# Set up configuration
buddy config set workspace.maxExpandedApps 3
buddy config set autoSync true

echo "Development environment ready!"
```

### 3. Integration with Git Hooks
```bash
#!/bin/bash
# .git/hooks/post-checkout

# Activate workspace based on branch
BRANCH=$(git branch --show-current)

case $BRANCH in
  main|master)
    buddy workspace activate workspace-production
    ;;
  develop)
    buddy workspace activate workspace-development
    ;;
  feature/*)
    FEATURE_NAME=$(echo $BRANCH | sed 's/feature\///')
    buddy workspace activate "workspace-feature-$FEATURE_NAME" || \
    buddy workspace create "Feature: $FEATURE_NAME" \
      --icon "🔧" \
      --description "Feature branch workspace"
    ;;
esac
```

### 4. Status Monitoring
```bash
#!/bin/bash
# workspace-status.sh

echo "=== Workspace Status Report ==="
echo

echo "Current Workspace:"
buddy workspace current --format table
echo

echo "Active Workspaces:"
buddy workspace active --format table
echo

echo "Recent Activity:"
buddy workspace list --format json | \
  jq -r '.[] | select(.lastActiveAt > (now - 86400)) | "\(.name) - \(.lastActiveAt)"'
```

### 5. Interactive Workspace Selection
```bash
#!/bin/bash
# interactive-workspace.sh

echo "Available workspaces:"
WORKSPACES=$(buddy workspace list --format json)

echo "$WORKSPACES" | jq -r '.[] | "\(.id) - \(.name)"' | nl

echo "Select workspace number:"
read -r SELECTION

WORKSPACE_ID=$(echo "$WORKSPACES" | jq -r ".[$((SELECTION-1))].id")

if [ "$WORKSPACE_ID" != "null" ]; then
  buddy workspace activate "$WORKSPACE_ID"
  echo "Activated workspace: $WORKSPACE_ID"
else
  echo "Invalid selection"
fi
```

## Error Handling Examples

### Common Error Scenarios
```bash
# Workspace not found
buddy workspace show non-existent-workspace
# Output: ❌ Workspace not found: non-existent-workspace

# No current workspace set
buddy chatapp list
# Output: ❌ No workspace specified and no current workspace set

# Invalid configuration
buddy config set invalid.path value
# Output: ❌ Failed to set config: Invalid configuration path

# Server unavailable (with auto-sync enabled)
buddy workspace create "Test" --verbose
# Output: 
# ✅ Created workspace: workspace-test-123
# ⚠️  WebSocket sync failed: Connection refused
```

### Recovery Commands
```bash
# Reset configuration to defaults
buddy config set format table
buddy config set verbose false
buddy config set autoSync true

# Force sync with web UI
buddy config set autoSync true
buddy workspace activate $(buddy workspace current --format json | jq -r '.id')

# Check CLI status
buddy config show
buddy workspace current
```

## Performance Tips

### 1. Disable Auto-Sync for Batch Operations
```bash
# Disable auto-sync for faster batch operations
buddy config set autoSync false

# Perform multiple operations
buddy workspace create "Workspace 1"
buddy workspace create "Workspace 2"
buddy workspace create "Workspace 3"

# Re-enable auto-sync
buddy config set autoSync true

# Manual sync
buddy workspace activate $(buddy workspace current --format json | jq -r '.id')
```

### 2. Use JSON Format for Scripting
```bash
# JSON format is faster to parse in scripts
CURRENT_WORKSPACE=$(buddy workspace current --format json)
WORKSPACE_NAME=$(echo "$CURRENT_WORKSPACE" | jq -r '.name')
WORKSPACE_ID=$(echo "$CURRENT_WORKSPACE" | jq -r '.id')
```

### 3. Filter Data at CLI Level
```bash
# More efficient than post-processing
buddy workspace list --include-archived false
buddy chatapp list --status expanded

# Instead of:
# buddy workspace list --format json | jq '.[] | select(.isArchived == false)'
```

This CLI provides a comprehensive command-line interface for workspace management that complements the web UI and enables powerful automation and scripting capabilities. 