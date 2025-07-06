import { Effect } from "effect";
import WebSocket from "isomorphic-ws";
import { describe, expect, it } from "vitest";

// Helper to get the expected WebSocket URL from env
const getExpectedWsUrl = () => {
  const envUrl =
    typeof process !== "undefined" && process.env.NEXT_PUBLIC_WS_URL
      ? process.env.NEXT_PUBLIC_WS_URL
      : undefined;
  if (!envUrl) {
    throw new Error(
      "NEXT_PUBLIC_WS_URL is not set. Please configure the WebSocket endpoint in your environment.",
    );
  }
  return envUrl.endsWith("/") ? envUrl + "chat" : envUrl + "/chat";
};

describe("Minimal WebSocket Effect Test", () => {
  it("should connect using Effect.promise pattern", async () => {
    const url = getExpectedWsUrl();

    const connectEffect = Effect.promise(() => {
      console.log("[MinimalTest] Creating promise for:", url);

      return new Promise<WebSocket>((resolve, reject) => {
        console.log("[MinimalTest] Creating WebSocket");
        const ws = new WebSocket(url);

        const timeout = setTimeout(() => {
          console.log("[MinimalTest] Connection timeout");
          ws.close();
          reject(new Error("Connection timeout"));
        }, 5000);

        ws.onopen = () => {
          console.log("[MinimalTest] Connection opened");
          clearTimeout(timeout);
          resolve(ws);
        };

        ws.onerror = (error) => {
          console.error("[MinimalTest] Connection error:", error);
          clearTimeout(timeout);
          reject(error);
        };

        ws.onclose = (event) => {
          console.log("[MinimalTest] Connection closed:", event.code);
          clearTimeout(timeout);
        };
      });
    });

    console.log("[MinimalTest] Running Effect.promise");
    const ws = await Effect.runPromise(connectEffect);
    console.log("[MinimalTest] Effect completed, got WebSocket");

    expect(ws).toBeDefined();
    expect(ws.readyState).toBe(WebSocket.OPEN);

    ws.close();
    console.log("[MinimalTest] Test completed");
  });

  it("should connect using void return pattern (like llm-agent)", async () => {
    const url = getExpectedWsUrl();
    let wsInstance: WebSocket | null = null;

    const connectEffect = Effect.promise(() => {
      console.log("[VoidTest] Creating promise for:", url);

      return new Promise<void>((resolve, reject) => {
        console.log("[VoidTest] Creating WebSocket");
        const ws = new WebSocket(url);
        wsInstance = ws;

        const timeout = setTimeout(() => {
          console.log("[VoidTest] Connection timeout");
          ws.close();
          reject(new Error("Connection timeout"));
        }, 5000);

        ws.onopen = () => {
          console.log("[VoidTest] Connection opened");
          clearTimeout(timeout);
          resolve(); // Resolve with void, like llm-agent
        };

        ws.onerror = (error) => {
          console.error("[VoidTest] Connection error:", error);
          clearTimeout(timeout);
          reject(error);
        };

        ws.onclose = (event) => {
          console.log("[VoidTest] Connection closed:", event.code);
          clearTimeout(timeout);
        };
      });
    });

    console.log("[VoidTest] Running Effect.promise");
    await Effect.runPromise(connectEffect);
    console.log("[VoidTest] Effect completed");

    expect(wsInstance).toBeDefined();
    expect(wsInstance?.readyState).toBe(WebSocket.OPEN);

    wsInstance?.close();
    console.log("[VoidTest] Test completed");
  });
});
