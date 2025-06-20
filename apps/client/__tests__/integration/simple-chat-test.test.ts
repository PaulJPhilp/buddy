import { ChatService } from "@/services/chat";
import { ConfigService } from "@/services/config";
import { MdxService } from "@/services/mdx";
import { WebSocketService } from "@/services/websocket";
import { Effect, Layer } from "effect";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

describe("Simple Chat Test", () => {
  let chatService: any;

  beforeAll(async () => {
    const serviceLayer = Layer.mergeAll(
      WebSocketService.Default,
      MdxService.Default,
      ConfigService.Default,
      ChatService.Default,
    );

    chatService = await Effect.runPromise(
      ChatService.pipe(Effect.provide(serviceLayer)),
    );

    // Initialize ChatService with WebSocket
    await Effect.runPromise(
      chatService.initialize("simple-test", "ws://localhost:8080"),
    );
  });

  afterAll(async () => {
    // ChatService doesn't have a disconnect method
    // The cleanup will happen automatically
  });

  it("should have initial empty state", async () => {
    const state = await Effect.runPromise(chatService.getState());

    console.log("Initial state:", {
      messageCount: state.messages.length,
      messages: state.messages.map((m) => ({
        id: m.id,
        text: m.text?.substring(0, 50),
      })),
    });

    expect(state.messages.length).toBe(0);
  });

  it("should add user message when sending", async () => {
    await Effect.runPromise(chatService.sendMessage("Hello"));

    const state = await Effect.runPromise(chatService.getState());

    console.log("State after sending message:", {
      messageCount: state.messages.length,
      messages: state.messages.map((m) => ({
        id: m.id,
        sender: m.sender,
        text: m.text?.substring(0, 50),
      })),
    });

    expect(state.messages.length).toBeGreaterThan(0);
    expect(state.messages[0].sender).toBe("user");
    expect(state.messages[0].text).toBe("Hello");
  });
});
