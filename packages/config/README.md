# @buddy/config

Configuration management system for Buddy applications. This package provides a unified way to handle configuration, workspaces, and persistence across different Buddy applications.

## Features

- Workspace management
- Configuration validation
- File system persistence
- Platform-agnostic core
- Effect.js based API
- Type-safe configuration

## Installation

```bash
npm install @buddy/config
# or
yarn add @buddy/config
# or
pnpm add @buddy/config
```

## Usage

```typescript
import { ConfigService } from '@buddy/config';

// Create a new workspace
const workspace = await ConfigService.createWorkspace({
  name: "My Workspace",
  description: "A new workspace"
});

// List workspaces
const workspaces = await ConfigService.listWorkspaces();

// Update workspace
await ConfigService.updateWorkspace(workspace.id, {
  description: "Updated description"
});
```

## API Documentation

[Coming soon]

## License

MIT
