import { Schema } from "effect";
import { UIEvent } from "../../workspace/types";

// ---------------------------------------------------------------------------
// UIEvent runtime schema (for JSON validation on both server & client)
// ---------------------------------------------------------------------------

// Tab events ---------------------------------------------------------------
const TabAddedSchema = Schema.Struct({
  type: Schema.Literal("TAB_ADDED"),
  tabId: Schema.String,
  name: Schema.String,
  color: Schema.optional(Schema.String),
});

const TabActivatedSchema = Schema.Struct({
  type: Schema.Literal("TAB_ACTIVATED"),
  tabId: Schema.String,
});

const TabClosedSchema = Schema.Struct({
  type: Schema.Literal("TAB_CLOSED"),
  tabId: Schema.String,
});

// Chat-app events ----------------------------------------------------------
const ChatAppAddedSchema = Schema.Struct({
  type: Schema.Literal("CHAT_APP_ADDED"),
  tabId: Schema.String,
  appId: Schema.String,
});

const ChatAppExpandedSchema = Schema.Struct({
  type: Schema.Literal("CHAT_APP_EXPANDED"),
  tabId: Schema.String,
  appId: Schema.String,
});

const ChatAppCompactedSchema = Schema.Struct({
  type: Schema.Literal("CHAT_APP_COMPACTED"),
  tabId: Schema.String,
  appId: Schema.String,
});

const ChatAppClosedSchema = Schema.Struct({
  type: Schema.Literal("CHAT_APP_CLOSED"),
  tabId: Schema.String,
  appId: Schema.String,
});

export const UiEventPayloadSchema = Schema.Union(
  TabAddedSchema,
  TabActivatedSchema,
  TabClosedSchema,
  ChatAppAddedSchema,
  ChatAppExpandedSchema,
  ChatAppCompactedSchema,
  ChatAppClosedSchema,
);

export type UiEventPayload = Schema.Type<typeof UiEventPayloadSchema>;

// Type-level guarantee that our runtime schema matches compile-time type.
// If this assignment fails, a mismatch exists.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _assertUiEventAssignable: UIEvent extends UiEventPayload ? true : never =
  true;

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

export const decodeUiEventUnsafe =
  Schema.decodeUnknownSync(UiEventPayloadSchema);
export const encodeUiEvent = Schema.encodeSync(UiEventPayloadSchema);
