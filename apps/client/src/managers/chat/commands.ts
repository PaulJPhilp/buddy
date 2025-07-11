import { Schema as S } from "effect";
import type { AgentId, ConversationId, MessageId, MessageState } from "./types";

// --- State Commands ---

/**
 * Command to set the chat manager state.
 * Updates the state with the provided partial state.
 */
export class SetChatState extends S.Class<SetChatState>("SetChatState")({
  _tag: S.Literal("SetChatState"),
  updates: S.Record({ key: S.String, value: S.Unknown }),
}) {}

/**
 * Command to reset the chat manager state.
 * Clears all conversations, messages, and resets to initial state.
 */
export class ResetChatState extends S.Class<ResetChatState>("ResetChatState")({
  _tag: S.Literal("ResetChatState"),
}) {}

// --- Conversation Commands ---

/**
 * Command to start a new conversation.
 * Requires an agent ID and optionally takes a title.
 */
export class StartConversation extends S.Class<StartConversation>(
  "StartConversation"
)({
  _tag: S.Literal("StartConversation"),
  conversationId: S.String,
  agentId: S.String,
  title: S.optional(S.String),
}) {}

/**
 * Command to end an existing conversation.
 * Requires the conversation ID.
 */
export class EndConversation extends S.Class<EndConversation>(
  "EndConversation"
)({
  _tag: S.Literal("EndConversation"),
  conversationId: S.String,
}) {}

/**
 * Command to set the active conversation.
 * Takes a conversation ID or null to clear the active conversation.
 */
export class SetActiveConversation extends S.Class<SetActiveConversation>(
  "SetActiveConversation"
)({
  _tag: S.Literal("SetActiveConversation"),
  conversationId: S.NullOr(S.String),
}) {}

/**
 * Command to clear conversation history.
 * Removes all messages from the specified conversation.
 */
export class ClearConversationHistory extends S.Class<ClearConversationHistory>(
  "ClearConversationHistory"
)({
  _tag: S.Literal("ClearConversationHistory"),
  conversationId: S.String,
}) {}

// --- Message Commands ---

/**
 * Command to send a message to a conversation.
 * Requires conversation ID and message content.
 */
export class SendMessage extends S.Class<SendMessage>("SendMessage")({
  _tag: S.Literal("SendMessage"),
  messageId: S.String,
  conversationId: S.String,
  content: S.String,
  agentId: S.optional(S.String),
  parentMessageId: S.optional(S.String),
}) {}

/**
 * Command to update an existing message.
 * Requires message ID and the updates to apply.
 */
export class UpdateMessage extends S.Class<UpdateMessage>("UpdateMessage")({
  _tag: S.Literal("UpdateMessage"),
  messageId: S.String,
  updates: S.Struct({
    content: S.optional(S.String),
    status: S.optional(S.Literal("sending", "sent", "failed", "delivered")),
    metadata: S.optional(S.Record({ key: S.String, value: S.Unknown })),
  }),
}) {}

/**
 * Command to delete a message.
 * Requires the message ID.
 */
export class DeleteMessage extends S.Class<DeleteMessage>("DeleteMessage")({
  _tag: S.Literal("DeleteMessage"),
  messageId: S.String,
}) {}

// --- Agent Commands ---

/**
 * Command to set the agent for a conversation.
 * Requires conversation ID and agent ID.
 */
export class SetConversationAgent extends S.Class<SetConversationAgent>(
  "SetConversationAgent"
)({
  _tag: S.Literal("SetConversationAgent"),
  conversationId: S.String,
  agentId: S.String,
}) {}

// --- Operation Commands ---

/**
 * Command to execute a chat operation.
 * Takes an operation object with type and parameters.
 */
export class ExecuteChatOperation extends S.Class<ExecuteChatOperation>(
  "ExecuteChatOperation"
)({
  _tag: S.Literal("ExecuteChatOperation"),
  operation: S.Struct({
    type: S.Literal(
      "start_conversation",
      "end_conversation",
      "send_message",
      "delete_message",
      "edit_message",
      "search_conversations",
      "search_messages",
      "export_conversation",
      "clear_history",
      "set_agent",
      "archive_conversation",
      "restore_conversation",
      "custom_operation"
    ),
    timestamp: S.Date,
    conversationId: S.optional(S.String),
    messageId: S.optional(S.String),
    agentId: S.optional(S.String),
    parameters: S.optional(S.Record({ key: S.String, value: S.Unknown })),
  }),
}) {}

// --- Search Commands ---

/**
 * Command to search conversations.
 * Requires a search query string.
 */
export class SearchConversations extends S.Class<SearchConversations>(
  "SearchConversations"
)({
  _tag: S.Literal("SearchConversations"),
  query: S.String,
}) {}

/**
 * Command to search messages within a conversation.
 * Requires conversation ID and search query.
 */
export class SearchMessages extends S.Class<SearchMessages>("SearchMessages")({
  _tag: S.Literal("SearchMessages"),
  conversationId: S.String,
  query: S.String,
}) {}

// --- Export Commands ---

/**
 * Command to export a conversation.
 * Requires the conversation ID and optionally takes export format.
 */
export class ExportConversation extends S.Class<ExportConversation>(
  "ExportConversation"
)({
  _tag: S.Literal("ExportConversation"),
  conversationId: S.String,
  format: S.optional(S.Literal("json", "markdown", "text")),
  includeMetadata: S.optional(S.Boolean),
}) {}

/**
 * A union type representing all possible commands for the Chat domain.
 * This is useful for the CommandBus and handlers to perform type narrowing.
 */
export type ChatCommand =
  | SetChatState
  | ResetChatState
  | StartConversation
  | EndConversation
  | SetActiveConversation
  | ClearConversationHistory
  | SendMessage
  | UpdateMessage
  | DeleteMessage
  | SetConversationAgent
  | ExecuteChatOperation
  | SearchConversations
  | SearchMessages
  | ExportConversation;
