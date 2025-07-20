import {
  ChatAppConfigSchema,
  SubscriptionConfig,
} from "@/features/chatapps/schemas/ChatAppConfigSchema";
import { ChatManager } from "@/managers/chat";
import { ChatAppsManager } from "@/managers/chatapps";
import { Effect, Layer } from "effect";
import { beforeEach, describe, expect, it } from "vitest";

const testLayer = Layer.mergeAll(ChatManager.Default, ChatAppsManager.Default);

describe("ChatApp Subscriptions Integration", () => {
  beforeEach(() =>
    Effect.runPromise(
      Effect.gen(function* () {
        const chatManager = yield* ChatManager;
        const chatAppsManager = yield* ChatAppsManager;
        yield* chatManager.resetState();
        yield* chatAppsManager.resetState();
      }).pipe(Effect.provide(testLayer))
    )
  );

  it("a subscribed chatapp should receive a message when the source app sends one", async () => {
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const chatManager = yield* ChatManager;
        const chatAppsManager = yield* ChatAppsManager;

        // 1. Register two chat apps
        const appAConfig = {
          id: "app-a",
          name: "App A",
          agentId: "agent-a",
          toolbarId: "toolbar-a",
        };
        const appBConfig = {
          id: "app-b",
          name: "App B",
          agentId: "agent-b",
          toolbarId: "toolbar-b",
          subscriptions: [{ appId: "app-a" }],
        };

        yield* chatAppsManager.registerChatApp("ws-1", "app-a", appAConfig);
        yield* chatAppsManager.registerChatApp("ws-1", "app-b", appBConfig);

        // 2. Start conversations
        const convAId = yield* chatManager.startConversation(
          "agent-a",
          undefined,
          appAConfig
        );
        const convBId = yield* chatManager.startConversation(
          "agent-b",
          undefined,
          appBConfig
        );
        yield* chatManager.setActiveConversation(convBId);

        // 3. Send a message from App A
        yield* chatManager.sendMessage(convAId, "Hello from App A");

        // 4. Verify App B receives the message
        yield* Effect.sleep("100 millis"); // Allow time for message to propagate
        const messagesInB = yield* chatManager.getMessages(convBId);

        return messagesInB;
      }).pipe(Effect.provide(testLayer))
    );

    expect(result.length).toBe(1);
    expect(result[0].content).toBe("Hello from App A");
    expect(result[0].role).toBe("user");
  });

  it("should not receive messages if not subscribed", async () => {
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const chatManager = yield* ChatManager;
        const chatAppsManager = yield* ChatAppsManager;

        // 1. Register two chat apps, no subscriptions
        const appAConfig = {
          id: "app-a",
          name: "App A",
          agentId: "agent-a",
          toolbarId: "toolbar-a",
        };
        const appBConfig = {
          id: "app-b",
          name: "App B",
          agentId: "agent-b",
          toolbarId: "toolbar-b",
        };

        yield* chatAppsManager.registerChatApp("ws-1", "app-a", appAConfig);
        yield* chatAppsManager.registerChatApp("ws-1", "app-b", appBConfig);

        // 2. Start conversations
        const convAId = yield* chatManager.startConversation(
          "agent-a",
          undefined,
          appAConfig
        );
        const convBId = yield* chatManager.startConversation(
          "agent-b",
          undefined,
          appBConfig
        );
        yield* chatManager.setActiveConversation(convBId);

        // 3. Send a message from App A
        yield* chatManager.sendMessage(convAId, "Hello from App A");

        // 4. Verify App B receives no messages
        yield* Effect.sleep("100 millis");
        const messagesInB = yield* chatManager.getMessages(convBId);

        return messagesInB;
      }).pipe(Effect.provide(testLayer))
    );

    expect(result.length).toBe(0);
  });

  it("should prevent loops with maxTurns", async () => {
    const { messagesInA, messagesInB } = await Effect.runPromise(
      Effect.gen(function* () {
        const chatManager = yield* ChatManager;
        const chatAppsManager = yield* ChatAppsManager;

        // 1. Register two apps, subscribed to each other with maxTurns: 1
        const appAConfig = {
          id: "app-a",
          name: "App A",
          agentId: "agent-a",
          toolbarId: "toolbar-a",
          subscriptions: [{ appId: "app-b", maxTurns: 1 }],
        };
        const appBConfig = {
          id: "app-b",
          name: "App B",
          agentId: "agent-b",
          toolbarId: "toolbar-b",
          subscriptions: [{ appId: "app-a", maxTurns: 1 }],
        };

        yield* chatAppsManager.registerChatApp("ws-1", "app-a", appAConfig);
        yield* chatAppsManager.registerChatApp("ws-1", "app-b", appBConfig);

        // 2. Start conversations and set active
        const convAId = yield* chatManager.startConversation(
          "agent-a",
          undefined,
          appAConfig
        );
        const convBId = yield* chatManager.startConversation(
          "agent-b",
          undefined,
          appBConfig
        );
        yield* chatManager.setActiveConversation(convBId); // App B is listening

        // 3. Send a message from App A to start the "conversation"
        yield* chatManager.sendMessage(convAId, "Hello, App B!");

        yield* Effect.sleep("200 millis"); // Allow propagation

        // 4. App B should have received the message. Now, let's make App A the active listener.
        yield* chatManager.setActiveConversation(convAId);

        // This is where App B would "respond", triggering App A's subscription.
        // We'll simulate this by sending a message directly from convB.
        yield* chatManager.sendMessage(convBId, "Hello, App A!");

        yield* Effect.sleep("200 millis"); // Allow potential propagation

        // 5. Verify the number of messages in each conversation
        const messagesInA = yield* chatManager.getMessages(convAId);
        const messagesInB = yield* chatManager.getMessages(convBId);

        return { messagesInA, messagesInB };
      }).pipe(Effect.provide(testLayer))
    );

    // App A sent one message and should NOT have received App B's reply due to maxTurns.
    expect(messagesInA.length).toBe(1);
    expect(messagesInA[0].content).toBe("Hello, App B!");

    // App B received App A's first message and sent one back.
    expect(messagesInB.length).toBe(2);
    expect(messagesInB[0].content).toBe("Hello, App B!");
    expect(messagesInB[0].role).toBe("user");
    expect(messagesInB[1].content).toBe("Hello, App A!");
  });
});
