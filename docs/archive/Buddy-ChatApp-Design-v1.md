Understood, Paul. Apologies for combining them. Here they are, one document at a time.

---

## Document 1: ChatApp Design Document

**Date:** May 14, 2025
**Version:** 1.0 (based on design session)

**1. Overview & Goals**
The primary goal is to design and implement a modular, composable, and maintainable `ChatApp` component and its associated ecosystem. Key architectural characteristics include:
*   **Effect-TS Driven:** Core business logic, state management, and asynchronous operations for each chat instance will be managed by Effect-TS, with each chat app instance will run as an isolated `Effect`.
*   **React UI:** The user interface will be built with React and TypeScript.
*   **Agent Communication:** Chat apps will communicate with specialized agents (Actor-based, with logic defined by an AgentGraph) primarily via WebSockets.
*   **Composability:** Components like `UIBar` and `MinimalInput` are designed to be highly configurable and reusable.
*   **Variant Support:** The architecture should support different types of chat applications (e.g., a standard `AgentChatApp`, a future `EditorChatApp`).

**2. Core Styling Principles**
*   **Compactness:** A primary visual goal is a compact design, prioritizing information density while maintaining usability. This influences choices in spacing, font sizes, and component dimensions.
*   **Tailwind CSS:** Tailwind will be used for styling. Compactness is primarily achieved through the mindful application of Tailwind utility classes, component-specific variants (e.g., 'compact' or 'tiny' variants for toolbars), and careful consideration of padding and margins on a per-component basis. Global overrides to Tailwind's default `spacing` and `fontSize` scales are avoided to maintain flexibility and rely on Tailwind's comprehensive utility-first approach.
*   **Consistency:** Uniform application of spacing, typography, color, and border styles is crucial.
*   **Reference:** A simple style guide or visual reference for common compact elements will be established.

**3. Main Application Structure (`ChatApp.tsx`)**
*   The root `ChatApp.tsx` component will utilize a 3-row CSS Grid (`grid grid-rows-[auto_1fr_auto]`) for its main layout:
    1.  `HeaderBar` (top, auto-sized)
    2.  `ChatArea` (middle, takes remaining space, scrollable)
    3.  `UserArea` (bottom, auto-sized)
*   An external "App Harness" (details TBD) will be responsible for managing the lifecycle of multiple `ChatApp` instances and global UI concerns (login, theme, settings).

**4. Key Components Design**

    **4.1. `HeaderBar.tsx`**
    *   **Purpose:** Displays the chat title, status information, and global error indications. May also display current agent state.
    *   **Key Props:** `title?: string`, `error?: string | null` (triggers visual error state).

    **4.2. `ChatArea.tsx`**
    *   **Purpose:** Displays the chronological list of user and agent messages.
    *   **Key Props:** `messages: ChatMessage[]` (where `ChatMessage` includes `id`, `text`, `sender`, `timestamp`).
    *   **Behavior:** Scrollable, auto-scrolls to the bottom on new messages.

    **4.3. `UserArea.tsx`**
    *   **Purpose:** Orchestrates all user input functionalities including text, attachments, and agent interactions.
    *   **Internal Layout:** A 3-row CSS Grid:
        1.  **Error/Close Row (Conditional):** Displays error messages specific to `UserArea` actions or a close button for the chat.
        2.  **`AttachmentBar` (Conditional):** Displays currently attached files.
        3.  **`MinimalInput` (Always Present):** The primary text input component.
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

    **4.5. `ToolBar` (from `@ui/components/ui/toolbar.tsx`)**
    *   **Purpose:** A general-purpose, configurable toolbar component provided by the `@ui` package, used for creating rows of interactive elements like icon buttons and spacers.
    *   **Implementation:** See `packages/ui/src/components/ui/toolbar.tsx`.
    *   **Layout:** Primarily horizontal (flex row). Variants like 'default', 'compact', and 'tiny' control spacing and size.
    *   **Key Props (from `toolbar.tsx`):** `commands: ToolBarItem[]`, `variant?: 'default' | 'compact' | 'tiny'`, `className?`, `ariaLabel?`, etc.
    *   **`ToolBarItem` (Union Type from `toolbar.tsx`):** Defines the elements that can be rendered by the `ToolBar`.
        *   `ToolBarCommand`: `{ id: string, icon: React.ReactNode, label?: string, action: () => void, tooltip?: string, disabled?: boolean, intent?: 'primary' | 'secondary' | 'danger' }`. Used for icon buttons with actions.
        *   `ToolBarSpacer`: `{ id: string, type: "spacer-expand" }`. Used to create flexible space between items.
    *   **Note on Selectors:** The generic `ToolBar` component itself does not render selector/dropdown menus directly via its `commands` prop. UI elements requiring selection (e.g., an `AgentSelector`) are implemented as separate, specialized components (like `AgentToolBar.tsx` in the `UserArea`) which might internally use or be styled similarly to `ToolBar` elements but are not configured through the `ToolBarItem` array of the main `ToolBar`.

    **4.6. `AttachmentBar.tsx`**
    *   **Purpose:** Displays a list of currently attached files, allowing users to remove them before submission.
    *   **Key Props:** `attachedFiles: Array<File>`, `onRemoveFileEffect: (file: File) => Effect.Effect<void, Error>`.

**5. State Management Strategy**
*   **5.1. Effect-TS (Core Operational State):**
    *   The primary source of truth for core business logic, agent communication state (e.g., WebSocket connections, message serialization/deserialization), raw message history objects, attached files, and other fundamental `ChatApp` operational state.
    *   Utilizes `Effect.Ref`s and `Effect.Stream`s extensively for managing and exposing this state.

*   **5.2. Effect-TS (`ChatApp` Instance-Specific State):**
    *   **Purpose:** Each `ChatApp` instance's primary Effect program will create, own, and manage its own dedicated set of `Effect.Ref`s to store operational metadata, aggregated data, and history relevant specifically to that instance. This ensures that all runtime state, both core and derived/accumulated for an instance, is managed within the Effect-TS paradigm.
    *   **Managed Data Structures (using Effect-TS types):**
        *   **Token Usage and Cost Data:**
            *   Example: `tokenCostRef: Ref<{ totalTokens: number, totalCost: Cents }>`
            *   Source: Aggregated from data provided in agent responses.
            *   Scope: Accumulated over the lifetime of the `ChatApp` instance.
        *   **Asynchronous Agent Error History:**
            *   Example: `agentErrorHistoryRef: Ref<Chunk<TimestampedAgentError>>` (where `Chunk` is Effect's immutable list, and `TimestampedAgentError` is a defined type).
            *   Content: A log of recent errors specifically arising from asynchronous agent communications. This is distinct from transient error states that might be displayed for current operations.
        *   **Chat Thread Metadata (e.g., Titles):**
            *   Example: `threadTitlesRef: Ref<HashMap<AgentInstanceId, string>>` (where `HashMap` is Effect's immutable map and `AgentInstanceId` is a unique identifier for an agent interaction stream).
            *   Content: LLM-generated thread titles for conversations, associated with specific agent dialogues.
    *   **Updating State:** These instance-specific `Ref`s are updated directly within the `ChatApp` instance's Effect-TS workflows (e.g., using `Ref.update`, `Ref.set`).
    *   **Lifecycle:** The lifecycle of these `Ref`s is inherently tied to the lifecycle of the `ChatApp` instance's main Effect program. They are created when the instance initializes and are garbage collected or finalized when the instance terminates.

*   **5.3. Effect-TS Layer (for operational concerns):**
    *   This layer will manage all dynamic, operational aspects of the chat application, including fetching configurations, managing chat instances, and handling WebSocket connections.

*   **5.4. Global UI State Store (e.g., XState, for non-operational concerns):**
    *   A lightweight store like XState (as potentially indicated by existing files like `appShellStore.ts`) can be used for these concerns, ensuring a clear separation from Effect-TS's role in managing the dynamic, operational state of the application.

*   **5.5. React Components (for presentation):**
    *   Remains appropriate for simple, ephemeral UI state that is local to a single React component and does not need to be shared, persisted, or managed by Effect-TS (e.g., dropdown open/close status, temporary input field values before validation/submission to an Effect).

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