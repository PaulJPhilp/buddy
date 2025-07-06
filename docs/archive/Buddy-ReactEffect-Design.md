## Detailed Design Document: `useChatInstance` Hook & Effect Program

**Version:** 1.0
**Date:** 5/21/2025
**Author:** T3 Chat (Generated for Paul)
**Related Document:** Overview Architecture Document: Buddy Chat Instance Client

### 1. Introduction

This document provides a detailed design for the `useChatInstance` React custom hook and its associated Effect-TS program. This hook is responsible for managing the entire lifecycle, state, and real-time communication for a single chat instance within the Buddy application.

### 2. Module: `common-types.ts`

This module defines the core data structures used throughout the chat instance.

*   **`Message` Interface:**
    ```typescript
    export interface Message {
      id: string;          // Unique message ID (can be UUID, assigned by agent or client on send)
      text: string;        // Content of the message
      sender: "user" | "agent" | "system"; // Originator of the message
      timestamp: string;   // ISO 8601 date string
    }
    ```
    *Rationale:* Standard representation for a chat message. `id` for keying in lists and potential future features.

*   **`ChatState` Interface:**
    ```typescript
    export interface ChatState {
      chatId: string;      // Unique ID for this chat session instance
      messages: ReadonlyArray<Message>; // Immutable list of messages
      status:
        | "initializing" // Hook is setting up
        | "connecting"   // Attempting WebSocket connection
        | "connected"    // WebSocket connected and active
        | "disconnected" // WebSocket intentionally closed or unrecoverable error after retries
        | "reconnecting" // Actively retrying a dropped connection
        | "error";       // Unrecoverable error state / Max retries reached
      agentName: string;   // Display name of the agent
      error?: string;      // Optional error message for UI display (e.g., connection failed reason)
    }
    ```
    *Rationale:* Represents the complete snapshot of a chat instance's UI-relevant state.

*   **`ChatAction` Type:**
    ```typescript
    export type ChatAction =
      | { _tag: "sendMessage"; text: string }
      | { _tag: "tryReconnect" }; // User-initiated attempt to reconnect
    ```
    *Rationale:* Defines commands that the React UI can dispatch to the Effect program.

*   **`ClientMessagePayload` Interface:** (Messages sent from Client to Agent)
    ```typescript
    export interface ClientMessagePayload {
      type: "userMessage";
      // chatId and agentId are typically sent as part of the WebSocket URL query params
      // or as part of an initial handshake message if the protocol requires.
      // For simplicity here, we assume they are known by the agent via connection params.
      message: Omit<Message, "id" | "sender" | "timestamp">; // Agent fills id, sender, timestamp
    }
    // Future types: { type: "ping" }, { type: "setTyping", status: boolean }
    ```
    *Rationale:* Structure of messages sent *to* the agent over WebSocket.

*   **`AgentEvent` Type:** (Events received from Agent via WebSocket)
    ```typescript
    export type AgentEvent =
      | { type: "newMessage"; payload: Message }
      | { type: "statusUpdate"; status: ChatState["status"]; agentName?: string }
      | { type: "fullState"; payload: ChatState } // For initial sync or recovery
      | { type: "error"; message: string }        // Agent-side error to display to user
      | { type: "pong" };                         // Response to a client ping
    ```
    *Rationale:* Structure of messages/events received *from* the agent.

### 3. Module: `useChatInstance.ts`

#### 3.1. `AgentConfig` Service

*   **Interface & Tag:**
    ```typescript
    export interface AgentConfig {
      readonly agentId: string;        // Logical ID of the agent (e.g., "weatherAgentV1")
      readonly agentWsUrl: string;     // Full WebSocket URL (e.g., "wss://example.com/chat")
      readonly initialAgentName: string; // Default display name for the agent
    }
    export const AgentConfig = Context.Tag<AgentConfig>();
    ```
    *Rationale:* Provides necessary agent-specific configuration to the Effect program via dependency injection.

#### 3.2. `useChatInstance` Hook

*   **Signature:**
    ```typescript
    export function useChatInstance(
      chatId: string,
      agentConfig: AgentConfig
    ): {
      chatState: ChatState; // Note: Initial state is now non-null
      runtimeError: unknown | null;
      dispatchAction: (action: ChatAction) => void;
    }
    ```

*   **Internal State (`useState`):**
    *   `chatState`: Initialized with a default `initializing` state:
        ```typescript
        const [chatState, setChatState] = useState<ChatState>(() => ({
          chatId,
          messages: [],
          status: "initializing",
          agentName: agentConfig.initialAgentName,
        }));
        ```
    *   `runtimeError`: For critical errors during Effect program setup.
    *   `dispatchAction`: Placeholder function, later replaced by the Effect-connected dispatcher.

*   **`useEffect` Hook:**
    *   **Dependencies:** `[chatId, agentConfigLayer]` (where `agentConfigLayer` is memoized from `agentConfig`).
    *   **Scope Management:**
        *   `const scope = Scope.make();` on setup.
        *   `Scope.close(scope, Effect.exitSucceed(undefined))` in the cleanup function.
    *   **Main Effect Program (`program`):**
        This is an `Effect.gen` block orchestrating the chat instance's logic.
        *   **Service Provision:**
            *   `Effect.provide(agentConfigLayer)`
            *   `Effect.provide(WSP.WebSocketPlatformLive)` (Browser WebSocket implementation)
            *   `Effect.provideService(Scope.Scope, scope)` (Provides the instance-specific scope)
        *   **Input Queue:**
            *   `const inputQueue = yield* _(Queue.unbounded<ChatAction>());`
        *   **`dispatchAction` Setup:**
            *   `setDispatchAction(() => (action: ChatAction) => Effect.runFork(Queue.offer(inputQueue, action)));`
        *   **`webSocketManager` Effect (Detailed):**
            This is the core Effect responsible for a single WebSocket connection's lifecycle.
            *   **Purpose:** Establish, maintain, and utilize a WebSocket connection for bi-directional communication. Handle retries.
            *   **Dependencies:** `AgentConfig`, `WSP.WebSocketPlatform`, `chatId`, `inputQueue`.
            *   **`updateStatus` Helper:**
                ```typescript
                const updateStatus = (status: ChatState["status"], error?: string) =>
                  Effect.sync(() => setChatState((prev) => ({ ...prev, status, error })));
                ```
            *   **Connection Logic:**
                *   URL: `const wsUrl = \`${config.agentWsUrl}?chatId=${chatId}&agentId=${config.agentId}\`;`
                *   Connection: `const webSocket = yield* _(wsPlatform.connect(wsUrl));`
                    *   This effect is scoped; the `WS.WebSocket` resource will be finalized (closed) when its encompassing scope (`webSocketManager`'s scope) is closed.
            *   **`Effect.scoped` Usage:** The entire body of `webSocketManager` that uses the `webSocket` resource is wrapped in `Effect.gen(function*(_) { ... }).pipe(Effect.scoped)`. This ensures the `webSocket` (acquired via `wsPlatform.connect`) is closed when `webSocketManager` terminates or is interrupted.
            *   **Outgoing Message Handling (`outgoingEffect`):**
                *   `Stream.fromQueue(inputQueue)`: Consumes `ChatAction`s.
                *   Filters for `_tag: "sendMessage"`.
                *   Transforms to `ClientMessagePayload`.
                *   `JSON.stringify`.
                *   `Stream.run(webSocket.sink)`: Sends data to the WebSocket.
                *   Error Handling: Logs errors, potentially updates `chatState` to reflect send failure if critical.
                *   Execution: `yield* _(Effect.forkDaemon(outgoingEffect));`
            *   **Incoming Message Handling (`incomingStream`):**
                *   `webSocket.messages`: A `Stream<string | Uint8Array, WS.ReceiveError>`.
                *   Decodes `Uint8Array` to string if necessary.
                *   `JSON.parse` to `AgentEvent`. Handles parsing errors by logging and skipping invalid messages.
                *   `Stream.runForEach(incomingStream, (event) => ...)`:
                    *   A `switch (event.type)` block updates `chatState` via `setChatState` based on the `AgentEvent`.
                        *   `newMessage`: Appends to `messages` array. Sets status to `connected`.
                        *   `statusUpdate`: Updates `chatState.status` and `chatState.agentName`.
                        *   `fullState`: Replaces the entire `chatState`.
                        *   `error`: Sets `chatState.status` to `error` and updates `chatState.error`.
                        *   `pong`: Logs or handles keep-alive.
                    *   Error Handling: If `incomingStream` itself fails (e.g., WebSocket error not caught by `retry`), this error propagates.
            *   **Retry Logic (`Effect.retry(Schedule)`):**
                *   The `Effect.scoped` block (containing connection and message handling) is wrapped:
                    ```typescript
                    .pipe(
                      Effect.retry(
                        Schedule.exponential(INITIAL_RECONNECT_DELAY) // e.g., 1 second
                          .pipe(
                            Schedule.compose(Schedule.recurs(MAX_RECONNECT_ATTEMPTS)), // e.g., 5 attempts
                            Schedule.tapOutput((output) =>
                              updateStatus("reconnecting", `Attempt ${output.attempts + 1}`)
                                .pipe(Effect.zipRight(Effect.logWarning(...)))
                            )
                          )
                      )
                    )
                    ```
                *   If `wsPlatform.connect` fails or if the `webSocket.messages` stream terminates unexpectedly, the entire `Effect.scoped` block is retried.
                *   After max retries, if it still fails, the error propagates from `Effect.retry`.
            *   **Final Error Handling:** The `webSocketManager` catches errors from `Effect.retry` (meaning all retries failed) and calls `updateStatus("error", "Failed to connect after multiple attempts.")`.
        *   **`tryReconnect` Action Handling:**
            *   A separate `Stream.fromQueue(inputQueue)` can listen for `_tag: "tryReconnect"`.
            *   Upon receiving this, it could potentially interrupt the current `webSocketManager`'s fiber (if one is explicitly managed) to force a restart of the connection logic, or simply log and rely on the existing retry mechanism if it's already in a failed/reconnecting state. For simplicity, the current design relies on the automatic retry.
        *   **Top-Level Error Handling:** The main `program` is wrapped in `Effect.catchAll` to catch any unhandled errors during setup or catastrophic failures, updating `runtimeError` and `chatState`.
    *   **Running the Program:** `const fiber = Effect.runFork(program);`
    *   **Cleanup Function (returned by `useEffect`):**
        ```typescript
        return () => {
          Effect.runFork(
            Effect.all([
              Fiber.interrupt(fiber),
              Scope.close(scope, Effect.exitSucceed(undefined)),
            ])
          );
          // Reset dispatchAction to a no-op to prevent calls after unmount
        };
        ```

### 4. WebSocket Communication Protocol

*   **Connection URL:** `config.agentWsUrl?chatId=<chatIdValue>&agentId=<agentIdValue>`
*   **Client-to-Agent Messages:** JSON stringified `ClientMessagePayload`.
    *   Example: `{"type":"userMessage","message":{"text":"Hello Agent"}}`
*   **Agent-to-Client Messages:** JSON stringified `AgentEvent`.
    *   Example: `{"type":"newMessage","payload":{"id":"msg-123","text":"Hello User","sender":"agent","timestamp":"2025-05-21T12:00:00Z"}}`
    *   Example: `{"type":"statusUpdate","status":"connected","agentName":"Helpful Bot"}`

### 5. State Management (`ChatState`)

*   **`chatId`:** Set on initialization from hook props, remains constant.
*   **`messages`:** Appended to by `AgentEvent` of type `newMessage`. Replaced by `fullState`.
*   **`status`:**
    *   `initializing`: Initial state of the hook.
    *   `connecting`: Set by `webSocketManager` before `wsPlatform.connect`.
    *   `connected`: Set by `webSocketManager` after successful `wsPlatform.connect` or on receiving `newMessage` (as an implicit connected confirmation).
    *   `reconnecting`: Set by the `Schedule.tapOutput` during retry attempts.
    *   `disconnected`: Set if `webSocketManager` fails definitively after retries or if an explicit disconnect event is received.
    *   `error`: Set if `webSocketManager` fails after all retries, or if a critical `AgentEvent` of type `error` is received.
*   **`agentName`:** Set from `agentConfig.initialAgentName` initially. Updated by `AgentEvent` of type `statusUpdate` or `fullState`.
*   **`error`:** Set by `webSocketManager` on connection failures/retries, or by `AgentEvent` of type `error`. Cleared on successful connection or new message.

### 6. Error Handling Strategy

*   **WebSocket Connection Errors:** Handled by `webSocketManager`'s `Effect.retry` logic. UI reflects "reconnecting" status. If all retries fail, UI shows "error" status with a message.
*   **Message Send Errors (within `outgoingEffect`):** Logged. If critical, could update `chatState.error`.
*   **Incoming Message Processing Errors (within `incomingStream`):**
    *   JSON Parsing: Invalid messages are logged and skipped.
    *   Stream Failure: If the `webSocket.messages` stream itself errors out (e.g., underlying WebSocket error not caught by `connect`'s retry), this will cause the `webSocketManager` to fail, triggering its retry logic.
*   **Critical Setup Errors:** Caught by the top-level `Effect.catchAll` in the main `program`, populating `runtimeError` and setting `chatState` to an error state.
*   **Agent-Reported Errors:** Handled via `AgentEvent` of type `error`, updating `chatState.status` and `chatState.error`.

### 7. Testing Strategy

(As previously discussed and detailed in the testing example)
*   **Mock `WSP.WebSocketPlatform`:** Use `TestWebSocketPlatformLive` to control WebSocket behavior (connections, messages, failures).
*   **`TestClock`:** Control virtual time to test `Schedule`s and timeouts precisely.
*   **`@testing-library/react` (`renderHook`, `act`):** Render the hook, dispatch actions, and assert on `chatState` and `runtimeError`.
*   **Effect Test Runner/Environment:** Execute tests within an Effect context, providing necessary mock layers.

### 8. Future Considerations/Potential Improvements

*   **Ping/Pong Keep-Alive:** Implement client-side pings (e.g., via `Stream.repeatEffectWithSchedule`) and expect pongs from the agent to detect dead connections more proactively.
*   **Message Acknowledgments/Guaranteed Delivery:** For critical messages, implement an ack system.
*   **Optimistic Updates for Sent Messages:** Add user's message to `chatState` immediately with a "pending" status, then update on agent confirmation.
*   **More Granular Error Types:** Define more specific error types within Effect for better error handling and reporting.
*   **Backpressure Strategy:** If the client or agent can be overwhelmed, consider strategies for backpressure in message queues or streams.
*   **Shared WebSocket Connection (Advanced):** If multiple chat instances talk to the *same agent endpoint* and the protocol supports multiplexing over a single WebSocket (e.g., by including `chatId` in every message payload), a more complex architecture could share one WebSocket connection. However, the current design prioritizes isolation per instance.
