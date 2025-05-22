# Buddy ChatApp Refactoring Plan (v3)

This plan outlines the steps to refactor the ChatApp to align with the `Buddy-ChatApp-Design-v1.md` document.

**Phase 1: Core State Management & Structural Alignment**

*   **Step 1.1: Review and Plan Effect-TS State Integration for `ChatApp` Instance**
    *   **Action:** Analyze `ChatApp.tsx` and its primary state management mechanisms.
    *   **Goal:** Identify all instance-specific state that should be managed by Effect-TS as per Section 5 of the design document (e.g., token usage, error history, chat thread metadata).
    *   **Task:** Draft a plan for refactoring existing `useState`/`useReducer` or other state solutions (if any are used for this *instance-specific* data) to use `Effect.Ref`, `Chunk`, `HashMap` via an overarching Effect for the `ChatApp` instance.
    *   **Consider:** How the main `Effect` for the `ChatApp` instance will be structured and run.

*   **Step 1.2: Implement Bridge to React for Effect-TS State**
    *   **Action:** Integrate `@effect/react` hooks (e.g., `useResult`, `useValue`, `useProvideEffect`) where Effect-TS managed state needs to be consumed by React components within `ChatApp.tsx` and its children.
    *   **Goal:** Ensure reactive updates in the UI when Effect-TS state changes.

*   **Step 1.3: Verify `ChatApp.tsx` Main Structure and Props**
    *   **Action:** Review `ChatApp.tsx`.
    *   **Goal:** Confirm it uses the 3-row CSS Grid and correctly renders `HeaderBar`, `ChatArea`, and `UserArea` as direct children.
    *   **Task:** Cross-reference the props passed to these main child components against what's outlined or implied in Sections 4.1, 4.2, and 4.3 of the design document.

**Phase 2: Component Details, Toolbars, and Typing**

*   **Step 2.1: Refine `UserArea` (`UserArea/index.tsx`)**
    *   **Action:** Review `apps/client/src/features/chat/components/UserArea/index.tsx`.
    *   **Goal:**
        *   Confirm the 3-row grid structure is correctly implemented.
        *   Ensure `AttachmentBar.tsx` is integrated and functioning as per Section 4.6.
        *   Ensure `MinimalInput.tsx` is integrated as per Section 4.4.
        *   Verify `AgentToolBar.tsx` (or equivalent for agent selection) is present and fulfills the role described for the "Sub-Input UIBar" in Section 4.3.
    *   **Consider:** (MEMORY[3320f578-bb84-4aad-878e-aa0ff75e1fc1]) Approach any significant JSX changes here incrementally.

*   **Step 2.2: Refine `ChatArea` (`ChatArea.tsx`)**
    *   **Action:** Review `apps/client/src/features/chat/components/ChatArea.tsx`.
    *   **Goal:**
        *   Confirm messages render correctly.
        *   Verify that per-message actions (e.g., for assistant messages) use the generic `ToolBar` component from `@ui/components/ui/toolbar.tsx`, configured via the `assistantMessageToolbarConfig` prop (or similar) as per Section 4.2 and 4.5.

*   **Step 2.3: Standardize `ToolBar` Component Usage**
    *   **Action:** Review all instances where toolbars are used within `ChatApp` (e.g., `MinimalInput` accessories, `UserArea`, `ChatArea`).
    *   **Goal:** Ensure all are using the generic `ToolBar` component from `@ui/components/ui/toolbar.tsx` and its `ToolBarItem` configuration (for commands and spacers) as per Section 4.5.
    *   **Task:** Replace any custom toolbar implementations with the standard `ToolBar` if they only require command/spacer functionality.

*   **Step 2.4: Update `MessageMetadata` Typings**
    *   **Action:** Modify the `MessageMetadata` type definition in `ChatServiceApi.ts` (or its relevant source file).
    *   **Goal:** (MEMORY[4bf6b649-223b-4d5a-9470-ca4c5ba81ea3]) Add `attachedFileCount` and `fileNames` as optional fields.
    *   **Task:** Remove the temporary `any` cast for message metadata in `ChatApp.tsx` once typings are correct.

**Phase 3: Styling, Error Handling, and Final Review**

*   **Step 3.1: Apply "Compactness" Styling Principles**
    *   **Action:** Review the key components (`ChatApp`, `HeaderBar`, `ChatArea`, `UserArea`, `MinimalInput`, `ToolBar` instances).
    *   **Goal:** Ensure styling aligns with the "compactness" principle (Section 2.1) using Tailwind utility classes and appropriate `ToolBar` variants (`compact`, `tiny`).
    *   **Task:** Adjust padding, margins, font sizes, and component dimensions as needed through utility classes.

*   **Step 3.2: Review and Refine Error Handling in `UserArea`**
    *   **Action:** Examine how errors originating from `UserArea` actions (input validation, attachment issues, etc.) are surfaced to the user.
    *   **Goal:** Ensure error messages are clear and appropriately displayed, considering the 3-row layout (Section 4.3) no longer has a dedicated "Error/Close Row".

*   **Step 3.3: Overall UX/UI and Functional Review**
    *   **Action:** Perform a holistic review of the `ChatApp`.
    *   **Goal:** Ensure the refactored application behaves as expected, aligns with the design document, and provides a good user experience.
    *   **Task:** Test all core functionalities: sending messages, attaching files (if applicable), agent interactions, toolbar actions, error states.
