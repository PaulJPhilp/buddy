Understood, Paul. Apologies for combining them. Here they are, one document at a time.

---

## Document 1: ChatApp Design Document

**Date:** May 14, 2025
**Version:** 1.0 (based on design session)

**1. Overview & Goals**
The primary goal is to design and implement a modular, composable, and maintainable `ChatApp` component and its associated ecosystem. Key architectural characteristics include:
*   **Effect-TS Driven:** Core business logic, state management, and asynchronous operations for each chat instance will be managed by Effect-TS, with each chat app potentially running as an isolated `Effect`.
*   **React UI:** The user interface will be built with React and TypeScript.
*   **Agent Communication:** Chat apps will communicate with specialized agents (Actor-based, with logic defined by an AgentGraph) primarily via WebSockets.
*   **Composability:** Components like `UIBar` and `MinimalInput` are designed to be highly configurable and reusable.
*   **Variant Support:** The architecture should support different types of chat applications (e.g., a standard `AgentChatApp`, a future `EditorChatApp`).

**2. Core Styling Principles**
*   **Compactness:** A primary visual goal is a compact design, prioritizing information density while maintaining usability. This influences choices in spacing, font sizes, and component dimensions.
*   **Tailwind CSS:** Tailwind will be used for styling. Its configuration (e.g., `spacing`, `fontSize` scales in `tailwind.config.js`) will be reviewed/customized to support compactness.
*   **Consistency:** Uniform application of spacing, typography, color, and border styles is crucial.
*   **Reference:** A simple style guide or visual reference for common compact elements will be established.

**3. Main Application Structure (`ChatApp.tsx`)**
*   The root `ChatApp.tsx` component will utilize a 3-row CSS Grid (`grid grid-rows-[auto_1fr_auto]`) for its main layout:
    1.  `HeaderBar` (top, auto-sized)
    2.  `MessageArea` (middle, takes remaining space, scrollable)
    3.  `UserArea` (bottom, auto-sized)
*   An external "App Harness" (details TBD) will be responsible for managing the lifecycle of multiple `ChatApp` instances and global UI concerns (login, theme, settings).

**4. Key Components Design**

    **4.1. `HeaderBar.tsx`**
    *   **Purpose:** Displays the chat title, status information, and global error indications. May also display current agent state.
    *   **Key Props:** `title?: string`, `error?: string | null` (triggers visual error state).

    **4.2. `MessageArea.tsx`**
    *   **Purpose:** Displays the chronological list of user and agent messages.
    *   **Key Props:** `messages: ChatMessage[]` (where `ChatMessage` includes `id`, `text`, `sender`, `timestamp`).
    *   **Behavior:** Scrollable, auto-scrolls to the bottom on new messages.

    **4.3. `UserArea.tsx`**
    *   **Purpose:** Orchestrates all user input functionalities including text, attachments, and agent interactions.
    *   **Internal Layout:** 4-row CSS Grid:
        1.  **Error/Close Row (Conditional):** Displays error messages specific to `UserArea` actions or a close button for the chat.
        2.  **`AttachmentRow` (Conditional):** Displays currently attached files.
        3.  **`MinimalInput` (Always Present):** The primary text input component.
        4.  **"Sub-Input `UIBar`" (Conditional):** For controls not directly part of message composition (e.g., `AgentSelector`).
    *   **State:** Manages its own UI state and orchestrates state for its children, often reflecting `Effect.Ref`s for data like input text or attached files.
    *   **Key Props:** `error?: string | null`, `onDismissErrorAction?`, `onCloseAction?`, `attachedFiles?: File[]`, `onRemoveFileAction?`, `onSubmitMessageEffect`, `uiBarElements` (for Sub-Input `UIBar`), `theme`.

    **4.4. `MinimalInput.tsx`**
    *   **Purpose:** Handles text entry and core message submission actions.
    *   **Layout:** Single horizontal line: `[Text Input Area (flexible width)] [Trailing Accessories]`.
    *   **Behavior:**
        *   **Controlled Component:** Receives `text: string` and `onTextChange: (newText: string) => void` props.
        *   **Expanding Text Area:** Text input area (likely a `<textarea>`) expands vertically as the user types (up to a defined `max-height`, then scrolls) and collapses to a default height when the message is sent/cleared.
        *   **Submission:** Triggers `onSubmitEffect: (text: string) => Effect.Effect<void, Error>` on Enter key press.
    *   **Key Props:** `text`, `onTextChange`, `onSubmitEffect`, `placeholder?`, `theme?`, `isDisabled?`, `trailingAccessoryElements?: UIBarElementConfig[]`.
    *   **`trailingAccessoryElements`:** Used to configure icons like "Send," "Generic Attach File," and "Specialized Uploads" (e.g., Image, Video).

    **4.5. `UIBar.tsx`**
    *   **Purpose:** A general-purpose, highly configurable toolbar component used in various parts of the application (e.g., `MinimalInput`'s accessories, `UserArea`'s "Sub-Input `UIBar`").
    *   **Layout:** Defaults to horizontal (flex row), with a potential `orientation` prop for vertical layout.
    *   **Key Props:** `elements: UIBarElementConfig[]`, `theme?`, `orientation?: 'horizontal' | 'vertical'`.
    *   **`UIBarElementConfig` (Discriminated Union):**
        *   `IconElementConfig`: `{ type: "iconCommand", iconName: string, label?: string, effect: Effect.Effect<void, Error>, tooltip?: string, isDisabled?: boolean }`. Supports simple (icon-only) and descriptive (icon + label) variants.
        *   `SelectorElementConfig`: `{ type: "selector", items: Array<{ value: string; label: string; disabled?: boolean }>, currentValue: string, onValueChangeEffect: (selectedValue: string) => Effect.Effect<void, Error>, placeholder?: string, isDisabled?: boolean }`.
        *   Future types: Toggle Buttons, Checklists.

    **4.6. `AttachmentRow.tsx`**
    *   **Purpose:** Displays a list of currently attached files, allowing users to remove them before submission.
    *   **Key Props:** `attachedFiles: Array<File>`, `onRemoveFileEffect: (file: File) => Effect.Effect<void, Error>`.

**5. State Management Strategy**
*   **Effect-TS:** The primary source of truth for all business logic, agent communication state, message history, attached files, and other core `ChatApp` operational state. Utilizes `Effect.Ref`s and `Stream`s.
*   **`@effect/react` (or Custom Hooks):** The chosen library or custom-built hooks will bridge Effect-managed state and streams into React components, enabling reactive UI updates. This is a key area for initial technical evaluation.
*   **Zustand (or similar lightweight global store):**
    *   Likely for global UI state managed by the "App Harness" (e.g., theme, global user settings).
    *   Potentially for complex, localized UI state *within* specific `ChatApp` variants if needed, ensuring it does not duplicate or conflict with Effect-managed core logic state.
*   **React `useState`/`useReducer`:** For simple, component-local UI state that doesn't need to be shared or managed by Effect (e.g., dropdown open/close status).

**6. Agent Communication**
*   **Protocol:** WebSockets.
*   **Message Schema:** A defined schema for messages exchanged between the `ChatApp` and the Agent will be crucial. This includes:
    *   User-initiated messages (text, file metadata).
    *   Agent responses (text).
    *   Agent progress updates (state transitions, logs, agent-specific errors).
*   **Service Layer:** An Effect-based service (e.g., `AgentConnection.ts`) will encapsulate WebSocket connection management, message sending, and receiving/parsing of incoming messages into a `Stream`.

**7. ChatApp Variants**
*   The architecture aims to support an "abstract `ChatApp`" concept, allowing for different concrete implementations (e.g., `AgentChatApp` for general agent interaction, `EditorChatApp` for file editing).
*   Variants will differ in their specific UI configurations (e.g., controls in `UserArea`), the type of agent they communicate with, and potentially specialized UI panels (like a file editor view).