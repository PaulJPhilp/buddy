

## Document 2: Staged Implementation Plan

**Overall Philosophy:** Define visual principles, evaluate core integration libraries, then build the UI structure, and finally layer in functionality and Effect integration incrementally. Each stage should result in a testable state.

---

### **Stage 0: Styling Guidelines & Visual Principles**
*   **Goal:** Define core visual principles, emphasizing **compact design**.
*   **Key Principles & Tasks:** Compactness, Tailwind CSS customization, component-level guidelines, consistency, simple reference/documentation.
*   *(Detailed breakdown as previously discussed)*

---

### **Stage 1: Basic UI Skeleton (Visual Placeholders)**
*   **Goal:** Create the fundamental visual structure, adhering to Stage 0 guidelines.
*   **Components:** `ChatApp`, `HeaderBar`, `MessageArea`, `UserArea`, `MinimalInput`, `UIBar` (all as basic placeholders).
*   *(Detailed breakdown as previously discussed)*

---

### **Stage 2: Library Evaluation (`@effect/react`)**
*   **Goal:** Investigate and evaluate `@effect/react` (or alternatives) for bridging Effect to React. Decide on the primary approach.
*   **Tasks:** Research `@effect/react`, prototype small-scale usage, evaluate fitness, make adoption decision (or confirm custom hook strategy).
*   *(Detailed breakdown as previously discussed)*

---

### **Stage 3: Basic `MinimalInput` Interactivity & `UIBar` Foundation**
*   **Goal:** Controlled `MinimalInput`, basic submission (client-side state), `UIBar` with icon support (placeholder icons, simple `onClick` callbacks).
*   **Components:** `MinimalInput` (controlled, basic submit), `UserArea` (manages `MinimalInput` state using `React.useState`), `UIBar` (renders `IconElementConfig` with `onClick`).
*   *(Detailed breakdown as previously discussed)*

---

### **Stage 4: `UserArea` Structure & Basic Effect Integration (Message Submission)**
*   **Goal:** Full `UserArea` CSS Grid, `trailingAccessoryElements` for `MinimalInput`. **Message submission and `MinimalInput` text state now managed via Effect and the library/hooks chosen in Stage 2.**
*   **Components:** `UserArea` (grid, conditional rows, `onSubmitMessageEffect`), `MinimalInput` (receives `trailingAccessoryElements`, `onSubmitEffectFromParent`), `UIBar` (`effect` prop for icons, run via chosen library/hook), `ChatApp` (Effect Runtime, provides `onSubmitMessageEffect`), `AttachmentRow` (placeholder).
*   *(Detailed breakdown as previously discussed)*

---

### **Stage 5: Enhancing `MinimalInput` & `UIBar`, Introducing `MessageArea` Content**
*   **Goal:** Expanding/collapsing `MinimalInput` text area, `UIBar` selectors, actual icons, display messages in `MessageArea`.
*   **Components:** `MinimalInput` (expanding/collapsing text area), `UIBar` (adds `SelectorElementConfig`, actual icon rendering), `MessageArea` (displays `ChatMessage` array), `ChatApp` (manages `messages` `Ref`, simulates agent responses).
*   *(Detailed breakdown as previously discussed)*

---

### **Stage 6: File Attachments & `HeaderBar` Error Display**
*   **Goal:** Client-side file attachment UI, `HeaderBar` error indication.
*   **Components:** `AttachmentRow` (full implementation), `UserArea` (manages `attachedFiles` `Ref`), `MinimalInput` (Attach File icon opens file dialog, reports selected files), `HeaderBar` (error prop styling), `ChatApp` (manages `error` `Ref` and `attachedFiles` `Ref`).
*   *(Detailed breakdown as previously discussed)*

---

### **Stage 7: WebSocket Connection & Basic Agent Communication**
*   **Goal:** Establish WebSocket, send user messages, receive/display basic agent text responses.
*   **Components/Modules:** `AgentConnection.ts` (WebSocket connect, send, receive stream), `ChatApp` (uses `AgentConnection`, sends messages, processes responses for `MessageArea`), Mock Agent (backend).
*   *(Detailed breakdown as previously discussed)*

---

### **Stage 8: Agent Progress Display & `UserArea` Refinements**
*   **Goal:** Display agent state/logs/errors, complete `UserArea` with `AgentSelector`.
*   **Components/Modules:** Mock Agent (sends progress messages), `ChatApp` (processes progress, manages agent state/log `Ref`s), `HeaderBar` / `AgentStatusDisplay` (shows current agent state), `UserArea` (full conditional children, `AgentSelector` in "Sub-Input `UIBar`").
*   *(Detailed breakdown as previously discussed)*

---

## Future Directions (Post-Stage 8 Reflection)
*   **`EditorChatApp` Variant**
*   **Advanced Agent Progress Visualization**
*   **Real File Uploads**
*   **Streaming Agent Responses**
*   **Enhanced Error Handling & Resilience**
*   **State Persistence & Hydration**
*   **The "App Harness"**
*   **Advanced `UIBar` Elements** (Toggles, Checklists)
*   **Theming and Customization**
*   **Testing Strategy**
*   **Deeper Effect Utilisation in UI:** (Resource Management, Declarative Policies, Schema-Driven Interactions, UI Context/DI, Transactional UI Updates, Workflow Orchestration, Performance Optimization with Fibers).
*   *(Detailed breakdown as previously discussed)*

---