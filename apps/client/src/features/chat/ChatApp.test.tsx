import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChatApp } from "./ChatAppWithUseChatInstance";
import type { ChatAgentConfig } from "./types";

// Mock the useChatInstance hook
vi.mock("@/hooks/useChatInstance", () => ({
    useChatInstance: vi.fn(() => ({
        chatState: {
            chatId: "test-chat",
            messages: [
                {
                    id: "msg-1",
                    sender: "user",
                    text: "Hello",
                    timestamp: "2024-01-01T00:00:00Z",
                },
                {
                    id: "msg-2",
                    sender: "agent",
                    text: "Hi there!",
                    timestamp: "2024-01-01T00:01:00Z",
                },
            ],
            status: "connected",
            agentName: "Test Agent",
            isTyping: false,
        },
        runtimeError: null,
        dispatchAction: vi.fn(),
    })),
}));

describe("ChatApp", () => {
    const mockConfig: ChatAgentConfig = {
        agentId: "test-agent",
        agentWsUrl: "ws://localhost:3002",
        initialAgentName: "Test Agent",
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should render chat interface with messages", () => {
        render(
            <ChatApp
                chatId="test-chat"
                agentConfig={mockConfig}
            />
        );

        // Check if messages are displayed
        expect(screen.getByText("Hello")).toBeInTheDocument();
        expect(screen.getByText("Hi there!")).toBeInTheDocument();

        // Check if agent name is displayed
        expect(screen.getByText("Test Agent")).toBeInTheDocument();

        // Check if status is displayed
        expect(screen.getByText("Connected")).toBeInTheDocument();
    });

    it("should render input field and send button", () => {
        render(
            <ChatApp
                chatId="test-chat"
                agentConfig={mockConfig}
            />
        );

        const input = screen.getByPlaceholderText("Type your message...");
        const sendButton = screen.getByText("Send");

        expect(input).toBeInTheDocument();
        expect(sendButton).toBeInTheDocument();
    });

    it("should call dispatchAction when sending a message", async () => {
        const mockDispatchAction = vi.fn();

        // Override the mock for this test
        const { useChatInstance } = await import("@/hooks/useChatInstance");
        vi.mocked(useChatInstance).mockReturnValue({
            chatState: {
                chatId: "test-chat",
                messages: [],
                status: "connected",
                agentName: "Test Agent",
                isTyping: false,
            },
            runtimeError: null,
            dispatchAction: mockDispatchAction,
        });

        render(
            <ChatApp
                chatId="test-chat"
                agentConfig={mockConfig}
            />
        );

        const input = screen.getByPlaceholderText("Type your message...");
        const sendButton = screen.getByText("Send");

        // Type a message
        fireEvent.change(input, { target: { value: "Test message" } });

        // Click send
        fireEvent.click(sendButton);

        // Verify dispatchAction was called
        await waitFor(() => {
            expect(mockDispatchAction).toHaveBeenCalledWith({
                _tag: "sendMessage",
                text: "Test message",
            });
        });

        // Verify input is cleared
        expect(input).toHaveValue("");
    });

    it("should display connection status correctly", () => {
        const { useChatInstance } = require("@/hooks/useChatInstance");

        // Test different connection states
        const states = [
            { status: "initializing", expected: "Initializing..." },
            { status: "connecting", expected: "Connecting..." },
            { status: "connected", expected: "Connected" },
            { status: "disconnected", expected: "Disconnected" },
            { status: "error", expected: "Error" },
        ];

        states.forEach(({ status, expected }) => {
            vi.mocked(useChatInstance).mockReturnValue({
                chatState: {
                    chatId: "test-chat",
                    messages: [],
                    status: status as any,
                    agentName: "Test Agent",
                    isTyping: false,
                },
                runtimeError: null,
                dispatchAction: vi.fn(),
            });

            const { rerender } = render(
                <ChatApp
                    chatId="test-chat"
                    agentConfig={mockConfig}
                />
            );

            expect(screen.getByText(expected)).toBeInTheDocument();

            rerender(<div />); // Clean up for next iteration
        });
    });

    it("should display runtime error when present", () => {
        const { useChatInstance } = require("@/hooks/useChatInstance");

        vi.mocked(useChatInstance).mockReturnValue({
            chatState: {
                chatId: "test-chat",
                messages: [],
                status: "error",
                agentName: "Test Agent",
                isTyping: false,
            },
            runtimeError: "Connection failed",
            dispatchAction: vi.fn(),
        });

        render(
            <ChatApp
                chatId="test-chat"
                agentConfig={mockConfig}
            />
        );

        expect(screen.getByText("Error: Connection failed")).toBeInTheDocument();
    });

    it("should disable send button when not connected", () => {
        const { useChatInstance } = require("@/hooks/useChatInstance");

        vi.mocked(useChatInstance).mockReturnValue({
            chatState: {
                chatId: "test-chat",
                messages: [],
                status: "connecting",
                agentName: "Test Agent",
                isTyping: false,
            },
            runtimeError: null,
            dispatchAction: vi.fn(),
        });

        render(
            <ChatApp
                chatId="test-chat"
                agentConfig={mockConfig}
            />
        );

        const sendButton = screen.getByText("Send");
        expect(sendButton).toBeDisabled();
    });

    it("should show typing indicator when agent is typing", () => {
        const { useChatInstance } = require("@/hooks/useChatInstance");

        vi.mocked(useChatInstance).mockReturnValue({
            chatState: {
                chatId: "test-chat",
                messages: [],
                status: "connected",
                agentName: "Test Agent",
                isTyping: true,
            },
            runtimeError: null,
            dispatchAction: vi.fn(),
        });

        render(
            <ChatApp
                chatId="test-chat"
                agentConfig={mockConfig}
            />
        );

        expect(screen.getByText("Test Agent is typing...")).toBeInTheDocument();
    });
}); 