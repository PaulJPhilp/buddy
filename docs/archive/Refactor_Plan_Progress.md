# ChatApp Refactoring Plan & Progress

This document tracks the progress of refactoring the ChatApp to use the `useChatInstance` hook and align with the new architecture.

## Phase 1: Solidify `useChatInstance` and Core Chat Features [COMPLETED]

-   [x] **1.1: Dynamic `chatInstanceId` and Agent Configuration**
    -   [x] Task 1.1.1: Modify `BusinessChat.tsx` (and establish a pattern for similar components) to take `chatInstanceId` from `appShellStore.selectedThreadId`.
    -   [x] Task 1.1.2: Implement dynamic `agentWsUrl` resolution.
        -   [x] Added `agentWsUrl` to `Agent` interface (`AgentToolBar.tsx`).
        -   [x] Updated agent definitions in `chatStores.ts` to include `agentWsUrl`.
        -   [x] Modified `BusinessChat.tsx` to use `agentWsUrl` from the selected agent object.
-   [x] **1.2: Agent Switching**
    -   [x] Task: Implement agent switching for `useChatInstance` by updating `selectedAgent` in `useBusinessChatStore`, causing `BusinessChat.tsx` to re-compute `agentConfig` and re-initialize `useChatInstance`.
    -   [x] Task: Confirmed that existing chat messages persist on agent switch, which is the desired behavior.
-   [x] **1.3: File Attachments (Basic Implementation)**
    -   [x] Task 1.3.1: Update `ClientMessagePayload` in `features/chat/types.ts` to include optional `attachments: FileAttachment[]`.
    -   [x] Task 1.3.2: Update `Message` interface (in `features/chat/types.ts`) to ensure it can store attachment information (already had `attachments?: FileAttachment[]`). Update `ChatInstanceAction`'s `sendMessage` to include `attachments?: FileAttachment[]`.
    -   [x] Task 1.3.3: Modify `useChatInstance`'s `outgoingEffect` to include attachment metadata when creating `ClientMessagePayload`.
    -   [x] Task 1.3.4: Update `UserArea.tsx` to manage a local state for `stagedFiles: File[]` and map them to `AttachmentFile[]` for display in its `AttachmentBar`.
    -   [x] Task 1.3.5: `UserArea.tsx`'s "Attach" button (via `MinimalInput`) correctly triggers file selection. Modified `handleSendMessage` in `BusinessChat.tsx` to map `File[]` to `FileAttachment[]` and pass them to `dispatchAction`.
-   [x] **1.4: `isTyping` Indicator**
    -   [x] Task 1.4.1: Add `{ type: "agentTyping", isTyping: boolean }` to `AgentEvent` in `features/chat/types.ts`.
    -   [x] Task 1.4.2: Add `isTyping?: boolean` to `ChatInstanceHookState` in `features/chat/types.ts`.
    -   [x] Task 1.4.3: `useChatInstance.ts` initializes `isTyping` and updates it based on `agentTyping` events (and resets on new message/error).
    -   [x] Task 1.4.4: `BusinessChat.tsx` updated to use `chatState.isTyping` for the `ChatApp` props.

## Phase 2: Refinement and Store Cleanup

-   [ ] **2.1: Review and Refactor `appShellStore`**
    -   [ ] Task: Analyze all state and actions in `appShellStore.ts`.
    -   [ ] Task: Identify and remove/deprecate any state or actions that are now handled by `useChatInstance` and its associated workflow (especially message-related state like `messages`, `sendMessage`, `addMessage`, `error`, `isTyping`, `isSending` if they are duplicated for `useChatInstance`-driven chats).
    -   [ ] Goal: `appShellStore` should focus on truly global concerns not tied to a single chat instance's operational state (e.g., `selectedThreadId`, theme, user auth).
    -   [ ] Acceptance: `appShellStore` is streamlined, its role is clear, and there's no redundant state management with `useChatInstance`.
-   [ ] **2.2: Binary Data over WebSockets (If Needed and Not Just Metadata)**
    -   [ ] Task: If actual file *transfer* over WebSockets is a requirement (beyond just sending metadata), update `WebSocketService` to correctly handle `Blob` or `ArrayBuffer` data for both sending and receiving. This may involve changes to the WebSocket message protocol.
    -   [ ] Acceptance: Files can be sent and received as binary data over WebSockets if this is a determined requirement. Otherwise, the current metadata approach with a separate upload mechanism (if files are large) is sufficient.
-   [ ] **2.3: Error Handling and Display**
    -   [ ] Task: Thoroughly review and ensure all error paths from `useChatInstance` (connection errors, send errors, runtime errors during Effect program execution) are clearly reflected in `chatState.error`.
    -   [ ] Task: Ensure these errors are gracefully displayed to the user (e.g., in `HeaderBar` or a dedicated error notification area within `ChatApp`).
    -   [ ] Acceptance: Users receive clear, actionable feedback on any errors occurring within a chat instance.

## Phase 3: Testing and Documentation

-   [ ] **3.1: Unit and Integration Tests**
    -   [ ] Task: Write comprehensive Vitest unit tests for `useChatInstance.ts`, mocking the `WebSocketService` to simulate various scenarios (successful connection, message send/receive, agent switching logic, error conditions, retry mechanisms).
    -   [ ] Task: Write Vitest integration tests for `BusinessChat.tsx` (and similar container components) to ensure correct props are derived from `useChatInstance` state and passed to the presentational `ChatApp.tsx` component.
    -   [ ] Acceptance: Core chat functionality driven by `useChatInstance` is well-tested and robust.
-   [ ] **3.2: Documentation**
    -   [ ] Task: Update any existing Markdown design documents (`Buddy-ReactEffect-Architecture.md`, `Buddy-ReactEffect-Design.md`, etc.) to accurately reflect the implemented architecture, decisions made during development, and the current state of the components.
    -   [ ] Task: Add or update TSDoc comments for `useChatInstance.ts`, `features/chat/types.ts`, `BusinessChat.tsx`, and other key modules and interfaces to improve code clarity and maintainability.
    -   [ ] Acceptance: The codebase and architecture are well-documented for current and future development. 