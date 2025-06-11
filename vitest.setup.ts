import { cleanup } from "@testing-library/react";
import { Effect, Layer } from "effect";
import { afterEach, beforeAll } from "vitest";
import { ChatInstanceService } from "./apps/client/src/services/chat-instance/ChatInstanceService";
import { ChatService } from "./apps/client/src/services/chat/ChatService";
import { MdxService } from "./apps/client/src/services/mdx";
import { WebSocketService } from "./apps/client/src/services/websocket/WebSocketService";

// Clean up after each test
afterEach(() => {
  cleanup();
});

// Initialize base test layer
// const BaseTestLayer = Layer.mergeAll(
//   WebSocketService.Default,
//   MdxService.Default,
//   ChatService.Default,
//   ChatInstanceService.Default
// );

// Make services available globally for tests
// beforeAll(async () => {
//   await Effect.runPromise(
//     Effect.provide(
//       Effect.unit,
//       BaseTestLayer
//     )
//   );
// }); 