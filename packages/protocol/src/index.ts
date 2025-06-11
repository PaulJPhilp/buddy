/**
 * @buddy/protocol - Shared communication protocol for Buddy chat application
 *
 * This package provides:
 * - Type-safe message definitions
 * - Message validation functions
 * - Factory functions for creating messages
 * - Utilities for WebSocket communication
 */

// Only export canonical protocol helpers and types
export * from "./WebSocketMessage";

// Type alias for backward compatibility
export type { WebSocketMessage as ProtocolMessage } from "./WebSocketMessage";

export const PROTOCOL_VERSION = "1.0.0";

export const MESSAGE_TYPES = {
  // Client messages
  USER_MESSAGE: "USER_MESSAGE",
  CONNECTION: "CONNECTION",

  // Server messages
  ACK: "ACK",
  LLM_RESPONSE: "LLM_RESPONSE",
  LLM_STREAM: "LLM_STREAM",
  THINKING: "THINKING",
  ERROR: "ERROR",
  WELCOME: "WELCOME",
} as const;

export const CONNECTION_STATES = {
  DISCONNECTED: "DISCONNECTED",
  CONNECTING: "CONNECTING",
  CONNECTED: "CONNECTED",
  RECONNECTING: "RECONNECTING",
  ERROR: "ERROR",
} as const;

export const ERROR_CODES = {
  // Connection errors
  CONNECTION_FAILED: "CONNECTION_FAILED",
  CONNECTION_LOST: "CONNECTION_LOST",
  CONNECTION_TIMEOUT: "CONNECTION_TIMEOUT",

  // Message errors
  INVALID_MESSAGE: "INVALID_MESSAGE",
  MESSAGE_TOO_LARGE: "MESSAGE_TOO_LARGE",
  UNSUPPORTED_MESSAGE_TYPE: "UNSUPPORTED_MESSAGE_TYPE",

  // Processing errors
  LLM_ERROR: "LLM_ERROR",
  PROCESSING_TIMEOUT: "PROCESSING_TIMEOUT",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",

  // Security errors
  UNSAFE_CONTENT: "UNSAFE_CONTENT",
  AUTHENTICATION_FAILED: "AUTHENTICATION_FAILED",
  AUTHORIZATION_FAILED: "AUTHORIZATION_FAILED",

  // Server errors
  INTERNAL_ERROR: "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
  MAINTENANCE_MODE: "MAINTENANCE_MODE",
} as const;
