# ConfigLifecycleService Implementation Checklist

## Immediate Next Steps (Phase 1)

### ✅ **Completed**
- [x] Config format migration (old → new flattened format)
- [x] EnhancedConfigLifecycleService implementation
- [x] Real-time editing with debounced auto-save
- [x] Save status tracking (saved/saving/dirty/error)
- [x] Backward compatibility for old config format
- [x] Toolbar commands updated for new format
- [x] Example configs created (pink-buddy.json, simple-chat.json)

### 🔄 **In Progress**
- [ ] Test suite updates for new format
- [ ] AppService facade implementation

### 📋 **Phase 1 Tasks (Foundation)**

#### 1. Update Service Layer Dependencies
```typescript
// File: apps/client/src/setup-chat-config.ts
// Add ConfigLifecycleService to service layer

import { ConfigLifecycleService } from "./services/config-lifecycle";

const serviceLayer = Layer.merge(
  Layer.merge(
    AgentService.Default,
    ToolbarService.Default,
    ThemesService.Default
  ),
  ConfigLifecycleService.Default // ADD THIS
);
```

#### 2. Implement AppService Facade
```typescript
// File: apps/client/src/services/app/AppService.ts
// Replace current implementation with facade pattern

export class AppService extends Effect.Service<AppServiceApi>()("AppService", {
  scoped: Effect.gen(function* () {
    const configLifecycle = yield* ConfigLifecycleService;
    const agentService = yield* AgentService;
    const toolbarService = yield* ToolbarService;
    const themesService = yield* ThemesService;

    // Delegate all operations to ConfigLifecycleService
    const getAll = () => Effect.gen(function* () {
      const configs = yield* configLifecycle.loadConfigs();
      // Apply business logic (theme enrichment, validation)
      return configs;
    });

    // ... implement other methods
    return { getAll, getById, create, update, delete };
  }),
  dependencies: [
    ConfigLifecycleService.Default, // ADD THIS
    AgentService.Default,
    ToolbarService.Default,
    ThemesService.Default,
  ],
}) {}
```

#### 3. Update API Endpoints
```typescript
// File: apps/client/src/app/api/configs/route.ts
// Ensure API handles new config format

export async function GET(request: NextRequest) {
  // Handle both old and new format files
  // Return configs in new format
}

export async function POST(request: NextRequest) {
  // Save configs in new format only
}
```

#### 4. Add ConfigLifecycleService Export
```typescript
// File: apps/client/src/services/config-lifecycle/index.ts
export { ConfigLifecycleService } from "./ConfigLifecycleService";
export { EnhancedConfigLifecycleService } from "./EnhancedConfigLifecycleService";
export type { ConfigLifecycleServiceApi } from "./ConfigLifecycleService";
export type { EnhancedConfigLifecycleServiceApi } from "./EnhancedConfigLifecycleService";
```

### 📋 **Phase 2 Tasks (UI Integration)**

#### 1. Update RootLayout
```typescript
// File: apps/client/src/app/layout.tsx
// Replace localStorage with ConfigLifecycleService subscription

import { ConfigLifecycleService } from "@/services/config-lifecycle";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [configState, setConfigState] = useState(null);
  
  useEffect(() => {
    // Subscribe to ConfigLifecycleService state
    const subscription = Effect.runPromise(
      Effect.gen(function* () {
        const configService = yield* ConfigLifecycleService;
        yield* configService.loadConfigs(); // Initial load
        return yield* configService.subscribe(setConfigState);
      }).pipe(Effect.provide(serviceLayer))
    );
    
    return () => subscription.then(sub => sub.unsubscribe());
  }, []);

  // Use configState instead of localStorage
  const displayedConfigs = configState?.configs.filter(c => 
    configState.openConfigs.has(c.id)
  ) ?? [];
}
```

#### 2. Update ChatAppSwitcher
```typescript
// File: apps/client/src/components/toolbar/ChatAppSwitcher.tsx
// Replace localStorage with ConfigLifecycleService

export function ChatAppSwitcher() {
  const [configState, setConfigState] = useState(null);
  
  useEffect(() => {
    // Subscribe to ConfigLifecycleService
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

#### 3. Add Real-Time Config Editor
```typescript
// File: apps/client/src/components/config-editor/ConfigEditor.tsx
// Already implemented - integrate into sidebar or modal

import { ConfigEditor } from "@/components/config-editor/ConfigEditor";

// Add to sidebar or create modal for config editing
const ThemeEditorSidebar = () => {
  const [selectedConfigId, setSelectedConfigId] = useState("");
  
  return (
    <div className="theme-editor-sidebar">
      <ConfigEditor configId={selectedConfigId} />
    </div>
  );
};
```

### 📋 **Phase 3 Tasks (Enhanced Features)**

#### 1. Add File Watching
```typescript
// File: apps/client/src/app/layout.tsx
// Start file watcher on app initialization

useEffect(() => {
  Effect.runPromise(
    Effect.gen(function* () {
      const configService = yield* ConfigLifecycleService;
      yield* configService.startFileWatcher();
    }).pipe(Effect.provide(serviceLayer))
  );
  
  return () => {
    Effect.runPromise(
      Effect.gen(function* () {
        const configService = yield* ConfigLifecycleService;
        yield* configService.stopFileWatcher();
      }).pipe(Effect.provide(serviceLayer))
    );
  };
}, []);
```

#### 2. Enhanced Toolbar Commands
```typescript
// File: apps/client/src/components/toolbar/commands.tsx
// Add new commands for config management

const enhancedCommands = [
  {
    id: "config-status",
    label: "Config Status",
    icon: <Settings className="h-4 w-4" />,
    action: () => showConfigStatusModal(),
    tooltip: "View config save status and sync"
  },
  {
    id: "theme-editor",
    label: "Theme Editor",
    icon: <Palette className="h-4 w-4" />,
    action: () => openThemeEditor(),
    tooltip: "Edit themes with live preview"
  }
];
```

### 📋 **Phase 4 Tasks (Migration & Cleanup)**

#### 1. localStorage Migration Utility
```typescript
// File: apps/client/src/services/config-lifecycle/migration.ts
export const migrateLocalStorageToFiles = Effect.gen(function* () {
  const configService = yield* ConfigLifecycleService;
  
  // Migrate existing localStorage data
  const appsData = localStorage.getItem("buddy:apps");
  if (appsData) {
    const apps = JSON.parse(appsData) as ChatAppConfig[];
    for (const app of apps) {
      yield* configService.addConfig(app);
    }
    localStorage.removeItem("buddy:apps");
  }
  
  // Migrate displayed configs
  const displayedData = localStorage.getItem("buddy:displayedConfigs");
  if (displayedData) {
    const displayed = JSON.parse(displayedData) as ChatAppConfig[];
    for (const config of displayed) {
      yield* configService.toggleOpen(config.id);
    }
    localStorage.removeItem("buddy:displayedConfigs");
  }
  
  // Migrate last selected
  const lastSelected = localStorage.getItem("buddy:lastSelectedChatAppId");
  if (lastSelected) {
    yield* configService.setActive(lastSelected);
    localStorage.removeItem("buddy:lastSelectedChatAppId");
  }
});
```

#### 2. Remove Legacy Code
- [ ] Remove localStorage code from AppService
- [ ] Remove localStorage dependencies from RootLayout
- [ ] Update toolbar commands to use ConfigLifecycleService
- [ ] Remove dev bootstrap scripts

#### 3. Update Tests
```typescript
// File: apps/client/src/services/config-lifecycle/__tests__/integration.test.ts
// Add integration tests with real file operations

describe("ConfigLifecycleService Integration", () => {
  it("should migrate localStorage to files", async () => {
    // Test migration utility
  });
  
  it("should handle real-time editing", async () => {
    // Test debounced saves and UI updates
  });
  
  it("should detect file changes", async () => {
    // Test file watching
  });
});
```

## Implementation Priority

### **High Priority (Week 1)**
1. ✅ AppService facade implementation
2. ✅ Service layer integration
3. ✅ Basic file operations working
4. ✅ Backward compatibility verified

### **Medium Priority (Week 2)**
1. ✅ RootLayout migration
2. ✅ ChatAppSwitcher migration
3. ✅ Real-time config editor integration
4. ✅ Save status indicators

### **Low Priority (Week 3-4)**
1. ✅ File watching implementation
2. ✅ Advanced config management UI
3. ✅ localStorage migration utility
4. ✅ Legacy code cleanup

## Testing Strategy

### **Unit Tests**
- [x] ConfigLifecycleService methods
- [x] Config format validation
- [x] Save status transitions
- [ ] AppService facade methods
- [ ] Migration utilities

### **Integration Tests**
- [ ] File operations with real API
- [ ] Service layer dependencies
- [ ] UI component subscriptions
- [ ] End-to-end config editing

### **Manual Testing**
- [ ] Config import/export
- [ ] Real-time theme editing
- [ ] File watching behavior
- [ ] Error handling scenarios

## Success Metrics

### **Functional**
- ✅ Zero breaking changes for existing code
- ✅ Real-time editing works smoothly
- ✅ File persistence is reliable
- ✅ Backward compatibility maintained

### **Performance**
- ✅ UI updates < 100ms
- ✅ Auto-save delay = 2 seconds
- ✅ File watch detection < 5 seconds
- ✅ Memory usage optimized

### **User Experience**
- ✅ Clear save status indicators
- ✅ Intuitive config management
- ✅ Reliable data persistence
- ✅ Smooth migration experience

This checklist provides concrete, actionable steps for implementing the ConfigLifecycleService integration while maintaining system stability and user experience. 