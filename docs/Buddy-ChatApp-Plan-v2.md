# Buddy ChatApp Implementation Plan v2

## Philosophy
- Strict alignment with design doc: modular, composable, compact, Effect-TS driven, agent comms via WebSocket, and future extensibility.
- Each stage results in a testable, visually and functionally meaningful increment.

---

## Stage 0: Tailwind & Visual Foundation
- Audit and customize Tailwind config for compact spacing, fontSize, borderRadius.
- Establish a style guide: spacing, typography, color, border, compact UI elements.
- Add utility classes for info-dense layouts.

---

## Stage 1: Core Layout & Skeleton
- Implement `ChatApp.tsx` as a 3-row CSS grid.
- Add placeholder components for `HeaderBar`, `MessageArea`, `UserArea`.

---

## Stage 2: Component Implementation
- Build `HeaderBar` (title, status, error).
- Build `MessageArea` (scrollable, auto-scroll, render `ChatMessage[]`).
- Build `UserArea` with 4-row grid (error, attachments, input, sub-toolbar).
- Implement `MinimalInput` (expanding textarea, trailing icons).
- Implement `UIBar` (configurable, icons/selectors).
- Implement `AttachmentRow` (file list, removal).

---

## Stage 3: State Management & Effect-TS Integration
- Integrate Effect-TS for chat state, message history, input, attachments.
- Use `@effect/react` or custom hooks for React state bridge.
- Use Zustand for global UI state if needed.

---

## Stage 4: Agent Communication
- Define message schema for user/agent messages.
- Implement Effect-based WebSocket service (`AgentConnection.ts`).
- Bridge agent comms to UI state (send, receive, progress, errors).

---

## Stage 5: Advanced Features & Variants
- Support for multiple chat variants (e.g., `EditorChatApp`).
- Add theming (light/dark, compact, accent colors).
- Implement App Harness for multi-chat lifecycle and global UI.
- Add advanced agent progress visualization and streaming.

---

## Stage 6: Testing & Developer Experience
- Add unit and integration tests for all components and services.
- Add Storybook or similar for isolated UI development.
- Ensure all dev scripts and docs are up to date.

---

## Stage 7: Polish & Documentation
- Review all UI for compactness, consistency, and accessibility.
- Document architecture, state, and extension points.
- Prepare for future features (real uploads, persistence, etc).

---

## Notes
- All stages must strictly adhere to design doc principles: compactness, composability, consistent styling, and Effect-TS state.
- Document all deviations from design and justify them in the plan.
- Review and update the plan after each major milestone.
