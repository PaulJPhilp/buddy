# ConfigLifecycleService Integration Plan

## Overview

This plan outlines the integration of the new ConfigLifecycleService with the enhanced config format into the existing Buddy application. The integration follows a **facade pattern** to maintain backward compatibility while adding powerful new features.

## Current State Analysis

### **Existing localStorage-Based System**
- `buddy:apps` - All available chat apps (loaded from `/configs/*.json`)
- `buddy:displayedConfigs` - Currently active/displayed chat apps
- `buddy:lastSelectedChatAppId` - Last selected chat app for theme editing
- `buddy:bootstrap` - Dev-only bootstrap configuration

### **Current Services**
- **AppService** - CRUD operations, localStorage persistence, reference validation
- **ThemesService** - Theme management and persistence
- **AgentService** - Agent configuration management
- **ToolbarService** - Toolbar configuration management

### **Current Components**
- **RootLayout** - Manages displayed configs, theme application
- **ChatAppSwitcher** - Dropdown for selecting active chat apps
- **Toolbar Commands** - Dev tools for config import/export/management

## Integration Strategy: Phased Approach

### **Phase 1: Foundation (Week 1)**
**Goal**: Establish ConfigLifecycleService as the core config management layer

#### 1.1 Service Layer Integration
```typescript
// Update service dependencies
const serviceLayer = Layer.merge(
  Layer.merge(
    AgentService.Default,
    ToolbarService.Default,
    ThemesService.Default
  ),
  ConfigLifecycleService.Default // Add new service
);
```

#### 1.2 AppService Facade Implementation
- ✅ **Refactor AppService** to delegate to ConfigLifecycleService
- ✅ **Maintain API compatibility** - no breaking changes
- ✅ **Add business logic layer** - reference validation, theme management
- ✅ **Error translation** - convert ConfigLifecycleService errors

```typescript
// apps/client/src/services/app/AppService.ts
export class AppService extends Effect.Service<AppServiceApi>()("AppService", {
  scoped: Effect.gen(function* () {
    const configLifecycle = yield* ConfigLifecycleService;
    const agentService = yield* AgentService;
    const toolbarService = yield* ToolbarService;
    const themesService = yield* ThemesService;

    const getAll = () => Effect.gen(function* () {
      const configs = yield* configLifecycle.loadConfigs();
      yield* validateAndEnrichConfigs(configs);
      return configs;
    });

    const create = (app: ChatAppConfig) => Effect.gen(function* () {
      yield* validateReferences(agentService, toolbarService, themesService, app);
      yield* configLifecycle.addConfig(app);
      yield* ensureThemeExists(app.themeId);
    });

    return { getAll, getById, create, update, delete };
  }),
  dependencies: [
    ConfigLifecycleService.Default,
    AgentService.Default,
    ToolbarService.Default,
    ThemesService.Default,
  ],
}) {}
```

#### 1.3 File System Integration
- ✅ **Update API endpoints** to handle new config format
- ✅ **Backward compatibility** for old format files
- ✅ **File watching** for external changes

### **Phase 2: UI State Management (Week 2)**
**Goal**: Replace localStorage with ConfigLifecycleService state management

#### 2.1 RootLayout Migration
```typescript
// apps/client/src/app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [configState, setConfigState] = useState<ConfigLifecycleContext | null>(null);
  
  useEffect(() => {
    // Subscribe to ConfigLifecycleService state
    const subscription = Effect.runPromise(
      Effect.gen(function* () {
        const configService = yield* ConfigLifecycleService;
        return yield* configService.subscribe(setConfigState);
      }).pipe(Effect.provide(serviceLayer))
    );
    
    return () => subscription.then(sub => sub.unsubscribe());
  }, []);

  // Use configState instead of localStorage
  const displayedConfigs = configState?.configs.filter(c => 
    configState.openConfigs.has(c.id)
  ) ?? [];
  
  const activeConfig = configState?.configs.find(c => 
    c.id === configState.activeConfigId
  ) ?? null;
}
```

#### 2.2 ChatAppSwitcher Migration
```typescript
// apps/client/src/components/toolbar/ChatAppSwitcher.tsx
export function ChatAppSwitcher() {
  const [configState, setConfigState] = useState<ConfigLifecycleContext | null>(null);
  
  useEffect(() => {
    // Subscribe to ConfigLifecycleService instead of localStorage
    const subscription = Effect.runPromise(
      Effect.gen(function* () {
        const configService = yield* ConfigLifecycleService;
        return yield* configService.subscribe(setConfigState);
      }).pipe(Effect.provide(serviceLayer))
    );
    
    return () => subscription.then(sub => sub.unsubscribe());
  }, []);

  const handleChange = (configId: string) => {
    Effect.runPromise(
      Effect.gen(function* () {
        const configService = yield* ConfigLifecycleService;
        yield* configService.setActive(configId);
        yield* configService.toggleOpen(configId);
      }).pipe(Effect.provide(serviceLayer))
    );
  };
}
```

#### 2.3 Real-Time Config Editor Integration
```typescript
// New component for real-time config editing
export function ConfigEditor({ configId }: { configId: string }) {
  const {
    config,
    saveStatus,
    updateBackgroundColor,
    updateTextColor,
    saveNow,
    revert,
    autoSaveEnabled,
    toggleAutoSave
  } = useConfigEditor({ configId, autoSave: true });

  return (
    <div className="config-editor">
      <div className="save-status">
        Status: {saveStatus} {/* saved | saving | dirty | error */}
      </div>
      
      <div className="color-controls">
        <input
          type="color"
          value={config.theme?.colors?.background || '#ffffff'}
          onChange={(e) => updateBackgroundColor(e.target.value)}
        />
      </div>
      
      <div className="controls">
        <button onClick={saveNow}>Save Now</button>
        <button onClick={revert}>Revert</button>
        <label>
          <input
            type="checkbox"
            checked={autoSaveEnabled}
            onChange={toggleAutoSave}
          />
          Auto-save
        </label>
      </div>
    </div>
  );
}
```

### **Phase 3: Enhanced Features (Week 3)**
**Goal**: Add new capabilities enabled by ConfigLifecycleService

#### 3.1 Real-Time Theme Editing
- ✅ **Immediate UI updates** when theme properties change
- ✅ **Debounced auto-save** to prevent excessive file writes
- ✅ **Save status tracking** with visual feedback
- ✅ **Conflict resolution** for concurrent edits

#### 3.2 Advanced Config Management
```typescript
// Enhanced toolbar commands with new capabilities
const enhancedToolbarConfig = {
  items: [
    {
      id: "config-manager",
      label: "Config Manager",
      action: () => openConfigManager(),
      tooltip: "Manage configurations with real-time editing"
    },
    {
      id: "theme-editor",
      label: "Theme Editor", 
      action: () => openThemeEditor(),
      tooltip: "Edit themes with live preview"
    },
    {
      id: "config-status",
      label: () => `Configs: ${getConfigStatusSummary()}`,
      action: () => showConfigStatus(),
      tooltip: "View config save status and file sync"
    }
  ]
};
```

#### 3.3 File Watching & Sync
- ✅ **External file changes** automatically reflected in UI
- ✅ **Conflict detection** when files change during editing
- ✅ **Merge strategies** for resolving conflicts
- ✅ **Backup and recovery** for failed saves

### **Phase 4: Migration & Cleanup (Week 4)**
**Goal**: Complete migration and remove legacy code

#### 4.1 localStorage Migration
```typescript
// Migration utility to move localStorage data to files
export const migrateLocalStorageToFiles = Effect.gen(function* () {
  const configService = yield* ConfigLifecycleService;
  
  // Migrate buddy:apps
  const appsData = localStorage.getItem("buddy:apps");
  if (appsData) {
    const apps = JSON.parse(appsData) as ChatAppConfig[];
    for (const app of apps) {
      yield* configService.addConfig(app);
    }
    localStorage.removeItem("buddy:apps");
  }
  
  // Migrate buddy:displayedConfigs
  const displayedData = localStorage.getItem("buddy:displayedConfigs");
  if (displayedData) {
    const displayed = JSON.parse(displayedData) as ChatAppConfig[];
    for (const config of displayed) {
      yield* configService.toggleOpen(config.id);
    }
    localStorage.removeItem("buddy:displayedConfigs");
  }
  
  // Migrate buddy:lastSelectedChatAppId
  const lastSelected = localStorage.getItem("buddy:lastSelectedChatAppId");
  if (lastSelected) {
    yield* configService.setActive(lastSelected);
    localStorage.removeItem("buddy:lastSelectedChatAppId");
  }
});
```

#### 4.2 Legacy Code Removal
- ✅ **Remove localStorage dependencies** from AppService
- ✅ **Simplify RootLayout** config management
- ✅ **Update toolbar commands** to use ConfigLifecycleService
- ✅ **Remove dev bootstrap scripts** (replaced by file-based configs)

#### 4.3 Testing & Validation
- ✅ **Update test suites** for new format and service
- ✅ **Integration testing** with real file operations
- ✅ **Performance testing** for large config sets
- ✅ **User acceptance testing** for UI workflows

## Implementation Details

### **Service Dependencies**
```typescript
// Updated service layer with all dependencies
export const serviceLayer = Layer.merge(
  Layer.merge(
    AgentService.Default,
    ToolbarService.Default, 
    ThemesService.Default
  ),
  ConfigLifecycleService.Default
);
```

### **Error Handling Strategy**
```typescript
// Centralized error handling for config operations
export class ConfigIntegrationError extends Schema.TaggedError<ConfigIntegrationError>()(
  "ConfigIntegrationError",
  {
    operation: Schema.String,
    configId: Schema.optional(Schema.String),
    cause: Schema.optional(Schema.Unknown),
  }
) {}

const handleConfigError = (operation: string, configId?: string) => 
  (error: unknown) => new ConfigIntegrationError({
    operation,
    configId,
    cause: error
  });
```

### **Performance Considerations**
- ✅ **Debounced saves** (2-second delay) to prevent excessive file I/O
- ✅ **Lazy loading** of configs only when needed
- ✅ **Efficient subscriptions** with automatic cleanup
- ✅ **Optimistic updates** for immediate UI responsiveness

### **Security & Validation**
- ✅ **Schema validation** for all config operations
- ✅ **Reference integrity** checking for agents/toolbars/themes
- ✅ **File path validation** to prevent directory traversal
- ✅ **Concurrent access control** to prevent data corruption

## Migration Timeline

### **Week 1: Foundation**
- [ ] Implement AppService facade pattern
- [ ] Add ConfigLifecycleService to service layer
- [ ] Update API endpoints for new format
- [ ] Test backward compatibility

### **Week 2: UI Integration**
- [ ] Migrate RootLayout to use ConfigLifecycleService
- [ ] Update ChatAppSwitcher subscription model
- [ ] Implement real-time config editor
- [ ] Add save status indicators

### **Week 3: Enhanced Features**
- [ ] Add file watching capabilities
- [ ] Implement conflict resolution
- [ ] Add advanced config management UI
- [ ] Performance optimization

### **Week 4: Migration & Cleanup**
- [ ] Implement localStorage migration utility
- [ ] Remove legacy localStorage code
- [ ] Update all tests
- [ ] Documentation and training

## Success Criteria

### **Functional Requirements**
- ✅ **Zero breaking changes** for existing API consumers
- ✅ **Real-time editing** with immediate UI feedback
- ✅ **File persistence** with automatic save/load
- ✅ **Conflict resolution** for concurrent edits
- ✅ **Backward compatibility** with old config format

### **Performance Requirements**
- ✅ **Sub-100ms** UI response time for theme changes
- ✅ **<2 second** debounced save delay
- ✅ **<5 second** file watch detection time
- ✅ **Memory efficient** subscription management

### **User Experience Requirements**
- ✅ **Seamless migration** from localStorage to files
- ✅ **Clear save status** indicators
- ✅ **Intuitive config management** interface
- ✅ **Reliable data persistence** with error recovery

## Risk Mitigation

### **Data Loss Prevention**
- ✅ **Automatic backups** before destructive operations
- ✅ **Validation checks** before saving
- ✅ **Rollback capabilities** for failed operations
- ✅ **Conflict detection** and resolution

### **Performance Risks**
- ✅ **Debounced operations** to prevent excessive I/O
- ✅ **Lazy loading** to reduce memory usage
- ✅ **Efficient subscriptions** with proper cleanup
- ✅ **Caching strategies** for frequently accessed data

### **Compatibility Risks**
- ✅ **Comprehensive testing** of old format support
- ✅ **Gradual migration** with fallback options
- ✅ **Version detection** and automatic upgrades
- ✅ **Clear error messages** for migration issues

## Post-Integration Benefits

### **For Developers**
- ✅ **Simplified config management** with single source of truth
- ✅ **Real-time debugging** with live config editing
- ✅ **Better testing** with file-based configs
- ✅ **Enhanced tooling** for config development

### **For Users**
- ✅ **Immediate feedback** when editing themes
- ✅ **Reliable persistence** with file-based storage
- ✅ **Better performance** with optimized operations
- ✅ **Enhanced features** like conflict resolution

### **For System**
- ✅ **Reduced complexity** with elimination of localStorage
- ✅ **Better scalability** with file-based architecture
- ✅ **Improved maintainability** with clear separation of concerns
- ✅ **Enhanced reliability** with proper error handling

This integration plan provides a comprehensive roadmap for migrating from the current localStorage-based system to the new ConfigLifecycleService while maintaining backward compatibility and adding powerful new features. 