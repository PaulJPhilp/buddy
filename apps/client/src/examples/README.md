# Examples Folder - Migration Plan

## Current Status
This folder contains example code files that demonstrate usage patterns for various services and hooks. However, these examples are not used in production and can become stale.

## Current Files
- `toolsUsageExample.ts` - 293 lines demonstrating ToolsIntegrationService usage patterns
- `../hooks/chat-instance/example.tsx` - Example usage of useChatInstance hook (outdated, references `useChatInstanceV2`)

## Migration Plan

### Phase 1: Documentation Migration
- [ ] Extract useful patterns from `toolsUsageExample.ts` into service README files
- [ ] Move ToolsIntegrationService examples to `src/utils/toolsIntegration/README.md`
- [ ] Update chat-instance example or move patterns to `src/hooks/chat-instance/README.md`
- [ ] Create comprehensive service documentation with inline examples

### Phase 2: Test Integration
- [ ] Convert valuable examples into actual tests that serve dual purpose
- [ ] Move integration examples to test files where they provide value
- [ ] Ensure examples are validated by CI/CD pipeline

### Phase 3: Cleanup
- [ ] Delete standalone example files once patterns are documented
- [ ] Remove this examples folder
- [ ] Update any references or imports

## Design Principles

### ✅ **Preferred Patterns:**
- Examples in README files with clear context
- Examples in tests that validate functionality
- Inline documentation with usage patterns
- Storybook for component examples (if needed)

### ❌ **Avoid:**
- Standalone example files that aren't executed
- Examples that can become stale
- Code that increases bundle size without value
- Duplicated patterns across multiple files

## Timeline
Target completion: During the upcoming README documentation phase

## Notes
- Keep examples focused and practical
- Ensure examples follow current architectural patterns
- Validate examples work with current codebase
- Consider maintenance burden of any retained examples 