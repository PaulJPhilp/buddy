import { describe, expect, it } from "vitest";
import { UIEvent } from "../../../workspace/types";
import { decodeUiEventUnsafe, encodeUiEvent } from "../schema";

const sampleEvents: UIEvent[] = [
  { type: "TAB_ADDED", tabId: "t1", name: "Tab", color: "#00ff00" },
  { type: "TAB_ACTIVATED", tabId: "t1" },
  { type: "CHAT_APP_ADDED", tabId: "t1", appId: "a1" },
  { type: "CHAT_APP_EXPANDED", tabId: "t1", appId: "a1" },
  { type: "CHAT_APP_COMPACTED", tabId: "t1", appId: "a1" },
  { type: "CHAT_APP_CLOSED", tabId: "t1", appId: "a1" },
  { type: "TAB_CLOSED", tabId: "t1" },
];

describe("UiEventPayloadSchema", () => {
  it("round-trips encode / decode for all sample events", () => {
    for (const evt of sampleEvents) {
      const encoded = encodeUiEvent(evt);
      const decoded = decodeUiEventUnsafe(encoded);
      expect(decoded).toEqual(evt);
    }
  });
});
