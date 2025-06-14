# Enhanced Config Lifecycle Service

## Overview

The Enhanced Config Lifecycle Service provides real-time configuration editing with intelligent auto-save functionality, comprehensive state management, and a robust debounce strategy. This service solves the config reversion problem by making files the single source of truth while providing immediate UI responsiveness.

## Key Features

### 🚀 Real-Time Editing
- **Immediate UI Updates**: Changes appear instantly in the interface
- **Smart Auto-Save**: Files are saved automatically after 2 seconds of inactivity
- **Manual Control**: Save immediately or disable auto-save as needed

### 📊 Save Status Tracking
- **Four States**: `saved`, `saving`, `dirty`, `error`
- **Per-Config Tracking**: Each configuration has independent save status
- **Visual Feedback**: Users always know the current state of their changes

### ⚡ Debounce Strategy
- **Efficient File Operations**: Prevents excessive file writes during rapid editing
- **Cancellation Logic**: New changes cancel pending saves
- **Configurable Delay**: 2-second default with easy customization

### 🔄 Multiple Update Methods
- `updateConfigImmediate()`: Real-time editing with auto-save
- `updateConfigWithSave()`: Important changes with immediate save
- `saveConfig()`: Explicit user-triggered saves
- `revertConfig()`: Restore to last saved state

## Architecture

### State Management
Uses XState Store for predictable state transitions:

```typescript
interface EnhancedConfigLifecycleContext {
  // Core config data
  readonly configs: ChatAppConfig[];
  readonly activeConfigId: string | null;
  readonly displayMode: 'expanded' | 'compact';
  readonly openConfigs: Set<string>;
  readonly loading: boolean;
  readonly error: string | null;
  readonly lastModified: number;
  
  // Enhanced save tracking
  readonly saveStatus: Record<string, 'saved' | 'saving' | 'dirty' | 'error'>;
  readonly pendingSaves: Record<string, ChatAppConfig>;
  readonly autoSaveEnabled: boolean;
  readonly lastSaved: Record<string, number>;
}
```

### Event-Driven Updates
All state changes flow through well-defined events:

```typescript
type EnhancedConfigLifecycleEvent =
  | { type: "UPDATE_CONFIG"; configId: string; updates: Partial<ChatAppConfig> }
  | { type: "SAVE_SUCCESS"; configId: string }
  | { type: "SAVE_ERROR"; configId: string; error: string }
  | { type: "TOGGLE_AUTO_SAVE" }
  // ... and more
```

### Debounce Implementation
Custom debounce utility with Effect.js integration:

```typescript
const createDebouncer = (delayMs: number) => {
  const timeouts = new Map<string, NodeJS.Timeout>();
  
  return {
    debounce: (key, fn, ...args) => Effect.gen(function* () {
      // Clear existing timeout
      const existingTimeout = timeouts.get(key);
      if (existingTimeout) clearTimeout(existingTimeout);

      // Set new timeout with Effect integration
      yield* Effect.async<void>((resume) => {
        const timeout = setTimeout(() => {
          timeouts.delete(key);
          Effect.runPromise(fn(...args)).then(
            () => resume(Effect.succeed(undefined)),
            (error) => resume(Effect.fail(error))
          );
        }, delayMs);
        
        timeouts.set(key, timeout);
      });
    }),
    
    cancel: (key) => Effect.sync(() => {
      const timeout = timeouts.get(key);
      if (timeout) {
        clearTimeout(timeout);
        timeouts.delete(key);
      }
    }),
  };
};
```

## Usage Examples

### Basic Configuration Editing

```typescript
import { useThemeEditor } from "@/hooks/useConfigEditor";

function ConfigEditor({ configId }: { configId: string }) {
  const {
    config,
    saveStatus,
    updateBackgroundColor,
    updateName,
    saveNow,
    revert,
    autoSaveEnabled,
    toggleAutoSave,
  } = useThemeEditor(configId);

  return (
    <div>
      {/* Save Status Indicator */}
      <div className={getSaveStatusColor(saveStatus)}>
        {getSaveStatusText(saveStatus)}
      </div>

      {/* Real-time color picker */}
      <input
        type="color"
        value={config?.theme?.colors?.background || '#ffffff'}
        onChange={(e) => updateBackgroundColor(e.target.value)}
      />

      {/* Important changes with immediate save */}
      <input
        type="text"
        value={config?.name || ''}
        onChange={(e) => updateName(e.target.value)}
      />

      {/* Manual controls */}
      <button onClick={saveNow} disabled={saveStatus === 'saved'}>
        Save Now
      </button>
      <button onClick={revert} disabled={saveStatus === 'saved'}>
        Revert Changes
      </button>
      
      {/* Auto-save toggle */}
      <label>
        <input
          type="checkbox"
          checked={autoSaveEnabled}
          onChange={toggleAutoSave}
        />
        Auto-save enabled
      </label>
    </div>
  );
}
```

### Service Integration

```typescript
import { EnhancedConfigLifecycleService } from "@/services/config-lifecycle/EnhancedConfigLifecycleService";

// In your app setup
const configService = await Effect.runPromise(
  Effect.gen(function* () {
    const service = yield* EnhancedConfigLifecycleService;
    
    // Load initial configs
    yield* service.loadConfigs();
    
    // Start file watcher
    yield* service.startFileWatcher();
    
    return service;
  }).pipe(
    Effect.provide(EnhancedConfigLifecycleService.Default)
  )
);
```

## Data Flow

### Real-Time Editing Flow
1. **User changes background color** → `updateBackgroundColor()` called
2. **Immediate store update** → UI updates instantly with new color
3. **Debounced save scheduled** → 2-second timer starts
4. **Save status: `dirty`** → User sees "Unsaved changes"
5. **Timer completes** → File write occurs
6. **Save status: `saved`** → User sees "Saved"

### Important Changes Flow
1. **User changes config name** → `updateName()` called
2. **Immediate store update** → UI updates instantly
3. **Immediate save** → File write occurs immediately
4. **Save status: `saving` → `saved`** → Clear progression feedback

### Error Recovery Flow
1. **Save fails** → Save status becomes `error`
2. **User clicks revert** → `revertConfig()` called
3. **Reload from file** → Original config restored
4. **Save status: `saved`** → Back to clean state

## Benefits

### For Users
- **Immediate Feedback**: Changes appear instantly
- **Never Lose Work**: Auto-save prevents data loss
- **Clear Status**: Always know if changes are saved
- **Flexible Control**: Choose when to save important changes

### For Developers
- **Predictable State**: XState ensures consistent behavior
- **Type Safety**: Full TypeScript integration
- **Error Handling**: Comprehensive error recovery
- **Testing**: Well-tested with clear separation of concerns

### For Performance
- **Efficient File I/O**: Debouncing prevents excessive writes
- **Smart Batching**: Multiple rapid changes result in single save
- **Cancellation**: New changes cancel unnecessary pending saves
- **Memory Management**: Proper cleanup prevents memory leaks

## Testing

The service includes comprehensive tests covering:

- ✅ Basic CRUD operations
- ✅ Debounce functionality
- ✅ Save status transitions
- ✅ Auto-save behavior
- ✅ Error handling
- ✅ State management
- ✅ Subscription system

Run tests with:
```bash
bun test src/services/config-lifecycle/__tests__/
```

## Migration from Original Service

The enhanced service maintains backward compatibility while adding new features:

```typescript
// Old way (still works)
await service.updateConfig(configId, updates);

// New ways (enhanced functionality)
await service.updateConfigImmediate(configId, updates); // Auto-save
await service.updateConfigWithSave(configId, updates);  // Immediate save
```

## Configuration

### Auto-Save Settings
- **Default Delay**: 2 seconds
- **Toggle**: Users can enable/disable auto-save
- **Per-Config**: Each config tracks its own save status

### Debounce Customization
```typescript
const debouncer = createDebouncer(5000); // 5-second delay
```

### Error Handling
All operations return proper Effect types for comprehensive error handling:

```typescript
const result = await Effect.runPromise(
  service.updateConfigImmediate(configId, updates).pipe(
    Effect.catchTag("ConfigSaveError", (error) => {
      console.error("Save failed:", error.message);
      return Effect.succeed(undefined);
    })
  )
);
```

## Future Enhancements

- **Conflict Resolution**: Handle concurrent edits from multiple users
- **Undo/Redo**: Implement change history
- **Batch Operations**: Optimize multiple config updates
- **Real-time Sync**: WebSocket integration for live collaboration
- **Offline Support**: Queue changes when offline

## Conclusion

The Enhanced Config Lifecycle Service provides a robust foundation for real-time configuration editing with intelligent persistence, comprehensive state management, and excellent user experience. It solves the config reversion problem while maintaining high performance and developer ergonomics. 