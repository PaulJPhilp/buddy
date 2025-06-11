# @buddy/protocol

## Canonical Protocol Source of Truth

This package provides the **single source of truth** for all WebSocket and message protocol types, helpers, and validation logic for the Buddy chat application.

### Canonical Protocol
- The canonical protocol is defined by the `WebSocketMessage` schema and related types/helpers from `llm-agent/src/schemas/WebSocketMessage.ts`.
- All new code (client and server) **must** use only the canonical types and helpers (e.g., `WebSocketMessage`, `Payload`, `createMessage`, `parseMessage`).
- These are re-exported from this package for convenience.

### Migration Plan
- **Legacy types and factories** (e.g., `UserMessage`, `LLMStreamMessage`, `createUserMessage`, `createWebSocketEnvelope`) are present for backward compatibility only.
- All new code should use the canonical protocol exclusively.
- Existing code should be gradually refactored to remove use of legacy types/factories.
- Once all code is migrated, legacy types and factories will be removed from this package.

### Usage
```typescript
import { createMessage, parseMessage, WebSocketMessage } from "@buddy/protocol";
```

### Protocol Version
- The protocol version is exported as `PROTOCOL_VERSION`.

### Contribution Guidelines
- All protocol changes must be made in the canonical schema and helpers.
- Do not add new legacy types or factories.
- Update this documentation if the protocol evolves. 