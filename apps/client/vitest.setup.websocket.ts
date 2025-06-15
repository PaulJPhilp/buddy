import { vi } from "vitest";
import { WebSocket, WebSocketServer } from "ws";

// Provide WebSocket implementation for Node environment
vi.stubGlobal("WebSocket", WebSocket);
vi.stubGlobal("WebSocketServer", WebSocketServer);
