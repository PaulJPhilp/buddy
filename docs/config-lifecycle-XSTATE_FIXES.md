# XState Store Event Handling Fixes

## Issues Identified

The ConfigLifecycleService was experiencing XState store event handling issues due to API version mismatches and incorrect function signatures.

## Root Causes

### 1. **XState Store API Version Mismatch**
- **Problem**: Using XState Store v2 API syntax with v3 library
- **Symptom**: `event` parameter was undefined in transition functions
- **Cause**: v3 changed from object-based to function-based transition syntax

### 2. **Effect Service Method Signatures**
- **Problem**: Service methods returning Effects instead of functions that return Effects
- **Symptom**: "Not a valid effect" runtime errors
- **Cause**: Effect.Service expects methods to be functions, not Effect instances

### 3. **Subscription Return Type**
- **Problem**: XState store subscription returns object with `unsubscribe` method
- **Symptom**: "unsubscribe is not a function" errors
- **Cause**: Incorrect type annotation and return value handling

## Fixes Applied

### 1. **Updated Store Configuration to v3 API**

**Before (v2 syntax):**
```typescript
on: {
  LOAD_CONFIGS: {
    loading: true,
    error: null,
  },
  CONFIGS_LOADED: {
    configs: ({ event }) => event.configs,
    lastModified: ({ event }) => event.lastModified,
    loading: false,
    error: null,
  },
}
```

**After (v3 syntax):**
```typescript
on: {
  LOAD_CONFIGS: (context) => ({
    ...context,
    loading: true,
    error: null,
  }),
  CONFIGS_LOADED: (context, event: { configs: ChatAppConfig[]; lastModified: number }) => ({
    ...context,
    configs: event.configs,
    lastModified: event.lastModified,
    loading: false,
    error: null,
  }),
}
```

### 2. **Fixed Service Method Signatures**

**Before:**
```typescript
const getState = Effect.sync(() => store.getSnapshot().context);
const startFileWatcher = Effect.gen(function* () { ... });
```

**After:**
```typescript
const getState = () => Effect.sync(() => store.getSnapshot().context);
const startFileWatcher = () => Effect.gen(function* () { ... });
```

### 3. **Fixed Subscription Handling**

**Before:**
```typescript
readonly subscribe: (callback: (state: ConfigLifecycleContext) => void) => Effect.Effect<() => void>;
```

**After:**
```typescript
readonly subscribe: (callback: (state: ConfigLifecycleContext) => void) => Effect.Effect<{ unsubscribe: () => void }>;
```

### 4. **Fixed Effect Finalizer**

**Before:**
```typescript
yield* Effect.addFinalizer(() => stopFileWatcher);
```

**After:**
```typescript
yield* Effect.addFinalizer(() => stopFileWatcher());
```

## Key Changes Summary

1. **Transition Functions**: Changed from object-based assignments to function-based context updates
2. **Event Typing**: Added proper TypeScript types for all event parameters
3. **Context Spreading**: Ensured all context properties are preserved with `...context`
4. **Service Methods**: Made all methods return functions that return Effects
5. **Subscription API**: Updated to match XState Store v3 subscription object format

## Testing Results

All tests now pass:
- ✅ State transitions work correctly
- ✅ Event handling functions properly
- ✅ Subscriptions work with proper cleanup
- ✅ Error handling is functional
- ✅ Service lifecycle management works

## Benefits Achieved

1. **Proper State Management**: XState store now manages config lifecycle correctly
2. **Type Safety**: Full TypeScript coverage with proper event typing
3. **Reactive Updates**: Subscription mechanism works for UI reactivity
4. **Error Resilience**: Proper error handling throughout the state machine
5. **Effect.ts Integration**: Service follows established patterns correctly

The ConfigLifecycleService is now fully functional and ready for UI integration. 