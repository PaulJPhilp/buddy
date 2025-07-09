# Buddy CLI

A powerful command-line interface for managing Buddy workspaces, chat applications, and configuration.

## Features

- ✅ **Workspace Management** - Create, list, update, and delete workspaces
- ✅ **Chat App Management** - Create, list, show, and delete chat applications
- ✅ **Configuration Management** - View, set, and manage CLI configuration
- ✅ **Verification System** - Verify configuration integrity and validate changes
- ✅ **Multiple Output Formats** - Table, JSON, and YAML output formats
- ✅ **Type Safety** - Built with Effect.js and TypeScript for robust error handling

## Installation

```bash
cd apps/cli
bun install
```

## Usage

### Basic Commands

```bash
# Show help
bun run dev --help

# Workspace management
bun run dev workspace create "My Workspace" --description="A new workspace"
bun run dev workspace list
bun run dev workspace show workspace-id

# Chat app management
bun run dev chatapp create "My Bot" --workspace="workspace-id"
bun run dev chatapp list
bun run dev chatapp show chatapp-id

# Configuration management
bun run dev config show
bun run dev config set format json
bun run dev config get format
```

### Verification Features

The CLI includes powerful verification features to ensure your changes are applied correctly:

```bash
# Create with automatic verification
bun run dev workspace create "My Workspace" --verify
bun run dev chatapp create "My Bot" --workspace="workspace-id" --verify

# Dedicated verification commands
bun run dev verify config
bun run dev verify workspace workspace-id
bun run dev verify chatapp chatapp-id

# Compare configurations
bun run dev verify compare /path/to/before.json /path/to/after.json
```

See [VERIFICATION.md](./VERIFICATION.md) for detailed verification documentation.

## Commands

### Workspace Commands

- `workspace create <name>` - Create a new workspace
- `workspace list` - List all workspaces
- `workspace show <id>` - Show workspace details
- `workspace update <id>` - Update workspace properties
- `workspace delete <id>` - Delete a workspace

### Chat App Commands

- `chatapp create <name>` - Create a new chat app
- `chatapp list` - List all chat apps
- `chatapp show <id>` - Show chat app details
- `chatapp delete <id>` - Delete a chat app

### Configuration Commands

- `config show` - Show current configuration
- `config get <key>` - Get a configuration value
- `config set <key> <value>` - Set a configuration value
- `config reset` - Reset configuration to defaults

### Verification Commands

- `verify config` - Verify configuration health
- `verify workspace <id>` - Verify workspace integrity
- `verify chatapp <id>` - Verify chat app integrity
- `verify compare <before> <after>` - Compare two configurations

## Options

### Global Options

- `--help` - Show help information
- `--version` - Show version information

### Format Options

- `--format=table` - Table format (default)
- `--format=json` - JSON format
- `--format=yaml` - YAML format

### Verification Options

- `--verify` - Enable automatic verification for create commands
- `--verbose` - Show detailed verification information

## Examples

### Creating a Complete Workspace Setup

```bash
# Create workspace with verification
bun run dev workspace create "Development Team" \
  --description="Team workspace for development" \
  --agents="dev-agent,qa-agent" \
  --verify

# Create chat app in the workspace
bun run dev chatapp create "Dev Assistant" \
  --workspace="development-team" \
  --agent="dev-agent" \
  --description="Development assistant bot" \
  --verify

# Verify the setup
bun run dev verify workspace "development-team"
bun run dev verify config --verbose
```

### Configuration Management

```bash
# Set output format to JSON
bun run dev config set format json

# Set verbose mode
bun run dev config set verbose true

# Show current configuration
bun run dev config show --format=table
```

### Verification Workflow

```bash
# Check configuration health
bun run dev verify config

# Create resources with verification
bun run dev workspace create "Production" --verify
bun run dev chatapp create "Support Bot" --workspace="production" --verify

# Verify specific resources
bun run dev verify workspace "production"
bun run dev verify chatapp "support-bot"
```

## Testing

Run the verification test script to test all CLI features:

```bash
./test-verification.sh
```

This script tests:
- Help commands
- Configuration verification
- Workspace operations
- Chat app operations
- Verification commands
- Configuration management

## Architecture

The CLI is built with:

- **Effect.js** - For type-safe, composable effects and error handling
- **@effect/cli** - For CLI argument parsing and command structure
- **TypeScript** - For type safety and developer experience
- **Layer Pattern** - For dependency injection and service composition

### Project Structure

```
apps/cli/
├── src/
│   ├── commands/           # CLI command definitions
│   │   ├── workspace.ts    # Workspace management commands
│   │   ├── chatapp.ts      # Chat app management commands
│   │   ├── config.ts       # Configuration management commands
│   │   └── verify.ts       # Verification commands
│   ├── services/           # CLI services
│   │   ├── cli-config.ts   # CLI configuration service
│   │   └── output-formatter.ts # Output formatting service
│   └── index.ts           # Main CLI entry point
├── VERIFICATION.md        # Verification documentation
├── test-verification.sh   # Test script
└── README.md             # This file
```

## Development

### Adding New Commands

1. Create a new command file in `src/commands/`
2. Define the command using `@effect/cli`
3. Add the command to the main CLI app in `src/index.ts`

### Adding New Services

1. Create a new service file in `src/services/`
2. Use the Effect.Service pattern
3. Add the service to the CLI layer in `src/index.ts`

### Error Handling

The CLI uses Effect.js for comprehensive error handling:

- Tagged errors for specific error types
- Proper error propagation and recovery
- User-friendly error messages
- Exit codes for scripting

## Contributing

1. Follow the existing code patterns
2. Use Effect.js patterns for all async operations
3. Add verification features for new commands
4. Update documentation for new features
5. Test with the verification script

## License

MIT 