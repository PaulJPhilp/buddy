# Buddy Workspace CLI

Command line interface for managing Buddy workspaces and chat applications.

## Installation

```bash
# Install dependencies
bun install

# Make CLI executable globally (optional)
bun link
```

## Usage

```bash
# Run directly
bun run src/buddy-workspace-cli.ts

# Or if globally linked
buddy
```

## Commands

### Workspace Management

```bash
# Create a new workspace
buddy workspace create "My Workspace" --icon "📁" --color "#3b82f6"

# List all workspaces
buddy workspace list

# List including archived workspaces
buddy workspace list --include-archived

# Show current workspace
buddy workspace current

# Activate a workspace
buddy workspace activate <workspace-id>

# Archive a workspace
buddy workspace archive <workspace-id>

# Show workspace details
buddy workspace show <workspace-id>
```

### Chat App Management

```bash
# List chat apps in current workspace
buddy chatapp list

# List chat apps in specific workspace
buddy chatapp list --workspace <workspace-id>

# Show chat app details
buddy chatapp show <chatapp-id>
```

### Configuration

```bash
# Show current configuration
buddy config show

# Set configuration values
buddy config set format json
buddy config set verbose true
buddy config set server.httpUrl http://localhost:3003
```

## Configuration

The CLI stores configuration in `~/.buddy/config.json` and workspace state in `~/.buddy/workspace.json`.

### Default Configuration

```json
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

## Output Formats

- `table` - Human-readable table format (default)
- `json` - JSON output for scripting
- `yaml` - YAML output

## Environment Variables

- `BUDDY_CLI_HTTP_URL` - Override HTTP server URL
- `BUDDY_CLI_WS_URL` - Override WebSocket server URL

## Examples

```bash
# Create a workspace for a specific project
buddy workspace create "AI Research" --icon "🤖" --color "#10b981"

# List workspaces in JSON format
buddy config set format json
buddy workspace list

# Show current workspace with chat apps
buddy workspace current --verbose
``` 