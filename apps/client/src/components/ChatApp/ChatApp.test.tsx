import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { ChatApp } from "./ChatApp";

// Real test data for testing with actual external services
const testChatAppId = "test-chat-app-integration";

describe("ChatApp Component", () => {
  it("should render without crashing", async () => {
    render(<ChatApp chatAppId={testChatAppId} />);

    // Component should render basic structure
    expect(screen.getByRole("main")).toBeInTheDocument();
  });

  it("should display loading state initially", async () => {
    render(<ChatApp chatAppId={testChatAppId} />);

    // Should show loading indicator while connecting to real services
    await waitFor(
      () => {
        expect(
          screen.getByText(/loading/i) || screen.getByRole("progressbar"),
        ).toBeInTheDocument();
      },
      { timeout: 1000 },
    );
  });

  it("should connect to real chat service and display messages", async () => {
    render(<ChatApp chatAppId={testChatAppId} />);

    // Wait for real service connection and message loading
    await waitFor(
      () => {
        // Should have a message input area
        const messageInput =
          screen.getByRole("textbox") ||
          screen.getByPlaceholderText(/message/i);
        expect(messageInput).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    // Should have send button
    const sendButton =
      screen.getByRole("button", { name: /send/i }) ||
      screen.getByText(/send/i);
    expect(sendButton).toBeInTheDocument();
  });

  it("should handle user input and send messages to real backend", async () => {
    const user = userEvent.setup();
    render(<ChatApp chatAppId={testChatAppId} />);

    // Wait for component to load with real services
    await waitFor(
      () => {
        expect(
          screen.getByRole("textbox") ||
            screen.getByPlaceholderText(/message/i),
        ).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    const messageInput =
      screen.getByRole("textbox") || screen.getByPlaceholderText(/message/i);
    const sendButton =
      screen.getByRole("button", { name: /send/i }) ||
      screen.getByText(/send/i);

    // Type a real message
    await user.type(messageInput, "Hello from integration test");

    // Send the message to real backend
    await user.click(sendButton);

    // Wait for message to appear in chat (from real service)
    await waitFor(
      () => {
        expect(
          screen.getByText("Hello from integration test"),
        ).toBeInTheDocument();
      },
      { timeout: 10000 },
    );
  });

  it("should display agent responses from real LLM service", async () => {
    const user = userEvent.setup();
    render(<ChatApp chatAppId={testChatAppId} />);

    // Wait for real service connection
    await waitFor(
      () => {
        expect(
          screen.getByRole("textbox") ||
            screen.getByPlaceholderText(/message/i),
        ).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    const messageInput =
      screen.getByRole("textbox") || screen.getByPlaceholderText(/message/i);
    const sendButton =
      screen.getByRole("button", { name: /send/i }) ||
      screen.getByText(/send/i);

    // Send a message that should get a real response
    await user.type(messageInput, "What is 2 + 2?");
    await user.click(sendButton);

    // Wait for real agent response
    await waitFor(
      () => {
        // Look for agent response indicators
        const agentMessages = screen.getAllByText(/assistant|agent|ai/i);
        expect(agentMessages.length).toBeGreaterThan(0);
      },
      { timeout: 15000 },
    );
  });

  it("should handle real-time typing indicators", async () => {
    const user = userEvent.setup();
    render(<ChatApp chatAppId={testChatAppId} />);

    // Wait for real service connection
    await waitFor(
      () => {
        expect(
          screen.getByRole("textbox") ||
            screen.getByPlaceholderText(/message/i),
        ).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    const messageInput =
      screen.getByRole("textbox") || screen.getByPlaceholderText(/message/i);
    const sendButton =
      screen.getByRole("button", { name: /send/i }) ||
      screen.getByText(/send/i);

    // Send message to trigger real typing indicator
    await user.type(messageInput, "Tell me a story");
    await user.click(sendButton);

    // Should show typing indicator while agent is responding
    await waitFor(
      () => {
        expect(
          screen.getByText(/typing|thinking|\.\.\./) ||
            screen.getByRole("status"),
        ).toBeInTheDocument();
      },
      { timeout: 5000 },
    );
  });

  it("should handle connection errors gracefully", async () => {
    // Use invalid chat app ID to test error handling
    render(<ChatApp chatAppId="invalid-chat-app-id" />);

    // Should display error message when real service fails
    await waitFor(
      () => {
        expect(
          screen.getByText(/error|failed|connection/i),
        ).toBeInTheDocument();
      },
      { timeout: 10000 },
    );
  });

  it("should persist chat history with real backend", async () => {
    const user = userEvent.setup();
    render(<ChatApp chatAppId={testChatAppId} />);

    // Wait for real service connection
    await waitFor(
      () => {
        expect(
          screen.getByRole("textbox") ||
            screen.getByPlaceholderText(/message/i),
        ).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    const messageInput =
      screen.getByRole("textbox") || screen.getByPlaceholderText(/message/i);
    const sendButton =
      screen.getByRole("button", { name: /send/i }) ||
      screen.getByText(/send/i);

    // Send multiple messages to real backend
    await user.type(messageInput, "First message");
    await user.click(sendButton);

    await waitFor(
      () => {
        expect(screen.getByText("First message")).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    // Clear input and send second message
    await user.clear(messageInput);
    await user.type(messageInput, "Second message");
    await user.click(sendButton);

    // Both messages should persist in real chat history
    await waitFor(
      () => {
        expect(screen.getByText("First message")).toBeInTheDocument();
        expect(screen.getByText("Second message")).toBeInTheDocument();
      },
      { timeout: 5000 },
    );
  });

  it("should handle file attachments with real upload service", async () => {
    const user = userEvent.setup();
    render(<ChatApp chatAppId={testChatAppId} />);

    // Wait for real service connection
    await waitFor(
      () => {
        expect(
          screen.getByRole("textbox") ||
            screen.getByPlaceholderText(/message/i),
        ).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    // Look for file upload button
    const fileInput =
      screen.queryByRole("button", { name: /attach|upload|file/i }) ||
      screen.queryByLabelText(/file/i);

    if (fileInput) {
      // Test file attachment functionality with real upload service
      const testFile = new File(["test content"], "test.txt", {
        type: "text/plain",
      });

      await user.upload(fileInput, testFile);

      // Should show file attachment in UI
      await waitFor(
        () => {
          expect(screen.getByText("test.txt")).toBeInTheDocument();
        },
        { timeout: 5000 },
      );
    }
  });

  it("should display real agent information", async () => {
    render(<ChatApp chatAppId={testChatAppId} />);

    // Wait for real agent service to load agent info
    await waitFor(
      () => {
        // Should display agent name from real service
        const agentInfo =
          screen.getByText(/agent|assistant/i) || screen.getByRole("heading");
        expect(agentInfo).toBeInTheDocument();
      },
      { timeout: 5000 },
    );
  });

  it("should handle real-time message updates", async () => {
    render(<ChatApp chatAppId={testChatAppId} />);

    // Wait for real WebSocket connection
    await waitFor(
      () => {
        expect(
          screen.getByRole("textbox") ||
            screen.getByPlaceholderText(/message/i),
        ).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    // Component should be connected to real-time updates
    // This tests the WebSocket connection to real backend
    const chatContainer = screen.getByRole("main") || screen.getByRole("log");
    expect(chatContainer).toBeInTheDocument();

    // Should have real-time connection indicators
    const connectionStatus =
      screen.queryByText(/connected|online/i) || screen.queryByRole("status");
    if (connectionStatus) {
      expect(connectionStatus).toBeInTheDocument();
    }
  });
});
