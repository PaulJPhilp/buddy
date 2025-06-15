import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

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
