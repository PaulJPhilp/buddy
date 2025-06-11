import { Effect } from "effect"
import { describe, expect, it } from "vitest"
import { MessageType, createMessage, parseMessage } from "../src/WebSocketMessage"

const metadata = { processed: false, __tag: "Metadata" }

describe("WebSocketMessage Protocol Compliance", () => {
  it("should create and parse a valid COMMAND message", () => {
    const msg = createMessage(
      "COMMAND",
      { command: "test", data: {}, __tag: "CommandPayload" },
      metadata
    )
    const parsed = Effect.runSync(parseMessage(JSON.stringify(msg)))
    // Only check required fields, ignore undefined optionals
    expect(parsed).toMatchObject({
      ...msg,
      agentRuntimeId: "test-client",
      sequence: 0,
      metadata: expect.objectContaining({
        __tag: "Metadata",
        processed: false,
        persisted: false,
        priority: 0,
        sourceAgentRuntimeId: "test-client"
      })
    })
  })

  it("should return fallback message on invalid message type", () => {
    const invalid = { ...createMessage("COMMAND", { command: "test", data: {}, __tag: "CommandPayload" }, metadata), type: "INVALID" }
    const result = Effect.runSync(parseMessage(JSON.stringify(invalid)))
    expect(result.type).toBe("SYSTEM")
    expect(result.id).toBe("unknown-id")
    expect(result.agentRuntimeId).toBe("unknown-agent")
  })

  it("should return fallback message on missing required fields", () => {
    const invalid = { type: "COMMAND" }
    const result = Effect.runSync(parseMessage(JSON.stringify(invalid)))
    expect(result.type).toBe("SYSTEM")
    expect(result.id).toBe("unknown-id")
    expect(result.agentRuntimeId).toBe("unknown-agent")
  })

  it("should round-trip all canonical message types", () => {
    const types: MessageType[] = [
      "COMMAND", "EVENT", "QUERY", "RESPONSE", "ERROR", "STATE_CHANGE", "SYSTEM"
    ]
    for (const type of types) {
      const msg = createMessage(
        type,
        { command: "test", data: {}, __tag: "CommandPayload" },
        metadata
      )
      const parsed = Effect.runSync(parseMessage(JSON.stringify(msg)))
      expect(parsed).toMatchObject({
        ...msg,
        agentRuntimeId: "test-client",
        sequence: 0,
        metadata: expect.objectContaining({
          __tag: "Metadata",
          processed: false,
          persisted: false,
          priority: 0,
          sourceAgentRuntimeId: "test-client"
        })
      })
    }
  })

  // Add more tests for each payload type as protocol evolves
}) 