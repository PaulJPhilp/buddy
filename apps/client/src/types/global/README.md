# Global Types System

This directory contains centralized type definitions and schemas used across the entire application. All types are defined using Effect's `Schema.Class` pattern, which provides both runtime validation and TypeScript types in a single definition.

## Why Schema.Class?

Using `Schema.Class` provides several benefits:

1. **Single Source of Truth**: One definition serves as both the TypeScript type and runtime validator
2. **Runtime Validation**: Automatic parsing and validation of data from APIs, localStorage, etc.
3. **Type Safety**: Full TypeScript support with proper inference
4. **Serialization**: Built-in encoding/decoding for JSON and other formats
5. **Extensibility**: Easy to add new fields while maintaining backward compatibility

## Core Schemas

### ChatAppConfig

The main configuration schema for chat applications. Includes:

- **Core Properties**: `id`, `name`, `agentId`, `toolbarId`, `themeId`
- **Embedded Configs**: `agent`, `toolbar` (optional)
- **Styling Data**: `theme` (optional object for per-app styling)
- **Metadata**: `description`, `version`

```typescript
import { ChatAppConfig } from '@/types/global'

// Parse from unknown data (e.g., API response)
const parsed = ChatAppConfig.parse(unknownData)

// Check if data is valid
if (ChatAppConfig.is(someData)) {
  // someData is now typed as ChatAppConfig
}

// Encode to plain object
const encoded = ChatAppConfig.encode(config)
```

## Usage Patterns

### 1. API Integration

```typescript
import { ChatAppConfig } from '@/types/global'
import { Effect } from 'effect'

const loadConfig = (id: string) =>
  Effect.gen(function* () {
    const response = yield* fetch(`/api/configs/${id}`)
    const data = yield* response.json()
    
    // Parse with Effect error handling
    return yield* ChatAppConfig.parseEffect(data)
  })
```

### 2. Service Layer

```typescript
import { ChatAppConfig } from '@/types/global'

export class ConfigService extends Effect.Service<ConfigService>()("ConfigService", {
  effect: Effect.gen(function* () {
    const save = (config: ChatAppConfig) =>
      Effect.gen(function* () {
        // config is already validated as ChatAppConfig instance
        const encoded = ChatAppConfig.encode(config)
        yield* saveToStorage(encoded)
      })

    return { save }
  })
}) {}
```

### 3. Component Props

```typescript
import { ChatAppConfig } from '@/types/global'

interface ChatContainerProps {
  config: ChatAppConfig  // Use the Schema.Class directly as a type
}

export function ChatContainer({ config }: ChatContainerProps) {
  // config is fully typed and validated
  return <div>{config.name}</div>
}
```

## Migration Guide

When migrating existing code:

1. **Replace Interface Imports**:
   ```typescript
   // Old
   import { ChatAppConfig } from '@/types/global'
   
   // New
   import { ChatAppConfig } from '@/types/global'
   ```

2. **Update Type Annotations**:
   ```typescript
   // Types remain the same - Schema.Class instances are valid TypeScript types
   const config: ChatAppConfig = ...
   ```

3. **Add Validation Where Needed**:
   ```typescript
   // Old - no validation
   const config = JSON.parse(data)
   
   // New - with validation
   const config = ChatAppConfig.parse(JSON.parse(data))
   ```

4. **Use Utility Functions**:
   ```typescript
   // Check validity
   if (ChatAppConfig.is(data)) { ... }
   
   // Encode for storage
   const json = ChatAppConfig.encode(config)
   ```

## Best Practices

1. **Always Validate External Data**: Use `parse` or `parseEffect` for API responses, file loads, etc.
2. **Use Schema.Class Instances**: Prefer the class instances over plain objects
3. **Leverage Utility Functions**: Use the namespace functions for common operations
4. **Extend Carefully**: Add optional fields to maintain backward compatibility
5. **Document Changes**: Update this README when adding new schemas or fields

## Future Schemas

As the application grows, add new schemas following the same patterns:

- `Message.ts` - Chat message schema
- `Agent.ts` - Agent configuration schema  
- `User.ts` - User profile schema
- etc.

Each schema should follow the same pattern with utility functions and proper documentation. 