import { Effect, Layer } from "effect";
import * as React from "react";

// Placeholder for the ChatView component
// We'll create this component next
const ChatView = () => {
  // Remove style and use plain text node for now to avoid parse errors
  return React.createElement("div", null, "Chat messages will appear here...");
};

type UIElement = React.ReactElement;

// Placeholder: Define how chat history is accessed
// This would likely involve a service providing a Stream or Ref
const getChatHistory = Effect.sync(() => [
  // Replace with actual history stream/state access
  { id: "1", sender: "user", text: "Hello Agent" },
  { id: "2", sender: "agent", text: "Hello User" },
]);
