// Shared types for ChatApp components

export interface ChatMessage {
  id: string;
  text: string;
  sender: "user" | "assistant";
  timestamp: string; // ISO string
}
