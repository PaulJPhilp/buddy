

**Prompt for AI Coding Assistant:**

**Subject: Design and Plan Request: Refactor EA Framework for Mock WebSocket Local Communication**

**Objective:** Create a detailed technical design document and a step-by-step implementation plan for refactoring the EffectiveAgent (EA) framework. The goal is to **remove any existing implementation or assumption of direct function call communication** from external clients (like the "Buddy" ChatApp) to the `AgentRuntimeService`. Replace this with a new architecture based on a standard `WebSocketService` interacting with an **in-process Mock WebSocket Server**, which then communicates with the `AgentRuntimeService`. This refactoring is based on the requirements in the provided PRD (`/docs/EA-Mock-WebSocket-PRD.md`) and is intended to support local demos and testing.

**Instructions:**

1.  **Review Context Thoroughly:**
    *   **Internal Rules & Memories:** *First*, please review all your internal guidelines, rules, memory, and established coding patterns. **Pay special attention to the mandatory use of the `class ServiceName extends Effect.Service<Interface>()(Tag, { make: Effect.gen(...), dependencies: [...] }) {}` pattern for defining services and exporting the class itself as the Layer.**
    *   **Codebase Review:** Analyze the entire provided EA framework codebase (up to the completion of Phase 3, including `AgentRuntimeService`, `AgentRuntimeInstance`, `AgentStore`, `PrioritizedMailbox`, etc.). Identify any areas currently assuming or potentially allowing direct function calls from an external UI layer to the `AgentRuntimeService` or related components.
    *   **NEW PRD Review:** Carefully read and understand all requirements outlined in the **new PRD** for this task, located at `/docs/EA-Mock-WebSocket-PRD.md`.
    *   **(Reference Only) Old Protocol:** Briefly review any previous communication protocol documentation (which may have used direct calls in examples) to understand the pattern being replaced.
    *   **Current Terminology:** Ensure all design and planning uses the latest agreed-upon terminology: `AgentRuntime`, `AgentActivity`, `agentWorkflow`, `AgentRuntimeService`, `AgentRuntimeId`, `AgentRuntimeState`, `AgentActivityType`, etc.

2.  **Create Detailed Technical Design Document:**
    *   Based on the PRD and codebase review, design the implementation for the mock WebSocket integration *within the EA framework*.
    *   **Component Design:**
        *   **`WebSocketService`:** Detail the implementation of the standard `WebSocketService` class (using the browser `WebSocket` API) and its corresponding Layer (`WebSocketServiceLayer`). **Strictly adhere to the `Effect.Service` class pattern.** Specify its API methods (`connect`, `disconnect`, `send`, `receive() Stream`) and error handling (`WebSocketError` subtypes). Define the `Effect.GenericTag` in the contract file.
        *   **`MockWebSocketServer`:** Design this new component. **Strictly adhere to the `Effect.Service` class pattern** for its implementation (`MockWebSocketServerLive`) and Layer (`MockWebSocketServerLayer`). Specify:
            *   How it integrates with `mock-socket`.
            *   How it gains access to the `AgentRuntimeService` (via Effect DI using the Tag).
            *   Its internal state management (e.g., using `Ref` and `HashMap` for subscriptions/fibers).
            *   Detailed logic for routing messages (Client -> Server -> `AgentRuntimeService.send` and `AgentRuntimeService.subscribe` -> Server -> Client). Include deserialization, target ID determination, serialization.
            *   **Refined Error Handling:** Detail how errors are handled and sent back to the client using the defined `ProtocolErrorCodes` and `ErrorMessage` structure, avoiding internal detail leakage.
            *   **Subscription Management:** Detail the logic for starting/stopping subscription fibers (`Effect.forkIn`, `Fiber.interrupt`) within the service's `Scope`. Acknowledge the current efficiency strategy (subscribing fully on first interest) is acceptable for now.
            *   **Forked Effect Handling:** Emphasize the need for robust error handling/logging within Effects passed to `Effect.runFork` in event handlers.
        *   **`AgentRuntimeService` Modifications:** Confirm if any modifications are needed (likely none).
    *   **Serialization Protocol (`protocol.ts`):** Define the `IncomingMessage` and `OutgoingMessage` types, including the refined `ErrorMessage` with `ProtocolErrorCodes`. Include type guards.
    *   **Setup/Configuration:** Design the Layer-based mechanism for enabling the mock environment (e.g., conditionally providing `MockWebSocketServerLayer`). Detail how the mock URL is configured (e.g., via `Effect.Config`).
    *   **Interaction Flow:** Provide Mermaid `sequenceDiagram`s for the Client -> Server -> Runtime and Runtime -> Server -> Client flows.

3.  **Create Step-by-Step Implementation Plan:**
    *   Break down the implementation into logical coding tasks.
    *   **Refactoring:** Explicitly list code needing removal/modification (direct call assumptions).
    *   **New Components:** Detail steps to build `WebSocketService` and `MockWebSocketServer` (following the strict `Effect.Service` pattern).
    *   **Configuration:** Detail steps for implementing the mock environment setup.
    *   **File Structure:** Propose specific file locations.
    *   **Testing Strategy:** Outline unit tests (mocking dependencies) and integration tests (using the full Layer stack) as described in the PRD's testing summary, verifying the `Effect.Service` structure and error propagation.

4.  **Constraints & Focus:**
    *   Focus *only* on the **EA framework side** changes.
    *   Ensure the design completely **replaces** direct function call patterns.
    *   **Strictly enforce** the `class ServiceName extends Effect.Service<Interface>()(Tag, { ... }) {}` pattern and `export const LayerName = ServiceClass;` convention for all services defined or refactored.

**Output:**

Provide the **updated and complete** "Design Doc & Plan: EA Framework Mock WebSocket Integration" (Version 1.1 or higher) in Markdown format, incorporating all instructions and refinements. Ensure the document is consistent and clearly reflects the mandatory `Effect.Service` class pattern throughout.

---

This prompt reiterates the core requirements, incorporates the refinements we discussed, and strongly emphasizes the specific `Effect.Service` pattern you want the AI to use. Let me know if you want any adjustments before feeding it to your assistant!