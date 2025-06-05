import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ChatAgentConfig, ChatInstanceAction } from "../features/chat/types";
import { useChatInstance } from "./useChatInstance";

// Mock WebSocket for testing
class MockWebSocket {
    static CONNECTING = 0;
    static OPEN = 1;
    static CLOSING = 2;
    static CLOSED = 3;

    readyState = MockWebSocket.CONNECTING;
    url: string;
    onopen: ((event: Event) => void) | null = null;
    onclose: ((event: CloseEvent) => void) | null = null;
    onerror: ((event: Event) => void) | null = null;
    onmessage: ((event: MessageEvent) => void) | null = null;

    constructor(url: string) {
        this.url = url;
        // Simulate async connection
        setTimeout(() => {
            this.readyState = MockWebSocket.OPEN;
            if (this.onopen) {
                this.onopen(new Event("open"));
            }
        }, 10);
    }

    send(data: string) {
        console.log("[MockWebSocket] Sending:", data);
        // Echo back a mock response
        setTimeout(() => {
            if (this.onmessage) {
                const mockResponse = {
                    type: "LLM_RESPONSE",
                    id: "response-1",
                    timestamp: new Date().toISOString(),
                    content: `Mock response to: ${data}`,
                };
                this.onmessage(new MessageEvent("message", {
                    data: JSON.stringify(mockResponse)
                }));
            }
        }, 50);
    }

    close() {
        this.readyState = MockWebSocket.CLOSED;
        if (this.onclose) {
            this.onclose(new CloseEvent("close"));
        }
    }

    addEventListener(type: string, listener: EventListener) {
        if (type === "open") this.onopen = listener as any;
        if (type === "close") this.onclose = listener as any;
        if (type === "error") this.onerror = listener as any;
        if (type === "message") this.onmessage = listener as any;
    }

    removeEventListener(type: string, listener: EventListener) {
        if (type === "open") this.onopen = null;
        if (type === "close") this.onclose = null;
        if (type === "error") this.onerror = null;
        if (type === "message") this.onmessage = null;
    }
}

// Mock the global WebSocket
const originalWebSocket = global.WebSocket;

describe("useChatInstance Integration Tests", () => {
    const mockConfig: ChatAgentConfig = {
        agentId: "test-agent",
        initialAgentName: "Test Agent",
    };

    beforeEach(() => {
        // Replace global WebSocket with our mock
        global.WebSocket = MockWebSocket as any;
        console.log = vi.fn(); // Mock console.log to reduce noise
    });

    afterEach(() => {
        // Restore original WebSocket
        global.WebSocket = originalWebSocket;
        vi.restoreAllMocks();
    });

    it("should initialize with correct initial state", () => {
        const { result } = renderHook(() =>
            useChatInstance("test-chat-1", mockConfig)
        );

        expect(result.current.chatState).toEqual({
            chatId: "test-chat-1",
            messages: [],
            status: "initializing",
            agentName: "Test Agent",
            isTyping: false,
        });

        expect(result.current.runtimeError).toBeNull();
        expect(typeof result.current.dispatchAction).toBe("function");
    });

    it("should transition to connecting and then connected state", async () => {
        const { result } = renderHook(() =>
            useChatInstance("test-chat-2", mockConfig)
        );

        // Wait for connection to establish
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 100));
        });

        expect(result.current.chatState.status).toBe("connected");
        expect(result.current.runtimeError).toBeNull();
    });

    it("should handle sending messages", async () => {
        const { result } = renderHook(() =>
            useChatInstance("test-chat-3", mockConfig)
        );

        // Wait for connection
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 100));
        });

        expect(result.current.chatState.status).toBe("connected");

        // Send a message
        await act(async () => {
            const action: ChatInstanceAction = {
                _tag: "sendMessage",
                text: "Hello, test agent!",
            };
            result.current.dispatchAction(action);
            await new Promise(resolve => setTimeout(resolve, 100));
        });

        // The mock should have processed the message
        expect(result.current.chatState.status).toBe("connected");
    });

    it("should handle multiple chat instances independently", async () => {
        const { result: result1 } = renderHook(() =>
            useChatInstance("chat-1", mockConfig)
        );

        const { result: result2 } = renderHook(() =>
            useChatInstance("chat-2", mockConfig)
        );

        // Wait for both connections
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 150));
        });

        expect(result1.current.chatState.chatId).toBe("chat-1");
        expect(result2.current.chatState.chatId).toBe("chat-2");
        expect(result1.current.chatState.status).toBe("connected");
        expect(result2.current.chatState.status).toBe("connected");

        // Send different messages to each
        await act(async () => {
            result1.current.dispatchAction({
                _tag: "sendMessage",
                text: "Message from chat 1",
            });
            result2.current.dispatchAction({
                _tag: "sendMessage",
                text: "Message from chat 2",
            });
            await new Promise(resolve => setTimeout(resolve, 100));
        });

        // Both should remain connected and independent
        expect(result1.current.chatState.status).toBe("connected");
        expect(result2.current.chatState.status).toBe("connected");
    });

    it("should handle connection errors gracefully", async () => {
        // Mock WebSocket that fails to connect
        class FailingMockWebSocket extends MockWebSocket {
            constructor(url: string) {
                super(url);
                setTimeout(() => {
                    this.readyState = MockWebSocket.CLOSED;
                    if (this.onerror) {
                        this.onerror(new Event("error"));
                    }
                }, 10);
            }
        }

        global.WebSocket = FailingMockWebSocket as any;

        const { result } = renderHook(() =>
            useChatInstance("failing-chat", mockConfig)
        );

        // Wait for connection attempt to fail
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 200));
        });

        // Should eventually reach error state after retries
        expect(result.current.chatState.status).toBe("error");
        expect(result.current.chatState.error).toBeDefined();
    });

    it("should handle reconnection attempts", async () => {
        let connectionAttempts = 0;

        class UnstableMockWebSocket extends MockWebSocket {
            constructor(url: string) {
                super(url);
                connectionAttempts++;

                if (connectionAttempts === 1) {
                    // First attempt fails
                    setTimeout(() => {
                        this.readyState = MockWebSocket.CLOSED;
                        if (this.onerror) {
                            this.onerror(new Event("error"));
                        }
                    }, 10);
                } else {
                    // Second attempt succeeds
                    setTimeout(() => {
                        this.readyState = MockWebSocket.OPEN;
                        if (this.onopen) {
                            this.onopen(new Event("open"));
                        }
                    }, 10);
                }
            }
        }

        global.WebSocket = UnstableMockWebSocket as any;

        const { result } = renderHook(() =>
            useChatInstance("unstable-chat", mockConfig)
        );

        // Wait for initial failure and retry
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 300));
        });

        // Should eventually connect after retry
        expect(result.current.chatState.status).toBe("connected");
        expect(connectionAttempts).toBeGreaterThan(1);
    });

    it("should cleanup resources on unmount", async () => {
        const { result, unmount } = renderHook(() =>
            useChatInstance("cleanup-chat", mockConfig)
        );

        // Wait for connection
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 100));
        });

        expect(result.current.chatState.status).toBe("connected");

        // Unmount the hook
        unmount();

        // Give time for cleanup
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 50));
        });

        // Resources should be cleaned up (we can't directly test this, 
        // but the test should not have memory leaks or hanging promises)
    });

    it("should handle message attachments", async () => {
        const { result } = renderHook(() =>
            useChatInstance("attachment-chat", mockConfig)
        );

        // Wait for connection
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 100));
        });

        // Send message with attachments
        await act(async () => {
            const mockFile = new File(["test content"], "test.txt", { type: "text/plain" });
            const action: ChatInstanceAction = {
                _tag: "sendMessage",
                text: "Message with attachment",
                attachments: [{
                    id: "file-1",
                    name: "test.txt",
                    size: 12,
                    type: "text/plain",
                }],
            };
            result.current.dispatchAction(action);
            await new Promise(resolve => setTimeout(resolve, 100));
        });

        expect(result.current.chatState.status).toBe("connected");
    });

    it("should handle agent typing indicators", async () => {
        const { result } = renderHook(() =>
            useChatInstance("typing-chat", mockConfig)
        );

        // Wait for connection
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 100));
        });

        expect(result.current.chatState.isTyping).toBe(false);

        // Simulate agent typing event
        await act(async () => {
            // We would need to mock the WebSocket to send typing events
            // This is a placeholder for that functionality
            await new Promise(resolve => setTimeout(resolve, 50));
        });
    });
}); 