# AppShell Responsibilities - Systematic Definition

## Current Implementation Analysis

### What AppShell Currently Does

**From `AppShell.tsx` analysis:**

1. **Layout Structure** ✅ (Core Responsibility)
   - Provides root layout container (`h-screen w-full flex`)
   - Manages sidebar + main content layout
   - Renders `AppSidebar` and `AppToolbar` components
   - Provides scrollable content area for `children`

2. **Sidebar State Management** ⚠️ (Should be delegated)
   - Local state: `const [isSidebarOpen, setIsSidebarOpen] = useState(false)`
   - Toggle function: `toggleSidebar()`
   - Passes state to `AppSidebar` and `AppToolbar`

3. **Theme Processing & Application** ❌ (Should be delegated)
   - Imports and uses `useTheme()` from next-themes
   - Complex theme parsing logic (40+ lines)
   - Theme style computation and CSS variable application
   - Error handling for theme parsing
   - Applies theme styles to root container and main content

4. **Component Coordination** ✅ (Core Responsibility)
   - Coordinates between `AppSidebar`, `AppToolbar`, and main content
   - Passes callback functions between components
   - Manages component communication

### What AppShell Should NOT Do (Current Issues)

❌ **Theme Management Logic**
- Complex theme parsing (lines 23-42)
- Theme style computation (lines 44-52)
- CSS variable application
- Theme error handling

❌ **Local State Management**
- Sidebar open/closed state
- Theme state management
- Any business logic state

❌ **Direct Hook Usage for Business Logic**
- `useTheme()` for theme processing
- `useSelectedChat()` (currently unused but imported)

## Precise Responsibility Definition

### ✅ PRIMARY RESPONSIBILITIES (What AppShell SHOULD do)

#### 1. **Layout Orchestration**
```typescript
// GOOD: Pure layout structure
return (
  <div className="app-shell-container">
    <AppSidebar />
    <main className="main-content">
      <AppToolbar />
      <div className="content-area">{children}</div>
    </main>
  </div>
);
```

**Specific duties:**
- Define root layout structure (sidebar + main content)
- Provide semantic HTML structure (`main`, proper ARIA labels)
- Handle responsive layout classes
- Manage layout-specific CSS classes and structure

#### 2. **Component Composition**
```typescript
// GOOD: Component coordination without business logic
<AppSidebar 
  isOpen={layoutState.isSidebarOpen}
  onToggle={layoutActions.toggleSidebar}
/>
<AppToolbar 
  onToggleSidebar={layoutActions.toggleSidebar}
/>
```

**Specific duties:**
- Render child components in correct layout positions
- Pass layout-related props between components
- Coordinate component communication (callbacks, event handlers)
- Manage component hierarchy and rendering order

#### 3. **Accessibility & Semantics**
```typescript
// GOOD: Proper accessibility
<main 
  id="main-content" 
  role="main"
  aria-label="Application content"
>
  <div className="content-area" role="region">
    {children}
  </div>
</main>
```

**Specific duties:**
- Provide proper ARIA labels and roles
- Ensure keyboard navigation works
- Manage focus management between layout areas
- Provide semantic HTML structure

#### 4. **Layout State Integration**
```typescript
// GOOD: Pure state consumption
const layoutState = useStore(appLayoutStore);
const themeState = useStore(themeStore);

// Apply state without business logic
<div 
  className={cn(
    "app-shell",
    layoutState.layoutMode === 'compact' && "compact-mode"
  )}
  style={themeState.cssVariables}
>
```

**Specific duties:**
- Subscribe to layout store for UI state
- Subscribe to theme store for styling
- Apply state to layout without processing
- Re-render when layout state changes

### ❌ RESPONSIBILITIES TO DELEGATE

#### 1. **Theme Management** → `ThemeStore`
```typescript
// BAD: Theme processing in AppShell
const [currentTheme, setCurrentTheme] = useState<ChatAppTheme>(defaultChatTheme);
useEffect(() => {
  // 40+ lines of theme parsing logic
}, [rawTheme]);

// GOOD: Delegate to ThemeStore
const themeState = useStore(themeStore);
// Just apply the processed theme
```

#### 2. **Sidebar State** → `AppLayoutStore`
```typescript
// BAD: Local sidebar state
const [isSidebarOpen, setIsSidebarOpen] = useState(false);
function toggleSidebar() {
  setIsSidebarOpen((open) => !open);
}

// GOOD: Delegate to AppLayoutStore
const layoutState = useStore(appLayoutStore);
const toggleSidebar = () => appLayoutStore.send({ type: 'toggleSidebar' });
```

#### 3. **Business Logic** → Appropriate Services/Stores
```typescript
// BAD: Any business logic in AppShell
const { selectedChatId } = useAppShellStore(); // Chat business logic

// GOOD: Only layout concerns
const layoutState = useStore(appLayoutStore); // Layout UI state only
```

## Refined Interface Definition

### Input Props (What AppShell Receives)
```typescript
interface AppShellProps {
  // Core requirement: content to render
  readonly children: React.ReactNode;
  
  // Optional: layout preferences (could come from store instead)
  readonly className?: string;
  readonly layoutMode?: 'default' | 'compact' | 'wide';
  
  // Optional: accessibility
  readonly ariaLabel?: string;
  readonly role?: string;
}
```

### Dependencies (What AppShell Uses)
```typescript
// Layout state (UI only)
const layoutState = useStore(appLayoutStore);

// Theme state (processed styles only)
const themeState = useStore(themeStore);

// NO business logic dependencies
// NO direct theme processing
// NO local state management
```

### Output (What AppShell Provides)
```typescript
// Pure layout structure with applied state
<div 
  className="app-shell"
  style={themeState.cssVariables}
  aria-label={ariaLabel}
>
  <AppSidebar 
    isOpen={layoutState.isSidebarOpen}
    width={layoutState.sidebarWidth}
    onToggle={() => appLayoutStore.send({ type: 'toggleSidebar' })}
  />
  <main className="main-content">
    <AppToolbar 
      onToggleSidebar={() => appLayoutStore.send({ type: 'toggleSidebar' })}
    />
    <div className="content-area">
      {children}
    </div>
  </main>
</div>
```

## Implementation Rules

### ✅ ALLOWED in AppShell
1. **Layout JSX structure**
2. **CSS class application**
3. **Store subscriptions** (read-only)
4. **Event dispatching** to stores
5. **Component rendering** and prop passing
6. **Accessibility attributes**
7. **Responsive layout classes**

### ❌ FORBIDDEN in AppShell
1. **Local state** (`useState`, `useReducer`)
2. **Side effects** (`useEffect` for business logic)
3. **Data processing** (theme parsing, calculations)
4. **Business logic** (chat, user, agent logic)
5. **API calls** or async operations
6. **Complex computations**
7. **Direct theme/data manipulation**

## Success Criteria

AppShell is correctly implemented when:

1. **Single Responsibility**: Only handles layout orchestration
2. **No Local State**: All state comes from stores
3. **No Business Logic**: Only UI layout concerns
4. **Pure Function**: Given same store state, renders same output
5. **Minimal Dependencies**: Only layout and theme stores
6. **Clear Interface**: Simple props, clear outputs
7. **Easy Testing**: Can test layout without mocking complex logic

## Migration Path

### Phase 1: Extract Sidebar State
- Move `isSidebarOpen` to `AppLayoutStore`
- Remove local state from AppShell
- Update components to use store

### Phase 2: Extract Theme Processing
- Move theme parsing logic to `ThemeStore`
- AppShell only consumes processed theme
- Remove theme processing from AppShell

### Phase 3: Simplify Interface
- Remove unused imports (`useSelectedChat`)
- Simplify component to pure layout
- Add proper accessibility

### Phase 4: Verify Compliance
- Ensure no local state remains
- Verify no business logic
- Test layout-only functionality

## Conclusion

**AppShell's ONLY job**: Provide layout structure and coordinate layout components.

Everything else (theme processing, state management, business logic) should be delegated to appropriate stores and services. This creates a clean, testable, and maintainable component that does one thing well. 