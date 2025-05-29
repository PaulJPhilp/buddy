import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock WebSocket globally for tests
global.WebSocket = class MockWebSocket {
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
    }

    send(data: string) {
        // Mock implementation
    }

    close() {
        this.readyState = MockWebSocket.CLOSED;
    }

    addEventListener(type: string, listener: EventListener) {
        // Mock implementation
    }

    removeEventListener(type: string, listener: EventListener) {
        // Mock implementation
    }
} as any;

// Mock console methods to reduce noise in tests
global.console = {
    ...console,
    log: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
};

// Mock nanoid for consistent test results
vi.mock("nanoid", () => ({
    nanoid: () => "test-id-123",
})); 