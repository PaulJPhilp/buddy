# MDX Pattern Cleanup - ApplicationManager

## Date: October 14, 2025

## Problem Identified

The ApplicationManager had **duplicate API interfaces** violating the MDX pattern:

1. **api.ts** contained `AppComponentApi` (comprehensive, 47 lines)
2. **service.ts** contained `ApplicationManagerApi` (minimal, 4 methods)
3. The service implemented the inline interface, not the one from api.ts
4. This created confusion about which interface was authoritative

## MDX Pattern Clarification

The **correct MDX pattern** for Effect.ts v3.18+ services:

```
manager/
├── api.ts       # TypeScript interface ONLY (pure types, no Effect implementation)
├── errors.ts    # Tagged error classes (Data.TaggedError)
├── types.ts     # Domain types, schemas, and type aliases
├── service.ts   # Effect.Service class (single class, references api.ts)
└── index.ts     # Barrel exports
```

### Key Principles

✅ **DO**: Split domain concerns (types, errors, API contract)
✅ **DO**: Keep service implementation in a single Effect.Service class
✅ **DO**: Reference the API interface from api.ts in service.ts

❌ **DON'T**: Split Effect implementation (no separate layer.ts files)
❌ **DON'T**: Use Context.Tag pattern (banned in v3.14+)
❌ **DON'T**: Duplicate interfaces between api.ts and service.ts

## Changes Made

### 1. Updated api.ts

**Before**: Had only `AppComponentApi` (comprehensive but not implemented)

**After**:
- Created `ApplicationManagerApi` with the 4 methods actually implemented
- Kept `AppComponentApi` as an extended interface for future implementation
- Added proper error types to method signatures
- Added documentation comments

```typescript
export interface ApplicationManagerApi {
  readonly loadConfig: (configPath?: string) => 
    Effect.Effect<AppDomainModel, ConfigLoadError | ConfigParseError | ConfigValidationError | Error>;
  readonly getAppConfig: () => 
    Effect.Effect<AppDomainModel | null, never>;
  readonly getState: () => 
    Effect.Effect<AppComponentState, never>;
  readonly saveAppConfig: (config: AppDomainModel) => 
    Effect.Effect<AppDomainModel, ConfigSaveError | Error>;
}
```

### 2. Updated service.ts

**Before**:
- Had inline `ApplicationManagerApi` interface (duplicate)
- Used custom `AppState` type instead of `AppComponentState`
- Methods returned Effects directly instead of as functions
- Type mismatches between api.ts and implementation

**After**:
- Removed duplicate interface
- Imported `ApplicationManagerApi` from api.ts
- Used proper `AppComponentState` and `AppDomainModel` types
- Methods now return functions that return Effects (matching API)
- Added `satisfies ApplicationManagerApi` for type safety

```typescript
import type { ApplicationManagerApi } from "./api";
import type { AppComponentState, AppDomainModel } from "./types";

export class ApplicationManager extends Effect.Service<ApplicationManagerApi>()(
  "ApplicationManager",
  {
    effect: Effect.gen(function* () {
      const appState = yield* Ref.make<AppComponentState>(createDefaultAppState());
      
      const loadConfig = (path?: string): Effect.Effect<...> => ...;
      const getAppConfig = (): Effect.Effect<...> => ...;
      const getState = (): Effect.Effect<...> => ...;
      const saveAppConfig = (config: AppDomainModel): Effect.Effect<...> => ...;
      
      return {
        loadConfig,
        getAppConfig,
        getState,
        saveAppConfig,
      } satisfies ApplicationManagerApi;
    }),
    dependencies: [ConfigService.Default],
  }
) {}
```

### 3. Type Alignment

- Unified state type: `AppState` → `AppComponentState`
- Unified config type: `AppConfig` → `AppDomainModel` (alias)
- Error types: Specific errors instead of generic `AppComponentError`
- Method signatures: Functions returning Effects (not direct Effects)

## Benefits

1. **Single Source of Truth**: API interface in api.ts is the contract
2. **Type Safety**: `satisfies` keyword ensures implementation matches interface
3. **Clear Separation**: Types, errors, API, and implementation are cleanly separated
4. **No Duplication**: Interface defined once, referenced everywhere
5. **Maintainability**: Changes to API require updating only api.ts
6. **Documentation**: API file serves as clear contract documentation

## Pattern Template

For future services, follow this template:

```typescript
// api.ts
export interface MyServiceApi {
  readonly myMethod: (arg: string) => Effect.Effect<Result, MyError>;
}

// service.ts
import type { MyServiceApi } from "./api";

export class MyService extends Effect.Service<MyServiceApi>()(
  "MyService",
  {
    effect: Effect.gen(function* () {
      const myMethod = (arg: string): Effect.Effect<Result, MyError> => {
        // Implementation
      };
      
      return {
        myMethod,
      } satisfies MyServiceApi;
    }),
    dependencies: [],
  }
) {}
```

## Verification

✅ No duplicate interfaces
✅ Service implements api.ts interface
✅ Type safety enforced with `satisfies`
✅ Proper error types in API signatures
✅ Clean separation of concerns
✅ No TypeScript errors in ApplicationManager

## Next Steps

1. Update other managers to follow this pattern
2. Update documentation (CLAUDE.md, service-pattern.mdc) to clarify the pattern
3. Create linting rule to prevent duplicate interfaces
4. Add this pattern to the project's coding standards

## Related Documentation

- `.cursor/rules/service-pattern.mdc` - Needs clarification update
- `CLAUDE.md` - Needs version and pattern updates
- `ARCHITECTURE.md` - Already documents MDX pattern correctly
- `docs/EFFECTTALK.md` - Service patterns and best practices
