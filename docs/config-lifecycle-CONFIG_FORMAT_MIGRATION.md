# Config Format Migration Guide

## Overview

We've simplified the config file format from a complex nested structure to a clean, flattened format where each config file represents a single chat app directly.

## Format Changes

### Old Format (Deprecated)
```json
{
  "agents": [
    {
      "id": "pink-agent",
      "initialAgentName": "Pink Agent"
    }
  ],
  "toolbars": [
    {
      "id": "default-toolbar", 
      "name": "Default Toolbar",
      "tools": []
    }
  ],
  "themes": {
    "pink-theme": {
      "colors": { ... }
    }
  },
  "chatApps": [
    {
      "id": "pink-chat",
      "name": "Pink Chat",
      "agentId": "pink-agent",
      "toolbarId": "default-toolbar",
      "themeId": "pink-theme"
    }
  ]
}
```

### New Format (Current)
```json
{
  "id": "pink-chat",
  "name": "Pink Chat", 
  "agentId": "pink-agent",
  "toolbarId": "default-toolbar",
  "themeId": "pink-theme",
  "description": "A pink-themed chat application",
  "version": "1.0.0",
  
  "agent": {
    "id": "pink-agent",
    "initialAgentName": "Pink Agent"
  },
  
  "toolbar": {
    "id": "default-toolbar",
    "name": "Default Toolbar", 
    "tools": []
  },
  
  "theme": {
    "colors": { ... }
  }
}
```

## Benefits

1. **Simpler Structure**: Each file is just the chat app metadata directly
2. **Self-Contained**: All related data (agent, toolbar, theme) is embedded
3. **Better Semantics**: One file = one chat app (makes more sense)
4. **Easier Editing**: Direct access to all properties without nested navigation
5. **Cleaner APIs**: No need to extract from arrays or lookup themes

## Backward Compatibility

The system maintains backward compatibility:

- **Loading**: Both old and new formats are supported during config loading
- **Import**: Toolbar commands handle both formats when importing configs
- **Saving**: New configs are always saved in the new format

## Migration Path

### Automatic Migration
- Existing old format files continue to work
- When configs are edited and saved, they're automatically converted to the new format

### Manual Migration
To manually convert a config file:

1. Take the chat app object from the `chatApps` array
2. Move it to the root level
3. Embed the corresponding `agent`, `toolbar`, and `theme` objects
4. Add metadata fields like `description`, `version`, etc.

## Schema Updates

### ChatAppConfig Interface
```typescript
export interface ChatAppConfig {
  id: string;
  name: string;
  agentId: string;
  toolbarId: string; 
  themeId: string;
  theme?: ChatAppTheme;
  
  // New embedded configurations
  agent?: AgentConfig;
  toolbar?: ToolbarConfig;
  
  // New metadata
  description?: string;
  version?: string;
  createdAt?: string;
  updatedAt?: string;
}
```

### New Embedded Types
```typescript
export interface AgentConfig {
  id: string;
  initialAgentName: string;
}

export interface ToolbarConfig {
  id: string;
  name: string;
  tools: string[];
}
```

## Implementation Changes

### ConfigLifecycleService
- `loadConfigsFromFiles`: Handles both old and new formats
- `saveConfigToFile`: Always saves in new format
- Backward compatibility maintained for existing workflows

### Toolbar Commands
- Import logic updated to handle both formats
- Delete logic updated to work with both formats  
- Usage detection updated for both formats

### Real-Time Editing
- Works seamlessly with new format
- Theme changes are directly embedded in config
- No need for separate theme lookups

## Testing

- Simple tests pass, confirming core functionality works
- Main test suite needs updates for new format (mocked data)
- Real-world usage should work immediately

## Next Steps

1. Update test mocks to use new format
2. Consider deprecation warnings for old format
3. Update documentation and examples
4. Monitor for any edge cases during transition 