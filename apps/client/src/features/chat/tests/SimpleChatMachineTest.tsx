import { useMachine } from "@xstate/react";
import React, { useState, useMemo, useCallback } from "react";
import { assign, createMachine } from "xstate";

// Define types for our chat machine
interface ChatContext {
  messages: Array<{
    id: string;
    role: string;
    content: string;
    timestamp: string;
  }>;
  error: null | { message: string };
  isTyping: boolean;
}

type ChatEvent =
  | { type: "SEND"; content: string }
  | { type: "RECEIVE"; message: any }
  | { type: "SET_TYPING"; value: boolean }
  | { type: "ERROR"; error: { message: string } }
  | { type: "CLEAR_ERROR" };

// Create a simple chat machine for testing
const createTestChatMachine = (initialContext: Partial<ChatContext> = {}) => {
  return createMachine(
    {
      id: "chat",
      initial: "idle",
      context: {
        messages: [
          {
            id: "system-1",
            role: "system",
            content: "This is a test of the chat machine.",
            timestamp: new Date().toISOString(),
          },
        ],
        error: null,
        isTyping: false,
        ...initialContext,
      },
      states: {
        idle: {
          on: {
            SEND: {
              target: "sending",
              actions: "addUserMessage",
            },
            RECEIVE: {
              actions: "addMessage",
            },
            SET_TYPING: {
              actions: "setTyping",
            },
          },
        },
        sending: {
          entry: "setTyping",
          after: {
            // Auto-transition after 1.5 seconds to simulate response
            1500: {
              target: "idle",
              actions: "addResponseMessage",
            },
          },
          on: {
            ERROR: {
              target: "error",
              actions: "setError",
            },
          },
        },
        error: {
          on: {
            CLEAR_ERROR: {
              target: "idle",
              actions: "clearError",
            },
            SEND: {
              target: "sending",
              actions: ["clearError", "addUserMessage"],
            },
          },
        },
      },
    },
    {
      actions: {
        addUserMessage: assign({
          messages: ({
            context,
            event,
          }: { context: ChatContext; event: any }) => [
            ...context.messages,
            {
              id: `user-${Date.now()}`,
              role: "user",
              content: (event && event.content) || "Test user message",
              timestamp: new Date().toISOString(),
            },
          ],
        }),
        addResponseMessage: assign({
          messages: ({ context }: { context: ChatContext }) => [
            ...context.messages,
            {
              id: `assistant-${Date.now()}`,
              role: "assistant",
              content: "This is a simulated response.",
              timestamp: new Date().toISOString(),
            },
          ],
          isTyping: false,
        }),
        addMessage: assign({
          messages: ({
            context,
            event,
          }: { context: ChatContext; event: any }) => [
            ...context.messages,
            event && event.message
              ? event.message
              : {
                  id: `fallback-${Date.now()}`,
                  role: "system",
                  content: "Fallback message when event is undefined",
                  timestamp: new Date().toISOString(),
                },
          ],
        }),
        setTyping: assign({
          isTyping: (_, event: any) =>
            event && event.type === "SET_TYPING" ? event.value : true,
        }),
        setError: assign({
          error: (_, event: any) =>
            event && event.type === "ERROR"
              ? event.error
              : { message: "An unknown error occurred" },
        }),
        clearError: assign({
          error: null,
        }),
      },
    },
  );
};

// Simple hook to use our test chat machine
const useTestChatMachine = () => {
  const chatMachine = useMemo(() => createTestChatMachine(), []);
  const [state, send] = useMachine(chatMachine);

  // Convert the state value to a string for display
  const status = useMemo(() => {
    if (typeof state.value === "string") {
      return state.value;
    }
    return JSON.stringify(state.value);
  }, [state.value]);

  // Memoize the messages to prevent unnecessary re-renders
  const messages = useMemo(
    () => state.context.messages,
    [state.context.messages],
  );

  // Memoize the isTyping value
  const isTyping = useMemo(
    () => state.context.isTyping,
    [state.context.isTyping],
  );

  // Memoize the error value
  const error = useMemo(() => state.context.error, [state.context.error]);

  // Memoize the action functions
  const sendMessage = useCallback(
    (content: string) => {
      send({ type: "SEND", content });
    },
    [send],
  );

  const receiveMessage = useCallback(
    (message: any) => {
      send({ type: "RECEIVE", message });
    },
    [send],
  );

  const setTyping = useCallback(
    (value: boolean) => {
      send({ type: "SET_TYPING", value });
    },
    [send],
  );

  const setError = useCallback(
    (error: { message: string }) => {
      send({ type: "ERROR", error });
    },
    [send],
  );

  const clearError = useCallback(() => {
    send({ type: "CLEAR_ERROR" });
  }, [send]);

  return {
    state,
    status,
    messages,
    isTyping,
    error,
    sendMessage,
    receiveMessage,
    setTyping,
    setError,
    clearError,
  };
};

// The test component
const SimpleChatMachineTest: React.FC = () => {
  const [messageInput, setMessageInput] = useState("");
  const {
    status,
    messages,
    isTyping,
    error,
    sendMessage,
    receiveMessage,
    setTyping,
    setError,
    clearError,
  } = useTestChatMachine();

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      sendMessage(messageInput);
      setMessageInput("");
    }
  };

  const handleReceiveMessage = () => {
    receiveMessage({
      id: `manual-${Date.now()}`,
      role: "assistant",
      content: "This is a manually received message.",
      timestamp: new Date().toISOString(),
    });
  };

  const handleToggleTyping = () => {
    setTyping(!isTyping);
  };

  const handleSimulateError = () => {
    setError({
      message: "Simulated error at " + new Date().toLocaleTimeString(),
    });
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
      <h1>Simple Chat Machine Test</h1>

      <div style={{ marginBottom: "20px" }}>
        <h3>
          Current State: <code>{status}</code>
        </h3>
        {isTyping && <div style={{ color: "blue" }}>Typing...</div>}
        {error && (
          <div style={{ color: "red", padding: "10px", background: "#ffeeee" }}>
            Error: {error.message}
            <button onClick={clearError} style={{ marginLeft: "10px" }}>
              Clear
            </button>
          </div>
        )}
      </div>

      <div style={{ display: "flex", marginBottom: "20px" }}>
        <input
          type="text"
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          placeholder="Type a message..."
          style={{
            flex: 1,
            padding: "8px",
            marginRight: "10px",
            borderRadius: "4px",
            border: "1px solid #ccc",
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSendMessage();
          }}
        />
        <button onClick={handleSendMessage} style={{ padding: "8px 16px" }}>
          Send
        </button>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <button
          onClick={handleReceiveMessage}
          style={{ marginRight: "10px", padding: "8px 16px" }}
        >
          Simulate Receive
        </button>
        <button
          onClick={handleToggleTyping}
          style={{ marginRight: "10px", padding: "8px 16px" }}
        >
          Toggle Typing
        </button>
        <button onClick={handleSimulateError} style={{ padding: "8px 16px" }}>
          Simulate Error
        </button>
      </div>

      <div>
        <h3>Messages:</h3>
        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: "4px",
            height: "300px",
            overflowY: "auto",
            padding: "10px",
          }}
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                padding: "10px",
                margin: "5px 0",
                borderRadius: "4px",
                backgroundColor:
                  msg.role === "user"
                    ? "#e3f2fd"
                    : msg.role === "assistant"
                      ? "#f1f8e9"
                      : "#f5f5f5",
                marginLeft: msg.role === "user" ? "20px" : "0",
                marginRight: msg.role === "assistant" ? "20px" : "0",
              }}
            >
              <strong>{msg.role}</strong>
              <div>{msg.content}</div>
              <small style={{ color: "#666" }}>
                {new Date(msg.timestamp).toLocaleTimeString()}
              </small>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: "20px" }}>
        <h3>Debug Info:</h3>
        <pre
          style={{
            backgroundColor: "#f5f5f5",
            padding: "10px",
            borderRadius: "4px",
            overflowX: "auto",
            maxWidth: "100%",
          }}
        >
          {JSON.stringify(
            {
              status,
              isTyping,
              error,
              messageCount: messages.length,
            },
            null,
            2,
          )}
        </pre>
      </div>
    </div>
  );
};

export default SimpleChatMachineTest;
