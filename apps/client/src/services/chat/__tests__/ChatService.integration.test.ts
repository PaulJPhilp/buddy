import { afterAll, beforeAll, describe, expect, it } from "vitest";

describe("ChatService Integration Tests - Live LLM Agent", () => {
  let ws: WebSocket;
  const LLM_AGENT_URL = "ws://localhost:8080/chat";

  const connectToAgent = async (): Promise<WebSocket> => {
    return new Promise((resolve, reject) => {
      const socket = new WebSocket(LLM_AGENT_URL);

      const timeout = setTimeout(() => {
        socket.close();
        reject(new Error("Connection timeout"));
      }, 5000);

      socket.onopen = () => {
        clearTimeout(timeout);
        console.log("Connected to LLM Agent");
        resolve(socket);
      };

      socket.onerror = (error) => {
        clearTimeout(timeout);
        reject(error);
      };
    });
  };

  const sendUserMessage = async (
    socket: WebSocket,
    text: string,
    chatId = "test-chat",
  ): Promise<any[]> => {
    // Create user message in the format the llm-agent expects
    const userMessage = {
      type: "USER_MESSAGE",
      text,
      metadata: { chatId },
    };

    console.log("Sending user message:", { text, chatId });
    socket.send(JSON.stringify(userMessage));

    // Collect all responses
    const responses: any[] = [];

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`No response received for message: "${text}"`));
      }, 30000); // 30 second timeout for LLM processing

      const messageHandler = (event: MessageEvent) => {
        try {
          const response = JSON.parse(event.data);
          responses.push(response);

          console.log("Received response:", {
            type: response.type,
            hasContent: !!response.content,
            isComplete: response.isComplete,
          });

          // Look for completion or meaningful response
          if (response.type === "LLM_STREAM" && response.isComplete) {
            clearTimeout(timeout);
            socket.removeEventListener("message", messageHandler);
            resolve(responses);
          } else if (response.type === "LLM_RESPONSE") {
            clearTimeout(timeout);
            socket.removeEventListener("message", messageHandler);
            resolve(responses);
          } else if (response.type === "WELCOME") {
            // Just log welcome messages, don't resolve yet
            console.log("Received welcome message:", response.message);
          } else if (response.type === "RECEIVED") {
            // Just log acknowledgment, don't resolve yet
            console.log("Received acknowledgment:", response.message);
          } else if (response.type === "PROCESSING") {
            // Just log processing message, don't resolve yet
            console.log("Received processing message:", response.message);
          }
        } catch (e) {
          console.error("Failed to parse response:", event.data);
        }
      };

      socket.addEventListener("message", messageHandler);
    });
  };

  beforeAll(async () => {
    // Ensure LLM agent is running
    try {
      ws = await connectToAgent();
      // Wait for welcome message
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      throw new Error(
        `LLM Agent not available at ${LLM_AGENT_URL}. Please start it first.`,
      );
    }
  });

  afterAll(() => {
    if (ws) {
      ws.close();
    }
  });

  it("should handle a simple greeting conversation", async () => {
    const responses = await sendUserMessage(ws, "Hello! How are you today?");

    expect(responses.length).toBeGreaterThan(0);

    // Should receive acknowledgment
    const ackResponse = responses.find(
      (r) => r.type === "RECEIVED" || r.message?.includes("received"),
    );
    expect(ackResponse).toBeDefined();

    // Should receive LLM stream responses
    const llmResponses = responses.filter((r) => r.type === "LLM_STREAM");
    expect(llmResponses.length).toBeGreaterThan(0);

    // Combine all LLM stream content
    const fullResponse = llmResponses
      .filter((r) => r.content)
      .map((r) => r.content)
      .join("");

    expect(fullResponse.length).toBeGreaterThan(0);
    console.log("Full LLM Response:", fullResponse);
  }, 35000);

  it("should handle a technical question", async () => {
    const responses = await sendUserMessage(
      ws,
      "Explain the difference between REST and GraphQL APIs in a brief summary.",
    );

    expect(responses.length).toBeGreaterThan(0);

    const llmResponses = responses.filter(
      (r) => r.type === "LLM_STREAM" && r.content,
    );
    expect(llmResponses.length).toBeGreaterThan(0);

    const fullResponse = llmResponses.map((r) => r.content).join("");

    // Should mention both REST and GraphQL
    expect(fullResponse.toLowerCase()).toContain("rest");
    expect(fullResponse.toLowerCase()).toContain("graphql");

    console.log("Technical Response:", fullResponse);
  }, 35000);

  it("should handle multiple messages in sequence", async () => {
    // First message
    const responses1 = await sendUserMessage(ws, "What is TypeScript?");
    expect(responses1.length).toBeGreaterThan(0);

    const llmResponses1 = responses1.filter(
      (r) => r.type === "LLM_STREAM" && r.content,
    );
    const response1Text = llmResponses1.map((r) => r.content).join("");
    expect(response1Text.toLowerCase()).toContain("typescript");

    // Wait a bit between messages
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Second message
    const responses2 = await sendUserMessage(
      ws,
      "Can you give me a simple example?",
    );
    expect(responses2.length).toBeGreaterThan(0);

    const llmResponses2 = responses2.filter(
      (r) => r.type === "LLM_STREAM" && r.content,
    );
    const response2Text = llmResponses2.map((r) => r.content).join("");
    expect(response2Text.length).toBeGreaterThan(0);

    console.log("First response:", response1Text.substring(0, 100) + "...");
    console.log("Second response:", response2Text.substring(0, 100) + "...");
  }, 60000);

  it("should handle different chat IDs", async () => {
    // Send message to chat-1
    const responses1 = await sendUserMessage(ws, "Hello from chat 1", "chat-1");
    expect(responses1.length).toBeGreaterThan(0);

    // Send message to chat-2
    const responses2 = await sendUserMessage(ws, "Hello from chat 2", "chat-2");
    expect(responses2.length).toBeGreaterThan(0);

    // Both should get responses
    const llmResponses1 = responses1.filter(
      (r) => r.type === "LLM_STREAM" && r.content,
    );
    const llmResponses2 = responses2.filter(
      (r) => r.type === "LLM_STREAM" && r.content,
    );

    expect(llmResponses1.length).toBeGreaterThan(0);
    expect(llmResponses2.length).toBeGreaterThan(0);

    console.log(
      "Chat 1 response length:",
      llmResponses1.map((r) => r.content).join("").length,
    );
    console.log(
      "Chat 2 response length:",
      llmResponses2.map((r) => r.content).join("").length,
    );
  }, 60000);

  it("should handle markdown formatting request", async () => {
    const responses = await sendUserMessage(
      ws,
      "Create a markdown list of 3 programming languages with brief descriptions.",
    );

    expect(responses.length).toBeGreaterThan(0);

    const llmResponses = responses.filter(
      (r) => r.type === "LLM_STREAM" && r.content,
    );
    const fullResponse = llmResponses.map((r) => r.content).join("");

    // Should contain markdown formatting
    expect(fullResponse).toMatch(/[-*+]\s+/); // List items
    expect(fullResponse.length).toBeGreaterThan(50);

    console.log("Markdown Response:", fullResponse);
  }, 35000);
});
