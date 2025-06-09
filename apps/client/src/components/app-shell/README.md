# AppShell Architecture

This document defines the proper architecture for the AppShell component hierarchy with clear separation of concerns and xState/store integration.

## Architecture Overview

The AppShell follows a **top-down component hierarchy** with **clear separation of concerns**:

```
AppShell (Layout Orchestrator)
├── AppToolbar (Navigation & Global Actions)
├── AppSidebar (Navigation & Tools)
└── Main Content Area (Dynamic Content)
```

## Component Responsibilities

### 1. AppShell (Root Layout Component)

**Primary Responsibility**: Layout orchestration and global state coordination

**Specific Responsibilities**:
- Layout structure (header, sidebar, main content)
- Global keyboard shortcuts
- Window/viewport management
- Component coordination (not business logic)
- Error boundary integration

**What it SHOULD NOT do**:
- ❌ Theme management (delegate to ThemeStore)
- ❌ Chat business logic (delegate to ChatStore)
- ❌ Complex state management (delegate to stores)
- ❌ Data fetching or API calls

**Dependencies**:
- `useAppLayoutStore` (UI layout state)
- `useThemeStore` (theme application only)

### 2. AppToolbar (Global Navigation)

**Primary Responsibility**: Global navigation and quick actions

**Specific Responsibilities**:
- Sidebar toggle control
- Global navigation buttons
- Quick action buttons (search, settings, etc.)
- Breadcrumb navigation
- Global status indicators

**What it SHOULD NOT do**:
- ❌ Theme editing (that's AppSidebar's job)
- ❌ Chat-specific actions (that's chat components' job)
- ❌ Complex business logic

**Dependencies**:
- `useAppLayoutStore` (sidebar state)
- `useThemeStore` (theme application only)

### 3. AppSidebar (Tools & Navigation)

**Primary Responsibility**: Secondary navigation and tool panels

**Specific Responsibilities**:
- Theme editing interface
- Navigation menu
- Tool panels (settings, preferences)
- Import/export functionality
- Secondary actions

**What it SHOULD NOT do**:
- ❌ Layout orchestration (that's AppShell's job)
- ❌ Global navigation (that's AppToolbar's job)
- ❌ Chat message handling

**Dependencies**:
- `useAppLayoutStore` (sidebar state)
- `useThemeStore` (theme editing)
- `useNavigationStore` (navigation state)

## Store Architecture

### 1. AppLayoutStore (xState/store)

**Purpose**: Pure UI layout state management

```typescript
interface AppLayoutState {
  // Sidebar state
  isSidebarOpen: boolean;
  sidebarWidth: number;
  
  // Toolbar state
  isToolbarVisible: boolean;
  toolbarHeight: number;
  
  // Layout preferences
  layoutMode: 'default' | 'compact' | 'wide';
  
  // Responsive state
  isMobile: boolean;
  screenSize: 'sm' | 'md' | 'lg' | 'xl';
}

// Events
type AppLayoutEvent =
  | { type: 'toggleSidebar' }
  | { type: 'setSidebarOpen'; isOpen: boolean }
  | { type: 'setSidebarWidth'; width: number }
  | { type: 'setLayoutMode'; mode: AppLayoutState['layoutMode'] }
  | { type: 'setScreenSize'; size: AppLayoutState['screenSize'] };
```

### 2. ThemeStore (xState/store)

**Purpose**: Theme management and customization

```typescript
interface ThemeState {
  // Current themes
  themes: Record<string, ChatAppTheme>;
  activeThemeId: string;
  
  // Editing state
  isEditing: boolean;
  editingThemeId: string | null;
  editingColors: Record<string, string>;
  
  // UI state
  colorPickerOpen: string | null;
  
  // Import/export state
  isImporting: boolean;
  isExporting: boolean;
}

// Events
type ThemeEvent =
  | { type: 'setActiveTheme'; themeId: string }
  | { type: 'startEditing'; themeId: string }
  | { type: 'stopEditing' }
  | { type: 'updateColor'; key: string; value: string }
  | { type: 'openColorPicker'; key: string }
  | { type: 'closeColorPicker' }
  | { type: 'importTheme'; theme: ChatAppTheme }
  | { type: 'exportTheme'; themeId: string };
```

### 3. NavigationStore (xState/store)

**Purpose**: Navigation state and routing

```typescript
interface NavigationState {
  // Current location
  currentRoute: string;
  previousRoute: string;
  
  // Navigation history
  history: string[];
  canGoBack: boolean;
  canGoForward: boolean;
  
  // Active sections
  activeSection: 'chat' | 'settings' | 'help';
  activeChatId: string | null;
  
  // Breadcrumbs
  breadcrumbs: BreadcrumbItem[];
}

// Events
type NavigationEvent =
  | { type: 'navigate'; route: string }
  | { type: 'goBack' }
  | { type: 'goForward' }
  | { type: 'setActiveSection'; section: NavigationState['activeSection'] }
  | { type: 'setActiveChatId'; chatId: string | null };
```

## Implementation Plan

### Phase 1: Extract Layout Store

1. Create `AppLayoutStore` with xState/store
2. Move sidebar state from AppShellStore to AppLayoutStore
3. Update AppShell to use AppLayoutStore
4. Add responsive layout handling

### Phase 2: Extract Theme Store

1. Create `ThemeStore` with xState/store
2. Move theme logic from components to ThemeStore
3. Implement theme editing state machine
4. Add import/export functionality

### Phase 3: Extract Navigation Store

1. Create `NavigationStore` with xState/store
2. Implement navigation state management
3. Add breadcrumb support
4. Integrate with routing

### Phase 4: Refactor Components

1. Simplify AppShell to pure layout orchestration
2. Refactor AppToolbar to use stores
3. Refactor AppSidebar to use stores
4. Remove duplicate logic

## Store Integration Patterns

### 1. Pure State Management (xState/store)

```typescript
// stores/appLayoutStore.ts
import { createStore } from '@xstate/store';

export const appLayoutStore = createStore({
  context: {
    isSidebarOpen: false,
    sidebarWidth: 240,
    isToolbarVisible: true,
    toolbarHeight: 48,
    layoutMode: 'default' as const,
    isMobile: false,
    screenSize: 'lg' as const,
  },
  on: {
    toggleSidebar: (context) => ({
      ...context,
      isSidebarOpen: !context.isSidebarOpen,
    }),
    setSidebarOpen: (context, event: { isOpen: boolean }) => ({
      ...context,
      isSidebarOpen: event.isOpen,
    }),
    // ... other events
  },
});
```

### 2. React Integration

```typescript
// components/app-shell/AppShell.tsx
import { useStore } from '@xstate/store/react';
import { appLayoutStore } from '@/stores/appLayoutStore';

export function AppShell({ children }: AppShellProps) {
  const layoutState = useStore(appLayoutStore);
  
  return (
    <div className="app-shell">
      <AppToolbar />
      <AppSidebar 
        isOpen={layoutState.isSidebarOpen}
        width={layoutState.sidebarWidth}
      />
      <main>{children}</main>
    </div>
  );
}
```

### 3. Action Dispatching

```typescript
// components/app-shell/AppToolbar.tsx
import { appLayoutStore } from '@/stores/appLayoutStore';

export function AppToolbar() {
  const handleToggleSidebar = () => {
    appLayoutStore.send({ type: 'toggleSidebar' });
  };
  
  return (
    <header>
      <button onClick={handleToggleSidebar}>
        Toggle Sidebar
      </button>
    </header>
  );
}
```

## Benefits of This Architecture

### 1. **Clear Separation of Concerns**
- Each component has a single, well-defined responsibility
- Business logic is separated from presentation logic
- State management is centralized and predictable

### 2. **Improved Maintainability**
- Easy to test individual components and stores
- Clear data flow makes debugging easier
- Changes to one area don't affect others

### 3. **Better Performance**
- Components only re-render when their specific state changes
- Selective subscriptions prevent unnecessary updates
- Event-driven updates are more efficient

### 4. **Enhanced Developer Experience**
- Clear interfaces and contracts
- Type-safe state management
- Comprehensive logging and debugging

### 5. **Scalability**
- Easy to add new features without breaking existing code
- Stores can be composed and extended
- Component hierarchy can grow without complexity

## Migration Strategy

### 1. **Gradual Migration**
- Migrate one store at a time
- Keep existing functionality working during migration
- Add new features using the new architecture

### 2. **Backward Compatibility**
- Maintain existing APIs during transition
- Provide migration helpers
- Document breaking changes clearly

### 3. **Testing Strategy**
- Test stores independently
- Test component integration
- Test complete user workflows

## Anti-Patterns to Avoid

### 1. **DON'T Mix Concerns**
```typescript
// ❌ Bad: AppShell handling chat logic
export function AppShell() {
  const [messages, setMessages] = useState([]);
  const sendMessage = async (text: string) => {
    // Chat logic in layout component - WRONG!
  };
}

// ✅ Good: AppShell only handles layout
export function AppShell() {
  const layoutState = useStore(appLayoutStore);
  // Only layout concerns here
}
```

### 2. **DON'T Duplicate State**
```typescript
// ❌ Bad: Multiple sources of truth
const [isSidebarOpen, setIsSidebarOpen] = useState(false);
const { sidebarOpen } = useAppShellStore(); // Duplicate!

// ✅ Good: Single source of truth
const layoutState = useStore(appLayoutStore);
```

### 3. **DON'T Put Everything in One Store**
```typescript
// ❌ Bad: God store with everything
interface AppStore {
  layout: LayoutState;
  theme: ThemeState;
  chat: ChatState;
  user: UserState;
  // ... everything else
}

// ✅ Good: Focused stores
const layoutStore = createStore(/* layout only */);
const themeStore = createStore(/* theme only */);
const chatStore = createStore(/* chat only */);
```

## Conclusion

This architecture provides a solid foundation for the AppShell component hierarchy with:

- **Clear responsibilities** for each component
- **Proper separation of concerns** between UI and business logic
- **Event-driven state management** with xState/store
- **Scalable and maintainable** codebase
- **Type-safe and predictable** data flow

The migration can be done gradually, ensuring existing functionality continues to work while improving the architecture incrementally. 