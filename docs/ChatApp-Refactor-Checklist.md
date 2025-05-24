# ChatApp Refactor Checklist

## Overall Philosophy:
Define visual principles, evaluate core integration libraries, then build the UI structure, and finally layer in functionality and Effect integration incrementally. Each stage should result in a testable state.

---

## Stages:

- [ ] **Stage 0: Styling Guidelines & Visual Principles**
    - [ ] Define core visual principles (emphasizing **compact design**).
    - [ ] Review/Customize Tailwind CSS configuration (`tailwind.config.ts`) for compactness (e.g., spacing, font sizes).
    - [ ] Establish component-level guidelines for applying styles.
    - [ ] Ensure consistency in spacing, typography, color, and border styles.
    - [ ] Create a simple style guide or visual reference (e.g., `ChatApp-Styling-Guide.md`).

- [x] **Stage 1: Basic UI Skeleton (Visual Placeholders)**
    - [x] Create `ChatApp.tsx` basic structure (3-row grid).
    - [x] Create `HeaderBar.tsx` placeholder.
    - [x] Create `MessageArea.tsx` placeholder.
    - [x] Create `UserArea.tsx` placeholder (initial layout, e.g., flex-col).
    - [x] Create `MinimalInput.tsx` placeholder.
    - [x] Create `UIBar.tsx` placeholder.
    - [x] Ensure all placeholders adhere to Stage 0 styling guidelines.

- [x] **Stage 2: Library Evaluation (`@effect/react`)**
     - [x] Research `@effect/react` library.
    - [x] Prototype small-scale usage of `@effect/react` for state management and side effects.
    - [x] Evaluate fitness for the project's needs (developer experience, performance, community support).
    - [x] Make a decision on adoption or confirm custom hook strategy.
    - [x] Document the chosen approach.

- [x] **Stage 3: Basic `MinimalInput` Interactivity & `UIBar` Foundation**
    - [x] Implement `MinimalInput.tsx` as a controlled component (`text` prop, `onTextChange` prop).
    - [x] Add basic submission logic to `MinimalInput.tsx` (e.g., `onSubmit` prop, Enter key press).
    - [x] `UserArea.tsx` manages `MinimalInput.tsx`'s text state (e.g., using `React.useState`).
    - [x] `UIBar.tsx` renders `IconElementConfig` (placeholder icons).
    - [x] `IconElementConfig` in `UIBar.tsx` supports simple `onClick` callbacks.

- [x] **Stage 4: `UserArea` Structure & Basic Effect Integration (Message Submission)**
    - [x] Refactor `UserArea.tsx` internal layout to CSS Grid (4-row design from `Buddy-ChatApp-Design-v1.md`).
    - [x] Implement conditional rendering for `UserArea.tsx` rows (Error/Close, AttachmentRow, Sub-Input UIBar).
    - [x] `MinimalInput.tsx` receives `trailingAccessoryElements` prop.
    - [x] Message submission logic in `UserArea.tsx` (`onSubmitMessageEffect`) managed via Effect (basic setup).
    - [x] `MinimalInput.tsx` text state managed via Effect.
    - [x] `MinimalInput.tsx` calls parent-provided `onSubmitEffectFromParent`.
    - [x] `UIBar.tsx` `IconElementConfig` uses `effect` prop, executed via chosen library/hook.
    - [x] `ChatApp.tsx` sets up Effect Runtime.
    - [x] `ChatApp.tsx` provides `onSubmitMessageEffect` to `UserArea.tsx`.
    - [x] Create `AttachmentRow.tsx` placeholder.

- [x] **Stage 5: Enhancing `MinimalInput` & `UIBar`, Introducing `MessageArea` Content**
    - [x] Implement expanding/collapsing text area in `MinimalInput.tsx`.
    - [x] `UIBar.tsx` adds support for `SelectorElementConfig`.
    - [x] `UIBar.tsx` renders actual icons (e.g., Lucide icons) based on `iconName`.
    - [x] `MessageArea.tsx` displays an array of `ChatMessage` objects.
    - [x] `ChatApp.tsx` manages `messages` `Ref` (Effect state).
    - [x] Simulate agent responses in `ChatApp.tsx` to populate `messages`.

- [ ] **Stage 6: File Attachments & `HeaderBar` Error Display**
    - [ ] Implement `AttachmentRow.tsx` to display `File` objects and allow removal (`onRemoveFileEffect`).
    - [ ] `UserArea.tsx` manages `attachedFiles` `Ref` (Effect state).
    - [ ] `MinimalInput.tsx` "Attach File" icon opens file dialog.
    - [ ] `MinimalInput.tsx` reports selected files to `UserArea.tsx`.
    - [ ] `HeaderBar.tsx` implements `error` prop styling for visual error indication.
    - [ ] `ChatApp.tsx` manages `error` `Ref` (Effect state).
    - [ ] `ChatApp.tsx` manages `attachedFiles` `Ref` (Effect state).
    - [x] Implement `AttachmentRow.tsx` to display `File` objects and allow removal (`onRemoveFileEffect`).
    - [x] `UserArea.tsx` manages `attachedFiles` `Ref` (Effect state) (Note: interacts with ChatApp's Ref).
    - [x] `MinimalInput.tsx` "Attach File" icon opens file dialog.
    - [x] `MinimalInput.tsx` reports selected files to `UserArea.tsx`.
    - [x] `HeaderBar.tsx` implements `error` prop styling for visual error indication.
    - [x] `ChatApp.tsx` manages `error` `Ref` (Effect state).
    - [x] `ChatApp.tsx` manages `attachedFiles` `Ref` (Effect state).

- [ ] **Stage 7: WebSocket Connection & Basic Agent Communication**
    - [ ] Create `AgentConnection.ts` Effect-based service.
        - [ ] Implement WebSocket connection logic.
        - [ ] Implement message sending.
        - [ ] Implement receiving/parsing of incoming messages into a `Stream`.
    - [ ] `ChatApp.tsx` uses `AgentConnection.ts`.
    - [ ] `ChatApp.tsx` sends user messages (text and file metadata placeholder) via WebSocket.
    - [ ] `ChatApp.tsx` processes basic agent text responses from WebSocket and updates `MessageArea.tsx`.
    - [ ] Set up a Mock Agent (backend or simulated) for testing.

- [ ] **Stage 8: Agent Progress Display & `UserArea` Refinements**
    - [ ] Mock Agent sends progress messages (state transitions, logs, agent-specific errors).
    - [ ] `ChatApp.tsx` processes agent progress messages.
    - [ ] `ChatApp.tsx` manages agent state/log `Ref`s (Effect state).
    - [ ] `HeaderBar.tsx` (or a new `AgentStatusDisplay.tsx` component) shows current agent state.
    - [ ] `UserArea.tsx` implements full conditional rendering of its children.
    - [ ] `UserArea.tsx` includes `AgentSelector` (using `UIBar.tsx` with `SelectorElementConfig`) in the "Sub-Input `UIBar`".

---

## Future Directions (Post-Stage 8 Reflection)
- [ ] `EditorChatApp` Variant
- [ ] Advanced Agent Progress Visualization
- [ ] Real File Uploads (backend integration)
- [ ] Streaming Agent Responses
- [ ] Enhanced Error Handling & Resilience
- [ ] State Persistence & Hydration
- [ ] The "App Harness" (detailed integration)
- [ ] Advanced `UIBar` Elements (Toggles, Checklists)
- [ ] Theming and Customization (beyond initial setup)
- [ ] Comprehensive Testing Strategy (unit, integration, e2e)
- [ ] Deeper Effect Utilisation in UI
