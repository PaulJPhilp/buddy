# Toolbar Command System

## Overview

The toolbar command system provides a flexible, command-driven approach to application toolbars. Tools own their own state through stores, and the toolbar simply renders commands that execute actions.

## Architecture

### Core Components

```
Toolbar System
├── types.ts           - TypeScript interfaces
├── Toolbar.tsx        - Main toolbar component
├── commands.tsx       - Predefined command configurations
├── index.ts          - Public exports
└── README.md         - This documentation
```

### Supporting Infrastructure

```
Supporting Files
├── stores/
│   ├── themeStore.ts      - Theme management state
│   ├── appLayoutStore.ts  - Layout and sidebar state
│   └── clerkAdminStore.ts - User management panel state
└── hooks/
    ├── useDynamicToolbar.ts   - Dynamic command state updates
    └── useThemeIntegration.ts - Theme provider integration
```

## Key Principles

### 1. **Tools Own Their State**
Each tool (sidebar, theme editor, admin panel) manages its own state through dedicated stores:

```typescript
// Tools manage their own state
appLayoutStore.send({ type: 'toggleSidebar' })
themeStore.send({ type: 'toggleEditor' })
clerkAdminStore.send({ type: 'togglePanel' })
```

### 2. **Commands Execute Actions**
Toolbar commands are simple action dispatchers:

```typescript
{
  id: 'toggle-sidebar',
  label: 'Toggle Sidebar',
  icon: <Menu className="h-4 w-4" />,
  action: () => appLayoutStore.send({ type: 'toggleSidebar' }),
  tooltip: 'Open/close sidebar',
}
```

### 3. **Dynamic State Synchronization**
The `useDynamicToolbar` hook keeps command active states synchronized with store state:

```typescript
const toolbarConfig = useDynamicToolbar(baseConfig)
// Automatically updates active states based on store subscriptions
```

## Implementation

### Current Commands

The system currently implements these commands:

1. **Sidebar Toggle** (`toggle-sidebar`)
   - **Action**: Opens/closes the application sidebar
   - **Store**: `appLayoutStore`
   - **Icon**: Menu icon
   - **Active State**: Reflects `isSidebarOpen`

2. **Theme Editor Toggle** (`toggle-theme-editor`)
   - **Action**: Opens/closes the theme editing panel
   - **Store**: `themeStore`
   - **Icon**: Palette icon
   - **Active State**: Reflects `isEditorOpen`

3. **Clerk Admin Panel Toggle** (`toggle-clerk-admin`)
   - **Action**: Opens/closes the user management panel
   - **Store**: `clerkAdminStore`
   - **Icon**: Users icon
   - **Active State**: Reflects `isPanelOpen`

4. **Settings** (`settings`)
   - **Action**: Placeholder for future settings panel
   - **Store**: None (placeholder)
   - **Icon**: Settings icon

### AppShell Integration

The AppShell now uses the toolbar system:

```typescript
export function AppShell({ children }: AppShellProps) {
  useThemeIntegration();
  const cssVariables = useThemeCSSVariables();
  const layoutState = useAppLayoutStore();

  // Get dynamic toolbar with active states
  const baseConfig = getToolbarConfig(layoutState.isMobile);
  const toolbarConfig = useDynamicToolbar(baseConfig);

  return (
    <div className="h-screen w-full flex flex-col" style={cssVariables}>
      <Toolbar config={toolbarConfig} />
      <div className="flex-1 flex">
        <AppSidebar isOpen={layoutState.isSidebarOpen} />
        <main className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
```

## Usage Examples

### Adding a New Command

1. **Create the store** (if needed):
```typescript
// stores/myFeatureStore.ts
export const myFeatureStore = createStore({
  isOpen: false,
}, {
  toggle: (context) => ({ ...context, isOpen: !context.isOpen }),
})
```

2. **Add to toolbar configuration**:
```typescript
// components/toolbar/commands.tsx
{
  id: 'toggle-my-feature',
  label: 'My Feature',
  icon: <MyIcon className="h-4 w-4" />,
  action: () => myFeatureStore.send({ type: 'toggle' }),
  tooltip: 'Toggle my feature',
}
```

3. **Update dynamic toolbar hook**:
```typescript
// hooks/useDynamicToolbar.ts
case 'toggle-my-feature':
  updatedCommand.active = myFeatureState.isOpen
  break
```

### Responsive Toolbar

The system supports responsive configurations:

```typescript
// Automatically switches between full and compact based on screen size
const baseConfig = getToolbarConfig(layoutState.isMobile);
```

### Custom Toolbar Configurations

Create custom configurations for different contexts:

```typescript
const customToolbarConfig: ToolbarConfig = {
  id: 'custom-toolbar',
  position: 'top',
  variant: 'compact',
  items: [
    // Custom commands
  ],
}
```

## Benefits

### 1. **Separation of Concerns**
- ✅ Toolbar handles UI rendering
- ✅ Stores handle business logic
- ✅ Commands bridge the two

### 2. **Reusability**
- ✅ Commands can be reused across toolbars
- ✅ Stores can be accessed from anywhere
- ✅ Toolbar component is context-agnostic

### 3. **Type Safety**
- ✅ Comprehensive TypeScript interfaces
- ✅ Type guards for command types
- ✅ Proper event typing

### 4. **Maintainability**
- ✅ Add new commands without changing toolbar
- ✅ Modify tool behavior in dedicated stores
- ✅ Clear command-to-action mapping

### 5. **Testability**
- ✅ Test stores independently
- ✅ Test commands as pure functions
- ✅ Mock store state for toolbar tests

## Architecture Compliance

This implementation follows our established principles:

- ✅ **Single Responsibility**: Toolbar only renders, stores manage state
- ✅ **Event-Driven**: xState/store for predictable state management
- ✅ **Separation of Concerns**: UI ≠ business logic ≠ presentation
- ✅ **Type Safety**: Comprehensive TypeScript interfaces
- ✅ **Tools Own State**: Each tool manages its own state

## Next Steps

1. **Implement Theme Editor Panel**: Create UI for theme editing
2. **Implement Clerk Admin Panel**: Create UI for user management
3. **Add Keyboard Shortcuts**: Map commands to keyboard shortcuts
4. **Add Command Palette**: Search and execute commands
5. **Add Toolbar Customization**: Allow users to customize toolbar layout

## Verification

✅ **Build Success**: `bun run build` passes without errors
✅ **Type Safety**: All TypeScript interfaces properly defined
✅ **Store Integration**: Commands properly dispatch to stores
✅ **Dynamic Updates**: Active states sync with store state
✅ **Responsive Design**: Supports mobile and desktop configurations 