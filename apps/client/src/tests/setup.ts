import "@testing-library/jest-dom";
import { vi } from "vitest";

// Use real WebSocket for tests (Node.js implementation)
import WebSocket from 'ws';

// Polyfill WebSocket for Node.js environment
global.WebSocket = WebSocket as any;

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