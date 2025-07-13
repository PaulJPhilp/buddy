import { CoreComponent } from "@/components/core";
import type { AgentConfig, ChatAppConfig } from "@/types/global";
import { Effect, Layer } from "effect";
import { beforeEach, describe, expect, it } from "vitest";
import type { ChatAppManagerApi } from "../manager";
import { ChatAppManager } from "../manager-service";
import { ChatAppComponent } from "../service";

const testConfig: ChatAppConfig = {
  id: "test-app",
  name: "Test App",
  agentId: "agent-1",
  version: "1.0.0",
  description: "A test chat app",
};

const testAgent: AgentConfig = {
  id: "agent-1",
  name: "Test Agent",
  description: "Test agent",
  version: "1.0.0",
};

describe("ChatAppManager", () => {
  let manager: ChatAppManagerApi;

  beforeEach(async () => {
    const testLayer = Layer.mergeAll(
      CoreComponent.Default,
      ChatAppComponent.Default,
      ChatAppManager.Default
    );
    manager = await Effect.runPromise(
      Effect.gen(function* () {
        return yield* ChatAppManager;
      }).pipe(Effect.provide(testLayer))
    );
  });

  it("should initialize and cleanup", async () => {
    await expect(
      Effect.runPromise(manager.initialize(testConfig))
    ).resolves.toBeUndefined();
    await expect(Effect.runPromise(manager.cleanup())).resolves.toBeUndefined();
  });

  it("should send and receive messages", async () => {
    await Effect.runPromise(manager.initialize(testConfig));
    await Effect.runPromise(manager.sendMessage("Hello!"));
    await Effect.runPromise(
      manager.receiveMessage({
        id: "2",
        content: "Hi there!",
        sender: "assistant",
        timestamp: new Date(),
      })
    );
    const messages = await Effect.runPromise(manager.getMessages());
    expect(messages.length).toBe(2);
    expect(messages[0].content).toBe("Hello!");
    expect(messages[1].content).toBe("Hi there!");
  });

  it("should manage UI state", async () => {
    await Effect.runPromise(manager.initialize(testConfig));
    await Effect.runPromise(manager.setUIState({ isWindowOpen: false }));
    const uiState = await Effect.runPromise(manager.getUIState());
    expect(uiState.isWindowOpen).toBe(false);
  });

  it("should assign and switch agent", async () => {
    await Effect.runPromise(manager.initialize(testConfig));
    await Effect.runPromise(manager.assignAgent(testAgent));
    const agent = await Effect.runPromise(manager.getCurrentAgent());
    expect(agent?.id).toBe("agent-1");
    await Effect.runPromise(manager.switchAgent("agent-2"));
    const agentAfter = await Effect.runPromise(manager.getCurrentAgent());
    expect(agentAfter).toBeNull();
  });

  it("should subscribe to state changes", async () => {
    await Effect.runPromise(manager.initialize(testConfig));
    let called = false;
    const unsubscribe = await Effect.runPromise(
      manager.subscribe(() => {
        called = true;
      })
    );
    await Effect.runPromise(manager.setUIState({ isWindowOpen: false }));
    expect(called).toBe(true);
    // Unsubscribe should remove the callback
    called = false;
    unsubscribe();
    await Effect.runPromise(manager.setUIState({ isWindowOpen: true }));
    expect(called).toBe(false);
  });

  it("should error if state not initialized", async () => {
    await expect(Effect.runPromise(manager.getState())).rejects.toThrow();
    await expect(Effect.runPromise(manager.getUIState())).rejects.toThrow();
  });
});
