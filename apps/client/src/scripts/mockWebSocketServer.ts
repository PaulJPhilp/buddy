import { Effect, Layer, Stream } from "effect";
import { AgentRuntimeService } from "../services/agent-runtime/AgentRuntimeService";
import { MockWebSocketServer } from "../services/websocket/MockWebSocketServer";
import { WebSocketError, WebSocketService } from "../services/websocket/WebSocketService";
import { AgentRuntimeConfigService } from "@/services/agent-runtime/config";

const PORT = 3001;

// Create a layer with config, websocket, agent runtime, and mock server
const ServerLayer = Layer.mergeAll(
    AgentRuntimeConfigService.Default,
    WebSocketService.Default,
    AgentRuntimeService.Default,
    MockWebSocketServer.Default,
);

// Server program
const program = Effect.gen(function* () {
    const server = yield* MockWebSocketServer;
    const runtime = yield* AgentRuntimeService;

    // Start the server
    yield* server.start(PORT);
    console.log(`Mock WebSocket server running on ws://localhost:${PORT}`);

    // Set up message handling
    yield* server.onMessage((message) =>
        Effect.gen(function* () {
            console.log("Received message:", message);

            // Parse the message and forward to agent runtime
            try {
                const activity = JSON.parse(message.text);
                if (activity.type === "USER_MESSAGE") {
                    yield* runtime.sendMessage(activity.payload.text).pipe(
                        Effect.mapError((e) => new WebSocketError(e.message, e.code ?? "RUNTIME_ERROR"))
                    );
                }
            } catch (e) {
                console.error("Error processing message:", e);
            }
        })
    );

    // Subscribe to agent runtime state updates
    yield* Stream.runForEach(runtime.getState, (state) =>
        server.broadcast({
            text: JSON.stringify(state),
            timestamp: new Date().toISOString(),
        })
    );

    // Start the runtime
    yield* runtime.start();
});

// Run the program
Effect.runPromise(
    program.pipe(
        Effect.provide(ServerLayer),
        Effect.tapError((e) => Effect.sync(() => console.error("Server error:", e))),
        Effect.map(() => void 0)
    ) as Effect.Effect<void, any, never>
); 