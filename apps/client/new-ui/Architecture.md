Excellent. A formal Architecture Design Document (ADD) is the perfect next step. It will serve as the technical blueprint for development, ensuring every component is built with a clear purpose and a shared understanding of how it fits into the larger system.

This document translates our PRD and design discussions into a concrete technical plan.

---

### **Architecture Design Document: Dynamic Workspace UI**

*   **Version:** 1.0
*   **Status:** Baseline
*   **Author:** Paul (Engineer), T3 Chat (AI Assistant)
*   **Date:** 6/14/2025

### 1. Overview

This document outlines the software architecture for the **Dynamic Workspace UI**, a state-driven interface for a multi-agent chat application. The primary goal is to create a highly predictable, testable, and extensible system for managing a user's workspace, which consists of multiple tabs and chat applications.

The architecture is founded on the **Actor Model** and **State-Driven UI** patterns. A single, centralized **XState Actor** serves as the brain of the system, managing all UI state and logic. The UI (built with React/Next.js) is a "dumb" reflection of this state, ensuring a unidirectional data flow and eliminating complex state management from the view layer. This design explicitly supports manipulation by both end-users and programmatic agents (LLMs) through a well-defined event-based API.

### 2. Architectural Goals & Constraints

#### 2.1. Goals

*   **Predictability:** The UI's behavior must be deterministic. Given the same state and event, the resulting state will always be identical.
*   **Testability:** The core application logic (the state machine) must be decoupled from the UI, allowing for comprehensive unit testing in isolation.
*   **Decoupling:** A clean separation of concerns between state management, UI rendering, and side effects (like persistence or LLM communication).
*   **Extensibility:** The architecture must be easy to extend with new features (e.g., new UI states, new events) without requiring large-scale refactoring.
*   **Developer Experience:** Provide a clear, logical, and type-safe environment for developers to build and maintain the application.

#### 2.2. Constraints (Technology Stack)

*   **Framework:** Next.js
*   **UI Library:** React
*   **State Management:** XState
*   **LLM Integration:** Vercel AI SDK (leveraging Tool Calling / `useActions`)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS / Shadcn

### 3. High-Level Architecture

The system follows a unidirectional data flow pattern. All actions, whether from a user or an LLM, are translated into events. The XState actor processes these events, computes a new state, and the UI re-renders accordingly.

```
+-------------+       +----------------------+       +-----------------+
| User Action |       | LLM Tool Call        |       | Browser Storage |
| (e.g. Click)|       | (e.g. Vercel AI SDK) |       | (localStorage)  |
+-------------+       +----------------------+       +-------+---------+
      |                        |                              ^
      | (1. Dispatch Event)    | (1. Dispatch Event)          | (4. Persist State)
      v                        v                              |
+-------------------------------------------------------------------------+
|                                                                         |
|                            XState Actor (The Brain)                     |
|                                                                         |
|   +-------------------------------------------------------------------+ |
|   |                                                                   | |
|   |   uiMachine: Processes events and updates context (UIState)       | |
|   |                                                                   | |
|   +-------------------------------------------------------------------+ |
|                                                                         |
+-------------------------------------------------------------------------+
      |
      | (2. New State Emitted)
      |
      v
+-------------------------------------------------------------------------+
|                                                                         |
|                        React UI Layer (The View)                        |
|                                                                         |
|   (3. Subscribes to Actor state via `useActor` hook and re-renders)     |
|                                                                         |
+-------------------------------------------------------------------------+
```

### 4. Component Breakdown

#### 4.1. UI State Machine (`uiMachine.ts`)

This is the heart of the application.

*   **Responsibility:** To be the single source of truth for the entire UI state. It defines all possible events the UI can respond to and contains all the business logic for how the state should change in response to those events.
*   **Technology:** XState (`createMachine`, `assign`).
*   **Implementation:**
    *   The machine's `context` holds the normalized `UIState` object.
    *   All state transitions are handled by `assign` actions, which receive the current `context` and an `event` and return a new, updated state object.
    *   The machine is defined as a pure, exportable object, completely independent of React.

#### 4.2. React View Layer (Components)

This layer is responsible for rendering the UI based on the current state.

*   **Responsibility:** To translate the `UIState` object into HTML and CSS. Components are "controlled" or "dumb"—their primary job is to display data and dispatch events to the state machine on user interaction.
*   **Technology:** React, Next.js, Shadcn, `@xstate/react`.
*   **Implementation:**
    *   A single, global instance of the `uiMachine` actor will be created and provided through a React Context.
    *   Components will use the `useActor` hook from `@xstate/react` to subscribe to the actor's state. `const [state, send] = useActor(uiActor);`
    *   `state.context` will be used to render the UI (e.g., mapping over tabs, rendering apps based on their `status`).
    *   `send` will be used to dispatch events (e.g., `onClick={() => send({ type: 'TAB_ACTIVATED', ... })}`).

#### 4.3. Persistence Layer

This layer handles saving and loading the UI state.

*   **Responsibility:** To ensure the user's workspace layout is not lost between sessions.
*   **Technology:** Browser `localStorage` API.
*   **Implementation:**
    *   **Saving:** An `after` transition is defined in the `uiMachine` that triggers a `persistState` action after any state change. This action serializes the machine's `context` to JSON and saves it to `localStorage`.
    *   **Loading (Hydration):** A `createUIActor` factory function is responsible for initializing the machine. It first attempts to read and parse the state from `localStorage`. If successful, it creates the machine with this persisted state as the initial context. If it fails or no state is found, it uses a default initial state.

#### 4.4. LLM Integration Layer

This layer acts as an adapter between the LLM's output and our state machine.

*   **Responsibility:** To translate an LLM's intent to manipulate the UI into a valid `UIEvent` for our machine.
*   **Technology:** Vercel AI SDK (`useActions`).
*   **Implementation Flow:**
    1.  The LLM, running on the server, decides to call a tool, for example, `expandChatApp('pink-chat')`.
    2.  The Vercel AI SDK's server-side `actions` definition maps this tool call to a specific payload.
    3.  This payload is streamed down to the client.
    4.  The `useActions` hook on the client receives this payload and invokes a client-side function.
    5.  This client-side function's sole purpose is to dispatch the corresponding event to our XState actor: `uiActor.send({ type: 'CHAT_APP_EXPANDED', payload: { appId: 'pink-chat' } })`.
    6.  The state machine takes over, the UI re-renders, and the loop is complete.

### 5. Data Model & State Machine

The core data model and state machine logic are defined in `uiMachine.ts`.

### 6. Testing Strategy

The decoupled nature of this architecture allows for targeted and effective testing.

*   **Unit Testing (State Logic):**
    *   **Target:** The `uiMachine` object itself.
    *   **Method:** Use XState's testing utilities or simply call `uiMachine.transition()` with a starting state and an event, then assert that the resulting state and context are correct. This can be done in a pure Node.js testing environment (e.g., Vitest, Jest) without a browser.
*   **Component Testing (View Logic):**
    *   **Target:** Individual React components.
    *   **Method:** Use React Testing Library. Provide a mock XState actor or a static state snapshot to a component and assert that it renders the correct output. Test that user interactions (clicks, etc.) call the `send` function with the correct event object.
*   **End-to-End (E2E) Testing:**
    *   **Target:** The full application running in a browser.
    *   **Method:** Use a framework like Playwright or Cypress to simulate complete user flows, from creating a tab to expanding an app. This will also be used to validate the full LLM-to-UI interaction loop by mocking the Vercel AI SDK's responses.