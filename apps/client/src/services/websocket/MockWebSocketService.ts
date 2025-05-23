import { Effect } from "effect";
import type { WebSocketServiceApi } from "./WebSocketService";

export class WebSocketServiceMock extends Effect.Service<WebSocketServiceApi>()(
    "WebSocketService",
    {
        effect: Effect.succeed({
            _tag: "WebSocketService",
            connect: () => Effect.succeed(undefined),
            disconnect: () => Effect.succeed(undefined),
            send: () => Effect.succeed(undefined),
            receive: () => Effect.succeed(undefined),
        }),
        dependencies: [],
    },
) { } 