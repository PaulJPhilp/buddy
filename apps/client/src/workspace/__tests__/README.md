# Workspace Logic Test Suite

This directory contains comprehensive tests for the workspace management system, covering the sophisticated chat app state machine and workspace lifecycle management.

## Test Coverage Summary

### 🎯 Total Test Coverage: 23 Tests (All Passing)

#### Active Workspaces Tests (5 tests)
- **File**: `activeWorkspaces.test.ts`
- **Coverage**: Workspace activation logic, active app tracking, max expanded app limits
- **Key Scenarios**:
  - Workspace activation when chat apps are expanded/compacted
  - Active app ID management and clearing
  - Max expanded apps enforcement per workspace

#### Chat App State Machine Tests (18 tests)
- **File**: `chatAppStateMachine.test.ts` 
- **Coverage**: Comprehensive state machine validation for chat app lifecycle
- **Key Scenarios**:

##### Max Expanded Apps Enforcement (3 tests)
- Default limit of 2 expanded apps per workspace
- Custom max limits (configurable per workspace)
- Dynamic limit reduction with automatic compacting

##### Active App Tracking (5 tests)
- Expanding apps sets them as active
- Explicit app activation updates activeAppId
- Stashing active apps clears activeAppId
- Smart active app selection when compacting active apps
- Non-active app compacting preserves activeAppId

##### Focus Mode (2 tests)
- Entering focus mode expands target app and hides others
- Exiting focus mode restores previous app states
- Proper state preservation with `previousStatus` tracking

##### Timestamp Management (2 tests)
- `lastActiveAt` updates correctly on all actions
- Chronological sorting for capacity management (oldest apps compacted first)

##### Edge Cases (4 tests)
- Graceful handling of invalid workspace IDs
- Graceful handling of invalid app IDs
- Zero max expanded apps validation (minimum 1 enforced)
- Multiple rapid state changes handled correctly

##### Multi-Workspace Scenarios (2 tests)
- State changes in one workspace don't affect others
- Different max expanded apps settings per workspace

## State Machine Architecture

### Chat App States
- **`stashed`**: Hidden/inactive state (default for new apps)
- **`compact`**: Visible but minimized
- **`expanded`**: Full size, can receive user input
- **`closed`**: Archived/removed state

### State Transitions
```
stashed → expanded (if under max limit)
stashed → compact (if at max limit)
expanded → compact (when new app expanded at max)
compact → expanded (user selection)
expanded → stashed (focus mode or explicit stashing)
compact → stashed (focus mode)
stashed → expanded (focus mode target)
```

### Key Business Rules Tested

1. **Max Expanded Apps**: Default 2, configurable per workspace, minimum 1
2. **Capacity Management**: When expanding beyond max, oldest expanded app is compacted
3. **Active App Tracking**: Only one app per workspace can be "active" (receives input)
4. **Chronological Sorting**: Uses `lastActiveAt` timestamps for intelligent management
5. **Focus Mode**: Single app expanded, others hidden, with state restoration
6. **Workspace Isolation**: State changes don't cross workspace boundaries

## Test Quality Features

### ✅ Comprehensive Edge Case Coverage
- Invalid IDs, rapid state changes, boundary conditions
- Multi-workspace scenarios ensuring isolation
- Error handling and graceful degradation

### ✅ Real-Time Timestamp Testing
- Async tests with proper delays to ensure unique timestamps
- Chronological sorting validation
- State transition timing verification

### ✅ Focus Mode State Preservation
- `previousStatus` field tracking for proper restoration
- Complex state transitions with multiple apps
- Proper handling of already-stashed apps

### ✅ Multi-Workspace Validation
- Independent max limits per workspace
- Isolated state management
- Cross-workspace interference prevention

## Testing Patterns Used

### State Machine Testing
- **Given-When-Then** patterns for state transitions
- **Comprehensive state verification** after each action
- **Timestamp-based chronological testing** with delays

### Edge Case Testing
- **Boundary value testing** (max limits, zero values)
- **Invalid input handling** (non-existent IDs)
- **Rapid operation testing** (multiple quick actions)

### Integration Testing
- **Multi-workspace scenarios** testing isolation
- **Complex workflows** combining multiple operations
- **Real-time behavior** with async operations

## Performance Characteristics

- **Fast execution**: All 23 tests complete in ~33ms
- **Memory efficient**: No memory leaks or resource retention
- **Deterministic**: Consistent results across runs
- **Parallel safe**: Tests can run concurrently

## Future Test Expansion

The test suite is designed to be easily extensible for:
- Additional chat app states
- New workspace features
- Complex multi-user scenarios
- Performance and stress testing
- UI integration testing

## Running Tests

```bash
# Run all workspace tests
bun test workspace/

# Run specific test file
bun test chatAppStateMachine.test.ts
bun test activeWorkspaces.test.ts

# Run with verbose output
bun test workspace/ --verbose
```

## Test Dependencies

- **Bun Test Runner**: Fast, TypeScript-native testing
- **Effect.js**: Functional programming patterns
- **XState**: State machine store implementation
- **Real implementations**: No mocking, tests actual business logic

This test suite provides comprehensive coverage of the workspace logic, ensuring the sophisticated chat app state machine works correctly under all conditions while maintaining the architectural goal of UI/logic separation for programmatic control. 